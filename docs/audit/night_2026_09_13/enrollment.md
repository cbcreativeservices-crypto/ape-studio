# Enrollments surface — adversarial re-attack of today's changes (night 2026-09-13)

Scope: `src/screens/enrollment/EnrollmentScreen.tsx`, `src/screens/enrollment/HomeSetupSheet.tsx` — commits 2a4bde34 (LoadPill), c73000aa (scroll lock), a99da2ac (500 ms hold), b5112576 (dragY + slides), 4c91138d (neighbor-height stepping). Drag math verified with a node simulation of the exact loop; gesture FEEL claims deliberately not made (device-only).

## Confirmed bugs — FIXED in this pass

### 1. Hidden-row trap: reorder swaps consumed by completed topics (misplacement, verified by simulation)
`displayed` filters completed topics into MY RECORD, but the drag loop's `move()` called `moveTopic(gs, ±1)`, which swaps ADJACENT entries of the FULL enrolled array. With a completed topic between two displayed ones:
- a one-visible-row drag swapped only past the hidden topic — nothing moved on screen, yet `dragAccum` advanced a full row, so the lifted card visibly snapped back a row under the finger;
- the loop's local `rowOrder` mirror then lied (it recorded the VISIBLE neighbor as passed), so a longer drag landed the card one displayed row short of the finger travel. Simulated: store `A,H(idden),B,C`, drag A down 85 px (2 rows) → old code ends `B A C`, correct is `B C A`.

Fix: `moveTopicVisible` / `moveBundleVisible` — read the store LIVE, walk over every hidden entry, and swap until one VISIBLE neighbor is passed; one visual step now = one visible swap, keeping `dragAccum`, the mirror, and `LayoutAnimation` truthful.

### 2. Phantom neighbors: `rowOrder.bundles` included completed bundles that are not rendered
`rowOrder.current.bundles` was built from `displayedBundles`, but the list renders only `!isBundleDone` bundles (done ones live in MY RECORD). A done bundle in the middle was a phantom neighbor: the loop charged its (stale or fallback-84 px) height and burned a swap on it invisibly. Fixed: the ref now holds only the non-done (actually rendered) bundle keys, and `moveBundleVisible` steps over done bundles in the store.

### 3. Permanent scroll freeze: HoldToRemove vs the 500 ms lift (new interaction created today)
a99da2ac shortened the lift hold 2 s → 500 ms; c73000aa added `scrollEnabled={liftedId == null}`. Combined: holding the 1100 ms "Hold to Remove" button lifts the whole card at 500 ms (touches bubble to the row wrapper's hold timer), then the removal unmounts the row at 1100 ms with the finger still down — the row's touch-end never dispatches, `liftedId` stays set, and the screen's ScrollView is locked until remount. Two fixes:
- `HoldToRemove`'s Pressable now stops `onTouchStart` propagation, so holding Remove never arms the lift timer;
- safety net: an effect drops the lift the moment the lifted id is no longer in the rendered row set (also covers a topic completing mid-lift, filter toggled by a second finger, any other unmount path).

### 4. HomeSetupSheet: phantom `dragAccum` past the list ends (hysteresis)
`moveInOrder` no-ops at the ends, but `dragAccum` advanced by the full un-clamped step anyway. Dragging a row to an end and continuing banked phantom distance; reversing then did nothing until it was all retraced (rows' motion lags the finger by the overshoot). Fixed: the step is clamped to the swaps actually available (`order.indexOf` at event start is exact for the batch) and only committed swaps accumulate — past the end the row now simply rides the finger and springs home on release, matching the Enrollments list.

### 5. HomeSetupSheet: stale lift could reopen the sheet with scroll locked
If the sheet is dismissed mid-drag (Android back / onRequestClose), the row's touch-end may never dispatch and `liftedGs` survives — the sheet has `scrollEnabled={liftedGs == null}`, so it would reopen frozen. The open-rebuild effect now clears the hold timer, lift refs/state, and resets `liftAnim`/`dragY`.

### 6. Narrow-phone (~360 dp) core-locked row: pill can push STUDY off the card (defensive fix)
The LoadPill (~70–78 px) is ~30 px wider than the fixed 42 px deck-icon slot it replaced. On the expanded CORE-LOCKED row the right side stacks "Required" + "🔒 until completed" + pill + 42 px study icon + five 8 px gaps ≈ 283 px against ≈ 279 px of card content width at 360 dp — `lockCaption` had no `flexShrink`, so overflow pushes the STUDY icon past the card edge rather than truncating text. Gave `lockCaption` `flexShrink: 1` (it already has `numberOfLines={1}`): with slack nothing changes; when tight the caption ellipsizes. **Estimate from font metrics — owner should eyeball a core-locked row on the Pixel.**

## Attacked and CLEAN

- **LoadPill a11y, all 5 sites**: every site keeps `accessibilityRole="button"`, `accessibilityState` (`selected`, plus `disabled` where core-locked), the `aria-pressed`/`aria-disabled` RNW twins, and state-carrying labels. The pill itself is a plain View/Text inside the labelled Pressable — no double announcement, no nested role.
- **Core-locked dim state**: both topic sites pass `dim={coreLocked}` (0.55 opacity), `disabled` + `onPress: undefined` — untappable as before.
- **Custom-list row**: SEE&EDIT + pill + STUDY fit at 360 dp (title is `flex: 1` and truncates — at worst "My Cust…" on the narrowest phones; design call, not overflow). Toggle/study handlers unchanged.
- **Collapsed row (small pill variant)**: title is `flex: 1`; small pill ≈ 56 px; no wrap/overflow risk. a11y intact.
- **Award rows**: action row is badge + spacer + pill + study — wide margin at 360 dp.
- **Mid-drag re-render rebuilding `rowOrder` (assignment-during-render)**: cannot interleave with the loop — JS is single-threaded and React batches the store emits raised by `move()` until the event handler returns; the local mirror keeps the loop consistent within one event, and the render-time rebuild then reflects exactly the committed state. (The hidden-row case was the one way mirror and rebuild could disagree; fixed above.)
- **Derived "you qualify" cards (`move=null`)**: `beginLift` is only reachable through `reorderTouchProps`, which is never attached to derived cards; `containerPan(d.key, null)`'s lift branch requires `liftedIdRef === d.key`, which can never be set. They cannot lift, so they cannot stick.
- **Drag to list ends (Enrollments)**: loop breaks with no accumulation; the card rides the finger past the end and springs back on release. No hysteresis (HomeSetupSheet now matches — fix 4).
- **Terminate/cancel cleanup**: `onPanResponderTerminate`, `onTouchCancel`, and `onTouchEnd` all clear the hold timer and call `endLift`, which springs `dragY` → 0 in parallel with the pop relaxing and nulls `liftedIdRef` synchronously (scroll re-enables when the settle lands). Symmetric in both files. `dragAccum` resets on every grant.
- **`scrollEnabled={liftedId == null}`**: correct on both surfaces; the only stuck-`liftedId` paths found are closed by fixes 3 and 5.
- **HomeSetupSheet `onAnyTap` upsell vs drag**: no fight — non-paid rows get neither `rowPan` nor `rowTouch` (no drag exists for them), and for paid users `onAnyTap` returns immediately.
- **Repeated `moveTopic`/`moveBundle` calls inside one event**: both operate on the live module-level `list` at call time, so the walk-over-hidden loops compound correctly without waiting for a re-render.

## Out of scope (not touched)

- None found beyond the in-scope files. Stores (`enrollmentStore`, `enrolledBundlesStore`) behaved as documented.

## Needs the owner's device

- Reorder feel end-to-end (lift timing, slide animation, settle) — logic verified, feel is not.
- A core-locked topic row (expanded) on the Pixel at 360 dp: confirm the "🔒 until completed" caption + LOADED/UNLOADED pill + STUDY icon all sit inside the card (fix 6 is a metric estimate).
- Hold-to-Remove on a topic card: the card should no longer pop/lift while the red fill runs, and the screen must still scroll after the row is removed.
- Drag a topic past a spot where a COMPLETED topic used to sit (i.e. with at least one item in MY RECORD): steps should now be one-visible-row-per-row-height with no snap-back.

Verification: `npx tsc --noEmit` clean; `npm test` 1147/1147 pass. Simulation of the drag loop (pre/post fix) in scratchpad `dragsim.js` (session-local, not committed).
