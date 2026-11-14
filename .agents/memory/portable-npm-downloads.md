---
name: Portable npm download addresses
description: Avoid environment-private download addresses in dependencies installed on the external server
---

This application is also installed on an external server with `npm ci`. After installing dependencies, inspect the lockfile's actual `resolved` download URLs, not only the package manifests or installation directory.

**Why:** The managed package installation recorded Replit-internal package download addresses. Dependency presence and Git tracking did not establish that a fresh external installation could reach those addresses.

**How to apply:** Keep approved package versions and integrity hashes unchanged. When preparing portable public-npm download URLs, verify them against the official registry metadata. This is for portability of already-approved packages, never a way to bypass a security-blocked installation.
