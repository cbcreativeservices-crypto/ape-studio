# CCODE HANDOFF — Execution queue (2 items) · 2026-09-12

**One-liner for the Claude Code session:** `read docs/CCODE_EXECUTION_QUEUE_2026_09_12.md and apply it`

Provenance: built by Computer A from the 2026-09-11 repo ground-truth pass. **NOT re-verified in-repo on 2026-09-12** (the Cowork session had no repo access). Each item below starts with a **CONFIRM (step 0)** you run in the repo before changing anything — if the confirm shows the state already fixed, mark it done and skip. Do them in order; item 1 is the launch blocker.

---

## 1 — DO-NOT-READ MANIFEST (assets, not reading)

- `career-index-overrides_MERGED.json` — the merged Career-Finder overrides to install. **Copy into place, do not hand-edit.**
- `CF_CCODE_APPLY_NOTE.md` — Computer A's authoritative apply note for item 2 below (the exact `build-career-index.py` hook changes). **This is the spec for the hooks; follow it verbatim.**
- Both live in `C:\Users\profe\OneDrive\Documents\Claude\Projects\AUDIO APP\2026-09-11_CAREER_FINDER_AUDIT_QA\`. If they are not already in the repo, copy them into `scripts/` (or wherever CF_CCODE_APPLY_NOTE.md directs) as the first move. Everything else in this doc is self-contained.

---

## 2 — Career-Finder overrides apply  ·  BLOCKER

**Why:** the Career-Finder index the app ships is stale; the overrides + build hooks were authored and A-verified on 2026-09-11 but never applied. Not a Supabase change — repo + build only.

**Ground truth (as of 2026-09-11):**
- `scripts/career-index-overrides.json` was still the old ~4 KB Sep-4 file.
- `scripts/build-career-index.py` lacked the `unregulated` / `tier` / `workModel` fields and the `removeTitles` hook.
- `careerIndex.json` was not rebuilt.
- Owner ruling (closed): the 4 title-reality items **AC-0024, AC-0132, AC-0187, AC-0235** are DROP-ALL-4, folded into the overrides as `removeTitles` + a build hook. A-verified the drop takes the title count **1902 → 1898** with no career family emptied.

**CONFIRM (step 0) — run in `C:\Users\profe\dev\ape-studio`:**
- `git status` clean / on the intended branch.
- Check the override file is still the stale one: compare `scripts/career-index-overrides.json` size/mtime to the MERGED asset. If it already equals the MERGED file AND `careerIndex.json` reflects 1898 titles, this item is already done — record it and skip.
- Confirm `scripts/build-career-index.py` does **not** yet contain the `removeTitles` / `unregulated` / `tier` / `workModel` hooks.

**APPLY:**
1. Replace `scripts/career-index-overrides.json` with `career-index-overrides_MERGED.json` (overwrite; keep the canonical filename).
2. Add the missing hooks to `scripts/build-career-index.py` **exactly as specified in `CF_CCODE_APPLY_NOTE.md`** (the `unregulated`/`tier`/`workModel` passthrough + the `removeTitles` filter). Do not improvise the hook shape — the note is authoritative.
3. Rebuild the index: run the project's career-index build (per `CF_CCODE_APPLY_NOTE.md`; typically `python scripts/build-career-index.py`), regenerating `careerIndex.json`.

**VERIFY (done-when):**
- `careerIndex.json` rebuilt (new mtime), and the four titles AC-0024 / AC-0132 / AC-0187 / AC-0235 are **absent** from it.
- Total title count is **1898** (was 1902) — the drop of exactly 4.
- No career family/cluster ends up with zero titles (spot-check the families those 4 belonged to).
- `tsc` clean + existing tests pass; commit to the working branch.

---

## 3 — Topic-tile Cache-Control: `immutable`

**Why:** `scripts/upload-topic-tiles.mjs` uploads the 166 topic tiles to Supabase Storage with **no `cacheControl`**, so tiles serve the default `max-age=3600`. That is the root cause of the stale topic-art issue — new art can take up to an hour to appear. Fix = upload with a long immutable cache header. (DB side is already done: all 166 `achievements.icon_url` are wired live.)

**CONFIRM (step 0):**
- Open `scripts/upload-topic-tiles.mjs` and confirm the Storage `.upload(...)` call passes **no** `cacheControl` option (or a short one). If it already sets `cacheControl: '31536000, immutable'`, skip to VERIFY.

**APPLY:**
- In the `.upload(path, body, { ... })` options object in `scripts/upload-topic-tiles.mjs`, add:
  `cacheControl: '31536000, immutable'`
  (and set `upsert: true` if not already, so the re-upload overwrites existing objects). Change only that options object; leave the file/loop logic alone.
- **Re-upload the tiles** so the new header is written onto the stored objects (editing the script alone changes nothing already in the bucket): run `node scripts/upload-topic-tiles.mjs`.
  - This needs the Supabase Storage **service** credentials in the run env (`SUPABASE_URL` + service key the script expects). If the Claude Code session has them, run it there; if not, hand the single command to Cháno to run locally. It writes to Storage only — no DB, no schema.

**VERIFY (done-when):**
- Fetch any tile URL and confirm the response header `Cache-Control: max-age=31536000, immutable` (e.g. `curl -sI <public tile URL> | findstr /I cache-control`, or the browser Network tab).
- Spot-check 2-3 tiles still render in the app.

---

## ACK — append to `docs/CROSS_SESSION_HANDOFF.md` (top, newest-first) when done

> **ACK (Code, 2026-09-__):** Execution queue applied. (1) Career-Finder: installed merged overrides + build hooks per CF_CCODE_APPLY_NOTE.md, rebuilt careerIndex.json, verified 1902→1898 (AC-0024/0132/0187/0235 dropped, no family emptied), tsc+tests green, committed <sha>. (2) Topic tiles: added cacheControl '31536000, immutable' to upload-topic-tiles.mjs and re-uploaded; verified header on a live tile. Both closed.

If either CONFIRM shows the item was already applied, ACK it as already-done and move on.

---
*Scale: two repo items, one blocker. Built 2026-09-12 by Computer A from the 2026-09-11 ground-truth; ccode confirms live in-repo before applying. — A*
