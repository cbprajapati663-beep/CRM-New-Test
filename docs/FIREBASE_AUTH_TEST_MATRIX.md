# Firebase Authentication Migration — Test Matrix

**Repository:** CRM-New-Test  
**Branch:** security/auth-migration-plan-20260927  
**Status:** Test design only. No production code, Firebase settings, live data, or Rules changed.

## Preconditions

- [ ] Owner confirms login identifier and recovery method.
- [ ] Separate non-production Firebase project is available.
- [ ] Synthetic tenant A and tenant B, with at least one staff user each, are provisioned.
- [ ] Database backup/restore is verified.
- [ ] Expected document ownership fields and every read/write path are inventoried.
- [ ] Test accounts contain no real customer data.

## Authentication and session tests

| ID | Scenario | Expected result |
|---|---|---|
| AUTH-01 | Login with valid tenant credentials | Authenticated session bound to canonical tenant UID/membership |
| AUTH-02 | Invalid tenant credential | Generic denial; no session issued |
| AUTH-03 | Valid staff credential | Session bound to correct tenant and staff UID |
| AUTH-04 | Wrong staff password | Denied; no protected data loaded |
| AUTH-05 | Suspended tenant attempts login/access | Denied by trusted authorization, not only UI |
| AUTH-06 | Inactive/deleted staff attempts login/access | Denied |
| AUTH-07 | Logout then reload protected URL | Protected access denied until re-authentication |
| AUTH-08 | Tamper with localStorage role/tenant fields | No change to server-enforced authorization |
| AUTH-09 | Password reset with correct verified recovery channel | Recovery succeeds; old credential no longer works |
| AUTH-10 | Recovery attempt with wrong/unverified channel | Denied without disclosing account existence |

## Firestore Rules and tenant-isolation tests

| ID | Scenario | Expected result |
|---|---|---|
| RULE-01 | Unauthenticated read of protected collections | Denied |
| RULE-02 | Unauthenticated create/update/delete | Denied |
| RULE-03 | Tenant A reads its own permitted records | Allowed only for documented operations |
| RULE-04 | Tenant A reads tenant B records | Denied |
| RULE-05 | Tenant A creates a record with tenantId B | Denied |
| RULE-06 | Tenant A changes an owned record's tenantId to B | Denied |
| RULE-07 | Staff accesses assigned tenant permitted data | Allowed according to role matrix |
| RULE-08 | Staff accesses another tenant's records | Denied |
| RULE-09 | Client changes role, tenant assignment, account status, or permissions | Denied |
| RULE-10 | Tenant/staff attempts admin-only operation | Denied |
| RULE-11 | Unknown collection/path is accessed | Denied by default |
| RULE-12 | Suspended/inactive identity attempts reads and writes | Denied |

## CRM regression tests

- [ ] Tenant login and portal landing page
- [ ] Staff login, role permissions, branch restrictions
- [ ] Lead list, create, view, edit, delete, and tenant scoping
- [ ] Tenant profile and subscription/plan display
- [ ] Document upload/download and access scoping
- [ ] Reports, exports, and print flows
- [ ] Dealer, payout, and ledger flows with appropriate role gates
- [ ] Password change/reset, logout, session expiry, and refresh
- [ ] Admin tenant/staff provisioning and revocation through trusted operations

## Evidence required before production rollout

- Emulator/test-project results for every test ID above, including denied cross-tenant operations.
- Regression results for all CRM workflows touched by migration.
- Backup restore evidence and rollback steps.
- Review of deployed Rules and server-side privileged endpoints.
- Owner sign-off on account recovery and user migration communications.

**Release gate:** Do not publish production Rules or switch the live login flow until all required tests pass and rollback is verified.
