# Sources and calculation notes

[English explainer](README.md) · [中文图解](README.zh-CN.md)

The r8 sources were reviewed on October 31, 2026. The paper and Chaincode report were read again on November 3 for this GitHub edition. The r8 posts and Nic Carter segment were not reviewed again that day. No third-party artwork or full document is redistributed here.

## r8's framework

| ID | Source | What we use it for |
| --- | --- | --- |
| R1 | [Earlier BRUTE explanation, April 22, 2025](https://x.com/r8raq/status/1914917520361787871) | Five-part argument and the author's illustrative start, duration and treatment of unmigrated coins. |
| R2 | [Six-part BRUTER definitions](https://x.com/r8raq/status/2021895235609997760) · [BRUTER diagram](https://x.com/r8raq/status/2028457302236463552) | Bigger blocks, Raqcoin signing, upgrade, transfer, elimination and residual funds. The first R names the author's signing example. |
| R3 | [Handwritten migration diagram](https://x.com/r8raq/status/2116439720175775954) | The framework and attributed timing scenarios behind the original visual explainer. |
| R4 | [Residual funds](https://x.com/r8raq/status/2041020681782251666) · [Objection to unfair disposal](https://x.com/r8raq/status/2011442996781392363) · [Property-rights argument](https://x.com/r8raq/status/2111624420330795328) | Distinguishing most funds from all funds, and the author's opposition to forced treatment. |
| R5 | [Q−10 and market forecast](https://x.com/r8raq/status/2116329996553793599) · [Ten-year lead / full-migration position](https://x.com/r8raq/status/2114233854265356534) | Attribution for the earlier X edition and the author's preferred lead time. These are his scenarios and positions. |

These posts document what r8 argues. They don't establish a Bitcoin activation decision, the safety of a signing implementation, a fixed attack date or a price outcome.

## Other research

| ID | Source | Specific use and limit |
| --- | --- | --- |
| P1 | Pont, Kearney, Moyler and Perez-Delgado, [Downtime Required for Bitcoin Quantum-Safety, v1 (2024)](https://arxiv.org/html/2410.16965v1), sections 3–4 | Historical UTXO count and idealized processing assumptions. This models block-space processing, not the full transition. |
| P2 | Anthony Milton and Clara Shikhelman, [Bitcoin and Quantum Computing: Current Status and Future Directions (May 2025)](https://chaincode.com/bitcoin-post-quantum.pdf), printed pages 29–34 | Ownership dilemmas, dormant versus lost funds and migration/recovery proposals. We don't use its historical BTC totals as current estimates or adopt all its proposed timelines. |
| P3 | Nic Carter, [The Delphi Podcast, January 9, 2026, 30:07–32:18](https://thedelphipodcast.buzzsprout.com/2609274/episodes/18990969-nic-carter-quantum-threatens-600b-of-bitcoin?t=1807) | Time for voluntary holder migration beyond the software upgrade. This narrow overlap doesn't imply endorsement of BRUTER or r8's forecasts. The segment was reviewed for the October 31 edition; it was not reviewed again on November 3. |

## Capacity calculation

The calculation uses the June 2024 snapshot in P1: 186,676,874 UTXOs and an optimistic 17,020 upgrades per block. At ten minutes per block, `ceil(186676874 / 17020)` gives 10,969 blocks, or 76.173611 days. Dividing by a 25% allocation gives 304.694444 days. The diagrams round those values to about 76 and 305 days.

The paper prints 76.16 days; the [author's calculator](https://www.josephkearney.co.uk/bitcoin-quantum-safety) prose previously showed 10,967 blocks, while its public logic used a ceiling. We keep the stated inputs and show our own integer arithmetic rather than claim an exact reproduction of every printed value. The hosted calculator's code was not copied or executed, and no open-source license is asserted for it.

These figures assume unchanged block rules, idealized packing and omitted overhead. The model counts all UTXOs, not a selected fraction of BTC value. Consensus, development, deployment, holder participation and residual-fund policy are outside the calculation. It doesn't prove a 10–20 year migration.

The inputs, outputs and assumptions are in [capacity.json](capacity.json). From the repository root:

```sh
python3 scripts/bitcoin_capacity.py --check
```

## Rebuilding the diagrams

Paired labels and panel content are in [panels.json](panels.json). Each English panel has the same subject and qualifications as its Chinese partner. The diagrams are this repository's own visual explanation; the original r8 images are linked above.

```sh
python3 scripts/build_bitcoin_charts.py
python3 scripts/build_bitcoin_charts.py --check
```

This builds or checks the editable SVG files with the Python standard library. The committed PNGs are renders of those SVGs at 1,800 pixels wide, with Arial and PingFang SC available to the renderer. Use an SVG renderer with those fonts, or suitable Latin and CJK substitutes, to make PNGs locally. [artifacts.json](artifacts.json) records both formats and their SHA-256 hashes; `scripts/validate.py` checks those files and their language pairs. It does not certify the underlying cryptography.
