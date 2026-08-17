# Lab Images — Session Handoff (2026-08-17)

The owner runs a DEDICATED Claude Code session for lab image return/creation
from here on. This doc is that session's starting point: current state, the
ratified protocol, and every outstanding item. Predecessor work + docs are all
on the `audio-tools-engine` branch.

## Where things stand

| Track | Status |
|---|---|
| **Cable Lab connector imagery** | ✅ COMPLETE — 48/48 mapped in `src/screens/lab/cable/connectorImages.ts`; XLR has a MALE/FEMALE/CABLE gallery (`CONNECTOR_IMAGE_GALLERIES`) |
| **Tier 1+2 new lab images (23)** | 🔄 IN PRODUCTION at ChatGPT — prompts: `docs/art/APE_LAB_IMAGES_TIER1-2_2026_08_16.md` (Stage 1 = 12, Stage 2 = 11); reference-search companion: `docs/art/APE_LAB_IMAGES_TIER1-2_REFERENCE_SEARCH_2026_08_16.md` |
| **List A — wire EXISTING photos into labs** | ⏸️ NOT STARTED — awaits the owner's explicit go (details below) |
| **Tier 3 images** | ⏸️ SHELVED to post-launch (owner ruling 2026-08-16) |
| **Binaural dummy-head check** | ❓ open — see below |

## The ratified return-protocol (precedent: the 48-connector set)

1. **Receive**: owner drops files in a folder (previously
   `C:\Users\profe\OneDrive\Documents\Claude\Projects\AUDIO APP\new images aug 16`)
   and may ask for renames to the exact kebab-case filenames from the prompt
   package. Watch for byte-identical `-2` duplicates (md5-check before deleting;
   confirm intent with the owner).
2. **Face-verify** every image against its **"must show"** line in the prompt
   package (contact counts, locking features, colors are verified facts — an
   image that gets one wrong teaches the wrong thing). Identification is
   confirmed WITH the owner image-by-image; never assume a match.
3. **Upload**: owner uploads to the public Supabase `glossary-images` bucket.
   `.png` is an accepted fallback when webp conversion isn't available — code
   must match the actual extension.
4. **Probe**: HTTP-200 check EVERY url
   (`${SUPABASE_URL}/storage/v1/object/public/glossary-images/<file>`) before
   mapping. Bucket LISTING is RLS-blocked — enumerate nothing; the inventory
   truth is the rename manifest
   (`audio_app_archive/ape_glossary_media_rename_2026_07_16.json`, 139 term
   images) plus probes.
5. **Wire**: per-lab map file following the `connectorImages.ts` pattern
   (id → filename; unmapped renders NOTHING — never a placeholder, per standing
   governance). Multi-view galleries follow `CONNECTOR_IMAGE_GALLERIES`.
6. **Verify + ship**: `node node_modules/typescript/bin/tsc --noEmit`, web
   bundle mounts clean, commit + push (`audio-tools-engine`).

House image style (all prompts already carry it): photoreal product photo,
seamless pure-white background, soft studio light + contact shadow,
three-quarter angle, square 1240×1240, unbranded, no text.

## Expected Tier 1+2 filenames (probe list)

Stage 1: `dynamic-microphone` `ribbon-microphone` `small-diaphragm-condenser`
`electret-capsule` `line-array` `subwoofer` `crossover` `acoustic-foam`
`fiberglass-panel` `bass-trap` `bass-guitar` `modular-synth`
Stage 2: `mixing-console` `mic-preamp` `compressor` `parametric-eq` `dac`
`noise-gate` `limiter` `reverb-unit` `delay-unit` `modulation-fx`
`distortion-unit`
(all `.webp` preferred, `.png` accepted; exact specs + "must show" lines in the
prompt package)

## Where the Tier 1+2 images get WIRED (from the survey)

- Mics (4) → Mic Selection lab type cards (`src/screens/lab/micselect/` — the
  12 types are in `micSelectData.ts`; currently code-drawn `MicArt`)
- line-array / subwoofer → Speaker Coverage + Wave labs
- crossover → Speaker lab (2/3-way teaching)
- treatment (3) → Wave lab absorption/diffusion modules
- bass-guitar → Bass lab; modular-synth → Modular lab
- Outboard (11) → Gain lab device cards, EQ lab (parametric side), Digital lab
  (DAC), FX labs (comp/gate/limiter/reverb/delay/mod/distortion heroes)
The survey findings with file:line anchors are in the 2026-08-16 session
transcript; re-locate with grep when wiring each lab.

## List A — surface EXISTING photos into labs (owner's go required)

~30 photos already in the bucket are absent from the labs (zero production
cost, pure wiring): MicSelect's 8 already-photographed mic types
(large-diaphragm, lavalier, headworn/headset, shotgun, boundary, measurement,
contact, handheld), Mic Principles accessories (shock-mount, pop-filter,
windscreen, mic-stand), signal-chain (fader, pot, graphic-equalizer, vu-meter,
oscilloscope, audio-interface), speakers (two-way, three-way, woofer, tweeter,
horn-tweeter), tools (measurement-microphone, spl-meter, turntable, dosimeter,
multimeter), vacuum-tube. Do NOT start without the owner's explicit go.

## Open items

- **Binaural check**: is `binaural-mic.webp` a dummy head (manikin) or an
  in-ear pair? If pair → a manikin photo is a high-value NEW item (Binaural
  lab). Ask the owner / view the image.
- **Tier 3 (post-launch)**: sound-level calibrator, balloon impulse source,
  power amplifier, strobe, tachometer marker, vibration analyzer, blimp
  windshield, FM synth, function generator, stage drapes.
- **Owner creative forks left at defaults** (flagged in the prompt package):
  crossover = passive network (vs active rack), console = compact desk (vs
  channel strip), delay = rack (vs pedal), modulation/distortion = pedal.

## Standing behavioral rules (memory: check-rules-before-acting,
verify-before-claiming-done)

- "Give me specs/prompts/a plan" = PROPOSE AND WAIT. Approval is per-action.
- Creative/identity decisions are the OWNER's.
- Never claim done/working/approved without genuine verification; approval is
  the owner's word, not the assistant's.
- Terminal work anchors to `C:\Users\profe\dev\ape-studio`; hand the owner
  complete absolute paths; step-lists as location-tagged tables.
