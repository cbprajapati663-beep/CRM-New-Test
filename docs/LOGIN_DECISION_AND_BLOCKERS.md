# Login Decision and Migration Gate

## Confirmed choices

- Login method: Firebase Authentication email + password.
- Account recovery: Admin-assisted recovery (not self-service email reset).
- Staging: No separate staging Firebase project is currently available.
- Repository: `cbprajapati663-beep/CRM-New-Test`.
- Work branch: `security/auth-migration-plan-20260927`.

## Security requirements

1. Firebase Authentication must establish the signed-in identity. Client-side password comparisons and localStorage-only authentication are not acceptable.
2. Every admin and staff member must have a unique, verified email identity mapped to the existing tenant/staff record.
3. Tenant membership, role, and feature permissions must be enforced by trusted backend logic and Firestore Security Rules, not only by UI checks.
4. Admin-assisted recovery must use a trusted, auditable process. An admin must never be able to read or set a user's raw password, and password reset actions must use a secure identity-provider flow with appropriate authorization and audit logging.
5. Migration must preserve tenant isolation and existing customer, lead, staff, branch, and document data.
6. Do not publish permissive Firestore rules or disable existing login as a shortcut.

## Gate before application-code or production changes

A separate staging Firebase project is not available. Therefore, do not deploy authentication changes or replace production Firestore rules yet.

Before implementation/testing:
- Create or identify a staging Firebase project and confirm its project ID.
- Confirm how each existing admin, tenant, and staff account will receive and verify a unique email address.
- Define who is authorized to request admin-assisted recovery and how recovery requests are audited.
- Prepare a migration and rollback plan, including account mapping and tenant-isolation checks.
- Test sign-in, sign-out, expired sessions, disabled/deleted staff, role/feature permissions, tenant boundaries, and recovery in staging.

## Current status

This is a decision and safety-gate record only. No application code, Firebase Authentication settings, production Firestore rules, or live customer data have been changed.
