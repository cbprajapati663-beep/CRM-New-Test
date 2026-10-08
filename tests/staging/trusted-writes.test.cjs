'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');

test('trusted staging write adapter is staging-only and callable-backed',()=>{
  const p=fs.readFileSync('assets/js/staging/trusted-writes.js','utf8');
  assert.match(p,/heritage-crm-staging/);
  assert.match(p,/createPlanEnforcedBranch/);
  assert.match(p,/createPlanEnforcedLead/);
  assert.match(p,/createPlanEnforcedStaff/);
  assert.match(p,/getPlanEntitlement/);
  assert.match(p,/httpsCallable/);
  assert.match(p,/current.tenantId/);
  assert.doesNotMatch(p,/collection\(['"]staffAccounts['"]\)/);
  assert.doesNotMatch(p,/collection\(['"]branches['"]\)/);
  assert.doesNotMatch(p,/collection\(['"]leads['"]\)/);
  assert.doesNotMatch(p,/localStorage/);
});

test('staging Auth bridge exposes trusted current membership only',()=>{
  const p=fs.readFileSync('assets/js/staging/auth-session.js','utf8');
  assert.match(p,/getCurrentMembership/);
  assert.match(p,/services\.auth\.currentUser/);
  assert.match(p,/collection\('memberships'\)\.doc\(user\.uid\)/);
  assert.match(p,/validateMembership\(user\.uid/);
});
