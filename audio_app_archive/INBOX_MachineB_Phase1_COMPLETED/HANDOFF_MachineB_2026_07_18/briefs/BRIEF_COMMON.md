# AP&E Glossary — Full-Corpus Committee Review

You review glossary content for an app that CERTIFIES student technicians for real studio and
live-sound work (some content is electrical/rigging safety-critical). This is a fresh, independent
committee pass over the LAUNCH glossary (MUSI 190 + AUDI 201). Review the whole entry.

## WHAT TO REVIEW
Each term object has these fields — critique them per your expertise:
`definition`, `plain_english`, `purpose_function`, `practical_application`, `category`,
`related_terms` (list), `common_mistakes` (list), `scenario_contexts` (list). Each term also has
`difficulty` and `topics`.

## HOW TO REVIEW
- Judge each field against your area of expertise (see your role brief).
- Raise a suggestion ONLY where there is a concrete, actionable improvement. It is expected and
  correct that MANY terms are "OK — no changes." Do not manufacture issues or nitpick. Judgment
  quality matters more than volume.
- Be specific: name the field, state the issue plainly, give a concrete suggested change.
- Respect the term's `difficulty` and `topics`; respect disambiguated senses (parenthetical terms).
- Accuracy is paramount. If unsure a claim is wrong, flag it "verify" rather than asserting. The
  audio-technical reviewer should web-check any claim they doubt.

## SEVERITY
- High = factual/technical error, unsafe guidance, or something that would mislead a student.
- Medium = a real clarity/pedagogy/accuracy improvement worth making.
- Low = minor polish / style / consistency.

## OUTPUT — write exactly ONE JSON file (path given in your task)
{
 "expert": "<role>", "group": <n>,
 "reviews": [
   {"id":"<uuid>","term":"<term>","verdict":"OK|MINOR|NEEDS_REVISION",
    "suggestions":[{"field":"<field>","severity":"High|Medium|Low","issue":"<what>","suggestion":"<concrete fix>"}]}
 ]
}
- Fine terms: verdict "OK", empty suggestions array. Only include fields you actually have a fix for.
- Validate the JSON parses before finishing.

---
## RAISED BAR (v2 — applies to all remaining groups)
1. COVERAGE: output exactly one review object per term in the packet. Count the packet terms; your
   `reviews` array length MUST equal that count. No term skipped.
2. SEVERITY, strictly:
   - High = a factual/technical error, unsafe guidance, or an internal self-contradiction that would
     mislead a student. Nothing else is High.
   - Medium = a substantive accuracy, safety, or comprehension improvement a professional would
     actually make. Must be a real problem, not a preference.
   - Low = a genuine clarity/grammar problem (broken sentence, wrong word, real ambiguity, a
     duplicate list item, a mislabeled field). NOT a style preference.
3. DO NOT FLAG house style. The corpus uses a deliberate per-entry convention (first list item
   capitalized, rest lowercase; comma style; hyphenation). These are NOT errors — do not raise
   suggestions about list-item capitalization, serial/terminal punctuation, or hyphenation choices.
4. Bias to OK. If a change is optional, debatable, or cosmetic, leave the term OK. Most terms should
   be OK. Quality and correctness of the few flags you raise matter far more than quantity.
5. Every suggestion must name a concrete, defensible fix — not "consider revising."
