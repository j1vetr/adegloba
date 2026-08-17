#!/bin/bash
set -e
npm install
# --force: non-interactive; stdin is closed during post-merge runs
npx drizzle-kit push --force
