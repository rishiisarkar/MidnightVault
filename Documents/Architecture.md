````markdown
# Privora Architecture

## 1. Project Overview

Privora is a privacy-preserving credential and access-verification dApp built on the Midnight Network.

It allows a user to prove that they hold a valid credential or belong to an approved allowlist without revealing:

- their identity,
- their raw credential,
- their private secret,
- or the exact allowlist entry they matched.

The frontend connects to a Midnight-compatible wallet, prepares the private witness locally, calls the `verify_access` Compact circuit through Midnight.js, waits for proof generation and transaction confirmation, and unlocks the protected resource only after successful verification.

This document maps every important feature to its actual location in the repository so reviewers can verify the implementation directly.

---

# 2. Full Project Structure

```text
PRIVORA/
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── app/
│   ├── public/
│   │   ├── contract/
│   │   │   └── Privora/
│   │   │       ├── compiler/
│   │   │       │   └── contract-info.json
│   │   │       ├── contract/
│   │   │       │   ├── index.d.ts
│   │   │       │   ├── index.js
│   │   │       │   └── index.js.map
│   │   │       ├── keys/
│   │   │       │   ├── add_valid_credential.prover
│   │   │       │   ├── add_valid_credential.verifier
│   │   │       │   ├── verify_access.prover
│   │   │       │   └── verify_access.verifier
│   │   │       └── zkir/
│   │   │           ├── add_valid_credential.bzkir
│   │   │           ├── add_valid_credential.zkir
│   │   │           ├── verify_access.bzkir
│   │   │           └── verify_access.zkir
│   │   ├── logo.png
│   │   ├── logo.svg
│   │   └── other static assets
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── gate/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── vault/
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── icon.svg
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   ├── PageShell.tsx
│   │   │   │   ├── ProgressPanel.tsx
│   │   │   │   ├── ProofReference.tsx
│   │   │   │   └── StatusBanner.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Splash.tsx
│   │   │   ├── WalletConnectModal.tsx
│   │   │   └── WalletSessionBar.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useGate.ts
│   │   │
│   │   └── lib/
│   │       ├── access-session.ts
│   │       ├── explorer.ts
│   │       ├── gate-store.ts
│   │       ├── midnight-client.ts
│   │       ├── transaction-stages.ts
│   │       └── ws-shim.js
│   │
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   ├── test-deserialize.mjs
│   └── tsconfig.json
│
├── contracts/
│   ├── scripts/
│   │   ├── compile-contract.mjs
│   │   └── sync-artifacts.mjs
│   │
│   ├── src/
│   │   ├── managed/
│   │   │   ├── compiler/
│   │   │   ├── contract/
│   │   │   ├── keys/
│   │   │   ├── vault_pass/
│   │   │   └── zkir/
│   │   └── privora.compact
│   │
│   ├── tests/
│   │   └── privora.test.ts
│   │
│   ├── jest.config.js
│   └── package.json
│
├── Documents/
│   ├── DEMO_CHECKLIST.md
│   ├── midnight_level3_privora_plan.md
│   ├── PLAN.md
│   ├── PROPOSAL.md
│   └── TRUST_MODEL.md
│
├── .env.example
├── .gitignore
├── package-lock.json
├── package.json
├── README.md
└── vercel.json
````

---

# 3. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                      Privora Frontend                         │
│                 Next.js 16 + React 19                         │
│                                                              │
│  Landing Page                                                │
│       │                                                      │
│       ▼                                                      │
│  WalletConnectModal ───────► Lace / 1AM Wallet               │
│       │                                                      │
│       ▼                                                      │
│  WalletSessionBar                                            │
│  Address display + connected state + disconnect              │
│       │                                                      │
│       ▼                                                      │
│  Gate Page                                                   │
│  Private credential input + verify button                    │
│       │                                                      │
│       ▼                                                      │
│  useGate.ts                                                  │
│  Access flow and frontend state                              │
│       │                                                      │
│       ▼                                                      │
│  midnight-client.ts                                          │
│  Midnight.js providers and contract interaction              │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ verify_access circuit call
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Midnight Proof Infrastructure                 │
│                                                              │
│  ZK configuration provider                                   │
│  HTTP proof provider                                         │
│  Indexer public-data provider                                │
│  Local private-state provider                                │
│  Wallet transaction API                                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Privora Compact Contract                   │
│                                                              │
│  contracts/src/privora.compact                               │
│                                                              │
│  add_valid_credential                                        │
│  verify_access                                               │
│                                                              │
│  Public state: credential commitments and nullifiers         │
│  Private witness: user credential secret                     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     Verification Result                       │
│                                                              │
│  Invalid proof  ─────────────► Access denied                 │
│  Valid proof    ─────────────► Access session created        │
│                                      │                       │
│                                      ▼                       │
│                              Protected Vault unlocked        │
└──────────────────────────────────────────────────────────────┘
```

---

# 4. Frontend Architecture

The frontend is located inside the `app/` directory.

It is built using:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS 4
* Midnight.js 4.1.1
* Midnight dApp Connector API
* Midnight Wallet API
* Compact runtime
* RxJS
* Framer Motion

## Frontend folder structure

```text
app/
├── public/
│   └── contract/
│       └── Privora/
│           ├── compiler/
│           ├── contract/
│           ├── keys/
│           └── zkir/
│
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── gate/
│   │   ├── vault/
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── WalletConnectModal.tsx
│   │   └── WalletSessionBar.tsx
│   │
│   ├── hooks/
│   │   └── useGate.ts
│   │
│   └── lib/
│       ├── access-session.ts
│       ├── explorer.ts
│       ├── gate-store.ts
│       ├── midnight-client.ts
│       └── transaction-stages.ts
│
└── package.json
```

## Route responsibilities

| Route    | Purpose                                                    |
| -------- | ---------------------------------------------------------- |
| `/`      | Landing page and entry point                               |
| `/admin` | Credential registration and gate administration            |
| `/gate`  | User credential verification and ZK proof flow             |
| `/vault` | Protected resource available after successful verification |

---

# 5. Midnight.js SDK Integration

## Judge verification locations

The Midnight.js integration is not only documented in the README. The required packages are present in:

```text
app/package.json
```

The main integration implementation is located in:

```text
app/src/lib/midnight-client.ts
```

The frontend access flow that uses the Midnight client is located in:

```text
app/src/hooks/useGate.ts
```

The generated Compact contract bindings used by the frontend are located in:

```text
app/public/contract/Privora/contract/index.js
app/public/contract/Privora/contract/index.d.ts
```

The proof and verification artifacts are located in:

```text
app/public/contract/Privora/keys/
app/public/contract/Privora/zkir/
```

## Midnight SDK responsibility map

| Package                                                    | Responsibility                                         |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `@midnight-ntwrk/dapp-connector-api`                       | Detect and communicate with compatible browser wallets |
| `@midnight-ntwrk/midnight-js`                              | Core Midnight application integration                  |
| `@midnight-ntwrk/midnight-js-contracts`                    | Contract deployment and circuit calls                  |
| `@midnight-ntwrk/midnight-js-types`                        | Midnight provider and contract types                   |
| `@midnight-ntwrk/midnight-js-network-id`                   | Midnight network configuration                         |
| `@midnight-ntwrk/midnight-js-fetch-zk-config-provider`     | Loads ZK prover and verifier artifacts                 |
| `@midnight-ntwrk/midnight-js-http-client-proof-provider`   | Sends proof-generation requests                        |
| `@midnight-ntwrk/midnight-js-indexer-public-data-provider` | Reads public contract and transaction data             |
| `@midnight-ntwrk/midnight-js-level-private-state-provider` | Stores local private contract state                    |
| `@midnight-ntwrk/wallet-api`                               | Wallet transaction and balancing operations            |
| `@midnight-ntwrk/compact-js`                               | Compact contract JavaScript interaction                |
| `@midnight-ntwrk/compact-runtime`                          | Compact contract runtime support                       |

## Midnight integration flow

```text
Wallet provider detected
        ↓
Wallet connection requested
        ↓
Midnight providers created
        ↓
Contract bindings loaded
        ↓
Private state provider initialized
        ↓
ZK configuration loaded
        ↓
Privora contract joined or deployed
        ↓
Circuit call submitted
        ↓
Proof generated
        ↓
Transaction confirmed
```

---

# 6. Frontend `package.json`

The following package file is already present at:

```text
app/package.json
```

```json
{
  "name": "app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build --webpack",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@midnight-ntwrk/compact-js": "^2.5.1",
    "@midnight-ntwrk/compact-runtime": "^0.16.0",
    "@midnight-ntwrk/dapp-connector-api": "^4.0.1",
    "@midnight-ntwrk/midnight-js": "^4.1.1",
    "@midnight-ntwrk/midnight-js-contracts": "^4.1.1",
    "@midnight-ntwrk/midnight-js-fetch-zk-config-provider": "^4.1.1",
    "@midnight-ntwrk/midnight-js-http-client-proof-provider": "^4.1.1",
    "@midnight-ntwrk/midnight-js-indexer-public-data-provider": "^4.1.1",
    "@midnight-ntwrk/midnight-js-level-private-state-provider": "^4.1.1",
    "@midnight-ntwrk/midnight-js-network-id": "^4.1.1",
    "@midnight-ntwrk/midnight-js-types": "^4.1.1",
    "@midnight-ntwrk/wallet-api": "^5.0.0",
    "@midnight-ntwrk/wallet-sdk-address-format": "^3.1.2",
    "framer-motion": "^12.42.2",
    "lucide-react": "^1.24.0",
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "rxjs": "^7.8.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

This file gives direct evidence that the frontend includes the required Midnight.js, wallet, contract, proof-provider, public-data-provider and private-state-provider packages.

---

# 7. Wallet Connection Architecture

Privora supports Midnight-compatible browser wallets through the dApp Connector API.

The wallet UI is separated into two main components.

## `WalletConnectModal.tsx`

Location:

```text
app/src/components/WalletConnectModal.tsx
```

Responsibilities:

* detect available Midnight-compatible wallets,
* display supported wallet options,
* initiate the wallet connection request,
* handle rejected connection requests,
* handle unavailable wallet extensions,
* show connection errors,
* and close the modal after successful connection.

The supported wallet selection includes Lace and compatible providers such as 1AM when exposed through the Midnight dApp Connector API.

## `WalletSessionBar.tsx`

Location:

```text
app/src/components/WalletSessionBar.tsx
```

Responsibilities:

* display the connected wallet state,
* display the connected wallet address,
* display a shortened address for readability,
* show the active network,
* expose the disconnect action,
* clear the local wallet session,
* and return the interface to its disconnected state.

## Wallet connection flow

```text
User clicks Connect Wallet
        ↓
WalletConnectModal opens
        ↓
Compatible wallet providers are detected
        ↓
User selects Lace or another available provider
        ↓
Connection permission is requested
        ↓
Wallet API session is initialized
        ↓
Connected address is returned
        ↓
WalletSessionBar displays the wallet address
```

## Wallet disconnection flow

```text
User clicks Disconnect
        ↓
Active wallet session is cleared
        ↓
Stored wallet state is removed
        ↓
Contract/provider references are reset
        ↓
WalletSessionBar is hidden
        ↓
Connect Wallet action is shown again
```

## Wallet verification paths for judges

```text
app/src/components/WalletConnectModal.tsx
app/src/components/WalletSessionBar.tsx
app/src/lib/midnight-client.ts
```

These files should be included in judged source files because they provide the direct implementation evidence for:

* wallet discovery,
* wallet connection,
* wallet disconnection,
* address display,
* network handling,
* and error handling.

---

# 8. Circuit Call from Frontend

The core Privora circuit is:

```text
verify_access
```

The circuit is defined in:

```text
contracts/src/privora.compact
```

The generated binding is located in:

```text
contracts/src/managed/contract/
```

The browser-consumable copy is located in:

```text
app/public/contract/Privora/contract/
```

The ZK proving and verification artifacts are located in:

```text
app/public/contract/Privora/keys/
app/public/contract/Privora/zkir/
```

## Frontend circuit flow

```text
/gate page
    ↓
User enters or loads private credential
    ↓
User clicks Verify Access
    ↓
useGate.ts starts the verification process
    ↓
midnight-client.ts prepares Midnight providers
    ↓
Private credential is supplied as a witness
    ↓
verify_access circuit is called
    ↓
Proof provider generates the ZK proof
    ↓
Wallet balances and submits the transaction
    ↓
Transaction status is monitored
    ↓
Successful verification creates an access session
    ↓
User can open /vault
```

## Circuit verification locations

| Purpose                       | File                                       |
| ----------------------------- | ------------------------------------------ |
| Verification page and button  | `app/src/app/gate/page.tsx`                |
| Access verification state     | `app/src/hooks/useGate.ts`                 |
| Midnight contract interaction | `app/src/lib/midnight-client.ts`           |
| Transaction progress model    | `app/src/lib/transaction-stages.ts`        |
| Access session creation       | `app/src/lib/access-session.ts`            |
| Gate state storage            | `app/src/lib/gate-store.ts`                |
| Loading interface             | `app/src/components/ui/LoadingState.tsx`   |
| Progress interface            | `app/src/components/ui/ProgressPanel.tsx`  |
| Status and error display      | `app/src/components/ui/StatusBanner.tsx`   |
| Proof reference display       | `app/src/components/ui/ProofReference.tsx` |
| Protected resource            | `app/src/app/vault/page.tsx`               |

## Loading and error states

During proof generation, Privora can represent stages such as:

```text
Preparing wallet
Loading contract
Preparing private witness
Generating Zero Knowledge proof
Balancing transaction
Submitting transaction
Waiting for confirmation
Access verified
```

The relevant frontend files already present are:

```text
app/src/lib/transaction-stages.ts
app/src/components/ui/LoadingState.tsx
app/src/components/ui/ProgressPanel.tsx
app/src/components/ui/StatusBanner.tsx
```

This gives judges a direct path to verify that the circuit call is connected to visible UI loading, success and failure states.

---

# 9. Contract Architecture

The Compact contract source is located in:

```text
contracts/src/privora.compact
```

## Contract folder structure

```text
contracts/
├── scripts/
│   ├── compile-contract.mjs
│   └── sync-artifacts.mjs
│
├── src/
│   ├── managed/
│   │   ├── compiler/
│   │   │   └── contract-info.json
│   │   ├── contract/
│   │   │   ├── index.d.ts
│   │   │   ├── index.js
│   │   │   └── index.js.map
│   │   ├── keys/
│   │   │   ├── add_valid_credential.prover
│   │   │   ├── add_valid_credential.verifier
│   │   │   ├── verify_access.prover
│   │   │   └── verify_access.verifier
│   │   ├── vault_pass/
│   │   └── zkir/
│   │       ├── add_valid_credential.bzkir
│   │       ├── add_valid_credential.zkir
│   │       ├── verify_access.bzkir
│   │       └── verify_access.zkir
│   │
│   └── privora.compact
│
├── tests/
│   └── privora.test.ts
│
├── jest.config.js
└── package.json
```

## Source and generated files

### Editable source

```text
contracts/src/privora.compact
```

This is the main Compact smart contract and the source of the Privora circuits.

### Generated artifacts

```text
contracts/src/managed/
```

The `managed` directory contains generated output from the Compact compiler.

These files should not be edited manually.

### Browser artifacts

```text
app/public/contract/Privora/
```

The compile and synchronization scripts copy the necessary generated artifacts into the frontend's public directory so the Midnight.js ZK configuration provider can load them.

---

# 10. Contract Circuits

## `add_valid_credential`

Purpose:

* register an approved credential commitment,
* maintain the valid credential set,
* and allow the gate administrator to prepare credentials for private verification.

Artifacts:

```text
add_valid_credential.prover
add_valid_credential.verifier
add_valid_credential.zkir
add_valid_credential.bzkir
```

## `verify_access`

Purpose:

* receive the credential secret as a private witness,
* derive or validate its commitment,
* verify that it belongs to the valid credential set,
* generate a nullifier,
* reject duplicate use when reuse is not allowed,
* and return a successful access result without revealing the raw credential.

Artifacts:

```text
verify_access.prover
verify_access.verifier
verify_access.zkir
verify_access.bzkir
```

---

# 11. Privacy Boundary

```text
┌────────────────────────────┬─────────────────────────────┐
│ Public                     │ Private                     │
├────────────────────────────┼─────────────────────────────┤
│ Contract address           │ Raw credential              │
│ Credential commitments     │ Credential secret           │
│ Used nullifiers            │ User identity               │
│ Verification transaction   │ Witness values              │
│ Access success result      │ Exact allowlist match        │
│ Public gate metadata       │ Local private state          │
└────────────────────────────┴─────────────────────────────┘
```

The credential secret is handled as private witness data and should not be published to the ledger.

The application learns only that the user satisfied the access requirement.

---

# 12. Protected Access Session

After successful verification, the frontend creates a local access session.

Relevant file:

```text
app/src/lib/access-session.ts
```

The session is used to protect:

```text
app/src/app/vault/page.tsx
```

## Access session flow

```text
verify_access succeeds
        ↓
Verification result is received
        ↓
Local access session is created
        ↓
User is redirected to /vault
        ↓
Vault checks the session
        ↓
Protected content is displayed
```

If there is no valid session, the user is redirected to the verification flow or shown an access-denied state.

The local session is only a frontend access-state mechanism. The actual eligibility decision comes from the Midnight circuit verification.

---

# 13. Contract Compilation and Artifact Synchronization

## Compilation script

```text
contracts/scripts/compile-contract.mjs
```

Responsibility:

* compile `privora.compact`,
* generate contract bindings,
* generate prover and verifier keys,
* generate ZKIR artifacts,
* and place the output under `contracts/src/managed`.

## Artifact synchronization script

```text
contracts/scripts/sync-artifacts.mjs
```

Responsibility:

* copy the generated contract artifacts,
* preserve the folder structure required by Midnight.js,
* and publish the browser-consumable artifacts under:

```text
app/public/contract/Privora/
```

## Artifact flow

```text
privora.compact
        ↓
compile-contract.mjs
        ↓
contracts/src/managed/
        ↓
sync-artifacts.mjs
        ↓
app/public/contract/Privora/
        ↓
Midnight.js frontend provider
```

---

# 14. Testing Architecture

The contract test file is located at:

```text
contracts/tests/privora.test.ts
```

The Jest configuration is located at:

```text
contracts/jest.config.js
```

The tests should provide direct evidence for:

1. valid credential registration,
2. valid credential access,
3. invalid credential rejection,
4. duplicate/nullifier reuse rejection,
5. unauthorized credential registration rejection,
6. correct contract state transitions.

The contract tests validate the Compact logic independently from the frontend.

---

# 15. CI Architecture

The CI workflow is present at:

```text
.github/workflows/ci.yml
```

The workflow should make the following checks visible to reviewers:

```text
Install root dependencies
        ↓
Install contract dependencies
        ↓
Compile Compact contract
        ↓
Synchronize generated artifacts
        ↓
Run contract tests
        ↓
Install frontend dependencies
        ↓
Run frontend lint
        ↓
Build Next.js frontend
```

This provides reproducible evidence that:

* the Compact contract compiles,
* the generated artifacts are valid,
* the contract tests pass,
* and the frontend successfully builds with its Midnight.js integration.

---

# 16. Mandatory Judge Verification Map

| Mandatory requirement           | Direct evidence                                            |
| ------------------------------- | ---------------------------------------------------------- |
| Midnight.js SDK dependency      | `app/package.json`                                         |
| Midnight.js source integration  | `app/src/lib/midnight-client.ts`                           |
| Contract call from frontend     | `app/src/hooks/useGate.ts`                                 |
| Verification button/UI          | `app/src/app/gate/page.tsx`                                |
| Proof loading state             | `app/src/components/ui/LoadingState.tsx`                   |
| Proof progress state            | `app/src/components/ui/ProgressPanel.tsx`                  |
| Success/error state             | `app/src/components/ui/StatusBanner.tsx`                   |
| Wallet selection and connect    | `app/src/components/WalletConnectModal.tsx`                |
| Address and disconnect UI       | `app/src/components/WalletSessionBar.tsx`                  |
| Lace/compatible wallet API      | `@midnight-ntwrk/dapp-connector-api` in `app/package.json` |
| Compact source                  | `contracts/src/privora.compact`                            |
| Generated contract binding      | `contracts/src/managed/contract/index.js`                  |
| Browser contract binding        | `app/public/contract/Privora/contract/index.js`            |
| `verify_access` prover/verifier | `app/public/contract/Privora/keys/`                        |
| `verify_access` ZKIR            | `app/public/contract/Privora/zkir/`                        |
| Contract tests                  | `contracts/tests/privora.test.ts`                          |
| Product plan                    | `Documents/PLAN.md`                                        |
| Privacy/trust model             | `Documents/TRUST_MODEL.md`                                 |
| Product proposal                | `PROPOSAL.md` at repository root                           |

---

# 17. Important Root-Level Proposal Requirement

The current project structure contains:

```text
Documents/PROPOSAL.md
```

However, the rejection states that the judge only checked the repository root and did not find the mandatory proposal.

To make the proposal directly visible to the judging system, keep a root-level copy:

```text
PRIVORA/
├── PROPOSAL.md
├── README.md
├── app/
├── contracts/
└── Documents/
```

The root file should be:

```text
PROPOSAL.md
```

Do not rely only on:

```text
Documents/PROPOSAL.md
```

The root-level `PROPOSAL.md` should be linked near the top of the root `README.md`.

Example:

```markdown
## Project Documents

- [Product Proposal](./PROPOSAL.md)
- [Project Plan](./Documents/PLAN.md)
- [Privacy and Trust Model](./Documents/TRUST_MODEL.md)
```

---

# 18. Important Source Visibility Note

The previous rejection did not say that the packages or components were absent.

It said that they were not available in the files inspected by the judge.

The following files must therefore be committed, pushed and directly visible in the public repository:

```text
app/package.json
app/src/lib/midnight-client.ts
app/src/hooks/useGate.ts
app/src/app/gate/page.tsx
app/src/components/WalletConnectModal.tsx
app/src/components/WalletSessionBar.tsx
app/src/components/ui/LoadingState.tsx
app/src/components/ui/ProgressPanel.tsx
app/src/components/ui/StatusBanner.tsx
contracts/src/privora.compact
contracts/tests/privora.test.ts
PROPOSAL.md
```

These source files should not be excluded through `.gitignore`.

They should also be linked in the README so reviewers do not need to search for them manually.

---

# 19. Recommended README Verification Links

Add a section like this to the root README:

```markdown
## Implementation Verification

| Feature | Source |
|---|---|
| Midnight.js integration | [`app/src/lib/midnight-client.ts`](./app/src/lib/midnight-client.ts) |
| Midnight dependencies | [`app/package.json`](./app/package.json) |
| Wallet connection modal | [`app/src/components/WalletConnectModal.tsx`](./app/src/components/WalletConnectModal.tsx) |
| Wallet session and disconnect | [`app/src/components/WalletSessionBar.tsx`](./app/src/components/WalletSessionBar.tsx) |
| Frontend circuit flow | [`app/src/hooks/useGate.ts`](./app/src/hooks/useGate.ts) |
| Gate verification UI | [`app/src/app/gate/page.tsx`](./app/src/app/gate/page.tsx) |
| Compact contract | [`contracts/src/privora.compact`](./contracts/src/privora.compact) |
| Contract tests | [`contracts/tests/privora.test.ts`](./contracts/tests/privora.test.ts) |
| Product proposal | [`PROPOSAL.md`](./PROPOSAL.md) |
| Project plan | [`Documents/PLAN.md`](./Documents/PLAN.md) |
| Privacy model | [`Documents/TRUST_MODEL.md`](./Documents/TRUST_MODEL.md) |
```

---

# 20. End-to-End Privora Flow

```text
1. User opens Privora
        ↓
2. User clicks Connect Wallet
        ↓
3. WalletConnectModal detects Lace or another compatible wallet
        ↓
4. User approves the connection
        ↓
5. WalletSessionBar displays the connected address
        ↓
6. User opens the Gate page
        ↓
7. User provides the credential secret locally
        ↓
8. User clicks Verify Access
        ↓
9. useGate.ts starts the verification operation
        ↓
10. midnight-client.ts initializes providers and contract access
        ↓
11. verify_access receives the private witness
        ↓
12. The ZK proof is generated
        ↓
13. The transaction is balanced and submitted through the wallet
        ↓
14. The contract checks credential validity and proof reuse
        ↓
15. The frontend displays the confirmed result
        ↓
16. A local access session is created
        ↓
17. The protected Vault resource is unlocked
        ↓
18. User may disconnect through WalletSessionBar
```

---

# 21. Architecture Summary

Privora uses a clear separation of responsibility:

```text
Wallet UI
    Handles wallet detection, connection, address display and disconnect.

Gate UI
    Collects the private access input and starts verification.

useGate
    Controls frontend access-verification state.

midnight-client
    Configures Midnight.js providers and performs contract interaction.

Compact contract
    Verifies credentials privately and prevents unauthorized reuse.

Generated artifacts
    Provide browser-loadable contract bindings, prover keys and ZKIR files.

Access session
    Unlocks the protected frontend resource after confirmed verification.

Contract tests
    Verify valid, invalid and duplicate access behavior.

CI workflow
    Proves the contract and frontend build successfully.

PROPOSAL.md
    Provides the mandatory product idea submission at repository root.
```

All major implementation layers are already represented in the repository structure. The important submission fix is to ensure that the actual source files are committed and directly linked for reviewers, and that `PROPOSAL.md` is available at the repository root rather than only inside the `Documents` directory.

```
```
