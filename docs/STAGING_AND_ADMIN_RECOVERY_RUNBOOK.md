# Staging Setup and Admin-Assisted Account Recovery Runbook

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Selected decisions:** Email + password sign-in; admin-assisted recovery. **Staging:** owner confirms `heritage-crm-staging` exists, Email/Password is enabled, a web app is registered, and Firestore was created in Production mode.

## A. Staging project setup (owner action required)

1. **Completed:** separate Firebase project `heritage-crm-staging` created.
2. **Completed:** Authentication → Email/Password enabled in staging.
3. **Completed:** Cloud Firestore created in Production mode (default-deny initial rules). Do not import real customer, lead, staff, or payout data; use synthetic records only.
4. **Completed:** separate staging web app registered. Keep its Firebase config in a separate local/environment configuration; never commit service-account credentials. The app is not yet wired to this project.
5. Keep production and staging project IDs clearly labeled. The existing CRM source still points to `heritage-crm-f179a`; confirm the deployed hosting target before production changes.
6. If the app uses Firebase Storage, Functions, hosting, or other Firebase services, create/configure their staging equivalents before integration testing.

**Stop condition:** Staging creation is complete, but do not proceed to production authentication or Rules changes until synthetic test data, backup/restore, account mapping, app integration, and rollback are prepared and staging tests pass.

## B. Account identity mapping

Before creating accounts, prepare an access-controlled mapping for each existing account:
- Existing account/document ID
- Canonical tenant ID
- Account type (owner/admin, tenant user, staff)
- Verified unique email address
- Active/suspended/deleted state
- Intended role and approved permissions

Do not invent email addresses, reuse one email across multiple people, or migrate plaintext passwords/password hashes into Firebase Auth. Confirm each user's email ownership before activation. Keep the mapping out of public repository files.

## C. Admin-assisted recovery workflow

1. User requests account recovery through a documented support channel.
2. Admin verifies the requester's identity using a separately approved verification procedure; do not rely only on caller-provided tenant ID or staff Login ID.
3. Admin triggers a password-reset email through Firebase Authentication's trusted administrative flow. The reset link is delivered to the account's verified email.
4. Admin does not view, choose, message, or store the user's new password. Never ask users to send passwords or reset links to the admin.
5. Record an audit event containing requester/account reference, admin actor, timestamp, outcome, and reason code—never the reset link, password, or verification secrets.
6. If email access is lost, suspend risky access and use a separately verified account-update process; do not bypass identity checks by editing Firestore email fields from the client.
7. For owner/superadmin recovery, maintain a separately protected break-glass process and at least two secure recovery options outside the app.

## D. Staging acceptance checks

- Email/password sign-in and sign-out work; invalid credentials are rejected.
- Password reset only reaches the verified account email.
- Disabled/deleted staff cannot sign in or access data after session refresh/revocation.
- Tenant A cannot read or write Tenant B data.
- Staff role and feature permissions are enforced by trusted authorization, not only hidden UI.
- Clients cannot change their own tenant, role, or active status.
- Admin recovery is audited without storing secrets.
- Existing CRM workflows pass regression tests using synthetic data.

## Current completion state

This runbook records the owner-confirmed staging setup. It does not migrate accounts, connect the app to staging, deploy code, or change production Firestore Rules. Account mapping, synthetic data, backup/restore, integration, and tests remain pending.
