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
    'legacy `localStorage` CRM session',
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
