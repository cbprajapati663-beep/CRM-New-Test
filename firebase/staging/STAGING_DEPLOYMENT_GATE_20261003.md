# Staging CRM Deployment Gate — 2026-10-03

## Current state

The staging authorization implementation is code-complete and CI-verified. Production remains untouched, and PR #22 remains unmerged.

Latest validation:
- CRM Validation run #589: successful
- Staging login isolation: passed
- Staging CRM isolation: passed
- Firebase Auth membership bridge: passed
- Firestore authorization emulator: passed
- Storage authorization emulator: passed
- Staging write smoke page and trusted-write adapter checks: passed

Latest security fixes and validation:
- Trusted callable lead creation independently enforces the caller's allowed branch membership.
- Firestore lead updates prevent managers from moving an existing lead into a branch outside their authorized branch set; regression coverage is CI-verified.
- These fixes are now included in the verified staging deployment below.

## Required before real staging sign-in

The repository intentionally does **not** contain real Firebase Auth users, passwords, service-account credentials, or private staging Firebase configuration.

A privileged staging deployment must provision:
1. Firebase Email/Password Auth users in project `heritage-crm-staging`.
2. Their resulting Auth UIDs.
3. Trusted `memberships/{uid}` documents with tenant/role/status/branch authorization.
4. Synthetic tenant/branch/lead data only.
5. Disabled/inactive principal verification.
6. Firestore and Storage rules verification against the deployed staging project.

## Security requirements

- Do not put passwords, service-account keys, Auth UIDs, or private provisioning files into Git.
- Do not provision staging identities from browser JavaScript.
- Do not point staging pages at `heritage-crm-f179a`.
- Do not reuse the legacy browser-persisted CRM session as an authorization mechanism.
- Firestore/Storage rules remain the authorization boundary; UI filtering is not security.
- Do not merge this security branch into production until the deployed staging gate is verified.

## Staging entry points

- `pages/staging-login.html`
- `pages/staging-crm.html`
- `pages/staging-auth-smoke.html`
- `pages/staging-write-smoke.html`

The staging login authenticates through Firebase Auth and resolves authorization context only from the trusted `memberships/{uid}` document.

The staging CRM shell reads only authorized `leads` data. Trusted write operations use callable Functions rather than direct client writes.

## Deployment status

**DEPLOYED AND VERIFIED:** staging deployment run **#13** successfully deployed commit `ad4250c1eccdbf60ca0b4dfb7e6711f59fda0728` to Firebase project `heritage-crm-staging`.

The deployment workflow is branch-guarded and explicitly targets staging only. Production was not part of this deployment.

No deployment credentials or real Auth identities are stored in the repository.

## Next implementation gate

The remaining work is now **deployed staging verification**, not code deployment.

Once real staging Auth users and memberships are provisioned through a trusted administrative path, execute the deployed smoke matrix:

| Principal | Expected result |
|---|---|
| owner-a / tenant-a | Tenant-a data only |
| manager-a / tenant-a | Allowed tenant-a branch data |
| sales-a / tenant-a | Own/assigned tenant-a leads only, and only allowed branches for trusted creates |
| viewer-a / tenant-a | Allowed tenant-a branch reads |
| owner-b / tenant-b | Tenant-b data only |
| sales-b / tenant-b | Own/assigned tenant-b leads only |
| disabled-a | Authentication/CRM access denied |
| Cross-tenant access | Denied |
| Membership self-edit | Denied |
| Unknown Firestore/Storage paths | Denied |

Also verify:
- Logout and Auth-state loss.
- Password reset/recovery.
- Trusted write operations and plan limits.
- Concurrent plan-limit boundary behavior.
- Backup/rollback evidence.

Only after the deployed matrix passes should the full staging CRM be considered ready for production migration work.

Production remains blocked until all gates pass.

CI note: CRM Validation #589 passed for the deployment-trigger commit.
