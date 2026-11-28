/**
 * Beginner waves 1-3 (2026-11-15), group F6a: Digital Audio Systems, Visual Audio Analysis (Meter
 * Lab), Signal Detective, Signal Chain Builder, Gain Staging, Patchbay Signal Flow & Normalling.
 * Owner go (2026-11-15): "build waves 1 thru 3. after we will discuss wave 4 at what goes and doesnt
 * for that wave" (D62 adoption plan). Each block below would have failed before its change.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

/** The body of `export function <name>` up to the next top-level function. */
function fnBody(src: string, name: string): string {
  const a = src.indexOf(`export function ${name}`);
  assert.ok(a >= 0, name);
  const b = src.indexOf('\nfunction ', a + 10);
  const c = src.indexOf('\nexport function ', a + 10);
  const ends = [b, c].filter((x) => x > 0);
  return src.slice(a, ends.length ? Math.min(...ends) : undefined);
}

/** The text between a fold's opening tag and its closing tag. */
function foldBody(src: string, title: string): string {
  const a = src.indexOf(`<CollapsibleSection title="${title}" startOpen={false}>`);
  assert.ok(a > 0, `fold "${title}" (closed on arrival)`);
  return src.slice(a, src.indexOf('</CollapsibleSection>', a));
}

describe('DG-01 / DG-05 · Digital: each module opens on its one core idea', () => {
  const A = read('src/screens/lab/digital/modules/modAnalog.tsx');
  const C = read('src/screens/lab/digital/modules/modChain.tsx');
  const D = read('src/screens/lab/digital/modules/modDac.tsx');
  it('Module 1: crest, polarity and the band-limited note fold under MORE DETAIL (one change for DG-01 and DG-05)', () => {
    const body = foldBody(fnBody(A, 'AnalogModule'), 'MORE DETAIL');
    for (const x of ["k: 'CREST FACTOR'", "k: 'POLARITY'", 'band-limited (12 harmonics)', 'Peak, RMS and crest are measured']) assert.ok(body.includes(x), x);
  });
  it('Module 1: PEAK carries plain words that also say what FS means (top, out of 1.0)', () => {
    assert.match(A, /\{ k: 'PEAK', v: stats \? `\$\{stats\.peak\.toFixed\(2\)\} FS` : '—', helpKey: 'waveform_view', caption: 'top of 1\.0' \}/);
  });
  it('Module 5: the conversion chain and sample-and-hold fold under PART 2; the gain scene and its check stay open', () => {
    const m5 = fnBody(C, 'AdcModule');
    const body = foldBody(m5, 'PART 2 · THE CONVERSION CHAIN AND SAMPLE & HOLD');
    assert.ok(body.includes('THE CONVERSION CHAIN</Text>'));
    assert.ok(body.includes('SAMPLE & HOLD — WATCH ONE CELL WORK'));
    assert.ok(!body.includes('<GoalCheck spec={ADC_CHECK} />'));
  });
  it('Module 6: INTEGER vs FLOATING POINT and HOW A FLOAT NUMBER WORKS fold under PART 2; the two fates and their check stay open', () => {
    const m6 = fnBody(C, 'ProcessingModule');
    const body = foldBody(m6, 'PART 2 · INTEGER vs FLOAT, AND HOW A FLOAT NUMBER WORKS');
    assert.ok(body.includes('INTEGER vs FLOATING POINT'));
    assert.ok(body.includes('HOW A FLOAT NUMBER WORKS</Text>'));
    assert.ok(m6.indexOf('<GoalCheck spec={FLOAT_CHECK} />') < m6.indexOf('PART 2 ·'));
  });
  it('Module 8: the myth summary comes before the clock and cable detail, which folds last', () => {
    const m8 = fnBody(D, 'ErrorsModule');
    const myths = m8.indexOf('MODULE 8 · MYTH vs REALITY');
    const clock = m8.indexOf('<PanelHead title={CLOCKING_CARD.title}');
    assert.ok(myths > 0 && clock > myths, 'myths first');
    const body = foldBody(m8, 'PART 3 · CLOCKING, FOR WHEN YOU WIRE REAL GEAR');
    assert.ok(body.includes('<PanelHead title={CLOCKING_CARD.title}'));
    assert.ok(body.includes('<GoalCheck spec={CLOCKING_CHECK} />'), 'the check is kept, only folded');
  });
  it('the Module 5, 6 and 8 guides send the learner to the folds by name', () => {
    const g = read('src/screens/lab/digital/digitalScreenGuides.ts');
    assert.match(g, /Open PART 2 below the display for THE CONVERSION CHAIN/);
    assert.match(g, /Open PART 2 for the INTEGER vs FLOATING POINT range bars/);
    assert.match(g, /PART 3 holds CLOCKING — ONE MASTER, THE REST FOLLOW/);
  });
});

describe('MT-01 · Meter: Spectrum and Spectrogram readouts keep their names at phone width', () => {
  const B = read('src/screens/lab/meter/modules/modMeterB.tsx');
  it('Spectrum LEVEL and TILT carry the number on the value line and the unit on the sub line', () => {
    assert.match(B, /\{ k: 'LEVEL', v: \(Math\.abs\(scan\.peakDb\) < 0\.05 \? 0 : scan\.peakDb\)\.toFixed\(1\), sub: 'dB rel'/);
    assert.match(B, /\{ k: 'TILT', v: `\$\{scan\.tiltDbOct >= 0 \? '\+' : ''\}\$\{scan\.tiltDbOct\.toFixed\(1\)\}`, sub: '\/oct'/);
    assert.doesNotMatch(B, /\} dB rel`/);
    // Checker fix: PEAK uses the peak + format it shares with the drawing's marker (meterEngine).
    assert.match(B, /\{ k: 'PEAK', v: fmtPeakHz\(scan\.peakF\)\.split\(' '\)\[0\], sub: fmtPeakHz\(scan\.peakF\)\.split\(' '\)\[1\]/);
    const S = read('src/screens/lab/meter/vizSpectral.tsx');
    assert.match(S, /\(\{ f: peakF, db: peakDb \} = spectrumPeak\(p\.pattern\)\);/);
    assert.match(S, /\{fmtPeakHz\(envelope\.peakF\)\}/);
  });
  it('Spectrogram TIME gets the room its long value needs (the short ↑ up gives it up)', () => {
    // Fit rule of rack/BezelReadouts (V_CH 8.1 px a character + 16 px padding; a value wider than its
    // cell drops the key, D36), for the 4-cell strip at 390 (about 316 px wide, F6's caption measures).
    const cells: [string, number][] = [['new → right', 1.5], ['↑ up', 0.75], ['= color', 1.05], ['SCROLL', 0.95]];
    const total = cells.reduce((a, [, f]) => a + f, 0);
    for (const [v, f] of cells) assert.ok(v.length * 8.1 + 16 <= (316 * f) / total, `${v} fits`);
    for (const [v, f] of cells) assert.ok(B.includes(`v: '${v}', helpKey: 'spectrogram_axes', flex: ${f} }`) || B.includes(`'SCROLL', helpKey: 'spectrogram_axes', flex: ${f} }`), v);
  });
});

describe('MT-03 · Meter: Waterfall and Loudness open with less on a first visit', () => {
  const A = read('src/screens/lab/meter/modules/modMeterA.tsx');
  const B = read('src/screens/lab/meter/modules/modMeterB.tsx');
  it('Waterfall: a first visit (per device) shows only REPLAY and Q RING until the first move', () => {
    const w = fnBody(B, 'WaterfallModule');
    assert.match(w, /useFirstLabVisit\('meter-waterfall', true\)/);
    assert.match(w, /const simpleDock = firstVisit !== false && !moved;/);
    assert.match(w, /params=\{simpleDock \? params\.filter\(\(q\) => q\.id === 'replay' \|\| q\.id === 'qring'\) : params\}/);
    // both first-step keys count as the first move
    assert.equal((w.match(/setMoved\(true\);/g) ?? []).length, 2);
  });
  it('Loudness: a first visit shows the one INTEGRATED number until the first SIGNAL pick', () => {
    const l = fnBody(A, 'LoudnessModule');
    assert.match(l, /useFirstLabVisit\('meter-loudness', true\)/);
    assert.match(l, /bezel: oneNumber \? \[bezel\[0\]\] : bezel,/);
    assert.match(l, /\{ k: 'INTEGRATED', kNarrow: 'INTEG\.'/, 'INTEGRATED is the first cell');
    assert.match(l, /setSignalRaw\(k\);\n\s*setMoved\(true\);/);
  });
  it('the first-visit list is the shared intro-flag store (kept through the guest wipe, reset with the hints)', () => {
    assert.match(read('src/screens/lab/rack/learnFirstStore.ts'), /export const LEARN_FIRST_KEY = 'ape:intro:labLearnFirst';/);
  });
  it('the Waterfall card still opens on Q RING, a key the short dock shows', () => {
    assert.match(read('src/screens/lab/meter/meterScreenGuides.ts'), /start: 'Tap Q RING on and watch RIDGE jump to 1\.2 kHz/);
  });
});

describe('MT-06 + SH-64 · Meter: the Oscilloscope dock opens on SIGNAL; WIDTH and PHASE wait for X-Y', () => {
  const C = read('src/screens/lab/meter/modules/modMeterC.tsx');
  const sc = fnBody(C, 'ScopeModule');
  it('WIDTH and PHASE are locked (greyed, with a reason) while the picture is TIME', () => {
    assert.match(sc, /const xyOnly = xy \? undefined : 'it shapes the X-Y picture, so tap X-Y first\.';/);
    assert.equal((sc.match(/locked: xyOnly,/g) ?? []).length, 2);
    assert.doesNotMatch(sc, /xyFader/);
  });
  it('the guide says so', () => {
    // owner 2026-11-21: American English in learner text (greyed -> grayed)
    assert.match(read('src/screens/lab/meter/meterScreenGuides.ts'), /stay grayed in TIME: tap X-Y first/);
  });
});

describe('SD-01 / SD-02 / SD-04 · Signal Detective', () => {
  const C = read('src/screens/lab/meter/modules/modMeterC.tsx');
  const d = fnBody(C, 'DetectiveModule');
  it('SD-01: NEXT QUESTION and PREVIOUS live in the dock, between the case keys; the chip row is gone', () => {
    const ids = [...d.matchAll(/id: '(prev|prevq|nextq|next)'/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['prev', 'prevq', 'nextq', 'nextq', 'next']);
    assert.match(d, /label: 'NEXT QUESTION ›', onPress: \(\) => setStep\(step \+ 1\)/);
    assert.match(d, /label: 'NEXT CASE ›', onPress: \(\) => goCase\(idx \+ 1\)/);
    assert.doesNotMatch(d, /<LabChip/);
  });
  it('SD-02: a new case or question scrolls the well back to the top (not on arrival)', () => {
    assert.match(d, /scrollWellRef\.current = api\.scrollWellTo;/);
    assert.match(d, /if \(lastPlace\.current === placeKey\) return;\n\s*lastPlace\.current = placeKey;\n\s*scrollWellRef\.current\?\.\(0\);/);
  });
  it('SD-04: the card says the meter name is hidden and that a wrong answer shows the clue (≤ 40 words)', () => {
    const g = read('src/screens/lab/meter/meterScreenGuides.ts');
    const m = g.match(/start: '(The meter’s name is hidden\.[^']*)'/);
    assert.ok(m, 'start line');
    assert.match(m[1], /Wrong answers show you the clue\./);
    assert.ok(m[1].split(/\s+/).length <= 40);
    assert.doesNotMatch(g, /The answers are shuffled each time/, 'the order is seeded, never reshuffled');
  });
});

describe('GN-03 / GN-05 · Gain Staging', () => {
  const E = read('src/screens/lab/gain/modules/modExplore.tsx');
  const V = read('src/screens/lab/gain/gainViz.tsx');
  const G = read('src/screens/lab/gain/gainScreenGuides.ts');
  it('GN-03: Module 6 starts with X-RAY on', () => {
    assert.match(fnBody(E, 'MultiStageModule'), /const \[xray, setXray\] = useState\(true\);/);
  });
  it('GN-03: the group keys name what they open, never "-6·0 dB"', () => {
    assert.doesNotMatch(E, /\$\{g\.eq\}·\$\{g\.comp\} dB|\$\{g\.fad\}·\$\{g\.bus\}·\$\{g\.out\} dB/);
    assert.equal((E.match(/valueLabel: '2 STAGES'/g) ?? []).length, 2);
    assert.equal((E.match(/valueLabel: '3 STAGES'/g) ?? []).length, 2);
  });
  it('GN-03: the SIG / CLIP lights are 14 pt with a glow ring when lit', () => {
    assert.match(V, /led: \{ width: 14, height: 14, borderRadius: 7,/);
    assert.match(V, /ledSig: \{ backgroundColor: '#5bdc6e', borderColor: 'rgba\(91,255,133,\.45\)' \}/);
    assert.match(V, /ledClip: \{ backgroundColor: '#ff3b2a', borderColor: 'rgba\(255,107,94,\.55\)' \}/);
  });
  it('GN-03: the Module 6 card starts with X-RAY on', () => {
    assert.match(G, /start: 'X-RAY starts on: EQ and COMP read TOO LOW\. Tap X-RAY off/);
  });
  it('GN-05: Module 1 first step is a goal the learner can hit with one drag', () => {
    assert.match(G, /start: 'Push SOURCE up until a meter turns red\. Then pull it back down until PREAMP and OUTPUT are green again\.'/);
    assert.doesNotMatch(G, /Stop when STATUS reads HOT/);
  });
});

describe('DG-04 · Digital home: the plain picture, one START, the shortcuts folded', () => {
  const H = read('src/screens/lab/digital/DigitalLabHomeScreen.tsx');
  it('the 13-arrow paragraph is gone; the plain lead opens the home', () => {
    assert.doesNotMatch(H, /anti-aliasing filter → sampling → quantization/);
    assert.match(H, /'Your voice is moving air\. A microphone and its preamp turn it into electricity/);
    assert.match(H, /<Text style=\{styles\.body\}>\{DIGITAL_HOME_LEAD\}<\/Text>/);
  });
  it('one START button opens the first module not yet done (CONTINUE once one is done; unreadable → Module 1)', () => {
    assert.match(H, /const startIdx = unreadable \? 0 : Math\.max\(0, DIGITAL_MODULES\.findIndex\(\(m\) => !clearedUnits\.has\(m\.id\)\)\);/);
    assert.match(H, /const startLabel = !unreadable && clearedUnits\.size > 0 \? 'CONTINUE' : 'START';/);
    assert.match(H, /onPress=\{\(\) => open\(startModule\.id\)\}/);
    assert.ok(H.indexOf('styles.startBtn') < H.indexOf('THE EIGHT MODULES</Text>'), 'START comes before the list');
  });
  it('SECONDARY TOOLS and LEARNING fold under one closed SHORTCUTS section', () => {
    const body = foldBody(H, 'SHORTCUTS · TOOLS AND REVIEW');
    for (const x of ['SECONDARY TOOLS', 'LEARNING', 'ⓘ GUIDED LESSON', 'DATA-RATE CALCULATOR']) assert.ok(body.includes(x), x);
  });
});

describe('MT-04 / MT-05 · Meter home: one plain idea, a plain question per row', () => {
  it('MT-04: the home opens with the one-question idea, not nine display names', () => {
    const H = read('src/screens/lab/meter/MeterLabHomeScreen.tsx');
    assert.match(H, /Every meter answers one question about a sound\. In 11 short modules you will learn which\n\s*question each one answers, then prove it in Signal Detective\./);
    assert.doesNotMatch(H, /waveform, peak, VU, LUFS, spectrum, spectrogram, waterfall/);
  });
  it('MT-05: every module blurb opens with its plain question', () => {
    const R = read('src/screens/lab/meter/modules/registry.ts');
    const blurbs = [...R.matchAll(/blurb: '([^']+)'/g)].map((m) => m[1]);
    assert.equal(blurbs.length, 11);
    for (const b of blurbs) assert.match(b, /^[A-Z][^?]{3,60}\? /, b);
    assert.ok(blurbs.includes('Will it clip? The highest points of the signal, and the lamp that lights when one goes over.'));
    assert.ok(blurbs.some((b) => b.startsWith('Will it survive mono?')));
    assert.doesNotMatch(R, /LUFS: momentary, short-term, integrated/);
  });
  it('the home guide no longer says opening a module ticks it (done = work done)', () => {
    const g = read('src/screens/lab/meter/meterScreenGuides.ts');
    assert.doesNotMatch(g, /Open a module and its ✓ appears here/);
    assert.match(g, /Answer a module’s checks right and its ✓ appears here/);
  });
});

describe('SC-05 · Signal Chain: the card opens with the plain picture of the rack', () => {
  it('the start line leads with the pedals picture, names DIST and LIMIT in plain words, keeps the silent step (≤ 40 words)', () => {
    const g = read('src/screens/lab/chainScreenGuides.ts');
    const m = g.match(/start: '(Sound runs through these boxes[^']*)'/);
    assert.ok(m);
    assert.match(m[1], /like guitar pedals: each changes what the next receives/);
    assert.match(m[1], /LIMIT \(a loudness ceiling\)/);
    assert.match(m[1], /DIST \(distortion\)/);
    assert.match(m[1], /Sound off\? ▶ gives the numbers\./);
    assert.ok(m[1].split(/\s+/).length <= 40);
  });
});

describe('GN-01 / GN-02 / GN-04 · Gain Staging words', () => {
  const L = read('src/screens/lab/gain/modules/modLearn.tsx');
  const V = read('src/screens/lab/gain/gainViz.tsx');
  const E = read('src/screens/lab/gain/gainEngine.ts');
  it('GN-02: one name for the preamp control (no INPUT GAIN key)', () => {
    assert.doesNotMatch(L, /label: 'INPUT GAIN'/);
    assert.match(fnBody(L, 'InputGainModule'), /label: 'PREAMP',/);
  });
  it('GN-02: STATUS speaks the meters’ and the key’s words, plus NOISY; the key says HOT (amber) and CLIP (red), as STATUS does', () => {
    assert.match(E, /export function statusWord\(node: ChainNode\): StatusWord \{/);
    assert.match(E, /if \(isNoisy\(node\)\) return 'NOISY';\n\s*if \(node\.region === 'low'\) return 'TOO LOW';\n\s*if \(node\.region === 'hot'\) return 'HOT';/);
    assert.match(V, /const v = statusWord\(node\);/);
    assert.doesNotMatch(V, /v: 'OK'|v: 'LOW'|return 'OVERLOAD'/);
    // Checker fix: one color per state too — HOT amber like STATUS, CLIP red.
    assert.match(L, /backgroundColor: '#ffc64d' \}\]\} \/><Text style=\{styles\.legendText\}>HOT<\/Text>/);
    assert.match(L, /backgroundColor: '#ff5f4e' \}\]\} \/><Text style=\{styles\.legendText\}>CLIP<\/Text>/);
    assert.match(V, /HOT: '#ffc64d',/);
  });
  it('GN-02: NOISY is the hiss problem only (TOO LOW EARLY), never a healthy or merely hot stage', async () => {
    const G = await import('../src/screens/lab/gain/gainEngine.ts');
    const mk = (key: string, kind: string, gain: number) => ({ key, name: key, kind, gain, min: -40, max: 40, adjustable: true }) as never;
    const chain = (src: number, ...st: [string, string, number][]) => G.computeChain(src, st.map(([k, kind, g]) => mk(k, kind, g)));
    assert.equal(G.statusWord(chain(-30, ['pre', 'preamp', 2], ['out', 'output', 24])[2]), 'NOISY');
    assert.equal(G.statusWord(chain(-30, ['pre', 'preamp', 18], ['out', 'output', 0])[2]), 'HEALTHY');
    assert.equal(G.statusWord(chain(-30, ['pre', 'preamp', 24], ['out', 'output', 0])[1]), 'HOT', 'Module 2 at +24: hot, not noisy');
    assert.equal(G.statusWord(chain(-30, ['pre', 'preamp', 0], ['out', 'output', 0])[1]), 'TOO LOW');
    for (let p = 0; p <= 40; p++) assert.notEqual(G.statusWord(chain(-30, ['pre', 'preamp', p], ['out', 'output', 0])[1]), 'NOISY', `Module 2 at +${p}`);
  });
  it('GN-01: the knob and the level are named, with the one sentence', () => {
    const m2 = fnBody(L, 'InputGainModule');
    assert.match(m2, /The knob adds gain; the level is what comes out\./);
    assert.match(m2, /\{ k: 'PREAMP LEVEL', kNarrow: 'LEVEL', v: fmtLv\(preNode\.level\)/);
    assert.match(m2, /format: \(\) => `\$\{fmtDb\(pre\)\} gain \(the knob\)`/);
    assert.doesNotMatch(m2, /ONLY the PREAMP fader is yours on this screen/, 'the line it replaces');
  });
  it('GN-04: the home opens with the picture a beginner can feel', () => {
    const H = read('src/screens/lab/gain/GainLabHomeScreen.tsx');
    assert.match(H, /Sound travels through several boxes before it reaches a speaker\. Each box needs the right\n\s*amount: too little and you hear hiss, too much and it crunches\./);
    assert.doesNotMatch(H, /appropriate operating level/);
  });
});

describe('PB-01 / PB-04 · Patchbay page 1 and page 13', () => {
  const A = read('src/screens/lab/patchbay/pagesA.tsx');
  const B = read('src/screens/lab/patchbay/pagesB.tsx');
  const art = read('src/screens/lab/patchbay/art/StudioBayView.tsx');
  it('PB-01: page 1 opens on the 8-pair bay with OUT and IN marked, and the plain line', () => {
    const p1 = A.slice(A.indexOf('function PageDirection'), A.indexOf('function PagePair'));
    assert.ok(p1.indexOf('<StudioBayView pairs={STUDIO_PAIRS} rowMarks') < p1.indexOf('<Lead>{PB_PAGE1_LEAD}'), 'the picture comes first');
    assert.match(A, /'This is a patchbay: every cable in a studio ends here\./);
    assert.match(art, />OUT<\/SvgText>/);
    assert.match(art, />IN<\/SvgText>/);
    assert.match(art, /rowMarks = false/, 'off by default: page 14 draws as before');
  });
  it('PB-01: the two row-lists fold (a line in, a line out), words unchanged', () => {
    const body = foldBody(A, 'WHAT PLUGS INTO EACH ROW');
    assert.ok(body.includes('TOP ROW = SOURCES · OUTPUTS'));
    assert.ok(body.includes('BOTTOM ROW = DESTINATIONS · INPUTS'));
  });
  it('PB-04: page 1 says the lab has two parts and part one ends on page 13', () => {
    assert.match(A, /The lab has two parts, and part one ends on page 13: a good place to stop\./);
  });
  it('PB-04: page 13 offers a good place to stop, with a way back to the labs that marks nothing', () => {
    const w = B.slice(B.indexOf('function PageWrap'), B.indexOf('export const PATCHBAY_PAGES_B'));
    assert.match(w, /<Eyebrow>GOOD PLACE TO STOP<\/Eyebrow>/);
    assert.match(w, /onPress=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.doesNotMatch(w, /markDone/);
    assert.ok(foldBody(w, 'SOURCES BEHIND THIS LAB').includes('Patch-panel maker documentation'));
  });
});

describe('DG-02 · Digital: the remaining codes spelled out', () => {
  const Q = read('src/screens/lab/digital/modules/modQuant.tsx');
  const D = read('src/screens/lab/digital/modules/modDac.tsx');
  const C = read('src/screens/lab/digital/modules/modChain.tsx');
  const L = read('src/features/lab/guidedLessons/content.ts');
  it('dock keys: RESET BITS, HELD STEPS, OVERSAMPLE RATE, TONE FREQ; MODE reads STANDARD', () => {
    assert.match(Q, /label: 'RESET BITS'/);
    assert.match(D, /\{ key: 'zoh', label: 'HELD STEPS' \}/);
    assert.match(D, /label: 'OVERSAMPLE RATE',/);
    assert.match(D, /label: 'TONE FREQ',/);
    assert.doesNotMatch(D, /'STD'/);
    assert.doesNotMatch(Q + D, /label: '(RESET REG|ZOH|OS RATE|ISP FREQ)'/);
  });
  it('ZONE reads CLIP with where it clipped in words on the sub line (no A+D CLIP / AN. CLIP codes)', () => {
    assert.doesNotMatch(C, /'A\+D CLIP'|'AN\. CLIP'/);
    assert.match(C, /v: r\.analogClip \? 'CLIP' : r\.zone,/);
    // Checker fix (2026-11-15): the sub must fit a 67 px cell at 390 ('analog + digital' was cut to
    // 'analog + d…'). 'both stages' is 11 characters.
    assert.match(C, /sub: r\.analogClip && r\.digitalOver \? 'both stages' : r\.analogClip \? 'analog' : undefined,/);
    assert.doesNotMatch(C, /'analog \+ digital'/);
    const g = read('src/screens/lab/digital/digitalScreenGuides.ts');
    assert.doesNotMatch(g, /analog \+ digital/, 'the card uses the screen’s words');
    assert.match(g, /Push it to the top for CLIP, both stages\./);
  });
  it('the Digital guided lesson uses the same names, and FS means only full scale', () => {
    const dig = L.slice(L.indexOf('  digital: {'), L.indexOf('  digital: {') + 30000);
    assert.doesNotMatch(dig.slice(0, dig.indexOf('\n  },\n')), /shown as FS \(here: sample rate|A higher FS raises NYQUIST|RESET REG|name: "OS RATE"|ISP FREQ|ZONE A\+D CLIP/);
    assert.match(L, /\{ key: "zoh", name: "HELD STEPS \(ZOH\)"/);
  });
});

describe('SC-03 · Signal Chain: each dark unit says what it is in plain words', () => {
  const S = read('src/screens/lab/SignalChainLabScreen.tsx');
  const R = read('src/screens/lab/chainRack.tsx');
  it('every unit carries plain words; DIST and LIMIT use the card’s words', () => {
    const mods = S.slice(S.indexOf('const MODULES: ChainUnit[] = ['), S.indexOf('];', S.indexOf('const MODULES: ChainUnit[] = [')));
    // Owner 2026-11-22: "the gate is usually before any eq and compression. Low Cut as well (not shown currently)";
    // LOW CUT joined the rack as its first unit, so the rack holds ten units, not nine.
    assert.equal((mods.match(/plain: '/g) ?? []).length, 10);
    assert.match(mods, /label: 'LOW CUT', plain: 'removes rumble'/);
    assert.match(mods, /label: 'DIST', plain: 'distortion'/);
    assert.match(mods, /label: 'LIMIT', plain: 'loudness ceiling'/);
    for (const [, w] of mods.matchAll(/plain: '([^']+)'/g)) assert.ok(w.length <= 16, w);
  });
  it('the words take the bypassed word’s place under a dark unit (a line in, a line out)', () => {
    assert.match(R, /: on \? u\.setting : \(u\.plain \?\? 'bypassed'\)\}/);
  });
});

describe('Sweep items in F6a labs (SH-12, SH-26, SH-35, SH-76)', () => {
  it('SH-12: Digital Module 2 (the one module with sound) says every step still works with sound off', () => {
    assert.match(read('src/screens/lab/digital/modules/modAnalog.tsx'), /soundOffLine: 'Sound off\? Every step still works: READS AS and the red ALIAS curve show the fold you would hear\.'/);
  });
  it('SH-26: Gain Module 3 spells PROCESSOR out where it fits (PROC only when narrow)', () => {
    assert.match(read('src/screens/lab/gain/modules/modLearn.tsx'), /\{ k: 'PROCESSOR', kNarrow: 'PROC', v: fmtLv\(nodes\[2\]\.level\)/);
  });
  it('SH-35: the Oscilloscope dock puts PHASE before WIDTH, as the Phase module does', () => {
    const C = read('src/screens/lab/meter/modules/modMeterC.tsx');
    const sc = fnBody(C, 'ScopeModule');
    assert.ok(sc.indexOf("id: 'phase'") < sc.indexOf("id: 'width'"));
    const ph = fnBody(C, 'PhaseModule');
    assert.ok(ph.indexOf("label: 'PHASE'") < ph.indexOf("label: 'WIDTH'"));
  });
  it('SH-76: the Gain INSPECT tray and the Patchbay VIEW tray carry a one-line meaning per choice', () => {
    const E = read('src/screens/lab/gain/modules/modExplore.tsx');
    assert.match(E, /\{ id: 'source', label: INSPECT_NAMES\.source, blurb: INSPECT_BLURBS\.source \}/);
    assert.match(E, /\.\.\.FAULT_KEYS\.map\(\(k\) => \(\{ id: k, label: INSPECT_NAMES\[k\], blurb: INSPECT_BLURBS\[k\] \}\)\)/);
    const P = read('src/screens/lab/patchbay/pagesC.tsx');
    assert.match(P, /\{ id: 'vocal', label: 'VOCAL PAIR', blurb: '/);
    assert.match(P, /\{ id: 'proc', label: 'PROCESSOR PAIR', blurb: '/);
  });
});

describe('Checker fixes (CHECK_F6a_REPORT.md, 2026-11-15)', () => {
  it('GN-03: Module 6’s note follows the X-RAY state (X-RAY now starts on)', () => {
    const E = read('src/screens/lab/gain/modules/modExplore.tsx');
    assert.doesNotMatch(E, /flip on the X-Ray/);
    assert.match(E, /xray\n\s*\? 'Not balanced yet — read the X-Ray meters/);
  });
  it('Gain: the meter tag keeps TOO LOW whole (it fits one line); only QUIET SOURCE shortens', () => {
    const V = read('src/screens/lab/gain/gainViz.tsx');
    const m = /export function shortRegionLabel\(label: string\): string \{([\s\S]*?)\n\}/.exec(V);
    assert.ok(m);
    const fn = new Function('label', m[1]) as (l: string) => string;
    assert.equal(fn('TOO LOW'), 'TOO LOW');
    assert.equal(fn('QUIET SOURCE'), 'QUIET');
  });
  it('Gain Module 3’s card names the readout PROCESSOR, as the bezel does', () => {
    const G = read('src/screens/lab/gain/gainScreenGuides.ts');
    assert.match(G, /compare the PREAMP and PROCESSOR readouts/);
  });
  it('Spectrum: one true peak for the readout and the marker (SPEECH 220 Hz, FEEDBACK 1.75 kHz)', async () => {
    const M = await import('../src/screens/lab/meter/meterEngine.ts');
    assert.equal(M.fmtPeakHz(M.spectrumPeak('speech').f), '220 Hz');
    assert.equal(M.fmtPeakHz(M.spectrumPeak('feedback').f), '1.75 kHz');
    assert.equal(M.fmtPeakHz(M.spectrumPeak('kick').f), '60 Hz');
    assert.equal(M.fmtPeakHz(M.spectrumPeak('hum').f), '60 Hz');
  });
});
