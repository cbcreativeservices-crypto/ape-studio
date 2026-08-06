# AP&E Glossary — MACHINE B WORK PACKAGE
**Created 2026-07-18 by the Machine A (primary) session · Prof. Booth's AP&E Studio project**

You are **Machine B**. This package is fully self-contained — you do **NOT** need database access. You author from the packet files here and hand finished JSON files back. Machine A applies everything to the database.

---

## 0. THE RULES (non-negotiable)

1. **Work ONLY on the terms in `packets/`.** These 3,609 terms are exclusively yours. Machine A is working a completely separate 7,820 terms and will never touch yours. Do not add, remove, rename, or re-scope terms — the term list is fixed and approved.
2. **EVERY term gets the FULL pipeline: author → 3-expert committee → corrections.** Never author without the committee. This is Prof. Booth's standing rule.
3. **NEVER write to the database.** You have no DB access by design. Machine A is the single writer.
4. **Quality over speed. No placeholders, ever.** The product cannot launch with `(pending)` text. If you cannot confirm a fact to a professional standard, leave that field blank and flag it — a flagged blank is correct, a confident wrong answer is a failure.
5. **Fill EMPTY fields only.** Each term carries an `empty_fields` list — author exactly those, nothing else.

---

## 1. WHAT YOU HAVE

```
README_START_HERE.md      <- this file
MANIFEST.json             <- 431 packets: topic, term count, field count
ASSIGNED_TERM_IDS.txt     <- the 3,609 term IDs that are yours (exclusive)
briefs/
  AUTHORING_BRIEF.md      <- the authoring standard (STEP 1)
  BRIEF_COMMON.md         <- committee shared brief incl. RAISED BAR v2 (STEP 2)
  BRIEF_AUDIO.md          <- committee: audio technical expert
  BRIEF_COGNITION.md      <- committee: learning/cognition expert
  BRIEF_LANGUAGE.md       <- committee: language/communications expert
packets/  mb0001.json … mb0431.json   <- 9 terms each, with current field values
authored_OUTPUT/          <- you write authoring results here
committee_OUTPUT/         <- you write committee results here
```

**Scope: 3,609 terms · 28,872 fields · 54 topics · 431 packets.**
Largest topics: Mix Fundamentals & Workflow (662), Sound for Picture — Post Workflow (468), Band Tracking Workflow (431), Mastering Fundamentals & Chain (220), Attack/Decay/Resonance & Artifact ID (198), AI/ML Foundations for Audio (131), Instrument Recording — Strings & Guitar (129), Broadcast/Radio Air Chain (123), Tonal & Timbre Descriptors (117).

### Packet format
Each term object contains: `id` (never change it), `term`, `topic`, `difficulty`, the current value of all 8 content fields, and **`empty_fields`** — the exact list of fields to author.

> A `definition` of `"(pending)"` **or** `"(definition pending)"` is a PLACEHOLDER = empty. It will appear in `empty_fields`. Author it. Both strings mean the same thing.

---

## 2. STEP 1 — AUTHORING

For each packet, run one expert-researcher agent. Give it:
- `briefs/AUTHORING_BRIEF.md` (read and follow exactly)
- its packet file
- output path `authored_OUTPUT/<same-name>.json`

Suggested agent prompt:

> You are an expert audio researcher authoring AP&E glossary content. Accuracy is paramount — this certifies technicians for real studio/live-sound work. Use your shell for file I/O and web search to verify facts. Read and follow EXACTLY: `briefs/AUTHORING_BRIEF.md`. Your packet: `packets/mbNNNN.json`. Author ONLY each term's `empty_fields` (a definition of `(pending)`/`(definition pending)` IS empty — author it), cross-confirmed against ≥2 authoritative sources (≥3 for safety-critical). Write output to `authored_OUTPUT/mbNNNN.json` per the OUTPUT contract; validate it parses with one entry per packet term. Reply one line: terms authored + FLAG count.

**Authoring output contract** (also in the brief):
```json
{ "batch": <n>, "topic": "<topic>",
  "authored": [
    { "id": "<uuid unchanged>", "term": "<term unchanged>",
      "fields": { "<only fields from empty_fields>": "<string, or ARRAY for related_terms / common_mistakes / scenario_contexts>" },
      "sources": ["source 1", "source 2"],
      "confidence": "High | Medium | FLAG-FOR-REVIEW",
      "flags": ["field left blank + why"] } ] }
```

**Throughput note:** ~8–10 concurrent agents is a workable wave. Expect to hit usage caps — that's fine, everything is checkpointed to files. Always verify what actually landed on disk before moving on (agents sometimes die mid-write).

---

## 3. STEP 2 — THE 3-EXPERT COMMITTEE (mandatory, every term)

After a topic's authoring is done, build review packets from your authored output and run **three independent expert agents over every term**:

- **Audio Technical** (`briefs/BRIEF_AUDIO.md`) — accuracy, standards, safety. **Must web-verify every Medium/High flag.**
- **Learning / Cognition** (`briefs/BRIEF_COGNITION.md`) — difficulty fit, cognitive load, learning traps.
- **Language / Communications** (`briefs/BRIEF_LANGUAGE.md`) — grammar, clarity, real ambiguity. **No house-style nitpicking.**

All three also read `briefs/BRIEF_COMMON.md` first — it carries the **RAISED BAR v2** rules (bias to OK, strict severity, no style flags, one review object per term). Use ~35 terms per review packet.

**Committee output contract:**
```json
{ "expert": "<role>", "group": <n>,
  "reviews": [ { "id": "<uuid>", "term": "<term>", "verdict": "OK|MINOR|NEEDS_REVISION",
    "suggestions": [ { "field": "<field>", "severity": "High|Medium|Low",
                       "issue": "<what's wrong>", "suggestion": "<concrete fix>" } ] } ] }
```
Write to `committee_OUTPUT/<audio|cognition|language>_<group>.json`.

**Expected shape of a healthy result:** ~90% of terms come back OK. A flood of Low-severity style flags means the raised-bar rules aren't being followed.

---

## 4. STEP 3 — CORRECTIONS

Apply every committee suggestion to the authored content with an editor agent per group:
- Apply all suggestions faithfully; reconcile when two experts flag the same field.
- **Web-verify every technical fix before writing it.** Do not introduce a new error while fixing one.
- If a suggestion is itself wrong, keep the original and say why in `notes`.
- Change only flagged fields. Return complete arrays for list fields.

Fold the corrections into your `authored_OUTPUT/` files (or write `corrected_OUTPUT/` — just tell us which is final).

---

## 5. WHAT TO SEND BACK

Return the whole folder, or at minimum:
1. **`authored_OUTPUT/`** — final authored JSON, corrections already folded in (this is the payload Machine A applies).
2. **`committee_OUTPUT/`** — all committee reviews (the audit trail).
3. **A short `COMPLETION_NOTES.md`**: packets completed, total terms, any terms left blank/flagged and why, any suggestions you declined and why, anything Booth should rule on.

**Critical for the merge:** never alter `id` or `term`. Machine A matches on `id` and will reject anything that doesn't line up. Do not reformat list fields into strings — they must stay JSON arrays.

---

## 6. INTEGRITY CHECKS BEFORE YOU SEND

- [ ] Every packet in `packets/` has a matching file in `authored_OUTPUT/`.
- [ ] Each output has exactly one entry per packet term (count them).
- [ ] Every `fields` key appears in that term's `empty_fields` — nothing extra was written.
- [ ] List fields are JSON arrays of strings, not strings.
- [ ] No field contains a source citation (sources belong in `sources`).
- [ ] No placeholder text anywhere — no `(pending)`, no `TBD`, no "important concept in audio".
- [ ] Every term went through the committee (not just authoring).
- [ ] All JSON parses.

---

## 7. WHAT MACHINE A IS DOING

Machine A holds the other **7,820 terms / 98 topics** (Safety, Soldering & Repair, Recording Arts, Plugins, Session Setup, Console Architecture, Power Systems, Live Sound, Hearing & Hearing Health, etc.) and runs the identical pipeline. It also owns all database writes, backups, checksum verification, and the changelog. Deadline: **Aug 15 launch**, with zero placeholders remaining.

Questions or ambiguity about a term's scope or sense → flag it, don't guess. Prof. Booth rules on it.
