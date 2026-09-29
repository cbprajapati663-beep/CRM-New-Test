# Staging Firebase Configuration Handoff

Updated: 2026-09-29

## Configuration received
The owner supplied a Firebase Web App config for the staging project. The non-secret project identifiers confirm:

- Firebase project ID: `heritage-crm-staging`
- Auth domain: `heritage-crm-staging.firebaseapp.com`
- Storage bucket: `heritage-crm-staging.firebasestorage.app`

The full client config was intentionally not copied into this documentation. Firebase Web API keys are client identifiers, not server secrets, but should still be restricted to the intended APIs and app domains where appropriate.

## Current app behavior
- `assets/js/app.js` currently contains the production Firebase config and initializes Firebase immediately.
- `index.html` loads `assets/js/app.js` directly.
- The current app includes automatic default-tenant creation/migration logic and legacy client-side login behavior. A staging-only config switch by itself would not make this safe for real-user testing.
- Staging Firestore currently denies all reads and writes, based on the Firebase Console screenshot.

## Safe next implementation steps
1. Keep the current production entry point unchanged.
2. Create a separate staging entry point/configuration that explicitly selects only `heritage-crm-staging`, with a visible staging banner and a hard guard that rejects the production project ID.
3. Ensure staging testing uses synthetic data only and cannot migrate or write production data.
4. Before allowing CRM writes, replace insecure legacy login assumptions with verified Firebase Authentication and tenant mapping; draft/test restrictive Rules against the actual collection schema.
5. Run free local static/unit tests and emulator tests where available. Do not enable paid services or upgrade billing.
6. Do not publish staging Rules or deploy the staging app until the above safeguards are implemented and verified.

## Cost and production guardrails
- No Firebase billing, project settings, Authentication users, Firestore Rules, Storage settings, or deployments were changed.
- No production data was accessed or modified by this handoff.
- Do not enable paid features or upgrade from Spark without explicit owner approval.
