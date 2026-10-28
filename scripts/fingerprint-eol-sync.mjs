#!/usr/bin/env node
// Make this checkout's FINGERPRINT INPUTS byte-identical to the checkout the
// store builds were made from, when they differ ONLY by line endings.
//
// Why (must-do A1, 2026-10-27): builds iOS 39 / Android 23 were made from
// ape-build-snap, where git checked several native files out with CRLF. EAS
// hashes the bytes, so the same content with LF in this worktree gave a
// different runtime (Android 90f09e5f… instead of a903813a…) — an OTA
// published from here would have reached NO phone. git sees no difference, so
// nothing in a diff or a test catches it. A file whose CONTENT differs is
// reported and never touched.
//
// Usage (from this repo's root), then re-check both builds:
//   node scripts/fingerprint-eol-sync.mjs [buildCheckout]   (default ../ape-build-snap)
//   npx eas-cli fingerprint:compare --build-id 7fac1daa-a163-453f-9fcd-4468608db2b8 --non-interactive   # Android 23
//   npx eas-cli fingerprint:compare --build-id 07d79e60-c55f-457a-9003-226c6c9784d8 --non-interactive   # iOS 39
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const here = process.cwd();
const snap = resolve(process.argv[2] ?? join(here, '..', 'ape-build-snap'));
const ROOTS =
  /^(\.gitignore|\.easignore|app\.json|app\.config\.[jt]s|eas\.json|package\.json|package-lock\.json|metro\.config\.js|babel\.config\.js|index\.[jt]s|modules\/|plugins\/|patches\/|android\/|ios\/)/;

const files = execSync('git ls-files', { cwd: here, maxBuffer: 1 << 26 })
  .toString()
  .split('\n')
  .filter((f) => f && ROOTS.test(f));
const strip = (b) => b.toString('latin1').replace(/\r/g, '');
let same = 0;
let synced = 0;
const realDiffs = [];
const missing = [];
for (const f of files) {
  const a = join(snap, f);
  if (!existsSync(a)) {
    missing.push(f);
    continue;
  }
  const A = readFileSync(a);
  const B = readFileSync(join(here, f));
  if (A.equals(B)) same++;
  else if (strip(A) === strip(B)) {
    writeFileSync(join(here, f), A);
    synced++;
  } else realDiffs.push(f);
}
console.log(JSON.stringify({ buildCheckout: snap, checked: files.length, same, synced, realDiffs, missing }, null, 1));
if (realDiffs.length) {
  console.error('⛔ REAL content differences in fingerprint inputs — the OTA would not match the builds. Stop.');
  process.exitCode = 1;
}
