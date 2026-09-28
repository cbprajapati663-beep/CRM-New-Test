# Auth Migration Branch Reconciliation Checklist

**PR:** #5 — Security: staged Firebase Auth migration plan  
**Working branch:** `security/auth-migration-plan-20260927`  
**Purpose:** Safely reconcile this staging-only migration branch with `main` without losing security checks or touching production.

## Current baseline (2026-09-28)

- Branch comparison previously reported 65 commits ahead and 8 behind; the branch is diverged.
- PR #5 is draft, open, and unmerged.
- The branch contains expanded staging auth smoke-page tests. Preserve those assertions when reconciling the same path from `main`.
- The authorization matrix draft exists in the migration branch; compare its contents with the version on `main` before deciding which version to retain.
- CI, real staging sign-in, and tenant-isolation verification are not confirmed for the current head.

## Safe reconciliation sequence

1. Refresh both `main` and the migration branch refs; record their exact SHAs and compare the current merge base.
2. Review every main-only commit and changed path. Do not blindly merge or force-push.
3. For `docs/AUTHORIZATION_MATRIX_DRAFT.md`, compare both versions and preserve any distinct useful content without duplicating the document.
4. For `tests/staging/auth-smoke-page.test.cjs`, retain the migration branch's expanded isolation, password-handling, and fail-closed assertions; incorporate any valid main-branch coverage.
5. Review all remaining overlapping files and ensure production entry points/configuration remain untouched.
6. Run repository validation and staging guard tests on the reconciled branch; inspect the exact commit's workflow results.
7. Recheck branch divergence, PR mergeability, changed files, and CI status. Keep the PR draft until staging auth and tenant-isolation evidence is recorded.

## Hard safety gates

- Do not force-update the branch to discard history.
- Do not merge PR #5 or deploy production as part of conflict resolution.
- Do not add real Firebase config, service-account credentials, customer data, or passwords to source control.
- Do not change production Firebase settings, Firestore data, Storage data, or deployed Rules.
- If conflicts cannot be resolved with verified file contents, stop and document the exact paths rather than guessing.

## Completion evidence

- [ ] Current base/head SHAs and merge base recorded
- [ ] Conflicts resolved and reviewed
- [ ] Staging guard tests and repository validation pass
- [ ] CI results tied to the exact reconciled head
- [ ] Staging sign-in and cross-tenant denial tests documented
- [ ] PR remains unmerged pending explicit release approval
