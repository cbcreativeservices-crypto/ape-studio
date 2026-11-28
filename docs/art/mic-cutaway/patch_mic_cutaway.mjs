/**
 * patch_mic_cutaway.mjs — APE review fixes applied to Computer B's
 * dynamic_mic_capsule_cutaway asset (deep review 2026-08-22).
 *
 * Reads the PRISTINE originals (dynamic_mic_capsule_cutaway.svg +
 * preview_dynamic_mic_capsule_cutaway.html) and writes:
 *   src/screens/lab/micspeaker/micCutawayAsset.ts — the lab's layers (always)
 * and, only with `node patch_mic_cutaway.mjs --docs`, the review files:
 *   mic_cutaway_wide.svg    — patched wide master (lab / desktop view)
 *   mic_cutaway_phone.svg   — portrait crop for phone (labels >= 12px eff.)
 *   preview_wide.html       — original preview harness + patched wide SVG
 *   preview_phone.html      — original preview harness + phone SVG
 * (The lab-only coil-motion changes of 2026-11-22 live in the RN LAB EXPORT
 * section and never touch those four.)
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
// CRLF → LF on read: a Windows checkout (core.autocrlf) hands the script CRLF
// files and every `\n`-anchored match below would silently miss (2026-11-22:
// the labels-block match failed exactly this way).
const read = (f) => readFileSync(join(DIR, f), 'utf8').replace(/\r\n/g, '\n');
// The four DOCS outputs (wide/phone SVG + previews) are rewritten only with
// `--docs`. A plain run regenerates the lab asset alone, so a lab-only change
// does not churn the review harness files (owner 2026-11-22 coil-motion pass).
const DOCS = process.argv.includes('--docs');
const write = (f, s) => {
  if (!DOCS) { console.log(`skipped ${f} (pass --docs to rewrite the docs outputs)`); return; }
  writeFileSync(join(DIR, f), s); console.log(`wrote ${f} (${s.length} bytes)`);
};

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
// The caveat carries the copy that shipped by hand-edits to the generated asset
// (fact audit R3 c8aab4ba; owner-approved held lines D59 c32f34e7, 2026-11-11),
// folded back here so a regeneration can never revert it.
// Shared bits of the house label style.
const TXT = 'fill="#a6a6ad" font-family="Oswald_500Medium" font-size="9.5" letter-spacing="0.6" font-weight="500" paint-order="stroke" stroke="#0c0c0c" stroke-width="2.6" stroke-opacity="0.7"';
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
<text x="36" y="358.5" ${CAVEAT_TXT()}><tspan fill="#a6a6ad">SIMPLIFIED MODEL</tspan> — coil speed follows the sound; travel</text>
<text x="36" y="369" ${CAVEAT_TXT()}>exaggerated ~1,000×; output assumes a connected load.</text>
<text x="36" y="379.5" ${CAVEAT_TXT()}>In a real cardioid, the diaphragm’s position runs</text>
<text x="36" y="390" ${CAVEAT_TXT()}>about 180° behind the force pushing it.</text>
</g>
</svg>`;
function CAVEAT_TXT() {
  return 'fill="#8a8b93" font-family="Oswald_500Medium" font-size="8.8" letter-spacing="0.3" font-weight="500"';
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
 * The lab component (MicCutaway.tsx) stacks static layers and small moving
 * layers and animates them at the VIEW level (translate / rotate / scaleX /
 * opacity on Animated.Views) from ONE Reanimated phase clock. This keeps
 * Computer B's geometry, does ZERO per-frame SVG parsing or re-rendering, and
 * needs no per-element transcription — the shape the review asked for after
 * the dev-client CPU-runaway watchdog scare (APE_CHANGES_2026_08_22.md).
 *
 * COIL MOTION (owner 2026-11-22, on the iPhone screenshot: "needs animation
 * showing coil moving around magnet"). Until now the export dropped
 * #coilMotion and kept the coil and diaphragm static, so nothing on screen
 * moved but the waves and the amber. The moving assembly now travels along the
 * capsule axis exactly as MOTION_dynamic_mic_capsule_cutaway.md §1–2 draws it:
 *   dx = X·cos φ  (outward +x), coil velocity / EMF / current ∝ sin φ = p.
 * What moves, and how, with view-level transforms only:
 *   • dome + coil seat + voice coil (+ its lead-outs)  → translateX(dx)
 *   • the compliant roll (upper / lower half-roll)     → a small ROTATION about
 *     its fixed outer attach, so the inner edge follows the dome (dx) and the
 *     outer edge stays clamped: no tear at either end. A rotation, not a
 *     shear: Android Views cannot skew.
 *   • the flexing part of each lead wire               → scaleX about x = 100,
 *     where the lead is dressed to the cavity; the run to the back-plate hole
 *     stays put. Joint: fixed shadow < moving shadow < fixed copper < moving
 *     copper, so neither half's dark outline cuts the other's copper.
 *   • amber on the coil (cfMoving) + the glow ride with the coil; amber on the
 *     leads scales with its lead; amber on the fixed wiring does not move.
 *   • the pressure wash at the dome face (sfNear) rides with the dome.
 *   • the sound field marches ONE wavelength (34) PER ELECTRICAL PERIOD, so a
 *     compression meets the front screen exactly when the coil passes the
 *     middle at full speed (§2 #sfC formula) — one cause-and-effect chain.
 * X = 4 units: the most the art allows. At −4 the dome's chord meets the pole
 * piece face (x 146) and the film clears the pole corner by 0.38; at +4 the
 * dome apex is 2 short of the front screen and the coil still fills 11 of the
 * gap's 12. The lead-outs were re-routed to leave the coil FLAT inside the gap
 * clearance, so at +4 no lead cuts the pole plate (the drawn diagonal lead B
 * would have, under any transform). Asserted below; re-checked in
 * test/micCutawayCoilMotion_20261122.test.ts.
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
/** One self-closing element by id (no DOM). */
function el(src, id) {
  const m = src.match(new RegExp(`<(\\w+) id="${id}"[^>]*/>`));
  if (!m) throw new Error(`element #${id} not found`);
  return m[0];
}

// Lab crop: portrait, trims the empty right third of the wavefield while keeping
// EVERY label and the caveat with margin (top row sits ~y14, bottom labels ~y343,
// caveat to ~y392, right label reaches x~285). Bigger labels than the wide master
// at a phone card width, with nothing clipped (review MUST-FIX #2). Every layer
// box below is in THIS coordinate system, so the layers register on the base.
const VIEWBOX_BOX = [2, 8, 300, 388];
const VIEWBOX = VIEWBOX_BOX.join(' ');
const ASPECT = (300 / 388).toFixed(4);
// Each layer is an INDEPENDENT <SvgXml> document at runtime, so it must carry
// the paint servers it references (gDia, gLead, gTurn, gGlow, gWave, gNearC…
// all live in the base's <defs>). Without them each url(#…) resolves to nothing
// and react-native-svg fills the shape OPAQUE BLACK (2026-09-14 device pass: a
// swinging black smear over the diaphragm, because the wave layer translates).
// With seventeen layers, each now carries exactly the base <defs> entries its
// own fragment references (no gradient here references another), and the
// build fails if a reference has no definition — so no layer can ever paint a
// black smear again, and no layer re-parses gradients it never uses.
const sharedDefs = (svg.match(/<defs>([\s\S]*?)<\/defs>/) || ['', ''])[1];
const DEF = Object.fromEntries(
  [...sharedDefs.matchAll(/<(linearGradient|radialGradient)\b[^>]*\bid="([^"]+)"[\s\S]*?<\/\1>/g)].map((m) => [m[2], m[0]]),
);
const wrap = (frag, box) => {
  const ids = [...new Set([...frag.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]))];
  const missing = ids.filter((id) => !DEF[id]);
  if (missing.length) throw new Error(`layer references undefined paint: ${missing.join(', ')}`);
  const defs = ids.length ? `<defs>${ids.map((id) => DEF[id]).join('')}</defs>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}">${defs}${frag}</svg>`;
};

/* ---------- motion model (MOTION §1–2; constants shipped to the component) ---------- */
const TRAVEL = 4; // X, viewBox units (≈ ±4.5 pt on a 340-pt card)
const ROLL_UPPER_PIVOT = [150, 98.5]; // the roll's clamped outer attach (r 82)
const ROLL_LOWER_PIVOT = [150, 261.5];
const ROLL_ARM = 29.5; // pivot → the roll's inner attach on the dome (r 52)
const LEAD_PIVOT_X = 100; // where each lead is dressed to the cavity
const WAVE_STEP = 34; // wavefront spacing = one wavelength per period
const WAVE_CLIP_X = 168; // wavefronts stop at the front screen's outer face
const NEAR_CLIP_X = 166; // the dome-face pressure wash stops at its inner face

/* ---------- geometry helpers ---------- */
const ptsOf = (tag) => tag.match(/points="([^"]+)"/)[1].trim().split(/\s+/).map((p) => p.split(',').map(Number));
const r2 = (v) => Math.round(v * 100) / 100;
const fmtPts = (pts) => pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
const setPts = (tag, pts) => sub(tag, /points="[^"]+"/g, `points="${fmtPts(pts)}"`, 1, 'points attr');
const setId = (tag, id) => sub(tag, /id="[^"]+"/g, `id="${id}"`, 1, 'id attr');
const setAttr = (tag, name, val) => sub(tag, new RegExp(`${name}="[^"]*"`, 'g'), `${name}="${val}"`, 1, `${name} attr`);
const at = (P, x, y) => {
  const i = P.findIndex(([px, py]) => px === x && py === y);
  if (i < 0) throw new Error(`lead point ${x},${y} not found (source drifted)`);
  return i;
};
const unit = ([x1, y1], [x2, y2]) => { const l = Math.hypot(x2 - x1, y2 - y1); return [(x2 - x1) / l, (y2 - y1) / l]; };
function bezier(p0, p1, p2, p3, n) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const b = (k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k];
    out.push([b(0), b(1)]);
  }
  return out;
}
const polyLen = (P) => P.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - P[i][0], p[1] - P[i][1]), 0);
/** Length of an M/L/C path (the only commands the current overlay uses). */
function pathLen(d) {
  const tok = d.match(/[MLC]|-?\d*\.?\d+/g);
  let i = 0, cur = [0, 0], len = 0, cmd = '';
  const num = () => Number(tok[i++]);
  while (i < tok.length) {
    if (/[MLC]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'M') cur = [num(), num()];
    else if (cmd === 'L') { const p = [num(), num()]; len += Math.hypot(p[0] - cur[0], p[1] - cur[1]); cur = p; }
    else if (cmd === 'C') {
      const p1 = [num(), num()], p2 = [num(), num()], p3 = [num(), num()];
      len += polyLen([cur, ...bezier(cur, p1, p2, p3, 64)]);
      cur = p3;
    } else throw new Error(`path command ${cmd} unsupported`);
  }
  return len;
}
const elLen = (tag) => (tag.startsWith('<path') ? pathLen(tag.match(/ d="([^"]+)"/)[1]) : polyLen(ptsOf(tag)));

/* ---------- source groups / elements ---------- */
const gAxis = extractGroup(svg, 'axis');
const gMotor = extractGroup(svg, 'motorStatic');
const gHousing = extractGroup(svg, 'housing');
const gDia = extractGroup(svg, 'diaphragm');
const gVoiceCoil = extractGroup(svg, 'voiceCoil');
const gHum = extractGroup(svg, 'humbuckingCoil');
const gTerm = extractGroup(svg, 'terminals');
const gField = extractGroup(svg, 'magneticField');
const gCurrent = extractGroup(svg, 'inducedCurrent');
const gCfMoving = extractGroup(gCurrent.full, 'cfMoving');
const gGlow = extractGroup(extractGroup(svg, 'coilMotion').full, 'glowHalo');
const gSound = extractGroup(svg, 'soundField');
const gNear = extractGroup(gSound.full, 'sfNear');
const gRear = extractGroup(svg, 'rearPath');
const gLabels = extractGroup(svg, 'labels');
const gCaveat = extractGroup(svg, 'caveat');
const flanges = svg.match(/<rect x="149\.6" y="(?:86|262)"[^>]*\/>/g) || [];
if (flanges.length !== 2) throw new Error(`expected 2 rim flanges, got ${flanges.length}`);

/* ---------- lead wires: re-routed lead-outs, split at the dressing point ---------- */
const tLeadASh = el(svg, 'leadASh'), tLeadA = el(svg, 'leadA');
const tLeadBSh = el(svg, 'leadBSh'), tLeadB = el(svg, 'leadB');
const A0 = ptsOf(tLeadA), B0 = ptsOf(tLeadB);
if (String(A0[0]) !== '131,126.2' || String(B0[0]) !== '134,126.2') throw new Error('lead-out points drifted');
if (fmtPts(ptsOf(tLeadASh)) !== fmtPts(A0) || fmtPts(ptsOf(tLeadBSh)) !== fmtPts(B0)) throw new Error('lead shadows drifted');
// Lead A leaves the coil's rear end FLAT along y 126.2 (inside the gap
// clearance), then climbs to rejoin Computer B's slack loop at (121.63,117.46).
const pivA = at(A0, LEAD_PIVOT_X, 120), joinA = at(A0, 121.63, 117.46);
const tA = unit(A0[joinA], A0[joinA + 1]);
const A_move = [
  [131, 126.2], [129, 126.2], [127, 126.2],
  ...bezier([127, 126.2], [124.8, 126.2], [A0[joinA][0] - 2.2 * tA[0], A0[joinA][1] - 2.2 * tA[1]], A0[joinA], 6),
  ...A0.slice(joinA + 1, pivA + 1),
];
const A_fixed = A0.slice(pivA);
// Lead B steps up off the coil top and runs flat along y 124.9 — above lead A,
// under the pole plate's face (y 124) — then climbs to rejoin at (123.85,114.47).
const pivB = at(B0, LEAD_PIVOT_X, 110), joinB = at(B0, 123.85, 114.47);
const tB = unit(B0[joinB], B0[joinB + 1]);
const B_move = [
  [134, 126.2], [133.55, 125.55], [133, 125.08], [132.4, 124.9], [130.8, 124.9], [129.2, 124.9],
  ...bezier([129.2, 124.9], [127, 124.9], [B0[joinB][0] - 2.4 * tB[0], B0[joinB][1] - 2.4 * tB[1]], B0[joinB], 6),
  ...B0.slice(joinB + 1, pivB + 1),
];
const B_fixed = B0.slice(pivB);
const LEAD_A_SPAN = A_move[0][0] - LEAD_PIVOT_X; // 31
const LEAD_B_SPAN = B_move[0][0] - LEAD_PIVOT_X; // 34
const leadEl = (tag, id, pts) => setPts(setId(tag, id), pts);

// Fail loudly if a lead would cut steel anywhere in the travel. Air the leads
// may use: the rear cavity (x 72–134, y 84–132) and the upper gap slot
// (x 134–146, y 124–132), kept 0.8 (the dark outline's half-width) off steel.
function leadClear(P, span, dx) {
  const s = (span + dx) / span;
  for (let i = 1; i < P.length; i++) {
    for (let t = 0; t <= 1; t += 0.05) {
      const x = LEAD_PIVOT_X + (P[i - 1][0] + (P[i][0] - P[i - 1][0]) * t - LEAD_PIVOT_X) * s;
      const y = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t;
      const inCavity = x >= 72.8 && x <= 133.2 && y >= 84.8 && y <= 131.2;
      const inGapBand = x >= 72.8 && x <= 145.2 && y >= 124.8 && y <= 131.2;
      if (!inCavity && !inGapBand) return `(${r2(x)},${r2(y)}) at dx=${dx}`;
    }
  }
  return null;
}
for (const dx of [-TRAVEL, -TRAVEL / 2, 0, TRAVEL / 2, TRAVEL]) {
  const bad = leadClear(A_move, LEAD_A_SPAN, dx) || leadClear(B_move, LEAD_B_SPAN, dx);
  if (bad) throw new Error(`a lead wire would cut steel: ${bad}`);
}

/* ---------- induced current: re-flow the dash chain over the new lead lengths ---------- */
// MOTION §2: offset_j = 16.67 + k_j, k_j = (k_{j−1} + L_{j−1}) mod 18, in this
// order. Recomputed (not copied) so the dashes stay continuous across every
// joint, including the new split at each lead's dressing point.
const CHAIN = ['cfWireB', 'cfLeadB', 'cfCoilTop', 'cfHookFront1', 'cfHookFront2', 'cfCoilBot', 'cfHookBack1', 'cfHookBack2', 'cfLeadA', 'cfHumIn', 'cfHum', 'cfHumOut'];
const OFF0 = 16.67;
const mod18 = (v) => ((v % 18) + 18) % 18;
const kChain = (lens) => { const k = [0]; for (let j = 1; j < lens.length; j++) k.push(mod18(k[j - 1] + lens[j - 1])); return k; };
const srcTags = Object.fromEntries(CHAIN.map((id) => [id, el(gCurrent.full, id)]));
{ // the method must reproduce Computer B's own offsets on his geometry
  const k = kChain(CHAIN.map((id) => elLen(srcTags[id])));
  CHAIN.forEach((id, j) => {
    const have = Number(srcTags[id].match(/stroke-dashoffset="([^"]+)"/)[1]);
    if (Math.abs(mod18(have - OFF0 - k[j] + 9) - 9) > 0.06) throw new Error(`dash chain method drifted at ${id}`);
  });
}
const rev = (P) => [...P].reverse();
const cfLeadB_fixedPts = rev(B_fixed), cfLeadB_movePts = rev(B_move); // 72 → 100 → coil
const cfLeadA_movePts = A_move, cfLeadA_fixedPts = A_fixed; // coil → 100 → 72
const lens = CHAIN.map((id) =>
  id === 'cfLeadB' ? polyLen(cfLeadB_fixedPts) + polyLen(cfLeadB_movePts)
  : id === 'cfLeadA' ? polyLen(cfLeadA_movePts) + polyLen(cfLeadA_fixedPts)
  : elLen(srcTags[id]));
const K = Object.fromEntries(CHAIN.map((id, j) => [id, kChain(lens)[j]]));
const off = (k) => r2(OFF0 + mod18(k));
const cf = (id) => setAttr(srcTags[id], 'stroke-dashoffset', off(K[id]));
const cfLeadB_fixed = setAttr(leadEl(srcTags.cfLeadB, 'cfLeadB_fixed', cfLeadB_fixedPts), 'stroke-dashoffset', off(K.cfLeadB));
const cfLeadB_move = setAttr(leadEl(srcTags.cfLeadB, 'cfLeadB_move', cfLeadB_movePts), 'stroke-dashoffset', off(K.cfLeadB + polyLen(cfLeadB_fixedPts)));
const cfLeadA_move = setAttr(leadEl(srcTags.cfLeadA, 'cfLeadA_move', cfLeadA_movePts), 'stroke-dashoffset', off(K.cfLeadA));
const cfLeadA_fixed = setAttr(leadEl(srcTags.cfLeadA, 'cfLeadA_fixed', cfLeadA_fixedPts), 'stroke-dashoffset', off(K.cfLeadA + polyLen(cfLeadA_movePts)));

// Current ON the coil (rides with it). Positive half-cycle = source polarity
// (⊗ top entering, ⊙ bottom); negative = current reversed → swap the markers.
let cfMoving = gCfMoving.full;
for (const id of ['cfCoilTop', 'cfHookFront1', 'cfHookFront2', 'cfCoilBot', 'cfHookBack1', 'cfHookBack2']) {
  cfMoving = sub(cfMoving, srcTags[id], cf(id), 1, `${id} offset`);
}
const currentPos = cfMoving;
const currentNeg = currentPos
  .replace('<g id="cfDirTopX">', '<g id="cfDirTopX" display="none">')
  .replace('<circle id="cfDirTopO" display="none"', '<circle id="cfDirTopO"')
  .replace('<g id="cfDirBotX" display="none">', '<g id="cfDirBotX">')
  .replace('<circle id="cfDirBotO"', '<circle id="cfDirBotO" display="none"');
if (currentNeg === currentPos) throw new Error('⊗/⊙ polarity swap matched nothing');

/* ---------- labels: dots on moving parts ride with them ---------- */
// MOTION §2 last row: the DIAPHRAGM and COMPLIANT ROLL dots follow their part;
// their leaders are horizontal, along the motion, so each dot slides along its
// own leader. The VOICE COIL dot is re-aimed to x 136.5 — a spot the coil
// covers through the WHOLE travel (its span is 131+dx … 150+dx).
const rollDot = dot(156, 113), diaDot = dot(156.75, 150);
let labelsOn = sub(gLabels.full, '<g id="labels" display="none">', '<g id="labels">', 1, 'labels on');
labelsOn = sub(labelsOn, rollDot, '', 1, 'roll dot');
labelsOn = sub(labelsOn, diaDot, '', 1, 'diaphragm dot');
labelsOn = sub(labelsOn, '141,308 141,236 133,232.6', '141,308 141,236 137,232.6', 2, 'voice coil leader');
labelsOn = sub(labelsOn, dot(133, 232), dot(136.5, 232), 1, 'voice coil dot');

/* ---------- layer table (stacking order = the source's draw order) ---------- */
// Boxes are [x, y, w, h] in the lab viewBox. Rotated / scaled layers are boxed
// SYMMETRIC about their pivot, so the pivot is the view's centre — the only
// transform origin React Native guarantees on both platforms.
const box = { full: VIEWBOX_BOX };
const pivotBox = ([px, py], hw, hh) => [px - hw, py - hh, 2 * hw, 2 * hh];
const leadBox = (P) => {
  const hw = Math.ceil(Math.max(...P.map(([x]) => Math.abs(x - LEAD_PIVOT_X))) + 1.5);
  const y0 = Math.floor(Math.min(...P.map(([, y]) => y)) - 1.5), y1 = Math.ceil(Math.max(...P.map(([, y]) => y)) + 1.5);
  return [LEAD_PIVOT_X - hw, y0, 2 * hw, y1 - y0];
};
const MOVE_BOX = [124, 122, 40, 116]; // dome (apex ~160.2) + coil (from 130.2) + glow (126.5–154.5)
const L = {
  // 1 · motor, housing, rim flanges, the FIXED leads' dark outline
  under: [box.full, gAxis.full + gMotor.full + gHousing.full + flanges.join('') + leadEl(tLeadASh, 'leadASh_fixed', A_fixed) + leadEl(tLeadBSh, 'leadBSh_fixed', B_fixed)],
  // 2 · compliant roll halves (rotate about the clamped outer attach)
  rollUpper: [pivotBox(ROLL_UPPER_PIVOT, 10, 31), el(svg, 'rollUpper') + el(svg, 'rollUpperHl') + rollDot],
  rollLower: [pivotBox(ROLL_LOWER_PIVOT, 10, 31), el(svg, 'rollLower') + el(svg, 'rollLowerHl')],
  // 3 · the moving assembly: dome + coil seat + voice coil + lead-outs
  moving: [MOVE_BOX, gDia.full + gVoiceCoil.full + diaDot],
  // 4 · flexing lead runs (scaleX about x = 100)
  leadA: [leadBox(A_move), leadEl(tLeadASh, 'leadASh_move', A_move) + leadEl(tLeadA, 'leadA_move', A_move)],
  leadB: [leadBox(B_move), leadEl(tLeadBSh, 'leadBSh_move', B_move) + leadEl(tLeadB, 'leadB_move', B_move)],
  // 5 · fixed lead copper (over the moving outline at the joint), humbucker, lugs, field
  overA: [[44, 75, 104, 210], leadEl(tLeadA, 'leadA_fixed', A_fixed) + leadEl(tLeadB, 'leadB_fixed', B_fixed) + gHum.full + gTerm.full + gField.full],
  // 6 · induced current — fixed wiring / each lead / on the coil
  currentStatic: [[45, 101, 57, 52], cf('cfWireB') + cfLeadB_fixed + cfLeadA_fixed + cf('cfHumIn') + cf('cfHum') + cf('cfHumOut')],
  currentLeadA: [leadBox(A_move), cfLeadA_move],
  currentLeadB: [leadBox(B_move), cfLeadB_move],
  currentPos: [MOVE_BOX, currentPos],
  currentNeg: [MOVE_BOX, currentNeg],
  glow: [MOVE_BOX, sub(gGlow.full, 'opacity="0"', 'opacity="1"', 1, 'glow opacity')],
  // 7 · sound field: wavefronts (march, clipped at the screen) + dome-face pressure
  wave: [[WAVE_CLIP_X, 60, 168, 240], sub(gSound.inner, gNear.full, '', 1, 'sfNear out of the wavefield')
    // fronts beyond the layer box (x > 336 + halo) are never on screen
    .replace(/<line [^>]*x1="([\d.]+)"[^>]*\/>\n?/g, (m, x) => (Number(x) <= WAVE_CLIP_X + 168 + 2 ? m : ''))],
  nearComp: [[148, 127, 20, 106], setAttr(el(gNear.full, 'sfNearComp'), 'fill-opacity', '0.12')],
  nearRare: [[148, 127, 20, 106], setAttr(el(gNear.full, 'sfNearRare'), 'fill-opacity', '0.07')],
  // 8 · rear path, labels, honesty caveat — always on top
  overB: [box.full, gRear.full + labelsOn + gCaveat.full],
};
// Every lead point must sit inside its own box (or the layer would crop it).
for (const [P, b] of [[A_move, L.leadA[0]], [B_move, L.leadB[0]]]) {
  if (P.some(([x, y]) => x < b[0] || x > b[0] + b[2] || y < b[1] || y > b[1] + b[3])) throw new Error('lead outside its layer box');
}

const layerTs = Object.entries(L)
  .map(([k, [b, frag]]) => `  ${k}: { box: [${b.map(r2).join(', ')}], xml: ${JSON.stringify(wrap(frag, b))} },`)
  .join('\n');
const ts = `/**
 * micCutawayAsset.ts — GENERATED by docs/art/mic-cutaway/patch_mic_cutaway.mjs.
 * Do not edit by hand; re-run the patch script to regenerate.
 *
 * Computer B's reviewed dynamic-mic capsule cutaway (APE fixes 2026-08-22),
 * split into parse-once SvgXml layers for the Microphone Principles lab, in
 * stacking order. Each layer is its own SVG document (it carries the base
 * <defs>) boxed to its content: \`box\` is [x, y, w, h] in the lab viewBox.
 * MicCutaway.tsx moves the moving ones at the view level from one clock; the
 * motion constants below come from the same script that drew the parts, so
 * the drawing and the motion cannot drift apart.
 */
export const MIC_VIEWBOX = '${VIEWBOX}';
export const MIC_VIEWBOX_BOX = [${VIEWBOX_BOX.join(', ')}] as const;
export const MIC_ASPECT = ${ASPECT}; // width / height (portrait phone crop)

/** Coil motion (MOTION_dynamic_mic_capsule_cutaway.md §1–2), viewBox units. */
export const MIC_MOTION = {
  /** X: dx = X·cos φ (outward +x); coil velocity / EMF / current ∝ sin φ. */
  travel: ${TRAVEL},
  /** the roll halves rotate about their clamped outer attach … */
  rollUpperPivot: [${ROLL_UPPER_PIVOT.join(', ')}],
  rollLowerPivot: [${ROLL_LOWER_PIVOT.join(', ')}],
  /** … at this arm, so their inner attach follows the dome by dx. */
  rollArm: ${ROLL_ARM},
  /** each lead's flexing run scales about x = leadPivotX: span → span + dx. */
  leadPivotX: ${LEAD_PIVOT_X},
  leadASpan: ${LEAD_A_SPAN},
  leadBSpan: ${LEAD_B_SPAN},
  /** wavefront spacing: one wavelength per electrical period. */
  waveStep: ${WAVE_STEP},
  /** wavefronts are clipped at the front screen's outer face … */
  waveClipX: ${WAVE_CLIP_X},
  /** … and the dome-face pressure wash at its inner face. */
  nearClipX: ${NEAR_CLIP_X},
} as const;

export type MicLayer = { readonly box: readonly [number, number, number, number]; readonly xml: string };
export const MIC_LAYERS = {
${layerTs}
} as const satisfies Record<string, MicLayer>;
`;
const OUT = join(DIR, '..', '..', '..', 'src', 'screens', 'lab', 'micspeaker', 'micCutawayAsset.ts');
writeFileSync(OUT, ts);
console.log(`wrote src/screens/lab/micspeaker/micCutawayAsset.ts (${ts.length} bytes)`);

console.log('done.');
