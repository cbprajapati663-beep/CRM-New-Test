# Plan Limits — Focused Code Review Notes

**Reviewed:** 2026-09-29  
**Branch:** `fix/tenant-plan-limits-20260928`  
**Status:** Findings only; no production or Firebase changes.

## Findings to address before treating caps as reliable

### 1. Lead count uses client-loaded data
`getTenantLeadCount()` filters the in-memory `leads` array. If the app loads only a page, subset, or stale snapshot, the displayed count may be lower than the actual tenant total. A client-side count is advisory and must not be treated as authoritative.

**Follow-up:** Define how all tenant leads are counted in the approved data model; test empty, partial, stale, and cross-tenant data sets. Do not introduce billable backend services without explicit approval.

### 2. Legacy ownership fallback is ambiguous
For IDs containing `heritage`, the helper counts leads with missing owner or owner `admin`. This may mix legacy records with tenant records and makes the tenant boundary depend on a name substring.

**Follow-up:** Replace name-based fallback only after an explicit ownership migration/quarantine rule is approved. Missing-owner records should not silently be assigned to a tenant by a substring heuristic.

### 3. Plan limits are UI guards, not hard limits
Staff, branch, and lead checks run in browser code. A client can bypass them through direct Firestore requests, and two simultaneous creates can both pass a stale count.

**Follow-up:** Keep labels and user-facing notices, but mark enforcement as client-side/advisory. Any authoritative enforcement must use an approved trusted mechanism compatible with the owner's free-tier constraint; if no such mechanism is available, document the limitation rather than claiming hard enforcement.

### 4. Resource count semantics need confirmation
Current staff/branch checks count records whose status is not exactly `Inactive`. Confirm how missing, disabled, deleted, pending, and malformed statuses should count before changing behavior.

**Follow-up:** Approve the status/counting policy and add boundary tests for activation, reactivation, edits, and concurrent changes.

## Regression test cases to add after policy decisions

- Lead count for a tenant with exact ownership only.
- Tenant A count excludes tenant B, ownerless, and unrelated legacy records.
- Lead count behavior when the local lead array is incomplete.
- Staff and branch activation at limit, one below limit, and already-active edits.
- Unknown plan and invalid custom limits.
- Parallel create attempts and direct-write bypass documented as unsupported by client-only checks.

## Safety gate

No Firestore Rules, Firebase Auth users, customer records, billing settings, or deployments were changed. Do not merge/deploy based on this static review alone.
