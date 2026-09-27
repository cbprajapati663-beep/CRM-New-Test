# Firebase Authentication Migration — Readiness Inventory

**Review date:** 2026-09-27  
**Branch:** security/auth-migration-plan-20260927  
**Scope:** Read-only review, owner-confirmed staging setup, and readiness tracking. No application code, production Firebase configuration, database records, or deployed Rules changed.

## Confirmed application behavior

### Firebase project and client
- The web app initializes Firebase project `heritage-crm-f179a`.
- Firebase client configuration is embedded in the browser bundle. A Firebase web API key is a project identifier, not a substitute for access control; security must come from Authentication, Rules, and trusted server authorization.
- The repository uses Firestore collections `leads`, `tenants`, and `staffAccounts`. Tenant staff profiles are also read from a nested `tenants/{tenantDoc}/staff/{staffId}` path.

### Tenant login
- The standalone login in `assets/js/login-page.js` queries the `tenants` collection by tenant ID and compares the submitted password in browser JavaScript.
- On success it writes a user object to localStorage and navigates to the main app.
- This flow requires direct client access to tenant records and cannot safely coexist with default-deny rules without a migration.

### Staff login
- The main app looks up `staffAccounts` by login ID, verifies the password hash in browser code, reads the associated tenant record, and optionally reads a nested staff profile.
- Staff feature access and role permissions are copied into a browser-side session. These UI values are not trusted authorization proof.

### Admin and default account risks
- The repository contains browser-side admin password fallback logic and a built-in default tenant initialization path.
- These credentials are intentionally not reproduced in this report. Treat them as exposed; remove/rotate only through a controlled and tested migration.
- A client-side admin session cannot be used to authorize privileged Firestore access.

### Data access and sessions
- The app stores its session in localStorage. Removing the password from that object is useful hygiene but does not authenticate the user or prevent tampering.
- Lead scoping and feature visibility are performed in browser code. They do not prevent direct Firestore queries.
- Tenant and staff records currently contain fields used for login/authorization; exact schema and every write path still need a controlled inventory before rules can be finalized.

## Why production Rules cannot be safely written yet

A correct ruleset needs a trusted mapping from Firebase Auth UID to a canonical tenant, role, and active state. The current browser-only login does not provide that mapping. Simply enabling Email/Password or adding `request.auth != null` would not solve tenant isolation and could lock out legitimate users while leaving authorization gaps.

## Required owner decisions and prerequisites

1. **Sign-in identifier:** choose verified email/password, verified phone, or username plus a trusted backend that issues Firebase custom tokens. Existing username-style IDs must not be converted by guessing.
2. **Account recovery:** confirm each tenant/staff account has a verified recovery channel and define recovery for accounts without one.
3. **Admin model:** decide the separately protected superadmin identity and who can provision/revoke admin access.
4. **Migration environment:** staging project `heritage-crm-staging` is now confirmed; secure backup/restore procedure and synthetic test data remain to be prepared.
5. **Data model:** inventory the exact tenant ownership field on every protected collection/document and all client read/write paths.
6. **Legacy credentials:** plan credential rotation and safe removal of existing password/hash fields without logging or exporting secrets.

## Next implementation slice (non-production)

1. Keep the current security branch isolated from production. Add a deliberate staging-only Firebase config path; do not replace the production project config globally.
2. Build the Firebase Auth adapter for email/password and define admin-assisted account recovery with a trusted provisioning process.
3. Add trusted account mapping from Firebase Auth UID to tenant/staff identity; never trust client-supplied role or tenant IDs.
4. Inventory schemas and every client read/write path, then draft least-privilege Firestore Rules.
5. Write Emulator Suite tests for unauthenticated denial, tenant A/B isolation, staff permissions, suspended/deleted accounts, and protected admin operations.
6. Run UI regression tests for tenant login, staff login, admin access, recovery, lead create/edit, documents, reports, exports, and logout/session restoration.

## Current status

- Repository inspection: **completed for the login/session paths listed above**.
- Production code migration: **not started**.
- Rules draft: **blocked pending identity model and schema inventory**.
- Staging: **project created; Email/Password enabled; web app registered; Firestore created in Production mode**. Staging config is not wired into the app, and test data/backup are not yet verified.
- Owner decisions: **email sign-in**, **admin-assisted recovery**, and **no extra staging project** (the dedicated `heritage-crm-staging` project is the staging environment).
- Firebase production settings and database: **not changed**.
- Runtime/Emulator tests: **not run**.
