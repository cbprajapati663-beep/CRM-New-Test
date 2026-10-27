# Subscription Expiry and Reactivation Audit — 2026-10-27

## Scope and evidence

Reviewed the current `main` branch source files:
- `assets/js/app.js`
- `assets/js/login-page.js`

This is a static code review only. No production data was changed, no rules were deployed, and no runtime test was performed as part of this report.

## Current behavior found in source

1. `getLicenseDaysRemaining()` parses `expiryDate` as a calendar date and returns days remaining.
2. `syncExpiredTenantStatuses(tenantList)` updates expired tenants to `status: 'Suspended'`, writes `suspensionReason: 'License expired'`, and timestamps `suspendedAt` / `updatedAt`.
3. `loadTenantsFromFirestore()` calls `syncExpiredTenantStatuses(tenantsCache)` after loading tenants.
4. A 60-second browser interval calls the expiry checker. For a superadmin session it calls `syncExpiredTenantStatuses(getStoredTenants())`; for a client session it calls `checkCurrentTenantExpiry()`.
5. `checkCurrentTenantExpiry()` suspends the current tenant when its stored session expiry is in the past, clears the local session, shows the auth overlay, and alerts the user.
6. `assets/js/login-page.js` blocks login when the tenant document has `status === 'Suspended'`.
7. The Admin tenant editor loads `expiryDate` and `status`; save logic allows Active only if expiry is today or in the future. It writes the new `expiryDate` and `status`.

## Assessment

- **Is expiry suspension present?** Yes, browser-side expiry/suspension logic exists.
- **Is exact-time, server-enforced automatic suspension guaranteed?** No. The observed scheduler is a browser `setInterval`, not a trusted scheduled backend job. It depends on browser activity, Firestore access, permissions, and available/fresh tenant data. A closed browser or failed client update can delay or prevent the status update.
- **Can an Admin reactivate after renewal?** The Admin editor can set a future expiry date and `status: 'Active'`, so a manual Admin reactivation path exists in source.
- **Does payment renewal automatically reactivate?** No payment-webhook or verified payment-to-license automation was found in the reviewed source scope.
- **Are suspension metadata fields cleared on renewal?** The tenant save payload updates expiry/status but does not explicitly clear `suspensionReason` or `suspendedAt`; stale metadata may remain.
- **Is this a strong security boundary?** No. Client-side status checks are not a substitute for server-enforced authorization. Login code also reads the tenant record and compares the tenant password in browser JavaScript; a robust long-term design should migrate to Firebase Authentication or another trusted auth service and enforce tenant/plan state in server-side rules/functions.

## Recommended safe implementation sequence

1. Keep this work on a security branch and do not deploy directly to production.
2. Define expiry semantics explicitly: calendar-day expiry in the tenant's intended timezone, grace period (if any), and whether suspension occurs at start or end of expiry date.
3. Add a trusted scheduled backend job (for example, a scheduled Cloud Function) that queries expired active tenants and suspends them idempotently. Use least-privilege server credentials, logs, and retry-safe updates.
4. Enforce tenant status and subscription validity in Firestore/Storage rules and backend APIs, not only in the UI. Confirm the existing data schema and current deployed rules first.
5. Make the Admin renewal flow atomic and auditable: verify payment/authorized manual renewal, set a future expiry date, set Active, clear stale expiry suspension fields, and write an audit event with actor and timestamp.
6. If a payment provider is integrated later, only reactivate from a verified server-side payment webhook; never trust a client redirect or browser-supplied “payment successful” flag.
7. Add automated tests for just-expired, future expiry, missing/invalid expiry, already-suspended tenant, repeated scheduler run, Firestore permission failure, renewal/reactivation, and staff access after suspension.
8. Stage and verify with synthetic tenant accounts. Back up current rules and verify rollback before any publish.

## Status

**Audit/documentation only.** No production code or Firebase rules were changed by this report. A code implementation should follow after confirming deployed rules, auth migration constraints, and staging test fixtures.
