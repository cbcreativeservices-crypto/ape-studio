/**
 * upload-tube-diagrams.mjs — upload the 40-tube × 2-page card set (80 PNGs) to
 * the public Supabase Storage bucket `tube-diagrams` (owner 2026-08-17).
 *
 * Dependency-free: uses Node 18+ global fetch and the Storage REST API. Upserts,
 * so re-running is safe and it won't touch the old single-page files (different
 * names) — remove those from the bucket by hand later if you want them gone.
 *
 * USAGE (PowerShell, from the repo root C:\Users\profe\dev\ape-studio):
 *
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<your service_role key>"
 *   node scripts/upload-tube-diagrams.mjs "E:\path\to\exports-final"
 *
 * - The folder argument must contain the 80 files named <NN-SHORT>-p1.png /
 *   -p2.png (the `exports-final` folder from the zip).
 * - SUPABASE_URL is read from the env var of the same name, or falls back to
 *   EXPO_PUBLIC_SUPABASE_URL in the repo's .env.
 * - The service_role key is SECRET — set it in the shell as shown, never commit
 *   it. Storage writes require service_role (the public anon key can't upload).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BUCKET = 'tube-diagrams';
const EXPECTED = 80;
const CONCURRENCY = 5;

function readEnvUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  try {
    const env = readFileSync(resolve('.env'), 'utf8');
    const m = env.match(/^EXPO_PUBLIC_SUPABASE_URL\s*=\s*(.+)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    /* no .env — fall through */
  }
  return null;
}

const SUPABASE_URL = readEnvUrl();
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const srcDir = process.argv[2];

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!SUPABASE_URL) die('SUPABASE_URL not found (set env SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL in .env).');
if (!KEY) die('Set SUPABASE_SERVICE_ROLE_KEY in your shell first (see the header of this file).');
if (!srcDir) die('Pass the folder containing the 80 PNGs, e.g. node scripts/upload-tube-diagrams.mjs "E:\\...\\exports-final"');

const dir = resolve(srcDir);
const files = readdirSync(dir).filter((f) => /-p[12]\.png$/i.test(f)).sort();

if (files.length === 0) die(`No <name>-p1.png / -p2.png files found in ${dir}`);
if (files.length !== EXPECTED) {
  console.warn(`⚠  Expected ${EXPECTED} pages, found ${files.length}. Proceeding anyway.`);
}

async function uploadOne(name) {
  const bytes = readFileSync(join(dir, name));
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
      'cache-control': '3600',
    },
    body: bytes,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
  }
}

console.log(`Uploading ${files.length} files to ${SUPABASE_URL}/storage/.../${BUCKET}\n`);

let ok = 0;
const failures = [];
// Simple concurrency pool.
const queue = [...files];
async function worker() {
  for (;;) {
    const name = queue.shift();
    if (!name) return;
    try {
      await uploadOne(name);
      ok += 1;
      process.stdout.write(`  ✓ ${name}\n`);
    } catch (e) {
      failures.push({ name, error: String(e.message || e) });
      process.stdout.write(`  ✗ ${name} — ${e.message || e}\n`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nDone: ${ok}/${files.length} uploaded.`);
if (failures.length) {
  console.log(`Failed (${failures.length}):`);
  for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
  process.exit(1);
}
