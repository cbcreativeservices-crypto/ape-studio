# Onboarding, tutorials & help — plan (2026-09-07)

A design plan for three pillars the owner asked to build: (A) new-visitor welcome & first-run,
(B) tutorials & feature reveals, (C) a help hub. **This is a plan to approve, not built work.** Screens
get designed in the browser with the design skills once a pillar is greenlit. Final user-facing copy is
the owner's to ratify; copy here is a first draft to show intent.

> **Launch spec folded in (2026-09-07):** the owner supplied a formal research report,
> *New-User Help, Onboarding, and In-App Tutorials* (dated 2026-09-04), grounded in Apple/Android/
> NN/g/WCAG guidance. It confirms this plan's direction and resolves the five open decisions in §6.
> The report's additions — a layered help architecture, a versioned help-content data model, an
> analytics event taxonomy, a launch acceptance checklist, and a validated 8-item launch help
> inventory — are captured in §§7–12 below. Those sections now govern the build.

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

### 2.0 Cinematic intro video (owner spec, 2026-09-07)

Before the sampler-loop choices appear, play a short **video intro** — a montage that flashes through the
app's screens quickly, produced by the owner — so a brand-new person is inspired by seeing the app before
being asked to choose where to start. It leads directly into the "What would you like to do first?" screen.

**Sequence:** branded launch → `appWelcome` + Commitment (existing) → **intro video** → sampler-loop
choices (§2.1). (Ordering adjustable; the video is the emotional hook that sets up the choice.)

**Behavior:**
- **Plays once**, as part of the one-time onboarding. Once onboarding completes (user reaches Home, §2.1
  step 10), it never auto-plays again; it stays replayable from Help/Settings.
- **Always skippable** — a visible **Skip** from the first second (user-control rule + report §21).
  Auto-advances to the choices when it finishes or on Skip.
- **Muted by default** with an unobtrusive sound toggle (mobile autoplay-with-sound is hostile; also
  respects users in public/quiet settings).
- **Reduce-motion:** when the OS reduce-motion setting is on (`animationsAllowed()` = false), do **not**
  force the video — go straight to the choices (or offer a static hero the user can tap to play). Nothing
  in the flow may require watching the video to proceed (report §15.4: don't require motion to understand).
- **Accessibility:** the player has an accessible label, the Skip control a role/label; if the montage
  carries any meaningful text, provide captions or a text equivalent; keyboard/screen-reader can reach
  Skip immediately.

**Asset & delivery — DECIDED (owner, 2026-09-07): BUNDLE it in the app.**
- **Owner produces the video file.** Give it to me and I'll wire it in. Until then the screen ships behind
  a feature flag / falls back straight to the choices, so a missing asset never blocks first-run.
- **Bundled** = plays instantly, works offline on first launch. Keep it short and compressed (target well
  under ~10–15 MB; a ~10–20 s montage at a sane bitrate, H.264/MP4, portrait to match the app).

**Build implication (important):** the app has **no video library today** (`expo-video`/`expo-av` are not
installed) and no video assets. Playing video needs a native module — the current SDK-57 choice is
**`expo-video`** (the `expo-av` Video component is deprecated); it requires a config-plugin entry and,
because it is native, **a new dev build before it can be tested on device** — it will not light up in the
stale dev client, and web-preview video support is limited. Per [[never-build-without-explicit-go]] I will
NOT start any build; this just flags that the intro video is gated on the next native build. Add a row to
`docs/APE_NEXT_BUILD_CHECKLIST.md` when we implement it (see [[next-build-checklist]]). Before writing any
code I'll read the exact v57 `expo-video` docs per [[integrity-and-governance]].

### 2.1 First-launch guided exploration — the "sampler loop" (owner spec, 2026-09-07)

The first-run choice is **not** ordinary navigation that dumps the user onto a screen and ends. It is a
one-time, first-launch guided exploration that lets a brand-new person SAMPLE parts of the app and return
to a dedicated continuation screen between visits, arriving at Home only when they choose to.

**Flow:**
1. Show **"What would you like to do first?"** (the START-CHOICE-01 choices).
2. User selects a destination.
3. Open that destination **immediately**.
4. **Suppress that destination's normal intro pop-ups, walkthroughs, and educational prerequisite
   screens** while sampling (see carve-outs below).
5. When the user backs out, return them to a **special onboarding continuation screen — NOT Home.**
6. Ask: *"How was your first experience? Was that helpful?"* then *"Would you like to explore something
   else?"*
7. Re-display the starting choices, marking anything already visited **✓ Explored** (still selectable).
8. If they pick another option, open it directly and repeat the loop.
9. Always offer **"I'm ready — take me to the Home screen."**
10. When they choose Home, **mark this onboarding sequence complete permanently; never auto-show it again.**

```
First-launch choices → selected destination → back/finish
      ↑                                            ↓
      └──── "Helpful? Explore something else?" ────┘
                          │ finished
                          ▼
                      Home screen  (onboarding complete, permanent)
```

**CRITICAL carve-outs — suppress help, never suppress required gates.** The sampling suppression covers
ONLY educational surfaces: `ScreenIntroOverlay` / `IntroSheet`, `LearningIntroSheet`, `CoachMark`
(`src/lib/coachMark.ts`), and lab orientation intros (e.g. `AmplitudeOrientation`). It must **NOT** bypass:
microphone permission requests, essential safety warnings, legal/consent, membership/entitlement
restrictions, or anything technically required for a feature to run safely — those still appear when
needed. (`MIC-RATIONALE-01`, `TOOL-CAL-01`, safety, and the paywall/entitlement gate all stay live.)

**Implementation notes (build on existing machinery — do not rebuild):**
- The suppression is a **new, separate flag** — mirror the shape of `popupSuppressStore.ts`
  (`useOverlaysSuppressed()` / `setPopupsSuppressed()`, key `ape:devSuppressPopups`) but as its own
  `onboarding-sampling-in-progress` state. Do **not** reuse the dev kill-switch (it suppresses ALL popups
  including ones we must keep) and route it **only** through the educational consumers listed above, never
  through permission/entitlement/safety code paths.
- This loop **replaces the `firstUserWelcome` placeholder** intro in `screenIntros.ts` (currently a
  PLACEHOLDER "guided first-run tour"). `appWelcome` + Commitment still run first (steps 1–2 of §2).
- Persist two things: the **visited set** (which choices show ✓ Explored) and a permanent
  **onboarding-complete** flag (set when Home is chosen; gates the whole loop off forever). The existing
  Settings → "Reset onboarding hints" (`resetScreenIntros()`) should also clear these so QA/owner can
  re-see it.
- Respect `animationsAllowed()` for any transitions; the continuation screen and its questions are
  layer-1 orientation, kept short.

**Continuation-screen copy (draft, owner ratifies):** *"What would you like to explore next? You can visit
another part of Pro Audio Training Academy or continue to your Home screen."* Visited choices read
**✓ Explored**.

### 2.2 Curated "immediate payoff" destinations (owner spec, 2026-09-07)

The strongest first-run choices land the user on an *interesting result almost immediately*, not on a
menu. This supersedes the earlier broad routing (glossary→hub, learn→dashboard, tools→hub). The four
curated choices and their exact destinations:

| Choice | Destination | Immediate payoff | In app today |
|---|---|---|---|
| **Audio calculation** | Distance-to-Delay calculator | Enter a distance → see sound's travel time (10 ft ≈ 8.9 ms · 25 ft ≈ 22.2 ms · 50 ft ≈ 44.4 ms); why it matters: aligning speakers, mics, video, distributed systems | ✅ Calc Lab `distdelay` / `distToDelay` |
| **Glossary** | Decibel (dB) term | "A decibel is not a fixed amount — 0 dB does not always mean silence" (ratio, logarithmic, dB SPL vs dBFS vs dBu, dB don't add numerically) | ✅ PublicGlossary opens on a query ("Decibel") |
| **Sound fundamentals** | "How Sound Travels" | Speaker cone → alternating compression/rarefaction → the familiar waveform; user adjusts **frequency** (pitch), **amplitude** (level), **wavelength** (cycle distance) | ⚠️ NOT built — new interactive (adapt Foundations/Amplitude viz) |
| **Acoustics** | "Why Rooms Change Sound" | A room with speaker + listener + surfaces animating **direct sound, early + late reflections, absorption, diffusion**; user swaps a wall (concrete → absorption) and watches reflected energy + decay change | ⚠️ NOT built — new interactive (room calculators exist, no animated room) |

**HARD RULING (owner 2026-09-07): NO NEW SCREENS — the first-run journey uses ONLY existing labs and
screens.** So the two net-new visualizers (#3 "How Sound Travels", #4 "Why Rooms Change Sound") are OUT
as new builds; the "sound fundamentals" and "acoustics" payoffs must map to the closest EXISTING screen
(e.g. an existing Foundations/Amplitude lab; an existing room/reverb lab or room calculator). #1
Distance-to-Delay and #2 Decibel already exist. Connective handoffs must reuse existing navigation; at
most a small in-screen link/button may be added (that is not a new screen), and any such addition is
flagged for owner review.

**Connected-journey direction (owner 2026-09-07):** the stops should RELATE, not sit as isolated samples
— each existing destination hands off to a related next one (e.g. Career Finder ↔ Decibel term ↔ its
calculator ↔ Distance-to-Delay calc ↔ a related existing lab). Career Finder placement (start vs end) and
the exact ordering are being designed by an expert agent against the real existing content graph; §2.2's
four choices reconcile with the §2.1 loop (✓ Explored / continuation / end at Home).

These four replace the glossary/learn/tools triad in `FirstRunSampler` (`OnboardingChoice` becomes
`'calc' | 'fundamentals' | 'acoustics' | 'glossary'`); the loop mechanics (§2.1), hushing, visited/✓
Explored, and completion are unchanged.

### 2.3 The connected path — one concept, several ways (owner spec, 2026-09-07)

This supersedes the isolated four-choice model in §2.2. The first run threads ONE concept — **sound
level / decibels** — through several EXISTING screens, and after each stop the continuation screen
RECOMMENDS the next connected experience (contextual, not a static menu). Shared example carried
throughout: *"A loudspeaker measures 90 dB SPL at 1 m — what happens as that sound travels through a room?"*

**The stops (all existing screens — NO new screens):**

| Stop | Payoff | Existing route |
|---|---|---|
| Sound Fundamentals | amplitude → sound level | `AmplitudeLab` |
| Decibel (dB) | what 90 dB represents (ratio, log, 0 dB ≠ silence) | `PublicGlossary` `{query:'Decibel'}` |
| Distance & SPL calc | predict level at distance (~84 dB @2 m, ~78 dB @4 m, free field) | `CalcWorkspace` `{id:'spldist'}` |
| Acoustics / Wave Physics | why a real room differs (reflections/absorption/diffusion) | `WaveLab` |
| SPL Meter | measure the user's actual environment | `SplMeter` |
| Career Finder | careers using these concepts | `CareerFinder` |

**Recommended order (but the user may begin anywhere):** Fundamentals → Decibel → Distance/SPL calc →
Acoustics/Wave → SPL Meter → Career Finder (or curriculum). The app just RECOMMENDS the next connected
step after each return.

**Contextual continuation (the key change to §2.1's loop):** the return screen recaps what was just
learned and offers the connected next steps + "Choose something different" + "Take me to the Home screen".
Owner's example copy (voice to match; owner ratifies):
- After **Decibel**: *"Now you know what a decibel represents. Want to use it?"* → Calculate how level
  changes with distance · Measure the sound around you · See how a room changes sound · Choose something
  different · Home.
- After **Calculator**: *"That calculation assumes no room reflections. Want to see what changes inside a
  real room?"* → Open the Acoustics Lab · Measure sound around me · Choose something different · Home.

The tagline this proves: **Look it up. Understand it. Calculate it. See it in action. Measure it. Apply
it.** — features stop feeling like separate collections and become one interconnected system.

**Reconciles with §2.1:** same loop shell — enter sampling (educational overlays hushed), open the
existing screen, return detected from nav state, ✓ Explored marks, end permanently at Home. The
continuation is now CONTEXTUAL (keyed to the last stop) instead of a flat menu. `OnboardingChoice` becomes
the stop ids `fundamentals | decibel | calc | acoustics | splmeter | career`.

### 2.4 Guided LINEAR flow (owner feedback, 2026-09-07) — supersedes the menu model

The first run is a **guided walkthrough**, not a pick-any menu. The user is walked from start to finish
IN ORDER (no jumping/skipping ahead); only at the END do they get the menu to go back/revisit, then exit
into the app.

**Shape:**
1. **Intro video** (§2.0, owner-supplied) leads.
2. **Linear walkthrough** — the stops in a fixed order. For each: a short lead-in (optionally a video
   interlude, owner-supplied) → open the existing screen → on return, a **step-complete** panel that
   recaps and offers a single **"Next"** forward action (the connected recap copy from §2.3 becomes the
   bridge to the next step). No skip-ahead, no mid-flow menu.
3. **End** — after the final stop, present the **menu** of all stops (✓ Explored) so the user can **go
   back / revisit** any, plus **"Enter Pro Audio Training Academy"** to exit into the app (marks
   onboarding complete permanently, lands on Home).
4. An unobtrusive **"Skip onboarding"** escape stays available throughout (accessibility / user-control
   per the research report §21) — the walkthrough is linear, not a trap.

**SKIP the amplitude orientation in onboarding (owner ruling 2026-09-07):** the required "Understanding
Level & Amplitude" screen is NOT part of the walkthrough — users meet it later when they open a gated
tool/lab and it triggers then. (Already hushed during sampling.) Because the earlier "Sound Fundamentals"
stop routed to `AmplitudeLab`, which IS that screen, that stop is **dropped** from the flow.

**Linear order (owner confirmed 2026-09-07):** Foundations of Sound — Module 1 (canned interactive) →
Decibel (canned glossary demo) → Distance & SPL (`spldist` calc, real) → Acoustics / Wave (`WaveLab`,
real) → SPL Meter (`SplMeter`, real) → Career Finder (real). The opener is a CANNED interactive
Foundations Module 1 (custom buttons) — NOT the real amplitude/orientation screen, which stays out of
onboarding. Arc: **See what sound is → Look it up → Calculate → See it in a room → Measure → Apply.**

**PRELOAD — no lag at any stop (owner requirement 2026-09-07):** each destination must be cached and
ready BEFORE the user reaches it in the sequence, so there is no load spinner mid-flow.
- **Glossary / Decibel (the big one):** `GlossaryScreen` already session-caches the corpus via a memoized
  loader (GlossaryScreen.tsx §"Session cache", ~26.8k rows, ~3s cold). Export a `prefetchGlossary()` that
  kicks that same memoized loader, and call it in the BACKGROUND when onboarding starts (during the intro
  video). By the time the glossary step opens, the promise is resolved → the Decibel entry is instant.
  (Beware the "MEMORY RELEASE VALVE" that drops the cache on background — prefetch is best kicked near the
  step, and the memoized promise survives normal foreground use.)
- **Supabase-backed labs/data:** warm any remote data the upcoming stop needs the same way (a small
  per-stop `prefetch()` the coordinator calls one step ahead).
- **Purely local/bundled screens (Calc `spldist`, WaveLab, Career Finder index):** already instant in a
  production build (JS is resident); no network warm needed. The SPL Meter's LIVE signal can't be
  "cached" (it's real-time mic), but its screen is light — prefetch nothing there.
- Implementation: a tiny `samplerPrefetch` map (stop id → optional async warm fn) the coordinator fires
  for the NEXT stop as the user advances, plus a kick of the glossary prefetch at flow start.

**Reuse:** the committed coordinator (root overlay + nav-return detection + hushing + persistence +
completion) and stores stay. What changes: `FirstRunSampler` gains a linear "step-complete → Next" mode
and an "end menu → Enter app" mode; the coordinator tracks a linear index instead of free choice. The
in-definition links found live (the Decibel entry has a "calculator" link; a "Open the Audio Calculator
Laboratory" button) can reinforce the same thread.

### 2.5 Scripted Decibel glossary step (owner spec, 2026-09-07)

The Decibel stop is a guided, scripted demo inside the real `GlossaryScreen`, gated behind an
"onboarding demo mode" flag (route param or the sampling flag + target term). Behavior, in order:
1. **Auto-type animation:** the search field types `decibel` one letter at a time (`search`/`setSearch`
   + `searchRef`, GlossaryScreen.tsx:916-917) → results settle (the field's green "settled" state).
2. **Highlight the card:** a pulsing highlight ring animates around the Decibel card in the list,
   prompting the tap.
3. **On tap → CARDS view, single card:** open the Decibel term in **card view** (`cardView`,
   GlossaryScreen.tsx:960 + `openPopupRoot(id)`) so no other definitions show after it.
4. **Beginner (plain-English) mode forced ON** — plain-English at the top (BEG; `begFirst` path,
   GlossaryScreen.tsx:592-596).
5. **View + scroll only:** the demo restricts interaction — no filters/mode toggles/other cards; the user
   can read and scroll, tap the one highlighted card, and continue.
6. **Common Mistakes shown for dB this once — even though locked:** to show the user what exists (not just
   that it's locked). After onboarding the lock returns; **dB-only, onboarding-only.**
   ✅ **RESOLVED (owner 2026-09-07): CANNED.** The Common-Mistakes shown here are demo/authored content
   (owner ratifies) — NOT a real unlock. No server change, no `has_academy_access()` toggling.

### 2.6 Canned-demo principle (owner ruling 2026-09-07)

The onboarding is a **pre-cached, self-contained DEMO that looks real** — it does NOT have to function
against the live backend or flip real privileges, EXCEPT at the "key landing points" where it drops the
user onto the real screen. Consequences:
- **No backend wait / fully pre-cachable:** scripted moments (the "decibel" search-typing, the term
  results, the Common-Mistakes reveal, a member-only lab peek, bypassing the amplitude orientation) are
  canned/animated — they don't fetch or gate, so there's nothing to wait on and everything can be bundled.
- **No privilege on/off switching:** the demo never grants or revokes academy access, never unlocks gated
  content for real. It SHOWS what exists (e.g. Common Mistakes, member labs) as demo content; the real
  locks stay exactly as they are outside onboarding.
- **Key landing points are real:** at chosen stops the user genuinely lands on the live screen (e.g. the
  SPL Meter to measure their real room, the calculator to enter a value). Those are the real handoffs.
- This SUPERSEDES the earlier need for an ungated fetch or a `mistakesReadable` real-unlock, and softens
  §2.4's preload work: canned steps need no corpus prefetch at all; only real-landing screens may warrant
  a warm.

**Per-stop: real landing vs canned demo (owner confirmed 2026-09-07):**
| # | Stop | Treatment |
|---|---|---|
| 1 | **Foundations of Sound — Module 1** | **Canned interactive demo** — a bespoke look-real render with CUSTOM interactive buttons authored for the intro (NOT the real gated Foundations course; avoids the amplitude-orientation pre-req). The opener that shows "what sound is." |
| 2 | Decibel (dB) | **Canned** scripted glossary demo (type → highlight → single card, BEG, Common Mistakes shown) |
| 3 | Distance & SPL calc | **Real landing** — user enters a value in the live calculator |
| 4 | Acoustics / Wave | **Real landing** (owner: real) |
| 5 | SPL Meter | **Real landing** — measure the user's actual room |
| 6 | Career Finder | **Real landing** (owner: real) |

Real-landing screens all get the persistent "‹ Back to the walkthrough / Skip intro" escape bar (added
2026-09-07) so no destination can strand the user.

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

**Decisions — now resolved by the 2026-09-04 research report** (owner still ratifies final copy):
1. **Goal picker** — ✅ **include it.** The report makes the optional goal choice its recommended first
   experience (`START-CHOICE-01`): *Search a term · Learn a topic · Use an audio tool · Skip for now*.
   One tap, skippable, routes straight to a useful screen — never followed by a whole-app tour. Route to
   the free Glossary as the strongest first-value path (no account required).
2. **Help hub location** — ✅ **full Help screen + a consistent per-screen "Help for this screen" route.**
   The report treats a consistent, always-in-the-same-place help affordance as launch-critical (WCAG
   Consistent Help), plus a goal-organized searchable help center. Not Settings-only.
3. **Coach-mark density** — ✅ **five to eight high-value tips across the whole app, one interruption at a
   time.** Tighter than the earlier ~6-spot list; validate each against a real risk (see §11 inventory).
4. **Copy** — I draft per screen to the report's copy standard (§9-report: 2–6-word title, 1–2 short
   sentences, one action, one new concept), owner ratifies. Unchanged from the plan.
5. **"What's new"** — ✅ **defer** to returning-users / Priority 2, exactly as before. The report agrees:
   never first-run feature advertising.

The rest of §6 (recommended B→A→C phasing) still holds and now maps onto the report's Priority 0/1/2 in §12.

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

---

# Launch spec (from the 2026-09-04 research report)

The sections above are the design intent; the sections below are the operating rules the build follows.
Core principle throughout: **use the least interruptive layer that solves the problem** — a better label
beats a tooltip; an inline note beats a modal; a small real task beats an intro slide.

## 7. Layered help architecture

Seven layers, least-interruptive first. Reach up a layer only when the one below can't do the job.

| Layer | Purpose | PATA implementation |
|---|---|---|
| 0. Self-explanatory UI | Prevent confusion before help is needed | Visible labels, familiar icons, headings, strong selected states, units, disabled-state reasons |
| 1. First-run orientation | Get to first value | Optional goal choice (glossary / learning / tools), then straight to a useful screen |
| 2. Contextual discovery | Reveal one useful hidden feature | A single first-use tip near Favorite, Resume, calibration, or display controls |
| 3. Interactive quick start | Teach a novel sequence by doing | Guided sample for RTA, SPL, spectrogram, labs, calculators — replayable |
| 4. Embedded reference | Concepts that must stay available | "How to read this," calibration, units, limitations, safety, formulas |
| 5. Searchable support | Recall + long-tail questions | Help center organized by goal, screen name as secondary route |
| 6. Recovery & feedback | Turn problems into next steps | Inline validation, permission recovery, offline/empty states, undo |

Existing machinery maps on: `ScreenIntroOverlay` = layer 1/2; `CoachMark`/`useCoachMark` = layer 2;
lab/calc ⓘ popups = layer 4; the new Help hub (Pillar C) = layer 5; empty states + `sendFeedback` = layer 6.

## 8. Contextual-tip rules (layer 2)

**Eligibility — a tip shows only when ALL are true:** on the screen with the feature · feature is useful
to the current task · action not already done · not dismissed too many times · nothing else (modal,
permission, error, other tip) is competing · the target control is visible and stable · the tip's
`content_version` still matches the current app version. Allow organic discovery first unless missing the
knowledge causes failure, a safety risk, or a dead end.

**Content:** action-oriented title (2–6 words) · one benefit OR one instruction (1–2 short sentences) ·
one primary action · plain language matching the visible label · **one new concept per tip.** Never
"Did you know?", never a title that just repeats the feature name, never theory paragraphs, never promo.

**Placement:** point at the exact stable control; never cover the target or the data needed to decide;
reposition for size/orientation/keyboard/large-text/insets; if the target is offscreen, navigate to it or
use inline education — never point into empty space; dismissing a tip must not auto-trigger the control.

## 9. Interactive quick starts (layer 3)

Each: state the goal → use a **clearly labeled** demo signal / example data → ask the user to do one
action → show immediate feedback → explain what changed and why → end on a real next action → stay
replayable from Help. Controls on every quick start: Skip · Back · Exit · Restart · "Don't show
automatically again" · "Open full guide". Show progress for multi-step; never trap in an incomplete state.
First candidates: **RTA** (find strongest region → change averaging → freeze) and **SPL** (inspect Demo
Mode with no mic permission → weighting/response in place → mic rationale on live → persistent calibration
status). Never present demo/simulated data as live; never imply instrument-grade precision.

## 10. Help-content data model + lifecycle

Treat every tip/tutorial as **versioned content**, not a scattered hard-coded flag. Fields:
`help_item_id · content_version · surface · trigger · audience · eligibility_rules · presentation
(inline|popover|sheet|dialog|walkthrough) · anchor_id · title · body · primary_action · reopen_path ·
max_impressions · completion_event · safety_level · analytics_id · introduced_version · retired_version`.

Lifecycle: `unseen → eligible → shown → (dismissed | completed | snoozed) → retired`.
Rules: completing the taught action retires the tip; dismissing ≠ comprehension; **safety/reference content
never retires**; a revised tip reappears only on a meaningful change; a Settings/Help reset re-arms
everything; deep links, offline, interrupted sessions, and updates must not orphan tutorial state.
`animationsAllowed()` (reduce-motion) governs any motion. The existing `ape:intro:<key>` /
`resetScreenIntros()` are the seed of this — generalize keys into this record shape as the system grows.

## 11. Initial launch help inventory (validate each, don't ship blindly)

| ID | Trigger | Pattern | Purpose | Completion |
|---|---|---|---|---|
| START-CHOICE-01 | First meaningful launch | Optional orientation + sampler loop (§2.1) | Route to glossary / learning / tools, sample & return | User chooses "take me to Home" (permanent) |
| GLOSS-FAV-01 | 2nd glossary term opened, no favorite yet | Rich tip | Explain quick-reference value | Favorite added |
| LEARN-RESUME-01 | Return with an in-progress topic | Inline tip | Make Resume obvious | Topic resumed |
| LAB-PREP-01 | First lab start | Inline checklist | Confirm purpose, materials, safety | Prep reviewed |
| TOOL-DEMO-01 | First measurement-tool open | Inline card | Offer demo before permission | Demo or live chosen |
| MIC-RATIONALE-01 | User selects live analysis | Rationale sheet | Explain mic need + alternatives | Continue / demo / cancel |
| TOOL-CAL-01 | First live tool use, unknown calibration | Persistent inline warning | Prevent false confidence | Calibration opened / acknowledged |
| CALC-EXAMPLE-01 | First calculator open | Optional worked example | Teach inputs, units, output | Example loaded / calc completed |

Never let two of these compete in one session. `MIC-RATIONALE-01`, `TOOL-CAL-01`, and safety content are
layer-4/persistent, not disposable tips.

## 12. Permissions, safety, analytics, priorities

**Microphone:** ask in context (when the user starts a live feature), never at install/first-launch.
Rationale sheet states the benefit + a Demo Mode alternative; copy must be technically accurate about
whether audio stays on-device (do not claim "on-device only" until engineering + privacy confirm every
path incl. third-party SDKs). On denial: preserve Demo/reference, offer Settings where the OS allows,
do not re-prompt repeatedly. (Ties to memory `never-default-dbfs` honesty stance and the app's calibration
notices.)

**Safety & measurement limits** are layer-4/persistent, never a one-time tooltip: hearing-exposure
cautions, electrical/rigging cautions, device/mic/calibration limits, RT60 & calculator assumptions, and
an unmistakable line between live / simulated / example data. Severity: informational = inline note;
could-invalidate-results = persistent warning at the measurement; could-cause-harm = pre-action warning +
persistent route back. Avoid alarm fatigue.

**Analytics (spec only — no provider wired; see memory `seo-analytics-backlog`):** instrument the layered
events — `onboarding_{started,choice_selected,skipped,completed}`, `help_tip_{eligible,impression,
dismissed,action_selected,completed,reopened}`, `tutorial_{started,step_completed,abandoned,completed}`,
`help_center_opened`, `help_search_{submitted,zero_results}`, `permission_{rationale_viewed,requested,
result,recovery_selected}`, `first_value_completed`. Params include `help_item_id`, `content_version`,
`screen`, `trigger`, `app_version`, `platform`. **Success = task outcomes** (time-to-first-value, task
success, permission-denial recovery, tool start→valid-result, lab start→completion), NOT tutorial
completion or tip click-through. No raw audio / sensitive free text / unnecessary IDs in params.

**Launch priorities (map onto §6 B→A→C):**
- **P0 (pre-launch):** label/icon audit · consistent "Help for this screen" route · mic rationale +
  denial recovery · calibration/limits/safety content · the 5–8 tips above · replay/reset · empty-state &
  error pass · a11y pass (screen-reader, large-text, target-size ≥44pt iOS / 48dp Android, reduced-motion)
  · core analytics baseline · one critical-task usability round.
- **P1 (first 30 days):** interactive quick starts for the hardest tool + lab · expand searchable help
  from zero-result searches · in-app feedback route carrying screen + app_version · compare new/
  experienced/instructor before personalizing.
- **P2 (evidence-led):** personalize entry points only if segments differ · What's New for returning
  users · one-tip-at-a-time wording/timing experiments · retire tips that don't improve task outcomes ·
  convert repeated help needs into UI fixes.

A per-launch **acceptance checklist** (clarity · first-run · tips/tutorials · permissions/trust · safety/
accuracy · accessibility · measurement) accompanies this spec in the report §24; treat it as the go/no-go
gate for the onboarding/help surface, not a nice-to-have.
