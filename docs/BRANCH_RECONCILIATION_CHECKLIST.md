# Auth Migration Branch Reconciliation Checklist

**PR:** #5 — Security: staged Firebase Auth migration plan  
**Working branch:** `security/auth-migration-plan-20260927`  
**Purpose:** Safely reconcile this staging-only migration branch with `main` without losing security checks or touching production.

## Latest checked baseline (2026-09-28)

- Migration branch head before this checklist update: `f3cf04e853d48162475dc5677ac9c98875ee460f`.
- `main` head: `f9e93faab6f62ad1bb85973c3f1675496fea7d5f`.
- Merge base: `e5cfaae0f0a61a98f2593767c39076eaca973853`.
- Compare result: **67 commits ahead / 8 behind; branches are diverged**.
- PR #5 is draft, open, unmerged, and GitHub reports it as not mergeable.
- Current-head workflow lookup returned no PR workflow runs and combined status returned no status checks. This is **not a passing CI result**.

## Conflict/path review performed

- `docs/AUTHORIZATION_MATRIX_DRAFT.md`: fetched from both `main` and the migration branch. Both have the same blob SHA `4db94f4844c51267a30ca3879034910e7656d13c`; no content reconciliation is needed for this file at the checked refs.
- `tests/staging/auth-smoke-page.test.cjs`: main version blob `56e0c5aa0a4dd8f2ba926792fb373bde2d974b71`; migration branch version blob `a99387692144e98b8668d28e2c85fc586d8a59b9`. The migration branch has additional guards for production-project isolation, no session persistence, sign-out failure, password clearing, busy controls, reset validation, safe text rendering, and fail-closed setup. Preserve the expanded branch version and review any main-only coverage before merging.
- The branch's staging config remains intentionally local/ignored; do not commit Firebase config or secrets.

## Safe reconciliation sequence

1. Refresh both refs and record exact SHAs and the merge base.
2. Review all main-only commits and changed paths. Do not blindly merge or force-push.
3. Preserve the identical authorization matrix without duplicating it.
4. Retain the expanded branch smoke-page assertions and incorporate any verified missing coverage.
5. Review all remaining overlaps and ensure production entry points/configuration remain untouched.
6. Run repository validation and staging guard tests on the reconciled branch; inspect results tied to the exact commit.
7. Recheck divergence, PR mergeability, changed files, and CI. Keep the PR draft until staging auth and tenant-isolation evidence is recorded.

## Hard safety gates

- Do not force-update the branch to discard history.
- Do not merge PR #5 or deploy production as part of conflict resolution.
- Do not add Firebase config, service-account credentials, customer data, or passwords to source control.
- Do not change production Firebase settings, Firestore data, Storage data, or deployed Rules.
- If conflicts cannot be resolved with verified file contents, stop and document the exact paths.

## Completion evidence

- [x] Current base/head SHAs and merge base recorded
- [x] Authorization matrix content compared; identical blob confirmed
- [x] Smoke-page test versions compared; branch has additional security assertions
- [ ] All conflicts resolved and reviewed
- [ ] Staging guard tests and repository validation pass
- [ ] CI results tied to exact reconciled head
- [ ] Staging sign-in and cross-tenant denial tests documented
- [ ] PR remains unmerged pending explicit release approval
