# Firestore Data-Access Inventory (Preliminary)

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Purpose:** Record Firestore collection/path names found by static inspection to prepare a schema-backed authorization design. This is not a complete field schema or deployable Ruleset.

## Collections and paths observed

| Collection/path | Observed use / notes | Authorization design still required |
|---|---|---|
| `leads/{leadId}` | Main CRM lead records; lead scoping is also performed in browser code. | Establish canonical tenant ownership field and all allowed create/read/update/delete operations. |
| `tenants/{tenantDocId}` | Tenant profiles, tenant lookup by `tenantId`, license/status updates, and legacy login reads. | Define trusted tenant membership mapping; prevent clients changing role, tenant ID, status, subscription, or privileged fields. |
| `staffAccounts/{staffId}` | Staff login/account lookup and staff identity data. | Define immutable Auth UID mapping, tenant assignment, active/deleted status, and trusted permission provisioning. |
| `tenants/{tenantDocId}/staff/{staffId}` | Nested staff profile reads/writes are present. | Determine whether this duplicates `staffAccounts`; define consistency and least-privilege access. |
| `payoutSecurity/{documentId}` | Payout-related security records, including code paths referring to `master` and tenant-specific identifiers. | Treat as highly sensitive; identify trusted-only operations and audit requirements. |
| `activity/{activityId}` | Activity/audit-style records referenced in app code. | Determine whether clients can write events and prevent tampering/deletion of audit records. |
| `branches/{branchId}` | Branch-related records and staff/branch operations. | Map each branch to canonical tenant ownership and enforce staff branch permissions server-side. |

## Static-inspection limitations

- This inventory is based on collection/path references found in the current browser application source. It is not a full inventory of every document field, query, mutation, Firebase Storage path, or any backend service.
- Collection names and path patterns are not sufficient to author safe Firestore Rules. Exact data shape, tenant ownership fields, and every read/write operation must be mapped and tested.
- Existing browser-side filtering, localStorage sessions, and client-side permission checks are not security boundaries.
- No application code, Firebase settings, live records, or deployed Rules were changed during this inventory.
- Do not use real customer or staff records as staging fixtures. Use synthetic tenant A/B data only.

## Next schema-mapping tasks

1. Map fields written/read for each collection, including nested documents and batch/transaction operations.
2. Identify every create/update/delete call and classify it as tenant, staff, admin, or trusted-server operation.
3. Confirm canonical tenant ownership and branch ownership fields from actual records using a secure, read-only owner-side review; do not paste personal/customer data into GitHub.
4. Draft a role/operation matrix, then implement staging-only rules and automated cross-tenant denial tests.
5. Keep production Rules unchanged until staging tests, backup/restore, and rollback checks pass.

## Immediate security note

Previously owner-provided production Rules permitted broad reads/writes until the configured expiry date. Treat the production database as exposed during that window. Restrict access through a controlled, tested incident/remediation process; do not deploy a guessed replacement ruleset that could lock out the live CRM or fail to enforce tenant boundaries.
