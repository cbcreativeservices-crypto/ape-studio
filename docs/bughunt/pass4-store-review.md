# Bug hunt — Pass 4, agent B: would this pass App Review?

**Date:** 2026-09-18 · **Branch:** audio-tools-engine
**Axis:** review the app as an App Store / Google Play reviewer would, against the
published guidelines. Not "is it buggy" — "would it be rejected or pulled".
**Method:** source reading only. No build, no `eas` command, no dev server, no git
write. No file was edited except this one.

Severities used here, as the brief asked:
- **REJECTION** — I believe a reviewer would refuse the binary, or the console
  will not let you submit truthfully.
- **RISK** — plausible rejection, or a real policy exposure after launch.
- **NOTE** — worth knowing; not a submission blocker.

---

## WHAT TO FIX BEFORE SUBMITTING

Ordered by how much of the submission they block. The first three are config-file
edits, not code.

1. **Turn off `expo-audio`'s background playback.** `app.json:plugins` lists
   `"expo-audio"` bare, so the plugin default `enableBackgroundPlayback: true`
   applies. That writes `UIBackgroundModes: ["audio"]` into Info.plist and adds
   `FOREGROUND_SERVICE_MEDIA_PLAYBACK` + a `mediaPlayback` service to the Android
   manifest. The app **deliberately kills all audio on background**
   (`AudioOutputGate.tsx:179`), so both are provably unused. → R1.
2. **Drop the Photos *read* permissions.** `expo-media-library` adds
   `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`, `requestLegacyExternalStorage`
   and `NSPhotoLibraryUsageDescription`; the app only ever calls
   `requestPermissionsAsync(true)` (write-only). Google Play's Photo and Video
   Permissions declaration cannot be answered truthfully with these present. → R3.
3. **Put a Privacy Policy and Terms link somewhere a free user can reach.** Today
   the only tappable links in the whole app are on `PaywallScreen`. → R2.
4. **Add a terms/EULA agreement at account creation** (and a content filter, or a
   stated moderation commitment) for the Community Directory's member-to-member
   messaging. → R4.
5. **Correct `docs/APE_STORE_SUBMISSION_PACK_2026_09_07.md` before anyone fills
   in a console form.** It tells the owner to answer "no user-to-user
   communication" on IARC and "no analytics SDK, no crash reporter" on the privacy
   forms. Both are false in the shipping code. → R5.
6. **Prove the IAP path end to end in sandbox before submitting.** If the
   `validate-purchase` secrets are unset, every reviewer purchase returns "We
   couldn't verify that purchase" and the app is a 2.1 rejection. → K1.
7. **Remove the word "beta" from the purchase screen** (`copy.ts:78`) and decide
   about the Career Finder BETA badge. → K2.
8. **Remove the six "Coming Soon" rows from the Smart Processors Lab**
   (`SmartProcessorsLabScreen.tsx:19–24`) — a member-gated lab with 1 working row
   and 6 placeholders. → K5.

---

# REJECTIONS

---

## R1 · REJECTION — The app declares the iOS background-audio mode and an Android media-playback foreground service, and provably never uses either

**Guideline (Apple 2.5.4, Software Requirements):**
> "Multitasking apps may only use background services for their intended purposes:
> VoIP, audio playback, location, task completion, local notifications, etc. If
> your app uses a background service for any other purpose, you must provide a
> reasonable explanation and be prepared for rejection."

Apple's long-standing enforcement of this is: an app that declares
`UIBackgroundModes: audio` and does not play audible content while backgrounded is
rejected.

**Google Play (Foreground Services policy / Android 14 FGS types):** an app whose
manifest declares `FOREGROUND_SERVICE_MEDIA_PLAYBACK` must complete the Play
Console foreground-service declaration for that type and justify it. There is no
media-playback foreground service in this app to justify.

**Where it comes from:** `app.json:129` lists the plugin as the bare string
`"expo-audio"`, so no props are passed and the plugin defaults apply.
`node_modules/expo-audio/plugin/build/withAudio.js:8` —
`enableBackgroundPlayback = true` is the **default**. That default causes, at
`withAudio.js:16–26` and `:34–38` and `:60–71`:

- iOS: `UIBackgroundModes` gains `'audio'`.
- Android: permissions `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
- Android: a `<service android:name="expo.modules.audio.service.AudioControlsService"
  android:foregroundServiceType="mediaPlayback">` with a `MediaSessionService`
  intent-filter.

`app.json` sets no `ios.infoPlist.UIBackgroundModes`, so `['audio']` is the whole
value.

**Why it is provably unused — the code kills audio on background on purpose:**

`src/features/audio/AudioOutputGate.tsx:179–181`:

```ts
if (state === 'background') {
  if (isAudioOutputEnabled()) panicMuteAudio();
  return;
}
```

`panicMuteAudio()` (`src/features/audio/panicMute.ts:20`) stops the generator, the
binaural bus, the modular voice, speech and every file player, then **re-locks the
output gate** so sound cannot resume without a deliberate unlock.
`src/features/audio/exposureMonitor.ts:27–28` states the same rule for the
dosimeter: "the poller stops when the app is not active — exposure is NEVER
accumulated blindly while the OS may have suspended playback."

Neither `expo-audio` call site asks for background playback:
`src/features/lab/LabAudioPlayer.ts:69` and `src/features/ear/earPlayer.ts:112`
both call `setAudioModeAsync({ playsInSilentMode: true })` and nothing else
(`shouldPlayInBackground` defaults false).

**Fix:** change the plugin entry to
`["expo-audio", { "enableBackgroundPlayback": false }]`. (Leave
`recordAudioAndroid` alone — `RECORD_AUDIO` is genuinely used.) Then re-check the
generated manifest: this is a native change, so it needs a build, and per the
`.easignore` memo it changes the fingerprint.

**Confidence:** high on the mechanism (I read the plugin source and the
AppState handler). The only thing I cannot do from here is read the generated
Info.plist / AndroidManifest.xml, because `/ios` and `/android` are gitignored and
`.easignore`d — CNG generates them at build time. **Settles it:** run
`npx expo prebuild --platform ios --no-install` in a *scratch copy* of the repo and
grep the generated `Info.plist` for `UIBackgroundModes`, and the generated
`AndroidManifest.xml` for `FOREGROUND_SERVICE_MEDIA_PLAYBACK`. Do not prebuild in
the working tree.

---

## R2 · REJECTION — There is no Privacy Policy or Terms link anywhere in the app except the paywall

**Guideline (Apple 5.1.1(i), Data Collection and Storage):**
> "All apps must include a link to their privacy policy in the App Store Connect
> metadata field and within the app in an easily accessible manner."

**Google Play (User Data policy):** an app that accesses sensitive permissions —
this one requests microphone and camera — must provide a privacy policy link
"both in the app's store listing page and within the app itself."

**What the app has.** Exactly two links, both on one screen:
`src/screens/commercial/PaywallScreen.tsx:387–395`, opening
`https://www.proaudiotrainingacademy.com/terms` and `/privacy` via
`openPolicy()` at `:284`.

**What it does not have.** I grepped every `.ts`/`.tsx` under `src/` for
`proaudiotrainingacademy.com` and for `terms`/`privacy`/`policy`/`EULA`/`agree to`:

- `src/screens/auth/AuthScreen.tsx` — account creation. **No terms line, no
  privacy line, no link.** (The only near-hit in the file is a comment at `:403`
  about the removed beta-pricing note.)
- `src/screens/about/AboutScreen.tsx:85` — plain, untappable text: "Visit
  ProAudioTrainingAcademy.com or contact us through the in-app Support section."
  Not a link, and not to the policy.
- `src/screens/settings/SettingsScreen.tsx` — FEEDBACK & SUPPORT has Help and four
  `mailto:` rows; ACCOUNT has Student ID, App version, About, Log out. No policy row.
- `src/features/help/helpContent.ts:219–250` — there is a whole "PRIVACY & DATA"
  category, and it does not link the privacy policy.

So a free user, a guest, and a reviewer testing the free tier can go through the
entire app — including granting microphone and camera — and never be shown the
privacy policy. The pass-3 report raised the About-screen half of this (its F-7);
it is broader than that.

**Fix:** a "Privacy Policy" and "Terms of Use" row in Settings → ACCOUNT (reuse
`openPolicy` from the paywall), plus a line under the Create Account button on
`AuthScreen`. Both are cheap and both are what a reviewer looks for.

**Confidence:** high. This is a grep-complete result over `src/`.

---

## R3 · REJECTION (Google Play) — Photos *read* permissions are declared for a feature that only writes

**Google Play, Photo and Video Permissions policy:**
> "Apps that request access to the `READ_MEDIA_IMAGES` and/or `READ_MEDIA_VIDEO`
> permissions must have a core use case that requires broad access… Apps that use
> photo and video permissions for a one-off or infrequent need should use a system
> picker."

**Apple 5.1.1(i)** also expects the purpose string to describe the actual use.

**What the manifest will contain.**
`node_modules/expo-media-library/plugin/build/withMediaLibrary.js:34–40` adds,
unconditionally:

- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.READ_MEDIA_VISUAL_USER_SELECTED`
- `android.permission.READ_MEDIA_IMAGES` — from `granularPermissions: ["photo"]`
  in `app.json:145`

and at `:12–18` sets `android:requestLegacyExternalStorage="true"` on
`<application>`. On iOS it registers **both**
`NSPhotoLibraryUsageDescription` (read the library) and
`NSPhotoLibraryAddUsageDescription` (add only), because `app.json:141–142`
supplies both `photosPermission` and `savePhotosPermission`.

**What the app actually does.** One call site, and it is write-only —
`src/screens/lab/harmoExport.ts:73–79`:

```ts
// ADD-ONLY access (writeOnly): saving a drawing never needs to read the
// library, so iOS asks the narrower "add to Photos" question …
const perm = await ml.requestPermissionsAsync(true);
if (!perm.granted) return 'denied';
await ml.saveToLibraryAsync(asFileUri(uri));
```

There is no `getAssetsAsync`, no album read, no picker. The app never reads a
photo. The iOS string the app supplies for the **read** permission even says so
(`app.json:141`): *"Nothing is read from your library."* A purpose string that
explains why the permission is **not** needed is the tell.

**Fix:** in the `expo-media-library` plugin options set
> ⛔ **SUPERSEDED BY APPLE, 2026-09-19.** `photosPermission: false` was applied,
> and **Apple rejected the upload — error 90683, missing
> `NSPhotoLibraryUsageDescription`.** `expo-media-library` links PhotoKit READ
> APIs regardless of the flag, so the static scanner demands the purpose string
> whether or not the app ever calls them. Fixed in `e0a610d5` with a truthful
> read string ("does not read or import your photos; access is requested only by
> the component that saves…"), rebuilt and **accepted**. DO NOT set it back to
> false. The Android half of this finding (blocking the media READ permissions)
> was not implicated and still stands — but see the warning in
> APE_NEXT_BUILD_CHECKLIST.md, because the same root cause could apply there.

`"photosPermission": false` (the helper at
`@expo/config-plugins/build/ios/Permissions.js:27–29` deletes the key when the
prop is `false`) and `"granularPermissions": []`; then add
`android.blockedPermissions` for `android.permission.READ_MEDIA_IMAGES`,
`android.permission.READ_EXTERNAL_STORAGE` and
`android.permission.READ_MEDIA_VISUAL_USER_SELECTED`. Native change → new build.

**Confidence:** high on what the plugin adds and on the write-only call site.
Same caveat as R1 about reading the generated manifest.

---

## R4 · REJECTION — Member-to-member messaging ships with no content filtering and no terms agreement

**Guideline (Apple 1.2, User-Generated Content):**
> "Apps with user-generated content or social networking services must include:
> • A method for filtering objectionable material from being posted to the app
> • A mechanism to report offensive content and timely responses to concerns
> • The ability to block abusive users from the service
> • Published contact information so users can easily reach you"

Apple's standard rejection text for this also requires "an agreement (EULA) that
users must agree to before using the app, which states there is no tolerance for
objectionable content or abusive users."

**What ships.** This is a real messaging product, not just a listing:

- `src/features/directory/api.ts:448` `sendContactRequest` → RPC `contact_request_send`
- `:476` `sendThreadMessage` → RPC `contact_message_send` (free-text body)
- `:410` `contact_threads`, `:434` `contact_thread_messages` — threaded conversations
- `:488` `blockMember`, `:499` `reportMember`
- UI: `src/screens/directory/AudioCommunityDirectoryScreen.tsx:216–217`
  ("SEND A CONTACT REQUEST"), `:234` BLOCK, `:243` REPORT, `:355` `ReportSheet`;
  `src/screens/directory/RequestsView.tsx:115` BLOCK, `:280` `ReportLink`.

**What is present (credit where due):** block ✓, report with five reasons and a
detail field ✓, reports routed to the operator not the other member
(`AudioCommunityDirectoryScreen.tsx:373`) ✓, published contact info ✓
(`SUPPORT_EMAIL = info@proaudiotrainingacademy.com`, `src/lib/feedback.ts:18`, and
four feedback rows in Settings).

**What is missing:**

1. **Filtering.** The only content check in the feature is
   `src/features/directory/rules.ts:32–41` `aboutIsSafe()`, which rejects emails,
   URLs, phone numbers and @handles in the public *About* field. That is a
   contact-detail guard, not an objectionable-content filter, and it applies to
   **one profile field only** — the free-text `purpose`/`message` of a contact
   request and every thread message go through unfiltered.
2. **The EULA agreement.** There is none. `AuthScreen.tsx` has no terms checkbox,
   no "by creating an account you agree…" line and no link (see R2). The only
   in-app agreement anywhere is the **Sound Safety** acknowledgement
   (`src/features/audio/soundSafetyText.ts:69`), which is about hearing and
   equipment damage, not content.

**Fix:** (a) a terms-acceptance line at account creation linking `/terms`, with
the no-tolerance clause present in the hosted terms; (b) at minimum a profanity /
objectionable-content screen on `message`, `purpose` and the About field — mirrored
server-side the way `aboutIsSafe` already is (`rules.ts:9–13` says the DB is the
enforcement copy).

**Confidence:** medium-high. Block and report being present is the larger half of
1.2 and materially lowers the odds; the missing EULA is the single most common
reason this guideline is cited. If the reviewer never finds the Directory (it sits
behind Profile → AUDIO COMMUNITY DIRECTORY and Awards) it may pass. I would not
ship on that hope, because 1.2 also gets enforced post-launch on a user report.

---

## R5 · REJECTION-class — The store submission pack tells the owner to file two answers that are false

**Guidelines:** Apple 2.3.1 (accurate metadata) / 5.1.1 (privacy label accuracy);
Google Play "Inaccurate content rating" (removal) and Data safety accuracy.

`docs/APE_STORE_SUBMISSION_PACK_2026_09_07.md` is the document the owner is meant
to enter the console forms from. Two of its answers are now false:

1. **§3, Content rating (IARC):**
   > "No user-to-user communication inside the app; the registry is a published
   > listing, not messaging, so answer 'no interaction'… Expected rating: 4+ and
   > Everyone."

   The app has threaded member-to-member messaging (see R4 for the six RPCs and
   the UI). Answering "no interaction" on IARC is exactly what gets a Play rating
   invalidated and the listing removed, and it contradicts the app's own 18+
   registry gate (`ProfileScreen.tsx:436`).

2. **§3, Privacy answers:**
   > "No analytics SDK, no crash reporter, no advertising, no third-party tracking,
   > no data sold."

   Sentry and Aptabase shipped on 2026-09-16 (`src/features/telemetry/telemetry.ts`;
   `@sentry/react-native` and `@aptabase/react-native` in `package.json:6,18`; the
   Sentry plugin in `app.json:159`). `docs/TELEMETRY_DATA_INVENTORY_2026_09_16.md`
   and `docs/CCODE_DATA_SAFETY_VERIFY_2026_09_17.md` are the correct sources.

   §3 also says "Location: only when the user chooses to tag a MultiMeter
   measurement snapshot" and §7 says "mic, camera and **location** usage strings
   present in `app.json`". Neither is true: `expo-location` is not installed
   (`package.json` has no location package; `optionalModule.ts:19–21` names it as
   deliberately absent, so `locationAvailable` is permanently false at
   `MultiMeterScreen.tsx`), and `app.json` carries no
   `NSLocationWhenInUseUsageDescription`. Declaring Location on either form would
   be a *false positive* — also an accuracy problem.

**Fix:** mark the 2026-09-07 pack superseded on the privacy and content-rating
sections, and point both to the 2026-09-17 decisions (memory: 13+ with the
interaction declared; telemetry as "Data Not Linked"). Nothing to change in code.

**Confidence:** high — this is a direct comparison of the doc against the shipping
dependency list and the RPC call sites.

---

# RISKS

---

## K1 · RISK (high) — If the `validate-purchase` secrets are not set, every reviewer purchase fails and the app is a 2.1 rejection

**Guideline 2.1 (App Completeness):** a reviewer must be able to complete the
purchase. **Guideline 3.1.1:** paid content must unlock through IAP.

`src/features/commercial/purchase.ts:119–132`: the purchase listener sends the
receipt to the `validate-purchase` edge function; **only** on `ok` does it call
`finishTransaction` and `handlers.onSuccess()`. On anything else the buyer gets
"We couldn't verify that purchase. If you were charged, use Restore Purchases."

`docs/APE_STORE_SUBMISSION_PACK_2026_09_07.md` §2 says the function is deployed
with `verify_jwt` on and that "until the secrets below are set the function
correctly refuses every purchase … and grants nothing". The memory note is the
same: *"payments fail safe — verify the 7 edge-function secrets before selling."*

So the failure mode at review is: reviewer buys in the Apple sandbox → validation
returns not-ok → no unlock → rejected under 2.1, and on Play the charge sits
unacknowledged (no `finishTransaction`) and auto-refunds after 72 hours.

The pack also flags, correctly, that the function must try Apple **production
first and fall back to sandbox**, because App Review buys in the sandbox against
the production build. That is claimed fixed on 2026-09-07 but is server-side and I
cannot verify it from here.

**Settles it:** run the sandbox test script in the pack (§2, steps A–G) on both
phones against the real build, and watch the `validate-purchase` logs. This is the
one item I would not submit without.

**Confidence:** high that this is the failure mode; unknown whether the secrets
are set, which is the whole question.

---

## K2 · RISK — The purchase screen calls the app a beta, and a shipped feature carries a BETA badge

**Guideline 2.2 (Beta Testing):**
> "Demos, betas, and trial versions of your app don't belong on the App Store —
> use TestFlight instead."

`src/lib/copy.ts:77–79`, rendered on the paywall at
`PaywallScreen.tsx:375`, directly above the plan cards and the CONTINUE button:

> "Introductory pricing for our early **beta** (new-adopter) users — all prices
> are valid through the end of the year. Lock in now early low priced
> subscriptions or the lifetime academy membership fee."

The reviewer *always* opens the paywall, because IAP has to be tested. "Our early
beta users" on the purchase screen is the single most visible place this word
could be.

Second surface, lower risk: the Career Finder ships a visible BETA badge —
`src/screens/careerfinder/kit.tsx:59–60`,
`src/screens/curriculum/CurriculumScreen.tsx:522`, and a "BETA FEEDBACK" section
at `CareerFinderResultsScreen.tsx:205`. A badge on one feature reads differently
from "our beta app", but it is the same guideline.

**Fix:** the copy is ratified, so this routes to the owner; the meaning survives
intact as "Introductory pricing for our early members" / "for early adopters".

**Confidence:** medium. 2.2 is applied to apps that present themselves as
incomplete; a pricing note is a softer case than a "BETA" splash. But the cost of
the fix is one word.

---

## K3 · RISK — Prices are hardcoded USD literals; the localized store prices are fetched and thrown away

**Guideline 2.3.1 / 3.1.2:** what the app displays must match what the store
charges.

The brief said `loadStoreProducts()` "has no callers". **That is not quite right,
and the correction matters:** it *is* called, at
`src/features/commercial/purchase.ts:146`, inside `initPurchases`:

```ts
connected = true;
void loadStoreProducts();
return true;
```

`void` — the result is discarded. Nothing is stored, nothing is returned to the
paywall, and no state is set. So the effect is the same as having no caller (the
UI never sees a localized price) but the diagnosis is different: the fetch already
happens, and wiring it up is a state variable and a `setState`, not a new call.

The displayed prices are literals at
`src/screens/commercial/PaywallScreen.tsx:30–35`:

```ts
{ id: 'lifetime', name: 'Lifetime Academy', price: '$99.99', sub: 'One-time payment', badge: 'BEST VALUE' },
{ id: 'annual',   name: 'Annual',  price: '$59.99 / yr', sub: 'About $5/mo', badge: 'SAVE 50%' },
{ id: 'monthly',  name: 'Monthly', price: '$9.99 / mo',  sub: 'Cancel anytime' },
```

These are the only price strings in the app (`copy.ts:72 lifetimePrice` is
unreferenced outside `copy.ts`). A buyer in the EU, UK, Japan or India reads
`$59.99 / yr` and is charged a different number in a different currency. The
"SAVE 50%" badge is computed from the USD pair and is not true in a storefront
where Apple's tier mapping differs.

**Why RISK and not REJECTION:** App Review is normally conducted in the US
storefront, where `$99.99 / $59.99 / $9.99` will match the products as specced in
`docs/APE_STORE_SUBMISSION_PACK_2026_09_07.md` §1. The exposure is consumer-law
and refunds after launch, plus a 2.3.1 rejection if the reviewer happens to be on a
non-US account.

**Fix:** keep `loadStoreProducts()`'s result, map SKU → `displayPrice`, and render
the store string when present and the literal only as the pre-fetch fallback. The
plumbing is already there (`planIdForSku` at `iapProducts.ts:30`).

**Confidence:** high.

---

## K4 · RISK — IAP listeners exist only while the paywall is on screen

`initPurchases` and `teardownPurchases` are called from exactly one place —
`PaywallScreen.tsx:111` and `:126` (I grepped `src/` and `App.tsx`; there are no
other callers). `teardownPurchases` (`purchase.ts:151–170`) removes both listeners
**and calls `endConnection()`**.

Consequences:

- A transaction that resolves after the user leaves the paywall — Ask-to-Buy
  approval, SCA/3-D Secure, a slow network, the user backgrounding mid-sheet — has
  no `purchaseUpdatedListener` to receive it. The money moved; nothing validates,
  nothing calls `finishTransaction`, nothing writes the entitlement.
- On iOS that transaction stays in the queue and is redelivered on the next
  `initConnection` — i.e. only if the user opens the paywall again. On Play an
  unacknowledged purchase auto-refunds after 72 hours.

It is **recoverable**: Restore Purchases works and re-validates
(`purchase.ts:215–242`), and the paywall's restore copy is honest about the three
outcomes. So this is not "money lost", it is "money held while the app shows
nothing", which is a support and refund problem rather than a review one.

**Fix:** register the connection and the `purchaseUpdatedListener` once at app
level (next to the entitlement provider) and let the paywall attach handlers, so
an interrupted transaction is always picked up at launch.

**Confidence:** high on the code path. Whether StoreKit's redelivery covers it at
next paywall open is a device question — **settles it:** sandbox step C, but
background the app between "Confirm" and the sheet closing.

---

## K5 · RISK — A members-only lab shows six "Coming Soon" rows

**Guideline 2.1 / 2.3.1:** placeholder content and features that do not work.

The standing product rule (owner, 2026-09-17) removed every `status:'development'`
row. That cleanup is real and complete **in the catalog** — I verified
`src/screens/lab/labCatalog.ts` has zero leaves carrying `status: 'development'`,
so `EarLabScreen.tsx:288` and `LabCategoryScreen.tsx:145` never render `DEV_NOTE`,
and `PLANNED_AREAS` in `src/screens/lab/cymatics/modules/registry.ts:24` is `[]`.

But one screen builds its own list and was missed.
`src/screens/lab/deesser/SmartProcessorsLabScreen.tsx:17–24`:

```ts
const FAMILY: { name: string; blurb: string; route?: keyof RootStackParamList }[] = [
  { name: 'De-Esser & Sibilance Control', …, route: 'DeEsserLab' },
  { name: 'Dynamic EQ',            blurb: 'EQ bands that move only when the signal asks them to.' },
  { name: 'Multiband Compressor',  … },
  { name: 'Spectral Processor',    … },
  { name: 'Resonance Suppressor',  … },
  { name: 'Feedback Suppressor',   … },
  { name: 'Ducking & Auto-Mixing', … },
];
```

Six of seven have no `route`, and `:48–63` renders each as a dimmed, disabled row
with `DEV_NOTE` under it — `'Coming Soon'` (`labCatalog.ts:92`). The screen is
`MemberGated.SmartProcessorsLab` (`RootNavigator.tsx:293, :523`), so this is what a
**paying member** sees: one working lab and six advertisements for labs that do not
exist.

`labCatalog.ts:78–91` is the comment that predicted exactly this:
> "App Store review has historically read 'coming soon' placeholders as an
> incomplete-app signal under guideline 2.1."

**Fix:** delete the six routeless entries (matching what was done to the catalog),
or retitle the screen so the one built lab is the whole screen.

**Confidence:** high.

---

## K6 · RISK — The camera purpose strings describe a feature that cannot run in any build

`app.json:26` (`NSCameraUsageDescription`):
> "Used by the Light-Pulse frequency counter to measure how fast a light flashes
> (overall image brightness only), **and to add an optional photo to a measurement
> snapshot.** No photo or video is uploaded."

The second clause is dead. The photo path is
`src/features/tools/capture/photo.ts`, which loads `expo-image-picker` through
`optionalModule` — and `expo-image-picker` is **not installed** (absent from
`package.json`) and is explicitly excluded from the loader table:
`src/features/tools/capture/optionalModule.ts:19–21`:

> "Packages that are NOT installed (expo-location, expo-image-picker) must stay off
> this table … so they keep the dynamic path and resolve to null until they are
> installed AND added here."

So `photo.isAvailable()` is permanently false, and
`MultiMeterScreen.tsx:1630/1656` correctly renders **nothing** rather than a
"coming soon" note — the comment there already cites guideline 2.2/2.3.1. Good
call. But the purpose string was not updated with it.

Same class: `docs/CCODE_DATA_SAFETY_VERIFY_2026_09_17.md` Group A declares "Profile
photo | Photos and videos → Photos | Optional (opt-in)". There is no way to set a
profile photo in the app — `src/features/profile/api.ts:40,73,138` reads a
`photo_url` column that nothing in the client ever writes, and
`ProfileScreen.tsx:1128–1134` falls back to initials. Declaring a data type you do
not collect is an accuracy problem in the other direction.

The camera permission itself **is** justified: Light Pulse is real
(`modules/ape-optical`, Kotlin + Swift, not `.easignore`d) and
`FrequencyCounterScreen.tsx:283` drives it.

**Fix:** trim the purpose string to the Light-Pulse clause, and drop the profile
photo row from the store forms unless the feature is landing.

**Confidence:** high.

---

## K7 · RISK — The Community Directory has no client-side age gate on browsing or messaging

The 18+ attestation (`ProfileScreen.tsx:426–441`) gates **publishing your own
listing** only:

> "AGE GATE. A public page carrying a real name and work history is a different
> product for a minor, so listing is 18+ (owner ruling 2026-08-30). Asked ONCE per
> account — the server records the attestation and refuses to create a listing
> without it."

Nothing gates the other direction. `AudioCommunityDirectory` is registered without
`Gated.`/`MemberGated.` (`RootNavigator.tsx:406`), is a claimed deep link
(`linking.ts:100` → `/directory`), and is reachable from `ProfileScreen.tsx:846`
and `DirectoryScreen.tsx:237`. A 13-year-old free account can therefore browse
adults' real names, work areas and bios, and tap "SEND A CONTACT REQUEST"
(`AudioCommunityDirectoryScreen.tsx:216`) → `sendContactRequest`
(`api.ts:448`) → a thread with free-text messages.

This is the point where the age rating and the feature have to agree. With the
2026-09-17 decision (13+, interaction declared) the *declaration* is right; the
product still lets a declared minor open a private message thread with an adult,
which is what Play's Families policy and Apple's age-rating questions are about.

**What I cannot see:** whether `contact_request_send` is server-gated on the
sender's own attestation or membership. The RPCs are SECURITY DEFINER and live in
the database. **Settles it:** read `contact_request_send`'s definition on the live
DB, or `\df+ contact_request_send`.

**Confidence:** medium — high that the client does not gate it, unknown on the
server.

---

## K8 · RISK — Developer-facing fallback copy is on user-facing screens and must be proven unreachable on the release binary

Several screens carry an honest "this build doesn't have the native half" state.
The wording is developer language — *"install the next dev build"*, *"this dev
client predates the effects path"* — and would be a clean guideline 2.1/2.2
rejection if it rendered to a reviewer:

| Screen | Line | String |
|---|---|---|
| Frequency Counter → Light Pulse | `FrequencyCounterScreen.tsx:304` | "…isn't in this installed build yet — **install the next dev build** to enable it." |
| FX Lab → THE AUDIO PATH | `FxLabScreen.tsx:621` | "…this **dev client** predates the effects path… **install the next dev build** to hear it." |
| Harmonograph viewer | `HarmonographViewer.tsx:159,176,194,301` | "needs the next app build" ×4 |
| Cymatics export panel | `ExportPanel.tsx:128–251` | "needs the next app build" ×7 |
| Calc share | `CalcResultsScreen.tsx:52`, `CalcWorkflowRunScreen.tsx:398` | "Sharing as an image needs the next app build." |
| Certificate download | `CredentialWall.tsx:90,196`, `AwardProgressScreen.tsx:93,203` | "Certificate download needs the next app build." |
| Glossary mic | `GlossaryScreen.tsx:2411` | mic hidden until the native module is present |
| Term share | `ShareTermSheet.tsx:177,196` | "needs the next app build" |

**These should all be dead in a fresh production build**, and the source says so:

- `modules/ape-optical` and `modules/ape-dsp` are in the repo and **not** excluded
  by `.easignore`, so both autolink.
- `ape-dsp`'s native sources are at engineVersion 7
  (`ApeDspModule.kt:85`, `ApeDspModule.swift:231` — "wave-2 expansion voices
  (engineVersion 7)"), comfortably above the ≥6 the FX audio path needs.
- Every package behind a "next app build" string — `react-native-view-shot`,
  `expo-media-library`, `expo-print`, `expo-sharing`, `expo-clipboard`, `qrcode` —
  is installed **and** has a literal `require` in `optionalModule.ts:29–51`, which
  is the fix that made Metro bundle them.

**So this is a verification item, not a defect.** But it is eight screens' worth of
reviewer-visible text riding on "the binary really did pick up every native
module", and `react-native-view-shot@5.1.0` against RN 0.86 is the one I would
actually check. **Settles it:** on the production/TestFlight build, visit
Frequency Counter → Light Pulse, FX Lab → THE AUDIO PATH, Harmonograph →
SAVE/SHARE/PRINT, Cymatics → export, a certificate → download, and the Glossary
mic. Any "next build" string that appears is a blocker.

**Confidence:** high that they are unreachable in a correct build; the risk is
entirely in "is the build correct".

---

## K9 · RISK — `delete_my_account` reports success even when the login row survives

**Guideline 5.1.1(v)** requires the account to be *deleted*, not deactivated.

The control itself is good (see V4 below). The tail of the RPC is not.
`DROP_V1_SCAFFOLDING_2026_09_03/10_APPLY_rewrite_live_functions.sql`,
`public.delete_my_account()`:

```sql
  DELETE FROM users WHERE id = v_user;
  -- Auth login (best-effort).
  BEGIN DELETE FROM auth.users WHERE id = v_auth; v_auth_deleted := true;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  RETURN jsonb_build_object('user_deleted', true, 'auth_deleted', v_auth_deleted);
```

and earlier, when there is no `public.users` row at all, it returns
`{'user_deleted': false, 'auth_deleted': <maybe false>}` with **no error**.

The client never looks at the payload —
`src/features/settings/DeleteAccountButton.tsx:74–84`:

```ts
const { error } = await supabase.rpc('delete_my_account');
if (error) throw error;
markIntentionalSignOut();
await supabase.auth.signOut();
await clearLocalAccountData();
```

So if the `auth.users` delete is swallowed by `EXCEPTION WHEN OTHERS THEN NULL`,
the user is told "permanently erases your account", is signed out and has their
device wiped — while the credential still exists and they can sign back in. Their
personal records are genuinely gone, so the data-deletion half is satisfied; the
"account deleted" claim is not.

**Fix:** have the client read `auth_deleted` / `user_deleted` and, when either is
false, say something true ("Your data was erased but we couldn't remove your
login — contact support") instead of the success path.

**Why RISK and not REJECTION:** the definer role in Supabase normally *can* delete
from `auth.users`, so this probably never fires. But it fails silently and
dishonestly when it does, and it is the one flow a reviewer explicitly tests.
**Settles it:** call the RPC on a throwaway account against the live DB and read
the returned JSON.

**Confidence:** high on the code; unknown on whether the delete ever fails.

---

## K10 · RISK — "Manage subscription" and "Restore purchases" live only on the paywall, which an active member has no reason to open

`PaywallScreen.tsx:295`:
```ts
const showManage = resolved && (entitlement === 'academy' || entitlement === 'lapsed');
```
So the "Manage subscription" link (`:414–419`, deep-linking to
`itms-apps://apps.apple.com/account/subscriptions` / Play's subscription list) is
shown **only** to members and lapsed members — and it lives **only** on the paywall.
An active member is never routed to the paywall, because nothing is locked for
them: every `navigate('Paywall')` I found (20 call sites) fires from a membership
gate.

Settings' MEMBERSHIP section (`SettingsScreen.tsx:652–681`) has exactly two rows:
Status, and "Redeem access or promo code". No Restore, no Manage, no See plans.

Not a rejection — cancelling in App Store / Play Settings is the canonical path and
Apple does not require an in-app cancel — but the link that exists for members is
unreachable by members, and a buyer whose entitlement did not land has to find a
locked screen before they can tap Restore.

**Fix:** add "Restore purchases" and "Manage subscription" rows to Settings →
MEMBERSHIP. Both call functions that already exist.

**Confidence:** high.

---

# NOTES, AND WHAT I CHECKED AND FOUND CLEAN

"I found nothing in X" is a result. These are the ones worth recording.

**V1 · Sign in with Apple is genuinely not required.** Guideline 4.8 applies only
when a third-party or social login is offered. The app ships email/password only:
`src/features/auth/api.ts:108,116` (`signInWithPassword`), plus
`supabase.auth.signInAnonymously()` for the glossary device key
(`src/features/glossary/deviceKey.ts:124`). No Google, Apple, Facebook, OAuth or
OTP-social path exists anywhere in `src/`. **No finding.**

**V2 · Anti-steering (3.1.1 / 3.1.3) is clean.** I grepped `src/` for every
phrasing of "buy on our website / subscribe at / visit … to purchase". The only
external link in the whole app besides the policy pages is the certificate
verification URL (`certificateHtml.ts:52`). The paywall's failure copy points at
the app store, never at a web checkout. The Redeem-a-code flow
(`SettingsScreen.tsx:668`, `src/features/commercial/accessCode.ts:71`) is for comp
and event codes and grants a server entitlement; the modal's line "discount codes
apply at checkout when purchasing is available" refers to the in-app purchase.
**No finding** — worth keeping an eye on only if codes are ever *sold* outside the
app, which would make it a 3.1.1 workaround.

**V3 · The subscription disclosure at the point of purchase is complete.** Apple
3.1.2(a) wants title, length, price per period, and functional Terms + Privacy
links visible before the buy control. `PaywallScreen.tsx` has all of them:
plan names and prices at `:30–35`/`:349–354`; the auto-renewal line at `:381–384`
(deliberately moved *above* CONTINUE); Terms of Use and Privacy Policy at
`:387–395`; "Manage or cancel anytime in your app-store settings" in the same
line. The purchase controls also fail safe — `:137` blocks a buy before the
entitlement resolves, `:162` blocks a guest with no account, `:141` stops a member
double-buying. This is better than most apps ship. **No finding**, beyond K3's
currency problem.

**V4 · Account deletion (5.1.1(v)) is present, discoverable and honestly
described.** Settings → DELETE ACCOUNT, bottom of the screen, red section, 5-second
hold + a second confirm (`DeleteAccountButton.tsx:41–69`), calling the
`delete_my_account` RPC which deletes 10 tables plus the identity row with 13 more
cascading. `SettingsScreen.tsx:792` shows the section whenever `tierKnown` is
false or the user is not a known guest — i.e. it survives an offline entitlement
read, which the comment at `:779–791` says was the pass-3 fix. Help agrees:
`helpContent.ts:249` — "Settings → DELETE ACCOUNT, at the very bottom… You do not
need to contact us." The earlier "email support" answer is gone. **No finding**
beyond K9's silent-failure tail.

**V5 · The hearing-exposure features are framed as education, not as a dosimeter
reading.** This is the place I expected to find a 1.4.1 / health-claim problem and
did not.
`exposureMonitor.ts:12–19` states the honesty rule in the module header ("Nothing
is ever labeled measured in this build"); `EXPOSURE_HONESTY_LINE` (`:721`) ends
"**Not a medical or compliance measurement**" and is rendered twice on the
Exposure Monitor screen (`ExposureMonitorScreen.tsx:136, :461`); the CSV export
carries the same note (`:668`); every level is printed as "dBA **est.**"
(`:220–253`); the SPL-safety calculator says "TEACHING calculations of published
criterion formulas — NOT medical or legal advice"
(`src/screens/lab/calc/workspaces/splSafety.ts:380, :401`). The advisory strings
(`:713–718`) say "may increase hearing risk" and "consider lowering the level",
which is advice about the app's own output, not a diagnosis.
The one thing I would still change: the ToolsHub chip reads
`● DOSIMETER · TRACKING` / `DOSIMETER`
(`src/screens/tools/ToolsHubScreen.tsx:178`). "Dosimeter" is a regulated
instrument word (OSHA noise dosimetry) and is the most assertive claim in the
feature, sitting on a hub card where none of the hedging is visible. **NOTE** —
"Listening Exposure" would carry the same meaning with none of the exposure.

**V6 · The credential copy does not claim accreditation.** I grepped for
"accredit", "industry-recognised", "nationally recognised", "qualifies you",
"licensed professional". The only hits are `AccuracyNote.tsx:63` ("Studying here
does **not** qualify you to do it" — the right direction) and a lesson blurb
mentioning ANSI-accredited AV *standards*, which is about the standards, not the
app. The certificate says "Certificate of Achievement"
(`certificateHtml.ts:340`) and "verify at proaudiotrainingacademy.com/registry"
(`:147`) — "verified" here means "verifiable against our own registry", which is
literally true because the registry exists. The paywall's "verified graduate
record that employers can validate online" (`copy.ts:20`) is the strongest claim
and is still accurate as written. **No finding.** Keep "industry-recognized" out
of the *store listing* copy, where it would not be defensible.

**V7 · The placeholder sweep came back almost empty.** Beyond K5:
- `LearningIntroSheet.tsx:64–67` renders "This intro is being written." — but
  `TOPIC_INTROS` and `COURSE_INTROS` are both `{}`
  (`learningIntros.ts:33,35`) and the only production caller guards on
  `!isIntroEmpty(...)` (`DashboardScreen.tsx:1144,1151`), so it never opens. The
  other caller is `DevVisualIndex`, which is `__DEV__`-only.
- `CourseSelectionScreen.tsx:554,570,902,908` has a "COMING SOON" path for
  `programStub` and `comingTopic` cards — **unreachable**: `programStub` is a
  declared type with no construction site anywhere, and `FIELD_TOPICS` (the only
  source of `comingTopic`, `:1085`) is `readonly string[] = []` at `:173`.
- `PLANNED_AREAS` in cymatics is `[]`; no lab leaf carries
  `status: 'development'`, so `DEV_NOTE` renders nowhere except K5's screen.
- No `lorem`, no rendered `TODO`/`FIXME` in any `.tsx` under `src/screens`.

**V8 · The `__DEV__` guards hold.** `src/config/devMode.ts:68` —
`devBypass = (flag) => __DEV__ && DEV_BYPASS[flag]` — is the only accessor, and I
grepped `src/` for direct `DEV_BYPASS.` reads outside that file: the four hits are
all comments. `DEV_BYPASS_ACTIVE` (`:64`) is `__DEV__ &&` too.
`DevVisualIndex` has exactly one production call site and it is guarded:
`ProfileScreen.tsx:629` — `{__DEV__ ? <DevVisualIndex /> : null}`.
`DspDebugScreen` is registered unconditionally (`RootNavigator.tsx:438`) despite
its comment claiming otherwise, but nothing navigates to it except
`DevVisualIndex.tsx:212`, and it is not in the deep-link allowlist
(`linkPaths.ts:29–33`, `linking.ts`), so it is unreachable in release. **NOTE**:
dropping the `Stack.Screen` behind `{__DEV__ && …}` costs nothing and removes the
question. Note also `DEV_BYPASS.instantIntros` and `webPreviewAutoGuest` are
`true` — inert in release, but they are the two the launch checklist means.

**V9 · The microphone purpose string survives the plugin chain.** I checked this
because `expo-audio`'s plugin sets `NSMicrophoneUsageDescription` and runs *after*
`expo-speech-recognition` in `app.json:plugins`.
`@expo/config-plugins/build/ios/Permissions.js:30` is
`infoPlist[permission] = permissions[permission] || infoPlist[permission] || description`,
and `withIosBaseMods.js:298–301` merges `config.ios.infoPlist` **on top of** the
file contents before any plugin mod runs. So the app.json string
("Used to measure sound levels in the measurement tools, and — only when you tap
the mic — to dictate a glossary search. Audio is processed on this device and is
not recorded or uploaded.") wins over expo-audio's generic
"Allow $(PRODUCT_NAME) to access your microphone". **No finding.** All three
retained purpose strings (mic, camera, photos-add) explain a real reason in plain
language, which is what 5.1.1 asks for — the camera one just over-describes (K6).

**V10 · Telemetry matches its declaration.** Sentry never calls `setUser` and
`beforeSend` strips `user`/`ip_address`; Aptabase has no user object and its props
are whitelist-filtered to enum-shaped values; neither reads IDFA/GAID and there is
no ATT prompt. That is Apple "Data Not Linked / Tracking: No" and Play
"Crash logs + Diagnostics + App interactions, Shared: none", exactly as
`docs/TELEMETRY_DATA_INVENTORY_2026_09_16.md` states. Help now discloses it
(`helpContent.ts:222`). **No finding** — but there is still **no user-facing
telemetry opt-out** anywhere in Settings. That is legal for both stores; it is a
GDPR/consent question for EU users rather than a review one. **NOTE.**

**V11 · Location is not collected and not declared.** `expo-location` is absent
from `package.json` and deliberately off the `optionalModule` loader table
(`optionalModule.ts:19–21`), so `locationAvailable` is permanently false and the
MultiMeter's GPS-tag branch never renders. `app.json` carries no location usage
string. Both forms should answer "no Location" (which the 2026-09-17 doc does, and
the 2026-09-07 pack does not — see R5).

**V12 · Google Play target API.** Expo SDK 57 generates `targetSdkVersion 36`,
which meets Play's Aug-2026 requirement for new apps. I could not verify this from
the repo: the app-level `build.gradle` comes from the prebuild template fetched at
build time, and `/android` is gitignored and `.easignore`d. **Settles it:** read
`targetSdkVersion` in the generated `android/build.gradle` after a prebuild in a
scratch copy, or in the AAB's manifest. There is no `expo-build-properties`
override in `app.json`, so nothing is pinning it down.

**V13 · Android App Links are declared for nine path prefixes with
`autoVerify: true` (`app.json:36–116`) but `ios.associatedDomains` is absent** —
so Universal Links do not work on iOS at all. Already known (pass 3, still open).
Not a rejection; it is a broken advertised capability and the Android half will
also fail silently unless `/.well-known/assetlinks.json` is hosted.

---

## What I did not cover

- The `validate-purchase` edge function's body, the `contact_*` RPCs and
  `delete_my_account`'s live definition — all server-side; I read the migration
  file, not the database.
- The store *listing* copy (screenshots, description, keywords), which lives in
  `docs/discoverability/STORE_LISTING_SOURCE_OF_TRUTH.md` and the consoles.
- Accessibility (pass 2 owns it), performance (pass 3), and the teaching-accuracy
  axis.
