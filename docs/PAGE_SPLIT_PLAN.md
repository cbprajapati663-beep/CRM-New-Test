# Multi-page UI Refactor Plan

## Goal
Separate the CRM's major screens into independently maintained pages without changing existing business logic, visual design, Firebase references, data formats, or user workflows.

## Current verified structure
- `index.html` currently contains the login overlay, main CRM workspace, admin tenant deck, operational views, and many modal/report/print templates.
- `assets/css/styles.css` contains the shared styles.
- `assets/js/app.js` is a single application script that expects many DOM IDs from the full page. It directly references elements such as `current-date`, login controls, CRM views, and admin/modal controls.
- The login and admin screens are therefore not independent modules yet. Moving their markup alone would cause missing-element errors and break existing event handlers.

## Proposed target structure
```text
/
├── index.html                 # app entry / route landing
├── pages/
│   ├── login.html             # tenant and master-admin sign-in
│   ├── dashboard.html         # authenticated CRM workspace
│   └── admin.html             # tenant/master administration
├── assets/
│   ├── css/
│   │   ├── styles.css         # shared design tokens and components
│   │   └── pages/             # page-specific styles only when needed
│   └── js/
│       ├── core/
│       │   ├── firebase.js    # existing Firebase SDK/config initialization
│       │   ├── session.js     # session and access helpers
│       │   └── navigation.js  # guarded page routing
│       ├── pages/
│       │   ├── login.js
│       │   ├── dashboard.js
│       │   └── admin.js
│       └── app.js             # shared feature modules during migration
└── docs/
    └── PAGE_SPLIT_PLAN.md
```

## Safe migration sequence
1. Add shared bootstrap/session/navigation helpers without removing current page markup.
2. Extract login markup and handlers into `pages/login.html` and `assets/js/pages/login.js`; keep a temporary compatibility path until login, reset, and password-change flows are verified.
3. Extract admin tenant-management markup and handlers into `pages/admin.html` and `assets/js/pages/admin.js`; verify role checks and tenant switching.
4. Move operational dashboard markup and handlers into `pages/dashboard.html` and page modules.
5. Update links, route guards, logout/return paths, and PWA manifest/start URL; verify direct page refresh and Netlify static-host routing.
6. Run syntax checks and regression tests for login/logout, tenant isolation, leads, dealer ledger, payout gate, follow-ups, data health, workflow, DO generation/printing, reports, password reset/change, and mobile layout.
7. Remove legacy markup only after parity tests pass.

## Security and compatibility requirements
- A page being separate is not an authorization boundary. Enforce authorization in Firebase Authentication and Firestore Security Rules; do not rely on hidden buttons or client-side route guards.
- Do not move secrets into client files. Firebase web config is public client configuration; data access must be protected by Security Rules.
- Preserve current Firestore collection names and document shapes during the UI-only migration.
- Avoid changing or deleting existing login defaults and stored credentials as part of page extraction; credential migration needs a separate tested plan.
- Do not claim the refactor is complete or production-secure until browser/runtime and rules tests have passed.

## Current status
- Phase 0 dependency audit is complete.
- A standalone client login page and script exist at `pages/login.html` and `assets/js/login-page.js`.
- The legacy sign-in remains in `index.html`; the new login page is not yet the sole login route.
- Login behavior has not been verified in a real browser against the deployed Firestore database.
- Admin/dashboard extraction and route guards are not complete.
- See `docs/LOGIN_PAGE_TEST_PLAN.md` for the next validation gate.
