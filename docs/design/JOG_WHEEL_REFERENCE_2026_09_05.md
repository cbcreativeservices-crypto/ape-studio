# Jog wheel — reference analysis (owner photos, 2026-09-05)

The owner supplied nine close-up photographs of a real hardware jog wheel on a DAW control surface and asked for the Dashboard's topic wheel (`src/components/JogWheel.tsx`: the 96 px `JogDial` opener and the big `JogOverlay` turn control) to be rebuilt to look and respond like it — "I want it to look real… a praise point of the app, not a gimmick." This document is the visual brief: everything below was read off the photographs. Agents building the wheel cannot see the photos, so this is the source of truth for materials, geometry and light. (Ask the owner to drop the originals into `docs/design/reference/jog-wheel/` for a later pixel comparison.)

## 1. The object

A large, low, matte-black cylindrical knob on a dark brushed-aluminium panel, with a single off-centre finger dimple that is the only rotation indicator. Same hardware family as the SSL/iCON-style transport wheels; the surrounding controls read BANK ◀ ▶, LAYER (a lit 360° key), SCRUB, TRIM/LTCH/TCH, a channel encoder with a white arc, and an EQ section with LMF / GAIN.

### Geometry (proportions, measured against the photos)

| Feature | Value |
|---|---|
| Knob diameter | ≈ 3 × the small square key width; the dominant object on the panel |
| Knob height (cylinder wall) | ≈ 12–15 % of the diameter — clearly a raised puck, not a disc |
| Top-edge radius | small, ≈ 2–3 % of diameter — a soft rounded edge, not a chamfer |
| Dimple diameter | ≈ 25–28 % of knob diameter |
| Dimple centre from knob centre | ≈ 0.50–0.55 × R (well inside the rim; roughly one dimple-radius of flat face remains outside it) |
| Dimple depth | a shallow spherical cap, depth ≈ 35–45 % of its own radius; the wall is steep at the rim and flattens smoothly to the floor |
| Base | the knob sits in a slightly darker collar/gap where it meets the panel; no visible axle or skirt |

The dimple is an actual concave dish: the finger sits *down* into it. Across the nine photos it appears at roughly 1, 3, 5, 7, 8, 10 and 11 o'clock — it rotates with the knob; nothing else on the knob changes.

### Material

- **Face and wall: sandblasted matte black plastic.** Fine, uniform micro-grain — visible as a dense speckle of tiny lighter points on a near-black ground, like 400-grit sand. No gloss, no reflections of the room, no visible spin marks. The grain is isotropic (same in every direction) and does not rotate visibly, so it can be a static texture on the face that the dimple rotates over, or a texture that rotates with the face; either is correct.
- **Tone:** the knob is the *darkest* object in every photo — darker than the panel, darker than the key caps. Its face sits around 12–18 % grey in the lit region and falls toward 5–8 % on the shadow side.
- **Panel: brushed dark aluminium**, horizontal brush lines, 25–35 % grey, with a broad anisotropic sheen band (the brushed highlight) that runs across the panel. The knob does not pick up that sheen — it is matte.
- **Dimple interior:** the same matte material, so it shades purely by form.

## 2. Light — what the photos show

The key light is broad and soft, from above and slightly toward the viewer's left (a lit room, not a spotlight). Consequences that must be reproduced:

1. **Face gradient.** A very subtle, broad brightening of the flat face toward the lit side (upper-left), never a hot spot. On a matte surface the highlight is wide and weak. The removed "light grey specular highlight" from an earlier version *read wrong* precisely because it was a glossy-style hot spot; the correct look is a large, low-contrast diffuse gradient plus the grain sparkle.
2. **Top-edge rim.** A thin, slightly brighter line along the rounded edge on the lit side (upper-left arc), fading to nothing on the shadow side (lower-right), where the edge instead goes darker than the face.
3. **Cylinder wall.** Visible in the oblique photos below the face: darker than the face, with a soft vertical gradient (slightly lighter just under the edge, darker toward the base) and a left-to-right gradient following the light.
4. **Contact shadow.** A soft dark shadow on the panel, hugging the base and offset away from the light (down and to the right), plus a tight dark ring right at the base where the collar is.
5. **Dimple — the signature.** Lit from above, a concave dish shades as the *inverse* of a bump:
   - the **upper inner wall** (facing down, away from the light) is the darkest thing on the knob, a crescent hugging the rim on the lit side;
   - the **lower inner wall / floor** (facing up toward the light) is lit — a soft, broad grey pool, and in several photos a small softer *secondary* spot near the floor centre (light bouncing off the wall);
   - the **rim** of the dish has a thin light lip on the *far/lower* side where the face's rounded edge into the dish catches light, and is dark/undefined on the near/upper side;
   - the transition from face to dish is a soft rounded edge, not a hard circle.
   As the knob rotates, this shading pattern stays fixed relative to the *light*, not the knob: the dark crescent is always on the upper side of the dimple wherever the dimple is. (This is the most important realism cue and the one a naïve "rotate the whole dimple graphic" gets wrong.)
6. **Grain sparkle.** Under the soft light the micro-grain produces a faint, static sparkle — many tiny points a little lighter than their neighbours, denser in the lit region. It is what makes the surface read as sandblasted plastic rather than painted.

## 3. What the app has today (`src/components/JogWheel.tsx`)

Three stacked `react-native-svg` layers: a radial-gradient body with a dark vignette, a fixed "lighting" layer of two black ellipses (soft cast shadow), and a dimple built from a radial gradient plus three ellipses (near-rim occlusion, far-wall pool, lip glint) that rotates as one graphic with the wheel. The small dial is an opener; the overlay wheel rotates on the UI thread via a Reanimated shared value. The gesture model (8 detents per turn, Rigid haptic, 300 ms minimum between steps, glide-to-finger grab, drag anywhere, tap-outside-to-close, ✕ key) is the owner's ratified interaction and should be preserved.

Gaps against the reference: no material grain; a vignette rather than a face-plus-wall-plus-edge; no rounded top edge; the dimple's shading rotates with the dimple instead of staying fixed to the light; no contact shadow on the panel; the whole thing reads as a flat illustrated disc, not a puck.

## 4. Acceptance criteria for "looks real"

- A viewer at arm's length should read a **raised matte-black puck** with a **concave dimple**, on the Dashboard's dark rack panel, without being told it is a knob.
- The dimple's shadow crescent stays on the **upper** side at every rotation angle.
- No glossy hot spot anywhere; brightness differences are broad and low-contrast; the grain is visible up close and reads as texture, not noise.
- The knob has a **visible side and a contact shadow**; it is darker than the panel around it.
- Rotation is on the UI thread, tracks the finger with no lag, and the detent haptics are unchanged. Reduced motion is respected (no decorative motion when off).
- The small dial and the big overlay wheel are the **same object at two sizes**; the grain scales with the object.
- Renders on the web preview (`localhost:8090`, CanvasKit is loaded) and on device; if CanvasKit is ever missing on web, the existing SVG stack is the fallback rather than a blank.
