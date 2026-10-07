# B10 Sideline and Post-Event Interviews: GEOMETRY PROPOSAL

Status: PROPOSAL. Reuses frame V (two heads: reporter R and guest G) and the broadcast mic set (`commentators/` §4).

## 1. Scene
- Side + plan of two standing adults facing ~60° apart toward a camera (drawing default; lip height defaults from frame V).
- Plan layers from the venue plan builder (frame P, `field_diamond/` §1): permitted interview zone (box), play area
  keep-out (hatched), camera + frame cone, PA and crowd directions (arrows), wind arrow, nearest clear exit path.
- The handheld can be moved between the two mouths; a **handoff timeline** (static strip: question → move → pause →
  answer) shows that the mic arrives before the answer starts.

## 2. Zones (distances lip point → capsule)
| Zone | Geometry | Class |
|---|---|---|
| `zone.int.handheld` | on the active mouth axis, r < 150 mm, below the breath jet | SOURCED via frame V (Shure SM58 row) as a suggested start; lesson gives no number |
| `zone.int.between` | mic midway between mouths | anti-example (DERIVED level drop: 20·log10(d_mid/d_close)) |
| `zone.int.lav` | sternum, ~ 200–250 mm below the lip point | drawing default (part 1 B05 owns the lav zone) |
| `zone.int.headset` | reporter headset at mouth corner | from `commentators/` |
| `zone.int.boom` | shotgun above the frame line, aimed down at the mouth; boom-to-mouth TRIAL 0.5–1.0 m | TRIAL (lesson: "close above or to the side"), part 1 B04 owns boom geometry |

## 3. Readouts (DERIVED)
Distance to each mouth, level difference reporter vs guest at the same mic (inverse square), off-axis angle and ideal
polar gain, PA direction vs the mic's null (supercardioid rear lobe shown). Two open mics on one voice → Δt + notches.

## 4. Starting setups
ONE MIC: one handheld, moved to each speaker. TWO MICS: separate handhelds. CLOSE · LIVE: reporter headset + guest
handheld. FARTHER BACK · STUDIO: boom over a controlled post-event mark. ANOTHER START: lav on a scheduled guest
("only with approval" note).

## 5. New shared needs
Mic **flag** cube on the handheld (camera-visible; drawing only), and the handoff timeline strip (reusable for B11/B17).
