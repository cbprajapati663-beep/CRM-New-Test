# Firestore Access Inventory (Source Scan)

**Reviewed:** 2026-09-29  
**Branch:** `fix/tenant-plan-limits-20260928`  
**Purpose:** Record collection paths observed in `assets/js/app.js` before designing Firestore Rules. This is a source-code inventory, not a verified production schema or security policy.

## Collection paths observed

| Path | Operations observed | Notes / risk |
|---|---|---|
| `leads/{leadId}` | Read/query, create, update, delete | Global top-level collection. Source includes lead edits, DO numbering, assignment, document metadata, and status updates. Tenant ownership field and query coverage need full review. |
| `leads/{leadId}/activity/{activityId}` | Add, query/order/limit | Activity records are nested under a lead. Must inherit/validate the parent lead's tenant scope. |
| `tenants/{tenantId}` | Read/query, create, update, delete | Tenant records also appear to contain configuration and license/status fields. Existing code uses tenant ID and document ID inconsistently in some paths. |
| `tenants/{tenantId}/staff/{staffId}` | Read, create, set/merge, update, delete | Staff profile documents nested under tenant. Role/branch access semantics need confirmation. |
| `tenants/{tenantId}/branches/{branchId}` | Read, create, set/merge, update | Branch records nested under tenant. Need define which staff roles may view/edit and how leads are branch-scoped. |
| `staffAccounts/{staffId}` | Query by login ID, read, set/merge, update, delete | Top-level credential/account records. Current login design is not UID-based; must not be treated as trusted membership authorization. |
| `payoutSecurity/{documentId}` | Read, set/update | Includes a `master` document and tenant-derived document IDs. Sensitive payout unlock/security material; access policy must be designed separately and conservatively. |

## Source-observed operations requiring rule coverage

- Tenant bootstrap and lookup, tenant expiry/suspension updates, and tenant deletion.
- Staff account/profile creation, edits, disable/delete, and login lookup.
- Branch creation, edits, and status updates.
- Lead creation, editing, deletion, payout/status changes, assignment, and document checklist metadata.
- Lead activity creation and recent-activity reads.
- Payout security reads and writes, including master-level state.

## Security design implications

1. **Do not draft permissive rules from this list.** A matching ownership field and trusted identity source must be confirmed for every document type.
2. A browser-supplied `tenantId`, `role`, or local-storage session is not a trusted authorization claim.
3. For lead and activity access, rules must validate tenant ownership through a trusted membership model and parent lead relationship. The existing code's complete query patterns still need mapping.
4. Top-level `staffAccounts` and `payoutSecurity` require a separate review; avoid granting broad tenant-wide reads.
5. Firestore Rules cannot safely enforce all atomic plan-limit counters or privileged workflows by themselves. Keep UI caps advisory until an approved trusted enforcement design exists.
6. Preserve deny-by-default in staging until Firebase Auth UID membership, role/branch policy, and emulator tests are defined.

## Items still unresolved

- Canonical tenant key and trusted UID-to-tenant membership document path.
- Exact role list and permissions (superadmin, tenant owner/admin, staff roles), including branch-level restrictions.
- Canonical lead tenant ownership field and whether all lead documents reliably contain it.
- Payout security data shape and which actions require owner-only access.
- All Firestore operations in other JS/HTML files and any Storage paths/rules.
- Whether legacy records need migration; no migration has been performed.

## Safety status

No production or staging Firebase settings, data, users, rules, billing, or deployments were changed during this source scan. No Firebase Rules were generated or deployed.
