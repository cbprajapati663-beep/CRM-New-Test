# Staging Identity Fixture Provisioning

This is a template only. It contains no real Firebase Auth UIDs and no passwords.

## Provisioning order
1. In the heritage-crm-staging Firebase project, create dedicated Email/Password Auth users for the seven logical principals.
2. Record each resulting Auth UID in a private deployment copy of this fixture.
3. Create memberships/{uid} documents using only a trusted provisioning path.
4. Never expose service-account credentials, temporary passwords, or private provisioning files to the browser.
5. Verify disabled-a is denied before rule testing.
6. Seed only synthetic branches and leads for tenant-a and tenant-b.
7. Run emulator/rules tests before connecting the CRM UI.

The repository deliberately does not create Auth users automatically because that requires privileged credentials and must not be committed or executed from browser code.

## Membership shape
- tenantId
- role
- status
- tenantStatus
- branchIds
- optional plan/feature metadata for later server-side entitlement enforcement

## Production gate
Never populate this template with production UIDs or use it against the production Firebase project.