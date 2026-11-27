# Resources

Wallets, libraries, standards and proposals for post-quantum cryptography in blockchains. Networks themselves are in the [project comparison](projects.md).

Anything here was checked against its primary source on the date shown. Listing is free and isn't for sale. [Submit a resource](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml) with the same form as a project.

## Standards

- [FIPS 203: ML-KEM](https://csrc.nist.gov/pubs/fips/203/final) - NIST's module-lattice key-encapsulation standard, published August 13, 2024. Key exchange, not signatures. *Checked November 27, 2026.*
- [FIPS 204: ML-DSA](https://csrc.nist.gov/pubs/fips/204/final) - NIST's module-lattice signature standard, published August 13, 2024. *Checked November 27, 2026.*
- [FIPS 205: SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final) - NIST's stateless hash-based signature standard, published August 13, 2024. *Checked November 27, 2026.*

## Bitcoin proposals

- [BIP-360: Pay-to-Merkle-Root (P2MR)](https://github.com/bitcoin/bips/blob/master/bip-0360.mediawiki) - Draft soft-fork specification. It adds no post-quantum signature; it removes Taproot's key-path spend so public keys stay off-chain until coins are spent. Not deployed on any Bitcoin network. *Checked November 27, 2026.*
- [BIP-361: Post Quantum Migration and Legacy Signature Sunset](https://github.com/bitcoin/bips/blob/master/bip-0361.mediawiki) - Draft, Informational. Proposes phasing out spends with today's signatures in stages. Not deployed. *Checked November 27, 2026.*

## Wallets

None listed yet. [Submit one](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml).

## Libraries and SDKs

None listed yet. [Submit one](https://github.com/Balance0014/post-quantum-blockchains/issues/new?template=new-project.yml).
