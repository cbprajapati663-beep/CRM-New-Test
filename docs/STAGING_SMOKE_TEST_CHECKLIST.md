# Staging Firebase Smoke-Test Checklist

Project: `heritage-crm-staging`  
Environment: staging only  
Status: checklist prepared; execution is pending application wiring and test identities.

## Guardrails

- Use only synthetic test identities and synthetic records. Do not copy production customer, staff, tenant, or payout data into staging.
- Do not paste Firebase configuration secrets, passwords, email verification links, ID tokens, refresh tokens, or service-account keys into issues, pull requests, or chat.
- Keep production rules and configuration untouched while validating staging.
- Firestore was created in Production mode. Keep its default-deny rules until the application’s authenticated access design is ready and tested. Do not switch to open/test rules.
- Email/Password provider is enabled in the staging Authentication settings. Enabling the provider alone does not migrate the CRM login flow.

## Preflight

- [ ] Confirm Firebase Console project selector says `heritage-crm-staging`.
- [ ] Confirm the registered Web App belongs to that project.
- [ ] Confirm Authentication → Sign-in method → Email/Password is enabled.
- [ ] Confirm Firestore is available and rules deny unauthenticated reads/writes by default.
- [ ] Record the approved staging app URL and the exact branch/commit under test.
- [ ] Verify no production customer data or credentials are present in staging.

## Authentication checks (after app wiring)

- [ ] Create a dedicated synthetic test user through the approved admin process.
- [ ] Valid email/password signs in and creates an authenticated Firebase session.
- [ ] Invalid password and unknown email fail with safe, user-friendly messages.
- [ ] Sign-out clears the Firebase session and protected pages return to login.
- [ ] A disabled/deleted test user cannot sign in again.
- [ ] Admin-assisted recovery is performed only by an authorized admin; temporary credentials are not logged or shared insecurely.
- [ ] Existing client-side/localStorage session data alone cannot grant access.

## Authorization and tenant isolation (after rules/backend implementation)

- [ ] Unauthenticated users cannot read or write protected collections.
- [ ] Tenant A cannot read or modify Tenant B’s records by changing IDs or requests.
- [ ] Staff can access only records and actions granted by server-enforced permissions.
- [ ] A staff account marked deleted/disabled is denied access on the next authenticated request.
- [ ] Admin-only operations reject tenant/staff users even if the UI is bypassed.
- [ ] Leads, staffAccounts, tenants, and payoutSecurity have explicit, least-privilege access policies.

## Evidence and completion criteria

For each check, record pass/fail, timestamp, test identity label (not its password), app build/commit, and sanitized error details. Do not attach tokens or personal data.

This checklist is complete only after the app is wired to the staging Firebase project, the applicable rules/backend are implemented, and the checks above have been executed and reviewed. No production migration is authorized by completing this checklist.