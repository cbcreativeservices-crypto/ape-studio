# AP&E governance decisions — 2026-10-14

Owner rulings from the lab slider pass (report: `Downloads/2026-10-14_LAB_SLIDER_PASS_REPORT.md`). These continue D67–D74 (2026-10-10).

## D75 · Every lab fader does something, moves evenly, and follows the finger

The owner asked: "validate that all labs with the movable horizontal slider… actually does things… moves smoothly with the finger… never causes the user any pause or distraction."

1. **The finger is followed on the UI thread.** The rack lane (`ParamLane`) uses Gesture Handler `Gesture.Pan` worklets.
   - The cap is a SharedValue.
   - The page is fed at most one value per 16 ms (`laneFeed`).
   - A release lands where the finger lifted, including a flick whose lift arrives before the pan activates.
   - A preview lane's cap holds where the finger let go until the page's commit lands.
2. **The whole travel changes something.** A lane spans only the values that can actually happen; Miking lanes span the mic's real reach.
3. **A fader that does nothing in the current mode is LOCKED and says why.** Use the rack `locked: '<reason>'` field; the key reads LOCKED and a tap explains. It never moves silently.
4. **A fader with only 3–4 positions is a tap key, not a slider.** Use `kind: 'options'`, or Miking's `tapsWhenFew` helper. Five or more positions stay a fader.
5. **Equal travel gives an equal perceived step.**
   - Pitch moves in musical steps (log).
   - Ratios use a log scale.
   - Console level faders use the console taper: unity at 75 %, see `features/soundsystems/faderTaper.ts`.
   - A range ends where the model stops changing (e.g. de-esser Range 0–8 dB, Live Spectrum EQ ±8 dB).
6. **A readout shows a number next to its word** (e.g. "strong · 74 %"). Dock keys show their value, never a blank.
7. **The picture follows the drag.** When a full render is slow, show a labelled ESTIMATE while dragging and draw it the way the real render will be drawn, e.g. at matched level when MATCH is on.
8. **Leave as is (owner chose the defaults):**
   - Wave readout lag;
   - Miking bezel during a drag;
   - stepped snap on release;
   - Miking reach and AIM ranges;
   - Distortion saturation;
   - Room MODE list of 24;
   - Harmonic F0 axis;
   - Phase DLY timing;
   - Tuning ch13 range;
   - sports AIM direction (knob left = "right of centre").

## D76 · Worklets and shared values (engineering rule, ratchet-enforced)

1. **A `'worklet'` function never reads a module constant in a default parameter.** A worklet captures only what its BODY reads, so `function f(x, c = C20) { 'worklet'; … }` throws "Property 'C20' doesn't exist" on the UI thread and crashes the screen. Write `cIn?: number` and resolve it with `const c = cIn ?? C20;` in the body.
   - This crashed the Miking "Two microphones" pages. The code dates from 2026-10-04, so it is probably in the store build under review; fixed in d10adb4a and shipping with the post-approval OTA.
   - Ratchet: `test/sliderCore_20261014.test.ts` scans all of `src`.
2. **Never write a SharedValue from JS and read it back in the same JS tick.** The write lands on the UI runtime later, while a JS read comes synchronously from the UI runtime, so the read returns the OLD value.
   - Keep a JS-side mirror (a ref) of what you wrote; see `useRig.live`.
   - This bug saved Miking taps at the old mic position and made the Harmonograph draw a new figure far too fast.
3. **A chooser tray on a short phone rises over the foot of the stage** so it always shows its options (RackUnit `TRAY_MIN` 168 dp). An empty tray strip is a bug.
