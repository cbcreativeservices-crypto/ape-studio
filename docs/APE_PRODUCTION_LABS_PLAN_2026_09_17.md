# Production Labs — Strategy and Build Plan

**Audio Pre-Production Lab + Audio Post-Production Lab**
Written by ccode (Claude Code, Opus 5) at the owner's request, 2026-09-17.
Owner decision this session: **these are the last two new labs before launch. Every other lab is post-launch.**
Owner decision this session: **build on Opus, not Fable.**

Status: **PLAN ONLY — nothing has been built. The owner said "do not build yet."**

### Owner decisions, second pass (same session)

- **The launch date is NOT fixed.**
- **Both labs must ship. They are flagship** — "they really set it far above and ahead of anything out
  there." Option C (defer both) is therefore **rejected**.
- **Every placeholder lab row was removed** rather than relabelled, to return in a future update.
  Applied and verified — see §11.
- **Sharing the structure with Computer B / C is approved** (the content-authoring handoff, §7).
- **Do not build yet.** ccode reports readiness first; the go comes separately.

---

## 0. The three things that decide this build

1. **These two labs are one machine, not two.** Pre-Production builds a plan from nothing and exports a
   Production Packet. Post-Production receives a broken project and repairs it in order into a Delivery
   Package. Underneath, both are the same engine: structured decisions → cross-field validation →
   readiness scoring → exported document. Build the engine once, then each lab is *content*, not screens.
   This is the difference between two enormous builds and one tractable one.

2. **Neither lab is a simulation.** Every existing lab is DSP, physics or real-time rendering — the
   cymatics plate solver, the wave-physics field, the EQ curve engine. These two have no audio engine,
   no real-time loop and no native dependency (the one native touch, PDF export, already has a house
   honesty gate). That makes them almost entirely pure logic, testable under `node --test`, and
   shippable **without a new native build**. That is unusually good news this close to launch.

3. **As written, the spec does not fit before launch.** Counted from the owner's document:
   Pre-Production has 19 stages and roughly 40 distinct builders across 7 pathways; Post-Production has
   28 stages and roughly 45 builders across 8 pathways. Cymatics — one lab, far fewer surfaces — took
   four phases across several sessions. Section 9 sets out the phasing options honestly rather than
   promising all of it.

---

## 1. Scope, measured rather than guessed

| | Pre-Production | Post-Production |
|---|---|---|
| Chapters | 3 | 3 |
| Stages | 19 | 28 |
| Distinct builders/screens implied | ~40 | ~45 |
| Pathways | 7 | 8 |
| Interactive activities | 13 | 14 |
| Capstone | 1 | 1 |
| Scoring rubric | 100 pts, 10 areas | 100 pts, 10 areas |

Pathways are the multiplier that hurts. Seven pathways over forty builders is not forty surfaces, it is
forty surfaces whose *content* forks seven ways. Handled as screens this is unbuildable. Handled as
**data** — one schema with pathway overlays — it collapses back to forty schema entries and seven
overlay files, which is ordinary content work that Computer B or C can help author.

---

## 2. Architecture: one engine, two content sets

Proposed home: `src/features/production/` (engine, shared) with
`src/screens/lab/preprod/` and `src/screens/lab/postprod/` (screens + content).

### 2.1 Engine modules

| Module | Responsibility |
|---|---|
| `schema.ts` | Declarative stage → section → field tree. Data, never JSX. Field kinds: text, longText, number, choice, multiChoice, date, currency, duration, table, reference, status. |
| `pathways.ts` | Overlay per pathway: adds, removes, relabels and re-requires fields. A pathway never forks a screen. |
| `rules.ts` | Pure validators over project state. Each returns a `Finding`. This is where conflict detection lives. |
| `readiness.ts` | Rolls findings into the meter. Owns blocker semantics. |
| `projectStore.ts` | AsyncStorage persistence, the `patternStore`/`workflowStore` idiom — versioned key, corruption-safe, injectable adapter for tests. |
| `packet.ts` | Project state → HTML → PDF via the existing `certificatePdf` honesty gate. |
| `scenarios.ts` | Seeded project states for the interactive activities and the capstone. |
| `scoring.ts` | The 100-point rubric plus the qualitative dimensions. |
| `docControl.ts` | Revision number, date, author, approval status, distribution — the spec's document-control block, applied to every exported page. |

Rendering is a small set of generic components driven by `schema.ts`: a stage screen, a section list, a
field row per kind, a findings panel and the readiness meter. Roughly a dozen components serve every
stage in both labs. **Adding a stage must never mean adding a screen.**

### 2.2 The data model

```ts
type ProjectId = string;
type PathwayId = 'music' | 'podcast' | 'film' | 'broadcast' | 'live' | 'game' | 'custom';

type FieldValue = string | number | boolean | string[] | TableRow[] | null;

type ProductionProject = {
  id: ProjectId;
  v: 1;
  lab: 'preprod' | 'postprod';
  pathway: PathwayId;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Flat map keyed by `${stageId}.${fieldId}` — survives schema growth. */
  values: Record<string, FieldValue>;
  /** Per-field "not applicable", with the reason the user gave. */
  na: Record<string, string>;
  /** Blockers an authorised person accepted, with who and why. */
  acceptedConditions: AcceptedCondition[];
  scenarioId?: string;
  revision: number;
};

type Finding = {
  id: string;
  stageId: string;
  fieldIds: string[];
  severity: 'blocker' | 'attention' | 'info';
  kind: 'missing' | 'conflict' | 'unrealistic' | 'mismatch' | 'unsafe' | 'legal';
  title: string;      // plain, no promise words
  detail: string;
  fixHint?: string;
  /** Deep link to the lab/tool/calculator that teaches this. */
  learnMore?: { route: string; params?: object };
};
```

Two decisions worth defending. Values are a **flat keyed map**, not a nested object, so adding a stage
later cannot invalidate a saved project. And `na` stores a **reason**, not a boolean, because the spec
demands the meter judge decisions — "not applicable" is a decision and must be justified.

### 2.3 The readiness meter, done honestly

The spec is explicit: *"The meter must evaluate actual decisions rather than reward users merely for
opening screens."* That is a testable invariant and I will test it directly — a test that visits every
stage without entering a value must leave the meter at zero.

States are exactly the spec's five: Complete, Needs attention, Missing, Conflict detected, Not
applicable. Two rules are absolute:

- **A red blocker cannot be outscored.** A numerical score never overrides an unresolved safety, legal,
  recording or delivery blocker. Encoded in `readiness.ts`, not in a screen.
- **A blocker clears only two ways** — fix it, or record an accepted condition naming the person who
  accepted it and why. The accepted condition then prints in the packet. This mirrors real practice and
  stops the meter becoming a participation trophy.

---

## 3. Reuse map — what NOT to build

The spec repeatedly describes surfaces this app already has, and in two places says so itself. Every row
here becomes a deep link plus a short in-context summary, not a rebuild.

| Spec stage | Existing surface |
|---|---|
| Pre 9 · Signal-Flow Builder | `SignalChainLab` |
| Pre 9.3 · Patch plan | Patchbay Signal Flow & Normalling lab |
| Pre 8 · Mic selection and placement | `MicLab` (Microphone Principles) |
| Pre 6 · Location and acoustics | `WaveLab`, `SpeakerLab` (Speaker Placement & Coverage) |
| Pre 6.3 · Measurement planning | Measurement & Analysis Tools (SPL, RTA, RT60) |
| Pre 12.4 · Storage calculation | Calculator Lab — "File size from format & duration" (`roomsMusic.ts`) |
| Pre 15.3 · Cable and power | Calculator Lab — `powerElec`, `speakers` |
| Pre 14.2 · Hearing safety | Pro Audio Safety (free topic) |
| Post 14.4 · Gain structure and headroom | Gain Staging lab |
| Post 20 · Loudness and true peak | `loudness` calculators + `MeterLab` (LUFS, true peak, correlation) |

That removes roughly ten of the heaviest surfaces. **Caution:** the glossary already distinguishes
functional links from planned-but-unwired ones (`learningProfiles.ts`, FUNCTIONAL vs PLANNED buckets).
Production-lab links must obey the same rule — never link a lab that is not open, or the no-dead-links
standard breaks.

---

## 4. Interactive activities

Thirteen in Pre-Production, fourteen in Post. They are not bespoke minigames. Each one is:

> a seeded project state + a target condition + the same rules engine + a short debrief.

"Repair the vague brief", "Deliverable detective", "Who owns this task?", "Save the production", "Find
the hazards", "Diagnose the failed test" — all are the same loop with different seeds and different
passing conditions. One activity runner, authored content. The capstone is the largest seed plus a
sequence of injected changes.

Two activities genuinely need more than the runner and should be costed separately: **Choose and place
the microphone** (Pre 8) wants a spatial placement view, and **Complete the signal path** (Pre 9) wants a
node graph. Both already exist in other labs — the recommendation is to deep-link rather than rebuild,
and if the owner wants them inline, treat each as its own phase.

---

## 5. Catalog and navigation placement

A new category in the members-only training section:

```ts
{
  id: 'production',
  glyph: '🎬',
  name: 'Production Workflow',
  description: 'Planning a production before it starts, and finishing it after the recording stops.',
  section: 'training',
  kind: 'list',
  labs: [
    { name: 'Audio Pre-Production',  blurb: '…', route: 'PreProdLab' },
    { name: 'Audio Post-Production', blurb: '…', route: 'PostProdLab' },
  ],
}
```

Each lab is a hub with its own stage drill-down, the Cymatics and Digital Lab shape. Navigation follows
the existing registration: screens in `RootNavigator`, names in `navigation/types.ts`, deep links in
`linking.ts`, membership via `withMembershipPreview`.

Note these labs carry **no `key`**. The `key` field marks the eleven Audio Fundamentals labs that count
toward the universal certificate requirement, and it is immutable once live. Adding one here would alter
a live certificate rule, which is a backend decision and not mine to make.

---

## 6. Export: the Production Packet

The packet is the payoff of Pre-Production and the whole point of the lab. The path already exists:
`packet.ts` builds HTML, `certificatePdf`'s pattern hands it to `expo-print` and `expo-sharing` through
`optionalModule`, gated by `isAvailable()`.

That gate matters. Those modules are JS-present but native-absent until a build ships them, so the export
control must be **honest, never dead and never lying** — exactly how the certificate PDF and the cymatics
SVG export behave today. Until the next native build, offer the on-screen packet and the copyable summary,
and say plainly that the PDF needs the next app build.

Every exported page carries the document-control block the spec requires: project, revision number,
revision date, author, approval status, distribution and page number, with the latest approved version
clearly distinguished from a draft.

---

## 7. Content authoring — the part that is not code

The schema entries, pathway overlays, rule copy, scenario seeds and debriefs are **writing**, and there is
a lot of it. This is the natural handoff to Computer B or C, in the established pattern: ccode defines the
schema and the rule contract, B or C authors the content as data, ccode ingests it.

Rough authoring volume: ~40 stage schemas, 7 pathway overlays, ~150 rules with explanatory copy, 13
scenario seeds for Pre-Production; comparable for Post. Starting the authoring handoff early is the single
biggest thing that shortens the calendar, because it runs in parallel with the engine.

---

## 8. House rules that bite this build

- **Roles that require credentials must say so.** Stage 3's Team Builder lists RF coordinator, rigger,
  broadcast engineer, systems engineer and similar. The standing rule is absolute: whenever a listed role
  needs a degree, certification or licence beyond this app, the copy says so, every time. Stage 14 already
  says only qualified personnel should plan or approve electrical distribution and rigging — that must be
  enforced in the role copy too, not just in the safety stage.
- **Legal and safety boundary.** These labs touch rights, licensing, consent, insurance, rigging and
  electrical distribution. `AccuracyNote` currently has two variants, `tool` and `calc`. Neither fits.
  I propose a third, `practice`: planning education, not legal or safety advice, with jurisdiction and
  qualified-personnel caveats. Small addition, and it is the honest thing to ship.
- **No promise words in user-facing copy** — subject to the owner's change in section 11.
- **Low-Light Production Mode**: nothing may auto-appear. Conflict banners and readiness popups must gate
  on `useOverlaysSuppressed`, like every other auto-surface.
- **MIN_FONT 12** throughout. These are dense document screens, so this will bite; the field row component
  must be designed at the floor rather than shrunk to fit.
- **No mention of institutional or academic mode** anywhere in copy.
- **Amplitude drawings** use the house ramp (`levelColor.ts`) if any meter appears; categorical tints for
  states. The readiness states are categorical, so they must not borrow the level ramp.

---

## 9. Phasing — and why the deadline pressure is mostly imaginary

The original three options assumed these labs had to beat a store submission. **Measured this session,
they do not.** See §9.1. The launch date is also not fixed. Between them, those two facts dissolve the
trade-off that made Option C worth considering, and it is now withdrawn.

### 9.1 These labs ship over the air, with no store review

Verified empirically, not recalled:

- `runtimeVersion` is on the **fingerprint** policy, and the fingerprint's inputs are native-relevant
  files. **Adding a new `src/` file leaves the fingerprint byte-identical** — I added a probe file, the
  iOS fingerprint stayed `2bbcea43…`, and I removed it. New lab code therefore matches the installed
  builds and reaches both phones through `eas update` in minutes.
- Section 2 already established these labs need **no native code** — no audio engine, no real-time loop.
- The one native touch is the Production Packet PDF. **`expo-print` (added 2026-08-23) and `expo-sharing`
  (2026-08-06) both predate the 2026-09-17 native builds**, so the installed binaries already carry them.
  The packet export works today and will work in the launch build.

**So the entire feature is over-the-air deliverable.** It does not have to hold the launch, and it does
not have to wait for one either.

### 9.2 What that means for the owner's question

*"Is that allowed? How soon?"* — about removing the placeholder labs and adding them in a future update.

**Allowed: yes, comfortably.** Neither Apple nor Google restricts adding features after launch; both
expect it. The rule that exists points the other way — Apple's guideline 2.1 dislikes *placeholder* and
incomplete content, so removing the planned rows moves the app **toward** compliance, not away. There is
nothing to ask permission for.

**How soon: minutes, not weeks.** Three different speeds, worth keeping straight:

| Change | Route | Time to users |
|---|---|---|
| New lab, JS/TS only (both Production labs, and the removed placeholders) | `eas update` | Minutes. No review. |
| Anything touching native code or config | New build + store review | ~30 min build, plus roughly 24–48 h Apple, hours to days Google |
| Copy or layout fix | `eas update` | Minutes |

The one caveat: an over-the-air update reaches people who **already have the app installed**. Someone
downloading for the first time gets the store binary and then pulls the update on first launch. That is
normal and invisible to them.

### 9.3 Recommended shape

Because the labs are flagship and the date is flexible, build them **properly and completely**, in this
order, releasing over the air as each lands:

1. **Engine** (§2.1) — schema, pathways, rules, readiness, store, packet, scenarios, scoring. Shared.
2. **Pre-Production, all three chapters.** The owner's document says to complete it before starting Post.
3. **Post-Production, all three chapters**, reusing the engine.

Pathways stay the one place I would still stage: ship Pre-Production with **Music, Podcast and Live**,
then add Film, Broadcast, Game and Custom as content. They are schema overlays, so each is authoring work
and no engine change — and each can go out over the air on its own.

Content authoring (§7) should start **in parallel with the engine**, not after it. That is the single
biggest lever on the calendar, and the owner has approved sharing the structure.

---

## 10. Testing

The engine is pure logic, which suits `node --test` and the existing 57-file suite. Minimum bar:

- Readiness never rewards navigation — visiting every stage with no values scores zero.
- A red blocker cannot be outscored by any point total.
- An accepted condition requires a named acceptor and a reason, and prints in the packet.
- Every rule fires on its seeded fixture and stays silent on a clean project (no false positives).
- Store round-trips through the injectable adapter; damaged rows are set aside, never destroyed.
- Every pathway overlay resolves against the base schema with no orphan field ids.
- Packet HTML builds for every pathway without a missing-value crash.

---

## 11. Placeholder labs — relabelled, then removed

Both changes happened this session, in order.

**First**, per the owner's instruction, the shared `DEV_NOTE` constant in `labCatalog.ts` was changed
from "Planned lab — not open yet." to "Coming Soon". Two accessibility labels (`EarLabScreen`,
`LabCategoryScreen`) had the old wording hardcoded and were spoken to screen-reader users; both now read
from the constant, so the wording can never need changing in three places again. The second one was found
only by searching the served JS bundle after a truncated source search missed it.

**Then**, the owner decided to remove the placeholders outright and reintroduce them in a future update.
Removed:

| Row | Category |
|---|---|
| Sample Lab | Synthesis & Sound Design |
| Instrument Recording Lab | Instruments & Recording |
| Mixing Principle Lab | Mixing & Production |
| Room Mode Testing Lab | Mixing & Production |
| Custom Room Treatment Design Lab | Mixing & Production |

All three rows in **Mixing & Production** were placeholders, so the category itself was removed rather
than left as an empty card reading "0 Labs". That incidentally settles a wart the code had already
flagged for the owner: there were two mixing categories in the training section, the live `mixingworkflow`
and this all-placeholder one. Only the live one remains. A stale `labs/mixing` deep link degrades to the
category screen's own "not available" state, so no dead link is created.

**The mechanism was kept, not deleted.** The `status: 'development'` field, `DEV_NOTE` and the three
screens that render it are all still wired, exactly as cymatics keeps `PLANNED_AREAS = []`. The future
update re-enables placeholders by adding rows — there is no plumbing to rebuild. Verified: no leaf carries
`status: 'development'`; the three remaining matches in the file are documentation.

`tsc` clean, 1222 tests pass.

### The "Coming Soon" wording, for whoever re-adds a row

Applied this session, per the owner's instruction. One constant drives all placeholder rows:
`DEV_NOTE` in `src/screens/lab/labCatalog.ts`, consumed by the Ear Lab list, the Lab Category screen and
the Smart Processors screen.

**One flag, then it is the owner's call.** This reverses a standing rule that banned exactly these words,
and the reason for that ban is worth restating before launch: Apple's App Store review has historically
treated "coming soon" placeholders as incomplete-app signals under guideline 2.1. The old wording stated a
present fact and carried no timeline. If a review rejection would be costly right now, wording such as
"Not open yet" keeps the same meaning without the forward promise. The owner asked for "Coming Soon" and
that is what is in the build; changing it back is a one-line edit.

---

## 12. Decisions — all four settled

The owner answered every open question on 2026-09-17. Nothing about the design is outstanding.

**1 · Launch pathways: Music, Podcast, Live.** Owner took the recommendation. Between them they cover the
app's whole study-area lineup — Music covers Music Production and Recording Arts; Live covers Live Sound,
Worship Audio, DJ Production and Theatrical Sound Design; Podcast covers interviews and spoken word. Film,
Broadcast, Game and Custom follow as content, each shippable over the air on its own. The same three open
Post-Production, so the two labs stay aligned.

**2 · The two heavy activities: capture inline, link out to practise.** Owner took the recommendation.
Choosing and placing a microphone, and completing the signal path, record their DECISION inline as
structured data so the microphone plan and the signal-flow diagram still print into the Production Packet.
The hands-on practice and the reasoning deep-link to `MicLab` and `SignalChainLab`, which already teach
exactly this. Planning is this lab's job; teaching microphone technique is already done elsewhere and
doing it twice invites the two to drift apart.

**3 · The third `AccuracyNote` variant is approved, and it is now an app standard.** Owner: *"yes add the
new third variant. legal and safety notices at each. that is our app standard."* So the `practice` variant
ships, and **a legal or safety notice appears at each point where one applies** — not once in a lab header.
Concretely that means every stage touching rights, licensing, sample clearance, performer releases, consent
for minors, location permission, insurance, hearing exposure, electrical distribution or rigging carries
its own notice. Two existing rules bind here and neither is optional: qualified personnel only, for
rigging and electrical work; and the credential-disclosure rule on every role the Team Builder lists.

**4 · Content authoring goes to Computer C, which is available now.** Owner approved preparing the
handoff. Build order is therefore the parallel one: ccode defines the authoring contract FIRST, C starts
writing against it, and the engine is built while they write. Batch 1 is Pre-Production Stages 1–4 across
the three launch pathways. The handoff package is
`C:\Users\profe\Downloads\2026-09-17_COMPUTER_C_PREPROD_AUTHORING\`.

**Division of labour, the important line:** Computer C authors the content and the *intent* of every rule.
**C never writes logic.** Any rule needing computation — a scope that outruns the schedule, a channel count
that outruns the console, a deliverable that contradicts its platform — is described in prose by C and
implemented by ccode. That keeps the authoring purely editorial and keeps correctness in tested code.

### Still required before code

**The explicit go to build.** The owner asked to be told when ccode is ready to start. A settled plan is
not a go, and this session's instruction was "do not build yet."

---

*Nothing in this document has been built. The design is settled; the build is not authorised.*
