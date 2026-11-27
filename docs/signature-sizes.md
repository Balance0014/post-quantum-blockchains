# Reference public-key and signature sizes

Data as of **October 23, 2026**. Units: **bytes**. These are algorithm encodings, not complete transaction sizes. Eight rows appear in the [algorithm map](../charts/algorithm-map.svg); the other four are reference rows in the data only.

| Parameter set | Public key | Signature | NIST category | In chart | Source |
| --- | ---: | ---: | --- | --- | --- |
| Ed25519 | 32 | 64 | Not assigned here | Yes | [Specification](https://www.rfc-editor.org/rfc/rfc8032.html) |
| RSA-2048 | 270 | 256 | Not assigned here | Yes | [Specification](https://www.rfc-editor.org/rfc/rfc8017.html) |
| Falcon-512 | 897 | 666 | 1 | Yes | [Specification](https://falcon-sign.info/impl/falcon.h.html) |
| Falcon-1024 | 1,793 | 1,280 | 5 | No | [Specification](https://falcon-sign.info/impl/falcon.h.html) |
| ML-DSA-44 | 1,312 | 2,420 | 2 | Yes | [Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf) |
| ML-DSA-65 | 1,952 | 3,309 | 3 | No | [Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf) |
| ML-DSA-87 | 2,592 | 4,627 | 5 | No | [Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf) |
| SLH-DSA-SHA2-128s | 32 | 7,856 | 1 | Yes | [Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf) |
| SLH-DSA-SHA2-256s | 64 | 29,792 | 5 | No | [Specification](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf) |
| XMSS-SHA2_10_256 | 68 | 2,500 | Not assigned here | Yes | [Specification](https://www.rfc-editor.org/rfc/rfc8391.html) |
| UOV-Is, compact public key | 66,576 | 96 | 1 (target) | Yes | [Specification](https://csrc.nist.gov/csrc/media/Projects/pqc-dig-sig/documents/UOV_Specification_R3.pdf) |
| UOV-Is, expanded public key | 412,160 | 96 | 1 (target) | Yes | [Specification](https://csrc.nist.gov/csrc/media/Projects/pqc-dig-sig/documents/UOV_Specification_R3.pdf) |

## Encoding and comparison notes

- **Ed25519:** Raw key and signature; RFC 8032. Classical reference; not post-quantum.
- **RSA-2048:** PKCS #1 DER public key, e=65537; 256-byte signature. Classical reference; not post-quantum.
- **Falcon-512:** Padded signature encoding. NIST-selected Falcon; do not equate a project implementation with a final FN-DSA standard.
- **Falcon-1024:** Padded signature encoding. NIST-selected Falcon; do not equate a project implementation with a final FN-DSA standard.
- **ML-DSA-44:** FIPS 204. Final standard.
- **ML-DSA-65:** FIPS 204. Final standard.
- **ML-DSA-87:** FIPS 204. Final standard.
- **SLH-DSA-SHA2-128s:** FIPS 205; SHAKE-128s has the same sizes. Final standard.
- **SLH-DSA-SHA2-256s:** FIPS 205; SHAKE-256s has the same sizes. Final standard.
- **XMSS-SHA2_10_256:** RFC 8391 format; public key includes a 4-byte OID. RFC example; not a QRL transaction-size measurement.
- **UOV-Is, compact public key:** UOV Round 3 specification v3.0; compact public key. Additional digital signatures Round 3 candidate; target category; not Raqcoin deployment parameters.
- **UOV-Is, expanded public key:** UOV Round 3 specification v3.0; expanded public key. Same parameter set as the compact point; not a different security level.

NIST categories are not speed rankings. A smaller signature alone does not establish a better scheme. The two UOV points show one parameter set in two public-key formats; neither measures Raqcoin. XMSS is a reference RFC format, not QRL transaction serialization. KEM ciphertexts and STARK proofs are excluded from this signature table.

[Read the methodology](methodology.md).
