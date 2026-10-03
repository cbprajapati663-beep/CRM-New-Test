'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('pages/staging-login.html', 'utf8');
const inlineScripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)]
  .map((match) => match[1])
  .join('\\n');

test('staging login uses staging bootstrap and Auth bridge only', () => {
  assert.match(html, /firebase-auth-compat\\.js/);
  assert.match(html, /firebase-config\\.js/);
  assert.match(html, /firebase-bootstrap\\.js/);
  assert.match(html, /auth-session\\.js/);
  assert.match(html, /HAFStagingAuthSession\\.signInAndLoadMembership/);
  assert.doesNotMatch(html, /heritage-crm-f179a/);
  assert.doesNotMatch(html, /firebase\\.firestore\\(\\)\\.collection\\(['"]tenants['"]/);
  assert.doesNotMatch(inlineScripts, /localStorage\\.(setItem|getItem)\\(/);
});

test('staging login does not accept tenant or role as browser-auth credentials', () => {
  assert.doesNotMatch(html, /getElementById\\(['"]loginUserId['"]/);
  assert.doesNotMatch(html, /tenantId\\s*=\\s*document/);
  assert.doesNotMatch(html, /role\\s*=\\s*document/);
});

test('staging login exposes password recovery without browser persistence', () => {
  assert.match(html, /resetButton/);
  assert.match(html, /sendPasswordResetEmail/);
  assert.doesNotMatch(inlineScripts, /localStorage/);
  assert.doesNotMatch(inlineScripts, /sessionStorage/);
});
