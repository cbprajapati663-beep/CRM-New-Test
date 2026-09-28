# Staging Email Auth Smoke-Test Page

File: `pages/staging-auth-smoke.html`

This is an isolated **authentication-only** test page. It loads Firebase compat App/Auth SDKs and the staging bootstrap, and it verifies email/password sign-in and reset-email request against the staging project. It does not load `app.js`, query Firestore, create a CRM tenant session, or read production records.

## Before opening the page
1. In the staging Firebase console, enable Email/Password Authentication and create a dedicated test user.
2. Copy `assets/js/staging/firebase-config.example.js` to `assets/js/staging/firebase-config.js`.
3. Replace the placeholder values using the web-app config from Firebase project `heritage-crm-staging`. The project ID must remain exactly `heritage-crm-staging`.
4. The real `firebase-config.js` is ignored by Git via `.gitignore`; keep it local or inject it through your deployment process. Do not use production Firebase config.
5. Serve the repository over HTTP(S), not by opening the file directly, then open `pages/staging-auth-smoke.html`.

The Firebase web API key is not a server secret, but it must belong to staging. Never put service-account credentials or private keys in browser code.

## What the page does
- Signs in a dedicated test account through Firebase Auth.
- Immediately signs out after successful sign-in.
- Requests a Firebase password-reset email for the entered account.
- Displays status/errors in the page.
- Does not perform tenant mapping, authorization checks, Firestore reads/writes, account creation, or production migration.

## Not yet validated
This page has been committed but not run in a browser or against the Firebase emulator/staging project. Confirm sign-in and reset email manually with a staging-only test user. Email delivery depends on Firebase Auth configuration. This smoke test is not the full CRM authentication migration.
