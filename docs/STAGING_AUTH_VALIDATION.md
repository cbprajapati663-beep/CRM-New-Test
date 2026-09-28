# Staging Authentication & Tenant-Isolation Validation

**Status:** Preparation checklist only. This document does not indicate that staging has been configured or that tests have passed.

## Safety boundary

- Use only the Firebase project `heritage-crm-staging` and a dedicated synthetic test account.
- Do not use production customer records, production credentials, or the production Firebase project `heritage-crm-f179a`.
- Do not remove legacy login paths, migrate production identities/data, change production rules, or deploy until the owner approves a reviewed migration and rollback plan.
- The standalone smoke page verifies Firebase Authentication only. A successful smoke test does **not** verify CRM role mapping, tenant isolation, or authorization.

## 1. Staging setup prerequisites

- [ ] Confirm the Firebase console project ID is exactly `heritage-crm-staging`.
- [ ] Enable the intended sign-in provider (Email/Password) in staging Authentication.
- [ ] Create a dedicated synthetic staging user and confirm password-reset email delivery.
- [ ] Provide `assets/js/staging/firebase-config.js` locally or through the staging deployment secret/config mechanism. This file is intentionally excluded from version control; never commit credentials or service-account keys.
- [ ] Confirm the config exports the expected `HAFStagingFirebase` bootstrap contract and reports the exact staging project ID.
- [ ] Confirm no production app initialization or customer-data collections are loaded by the standalone smoke page.

## 2. Authentication smoke checks

Open `pages/staging-auth-smoke.html` on the staging deployment and verify:

- [ ] Missing config fails closed and disables sign-in/reset actions.
- [ ] Wrong project ID fails closed.
- [ ] Valid staging credentials authenticate, then the page signs out automatically.
- [ ] Invalid credentials show a safe failure message and clear the password field.
- [ ] Password reset can be requested for the synthetic account.
- [ ] No CRM tenant session or CRM data access is created by the smoke page.

Record the date, tester, staging project ID, and observed result without recording passwords or tokens.

## 3. Tenant authorization prerequisites

Before enabling the migrated CRM login, document and review:

- [ ] A trusted UID-to-tenant/role mapping for each staging test user.
- [ ] The authoritative source of tenant membership and role claims.
- [ ] Firestore Security Rules that deny access by default and scope every read/write to the authenticated tenant.
- [ ] Any admin-only operations enforced by trusted claims or a trusted backend—not by UI visibility.
- [ ] Storage rules with equivalent tenant scoping, if customer documents use Firebase Storage.

Do not infer tenant membership from user-editable profile fields or localStorage.

## 4. Required emulator/integration test matrix

Run against an isolated Firebase Emulator Suite or disposable staging data. Record actual outcomes; do not mark tests passed without execution.

| Scenario | Expected result |
| --- | --- |
| Unauthenticated read/write | Denied |
| Tenant A user reads Tenant A fixture | Allowed only for explicitly permitted resources |
| Tenant A user reads Tenant B fixture | Denied |
| Tenant A user writes Tenant B fixture | Denied |
| User with no tenant mapping accesses tenant data | Denied |
| Ordinary tenant user invokes admin-only operation | Denied |
| Disabled/revoked user attempts access | Denied after token/session revocation takes effect |
| Malformed or missing tenant identifier | Denied |
| Cross-tenant document/storage path access | Denied |
| Legitimate tenant workflows and role permissions | Work as explicitly specified |

## 5. Go/no-go gate

**Do not merge or deploy** until all are true:

1. Staging auth smoke checks are executed and recorded.
2. UID/tenant/role mapping is reviewed.
3. Firestore and Storage rules are reviewed and cross-tenant denial tests pass.
4. Existing CRM workflows have regression coverage (login/logout, password reset, lead/customer access, staff permissions, payout, document upload, and delivery order).
5. A verified backup and rollback/recovery procedure exists.
6. The owner explicitly approves the production migration.

## Test record

- Date/time:
- Tester:
- Firebase project ID:
- Commit tested:
- Auth smoke result:
- Emulator/rules test result:
- Regression test result:
- Known blockers:
