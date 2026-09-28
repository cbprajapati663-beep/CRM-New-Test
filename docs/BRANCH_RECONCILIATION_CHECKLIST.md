# Auth Migration Branch Reconciliation Checklist

**PR:** #5 — Security: staged Firebase Auth migration plan  
**Working branch:** `security/auth-migration-plan-20260927`  
**Purpose:** Safely reconcile this staging-only migration branch with `main` without losing security checks or touching production.

## Latest checked baseline (2026-09-28)

- Migration branch head at latest review: `9ea5d49806aea5a736ab18328a107a3c0459a221`.
- `main` head: `f9e93faab6f62ad1bb85973c3f1675496fea7d5f`.
- Merge base: `e5cfaae0f0a61a98f2593767c39076eaca973853`.
- Compare result: **68 commits ahead / 8 behind; branches are diverged**.
- PR #5 is draft, open, unmerged, and GitHub reports it as not mergeable.
- Latest-head workflow lookup returned no PR workflow runs and combined status returned no status checks. This is **not a passing CI result**.

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


## Latest progress checkpoint (2026-09-28, refreshed)

- Re-fetched PR #5: head is `9ea5d49806aea5a736ab18328a107a3c0459a221`; PR remains open, draft, unmerged, and reported not mergeable.
- Refreshed comparison: `main` is `f9e93faab6f62ad1bb85973c3f1675496fea7d5f`; migration branch is 68 commits ahead and 8 behind; merge base remains `e5cfaae0f0a61a98f2593767c39076eaca973853`.
- Workflow lookup and combined commit status for the exact branch head returned no runs/status checks. CI is still unverified.
- No branch merge, force update, production deployment, Firebase config/rules change, or live-data change was performed.
- Next action: inspect the 8 main-only commits and their changed paths, then prepare a deliberate reconciliation commit only after file-level conflicts and security-sensitive overlaps are understood.


## Main-only commit review and selective fix port (2026-09-28)

Reviewed the 8 commits unique to `main` since merge base `e5cfaae0f0a61a98f2593767c39076eaca973853`:

- `e5e2d13278` — authorization matrix draft (same blob already present on migration branch).
- `b5eb00642c` — initial staging auth smoke-page test (migration branch has a larger hardened version; retain branch version).
- `ad74cce6cd` and `d25bf61951` — staging config add/syntax fix. The live config file is not copied; branch keeps the config gitignored/local-only.
- `2560259400`, `684d0a492f`, `ec453da744` — dashboard visibility fixes.
- `f9e93faab6` — payout badge escaping/safe CSS token fix.

Selective port committed to the migration branch:
- Hardened view visibility in `assets/js/app.js` using important display state, `hidden`, `aria-hidden`, and plan-feature gating.
- Updated feature-gate visibility so inactive operational views stay hidden.
- Sanitized payout badge CSS token and escaped payout status text.
- Commit: `b54df256c2645f90aeff0df8c665ee769436c6ed`.

**Validation limitation:** The GitHub file update succeeded, but no local test runner was available here. Syntax, browser behavior, and CI remain unverified. Do not treat this as a tested or merged change.


## Fresh process checkpoint (2026-09-28, 17:35 IST)

- Fresh PR metadata reports head `7ff2ea4533182e761e8bdd1f156451b308e734b9`, base `main`, state open, draft, unmerged, and `mergeable: false`.
- Fresh comparison reports `main` at `f9e93faab6f62ad1bb85973c3f1675496fea7d5f`, merge base `e5cfaae0f0a61a98f2593767c39076eaca973853`, with **71 commits ahead / 8 behind** (diverged). This supersedes the older 68-ahead checkpoint above.
- The current head workflow lookup returned an empty list of PR workflow runs. This is an absence of CI evidence, not a passing result.
- The PR description's older head/count fields are stale; use the live PR metadata and comparison above as the current baseline.
- No reconciliation merge, force-push, production deployment, or Firebase production configuration/data/rules change was performed.
- Next safe step remains path-by-path conflict and overlap review followed by validation on an exact reconciled commit. Do not merge while GitHub reports the PR as not mergeable or staging tenant-isolation evidence is missing.


## Main-only commit content review (freshly inspected)

Reviewed the actual patches for the eight main-only commits listed in the earlier review:

- `e5e2d13278` adds the authorization matrix. The branch already contains the same document content; no duplicate copy needed.
- `b5eb00642c` adds an initial smoke-page test. Keep the branch's expanded/hardened test version rather than replacing it with the shorter initial test.
- `ad74cce6cd` and `d25bf61951` add/fix a staging Firebase config file. Do not port the config file or its values into the migration branch; keep the staging config outside version control and use the placeholder template only.
- `2560259400` changes dashboard initialization order so feature gates apply before selecting the default view.
- `684d0a492f` makes feature-gated views remain hidden unless their navigation tab is active.
- `ec453da744` enforces one active dashboard view with important visibility, `hidden`, and `aria-hidden` handling.
- `f9e93faab6` sanitizes payout badge CSS classes and escapes payout status text.

The migration branch's `assets/js/app.js` contains the selective dashboard-visibility and payout-rendering changes described above. This was a source inspection only; it is not a browser/runtime test. The staging config commit contents were reviewed but not copied.

## Process checkpoint (2026-09-28, 17:37 IST)

- The main-only patch review is complete for the eight identified commits. No blind merge or force-push was performed.
- Latest PR head after this checklist update: `8b3d0110d330e6567deecc8e3543585a3bcba39e`; PR remains open, draft, unmerged, and not mergeable.
- Current compare remains diverged: 72 commits ahead / 8 behind, with merge base `e5cfaae0f0a61a98f2593767c39076eaca973853` and main at `f9e93faab6f62ad1bb85973c3f1675496fea7d5f`.
- CI/test status remains unverified. The next step is to inspect full changed-file overlap and plan a safe reconciliation strategy; do not merge or cut over without conflict resolution and staging security evidence.
