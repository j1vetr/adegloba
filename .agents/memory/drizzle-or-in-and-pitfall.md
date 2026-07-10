---
name: Drizzle or() inside and() pitfall
description: Combining or() and and() from drizzle-orm in this project has caused query bugs; prefer raw sql IN() instead.
---

When building conditional/multi-status WHERE clauses with Drizzle ORM in this codebase, avoid nesting `or()` inside `and()` (e.g. `and(or(eq(status, 'paid'), eq(status, 'completed')), gte(paidAt, start))`).

**Why:** This combination has previously produced incorrect/broken query behavior in this project.

**How to apply:** For "status IN (...)" style conditions, use a raw SQL fragment instead, e.g. `` sql`${orders.status} IN ('paid', 'completed')` `` combined with other conditions via `and()`, or embed the whole condition set in one `sql` template with `CASE WHEN` as needed (see `getShipMonthlyQuotaExport` in `server/storage.ts` for an example pattern).
