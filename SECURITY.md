# Security Review & Remediation Plan

**Review type:** Static source inspection of `index.html`, `assets/js/app.js`, and `assets/css/styles.css`.  
**Status:** Findings identified; security remediation is incomplete. This is not a production security certification.

## High-priority findings

### 1. Client-side credentials and authorization — Critical
The client code includes default tenant credentials, a browser-side master-admin password fallback, and a payout PIN fallback. Privileged access is gated in client JavaScript. Browser code and storage can be inspected or changed; a UI gate is not a secure authorization boundary.

**Remediation:** Migrate sign-in to Firebase Authentication (or another trusted identity provider), enforce roles and tenant ownership in Firestore Security Rules or a trusted backend, and remove client-side default credentials after the replacement flow is tested. A quick removal may lock out the owner and does not itself create server-side authorization.

### 2. Plaintext passwords and localStorage secrets — Critical
Tenant login compares a password field read from Firestore; password changes write the new password to Firestore. Session data is stored in localStorage, along with the master password and payout PIN.

**Remediation:** Use Firebase Authentication; never store raw passwords in Firestore or localStorage. Keep only minimal, non-sensitive session display data client-side and enforce permissions in trusted rules/backend.

### 3. Firestore rules and tenant isolation — Critical, unverified
The frontend accesses collections such as `tenants` and `leads`. Deployed Firestore Security Rules were not available in this source review. Permissive rules could allow cross-tenant data access regardless of UI restrictions.

**Remediation:** Review deployed rules; deny by default, scope every operation to the authenticated tenant, reserve administrative operations for trusted claims, and test cross-tenant read/write denial with the Firebase Emulator Suite.

### 4. Dynamic HTML rendering — High
The app uses multiple `innerHTML` assignments and a `document.write` call for print output. If untrusted user/customer/dealer values are interpolated into these templates, stored or reflected XSS may be possible.

**Remediation:** Audit every interpolation; use DOM APIs and `textContent` for text, safely handle attribute contexts, and build print output with safe DOM methods. Add tests using HTML/script-like input. Avoid broad substitutions that could change the UI.

### 5. Inline event handlers and styles — Hardening
Inline handlers and styles make a strict Content Security Policy harder to enable.

**Remediation:** Move handlers to event listeners and styles to CSS, then deploy a tested CSP through hosting headers. Do not apply a strict CSP before refactoring because it may break existing functionality.

## Additional controls
- Enable Firebase App Check where supported; it complements but does not replace Security Rules.
- Review export, payout, and DO operations for trusted role enforcement.
- Add dependency checks, linting, static analysis, and regression tests.
- Back up Firestore and prepare a rollback plan before auth/data migration.

## Verification limitations
- Static scan detected credential fallbacks, localStorage secret/session handling, dynamic HTML sinks, and print-time `document.write`.
- Deployed Firestore Rules, Firebase Authentication settings, hosting headers, and live behavior were not verified.
- No end-to-end login, tenant-isolation, XSS, payout, or DO tests were run.

## Safe migration sequence
1. Back up Firestore and confirm owner recovery.
2. Configure Firebase Authentication and migrate identities without exposing existing plaintext passwords.
3. Create restrictive Firestore Rules and emulator tests, including cross-tenant denial.
4. Update frontend login/session handling; remove old fallbacks only after the new flow passes tests.
5. Replace unsafe HTML rendering paths and add regression tests.
6. Deploy with rollback; add CSP and security headers after compatibility validation.
