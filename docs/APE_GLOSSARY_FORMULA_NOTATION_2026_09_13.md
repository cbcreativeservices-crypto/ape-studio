# Equations & Formulas — the filter is alive, and its content has never been proof-read

Device-checked 2026-09-13, the day `glossary_browse_v` went live.

## What changed

No client role holds a column grant on `glossary.formula_symbolic` /
`formula_words`, so the direct select has always 403'd. `loadAllGlossaryFormulas`
isolated that failure on purpose (a non-fatal pass, so a missing grant could
never break the corpus load) — and the consequence was that the **Equations &
Formulas filter has shown 0 terms since the day it was built** (user request
2026-07-26). The code comment still recorded the 2026-07-26 measurement: "0 of
14,246 rows currently carry one."

The browse view reads those columns as its owner, so the filter now resolves
**1,911 terms**. Verified on the Pixel: the picker reads "∑ Equations & Formulas
— 1911", the list header "1911 results", and each row renders the symbolic
formula in mono blue with the plain-language reading beneath it.

## ⚠️ 219 of 1,911 formulas (11.5%) render as MARKUP, not as maths

Nobody has been able to see this content in situ, so nobody has caught it.
Measured on the live table, not sampled:

| Notation found in `formula_symbolic` | Count |
|---|---|
| ASCII underscore subscripts (`p_0`, `l_j`) | 1,033 |
| `^` superscripts (`f^a`) | 448 |
| Greek spelled as words (`Gamma_a`, `lambda`) | 347 |
| Real Greek glyphs (`λ`, `ω`) | 234 |
| Unicode subscripts (`X₀`, `log₁₀`) | 136 |
| **LaTeX braces** (`z_{j,c}`, `Z_{0}`) | **124** |
| **Raw LaTeX backslashes** (`\rho`, `\approx`, `\mathrm`) | **61** |
| **Union that reads as markup (`\` or `{`)** | **219 (11.5%)** |

The field is rendered as plain text, so those 219 show their markup verbatim.
Confirmed on screen rather than inferred — "Conductor Resistance" displays:

```
R = \rho \ell / A
```

Other live examples: `p_0 = 20\ \mu\mathrm{Pa}` · `SNR_Q \approx 6.02\,B + 1.76\
\mathrm{dB}` · `I = \langle p(t)\,u(t) \rangle` · `Z_{0} = \rho c`.

At least four conventions are mixed in one alphabetical list — a reader
scrolling sees `L = 10·log₁₀(X/X₀)` immediately after `l_j = -0.691 +
10*log10( sum_c G_c * z_{j,c} )`.

## The options, in the order I'd weigh them

1. **Normalise the data to one plain-text convention.** A pass over 219 rows
   (or all 1,911 for consistency) turning LaTeX into the ASCII/Unicode style the
   other 1,692 already use. No code change; the filter is then correct
   everywhere it appears.
2. **Render the LaTeX.** Honest to the source, but it needs a formula renderer
   in a React Native list of 1,911 rows — real work, and the other 1,692 rows
   are not LaTeX, so they would need converting anyway. This is the expensive
   option, not the cheap one.
3. **Strip markup at render time.** A display-only transform (`\rho` → `ρ`,
   `\approx` → `≈`, drop `\mathrm{}`/`\,`/`\ `). Cheap, reversible, and it
   leaves the data untouched — but it is a lossy guess at intent, and a
   half-translated formula is worse than an obviously raw one.

⚠️ **This is content, not code — the call is the owner's.** The formulas are
technical claims; silently rewriting 219 of them is a governance matter, not a
tidy-up. Nothing here is applied.

## Not a defect, worth knowing

`formula_symbolic` / `formula_words` are NOT masked for non-members in
`glossary_browse_v`. That matches the standing ruling: the Equations & Formulas
list is "DELIBERATELY NOT member-gated — a cross-topic reference list of
free-value content" (user request 2026-07-26, comment in `GlossaryScreen.tsx`).
So after the revokes, any device key can read all 1,911 formulas. Deliberate.
