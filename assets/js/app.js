
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    }


    // Escape document IDs before placing them inside quoted inline JavaScript arguments.
    function escapeJsString(value) {
        return String(value ?? '').replace(/[\\'\r\n\u2028\u2029]/g, char => ({'\\':'\\\\', "'":"\\'", '\r':'\\r', '\n':'\\n', '\u2028':'\\u2028', '\u2029':'\\u2029'}[char]));
    }

    const firebaseConfig = {
        apiKey: "AIzaSyACLaRm5yH301JVqlvl8KYglANOc3uh6w",
        authDomain: "heritage-crm-f179a.firebaseapp.com",
        projectId: "heritage-crm-f179a",
        storageBucket: "heritage-crm-f179a.firebasestorage.app",
        messagingSenderId: "434634669830",
        appId: "1:434634669830:web:afa939caa85df772066887"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const leadsCollection = db.collection('leads');
    const tenantsCollection = db.collection('tenants');
    let tenantsCache = [];
    let tenantsReady = false;

    let leads = [];
    let pModalApprovedBase = 0;
    let isPayoutDeskUnlocked = false;
    let inspectingTenantId = null;
    let activeReportingTenantId = null;
    let currentAuthMode = 'client';
    const nowLocal = new Date();
    const todayStr = [nowLocal.getFullYear(), String(nowLocal.getMonth()+1).padStart(2,'0'), String(nowLocal.getDate()).padStart(2,'0')].join('-');
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });

    window.setAuthTab = function(mode) {
        currentAuthMode = mode;
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginPassword').value = '';
        if (mode === 'admin') {
            document.getElementById('btnAuthAdmin').classList.add('active');
            document.getElementById('btnAuthClient').classList.remove('active');
            document.getElementById('authHeaderTitle').textContent = "👑 IT Admin Master Access";
            document.getElementById('authHeaderSub').textContent = "Sign in to SaaS Master Console";
            document.getElementById('authFieldUserIdGroup').style.display = 'none';
            document.getElementById('loginUserId').value = 'admin';
            document.getElementById('authSubmitBtn').textContent = "Unlock IT Master Console";
        } else {
            document.getElementById('btnAuthClient').classList.add('active');
            document.getElementById('btnAuthAdmin').classList.remove('active');
            document.getElementById('authHeaderTitle').textContent = "🏢 Client Tenant Portal";
            document.getElementById('authHeaderSub').textContent = "Sign in to your auto finance workspace";
            document.getElementById('authFieldUserIdGroup').style.display = 'block';
            document.getElementById('loginUserId').value = 'heritage auto finance';
            document.getElementById('authSubmitBtn').textContent = "Launch Portal";
        }
    };

    function getStoredTenants() {
        return Array.isArray(tenantsCache) ? tenantsCache : [];
    }

    async function loadTenantsFromFirestore() {
        try {
            const snapshot = await tenantsCollection.orderBy('tenantId').get();
            tenantsCache = [];
            snapshot.forEach(doc => {
                tenantsCache.push({ docId: doc.id, ...doc.data() });
            });
            tenantsReady = true;
            return tenantsCache;
        } catch (error) {
            console.error("Tenant load error:", error);
            tenantsReady = false;
            return [];
        }
    }

    async function ensureDefaultTenantAndMigrateLocalData() {
        try {
            const snapshot = await tenantsCollection.get();
            const existingIds = new Set();
            snapshot.forEach(doc => existingIds.add((doc.data().tenantId || doc.id).toLowerCase()));

            const defaultTenant = {
                tenantId: "heritage auto finance",
                agencyName: "Heritage Auto Finance (Chirag Prajapati)",
                headOffice: "Mehsana, Gujarat",
                contactPhone: "+91 7600211085",
                role: "client",
                password: "123",
                rentAmount: 3500,
                expiryDate: "2029-12-31",
                status: "Active"
            };

            if (!existingIds.has(defaultTenant.tenantId)) {
                await tenantsCollection.doc(defaultTenant.tenantId).set(defaultTenant);
            }
            await loadTenantsFromFirestore();
        } catch (error) {
            console.error("Tenant initialization error:", error);
            await loadTenantsFromFirestore();
        }
    }

    function getAdminPassword() {
        return localStorage.getItem('haf_master_admin_pass') || 'admin123';
    }

    function getCurrentSessionUser() {
        try {
            const data = localStorage.getItem('haf_active_session_user_v2');
            if (!data || data === "undefined") return null;
            return JSON.parse(data);
        } catch(e) {
            localStorage.removeItem('haf_active_session_user_v2');
            return null;
        }
    }

    function setCurrentSessionUser(userObj) {
        try {
            if (!userObj) {
                localStorage.removeItem('haf_active_session_user_v2');
            } else {
                // Never persist tenant credentials in browser session storage.
                const safeUser = { ...userObj };
                delete safeUser.password;
                localStorage.setItem('haf_active_session_user_v2', JSON.stringify(safeUser));
            }
        } catch(e) {
            console.error("Storage write error:", e);
        }
        applyPortalPermissions();
    }

    async function handleUserLogin(e) {
        e.preventDefault();
        const pass = document.getElementById('loginPassword').value.trim();

        if (currentAuthMode === 'admin') {
            if (pass === getAdminPassword()) {
                document.getElementById('loginError').style.display = 'none';
                document.getElementById('authOverlay').style.display = 'none';
                setCurrentSessionUser({ tenantId: "admin", agencyName: "IT Master Company", role: "superadmin" });
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        } else {
            const uid = document.getElementById('loginUserId').value.trim().toLowerCase();
            const loginError = document.getElementById('loginError');

            if (!uid || !pass) {
                loginError.style.display = 'block';
                return;
            }

            const btn = document.getElementById('authSubmitBtn');
            const oldText = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Checking...";

            try {
                const snapshot = await tenantsCollection
                    .where('tenantId', '==', uid)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    const matched = { docId: doc.id, ...doc.data() };

                    if (matched.password === pass) {
                        if (matched.status === 'Suspended') {
                            alert("⚠️ Aapka software rent subscription suspend / inactive hai. Kripya IT Provider se sampark karein.");
                            return;
                        }

                        loginError.style.display = 'none';
                        document.getElementById('authOverlay').style.display = 'none';
                        setCurrentSessionUser(matched);
                    } else {
                        loginError.style.display = 'block';
                    }
                } else {
                    loginError.style.display = 'block';
                }
            } catch (error) {
                console.error("Client login error:", error);
                loginError.textContent = "Login service error.";
                loginError.style.display = 'block';
            } finally {
                btn.disabled = false;
                btn.textContent = oldText;
            }
        }
    }

    function logoutCurrentUser() {
        if (!confirm("Kya aap logout karna chahte hain?")) return;
        setCurrentSessionUser(null);
        location.reload();
    }

    window.openChangeMyPasswordModal = function() {
        document.getElementById('cmp_oldPass').value = '';
        document.getElementById('cmp_newPass').value = '';
        document.getElementById('cmpError').textContent = 'Current password incorrect!';
        document.getElementById('cmpError').style.display = 'none';
        document.getElementById('changeMyPasswordModal').style.display = 'flex';
    };

    window.handleSaveMyPassword = async function(e) {
        e.preventDefault();
        const oldP = document.getElementById('cmp_oldPass').value.trim();
        const newP = document.getElementById('cmp_newPass').value.trim();
        const u = getCurrentSessionUser();

        if (!u) return;

        // Security hardening: require a stronger password for every password change.
        // Existing passwords remain usable so current users are not locked out.
        const strongPassword = newP.length >= 8 &&
            /[A-Za-z]/.test(newP) &&
            /[0-9]/.test(newP) &&
            newP !== oldP;
        if (!strongPassword) {
            const errorEl = document.getElementById('cmpError');
            errorEl.textContent = 'New password must be at least 8 characters, include a letter and a number, and differ from the current password.';
            errorEl.style.display = 'block';
            return;
        }

        if (u.role === 'superadmin') {
            const currentMaster = getAdminPassword();
            if (oldP === currentMaster) {
                localStorage.setItem('haf_master_admin_pass', newP);
                alert("✓ Admin Master Password successfully update ho gaya!");
                document.getElementById('changeMyPasswordModal').style.display = 'none';
            } else {
                document.getElementById('cmpError').style.display = 'block';
            }
        } else {
            try {
                const uid = u.tenantId.toLowerCase();
                const snapshot = await tenantsCollection
                    .where('tenantId', '==', uid)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    const target = doc.data();

                    if (target.password === oldP) {
                        await doc.ref.update({
                            password: newP,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        setCurrentSessionUser(u);
                        alert("✓ Aapka password successfully update ho gaya!");
                        document.getElementById('changeMyPasswordModal').style.display = 'none';
                    } else {
                        document.getElementById('cmpError').style.display = 'block';
                    }
                } else {
                    document.getElementById('cmpError').style.display = 'block';
                }
            } catch (error) {
                console.error("Change tenant password error:", error);
            }
        }
    };

    window.switchView = function(viewKey) {
        if (viewKey === 'payoutdesk' && !isPayoutDeskUnlocked) {
            document.getElementById('passwordGateModal').style.display = 'flex';
            document.getElementById('secretPinInput').value = '';
            document.getElementById('pinErrorMsg').style.display = 'none';
            return;
        }

        document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
        
        const targetBtn = document.getElementById(
            viewKey === 'pipeline' ? 'tabPipeline' :
            viewKey === 'disbursedhub' ? 'tabDisbursed' :
            viewKey === 'dealers' ? 'tabDealers' :
            viewKey === 'payoutdesk' ? 'tabSecretPayouts' :
            viewKey === 'datahealth' ? 'tabDataHealth' :
            viewKey === 'workflow' ? 'tabWorkflow' : 'tabFollowups'
        );
        if (targetBtn) targetBtn.classList.add('active');

        document.getElementById('view-pipeline').style.display = (viewKey === 'pipeline') ? 'grid' : 'none';
        document.getElementById('view-disbursedhub').style.display = (viewKey === 'disbursedhub') ? 'block' : 'none';
        document.getElementById('view-dealers').style.display = (viewKey === 'dealers') ? 'block' : 'none';
        document.getElementById('view-payoutdesk').style.display = (viewKey === 'payoutdesk') ? 'block' : 'none';
        document.getElementById('view-followups').style.display = (viewKey === 'followups') ? 'block' : 'none';
        document.getElementById('view-datahealth').style.display = (viewKey === 'datahealth') ? 'block' : 'none';
        document.getElementById('view-workflow').style.display = (viewKey === 'workflow') ? 'block' : 'none';

        if (viewKey === 'pipeline') renderViews();
        if (viewKey === 'disbursedhub') renderDisbursedHubTable();
        if (viewKey === 'workflow') renderSmartWorkflow();
        if (viewKey === 'dealers') renderDealerLedgerTable();
        if (viewKey === 'payoutdesk') renderPayoutDeskTable();
        if (viewKey === 'followups') renderFollowups();
        if (viewKey === 'datahealth') renderDataHealth();
    };

    function lockPayoutDesk() {
        isPayoutDeskUnlocked = false;
        switchView('pipeline');
        alert("🔒 Payout Desk has been locked successfully.");
    }

    function closePasswordGate() {
        document.getElementById('passwordGateModal').style.display = 'none';
    }

    function handlePinSubmit(e) {
        e.preventDefault();
        const entered = document.getElementById('secretPinInput').value;
        if (entered === (localStorage.getItem('haf_payout_pin') || '7600')) {
            isPayoutDeskUnlocked = true;
            document.getElementById('passwordGateModal').style.display = 'none';
            switchView('payoutdesk');
        } else {
            document.getElementById('pinErrorMsg').style.display = 'block';
        }
    }

    function applyPortalPermissions() {
        const u = getCurrentSessionUser();
        if (!u) {
            document.getElementById('authOverlay').style.display = 'flex';
            return;
        }
        document.getElementById('authOverlay').style.display = 'none';

        if (inspectingTenantId) {
            document.getElementById('activeUserBadge').textContent = `👁️ Viewing: ${inspectingTenantId}`;
            document.getElementById('headerTenantBrand').textContent = `🚗 ${inspectingTenantId.toUpperCase()} CRM`;
            document.getElementById('btnExitUserView').style.display = 'inline-block';
            document.getElementById('btnChangeMyPass').style.display = 'none';
            document.getElementById('btnExportExcel').style.display = 'none';
            
            document.getElementById('crmNavTabsBar').style.display = 'flex';
            document.getElementById('colAddLeadForm').style.display = 'block';
            document.querySelector('.crm-container').classList.remove('admin-mode');
            document.getElementById('adminUserMasterDeck').style.display = 'none';
            document.getElementById('clientPipelineTablePanel').style.display = 'block';
            document.getElementById('cardCustomerHold').style.display = 'block';
            document.getElementById('tabSecretPayouts').style.display = 'flex';
            refreshDealerDropdowns();
            switchView('pipeline');
            return;
        }

        document.getElementById('btnExitUserView').style.display = 'none';

        if (u.role === 'superadmin') {
            document.getElementById('crmNavTabsBar').style.display = 'none';
            document.getElementById('activeUserBadge').textContent = `👑 IT Master Admin`;
            document.getElementById('headerTenantBrand').textContent = `⚡ Heritage FinTech Core`;
            document.getElementById('btnChangeMyPass').style.display = 'inline-block';
            document.getElementById('btnExportExcel').style.display = 'none'; 
            
            document.getElementById('colAddLeadForm').style.display = 'none';
            document.querySelector('.crm-container').classList.add('admin-mode');
            document.getElementById('cardCustomerHold').style.display = 'none';

            document.getElementById('adminUserMasterDeck').style.display = 'block';
            document.getElementById('clientPipelineTablePanel').style.display = 'none';
            renderAdminMasterUserCards();
        } else {
            document.getElementById('crmNavTabsBar').style.display = 'flex';
            document.getElementById('activeUserBadge').textContent = `👤 ${u.agencyName}`;
            document.getElementById('headerTenantBrand').textContent = `🚗 ${u.agencyName} CRM`;
            document.getElementById('btnChangeMyPass').style.display = 'inline-block';
            document.getElementById('btnExportExcel').style.display = 'none'; 

            document.getElementById('colAddLeadForm').style.display = 'block';
            document.querySelector('.crm-container').classList.remove('admin-mode');
            document.getElementById('adminUserMasterDeck').style.display = 'none';
            document.getElementById('clientPipelineTablePanel').style.display = 'block';
            document.getElementById('cardCustomerHold').style.display = 'block';
            document.getElementById('tabSecretPayouts').style.display = 'flex';
            refreshDealerDropdowns();
            switchView('pipeline');
        }
    }

    function renderAdminMasterUserCards() {
        const tenants = getStoredTenants();
        if (!Array.isArray(tenants)) return;
        const container = document.getElementById('userCardsContainer');
        container.innerHTML = '';

        tenants.forEach(t => {
            let uLiveFiles = 0, uLiveAmt = 0;
            let uDisFiles = 0, uDisAmt = 0;

            leads.forEach(l => {
                const c = (l.tenantId || l.createdBy || 'heritage auto finance').toLowerCase();
                const isMatch = (c === t.tenantId.toLowerCase()) || 
                                (t.tenantId.includes('heritage') && (!c || c === 'admin'));

                if (isMatch) {
                    const lAmt = Number(String(l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
                    const disAmt = Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
                    if (l.status !== 'Disbursed' && l.status !== 'Rejected') {
                        uLiveFiles++;
                        uLiveAmt += lAmt;
                    }
                    if (l.status === 'Disbursed') {
                        uDisFiles++;
                        uDisAmt += disAmt;
                    }
                }
            });

            const card = document.createElement('div');
            card.className = 'user-master-card';
            card.innerHTML = `
                <div>
                    <div style="font-size:1.1rem; font-weight:700; color:var(--primary);">🏢 ${escapeHtml(t.agencyName)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;">
                        Username: <strong style="color:var(--text);">${escapeHtml(t.tenantId)}</strong> | Office: <strong style="color:#38bdf8;">${escapeHtml(t.headOffice || 'Mehsana')}</strong> | Phone: <strong style="color:#4ade80;">${escapeHtml(t.contactPhone || '-')}</strong> | Rent: <strong>₹${t.rentAmount}/mo</strong> | Status: <span class="badge ${t.status === 'Active' ? 'badge-Active' : 'badge-Suspended'}">${escapeHtml(t.status)}</span>
                    </div>
                </div>

                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <div class="user-stat-pill">
                        <div class="num" style="color:var(--primary);">${uLiveFiles}</div>
                        <div class="sub">Live Files</div>
                    </div>
                    <div class="user-stat-pill">
                        <div class="num">${formatINR(uLiveAmt)}</div>
                        <div class="sub">Live Amt</div>
                    </div>
                    <div class="user-stat-pill">
                        <div class="num" style="color:var(--success);">${uDisFiles}</div>
                        <div class="sub">Disbursed</div>
                    </div>
                    <div class="user-stat-pill">
                        <div class="num" style="color:var(--success);">${formatINR(uDisAmt)}</div>
                        <div class="sub">Disbursed Amt</div>
                    </div>
                </div>

                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    <button class="btn-action" style="background:#f59e0b; color:#000; font-weight:700;" onclick="openEditTenantModal('${escapeJsString(t.tenantId)}')">⚙️ Manage License</button>
                    <button class="btn-action" style="background:#38bdf8; color:#000; font-weight:700;" onclick="openAdminRentBillModal('${escapeJsString(t.tenantId)}', '${escapeJsString(t.agencyName)}', ${Number(t.rentAmount) || 0}, '${escapeJsString(t.expiryDate)}')">🧾 Bill</button>
                    <button class="btn-action" style="background:#10b981; color:#000; font-weight:700;" onclick="openAdminTenantReportModal('${escapeJsString(t.tenantId)}', '${escapeJsString(t.agencyName)}')">📊 Report</button>
                    <button class="btn-action" style="background:var(--saas); color:#000; font-weight:700;" onclick="inspectUserPortal('${escapeJsString(t.tenantId)}')">👁️ View</button>
                    <button class="btn-quick btn-del" onclick="deleteTenantAccount('${escapeJsString(t.tenantId)}')">🗑️</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    window.openEditTenantModal = function(tid) {
        const tenants = getStoredTenants();
        const t = tenants.find(x => x.tenantId && x.tenantId.toLowerCase() === tid.toLowerCase());
        if (!t) return;

        document.getElementById('tenantModalTitle').textContent = "⚙️ Manage Client License & Validity";
        document.getElementById('isEditingTenant').value = "true";
        document.getElementById('t_tenantId').value = t.tenantId;
        document.getElementById('t_tenantId').readOnly = true;
        document.getElementById('t_agencyName').value = t.agencyName || '';
        document.getElementById('t_headOffice').value = t.headOffice || 'Mehsana, Gujarat';
        document.getElementById('t_contactPhone').value = t.contactPhone || '+91 7600211085';
        document.getElementById('t_password').value = t.password || '';
        document.getElementById('t_monthlyRent').value = t.rentAmount || 0;
        document.getElementById('t_expiryDate').value = t.expiryDate || '';
        document.getElementById('t_status').value = t.status || 'Active';

        document.getElementById('saasTenantModal').style.display = 'flex';
    };

    window.openAddTenantModal = function() {
        document.getElementById('tenantModalTitle').textContent = "➕ Onboard New Client (Tenant Agency)";
        document.getElementById('isEditingTenant').value = "false";
        document.getElementById('t_tenantId').value = '';
        document.getElementById('t_tenantId').readOnly = false;
        document.getElementById('t_agencyName').value = '';
        document.getElementById('t_headOffice').value = 'Mehsana, Gujarat';
        document.getElementById('t_contactPhone').value = '+91 7600211085';
        document.getElementById('t_password').value = '';
        document.getElementById('t_monthlyRent').value = '3000';
        const d = new Date(); d.setFullYear(d.getFullYear() + 1);
        document.getElementById('t_expiryDate').value = d.toISOString().split('T')[0];
        document.getElementById('t_status').value = 'Active';

        document.getElementById('saasTenantModal').style.display = 'flex';
    };

    function closeAddTenantModal() {
        document.getElementById('saasTenantModal').style.display = 'none';
    }

    async function handleSaveTenantClient(e) {
        e.preventDefault();
        const isEditing = document.getElementById('isEditingTenant').value === "true";
        const tid = document.getElementById('t_tenantId').value.trim().toLowerCase();
        const agency = document.getElementById('t_agencyName').value.trim();
        const headOffice = document.getElementById('t_headOffice').value.trim();
        const contactPhone = document.getElementById('t_contactPhone').value.trim();
        const pass = document.getElementById('t_password').value.trim();
        const rent = Number(document.getElementById('t_monthlyRent').value) || 0;
        const exp = document.getElementById('t_expiryDate').value;
        const stat = document.getElementById('t_status').value;

        if (!tid || !agency || !pass || !headOffice || !contactPhone) {
            alert("Sabhi fields bharein (Client ID, Agency Name, Head Office, Contact Phone, Password).");
            return;
        }

        try {
            const docRef = tenantsCollection.doc(tid);
            const existing = await docRef.get();

            if (!isEditing && existing.exists) {
                alert("Ye Client ID pehle se registered hai.");
                return;
            }

            const tenantData = {
                tenantId: tid,
                agencyName: agency,
                headOffice: headOffice,
                contactPhone: contactPhone,
                role: "client",
                password: pass,
                rentAmount: rent,
                expiryDate: exp,
                status: stat,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await docRef.set(tenantData, { merge: true });
            closeAddTenantModal();
            alert(`✓ Client "${agency}" successfully save ho gaya!`);
        } catch (error) {
            console.error("Save tenant error:", error);
            alert("❌ User save nahi hua.");
        }
    }

    window.openAdminRentBillModal = function(tid, agencyName, rentAmt, expiryDate) {
        document.getElementById('billDate').textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('billInvNo').textContent = 'INV/' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('billAgencyName').textContent = agencyName;
        document.getElementById('billTenantId').textContent = tid;
        document.getElementById('billPeriod').textContent = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        document.getElementById('billExpiry').textContent = expiryDate;
        document.getElementById('billRentAmt').textContent = formatINR(rentAmt);
        document.getElementById('billTotalPayable').textContent = formatINR(rentAmt);
        document.getElementById('adminRentBillModal').style.display = 'flex';
    };

    window.openAdminTenantReportModal = function(tid, agencyName) {
        activeReportingTenantId = tid;
        document.getElementById('admRptAgencyTitle').textContent = agencyName.toUpperCase();
        document.getElementById('admRptTenantId').textContent = tid;
        document.getElementById('admRptDate').textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('admRptMonth').value = '';
        document.getElementById('admRptScope').value = 'All';

        generateAdminTenantReportView();
        document.getElementById('adminTenantReportModal').style.display = 'flex';
    };

    window.generateAdminTenantReportView = function() {
        if (!activeReportingTenantId) return;

        const scope = document.getElementById('admRptScope').value;
        const monthFilter = document.getElementById('admRptMonth').value;

        let tenantLeads = leads.filter(l => {
            const c = (l.tenantId || l.createdBy || 'heritage auto finance').toLowerCase();
            return (c === activeReportingTenantId.toLowerCase()) || 
                   (activeReportingTenantId.includes('heritage') && (!c || c === 'admin'));
        });

        if (scope === 'Live') {
            tenantLeads = tenantLeads.filter(l => l.status !== 'Disbursed' && l.status !== 'Rejected');
        } else if (scope === 'Disbursed') {
            tenantLeads = tenantLeads.filter(l => l.status === 'Disbursed');
        }

        if (monthFilter) {
            tenantLeads = tenantLeads.filter(l => {
                const checkDate = (l.status === 'Disbursed' && l.disbursedDate) ? l.disbursedDate : (l.leadDate || '');
                return checkDate.startsWith(monthFilter);
            });
        }

        document.getElementById('admRptFilterStatus').textContent = `${scope} Files (${monthFilter ? monthFilter : 'All Months'})`;
        document.getElementById('admRptTotalCount').textContent = `${tenantLeads.length} Records`;

        const tbody = document.getElementById('admRptTableBody');
        tbody.innerHTML = '';

        let sumApproved = 0, sumDisbursed = 0;

        if (tenantLeads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888; padding:20px;">Chune gaye filter ke liye koi files nahi mili.</td></tr>';
            document.getElementById('admRptSumApproved').textContent = '₹0';
            document.getElementById('admRptSumDisbursed').textContent = '₹0';
            return;
        }

        tenantLeads.forEach(l => {
            const app = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const dis = (l.status === 'Disbursed') ? (Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0) : 0;
            sumApproved += app;
            sumDisbursed += dis;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(l.name || 'Unnamed')}</strong><br><small style="color:#666;">${escapeHtml(l.city || 'Mehsana')}</small></td>
                <td>${escapeHtml(l.vehModel || '-')}<br><small style="color:#666;">${escapeHtml(l.vehType || 'Car')}</small></td>
                <td>${escapeHtml(l.leadDate || todayStr)}</td>
                <td><span style="font-weight:700; color:${l.status === 'Disbursed' ? '#10b981' : '#d4af37'};">${escapeHtml(l.status)}</span></td>
                <td style="text-align:right;">${formatINR(app)}</td>
                <td style="text-align:right; font-weight:700; color:#10b981;">${formatINR(dis)}</td>
                <td>${escapeHtml(l.dealerName || 'Direct')}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('admRptSumApproved').textContent = formatINR(sumApproved);
        document.getElementById('admRptSumDisbursed').textContent = formatINR(sumDisbursed);
    };

    window.inspectUserPortal = function(tid) {
        inspectingTenantId = tid;
        applyPortalPermissions();
        renderMetrics();
        renderViews();
    };

    window.exitUserView = function() {
        inspectingTenantId = null;
        applyPortalPermissions();
        renderMetrics();
        renderViews();
    };

    async function deleteTenantAccount(tid) {
        if (!confirm(`Kya aap client "${tid}" ko delete karna chahte hain?`)) return;

        try {
            await tenantsCollection.doc(tid.toLowerCase()).delete();
            tenantsCache = tenantsCache.filter(t => !t.tenantId || t.tenantId.toLowerCase() !== tid.toLowerCase());
            renderAdminMasterUserCards();
            alert("✓ Client account delete ho gaya.");
        } catch (error) {
            console.error("Delete tenant error:", error);
        }
    }

    function toggleResetUserField() {
        const r = document.getElementById('resetRoleTarget').value;
        document.getElementById('resetUserIdField').style.display = (r === 'admin') ? 'none' : 'block';
    }

    function openResetPasswordModal() {
        document.getElementById('resetErrorMsg').style.display = 'none';
        document.getElementById('resetInputPhone').value = '';
        document.getElementById('resetInputNewPass').value = '';
        document.getElementById('passwordResetModal').style.display = 'flex';
        toggleResetUserField();
    }

    function closeResetPasswordModal() {
        document.getElementById('passwordResetModal').style.display = 'none';
    }

    async function handleResetPasswordSubmit(e) {
        e.preventDefault();
        const role = document.getElementById('resetRoleTarget').value;
        const phone = document.getElementById('resetInputPhone').value.replace(/\D/g, '');
        const newPass = document.getElementById('resetInputNewPass').value.trim();
        const resetError = document.getElementById('resetErrorMsg');

        if (newPass.length < 8 || !/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
            resetError.textContent = 'New password must be at least 8 characters and include both a letter and a number.';
            resetError.style.display = 'block';
            return;
        }

        resetError.textContent = 'Verification failed. Please check the registered phone number.';

        if (role === 'admin') {
            // Admin reset keeps the existing master verification number.
            if (phone === '7600211085' || phone === '917600211085') {
                localStorage.setItem('haf_master_admin_pass', newPass);
                alert("✓ IT Admin Master Password successfully reset ho gaya!");
                closeResetPasswordModal();
            } else {
                resetError.style.display = 'block';
            }
            return;
        }

        const uid = document.getElementById('resetInputUserId').value.trim().toLowerCase();
        if (!uid || !phone) {
            resetError.style.display = 'block';
            return;
        }

        try {
            const snapshot = await tenantsCollection
                .where('tenantId', '==', uid)
                .limit(1)
                .get();

            if (snapshot.empty) {
                resetError.style.display = 'block';
                return;
            }

            const doc = snapshot.docs[0];
            const tenant = doc.data();
            const registeredPhone = String(tenant.contactPhone || '').replace(/\D/g, '');

            if (!registeredPhone || phone !== registeredPhone) {
                resetError.style.display = 'block';
                return;
            }

            await doc.ref.update({
                password: newPass,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("✓ Password update ho gaya!");
            closeResetPasswordModal();
        } catch (error) {
            console.error("Reset password error:", error);
            resetError.textContent = 'Password reset service error. Please try again.';
            resetError.style.display = 'block';
        }
    }

    function getLeadScopedList() {
        const u = getCurrentSessionUser();
        if (inspectingTenantId) {
            return leads.filter(l => {
                const c = (l.tenantId || l.createdBy || '').toLowerCase();
                return (c === inspectingTenantId.toLowerCase()) || 
                       (inspectingTenantId.includes('heritage') && (!c || c === 'admin'));
            });
        }
        if (u && u.role === 'superadmin') {
            return leads;
        }
        if (u) {
            return leads.filter(l => {
                const c = (l.tenantId || l.createdBy || '').toLowerCase();
                const isHeritage = u.tenantId.toLowerCase().includes('heritage');
                return (c === u.tenantId.toLowerCase()) || (isHeritage && (!c || c === 'admin'));
            });
        }
        return [];
    }

    function renderMetrics() {
        const scopedLeads = getLeadScopedList();
        const u = getCurrentSessionUser();
        const isAdmin = (u && u.role === 'superadmin' && !inspectingTenantId);

        let liveCount = 0;
        let loginCount = 0, loginAmount = 0;
        let disburseCount = 0, disbursedAmount = 0;
        let totalHoldPending = 0;

        scopedLeads.forEach(l => {
            const amt = Number(String(l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const disAmt = Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;

            if (l.status !== 'Disbursed' && l.status !== 'Rejected' && l.status !== 'Not Interested') {
                liveCount++;
                loginCount++;
                loginAmount += amt;
            }
            if (l.status === 'Disbursed') {
                disburseCount++;
                disbursedAmount += disAmt;
                if (l.holdStatus === 'Hold Kept') {
                    totalHoldPending += Number(String(l.holdAmount || 0).replace(/[^0-9.]/g, '')) || 0;
                }
            }
        });

        document.getElementById('lbl-live-leads').textContent = isAdmin ? "All Users Live Files" : "Live Open Files";
        document.getElementById('lbl-login-leads').textContent = isAdmin ? "All Users Login Files" : "Login Files";
        document.getElementById('lbl-login-amount').textContent = isAdmin ? "All Users Login Amt (₹)" : "Total Login Amt (₹)";
        document.getElementById('lbl-disburse-leads').textContent = isAdmin ? "All Users Disbursed (No)" : "Disbursed (Closed)";
        document.getElementById('lbl-month-business').textContent = isAdmin ? "All Users Disbursed Amt (₹)" : "Total Disbursed (₹)";

        document.getElementById('m-live-leads').textContent = liveCount;
        document.getElementById('badge-live-count').textContent = liveCount;
        document.getElementById('m-login-leads').textContent = loginCount;
        document.getElementById('m-login-amount').textContent = formatINR(loginAmount);
        document.getElementById('m-disburse-leads').textContent = disburseCount;
        document.getElementById('badge-disbursed-count').textContent = disburseCount;
        document.getElementById('m-month-business').textContent = formatINR(disbursedAmount);
        document.getElementById('m-total-hold').textContent = formatINR(totalHoldPending);
        document.getElementById('tab-total-hold').textContent = formatINR(totalHoldPending);
    }

    window.clearPipelineFilters = function() {
        const q = document.getElementById('searchQuery');
        const st = document.getElementById('filterStatus');
        const mo = document.getElementById('liveMonthFilter');
        if (q) q.value = '';
        if (st) st.value = 'All';
        if (mo) mo.value = '';
        renderViews();
    };

    // Read-only quality scan: never edits or deletes customer records.
    window.renderDataHealth = function() {
        const records = getLeadScopedList();
        const body = document.getElementById('dataHealthTableBody');
        if (!body) return;
        body.textContent = '';
        const issues = [];
        const mobileGroups = new Map();
        const vehicleGroups = new Map();
        let missingCount = 0, duplicateCount = 0, overdueCount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const normalize = value => String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
        records.forEach(l => {
            const mobile = String(l.mobile || '').replace(/\D/g, '');
            const vehicle = normalize(l.vehRegNo);
            if (mobile.length >= 10) {
                const key = mobile.slice(-10);
                if (!mobileGroups.has(key)) mobileGroups.set(key, []);
                mobileGroups.get(key).push(l);
            }
            if (vehicle.length >= 5) {
                if (!vehicleGroups.has(vehicle)) vehicleGroups.set(vehicle, []);
                vehicleGroups.get(vehicle).push(l);
            }
            const missing = [];
            if (!String(l.name || '').trim()) missing.push('Customer name missing');
            if (mobile.length < 10) missing.push('Mobile number missing/invalid');
            if (!String(l.dealerName || '').trim()) missing.push('Dealer/partner missing');
            if (missing.length) {
                missingCount++;
                issues.push({type:'Missing details', lead:l, detail:missing.join(', ')});
            }
            const status = String(l.status || '');
            const follow = String(l.followDate || '').slice(0, 10);
            if (follow && status !== 'Disbursed' && status !== 'Rejected' && status !== 'Cancelled') {
                const d = new Date(follow + 'T00:00:00');
                if (!Number.isNaN(d.getTime()) && d < today) {
                    overdueCount++;
                    issues.push({type:'Overdue follow-up', lead:l, detail:'Follow-up date: ' + follow});
                }
            }
        });

        const addDuplicateIssues = (groups, label) => {
            groups.forEach((group, key) => {
                if (group.length > 1) {
                    duplicateCount += group.length - 1;
                    group.forEach(l => issues.push({type:'Possible duplicate', lead:l, detail:label + ': ' + key + ' (' + group.length + ' records)'}));
                }
            });
        };
        addDuplicateIssues(mobileGroups, 'Mobile');
        addDuplicateIssues(vehicleGroups, 'Vehicle');

        document.getElementById('dh-scanned').textContent = records.length;
        document.getElementById('dh-missing').textContent = missingCount;
        document.getElementById('dh-duplicates').textContent = duplicateCount;
        document.getElementById('dh-overdue').textContent = overdueCount;
        const badge = document.getElementById('badge-datahealth-count');
        if (badge) badge.textContent = String(issues.length);

        if (!issues.length) {
            const tr = document.createElement('tr'), td = document.createElement('td');
            td.colSpan = 6; td.textContent = '✅ Koi common data-quality issue nahi mila.';
            td.style.cssText = 'text-align:center;padding:18px;color:var(--success);';
            tr.appendChild(td); body.appendChild(tr); return;
        }
        issues.forEach(issue => {
            const tr = document.createElement('tr');
            const values = [
                issue.type,
                issue.lead.name || 'Unnamed customer',
                issue.lead.mobile || '—',
                issue.lead.vehRegNo || '—',
                issue.lead.status || '—',
                issue.detail
            ];
            values.forEach(value => {
                const td = document.createElement('td');
                td.textContent = String(value);
                tr.appendChild(td);
            });
            body.appendChild(tr);
        });
    };

    function renderViews() {
        const q = (document.getElementById('searchQuery').value || '').trim().toLowerCase();
        const statusFilter = document.getElementById('filterStatus').value;
        const liveMonthVal = document.getElementById('liveMonthFilter') ? document.getElementById('liveMonthFilter').value : '';

        const scopedLeads = getLeadScopedList();
        let liveLeads = scopedLeads.filter(l => l.status !== 'Disbursed');

        if (liveMonthVal) {
            liveLeads = liveLeads.filter(l => {
                let dateStr = l.leadDate || '';
                if (!dateStr && l.updatedAt && typeof l.updatedAt.toDate === 'function') {
                    dateStr = l.updatedAt.toDate().toISOString().split('T')[0];
                }
                return dateStr.startsWith(liveMonthVal);
            });
        }

        const filtered = liveLeads.filter(l => {
            const matchesQuery = (l.name || '').toLowerCase().includes(q) || 
                                 (l.mobile || '').includes(q) || 
                                 (l.dealerName || '').toLowerCase().includes(q) || 
                                 (l.bankNbfc || '').toLowerCase().includes(q) ||
                                 (l.city || '').toLowerCase().includes(q) ||
                                 (l.vehRegNo || '').toLowerCase().includes(q) ||
                                 (l.vehModel || '').toLowerCase().includes(q) ||
                                 (l.doNo || '').toLowerCase().includes(q) ||
                                 (l.applicationNo || '').toLowerCase().includes(q);
            const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
            return matchesQuery && matchesStatus;
        });

        const tbody = document.getElementById('leadsTableBody');
        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:20px;">Koi active live lead match nahi hui.</td></tr>';
            return;
        }

        filtered.forEach(l => {
            const row = document.createElement('tr');
            const cleanMobile = (l.mobile || '').replace(/\D/g, '');

            let docStatusHtml = '';
            if (l.status === 'Documents Pending') {
                const docs = l.docsReceived || {};
                let rCount = 0;
                if (docs.aadhaar) rCount++;
                if (docs.pan) rCount++;
                if (docs.bank) rCount++;
                if (docs.rc) rCount++;
                docStatusHtml = `<span class="badge ${rCount === 4 ? 'badge-Sanctioned' : 'badge-New'}">${rCount}/4 Docs</span>`;
            } else if (l.status === 'Login Done' || l.status === 'Sanctioned') {
                docStatusHtml = `<span style="color:var(--success); font-size:0.75rem;">✓ Verified for Login</span>`;
            } else {
                docStatusHtml = `<span style="color:var(--text-muted); font-size:0.75rem;">-</span>`;
            }

            const rawApp = l.approvedAmount || l.loanAmount || 0;
            const appAmt = Number(String(rawApp).replace(/[^0-9.]/g, '')) || 0;
            const approvedDisplay = appAmt > 0 
                ? `<strong style="color:#4ade80;">${formatINR(appAmt)}</strong>` 
                : `<span style="color:var(--text-muted); font-size:0.75rem;">Pending</span>`;

            let lDateDisplay = l.leadDate || '';
            if (!lDateDisplay && l.updatedAt && typeof l.updatedAt.toDate === 'function') {
                lDateDisplay = l.updatedAt.toDate().toISOString().split('T')[0];
            }

            const doButtonHtml = (l.status === 'Sanctioned' || l.status === 'Disbursed')
                ? `<button class="btn-quick btn-do" onclick="generateDO('${escapeJsString(l.docId)}')" title="Print Delivery Order">📄 DO</button>`
                : '';

            row.innerHTML = `
                <td>
                    <strong>${escapeHtml(l.name || 'Unnamed Client')}</strong><br>
                    <span style="color:var(--text-muted); font-size:0.75rem;">${escapeHtml(l.city || 'Mehsana')}</span>
                    <div class="quick-actions">
                        <a class="btn-quick btn-call" href="tel:${cleanMobile}">📞</a>
                        <a class="btn-quick btn-wa" href="https://wa.me/91${cleanMobile}" target="_blank">💬 WA</a>
                    </div>
                </td>
                <td>${escapeHtml(l.vehModel || '-')}<br><span style="color:var(--text-muted); font-size:0.72rem;">${escapeHtml(l.vehType || 'Used')}${l.vehRegNo ? ' • ' + escapeHtml(l.vehRegNo) : ''}</span></td>
                <td><small style="color:var(--primary);">📅 ${lDateDisplay || todayStr}</small></td>
                <td><strong style="color:var(--primary);">${formatINR(Number(String(l.loanAmount).replace(/[^0-9.]/g, '')) || 0)}</strong></td>
                <td>${approvedDisplay}</td>
                <td><strong style="color:#c084fc;">${escapeHtml(l.dealerName || 'Direct Customer')}</strong><br><small style="color:#60a5fa;">${escapeHtml(l.bankNbfc || 'Pending')}</small></td>
                <td><span class="badge badge-${(l.status || 'New').replace(/\s+/g, '')}">${escapeHtml(l.status || 'New')}</span></td>
                <td>${docStatusHtml}</td>
                <td style="max-width: 155px; font-size:0.78rem; color:#f4b41a;">💬 ${escapeHtml(l.lastConv || '-')}</td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <div style="display:flex; gap:4px;">
                            <button class="btn-quick btn-edit" onclick="editLead('${escapeJsString(l.docId)}')">✏️</button>
                            <button class="btn-quick" style="background:rgba(56,189,248,.12);color:#38bdf8;border:1px solid rgba(56,189,248,.3);" onclick="showLeadAudit('${escapeJsString(l.docId)}')" title="Audit details">🧾</button>
                            <button class="btn-quick btn-del" onclick="deleteLead('${escapeJsString(l.docId)}')">🗑️</button>
                        </div>
                        ${doButtonHtml}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function renderDisbursedHubTable() {
        const scopedLeads = getLeadScopedList();
        let disbursedLeads = scopedLeads.filter(l => l.status === 'Disbursed');
        const monthVal = document.getElementById('disbursedMonthFilter').value;

        if (monthVal) {
            disbursedLeads = disbursedLeads.filter(l => (l.disbursedDate || '').startsWith(monthVal));
        }

        const tbody = document.getElementById('disbursedHubTableBody');
        tbody.innerHTML = '';

        if (disbursedLeads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; color:var(--text-muted); padding:25px;">Chune gaye filter me koi Disbursed file nahi mili.</td></tr>';
            return;
        }

        disbursedLeads.forEach(l => {
            const row = document.createElement('tr');
            const appAmt = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const disAmt = Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const holdAmt = Number(String(l.holdAmount || 0).replace(/[^0-9.]/g, '')) || 0;

            row.innerHTML = `
                <td><strong>${escapeHtml(l.name || 'Unnamed Client')}</strong><br><small style="color:var(--text-muted);">${escapeHtml(l.city || 'Mehsana')}</small></td>
                <td>${escapeHtml(l.vehModel || '-')}<br><small style="color:#60a5fa;">${escapeHtml(l.bankNbfc || '-')}</small></td>
                <td><strong style="color:var(--primary); font-size:0.8rem;">📅 ${escapeHtml(l.disbursedDate || 'Not Set')}</strong></td>
                <td><strong style="color:#4ade80;">${formatINR(appAmt)}</strong></td>
                <td><strong style="color:var(--primary);">${formatINR(disAmt)}</strong></td>
                <td><strong style="color:${holdAmt > 0 && l.holdStatus === 'Hold Kept' ? '#f87171' : 'var(--text-muted)'};">${formatINR(holdAmt)}</strong></td>
                <td><span style="font-weight:600;">${escapeHtml(l.holdReason || '-')}</span></td>
                <td><span style="font-size:0.75rem; color:#f4b41a;">${escapeHtml(l.holdRemarks || '-')}</span></td>
                <td><span class="badge ${l.holdStatus === 'Hold Kept' ? 'badge-Suspended' : 'badge-Active'}">${escapeHtml(l.holdStatus || 'None')}</span></td>
                <td><strong>${formatINR(Number(String(l.rtoCharges || 0).replace(/[^0-9.]/g, '')) || 0)}</strong></td>
                <td><span class="badge ${l.rtoStatus === 'Completed' ? 'badge-Sanctioned' : 'badge-New'}">${escapeHtml(l.rtoStatus || 'Pending')}</span></td>
                <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <button class="btn-quick btn-edit" onclick="openRtoHoldModal('${escapeJsString(l.docId)}')">⚙️ Manage</button>
                        <button class="btn-quick btn-do" onclick="generateDO('${escapeJsString(l.docId)}')">📄 DO</button>
                        <button class="btn-quick btn-reopen" onclick="revertToLive('${escapeJsString(l.docId)}')">↩ Revert</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    window.revertToLive = async function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        const newStatus = prompt(`Naya status type karein (Sanctioned / Login Done / Documents Pending):`, "Sanctioned");
        if (!newStatus || newStatus.trim() === "") return;

        await leadsCollection.doc(docId).update({
            status: newStatus.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        switchView('pipeline');
    };

    window.openRtoHoldModal = function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        document.getElementById('modalDocId').value = docId;
        document.getElementById('modalCustTitle').textContent = `Clearance: ${l.name || ''} (${l.vehModel || ''})`;
        document.getElementById('m_approvedAmount').value = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('m_disbursedAmount').value = Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('m_disbursedDate').value = l.disbursedDate || todayStr;
        document.getElementById('m_rtoCharges').value = Number(String(l.rtoCharges || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('m_rtoStatus').value = l.rtoStatus || 'Pending';
        document.getElementById('m_holdAmount').value = Number(String(l.holdAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('m_holdReason').value = l.holdReason || 'None';
        document.getElementById('m_holdRemarks').value = l.holdRemarks || '';
        document.getElementById('m_holdStatus').value = l.holdStatus || 'Hold Kept';

        document.getElementById('rtoHoldModal').style.display = 'flex';
    };

    window.closeRtoHoldModal = function() {
        document.getElementById('rtoHoldModal').style.display = 'none';
    };

    document.getElementById('rtoHoldForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const docId = document.getElementById('modalDocId').value;
        if (!docId) return;

        await leadsCollection.doc(docId).update({
            approvedAmount: Number(document.getElementById('m_approvedAmount').value) || 0,
            disbursedAmount: Number(document.getElementById('m_disbursedAmount').value) || 0,
            disbursedDate: document.getElementById('m_disbursedDate').value || todayStr,
            rtoCharges: Number(document.getElementById('m_rtoCharges').value) || 0,
            rtoStatus: document.getElementById('m_rtoStatus').value,
            holdAmount: Number(document.getElementById('m_holdAmount').value) || 0,
            holdReason: document.getElementById('m_holdReason').value,
            holdRemarks: document.getElementById('m_holdRemarks').value,
            holdStatus: document.getElementById('m_holdStatus').value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeRtoHoldModal();
    });

    window.openDealerStatementModal = function() {
        const scopedLeads = getLeadScopedList();
        const selectedDealer = document.getElementById('dealerSelectFilter').value;
        const currentU = getCurrentSessionUser();
        let targetLeads = scopedLeads;
        if (selectedDealer !== 'All') {
            targetLeads = scopedLeads.filter(l => (l.dealerName || 'Direct Customer').trim() === selectedDealer);
        }

        if (targetLeads.length === 0) {
            alert("Statement ke liye koi files nahi hain!");
            return;
        }

        const activeTenantId = inspectingTenantId || (currentU ? currentU.tenantId : '');
        const currentTenantObj = tenantsCache.find(t => t.tenantId && t.tenantId.toLowerCase() === (activeTenantId || '').toLowerCase());
        const brandName = currentTenantObj ? currentTenantObj.agencyName : (currentU ? currentU.agencyName : "HERITAGE AUTO FINANCE");

        document.getElementById('stmt_brand_title').textContent = brandName.toUpperCase();
        document.getElementById('stmt_date').textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('stmt_dealer').textContent = selectedDealer === 'All' ? 'All Partners' : selectedDealer;
        document.getElementById('stmt_total_files').textContent = targetLeads.length + ' Files';

        let sumApproved = 0, sumPayable = 0;
        const tbody = document.getElementById('stmt_table_body');
        tbody.innerHTML = '';

        targetLeads.forEach(l => {
            const app = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const dis = l.status === 'Disbursed' ? (Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0) : 0;
            const cut = Number(String(l.dealerCut || 0).replace(/[^0-9.]/g, '')) || 0;

            sumApproved += app;
            sumPayable += cut;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(l.name || 'Unnamed')}</strong></td>
                <td>${escapeHtml(l.vehModel || '-')}</td>
                <td>${escapeHtml(l.status || '-')}</td>
                <td style="text-align:right;">${formatINR(app)}</td>
                <td style="text-align:right;">${formatINR(dis)}</td>
                <td style="text-align:right; font-weight:700; color:#b89628;">${formatINR(cut)}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('stmt_total_approved').textContent = formatINR(sumApproved);
        document.getElementById('stmt_total_payable').textContent = formatINR(sumPayable);

        document.getElementById('dealerStatementModal').style.display = 'flex';
    };

    window.closeDealerStatementModal = function() {
        document.getElementById('dealerStatementModal').style.display = 'none';
    };

    function renderDealerLedgerTable() {
        const scopedLeads = getLeadScopedList();
        const dealerSet = new Set(["Direct Customer"]);
        scopedLeads.forEach(l => {
            const dName = (l.dealerName || 'Direct Customer').trim();
            if (dName) dealerSet.add(dName);
        });

        const selectBox = document.getElementById('dealerSelectFilter');
        const currentSelected = selectBox.value;
        selectBox.innerHTML = '<option value="All">All Dealers / Partners</option>';
        dealerSet.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            if (d === currentSelected) opt.selected = true;
            selectBox.appendChild(opt);
        });

        const selectedDealer = selectBox.value;
        let displayedLeads = scopedLeads;
        if (selectedDealer !== 'All') {
            displayedLeads = scopedLeads.filter(l => (l.dealerName || 'Direct Customer').trim() === selectedDealer);
        }

        let totalPayable = 0;
        const tbody = document.getElementById('dealerLedgerTableBody');
        tbody.innerHTML = '';

        displayedLeads.forEach(l => {
            const dName = (l.dealerName || 'Direct Customer').trim();
            const appAmt = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const disAmt = l.status === 'Disbursed' ? (Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0) : 0;
            const cut = Number(String(l.dealerCut || 0).replace(/[^0-9.]/g, '')) || 0;
            totalPayable += cut;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong style="color:#c084fc;">🤝 ${escapeHtml(dName)}</strong></td>
                <td><strong>${escapeHtml(l.name || 'Unnamed')}</strong></td>
                <td>${escapeHtml(l.vehModel || '-')}</td>
                <td><span class="badge badge-${(l.status || 'New').replace(/\s+/g, '')}">${escapeHtml(l.status || 'New')}</span></td>
                <td><strong style="color:#4ade80;">${formatINR(appAmt)}</strong></td>
                <td><strong style="color:var(--primary);">${formatINR(disAmt)}</strong></td>
                <td><strong style="color:${cut > 0 ? 'var(--danger)' : 'var(--text-muted)'}; font-size:0.95rem;">${formatINR(cut)}</strong></td>
                <td>
                    <button class="btn-quick btn-edit" onclick="openEditDealerCutModal('${escapeJsString(l.docId)}')">⚙️ Set Cut</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('tab-dealer-payout-total').textContent = formatINR(totalPayable);
        document.getElementById('badge-dealers-count').textContent = dealerSet.size;
    }

    window.openEditDealerCutModal = function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        document.getElementById('dc_leadDocId').value = docId;
        document.getElementById('dc_custName').textContent = l.name || 'Customer';
        document.getElementById('dc_dealerName').value = l.dealerName || 'Direct Customer';
        document.getElementById('dc_approvedAmt').value = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('dc_dealerCut').value = Number(String(l.dealerCut || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('editDealerCutModal').style.display = 'flex';
    };

    window.handleSaveDealerCutFromLedger = async function(e) {
        e.preventDefault();
        const docId = document.getElementById('dc_leadDocId').value;
        const newCut = Number(document.getElementById('dc_dealerCut').value) || 0;
        const l = leads.find(item => item.docId === docId);

        const approvedAmt = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        const rate = Number(l.commRate || 1.5);
        const gross = Math.round((approvedAmt * rate) / 100);
        const net = Math.max(0, gross - newCut);

        await leadsCollection.doc(docId).update({
            dealerCut: newCut,
            netComm: net,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('editDealerCutModal').style.display = 'none';
        alert("✓ Dealer Cut update ho gaya!");
    };

    function renderPayoutDeskTable() {
        const scopedLeads = getLeadScopedList();
        let disbursedLeads = scopedLeads.filter(l => l.status === 'Disbursed');
        const monthVal = document.getElementById('payoutMonthFilter').value;

        if (monthVal) {
            disbursedLeads = disbursedLeads.filter(l => (l.disbursedDate || '').startsWith(monthVal));
        }

        const tbody = document.getElementById('payoutDeskTableBody');
        tbody.innerHTML = '';

        let totalGross = 0, totalCuts = 0, totalNet = 0, totalReceived = 0;

        if (disbursedLeads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color:var(--text-muted); padding:25px;">Koi payout record nahi mila.</td></tr>';
            return;
        }

        disbursedLeads.forEach(l => {
            const row = document.createElement('tr');
            const approvedBase = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
            const rate = Number(l.commRate || 1.5);
            const gross = Math.round((approvedBase * rate) / 100);
            
            let cut = 0;
            const cutType = l.dealerCutType || 'amount';
            const cutRaw = Number(String(l.dealerCutRaw !== undefined ? l.dealerCutRaw : (l.dealerCut || 0)).replace(/[^0-9.]/g, '')) || 0;
            if (cutType === 'percent') {
                cut = Math.round((approvedBase * cutRaw) / 100);
            } else {
                cut = cutRaw;
            }

            const net = Math.max(0, gross - cut);
            const pStatus = l.payoutStatus || 'Pending';
            const payoutBadge = 'payout-' + pStatus.replace(/\s+/g, '');

            totalGross += gross;
            totalCuts += cut;
            totalNet += net;
            if (pStatus === 'Received' || pStatus === 'Cleared') totalReceived += net;

            row.innerHTML = `
                <td><strong>${escapeHtml(l.name || 'Unnamed')}</strong><br><small style="color:var(--text-muted);">${escapeHtml(l.city || 'Mehsana')}</small></td>
                <td><strong style="color:#60a5fa;">${escapeHtml(l.bankNbfc || '-')}</strong></td>
                <td><span style="color:#c084fc;">${escapeHtml(l.dealerName || 'Direct')}</span></td>
                <td><span style="color:var(--primary); font-size:0.8rem;">📅 ${escapeHtml(l.disbursedDate || '-')}</span></td>
                <td><strong style="color:#4ade80;">${formatINR(approvedBase)}</strong></td>
                <td>${rate}%</td>
                <td>${formatINR(gross)}</td>
                <td style="color:var(--danger);">${formatINR(cut)}</td>
                <td><strong style="color:var(--success); font-size:0.95rem;">${formatINR(net)}</strong></td>
                <td><span class="badge ${payoutBadge}">${pStatus}</span></td>
                <td>
                    <button class="btn-quick btn-edit" style="background:rgba(16,185,129,0.2); color:#34d399; border:1px solid #10b981; cursor:pointer;" onclick="openPayoutModal('${escapeJsString(l.docId)}')">💰 Edit</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.getElementById('sec-gross-comm').textContent = formatINR(totalGross);
        document.getElementById('sec-dealer-cuts').textContent = formatINR(totalCuts);
        document.getElementById('sec-net-comm').textContent = formatINR(totalNet);
        document.getElementById('sec-received-payout').textContent = formatINR(totalReceived);
    }

    window.openPayoutModal = function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        document.getElementById('ep_docId').value = docId;
        document.getElementById('ep_custName').textContent = l.name || 'Customer';
        document.getElementById('ep_approvedAmt').value = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('ep_commRate').value = Number(l.commRate || 1.5);
        
        const cutVal = Number(String(l.dealerCut || 0).replace(/[^0-9.]/g, '')) || 0;
        const cutType = l.dealerCutType || 'amount';
        document.getElementById('ep_cutType').value = cutType;
        document.getElementById('ep_dealerCutVal').value = l.dealerCutRaw !== undefined ? l.dealerCutRaw : cutVal;
        document.getElementById('ep_status').value = l.payoutStatus || 'Pending';
        
        toggleCutTypeInput();
        recalcPayoutModal();
        document.getElementById('editPayoutModal').style.display = 'flex';
    };

    window.toggleCutTypeInput = function() {
        const t = document.getElementById('ep_cutType').value;
        const label = document.getElementById('ep_cutLabel');
        if (t === 'percent') {
            label.textContent = "Dealer Cut (%)";
        } else {
            label.textContent = "Dealer Cut Value (₹)";
        }
        recalcPayoutModal();
    };

    window.recalcPayoutModal = function() {
        const appAmt = Number(document.getElementById('ep_approvedAmt').value) || 0;
        const rate = Number(document.getElementById('ep_commRate').value) || 0;
        const cutType = document.getElementById('ep_cutType').value;
        const cutInputVal = Number(document.getElementById('ep_dealerCutVal').value) || 0;

        const gross = Math.round((appAmt * rate) / 100);
        let actualCutAmt = cutType === 'percent' ? Math.round((appAmt * cutInputVal) / 100) : cutInputVal;
        const net = Math.max(0, gross - actualCutAmt);

        document.getElementById('ep_calcGross').value = formatINR(gross);
        document.getElementById('ep_calcCutAmt').value = formatINR(actualCutAmt);
        document.getElementById('ep_calcNet').value = formatINR(net);
    };

    window.handleSavePayoutData = async function(e) {
        e.preventDefault();
        const docId = document.getElementById('ep_docId').value;
        if (!docId) return;

        const appAmt = Number(document.getElementById('ep_approvedAmt').value) || 0;
        const rate = Number(document.getElementById('ep_commRate').value) || 1.5;
        const cutType = document.getElementById('ep_cutType').value;
        const cutInputVal = Number(document.getElementById('ep_dealerCutVal').value) || 0;
        const status = document.getElementById('ep_status').value;

        const gross = Math.round((appAmt * rate) / 100);
        let actualCutAmt = cutType === 'percent' ? Math.round((appAmt * cutInputVal) / 100) : cutInputVal;
        const net = Math.max(0, gross - actualCutAmt);

        await leadsCollection.doc(docId).update({
            approvedAmount: appAmt,
            commRate: rate,
            commAmount: gross,
            dealerCutType: cutType,
            dealerCutRaw: cutInputVal,
            dealerCut: actualCutAmt,
            netComm: net,
            payoutStatus: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('editPayoutModal').style.display = 'none';
        alert("✓ Payout update ho gaya!");
    };

    function renderSmartWorkflow() {
        const scoped = getLeadScopedList();
        const active = scoped.filter(l => !['Disbursed','Rejected','Not Interested'].includes(l.status));
        const overdue = active.filter(l => l.followDate && l.followDate < todayStr);
        const dueToday = active.filter(l => l.followDate === todayStr);
        const docs = active.filter(l => l.status === 'Documents Pending');
        const unscheduled = active.filter(l => !l.followDate);
        const counts = [['wf-overdue',overdue.length],['wf-today',dueToday.length],['wf-docs',docs.length],['wf-unscheduled',unscheduled.length]];
        counts.forEach(([id,value]) => { const el=document.getElementById(id); if(el) el.textContent=value; });
        const badge=document.getElementById('badge-workflow-count'); if(badge) badge.textContent=overdue.length+dueToday.length+docs.length+unscheduled.length;
        const tasks=[];
        overdue.forEach(l=>tasks.push({l,priority:0,label:'Overdue',action:'Follow-up date nikal chuki hai — customer ko contact karein.'}));
        dueToday.forEach(l=>tasks.push({l,priority:1,label:'Today',action:'Aaj customer follow-up karein.'}));
        docs.forEach(l=>tasks.push({l,priority:2,label:'Documents',action:'Pending documents collect/verify karein.'}));
        unscheduled.forEach(l=>tasks.push({l,priority:3,label:'Schedule',action:'Agla follow-up date set karein.'}));
        tasks.sort((a,b)=>a.priority-b.priority);
        const body=document.getElementById('smartWorkflowBody'); if(!body)return; body.textContent='';
        if(!tasks.length){body.innerHTML='<tr><td colspan="7" style="text-align:center;padding:22px;color:var(--success);">✓ Abhi koi suggested action pending nahi hai.</td></tr>';return;}
        tasks.forEach(({l,label,action})=>{
            const tr=document.createElement('tr');
            const values=[label,action,l.name||'Unnamed customer',l.mobile||'—',l.status||'New',l.followDate||'Not set'];
            values.forEach((value,index)=>{const td=document.createElement('td');td.textContent=String(value);if(index===0){td.style.fontWeight='800';td.style.color=label==='Overdue'?'#f87171':label==='Today'?'#fbbf24':'var(--primary)';}tr.appendChild(td);});
            const td=document.createElement('td');const btn=document.createElement('button');btn.className='btn-quick btn-edit';btn.textContent='✏️ Update';btn.onclick=()=>{editLead(l.docId);switchView('pipeline');};td.appendChild(btn);tr.appendChild(td);body.appendChild(tr);
        });
    }

    function renderFollowups() {
        const scopedLeads = getLeadScopedList();
        const todayLeads = scopedLeads.filter(l => l.followDate === todayStr || (l.followDate && l.followDate < todayStr && l.status !== 'Disbursed' && l.status !== 'Rejected'));
        document.getElementById('badge-followup-count').textContent = todayLeads.length;

        const tbody = document.getElementById('followupsTableBody');
        tbody.innerHTML = '';

        if (todayLeads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:25px;">Aaj ke liye koi follow-up pending nahi hai.</td></tr>';
            return;
        }

        todayLeads.forEach(l => {
            const cleanMobile = (l.mobile || '').replace(/\D/g, '');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${escapeHtml(l.name || 'Unnamed')}</strong><br><small style="color:var(--text-muted);">${escapeHtml(l.city || 'Mehsana')}</small></td>
                <td>
                    <a class="btn-quick btn-call" href="tel:${cleanMobile}">📞 Call</a>
                    <a class="btn-quick btn-wa" href="https://wa.me/91${cleanMobile}" target="_blank">💬 WhatsApp</a>
                </td>
                <td>${formatINR(Number(String(l.loanAmount).replace(/[^0-9.]/g, '')) || 0)}</td>
                <td><span class="badge badge-${(l.status || 'New').replace(/\s+/g, '')}">${escapeHtml(l.status)}</span></td>
                <td style="color:#fbbf24; font-weight:600;">${l.followDate || 'Today'}</td>
                <td><small style="color:var(--primary);">${escapeHtml(l.lastConv || '-')}</small></td>
                <td><button class="btn-quick btn-edit" onclick="editLead('${escapeJsString(l.docId)}'); switchView('pipeline');">✏️ Update</button></td>
            `;
            tbody.appendChild(row);
        });
    }

    window.generateDO = async function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        if (l.status !== 'Sanctioned' && l.status !== 'Disbursed') {
            alert(`⚠️ Delivery Order sirf Sanctioned ya Disbursed files ke liye hai.`);
            return;
        }

        const currentU = getCurrentSessionUser();
        const activeTenantId = l.tenantId || l.createdBy || inspectingTenantId || (currentU ? currentU.tenantId : '');
        const tenantObj = tenantsCache.find(t => t.tenantId && t.tenantId.toLowerCase() === (activeTenantId || '').toLowerCase());

        const brandName = tenantObj ? tenantObj.agencyName : (currentU ? currentU.agencyName : "HERITAGE AUTO FINANCE");
        const headOffice = tenantObj ? (tenantObj.headOffice || "Mehsana, Gujarat") : "Mehsana, Gujarat";
        const contactPhone = tenantObj ? (tenantObj.contactPhone || "+91 7600211085") : "+91 7600211085";

        const appAmt = Number(String(l.approvedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || 0;
        const grossDisbursed = Number(String(l.disbursedAmount || l.loanAmount || 0).replace(/[^0-9.]/g, '')) || appAmt;
        const rtoCharges = Number(String(l.rtoCharges || 0).replace(/[^0-9.]/g, '')) || 0;

        let bankCharges = Math.max(0, appAmt - grossDisbursed);
        let netDealerPayable = Math.max(0, grossDisbursed - rtoCharges);

        document.getElementById('do_brand_title').textContent = brandName.toUpperCase();
        document.getElementById('do_brand_sub').textContent = `HEAD OFFICE: ${headOffice.toUpperCase()} | CONTACT: ${contactPhone}`;
        const doDate = new Date();
        const ddmmyyyy = String(doDate.getDate()).padStart(2,'0') + String(doDate.getMonth()+1).padStart(2,'0') + doDate.getFullYear();
        let doSequence = Number(l.doSequence) || 0;
        if (!doSequence) {
            const seqSnap = await leadsCollection.where('doDateKey', '==', ddmmyyyy).get();
            let maxSeq = 0;
            seqSnap.forEach(doc => {
                const n = Number(doc.data().doSequence) || 0;
                if (n > maxSeq) maxSeq = n;
            });
            doSequence = maxSeq + 1;
            await leadsCollection.doc(docId).update({ doSequence, doDateKey: ddmmyyyy, doNo: 'HAF-DO-' + ddmmyyyy + '-' + doSequence, applicationNo: 'HAF' + ddmmyyyy + doSequence, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
        const generatedDoNo = l.doNo || ('HAF-DO-' + ddmmyyyy + '-' + doSequence);
        document.getElementById('do_date').textContent = doDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const doPrintTime = document.getElementById('do_print_time');
        if (doPrintTime) doPrintTime.textContent = new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
        document.getElementById('do_ref').textContent = generatedDoNo;
        document.getElementById('do_application').textContent = l.applicationNo || ('HAF' + ddmmyyyy + doSequence);
        document.getElementById('do_cust').textContent = l.name || '-';
        document.getElementById('do_mobile').textContent = l.mobile || '-';
        document.getElementById('do_vehicle').textContent = (l.vehModel || '-') + ' (' + (l.vehType || 'Car') + ')' + (l.vehRegNo ? ' | Reg. No: ' + l.vehRegNo : ' | Reg. No: -');
        document.getElementById('do_bank').textContent = l.bankNbfc || 'Financier';
        document.getElementById('do_dealer').textContent = l.dealerName || 'Direct';
        document.getElementById('do_city').textContent = l.city || 'Mehsana';
        document.getElementById('do_branch').textContent = headOffice;
        document.getElementById('do_regno').textContent = l.vehRegNo || 'NOT PROVIDED';

        document.getElementById('do_approved').textContent = formatINR(appAmt);
        document.getElementById('do_bank_charges').textContent = bankCharges > 0 ? ('- ' + formatINR(bankCharges)) : '₹0 (Nil)';
        document.getElementById('do_gross_disbursed').textContent = formatINR(grossDisbursed);
        document.getElementById('do_rto').textContent = rtoCharges > 0 ? ('- ' + formatINR(rtoCharges)) : '₹0 (Nil)';
        document.getElementById('do_net_dealer_payable').textContent = formatINR(netDealerPayable);

        document.getElementById('doModal').style.display = 'flex';

        // Immutable point-in-time DO snapshot for the lead's document history.
        // A new version entry is recorded each time the DO is opened/generated.
        const doSnapshot = {
            documentType: 'Delivery Order',
            doNo: generatedDoNo,
            applicationNo: l.applicationNo || ('HAF' + ddmmyyyy + doSequence),
            customer: l.name || '',
            mobile: l.mobile || '',
            vehicle: l.vehModel || '',
            vehicleType: l.vehType || 'Car',
            vehicleRegNo: l.vehRegNo || '',
            financier: l.bankNbfc || '',
            dealer: l.dealerName || '',
            city: l.city || '',
            branch: headOffice,
            agency: brandName,
            approvedAmount: appAmt,
            bankCharges: bankCharges,
            grossDisbursed: grossDisbursed,
            rtoCharges: rtoCharges,
            netDealerPayable: netDealerPayable,
            statusAtGeneration: l.status || '',
            capturedAt: new Date().toISOString()
        };
        await logLeadActivity(docId, 'delivery_order_version', doSnapshot);
        await logLeadActivity(docId, 'delivery_order_opened', {
            doNo: generatedDoNo,
            applicationNo: l.applicationNo || ('HAF' + ddmmyyyy + doSequence),
            customer: l.name || '-'
        });
    };

    async function logLeadActivity(docId, type, details) {
        try {
            if (!docId) return;
            const u = getCurrentSessionUser();
            const tenantId = (u && u.tenantId) || inspectingTenantId || 'system';
            await leadsCollection.doc(docId).collection('activity').add({
                type: type || 'record_update',
                details: details || {},
                tenantId: tenantId,
                createdBy: (u && (u.tenantId || u.userId)) || 'system',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (err) {
            console.warn('Activity log skipped:', err);
        }
    }

    function formatActivityTime(v) {
        try {
            if (!v) return 'Just now';
            if (typeof v.toDate === 'function') return v.toDate().toLocaleString('en-IN');
            if (v.seconds) return new Date(v.seconds * 1000).toLocaleString('en-IN');
        } catch(e) {}
        return String(v);
    }

    window.loadLeadActivity = async function(docIdOverride) {
        const docId = docIdOverride || document.getElementById('leadAuditDocId').value;
        const box = document.getElementById('leadActivityTimeline');
        if (!docId || !box) return;
        box.innerHTML = '<div style="font-size:.75rem;color:var(--text-muted);padding:12px;">Loading history...</div>';
        try {
            const snap = await leadsCollection.doc(docId).collection('activity').orderBy('createdAt','desc').limit(50).get();
            if (snap.empty) {
                box.innerHTML = '<div style="font-size:.75rem;color:var(--text-muted);padding:12px;background:#0f121a;border:1px solid #242938;border-radius:8px;">Abhi activity history available nahi hai. New updates yahan automatically record honge.</div>';
                return;
            }
            box.innerHTML = '';
            snap.forEach(doc => {
                const a = doc.data() || {};
                const event = document.createElement('div');
                event.className = 'activity-event';
                const details = a.details && typeof a.details === 'object'
                    ? Object.entries(a.details).map(([k, v]) => String(k) + ': ' + String(v)).join(' • ')
                    : String(a.details || '');
                const head = document.createElement('div');
                head.className = 'activity-head';
                const type = document.createElement('span');
                type.className = 'activity-type';
                type.textContent = String(a.type || 'Record Update');
                const time = document.createElement('span');
                time.className = 'activity-time';
                time.textContent = String(formatActivityTime(a.createdAt));
                head.append(type, time);
                const detail = document.createElement('div');
                detail.className = 'activity-detail';
                detail.textContent = details || 'Record activity';
                event.append(head, detail);
                box.appendChild(event);
            });
        } catch (err) {
            console.error('Activity history error:', err);
            box.innerHTML = '<div style="font-size:.75rem;color:#fca5a5;padding:12px;background:#1a1012;border:1px solid #7f1d1d;border-radius:8px;">History load nahi hui. Firestore activity permission/index check karein.</div>';
        }
    };

    window.showLeadAudit = function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        const fmt = (v) => {
            if (!v) return '—';
            try {
                if (typeof v.toDate === 'function') return v.toDate().toLocaleString('en-IN');
                if (v.seconds) return new Date(v.seconds * 1000).toLocaleString('en-IN');
            } catch (e) {}
            return String(v);
        };

        const rows = [
            ['Customer', l.name || '—'],
            ['Mobile', l.mobile || '—'],
            ['Vehicle Reg. No', l.vehRegNo || '—'],
            ['Lead Status', l.status || '—'],
            ['Tenant / Agency', l.tenantId || l.createdBy || '—'],
            ['Created At', fmt(l.createdAt)],
            ['Created By', l.createdByUser || l.createdBy || '—'],
            ['Updated At', fmt(l.updatedAt)],
            ['Updated By', l.updatedBy || '—'],
            ['DO No', l.doNo || 'Not generated'],
            ['Application No', l.applicationNo || 'Not generated'],
            ['DO Sequence', l.doSequence || '—']
        ];

        const body = document.getElementById('leadAuditBody');
        body.innerHTML = '';
        rows.forEach(([label,value]) => {
            const box = document.createElement('div');
            box.style.cssText = 'background:#0f121a;border:1px solid #242938;border-radius:7px;padding:9px;min-width:0;';
            const lab = document.createElement('div');
            lab.style.cssText = 'font-size:.66rem;color:var(--text-muted);text-transform:uppercase;margin-bottom:3px;';
            lab.textContent = label;
            const val = document.createElement('div');
            val.style.cssText = 'font-size:.78rem;color:var(--text);font-weight:600;word-break:break-word;';
            val.textContent = value;
            box.appendChild(lab);
            box.appendChild(val);
            body.appendChild(box);
        });

        document.getElementById('leadAuditDocId').value = docId;
        document.getElementById('leadAuditModal').style.display = 'flex';
        loadLeadActivity(docId);
    };

    window.closeLeadAudit = function() {
        document.getElementById('leadAuditModal').style.display = 'none';
    };

    window.printSelectedDocument = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) {
            alert('Print area nahi mila.');
            return;
        }

        /* Robust browser print engine:
           open a real top-level print document containing ONLY the DO.
           This avoids iframe timing/layout bugs and prevents the CRM page
           from contributing a second blank page. */
        const printWindow = window.open('', '_blank', 'width=900,height=1200');
        if (!printWindow) {
            alert('Print window browser ne block ki hai. Is site ke liye pop-up allow karein.');
            return;
        }

        const styleText = Array.from(document.querySelectorAll('style'))
            .map(style => style.textContent)
            .join('\n');

        const printTitle = sectionId === 'printableRentBillArea'
            ? 'Heritage FinTech Core - Rent Invoice'
            : 'Heritage Auto Finance - Delivery Order';

        const clone = section.cloneNode(true);
        clone.removeAttribute('id');

        printWindow.document.open();
        printWindow.document.write('<!doctype html><html lang="en"><head>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<title>' + printTitle.replace(/</g,'&lt;') + '</title>' +
            '<link rel="stylesheet" href="assets/css/styles.css"></head><body><div id="printRoot"></div></body></html>');
        printWindow.document.close();

        const root = printWindow.document.getElementById('printRoot');
        root.appendChild(clone);

        let printed = false;
        const doPrint = () => {
            if (printed) return;
            printed = true;
            printWindow.focus();
            printWindow.print();
        };

        /* Wait for the new document to have a real layout before printing. */
        setTimeout(doPrint, 350);

        printWindow.addEventListener('afterprint', () => {
            setTimeout(() => {
                try { printWindow.close(); } catch (e) {}
            }, 150);
        }, { once: true });
    };

    window.closeDoModal = function() {
        document.getElementById('doModal').style.display = 'none';
    };

    function getCurrentTenantKey() {
        const u = getCurrentSessionUser();
        if (inspectingTenantId) return inspectingTenantId.trim().toLowerCase();
        if (u && u.role !== 'superadmin' && u.tenantId) return u.tenantId.trim().toLowerCase();
        return 'heritage_auto_finance_default';
    }

    function getStoredDealers() {
        const tenantKey = getCurrentTenantKey();
        const storageKey = 'haf_saved_dealers_' + tenantKey;
        const defaultDealers = ["Direct Customer", "Dipakbhai", "Ramadhani", "Patel Motors"];
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey));
            if (Array.isArray(saved) && saved.length > 0) return saved;
        } catch(e) {}
        return defaultDealers;
    }

    function saveStoredDealers(dealersArr) {
        const tenantKey = getCurrentTenantKey();
        const storageKey = 'haf_saved_dealers_' + tenantKey;
        localStorage.setItem(storageKey, JSON.stringify(dealersArr));
        refreshDealerDropdowns();
    }

    function refreshDealerDropdowns() {
        const dealers = getStoredDealers();
        const formSelect = document.getElementById('dealerNameSelect');
        if (!formSelect) return;
        const currentVal = formSelect.value;
        formSelect.innerHTML = '';
        dealers.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            if (d === currentVal) opt.selected = true;
            formSelect.appendChild(opt);
        });
    }

    function promptAddNewDealer() {
        const name = prompt("Naye Dealer / Sub-Broker ka naam darj karein:");
        if (!name || name.trim() === '') return;
        const clean = name.trim();
        const dealers = getStoredDealers();
        if (!dealers.includes(clean)) {
            dealers.push(clean);
            saveStoredDealers(dealers);
            document.getElementById('dealerNameSelect').value = clean;
            alert(`✓ Dealer "${clean}" is tenant ke liye add ho gaya!`);
        } else {
            document.getElementById('dealerNameSelect').value = clean;
        }
    }

    function openManageDealersModal() {
        const dealers = getStoredDealers();
        const container = document.getElementById('dealersListContainer');
        container.innerHTML = '';

        dealers.forEach(d => {
            const row = document.createElement('div');
            row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#0f121a; padding:8px 12px; margin-bottom:6px; border-radius:6px; border:1px solid #242938;";

            const label = document.createElement('span');
            label.style.cssText = 'font-weight:600; color:#c084fc;';
            label.textContent = '🤝 ' + String(d);
            row.appendChild(label);

            if (d === 'Direct Customer') {
                const protectedLabel = document.createElement('span');
                protectedLabel.style.cssText = 'color:#555; font-size:0.7rem;';
                protectedLabel.textContent = '(Default)';
                row.appendChild(protectedLabel);
            } else {
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button';
                deleteButton.textContent = '🗑️ Delete';
                deleteButton.style.cssText = 'background:#ef4444; color:#fff; border:none; border-radius:4px; padding:3px 8px; cursor:pointer; font-size:0.72rem;';
                deleteButton.addEventListener('click', () => deleteDealerItem(d));
                row.appendChild(deleteButton);
            }
            container.appendChild(row);
        });

        document.getElementById('manageDealersModal').style.display = 'flex';
    }

    function closeManageDealersModal() {
        document.getElementById('manageDealersModal').style.display = 'none';
    }

    function deleteDealerItem(dealerName) {
        if (!confirm(`Kya aap "${dealerName}" ko delete karna chahte hain?`)) return;
        let dealers = getStoredDealers();
        dealers = dealers.filter(d => d !== dealerName);
        saveStoredDealers(dealers);
        openManageDealersModal();
        renderDealerLedgerTable();
    }

    window.exportAllClientsToCSV = function() {
        if (!leads || leads.length === 0) {
            alert("Export ke liye koi leads nahi hain!");
            return;
        }

        const tenants = getStoredTenants();
        const agencyMap = {};
        tenants.forEach(t => {
            agencyMap[t.tenantId.toLowerCase()] = t.agencyName;
        });

        const headers = ["Agency Name", "Customer Name", "Mobile Number", "City", "Vehicle Registration", "Vehicle Model", "Vehicle Type", "Dealer/Partner", "Lead Date", "Requested Loan", "Approved Loan", "Disbursed Loan", "Dealer Cut", "Disbursed Date", "Bank/NBFC", "Lead Status", "DO No", "Application No", "Remarks"];
        
        const rows = leads.map(l => {
            const tId = (l.tenantId || l.createdBy || 'heritage auto finance').toLowerCase();
            const agencyName = agencyMap[tId] || l.tenantId || 'Heritage Auto Finance';

            return [
                `"${agencyName.replace(/"/g, '""')}"`,
                `"${(l.name || '').replace(/"/g, '""')}"`,
                `"${(l.mobile || '').replace(/"/g, '""')}"`,
                `"${(l.city || '').replace(/"/g, '""')}"`,
                `"${(l.vehRegNo || '').replace(/"/g, '""')}"`,
                `"${(l.vehModel || '').replace(/"/g, '""')}"`,
                `"${(l.vehType || '').replace(/"/g, '""')}"`,
                `"${(l.dealerName || 'Direct Customer').replace(/"/g, '""')}"`,
                `"${(l.leadDate || todayStr)}"`,
                l.loanAmount || 0,
                l.approvedAmount || l.loanAmount || 0,
                l.disbursedAmount || l.loanAmount || 0,
                l.dealerCut || 0,
                `"${(l.disbursedDate || '').replace(/"/g, '""')}"`,
                `"${(l.bankNbfc || '').replace(/"/g, '""')}"`,
                `"${(l.status || '').replace(/"/g, '""')}"`,
                `"${(l.doNo || '').replace(/"/g, '""')}"`,
                `"${(l.applicationNo || '').replace(/"/g, '""')}"`,
                `"${(l.lastConv || '').replace(/"/g, '""')}"`
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `All_Agencies_Master_Report_${todayStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    tenantsCollection.onSnapshot((snapshot) => {
        tenantsCache = [];
        snapshot.forEach(doc => {
            tenantsCache.push({ docId: doc.id, ...doc.data() });
        });
        tenantsReady = true;
        renderAdminMasterUserCards();
    }, (error) => {
        console.error("Tenant sync error:", error);
    });

    ensureDefaultTenantAndMigrateLocalData();

    leadsCollection.orderBy('updatedAt', 'desc').onSnapshot((snapshot) => {
        leads = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            leads.push({ docId: doc.id, ...data });
        });
        renderMetrics();
        renderViews();
        renderDisbursedHubTable();
        renderDealerLedgerTable();
        renderAdminMasterUserCards();
        renderSmartWorkflow();
    });

    function formatINR(val) {
        if (!val || isNaN(val)) return '₹0';
        return '₹' + Number(val).toLocaleString('en-IN');
    }

    function handleStatusChange() {
        const status = document.getElementById('status').value;
        const docBox = document.getElementById('docChecklistSection');
        const sanctionedBox = document.getElementById('sanctionedBox');
        const disbursedDateGroup = document.getElementById('disbursedDateGroup');

        docBox.style.display = (status === 'Documents Pending') ? 'block' : 'none';

        if (status === 'Sanctioned' || status === 'Disbursed') {
            sanctionedBox.style.display = 'block';
            syncApproveAmountDefault();
            disbursedDateGroup.style.display = (status === 'Disbursed') ? 'block' : 'none';
            if (status === 'Disbursed' && !document.getElementById('disbursedDate').value) {
                document.getElementById('disbursedDate').value = todayStr;
            }
        } else {
            sanctionedBox.style.display = 'none';
        }
    }

    function syncApproveAmountDefault() {
        const loan = document.getElementById('loanAmount').value;
        const appInput = document.getElementById('approvedAmount');
        if (!appInput.value || appInput.value === '0') appInput.value = loan;
    }

    document.getElementById('leadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const editDocId = document.getElementById('editDocId').value;
        const currentStatus = document.getElementById('status').value;
        const requestedLoan = Number(document.getElementById('loanAmount').value) || 0;
        let approvedLoan = Number(document.getElementById('approvedAmount').value) || requestedLoan;
        let disbursedLoan = Number(document.getElementById('disbursedAmount').value) || approvedLoan;
        let formCut = Number(document.getElementById('formDealerCut').value) || 0;
        let disbursedDateVal = document.getElementById('disbursedDate').value || (currentStatus === 'Disbursed' ? todayStr : '');

        const sessionUser = getCurrentSessionUser();
        let tenantIdTag = "heritage auto finance";
        if (inspectingTenantId) tenantIdTag = inspectingTenantId;
        else if (sessionUser && sessionUser.role !== 'superadmin') tenantIdTag = sessionUser.tenantId;

        const mobileRaw = document.getElementById('mobile').value.trim();
        if (!/^\d{10}$/.test(mobileRaw.replace(/\D/g, ''))) { alert('Mobile number 10 digits ka hona chahiye.'); return; }
        if (requestedLoan <= 0) { alert('Requested Loan amount valid hona chahiye.'); return; }
        const vehRegNo = (document.getElementById('vehRegNo').value || '').trim().toUpperCase();

        const customerName = document.getElementById('custName').value.trim();
        if (!customerName) { alert('Customer name required hai.'); return; }

        if (!editDocId) {
            const cleanNewMobile = mobileRaw.replace(/\D/g, '');
            const duplicate = getLeadScopedList().find(x =>
                (x.mobile || '').replace(/\D/g, '') === cleanNewMobile &&
                x.status !== 'Rejected'
            );
            if (duplicate) {
                const proceed = confirm(
                    '⚠️ Is mobile number ki ek existing active file mil gayi hai.\\n\\n' +
                    'Customer: ' + (duplicate.name || 'Unknown') + '\\n' +
                    'Status: ' + (duplicate.status || 'New') + '\\n' +
                    'Vehicle: ' + (duplicate.vehModel || '-') + '\\n\\n' +
                    'Kya aap phir bhi nayi lead create karna chahte hain?'
                );
                if (!proceed) return;
            }

            if (vehRegNo) {
                const duplicateReg = getLeadScopedList().find(x =>
                    (x.vehRegNo || '').trim().toUpperCase() === vehRegNo &&
                    x.status !== 'Rejected'
                );
                if (duplicateReg) {
                    const proceedReg = confirm(
                        '⚠️ Is vehicle registration number ki existing active file mil gayi hai.\\n\\n' +
                        'Customer: ' + (duplicateReg.name || 'Unknown') + '\\n' +
                        'Status: ' + (duplicateReg.status || 'New') + '\\n' +
                        'Mobile: ' + (duplicateReg.mobile || '-') + '\\n\\n' +
                        'Kya aap phir bhi nayi lead create karna chahte hain?'
                    );
                    if (!proceedReg) return;
                }
            }
        }

        const leadData = {
            name: document.getElementById('custName').value.trim(),
            mobile: mobileRaw.replace(/\D/g, ''),
            city: document.getElementById('city').value.trim(),
            vehRegNo: vehRegNo,
            vehType: document.getElementById('vehType').value,
            vehModel: document.getElementById('vehModel').value,
            dealerName: document.getElementById('dealerNameSelect').value || 'Direct Customer',
            loanAmount: requestedLoan,
            approvedAmount: approvedLoan,
            disbursedAmount: disbursedLoan,
            disbursedDate: disbursedDateVal,
            bankNbfc: document.getElementById('bankNbfc').value || '',
            status: currentStatus,
            followDate: document.getElementById('followDate').value,
            lastConv: document.getElementById('lastConv').value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: (sessionUser && sessionUser.tenantId) ? sessionUser.tenantId : 'system'
        };

        if (formCut > 0) {
            leadData.dealerCut = formCut;
        }

        const saveBtn = document.getElementById('submitBtn');
        const oldSaveText = saveBtn ? saveBtn.textContent : '';
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }
        try {
        if (editDocId) {
            const previousLead = leads.find(item => item.docId === editDocId) || {};
            await leadsCollection.doc(editDocId).update(leadData);
            await logLeadActivity(editDocId, previousLead.status !== currentStatus ? 'status_change' : 'record_updated', {
                status: currentStatus,
                customer: leadData.name,
                vehicle: leadData.vehRegNo || '-',
                loan: formatINR(requestedLoan)
            });
        } else {
            leadData.tenantId = tenantIdTag;
            leadData.createdBy = tenantIdTag;
            leadData.leadDate = todayStr;
            leadData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            leadData.createdByUser = (sessionUser && sessionUser.tenantId) ? sessionUser.tenantId : 'system';
            leadData.commRate = 1.5;
            leadData.commAmount = Math.round((approvedLoan * 1.5) / 100);
            leadData.dealerCut = formCut;
            leadData.netComm = Math.max(0, leadData.commAmount - formCut);
            leadData.payoutStatus = 'Pending';
            leadData.holdAmount = 0;
            leadData.holdReason = 'None';
            leadData.holdRemarks = '';
            leadData.holdStatus = 'None';
            leadData.rtoCharges = 0;
            leadData.rtoStatus = 'Pending';
            const newLeadRef = leadsCollection.doc();
            await newLeadRef.set(leadData);
            await logLeadActivity(newLeadRef.id, 'lead_created', {
                status: currentStatus,
                customer: leadData.name,
                vehicle: leadData.vehRegNo || '-',
                loan: formatINR(requestedLoan)
            });
        }
        resetForm();
        } catch (error) {
            console.error('Lead save error:', error);
            alert('❌ Lead save nahi hui. Internet/Firebase permission check karein.');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = oldSaveText || 'Save to Cloud'; }
        }
    });

    window.editLead = function(docId) {
        const l = leads.find(item => item.docId === docId);
        if (!l) return;

        document.getElementById('editDocId').value = docId;
        document.getElementById('custName').value = l.name || '';
        document.getElementById('mobile').value = l.mobile || '';
        document.getElementById('city').value = l.city || '';
        document.getElementById('vehType').value = l.vehType || 'Used';
        document.getElementById('vehModel').value = l.vehModel || '';
        document.getElementById('vehRegNo').value = l.vehRegNo || '';
        document.getElementById('loanAmount').value = Number(String(l.loanAmount).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('approvedAmount').value = Number(String(l.approvedAmount || l.loanAmount).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('disbursedAmount').value = Number(String(l.disbursedAmount || l.loanAmount).replace(/[^0-9.]/g, '')) || 0;
        document.getElementById('formDealerCut').value = Number(String(l.dealerCut || 0).replace(/[^0-9.]/g, '')) || '';
        document.getElementById('disbursedDate').value = l.disbursedDate || todayStr;
        document.getElementById('bankNbfc').value = l.bankNbfc || '';
        document.getElementById('status').value = l.status || 'New';
        document.getElementById('followDate').value = l.followDate || '';
        document.getElementById('lastConv').value = l.lastConv || '';

        handleStatusChange();
        document.getElementById('form-heading').textContent = 'Update Lead Details';
        document.getElementById('submitBtn').textContent = 'Update in Cloud';
        document.getElementById('cancelBtn').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.resetForm = function() {
        document.getElementById('leadForm').reset();
        document.getElementById('editDocId').value = '';
        document.getElementById('form-heading').textContent = 'Add New Lead';
        document.getElementById('submitBtn').textContent = 'Save to Cloud';
        document.getElementById('cancelBtn').style.display = 'none';
        handleStatusChange();
    };

    window.deleteLead = async function(docId) {
        if (confirm('Delete lead from Cloud?')) {
            await leadsCollection.doc(docId).delete();
        }
    };

    applyPortalPermissions();
    refreshDealerDropdowns();
    handleStatusChange();
