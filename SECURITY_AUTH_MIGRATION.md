# Firebase Authentication & Firestore Security Migration

**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Staging project created and configured by owner; migration remains design/preparation only. No production code, Firestore data, or deployed Rules changed.

## Current verified findings

- The app initializes Firebase project `heritage-crm-f179a` and uses Firestore collections `leads`, `tenants`, and `staffAccounts`.
- The owner-provided deployed Rules currently allow read/write until 2026-10-17. This permits broad client access before that date and must be treated as a critical exposure.
- Owner screenshots confirm a separate staging project `heritage-crm-staging`, a registered web app, Email/Password provider enabled, and a Cloud Firestore database created in Production mode (default-deny initial rules). This does not change the app's current Firebase config (`heritage-crm-f179a`) or prove staging integration.
- Tenant login reads tenant documents and compares a password in browser code.
- Admin login is a browser-side password check with a localStorage fallback.
- Staff login verifies a password hash in browser code and then reads tenant data.
- Session identity is stored in localStorage; UI permissions and lead filtering are client-side and cannot enforce data authorization.
- `SECURITY_REMEDIATION_PLAN.md` contains the broader audit and release gate.

## Non-negotiable safety constraints

1. Do not publish new Firestore Rules to production until staging passes the test matrix below.
2. Do not enable a provider or alter existing account records during this design phase.
3. Never copy plaintext passwords into Firebase Authentication, source control, logs, or migration exports.
4. Do not use a client-supplied `tenantId`, role, or localStorage object as authorization evidence.
5. Keep a verified backup and rollback plan before any migration.
6. Assume the current tenant password/default credential is exposed; rotate it as part of a controlled migration.

## Recommended target identity model

Use Firebase Authentication as the identity source, then bind each authenticated UID to an authorization record managed by a trusted environment:

- Tenant users: verified Firebase Auth identity, with an authorization mapping containing immutable `uid`, canonical `tenantId`, role, and active/suspended status.
- Staff users: verified Firebase Auth identity mapped to `uid`, canonical `tenantId`, role, staff status, and permissions. Deleted/inactive staff must be denied.
- SaaS superadmin: a separately controlled owner identity, with privileged access granted only through trusted server-side administration. Do not keep a shared master password in the browser.
- Prefer server-managed custom claims or a server-managed authorization document; clients must not be able to write their own role, tenant assignment, or active status.
- Each business record must carry a canonical tenant ownership key. Tenant authorization must be enforced by Firestore Rules or trusted server endpoints, not by browser filtering.

### Login identifier decision required

Current tenant/staff login uses a username-like Login ID, not necessarily an email address. Before implementation, choose a supported account recovery and verification method (for example, verified email/password or verified phone). Do not invent email addresses or silently convert existing credentials. If preserving username-based login is required, use a trusted backend that verifies credentials and issues Firebase custom tokens; never implement this in browser-only code.

## Migration phases

### Phase 0 — Containment and inventory
- Confirm the active Firebase project and production hosting configuration.
- Preserve a secure database backup and export collection schemas without customer PII.
- Confirm whether the second Firebase project is unused, staging, or another live environment.
- Review Storage rules and any Cloud Functions/Cloud Run services, not only Firestore.
- Restrict project IAM to named least-privilege accounts; rotate exposed credentials as appropriate.

### Phase 1 — Staging environment
- **Completed by owner:** created non-production Firebase project `heritage-crm-staging`, registered a web app, enabled Email/Password, and created Firestore in Production mode.
- Confirm no real customer, lead, staff, or payout data has been copied; create synthetic test records only.
- Add automated tests using the Firebase Emulator Suite or this dedicated test project.
- Staging app configuration has not yet been connected to the CRM code; current repository config still targets `heritage-crm-f179a`.

### Phase 2 — Trusted authentication and authorization
- Implement tenant and staff sign-in using Firebase Auth.
- Add trusted provisioning/migration flow for tenant, staff, and admin identities.
- Move authorization decisions out of browser-only code.
- Replace localStorage session trust with Firebase Auth state and verified authorization data.
- Ensure staff permissions are checked in rules/server endpoints for every protected operation.

### Phase 3 — Firestore Rules
- Design rules from the actual document schema and exact read/write operations.
- Default-deny all unspecified paths.
- Restrict each tenant to documents matching its trusted tenant assignment.
- Prevent clients from editing role, tenant assignment, account status, password/hash, and other privileged fields.
- Allow staff only the minimum records and operations required by their role.
- Keep superadmin operations server-side unless a carefully reviewed, strongly authenticated admin design is implemented.
- Do not deploy generic example rules as production rules.

### Phase 4 — Test and staged rollout
Run automated tests for:
- unauthenticated read/write denied;
- tenant A cannot read/write tenant B data;
- staff can access only assigned tenant and allowed records;
- inactive/deleted staff denied;
- suspended tenant denied;
- user cannot modify their own role, tenantId, or status;
- permitted tenant operations continue to work;
- admin-only operations denied to tenant/staff users;
- backup, restore, and account recovery workflows;
- all CRM screens, documents, exports, reports, and payout-related operations.

### Phase 5 — Production migration
- Announce login changes and verify recovery channels.
- Migrate in small batches with monitoring and rollback criteria.
- Rotate any exposed/default credentials and remove legacy password fields only after successful verification.
- Publish production Rules only after staging sign-off and backup verification.
- Revoke temporary migration access and review audit logs.

## Release gate

Production rollout remains **blocked** until the owner confirms the active project, identifier/recovery approach, test environment, data backup, exact Firestore document schemas, and successful cross-tenant security tests.

This document is a migration plan, not a claim that the application is currently secure.
