/**
 * upload-menu-cards.mjs — upload the Home-carousel STUDY-AREA card art to the
 * public `course-cards` Supabase Storage bucket (owner 2026-09-16: the three
 * new areas — Mixing & Mastering, Audio Restoration & Archiving, Acoustics
 * Science).
 *
 * Filenames ARE the CARD_IMAGE values in CourseSelectionScreen.tsx
 * (area_<slug>.webp, 941×1672 portrait WebP — the standardized card size).
 * The client builds the URL straight from the name, so the file only has to
 * land in the bucket under its exact name.
 *
 * SECRET SAFETY: the service-role key is read from SUPABASE_SERVICE_ROLE_KEY —
 * never written to disk or printed. Set it in your shell just before running,
 * then clear it.
 *
 * RUN (PowerShell, from the project root):
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key>"
 *   node scripts/upload-menu-cards.mjs ["assets/Menu Course Cards/webp"]
 *   Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
 *
 * Only files matching area_*.webp are uploaded (strays are skipped). Upsert =
 * re-runnable/idempotent. Same immutable cache header as the other card art —
 * so a REPLACED image needs a cold restart of the dev client to show (the
 * old bytes are cached by URL).
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjgolswjggmlpeowvtxr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'course-cards';
const DIR = path.resolve(process.argv[2] || 'assets/Menu Course Cards/webp');

if (!SERVICE_KEY) {
  console.error('✗ Set SUPABASE_SERVICE_ROLE_KEY in your environment first (see the header of this file).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const NAME_RE = /^area_[a-z0-9-]+\.webp$/;
const all = await readdir(DIR);
const files = all.filter((f) => NAME_RE.test(f)).sort();
const skipped = all.filter((f) => !NAME_RE.test(f));
if (skipped.length) console.log(`(skipping ${skipped.length} non-card file(s): ${skipped.join(', ')})`);
console.log(`Uploading ${files.length} files from ${DIR} → bucket "${BUCKET}" …`);

let ok = 0;
for (const f of files) {
  const bytes = await readFile(path.join(DIR, f));
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(f, bytes, { contentType: 'image/webp', upsert: true, cacheControl: '31536000, immutable' });
  if (error) console.error(`  ✗ ${f}: ${error.message}`);
  else {
    ok++;
    console.log(`  ✓ ${f}`);
  }
}
console.log(`\nDone: ${ok}/${files.length} uploaded.`);
process.exit(ok === files.length ? 0 : 1);
