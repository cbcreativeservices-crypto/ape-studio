# Pass 4 · Agent F — Does the app speak with one voice?

Axis: every word the user reads. Terminology, error-message audience, button labels,
capitalisation and typography, tone, truncation, spelling.

**Method.** Extracted every string literal and every JSX text node in `src/` (≈106,000
candidate strings after stripping comments, style values, base64 and hex), then filtered
to prose and counted each competing term across the whole corpus so that every claim below
carries a number rather than an impression. Every finding I report was then re-verified by
reading the live file — several files changed under me mid-pass (see *Verified fixed*).

**Verified fixed during this pass.** The six "report this to your professor" strings named
in the brief are **gone**. `quiz/api.ts:93-94`, `finalExam/api.ts:108/110` and
`auth/api.ts:70/104` now read "please contact support" / "We could not find your account
record". Confirmed on the live files. The only remaining `professor` in `src/` is
`AboutScreen.tsx:69` ("under the direction of a college professor"), which is a true
biographical statement about the founder and should stay. **Two strings of the same class
were missed — see F-2.**

---

## PART 1 — Terminology decisions the owner needs to make

Each one is a fork the owner has to pick, with my recommendation and the number of
user-facing strings that would change.

### T-1. The thing the customer buys has **nine** names on the buttons and **five** in the prose. ★ decide first

The button that navigates to `Paywall` (31 call sites) is labelled nine different ways:

| Label | Where |
|---|---|
| `UNLOCK ACADEMY ACCESS` | `features/commercial/StudyAccessSheet.tsx:76` |
| `SEE PLANS` | `features/commercial/UpgradeSheet.tsx:63` |
| `EXPLORE MEMBERSHIP?` | `components/PrePaywallPrompt.tsx:46`, `EnrollmentScreen.tsx:1894`, `GlossaryScreen.tsx:3202` |
| `Get Academy membership` | `MembershipGate.tsx:87`, `GlossaryLockView.tsx:135` (a11y) |
| `See membership` | `helpContent.ts:83`, `CalcLabScreen.tsx:46`, `CalcProjectsScreen.tsx:86`, `CalcWorkflowsScreen.tsx:82/90`, `CalcWorkspaceScreen.tsx:175` |
| `See membership plans` | `FinalExamScreen.tsx:452` |
| `UPGRADE TO ACADEMY` | `TubeCardScreen.tsx:388`, `TubeReferenceScreen.tsx:96`, `ToolAcademyLock.tsx:22`, `ProfileScreen.tsx:1090` |
| `RENEW ACADEMY` | `ProfileScreen.tsx:1090` (lapsed branch) |
| `🔒 ACADEMY MODE` | `CourseSelectionScreen.tsx:570`, `:902` |

And the *product* itself is named five ways, three of them inside one file (`lib/copy.ts`):

| Name | Count | Examples |
|---|---|---|
| **Academy membership** | 42 strings, 24 files | `MembershipGate`, `helpContent`, `finalExam/api.ts:97`, `copy.ts` glossaryFreeAllowance |
| **Academy Mode / academy mode** | 11 strings, 4 files | `copy.ts` ×5 (both casings), `CourseSelectionScreen` ×4, `PaywallScreen` |
| **Academy access** | 7 strings, 5 files | `PaywallScreen` ×3, `StudyAccessSheet`, `GlossaryScreen` |
| **Lifetime Academy** (plan name) | 1 | `PaywallScreen.tsx:31` |
| **subscriptions** | 1 | `copy.ts:79` betaPricingNote |

`lib/copy.ts` alone contains `academy mode` (lowercase, ×3), `Academy Mode` (Title Case, ×2),
`Academy membership`, `lifetime academy access`, `lifetime academy membership fee` and
`subscriptions` — for one product. The free side is equally split: Profile shows
`REFERENCE MODE` (`ProfileScreen.tsx:466`), Help says "the free tier"
(`helpContent.ts:188`), the paywall says "The free glossary".

> **Recommendation:** one product noun, **Academy membership**; one CTA verb, **SEE
> MEMBERSHIP** (all-caps in `GlassButton`/`CtaButton`, sentence case in `TextLink`/help
> jump rows). Retire "Academy Mode", "Academy access", "Reference Mode" and "subscriptions"
> from user-facing copy. **~70 strings**, most of them in `lib/copy.ts` (9), the six calc
> screens (6), and the four `UPGRADE TO ACADEMY` sites.
> **Caveat:** `lib/copy.ts` is headed "VERBATIM — do not reword. Route changes to
> governance." This decision is the owner's, not mine, and the file says so explicitly.
> Every other site is free to change.

### T-2. `course` is retired, but 11 live strings still say it — including three the customer meets at a failure

`topic` wins **170 strings / 41 files** against `course`'s 31, and of those 31 the
majority are false positives (the Foundations lab's own name; the tuner's mandolin
"courses", which is correct instrument terminology). **11 are live curriculum-sense
"course" and should be "topic":**

| File:line | String |
|---|---|
| `features/quiz/api.ts:87` | "Complete the Safety topic quiz before starting **course topics**." |
| `features/quiz/api.ts:91` | "You are not enrolled in this **course**." |
| `features/quiz/api.ts:92` | "**Course** content was updated — return to the Dashboard." |
| `screens/dashboard/DashboardScreen.tsx:891` | "No enrolled **courses** found for this account." |
| `screens/awards/AwardsScreen.tsx:854` | "the 3 **core courses** every student completes" |
| `screens/awards/AwardsScreen.tsx:925` | "the 3 **core courses** every student completes" |
| `screens/profile/ProfileScreen.tsx:643` | "Full **Course** Certification" |
| `features/intro/LearningIntroSheet.tsx:54` | eyebrow "**COURSE** INTRO" (from `DashboardScreen.tsx:1145`) |
| `screens/tools/ToolsHubScreen.tsx:1017` | a11y "Back to **course** selection" |

`AwardsScreen.tsx:854/925` is the worst of these because it contradicts itself on screen:
the chooser header says "**core courses**", and the `REQUIRED CORE` list rendered directly
beneath it — built from a constant literally named `COREQ_TOPIC_GS` — calls the same three
things **topics**. A customer choosing what to pay for reads two names for one requirement
in one viewport.

> **Recommendation:** **topic** everywhere. 11 strings. `ProfileScreen.tsx:643` needs more
> than a word swap — see F-4.
> (`ProfileScreen.tsx:1155/1160` also say "course", but I traced `commercialProfileOnly = true`
> at `:451` and the `if` block closing at `:1102`: everything from `:1104` is the retired
> MIRAMAR COLLEGE branch and is **not user-visible**. Excluded.)

### T-3. The Level-1 award has two names; the Level-2 award's headline is the *other* award's noun

| Surface | Level 1 | Level 2 |
|---|---|---|
| Tab (`AwardsScreen.tsx:87-93`) | Certificates | Programs |
| Page headline (`:95-101`) | "Specialize. Learn. Get Certified." | "Complete Certificate Programs" |
| `awardsData.ts` headline | **SPECIALIZATION CERTIFICATE** | **PROFESSIONAL CERTIFICATE** |
| `awardsData.ts` tier title | Academy **Specialization** Certificate | Professional Certificate Program |
| Chooser button (`AwardsScreen.tsx:158/161`) | CHOOSE A **SPECIALIZED** CERTIFICATE | CHOOSE A PROGRAM PATH |
| Thumb chip (`CredentialThumb.tsx:40`) | **SPECIALIZED** CERTIFICATE | — |
| Trophy Case empty (`catalog.ts:306/307`) | "**specialization** certificates" | "professional program credentials" |
| Celebration kicker (`catalog.ts:215/228`) | CERTIFICATE EARNED | PROFESSIONAL PROGRAM COMPLETED |
| `awardsData.ts:107` intro | — | "**Academy Program Professional Certificates**" |

Two live problems:

1. **"Specialization Certificate" (9 strings) vs "Specialized Certificate" (5 strings)** —
   the same award, two names, both prominent, both on the Awards stack. This is the name
   that goes on a résumé.
2. **The Programs page headline is `PROFESSIONAL CERTIFICATE`** (`awardsData.ts:102`) —
   the word "Certificate" is the big headline on the page that is *not* the Certificates
   page. A buyer comparing the two tiers sees CERTIFICATE on both.
3. `"Academy Program Professional Certificates"` (`awardsData.ts:107`) is a four-noun
   pile-up that means nothing on first read.

> **Recommendation:** Level 1 = **Specialization Certificate** (drop "Specialized" — 5
> strings). Level 2 = **Professional Program** (drop "Professional Certificate" from the
> headline and tier title — 3 strings; rewrite `:107` to "Academy Professional Programs
> recognize…"). Keep **credential** (64 strings) as the umbrella word covering both, which
> is already how `celebration/catalog.ts` and the Trophy Case use it. **~10 strings.**

### T-4. The Progress tab opens a screen called TROPHY CASE

Bottom tab label is `PROGRESS` (`components/nav/NavIcon.tsx:26`, a11y "Progress" at
`TabBar.tsx:81`). The screen it opens is titled `TROPHY CASE`
(`AchievementsHomeScreen.tsx:95`), and 16 strings across `catalog.ts`, `helpContent.ts`,
`screenIntros.ts` and `ProfileScreen` refer to "your Trophy Case". The code calls it
`Achievements`. Three names; two of them user-visible, on the same tap.

> **Recommendation:** pick one for the user. **TROPHY CASE** is the better name and it is
> already load-bearing in 16 strings of celebration and help copy; change the tab label
> (1 string + 1 a11y label). If the tab is too narrow for "TROPHY CASE", keep PROGRESS and
> retitle the screen — but then 16 strings move, so the tab is the cheaper edit.

### T-5. The assessments have two names each

- Topic level: **"Topic Quiz"** (Dashboard chip, `helpContent.ts` ×3, `screenIntros.ts`)
  vs **"the assessment"** (`AboutHomeSheet.tsx:49/50` — "complete the assessment for a
  topic").
- Award level: **"Final Exam"** (~25 strings, consistently capitalised as a proper noun)
  vs **"the final assessment"** (`awardsData.ts:85`, on the Certificates page intro).

`awardsData.ts:85` is the single sentence that tells a buyer what they must do to earn the
certificate, and it uses a name that appears nowhere else in that flow.

> **Recommendation:** **Topic Quiz** and **Final Exam**. **3 strings.** Cheapest high-value
> fix in this report. (The labs' own end-of-lab "final assessment" in `AmpModuleScreen`
> and `connectorselect` is a different object and can stay.)

### T-6. One destination, three names

Home card title: **"Audio Fundamentals & Advanced Training Labs"**
(`CourseSelectionScreen.tsx:711`) → button **OPEN LABS** (`:716`) → the screen that opens
is titled **"AUDIO LEARNING"** (`AudioLearningScreen.tsx:66`), offering **EXPLORE
FUNDAMENTALS** and **Advanced Training Labs**. `navigation/types.ts:205` documents the card
as "Audio Fundamentals & Training Lab" (singular). Nothing the user tapped is named on the
screen they land on.

> **Recommendation:** title the destination **AUDIO FUNDAMENTALS & TRAINING LABS** to match
> the card. **1 string.**

### T-7. "Login" vs "Sign in"

`AuthScreen.tsx:500` labels the existing-account button **`Login`** (rendered `LOGIN` —
`StudioButton` uppercases internally). Everywhere else the same action is **Sign in**:
`UpgradeSheet.tsx:75` `SIGN IN`, `GlossaryDeviceKeyView.tsx:90` `SIGN IN INSTEAD`,
`SettingsScreen.tsx:730-731` "Sign in / create account" + `SIGN IN ›`,
`CalcWorkspaceScreen.tsx:275` `SIGN IN / CREATE ACCOUNT`, `PaywallScreen.tsx:202`,
`CalcProjectsScreen.tsx:79`, `AwardProgressScreen.tsx:153`, `CredentialWall.tsx:247`.
Nine "Sign in" against one "Login", and the odd one out is the *first screen a returning
customer sees*.

> **Recommendation:** `Sign In`. **1 string.**

### T-8. US vs UK English — the app is US, 147 strings are UK

The house dialect is unambiguous: `organiz` 43–0, `analyz` 77–0, `recogniz` 21–0,
`modeling` 11–0, `catalog` 14–0, `defense` 4–0, `practice` 99–0. Broken in:

| UK form | Count | Worst files |
|---|---|---|
| **colour** (vs color 131) | **70** | `LedColorPicker.tsx`(7), `GalleryArt.tsx`(6), `WaveformScreen.tsx`(5), `pagesAdvC.tsx`(4), `NoiseLabScreen.tsx`(4), `ColorWheelButton.tsx` |
| **centre** (vs center 148) | **49** | `mixing/pagesB.tsx`(7), `cymatics/presets.ts`(6), `guidedLessons/content.ts`(4), `calc/workspaces/micsRf.ts`(4) |
| **licence** (vs license 28) | **12** | `preprod/stage3.data.ts`(8) |
| **travelling** (vs traveling 10) | 6 | `cymatics/faraday.ts`(2) |
| **grey** (vs gray 23) | 5 | `deesser`(2), `gain/modules/modLearn`(2) |
| **theatre** (vs theater 23) | 4 | `subjectMeta.ts`, `families.ts`, `preprod/stage1`, `MyProfileView` |
| **fibre** (vs fiber 69) | 1 | `connectors.recognition.ts` |

Two of them collide inside a single string:
`ColorWheelButton.tsx:82` a11y label **"Customize colours"** (US verb, UK noun), and
`DeEsserLabScreen.tsx:333` **"Grey: before · colour: after"** — both UK, on a screen whose
neighbours say gray/color.
`ColorWheelButton.tsx:75` `pickerTitle = 'CHOOSE A COLOUR'` is a visible modal title.

> **Recommendation:** US English. ~147 strings; scriptable in one pass with a
> word-boundary replace over `src/**/*.{ts,tsx}` restricted to those seven words. I would
> do the **9 `ColorWheelButton` / `LedColorPicker` strings by hand now** (they are visible
> UI chrome in a component literally named `ColorWheelButton`) and schedule the rest.

---

## PART 2 — Findings by severity

### MAJOR

**F-1 · `modWaveA.tsx` prints `125 HZ` / `4 KHZ` beside `250 Hz`, in an app with a
codified rule against exactly that.**
`src/screens/lab/wave/modules/modWaveA.tsx:484-488`, `:502-503`, `:913`, `:938-939` — ten
occurrences of `HZ` / `KHZ`. The house style everywhere else keeps SI casing even inside
all-caps labels (`RT60 @ 125 Hz`, `RT60 · 1 kHz`, `LPF 2 kHz`, `NOMINAL AT 1 kHz`,
`ABOVE 2 kHz`). The rule is *codified in code*: `features/glossary/glossaryShare.ts:68-85`
carries a `UNIT_FIXUPS` table whose comment reads "an uppercased `DB`/`KHZ` would be wrong
in an audio glossary", mapping `HZ→Hz`, `KHZ→kHz`.

The visible damage: on the absorption rack the first readout is built with `fmtHz(freq)`
and renders `α @ 250 Hz`, while the three below it are hardcoded `α @ 125 HZ`,
`α @ 4 KHZ`, `RT60 @ 500 HZ`. Correct and incorrect casing of the same unit, adjacent, in
one bezel. In a product that sells audio credentials this reads as not knowing the unit.
One more instance outside this file: `features/tools/learn/signalgen.ts:30` "EQUAL ENERGY
PER **HZ** VS PER OCTAVE".
*Fix:* 11 strings. `HZ`→`Hz`, `KHZ`→`kHz`. **Confidence: high** (rule verified in code).
`dB` is clean throughout — the only `db` hit in the corpus is a CSS colour token.

**F-2 · Two "student record" error strings survived the professor sweep — on the
Dashboard, the screen a signed-in customer opens first.**
- `screens/dashboard/DashboardScreen.tsx:893` — "This account is not linked to a **student
  record**. Complete registration first."
- `screens/dashboard/DashboardScreen.tsx:1487` — "You're signed in, but this account isn't
  linked to a **student record** yet — showing the free topics. Finish setting up to save
  progress, or sign out to switch accounts."

These are the *same sentence pattern* the fix pass just corrected in `quiz/api.ts:94` and
`finalExam/api.ts:110` to "We could not find your account record." A paying customer hitting
a stranded session is told they are missing a *student record* — a term from the retired
institutional data model that means nothing to them and implies they were supposed to
enrol through a school.

Compounding it: the recovery button beside `:1487` is labelled **"Complete Registration"**
(`:1492`, also `:1212`) while the sentence above it calls the same action **"Finish setting
up"**. "Registration" is the class-code flow's word; the button actually navigates to
`Auth`. Two names for one button, one of them from the retired mode.
*Fix:* 2 strings + 2 button labels. Suggest "We could not link this account yet" /
"Finish Setting Up". **Confidence: high.**

**F-3 · Six guided-lesson PRO TIPS are written to an instructor, not to the paying
customer reading them.**
`features/lab/guidedLessons/GuidedLessonSheet.tsx:116` renders `lesson.proTips` under the
heading **PRO TIPS**, on every lab's "Open the guided lesson" sheet. Six of them address a
teacher with a class:

| Line | Text |
|---|---|
| `content.ts:58` (EQ) | "**Teach** Q with pink noise: the same +6 dB boost at Q=0.7 vs Q=8…" |
| `content.ts:93` (Delay) | "Use Freeze / Peak-Hold to let **students** predict the next echo…" |
| `content.ts:160` (Stereo) | "Show the Lissajous while widening so **students** see the stereo decorrelation." |
| `content.ts:234` (Phaser) | "Sweep Manual with the LFO OFF first, so **students** see notches as a position…" |
| `content.ts:419` (Noise) | "Put white and pink side-by-side… and let **students** hear both" |
| `content.ts:567` (Stereo) | "**Teach** with pink noise + a centered vocal: widen and watch…" |

Plus `content.ts:581` (Harmonograph `whatItIs`, also rendered): "Driven by two oscillators,
**students** hear the interval while watching the figure."

A solo professional who paid for the Training Labs opens PRO TIPS and is told how to teach
this to a room. It is the same wrong-audience class as the professor strings, on a
members-only surface.
*Fix:* 7 strings, second person. "Try it with pink noise: the same +6 dB boost at Q=0.7 vs
Q=8 — hear 'tone' vs 'ring'." / "Use Freeze / Peak-Hold to predict the next echo before it
lands." **Confidence: high** (render site verified).

**F-4 · "Full Course Certification" names an award that does not exist.**
`screens/profile/ProfileScreen.tsx:643` — inside the live commercial branch (verified:
`commercialProfileOnly = true` at `:451`, block closes `:1102`). It labels a progress bar
driven by `profile.overallPct`, which `features/profile/api.ts:126` computes as
*completed topics ÷ total curriculum topics* (171 v3 topics). So the row reads
"Full Course Certification — 3% complete".

Three things are wrong at once: there is no "course"; there is no award called a "Full
Course Certification" anywhere in `awardsData.ts`, `celebration/catalog.ts` or the
credentials layer; and presenting curriculum progress as progress toward a *certification*
tells a paying customer that finishing all 171 topics yields a credential the app never
issues. Wrong information shown as fact, on the Profile screen.
*Fix:* 1 string → **"Curriculum progress"** or **"Overall progress"**. **Confidence: high**
on the naming; **medium** on whether the owner intends a future whole-curriculum award —
if one is planned, the row should still not claim it today.

**F-5 · The beta-pricing note on the money screens is ungrammatical.**
`lib/copy.ts:77-79`:
> "Introductory pricing for our early beta (new-adopter) users — all prices are valid
> through the end of the year. **Lock in now early low priced subscriptions or the lifetime
> academy membership fee.**"

The second sentence has no working syntax: "Lock in now early low priced subscriptions"
lacks an article and a comma, "low priced" needs a hyphen, and it introduces
"subscriptions" (used nowhere else) alongside "lifetime academy membership fee" (a fourth
name for the product, see T-1). Shown on the plan/paywall screens and on signup — the
places where the customer is deciding to pay.
*Suggested:* "Lock in the low introductory prices now — monthly, annual, or the one-time
lifetime membership."
Two adjacent issues worth the owner's eye: the copy still calls the audience "our early
beta (new-adopter) users" days from launch; and "valid through the end of the year"
appears in three strings (`:74`, `:79`, `:82`) with no expiry mechanism, so it becomes
false on 1 January. **Confidence: high** on the grammar, **medium** on whether "beta" is
deliberate.
*(`lib/copy.ts` is marked VERBATIM/governance — flagging, not recommending a unilateral edit.)*

**F-6 · "Your credentials are lifelong verifiable by employers…"**
`screens/about/AboutHomeSheet.tsx:59`. "Lifelong verifiable" is not English; the sentence
is also a 38-word run-on carrying two separate promises. It is a *claim about what the
customer is buying*, on the About sheet.
*Suggested:* "Your credentials remain verifiable by employers for life in the Pro Audio
Training Academy registry. An active membership is not required to keep your record there."
Note it also introduces **"transcript"** and **"database"** for what the rest of the app
calls the **registry** / **permanent credential record**. **Confidence: high.**

### MINOR

**F-7 · Straight vs curly quotes and apostrophes — a clear house rule, broken ~500 times.**
Prose strings use curly typography 1,185 (') to 267 straight, and 499 (" ") to 248 straight.
So the rule exists and is broken in ~515 strings. Worst files: `guidedLessons/content.ts`
(53 straight double quotes — and it mixes within one rendered bullet list: the EQ
COMMON MISTAKES block has `'Chasing a flat analyzer — "flat" is not the goal'` in straight
quotes next to siblings using curly), `production/preprod/stage2–6.data.ts` (~60
apostrophes), `micSelectData.ts` (14), `modMeterA.tsx` (12), `topicCopy.ts` (10),
`CourseSelectionScreen.tsx` (9).
*Recommendation:* **do not do this by hand before launch.** A scripted pass over `src/`
prose strings is low-risk (replacing `'` inside a `'…'` literal requires the escape to be
preserved, so run it on `"…"`/backtick literals and JSX text first, then `tsc`). If there
is no time, it costs nothing to ship. Ranked low deliberately.

**F-8 · Celebration copy: one exclamation mark breaks its own tier rule, and the em dashes
are unspaced.**
`features/celebration/catalog.ts` divides celebrations into tiers. The "moment" tier is
exclamatory by design (`NICE WORK!`, `PERFECT SCORE!`, `YOU DID IT!` — fine). The
**credential** tier is deliberately dignified: `YOUR FIRST CERTIFICATE`, `CERTIFICATE
EARNED`, `PROFESSIONAL PROGRAM COMPLETED`, `ANOTHER PROFESSIONAL PROGRAM COMPLETED` — no
exclamation. The fifth, `:274`, is **`MULTIPLE CREDENTIALS EARNED!`**. It is the odd one
out in the set, and it fires at the single biggest moment in the product.
Separately, `catalog.ts` uses **unspaced** em dashes where the app uses spaced ones
7,400 times: `:188` "study—an entire area", `:221` "Congratulations—you have earned",
`:304` "collected here—creating a lasting record". Same in
`features/intro/screenIntros.ts:51/53/66/68` ("Audio is everywhere—but", "immediately—no
account required—or", "education—not advertising", "charges—what your membership") and
`features/audio/soundSafetyText.ts` ("Excessive sound—even for a short time—can cause").
*Fix:* drop the `!` (1 string); space the dashes (~10 strings). **Confidence: high.**

**F-9 · "Career Finder - 1,902 possible Careers in audio - click here"**
`screens/curriculum/CurriculumScreen.tsx:365`. Four problems in one 59-character string:
- `click here` — this is a phone. The verb is **tap**, and "click here" is a link
  anti-pattern besides. It is the only "click here" in the app.
- spaced hyphens where the app uses spaced em dashes 7,400 times.
- **Careers** capitalised mid-sentence.
- `numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}` at
  `fontSize: 12.5` + `letterSpacing: 0.4` (`:636`). At the 0.8 floor that is ~10pt Oswald
  for 59 characters plus tracking, in a full-width row inset by the screen's padding. It is
  the longest single-line string in the app by 1 character and the only one I found likely
  to hit the scale floor and ellipsise.
*Suggested:* "Career Finder — 1,902 ways to work in audio ›". **Confidence: high** on the
copy, **medium** on the clipping — a screenshot at 360 dp width settles it.

**F-10 · Three "dismiss" labels and two "acknowledge" labels for the same dialog roles.**
`lib/confirm.ts:81` — the app's own `notify()` helper uses **`OK`**. But
`PaywallScreen.tsx:51` and `:227` use **`Great`** for the same acknowledgment, and the
cancel role is **`Not now`** (`PaywallScreen.tsx:167`, `:201`), **`Later`**
(`PaywallScreen.tsx:106`) and **`Not yet`** (`ProfileScreen.tsx:79`).
*Recommendation:* `OK` and `Not now`. **5 strings. Confidence: high.**

**F-11 · "Enjoy!" in the purchase-confirmation dialog.**
`PaywallScreen.tsx:49` — "Welcome to Academy" / "Your Academy access is active. **Enjoy!**".
The only exclamation mark anywhere in the money flow, and the title drops the article
("Welcome to Academy"). The surrounding purchase copy is careful and plain
(`:95`, `:165`, `:226`, all marked "Ratified by the owner 2026-09-14"); this one predates
them and is out of voice. Also "Academy access" — see T-1.
*Suggested:* title "Welcome to the Academy", body "Your Academy membership is active."
**Confidence: medium** — this is a taste call, not an error.

**F-12 · "Use The App Your Way"**
`screens/about/AboutHomeSheet.tsx:117`. The sheet's other eyebrows are correct title case
("Check Your Understanding", "Build Credentials"). This one capitalises the article.
*Fix:* "Use the App Your Way". **1 string.**

**F-13 · The commitment statement tells a paying customer the app "puts students first".**
`features/intro/screenIntros.ts:67` — the trust/pricing promise shown as the second popup
on first launch. Also `:66` "Our glossary, **lessons**, and quizzes" ("lessons" is not the
curriculum unit — see T-2). Same pattern at `CurriculumScreen.tsx:503` ("what the Academy
sets out to do for every **student**") and `AwardsScreen.tsx:854/925` ("every **student**
completes"). Not wrong the way F-2 is — nobody is blocked — but it is the commercial app
addressing its buyer as a pupil.
`screenIntros.ts:54` ("Whether you're a student, musician, engineer…") is a list of
audiences and is fine; leave it.
*Fix:* 4 strings → "you" / "members". **Confidence: high.**

**F-14 · The signup screen invites an access code from "your employer, school, church,
training organization, or other sponsoring institution".**
`screens/auth/AuthScreen.tsx:473-475`, rendered unconditionally under the optional
"Access or promo code" field. Flagging rather than recommending: if institutional resale
is a real commercial channel, this copy is correct and should stay. If it is not, then
"school … sponsoring institution" is the retired mode surfacing on the first screen of a
commercial-only product. **Owner's call.** The parked `InstitutionalScreen`
(`RootNavigator.tsx:394`, "INSTITUTIONAL MODE", "STUDENT BADGE", "Cohort progress analytics
for instructors") is registered as a route but only reachable from a **disabled** Profile
row, so it is not a live leak — verified, no action needed.

**F-15 · Double-spaced separator.**
`screens/study/FlashcardsScreen.tsx:1457` and `:1482` — "Tap to see definitions**  ·  **Swipe
to change terms" uses two spaces either side of the middot; the app's separator is a single
space (`· ` appears ~hundreds of times single-spaced). Trivial, listed for completeness.

---

## PART 3 — What I would actually change now

Days from launch, ranked by (customer confusion × cost to fix):

**Do now — 1 to 2 hours, no risk:**

1. **F-1** — 11 strings, `HZ`→`Hz` / `KHZ`→`kHz`. A unit error in an audio credential
   product, next to a correct one, in the same bezel.
2. **F-2** — 2 error strings + 2 button labels. It is the same defect the fix pass just
   cleared elsewhere; leaving it is worse than never having found it.
3. **T-5** — 3 strings. "assessment" → "Topic Quiz" / "Final Exam".
4. **F-4** — 1 string. "Full Course Certification" claims an award that does not exist.
5. **T-2** (the 6 error/empty-state ones: `quiz/api.ts:87/91/92`, `DashboardScreen:891`,
   `AwardsScreen:854/925`). `AwardsScreen` contradicts its own requirement list on screen.
6. **F-3** — 7 guided-lesson tips. Members-only surface, wrong audience.
7. **T-7** — 1 string, `Login` → `Sign In`, on the returning customer's first screen.
8. **T-6** — 1 string, retitle AUDIO LEARNING to match the card that opens it.
9. **F-12**, **F-8** (the `!`), **F-9** (the copy half). 3 strings.

**Decide now, execute after launch if needed:**

10. **T-1** — the nine paywall CTA labels and the five product names. This is the biggest
    *confusion* item in the report and it sits on the revenue path, but it touches
    `lib/copy.ts`, which is governance-locked, so it needs the owner's word first. If only
    one thing is done here, unify the **nine button labels** (they are not in `copy.ts` and
    are free to change) and leave the prose for a governance pass.
11. **T-3** — Specialization vs Specialized (10 strings). Worth doing before the first
    certificate is printed, because the name goes on the document.
12. **T-4** — PROGRESS vs TROPHY CASE. 1 tab label.
13. **T-8** — 147 UK spellings. Do the 9 `ColorWheelButton`/`LedColorPicker` strings now
    (visible chrome); script the rest later.

**Ship as is:**

14. **F-7** — ~515 quote/apostrophe inconsistencies. Real, uniform, invisible to almost
    everyone, and a hand fix at this range is more likely to introduce a bug than to be
    noticed.
15. **F-11**, **F-13**, **F-15** — taste and tone, not error.
16. **F-14** — needs the owner, not an edit.

---

## What I checked and found clean

Reporting these so the next pass does not repeat them.

- **Spelling.** Ran ~100 common English misspellings plus doubled-word and
  space-before-punctuation detection across the full 106,000-string corpus. **Zero real
  typos.** Every hit was intentional ("Final Final" as a deliberate bad-filename example
  in `postprod/stage3.data.ts`, "Thiele–Small small-signal"). For a corpus this size that
  is unusually clean.
- **Marketing language.** Swept 25 marketing clichés (unleash, supercharge, game-changing,
  world-class, seamless, empower, level up, rock star, magic…). Nothing lapses. The only
  hits are "learning journey"/"audio journey" in the welcome copy — defensible — and
  "magic", which is used correctly every time to *deny* a shortcut ("there is no one magic
  separation distance", "NOT A MAGIC NUMBER").
- **Safety and legal copy.** `soundSafetyText.ts`, `speakerSafety.ts`, `hazard.ts`,
  `connectors.analog/digital/power.ts`, `calc/workspaces/splSafety.ts` and the production
  hazard registers are appropriately serious and specific — "have the equipment and outlets
  checked by a qualified person", "never defeat a ground pin", exposure framed as a dose.
  Nothing too casual for what it says. The only issue is typographic (unspaced em dashes in
  `soundSafetyText.ts`).
- **`dB` casing.** Clean throughout; the single `db` hit in the corpus is a CSS colour token.
- **Button casing rule.** There *is* a rule and it holds: `GlassButton` and `CtaButton`
  labels are authored ALL CAPS, `StudioButton` is authored Title Case and uppercases
  internally (`StudioButton.tsx:46 label={label.toUpperCase()}`), `TextLink` is sentence
  case. The source-level variation in `StudioButton` labels ("Skip question", "Share as
  image") is invisible to users. Not a finding.
- **Screen titles.** Overwhelmingly ALL CAPS via `styles.title`; the Awards page headlines
  and the About sheet eyebrows are Title Case but consistently so within their own surface.
  Only `COPY.paywallTitle` / `COPY.upgradePhrase` land Title Case and sentence case in a
  caps slot, which is part of T-1.
- **"Coming soon" casing.** `Coming soon` (dialog title) vs `COMING SOON` (chip) follows the
  house rule — sentence case for dialog titles, caps for chips. Not a finding.
- **Placeholder copy reaching users.** `screenIntros.ts:74` contains a string beginning
  "PLACEHOLDER — first-user welcome tutorial…", but
  `ScreenIntroOverlay.tsx:56` (`if (SCREEN_INTROS[key].placeholder !== false) return;`)
  blocks every unfinished intro from real users. 8 placeholder intros, none reachable.
  Verified, no action.
- **Truncation.** Scanned every `numberOfLines={1}` element with a literal ≥25 characters.
  Only `CurriculumScreen.tsx:365` (F-9) is at real risk; the rest either carry
  `adjustsFontSizeToFit` with a workable floor or are short. Chips and pills are all short.
- **`member` / `membership`.** Genuinely consistent as the word for the *person* — 42
  strings, no "subscriber", no "learner" in user-facing copy. It is only the *product*
  noun that drifts (T-1).
- **"Final Exam".** Consistently capitalised as a proper noun in ~25 strings. One exception
  (T-5).
