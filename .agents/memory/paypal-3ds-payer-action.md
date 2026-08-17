---
name: PayPal 3DS payer-action flow
description: How the card 3DS (SMS) challenge flow works and its invariants
---
Card orders send verification SCA_WHEN_REQUIRED plus experienceContext return/cancel URLs (server-derived in the create-order route, never client-supplied). When PayPal answers PAYER_ACTION_REQUIRED, the client redirects to the rel="payer-action" link; PayPal returns the buyer to /checkout?resume3ds=1&orderId=<dbOrderId> and appends token=<paypalOrderId>. Checkout resumes capture + complete-payment from those params.

**Why:** ~40% of card attempts were bank-declined; completing the 3DS challenge converts many declines. create-order must use prefer=return=representation or the payer-action link is missing.

**How to apply:** Keep all completion paths through the payment orchestrator (it has an explicit PAYER_ACTION_REQUIRED branch). Reconciliation also captures APPROVED (post-3DS, browser-closed) orders after an amount/currency check — don't remove that or those payments expire uncaptured.
