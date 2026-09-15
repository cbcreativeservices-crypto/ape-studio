/**
 * upload-credential-cards.mjs — upload the per-certificate / per-program square
 * WebP art to the public `course-cards` Supabase Storage bucket (owner 2026-09-14).
 *
 * Filenames ARE the credential slug + ".webp" (e.g. cert-mixing-engineer-v3.webp,
 * prog-live-sound-engineering-v3.webp). The client builds the URL straight from
 * the slug, so the file only has to land in the bucket under its exact name.
 *
 * SECRET SAFETY: the service-role key is read from SUPABASE_SERVICE_ROLE_KEY —
 * never written to disk or printed. Set it in your shell just before running,
 * then clear it.
 *
 * RUN (PowerShell, from the project root):
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key>"
 *   node scripts/upload-credential-cards.mjs [folder]      # default: assets/Certificate_Squares
 *   Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
 *
 * Only files matching cert-*.webp / prog-*.webp are uploaded (strays are skipped).
 * Upsert = re-runnable/idempotent. Same immutable cache header as the tiles.
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjgolswjggmlpeowvtxr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'course-cards';
const DIR = path.resolve(process.argv[2] || 'assets/Certificate_Squares');

if (!SERVICE_KEY) {
  console.error('✗ Set SUPABASE_SERVICE_ROLE_KEY in your environment first (see the header of this file).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const NAME_RE = /^(cert|prog)-[a-z0-9-]+\.webp$/;
const all = await readdir(DIR);
const files = all.filter((f) => NAME_RE.test(f)).sort();
const skipped = all.filter((f) => f.toLowerCase().endsWith('.webp') && !NAME_RE.test(f));
if (skipped.length) console.log(`(skipping ${skipped.length} non-credential file(s): ${skipped.join(', ')})`);
console.log(`Uploading ${files.length} files from ${DIR} → bucket "${BUCKET}" …`);

let ok = 0;
const failures = [];
for (const f of files) {
  const bytes = await readFile(path.join(DIR, f));
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(f, bytes, { contentType: 'image/webp', upsert: true, cacheControl: '31536000, immutable' });
  if (error) {
    failures.push({ f, msg: error.message });
    console.error(`  ✗ ${f}: ${error.message}`);
  } else {
    ok++;
    if (ok % 10 === 0 || ok === files.length) console.log(`  … ${ok}/${files.length}`);
  }
}

console.log(`\nDone: ${ok}/${files.length} uploaded.`);
if (failures.length) {
  console.error(`✗ ${failures.length} failed — re-run to retry (upsert is safe).`);
  process.exit(1);
}
console.log('✓ All credential cards uploaded.');
