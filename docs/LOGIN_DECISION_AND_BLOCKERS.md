# Login Decision and Migration Gate

## Confirmed choices

- Login method: Firebase Authentication email + password.
- Account recovery: Admin-assisted recovery (not self-service email reset).
- Staging: Separate project `heritage-crm-staging` is created; Email/Password is enabled, a web app is registered, and Firestore is created in Production mode (owner-confirmed screenshots).
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

Staging project creation is complete, but app integration, synthetic test data, backup/rollback readiness, identity mapping, and tests are still pending. Do not deploy authentication changes or replace production Firestore rules yet.

Before implementation/testing:
- Connect the CRM to staging through a separate, non-production configuration; do not change the production project ID.
- Confirm how each existing admin, tenant, and staff account will receive and verify a unique email address.
- Define who is authorized to request admin-assisted recovery and how recovery requests are audited.
- Prepare a migration and rollback plan, including account mapping and tenant-isolation checks.
- Test sign-in, sign-out, expired sessions, disabled/deleted staff, role/feature permissions, tenant boundaries, and recovery in staging.

## Current status

This is a decision and safety-gate record. Owner confirmed staging project setup; no application code, production Authentication settings, production Firestore rules, or live customer data have been changed.
