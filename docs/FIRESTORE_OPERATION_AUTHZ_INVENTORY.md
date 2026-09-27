# Firestore Operation & Authorization Inventory (Static Draft)

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Source-code review draft. Not a verified runtime trace, complete schema, or deployable security rules.

## Authorization labels

- **Public/unauthenticated:** no private CRM data should be available.
- **Tenant user:** authenticated user bound by trusted mapping to exactly one tenant.
- **Staff:** authenticated staff identity bound to a tenant, active status, role, and branch/feature grants.
- **SaaS administrator:** separately authenticated and strongly protected privileged identity.
- **Trusted service:** server-side function/service using validated identity and explicit authorization.

The current app's localStorage session, client role values, UI feature toggles, client-provided tenant IDs, and browser-side password checks are not trusted authorization evidence.

## Operation inventory

| Data path / operation | Current browser behavior observed | Intended authorization boundary | Required staging tests |
|---|---|---|---|
| `tenants` read/list | Tenant list is loaded from Firestore; login queries tenant by `tenantId` | Tenant user reads only safe profile fields for own tenant; SaaS admin list via trusted privileged path | Anonymous denied; tenant A cannot enumerate/read B; secrets never exposed |
| `tenants` create/update | Default tenant creation, tenant profile/license/plan/status changes are client-side | Trusted provisioning/admin service only | Tenant/staff cannot create tenants or change plan/status/tenant identity |
| `tenants` delete | Browser admin path deletes tenant document | Trusted admin workflow with explicit safeguards; account/data deprovisioning coordinated | Tenant/staff denied; admin workflow verifies target and handles related data |
| Tenant credential reset | Browser reads/writes legacy password field; reset checks phone number client-side | Firebase Auth recovery or admin-assisted trusted recovery; no client-readable password field | No password field exposure; unauthorized reset denied; recovery audit recorded |
| `staffAccounts` lookup | Client queries by `loginId`, reads password hash/salt, checks password in browser | Firebase Auth identity plus trusted UID-to-tenant staff mapping; credentials never read by client | Anonymous and other-tenant reads denied; inactive/deleted staff rejected server-side |
| Staff account create/update/delete | Staff management code uses top-level account and nested tenant staff records | Trusted provisioning service; update/deactivate/revoke identity atomically or with reconciliation | Tenant boundary enforced; unauthorized role/tenant/status edits denied; deleted account cannot sign in |
| `tenants/{id}/staff` read/write | Tenant management reads nested profiles; staff login merges profile | Same-tenant staff profile read; trusted service writes sensitive identity/role fields | Cross-tenant denied; staff cannot promote self or alter tenant binding |
| `tenants/{id}/branches` read/write | Management code reads nested branches; branch operations are tenant scoped in UI | Tenant-bound branch access; branch-level checks for staff; privileged changes validated | Cross-tenant denied; staff outside branch denied; ownership immutable |
| `leads` create/read/update/delete | Client CRUD and filters; lead tenant ownership fields are set by browser | Tenant and staff access enforced using trusted tenant membership and role/branch; trusted service validates ownership | A/B isolation for every CRUD path; spoofed tenantId/createdBy rejected; unauthorized delete denied |
| `leads/{id}/activity` add/read | Client adds notes and event rows; client reads recent timeline | Tenant-scoped reads; append-only trusted audit for security-critical events | Cross-tenant read denied; users cannot forge privileged audit events or delete history |
| `payoutSecurity/{tenantKey}` read/write | Client reads/sets tenant payout hash and salt | Prefer trusted service; tenant user should not access raw secrets; operations audited | Tenant cannot read master or another tenant's record; raw hash/salt not exposed |
| `payoutSecurity/master` read/write | Browser code reads/writes universal master credential record | Trusted service only; replace shared master credential with per-user privileged authentication | All client reads/writes denied; only authorized server workflow succeeds |
| Storage `customer-documents/{tenant}/{lead}/...` | Browser uploads/deletes objects and stores download URL/path in lead metadata | Storage rules verify Auth UID→tenant and lead ownership; sensitive downloads use controlled access | Anonymous denied; cross-tenant path/metadata spoof denied; revoked staff loses access |
| Local browser document store | Some document fallback stores files in browser IndexedDB/local device | Local cache only, not cloud backup or server authorization | UI accurately distinguishes local-only vs cloud; logout/device access implications documented |

## Cross-cutting authorization invariants

1. The server must derive tenant identity from verified Firebase Auth UID and trusted membership data, not from request payload, localStorage, URL, or custom client fields.
2. Users cannot write their own role, tenant assignment, branch assignment, active/deleted/suspended state, subscription limits, or privileged feature grants.
3. Tenant ownership of a lead and its subcollections must be immutable to ordinary clients.
4. Staff permissions must be enforced on every read/write path, not only by hiding buttons or filtering arrays in the UI.
5. Account deactivation/deletion must revoke future authentication and invalidate existing sessions/tokens as applicable.
6. Passwords, password hashes, salts, payout secrets, and privileged recovery factors must not be exposed through client-readable documents.
7. Storage authorization and Firestore authorization must agree on tenant/lead ownership.
8. Administrative and payout operations require auditability, least privilege, and server-side validation.

## Known gaps

- This draft does not enumerate every field, query, batch, transaction, Cloud Function, Storage rule, report/export, or edge case.
- Existing production Rules were previously reported as broadly permissive until the configured expiration; treat the data as potentially exposed during that period.
- Staging project is configured, but CRM code is not yet connected to it and no end-to-end Auth/rules test has been run.
- No production code, records, Firebase settings, or deployed Rules were changed.

## Next validation sequence

1. Complete a full source call-site inventory for Firestore and Storage.
2. Confirm canonical tenant/branch ownership fields from a secure read-only owner review without copying customer PII to source control.
3. Define Auth UID provisioning and admin-assisted recovery workflows.
4. Implement only in staging; use synthetic tenant A/B, staff, branch, lead, and document fixtures.
5. Add Firebase Emulator tests for all invariants above, including negative/cross-tenant tests.
6. Validate CRM regression, backup/restore, and rollback before any production change.
