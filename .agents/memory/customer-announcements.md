---
name: Customer announcement behavior
description: Product decisions for announcement frequency, revisions and protecting payment flows
---

Nontransactional customer popups must not interrupt checkout, payment redirects or payment result pages.

**Why:** Payments can require 3DS redirect/resume and the customer must be able to finish or understand payment without an unrelated modal.

**How to apply:** Keep new global customer messaging limited to ordinary signed-in customer pages, excluding admin, auth and payment routes.

Announcement read history is account-based for the once-only mode. Content edits create a new announcement revision, but settings-only edits preserve existing read history unless the admin explicitly requests redisplay.

**Why:** Clearing browser storage must not make an already-read once-only announcement reappear. Toggling a schedule or publication switch should not silently reset everyone’s acknowledgement.

**How to apply:** Treat publication settings and content revisions separately. Explain redisplay behavior beside the admin controls.
