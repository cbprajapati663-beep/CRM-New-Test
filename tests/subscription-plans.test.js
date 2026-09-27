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


const customValidationChecks = [
  ["whole-number validation", "Number.isInteger(value)"],
  ["negative limit rejection", "value < -1"],
  ["unlimited sentinel support", "value < -1"],
  ["storage must be finite and non-negative", "Number.isFinite(storageGB) || storageGB < 0"],
  ["at least one custom feature required", "subscriptionPlan === 'Custom' && !featureAccess.length"]
];
for (const [label, marker] of customValidationChecks) {
  assert.ok(source.includes(marker), `Custom plan validation missing: ${label}`);
}
assert.ok(source.includes("customLimits = { ...parsedLimits, storageGB }"), "Custom plan limits must be saved together");

console.log('Subscription plan configuration tests passed (5 plan limits, feature access, and custom validation safeguards).');

const activityRenderer = source.slice(source.indexOf('window.loadLeadActivity = async function'), source.indexOf('window.loadLeadActivity = async function') + 5000);
assert.ok(activityRenderer.includes('detail.textContent = details'), 'Activity details must be rendered as text, not HTML');
assert.ok(activityRenderer.includes('type.textContent ='), 'Activity type must be rendered as text');
assert.ok(!activityRenderer.includes('detail.innerHTML'), 'Activity details must not be injected as HTML');

console.log('Activity timeline safe-rendering regression checks passed.');

const dealerLedgerStart = source.indexOf('function renderDealerLedgerTable()');
const dealerLedgerEnd = source.indexOf('window.openEditDealerCutModal', dealerLedgerStart);
assert.ok(dealerLedgerStart >= 0 && dealerLedgerEnd > dealerLedgerStart, 'Dealer ledger renderer must exist');
const dealerLedgerRenderer = source.slice(dealerLedgerStart, dealerLedgerEnd);
assert.ok(dealerLedgerRenderer.includes('escapeHtml(dName)'), 'Dealer names must be HTML-escaped in ledger rows');
assert.ok(dealerLedgerRenderer.includes('escapeHtml(l.name'), 'Customer names must be HTML-escaped in ledger rows');
assert.ok(dealerLedgerRenderer.includes("escapeJsString(l.docId)"), 'Document IDs must be escaped in inline ledger actions');
assert.ok(dealerLedgerRenderer.includes('opt.textContent = d'), 'Dealer filter options must use textContent');

console.log('Dealer ledger safe-rendering regression checks passed.');
