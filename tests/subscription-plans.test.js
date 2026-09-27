const adminCardsStart = source.indexOf('function renderAdminMasterUserCards()');
const adminCardsEnd = source.indexOf('window.inspectUserPortal', adminCardsStart);
assert.ok(adminCardsStart >= 0 && adminCardsEnd > adminCardsStart, 'Admin tenant card renderer must exist');
const adminCardsRenderer = source.slice(adminCardsStart, adminCardsEnd);
for (const marker of ['escapeHtml(t.agencyName)', 'escapeHtml(t.tenantId)', 'escapeHtml(t.subscriptionPlan', 'escapeHtml(t.headOffice', 'escapeHtml(t.contactPhone', 'escapeHtml(t.status)', 'escapeJsString(t.tenantId)']) {
  assert.ok(adminCardsRenderer.includes(marker), `Admin tenant cards must safely handle ${marker}`);
}
assert.ok(adminCardsRenderer.includes("t.status === 'Active' ? 'badge-Active' : 'badge-Suspended'"), 'Tenant status badge classes must be selected from fixed class names');

const adminReportStart = source.indexOf('window.renderAdminReport');
const adminReportEnd = source.indexOf('window.inspectUserPortal', adminReportStart);
assert.ok(adminReportStart >= 0 && adminReportEnd > adminReportStart, 'Admin report renderer must exist');
const adminReportRenderer = source.slice(adminReportStart, adminReportEnd);
for (const marker of ['escapeHtml(l.name', 'escapeHtml(l.city', 'escapeHtml(l.vehModel', 'escapeHtml(l.vehType', 'escapeHtml(l.leadDate', 'escapeHtml(l.status)', 'escapeHtml(l.dealerName']) {
  assert.ok(adminReportRenderer.includes(marker), `Admin report rows must safely handle ${marker}`);
}

console.log('Admin tenant card and report safe-rendering regression checks passed.');
