# Staging Execution Gate — Firebase Auth Migration

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Preparation checklist only. No staging data, production data, Firebase settings, or application code was changed.

## Objective

Move authentication and authorization work into a controlled staging lane before touching production. Keep the live CRM unchanged until every gate below is explicitly passed.

## Gate 0 — Protect production

- [ ] Export a verified backup of Firestore data and Storage objects; record backup time and restore instructions.
- [ ] Confirm the actual production Firebase project ID from Firebase Console and compare it with both login entrypoints and all Firebase initialization sites.
- [ ] Review the temporary broad Firestore rule expiration and replace it only through a tested, planned deployment. Do not simply paste deny-all rules into the live project.
- [ ] Check Firebase Authentication, Firestore, Storage, and Hosting usage/audit logs for unexpected access during the permissive-rules window.
- [ ] Rotate exposed credentials/secrets if any were committed; Firebase web config itself is not a server secret, but service credentials and private keys are.

**Stop condition:** No verified backup, unclear production project, or unresolved incident → no migration or production Rules deployment.

## Gate 1 — Staging isolation

- [ ] Confirm staging project is `heritage-crm-staging`.
- [ ] Verify Email/Password Auth is enabled and Firestore exists in staging.
- [ ] Configure Storage in staging only if the app's document-upload flows are part of the test.
- [ ] Add a clear environment label/banner and a fail-closed project-ID assertion before any staging app connection.
- [ ] Confirm every Firebase initialization entrypoint uses the same staging configuration in staging builds; no fallback to production.
- [ ] Use only synthetic test tenants, users, leads, and files. Never copy customer PII into staging.

**Pass evidence:** Screenshots or logs showing project ID, Auth provider status, and successful staging-only read/write using synthetic fixtures.

## Gate 2 — Identity and access model

- [ ] Define the stable mapping: Firebase Auth UID → user record → tenant ID → role/permissions.
- [ ] Decide how existing tenant and staff accounts are invited/provisioned and how first login/reset works.
- [ ] Admin-assisted recovery must verify requester identity, log the action, and never reveal or email a stored password.
- [ ] Make tenant identity and role server-controlled; do not trust tenant IDs, roles, or permissions supplied by browser localStorage.
- [ ] Define least-privilege access for tenant, staff, branch manager, and platform admin, including lead, report, document, and payout data.

**Stop condition:** Any role or tenant boundary depends only on hidden UI controls, localStorage, or client-side filtering.

## Gate 3 — Staging regression and isolation tests

- [ ] Tenant A can read/write only its permitted records.
- [ ] Tenant A cannot read/write Tenant B's leads, staff, branches, reports, documents, or payout-related records—even by direct SDK calls with altered IDs.
- [ ] Staff can access only assigned branches and allowed features; deleted/disabled staff sessions are rejected.
- [ ] Unauthenticated users cannot read or write protected data.
- [ ] Unauthorized role cannot perform admin operations, change permissions, or alter tenant ownership.
- [ ] Upload, preview, download, and delete checks enforce tenant/lead ownership in Storage and Firestore metadata.
- [ ] Login, logout, password reset, session expiry, refresh, and admin-assisted recovery work.
- [ ] CRM regression: lead CRUD, search/filter, branches, staff management, reports, DO generation/printing, document upload, and subscription/limit enforcement.
- [ ] Verify logs contain no passwords, reset tokens, private documents, or unnecessary customer data.

## Gate 4 — Production cutover (separate approval required)

- [ ] Staging tests pass and evidence is attached to the PR.
- [ ] Data migration plan is rehearsed on a restorable copy, with record counts and relationship checks.
- [ ] Rollback steps and a maintenance window are approved.
- [ ] Production Auth provisioning and UID mapping are complete.
- [ ] Rules and Storage policies are deployed only after emulator/staging tests pass.
- [ ] Post-deploy smoke tests confirm tenant isolation and critical CRM flows.
- [ ] Keep a documented rollback decision point; do not delete legacy credential fields until migration completion is verified.

## Current known blockers

1. Staging project exists, but application code has not been connected to it.
2. No synthetic fixture suite or staging runtime test evidence is available.
3. Production backup/restore validation is not confirmed.
4. Full identity-to-tenant mapping and authorization policy remain to be implemented and tested.
5. No production migration or Rules deployment is authorized by this document.

## Definition of done

The migration is not complete until the staging isolation suite passes, backup restore is proven, production cutover is explicitly approved, and post-cutover tenant-boundary tests pass. Documentation completion alone is not a security fix.
