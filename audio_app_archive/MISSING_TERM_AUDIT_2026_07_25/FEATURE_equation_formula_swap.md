# Feature: Equation Formula — Symbolic ⇄ Worded Click-Swap

**Requested by Prof. Booth, 2026-07-25 (with Phase 50 audio equations).**

## Summary
Every equation entry in the glossary shows its formula **beautifully typeset** and stores **two forms**:
1. **Symbolic** — the normal formula, e.g. `E = mc²`, rendered large via **MathJax/LaTeX**.
2. **Worded** — the same formula fully spelled out in words, e.g. `Energy = Mass × SpeedOfLight²`.

## Interaction
- The **symbolic** form displays **large**; the **worded** form displays **small in the lower-right corner**.
- **Tapping/clicking the card swaps them**: the worded form becomes large and the symbols shrink to the corner.
- Tapping again swaps back. (One-tap toggle; state per card.)
- A working demo is in `APE_Phase50_Equations.html` (this folder).

## Data model impact
Each equation term needs two stored strings beyond the standard 8 content fields:
- `formula_symbolic` (text; the exact formula — also the LaTeX/MathJax source in production)
- `formula_words` (text; the spelled-out version + a symbol legend)

Recommended DB approach: add `formula_symbolic` and `formula_words` columns to `glossary` (nullable; populated only for equation terms), **or** a small `glossary_formulas` table keyed by `glossary_id`. A boolean/`has_formula` flag lets the client decide when to render the swap card.

## Authoring note (already embedded in every Phase-50 packet)
Machine B must verify the symbolic formula, rewrite the auto-generated `formula_words` into a clean fully-worded form, supply a per-symbol legend, and author the 8 standard fields (definition = what it computes + when to use it; practical_application = worked numeric example with units). Sources: OpenStax, NIST, OSHA 29 CFR 1910.95, recognised texts — not blogs.

## Status
196 equations staged in the Computer B package (v9), packets `eq_A`…`eq_S`, each with `formula_symbolic` + auto `formula_words` + this feature note. Rendering (MathJax) and the DB columns are **noted, not yet built** — pending Booth's go-ahead on the schema choice.
