# Staging Configuration Isolation Plan

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Static implementation plan; no code or Firebase project changed.

## Source facts confirmed

- `assets/js/app.js` initializes Firebase directly with the existing `heritage-crm-f179a` project configuration.
- `assets/js/login-page.js` independently initializes Firebase with the same production project configuration.
- `index.html` loads Firebase compat SDKs and the app; its main login form is also implemented in the app script.
- Staging project `heritage-crm-staging` has been created and Email/Password Auth plus Firestore are enabled, but no CRM code is connected to it.
- Because both entry points initialize Firebase separately, changing only one config would create inconsistent authentication/data behavior. A careless global replacement could point a production deployment at staging or vice versa.

## Safe staging-only implementation sequence

1. **Preserve production defaults.** Do not replace the current Firebase project configuration in shared production files.
2. **Create an explicit environment boundary.** Introduce a staging-specific entry point/configuration or deployment-time config injection. Staging must fail closed if the expected staging project ID is absent or does not equal `heritage-crm-staging`.
3. **Use one Firebase initialization owner.** Ensure login and application code share one initialized Firebase app instead of independently initializing different projects. Guard against duplicate initialization.
4. **Keep environment selection out of user-controlled input.** Never select Firebase project using a URL query parameter, localStorage value, or login form field. The environment must be fixed by the deployed entry point/build.
5. **Keep staging data synthetic.** Seed only test tenants, staff, branches, leads, and document objects. Do not copy customer records or production credentials.
6. **Authenticate through Firebase Auth.** Tenant/staff login must use Auth identities and trusted membership mapping. The legacy document password comparison must not be used as a fallback in staging.
7. **Apply staging-only Rules and Storage Rules.** Start with deny-by-default, then allow only verified tenant-bound operations. Do not deploy staging rules to production.
8. **Run tests before any production migration.** Validate login/logout, session refresh, tenant A/B isolation, role/branch authorization, lead CRUD, document upload/download/delete, staff deactivation, and realtime access revocation. Include anonymous and cross-tenant negative tests.
9. **Review deployment wiring.** Confirm staging host points only to staging project and production host still points only to production. Record the exact project ID shown at runtime in a safe diagnostic screen.
10. **Rollback.** Keep production entry point unchanged until staging passes; rollback should be a deployment artifact switch, not a live database rewrite.

## Blocking details before implementation

- Confirm whether staging should use a separate staging-only HTML entry point or a separate deployment branch/site.
- Confirm the intended hosting URL/site for staging.
- Establish a secure Auth UID-to-tenant/staff membership model and trusted admin provisioning/recovery workflow.
- Define Storage rules and actual document ownership fields using synthetic staging fixtures.
- Confirm no production customer data is imported.

## Acceptance criteria

- Staging build refuses to initialize if project ID is not exactly `heritage-crm-staging`.
- Production build refuses a staging project ID.
- Both login and CRM modules use the same Firebase app instance.
- Staging can run full smoke tests using synthetic identities without reading or writing production.
- No password/hash/salt or admin master credential is exposed to browser-readable Firestore documents.
- All cross-tenant and unauthenticated tests are denied.
- Production app, data, Auth, and deployed Rules remain untouched during staging development.

## Safety note

This document is not an instruction to deploy or alter Firebase configuration. It is a source-informed plan. No code changes, test execution, Firebase setting changes, or production changes were performed for this document.
