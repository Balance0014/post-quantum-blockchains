# Release-day checks — October 28, 2026

The first release preserves the **October 23 chart snapshot**. The checks below were made while preparing it for publication. They do not reset every project entry's review date.

| Check | Result and scope |
| --- | --- |
| Mochimo consensus | Its [project explorer](https://mochimo.org/explorer/address) describes PoS activity after the switch. The dataset recorded PoS at release. Since November 28, 2026 it records PoW, which is what the public node code shows, and keeps the website's PoS statement as a claim. |
| QRL 2.0 | The [official status page](https://www.theqrl.org/2/) still lists a testnet and no mainnet date. The dataset keeps 1.x mainnet and 2.0 separate. |
| QANplatform | [Validation documentation](https://docs.qanplatform.com/testnet/validation) describes the testnet consensus. No native mainnet claim was added. |
| Starknet | The [vote result](https://starkware.co/blog/whats-next-following-the-starknet-l1-vote/) supports research and a working group, not an approved move. |
| Algorand | [Account documentation](https://dev.algorand.co/concepts/accounts/post-quantum/) describes Falcon-1024 accounts. That does not migrate consensus participation keys. |
| Reference standards | NIST's [additional-signatures page](https://csrc.nist.gov/projects/pqc-dig-sig/round-3-additional-signatures) lists UOV in Round 3. Its candidacy does not certify Raqcoin's configurations. |
| Repository continuity | Default-branch revisions were compared for 14 public repositories. Twelve matched the saved revisions; Neptune and Soqucoin had changed. See [revision records](../data/source-revision-checks.json). |

For the two changed repositories, the reviewed Neptune lock-script file and Soqucoin signing implementation files were unchanged in the compared revisions. Other changes exist; this is not a review of every change or evidence that every node runs the latest version. The dataset keeps the original pinned references.

The Cellframe consensus article could not be retrieved in this release-day browser check. Its earlier source reference and October 23 review date are retained; it is not presented as freshly rechecked.

No independent full-node synchronization, product test, cryptographic audit or live adoption measurement was performed for this release.
