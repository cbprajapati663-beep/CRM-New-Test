'use strict';
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { assertActiveTenant, assertUnderLimit, getEffectiveLimits } = require('./lib/planLimits');

initializeApp();
const db = getFirestore();

function requireAuth(request) {
  if (!request.auth || !request.auth.uid) throw new HttpsError('unauthenticated', 'Authentication required.');
  return request.auth.uid;
}
async function loadMembership(uid) {
  const snap = await db.doc('memberships/' + uid).get();
  if (!snap.exists) throw new HttpsError('permission-denied', 'Active membership required.');
  const m = snap.data() || {};
  if (m.status !== 'Active' || m.tenantStatus !== 'Active') throw new HttpsError('permission-denied', 'Inactive membership or tenant.');
  if (!m.tenantId || !['owner', 'manager', 'sales', 'viewer'].includes(m.role)) throw new HttpsError('permission-denied', 'Unsupported membership role.');
  return m;
}
async function loadTenant(tenantId) {
  const snap = await db.doc('tenants/' + tenantId).get();
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Tenant subscription state is missing.');
  const tenant = snap.data() || {};
  try { assertActiveTenant(tenant); getEffectiveLimits(tenant); }
  catch (e) { throw new HttpsError('failed-precondition', e.message); }
  return tenant;
}
function fail(e) {
  if (e instanceof HttpsError) throw e;
  if (e && e.message === 'PLAN_LIMIT_REACHED') throw new HttpsError('resource-exhausted', 'Plan limit reached for ' + e.kind + '.');
  throw new HttpsError('internal', 'Trusted plan enforcement failed.');
}

exports.createPlanEnforcedBranch = onCall(async request => {
  try {
    const uid = requireAuth(request), m = await loadMembership(uid), tenantId = m.tenantId, tenant = await loadTenant(tenantId);
    if (m.role !== 'owner') throw new HttpsError('permission-denied', 'Owner role required for branch creation.');
    const input = request.data && typeof request.data === 'object' ? request.data : {};
    if (String(input.tenantId || '') !== tenantId) throw new HttpsError('permission-denied', 'Cross-tenant request denied.');
    const { tenantId: _tenantId, createdByUserId: _createdByUserId, createdAt: _createdAt, ...safeInput } = input;
    const ref = db.collection('branches').doc();
    await db.runTransaction(async tx => {
      const q = await tx.get(db.collection('branches').where('tenantId', '==', tenantId).where('status', '!=', 'Inactive'));
      assertUnderLimit('branches', q.size, tenant);
      tx.set(ref, { ...safeInput, tenantId, createdByUserId: uid, createdAt: new Date().toISOString(), status: 'Active' });
    });
    return { ok: true, id: ref.id };
  } catch (e) { return fail(e); }
});

exports.createPlanEnforcedLead = onCall(async request => {
  try {
    const uid = requireAuth(request), m = await loadMembership(uid), tenantId = m.tenantId, tenant = await loadTenant(tenantId);
    const input = request.data && typeof request.data === 'object' ? request.data : {};
    if (String(input.tenantId || '') !== tenantId) throw new HttpsError('permission-denied', 'Cross-tenant request denied.');
    const { tenantId: _tenantId, createdByUserId: _createdByUserId, createdAt: _createdAt, ...safeInput } = input;
    const ref = db.collection('leads').doc();
    await db.runTransaction(async tx => {
      const q = await tx.get(db.collection('leads').where('tenantId', '==', tenantId));
      assertUnderLimit('leads', q.size, tenant);
      tx.set(ref, { ...safeInput, tenantId, createdByUserId: uid, createdAt: new Date().toISOString() });
    });
    return { ok: true, id: ref.id };
  } catch (e) { return fail(e); }
});

exports.createPlanEnforcedStaff = onCall(async request => {
  try {
    const uid = requireAuth(request);
    const m = await loadMembership(uid);
    if (m.role !== 'owner' && m.role !== 'manager') throw new HttpsError('permission-denied', 'Manager or owner role required for staff creation.');
    const tenantId = m.tenantId;
    const tenant = await loadTenant(tenantId);
    const input = request.data && typeof request.data === 'object' ? request.data : {};
    if (String(input.tenantId || '') !== tenantId) {
      throw new HttpsError('permission-denied', 'Cross-tenant request denied.');
    }
    const { tenantId: _tenantId, createdByUserId: _createdByUserId, createdAt: _createdAt, status: _status, role: _role, tenantStatus: _tenantStatus, branchIds: _branchIds, ...safeInput } = input;
    const ref = db.collection('staffAccounts').doc();
    await db.runTransaction(async tx => {
      const q = await tx.get(
        db.collection('staffAccounts')
          .where('tenantId', '==', tenantId)
          .where('status', '!=', 'Inactive')
      );
      assertUnderLimit('staff', q.size, tenant);
      tx.set(ref, {
        ...input,
        tenantId,
        createdByUserId: uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
      });
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    return fail(e);
  }
});

exports.getPlanEntitlement = onCall(async request => {
  try {
    const uid = requireAuth(request), m = await loadMembership(uid), tenant = await loadTenant(m.tenantId);
    return { plan: tenant.subscriptionPlan || 'Starter', limits: getEffectiveLimits(tenant) };
  } catch (e) { return fail(e); }
});
