# Staging Auth Test Record

Use this record only after testing with a dedicated, non-customer account in Firebase project `heritage-crm-staging`. Do not paste passwords, reset links, API keys, customer data, or full authentication tokens into this file or a pull-request comment.

## Environment confirmation

- [ ] Firebase Console project ID is exactly `heritage-crm-staging`.
- [ ] Email/Password provider is enabled in staging.
- [ ] Test account was created specifically for staging.
- [ ] Local `assets/js/staging/firebase-config.js` contains staging web-app config and is not tracked by Git.
- [ ] Page is served over HTTP(S), and its status confirms the expected staging project.

**Tester:**  
**Date/time (with timezone):**  
**Browser/device:**  
**Staging project ID confirmed:** `heritage-crm-staging`

## Authentication smoke tests

| Test | Expected result | Result (Pass/Fail/Not run) | Safe evidence / notes |
|---|---|---|---|
| Open page without staging config | Setup blocked; no sign-in attempted | | |
| Open page with staging config | Shows staging connection ready | | |
| Sign in with valid staging test account | Auth succeeds, then signs out | | |
| Sign in with incorrect password | Error shown; password field cleared | | |
| Request password reset with test email | Reset request status shown; inbox checked separately | | |
| Request reset with empty email | Prompt to enter test email; no request | | |
| Confirm session after successful sign-in | User is signed out; no CRM session created | | |
| Confirm page isolation | No production CRM scripts/data loaded | | |

## Cleanup and outcome

- [ ] Sign-out completed, or staging test session was revoked in Firebase Authentication.
- [ ] No production project, customer records, or production settings were accessed or changed.
- [ ] Any failure was recorded without including credentials or reset tokens.

**Overall result:** Not run / Pass / Fail  
**Blocking issue(s):**  
**Evidence location (redacted screenshots/logs only):**  

> This is an authentication-only smoke test. Passing it does not validate tenant mapping, Firestore/Storage authorization, cross-tenant isolation, CRM regression, or production readiness.
