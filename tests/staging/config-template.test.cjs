'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../..');
const configTemplate = fs.readFileSync(
  path.join(root, 'assets/js/staging/firebase-config.example.js'),
  'utf8'
);
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
const productionEntry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('staging config template is pinned to the staging project', () => {
  assert.match(configTemplate, /projectId:\s*["']heritage-crm-staging["']/);
  assert.doesNotMatch(configTemplate, /heritage-crm-f179a/);
});

test('staging config template uses placeholders, not actual credentials', () => {
  for (const placeholder of [
    'REPLACE_WITH_STAGING_WEB_API_KEY',
    'REPLACE_WITH_STAGING_STORAGE_BUCKET',
    'REPLACE_WITH_STAGING_SENDER_ID',
    'REPLACE_WITH_STAGING_WEB_APP_ID'
  ]) {
    assert.ok(configTemplate.includes(placeholder), 'Missing placeholder: ' + placeholder);
  }
  assert.match(configTemplate, /Never put service-account credentials or private keys here/);
});

test('real staging config is excluded from Git tracking', () => {
  assert.match(gitignore, /^\/assets\/js\/staging\/firebase-config\.js$/m);
});

test('production entry point does not load staging-only assets', () => {
  assert.doesNotMatch(productionEntry, /assets\/js\/staging\/firebase-config\.js/);
  assert.doesNotMatch(productionEntry, /assets\/js\/staging\/firebase-bootstrap\.js/);
  assert.doesNotMatch(productionEntry, /pages\/staging-auth-smoke\.html/);
});

const authorizationPlan = fs.readFileSync(
  path.join(root, 'docs/STAGING_AUTHORIZATION_TEST_PLAN.md'),
  'utf8'
);

test('staging authorization plan covers cross-tenant and privilege boundaries', () => {
  for (const scenario of [
    'TEN-02',
    'TEN-03',
    'TEN-04',
    'STAFF-03',
    'FILE-02',
    'MAP-01'
  ]) {
    assert.ok(authorizationPlan.includes(scenario), 'Missing scenario: ' + scenario);
  }
  assert.match(authorizationPlan, /client-side route hiding.*not authorization/i);
  assert.ok(/No authorization tests have been executed/i.test(authorizationPlan));
  assert.match(authorizationPlan, /Do not approve production cutover until/);
});

const cutoverChecklist = fs.readFileSync(
  path.join(root, 'docs/AUTH_MIGRATION_CUTOVER_ROLLBACK_CHECKLIST.md'),
  'utf8'
);

test('migration cutover checklist requires explicit gates and rollback readiness', () => {
  for (const gate of [
    'Identity mapping reviewed',
    'Firestore authorization verified',
    'Storage authorization verified',
    'Cross-tenant denial tests passed',
    'Backup restore rehearsal passed',
    'Rollback rehearsal passed'
  ]) {
    assert.ok(cutoverChecklist.includes(gate), 'Missing cutover gate: ' + gate);
  }
  assert.match(cutoverChecklist, /Final decision:\*\* NO-GO/);
  assert.match(cutoverChecklist, /Do not cut over/);
  assert.match(cutoverChecklist, /No production migration, deployment, or data change is authorized/);
});
