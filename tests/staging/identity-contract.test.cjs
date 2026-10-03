'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../assets/js/staging/identity-contract.js'), 'utf8');

test('staging identity contract exposes only synthetic principals', () => {
  const sandbox = {};
  vm.runInNewContext(source, { globalThis: sandbox });
  const c = sandbox.HAFStagingIdentityContract;
  assert.deepEqual(c.tenantIds, ['tenant-a', 'tenant-b']);
  assert.equal(c.principals.ownerA.tenantId, 'tenant-a');
  assert.equal(c.principals.ownerB.tenantId, 'tenant-b');
  assert.equal(c.principals.disabledA.status, 'Inactive');
  assert.equal(c.principals.ownerA.role, 'owner');
});

test('contract includes required security negative cases', () => {
  const sandbox = {};
  vm.runInNewContext(source, { globalThis: sandbox });
  const cases = sandbox.HAFStagingIdentityContract.requiredNegativeCases;
  assert.ok(cases.includes('cross-tenant-lead-read'));
  assert.ok(cases.includes('cross-tenant-storage-access'));
  assert.ok(cases.includes('self-promote-role'));
  assert.ok(cases.includes('inactive-account-access'));
  assert.ok(cases.includes('unknown-path-access'));
});

test('contract is immutable', () => {
  const sandbox = {};
  vm.runInNewContext(source, { globalThis: sandbox });
  assert.equal(Object.isFrozen(sandbox.HAFStagingIdentityContract), true);
  assert.equal(Object.isFrozen(sandbox.HAFStagingIdentityContract.principals), true);
});