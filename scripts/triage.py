#!/usr/bin/env python3
"""Reply to a new submission or correction with an acknowledgement and automatic checks.

Runs from .github/workflows/triage.yml when an issue is opened. It reads the issue from
GITHUB_EVENT_PATH, never from the command line. It checks that the links open and looks for
an existing entry with the same name or ticker. It does not verify any claim.

Local dry run:  TRIAGE_DRY_RUN=1 GITHUB_EVENT_PATH=event.json python3 scripts/triage.py

After a listing is merged and live, the maintainer's closing reply, with the chain's page and badge code:
    python3 scripts/triage.py --approved <chain id> [--lang zh]
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
REPLY_DAYS, DECISION_DAYS = 2, 3
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
        lines.append(f"Thanks for the submission. It's in the review queue, and a maintainer will reply within {REPLY_DAYS} days; a review decision usually comes within {DECISION_DAYS} days. "
                     f"Each claim is checked against its sources before anything is listed ([what gets listed]({REPO_URL}#submit-a-project)).")
    else:
        lines.append(f"Thanks for the correction. A maintainer will reply within {REPLY_DAYS} days and check it against the sources; a decision usually comes within {DECISION_DAYS} days.")
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


def approved_reply(chain_id, lang='en'):
    """The reply that closes an accepted submission: where the chain is listed, its stage, and the live badge code
    the project can put in its README or on its website (the badge updates itself and carries the credit)."""
    sys.path.insert(0, str(ROOT / 'scripts'))
    from embeds import SITE_URL, snippets
    chains = json.loads((ROOT / 'data/chains.json').read_text(encoding='utf-8'))['chains']
    v = next((c for c in chains if c['id'] == chain_id), None)
    if not v:
        sys.exit(f'no chain "{chain_id}" in data/chains.json')
    s = snippets(v, lang)
    if lang == 'zh':
        name = v.get('zh_name') or v['name']
        sp = ' ' if name[-1].isascii() else ''
        return (f"{name}{sp}已收录，现在是第 {v['stage']} 档：{s['page']}\n\n"
                f"档位依据和出处都写在页面上；以后有新进展，附上原始出处提一个纠错就行。\n\n"
                f"想在 README 或官网上展示，可以用下面的徽章。它会随数据自动更新，并自带署名：\n\n"
                f"```markdown\n{s['md']}\n```\n\n网页用：\n\n```html\n{s['html']}\n```\n\n"
                f"更多样式（卡片、英文版）见数据页：{SITE_URL}zh/data/#embed\n\n谢谢提交！")
    return (f"{v['name']} is now listed at stage {v['stage']}: {s['page']}\n\n"
            f"The page shows what the stage rests on and links each source. When something changes, open a correction with a primary source.\n\n"
            f"To show it in your README or on your website, use the badge below. It updates with the data and carries the credit:\n\n"
            f"```markdown\n{s['md']}\n```\n\nOn a web page:\n\n```html\n{s['html']}\n```\n\n"
            f"More styles (a card, a Chinese version) are on the data page: {SITE_URL}data/#embed\n\nThanks for the submission!")


def main():
    if '--approved' in sys.argv:
        i = sys.argv.index('--approved')
        lang = sys.argv[sys.argv.index('--lang') + 1] if '--lang' in sys.argv else 'en'
        print(approved_reply(sys.argv[i + 1], lang))
        return
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
