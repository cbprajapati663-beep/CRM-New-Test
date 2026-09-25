# Standalone Login — Manual Validation Plan

## Scope
Validate the transitional client login at `pages/login.html` without removing or changing the legacy login in `index.html`.

## Before testing
- Use a test tenant, not a production customer's credentials.
- Confirm the test tenant exists in Firestore `tenants`, has a matching normalized `tenantId`, and is active.
- Do not change or delete stored tenant data for this test.

## Test cases
- [ ] Page loads over HTTPS with no JavaScript console errors.
- [ ] Empty username/password are blocked by required-field validation.
- [ ] A valid active tenant login redirects to `../index.html`.
- [ ] The CRM restores the expected tenant identity and shows only that tenant's workspace.
- [ ] Wrong username and wrong password both show the generic invalid-credentials message.
- [ ] Suspended tenant shows the workspace-suspended message and does not create a session.
- [ ] A Firestore/network failure shows a generic service error without exposing internal details.
- [ ] Session storage contains no tenant password in `haf_active_session_user_v2`.
- [ ] Logout clears the session and returns to the expected sign-in state.
- [ ] Legacy login still works exactly as before.
- [ ] Test at mobile and desktop widths.

## Release gate
Do not make the new page the default sign-in or remove legacy login until all applicable cases pass. This checklist is not evidence that tests have already been run.

## Known limitation
The page currently checks a password stored in the tenant document. A separate login page is not an authorization boundary. Firebase Authentication and Firestore Security Rules must be reviewed independently before production security claims.

## Password reset validation (legacy CRM flow)
- [ ] For a tenant, the registered contact phone on that tenant record is accepted after digit-only normalization (spaces, dashes, and country-code formatting are handled consistently).
- [ ] A different tenant's contact phone is rejected for the selected tenant.
- [ ] An incorrect phone number is rejected and the password is not changed.
- [ ] A tenant with a missing or invalid contact phone cannot reset through phone verification.
- [ ] The master-admin reset continues to use its separately configured verification path; tenant phone values must not authorize an admin reset.
- [ ] New password and confirmation must match and satisfy the current password policy (at least 8 characters, including a letter and a digit).
- [ ] After reset, the new password works and the old password fails for that tenant.
- [ ] Passwords are not written into the browser session object/localStorage.
- [ ] A Firestore/network error is handled without reporting a successful reset.

These are manual test cases, not results. The tenant reset implementation checks the selected tenant's contactPhone; confirm this against test tenant records before production use.
