# Heritage Auto Finance CRM

Browser-based CRM for vehicle-finance leads, follow-ups, dealer ledger, payout desk, and delivery-order workflows.

## Structure
```text
.
├── index.html
└── assets/
    ├── css/styles.css
    └── js/app.js
```

- `index.html`: markup and Firebase SDK references.
- `assets/css/styles.css`: UI styles.
- `assets/js/app.js`: application logic and Firebase client configuration.

The app currently uses Firebase's compat SDK and Firestore. Client-side Firebase configuration is not a substitute for server-side authorization or Firestore Security Rules.

## Security
See [SECURITY.md](SECURITY.md) for static review findings and the recommended remediation plan. The file split has not been followed by live regression testing or a security certification. Avoid real customer data until authentication and Firestore access controls have been reviewed and tested.
