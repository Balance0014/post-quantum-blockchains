#!/usr/bin/env python3
"""Reply to a new submission or correction with an acknowledgement and automatic checks.

Runs from .github/workflows/triage.yml when an issue is opened. It reads the issue from
GITHUB_EVENT_PATH, never from the command line. It checks that the links open and looks for
an existing entry with the same name or ticker. It does not verify any claim.

Local dry run:  TRIAGE_DRY_RUN=1 GITHUB_EVENT_PATH=event.json python3 scripts/triage.py
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_URL = 'https://github.com/Balance0014/post-quantum-blockchains'
MAX_LINKS = 15
REVIEW_DAYS = 7
URL_RE = re.compile(r'https?://[^\s<>()\[\]"\'`]+')


def section(body, heading):
    """Text under a '### heading' block of an issue-form body."""
    m = re.search(r'^###\s+' + re.escape(heading) + r'\s*$(.*?)(?=^###\s|\Z)', body, re.M | re.S)
    return m.group(1).strip() if m else ''


def links(body):
    seen = []
    for url in URL_RE.findall(body):
        url = url.rstrip('.,;:')
        if url not in seen:
            seen.append(url)
    return seen


def check(url):
    """Return None if the URL opens, else a short reason."""
    if not url.startswith('https://'):
        return 'not https'
    headers = {'User-Agent': 'post-quantum-blockchains-triage (+%s)' % REPO_URL}
    for method in ('HEAD', 'GET'):
        req = urllib.request.Request(url, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                if r.status < 400:
                    return None
        except urllib.error.HTTPError as e:
            if method == 'HEAD' and e.code in (403, 404, 405, 429, 501):
                continue  # some sites refuse HEAD; retry with GET
            return 'HTTP %d' % e.code
        except Exception as e:  # timeout, DNS, TLS
            return type(e).__name__
    return 'did not open'


def words(text):
    return {w for w in re.findall(r'[a-z0-9]+', text.lower()) if len(w) > 1}


def matches(name_field):
    """Existing projects whose name, ticker or ID appears in the submitted name."""
    projects = json.loads((ROOT / 'data/projects.json').read_text(encoding='utf-8'))['projects']
    submitted = words(name_field)
    found = []
    for p in projects:
        name_words = words(p['name'])
        if (name_words and name_words <= submitted) or p['ticker'].lower() in submitted:
            found.append(p)
    return found


def comment_for(issue):
    labels = {l['name'] for l in issue.get('labels', [])}
    body = issue.get('body') or ''
    if 'project submission' in labels:
        kind = 'submission'
    elif 'correction' in labels:
        kind = 'correction'
    else:
        return None
    lines = []
    if kind == 'submission':
        lines.append(f"Thanks for the submission. It's in the review queue, and a maintainer will reply within {REVIEW_DAYS} days. "
                     f"Each claim is checked against its sources before anything is listed ([what gets listed]({REPO_URL}#submit-a-project)).")
    else:
        lines.append(f"Thanks for the correction. A maintainer will check it against the sources and reply within {REVIEW_DAYS} days.")
    lines += ['', '**Automatic checks** (these don\'t verify any claim):', '']
    urls = links(body)
    if not urls:
        lines.append('- Links: none found. Please add the primary sources by editing the issue.')
    else:
        checked = urls[:MAX_LINKS]
        bad = [(u, r) for u, r in ((u, check(u)) for u in checked) if r]
        ok = len(checked) - len(bad)
        lines.append(f"- Links: {ok} of {len(checked)} opened." + (' Please check these:' if bad else ''))
        lines += [f"  - {u} ({r})" for u, r in bad]
        if len(urls) > MAX_LINKS:
            lines.append(f"  - Only the first {MAX_LINKS} links were checked.")
    if kind == 'submission':
        name = section(body, 'Project name and ticker')
        found = matches(name) if name else []
        if found:
            listed = ', '.join(f"[{p['name']} ({p['ticker']})]({REPO_URL}/blob/main/docs/projects.md#{p['id']})" for p in found)
            lines.append(f"- Already listed: possible match with {listed}. If this updates that entry, say what changed.")
        else:
            lines.append('- Already listed: no match by name or ticker.')
    return '\n'.join(lines)


def post(issue, text):
    token = os.environ['GITHUB_TOKEN']
    req = urllib.request.Request(issue['comments_url'], data=json.dumps({'body': text}).encode(), method='POST',
                                 headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
                                          'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'post-quantum-blockchains-triage'})
    with urllib.request.urlopen(req, timeout=30) as r:
        print('commented:', json.load(r)['html_url'])


def main():
    event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text(encoding='utf-8'))
    issue = event['issue']
    text = comment_for(issue)
    if text is None:
        print('not a submission or correction; nothing to do')
        return
    if os.environ.get('TRIAGE_DRY_RUN'):
        print(text)
    else:
        post(issue, text)


if __name__ == '__main__':
    sys.exit(main())
