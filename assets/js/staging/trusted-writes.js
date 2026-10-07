/* Staging-only trusted write adapter.
 * All staff/branch/lead creation must cross Firebase Callable Functions.
 * Production app.js must not import this module.
 */
(function (global) {
  'use strict';

  const EXPECTED_PROJECT_ID = 'heritage-crm-staging';

  function fail(message) {
    throw new Error('[HAF staging trusted writes] ' + message);
  }

  function services() {
    if (!global.HAFStagingFirebase || typeof global.HAFStagingFirebase.getServices !== 'function') {
      fail('Staging Firebase bootstrap is unavailable.');
    }
    const value = global.HAFStagingFirebase.getServices();
    if (value.projectId !== EXPECTED_PROJECT_ID) fail('Unexpected Firebase project.');
    if (!value.app || typeof value.app.functions !== 'function') {
      fail('Firebase Functions service is unavailable.');
    }
    return value;
  }

  async function membership() {
    if (!global.HAFStagingAuthSession || typeof global.HAFStagingAuthSession.getCurrentMembership !== 'function') {
      fail('Staging Auth membership bridge is unavailable.');
    }
    return global.HAFStagingAuthSession.getCurrentMembership();
  }

  async function call(name, input) {
    const current = await membership();
    const data = Object.assign({}, input || {}, { tenantId: current.tenantId });
    const fn = services().app.functions().httpsCallable(name);
    return (await fn(data)).data;
  }

  global.HAFStagingTrustedWrites = Object.freeze({
    createBranch: input => call('createPlanEnforcedBranch', input),
    createLead: input => call('createPlanEnforcedLead', input),
    createStaff: input => call('createPlanEnforcedStaff', input),
    getPlanEntitlement: async function () {
      const fn = services().app.functions().httpsCallable('getPlanEntitlement');
      return (await fn({})).data;
    }
  });
})(window);
