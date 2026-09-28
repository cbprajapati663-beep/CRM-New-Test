# Supplemental Browser-Side Security Findings

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Static source review only. No runtime verification or deployment.

## Findings from additional call-site review

### 1. Tenant login still authenticates in browser code
- `assets/js/login-page.js` queries `tenants` by `tenantId`, compares the stored `password` field to the entered password in the browser, and stores the resulting tenant profile in `localStorage`.
- Removing the password from the local session object does not protect the password field from the original Firestore read.
- Required design: Firebase Authentication sign-in plus a trusted UID-to-tenant mapping; no password stored in a tenant document. Return only safe tenant profile fields after authentication.

### 2. Browser-persisted admin credential and session state
- The main app reads/writes `haf_master_admin_pass` and stores the active session in `haf_active_session_user_v2`.
- Browser-local password/session values can be modified by the user and must not authorize SaaS-admin actions.
- Required design: privileged admin identity authenticated independently (Firebase Auth with stronger controls), server-validated admin claims/role, and revocable sessions. Remove legacy master-password fallback only after a staged migration and recovery path is verified.

### 3. Lead timeline and DO sequence mutations
- Lead updates include delivery-order sequence/number fields and nested `activity` writes/reads.
- Client-generated identifiers, timestamps, sequence values, and activity contents are not trustworthy for security or audit guarantees.
- Required design: server-side sequence allocation where uniqueness matters; validate tenant/lead ownership on every update; security-sensitive audit events should be written by trusted server code and protected from client edits/deletes.

### 4. Customer document workflow has multiple persistence paths
- Document metadata can be kept in `localStorage`; the code also resolves Storage download URLs and performs a Firestore transaction to update lead metadata.
- A document shown in a local checklist is not necessarily uploaded to cloud Storage. Download URLs or object paths in lead metadata must not grant access by themselves.
- Required design: clearly label local-only vs cloud-uploaded items; enforce Storage rules against authenticated tenant and lead ownership; use controlled downloads for sensitive files; ensure delete/update operations validate ownership and clean up metadata and objects consistently.

### 5. Staff and branch administration has multi-document writes
- Staff provisioning updates nested tenant staff profiles and top-level `staffAccounts`; status changes and branch operations update tenant subcollections.
- Partial failure can leave identity/profile records inconsistent unless a trusted workflow reconciles them.
- Required design: server-side provisioning/deactivation with idempotency and reconciliation; verify staff UID, tenant binding, role, branch and active status on every request. Deleted/deactivated staff must lose access even if stale browser state remains.

### 6. Realtime listeners are not authorization
- Tenant and lead data are loaded through Firestore listeners in the browser. UI filters and current tenant selections do not provide isolation.
- Required design: enforce authorization in Firestore rules or trusted server endpoints for each query/document; test cross-tenant attempts and permission changes while a session is active.

## Staging acceptance tests to add

- Tenant login attempt with wrong password, suspended tenant, unknown tenant, and tenant whose Auth UID is mapped to another tenant.
- Direct client attempts to read tenant password fields, staff password hashes/salts, payout secrets, and admin credentials must be denied.
- Modify localStorage session, tenant ID, role, branch, and permission values; server-side access must remain unchanged.
- Attempt cross-tenant lead reads/updates/deletes, nested activity reads/writes, and Storage object downloads/deletes.
- Attempt client-side changes to DO sequence/number and privileged activity/audit entries; verify trusted validation.
- Simulate partial staff provisioning/deactivation failure and confirm safe retry/reconciliation.
- Verify local-only document entries are distinguishable from cloud-uploaded objects; test access after staff deactivation and logout.
- Verify realtime listeners stop exposing data after authorization is revoked, and reauthentication is required where appropriate.

## Limits and next step

This is a static, code-informed addendum, not a complete data model or proof of exploitability. Do not deploy rules or change production authentication based on this document alone. Next: connect the staging app through an explicit staging-only configuration, seed synthetic fixtures, then run Auth, Firestore Rules, Storage Rules, and regression tests before considering a production migration.
