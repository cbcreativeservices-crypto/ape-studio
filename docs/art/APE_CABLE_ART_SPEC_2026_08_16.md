# Cable & Connector Lab — Artwork Specification & Prompt Package (2026-08-16)

**Purpose:** everything needed to produce the lab's owner-supplied artwork
(owner ruling 2026-08-15). Each image has a full standalone generation prompt.
Companion prompt files (one per family, full prompts inside):

| File | Contents |
|---|---|
| `APE_CABLE_ART_PROMPTS_ANALOG.md` | 7 core analog connectors × 4 views |
| `APE_CABLE_ART_PROMPTS_SPEAKER.md` | 6 core loudspeaker connectors × 4 views |
| `APE_CABLE_ART_PROMPTS_DIGITAL.md` | 10 core digital/network/control × 4 views |
| `APE_CABLE_ART_PROMPTS_POWER.md` | 10 core power × 4 views (safety-critical notes) |
| `APE_CABLE_ART_PROMPTS_RECOGNITION.md` | 15 recognition-tier connectors × 1 view |
| `APE_CABLE_ART_PROMPTS_SCENES.md` | anatomy exploded, 7 cross-sections, inspection vignettes, tester traces, challenge plots |

## 1. Priority tiers — generate in waves, stop when satisfied

| Tier | Images | Count | Unblocks |
|---|---|---|---|
| **T1a** | Core connector SIDE views (33) + PLUG-FACE views (33) | 66 | Lessons 3/5/6/7 cards, L4 comparisons |
| **T1b** | Generic anatomy exploded (1) + 7 cable cross-sections | 8 | Lesson 2 |
| **T2** | Core RECEPTACLE-FACE (33) + MATING-pair views (33) | 66 | Full §8 view set; locking/keying teaching moments |
| **T3** | Recognition-tier single views | 15 | L3/L5/L6/L7 recognition strips |
| **T4** | Scene set pieces: 12 inspection vignettes, 8 tester wiring traces, 2 challenge plots | 22 | L9/L10/L11 hero moments + set-piece animations |
| **T5 (optional)** | Per-core simplified exploded views (spec §8 letter — heavy; the T1b generic exploded carries the teaching) | 33 | Nice-to-have depth |

Total full-faithful package: **210 images**; minimum lovely launch: **T1a+T1b = 74**.

## 2. Global style guide (consistency is the whole game)

- **Theme fit:** objects float on TRANSPARENT background, lit to sit on the
  app's near-black panels (#0c0d11). Key light upper-left (app-wide law),
  soft rim light lower-right so dark rubber/plastic reads against dark UI.
- **Look:** clean technical-illustration realism — accurate geometry, believable
  materials (nickel/chrome metal, black thermoplastic, rubber boots), subtle
  specular highlights. Not cartoon, not blueprint, not photoreal-gritty (no
  dust/scratches/fingerprints).
- **Generic trade dress:** NO manufacturer logos, brand names, model numbers, or
  distinctive liveries. Geometry accurate to the standard; branding absent.
  (Where a color IS a VERIFIED functional meaning — powerCON blue=power-in /
  gray=power-out, Ethernet T568 pair colors, NA mains cord colors — keep it;
  that's function, not branding. TRUE1 carries NO verified color facts: keep
  it neutral and let real product references govern any accents.)
- **NO TEXT IN THE IMAGE.** No baked pin numbers, labels, or captions — the app
  overlays all labels (accessibility + MIN_FONT rules, and pin numbering is
  applied after the face-geometry verification pass). Molded relief that merely
  suggests unreadable markings is fine; legible characters are not.
- **Orientation conventions (every image):**
  - SIDE views: cable/boot exits LEFT, mating end points RIGHT, connector
    horizontal, centered.
  - PLUG-FACE views: dead-on, mating face toward viewer, the connector's
    keyway/latch/locking feature at 12 o'clock unless a family file overrides.
  - RECEPTACLE-FACE views: dead-on, same 12 o'clock keying convention. (The
    app never mirrors a face image — plug and receptacle are separate assets.)
  - MATING views: plug on the right approaching receptacle on the left, gap of
    roughly half the connector length, three-quarter angle allowed.
- **Scale honesty:** within a family file, relative sizes must read true (an
  XLR dwarfs a 3.5 mm plug). Frame each connector to fill ~80% of canvas, but
  keep proportions internally accurate — the app handles relative sizing.
- **Color semantics:** never use the app's blue→green→yellow→orange→red
  amplitude ramp as a gradient on anything. Conductor colors inside cutaways
  follow real-world convention only where the family file says so.
- **Format:** PNG, transparent background. SIDE/MATING/cross-sections/scenes:
  1600×1000. FACE views: 1000×1000. Max ~2 MB each (I compress/convert and
  decide bundled-vs-bucket delivery at integration).
- **File naming (exact — integration is mechanical):**
  `<connectorId>__side.png`, `<connectorId>__face-plug.png`,
  `<connectorId>__face-recept.png`, `<connectorId>__mating.png`,
  scenes per their prompt file (`anatomy__exploded.png`,
  `xsec__<sectionId>.png`, `l09__<itemId>.png`, `l10__<cableId>.png`,
  `l11__show-a.png`, `l11__studio-b.png`). ConnectorIds are the exact ids from
  `src/screens/lab/cable/cableTypes.ts` (also listed per prompt).
- **T5 exploded views (ratified):** `<connectorId>__exploded.png`.
- **Sanctioned filename extensions & adaptations** (the prompt files define
  these; integration expects them exactly):
  `powercon_xx__side-gray / __face-plug-gray / __face-recept-gray` (the
  power-out B-type set; NO gray mating view by design — an in/out approach
  image could read as a valid connection), `iec_c7_c8__face-plug-polarized`,
  `usb_b__side-usb3`, `usb_micro_b__side-usb3` (lower priority),
  `bare_wire__ferrule / __strands` (no faces exist for a non-connector),
  db25/xlr4/xlr5 recognition-tier face-plug extras (pin count IS the ID).
- **Reuse map (no separate images):** `usb_c_power` → `usb_c__*`;
  `poe` → `ethernet_8p8c__*` (+ `ethercon_style` context);
  `ts_speaker_legacy` faces → `ts_quarter__face-*`; `banana` receptacle face →
  `binding_post__face-recept`; `combo_xlr_trs` has no plug gender — its card
  reuses `xlr3__face-plug` + the 1/4-inch plug faces alongside its own
  receptacle-face image.

## 3. Accuracy rules (safety-critical program)

1. Every prompt below states the VERIFIED physical constraints (contact count,
   locking feature, body form) from the lab's fact-checked records. The image
   must honor them exactly — an XLR face with 4 pins is a rejected asset.
2. Where fine geometry is NOT verified (exact keyway clock positions, pin
   triangle orientation per gender), the prompt says "standard geometry —
   match real product references" and the delivered image goes through the
   **face-geometry verification pass** before pin-number overlays are enabled.
   Wrong-but-pretty faces get regenerated, so working from real reference
   photos of generic parts is strongly recommended for FACE views.
3. Male vs female faces are DIFFERENT images (mirror trap) — never flip one to
   make the other.

## 4. What happens when you deliver

I take the delivered set and: (1) build the art funnel (bundled asset registry
or Supabase-bucket loader depending on final size — nav-icon vs tube-card
precedents), (2) run the face-geometry verification pass against the images,
then enable pin-label overlays, (3) mount everything into the waiting ART
SLOTs, (4) build the set-piece animations (L2 layer peel, L10 trace sweep,
L11 power-up cascade) around the delivered art, reduced-motion-safe.
Partial deliveries are fine — slots fill as tiers arrive.

---

## 5. CALIBRATION EXEMPLARS — 3-pin XLR (`xlr3`)
The four prompts below set the voice and completeness bar for every prompt in
the family files. Each is standalone — paste as-is into your image tool.

### `xlr3__side.png` — male cable connector, side view
> Professional technical illustration of a generic 3-pin XLR male cable
> connector, side view, on a fully transparent background. Cylindrical
> nickel-finish metal barrel about 19 mm in diameter, mating end pointing
> RIGHT: at the right end, a recessed black insulator face with the chromed
> contact pins just visible edge-on. Along the top of the barrel, the shallow
> latch groove that the female latch engages. Left half: knurled metal grip
> ring, then a black rubber strain-relief boot with molded ribs, tapering onto
> a round black cable that exits LEFT out of frame. Materials: brushed nickel
> with soft reflections, matte black rubber. Lighting: key light upper-left,
> subtle rim light lower-right so dark surfaces separate from a dark app
> background. Clean, unbranded, no logos, NO text or numbers anywhere, no
> scratches. Centered, horizontal, filling ~80% of a 1600×1000 canvas.

### `xlr3__face-plug.png` — male mating face, head-on
> Professional technical illustration, dead-on front view of a generic 3-pin
> XLR male connector's mating face, transparent background, 1000×1000. A
> circular nickel metal shell rim; inside it, a matte-black circular insulator
> disc carrying exactly THREE round chromed male pins in the standard XLR
> triangular arrangement, with the shell's keyway/latch feature oriented to
> 12 o'clock — match real 3-pin XLR male face geometry from product
> references (pin positions must be authentic, not decorative). Subtle molded
> relief around the pins is fine but NO legible numbers or text. Even, soft
> studio lighting with the key from upper-left; slight depth inside the shell
> so the recessed face reads. Unbranded, clean, no damage.

### `xlr3__face-recept.png` — female mating face, head-on
> Professional technical illustration, dead-on front view of a generic 3-pin
> XLR FEMALE connector's mating face, transparent background, 1000×1000.
> Circular metal shell; matte-black insulator disc with exactly THREE round
> socket holes (chromed contact liners just visible inside), in the authentic
> female-face arrangement — this is NOT a mirrored copy of the male face;
> match real XLR female face references, keyway/latch at 12 o'clock. The
> female latch tab visible at the shell edge. NO legible text or numbers.
> Key light upper-left, gentle interior shadowing for depth. Unbranded.

### `xlr3__mating.png` — pair about to connect
> Professional technical illustration of a generic XLR pair about to mate,
> three-quarter view, transparent background, 1600×1000: on the LEFT a female
> XLR cable connector (latch button visible on top of its barrel), mating
> face angled toward the viewer-right; on the RIGHT a male XLR cable
> connector, pins toward the female, separated by about half a connector
> length on a shared axis. Both with black rubber boots and cable stubs
> exiting away from the gap. The geometry must make the connection direction
> obvious. Nickel metal, matte black rubber, key light upper-left, rim light
> lower-right, unbranded, NO text.
