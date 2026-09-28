# Staging Authentication Execution Runbook

**Status:** Preparation guide only. No sign-in, authorization, Firestore, Storage, or regression test is claimed as executed.
**Allowed environment:** Firebase project `heritage-crm-staging` only.
**Production safety:** Do not run these steps against production. Do not paste credentials, ID tokens, service-account keys, customer data, or private configuration into GitHub issues or commits.

## 1. Preflight

- [ ] Open Firebase Console and verify the project ID is exactly `heritage-crm-staging`.
- [ ] Verify the staging web app configuration is stored locally at `assets/js/staging/firebase-config.js` and is ignored by Git.
- [ ] Verify Email/Password Authentication is enabled in staging.
- [ ] Verify Firestore starts with deny-by-default rules; do not loosen rules globally to make a test pass.
- [ ] Confirm the current branch is `security/auth-migration-plan-20260927`.
- [ ] Use synthetic data only and create separate test identities for Tenant A owner, Tenant A limited staff, Tenant B owner, and an unauthenticated session.
- [ ] Do not create a platform-admin test identity until the intended server-enforced admin model has been reviewed.

**Stop immediately** if the console project ID is not the staging ID, the config is missing/ambiguous, or a test would touch production data.

## 2. Auth-only smoke test

Use the staging smoke page only after the local config is set:

1. Open `pages/staging-auth-smoke.html` through the repository's local development server.
2. Sign in with a dedicated staging-only test account.
3. Confirm the page reports the authenticated user's UID (not a password or token).
4. Sign out and confirm the session is cleared.
5. Try a wrong password and confirm the page displays a safe error without exposing secrets.
6. Record each outcome in `docs/STAGING_AUTH_TEST_RECORD_TEMPLATE.md`.

A successful sign-in proves only that Firebase Auth works; it does **not** prove tenant isolation or secure CRM access.

## 3. Authorization test sequence

Do not begin until the reviewed staging data model and rules exist.

1. Create synthetic Tenant A and Tenant B records with clearly separated IDs.
2. Verify unauthenticated reads and writes are denied.
3. Verify Tenant A can access only its explicitly permitted synthetic records.
4. Attempt direct access to Tenant B's known record ID as Tenant A; expect denial.
5. Attempt to forge tenant ownership, role, or permissions in create/update payloads; expect denial or trusted server-side assignment.
6. Verify limited staff cannot perform actions outside the assigned permissions and cannot elevate itself.
7. Verify disabled/revoked users lose protected access.
8. Test Storage access using synthetic files: own-tenant access as permitted; cross-tenant and unauthenticated access denied.
9. Run the remaining scenarios in `docs/STAGING_AUTHORIZATION_TEST_PLAN.md` and record evidence with secrets and personal data redacted.
10. Run critical CRM regression workflows on synthetic data and verify cleanup.

## 4. Evidence and result labels

For every test, record:
- Test ID and date/time (timezone)
- Staging project ID
- Rules/code commit or version
- Test identity label and role (never password/token)
- Expected result and observed result
- Pass / Fail / Blocked / Not run
- Redacted evidence reference
- Cleanup confirmation and reviewer

Use **Blocked** when prerequisites are absent; never mark an unexecuted scenario Pass.

## 5. Exit gate

Production cutover remains **NO-GO** until the UID-to-tenant mapping, Firestore and Storage enforcement, negative cross-tenant tests, role boundaries, regression checks, backup/restore rehearsal, rollback rehearsal, and independent review are all evidenced and approved. This runbook does not authorize production changes.
