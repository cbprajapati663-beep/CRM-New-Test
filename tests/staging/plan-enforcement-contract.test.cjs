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
  assert.match(contract, /deployment is verified/i);
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
  assert.match(source, /db\.collection\('staffAccounts'\)[\s\S]*?\.where\('tenantId', '==', tenantId\)/);
  assert.doesNotMatch(source, /collection\('tenants'\)\.doc\(tenantId\)\.collection\('(branches|staff)'\)/);
});

test('trusted plan functions enforce role and branch boundaries', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../functions/index.js'), 'utf8');
  assert.match(source, /createPlanEnforcedLead[\s\S]*?loadMembership/);
  assert.match(source, /Owner role required for branch creation/);
  assert.match(source, /Manager or owner role required for staff creation/);
  assert.match(source, /\['owner', 'manager', 'sales', 'viewer'\]\.includes\(m\.role\)/);
  assert.match(source, /branchAllowedForMembership/);
  assert.match(source, /Lead branch is outside the caller membership/);
});

test('trusted write boundary strips client-controlled identity and staff privilege fields', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../functions/index.js'), 'utf8');
  assert.match(source, /createdByUserId: _createdByUserId/);
  assert.match(source, /createdAt: _createdAt/);
  assert.match(source, /status: _status/);
  assert.match(source, /role: _role/);
  assert.match(source, /tenantStatus: _tenantStatus/);
  assert.match(source, /branchIds: _branchIds/);
  assert.match(source, /status: 'Active'/);
  assert.match(source, /tx\.set\(ref, \{[\s\S]*\.\.\.safeInput[\s\S]*tenantId,[\s\S]*createdByUserId: uid/);
});
