# Trusted Plan Enforcement Implementation — 2026-10-03

## Status
The staging branch contains a trusted Firebase Functions boundary for subscription limits, including staff, branch, and lead creation. CI validation is green. Source is not production-connected.

## Deployment boundary
A manual, staging-only GitHub Actions deployment workflow is present at `.github/workflows/deploy-staging-security.yml`.

It targets only Firebase project `heritage-crm-staging` and deploys Functions plus Firestore/Storage rules. It requires the GitHub Environment secret `FIREBASE_SERVICE_ACCOUNT_STAGING`; no credential is stored in the repository.

## Limits
Starter: 3 staff / 1 branch / 500 leads.
Professional: 10 / 3 / 5,000.
Business: 25 / 10 / 25,000.
Enterprise / Custom: tenant-specific planLimits overrides.

## Remaining gate
- provision the staging deployment credential in the GitHub `staging` environment
- run the manual staging deployment
- provision real staging Auth users and trusted memberships
- migrate staging staff/branch/lead creation to the trusted Functions boundary
- verify concurrent-write behavior against deployed Functions
- run deployed Auth + plan-boundary smoke tests
- capture rollback/backup evidence

Production migration remains blocked.
