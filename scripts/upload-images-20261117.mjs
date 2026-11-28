/**
 * upload-images-20261117.mjs — upload ONLY the 14 images replaced on 2026-11-17
 * (owner: "ok replace the images that fit", then "ok do it"), then prove each one
 * is live by downloading its public URL and comparing bytes with the repo file.
 *
 * SECRET SAFETY: the service-role key is read from SUPABASE_SERVICE_ROLE_KEY and is
 * never written or printed. RUN (PowerShell, after copying the key to the clipboard):
 *   cd C:\Users\profe\dev\ape-workbench; $env:SUPABASE_SERVICE_ROLE_KEY = Get-Clipboard; node scripts/upload-images-20261117.mjs; Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
 * [MD:D67]
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const URL_ = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yjgolswjggmlpeowvtxr.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('Set SUPABASE_SERVICE_ROLE_KEY first (see the header).'); process.exit(1); }

const FILES = [
  ['topic-tiles', 'assets/topic-images-webp', 'gs3410_plugin-formats-hosts.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs3730_worship-sound.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs3750_commercial-install-av.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs3000_sound-wave-fundamentals.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs3090_mic-transducer-principles.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs3380_delay-time-based-fx.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs4100_broadcast-air-chain.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs4290_loudness-listening-environments.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs4380_career-exploration.webp'],
  ['topic-tiles', 'assets/topic-images-webp', 'gs4420_audio-dsp-mir-ethics.webp'],
  ['course-cards', 'assets/Certificate_Squares', 'cert-worship-audio-v3.webp'],
  ['course-cards', 'assets/Certificate_Squares', 'prog-medical-and-clinical-acoustics-v3.webp'],
  ['course-cards', 'assets/Certificate_Squares', 'prog-studio-recording-engineering-v3.webp'],
  ['course-cards', 'assets/Certificate_Squares', 'prog-theater-venue-and-entertainment-audio-v3.webp'],
];

const sb = createClient(URL_, KEY, { auth: { persistSession: false } });
const md5 = (b) => createHash('md5').update(b).digest('hex');
let ok = 0;
for (const [bucket, dir, name] of FILES) {
  const bytes = await readFile(`${dir}/${name}`);
  const { error } = await sb.storage.from(bucket).upload(name, bytes, { contentType: 'image/webp', upsert: true, cacheControl: '3600' });
  if (error) { console.log(`FAIL upload ${bucket}/${name}: ${error.message}`); continue; }
  const res = await fetch(`${URL_}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}?v=${Date.now()}`);
  const live = Buffer.from(await res.arrayBuffer());
  const same = res.ok && md5(live) === md5(bytes);
  console.log(`${same ? 'OK  ' : 'DIFF'} ${bucket}/${name}`);
  if (same) ok++;
}
console.log(`\n${ok} of ${FILES.length} live and byte-identical.`);
