#!/usr/bin/env python3
"""Tell IndexNow (Bing, Yandex and other engines that share it) which pages the site has, after a deploy.

Reads the live sitemap and posts every page address with the site's key. The key is public by design:
it is served at <site>/<key>.txt so the engines can check the request comes from the site owner.
Run by .github/workflows/pages.yml after each deploy; no login needed.
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

SITE = 'https://balance0014.github.io/post-quantum-blockchains/'
KEY = (Path(__file__).resolve().parent / 'site' / 'indexnow-key.txt').read_text(encoding='utf-8').strip()


def main():
    with urllib.request.urlopen(SITE + 'sitemap.xml', timeout=30) as r:
        urls = re.findall(r'<loc>([^<]+)</loc>', r.read().decode('utf-8'))
    body = json.dumps({'host': 'balance0014.github.io', 'key': KEY, 'keyLocation': f'{SITE}{KEY}.txt',
                       'urlList': urls}).encode('utf-8')
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, method='POST',
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f'IndexNow answered {r.status} for {len(urls)} pages')


if __name__ == '__main__':
    sys.exit(main())
