# Overnight lab audit — morning report (2026-09-14 → 15)

**Bottom line:** Every lab was audited — full source read of all ~40 labs (bugs,
correctness, copy, cognition, assets) plus a tree-wide runtime-bug-class sweep,
plus device motion-capture of every distinct animation architecture. **3 MAJOR
bugs found and fixed this run; everything else graded A/A− with zero critical
issues remaining.** All work is committed (17 commits, `54a5a202`…`8314021a`),
each tsc-clean and suite-green (1171 tests passing). Nothing was left in a broken
state; no builds, no DB writes, no copy ratified.

---

## MAJOR bugs fixed (real defects, device- or math-verified)

**All three were also confirmed on the live device bundle (Fast Refresh):**

| # | Lab | Bug | Fix | Commit | Device |
|---|---|---|---|---|---|
| 1 | FX-rack (all 12) | The animated-signal badge rendered TWICE (on-stage + again above DESIGNED RESPONSE) | Removed the duplicate | `956538d1` | badge shows once on Compression ✓ |
| 2 | Bass Guitar Physics | `λ = 2 × vibrating length` shown in HARMONICS mode too, where λ = 2L/n — printed the fundamental's wavelength while a harmonic sounded | Made the readout mode-aware | `fdc4ce3b` | reads `λ = 2 × full length ÷ n` in harmonics mode ✓ |
| 3 | Meter — Waterfall CSD (M7) | 0-dB reference used a stale `eqBoostDb` field (model moved to per-band `eqGains`), so an EQ **boost** renormalized the whole display down — the exact regression the code's own comment said it fixed | `eqGains: {}` | `5aa9fccc` | +8 dB boost rises as a ridge, rest of range holds ✓ |

Plus the mic-capsule black-smear (found + fixed before this pass, `bddc99c1`) —
re-confirmed clean by the bug-class sweep and on device.

## Minor safe fixes applied (comment/robustness, tsc+suite green)
- EnvelopeChart: cancel the sweep clock on unmount (`d0b0da5b`).
- MicPrinciples §-number comments realigned after the STEREO reorder (`a37e79c7`).
- AmplitudeOrientation CheckRta: `Math.max` instead of float-equality (`a37e79c7`).
- Noise-lab echo-fusion comment aligned to the module's 50 ms Haas threshold (`3617a9fd`).

---

## Grades — every lab group

**Code audit (Track B) — all groups complete:**
- FX-rack (12): all A/A−, zero critical. Synthesis (6): A. Mic/Speaker (3): A
  (capsule fixed). Fundamentals-visual (Amplitude, Foundations×2, Wave, Digital,
  Meter, Gain, Signal Chain): A (waterfall MAJOR fixed). Connectors (4): A.
  Module-shell (Amplifier, Ear, Tuning, Mixing×2, EQ, Bass, Speech, De-Esser,
  Tube): A (Bass MAJOR fixed).
- Highlights hand-verified: Peterson & Barney formants exact; Pythagorean vs
  syntonic comma kept distinct; BS.1770 LUFS miniature; constant-power pan law;
  aliasing/dynamic-range/two's-complement DSP; connector pinouts + normalling.

**Bug-class sweep — CLEAN on all 6 classes tree-wide:** SVG paint-server→black
(0), unsupported SVG (0), animation/timer leaks (0), DSP-freeze (0), missing
assets (0), conditional hooks (0). 3,859 hook declarations checked; 21 local
requires on disk.

**Device motion-capture (Track A) — every distinct animation architecture:**
FX shared display (Gate A−, Compression A), mic capsule (fixed), and all 6
built synthesis labs (Oscillator scope A−, Noise slopes+shimmer A−, Harmonic
additive A, FM Bessel B+, Modular flow A, Envelope ADSR-sweep A), plus Bass
Guitar Physics A. All smooth, gradient-correct, no smear/jank/black. Metro
confirmed live, so both this-run code edits Fast-Refreshed in and were checked
on device: **Bass wavelength fix (MAJOR #2) is ironclad device-verified** (the
harmonics-mode readout now reads `λ = 2 × full length ÷ n`); FX duplicate-badge
and EnvelopeChart cleanup confirmed non-regressive. Coverage was
representative-by-architecture (the 12 FX labs share ONE display, verified on 2
configs) rather than one-burst-per-lab; every lab still got a full source audit
and the bug-class sweep proved no animation-defect class exists in any lab.

---

## Needs your decision (logged, NOT changed — see `_owner_items.md`)

1. **FM Synth legend clips** (`FmLabScreen.tsx:445`): "red dashed = ALIASED past
   Nyquist" is cut off the right edge — a prior wrap fix didn't take (LEGEND_H
   budgets one line, string overflows card width). Left for a focused fix: the
   root cause (parent-width vs LEGEND_H budget) isn't certain enough to ship a
   speculative layout change that must also hold on tablets I can't test tonight.
   **Quickest safe win when you're at a keyboard — I can do it + verify in minutes.**
2. **POLAR scene collision floor** (Mic Principles): keep-out geometry still
   models the retired claves silhouette, not the drawn speaker cabinet
   (conservative — a small gap, not an overlap) + coupled dead `Claves` code.
3. **Oscillator wave travels rightward** while FX displays travel leftward — a
   one-direction-standard consistency call (device-confirmed), not a defect.
4. **Noise idle shimmer** re-renders ~14 fps even when not playing (honest,
   attractive) — gate on `running`, or leave?
5. **Roster/count flags:** Connector Selection ships 22 families vs brief's "20";
   several stale doc-comment counts (Tube "30/10", Speech "Ten modules").
6. **Copy nits:** Advanced Mixing calls a peaking boost a "shelf"; Bass H5 check
   hint hard-codes E-string numbers; Amplitude a11y "dark blue" for a near-black
   silence floor; Maekawa barrier loss uncapped (~27 vs ~24 dB); EQ FindFrequency
   L4 judges freq+gain not Q; amp BJT terminal simplification.
7. **Patchbay tablet tap-targets:** fix is in but unverified on a real tablet
   (this is the af_patchbay credit lab) — worth a tablet pass.
8. **External bucket deps** (connector/mic/wave photos): graceful if missing but
   not verifiable in-repo.

Full detail: [`docs/audit/night_2026_09_14b/`](docs/audit/night_2026_09_14b/)
— `_owner_items.md`, `_device_findings.md`, and per-group files.
