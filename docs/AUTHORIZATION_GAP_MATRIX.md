# Authorization Gap Matrix (Source Review)

**Reviewed:** 2026-09-29  
**Branch:** `fix/tenant-plan-limits-20260928`  
**Scope:** Static review of `assets/js/app.js` and existing access inventory. This is a risk/gap register, not a production-ready authorization policy.

## Findings and required decisions

| Area | Source-observed behavior | Security gap | Safe next step |
|---|---|---|---|
| Identity | Tenant and staff login flow reads records from Firestore; app session is stored in browser local storage. | Browser session is mutable and does not prove identity. | Replace with Firebase Auth sign-in and derive identity from authenticated UID. |
| Master admin | Admin check compares a password in client-side code/local storage fallback. | Client-side secret can be inspected or bypassed; not a trusted admin boundary. | Remove this login path; define trusted admin membership and recovery before rollout. |
| Tenant membership | Tenant ID/role are read from tenant/account records and session object. | No verified UID-to-tenant membership mapping. | Decide a canonical membership document keyed by authenticated UID and define tenant-switch policy. |
| Staff lookup | Global `staffAccounts` is queried by `loginId`; staff profiles also exist under `tenants/{tenantId}/staff`. | Login ID lookup is not a secure tenant boundary; duplicate IDs and account-to-profile consistency need handling. | Define canonical staff account identity, tenant binding, disable/delete semantics, and migration approach. |
| Leads | Global `leads/{leadId}` documents are used; code filters by fields such as tenant/agency/creator and assignment metadata. | Ownership field is not yet proven mandatory/consistent for every legacy lead. | Audit real schema in isolated staging/emulator; choose one immutable tenant ownership field and migration rules. |
| Branch scope | Branch documents are nested under tenant; leads carry branch and staff assignment fields. | Role-to-branch restrictions are not yet defined as trusted rules. | Specify whether each role is tenant-wide or branch-scoped, including reassignment permissions. |
| Role permissions | Permission matrix is stored on tenant records and interpreted in client UI. | UI visibility checks do not prevent direct Firestore reads/writes. | Define a server/rules-enforceable permission matrix; retain UI checks only as usability controls. |
| Payout security | `payoutSecurity` is a separate top-level collection with master/tenant-derived document IDs. | Sensitive unlock state has no verified least-privilege access policy. | Inventory exact fields/actions, then isolate owner-only controls and test denial for other roles. |
| Tenant lifecycle | Browser code can create/bootstrap a default tenant and update expiry/suspension fields. | Privileged lifecycle writes are performed by client code. | Move privileged lifecycle changes behind an approved trusted workflow; do not run bootstrap against production. |
| Plan limits | Staff/branch/lead caps are checked in the client. | Direct or concurrent writes can bypass caps. | Treat as advisory until a trusted enforcement option compatible with the free-tier constraint is approved. |

## Decisions needed before writing Firestore Rules

1. Canonical Firebase Auth UID membership schema and tenant membership lifecycle.
2. Exact roles and permissions, including tenant owner, admin, manager, sales staff, viewer, and platform admin.
3. Canonical lead ownership field and how legacy records lacking ownership are quarantined or migrated.
4. Branch visibility, assignment, and cross-branch report rules.
5. Payout-security data model and owner-only operations.
6. Trusted handling for tenant creation, expiry, suspension, staff deletion, and plan-cap enforcement.
7. Data retention, backup/restore, and rollback acceptance criteria.

## Current safety gate

- No Firestore Rules were authored or deployed.
- No production or staging records, users, credentials, config, or billing were changed.
- No paid Firebase feature was enabled.
- Do not merge/deploy the security migration or plan-limit PR until trusted identity, tenant isolation, role/branch enforcement, and regression tests are demonstrated.
