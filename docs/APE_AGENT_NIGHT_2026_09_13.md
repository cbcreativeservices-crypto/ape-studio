# Agent night 2026-09-13 — consolidated report

Owner-commissioned overnight run ("bug/error/cognitive learning enhancements +
the store checklist items"). Eleven agents in three waves; every fix reviewed
and committed by the main session with `tsc` clean and the full suite green per
commit. Suite grew **1106 → 1165** (59 new tests). The final adversarial wave
independently re-attacked every surface the night touched: **zero regressions
found** ([audit/night_2026_09_13/adversarial.md](audit/night_2026_09_13/adversarial.md)).

Per-agent detail lives in [docs/audit/night_2026_09_13/](audit/night_2026_09_13/)
(9 files). Commits, oldest first: 275c5a31 · cd7f7273 · f68d41d2 · 3b043e9f ·
b752500b · 4a859abf · 8f7f34a2 · 77ef22ce · fa34f749 (+ this report).

## Fixed and committed

**Enrollment reorder** (enrollment.md): the hidden-row trap (completed topics
ate drag steps — verified by simulation), phantom bundle neighbors, a
PERMANENT scroll-freeze via Hold-to-Remove outlasting the new 500 ms lift,
Home Setup end-of-list hysteresis + stale-lift-on-reopen, 360 dp caption
squeeze beside the wider pill.

**Help system** (help.md): "?" pre-fill now re-applies on an already-open Help
modal; category-title matching so the ToolsHub pre-fill reaches all five
TOOLS & LABS entries; clear-✕ for whitespace input; no-results announced to
screen readers.

**Store checklist** (paywall_store.md, mic_engine_rename.md):
- The worst stranding: a CHARGED buyer could hang forever on the paywall
  spinner if the entitlement refresh rejected — `refreshEntitlement()` is now
  fully guarded and the paywall recovers honestly (Retry/Later, never implying
  the purchase failed).
- Restore Purchases: honest four-state result (found-but-validation-failed is
  an ERROR, never "nothing to restore").
- "Manage subscription" link (iOS/Android store routes); auto-renewal line
  moved above the buy button; Terms · Privacy row added.
- EngineGate: real TRY AGAIN on error, OPEN SETTINGS on denied, Android
  re-request; `onRetry` host wiring is a listed per-site one-liner (the
  FrequencyCounter site belongs to the soak-freeze worktree).
- Mic pre-permission explainer capability added (was a raw OS dialog).

**Error-handling roots** (triad_fixes.md): v3Curriculum failures now propagate
distinctly from emptiness (Strict API + documented lenient wrappers; memo
evicts on rejection so Retry refetches); BROWSE & ADD gained the
loading/error+Retry/empty triad — offline is no longer a silent blank.

## ⚠️ Morning ratification list (drafted, NOT ratified, some visible in dev)

1. **14 paywall strings** (Restore states, manage link, recovery alert, Terms
   row) — listed verbatim in paywall_store.md, each tagged `DRAFT COPY`.
2. **Mic pre-permission copy** in PermissionPrompt (mic_engine_rename.md).
3. **Multimeter rename** — 3 options with exact string diffs; persisted
   identifiers must never change (mic_engine_rename.md §3).
4. Conditional help-copy note: `study-certs` "can be downloaded" is true of
   any build carrying the QR fix (which any build shipping the hub does).

## Owner rulings wanted (proposals only — nothing built)

**Pedagogy top 5** (pedagogy.md, ranked by impact/effort): FIB wrong answers
hold-and-teach (S) · locked methods explain themselves at the tap (S) ·
scenarios explanation requires a tap on a miss (S) · auto "tricky terms"
review list from recorded misses (M) · quiz explanations in wrong_answers
(server — backend frozen, owner call).

**Glossary top 5** (glossary_teaching.md): BEG plain-English as the novice
default (S, ruling) · did-you-mean on zero-result search (M) · unresolvable
RELATED TERMS pills run as a search (S) · tier visibility in the glossary
(revisits the 2026-07-08 no-difficulty ruling — matters once the re-balance
lands) · Common-Mistakes veil over-promises on unauthored terms (content
coverage query — owner/Computer A).

**Performance case lists** (freeze_sweep.md): measurementStore.hydrate parses
up to ~20 MB synchronously (freeze-risk — fix is metadata-first hydrate);
glossary term-index built in-render (60.7 ms Node measured); quiz/exam 4 Hz
full-screen countdown re-renders.

**Pre-existing product items the adversary surfaced** (adversarial.md):
refreshEntitlement never sets tierKnown (post-purchase notifications arm
late); Settings redeem says "Code applied" even if the follow-up refresh
failed; a guest can reach purchase and end up charged-but-locked — launch-list
item.

## Device pass (owner + Pixel — the night could not verify these)

Reorder feel end-to-end (multi-row over mixed heights, Hold-to-Remove while
lifted, Home Setup drag) · BROWSE & ADD offline triad · EngineGate denied/
error cards (incl. "don't ask again") · paywall Restore/manage on a real
build (IAP native half needs a build) · LOADED pill on a 360 dp row ·
the W1 help/coach/intro surfaces from earlier today.

## Also noted

`docs/PRO_AUDIO_TRAINING_ACADEMY_STORE_PLAN.pdf` appeared untracked in docs/
during the evening — not committed, owner to say whether it belongs in the repo.
