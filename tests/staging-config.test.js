const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('staging-config-check.html', 'utf8');

assert.match(page, /const expectedProjectId = 'heritage-crm-staging'/, 'Expected staging project guard');
assert.match(page, /projectId:\s*'heritage-crm-staging'/, 'Staging project ID must be configured');
assert.match(page, /config\.projectId !== expectedProjectId/, 'Mismatched project must be blocked');
assert.match(page, /config\.projectId === 'heritage-crm-f179a'/, 'Production project ID must be explicitly blocked');
assert.match(page, /firebase\.initializeApp\(config, 'heritage-crm-staging-config-check'\)/, 'Use a named Firebase app instance');
assert.match(page, /app\.auth\(\)/, 'Auth SDK initialization should be checked');
assert.doesNotMatch(page, /firebase\.firestore\(|\.collection\(|\.doc\(|\.signInWithEmailAndPassword\(|\.createUserWithEmailAndPassword\(/, 'Config check must not access Firestore or perform sign-in/account creation');

console.log('Staging config guard tests passed.');
