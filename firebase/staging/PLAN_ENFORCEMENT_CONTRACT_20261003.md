# Server-Side Plan Enforcement Gate — 2026-10-03

## Purpose

Subscription limits and feature entitlements must be enforced by a trusted server-side boundary before production migration. Client-side UI checks are not authorization.

## Required plan contract

| Plan | Staff | Branches | Leads |
|---|---:|---:|---:|
| Starter | 3 | 1 | 500 |
| Professional | 10 | 3 | 5,000 |
| Business | 25 | 10 | 25,000 |
| Enterprise / Custom | Tenant override | Tenant override | Tenant override |

## Required trusted enforcement inputs

A trusted backend must resolve the active tenant from `request.auth.uid -> memberships/{uid}`, then read the tenant's authoritative subscription state. The browser must not be allowed to choose:

- tenantId
- subscriptionPlan
- feature grants
- staff/branch/lead limits
- tenant status

## Required enforcement points

The backend must reject, before the write is committed:

1. Creating a staff member when the active staff count reaches the plan limit.
2. Creating a branch when the active branch count reaches the plan limit.
3. Creating a lead when the tenant lead count reaches the plan limit.
4. Accessing a paid feature not granted to the tenant's effective plan.
5. Any request for a suspended/inactive tenant.
6. Any cross-tenant request, even when the client supplies another tenantId.

## Current implementation state

The repository contains a staging-only trusted Firebase Functions source boundary for aggregate plan enforcement, and the Functions/rules deployment workflow has successfully deployed the trusted Functions and Firestore/Storage rules to `heritage-crm-staging`. The staging CRM shell is still read-oriented and does not yet route its staff/branch/lead creation UI through these callable Functions. Therefore, deployment is verified, but end-to-end plan enforcement through the CRM write flows and the concurrent-write aggregate-limit proof remain pending.

## Safe migration rule

Do not weaken Firestore/Storage rules or rely on hidden UI buttons to claim plan enforcement. A trusted backend must be deployed and its negative/limit-boundary tests must pass before production migration.

## Required test matrix

- Starter: 3rd staff allowed, 4th rejected.
- Starter: 1st branch allowed, 2nd rejected.
- Starter: lead at 500 allowed, 501st rejected.
- Professional: 10th staff allowed, 11th rejected.
- Professional: 3rd branch allowed, 4th rejected.
- Professional: lead at 5,000 allowed, 5,001st rejected.
- Business: 25th staff allowed, 26th rejected.
- Business: 10th branch allowed, 11th rejected.
- Business: lead at 25,000 allowed, 25,001st rejected.
- Enterprise/custom: tenant-specific overrides respected.
- Cross-tenant and suspended-tenant requests rejected.
- Concurrent writes cannot bypass the aggregate limit.

## Security requirement

No service-account key, private credential, temporary password, or privileged provisioning secret may be committed to this repository.
