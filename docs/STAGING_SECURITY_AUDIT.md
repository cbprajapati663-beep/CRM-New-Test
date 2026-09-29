# Staging Security Audit — 2026-09-29

## Scope
Read-only source review of the CRM branch. No Firebase settings, users, rules, production data, billing, or deployments were changed.

## Owner cost constraint
**Use free-tier capabilities only for now. Do not enable or upgrade to any paid Firebase feature without explicit owner approval.**
- Keep the staging project on the Spark/free plan. Do not upgrade to Blaze or enable paid services.
- Do not create billable resources or trigger a paid deployment.
- Prefer local development and Firebase Emulator Suite for backend/rules testing where practical.
- Clearly label client-side checks as convenience only, not secure enforcement.

## Staging console observations
- Staging project: `heritage-crm-staging`.
- Firestore Rules were previously observed to deny all client reads and writes (`allow read, write: if false`).
- Email/Password was enabled, but the Authentication Users page showed no users.
- The Cloud Functions page indicated the project must upgrade from Spark to use Functions. No upgrade was performed.

## Confirmed source-code findings (branch `fix/tenant-plan-limits-20260928`)
1. **Production Firebase project is hard-coded in `assets/js/app.js`.** The app initializes `heritage-crm-f179a`; it is not currently isolated to staging. Do not use the live app for security tests against real customer data.
2. **Authentication does not use Firebase Authentication.** The inspected login code contains no `signInWithEmailAndPassword` call. Tenant credentials are checked against a Firestore document field, and the source includes a legacy default tenant password. Treat the existing credential flow as compromised for security design; do not copy or reuse any embedded/default credential.
3. **The master-admin password is client-side.** The inspected code falls back to a predictable default password when the browser's local setting is absent. Anyone with access to the client code can inspect or bypass this check. It is not secure admin authentication.
4. **Session identity is browser-controlled.** The current session is stored in local storage; tenant/role values in that object are not a trusted authorization source.
5. **Staff lookup and data model need review.** Staff accounts are queried from a top-level `staffAccounts` collection by login ID, while staff profiles and branches are nested below tenant documents. The source alone does not establish a trusted UID-to-tenant/role mapping or prove tenant isolation.
6. **Client-side plan caps are not security enforcement.** PR #11 can improve UI behavior, but direct writes or concurrent operations can bypass client-only checks.
7. **The code contains a production Firebase web configuration.** Firebase web config is not equivalent to a server secret, but the hard-coded production target creates an environment-isolation risk. Any exposed passwords or credential-like values require separate rotation/remediation; do not publish them in documentation.

## Required remediation order
1. Keep production and staging projects strictly separated; add an explicit environment configuration and a safe project-ID guard before any staging test.
2. Remove the local/default master-admin password flow and tenant-document password authentication. Move authentication to Firebase Auth and use trusted UID-based membership/role records. Do not create or migrate real accounts until the design is approved and staging is verified.
3. Inventory every Firestore collection/subcollection, query, write path, and ownership field. Current known paths include top-level `leads`, `tenants`, `staffAccounts`, and tenant subcollections `staff` and `branches`; this is not yet a complete schema.
4. Define canonical tenant membership, roles, branch scope, and privileged operations before authoring restrictive Rules. Keep deny-by-default until tested.
5. Use Emulator Suite/free-tier tooling where practical. Do not enable paid features or upgrade plans without explicit approval.
6. Test authentication, tenant A/B isolation, role and branch permissions, plan-cap boundaries, concurrent creates, and existing CRM workflows before release.

## Release guardrails
- No production Firebase Rules, data, accounts, credentials, billing settings, or deployment were changed.
- Do not publish permissive Rules or deploy unverified code.
- Keep PR #11 unmerged until backend enforcement and security/regression tests are complete.
- Any step requiring a paid plan, paid backend, billing enablement, or potentially billable resource must be paused and presented for explicit approval first.
