# CRM Security Hardening — Staging Test Plan
Updated: 2026-10-27

## Status and safety boundary

This is a staging-first plan for `heritage-crm-staging`. Do not apply these steps to production project `heritage-crm-f179a` until staging tests pass and a restore path is confirmed. The repository currently does not contain `firestore.rules`, `storage.rules`, or `firebase.json`; the deployed Firebase rules therefore have not been independently verified.

## Findings requiring priority attention

1. Tenant login currently reads the `tenants` collection from browser code and compares a stored `password` field in JavaScript. This is not secure authentication.
2. The main app contains a default tenant bootstrap with password `123`; do not delete or rotate this account until the owner login/recovery path is confirmed.
3. Admin password fallback `admin123` and localStorage session values are client-side controls, not an authorization boundary.
4. Frontend tenant/role checks cannot prevent direct Firestore/Storage requests. Deployed Firebase Security Rules must enforce access server-side.
5. A Firebase web API key being visible in frontend code is normal; it must be protected by Firebase Authentication, rules, and appropriate API restrictions, not treated as a password.

## Staging-only verification checklist

### A. Backups and project identity
- [ ] Open Firebase Console and confirm the project selector is exactly `heritage-crm-staging`.
- [ ] Export/backup the Firestore data needed for recovery before changing auth or rules.
- [ ] Save the current Firestore and Storage Rules text outside the editor so it can be restored.
- [ ] Confirm the production project is not selected before every write/deploy action.

### B. Authentication
- [ ] Review Authentication → Sign-in method and note enabled providers.
- [ ] Confirm there is a supported owner/admin recovery method before removing any legacy password path.
- [ ] Create two test tenant identities and one test staff identity using non-production test data.
- [ ] Confirm invalid credentials are rejected and no password is stored in Firestore as plaintext.
- [ ] Confirm logging out, refreshing, opening a new tab, and waiting past the idle timeout behave as expected.
- [ ] Do not use real customer records or real credentials for these tests.

### C. Firestore authorization (must be server-enforced)
Use two separate browser profiles/accounts for Tenant A and Tenant B.
- [ ] Unauthenticated request cannot list/read `tenants`, `leads`, or `staffAccounts`.
- [ ] Tenant A cannot read or modify Tenant B's tenant, leads, staff, reports, or documents by changing a document ID or request payload.
- [ ] A normal staff account cannot grant itself admin/owner role or change its tenant ID.
- [ ] A sales role cannot delete leads if the intended policy is create/edit only.
- [ ] Viewer role cannot write data.
- [ ] Suspended/expired tenant cannot continue accessing protected records.
- [ ] A rejected write remains rejected even if the UI is bypassed or the request is sent directly.

### D. Storage authorization
- [ ] Unauthenticated user cannot list or download private customer documents.
- [ ] Tenant A cannot download Tenant B's files by guessing/changing a storage path.
- [ ] File uploads enforce allowed types and size limits server-side where supported.
- [ ] Deleting or changing a file path cannot bypass tenant ownership checks.

### E. Regression checks
- [ ] Login, logout, password recovery, staff permissions, tenant isolation, lead CRUD, reports, document upload/download, and mobile layout all pass on staging.
- [ ] Check browser console and network requests for authorization errors.
- [ ] Record test date, test account role, expected result, actual result, and screenshot for each failed case.

## Safe implementation sequence

1. Confirm and back up the staging project and deployed rules.
2. Design Firebase Authentication migration and a role/tenant claim or trusted membership model.
3. Write Firestore and Storage rules to deny by default and explicitly allow only verified tenant/role access.
4. Deploy rules to staging only; run the tests above.
5. Migrate login/session code only after a working admin recovery path and test accounts exist.
6. Re-run all CRM regression tests and verify a rollback path.
7. Only then prepare a separate production rollout with a maintenance window and fresh backup.

## Current limitations

This checklist and repository inspection do not prove the live Firebase rules are secure. No Firebase Console access or deployed-rules inspection was available during this repository pass. No production authentication, data, or rules have been changed by this plan.
