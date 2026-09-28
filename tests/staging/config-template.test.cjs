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
