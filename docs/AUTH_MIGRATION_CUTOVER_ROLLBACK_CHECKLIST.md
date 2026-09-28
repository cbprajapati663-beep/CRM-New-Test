# Authentication Migration Cutover and Rollback Checklist

**Status:** Planning checklist only. No production migration, deployment, or data change is authorized by this document.

## A. Preconditions — all must be satisfied

- [ ] Confirm the exact production Firebase project ID from the trusted console; do not infer it from client code alone.
- [ ] Confirm the staging project is exactly `heritage-crm-staging`.
- [ ] Complete and review the Auth UID-to-tenant/role mapping design.
- [ ] Inventory all protected Firestore collections, subcollections, Storage paths, and privileged operations.
- [ ] Define server-enforced authorization for tenant owners, staff, and platform administrators.
- [ ] Complete staging Auth tests, Firestore rule tests, Storage rule tests, cross-tenant denial tests, and regression tests.
- [ ] Verify backup completeness and perform a restore rehearsal in an isolated environment.
- [ ] Document migration order, maintenance window, owner, approver, and customer-impact plan.
- [ ] Prepare a tested rollback procedure and identify the exact rollback artifacts.
- [ ] Review all code/rules changes and ensure CI checks pass on the intended commit.
- [ ] Confirm no secrets, production customer data, or real credentials are present in the branch, logs, or test fixtures.

**If any item is unchecked, stop. Do not cut over.**

## B. Controlled cutover sequence

1. Announce and authorize the maintenance window; pause changes that could invalidate the migration snapshot.
2. Capture and verify a fresh backup using the approved procedure; record its identifier and verification evidence in a restricted record.
3. Deploy only the reviewed, approved migration artifacts using the designated release process.
4. Verify Auth sign-in and trusted identity-to-tenant mapping with designated test accounts.
5. Verify representative tenant-scoped reads/writes and explicit cross-tenant denials.
6. Verify staff permission boundaries, admin boundaries, and Storage access controls.
7. Run critical CRM regression checks using synthetic or approved test records.
8. Review logs and error rates; stop if unexpected authorization failures or data exposure are observed.
9. Obtain explicit sign-off before reopening normal use.

## C. Immediate stop conditions

Stop the rollout and begin the approved incident/rollback process if any of the following occurs:

- A user can read or modify another tenant's records or files.
- A missing/invalid identity mapping grants access instead of denying it.
- An unauthorized user can elevate role or permissions.
- Critical business workflows fail or data integrity is uncertain.
- Backup verification, rules deployment, or rollback capability is unavailable.
- Production project identity or deployed artifact version cannot be confirmed.

## D. Rollback decision and execution record

Do not improvise rollback steps during an incident. Follow the pre-reviewed runbook and preserve evidence.

- **Decision owner:**  
- **Approver:**  
- **Incident / change reference:**  
- **Last known-good code/rules version:**  
- **Backup reference and restore verification:**  
- **Rollback start time (timezone):**  
- **Rollback completion time (timezone):**  
- **Post-rollback authentication checks:**  
- **Post-rollback tenant-isolation checks:**  
- **Data reconciliation required:** Yes / No / Undetermined  
- **Final outcome and follow-up owner:**  

## E. Go / No-Go sign-off

| Gate | Owner | Evidence link/reference | Status |
|---|---|---|---|
| Identity mapping reviewed | | | Not run |
| Firestore authorization verified | | | Not run |
| Storage authorization verified | | | Not run |
| Cross-tenant denial tests passed | | | Not run |
| Critical CRM regression passed | | | Not run |
| Backup restore rehearsal passed | | | Not run |
| Rollback rehearsal passed | | | Not run |
| Independent review completed | | | Not run |

**Final decision:** NO-GO until every required gate is evidenced and approved.

> This checklist is a governance aid, not a substitute for a reviewed, environment-specific technical runbook. It does not claim that any production backup, restore, test, or migration has occurred.
