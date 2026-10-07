'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule() {
  const source = fs.readFileSync(
    path.join(__dirname, '../../assets/js/staging/auth-session.js'),
    'utf8'
  );
  const window = {};
  const context = { globalThis: window, window, console };
  vm.runInNewContext(source, context);
  return { session: window.HAFStagingAuthSession, window };
}

function servicesFor(overrides) {
  const calls = [];
  const membershipData = overrides.membershipData;
  return {
    projectId: 'heritage-crm-staging',
    auth: {
      signInWithEmailAndPassword: async () => ({
        user: { uid: overrides.uid || 'uid-a' }
      }),
      signOut: async () => calls.push('signOut')
    },
    db: {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: overrides.exists !== false,
            data: () => membershipData
          })
        })
      })
    },
    calls
  };
}

test('returns only trusted active membership fields', async () => {
  const loaded = loadModule();
  const services = servicesFor({
    membershipData: {
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-a1'],
      clientSuppliedRole: 'owner',
      password: 'must-not-be-returned'
    }
  });
  loaded.window.HAFStagingFirebase = { getServices: () => services };

  const result = await loaded.session.signInAndLoadMembership(
    'sales-a@staging.invalid',
    'secret'
  );

  assert.equal(result.uid, 'uid-a');
  assert.equal(result.tenantId, 'tenant-a');
  assert.equal(result.role, 'sales');
  assert.equal(result.status, 'Active');
  assert.equal(result.tenantStatus, 'Active');
  assert.deepEqual(Array.from(result.branchIds), ['branch-a1']);
  assert.equal('password' in result, false);
  assert.equal('clientSuppliedRole' in result, false);
});

test('signs out when authenticated UID has no membership', async () => {
  const loaded = loadModule();
  const services = servicesFor({ exists: false });
  loaded.window.HAFStagingFirebase = { getServices: () => services };

  await assert.rejects(
    () => loaded.session.signInAndLoadMembership(
      'unknown@staging.invalid',
      'secret'
    ),
    /No trusted membership/
  );
  assert.equal(services.calls.includes('signOut'), true);
});

test('rejects inactive membership and signs out', async () => {
  const loaded = loadModule();
  const services = servicesFor({
    membershipData: {
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Inactive',
      tenantStatus: 'Active',
      branchIds: ['branch-a1']
    }
  });
  loaded.window.HAFStagingFirebase = { getServices: () => services };

  await assert.rejects(
    () => loaded.session.signInAndLoadMembership(
      'sales-a@staging.invalid',
      'secret'
    ),
    /inactive/
  );
  assert.equal(services.calls.includes('signOut'), true);
});


test('staging auth session exposes recovery and state-listener hooks without local persistence', () => {
  const loaded = loadModule();
  assert.equal(typeof loaded.session.sendPasswordResetEmail, 'function');
  assert.equal(typeof loaded.session.onAuthStateChanged, 'function');
  const source = fs.readFileSync(
    path.join(__dirname, '../../assets/js/staging/auth-session.js'),
    'utf8'
  );
  assert.equal(source.includes('localStorage'), false);
  assert.equal(source.includes('sessionStorage'), false);
});



test('password reset is delegated only to staging Firebase Auth', async () => {
  const loaded = loadModule();
  const calls = [];
  const services = servicesFor({
    membershipData: { tenantId: 'tenant-a', role: 'sales', status: 'Active', tenantStatus: 'Active', branchIds: ['branch-a1'] }
  });
  services.auth.sendPasswordResetEmail = async email => calls.push(email);
  loaded.window.HAFStagingFirebase = { getServices: () => services };

  await loaded.session.sendPasswordResetEmail(' sales-a@staging.invalid ');
  assert.deepEqual(calls, ['sales-a@staging.invalid']);
});

test('auth state listener delegates to staging Firebase Auth', () => {
  const loaded = loadModule();
  let callbackSeen = null;
  const unsubscribe = () => {};
  const services = servicesFor({ membershipData: { tenantId: 'tenant-a', role: 'sales', status: 'Active', tenantStatus: 'Active', branchIds: ['branch-a1'] } });
  services.auth.onAuthStateChanged = callback => {
    callbackSeen = callback;
    return unsubscribe;
  };
  loaded.window.HAFStagingFirebase = { getServices: () => services };

  const returned = loaded.session.onAuthStateChanged(() => {});
  assert.equal(typeof callbackSeen, 'function');
  assert.equal(returned, unsubscribe);
});

test('current membership lookup signs out when trusted membership is invalid', async () => {
  const loaded = loadModule();
  const services = servicesFor({
    membershipData: {
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: 'not-an-array'
    }
  });
  services.auth.currentUser = { uid: 'uid-a' };
  loaded.window.HAFStagingFirebase = { getServices: () => services };

  await assert.rejects(
    () => loaded.session.getCurrentMembership(),
    /branchIds array/
  );
  assert.equal(services.calls.includes('signOut'), true);
});

test('rejects a non-staging Firebase project before authentication', async () => {
  const loaded = loadModule();
  const services = servicesFor({ membershipData: { tenantId: 'tenant-a', role: 'sales', status: 'Active', tenantStatus: 'Active', branchIds: ['branch-a1'] } });
  services.projectId = 'heritage-crm-f179a';
  loaded.window.HAFStagingFirebase = { getServices: () => services };
  await assert.rejects(() => loaded.session.signInAndLoadMembership('sales-a@staging.invalid', 'secret'), /Unexpected Firebase project/);
});

test('rejects malformed trusted membership branch data', async () => {
  const loaded = loadModule();
  const services = servicesFor({ membershipData: { tenantId: 'tenant-a', role: 'sales', status: 'Active', tenantStatus: 'Active', branchIds: 'branch-a1' } });
  loaded.window.HAFStagingFirebase = { getServices: () => services };
  await assert.rejects(() => loaded.session.signInAndLoadMembership('sales-a@staging.invalid', 'secret'), /branchIds array/);
  assert.equal(services.calls.includes('signOut'), true);
});
