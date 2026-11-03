#!/usr/bin/env python3
"""Build paired, editable Bitcoin migration SVGs with the standard library."""
import argparse
from html import escape
import json
from pathlib import Path
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
TOPIC = ROOT / 'research/bitcoin-migration/r8-bruter'
WIDTH, HEIGHT = 1800, 1780
BG, INK, TEAL, MUTED = '#F6F4EE', '#172D35', '#117F79', '#52656B'

def units(text):
    return sum(1 if unicodedata.east_asian_width(c) in 'WF' else (0.64 if c.isupper() else 0.57) for c in text)

def wrap(text, width, size):
    limit = width / size
    # Wrap Chinese by character and Latin text at spaces.
    tokens = list(text) if any(unicodedata.east_asian_width(c) in 'WF' for c in text) else text.split(' ')
    joiner = '' if tokens == list(text) else ' '
    rows, line = [], ''
    for token in tokens:
        candidate = line + (joiner if line else '') + token
        if line and units(candidate) > limit and token not in '，。；：！？、）】》,.!?;:':
            rows.append(line)
            line = token
        else:
            line = candidate
    if line:
        rows.append(line)
    return rows

def render(panel, lang):
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">',
           f'<title>{escape(panel["title"][lang])}</title>',
           f'<desc>{escape(panel["alt"][lang])}</desc>',
           f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{BG}"/>',
           '<g font-family="Arial, PingFang SC, Noto Sans CJK SC, sans-serif">']
    def text(x,y,value,size=32,color=INK,weight=400):
        out.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(value)}</text>')
    def lines(x,y,value,width,size=32,spacing=44,color=INK,weight=400):
        for row in wrap(value,width,size):
            text(x,y,row,size,color,weight)
            y += spacing
        return y
    number = panel['id'][:2]
    text(80,80, 'BITCOIN / POST-QUANTUM MIGRATION' if lang=='en' else '比特币 / 抗量子迁移',27,TEAL,700)
    text(1570,80, f'{number} / 04',27,TEAL,700)
    y = lines(80,185,panel['title'][lang],1640,66,80,INK,700)
    y = lines(80,y+12,panel['subtitle'][lang],1640,33,46,MUTED)
    if y > 385:
        raise ValueError(f'Header too tall: {panel["id"]} {lang}')
    y = 410
    watermark_y = None
    for row in panel['rows']:
        cards, h = row['cards'], row['height']
        if len(cards) == 2 and watermark_y is None:
            watermark_y = y + h/2
        w = (1640 - 40*(len(cards)-1)) / len(cards)
        for i,card in enumerate(cards):
            x = 80+i*(w+40)
            fill = '#E7F1EC' if card['tone']=='green' else '#F1EBDD'
            out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="{fill}"/>')
            cy = lines(x+34,y+56,card['title'][lang],w-68,37,46,INK,700)+6
            for paragraph in card['body'][lang]:
                cy = lines(x+34,cy,paragraph,w-68,31,41)+10
            if cy-10 > y+h-15:
                raise ValueError(f'Card overflow: {panel["id"]} {lang}: {card["title"][lang]} ({cy-y} > {h})')
        y += h+30
    if y > 1440:
        raise ValueError('Body exceeds footer')
    # One vertical credit in the central gutter, clear of all card text.
    out.append(f'<text x="900" y="{watermark_y}" transform="rotate(-90 900 {watermark_y})" text-anchor="middle" font-size="24" fill="{TEAL}" opacity="0.55">@balance0014</text>')
    out.append('<path d="M80 1455 H1720" stroke="#C5CFC8" stroke-width="2"/>')
    lines(80,1505,panel['note'][lang],1640,30,42,INK)
    text(80,1625,'Framework: @r8raq · Explanation: Balance Zhao' if lang=='en' else '框架：@r8raq · 图解整理：Balance Zhao',29,TEAL,700)
    text(80,1675,('Sources: ' if lang=='en' else '来源：')+', '.join(panel['sources'])+(' · See sources.md for scope' if lang=='en' else ' · 适用范围见 sources.md'),27,MUTED)
    text(80,1725,'Sources reviewed 2026-10-31 · GitHub edition 2026-11-03' if lang=='en' else '来源核对 2026-10-31 · GitHub 版 2026-11-03',26,MUTED)
    out += ['</g>','</svg>']
    return '\n'.join(out)+'\n'

def outputs():
    data = json.loads((TOPIC/'panels.json').read_text(encoding='utf-8'))
    return {f"{p['id']}.{lang}.svg":render(p,lang) for p in data['panels'] for lang in data['languages']}

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    dest=TOPIC/'charts'
    if not args.check:
        dest.mkdir(exist_ok=True)
    for name,content in outputs().items():
        if args.check:
            if (dest/name).read_text(encoding='utf-8') != content:
                raise SystemExit(f'Stale diagram: {name}')
        else:
            (dest/name).write_text(content,encoding='utf-8')
    print('OK: eight paired SVGs' if args.check else 'Built eight paired SVGs')
