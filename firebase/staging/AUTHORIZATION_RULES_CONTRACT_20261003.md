# Staging Firebase Authorization Rules Contract

These rules are staging-only and deliberately not wired to production Firebase.

Trusted authorization source: memberships/{uid}. It contains tenantId, role, status, tenantStatus and branchIds. Clients cannot write membership records.

Firestore: default deny; tenants/staffAccounts remain denied during migration; leads are tenant and branch scoped; lead tenant and creator cannot be reassigned by ordinary clients; payoutSecurity is denied.

Storage: customer documents require tenant membership plus authorization to the referenced lead. Unknown storage paths are denied.

Integration constraint: the current legacy CRM performs broad browser reads, so these rules will reject legacy reads by design until Firebase Auth and scoped data loading are migrated.

Production Firebase configuration, users, credentials and customer data are not changed by this contract.