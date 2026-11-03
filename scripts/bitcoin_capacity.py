#!/usr/bin/env python3
"""Reproduce a historical UTXO-capacity calculation, using no third-party code."""
import argparse
import json
from math import ceil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'research/bitcoin-migration/r8-bruter/capacity.json'

def result():
    count, per_block, minutes = 186_676_874, 17_020, 10
    blocks = ceil(count / per_block)
    days = blocks * minutes / 1440
    return {
        'source': 'https://arxiv.org/html/2410.16965v1',
        'snapshot': 'June 2024',
        'inputs': {'utxos': count, 'upgrades_per_block': per_block, 'minutes_per_block': minutes},
        'whole_blocks': blocks,
        'days_at_full_capacity': days,
        'days_at_quarter_capacity': days / 0.25,
        'assumptions': ['unchanged block rules', 'idealized packing', 'some overhead omitted'],
        'excludes': ['agreement', 'development', 'deployment', 'holder response', 'residual-fund policy'],
        'scope': 'Historical all-UTXO processing model; not total migration time or a value-weighted protection model.',
    }

def serialized():
    return json.dumps(result(), ensure_ascii=False, indent=2) + '\n'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    text = serialized()
    if args.check:
        if TARGET.read_text(encoding='utf-8') != text:
            raise SystemExit('Capacity output is stale; run scripts/bitcoin_capacity.py')
        print('OK: historical capacity arithmetic and recorded assumptions')
    else:
        TARGET.write_text(text, encoding='utf-8')
        print(TARGET.relative_to(ROOT))
