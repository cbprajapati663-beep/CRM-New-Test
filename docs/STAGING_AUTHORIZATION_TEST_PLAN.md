# Staging Authorization Test Plan

**Status:** Planned; no authorization tests have been executed.  
**Environment:** Firebase project `heritage-crm-staging` only.  
**Prerequisite:** Use synthetic records and dedicated test identities. Never use production customer data or production credentials.

## Purpose

Validate identity-to-tenant binding and server-enforced access controls before any production authentication migration. A successful email/password sign-in alone is not proof of CRM authorization.

## Required test identities

Create separate staging-only identities and synthetic tenant records:

- Platform administrator (only if the intended admin model is defined and enforced server-side).
- Tenant A owner/admin.
- Tenant A staff member with limited permissions.
- Tenant B owner/admin.
- Unauthenticated visitor.
- Disabled/revoked user.

Record the Firebase Auth UID and intended tenant/role mapping in a restricted staging test record. Do not store passwords or tokens.

## Authorization invariants

1. Every protected request must be authenticated and authorized by trusted server-side rules or backend code; client-side route hiding, feature flags, localStorage, and UI permissions are not authorization.
2. A tenant-scoped identity may access only records whose tenant ownership is established by a trusted mapping, not by a client-supplied tenant ID.
3. Staff permissions must be checked on every protected operation, including direct document reads/writes and file access.
4. Tenant IDs, roles, permissions, and ownership must not be escalatable by changing client payloads or document fields.
5. Unknown, missing, disabled, or inconsistent identity mappings must fail closed.
6. Storage access must independently enforce authentication, tenant ownership, and allowed file paths/types/size as applicable.
7. Admin privileges must be explicitly defined and tested; a client-side “master” flag or local fallback is not sufficient.

## Test matrix

Run only after the staging data model and rules have been reviewed. Mark each result Pass/Fail/Not run and attach redacted evidence.

| ID | Scenario | Expected result | Result |
|---|---|---|---|
| AUTH-01 | Unauthenticated read of protected tenant data | Denied | Not run |
| AUTH-02 | Unauthenticated create/update/delete | Denied | Not run |
| TEN-01 | Tenant A reads its own permitted synthetic record | Allowed | Not run |
| TEN-02 | Tenant A attempts direct read of Tenant B record by known document ID | Denied | Not run |
| TEN-03 | Tenant A attempts create with Tenant B tenantId | Denied or server-assigned Tenant A ownership | Not run |
| TEN-04 | Tenant A attempts update changing tenantId/owner/role | Denied | Not run |
| TEN-05 | Tenant A attempts delete of Tenant B record | Denied | Not run |
| STAFF-01 | Staff reads permitted record within Tenant A | Allowed only if permission grants it | Not run |
| STAFF-02 | Staff attempts operation outside assigned permission | Denied | Not run |
| STAFF-03 | Staff attempts to grant self elevated role/permissions | Denied | Not run |
| STAFF-04 | Disabled/revoked staff attempts protected access | Denied | Not run |
| FILE-01 | Tenant A uploads/reads its own allowed synthetic file | Allowed within policy | Not run |
| FILE-02 | Tenant A reads/downloads Tenant B file by guessed path | Denied | Not run |
| FILE-03 | Unauthenticated upload/read/delete | Denied | Not run |
| FILE-04 | File path contains mismatched tenant/lead IDs | Denied | Not run |
| ADMIN-01 | Unprivileged tenant user attempts platform-admin operation | Denied | Not run |
| ADMIN-02 | Authorized admin performs explicitly allowed action | Allowed and audited as designed | Not run |
| MAP-01 | Auth UID has no trusted tenant mapping | Denied | Not run |
| MAP-02 | Auth UID mapping is duplicated, malformed, or inconsistent | Denied and surfaced for review | Not run |
| REG-01 | Existing authorized staging workflow remains functional after rules | Expected workflow succeeds | Not run |

## Execution and evidence

1. Confirm the Firebase Console project ID is exactly `heritage-crm-staging`.
2. Use Firebase Emulator Suite where practical; otherwise use isolated staging with synthetic data only.
3. Exercise access both through the UI and direct SDK/API calls, including known document IDs and manipulated payloads.
4. Capture redacted rule-evaluation output and test results. Never include credentials, tokens, customer information, or secret configuration.
5. Repeat relevant tests after every rules/schema change.
6. Record the rules version/commit, test date, tester, and cleanup confirmation in the test record.

## Exit criteria

Do not approve production cutover until:
- The authoritative Auth UID-to-tenant/role mapping is documented and reviewed.
- Firestore and Storage rules enforce the invariants above.
- All applicable negative cross-tenant and privilege-escalation tests pass.
- Required positive workflow and regression tests pass.
- Backup and restore are verified, and a rollback plan is rehearsed.
- A separate reviewer signs off on evidence.

**Important:** This document is a plan, not evidence of completed tests. It does not authorize production rules changes, data migration, or deployment.
