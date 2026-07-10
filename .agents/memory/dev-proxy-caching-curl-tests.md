---
name: Dev proxy caching affects curl tests
description: curl tests against new/changed GET API routes in this Replit dev environment can return stale cached HTML/JSON instead of hitting the live handler.
---

When manually curl-testing a newly added or changed GET endpoint against `localhost:5000` in this environment, a request can come back with a cached response (e.g. Vite's SPA fallback HTML, or an earlier response body) even though the route and middleware are implemented correctly and the server has restarted.

**Why:** Something in the request path (dev proxy/browser-level caching semantics) can serve a cached GET response for a repeated identical URL, which looks identical to "the route isn't registered" or "auth middleware isn't working" and can send debugging down the wrong path.

**How to apply:** When a curl test of an API route gives a surprising/stale result (wrong status code, HTML instead of JSON, etc.), retest with a cache-busting query param (e.g. `?nc=$(date +%s%N)`) before concluding there's a code bug. If the cache-busted request behaves correctly, the original code was fine.
