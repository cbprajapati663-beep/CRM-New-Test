# Authorization Matrix — Draft for Staging Design

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Design draft only. Not a deployable Firestore Rules file.

## Principal types

| Principal | Identity source target | Trust boundary |
|---|---|---|
| SaaS owner / superadmin | Firebase Auth UID plus trusted server-managed admin grant | Privileged provisioning and cross-tenant actions must be trusted-server-only or tightly verified. |
| Tenant owner/user | Firebase Auth UID mapped to canonical tenant membership | May access only its tenant's explicitly permitted records. |
| Tenant staff | Firebase Auth UID mapped to tenant, active state, role, and branch/permission assignment | Must be limited to assigned tenant and authorized records/actions; deleted or inactive staff denied. |
| Unauthenticated visitor | No verified identity | Deny protected CRM data by default. |
| Trusted backend | Service identity / server environment | Use least-privilege IAM; never expose service credentials to browser code. |

## Resource/action matrix (initial, pending schema and product confirmation)

Legend: **Deny** = default safe posture; **Needs decision** = do not grant until exact behavior/schema is confirmed; **Trusted only** = perform via controlled backend/admin workflow.

| Resource | Unauthenticated | Tenant user | Tenant staff | Superadmin |
|---|---|---|---|---|
| `leads` | Deny | Own-tenant records only; exact CRUD by role needs decision | Own-tenant and branch/role-limited; exact CRUD needs decision | Cross-tenant operations should be trusted-only or explicitly reviewed |
| `tenants` | Deny | Own profile, narrowly allowlisted fields only; sensitive fields denied | Minimal own tenant metadata only if required | Provision/update through trusted admin flow |
| `staffAccounts` | Deny | No direct credential or account-admin access | Own minimal profile only, if needed | Provision, disable, delete via trusted admin flow |
| `tenants/{tenant}/staff` | Deny | No direct access unless specific workflow requires it | Own profile/assignment only, if required | Trusted provisioning and management |
| `payoutSecurity` | Deny | Deny direct access by default | Deny direct access by default | Trusted-only until payout workflows and threat model are reviewed |
| `activity` | Deny | Read own-tenant permitted events only if confirmed | Read own-tenant permitted events only if confirmed | Audit review through controlled access; clients must not rewrite/delete audit history |
| `branches` | Deny | Own-tenant branch read; mutations need decision | Assigned-branch scope; mutations need decision | Branch administration through trusted flow |

## Invariants required for implementation

1. Authentication UID must be verified by Firebase Auth; localStorage values are never identity proof.
2. Tenant membership, role, active status, and branch scope must come from a trusted, client-unmodifiable source.
3. Every tenant-owned document must have a canonical tenant ownership field or a trusted path-based ownership relationship.
4. Client writes must not change tenant ownership, UID mapping, role, permissions, account status, payout security fields, or audit integrity fields.
5. Unspecified collections and paths remain denied.
6. A disabled/deleted staff member and suspended tenant must be denied by enforced authorization, not only hidden UI.
7. Admin-assisted recovery must never reveal or store a user's password or reset token.
8. Use synthetic Tenant A and Tenant B records to prove cross-tenant reads and writes fail.

## Decisions required before rules can be authored

- Confirm field-level schema and ownership field for each resource.
- Confirm exact tenant/staff operations and role/branch permission mapping for every screen and API call.
- Determine whether all privileged writes can be moved to trusted backend functions.
- Confirm audit/event retention and immutability requirements.
- Define account suspension/revocation propagation and session invalidation.
- Build emulator tests and demonstrate allowed and denied cases against staging.

## Safety status

No application code, production Firebase configuration, live data, or deployed Rules were changed. This draft must not be copied directly into Firebase Console as a production Ruleset.
