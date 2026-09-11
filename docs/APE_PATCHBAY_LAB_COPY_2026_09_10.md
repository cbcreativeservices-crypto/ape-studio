# Patchbay Signal Flow & Normalling — copy sheet (RATIFIED)

**Status: ✅ RATIFIED BY THE OWNER 2026-09-10 — approved as written.** Both
phases built + device-passed 2026-09-10 (23 pages). The lab is live in the
catalog (Signal category, member-only). This sheet is now the copy of record:
any future copy change to this lab re-opens ratification here first.

Full text lives in the source (single source of truth):
- `src/screens/lab/patchbay/pagesA.tsx` (pages 1–7)
- `src/screens/lab/patchbay/pagesB.tsx` (pages 8–13)
- `src/screens/lab/patchbay/pagesC.tsx` (pages 14–18) · `pagesD.tsx` (pages 19–23)
- `src/screens/lab/patchbay/engine/scenarios.ts` (predict + detective prose)
- `src/screens/lab/patchbay/engine/scenariosB.ts` (studio bay, service calls, design rows, assessment)
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

## Phase B — BUILT 2026-09-10 (owner go after the Phase A device pass)

Pages 14–23: the 8-pair studio bay (`engine/scenariosB.ts STUDIO_PAIRS` —
processors 07/08 deliberately THRU) · zero-front-cables + the invisible-normals
reveal · overpatching (NORMAL PATH / OVERPATCH) · the processor insert & bypass
chain · four "what's wrong with this patch" service calls (incl. the
feedback-loop warning — the loop case renders a LIVE normal, machine-verified) ·
the half-normalled-TOP variant with the parallel-merge demo · T·R·S conductor
reveal on the cutaway · phantom-power safety · design-your-own bay (6 rows,
multi-acceptable with tradeoff notes) · the 10-item proficiency assessment.

### Phase B load-bearing sentences (review with the Phase A set)

7. **The zero-cables statement** (page 15): *"A properly designed normalled
   patchbay runs its standard signal path with ZERO front-panel cables."*
8. **The processor rule** (pages 14/17/18/22): a processor's output is never
   normalled toward its own input — processor pairs are wired THRU (feedback
   loop with zero cables otherwise). Machine-guarded in the test suite.
9. **Overpatch vocabulary** (page 16): NORMAL PATH = the automatic connection;
   OVERPATCH = a cord that changes it.
10. **The phantom framing** (page 21): five cautions per Neutrik guidance;
    deliberately NOT "never patch mics" — "requires proper system design."
11. **The directional caveat, taught live** (page 19): a genuine top-breaking
    bay incl. the bottom parallel-merge; "verify before a session depends on it."

## Open owner decisions

- **Fundamentals credit**: the catalog leaf ships WITHOUT an `af_*` key (that
  key list is immutable / backend-bridged). Decide whether Patchbay should join
  the Audio Fundamentals lab-credit set — needs a backend key addition.
