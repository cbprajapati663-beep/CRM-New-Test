# Subscription Plan Limit Enforcement — Backend Work Notes

**Status:** Frontend guards are in PR #11. Trusted server-side enforcement is not implemented or verified.

## Required plan caps

| Plan | Active staff | Active branches | Leads |
|---|---:|---:|---:|
| Starter | 3 | 1 | 500 |
| Professional | 10 | 3 | 5,000 |
| Business | 25 | 10 | 25,000 |
| Enterprise / Custom | Tenant-configured | Tenant-configured | Tenant-configured |

Annual prices are intentionally excluded from enforcement; this work concerns resource caps only.

## Current implementation boundary

The CRM currently checks staff and branch counts in browser code and checks the loaded lead list before creating a lead. These checks improve the UI experience but are not an authorization boundary. A modified client or concurrent writes can bypass client-only counts.

Repository inspection did not find a checked-in `firebase.json`, Firestore Rules file, or Cloud Functions backend. Deployed Firebase Rules and live collection policies have not been inspected. Do not deploy guessed rules: restrictive or incompatible rules can break existing login and data flows.

## Backend implementation needed

1. Confirm the staging Firebase project, deployed Rules, current collection paths, tenant identity model, and who is authorized to administer a tenant.
2. Add a trusted server endpoint (for example, callable Cloud Functions) for creating/reactivating staff, branches, and leads. Derive tenant identity from verified authentication/claims—not a client-provided tenant ID.
3. Maintain tenant resource counters or a reliable authoritative count and update the resource plus counter atomically in a transaction. Reject the operation when the configured plan cap is reached. Handle inactive/deleted records consistently and prevent concurrent requests from exceeding caps.
4. Ensure all client write paths cannot bypass the trusted endpoint. Add restrictive Rules after mapping existing reads/writes and testing compatibility.
5. Cover tenant isolation, Starter boundary cases (at cap and over cap), upgrade/downgrade, inactive/reactivation, concurrent creates, custom limits, and failure/rollback in Firebase Emulator Suite or isolated staging.
6. Reconcile existing tenants already over limits. Do not delete or deactivate customer records automatically; report over-limit tenants for an owner-approved resolution.

## Release gate

- No production rules, data, accounts, or deployment changed as part of this PR.
- Do not claim server-side enforcement until staging tests pass and the active rules/functions are verified.
- Keep PR #11 unmerged until CI, functional tests, and backend enforcement are complete.
