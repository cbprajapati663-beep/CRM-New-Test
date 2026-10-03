'use strict';

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule() {
  const source = fs.readFileSync(
    path.join(__dirname, '../../assets/js/staging/auth-session.js'),
    'utf8'
  );
  const context = {
    globalThis: {},
    window: {},
    console
  };
  context.globalThis = context.window;
  vm.runInNewContext(source, context);
  return context.window.HAFStagingAuthSession;
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
  const session = loadModule();
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
  globalThis.HAFStagingFirebase = { getServices: () => services };

  const result = await session.signInAndLoadMembership('sales-a@staging.invalid', 'secret');

  if (result.uid !== 'uid-a' || result.tenantId !== 'tenant-a' || result.role !== 'sales') {
    throw new Error('Trusted membership fields were not returned correctly.');
  }
  if ('password' in result || 'clientSuppliedRole' in result) {
    throw new Error('Untrusted/secret fields leaked into the session.');
  }
});

test('signs out when authenticated UID has no membership', async () => {
  const session = loadModule();
  const services = servicesFor({ exists: false });
  globalThis.HAFStagingFirebase = { getServices: () => services };

  await assert.rejects(
    () => session.signInAndLoadMembership('unknown@staging.invalid', 'secret'),
    /No trusted membership/
  );
  if (!services.calls.includes('signOut')) {
    throw new Error('Missing membership did not trigger sign-out.');
  }
});

test('rejects inactive membership and signs out', async () => {
  const session = loadModule();
  const services = servicesFor({
    membershipData: {
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Inactive',
      tenantStatus: 'Active',
      branchIds: ['branch-a1']
    }
  });
  globalThis.HAFStagingFirebase = { getServices: () => services };

  await assert.rejects(
    () => session.signInAndLoadMembership('sales-a@staging.invalid', 'secret'),
    /inactive/
  );
  if (!services.calls.includes('signOut')) {
    throw new Error('Inactive membership did not trigger sign-out.');
  }
});
