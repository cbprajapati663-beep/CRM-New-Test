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
