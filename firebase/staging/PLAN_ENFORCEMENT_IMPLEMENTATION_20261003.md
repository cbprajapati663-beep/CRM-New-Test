# Trusted Plan Enforcement Implementation — 2026-10-03

## Status
The staging branch now contains a trusted Firebase Functions boundary for subscription limits, including staff, branch, and lead creation. It is implemented in source but not yet deployed or production-connected.

## Boundary
Callable functions resolve Firebase Auth uid -> trusted memberships/{uid} -> authoritative tenants/{tenantId} subscription state -> effective limits, then enforce aggregate branch/lead limits inside Firestore transactions.

## Limits
Starter: 3 staff / 1 branch / 500 leads.
Professional: 10 / 3 / 5,000.
Business: 25 / 10 / 25,000.
Enterprise / Custom: tenant-specific planLimits overrides.

## Remaining gate
- deploy Functions to heritage-crm-staging through a trusted deployment path
- migrate staging staff creation to createPlanEnforcedStaff
- migrate staging CRM create flows away from direct aggregate-limit-sensitive writes
- verify concurrent-write behavior against deployed Functions
- run deployed Auth + plan-boundary smoke tests
- capture rollback/backup evidence

Production migration remains blocked.
