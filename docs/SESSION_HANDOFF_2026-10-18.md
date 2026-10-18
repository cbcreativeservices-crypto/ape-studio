# Session handoff — 2026-10-18

**Folder / branch:** `C:\Users\profe\dev\ape-build-snap`, branch `next-store-build`. Nothing is pushed, published, uploaded or submitted.
**Read first:** this file, then `docs/SESSION_HANDOFF_2026-10-16.md` (approval-day state) and `docs/APE_GOVERNANCE_DECISIONS_2026_10_16.md` (D77–D84).

## Store state (unchanged since 10-16)
- iOS 1.0 build 36 and Android 20 are **in review**. Release is MANUAL in App Store Connect.
- D74: no production OTA and no bucket upload until both stores approve.
- **Approval-day plan:** `Downloads/2026-10-16_APPROVAL_DAY_PLAN_UPDATE_VS_NEXT_BUILD.md`, with `Downloads/2026-10-15_APPROVAL_DAY_CHECKLIST.md`.
- **Fingerprints:** Android b975a5d1 ✅ (rechecked after the 10-18 image commits). iOS f6a7ee3c ✅ on 10-16; only image assets and docs changed since. Recheck both before any OTA anyway.
- **⏸ Waiting on the owner:** a NEWER intro video for that OTA. Convert it to 1080p30 fast-start, replace `assets/onboarding/intro_v1_1080p30.mp4`, show the owner, then publish.

## Done 10-17 → 10-18: images (all owner-approved, committed, not uploaded)
**16 of 78 installed:**

| When | Slots | Commit |
|---|---|---|
| 10-16 | gs3180, gs4410, cert-studio-recording-engineer, gs4040, gs4730, gs4490 | 256ea164, f2224b83 |
| 10-17 | gs3840, gs3530, gs3400, gs3960, cert-worship-audio | 001c55ca |
| 10-18, round 4 | cert-hearing-health (B), prog-broadcast-podcast-and-streaming (B) | 8b524911 |
| 10-18 | gs3170 loudspeaker cutaway (the owner's; background darkened locally, speaker unchanged) | e17d4665 |
| 10-18, round 5 | gs4090 radio (A), cert-assisted-listening (A) | ea11091f |

- Program squares go in `assets/Certificate_Squares` as `prog-*.webp`; `scripts/upload-credential-cards.mjs` uploads them on approval day.
- **62 still needed:** 14 topic tiles, 29 certificate squares, 16 program squares, 3 other. The live list, with exact send-back fixes per slot: `Downloads/2026-10-16_IMAGES_STILL_NEEDED.md`.
- **Comp C files:**
  - round-4 send-back with each slot's FULL spec inline, why it fails and how to improve: `Downloads/2026-10-18_COMP_C_ROUND4_SEND_BACK.md`;
  - round-4 review page: `Downloads/2026-10-18_COMP_C_ROUND4_REVIEW.html`;
  - ChatGPT hand-off: `Downloads/2026-10-17_CHATGPT_IMAGE_HANDOFF_UPDATE.md`.
- **Owner's Instagram images** (Firefly, about 45 in Downloads) are NOT app slots. Two came close (a theatre booth, a ceiling installer), but neither met its spec.

## How image review works now
1. Unpack each zip into a NEW scratch folder. Match each file to its slot: by name, or for unnamed images by the concept lines in IMAGE_SPECS.md (the spec copy is in the 10-15 handoff zip).
2. For large batches, run parallel reviewers (about 8 slots each) that check against the spec part by part: hands, connectors, text, brands, safety, must-haves.
3. Show the owner FITS / NEAR / NO and ask A or B per slot. Install only what the owner picks: 1024 × 1024 webp, q85, over the existing file; commit with named paths; fill the handoff stub.
4. **Background-only changes are done LOCALLY, never by a generator.** Generators re-invent the subject. The script is `scripts/images/darken_background.py` (edit its SRC/OUT and rim-band height): flood-fill on a contrast-boosted copy in the rim band, exact flood elsewhere, then a #141414→#0b0b0b vignette. Always show before/after edge crops.

## Still open (unchanged)
- Approval day → OTA → tiles and certificate upload → exam lab gate switched on → Comp A's server work (checklist §6) → app halves (§7).
- Exit flow (branch `exit-flow`), the website `/delete-account` page (branch `web-delete-account`), version 1.0.1 native build about 1–2 weeks after launch (D83).
- The uncommitted "M" files in git status are line-ending stat noise only; `git diff --stat` is empty. Do not commit them.
