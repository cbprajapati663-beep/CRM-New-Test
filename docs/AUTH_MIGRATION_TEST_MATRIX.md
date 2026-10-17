# Auth Migration Test Matrix — CRM-New-Test

Use this checklist in a staging Firebase project before changing production rules.

## Pre-flight
- [ ] Export/back up Firestore data and save a copy of current Firestore Rules.
- [ ] Confirm staging project ID; do not test migration against production.
- [ ] Inventory active tenant accounts and staff accounts without copying passwords into this file.
- [ ] For each active account, record current login ID, account type (tenant/staff), tenant ID, role, new Firebase Auth UID, and migration status. Do not record passwords, tokens, API keys, or personal documents.
- [ ] Decide how each account will set/reset its password using Firebase Authentication. Do not reuse Firestore plaintext password fields.

## Staging smoke tests
| Test | Expected result | Status |
|---|---|---|
| Valid tenant Auth login | Sign-in succeeds and loads only its tenant data | Pending |
| Invalid tenant password | Login rejected without revealing account existence | Pending |
| Valid staff Auth login | Sign-in succeeds and resolves trusted tenant/role profile | Pending |
| Disabled staff account | Access denied | Pending |
| Unauthenticated Firestore read/write | Denied | Pending |
| Tenant A reads Tenant B leads | Denied | Pending |
| Tenant A updates Tenant B lead | Denied | Pending |
| Viewer attempts create/update/delete | Denied where policy prohibits it | Pending |
| Sales Executive attempts delete lead | Denied if policy prohibits it | Pending |
| Authorized user creates a lead | Allowed and persists after refresh | Pending |
| Password reset and sign-out | Work as expected; prior session cannot continue after sign-out | Pending |
| Storage document access | Restricted to authorized tenant/user | Pending |

## Implementation guardrails
- Do not deploy `request.auth != null` alone as the final multi-tenant rule set.
- Do not retain broad time-limited public read/write rules as a production fix.
- Enforce authorization in Firestore Rules, not only in the UI.
- Keep a rollback plan. Deploy client auth and rules as a coordinated release after staging tests pass.
- Never put passwords, ID documents, customer loan data, or access tokens in test fixtures or logs.

## Current state
- Owner reports that a dummy lead saves and remains after refresh under the currently published rules.
- This is a data-persistence smoke test only; it does not verify tenant isolation or authorization.
- This checklist is documentation only; it does not change Firebase Console settings or deploy rules.
