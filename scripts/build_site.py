#!/usr/bin/env python3
"""Build the GitHub Pages site from data/ into _site/.

Reads data/chains.json (stages and milestones, edited by people), data/network.json (written by
scripts/patrol.py), data/market_cap.json (written by scripts/rank.py), data/projects.json and
data/sources.json (sources for the listed projects) and data/changes/*.json (patrol issues).

Every page is written in English and Chinese. scripts/site/app.js renders the content; this script
runs it once in Node (scripts/site/prerender.js) so the HTML is complete before any JavaScript runs.

Usage: python3 scripts/build_site.py [--out _site] [--base /post-quantum-blockchains/]
"""
import argparse
import csv
import io
import hashlib
import html
from html.parser import HTMLParser
import json
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_SRC = ROOT / 'scripts' / 'site'
REPO = 'https://github.com/Balance0014/post-quantum-blockchains'
ORIGIN = 'https://balance0014.github.io'

CHIPS = {
    'fips204': {'tone': 'std', 'en': 'ML-DSA · NIST FIPS 204', 'zh': 'ML-DSA · NIST 标准 FIPS 204'},
    'fips205': {'tone': 'std', 'en': 'SLH-DSA · NIST FIPS 205', 'zh': 'SLH-DSA · NIST 标准 FIPS 205'},
    'falcon': {'tone': 'std', 'en': 'Falcon · NIST-selected (FN-DSA)', 'zh': 'Falcon · NIST 选定（FN-DSA）'},
    'xmss': {'tone': 'std', 'en': 'XMSS · IETF RFC 8391', 'zh': 'XMSS · IETF 标准 RFC 8391'},
    'family': {'tone': 'fam', 'en': 'NIST family · version not reviewed', 'zh': 'NIST 同族方案 · 版本未核实'},
    'sphincs': {'tone': 'fam', 'en': 'SPHINCS+ · basis of SLH-DSA', 'zh': 'SPHINCS+ · SLH-DSA 的前身'},
    'wots': {'tone': 'warn', 'en': 'Hash-based · not a standard on its own', 'zh': '哈希签名 · 单独使用无对应标准'},
    'nonstd': {'tone': 'warn', 'en': 'Not a NIST standard', 'zh': '非 NIST 标准'},
    'custom': {'tone': 'warn', 'en': 'Custom construction', 'zh': '项目自研构造'},
    'broken': {'tone': 'bad', 'en': 'Older parameters publicly broken', 'zh': '旧参数已被公开破解'},
    'none': {'tone': 'fam', 'en': 'No post-quantum scheme yet', 'zh': '尚无抗量子方案'},
}

# Algorithm families for the home page filter, from the algorithm labels (and the algorithm text for 'family' labels).
FAMILIES = ('mldsa', 'falcon', 'slhdsa', 'hash', 'other', 'none')


def families(c):
    chips, text = set(c['algo_chips']), (c['algo'].get('en') or '').lower()
    f = set()
    if 'fips204' in chips:
        f.add('mldsa')
    if 'falcon' in chips:
        f.add('falcon')
    if chips & {'fips205', 'sphincs'}:
        f.add('slhdsa')
    if chips & {'xmss', 'wots'}:
        f.add('hash')
    if 'custom' in chips:
        f.add('other')
    if 'nonstd' in chips:  # outside a standard, but of a known family when the text names one
        f.add('slhdsa' if any(w in text for w in ('slh-dsa', 'sphincs')) else
              'hash' if any(w in text for w in ('xmss', 'wots', 'winternitz')) else 'other')
    if 'family' in chips:
        for k, words in (('mldsa', ('dilithium', 'ml-dsa')), ('falcon', ('falcon',)), ('slhdsa', ('sphincs', 'slh-dsa'))):
            if any(w in text for w in words):
                f.add(k)
    if 'none' in chips:
        f.add('none')
    return [k for k in FAMILIES if k in f] or ['other']


# The site mark: a staircase of six steps, one per stage, on a dark tile. Inline in the header; also the favicon.
LOGO_BARS = ''.join(f'<rect x="{6 + i * 3.4:.1f}" y="{25 - (i + 1) * 3}" width="3.5" height="{(i + 1) * 3}" fill="{col}"/>'
                    for i, col in enumerate(('#5a4d9c', '#6f5dc2', '#8873e0', '#a596f4', '#c5bcfd', '#ece8ff')))
LOGO_SVG = f'<svg class="logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="#1c1630"/>{LOGO_BARS}</svg>'


STAGE_NAMES = {'en': ['Nothing public', 'Research', 'Formal proposal', 'Testnet', 'Mainnet opt-in', 'Default'],
               'zh': ['无公开进展', '仅有研究', '已有正式提案', '仅限测试网', '主网可选用', '默认抗量子']}

KIND_ZH = {
    'algorithm specification or reference implementation': '算法规范或参考实现', 'attack reproduction': '攻击复现',
    'community research': '社区研究', 'community-maintained project information': '社区维护的项目信息',
    'ecosystem block explorer': '生态区块浏览器', 'pinned source code': '固定版本的源代码',
    'pinned source documentation': '固定版本的源码文档', 'pinned source repository': '固定版本的代码库',
    'project block explorer': '项目区块浏览器', 'project documentation': '项目文档',
    'project foundation website': '项目基金会官网', 'project release record': '项目发布记录', 'project website': '项目官网',
    'standards body': '标准机构', 'standards body forum update': '标准机构论坛公告',
    'third-party submission hosted by SEC': 'SEC 网站上的第三方材料',
}

TEXT = {
    'en': {'brand': 'Post-Quantum Blockchains', 'other_lang': '中文', 'other_lang_label': '切换到中文', 'gh': 'Data on GitHub', 'menu': 'Menu', 'theme': 'Dark mode', 'og_locale': 'en_US',
           'home_title': 'Post-Quantum Blockchains: which chains are quantum-resistant today',
           'home_desc': 'Is Bitcoin quantum-resistant? A source-checked tracker of post-quantum signatures on the largest blockchains and on chains built post-quantum: {n} chains, each rated 0 to 5, with network data checked every week.',
           'chain_title': 'Is {name}{sp}quantum-resistant? Post-quantum status, sources and date',
           'chain_q': 'Is {name} quantum-resistant?', 'og_alt': 'Post-Quantum Blockchains: {n} chains rated from stage 0 to 5, each checked against primary sources.',
           'method_title': 'How we rate post-quantum readiness · Post-Quantum Blockchains',
           'method_desc': 'The six stages, the rating rules, the network checks with their thresholds, the algorithm labels, the evidence grades and every data field with its source and script.',
           'changes_title': 'This week in post-quantum blockchains · Post-Quantum Blockchains',
           'changes_desc': 'What the weekly patrol found: new releases, proposal status changes, network status changes and stage changes, each with its source.',
           'nf_title': 'Page not found · Post-Quantum Blockchains', 'nf_h': 'This page does not exist.', 'nf_p': 'Go to the list of chains:'},
    'zh': {'brand': '抗量子区块链进度表', 'other_lang': 'English', 'other_lang_label': 'Switch to English', 'gh': '数据在 GitHub', 'menu': '菜单', 'theme': '深色模式', 'og_locale': 'zh_CN',
           'home_title': '抗量子区块链进度表：哪些链已经能用抗量子签名',
           'home_desc': '比特币能抗量子吗？逐条核对出处的抗量子进度表，覆盖市值最大的区块链和原生抗量子链，共 {n} 条，每条评 0 到 5 档；网络数据每周巡查，出处每月重核。',
           'chain_title': '{name}{sp}能抗量子吗？抗量子进展、出处和核对日期',
           'chain_q': '{name}{sp}能抗量子吗？', 'og_alt': '抗量子区块链进度表：{n} 条链按 0 到 5 档评定，每条都对照原始出处核对。',
           'method_title': '评档方法 · 抗量子区块链进度表',
           'method_desc': '六个档位、评档规则、网络核查及其时限、算法标签、证据分级，以及每个数据字段的来源和脚本。',
           'changes_title': '本周抗量子进展 · 抗量子区块链进度表',
           'changes_desc': '每周巡查发现的变化：新发布版本、提案状态、网络状态和档位调整，每条都附出处。',
           'nf_title': '页面不存在 · 抗量子区块链进度表', 'nf_h': '这个页面不存在。', 'nf_p': '返回链列表：'},
}


class ZhText(HTMLParser):
    """Collects the text a reader sees (text nodes, tooltips, labels), skipping scripts and styles."""
    def __init__(self):
        super().__init__()
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
        self.out += [v for k, v in attrs if k in ('data-def', 'data-title', 'data-tip', 'aria-label', 'placeholder', 'title', 'content') and v]

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.out.append(data)


CJK = re.compile(r'[\u4e00-\u9fff]')


def zh_punctuation_errors(page_html):
    """Chinese text must use full-width punctuation. A comma or colon between digits (3,428 / 11:32) is fine."""
    p = ZhText()
    p.feed(page_html)
    errors = []
    for s in p.out:
        if not CJK.search(s):
            continue
        # English titles quoted in 「」 keep their own punctuation.
        s = re.sub(r'「[^」]*」', lambda m: m.group(0) if CJK.search(m.group(0)[1:-1]) else '「」', s)
        for i, ch in enumerate(s):
            if ch in ',;:()?!' and not (ch in ',:' and s[i - 1:i].isdigit() and s[i + 1:i + 2].isdigit()):
                errors.append(f'{ch!r} in: {s.strip()[:160]}')
                break
    return errors


# Words a tracker must not use as a conclusion: it rates what is live, it doesn't call anything safe,
# forecast prices or tell anyone to buy or sell. Quoted titles and claims ("...", 「...」) are exempt.
BANNED_EN = re.compile(r'\b(safe|safely|safety|guarantee[sd]?|quantum[- ]proof|unhackable|unbreakable|buy|sell|price target)\b', re.I)
BANNED_ZH = re.compile(r'安全(?!审计|认证)|防量子|买入|卖出|目标价|抄底|稳赚')
QUOTED = re.compile(r'"[^"]*"|“[^”]*”|「[^」]*」|‘[^’]*’')


def banned_words(text):
    t = QUOTED.sub('', text)
    return [m.group(0) for m in BANNED_EN.finditer(t)] + [m.group(0) for m in BANNED_ZH.finditer(t)]


class Links(HTMLParser):
    """Collects the links (href, src) and element ids of a page."""
    def __init__(self):
        super().__init__()
        self.links, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        for k in ('href', 'src'):
            if a.get(k):
                self.links.append(a[k])


def broken_internal_links(out, base):
    """Every link inside the site (pages, assets, anchors, language switch) must reach a file and, with #, an id."""
    pages = {}
    for f in out.rglob('*.html'):
        p = Links()
        p.feed(f.read_text(encoding='utf-8'))
        pages[f] = p
    errors = []
    for f, p in pages.items():
        for link in p.links:
            target = link.replace(ORIGIN, '', 1) if link.startswith(ORIGIN + base) else link
            if target.startswith(('http://', 'https://', 'mailto:', 'data:')):
                continue
            path, _, frag = target.partition('#')
            path = path.split('?')[0]
            if not path:
                dest = f
            elif path.startswith(base):
                dest = out / path[len(base):]
                if path.endswith('/') or dest.is_dir():
                    dest = dest / 'index.html'
            else:
                errors.append(f'{f.relative_to(out)}: link outside the site base: {link}')
                continue
            if not dest.exists():
                errors.append(f'{f.relative_to(out)}: broken link {link}')
            elif frag and dest.suffix == '.html' and frag not in pages[dest].ids:
                errors.append(f'{f.relative_to(out)}: missing anchor {link}')
    return errors


def load(rel, default=None):
    p = ROOT / rel
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else default


def short_url(u, n=72):
    s = re.sub(r'^https?://(www\.)?', '', u).rstrip('/')
    return s if len(s) <= n else s[:n // 2 - 1] + '…' + s[-(n // 2 - 1):]


def group_of(c, rank):
    if c['network_status'] != 'mainnet':
        return 'early'
    if c['kind'] == 'native':
        return 'native'
    if rank is not None or c['stage'] < 4:
        return 'top'
    return 'optin'


# Which milestone types support each stage, for the source linked from a chain page's opening answer.
BASIS_TYPES = {5: ('mainnet',), 4: ('mainnet', 'wallet', 'thirdparty'), 3: ('testnet',), 2: ('proposal', 'code'),
               1: ('research', 'proposal', 'code'), 0: ('research', 'code', 'proposal')}
# Node endpoints answer only programs (POST queries, websockets), so a reader cannot open them as a citation.
NODE_ENDPOINT = re.compile(r'graphql|entrypoint|rpc', re.I)
SOURCE_ORDER = ('pinned source code', 'pinned source repository', 'project release record', 'project block explorer',
                'ecosystem block explorer', 'pinned source documentation', 'algorithm specification or reference implementation')


def words(text):
    """Words of four letters or more, and anything with a digit (BIP-360, #1104), for matching a source to the basis."""
    return {w for w in re.findall(r"[#\w][\w'-]*", (text or '').lower()) if len(w) >= 4 or any(ch.isdigit() for ch in w)}


def basis_source(c, projects, sources):
    """The one source the opening answer cites. A listed project cites its strongest pinned primary source (code before
    docs). Other chains cite the primary (else official) milestone of a type that supports the stage whose name shares the
    most words with the stage basis, newest first on ties; else the closest graded milestone, else the first source.
    Node endpoints are skipped: the chain page shows those readings in its network panel."""
    p = projects.get(c.get('projects_id')) if c.get('projects_id') else None
    ranked = [sources[sid] for sid in (p or {}).get('sources', []) if sources[sid]['source_type'] in SOURCE_ORDER]
    if ranked:
        return min(ranked, key=lambda s: SOURCE_ORDER.index(s['source_type']))['url']
    basis = words(c['stage_basis']['en'])
    ms = [m for m in c.get('milestones', []) if m.get('verified', True) and m.get('source_url')
          and m.get('grade', 'primary') in ('primary', 'official') and not NODE_ENDPOINT.search(m['source_url'])]
    best = lambda xs: max(xs, key=lambda m: (len(words(m['name']) & basis), m.get('grade', 'primary') == 'primary', m.get('date') or ''))
    hits = [m for m in ms if m['type'] in BASIS_TYPES.get(c['stage'], ())]
    if hits or ms:
        return best(hits or ms)['source_url']
    first = (c.get('sources') or [None])[0]
    return first if isinstance(first, str) or first is None else first['url']


def chain_view(c, net, ranks, projects, sources):
    n = net.get('chains', {}).get(c['id'], {})
    b = n.get('block', {})
    block = {'ok': bool(b.get('ok')), 'url': b.get('source'), 'q': b.get('queried_at_utc')}
    if b.get('ok'):
        block.update(h=b['height'], t=b['time_utc'], age=b['age_minutes'], reads=b.get('reads'))
    x = n.get('check')
    xchk = {'ok': bool(x.get('ok')), 'url': x.get('source'), 'h': x.get('height'), 'age': x.get('age_minutes')} if x else None
    spec = c.get('code') or {}
    code = None
    if spec:
        code = {'repo': spec.get('repo'), 'note': spec.get('note'), 'c90': None, 'also': []}
        got = n.get('code') or {}
        if got and 'error' not in got:
            code.update(rel=got.get('release'), rel_date=got.get('release_date'), rel_pre=bool(got.get('prerelease')),
                        rel_tag=bool(got.get('tag_only')), c90=got.get('commits_90d'), last=got.get('last_commit'))
        code['also'] = [{'repo': a['repo'], 'c90': a.get('commits_90d')} for a in n.get('code_also', []) if 'error' not in a]
    rank = ranks.get(c.get('coingecko_id')) if ranks else c.get('mcap_rank')
    if rank is not None and rank > 100:
        rank = None
    srcs = []
    for s in c.get('sources') or []:
        u = s if isinstance(s, str) else s['url']
        srcs.append({'url': u, 'label': short_url(u)})
    if c.get('projects_id'):
        p = projects.get(c['projects_id'])
        for sid in (p or {}).get('sources', []):
            s = sources[sid]
            srcs.append({'url': s['url'], 'label': short_url(s['url']),
                         'kind': {'en': s['source_type'], 'zh': KIND_ZH.get(s['source_type'], s['source_type'])}})
    for s in c.get('extra_sources') or []:
        srcs.append({'url': s['url'], 'label': short_url(s['url'])})
    ls = c['latest_step']
    return {
        'id': c['id'], 'name': c['name'], 'zh_name': c.get('zh_name'), 'ticker': c['ticker'], 'kind': c['kind'],
        'group': group_of(c, rank), 'rank': rank, 'stage': c['stage'], 'algo': c['algo'], 'chips': c['algo_chips'], 'fam': families(c),
        'consensus': c.get('consensus'), 'holder': c['holder_can_use_today'], 'note': c.get('note'), 'four': c.get('four'),
        'latest': {'date': ls.get('date'), 'en': ls.get('text'), 'zh': ls.get('zh'), 'checked': bool(ls.get('is_check_date'))},
        'checked': (n.get('block', {}).get('queried_at_utc') or net.get('checked_at_utc') or '')[:10] or None,
        'reviewed': c['last_reviewed'], 'basis': c['stage_basis'],
        'basis_src': basis_source(c, projects, sources),
        'since': c.get('pq_mainnet_since'),
        'net': {'status': n.get('status', 'unknown'), 'threshold': n.get('threshold_min'), 'block': block, 'code': code,
                'reason': c['network'].get('no_probe_reason'), 'own': c['network'].get('source_kind'), 'check': xchk},
        'timeline': [{'date': m.get('date'), 'type': m['type'], 'grade': m.get('grade', 'primary'), 'en': m['name'], 'zh': m.get('zh'),
                      'status': m.get('status'), 'url': m.get('source_url'), 'checked': bool(m.get('checked'))}
                     for m in c.get('milestones', []) if m.get('verified', True)],
        'unverified': c.get('unverified', []),
        'sources': srcs,
    }


def home_view(v):
    """The home page only needs what its table and charts show; everything else is on the chain's own page."""
    n, b, code = v['net'], v['net']['block'], v['net']['code']
    return {'id': v['id'], 'name': v['name'], 'zh_name': v['zh_name'], 'ticker': v['ticker'], 'kind': v['kind'],
            'group': v['group'], 'rank': v['rank'], 'stage': v['stage'], 'algo': v['algo'], 'chips': v['chips'], 'fam': v['fam'],
            'latest': v['latest'], 'since': {k: v['since'][k] for k in ('date', 'basis')} if v['since'] else None,
            'net': {'status': n['status'], 'block': {'ok': bool(b.get('ok')), 'age': b.get('age'), 'url': bool(b.get('url'))},
                    'code': {'repo': bool(code.get('repo')), 'c90': code.get('c90')} if code else None}}


# The monthly milestone chart covers this many months, ending with the month of the latest check.
CHART_MONTHS = 24
CHART_TYPES = ('proposal', 'testnet', 'mainnet')


def milestone_months(views, checked):
    """Dated proposal, testnet and mainnet milestones per month across all chains, for the home page chart.
    Entries marked as our own checks (checked: true) are not project events, so they are left out, as are entries dated
    only to a quarter or undated."""
    y, m = int(checked[:4]), int(checked[5:7])
    months = []
    for _ in range(CHART_MONTHS):
        months.append(f'{y:04d}-{m:02d}')
        y, m = (y, m - 1) if m > 1 else (y - 1, 12)
    months.reverse()
    counts = {k: [0] * len(CHART_TYPES) for k in months}
    for v in views:
        for t in v['timeline']:
            d = t.get('date') or ''
            if t['type'] in CHART_TYPES and re.match(r'^\d{4}-\d{2}(-\d{2})?$', d) and not t['checked'] and d[:7] in counts:
                counts[d[:7]][CHART_TYPES.index(t['type'])] += 1
    return {'types': list(CHART_TYPES), 'months': [[k] + counts[k] for k in months]}


CSV_COLUMNS = ('id', 'name', 'ticker', 'group', 'kind', 'market_cap_rank', 'stage', 'stage_name', 'algorithm',
               'network_status', 'pq_mainnet_since', 'pq_mainnet_since_basis', 'pq_mainnet_since_source', 'stage_basis',
               'stage_source', 'last_reviewed', 'page')


def write_data_files(out, views, checked, release, base, has_changes):
    """Data downloads and llms.txt, served next to the pages so people and AI assistants can read the tracker without
    the website. They are written fresh from data/ on every build, so they always match the pages."""
    d = out / 'data'
    d.mkdir()
    for name in ('chains.json', 'network.json', 'projects.json', 'sources.json'):
        shutil.copyfile(ROOT / 'data' / name, d / name)
    page = lambda v: ORIGIN + base + f"chains/{v['id']}/"
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator='\n')
    w.writerow(CSV_COLUMNS)
    for v in sorted(views, key=lambda v: (v['rank'] or 999, -v['stage'], v['name'])):
        s = v['since'] or {}
        w.writerow([v['id'], v['name'], v['ticker'], v['group'], v['kind'], v['rank'] or '', v['stage'], STAGE_NAMES['en'][v['stage']],
                    v['algo']['en'], v['net']['status'], s.get('date', ''), s.get('basis', ''), s.get('source_url', ''),
                    v['basis']['en'], v['basis_src'] or '', v['reviewed'], page(v)])
    (d / 'chains.csv').write_text(buf.getvalue(), encoding='utf-8')
    top = [v for v in views if v['rank'] is not None]
    by_stage = lambda vs: ', '.join(f'stage {s}: {sum(1 for v in vs if v["stage"] == s)}' for s in range(6))
    lines = [f'# {TEXT["en"]["brand"]}', '',
             f'> An open, source-checked tracker of post-quantum signatures on blockchains. {len(views)} chains, each rated on '
             f'a 0 to 5 scale from primary sources (0 nothing public, 1 research, 2 formal proposal, 3 testnet, 4 mainnet opt-in, '
             f'5 post-quantum by default). Network data checked {checked}; version {release["version"]}. It rates only what is '
             f'already live, does not predict when current cryptography might be broken and says nothing about prices.', '',
             f'Largest blockchains (CoinGecko top 100 with their own network, {len(top)} chains): {by_stage(top)}.', '',
             '## Pages',
             f'- [All chains]({ORIGIN + base}): table, stage charts and timeline; Chinese version at {ORIGIN + base}zh/',
             f'- [Method]({ORIGIN + base}method/): how stages are rated, evidence grades, network checks, coverage and limits']
    if has_changes:
        lines.append(f'- [This week]({ORIGIN + base}changes/): changes found by the weekly patrol')
    lines += ['',
             '## Data (CC BY 4.0)',
             f'- [chains.csv]({ORIGIN + base}data/chains.csv): one row per chain: stage, algorithm, network status, '
             f'post-quantum mainnet start date, the sentence the stage rests on and its source',
             f'- [chains.json]({ORIGIN + base}data/chains.json): every chain with its stage, evidence, milestones and sources',
             f'- [network.json]({ORIGIN + base}data/network.json): the latest weekly network check (newest block, code activity)',
             f'- [projects.json]({ORIGIN + base}data/projects.json) and [sources.json]({ORIGIN + base}data/sources.json): '
             f'projects that already use post-quantum signatures, with pinned primary sources',
             f'- Repository: {REPO}', '',
             '## How to cite',
             f'Post-Quantum Blockchains (version {release["version"]}, {release["date"]}). {ORIGIN + base} . '
             f'Cite the chain page and the date you read it; stages change when primary sources do.', '',
             '## Chains']
    for v in sorted(views, key=lambda v: (-v['stage'], v['rank'] or 999, v['name'])):
        since = f"; post-quantum on mainnet since {v['since']['date']}" if v['since'] else ''
        lines.append(f"- [{v['name']} ({v['ticker']})]({page(v)}): stage {v['stage']}, {STAGE_NAMES['en'][v['stage']]}{since}")
    (out / 'llms.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def write_csv(path, header, rows):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator='\n')
    w.writerow(header)
    w.writerows(rows)
    path.write_text(buf.getvalue(), encoding='utf-8')


def write_chart_files(out, views, months):
    """One CSV per home page chart, holding exactly the numbers the chart draws ("Download data" under each chart)."""
    d = out / 'data'
    top = [v for v in views if v['rank'] is not None]
    write_csv(d / 'chart-top-stages.csv', ('stage', 'stage_name', 'chains', 'chain_ids'),
              [(s, STAGE_NAMES['en'][s], sum(1 for v in top if v['stage'] == s),
                ' '.join(v['id'] for v in sorted(top, key=lambda v: v['rank']) if v['stage'] == s)) for s in range(6)])
    dated = sorted((v for v in views if v['stage'] >= 4 and v['since']), key=lambda v: (v['since']['date'], v['name']))
    write_csv(d / 'chart-mainnet-since.csv', ('date', 'chain_id', 'chain', 'stage', 'basis', 'grade', 'running_total', 'source_url'),
              [(v['since']['date'], v['id'], v['name'], v['stage'], v['since']['basis'], v['since']['grade'], i + 1, v['since']['source_url'])
               for i, v in enumerate(dated)])
    write_csv(d / 'chart-milestones-month.csv', ('month',) + tuple(months['types']), months['months'])


def script_json(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='_site')
    ap.add_argument('--base', default='/post-quantum-blockchains/')
    args = ap.parse_args()
    base = args.base if args.base.endswith('/') else args.base + '/'
    out = (ROOT / args.out).resolve()

    data = load('data/chains.json')
    net = load('data/network.json', {})
    mc = load('data/market_cap.json')
    ranks = {x['id']: x['rank'] for x in mc['coins']} if mc else None
    mcap_date = (mc or data['market_cap'])['queried_at_utc'][:10]
    projects = {p['id']: p for p in load('data/projects.json')['projects']}
    sources = {s['id']: s for s in load('data/sources.json')['sources']}
    changes = sorted((json.loads(p.read_text(encoding='utf-8')) for p in (ROOT / 'data/changes').glob('*.json')),
                     key=lambda x: x['date'], reverse=True) if (ROOT / 'data/changes').exists() else []
    views = [chain_view(c, net, ranks, projects, sources) for c in data['chains']]
    checked = (net.get('checked_at_utc') or '')[:10] or max(v['reviewed'] for v in views)
    today = date.fromisoformat(checked)
    for v in views:
        v['stale_days'] = (today - date.fromisoformat(v['reviewed'])).days
    months = milestone_months(views, checked)
    release = load('data/release.json')
    release = {'version': release['version'], 'date': release['published_on']}
    # One example chain per stage for the stage table: the highest-ranked coin at that stage, else the first listed.
    examples = []
    for s in range(6):
        at = sorted((v for v in views if v['stage'] == s), key=lambda v: (v['rank'] or 999, v['name']))
        examples.append({k: at[0][k] for k in ('id', 'name', 'zh_name')} if at else None)
    answer = {'en': lambda v, nm: f"As of {v['reviewed']}, {nm} is at stage {v['stage']} of 5: {STAGE_NAMES['en'][v['stage']]}. {v['basis']['en']}",
              'zh': lambda v, nm: f"截至 {v['reviewed']}，{nm}{' ' if nm[-1].isascii() else ''}处于第 {v['stage']} 档（最高 5 档）：{STAGE_NAMES['zh'][v['stage']]}。{v['basis']['zh']}"}
    cited = {'en': lambda v: f" {'Where we looked' if v['stage'] == 0 else 'Source'}: {v['basis_src']}" if v['basis_src'] else '',
             'zh': lambda v: f"{'查过的地方' if v['stage'] == 0 else '出处'}：{v['basis_src']}" if v['basis_src'] else ''}
    names = {v['id']: {'en': v['name'], 'zh': v['zh_name']} for v in views}
    mrank = {x['id']: x['rank'] for x in mc['coins']} if mc else {}
    left_out = sorted(({'rank': mrank.get(x['coingecko_id']), 'name': x['name'], 'symbol': x['symbol'],
                        'reason': data['not_listed_reasons'][x['reason']], 'note': x.get('note')}
                       for x in data.get('not_listed', []) if mrank.get(x['coingecko_id'])), key=lambda x: x['rank'])

    asset_src = {name: (SITE_SRC / name).read_bytes() for name in ('app.js', 'style.css')}
    version = hashlib.sha256(b''.join(asset_src.values())).hexdigest()[:10]
    page_tpl = (SITE_SRC / 'page.html').read_text(encoding='utf-8')

    def path_for(lang, p):
        return base + ('zh/' if lang == 'zh' else '') + p

    pages = []  # (lang, rel path, page kind, title, description, window.PQ data, json-ld)
    for lang in ('en', 'zh'):
        t = TEXT[lang]
        common = {'lang': lang, 'base': base, 'repo': REPO, 'chips': CHIPS, 'checked': checked, 'mcap_date': mcap_date,
                  'has_changes': bool(changes), 'data_url': REPO + '/tree/main/data', 'chain_count': len(views),
                  'release': release, 'examples': examples, 'site_url': ORIGIN + path_for(lang, '')}
        home = dict(common, page='home', chains=[home_view(v) for v in views], left_out=left_out, months=months)
        ld = {'@context': 'https://schema.org', '@type': 'Dataset', 'name': t['brand'],
              'description': t['home_desc'].format(n=len(views)), 'url': ORIGIN + path_for(lang, ''),
              'isAccessibleForFree': True, 'license': 'https://creativecommons.org/licenses/by/4.0/', 'dateModified': checked,
              'distribution': [{'@type': 'DataDownload', 'encodingFormat': enc, 'contentUrl': ORIGIN + base + 'data/' + f}
                               for f, enc in (('chains.csv', 'text/csv'), ('chains.json', 'application/json'), ('network.json', 'application/json'))]}
        pages.append((lang, '', home, t['home_title'], t['home_desc'].format(n=len(views)), ld))
        for v in views:
            nm = v['zh_name'] if lang == 'zh' and v['zh_name'] else v['name']
            sp = ' ' if nm[-1].isascii() else ''
            desc = answer[lang](v, nm)
            ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'inLanguage': 'zh-Hans' if lang == 'zh' else 'en',
                  'dateModified': v['reviewed'], 'url': ORIGIN + path_for(lang, f"chains/{v['id']}/"),
                  'mainEntity': [{'@type': 'Question', 'name': t['chain_q'].format(name=nm, sp=sp),
                                  'acceptedAnswer': {'@type': 'Answer', 'text': desc + cited[lang](v)}}]}
            pages.append((lang, f"chains/{v['id']}/", dict(common, page='chain', chains=[v]),
                          t['chain_title'].format(name=nm, sp=sp), desc, ld))
        pages.append((lang, 'method/', dict(common, page='method', chains=[], left_out=left_out), t['method_title'], t['method_desc'], None))
        if changes:
            pages.append((lang, 'changes/', dict(common, page='changes', chains=[], changes=changes, names=names),
                          t['changes_title'], t['changes_desc'], None))
    for lang, rel, d, *_ in pages:
        d['alt'] = path_for('zh' if lang == 'en' else 'en', rel)

    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump([p[2] for p in pages], f, ensure_ascii=False)
        jobs = f.name
    try:
        run = subprocess.run(['node', str(SITE_SRC / 'prerender.js'), jobs], capture_output=True, text=True)
        if run.returncode:
            sys.exit('prerender failed:\n' + run.stderr[-3000:])
        rendered = json.loads(run.stdout)
    finally:
        Path(jobs).unlink()

    if out.exists():
        shutil.rmtree(out)
    (out / 'assets').mkdir(parents=True)
    for name, b in asset_src.items():
        (out / 'assets' / name).write_bytes(b)
    shutil.copyfile(SITE_SRC / 'og.png', out / 'assets' / 'og.png')
    # IndexNow: the key file sits next to the pages; .github/workflows/pages.yml pings IndexNow after each deploy.
    key = (SITE_SRC / 'indexnow-key.txt').read_text(encoding='utf-8').strip()
    (out / f'{key}.txt').write_text(key + '\n', encoding='utf-8')
    write_data_files(out, views, checked, release, base, bool(changes))
    write_chart_files(out, views, months)
    (out / 'assets' / 'logo.svg').write_text(LOGO_SVG.replace(' class="logo"', ' xmlns="http://www.w3.org/2000/svg" width="32" height="32"')
                                             .replace(' aria-hidden="true" focusable="false"', '') + '\n', encoding='utf-8')
    shutil.copyfile(SITE_SRC / 'apple-touch-icon.png', out / 'assets' / 'apple-touch-icon.png')
    esc = lambda s: html.escape(s or '', quote=True)
    zh_errors = []
    for (lang, rel, d, title, desc, ld), r in zip(pages, rendered):
        t = TEXT[lang]
        other = 'zh' if lang == 'en' else 'en'
        fill = {
            'html_lang': 'zh-Hans' if lang == 'zh' else 'en', 'title': esc(title), 'description': esc(desc),
            'canonical': ORIGIN + path_for(lang, rel), 'url_en': ORIGIN + path_for('en', rel), 'url_zh': ORIGIN + path_for('zh', rel),
            'brand': esc(t['brand']), 'og_locale': t['og_locale'], 'base': base, 'v': version, 'home': path_for(lang, ''),
            'alt': d['alt'], 'alt_lang': 'zh-Hans' if other == 'zh' else 'en', 'other_lang': t['other_lang'],
            'other_lang_label': t['other_lang_label'], 'repo': REPO, 'gh': esc(t['gh']), 'menu': esc(t['menu']),
            'logo': LOGO_SVG, 'theme_label': esc(t['theme']),
            'nav': r['nav'], 'app': r['app'], 'foot': r['foot'], 'data': script_json(d),
            'jsonld': f'<script type="application/ld+json">{script_json(ld)}</script>' if ld else '',
            'og_type': 'article' if d['page'] == 'chain' else 'website', 'og_image': ORIGIN + base + 'assets/og.png',
            'og_alt': esc(t['og_alt'].format(n=len(views))),
        }
        page = re.sub(r'\{\{(\w+)\}\}', lambda m: str(fill[m.group(1)]), page_tpl)
        dest = out / ('zh' if lang == 'zh' else '') / rel / 'index.html'
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(page, encoding='utf-8')
        if lang == 'zh':
            zh_errors += [f'zh/{rel}: {e}' for e in zh_punctuation_errors(page)]
        tp = ZhText()
        tp.feed(page)
        zh_errors += [f'{lang}/{rel}: banned word "{w}"' for w in banned_words(' '.join(tp.out))]

    # 404 page (GitHub Pages serves /404.html for any missing path), both languages on one page
    nf = '\n'.join(f'<p lang="{l}"><b>{TEXT[l]["nf_h"]}</b> {TEXT[l]["nf_p"]} <a href="{path_for(l, "")}">{esc(TEXT[l]["brand"])}</a></p>'
                   for l in ('en', 'zh'))
    (out / '404.html').write_text(
        f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        f'<meta name="robots" content="noindex"><title>{esc(TEXT["en"]["nf_title"])}</title>'
        f'<link rel="stylesheet" href="{base}assets/style.css?v={version}"></head>'
        f'<body><main><div class="wrap" style="padding-block:64px;display:grid;gap:12px">{nf}</div></main></body></html>\n', encoding='utf-8')

    # sitemap with language alternates
    urls = []
    for lang, rel, *_ in pages:
        alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{h}" href="{ORIGIN + path_for(l, rel)}"/>'
                       for l, h in (('en', 'en'), ('zh', 'zh-Hans')))
        urls.append(f'<url><loc>{ORIGIN + path_for(lang, rel)}</loc><lastmod>{checked}</lastmod>{alts}</url>')
    (out / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
                                     'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(urls) + '\n</urlset>\n', encoding='utf-8')
    link_errors = broken_internal_links(out, base)
    if link_errors:
        sys.exit(f'{len(link_errors)} broken internal link(s):\n' + '\n'.join(sorted(set(link_errors))[:50]))
    if zh_errors:
        sys.exit(f'{len(zh_errors)} problem(s) in the built pages (half-width punctuation in Chinese, or banned words):\n' + '\n'.join(sorted(set(zh_errors))))
    print(f'{len(pages)} pages, {len(views)} chains, written to {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}')


if __name__ == '__main__':
    sys.exit(main())
