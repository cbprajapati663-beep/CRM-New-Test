# Free-Tier Implementation Plan

**Owner constraint:** Use only free-tier capabilities for now. Do not upgrade Firebase, enable paid products, create billable resources, or deploy paid infrastructure without explicit approval.

## Current blockers verified on 2026-09-29
- CRM's `assets/js/app.js` currently initializes Firebase with production project ID `heritage-crm-f179a`.
- Staging project `heritage-crm-staging` has deny-all Firestore rules in the console screenshot; Email/Password provider is enabled but no users were listed.
- Firebase Console indicates Cloud Functions require a project upgrade. Do not upgrade.
- The repository does not contain checked-in Firestore Rules or a Functions backend.
- Existing plan-limit checks are client-side only and can be bypassed; they are not secure server-side enforcement.
- Existing client login/session code contains legacy local/session logic and a default tenant credential. Do not treat it as secure authentication.

## Free-first execution sequence

### Stage 1 — Prevent accidental production access
1. Do not test the current app against production customer data.
2. Inventory every Firebase initialization and all project IDs across HTML/JS/config files.
3. Add an explicit staging-only config path only after obtaining the complete staging Web App config from Firebase Project Settings > General > Your apps.
4. Add a visible environment guard and tests so staging tests cannot silently use the production project.
5. Keep the production config and live behavior unchanged until a separate reviewed migration is approved.

### Stage 2 — Free local validation
1. Use local Node.js tests for plan-cap calculations, permission helpers, and validation.
2. Evaluate Firebase Emulator Suite for local Auth/Firestore Rules tests; keep emulator data synthetic.
3. Do not connect local tests to production or use real customer data.
4. Confirm any required tooling's current plan/usage conditions before enabling it.

### Stage 3 — Authentication and tenant isolation design
1. Map current collections, tenant ownership fields, staff roles, and all direct read/write paths.
2. Design Firebase Auth UID-to-tenant/role mapping without storing passwords in Firestore or trusting browser-provided roles.
3. Draft restrictive Firestore Rules only after the schema and flows are confirmed; keep current deny-all staging rules until a tested replacement is ready.
4. Test tenant isolation, permission boundaries, and existing CRM workflows using synthetic emulator data.

### Stage 4 — Plan-limit enforcement
1. Keep client-side cap messages as user-experience checks only.
2. Look for a genuinely free trusted enforcement option before proposing any paid backend.
3. If no free trusted atomic enforcement is available, mark the secure enforcement feature as blocked rather than presenting browser-side checks as tamper-proof.
4. Never exceed plan limits by silently removing, deactivating, or deleting existing records.

## Cost approval gate
Pause and ask the owner before any step that requires a paid plan, billing enablement, paid server/backend, or potentially billable resource. State the reason and expected cost category first.

## Release guardrails
- No Firebase settings, billing, users, Rules, production data, or deployments changed by this plan.
- Do not publish permissive Rules.
- Keep PR #11 unmerged until validation and security requirements are met.
