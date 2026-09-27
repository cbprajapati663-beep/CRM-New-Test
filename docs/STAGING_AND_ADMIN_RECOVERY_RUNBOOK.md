# Staging Setup and Admin-Assisted Account Recovery Runbook

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Selected decisions:** Email + password sign-in; admin-assisted recovery; no staging project currently exists.

## A. Staging project setup (owner action required)

1. In Firebase Console, create a separate project for non-production testing (for example, `heritage-crm-staging`; check availability before choosing the ID).
2. Enable **Authentication → Email/Password** in that staging project only.
3. Create a staging Firestore database. Do not import real customer, lead, staff, or payout data; use synthetic records.
4. Register a separate web app in staging and record its Firebase configuration in local environment configuration or repository secrets. Never commit private service-account keys or credentials.
5. Keep production and staging project IDs clearly labeled. Confirm which Firebase project the currently deployed CRM uses before any production changes.
6. If the app uses Firebase Storage, Functions, hosting, or other Firebase services, create/configure their staging equivalents before integration testing.

**Stop condition:** Do not proceed to production authentication or Rules changes until staging project ID is confirmed, test data is synthetic, and backups/rollback are planned.

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

This runbook documents the selected approach. It does not create a Firebase project, enable providers, migrate accounts, deploy code, or change production Firestore Rules. Those actions require access to the Firebase Console and verified project/account details.
