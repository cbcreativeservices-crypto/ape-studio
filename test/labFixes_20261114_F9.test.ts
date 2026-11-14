/**
 * Lab fix round 2026-11-14 — group F9 (the Miking Labs: 7 families, 128
 * lessons, and Microphone Selection). Owner approval, 2026-11-14: "Begin
 * fixing all bugs found and do obvious (my decision is not required) fixes as
 * you suggestted in the report." Brief:
 * docs/labs/novice_audit_2026_11_14/fixes/00_FIX_BRIEF.md; report:
 * docs/labs/novice_audit_2026_11_14/fixes/F9_REPORT.md.
 *
 * Every test here would have failed before its fix.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { compileScene, pinToSurface } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, zoneFor, zonesAvailable } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { deriveReadouts } from '../src/screens/lab/miking/engine/geometry/readouts.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { zoneActivityLine } from '../src/screens/lab/miking/engine/progress/zoneActivity.ts';
import { articleFor, journeyIntro } from '../src/screens/lab/miking/engine/journey.ts';
import { aimKeyShort } from '../src/screens/lab/miking/engine/scene/placementDock.ts';
import { aimWords } from '../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts';
import { JOB_FIT, JOB_GROUPS } from '../src/screens/lab/micselect/micSelectData.ts';
import type { Lesson, MicType } from '../src/screens/lab/miking/engine/model/types.ts';

const ROOT = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, ROOT), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped (so a comment can never satisfy a match). */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const M = 'src/screens/lab/miking';

// ── 1 · CONTENTS → the module already open keeps its steps ──────────────────
describe('F9-1 · CONTENTS → Module 1 never turns NEXT into FINISH', () => {
  const S = code(`${M}/MikingLessonScreen.tsx`);
  it('the step titles are held with the page that reported them, and a same-module jump keeps them', () => {
    // Before: goPage cleared them (`setStepTitles([])`) and the mounted page
    // never re-reported, so the strip read "1 / 7" with FINISH on every step.
    assert.doesNotMatch(S, /setStepTitles\(\[\]\)/);
    assert.match(S, /const \[reported, setReported\] = useState<\{ page: PageId; titles: string\[\] \} \| null>\(null\);/);
    assert.match(S, /const stepTitles = useMemo\(\(\) => \(reported && reported\.page === page \? reported\.titles : \[\]\), \[reported, page\]\);/);
    assert.match(S, /\{ page, titles: t \}/);
    assert.match(S, /const samePage = PAGE_IDS\.indexOf\(p\) === pageIdxNow\.current;/);
    assert.match(S, /if \(!samePage\) setStepInfo\(null\);/);
  });
});

// ── 2 · No first-render flash of TAKEAWAY + FINISH on 2.1 / 3.1 ─────────────
describe('F9-2 · a module opens without the last step’s takeaway or a FINISH button', () => {
  it('PageSteps reports its titles in a layout effect (before the first paint)', () => {
    const S = code(`${M}/engine/steps.tsx`);
    assert.match(S, /useLayoutEffect\(\(\) => \{\s*onSteps\?\.\(titleKey \? titleKey\.split\('\\u0001'\) : \[\]\);\s*\}, \[onSteps, titleKey\]\);/);
  });
  it('a composed page reports in a layout effect and gives no part the tail until its parts have reported', () => {
    const S = code(`${M}/engine/compose.tsx`);
    assert.match(S, /useLayoutEffect\(\(\) => \{\s*if \(allKey\) onSteps\?\.\(allKey\.split\('\\u0001'\)\);\s*\}, \[onSteps, allKey\]\);/);
    assert.match(S, /const \[settled, setSettled\] = useState\(false\);/);
    assert.match(S, /if \(!settled\) lastShown = -1;/);
    assert.doesNotMatch(S, /\buseEffect\(/);
  });
});

// ── 3 · A ZONE pick lands in that zone and counts ───────────────────────────
type Pick = { lesson: string; zone: string; type: string; variant: string };
function everyZonePick(): { lesson: Lesson; z: Lesson['zones'][number]; t: MicType; v: string }[] {
  const out: { lesson: Lesson; z: Lesson['zones'][number]; t: MicType; v: string }[] = [];
  for (const meta of LESSONS) {
    const lesson = lessonById(meta.id);
    if (!lesson) continue;
    for (const z of lesson.zones) {
      const types = z.requires?.micTypeIds ?? lesson.micTypeIds;
      const variants = z.requires?.variant ? [z.requires.variant] : z.requires?.variants ? [...z.requires.variants] : lesson.model.variants.map((v) => v.id);
      for (const typeId of types) {
        const t = MIC_TYPES[typeId];
        if (!t) continue;
        for (const v of variants) if (zonesAvailable(lesson.zones, v, typeId, t.mount).some((q) => q.id === z.id)) out.push({ lesson, z, t, v });
      }
    }
  }
  return out;
}
describe('F9-3 · a ZONE pick is the zone the words, the ZONE cell and the activity report', () => {
  const picks = everyZonePick();
  it('every ZONE pick in every lesson reads back as itself (overlapping zones no longer swallow it)', () => {
    const wrong: Pick[] = [];
    let shadowedBefore = 0;
    for (const { lesson, z, t, v } of picks) {
      const scene = compileScene(lesson.model, v);
      const body = micBodyOf(t);
      let pose = z.start;
      if (t.mount === 'surface') {
        const sp = lesson.model.parts.find((p) => p.id === t.surfacePartId);
        if (sp?.solid?.kind === 'box') pose = pinToSurface(pose, sp.solid, body, (t.body.width?.mm ?? 0) / 2);
      }
      const zctx = { scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, variant: v, micTypeId: t.id, mount: t.mount };
      assert.ok(inZone(z, zctx, pose), `${lesson.id} ${z.id}: its start pose is inside it`);
      if (zoneFor(lesson.zones, zctx, pose) !== z.id) shadowedBefore++;
      // What the rig reports after a ZONE pick (jumpTo with the zone id).
      const r = deriveReadouts({ scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, zones: lesson.zones, variant: v, micTypeId: t.id, body, prefer: z.id }, pose, z.refSurface, lesson.model.lines[0]?.id ?? '');
      if (!r.blocked && r.zoneId !== z.id) wrong.push({ lesson: lesson.id, zone: z.id, type: t.id, variant: v });
    }
    assert.deepEqual(wrong, []);
    // The bug was real: overlapping zones shadowed picks (F01, B07, A11 …).
    assert.ok(shadowedBefore >= 20, `${shadowedBefore} picks were shadowed by an earlier zone`);
  });
  it('Foley Footsteps (checked by hand): "Farther back" picked reads "Farther back"', () => {
    const f01 = lessonById('F01')!;
    const far = f01.zones.find((z) => /Farther back/i.test(z.label))!;
    const t = MIC_TYPES[far.requires?.micTypeIds?.[0] ?? f01.micTypeIds[0]];
    const v = f01.model.defaultVariant;
    const scene = compileScene(f01.model, v);
    const ctx = { scene, surfaces: f01.model.surfaces, lines: f01.model.lines, variant: v, micTypeId: t.id, mount: t.mount };
    assert.notEqual(zoneFor(f01.zones, ctx, far.start), far.id, 'before: the first zone in order won');
    assert.equal(zoneFor(f01.zones, ctx, far.start, far.id), far.id);
  });
  it('the rig keeps the picked zone per slot and every ZONE key passes it', () => {
    const R = code(`${M}/engine/scene/useRig.ts`);
    assert.match(R, /jumpTo: \(slot: MicSlot, to: MicPose, zoneId\?: string\) => Blocked;/);
    assert.match(R, /prefer: pz/);
    for (const f of [`${M}/pages/PPlacement.tsx`, `${M}/lessons/shared/electric/ampPages.tsx`, `${M}/lessons/shared/hand/handPages.tsx`, `${M}/lessons/shared/handdrums/pages/HPlacement.tsx`, `${M}/lessons/spk/pages.tsx`]) {
      assert.match(code(f), /rig\.jumpTo\('A', z\.start, z\.id\)/, f);
    }
  });
  it('the 13 group lessons and the sport lessons have a ZONE jump that counts', () => {
    const E = code(`${M}/lessons/shared/ensemble/ensemblePages.tsx`);
    assert.match(E, /id: 'zone', label: 'ZONE', valueLabel: zone \? 'IN ZONE' : 'GO TO', selectedId: zone\?\.id \?\? null, onSelect: goZone/);
    assert.match(E, /setMoved\(true\);\s*setPickedZone\(id\);/);
    const P = code(`${M}/lessons/shared/sports/sportsPages.tsx`);
    assert.match(P, /id: 'zone', label: 'ZONE', valueLabel: zone \? 'IN ZONE' : 'GO TO', selectedId: zone\?\.id \?\? null, onSelect: goZone/);
    assert.match(P, /setMoved\(true\);\s*setPickedZone\(id\);/);
  });
  it('the ZONE jump of a group / sport lesson always lands INSIDE the zone', () => {
    // Both helpers live in React modules: pinned by source (every point they
    // return is a fraction 0.25–0.75 of the zone's own box / rectangle).
    const E = code(`${M}/lessons/shared/ensemble/ensemblePages.tsx`);
    assert.match(E, /export function landInZone\(box: \{ min: Vec3; max: Vec3 \}, clear: \(p: Vec3\) => boolean\): Vec3 \{/);
    const P = code(`${M}/lessons/shared/sports/sportsPages.tsx`);
    assert.match(P, /export function planSpotIn\(r: PlanRect, ok: \(p: P2\) => boolean\): P2 \{/);
  });
  it('one activity wording: never "N of 2", never "7 of 2"; done is said in words', () => {
    assert.equal(zoneActivityLine([]), 'Activity: rest the mic in two different blue zones, clear of every part — none yet.');
    assert.equal(zoneActivityLine(['A']), 'Activity: rest the mic in two different blue zones, clear of every part — one so far (A).');
    assert.match(zoneActivityLine(['A', 'B']), /^Activity: done ✓ — the mic rested in two different zones/);
    const seven = zoneActivityLine(['1', '2', '3', '4', '5', '6', '7']);
    assert.doesNotMatch(seven, /of 2|\d+ of \d+/);
    for (const f of [`${M}/pages/PPlacement.tsx`, `${M}/lessons/shared/electric/ampPages.tsx`, `${M}/lessons/shared/ensemble/ensemblePages.tsx`, `${M}/lessons/shared/hand/handPages.tsx`, `${M}/lessons/shared/handdrums/pages/HPlacement.tsx`, `${M}/lessons/shared/sports/sportsPages.tsx`, `${M}/lessons/spk/pages.tsx`]) {
      const s = code(f);
      assert.doesNotMatch(s, /\$\{visited\.size\} of 2|done: \$\{visited\.size\}|\$\{visited\.size\} so far|Goal: 2\./, f);
      assert.match(s, /zoneActivityLine\(/, f);
    }
  });
  it('the dock AIM key reads a turn with its direction, the bezel AIM says "off target"', () => {
    assert.equal(aimKeyShort('el', -50), '↓ ≈ 50°');
    assert.equal(aimKeyShort('el', 5), '↑ ≈ 5°');
    assert.equal(aimKeyShort('az', -20), '← ≈ 20°');
    assert.equal(aimKeyShort('az', 0), '≈ 0°');
    assert.match(code(`${M}/engine/scene/readoutText.ts`), /sub: w\.showAim \? 'off target' : undefined/);
  });
});

// ── 4 · Typos: double full stops, a/an, US spelling ─────────────────────────
describe('F9-4 · typos', () => {
  it('the NOW line never prints "..": the zone band loses its own full stop', () => {
    assert.match(code(`${M}/engine/scene/sceneWords.ts`), /zoneLabel: z \? `\$\{z\.label\}, \$\{z\.band\.replace\(\/\[\.\\s\]\+\$\/, ''\)\}` : null,/);
    // Every lesson: a band ends in a full stop (so the old line printed ".."),
    // and no zone label does (labels are followed by "." in several lines).
    let bandsWithStop = 0;
    for (const meta of LESSONS) {
      const l = lessonById(meta.id)!;
      for (const z of l.zones) {
        if (/\.\s*$/.test(z.band)) bandsWithStop++;
        assert.doesNotMatch(z.label, /\.\s*$/, `${meta.id} ${z.id} label`);
        const line = `Zone: ${z.label}, ${z.band.replace(/[.\s]+$/, '')}.`;
        assert.doesNotMatch(line, /[^.]\.\.(?!\.)/, `${meta.id} ${z.id}`);
      }
    }
    assert.ok(bandsWithStop > 100);
  });
  it('"a euphonium", "a ukulele": the article follows the sound, in every lesson', () => {
    assert.equal(articleFor('euphonium'), 'a');
    assert.equal(articleFor('ukulele'), 'a');
    assert.equal(articleFor('unit'), 'a');
    assert.equal(articleFor('upright bass'), 'an');
    assert.equal(articleFor('oud'), 'an');
    assert.equal(articleFor('amp'), 'an');
    assert.equal(articleFor('hour'), 'an');
    assert.equal(articleFor('kick'), 'a');
    for (const meta of LESSONS) {
      const l = lessonById(meta.id)!;
      const intro = journeyIntro(l.noun);
      assert.doesNotMatch(intro, /\ban (eu|uk)/i, meta.id);
    }
    assert.match(journeyIntro({ one: 'euphonium', many: 'euphoniums' }), /on a euphonium/);
    assert.match(code(`${M}/engine/journeyKit.tsx`), /New to miking \$\{articleFor\(noun\.one\)\} \$\{noun\.one\}/);
    assert.doesNotMatch(code(`${M}/engine/journeyKit.tsx`), /\/\^\[aeiou\]\/i\.test/);
    assert.doesNotMatch(code(`${M}/lessons/shared/lutes/LutePlan.tsx`), /\/\^\[aeiou\]\/i\.test/);
  });
  it('US spelling on the sports direction lane: "center"', () => {
    assert.equal(aimWords(0), 'center');
  });
});

// ── 5 · D37: no calibration chip in a silent concept lesson ─────────────────
describe('F9-5 · the Miking header chip is the ABOUT variant (the lesson’s own note only)', () => {
  it('ABOUT, never the tool variant with its phone-calibration text', () => {
    const S = code(`${M}/MikingLessonScreen.tsx`);
    assert.match(S, /<AccuracyNote variant="about" label="ABOUT THESE STARTING POINTS" detail=\{aboutNote\(lesson\.accuracyDetail\)\} \/>/);
    assert.doesNotMatch(S, /<AccuracyNote compact detail=/);
    assert.match(S, /detail\.replace\(\/\^ABOUT THESE STARTING POINTS\\\.\\s\*\/, ''\)/);
  });
});

// ── 6 · Microphone Selection ────────────────────────────────────────────────
describe('F9-6 · Microphone Selection', () => {
  const S = code('src/screens/lab/micselect/MicSelectLabScreen.tsx');
  it('Lesson 9: the question has its follow-up — every requirement a job rates has an answer', () => {
    assert.match(S, /WHICH MICROPHONE CHARACTERISTICS SATISFY THESE REQUIREMENTS\?<\/Text>[\s{}]*<JobFit key=\{j\.key\} ratings=\{j\.ratings\} \/>/);
    assert.match(S, /label="SHOW WHAT FITS ▾"/);
    for (const g of JOB_GROUPS) for (const j of g.jobs) for (const [name] of j.ratings) assert.ok(JOB_FIT[name], `${j.name}: ${name}`);
    for (const v of Object.values(JOB_FIT)) assert.match(v, /\(Lessons? [1-8]( and [1-8])?\)$/);
  });
  it('COMPARE keeps the mic on show as the first pick', () => {
    assert.match(S, /setPair\(sel \? \[sel\] : \[\]\);\s*setCompare\(true\);/);
    assert.doesNotMatch(S, /setCompare\(\(c\) => !c\); setPair\(\[\]\);/);
    assert.match(code('src/screens/lab/micselect/micSelectScreenGuides.ts'), /Moving-Coil Dynamic stays as your first pick/);
  });
  it('the photo names read at 11 pt (were 9 px)', () => {
    assert.match(S, /micCellName: \{\s*fontFamily: fonts\.oswaldSemiBold,\s*fontSize: 11,/);
  });
});


// ════════════════════════════════════════════════════════════════════════
// PHASE 2 (coordinator, 2026-11-14): the shared mechanisms, filled in.
// ════════════════════════════════════════════════════════════════════════
import { startingSetups, typeForZone, zoneInVariant } from '../src/screens/lab/miking/engine/setups.ts';
import { LISTEN_LINES, LISTEN_RE, mentionsListening } from '../src/screens/lab/miking/engine/listenLine.ts';
import { BEZEL_CAPTION_WORDS, bezelCaption } from '../src/screens/lab/miking/engine/rack/bezelCaptions.ts';
import { MIKING_HOW_IT_COUNTS, missingLine } from '../src/screens/lab/miking/engine/progress/missingLine.ts';
import { checkFeedback, MIC_CHECK_DEFAULT, type MicCheckSpec } from '../src/screens/lab/micselect/micCheckRule.ts';

describe('F9-P2-1 · a ZONE jump that counts in every lesson (E07, M10, I01d, A03, F03, F05, F07, F09, F10, B10, B11 …)', () => {
  it('the shared Placement Studio offers every zone; one for another mic or variant switches SETUP first', () => {
    const S = code(`${M}/pages/PPlacement.tsx`);
    assert.match(S, /const pickable = lesson\.zones\.filter\(/);
    assert.match(S, /setPendingZone\(id\);/);
    assert.match(S, /if \(rig\.mics\[0\]\.typeId !== need\) rig\.setType\('A', need\);/);
    assert.match(S, /rig\.jumpTo\('A', z\.start, z\.id\);\s*if \(rig\.surfaceId !== z\.refSurface\) rig\.setSurfaceId\(z\.refSurface\);\s*setPendingZone\(null\);/);
    assert.match(S, /options: \[\.\.\.pickable\.filter\(ready\), \.\.\.pickable\.filter\(\(z\) => !ready\(z\)\)\]/);
  });
  it('every lesson has at least two pickable zones, and each one is reachable (its variant, its mic type)', () => {
    const stuck: string[] = [];
    for (const meta of LESSONS) {
      const l = lessonById(meta.id)!;
      const pickable = l.zones.filter((z) => l.micTypeIds.some((id) => l.model.variants.some((v) => zonesAvailable([z], v.id, id, MIC_TYPES[id].mount).length > 0)));
      if (pickable.length < 2) stuck.push(`${meta.id}: ${pickable.length} zone(s)`);
      for (const z of pickable) {
        const v = l.model.variants.find((q) => zoneInVariant(z, q.id));
        const t = typeForZone(l, z, MIC_TYPES);
        if (!v || !zonesAvailable([z], v.id, t, MIC_TYPES[t].mount).length) stuck.push(`${meta.id} ${z.id}`);
      }
    }
    assert.deepEqual(stuck, []);
  });
  it('before: the starting mic of these lessons had ONE zone, so two could not be reached from the key', () => {
    for (const id of ['E07', 'M10', 'I01d', 'A03', 'F03', 'F09', 'B10', 'B11']) {
      const l = lessonById(id)!;
      const v = l.model.defaultVariant;
      const t = startingSetups(l, v, MIC_TYPES)[0].mics[0].typeId;
      assert.equal(zonesAvailable(l.zones, v, t, MIC_TYPES[t].mount).length, 1, id);
    }
  });
  it('F10 (its own Placement Studio) has a ZONE key that lands inside the zone and counts', () => {
    const S = code(`${M}/lessons/f10SpatialField/pages.tsx`);
    assert.match(S, /export function landInPlaceZone\(z: PlaceZone, clear: \(c: Vec3\) => boolean\): Vec3 \{/);
    assert.match(S, /id: 'zone', label: 'ZONE', valueLabel: zone \? 'IN ZONE' : 'GO TO', selectedId: zone\?\.id \?\? null, onSelect: goZone/);
    assert.match(S, /setMoved\(true\);\s*setPickedZone\(id\);/);
    assert.match(S, /zoneActivityLine\(\[\.\.\.visited\]/);
  });
});

describe('F9-P2-2 · "Can’t listen now?" on every step whose words say listen', () => {
  it('finds listening in strings, element children and data props; never "listener"; never a research quote', () => {
    const el = (props: Record<string, unknown>) => ({ type: 'X', props });
    assert.ok(mentionsListening(el({ children: [el({ prompt: 'Rest it, then listen for what changes.' })] })));
    assert.ok(mentionsListening(el({ z: { label: 'Close', tendency: 'LISTEN FOR the attack' } })));
    assert.ok(mentionsListening(el({ p: { prompt: 'x', options: ['Listen closely', 'b'] } })));
    assert.ok(!mentionsListening(el({ children: 'Where a listener would stand.' })));
    assert.ok(!mentionsListening(el({ z: { label: 'Close', quote: 'listen to the room' } })));
    assert.ok(!mentionsListening(el({ rig: { lesson: { zones: [{ tendency: 'listen' }] } } })), 'a whole lesson behind a prop is never read');
    assert.ok(LISTEN_RE.test('LISTEN FOR'));
  });
  it('one line per step kind, each starting the same way and pointing at the display', () => {
    const kinds = ['WATCH', 'LEARN', 'TRY', 'COMPARE', 'PLACE', 'LIVE', 'PAIR', 'POLARITY', 'CHECK', 'PRACTICE', 'READ'] as const;
    for (const k of kinds) assert.match(LISTEN_LINES[k], /^Can’t listen now\? Nothing in this lab makes a sound\. /, k);
    const S = code(`${M}/engine/steps.tsx`);
    assert.match(S, /const listen = mentionsListening\(s\.layout === 'rack' \? s\.well : s\.body\) \? <Note>\{LISTEN_LINES\[s\.kind\]\}<\/Note> : null;/);
    assert.match(S, /\{head\}\s*\{listen\}\s*\{s\.well\}/);
    assert.match(S, /\{head\}\s*\{listen\}\s*\{s\.body\}/);
  });
});

describe('F9-P2-3 · bezel captions for code labels (first visit)', () => {
  it('codes get plain words of at most 14 characters; plain labels get none', () => {
    for (const w of BEZEL_CAPTION_WORDS) assert.ok(w.length <= 14, w);
    assert.equal(bezelCaption('1ST NOTCH'), 'a dip in tone');
    assert.equal(bezelCaption('▸ DELAY Δt B−A'), 'arrives later');
    assert.equal(bezelCaption('PATH Δd B−A'), 'extra distance');
    assert.equal(bezelCaption('PICKUP'), 'how loud');
    assert.equal(bezelCaption('NULL'), 'quietest angle');
    assert.equal(bezelCaption('IN 90°'), 'in its angle');
    assert.equal(bezelCaption('HEIGHT'), undefined);
    assert.equal(bezelCaption('AIM'), undefined, 'AIM already carries "off target"');
  });
  it('MikingRack applies them to every Miking bezel, never over a lesson’s own caption', () => {
    assert.match(code(`${M}/engine/rack/MikingRack.tsx`), /const caption = b\.caption \?\? bezelCaption\(b\.k\);/);
  });
});

describe('F9-P2-4 · check cards: a reason per wrong option, the answer only after a second miss', () => {
  it('Miking: every wrong option of every check and symptom in all 128 lessons has its own reason', () => {
    let wrong = 0;
    for (const meta of LESSONS) {
      const l = lessonById(meta.id)!;
      for (const s of [...l.scenarios, ...l.symptoms]) {
        for (const o of s.options) {
          if (o === s.correct) continue;
          wrong++;
          assert.ok(s.why?.[o], `${meta.id} ${s.id}: ${o}`);
        }
      }
    }
    assert.ok(wrong > 8000);
  });
  it('Miking card: first miss = that option’s reason; a second different miss adds the explanation', () => {
    assert.match(code(`${M}/engine/kit.tsx`), /`✗ \$\{whyOf\(picked\)\} \$\{wrong\.length >= 2 \? s\.explain : 'Choose again\.'\}`/);
  });
  it('Mic Selection: its own CHECK YOURSELF cards give a reason per wrong option (rule)', () => {
    const spec: MicCheckSpec = { question: 'q', options: ['right', 'a', 'b'], correctIdx: 0, reveal: 'R.', why: { 1: 'Why not a.' } };
    assert.equal(checkFeedback(spec, null, []), null);
    assert.deepEqual(checkFeedback(spec, 0, []), { right: true, text: '✓ R.' });
    assert.deepEqual(checkFeedback(spec, 1, [1]), { right: false, text: 'NOT QUITE — TRY ANOTHER · Why not a.' });
    assert.deepEqual(checkFeedback(spec, 2, [1, 2]), { right: false, text: `NOT QUITE · ${MIC_CHECK_DEFAULT} R.` });
  });
  it('Mic Selection: both cards have a reason for every wrong option; the answer is not the longest', () => {
    const S = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
    assert.doesNotMatch(code('src/screens/lab/micselect/MicSelectLabScreen.tsx'), /<CheckQuestion/);
    const blocks = [...S.matchAll(/<MicCheck\s+spec=\{\{([\s\S]*?)\n\s*\}\}\s*\/>/g)].map((m) => m[1]);
    assert.equal(blocks.length, 2);
    for (const b of blocks) {
      const options = [...(/options: \[([^\]]*)\]/.exec(b)![1].matchAll(/'((?:[^'\\]|\\.)*)'/g))].map((m) => m[1]);
      const correctIdx = Number(/correctIdx: (\d)/.exec(b)![1]);
      assert.equal(options.length, 3);
      for (let i = 0; i < options.length; i++) if (i !== correctIdx) assert.match(b, new RegExp(`\\n\\s*${i}: '`), `why for option ${i}`);
      const lens = options.map((o) => o.length);
      assert.ok(lens[correctIdx] < Math.max(...lens), `the answer is not the longest: ${options[correctIdx]}`);
    }
  });
  it('the CHECK guide lines say what the cards now do (S2’s sentence on the end check)', () => {
    const G = read('src/screens/lab/micselect/micSelectScreenGuides.ts');
    assert.match(G, /Wrong: NOT QUITE — TRY ANOTHER says what to look at again; a second wrong pick also shows the explanation\. Nothing is lost and there is no score\./);
    assert.match(G, /A wrong one says why that one is not it \(a second wrong pick adds the explanation\)/);
  });
});

describe('F9-P2-5 · end screens: each row names what it is missing; WHERE TO START is state-neutral', () => {
  it('Miking: a row names the missing activity and the checks still to answer', () => {
    const c = { scenarios: ['a', 'b', 'c'], interactive: 'twoZones', note: 'Rest the mic … and answer the three checks.' };
    assert.equal(missingLine(c, {}, new Set()), 'Still to do: rest the mic in two different blue zones, then answer its 3 checks.');
    assert.equal(missingLine(c, { a: true }, new Set(['twoZones'])), 'Still to do: answer 2 more checks.');
    assert.equal(missingLine({ scenarios: [], note: 'n' }, {}, new Set()), 'Still to do: read it to its last step and press NEXT.');
    assert.match(missingLine({ scenarios: [], interactive: 'probe', note: 'Run the probe both ways.' }, {}, new Set()), /its activity\. Run the probe both ways\.$/);
    const S = code(`${M}/MikingLessonScreen.tsx`);
    assert.match(S, /detail: `\$\{missingLine\(pageOf\(lesson, id\)\.credit, answers, interactiveDone\)\}/);
    assert.match(S, /howItCounts=\{MIKING_HOW_IT_COUNTS\}/);
    assert.match(MIKING_HOW_IT_COUNTS, /^A module counts/);
  });
  it('Mic Selection: a row per lesson with its own line, the shared rule said once', () => {
    const src = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
    const keys = [...src.matchAll(/^\s{4}key: '([a-z]+)',$/gm)].map((m) => m[1]);
    assert.equal(keys.length, 11);
    for (const k of keys) assert.match(src, new RegExp(`\\n  ${k}: 'Not opened yet|\\n  ${k}: 'Optional, still counts`), k);
    assert.match(code('src/screens/lab/micselect/MicSelectLabScreen.tsx'), /howItCounts=\{MICSEL_HOW_IT_COUNTS\}/);
  });
  it('both end guides start from WHERE TO START (their text never depends on the learner’s state)', () => {
    assert.match(read(`${M}/mikingScreenGuides.ts`), /start: 'Read WHERE TO START at the top: it names the next thing to do from where you are\./);
    assert.match(read('src/screens/lab/micselect/micSelectScreenGuides.ts'), /start: 'Read WHERE TO START at the top: it names the next thing to do from where you are\./);
  });
});

describe('F9-P2-6 · arrival: the screen the Miking Labs open on has an intro card', () => {
  it('the family hub guide carries an intro (the lab term rides on top of it)', () => {
    assert.match(code(`${M}/mikingScreenGuides.ts`), /export function mikingHubGuide\([^)]*\): ScreenGuide \{[\s\S]{0,400}intro: \{\s*learning: 'One silent, drawn lesson per instrument or source\./);
  });
});
