const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const gatePath = 'firebase/staging/STAGING_DEPLOYMENT_GATE_20261003.md';
const gate = fs.readFileSync(gatePath, 'utf8');

test('staging deployment gate documents privileged provisioning boundaries', () => {
  for (const marker of [
    'heritage-crm-staging',
    'No passwords',
    'service-account',
    'No staging provisioning from the browser',
    'legacy localStorage session',
    'rules are the authorization boundary',
    'disabled-a',
    'cross-tenant access denied'
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
