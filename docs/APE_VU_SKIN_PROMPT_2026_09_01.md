# New VU skin — ChatGPT brief + import spec (2026-09-01)

## What to give ChatGPT

**Reference image to upload:**

```
C:\Users\profe\dev\ape-studio\assets\tool-strips\vu_skin_spl.png
```

That is the CURRENT skin (1586 × 992 PNG). Upload it so ChatGPT can match the
layout, then paste the prompt below.

---

## THE PROMPT (copy everything between the lines)

---

I need a photorealistic VU meter graphic for an audio app. I am attaching the
current version — match its LAYOUT and GEOMETRY exactly, but give me a different
look (see "Style direction" at the end).

**This is a background plate, not a finished meter.** My app draws the scale,
the numbers and the needle live, on top of your image, at fixed coordinates. So
the image must contain the hardware and an EMPTY dial face, and nothing else.

**Canvas — exact, non-negotiable**
- Exactly **1586 × 992 pixels**. Not a different size, not a different aspect
  ratio. Do not add padding or a border beyond the housing.
- Opaque PNG, RGB, no transparency, no drop shadow outside the canvas.
- Straight-on orthographic view. No perspective, no tilt, no 3/4 angle, no
  camera vignette, no fake photo blur, no reflections of a room.

**MUST INCLUDE (the hardware)**
1. The **meter housing** filling the whole canvas — the metal body, its outer
   edge and its four corner screws.
2. The **bezel and glass window** framing the dial.
3. The **dial face** — blank, evenly lit, warm cream/ivory, with an internal
   lamp glow. It must be CLEAN: no text, no marks, no scale.
4. The **needle pivot dome** — the small raised half-dome the needle rotates on,
   at the bottom-centre of the dial face.
5. The **"VU" wordmark**, printed on the lower-middle of the face, exactly as in
   the reference (same position, similar size).

**MUST NOT INCLUDE (my app draws all of these — if you draw them, they will be
duplicated and the image is unusable)**
- ✗ the scale arc, tick marks, or ANY numbers (no 20, 10, 7, 5, 3, 0, +3, +5)
- ✗ the red section of the scale
- ✗ the word "PEAK", or a peak/clip lamp of any kind
- ✗ the needle
- ✗ any glow, halo or bloom sitting on the face where a lamp would be
- ✗ any brand name, logo, model number or extra lettering (other than "VU")

**Exact coordinate map** (measured in the 1586 × 992 image, origin top-left).
Match these as closely as you can — my code draws at these positions:

| Element | Position |
|---|---|
| Glass/dial window | rectangle from **(250, 175)** to **(1340, 813)** — 1090 × 638, corner radius ≈ 40 |
| Needle pivot dome (centre) | **(795, 803)** — bottom-centre of the dial, its top edge just inside the glass |
| "VU" wordmark (centre) | ≈ **(795, 675)** |
| Peak-lamp area — LEAVE BLANK | a clear circle of radius ≈ 45 centred at **(1258, 236)**, plus room for the word "PEAK" immediately to its left (roughly x 1050–1210, same height) |
| Scale keep-out — MUST BE BLANK FACE | everything within **300–545 px of the dome at (795, 803)**, across the top ±55° — in practice the whole upper dial, roughly **x 330–1250, y 270–510** |

**The glass — read this carefully, it is the part that usually goes wrong**

Photographed straight-on under diffuse light, meter glass is almost INVISIBLE.
It is not shiny. Do not render it as a mirror. Four subtle cues sell it, and
nothing else:

1. **A cast shadow from the bezel onto the face.** The glass sits a few
   millimetres ABOVE the dial, so the bezel throws a soft, narrow shadow onto
   the top edge of the face, fading downward. This is the single strongest cue
   that there is a pane in front. Get this right and the rest barely matters.
2. **A broad, very low-contrast sheen** — one soft, wide gradient across the
   pane, no more than a few percent brighter than the face beneath it. Soft
   enough that its edges cannot be located.
3. **A faint edge darkening** where the pane meets the bezel all the way round,
   plus a whisper of a vignette in the corners.
4. **Barely-there imperfections** — a few dust specks, one faint smudge, some
   micro-scratches catching light at a shallow angle. Sparse. If they are
   noticeable at a glance, there are too many.

Explicitly do NOT render: a mirrored room, window or softbox reflections, a
hard white diagonal streak or light bar, a rainbow/iridescent sheen, lens
flare, bloom, or a thick glossy "wet" layer. Those are what make it look fake.
The face underneath must stay fully legible everywhere — the glass must not
wash out or obscure any part of it.

**Style direction (this is the part you may reinvent)**

<!-- OWNER: replace this paragraph with the look you want. Examples:
     "Vintage 1970s broadcast: satin champagne-gold housing, hairline brushed
      finish, warm ivory face, soft incandescent glow from below."
     "Modern studio: matte graphite housing, machined chamfer, neutral white
      face, cool even LED backlight, crisp edges."
     "Beaten road-case unit: scuffed black powder coat, worn edges showing raw
      aluminium, slightly yellowed face, uneven warm lamp."                  -->
[DESCRIBE THE NEW LOOK HERE]

Keep it photoreal and physically plausible — real materials, real lighting,
believable wear. The dial face must stay light enough that dark printed marks
will read clearly on top of it, and evenly lit enough that numbers at the far
left and far right of the arc are equally legible.

**Output:** a single 1586 × 992 PNG, no border, no caption, no mockup framing.

---

### Plan B — if the glass still will not come out right

Ask for the meter **with the glass removed** — an open-faced unit, as if the
pane had been lifted out for servicing: housing, screws, bezel, the bezel's
inner lip, and the bare dial face, with NO pane, NO sheen, NO reflections and
NO cast shadow on the face. Everything else in this brief stays the same.

We then add the glass in code, as a drawn layer over the plate. That is
usually the better outcome anyway: it is tunable in seconds, stays sharp at
every size, and can be lit to match the lamp glow instead of being frozen into
the artwork.

---

## After ChatGPT delivers — import checklist (for Claude)

1. Save to `assets/tool-strips/<name>.png`. Confirm it is **exactly 1586 × 992**
   (`py -c "import struct,io;d=io.open(P,'rb').read(33);print(struct.unpack('>II',d[16:24]))"`).
   If the aspect differs, the drawn scale will not line up — re-crop, do not
   stretch.
2. Point `VU_SKIN` at it: `src/screens/tools/SkinnedVu.tsx:26`.
3. **Re-measure the anchors against the new art** and update the constants at
   the top of `SkinnedVu.tsx` — image generators will not hit the pixel targets
   exactly:
   - `VU_CTR` — the needle pivot, must sit on the drawn dome
   - `VU_FACE` — the glass window the needle is clipped to
   - `SKIN_LAMP` — the PEAK lamp centre + radius
   - `R_LINE / R_MAJ / R_MIN / R_ZERO / R_NUM` — the scale radii
   - `R_SPL / A_SPL_CAP / R_SPL_CAP` — the dB SPL reference row (added
     2026-09-01)
4. Check on the web preview at both sizes (SPL Meter home + Full VU) that the
   arc sits inside the glass, the needle pivots on the dome and stays clipped,
   the PEAK lamp lands on blank face, and the SPL row does not collide with the
   "VU" wordmark.
5. The old skin is 2.75 MB — if the new one is much larger, downsample before
   committing (it ships in the bundle).

## Reference: what the code draws over the plate

Nothing below is in the PNG — all of it is live SVG in `SkinnedVu.tsx`:
the scale arc (black −, thick red +), major/minor ticks, the numbers, the
"PEAK" label, the lamp socket/lens/lit layers, the dB SPL reference row and its
"dB SPL (EST)" caption, and the needle.
