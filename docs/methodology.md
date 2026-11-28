# How to read and update the data

## Scope

The project dataset started with the data behind the two October 23, 2026 maps and is open to new submissions. Any project that meets the evidence bar below can be listed. Inclusion is not an endorsement or a claim of complete market coverage, and listing is never paid. A submission needs public technical material that identifies the project and supports a specific cryptographic use. A ticker or a marketing claim alone is not enough.

Projects with testnets, demonstrations or opt-in features can be included when those limits are explicit. A new submission does not need to claim whole-chain post-quantum security.

## Evidence

- Use original standards and algorithm specifications for parameter sizes and standardization status.
- Use release notes, governance records, implementation code and deployment records for project-specific claims. Pin code to a commit when possible.
- Treat an explorer as evidence of the activity it shows, not proof of user adoption, decentralization or correct cryptography.
- Label community histories and project claims. Neither is an independent security review.
- Where sources disagree, narrow the statement to what they support. Do not turn an unresolved claim into a confident label.

Each project has a `last_reviewed` date, source IDs and notes on milestones, consensus, signing and agility. `data/sources.json` resolves the source IDs and describes their purpose. The repository revision checks have their own date. A matching commit does not establish that a live network is still running that code.

## Dates and networks

`timeline_year` refers to the milestone shown, not always the chain's genesis. Algorand is placed at its 2022 State Proofs deployment; its mainnet launched in 2019. QANplatform is placed at its 2024 public testnet announcement. Raqcoin's 2018 entry refers to predecessor genesis, not adoption of every current signing option.

Consensus and cryptographic features describe the entry's `last_reviewed` date, not necessarily the original milestone date. Mainnet, testnet, optional accounts, demonstrations and planned upgrades must remain distinct.

## Cryptographic roles

**Transaction signatures** authorize spending. **Validity proofs** establish that a computation or state transition follows specified rules. **KEMs** establish shared secrets. These are different jobs.

The algorithm map's signature families are lattice-based, hash-based and multivariate, with validity proofs in a column of their own. KEMs such as lattice-based ML-KEM and code-based HQC are left out of the map because they don't sign anything. The families shown do not cover every family represented in NIST's post-quantum work. HQC's original PQC Round 4 selection and UOV's additional-signatures Round 3 candidacy are different processes.

`crypto_uses` records the role as well as the family. Neptune's hash-preimage spending conditions and Triton STARKs are not ordinary signature schemes. Starknet's proof system does not establish that all user accounts use post-quantum signatures.

## Crypto-agility

Record the actual mechanism: choosing a parameter set, rotating to a different scheme, deploying a verification script or activating a protocol upgrade. These provide different flexibility and have different conditions. A hybrid signature or multisig feature alone does not establish the ability to replace an algorithm.

## Size comparisons

All values are bytes for a named parameter set and encoding. Falcon points use padded signatures. The RSA reference uses a PKCS #1 DER public key with exponent 65537. The XMSS example includes a four-byte public-key identifier; it is not QRL's serialized transaction format.

The two UOV-Is points use the same parameter set with compact and expanded public keys. They are not two security levels. Their category is a submission target, not certification of a blockchain deployment. Compare security assumptions, implementation needs and deployment scope alongside size. Do not infer fees, TPS or device compatibility from size alone.

## Deployment status in the charts

The timeline, the README summary and the counts in them sort each project into one of three groups, using only the data. **Not on mainnet yet:** `network_status` isn't `mainnet`. **Opt-in or demo:** every entry in `crypto_uses`, other than a validity proof, has "opt-in" or "demonstration" in its scope. **On by default:** everything else. Write the scope accordingly when you add or correct an entry.

## Application notes and the SEC-hosted document

The original October 23 algorithm map cited a third-party PQFIF submission hosted on SEC.gov for conceptual financial-use examples. It is not an SEC position, standard or endorsement. The relevant material is Appendix A, pages 62 and 69. It is not used to validate the size table or project security.

Engineering statements are tied to algorithm specifications: small signatures can reduce one part of bandwidth use; large public keys still cost storage and transfer; stateful signatures require state management. None of these facts alone establishes the best algorithm for a particular blockchain or device.

## Updating the map

Change the affected claim, attach sources and update that entry's review date. Record substantive corrections in the changelog. Then run `scripts/export.py`: it redraws both charts and rebuilds the tables, CSVs and README summaries from the JSON. Each chart is stamped "data as of" the latest review date in the data it draws on. CI fails if a committed chart or table no longer matches the data, so a chart can't silently go stale. Earlier editions, including the hand-drawn October 23 maps, stay in the git history.

Submissions and corrections get a maintainer's reply within 2 days, and a review decision usually within 3 days. No scheduled re-check of every network is running: an entry's `last_reviewed` date says when it was last checked, and a repository update date is not a promise that every network has been checked that day.

## Bitcoin migration notes

Migration notes sit outside the project dataset. They identify the framework author, source edition, adoption status and assumptions behind any calculation. The [BRUTER note](../research/bitcoin-migration/r8-bruter/README.md) separates r8's scenarios from a historical chain-capacity model and discusses the rights of holders whose funds remain under old rules. Source scope and bilingual diagram pairs are recorded with that note. Adding a note does not change the dated project's deployment classification.
