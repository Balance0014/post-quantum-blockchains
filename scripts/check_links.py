#!/usr/bin/env python3
"""Check that every source link in data/ still opens.

A link passes when it answers 200-399 (after redirects), or 405 (the server is up but wants another method,
as JSON-RPC endpoints do). Sites that refuse automated requests are listed in
data/link-allowlist.json with the reason; they are reported but do not fail the check. Network probes
(the RPC endpoints in chains.json, which only answer POST requests) are checked by patrol.py instead, and are
skipped here wherever they appear.

Usage:
  python3 scripts/check_links.py               # exit 1 on any broken link
  python3 scripts/check_links.py --report FILE # also write a Markdown report (used by the weekly patrol)
"""
import argparse
import json
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
FILES = ['chains.json', 'projects.json', 'sources.json', 'source-revision-checks.json']
SKIP_KEYS = {'probe'}
UA = 'post-quantum-blockchains-link-check/1.0 (+https://github.com/Balance0014/post-quantum-blockchains)'
PER_HOST = 3
_host_locks = {}
_host_guard = threading.Lock()


def collect():
    """Every http(s) link in the data files, with the first place it appears."""
    found = {}

    def walk(x, path):
        if isinstance(x, dict):
            for k, v in x.items():
                if k not in SKIP_KEYS:
                    walk(v, f'{path}.{k}')
        elif isinstance(x, list):
            for i, v in enumerate(x):
                walk(v, f'{path}[{i}]')
        elif isinstance(x, str) and x.startswith(('http://', 'https://')) and ' ' not in x:
            found.setdefault(x, path)

    probes = set()
    for name in FILES:
        f = DATA / name
        if f.exists():
            data = json.loads(f.read_text(encoding='utf-8'))
            walk(data, name)
            if name == 'chains.json':
                for c in data['chains']:
                    probe = c['network'].get('probe') or {}
                    probes.update(u.rstrip('/') for u in [probe.get('url')] + [s.get('url') for s in probe.get('steps', [])] if u)
    return {u: w for u, w in found.items() if u.rstrip('/') not in probes}


def allowlist():
    entries = json.loads((DATA / 'link-allowlist.json').read_text(encoding='utf-8'))['hosts']
    for e in entries:
        if not e.get('reason'):
            raise SystemExit(f"link-allowlist.json: {e.get('host')} has no reason")
    return {e['host']: e['reason'] for e in entries}


def host_slot(host):
    with _host_guard:
        return _host_locks.setdefault(host, threading.BoundedSemaphore(PER_HOST))


def fetch(url):
    """Return (status, note). Status 0 means the request did not complete."""
    last = (0, '')
    for attempt in range(2):
        for method in ('HEAD', 'GET'):
            req = urllib.request.Request(url, method=method, headers={'User-Agent': UA, 'Accept': '*/*'})
            try:
                with host_slot(urlparse(url).netloc):
                    with urllib.request.urlopen(req, timeout=20) as r:
                        return r.status, ''
            except urllib.error.HTTPError as e:
                last = (e.code, e.reason if isinstance(e.reason, str) else '')
                if e.code in (404, 410) and method == 'GET':
                    return last
            except Exception as e:  # timeouts, TLS and DNS errors
                last = (0, type(e).__name__ + ': ' + str(e)[:120])
        time.sleep(2 + 4 * attempt)
    return last


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--report')
    args = ap.parse_args()
    links = collect()
    allowed = allowlist()
    with ThreadPoolExecutor(max_workers=16) as pool:
        results = dict(zip(links, pool.map(fetch, links)))
    broken, excused = [], []
    for url, (status, note) in sorted(results.items()):
        if 200 <= status < 400 or status == 405:
            continue
        host = urlparse(url).netloc
        row = (url, status, note, links[url])
        (excused if host in allowed else broken).append(row)
    print(f'{len(links)} links checked: {len(links) - len(broken) - len(excused)} open, '
          f'{len(excused)} on allowlisted hosts did not answer, {len(broken)} broken')
    for url, status, note, where in excused:
        print(f'  allowlisted {status or note}: {url} ({allowed[urlparse(url).netloc]})')
    for url, status, note, where in broken:
        print(f'  BROKEN {status or note}: {url} (in {where})')
    if args.report:
        lines = [f'{len(links)} source links checked on {time.strftime("%Y-%m-%d", time.gmtime())}; '
                 f'{len(broken)} broken.', '']
        if broken:
            lines += ['| Link | Answer | Where |', '|---|---|---|']
            lines += [f'| {u} | {s or n} | `{w}` |' for u, s, n, w in broken]
        Path(args.report).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    sys.exit(1 if broken else 0)


if __name__ == '__main__':
    main()
