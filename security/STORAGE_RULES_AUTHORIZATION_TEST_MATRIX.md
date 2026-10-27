# Storage Rules Authorization Test Matrix

Status: test plan only. No Firebase Emulator or live Rules Playground execution is claimed by this file.

Target: `heritage-crm-staging` only. Never select production for these tests.

## Preconditions
- [ ] Confirm the deployed Storage Rules text matches `security/proposed-storage-rules-staging.rules`.
- [ ] Confirm the deployed Firestore schema and membership field names match the rules.
- [ ] Use synthetic test data and test accounts only.
- [ ] Have a rollback copy of the currently deployed Storage Rules.
- [ ] Confirm allowed upload types with the business owner; proposed list currently permits PDF and JPEG/JPG only.

## Expected-results matrix

| Test | Account/context | Action | Expected |
|---|---|---|---|
| S-01 | Unauthenticated | Read a customer document | DENY |
| S-02 | Unauthenticated | Upload a customer document | DENY |
| S-03 | Viewer, active, authorized branch | Read document for that branch's lead | ALLOW |
| S-04 | Viewer, active, authorized branch | Upload/update a document | DENY |
| S-05 | Viewer, active, authorized branch | Delete a document | DENY |
| S-06 | Sales, active, created lead | Read/upload allowed PDF/JPEG | ALLOW |
| S-07 | Sales, active, unrelated lead | Read/upload/delete | DENY |
| S-08 | Manager, active, authorized branch | Read/upload allowed PDF/JPEG | ALLOW |
| S-09 | Manager, active, unauthorized branch | Read/upload/delete | DENY |
| S-10 | Owner, active, same tenant | Read/upload/delete same-tenant lead file | ALLOW |
| S-11 | Any role, tenant A | Access tenant B path or tenant B lead | DENY |
| S-12 | Suspended/inactive membership | Read/upload/delete | DENY |
| S-13 | Active role allowed to upload | Upload file larger than 25 MiB | DENY |
| S-14 | Active role allowed to upload | Upload text/html or unsupported MIME type | DENY |
| S-15 | Active role allowed to upload | Upload PDF/JPEG under size limit | ALLOW |
| S-16 | Missing membership document | Read/upload/delete | DENY |
| S-17 | Missing lead document | Read/upload/delete | DENY |
| S-18 | Any role | Access any path outside customer-documents | DENY |

## Rules Playground observations — 2026-10-27

These are manual simulations against the **unpublished rules currently shown in the Firebase Console editor** for project `heritage-crm-staging`. They are not emulator tests, actual file operations, or evidence of deployed rules.

| Observed check | Simulated context/action | Screenshot result | Assessment |
|---|---|---|---|
| P-01 | Viewer UID `Gyx1jn3PEbcM3TCzUvCw0wqNEft1`, create at `customer-documents/tenant-a/lead-a/test.pdf` | Simulated write denied | Matches expected |
| P-02 | Same Viewer, get at tenant-b/lead-b path | Simulated read denied | Matches expected |
| P-03 | Owner UID `AlJhW4PmD1WUfcUJWsFNnWl73nU2`, delete at tenant-a/lead-a path | Simulated write allowed | Matches expected; underlying membership/lead records still need independent confirmation |
| P-04 | Same Viewer, update at tenant-a/lead-a path | Simulated write denied | Matches expected |
| P-05 | Unauthenticated get at tenant-a/lead-a path | Simulated read denied | Matches expected |

These observations only record the visible Playground results. They do not prove the rules are syntactically/runtime-valid in the Emulator or deployed to Firebase. The exact test object path may be simulated without an actual object existing.


| P-07 | Authenticated synthetic UID with no membership document, get at tenant-a/lead-a path | Playground raised null-value error while evaluating `membership().status` | Not a pass; proposal now adds `firestore.exists()` guards and must be retested |

A follow-up commit updates the proposal to check membership and lead document existence before reading their fields. This is a source change only; it has not yet been validated by Emulator or deployed. Retry P-07 against the refreshed unpublished editor rules and confirm the result is a normal deny, not a simulator error.


## Important review notes
- Test create and update separately. Storage `request.resource` is the new object for writes; delete has no new object, so delete must not rely on `request.resource`.
- MIME type checks are not file-content validation. If files are high-risk, consider trusted backend validation/scanning.
- Confirm manager and sales deletion policy. Proposed rules intentionally restrict deletion to owner only.
- Firestore lookups have limits and may be billed; validate rule lookup count/caching and costs in the actual Firebase environment before broad rollout.
- Rules Playground checks should be followed by emulator/integration tests for authenticated identities and real path shapes.
- Do not claim this matrix passed until each test is run and evidence is recorded.


## Additional Rules Playground observations — 2026-10-27

The following were reported with screenshots by the project owner while the editor still showed **unpublished changes**. These are simulations only, not deployed-rule or actual object-operation tests.

| Observed check | Simulated context/action | Screenshot/result reported | Assessment |
|---|---|---|---|
| P-06 | Inactive sales member UID `1UQ2aFCrSMNq8accU71u6IJURx72`, get tenant-a/lead-a | Simulated read denied | Matches expected; synthetic account UID and membership record should be kept aligned in final test evidence |
| P-07 retest | Authenticated UID with no membership document, get tenant-a/lead-a | Simulated read denied; prior null-value error not shown in retest | Matches expected in Playground; still requires Emulator validation |
| P-08 | Viewer UID `Gyx1jn3PEbcM3TCzUvCw0wqNEft1`, get tenant-a/lead-a | Simulated read allowed | Matches expected; confirm membership/lead fixtures remain unchanged |
| P-09 | Same Viewer, create `customer-documents/tenant-a/lead-a/test.pdf`, metadata size 1024 and contentType application/pdf | Simulated write denied | Matches expected |
| P-10 | Same Viewer, delete `customer-documents/tenant-a/lead-a/test.pdf` | Simulated write denied | Matches expected |
| P-11 | Owner UID `AlJhW4PmD1WUfcUJWsFNnWl73nU2`, delete tenant-a/lead-a | Simulated write allowed | Matches expected; confirm membership and lead fixture before relying on it |
| P-12 | Manager UID `6Fe8vrLA1afkgKzDuOU48M7KEva2`, create tenant-a/lead-a PDF, metadata size 1024 | Simulated write allowed | Matches expected |
| P-13 | Viewer UID `Gyx1jn3PEbcM3TCzUvCw0wqNEft1`, get path using deliberately missing lead ID `lead-missing-20261027` | User confirmed exact path used; simulated read denied | Matches expected |

### Still outstanding before any staging publish

- [ ] Sales member: own created/assigned lead allowed; unrelated same-tenant lead denied.
- [ ] Inactive membership: deny read, create, update, and delete (only read denial has been shown in this run).
- [ ] Manager on unauthorized branch: deny read/upload.
- [ ] Owner/manager/sales cross-tenant paths and cross-tenant lead IDs: deny.
- [ ] Unsupported MIME type denied.
- [ ] Size at or above 25 MiB denied; test below-limit allowed for permitted roles.
- [ ] Run Firebase Emulator Suite authorization tests; Rules Playground alone is not enough.
- [ ] Verify actual deployed staging rules and keep a rollback copy before publish.

