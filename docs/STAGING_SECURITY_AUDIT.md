# Staging Security Audit — 2026-09-29

## Scope
Read-only review of the CRM source and the user's Firebase Console screenshots. No Firebase settings, users, rules, production data, billing, or deployments were changed.

## Owner cost constraint
**Use free-tier capabilities only for now. Do not enable or upgrade to any paid Firebase feature without explicit owner approval.**
- Keep the staging project on the Spark/free plan. Do not upgrade to Blaze or enable paid services.
- Do not create billable resources or trigger a paid deployment.
- Prefer local development and Firebase Emulator Suite for backend/rules testing where practical.
- Clearly label client-side checks as convenience only, not secure enforcement.

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

## Free-first next steps (not yet performed)
1. Keep production and staging Firebase projects strictly separated. Introduce an explicit, non-secret staging configuration path and verify the active project before testing.
2. Define the canonical tenant identity and role mapping from verified Firebase Auth UIDs. Do not trust tenant IDs or roles supplied by the browser.
3. Map existing read/write paths and document ownership fields before drafting Rules. Keep deny-by-default until authenticated staging flow and rules tests are ready.
4. Use local Emulator Suite and free-tier tooling for development/tests where possible. Confirm current Firebase plan limits before relying on any service; do not upgrade or enable paid services without explicit approval.
5. Keep plan caps in the UI as a helpful warning only until trusted atomic backend enforcement is available. Do not describe frontend checks as secure enforcement.
6. Test authentication, tenant isolation, permissions, cap boundaries, concurrent creates, and existing CRM workflows in an emulator or isolated free-tier staging setup before considering release.

## Release guardrails
- No production Firebase Rules, data, accounts, credentials, billing settings, or deployment were changed.
- Do not publish permissive Rules or deploy unverified code.
- Keep PR #11 unmerged until backend enforcement and security/regression tests are complete.
- Any step requiring a paid plan, paid backend, billing enablement, or potentially billable resource must be paused and presented for explicit approval first.
