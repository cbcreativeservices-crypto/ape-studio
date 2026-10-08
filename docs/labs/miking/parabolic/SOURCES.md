# B12 Parabolic and Tracked Action Pickup: SOURCES

Lesson: `source_text/B12-Parabolic-and-Tracked-Action-Pickup-Miking-Technique.txt`. Checked 2026-10-07. Keys:
`commentators/SOURCES.md` §0.

## a. Claims
| Line | Claim | Status |
|---|---|---|
| L3/L8 | reflector concentrates on-axis sound at a focal region; more effective at high frequencies; dish size vs wavelength | CONFIRMED (wave acoustics; Wildtronics pages not re-read). DERIVED rule of thumb used in the app as an "ideal model": directional gain only where the wavelength is shorter than the dish diameter, f ≳ c/D |
| L8 | low frequencies can still reach the capsule directly — not proof of dish gain | PRACTICE / physics (keep; it resolves the Klover-vs-Wildtronics point) |
| L15–16 | place the element at the maker's focal reference, measured from the stated surface | CONFIRMED KLOVER-FAQ (MiK 16: 1-1/8 in behind hub rear / 1-1/2 in behind dish front face; MiK 26: 2-1/4 in / 4 in) |
| L18 | MiK 16 accepts omni or wide cardioid; MiK 26 omni | CONFIRMED KLOVER-FAQ |
| L18 | do not swap in a shotgun by assumption | PRACTICE |
| L27 | MiK 26 guide: aim below a distant player (toward the feet) to reduce crowd beyond | UNSOURCED today (Klover blog not re-read); lesson already frames it as model-specific — app: "an idea to try" |
| L29 | headroom for the nearest/loudest event; HPF cannot restore overload | PRACTICE |
| L29 | two action mics on one source: arrival difference; fixed delay not valid as the source moves | CONFIRMED (C-SOUND; DERIVED in the tool) |
| L58 | Klover FAQ: wavelength "not relevant in the same way" | CONFIRMED that Klover says it (quote §0); physically **misleading** — the lesson already resolves it in favour of wave acoustics (keep, correction B12-01 records it) |
| L5 | NFL sideline restriction meeting | UNSOURCED (not re-read) |
| refs | brand names Klover, Wildtronics, Shure | internal only |

## b. Derived dish geometry (for drawing, DERIVED from KLOVER-FAQ + paraboloid law)
Paraboloid of rim radius r and depth d (vertex to rim plane) has focal length f = r²/(4d). If Klover's "behind the front
face" means the focus lies inside the dish, d − f = the stated offset. Taking the model number as the rim diameter in
inches (Medium: the lesson says "26-inch"; the 16 is inferred):
- 26 in: r = 13 in, d − f = 4 in → d ≈ 8.8 in (224 mm), f ≈ 4.8 in (122 mm).
- 16 in: r = 8 in, d − f = 1.5 in → d ≈ 4.8 in (122 mm), f ≈ 3.3 in (84 mm).
These are drawing values (DERIVED, `placeholder` until a maker drawing is read). Lowest frequency with dish gain
(f ≈ c/D, c = 343 m/s): 26 in (0.660 m) ≈ 520 Hz; 16 in (0.406 m) ≈ 845 Hz — labelled "ideal model".
