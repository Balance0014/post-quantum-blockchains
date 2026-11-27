#!/usr/bin/env python3
"""Export the shared JSON data as CSV and readable Markdown tables."""
import csv
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

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
        'Each entry shows the date it was last checked. The original 17 entries were reviewed **October 23, 2026**, the date of the published maps. [Methodology](methodology.md) · [Release-day checks](release-review.md) · [Submit a project](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml)', '',
        'The timeline uses the milestone shown. The cryptography listed reflects the review date; it may have been introduced after the chain launched. QANplatform is a testnet; Starknet is an L2.', '',
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
    sizes = ['# Reference public-key and signature sizes', '',
        'Snapshot: **October 23, 2026**. Units: **bytes**. These are algorithm encodings, not complete transaction sizes. Eight rows appear in the published chart; four additional reference rows are included in the data.', '',
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
    }

if __name__ == '__main__':
    for relative, text in outputs().items():
        (ROOT / relative).write_text(text,encoding='utf-8')
        print(relative)
