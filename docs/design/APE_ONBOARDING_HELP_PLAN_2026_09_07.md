# Onboarding, tutorials & help — plan (2026-09-07)

A design plan for three pillars the owner asked to build: (A) new-visitor welcome & first-run,
(B) tutorials & feature reveals, (C) a help hub. **This is a plan to approve, not built work.** Screens
get designed in the browser with the design skills once a pillar is greenlit. Final user-facing copy is
the owner's to ratify; copy here is a first draft to show intent.

## 0. What already exists (build on, don't duplicate)

| Piece | File | State |
|---|---|---|
| Welcome + "Our Commitment to You" overlays | `src/features/intro/AppWelcomeOverlay.tsx`, `screenIntros.ts` | Finalized copy, live |
| Per-screen intro overlays | `ScreenIntroOverlay.tsx` + `screenIntros.ts` | Glossary, Flashcards (+customize/power) done; Dashboard, Awards, first-user still placeholder (now hidden from users until authored) |
| Per-topic / course learning intro | `LearningIntroSheet.tsx`, `learningIntros.ts` | Shell exists; most topics unauthored ("This intro is being written") |
| Coach-mark primitive | `src/components/CoachMark.tsx`, `src/lib/coachMark.ts` | Works; used once (Glossary "tap a term to expand") |
| Contextual help | calc field ⓘ (`calcPanel.tsx`), lab `helpKey` info popups | Works in labs/calculators |
| About | `src/screens/about/AboutScreen.tsx`, `AboutHomeSheet.tsx` | Exists |
| Replay onboarding hints | Settings → `resetScreenIntros()` | Exists |
| Feedback path | `src/lib/feedback.ts` → `info@proaudiotrainingacademy.com` | Exists |
| Entitlement tiers | `EntitlementProvider` — anonymous / free / academy / lapsed | Drives guest-vs-member branching |

The machinery is largely present. This work is mostly **authoring content, expanding the coach-mark
system, and adding one Help hub** — not building from zero.

## 1. Goals & principles (from 2026 best-practice research)

- **Value in the first ~60 seconds; 3–6 screens max.** The job of the front door is to get a new user
  to first value fast, not to explain everything. Apps lose ~77% of users in the first three days
  without a good first-time experience.
- **Delay signup; let people explore.** Guest browsing plus deferred account creation lifts activation.
  This app is already strong here (no-account glossary + guest mode) — lean into it.
- **Progressive / just-in-time disclosure.** Don't front-load a long tutorial. Reveal a feature the
  first time the user reaches it, one hint at a time, always skippable and remembered.
- **Personalize lightly.** One "what brings you here" goal pick can tailor the suggested first course
  and the empty states; segmentation measurably raises activation.
- **Give a quick win.** For this app the first win is a glossary lookup or completing one study method —
  design the first-run to land the user on one of those, not on a signup wall.
- **Coach marks: ≤3–4 steps, one at a time, prominent skip, visible tap target, behavioral triggers.**
  Overdone overlays annoy; well-placed ones lift feature adoption 40–60%.
- **Help on mobile = searchable FAQ + contextual help, not a doc dump.** Empty states should guide, not
  apologize. Tie into the existing feedback path for "still need help."
- **Measure activation, time-to-first-action, D1/D7 retention, feature adoption.** D7 retention is the
  strongest predictor for edtech; a learner who returns in week one is ~5× more likely to finish.
- **House rules carried through:** the no-ads / no-pay-to-influence ethos (the Commitment overlay), the
  honesty standard (no fake claims), the high visual bar, reduce-motion + screen-reader support, and
  ratified copy. Nothing here overrides those.

## 2. Pillar A — New-visitor welcome & first-run

**Goal:** a brand-new person understands what the Academy is, gets one quick win, and is invited (not
forced) to make an account to save it — all in under a minute.

**Flow (first launch):**
1. **Welcome** (exists) → **Commitment** (exists). Keep; they set trust and the no-ads promise.
2. **One goal question** (new): "What brings you here?" e.g. *Learn the basics · Study for work · Look
   up terms · Explore the tools*. One tap, skippable. Stored on device; seeds the suggested course and
   the home emphasis. No account needed.
3. **Quick-win hand-off** (new): route to the win that matches the pick — the Glossary (look up a term)
   or a Course's first topic — instead of a menu. This replaces the empty "first-user tour" stub.
4. **Save-your-progress invite** (new, deferred): after the first real action (a term expanded, a
   method finished), a light, dismissible prompt: "Create a free account to save this." Never a wall.

**Guest vs member branching:**
- **Guest / anonymous:** steps 1–4 as above; the account invite appears after the first win, and again
  at natural moments (starting a second topic). Honest about what an account adds (saved progress,
  awards) vs what membership adds (deeper content).
- **New member (just created an account):** skip the goal question if already asked as guest; go
  straight to the first study loop with the Dashboard intro (Pillar B).

**Screens / goals:**

| Screen | Goal | Build on |
|---|---|---|
| Welcome, Commitment | Trust, what this is, no-ads promise | exist — keep |
| Goal picker | Light personalization + a destination | new, small sheet |
| First-win hand-off | Land on a real action fast | route logic, not a screen |
| Save-progress invite | Convert to account after value, never before | new, dismissible, reuses paywall/auth |

**Metrics:** % who reach a first action, time-to-first-action, guest→account rate, D1 return.

## 3. Pillar B — Tutorials & feature reveals

**Goal:** teach each screen and feature the moment it's first used, briefly, once, skippable — never a
front-loaded manual.

**Two mechanisms, both already in the codebase:**
- **Screen intros** (`ScreenIntroOverlay`): one short overlay on first entry to a screen. Author the
  remaining placeholders — **Dashboard** ("the study loop: methods → topic quiz → certificate") and
  **Awards** ("trophies, certificates, how quizzes count"). Keep them to a few lines each (research:
  3–6 screens / 3–4 steps).
- **Coach marks** (`CoachMark` + `useCoachMark`): a single pointed hint on a control the first time it
  matters. Expand from the one Glossary use to the highest-value spots.

**Proposed first-reveal map (one hint each, first encounter, then retired):**

| Screen | Reveal | Trigger |
|---|---|---|
| Dashboard | The four study methods + the topic quiz gate | first Dashboard entry (screen intro) |
| Dashboard | The rotary/jog control | first time it's on screen |
| Tools hub | Tap a tile to open a live meter; the color-wheel is member customization | first hub entry |
| A meter tool | Range / weighting / hold controls | first tool open |
| Lab | The adjustment sliders + info ⓘ | first lab entry |
| Awards | How a topic banks toward a certificate | first Awards entry |
| Flashcards | (done) | — |
| Glossary | (done) | — |

**Rules (from research):** one at a time; prominent Skip / "Got it"; dismiss anywhere; remembered per
key; visible tap target; respect reduce-motion (the app's `animationsAllowed()`); never block a timed
activity (quiz/exam). A **"Replay tips"** control (Settings already has the reset) re-arms them.

**"What's new" (optional, later):** a single small reveal after an update highlighting one new thing —
version-gated, dismiss-once. Low priority; note for post-launch.

**Content to author:** Dashboard intro, Awards intro, ~6 coach-mark lines, optional first-user tour
copy. All short; owner ratifies.

## 4. Pillar C — Help hub

**Goal:** a person who is stuck finds the answer in the app without leaving, and can reach a human if
not — searchable, contextual, not a documentation dump.

**Structure:**
- **A Help screen** reachable app-wide (from Settings, and a light "?" affordance on major screens).
  Contents: a **searchable FAQ** (grouped: Getting started · Accounts & membership · Studying &
  certificates · Tools & labs · Troubleshooting · Privacy & data), each answer short with a link to the
  relevant screen ("Open the Glossary"). Mobile-appropriate: FAQ + contextual, not a full doc portal.
- **Contextual "?"** where it's missing — reuse the lab/calc ⓘ pattern on the harder screens (meters,
  labs, the tuner FULL SCREEN, dashboard method gating).
- **"Still need help?"** routes to the existing feedback path (`sendFeedback` → info@), pre-tagged with
  the screen so replies have context. No new inbox.
- **Empty states as help:** every "nothing here yet" surface (no enrollments, no awards, no bookmarks,
  search no-results) gets a one-line what-to-do-next, not a dead end. (Several already exist; this
  audits and fills gaps.)
- **Reset / replay** onboarding hints lives in the Help screen too (currently only Settings).

**What NOT to do:** don't port a giant external knowledge base into the app; keep answers short and
task-focused; link out to the website's help pages (once they exist) for depth.

**Content to author:** ~20–30 FAQ entries; contextual "?" text for ~4 screens; empty-state lines. Owner
ratifies; some can reuse existing ratified copy.

## 5. Cross-cutting

- **Accessibility:** every overlay/coach mark labelled, dismiss control has a role/label, reduce-motion
  respected, and nothing colour-only — consistent with the a11y pass already done.
- **Analytics:** the reveals and first-run steps are the natural place for the deferred analytics tracers
  (see memory `seo-analytics-backlog`) — instrument activation, step completion, and skip rates when
  analytics is chosen. Spec only; no provider wired yet.
- **Dev + reset:** keep the `alwaysShowIntros` dev bypass and the "Replay onboarding hints" reset so QA
  and the owner can re-see everything.
- **Governance:** honesty and no-ads ethos, ratified copy, high design bar, no competitor names — all
  carried through. Copy in this doc is draft intent for the owner to finalize.

## 6. Build order & open decisions

**Recommended phasing:**
1. **Pillar B first** — it's the smallest lift (author 2 placeholder intros + ~6 coach marks on
   existing machinery) and immediately removes "unfinished" feel from the core screens.
2. **Pillar A** — the goal picker + first-win routing + deferred save-progress invite.
3. **Pillar C** — the Help hub + contextual "?" + empty-state sweep (largest content lift).

**Decisions for the owner before building:**
1. **Goal picker** — include the light "what brings you here?" personalization, or keep the first-run
   copy-only with no questions?
2. **Help hub location** — a full Help screen from Settings + a "?" on major screens, or start with just
   the Settings Help screen?
3. **Coach-mark density** — the ~6 spots above, or a tighter set (e.g. Dashboard + Tools only) to avoid
   over-guiding?
4. **Copy** — do you want to write the final overlay/FAQ copy, or should I draft it for your ratification
   per screen as I build?
5. **"What's new"** — in scope now, or defer post-launch?

## Sources
- Plotline — Best Mobile App Onboarding Examples 2026: https://www.plotline.so/blog/mobile-app-onboarding-examples
- DesignStudio — Mobile App Onboarding Best Practices 2026: https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/
- VWO — Ultimate Mobile App Onboarding Guide 2026: https://vwo.com/blog/mobile-app-onboarding-guide/
- Digia — Onboarding: Activation, Patterns, Retention: https://www.digia.tech/post/mobile-app-onboarding-activation-retention/
- NN/g — Instructional Overlays and Coach Marks for Mobile: https://www.nngroup.com/articles/mobile-instructional-overlay/
- Docsie — Coach Marks: Definition, Examples & Best Practices 2026: https://www.docsie.io/blog/glossary/coach-marks/
- Userpilot — Tooltip Best Practices 2026: https://userpilot.com/blog/tooltip-best-practices/
- Whatfix — In-App Support Best Practices: https://whatfix.com/blog/in-app-support/
- Userpilot — In-App Resource Center: https://userpilot.com/blog/in-app-resource-center/
- Userpilot — Customer Onboarding in EdTech: https://userpilot.com/blog/customer-onboarding-in-edtech/
- eLearning Industry — Onboarding Practices for EdTech: https://elearningindustry.com/best-user-onboarding-practices-for-edtech-companies
