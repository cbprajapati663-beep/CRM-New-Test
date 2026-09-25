# Session and Login Compatibility Audit

## Scope
Review of legacy login/session code in `assets/js/app.js` and standalone tenant login in `pages/login.html` / `assets/js/login-page.js`, plus the password-reset implementation.

## Changes already made
- Commit `f45b87a4a076117680cebd875df1cb9e098ebeb1`: session storage now uses a shallow copy with the `password` property removed; password-change flow no longer assigns the new password to the session object before persisting it.
- Commit `c7601fafba71caff8a5e4142af719bf580e25471`: tenant password reset checks the entered phone against the selected tenant record's `contactPhone` after digit normalization. The master-admin reset remains on its separate verification path.
- The standalone login also removes the tenant password before writing the session.

## Remaining security observations
- Tenant passwords are still stored and checked through the client-side Firestore document flow; this is not equivalent to a server-authenticated password system.
- Admin authentication uses a client-side password/localStorage fallback. This is not a server-enforced authorization boundary.
- Hiding a page, button, or route in client code does not secure Firestore data. Authorization must be enforced by Firebase Authentication and Firestore Security Rules.
- The current review has not verified the deployed Firestore Security Rules or completed a live browser regression run.

## Next validation and hardening sequence
1. Review the actual deployed Firestore Security Rules and Firebase Authentication configuration before changing access policy.
2. Use test accounts to verify tenant A cannot read, create, update, or delete tenant B's leads, profile, or other tenant-owned records.
3. Verify suspended tenants cannot access protected data even if they manually load the CRM URL.
4. Verify admin-only operations are rejected for tenant sessions at the data/service layer, not only hidden in the UI.
5. Confirm reset behavior: correct registered phone succeeds; incorrect and other-tenant phones fail; old password stops working; new password works.
6. Confirm login, password change, logout, and session restore never store a password in browser session storage.
7. Record test evidence and any remaining issues before calling the CRM production-secure.

## Explicit non-goals
- This audit does not migrate existing plaintext Firestore passwords.
- This audit does not change admin credentials or implement a new authentication provider.
- This document is a review plan and status record, not proof that browser or rules tests have passed.
