/**
 * Screen Guide rollout — Beginning Mixing (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_patchbay_20261031.test.ts.
 *
 *   1. every page the learner reaches (p1…p16, one per PageDef, in page
 *      order) has a guide with all five sections, 1–5 bullets each, 2–3 TRY
 *      THIS experiments, every step inside its no-scroll budget, in the house
 *      copy rules (Mixing: starting points, "suggest" never "recommend");
 *   2. each guide quotes its page's REAL names — each one pinned here is in
 *      both the guide and the lab's source (comments stripped);
 *   3. the numbers and states the guides quote are what the page draws;
 *   4. wiring: BeginningMixingLabScreen passes `pageGuide` to PagedLab;
 *   5. the accuracy-chip decision: KEPT (PagedLab's default) — the lab shows
 *      measured level readouts (Gain Staging's peak / RMS meters).
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

const MX = 'src/screens/lab/mixing';
const { BEGINNING_MIXING_SCREEN_GUIDES, BEGINNING_MIXING_GUIDE_PAGE_TITLES, beginningMixingPageGuide } = await import(`../${MX}/beginningMixingScreenGuides.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const MODEL = await import(`../${MX}/engine/mixModel.ts`);
const ROUTING = await import(`../${MX}/engine/routing.ts`);

type Guide = Record<string, string[]>;
const GUIDES = BEGINNING_MIXING_SCREEN_GUIDES as unknown as Record<string, Guide>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

const PAGE_FILES = ['pagesA.tsx', 'pagesB.tsx', 'pagesC.tsx', 'pagesD.tsx'].map((f) => `${MX}/${f}`);
/** Every PageDef title, in page order (pagesA → D, as the screen spreads them). */
const PAGE_TITLES = PAGE_FILES.flatMap((f) => [...code(f).matchAll(/\{ title: '((?:[^'\\]|\\.)*)', short: /g)].map((m) => m[1]));
const IDS = Array.from({ length: 16 }, (_, i) => `p${i + 1}`);

describe('1. every Beginning Mixing page has a complete guide', () => {
  it('one guide per page (p1…p16), none for a page that does not exist', () => {
    assert.deepEqual(Object.keys(GUIDES), IDS);
    assert.deepEqual(Object.keys(BEGINNING_MIXING_GUIDE_PAGE_TITLES), IDS);
  });
  it('each id is pinned to its page’s real title, in page order (reorder a page → update the guides)', () => {
    assert.equal(PAGE_TITLES.length, 16, 'parsed every PageDef');
    assert.deepEqual(Object.values(BEGINNING_MIXING_GUIDE_PAGE_TITLES), PAGE_TITLES);
    // The screen spreads the four page files in this order.
    assert.match(code(`${MX}/BeginningMixingLabScreen.tsx`), /const PAGES = \[\.\.\.MIXING_PAGES_A, \.\.\.MIXING_PAGES_B, \.\.\.MIXING_PAGES_C, \.\.\.MIXING_PAGES_D\];/);
  });
  it('no appended check page: the lab has no authored understanding check', async () => {
    const src = read('src/features/lab/understandingChecks.ts') + read('src/features/lab/understanding.ts');
    assert.doesNotMatch(src, /mixing-beg/);
  });
  it('the PagedLab lookup is 0-based, and the what’s-left index has none', () => {
    assert.equal(beginningMixingPageGuide(0), GUIDES.p1);
    assert.equal(beginningMixingPageGuide(15), GUIDES.p16);
    assert.equal(beginningMixingPageGuide(16), undefined);
  });
  for (const [id, gd] of Object.entries(GUIDES)) {
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
  it('every step fits its no-scroll budget (375 × 812), on every page', () => {
    const over: string[] = [];
    for (const [id, gd] of Object.entries(GUIDES)) {
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
    assert.deepEqual(over, []);
  });
  it('house copy rules: knowledge not skills, no "N of total", "suggest" not "recommend", no build notes, no maker names', () => {
    for (const [id, gd] of Object.entries(GUIDES)) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou(’|')?ve mastered\b|\byou mastered\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|cognition pass|art fix|toddler pass)\b/i, `${id}: a build note`);
    }
  });
  it('Mixing copy: where a guide hands out a mixing move it says starting point / not a rule', () => {
    for (const id of ['p5', 'p7', 'p10', 'p15']) assert.match(textOf(GUIDES[id]), /suggested (starting point|default)|not a law|not a rule/i, `${id}: a mixing move without “suggested”`);
  });
  it('the Signal Flow guide never spells out the order the builder asks for', () => {
    const t = textOf(GUIDES.p3);
    const names = ROUTING.CHANNEL_PATH.map((s: { name: string }) => s.name);
    // No two stations named in canonical sequence with an arrow, and not the
    // whole path listed in order.
    for (let i = 0; i < names.length - 1; i++) assert.ok(!t.includes(`${names[i]} → ${names[i + 1]}`), `p3 gives away ${names[i]} → ${names[i + 1]}`);
    const hits = names.filter((n: string) => t.includes(n)).length;
    assert.ok(hits <= 1, 'p3 lists the stations');
  });
});

describe('2. each guide quotes its page’s real names', () => {
  const SRC = [
    ...PAGE_FILES,
    `${MX}/kit.tsx`,
    `${MX}/begArt.tsx`,
    `${MX}/advPlots.tsx`,
    `${MX}/engine/mixModel.ts`,
    `${MX}/engine/routing.ts`,
    'src/screens/lab/kit/labNav.ts',
    'src/screens/lab/kit/LabNavBar.tsx',
    'src/screens/lab/kit/gear.tsx',
    'src/features/lab/ProNote.tsx',
  ]
    .map(code)
    .join('\n');
  const NAMES: Record<string, string[]> = {
    p1: ['THE MIXER’S MANTRA', 'THE FIVE DIMENSIONS', 'YOUR FIRST DECISION', 'Pan & width', 'Lead vocal', 'The groove', 'A featured instrument', 'The atmosphere', 'A MIX · THE CHORUS (BARS 3–4)', 'LEAD +3 · BGV IN', 'A MIX · THE VERSE (BARS 1–2)', 'ALL FIVE AT ONCE', '‹ PREV', 'NEXT ›', '⏮', 'When to bring in a pro ›'],
    p2: ['THE PREP CHECKLIST', 'SEPARATE THE JOBS', 'Name, order, color', 'Remove the junk', 'Clip gain first', 'Polarity, phase, timing', 'Leave headroom', 'Pick 1–2 references', 'Save the untouched version', 'Audio_07', 'Audio_02', 'REF 1', 'REF 2'],
    p3: ['THE EIGHT STATIONS — STUDY THEM (ORDER HIDDEN)', 'NOW BUILD THE PATH', 'THE PARTS — YOUR ORDER SO FAR', 'THE CANONICAL PATH — YOURS NOW', 'THE PATH — SIGNAL ORDER', 'RESET', 'Not yet'],
    p4: ['WHY HEADROOM', '2 AT ONCE', 'AT 0 dBFS', '4 AT ONCE', 'CLIPPED', 'MIX A', 'MIX B', 'PLAY IT', 'MEASURED', 'A OR B — BLIND', 'B, MATCHED', 'A SOUNDS BETTER', 'B SOUNDS BETTER', 'THEY’RE THE SAME', 'RENDERING THE MIX'],
    p5: ['STEP 1 — HEAR THE PROBLEM', 'THE WALL', 'MY MIX', 'STEP 2 — COMMIT TO AN ANCHOR', 'STEP 3 — BUILD AROUND IT', 'CHANNELS — SWIPE →', 'CHECK IT LIKE A MIXER', 'Ø', 'MUTE', 'RESET MIX', 'THE WALL · EVERY FADER AT 0', 'YOUR BALANCE', 'ANCHOR: ', 'KICK', 'SNARE', 'PERC', 'BASS', 'GTR', 'KEYS', 'LEAD', 'BGV'],
    p6: ['SIX WAYS TO SUBTRACT', 'DECIDE — ', 'THE CROWDED CHORUS', 'Arrangement subtraction', 'Processing subtraction', 'THE HONEST CORRECTION', 'AFTER: ', 'NOTHING CHANGES HERE'],
    p7: ['PLACE THE SESSION', 'YOUR PLACEMENT', 'THE MONO TEST', 'STEREO', 'MONO FOLD', 'MUTE'],
    p8: ['THE PROBLEM — LISTEN FIRST', 'THE CLASH', 'FIVE LEGITIMATE FIXES', 'LEVEL', 'PAN', 'EQ', 'FILTER', 'ARRANGEMENT', 'WHERE THE LEAD PLAYS', 'TWO HABITS THAT KEEP EQ HONEST', 'OPEN THE EQ LAB', 'THE CLASH · GTR +4 dB ON THE LEAD', 'GTR EQ', 'GTR HPF'],
    p9: ['THE FIVE PARAMETERS', 'THRESHOLD', 'RATIO', 'ATTACK', 'RELEASE', 'MAKEUP GAIN', 'HEAR THE ENVELOPE CHANGE', 'NO COMP', 'FAST ATTACK', 'SLOW ATTACK', 'ONE REAL SNARE HIT, DRY', 'THE HONEST COMPARISON RULE'],
    p10: ['THE DEPTH VOCABULARY', 'ONE ROOM GLUES THE BAND', 'BONE DRY', 'ONE SHARED ROOM', 'DROWNED', 'NO SENDS: EVERY PART BONE DRY'],
    p11: ['WHAT EACH ONE ACTUALLY DOES', 'Bus', 'Subgroup', 'Aux send / return', 'Control group', 'VCA / DCA', 'Stem', 'OPEN A TERM TO LIGHT ITS PATH', 'BUS — ANY PATH THAT CARRIES AUDIO ON', 'STEM — THE GROUP BOUNCED TO A FILE'],
    p12: ['PRE VS POST, WHERE IT MATTERS', 'SINGER’S HEADPHONES', 'REVERB (post)', 'HEADPHONES (pre)', 'SILENT', 'THE DOUBLE-ROUTING CASE', 'FADER: 0 dB', 'FADER: PULLED (−∞)', 'THE FADER IS BROKEN', 'TWO LIVE PATHS TO THE MIX'],
    p13: ['THE MOVES', 'VERSE → CHORUS, TWO WAYS', 'STATIC', 'AUTOMATED', 'LIFT +1', 'LIFT +3', 'LIFT +6', 'VERSE · BARS 1–2', 'CHORUS · BARS 3–4', '▲ ENTERS'],
    p14: ['THE FINISHING HABITS', 'Bypass-compare, matched', 'Take breaks', 'Listen QUIETLY', 'RUN ONE NOW', 'THE MIX', 'IN MONO', 'THE MIX · STEREO', 'THE MIX · FOLDED TO MONO'],
    p15: ['FORMAT — MATCH THE SESSION, DELIVER WHAT’S ASKED', 'SAMPLE RATE', 'BIT DEPTH', '44.1 kHz', '48 kHz (session rate)', '16-BIT', '24-BIT', 'NAME IT LIKE YOU MEAN TO FIND IT', 'OurSong_Mix_v3_2026-09-11.wav', 'INSPECT THE BOUNCE — ALWAYS', 'RUN THE INSPECTION', 'FILE NAME', 'FORMAT', 'DITHER', 'final_FINAL_2.wav'],
    p16: ['THE PROCESS', '1 · Organize', '8 · Export & inspect', 'YOUR CONSOLE', 'LISTEN — THEN CALL IT', 'WHERE YOU STARTED', 'YOUR MIX', 'YOURS, MONO', 'Complete all eight steps', 'WHERE TO GO DEEPER', 'RESET MIX'],
  };
  it('a name list for every page', () => {
    assert.deepEqual(Object.keys(NAMES), Object.keys(GUIDES));
  });
  for (const [id, names] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(SRC.includes(n), `${id}: "${n}" is no longer in the lab’s source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
});

describe('3. the numbers and states the guides quote are what the page draws', () => {
  it('headroom ladders: two −6 dB peaks reach 0.0 dB, four reach +6.0 dB (p4)', () => {
    assert.equal(MODEL.correlatedSumPeakDb(-6, 2).toFixed(1), '0.0');
    assert.equal(MODEL.correlatedSumPeakDb(-6, 4).toFixed(1), '6.0');
    assert.match(textOf(GUIDES.p4), /0\.0 dB[\s\S]*\+6\.0 dB/);
  });
  it('prep drawing: the master meter reads −0.2 dBFS, then −6 with Leave headroom open; the lead verse clip is 9 dB down (p2)', () => {
    const art = code(`${MX}/begArt.tsx`);
    assert.match(art, /const masterPk = head \? -6 : -0\.2;/);
    assert.match(art, /after: 'LEAD'[^\n]*g: -9/);
    assert.match(textOf(GUIDES.p2), /−0\.2 to −6 dBFS/);
  });
  it('focal → anchor suggestion: Lead vocal → LEAD, The groove → KICK (p1)', () => {
    assert.match(code(`${MX}/pagesB.tsx`), /const ANCHOR_FOR_FOCAL: Record<string, TrackId> = \{ vocal: 'lead', groove: 'kick', instrument: 'gtr', atmosphere: 'keys' \};/);
  });
  it('the strip fader runs −60…+12 dB; the pan pot reads C / L… / R… and pans past 25 warn on kick, bass and lead (p5, p7)', () => {
    const kit = code(`${MX}/kit.tsx`);
    assert.match(kit, /stepValue\(db, 0, -60, 12\)/);
    assert.match(code('src/screens/lab/kit/gear.tsx'), /v === 0 \? 'C' : v < 0 \? `L\$\{Math\.abs\(v\)\}` : `R\$\{v\}`/);
    assert.equal(MODEL.panRisk(MODEL.track('kick'), 30), 'lowEndOffCentre');
    assert.equal(MODEL.panRisk(MODEL.track('bass'), -30), 'lowEndOffCentre');
    assert.equal(MODEL.panRisk(MODEL.track('lead'), 30), 'focalOffCentre');
    assert.equal(MODEL.panRisk(MODEL.track('gtr'), -100), null, 'supports may go wide');
    assert.equal(MODEL.panRisk(MODEL.track('kick'), 25), 'stable', '25 itself is still centre-ish');
  });
  it('the subtractive moves redraw as the guide says: BGV muted, three sustains −5 dB, a 1.2 kHz cut on keys and guitar (p6)', () => {
    const b = code(`${MX}/pagesB.tsx`);
    assert.match(b, /arrangement: \{ \.\.\.CROWD, bgv: \{ \.\.\.CROWD\.bgv, mute: true \} \}/);
    assert.match(b, /level: down\(CROWD, \['gtr', 'keys', 'bgv'\], \(t\) => \(\{ \.\.\.t, faderDb: \(t\.faderDb \?\? 0\) - 5 \}\)\)/);
    assert.match(b, /frequency: down\(CROWD, \['gtr', 'keys'\], \(t\) => \(\{ \.\.\.t, eq: \{ hz: 1200, gainDb: -6, q: 1 \} \}\)\)/);
    assert.match(b, /last === 'processing' \|\| last === 'automation' \? 'NOTHING CHANGES HERE'/);
  });
  it('EQ in context: the cut is 6 dB at 2.6 kHz, the high-pass 350 Hz (p8)', () => {
    const c = code(`${MX}/pagesC.tsx`);
    assert.match(c, /eq: \{ hz: 2600, gainDb: -6, q: 1\.2 \}/);
    assert.match(c, /hpHz: 350/);
    assert.match(textOf(GUIDES.p8), /6 dB cut at 2\.6 kHz[\s\S]*350 Hz/);
  });
  it('compression: −30 dB, 6:1, release 90 ms; attack 0.4 ms against 30 ms (p9)', () => {
    const c = code(`${MX}/pagesC.tsx`);
    assert.match(c, /fast'[^\n]*thresholdDb: -30, ratio: 6, attackMs: 0\.4, releaseMs: 90/);
    assert.match(c, /slow'[^\n]*thresholdDb: -30, ratio: 6, attackMs: 30, releaseMs: 90/);
  });
  it('reverb: the shared room’s four sends and the drowned five (p10)', () => {
    const c = code(`${MX}/pagesC.tsx`);
    assert.match(c, /lead: \{ verbSendDb: -10 \}, snare: \{ verbSendDb: -12 \}, gtr: \{ verbSendDb: -14 \}, bgv: \{ verbSendDb: -12 \}/);
    assert.match(c, /lead: \{ verbSendDb: 2 \}, snare: \{ verbSendDb: 0 \}, gtr: \{ verbSendDb: 0 \}, keys: \{ verbSendDb: 0 \}, bgv: \{ verbSendDb: 2 \}/);
  });
  it('automation lanes: LEAD 0 → lift (▲ +n dB), BGV −∞ → +8 (▲ ENTERS), PERC −4 → 0 (▲ +4 dB) (p13)', () => {
    const d = code(`${MX}/pagesD.tsx`);
    assert.match(d, /\{ name: 'LEAD', verseDb: 0, chorusDb: liftDb \}/);
    assert.match(d, /\{ name: 'BGV', verseDb: -60, chorusDb: 8 \}/);
    assert.match(d, /\{ name: 'PERC', verseDb: -4, chorusDb: 0 \}/);
    assert.match(d, /useState\(3\)/, 'LIFT +3 to start');
    const p = code(`${MX}/advPlots.tsx`);
    assert.match(p, /if \(a <= -60\) return '▲ ENTERS';/);
    assert.match(p, /return `\$\{d > 0 \? '▲ \+' : '▼ −'\}\$\{Math\.abs\(d\)\} dB`;/);
  });
  it('the final’s console has no EQ / high-pass control, so step 3 is ticked by a tap (p16)', () => {
    const kit = code(`${MX}/kit.tsx`);
    const strip = kit.slice(kit.indexOf('function Strip('), kit.indexOf('export function MiniConsole('));
    assert.doesNotMatch(strip, /hpHz|eq:/, 'the strip grew an EQ — update p16');
    assert.match(code(`${MX}/pagesD.tsx`), /const tappable = !s\.verified \|\| s\.id === 'masking';/);
    assert.match(textOf(GUIDES.p16), /no EQ/);
  });
  it('the final’s render adds a 3:1 lead compressor, lead and snare sends, and a +3 dB chorus ride (p16)', () => {
    assert.match(code(`${MX}/pagesD.tsx`), /lead: \{ \.\.\.\(mix\.lead \?\? \{\}\), comp: \{ thresholdDb: -26, ratio: 3, attackMs: 12, releaseMs: 120 \}, verbSendDb: -10, auto: \{ verseDb: 0, chorusDb: 3 \} \},\n\s*snare: \{ \.\.\.\(mix\.snare \?\? \{\}\), verbSendDb: -12 \}/);
  });
  it('the mono check moves GTR and KEYS from the sides (p14)', () => {
    assert.match(code(`${MX}/pagesD.tsx`), /gtr: \{ faderDb: -9, pan: -45 \},\n\s*keys: \{ faderDb: -11, pan: 45 \}/);
  });
});

describe('4. wiring: every page draws the ⓘ through PagedLab', () => {
  const SCREEN = code(`${MX}/BeginningMixingLabScreen.tsx`);
  const PAGED = code('src/screens/lab/kit/PagedLab.tsx');
  it('BeginningMixingLabScreen passes the lookup as pageGuide', () => {
    assert.match(SCREEN, /import \{ beginningMixingPageGuide \} from '\.\/beginningMixingScreenGuides';/);
    assert.match(SCREEN, /<PagedLab[^>]*pageGuide=\{beginningMixingPageGuide\}[^>]*\/>/);
  });
  it('PagedLab: no ⓘ on the what’s-left screen; the host wraps the page', () => {
    assert.match(PAGED, /const guide = ending \? undefined : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(PAGED, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\} regions=\{!!def\.rack && !ending\}>/);
  });
});

describe('5. the accuracy chip: KEPT — the lab shows measured level readouts', () => {
  it('the screen does not pass accuracy={false}; PagedLab’s default is true', () => {
    assert.doesNotMatch(code(`${MX}/BeginningMixingLabScreen.tsx`), /accuracy=\{false\}/);
    assert.match(code('src/screens/lab/kit/PagedLab.tsx'), /pageGuide, accuracy = true \}/);
  });
  it('the reason is on screen: Gain Staging draws measured meters', () => {
    assert.match(code(`${MX}/begArt.tsx`), /sub=\{a \? 'MEASURED' : 'PLAY IT'\}/);
  });
});
