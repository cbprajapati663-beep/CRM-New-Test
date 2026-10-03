// Staging-only authorization contract.
// This module contains no credentials and no production identifiers.
(function (global) {
  'use strict';
  const CONTRACT = Object.freeze({
    tenantIds: Object.freeze(['tenant-a', 'tenant-b']),
    principals: Object.freeze({
      ownerA: Object.freeze({ tenantId: 'tenant-a', role: 'owner', status: 'Active' }),
      managerA: Object.freeze({ tenantId: 'tenant-a', role: 'manager', status: 'Active' }),
      salesA: Object.freeze({ tenantId: 'tenant-a', role: 'sales', status: 'Active' }),
      viewerA: Object.freeze({ tenantId: 'tenant-a', role: 'viewer', status: 'Active' }),
      ownerB: Object.freeze({ tenantId: 'tenant-b', role: 'owner', status: 'Active' }),
      salesB: Object.freeze({ tenantId: 'tenant-b', role: 'sales', status: 'Active' }),
      disabledA: Object.freeze({ tenantId: 'tenant-a', role: 'sales', status: 'Inactive' })
    }),
    deniedPaths: Object.freeze(['payoutSecurity/master']),
    requiredNegativeCases: Object.freeze([
      'anonymous-crm-read',
      'cross-tenant-lead-read',
      'cross-tenant-lead-write',
      'self-change-tenant',
      'self-promote-role',
      'self-change-branch',
      'inactive-account-access',
      'master-payout-access',
      'cross-tenant-storage-access',
      'unknown-path-access'
    ])
  });
  global.HAFStagingIdentityContract = CONTRACT;
})(typeof window !== 'undefined' ? window : globalThis);