const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const gatePath = 'firebase/staging/STAGING_DEPLOYMENT_GATE_20261003.md';
const gate = fs.readFileSync(gatePath, 'utf8');

test('staging deployment gate documents privileged provisioning boundaries', () => {
  for (const marker of [
    'heritage-crm-staging',
    'Do not put passwords',
    'service-account',
    'Do not provision staging identities from browser JavaScript',
    'browser-persisted CRM session',
    'rules remain the authorization boundary',
    'disabled-a',
    'Cross-tenant access'
  ]) {
    assert.ok(gate.toLowerCase().includes(marker.toLowerCase()), marker);
  }
});

test('staging gate does not contain credential-shaped material', () => {
  assert.doesNotMatch(gate, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(gate, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
  assert.doesNotMatch(gate, /password\s*[:=]\s*[^<\n]{8,}/i);
  assert.doesNotMatch(gate, /client_email\s*[:=]/i);
});

test('staging deployment workflow is manual, staging-only, and credential-safe', () => {
  const workflow = fs.readFileSync('.github/workflows/deploy-staging-security.yml', 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /GITHUB_REF_NAME/);
  assert.match(workflow, /security\/auth-implementation-gate-20261003/);
  assert.match(workflow, /Verify staging deployment target/);
  assert.match(workflow, /heritage-crm-f179a/);
  assert.match(workflow, /environment:\s*staging/);
  assert.match(workflow, /heritage-crm-staging/);
  assert.match(workflow, /FIREBASE_SERVICE_ACCOUNT_STAGING/);
  assert.match(workflow, /GOOGLE_APPLICATION_CREDENTIALS/);
  assert.match(workflow, /rm -f.*firebase-service-account\.json/);
  assert.doesNotMatch(workflow, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(workflow, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
});
