(function () {
  'use strict';
  const firebaseConfig = {
    apiKey: "AIzaSyACLaRm5yH301JVqlvl8KYglANOc3uh6w",
    authDomain: "heritage-crm-f179a.firebaseapp.com",
    projectId: "heritage-crm-f179a",
    storageBucket: "heritage-crm-f179a.firebasestorage.app",
    messagingSenderId: "434634669830",
    appId: "1:1:afa939caa85df772066887"
  };
  // Keep the app's existing Firebase configuration in sync before using this entry point.
  firebase.initializeApp(firebaseConfig);
  const tenants = firebase.firestore().collection('tenants');
  const form = document.getElementById('clientLoginForm');
  const button = document.getElementById('loginSubmit');
  const errorBox = document.getElementById('loginError');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    errorBox.style.display = 'none';
    const tenantId = document.getElementById('loginUserId').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    if (!tenantId || !password) return;
    button.disabled = true;
    button.textContent = 'Checking…';
    try {
      const snapshot = await tenants.where('tenantId', '==', tenantId).limit(1).get();
      if (snapshot.empty) throw new Error('Invalid tenant ID or password.');
      const doc = snapshot.docs[0];
      const user = { docId: doc.id, ...doc.data() };
      if (user.password !== password) throw new Error('Invalid tenant ID or password.');
      if (user.status === 'Suspended') throw new Error('This workspace is suspended. Please contact your service provider.');
      localStorage.setItem('haf_active_session_user_v2', JSON.stringify(user));
      window.location.replace('../index.html');
    } catch (error) {
      errorBox.textContent = error.message === 'Missing or insufficient permissions.'
        ? 'Login service permission error. Please contact support.'
        : (error.message || 'Login failed. Please try again.');
      errorBox.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = 'Launch Portal';
    }
  });
}());
