#!/usr/bin/env python3
"""Refresh the market-cap rank list used to pick "the largest blockchains".

Writes data/market_cap.json: CoinGecko's top 100 coins by market cap, keeping only rank, id, symbol
and name (no prices). Then checks that every coin in that list is either tracked in data/chains.json
(by coingecko_id) or listed in chains.json "not_listed" with the reason it is left out.

Usage:
  python3 scripts/rank.py            fetch, write data/market_cap.json, report unclassified coins
  python3 scripts/rank.py --check    only check the current data/market_cap.json (no network)
Exit code 1 when a top-100 coin is neither tracked nor listed as left out, so a person decides.
"""
import argparse
import json
import os
import ssl
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
CTX = ssl.create_default_context(cafile='/etc/ssl/cert.pem') if os.path.exists('/etc/ssl/cert.pem') else ssl.create_default_context()


def fetch():
    req = urllib.request.Request(URL, headers={'User-Agent': 'post-quantum-blockchains rank check', 'Accept': 'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30, context=CTX) as r:
                return json.load(r)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(10 * (attempt + 1))


def unclassified(market, chains):
    tracked = {c.get('coingecko_id') for c in chains['chains']}
    left_out = {x['coingecko_id'] for x in chains.get('not_listed', [])}
    return [c for c in market['coins'] if c['id'] not in tracked and c['id'] not in left_out]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    out = ROOT / 'data/market_cap.json'
    if args.check:
        market = json.loads(out.read_text(encoding='utf-8'))
    else:
        rows = fetch()
        if len(rows) < 100:
            sys.exit(f'CoinGecko returned {len(rows)} coins, expected 100')
        market = {
            'source': 'CoinGecko /coins/markets, top 100 by market cap (rank, id, symbol and name only)',
            'url': URL,
            'queried_at_utc': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            'coins': [{'rank': c['market_cap_rank'], 'id': c['id'], 'symbol': c['symbol'].upper(), 'name': c['name']}
                      for c in sorted(rows, key=lambda c: c['market_cap_rank'] or 999)],
        }
        out.write_text(json.dumps(market, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    chains = json.loads((ROOT / 'data/chains.json').read_text(encoding='utf-8'))
    missing = unclassified(market, chains)
    print(f"market_cap.json: {len(market['coins'])} coins, queried {market['queried_at_utc']}")
    if missing:
        print(f'{len(missing)} top-100 coin(s) are neither tracked in chains.json nor listed in not_listed:')
        for c in missing:
            print(f"  #{c['rank']} {c['name']} ({c['symbol']}, {c['id']})")
        return 1
    print('every top-100 coin is tracked or listed as left out with a reason')
    return 0


if __name__ == '__main__':
    sys.exit(main())
