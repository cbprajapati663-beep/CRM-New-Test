# Staging Firebase Bootstrap Scaffold

File: `assets/js/staging/firebase-bootstrap.js`

## Purpose
This is an isolated, staging-only initialization helper. It is **not imported by the production page** and does not replace the production Firebase initialization.

## Guardrails implemented
- Requires `window.HAF_STAGING_FIREBASE_CONFIG` to be provided by a staging-only entry point/deployment configuration.
- Refuses to initialize unless `projectId` exactly equals `heritage-crm-staging`.
- Uses a named Firebase app (`haf-staging`) rather than the default app, avoiding accidental reuse of the production default app.
- Reuses an existing named app only after verifying its project ID.
- Verifies the project ID again after initialization.
- Exposes staging services through `window.HAFStagingFirebase.getServices()`.

## Not yet implemented
- No staging HTML entry point or deployment wiring.
- No config values are embedded in this file.
- No authentication UI, account provisioning, tenant membership mapping, Firestore/Storage rules, or data migration.
- No production code is changed.
- No browser/emulator runtime test has been run; this is a scaffold pending staging integration and tests.

## Integration requirements
1. Load Firebase compat SDKs before this file in a staging-only entry point.
2. Inject the staging config into `window.HAF_STAGING_FIREBASE_CONFIG` using staging deployment configuration, never user input or localStorage.
3. Call `window.HAFStagingFirebase.getServices()` only from staging modules.
4. Verify the staging page displays the expected project ID and cannot reach production.
5. Add automated checks for missing config, wrong project ID, repeated initialization, and service access before connecting any user flow.
