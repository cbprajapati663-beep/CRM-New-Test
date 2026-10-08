# Staging Identity Contract

This file defines the synthetic staging-only identity contract for the CRM authentication migration.

## Canonical identity
Firebase Authentication is the identity provider. Every authenticated CRM principal must resolve to uid, email, tenantId, role, status, and branchIds[].
The browser must never establish these values from localStorage, URL parameters, login form fields, or arbitrary Firestore document fields.

## Synthetic principals
| Principal | Tenant | Role | Status | Branch scope |
|---|---|---|---|---|
| owner-a | tenant-a | owner | Active | all tenant-a branches |
| manager-a | tenant-a | manager | Active | assigned tenant-a branches |
| sales-a | tenant-a | sales | Active | assigned tenant-a branch |
| viewer-a | tenant-a | viewer | Active | assigned tenant-a branch |
| owner-b | tenant-b | owner | Active | all tenant-b branches |
| sales-b | tenant-b | sales | Active | assigned tenant-b branch |
| disabled-a | tenant-a | sales | Inactive | assigned tenant-a branch |

These are logical test labels only. Do not create them in production.

## Authorization invariants
1. request.auth.uid is the only authenticated identity accepted by rules.
2. Tenant membership must resolve from a trusted, client-unmodifiable mapping.
3. A request cannot select another tenant by changing a payload tenantId.
4. Role, branch assignment, account status and feature grants cannot be self-edited.
5. Inactive/deleted identities are denied.
6. Suspended tenants are denied.
7. Lead ownership is tenant-bound and cannot be reassigned by ordinary client writes.
8. Passwords, hashes, salts and privileged recovery data are never client-readable.
9. Unspecified collections/paths remain denied.

## Required negative tests
- anonymous -> any CRM data: DENY
- tenant-a -> tenant-b lead read: DENY
- tenant-a -> tenant-b lead write: DENY
- sales-a -> change own tenantId: DENY
- sales-a -> promote own role: DENY
- sales-a -> change own branchIds: DENY
- disabled-a -> CRM read/write: DENY
- tenant-a -> payoutSecurity/master: DENY
- tenant-a -> another tenant's customer document: DENY
- arbitrary unknown path: DENY

## Required positive tests
- owner-a -> tenant-a permitted records: ALLOW
- manager-a -> assigned tenant-a branch records: ALLOW
- sales-a -> permitted lead create/update within assigned scope: ALLOW
- viewer-a -> permitted read/report scope only: ALLOW
- owner-b -> tenant-b records: ALLOW
- tenant-a and tenant-b cannot observe each other's records.

## Production gate
This contract is for staging design/testing. It does not authorize production Firebase changes, production Auth users, or production Firestore/Storage rule deployment.