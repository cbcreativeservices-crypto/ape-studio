# Topic Foundations — production standard and process

**Owner-approved standard, 2026-11-03 (pilot version 5). Must-do row D47.**
This file is the single source for writing every Topic Foundations lesson. Every lesson is made by following sections 3–6 exactly, and is accepted only when every check in section 7 passes.

---

## 1. What a Topic Foundations lesson is

| | |
|---|---|
| **Job** | A short lesson read before a topic's flashcards. It gives a beginner the mental picture of the WHOLE topic, so the flashcard terms have somewhere to land. The flashcards teach the details and the vocabulary; the lesson does not. |
| **Where it appears (owner decisions 2026-11-03)** | First flashcards open: today's Welcome popup, then the Foundations popup. It shows again on each flashcards open until the learner taps "I've read this" ("Later" still lets them study; flashcards are never locked). A "TOPIC FOUNDATIONS — Start here" row above Flashcards on the Study Dashboard reopens it at any time. |
| **How many** | Every active topic on the live server: **171** (checked 2026-11-03: 171 active topics, each with Welcome text; all 31,877 term links have plain English). Pilot done: 5. **Remaining: 166.** |
| **Where the text lives** | A new text column on `achievements` on the server (Comp A adds it and loads the approved text). |
| **Release** | The app screen rides the A2 update. **A2 is held by the owner until all 171 are written and approved.** |
| **Who does what** | **ccode does all analysis, writing, checking and the review pages** (owner 2026-11-03: Comp A cannot see the app and cannot judge it in context). Comp A only adds the column and loads the approved text from a package ccode prepares, then runs ccode's verification query. |

---

## 2. Template analysis: what the approved pilot looks like

Measured on the 5 approved lessons (Pro Audio Safety 3060, DAW Fundamentals 3970, Compression, Limiting & Gating 3350, Specialized & Emerging Microphones 3110, Advanced Dynamics 4740):

| Feature | Approved range | Standard for all topics |
|---|---|---|
| Paragraphs | 7 in every lesson | **6–8** (7 is normal) |
| Words (body, without title) | 428–470 | **400–480** |
| Sentences | 31–38 | about 30–40 |
| Average sentence length | 11.7–14.4 words | **≤ 15 words** average |
| Long sentences (over 20 words) | 2–8 per lesson; longest 31–42 words | **≤ 8**; any sentence over 30 words is flagged and split unless it is a plain list of items |
| Named terms ("…is called X") | 1–5 | **2–6**, each exactly as in the topic's glossary |
| Numbers | 0 | **none** (at most one, only if it truly helps) |
| Lists, headings, bold | none | **none** in the body |

**The shape every approved lesson shares (not a fill-in template; a pattern):**

| Paragraph | Role | Approved examples |
|---|---|---|
| 1 | **Start from what the reader already knows**: an everyday scene (first day on a crew; a band recording at home; a friend singing), or for an advanced or "next step" topic, a plain recap of the prerequisite topic named once. It ends on the question the topic answers. | "Imagine your first day helping a crew set up a concert hall." / "In the core topic on compression, limiting and gating, you learned about the compressor." |
| 2–6 | **One link of the chain each.** Each paragraph covers one of the topic's term groups, in the order the reasoning needs. Its first sentence picks up exactly where the last paragraph ended. A term is named only when the reader has just needed it. | "Electrical danger is even harder to see." / "Snapping to beat lines only works if the program knows the song's speed." |
| 7 | **Close the same thread**: what the flashcards cover (in plain words, no list), then "By the end, you will know…" | "The flashcards explain each step in detail. When you finish, you will know how…" |

---

## 3. The rules (all of them, in one place)

### A. Scope (from v4: "the copy did not understand the context of the terms in the topic")
1. The lesson introduces the **whole topic as its title and term list define it**, never one corner of it.
2. Every term group with about **10% or more** of the topic's terms appears in the chain, with space roughly in proportion to its size. Smaller groups may be named in the closing paragraph.
3. The closing says what the learner will know after the whole topic.

### B. Flow (from v2/v3: "it jumps around… a flow of ideas built upon each other")
4. **One line of thought.** Every paragraph answers the question the previous paragraph left. If a paragraph could be moved or removed without breaking the chain, it does not belong.
5. No side blocks: no "Here is a story", "One common mistake", "Two more ideas", "First… Second…", no second unrelated example.
6. A term is described in plain words first, then named ("…That level is called the threshold.").
7. A running example is used only if it spans the whole topic; otherwise use short everyday moments linked by the topic's organizing question.

### C. Level (from v1: "too advanced and confusing")
8. Written for a curious beginner (about 16 years old) who has never studied the topic.
9. Detail, numbers, specifications and lists of variants stay in the flashcards.

### D. Plain international English (from v5: "not confusing to non-native English speakers")
10. Every sentence must make sense **read literally** by someone who learned English as a second language.
11. **No** idioms, figures of speech, personification, slang, informal words, cultural references, or phrasal verbs with a non-literal meaning.
12. **No** vague sound adjectives (warm, bright, punchy, harsh, fat, smooth, strong) unless explained literally ("more low frequencies").
13. Known replacements (keep using these): picture → **imagine**; line (for a level) → **set level**; slices → **frequency bands**; gear → **equipment**; bits → **parts**; tries → **attempts**; set it off → **trigger it**; ride the knob → **keep your hand on the knob**; way out → **exit routes**; cousin → **related tool**.
14. Short sentences, common words, US spelling, no exclamation marks, calm and warm tone; "you" is fine.

### E. Accuracy and agreement
15. Simplify, never falsify. Prefer "often" or "usually" to absolutes when the truth has exceptions.
16. Every named or explained term must **agree with that term's `plain_english` in the glossary** (learners read both).
17. Every named term must **exist in that topic's live term list** (exact spelling, lowercase in the prose is fine).

### F. House rules
18. **No product, brand or company names** (owner 2026-11-03: the flashcards teach those on purpose).
19. **Knowledge, not skills**: say what things are, what they are for and how they work; never "you'll master / be able to / build / mix".
20. Technique is described as common practice or a starting point, never as the one correct setting.
21. **No citations** or authorities ("studies show", named standards bodies as proof).
22. Do not repeat the topic's Welcome text (it is shown just before).
23. Safety topics: the dangers and the never-break rules come early, inside the same chain.

### G. Format
24. Line 1: `Topic Foundations: <short topic name>`; blank line; then 6–8 plain paragraphs separated by one blank line. No headings, bullets, bold, links or tables.

---

## 4. The data rules (traps already hit)

| Rule | Why |
|---|---|
| Read the glossary from the **base tables** (`glossary` + `glossary_topics` + `achievements`), **never** `glossary_study_v`. | The view hides plain English for members-only topics when read without a member sign-in. On 2026-11-03 this made 3 complete topics look empty and a false "data gap" reached the owner. |
| Product and company names in the glossary are **intentional**. | Never report them as a defect. |
| Any claim an agent makes about live data is **spot-checked with ccode's own query** before it reaches the owner. | Agents reported wrong data once already. |
| Group counts must **add up to the topic's live term total**. | Proves every term was placed. |

Queries (read-only):
```sql
-- topic
select id, global_sequence, name, field, subject, description, flashcard_welcome_title, flashcard_welcome_body
from achievements where global_sequence = :gs and is_active;
-- every term with its plain English
select g.term, g.plain_english
from glossary g join glossary_topics gt on gt.glossary_id = g.id
where gt.achievement_id = :id order by g.term;
```

---

## 5. Process for each topic (done → checked → confirmed)

| Step | Done by | What is done | Checked | Confirmed (gate to pass) |
|---|---|---|---|---|
| **1. Pull data** | writer agent | Read the topic row and **every** term with its plain English (base tables). Save a snapshot (`<gs>.terms.json`). | Term count = live count (ccode query). | Snapshot count matches; Welcome text read. |
| **2. Scope map** | writer agent | Sort **every** term into 4–7 groups; count each; give 3 example terms each. Write the organizing question and "what the learner knows after the whole topic". Note any prerequisite topic. | Group counts add up to the total; no group over ~45% unless the topic truly is that one thing. | Checker A agrees the groups reflect the topic (step 6). |
| **3. Chain plan** | writer agent | 5–7 linked questions; each mapped to a paragraph and to the group(s) it covers; every group ≥10% is in the chain. | Every large group has a paragraph. | Listed in the writer's report. |
| **4. Write** | writer agent (Opus 5.5, medium effort — owner's pick) | Write the lesson to `<gs>.md` following section 3. | — | File exists. |
| **5. Mechanical check** | script (ccode runs) | Words 400–480; 6–8 paragraphs; average sentence ≤15 words, ≤8 over 20 words, flag any over 30; no bullets/headings/bold/digits; no banned words (section 8); no product/company names found in the topic's term list or a brand list; every "called X" term exists in the topic's list; US spelling list. | Script output. | **0 failures**, or each flag fixed and re-run. |
| **6. Check A: scope, accuracy, glossary** | independent checker agent | Compares the lesson with the full term list (scope 1–5), checks every claim, and checks every named term against its plain English. Returns exact quote → problem → exact fix. | Scope ≥4; no accuracy or glossary conflict left. | ccode applies fixes; ccode spot-checks at least one glossary claim per batch with its own query. |
| **7. Check B: flow and plain English** | independent checker agent | Reads as a beginner (flow 1–5) and as an intermediate English learner; flags every chain break, idiom, figure of speech, vague adjective. | Flow ≥4; no plain-English flag left. | ccode applies fixes. |
| **8. Re-check** | ccode | Re-run step 5 on the fixed text; ccode reads every lesson in full. | Script 0 failures; ccode's own read. | Lesson marked "ready for owner". |
| **9. Owner review** | owner | One review page per batch in Downloads (`<date>_TOPIC_FOUNDATIONS_BATCH_<n>.html` + `.md`): each lesson in the popup sketch with its topic's group bars. | Owner reads. | **Owner approves the batch** (or names changes → back to step 4/8). |
| **10. Freeze** | ccode | Approved text saved in the repo `docs/foundations/approved/<gs>.md`; manifest `docs/foundations/approved/MANIFEST.json` (gs, name, words, md5, approval date). Committed through the gate and pushed. | md5 in manifest = file. | Committed. |
| **11. Load to server** (once, after all 171) | **Comp A** (mechanical only) | ccode prepares ONE package (ZIP in Downloads): column add + load SQL generated from the manifest + a read-back query comparing md5 per topic. Comp A applies it with the owner's go. | ccode runs the read-back: 171 rows, every md5 matches. | All 171 match. |
| **12. App screen** | ccode | Popup + dashboard row + "I've read this" state (house helpers: `createLocalStore`, `useModalHandoff`/`rootModalHoldMs`, `useMemberGate`), web-preview check, gate. Rides A2. | Tests + preview. | Owner sees it; A2 GO stays the owner's. |

---

## 6. Batches and order

- **One batch = one field** (large fields split into batches of up to 9 topics). 20 fields, 171 topics; the 5 pilot topics are already done.
- **Order:** Foundations & Safety first (where beginners start), then the fields learners usually reach next: Hearing, Perception & Listening → Audio Equipment & Signal Chain (26 topics, 3 batches) → Studio Recording → Mixing & Mastering → Signal Processing & Effects → Live Sound & Production → Electronic Music, DAWs & Synthesis → the remaining fields.
- **Per batch of ~8 topics:** 8 writer agents + 2 checker agents (A and B each take the whole batch) = about 10 agents, about 20–30 minutes of agent time, plus ccode's own read and the review page.
- **Estimated total:** about 20 batches.
- Each batch also updates must-do row D47 (count approved so far).

---

## 7. Acceptance checklist (every lesson must pass all)

| # | Check | How |
|---|---|---|
| 1 | Whole topic covered; every group ≥10% in the chain | Check A scope ≥4 + group table |
| 2 | One line of thought; each paragraph grows from the last | Check B flow ≥4 + ccode read |
| 3 | Beginner level; detail left to flashcards | Check B + ccode read |
| 4 | Plain international English; no idioms, figures of speech, vague adjectives | Check B + banned-word script |
| 5 | Every claim accurate | Check A |
| 6 | Every named term agrees with its glossary plain English and exists in the topic | Check A + script |
| 7 | No product/company names; no citations; knowledge not skills; Welcome not repeated | Script + Check A |
| 8 | 400–480 words; 6–8 paragraphs; format rule 24 | Script |
| 9 | Owner approved the batch | Owner |

---

## 8. Banned-word starter list (script; grows with every owner note)

picture (as a verb); and these metaphors and informal words: cousin, engine (non-literal), gear, bits, tries, ride/riding (non-literal), grab, lid, slice(s), punchy, punch, warm, warmer, bright, brighter, harsh, fat, smooth (for sound), sweet spot, day one, set it off, back out, use it up, travel together, opens with holes, under the hood, rule of thumb, go-to, tricky/trickier, master (as a verb), be able to.

---

## 9. Files

| File | Purpose |
|---|---|
| `docs/foundations/TOPIC_FOUNDATIONS_STANDARD.md` | This standard (canonical) |
| `docs/foundations/WRITER_BRIEF.md` | The exact brief every writer agent receives (built from sections 3–5) |
| `docs/foundations/approved/<gs>.md` + `MANIFEST.json` | Approved, frozen text |
| `scripts/foundations/check-lesson.mjs` | Step 5 mechanical check (built and proved on the 5 approved lessons at the start of batch 1) |
| Downloads `<date>_TOPIC_FOUNDATIONS_BATCH_<n>.html/.md` | Owner review page per batch |
