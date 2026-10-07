'use strict';

require('firebase/compat/app');
require('firebase/compat/firestore');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

const env = initializeTestEnvironment({
  projectId: 'heritage-crm-staging',
  firestore: {
    host: '127.0.0.1',
    port: 8080,
    rules: fs.readFileSync(path.join(__dirname, '../../firebase/staging/firestore.rules'), 'utf8')
  }
});

test.after(async () => { await (await env).cleanup(); });

async function seed() {
  const testEnv = await env;
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc('memberships/owner-a').set({tenantId:'tenant-a',role:'owner',status:'Active',tenantStatus:'Active',branchIds:['branch-a1','branch-a2']});
    await db.doc('memberships/manager-a').set({tenantId:'tenant-a',role:'manager',status:'Active',tenantStatus:'Active',branchIds:['branch-a1']});
    await db.doc('memberships/viewer-a').set({tenantId:'tenant-a',role:'viewer',status:'Active',tenantStatus:'Active',branchIds:['branch-a1']});
    await db.doc('memberships/sales-a').set({tenantId:'tenant-a',role:'sales',status:'Active',tenantStatus:'Active',branchIds:['branch-a1']});
    await db.doc('memberships/owner-b').set({tenantId:'tenant-b',role:'owner',status:'Active',tenantStatus:'Active',branchIds:['branch-b1']});
    await db.doc('memberships/disabled-a').set({tenantId:'tenant-a',role:'sales',status:'Inactive',tenantStatus:'Active',branchIds:['branch-a1']});
    await db.doc('leads/lead-a').set({tenantId:'tenant-a',branchId:'branch-a1',createdByUserId:'owner-a',assignedStaffId:'sales-a'});
    await db.doc('leads/lead-a2').set({tenantId:'tenant-a',branchId:'branch-a2',createdByUserId:'owner-a',assignedStaffId:'owner-a'});
    await db.doc('leads/lead-b').set({tenantId:'tenant-b',branchId:'branch-b1',createdByUserId:'owner-b',assignedStaffId:'owner-b'});
  });
}

test('owner tenant isolation', async () => {
  await seed();
  const db=(await env).authenticatedContext('owner-a').firestore();
  await assertSucceeds(db.doc('leads/lead-a').get());
  await assertFails(db.doc('leads/lead-b').get());
});

test('manager and viewer are branch scoped and cross-tenant denied', async () => {
  await seed();
  const manager=(await env).authenticatedContext('manager-a').firestore();
  const viewer=(await env).authenticatedContext('viewer-a').firestore();
  await assertSucceeds(manager.doc('leads/lead-a').get());
  await assertFails(manager.doc('leads/lead-a2').get());
  await assertSucceeds(viewer.doc('leads/lead-a').get());
  await assertFails(viewer.doc('leads/lead-a2').get());
  await assertFails(manager.doc('leads/lead-b').get());
  await assertFails(viewer.doc('leads/lead-b').get());
});

test('manager cannot move a lead into an unauthorized branch', async () => {
  await seed();
  const db=(await env).authenticatedContext('manager-a').firestore();
  await assertFails(db.doc('leads/lead-a').set({
    tenantId:'tenant-a', branchId:'branch-a2', createdByUserId:'owner-a', assignedStaffId:'sales-a'
  }));
});

test('tenant cannot forge ownership or membership', async () => {
  await seed();
  const owner=(await env).authenticatedContext('owner-a').firestore();
  const sales=(await env).authenticatedContext('sales-a').firestore();
  await assertFails(owner.doc('leads/forged').set({tenantId:'tenant-b',branchId:'branch-b1',createdByUserId:'owner-a',assignedStaffId:'owner-a'}));
  await assertFails(sales.doc('memberships/sales-a').set({tenantId:'tenant-a',role:'owner',status:'Active',tenantStatus:'Active',branchIds:['branch-a1','branch-a2']}));
});

test('inactive user and unknown paths are denied', async () => {
  await seed();
  const disabled=(await env).authenticatedContext('disabled-a').firestore();
  const owner=(await env).authenticatedContext('owner-a').firestore();
  await assertFails(disabled.doc('leads/lead-a').get());
  await assertFails(owner.doc('secret/internal').get());
});

test('sales create is limited to owned allowed branch', async () => {
  await seed();
  const db=(await env).authenticatedContext('sales-a').firestore();
  await assertSucceeds(db.doc('leads/sales-created').set({tenantId:'tenant-a',branchId:'branch-a1',createdByUserId:'sales-a',assignedStaffId:'sales-a'}));
  await assertFails(db.doc('leads/sales-forbidden-branch').set({tenantId:'tenant-a',branchId:'branch-a2',createdByUserId:'sales-a',assignedStaffId:'sales-a'}));
});

test('non-owner cannot create a branch', async () => {
  await seed();
  const db=(await env).authenticatedContext('sales-a').firestore();
  await assertFails(db.doc('branches/forged-branch').set({tenantId:'tenant-a',branchId:'branch-a1',status:'Active'}));
});
