# Glossary as a Teaching Instrument — client-side audit

Night audit 2026-09-13 · report-only agent (pro-audio educator hat) · no code or DB changes made.
Scope: `src/screens/glossary/GlossaryScreen.tsx` (4,014 lines), `src/features/glossary/**`,
`src/features/study/sentences.ts` + `api.ts`, `src/features/lab/guidedLessons/content.ts`,
`src/features/notifications/curated/*`. Every claim carries file:line evidence. The database is
untouchable — content findings are OWNER items at the end.

---

## 0. What a term presents (the layer inventory)

An expanded term renders, in order (`TermDetails`, GlossaryScreen.tsx:610–820):

| Layer | Source | Gate |
|---|---|---|
| Hazard badge | `isHazardTerm` (line 677) | none |
| AUDIO … LABS action row | `getLearningProfile` client registry (line 659, learningProfiles.ts:298) | none — honesty rule: READY terms only |
| OPEN IN CALCULATOR | `calcLinkForTerm` derived from live WORKSPACES (line 656, calcGlossaryLinks.ts:29) | none |
| Definition / Plain English (order swaps with BEG/ADV) | corpus row + detail (lines 672–674) | 14/week meter for capped users |
| PURPOSE & APPLICATION | `purpose_function` + `practical_application` (line 729) | with detail fetch |
| SCENARIOS | `scenario_contexts` bullets (line 733) | with detail fetch |
| COMMON MISTAKES (DB) | `glossary_full_v.common_mistakes` (lines 743–760) | member-only; veiled tease otherwise |
| COMMON MISTAKES · {LAB} | lab lesson `commonMistakes`, client-bundled (lines 663–665, 767–772) | FREE for everyone |
| RELATED TERMS pills | `related_terms`, tappable when resolvable (lines 773–806) | none |
| Suggest a correction | `sendFeedback('correction', …)` (line 810) | none |

This is a genuinely layered teaching object, not a dictionary row. The machinery is the good news;
the findings below are about ordering, defaults, and gaps.

---

## 1. LAYER ORDER — does a novice meet the gentlest layer first?

**Finding: NO by default. The full technical definition is the forced first contact for a guest.**

- The BEG/ADV toggle state `ttsBeg` initializes `false` = ADV (GlossaryScreen.tsx:1131
  `const [ttsBeg, setTtsBeg] = useState(false);`), and the speak/text default is documented as
  "DEFAULT = the first official definition (ADV)" (lines 301–304). The preference persists
  (`TTS_MODE_KEY`, line 306, restored at 1726–1732) — but only after the user has found the toggle.
- The expanded row shows `ttsBeg ? item.plain_english || item.definition : item.definition`
  (line 2881); the popup does the same (line 3081). So a first-time guest's very first expanded term
  is the official technical wording; Plain English sits below the fold as the "PLAIN ENGLISH"
  detail section (line 673–674).
- The toggle itself is a 12 pt header chip reading "ADV" (lines 2448–2470). It shows the *current*
  mode, not the offer ("see plain English"), and nothing on a definition row hints that a plain
  version exists. Discovery paths are the help sheet ("Tap BEG or ADV…", line 2330) and the
  accessibility label — a novice who most needs BEG is the least likely to decode "ADV".
- The capped guest's real first contact is even harsher: the collapsed row clamps to a 2-line
  preview of the **technical** definition (line 2917–2922, `collapsedDefinitionLines`,
  collapsedLines.ts:25–34) — a truncated technical sentence, not a plain-English hook.
- GOOD: once BEG is on, the ordering is coherent everywhere — plain English on top, technical
  definition demoted to the first detail section (`begFirst`, lines 630–634, 672–674), and TTS reads
  the same layer it shows (line 303).

**Proposal L1 (S, client): default `ttsBeg` for a first-run/guest session to BEG** (only when no
stored `TTS_MODE_KEY`; members and anyone who has ever toggled keep their choice). One-line change
at GlossaryScreen.tsx:1131 + the restore effect. Highest learning-impact-per-line in this report.
*Counter-consideration for the owner:* `plain_english` falls back to `definition` when unauthored
(`item.plain_english || item.definition`), so BEG-default never shows a blank — it degrades to
today's behavior exactly where plain English is missing.

**Proposal L2 (S, client): make the toggle name the offer** — e.g. show "PLAIN" / "TECH" or a
two-state segmented chip, instead of a lone "ADV" that reads as a brand. Same Pressable, label-only.

---

## 2. CONNECTIVE TISSUE — how does a learner move between concepts?

**Finding: the connective tissue is systematic, not one-off — and it is the best-engineered part
of the screen.** Four distinct mechanisms:

1. **Inline cross-links** — longest-match segmentation over `definition`/`plain_english`
   (`buildTermIndex`/`linkSegments`, lines 361–425), computed once per corpus load (line 1898),
   with real linguistic care: acronym case guards (line 403), a generic-word stoplist so "source"
   doesn't link in prose (lines 356–359, 405), first-occurrence-only, ambiguity resolved by a
   "WHICH SENSE?" chooser (lines 3132–3156).
2. **Back-trail popup navigation** — every hop remembers its scroll offset and unwinds one hop per
   back tap (lines 1610–1707). Cross-link hops are FREE — they don't spend a weekly lookup
   (line 1634, owner 2026-09-10). This is exactly right pedagogically: exploration is not taxed.
3. **RELATED TERMS pills** — resolved via `linkIdsFor` (line 429), tappable when a glossary match
   exists (lines 779–790).
4. **Doors into practice** — the Decibel-style calculator link is NOT one-off: it is derived
   for every term any Calc workspace lists (calcGlossaryLinks.ts:29–43), styled purple on the row
   title (line 2779), split blue/purple inside prose (lines 504–534), and given an explicit
   "OPEN IN CALCULATOR · {workspace}" row (lines 702–712). Lab launches are the same pattern for
   ~250 terms across 29 labs (learningProfiles.ts:89–275).

**Where a learner still dead-ends:**

- **A `related_terms` entry with no glossary match renders as a plain, non-tappable pill**
  (lines 785–789, `styles.relatedPlain`) with no explanation. To a learner a gray pill next to blue
  pills reads as "broken", and there is no fallback (no search-for-it action). *Proposal C1 (S,
  client): tapping an unresolvable pill sets the search field to that phrase* (`setSearch(t)`,
  close popup) — the ranked search then finds near-misses ("wavelengths", "Wavelength (λ)"), and if
  nothing matches the empty state already offers "SUGGEST … AS A NEW TERM" (line 2694–2703). Turns
  every dead-end into either a hop or a content report.
- **Cross-links only exist where the exact phrase appears in prose.** frequency→wavelength happens
  only if a definition's text contains "wavelength"; the conceptual neighbor relation lives solely
  in DB `related_terms`. Whether that field is dense enough is a content question the client can't
  see (owner item O2).
- **Collapsed rows and card tiles have no links at all** (deliberate, line 2877–2878) — fine, the
  row tap owns them.
- Links can be globally hidden (`linksOn`, lines 1136, 2803–2818) but RELATED TERMS pills
  deliberately survive the toggle (line 649) — good call, the deliberate list stays navigable.

---

## 3. COMMON MISTAKES gating — honest teaser or confusing blank?

**Finding: an honest teaser, with two edges worth naming.**

- Non-members always see the section (owner 2026-07-29 "always shown", lines 737–742): a veiled
  x-substituted block preserving bullet shape (`veilText`, lines 601–603), a gradient fade, and the
  lock line "Common Mistakes are available in academy mode." (copy.ts:6). Crucially the veil is
  enciphered from a **client placeholder, never real content** (lines 605–608) — the server doesn't
  even send `common_mistakes` to non-academy roles (line 741), so nothing leaks. Marked
  `accessibilityElementsHidden` so screen readers aren't fed gibberish (line 749). This is a model
  implementation of tease-don't-leak.
- **Edge 1 — the tease can over-promise.** A member sees `mistakesText ?? '—'` (line 746): when a
  term has no stored mistakes, the paying member gets an em-dash where the free user was shown
  three veiled bullets promising "the mistake that trips up almost everyone." For any term without
  authored mistakes, the teaser advertises content that doesn't exist. Client can't know the count;
  coverage is owner item O1. *(If coverage is low, a client mitigation exists: gateway/full-view
  rows could carry a has-mistakes boolean and the veil render only when true — M effort, needs the
  owner's read on whether the universal tease is intentional marketing.)*
- **Edge 2 — the free lab mistakes partially undercut the sell, and that's GOOD.** Lab-taught terms
  show a real, ungated "COMMON MISTAKES · {LAB} LAB" section right under the veil (lines 761–772),
  honestly labeled by source. A free user on "RT60" reads 8 genuinely expert mistakes (content.ts
  reverb block) below a locked section — the free sample proves the paid one is real. Keep this.

---

## 4. SEARCH-AS-LEARNING — does a failed or partial search teach?

**What's GOOD (a lot):**
- Relevance ranking exact → prefix → word-prefix → substring with a 5-char substring floor so
  acronyms stay clean (`searchRank`, lines 332–350).
- Green match highlighting in term AND definition so the learner sees *why* a result matched
  (`highlightNodes`, lines 442–463; applied at 2782, 2887, 2921).
- The empty state coaches ("Try a shorter word or a different spelling", line 2691) and converts a
  genuinely missing term into a suggestion (`sendFeedback('term', …)`, lines 2694–2703 — tonight's
  suggest-a-term link).
- Dictation search when the native module is present (lines 87–96, 2533).

**The gap: a zero-result search offers no nearby terms.** `searchRank` is exact-substring only —
one typo ("phantom powre", "eqalizer") yields nothing, and the advice "try a different spelling"
puts the burden on the person who by definition doesn't know the spelling. The corpus is already
in memory (~22–27k terms), so this is purely client work.

*Proposal S1 (M, client): on zero results, show a "DID YOU MEAN" row of the 3–5 nearest terms* —
cheap candidate pass (same first letter or length ±3) then bounded edit-distance on
`term.toLowerCase()`; compute only in the empty branch (line 2686) so typing cost is zero. This is
the difference between a reference tool and a teacher: a learner's misspelling is itself a
teachable moment ("you wrote 'eqalizer' — Equalizer, Equalization, EQ").

*Proposal S2 (S, client): when a search lands 1–3 results, surface each result's `related_terms`
count or first pills inline* — optional; lower value than S1.

---

## 5. TIER HONESTY — is difficulty visible and useful?

**Finding: in the Glossary, tier is metadata only — fetched and deliberately never shown.**

- `difficulty` is selected in both detail fetches (lines 1532, 1942) and typed on `EntryDetail`
  (line 566) and the gateway row (glossaryGateway.ts:95), but the render comments it out:
  "difficulty (beg/int/adv) deliberately NOT shown" (line 800). That is a standing Booth ruling
  (mirrored in FlashcardsScreen.tsx:180, Booth 2026-07-08).
- Where tier IS a learner-facing tool: **Flashcards** — multi-select ALL/BEG/INT/ADV chips filter
  the deck (FlashcardsScreen.tsx:5, 365, 553, 718).
- Consequence for the in-flight re-balance: however the beginner/intermediate/advanced re-judgment
  lands, **glossary readers will see zero difference**; only Flashcards decks reshuffle. If the
  re-balance is meant to help a novice pick what to read first, the glossary currently gives them
  no signal — no tier badge, no "start here" sort, no beginner filter.
- The client DOES have a de-facto tier axis it shows everywhere: BEG/ADV *presentation* (plain
  English vs technical). Owner call (O3): is per-term difficulty supposed to stay invisible in the
  glossary (the 2026-07-08 ruling), or should the re-balance graduate it into a small badge /
  optional filter? If yes: *Proposal T1 (S, client): a muted BEG/INT/ADV chip in the expanded
  detail header* — one Text next to the first eyebrow, data already fetched. A tier FILTER chip
  would be M (needs difficulty in the corpus select at line 205, today it's detail-only).

---

## 6. Bundled/static content quality sample (~12 items)

The glossary corpus itself is DB-side; what the client SHIPS is lab-lesson prose, curated
notification concepts, and the study-sentence machinery. Sampled:

| # | Item | Verdict |
|---|---|---|
| 1 | EQ mistake "Boost-sweep to FIND, then forgetting to CUT…" (content.ts eq block) | TEACHES — names the diagnostic habit AND the fix |
| 2 | EQ mistake "Chasing a flat analyzer — 'flat' is not the goal; the meter informs, ears decide" | TEACHES — corrects a real novice belief |
| 3 | EQ control "Q" — "Low Q = broad, musical; high Q = surgical notch. Q = Fc ÷ bandwidth" | TEACHES — intuition plus the formula |
| 4 | Delay mistake "'Slapback' set too long — true slapback ≈ 60–150 ms, single repeat, low feedback" | TEACHES — concrete numbers, discriminates the concept |
| 5 | Delay proTip "Start 1/8-dotted synced, feedback ~25%, wet low…" | TEACHES — actionable starting point |
| 6 | Reverb display copy "RT60 is WHERE it crosses −60 dB (a time, not an amount)" | TEACHES — pre-empts the classic time/amount confusion |
| 7 | Reverb mistake "Confusing room size with decay time — a large room can decay quickly…" | TEACHES |
| 8 | Reverb formula "Sabine: RT60 = 0.161·V / A … links to the Wave-Physics Absorption module" | TEACHES + cross-references |
| 9 | misunderstoodTerms.json "Snare batter head — Myth: cranking tighter always adds crack…" | TEACHES — myth/actually structure is exactly right for notifications |
| 10 | misunderstoodTerms.json "Instrument input stage — tempting to think it needs impedance matching. Actually it bridges…" | TEACHES — technically correct (bridging Hi-Z), corrects a widespread error |
| 11 | oddTerms.json "scooped — cuts the mids… literally smiles up at both ends" | TEACHES — image carries the concept |
| 12 | misunderstoodTerms.json "A-B powering — applying T-power to a phantom-only mic can damage it" | TEACHES — safety-relevant, accurate |

**Verdict: uniformly high. Every sampled sentence teaches the concept rather than merely
containing the word.** No stinkers found in the sample. The sentence *machinery* is equally
serious: `sentences.ts` splits definitions without shattering citations/decimals (13–37), and the
v2 leak masking (roots, inflections, prefixes, board-aware sharing, 93–331) is why FIB/matching
don't become word-spotting games — this is the "sentence RULES" fix from the 2026-09-05 audit,
holding up well on inspection.

---

## 7. Already GOOD (don't touch)

- Free cross-link hops (line 1634) — exploration untaxed while first opens are metered.
- Tease-don't-leak Common Mistakes veil built from a placeholder, a11y-hidden (lines 599–608, 749).
- Honesty rule on lab actions — READY-only registry, planned terms documented but never shown
  (learningProfiles.ts:1–21, 283–293).
- The split blue/purple word (definition-half vs calculator-half of one term, lines 504–534) — an
  unusual but principled two-doors affordance in a consistent color code.
- Generic-word stoplist + acronym case guard keeping prose readable (lines 356–359, 369, 403).
- Empty states that say how each list fills (lines 3302–3311) and the suggest-a-term escape hatch.
- Failed detail fetch → visible retry, never an eternal "Loading…" (lines 2951–2961, 3104–3118).
- The back-trail with per-hop scroll restore (lines 1610–1707).

---

## 8. Ranked proposals

### Client-code changes (this repo)

| Rank | ID | Change | Effort | Learning impact |
|---|---|---|---|---|
| 1 | L1 | Default first-run/guest to BEG (plain English first); keep any stored choice | S | Highest — fixes the novice's forced first contact |
| 2 | S1 | "Did you mean" nearest-terms on zero-result search | M | High — turns typos into learning |
| 3 | C1 | Unresolvable RELATED-TERMS pill → tap runs it as a search | S | High — removes the one true navigation dead-end |
| 4 | L2 | Rename/clarify the BEG-ADV header toggle ("PLAIN / TECH") | S | Medium — discoverability of the gentle layer |
| 5 | T1 | Show difficulty chip in expanded detail (pending O3 ruling) | S | Medium — makes the tier re-balance visible to readers |
| 6 | S2 | Related-terms hint on near-miss search results | S | Low-medium |

### Owner-only content decisions (DB is owner's; report items only)

- **O1 — Common Mistakes coverage:** how many of the ~27k terms actually carry `common_mistakes`?
  Every non-member sees a 3-bullet tease for every term (client placeholder); a member finds "—"
  where none exist (GlossaryScreen.tsx:746). If coverage is sparse, either author the high-traffic
  terms first or rule that the universal tease is acceptable marketing (then consider the
  has-mistakes flag variant noted in §3).
- **O2 — `related_terms` density for conceptual neighbors:** the frequency↔wavelength kind of hop
  depends entirely on this DB field (plus incidental prose mentions). Worth a coverage query on the
  top-opened terms: do the core physics terms each name their natural neighbors?
- **O3 — Ruling requested: does the Booth 2026-07-08 "difficulty deliberately not shown" ruling
  survive the tier re-balance,** or should the glossary surface it (T1)? The re-balance is
  invisible to glossary readers under the current ruling.
- **O4 — Plain-English coverage:** `plain_english` silently falls back to the technical definition
  (lines 304, 2881). If L1 (BEG default) is adopted, unauthored plain-English terms show technical
  text under a "beginner" mode — a coverage query on high-traffic terms tells whether that matters.
- **O5 — `formula_symbolic` is still ungranted/unpopulated** (0 of 14,246 rows as of 2026-07-26,
  lines 249–257): the Equations & Formulas filter — a free, deliberately ungated teaching surface
  (lines 1871–1877) — shows nothing until the backend grants and populates the columns. The client
  is ready today.
