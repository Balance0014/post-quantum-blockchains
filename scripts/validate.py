#!/usr/bin/env python3
"""Check data consistency and generated files; this does not audit cryptography."""
import hashlib
import json
import re
import struct
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

from export import outputs
from bitcoin_capacity import serialized as capacity_output
from build_bitcoin_charts import outputs as bitcoin_svgs

ROOT = Path(__file__).resolve().parents[1]

def require(condition, message):
    if not condition:
        raise ValueError(message)

def read(name):
    return json.loads((ROOT/'data'/name).read_text(encoding='utf-8'))

def unique(rows, name):
    ids = [r['id'] for r in rows]
    require(len(ids)==len(set(ids)),f'Duplicate {name} ID')

def validate_research():
    topic = ROOT / 'research/bitcoin-migration/r8-bruter'
    panels = json.loads((topic/'panels.json').read_text(encoding='utf-8'))
    manifest = json.loads((topic/'artifacts.json').read_text(encoding='utf-8'))
    require(panels['languages'] == ['en','zh-CN'], 'Research languages')
    require(len(panels['panels']) == 4, 'Research needs four panels')
    unique(panels['panels'], 'research panel')
    source_ids = set(re.findall(r'^\| ([RP]\d+) \|', (topic/'sources.md').read_text(encoding='utf-8'), re.M))
    for panel in panels['panels']:
        require(panel['sources'] and set(panel['sources']) <= source_ids, f"Research sources: {panel['id']}")
        for field in ['title','subtitle','note','alt']:
            require(set(panel[field]) == set(panels['languages']) and all(panel[field].values()), f"Language pair: {panel['id']} {field}")
        for row in panel['rows']:
            for card in row['cards']:
                for lang in panels['languages']:
                    require(card['title'][lang] and card['body'][lang], 'Empty research card')
                require(len(card['body']['en']) == len(card['body']['zh-CN']), 'Unpaired card paragraphs')
    for key in ['edition_date','source_edition_date']:
        date.fromisoformat(panels[key])
        require(manifest[key] == panels[key], 'Research edition dates differ')
    expected = {f"charts/{p['id']}.{lang}.{ext}" for p in panels['panels'] for lang in panels['languages'] for ext in ['png','svg']}
    paths = [a['path'] for a in manifest['files']]
    require(len(paths) == len(set(paths)) and set(paths) == expected, 'Research artifacts or language pair missing')
    for artifact in manifest['files']:
        path = (topic/artifact['path']).resolve()
        require(path.is_relative_to(topic), 'Research path escapes topic')
        raw = path.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == artifact['sha256'], f"Research checksum: {artifact['path']}")
        if path.suffix == '.png':
            require(raw[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid PNG')
            require(struct.unpack('>II',raw[16:24]) == (1800,1780), 'Research PNG dimensions')
            require(artifact['source_svg_sha256'] == hashlib.sha256(path.with_suffix('.svg').read_bytes()).hexdigest(), f"PNG was rendered from a different SVG: {artifact['path']}")
    for name, content in bitcoin_svgs().items():
        require((topic/'charts'/name).read_text(encoding='utf-8') == content, f'Stale research SVG: {name}')
    require((topic/'capacity.json').read_text(encoding='utf-8') == capacity_output(), 'Stale capacity calculation')
    print('OK: four bilingual research panels, sources, image hashes, SVG builds and capacity arithmetic')

def validate():
    projects=read('projects.json')['projects']
    parameters=read('signature-sizes.json')['parameters']
    sources=read('sources.json')['sources']
    release=read('release.json')
    for rows,name in [(projects,'project'),(parameters,'parameter'),(sources,'source')]:
        unique(rows,name)
    ids={s['id'] for s in sources}
    for s in sources:
        u=urlsplit(s['url'])
        require(u.scheme=='https' and u.hostname and not u.username and not u.password,
                f"Invalid source URL: {s['id']}")
        require(s['supports'] and s['source_type'],f"Missing source scope: {s['id']}")
    for p in projects+parameters:
        require(p['sources'] and all(s in ids for s in p['sources']),f"Missing citation: {p['id']}")
    for p in projects:
        date.fromisoformat(p['last_reviewed'])
        require(p['network_status'] in {'mainnet','testnet','devnet','demo','planned'},f"Network scope: {p['id']}")
        require(isinstance(p['timeline_year'],int) and 2000<=p['timeline_year']<=date.fromisoformat(p['last_reviewed']).year,f"Milestone year: {p['id']}")
        for field in ['name','ticker','consensus','timeline_milestone','milestone_note','consensus_note','signing_note','agility_note','caveat']:
            require(bool(p[field].strip()),f"Empty {field}: {p['id']}")
        require(p['crypto_uses'] and all(u['scheme'] and u['family'] and u['scope'] for u in p['crypto_uses']),f"Missing crypto role: {p['id']}")
    for p in parameters:
        for field in ['public_key_bytes','signature_bytes']:
            require(type(p[field]) is int and p[field]>0,f"Invalid byte size: {p['id']}")
        require(p['nist_category'] in {None,1,2,3,4,5},f"Invalid category: {p['id']}")
        require(p['family'] in {'classical','lattice-based','hash-based','multivariate'},f"Non-signature family: {p['id']}")
        require(type(p['shown_in_published_chart']) is bool,f"Chart inclusion must be Boolean: {p['id']}")
    for chart in release['charts']:
        path=(ROOT/chart['path']).resolve()
        require(path.is_relative_to(ROOT), 'Chart path escapes repository')
        require(hashlib.sha256(path.read_bytes()).hexdigest()==chart['sha256'],f"Chart checksum: {chart['path']}")
    for relative,text in outputs().items():
        require((ROOT/relative).read_text(encoding='utf-8')==text,f'Generated file is stale: {relative}; run scripts/export.py')
    # These are scope safeguards for the original snapshot, not security ratings.
    by_name={p['name']:p for p in projects}
    require(by_name['QANplatform']['network_status']=='testnet','QANplatform snapshot must retain testnet scope')
    require(by_name['Mochimo']['consensus']=='PoS','Mochimo snapshot must retain post-transition PoS')
    require('L2' in by_name['Starknet']['consensus'],'Starknet snapshot must retain L2 scope')
    validate_research()
    print(f"OK: {len(projects)} projects, {len(parameters)} size references, {len(sources)} sources, chart hashes and generated files")

if __name__=='__main__':
    validate()
