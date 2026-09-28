'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const sourcePath = path.join(__dirname, '../../assets/js/staging/firebase-bootstrap.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function createHarness(config, includeDataSdk = true, includeAuthSdk = true, validAuth = true) {
  const apps = [];
  let initializeCalls = 0;
  const firebase = {
    apps,
    initializeApp(options, name) {
      initializeCalls += 1;
      const app = {
        name,
        options,
        ...(includeAuthSdk ? { auth: () => (validAuth ? { service: 'auth', signInWithEmailAndPassword() {} } : {}) } : {}),
        ...(includeDataSdk ? { firestore: () => ({ service: 'firestore' }), storage: () => ({ service: 'storage' }) } : {})
      };
      apps.push(app);
      return app;
    }
  };
  const window = { firebase };
  if (config !== undefined) window.HAF_STAGING_FIREBASE_CONFIG = config;
  vm.runInNewContext(source, { window });
  return { window, apps, get initializeCalls() { return initializeCalls; } };
}

test('fails closed when staging config is missing', () => {
  const h = createHarness();
  assert.throws(() => h.window.HAFStagingFirebase.initialize(), /config is missing/);
  assert.equal(h.initializeCalls, 0);
});

test('rejects a non-staging project before initialization', () => {
  const h = createHarness({ projectId: 'heritage-crm-f179a' });
  assert.throws(() => h.window.HAFStagingFirebase.initialize(), /Expected project/);
  assert.equal(h.initializeCalls, 0);
});

test('initializes only the named staging app and exposes services', () => {
  const h = createHarness({ projectId: 'heritage-crm-staging' });
  const services = h.window.HAFStagingFirebase.getServices();
  assert.equal(services.projectId, 'heritage-crm-staging');
  assert.equal(services.app.name, 'haf-staging');
  assert.equal(services.auth.service, 'auth');
  assert.equal(services.db.service, 'firestore');
  assert.equal(services.storage.service, 'storage');
  assert.equal(h.initializeCalls, 1);
});

test('reuses an existing correctly named staging app', () => {
  const h = createHarness({ projectId: 'heritage-crm-staging' });
  const first = h.window.HAFStagingFirebase.initialize();
  const second = h.window.HAFStagingFirebase.initialize();
  assert.equal(first, second);
  assert.equal(h.initializeCalls, 1);
});

test('refuses an existing named app bound to another project', () => {
  const h = createHarness({ projectId: 'heritage-crm-staging' });
  h.apps.push({ name: 'haf-staging', options: { projectId: 'production-project' } });
  assert.throws(() => h.window.HAFStagingFirebase.initialize(), /Existing staging app/);
  assert.equal(h.initializeCalls, 0);
});

test('supports auth-only staging page when Firestore and Storage SDKs are absent', () => {
  const h = createHarness({ projectId: 'heritage-crm-staging' }, false);
  const services = h.window.HAFStagingFirebase.getServices();
  assert.equal(services.auth.service, 'auth');
  assert.equal(services.db, null);
  assert.equal(services.storage, null);
  assert.equal(services.projectId, 'heritage-crm-staging');
});

test('fails with a clear message when Firebase Auth SDK is missing', () => {
  const h = createHarness({ projectId: 'heritage-crm-staging' }, false, false);
  assert.throws(() => h.window.HAFStagingFirebase.getServices(), /Auth SDK is missing/);
});

test('fails when Auth service does not expose email/password sign-in', () => {
  const h = createHarness({ projectId: 'heritage-crm-staging' }, true, true, false);
  assert.throws(() => h.window.HAFStagingFirebase.getServices(), /Auth service is unavailable/);
});
