# Nexora — Project Plan

## 1. Project Overview

Nexora is a privacy-preserving credential and access verification system built on Midnight.

The main goal is simple:

> Let a user prove they are eligible to access something without revealing their identity or the full credential they used.

For example, a developer portal may require a valid **Developer Credential**. Instead of sending that credential and all of its information to the application, the user proves privately that:

* the credential was issued by a trusted issuer,
* it has the required role,
* it has not expired,
* it has not been revoked,
* and the authorization has not already been used when reuse is restricted.

If those conditions are satisfied, Nexora returns a valid access result without exposing unnecessary private information.

---

## 2. Problem

Access-controlled applications usually need to know too much about their users.

To access a private community, developer portal, event, partner resource, or restricted feature, users may need to expose:

* their wallet identity,
* membership information,
* complete credentials,
* account details,
* or other personal information.

In many cases, the application does not actually need this information.

It only needs an answer to one question:

> **Does this user satisfy the access requirements?**

Nexora uses Zero Knowledge proofs to answer that question while keeping the underlying credential information private.

---

## 3. Core System

Nexora will have four main parts:

### Credential Issuer

An approved organization or authority can issue credentials to users.

A credential can contain conditions such as:

* credential type,
* role,
* issuer,
* validity period,
* expiration time,
* and other access-related attributes.

Nexora will support **multiple trusted issuers**, allowing an application to accept credentials from different approved organizations.

### Credential Holder

The user holds the credential information privately.

When access is requested, the user proves that their credential satisfies the application's policy without revealing the complete credential.

### Nexora Verification Contract

The Midnight contract verifies the required conditions using private inputs and publicly verifiable state.

It checks whether:

* the credential is valid,
* the issuer is trusted,
* the required role is present,
* the credential has not expired,
* the credential has not been revoked,
* and the proof/access authorization has not already been used when reuse is restricted.

### Protected Application

An external application integrates Nexora and asks for verification before unlocking a protected feature or resource.

The application receives the verification result rather than the user's raw credential.

---

## 4. Credential Lifecycle

A credential should not remain valid forever without control.

Nexora will therefore support a basic credential lifecycle.

### Issuance

A trusted issuer creates or registers a credential commitment for a user.

The sensitive credential information remains private.

### Expiration

Credentials can include a validity period.

For example:

```text
Developer Credential
Valid Until: 30 September 2026
```

Nexora verifies that the credential is still within its allowed validity period before granting access.

An expired credential must fail verification.

### Revocation

An issuer can revoke a credential before its expiration date.

This is useful when:

* a credential is compromised,
* membership is removed,
* permissions change,
* or the credential was issued incorrectly.

Nexora checks the revocation state during access verification.

A revoked credential cannot be used to gain access.

---

## 5. Multiple Credential Issuers

Nexora will not depend on one central credential issuer.

A protected application can define which issuers it trusts.

For example:

```text
Developer Portal

Accepted Issuers:

- Midnight Developer Community
- Partner Organization A
- Partner Organization B
```

A user can prove that their credential came from one of the approved issuers without exposing unnecessary credential information.

This makes Nexora useful across different organizations and applications.

---

## 6. Role-Based Access

Different credentials can provide different levels of access.

Example roles:

```text
Member
Developer
Partner
Moderator
Admin
```

A protected application can define a policy such as:

```text
Required Role: Developer
```

The user proves privately that their credential satisfies the required role.

The application only needs to know that the requirement was satisfied.

This allows one Nexora-based credential system to protect multiple resources with different permissions.

---

## 7. Time-Based Access

Nexora will also support policies where access is valid only during a specific period.

Example:

```text
Event Credential

Access Starts:
10 September 2026 — 09:00

Access Ends:
10 September 2026 — 18:00
```

Outside the allowed period, the credential cannot authorize access.

This can be useful for:

* private events,
* temporary developer environments,
* limited partner access,
* conference resources,
* and time-limited memberships.

---

## 8. Protection Against Credential and Proof Reuse

Preventing reuse is an important part of the Nexora design.

A valid credential should not automatically mean that the same proof can be copied and replayed.

Nexora will use **nullifier-based protection** where required.

A nullifier can represent a specific credential usage under a specific gate, resource, or access period.

The contract records used nullifiers without revealing the user's identity or raw credential.

This can support policies such as:

```text
One-Time Access
One Access Per Event
One Access Per Epoch
Reusable Until Expiration
```

If a one-time authorization has already been consumed, another attempt using the same authorization context will be rejected.

---

## 9. Zero Knowledge Usage

Zero Knowledge is part of the core access decision, not an additional privacy feature.

The private inputs may include information such as:

* credential secret,
* credential attributes,
* membership information,
* or other data required to prove eligibility.

The Compact circuit verifies the required conditions without requiring the protected application to receive those private values.

Conceptually:

```text
Private Credential
        ↓
Compact / ZK Verification
        ↓
Check Trusted Issuer
Check Required Role
Check Expiration
Check Revocation
Check Reuse Policy
        ↓
Valid Proof
        ↓
Access Granted
```

The application learns only what is necessary for the access decision.

---

## 10. Public vs Private Data

| Data                              | Visibility                    |
| --------------------------------- | ----------------------------- |
| Trusted issuer registry           | Public                        |
| Credential commitments            | Public / committed            |
| Access policies                   | Public                        |
| Credential revocation state       | Public                        |
| Used nullifiers                   | Public                        |
| User identity                     | Private                       |
| Raw credential                    | Private                       |
| Credential secret                 | Private                       |
| Unnecessary credential attributes | Private                       |
| Private witness inputs            | Private                       |
| Verification result               | Public to the requesting flow |

The goal is not to hide everything.

The goal is to expose only the information necessary to make access verifiable.

---

## 11. Nexora SDK

Nexora is planned as reusable infrastructure rather than only one standalone application.

A developer should be able to integrate Nexora into another Midnight application without rebuilding the complete credential verification flow.

The project will therefore include an initial **Nexora TypeScript SDK/API**.

Example integration:

```ts
const result = await nexora.verifyAccess({
  policy: "developer-access"
});

if (result.verified) {
  unlockDeveloperPortal();
}
```

The SDK will provide a simple interface around the Nexora verification flow.

Its responsibilities will include:

* requesting access verification,
* interacting with Nexora contracts,
* preparing the required verification flow,
* submitting/verifying proof-related transactions,
* handling verification results,
* and returning a clear result to the integrating application.

The SDK should hide unnecessary blockchain complexity from application developers.

---

## 12. Example SDK Interface

The first version can expose a small API such as:

```ts
createNexoraClient(config)

requestAccess(policyId)

verifyAccess(policyId)

getVerificationStatus()

getCredentialStatus()
```

The goal is to keep the first SDK small.

It only needs to demonstrate that Nexora can be integrated into another application as an access-verification layer.

---

## 13. Sample Midnight dApp

A separate sample application will demonstrate a complete Nexora integration.

### Nexora Developer Portal

The sample dApp will contain a protected developer resource.

The access requirement will be:

> The user must hold a valid Developer credential issued by an approved issuer.

The credential must also:

* have the required Developer role,
* not be expired,
* not be revoked,
* and satisfy the configured reuse policy.

### Complete Flow

```text
Trusted Issuer
      ↓
Issues Developer Credential
      ↓
User Holds Credential Privately
      ↓
User Opens Developer Portal
      ↓
Portal Calls Nexora SDK
      ↓
Nexora Requests Private Verification
      ↓
Compact Circuit Verifies Requirements
      ↓
Proof Accepted
      ↓
SDK Returns Verified Result
      ↓
Protected Developer Resource Unlocks
```

This sample application is important because it demonstrates that Nexora is not only an isolated credential demo.

It shows another Midnight application actually using Nexora as infrastructure.

---

## 14. Sample Protected Resource

The Developer Portal will contain a resource that remains locked until verification succeeds.

For example:

```text
Developer Documentation
Private API Sandbox
Partner SDK Download
Developer Dashboard
```

Before verification:

```text
🔒 Developer Resource Locked

Verify your eligibility with Nexora.
```

After successful verification:

```text
✓ Access Verified

Developer Resource Unlocked
```

The raw credential will not be displayed to the protected application.

---

## 15. Technical Architecture

```text
nexora/
│
├── contracts/
│   ├── credential.compact
│   ├── access_policy.compact
│   └── tests/
│
├── sdk/
│   └── src/
│       ├── client.ts
│       ├── verification.ts
│       └── types.ts
│
├── app/
│   └── Nexora credential management
│
├── examples/
│   └── developer-portal/
│       └── Sample SDK integration
│
├── docs/
│   ├── PRIVACY_MODEL.md
│   ├── SDK.md
│   └── ARCHITECTURE.md
│
└── README.md
```

The architecture separates the core verification system from the application that demonstrates its use.

---

## 16. Contract Responsibilities

The Compact contract layer will focus on the minimum state and verification logic required for the MVP.

Core responsibilities:

1. Register trusted credential issuers.
2. Register or manage credential commitments.
3. Define credential validity and expiration.
4. Support credential revocation.
5. Define access policies.
6. Verify private eligibility requirements.
7. Enforce role and time restrictions.
8. Track nullifiers where reuse protection is required.

The contract should remain focused on credential verification rather than becoming a complete decentralized identity system.

---

## 17. Main User Flows

### Issuer Flow

```text
Connect Wallet
→ Create / Register Credential
→ Define Role
→ Define Expiration
→ Issue Credential
```

The issuer can later revoke the credential if required.

### User Verification Flow

```text
Open Protected Application
→ Connect Wallet
→ Request Access
→ Select / Load Private Credential
→ Generate Verification Proof
→ Submit Verification
→ Access Granted or Denied
```

### Developer Integration Flow

```text
Install Nexora SDK
→ Configure Nexora Client
→ Define Required Policy
→ Call verifyAccess()
→ Receive Verification Result
→ Unlock Protected Feature
```

---

## 18. Testing Plan

The test suite will cover both successful and rejected verification cases.

Core contract tests:

1. Valid credential grants access.
2. Invalid credential is rejected.
3. Expired credential is rejected.
4. Revoked credential is rejected.
5. Credential from an untrusted issuer is rejected.
6. Incorrect role is rejected.
7. Access outside the allowed time is rejected.
8. Reused one-time authorization/nullifier is rejected.
9. Valid credentials from multiple trusted issuers are accepted.

The SDK integration will also include a basic end-to-end test showing:

```text
Sample dApp
→ Nexora SDK
→ Verification
→ Access Result
→ Protected Feature
```

---

## 19. Development Plan

| Phase   | Work                         | Output                          |
| ------- | ---------------------------- | ------------------------------- |
| Phase 1 | Credential and issuer model  | Core Compact contract           |
| Phase 2 | Expiration and revocation    | Credential lifecycle            |
| Phase 3 | Role/time policies           | Flexible access rules           |
| Phase 4 | Nullifier protection         | Replay/reuse prevention         |
| Phase 5 | Frontend integration         | Complete Nexora user flow      |
| Phase 6 | Nexora SDK                  | Reusable TypeScript integration |
| Phase 7 | Sample Developer Portal      | Real SDK integration            |
| Phase 8 | Tests and Preprod validation | Verified end-to-end flow        |
| Phase 9 | Documentation and demo       | Submission-ready project        |

---

## 20. MVP Deliverables

The completed MVP should demonstrate:

* A working Compact-based credential verification system.
* Private eligibility verification using Zero Knowledge.
* Credential expiration.
* Credential revocation.
* Multiple trusted issuers.
* Role-based access.
* Time-based access.
* Nullifier-based protection against unauthorized reuse.
* A basic Nexora TypeScript SDK/API.
* A separate sample Midnight dApp using the SDK.
* A real protected resource unlocked only after successful verification.
* Contract and integration tests.
* Preprod deployment.
* Privacy and SDK documentation.

---

## 21. Final Goal

Nexora starts with credential-based private access, but the goal is to make that capability reusable.

Instead of every Midnight developer building their own credential verification and privacy logic, an application should be able to integrate Nexora and ask:

> **“Does this user satisfy my access policy?”**

Nexora verifies that privately and returns the minimum result the application needs.

The user keeps their sensitive credential information private.

The application still gets verifiable access control.

That is the core purpose of Nexora.
