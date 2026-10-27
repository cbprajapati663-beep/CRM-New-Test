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

## Important review notes
- Test create and update separately. Storage `request.resource` is the new object for writes; delete has no new object, so delete must not rely on `request.resource`.
- MIME type checks are not file-content validation. If files are high-risk, consider trusted backend validation/scanning.
- Confirm manager and sales deletion policy. Proposed rules intentionally restrict deletion to owner only.
- Firestore lookups have limits and may be billed; validate rule lookup count/caching and costs in the actual Firebase environment before broad rollout.
- Rules Playground checks should be followed by emulator/integration tests for authenticated identities and real path shapes.
- Do not claim this matrix passed until each test is run and evidence is recorded.
