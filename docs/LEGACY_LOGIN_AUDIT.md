# Legacy Login Audit — CRM-New-Test

Audit date: 2026-10-17
Branch: `fix/restore-crm-data-login-20261017`

## Code findings

1. Tenant sign-in queries the `tenants` Firestore collection and compares `matched.password` with the password entered in the browser (`handleUserLogin`). This is not Firebase Authentication.
2. Staff sign-in queries `staffAccounts` and calls `verifyStaffPassword`, then loads the parent tenant and optional nested staff profile.
3. The admin/master sign-in path checks a local `getAdminPassword()` value and creates a `superadmin` session in the browser. It is not a server-verified Firebase Auth identity. This path must be audited and migrated before claiming the admin console is secure.
4. Tenant and staff login both require Firestore reads before a session is created. Therefore, changing Firestore Rules to require `request.auth != null` before implementing Firebase Auth will lock out the current login flow.
5. A UI session/role object is not an authorization boundary. Firestore Rules must independently enforce identity, tenant scope, and role permissions.

## Safe implementation order

- [ ] Inventory all login modes and account types, including owner/superadmin, tenant, and staff.
- [ ] Decide a controlled migration/provisioning method for each active account; do not export or copy stored passwords into source control.
- [ ] Implement Firebase Auth sign-in and a trusted UID-to-tenant/role mapping in staging.
- [ ] Replace the local browser-only superadmin check with a server-verified privileged identity.
- [ ] Write and test collection-specific rules for tenants, staffAccounts, leads, payoutSecurity, nested staff profiles, and Storage as applicable.
- [ ] Add automated rules tests for unauthenticated access, cross-tenant access, and role boundaries.
- [ ] Test existing account migration, password reset, logout, and rollback in staging.
- [ ] Coordinate client deployment and rules deployment only after the staging matrix passes.

## Do not do

- Do not make production rules public or extend test-rule expiry as the final fix.
- Do not deploy a generic authenticated-only rule set before the client signs in with Firebase Auth.
- Do not trust client-provided tenant IDs, roles, or feature-access lists as proof of authorization.
- Do not change production rules until a backup, tested ruleset, and rollback plan exist.

## Scope and status

This is a source-code audit note, not a migration implementation. No Firebase Console rules, users, or production data were changed by this audit. Existing successful dummy-lead persistence only confirms that the currently published rules permit that write/read path; it does not establish tenant isolation.