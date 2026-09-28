# Password Change and Recovery Audit

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Scope:** Static review of password-change, forgot-password, and legacy admin recovery paths in `assets/js/app.js` and the alternate `assets/js/login-page.js`. No application behavior or Firebase data was changed.

## Findings

### 1. Tenant password change and reset still use plaintext credentials
- Tenant sign-in compares the submitted password directly with the tenant document's `password` field.
- Change-password reads the tenant document and compares the old password in the browser, then writes the new password back to `password`.
- Forgot-password accepts a tenant ID plus a phone number matching the phone stored on the same tenant record, then writes the new password directly.
- This is not Firebase Authentication recovery; the client is entrusted with reading and updating credential fields.

### 2. Staff password change uses a different credential format
- Staff change-password fetches the `staffAccounts` record, verifies the current password with the existing hash verifier, and writes a new hash and salt.
- Staff login also verifies the password in browser code.
- Any migration must preserve a controlled path for legacy staff accounts and ensure account deletion/inactivation invalidates access server-side, not only in UI code.

### 3. Admin master password is browser-local and has a fallback
- The master password is read from localStorage, with a built-in fallback when no value exists.
- Admin change-password writes the replacement to localStorage.
- Admin forgot-password uses a hard-coded phone-number check in frontend code and then writes the replacement to localStorage.
- The admin session is created locally, without Firebase Authentication. This is not a secure server-verified admin identity or recovery process.

### 4. Two client login entry points exist
- The main app login handler and the separate `assets/js/login-page.js` both query tenant documents and compare plaintext passwords.
- The separate page writes the session to localStorage and redirects to the main app.
- A migration must remove or redirect the alternate entry point; otherwise it can remain a legacy bypass around the new sign-in flow.

### 5. Session and authorization remain client-controlled
- Session identity is stored in localStorage and used by frontend permission/UI logic.
- Client-side role checks and hidden controls cannot enforce access to customer data. Firestore rules and/or trusted server-side authorization must independently enforce tenant and role boundaries.

## Migration requirements

1. Use Firebase Authentication email/password for the chosen email-based login, with account-to-tenant/staff mapping in a trusted, rules-enforced structure.
2. Replace phone-number-only password reset with an authenticated admin-assisted recovery workflow. Recovery must not rely on a secret embedded in browser JavaScript.
3. Replace the local master admin login with a separately authenticated, privileged identity and explicit authorization checks.
4. Remove plaintext tenant passwords and the default tenant bootstrap credential only after a verified migration plan, backup, and tested rollback path.
5. Consolidate the login entry points so all users follow the same authentication flow.
6. Add server-enforced Firestore/Storage authorization before relying on the new identity system; do not treat localStorage role/session values as proof of identity.
7. In staging, test tenant, staff, admin, disabled/deleted account, reset, session expiry, cross-tenant access denial, and rollback before any production rollout.

## Status

- **Static audit:** completed for the paths above.
- **Code implementation:** not started.
- **Staging authentication wiring and test run:** not completed.
- **Production data, Firebase rules, and live login:** unchanged by this audit.
