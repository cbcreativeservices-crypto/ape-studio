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
