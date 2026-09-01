# Full VU overlay — control-pill placement spec (2026-09-01)

Owner: the three top-left pills read as clutter over the photoreal VU. Spec only — no code changed.
Target: `src/screens/tools/SplMeterScreen.tsx` — FULL VU overlay (~L1931–2066), styles ~L2636–2709.

## Principle

Clear the top edge entirely (the ✕ owns top-right; nothing competes). Move the toggles to the
**bottom corners** — grouped with what they control, in landscape thumb-rest zones, and visually
"anchored furniture" so the empty centre still reads as tap-to-close.

## 1. Placement

| Control | Position | Expression |
|---|---|---|
| ✕ close | top-right (unchanged) | `top: fsChromeTop, right: camInset + 14` |
| HIDE CONTROLS | **bottom-left** | `left: camInset + 14, bottom: Math.max(insets.bottom, 12) + 10` |
| HIDE LED + wheel | **bottom-right**, one row: `[wheel][HIDE LED]` | `right: camInset + 14, bottom: Math.max(insets.bottom, 12) + 10` |
| Settings column | left, vertically centred (unchanged) | — |

Why:
- **HIDE CONTROLS bottom-left** sits under the settings column it governs; the left thumb rests
  there in landscape. In the hidden state it is the lone pill (plus ✕) — a quiet corner badge,
  not a floating row over the meter face.
- **HIDE LED + wheel bottom-right** sit at the foot of the 92pt LED column they control —
  spatial grouping does the explaining; no label repositioning needed. Wheel LEFT of the pill so
  the pill (the more-used control) keeps the extreme corner. The wheel stays discreet
  (member rule) and disappears with the LED exactly as today.
- Diagonal balance: ✕ top-right, LED cluster bottom-right, chrome toggle bottom-left, and the
  full top-left corner is returned to the instrument. Pills in corners register as chrome;
  centre-field remains unambiguously "empty = close".
- `camInset` on both left and right keeps every pill clear of the camera housing in either
  landscape rotation; `insets.bottom` clears the home indicator.

## 2. Style changes

- Replace `vuFsLedRow` with two absolute containers, both `zIndex: 140`, `pointerEvents: "box-none"`:
  - `vuFsChromeToggle` — bottom-left, holds the HIDE/SHOW CONTROLS pill.
  - `vuFsLedCluster` — bottom-right, `flexDirection: 'row'`, `gap: 8`, `alignItems: 'center'`,
    holds wheel + HIDE/SHOW LED.
- Pills keep the house style exactly: 40pt tall, `rgba(18,18,22,.9)` ground, `#3a3a44` border,
  Oswald SemiBold 12/ls1 (`vuFsLedTogglePill` / `vuFsLedWheelPill` unchanged). Keep `hitSlop: 6`
  (40 + 12 = 52pt effective target, ≥44pt). No icon substitution — text pills stay; icons here
  would fail the icon-quality bar and cost discoverability for a glance tool.
- Check: `SideLed` is `winH * 0.82` tall — the bottom-right cluster may overlap the LED's lowest
  ~10pt on short phones. Acceptable (the pills are opaque chrome), but if it reads badly on
  device, drop `ledH` to `winH * 0.78` in the fullscreen only.
- Portrait: untouched — content is landscape-only; the bottom settings bar (portrait) is unreachable here.

## 3. Idle dim / auto-fade — recommend AGAINST

Video-player-style fade-on-idle conflicts with tap-anywhere-to-close: the natural "wake the
controls" tap would CLOSE the screen. Any workaround (first tap wakes, second closes) breaks the
owner-hardened close behaviour of 2026-08-18. And this is a meter read across a room — static,
predictable chrome beats appearing/disappearing chrome; HIDE CONTROLS already IS the explicit
clean-view mode, made stronger by this move (hidden state = one corner pill + ✕ only).
Optional garnish, not required: drop resting pill opacity to `0.85` via container opacity —
skip it if it muddies the Oswald text.

## 4. Constraints honoured

- ≥44pt effective targets (40pt + hitSlop 6). House pill style unchanged. No new deps.
- Tap-anywhere-to-close preserved (containers `box-none`; only the Pressables consume taps).
- HIDE CONTROLS remains visible in the hidden state (bottom-left, reads SHOW CONTROLS).
- Copy: NO new copy — HIDE/SHOW CONTROLS, HIDE/SHOW LED and all accessibility labels carry over
  verbatim. (HIDE CONTROLS copy itself is still flagged "NEW COPY — owner review" from 2026-09-01.)
