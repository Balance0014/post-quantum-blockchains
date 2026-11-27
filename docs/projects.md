# Project comparison

Each entry shows the date it was last checked. The original 17 entries were reviewed **October 23, 2026**, the date of the published maps. [Methodology](methodology.md) · [Release-day checks](release-review.md) · [Submit a project](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml)

The timeline uses the milestone shown. The cryptography listed reflects the review date; it may have been introduced after the chain launched. QANplatform is a testnet; Starknet is an L2.

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

- [abel-launch](https://www.pqabelian.io/milestones) — 2022 mainnet milestone. (project documentation)
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
- [npt-genesis](https://explorer.neptune.cash/block/genesis) — Current-chain genesis. (project block explorer)
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
