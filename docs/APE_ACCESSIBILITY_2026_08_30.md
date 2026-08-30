# Accessibility — state of play (2026-08-30)

## The model: defer to the phone, own what the phone cannot do

| Concern | Who handles it | Why |
|---|---|---|
| Text size | **The phone** | `allowFontScaling` is not disabled anywhere, so React Native already scales every `Text` in this app with the OS setting. The old in-app chips changed nothing and duplicated a system control. |
| Contrast, colour filters | **The phone** | System-wide on iOS and Android. |
| Colour-blind remap | **Nobody — by ruling** | The amplitude colour ramp carries meaning and is fixed (owner, 2026-08-30). An in-app remap could only mislead the users who most need to trust the colours, so the selector was removed rather than left as a promise we will not keep. |
| Reduce animations | **The app + the phone** | Our toggle is ORed with `AccessibilityInfo.isReduceMotionEnabled`; either one silences motion. |
| Haptics | **The app** | `hapticsEnabled()`. |
| Labels, roles, hints, hit targets | **The app** | Below. |

Settings shows one honest row naming the exact phone path instead of three
controls that did nothing.

## Runtime

`src/features/settings/a11y.ts` — synchronous mirror + `useSyncExternalStore`
hook, fed from `loadLocalSettings`/`saveLocalSettings`, cleared by `resetLocal`
on account switch. `animationsAllowed()` is the one call sites should use.

## Sweep results (295 files, 841 touchables)

Starting point: 86% of touchables already labelled. Fixed:

- **Toggle** (16 call sites): now takes a `label` (it announced only "switch,
  on"), honours reduce-motion, hitSlop 8→10 to clear 44pt.
- **7 icon-only controls** that announced nothing: trophy tiles, two amplitude
  meters, the tuner cents scale, the hero logo.
- **39 controls** given `accessibilityRole="button"`.
- **6 press-swallowers** (`onPress={() => {}}` inside modal cards) set to
  `accessible={false}` — the codemod had wrongly marked them buttons.
- **3 dismiss backdrops** labelled "Close".
- **20 long-press help targets** given `accessibilityHint` rather than a button
  role — a screen-reader user cannot easily long-press.

Remaining "no role" hits are data readouts (PEAK, RMS, cents) that announce
their value plus a hint. Correct as-is.

## Audit tooling

The scripts used are throwaway, but the method is worth repeating: count
touchables, then separate **icon-only with no label** (genuinely unusable) from
**has text but no role** (announced, just not as a control). Raw "missing
label" counts overstate the problem — a `Pressable` wrapping visible `Text` is
announced by that text.

## Not done

- Focus order / `accessibilityViewIsModal` on the custom modals.
- Screen-reader pass on the Skia instrument canvases (they are images to a
  screen reader; the surrounding readouts carry the numbers).
- No testing with a real screen reader yet — everything here is static
  analysis plus a native bundle check.
