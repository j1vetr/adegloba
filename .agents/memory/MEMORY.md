# Memory Index

- [Drizzle or() inside and()](drizzle-or-in-and-pitfall.md) — avoid combining `or()` with `and()` from drizzle-orm; use `sql\`col IN (...)\`` instead.
- [Testing new API routes via curl in dev](dev-proxy-caching-curl-tests.md) — GET responses can be cached by the dev proxy; add a cache-busting query param when curl-testing new endpoints.
- [PayPal 7-Phase Rewrite](paypal-rewrite.md) — full fix for "user charged but no package"; capture+fulfill now one call, two-phase processPaymentCompletion, early DB link, real sig verification.
- [PayPal 3DS payer-action](paypal-3ds-payer-action.md) — card 3DS challenge redirect/resume flow; create-order needs return=representation; reconciliation captures APPROVED orders.
