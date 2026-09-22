# AP&E — Bug-Hunt Standard (standing)

**How we look for bugs in this app.** Undated on purpose: this is the method,
not a campaign. It outlives any one hunt.

| Doc | What it is |
|---|---|
| **this file** | the METHOD — how to hunt, how to prove, how not to waste a night |
| `docs/bughunt/BRIEF.md` | the LEDGER — what each pass found, what is fixed, what is still open. **Read it before a hunt so you do not re-report.** |
| `docs/APE_ENGINEERING_LESSONS.md` | the cumulative lessons from real incidents |

Written 2026-09-22 from the week of incidents that produced the glossary app
hang, the tester's frozen phone, the offline queue that deleted answers, and the
membership audit. Sources for the external research are at the end.

---

## 0. The prime directive

> **Hunt the failures that do not announce themselves.**

Every defect that actually reached a user in this app was silent. The record:

| Incident | Threw? | A test could catch it? | How it surfaced |
|---|---|---|---|
| Glossary app hang (26,975-row scan) | no | no | Sentry |
| Tester's frozen phone | no | no | a human complained |
| Scenarios never completed, for anyone | server-side, rolled back | no | querying production |
| Time Trial credit never written | yes — swallowed by design | no | querying production |
| Offline queue deleting answers | **no — the server returned _success_** | no | reading the server function |

Not one would have been caught by running the suite. They share one signature:

> Something fails, the failure is caught or simply absent, and the app carries
> on reporting success.

A second recurring shape, just as expensive: **two sources of truth that
disagree** — the client mirror vs. the server gate, the printed number vs. the
announced number, access vs. tenure. Anything the app decides twice is a
candidate.

Style, complexity and "code smells" are not what we hunt.

---

## 1. The five rules

### R1 — Every finding arrives with a receipt
A claim is not a finding. A receipt is one of: a query run against the live
database, a test that **fails before the fix and passes after**, a reproduction
on the Pixel, or a Sentry event. Without one it goes on a *suspected* list, never
a fix list.

### R2 — Verify the test, not just the fix
After writing a regression test, **revert the fix and confirm the test fails.**
A test that passes against the broken code is worse than no test: it certifies
the bug. This is not optional and it is cheap.

### R3 — The finder never grades its own finding
A separate pass, fresh context, sees the claim and the code but **not** the
reasoning that produced it. Its job is to *refute*. This works: our third
staggered run disproved 1 finding, downgraded 2, confirmed 27, and found 14 more.

### R4 — Hunt by failure mode, not by file
"Review the codebase for bugs" produces noise. "Find every `await` that can never
settle" produces a list you can act on. One named class at a time (§3).

### R5 — Fix the instrumentation before adding passes
Sentry found a production hang unprompted while a human was reading code.
Detection scales; inspection does not. **App hangs and ANRs are native-only
signals the JS layer cannot observe** — no amount of code reading substitutes for
having them reported.

---

## 2. Prompt discipline — the counterintuitive part

False positives, not missed bugs, are the failure mode of AI-assisted hunting.
curl closed its bug bounty programme after AI submissions drove the confirmed
rate below 5%. We have our own examples: an agent reported 14 unused photos when
3 of them were referenced in code; another proposed a queue fix that would have
destroyed study-time credit; a third flagged a link path that was deliberate and
pinned by a test. Each was plausible, confident and wrong.

So:

- **Write plain prompts.** Research finds that demanding explanations and
  suggested corrections *increases* misjudgment — elaborate asks bias the model
  toward finding fault. Name a failure mode, a scope, and what counts.
- **Never pre-absolve.** Framing code as probably-fine cuts detection by
  **16–93%**, and asymmetrically: false negatives spike while false positives
  barely move. Do not write "this is probably fine, but check".
- **Say what does NOT count.** "Report only cases where the user gets no error
  and no resolution — not general error-handling style" is the sentence that
  keeps a pass useful.
- **Expect a reviewer asked for gaps to produce gaps.** Tell it to flag only what
  affects correctness or a stated requirement, and to treat the rest as optional.
- **"I found nothing in X" is a real result.** Do not pad. Say it.

### Confidence is part of the finding
State it. A confidently-wrong finding costs more than a missed one, because it
gets fixed. If unsure, say what would settle it.

### Severity (unchanged from `BRIEF.md`, repeated so this file stands alone)
- **BLOCKER** — data loss, money, a safety promise not kept, a crash, a paid
  feature free, a free feature locked.
- **MAJOR** — a flow that cannot be completed, wrong information shown as fact.
- **MINOR** — cosmetic, copy, inconsistency.

---

## 3. The domain playbooks

Each is a named hunt with a ready prompt and a **calibration check** — a bug we
already know exists in that area. *If a pass misses the calibration bug, the pass
was weak and its "found nothing" means nothing.*

### A. Silent failures (run this one first, always)

> Find every place in `src/` where a failure can happen and the app carries on as
> if it succeeded. Specifically: an `await` on something that may never settle; a
> `catch` that swallows an error without surfacing or retrying it; a
> `Promise.all` where one member hanging leaves a screen with no data and no
> error; a fallback chain whose branches all fail the same way; and any RPC whose
> error field is checked but whose *successful no-op response* is not.
>
> For each, say what the user sees when it happens. Rank by whether the screen
> becomes unusable. Report only cases where the user gets no error and no
> resolution — not general error-handling style.

**Calibration:** `fetchTopicItems`' three "fallback" paths all terminate at the
same relation, so one denial kills every one. A fallback that shares the failure
mode of the thing it backs up is not a fallback.

### B. Navigation logic

> Build a map of every route in the navigator: who can reach it, from where, and
> in what account states (signed out, guest, free, member, admin). Then find:
> screens reachable in a state they do not handle; navigation that pushes a
> second copy of a tab or screen instead of returning to the existing one; a back
> action that lands somewhere impossible or exits the app; a modal opened while
> another modal is already open; and any screen reachable with required params
> missing or stale.
>
> Report the route, the path to reach it, and what the user sees. Not styling,
> not naming.

**Calibration:** HOME must use `popTo`, never `navigate` — RN7 pushes a second
tab shell. And on Android a `Modal` rendered as a *sibling* of an open `Modal`
renders behind it.
**Standing rule:** labs never block navigation. Credit may be withheld;
movement never is.

### C. Enrollment, progress and certification — map before you hunt

This is a state machine and it has never been written down. That is why three
different definitions of "member" could coexist unnoticed. Research is clear that
**state-based specifications find more implementation issues than property lists**
— so build the map first.

**Step 1 — the map (no fixing):**

> Produce a single state diagram of a learner's journey: enrol → study methods →
> method gates → topic quiz → co-requisites → required labs → final exam →
> credential. For each transition name the exact thing that authorises it — table,
> column, RPC or client check — and whether the client and server use the *same*
> source. Mark every place where two different things decide the same question.
> Do not propose fixes.

**Step 2 — invariants against that map:**

> Find violations of these, with evidence for each: progress can never decrease;
> a gate the server opens is never shown closed by the client, or the reverse;
> every "you have earned X" message corresponds to a write that actually
> succeeds; crediting the same work twice never increases a counter; a tenure or
> progress clock never restarts without positive evidence the run ended; and no
> achievement can be earned by a path that bypasses its stated requirements.

**Calibration:** `credit_time_trial` implemented only the retired course model,
so it threw `not_enrolled` on all 175 v3 topics while the UI said the method was
cleared — and the client swallowed the error by design.
**Standing trap:** `public.users.id` ≠ `auth.uid()`. Translate at the top of any
function that writes a user-scoped row.

### D. Audio tools — displays, controls, synchronisation

Three sub-hunts, because they fail differently.

**D1 — does the number mean what it says?** Golden-signal testing: feed a known
signal, assert the readout within a stated tolerance. A full-scale sine is the
reference; peak and RMS have defined relationships you can assert against.

> For each measurement tool list what it claims to display, the unit, and the
> tolerance that implies. Then find: any readout computed by a different path
> from the one that drives its own display; any unit conversion applied twice or
> not at all; any value clamped for display but used unclamped downstream, or the
> reverse; and any averaging or hold time that does not match the label.

**Calibration:** `LedMeterWell` printed 12% while announcing 14%, because the
accessibility label re-derived the value from the rounded segment count.
**Any displayed value that is reconstructed rather than passed is a candidate.**

**D2 — control → engine → readout round trip:**

> Trace every user control to the engine parameter it sets and back to the
> readout that reports it. Find controls whose change is not reflected in the
> readout; readouts updating from local state rather than the engine's actual
> value; controls operable while the engine is stopped or the mic is dead with no
> indication; and any parameter that resets silently on remount, backgrounding or
> an audio-route change.

**D3 — time and sync:**

> Find anywhere a visual update and the audio it represents can drift apart: a
> display driven by its own timer rather than the audio callback; a transport
> position from wall-clock instead of the engine; animation continuing after the
> transport stops; and any readout holding its last value instead of blanking
> when the source goes away.

---

## 4. Known traps that generate confident-wrong findings

State these up front in any prompt touching the area, or you will get a
well-argued fix that cannot work.

- **False clipping over-report is NATIVE**, not JS. A pass reading JavaScript
  will "find" the latch logic and propose fixes that do nothing.
- **Bare `/topics` is deliberately claimed** and pinned by `test/linkPaths.test.ts`.
- **`.easignore` / `.gitignore` line endings are fingerprint inputs.** Do not
  "tidy" them. Changing one silently breaks OTA.
- **Some comments assert facts about data and have gone stale.** The glossary
  formula scan carried two confident comments — "no role holds the grant", "0 of
  14,246 rows" — that were both false by the time they mattered. **Re-check any
  comment that claims a count, a grant or a permission before trusting it.**
- **`GREATEST`/`LEAST` ignore NULL in Postgres**, so a NULL meaning "unlimited"
  loses to any finite value.
- **Agents mis-count.** Verify any number in a finding before acting on it.

---

## 5. Run protocol

**Read-only on source.** Parallel agents must not edit; conflicting edits are
worse than the bugs. An agent may run `npx tsc --noEmit`, `npm test`, and any
read-only command, and may write only its own report.

⛔ **Never**, for any reason, in any pass: `eas build`, `eas update`,
`eas submit`, `git push`, or any billed or external action. Never add, delete or
commit image assets. Publishing needs the owner's word in the moment.

**Staggering beats swarming.** Runs that report to each other — each reading the
last one's findings — caught more than parallel runs, because run N can refute
run N−1 (R3) instead of duplicating it.

**Scope each agent narrowly.** Unscoped "investigate the app" fills context with
file reads and returns generalities.

**Before the hunt:** read `docs/bughunt/BRIEF.md` so fixed and known-open items
are not re-reported. Add new results to it; keep this file for method changes.

---

## 6. After the hunt

1. Sort by severity, then by whether a receipt exists.
2. Refute pass (R3) on everything above MINOR before any code is touched.
3. Fix with a test, and check the test against the pre-fix code (R2).
4. Anything needing an owner ruling goes on a list — do **not** guess at product
   decisions, pricing copy, or anything outward-facing.
5. Append durable lessons to `docs/APE_ENGINEERING_LESSONS.md`; append the
   pass ledger to `docs/bughunt/BRIEF.md`.

---

## 7. Tooling

- **`/code-review ultra`** — multi-agent cloud review of the current branch, or
  `/code-review ultra <PR#>` for a GitHub PR. Same architecture this standard
  describes: parallel finders plus a verification stage. **User-triggered and
  billed — the owner runs it; an agent must not attempt to.** Needs a git repo;
  the no-arg form bundles the local branch and needs no GitHub remote.
- **Subagents in a fresh context** for the refute step (R3).
- **Hooks** are deterministic where a doc rule is only advisory.
  `test/noRawAlert.test.ts` is the pattern: a rule nobody can break by accident.
  Prefer converting a repeated finding into a test or hook over restating it.
- **Plan mode** for §3C step 1, where the job is reading, not editing.

---

## Sources

- [Best practices for Claude Code — Anthropic](https://code.claude.com/docs/en/best-practices)
- [Code Review for Claude Code — Anthropic](https://claude.com/blog/code-review)
- [Refute-or-Promote: Adversarial Stage-Gated Multi-Agent Review (arXiv)](https://arxiv.org/pdf/2604.19049)
- [OpenAnt: LLM-Powered Vulnerability Discovery (arXiv)](https://arxiv.org/html/2606.19149v2)
- [Uncovering Systematic Failures of LLMs in Verifying Code Against Specifications (arXiv)](https://arxiv.org/pdf/2508.12358)
- [App hangs — Sentry React Native docs](https://docs.sentry.io/platforms/react-native/configuration/app-hangs/)
- [Model Based Testing with Logical Properties versus State Machines — Springer](https://link.springer.com/chapter/10.1007/978-3-642-34407-7_8)
- [Audio Signal Visualisation and Measurement — Robin Gareus (x42)](https://x42-plugins.com/x42/static/meters.pdf)
