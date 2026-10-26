# Security Audit Report — Heritage FinTech Core
**Date:** 2026-10-26  
**Scope:** Static review of the public CRM repository and the current source files available in it. This is not a penetration test or production security certification.

## Executive summary
The CRM should be treated as **not yet secure for sensitive multi-tenant customer data** until the critical items below are addressed. F12/Inspect cannot be reliably disabled on a website; the security boundary must be Firebase Authentication plus server-enforced Firestore/Storage rules or a trusted backend.

## Confirmed findings

### Critical — Tenant login trusts browser code
`assets/js/login-page.js` queries Firestore `tenants`, compares a stored `password` field in the browser, and then creates a localStorage session. A user can inspect or alter browser code and localStorage. Removing the password from the session object is useful but does not authenticate the user.

### Critical — Client-side privileged access fallbacks
The existing `SECURITY.md` review records a hard-coded default tenant credential, a client-side master-admin password fallback, and a payout PIN fallback. Treat these as exposed. Removing them before a tested replacement is ready may lock out the owner and is not a sufficient fix by itself.

### Critical — Firebase Auth SDK is loaded but not used for sign-in
The main page loads the Firebase Auth compat SDK, but static inspection of the main application script found no Firebase Auth sign-in call. The current tenant login still relies on reading tenant documents and comparing a password in browser code. This means the SDK being present does not provide an authentication boundary.

### Critical — Tenant/role authorization is not proven server-side
Lead scoping such as `getLeadScopedList()` happens in the browser. Frontend filters are not a security boundary. Repository review did not find root-level `firestore.rules` or `firebase.json`; the deployed Firestore rules, Storage rules, Firebase Auth settings, and hosting configuration remain unverified.

### High — Potential DOM XSS sinks
The code review recorded multiple dynamic `innerHTML` assignments and a `document.write` print path. Exploitability depends on whether untrusted customer/staff data reaches those sinks. Each interpolation must be traced and safely rendered; broad replacements are risky because they can alter the existing UI.

### Hardening — Public client configuration
Firebase web configuration (including the API key) is expected to be visible in a browser and is not by itself a server secret. Security depends on Authentication, restrictive Firestore/Storage rules, App Check where appropriate, and not embedding privileged credentials in client code.

## Additional staging discovery
- A staging Firebase web configuration file exists at `assets/js/staging/firebase-config.js` and identifies the `heritage-crm-staging` project. This only confirms that a client configuration is committed; it does **not** prove the project is isolated, that its deployed rules are safe, or that test data is present.
- The main HTML loads Firebase Auth compatibility SDK, but the current `assets/js/app.js` does not call Firebase Auth sign-in methods. A migration needs a planned tenant/staff identity mapping and recovery path.

## Verification status
- The static-validation workflow on branch `security/audit-phase1-20261026` passed after correcting the PWA icon check to ignore its cache-busting query string.
- No production authentication, database rules, storage rules, hosting headers, or Firebase Console configuration were changed.
- No live end-to-end tenant isolation or penetration tests were run.
- No live Firebase rule configuration was available in this repository to verify.

## Recommended remediation order
1. Confirm Firestore backup/export and owner recovery access; identify and confirm the staging Firebase project.
2. Export/review deployed Firestore and Storage rules and inventory collections/documents and login flows.
3. Set up Firebase Authentication identities and an owner-controlled admin identity. Plan a safe account migration; do not copy plaintext passwords into Auth or logs.
4. Write deny-by-default Firestore/Storage rules with tenant ownership and role checks; test unauthenticated and cross-tenant reads/writes in Firebase Emulator Suite.
5. Replace client-side password comparison and localStorage identity claims with verified Firebase Auth state and server-enforced permissions.
6. Audit and safely replace untrusted dynamic HTML rendering; add malicious-input regression tests.
7. Test login, password recovery, suspended users, staff roles, tenant isolation, leads, documents, exports, payouts and delivery-order workflows in staging.
8. Only after owner approval and staging pass, schedule production migration with backup and rollback plan. Rotate any exposed/default credentials.

## Release gate
**Do not merge an authentication or database-rules migration into production solely because static checks pass.** Require staging tests and an explicit rollback plan. This report and the small CI test correction do not claim to make the CRM secure.
