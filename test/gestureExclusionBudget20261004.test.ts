/**
 * Android back-gesture exclusion — the per-screen budget ratchet (2026-10-04).
 *
 * Owner, Pixel 7 Pro on gesture nav: a lab drag that starts in the ~30 dp
 * strip at either screen edge is taken by the system back gesture. Every
 * audited lab drag surface now lays a <GestureExclusionZone /> inside the
 * View that carries its panHandlers (modules/ape-gesture-exclusion).
 *
 * Android honours at most 200 dp of exclusion height PER EDGE per window. A
 * rack screen spends 48 dp on its dock lane (ParamLane), so a stage takes
 * STAGE_BAND_DP (140): 48 + 140 = 188. Two stages on screen at once would
 * have to split the band. The rack's FULL SCREEN view is a native Modal — its
 * own window, its own 200 dp — so a stage mounted on the glass AND in full
 * screen is not a double charge.
 *
 * This test:
 *  1. lists EVERY file under src/ that mounts the zone — a new one must be
 *     added to ZONE_FILES below with its band and its screen, or this fails;
 *  2. sums each screen's co-visible zones (lane + stages) and holds it ≤ 200;
 *  3. pins the audited drag surfaces: each still mounts the zone, at the
 *     stage band, within a few lines of its panHandlers (i.e. inside that
 *     View), and the import resolves to the module.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const MOD = 'modules/ape-gesture-exclusion';
const CAP_DP = 200;
const STAGE_BAND_DP = Number(/export const STAGE_BAND_DP = (\d+);/.exec(read(`${MOD}/index.tsx`))?.[1]);
// The lane's zone fills the lane, whose style is `height: 48,` (pinned too by gestureExclusion20261004).
const LANE_DP = /\bheight: 48,/.test(read('src/screens/lab/rack/ParamLane.tsx')) ? 48 : NaN;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) walk(rel, out);
    else if (/\.tsx?$/.test(name)) out.push(relative(ROOT, join(ROOT, rel)).split(sep).join('/'));
  }
  return out;
}

/** The dp one zone asks for, read from its JSX. ParamLane's zone takes the
 *  default (200) but the native view clamps to its own 48 dp lane. */
function zoneDps(file: string): number[] {
  const src = read(file);
  return [...src.matchAll(/<GestureExclusionZone\b([^>]*)\/>/g)].map((m) => {
    const attrs = m[1];
    if (/maxHeightDp=\{STAGE_BAND_DP\}/.test(attrs)) return STAGE_BAND_DP;
    const lit = /maxHeightDp=\{(\d+)\}/.exec(attrs);
    if (lit) return Number(lit[1]);
    if (file === 'src/screens/lab/rack/ParamLane.tsx') return LANE_DP;
    return CAP_DP; // the component default
  });
}

const LANE = 'src/screens/lab/rack/ParamLane.tsx';

/** Every file that mounts the zone. RATCHET: a new mount is added here (and
 *  to a screen below) deliberately, with its budget checked. */
const ZONE_FILES: Record<string, { audited: boolean }> = {
  [LANE]: { audited: false },
  'src/screens/lab/miking/engine/scene/PlacementScene.tsx': { audited: false },
  'src/screens/lab/BinauralLabScreen.tsx': { audited: true },
  'src/screens/lab/cymatics/vizPlate.tsx': { audited: true },
  'src/screens/lab/cymatics/vizMembrane.tsx': { audited: true },
  'src/screens/lab/digital/vizQuant.tsx': { audited: true },
  'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx': { audited: true },
  'src/screens/lab/roomdesign/RoomPlanView.tsx': { audited: true },
  'src/screens/lab/roomdesign/RoomSideView.tsx': { audited: true },
  'src/screens/lab/wave/vizWave.tsx': { audited: true },
  'src/screens/lab/eq/modules/MultiBand.tsx': { audited: true },
  'src/screens/lab/tuning/components/dragRail.tsx': { audited: true },
  'src/screens/lab/tube/TubeCardScreen.tsx': { audited: true },
};

/** What is on ONE screen (one window) at once. Every lab screen is budgeted
 *  as if it carries a dock lane (the worst case) unless it plainly has none.
 *  The Room Design plan and side views are never co-visible (VIEW swaps
 *  them), so each is its own entry at the full stage band. */
const SCREENS: { name: string; files: string[] }[] = [
  { name: 'Miking placement stage', files: [LANE, 'src/screens/lab/miking/engine/scene/PlacementScene.tsx'] },
  { name: 'Binaural Lab stage', files: [LANE, 'src/screens/lab/BinauralLabScreen.tsx'] },
  { name: 'Cymatics plate', files: [LANE, 'src/screens/lab/cymatics/vizPlate.tsx'] },
  { name: 'Cymatics membrane', files: [LANE, 'src/screens/lab/cymatics/vizMembrane.tsx'] },
  { name: 'Digital — quantisation inspect strip', files: [LANE, 'src/screens/lab/digital/vizQuant.tsx'] },
  { name: 'Mic Principles — polar stage', files: [LANE, 'src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx'] },
  { name: 'Room Design — plan view', files: [LANE, 'src/screens/lab/roomdesign/RoomPlanView.tsx'] },
  { name: 'Room Design — side view', files: [LANE, 'src/screens/lab/roomdesign/RoomSideView.tsx'] },
  { name: 'Wave room scene', files: [LANE, 'src/screens/lab/wave/vizWave.tsx'] },
  { name: 'EQ multiband graph', files: [LANE, 'src/screens/lab/eq/modules/MultiBand.tsx'] },
  { name: 'Tuning drag rail', files: [LANE, 'src/screens/lab/tuning/components/dragRail.tsx'] },
  { name: 'Tube card (no dock lane)', files: ['src/screens/lab/tube/TubeCardScreen.tsx'] },
];

describe('GestureExclusionZone — every mount is registered and budgeted', () => {
  it('the constants read back (lane 48, stage band 140)', () => {
    assert.equal(LANE_DP, 48);
    assert.ok(STAGE_BAND_DP > 0 && LANE_DP + STAGE_BAND_DP <= CAP_DP);
  });

  it('the set of files mounting the zone is exactly the registry (ratchet)', () => {
    const using = walk('src').filter((f) => /<GestureExclusionZone\b/.test(read(f))).sort();
    assert.deepEqual(using, Object.keys(ZONE_FILES).sort(), 'a new GestureExclusionZone mount must be added to ZONE_FILES and to a SCREENS budget entry');
  });

  it('every registered file sits on at least one budgeted screen', () => {
    const onScreens = new Set(SCREENS.flatMap((s) => s.files));
    for (const f of Object.keys(ZONE_FILES)) assert.ok(onScreens.has(f), `${f} has no SCREENS entry`);
  });

  for (const s of SCREENS) {
    it(`${s.name}: per-edge sum ≤ ${CAP_DP} dp`, () => {
      const sum = s.files.reduce((t, f) => t + zoneDps(f).reduce((a, b) => a + b, 0), 0);
      assert.ok(sum <= CAP_DP, `${s.name}: ${s.files.map((f) => `${f.split('/').pop()} ${zoneDps(f).join('+')}`).join(' + ')} = ${sum} dp > ${CAP_DP}`);
    });
  }
});

describe('GestureExclusionZone — the audited lab drag surfaces', () => {
  for (const [file, { audited }] of Object.entries(ZONE_FILES)) {
    if (!audited) continue;
    it(`${file.split('/').pop()}: one zone at the stage band, inside its panHandlers View`, () => {
      const src = read(file);
      const zones = [...src.matchAll(/<GestureExclusionZone\b[^>]*\/>/g)];
      assert.equal(zones.length, 1, 'exactly one zone per drag surface');
      assert.match(zones[0][0], /maxHeightDp=\{STAGE_BAND_DP\}/);
      assert.match(src, /import \{ GestureExclusionZone, STAGE_BAND_DP \} from '(\.\.\/)+modules\/ape-gesture-exclusion';/);
      // Inside the View that carries the panHandlers: the zone is the first
      // thing after that View's opening tag — no other element opens or
      // closes between the spread and the zone (only its comment).
      const zAt = zones[0].index ?? 0;
      const panAt = src.lastIndexOf('.panHandlers', zAt);
      assert.ok(panAt >= 0, 'no panHandlers before the zone');
      const between = src.slice(panAt, zAt).replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      assert.doesNotMatch(between, /<\/?[A-Za-z]/, `zone is not the first child of the panHandlers View:\n${between}`);
    });
  }

  it('the import path in each audited file resolves to the module', () => {
    for (const [file, { audited }] of Object.entries(ZONE_FILES)) {
      if (!audited) continue;
      const rel = /from '((?:\.\.\/)+)modules\/ape-gesture-exclusion'/.exec(read(file))?.[1] ?? '';
      const depth = file.split('/').length - 1;
      assert.equal(rel.length / 3, depth, `${file}: import climbs ${rel.length / 3} levels, needs ${depth}`);
    }
  });

  it('drags that are not always live arm the zone only when they are', () => {
    for (const f of ['src/screens/lab/cymatics/vizPlate.tsx', 'src/screens/lab/cymatics/vizMembrane.tsx']) {
      assert.match(read(f), /<GestureExclusionZone active=\{p\.dragTarget != null\} maxHeightDp=\{STAGE_BAND_DP\} \/>/);
    }
    assert.match(read('src/screens/lab/roomdesign/RoomPlanView.tsx'), /\{edit === 'none' \? null : <GestureExclusionZone maxHeightDp=\{STAGE_BAND_DP\} \/>\}/);
    assert.match(read('src/screens/lab/roomdesign/RoomSideView.tsx'), /\{edit \? <GestureExclusionZone maxHeightDp=\{STAGE_BAND_DP\} \/> : null\}/);
  });
});
