const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/app.js', 'utf8');
const match = source.match(/const PLAN_LIMITS\s*=\s*(\{[\s\S]*?\n\s*\});/);
assert.ok(match, 'PLAN_LIMITS definition must exist');
const plans = vm.runInNewContext('(' + match[1] + ')');

assert.deepEqual(JSON.parse(JSON.stringify(plans.Starter)), { staff: 3, branches: 1, leads: 500, storageGB: 1 });
assert.deepEqual(JSON.parse(JSON.stringify(plans.Professional)), { staff: 10, branches: 3, leads: 5000, storageGB: 10 });
assert.deepEqual(JSON.parse(JSON.stringify(plans.Business)), { staff: 25, branches: 10, leads: 25000, storageGB: 50 });
assert.deepEqual(JSON.parse(JSON.stringify(plans.Enterprise)), { staff: -1, branches: -1, leads: -1, storageGB: 500 });
assert.deepEqual(JSON.parse(JSON.stringify(plans.Custom)), { staff: 3, branches: 1, leads: 500, storageGB: 1 });

const featureMatch = source.match(/const PLAN_FEATURES\s*=\s*(\{[\s\S]*?\n\s*\});/);
assert.ok(featureMatch, 'PLAN_FEATURES definition must exist');
const features = vm.runInNewContext('(' + featureMatch[1] + ')');
assert.ok(features.Starter.includes('pipeline'));
assert.ok(!features.Starter.includes('backupExport'));
assert.ok(features.Enterprise.includes('backupExport'));
assert.ok(!features.Business.includes('backupExport'));

console.log('Subscription plan configuration tests passed (5 plan limits + feature access checks).');
