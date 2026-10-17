# Firebase Security Migration — CRM-New-Test

## Current verified state (2026-10-17)

- Firebase project used by the client: `heritage-crm-f179a`.
- Firestore collections observed in the current project include `tenants`, `staffAccounts`, and `leads`.
- The current browser login flow reads tenant/staff records from Firestore and compares a stored password field in client-side JavaScript. This is a legacy custom-password flow, not Firebase Authentication.
- The owner manually changed the Firestore test-rule expiry to 2036. The app then loaded, and the owner confirmed that a dummy lead could be saved and remained after refresh.
- This confirms basic Firestore read/write currently works; it does not prove access is restricted to the correct tenant or user.
- The currently proposed PR #59 remains unmerged and is not a production deployment.

## Critical security note

Do not treat a later test-rule expiry as a security fix. A broad rule such as `allow read, write: if request.time < timestamp.date(...)` lets any client access matched data until that date. The Firebase documentation warns against allow-all rules in production. See:
- https://firebase.google.com/docs/firestore/security/overview
- https://firebase.google.com/docs/rules/rules-and-auth
- https://firebase.google.com/docs/firestore/security/get-started

Do not deploy an invented `request.auth != null` rule alone as the final solution: the current client login does not sign users in with Firebase Authentication, so that rule would break the existing flow, and authenticated-only access would still not enforce tenant boundaries.

## Required migration sequence

1. **Preserve access and prepare rollback**
   - Keep a verified backup/export of Firestore data and record the currently deployed rules.
   - Test only in a staging Firebase project first; do not experiment against production rules without a rollback plan.
2. **Define identity mapping**
   - Map every active tenant and staff login to a unique Firebase Authentication UID.
   - Decide how the existing legacy passwords are reset or migrated securely. Never copy plaintext passwords into Auth metadata, logs, or client bundles.
   - Create a controlled owner/admin provisioning path. Do not auto-create privileged accounts from untrusted client requests.
3. **Change the app login**
   - Replace client-side password-field comparison with Firebase Authentication sign-in.
   - Resolve the signed-in UID to a trusted tenant/staff profile.
   - Keep role and tenant IDs in trusted profile data or verified custom claims; never trust a client-editable role field.
4. **Enforce Firestore authorization**
   - Design collection-specific rules for `tenants`, `staffAccounts`, `leads`, and `payoutSecurity`.
   - Enforce tenant isolation and role-specific create/read/update/delete permissions in Rules, not only by hiding UI controls.
   - Do not grant public read/write access. Avoid broad overlapping match rules.
5. **Test before production**
   - Use the Firebase Emulator Suite / Rules Unit Testing to test unauthenticated denial, tenant A vs tenant B isolation, staff role boundaries, valid lead create/update, and prohibited deletes.
   - In staging, test owner, manager, viewer, and sales-executive flows plus refresh/session expiry and password reset.
   - Verify existing records remain visible only to authorized users and no writes are lost.
6. **Deploy and verify**
   - Deploy the reviewed rules and client code as a coordinated release.
   - Verify login, dashboard metrics, lead save/read/update, staff permissions, and document access after the release.
   - Remove or reset any temporary public test rules immediately after a controlled migration is ready.

## Acceptance checklist

- [ ] Firebase Auth login succeeds for each migrated account.
- [ ] No plaintext password comparison remains in browser code.
- [ ] Unauthenticated Firestore reads and writes are denied.
- [ ] A tenant cannot read or mutate another tenant's records.
- [ ] Viewer cannot create/update/delete records beyond its approved scope.
- [ ] Sales executive cannot delete leads if policy forbids it.
- [ ] Owner/admin permissions are granted only to provisioned identities.
- [ ] Automated Rules tests pass and staging smoke tests pass.
- [ ] Production rules and deployed client version are recorded.

## Status

This file documents the safe implementation plan. It does not itself change Firebase Console rules, create Authentication users, or migrate live accounts. Those operations require controlled access to the Firebase project and staging validation.
