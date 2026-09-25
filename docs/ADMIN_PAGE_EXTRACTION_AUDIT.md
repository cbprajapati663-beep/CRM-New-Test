# Admin Page Extraction — Dependency Map

## Scope
Preparation for extracting the IT Admin / tenant-management screen into a separate page. This document records source-level dependencies; it is not a completed extraction or a security review.

## Existing coupling observed in `assets/js/app.js`
- Shared state includes tenant cache/readiness, tenant inspection state, and active tenant-report state.
- `applyPortalPermissions()` controls which admin/tenant areas are visible and changes shared header/session presentation.
- `renderAdminMasterUserCards()` renders tenant cards and uses the shared leads collection to calculate tenant-specific counts.
- Tenant management includes add/edit/save flows and the tenant modal (`saasTenantModal`).
- Tenant billing/report flows use `adminRentBillModal`, `adminTenantReportModal`, and report generation state.
- Tenant portal inspection uses `inspectUserPortal()` and is coupled to the same CRM workspace/session.
- Tenant deletion and license management are connected to existing handlers and DOM elements.
- Admin and operational views share the same HTML document, CSS, Firebase initialization, and application state.

## Extraction blockers
1. The existing app script expects a large set of DOM IDs from the complete CRM page; loading it on a minimal admin page can fail.
2. Admin actions currently call global functions and share in-memory data with the dashboard.
3. Tenant inspection changes the active view/session context; it cannot be safely moved as markup only.
4. Admin authentication currently relies on client-side logic. A separate URL is not an authorization boundary.
5. The deployed Firestore Security Rules and server-side authorization have not been verified.

## Safe next implementation sequence
1. Identify every admin DOM ID, event handler, and data dependency before moving markup.
2. Extract admin presentation into a dedicated module while retaining legacy markup and route.
3. Introduce an explicit shared data/session layer before enabling admin page initialization.
4. Add a guarded navigation path only after role and tenant authorization are enforced by trusted backend rules.
5. Validate tenant creation/editing, license status, billing, reports, inspection mode, deletion, logout, and direct refresh in a real browser.
6. Remove legacy admin markup only after parity checks pass.

## Validation checklist
- [ ] Admin-only controls are unavailable to ordinary tenant sessions.
- [ ] Tenant A cannot read or mutate Tenant B data.
- [ ] Create/edit tenant preserves existing document fields and IDs.
- [ ] Suspend/expiry/license actions behave as expected.
- [ ] Billing and tenant report totals match the legacy screen.
- [ ] Inspect/exit-inspection and logout restore the correct session.
- [ ] Delete flow requires confirmation and affects only the selected tenant.
- [ ] Direct URL access and refresh are tested.
- [ ] No console errors at desktop and mobile widths.

## Status
Dependency map prepared from the current source. No admin UI, auth, Firestore rules, or routing behavior was changed by this document. Browser tests remain pending.
