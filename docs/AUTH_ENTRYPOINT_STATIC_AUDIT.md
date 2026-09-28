# Auth Entry-Point Audit — Staging Migration Notes

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Review type:** Static source inspection only. No runtime or Firebase test was executed.

## Confirmed from current branch

### 1. Firebase is initialized separately in two browser entry points
- `assets/js/app.js` defines a Firebase config and calls `firebase.initializeApp(firebaseConfig)`.
- `assets/js/login-page.js` defines its own copy of the Firebase config and also calls `firebase.initializeApp(firebaseConfig)`.
- Both inspected files currently point to the same production project, `heritage-crm-f179a`.

**Migration consequence:** A safe staging migration must consolidate or centrally control configuration so every entry point uses one environment-specific Firebase app. Updating only one config could split login and application data between projects. Repeated initialization also needs explicit handling (single named app / existing-app guard) rather than blindly calling initializeApp twice.

### 2. Legacy tenant login compares a stored password in Firestore
The inspected `assets/js/login-page.js` queries the `tenants` collection by `tenantId`, compares the submitted password to the stored `user.password` value in browser code, and stores the resulting user object in localStorage after removing the password field.

**Migration consequence:** This is not Firebase Authentication. Do not migrate or retain this as a fallback credential verifier. Existing accounts need a controlled provisioning/reset process and a server-trusted UID-to-tenant mapping.

### 3. Main app still has a separate auth overlay
The inspected `index.html` includes a client/staff login overlay and an IT Admin Master option. The page loads Firebase compat App, Firestore, Storage, and Auth SDKs.

**Migration consequence:** The migration inventory must account for both the dedicated tenant login page and the main app's login/admin flow, not just the tenant login form.

## Required next implementation sequence

1. Establish a single Firebase bootstrap module/config source with explicit `staging` and `production` modes and a fail-closed project-ID assertion.
2. Wire all entry points to that bootstrap; staging mode must reject any production project ID.
3. Implement Firebase Auth email/password sign-in and controlled account provisioning in staging first.
4. Add server-enforced authorization (Firestore/Storage Rules and/or trusted backend checks) based on authenticated UID and tenant membership.
5. Run synthetic tenant A/B isolation tests and core CRM regression tests.
6. Only after backup/restore proof and approval, plan production migration.

## Explicitly not done

- No Firebase config was changed.
- No app login behavior was changed.
- No Firestore/Storage Rules were changed.
- No production or staging users/data were created.
- No tests were run.