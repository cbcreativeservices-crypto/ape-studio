/**
 * Room Design & Monitoring Lab — the wiring guards (owner spec 2026-10-01):
 *   • registered everywhere a lab must be (catalog leaf, route type, the
 *     navigator through withMembershipPreview, the preview harness);
 *   • the shared lab navigation strip, the end screen, the guest rule;
 *   • every live module on the Rack Unit with FULL SCREEN; views in glass
 *     units with touches divided by the stage scale;
 *   • level and pressure coloured on the amplitude standard (levelColor.ts);
 *   • an honesty badge (CALCULATED / ESTIMATED / MEASURED) on every display
 *     and readout group, and never a single "room score";
 *   • nothing under 9 pt; no raw Alert; the store in the account wipe.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
import { planTransform, sideTransform, touchToGlass, pickHandle } from '../src/screens/lab/roomdesign/planGeom.ts';
import { ROOM_MODULES, ROOM_UNITS } from '../src/screens/lab/roomdesign/registry.ts';
import { bounds, defaultRoom } from '../src/screens/lab/roomdesign/roomModel.ts';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
const LAB = 'src/screens/lab/roomdesign/';
const MODULES = ['modIntro', 'modCreate', 'modMonitoring', 'modExplore', 'modTreatment', 'modReview'];
const labFiles = () => [...readdirSync(new URL(LAB, ROOT)).filter((f) => /\.tsx?$/.test(f)).map((f) => LAB + f), ...MODULES.map((m) => `${LAB}modules/${m}.tsx`)];

describe('registration', () => {
  it('is a members-only leaf in the Acoustics category (the Speaker Placement precedent), with no credit key', () => {
    const cat = read('src/screens/lab/labCatalog.ts');
    const leaf = cat.match(/\{ name: 'Room Design & Monitoring'[^\n]*\}/)?.[0] ?? '';
    assert.ok(leaf, 'the catalog leaf exists');
    assert.match(leaf, /route: 'RoomDesignLab'/);
    assert.match(leaf, /member: true/);
    assert.doesNotMatch(leaf, /key:/, 'progress, not certificate credit');
    const acoustics = cat.slice(cat.indexOf("id: 'acoustics'"), cat.indexOf("id: 'signal'"));
    assert.ok(acoustics.includes('Room Design & Monitoring'), 'listed under Acoustics');
  });
  it('has a route type, a MemberGated registration and a Stack.Screen', () => {
    assert.match(read('src/navigation/types.ts'), /RoomDesignLab: undefined;/);
    const nav = read('src/navigation/RootNavigator.tsx');
    assert.match(nav, /RoomDesignLab: withMembershipPreview\(RoomDesignLabScreen\)/);
    assert.match(nav, /<Stack\.Screen name="RoomDesignLab" component=\{MemberGated\.RoomDesignLab\} \/>/);
  });
  it('is in the #labpreview harness', () => {
    assert.match(read('App.tsx'), /RoomDesignLab: RoomDesignLabScreen as ComponentType/);
  });
  it('the saved-designs store is in the account wipe', () => {
    const wipe = read('src/features/account/clearLocalAccountData.ts');
    assert.match(wipe, /from '\.\.\/roomdesign\/roomDesignStore'/);
    assert.match(wipe, /resetRoomDesigns\(\);/);
  });
  it('the module registry is the app flow, in order', () => {
    assert.deepEqual(ROOM_UNITS, ['intro', 'create', 'monitoring', 'explore', 'treatment', 'review']);
    assert.deepEqual(ROOM_MODULES.map((m) => m.rack), [false, true, true, true, true, false]);
  });
});

describe('the shared lab navigation and the end screen', () => {
  const src = strip(read(`${LAB}RoomDesignLabScreen.tsx`));
  it('LabHeader + LabNavBar under a LabNavProvider; units from the registry with done from labVisits', () => {
    assert.match(src, /from '\.\.\/kit\/LabNavBar'/);
    assert.match(src, /<LabHeader\b/);
    assert.match(src, /<LabNavBar nav=\{nav\} \/>/);
    assert.match(src, /<LabNavProvider value=\{nav\}>/);
    assert.match(src, /units: ROOM_MODULES\.map\(\(m\) => \(\{ id: m\.id, title: m\.title, done: visited\.has\(m\.id\) \}\)\)/);
    assert.match(src, /reset: \{ label: 'START OVER \(PRACTICE\)', run: \(\) => go\(0\) \}/);
  });
  it('ends on the shared what’s-left screen in progress mode; practise again never clears anything', () => {
    assert.match(src, /<LabEndScreen/);
    assert.match(src, /mode="progress"/);
    assert.match(src, /onPracticeAgain=\{\(\) => go\(0\)\}/);
    assert.match(src, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.doesNotMatch(src, /markLabUnit|labCompletion/, 'banks no certificate credit');
  });
  it('the guest rule waits for the entitlement to resolve and blocks the store', () => {
    assert.match(src, /setRoomDesignSaveBlocked\(!resolved \|\| guest\)/);
    assert.match(src, /markLabVisit\(ROOM_LAB_ID, mod\.id, \{ persist: !guest \}\)/);
    assert.match(src, /if \(!resolved \|\| ending\) return;/);
  });
  it('the document modules draw the in-flow NEXT themselves', () => {
    for (const m of ['modIntro', 'modReview']) assert.match(strip(read(`${LAB}modules/${m}.tsx`)), /<LabNextButton \/>/, m);
  });
});

describe('rack + full screen', () => {
  it('the wrapper puts every live module on RackUnit with fullScreen ON by default', () => {
    const w = strip(read(`${LAB}rackLayout.tsx`));
    assert.match(w, /<RackUnit/);
    assert.match(w, /fullScreen: rack\.fullScreen \?\? true/);
    assert.match(w, /size: rack\.size \?\? 'L'/);
  });
  for (const m of ['modCreate', 'modMonitoring', 'modExplore', 'modTreatment']) {
    it(`${m} is a RoomRackLayout with a badge, a bezel, a dock and an initialParam, and never opts out of full screen`, () => {
      const s = strip(read(`${LAB}modules/${m}.tsx`));
      assert.match(s, /<RoomRackLayout/);
      assert.match(s, /badge: /);
      assert.match(s, /bezel/);
      assert.match(s, /initialParam: (?:'|rugSel \? ')/); // TREATMENT binds SIZE for a rug (toddler pass 3)
      assert.doesNotMatch(s, /fullScreen:\s*false/);
    });
  }
  it('the plan and side views lay out in glass units and divide touches by the stage scale', () => {
    for (const f of ['RoomPlanView', 'RoomSideView']) {
      const s = strip(read(`${LAB}${f}.tsx`));
      assert.match(s, /useStageTextScale\(\)/, f);
      assert.match(s, /const gw = w \/ s;\s*const gh = h \/ s;/, `${f} lays out in glass units`);
      assert.match(s, /viewBox=\{`0 0 \$\{gw\} \$\{gh\}`\}/, `${f} paints through the viewBox`);
      assert.match(s, /touchToGlass\(e\.nativeEvent\.locationX, e\.nativeEvent\.locationY, st\.s\)/, `${f} maps the touch start`);
      // (toddler pass 2: the delta is the drag's OWN finger, `off`, not the centroid `gs`)
      assert.match(s, /off\.dx \/ st\.s/, `${f} maps the drag delta`);
      assert.match(s, /onPanResponderTerminationRequest: \(\) => false/, `${f} keeps the drag from the scrollers`);
    }
  });
  it('a drag lands on the same metre at 1× and 2× (the pure transform)', () => {
    const b = bounds(defaultRoom('metric'));
    // FULL SCREEN at 2× hands the view a box twice the size; the view lays out
    // in GLASS units (box ÷ 2), so the transform is the glass transform…
    const T1 = planTransform(b, 368, 246);
    const T2 = planTransform(736 / 2 === 368 ? b : b, 736 / 2, 492 / 2);
    assert.deepEqual({ k: T2.k, ox: T2.ox, oy: T2.oy }, { k: T1.k, ox: T1.ox, oy: T1.oy });
    // …and a finger at box pixel (200, 150) on the glass …
    const g1 = touchToGlass(200, 150, 1);
    const m1 = T1.toM(g1);
    // … or at (400, 300) on the 2× drawing is the same point in the room
    const g2 = touchToGlass(400, 300, 2);
    const m2 = T2.toM(g2);
    assert.ok(Math.abs(m1.x - m2.x) < 1e-9 && Math.abs(m1.y - m2.y) < 1e-9);
    assert.deepEqual(touchToGlass(400, 300, 2), touchToGlass(200, 150, 1));
    // round trip
    const p = { x: 1.25, y: 3.5 };
    const back = T1.toM(T1.toPx(p));
    assert.ok(Math.abs(back.x - 1.25) < 1e-9 && Math.abs(back.y - 3.5) < 1e-9);
    const S = sideTransform(5, 2.5, 368, 246);
    const sb = S.toM(S.toPx({ x: 2, y: 1.2 }));
    assert.ok(Math.abs(sb.x - 2) < 1e-9 && Math.abs(sb.y - 1.2) < 1e-9);
    // the floor is at the bottom: higher z is a smaller screen y
    assert.ok(S.toPx({ x: 0, y: 2 }).y < S.toPx({ x: 0, y: 0 }).y);
  });
  it('pickHandle takes the nearest handle inside its radius only', () => {
    const hs = [
      { id: 'a', px: 10, py: 10 },
      { id: 'b', px: 40, py: 10, r: 8 },
    ];
    assert.equal(pickHandle(hs, 12, 12)?.id, 'a');
    assert.equal(pickHandle(hs, 46, 10)?.id, 'b');
    assert.equal(pickHandle(hs, 55, 10), null);
    assert.equal(pickHandle(hs, 25, 10)?.id, 'a', 'equidistant-ish: a is within its 22 default, b outside its 8');
  });
});

describe('colour, honesty and words', () => {
  it('modal pressure and reflection level are coloured on the amplitude standard', () => {
    const plan = strip(read(`${LAB}RoomPlanView.tsx`));
    assert.match(plan, /from '\.\.\/\.\.\/\.\.\/features\/tools\/levelColor'/);
    assert.match(plan, /fieldLevelColor\(p\)/, 'the pressure field uses the even FIELD ramp');
    assert.match(plan, /levelColorForDb\(r\.levelDb, -24, 0\)/, 'reflection paths colour by level');
    const side = strip(read(`${LAB}RoomSideView.tsx`));
    assert.match(side, /levelColorForDb\(r\.levelDb, -24, 0\)/);
    const explore = strip(read(`${LAB}modules/modExplore.tsx`));
    assert.match(explore, /tint: fieldLevelColor\(pAtEars\)/, 'the AT EARS readout wears the pressure colour');
  });
  it('every badge names a tier, and the review tags all three', () => {
    const ctx = read(`${LAB}labCtx.ts`);
    for (const key of ['create', 'monitoring', 'exploreRect', 'exploreApprox', 'treatment']) {
      const line = ctx.match(new RegExp(`${key}: '([^']+)'`))?.[1] ?? '';
      assert.match(line, /^(CALCULATED|ESTIMATED|MEASURED)/, `BADGE.${key}`);
    }
    const review = read(`${LAB}modules/modReview.tsx`);
    assert.match(review, /tier="CALCULATED"/);
    assert.match(review, /tier="ESTIMATED"/);
    assert.match(review, /tier="MEASURED"/);
    const explore = read(`${LAB}modules/modExplore.tsx`);
    assert.match(explore, /analysis\.rectangular \? BADGE\.exploreRect : BADGE\.exploreApprox/, 'a non-rectangle wears the less-reliable badge');
  });
  it('never offers a single room score', () => {
    for (const f of labFiles()) {
      const s = strip(read(f)).toLowerCase();
      // "not a score" / "no score, on purpose" are the lab refusing one; what
      // is forbidden is OFFERING one.
      assert.ok(!/room score|score:|a score of|scored|\d+ ?\/ ?100|out of 10\b/.test(s), `${f} offers a score`);
    }
  });
  it('draws nothing under 9 pt and never a raw Alert', () => {
    for (const f of labFiles()) {
      const s = strip(read(f));
      const sizes = [...s.matchAll(/fontSize[=:]\s*\{?([\d.]+)/g)].map((m) => Number(m[1]));
      const small = sizes.filter((x) => x < 9);
      assert.deepEqual(small, [], `${f} has text under 9 pt: ${small.join(', ')}`);
      assert.doesNotMatch(s, /Alert\.alert/, f);
    }
  });
  it('the treatment and monitoring copy carry the safety notes', () => {
    const t = read(`${LAB}roomModel.ts`);
    assert.match(t, /rated hardware/);
    assert.match(t, /fire-rated/i);
    assert.match(t, /never block/i);
    const bits = read(`${LAB}bits.tsx`);
    assert.match(bits, /SPL meter/);
    assert.match(bits, /Hearing damage is cumulative/);
    assert.match(read(`${LAB}modules/modMonitoring.tsx`), /SAFETY_LEVEL_NOTE/);
    assert.match(read(`${LAB}modules/modIntro.tsx`), /SAFETY_LEVEL_NOTE/);
  });
  it('the three-review fix pass holds (2026-10-01): labels, slots, landing, lanes inside the polygon', () => {
    const explore = strip(read(`${LAB}modules/modExplore.tsx`));
    assert.match(explore, /k: 'EARLY <15ms', v: `\$\{early\.length\}`/, 'the EARLY readout keeps its number when cropped, never a false "18 < 15"');
    assert.match(explore, /reflections: false, modes: true/, 'first entry: modes + triangle, reflections off');
    assert.match(explore, /SAFETY_LEVEL_POINTER/, 'the hearing pointer is in EXPLORE');
    assert.match(explore, /Math\.abs\(traced\.levelDb\)\.toFixed\(0\)\} dB below/, 'never "about -3 dB below"');
    assert.match(explore, /OPTION A \/ OPTION B \/ START/);
    const treat = strip(read(`${LAB}modules/modTreatment.tsx`));
    assert.match(treat, /ADD an item first/, 'the Treatment landing says what to do before THICK / SIZE mean anything');
    assert.match(treat, /'ADD FIRST'/);
    assert.match(treat, /k: 'TREATED', v: `\$\{treated\}\/\$\{total\}`/);
    assert.match(treat, /ABSORB NEXT: /);
    assert.match(treat, /k: 'RT60 125 ≈'/, 'the 125 Hz decay is marked indicative');
    assert.match(treat, /the 125 Hz figure is indicative only/);
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    assert.match(mon, /captionFirst/, 'the drag caption comes before the status');
    assert.match(mon, /surroundPosition\(d\.room, base, 'LS'\)/, 'surrounds spawn on the BS.775 circle');
    assert.match(mon, /ITU-R BS\.775/);
    assert.match(mon, /sub crawl/);
    assert.match(mon, /crossover, polarity and phase\/delay/);
    assert.match(mon, /monitor controller/);
    assert.match(mon, /rated for the monitor's mass/);
    assert.match(mon, /1–1\.5 m, midfields from about 2–4 m/);
    assert.equal((mon.match(/clampInside\(/g) ?? []).length >= 6, true, 'every lane write and spawn clamps inside the polygon');
    const create = strip(read(`${LAB}modules/modCreate.tsx`));
    assert.match(create, /resizeDesign\(d, width, length\)/, 'resize scales the layouts with the room');
    assert.match(create, /polygonIsValidRoom\(vertices\)/, 'a bow-tie or a tiny plan is refused');
    assert.match(create, /freeOpeningSlot\(/);
    assert.match(create, /NEW ROOM \(DEFAULT/);
    assert.match(create, /confirmDialog\(/);
    assert.match(create, /ANGLD/);
    const bits = read(`${LAB}bits.tsx`);
    assert.match(bits, /79–85 dB SPL \(C-weighted, slow\)/);
    assert.match(bits, /75–80 dB C-weighted for long sessions in a small room/);
    assert.match(bits, /every \+3 dB halves the safe time/);
    assert.match(bits, /minHeight: 44/);
    assert.equal((bits.match(/hitSlop=\{8\}/g) ?? []).length, 2, 'chips and tray buttons carry hitSlop 8');
    const model = read(`${LAB}roomModel.ts`);
    assert.match(model, /FFP2\/N95 mask/);
    assert.match(model, /smoke detector, sprinkler head or light fitting/);
    assert.match(model, /check for pipes and wiring before drilling/);
    assert.match(model, /Class A \/ UL 94/);
    const review = strip(read(`${LAB}modules/modReview.tsx`));
    assert.match(review, /<RoomPlanView[^>]*edit="none"/, 'the Review carries a read-only mini plan');
    assert.match(review, /tag=\{i === firstCheck \? 'TRY FIRST' : undefined\}/);
  });
  it('a guest is told plainly that nothing is saved; no upsell words', () => {
    const all = labFiles().map((f) => read(f)).join('\n');
    assert.match(all, /not signed in, so designs are not saved/);
    assert.doesNotMatch(all, /upgrade|unlock|free trial/i);
  });
});

/* ── standards conformance pass (2026-10-01) ─────────────────────────────── */

describe('the display is a working surface (owner standards 2026-10-01)', () => {
  it('the REVIEW mini plan opens FULL SCREEN through the shared ExpandableFigure, the explore badge riding along', () => {
    const review = strip(read(`${LAB}modules/modReview.tsx`));
    assert.match(review, /from '\.\.\/\.\.\/kit\/ExpandableFigure'/);
    assert.match(review, /<ExpandableFigure\s+aspect=\{miniAspect\}\s+title="THE PLAN AS REVIEWED"\s+badge=\{a\.rectangular \? BADGE\.exploreRect : BADGE\.exploreApprox\}/);
    assert.doesNotMatch(review, /onLayout=\{\(e\) => setPlanW/, 'the plan no longer measures itself outside full screen');
  });
  it('every lane changes the picture: CEILING (Create) and HEIGHT (Monitoring) open the side view, where a height shows', () => {
    const create = strip(read(`${LAB}modules/modCreate.tsx`));
    const ceiling = create.slice(create.indexOf("id: 'height'"), create.indexOf("kind: 'group'"));
    assert.match(ceiling, /if \(view === 'plan'\) setView\('side'\);/, 'CEILING');
    const mon = strip(read(`${LAB}modules/modMonitoring.tsx`));
    const height = mon.slice(mon.indexOf("id: 'height'"), mon.indexOf("id: 'setup'"));
    assert.match(height, /if \(view === 'plan'\) setView\('side'\);/, 'HEIGHT');
  });
  it('every tray pick changes the picture: wall / ceiling / floor materials tint the drawing; the listening-distance class prints under the angle', () => {
    const plan = strip(read(`${LAB}RoomPlanView.tsx`));
    assert.match(plan, /export const SURFACE_TINT: Record<string, string>/);
    assert.match(plan, /\n  drywall: WALL,/);
    for (const k of ['concrete', 'glass', 'wood', 'curtain', 'acoustictile']) assert.match(plan, new RegExp(`\\b${k}: '#[0-9a-f]{6}'`), `SURFACE_TINT.${k}`);
    assert.match(plan, /stroke=\{SURFACE_TINT\[room\.walls\] \?\? WALL\} strokeWidth=\{3\}/);
    assert.match(plan, /export const FIELD_RANGE_M/);
    assert.match(plan, /\$\{design\.monitoring\.field\.toUpperCase\(\)\} · \$\{fmtLen\(d, units\)\}/);
    const side = strip(read(`${LAB}RoomSideView.tsx`));
    assert.match(side, /import \{ SURFACE_TINT, type PlanHandle \} from '\.\/RoomPlanView';/);
    assert.match(side, /stroke=\{ceilTint\} strokeWidth=\{3\}/);
    assert.match(side, /stroke=\{wallTint\} strokeWidth=\{3\}/);
    assert.match(side, /stroke=\{floorTint\} strokeWidth=\{3\}/);
  });
  it('the plan labels are ≥ 9 pt on the glass at any phone width: glass units at fs 9.5, never under', () => {
    for (const f of ['RoomPlanView', 'RoomSideView']) {
      const s = strip(read(`${LAB}${f}.tsx`));
      assert.match(s, /const fs = 9\.5;/, f);
      assert.doesNotMatch(s, /fontSize=\{fs - /, `${f}: a label under the floor`);
    }
  });
});
