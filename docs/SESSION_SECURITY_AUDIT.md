# Session and Login Compatibility Audit

## Scope
Read-only review of the current legacy login/session code in `assets/js/app.js` and the standalone client login in `pages/login.html` / `assets/js/login-page.js`.

## Verified observations
- The legacy client login reads a tenant record from Firestore and compares its stored `password` field with the submitted password.
- On successful legacy login, the full tenant object is passed to `setCurrentSessionUser(matched)`; the current source therefore includes the password field in the localStorage session object.
- The standalone login removes `user.password` before writing `haf_active_session_user_v2`.
- The password-change handler fetches the tenant record from Firestore to verify the current password. However, after a successful change it assigns the new password to the session object before persisting it; that path should also be updated to avoid persisting a password.
- Admin authentication currently relies on a client-side password stored in localStorage or a built-in fallback. This is not a server-enforced authorization boundary.
- Login/session behavior has not been tested in a real browser in this audit.

## Safe next implementation
1. Remove password fields from all session objects before writing to localStorage, including login and password-change flows.
2. Keep the existing tenant document schema and existing passwords unchanged during this UI/session cleanup.
3. Confirm no feature depends on `sessionUser.password` before removing it.
4. Validate tenant login, admin login, password change, logout, session restore, and tenant scoping in a browser with test accounts.
5. Review Firebase Authentication and Firestore Security Rules separately; client-side page separation does not enforce access control.

## Explicit non-goals
- This audit does not migrate plaintext Firestore passwords.
- This audit does not change admin credentials or reset flows.
- This audit does not claim production security or successful browser tests.
