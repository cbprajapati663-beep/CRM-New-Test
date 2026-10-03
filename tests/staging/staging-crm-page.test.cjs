const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const p=fs.readFileSync('pages/staging-crm.html','utf8');
test('staging CRM uses staging auth and no production Firebase or local session',()=>{
 assert.match(p,/firebase-config\.js/);assert.match(p,/firebase-bootstrap\.js/);assert.match(p,/auth-session\.js/);
 assert.match(p,/heritage-crm-staging/);assert.doesNotMatch(p,/heritage-crm-f179a/);
 assert.doesNotMatch(p,/haf_active_session_user_v2/);assert.doesNotMatch(p,/localStorage/);
 assert.match(p,/collection\('memberships'\)/);assert.match(p,/collection\('leads'\)/);
 assert.match(p,/createdByUserId/);assert.match(p,/assignedStaffId/);assert.match(p,/branchId/);
});
test('staging CRM does not read protected legacy collections',()=>{
 assert.doesNotMatch(p,/collection\(['"]tenants['"]\)/);assert.doesNotMatch(p,/collection\(['"]staffAccounts['"]\)/);assert.doesNotMatch(p,/collection\(['"]payoutSecurity['"]\)/);
});