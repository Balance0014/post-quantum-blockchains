#!/usr/bin/env python3
"""Export the shared JSON data as CSV, Markdown tables, SVG charts and the README summaries."""
import csv
import io
import json
import re
from datetime import date
from pathlib import Path

from charts import charts, long_date, status

ROOT = Path(__file__).resolve().parents[1]
SUBMIT = 'https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml'
SUMMARY = re.compile(r'(<!-- summary: [^\n]*-->\n).*?(\n<!-- /summary -->)', re.S)
PINNED = re.compile(r'(<!-- pinned: [^\n]*-->).*?(<!-- /pinned -->)', re.S)
ZH_NETWORK = {'testnet': '测试网', 'devnet': '开发网', 'demo': '演示', 'planned': '计划中'}

def read(name):
    return json.loads((ROOT / 'data' / name).read_text(encoding='utf-8'))

def cell(value):
    return str(value).replace('|', '\\|').replace('\n', ' ')

def csv_text(rows, fields):
    buf = io.StringIO(newline='')
    writer = csv.DictWriter(buf, fieldnames=fields, lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()

def outputs():
    data = read('projects.json')
    projects = data['projects']
    refs = {s['id']: s for s in read('sources.json')['sources']}
    parameters = read('signature-sizes.json')['parameters']
    flat = []
    for p in projects:
        flat.append({
            'id': p['id'], 'name': p['name'], 'ticker': p['ticker'],
            'network_status': p['network_status'], 'consensus': p['consensus'],
            'timeline_year': p['timeline_year'], 'timeline_milestone': p['timeline_milestone'],
            'milestone_note': p['milestone_note'], 'signing': p['signing_note'],
            'crypto_agility': p['agility_note'], 'limits': p['caveat'],
            'last_reviewed': p['last_reviewed'],
            'source_urls': ' ; '.join(refs[s]['url'] for s in p['sources']),
        })
    size_rows = [{**{k: p[k] for k in ['id', 'name', 'family', 'public_key_bytes', 'signature_bytes', 'nist_category', 'encoding', 'status_note', 'shown_in_published_chart']},
                  'source_url': refs[p['sources'][0]]['url']} for p in parameters]
    lines = ['# Project comparison', '',
        f'Every network in the map: what is deployed, where, and with which limits. Each entry shows the date its claims were last checked; the first 17 were reviewed **October 23, 2026**. [Methodology](methodology.md) · [Release-day checks](release-review.md) · [Resources](resources.md) · [Submit a project]({SUBMIT})', '',
        'The [deployment timeline](../charts/deployment-timeline.svg) and [algorithm map](../charts/algorithm-map.svg) are drawn from the same data. The timeline uses the milestone shown. The cryptography listed reflects the review date; it may have been introduced after the chain launched. QANplatform is a testnet; Starknet is an L2.', '',
        '| Project | Consensus | Milestone | Signing / proof scope |',
        '| --- | --- | --- | --- |']
    for p in projects:
        lines.append('| ' + ' | '.join(map(cell,[f"[{p['name']} ({p['ticker']})](#{p['id']})",p['consensus'],str(p['timeline_year'])+' · '+p['timeline_milestone'],p['chart_cryptography']])) + ' |')
    for p in projects:
        lines += ['',f"## {p['name']}", '',f"**{p['ticker']} · {p['network_status']} · reviewed {p['last_reviewed']}**", '',
            f"**Milestone:** {p['milestone_note']}", '', f"**Consensus:** {p['consensus_note']}", '',
            f"**Cryptographic use:** {p['signing_note']}", '', f"**Crypto-agility:** {p['agility_note']}", '',
            f"**Limits:** {p['caveat']}", '', 'Sources:', '']
        for id in p['sources']:
            s=refs[id]
            lines.append(f"- [{id}]({s['url']}) — {s['supports']} ({s['source_type']})")
    sizes_meta = read('signature-sizes.json')
    shown = sum(p['shown_in_published_chart'] for p in parameters)
    sizes = ['# Reference public-key and signature sizes', '',
        f"Data as of **{long_date(sizes_meta['snapshot_date'])}**. Units: **bytes**. These are algorithm encodings, not complete transaction sizes. {spell(shown).capitalize()} rows appear in the [algorithm map](../charts/algorithm-map.svg); the other {spell(len(parameters) - shown)} are reference rows in the data only.", '',
        '| Parameter set | Public key | Signature | NIST category | In chart | Source |',
        '| --- | ---: | ---: | --- | --- | --- |']
    for p in parameters:
        s=refs[p['sources'][0]]
        category=str(p['nist_category']) if p['nist_category'] is not None else 'Not assigned here'
        if p['id'].startswith('uov'): category+=' (target)'
        sizes.append('| '+' | '.join(map(cell,[p['name'],f"{p['public_key_bytes']:,}",f"{p['signature_bytes']:,}",category,'Yes' if p['shown_in_published_chart'] else 'No',f"[Specification]({s['url']})"]))+' |')
    sizes += ['', '## Encoding and comparison notes', '']
    for p in parameters:
        sizes.append(f"- **{p['name']}:** {p['encoding']}. {p['status_note']}.")
    sizes += ['', 'NIST categories are not speed rankings. A smaller signature alone does not establish a better scheme. The two UOV points show one parameter set in two public-key formats; neither measures Raqcoin. XMSS is a reference RFC format, not QRL transaction serialization. KEM ciphertexts and STARK proofs are excluded from this signature table.', '', '[Read the methodology](methodology.md).', '']
    return {
        'data/projects.csv': csv_text(flat,list(flat[0])),
        'data/signature-sizes.csv': csv_text(size_rows,list(size_rows[0])),
        'docs/projects.md': '\n'.join(lines)+'\n',
        'docs/signature-sizes.md': '\n'.join(sizes),
        **charts(),
        'README.md': with_pinned(with_summary('README.md', summary_en(projects)), pinned_en(list(refs.values()))),
        'README.zh-CN.md': with_pinned(with_summary('README.zh-CN.md', summary_zh(projects)), pinned_zh(list(refs.values()))),
    }

def spell(n):
    words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
    return words[n] if n < len(words) else str(n)

def groups(projects):
    return {k: [p for p in projects if status(p) == k] for k in ('default', 'optin', 'offmain')}

def as_of(projects):
    return max(p['last_reviewed'] for p in projects)

def and_list(names):
    return names[0] if len(names) == 1 else ', '.join(names[:-1]) + ' and ' + names[-1]

def summary_en(projects):
    g, n = groups(projects), len(projects)
    out = [f'Across the {n} listed projects (data as of {long_date(as_of(projects))}):', '']
    if g['default']:
        k = len(g['default'])
        out.append(f"- **{k} of the {n}** {'uses' if k == 1 else 'use'} a post-quantum scheme on {'its' if k == 1 else 'their'} default transaction path.")
    if g['optin']:
        k = len(g['optin'])
        out.append(f"- **{k}** {'offers' if k == 1 else 'offer'} it only as an opt-in account, lock or demo: {and_list([p['name'] for p in g['optin']])}.")
    if g['offmain']:
        k = len(g['offmain'])
        names = [f"{p['name']} ({p['network_status']})" for p in g['offmain']]
        out.append(f"- **{k}** {'isn' if k == 1 else 'aren'}'t on mainnet yet: {and_list(names)}.")
    return '\n'.join(out)

def summary_zh(projects):
    g, n = groups(projects), len(projects)
    d = date.fromisoformat(as_of(projects))
    out = [f'已收录 {n} 个项目（数据截至 {d.year} 年 {d.month} 月 {d.day} 日）：', '']
    if g['default']:
        out.append(f"- **{n} 个里有 {len(g['default'])} 个**，日常交易默认就走抗量子方案。")
    if g['optin']:
        out.append(f"- **{len(g['optin'])} 个**只把它做成可选账户、可选锁或演示：{'、'.join(p['name'] for p in g['optin'])}。")
    if g['offmain']:
        names = '、'.join(f"{p['name']}（{ZH_NETWORK.get(p['network_status'], p['network_status'])}）" for p in g['offmain'])
        out.append(f"- **{len(g['offmain'])} 个**还没上主网：{names}。")
    return '\n'.join(out)

def pinned_count(sources):
    return sum(1 for s in sources if s['source_type'].startswith('pinned')), len(sources)

def pinned_en(sources):
    k, n = pinned_count(sources)
    return f'{k} of the {n} sources are pinned to a specific commit'

def pinned_zh(sources):
    k, n = pinned_count(sources)
    return f'{n} 条出处里有 {k} 条固定到了具体代码版本'

def with_pinned(text, sentence):
    new, count = PINNED.subn(lambda m: m.group(1) + sentence + m.group(2), text)
    if count != 1:
        raise ValueError('README: expected one <!-- pinned: ... --> block')
    return new

def with_summary(relative, block):
    text = (ROOT / relative).read_text(encoding='utf-8')
    new, count = SUMMARY.subn(lambda m: m.group(1) + block + m.group(2), text)
    if count != 1:
        raise ValueError(f'{relative}: expected one <!-- summary: ... --> block')
    return new

if __name__ == '__main__':
    for relative, text in outputs().items():
        (ROOT / relative).parent.mkdir(exist_ok=True)
        (ROOT / relative).write_text(text,encoding='utf-8')
        print(relative)
