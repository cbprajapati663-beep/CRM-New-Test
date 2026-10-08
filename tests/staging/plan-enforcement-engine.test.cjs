'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { PLAN_LIMITS, getEffectiveLimits, assertUnderLimit, assertActiveTenant } =
  require('../../functions/lib/planLimits');

test('standard plan limits are exact', () => {
  assert.deepEqual(PLAN_LIMITS.Starter, { staff: 3, branches: 1, leads: 500 });
  assert.deepEqual(PLAN_LIMITS.Professional, { staff: 10, branches: 3, leads: 5000 });
  assert.deepEqual(PLAN_LIMITS.Business, { staff: 25, branches: 10, leads: 25000 });
});
test('boundary rule allows only writes below the limit', () => {
  const t = { subscriptionPlan: 'Starter', status: 'Active' };
  assert.doesNotThrow(() => assertUnderLimit('staff', 2, t));
  assert.throws(() => assertUnderLimit('staff', 3, t), /PLAN_LIMIT_REACHED/);
  assert.doesNotThrow(() => assertUnderLimit('branches', 0, t));
  assert.throws(() => assertUnderLimit('branches', 1, t), /PLAN_LIMIT_REACHED/);
  assert.doesNotThrow(() => assertUnderLimit('leads', 499, t));
  assert.throws(() => assertUnderLimit('leads', 500, t), /PLAN_LIMIT_REACHED/);
});
test('enterprise/custom tenant overrides are honored', () => {
  const t = { subscriptionPlan: 'Custom', status: 'Active', planLimits: { staff: 7, branches: 4, leads: 1234 } };
  assert.deepEqual(getEffectiveLimits(t), { staff: 7, branches: 4, leads: 1234 });
  assert.throws(() => assertUnderLimit('staff', 7, t), /PLAN_LIMIT_REACHED/);
});
test('inactive tenant is rejected', () => {
  assert.throws(() => assertActiveTenant({ status: 'Suspended' }), /TENANT_INACTIVE/);
  assert.throws(() => assertActiveTenant({ status: 'Inactive' }), /TENANT_INACTIVE/);
});
