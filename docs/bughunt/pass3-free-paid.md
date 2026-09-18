# Pass 3 — Agent B: what the app PROMISES is free vs what the gates actually do

Read-only pass. No source file was edited. Branch `audio-tools-engine`, 2026-09-18.

My axis is the free/paid boundary **as a claim**, not as a mechanism. Passes 1 and 2
established that the gates hold; I checked whether the sentences the app puts in front
of a user match what those gates then do — in both directions.

Headline: **the enforcement is in good shape and most of the copy is unusually careful.**
The labs chain (Home card → Audio Learning → Ear Lab) names the three free Fundamentals
labs by name and is exactly true. The free-topic pair is consistent from the client
constant through to the server view. The preview leaks nothing. The real problems are
(1) the paywall states a price it does not get from the store, (2) one career-finder
sentence that is false on every screen it renders on, and (3) one lab-list surface that
paints no locks at all.

Findings are ordered most severe first. Confidence is stated on each.

---

## F1 — MAJOR — The paywall states a hardcoded USD price; the store's real localized price is fetched by a function with zero callers

**Confidence: high on the code path; the size of the user impact depends on whether
non-US storefronts are configured, which I cannot see from here.**

`src/screens/commercial/PaywallScreen.tsx:29-35`

```ts
// Illustrative — real products come from the store config (governance).
const PLANS: Plan[] = [
  { id: 'lifetime', name: 'Lifetime Academy', price: '$99.99', sub: 'One-time payment', badge: 'BEST VALUE' },
  // $59.99/yr vs $9.99×12 = $119.88 → 50.0% saved (Booth 2026-07-11 #6).
  { id: 'annual', name: 'Annual', price: '$59.99 / yr', sub: 'About $5/mo', badge: 'SAVE 50%' },
  { id: 'monthly', name: 'Monthly', price: '$9.99 / mo', sub: 'Cancel anytime' },
];
```

The file's own header already concedes it: *"The plan prices below are display copy
mirroring public.products; the store is the source of truth at purchase."*
(`PaywallScreen.tsx:8-9`).

The correct value exists and is reachable:

`src/features/commercial/purchase.ts:172-183`
```ts
/** Fetch localized store products (both subs + in-app). Best-effort. */
export async function loadStoreProducts(): Promise<unknown[]> {
```

`grep -rn "loadStoreProducts" src test` returns **only its own definition**. Nothing
calls it. `initPurchases()` is called on mount (`PaywallScreen.tsx:107`) but never asks
the store for product metadata, so `PLANS[].price` is the only thing ever rendered
(`PaywallScreen.tsx:346`) and the only thing ever announced to a screen reader
(`:339`).

**What the user does:** a buyer outside the United States opens the paywall.
**What happens:** they read "Monthly $9.99 / mo", tap CONTINUE, and the store sheet
quotes their own currency at whatever tier Apple/Google mapped `academy_monthly` to.
**What should happen:** the card shows the store's localized display price.

Two derived claims ride on the hardcoded numbers and can independently become false,
because storefront price tiers are not a fixed ratio across currencies:
- `SAVE 50%` on the annual card (`:33`) — derived from $59.99 vs $9.99×12.
- `About $5/mo` (`:33`).

Internal consistency is fine, for the record: `$9.99 / $59.99 / $99.99` matches
`iapProducts.ts:8-9`'s stated `public.products` mirror of `monthly 999 / annual 5999 /
lifetime 9999`, and the SKUs (`academy_monthly`, `academy_annual`, `academy_lifetime`,
`iapProducts.ts:20-23`) are what `buyPlan` requests. The bug is that none of that is
what a non-USD buyer will be charged.

Also dead, and worth knowing before someone "fixes" this by reviving them:
`COPY.lifetimePrice` (`src/lib/copy.ts:72`, `'$99.99'`), `COPY.lifetimeOffer` (`:73`)
and `COPY.introDeadline` (`:82`) have no render sites anywhere in `src`.

---

## F2 — MAJOR — "the first free topics are open to everyone" is false on the default view of **42 of 42** career families

**Confidence: high.** This is the known 41-of-42 item; the count is worse than recorded
and the second half of the sentence is also worth naming.

`src/screens/careerfinder/CareerFamilyScreen.tsx:117`

> `These Academy topics lead into this family. Tap one to add it to your study list — free to add, and the first free topics are open to everyone.`

The free topics are `FREE_ENROLL_GS = [3060, 3970]`
(`src/features/enrollment/enrollmentStore.ts:43`) — Pro Audio Safety and DAW
Fundamentals & Session Management. Checking every family's `topicGs` in
`src/data/careerFamilies.json`:

- 42 families total.
- **41 list neither 3060 nor 3970.**
- **gs3060 (Pro Audio Safety) appears in no family at all.**
- The one family that contains a free topic is `music-creation-daws-synthesis-and-sonic-art`,
  whose `topicGs` is `[4070, 4040, 4050, 4060, 3970]` — gs3970 is at **index 4**.

And `CareerFamilyScreen.tsx:27,66`:
```ts
const START_HERE = 3;
const topicsToShow = allTopics ? fam.topicGs : fam.topicGs.slice(0, START_HERE);
```

So the only family that has a free topic does not show it until the user taps
"Show 2 more topics". **On the screen as it first renders, the sentence is false on
all 42 families, not 41.**

The gate that contradicts it: `src/features/commercial/studyGate.ts:43-45`
```ts
// Fails CLOSED when there is no gs — a pseudo-topic is not a free topic.
return !(displayedGs != null && freeGs.includes(displayedGs));
```

The second clause, "free to add", is literally true — `toggleTopic` is device-local and
ungated — but it is the setup for the wall. `studyNow` (`CareerFamilyScreen.tsx:67-76`)
pops to `Main → Study → Dashboard` focused on the topic they just added, where
`studyMethodLocked` locks every method. Mitigation that does exist: the Dashboard
surfaces `StudyAccessSheet`, which offers the two real free topics by name
(`StudyAccessSheet.tsx:69-80`), so the landing is graceful rather than dead. That is
the reason I rate this MAJOR rather than BLOCKER.

**Suggested shape of the fix (not applied):** drop the clause, or make it conditional on
`fam.topicGs.some(isFreeEnrollGs)` *and* on that topic being inside `topicsToShow`.

---

## F3 — MINOR (honesty, in the "free thing behind a lock" direction) — `LabCategoryScreen` paints no lock and no FREE tag, on a surface the app publishes as a deep link

**Confidence: high.**

`src/screens/lab/LabCategoryScreen.tsx:38-41`
```ts
const go = navigation.navigate as unknown as (route: string, params?: object) => void;
const open = (leaf: LabLeaf) => {
  if (leaf.route) go(leaf.route, leaf.params);
};
```

There is no `useEntitlement` in the file, no `leafLocked`, no `freeIncluded`, no `🔒`.
Every row renders an identical `OPEN` button for every tier
(`LabCategoryScreen.tsx:129-140`).

Compare the sibling list, `src/screens/lab/EarLabScreen.tsx:76-84`, which gets this
right — `leafLocked`, `freeIncluded`, a `🔒` glyph, a green `FREE` tag, and a distinct
accessibility label (`:281`).

This screen is the registered target of `labs/:id` (`src/navigation/linking.ts:95`),
which is a claimed custom-scheme path **and** a Universal/App Link on
`proaudiotrainingacademy.com`. Nothing inside the app navigates to it
(`grep` for `LabCategory` finds only the linking table and the catalog type import), so
the only way in is a link the app itself publishes.

**What the user does:** follows `proaudiotrainingacademy.com/labs/dynamics`.
**What happens:** a list of four labs with plain OPEN buttons. Tapping one lands them
behind the preview scrim and an upgrade sheet.
**What should happen:** the same lock/FREE treatment `EarLabScreen` already computes —
both are one call to `isMemberOnlyLabRoute(leaf.route)` away.

It also costs the other direction: a free user who deep-links to `labs/sound` is never
told that two of those four labs are already theirs.

Not an access leak — `withMembershipPreview` still gates the destination.

---

## F4 — MINOR — Double-tapping the preview's dismiss pops two screens

**Confidence: high on the code; I have not run it on a device.**

`src/features/lab/LabPreviewOverlay.tsx:23-28`
```ts
const leaveLab = () => {
  beginLabPreviewLeave(); // hold the scrim through the pop; safety net stands down
  if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
  setTimeout(endLabPreview, 350);
};
```

`beginLabPreviewLeave()` is idempotent (`labPreviewStore.ts:36`, returns early if
`state.leaving`), but `goBack()` is not guarded by it. And `UpgradeSheet` stays mounted
and fully tappable for the whole 350 ms, because it renders on `visible={active}` and
`active` is unchanged by `beginLabPreviewLeave` — only `leaving` changed. The scrim is
deliberately held over the pop animation, so **for 350 ms after the tap nothing visibly
happens**, which is exactly the condition that produces a second tap.

Second tap → `goBack()` again → pops the Ear Lab too. From `CompressionLab` the user
lands on `AudioLearning` (or Home) instead of the lab list they came from.

A one-line `if (state.leaving) return;` at the top of `leaveLab`, or gating the sheet on
`active && !leaving`, closes it. (Reported as a mechanism note under my question 3, not
as a re-report of the pass-1 registration bug.)

Related, lower confidence and **I do not claim it fires**: if `canGoBack()` were ever
false, `endLabPreview` would still run 350 ms later and drop the scrim off a live
members-only lab; `withMembershipPreview`'s effect would then re-arm the preview, giving
an undismissable loop. I traced why it should not happen —
`linking.ts:50 initialRouteName: 'Splash'` keeps a route under any deep-linked screen,
and `SplashScreen.tsx:93-96` resets to `[base, ...above]` with `index: above.length`, so
a deep-linked lab always has `Main` (or `Auth`) beneath it. Worth a defensive guard
anyway, since the cost of being wrong is a trapped user.

---

## F5 — MINOR — The "ratified ladder" in `capsFor()` has drifted from the shipped gates, and 5 of its 7 capabilities are read by nobody

**Confidence: high.**

`src/features/commercial/EntitlementProvider.tsx:31-48,52-96` declares itself the single
place the tier→capability ladder lives:

> `/** The ratified ladder (§3) as a pure map. … this map converts state → capabilities for rendering. */`

Actual consumers, across the whole of `src`:
- `caps.allTopics` — `CourseSelectionScreen.tsx:1041`
- `caps.albumAchievements` — `ProfileScreen.tsx:707`
- `caps.commonMistakes`, `caps.audioTools`, `caps.freeTopics`, `caps.syncedProgress`,
  `caps.completionRecords` — **no consumers.**

Two of the dead entries now state the opposite of what ships:

| `capsFor` says | What ships |
|---|---|
| `free: { audioTools: false }` (`:71`) and `lapsed: { audioTools: false }` (`:83`) | The Tools hub is open to every tier. `ToolLockUi.tsx:2-7`: *"Free accounts keep OPEN TOOL free"*; only LEARN/DEMO, the Saved Measurements library and Light Pulse are gated. The Home card eyebrow reads `INCLUDED FOR EVERYONE` (`CourseSelectionScreen.tsx:829`). |
| `anonymous: { freeTopics: false }` (`:91`) | A guest **can** study the two free topics. `studyGate.ts:41-45` only special-cases `academy`; `openPublicCourse` (`CourseSelectionScreen.tsx:1355-1359`) lets a session-less guest into a free topic, and the guest dialog promises it: *"Your free topics — Pro Audio Safety and DAW Fundamentals — are open to explore right now."* (`:1659`). |

Nothing misbehaves today because nothing reads those fields. The risk is the next person
who trusts the comment and wires a gate to `caps.audioTools` or `caps.freeTopics`.
Either delete the dead fields or correct them.

(`caps.commonMistakes: false` for free is also stale in an interesting way — the server
view unmasks `common_mistakes` for everyone on the two free topics (`study/api.ts:189-192`),
and `FlashcardsScreen.tsx:177` correctly prefers the real data and only falls back to the
member-only line when it is null. That path is right; only the map is wrong.)

---

## F6 — MINOR — The calculator-workflow limits table and its copy contradict the later "all workflows are Academy-only" ruling

**Confidence: high that the two rulings conflict; high that the copy is currently
unreachable, so no user is being lied to today.**

Two owner rulings, eight days apart, both still in the code.

`src/screens/lab/calc/workflowModel.ts:127-135` (owner 2026-08-06):
```ts
// Owner 2026-08-06: creating custom "My Workflows" (new OR duplicate-and-
// customize) is ACADEMY-ONLY. Free accounts can run templates, resume, and
// save/share their results — but savedWorkflows stays 0.
free: { savedWorkflows: 0, savedProjects: 3, savedResults: 10, templates: 'selected', canResume: true },
```

`src/screens/lab/calc/CalcLabScreen.tsx:31-47` (owner 2026-08-13):
```ts
// ALL workflows are ACADEMY-ONLY (owner 2026-08-13): running a guided
// multi-step sequence, using templates, AND building your own.
...
'Calculator workflows — running a guided multi-step sequence, using templates, or building your own — are part of Academy membership. Every individual calculator stays free to use.',
```

The 08-13 gate is the one that ships, and it is the only door: `CalcWorkflows`,
`CalcWorkflowEdit` and `CalcWorkflowRun` are reachable only through
`gateWorkflow(...)` at `CalcLabScreen.tsx:51,133,164`, and they are registered raw in
`RootNavigator.tsx:482-484` with no deep link. So the 08-06 copy is stranded behind a
door non-members cannot open:

- `CalcWorkflowsScreen.tsx:81` — *"You can still run any template as-is."*
- `CalcWorkflowsScreen.tsx:226` — *"Building your own workflows is an Academy membership feature — the templates below are ready to run."*
- `CalcWorkflowRunScreen.tsx:410` — *"Free accounts keep up to 10 results. Academy membership removes the limit."*

Each of those only renders when `limits.savedWorkflows === 0`, i.e. to a non-member —
who by the 08-13 ruling is never on that screen. False if ever shown; dead otherwise.
`limits.templates` (`'selected' | 'all'`) has **no reader anywhere** —
`CalcWorkflowsScreen.tsx:235` renders all 28 `WORKFLOW_TEMPLATES` unfiltered.

**Why this matters beyond tidiness.** If the 08-06 model is ever restored, or if the
`CalcLabScreen` gate is bypassed, `CalcWorkflowRunScreen` reveals live calculator
answers with no cap at all: `runCompute` at `:220`, rendered at `:621`, no
`consumeCalc`, no CALCULATE button, no `mustSignIn`. The 28 templates cover 60 distinct
calculator functions including cable voltage drop, amplifier/load matching, SPL, room
modes and Ohm's law. **Today the gate holds** — I traced every navigation site — so this
is a latent hazard, not a live leak. It should be settled deliberately rather than left
as two live rulings.

(There is a sub-second window at `CalcLabScreen.tsx:38`: `workflowsAllowed = !commercialMode ||
!resolved || isMember`. `resolved` flips in a `.finally()` on the first attempt
(`EntitlementProvider.tsx:344`), and the Workflows section is collapsed by default
(`CalcLabScreen.tsx:57`), so reaching it inside that window takes two taps in under the
first server round-trip. Real but not practically exploitable.)

---

## F7 — MINOR — The onboarding sampler switches off the calculator's sign-in gate *and* its weekly cap, against that module's own written contract

**Confidence: high.**

`src/features/intro/onboardingSampling.ts:7-10` states the rule:

> *"We must NOT suppress anything technically required or safety/consent/**entitlement**
> related (mic permission, EngineGate, **paywall**, safety warnings); those live on
> separate code paths and are left untouched."*

`src/screens/lab/calc/CalcWorkspaceScreen.tsx:111-120` does exactly that:
```ts
const onboardingSampling = useSamplingActive();
const capped = commercialMode && (entitlement === 'free' || entitlement === 'lapsed') && !onboardingSampling;
...
const mustSignIn = commercialMode && resolved && entitlement === 'anonymous' && !onboardingSampling;
```

The flag is cleared **only** when the user returns to the Home route:
`FirstRunCoordinator.tsx:85-90` polls `rootTopRouteName() === HOME_ROUTE` every 250 ms
and calls `setSamplingActive(false)` on arrival. There is no timeout and no route
restriction. The sampler's `calc` stop is a real screen, not a canned demo
(`samplerStops.ts:59-66`, `route: { name: 'CalcWorkspace', params: { id: 'spldist' } }`).

**What the user does:** a brand-new anonymous user reaches the sampler's calculator stop.
**What happens:** no "Create a free account (or sign in) to run calculations", no
CALCULATE button, no credit spent — unlimited live answers for as long as they stay off
Home, across every function in the `spldist` workspace.

Bounded in practice: `CalcWorkspace` is a root-stack screen pushed from Home, so its only
back destination clears the flag, and there is no navigation from it to another
workspace. The flag is in-memory so a relaunch resets it. I rate this MINOR because the
exposure is one workspace and the behaviour is dated and deliberate (owner 2026-09-07).
It is worth flagging because the module's own header forbids it, so the next reader will
assume entitlement is never touched here.

---

## F8 — VERIFY, not a finding — the calculator cap's deployment state and its offline behaviour

Two things I can see in the repo but cannot settle from here.

**(a) 5 vs 10.** `src/features/lab/calcUsage.ts:22` sets `CALC_WEEKLY_LIMIT = 5` and its
comment points at `docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL`. That file's own header
(`:10-13`) says:

> *"Until this runs, the server keeps enforcing 10 while the UI's fallback copy says 5."*

`docs/APE_CALC_WEEKLY_LIMIT_2026_08_13.sql` (the original) hardcodes `v_limit integer := 10;`
in both functions. Nothing in the repo records the 5-limit script being applied. The
display is safe either way — the counter and the CALCULATE prompt both prefer the
server's `lim` (`CalcWorkspaceScreen.tsx:156,294`) and only fall back to 5 before the
first status lands — so the failure mode is "told 5, actually get 10", which is
under-promising. Worth confirming against the live DB with the owner alongside the other
undeployed migrations already on the known list.

**(b) Offline fail-open.** Already reported in pass 2; one thing to add that changes how
it presents. `calcUsage.ts:53-64` and `:39-45` return `OPEN = { allowed: true,
unavailable: true }` on any error, and `CalcWorkspaceScreen.tsx:167-171` then reveals the
answer without counting. The addition: `counterText` is gated on
`usage && !usage.unavailable` (`:155-156`), so in airplane mode the "# / 5 free
calculations this week" line **disappears entirely**. There is no visible signal that the
cap is off, which is what makes it discoverable — the user notices the counter vanish and
the answers keep coming.

The comparison the task asked for is real: `src/features/glossary/glossaryCap.ts` already
solves this shape. It carries a second backend, `'local'` (`:105-160`), an AsyncStorage
rolling-week window used for anonymous guests who have no account to count against, with
the same `{used, limit, allowed, windowStart}` contract. `calcUsage.ts` has no `'local'`
mode at all. If the owner wants a device-local floor for the calculator, the pattern is
already written and tested next door.

Boundary behaviour otherwise checks out: `calc_consume` is atomic (`select … for update`),
re-tapping CALCULATE on the same inputs does not re-spend (`consumedSig === inputSig`,
`:155`), two same-tick taps are blocked by `consumingRef` (`:130-131`), and the halfway
nudge scales off `u.limit` rather than a hardcoded 5 (`:181`). The only user-side reset is
a new account or an unreachable server — the count is keyed to `auth.uid()` server-side,
so clearing local data does nothing.

---

## F9 — MINOR — Two card eyebrows say "INCLUDED FOR EVERYONE" over metered or partly-locked features

**Confidence: high; low severity — both caveats exist, just not on the card face.**

`src/screens/courses/CourseSelectionScreen.tsx:829-831`
```ts
const eyebrow = isTools
  ? 'INCLUDED FOR EVERYONE'
  : isGlossary
    ? 'INCLUDED FOR EVERYONE'
```

- **Glossary.** Free use is 14 definitions a rolling week (`glossaryCap.ts:30`,
  `GLOSSARY_WEEKLY_LIMIT = 14`). The allowance IS disclosed — `COPY.glossaryFreeAllowance`
  renders on the paywall (`PaywallScreen.tsx:324`), the upgrade sheet
  (`UpgradeSheet.tsx:54`), the Auth screen in its short form (`AuthScreen.tsx:542`),
  the About sheet (`AboutHomeSheet.tsx:24-25`) and a "N left" nudge at 7 used
  (`GLOSSARY_WARN_AT_USED`). Just not on the card that says "everyone".
- **Tools.** The hub is genuinely open; LEARN/DEMO, the Saved Measurements library and
  Light Pulse are Academy-only (`ToolLockUi.tsx:2-7,34-56`). The card's own sub-line does
  disclose part of it — *"Learn how to use them with tutorials in Academy Mode"*
  (`:872`) — but not the SAVE gate.

Copy-only; no code change. Flagging because "INCLUDED FOR EVERYONE" is an absolute and
these are the two places the app uses one.

---

## F10 — MINOR — A guest sees the Calculator Laboratory as open, then is told to sign in inside every calculator

**Confidence: high.**

`src/screens/lab/labCatalog.ts:444-448`
```ts
// Always open, to every tier (owner 2026-09-01) — free accounts are limited
// by the weekly calculation cap, not by a lock on the lab.
alwaysFree: true,
```

That is honored consistently — `labMembership.ts:43-47` exempts it from the section lock,
`EarLabScreen.tsx:93,149` never locks or previews it, so the Ear Lab shows an unlocked
purple **Audio Calculator Laboratory · 163 Calculators** card sitting under a section
header that reads "Members only · preview" (`EarLabScreen.tsx:140`).

But the gate one screen in, `CalcWorkspaceScreen.tsx:120,268-270`:
```ts
const mustSignIn = commercialMode && resolved && entitlement === 'anonymous' && !onboardingSampling;
...
<Text style={styles.resultPlaceholder}>Create a free account (or sign in) to run calculations.</Text>
```

The `alwaysFree` comment says "free accounts are limited by the weekly cap" — which is
true for `free`/`lapsed` and **not** for `anonymous`, who gets nothing. A guest who
entered through "Guest Mode (Free)" (`AuthScreen.tsx:501`) walks an unlocked card into a
withheld answer.

This may well be the right product call (a per-account cap needs an account). The list
just carries no cue, where the same list happily paints `🔒` and `FREE` on every other
row. One word on the card would settle it.

---

## F11 — MINOR — Nothing tells a lapsed member what they keep and what they lose

**Confidence: high.**

A lapsed member is told their *state* in two places — `ProfileScreen.tsx:467`
("MEMBERSHIP LAPSED") and `SettingsScreen.tsx:629,634` ("LAPSED") — plus a RENEW ACADEMY
button (`ProfileScreen.tsx:1090`). Neither says what that means.

The only explanation is reactive, one tap at a time:
`CourseSelectionScreen.tsx:1314-1322`
> *"Your membership has expired. Renew to open your saved Home cards and continue studying."*

What they actually keep, traced:
- **Earned credentials: yes, and they should.** `CredentialWall.tsx:59-60` and
  `AwardsScreen.tsx:458-459` gate on *having an account* (`entitlement !== 'anonymous'`),
  not on membership. `capsFor('lapsed')` agrees (`completionRecords: true`,
  `albumAchievements: true`) — for once the dead map and the shipped behaviour match.
- **The two free topics.** `CourseSelectionScreen.tsx:1331` — `if (lapsed && !isFreeEnrollGs(gs)) return membershipExpired();`
- **The Tools hub, the glossary (at 14/week), the Career Finder, the three free
  Fundamentals labs, the Calculator Lab (at 5/week).**

What they lose: all other topics, the Training Labs, the tool training layer, Saved
Measurements, the Custom List (`studyGate.ts:57-59`), and calculator workflows.

One "what happens now" block on Profile, or a line under "MEMBERSHIP LAPSED", would turn
a series of locked-door surprises into one honest statement. Copy-only.

Two smaller notes in the same area:
- `CourseSelectionScreen.tsx:1341-1349` (`openBundle`) refuses a lapsed member **any**
  bundle with no free-topic exemption, unlike `openTopic` right above it. Bundles are
  certificate/program groupings so this is probably correct; naming it in case it is not.
- `COPY.betaPricingNote` (`copy.ts:77-79`) renders on the live paywall
  (`PaywallScreen.tsx:369`) and calls the product an *"early beta"* with prices *"valid
  through the end of the year"*. Days from launch, on a store-review screen, both halves
  of that are worth a second look.

---

# Verified TRUE — claims I checked and could not break

Recording these because "I found nothing in X" is a result, and because two of them were
flagged upstream as suspected bugs.

### The Audio Fundamentals labs — the pass-2 flag is NOT a bug; the copy is exactly right

A pass-2 agent flagged that 12 of 15 `fundamentals` leaves carry `member: true`. The real
count is **14 of 17** (I enumerated `labCatalog.ts` directly):

| category | leaves | free | member |
|---|---|---|---|
| `sound` | 4 | 2 — Understanding Level & Amplitude, Foundations of Sound | 2 |
| `acoustics` | 2 | 1 — Wave Physics Laboratory | 1 |
| `signal` | 11 | 0 | 11 |

But the app never claims otherwise. `src/screens/lab/EarLabScreen.tsx:38-43` names the
three, by name:

> `'Start free with the essentials — level and amplitude, the foundations of sound, and wave physics. The deeper Fundamentals labs open with Academy membership.'`

and `:35-38`:

> `'A professional audio curriculum in two parts: Audio Fundamentals — free to start, with the deeper labs unlocked by membership — and the members-only Advanced Training Labs.'`

The same statement is made upstream on every surface that leads here:
- `AudioLearningScreen.tsx:34,39` — *"Start free with the core Audio Fundamentals"*, *"Core labs are free — the deeper Fundamentals…"*, badge `FREE TO START` (`:98`).
- `CourseSelectionScreen.tsx:684-688` — eyebrow `FREE TO BEGIN AND EXPLORE`, with a
  comment recording exactly why it is no longer the same sentence as Tools and Glossary.
- `EarLabScreen.tsx:104` — section subtitle `'Free to start — more with membership'`.

And the three free routes are genuinely ungated: `AmplitudeLab`, `FoundationsCourse` and
`WaveLab` are registered plain at `RootNavigator.tsx:535,537,510` — no
`withMembershipPreview` — and each appears exactly once in the catalog
(`labCatalog.ts:123,124,141`), so `computeLabRouteMembership`'s "members-only only if
EVERY occurrence is" rule resolves them free. `EarLabScreen.tsx:82-84` paints them green
with a `FREE` tag and an ", included free" accessibility label.

**The owner ruling and the code agree.** The 2026-08-23 ruling (recorded at
`labCatalog.ts:107-114`) narrowed free-Fundamentals to the three core intro labs, and
every piece of copy was updated with it. Nothing to fix.

### Pro Audio Safety + DAW Fundamentals & Session Management

Free end-to-end, and consistent across seven places I checked:

`enrollmentStore.ts:43` (`[3060, 3970]`) → `studyGate.ts:41-45` (any non-academy tier,
including `anonymous`, passes on a free gs) → `CourseSelectionScreen.tsx:1355-1359`
(a session-less guest may open them) → `:1331` (a lapsed member keeps them) →
`EnrollmentScreen.tsx:680,689,698` (they cannot be removed) → `:1555` (`· Free` label) →
`DashboardScreen.tsx:1366,1378` (the free-topic offer is built from `FREE_ENROLL_GS`, not
deck order) → `study/api.ts:189-192` (the server view's `common_mistakes` mask unmasks on
the same pair). `enrollmentStore.ts:38-42` carries the right warning about the
`glossary_study_v` mirror.

The guest-gate copy is accurate: *"Your free topics — Pro Audio Safety and DAW
Fundamentals — are open to explore right now."* (`CourseSelectionScreen.tsx:1659`).

One dormant second source of truth worth knowing about: `v3Curriculum.ts:21,102` builds a
`free: !!r.always_free` flag from the DB. **It has no readers** (`grep` for `.free` finds
only an unrelated `wave` viz field). If someone ever wires it up, it and
`FREE_ENROLL_GS` will need reconciling.

### The lab PREVIEW mechanism — nothing leaks

I checked each of the four leaks the task named.

- **Audio: blocked.** `AudioOutputGate.tsx:97-103` — `requestAudioOutput()` returns
  `false` the moment `getLabPreview().active`, before even raising the
  "audio output is off" popup. Mic *input* and readouts keep running, which is the
  documented intent (`LabPreviewOverlay.tsx:4-8`: the lab keeps running behind the glass).
- **Completion credit: blocked at the root.** `labCompletion.ts:300-308` —
  `markLabUnit` returns early on an active preview, which is the single funnel for
  every unit, `markLabReviewed`, `fireComplete`, `mark_lab_complete` and
  `noteHighValueEvent('lab_completed')`. Nothing can bank a unit behind the scrim.
- **Exports / saved measurements: blocked by construction.** `UpgradeSheet`
  (`UpgradeSheet.tsx:31-33`) is a full-bleed `position:absolute` backdrop at `zIndex: 10`
  whose entire upper region is a `Pressable`, so no control on the lab beneath is
  reachable. Every export I looked at (cymatics gallery, harmonograph, calc SHARE) is
  user-initiated, so none can fire.
- **Does it end?** Three independent ends, and they cooperate: the overlay's own
  `leaveLab`/`onSeePlans`, the root navigation-state net at `App.tsx:208-217` (which
  correctly stands down while `leaving` is set, so it cannot pre-empt the deliberate
  leave), and `withMembershipPreview.tsx:62-74` (which clears a stale preview the moment
  entitlement upgrades under an open lab). The one rough edge is F4 above.

Also correct: the screen-level gate holds the paid content behind a `GateHold` until
entitlement resolves (`withMembershipPreview.tsx:76-78`), so the lab only ever mounts
behind the scrim — and a *member* never sees a paywall flash, which is the same bug in
the other direction.

### Every upgrade prompt reaches a working paywall

29 `navigate('Paywall')` sites across 22 files (excluding `DevVisualIndex`), plus one
help-screen jump (`helpContent.ts:83` → `HelpScreen.tsx:220`). All resolve to the single
registered `Paywall` route. Spot-checked the wording across the lab preview, the tools
lock, the glossary topic filter, the calculator cap, the workflow gates and the lapsed
"Membership Expired" alert — all use the same "See membership" / "Not now" shape and none
is a dead tap (the ones that used `Alert.alert` on web were already converted to
`confirmDialog`).

The paywall itself refuses to charge or restore for an account-less user
(`PaywallScreen.tsx:162-172`, `:190-206`) — the pass-2 fix is present and correct — and
its restore is the honest four-state version.

### `AccuracyNote` on the calculator

`CalcWorkspaceScreen.tsx:302` carries `<AccuracyNote compact variant="calc" />`, so the
free/paid changes have not disturbed the standing accuracy rule on this screen. (The 13
labs missing it are on the known list and are not mine.)

---

# Coverage

**Read in full or in the relevant part:** `labCatalog.ts`, `labMembership.ts`,
`EarLabScreen.tsx`, `AudioLearningScreen.tsx`, `LabCategoryScreen.tsx`,
`withMembershipPreview.tsx`, `labPreviewStore.ts`, `LabPreviewOverlay.tsx`,
`UpgradeSheet.tsx`, `labCompletion.ts`, `AudioOutputGate.tsx`, `EntitlementProvider.tsx`,
`studyGate.ts`, `StudyAccessSheet.tsx`, `enrollmentStore.ts`, `calcUsage.ts`,
`glossaryCap.ts`, `CalcWorkspaceScreen.tsx`, `CalcLabScreen.tsx`,
`CalcWorkflowsScreen.tsx`, `CalcWorkflowRunScreen.tsx`, `workflowModel.ts`,
`workflowCatalog.ts`, `PaywallScreen.tsx`, `purchase.ts`, `iapProducts.ts`, `copy.ts`,
`ToolLockUi.tsx`, `CareerFamilyScreen.tsx`, `careerIndex.ts`, `onboardingSampling.ts`,
`FirstRunCoordinator.tsx`, `samplerStops.ts`, `SplashScreen.tsx`, `linking.ts`,
`App.tsx` (preview net), and the commercial paths of `CourseSelectionScreen.tsx`,
`ProfileScreen.tsx`, `SettingsScreen.tsx`, `EnrollmentScreen.tsx`.

**Data checked directly:** `src/data/careerFamilies.json` (all 42 families' `topicGs`
against `FREE_ENROLL_GS`), `labCatalog.ts` fundamentals leaf census,
`docs/APE_CALC_WEEKLY_LIMIT_2026_08_13.sql` and
`docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL`.

**Greps run across all of `src`:** `free`, `included`, `everyone`, `preview`, `sample`,
`try`, `begin`, `unlimited`, `full access`, `every lab`, `$<digits>`, `Paywall`,
`capsFor` / `caps.`, `alwaysFree`, `FREE_ENROLL_GS` / `isFreeEnrollGs`,
`getLabPreview` / `withMembershipPreview`, `loadStoreProducts`, `limits.templates`,
`lapsed`.

**Not covered — say so rather than imply otherwise:**
- **The live database.** `public.products` prices, whether
  `APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL` and the glossary-cap SQL are deployed, and
  whether `calc_consume` / `glossary_consume` are reachable in production. All of F8 and
  half of F1's impact turn on this. Settling it takes one read-only query per RPC against
  the live project, with the owner.
- **Store Connect / Play Console.** Whether non-US price tiers exist for the three SKUs.
  If the app is US-only at launch, F1 drops from MAJOR to a latent issue.
- **Device behaviour.** Everything here is traced from source; F4 in particular I would
  want confirmed with two quick taps on a real phone.
- **Server-side entitlement enforcement.** Out of my axis and already on the known list
  (the certificate trigger, the undeployed tenure migration, enrollments never pulled
  back).
- **Whether the gates hold.** Passes 1 and 2 own that. Where I touched it — the 29
  paywall routes, `withMembershipPreview`'s coverage, the workflow-runner door — I
  verified rather than re-reported, and the only thing I found is the latent F6.
