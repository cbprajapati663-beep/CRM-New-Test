/* Staging-only Firebase bootstrap.
 * Intentionally NOT imported by the production index.html.
 * A staging entry point must set window.HAF_STAGING_FIREBASE_CONFIG at build/deploy time.
 */
(function (global) {
  'use strict';

  const EXPECTED_PROJECT_ID = 'heritage-crm-staging';
  const APP_NAME = 'haf-staging';

  function fail(message) {
    throw new Error('[HAF staging bootstrap] ' + message);
  }

  function initializeStagingFirebase() {
    if (!global.firebase || typeof global.firebase.initializeApp !== 'function') {
      fail('Firebase compat SDK is missing. Load the SDK before this module.');
    }

    const config = global.HAF_STAGING_FIREBASE_CONFIG;
    if (!config || typeof config !== 'object') {
      fail('Staging config is missing. Refusing to initialize any Firebase app.');
    }
    if (config.projectId !== EXPECTED_PROJECT_ID) {
      fail('Expected project "' + EXPECTED_PROJECT_ID + '"; received a different project. Initialization blocked.');
    }

    const apps = Array.isArray(global.firebase.apps) ? global.firebase.apps : [];
    const namedApp = apps.find(function (app) { return app.name === APP_NAME; });
    if (namedApp) {
      if (namedApp.options.projectId !== EXPECTED_PROJECT_ID) {
        fail('Existing staging app points to an unexpected project.');
      }
      return namedApp;
    }

    // Never reuse the default app: the production app may be initialized separately.
    const app = global.firebase.initializeApp(config, APP_NAME);
    if (!app || !app.options || app.options.projectId !== EXPECTED_PROJECT_ID) {
      fail('Post-initialization project check failed.');
    }
    return app;
  }

  function getStagingFirebase() {
    const app = initializeStagingFirebase();
    return Object.freeze({
      app: app,
      auth: app.auth(),
      db: typeof app.firestore === 'function' ? app.firestore() : null,
      storage: typeof app.storage === 'function' ? app.storage() : null,
      projectId: EXPECTED_PROJECT_ID
    });
  }

  global.HAFStagingFirebase = Object.freeze({
    expectedProjectId: EXPECTED_PROJECT_ID,
    initialize: initializeStagingFirebase,
    getServices: getStagingFirebase
  });
})(window);
