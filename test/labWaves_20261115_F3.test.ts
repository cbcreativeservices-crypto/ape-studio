/**
 * Beginner waves 1-3, group F3 (owner 2026-11-15: "build waves 1 thru 3", the
 * D62 adoption plan): Game Audio Lab and Stage Plot and Channel Designer.
 * Each test below would have failed before its change.
 * Report: docs/labs/beginner_waves_2026_11_15/F3_REPORT.md
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PLAIN_TERMS, termWithShort } from '../src/features/lab/plainTerms.ts';
import { gaLogViewOf, gaPartLetter, gaPartsSpoken, type GaLogView } from '../src/screens/lab/gameaudio/bitsLogic.ts';
import { GA_TERMS_KEPT_UNSHOWN } from '../src/screens/lab/gameaudio/gaTerms.ts';
import { gaFact, gaInitial, gaReduce, gaPlaying, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { zoneAt } from '../src/screens/lab/gameaudio/model/gaWorld.ts';
import { WALK_GEN_RANGE_X, WALK_X0, WALK_Y, chcSpace, walkX } from '../src/screens/lab/gameaudio/pages/data/chcSpace.ts';
import { spAddDiDevice, spAssignDi } from '../src/features/stageplot/spModel.ts';
import { spGuidedSteps } from '../src/features/stageplot/spReview.ts';
import { SP_KEY_BADGE_MIX, SP_KEY_BADGE_NUMBER } from '../src/features/stageplot/spSymbols.ts';
import { SP_MARK_ASK_LEGEND, SP_MARK_MUST_LEGEND, spTabMarkLegend } from '../src/features/stageplot/spTabMarks.ts';
import { SP_BLANK_LEARN_LINE, SP_TEMPLATES, spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import { SP_INPUTS_DEEPER_LINE, SP_INPUTS_FOLDS, spInputsFoldLine } from '../src/screens/lab/stageplot/inputs/inputsFolds.ts';
import { stageKeyLayout } from '../src/screens/lab/stageplot/stage/stageGeom.ts';
import { stageKeyEntries, stageKeyFoot } from '../src/screens/lab/stageplot/stage/stageLinks.ts';

const read = (f: string): string => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const GA = 'src/screens/lab/gameaudio';
const SP = 'src/screens/lab/stageplot';
const page = (f: string): string => read(`${GA}/pages/${f}.tsx`);
/** The part of a source between two markers. */
const between = (s: string, a: string, b: string): string => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `marker ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `marker ${b}`);
  return s.slice(i, j);
};
const run = (s: GaState, ...as: GaAction[]): GaState => as.reduce((x, a, i) => gaReduce(x, a, x.t + 0.5 + i * 0.01).state, s);

/* ── wave 1 ─────────────────────────────────────────────────────────────── */

describe('GA-04 · a step of three or four actions is lettered parts, one action each', () => {
  it('the parts are lettered a, b, c, d in order, and read aloud with their letters', () => {
    assert.deepEqual([0, 1, 2, 3].map(gaPartLetter), ['a', 'b', 'c', 'd']);
    assert.equal(gaPartsSpoken(['Open it.', 'Close it.']), 'a: Open it. b: Close it.');
    const bits = read(`${GA}/bits.tsx`);
    assert.match(bits, /export function Do\(\{ children, parts \}/);
    assert.match(bits, /\{gaPartLetter\(i\)\}/);
  });
  it('the two steps the checker named are split (pages 8 and 9 for the learner)', () => {
    assert.ok(page('p07Instances').includes("<Do parts={['Move SPEED 2 only.', 'In GENERATORS, switch GENERATOR 1 off.', 'Choose REMOVE GENERATOR 2 while it runs.', 'Start the fault on the TROUBLESHOOT card.']} />"));
    assert.ok(!page('p07Instances').includes('Then choose REMOVE GENERATOR 2 while it runs. Last, start the fault'));
    assert.ok(page('p08GameSyncs').includes("<Do parts={['Tap SPEED, choose GENERATOR 1 · ON and move the slider.', 'In MOOD, choose ALERT.', 'Start the fault on the TROUBLESHOOT card.']} />"));
  });
  it('no single Do line on any page still asks for four sentences of actions with "Then"', () => {
    for (const f of readdirSync(`${GA}/pages`).filter((x) => /^p\d\d.*\.tsx$/.test(x))) {
      for (const m of read(`${GA}/pages/${f}`).matchAll(/<Do>([\s\S]*?)<\/Do>/g)) {
        const sentences = m[1].split(/(?<=[.?!”])\s+/).filter(Boolean).length;
        // the capstone's brief is a plan to make, not a list of actions (L-04)
        if (f.startsWith('p22')) continue;
        assert.ok(!(sentences >= 4 && /\bThen\b/.test(m[1])), `${f}: "${m[1]}"`);
      }
    }
  });
});

describe('GA-05 · every walking page walks with ONE control: WALK, with a step key at each end', () => {
  it('WALK lives in pages/shared, with ‹ STEP WEST and STEP EAST › at its ends', () => {
    const shared = read(`${GA}/pages/shared.tsx`);
    assert.match(shared, /export const walkKey = \(s: GaState\): DockParam => \(\{/);
    assert.match(shared, /\{ label: '‹ STEP WEST', onPress: \(\) => stepAlong\(-WALK_STEP_M\)/);
    assert.match(shared, /\{ label: 'STEP EAST ›', onPress: \(\) => stepAlong\(WALK_STEP_M\)/);
  });
  it('the zones, distance and walls pages all take it; no walking page walks with FACING and STEP', () => {
    assert.match(page('p10Loops'), /keys: \[walkKey\(s\), soundsKey\],/);
    assert.match(page('p11Distance'), /keys: \[walkKey\(s\), facingKey\(s\), sourcesKey\],/);
    assert.match(page('p12Walls'), /keys: \[walkKey\(s\), doorKey\(s\), roomKey\],/);
    for (const f of ['p10Loops', 'p11Distance', 'p12Walls']) assert.doesNotMatch(page(f), /stepKey\(|const walkKey|function stepAlong/, f);
    assert.doesNotMatch(page('p10Loops'), /set FACING near 270° and walk back/);
    assert.doesNotMatch(page('p11Distance'), /press STEP until STATUS reads VIRTUAL/);
  });
  it('in the model, WALK takes YOU through the open door (one ZONE crossing each way) and past the generator’s maximum at the west end', () => {
    let s = run(gaInitial(), { type: 'scene', on: true }, { type: 'door' });
    assert.equal(s.chars.player.y, WALK_Y, 'the page opens with YOU on the path');
    const crossings = gaFact(s, 'zoneCross');
    s = run(s, { type: 'move', who: 'player', x: walkX(0.9), y: WALK_Y });
    assert.equal(zoneAt(s.chars.player), 'room');
    s = run(s, { type: 'move', who: 'player', x: walkX(0.2), y: WALK_Y });
    assert.equal(zoneAt(s.chars.player), 'yard');
    assert.equal(gaFact(s, 'zoneCross') - crossings, 2);
    // the distance page: generator 1 on, then WALK to the west end goes past its maximum
    s = run(s, { type: 'machine', id: 'generator-1', on: true }, { type: 'move', who: 'player', x: walkX(0), y: WALK_Y });
    assert.ok(WALK_X0 < WALK_GEN_RANGE_X, 'the west end of the lane is past the maximum');
    assert.ok(chcSpace(s, 'generator-1').virtual, 'GENERATOR 1 reads VIRTUAL there');
    assert.ok(gaPlaying(s, 'generator'));
  });
});

describe('GA-17 · the capstone shows ONE activity log, with a choice of view', () => {
  it('one log box on the page, with the two views', () => {
    const p22 = page('p22Capstone');
    assert.equal((p22.match(/<ActivityLog /g) ?? []).length, 1);
    assert.match(p22, /<ActivityLog state=\{s\} lines=\{8\} views=\{P22_LOG_VIEWS\} \/>/);
    assert.match(p22, /\{ id: 'scene', label: 'SCENE', only: LOG_KINDS \},\n\s*\{ id: 'mix', label: 'MIX AND MUSIC', only: MIX_KINDS \},/);
  });
  it('the log opens on its first view and follows the choice', () => {
    const views: GaLogView[] = [{ id: 'a', label: 'A', only: ['start'] }, { id: 'b', label: 'B', only: ['mix'] }];
    assert.equal(gaLogViewOf(views, null)?.id, 'a');
    assert.equal(gaLogViewOf(views, 'b')?.id, 'b');
    assert.equal(gaLogViewOf(views, 'gone')?.id, 'a');
  });
  it('every page still says its marks start empty when you come back (built 2026-11-14, kept)', () => {
    assert.match(read(`${GA}/bitsLogic.ts`), /these marks start empty when you come back/);
  });
});

describe('PLOT-02 · INPUTS folds its advanced parts; MONITORS leads with its questions', () => {
  const blank = () => spFromTemplate('blank', { id: 'w3', now: 1 });
  it('five parts, each a closed row with a line that is never empty', () => {
    assert.deepEqual([...SP_INPUTS_FOLDS], ['order', 'di', 'box', 'summary', 'extras']);
    for (const id of SP_INPUTS_FOLDS) {
      const line = spInputsFoldLine(blank(), id, 'house');
      assert.ok(line.summary.trim().length > 5, id);
      assert.equal(line.ask, null, `${id}: a blank plot has nothing to correct`);
    }
    assert.equal(spInputsFoldLine(spFromTemplate('four-piece', { id: 'w4', now: 1 }), 'order', 'house').summary.length > 0, true);
  });
  it('a part with something to correct says so on its closed row', () => {
    // a mono DI device asked to carry the two sides of a stereo keyboard
    let p = spFromTemplate('four-piece', { id: 'w5', now: 1 });
    const dev = spAddDiDevice(p, { channels: 1 });
    p = dev.p;
    for (const i of p.inputs.filter((x) => x.capture === 'di')) p = spAssignDi(p, i.id, dev.id);
    const di = spInputsFoldLine(p, 'di', 'house');
    assert.ok(di.ask && /is asked to carry \d+ DI channels and has 1\./.test(di.ask), di.ask ?? 'no ask');
  });
  it('the area: the line over the parts, and every panel folded', () => {
    const area = read(`${SP}/InputsArea.tsx`);
    assert.match(area, /<Small>\{SP_INPUTS_DEEPER_LINE\}<\/Small>/);
    for (const [panel, id] of [['OrderPanel', 'order'], ['DiPanel', 'di'], ['BoxPanel', 'box'], ['SummaryPanel', 'summary'], ['ExtrasPanel', 'extras']]) assert.match(area, new RegExp(`<${panel} [^>]*fold=\\{fold\\('${id}'\\)\\} />`), panel);
    assert.match(SP_INPUTS_DEEPER_LINE, /^Five more parts/);
    // the folded Section is Setup's FoldSection, with GO DEEPER ▾
    assert.match(read(`${SP}/spForm.tsx`), /if \(p\.fold\) \{\s*return \(\s*<FoldSection /);
  });
  it('MONITORS: the questions come before the plan, and an empty plan shows no three boxes of zeros', () => {
    const area = read(`${SP}/MonitorsArea.tsx`);
    assert.ok(area.indexOf('title="QUESTIONS ABOUT MONITORS"') < area.indexOf('title="MONITOR PLAN"'));
    assert.ok(area.indexOf('{nothingYet ? null : (') < area.indexOf('value={counts.mixes}'));
  });
});

/* ── wave 2 ─────────────────────────────────────────────────────────────── */

describe('GA-01 · each page’s row of words keeps 2 to 4 words', () => {
  it('no gaTerms row on any page has more than four words', () => {
    for (const f of readdirSync(`${GA}/pages`).filter((x) => /\.tsx$/.test(x))) {
      for (const call of read(`${GA}/pages/${f}`).matchAll(/gaTerms\(((?:\s*'[^']*'\s*,?)+)\s*\)/g)) {
        const n = [...call[1].matchAll(/'([^']+)'/g)].length;
        assert.ok(n >= 1 && n <= 4, `${f}: ${n} words in one row`);
      }
    }
  });
  it('the pages the checker named are cut (they had 6 or 7)', () => {
    for (const f of ['p05Sounds', 'p13Formats', 'p14Music', 'p06Pipeline', 'p09Variation', 'p11Distance', 'p17Budgets']) {
      const row = page(f).match(/const TERMS = gaTerms\(([^)]*)\)/)![1];
      assert.ok([...row.matchAll(/'([^']+)'/g)].length <= 4, f);
    }
  });
  it('a word that left every row is kept on the glossary list, with its reason', () => {
    for (const t of ['Foley', 'Audio implementer', 'Cone attenuation', 'Music transition rule', 'Music state', 'Subtitles for the deaf and hard of hearing', 'Snapshot (Game Mix State)', 'Unity (game engine)', 'Unreal Engine'] as const) assert.ok(GA_TERMS_KEPT_UNSHOWN.includes(t), t);
    assert.match(page('p23Listener'), /'Positional audio'/, 'moved to the page that uses it');
    assert.match(page('p16Mix'), /const PRO_TERMS = gaTerms\('Event-driven audio'\);/);
  });
});

describe('GA-07 · tool names and pro details sit in a closed PRO NOTE at the end of the step', () => {
  const inPro = (src: string, text: string) => {
    const at = src.indexOf(text);
    assert.ok(at > 0, text);
    const open = src.lastIndexOf('<ProNote', at);
    const close = src.lastIndexOf('</ProNote>', at);
    return open > close;
  };
  it('the PRO NOTE is the house GO DEEPER fold, closed until opened', () => {
    const bits = read(`${GA}/bits.tsx`);
    assert.match(bits, /import \{ GoDeeper \} from '\.\.\/foundations\/GoDeeper';/);
    assert.match(bits, /return <GoDeeper hint=\{hint\}>\{children\}<\/GoDeeper>;/);
    assert.match(read('src/screens/lab/foundations/GoDeeper.tsx'), /useState\(false\)/);
  });
  it('each passage is inside a PRO NOTE, nothing removed', () => {
    assert.ok(inPro(page('p08GameSyncs'), 'Wwise groups switches, states and parameters as Game Syncs.'));
    assert.ok(inPro(page('p07Instances'), 'Some tools keep such a value on the object, others on the playing instance.'));
    assert.ok(inPro(page('p13Formats'), 'Dolby Atmos, DTS:X, Windows Sonic and Tempest 3D AudioTech'));
    assert.ok(inPro(page('p09Variation'), 'These are Wwise’s names: page 22 has the others.'));
    assert.ok(inPro(page('p17Budgets'), '<MemoryCard />'));
    assert.ok(inPro(page('p16Mix'), 'This duck is event-driven'));
  });
  it('a PRO NOTE comes after the step’s open text (the end of the step)', () => {
    const s1 = between(page('p08GameSyncs'), '<Step n={1}>', '</Step>');
    assert.ok(s1.indexOf('<Terms items={TERMS} />') < s1.indexOf('<ProNote'));
  });
});

describe('GA-08 · the output formats page opens with its question and folds surround and brand names', () => {
  const p13 = page('p13Formats');
  it('the first line is the question', () => {
    assert.match(between(p13, '<Step n={1}>', '</Step>'), /^<Step n=\{1\}>\s*<Look>Headphones have two speakers, yet a sound can seem to come from behind you\. How\?/);
  });
  it('stereo, headphone 3D and mono stay open with four words; the rest is folded', () => {
    assert.match(p13, /const TERMS = gaTerms\('Channel-based audio', 'Binaural rendering', 'HRTF', 'Downmix'\);/);
    const fold = between(p13, '<ProNote', '</ProNote>');
    for (const x of ['Object-based audio is a third idea', 'Dolby Atmos', '<ChcSpeakerMap />', '<Terms items={PRO_TERMS} />']) assert.ok(fold.includes(x), x);
    assert.ok(p13.indexOf('No headphones? Read the strip instead.') > 0, 'the no-headphones line stays');
  });
});

describe('GA-12 · page 1 says what a voice is', () => {
  const p01 = page('p01Welcome');
  it('one plain line: a voice is one sound playing right now', () => {
    assert.match(p01, /export const P01_VOICE_LINE = 'VOICES counts voices: a voice is one sound playing right now\.';/);
    assert.match(between(p01, '<Step n={1}>', '</Step>'), /\{P01_VOICE_LINE\}/);
    assert.doesNotMatch(p01, /PLAYING and VOICES count what is sounding now\. Page 8 explains them\./);
  });
  it('what is not taught yet is marked as coming later', () => {
    assert.match(p01, /PLAYING counts what the game asked to play: page 8 explains how the two differ\./);
  });
});

describe('PLOT-08 · Blank stage is the one marked start for learners', () => {
  it('its line says it is recommended, has 5 guided steps and completes the lab', () => {
    assert.match(SP_BLANK_LEARN_LINE, /^Recommended for learning: 5 guided steps, and it completes this lab\./);
    assert.equal(spGuidedSteps(spFromTemplate('blank', { id: 'w8', now: 1 }), false).length, 5, 'the number in the line is the number of steps');
    assert.equal(SP_TEMPLATES[0].id, 'blank', 'it is the first row');
  });
  it('only its START is filled; an example’s START is outlined', () => {
    const lib = read(`${SP}/ProjectLibrary.tsx`);
    assert.match(lib, /subtitle=\{t\.id === 'blank' \? SP_BLANK_LEARN_LINE : `Assumes: \$\{t\.assumes\}`\}/);
    assert.match(lib, /<Button label="START" tone=\{t\.id === 'blank' \? 'primary' : 'plain'\}/);
  });
});

/* ── wave 3 ─────────────────────────────────────────────────────────────── */

describe('GA-02 · voice, dB, take and bar get a plain meaning where they are first met', () => {
  it('dB on page 1, in the shared words; Hz on the walls page, in the shared words', () => {
    assert.match(page('p01Welcome'), /Each bar’s number is its level in \{termWithShort\('db'\)\}\./);
    assert.equal(termWithShort('db'), `dB (${PLAIN_TERMS.db.short})`);
    assert.match(page('p12Walls'), /at about \{WALL_HZ\} \{termWithShort\('hz'\)\}/);
  });
  it('take on page 2, bar on the music page', () => {
    assert.match(page('p02Reacts'), /an opening take or a closing take: a take is one version of a sound\./);
    assert.match(page('p14Music'), /four-bar phrase \(a bar is four beats\) at 96 BPM \(beats per minute\)/);
    assert.match(read(`${GA}/sounds/gaSynth.ts`), /export const MUSIC_BEATS_PER_BAR = 4;/, 'four beats a bar, as the line says');
  });
});

describe('GA-11 · the page-1 picture carries one caption', () => {
  it('the caption: what the picture is, that a game asks for sounds, and one instruction', () => {
    const p01 = page('p01Welcome');
    const m = p01.match(/export const P01_CAPTION = '([^']+)';/);
    assert.ok(m);
    assert.match(m[1], /^A game world from above\. A game asks for sounds when things happen\. Set LEVEL low, then turn SCENE on\.$/);
    assert.ok(m[1].length <= 110, `${m[1].length} characters: two lines under the display at most`);
    assert.match(p01, /caption: P01_CAPTION,/);
    assert.doesNotMatch(p01, /<Look>You are looking down on a courtyard and a workshop\./, 'the line under the display does not say it twice');
  });
  it('the rack pins it with the display (its one-sentence line, inline and in full screen)', () => {
    assert.match(read(`${GA}/GaLab.tsx`), /\.\.\.\(spec\.caption \? \{ modelNote: spec\.caption \} : null\),/);
  });
});

describe('PLOT-10 · the tab marks get a legend the first time they appear', () => {
  it('the line names only the marks on the bar, and goes once a marked tab is opened', () => {
    const none = { ask: 0, must: 0 };
    assert.equal(spTabMarkLegend([none, none], false), null);
    assert.equal(spTabMarkLegend([none, { ask: 1, must: 0 }], false), SP_MARK_ASK_LEGEND);
    assert.equal(spTabMarkLegend([{ ask: 2, must: 1 }], false), `${SP_MARK_MUST_LEGEND} ${SP_MARK_ASK_LEGEND}`);
    assert.equal(spTabMarkLegend([{ ask: 2, must: 1 }], true), null);
    assert.match(SP_MARK_ASK_LEGEND, /^\? = a question for you to answer/);
  });
  it('the screen draws it under the tabs', () => {
    const screen = read(`${SP}/StagePlotLabScreen.tsx`);
    assert.match(screen, /const legend = spTabMarkLegend\(Object\.values\(marks\), legendDone\);/);
    assert.match(screen, /\{legend \? \(\s*<Text style=\{styles\.legend\}/);
  });
});

describe('PLOT-15 · the KEY says what the boxed numbers and the M codes are', () => {
  it('a plot with channel numbers and mix codes ends its key with the packet’s own words', () => {
    const p = spFromTemplate('four-piece', { id: 'w15', now: 1 });
    const foot = stageKeyFoot(p, true);
    assert.equal(foot, `${SP_KEY_BADGE_NUMBER} ${SP_KEY_BADGE_MIX}`);
    assert.equal(stageKeyFoot(p, false), '', 'with NUMBERS off nothing is drawn, so nothing is explained');
    assert.equal(stageKeyFoot(spFromTemplate('blank', { id: 'w16', now: 1 }), true), '');
    const plain = stageKeyLayout(stageKeyEntries(p.objects), 366, 'NOT TO SCALE');
    const withFoot = stageKeyLayout(stageKeyEntries(p.objects), 366, 'NOT TO SCALE', foot);
    assert.deepEqual(plain.foot, []);
    assert.ok(withFoot.foot.length >= 1 && withFoot.height > plain.height, 'the strip grows by the line');
    assert.equal(withFoot.foot.map((l) => l.text).join(' '), foot, 'the line is wrapped, never cut');
  });
  it('the printed packet keeps its words (the same constants, the same text)', () => {
    const pk = read('src/features/stageplot/spPacket.ts');
    assert.match(pk, /brief \? `\$\{SP_KEY_BADGE_NUMBER\} \$\{SP_KEY_BADGE_MIX\}` : `A number in a box is an input channel in the input list\. \$\{SP_KEY_BADGE_MIX\}`/);
    assert.equal(`${SP_KEY_BADGE_NUMBER} ${SP_KEY_BADGE_MIX}`, 'A number in a box is an input channel. A code in a rounded box, such as M1, is a monitor mix.');
  });
});

/* ── sweeps ─────────────────────────────────────────────────────────────── */

describe('sweeps · SH-76 tray choices, SH-26 codes', () => {
  it('SH-76: page 23’s TOPIC choices each carry a one-line meaning', () => {
    const p21 = page('p21Today');
    assert.match(p21, /options: P21_TOPICS\.map\(\(x\) => \(\{ id: x\.id, label: x\.label, blurb: P21_TOPIC_BLURB\[x\.id\] \}\)\),/);
    for (const id of ['rules', 'space', 'music', 'access', 'test', 'ai']) assert.match(p21, new RegExp(`\\n  ${id}: '[^']{20,70}',`), id);
  });
  it('SH-26: FOH is spelled out where the stage box note uses it', () => {
    assert.match(read(`${SP}/inputs/BoxPanel.tsx`), /Console direct when the receivers are at front of house \(FOH\)\./);
  });
});

/* ── checker follow-ups (CHECK_F3_REPORT.md, 2026-11-15) ────────────────── */

describe('checker follow-ups', () => {
  it('GA-04: the three remaining three-action steps are lettered, in doing order (the door stays first on page 2)', () => {
    assert.ok(page('p02Reacts').includes("<Do parts={['Press OPEN DOOR and read the log. If you can listen, turn SOUND on before you press it.', 'Switch GEN 1 on to start the generator.']} />"));
    assert.ok(page('p04Games').includes("<Do parts={['Open GAMES and pick a kind of game.', 'Watch the picture, then read its card here.', 'Pick two more.']} />"));
    assert.ok(page('p07Instances').includes("<Do parts={['Open GENERATORS.', 'Choose ADD GENERATOR 2.', 'Switch GENERATOR 1 and GENERATOR 2 on.']} />"));
  });
  it('GA-05: a step stopped at the edge of the scene does not tell a WALK page to turn', () => {
    // walk YOU to the west end, then step west again
    let s = run(gaInitial(), { type: 'move', who: 'player', x: walkX(0), y: WALK_Y });
    s = run(s, { type: 'face', who: 'player', facing: 270 }, { type: 'step', who: 'player', dx: -0.7, dy: 0 });
    const note = s.log.filter((l) => l.kind === 'note').pop();
    assert.ok(note && /edge of the scene: no step was taken/.test(note.text), note?.text);
    assert.match(note!.text, /Walk back the other way$/);
    assert.doesNotMatch(note!.text, /Turn to walk/);
  });
});
