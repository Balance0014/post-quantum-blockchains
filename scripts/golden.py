#!/usr/bin/env python3
"""Golden regression: ten hand-checked facts that data/chains.json must keep stating.

Each fact in data/golden.json lists what the data must say (a stage, a date, words in a milestone) and the pinned
primary source that shows it. A data edit that drops or contradicts one of them fails CI, so a mistake in a large
edit cannot slip through quietly. When a fact really changes, update data/golden.json in the same pull request.

    python3 scripts/golden.py            # check the data (no network)
    python3 scripts/golden.py --online   # also check that each pinned source still shows the fact (GitHub API)
"""
import argparse
import base64
import json
import os
import ssl
import sys
import urllib.request
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


def source_text(src):
    if 'release' in src:
        rel = github(f"repos/{src['release']}/releases/tags/{src['tag']}")
        return f"{rel.get('name') or ''}\n{rel.get('body') or ''}"
    blob = github(f"repos/{src['repo']}/contents/{src['path']}?ref={src['ref']}")
    lines = base64.b64decode(blob['content']).decode('utf-8', 'replace').splitlines()
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
    failed = 0
    for f in facts:
        bad = check_data(f, chains)
        if args.online:
            try:
                text = source_text(f['source'])
                bad += [f'source {source_url(f["source"])} no longer shows {w!r}' for w in f['source']['contains'] if w not in text]
            except Exception as e:  # a source we cannot read is a failure too: the fact is then unchecked
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
    print(f"OK: {len(facts)} golden facts hold{' and their pinned sources still show them' if args.online else ''}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
