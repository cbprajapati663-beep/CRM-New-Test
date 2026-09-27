# Security Remediation Plan — Heritage FinTech Core

**Status:** Audit notes only. This document does not certify the application as secure.

## Confirmed code-level findings (reviewed 2026-09-27)

1. **Tenant password verification is client-side.** The client reads tenant documents from Firestore and compares a stored `password` field with the submitted password. This is not a secure authentication boundary.
2. **A default tenant credential is embedded in client code.** The default tenant initializer includes a literal password. Treat this credential as exposed; do not reuse it.
3. **Master-admin authentication is client-side.** The app reads a browser-local password setting and falls back to a hard-coded default. A client-side check cannot protect an admin console from a determined user.
4. **The browser stores a session object in localStorage.** Removing the password from that object is helpful, but a client-controlled session object is not proof of identity.
5. **Lead scoping is client-side.** `getLeadScopedList()` filters loaded leads in the browser. This must not substitute for server-enforced tenant authorization.
6. **Tenant data migration / access rules remain unverified.** The repository root did not expose `firestore.rules` or `firebase.json` at the time of review. The deployed Firebase security rules have not been inspected.

## Safe remediation sequence

1. Back up the repository and database; confirm a test Firebase project.
2. Inspect and document the current Firestore collections, tenant/staff login flows, and deployed security rules.
3. Implement Firebase Authentication identities for tenant users and staff; migrate accounts without exposing existing passwords. Use a secure, owner-controlled admin identity (not a shared client-side master password).
4. Enforce tenant ownership and role permissions in Firestore Security Rules or trusted server-side endpoints. Deny access by default and test cross-tenant reads/writes.
5. Replace browser-stored identity claims with verified auth state and server-authorized role/tenant claims.
6. Add automated tests for unauthenticated access, cross-tenant reads/writes, suspended users, deleted staff, and role-specific access.
7. Only after staging tests and backup verification, plan production migration and credential rotation.

## Release gate

Do not deploy authentication or rules changes to production until the test project passes login, tenant isolation, staff permission, recovery, and data-integrity tests. This plan intentionally does not change current login behavior or database records.
