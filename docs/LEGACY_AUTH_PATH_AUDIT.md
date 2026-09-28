# Legacy Authentication Path Audit

**Scope:** Static source review of the auth entry points in `assets/js/app.js`, `assets/js/login-page.js`, and the script loading section of `index.html`.

**Status:** Findings documented; no application or Firebase changes made.

## Login routes observed

| Route | Current behavior | Migration concern |
|---|---|---|
| Tenant login in main app | Queries `tenants` by tenantId and compares the stored password in browser code | Replace with Firebase Auth identity and trusted tenant mapping |
| Staff login in main app | Queries `staffAccounts`, checks active/deleted flags, verifies password material in browser code, then reads tenant and staff profile | Replace browser-side credential checks with Auth and server-enforced tenant/role authorization |
| IT Master login | Compares entered password to a localStorage value, with a hard-coded fallback password when absent; creates a local `superadmin` session | Remove local-only admin identity and fallback; establish a trusted administrator identity |
| Alternate login helper | Independently initializes Firebase and performs tenant password comparison | Consolidate/remove to prevent divergent login behavior |
| Default tenant initialization | Contains a default tenant record with a literal password and can create it if absent | Remove credential-bearing bootstrap; use a controlled, audited staging fixture/process |

## Session and authorization notes

- The main app stores the active session object in localStorage. Removing password fields from that object does not establish a trusted authentication session.
- Staff role, branch, and feature access are assembled in client code. UI gating and local session values must not be treated as server authorization.
- The current admin path is independent of Firebase availability and is not backed by Firebase Auth.
- `index.html` loads Firebase compat app, Firestore, Storage, and Auth SDKs, then loads `assets/js/app.js`; the alternate helper must not be allowed to initialize a separate app instance with a different environment.

## Staging implementation requirements

1. Use one shared Firebase app initialization module and one explicit environment configuration.
2. Add a staging-only guard that fails closed if the project ID is not exactly the approved staging project. Do not change production configuration in this workstream.
3. Use Firebase Auth email/password and an explicit, trusted UID-to-tenant/role mapping.
4. Ensure Firestore and Storage rules enforce tenant isolation and staff permissions; do not rely on localStorage or hidden UI.
5. Keep test data synthetic and staging-only.
6. Validate tenant, staff, and admin sign-in, sign-out, recovery, cross-tenant denial, role escalation denial, and document access before discussing cutover.

## Safety boundary

No production data, Auth users, Firestore rules, Storage rules, deployed assets, or live Firebase configuration were changed. No application code was changed by this audit.