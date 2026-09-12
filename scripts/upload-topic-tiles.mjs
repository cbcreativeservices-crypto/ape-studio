/**
 * upload-topic-tiles.mjs — reliably upload the 166 topic-tile WebP to the
 * public `topic-tiles` Supabase Storage bucket (owner 2026-09-09).
 *
 * The dashboard drag-drop of 166 files silently failed to commit; this uploads
 * each file via the Storage API with the correct content-type, idempotently
 * (upsert), and prints a running count so you can see it work.
 *
 * SECRET SAFETY: your service-role key is read from the SUPABASE_SERVICE_ROLE_KEY
 * environment variable — it is NEVER written to disk or printed. Set it in your
 * own shell just before running, then clear it.
 *
 * RUN (PowerShell, from the project root):
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "<your service_role key>"
 *   node scripts/upload-topic-tiles.mjs
 *   Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY   # clear it when done
 *
 * Re-runnable: upsert means running it again just overwrites, so a partial run
 * is safe to repeat.
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjgolswjggmlpeowvtxr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'topic-tiles';
const DIR = path.resolve('assets/topic-images-webp');

if (!SERVICE_KEY) {
  console.error('✗ Set SUPABASE_SERVICE_ROLE_KEY in your environment first (see the header of this file).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith('.webp')).sort();
console.log(`Uploading ${files.length} files from ${DIR} → bucket "${BUCKET}" …`);

let ok = 0;
const failures = [];
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const bytes = await readFile(path.join(DIR, f));
  const { error } = await supabase.storage
    .from(BUCKET)
    // cacheControl (execution queue item 2, 2026-09-12): without it Storage
    // serves these at the default max-age=3600, which is the root cause of the
    // stale topic-art issue — new art could take up to an hour to appear. The
    // tiles are content-addressed by filename and replaced wholesale when the
    // art changes, so a year + immutable is safe and is what the header is for.
    //
    // ⚠️ Editing this line changes NOTHING already in the bucket. The header is
    // written per object at upload time, so the 166 tiles must be RE-UPLOADED
    // (upsert overwrites) for it to take effect.
    .upload(f, bytes, { contentType: 'image/webp', upsert: true, cacheControl: '31536000, immutable' });
  if (error) {
    failures.push({ f, msg: error.message });
    console.error(`  ✗ ${f}: ${error.message}`);
  } else {
    ok++;
    if (ok % 20 === 0 || ok === files.length) console.log(`  … ${ok}/${files.length}`);
  }
}

console.log(`\nDone: ${ok}/${files.length} uploaded.`);
if (failures.length) {
  console.error(`✗ ${failures.length} failed — re-run to retry (upsert is safe).`);
  process.exit(1);
}
console.log('✓ All topic tiles uploaded. Reload the app to see them.');
