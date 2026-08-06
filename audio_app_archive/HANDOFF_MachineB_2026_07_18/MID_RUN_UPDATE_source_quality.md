# ⚠ MID-RUN UPDATE — SOURCE QUALITY RULE (read immediately)

**Issued 2026-07-18 by Prof. Booth, after Machine B had already started. This rule is now permanent and applies to ALL remaining work — authoring, committee review, and corrections.**

The briefs in `briefs/` have been updated with this rule. Re-read `briefs/AUTHORING_BRIEF.md`, `briefs/BRIEF_COMMON.md` and `briefs/BRIEF_AUDIO.md` before continuing.

---

## The rule

**Wikipedia, Reddit, forums, Quora/StackExchange, blogs, SEO/content-farm pages, AI-generated text, and vendor marketing copy DO NOT count toward the required authoritative sources.** They may be used only as an initial pointer to find a primary source — never as corroboration, and never cited in the `sources` array.

Every required source must be one of:
- a **standards body** — AES, NEC/NFPA 70 & 70E, OSHA 29 CFR 1910/1926, ANSI/ESTA E1, IPC (IPC-A-610 / J-STD-001), IEC, IEEE, SMPTE/EBU, ITU, MIDI Association
- a **manufacturer's technical/service documentation or datasheet**
- a **recognised professional text or peer-reviewed source** — Ballou *Handbook for Sound Engineers*, McCarthy *Sound Systems*, Yamaha *Sound Reinforcement Handbook*, Rane technical notes, AES papers — or an established technical journal such as Sound on Sound

**No exception** for any number, unit, tolerance, standard citation, model designation, or safety claim.
Minimum **≥2 qualifying sources** per fact (**≥3** for safety-critical).

**If only non-qualifying sources can be found: LEAVE THE FIELD BLANK AND FLAG IT.** A blank flagged field is correct. A confident wrong answer is a failure. This product certifies technicians who work with mains power and rigging.

---

## What to do about work already completed

1. **From now on:** apply the rule to every remaining packet.
2. **Retro-check what you've already finished:** search your `authored_OUTPUT/` files for any `sources` entry containing `wikipedia`, `reddit`, `forum`, `blog`, `quora`, `stackexchange`, `youtube`, or `medium.com`.
   - If the term still has **≥2 qualifying sources** after removing the non-qualifying one → just delete the offending entry from `sources`. The content stands.
   - If it drops **below 2 qualifying sources** → the fact is not adequately corroborated. Re-verify against a primary source, or blank the field and flag it.
3. **Note it in `COMPLETION_NOTES.md`**: how many terms were affected and how you resolved each.

For reference, Machine A ran this same audit on its first 382 authored terms: 5 terms cited Wikipedia, all 5 retained ≥2 qualifying sources, so only the citation entries needed removing — no content had to be rewritten. Expect a similar low rate.
