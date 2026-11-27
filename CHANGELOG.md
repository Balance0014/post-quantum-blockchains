# Changelog

## 0.5.0 — November 27, 2026

- A stage tracker website, in English and Chinese: https://balance0014.github.io/post-quantum-blockchains/. Each chain has its own page with its stage, the reason for it, dated milestones, sources and network status. Every label has a definition on hover or tap, and the bottom of the home page and the method page publish the rules, thresholds, data fields, limits and how to cite. `scripts/build_site.py` builds it from the data, and GitHub Actions publishes it.
- `data/chains.json` rates chains from stage 0 to 5 under the rules in [docs/stages.md](docs/stages.md): every CoinGecko top-100 coin that has its own network (layer 1 or layer 2), older chains with a mainnet opt-in, and post-quantum native and early projects. Top-100 coins without their own network are listed with the reason, and `scripts/rank.py` fails CI when a top-100 coin is in neither list.
- Eight new projects in `projects.json`: Splendor Quantum, Qbit, Discrete, Dilithion, Parano1d, Aere Network, QoreChain and Minima. Existing project entries are unchanged.
- A weekly patrol (`scripts/patrol.py`) reads each chain's newest block from its own RPC or explorer, its latest release and its commits in 90 days, checks every source link, and proposes the results in a pull request that a person reviews. It never changes a stage.
- New CI checks: the chain schema and evidence rules (stage 3 and up needs primary evidence; a feature described only in a project's own documents is capped at stage 2), matching numbers in English and Chinese, banned words, every source link opens (`scripts/check_links.py`), every link inside the website resolves, and the share image shows current figures.
- Corrections in `chains.json`, which differ from `projects.json` (not edited in this release): QANplatform is rated 2, because only its documentation describes post-quantum signing on the testnet and the testnet's newest block is from September 14, 2026; Quantus accepts both ML-DSA-87 and ML-DSA-65; QuantumCoin is also labelled "NIST family" for its pre-standard hybrid, which is still accepted.
- Five source links that no longer open, or close the connection for automated clients, now point to archived copies of the same pages: Abelian milestones, the Neptune Cash genesis block and three Cellframe pages.

## 0.4.0 — November 27, 2026

- The repository is now a continuously maintained map rather than an October 23 snapshot. The READMEs open with what it is, separate chains and projects from resources, and state what gets listed and how quickly submissions are reviewed (within 7 days).
- Both charts are now drawn from the data by `scripts/charts.py` as SVG, with a "data as of" date: a deployment timeline and an algorithm map with a log-scale size comparison. They replace the hand-drawn October 23 PNGs, which remain in the git history.
- The summary counts at the top of both READMEs are generated from the data too. CI regenerates the charts, tables and summaries, fails on any difference, and now runs Python 3.9 and 3.12 on Ubuntu 24.04.
- Listed projects can link back to their entry with a [badge](CONTRIBUTING.md#listed-badge).
- The resource list has a section for papers. The methodology explains how the charts sort projects by deployment status.
- No project, source or size data changed.

## 0.3.1 — November 27, 2026

- New submissions and corrections get an automatic reply that checks their links and looks for an existing entry; a maintainer replies within 7 days.
- Added a [resource list](docs/resources.md) for wallets, libraries, standards and proposals, starting with NIST FIPS 203–205 and BIP-360/361.
- The submission form takes "None yet" for proposals without a scheme, allows more than one relationship to the project, and blank issues are off.

## 0.3.0 — November 27, 2026

- Opened the map to new projects. A submission form asks for the deployment status, scheme, primary sources, limits and the submitter's relationship to the project; no fork or pull request is needed.
- Wrote down what gets listed and how review works in the README, the Chinese README and CONTRIBUTING. Listing is free and isn't for sale.
- Each entry now carries its own review date. The 17 original entries and both maps still date from October 23, 2026.
- No data, chart or research changes.

## 0.2.2 — November 4, 2026

- Renamed the title to Post-Quantum Blockchains, matching the repository name. Old links to the repository redirect.
- No data or research changes.


## 0.2.1 — November 3, 2026

- Replaced the newly adapted Bitcoin diagrams with unchanged copies of the original English and Chinese four-panel editions.
- Recorded original filenames, hashes, dimensions and publication links; identified the editions' different scope.
- Removed the adaptation source and diagram builder. The homepage still displays all four panels after the two original maps.
- Preserved all original project and algorithm data.


## 0.2.0 — November 3, 2026

- Organized the research into project deployments, algorithm comparisons and Bitcoin migration.
- Changed the displayed title to Post-Quantum Crypto Research; the repository URL stays the same.
- Added a sourced BRUTER explainer, four paired English/Chinese diagrams and an independently written capacity calculation.
- Kept r8's framework and scenarios attributed, with earlier X editions linked separately.
- Preserved the October 23 project and signature-size data and the two original map images.

## 0.1.0 — October 28, 2026

- Opened the data behind the October 23 deployment timeline and algorithm map.
- Added 17 project entries with scope notes and source references.
- Added 12 signature-size reference rows, identifying the eight shown in the algorithm chart.
- Preserved the two original English PNGs with snapshot dates and SHA-256 checksums.
- Added CSV exports, readable tables, contribution forms and local data checks.
- Documented release-day source checks separately from the snapshot's review dates.

This release adds traceability and reuse. It does not claim that all network states were independently reverified on October 28.
