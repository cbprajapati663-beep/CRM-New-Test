'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const configTemplate = fs.readFileSync(
  path.join(__dirname, '../../assets/js/staging/firebase-config.example.js'),
  'utf8'
);

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
