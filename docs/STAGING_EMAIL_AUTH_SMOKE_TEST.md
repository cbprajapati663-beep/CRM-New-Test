# Staging Email Auth Smoke-Test Page

File: `pages/staging-auth-smoke.html`

This is an isolated **authentication-only** test page. It loads Firebase compat App/Auth SDKs and the staging bootstrap, and it verifies email/password sign-in and reset-email request against the staging project. It does not load `app.js`, query Firestore, create a CRM tenant session, or read production records.

## Before opening the page
1. In the staging Firebase console, enable Email/Password Authentication and create a dedicated test user.
2. Supply the staging web-app config through a deployment/local-only script at `assets/js/staging/firebase-config.js`. That script must set `window.HAF_STAGING_FIREBASE_CONFIG` to the web config for project ID `heritage-crm-staging`.
3. Do not use production Firebase configuration. The bootstrap checks the project ID and refuses any other project.
4. Serve the repository over HTTP(S), not by opening the file directly. Keep the config file out of source control if you prefer not to commit it.

Example local-only config file (replace values with the staging app's own values):
```js
window.HAF_STAGING_FIREBASE_CONFIG = {
  apiKey: "STAGING_WEB_API_KEY",
  authDomain: "heritage-crm-staging.firebaseapp.com",
  projectId: "heritage-crm-staging",
  storageBucket: "STAGING_BUCKET_FROM_FIREBASE_CONSOLE",
  messagingSenderId: "STAGING_SENDER_ID",
  appId: "STAGING_WEB_APP_ID"
};
```

The Firebase web API key is not a server secret, but it must belong to staging. Never put service-account credentials or private keys in browser code.

## What the page does
- Signs in a dedicated test account through Firebase Auth.
- Immediately signs out after successful sign-in.
- Requests a Firebase password-reset email for the entered account.
- Displays status/errors in the page.
- Does not perform tenant mapping, authorization checks, Firestore reads/writes, account creation, or production migration.

## Not yet validated
This page has been committed but not run in a browser or against the Firebase emulator/staging project. Confirm sign-in and reset email manually with a staging-only test user. Email delivery depends on Firebase Auth configuration. This smoke test is not the full CRM authentication migration.
