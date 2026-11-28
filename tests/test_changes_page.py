#!/usr/bin/env python3
"""The weekly changes page, built from a fixture issue: it lists the issue's changes and, under "New on X", every
checked X post dated inside the issue's range and none older. Runs without network:

  python3 -B tests/test_changes_page.py
"""
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class ChangesPage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        chains = json.loads((ROOT / 'data/chains.json').read_text(encoding='utf-8'))['chains']
        posts = sorted(((c['id'], t) for c in chains for t in c.get('x_talk') or []), key=lambda p: p[1]['date'])
        assert len(posts) >= 3, 'needs at least three X posts in the data'
        # the range starts at the third-newest post's date, so some posts fall inside it and the rest outside
        since = posts[-3][1]['date']
        cls.inside = [t['url'] for _, t in posts if t['date'] >= since]
        cls.date = {t['url']: t['date'] for _, t in posts}
        cls.outside = [t['url'] for _, t in posts if t['date'] < since]
        cid = posts[-1][0]
        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        (tmp / 'changes').mkdir()
        issue = {'date': '2099-01-01', 'range': {'from': since, 'to': '2099-01-01'}, 'source': 'test', 'items': [
            {'date': since, 'chain': cid, 'type': 'code', 'stage': None, 'en': 'Fixture change for the test.',
             'zh': '测试用的变化。', 'url': 'https://github.com/Balance0014/post-quantum-blockchains'}]}
        (tmp / 'changes/2099-01-01.json').write_text(json.dumps(issue, ensure_ascii=False), encoding='utf-8')
        subprocess.run([sys.executable, '-B', str(ROOT / 'scripts/build_site.py'), '--out', str(tmp / 'site'),
                        '--changes', str(tmp / 'changes')], check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
        cls.html = {l: (tmp / 'site' / p / 'changes/index.html').read_text(encoding='utf-8') for l, p in (('en', ''), ('zh', 'zh'))}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def x_section(self, lang):
        m = re.search(r'<section class="xtalk xnew".*?</section>', self.html[lang], re.S)
        self.assertIsNotNone(m, f'{lang}: the changes page has a "New on X" section')
        return m.group(0)

    def test_lists_the_change(self):
        self.assertIn('Fixture change for the test.', self.html['en'])
        self.assertIn('测试用的变化。', self.html['zh'])

    def test_x_posts_in_range_and_only_those(self):
        for lang in ('en', 'zh'):
            sec = self.x_section(lang)
            for u in self.inside:
                self.assertIn(u, sec, f'{lang}: post inside the range is listed')
            for u in self.outside:
                self.assertNotIn(u, sec, f'{lang}: post older than the range is left out')

    def test_x_posts_newest_first_and_linked_to_their_chain(self):
        sec = self.x_section('en')
        order = sorted(self.inside, key=sec.find)
        self.assertEqual([self.date[u] for u in order], sorted((self.date[u] for u in order), reverse=True))
        self.assertGreaterEqual(sec.count('/chains/'), len(self.inside))


if __name__ == '__main__':
    unittest.main(verbosity=2)
