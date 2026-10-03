/* Staging-only Firebase Auth -> trusted membership bridge.
 * No passwords, tenant IDs, roles, or authorization grants are persisted client-side.
 * Production code must not import this module.
 */
(function (global) {
  'use strict';

  const EXPECTED_PROJECT_ID = 'heritage-crm-staging';
  const ALLOWED_ROLES = Object.freeze(['owner', 'manager', 'sales', 'viewer']);

  function fail(message) {
    throw new Error('[HAF staging auth session] ' + message);
  }

  function validateMembership(uid, data) {
    if (!data || typeof data !== 'object') {
      fail('Trusted membership is missing.');
    }
    if (data.tenantId == null || typeof data.tenantId !== 'string' || !data.tenantId) {
      fail('Trusted membership has no valid tenantId.');
    }
    if (!ALLOWED_ROLES.includes(data.role)) {
      fail('Trusted membership has an unsupported role.');
    }
    if (data.status !== 'Active' || data.tenantStatus !== 'Active') {
      fail('Account or tenant is inactive.');
    }
    if (!Array.isArray(data.branchIds)) {
      fail('Trusted membership has no valid branchIds array.');
    }
    return Object.freeze({
      uid: uid,
      tenantId: data.tenantId,
      role: data.role,
      status: data.status,
      tenantStatus: data.tenantStatus,
      branchIds: Object.freeze(data.branchIds.slice())
    });
  }

  async function signInAndLoadMembership(email, password) {
    if (!global.HAFStagingFirebase || typeof global.HAFStagingFirebase.getServices !== 'function') {
      fail('Staging Firebase bootstrap is unavailable.');
    }

    const services = global.HAFStagingFirebase.getServices();
    if (services.projectId !== EXPECTED_PROJECT_ID) {
      fail('Unexpected Firebase project.');
    }

    const credential = await services.auth.signInWithEmailAndPassword(
      String(email || '').trim(),
      password
    );

    try {
      if (!credential || !credential.user || !credential.user.uid) {
        fail('Firebase Auth returned no user identity.');
      }

      const snapshot = await services.db
        .collection('memberships')
        .doc(credential.user.uid)
        .get();

      if (!snapshot.exists) {
        fail('No trusted membership exists for this authenticated UID.');
      }

      return validateMembership(credential.user.uid, snapshot.data());
    } catch (error) {
      await services.auth.signOut().catch(function () {});
      throw error;
    }
  }

  async function signOut() {
    if (!global.HAFStagingFirebase) {
      return;
    }
    const services = global.HAFStagingFirebase.getServices();
    await services.auth.signOut();
  }

  async function sendPasswordResetEmail(email) {
    if (!global.HAFStagingFirebase || typeof global.HAFStagingFirebase.getServices !== 'function') {
      fail('Staging Firebase bootstrap is unavailable.');
    }
    const services = global.HAFStagingFirebase.getServices();
    if (services.projectId !== EXPECTED_PROJECT_ID) {
      fail('Unexpected Firebase project.');
    }
    const normalizedEmail = String(email || '').trim();
    if (!normalizedEmail) {
      fail('A staging account email is required.');
    }
    await services.auth.sendPasswordResetEmail(normalizedEmail);
  }

  function onAuthStateChanged(callback) {
    if (!global.HAFStagingFirebase || typeof global.HAFStagingFirebase.getServices !== 'function') {
      fail('Staging Firebase bootstrap is unavailable.');
    }
    if (typeof callback !== 'function') {
      fail('Auth state callback is required.');
    }
    const services = global.HAFStagingFirebase.getServices();
    if (services.projectId !== EXPECTED_PROJECT_ID) {
      fail('Unexpected Firebase project.');
    }
    return services.auth.onAuthStateChanged(callback);
  }

  global.HAFStagingAuthSession = Object.freeze({
    signInAndLoadMembership: signInAndLoadMembership,
    signOut: signOut,
    sendPasswordResetEmail: sendPasswordResetEmail,
    onAuthStateChanged: onAuthStateChanged
  });
})(typeof window !== 'undefined' ? window : globalThis);
