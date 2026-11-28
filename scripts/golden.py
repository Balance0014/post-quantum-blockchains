#!/usr/bin/env python3
"""Golden regression: ten hand-checked facts that data/chains.json must keep stating.

Each fact in data/golden.json lists what the data must say (a stage, a date, words in a milestone) and the pinned
primary source that shows it. A data edit that drops or contradicts one of them fails CI, so a mistake in a large
edit cannot slip through quietly. When a fact really changes, update data/golden.json in the same pull request.

    python3 scripts/golden.py            # check the data (no network)
    python3 scripts/golden.py --online   # also check that each pinned source still shows the fact

Online, a pinned file is read from raw.githubusercontent.com (no API quota) and a release through the GitHub API (with
GITHUB_TOKEN when set). If GitHub refuses because a quota is used up, that fact is listed as not judged, not failed.
"""
import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from urllib.parse import quote
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = 'post-quantum-blockchains-golden/1.0 (+https://github.com/Balance0014/post-quantum-blockchains)'
CTX = ssl.create_default_context()
if os.path.exists('/etc/ssl/cert.pem'):  # macOS Python ships without a CA bundle
    CTX.load_verify_locations('/etc/ssl/cert.pem')


def get(obj, path):
    for part in path.split('.'):
        if not isinstance(obj, dict) or part not in obj:
            return None
        obj = obj[part]
    return obj


def check_data(fact, chains):
    """Return the problems with one fact's data assertions."""
    bad = []
    for a in fact['data']:
        c = chains.get(a['chain'])
        if c is None:
            bad.append(f"chain {a['chain']} is missing")
            continue
        if a['field'] == 'milestones':
            names = [m.get('name') or '' for m in c.get('milestones', [])]
            if not any(all(w in n for w in a['contains']) for n in names):
                bad.append(f"no {a['chain']} milestone mentions {' + '.join(repr(w) for w in a['contains'])}")
            continue
        v = get(c, a['field'])
        if 'equals' in a and v != a['equals']:
            bad.append(f"{a['chain']}.{a['field']} is {v!r}, expected {a['equals']!r}")
        for w in a.get('contains', []):
            if not isinstance(v, str) or w not in v:
                bad.append(f"{a['chain']}.{a['field']} does not mention {w!r}")
    return bad


def github(path):
    req = urllib.request.Request(f'https://api.github.com/{path}', headers={'User-Agent': UA, 'Accept': 'application/vnd.github+json'})
    token = os.environ.get('GITHUB_TOKEN')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req, context=CTX, timeout=30) as r:
        return json.loads(r.read())


class RateLimited(Exception):
    pass


def rate_limited(e):
    """GitHub's answer when a quota is used up: 429, or 403 with no requests left or a rate-limit message."""
    if not isinstance(e, urllib.error.HTTPError) or e.code not in (403, 429):
        return False
    try:
        body = e.read(2000).decode('utf-8', 'replace').lower()
    except Exception:
        body = ''
    return e.code == 429 or e.headers.get('X-RateLimit-Remaining') == '0' or 'rate limit' in body


def raw(src):
    url = f"https://raw.githubusercontent.com/{src['repo']}/{src['ref']}/{quote(src['path'])}"
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), context=CTX, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def source_text(src):
    try:
        if 'release' in src:
            rel = github(f"repos/{src['release']}/releases/tags/{quote(src['tag'])}")
            return f"{rel.get('name') or ''}\n{rel.get('body') or ''}"
        lines = raw(src).splitlines()
    except urllib.error.HTTPError as e:
        if rate_limited(e):
            raise RateLimited(f'HTTP {e.code}, quota used up') from e
        raise
    a, b = src['lines']
    return '\n'.join(lines[a - 1:b])


def source_url(src):
    if 'release' in src:
        return f"https://github.com/{src['release']}/releases/tag/{src['tag']}"
    a, b = src['lines']
    return f"https://github.com/{src['repo']}/blob/{src['ref']}/{src['path']}#L{a}" + (f'-L{b}' if b != a else '')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--online', action='store_true', help='also read each pinned source through the GitHub API')
    args = ap.parse_args()
    facts = json.loads((ROOT / 'data/golden.json').read_text(encoding='utf-8'))['facts']
    chains = {c['id']: c for c in json.loads((ROOT / 'data/chains.json').read_text(encoding='utf-8'))['chains']}
    failed, limited = 0, []
    for f in facts:
        bad = check_data(f, chains)
        if args.online:
            try:
                text = source_text(f['source'])
                bad += [f'source {source_url(f["source"])} no longer shows {w!r}' for w in f['source']['contains'] if w not in text]
            except RateLimited as e:  # GitHub refused for quota: says nothing about the source, so not judged, and listed
                limited.append(f"{f['id']}: {source_url(f['source'])} ({e})")
            except Exception as e:  # any other source we cannot read is a failure: the fact is then unchecked
                bad.append(f'could not read {source_url(f["source"])}: {e}')
        if bad:
            failed += 1
            print(f"FAIL {f['id']}: {f['fact']}")
            for b in bad:
                print(f'  - {b}')
    if failed:
        print(f'\n{failed} of {len(facts)} golden facts no longer hold. If a fact really changed, update data/golden.json '
              'in the same pull request, with a new pinned source.')
        return 1
    if limited:
        print(f'Rate limited, not judged ({len(limited)} of {len(facts)} sources):')
        for x in limited:
            print(f'  - {x}')
    read = len(facts) - len(limited)
    print(f"OK: {len(facts)} golden facts hold in the data" + (f'; {read} of {len(facts)} pinned sources read online and still show them' if args.online else ''))
    return 0


if __name__ == '__main__':
    sys.exit(main())
