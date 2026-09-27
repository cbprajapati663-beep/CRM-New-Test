# Firestore Schema Field Map (Static-Code Draft)

**Repository:** `cbprajapati663-beep/CRM-New-Test`  
**Branch:** `security/auth-migration-plan-20260927`  
**Status:** Static source review only. This is not a database export, complete schema, or deployable Ruleset.

## Purpose and safety

This draft records field names and access patterns visible in browser code to guide a later owner-side schema review. It does not verify that every field exists in stored documents. No customer records were read or copied. No application code, Firebase configuration, production data, or deployed Rules were changed.

## Collection/path map

| Path | Fields/shape observed in code | Operations/purpose visible | Security notes |
|---|---|---|---|
| `tenants/{docId}` | `tenantId`, `agencyName`, `headOffice`, `contactPhone`, `role`, legacy `password`, `rentAmount`, `expiryDate`, `status`, `suspensionReason`, `suspendedAt`, `updatedAt`, `subscriptionPlan`, `featureAccess`, `rolePermissions` | Query/list tenant records; create default tenant; update license/status and tenant settings; delete tenant; legacy login lookup | Password and authorization fields must not be readable/writable by ordinary clients. Tenant doc ID is not guaranteed to equal visible `tenantId`. Default-tenant auto-creation and browser-driven status updates must be moved to trusted provisioning/operations. |
| `staffAccounts/{staffId}` | `loginId`, `tenantId`, account/password-hash-related fields (exact complete schema not verified), status/permission fields referenced through account/session flow | Query by `loginId`; create/update staff account; account lookup | Must map immutable Auth UID, tenant assignment, active/deleted status and permissions. Password hashes/salts must not be client-readable. Exact fields and deletion behavior require source/record review. |
| `tenants/{tenantDocId}/staff/{staffId}` | Staff profile fields are read; exact complete field list not verified | Fetch nested staff profile | Determine whether this duplicates top-level `staffAccounts`; enforce tenant match and trusted provisioning. |
| `leads/{leadId}` | `tenantId`, `createdBy`, `createdByUser`, `updatedBy`, `updatedByUserName`, `createdAt`, `updatedAt`, `status`, `documents`, `documentChecklistUpdatedBy`, `doDateKey`, `doSequence`, `doNo`, `applicationNo`; many customer/vehicle/finance fields exist but are not exhaustively mapped here | Create/read/update/delete lead; update status/follow-up/DO/document checklist; query DO sequence; transaction updates | Canonical immutable tenant ownership must be enforced server-side. Client-settable ownership/audit fields are spoofable unless protected. Customer data needs tenant isolation. |
| `leads/{leadId}/activity/{activityId}` | `tenantId`, `createdBy`, `createdAt`, activity type/details (varies by event) | Add activity notes/events; read latest activity history | Client-generated audit entries can be forged. Consider trusted append-only audit service/rules; prevent unauthorized read/delete. |
| `payoutSecurity/{documentId}` | Tenant record: `tenantId`, `passwordHash`, `salt`, `updatedAt`, `updatedBy`, `resetByAdmin`; special document ID `master` | Read own tenant record; read master record; set/change/reset payout credentials | Highly sensitive. Master/universal credential data must be server-only; never permit broad tenant reads or client-chosen privilege. |
| `branches/{branchId}` | Exact field list not verified; branch ID/name and tenant/branch association used in UI logic | Branch management and branch filtering | Map canonical tenant and branch ownership; enforce branch permissions in trusted authorization. |
| Firebase Storage: `customer-documents/{tenantId}/{leadId}/...` | Object custom metadata: `tenantId`, `leadId`, `category`, `originalName`; file records include path/bucket/content type/size/uploader | Upload/delete customer documents; document references saved on lead | Storage Rules must verify authenticated UID-to-tenant mapping and lead ownership; client-supplied metadata is not authorization evidence. |

## Authorization implications observed

1. Browser code performs tenant filtering and permission/UI checks. These are not security boundaries.
2. Client-supplied `tenantId`, `createdBy`, `updatedBy`, role, or permission values cannot be trusted as proof of identity.
3. Several sensitive operations (tenant provisioning/deletion, license status changes, payout master/reset operations, staff provisioning) currently originate in browser code and need trusted-server authorization.
4. Firestore Rules alone cannot safely implement password verification or arbitrary privileged workflows; use Firebase Auth plus trusted server-side provisioning/operations where needed.
5. Storage access must be reviewed alongside Firestore; a Firestore-only migration is incomplete.

## Unverified items / next steps

- Verify active Firebase project and hosting target before any environment change.
- Review all source call sites and exact document field requirements, including remaining lead fields, staff fields, branches, payout paths, batch/transaction operations, and Storage access.
- On the owner side, inspect schema using a secure read-only process and synthetic staging fixtures; do not export customer PII or secrets into GitHub.
- Confirm identity mapping and tenant membership model; decide which operations are trusted-server-only.
- Draft staging-only default-deny Firestore and Storage rules against the verified schema; add emulator tests for unauthenticated denial, cross-tenant denial, role/branch boundaries, immutable ownership, inactive accounts, and permitted workflows.
- Production rollout remains blocked pending verified backup/restore, staging regression tests, and rollback plan.

## Critical exposure reminder

The previously shared production Rules allowed broad access until their stated expiry date. Treat the data as potentially exposed during that window. Do not deploy guessed replacement rules to production or change live access without a controlled, tested remediation plan.
