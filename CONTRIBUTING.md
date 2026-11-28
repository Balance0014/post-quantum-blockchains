# Contributing

Found a wrong date, a missing condition or a project we should add? Project teams and independent readers use the same process.

- **Add a project:** [submit it with the form](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml). No fork or pull request needed.
- **Fix a claim:** [report a correction](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=correction.yml).
- **Edit the data yourself:** send a pull request as described below.

## What gets listed

Any blockchain, layer 2 or other network that uses a post-quantum scheme to sign transactions, exchange keys or prove state, backed by public primary sources. Wallets, libraries, standards and papers are welcome and go into the [resource list](docs/resources.md). Opt-in features, testnets, demos and planned work are listed with that status; a project doesn't need to claim whole-chain post-quantum security. The evidence bar is in [the methodology](docs/methodology.md).

## How review works

1. A new submission or correction gets an automatic reply that checks the links and looks for an existing entry. A maintainer replies within 2 days; a review decision usually comes within 3 days.
2. Every claim is checked against its sources. Anything the sources don't support is narrowed or left out, and the reason is given on the issue.
3. Accepted entries are added to `data/`, the tables and charts are regenerated, and the change is noted in [CHANGELOG.md](CHANGELOG.md). The entry's `last_reviewed` date is the day its claims were checked.
4. Once the entry is live on the website, the maintainer's closing reply links its page and gives its badge code (made with `python3 scripts/triage.py --approved <chain id>`).
5. Listing is free and isn't for sale. Entries describe what is deployed; they aren't scores or endorsements.
6. If you work on the project or have a financial interest in it, say so. It doesn't block a listing; it's recorded with the submission.

## Stage badge

Once your chain is listed, you can show its stage in your README or on your website. The badge is rebuilt from the data, so it always shows the current stage, and it links to the chain's page, which carries the credit the license asks for. Pick a chain and a language on the [data page](https://balance0014.github.io/post-quantum-blockchains/data/#embed) and copy the code, or use this pattern:

```markdown
[![CHAIN: post-quantum stage N of 5](https://balance0014.github.io/post-quantum-blockchains/badges/CHAIN-ID.svg)](https://balance0014.github.io/post-quantum-blockchains/chains/CHAIN-ID/)
```

Replace `CHAIN-ID` with the chain's `id` in [data/chains.json](data/chains.json), for example `algorand`. A 360 × 112 card with the check date is at `badges/card/CHAIN-ID.svg`, and Chinese versions are under `badges/zh/` and `badges/card/zh/`. The badge states a stage. It isn't an endorsement or a security rating.

The earlier "Listed on Post-Quantum Blockchains" badge (`badges/listed.svg`) keeps working.

## Pull requests

For an issue or a pull request, please include:

1. The project and the specific claim you want to change.
2. A primary source: release notes, deployment details, governance records, an algorithm specification or code pinned to a commit.
3. The network, software version and deployment status. Specify whether the feature is live on mainnet, on a testnet, demonstrated, planned or opt-in.
4. What the evidence establishes, and any remaining limit.

For a new project, include its name, ticker, website/repository, consensus mechanism, milestone, cryptographic scheme and protection scope. Explain any classical fallback or external dependency. Do not submit seed phrases, private keys, private infrastructure details or personal contact information.

Edit `data/projects.json`, `data/signature-sizes.json` or `data/sources.json`, then run:

```sh
python3 scripts/export.py
python3 scripts/validate.py
```

Include the regenerated CSVs, tables, charts and README summaries in the same pull request; CI fails if they don't match the data. A new project's `id` must match its heading anchor in `docs/projects.md` (the name in lowercase, spaces as hyphens), because the table and the badge link to it. Keep `last_reviewed` tied to the claims you actually checked. A source lookup or code change is not a mainnet activation record.

Maintainers review evidence before merging. Promotional copy, price targets and unsupported whole-chain security labels will not be added. Source disagreement is useful information; describe it rather than hiding it.

Contributions to data, charts and prose are published under the repository's license for them (CC BY-NC 4.0 with the additional permission for commercial use in [LICENSE](LICENSE)); script contributions follow MIT, as described in [LICENSE](LICENSE). Submit only work you have the right to contribute. Linked third-party material keeps its own license.

## Migration research notes

For a research note, identify the author and source edition, distinguish an adopted rule from a proposal or scenario, and cite each calculation's inputs. Keep the English and Chinese diagrams consistent. An inactivity measure alone cannot establish that a holder has lost their keys. Earlier published editions may differ in scope; link and describe them rather than silently relabeling them as translations.

The Bitcoin diagrams preserve their original published editions. Do not redraw or rewrite them as part of a data or navigation update. Any replacement needs a specific edition, provenance and file hash; describe differences in scope rather than claiming that different editions are matching translations. Run `python3 scripts/validate.py` before submitting.
