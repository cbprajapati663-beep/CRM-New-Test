# Staging Authentication Implementation Gate — 2026-10-03

## Current baseline

The CRM still has a legacy browser-authentication path in `assets/js/app.js`:
- tenant login queries Firestore and compares a stored password in the browser;
- staff login queries `staffAccounts` and verifies credentials in the browser;
- the browser session is stored in localStorage;
- role, tenant and feature checks are therefore not an authorization boundary.

The staging branch already contains an isolated Firebase Auth smoke-test bootstrap for `heritage-crm-staging`.

## Implementation sequence

### Gate A — Identity mapping
Create synthetic staging accounts only. Each account must have:
- Firebase Auth UID
- verified email
- immutable tenant membership
- role
- active/deleted status
- branch assignment where applicable

No password or password hash may be stored in a client-readable CRM document.

### Gate B — Authorization source
Use a trusted UID-to-membership record as the authorization source. Client payload values such as `tenantId`, `role`, `branchId`, `createdBy`, and feature grants must never establish authority.

### Gate C — Firestore rules
Implement default-deny staging rules only after the exact ownership paths are confirmed. Required negative tests:
- anonymous access denied;
- tenant A cannot read/write tenant B;
- staff cannot change tenant/role/branch/status;
- inactive/deleted staff denied;
- suspended tenant denied;
- lead ownership cannot be reassigned by ordinary clients;
- sensitive credential/payout documents denied to clients;
- unspecified paths denied.

### Gate D — Storage
Customer-document paths must enforce the same Auth UID → tenant → lead relationship. Client-supplied object metadata is not authorization evidence.

### Gate E — CRM integration
Replace the legacy tenant/staff password comparison with Firebase Auth email/password. Preserve the existing CRM UI where practical, but derive the session from Firebase Auth and trusted membership data.

### Gate F — Staging validation
Use synthetic Tenant A and Tenant B fixtures. Verify login, logout, session expiry, disabled/deleted accounts, role/branch boundaries, cross-tenant denial, document access, and password recovery.

## Production gate

No production Firebase configuration, production Authentication settings, production Firestore rules, or customer data should be changed until Gates A–F pass and backup/rollback evidence is recorded.

## Related existing work

- PR #5: staged Firebase Authentication migration plan.
- PR #11: client-side subscription limits; explicitly blocked from merge until backend authorization is complete.
- PR #20: plan-wise UI entitlement corrections; UI gating is not server-side security.
