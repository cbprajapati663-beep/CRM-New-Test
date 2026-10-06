'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const contract = fs.readFileSync(
  path.join(__dirname, '../../firebase/staging/PLAN_ENFORCEMENT_CONTRACT_20261003.md'),
  'utf8'
);

test('plan enforcement contract requires a trusted server-side boundary', () => {
  assert.match(contract, /trusted server-side boundary/i);
  assert.match(contract, /request\.auth\.uid -> memberships/);
  assert.match(contract, /plan enforcement remains blocked/i);
  assert.match(contract, /concurrent writes/i);
  assert.match(contract, /Creating a staff member/i);
});

test('plan enforcement contract covers subscription limit classes', () => {
  for (const marker of ['Staff', 'Branches', 'Leads', 'Enterprise / Custom', 'Starter', 'Professional', 'Business']) {
    assert.ok(contract.includes(marker), 'missing contract marker: ' + marker);
  }
});

test('plan enforcement contract forbids client-selected authorization state', () => {
  for (const marker of ['tenantId', 'subscriptionPlan', 'feature grants', 'staff/branch/lead limits']) {
    assert.ok(contract.includes(marker), 'missing client-state restriction: ' + marker);
  }
});


test('trusted plan functions use the canonical staging collection paths', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../functions/index.js'), 'utf8');
  assert.match(source, /db\.collection\('branches'\)\.doc\(\)/);
  assert.match(source, /db\.collection\('branches'\)\.where\('tenantId', '==', tenantId\)/);
  assert.match(source, /db\.collection\('staffAccounts'\)\.doc\(\)/);
  assert.match(source, /db\.collection\('staffAccounts'\)\s*\\n\s*\.where\('tenantId', '==', tenantId\)/);
  assert.doesNotMatch(source, /collection\('tenants'\)\.doc\(tenantId\)\.collection\('(branches|staff)'\)/);
});
