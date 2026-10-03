'use strict';

require('firebase/compat/app');
require('firebase/compat/firestore');
require('firebase/compat/storage');

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require('@firebase/rules-unit-testing');

const env = initializeTestEnvironment({
  projectId: 'heritage-crm-staging',
  firestore: {
    host: '127.0.0.1',
    port: 8080
  },
  storage: {
    host: '127.0.0.1',
    port: 9199,
    rules: fs.readFileSync(
      path.join(__dirname, '../../firebase/staging/storage.rules'),
      'utf8'
    )
  }
});

test.after(async () => {
  await (await env).cleanup();
});

async function seed() {
  const testEnv = await env;
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('memberships/owner-a').set({
      tenantId: 'tenant-a',
      role: 'owner',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-a1']
    });
    await db.doc('memberships/sales-a').set({
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-a1']
    });
    await db.doc('memberships/owner-b').set({
      tenantId: 'tenant-b',
      role: 'owner',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-b1']
    });
    await db.doc('leads/lead-a').set({
      tenantId: 'tenant-a',
      branchId: 'branch-a1',
      createdByUserId: 'owner-a',
      assignedStaffId: 'sales-a'
    });
    await db.doc('leads/lead-b').set({
      tenantId: 'tenant-b',
      branchId: 'branch-b1',
      createdByUserId: 'owner-b',
      assignedStaffId: 'owner-b'
    });
  });
}

async function storageFor(uid) {
  return (await env).authenticatedContext(uid).storage();
}

test('Tenant A owner can upload to Tenant A lead documents', async () => {
  await seed();
  const storage = await storageFor('owner-a');
  const ref = storage.ref('customer-documents/tenant-a/lead-a/rc.pdf');
  await assertSucceeds(ref.put(new Uint8Array([1, 2, 3]), { contentType: 'application/pdf' }));
});

test('Tenant A owner cannot access Tenant B lead documents', async () => {
  await seed();
  const storage = await storageFor('owner-a');
  const ref = storage.ref('customer-documents/tenant-b/lead-b/rc.pdf');
  await assertFails(ref.getMetadata());
});

test('Tenant A sales user cannot upload another tenant document', async () => {
  await seed();
  const storage = await storageFor('sales-a');
  const ref = storage.ref('customer-documents/tenant-b/lead-b/rc.pdf');
  await assertFails(ref.put(new Uint8Array([1, 2, 3]), { contentType: 'application/pdf' }));
});

test('Unknown storage paths are denied', async () => {
  await seed();
  const storage = await storageFor('owner-a');
  const ref = storage.ref('unknown/internal.txt');
  await assertFails(ref.put(new Uint8Array([1]), { contentType: 'text/plain' }));
});
