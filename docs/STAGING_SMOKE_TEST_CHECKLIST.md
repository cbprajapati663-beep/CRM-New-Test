# Staging Firebase Smoke-Test Checklist

Project: `heritage-crm-staging`  
Environment: staging only  
Status: staging project, Web App, Email/Password provider, and Firestore setup confirmed from user-provided Console screenshots. Application migration and security tests are not yet done.

## Verified setup

- [x] Firebase project `heritage-crm-staging` exists.
- [x] A Web App is registered in that staging project.
- [x] Authentication → Sign-in method → Email/Password is enabled.
- [x] Cloud Firestore database was created in Production mode.
- [ ] Confirm the final Firestore Rules tab shows the expected deny-by-default rules before any app access is attempted.
- [ ] Record the approved staging app URL and exact branch/commit under test.
- [ ] Verify no production customer data or credentials are present in staging.

## Important code wiring blocker

The current CRM entry points still initialize Firebase with the production project `heritage-crm-f179a`. Do not deploy or test the existing CRM against staging until a deliberate environment-specific config path is implemented and reviewed. Do not replace production config with staging config globally, and do not copy customer data into staging.

## Guardrails

- Use only synthetic test identities and synthetic records. Do not copy production customer, staff, tenant, or payout data into staging.
- Do not paste Firebase config objects, API keys, passwords, email verification links, ID tokens, refresh tokens, or service-account keys into issues, pull requests, or chat. Firebase web API keys are not server secrets by themselves, but still avoid unnecessary public exposure.
- Keep production rules and configuration untouched while validating staging.
- Keep Firestore in Production mode with explicit least-privilege rules. Never switch to open/test rules.
- Enabling Email/Password alone does not migrate the CRM login flow.

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