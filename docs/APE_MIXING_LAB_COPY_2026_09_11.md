# Beginning Mixing Lab — copy sheet

**Status: ⏳ PENDING OWNER RATIFICATION** (built overnight 2026-09-11 on the
owner's GO; expert design + cognition passes applied). All copy is NEW. Any
copy change re-opens here first once ratified.

Full text lives in the source (single source of truth):
- `src/screens/lab/mixing/pagesA.tsx` (pages 1–4) · `pagesB.tsx` (5–7)
- `src/screens/lab/mixing/pagesC.tsx` (8–12: EQ, compression, space, the six
  terms, pre/post) · `pagesD.tsx` (13–16: automation, finishing, export, final)
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

## Deferred owner decisions (worked around, not blocking)

- **Ratification of this sheet** (all copy new).
- **Device pass** of the full 15-page lab.
- **Catalog placement fine-tuning**: Mixing category currently leads the
  TRAINING section, member-only (the approved recommendation) — reorder at
  will.
- **Real stems**: the session is honest synthesis; the swap-in manifest is
  `docs/APE_MIXING_LAB_ASSETS_2026_09_11.md`.
- **Advanced Mixing Lab**: prerequisite gate (soft, device-local, with a
  knowledge-check skip) to be wired when AML ships.
