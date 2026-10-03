'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const firestore = fs.readFileSync(path.join(__dirname, '../../firebase/staging/firestore.rules'), 'utf8');
const storage = fs.readFileSync(path.join(__dirname, '../../firebase/staging/storage.rules'), 'utf8');

test('staging Firestore rules are default-deny and membership-backed', () => {
  assert.match(firestore, /match \/memberships\/\{uid\}/);
  assert.match(firestore, /allow write: if false;/);
  assert.match(firestore, /match \/\{document=\*\*\}/);
  assert.match(firestore, /membership\(\)\.tenantId/);
  assert.match(firestore, /membership\(\)\.status == 'Active'/);
  assert.match(firestore, /membership\(\)\.tenantStatus == 'Active'/);
});
test('credential and payout collections are client-denied', () => {
  assert.match(firestore, /match \/tenants\/\{tenantId\} \{ allow read, write: if false; \}/);
  assert.match(firestore, /match \/staffAccounts\/\{staffId\} \{ allow read, write: if false; \}/);
  assert.match(firestore, /match \/payoutSecurity\/\{documentId\} \{ allow read, write: if false; \}/);
});
test('storage is tenant and lead bound with catch-all deny', () => {
  assert.match(storage, /match \/customer-documents\/\{tenantId\}\/\{leadId\}\/\{allPaths=\*\*\}/);
  assert.match(storage, /firestore\.get\(/);
  assert.match(storage, /membership\(\)\.tenantId/);
  assert.match(storage, /match \/\{allPaths=\*\*\} \{ allow read, write: if false; \}/);
});