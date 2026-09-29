# Free-Tier Staging Emulator Test Plan

## Goal
Validate tenant isolation and access-control behavior locally without touching production data or enabling paid Firebase services.

## Guardrails
- Use Firebase Local Emulator Suite only for Firestore/Auth tests.
- Do not deploy rules or functions from this branch.
- Do not use the production project ID `heritage-crm-f179`, production credentials, or real customer data.
- Keep Firebase on the Spark/free plan. Cloud Functions and any billing upgrade are out of scope.
- The staging project's current Firestore rules deny all reads and writes; do not weaken them merely to make a smoke test pass.

## Current blockers
1. The repository does not yet contain a reviewed Firestore rules file that represents the intended tenant data model.
2. The app's existing session/role values are not a trusted identity source.
3. Tenant-to-UID mapping and authorized role claims are not finalized.
4. The current staging smoke page checks project configuration/Auth SDK initialization only; it does not prove data isolation.

## Required decisions before writing executable security rules
- Confirm the canonical Firestore paths for tenants, staff, leads, branches, and related documents.
- Confirm how a Firebase Auth UID is mapped to a tenant and role using trusted server-managed data.
- Define which roles may read/create/update/delete each collection.
- Define whether any collection is intentionally shared across tenants and how that access is constrained.

## Emulator test matrix (must pass before any release)
| Scenario | Expected result |
|---|---|
| Unauthenticated read/write | Denied |
| User from tenant A reads tenant A data within assigned role | Allowed only where role permits |
| User from tenant A reads tenant B data | Denied |
| User from tenant A writes tenant B data | Denied |
| User changes a client-side tenant ID or role | No additional access |
| Staff user attempts admin-only operation | Denied |
| Tenant reaches staff/branch/lead cap and attempts another create | Denied by trusted enforcement; client-side checks alone do not count |
| Concurrent creates would exceed a cap | At most the permitted number succeeds |
| Unknown tenant, missing membership, malformed path | Denied |
| Existing permitted update that does not add a record | Allowed only per role policy |

## Local execution outline
1. Install the Firebase CLI and Emulator Suite on a developer machine.
2. Add a reviewed, staging-only rules file and emulator configuration after the data model and authorization matrix are approved.
3. Seed synthetic tenant A and tenant B identities/documents in the emulator only.
4. Run automated emulator tests for each matrix row and preserve the output in CI.
5. Keep deployment commands out of CI. Review any future rules deployment separately and explicitly.

## Release gate
Do not merge or deploy the auth/tenant-security work until the data model, trusted UID-to-tenant mapping, Firestore rules, cross-tenant negative tests, and backup/restore/regression checks are complete. No production changes and no paid Firebase services are authorized by this plan.
