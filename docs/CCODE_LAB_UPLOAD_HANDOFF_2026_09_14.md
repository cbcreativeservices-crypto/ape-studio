<!-- Handoff: A -> ccode. Fold the lab-audio uploader into the web/ site as a gated route; own the conversion + final asset naming. -->
# ccode task — lab-audio uploader on the website (+ the conversion side is yours)

**From:** Computer A (backend) · **To:** ccode (`ape-studio`, `web/`) · **2026-09-14**

## What A already built and APPLIED live (backend is done)
- **Private bucket** `lab-audio-source` — `public=false`, 256 MiB/object cap, `allowed_mime_types=null` (any).
- **Edge function** `lab-upload` (deployed, `verify_jwt=false`, v2). Contract:
  - `POST /functions/v1/lab-upload` `{ code, verify:true }` → `200 {ok:true}` if the shared code is valid (no side effects) — used to unlock the UI.
  - `POST … { code, filename, size, contentType }` → `200 { bucket, path, token }`. It checks the code (sha256 vs `public.lab_upload_config`), validates the extension against an audio/video allowlist, normalizes the name, mints a **one-shot signed upload URL**, and logs the row. Errors: `401 invalid_code`, `415 unsupported_type`, `503 upload_disabled`.
  - The browser then calls `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)`. **Service-role key never leaves the function.**
- **Ingest naming (A owns this):** `‹slug-of-original›__‹UTCstamp›_‹rand4›.‹ext›`, e.g. `kick-close-mic__20260914T153012Z_a4f9.wav`.
- **Manifest table** `public.lab_audio_uploads` (service-role only): original_filename, canonical_path, ext, content_type, byte_size, bucket, uploaded_at. This is the source-of-truth list of what's been uploaded.
- Access = a shared **lock code** (server-checked). Default is `ape-labs-upload-2026` until Booth rotates it (one SQL line, in his runbook).

## Your side — two pieces

### 1) Native gated upload route in `web/` (replaces A's standalone page)
A working standalone `lab_uploader.html` is delivered to Booth so uploads can start **today**. For the real site, fold it into `web/` as a route behind the existing site gate:
- New route e.g. `web/app/(gated)/lab-upload/page.tsx` — behind `web/lib/gate.ts` (or a second, upload-specific code if you'd rather not reuse the site key). The standalone page's logic (unlock → `verify`, drag-drop, per-file `lab-upload` call → `uploadToSignedUrl`) ports directly; use the app's `@supabase/supabase-js` and `NEXT_PUBLIC_SUPABASE_URL` / publishable key rather than the hardcoded constants in the standalone file.
- Tighten CORS on the `lab-upload` function from `*` to the site origin(s) before launch (same note as `tube-image`). A can redeploy that one-line change on your say-so.
- Optional niceties: byte-progress bars (raw XHR PUT to the signed URL instead of `uploadToSignedUrl`), and a small "recent uploads" list read from `lab_audio_uploads` via a service-role-gated function.

### 2) The conversion step + the FINAL lab-asset naming (A did NOT decide these)
`lab-audio-source` is a **staging** bucket of raw uploads. The conversion you requested, and the bucket + filename/stem convention the **labs actually read**, are yours to define — A deliberately did not guess them (the same discipline as the ear-training correction). When you settle them, tell A in the channel:
- the **final bucket** name (e.g. `lab-audio` or per-lab), public/private + gating,
- the **stem/naming** the lab code expects (so raw→final mapping is unambiguous),
- whether A should build the conversion as an **edge function / DB trigger** on new `lab_audio_uploads` rows (A can own that once the target format + naming are fixed), or whether ccode runs it client-/script-side.

Log the answer in `docs/CROSS_SESSION_HANDOFF.md`; A will wire the staging→final step to match.

---
*Backend applied + verified live 2026-09-14 (migration `lab_upload_foundation`; bucket + function). Additive, locked-down, service-role-only. — Computer A*
