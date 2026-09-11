# Mixing Labs (Beginning + Advanced) — copy sheet

**Status: ⏳ PENDING OWNER RATIFICATION** (both labs built overnight
2026-09-11 on the owner's GO; TWO rounds of expert design + cognition passes
applied — the round-2 cognition agent measured every audio claim against the
running engine). All copy is NEW. Any copy change re-opens here first once
ratified.

Full text lives in the source (single source of truth):
- Beginning (16 pages): `src/screens/lab/mixing/pagesA.tsx` (1–4) ·
  `pagesB.tsx` (5–7) · `pagesC.tsx` (8–12) · `pagesD.tsx` (13–16)
- Advanced (20 pages): `pagesAdvA.tsx` (gate–aux) · `pagesAdvB.tsx`
  (parallel–depth) · `pagesAdvC.tsx` (harmonic–mix bus) · `pagesAdvD.tsx`
  (translation–final repair)
- `src/screens/lab/mixing/kit.tsx` (the mantra, console strings, player notes)
- `src/screens/lab/mixing/engine/mixModel.ts` + `engine/routing.ts`
  (dimension/track/term definitions the pages print)

## The load-bearing sentences (review these first)

1. **The mantra** (page 1, header subtitle, repeated): *"Mixing is a sequence
   of listening decisions used to create balance, clarity, depth, movement,
   and emotional focus."* (owner brief, verbatim)
2. **The five dimensions** (page 1): Balance — what is louder or softer? ·
   Frequency — which sounds occupy each range? · Pan & width — where does each
   sound appear? · Depth — what sounds close, distant, dry, or reverberant? ·
   Movement — how does the mix change from section to section?
3. **The focal-point rule** (page 1): "There is no single correct choice — a
   mix fails only when nobody made one." (subjective decisions have no single
   right answer — brief requirement)
4. **The jobs separation** (page 2): recording captures · editing repairs ·
   producing decides what exists · mixing balances what exists · mastering
   finishes the finished mix.
5. **The channel path** (page 3): Source → clip gain → inserts → fader/pan →
   sends → bus/subgroup → mix bus → output.
6. **The level-match rule** (page 4 + every A/B): "Every comparison in this
   lab that changes loudness is level-matched by measured RMS before you
   judge it. Hold this rule for life."
7. **Faders first** (page 5): "If a mix cannot stand on those four
   [fader/pan/mute/polarity], no processor will save it."
8. **The honest correction** (page 6, brief requirement): "Subtractive EQ is
   NOT automatically better than additive EQ… identify the actual problem
   first, then make the SMALLEST change that solves it."
9. **The six routing terms** (page 11, from `PATH_TRUTHS` — machine-checked):
   bus carries · subgroup sums · aux sends a COPY · control group links
   controls only · VCA/DCA controls gain without summing audio · stem is a
   rendered FILE, not another name for a bus.
10. **Attack honesty** (page 9): which way the transient moves is
    detector-specific; the pinned claim is "attack changes the ENVELOPE, not
    how loud it is" (rms matched, peaks differ — test-enforced).
11. **Contrast over ceiling** (page 12): "If the ceiling stops the chorus
    from rising, lower the floor."
12. **Synth-session honesty** (pages 5/15): "LEAD and BGV are synth stand-ins
    for the vocal parts of this session — real stems swap in identically."

## Teaching claims → engine truth

Routing-term properties, the channel-path order checker, pre/post-fader and
VCA behaviour, masking overlaps, gain arithmetic, the compressor-attack
envelope claim, the shared-reverb energy claim and the automation ride are
all executable in `engine/` + `audio/` and pinned by
`test/mixingEngine.test.ts` (25 assertions). Copy that contradicts the
console fails the suite.

## Advanced-lab load-bearing sentences (additional)

13. **The boundary rule** (AML gate): Beginning = "can you make a clear,
    balanced stereo mix?" · Advanced = "can you manage, refine, troubleshoot
    and DELIVER a complex one?"
14. **Glue, defined by audio** (AML p4): a compressor across a summed kit
    shares ONE envelope — "the kick's hit pulls the hat down with it"; per-
    track clones "controlled, but never glued". (Rendered, not asserted.)
15. **The parallel invoice** (p6): "Every parallel path is a level
    commitment" — dry PLUS wet raises the bus.
16. **Polarity is not delay** (p9): "no polarity flip un-delays a signal."
17. **Width's invoice** (p12): "Width added by side-scaling is energy mono
    cannot keep." Centre is the skeleton; width is jewellery.
18. **The mastering border** (p14): "The moment your bus chain chases a LUFS
    number, you have started mastering with a mix engineer's hands."
19. **Measurement honesty** (p15): LUFS/true-peak shown as BS.1770-STYLE
    ESTIMATES; "on normalized playback, platforms turn loud masters DOWN…
    what survives is the mix, not the number."
20. **The stem contract** (p17, measured live): linear stems null (≈ −163 dB
    residue); one nonlinear bus stage breaks reconstruction (≈ −27 dB).

## Deferred owner decisions (worked around, not blocking)

- **Ratification of this sheet** (all copy new, both labs).
- ~~Device pass~~ ✅ **DEVICE PASS DONE 2026-09-11** — owner passed both labs
  on device ("device pass all good on both").
- **Catalog placement fine-tuning**: Mixing category currently leads the
  TRAINING section, member-only (the approved recommendation) — reorder at
  will.
- **Real stems**: the session is honest synthesis; the swap-in manifest is
  `docs/APE_MIXING_LAB_ASSETS_2026_09_11.md`.
- **AML gate policy**: shipped SOFT (page order never blocked; only lab
  COMPLETION requires the gate goal, auto-met from a finished Beginning lab
  or by the three knowledge checks). Confirm or harden.
