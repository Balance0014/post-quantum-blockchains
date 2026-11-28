"""Per-chain JSON (the API), badges and cards that other sites embed.

Every embed carries the credit the license asks for: the badge and the card name the site, link to the chain's page,
and the HTML snippets add the author's link. Badges and cards are rebuilt from the data on every build, so a page
that embeds one always shows the current stage and check date without copying anything.
"""
from html import escape

SITE_EN = 'Post-Quantum Blockchains'
SITE_ZH = '抗量子区块链进度表'
AUTHOR, AUTHOR_URL = 'Balance Zhao', 'https://x.com/balance0014'
LICENSE_URL = 'https://github.com/Balance0014/post-quantum-blockchains/blob/main/LICENSE'
SITE_URL = 'https://balance0014.github.io/post-quantum-blockchains/'
# the license block at the top of chains.json, sources.json and network.json, and in each chain's API file
DATA_LICENSE = {
    'name': 'CC BY-NC 4.0', 'url': 'https://creativecommons.org/licenses/by-nc/4.0/',
    'attribution': f'Data: {SITE_EN} ({SITE_URL}), by {AUTHOR} ({AUTHOR_URL})',
    'commercial_use': 'Free with the attribution on every screen, the check date shown, weekly updates and a "Used by" registration.',
    'terms': LICENSE_URL,
}
# the site's stage colours (light theme), with text that reads on each
STAGE_BG = ['#e5e8ec', '#cfccf1', '#aea7ed', '#8c7de4', '#6b4fd1', '#4c2ba3']
STAGE_FG = ['#1c1630', '#1c1630', '#1c1630', '#ffffff', '#ffffff', '#ffffff']
BRAND_BG = '#1c1630'
FONT = "Verdana, Geneva, 'DejaVu Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif"


def text_width(s, size=11):
    """Width of a badge text in Verdana-like metrics: wide CJK characters, narrow punctuation and spaces."""
    w = 0.0
    for ch in s:
        if ord(ch) > 0x2E80:
            w += size
        elif ch in ' .,:;·|il!':
            w += size * 0.36
        elif ch.isupper() or ch in 'mw':
            w += size * 0.72
        else:
            w += size * 0.6
    return round(w, 1)


def stage_words(stage, names, lang):
    return f'第 {stage} 档 · {names[stage]}' if lang == 'zh' else f'Stage {stage} · {names[stage]}'


def badge_svg(v, names, lang):
    left, right = (SITE_ZH if lang == 'zh' else SITE_EN), stage_words(v['stage'], names, lang)
    lw, rw = text_width(left) + 16, text_width(right) + 16
    W = round(lw + rw)
    nm = v['zh_name'] if lang == 'zh' and v.get('zh_name') else v['name']
    label = (f'{SITE_ZH}：{nm}{" " if nm[-1].isascii() else ""}{right}' if lang == 'zh'
             else f'{SITE_EN}: {nm} is at stage {v["stage"]} of 5, {names[v["stage"]]}')
    s, fg = v['stage'], STAGE_FG[v['stage']]
    t = lambda x, cx, s_, col: (f'<text x="{cx}" y="15" fill="#010101" fill-opacity=".25" textLength="{text_width(s_)}">{escape(s_)}</text>'
                                f'<text x="{cx}" y="14" fill="{col}" textLength="{text_width(s_)}">{escape(s_)}</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="20" role="img" aria-label="{escape(label)}">'
            f'<title>{escape(label)}</title><clipPath id="r"><rect width="{W}" height="20" rx="3" fill="#fff"/></clipPath>'
            f'<g clip-path="url(#r)"><rect width="{lw}" height="20" fill="{BRAND_BG}"/><rect x="{lw}" width="{rw}" height="20" fill="{STAGE_BG[s]}"/></g>'
            f'<g text-anchor="middle" font-family="{FONT}" font-size="11">'
            f'{t(0, round(lw / 2, 1), left, "#ffffff")}{t(0, round(lw + rw / 2, 1), right, fg)}</g></svg>\n')


def card_svg(v, names, lang, checked):
    """A 360 by 112 card: chain name, stage with the six-step bar, the check date and the site's name."""
    zh = lang == 'zh'
    nm = v['zh_name'] if zh and v.get('zh_name') else v['name']
    s = v['stage']
    stage_line = f'第 {s} 档（最高 5 档）：{names[s]}' if zh else f'Stage {s} of 5: {names[s]}'
    date_line = f'核对于 {checked}' if zh else f'Checked {checked}'
    brand = SITE_ZH if zh else SITE_EN
    label = f'{brand}：{nm}，{stage_line}。{date_line}。' if zh else f'{brand}: {nm}, {stage_line}. {date_line}.'
    edge = ' stroke="#cfcfda"'
    bars = ''.join(f'<rect x="{20 + i * 27}" y="62" width="24" height="8" rx="2" fill="{STAGE_BG[i] if i <= s else "#eeeef3"}"'
                   f'{edge if i > s or i == 0 else ""}/>' for i in range(6))
    sans = "Inter, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Helvetica, Arial, sans-serif"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="360" height="112" viewBox="0 0 360 112" role="img" aria-label="{escape(label)}">'
            f'<title>{escape(label)}</title><rect x=".5" y=".5" width="359" height="111" rx="10" fill="#ffffff" stroke="#d9d7e6"/>'
            f'<g font-family="{sans}">'
            f'<text x="20" y="32" font-size="18" font-weight="600" fill="#1c1630">{escape(nm)}</text>'
            f'<text x="340" y="32" font-size="12" text-anchor="end" fill="#5b5873">{escape(v["ticker"])}</text>'
            f'<text x="20" y="52" font-size="13" fill="#2d2943">{escape(stage_line)}</text>{bars}'
            f'<text x="20" y="94" font-size="11.5" fill="#5b5873">{escape(date_line)} · {escape(brand)}</text></g></svg>\n')


def chain_api(v, names_all, checked, version, page, badge, card):
    """One chain as the API serves it: data/chains/<id>.json."""
    return {
        'schema': 'post-quantum-blockchains/chain@1', 'version': version, 'data_checked': checked,
        'id': v['id'], 'name': v['name'], 'zh_name': v.get('zh_name'), 'ticker': v['ticker'],
        'stage': v['stage'], 'stage_name': {'en': names_all['en'][v['stage']], 'zh': names_all['zh'][v['stage']]},
        'group': v['group'], 'market_cap_rank': v['rank'],
        'algorithm': v['algo'], 'schemes': [{'scheme': k, 'status': st} for k, st in v['schemes']],
        'coverage': v['cov'], 'migration': (v['mig'] or {}).get('value'), 'audit': (v['audit'] or {}).get('value'),
        'post_quantum_mainnet_since': (v['since'] or {}).get('date'),
        'basis': v['basis'], 'basis_source': v['basis_src'], 'last_reviewed': v['reviewed'],
        'page': page, 'badge': badge, 'card': card,
        'attribution': {'text': f'Data: {SITE_EN}, by {AUTHOR}', 'text_zh': f'数据来源：{SITE_EN}，作者 {AUTHOR}',
                        'site': page['en'].split('chains/')[0], 'author': AUTHOR_URL},
        'license': {k: v for k, v in DATA_LICENSE.items() if k != 'attribution'},
    }


def snippets(v, lang):
    """The embed code for one chain, the same as the website's copy buttons (scripts/site/app.js, snippets())."""
    zh = lang == 'zh'
    nm = v.get('zh_name') if zh and v.get('zh_name') else v['name']
    page = f"{SITE_URL}{'zh/' if zh else ''}chains/{v['id']}/"
    badge = f"{SITE_URL}badges/{'zh/' if zh else ''}{v['id']}.svg"
    alt = f"{nm}：抗量子第 {v['stage']} 档" if zh else f"{nm}: post-quantum stage {v['stage']} of 5"
    return {'page': page, 'md': f'[![{alt}]({badge})]({page})',
            'html': f'<a href="{page}"><img src="{badge}" alt="{alt}" height="20"></a>'}
