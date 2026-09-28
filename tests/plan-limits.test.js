const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const app = fs.readFileSync('assets/js/app.js', 'utf8');
const match = app.match(/const TENANT_PLAN_LIMITS = (\{[\s\S]*?\n    \});/);
assert.ok(match, 'TENANT_PLAN_LIMITS must exist');
const limits = vm.runInNewContext('(' + match[1] + ')');

assert.deepEqual(JSON.parse(JSON.stringify(limits.Starter)), { staff: 3, branches: 1, leads: 500 });
assert.deepEqual(JSON.parse(JSON.stringify(limits.Professional)), { staff: 10, branches: 3, leads: 5000 });
assert.deepEqual(JSON.parse(JSON.stringify(limits.Business)), { staff: 25, branches: 10, leads: 25000 });
assert.equal(limits.Enterprise.staff, Infinity);
assert.equal(limits.Custom.leads, Infinity);

for (const marker of [
  'function getTenantPlanLimit(',
  'function getTenantLeadCount(',
  'if (activeCount >= limit)',
  'if (leadCount >= leadLimit)',
  'window.toggleManagementStaff=async function',
  'window.toggleManagementBranch=async function'
]) {
  assert.ok(app.includes(marker), 'Missing plan-limit guard marker: ' + marker);
}

console.log('Plan limit config and guard-marker tests passed.');
