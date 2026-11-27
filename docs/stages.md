# How the tracker rates chains

The website at <https://balance0014.github.io/post-quantum-blockchains/> answers one question for each chain: can someone holding the coin use a post-quantum signature today? This page is the rulebook behind it. The listing rules for [projects.md](projects.md) are in the [methodology](methodology.md); this page covers the stage tracker built on [`data/chains.json`](../data/chains.json).

The tracker rates what is live. It doesn't forecast when quantum computers might break today's cryptography, and it says nothing about prices. Stages are never paid for.

## The six stages

| Stage | Name | Reached when |
| --- | --- | --- |
| 0 | Nothing public | No public post-quantum research, roadmap or proposal from the core developers, the foundation or the main client teams. |
| 1 | Research | Official research, a roadmap, an open proposal or prototype code exists, but nothing is merged into the official proposal repository yet. |
| 2 | Formal proposal | A quantum-related protocol change is merged into the official proposal repository (BIP, EIP, ZIP and so on) at Draft status or later. |
| 3 | Testnet | On the chain's official public testnet, holders can authorize a transfer with a post-quantum signature. |
| 4 | Mainnet opt-in | On mainnet, holders can choose post-quantum protection for their funds at the protocol level. |
| 5 | Default | New accounts use post-quantum signatures by default, or transfers require them. |

Rules:

1. A chain gets the highest stage that primary sources support on the check date.
2. Stages 3 to 5 need a post-quantum way to authorize spending. Hiding public keys or making funds recoverable later is recorded, but tops out at stage 2.
3. Third-party wallets, vaults and contracts are listed on the timeline but never change a chain's stage. One exception: on a chain where every account is a contract and the protocol has no built-in account signature (Starknet), a post-quantum account class declared on mainnet counts, whoever wrote it; the chain's entry names the author and whether it is audited.
4. Plans and target dates are shown and never rated. When only the project's own documentation or announcements describe a feature, and no code, release or chain data confirms it, the stage is capped at 2 and the reason says so.
5. Only a person changes a stage, and only with a primary-source milestone in `data/chains.json`. The weekly patrol never does.

## Evidence grades

| Grade | What counts | What it can do |
| --- | --- | --- |
| Primary source | Running code, releases, chain parameters read from an official endpoint, the official proposal repository | Can set a stage |
| Official claim | Project websites, blogs, roadmaps | Shown on the timeline as a plan |
| Unverified | Media, third parties, social posts | Listed apart until a primary source confirms it |

Every date is the day the event happened, in UTC, not the day we read about it. When an entry records our own check (for example, "no post-quantum proposal in the repository" or a block height read from an explorer), it is dated on the check day and marked **checked**, and it is left out of the monthly milestone chart. A data source run by the project itself, or by its community, is labelled as such on the chain page.

## Dimensions beside the stage

The stage answers one question. The table and chain pages add the dimensions below, each with a fixed definition, a source and a date. None of them changes a stage.

| Dimension | What it counts | Where it comes from | How often | Limits |
| --- | --- | --- | --- | --- |
| Standard status | Given per scheme, so a chain that names two schemes has two statuses (Ethereum: ML-DSA is a NIST standard, Falcon is selected but not final). Each scheme is a NIST standard (ML-DSA, SLH-DSA), NIST-selected but not final (Falcon / FN-DSA, SPHINCS+), a variant whose version no outside body has reviewed (a project's own Dilithium, a deterministic Falcon, a reduced-usage SLH-DSA profile), stateful hash-based (XMSS, WOTS+), the project's own construction, or none. Publicly broken parameters are a separate flag | The algorithm labels in `chains.json` | Each review | Says what the scheme is, not how well the chain implemented it |
| Security level | The NIST category of each parameter set the entry names (ML-DSA-44 is 2, ML-DSA-65 is 3, ML-DSA-87 is 5, Falcon-512 is 1, Falcon-1024 is 5, SLH-DSA-SHA2-128s is 1) | The parameter set named in the algorithm text | Each review | A family named without a parameter set is shown as not stated; an own construction is not assessed |
| Coverage | Whether new accounts get post-quantum signatures by default, can opt in on mainnet, only on a testnet, or not at all | Follows the stage (5, 4, 3, below 3) | Each review | Says nothing about coins already held under old keys; see migration |
| Migration | How coins under classical keys reach post-quantum protection: native (none exist), available, testnet, planned, none or unknown | `migration` in `chains.json`, with a primary source or official claim | Each review, stage 2 and up | A plan is recorded as planned even when its date is set |
| Audit | Whether an outside firm published a report whose scope covers the post-quantum signature code now live: audited, partial (scope or version does not match), none found, unknown | `audit` in `chains.json`, with the report or the place we looked | Each review, stage 3 and up | Self-reviews, bug bounties and proofs of an upstream library are not audits; "none found" means we did not find one |
| Exposure | Coins behind public keys already visible on chain | `exposure` in `chains.json`, only where published research gives a figure | When new research appears | Estimates differ by method; we show one published figure with its date and name the others |
| Post-quantum progress | Milestones with a primary source dated in the 90 days before the check date, and the newest milestone of any grade | Milestones in `chains.json` | Each review | Counts what we recorded, not all work in progress; our own checks are left out |
| On mainnet since | The day post-quantum signatures became usable on the current mainnet | `pq_mainnet_since` in `chains.json` | Each review, stage 4 and up | Left blank rather than guessed when no source gives the date |
| Code activity | Commits to the main repository's default branch in 90 days, leaving out `[bot]` authors | GitHub API, weekly patrol | Weekly | Background only: counts every kind of change, not post-quantum work |

We do not count commits by keyword. Words like "quantum" or "dilithium" match renames, dependency bumps and comments as easily as real work, miss work described in other words, and reward projects that write more commit messages. Post-quantum progress is counted from sourced milestones instead.

## Which chains are listed

- **The largest blockchains.** Every coin in the CoinGecko top 100 by market cap that pays fees or secures consensus on a network of its own, layer 1 or layer 2. Stablecoins, tokenized funds and commodities, wrapped and staked tokens, and exchange, app, governance or meme tokens without their own network are left out. Each coin left out is in `not_listed` in `data/chains.json` with its reason, and [`scripts/rank.py`](../scripts/rank.py) fails CI when a top-100 coin is in neither list.
- **Chains with a mainnet opt-in.** Chains outside the top 100 that use classical keys by default and already let holders choose a post-quantum option on mainnet.
- **Post-quantum native and early projects.** Projects with public code or a running network, plus at least one sign of activity: a CoinGecko or CoinMarketCap listing, 50 or more stars on the main GitHub repository, or posts from the project or its community in the last 30 days. Commits by the project's own team do not count as activity. A project without a running mainnet is listed as early. Projects with only a white paper are kept as leads, not listed.

The groups on the home page are worked out from the data: no mainnet means early; post-quantum by default means native; a top-100 rank means the largest blockchains; anything else at stage 4 is a chain with a mainnet opt-in.

## Network status

Each chain names the explorer or public RPC it is read from (`network.probe` in `data/chains.json`). [`scripts/patrol.py`](../scripts/patrol.py) reads the newest block, the latest release and the commits of the main node repository, then sets one status:

| Status | Shown when |
| --- | --- |
| Running | The newest block is within the limit, and the main repository had at least one commit in the last 90 days (or no repository is tracked). |
| Blocks yes, code quiet | The newest block is within the limit, but the main repository had no commits in the last 90 days. |
| Blocks stopped | The chain's endpoint and an independent explorer both show a newest block older than the limit. |
| Could not check | The endpoint did not answer, the chain has no public endpoint, or the endpoint shows an old block and no independent explorer confirms it. |

**The limit** is `max(10 minutes, 6 × target block time)`. Most chains get 10 minutes. Chains whose target block time is longer than 100 seconds get six target block times, for example 60 minutes for Bitcoin. Block times follow a roughly exponential distribution on proof-of-work chains, so a healthy chain shows a block older than six target times in about 1 check in 400 (e⁻⁶). A slow chain must state its target block time and the source of that number (`block_interval_s` and `block_interval_source`).

Public RPCs often sit behind load balancers, and a lagging node can answer with an old block. The patrol reads every endpoint at least twice, three seconds apart, and a third time when the two reads disagree; it keeps the highest block and records when it read it and every height it saw. When the newest block is older than the limit, the patrol reads an independent explorer (`network.check`), if the chain has one. A chain is marked stopped only when both sources agree; with one source, it is marked could not check.

**The 90-day window** runs from the patrol date minus 90 days. Commits are counted on the default branch of the repository in `code.repo`; repositories in `code.also` are shown but don't change the status. The latest release is the newest non-draft GitHub release, or the newest tag if the repository publishes no releases.

## Algorithm labels

| Label | Meaning |
| --- | --- |
| ML-DSA · NIST FIPS 204 | ML-DSA as published in NIST FIPS 204 (August 2024) |
| SLH-DSA · NIST FIPS 205 | SLH-DSA as published in NIST FIPS 205 (August 2024) |
| Falcon · NIST-selected (FN-DSA) | Selected by NIST and being standardized as FN-DSA (FIPS 206, not final yet) |
| XMSS · IETF RFC 8391 | Stateful hash-based signature standardized in RFC 8391 |
| NIST family · version not reviewed | From a NIST-selected family, but a pre-standard version or a parameter set not reviewed here |
| SPHINCS+ · basis of SLH-DSA | The submission NIST standardized as SLH-DSA; pre-standard versions differ in details |
| Hash-based · not a standard on its own | A one-time signature such as WOTS+, a building block of standards like XMSS |
| Not a NIST standard | Not standardized by NIST or the IETF |
| Custom construction | Designed by the project itself, without an outside standard |
| Older parameters publicly broken | A public attack breaks parameters this chain used or still allows |
| No post-quantum scheme yet | The chain has no post-quantum signature scheme |

## Data and scripts

| File | Written by | Holds |
| --- | --- | --- |
| [`data/chains.json`](../data/chains.json) | People, through pull requests | Stage, milestones, summaries, algorithm labels, the endpoint and repository to check, the top-100 coins left out |
| [`data/network.json`](../data/network.json) | [`scripts/patrol.py`](../scripts/patrol.py), weekly | Newest block, latest release, commits in 90 days, watched proposals, status |
| `data/changes/<date>.json` | [`scripts/patrol.py`](../scripts/patrol.py), weekly | What differs from the previous patrol |
| [`data/market_cap.json`](../data/market_cap.json) | [`scripts/rank.py`](../scripts/rank.py), monthly | CoinGecko's top 100: rank, ID, symbol and name only |
| [`data/projects.json`](../data/projects.json) | People, through pull requests | The projects that already use post-quantum cryptography; the tracker links these entries with `projects_id` |

[`scripts/build_site.py`](../scripts/build_site.py) builds the website from these files, and [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) publishes it whenever `main` changes.

## How it stays current

- **Weekly**, every Monday at 01:00 UTC, [`.github/workflows/patrol.yml`](../.github/workflows/patrol.yml) runs the patrol and proposes the new data in a pull request. A person checks each change against its source before merging.
- **Monthly**, on the first Monday, the patrol also refreshes the market-cap list and opens a re-check issue: every row is checked against its sources, `last_reviewed` is updated, and any coin new to the top 100 is classified.
- **On every change**, CI checks ten facts in [`data/golden.json`](../data/golden.json) that were checked by hand against pinned primary sources (for example Algorand's consensus version 42, NEAR's protocol version 85 and Raqcoin's default key configuration 274). An edit that drops or contradicts one fails, and [`scripts/golden.py`](../scripts/golden.py) `--online` confirms that each pinned source still shows its fact.
- **Any time**, anyone can [report a correction](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=correction.yml) or [submit a project](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml) with primary sources.
