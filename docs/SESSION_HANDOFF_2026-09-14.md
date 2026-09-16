# Computer A (Cowork) — Session Handoff · 2026-09-14

**You are Computer A** — the Cowork/backend session for **Pro Audio Training Academy** (the AP&E mobile app). You own the Supabase DB, guarded SQL, edge functions, governance/QA, and ccode coordination. You are BLIND to the client app — **ccode** (a separate Claude Code session) owns it. Conflict rule: data/schema → **live DB wins**; client behavior (a screen, lab, tool, ear-training) → **ccode wins**; never assert a client feature from DB rows (the ear-training lesson).

## START HERE (first 3 things)
1. **Read memory** — `/projects/019e233f-f40b-71f1-bb98-7fbb7c468063/areas/ape-launch-status.md` is the live delta log (most current). Also `product-rules.md`, `ape-security.md`.
2. **Read the sync channel** — repo `docs/CROSS_SESSION_HANDOFF.md` (the A↔ccode running log; append there on every apply/deliverable). Requires the repo folder connected (see Folders).
3. **Connect folders** (see Folders below) before file work.

## Key IDs
- Supabase project ref: `yjgolswjggmlpeowvtxr` (Postgres 17.6). Curriculum v3: `a7c1f2e0-9b34-4d55-8e21-0c4f6a9b1d72`.
- Publishable key (public): `sb_publishable_9Dder46BJxwdsS7TGvV4YQ_7dK2m6hZ`.
- Counts (verified live): 166 active topics · 20 fields · 50 subjects · 36 programs. Quiz/Final = 30 Q, pass 28/30.
- Repo: `C:\Users\profe\dev\ape-studio` (kept OUT of OneDrive). Output folder: `C:\Users\profe\OneDrive\Documents\Claude\Projects\AUDIO APP`.

## Backend state = GO (all verified live)
Beginner questions loaded; scenario answer-key gate closed; perf + security passes; device-attestation DB foundation (attest_nonces/attest_keys). Backend/data/security/performance are launch-ready.

### Built THIS session (all live + verified)
- **Lab-upload** (source ingest): private bucket `lab-audio-source` (256MB), edge fn `lab-upload` (verify_jwt=false; `{code,verify}` unlock + `{code,filename,size,contentType}`→signed upload URL), tables `lab_upload_config` (code sha256) + `lab_audio_uploads` (manifest). Default code `ape-labs-upload-2026` — **Booth to rotate before real use** (rotate SQL in LAB_UPLOAD_README). Uploader smoke-passed. ccode published the gated web route `/lab-upload`.
- **Lab-audio** (converted read path): private bucket `lab-audio`, table `lab_audio_assets` (+ `access_tier` public|free|academy, default academy), edge fn `lab-audio` (verify_jwt=false; `{lab_key,asset_key}`+JWT → per-tier gate → 120s signed URL + metadata). Read path COMPLETE. **Not built yet: the conversion worker** (ffmpeg batch: lab-audio-source→transcode AAC 256/48k, WAV passthrough for lossless→lab-audio→upsert lab_audio_assets; editorial lab_key/asset_key at ingest). Edge runtime has no ffmpeg → must be a Cowork/worker batch. **This is A's top open build.**
- **Store privacy FINALIZED** (from ccode SDK inventory): Apple App Privacy + Google Data Safety answers (2026-09-14_STORE_PRIVACY_FINAL). No analytics/crash/ads SDK; expo-iap (NOT RevenueCat) direct billing; email/password auth (Apple 4.8 N/A); no location; mic on-device; dictation on-device (Audio-Data = none). **PROVISIONAL** until the new analytics/crash SDK (below) is chosen. RevenueCat→expo-iap corrected across packet/guide/READ_FIRST.
- **Launch checklist reconciled** (2026-09-14_LAUNCH_CHECKLIST_RECONCILED) — owner+status on every item.

## Locked decisions (Booth, 2026-09-14)
- **Lifetime membership IS offered** → Apple non-consumable + Google one-time + ccode entitlement wiring.
- **Analytics + crash/diagnostics ARE wanted** → a monitoring SDK will ship (reverses "none"). **This reopens the privacy forms** — once ccode picks + wires a privacy-first SDK (no cross-app tracking) and reports its data, A adds Diagnostics + Analytics categories.
- **Not child-directed** (recorded).
- **Lab-audio = PRIVATE + signed URLs**, per-asset tier (public/free/academy).
- Business Phase-0 done: LLC formed, banking + tax ID done, IP/patent/copyright cleared, D-U-N-S recorded, both store accounts open + paid.

## Open items by owner
**A (me):** (1) build the lab-audio conversion worker; (2) update privacy forms once the analytics SDK is chosen; (3) regenerate the master store PDF (`PRO_AUDIO_TRAINING_ACADEMY_STORE_PLAN.pdf`) — it still has 2 RevenueCat lines + predates the final privacy answers (no saved source; rebuild fresh); (4) redeploy `lab-upload` + `lab-audio` CORS from `*` → site origin when Booth gives it; (5) optional: draft reviewer review-notes.
**ccode:** pick + wire the analytics/crash SDK (report data → A); wire lifetime entitlement; wire the labs to the `lab-audio` fetch fn; the 10 store-review UI items; production builds (Xcode26/API36, confirm expo-iap Play Billing 8); Task-2 final naming already defined.
**Booth:** rotate the lab-upload code; create subscription products incl. lifetime; age/audience questionnaires; store listing entry (copy ready); reviewer demo account; give the CORS origin string (apex+www or www-only); analytics SDK direction (or let ccode pick).

## A↔ccode channel — CAUTION
The hook auto-appends ccode's entries on commit. **A's entries have been clobbered 3×** because A can't git-commit from Cowork (Sept-8 mount issue kills device_bash). When appending: re-stage the channel, insert newest-on-top above the latest entry, commit via device_commit_files with expectedMtimeMs. If clobbered, the durable record is memory + delivered files; relay critical ACKs to ccode via a copy/paste message through Booth.

## Folders this session used (connect these first)
- `C:\Users\profe\dev\ape-studio\docs` (or the repo root) — the sync channel + ccode handoffs live here. **Always connect (Booth's standing rule — it's dropped twice).**
- `C:\Users\profe\OneDrive\Documents\Claude\Projects\AUDIO APP` — canonical output folder (dated subfolders).

## Tools/environment notes
- device_bash (shell to Booth's machine) is DOWN (Sept-8 Windows update: "no Plan9 drive shares mounted"). device_list_dir / device_stage_files / device_commit_files still work. Can't run git or delete/move via shell.
- Supabase MCP + remote-devices reconnect via ToolSearch (deferred). Delivery rule: files Booth acts on = individual file cards; A's own results = inline text/links.
