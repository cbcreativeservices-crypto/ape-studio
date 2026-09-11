# Patchbay Signal Flow & Normalling — Phase A copy sheet (owner ratification)

**Status: ALL COPY NEW — pending owner ratification.** Built 2026-09-10 from the
owner's lab brief. The lab is live in the catalog (Signal category, member-only)
so it can be device-tested; ratify or edit here, and I'll fold changes back.

Full text lives in the source (single source of truth):
- `src/screens/lab/patchbay/pagesA.tsx` (pages 1–7)
- `src/screens/lab/patchbay/pagesB.tsx` (pages 8–13)
- `src/screens/lab/patchbay/engine/scenarios.ts` (predict + detective prose)
- `src/screens/lab/patchbay/art/PatchPairView.tsx` / `JackCutaway.tsx` (status lines, a11y)
- `src/screens/lab/patchbay/bits.tsx` (the mantra)

## The load-bearing sentences (review these first)

1. **The mantra** (repeats on pages 1, 10, 13):
   > Top is the source. Bottom is the destination. A normal is the path that
   > exists when you do nothing. Patching changes that path.
2. **The normal definition** (page 4):
   > Normal means there is already a connection before you plug in a patch cable.
   > A normal is the patchbay saying: "If the engineer does nothing, I will
   > connect this source to this destination."
3. **The direction mnemonic** (page 1): *Signal falls downhill. Top → Bottom.*
4. **The contact claim** (page 5): a normal is a spring contact the plug
   physically moves — "It isn't magic and it isn't a menu setting. A switch
   opened." X-ray threshold is labeled a CONCEPTUAL MODEL (opens at 60% in the
   teaching model; real jacks vary by design).
5. **The half-normal caveat** (page 8 check explain): half-normal is
   *directional* — the common bay taps on top and breaks on bottom, but
   top-breaking bays exist; "always verify a bay rather than assume."
   (Phase B teaches the variant fully.)
6. **Vocabulary choice** (page 3): "Thru" is used over "isolated" (some
   manufacturers give "isolated" more specific meanings). Synonyms taught:
   through / non-normalled; tap · mult · split · monitor · parallel feed.

## Teaching claims → engine truth

Every routing statement, every predict answer, and every detective verdict is
derived from `engine/patchbay.ts` and pinned by `test/patchbayEngine.test.ts`
(31 assertions: the full Full/Half(bottom & top)/Thru × plug-state truth table,
plus proof that each authored exercise matches the engine). Copy edits that
contradict the electronics will fail the suite.

## Cited sources (named on page 13)

- Neutrik patch-panel documentation — normalling definitions; Half Normalled
  Bottom / Top variants.
- Bittree — half-normal tap (second destination while maintaining the path).
- ART / Behringer patchbay manuals — source-above / destination-below layout.
- Samson — Normal / Half-Normal / Thru product labeling.

## Phase B (not yet built — owner's go after the Phase A pass)

Studio bay (8 pairs) · zero-front-cables studio + overpatching · processor
insert & bypass · what's-wrong-with-this-patch (incl. the ART feedback-loop
warning) · X-ray insertion depths · half-normalled-top variant · balanced
conductors (T/R/S) · phantom-power safety (per Neutrik guidance; no blanket
"never patch mics" claim) · design-your-own bay · 10–12 scenario assessment.

## Open owner decisions

- **Fundamentals credit**: the catalog leaf ships WITHOUT an `af_*` key (that
  key list is immutable / backend-bridged). Decide whether Patchbay should join
  the Audio Fundamentals lab-credit set — needs a backend key addition.
- Ratify / edit the copy above, then flip this sheet's status line.
