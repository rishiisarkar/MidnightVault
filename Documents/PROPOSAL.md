# Product Proposal — Nexora

**Program:** New Moon to Full: Monthly Moonshots on Midnight
**Project:** Nexora — Private Access & Credential Verification
**Core Idea:** Prove eligibility without revealing identity or the underlying credential.

## Problem

Many applications need to verify that a user is allowed to access something.

This could mean proving that someone is a registered member, has a valid credential, belongs to an approved organization, or has permission to use a protected feature.

Most existing systems require users to reveal more information than necessary. A user may have to expose their wallet, identity, credential details, or membership information just to prove one simple fact:

> “I am eligible to access this.”

Nexora is designed to make that verification private.

## Product

**Nexora** is a reusable private access and credential verification layer built on Midnight.

Instead of revealing the actual credential, a user generates a Zero Knowledge proof that confirms they satisfy the required access conditions.

For example, an application could verify:

> “This user has a valid Developer credential issued by an approved issuer and it has not expired or been revoked.”

The application receives the verification result without needing to see the user's identity or raw credential.

Nexora will support:

* **Credential expiration** — credentials can automatically become invalid after a defined time.
* **Credential revocation** — issuers can revoke compromised or invalid credentials.
* **Multiple credential issuers** — applications can trust credentials from more than one approved issuer.
* **Role-based access** — different credentials can grant different permissions such as Member, Developer, Admin, or Partner.
* **Time-based access** — credentials can grant temporary or scheduled access.
* **Proof reuse protection** — nullifiers prevent the same proof or access authorization from being reused where one-time access is required.

## How Zero Knowledge Is Used

The credential information is treated as private input.

A Compact circuit verifies conditions such as:

* Is the credential issued by a trusted issuer?
* Is it still valid?
* Has it expired?
* Has it been revoked?
* Does it contain the required role or permission?
* Has this authorization already been used?

If all required conditions are satisfied, the user generates a valid proof.

The protected application learns only:

> **Access approved or denied.**

It does not need to learn the user's identity or the full credential used to satisfy the policy.

## What Stays Public vs Private

| Data                               | Visibility                  |
| ---------------------------------- | --------------------------- |
| Trusted issuer information         | Public                      |
| Credential commitments             | Public / committed on-chain |
| Revocation state                   | Public                      |
| Access policy                      | Public                      |
| Used nullifiers                    | Public                      |
| User identity                      | Private                     |
| Raw credential                     | Private                     |
| Credential secret                  | Private                     |
| Unnecessary credential attributes  | Private                     |
| Zero Knowledge verification result | Public                      |

## Nexora SDK

Nexora is intended to become infrastructure that other Midnight developers can reuse instead of rebuilding private access logic for every application.

The MVP will provide a simple **Nexora SDK/API** for developers to:

```ts
const result = await nexora.verifyAccess({
  policy: "developer-access"
});

if (result.verified) {
  unlockProtectedFeature();
}
```

The SDK will handle the Nexora verification flow, including interacting with the credential/access contract and returning the verification result to the integrating application.

This allows another dApp to use Nexora as a private access layer without implementing its own credential verification system from scratch.

## Sample dApp — Nexora Developer Portal

To demonstrate that Nexora works as reusable infrastructure, I will build a small Midnight dApp that integrates the Nexora SDK.

The example will contain a protected **Developer Portal**.

A user must prove:

> “I hold a valid, non-expired Developer credential from an approved issuer.”

The complete flow will be:

**Issuer creates credential → User receives credential → User opens protected dApp → dApp requests Nexora verification → Zero Knowledge proof verifies eligibility → Nexora returns verification result → Protected feature unlocks**

If the credential is expired, revoked, issued by an untrusted issuer, or does not contain the required role, access is rejected.

This sample dApp will demonstrate the full integration rather than showing Nexora only as an isolated proof-of-concept.

## Why Midnight

Nexora needs users to prove facts about private credentials without exposing the credentials themselves.

Midnight provides the privacy model needed for this.

Compact circuits can verify private credential data while only exposing the minimum result required by the application.

Without Zero Knowledge, the application would need to receive and inspect the credential directly.

With Nexora on Midnight, the application can verify:

> **“The access requirements are satisfied.”**

without needing to know:

> **“Who is this person and what exactly is inside their credential?”**

That privacy boundary is the main reason Nexora is being built on Midnight.

## MVP Scope

1. Build Compact contracts for credential issuance and private verification.
2. Add credential expiration and revocation.
3. Support multiple trusted credential issuers.
4. Add role-based and time-based access policies.
5. Implement nullifier-based proof/access reuse protection.
6. Build the Nexora SDK/API for external dApp integration.
7. Build a sample Midnight Developer Portal protected using the Nexora SDK.
8. Deploy and demonstrate the complete flow on Midnight Preprod.
9. Add tests for valid, expired, revoked, incorrect-role, untrusted-issuer, and reused-access cases.
10. Document the privacy model, SDK integration, architecture, and setup.

## Goal

Nexora should not be only a single credential-gated application.

The goal is to create a reusable privacy layer that Midnight developers can integrate whenever their application needs to answer:

> **“Is this user allowed to do this?”**

without first asking:

> **“Who exactly is this user?”**
