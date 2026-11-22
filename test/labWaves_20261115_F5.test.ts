// 2026-11-21 owner (tester on a tablet): learner text says "this device", never "this phone".
/**
 * Beginner waves 1-3 (2026-11-15), group F5: Wave Physics, Speaker Placement,
 * Room Design, Understanding Level & Amplitude, Foundations of Sound, Sound
 * Playground, Microphone Principles.
 * Owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan). [MD:D62]
 *
 * Each block would have failed before its change (it rules out the old order,
 * the old string or the old rule). Report:
 * docs/labs/beginner_waves_2026_11_15/F5_REPORT.md
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source without comments: what can reach the screen. */
const code = (p: string) =>
  read(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/[ \t]\/\/ .*$/gm, '');

const W = 'src/screens/lab/wave/';

// ─── Wave Physics ─────────────────────────────────────────────────────────────

describe('WA-09 · Room Builder opens on WHAT TO TRY', () => {
  it('WHAT TO TRY and its three recipes come before the neighbors section', () => {
    const src = code(`${W}modules/modWaveB.tsx`);
    const tryAt = src.indexOf('>WHAT TO TRY<');
    const neighborsAt = src.indexOf('OUTSIDE THE ROOM — WHAT THE NEIGHBORS HEAR');
    assert.ok(tryAt > 0 && neighborsAt > 0);
    assert.ok(tryAt < neighborsAt, 'WHAT TO TRY must open the panel');
    const between = src.slice(tryAt, neighborsAt);
    for (const r of ['Build a cardioid', 'Find a comb', 'Meet your room modes']) assert.ok(between.includes(r), r);
    // The neighbors model note still shows, right after its own section.
    assert.ok(src.slice(neighborsAt, neighborsAt + 900).includes('<PlainModelNote>What gets through'));
  });
});

// ─── Speaker Placement & Coverage ─────────────────────────────────────────────

const MS = 'src/screens/lab/micspeaker/';

describe('SPK-03 · the map marks the box the sliders move', () => {
  it('TopCoverageView takes `selected` and rings that box in its own color', () => {
    const v = code(`${MS}viz.tsx`);
    assert.match(v, /selected\?: 'spk1' \| 'spk2' \| 'fills';/);
    assert.match(v, /ring=\{s\.role === selected \? \(s\.tint \?\? SPK1_RING\) : undefined\}/);
    // Every cabinet carries its role, so the ring can find it (fills ring as a pair).
    assert.match(v, /role: 'spk1' \}/);
    assert.match(v, /tint: ACCENT_BLUE, role: 'spk2' \}/);
    assert.match(v, /tint: ACCENT_GREEN, role: 'fills' \}/);
    // Speaker 1's ring is the dock slider's own amber.
    assert.match(v, /const SPK1_RING = '#ffc64d';/);
    assert.match(read('src/theme/tokens.ts'), /amber: '#ffc64d'/);
  });
  it('the screen passes the slider target, and no ring while there is only one box', () => {
    const s = code(`${MS}SpeakerCoverageLabScreen.tsx`);
    assert.match(s, /selected=\{!twoOn && !fills \? undefined : fillsTarget \? 'fills' : spkEditable2 \? 'spk2' : 'spk1'\}/);
  });
});

describe('SPK-04 · the TOP VIEW card gives the plain job', () => {
  it('learning + start say the flashlight, the dark seats and "light up every seat"', async () => {
    const { SPEAKER_SCREEN_GUIDES } = await import('../src/screens/lab/micspeaker/micSpeakerScreenGuides.ts');
    const intro = SPEAKER_SCREEN_GUIDES.top.intro!;
    assert.match(intro.learning, /^A speaker is a flashlight for sound/);
    assert.match(intro.learning, /Dark seats can’t hear well\.$/);
    assert.match(intro.start, /^Your job: light up every seat\./);
    assert.ok(intro.start.trim().split(/\s+/).length <= 40);
  });
});

// ─── Room Design & Monitoring ────────────────────────────────────────────────

const RD = 'src/screens/lab/roomdesign/';

describe('RO-02 · the bass-map caption on the plan is in plain words', async () => {
  const { modeCaptionLines } = await import('../src/screens/lab/roomdesign/modeCaption.ts');
  it('the lowest length mode reads as the lowest front-to-back bass note', () => {
    assert.deepEqual(modeCaptionLines({ nx: 1, ny: 0, nz: 0, f: 34.3, kind: 'axial' }), [
      'Lowest front-to-back bass note (34.3 Hz)',
      'At ear height: red piles up, blue vanishes (shape only)',
    ]);
    assert.equal(modeCaptionLines({ nx: 0, ny: 2, nz: 0, f: 85.75, kind: 'axial' })[0], 'Second side-to-side bass note (85.8 Hz)');
    assert.equal(modeCaptionLines({ nx: 0, ny: 0, nz: 1, f: 68.6, kind: 'axial' })[0], 'Lowest floor-to-ceiling bass note (68.6 Hz)');
    assert.equal(modeCaptionLines({ nx: 1, ny: 1, nz: 0, f: 60, kind: 'tangential' })[0], 'Bass note between four surfaces (60.0 Hz)');
    assert.equal(modeCaptionLines({ nx: 1, ny: 1, nz: 1, f: 90, kind: 'oblique' })[0], 'Bass note between all six surfaces (90.0 Hz)');
  });
  it('no code words reach the plan, and each line fits a phone glass (≤ 56 characters)', () => {
    const src = code(`${RD}RoomPlanView.tsx`);
    assert.doesNotMatch(src, /SHAPE, NOT EXCITATION|PRESSURE AT EAR HEIGHT|`MODE \(/);
    assert.match(src, /modeCaptionLines\(heat\.mode\)\[0\]/);
    for (const m of [
      { nx: 3, ny: 0, nz: 0, f: 149.9, kind: 'axial' as const },
      { nx: 0, ny: 0, nz: 2, f: 137.2, kind: 'axial' as const },
      { nx: 1, ny: 1, nz: 1, f: 149.9, kind: 'oblique' as const },
    ]) for (const l of modeCaptionLines(m)) assert.ok(l.length <= 56, l);
  });
  it('the axes match the model: nx is the length, ny the width', () => {
    // RoomPlanView feeds the plan's y (front to back) as the model's x (length).
    assert.match(code(`${RD}RoomPlanView.tsx`), /modePressure\(mL, mW, mH, mode, y - b\.minY, x - b\.minX, earZ\)/);
  });
});

// ─── Understanding Level & Amplitude ─────────────────────────────────────────

describe('AMP-04 · one popup, one promise', () => {
  it('the lab card says it teaches one thing, and no longer promises peak, RMS and dB SPL', async () => {
    const { AMPLITUDE_SCREEN_GUIDES } = await import('../src/screens/lab/amplitude/amplitudeScreenGuides.ts');
    const l = AMPLITUDE_SCREEN_GUIDES.lab.intro!.learning;
    assert.match(l, /^This lab teaches one thing: the color key every Academy display uses for level: cooler means less, warmer means more\./);
    assert.match(l, /Shown on six displays, then three quick questions\.$/);
    assert.ok(l.split(/\s+/).length <= 30);
    assert.doesNotMatch(l, /peak|RMS|dB SPL/i);
  });
});

// ─── Foundations of Sound ────────────────────────────────────────────────────

const F = 'src/screens/lab/foundations/';

describe('FO-01 / FO-02 · Module 7 after the guess', () => {
  const src = code(`${F}FoundationsCourseScreen.tsx`);
  const m7 = src.slice(src.indexOf('function M7Rack('), src.indexOf('function M8Rack('));
  it('FO-02: THE GOAL renders only after TIME or SPACE is tapped', () => {
    const goalAt = m7.indexOf('>THE GOAL<');
    const gateAt = m7.indexOf('{predicted == null ? null : (\n        <>');
    assert.ok(gateAt > 0 && goalAt > gateAt, 'THE GOAL sits inside the after-the-guess branch');
  });
  it('FO-01: the room waits for a tap; first the recording view alone', () => {
    assert.match(m7, /const \[roomShown, setRoomShown\] = useState\(false\);/);
    assert.match(m7, /showRoom=\{roomShown\}/);
    assert.match(m7, /onPress=\{\(\) => setRoomShown\(true\)\}/);
    assert.match(m7, />SAME WAVE, IN THE ROOM ›</);
    const viz = code(`${F}viz.tsx`);
    const dd = viz.slice(viz.indexOf('export function DualDomainView('), viz.indexOf('const ddStyles'));
    assert.match(dd, /showRoom = true,/);
    // The room's panel, label and cable strip sit inside the showRoom branch; the scope does not.
    const branch = dd.indexOf('{showRoom ? (');
    assert.ok(branch > 0 && dd.indexOf('THE ROOM — CAMERA FLASH') > branch);
    assert.ok(dd.indexOf('SAME SPOT:') > branch && dd.indexOf(') : null}') > dd.indexOf('SAME SPOT:'));
    assert.ok(dd.indexOf('THE MIC&#8217;S OUTPUT') > dd.indexOf(') : null}'));
  });
  it('FO-01: the steps sit on the display, FREEZE first, and leave the reading well', () => {
    const render = m7.slice(m7.indexOf('render: (w, h) =>'), m7.indexOf('{wellTop}'));
    assert.ok(render.indexOf('1 · FREEZE') > 0 && render.indexOf('2 · DRAG THE PROBE') > render.indexOf('1 · FREEZE'));
    const well = m7.slice(m7.indexOf('{wellTop}'));
    assert.doesNotMatch(well, /WATCH|· FREEZE|DRAG THE PROBE/);
    // The dock's first key is FREEZE.
    const firstId = /const params: DockParam\[\] = \[\s*\{\s*kind: '(\w+)',\s*id: '(\w+)'/.exec(m7);
    assert.deepEqual(firstId?.slice(1), ['toggle', 'freeze']);
  });
  it('FO-01: the guide names the new steps and the room key', async () => {
    const G = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
    const m7g = (G as unknown as { FOUNDATIONS_SCREEN_GUIDES: Record<string, { intro: { start: string } }> }).FOUNDATIONS_SCREEN_GUIDES?.m7;
    const t = JSON.stringify(m7g ?? read(`${F}foundationsScreenGuides.ts`));
    assert.match(t, /1 · FREEZE, then 2 · DRAG THE PROBE/);
    assert.match(t, /SAME WAVE, IN THE ROOM ›/);
    assert.doesNotMatch(t, /1 · WATCH/);
  });
});

// ─── Sound Playground ────────────────────────────────────────────────────────

describe('PG-02 · the SOURCE tray opens on the four shapes; one MORE CONTROLS fold holds the rest', () => {
  const src = code(`${F}FoundationsPlaygroundScreen.tsx`);
  const params = src.slice(src.indexOf('const params: DockParam[] = ['), src.indexOf('return (\n    <View style={[styles.root'));
  it('the dock is FREQ, LEVEL, SOURCE (+ PLAY): no separate FX key', () => {
    const ids = [...params.matchAll(/\n {6}id: '(\w+)'/g)].map((m) => m[1]);
    assert.deepEqual(ids.filter((i) => i !== 'play'), ['freq', 'level', 'source']);
    assert.doesNotMatch(params, /id: 'fx'/);
  });
  it('WAVE comes first; noise, harmonics, phase and FX sit inside MORE CONTROLS', () => {
    const fold = params.indexOf('<CollapsibleSection title="MORE CONTROLS" startOpen={moreInUse}>');
    assert.ok(fold > params.indexOf('>WAVE<'), 'the four shapes come before the fold');
    const close = params.indexOf('</CollapsibleSection>');
    for (const name of ['NOISE · SWEEP', 'HARMONIC RICHNESS', 'PHASE · POLARITY', '>FX<', 'STEREO BALANCE', '>DELAY<', 'EQ LOW-PASS']) {
      const at = params.indexOf(name);
      assert.ok(at > fold && at < close, `${name} is inside the fold`);
    }
  });
  it('the fold opens by itself while anything in it is in use', () => {
    assert.match(src, /const moreInUse = source !== 'wave' \|\| keep !== 12 \|\| phase !== 0 \|\| inverted \|\| panOn \|\| delayMs > 0 \|\| eqCut > 0;/);
  });
});

describe('PG-01 · the Playground says it comes after Foundations of Sound, and leads there', () => {
  it('the page subtitle is the line, and a tap opens Foundations of Sound', () => {
    const src = code(`${F}FoundationsPlaygroundScreen.tsx`);
    assert.match(src, /export const PLAYGROUND_AFTER_LINE = 'Best after Foundations of Sound; every control here was taught there';/);
    assert.match(src, /onPress=\{\(\) => navigation\.navigate\('FoundationsCourse' as never\)\}[\s\S]{0,400}\{PLAYGROUND_AFTER_LINE\} ›/);
    assert.doesNotMatch(src, />Drive the views, hear the change/);
    assert.match(read('src/navigation/types.ts'), /FoundationsCourse: undefined;/);
  });
  it('the intro card opens on the same words', async () => {
    const { PLAYGROUND_SCREEN_GUIDE } = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
    assert.match(PLAYGROUND_SCREEN_GUIDE.intro!.learning, /^Best after Foundations of Sound; every control here was taught there\./);
  });
});

// ─── Microphone Principles ───────────────────────────────────────────────────

describe('MI-04 · the lab opens on PICKUP PATTERNS; the capsule is last, for the curious', () => {
  const src = code(`${MS}MicPrinciplesLabScreen.tsx`);
  const keys = [...src.matchAll(/\bkey:\s*'([a-z]+)'\s*,\s*label:\s*'[^']*'\s*,\s*title:/g)].map((m) => m[1]);
  it('SECTIONS start on polar and end on capsule; the static unit list matches', async () => {
    assert.equal(keys[0], 'polar');
    assert.equal(keys[keys.length - 1], 'capsule');
    const { MIC_PRINCIPLES_UNITS } = await import('../src/screens/lab/micspeaker/units.ts');
    assert.deepEqual([...MIC_PRINCIPLES_UNITS], keys);
    assert.equal(new Set(keys).size, 10, 'same ten ids: nothing banked is orphaned');
  });
  it('the first words a beginner reads are the hands-on ones', () => {
    assert.match(src, /key: 'polar', label: 'POLAR', title: 'PICKUP PATTERNS', blurb: 'A microphone hears some directions better than others\. Drag the speaker around the mic/);
    assert.match(src, /key: 'capsule', label: 'CAPSULE', title: 'FOR THE CURIOUS: INSIDE THE CAPSULE', blurb: 'How a dynamic mic/);
  });
  it('FINISH at the foot of the last no-check module counts it, as NEXT does elsewhere (never from CONTENTS mid-lab)', () => {
    assert.match(src, /finish: \(\) => \{\n\s*if \(sectionIdx === SECTIONS\.length - 1 && MIC_NO_CHECK\.has\(SECTIONS\[sectionIdx\]\.key\)\) creditSection\(sectionIdx\);\n\s*setEnding\(true\);/);
  });
});

describe('WA-06 · the Wave home is four plain groups, each row with plain words', () => {
  it('four groups cover modules 1–15 once each, in module order', async () => {
    const { WAVE_GROUPS, WAVE_MODULES, WAVE_PLAIN } = await import('../src/screens/lab/wave/modules/registry.ts');
    assert.deepEqual(WAVE_GROUPS.map((g) => g.title), ['SOUND MEETS A WALL', 'SOUND BENDS AND ADDS UP', 'SPEAKERS', 'ECHO AND REVERB']);
    const flat = WAVE_GROUPS.flatMap((g) => [...g.ids]);
    assert.deepEqual(flat, WAVE_MODULES.filter((m) => m.id !== 'builder').map((m) => m.id));
    for (const m of WAVE_MODULES) {
      const p = WAVE_PLAIN[m.id];
      assert.ok(p && p.length <= 36, `${m.id}: a short plain subtitle`);
      assert.doesNotMatch(p, /\b(RT60|dB|Hz|ms|α|axial|specular|directivity|refraction|diffraction)\b/i, `${m.id}: plain words`);
    }
  });
  it('the home draws the groups and the subtitles; "MODULES 1–15" is gone', () => {
    const home = code(`${W}WaveLabHomeScreen.tsx`);
    assert.doesNotMatch(home, /MODULES 1–15/);
    assert.match(home, /WAVE_GROUPS\.map\(\(g\) =>/);
    assert.equal((home.match(/subtitle=\{WAVE_PLAIN\[/g) ?? []).length, 2, 'module rows and the Room Builder');
    // The shared row draws the subtitle only when given one (other hubs unchanged).
    const row = code('src/screens/lab/ModuleAccordionRow.tsx');
    assert.match(row, /\{subtitle \? <Text style=\{styles\.subtitle\}>\{subtitle\}<\/Text> : null\}/);
  });
});

describe('SPK-02 · each speaker word gets its plain meaning where modules 1 and 2 first use it', () => {
  const src = code(`${MS}SpeakerCoverageLabScreen.tsx`);
  it('TOP VIEW: PATTERN, dead zones and FILLS are glossed in its first text', () => {
    assert.match(src, /choose their PATTERN \(how wide they spread\)/);
    assert.match(src, /Black seats \(dead zones\) get no useful sound: add SPKR 2 or FILLS \(small speakers on the stage lip\)/);
    assert.doesNotMatch(src, /choose their dispersion/);
  });
  it('the TOP VIEW notes gloss overlap and mains before the check that uses them', () => {
    const notes = src.indexOf('Where two speakers overlap (cover the same seats)');
    const mains = src.indexOf('the mains (the main\n                speakers)');
    const check = src.indexOf('<CheckQuestion spec={TOP_CHECK} />');
    assert.ok(notes > 0 && mains > notes && check > mains);
  });
});

describe('RO-06 · Room Design opens on the floor plan with a step card', () => {
  it('module 1 is Create the room; the reading module follows, before Monitoring setup', async () => {
    const { ROOM_MODULES } = await import('../src/screens/lab/roomdesign/registry.ts');
    assert.deepEqual(ROOM_MODULES.map((m) => [m.num, m.id]), [
      ['1', 'create'], ['2', 'intro'], ['3', 'monitoring'], ['4', 'explore'], ['5', 'suggest'], ['6', 'treatment'], ['7', 'review'],
    ]);
  });
  it('the card names the six steps and starts with dragging a corner', async () => {
    const { ROOM_SCREEN_GUIDES } = await import('../src/screens/lab/roomdesign/roomdesignScreenGuides.ts');
    const intro = ROOM_SCREEN_GUIDES.create.intro!;
    assert.match(intro.learning, /^Build a model of your room in steps: size, speakers, where you sit, suggested setups, panels, your report\./);
    assert.match(intro.start, /^Drag a corner of the room to reshape it\./);
    assert.match(ROOM_SCREEN_GUIDES.intro.intro!.start, /tap NEXT to open Monitoring setup\.$/);
  });
  it('HEARING FIRST still comes before any monitoring module', async () => {
    const { ROOM_MODULES } = await import('../src/screens/lab/roomdesign/registry.ts');
    const ids = ROOM_MODULES.map((m) => m.id);
    assert.ok(ids.indexOf('intro') < ids.indexOf('monitoring'));
    assert.match(read(`${RD}modules/modIntro.tsx`), /<SectionTitle title="HEARING FIRST" \/>/);
  });
});

describe('AMP-01 · each of the six cards says what to look for, inside its caption', () => {
  const amp = code('src/screens/lab/amplitude/AmplitudeOrientation.tsx');
  it('VizCard requires lookFor and prints it in the caption text (no new element)', () => {
    assert.match(amp, /lookFor: string;/);
    assert.match(amp, /<Text style=\{styles\.cardCaption\}>\s*\{caption\}\s*\{'\\n'\}\s*<Text style=\{styles\.cardLookFor\}>Look for: <\/Text>\s*\{lookFor\}\s*<\/Text>/);
  });
  it('all six cards carry a short line; WAVEFORM reads the owner example', () => {
    const lines = [...amp.matchAll(/lookFor="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(lines.length, 6);
    assert.equal(lines[0], 'taller = louder; the tall spot is the burst');
    for (const l of lines) assert.ok(l.length <= 44, l);
  });
  it('a line out: the 78-vs-PEAK sentence left the paragraph above the cards (its example is the SPL card line)', () => {
    assert.match(amp, /Each display colors its OWN scale: near the top of that scale is warm, whatever the number\.\s*<\/Text>/);
    assert.doesNotMatch(amp, /is green-yellow while PEAK −3/);
  });
});

describe('FO-03 · plain words for dB, 8ve and F0 where they first appear', () => {
  const src = code(`${F}FoundationsCourseScreen.tsx`);
  it('Module 9 says what dB is, in the ONE shared sentence (plainTerms.ts), before its readouts', async () => {
    const { PLAIN_TERMS } = await import('../src/features/lab/plainTerms.ts');
    assert.match(src, /import \{ PLAIN_TERMS \} from '\.\.\/\.\.\/\.\.\/features\/lab\/plainTerms';/);
    assert.match(src, /const DB_LINE = `SEND and HEARD count in \$\{PLAIN_TERMS\.db\.term\}: \$\{PLAIN_TERMS\.db\.sentence\.charAt\(0\)\.toLowerCase\(\)\}\$\{PLAIN_TERMS\.db\.sentence\.slice\(1\)\}`;/);
    const m9 = src.slice(src.indexOf("key: 'm9',"), src.indexOf('Rack: M9Rack,'));
    assert.match(m9, /\n\s*DB_LINE,\n/);
    assert.ok(PLAIN_TERMS.db.sentence.startsWith('How much stronger or weaker'));
    // A line out: the paragraph after it is shorter.
    assert.doesNotMatch(m9, /visibly \(audibly\)/);
  });
  it('"8ve" never reaches the screen: keys, lane and readout say octave(s)', () => {
    assert.doesNotMatch(src, /8ve/);
    assert.match(src, /const octWord = \(n: number\) => \(Math\.abs\(n - 1\) < 0\.005 \? 'octave' : 'octaves'\);/);
    assert.match(src, /\{ k: 'ABOVE 110', v: `\+\$\{octAbove\.toFixed\(2\)\} \$\{octWord\(octAbove\)\}`/);
  });
  it('F0 is named where it first appears (module 11)', () => {
    assert.match(src, /H1, the fundamental \(F0 on the readouts: the note itself\), is at the BOTTOM/);
  });
});

describe('MI-03 · "monitor wedge" and "rear ports" get plain words where first met', () => {
  const src = code(`${MS}MicPrinciplesLabScreen.tsx`);
  it('PICKUP PATTERNS (the first module) glosses both before or inside its check', () => {
    const polar = src.slice(src.indexOf("title=\"WHAT'S HAPPENING\" onHelp={() => help('polar_pattern')}"));
    const gloss = polar.indexOf('the monitor\n          wedge (a floor speaker pointing back at the performer)');
    const check = polar.indexOf("question: 'Where does the monitor wedge go for a cardioid vocal mic?'");
    assert.ok(gloss > 0 && check > gloss, 'the wedge is explained before the check asks about it');
    assert.match(polar, /Cover the rear ports \(the small openings behind the grille that make it directional; HAND GRIP shows how\)/);
  });
});

describe('WA-05 · RT60 is said once, in the shared sentence, in module 2 and at the top of module 15', () => {
  it('module 2 says it before "the RT60 table"; module 15 opens its text with it', async () => {
    const { PLAIN_TERMS } = await import('../src/features/lab/plainTerms.ts');
    assert.match(PLAIN_TERMS.rt60.sentence, /^RT60 is the decay time/);
    const a = code(`${W}modules/modWaveA.tsx`);
    const abs = a.slice(a.indexOf('export function AbsorptionModule('), a.indexOf('MODULE 3 — DIFFUSION'));
    const def = abs.indexOf('{PLAIN_TERMS.rt60.sentence}');
    assert.ok(def > 0 && def < abs.indexOf('the RT60 table'), 'defined before first use');
    assert.doesNotMatch(abs, /Thin panels simply sit in still air/, 'a sentence out');
    const b = code(`${W}modules/modWaveB.tsx`);
    const rev = b.slice(b.indexOf('export function ReverbModule('));
    const readouts = rev.slice(rev.indexOf('readouts={'));
    assert.ok(readouts.indexOf('{PLAIN_TERMS.rt60.sentence}') > 0 && readouts.indexOf('{PLAIN_TERMS.rt60.sentence}') < readouts.indexOf('<FoldedReadoutGrid'), 'first, above the RT60 readouts');
    // The model's honesty clause stays.
    assert.match(readouts, /the model’s image sources only begin to sketch/);
    // No lab-made RT60 definition beside the shared one.
    for (const src of [abs, readouts]) assert.doesNotMatch(src, /RT60 is how long/);
  });
});

describe('SPK-01 · the side view says it is a side view', () => {
  it('SideCoverageView draws the label at ≥ 9 pt, once, above the ceiling line', () => {
    const v = code(`${MS}viz.tsx`);
    assert.match(v, /export const SIDE_VIEW_LABEL = 'SIDE VIEW: stage on the left, back wall on the right';/);
    const side = v.slice(v.indexOf('export function SideCoverageView('));
    const body = side.slice(0, side.indexOf('\nexport function') > 0 ? side.indexOf('\nexport function') : undefined);
    assert.equal((body.match(/\{SIDE_VIEW_LABEL\}/g) ?? []).length, 1);
    assert.match(body, /fontSize: Math\.max\(9, 9\.5 \* ts\)[\s\S]{0,120}\{\.\.\.fitValue\(Math\.max\(9, 9\.5 \* ts\)\)\}\s*>\s*\{SIDE_VIEW_LABEL\}/);
    // Not on the top view.
    const top = v.slice(v.indexOf('export function TopCoverageView('), v.indexOf('export function SideCoverageView('));
    assert.doesNotMatch(top, /SIDE_VIEW_LABEL/);
  });
});

describe('RO-03 · the treatment page says once what RT60 is, in the shared sentence', () => {
  it('the second paragraph opens with PLAIN_TERMS.rt60.sentence, before "the RT60 estimate"', () => {
    const t = code(`${RD}modules/modTreatment.tsx`);
    assert.match(t, /import \{ PLAIN_TERMS \} from '\.\.\/\.\.\/\.\.\/\.\.\/features\/lab\/plainTerms';/);
    const at = t.indexOf('{PLAIN_TERMS.rt60.sentence} Compare, don');
    assert.ok(at > 0 && at < t.indexOf('read the RT60 estimate'));
    assert.equal((t.match(/PLAIN_TERMS\.rt60\.sentence/g) ?? []).length, 1, 'once');
    assert.doesNotMatch(t, /makes mixes sound dry everywhere else/, 'a line out');
  });
});

// ─── Sweep items, per lab ────────────────────────────────────────────────────

describe('SH-14 · a listening step offers a sound-off way past it (Foundations module 10)', () => {
  it('HEAR DRIFTING carries "(Needs sound. Sound off? …)" like the course’s other listening steps', async () => {
    const { FOUNDATIONS_SCREEN_GUIDES, FOUNDATIONS_M7_COVER_GUIDE } = await import('../src/screens/lab/foundations/foundationsScreenGuides.ts');
    const t = FOUNDATIONS_SCREEN_GUIDES.m10.tryThis.find((x: string) => x.includes('HEAR DRIFTING'))!;
    assert.match(t, /\(Needs sound\. Sound off\? PRESET 180° shows the moment they cancel\.\)$/);
    assert.ok(t.length <= 200);
    assert.match(FOUNDATIONS_M7_COVER_GUIDE.tryThis.join(' '), /listen while you decide\. \(Needs sound\. Sound off\? The picture is enough\.\)/);
  });
});

describe('SH-64 · a control the choice ignores greys out with its reason (Sound Playground FREQ)', () => {
  it('FREQ is locked, with a reason, for noise and the sweeps', () => {
    const src = code(`${F}FoundationsPlaygroundScreen.tsx`);
    assert.match(src, /id: 'freq',[\s\S]{0,200}locked: source === 'wave' \? undefined : 'noise and sweeps have no single pitch: pick a wave shape',/);
  });
});

describe('SH-37 · no "update the app" line in learner text', () => {
  it('the shared animated-view card says what still works, with no update instruction', () => {
    const bits = code(`${F}bits.tsx`);
    const card = bits.slice(bits.indexOf('export function VizUnavailableCard('), bits.indexOf('export function ConceptBadge('));
    assert.doesNotMatch(card, /update the app|APP UPDATE|dev build/i);
    assert.match(card, /THE ANIMATED VIEW DOESN’T SHOW ON THIS DEVICE/);
    // The two engine lines in the course stay developer-only.
    const course = read(`${F}FoundationsCourseScreen.tsx`);
    for (const m of course.matchAll(/install the newest dev build/g)) {
      assert.match(course.slice(Math.max(0, m.index! - 200), m.index!), /\{__DEV__\s*\?\s*'[^']*$/);
    }
  });
});

describe('SH-35 · Wave Physics keeps one key order: FREQ first, LAYERS last', () => {
  it('every Wave module with FREQ has it first, and LAYERS last', () => {
    for (const f of ['modWaveA.tsx', 'modWaveB.tsx']) {
      const src = code(`${W}modules/${f}`);
      for (const m of src.matchAll(/export function (\w+Module)\(/g)) {
        const body = src.slice(m.index!, src.indexOf('\nexport function', m.index! + 10) > 0 ? src.indexOf('\nexport function', m.index! + 10) : undefined);
        const pi = body.indexOf('params: [');
        if (pi < 0) continue;
        const ids = [...body.slice(pi).matchAll(/\n {12}id: '(\w+)',/g)].map((x) => x[1]);
        if (ids.includes('freq')) assert.equal(ids[0], 'freq', `${m[1]}: ${ids.join(' ')}`);
        if (ids.includes('layers')) assert.equal(ids[ids.length - 1], 'layers', `${m[1]}: ${ids.join(' ')}`);
      }
    }
  });
});

describe('SH-76 · Wave standing-wave MODE choices carry a plain line', () => {
  it('each (n,m) option has a blurb in plain words', () => {
    const src = code(`${W}modules/modWaveA.tsx`);
    assert.match(src, /label: `\(\$\{m\.nx\},\$\{m\.ny\}\)`, blurb: MODE_BLURB\[`\$\{m\.nx\},\$\{m\.ny\}`\]/);
    for (const k of ['1,0', '0,1', '1,1', '2,0', '2,1', '3,0']) assert.match(src, new RegExp(`'${k}': '[^']{20,80}'`), k);
  });
});

// ─── Shared needs from other groups, in F5's files ──────────────────────────

describe('SN-F6a-1 · the check card puts the wrong-answer words under the tapped option', () => {
  it('the hint (and the after-two-misses explanation) render inside the option loop, only on the tapped wrong option', () => {
    const bits = code(`${F}bits.tsx`);
    const start = bits.indexOf('export function CheckQuestion(');
    const card = bits.slice(start, bits.indexOf('\n}\n', start));
    const loop = card.slice(card.indexOf('{order.map((i) => {'), card.indexOf('</View>\n      {solved ?'));
    assert.match(loop, /\{bad \? \(\s*<>\s*<Text style=\{styles\.checkHint\}>\{checkWrongText\(spec, i\)\}<\/Text>\s*\{showRevealAfterMisses\(misses\) \? <Text style=\{styles\.checkRevealAfterMiss\}>\{spec\.reveal\}<\/Text> : null\}/);
    // Nothing of it is left after the options; the right answer's reveal stays there.
    const after = card.slice(card.indexOf('</View>\n      {solved ?'));
    assert.doesNotMatch(after, /checkHint|checkRevealAfterMiss/);
    assert.match(after, /\{solved \? <Text style=\{styles\.checkReveal\}>✓ \{spec\.reveal\}<\/Text> : null\}/);
  });
});

describe('SC-02 / EQL-02 · the color primer line (done by F7a, checked by F5)', () => {
  it('the line claims "one-time": true in the sense that the page never returns once its check is passed', () => {
    const amp = code('src/screens/lab/amplitude/AmplitudeOrientation.tsx');
    assert.match(amp, /const GATE_INTRO =\s*'A one-time stop, about a minute:/);
    // The gate shows the page until the orientation flag is set (passing the check), then never again.
    assert.match(amp, /if \(done \|\| overlaysSuppressed \|\| sampling\) return <Screen \{\.\.\.props\} \/>;\s*return <AmplitudeOrientationGatePage \/>;/);
  });
});

describe('Checker follow-ups (CHECK_F5_REPORT.md)', () => {
  it('1 · the SPL card names the color the code draws: 78 dB SPL on its 40–100 scale is green-yellow', async () => {
    const { levelColor } = await import('../src/features/tools/levelColor.ts');
    const amp = code('src/screens/lab/amplitude/AmplitudeOrientation.tsx');
    assert.match(amp, /lookFor="78 dB, yet green-yellow: its own scale"/);
    assert.doesNotMatch(amp, /a cool color/);
    // Same value the guide calls yellow-green; not the cool (blue) end of the ramp.
    assert.notEqual(levelColor((78 - 40) / 60), levelColor(0.1));
  });
  it('2 · the capsule module says "for the curious" once', () => {
    const src = code(`${MS}MicPrinciplesLabScreen.tsx`);
    const row = src.slice(src.indexOf("{ key: 'capsule', label: 'CAPSULE'"));
    const line = row.slice(0, row.indexOf('\n'));
    assert.equal((line.match(/for the curious/gi) ?? []).length, 1);
  });
  it('3 · module 7 mentions the cable only in the room paragraph, which comes after the recording one', () => {
    const src = code(`${F}FoundationsCourseScreen.tsx`);
    const m7 = src.slice(src.indexOf("key: 'm7',"), src.indexOf('Rack: M7Rack,'));
    const mic = m7.indexOf("'THE MIC’S OUTPUT"), room = m7.indexOf("'THE ROOM is measured");
    assert.ok(mic > 0 && room > mic);
    assert.doesNotMatch(m7.slice(mic, room), /cable/i);
    assert.match(m7.slice(room), /follow its cable down into MIC INPUT/);
  });
});
