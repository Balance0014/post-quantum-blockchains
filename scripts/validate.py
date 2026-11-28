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
    manifest = json.loads((topic/'artifacts.json').read_text(encoding='utf-8'))
    require(manifest['images_unchanged'] is True, 'Original image provenance required')
    for key in ['edition_date','source_edition_date']:
        date.fromisoformat(manifest[key])
    expected = {f"charts/{prefix}{i:02}.{ext}" for prefix in ['r8_Bitcoin_Mobile_EN_','r8_抗量子迁移_中文_'] for i in range(1,5) for ext in ['png','svg']}
    paths = [a['path'] for a in manifest['files']]
    require(len(paths) == len(set(paths)) and set(paths) == expected, 'Original research images missing')
    for artifact in manifest['files']:
        path = (topic/artifact['path']).resolve()
        require(path.is_relative_to(topic), 'Research path escapes topic')
        raw = path.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == artifact['sha256'], f"Research checksum: {artifact['path']}")
        require(artifact['sha256'] == artifact['original_sha256'], 'Image differs from recorded original')
        require(artifact['original_filename'] and artifact['published_edition'].startswith('https://x.com/'), 'Missing image provenance')
        if path.suffix == '.png':
            require(raw[:8] == b'\x89PNG\r\n\x1a\n', 'Invalid PNG')
            require(list(struct.unpack('>II',raw[16:24])) == artifact['dimensions'], 'Original PNG dimensions')
    require((topic/'capacity.json').read_text(encoding='utf-8') == capacity_output(), 'Stale capacity calculation')
    print('OK: 16 unchanged original image files, provenance, dimensions and capacity arithmetic')

STAGE_LABELS=['Nothing public','Research','Formal proposal','Testnet','Mainnet opt-in','Default']
MILESTONE_TYPES={'research','proposal','code','testnet','mainnet','wallet','thirdparty'}
DATE_RE=re.compile(r'^\d{4}(-Q[1-4]|-\d{2}(-\d{2})?)?$')
CJK=re.compile(r'[\u4e00-\u9fff]')
MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december']
MONTH_RE=re.compile(r'\b('+'|'.join(MONTHS)+r'|'+'|'.join(m[:3] for m in MONTHS)+r')\b',re.I)
# Source types in data/sources.json that are primary evidence (code, releases, chain data, specifications).
PRIMARY_TYPES={'pinned source code','pinned source repository','pinned source documentation','project release record',
               'project block explorer','ecosystem block explorer','algorithm specification or reference implementation'}

def numbers(text,english):
    """Numbers of 10 or more in a text, with English month names turned into month numbers."""
    text=re.sub(r'(?<=\d),(?=\d{3})','',text)
    # "4 million" and "400 万" are the same number
    scale=lambda m,k:str(round(float(m.group(1))*k))
    if english:
        text=MONTH_RE.sub(lambda m:str([x[:3] for x in MONTHS].index(m.group(1)[:3].lower())+1),text)
        text=re.sub(r'(\d+(?:\.\d+)?) ?million\b',lambda m:scale(m,10**6),text)
        text=re.sub(r'(\d+(?:\.\d+)?) ?billion\b',lambda m:scale(m,10**9),text)
    else:
        text=re.sub(r'(\d+(?:\.\d+)?) ?万',lambda m:scale(m,10**4),text)
        text=re.sub(r'(\d+(?:\.\d+)?) ?亿',lambda m:scale(m,10**8),text)
    return {int(n) for n in re.findall(r'\d+',text) if int(n)>=10}

def text_pairs(x,path):
    """Every English/Chinese pair in a chain entry: {en, zh}, milestones {name, zh} and latest_step {text, zh}."""
    if isinstance(x,dict):
        for en_key in ('en','name','text'):
            if isinstance(x.get(en_key),str) and isinstance(x.get('zh'),str):
                yield path,x[en_key],x['zh']
                break
        for k,v in x.items():
            yield from text_pairs(v,f'{path}.{k}')
    elif isinstance(x,list):
        for i,v in enumerate(x):
            yield from text_pairs(v,f'{path}[{i}]')

def bilingual(obj,where):
    require(isinstance(obj,dict) and str(obj.get('en') or '').strip() and str(obj.get('zh') or '').strip(),f'Needs English and Chinese text: {where}')

def https(url,where):
    u=urlsplit(url or '')
    require(u.scheme=='https' and u.hostname and not u.username and not u.password,f'Invalid URL: {where}')

X_TYPES={'plan','proposal','release','research','statement'}
X_POST=re.compile(r'https://(x|twitter)\.com/[A-Za-z0-9_]+/status/\d+')

def validate_chains():
    """data/chains.json feeds the website; data/projects.json stays the list of projects that already use post-quantum signatures."""
    data=read('chains.json')
    chains=data['chains']
    unique(chains,'chain')
    project_ids={p['id'] for p in read('projects.json')['projects']}
    from build_site import CHIPS, banned_words
    projects_by_id={p['id']:p for p in read('projects.json')['projects']}
    source_type={s['id']:s['source_type'] for s in read('sources.json')['sources']}
    gecko=[c['coingecko_id'] for c in chains if c.get('coingecko_id')]
    require(len(gecko)==len(set(gecko)),'Duplicate coingecko_id in chains.json')
    for c in chains:
        cid=c['id']
        require(re.fullmatch(r'[a-z0-9-]+',cid),f'Chain ID must be lowercase letters, digits and hyphens: {cid}')
        require(c['kind'] in {'upgrading','native'} and c['network_status'] in {'mainnet','testnet','devnet'} and c['layer'] in {'L1','L2'},f'Kind, network or layer: {cid}')
        require(type(c['stage']) is int and 0<=c['stage']<=5 and c['stage_label']==STAGE_LABELS[c['stage']],f'Stage and label: {cid}')
        require(c['network_status']=='mainnet' or c['stage']<=3,f'Stage 4 and 5 need a mainnet: {cid}')
        for f in ['algo','holder_can_use_today','consensus','stage_basis']:
            bilingual(c[f],f'{cid}.{f}')
        if c.get('note'):
            bilingual(c['note'],f'{cid}.note')
        for k,v in (c.get('four') or {}).items():
            require(k in {'today','watch','can','next'},f'Unknown box {k}: {cid}')
            bilingual(v,f'{cid}.four.{k}')
        require(c['algo_chips'] and set(c['algo_chips'])<=set(CHIPS),f'Unknown algorithm label: {cid}')
        ls=c['latest_step']
        require(ls.get('date') is None or DATE_RE.match(ls['date']),f'Latest step date: {cid}')
        bilingual({'en':ls.get('text'),'zh':ls.get('zh')},f'{cid}.latest_step')
        # A date on the review day is either our own check or a project event that happened that day: say which.
        require(ls.get('date')!=c['last_reviewed'] or isinstance(ls.get('is_check_date'),bool),f'Latest step dated on the review day needs is_check_date true or false: {cid}')
        for i,m in enumerate(c['milestones']):
            w=f'{cid}.milestones[{i}]'
            require(m['type'] in MILESTONE_TYPES and m.get('grade') in {'primary','official'},f'Milestone type or grade: {w}')
            require(m.get('date')!=c['last_reviewed'] or isinstance(m.get('checked'),bool),f'Milestone dated on the review day needs checked true or false: {w}')
            require(m.get('date') is None or DATE_RE.match(m['date']),f'Milestone date: {w}')
            bilingual({'en':m.get('name'),'zh':m.get('zh')},w)
            if m.get('status'):
                bilingual(m['status'],f'{w}.status')
            https(m.get('source_url'),w)
            require(isinstance(m.get('progress',True),bool),f'progress is true or false: {w}')
        # The day post-quantum signatures became usable on the current mainnet: genesis for native chains, the
        # upgrade's activation (or first deployment) for the rest. Only stage 4 and 5 chains have one.
        since=c.get('pq_mainnet_since')
        if since is not None:
            w=f'{cid}.pq_mainnet_since'
            require(c['stage']>=4,f'Only stage 4 and 5 chains have a post-quantum mainnet date: {w}')
            require(re.fullmatch(r'\d{4}-\d{2}-\d{2}',since.get('date') or '') and date.fromisoformat(since['date'])<=date.fromisoformat(c['last_reviewed']),f'Date (YYYY-MM-DD, not after last_reviewed): {w}')
            require(since.get('basis') in {'genesis','relaunch','activation','deployment'} and since.get('grade') in {'primary','official'},f'Basis or grade: {w}')
            bilingual(since.get('event'),f'{w}.event')
            https(since.get('source_url'),w)
        for i,u in enumerate(c['unverified']):
            bilingual(u['claim'],f'{cid}.unverified[{i}].claim')
            bilingual(u['reason'],f'{cid}.unverified[{i}].reason')
            https(u['url'],f'{cid}.unverified[{i}]')
        # Every chain cites at least one primary source; a stage of 2 or more rests on one.
        proj=projects_by_id.get(c.get('projects_id'))
        primary_ms=[m for m in c['milestones'] if m['grade']=='primary']
        primary_src=[s for s in (proj or {}).get('sources',[]) if source_type[s] in PRIMARY_TYPES]
        require(primary_ms or primary_src,f'Needs at least one primary source: {cid}')
        # Stage 3 and up: a post-quantum signature can spend coins on a public testnet or mainnet, shown by
        # a primary testnet/mainnet milestone, or by a listed project on that network with a primary source (code,
        # release, chain data) behind it.
        if c['stage']>=3:
            live={'testnet','mainnet'} if c['stage']==3 else {'mainnet'}
            require(any(m['type'] in live for m in primary_ms) or (proj and proj['network_status'] in live and (primary_src or primary_ms)),
                    f'Stage {c["stage"]} needs primary evidence that post-quantum signatures spend coins on a {"/".join(sorted(live))}: {cid}')
        for where,en,zh in text_pairs(c,cid):
            a,b=numbers(en,True),numbers(zh,False)
            require(a==b,f'English and Chinese differ in numbers at {where}: only English {sorted(a-b)}, only Chinese {sorted(b-a)}')
            bad=banned_words(en)+banned_words(zh)
            require(not bad,f'Banned word {bad} at {where}')
        require(not c.get('projects_id') or c['projects_id'] in project_ids,f'projects_id not in projects.json: {cid}')
        for s in c.get('sources') or []:
            https(s if isinstance(s,str) else s['url'],f'{cid}.sources')
        for s in c.get('extra_sources') or []:
            https(s['url'],f'{cid}.extra_sources')
        # code.repo is a GitHub owner/repo; a repository hosted elsewhere names its host (and the host's software)
        code=c.get('code')
        if code:
            for r in ([code['repo']] if code.get('repo') is not None else [])+list(code.get('also') or []):
                require(isinstance(r,str) and re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',r),f'code.repo and code.also are owner/repo (put another host in code.host): {cid}: {r!r}')
            for u in code.get('mirrors') or []:
                https(u,f'{cid}.code.mirrors')
            if 'host' in code:
                require(re.fullmatch(r'[a-z0-9-]+(\.[a-z0-9-]+)+',code['host'] or '') and code['host']!='github.com' and code.get('host_name'),f'code.host is a hostname other than github.com, with code.host_name: {cid}')
        n=c['network']
        # Without block_interval_s a chain gets the 10-minute limit; a slower target must be stated with its source.
        if n.get('block_interval_s') is not None:
            require(type(n['block_interval_s']) in (int,float) and n['block_interval_s']>0 and n.get('block_interval_source'),f'Block interval and its source: {cid}')
        if n.get('probe'):
            https(n['probe']['url'],f'{cid}.network.probe')
        else:
            bilingual(n.get('no_probe_reason'),f'{cid}.network.no_probe_reason')
        # An independent explorer that confirms or overrules the chain's own endpoint before a chain is called stopped.
        if n.get('check'):
            require(n.get('probe'),f'An independent check needs a probe to check: {cid}')
            https(n['check']['url'],f'{cid}.network.check')
        require(n.get('source_kind') in (None,'project','community'),f'network.source_kind is project or community: {cid}')
        # Researched dimensions: how existing coins move (stage 2 and up), whether the post-quantum code is audited
        # (stage 3 and up), and coins behind exposed public keys (published research only). Each carries its source.
        for key,values,min_stage in (('migration',{'native','available','testnet','planned','none','unknown'},2),
                                     ('audit',{'audited','partial','none_found','unknown'},3)):
            x=c.get(key)
            if c['stage']>=min_stage and key=='migration':
                require(x,f'Stage {c["stage"]} needs a migration entry: {cid}')
            if x:
                require(c['stage']>=min_stage,f'{key} is recorded only from stage {min_stage}: {cid}')
                require(x.get('value') in values,f'{key}.value is one of {sorted(values)}: {cid}')
                bilingual(x,f'{cid}.{key}')
                require(x.get('grade') in ('primary','official'),f'{key}.grade is primary or official: {cid}')
                if x['value']!='unknown' or x.get('source_url'):
                    https(x.get('source_url'),f'{cid}.{key}.source_url')
                if x.get('date'):
                    date.fromisoformat(x['date'])
        # a neutral note on premines, treasuries or developer shares, shown as background on the chain page
        sp=c.get('supply')
        if sp:
            bilingual(sp,f'{cid}.supply')
            https(sp.get('source_url'),f'{cid}.supply')
            require(sp.get('grade') in ('primary','official'),f'supply.grade is primary or official: {cid}')
        if c.get('algo_note'):
            bilingual(c['algo_note'],f'{cid}.algo_note')
        e=c.get('exposure')
        if e:
            bilingual(e,f'{cid}.exposure')
            require(e.get('figure') and e.get('publisher'),f'exposure names its figure and publisher: {cid}')
            require(e.get('figure_zh') and CJK.search(e['figure_zh']),f'exposure figure has a Chinese version (figure_zh): {cid}')
            https(e.get('source_url'),f'{cid}.exposure.source_url')
            date.fromisoformat(e['date'])
        for w in c.get('watch',[]):
            require(w['type'] in {'pr','issue','file'} and w['label'] and w['repo'],f'Watch entry: {cid}')
        date.fromisoformat(c['last_reviewed'])
        # Chinese name only where one is in common use; search aliases and pinyin initials of Chinese names
        require(c.get('zh_name') is None or (isinstance(c['zh_name'],str) and re.search(r'[\u4e00-\u9fff]',c['zh_name'])),f'zh_name is null or a Chinese name: {cid}')
        for f in ('aliases','pinyin'):
            require(isinstance(c.get(f,[]),list) and all(isinstance(a,str) and a.strip()==a and a for a in c.get(f,[])),f'{f} is a list of trimmed strings: {cid}')
        require(all(re.fullmatch(r'[a-z]+',x) for x in c.get('pinyin',[])),f'pinyin holds lowercase initials only: {cid}')
        # What people with a public identity say on X about the chain's quantum plans: claims, never part of the stage.
        for i,t in enumerate(c.get('x_talk') or []):
            w=f'{cid}.x_talk[{i}]'
            require(DATE_RE.match(t.get('date') or '') and DATE_RE.match(t.get('checked') or '') and t['date']<=t['checked'],f'date and checked (YYYY-MM-DD, date not after checked): {w}')
            require(isinstance(t.get('who'),str) and t['who'].strip(),f'who names a public identity: {w}')
            bilingual(t.get('relation'),f'{w}.relation')
            require(t.get('type') in X_TYPES,f'type is one of {sorted(X_TYPES)}: {w}')
            bilingual(t.get('summary'),f'{w}.summary')
            require(X_POST.fullmatch(t.get('url') or ''),f'url is an x.com post: {w}')
        talk=c.get('x_talk') or []
        require(len({t['url'] for t in talk})==len(talk),f'each X post is listed once: {cid}')
        require([t['date'] for t in talk]==sorted((t['date'] for t in talk),reverse=True),f'x_talk is newest first: {cid}')
        # how many ordinary users asked is an estimate that cannot be checked, and its links would name them: kept off the data
        require('x_asks' not in c,f'x_asks is not published: {cid}')
    # an alias or pinyin must not point at two chains
    owner={}
    for c in chains:
        for a in [c['name'],c.get('zh_name')]+c.get('aliases',[])+c.get('pinyin',[]):
            if not a:
                continue
            k=re.sub(r'[\s\-_.]','',a.lower())
            require(owner.setdefault(k,c['id'])==c['id'],f'Search alias "{a}" names both {owner[k]} and {c["id"]}')
    reasons=data['not_listed_reasons']
    for k,v in reasons.items():
        bilingual(v,f'not_listed_reasons.{k}')
    left=[x['coingecko_id'] for x in data['not_listed']]
    require(len(left)==len(set(left)) and not set(left)&set(gecko),'not_listed must not repeat or overlap tracked chains')
    for x in data['not_listed']:
        require(x['reason'] in reasons,f"Unknown reason for {x['coingecko_id']}")
        if x.get('note'):
            bilingual(x['note'],f"not_listed.{x['coingecko_id']}.note")
    net_path=ROOT/'data/network.json'
    if net_path.exists():
        net=json.loads(net_path.read_text(encoding='utf-8'))
        require(set(net['chains'])=={c['id'] for c in chains},'data/network.json must have one entry per chain; run scripts/patrol.py')
    print(f'OK: {len(chains)} chains in chains.json, {len(left)} top-100 coins left out with reasons')

def validate():
    projects=read('projects.json')['projects']
    parameters=read('signature-sizes.json')['parameters']
    sources=read('sources.json')['sources']
    release=read('release.json')
    from embeds import DATA_LICENSE
    for name in ('chains.json','sources.json','network.json'):
        require(read(name).get('license')==DATA_LICENSE,f'{name} starts with the license block in scripts/embeds.py (DATA_LICENSE)')
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
    generated=outputs()
    require({c['path'] for c in release['charts']}=={k for k in generated if k.startswith('charts/')},'release.json must list the generated charts')
    for relative,text in generated.items():
        require((ROOT/relative).read_text(encoding='utf-8')==text,f'Generated file is stale: {relative}; run scripts/export.py')
    # docs/projects.md headings become anchors; badge and table links use the project ID.
    for p in projects:
        require(re.sub(r'[^a-z0-9 -]','',p['name'].lower()).replace(' ','-')==p['id'],f"ID must match the heading anchor: {p['id']}")
    # These are scope safeguards for the original snapshot, not security ratings.
    by_name={p['name']:p for p in projects}
    require(by_name['QANplatform']['network_status']=='testnet','QANplatform snapshot must retain testnet scope')
    require(by_name['Mochimo']['consensus']=='PoS','Mochimo snapshot must retain post-transition PoS')
    require('L2' in by_name['Starknet']['consensus'],'Starknet snapshot must retain L2 scope')
    validate_research()
    validate_chains()
    print(f"OK: {len(projects)} projects, {len(parameters)} size references, {len(sources)} sources, generated charts, tables and README summaries")

if __name__=='__main__':
    validate()
