'use strict';

require('firebase/compat/app');
require('firebase/compat/firestore');

const test = require('node:test');
const assert = require('node:assert/strict');
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
    port: 8080,
    rules: fs.readFileSync(
      path.join(__dirname, '../../firebase/staging/firestore.rules'),
      'utf8'
    )
  }
});

test.after(async () => {
  await (await env).cleanup();
});

async function seed() {
  const testEnv = await env;
  const db = testEnv
    .authenticatedContext('owner-a')
    .firestore();

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = ctx.firestore();
    await adminDb.doc('memberships/owner-a').set({
      tenantId: 'tenant-a',
      role: 'owner',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-a1', 'branch-a2']
    });
    await adminDb.doc('memberships/sales-a').set({
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-a1']
    });
    await adminDb.doc('memberships/owner-b').set({
      tenantId: 'tenant-b',
      role: 'owner',
      status: 'Active',
      tenantStatus: 'Active',
      branchIds: ['branch-b1']
    });
    await adminDb.doc('memberships/disabled-a').set({
      tenantId: 'tenant-a',
      role: 'sales',
      status: 'Inactive',
      tenantStatus: 'Active',
      branchIds: ['branch-a1']
    });
    await adminDb.doc('leads/lead-a').set({
      tenantId: 'tenant-a',
      branchId: 'branch-a1',
      createdByUserId: 'owner-a',
      assignedStaffId: 'sales-a'
    });
    await adminDb.doc('leads/lead-b').set({
      tenantId: 'tenant-b',
      branchId: 'branch-b1',
      createdByUserId: 'owner-b',
      assignedStaffId: 'owner-b'
    });
  });

  return db;
}

test('Tenant A owner can read Tenant A lead', async () => {
  const db = await seed();
  await assertSucceeds(db.doc('leads/lead-a').get());
});

test('Tenant A owner cannot read Tenant B lead', async () => {
  const db = (await env).authenticatedContext('owner-a').firestore();
  await assertFails(db.doc('leads/lead-b').get());
});

test('Tenant A cannot create a lead claiming Tenant B ownership', async () => {
  const db = (await env).authenticatedContext('owner-a').firestore();
  await assertFails(db.doc('leads/forged').set({
    tenantId: 'tenant-b',
    branchId: 'branch-b1',
    createdByUserId: 'owner-a',
    assignedStaffId: 'owner-a'
  }));
});

test('Sales user cannot self-promote through membership writes', async () => {
  const db = (await env).authenticatedContext('sales-a').firestore();
  await assertFails(db.doc('memberships/sales-a').set({
    tenantId: 'tenant-a',
    role: 'owner',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-a1', 'branch-a2']
  }));
});

test('Inactive user is denied protected lead access', async () => {
  const db = (await env).authenticatedContext('disabled-a').firestore();
  await assertFails(db.doc('leads/lead-a').get());
});

test('Unknown protected paths are denied', async () => {
  const db = (await env).authenticatedContext('owner-a').firestore();
  await assertFails(db.doc('secret/internal').get());
});
