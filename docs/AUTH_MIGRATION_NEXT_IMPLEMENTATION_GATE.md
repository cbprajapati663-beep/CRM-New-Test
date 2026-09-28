# Authentication Migration — Implementation Gate

**Status:** Static review only. No application code, Firebase data, security rules, or deployment changed.

## Confirmed entry-point findings

Reviewed `assets/js/login-page.js`, `assets/js/app.js`, and `index.html` on the auth migration branch.

1. The tenant login helper and main application each initialize Firebase independently with a hard-coded project configuration. They must be consolidated or coordinated before switching environments; otherwise the login and CRM data layer could target different projects.
2. The separate tenant login helper queries the `tenants` collection and compares a stored password in browser code. This is not a secure authentication boundary.
3. The main application includes a default tenant record with a hard-coded password and a browser-local fallback admin password. These are legacy access paths that must be removed or replaced as part of the authentication migration, not carried into staging as working credentials.
4. The current login form is built around tenant ID/password and an IT Admin toggle. The selected product decision is email login with administrator-assisted recovery, so UI and identity mapping need a deliberate transition plan.
5. The HTML loads Firebase compat SDKs and contains the current login overlay. A shared initialization change must account for every entry point and script consumer, not just one JavaScript file.

## Safe implementation sequence

### Gate 1 — staging isolation
- Introduce one explicit environment/config bootstrap and make the staging build fail closed if the staging project ID is absent or unexpected.
- Ensure both the main app and any login helper consume the same initialized Firebase app.
- Add a visible non-production marker to staging; do not permit a staging configuration to be silently used by production.
- Keep production configuration untouched and do not deploy.

### Gate 2 — identity and session
- Implement Firebase email/password sign-in against the staging Authentication tenant.
- Define an explicit mapping from authenticated UID/email to tenant and role, backed by server-enforced authorization. Do not trust role/tenant IDs from localStorage.
- Replace client-side password comparisons, hard-coded default tenant credentials, and local admin-password fallback.
- Implement administrator-assisted recovery with a documented identity-verification and audit process.

### Gate 3 — data and authorization
- Prepare synthetic staging fixtures only; do not copy production customer data into staging.
- Write and test Firestore/Storage rules against the agreed authorization matrix, including tenant isolation and staff permissions.
- Audit every existing read/write path before enabling the new rules.

### Gate 4 — validation and cutover
- Run login, logout, session-expiry, tenant isolation, staff access, password recovery, upload/download, and role-escalation tests in staging.
- Obtain an explicit production migration and rules-deployment approval only after staging tests and a verified backup/restore plan.

## Do not do yet

- Do not change production Firebase config or production rules.
- Do not run data migrations, create production Auth users, or deploy.
- Do not merge this draft into the production branch.
- Do not treat a browser-only tenant/role check as authorization.

## Completion criteria

This gate is cleared only when both entry points share the intended staging Firebase instance, the staging sign-in flow uses Firebase Auth email/password, tenant/role authorization is enforced by backend rules, and the staging test matrix passes.