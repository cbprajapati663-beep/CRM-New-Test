'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
test('staging write smoke page is isolated and uses trusted adapter',()=>{
 const p=fs.readFileSync('pages/staging-write-smoke.html','utf8');
 assert.match(p,/firebase-functions-compat.js/);
 assert.match(p,/firebase-config.js/);
 assert.match(p,/firebase-bootstrap.js/);
 assert.match(p,/auth-session.js/);
 assert.match(p,/trusted-writes.js/);
 assert.match(p,/heritage-crm-staging/);
 assert.doesNotMatch(p,/heritage-crm-f179a/);
 assert.doesNotMatch(p,/localStorage/);
 assert.match(p,/getPlanEntitlement/);
 assert.match(p,/createLead/);
 assert.match(p,/createBranch/);
 assert.match(p,/createStaff/);
});
