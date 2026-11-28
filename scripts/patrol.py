#!/usr/bin/env python3
"""Weekly patrol: is each network still running, and did anything change?

For every chain in data/chains.json this reads
  - the latest block (height and timestamp) from the endpoint listed under `network.probe`,
  - the latest release, the commit count of the last 90 days and the last commit of `code.repo`,
  - the state of the proposals and issues listed under `watch`,
derives the network status with the thresholds in docs/stages.md, and writes data/network.json.
When something changed since the previous data/network.json, it also writes
data/changes/<date>.json with one sentence per change, in English and Chinese.

Stages are never changed here. A person reads the patrol pull request and decides.

    python3 scripts/patrol.py                # everything
    python3 scripts/patrol.py --only bitcoin,qrl --dry-run
"""
import argparse
import json
import os
import re
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

from embeds import DATA_LICENSE

ROOT = Path(__file__).resolve().parents[1]
UA = 'post-quantum-blockchains-patrol/1.0 (+https://github.com/Balance0014/post-quantum-blockchains)'
# A block counts as recent if it is younger than STALL_MIN_MINUTES or STALL_MULTIPLE target block times,
# whichever is longer. docs/stages.md explains why.
STALL_MIN_MINUTES = 10
STALL_MULTIPLE = 6
WINDOW_DAYS = 90
# Public endpoints often sit behind load balancers, and a lagging backend can answer with an old block. Each probe is
# read at least twice, a few seconds apart, and a third time when the two reads disagree; the highest block wins.
READS_MIN, READS_MAX, READ_GAP_S = 2, 3, 3

CTX = ssl.create_default_context()
if os.path.exists('/etc/ssl/cert.pem'):  # macOS Python ships without a CA bundle
    CTX.load_verify_locations('/etc/ssl/cert.pem')


def now_utc():
    return datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ')


def http(url, method='GET', body=None, headers=None, timeout=20, tries=3):
    data = None
    h = {'User-Agent': UA, 'Accept': 'application/json, text/plain, */*'}
    if body is not None:
        data = json.dumps(body).encode()
        h['Content-Type'] = 'application/json'
    h.update(headers or {})
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=h, method=method)
            with urllib.request.urlopen(req, context=CTX, timeout=timeout) as r:
                return r.read().decode('utf-8', 'replace'), dict(r.headers)
        except (urllib.error.URLError, OSError, ValueError) as e:  # HTTPError is a URLError
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f'{type(last).__name__}: {last}')


# ---------- latest block ----------

PRESETS = {
    # Ethereum-compatible JSON-RPC
    'evm': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'eth_getBlockByNumber', 'params': ['latest', False]},
                                 'extract': {'height': 'result.number', 'time': 'result.timestamp'}}], 'height_fmt': 'hex', 'time_fmt': 'hex_s'},
    'esplora': lambda u: {'steps': [{'url': u + '/blocks/tip/hash', 'extract': {'hash': ''}},
                                    {'url': u + '/block/{hash}', 'extract': {'height': 'height', 'time': 'timestamp'}}], 'time_fmt': 's'},
    'cometbft': lambda u: {'steps': [{'url': u + '/status', 'extract': {'height': 'result.sync_info.latest_block_height', 'time': 'result.sync_info.latest_block_time'}}], 'time_fmt': 'iso'},
    'cosmos-rest': lambda u: {'steps': [{'url': u + '/cosmos/base/tendermint/v1beta1/blocks/latest', 'extract': {'height': 'block.header.height', 'time': 'block.header.time'}}], 'time_fmt': 'iso'},
    'solana': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'getSlot', 'params': [{'commitment': 'finalized'}]}, 'extract': {'height': 'result'}},
                                   {'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'getBlockTime', 'params': ['{height:int}']}, 'extract': {'time': 'result'}}], 'time_fmt': 's'},
    'tron': lambda u: {'steps': [{'url': u + '/wallet/getnowblock', 'method': 'POST', 'body': {}, 'extract': {'height': 'block_header.raw_data.number', 'time': 'block_header.raw_data.timestamp'}}], 'time_fmt': 'ms'},
    'xrpl': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'method': 'ledger', 'params': [{'ledger_index': 'validated'}]},
                                  'extract': {'height': 'result.ledger.ledger_index', 'time': 'result.ledger.close_time'}}], 'time_fmt': 'ripple'},
    'horizon': lambda u: {'steps': [{'url': u + '/ledgers?order=desc&limit=1', 'extract': {'height': '_embedded.records.0.sequence', 'time': '_embedded.records.0.closed_at'}}], 'time_fmt': 'iso'},
    'algod': lambda u: {'steps': [{'url': u + '/v2/status', 'extract': {'height': 'last-round'}},
                                  {'url': u + '/v2/blocks/{height}?format=json', 'extract': {'time': 'block.ts'}}], 'time_fmt': 's'},
    'near': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'block', 'params': {'finality': 'final'}},
                                  'extract': {'height': 'result.header.height', 'time': 'result.header.timestamp_nanosec'}}], 'time_fmt': 'ns'},
    'sui': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'sui_getLatestCheckpointSequenceNumber', 'params': []}, 'extract': {'height': 'result'}},
                                {'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'sui_getCheckpoint', 'params': ['{height}']}, 'extract': {'time': 'result.timestampMs'}}], 'time_fmt': 'ms'},
    'starknet': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'starknet_getBlockWithTxHashes', 'params': ['latest']},
                                      'extract': {'height': 'result.block_number', 'time': 'result.timestamp'}}], 'time_fmt': 's'},
    'ckb': lambda u: {'steps': [{'url': u, 'method': 'POST', 'body': {'jsonrpc': '2.0', 'id': 1, 'method': 'get_tip_header', 'params': []},
                                 'extract': {'height': 'result.number', 'time': 'result.timestamp'}}], 'height_fmt': 'hex', 'time_fmt': 'hex_ms'},
    'blockchair': lambda u: {'steps': [{'url': u, 'extract': {'height': 'data.best_block_height', 'time': 'data.best_block_time'}}], 'time_fmt': 'iso_space'},
}


def pick(obj, path, raw):
    """Read a dotted path from parsed JSON. '' returns the raw text; 're:<regex>' searches the raw text."""
    if path == '':
        return raw.strip().strip('"')
    if path.startswith('re:'):
        m = re.search(path[3:], raw)
        if not m:
            raise KeyError(path)
        return m.group(1)
    cur = obj
    for part in path.split('.'):
        if isinstance(cur, list):
            cur = cur[int(part)]
        else:
            cur = cur[part]
    return cur


def fill(template, values):
    """Substitute {name} or {name:int} placeholders in a URL or JSON body."""
    if isinstance(template, str):
        m = re.fullmatch(r'\{(\w+)(?::int)?\}', template)
        if m and m.group(1) in values:
            return int(values[m.group(1)]) if template.endswith(':int}') else str(values[m.group(1)])
        return re.sub(r'\{(\w+)\}', lambda x: str(values.get(x.group(1), x.group(0))), template)
    if isinstance(template, list):
        return [fill(v, values) for v in template]
    if isinstance(template, dict):
        return {k: fill(v, values) for k, v in template.items()}
    return template


def parse_time(v, fmt):
    if fmt == 'iso':
        s = str(v).replace('Z', '+00:00')
        s = re.sub(r'(\.\d{6})\d+', r'\1', s)  # nanosecond timestamps
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    if fmt == 'iso_space':  # "2026-11-27 11:40:12", UTC
        return datetime.strptime(str(v), '%Y-%m-%d %H:%M:%S').replace(tzinfo=timezone.utc)
    n = {'s': lambda x: float(x), 'ms': lambda x: float(x) / 1e3, 'ns': lambda x: float(x) / 1e9,
         'hex_s': lambda x: int(x, 16), 'hex_ms': lambda x: int(x, 16) / 1e3,
         'ripple': lambda x: float(x) + 946684800}[fmt](v)
    return datetime.fromtimestamp(n, timezone.utc)


def latest_block(probe):
    spec = PRESETS[probe['preset']](probe['url'].rstrip('/')) if 'preset' in probe else probe
    values = {}
    for step in spec['steps']:
        url = fill(step['url'], values)
        raw, _ = http(url, step.get('method', 'GET'), fill(step.get('body'), values) if 'body' in step else None, probe.get('headers'))
        try:
            obj = json.loads(raw)
        except ValueError:
            obj = None
        for key, path in step['extract'].items():
            values[key] = pick(obj, path, raw)
    h = values['height']
    height = int(h, 16) if spec.get('height_fmt') == 'hex' else int(float(h))
    return height, parse_time(values['time'], spec.get('time_fmt', 's'))


def read_probe(probe):
    """Read the newest block READS_MIN to READS_MAX times and keep the highest. Returns the block, the time of the read
    that returned it, and every height seen, so a lagging backend shows up in network.json."""
    reads, err = [], None
    for i in range(READS_MAX):
        if i:
            time.sleep(READ_GAP_S)
        try:
            h, t = latest_block(probe)
            reads.append((h, t, now_utc()))
        except Exception as e:  # one failed read is not a failed probe while another read answers
            err = e
        if len(reads) >= READS_MIN and reads[-1][0] == reads[-2][0]:
            break
    if not reads:
        raise err
    h, t, q = max(reads, key=lambda r: (r[0], r[1]))
    return {'ok': True, 'height': h, 'time_utc': iso(t), 'queried_at_utc': iso(q),
            'age_minutes': round(max(0.0, (q - t).total_seconds() / 60), 1), 'source': probe['url'],
            'reads': len(reads), 'heights_seen': sorted({r[0] for r in reads})}


def threshold_minutes(chain):
    interval = chain['network'].get('block_interval_s') or 0
    return max(STALL_MIN_MINUTES, round(STALL_MULTIPLE * interval / 60))


# ---------- GitHub ----------

def gh_token():
    tok = os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN')
    if tok:
        return tok
    try:
        return subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, timeout=10).stdout.strip() or None
    except (OSError, subprocess.SubprocessError):
        return None


TOKEN = None


def gh(path):
    headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    if TOKEN:
        headers['Authorization'] = f'Bearer {TOKEN}'
    raw, hdr = http('https://api.github.com/' + path.lstrip('/'), headers=headers)
    return json.loads(raw), hdr


COMMIT_PAGES_MAX = 30  # 3,000 commits in 90 days is more than any tracked repository makes


def is_bot(c):
    """GitHub App and bot accounts (dependabot[bot], github-actions[bot] and so on) are not people maintaining the code."""
    login = ((c.get('author') or {}).get('login') or '').lower()
    name = ((c.get('commit') or {}).get('author') or {}).get('name', '').lower()
    return login.endswith('[bot]') or name.endswith('[bot]')


def count_commits(repo, since):
    """Commits on the default branch since the date, leaving out commits by bot accounts. Returns (people, bots)."""
    people = bots = 0
    for page in range(1, COMMIT_PAGES_MAX + 1):
        items, _ = gh(f'repos/{repo}/commits?since={since}&per_page=100&page={page}')
        for c in items:
            if is_bot(c):
                bots += 1
            else:
                people += 1
        if len(items) < 100:
            break
    return people, bots


def code_activity(repo, since):
    out = {'repo': repo}
    rels, _ = gh(f'repos/{repo}/releases?per_page=10')
    rels = [r for r in rels if not r.get('draft')]
    if rels:
        r = max(rels, key=lambda r: r.get('published_at') or r.get('created_at') or '')
        out.update(release=r['tag_name'], release_date=(r.get('published_at') or r['created_at'])[:10], prerelease=bool(r.get('prerelease')))
    else:
        tags, _ = gh(f'repos/{repo}/tags?per_page=1')
        if tags:
            c, _ = gh(f"repos/{repo}/commits/{tags[0]['commit']['sha']}")
            out.update(release=tags[0]['name'], release_date=c['commit']['committer']['date'][:10], tag_only=True)
    info, _ = gh(f'repos/{repo}')
    out['branch'] = info.get('default_branch')
    out['commits_90d'], out['bot_commits_90d'] = count_commits(repo, since)
    out['queried_at_utc'] = iso(datetime.now(timezone.utc))
    last, _ = gh(f'repos/{repo}/commits?per_page=1')
    if last:
        out['last_commit'] = last[0]['commit']['committer']['date'][:10]
    return out


def watch_state(w):
    """Return (state, comments) for a watched pull request, issue or proposal file."""
    if w['type'] == 'pr':
        pr, _ = gh(f"repos/{w['repo']}/pulls/{w['number']}")
        return ('merged' if pr.get('merged_at') else pr['state']), pr.get('comments', 0) + pr.get('review_comments', 0)
    if w['type'] == 'issue':
        it, _ = gh(f"repos/{w['repo']}/issues/{w['number']}")
        return it['state'], it['comments']
    if w['type'] == 'file':
        raw, _ = http(f"https://raw.githubusercontent.com/{w['repo']}/{w.get('ref', 'HEAD')}/{w['path']}")
        m = re.search(w['pattern'], raw, re.I | re.M)
        return (m.group(1).strip() if m else 'not found'), None
    raise ValueError(w['type'])


# ---------- status and changes ----------

def status(entry):
    """Running when any source shows a recent block. Stopped only when the chain's endpoint and an independent explorer
    (network.check) both show an old block; one source alone is never enough to call a chain stopped."""
    reads = [r for r in (entry.get('block') or {}, entry.get('check') or {}) if r.get('ok')]
    if not reads:
        return 'unknown'
    if all(r['age_minutes'] > entry['threshold_min'] for r in reads):
        return 'stalled' if len(reads) == 2 else 'unknown'
    code = entry.get('code') or {}
    if code.get('commits_90d') == 0:
        return 'quiet'
    return 'ok'


STATE_ZH = {'open': '开放', 'closed': '已关闭', 'merged': '已合并', 'draft': '草案', 'review': '审核中', 'last call': '最后征求意见',
            'final': '定稿', 'stagnant': '停滞', 'withdrawn': '已撤回', 'living': '持续更新', 'complete': '已完成', 'deployed': '已部署',
            'proposed': '已提议', 'not found': '找不到'}


def zh_state(s):
    return STATE_ZH.get(str(s).lower(), s)


STATUS_TEXT = {
    'ok': ('running', '运行中'),
    'quiet': ('producing blocks, no code commits in 90 days', '在出块，代码 90 天无提交'),
    'stalled': ('no recent block', '出块停了'),
    'unknown': ('could not be checked', '无法核实'),
}


def changes(chains, old, new, today):
    items = []
    names = {c['id']: c['name'] for c in chains}
    for cid, n in new['chains'].items():
        o = (old or {}).get('chains', {}).get(cid)
        if not o:
            continue
        oc, nc = o.get('code') or {}, n.get('code') or {}
        if nc.get('release') and nc.get('release') != oc.get('release'):
            items.append({'date': nc.get('release_date') or today, 'chain': cid, 'type': 'code', 'stage': None,
                          'en': f"{names[cid]}: {nc['repo']} published {nc['release']}{' (pre-release)' if nc.get('prerelease') else ''}.",
                          'zh': f"{names[cid]}：{nc['repo']} 发布 {nc['release']}{'（预发布）' if nc.get('prerelease') else ''}。",
                          'url': f"https://github.com/{nc['repo']}/releases"})
        if o.get('status') != n.get('status'):
            a, b = STATUS_TEXT[o.get('status', 'unknown')], STATUS_TEXT[n['status']]
            items.append({'date': today, 'chain': cid, 'type': 'network', 'stage': None,
                          'en': f"{names[cid]}: network status changed from “{a[0]}” to “{b[0]}”.",
                          'zh': f"{names[cid]}：网络状态由「{a[1]}」变为「{b[1]}」。", 'url': None})
        for key, w in (n.get('watch') or {}).items():
            ow = (o.get('watch') or {}).get(key)
            if not ow or str(w['state']).startswith('error') or str(ow['state']).startswith('error'):
                continue
            if ow['state'] != w['state']:
                items.append({'date': today, 'chain': cid, 'type': 'proposal', 'stage': None,
                              'en': f"{names[cid]}: {w['label']} changed from “{ow['state']}” to “{w['state']}”.",
                              'zh': f"{names[cid]}：{w['label']} 由「{zh_state(ow['state'])}」变为「{zh_state(w['state'])}」。", 'url': w['url']})
            elif (w.get('comments') or 0) > (ow.get('comments') or 0):
                k = w['comments'] - ow['comments']
                items.append({'date': today, 'chain': cid, 'type': 'proposal', 'stage': None,
                              'en': f"{names[cid]}: {k} new comment{'s' if k > 1 else ''} on {w['label']}.",
                              'zh': f"{names[cid]}：{w['label']} 新增 {k} 条评论。", 'url': w['url']})
    return items


def main():
    global TOKEN
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='comma-separated chain ids')
    ap.add_argument('--no-code', action='store_true', help='skip GitHub calls')
    ap.add_argument('--dry-run', action='store_true', help='print, write nothing')
    ap.add_argument('--report', help='also write a Markdown summary for the pull request to this path')
    args = ap.parse_args()
    TOKEN = gh_token()
    chains = json.loads((ROOT / 'data/chains.json').read_text(encoding='utf-8'))['chains']
    out_path = ROOT / 'data/network.json'
    old = json.loads(out_path.read_text(encoding='utf-8')) if out_path.exists() else None
    only = set(args.only.split(',')) if args.only else None
    start = now_utc()
    since = iso((start - timedelta(days=WINDOW_DAYS)).replace(hour=0, minute=0, second=0))
    result = {'license': DATA_LICENSE, 'checked_at_utc': iso(start), 'window_start': since[:10],
              'rule': {'stall_min_minutes': STALL_MIN_MINUTES, 'stall_multiple': STALL_MULTIPLE, 'window_days': WINDOW_DAYS},
              'chains': dict((old or {}).get('chains', {})) if only else {}}
    failures = 0
    for c in chains:
        if only and c['id'] not in only:
            continue
        entry = {'threshold_min': threshold_minutes(c)}
        probe = c['network'].get('probe')
        if probe:
            q = now_utc()
            try:
                entry['block'] = read_probe(probe)
            except Exception as e:  # report and keep going: one dead endpoint must not stop the patrol
                failures += 1
                entry['block'] = {'ok': False, 'queried_at_utc': iso(q), 'source': probe['url'], 'error': str(e)[:200]}
            # An independent explorer, read when the chain's own endpoint shows no recent block (or none at all).
            check = c['network'].get('check')
            b = entry['block']
            if check and not (b.get('ok') and b['age_minutes'] <= entry['threshold_min']):
                q = now_utc()
                try:
                    entry['check'] = read_probe(check)
                except Exception as e:
                    failures += 1
                    entry['check'] = {'ok': False, 'queried_at_utc': iso(q), 'source': check['url'], 'error': str(e)[:200]}
        else:
            entry['block'] = {'ok': False, 'source': None, 'error': c['network'].get('no_probe_reason', 'no public endpoint')}
        repo = (c.get('code') or {}).get('repo')
        host = (c.get('code') or {}).get('host')
        if repo and host:
            # hosted outside GitHub: no release or commit count, and no "quiet" status from it
            entry['code'] = {'repo': repo, 'host': host, 'not_github': True}
        elif repo and not args.no_code:
            try:
                entry['code'] = code_activity(repo, since)
                for extra in c['code'].get('also', []):
                    try:
                        entry.setdefault('code_also', []).append(code_activity(extra, since))
                    except Exception as e:
                        failures += 1
                        entry.setdefault('code_also', []).append({'repo': extra, 'error': str(e)[:200]})
            except Exception as e:
                failures += 1
                entry['code'] = {'repo': repo, 'error': str(e)[:200]}
        elif repo and old and c['id'] in old.get('chains', {}):
            entry['code'] = old['chains'][c['id']].get('code')
        for w in c.get('watch', []):
            url = f"https://github.com/{w['repo']}/{'pull' if w['type'] == 'pr' else 'issues'}/{w['number']}" if w['type'] in ('pr', 'issue') \
                else f"https://github.com/{w['repo']}/blob/HEAD/{w['path']}"
            try:
                state, comments = watch_state(w)
            except Exception as e:
                failures += 1
                state, comments = f'error: {str(e)[:80]}', None
            entry.setdefault('watch', {})[w['label']] = {'label': w['label'], 'state': state, 'comments': comments, 'url': url}
        entry['status'] = status(entry)
        result['chains'][c['id']] = entry
        b = entry['block']
        print(f"{c['id']:<22} {entry['status']:<8} " + (f"#{b['height']} {b['age_minutes']}m" if b.get('ok') else f"block: {b.get('error')}"), flush=True)
    today = start.strftime('%Y-%m-%d')
    items = changes(chains, old, result, today) if old else []
    if args.dry_run:
        print(json.dumps(items, ensure_ascii=False, indent=1))
        return
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if items:
        prev = old['checked_at_utc'][:10]
        issue = {'date': today, 'range': {'from': prev, 'to': today}, 'source': 'patrol', 'items': items}
        (ROOT / 'data/changes').mkdir(exist_ok=True)
        (ROOT / f'data/changes/{today}.json').write_text(json.dumps(issue, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    if args.report:
        Path(args.report).write_text(report(chains, result, items, failures), encoding='utf-8')
    print(f'{len(result["chains"])} chains, {len(items)} changes, {failures} failed lookups')


def report(chains, result, items, failures):
    """Pull-request text: what changed, which chains are not running normally, and what a person must decide."""
    names = {c['id']: c['name'] for c in chains}
    lines = [f"Patrol run {result['checked_at_utc']}. Commit window starts {result['window_start']}.", '']
    lines += ['## Changes since the last patrol', '']
    lines += [f"- {it['en']}" + (f" ([source]({it['url']}))" if it.get('url') else '') for it in items] or ['- None.']
    odd = [(cid, e) for cid, e in result['chains'].items() if e['status'] != 'ok']
    lines += ['', '## Chains not marked running', '']
    for cid, e in sorted(odd, key=lambda x: x[1]['status']):
        b = e.get('block', {})
        detail = f"newest block {b['age_minutes']} min old, limit {e['threshold_min']} min" if b.get('ok') else f"block lookup: {b['error']['en'] if isinstance(b.get('error'), dict) else b.get('error')}"
        x = e.get('check') or {}
        if x:
            detail += f"; independent explorer: {'newest block ' + str(x['age_minutes']) + ' min old' if x.get('ok') else 'no answer'}"
        elif e['status'] == 'unknown' and b.get('ok'):
            detail += '; no independent explorer to confirm, so not called stopped'
        if e['status'] == 'quiet':
            detail += f", 0 commits since {result['window_start']} in {e.get('code', {}).get('repo')}"
        lines.append(f"- **{names.get(cid, cid)}**: {STATUS_TEXT[e['status']][0]} ({detail})")
    if not odd:
        lines.append('- None.')
    lines += ['', f'{failures} lookup(s) failed.' if failures else 'Every lookup answered.', '',
              'Stages are not changed by the patrol. Before merging, check each change against its source and, '
              'if a stage should move, edit data/chains.json with a primary-source milestone.']
    return '\n'.join(lines) + '\n'


if __name__ == '__main__':
    sys.exit(main())
