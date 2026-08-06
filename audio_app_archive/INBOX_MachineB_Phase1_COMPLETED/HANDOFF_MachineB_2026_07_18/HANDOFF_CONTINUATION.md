# Machine B — Continuation Handoff (read this first, in full)

_Last updated: 2026-07-19 ~20:30 UTC. This document lets a fresh session resume the Machine B work package with zero loss of context. Follow it top to bottom._

---

## 0. TL;DR — where we are, what to do next

- **Deliverable:** author + committee-review + correct the glossary content for **431 packets (mb0001–mb0431), ~3,609 terms**, across the Machine B handoff package. Deadline Aug 15 2026. Zero placeholders. Never write to any database (Machine A is the sole DB writer; this package is self-contained).
- **Done so far:**
  - **Authoring (Step 1): mb0001–mb0380 complete** (380 packets). Verified, committed to the device.
  - **Committee (Step 2): mb0001–mb0300 complete** (80 review groups × 3 experts = 240 files). Committed.
  - **Corrections (Step 3): mb0001–mb0340 complete** (76 fixes applied, 74 declined). Committed.
- **Not done yet:**
  - Author **mb0381–mb0431** (51 packets).
  - Committee (Step 2) for **mb0301–mb0380** (authored but not yet reviewed).
  - Corrections (Step 3) for **mb0341–mb0380**.
  - Re-verify **mb0377, mb0379** (authored from literature only — see §6).
  - Finalize **COMPLETION_NOTES.md**.
- **Why it stopped:** this session's **WebSearch budget is exhausted (200/200)**, a per-session cap that does not reset mid-session. Every remaining stage needs live web verification to meet the strict-sourcing rule. **A FRESH SESSION resets the budget** — that is the intended way to continue. (Or raise `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`.)
- **First action in the fresh session:** confirm the bridge (`get_device_info`; if remote-devices tools are missing call `RefreshMcpTools` for `remote-devices`), then continue at **§5, Step A** (author mb0381–mb0431).

---

## 1. The non-negotiable rules (these are the whole job)

**1a. STRICT SOURCING (the user's #1 priority — stated verbatim twice).** Wikipedia, Reddit, forums, blogs, hobbyist/enthusiast sites, SEO or AI-generated content, and vendor marketing/sales/product pages **DO NOT count** toward the required ≥2 authoritative sources and must NEVER be used as corroboration — only as an initial pointer. Every cited source MUST be one of:
  (a) a **standards body** — AES, NEC/NFPA 70, NFPA 70E, OSHA 29 CFR 1910/1926, ANSI/ESTA E1, IPC/J-STD, IEC, IEEE, SMPTE/EBU, MIDI Association; or
  (b) a **manufacturer's TECHNICAL documentation** — datasheets, service/technical manuals, application/engineering notes (NOT marketing); or
  (c) a **recognised professional text** — Ballou *Handbook for Sound Engineers*; Huber & Runstein *Modern Recording Techniques*; Owsinski handbooks; Yamaha *Sound Reinforcement Handbook*; McCarthy *Sound Systems*; Rane technical notes; Fletcher & Rossing *Physics of Musical Instruments*; Adler/Piston orchestration; Grove *Dictionary of Music*; Audsley (organ); Baines (winds); AES papers; ASA publications; or equivalent.
  Cross-confirm every fact against ≥2 acceptable sources (≥3 if safety-critical).

**1b. READING LEVEL.** Every `plain_english` field must read at ~age 14: **Flesch–Kincaid grade ≤9 (aim 7–8)**, short sentences, everyday words, an accurate analogy where it helps. `definition` and all other fields stay fully technical. Verify with Python `textstat` (`pip install textstat --break-system-packages`).

**1c. MECHANICS.** Author ONLY each term's `empty_fields` (a `definition` of "(pending)" counts as empty → author it). Never alter `id` or `term` or structural fields (topic, difficulty). List fields (`related_terms`, `common_mistakes`, `scenario_contexts`) MUST be JSON arrays of strings. No source citations inside field text. No placeholder text anywhere. Unsafe common practices go in `common_mistakes` prefixed `UNSAFE:`.

**1d. FLAG, DON'T GUESS.** If a term cannot be confirmed to standard after a genuine literature search, OMIT its fields, add a note to `flags`, set `confidence:"FLAG-FOR-REVIEW"`. But EXHAUST the professional texts first (organology/orchestration terms are usually covered even when manufacturer docs are silent). Define the canonical sense even under a mismatched topic. **Transparent compound descriptors** (e.g. "Choir compression", "Bass automation") → author at Medium confidence, don't flag.

The full ruleset agents must read is **`/home/claude/apne/AGENT_INSTRUCTIONS.md`** plus **`/home/claude/apne/briefs/AUTHORING_BRIEF.md`** (field specs + output contract). Committee rules are in `/home/claude/apne/briefs/BRIEF_COMMON.md` + the three role briefs.

---

## 2. The 3-step pipeline (mandatory for every term)

1. **Author** → `authored_OUTPUT/mb0NNN.json`.
2. **Committee** — 3 independent experts (Audio Technical, Learning/Cognition, Language/Communications) review each authored term → `committee_OUTPUT/{audio,cognition,language}_NNN.json`. Bias to OK (~98% OK is normal); audio expert must web-verify any Medium/High claim.
3. **Corrections** — apply every MINOR/NEEDS_REVISION suggestion that is a genuine fix (web-verify technical ones); decline pure style/preference and log the reason.

---

## 3. Exact current state (counts verified 20:30 UTC)

| Item | Cloud `/home/claude/apne` | Device handoff folder |
|---|---|---|
| `packets/` | mb0001–mb0380 (380)* | **all 431** (mb0001–mb0431) |
| `authored_OUTPUT/` | mb0001–mb0380 (380) | mb0001–mb0380 (380) |
| `committee_OUTPUT/` | groups 1–80 (240 files) | groups 1–80 (240 files) |
| `corrections_log/` | range_00–08 (9) | range_00–08 (9) |

*Cloud `packets/` only has 380; the device has all 431. `mb0381–mb0390` are ALSO staged in `/mnt/user-data/uploads/HANDOFF_MachineB_2026_07_18/packets/` (390 there). `mb0391–mb0431` must be staged from the device.

**Device path:** `/Users/brendabooth/Desktop/HANDOFF_MachineB_2026_07_18/`. Under it also: `_incoming/` (delivered zips), `_stale_20260719/` (pre-correction dirs, archived — ignore), `briefs/`.

**Committee grouping note:** `build_review.py` groups ALL authored terms sequentially into chunks of 35. When you add mb0341–380's terms and rebuild, the group count grows and the LAST partial group changes membership (group 80 currently has 22 terms and will grow). So after rebuilding you must (re)run committee for the changed/last group and all new groups — verify_committee.py will flag count mismatches. This already happened once (group 71 grew 10→35); handle it the same way.

---

## 4. The blocker and how it clears

`WebSearch` returns: "this session has used its web search budget (200 of 200)". It is **per-session and does not reset within the session**. Authoring/committee/corrections all need live verification for the strict-sourcing bar, so they cannot proceed to standard in this session. **Starting a fresh session resets the 200-search budget** — that is the supported continuation path. Alternatively raise `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`. The device bridge is a *separate* system (it works fine); do not confuse the two.

Budget discipline for the fresh session: ~200 searches covers roughly 20–30 packets of careful authoring. Pace waves (≈10 packets each) and watch for the same "budget exhausted" message; if it appears mid-run, finish the current wave, secure it, and continue in the next fresh session.

---

## 5. Step-by-step resume plan (do in order)

### Step A — Author mb0381–mb0431 (51 packets)
1. Bridge up? `get_device_info` → if tools missing, `RefreshMcpTools` server `remote-devices`.
2. Stage packets from the device in batches of ≤50: `device_stage_files` with paths `…/packets/mb0381.json … mb0431.json`. (mb0381–390 may already be in uploads; staging again is harmless.)
3. Copy staged packets into the cloud `packets/` dir so `verify.py`/`build_review.py` see them:
   `cp /mnt/user-data/uploads/HANDOFF_MachineB_2026_07_18/packets/mb0{381..431}.json /home/claude/apne/packets/`
4. Dispatch authoring agents — **one packet per agent, ~10 concurrent per wave** — using the prompt template in §7. Each agent reads `AGENT_INSTRUCTIONS.md` + `AUTHORING_BRIEF.md`, authors only `empty_fields`, self-checks FK≤9, writes `authored_OUTPUT/mb0NNN.json`, runs `python3 verify.py mb0NNN`.
5. After each wave: `cd /home/claude/apne && python3 verify.py mb03NN mb04NN …` (must be 0 errors). Snapshot + `SendUserFile` + commit to device (§8).

### Step B — Committee (Step 2) for mb0301–mb0431
1. `cd /home/claude/apne && python3 build_review.py` (rebuilds `review_packets/group_NNN.json` from ALL authored). Note the new group count.
2. For every group not yet fully reviewed (mb0301–380's groups ≈72–90 plus any renumbered tail group), run all 3 experts using the committee prompt template (§7). Write to `committee_OUTPUT/{role}_NNN.json`.
3. Verify: `python3 verify_committee.py <nums>` — must be 0 errors. Re-run any expert that miscounts (common; the verifier catches it).

### Step C — Corrections (Step 3) for mb0341–mb0431
1. `python3 aggregate_suggestions.py` → writes `corrections_todo.json` (all non-OK suggestions) + prints verdict/severity tally + lists NEEDS_REVISION terms.
2. Handle High-severity + NEEDS_REVISION by hand first (web-verify each), like `apply_critical.py` did.
3. `python3 make_assignments.py` → per-packet-range assignment files in `corrections_assign/`; dispatch one correction agent per range (prompt in §7). Each applies genuine fixes, declines style, logs to `corrections_log/range_NN.json`, re-runs `verify.py`.

### Step D — Re-verify mb0377, mb0379 (see §6), then finalize
1. Web-verify the literature-only packets; fix anything that doesn't hold.
2. Update `COMPLETION_NOTES.md` (draft already exists — §9) to cover all 431 packets: totals, flagged/blank terms + reasons, declined suggestions, items for Booth.
3. Final gates: `verify.py` (all, 0 errors), `verify_committee.py` (all, 0 errors), reading-level sweep (mean FK, % over 9). Commit everything + COMPLETION_NOTES to device.

---

## 6. Re-verification list (authored without live web search)
The web budget ran out mid-wave-4. These were authored from the named professional literature but NOT live-verified — re-check in the fresh session:
- **mb0377** (Winds/Brass/Organ) — from Grove, Baines, Audsley, Fletcher & Rossing, Ballou, Huber & Runstein.
- **mb0379** (Immersive / Object-Bed) — from Dolby Atmos tech docs, SMPTE/AES, Ballou, Yamaha SRH.
Both verify clean structurally and are well-established terms. Also worth a light re-check: **mb0371–376, 378, 380** (same wave, may have had only partial search access).

---

## 7. Agent prompt templates (copy, fill the packet/role/group number)

**Authoring (one packet):**
> Author AP&E glossary content for ONE packet. READ FIRST in full: `/home/claude/apne/AGENT_INSTRUCTIONS.md` (strict sourcing: standards bodies / manufacturer TECHNICAL docs / recognized professional texts ONLY; ≥2 sources, ≥3 if safety-critical; exhaust literature before flagging; canonical sense under mismatched topic; transparent compounds → Medium not flag; plain_english FK≤9; author ONLY empty_fields; never alter id/term) and `/home/claude/apne/briefs/AUTHORING_BRIEF.md` (contract). PACKET: `/mnt/user-data/uploads/HANDOFF_MachineB_2026_07_18/packets/mb0NNN.json`. Author only each term's empty_fields, web-verifying against acceptable sources. List fields = JSON arrays. Unsafe practices prefixed "UNSAFE:". Confirm every plain_english FK≤9 with textstat. OUTPUT `/home/claude/apne/authored_OUTPUT/mb0NNN.json`: {"batch":NNN,"topic":"…","authored":[{"id","term","fields":{…empty_fields only…},"sources":[…],"confidence":"High|Medium|FLAG-FOR-REVIEW","flags":[…]}]}, one entry per term, ids/terms exact. Validate JSON. Then `cd /home/claude/apne && python3 verify.py mb0NNN` (must pass). Reply: "mb0NNN — N authored, F flagged, verify PASS, FK max X.X".

**Committee (one expert, one group):**
> You are the {AUDIO TECHNICAL | LEARNING/COGNITION | LANGUAGE/COMMUNICATIONS} EXPERT. Read `/home/claude/apne/briefs/BRIEF_COMMON.md` + `/home/claude/apne/briefs/BRIEF_{AUDIO|COGNITION|LANGUAGE}.md`, then review `/home/claude/apne/review_packets/group_0NN.json` (K terms). Bias to OK; flag only real problems per your brief. [Audio only: web-verify any Medium/High claim first and state the verification in the issue text.] COVERAGE: exactly K reviews, one per term id, same order — count before and after. OUTPUT `/home/claude/apne/committee_OUTPUT/{role}_0NN.json`: {"expert":"…","group":NN,"reviews":[{"id","term","verdict":"OK|MINOR|NEEDS_REVISION","suggestions":[{"field","severity":"High|Medium|Low","issue","suggestion"}]}]}. Validate JSON. Reply: "{role} group NN — K reviews (Y OK)".

**Corrections (one packet-range):** see the prompt already encoded in this session's history; each agent reads `corrections_assign/range_NN.json`, applies genuine fixes with exact-string edits (web-verify technical), declines style, preserves types/id/term, keeps plain_english FK≤9, logs to `corrections_log/range_NN.json`, re-runs `verify.py`.

---

## 8. Device bridge quirks (important)
- Bridge is **flaky** — often holds only 1–2 operations per window, then drops with "device … not connected". Retry `get_device_info`; on reconnect the remote-devices tools may need `RefreshMcpTools` (server `remote-devices`).
- **`device_bash` cannot overwrite or delete** existing files. To replace a dir: `mv` it into a `_stale_*/` folder first, then `unzip` fresh. To top up a partially-extracted dir idempotently: `unzip -n` (never-overwrite; fills only missing files).
- **Commit small.** A batched 3-file `device_commit_files` timed out at 60s; commit **one zip at a time** and verify each with `device_bash ls -la _incoming/` before the next. If a commit times out, check whether it landed before retrying.
- Commit flow: `zip` in cloud → `SendUserFile` (returns file_uuid) → `device_commit_files` to `_incoming/` → `device_bash unzip -n` into the target dir. Also `SendUserFile` every deliverable so it survives bridge outages as a download card.
- Files already staged into `/mnt/user-data/uploads/…` remain readable even when the bridge is down.

## 9. Key files
Cloud `/home/claude/apne/`: `AGENT_INSTRUCTIONS.md`, `briefs/` (AUTHORING_BRIEF, BRIEF_COMMON, BRIEF_AUDIO, BRIEF_COGNITION, BRIEF_LANGUAGE), `verify.py`, `verify_committee.py`, `build_review.py`, `aggregate_suggestions.py`, `make_assignments.py`, `apply_critical.py`, `authored_OUTPUT/`, `committee_OUTPUT/`, `review_packets/`, `corrections_assign/`, `corrections_log/`, `corrections_todo.json`, `FLAGS_REPORT.json`, `COMPLETION_NOTES.md` (interim), `STATE_CHECKPOINT.md`, this file.
Project memory: `machineB_status.md` (same status), plus `feedback_sourcing.md`, `feedback_plain_english.md`.

## 10. Flags for Booth (from mb0001–340, 112 blank + topic notes → `FLAGS_REPORT.json`)
Clusters: **coined/not-attested** "X validation"-type phrases (~54), **vendor/brand** names — CloudBounce, eMastered, Ozone, PureDSP, Nanosampler (~29), **transparent compounds** authored at Medium (~26), **game-audio** state terms — Boss/Combat/Defeat music (~6), **topic mismatches** — accordion/free-reed terms under "Strings & Guitar" (~5). These need Booth's ruling (define intended sense, drop, or re-scope topic). Expect similar clusters in mb0341–431; keep logging them.

## 11. Quality bar already achieved (match it)
mb0001–340 after corrections: committee ~98% OK; plain_english mean FK 5.6, 0% over grade 9; `verify.py` and `verify_committee.py` both 0 errors. Notable fixes caught in review incl. an inverted 3:1 mic rule, a backwards fly-by Doppler glide, exponential-FM drift direction, and a unity-gain "buffer boost" contradiction — the committee step is what catches these, so do not skip it.
