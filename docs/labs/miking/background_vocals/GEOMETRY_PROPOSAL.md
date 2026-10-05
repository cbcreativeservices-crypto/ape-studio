# E02 Background Vocals: GEOMETRY PROPOSAL

Reuses: voice family (frame V, `lead_vocal/`), stage frame S + seating builder (`full_orchestra/`), choir zones
(`choir/`). Three modes, one scene of 3–4 singer tokens.

| Mode | Geometry | Class |
|---|---|---|
| `bv.individual` | one mic per singer, frame-V zone `zone.bv.handheld` r ∈ [38.1, 76.2] (S-VOC-TIPS); loud row r ≥ 152.4 | SOURCED |
| `bv.shared` | one mic; singers on an arc around it; arc radius **drawing default** 400 (no source); "step in/back" animation = singer token moves along its radial line; loudest singer's default radius larger | SOURCED behaviour (S-BLUEGRASS), radius placeholder |
| `bv.omniCircle` | omni at centre, singers on a full circle; radius drawing default | SOURCED layout (S-REC), radius placeholder |
| `bv.backToBack` | two cardioids, axes 180° apart, singers on both sides | SOURCED (S-REC); spacing/height placeholder |
| `bv.area` | choir zones from `choir/GEOMETRY_PROPOSAL.md` §2 | SOURCED |

Readouts: per-mic r, **3:1 ratio** (§0.2) between open mics, comb-filter note when a singer reaches two open mics
with path difference Δd → first notch f = c / (2Δd) (DERIVED, standard physics; label "calculated"), monitor null
snap (§0.1), "choir mic → its own wedge" routing flag.
Owner: shared-mic arc radius and stand height defaults.
