# Staging Firebase Rules Execution Runbook

Updated: 2026-10-27

This runbook describes the next manual verification stage. It does not claim that deployed rules have been inspected or that authorization tests have passed.

## Current repository limitation
The repository does not contain `firebase.json`, `firestore.rules`, or `storage.rules` on the security branch. The Storage Rules proposal is under `security/proposed-storage-rules-staging.rules`. Do not assume Firebase deploys this file automatically.

## Safe execution sequence

1. In Firebase Console, select the exact project `heritage-crm-staging`.
2. Open Storage → Rules and copy the currently published rules to a dated backup outside the editor.
3. Compare the currently published rules with the proposed rules file in this branch. Stop if the project, bucket, schema, or rules differ.
4. Confirm the Firestore membership and lead document fields match the proposal: `status`, `tenantStatus`, `tenantId`, `role`, `branchIds`, `branchId`, `createdByUserId`, and `assignedStaffId`.
5. Run the tests in `security/STORAGE_RULES_AUTHORIZATION_TEST_MATRIX.md` using the Rules Playground or Firebase Emulator with synthetic accounts and records.
6. Record each test's actual result, date, account role, path used, and evidence. Expected outcomes alone are not a test result.
7. If any test differs from expected, do not publish. Adjust the proposal and repeat the full matrix.
8. Only after review, publish to staging and immediately rerun smoke tests for owner, manager, sales, viewer, suspended user, and unauthenticated user.
9. If smoke tests fail, restore the exact backup rules. Do not copy the proposal to production as part of this process.

## Specific caveats to resolve before any deployment
- Confirm whether the Firebase Storage bucket uses the default Firestore database referenced by `firestore.get(/databases/(default)/...)`.
- Confirm actual field names and role values against real staging schema.
- Confirm whether manager/sales delete access is intentionally denied.
- Confirm PDF/JPEG content-type allowlist meets the application's existing document requirements.
- Content-type metadata is not proof of actual file contents.
- The proposed rule file has not been syntax-validated by Firebase Emulator or deployed to Firebase in this workflow.

## Current verified status
- GitHub static review workflow passed on commit `f1fffb2507a59b75353b983bd7afb44ae8ff45ca`.
- This verifies selected textual safety controls are present; it does not verify Firebase Rules syntax or runtime behavior.
- Deployed Storage Rules, Firestore rules, and Firebase project settings have not been read directly by this repository workflow.
