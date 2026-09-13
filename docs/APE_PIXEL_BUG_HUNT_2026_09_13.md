# Pixel bug hunt — 2026-09-13 (overnight)

Device: Pixel 7 Pro, dev client on Metro `192.168.0.221:8081`, branch
`audio-tools-engine` at `b40da93e`.

---

## ⚠️ READ FIRST — I changed the device's sign-in state

**The Pixel is now in GUEST MODE. You were signed in as Anorak (Academy).**

What happened, in order:

1. A lab deep link appeared to be a no-op, so I force-stopped the app to retest
   it from cold.
2. **Force-stopping a dev-client app drops it to the Expo launcher**, not back
   into the app. Relaunching `.MainActivity` opened the launcher's
   "DEVELOPMENT SERVERS" page.
3. Reconnecting via `proaudio://expo-development-client/?url=…8081` brought the
   app back, but at the **welcome → auth gate**, not signed in.
4. I could not sign back in — entering your credentials is not something I do —
   so I continued the hunt in **Guest Mode**, which is a legitimate and arguably
   more important test surface (it is what a new user sees).

**To restore:** open the app and log in as normal. Nothing was deleted, no
account action was taken, and no data was written.

**Lesson for next time, and the reason this is at the top:** never `am
force-stop` the dev client. To restart the JS cleanly, use the dev menu's Reload
(keyevent 82) or a deep link — the force-stop costs the session.

---

## Confirmed this run

Nothing yet that is a definite app defect. Two things I suspected turned out to
be correct behaviour, and I would rather record the dead ends than let someone
chase them again:

| Looked like a bug | Actually |
|---|---|
| MultiMeter deep link renders a near-empty screen (7 text nodes) | Its correct pre-START state: title, honesty notice, START. Nothing is simulated while stopped, by design |
| `labs/harmonograph`, `labs/harmonic`, `labs/oscillator` land on the labs index | Contaminated test. On a clean retest they navigate. See SUSPECTED below |
| A colour-language interstitial blocks every visualizer lab, repeatedly | `withAmplitudeOrientation` — by design. It gates EVERY path into a visualizer lab (tile, deep link, banner) until the orientation is completed, and a fresh guest has not completed it. Fires until passed, then never again |
| `labs/harmonic`, `labs/harmonograph`, `labs/reverb` bounce to "Pro Audio Training Academy" | Membership gate. Correct for a guest — those are member labs |

## 🔴 CONFIRMED — the 14-a-week glossary allowance does not gate the definitions

**A guest reads all 26,855 definitions in full, by scrolling, spending none of
the weekly allowance.**

Observed on the Pixel in Guest Mode: the glossary list shows each term with its
COMPLETE definition already on screen, unopened. `-10 dBV`, `-174 dBm/Hz`,
`-3 dB pan law` were all fully readable without a single tap.

The code agrees. In `src/screens/glossary/GlossaryScreen.tsx`:

- the collapsed row renders `item.definition` with
  `numberOfLines={cardView ? 2 : undefined}` — **unclamped in LIST view**, which
  is the default (CARDS is the opt-in);
- the allowance is spent ONLY in `toggleExpand`, at
  `if (!(await gateDefinitionOpen(id))) return;` — reached only when a row is
  being OPENED.

So what the 14/week actually gates is the EXPANDED view — the five category
sections (plain English and the rest). The one-paragraph definition is free and
unlimited.

### Why this matters beyond the mechanics

**The copy shipped today now says something the app does not do.** About,
paywall, upgrade sheet and the Auth guest line all carry "Free use includes 14
definitions a week" (commit `83552727` and earlier). On this evidence a guest's
definitions are unlimited; what is limited is the deeper breakdown.

The in-app toast has the same problem from the other side: "Tap a term to expand
or collapse the complete definition" — the complete definition is already
printed above it.

### Not fixed on purpose — this is a product call, not a bug fix

Two ways to resolve it, and they are materially different products:

1. **Clamp the list row** (e.g. `numberOfLines={2}` with a "read more" that
   spends a lookup). Makes the copy true. Changes what the free tier IS, which
   is the owner's decision and not mine to make overnight.
2. **Change the copy** to describe what is actually metered — the expanded
   breakdown, not "definitions". Ratified commercial copy, so it routes through
   governance either way.

Whichever way it goes, the toast wording needs to follow.

## ✅ SESSION LOGOUT — the storage layer is CLEARED, cause still open

The Pixel landed on the auth gate twice after a restart/reload. If a cold start
loses the session, every real user is logged out on every launch — a launch
blocker. **It is not the storage layer.** Measured, not reasoned:

| Hypothesis | Verdict |
|---|---|
| AsyncStorage full (the documented SQLITE_FULL data-loss class) | **DEAD.** The app's AsyncStorage holds 7 keys, 351 bytes total, and **no auth key at all** |
| Stale dev client lacks expo-secure-store, so the adapter degrades | **DEAD.** Boot probe reports `secureStore=true` — the native module is present and the keychain path is live |
| Chunked keychain writes tear (session > the 1800-byte CHUNK, marker written before the parts) | **DEAD.** Round-tripped 1.2 KB / 4 KB / 9 KB through `authStorage` on the device: all returned byte-identical, including the multi-chunk marker path |
| `SingleDeviceGuard` signs the device out on a flaky read | **DEAD.** `getActiveDeviceId()` fails OPEN (null on any error) and `isDisplaced()` returns false unless the server reports a genuinely different device. It also announces itself with a popup |

So reads and writes both work. What is left is WHY there was no token to read:
either the login never persisted one, or something removed it. The remaining
automatic sign-out path in the app is `SingleDeviceGuard`, which shows
"Your account was signed in on another device" when it fires — so if that popup
was never seen, it was not the guard.

⚠️ **My own observation may be the flaw.** Between the two logouts I had put the
app into GUEST MODE, and a guest has no session by definition. The probe's
`storedLen=null session=no` on the most recent reload is therefore EXPECTED, not
evidence of loss. The clean test has not been run.

**One line settles it** — `src/lib/supabase.ts` now logs, `__DEV__` only and
never a token value:

```
[authprobe] storedLen=<n|null> session=<YES|no>
```

| Where | What |
|---|---|
| Pixel | Sign in, then Reload from the dev menu, and read the line via `adb logcat -s ReactNativeJS \| grep authprobe` |

`session=YES` → the session persisted and the earlier observation was something
else. `session=no` → a real loss, and `storedLen` says whether the token was
never written or written and then removed. **Remove the probe once resolved.**

## SUSPECTED — needs a clean retest, do not treat as confirmed

**Warm deep links may be ignored after the app has been running a long time.**

In the first sweep — app running for hours, signed in — `proaudio://labs/…` for
harmonograph / harmonic / oscillator produced NO navigation at all: the screen
stayed on whatever was already there, so the dump showed the previous screen.
`labs/noise` and `labs/eq` navigated normally from the same state moments later.
After a fresh launch, the same three links navigate fine.

Why it matters: deep links are the app's discoverability surface
(`src/navigation/linking.ts`, `proaudio://` + App Links). A link that silently
does nothing is worse than one that errors.

Why it is NOT confirmed: I destroyed the conditions before isolating it, and the
app state differed (signed-in vs guest, warm vs cold). It needs a session that
has been running a while, then a link probe, without a restart in between.

## ✅ PERFORMANCE — the 15-second tool open is GONE, measured in real use

`src/features/tools/devTiming.ts` exists because of an owner report on
2026-09-05: *"a tool's start screen took ~15 s to open on the phone."* Those
marks streamed off the Pixel tonight while the owner used it normally — not a
synthetic test — across five different tools:

| Tool | tap→navigate | navigate→mount | **tap→mount** |
|---|---|---|---|
| SPL meter | 119 ms | 281 ms | **400 ms** |
| Waveform | 100 ms | 275 ms | **375 ms** |
| RTA | 105 ms | 265 ms | **370 ms** |
| Signal generator | 97 ms | 265 ms | **362 ms** |
| MultiMeter | 108 ms | — | — |

Consistent at roughly **100 ms of press/mic-handoff + 270 ms of push-and-render**.
Mic acquisition on a fresh hub entry measured **72–180 ms**.

Two things this closes:

- **the ~15 s open (2026-09-05) does not reproduce** — it is ~40× faster, on the
  same phone, in ordinary use;
- **the carried-forward "navigate → mount still ~1.2 s" note is stale** — that
  leg now measures 265–281 ms.

No action. Recorded so the next person does not re-chase a fixed regression, and
so there is a baseline to regress against.

## Verified working

- `proaudio://` scheme reaches the app; `tools`, `tools/multimeter`,
  `tools/frequency-counter`, `learn`, `labs`, `labs/noise`, `labs/eq`,
  `labs/calculator` all resolve to the right screens.
- Tools hub acquires the mic fast on entry — the Metro monitor showed
  `[tools] mic acquire hub (fresh start)` at 72–171 ms across many entries.
- No crashes, no red screens, no unhandled JS errors in the Metro monitor for
  the whole run. The only `[hub] dark` marks are my own backgrounding via
  `am start`, correctly labelled "(expected)".
- Guest onboarding runs clean: welcome → commitment → home, no dead controls.
- A scan of every rendered string on ~10 screens found no `NaN`, `undefined`,
  `null`, `Infinity`, `[object Object]`, unformatted `%s` or stray `TODO`.

## Method notes for the next run

- Drive by **deep link**, not coordinate taps — taps drift the moment a screen
  differs from the one you measured against.
- `adb shell svc power stayon true` keeps the Pixel awake while charging. It was
  set this run; the screen lock is what ends a session, and it locked once
  earlier in the day.
- Dump text with `uiautomator dump` + `exec-out cat` and grep for
  never-should-ship strings; it is far faster than reading screenshots and it
  catches things the eye skips.
