/**
 * Screen Guide rollout — Room Design & Monitoring Lab (owner 2026-10-31) —
 * receipts. The Wave Physics pilot's pattern (test/screenGuide_20261031.test.ts)
 * applied to this lab:
 *
 *   1. every RoomModuleId (and the what's-left screen) has a guide with all
 *      five sections, 1–5 non-empty bullets each, 2–3 TRY THIS experiments,
 *      in the house copy rules;
 *   2. every step fits its no-scroll budget (SCREEN_GUIDE_BUDGET);
 *   3. the guide quotes the screen's REAL names — each one pinned here is in
 *      both the guide and the module/renderer source (rename one → update the
 *      guide);
 *   4. the TRY THIS numbers are what the model prints for the default design
 *      (roomModel.analyze), so a change to the defaults or the formulas fails
 *      here instead of leaving the guide wrong;
 *   5. wiring: RoomDesignLabScreen passes the guide to LabHeader (module guide
 *      by id, the end guide on FINISH) and wraps its content in
 *      ScreenGuideHost — regions on the rack modules only;
 *   6. CHIP DECISION: this lab KEEPS the header AccuracyNote (with its room-
 *      model detail) — it prints real-room acoustics numbers (room modes, RT60,
 *      distances, boundary cancellations) — and the ⓘ sits beside it.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { ROOM_MODULES } = await import('../src/screens/lab/roomdesign/registry.ts');
const { ROOM_SCREEN_GUIDES, ROOM_END_GUIDE } = await import('../src/screens/lab/roomdesign/roomdesignScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const M = await import('../src/screens/lab/roomdesign/roomModel.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = ROOM_SCREEN_GUIDES as unknown as Record<string, Guide>;
const allGuides: [string, Guide][] = [['end', ROOM_END_GUIDE as unknown as Guide], ...Object.entries(GUIDES)];
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

describe('1. every Room Design screen has a complete guide', () => {
  it('every RoomModuleId has a guide — and no guide is for a module that does not exist', () => {
    const ids = ROOM_MODULES.map((m: { id: string }) => m.id).sort();
    assert.equal(ids.length, 6);
    assert.deepEqual(Object.keys(GUIDES).sort(), ids);
  });
  for (const [id, gd] of allGuides) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no gear makers', () => {
    for (const [id, gd] of allGuides) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmaster(y)?\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|toddler pass|audio review)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Genelec|Yamaha|KRK|Adam|Neumann|Focal|JBL|Auralex|Primacoustic|GIK)\b/, `${id}: a gear maker's name`);
    }
  });
});

describe('2. every step fits its no-scroll budget', () => {
  it('seeing / changes / teaches ≤ low, control ≤ high, each TRY THIS item ≤ tryItem', () => {
    const over: string[] = [];
    for (const [id, gd] of allGuides) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
});

describe('3. each guide quotes its screen’s real names', () => {
  const DIR = 'src/screens/lab/roomdesign';
  const SRC = [
    `${DIR}/modules/modIntro.tsx`,
    `${DIR}/modules/modCreate.tsx`,
    `${DIR}/modules/modMonitoring.tsx`,
    `${DIR}/modules/modExplore.tsx`,
    `${DIR}/modules/modTreatment.tsx`,
    `${DIR}/modules/modReview.tsx`,
    `${DIR}/RoomPlanView.tsx`,
    `${DIR}/RoomSideView.tsx`,
    `${DIR}/bits.tsx`,
    `${DIR}/labCtx.ts`,
    `${DIR}/roomModel.ts`,
    'src/screens/lab/kit/LabEndScreen.tsx',
    'src/screens/lab/kit/labEnd.ts',
    'src/screens/lab/kit/ExpandableFigure.tsx',
  ]
    .map(code)
    .join('\n');
  const NAMES: Record<string, string[]> = {
    intro: ['THREE KINDS OF NUMBER', 'CALCULATED', 'ESTIMATED', 'MEASURED', 'HEARING FIRST', 'HOW THE LAB RUNS'],
    create: ['FRONT', 'VIEW', 'PLAN', 'SIDE', 'AREA', 'VOLUME', 'RATIO S:M:L', 'LENGTH', 'WIDTH', 'CEILING', 'SIDE VIEW', 'SHAPE', 'FINISH', 'TYPE THE DIMENSIONS', 'UNITS', 'WALL SHAPE', 'RECTANGLE', 'ANGLED', 'IRREGULAR', 'CURVED', 'FLAT', 'SLOPED', 'VAULTED', 'MIXED', '+ DOOR', '+ WINDOW', '+ OPENING', '+ DESK', '+ SOFA', '+ SHELF', '+ RACK', 'NEW ROOM', 'FLOOR', 'WALLS', 'LESS reliable'],
    monitoring: ['NEARFIELD', 'MIDFIELD', 'DIST L', 'DIST R', 'ANGLE', 'NONE', 'L−R', 'SPREAD', 'FRONT', 'SEAT', 'HEIGHT', 'WHICH HEIGHT', 'SETUP', 'CONFIGURATION', 'STEREO', 'STEREO + SUB', 'MULTICHANNEL', 'LISTENING DISTANCE CLASS', 'OTHER', 'TOE-IN', 'STRAIGHT', 'TOE-IN 15°', 'TOE-IN 30°'],
    explore: ['MODE PRESSURE', 'RED', 'BLUE', 'MODE', 'AT EARS', 'EARLY <15ms', '1ST', 'ROOM MODE TO MAP', 'axial', 'tangential', 'oblique', 'LAYERS', 'TRIANGLE', 'WALL DISTANCES', 'REFLECTIONS', 'TREATMENT', 'TRACE', 'LAYOUT', 'START', 'EDITED', 'OPTION A', 'OPTION B', 'SAVE', 'WHAT CHANGED'],
    treatment: ['TREATED', 'RT60 500', 'RT60 125 ≈', 'VS BARE', 'ADD', 'ABSORB NEXT', 'BASS TRAPS IN THE CORNERS', 'CEILING CLOUD', 'RUG', 'DIFFUSER (REAR WALL)', 'FREESTANDING PANEL', 'THICK', 'SIZE', 'ITEM ON', 'ITEM OFF', 'ITEMS', 'SELECT', 'SWITCH OFF', 'REMOVE', 'ALL OFF (COMPARE)', 'ALL ON', 'FLOOR RUG'],
    review: ['ROOM AND LAYOUT', 'LIKELY ACOUSTIC BEHAVIOR', 'THE PLAN AS REVIEWED', 'SUGGESTED NEXT STEPS', 'MEASURE VERSUS ESTIMATE', 'SAVED DESIGNS — BEFORE AND AFTER', 'FULL SCREEN', 'MEASURED RT60 (MID)', 'RESONANCE FOUND', 'CLEAR MEASURED VALUES', 'SAVE THIS DESIGN', 'LOAD', 'DELETE', 'TRY FIRST'],
  };
  it('a name list for every module', () => {
    assert.deepEqual(Object.keys(NAMES).sort(), Object.keys(GUIDES).sort());
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the end screen’s names are the shared end screen’s', () => {
    const gt = textOf(ROOM_END_GUIDE as unknown as Guide);
    for (const n of ['LAB COMPLETE', 'REVIEW ▾', 'PRACTICE AGAIN FROM THE START', 'DONE · BACK TO LABS']) {
      assert.ok(SRC.includes(n), `"${n}" is no longer in the end-screen source`);
      assert.ok(gt.includes(n), `the end guide never names "${n}"`);
    }
  });
  it('the COMPARE AS “BEFORE” button is quoted as drawn (curly quotes in the guide, straight in the source)', () => {
    assert.ok(SRC.includes(`'COMPARE AS "BEFORE"'`));
    assert.ok(textOf(GUIDES.review).includes('COMPARE AS “BEFORE”'));
  });
});

describe('4. TRY THIS numbers are what the model prints for the default design', () => {
  const d = M.defaultDesign();
  const a = M.analyze(d);
  const lay = d.layouts[0];
  const b = a.bounds;
  const t = (id: string) => GUIDES[id].tryThis.join('\n');
  const mid = (bands: { hz: number; sabine: number }[]) => bands.find((x) => x.hz === 500)!.sabine;
  const low = (bands: { hz: number; sabine: number }[]) => bands.find((x) => x.hz === 125)!.sabine;
  const treated = (an: { reflections: { treatedBy?: unknown }[] }) => `${an.reflections.filter((r) => r.treatedBy).length}/${an.reflections.length}`;

  it('create: AREA 20.0 m², VOLUME 50.0 m³, RATIO 1:1.6:2.0 with 68.6 Hz shared; CEILING at 2.65 m → 1:1.5:1.9; ANGLED is not rectangular', () => {
    assert.equal(`${a.area.toFixed(1)} m²`, '20.0 m²');
    assert.equal(`${a.volume.toFixed(1)} m³`, '50.0 m³');
    const ratio = (L: number, W: number, H: number) => {
      const s = [L, W, H].sort((x, y) => x - y);
      return `1:${(s[1] / s[0]).toFixed(1)}:${(s[2] / s[0]).toFixed(1)}`;
    };
    assert.equal(ratio(b.length, b.width, a.modalDims.H), '1:1.6:2.0');
    assert.equal(ratio(b.length, b.width, 2.65), '1:1.5:1.9');
    // The default 2.0: (0,0,1) and (2,0,0) share 68.6 Hz; at 2.65 m they part.
    const hz = (m: { f: number }) => M.fmtHz(m.f);
    const has = (an: { modes: { nx: number; ny: number; nz: number; f: number }[] }, n: number[]) => hz(an.modes.find((m) => m.nx === n[0] && m.ny === n[1] && m.nz === n[2])!);
    assert.equal(has(a, [0, 0, 1]), '68.6 Hz');
    assert.equal(has(a, [2, 0, 0]), '68.6 Hz');
    assert.notEqual(has(M.analyze({ ...d, room: { ...d.room, height: 2.65 } }), [0, 0, 1]), '68.6 Hz');
    assert.match(code('src/screens/lab/roomdesign/modules/modCreate.tsx'), /laneVal\(v, H_MIN, H_MAX, 0\.05\)/);
    for (const s of ['AREA 20.0 m²', 'VOLUME 50.0 m³', 'RATIO S:M:L 1:1.6:2.0', '68.6 Hz', '2.65 m', '1:1.5:1.9', 'NEW ROOM']) assert.ok(t('create').includes(s), s);
    // The modCreate ratio cell is the same formula (sorted, ÷ smallest, 1 dp).
    assert.match(code('src/screens/lab/roomdesign/modules/modCreate.tsx'), /return `1:\$\{\(sorted\[1\] \/ base\)\.toFixed\(1\)\}:\$\{\(sorted\[2\] \/ base\)\.toFixed\(1\)\}`;/);
    assert.match(code('src/screens/lab/roomdesign/modules/modCreate.tsx'), /const H_MIN = 2;/);
    const angled = { ...d, room: { ...d.room, shape: 'angled' as const, vertices: M.shapeVertices('angled', 4, 5) } };
    assert.equal(M.analyze(angled).rectangular, false);
  });

  it('monitoring: 1.60 m, 60°, NONE once the seat is within 0.3 m of the speakers’ line, MIDFIELD · 1.60 m ? (outside 1.8–4.2 m), 5 cm tolerance', () => {
    const st = a.stereo!;
    assert.equal(M.fmtLen(st.distL, 'metric'), '1.60 m');
    assert.equal(st.angleDeg.toFixed(0), '60');
    assert.equal(st.inFront, true);
    assert.equal(M.stereoGeometry(d.room, { ...lay, listener: { ...lay.listener, y: 1.0 } })!.inFront, false, 'SEAT at 1 m: no triangle');
    assert.equal(M.SEAT_AHEAD_M, 0.3, 'the guide quotes 30 cm');
    assert.equal(lay.speakers.find((s: { role: string }) => s.role === 'L')!.y, 0.9, '10 cm ahead at SEAT 1 m');
    // FRONT 0.90 → 1.20 m: L’s front-wall cancellation ~101.9 → ~77.0 Hz.
    const fw = (an: { sbir: { speaker: string; surface: string; notchHz: number }[] }) => M.fmtHz(an.sbir.find((x) => x.speaker === 'L' && x.surface === 'front wall')!.notchHz);
    assert.equal(fw(a), '101.9 Hz');
    const front12 = { ...d, layouts: [{ ...lay, speakers: lay.speakers.map((s: { y: number }) => ({ ...s, y: 1.2 })) }] };
    assert.equal(fw(M.analyze(front12)), '77.0 Hz');
    for (const s of ['~101.9 Hz', '~77.0 Hz', '0.8–1.8 m', '30 cm']) assert.ok(t('monitoring').includes(s), s);
    assert.equal(M.SYM_TOL, 0.05);
    const plan = code('src/screens/lab/roomdesign/RoomPlanView.tsx');
    assert.match(plan, /midfield: \[1\.8, 4\.2\]/);
    assert.match(plan, /nearfield: \[0\.8, 1\.8\]/);
    assert.match(plan, /\$\{fits \? '' : ' \?'\}/);
    assert.ok(t('monitoring').includes('MIDFIELD · 1.60 m ?'));
    assert.ok(GUIDES.monitoring.seeing.join(' ').includes('1.60 m a side'));
  });

  it('explore: MODE 34.3 Hz, AT EARS 13 %, 1ST +0.7 ms from the desk, and TRACE starts on that path', () => {
    const m0 = a.modes[0];
    assert.equal(M.fmtHz(m0.f), '34.3 Hz');
    assert.deepEqual([m0.nx, m0.ny, m0.nz], [1, 0, 0]);
    const p = M.modePressure(a.modalDims.L, a.modalDims.W, a.modalDims.H, m0, lay.listener.y - b.minY, lay.listener.x - b.minX, lay.listener.earZ);
    assert.equal(`${Math.round(p * 100)} %`, '13 %');
    const first = a.reflections[0];
    assert.equal(`+${first.delayMs.toFixed(1)} ms`, '+0.7 ms');
    assert.equal(first.surface.kind, 'desk');
    const shown = M.planReflections(a.reflections, lay.speakers, 'listener');
    assert.equal(M.nextTraceKey(shown, null), M.reflectionKey(first));
    for (const s of ['34.3 Hz', '13 %', '+0.7 ms']) assert.ok(t('explore').includes(s), s);
    // Dragging back: 0 % at mid-room (2.50 m), then toward 100 % by the rear wall.
    const pAt = (y: number) => Math.round(100 * M.modePressure(a.modalDims.L, a.modalDims.W, a.modalDims.H, m0, y - b.minY, lay.listener.x - b.minX, lay.listener.earZ));
    assert.equal(pAt(2.5), 0);
    assert.ok(pAt(4.85) >= 99);
    // Each experiment starts from START (Monitoring’s moves went into EDITED).
    assert.ok(GUIDES.explore.tryThis[0].startsWith('Flip LAYOUT to START'));
    assert.ok(GUIDES.explore.tryThis[1].startsWith('Flip LAYOUT back to START'));
    assert.equal(M.EDITED_LAYOUT, 'Edited');
  });

  it('treatment, replayed in order: traps 0.40 → 0.31 s, −0.15 s, 0/14 · + cloud 2/14, −0.17 s, cloud off → 0/14, −0.15 s · ABSORB NEXT = FLOOR RUG (+3.7 ms) → 2/14', () => {
    const bare = M.rt60Bands(d.room, []);
    assert.equal(treated(a), '0/14');
    assert.equal(low(a.rt60).toFixed(2), '0.40');
    // Corner traps.
    const traps = { ...d, treatment: d.room.vertices.map((_: unknown, i: number) => M.basstrapAt(d.room, i)) };
    const at = M.analyze(traps);
    assert.equal(low(at.rt60).toFixed(2), '0.31');
    assert.equal(M.signedSeconds(mid(at.rt60) - mid(bare)), '−0.15 s');
    assert.equal(treated(at), '0/14');
    // The CEILING CLOUD button's item (modTreatment addKind('cloud')).
    const L = lay.speakers.find((s: { role: string }) => s.role === 'L')!;
    const cloud = { id: 'c', kind: 'cloud' as const, x: (b.minX + b.maxX) / 2, y: (L.y + lay.listener.y) / 2, width: 1.2, height: 1.2, thickness: 0.1, z: d.room.height - 0.25, enabled: true };
    // Step 2 keeps step 1’s traps in the room (steps are shown one at a time).
    const ac = M.analyze({ ...d, treatment: [...traps.treatment, cloud] });
    assert.equal(treated(ac), '2/14');
    assert.equal(M.signedSeconds(mid(ac.rt60) - mid(bare)), '−0.17 s');
    const offT = [...traps.treatment, { ...cloud, enabled: false }];
    const off = M.analyze({ ...d, treatment: offT });
    assert.equal(treated(off), '0/14');
    assert.equal(M.signedSeconds(mid(off.rt60) - mid(bare)), '−0.15 s');
    assert.match(code('src/screens/lab/roomdesign/modules/modTreatment.tsx'), /if \(kind === 'cloud'\) t = \{ id: newId\('tr'\), kind, x: \(analysis\.bounds\.minX \+ analysis\.bounds\.maxX\) \/ 2, y: \(L\.y \+ lis\.y\) \/ 2, width: 1\.2, height: 1\.2, thickness: 0\.1, z: room\.height - 0\.25, enabled: true \};/);
    // ABSORB NEXT on the default room.
    // Step 3: traps on, cloud off — the next path is still the floor bounce.
    const treatable = off.reflections.filter((r: { treatedBy?: unknown; surface: { kind: string } }) => !r.treatedBy && r.surface.kind !== 'desk');
    const next = treatable.find((r: { delayMs: number }) => r.delayMs < 20) ?? treatable[0];
    assert.equal(next.surface.kind, 'floor');
    assert.equal(`+${next.delayMs.toFixed(1)} ms`, '+3.7 ms');
    const rug = M.treatmentAtReflection(next, d.room)!;
    assert.equal(treated(M.analyze({ ...d, treatment: [...offT, rug] })), '2/14');
    // The 10 cm porous limit quoted in WHAT CHANGES.
    assert.equal(Math.round(M.depthLimitHz(0.1, a.c)), 858);
    for (const s of ['0.40 s to 0.31 s', '−0.15 s', '0/14', '2/14', '−0.17 s', 'ABSORB NEXT: FLOOR RUG (+3.7 ms)', 'NEW ROOM']) assert.ok(t('treatment').includes(s), s);
    assert.ok(GUIDES.treatment.changes.join(' ').includes('858 Hz at 10 cm'));
  });

  it('review: TRY FIRST = the 34.3 Hz length null; 34 Hz → axial (1,0,0) 0.3 Hz above; 0.45 s → deader by 18 %; 0.55 s estimate', () => {
    const firstCheck = a.suggestions.find((s: { level: string }) => s.level === 'check')!;
    assert.match(firstCheck.text, /near a null of the L-axis mode 34\.3 Hz/);
    const cmp = M.compareMeasured({ ...d, measured: { rt60Mid: 0.45, modeHz: 34 } }, a).map((x: { text: string }) => x.text);
    assert.match(cmp[0], /vs the Sabine estimate 0\.55 s \(the room is deader than the model by 18 %\)/);
    assert.match(cmp[1], /axial \(1,0,0\) at 34\.3 Hz, 0\.3 Hz above what you measured\. That is a close match for a simple model\./);
    for (const s of ['34.3 Hz', 'axial (1,0,0)', '0.3 Hz above', '0.55 s', '18 %', 'NEW ROOM']) assert.ok(t('review').includes(s), s);
  });
});

describe('5. wiring: LabHeader takes the guide, ScreenGuideHost wraps the content', () => {
  const SCR = code('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx');
  it('the module guide by RoomModuleId, the end guide on FINISH, the module title on the card', () => {
    assert.match(SCR, /import \{ ROOM_END_GUIDE, ROOM_SCREEN_GUIDES \} from '\.\/roomdesignScreenGuides';/);
    assert.match(SCR, /<LabHeader[\s\S]*?guide=\{ending \? ROOM_END_GUIDE : ROOM_SCREEN_GUIDES\[mod\.id\]\}[\s\S]*?guideTitle=\{ending \? 'WHAT’S LEFT' : mod\.title\.toUpperCase\(\)\}[\s\S]*?\/>/);
  });
  it('the host wraps the root’s content; a module change closes an open guide; regions only on rack modules', () => {
    assert.match(SCR, /<View style=\{\[styles\.root, \{ paddingTop: insets\.top \+ 10 \}\]\}>(\s*\{\})*\s*<ScreenGuideHost resetKey=\{ending \? 'end' : mod\.id\} regions=\{mod\.rack && !ending\}>\s*<LabHeader/);
    assert.match(SCR, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
    // The rack modules are the ones RackUnit registers regions for.
    const rackIds = ROOM_MODULES.filter((m: { rack: boolean }) => m.rack).map((m: { id: string }) => m.id);
    assert.deepEqual(rackIds, ['create', 'monitoring', 'explore', 'treatment']);
    assert.match(code('src/screens/lab/roomdesign/rackLayout.tsx'), /<RackUnit/);
  });
});

describe('6. chip decision: this lab KEEPS the accuracy chip (real-room acoustics numbers)', () => {
  it('the compact AccuracyNote stays in LabHeader’s right slot, with its room-model detail; the ⓘ is added beside it', () => {
    const SCR = code('src/screens/lab/roomdesign/RoomDesignLabScreen.tsx');
    assert.match(SCR, /right=\{<AccuracyNote compact detail="This lab models a room from the numbers you enter\.[^"]*calibrated analyzer[^"]*" \/>\}/);
    // LabHeader draws the key after `right` (shared wiring).
    const NAV = code('src/screens/lab/kit/LabNavBar.tsx');
    assert.match(NAV, /const key = guide \? <ScreenGuideKey title=\{guideTitle \?\? title\.toUpperCase\(\)\} guide=\{guide\} \/> : null;/);
  });
});
