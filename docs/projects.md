# Project comparison

Every network in the map: what is deployed, where, and with which limits. Each entry shows the date its claims were last checked; the first 17 were reviewed **October 23, 2026**. [Methodology](methodology.md) · [Release-day checks](release-review.md) · [Resources](resources.md) · [Submit a project](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml)

The [deployment timeline](../charts/deployment-timeline.svg) and [algorithm map](../charts/algorithm-map.svg) are drawn from the same data. The timeline uses the milestone shown. The cryptography listed reflects the review date; it may have been introduced after the chain launched. QANplatform is a testnet; Starknet is an L2.

| Project | Consensus | Milestone | Signing / proof scope |
| --- | --- | --- | --- |
| [Raqcoin (RAQ)](#raqcoin) | PoW | 2018 · Jun · ABCMint genesis | RainbowPro / UOV; multisig |
| [Mochimo (MCM)](#mochimo) | PoS | 2018 · Jun · Mainnet launch | WOTS+ transaction signatures |
| [QRL (QRL)](#qrl) | PoW | 2018 · Jun · Mainnet launch | XMSS transaction signatures |
| [Nexus (NXS)](#nexus) | PoW + PoS | 2019 · Nov · Tritium mainnet upgrade | Opt-in Falcon-512; Brainpool also valid |
| [Tidecoin (TDC)](#tidecoin) | PoW | 2020 · Dec · Mainnet launch | Falcon-512 live; ML-DSA in upgrade code |
| [Starknet (STRK)](#starknet) | L2 · PoS rollout | 2021 · Nov · L2 Mainnet Alpha | STARK proofs; Falcon-512 account demo |
| [Abelian (ABEL)](#abelian) | Dual PoW | 2022 · Apr · Mainnet launch | PQRingCT / PQRingCTX lattice schemes |
| [Algorand (ALGO)](#algorand) | PoS | 2022 · State Proofs deployed on mainnet | Opt-in Falcon accounts; State Proofs |
| [Cellframe (CELL)](#cellframe) | PoS + PoA | 2023 · Jul · Native mainnet launch | Dilithium / Falcon / SPHINCS+ |
| [QuantumCoin (Q)](#quantumcoin) | PoS | 2023 · Dec · Mainnet launch | Hybrid PQ + Ed25519 signatures |
| [QANplatform (QANX)](#qanplatform) | PoA · Testnet | 2024 · May · Public testnet launch announced | ML-DSA-65; XLINK links to secp256k1 |
| [Neptune Cash (NPT)](#neptune-cash) | PoW | 2025 · Feb · First launch; Aug · Relaunch | Hash-based spending; STARK proofs |
| [Nervos CKB (CKB)](#nervos-ckb) | PoW | 2026 · Jan · SPHINCS+ lock deployed on mainnet | Opt-in SPHINCS+ lock script |
| [Quantus (QTC)](#quantus) | PoW | 2026 · Sep 9 · Mainnet launch | ML-DSA-87 / ML-DSA-65 signatures |
| [xCoin (XID)](#xcoin) | PoW | 2026 · Sep 26 · Mainnet launch | ML-DSA-65; SLH-DSA fallback |
| [qtcchain (QTC)](#qtcchain) | PoW | 2026 · Sep 30 · v1 mainnet launch | ML-DSA-44; SLH-DSA fallback |
| [Soqucoin (SOQ)](#soqucoin) | PoW | 2026 · Oct 13 · Mainnet launch | ML-DSA-44 transaction signatures |
| [Splendor Quantum (SPLD)](#splendor-quantum) | BFT | 2026 · Sep 21 · Mainnet genesis (re-mint) | ML-DSA-65 accounts, blocks, votes |
| [Qbit (QBT)](#qbit) | PoW | 2026 · Jul 15 · Mainnet genesis | Bounded SLH-DSA spends (P2MR) |
| [Discrete (XDS)](#discrete) | PoW | 2026 · Jul 15 · Mainnet launch | ML-DSA-65 spends; ML-KEM-768 delivery |
| [Dilithion (DIL)](#dilithion) | PoW | 2026 · Jan 28 · Mainnet launch | ML-DSA-65 (Dilithium3) signatures |
| [Parano1d (NOID)](#parano1d) | PoW | 2026 · Aug 21 · Mainnet genesis | Hash-based ZK spend proofs; no signatures |
| [Aere Network (AERE)](#aere-network) | QBFT (PoA) | 2026 · Sep 23 · Opt-in ML-DSA transactions | Opt-in ML-DSA tx; Falcon/SLH-DSA seals |
| [QoreChain (QOR)](#qorechain) | PoS | 2026 · Jun 29 · Mainnet block 1 | Hybrid classical + ML-DSA-87 (required) |
| [Minima (MINIMA)](#minima) | PoW | 2024 · Nov · Native coin launch (CMC date) | Winternitz OTS key tree |

## Raqcoin

**RAQ · mainnet · reviewed 2026-10-23**

**Milestone:** The 2018 milestone is ABCMint genesis, not UOV deployment. Community materials describe a 2022 rename.

**Consensus:** PoW.

**Cryptographic use:** RainbowPro and UOV configurations; multisig is a separate capability.

**Crypto-agility:** Key configuration selects the signing scheme. Existing keys do not change automatically.

**Limits:** The guide lists Rainbow configuration 274 as the default. Legacy ABCMint Rainbow parameters have a public break. New configurations require separate analysis; NIST UOV candidate parameters are not Raqcoin deployment parameters.

Sources:

- [raq-info](https://raqcoin.net/info.html) — Genesis date, PoW and community project description. (community-maintained project information)
- [raq-guide](https://github.com/RAQ-coin/Raqcoin/blob/160790d5bedd1332722159ce0e0035d6c81f88aa/doc/MakeNewKey_Parameters_Guide.md) — Signing configurations, default 274 and optional UOV choices. (pinned source documentation)
- [raq-multisig](https://github.com/RAQ-coin/Raqcoin/blob/160790d5bedd1332722159ce0e0035d6c81f88aa/src/script.cpp) — Multisig script handling. (pinned source code)
- [raq-legacy-break](https://github.com/mkannwischer/breaking-abc) — Attack on legacy ABCMint Rainbow parameters. (attack reproduction)
- [raq-history](https://raqcoin-club.s3.us-west-004.backblazeb2.com/pdf/Raqcoin%E7%A0%94%E7%A9%B6%E6%8A%A5%E5%91%8A.pdf) — Community history describes the rename in 2022. (community research)

## Mochimo

**MCM · mainnet · reviewed 2026-10-23**

**Milestone:** Mainnet launched in June 2018.

**Consensus:** PoS after the October 2026 migration; historically PoW.

**Cryptographic use:** WOTS+ transaction signatures.

**Crypto-agility:** One active signing scheme in the reviewed material.

**Limits:** Consensus changed; the signing scheme remained WOTS+. No claim that a future protocol upgrade could never change it.

Sources:

- [mcm-home](https://mochimo.org/) — WOTS+ and current PoS status. (project website)
- [mcm-explorer](https://mochimo.org/explorer/) — PoS blocks and the transition from PoW. (project block explorer)
- [mcm-code](https://github.com/mochimodev/mochimo/tree/bbbaceabe5c21b5d8a094cf34c050d28e4ae93f4) — Pinned implementation reviewed for the chart. (pinned source repository)

## QRL

**QRL · mainnet · reviewed 2026-10-23**

**Milestone:** Mainnet launched in June 2018.

**Consensus:** QRL 1.x mainnet uses PoW; QRL 2.0 PoS was a testnet in this snapshot.

**Cryptographic use:** XMSS transaction signatures.

**Crypto-agility:** Hash-function choice and descriptor fields; not arbitrary switching between signature families.

**Limits:** XMSS is stateful. The RFC size example is not QRL transaction serialization.

Sources:

- [qrl-history](https://www.theqrl.org/blog/happy-two-year-qrl-anniversary/) — June 26, 2018 mainnet launch. (project documentation)
- [qrl-status](https://www.theqrl.org/2/) — QRL 2.0 testnet and pending mainnet launch. (project documentation)
- [qrl-xmss](https://github.com/theQRL/QRL/blob/a98af67d8d525e4ae102f77dc41c0ec0fb66db80/src/qrl/crypto/xmss.py) — XMSS implementation and hash choices. (pinned source code)
- [qrl-address](https://docs.theqrl.org/build/address/address-scheme/) — Address descriptor and parameter fields. (project documentation)

## Nexus

**NXS · mainnet · reviewed 2026-10-23**

**Milestone:** November 2019 is the Tritium upgrade, not the original chain genesis in 2014.

**Consensus:** PoW and PoS channels.

**Cryptographic use:** Opt-in Falcon-512; classical Brainpool signatures remain valid.

**Crypto-agility:** Signature chains commit to a subsequent key and scheme.

**Limits:** Do not treat every Nexus account as post-quantum.

Sources:

- [nxs-history](https://www.nexus.io/) — Original chain history. (project website)
- [nxs-release](https://github.com/Nexusoft/LLL-TAO/releases/tag/4.0.0) — Tritium Core 4.0 release in November 2019. (project release record)
- [nxs-activation](https://github.com/Nexusoft/LLL-TAO/blob/b416c5f7e15901eed7a930e291adf0706e1e71b5/src/TAO/Ledger/timelocks.cpp) — Version 7 mainnet activation timelock in November 2019. (pinned source code)
- [nxs-explorer](https://explorer.nexus.io/) — Stake, Prime and Hash channels. (project block explorer)
- [nxs-signing](https://github.com/Nexusoft/LLL-TAO/blob/8af9c3387244b4d396c0e00ee81cea78bb9c0177/src/TAO/Ledger/transaction.cpp) — Falcon/Brainpool verification and signature-chain handling. (pinned source code)
- [nxs-falcon](https://github.com/Nexusoft/LLL-TAO/blob/8af9c3387244b4d396c0e00ee81cea78bb9c0177/src/LLC/flkey.cpp) — Falcon parameter logn=9. (pinned source code)

## Tidecoin

**TDC · mainnet · reviewed 2026-10-23**

**Milestone:** Genesis was December 27, 2020.

**Consensus:** PoW; the reviewed default mainnet parameters disable the AuxPoW activation gate.

**Cryptographic use:** Falcon-512 active; Falcon-1024 and ML-DSA exist in upgrade code.

**Crypto-agility:** Multiple schemes are implemented behind an activation gate.

**Limits:** Implemented upgrade support does not establish that it is active on mainnet.

Sources:

- [tdc-readme](https://github.com/tidecoin/tidecoin/blob/7d653be5d24e73b49d101578afb33d8d7a889c1d/README.md) — Genesis history and implemented signing schemes. (pinned source documentation)
- [tdc-activation](https://github.com/tidecoin/tidecoin/blob/7d653be5d24e73b49d101578afb33d8d7a889c1d/src/kernel/chainparams.cpp) — Mainnet AuxPoW activation gate. (pinned source code)
- [tdc-validation](https://github.com/tidecoin/tidecoin/blob/7d653be5d24e73b49d101578afb33d8d7a889c1d/src/validation.cpp) — Height-gated signature validation. (pinned source code)

## Starknet

**STRK · mainnet · reviewed 2026-10-23**

**Milestone:** November 2021 is L2 Mainnet Alpha, not an independent L1 launch.

**Consensus:** Ethereum L2 with a phased PoS rollout.

**Cryptographic use:** STARK validity proofs and a Falcon-512 account demonstration.

**Crypto-agility:** Account abstraction and contract upgrades can change account verification logic.

**Limits:** A Falcon account demo is not migration of every account. Ethereum settlement and bridge dependencies remain. The L1 vote supported research, not a move.

Sources:

- [strk-launch](https://www.starknet.io/blog/starknets-new-sequencer/) — Historical Mainnet Alpha milestone. (project documentation)
- [strk-account](https://starknet-js.com/docs/guides/account/postQuantum/) — Falcon-512 account example and class hashes. (project documentation)
- [strk-staking](https://www.starknet.io/staking/) — Phased staking rollout. (project documentation)
- [strk-vote](https://starkware.co/blog/whats-next-following-the-starknet-l1-vote/) — Non-binding research vote and working group. (project documentation)
- [strk-scope](https://quantum.starkware.co/networks) — Account, proof and external dependency scope. (project documentation)

## Abelian

**ABEL · mainnet · reviewed 2026-10-23**

**Milestone:** Mainnet launched in April 2022.

**Consensus:** Dual PoW: ABEL-ETHash and ABEL-Nakamoto after the Aconcagua upgrade.

**Cryptographic use:** Custom lattice-based PQRingCT/PQRingCTX schemes.

**Crypto-agility:** Versioned cryptographic schemes; mining algorithm choice is a separate matter.

**Limits:** These schemes are not ML-DSA. Dual PoW does not mean PoW plus PoS. QDay is a separate L2.

Sources:

- [abel-launch](https://web.archive.org/web/20261015195930/https://pqabelian.io/milestones) — 2022 mainnet milestone. (project documentation)
- [abel-upgrade](https://www.pqabelian.io/blog/abelian-completes-major-network-upgrade-at-block-height-464-000) — Aconcagua upgrade and dual PoW. (project documentation)
- [abel-consensus](https://github.com/pqabelian/abec/blob/35799bed12f326b10df8227aa93646c563d79cb7/blockchain/consensus/consensus.go) — PoW verification dispatch. (pinned source code)
- [abel-schemes](https://community.pqabelian.io/) — Project cryptographic documentation. (project documentation)

## Algorand

**ALGO · mainnet · reviewed 2026-10-23**

**Milestone:** The timeline uses the 2022 State Proofs milestone. The chain launched in 2019.

**Consensus:** Pure Proof of Stake.

**Cryptographic use:** Falcon State Proofs and opt-in Falcon account authorization.

**Crypto-agility:** Rekeying and programmable authorization; native Falcon-1024 accounts are also documented.

**Limits:** State Proofs and account signing have different roles. Consensus participation keys remain classical; app and wallet support still matters.

Sources:

- [algo-pq](https://algorand.co/technology/post-quantum) — Deployment history and remaining scope. (project documentation)
- [algo-account](https://dev.algorand.co/concepts/accounts/post-quantum/) — Native Falcon-1024 accounts and migration. (project documentation)
- [algo-rekey](https://dev.algorand.co/concepts/accounts/rekeying/) — Account authorization changes. (project documentation)
- [algo-consensus](https://algorand.co/technology/pure-proof-of-stake) — Consensus design. (project documentation)

## Cellframe

**CELL · mainnet · reviewed 2026-10-23**

**Milestone:** Native mainnet launched in July 2023.

**Consensus:** PoS on the main transaction chain; PoA on the zerochain.

**Cryptographic use:** Native-wallet options include Dilithium, Falcon and SPHINCS+.

**Crypto-agility:** Multiple native signing schemes, subject to network and wallet support.

**Limits:** Scope is native CF-20 assets, not ERC-20/BEP-20 tokens. Picnic is a historical/deprecated route, not a current wallet option in this release.

Sources:

- [cell-launch](https://cellframe.medium.com/ama-with-ceo-dmitry-gerasimov-july-13-2023-f317f5fb1de0) — July 12, 2023 mainnet launch. (project documentation)
- [cell-consensus](https://cellframe.net/blog/worklog-october-results-2024/) — ESBOCS and DAG-PoA roles. (project documentation)
- [cell-assets](https://cellframe.net/blog/ama-transcript-with-dmitry-gerasimov-february-26-2026/) — Native assets versus wrapped assets. (project documentation)
- [cell-wallet](https://cellframe.net/) — Native wallet and supported cryptography. (project website)

## QuantumCoin

**Q · mainnet · reviewed 2026-10-23**

**Milestone:** Mainnet launched on December 31, 2023.

**Consensus:** PoS with deposit-weighted BFT.

**Cryptographic use:** Hybrid post-quantum and Ed25519 signing; ML-DSA and SLH-DSA components.

**Crypto-agility:** Signing modes change at protocol thresholds and in emergency mode.

**Limits:** Do not assume every protocol phase uses exactly the same component combination. ML-KEM node handshakes are not transaction signatures.

Sources:

- [q-faq](https://quantumcoin.org/faq.html) — Mainnet date, PoS and claimed signing components. (project documentation)
- [q-signatures](https://quantumcoin.org/quantum-resistance.html) — Hybrid scheme descriptions. (project documentation)
- [q-policy](https://github.com/quantumcoinproject/quantum-coin-go/blob/a8952bb87e4d0bfe3c8d550662d0bcbbc40c2abd/crypto/cryptobase/cryptobase.go) — Signing modes and protocol conditions. (pinned source code)
- [q-config](https://github.com/quantumcoinproject/quantum-coin-go/blob/a8952bb87e4d0bfe3c8d550662d0bcbbc40c2abd/defaults/config.go) — Protocol activation thresholds. (pinned source code)

## QANplatform

**QANX · testnet · reviewed 2026-10-23**

**Milestone:** May 2024 is the public testnet announcement, not a public mainnet launch.

**Consensus:** PoA on the reviewed public testnet; PoS is planned.

**Cryptographic use:** XLINK pairs ML-DSA-65 with secp256k1.

**Crypto-agility:** A fixed signature pairing in the reviewed XLINK path.

**Limits:** The traded QANX token does not establish a live native post-quantum mainnet. The original 2024 announcement used the Dilithium name; do not backdate current parameters.

Sources:

- [qan-launch](https://medium.com/qanplatform/qanplatform-launches-its-multi-language-quantum-resistant-testnet-d12269deec34) — May 7, 2024 testnet announcement. (project documentation)
- [qan-validation](https://docs.qanplatform.com/testnet/validation) — Current testnet PoA and future transition. (project documentation)
- [qan-xlink](https://docs.qanplatform.com/testnet/setup/qan-xlink/desktop-app) — ML-DSA-65/secp256k1 pairing and testnet scope. (project documentation)

## Neptune Cash

**NPT · mainnet · reviewed 2026-10-23**

**Milestone:** First launch in February 2025; the current chain relaunched on August 5, 2025.

**Consensus:** PoW.

**Cryptographic use:** Hash-preimage spending conditions and Triton STARK validity proofs.

**Crypto-agility:** Programmable lock scripts.

**Limits:** A STARK proof and a hash-preimage spending condition are not a fixed-size standard digital signature.

Sources:

- [npt-relaunch](https://neptune.cash/articles/mainnet-relaunch) — Mainnet relaunch history. (project documentation)
- [npt-genesis](https://web.archive.org/web/20260726145233/https://explorer.neptune.cash/block/genesis) — Current-chain genesis. (project block explorer)
- [npt-mining](https://docs.neptune.cash/consensus/mining.html) — PoW consensus. (project documentation)
- [npt-spending](https://docs.neptune.cash/consensus/utxo.html) — Spending conditions and proof scope. (project documentation)
- [npt-lock](https://github.com/Neptune-Crypto/neptune-core/blob/db304e79eb722b1c5654c9854360701af10f3749/neptune-consensus/src/transaction/lock_script.rs) — Lock script interface at snapshot revision. (pinned source code)

## Nervos CKB

**CKB · mainnet · reviewed 2026-10-23**

**Milestone:** January 2026 marks the SPHINCS+ lock deployment. CKB mainnet launched in 2019.

**Consensus:** PoW, using NC-Max and Eaglesong.

**Cryptographic use:** An opt-in SPHINCS+ spending lock.

**Crypto-agility:** New verification logic can be deployed as lock scripts.

**Limits:** Existing cells must satisfy their old spending rules before migration. Default secp256k1 cells do not change automatically.

Sources:

- [ckb-lock](https://github.com/nervosnetwork/quantum-resistant-lock-script/tree/082c0a19ce4e0b2c0b00f7b46f423f59a30afc71) — SPHINCS+ implementation and mainnet deployment parameters. (pinned source repository)
- [ckb-consensus](https://docs.nervos.org/docs/ckb-features/extreme-decentralization) — PoW consensus. (project documentation)
- [ckb-agility](https://www.nervos.org/knowledge-base/blockchain_crypto_agility) — Lock-script extensibility. (project documentation)
- [ckb-genesis](https://talk.nervos.org/t/nervos-ckb-lina/3857) — 2019 chain launch, distinct from lock deployment. (project documentation)

## Quantus

**QTC · mainnet · reviewed 2026-10-23**

**Milestone:** Mainnet launched on September 9, 2026.

**Consensus:** PoW with Poseidon2 mining.

**Cryptographic use:** ML-DSA-87 and ML-DSA-65 transaction signing.

**Crypto-agility:** Parameter-set selection within ML-DSA.

**Limits:** ML-DSA-65 requires runtime spec 139 or later and compatible account tooling. Quantus and qtcchain both use QTC but are separate chains.

Sources:

- [quantus-launch](https://www.quantus.com/blog/weekly-update-09-16-2026/) — Mainnet launch date and signing progress. (project documentation)
- [quantus-consensus](https://www.quantus.com/whitepaper/) — PoW consensus. (project documentation)
- [quantus-runtime](https://github.com/Quantus-Network/quantus-wasm/blob/04174ffca2e385ca64d45ee0c9523cc1dd36707d/README.md) — ML-DSA parameter sets and spec 139 requirement. (pinned source documentation)

## xCoin

**XID · mainnet · reviewed 2026-10-23**

**Milestone:** The project whitepaper dates mainnet genesis to September 26, 2026.

**Consensus:** PoW, using MetalDAG.

**Cryptographic use:** ML-DSA-65 primary signing; SLH-DSA-SHA2-128s fallback leaves.

**Crypto-agility:** Cross-family fallback requires committing to the alternative spending leaf in advance.

**Limits:** This is not a claim that every spend carries both signatures or that a new fallback can be added after a key is compromised.

Sources:

- [xid-whitepaper](https://xcoinproject.com/whitepaper) — Genesis date, PoW and signing/fallback design. (project documentation)
- [xid-explorer](https://superknet.com/) — Public chain activity; not proof of adoption. (ecosystem block explorer)

## qtcchain

**QTC · mainnet · reviewed 2026-10-23**

**Milestone:** v1 launched September 30, 2026; v2 re-genesis was October 5, 2026.

**Consensus:** PoW with MatMul mining.

**Cryptographic use:** ML-DSA-44 primary signing; SLH-DSA fallback/multisig.

**Crypto-agility:** Per-key scheme selection and multiple script leaves.

**Limits:** Falcon is reserved in the reviewed specification. qtcchain is unrelated to Quantus despite the shared QTC ticker. The repository records a v2 treasury allocation; inclusion is not a fair-launch endorsement.

Sources:

- [qtc-readme](https://github.com/qtcchain/qtc/tree/5adbc7d5c2ac252804fd3c61fce3b9bbc3ad9c24) — Launch/re-genesis dates and PoW. (pinned source repository)
- [qtc-spec](https://github.com/qtcchain/qtc/blob/5adbc7d5c2ac252804fd3c61fce3b9bbc3ad9c24/doc/qtc-pqc-spec.md) — Active and reserved schemes, fallback and multisig. (pinned source documentation)
- [qtc-explorer](https://qtc.events/blocks) — Public block activity. (ecosystem block explorer)

## Soqucoin

**SOQ · mainnet · reviewed 2026-10-23**

**Milestone:** Mainnet block 1 was mined on October 13, 2026.

**Consensus:** Scrypt PoW with AuxPoW support.

**Cryptographic use:** ML-DSA-44 transaction signing.

**Crypto-agility:** One active transaction-signing scheme in the snapshot.

**Limits:** XMSS experiments are not counted as a mainnet signing path. Public blocks do not establish user adoption or independent security certification.

Sources:

- [soq-foundation](https://soqucoin.org/) — Block 1 date, ML-DSA-44 and PoW. (project foundation website)
- [soq-code](https://github.com/soqucoin/soqucoin/tree/0b4d6ab18b687d658a42b8debef1d6db2c7b4aa0) — Snapshot implementation and AuxPoW support. (pinned source repository)
- [soq-explorer](https://explorer.soqu.org/) — Public block activity. (project block explorer)

## Splendor Quantum

**SPLD · mainnet · reviewed 2026-11-27**

**Milestone:** The current mainnet genesis was minted on September 21, 2026, after earlier resets.

**Consensus:** BFT with ML-DSA-65 votes; at review one validator certified blocks and public admission had not opened.

**Cryptographic use:** ML-DSA-65 for native transactions, blocks and validator votes; addresses are SHA3-256 of the public key.

**Crypto-agility:** One account signing scheme; the SQVL module adds dual ML-DSA-65 + SLH-DSA instructions.

**Limits:** SPLD on the legacy Splendor EVM chain 2691 is a separate network until migrated. The repository states there is no third-party audit.

Sources:

- [spld-readme](https://github.com/Splendor-Protocol/splendor-quantum-blockchain/blob/ee3e84e2b58399cd5ea2f0e3c69958f06f1d0f39/readme.md) — Mainnet re-mint date, ML-DSA-65 signing surfaces, two-second block interval, audit status. (pinned source documentation)
- [spld-news](https://splendor.org/news/introducing-splendor-quantum) — Separation from legacy chain 2691 and address format. (project documentation)
- [spld-status](https://quantum-rpc.splendor.org/status) — Live chain id, height and one-of-one validator quorum. (project node API)

## Qbit

**QBT · mainnet · reviewed 2026-11-27**

**Milestone:** Mainnet genesis was July 15, 2026; Qbit Core v1.0.0 followed on July 16.

**Consensus:** SHA-256 PoW with an AuxPoW merge-mining lane feeding the same chain.

**Cryptographic use:** OP_CHECKSIGPQC with a single SLH-DSA-SHA2-128s-bounded30 profile inside P2MR outputs.

**Crypto-agility:** One active profile; reserved leaf versions allow a later soft fork to add another.

**Limits:** The bounded profile is not a FIPS 205 parameter set and is safe only up to 2^30 signatures per key.

Sources:

- [qbit-spec](https://github.com/Qbit-Org/qbit/blob/d868462af42b38820c22ecf3d9016e775d922bb6/doc/consensus/p2mr-v1.md) — P2MR activation at height 0, OP_CHECKSIGPQC and the bounded SLH-DSA profile. (pinned source documentation)
- [qbit-params](https://github.com/Qbit-Org/qbit/blob/d868462af42b38820c22ecf3d9016e775d922bb6/src/kernel/chainparams.cpp) — Mainnet genesis, restricted-output mode and 60-second target spacing. (pinned source code)
- [qbit-release](https://github.com/Qbit-Org/qbit/releases/tag/v1.0.0) — v1.0.0 mainnet launch release. (project release record)

## Discrete

**XDS · mainnet · reviewed 2026-11-27**

**Milestone:** The project dates mainnet to July 15, 2026.

**Consensus:** PoW using DiscretePower, which binds each mining candidate to an ML-DSA-65 signature.

**Cryptographic use:** ML-DSA-65 spend authorization; ML-KEM-768 encapsulation for output delivery.

**Crypto-agility:** One active signing scheme; changing frozen parameters requires a hard fork.

**Limits:** Spending reveals the long-term spend key and amounts are public in Phase 1; finality is node-local.

Sources:

- [xds-readme](https://github.com/discretecoin/discrete/blob/95271fc6b72a434014c53308f2820553417527e3/README.md) — PQ-only roles: ML-DSA-65 spend and block signatures, ML-KEM-768 view keys. (pinned source documentation)
- [xds-site](https://discrete.cash/) — Mainnet date, phase-1 scope and stated limitations. (project website)
- [xds-config](https://github.com/discretecoin/discrete/blob/95271fc6b72a434014c53308f2820553417527e3/src/CryptoNoteConfig.h) — 90-second difficulty target and finality depth. (pinned source code)

## Dilithion

**DIL · mainnet · reviewed 2026-11-27**

**Milestone:** The repository dates the mainnet launch (a fair-launch reset) to January 28, 2026.

**Consensus:** RandomX PoW; a VDF consensus phase is implemented but pending activation.

**Cryptographic use:** Dilithium mode 3 from the FIPS 204 reference code, i.e. ML-DSA-65 sizes and encoding.

**Crypto-agility:** One active signing scheme.

**Limits:** DIL bridged to Base relies on Base accounts, not on Dilithium. The project uses the Dilithium3 name rather than ML-DSA-65.

Sources:

- [dil-readme](https://github.com/dilithion/dilithion/blob/2afb0e96b064741fa2bfb92d5b9b8c0e61734769/README.md) — Mainnet launch date and signature sizes. (pinned source documentation)
- [dil-signer](https://github.com/dilithion/dilithion/blob/2afb0e96b064741fa2bfb92d5b9b8c0e61734769/depends/dilithium/ref/params.h) — FIPS 204 reference parameters for mode 3. (pinned source code)
- [dil-params](https://github.com/dilithion/dilithion/blob/2afb0e96b064741fa2bfb92d5b9b8c0e61734769/src/core/chainparams.cpp) — 240-second block time and genesis parameters. (pinned source code)

## Parano1d

**NOID · mainnet · reviewed 2026-11-27**

**Milestone:** Mainnet genesis was August 21, 2026; v2 releases followed in October 2026.

**Consensus:** PoW orders blocks whose state transitions are already proven.

**Cryptographic use:** No public-key transaction signature: spends prove knowledge of a secret's Poseidon2b preimage.

**Crypto-agility:** Protocol versions activate at announced heights.

**Limits:** A zero-knowledge proof of a hash preimage is not a standard digital signature, and the proof stack is not standardized. P2P peer identity uses Ed25519.

Sources:

- [noid-readme](https://github.com/ignotusnemo/parano1d/blob/bf9175a2aa8a95998e8b25c8ae9ce7ac03eed1f2/README.md) — Genesis date, 30-second target and signatureless ownership. (pinned source documentation)
- [noid-release](https://github.com/ignotusnemo/parano1d/releases/tag/v2.1.0) — Current node release. (project release record)
- [noid-explorer](https://noidexplorer.org/) — Public block activity. (ecosystem block explorer)

## Aere Network

**AERE · mainnet · reviewed 2026-11-27**

**Milestone:** Type-0x50 ML-DSA transactions were enabled on chain 2800 from block 19,900,000 (September 23, 2026).

**Consensus:** QBFT with ten validators, all run by the Aere Foundation at review.

**Cryptographic use:** Opt-in ML-DSA-44/65/87 transactions beside the default secp256k1 path; Falcon-512 and SLH-DSA validator seals.

**Crypto-agility:** The ML-DSA parameter set is chosen per transaction by an algorithm identifier.

**Limits:** PQ accounts are opt-in; secp256k1 accounts, node transport and part of each consensus message remain classical. No completed third-party audit.

Sources:

- [aere-aip20](https://git.aere.network/aere-network/aere-research/src/commit/6e0f7d6363bfde59f4703c371648aa1bbcd58949/aips/AIP-20.md) — Type-0x50 ML-DSA transaction format and activation record. (pinned source documentation)
- [aere-status](https://aere.network/press-release-post-quantum-identity.html) — Validator-layer PQ stages, Foundation-run validators and audit status. (project documentation)
- [aere-claims](https://aere.network/verifiable-claims.json) — Chain id, measured block interval and stated limits. (project documentation)

## QoreChain

**QOR · mainnet · reviewed 2026-11-27**

**Milestone:** Mainnet block 1 is dated June 29, 2026.

**Consensus:** CometBFT PoS; validator consensus keys were Ed25519 at review.

**Cryptographic use:** Every Cosmos-lane transaction carries a classical and an ML-DSA-87 signature; mainnet parameters require the hybrid form.

**Crypto-agility:** Enforcement mode (disabled/optional/required) and key migration are governed on chain.

**Limits:** EVM transactions inside an open window are authorized by secp256k1 alone, and validator keys are classical.

Sources:

- [qore-readme](https://github.com/qorechain/qorechain-core/blob/dbd55d11c125de066cd6958bd57c76023bd5bd93/README.md) — Hybrid ML-DSA-87 signatures, enforcement modes and EVM windows. (pinned source documentation)
- [qore-params](https://api.qore.host/qorechain/pqc/v1/params) — Mainnet hybrid_signature_mode = required, classical fallback disabled. (project node API)
- [qore-genesis](https://rpc.qore.host/block?height=1) — Mainnet block 1 date. (project node API)

## Minima

**MINIMA · mainnet · reviewed 2026-11-27**

**Milestone:** CoinMarketCap dates the native coin's launch to November 26, 2024; no project source dating the mainnet launch was found.

**Consensus:** TxPoW: transactions carry their own proof of work, and blocks are formed from them.

**Cryptographic use:** KISS VM signature checks verify TreeKey signatures built from Winternitz one-time signatures (SHA3-256, w = 8).

**Crypto-agility:** Coins are locked by scripts, so the locking logic is programmable; the signature primitive itself is fixed in the node.

**Limits:** One-time keys depend on correct use tracking, and the Winternitz key-tree construction is not a standardized scheme.

Sources:

- [mini-wots](https://github.com/minima-global/Minima/blob/52542f25605a28a776e9b3b43b0808a05dceab01/src/org/minima/objects/keys/Winternitz.java) — Winternitz one-time signatures (BouncyCastle, SHA3-256, w = 8). (pinned source code)
- [mini-treekey](https://github.com/minima-global/Minima/blob/52542f25605a28a776e9b3b43b0808a05dceab01/src/org/minima/objects/keys/TreeKey.java#L21-L22) — Default key tree of 64 keys per level and 3 levels. (pinned source code)
- [mini-checksig](https://github.com/minima-global/Minima/blob/52542f25605a28a776e9b3b43b0808a05dceab01/src/org/minima/kissvm/functions/sigs/CHECKSIG.java) — Script signature check verifies TreeKey signatures. (pinned source code)
- [mini-explorer](https://explorer.minima.global) — Live mainnet blocks. (project block explorer)
