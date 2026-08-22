/**
 * patch_mic_cutaway.mjs — APE review fixes applied to Computer B's
 * dynamic_mic_capsule_cutaway asset (deep review 2026-08-22).
 *
 * Reads the PRISTINE originals (dynamic_mic_capsule_cutaway.svg +
 * preview_dynamic_mic_capsule_cutaway.html) and writes:
 *   mic_cutaway_wide.svg    — patched wide master (lab / desktop view)
 *   mic_cutaway_phone.svg   — portrait crop for phone (labels >= 12px eff.)
 *   preview_wide.html       — original preview harness + patched wide SVG
 *   preview_phone.html      — original preview harness + phone SVG
 *
 * Fixes encoded here (see APE_MIC_CUTAWAY_REVIEW_2026_08_21.md):
 *   MUST-1  on-screen honesty caveat (mass-controlled cardioid + load note)
 *   MUST-2  phone-oriented variant: portrait crop, heavier hatch,
 *           labels render >= 12px at phone widths
 *   SHOULD-3 right-side leaders shortened to elbow at the capsule edge
 *           (no more 140-unit runs across the wavefield); pole-region
 *           trio dots fanned to their true targets (gap slot y228-236,
 *           phase-shift felt slot y244-252 per MOTION §1 r64→72,
 *           pole-plate steel below it)
 *   SHOULD-4 diaphragm PET tone cooled to grey-beige so command-amber
 *           keeps sole ownership of "energy" (current/velocity/glow)
 *   NIT     dead gradients gHum/gAOring removed; textLength squeeze gone
 *           (labels re-laid-out at natural widths, per RN-port review)
 *
 * Rerunnable: originals are never modified. If Computer B regenerates the
 * asset upstream, re-run this (assertions fail loudly if the source drifted).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(DIR, f), 'utf8');
const write = (f, s) => { writeFileSync(join(DIR, f), s); console.log(`wrote ${f} (${s.length} bytes)`); };

/** Replace with a required match count — refuses to drift silently. */
function sub(src, from, to, expect = 1, label = from instanceof RegExp ? String(from) : from) {
  let n = 0;
  const out = src.replaceAll(from, (...m) => { n++; return typeof to === 'function' ? to(...m) : to; });
  if (n !== expect) throw new Error(`expected ${expect} match(es) for ${label}, got ${n}`);
  return out;
}

let svg = read('dynamic_mic_capsule_cutaway.svg');

/* ---------- NIT: dead defs ---------- */
svg = sub(svg, /<linearGradient id="gHum"[^\n]*\n/g, '', 1, 'gHum def');
svg = sub(svg, /<linearGradient id="gAOring"[^\n]*\n/g, '', 1, 'gAOring def');

/* ---------- SHOULD-4: cool the diaphragm PET tone ---------- */
// gDia stops (dome + roll + film edge)
svg = sub(svg, '#e8d9b8', '#e3decf', 1);
svg = sub(svg, '#c7a96c', '#ada584', 1);
svg = sub(svg, '#7a5a2c', '#5f5942', 1);
// gDiaIn (dome interior shadow) — was warm brown, now near-neutral
svg = sub(svg, '#1a1712', '#151516', 1);
svg = sub(svg, '#2a2418', '#232321', 1);
svg = sub(svg, '#4a3d22', '#3c3a30', 1);
// film/roll outline + sheen highlights + clamp wedges
svg = sub(svg, '#5a4520', '#4b4738', 3, 'film stroke');
svg = sub(svg, '#fff3d8', '#f3f1e7', 4, 'film sheen');
svg = sub(svg, '#2a2218', '#232220', 1, 'clamp wedge');

/* ---------- MUST-1 + SHOULD-3: labels rebuilt + on-screen caveat ---------- */
// Shared bits of the house label style.
const TXT = 'fill="#a6a6ad" font-family="Oswald" font-size="9.5" letter-spacing="0.6" font-weight="500" paint-order="stroke" stroke="#0c0c0c" stroke-width="2.6" stroke-opacity="0.7"';
const lead = (pts) =>
  `<polyline points="${pts}" fill="none" stroke="#0c0c0c" stroke-opacity="0.45" stroke-width="1.4" stroke-linejoin="round"/>\n` +
  `<polyline points="${pts}" fill="none" stroke="#8a8b93" stroke-opacity="0.7" stroke-width="0.6" stroke-linejoin="round"/>`;
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#a6a6ad" stroke="#0c0c0c" stroke-width="0.4" stroke-opacity="0.7"/>`;
const lbl = (id, pts, dx, dy, tx, ty, anchor, text) =>
  `<g id="${id}">\n${lead(pts)}\n${dot(dx, dy)}\n<text x="${tx}" y="${ty}" text-anchor="${anchor}" ${TXT}>${text}</text>\n</g>`;

const labels = `<g id="labels" display="none">
${lbl('lbl_outputTerminals', '55,30 55,101.5', 55, 101.5, 55, 26, 'middle', 'OUTPUT LUGS')}
${lbl('lbl_rearPort', '133,30 133,58 106,58 106,68.5', 106, 68.5, 133, 26, 'middle', 'REAR PORT + FELT')}
${lbl('lbl_leadWires', '96,52 96,118.76 101.69,118.76', 101.69, 118.76, 96, 48, 'middle', 'LEAD WIRES')}
${lbl('lbl_frontScreen', '188,100 168.5,100', 167, 100, 190, 102.5, 'start', 'FRONT SCREEN')}
${lbl('lbl_roll', '188,113 157.5,113', 156, 113, 190, 115.5, 'start', 'COMPLIANT ROLL')}
${lbl('lbl_diaphragm', '188,150 158,150', 156.75, 150, 190, 152.5, 'start', 'DIAPHRAGM')}
${lbl('lbl_polePiece', '188,200 147.5,200', 146, 200, 190, 202.5, 'start', 'POLE PIECE')}
${lbl('lbl_magneticGap', '188,234 152,234 142,232.4', 140.5, 232, 190, 236.5, 'start', 'MAGNETIC GAP')}
${lbl('lbl_phaseShift', '188,246 152,246 142,247.7', 140.5, 248, 190, 248.5, 'start', 'PHASE-SHIFT PASSAGE')}
${lbl('lbl_polePlate', '188,258 152,258 142,265.3', 140.5, 266, 190, 260.5, 'start', 'POLE PLATE')}
${lbl('lbl_humbuckingCoil', '65,308 65,296 51,296 51,223.5', 51, 223.5, 65, 318, 'middle', 'HUMBUCKING COIL')}
${lbl('lbl_voiceCoil', '141,308 141,236 133,232.6', 133, 232, 141, 318, 'middle', 'VOICE COIL')}
${lbl('lbl_housing', '170,330 170,293.5', 170, 291.8, 170, 340, 'middle', 'HOUSING')}
${lbl('lbl_backPlate', '58,330 58,240 66,240', 66, 240, 58, 340, 'middle', 'BACK PLATE')}
${lbl('lbl_magnet', '104,330 104,212', 104, 212, 104, 340, 'middle', 'MAGNET')}
</g>
<g id="caveat">
<line x1="36" y1="348" x2="444" y2="348" stroke="#8a8b93" stroke-opacity="0.22" stroke-width="0.5"/>
<text x="36" y="358.5" ${CAVEAT_TXT()}><tspan fill="#a6a6ad">SIMPLIFIED MODEL</tspan> — motion drawn as v ∝ p; travel</text>
<text x="36" y="369" ${CAVEAT_TXT()}>exaggerated ~1,000×; output assumes a connected load.</text>
<text x="36" y="379.5" ${CAVEAT_TXT()}>A real cardioid is mass-controlled: diaphragm displacement</text>
<text x="36" y="390" ${CAVEAT_TXT()}>runs about 180° behind the front-face pressure.</text>
</g>
</svg>`;
function CAVEAT_TXT() {
  return 'fill="#8a8b93" font-family="Oswald" font-size="8.8" letter-spacing="0.3" font-weight="500"';
}
svg = sub(svg, /<g id="labels"[\s\S]*<\/g>\n<\/svg>\n?/g, labels + '\n', 1, 'labels block');

/* ---------- MUST-1: taller canvas for the caveat strip ---------- */
svg = sub(
  svg,
  'viewBox="0 0 480 360" width="960" height="720"',
  'viewBox="0 0 480 398" width="960" height="796"',
  1,
);

write('mic_cutaway_wide.svg', svg);

/* ---------- MUST-2: phone variant — portrait crop + heavier hatch ---------- */
let phone = svg;
phone = sub(
  phone,
  'viewBox="0 0 480 398" width="960" height="796"',
  'viewBox="24 20 268 378" width="536" height="756"',
  1,
);
// hatch weights/opacities up so material coding survives phone rendering
phone = sub(phone, 'stroke-width="0.42"', 'stroke-width="0.68"', 11, 'hatch w 0.42');
phone = sub(phone, 'stroke-width="0.35"', 'stroke-width="0.55"', 6, 'hatch w 0.35');
phone = sub(phone, 'stroke-opacity="0.42"', 'stroke-opacity="0.52"', 7, 'hatch o 0.42');
phone = sub(phone, 'stroke-opacity="0.34"', 'stroke-opacity="0.44"', 4, 'hatch o 0.34');
phone = sub(phone, 'stroke-opacity="0.16"', 'stroke-opacity="0.26"', 1, 'magnet dotted');
phone = sub(phone, 'stroke-opacity="0.35"', 'stroke-opacity="0.45"', 5, 'felt hatch o');
write('mic_cutaway_phone.svg', phone);

/* ---------- previews: splice patched SVGs into the original harness ---------- */
const html = read('preview_dynamic_mic_capsule_cutaway.html');
const asInline = (s) =>
  s.replace(
    /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="([^"]+)" width="[^"]+" height="[^"]+">/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="$1" id="drv">',
  );
function splice(harness, inlineSvg, extraCss = '') {
  let out = sub(harness, /<svg xmlns[\s\S]*?<\/svg>/g, () => asInline(inlineSvg).trimEnd(), 1, 'inline svg');
  if (extraCss) out = sub(out, '</style>', extraCss + '\n</style>', 1, 'extra css');
  return out;
}
write('preview_wide.html', splice(html, svg));
write(
  'preview_phone.html',
  splice(html, phone, '#stage svg{width:auto;height:calc(100vh - 24px);max-width:100%}'),
);

/* ============================================================================
 * RN LAB EXPORT — emit the artwork as parse-once SvgXml layers.
 * The lab component (MicCutaway.tsx) renders a static base + three signal
 * overlays and animates them at the GROUP level (opacity/transform) with one
 * Reanimated clock. This keeps Computer B's exact geometry, does ZERO per-frame
 * SVG parsing, and needs no per-element transcription.
 * ========================================================================== */

/** Balanced <g id="X">…</g> extraction (no DOM). Returns {full, inner}. */
function extractGroup(src, id) {
  const open = src.indexOf(`<g id="${id}"`);
  if (open < 0) throw new Error(`group #${id} not found`);
  const innerStart = src.indexOf('>', open) + 1;
  let depth = 1, i = innerStart;
  while (depth > 0) {
    const ng = src.indexOf('<g', i);
    const cg = src.indexOf('</g>', i);
    if (cg < 0) throw new Error(`unbalanced #${id}`);
    if (ng >= 0 && ng < cg) { depth++; i = ng + 2; }
    else { depth--; i = cg + 4; }
  }
  return { full: src.slice(open, i), inner: src.slice(innerStart, i - 4) };
}

// Lab crop: portrait, trims the empty right third of the wavefield while keeping
// EVERY label and the caveat with margin (top row sits ~y14, bottom labels ~y343,
// caveat to ~y392, right label reaches x~285). Bigger labels than the wide master
// at a phone card width, with nothing clipped (review MUST-FIX #2). All layers
// share this exact viewBox so the overlays register on the base pixel-for-pixel.
const VIEWBOX = '2 8 300 388';
const ASPECT = (300 / 388).toFixed(4);
const wrap = (frag) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}">${frag}</svg>`;

const gCurrent = extractGroup(svg, 'inducedCurrent');
const gCoil = extractGroup(svg, 'coilMotion');
const gField = extractGroup(svg, 'soundField');
const gGlow = extractGroup(gCoil.full, 'glowHalo');

// Static base = full art minus the three animated groups; labels ON; cropped.
let base = svg
  .replace(gCurrent.full, '')
  .replace(gCoil.full, '')
  .replace(gField.full, '');
base = sub(base, '<g id="labels" display="none">', '<g id="labels">', 1, 'labels on');
base = sub(base, 'viewBox="0 0 480 398" width="960" height="796"', `viewBox="${VIEWBOX}"`, 1, 'base crop');

// Current overlay, positive half-cycle = source polarity (⊗ top entering, ⊙ bottom).
// The whole group is opacity 0.05 at rest in the source; force it lit (the RN
// wrapper drives the pulse).
const currentPos = sub(gCurrent.full, 'opacity="0.05"', 'opacity="1"', 1, 'current opacity');
// Negative half-cycle = current reversed → swap every ⊗/⊙ marker's visibility.
let currentNeg = currentPos
  .replace('<g id="cfDirTopX">', '<g id="cfDirTopX" display="none">')
  .replace('<circle id="cfDirTopO" display="none"', '<circle id="cfDirTopO"')
  .replace('<g id="cfDirBotX" display="none">', '<g id="cfDirBotX">')
  .replace('<circle id="cfDirBotO"', '<circle id="cfDirBotO" display="none"');
if (currentNeg === currentPos) throw new Error('⊗/⊙ polarity swap matched nothing');

const ts = `/**
 * micCutawayAsset.ts — GENERATED by docs/art/mic-cutaway/patch_mic_cutaway.mjs.
 * Do not edit by hand; re-run the patch script to regenerate.
 *
 * Computer B's reviewed dynamic-mic capsule cutaway (APE fixes 2026-08-22),
 * split into parse-once SvgXml layers for the Microphone Principles lab. The
 * base holds all static art + labels + the honesty caveat; the three signal
 * layers are animated at the group level (see MicCutaway.tsx).
 */
export const MIC_VIEWBOX = '${VIEWBOX}';
export const MIC_ASPECT = ${ASPECT}; // width / height (portrait phone crop)

export const MIC_BASE_XML = ${JSON.stringify(base)};
export const MIC_CURRENT_POS_XML = ${JSON.stringify(wrap(currentPos))};
export const MIC_CURRENT_NEG_XML = ${JSON.stringify(wrap(currentNeg))};
export const MIC_GLOW_XML = ${JSON.stringify(wrap(sub(gGlow.full, 'opacity="0"', 'opacity="1"', 1, 'glow opacity')))};
export const MIC_WAVE_XML = ${JSON.stringify(wrap(gField.inner))};
`;
const OUT = join(DIR, '..', '..', '..', 'src', 'screens', 'lab', 'micspeaker', 'micCutawayAsset.ts');
writeFileSync(OUT, ts);
console.log(`wrote src/screens/lab/micspeaker/micCutawayAsset.ts (${ts.length} bytes)`);

console.log('done.');
