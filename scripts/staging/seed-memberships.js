'use strict';

const admin = require('../../functions/node_modules/firebase-admin');

const EXPECTED_PROJECT_ID = 'heritage-crm-staging';

const memberships = Object.freeze({
  'AlJhW4PmD1WUfcUJWsFNnWl73nU2': {
    tenantId: 'tenant-a',
    role: 'owner',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-a1', 'branch-a2']
  },
  '6Fe8vrLA1afkgKzDuOU48M7KEva2': {
    tenantId: 'tenant-a',
    role: 'manager',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-a1']
  },
  'nITnx5yfktW1WL9WU444ZmvONXI2': {
    tenantId: 'tenant-a',
    role: 'sales',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-a1']
  },
  'Gyx1jn3PEbcM3TCzUvCw0wqNEft1': {
    tenantId: 'tenant-a',
    role: 'viewer',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-a1']
  },
  '235WGzQ5fPPbiTLj8ohcmMW53YK2': {
    tenantId: 'tenant-b',
    role: 'owner',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-b1']
  },
  '98v85AKJkOXr36DxjYdO1M6YcxA3': {
    tenantId: 'tenant-b',
    role: 'sales',
    status: 'Active',
    tenantStatus: 'Active',
    branchIds: ['branch-b1']
  },
  '1UQ2aFCrSMNq8accU71u6IJURx72': {
    tenantId: 'tenant-a',
    role: 'sales',
    status: 'Inactive',
    tenantStatus: 'Active',
    branchIds: ['branch-a1']
  }
});

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required.');
}

const credential = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
if (credential.project_id !== EXPECTED_PROJECT_ID) {
  throw new Error('Refusing to seed memberships: service account is not for heritage-crm-staging.');
}

admin.initializeApp({
  credential: admin.credential.cert(credential),
  projectId: EXPECTED_PROJECT_ID
});

async function main() {
  const db = admin.firestore();
  const batch = db.batch();

  for (const [uid, membership] of Object.entries(memberships)) {
    batch.set(db.collection('memberships').doc(uid), membership, { merge: true });
  }

  await batch.commit();
  console.log('Seeded staging memberships:', Object.keys(memberships).length);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await admin.app().delete(); } catch (_) {}
  });
