# Staging Bootstrap Guard Tests

A dependency-free Node.js test file covers the staging Firebase bootstrap's key guardrails.

## Run locally
From the repository root, with Node.js installed:

```bash
node --test tests/staging/firebase-bootstrap.test.cjs
```

## Cases covered
1. Missing staging config fails closed without initializing Firebase.
2. A non-staging project ID is rejected before initialization.
3. The expected staging project uses the named `haf-staging` app and exposes Auth, Firestore, Storage, and project ID.
4. Repeated initialization reuses the named staging app.
5. An existing named app attached to a different project is rejected.

## Validation status
The test file has been added but has **not been executed in a checked-out repository/runtime** in this workflow. Passing status must not be inferred until the command is run and its output reviewed. These are unit tests for the bootstrap scaffold only—not Firebase emulator, browser, login, tenant isolation, or production tests.
