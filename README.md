<div align="center">

  <h1 align="center">🔐 Nexora</h1>
  <h3>Privacy-First Zero-Knowledge Access Control on Midnight Network</h3>
  <p><i>Prove you're authorized — without revealing who you are.</i></p>

  <br />
  <img src="https://img.shields.io/badge/Midnight_Network-000000?style=for-the-badge" alt="Midnight Network" />
  <img src="https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Lace_Wallet-7B68EE?style=for-the-badge" alt="Lace Wallet" />
  <img src="https://img.shields.io/badge/1AM_Wallet-FF5733?style=for-the-badge" alt="1AM Wallet" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />

<br />
  <br />
  <a href="https://github.com/rishiisarkar/Nexora/actions/runs/32278800387">
    <img src="https://img.shields.io/badge/CI%2FCD-passing-brightgreen?style=for-the-badge" alt="CI/CD Pipeline Status" />
  </a>
</div>
<br />
<img width="1901" height="918" alt="Screenshot 2026-08-19 223024" src="https://github.com/user-attachments/assets/84b1e036-f2d8-44ca-84c7-507dd0371f7c" />

<br />
<br />

> Confidential, production-grade Zero-Knowledge access control gateway built on the Midnight Network. Nexora lets users prove they are authorized to access a resource — without ever revealing their identity, wallet history, or the underlying credential.

**Nexora** replaces traditional wallet-based allowlists and token-gated access with a Zero-Knowledge Merkle membership proof. Members prove they hold a valid, enrolled credential and generate a single-use nullifier locally in their browser — nothing sensitive ever touches the chain. Built for the **First Quarter (Level 3)** challenge as part of the **RiseIn & Midnight Foundation "New Moon to Full: Monthly Moonshots on Midnight" Program 2026**.

---
## 🌒 Moonshots Level 1 → 3 — Requirements & Submission Checklist
## 🌐 Live Demo
[https://nexora-app-web3.vercel.app/](https://nexora-app-web3.vercel.app/)

## **Demo Video** [Watch the Nexora Demo Video on Google Drive](https://drive.google.com/file/d/1cAb_dis5CkSjRz4XW3x5RSnGYpUv2BDh/view?usp=sharing)
---

## 📋 Quick Links & CheckList
| Network     | Address                                                              |
| ----------- | -------------------------------------------------------------------- |
| **🌐Live Demo** | [https://nexora-app-web3.vercel.app/](https://nexora-app-web3.vercel.app/) |
| **Preprod** | `0x85c6d5ce4fec74c33a17d4307290bf7d05878637b9f2e70bead1d90bdf5353cc` |
| **Demo Video** |[Watch the Nexora Demo Video on Google Drive](https://drive.google.com/file/d/1cAb_dis5CkSjRz4XW3x5RSnGYpUv2BDh/view?usp=sharing) |
| CI/CD pipeline running (workflow file + passing runs)                 |               ✅ **Passed**                |

> Preprod deployed. Verify the new address on [Midnight Preprod Explorer](https://preprod.midnightexplorer.com/contracts/85c6d5ce4fec74c33a17d4307290bf7d05878637b9f2e70bead1d90bdf5353cc) 

---
## 🔎 Explorer Verification (Preview NetWork)

| Resource | Link                                                                                                                                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Explorer | [Midnight Preprod Explorer](https://preprod.midnightexplorer.com/contracts/85c6d5ce4fec74c33a17d4307290bf7d05878637b9f2e70bead1d90bdf5353cc)                                                                                                        |
| Contract | [0x85c6d5ce4fec74c33a17d4307290bf7d05878637b9f2e70bead1d90bdf5353cc](https://preprod.midnightexplorer.com/contracts/4c8d8bc1f4ebffa14661465644c523c994a1367bfd0e043a09eca46f96fb7d79) |
### 🌓 Level 3 — First Quarter

**Chosen Idea:** _Private Allowlist Access_ — prove membership without revealing identity.

| Requirement                                                           |                   Status                   |
| --------------------------------------------------------------------- | :----------------------------------------: |
| Fully functional dApp that meaningfully uses Midnight's privacy model |               ✅ **Passed**                |
| Minimum 3 tests passing                                               |  ✅ **Passed**   |
| CI/CD pipeline running (workflow file + passing runs)                 |               ✅ **Passed**                |
| Approved idea submitted from the provided idea list                   | ✅ **Passed** — _Private Allowlist Access_ |
| Minimum 10 meaningful commits                                         |               ✅ **Passed**                |



### 1. Automated Test Suite Passing

<img width="486" height="169" alt="Screenshot 2026-07-22 123954" src="https://github.com/user-attachments/assets/b71b9cdb-8fc5-46d3-9a80-b390b3c44db1" />

### 2. Deployed on Prepod Network
<img width="1815" height="911" alt="image" src="https://github.com/user-attachments/assets/0b105701-ff92-40b1-bdfa-ec4c75c5c06e" />



### 3. CI & CD Running 
<img width="1915" height="658" alt="Screenshot 2026-08-19 223155" src="https://github.com/user-attachments/assets/235632aa-710e-4ac8-9b63-af10c8cc1901" />


### 4. Commit Over 30 meaningful commits   ✅ **Passed**  

**Submission Checklist**

- [x] Public GitHub repository with complete README
- [x] Live demo link
- [x] Screenshot: test output (3+ tests passing)
- [x] CI/CD badge or workflow file with passing runs
- [x] Demo video (1 minute) showing full functionality
- [x] README "privacy model" section: what an observer can and cannot learn
- [x] Product proposal (from the idea list) submitted for approval
- [x] Minimum 10 meaningful commits

---

### 🌒 Level 2 — Waxing Crescent

| Requirement                                                           |                                                                                                  Status                                                                                                   |
| --------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| Lace wallet connect / disconnect implemented                          |                                                                      ✅ **Passed** — Browser DApp Connector API, Lace & 1AM support                                                                       |
| Circuit called successfully from the frontend                         |                                                         ✅ **Passed** — `verify_access()` runs in local ZK prover, broadcast via contract wrapper                                                         |
| An observable privacy behavior (something proven without being shown) |                                                ✅ **Passed** — Merkle membership + nullifier check proven locally without revealing the secret credential                                                 |
| Contract deployed to Preprod with a verifiable address | [0x85c6d5ce4fec74c33a17d4307290bf7d05878637b9f2e70bead1d90bdf5353cc](https://preprod.midnightexplorer.com/contracts/4c8d8bc1f4ebffa14661465644c523c994a1367bfd0e043a09eca46f96fb7d79)|
| Minimum 8 meaningful commits                                          |                                                                                               ✅ **Passed**                                                                                               |

## 🎬 Demo-Video

[Watch the Nexora Demo Video on Google Drive](https://drive.google.com/file/d/1cAb_dis5CkSjRz4XW3x5RSnGYpUv2BDh/view?usp=sharing)

### What to Record (Under 2 Minutes)

1. **Connect Lace wallet** — show the address appear on screen
2. **Admin flow** — deploy a gate and enroll a credential hash
3. **Navigate to Member Access page** — show the Public vs Private comparison
4. **Click "Generate Proof"** — show the loading state during ZK proof generation
5. **Show the on-chain result** — transaction hash and "Proved without revealing your input" label
6. **Point out** that the raw secret credential was never shown in the UI or sent to the chain
7. **Disconnect wallet** — show the UI reset to disconnected state

**Submission Checklist**

- [x] Public GitHub repository with README
- [x] Live demo link (Vercel, Netlify, or similar)
- [x] Deployed Preprod contract address 
- [x] Demo video: wallet connect + a successful circuit call
- [x] README documenting the privacy claim
- [x] Minimum 8 meaningful commits

---



## 💡 What This Does

Nexora is a privacy-preserving access gateway where:

1. **Admins** deploy an access gate on the Midnight Preprod network and enroll authorized members by hashing their credentials into a Merkle Tree.
2. **Members** connect their wallet (Lace or 1AM) and paste their secret credential locally in the browser.
3. A Zero-Knowledge proof is generated client-side, proving the credential's hash is a valid leaf in the enrolled Merkle Tree **and** that its nullifier has never been used before.
4. Only the **proof**, the **Merkle root check result**, and the **nullifier** are recorded on-chain — the raw credential, wallet identity, and Merkle path are **never transmitted or stored anywhere**.
5. Once verified, the member's session vault unlocks — access granted, identity still unknown.

---

## 🔒 Privacy Model

### What is PUBLIC (On-Chain — Visible to Everyone)

- Merkle root of enrolled credential hashes
- Set of spent nullifiers
- Admin address
- Whether a given access gate is active

### What is PRIVATE (Off-Chain — Never Leaves Your Browser)

- 🔒 Your raw secret credential
- 🔒 Your Merkle inclusion path
- 🔒 Your wallet identity linkage to the credential
- 🔒 All witness input values

### What the User PROVES Without Revealing

- ✅ That their credential hash is a valid leaf in the Merkle Tree (membership)
- ✅ That their nullifier has not been used before (no replay)
- ✅ That the proof was authorized by a connected wallet
- ❌ The actual secret credential is **never disclosed**
- ❌ Which specific leaf/identity in the tree they correspond to is **never disclosed**

---

## 🛡️ Privacy Claim

> **An on-chain observer can see** that a valid membership proof was submitted, a nullifier was inserted into the spent set, and the Merkle root remains unchanged. **An on-chain observer CANNOT see** which credential produced the proof, the member's wallet-to-credential linkage, or any private witness inputs. The ZK circuit mathematically proves Merkle membership and nullifier uniqueness without passing the raw secret through `disclose()`. The private witness callbacks execute exclusively on the client machine, and their return values never enter the public ledger state.

This is verified by the automated test suite, which confirms that private witness values do not appear in the serialized public contract state after circuit execution.

---

## ✨ Key Features

- 🔐 **Zero-Knowledge Authentication** — Authenticate without revealing the original credential.
- 🌳 **Merkle Tree Allowlist** — Authorized members are represented as hashed leaves; only hashes are ever stored.
- ♻️ **Nullifier Protection** — Each successful proof generates a unique nullifier; spent nullifiers are permanently rejected, preventing replay attacks.
- 👤 **Admin Console** — Deploy new access gates, enroll credential hashes, generate member credentials, share access links, and restore published gates.
- 🔑 **Secure Member Access** — Connect wallet → paste secret → generate proof → unlock access. No sensitive data ever leaves the browser.
- 🔌 **Multi-Wallet Support** — Connect and disconnect cleanly with Lace or 1AM wallet extensions.
- 🔍 **Frontend Circuit Execution** — Call `verify_access()` directly from the browser with real-time proof generation feedback.
- 🏷️ **Privacy Label** — "Proved without revealing your input" displayed after every successful circuit call.
- 📊 **Explorer Integration** — Automatic explorer links for every transaction and contract deployment.

---

## 🚨 Problem Statement

Current token-gated and allowlist-based platforms require users to expose sensitive information simply to prove they belong:

- Wallet-based allowlists reveal wallet addresses and transaction history
- Token-gated communities expose NFT holdings and token balances
- Private events and DAO memberships leak participation history
- Beta testing platforms tie access directly to identifiable wallets

This creates unnecessary privacy risk for a problem that should require zero disclosure.

---

## 💡 Solution

Nexora introduces a Zero-Knowledge access gateway. Instead of exposing a credential to prove access, the flow is:

```
Secret Credential
       ↓
Generate ZK Proof (Merkle membership + nullifier)
       ↓
Blockchain Verification
       ↓
Access Granted
```

Only proof validity reaches the blockchain. Secrets remain private forever.

---

## ⚙️ How It Works

```text
                 Admin

          Deploy Access Gate
                  │
                  ▼
        Create Credential Secret
                  │
                  ▼
      Hash Secret → Merkle Tree
                  │
──────────────────────────────────────────

                Member

        Receive Secret Securely
                  │
                  ▼
          Connect Wallet
                  │
                  ▼
        Generate ZK Proof
                  │
                  ▼
      Midnight Smart Contract
                  │
                  ▼
      Verify Merkle Membership
                  │
                  ▼
      Check Nullifier Replay
                  │
                  ▼
         Unlock Session Vault
```

---

## 🏗 Architecture

```text
                  ┌────────────────────┐
                  │     Admin Panel    │
                  └─────────┬──────────┘
                            │
                            ▼
               Midnight Compact Contract
                            │
             ┌──────────────┴─────────────┐
             │                            │
             ▼                            ▼
      Merkle Tree                 Nullifier Set
             │                            │
             └──────────────┬─────────────┘
                            ▼
                     ZK Verification
                            │
                            ▼
                    Session Unlock
                            │
                            ▼
                     Protected Vault
```

---

## 🔒 Security & Architecture: Public State vs. Private Witness

```text
[ Member's Local Proving Engine ]                   [ Midnight Preprod Blockchain Ledger ]
┌──────────────────────────────────────┐           ┌──────────────────────────────────────────────┐
│ Private Witness Inputs (Off-Chain):  │           │ Public Ledger State (Visible to All):        │
│ • Raw Secret Credential               │  ──(ZK)─► │ • Merkle Root of Enrolled Credentials        │
│ • Merkle Inclusion Path               │  Proof    │ • Spent Nullifier Set                        │
│ • Wallet Signing Key                  │           │ • Admin Address / Gate Status                │
└──────────────────────────────────────┘           └──────────────────────────────────────────────┘
```

- **Public Ledger State (`export ledger`)**: Stores the Merkle root and spent nullifiers. Everyone can inspect these fields.
- **Private Witness Callbacks (`witness`)**: Declares local functions that run _exclusively on the member's client machine_.
- **Deliberate Selective Disclosure**: The `verify_access()` circuit asserts Merkle membership and nullifier uniqueness. Upon success, it inserts the nullifier into the spent set. **No credential or identity is ever passed to `disclose()`**, proving valid membership while preserving 100% credential secrecy.

---

## 🛠 Tech Stack

| Layer                  | Technology                              | Description                                                                                                   |
| :--------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Smart Contract**     | Compact Language (`v0.22.0+`)           | Native ZK domain-specific language for public/private state transitions                                       |
| **Compiler**           | Midnight Compact CLI (`v0.30.0`)        | Compiles `.compact` code into ZKIR circuits and TypeScript wrappers                                           |
| **Runtime SDK**        | `@midnight-ntwrk/compact-runtime`       | TypeScript execution environment for contract simulation and proofs                                           |
| **Frontend**           | Next.js 15 (App Router) + TypeScript    | Modern SPA/SSR hybrid with component-based architecture                                                       |
| **Styling**            | Tailwind CSS                            | Dark, modern, responsive interface                                                                            |
| **Wallet Integration** | `@midnight-ntwrk/dapp-connector-api`    | DApp Connector API for Lace and 1AM wallet extensions                                                         |
| **Contract SDK**       | `@midnight-ntwrk/midnight-js-contracts` | Contract deployment, discovery, and circuit call execution                                                    |
| **Testing**            | Jest / TypeScript                       | Automated unit tests for admin permissions, allowlist behavior, Merkle logic, and nullifier replay prevention |
| **Target Network**     | Midnight Preprod                        | Live staging network for privacy-preserving dApps                                                             |
| **Package Manager**    | npm Workspaces                          | Monorepo dependency management                                                                                |
| **CI/CD**              | GitHub Actions                          | Compile + test on every push                                                                                  |
| **Deployment**         | Vercel                                  | Static/SSR hosting for the frontend application                                                               |

---

## 📋 Prerequisites

- **Lace Wallet** (Midnight Beta) or **1AM Wallet** browser extension installed and set to the **Preprod** network
- **Node.js** v20+ (Node 22 LTS recommended)
- **Docker Desktop** running with the Midnight Proof Server container (for local ZK proof generation)
- **WSL 2 (Ubuntu)** or Linux/macOS (for the Compact compiler)
- Preprod network DUST balance in your wallet

---

## 🚀 Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Rimanshu-Singh/Nexora.git
cd Nexora
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile the Compact Smart Contract (WSL/Linux)

```bash
npm run compile
```

### 4. Run the Automated Test Suite

```bash
npm test
```

### 5. Start the Proof Server (Docker)

```bash
docker start proof-server
```

### 6. Start the Frontend Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 7. Connect Wallet & Call Circuit

1. Open `http://localhost:3000` → click **Launch App**
2. Click **Connect Wallet** → select **Lace** or **1AM** → approve in extension
3. Navigate to the **Member Access** page
4. Paste your secret credential and click **Generate Proof — Verify Access**
5. Wait for ZK proof generation (30–60 seconds)
6. See "Proved without revealing your input" confirmation and unlock the vault

---

---

## 📁 Project Structure

```text
Nexora/
├── contracts/
│   ├── src/
│   │   └── vault_pass.compact       ← ZK smart contract
│   ├── tests/
│   └── compiler/
├── app/
│   ├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx        ← wallet connect/disconnect UI
│   │   └── CircuitCall.tsx          ← circuit call button + result display
│   ├── lib/
│   │   └── useMidnight.ts           ← Midnight.js SDK hook
│   └── pages/
│
├── contracts/
│   ├── src/
│   │     Nexora.compact
│   ├── tests/
│   └── compiler/
│
├── public/
├── .github/
│   └── workflows/
│       └── ci.yml                   ← CI/CD pipeline
├── package.json
└── README.md
```

---


## 🧪 Testing

Run tests:

```bash
npm test
```

The test suite validates:

- Admin permissions
- Allowlist enrollment behavior
- Merkle membership verification logic
- Nullifier replay prevention

> Testing uses mocked in-memory structures for fast iteration; end-to-end proof generation is verified separately via the browser proof server.

### Test Output

<img width="486" height="169" alt="Screenshot 2026-07-22 123954" src="https://github.com/user-attachments/assets/1956bef9-193a-4d3b-b7a1-ec9f3aebe2ca" />

---

## ⚙️ CI/CD

A GitHub Actions workflow compiles the Compact contract and runs the full test suite on every push and pull request.

```
.github/workflows/ci.yml
```

<img width="1915" height="658" alt="Screenshot 2026-08-19 223155" src="https://github.com/user-attachments/assets/235632aa-710e-4ac8-9b63-af10c8cc1901" />

```md
[![CI/CD Pipeline Status](https://github.com/rishiisarkar/Nexora/actions/runs/32278800387)](https://github.com/rishiisarkar/Nexora/actions/workflows/ci.yml)
```

---

## 🚀 Deployment

### Frontend

Deploy directly to Vercel:

```bash
npm run build
```

Import the repository into Vercel. No production environment variables are required.

### Smart Contract

Contracts are deployed through the built-in Admin Dashboard. Each deployment creates a unique contract address on Midnight Preprod. Preprod deployment is pending until you connect a funded Preprod wallet and deploy from /admin.

---

## 🛡️ Security Model

Nexora never stores:

- Raw credentials
- Identity information
- Wallet history
- Private keys

Only the following exist on-chain:

- Credential hashes (as Merkle leaves)
- The Merkle root
- Spent nullifiers

Replay attacks are prevented using cryptographic nullifiers — every proof is single-use and cannot be replayed.

---


## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit changes
   ```bash
   git commit -m "Add amazing feature"
   ```
4. Push the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

---

## 🙏 Acknowledgments

- **Midnight Foundation & IOG** for building the ground-breaking privacy-first blockchain architecture.
- **RiseIn** for hosting the _New Moon to Full_ builder program.
- **Lace Wallet** and **1AM Wallet** for providing Midnight-compatible wallet extensions and enabling seamless browser testing.

---

## 📄 License

This project is licensed under the **MIT License**.

---
