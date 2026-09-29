# Security Test Readiness Checklist

**Reviewed:** 2026-09-29  
**Branch:** `fix/tenant-plan-limits-20260928`  
**Purpose:** Track what must be in place before running tenant-isolation or authorization tests. This checklist does not claim that tests have run.

## Gate status

| Gate | Status | Evidence / next action |
|---|---|---|
| Confirm environment project ID | Partial | Staging config check exists; full CRM entrypoint still points to production project. |
| Separate staging-only app entrypoint | Pending | Route the test build to staging config and add a hard project-ID guard. |
| Firebase Auth identity | Pending | Existing app login is not Firebase Auth; define UID membership before tests. |
| Firestore rules model | Pending | No reviewed rules file/schema available; maintain deny-by-default. |
| Seed isolated test identities | Pending | Do not create accounts in production; prepare disposable staging/emulator users only after approval. |
| Tenant A/B fixture data | Pending | Create synthetic, non-customer fixtures with explicit tenant ownership in an isolated test environment. |
| Role/branch test matrix | Pending | Approve expected read/write outcomes for owner/admin/manager/staff/viewer and cross-branch cases. |
| Negative access tests | Pending | Verify unauthenticated, wrong-tenant, wrong-role, disabled-user, and deleted-user requests are denied. |
| Plan cap tests | Partial | Static/client tests exist; server/rules enforcement and concurrent writes remain unresolved. |
| Backup/restore test | Pending | Define backup scope, secret exclusion, restore validation, and rollback steps. |
| Browser smoke test | Pending | Staging check page is not a full CRM sign-in or tenant-isolation test. |
| CI evidence | Needs refresh | Verify workflow results for the current branch head before relying on earlier workflow numbers. |

## Minimum test cases once the environment and policy are approved

1. Anonymous client cannot read or write any protected collection.
2. Authenticated tenant A cannot read, query, create, update, or delete tenant B's lead, staff, branch, tenant settings, or activity.
3. A staff member can access only the tenant and branch scope explicitly granted by the approved policy.
4. A user whose membership is disabled or removed loses access on the next authorized request.
5. Client-supplied `tenantId`, `role`, `agencyName`, and local-storage edits cannot elevate access.
6. Payout-security records are inaccessible to all roles not explicitly authorized.
7. Plan-limit boundary and simultaneous-create tests demonstrate the actual enforcement boundary; UI-only checks must not be counted as secure enforcement.
8. Existing CRM workflows (login, lead create/edit, document metadata, assignment, reporting, payout flow, backup/restore) pass regression checks in the isolated environment.

## Stop conditions

- Stop if the test app connects to `heritage-crm-f179a` or any unapproved project.
- Stop if a test requires customer data, production credentials, a paid Firebase tier, or billable service activation.
- Stop if the expected role/tenant policy is ambiguous; do not invent permissive rules.
- Do not merge or deploy based on static checks alone.
