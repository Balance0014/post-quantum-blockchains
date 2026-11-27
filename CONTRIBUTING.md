# Contributing

Found a wrong date, a missing condition or a project we should add? Project teams and independent readers use the same process.

- **Add a project:** [submit it with the form](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml). No fork or pull request needed.
- **Fix a claim:** [report a correction](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=correction.yml).
- **Edit the data yourself:** send a pull request as described below.

## What gets listed

Any blockchain, layer 2 or other network that uses a post-quantum scheme to sign transactions, exchange keys or prove state, backed by public primary sources. Wallets, libraries and standards are welcome and go into a separate resource list. Opt-in features, testnets, demos and planned work are listed with that status; a project doesn't need to claim whole-chain post-quantum security. The evidence bar is in [the methodology](docs/methodology.md).

## How review works

1. Every claim is checked against its sources. Anything the sources don't support is narrowed or left out, and the reason is given on the issue.
2. Accepted entries are added to `data/`, the tables are regenerated, and the change is noted in [CHANGELOG.md](CHANGELOG.md). The entry's `last_reviewed` date is the day its claims were checked.
3. Listing is free and isn't for sale. Entries describe what is deployed; they aren't scores or endorsements.
4. If you work on the project or have a financial interest in it, say so. It doesn't block a listing; it's recorded with the submission.

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

Include the regenerated CSV files and tables in the same pull request. Keep `last_reviewed` tied to the claims you actually checked. A source lookup or code change is not a mainnet activation record.

Maintainers review evidence before merging. Promotional copy, price targets and unsupported whole-chain security labels will not be added. Source disagreement is useful information; describe it rather than hiding it.

Contributions to data, charts and prose follow CC BY 4.0; script contributions follow MIT, as described in [LICENSE](LICENSE). Submit only work you have the right to contribute. Linked third-party material keeps its own license.

## Migration research notes

For a research note, identify the author and source edition, distinguish an adopted rule from a proposal or scenario, and cite each calculation's inputs. Keep the English and Chinese diagrams consistent. An inactivity measure alone cannot establish that a holder has lost their keys. Earlier published editions may differ in scope; link and describe them rather than silently relabeling them as translations.

The Bitcoin diagrams preserve their original published editions. Do not redraw or rewrite them as part of a data or navigation update. Any replacement needs a specific edition, provenance and file hash; describe differences in scope rather than claiming that different editions are matching translations. Run `python3 scripts/validate.py` before submitting.
