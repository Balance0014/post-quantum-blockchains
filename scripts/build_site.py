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
import embeds
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
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_SRC = ROOT / 'scripts' / 'site'
REPO = 'https://github.com/Balance0014/post-quantum-blockchains'
ORIGIN = 'https://balance0014.github.io'

CHIPS = {
    'fips204': {'tone': 'std', 'en': 'ML-DSA · NIST FIPS 204', 'zh': 'ML-DSA · NIST 标准 FIPS 204'},
    'fips205': {'tone': 'std', 'en': 'SLH-DSA · NIST FIPS 205', 'zh': 'SLH-DSA · NIST 标准 FIPS 205'},
    'falcon': {'tone': 'std', 'en': 'Falcon · NIST-selected (FN-DSA)', 'zh': 'Falcon · NIST 选定（FN-DSA）'},
    'xmss': {'tone': 'std', 'en': 'XMSS · IETF RFC 8391, NIST SP 800-208', 'zh': 'XMSS · IETF 标准 RFC 8391、NIST SP 800-208'},
    'family': {'tone': 'fam', 'en': 'NIST family · pre-standard version or parameters not reviewed', 'zh': 'NIST 同族 · 标准前版本或参数未核'},
    'sphincs': {'tone': 'fam', 'en': 'SPHINCS+ · basis of SLH-DSA', 'zh': 'SPHINCS+ · SLH-DSA 的前身'},
    'wots': {'tone': 'warn', 'en': 'Hash-based · not a standard on its own', 'zh': '哈希签名 · 单独使用无对应标准'},
    'nonstd': {'tone': 'warn', 'en': 'Not a NIST standard', 'zh': '非 NIST 标准'},
    'custom': {'tone': 'warn', 'en': 'Custom construction', 'zh': '项目自研构造'},
    'broken': {'tone': 'bad', 'en': 'Still accepts publicly broken legacy parameters', 'zh': '仍接受已被攻破的旧参数'},
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


# Standard status is given per scheme, not per chain: a chain that names ML-DSA and Falcon gets one label for each.
# 'var' marks a variant or pre-standard version of a NIST scheme whose version no outside body has reviewed. Publicly
# a protocol that still accepts a publicly broken parameter set is a separate flag (the 'broken' label), not a standard status.
STATUSES = ('std', 'sel', 'var', 'hash', 'custom', 'none')
SCHEME_NAMES = {'mldsa': 'ML-DSA', 'falcon': 'Falcon', 'slhdsa': 'SLH-DSA', 'xmss': 'XMSS', 'wots': 'WOTS+',
                'other': None, 'none': None}


def schemes(c):
    """[(scheme, status)] in the order the chain names them."""
    chips, text = set(c['algo_chips']), (c['algo'].get('en') or '').lower()
    out = []
    add = lambda k, st: out.append((k, st)) if (k, st) not in out else None
    variant = 'variant' in text or "project's own" in text
    if 'fips204' in chips:
        add('mldsa', 'std')
    if 'falcon' in chips:
        add('falcon', 'var' if 'falcon' in text and variant and 'family' not in chips else 'sel')
    if 'fips205' in chips:
        add('slhdsa', 'std')
    if 'sphincs' in chips:
        add('slhdsa', 'sel')
    if 'family' in chips:
        for k, words in (('mldsa', ('dilithium',)), ('falcon', ('falcon',)), ('slhdsa', ('sphincs',))):
            if any(w in text for w in words):
                out[:] = [x for x in out if x[0] != k]
                add(k, 'var')
    if 'nonstd' in chips:
        if any(w in text for w in ('slh-dsa', 'sphincs')):
            add('slhdsa', 'var')
        elif any(w in text for w in ('xmss', 'wots', 'winternitz')):
            add('xmss', 'var')
        else:
            add('other', 'custom')
    if 'xmss' in chips:
        add('xmss', 'hash')
    if 'wots' in chips:
        add('wots', 'hash')
    if 'custom' in chips:
        add('other', 'custom')
    if not out:
        add('none', 'none')
    return out


# The algorithm map sorts each scheme into NIST's mathematical family and colours it by its NIST status (the
# NIST record as of 2026-11-28: FIPS 204 and 205 final since 2024-08-13; FN-DSA selected, FIPS 206 in development;
# SP 800-208 final since 2020-10-29 for LMS and XMSS; the additional-signature call in round 3 since 2026-05-14).
# A variant keeps the status of the scheme it varies, with a mark that NIST has not reviewed this version.
NIST_FAMILIES = ('lattice', 'hash', 'multivariate', 'code', 'isogeny', 'mpcith', 'symmetric')
NIST_STATUS = ('fips', 'draft', 'sp800208', 'round3', 'dropped', 'broken', 'notnist')
OWN_FAMILY = (('multivariate', ('multivariate', 'rainbow', 'uov')), ('lattice', ('lattice', 'ringct', 'dilithium', 'falcon')),
              ('hash', ('hash', 'poseidon', 'stark', 'preimage', 'wots', 'xmss', 'sphincs')))


def nist_map(c):
    """[{fam, scheme, st, var}] for the algorithm map: one entry per scheme the chain uses or proposes."""
    text = (c['algo'].get('en') or '').lower()
    out = []
    for k, st in schemes(c):
        if k == 'none':
            continue
        if k == 'other':
            # Raqcoin: Rainbow, a NIST round 3 finalist not advanced in 2022 (its round-2 SL1 parameters were practically
            # broken; no source says every parameter set fails), and UOV with its own parameters
            if 'rainbow' in text:
                out.append({'fam': 'multivariate', 'scheme': 'Rainbow', 'st': 'dropped', 'var': False})
                if 'uov' in text:
                    out.append({'fam': 'multivariate', 'scheme': 'UOV', 'st': 'round3', 'var': True})
                continue
            fam = next((f for f, words in OWN_FAMILY if any(w in text for w in words)), None)
            out.append({'fam': fam or 'other', 'scheme': None, 'st': 'notnist', 'var': False})
            continue
        fam = 'lattice' if k in ('mldsa', 'falcon') else 'hash'
        scheme = {'mldsa': 'ML-DSA', 'falcon': 'Falcon', 'slhdsa': 'SLH-DSA', 'xmss': 'XMSS', 'wots': 'WOTS+'}[k]
        nst = {'mldsa': 'fips', 'falcon': 'draft', 'slhdsa': 'fips', 'xmss': 'sp800208', 'wots': 'notnist'}[k]
        out.append({'fam': fam, 'scheme': scheme, 'st': nst, 'var': st in ('var', 'sel') and k == 'slhdsa' and 'fips205' not in c['algo_chips'] or st == 'var'})
    return out


def standard_status(c):
    """The chain's best standard status, used where one value is needed (the security level, the sort order)."""
    sts = {st for _, st in schemes(c)}
    return next(st for st in STATUSES if st in sts)


# Parameter sets named in the algorithm text, with their NIST security category (FIPS 204 and 205, the Falcon
# specification) and the reference size id in data/signature-sizes.json.
PARAMS = ((r'ML-DSA-44', 'ML-DSA-44', 2, 'mldsa44'), (r'ML-DSA-65|Dilithium3', 'ML-DSA-65', 3, 'mldsa65'),
          (r'ML-DSA-87|Dilithium-5', 'ML-DSA-87', 5, 'mldsa87'), (r'Falcon-512', 'Falcon-512', 1, 'falcon512'),
          (r'Falcon-1024', 'Falcon-1024', 5, 'falcon1024'), (r'SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-128s', 1, 'slh128s'),
          (r'SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-128s', 1, 'slh128s'))


def algo_params(c, sizes):
    """Security level and reference sizes of the parameter sets the chain's algorithm text names.
    A project's own construction or variant is 'unassessed': we do not rate a scheme no outside body has reviewed."""
    st = standard_status(c)
    if st in ('custom', 'var'):
        return {'level': 'unassessed', 'params': []}
    if st == 'none':
        return {'level': None, 'params': []}
    text = c['algo']['en'].replace('Falcon-512/1024', 'Falcon-512, Falcon-1024')
    # validator-only signatures (e.g. block seals) are not holders' signatures and carry no level here
    text = '; '.join(part for part in text.split('; ') if 'validator' not in part.lower())
    # "ML-DSA-44/65/87" names three parameter sets
    text = re.sub(r'ML-DSA-(\d+)((?:/\d+)+)', lambda m: ', '.join('ML-DSA-' + n for n in [m.group(1)] + m.group(2).strip('/').split('/')), text)
    found = []
    for pat, label, cat, sid in PARAMS:
        m = re.search(pat, text)
        if m:
            s = sizes.get(sid) or {}
            found.append((m.start(), {'name': label, 'level': cat, 'pk': s.get('public_key_bytes'), 'sig': s.get('signature_bytes')}))
    # XMSS: no reference size unless the entry names the parameter set the mainnet uses (tree height and hash).
    params = [p for _, p in sorted(found, key=lambda x: x[0])]
    levels = sorted({p['level'] for p in params if p['level']})
    # A family the chain names without a parameter set (e.g. "ML-DSA" beside "Falcon-512") is listed as open,
    # so a level found for one family is never read as covering the other.
    chips, named = set(c['algo_chips']), {p['name'].split('-')[0] for p in params}
    fams = [('ML-DSA', 'fips204' in chips), ('Falcon', 'falcon' in chips), ('SLH-DSA', bool(chips & {'fips205', 'sphincs'}))]
    open_ = [f for f, used in fams if used and f.split('-')[0] not in named]
    # a script that accepts every FIPS 205 parameter set covers categories 1, 3 and 5
    if not levels and re.search(r'all 12 parameter sets', text) and 'fips205' in c['algo_chips']:
        return {'level': [1, 3, 5], 'params': [], 'open': []}
    if not levels:
        return {'level': 'not_stated', 'params': params, 'open': []}
    return {'level': levels, 'params': params, 'open': open_}


HYBRID = re.compile(r'\bhybrid\b|paired with', re.I)
COVERAGE = {5: 'default', 4: 'optin', 3: 'testnet'}
DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')
MONTH = re.compile(r'^\d{4}-\d{2}(-\d{2})?$')


def progress(c, checked):
    """Post-quantum progress recorded on this site: dated milestones that are post-quantum events under docs/stages.md
    (not our own checks, and not entries marked progress: false, such as ordinary releases, comments or target dates).
    n90 counts those with a primary source in the 90 days to the check date; latest is the newest of any grade."""
    today = date.fromisoformat(checked)
    ev = [m for m in c.get('milestones', []) if m.get('verified', True) and not m.get('checked') and m.get('progress', True) and MONTH.match(m.get('date') or '')]
    age = lambda m: (today - date.fromisoformat(m['date'] if DAY.match(m['date']) else m['date'] + '-15')).days
    n90 = sum(1 for m in ev if m.get('grade', 'primary') == 'primary' and 0 <= age(m) <= 90)
    y1 = any(0 <= age(m) <= 365 for m in ev)
    last = max(ev, key=lambda m: m['date'], default=None)
    latest = {'date': last['date'], 'en': last['name'], 'zh': last.get('zh'), 'grade': last.get('grade', 'primary'),
              'url': last.get('source_url'), 'type': last['type']} if last else None
    return {'n90': n90, 'y1': y1, 'latest': latest}


def field(c, key):
    """A researched field (migration, audit, exposure) as the page shows it, or None when not recorded."""
    x = c.get(key)
    if not x:
        return None
    return {k: x.get(k) for k in ('value', 'en', 'zh', 'source_url', 'grade', 'date', 'auditor', 'figure', 'figure_zh', 'publisher', 'publisher_zh') if x.get(k) is not None}


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
    'project foundation website': '项目基金会官网', 'project node API': '项目节点接口', 'project release record': '项目发布记录', 'project website': '项目官网',
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
           'data_title': 'Data, API and embeds · Post-Quantum Blockchains',
           'data_desc': 'Download the data, read it as a JSON API, embed a live badge or card for any chain, and see the license: CC BY-NC 4.0, free for commercial use with credit.',
           'changes_title': 'This week in post-quantum blockchains · Post-Quantum Blockchains',
           'changes_desc': 'What the weekly patrol found: new releases, proposal status changes, network status changes and stage changes, each with its source.',
           'x_title': 'What blockchains say about their quantum plans on X · Post-Quantum Blockchains',
           'x_desc': 'Posts on X from the last 90 days by official accounts and people with a public identity around each chain, about its post-quantum plans. Every original post opened and checked; claims only, they never change a stage.',
           'nf_title': 'Page not found · Post-Quantum Blockchains', 'nf_h': 'This page does not exist.', 'nf_p': 'The link may be old, or the chain may be listed under another name. Search the table or start from the overview.',
           'nf_search': 'Search chains, schemes or tickers', 'nf_go': 'Search', 'nf_all': 'All chains', 'nf_method': 'How we rate'},
    'zh': {'brand': '抗量子区块链进度表', 'other_lang': 'English', 'other_lang_label': 'Switch to English', 'gh': '数据在 GitHub', 'menu': '菜单', 'theme': '深色模式', 'og_locale': 'zh_CN',
           'home_title': '抗量子区块链进度表：哪些链已经能用抗量子签名',
           'home_desc': '比特币能抗量子吗？逐条核对出处的抗量子进度表，覆盖市值最大的区块链和原生抗量子链，共 {n} 条，每条评 0 到 5 档；网络数据每周巡查，出处每月重核。',
           'chain_title': '{name}{sp}能抗量子吗？抗量子进展、出处和核对日期',
           'chain_q': '{name}{sp}能抗量子吗？', 'og_alt': '抗量子区块链进度表：{n} 条链按 0 到 5 档评定，每条都对照原始出处核对。',
           'method_title': '评档方法 · 抗量子区块链进度表',
           'method_desc': '六个档位、评档规则、网络核查及其时限、算法标签、证据分级，以及每个数据字段的来源和脚本。',
           'data_title': '数据、接口和嵌入 · 抗量子区块链进度表',
           'data_desc': '下载数据、按 JSON 接口读取、给任意一条链嵌入实时更新的徽章或卡片，以及授权说明：CC BY-NC 4.0，署名即可免费商用。',
           'changes_title': '本周抗量子进展 · 抗量子区块链进度表',
           'changes_desc': '每周巡查发现的变化：新发布版本、提案状态、网络状态和档位调整，每条都附出处。',
           'x_title': '各条链在 X 上怎么谈抗量子 · 抗量子区块链进度表',
           'x_desc': '近 90 天各条链的官方号和有公开身份的人在 X 上谈抗量子计划的帖子，每条都打开原帖核对；只算说法，不改变档位。',
           'nf_title': '页面不存在 · 抗量子区块链进度表', 'nf_h': '这个页面不存在。', 'nf_p': '链接可能已经过时，或者这条链用的是另一个名字。可以在表格里搜索，或者从总览开始。',
           'nf_search': '搜索链、签名方案或代码', 'nf_go': '搜索', 'nf_all': '全部链', 'nf_method': '评档方法'},
}


class ZhText(HTMLParser):
    """Collects the text a reader sees (text nodes, tooltips, labels), skipping scripts, styles and code samples."""
    def __init__(self):
        super().__init__()
        self.out, self.skip = [], 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'pre'):
            self.skip += 1
        self.out += [v for k, v in attrs if k in ('data-def', 'data-title', 'data-tip', 'aria-label', 'placeholder', 'title', 'content') and v]

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'pre'):
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
# forecast prices or tell anyone to buy or sell. Quoted titles and claims ("...", 「...」) are exempt, and so are
# names of things that are not verdicts: 安全审计 (security audit), 安全认证 (certification), 安全官 (a job title).
BANNED_EN = re.compile(r'\b(safe|safely|safety|guarantee[sd]?|quantum[- ]proof|unhackable|unbreakable|buy|sell|price target)\b', re.I)
BANNED_ZH = re.compile(r'安全(?!审计|认证|官)|防量子|买入|卖出|目标价|抄底|稳赚')
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


def chain_view(c, net, ranks, projects, sources, sizes, checked):
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
        code = {'repo': spec.get('repo'), 'host': spec.get('host'), 'host_name': spec.get('host_name'), 'mirrors': spec.get('mirrors') or [], 'note': spec.get('note'), 'c90': None, 'also': []}
        got = n.get('code') or {}
        if got and 'error' not in got:
            code.update(rel=got.get('release'), rel_date=got.get('release_date'), rel_pre=bool(got.get('prerelease')),
                        rel_tag=bool(got.get('tag_only')), c90=got.get('commits_90d'), last=got.get('last_commit'),
                        branch=got.get('branch'), bots=got.get('bot_commits_90d'), q=(got.get('queried_at_utc') or n.get('block', {}).get('queried_at_utc') or net.get('checked_at_utc')))
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
                         'kind': {'en': s['source_type'], 'zh': KIND_ZH[s['source_type']]}})
    for s in c.get('extra_sources') or []:
        srcs.append({'url': s['url'], 'label': short_url(s['url'])})
    ls = c['latest_step']
    bsrc = basis_source(c, projects, sources)
    bgrade = next((m.get('grade', 'primary') for m in c.get('milestones', []) if m.get('source_url') == bsrc), 'primary')
    since = c.get('pq_mainnet_since')
    return {
        'id': c['id'], 'name': c['name'], 'zh_name': c.get('zh_name'), 'ticker': c['ticker'], 'kind': c['kind'],
        'aliases': c.get('aliases') or [], 'pinyin': c.get('pinyin') or [],
        'group': group_of(c, rank), 'rank': rank, 'stage': c['stage'], 'algo': c['algo'], 'chips': c['algo_chips'], 'fam': families(c),
        'consensus': c.get('consensus'), 'holder': c['holder_can_use_today'], 'note': c.get('note'), 'four': c.get('four'),
        'latest': {'date': ls.get('date'), 'en': ls.get('text'), 'zh': ls.get('zh'), 'checked': bool(ls.get('is_check_date'))},
        'checked': (n.get('block', {}).get('queried_at_utc') or net.get('checked_at_utc') or '')[:10] or None,
        'reviewed': c['last_reviewed'], 'basis': c['stage_basis'],
        'x_talk': sorted(c.get('x_talk') or [], key=lambda t: t['date'], reverse=True),
        'basis_src': bsrc, 'basis_grade': bgrade,
        'since': since,
        'status': standard_status(c), 'schemes': schemes(c), 'nist': nist_map(c), 'ap': algo_params(c, sizes), 'hybrid': bool(HYBRID.search(c['algo']['en'])),
        'cov': COVERAGE.get(c['stage'], 'none'), 'mig': field(c, 'migration'), 'audit': field(c, 'audit'), 'expo': field(c, 'exposure'),
        'prog': progress(c, checked), 'scope': 'top' if rank is not None else 'other',
        'design': 'native' if c['kind'] == 'native' else ('upgraded' if c['stage'] >= 3 else 'notyet'), 'netw': 'mainnet' if c['network_status'] == 'mainnet' else 'testnet',
        'claim': bgrade == 'official' or bool(since and since.get('grade') == 'official'),
        'net': {'status': n.get('status', 'unknown'), 'threshold': n.get('threshold_min'), 'block': block, 'code': code,
                'reason': c['network'].get('no_probe_reason'), 'own': c['network'].get('source_kind'), 'check': xchk},
        'timeline': [{'date': m.get('date'), 'type': m['type'], 'grade': m.get('grade', 'primary'), 'en': m['name'], 'zh': m.get('zh'),
                      'status': m.get('status'), 'url': m.get('source_url'), 'checked': bool(m.get('checked')), 'np': m.get('progress') is False}
                     for m in c.get('milestones', []) if m.get('verified', True)],
        'unverified': c.get('unverified', []),
        'sources': srcs,
        'flags': evidence_flags(c, schemes(c), block, xchk, rank),
        'supply': c.get('supply'),
        'algo_note': c.get('algo_note'),
    }


def evidence_flags(c, sch, block, xchk, rank):
    """Where the evidence behind a stage 4 or 5 rating stops, shown beside the stage (the stage itself is not changed):
    the project's own construction, a variant no outside body has reviewed, no audit found, or network data that
    has no independent source (outside the top 100)."""
    if c['stage'] < 4:
        return []
    sts = {st for _, st in sch}
    f = [k for k in ('custom', 'var') if k in sts]
    if (c.get('audit') or {}).get('value') == 'none_found':
        f.append('noaudit')
    # only outside the top 100: the largest chains have many independent explorers even where we read the foundation's endpoint
    independent = (block.get('ok') and c['network'].get('source_kind') == 'community') or bool(xchk and xchk.get('ok'))
    if rank is None and not independent:
        f.append('projdata')
    return f


def min_css(css):
    """A small, safe CSS minifier: drops comments and the whitespace around punctuation (the stylesheet blocks the first paint)."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};,>])\s*', r'\1', css)
    css = re.sub(r':\s+', ':', css)
    return css.replace(';}', '}').strip() + '\n'


def css_blocks(css):
    """Split minified CSS into top-level blocks: (prelude, body). An at-rule's body is itself CSS."""
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        depth, k = 1, j + 1
        while depth and k < n:
            depth += {'{': 1, '}': -1}.get(css[k], 0)
            k += 1
        out.append((css[i:j].strip(), css[j + 1:k - 1]))
        i = k
    return out


def split_top(sel):
    """Split a selector list on commas that are not inside parentheses."""
    parts, depth, cur = [], 0, ''
    for ch in sel:
        depth += {'(': 1, ')': -1}.get(ch, 0)
        if ch == ',' and not depth:
            parts.append(cur)
            cur = ''
        else:
            cur += ch
    return parts + [cur]


# how much of a page's HTML counts as its first screen (on the home page: the answer, the figures and the first two charts)
CRITICAL_CHARS = 26000

# classes the script adds before or right after the first paint
RUNTIME_CLASSES = {'anim', 'in', 'enter', 'open', 'act', 'pinned', 'later'}


def sel_needs(sel):
    """The classes, ids and element names a selector needs; negations and pseudo-classes need nothing."""
    s = sel
    while True:
        t = re.sub(r'::?[\w-]+\([^()]*\)', '', s)
        if t == s:
            break
        s = t
    s = re.sub(r'\[[^\]]*\]', '', s)
    s = re.sub(r'::?[\w-]+', '', s)
    need = {('.', m) for m in re.findall(r'\.([\w-]+)', s)} | {('#', m) for m in re.findall(r'#([\w-]+)', s)}
    need |= {('t', m.lower()) for m in re.findall(r'(?:^|[\s>+~(])([a-zA-Z][a-zA-Z0-9]*)', s)}
    return need


def critical_css(css, first_html):
    """The rules the first screen can use: every selector whose classes, ids and elements all occur in first_html.
    The full stylesheet still loads (without blocking the first paint) and covers everything else."""
    have = {('.', c) for v in re.findall(r'class="([^"]*)"', first_html) for c in v.split()}
    have |= {('.', c) for c in RUNTIME_CLASSES}
    have |= {('#', i) for i in re.findall(r'id="([^"]*)"', first_html)}
    have |= {('t', t.lower()) for t in re.findall(r'<([a-zA-Z][a-zA-Z0-9]*)', first_html)} | {('t', 'html'), ('t', 'body')}

    def walk(text):
        out = []
        for pre, body in css_blocks(text):
            if pre.startswith(('@media', '@supports', '@layer')):
                inner = walk(body)
                if inner:
                    out.append(f'{pre}{{{inner}}}')
            elif pre.startswith('@'):
                out.append(f'{pre}{{{body}}}')
            else:
                keep = [x for x in split_top(pre) if sel_needs(x) <= have]
                if keep:
                    out.append(f'{",".join(keep)}{{{body}}}')
        return ''.join(out)
    return walk(css)


def meta_desc(text, lang):
    """A search-result description: whole sentences, up to about 155 characters (90 in Chinese, whose characters are
    wider); the first sentence always stays, so it never ends mid-sentence."""
    limit = 90 if lang == 'zh' else 155
    parts = re.split(r'(?<=[。！？])' if lang == 'zh' else r'(?<=[.!?])\s+(?=[A-Z0-9"“(])', text.strip())
    out = parts[0]
    for p in parts[1:]:
        nxt = out + ('' if lang == 'zh' else ' ') + p
        if len(nxt) > limit:
            break
        out = nxt
    return out


def one_lang(x, lang):
    """Keep only the page's language in an {en, zh} text (English stays as the fallback when Chinese is missing)."""
    if isinstance(x, dict) and 'en' in x and 'zh' in x:
        y = dict(x)
        if lang == 'en':
            y.pop('zh')
        elif y.get('zh'):
            y.pop('en')
        return y
    return x


X_DAYS = 90  # the home card and the x/ page count posts on X in this many days up to the network check


def x_stats(views, checked):
    """Posts on X in the X_DAYS before the check: the numbers on the home card and the x/ page, and the posts themselves."""
    day = date.fromisoformat(checked)
    since, since30 = (day - timedelta(days=X_DAYS)).isoformat(), (day - timedelta(days=30)).isoformat()
    posts = sorted(({**t, 'chain': v['id']} for v in views for t in v['x_talk'] if since <= t['date'] <= checked),
                   key=lambda t: (t['date'], t['chain']), reverse=True)
    talk = [v for v in views if any(t['chain'] == v['id'] for t in posts)]
    top = [v for v in views if v['rank'] is not None]
    top_talk = [v for v in talk if v['rank'] is not None]
    stats = {'days': X_DAYS, 'chains': len(talk), 'posts': len(posts), 'accounts': len({t['who'] for t in posts}),
             'posts30': sum(1 for t in posts if t['date'] >= since30), 'usable': sum(1 for v in talk if v['stage'] >= 4),
             'rest_by_stage': [sum(1 for v in talk if v['stage'] == s) for s in range(4)],
             'top': len(top), 'top_talk': len(top_talk), 'top_usable': sum(1 for v in top_talk if v['stage'] >= 4)}
    return stats, posts


def home_view(v, lang):
    """The home page only needs what its table, blocks and charts show; everything else is on the chain's own page.
    Long texts carry only the page's language, to keep the page small."""
    n, b, code = v['net'], v['net']['block'], v['net']['code']
    keep = ('id', 'name', 'zh_name', 'aliases', 'pinyin', 'ticker', 'kind', 'group', 'rank', 'stage', 'algo', 'chips', 'fam', 'status', 'schemes', 'nist', 'hybrid',
            'cov', 'prog', 'scope', 'design', 'netw', 'claim', 'basis_grade', 'flags')
    h = {k: v[k] for k in keep}
    h['level'] = v['ap']['level']
    h['level_open'] = v['ap'].get('open') or []
    h['mig'] = {'value': v['mig']['value']} if v['mig'] else None
    h['audit'] = v['audit']['value'] if v['audit'] else None
    h['next'] = one_lang((v['four'] or {}).get('next'), lang) if v['stage'] == 3 else None
    if h['prog'].get('latest'):
        h['prog'] = dict(h['prog'], latest=one_lang(h['prog']['latest'], lang))
    h['since'] = {k: v['since'][k] for k in ('date', 'basis', 'grade')} if v['since'] else None
    h['net'] = {'status': n['status'], 'block': {'ok': bool(b.get('ok')), 'age': b.get('age'), 'url': bool(b.get('url'))},
                'code': {'repo': bool(code.get('repo')), 'c90': code.get('c90')} if code else None}
    return h


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
            if t['type'] in CHART_TYPES and re.match(r'^\d{4}-\d{2}(-\d{2})?$', d) and not t['checked'] and not t['np'] and d[:7] in counts:
                counts[d[:7]][CHART_TYPES.index(t['type'])] += 1
    return {'types': list(CHART_TYPES), 'months': [[k] + counts[k] for k in months]}


def milestone_events(views):
    """Every dated proposal, testnet and mainnet milestone that is a project event, as [date, type index, chain id], for
    the home chart that bins them by year, month or week in the browser."""
    ev = []
    for v in views:
        for t in v['timeline']:
            d = t.get('date') or ''
            if t['type'] in CHART_TYPES and MONTH.match(d) and not t['checked'] and not t['np']:
                ev.append([d, CHART_TYPES.index(t['type']), v['id']])
    return sorted(ev)


CSV_COLUMNS = ('id', 'name', 'ticker', 'group', 'kind', 'market_cap_rank', 'stage', 'stage_name', 'algorithm',
               'default_signature', 'standard_status', 'security_level', 'publicly_broken_parameters', 'coverage', 'migration', 'migration_source', 'audit', 'audit_source',
               'pq_progress_90d', 'latest_pq_progress', 'network_status', 'pq_mainnet_since', 'pq_mainnet_since_basis',
               'pq_mainnet_since_source', 'stage_basis', 'stage_source', 'last_reviewed', 'page')

CSV_STATUS = {'std': 'nist_standard', 'sel': 'nist_selected', 'var': 'variant_not_reviewed', 'hash': 'stateful_hash_based',
              'custom': 'own_construction', 'none': 'none'}


def status_csv(v):
    return '; '.join(f"{SCHEME_NAMES[k] or 'own'}={CSV_STATUS[st]}" if SCHEME_NAMES.get(k) or st == 'custom' else CSV_STATUS[st]
                     for k, st in v['schemes'])


def level_csv(ap):
    lv = ap['level']
    if lv is None or isinstance(lv, str):
        return lv or ''
    return ' / '.join(str(x) for x in lv) + ''.join(f'; {f} set not stated' for f in ap.get('open') or [])


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
        mig, aud, prog = v['mig'] or {}, v['audit'] or {}, v['prog']
        w.writerow([v['id'], v['name'], v['ticker'], v['group'], v['kind'], v['rank'] or '', v['stage'], STAGE_NAMES['en'][v['stage']],
                    v['algo']['en'], 'post-quantum' if v['stage'] == 5 else 'classical', status_csv(v), level_csv(v['ap']) if v['stage'] >= 3 else 'not_applicable',
                    'yes' if 'broken' in v['chips'] else '', v['cov'], mig.get('value', ''), mig.get('source_url', ''),
                    aud.get('value', ''), aud.get('source_url', ''), prog['n90'], (prog['latest'] or {}).get('date', ''),
                    v['net']['status'], s.get('date', ''), s.get('basis', ''), s.get('source_url', ''),
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
    lines.append(f'- [On X]({ORIGIN + base}x/): posts on X from the last {X_DAYS} days by official accounts and people with a public '
                 f'identity around each chain, about its post-quantum plans; each original post checked; claims only, they never change a stage')
    if has_changes:
        lines.append(f'- [This week]({ORIGIN + base}changes/): changes found by the weekly patrol')
    lines += ['',
             '## Data (CC BY-NC 4.0; free commercial use with the credit, see LICENSE)',
             f'- [chains.csv]({ORIGIN + base}data/chains.csv): one row per chain: stage, algorithm, default signature (post-quantum or classical), standard status per scheme '
             f'(nist_standard, nist_selected, variant_not_reviewed, stateful_hash_based, own_construction, none), publicly_broken_parameters (yes when the protocol still accepts a publicly broken parameter set), NIST security level, coverage '
             f'(default, opt-in, testnet, none), how existing coins move (migration), audit of the post-quantum code, '
             f'post-quantum milestones with a primary source in the last 90 days and the latest one, network status, '
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
        extra = ''.join(f'; {k} {x["value"].replace("_", " ")}' for k, x in (('migration', v['mig']), ('audit', v['audit'])) if x)
        lines.append(f"- [{v['name']} ({v['ticker']})]({page(v)}): stage {v['stage']}, {STAGE_NAMES['en'][v['stage']]}{since}{extra}")
    (out / 'llms.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def embed_urls(v, base):
    """Where a chain's page, badge and card live, in both languages."""
    o = ORIGIN + base
    return ({'en': f"{o}chains/{v['id']}/", 'zh': f"{o}zh/chains/{v['id']}/"},
            {'en': f"{o}badges/{v['id']}.svg", 'zh': f"{o}badges/zh/{v['id']}.svg"},
            {'en': f"{o}badges/card/{v['id']}.svg", 'zh': f"{o}badges/card/zh/{v['id']}.svg"})


def write_embeds(out, views, checked, release, base):
    """The API (data/chains/index.json and one file per chain) and the badge and card of every chain."""
    api = out / 'data' / 'chains'
    for sub in ('badges', 'badges/zh', 'badges/card', 'badges/card/zh'):
        (out / sub).mkdir(parents=True, exist_ok=True)
    api.mkdir(parents=True, exist_ok=True)
    index = []
    for v in views:
        page, badge, card = embed_urls(v, base)
        for lang in ('en', 'zh'):
            z = '/zh' if lang == 'zh' else ''
            (out / f'badges{z}' / f"{v['id']}.svg").write_text(embeds.badge_svg(v, STAGE_NAMES[lang], lang), encoding='utf-8')
            (out / f'badges/card{z}' / f"{v['id']}.svg").write_text(embeds.card_svg(v, STAGE_NAMES[lang], lang, checked), encoding='utf-8')
        doc = embeds.chain_api(v, STAGE_NAMES, checked, release['version'], page, badge, card)
        (api / f"{v['id']}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        index.append({k: doc[k] for k in ('id', 'name', 'zh_name', 'ticker', 'stage', 'group', 'market_cap_rank', 'last_reviewed')}
                     | {'json': f"{ORIGIN + base}data/chains/{v['id']}.json", 'page': page['en']})
    meta = {'schema': 'post-quantum-blockchains/index@1', 'version': release['version'], 'data_checked': checked,
            'license': 'CC BY-NC 4.0, free commercial use on conditions: ' + embeds.LICENSE_URL,
            'attribution': f'Data: {embeds.SITE_EN}, by {embeds.AUTHOR}', 'author': embeds.AUTHOR_URL, 'chains': index}
    (api / 'index.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


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


def site_views():
    """Every chain as the pages show it, read from data/: (chains.json, market caps, market-cap date, check date, views)."""
    data = load('data/chains.json')
    net = load('data/network.json', {})
    mc = load('data/market_cap.json')
    ranks = {x['id']: x['rank'] for x in mc['coins']} if mc else None
    mcap_date = (mc or data['market_cap'])['queried_at_utc'][:10]
    projects = {p['id']: p for p in load('data/projects.json')['projects']}
    sources = {s['id']: s for s in load('data/sources.json')['sources']}
    sizes = {p['id']: p for p in load('data/signature-sizes.json')['parameters']}
    checked = (net.get('checked_at_utc') or '')[:10] or max(c['last_reviewed'] for c in data['chains'])
    views = [chain_view(c, net, ranks, projects, sources, sizes, checked) for c in data['chains']]
    today = date.fromisoformat(checked)
    for v in views:
        v['stale_days'] = (today - date.fromisoformat(v['reviewed'])).days
    return data, mc, mcap_date, checked, views


def headline(views, checked):
    """The three figures on the home page, counted once: the website's cards and the README summaries both read them."""
    top = [v for v in views if v['rank'] is not None]
    usable_top = sorted((v for v in top if v['stage'] >= 4), key=lambda v: v['rank'])
    use = [v for v in views if v['stage'] >= 4]
    default = sum(1 for v in use if v['stage'] == 5)
    nm = lambda v: {'en': v['name'], 'zh': v['zh_name'] or v['name']}
    return {'checked': checked, 'top': len(top), 'usable_top': [nm(v) for v in usable_top],
            'all': len(views), 'use': len(use), 'default': default, 'optin': len(use) - default, 'x': x_stats(views, checked)[0],
            # for "How the home page numbers are counted" on the method page
            'big': [dict(nm(v), stage=v['stage']) for v in sorted((v for v in top if v['rank'] <= 2), key=lambda v: v['rank'])],
            'dated': sum(1 for v in use if v['since']), 'nat_mig': sum(1 for v in views if v['mig'] and v['mig']['value'] == 'native'),
            'not_nat': [nm(v) for v in use if v['stage'] == 5 and not (v['mig'] and v['mig']['value'] == 'native')]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='_site')
    ap.add_argument('--base', default='/post-quantum-blockchains/')
    ap.add_argument('--changes', default='data/changes', help='folder of weekly issues (tests pass a fixture folder)')
    args = ap.parse_args()
    base = args.base if args.base.endswith('/') else args.base + '/'
    out = (ROOT / args.out).resolve()

    data, mc, mcap_date, checked, views = site_views()
    changes_dir = ROOT / args.changes
    changes = sorted((json.loads(p.read_text(encoding='utf-8')) for p in changes_dir.glob('*.json')),
                     key=lambda x: x['date'], reverse=True) if changes_dir.exists() else []
    head = headline(views, checked)
    xs, xposts = head['x'], x_stats(views, checked)[1]
    months = milestone_months(views, checked)
    events = milestone_events(views)
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
    asset_src['style.css'] = min_css(asset_src['style.css'].decode('utf-8')).encode('utf-8')
    css_text = asset_src['style.css'].decode('utf-8')
    version = hashlib.sha256(b''.join(asset_src.values())).hexdigest()[:10]
    page_tpl = (SITE_SRC / 'page.html').read_text(encoding='utf-8')

    def path_for(lang, p):
        return base + ('zh/' if lang == 'zh' else '') + p

    pages = []  # (lang, rel path, page kind, title, description, window.PQ data, json-ld)
    for lang in ('en', 'zh'):
        t = TEXT[lang]
        common = {'lang': lang, 'base': base, 'repo': REPO, 'chips': CHIPS, 'checked': checked, 'mcap_date': mcap_date,
                  'has_changes': bool(changes), 'data_url': REPO + '/tree/main/data', 'chain_count': len(views),
                  'release': release, 'examples': examples, 'site_url': ORIGIN + path_for(lang, ''), 'site_root': ORIGIN + path_for('en', '')}
        home = dict(common, page='home', xs=xs, head=head, chains=[home_view(v, lang) for v in views], months=months, events=events)
        ld = {'@context': 'https://schema.org', '@type': 'Dataset', 'name': t['brand'],
              'description': t['home_desc'].format(n=len(views)), 'url': ORIGIN + path_for(lang, ''),
              'isAccessibleForFree': True, 'license': 'https://creativecommons.org/licenses/by-nc/4.0/', 'dateModified': checked,
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
            page_u, badge_u, card_u = embed_urls(v, base)
            pages.append((lang, f"chains/{v['id']}/", dict(common, page='chain', chains=[v], embed={'page': page_u, 'badge': badge_u, 'card': card_u}),
                          t['chain_title'].format(name=nm, sp=sp), desc, ld))
        pages.append((lang, 'method/', dict(common, page='method', chains=[], left_out=left_out, head=head), t['method_title'], t['method_desc'], None))
        pick = [{'id': v['id'], 'name': v['name'], 'zh_name': v['zh_name'], 'ticker': v['ticker'], 'stage': v['stage'], 'rank': v['rank']} for v in views]
        pages.append((lang, 'data/', dict(common, page='data', chains=[], pick=pick, origin=ORIGIN), t['data_title'], t['data_desc'], None))
        pages.append((lang, 'x/', dict(common, page='x', chains=[], names=names, xs=xs,
                                       xposts=[dict(t, summary=one_lang(t['summary'], lang), relation=one_lang(t['relation'], lang)) for t in xposts]),
                      t['x_title'], t['x_desc'], None))
        if changes:
            since = changes[0]['range']['from']
            xnew = sorted(({**t, 'chain': v['id']} for v in views for t in v['x_talk'] if t['date'] >= since), key=lambda t: t['date'], reverse=True)
            pages.append((lang, 'changes/', dict(common, page='changes', chains=[], changes=changes, names=names, xnew=xnew),
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
    write_embeds(out, views, checked, release, base)
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
            'html_lang': 'zh-Hans' if lang == 'zh' else 'en', 'title': esc(title), 'description': esc(meta_desc(desc, lang) if d['page'] == 'chain' else desc),
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
        # the first screen's rules are inlined; the full stylesheet loads without blocking the first paint
        fill['css'] = '\x00css\x00'
        page = re.sub(r'\{\{(\w+)\}\}', lambda m: str(fill[m.group(1)]), page_tpl)
        crit = critical_css(css_text, page[page.index('<body>'):page.index('<main>') + 6] + r['app'][:CRITICAL_CHARS])
        sheet = f'{base}assets/style.css?v={version}'
        css = (f'<style>{crit}</style><link rel="preload" href="{sheet}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">'
               f'<noscript><link rel="stylesheet" href="{sheet}"></noscript>')
        page = page.replace('\x00css\x00', css)
        dest = out / ('zh' if lang == 'zh' else '') / rel / 'index.html'
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(page, encoding='utf-8')
        if lang == 'zh':
            zh_errors += [f'zh/{rel}: {e}' for e in zh_punctuation_errors(page)]
        tp = ZhText()
        tp.feed(page)
        zh_errors += [f'{lang}/{rel}: banned word "{w}"' for w in banned_words(' '.join(tp.out))]

    # 404 page (GitHub Pages serves /404.html for any missing path): the site header, both languages, a search that
    # opens the table filtered by the missing path's last word, and links back. Absolute links: it is served at any depth.
    def nf_block(l):
        t, home = TEXT[l], path_for(l, '')
        return (f'<section class="nf-l" lang="{l}"><h1>{esc(t["nf_h"])}</h1><p>{esc(t["nf_p"])}</p>'
                f'<form class="nf-q" action="{home}" role="search" data-home="{home}"><label class="sr" for="nfq-{l}">{esc(t["nf_search"])}</label>'
                f'<input id="nfq-{l}" name="q" type="search" placeholder="{esc(t["nf_search"])}" autocomplete="off">'
                f'<button class="btn primary" type="submit">{esc(t["nf_go"])}</button></form>'
                f'<div class="row"><a class="btn" href="{home}#chains">{esc(t["nf_all"])}</a>'
                f'<a class="btn quiet" href="{path_for(l, "method/")}">{esc(t["nf_method"])}</a></div></section>')
    t = TEXT['en']
    (out / '404.html').write_text(
        '<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
        '<meta name="color-scheme" content="dark light"><meta name="robots" content="noindex">'
        '<script>try{var t=localStorage.getItem("pq-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>'
        f'<title>{esc(t["nf_title"])}</title><link rel="icon" href="{base}assets/logo.svg" type="image/svg+xml">'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&family=Space+Grotesk:wght@500;600&display=swap">'
        f'<link rel="stylesheet" href="{base}assets/style.css?v={version}"></head><body>'
        f'<header class="top"><div class="wrap"><a class="brand" href="{base}">{LOGO_SVG}<span class="bn">{esc(t["brand"])}</span></a>'
        f'<div class="tools"><a class="btn primary" href="{REPO}" target="_blank" rel="noopener">{esc(t["gh"])} ↗</a></div></div></header>'
        f'<main><div class="wrap nf"><div class="code" aria-hidden="true">404</div>{nf_block("en")}{nf_block("zh")}</div></main>'
        # The table reads its filters from the address hash; prefill the search with the missing path's last word.
        '<script>(function(){var w=decodeURIComponent(location.pathname).split("/").filter(Boolean).pop()||"";'
        'w=w.replace(/\\.html?$/,"").replace(/[-_]+/g," ").slice(0,40);'
        'document.querySelectorAll(".nf-q").forEach(function(f){var i=f.querySelector("input");if(w&&!/^(chains|zh|method|\\d+)$/.test(w))i.value=w;'
        'f.addEventListener("submit",function(e){e.preventDefault();var q=i.value.trim();'
        'location.href=f.dataset.home+(q?"#chains?q="+encodeURIComponent(q):"#chains")})})})()</script>'
        '</body></html>\n', encoding='utf-8')

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
