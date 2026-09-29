# Staging Security Audit — 2026-09-29

## Scope
Read-only review of the CRM source and the user's Firebase Console screenshots. No Firebase settings, users, rules, production data, or deployments were changed.

## Staging console observations
- Staging project: `heritage-crm-staging`.
- Firestore Rules currently deny all client reads and writes (`allow read, write: if false`).
- Email/Password is enabled, but the Authentication Users page showed no users.
- The Cloud Functions page indicates the project must upgrade from the Spark plan to use Functions. No upgrade was performed.

## Source-code findings
- `assets/js/app.js` initializes Firebase using the production project configuration (`heritage-crm-f179a`), not the staging project. Do not test this app against real customer data until configuration is safely separated.
- The current login/session flow includes browser-side session storage and local fallback authentication logic. This is not a trusted authorization boundary.
- The app contains legacy tenant initialization and credential-handling logic in client code. Passwords or other credentials must not be stored in tenant documents or browser code.
- Client code performs direct Firestore reads and writes for tenant, lead, staff-account, staff, and branch data. A server-trusted tenant/role mapping and matching restrictive Rules are not yet verified.
- PR #11 plan caps are client-side checks. They can be bypassed by direct writes or concurrent requests and are not authoritative enforcement.

## Safe next steps (not yet performed)
1. Keep production and staging Firebase projects strictly separated. Introduce an explicit, non-secret staging configuration path and verify the active project before testing.
2. Define the canonical tenant identity and role mapping from verified Firebase Auth UIDs. Do not trust tenant IDs or roles supplied by the browser.
3. Map all existing read/write paths and document ownership fields before drafting Rules. Keep deny-by-default until an authenticated staging flow and rules tests are ready.
4. Decide whether to enable billing for a trusted backend only after reviewing expected costs and obtaining explicit owner approval. No billing change is implied by this audit.
5. Implement trusted, atomic server-side plan-cap enforcement and close client write bypasses.
6. Test authentication, tenant isolation, permissions, cap boundaries, concurrent creates, and existing CRM workflows in Emulator Suite or isolated staging before considering any production release.

## Release guardrails
- No production Firebase Rules, data, accounts, credentials, or deployment were changed.
- Do not publish permissive Rules or deploy unverified code.
- Keep PR #11 unmerged until backend enforcement and security/regression tests are complete.
