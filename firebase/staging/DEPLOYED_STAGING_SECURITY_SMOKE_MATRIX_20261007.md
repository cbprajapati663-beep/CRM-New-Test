# Deployed Staging Security Smoke Matrix — 2026-10-07

This checklist is for the deployed `heritage-crm-staging` environment only.
Do not use production credentials or customer data.

## Preconditions

- [ ] Current security branch commit is deployed successfully to `heritage-crm-staging`.
- [ ] Firebase Auth users are provisioned through a trusted administrative path.
- [ ] Trusted `memberships/{uid}` records exist for the synthetic principals.
- [ ] Synthetic tenant/branch/lead data only.
- [ ] No passwords, service-account keys, or private configuration are stored in Git.

## Identity and tenant isolation

| Principal / action | Expected |
|---|---|
| owner-a → tenant-a lead | Allow |
| owner-a → tenant-b lead | Deny |
| owner-b → tenant-b lead | Allow |
| disabled-a → CRM | Deny |
| Authenticated user without membership | Deny/sign out |
| Membership self-edit | Deny |

## Branch authorization

| Principal / action | Expected |
|---|---|
| manager-a reads branch-a1 | Allow |
| manager-a reads branch-a2 | Deny |
| viewer-a reads branch-a1 | Allow |
| viewer-a reads branch-a2 | Deny |
| sales-a reads own/assigned lead in branch-a1 | Allow |
| sales-a reads unrelated lead | Deny |
| manager-a moves lead to unauthorized branch-a2 | Deny |
| sales-a trusted lead create in branch-a1 | Allow |
| sales-a trusted lead create in branch-a2 | Deny |

## Storage authorization

- [ ] owner-a can upload/read tenant-a lead documents.
- [ ] tenant-a user cannot access tenant-b documents.
- [ ] sales-a can upload an assigned lead document.
- [ ] sales-a cannot upload an unrelated lead document.
- [ ] Unknown storage paths are denied.

## Trusted writes and plan enforcement

For each applicable plan boundary:
- [ ] Branch creation uses trusted callable Functions.
- [ ] Lead creation uses trusted callable Functions.
- [ ] Staff creation uses trusted callable Functions.
- [ ] Cross-tenant create request is denied.
- [ ] Protected identity fields cannot be caller-controlled.
- [ ] Plan limit boundary is denied.
- [ ] Below-limit create succeeds.
- [ ] Suspended/inactive tenant is denied.

## Session and recovery

- [ ] Logout invalidates the staging Auth session.
- [ ] Auth state loss redirects to staging login.
- [ ] Password reset email flow works for a provisioned synthetic user.
- [ ] Missing/invalid membership causes sign-out.
- [ ] No CRM authorization state is persisted in localStorage.

## Evidence

Record only non-sensitive evidence:
- deployed commit SHA
- deployment workflow run URL/number
- test timestamp
- pass/fail result per matrix row
- Firebase project ID (`heritage-crm-staging`)

Never record passwords, service-account JSON, reset links, customer data, or private keys.

## Exit criteria

Staging security is considered deployed-verified only when:
1. deployment workflow succeeds for the tested commit;
2. all identity, tenant, branch, storage, trusted-write, and session checks pass;
3. no production project/data is involved.

Production migration remains blocked until this gate and the remaining backup/rollback evidence are complete.
