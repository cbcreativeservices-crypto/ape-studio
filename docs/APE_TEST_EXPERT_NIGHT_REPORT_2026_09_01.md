# Test Expert Night — Morning Report (2026-09-01)

**The commission:** three Test Expert agents hunting bugs all night — every
button, every combination, the wrong thing on purpose; easy + low-risk fixes
executed and pushed per fix; anything with doubt filed with full analysis.

**The result: 4 waves · 13 agent runs · 54 fixes pushed (~30 commits) ·
~35 items filed for your judgment. tsc clean at every commit; a final
verification wave re-attacked the night's own fixes on a fresh bundle.**
Full per-finding detail: `docs/APE_TEST_EXPERT_NIGHT_2026_08_31.md`.

---

## The catches that mattered most

| # | What was wrong | Now |
|---|---|---|
| 1 | **14 calculator outputs displayed 1000×/35×/39× wrong** (double unit conversion; several chainable into other calculators). "DELAY PER METER 2914 ms." | All 14 pass base units; verified 2.914 ms live |
| 2 | **dBu↔dBV computed −2.214 against its own pinned formula's −2.218** | Constant now the exact √0.6 reference |
| 3 | **A method with 1 unstudied item wore the green ✓** and unlocked the next stage (Math.round made 99.5% = 100) | Gates read the un-rounded value |
| 4 | **FIB + Matching clobbered the device progress mirror** — one answer offline destroyed the rest (the exact bug you fixed for Flashcards on 08-17; siblings never got it) | Ported verbatim |
| 5 | **CheckQuestion could fire onSolved once per same-frame tap** — one Cable final-check answer credited 3 of 10, and an over-count could jam the lab's `=== 10` gate forever | Fires exactly once + tolerant gate |
| 6 | **The MultiMeter snapshot stored raw dBFS labeled "dBC"** and always claimed "uncalibrated" (violates your 08-12 store-as-displayed ruling) | Stores as displayed, honest status |
| 7 | **Mic tools could spin "Starting…" forever** — two stacked causes: a start that can hang with no watchdog, and an auto-start the hub's Skia loops could defer indefinitely | 12s watchdog + auto-start fallback; reproduced sequence now starts |
| 8 | **"and", "it", "or" linked to the AND/IT/OR glossary terms** in nearly every definition | Acronyms link only when written in caps |
| 9 | **Members were upsold the membership they own** (13 field-topic cards → paywall; the Paywall itself would start a duplicate store purchase) | COMING SOON for members + purchase guard |
| 10 | **MatchCurve gave 95% for doing nothing** and could deal an unwinnable first hand (2-band target, 1 band) | Flat = 0; first deal matches |
| 11 | **Log out / Delete-confirm / redeem results were dead on web** (Alert no-op) + the master notification switch could disagree with the device scheduler | Shared confirm shim + mirror rides the success path |
| 12 | **Dose/Leq safety calculators silently dropped unpaired intervals** | "CHECK INPUTS" note announces the drop |

Plus: ~10 button-in-button nests dismantled (lab accordions, enrollments,
flashcard, redeem modal, tool popups), ARIA states restored to every switch on
web, the "inert" dimmed notifications group made truly inert, tier gates
verified sane in all four tiers, the cross-tab wipe cascade killed, and the
POP_TO_TOP warning class extinguished.

## What held under attack (your prior work)

Every headline fix from the 08-31 design pass survived adversarial re-testing:
flat-score-0, Detective persistence + idempotence, the Bass crash guard (40
rapid taps), FM's alias split, Mic Selection's spoiler gate, the Coverage
falloff + SPKR/FILLS controls, hub done-ticks, dev-tier reload survival — and
**34+ Skia screens crossed in one session with zero CanvasKit failures**.

## 📱 For you this morning

| Step | Where 📍/📱 | What |
|---|---|---|
| 1 | 📱 phone | Reload both phones — both Metros were restarted with clean caches at dawn; the fresh bundle carries all 54 fixes |
| 2 | 📍 `docs/APE_TEST_EXPERT_NIGHT_2026_08_31.md` | The FILED list (~35 items) — the judgment calls: two RATIFIED-COPY math errors that need your re-ratification (compressor example says "3 dB" where the truth is 9; RF example off 10 dB), the guest SAVE funnel, the possibly-unreachable calc weekly cap, feedback's personal-Yahoo recipient, quiz/final-exam feedback gap, back-during-transition double-pop, dashboard method-row tap area |
| 3 | 📱 phone | Spot-check the night's NEW COPY (flagged in every commit): check-input notes, timeout messages, locked-cap labels, member notices |
| 4 | 📍 repo | `git log --oneline -40` reads as the night's changelog — every commit is one finding, separately revertable |

*Carve-outs honored all night: no safety/honesty copy touched, no owner-ruled
visual reversed, backend untouched, no accounts, no emails, no sound.*
