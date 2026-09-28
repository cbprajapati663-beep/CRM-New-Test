# Auth Migration Branch Reconciliation Checklist

**PR:** #5 — Security: staged Firebase Auth migration plan  
**Working branch:** `security/auth-migration-plan-20260927`  
**Purpose:** Safely reconcile this staging-only migration branch with `main` without losing security checks or touching production.

## Current baseline (2026-09-28)

- Latest checked branch head: `dec73b9a53074765a41f7be2f49ae1bb5a0b4a30`.
- Latest checked `main` head: `f9e93faab6f62ad1bb85973c3f1675496fea7d5f`.
- Merge base: `e5cfaae0f0a61a98f2593767c39076eaca973853`.
- Compare result: **66 commits ahead / 8 behind; branches are diverged**.
- PR #5 is draft, open, unmerged, and GitHub currently reports it as not mergeable.
- The migration branch contains expanded staging auth smoke-page tests. Preserve those assertions when reconciling the same path from `main`.
- The authorization matrix draft exists in the migration branch; verify the main-branch copy before changing either version.
- CI for the exact current head, real staging sign-in, and tenant-isolation verification are not confirmed.

## Safe reconciliation sequence

1. Refresh both `main` and the migration branch refs; record their exact SHAs and compare the current merge base.
2. Review all main-only commits and changed paths. Do not blindly merge or force-push.
3. For `docs/AUTHORIZATION_MATRIX_DRAFT.md`, compare both versions and preserve useful content without duplicating the document.
4. For `tests/staging/auth-smoke-page.test.cjs`, retain the migration branch's expanded isolation, password-handling, and fail-closed assertions; incorporate any valid main-branch coverage.
5. Review every remaining overlapping file and ensure production entry points/configuration remain untouched.
6. Run repository validation and staging guard tests on the reconciled branch; inspect workflow results tied to the exact commit.
7. Recheck divergence, PR mergeability, changed files, and CI status. Keep the PR draft until staging auth and tenant-isolation evidence is recorded.

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
