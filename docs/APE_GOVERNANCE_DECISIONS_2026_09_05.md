# APE Governance Decisions — 2026-09-05

Decisions of record made by the owner on 2026-09-05. Where this document and memory or code disagree, this document wins (with `docs/SCREEN_STATUS.md`).

## R1 — Competitor organisations in product copy (STANDING RULE)

**Ruling (owner, 2026-09-05):** no competitor association, training body or certification programme is named anywhere in product copy — labs, glossary, Career Finder, web — **unless its published document is the governing technical source for a specific rule**, and then only as a citation.

**When a citation is the governing source, it is presented neutrally:**
- cite by the **accredited designation** (e.g. `ANSI/AVIXA F502.01:2018 — Rack Building for Audiovisual Systems`) under an **"American National Standard"** header — the organisation never gets the bold header row, a logo, a link, or a description of what it does;
- no mention of the organisation's **certifications** (e.g. CTS) anywhere;
- the organisation is **never listed as a data source** for our own content (career families, curriculum, descriptions) — if material was informed by such a body, it is described generically ("industry association publications") or replaced;
- the citation sits behind the existing honesty line ("References only — this lab summarizes principles in its own words and never reproduces standards text").

**Why:** naming a competitor's standard by title is legal and normal (facts and titles carry no protection, and the Cable Dressing lab reproduces no standards text), so the exposure is commercial — handing a direct competitor credibility and a storefront on our own screen. The professional reader still expects the governing document to be cited; the rule keeps the citation and removes the billboard.

**Applied 2026-09-05 (AVIXA, a direct competitor):**
| Where | Before | After |
|---|---|---|
| Cable Dressing & Installation lab — source registry (4 entries, referenced by 14 rules) | header **AVIXA**, documents `F502.01 — …` | header **American National Standard**, documents `ANSI/AVIXA F502.01:2018 …`, `ANSI/AVIXA F502.02:2020 …`, `ANSI/INFOCOMM F501.01:2015 …`, `ANSI/INFOCOMM 10:2013 — Audiovisual Systems Performance Verification` (the last corrected from a loose "e.g. A102.01", which is the audio-coverage standard, not the verification one) |
| Cable lab — "standard" category blurb | "(TIA, BICSI, AVIXA, AES, ISO/IEC…)" | "(TIA, BICSI, AES, ISO/IEC and ANSI-accredited AV standards…)" |
| Career Finder — two career families' `sources` | "AVIXA" listed beside BLS / O*NET, SBE, SMPTE | removed (the remaining sources carry the entry) |
| Career Finder — About screen, organisations cross-checked | "…, AVIXA, SMPTE, …" | AVIXA removed (this paragraph is NOT yet ratified copy — it is in the Career Finder copy sheet awaiting ratification) |

**Not changed, for the owner's awareness:** "NAMM" appears as a source in two career families (music-products trade association — not judged a competitor). No other association that could be read as a training competitor (CEDIA, SynAudCon, Full Sail, Berklee, SAE…) appears in `src/`.

**How future work applies it:** any new lab source registry or Career Finder data pass runs `grep -riw "avixa\|infocomm\|cedia" src/` before commit; a hit outside a neutral ANSI citation is a defect. Internal code identifiers (`avixa_f502_01` in the Cable lab registry) are not copy and are fine. The Career Finder builder (`scripts/build-career-index.py`) now drops these organisations from family `sources` at build time, so a rebuild from the workbook cannot re-introduce them; the workbook's "Sources & Method" sheet itself is the owner's and was not touched.

## R2 — Builds are started only on the owner's explicit, same-moment go (STANDING RULE)

**Ruling (owner, 2026-09-05):** no assistant or agent starts an EAS build (`eas build`, any profile, any platform) — or any other billed or externally visible action: `eas submit`, credential changes, store metadata, purchases, publishing — without the owner saying **yes at that moment**, in their own words, to a one-line ask that names the profile, the platforms and what the build carries.

**What does not count as authorization:** a "then build new versions" line in an earlier brief or task list; a previous day's approval; the fact that the tree is green; a demo deadline. Those are plans. The go is given when the work reaches the build step, not before.

**Why:** builds are billed, consume version numbers and produce artifacts the owner then has to manage and install; the owner decides profile and timing at that moment. On 2026-09-05 two development builds (iOS build 14, Android versionCode 10) were started from the morning brief's closing line without a fresh go — the owner kept them but ruled this must never recur.

**How future work applies it:** when a task chain reaches "build", stop, post the one-line ask, and wait. A build the owner started is never cancelled or restarted by an assistant. Recorded in assistant memory as `never-build-without-explicit-go`.
