# Page Separation — Dependency Audit

**Status:** Phase 0 audit completed. No production HTML, JavaScript, login flow, or routes were moved in this phase.

## Findings from the current default-branch source

- `index.html` contains the authentication overlay, CRM workspace, admin tenant cards, operational views, and modal/print markup.
- `assets/js/app.js` is a single page-coupled script. It immediately reads `#current-date` and initializes Firebase, then accesses login controls, navigation tabs, CRM views, admin controls, and modal elements by fixed DOM IDs.
- Login handlers depend on `#loginPassword`, `#loginUserId`, `#loginError`, `#authSubmitBtn`, and `#authOverlay`.
- Admin functionality is currently rendered inside the same page through `#adminUserMasterDeck` and `applyPortalPermissions()`; it shares the same data/state and feature functions.
- The existing Firebase setup uses Firestore collections `leads` and `tenants`. This audit does not verify deployed Firestore Security Rules or production authorization.

## Why markup-only extraction is unsafe

Loading the current `assets/js/app.js` on a page that lacks the expected IDs can throw errors during startup or when a handler runs. Moving login/admin markup without first separating shared state and feature initialization can break login, tenant switching, dashboards, and existing workflows.

## Next implementation phases

1. Introduce a small shared bootstrap that safely initializes only on pages with the required root element, without changing current behavior.
2. Extract login UI and its event handlers into a dedicated page/module while preserving the current login behavior during transition; test login, reset, password change, and session restore.
3. Extract admin UI and tenant-management handlers; verify role gating, tenant switching, rent/report actions, and direct page refresh.
4. Extract the operational dashboard and its feature modules only after shared data/session dependencies are explicit.
5. Add guarded navigation, update manifest/start URL as appropriate, and run browser-level regression tests before removing legacy markup.

## Security and release gates

- A separate URL or client-side route is not an authorization boundary. Verify Firebase Authentication and Firestore Security Rules independently.
- Preserve existing collection names, document fields, and user data during UI refactoring.
- Do not remove default credentials or alter password storage as part of the page split.
- Do not mark the refactor complete until syntax checks and real browser tests cover login/logout, role restrictions, tenant isolation, leads, dealer ledger, payouts, follow-ups, data health, workflow, DO/printing, reports, password reset/change, and mobile layout.
