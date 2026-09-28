'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.join(__dirname, '../../pages/staging-auth-smoke.html'),
  'utf8'
);

test('staging auth smoke page loads Firebase Auth and staging bootstrap', () => {
  assert.match(page, /firebase-auth-compat\.js/);
  assert.match(page, /assets\/js\/staging\/firebase-bootstrap\.js/);
  assert.match(page, /assets\/js\/staging\/firebase-config\.js/);
});

test('staging auth smoke page does not load production CRM application', () => {
  assert.doesNotMatch(page, /assets\/js\/app\.js/);
  assert.doesNotMatch(page, /assets\/js\/login-page\.js/);
  assert.doesNotMatch(page, /firebase-firestore-compat\.js/);
  assert.doesNotMatch(page, /heritage-crm-f179a/);
});

test('staging auth smoke page does not persist CRM or browser sessions', () => {
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /firestore\s*\(/i);
});

test('staging auth smoke page provides sign-in and password reset actions', () => {
  assert.match(page, /signInWithEmailAndPassword/);
  assert.match(page, /sendPasswordResetEmail/);
  assert.match(page, /await auth\.signOut\(\)/);
});

test('page explicitly prevents CRM-session assumptions', () => {
  assert.match(page, /no CRM tenant session was created/i);
  assert.match(page, /No CRM data was accessed/i);
});

test('sign-out failure is distinguished from authentication failure', () => {
  assert.match(page, /if\s*\(signedIn\)/);
  assert.match(page, /automatic sign-out failed/i);
  assert.match(page, /revoke the staging test session/i);
});
