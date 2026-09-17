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

/**
 * Describe the key's SHAPE without ever printing it. Added 2026-09-17 after a
 * run in which all 54 uploads failed with "Invalid Compact JWS" — 54 identical
 * errors that buried the one fact that mattered: the key was not a valid key.
 */
function keyShape(k) {
  if (/^sb_secret_/.test(k)) return 'sb_secret_… (current Supabase secret key)';
  if (/^sb_publishable_/.test(k)) return 'sb_publishable_… — that is the PUBLIC key, not the secret one';
  if (/^ey[\w-]+\.[\w-]+\.[\w-]+$/.test(k)) return 'legacy service_role JWT (three dot-separated parts)';
  if (/^ey/.test(k)) return 'starts like a JWT but is NOT well-formed — truncated or mangled';
  return 'UNRECOGNISED — this does not look like a Supabase key at all';
}

let ok = 0;
const failures = [];
for (const f of files) {
  const bytes = await readFile(path.join(DIR, f));
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(f, bytes, { contentType: 'image/webp', upsert: true, cacheControl: '31536000, immutable' });
  if (error) {
    // FAIL FAST ON THE FIRST FILE. If file one cannot upload, the other N-1 will
    // fail the same way; the only thing a full run adds is noise. Auth problems
    // are the common case, so say plainly what was wrong with the key.
    if (ok === 0 && failures.length === 0) {
      console.error(`\n✗ The FIRST upload failed, so the run stopped here. Nothing was uploaded.`);
      console.error(`  file    : ${f}`);
      console.error(`  storage : ${error.message}`);
      console.error(`  key seen: ${keyShape(SERVICE_KEY)}, length ${SERVICE_KEY.length}`);
      if (/jws|jwt|token|signature|unauthor|invalid/i.test(error.message)) {
        console.error(`\n  This is an authentication failure, not a problem with the images.`);
        console.error(`  Check, in order:`);
        console.error(`   1. You used the SECRET key, not the publishable one. Supabase dashboard →`);
        console.error(`      Project Settings → API Keys → the secret key (sb_secret_…).`);
        console.error(`   2. The whole value arrived. In PowerShell use SINGLE quotes —`);
        console.error(`      $env:SUPABASE_SERVICE_ROLE_KEY = '<key>' — because double quotes let`);
        console.error(`      PowerShell expand anything after a $ and silently shorten the key.`);
        console.error(`   3. Echo its length to confirm, without revealing it:`);
        console.error(`      $env:SUPABASE_SERVICE_ROLE_KEY.Length`);
      }
      failures.push({ f, msg: error.message });
      break;
    }
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
  // exitCode, NOT process.exit(): an abrupt exit with the storage client's
  // sockets still in flight makes libuv print an "Assertion failed ...
  // UV_HANDLE_CLOSING" line on Windows, which reads like a crash and is not one.
  process.exitCode = 1;
} else {
  console.log('✓ All credential cards uploaded.');
}
