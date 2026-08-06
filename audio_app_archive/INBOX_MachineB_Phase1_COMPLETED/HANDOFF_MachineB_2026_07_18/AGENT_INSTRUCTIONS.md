# AP&E Glossary — Machine B — AGENT INSTRUCTIONS (reconstructed 2026-07-19)

You are authoring/reviewing reference content for an app that CERTIFIES student technicians for
real studio and live-sound access. Inaccurate content can cause equipment damage, injury, or death.
Author to a standard a professional educator AND a safety officer would both sign off on.

## THE NON-NEGOTIABLE RULES

### 1. STRICT SOURCING (the #1 priority)
Every fact, value, spec, standard, and model number must be cross-confirmed against **≥2
authoritative sources** (**≥3 for anything safety-critical or contested**). An acceptable source is
ONLY one of:
  (a) a **standards body** — AES, NEC/NFPA 70, NFPA 70E, OSHA 29 CFR 1910/1926, ANSI/ESTA E1,
      IPC/J-STD, IEC, IEEE, SMPTE/EBU, ITU-R, MIDI Association; or
  (b) a **manufacturer's TECHNICAL documentation** — datasheets, service/technical manuals,
      application/engineering notes, reference guides (NOT marketing/sales/product pages); or
  (c) a **recognised professional text** — Ballou *Handbook for Sound Engineers*; Huber & Runstein
      *Modern Recording Techniques*; Owsinski handbooks; Yamaha *Sound Reinforcement Handbook*;
      McCarthy *Sound Systems*; Rane technical notes; Fletcher & Rossing *Physics of Musical
      Instruments*; Adler/Piston orchestration; Grove *Dictionary of Music*; Audsley (organ);
      Baines (winds); AES papers; ASA publications; or equivalent.

**Wikipedia, Reddit, forums, Quora, hobbyist/enthusiast sites, blogs, Sound-on-Sound forum posts,
SEO or AI-generated content, and vendor marketing/sales/product pages DO NOT count** toward the ≥2
and must NEVER be used as corroboration — they may serve only as an initial pointer to a real source.
Never put a citation inside field text; sources go in the `sources` array only.

### 2. NO HALLUCINATION, FLAG DON'T GUESS
If you cannot confirm a fact to professional standard after a genuine literature search, LEAVE THAT
FIELD BLANK (omit it from `fields`), add a note to `flags`, and set `confidence:"FLAG-FOR-REVIEW"`.
A blank flagged field is correct; a confident wrong answer is a failure. BUT exhaust the professional
texts first — organology/orchestration terms are usually covered even when manufacturer docs are
silent. Define the canonical sense even under a mismatched topic. **Transparent compound descriptors**
(e.g. "Choir compression", "Bass automation", "Object divergence") → author at **Medium** confidence;
do NOT flag them.

### 3. SAFETY = HIGHEST BAR
For anything touching mains voltage, current, grounding/bonding, soldering irons/fumes/lead, solvents,
batteries, rigging, ladders, fall protection, or hearing exposure: state established standards-based
practice ONLY (NEC/NFPA 70, NFPA 70E, OSHA 1910/1926, ANSI/ESTA E1, IPC, IEC, IEEE, manufacturer
safety docs). Never present an unsafe shortcut or folklore as correct. Dangerous common practices go
in `common_mistakes`, clearly prefixed **"UNSAFE:"**.

### 4. READING LEVEL
Every `plain_english` field must read at ~age 14: **Flesch–Kincaid grade ≤9 (aim 7–8)** — short
sentences, everyday words, an accurate everyday analogy where it helps. `definition` and ALL other
fields stay fully technical. Verify with Python `textstat.flesch_kincaid_grade(text)`.

### 5. MECHANICS
- Author ONLY each term's `empty_fields`. A `definition` of `"(pending)"` or `"(definition pending)"`
  counts as EMPTY → author it. Never touch/rewrite/"improve" a field not in `empty_fields`.
- NEVER alter `id`, `term`, `topic`, or `difficulty` (structural fields).
- Respect disambiguated senses: a parenthetical (e.g. "Compression (data)") means define ONLY that sense.
- Write ONE canonical definition per term (terms are shared across topics).
- List fields (`related_terms`, `common_mistakes`, `scenario_contexts`) MUST be JSON arrays of strings.
- No placeholder text anywhere — no "(pending)", "TBD", "important concept in audio", etc.

## FIELD SPECS (author only if in empty_fields)
- **definition**: precise, technically correct, self-contained. 1–3 sentences.
- **plain_english**: same idea for a beginner; minimal jargon; accurate everyday analogy welcome. 1–2 sentences. FK≤9.
- **purpose_function**: what it does and WHY it exists in a system. 1–2 sentences.
- **practical_application**: how a technician actually uses/encounters it on the job. 1–2 sentences.
- **category**: short grouping label, 1–4 words; match sibling terms in the same topic where one exists.
- **related_terms**: LIST of 3–6 other glossary terms a student should know alongside this one.
- **common_mistakes**: LIST of 2–4 real student errors/misconceptions; prefix safety ones "UNSAFE:".
- **scenario_contexts**: LIST of 2–4 concrete real-world situations where the term applies.

## AUTHORING OUTPUT CONTRACT — write exactly ONE JSON file
```json
{ "batch": <n>, "topic": "<topic>",
  "authored": [
    { "id": "<uuid unchanged>", "term": "<term unchanged>",
      "fields": { "<only keys from empty_fields you confirmed>": "<string, or ARRAY for the 3 list fields>" },
      "sources": ["<authoritative source 1>", "<authoritative source 2>"],
      "confidence": "High" | "Medium" | "FLAG-FOR-REVIEW",
      "flags": ["<any field left blank + why>"] } ] }
```
One entry per packet term, ids/terms exact. Validate the JSON parses before finishing. Then run
`cd /home/claude/apne && python3 verify.py mb0NNN` — it must pass with 0 errors.

## COMMITTEE (Step 2) — see briefs/BRIEF_COMMON.md + role briefs
3 independent experts (Audio Technical, Learning/Cognition, Language/Communications) review every
authored term. Bias to OK (~90–98% OK is healthy). Audio expert MUST web-verify any Medium/High claim
before raising it. One review object per term; RAISED BAR v2 severity; no house-style nitpicking.

## CORRECTIONS (Step 3)
Apply every committee suggestion that is a genuine fix (web-verify technical ones before writing);
decline pure style/preference and log the reason. Change only flagged fields, preserve types/id/term,
keep plain_english FK≤9. Do not introduce a new error while fixing one.
