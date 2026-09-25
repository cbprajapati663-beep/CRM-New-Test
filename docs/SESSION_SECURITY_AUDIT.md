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

## Additional code-review findings (read-only, current app.js)
- The app initializes Firestore collections for both `leads` and `tenants`; tenant records are loaded with an unfiltered collection query.
- The lead list is scoped in client-side JavaScript by `getLeadScopedList()`. Client-side filtering improves the displayed view but does not prevent a user from directly querying Firestore if the database rules allow it.
- The lead form updates an existing lead using its document ID. The UI's visible list is not a substitute for server-side ownership validation.
- The app contains a built-in default tenant record with a default password and a client-side admin password fallback. Treat these as high-priority credential risks: verify whether the default tenant already exists, remove any default credential only through a planned and tested credential migration, and replace client-only admin authentication with server-enforced identity before production use. Do not publish or reuse default credentials.
- The code review did not inspect the active Firebase console rules or test Firestore access with separate accounts. Therefore, actual exploitability and current data exposure are not established here.

## Immediate next actions
1. Back up the current Firestore rules and export a safe test dataset before changes.
2. Inspect the deployed rules in Firebase Console and verify that unauthenticated and cross-tenant reads/writes are denied.
3. Plan a controlled migration away from hardcoded/default credentials and client-side-only admin authentication.
4. Add server-enforced tenant ownership checks and test with two separate test tenants before changing production behavior.

## Repository configuration check (2026-09-25)
- Inspected the repository root listing on the default branch. No root-level `firebase.json` or `firestore.rules` appeared in that listing.
- Direct requests for those two root paths did not return file content. This confirms only that those root-level files were not available at the inspected paths; it does not prove that no rules exist elsewhere or that the deployed Firebase project has no rules.
- **No Firestore rules were changed or deployed.** A restrictive ruleset must be designed against the actual authentication/tenant membership model and validated in a test project first; guessing rules now could lock out legitimate users or fail to protect data.
