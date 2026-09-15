# ccode → A — completed lab-audio mapping (batch 1, 88 rows)

**Re:** `CCODE_LAB_AUDIO_WIRING_HANDOFF_2026_09_15.md`. Owner-approved 2026-09-15.
**Deliverable:** `docs/lab_audio_asset_mapping_COMPLETED_2026-09-15.json` — the 90-row
inventory with `lab_key` + `access_tier` filled, 2 dup rows dropped → **88 rows**.
Same row shape as your inventory (+ `original_filename`/`group` kept for traceability;
ignore those two on load if you don't want them).

## lab_key assignment (owner ruling)
| lab_key | count | contents |
|---|---|---|
| `bass_fretboard` | 72 | its own lab — chromatic fretboard (52) + bass harmonics (20) |
| `mixing_lab` | 5 | full mix + the "…for Full Band Demo" stems (bass, guitar, organ, drumset, full-band output) |
| `demo_signals` | 9 | **all one-shots**, shared/reused across labs — Bass Drum, Hi Hat, SNARE, Piano Chord 1–4, Acoustic Guitar A/E |
| `critical_listening` | 2 | the 2 male dialogue lines (also used for de-essing / vocal processing) |

Split rule inside your `full-band-demo` group: filenames containing "Full Band/Full band"
= mixer stems → `mixing_lab`; standalone drum one-shots (Bass Drum / Hi Hat / SNARE)
→ `demo_signals`. Owner rule: **one-shots always live under `demo_signals`** so any lab
can pull them by one key (no per-lab duplication).

## access_tier = `public` for ALL 88 (owner ruling)
Owner: **"free is determined at the lab level, not the audio level — audio plays in the
labs that are accessed."** So the audio adds no second gate; entry gating is at the lab
screen. Load every row `access_tier='public'` (edge fn then skips the JWT/entitlement
check). If launch policy later wants a server-side second lock on paid-lab audio, we can
re-tier specific rows then — not now.

## asset_key
Kept your `proposed_asset_key` verbatim for all 88 (no overrides).

## dropped
`acoustic-guitar-a-chord-dup2`, `acoustic-guitar-e-chord-dup2` (byte-identical dups).

## ⚠️ one incoming replacement — hold/expect a v2
`asset_key=drumset-for-full-band-demo` (lab_key `mixing_lab`): the current file **clipped
at 0 dBFS**. The owner has a corrected file coming. When it arrives, load it as a **new
version of the SAME asset_key** (bump `version`, keep lab_key/asset_key) so the client key
never changes. You can either hold that one row out of batch-1 load, or load it now and
supersede — your call; ccode needs no change either way.

## ccode client wiring
Separate track — the fetch layer against §3 (call `lab-audio` with `{lab_key, asset_key}`
→ stream 120 s signed `url` via expo-audio, mirroring `earPlayer.ts`) + per-lab playback
UI is owner-gated and not started yet. Nothing blocks your load of the 88 rows.
