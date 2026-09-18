# Pass 4 — agent H, fresh eyes (no assigned axis)

Four findings. One MAJOR, three MINOR. Nothing padded; the "where I looked and
found nothing" section at the end is longer than the findings on purpose.

I deliberately avoided the areas the eight earlier reports name. Method: I
concatenated every `pass1/2/3-*.md`, diffed the filenames they mention against
the 843 files in `src/`, and worked the 338 that no report has ever cited —
biggest first, plus a few structural sweeps (orphan routes, missing assets,
duplicate ids, unmounted components, UTC dates).

---

## H-1 — **MAJOR**: the shake gesture is bound to two different actions at once, so the safety mute silently writes study progress

**Confidence: high.** Both code paths read in full; the two thresholds are
checked against each other; the mount point is confirmed.

**Files**
- `src/features/audio/ShakeToMute.tsx:21–70` (global panic mute), mounted at
  `App.tsx:510`
- `src/lib/useShake.ts:22–50` (the other shake detector)
- `src/screens/study/FlashcardsScreen.tsx:1167–1170` → `1046–1069`
- `src/components/StudyFsOverlay.tsx:65`, reached from
  `src/screens/study/FillInBlankScreen.tsx:497` and
  `src/screens/study/MatchingScreen.tsx:592`
- The promise it breaks: `src/features/audio/AudioOutputGate.tsx:286`,
  `src/features/audio/AudioOutputRow.tsx:57,65`,
  `src/features/audio/soundSafetyText.ts:55`

**What the user does.** Turns audio on anywhere in the app (a lab, a tool, the
sound-safety gate). The gate tells them, in red caps: *"⚠ SHAKE THE PHONE AT ANY
TIME TO INSTANTLY MUTE AUDIO OUTPUT."* Later in the same session they are
studying flashcards in full screen and shake the phone — because that is what
the app told them to do.

**What happens.** Two independent accelerometer listeners are live at the same
time and both fire:

1. `ShakeToMute` panic-mutes. Correct.
2. `useShake` in `FlashcardsScreen` calls `toggleKnown()` for the card on
   screen. `toggleKnown` (`1046–1069`) is not cosmetic. It calls
   `setInTermList('known', card.id, true)` (the global known-terms list), pushes
   `session.current?.addEvent({ kind: 'known', value: true })` (server study
   credit, which feeds the flashcards-100% gate), and hides the card from the
   deck. If the card was **already** known it runs the other branch: un-knows it
   locally and returns it to the deck while, per the comment on line 1052,
   *"server credit stays"* — so the list and the percentage now disagree.

The thresholds guarantee the overlap rather than making it a rare race. A mute
needs `NEED = 2` samples at `g ≥ 1.9` inside 700 ms; `useShake` needs one sample
at `g > 1.8`. Every shake strong enough to mute is by definition strong enough
to fire `useShake`, so the study write is not an edge case — it is the normal
outcome. The only thing between the user and the write is `dwellOk()` (1.5 s on
the current card), which a user who has been reading the card has already
satisfied.

The same collision hits `StudyFsOverlay` (`:65`): in Fill-in-the-Blank and
Matching full screen, the mute gesture also navigates back a question.
`MatchingScreen.tsx:275` notes that shake is counted as a *real* interaction
there, so it is not inert either.

This is not a narrow window. `touchAudioActivity()` is called from the root
touch capture (`App.tsx:463`), so the 20-minute idle auto-mute
(`audioOutputStore.ts:24`) never expires while the user is tapping through
flashcards. Audio-enabled-and-studying is the ordinary state of a study session.

**What should happen.** The panic gesture should do exactly one thing. Either
the `useShake` consumers gate on `!useAudioOutputEnabled()`, or `ShakeToMute`
claims the gesture exclusively while audio is on and the study shortcuts stand
down. A safety gesture must never write to the learner's record.

**Two smaller notes on the same code, same cause:**
- `Accelerometer.setUpdateInterval()` is a per-sensor global in `expo-sensors`,
  not per-listener. `useShake` sets 120 ms (`useShake.ts:31`) and `ShakeToMute`
  sets 80 ms (`ShakeToMute.tsx:42`); whichever mounts last wins, so entering
  flashcards full screen quietly slows the panic detector's sampling.
- `useShake.ts`'s own docstring still says *"A new EAS dev build is required for
  shake to actually fire"*, and `FlashcardsScreen.tsx:1167` repeats *"No-ops
  until a build includes expo-sensors (flagged)"*. `expo-sensors@57.0.3` is in
  `package.json:39` and is installed. The comments are stale, and they are
  probably why nobody noticed that both bindings now fire on a real phone.

---

## H-2 — **MINOR**: the Cable Install lab's professional scorecard is not an average, and the capstone's inspection score is dropped entirely on resume

**Confidence: high** on both mechanisms (pure functions, read in full).
**Medium** on how much a learner notices — it is a displayed number, not a gate.

No pass report mentions `src/screens/lab/cableinstall/**` at all; it is ~500 KB
and a paid lab.

### (a) `mergeDims` is a 50/50 blend, not a running average
`src/screens/lab/cableinstall/engine/score.ts:64–75`

    out[d] = prev == null ? v : Math.round((prev + v * weight) / (1 + weight));

The docstring says *"Merge module dimension results (running average per
dimension)"*. With the default `weight = 1` this is `(prev + v) / 2` — an
exponential blend with no sample count, so the last module to touch a dimension
owns half of its final score, the one before it a quarter, and so on.

Eleven scenes feed dimensions (`CeilingScene:773`, `EmiScene:630`,
`FireScene:464`, `FloorScene:1072`, `KnowScene:282`, `LabelScene:616`,
`MechScene:740`, `RackScene:1529`, `RouteScene:697`, `SupportsScene:634`,
`InspectScene:522`) and they overlap heavily — `routing` is written by six of
them, `protection` by five. The merge happens at
`CableInstallLabScreen.tsx:200–207`.

Concretely: a learner who scores 100 on routing in stages 2–10 and 0 in stage 11
is shown **50**; the true mean is 83. The reverse run is also shown 50. The
screen prints that number as `Routing & Support: 50 out of 100`
(`CableInstallLabScreen.tsx:530`, `bits.tsx:208`), drives the 0–5 mastery blocks
(`masteryBlocks`), and drives `weakestDim` → the `Recommended review: …` line at
`:543`, which can therefore name the wrong dimension.

`weakestDim`'s own comment (`score.ts:104–107`) records that the team already
fixed one "advice that trains learners to ignore the advice" bug here. This is
the same failure one layer down.

### (b) `passDims` is lost when the capstone is resumed
`src/screens/lab/cableinstall/scenes/InspectScene.tsx:430–433, 507–523`

`phase` resumes to `'quiz'` when `inspect_pass` is already cleared — but
`passDims` is `useState<CiDimScores>({})` at `:433` and is only ever written by
`finishInspection()` (`:507`). A learner who passes the facility inspection,
leaves the lab, comes back and finishes the knowledge check reaches
`onComplete(passDims)` at `:522` with `{}`. `mergeDims` skips null dimensions,
so the capstone — the one stage scored across every defect the learner found,
classified and corrected — contributes **nothing** to the final scorecard. It
should persist the dims alongside `inspect_pass` (the screen already persists
`dims` to `ape:ciState`) and restore them.

---

## H-3 — **MINOR**: two user-facing documents stamp a UTC date, so an evening in the Americas prints tomorrow

**Confidence: high.** A straight `toISOString().slice(0, 10)` on a local
wall-clock concept.

1. `src/features/production/packet.ts:106`

       revisionDate: new Date(project.updatedAt).toISOString().slice(0, 10),

   This is the **"Revision date"** row of the document-control block (`:150`)
   and the page footer (`:268`) of the Production Packet — the client-facing PDF
   the pre/post-production labs exist to produce. A user in PDT who edits their
   project at 6 pm gets a packet whose revision-control block is dated tomorrow.
   On a document whose entire point is revision control, that is the wrong kind
   of wrong.

2. `src/screens/lab/cymatics/ExportPanel.tsx:47`, used at `:104`, `:110`, `:209`

       const today = () => new Date().toISOString().slice(0, 10);

   The same off-by-a-day on the exported/printed Cymatics art sheet, the Compare
   sheet, and the on-screen preview row.

Both should format from local time (`getFullYear/getMonth/getDate`, or
`toLocaleDateString('en-CA')`). The app already gets this right elsewhere —
`src/features/notifications/curatedTermLists.ts:53` explicitly subtracts
`getTimezoneOffset()` to derive a local day number — so the idiom exists in the
codebase.

---

## H-4 — **MINOR**: the certificate chooser shows an empty dark box with a caption floating on it for every credential whose art has not been uploaded

**Confidence: high on the code path; medium on the current count.** The
"62 of 128" figure is the registry's own comment and I cannot check the storage
bucket from here. Fetching a handful of
`…/storage/v1/object/public/course-cards/<slug>.webp` URLs would settle it.

`src/features/credentials/credentialArt.ts:17–20` states that as of 2026-09-17
only 66 of 128 certificates have art uploaded, that a slug without art
*"resolves to a URL that 404s"*, and — the part that is not true everywhere —
that *"the caller falls back to the badge on load error."*

- `src/screens/achievements/CredentialWall.tsx:127,179` **does** implement that
  fallback, via an `artFailed` set.
- `src/screens/awards/CredentialDetailModal.tsx:151–153` does not. It renders a
  full-bleed art head with `Simulated possible work environment` painted over it
  as a watermark. With no art that is those five words floating on an empty dark
  rectangle. The well also carries
  `accessible accessibilityLabel={c.name + ' artwork'}` (`:151`), so a screen
  reader announces artwork that is not there.
- `src/screens/awards/AwardsScreen.tsx:374` and
  `src/screens/courses/StudyAreaExplore.tsx` (same import) do not either.

`src/components/CardArt.tsx` has no error/placeholder state by design — it
retries three times (`MAX_ATTEMPTS`) and then stays blank — so every caller has
to supply its own fallback, and only one of four does. The same credential
therefore reads as a proper badge on the Achievements wall and as an empty box
on the chooser.

*(Incidental, not a user bug: `CredentialThumb` and `CredentialArtViewer` in
`src/screens/awards/CredentialThumb.tsx` are dead — the three importers take only
`credentialArtUrl` / `credentialEyebrow`. The file's docstring still describes a
tap-to-open full-screen viewer, while `CredentialDetailModal.tsx:149` records the
deliberate decision not to use it. Stale code carrying a misleading doc, nothing
more.)*

---

# Where I looked and found nothing

Reported honestly, because after four passes this is the more useful half.

**Structural sweeps — all clean.**

- **Every `require()` of an image or audio asset in `src/` resolves to a file on
  disk.** The one apparent hit (`credentialArt.ts:27`) is a `require` inside a
  comment.
- **Every `route:` in `src/screens/lab/labCatalog.ts` (51 of them) and in
  `src/screens/tools/toolsData.ts` is registered in `RootNavigator.tsx`.** The
  production labs look unregistered to a single-line grep because
  `PreProdLab`/`PostProdLab` are multi-line JSX at `RootNavigator.tsx:493–501`;
  they are registered, and gated.
- **No orphan `*Screen.tsx`.** Every screen file is referenced from somewhere
  else. `InstitutionalScreen` is reachable only from
  `src/features/dev/DevVisualIndex.tsx:200`, i.e. dev-only, not from any user
  path or deep link.
- **Exported components nothing renders (21 of them)** are all dead drawing
  helpers — `gainViz` internals, `TubeGlyph`, `VowelChart`, `MediaBox`,
  `ReturnButton`, `CertIcon` and similar. None is a missing piece of a live
  feature. `MediaBox` in particular is only a hatched placeholder; flashcard
  media renders from `mediaByItem` and the "show media" toggle works.
- **Duplicate `id:` values in the big data registries** (`connectors.*.ts`,
  `lesson*.ts`, the production `stage*.data.ts` files) are all per-object
  pinout/option ids scoped to their own array — nothing is shadowed in a flat
  lookup.

**Cable Install lab** (`src/screens/lab/cableinstall/**`, ~500 KB, zero prior
mentions). Beyond H-2 this is in better shape than its size suggests. Resume,
the cleared-unit mirror and the myth interstitial all carry dated fix comments
(B-064, B-153, B-164) for exactly the bugs I went looking for;
`canEnter`/`firstIncomplete` are computed per render specifically to avoid a
stale memo; `rankRoutes` was already corrected from an unweighted mean to the
spec weights plus an outright safety rejection. The decoy-generation loop at
`InspectScene.tsx:471` *could* spin forever if fewer than three distinct
`correction` strings existed in the pool — there are 27 distinct across 28
mistakes, so it cannot.

**Tools Hub live previews** (`hubPreviewsLive.tsx`, `hubPreviewEngine.ts`,
`src/components/tooldemos/*` — ~290 KB, near-zero prior mentions). I went in
expecting a microphone left running. It is not: `hubPreviewEngine.ts` stops
capture on blur/unmount, on `AppState` background (`:189–200`, correctly gated
on `'running'` so the permission dialog's own AppState change cannot kill a
starting stream), and explicitly before a tile navigates (`stopForNavigation`).
The tiles rest on static artwork when frames stop rather than faking data.

**Account-wipe completeness.** I started auditing the in-memory store mirrors
against `clearLocalAccountData`, then found `test/accountWipeRegistry.test.ts` —
a new test that asserts this invariant mechanically with a reasoned `EXEMPT`
list. Another agent owns this axis properly, so I stopped. For the record, the
three `reset*` functions that fall outside that test's scan —
`resetTaxonomyCache` (`directory/api.ts`), `resetA11y` (`settings/a11y.ts`) and
`resetGatewayProbe` — are either already wired through another module
(`settings/store.ts:221` calls `resetA11y`) or hold reference data rather than
user data.

**Production `projectStore`.** Reads storage on every call with no module-level
row cache, so saved pre/post-production projects genuinely cannot leak across an
account switch. Its corruption handling (`loadList`, `:118–142`) quarantines bad
rows under a `:damaged` key rather than destroying them, and `acceptCondition`
(`:236–240`) refuses an acceptance with no named person and no reason so no
screen can route around it. Good code.

**Oldest untouched files** (`src/lib/hazard.ts`, `footnote.ts`, `env.ts`,
`useShake.ts`, the `src/components/*Icon.tsx` family, `Confetti.tsx`,
`CoachMark.tsx`). Only `useShake.ts` produced anything — H-1.

**RPC deployment.** `supabase/migrations/` holds exactly one file, so the 48
RPCs the client calls (`get_pace_records`, `record_pace_session`,
`credit_time_trial`, the ten `community_profile_*` / `contact_*` calls, and the
rest) cannot be checked for deployment from the repo. That is a live-database
question, the same class as the certificate-trigger item already open in the
brief — I did not guess at it.
