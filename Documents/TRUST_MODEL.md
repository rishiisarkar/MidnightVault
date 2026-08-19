# Privora trust model (Level 3 demo)

This document states what Privora **does** and **does not** guarantee on the selected Midnight network. The Level 1 target is Midnight Preprod. Judges and operators should treat the product as a production-*minded* demo, not a hardened access-control system.

## On-chain guarantees (when the circuit and network behave as designed)

| Property | Mechanism | Strength |
|----------|-----------|----------|
| Allowlist membership without revealing the raw secret | `verify_access` + Merkle path over `valid_credentials` | Strong (ZK) |
| One successful prove per credential (anti-replay) | Nullifier derived from secret inserted into `used_nullifiers` | Strong (public ledger set) |
| Credential enrollment is gated by “admin” | `add_valid_credential` asserts `admin == disclose(get_caller())` | **Demo-strength** (see below) |

## Explicit demo limitations

### 1. Admin authorization is witness-based

`get_caller()` is a **witness** supplied by the client (`midnight-client.ts`), compared to the constructor-stored `admin` public key.

- Honest UI path: wallet CPK is decoded and used as the caller bytes for enroll.
- Threat: a sophisticated prover who knows the admin bytes could attempt to satisfy the equality without being the original deployer **unless** additional transaction / wallet binding constraints (outside this demo) bind identity to the proof.

**Level 3 stance:** document and demo the intended operator flow (same admin wallet that deployed). Production would bind admin via stronger identity (e.g. signature-bound keys, wallet-attested CPK constraints, or protocol-level caller binding).

### 2. Vault unlock is not access control

After a confirmed proof, the app sets a **sessionStorage** flag (`access-session.ts`). The `/vault` route reads that flag.

- Forgeable client-side (DevTools, script injection, shared browser profile).
- **Source of truth for eligibility** is the on-chain proof / nullifier, not the vault UI.
- UI copy includes a **Demo ACL** badge and disclaimer.

### 3. Signing / maintenance keys are local

Deploy signing material and gate metadata are stored best-effort in **localStorage**. Clearing storage or switching devices does not destroy the on-chain gate, but:

- Operator restore uses contract address + indexer lookup.
- Multi-device admin maintenance is weak without explicit key export/import.

### 4. Tests

`contracts/tests/privora.test.ts` are **behavioral mocks** of circuit rules (Sets + assertions). They do not run Compact/testkit or the ZK prover. See README “Test instructions”.

## Privacy surface (observer)

**Can learn**

- That an access attempt was submitted and whether it succeeded (nullifier insert / failed tx).
- Gate contract address and public ledger structure (admin key bytes, Merkle root evolution, used nullifiers).

**Cannot learn (by design of the circuit)**

- The member’s raw secret / credential plaintext.
- Which allowlist leaf maps to which person, without off-chain correlation.
- Contents of the private allowlist beyond public leaf hashes enrolled by admin.

## Recommended judge demo path

1. Admin: connect → configure → deploy → wait for indexer → enroll hash → copy secret → share `?contract=` gate link.
2. Member: open link → connect → prove → open vault (session UX) → explorer link for proof tx.
3. Optional: second prove with same secret → expect nullifier rejection on-chain.
