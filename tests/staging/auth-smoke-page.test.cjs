'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '../../pages/staging-auth-smoke.html');
const page = fs.readFileSync(pagePath, 'utf8');

test('staging auth smoke page loads Firebase Auth and staging bootstrap', () => {
  assert.match(page, /firebase-auth-compat\.js/);
  assert.match(page, /src=["']\.\.\/assets\/js\/staging\/firebase-bootstrap\.js["']/);
  assert.match(page, /src=["']\.\.\/assets\/js\/staging\/firebase-config\.js["']/);

  for (const scriptPath of [
    '../assets/js/staging/firebase-config.js',
    '../assets/js/staging/firebase-bootstrap.js'
  ]) {
    const resolvedPath = path.resolve(path.dirname(pagePath), scriptPath);
    assert.ok(
      fs.existsSync(resolvedPath) || scriptPath.endsWith('firebase-config.js'),
      'Missing staging script: ' + scriptPath
    );
  }
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

test('sign-in clears the password after both successful and failed attempts', () => {
  assert.match(page, /finally\s*\{\s*password\.value\s*=\s*'';/);
  assert.match(page, /catch\s*\(error\)\s*\{[\s\S]*?Sign-in failed:/);
});

test('sign-in and reset controls are disabled while requests are pending', () => {
  assert.match(page, /function setBusy\(busy\)\s*\{\s*signInButton\.disabled=busy;resetButton\.disabled=busy;/);
  assert.match(page, /form\.addEventListener\('submit',[\s\S]*?setBusy\(true\)/);
  assert.match(page, /resetButton\.addEventListener\('click',[\s\S]*?setBusy\(true\)/);
});

test('password reset requires an entered email and trims whitespace', () => {
  assert.match(page, /if\(!email\.value\.trim\(\)\)\{show\('Enter the staging test email first\.'/);
  assert.match(page, /sendPasswordResetEmail\(email\.value\.trim\(\)\)/);
});

test('status messages are rendered as text, not HTML', () => {
  assert.match(page, /function show\(message\)\{status\.textContent=message;\}/);
  assert.doesNotMatch(page, /status\.innerHTML\s*=/);
});

test('password is not included in status messages or reset requests', () => {
  assert.doesNotMatch(page, /show\([^\n]*password\.value/);
  assert.match(page, /sendPasswordResetEmail\(email\.value\.trim\(\)\)/);
  assert.match(page, /password\.value='';/);
});

test('setup failure disables authentication controls and prevents sign-in', () => {
  assert.match(page, /catch\(error\)\{[\s\S]*?Setup blocked:[\s\S]*?setBusy\(true\);\s*return;/);
});
