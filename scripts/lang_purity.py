"""Each language's pages read in that language only.

  python3 scripts/lang_purity.py [--site _site]

English pages: no Chinese characters in anything a reader sees (text, tooltips, labels, the page description).
Chinese pages: Latin-script words only where they are names. A word passes when it is
  - on the list below (standards, algorithm and curve names, file formats, platforms and the like), or
  - part of a chain's name, ticker, id or alias in data/chains.json, or
  - a name the data writes the same way in both languages: it appears in the data's English text and in its
    Chinese text (a product, a repository, a proposal), or
  - a version or standard number: a word with a digit in it (v29, testnet4, Q1).
Everything else on a Chinese page is reported, so an English sentence or an untranslated label fails the build.
Chinese pages also fail on a half-width space right after full-width punctuation (。，：；！？、), including across
inline tags ("<b>不能。</b> 暂无"), since the punctuation already carries its own space.

Not checked, because they are not running text: scripts, styles, code samples (pre, code, kbd), elements marked
with another language (the language switch), link text that is a URL or a repository path, and metadata other than
the page title and description.
"""
import argparse
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Names a Chinese page may use as they are. Case-sensitive: "PR" passes, "pr" does not.
ALLOWED = set('''
AI API CSV Balance Zhao Pages meme JSON JSONL HTML SVG PNG Markdown README UTC X GitHub Discussions Issues CC BY NC MIT BibTeX CFF
NIST FIPS SP IETF RFC ISO IR CNSA NSA BSI ANSSI ETSI QR
ML DSA KEM SLH FN Falcon Dilithium CRYSTALS Kyber SPHINCS SHA SHA2 SHA3 SHAKE XMSS XMSSMT MT LMS HSS LM OTS WOTS
UOV MAYO SNOVA QR-UOV Rainbow SQIsign FAEST MQOM SDitH HAWK CROSS LESS Mirath PERK RYDE BLISS NTRU qTESLA Picnic
ePrint Beullens Hess q Gitea
ECDSA EdDSA Ed25519 Ed448 Schnorr BLS secp256k1 secp256r1 P256 Curve25519 RSA ElGamal ZK STARK SNARK zk
PoW PoS DPoS PoX BFT KES VRF Rollup OP Stack L1 L2 EVM WASM VM SDK CLI RPC P2P UTXO DeFi NFT
BIP EIP ERC BEP ZIP CIP CPS LIP DIP KIP XIP AIP ACP HIP SIP PiRC TIP CHIP SIMD MIP FLIP PR
CoinGecko
'''.split())
CJK = re.compile(r'[㐀-鿿豈-﫿]')
LATIN = re.compile(r"[A-Za-z][A-Za-z0-9]*")
# Stripped before looking for words: links, hosts, paths, handles, colours, numbers with units, parameter names.
NOISE = [re.compile(p) for p in (
    r'https?://\S+', r'\b[\w-]+(?:\.[\w-]+)+(?:/\S*)?', r'(?:^|\s)/\S+', r'\S+/\S+', r'@\w+', r'#[0-9a-fA-F]{3,8}\b',
    r'\b\w*_\w*\b', r'\[bot\]', r'\b0x[0-9a-fA-F]+\b')]
SKIP_TAGS = {'script', 'style', 'pre', 'code', 'kbd', 'samp', 'svg', 'template', 'noscript'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
TEXT_ATTRS = ('data-def', 'data-title', 'data-tip', 'aria-label', 'placeholder', 'title', 'alt')
META_TEXT = {'description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'}
# Chinese punctuation is full width and carries its own space: a half-width space after it shows as a gap.
ZH_PUNCT = '。，：；！？、'
ZH_GAP = re.compile(f'[{ZH_PUNCT}] ')
BLOCK = {'address', 'article', 'aside', 'blockquote', 'br', 'dd', 'details', 'div', 'dl', 'dt', 'figcaption', 'figure', 'footer',
         'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'section', 'summary', 'table',
         'tbody', 'td', 'th', 'thead', 'tr', 'ul'}


class Reader(HTMLParser):
    """The text a reader sees, with each piece's tag path for the report."""

    def __init__(self, page_lang):
        super().__init__(convert_charrefs=True)
        self.page_lang, self.stack, self.out = page_lang, [], []
        self.prev, self.gaps = '', []  # the text just before, across inline tags; spaces after Chinese punctuation

    def skipping(self):
        return any(s[1] for s in self.stack)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            if (a.get('name') or a.get('property')) in META_TEXT and a.get('content') and not self.skipping():
                self.out.append(('meta', a['content']))
            return
        lang = a.get('lang')
        other = bool(lang) and not lang.lower().startswith(self.page_lang)
        href = a.get('href') or ''
        # an outside link whose text is its own address or a repository path
        path_link = tag == 'a' and href.startswith('http')
        skip = tag in SKIP_TAGS or other or a.get('translate') == 'no'
        if not skip and not self.skipping():
            self.out += [(tag + '@' + k, v) for k, v in attrs if k in TEXT_ATTRS and v]
            self.gaps += [v for k, v in attrs if k in TEXT_ATTRS and v and ZH_GAP.search(v)]
        if tag in BLOCK:
            self.prev = ''
        elif skip:
            self.prev = 'x'  # a skipped name or code stands between the punctuation and what follows
        if tag not in VOID:
            self.stack.append((tag, skip, path_link))

    def handle_endtag(self, tag):
        if tag in BLOCK:
            self.prev = ''
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        if not self.skipping():
            joined = self.prev[-1:] + data  # "<b>不能。</b> 暂无" is one run of text to the reader
            if ZH_GAP.search(joined):
                self.gaps.append((self.prev[-20:] + data).strip())
            self.prev = data
        if data.strip() and not self.skipping():
            in_link = any(len(s) > 2 and s[2] for s in self.stack)
            self.out.append(('a' if in_link else (self.stack[-1][0] if self.stack else ''), data))


def words(s):
    for rx in NOISE:
        s = rx.sub(' ', s)
    # English titles quoted in 「」 or “” stay in English
    s = re.sub(r'「[^」一-鿿]*」|“[^”一-鿿]*”', ' ', s)
    return LATIN.findall(s)


def data_names():
    """Words allowed on Chinese pages because the data writes them the same way in both languages: a word that
    appears in the data's Chinese text and in its English text (a product, a repository, a proposal name)."""
    names, zh_words, en_words = set(), set(), set()
    chains = json.loads((ROOT / 'data/chains.json').read_text(encoding='utf-8'))['chains']
    for c in chains:
        for s in [c['name'], c.get('ticker') or '', c['id'], *(c.get('aliases') or [])]:
            names.update(LATIN.findall(s))
    # coins the method page lists as left out, by name and symbol
    for c in json.loads((ROOT / 'data/market_cap.json').read_text(encoding='utf-8'))['coins']:
        names.update(LATIN.findall(f"{c['name']} {c['symbol']}"))

    def walk(o, key=''):
        if isinstance(o, dict):
            for k, v in o.items():
                walk(v, k)
        elif isinstance(o, list):
            for v in o:
                walk(v, key)
        elif isinstance(o, str) and key in ('publisher', 'auditor', 'who'):
            names.update(LATIN.findall(o))  # who published, audited or posted something: a name in any language
        elif isinstance(o, str):
            if key == 'zh' or key.endswith('_zh') or CJK.search(o):
                zh_words.update(words(o))
            else:
                en_words.update(LATIN.findall(o))
    for f in ('chains.json', 'network.json', 'sources.json', 'release.json', 'projects.json'):
        p = ROOT / 'data' / f
        if p.exists():
            walk(json.loads(p.read_text(encoding='utf-8')))
    return names | (zh_words & en_words)


def check(site):
    allowed = ALLOWED | data_names()
    errors = []
    for p in sorted(site.rglob('*.html')):
        rel = p.relative_to(site).as_posix()
        zh = rel.startswith('zh/')
        r = Reader('zh' if zh else 'en')
        r.feed(p.read_text(encoding='utf-8'))
        seen = set()
        if zh:
            errors += [f'{rel}: half-width space after Chinese punctuation: {g[:80]}' for g in dict.fromkeys(r.gaps)]
        for where, text in r.out:
            if zh:
                if where == 'a' and not CJK.search(text):
                    continue  # a link whose whole text is a name, a path or a title in its own language
                bad = sorted({w for w in words(text) if w not in allowed and not any(ch.isdigit() for ch in w)})
                for w in bad:
                    if (w, text) not in seen:
                        seen.add((w, text))
                        errors.append(f'{rel}: "{w}" in <{where}> {text.strip()[:120]}')
            elif CJK.search(text):
                errors.append(f'{rel}: Chinese in <{where}> {text.strip()[:120]}')
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--site', default=str(ROOT / '_site'))
    site = Path(ap.parse_args().site)
    if not any(site.rglob('*.html')):
        sys.exit(f'no pages in {site}; build the website first')
    errors = check(site)
    pages = sum(1 for _ in site.rglob('*.html'))
    if errors:
        print('\n'.join(errors[:200]))
        sys.exit(f'{len(errors)} problems with words in the wrong language or spacing on {pages} pages (first 200 above)')
    print(f'{pages} pages read in one language each')


if __name__ == '__main__':
    main()
