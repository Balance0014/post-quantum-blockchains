# Changelog

## 0.5.0 — November 27, 2026

- A stage tracker website, in English and Chinese: https://balance0014.github.io/post-quantum-blockchains/. Each chain has its own page. It opens with one dated sentence that gives the stage, the reason for it and a link to the source, followed by dated milestones, all sources and network status. Every label has a definition on hover or tap, and the method page publishes the rules, thresholds, data fields, limits and how to cite. `scripts/build_site.py` builds it from the data, and GitHub Actions publishes it.
- The home page reads in layers: an overview (the answer, four headline figures, the largest chains by stage, and a running total of post-quantum mainnet launches), a card for each group, then the full table, which filters by group, stage, network status and algorithm family, searches by name, and sorts by market cap, stage, start date, latest change or name. Filters live in the address, so a filtered view can be shared, and `/` jumps to the search box. Below the table come a timeline (when post-quantum signatures reached each mainnet, and milestones per month), a short version of the method, data downloads and public contact channels. Every chart has a title, a source and date line, a CSV download, and values on hover or tap. A stage always shows as a numbered colour badge with a six-step bar. The site follows the system's light or dark theme and has a switch, and switching language keeps the reader's place.
- Chains at stage 4 or 5 can record `pq_mainnet_since` in `data/chains.json`: the day post-quantum signatures became usable on the current mainnet (the genesis block for post-quantum native chains, the upgrade's activation for the others), with its own source. 22 of the 26 chains at stage 4 or 5 have one; the rest are shown as not yet sourced rather than guessed.
- The website serves the data for download (`data/chains.csv`, `chains.json`, `network.json`, `projects.json`, `sources.json`) and an `llms.txt` for AI assistants, rebuilt from `data/` on every build.
- `data/chains.json` rates chains from stage 0 to 5 under the rules in [docs/stages.md](docs/stages.md): every CoinGecko top-100 coin that has its own network (layer 1 or layer 2), older chains with a mainnet opt-in, and post-quantum native and early projects. Top-100 coins without their own network are listed with the reason, and `scripts/rank.py` fails CI when a top-100 coin is in neither list.
- Eight new projects in `projects.json`: Splendor Quantum, Qbit, Discrete, Dilithion, Parano1d, Aere Network, QoreChain and Minima. Existing project entries are unchanged.
- A weekly patrol (`scripts/patrol.py`) reads each chain's newest block from its own RPC or explorer, its latest release and its commits in 90 days, checks every source link, and proposes the results in a pull request that a person reviews. It never changes a stage.
- New CI checks: the chain schema and evidence rules (stage 3 and up needs primary evidence; a feature described only in a project's own documents is capped at stage 2), matching numbers in English and Chinese, banned words, every source link opens (`scripts/check_links.py`), every link inside the website resolves, and the share image shows current figures.
- Corrections in `chains.json`, which differ from `projects.json` (not edited in this release): QANplatform is rated 2, because only its documentation describes post-quantum signing on the testnet; Quantus accepts both ML-DSA-87 and ML-DSA-65; QuantumCoin is also labelled "NIST family" for its pre-standard hybrid, which is still accepted.
- Corrections after an independent review of every entry. Litecoin moves from stage 0 to 2: LIP-0003, merged as a Draft, plans an ElGamal switch for MWEB amount commitments against quantum computers (it protects amounts, not holders' keys). Nexus, Nervos CKB, Raqcoin, Tidecoin, Abelian and Mochimo get sourced mainnet milestones; Neptune Cash records its 2025 relaunch and its 2026 pause; qtcchain records its first mainnet and the restart with a 2,000,000 QTC treasury; Starknet names the author of each Falcon account class and that none is audited. Wording was tightened for Aere, Parano1d, Quantus, QuantumCoin, Cellframe, BNB Chain, Pearl, Zcash, Bitcoin, Raqcoin and QANplatform.
- Every date is the day the event happened, in UTC. Entries that record our own checks are marked "checked" and left out of the monthly chart, and CI requires every entry dated on a review day to say which it is. Chain pages say when network data comes from the project's own node or a community explorer.
- The patrol reads every block endpoint two or three times and keeps the highest block, recording when it read it and every height it saw: QANplatform's public testnet RPC sits behind a load balancer, and one backend still answers with a block from September. A chain is marked stopped only when an independent explorer (`network.check`) agrees; with one source it is marked could not check, which moves Bitway from stopped to could not check.
- A golden regression check: ten facts checked by hand against pinned primary sources (`data/golden.json`, `scripts/golden.py`). CI fails if the data stops stating one of them, and the links job confirms that each pinned source still shows it.
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
