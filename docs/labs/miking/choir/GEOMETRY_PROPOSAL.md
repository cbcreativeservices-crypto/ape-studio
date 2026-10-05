# E05 Choirs: GEOMETRY PROPOSAL — choir preset of the seating-plan builder + area-mic coverage

Frames: stage frame S (`full_orchestra/GEOMETRY_PROPOSAL.md` §1); singers are frame-V tokens (`lead_vocal/`).

## 1. Riser preset
- Tier k (k = 0 floor, 1…3/4): front edge x_k = k · 457.2 (DERIVED from 18 in), standing height y_k = −k · 203.2
  (8 in) — SOURCED WENGER-SIG (conv.). Straight or arc (arc radius UNKNOWN → drawing default).
- Singer pitch along a row, rows per tier, mouth height of a standing adult above the tier: UNKNOWN → drawing
  defaults (`placeholder`). Mouth heights drive the section-view checks, so they are owner items.
- Back rail 1066.8 above the top tier (SOURCED), drawn in section view only.

## 2. Area-mic zones (section view, x measured from the front-row mouths)

| Zone | Geometry | Source |
|---|---|---|
| `zone.ch.live` | 609.6–1219.2 in front of the first row, 304.8–914.4 above (first-row heads), aim middle rows | S-LIVE |
| `zone.ch.church` | 609.6–914.4 in front of the mouths, aim back row; hanging variant same, never over heads | S-CHURCH |
| `zone.ch.rec` | "a few feet" in front/above, centred, aim last row (no number → shares S-LIVE band, labelled "a few feet") | S-REC |
| aim check | front row ≈ 60° off axis, back row ≈ 1.4 × the front-row distance | DPA-CHOIR (readout: computed angle and ratio vs DPA's example) |

## 3. Plan-view coverage
- Each area mic: cardioid fan 130° (S-REC) or the polar data of the chosen pattern; lateral section width
  1828.8–2743.2 per mic (S-REC); "1 mic per 15–20 people" counter (S-LIVE).
- **3:1 readout** between every pair of open area mics: d(mic_i, mic_j) / max(r_i, r_j), r = distance to the
  nearest singer (§0.2). Shows D-CH1 live (church spacing vs 3:1).
- Stereo main pair: array tool (§A), centred on the choir's acoustic centre; ORTF recording angle 95° wedge shows
  whether the choir fills it.
- Monitors: wedge tokens snap to the §0.1 nulls; any choir-mic → choir-wedge routing flagged (S-CHOIR).
- Hanging mic: plan + section; rigging note only (no hardware geometry).

## 4. Owner list
Singer pitch and mouth heights (drawing defaults); arc radius; default aim (middle vs back row).
