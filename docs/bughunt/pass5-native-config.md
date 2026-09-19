# Bug-hunt pass 5 · agent E — the native configuration

**Scope:** `app.json`, `eas.json`, `.easignore` / `.gitattributes` / the fingerprint,
`modules/ape-dsp` + `modules/ape-optical`, `package.json` vs Expo SDK 57.
**Mode:** READ-ONLY. **Nothing in this repo was edited except this file.**
No `eas build`, no `eas update`, no `eas build:list`, no network call, no git write.

Everything below was measured, not assumed. The two local, free, read-only commands
used were `@expo/fingerprint`'s `createFingerprintAsync` (via `node -e`) and
`npx expo config --type introspect`.

---

## The column that matters

| # | Finding | Severity | **OTA-SAFE or NEEDS NATIVE BUILD** |
|---|---|---|---|
| **E-1** | `.gitignore` on disk ≠ `.gitignore` in the git index (61 CRLF vs LF). It is fingerprint source #2. This is the `.easignore` trap, live on the other file. | **BLOCKER** *(byte difference certain; OTA impact unconfirmed)* | **NEEDS NATIVE BUILD** — and do not touch it until the fingerprint/runtimeVersion compare is run |
| **E-2** | `expo-audio` as a bare string ⇒ iOS `UIBackgroundModes: ["audio"]` + Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK` + a `mediaPlayback` service, for an app that deliberately mutes on background | **MAJOR** | **NEEDS NATIVE BUILD** |
| **E-3** | `expo-media-library` adds 4 photo-library **READ** permissions (+ `requestLegacyExternalStorage`) for an add-only feature | **MAJOR** | **NEEDS NATIVE BUILD** |
| **E-4** | 9 Android App-Link `pathPrefix` claims: 8 of the 9 paths do not exist on the website, and `pathPrefix` claims *prefixes* (`/get` also claims `/getting-started`) | **MAJOR** | **NEEDS NATIVE BUILD** |
| **E-5** | `expo-secure-store` bare string ⇒ a boilerplate **Face ID** purpose string; the app never authenticates | **MINOR** (store risk) | **NEEDS NATIVE BUILD** |
| **E-6** | `NSMotionUsageDescription` is Expo boilerplate ("access your device motion") — the permission is genuinely used, the string is not ours | **MINOR** | **NEEDS NATIVE BUILD** |
| **E-7** | `NSCameraUsageDescription` promises "add an optional photo to a measurement snapshot" — that feature can never run (`expo-image-picker` is not installed and must stay uninstalled per `optionalModule`) | **MINOR** | **NEEDS NATIVE BUILD** |
| **E-8** | `expo-notifications` has `color` + `defaultChannel` but **no `icon`** → Android small icon falls back to the opaque app icon (white/solid square) | **MINOR** | **NEEDS NATIVE BUILD** |
| **E-9** | No splash configuration of any kind (`expo-splash-screen` not installed, no `splash` key) → default light launch screen in front of a forced-dark app | **MINOR** *(low confidence on exact colour)* | **NEEDS NATIVE BUILD** |
| **E-10** | No build profile declares `environment`, so which EAS environment feeds `EXPO_PUBLIC_*` is implicit | **MINOR** (latent) | **NEEDS NATIVE BUILD** — `eas.json` is a fingerprint input |
| **E-11** | `preview` profile has no `autoIncrement` (the other two do) | **MINOR** | **NEEDS NATIVE BUILD** — `eas.json` |
| **E-12** | `submit.production` is `{}` — no Apple ID / ASC app id / Play service account / track | **MINOR** | **NEEDS NATIVE BUILD** — *even the submit block is hashed* |
| **E-13** | Store builds run channel `production`; the whole documented dev loop publishes to branch `preview` | **MINOR** (launch-day trap) | OTA-SAFE (publish-time flag, not a file) |
| **E-14** | ~96 MB of asset folders referenced by **zero** source files ride in the EAS upload | **MINOR** (informational) | **DO NOTHING** — excluding them changes the fingerprint *and* they are image folders |
| **E-15** | 4 dependency drifts vs the SDK 57 map, 3 of them autolinking fingerprint inputs; `expo-speech-recognition` is an SDK **56** module | **MINOR** | **NEEDS NATIVE BUILD** if corrected |
| **U-1** | `NSAppTransportSecurity.NSAllowsArbitraryLoads = true` appears in the introspected Info.plist — **source unconfirmed**, may be an introspection fallback only | **UNVERIFIED** | **NEEDS NATIVE BUILD** if real |

**Verified-and-clean** (no action; recorded so nobody "fixes" a non-problem):
`.easignore` LF pin holding · icon has no alpha · `newArchEnabled` correctly absent ·
`POST_NOTIFICATIONS` is not missing · dev-client local-network keys are stripped in Release ·
`package-lock.json` is tracked · the ape-dsp / ape-optical native↔JS surfaces match ·
the `optionalModule` honesty gate is honest. Details in §6.

---

## 0. The fingerprint, measured

`app.json` sets `runtimeVersion: { policy: "fingerprint" }`. I computed the fingerprint
locally with the repo's own `@expo/fingerprint`:

```
project fingerprint (this working copy, 2026-09-18) = ea572318566022c720a6e3374f1558f2eab79c4c
184 sources · 103 of them non-plugin
```

A **file** source's hash is the plain SHA-1 of the bytes on disk — verified: fingerprint
reported `.easignore` as `c2666b4af010a9953c632623fee652a15f467051` and `sha1sum .easignore`
returns the same value. That means any byte change to any of these files moves
`runtimeVersion`, and the phones stop seeing updates with no error.

**The files in this repo that set `runtimeVersion`** (measured, not guessed):

| Source | Reason | Current sha1 (disk) |
|---|---|---|
| `.easignore` | `easBuild` | `c2666b4af010a9953c632623fee652a15f467051` |
| `.gitignore` | `bareGitIgnore` | `321abd404354dca316205d41748e2893d0d682ca` |
| `eas.json` | `easBuild` | `44956859e43f469a3d2e292628301a83e0be5154` |
| `assets/icon.png`, `assets/android-icon-foreground.png`, `assets/android-icon-background.png` | `expoConfigExternalFile` | — |
| the evaluated Expo config (i.e. **all of `app.json`**) | `expoConfig` | — |
| every config plugin's own JS in `node_modules` | `expoConfigPlugins` | — |
| `modules/ape-dsp/{android,ios}`, `modules/ape-optical/{android,ios}` | `expoAutolinking*` | — |
| every autolinked package's `android`/`ios` dir in `node_modules` | `expoAutolinking*`, `rncoreAutolinking*` | — |

Three consequences the owner should hold onto:

1. **`eas.json` is hashed in full.** Adding `"environment"`, fixing `autoIncrement`, or
   filling in the `submit` block — none of which have anything to do with the app binary —
   each change `runtimeVersion`. Any of them must land with a native build.
2. **`app.json` is hashed via the evaluated config**, so every finding E-2 … E-9 below is
   a native-build change. None of them can be shipped OTA.
3. **A routine `npx expo install --fix` is a fingerprint change**, because
   `expo-asset/{android,ios}`, `expo-constants/{android,ios}` and `expo-font/{android,ios}`
   are all in the source list (see E-15).

`modules/ape-dsp/test/golden.exe` (351 KB) and `golden_main.obj` (858 KB) sit on disk but
are **not** fingerprint inputs — fingerprint hashes `modules/ape-dsp/android` and
`modules/ape-dsp/ios` only, not `modules/ape-dsp/test`. Rebuilding the golden-vector test
harness is safe. Confirmed against the source list.

---

## E-1 · `.gitignore` is the `.easignore` trap, still live — BLOCKER · NEEDS NATIVE BUILD

**Where:** `.gitignore` (working copy), `.gitattributes` (the "EAS fingerprint inputs"
block at the end), `node_modules/@expo/fingerprint/build/sourcer/Bare.js:74`.

`.gitattributes` closes with this claim:

> "ONLY `.easignore` is pinned. `.gitignore` and `eas.json` already agree with the
> installed builds as they are — .gitignore is CRLF on disk and still matches"

The first half of that sentence is true. The second half is the one I cannot confirm, and
the bytes say the two representations of the file are **not** the same:

```
.gitignore     disk  1593 bytes   61 CRLF   sha1 321abd404354...
.gitignore     index 1532 bytes    0 CRLF   sha1 8ee71d2731dd...
                     ^^^^ 61-byte difference = exactly the 61 carriage returns
```

(`.easignore`, `eas.json`, `app.json` and `package.json` are all byte-identical between
disk and index — I checked all five together. `.gitignore` is the only one that differs,
and `git status` does **not** list it as modified, which confirms the difference is purely
line endings under `* text=auto`.)

`.gitignore` is hashed unconditionally as a fingerprint source — `getGitIgnoreSourcesAsync`
in `Bare.js:70-79` has no bare-project gate, it just hashes the file. And the hash
`@expo/fingerprint` reported for it is `321abd40…`, i.e. **the CRLF disk version**.

**Why this is the same bug as the one that already bit this repo.** The `.gitattributes`
incident note records that on 2026-09-17 the iPhone's build was keyed to `.easignore` at
`c2666b4a` (LF) while the Windows working copy hashed `9fdb1aa7` (CRLF, byte-identical
otherwise). For that to have happened, the content EAS hashed must have been the
index/LF content, not the working-tree/CRLF content. If that is still how the upload is
produced, then **right now** the build side hashes `.gitignore` at `8ee71d27…` and this
machine hashes it at `321abd40…` → two different `runtimeVersion`s → every `eas update`
published from Windows lands on a runtime no installed build asks for, and the publish
reports success.

**What I am and am not confident about.**
- The byte difference: **certain**, measured three ways.
- That `.gitignore` feeds the fingerprint: **certain**, read from the sourcer.
- That it is *currently* breaking OTA: **not established.** The counter-evidence is that
  the owner reports OTA working since the `.easignore` fix. Either EAS is seeing the
  working-tree bytes for this file, or OTA is quietly broken again.

**What settles it** — the standing memory rule, exactly as written, before the next publish:

```
cd C:\Users\profe\dev\ape-studio; npx expo-updates fingerprint:generate
cd C:\Users\profe\dev\ape-studio; npx eas build:list --limit 3
```

If the local fingerprint (`ea572318…` today) equals the installed build's
`runtimeVersion`, OTA is fine and E-1 is a latent landmine. If it does not, E-1 is the
reason and it is a blocker. I did not run `eas build:list` — it is an external call.

**If it needs fixing:** add `.gitignore text eol=lf` beside the existing `.easignore` line
in `.gitattributes` and `git add --renormalize .gitignore`. `.gitattributes` is *not*
itself a fingerprint input, but the resulting change to `.gitignore`'s on-disk bytes **is**
— so it changes `runtimeVersion` and must land with a native build. Do not do this on a
hunch; run the compare first, because if the builds were already keyed to the LF hash then
this change *restores* OTA rather than breaking it, and the difference matters.

---

## E-2 · Background audio is declared, and the app deliberately does the opposite — MAJOR · NEEDS NATIVE BUILD

**Where:** `app.json:178` (`"expo-audio"` as a bare string),
`node_modules/expo-audio/plugin/src/withAudio.ts:36-38, 51-88`,
`src/features/audio/AudioOutputGate.tsx:150-180`.

`enableBackgroundPlayback` defaults to **`true`**. Confirmed in the plugin source and then
confirmed in the evaluated config:

```
iOS   Info.plist   UIBackgroundModes = ["audio"]
Android permissions  FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK
Android manifest     expo.modules.audio.service.AudioControlsService
                       android:foregroundServiceType="mediaPlayback"
                       intent-filter androidx.media3.session.MediaSessionService
```

Meanwhile `AudioOutputGate.tsx:180` calls `panicMuteAudio()` on AppState `background` —
the app's stated design is that **nothing** plays once you leave it. So the binary declares
a capability it is built never to use.

- **Apple, guideline 2.5.4**: an app that declares the `audio` background mode and does not
  play audio in the background is a standard rejection. This is not a theoretical risk.
- **Google Play**: `FOREGROUND_SERVICE_MEDIA_PLAYBACK` triggers the foreground-service-type
  declaration in the Play Console, and an unused `mediaPlayback` service is hard to justify.

**Fix (native build):** `["expo-audio", { "enableBackgroundPlayback": false }]`. `RECORD_AUDIO`
and `MODIFY_AUDIO_SETTINGS` stay, which is right — ape-dsp needs the mic. The mic purpose
string is safe: `ios.infoPlist.NSMicrophoneUsageDescription` in `app.json` already wins over
the plugin's boilerplate (verified in the introspected plist — the app's own long string is
what appears).

---

## E-3 · Four photo-library READ permissions for an add-only feature — MAJOR · NEEDS NATIVE BUILD

**Where:** `app.json:167-177`, `node_modules/expo-media-library/plugin/src/withMediaLibrary.ts:26-28, 90-100`,
`src/screens/lab/harmoExport.ts:77-79`.

`granularPermissions: ["photo"]` only trims `READ_MEDIA_VIDEO` / `READ_MEDIA_AUDIO`. The
plugin adds the rest unconditionally. Evaluated result:

```
android.permission.READ_EXTERNAL_STORAGE
android.permission.WRITE_EXTERNAL_STORAGE
android.permission.READ_MEDIA_VISUAL_USER_SELECTED
android.permission.READ_MEDIA_IMAGES
+ application android:requestLegacyExternalStorage="true"
iOS: NSPhotoLibraryUsageDescription  (read)  AND  NSPhotoLibraryAddUsageDescription (save)
```

The only call site in the whole app is `harmoExport.ts:77`:

```ts
const perm = await ml.requestPermissionsAsync(true);   // writeOnly = true
await ml.saveToLibraryAsync(asFileUri(uri));
```

Write-only, by design. Nothing reads the library — the app's own purpose strings say so
("Nothing is read from your library"). So the manifest contradicts the privacy copy the
user is shown.

`READ_MEDIA_IMAGES` puts the app into Google Play's Photo and Video Permissions policy,
which requires a declaration form and pushes apps toward the photo picker; `WRITE_EXTERNAL_STORAGE`
plus `requestLegacyExternalStorage` on a modern target is an additional review question.

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

**Fix (native build):** set `photosPermission: false` in the plugin options and add the three
read permissions to `android.blockedPermissions` in `app.json`. There is no plugin option
that drops the Android read permissions on its own — I checked the whole `Props` type.

---

## E-4 · The App Links claim nine path prefixes; eight of them are 404s — MAJOR · NEEDS NATIVE BUILD

**Where:** `app.json:36-137`, `src/navigation/linkPaths.ts:6-10, 158-183`, `web/app/**/page.tsx`.

The intent filters claim, with `autoVerify: true`, on both the apex and `www` hosts:
`/get`, `/topics`, `/tools`, `/learn`, `/labs`, `/glossary`, `/awards`, `/directory`, `/careers`.

The website's actual route list (enumerated from `web/app`) is:

```
/  /about  /academy  /accessibility  /ai  /connect  /contact  /credentials
/curriculum  /dashboard  /employers  /founder  /get  /institutions  /lab-upload
/login  /membership  /privacy  /registry/[token]  /reset-password  /standards
/store  /support  /terms  /tubes  /tubes/[id]  /u/[token]  /verify  /verify/[code]
```

**`/get` is the only one of the nine that exists.** `linkPaths.ts:6-8` states the contract
as *"PATHS ARE THE PUBLIC CONTRACT — the website hosts a real page at each one, so a link
works for people WITHOUT the app too."* That is false for eight of nine: anyone without the
app who receives a `…/glossary/<term>` or `…/tools/rta` link gets a 404. (The share-copy
path that prints those URLs is another agent's ground; I am reporting the config half.)

**Second, separate problem: `pathPrefix` is a raw prefix, not a path.** `/get` also claims
`/getting-started`, `/get-started`, `/getpro`; `/careers` claims `/careers-hiring`;
`/learn` claims `/learners`; `/labs` claims `/labs-faq`. No collision exists on the live
site today — I checked every route above — so this is latent, not live. But when one
appears, Android opens the app, `isAcceptedLink` → `isClaimedPath` returns false for the
unknown path, React Navigation drops the URL, and the person lands on Home with no
explanation of why the link they tapped went nowhere. That is precisely the failure
`linkPaths.ts:121-140` documents for `labs/` and that pass 2 fixed there — the same hole is
still open at the manifest level for the other eight families.

**Fix (native build):** replace each `pathPrefix` with `path` (exact) or `pathPattern` per
claimed route, so the manifest and `isClaimedPath` agree. Separately, the website needs the
eight missing pages before any of these links are honest, and
`/.well-known/assetlinks.json` before `autoVerify` can succeed at all.

---

## E-5 · A Face ID purpose string in a training app that never authenticates — MINOR · NEEDS NATIVE BUILD

**Where:** `app.json:180` (`"expo-secure-store"` bare), `node_modules/expo-secure-store/plugin/build/withSecureStore.js:6-13`.

The bare string makes the plugin write the boilerplate default:

```
NSFaceIDUsageDescription = "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
```

`grep -rn "requireAuthentication|keychainAccessible" src/` returns **nothing** — the app
uses SecureStore purely as encrypted storage and never triggers biometric auth. So the
binary ships a sensitive-permission purpose string for a capability that is never invoked,
in Expo's own un-customised wording.

**Fix (native build):** `["expo-secure-store", { "faceIDPermission": false }]`.

---

## E-6 · `NSMotionUsageDescription` is boilerplate — MINOR · NEEDS NATIVE BUILD

Evaluated plist: `"Allow $(PRODUCT_NAME) to access your device motion"`, contributed by
`expo-sensors`. Unlike E-5 this permission **is** genuinely used —
`src/features/audio/ShakeToMute.tsx:17,36-44` drives the shake-to-mute gesture off
`Accelerometer` at ~12 Hz. Keep the permission, replace the string. Every other purpose
string in this app is specific and well-written; this one and the Face ID one are the two
that still read as scaffolding. Add `ios.infoPlist.NSMotionUsageDescription` describing
shake-to-mute.

---

## E-7 · The camera purpose string promises a feature that cannot ship — MINOR · NEEDS NATIVE BUILD

**Where:** `app.json:24`, `src/features/tools/capture/photo.ts:11-30`,
`src/features/tools/capture/optionalModule.ts:18-22`, `src/screens/tools/MultiMeterScreen.tsx:765-789`.

The string reads: *"Used by the Light-Pulse frequency counter … and to add an optional
photo to a measurement snapshot."* The first clause is true (`modules/ape-optical`). The
second cannot happen: `expo-image-picker` is not in `package.json`, and `optionalModule`'s
own comment says it must stay off the LOADERS table because a literal `require` of an
absent package fails the whole bundle. So `photo.isAvailable()` is permanently `false`,
`MultiMeterScreen.tsx:765` hides the control, and the promise is unreachable.

The code is honest — the gate works exactly as designed. It is only the purpose string that
over-claims. Trim the clause, or install the package and add its LOADERS row. Same for
`expo-location` / `location.ts` (correctly off the table, correctly gated at line 766), which
has no leftover purpose string — that one was already cleaned up in commit `1a94a5cb`.

---

## E-8 · No Android notification icon — MINOR · NEEDS NATIVE BUILD

`app.json:146-152` passes `color` and `defaultChannel` to `expo-notifications` but no
`icon`. Android then uses the app icon as the status-bar small icon, rendering it as a
silhouette; `assets/icon.png` is PNG colorType **2** (RGB, no alpha — I read the IHDR), so
the silhouette is a solid filled square. Every weekly-concept notification shows a blank
block instead of a mark.

The channel id itself is correct: `defaultChannel: "weekly-concept"` matches
`src/features/notifications/push.ts:14` and the `CHANNEL_ID` used throughout
`localSchedule.ts`. That part is wired properly.

Fixing this needs a white-on-transparent 96×96 notification icon. **Per the standing rule I
have not created, added or touched any image asset** — the owner supplies the file and names
the folder.

---

## E-9 · No splash configuration at all — MINOR · NEEDS NATIVE BUILD

`expo-splash-screen` is **not installed** (no `node_modules/expo-splash-screen`), `app.json`
has no `splash` key, and the evaluated config reports `splash: undefined`. Prebuild's
default `UILaunchStoryboardName: "SplashScreen"` therefore produces a plain launch screen in
front of an app that forces `userInterfaceStyle: "dark"` with `backgroundColor: "#0c0c0c"`
— i.e. a light flash on every cold start before the JS `Splash` route
(`src/navigation/RootNavigator.tsx:375`) takes over.

**Confidence: low on the exact colour.** The real SDK 57 prebuild template is downloaded at
prebuild time and is not in `node_modules`, so I could not read it. Verify in the generated
`ios/<name>/SplashScreen.storyboard` after the next prebuild.

---

## E-10 · No `environment` on any build profile — MINOR (latent) · NEEDS NATIVE BUILD

All three profiles in `eas.json` omit `environment`, so which EAS environment supplies
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN`,
`EXPO_PUBLIC_APTABASE_APP_KEY`, `SENTRY_ORG` and `SENTRY_AUTH_TOKEN` is implicit rather than
stated. This matters because `.env` is excluded by `.easignore` line 33, so the local file
never reaches a cloud build — `docs/APE_BUILD_READINESS_2026_09_17.md §1` documents exactly
that, and the variables live server-side in all three EAS environments.

It is **not broken today**: the failed Android *preview* build `ef634146` documented at
§1b picked up a `SENTRY_AUTH_TOKEN`, so variables do flow without the field, and all three
environments currently hold identical values. The risk is the day `preview` is given a
different Supabase project from `production` — a preview build would then quietly read the
wrong one, with no signal.

Being explicit (`"environment": "production"` / `"preview"` / `"development"` per profile)
costs one line each. **But it is an `eas.json` edit, so it changes `runtimeVersion` and must
ride with a native build.** That is the point worth remembering: this file's contents have
nothing to do with the binary, and editing it still breaks OTA.

---

## E-11 · `preview` has no `autoIncrement` — MINOR · NEEDS NATIVE BUILD

`development` and `production` set `autoIncrement: true`; `preview` does not. With
`cli.appVersionSource: "remote"`, every preview build therefore reuses the same
`buildNumber` / `versionCode`. Tolerable for internal side-load distribution, which is what
`preview` is for, but two preview builds are indistinguishable by version in `eas build:list`
— and if a preview build is ever pushed to TestFlight, Apple rejects the duplicate
`CFBundleVersion`. `eas.json` edit ⇒ native build.

## E-12 · `submit.production` is empty — MINOR · NEEDS NATIVE BUILD *(for the fingerprint, not the submit)*

```json
"submit": { "production": {} }
```

No `ios.appleId` / `ascAppId` / `appleTeamId`, no `android.serviceAccountKeyPath` or
`track`. `eas submit --profile production` will prompt for all of it interactively and fail
outright in a non-interactive run — a bad thing to discover on launch day.

Filling it in is a change to `eas.json`, and `eas.json` is hashed **whole**. So even editing
the `submit` block — which has no effect on the app binary whatsoever — moves
`runtimeVersion` and orphans every installed build from OTA. If this is going to be filled
in, it must be done in the same commit as the launch build, never after it.

## E-13 · Channel / branch alignment — MINOR · OTA-SAFE

| profile | distribution | channel | autoIncrement |
|---|---|---|---|
| `development` | internal | `development` | yes |
| `preview` | internal | `preview` | **no** (E-11) |
| `production` | store (default) | `production` | yes |

The documented fast loop (`reference_fast_dev_loop`, `docs/APE_BUILD_READINESS_2026_09_17.md`)
publishes `eas update --branch preview --environment preview`. That is correct for the
owner's test phones, which run `preview`-channel builds. **Store builds listen on
`production`**, and nothing in the repo maps a `production` branch. At launch, updates must
go to `--branch production`, and `eas channel:view production` should be checked to confirm
it points at a branch that exists. No file change needed — this is a flag at publish time,
so it is the one item here that is genuinely OTA-safe.

---

## 3. `.easignore` and the upload — the pin is holding

**The specific hazard the repo was bitten by is closed. Verified:**

- `.easignore` on disk: 1351 bytes, **0 CRLF**, sha1 `c2666b4af010a9953c632623fee652a15f467051`.
- That is byte-identical to the index version, and the `c2666b4a` prefix is exactly the hash
  `.gitattributes` records as the one the iPhone's build was keyed to.
- `git check-attr -a .easignore` → `text: set`, `eol: lf`. The pin is still in
  `.gitattributes` (last line: `.easignore       text eol=lf`). ✓

**Exclusions are doing their job** on the big items: `node_modules/` (2.2 GB), `web/`
(1.35 GB), `audio_app_archive/` (370 MB), `dist/` (162 MB), `machineA_ingest/` (20 MB),
`docs/` (9 MB), `supabase/`, `scripts/`, `/ios`, `/android`, `.agents/`, `.claude/skills/`,
`.env`, `_bughunt_tmp/`. `package-lock.json` is correctly *not* excluded.

### E-14 · ~96 MB of unreferenced assets still ride along — informational, **do nothing**

| folder | size | referenced in `src/` | tracked in git |
|---|---|---|---|
| `assets/topic-images-webp/` | 34 MB | name-only (see below) | yes |
| `assets/Certificate_Squares/` | 21 MB | **0 files** | yes |
| `assets/credential-squares/` | 20 MB | **0 files** | no (gitignored) |
| `assets/New certificate images Sept 17/` | 11 MB | **0 files** | yes |
| `assets/Menu Course Cards/` | 10 MB | **0 files** | yes |

`src/data/topicImages.ts` only maps *filenames* — the images themselves come from the
`topic-tiles` Supabase bucket (`TOPIC_IMAGE_BUCKET`), so those 34 MB are not bundled either.
`assets/lab-backgrounds/` (11 MB, 3 references) and `assets/tool-strips/` (4 MB, 7
references) *are* real bundle assets and must stay.

**None of this reaches the app binary** — Metro bundles only what is imported — so this is
upload time, not app size, and it is low value.

**Do not act on it.** Two independent reasons: adding these paths to `.easignore` changes
the fingerprint (the E-1 class of failure), and they are image folders, which under the
standing rule the owner names and approves individually. Recorded for the owner's judgement
only.

---

## 4. The native modules — I found nothing wrong here

This section is a clean result, stated in full because "we checked and it holds" is worth
knowing before a launch.

**`modules/ape-dsp`** — 34 members declared in the `NativeApeDsp` type in `index.ts`.

- **iOS** (`ios/ApeDspModule.swift`) exports 33: everything except `getMicrophoneInfo`.
- **Android** (`android/.../ApeDspModule.kt`) exports all 34.
- The one asymmetry is declared and handled correctly. `getMicrophoneInfo` is typed `?:`
  (optional) and the wrapper checks `typeof native.getMicrophoneInfo === 'function'` inside
  a `try/catch` that returns `null`. The doc comment says "Android only (API 28+);
  undefined on iOS / older builds" — which is exactly what the native side does.
- **No JS member is missing a native implementation on either platform, and no native
  export is unreachable from JS.** I diffed both lists member by member.
- Every engine-version gate degrades honestly rather than crashing or simulating:
  `≥2` engine, `≥3` additive, `≥6` fx, `≥7` binaural/modular/FM, `≥8` dual.
  Getters return `null`, setters no-op, `genStop`/`binStop`/`modStop` resolve, and
  `genStart` / `binStart` / `modStart` **reject with a readable message** instead of
  resolving falsely. `engineVersion()` is read from `getInfo().engineVersion`, never
  hardcoded, memoised once per process.
- The web/dev sim overlay (`index.ts`, final block) is gated on `__DEV__ && Platform.OS === 'web'`
  — it cannot reach a device or a release build.

**`modules/ape-optical`** — 5 members declared; both platforms export all 5
(`moduleVersion`, `start`, `stop`, `getSamples`, `getPermissionStatus`). Uses
`requireOptionalNativeModule`, so an older client returns `null` rather than throwing.
`getPermissionStatus()` narrows an unknown native string to `'undetermined'`.

**The `optionalModule` honesty gate is honest.** Every package with a literal `require` row
in `LOADERS` (`src/features/tools/capture/optionalModule.ts:29-56`) is genuinely installed —
I checked all ten against `package.json`. The two packages that are *not* installed,
`expo-location` and `expo-image-picker`, correctly stay off the table and fall through to the
`eval('require')` path that resolves `null`, and both call sites gate their UI on
`isAvailable()` (`MultiMeterScreen.tsx:765-766`). The trap documented in that file's header
— Metro never bundling the JS half — is genuinely fixed by the literal-require table.

---

## 5. Dependencies vs Expo SDK 57

Compared against `node_modules/expo/bundledNativeModules.json` (the SDK's own map).

### E-15 · Four drifts, three of them fingerprint inputs

| package | in `package.json` | SDK 57 expects |
|---|---|---|
| `expo-asset` | `~57.0.15` | `~57.0.17` |
| `expo-constants` | `~57.0.3` | `~57.0.18` |
| `expo-font` | `~57.0.0` | `~57.0.4` |
| `react-native-web` | `^0.21.2` | `~0.21.0` |

All four are range specifiers, and the first three have `android`/`ios` directories in the
autolinking fingerprint sources. So **`npx expo install --fix` — the obvious, harmless-looking
housekeeping command — is a `runtimeVersion` change.** Flagging, not fixing, per the brief.
`react-native-web` uses `^` where the SDK pins `~`, which allows a minor bump; it only
affects the browser preview loop, not the phones.

**`expo-speech-recognition: ^56.0.1`** — an SDK **56**-generation third-party Expo module
running on SDK 57, and `^56` can never resolve to a 57 release. It builds today (its
`android`/`ios` dirs are in the autolinking source list and the plugin resolves), so this is
a flag, not a failure: it is the first thing to check if a future SDK 57 build breaks in
autolinking, and it will need a real upgrade before SDK 58.

**Nothing heavy and unused.** `qrcode` (pinned exactly at `1.5.4`), `react-native-qrcode-svg`,
`js-sha256`, `react-native-view-shot@5.1.0`, `expo-iap@^5.5.1` all have live call sites.
`react-dom` + `react-native-web` are needed by the `ape-web` browser preview.

**`package-lock.json` is tracked** (368 KB, `git ls-files` confirms) so the resolved tree is
pinned for EAS. Good — with this many `^` ranges it is the only thing making builds
reproducible.

---

## 6. Verified clean — recorded so nobody "fixes" a non-problem

- **`newArchEnabled` is absent, and that is correct.** RN 0.86 has no legacy architecture to
  opt out of. Adding the key would be a fingerprint change for nothing.
- **`assets/icon.png` is 1024×1024, colorType 2 (RGB, no alpha).** iOS rejects icons with an
  alpha channel; this one is safe. The three Android adaptive layers are all 1024×1024, and
  foreground/monochrome correctly carry alpha.
- **`POST_NOTIFICATIONS` is NOT missing.** It does not appear in
  `expo config --introspect`'s permission list, which looks alarming, but
  `node_modules/expo-notifications/android/src/main/AndroidManifest.xml` declares both
  `POST_NOTIFICATIONS` and `RECEIVE_BOOT_COMPLETED` in the library manifest, and they merge
  at build time. Android 13+ notifications work.
- **`android.permissions: ["android.permission.CAMERA"]` is additive, not a replacement.**
  The evaluated list contains CAMERA *plus* everything the plugins add *plus* `INTERNET`.
- **The dev-client local-network prompt does not reach customers.**
  `expo-dev-launcher`'s plugin (`withDevLauncher.js:32-64`) installs a build phase that
  strips `NSBonjourServices: _expo._tcp` and `NSLocalNetworkUsageDescription` from the
  Info.plist whenever `$CONFIGURATION != Debug`. The introspected config shows them only
  because introspection evaluates the Debug-shaped plist.
- **`version: "1.0.0"` with `appVersionSource: "remote"` is set up correctly** —
  `ios.buildNumber` and `android.versionCode` are absent from `app.json`, which is required
  when EAS owns them.
- **Sentry plugin options are deliberately incomplete and that is right.** `project` and
  `url` are set; `organization` is omitted so the generated `sentry.properties` falls back to
  the `SENTRY_ORG` environment variable (`withSentry.js:46-60`), which is the documented
  approach in `docs/APE_BUILD_READINESS_2026_09_17.md`. `authToken` is correctly *not* in
  `app.json` — the plugin warns about that and would write it into the package.
- **`modules/ape-dsp/test/` build artifacts are not fingerprint inputs** (see §0).

### Verification of items the brief listed as still open

- **`ios.associatedDomains` — CONFIRMED ABSENT.** The evaluated config reports
  `associatedDomains: undefined`. Three places still assert it exists:
  `src/navigation/linking.ts:7-8` (comment), `docs/APE_LABS_DEEPLINK_PROPOSAL_2026_09_10.md:83`,
  `docs/APE_WEBSITE_SEO_NOTES_2026_09_05.md:25`. The one thing I can add that the earlier
  passes did not: restoring it is **NEEDS NATIVE BUILD *and* needs an interactive
  `eas build`** — `docs/discoverability/RESUME_HERE.md:77` records that the stored Ad Hoc
  provisioning profile has no Associated Domains capability and a `--non-interactive` build
  cannot add it, so a non-interactive build would fail at signing. Budget for an Apple login.
- **`predictiveBackGestureEnabled: false`** is present, consistent with the open
  "hardware BACK escapes the Celebration screen" finding. That one is JS and OTA-fixable.

### U-1 · Unverified: `NSAllowsArbitraryLoads`

`expo config --type introspect` reports
`NSAppTransportSecurity: { NSAllowsArbitraryLoads: true, NSExceptionDomains: { localhost: … } }`
and `UIRequiredDeviceCapabilities: ["armv7"]`. **I could not confirm these ship.** Both come
from the default plist literal in
`node_modules/@expo/config-plugins/build/plugins/withIosBaseMods.js:115-135`, which carries
the comment *"TODO: Fetch the versioned template file if possible"* — i.e. it is the
introspection **fallback** used when no `ios/` directory exists, not necessarily the SDK 57
prebuild template. The real template is downloaded at prebuild time and is not in
`node_modules`, so it cannot be read from here.

If it is real, an App Store build permits arbitrary cleartext loads and will draw an App
Review question. **What settles it:** run `npx expo prebuild --platform ios --no-install` in
a scratch copy (never in this working tree — it would create `/ios` and could disturb the
fingerprint) and read the generated `ios/<name>/Info.plist`. Fixing it would be an
`ios.infoPlist.NSAppTransportSecurity` override ⇒ native build.

---

## Two more things for the owner, plainly

**Nothing in this report can be shipped over the air.** Every single app.json and eas.json
finding — including the ones that are pure metadata, like the empty `submit` block —
changes `runtimeVersion`. They should be collected into one commit and land with one native
build, not trickled in.

**E-1 is the one to look at before anything else**, because it decides whether the
OTA channel works at all, and it is invisible when it fails. The compare is two read-only
commands and takes a minute.
