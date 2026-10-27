# Proposed Firebase Storage Rules — staging only

Status: PROPOSAL ONLY. This file has not been deployed. Do not paste/publish to production.

## Changes from the supplied staging rules
- Separates read, create/update, and delete permissions. This avoids granting delete merely because a user can read a file.
- Viewer can read only files for leads in their authorized branch, but cannot upload/update/delete.
- Upload/update is limited to active owner/manager/sales memberships with lead access, files under 25 MiB, and PDF/JPEG content types.
- Delete is restricted to active tenant owners as a conservative starting policy.
- Keeps tenant and lead ownership checks and default-deny for other paths.

## Before deploying to staging
1. Confirm these role policies match the intended business workflow, especially whether managers or sales should delete files.
2. Confirm existing upload formats. This proposal allows PDF and JPEG only; add PNG or other formats only if required.
3. Test upload create/update, read, and delete separately using owner, manager, sales, viewer, suspended, unauthenticated, and cross-tenant accounts.
4. Test malformed/missing membership documents and missing lead documents; all must fail closed.
5. Confirm Firebase Storage Rules support and syntax using Rules Playground / emulator, then publish to staging only.
6. Run CRM regression tests and verify the production project is not selected.

## Limitations
- Content-type metadata checks do not prove that a file's bytes match its claimed type.
- This proposal has not been syntax-tested or emulator-tested in this repository-only step.
- Firestore membership/lead lookups must remain consistent with the deployed Firestore schema.
