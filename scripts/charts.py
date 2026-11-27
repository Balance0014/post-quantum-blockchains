#!/usr/bin/env python3
"""Draw the deployment timeline and the algorithm map as SVG from the data files.

Standard library only, Python 3.9+. The charts read data/projects.json (the source that
data/projects.csv is exported from; the CSV has no scheme-family column) and
data/signature-sizes.json. scripts/export.py writes them together with the tables, and
scripts/validate.py and CI fail when a committed chart no longer matches the data.

Run on its own to write only the charts:  python3 scripts/charts.py
"""
import json
import math
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

ROOT = Path(__file__).resolve().parents[1]
REPO = 'github.com/Balance0014/post-quantum-blockchains'
TIMELINE = 'charts/deployment-timeline.svg'
ALGORITHMS = 'charts/algorithm-map.svg'

W, M = 960, 32  # canvas width and side margin, in px
FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
BG, CARD, BORDER, RULE = '#fcfcfb', '#ffffff', '#e2e0d9', '#ecebe6'
INK, INK2, INK3 = '#0b0b0b', '#52514e', '#6e6c66'

# Scheme families keep the same colour in both charts. Unknown families take the next
# palette slot in order; validity proofs are grey because they don't sign transactions.
FAMILIES = {
    'lattice-based': ('Lattice-based', '#2a78d6'),
    'hash-based': ('Hash-based', '#eb6834'),
    'multivariate': ('Multivariate', '#1baf7a'),
}
MORE_COLOURS = ['#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948']
PROOFS = 'validity proofs'
GREY = '#8f8d86'
CLASSICAL = ('Classical reference', GREY)

# Deployment status, from darkest (fully deployed) to lightest.
STATUS = {
    'default': ('On by default on mainnet', '#2b3440'),
    'optin': ('Opt-in or demo on mainnet', '#9a978f'),
    'offmain': ('Not on mainnet yet', '#d6d3cb'),
}
NETWORK_LABEL = {'testnet': 'testnet', 'devnet': 'devnet', 'demo': 'demo', 'planned': 'planned'}

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
          'September', 'October', 'November', 'December']


def read(name):
    return json.loads((ROOT / 'data' / name).read_text(encoding='utf-8'))


def long_date(iso):
    d = date.fromisoformat(iso)
    return f'{MONTHS[d.month - 1]} {d.day}, {d.year}'


# --- classification shared with the README summary -------------------------------------

def role(use):
    """'validity proofs' for proof systems, otherwise the scheme family."""
    return PROOFS if PROOFS[:-1] in use['scope'].lower() else use['family']


def status(project):
    """'default', 'optin' or 'offmain'.

    Not on mainnet: network_status isn't 'mainnet'. Opt-in or demo: every use other than a
    validity proof has 'opt-in' or 'demonstration' in its scope. Otherwise on by default.
    """
    if project['network_status'] != 'mainnet':
        return 'offmain'
    scopes = [u['scope'].lower() for u in project['crypto_uses'] if role(u) != PROOFS]
    if scopes and all('opt-in' in s or 'demonstration' in s for s in scopes):
        return 'optin'
    return 'default'


def status_tag(project):
    kind = status(project)
    if kind == 'offmain':
        return NETWORK_LABEL.get(project['network_status'], project['network_status']).upper()
    if kind == 'optin':
        scopes = ' '.join(u['scope'].lower() for u in project['crypto_uses'] if role(u) != PROOFS)
        return 'OPT-IN' if 'opt-in' in scopes else 'DEMO'
    return ''


def family_colours(projects):
    colours = {k: v for k, v in FAMILIES.items()}
    extra = sorted({u['family'] for p in projects for u in p['crypto_uses']} - set(colours))
    for i, fam in enumerate(extra):
        colours[fam] = (fam.replace('-', ' ').capitalize(), MORE_COLOURS[i % len(MORE_COLOURS)])
    colours[PROOFS] = ('Validity proofs', GREY)
    return colours


# --- text measurement (approximate Helvetica advance widths, per 1000 em) ---------------

_ADV = {}
for _chars, _w in [("'", 191), ('ijl', 222), ('|', 260), (' !,./:;I[\\]ft·', 278), ('()-`r', 333),
                   ('"', 355), ('*', 389), ('^', 469), ('Jckvxyzs', 500),
                   ('0123456789#$?L_abdeghnopqu–', 556), ('+<=>~', 584), ('FTZ', 611),
                   ('&ABEKPSVXY', 667), ('CDHNRUw', 722), ('GOQ', 778), ('Mm', 833), ('%', 889),
                   ('W', 944), ('—', 1000), ('@', 1015)]:
    for _c in _chars:
        _ADV[_c] = _w


def width(text, size, bold=False):
    """A slightly generous width estimate, so system UI fonts still fit."""
    units = sum(_ADV.get(c, 600) for c in text)
    return units * size / 1000 * (1.08 if bold else 1.0) * 1.06


def wrap(text, size, room, bold=False):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}' if line else word
        if line and width(trial, size, bold) > room:
            lines.append(line)
            line = word
        else:
            line = trial
    return lines + [line] if line else lines


# --- SVG helpers -------------------------------------------------------------------------

def num(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


def text(x, y, s, size, fill, weight=None, anchor=None, spacing=None):
    attrs = f'x="{num(x)}" y="{num(y)}" font-size="{num(size)}" fill="{fill}"'
    if weight:
        attrs += f' font-weight="{weight}"'
    if anchor:
        attrs += f' text-anchor="{anchor}"'
    if spacing:
        attrs += f' letter-spacing="{spacing}"'
    return f'<text {attrs}>{escape(s)}</text>'


def rect(x, y, w, h, fill, rx=0, stroke=None, extra=''):
    attrs = f'x="{num(x)}" y="{num(y)}" width="{num(w)}" height="{num(h)}" fill="{fill}"'
    if rx:
        attrs += f' rx="{num(rx)}"'
    if stroke:
        attrs += f' stroke="{stroke}"'
    return f'<rect {attrs}{extra}/>'


def tint(hex_colour, amount):
    """Mix a colour with white; amount is the share of the colour."""
    rgb = [int(hex_colour[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(255 - (255 - c) * amount):02x}' for c in rgb)


def document(height, title, desc, body):
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{num(height)}" '
            f'viewBox="0 0 {W} {num(height)}" font-family={quoteattr(FONT)} role="img" '
            f'aria-labelledby="title desc">\n'
            f'<title id="title">{escape(title)}</title>\n<desc id="desc">{escape(desc)}</desc>\n'
            + rect(0, 0, W, height, BG) + '\n')
    return head + '\n'.join(body) + '\n</svg>\n'


def header(out, title, subtitle, as_of):
    out.append(text(M, 48, title, 24, INK, weight=700))
    out.append(text(W - M, 48, 'Data as of ' + long_date(as_of), 13, INK2, anchor='end'))
    y = 76
    for line in wrap(subtitle, 14, W - 2 * M):
        out.append(text(M, y, line, 14, INK2))
        y += 20
    return y


def footer(out, y, source):
    out.append(f'<line x1="{M}" y1="{num(y)}" x2="{W - M}" y2="{num(y)}" stroke="{BORDER}"/>')
    out.append(text(M, y + 24, f'Drawn by scripts/charts.py from {source}. Data and chart: CC BY 4.0.', 12, INK3))
    out.append(text(M, y + 42, f'{REPO} · Balance Zhao (@balance0014)', 12, INK3))
    return y + 62


def legend(out, x, y, label, items):
    """items: (swatch_svg_function, text). Returns the y of the next line."""
    out.append(text(x, y, label, 12.5, INK3, weight=600))
    x += width(label, 12.5, True) + 12
    for draw, caption in items:
        if x + 18 + width(caption, 12.5) > W - M:
            x, y = M + width(label, 12.5, True) + 12, y + 22
        out.append(draw(x, y))
        out.append(text(x + 18, y, caption, 12.5, INK2))
        x += 18 + width(caption, 12.5) + 20
    return y + 22


def swatch(colour, stroke=None):
    return lambda x, y: rect(x, y - 10, 12, 12, colour, rx=2, stroke=stroke)


def bar_swatch(colour):
    return lambda x, y: rect(x + 4, y - 12, 5, 15, colour, rx=2)


# --- deployment timeline ---------------------------------------------------------------------

YEAR_COL = 124
GAP = 14
CARD_W = (W - 2 * M - YEAR_COL - GAP) / 2
PAD_L, PAD_R = 20, 14


def card_lines(p, colours):
    room = CARD_W - PAD_L - PAD_R
    fams = []
    for u in p['crypto_uses']:
        key = role(u)
        if key not in fams:
            fams.append(key)
    chips = len(fams) * 13
    return {
        'families': [colours[k][1] for k in fams],
        'crypto': wrap(p['chart_cryptography'], 14, room - chips),
        'agility': wrap(p['chart_agility'], 12.5, room),
        'note': wrap(p['chart_note'], 12.5, room),
        'chips': chips,
    }


def card_height(lines):
    return 14 + 26 + 20 + 22 + 19 * (len(lines['crypto']) - 1) + 20 * len(lines['agility']) \
        + 19 * len(lines['note']) - 6 + 14


def draw_card(out, x, y, h, p, lines):
    kind = status(p)
    out.append(rect(x, y, CARD_W, h, CARD, rx=8, stroke=BORDER))
    out.append(rect(x + 6, y + 10, 5, h - 20, STATUS[kind][1], rx=2.5))
    right = x + CARD_W - PAD_R
    # Name, ticker and consensus.
    by = y + 14 + 18
    out.append(f'<text x="{num(x + PAD_L)}" y="{num(by)}" font-size="16" fill="{INK}" font-weight="700">'
               f'{escape(p["name"])}<tspan dx="7" font-size="12" font-weight="400" fill="{INK3}" '
               f'letter-spacing="0.4">{escape(p["ticker"])}</tspan></text>')
    pill = width(p['consensus'], 11.5) + 18
    out.append(rect(right - pill, by - 14, pill, 20, '#f1f0ec', rx=10))
    out.append(text(right - pill / 2, by, p['consensus'], 11.5, INK2, anchor='middle'))
    # Milestone and, when not on by default, a status tag.
    by += 20
    out.append(text(x + PAD_L, by, p['timeline_milestone'], 12.5, INK3))
    tag = status_tag(p)
    if tag:
        tw = width(tag, 10.5, True) + 6 + 16
        fill, stroke = ('#ffffff', STATUS['optin'][1]) if kind == 'optin' else ('#f1f0ec', STATUS['offmain'][1])
        out.append(rect(right - tw, by - 13, tw, 18, fill, rx=9, stroke=stroke))
        out.append(text(right - tw / 2, by, tag, 10.5, INK2, weight=700, anchor='middle', spacing='0.6'))
    # Cryptography, with one square per scheme family or proof system.
    by += 22
    for i, colour in enumerate(lines['families']):
        out.append(rect(x + PAD_L + i * 13, by - 10, 9, 9, colour, rx=1.5))
    for i, line in enumerate(lines['crypto']):
        out.append(text(x + PAD_L + lines['chips'], by + 19 * i, line, 14, INK))
    by += 19 * (len(lines['crypto']) - 1)
    for line in lines['agility']:
        by += 20
        out.append(text(x + PAD_L, by, line, 12.5, INK2))
    for i, line in enumerate(lines['note']):
        by += 20 if i == 0 else 19
        out.append(text(x + PAD_L, by, line, 12.5, INK3))


def timeline(projects, as_of, colours):
    out = []
    y = header(out, 'Post-Quantum Blockchains · Deployment timeline',
               f'{len(projects)} projects, placed by the milestone year on each card: a chain launch, a later '
               'cryptographic upgrade or a public testnet. Consensus and cryptography are as of each '
               "entry's last review.", as_of)
    counts = {k: sum(status(p) == k for p in projects) for k in STATUS}
    y = legend(out, M, y + 12, 'Deployment', [(bar_swatch(STATUS[k][1]), f'{STATUS[k][0]} ({counts[k]})')
                                              for k in STATUS if counts[k]])
    used = []
    for p in projects:
        for u in p['crypto_uses']:
            if role(u) not in used:
                used.append(role(u))
    order = [k for k in colours if k in used]
    y = legend(out, M, y, 'Scheme family', [(swatch(colours[k][1]), colours[k][0]) for k in order])
    out.append(f'<line x1="{M}" y1="{num(y - 4)}" x2="{W - M}" y2="{num(y - 4)}" stroke="{BORDER}"/>')
    y += 18

    by_year = {}
    for p in projects:
        by_year.setdefault(p['timeline_year'], []).append(p)
    axis_x = M + 88
    axis_at = len(out)  # the axis goes under the year labels and cards
    dots = []
    for year in sorted(by_year):
        group = by_year[year]
        dots.append(y + 26)
        out.append(text(M, y + 32, str(year), 24, INK, weight=700))
        out.append(text(M, y + 52, f'{len(group)} project' + ('' if len(group) == 1 else 's'), 12.5, INK3))
        for start in range(0, len(group), 2):
            row = group[start:start + 2]
            lines = [card_lines(p, colours) for p in row]
            h = max(card_height(l) for l in lines)
            for i, (p, l) in enumerate(zip(row, lines)):
                draw_card(out, M + YEAR_COL + i * (CARD_W + GAP), y, h, p, l)
            y += h + 12
        y += 10
    axis = [f'<line x1="{axis_x}" y1="{num(dots[0])}" x2="{axis_x}" y2="{num(dots[-1])}" stroke="{BORDER}" stroke-width="2"/>']
    for d in dots:
        axis.append(f'<circle cx="{axis_x}" cy="{num(d)}" r="5" fill="{INK2}" stroke="{BG}" stroke-width="2"/>')
    out[axis_at:axis_at] = axis
    y = footer(out, y + 4, 'data/projects.json')
    desc = (f'Timeline of {len(projects)} blockchain projects by milestone year, with consensus, post-quantum '
            f'cryptography, crypto-agility and limits. ' + '; '.join(f'{counts[k]} {STATUS[k][0].lower()}' for k in STATUS if counts[k])
            + f'. Data as of {long_date(as_of)}.')
    return document(y, 'Post-quantum blockchain deployment timeline', desc, out)


# --- algorithm map ---------------------------------------------------------------------------

def algorithm_map(projects, parameters, as_of, colours):
    out = []
    y = header(out, 'Post-Quantum Blockchains · Algorithm map',
               'Which post-quantum scheme families each project uses, and for what. Validity proofs are '
               "shown apart because they don't sign transactions.", as_of)
    y += 14

    used = {role(u) for p in projects for u in p['crypto_uses']}
    cols = [k for k in colours if k in used]
    name_w, gap = 150, 8
    col_w = (W - 2 * M - name_w - gap * len(cols)) / len(cols)
    xs = [M + name_w + gap + i * (col_w + gap) for i in range(len(cols))]
    # Column headers.
    for x, key in zip(xs, cols):
        label, colour = colours[key]
        out.append(rect(x, y, col_w, 4, colour, rx=2))
        out.append(text(x, y + 24, label, 13.5, INK, weight=700))
        out.append(text(x, y + 41, 'not signatures' if key == PROOFS else 'signatures and spending', 11.5, INK3))
    out.append(text(M, y + 24, 'Project', 13.5, INK, weight=700))
    out.append(text(M, y + 41, 'ticker · consensus', 11.5, INK3))
    y += 54
    room = col_w - 18
    for p in projects:
        cells = {k: [] for k in cols}
        for u in p['crypto_uses']:
            cells[role(u)].append((wrap(u['scheme'], 12.5, room, True), wrap(u['scope'], 11.5, room)))
        name_lines = wrap(p['name'], 13.5, name_w - 10, True)
        sub = wrap(f"{p['ticker']} · {p['consensus']}", 11.5, name_w - 10)
        heights = [17 * len(name_lines) + 16 * len(sub)]
        for k in cols:
            heights.append(sum(16 * len(s) + 15 * len(c) + 14 for s, c in cells[k]) + 4 * max(len(cells[k]) - 1, 0))
        h = max(heights) + 12
        out.append(f'<line x1="{M}" y1="{num(y)}" x2="{W - M}" y2="{num(y)}" stroke="{RULE}"/>')
        ty = y + 6 + 14
        for line in name_lines:
            out.append(text(M, ty, line, 13.5, INK, weight=700))
            ty += 17
        for line in sub:
            out.append(text(M, ty - 1, line, 11.5, INK3))
            ty += 16
        for x, key in zip(xs, cols):
            colour = colours[key][1]
            cy = y + 6
            for scheme, scope in cells[key]:
                ch = 16 * len(scheme) + 15 * len(scope) + 14
                out.append(rect(x, cy, col_w, ch, tint(colour, 0.10), rx=5))
                out.append(rect(x, cy, 3, ch, colour, rx=1.5))
                ty = cy + 6 + 12
                for line in scheme:
                    out.append(text(x + 10, ty, line, 12.5, INK, weight=700))
                    ty += 16
                for line in scope:
                    out.append(text(x + 10, ty - 1, line, 11.5, INK2))
                    ty += 15
                cy += ch + 4
        y += h
    out.append(f'<line x1="{M}" y1="{num(y)}" x2="{W - M}" y2="{num(y)}" stroke="{RULE}"/>')

    # Reference sizes: one row per parameter set, public key (ring) and signature (dot) on a log scale.
    rows = [p for p in parameters if p['shown_in_published_chart']]
    y += 46
    out.append(text(M, y, 'Public-key and signature sizes', 18, INK, weight=700))
    y += 22
    for line in wrap('Reference parameter sets in bytes, on a log scale. These are algorithm encodings, '
                     'not transaction sizes.', 13, W - 2 * M):
        out.append(text(M, y, line, 13, INK2))
        y += 18
    fam_cols = dict(colours)
    fam_cols['classical'] = CLASSICAL
    y = legend(out, M, y + 10, 'Marks', [
        (lambda x, yy: f'<circle cx="{num(x + 6)}" cy="{num(yy - 4)}" r="5.5" fill="none" stroke="{INK2}" stroke-width="2"/>', 'Public key'),
        (lambda x, yy: f'<circle cx="{num(x + 6)}" cy="{num(yy - 4)}" r="4" fill="{INK2}"/>', 'Signature')])
    values = [v for p in rows for v in (p['public_key_bytes'], p['signature_bytes'])]
    lo = math.floor(math.log10(min(values)))
    hi = math.ceil(math.log10(max(values)))
    label_w = 220
    px0, px1 = M + label_w, W - M - 210
    pk_x, sig_x = W - M - 100, W - M

    def sx(v):
        return px0 + (math.log10(v) - lo) / (hi - lo) * (px1 - px0)

    y += 8
    out.append(text(pk_x, y + 4, 'Public key', 11.5, INK3, anchor='end'))
    out.append(text(sig_x, y + 4, 'Signature', 11.5, INK3, anchor='end'))
    top = y + 14
    row_h = 40
    bottom = top + row_h * len(rows)
    for e in range(lo, hi + 1):
        gx = sx(10 ** e)
        out.append(f'<line x1="{num(gx)}" y1="{num(top)}" x2="{num(gx)}" y2="{num(bottom)}" stroke="{RULE}"/>')
        tick = {0: '1', 1: '10', 2: '100', 3: '1k', 4: '10k', 5: '100k', 6: '1M', 7: '10M'}.get(e, f'1e{e}')
        out.append(text(gx, bottom + 18, tick, 11.5, INK3, anchor='middle'))
    out.append(text((px0 + px1) / 2, bottom + 36, 'bytes (log scale)', 11.5, INK3, anchor='middle'))
    for i, p in enumerate(rows):
        cy = top + row_h * i + row_h / 2
        label, colour = fam_cols.get(p['family'], (p['family'], GREY))
        out.append(rect(M, cy - 15, 4, 30, colour, rx=2))
        out.append(text(M + 12, cy - 2, p['name'], 13, INK, weight=700))
        sub = label
        if p['nist_category'] is not None:
            sub += (' · target category ' if p['family'] == 'multivariate' else ' · NIST category ') + str(p['nist_category'])
        out.append(text(M + 12, cy + 14, sub, 11.5, INK3))
        a, b = sx(p['public_key_bytes']), sx(p['signature_bytes'])
        out.append(f'<line x1="{num(a)}" y1="{num(cy)}" x2="{num(b)}" y2="{num(cy)}" stroke="{tint(colour, 0.45)}" stroke-width="2"/>')
        out.append(f'<circle cx="{num(a)}" cy="{num(cy)}" r="6.5" fill="{BG}" stroke="{colour}" stroke-width="2">'
                   f'<title>{escape(p["name"])}: public key {p["public_key_bytes"]:,} bytes</title></circle>')
        out.append(f'<circle cx="{num(b)}" cy="{num(cy)}" r="4" fill="{colour}">'
                   f'<title>{escape(p["name"])}: signature {p["signature_bytes"]:,} bytes</title></circle>')
        out.append(text(pk_x, cy + 5, f"{p['public_key_bytes']:,}", 13, INK, anchor='end'))
        out.append(text(sig_x, cy + 5, f"{p['signature_bytes']:,}", 13, INK, anchor='end'))
    y = bottom + 62
    for line in wrap("Key-encapsulation mechanisms such as ML-KEM aren't signatures and aren't shown. Encoding "
                     'notes for each row, and four more parameter sets, are in docs/signature-sizes.md.',
                     12, W - 2 * M):
        out.append(text(M, y, line, 12, INK3))
        y += 17
    y = footer(out, y + 8, 'data/projects.json and data/signature-sizes.json')
    desc = (f'Scheme families used by {len(projects)} blockchain projects (' + ', '.join(colours[k][0].lower() for k in cols)
            + f'), and public-key and signature sizes for {len(rows)} reference parameter sets. Data as of {long_date(as_of)}.')
    return document(y, 'Post-quantum blockchain algorithm map', desc, out)


def charts():
    projects = read('projects.json')['projects']
    sizes = read('signature-sizes.json')
    colours = family_colours(projects)
    as_of = max(p['last_reviewed'] for p in projects)
    both = max([as_of, sizes['snapshot_date']])
    return {
        TIMELINE: timeline(projects, as_of, colours),
        ALGORITHMS: algorithm_map(projects, sizes['parameters'], both, colours),
    }


if __name__ == '__main__':
    for relative, svg in charts().items():
        (ROOT / relative).parent.mkdir(exist_ok=True)
        (ROOT / relative).write_text(svg, encoding='utf-8')
        print(relative)
