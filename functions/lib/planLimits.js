'use strict';

const PLAN_LIMITS = Object.freeze({
  Starter: Object.freeze({ staff: 3, branches: 1, leads: 500 }),
  Professional: Object.freeze({ staff: 10, branches: 3, leads: 5000 }),
  Business: Object.freeze({ staff: 25, branches: 10, leads: 25000 }),
});

function getEffectiveLimits(tenant) {
  if (!tenant || typeof tenant !== 'object') throw new Error('TENANT_REQUIRED');
  const plan = String(tenant.subscriptionPlan || 'Starter').trim();
  const base = PLAN_LIMITS[plan];
  if (!base && !['Enterprise', 'Custom', 'Enterprise / Custom'].includes(plan)) throw new Error('UNKNOWN_PLAN');
  if (!base) {
    const o = tenant.planLimits || {};
    return Object.freeze({
      staff: Number.isInteger(o.staff) && o.staff >= 0 ? o.staff : Infinity,
      branches: Number.isInteger(o.branches) && o.branches >= 0 ? o.branches : Infinity,
      leads: Number.isInteger(o.leads) && o.leads >= 0 ? o.leads : Infinity
    });
  }
  return base;
}
function assertActiveTenant(tenant) {
  if (!tenant || String(tenant.status || 'Active') !== 'Active') throw new Error('TENANT_INACTIVE');
}
function assertUnderLimit(kind, currentCount, tenant) {
  const limits = getEffectiveLimits(tenant);
  if (!Object.prototype.hasOwnProperty.call(limits, kind)) throw new Error('UNKNOWN_LIMIT_CLASS');
  if (!Number.isInteger(currentCount) || currentCount < 0) throw new Error('INVALID_COUNT');
  if (currentCount >= limits[kind]) {
    const error = new Error('PLAN_LIMIT_REACHED');
    error.kind = kind; error.limit = limits[kind]; throw error;
  }
  return true;
}
module.exports = Object.freeze({ PLAN_LIMITS, getEffectiveLimits, assertActiveTenant, assertUnderLimit });
