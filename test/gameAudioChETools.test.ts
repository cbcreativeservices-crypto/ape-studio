/**
 * Game Audio lab, chapter 6 — page 20's tool map (pages/data/gaToolMap.ts).
 *
 * The map names real products, so its accuracy is the whole point (owner:
 * "ACCURACY IS MANDATORY"). What this file holds to:
 *
 *   1. the twelve ideas and four tools the page promises, in order;
 *   2. EVERY cell that is not a dash is in the internal register
 *      docs/labs/gameaudio/SOURCES_TOOLS.md, in its own row, spelled the
 *      same: a cell cannot be added or changed without the vendor's page
 *      being recorded beside it;
 *   3. the dashes are exactly the cells that were left unverified on
 *      purpose: filling one in is a decision, not a drive-by edit;
 *   4. the student's glossary words are recognizable in the map;
 *   5. the eight usual windows point at real pages of this lab (titles read
 *      from the page files), and the picture draws them in number order;
 *   6. (audit 2) every dash says what to look for instead, recorded word for
 *      word; the checks need the tool names; the correct option is never the
 *      longest; page 21 never calls the lab procedural.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GA_TOOLS, GA_TOOL_INSTEAD, GA_TOOL_MAP, GA_TOOL_NONE, GA_TOOL_WINDOWS, gaToolInstead, gaToolRowSpoken, gaToolWindowMet } from '../src/screens/lab/gameaudio/pages/data/gaToolMap.ts';

const SOURCES = readFileSync(join(process.cwd(), 'docs/labs/gameaudio/SOURCES_TOOLS.md'), 'utf8').replace(/\r\n/g, '\n');

/** The lab's real page titles, read from the page files (PageDef.title). */
const PAGES_DIR = join(process.cwd(), 'src/screens/lab/gameaudio/pages');
const PAGE_TITLES = readdirSync(PAGES_DIR)
  .filter((f) => /^p\d\d\w+\.tsx$/.test(f))
  .map((f) => readFileSync(join(PAGES_DIR, f), 'utf8').replace(/\r\n/g, '\n').match(/export const P\d\d: PageDef = \{\s*title: '([^']+)'/)?.[1] ?? '');

const SOURCE_LABEL = { wwise: 'Wwise', fmod: 'FMOD Studio', unity: 'Unity', unreal: 'Unreal Engine' } as const;

/** The text of one row's section in the register. */
function section(id: string): string {
  const at = SOURCES.indexOf(`\n### ${id} — `);
  assert.ok(at >= 0, `SOURCES_TOOLS.md has a section for "${id}"`);
  const end = SOURCES.indexOf('\n##', at + 5);
  return SOURCES.slice(at, end < 0 ? undefined : end);
}

describe('page 20: what each idea is called', () => {
  it('twelve ideas, four tools, in the order the page promises', () => {
    assert.deepEqual(
      GA_TOOL_MAP.map((r) => r.id),
      ['event', 'instance', 'parameter', 'switch', 'state', 'random', 'bus', 'mix', 'bank', 'emitter', 'listener', 'profiler'],
    );
    assert.deepEqual(
      GA_TOOLS.map((t) => t.id),
      ['wwise', 'fmod', 'unity', 'unreal'],
    );
    for (const r of GA_TOOL_MAP) {
      assert.ok(r.idea.length > 2 && r.meaning.length > 15, `${r.id}: an idea and its meaning`);
      for (const t of GA_TOOLS) assert.ok(typeof r[t.id] === 'string' && r[t.id].trim().length > 0, `${r.id}.${t.id}: a name or a dash, never empty`);
    }
  });

  it('every cell that is not a dash is recorded, with its vendor page and the date, in SOURCES_TOOLS.md', () => {
    assert.match(SOURCES, /Date of every check below: 2026-11-12/);
    for (const r of GA_TOOL_MAP) {
      const sec = section(r.id);
      for (const t of GA_TOOLS) {
        const cell = r[t.id];
        const line = sec.split('\n').find((l) => l.startsWith(`- ${SOURCE_LABEL[t.id]}: `));
        assert.ok(line, `${r.id}: a ${SOURCE_LABEL[t.id]} line in the register`);
        if (cell === GA_TOOL_NONE) {
          assert.ok(line!.startsWith(`- ${SOURCE_LABEL[t.id]}: — |`), `${r.id}.${t.id}: the register also says dash`);
          assert.match(line!, /Left as a dash\./, `${r.id}.${t.id}: the register says why it is a dash`);
        } else {
          assert.ok(line!.startsWith(`- ${SOURCE_LABEL[t.id]}: **${cell}** |`), `${r.id}.${t.id}: "${cell}" is the register's own spelling`);
          // a documentation page: one of the base addresses, and words that support it
          assert.match(line!, /\b(WH|WS|FS|FU|UM|UE)`[^`]+`/, `${r.id}.${t.id}: the page that was read`);
          assert.ok(line!.split('|').length >= 4, `${r.id}.${t.id}: page title, address and supporting words`);
        }
      }
    }
  });

  it('the dashes are exactly the cells left unverified on purpose', () => {
    const dashes = GA_TOOL_MAP.flatMap((r) => GA_TOOLS.filter((t) => r[t.id] === GA_TOOL_NONE).map((t) => `${r.id}.${t.id}`));
    assert.deepEqual(dashes, ['event.unity', 'instance.unity', 'instance.unreal', 'parameter.unity', 'switch.unity', 'state.unity', 'state.unreal', 'bank.unity', 'bank.unreal']);
    // the two middleware tools have a close idea for every row
    for (const r of GA_TOOL_MAP) for (const id of ['wwise', 'fmod'] as const) assert.notEqual(r[id], GA_TOOL_NONE, `${r.id}.${id}`);
  });

  it('the two cells the audio review changed stay changed', () => {
    const row = (id: string) => GA_TOOL_MAP.find((r) => r.id === id)!;
    // Unity's exposed parameter moves a whole mixer group, not a value on one playing sound
    assert.equal(row('parameter').unity, GA_TOOL_NONE);
    // a Sound Cue is an asset the game plays, and the cell says so
    assert.equal(row('event').unreal, 'Sound Cue or MetaSound Source (an asset the game plays, not an event)');
    assert.match(SOURCES, /A Wwise Trigger starts a music stinger/);
  });

  it('the student’s glossary words are recognizable in the map', () => {
    const cell = (id: string, tool: 'wwise' | 'fmod' | 'unity' | 'unreal') => GA_TOOL_MAP.find((r) => r.id === id)![tool];
    assert.match(cell('parameter', 'wwise'), /RTPC/);
    assert.match(cell('random', 'wwise'), /Random Container/);
    assert.match(cell('switch', 'wwise'), /Switch Group/);
    assert.match(cell('state', 'wwise'), /State Group/);
    assert.match(cell('bank', 'wwise'), /SoundBank/);
    assert.match(cell('mix', 'fmod'), /Snapshot/);
    assert.match(cell('mix', 'unity'), /Snapshot/);
    assert.match(cell('parameter', 'unreal'), /MetaSound/);
  });

  it('no cell carries a status word, a number or a claim', () => {
    for (const r of GA_TOOL_MAP) {
      for (const t of GA_TOOLS) assert.ok(!/beta|experimental|preview|\d|best|most/i.test(r[t.id]), `${r.id}.${t.id}: "${r[t.id]}"`);
      assert.ok(!/\b(must|always|never)\b/i.test(r.meaning), `${r.id}: no dogma`);
    }
  });

  it('a card is read aloud with its dashes as words', () => {
    const state = gaToolRowSpoken(GA_TOOL_MAP.find((r) => r.id === 'state')!);
    assert.match(state, /^State\. /);
    assert.match(state, /Wwise: State, in a State Group\./);
    assert.match(state, /Unity: no close idea of its own\./);
    assert.ok(!state.includes(GA_TOOL_NONE));
  });
});

describe('page 20: the usual windows', () => {
  it('the eight kinds of window, numbered 1 to 8 in the order of the list', () => {
    assert.deepEqual(
      GA_TOOL_WINDOWS.map((w) => w.id),
      ['files', 'events', 'gameinfo', 'music', 'properties', 'mixer', 'audition', 'profiler'],
    );
    assert.deepEqual(
      GA_TOOL_WINDOWS.map((w) => w.n),
      [1, 2, 3, 4, 5, 6, 7, 8],
    );
  });

  it('the picture lays the panels out in number order, left to right and top to bottom', () => {
    const src = readFileSync(join(PAGES_DIR, 'cheToolMap.tsx'), 'utf8').replace(/\r\n/g, '\n');
    const figure = src.slice(src.indexOf('export function ToolWindowsFigure'), src.indexOf('export function ToolWindowList'));
    const drawn = [...figure.matchAll(/<Panel id="(\w+)"/g)].map((m) => m[1]);
    assert.deepEqual(drawn, GA_TOOL_WINDOWS.map((w) => w.id));
    for (const w of GA_TOOL_WINDOWS) assert.match(SOURCES, new RegExp(`\\| ${w.n} `), `window ${w.n} is in the register`);
  });

  it('each says what you do there in one or two sentences, and where the lab taught it', () => {
    for (const w of GA_TOOL_WINDOWS) {
      const sentences = w.does.split(/(?<=[.!?])\s+/).filter(Boolean);
      assert.ok(sentences.length >= 1 && sentences.length <= 2, `${w.id}: ${sentences.length} sentences`);
      assert.match(w.does, /^You /, `${w.id}: speaks to the student`);
      assert.ok(w.tag.length <= 12, `${w.id}: "${w.tag}" fits its panel`);
      assert.ok(w.met.length > 0 || !!w.metNote, `${w.id}: a page title, or a note`);
      for (const title of w.met) assert.ok(PAGE_TITLES.includes(title), `${w.id}: "${title}" is the title of a page of this lab`);
      assert.match(gaToolWindowMet(w), /^In this lab: .+\.$/);
    }
  });

  it('no real product is named in the general picture', () => {
    const text = GA_TOOL_WINDOWS.map((w) => `${w.tag} ${w.name} ${w.does} ${w.metNote ?? ''}`).join(' ');
    assert.ok(!/wwise|fmod|unity|unreal|metasound/i.test(text));
    assert.ok(!/\b(must|always|never)\b/i.test(text));
  });
});

/* ── audit 2 (2026-11-12): the names are practiced, a dash says what to look for ── */

/** Every <UnderstandingCheck> on a page, read from its source: question,
 *  options (correct is always 0 on these pages) and the explain line. */
function checksOf(file: string): { question: string; options: string[]; correct: number }[] {
  const src = readFileSync(join(PAGES_DIR, file), 'utf8').replace(/\r\n/g, '\n');
  return [...src.matchAll(/<UnderstandingCheck([\s\S]*?)\/>/g)].map((m) => {
    const block = m[1];
    const question = block.match(/question="([^"]+)"/)![1];
    const optsSrc = block.match(/options=\{\[([\s\S]*?)\]\}/)![1];
    const options = [...optsSrc.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]);
    const correct = Number(block.match(/correct=\{(\d+)\}/)![1]);
    return { question, options, correct };
  });
}
const ROW = (id: string) => GA_TOOL_MAP.find((r) => r.id === id)!;
/** The head of a cell: the name before any ", " or " (" qualifier. */
const head = (cell: string) => cell.split(/, | \(/)[0].trim();

describe('page 20: what to look for where a tool has a dash (audit 2, L-05)', () => {
  it('every dash has exactly one "look for instead" line, and no name cell has one', () => {
    for (const r of GA_TOOL_MAP) {
      for (const t of GA_TOOLS) {
        const instead = gaToolInstead(r.id, t.id);
        if (r[t.id] === GA_TOOL_NONE) assert.ok(instead && instead.length > 20 && /\.$/.test(instead), `${r.id}.${t.id}: a dash says what to look for instead`);
        else assert.equal(instead, null, `${r.id}.${t.id}: a name needs no "instead"`);
      }
    }
    for (const [id, cells] of Object.entries(GA_TOOL_INSTEAD)) for (const tool of Object.keys(cells)) assert.equal(ROW(id)[tool as keyof typeof SOURCE_LABEL], GA_TOOL_NONE, `${id}.${tool} is a dash`);
  });
  it('each line is recorded word for word beside its dash in SOURCES_TOOLS.md, and names only what the record holds for that tool', () => {
    for (const r of GA_TOOL_MAP) {
      const sec = section(r.id);
      for (const t of GA_TOOLS) {
        const instead = gaToolInstead(r.id, t.id);
        if (!instead) continue;
        const line = sec.split('\n').find((l) => l.startsWith(`- ${SOURCE_LABEL[t.id]}: — |`))!;
        assert.ok(line.includes(`Look for instead: "${instead}"`), `${r.id}.${t.id}: the register holds the line`);
        // a capitalized product word in the line is a cell of the same tool, or "Audio Clip" (the vendor's words quoted beside the dash)
        const column = GA_TOOL_MAP.map((x) => x[t.id]).filter((c) => c !== GA_TOOL_NONE).join(' | ');
        for (const m of instead.matchAll(/\b(?:Audio|Snapshot|Control|Sound)\b(?: (?:[A-Z][a-z]+|of an|of a))*/g)) {
          assert.ok(column.includes(m[0]) || m[0] === 'Audio Clip', `${r.id}.${t.id}: "${m[0]}" is a ${SOURCE_LABEL[t.id]} name in the map`);
        }
      }
    }
  });
  it('the card read aloud says the dash in words and what to look for', () => {
    const ev = gaToolRowSpoken(ROW('event'));
    assert.match(ev, /Unity: no close idea of its own\. No event layer\. A script tells an Audio Source to play an Audio Clip\./);
  });
});

describe('page 20: Unreal Engine has two systems; the record says 5.9 is a preview (audit 2, B3, B9)', () => {
  it('the Random cell names the MetaSound node as well, and the page says there are two systems', () => {
    assert.equal(ROW('random').unreal, 'Random node in a Sound Cue, or Random Get node in a MetaSound');
    assert.equal(head(ROW('random').unreal), 'Random node in a Sound Cue', 'a small window prints a whole name');
    const page = readFileSync(join(PAGES_DIR, 'p20Tools.tsx'), 'utf8');
    assert.match(page, /Unreal Engine builds a sound in two ways: the older Sound Cue and the newer MetaSound\./);
    assert.match(SOURCES, /Random Get node randomly retrieves elements from an input array/);
  });
  it('the version line says 5.9 is a Preview, and FMOD Studio’s revision is not claimed as confirmed', () => {
    const ue = SOURCES.split('\n').find((l) => l.startsWith('| Unreal Engine |'))!;
    assert.match(ue, /5\.9 is a PREVIEW/);
    const fm = SOURCES.split('\n').find((l) => l.startsWith('| FMOD Studio |'))!;
    assert.match(fm, /unconfirmed/);
  });
  it('the Snapshot idea and the audition window carry the names the rest of the lab uses (L-33)', () => {
    assert.equal(ROW('mix').idea, 'Snapshot (a saved mix setup)');
    assert.equal(GA_TOOL_WINDOWS.find((w) => w.id === 'audition')!.name, 'The audition controls');
  });
});

describe('page 20: the checks need the tool names (audit 2, L-05, B10, L-16, W2-28)', () => {
  const checks = checksOf('p20Tools.tsx');
  const page = readFileSync(join(PAGES_DIR, 'p20Tools.tsx'), 'utf8');
  it('six checks, the count the page and the end screen say, and the page says the checks complete it', () => {
    assert.equal(checks.length, 6);
    assert.match(page, /export const P20_CHECKS = 6;/);
    assert.match(page, /The six checks below complete this page\./);
    const screen = readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/GameAudioLabScreen.tsx'), 'utf8');
    assert.match(screen, /19: 'Counts once its six checks are done;/);
    assert.match(screen, /20: 'Counts once its two checks are done;/);
    assert.equal(checksOf('p21Today.tsx').length, 2);
  });
  it('the correct option is never the longest', () => {
    for (const f of ['p20Tools.tsx', 'p21Today.tsx']) {
      for (const c of checksOf(f)) {
        assert.equal(c.correct, 0);
        const others = c.options.filter((_, i) => i !== c.correct).map((o) => o.length);
        assert.ok(c.options[c.correct].length < Math.max(...others), `${f}: "${c.options[c.correct]}" is the longest option`);
      }
    }
  });
  it('five of the six cannot be answered without a name card: each option is a name of the tool the question names', () => {
    const TOOL_OF: Record<string, keyof typeof SOURCE_LABEL> = { 'In FMOD Studio': 'fmod', 'What is the nearest name in Unity': 'unity', 'In Wwise, the generator': 'wwise', 'In Unreal Engine': 'unreal' };
    let named = 0;
    for (const c of checks) {
      const key = Object.keys(TOOL_OF).find((k) => c.question.includes(k));
      if (!key) continue;
      named++;
      const tool = TOOL_OF[key];
      const names = GA_TOOL_MAP.map((r) => r[tool]).filter((x) => x !== GA_TOOL_NONE).flatMap((cell) => [cell, head(cell), ...cell.split(/, (?:in an? |in |linked by an |or )?| in an? /)]);
      for (const opt of c.options) for (const part of opt.split(' and ')) assert.ok(names.some((n) => n.toLowerCase() === part.toLowerCase()), `"${part}" is a ${SOURCE_LABEL[tool]} name in the map`);
    }
    assert.equal(named, 4, 'one check for each tool');
    // and one goes from a Wwise name to its kind of window (B10: "defines the list", not "holds that choice")
    const win = checks.find((c) => c.question.includes('Switch Group'))!;
    assert.match(win.question, /Which kind of window defines it\?/);
    assert.ok(ROW('switch').wwise.includes('Switch Group'));
    for (const opt of win.options) assert.ok(GA_TOOL_WINDOWS.some((w) => opt.startsWith(w.name.replace(/, or .*$/, ''))), `"${opt}" is one of the eight windows`);
  });
  it('Game Syncs and Trigger are said as Wwise’s words, as on page 8 and the glossary chip (A1, decision 3)', () => {
    assert.match(page, /In Wwise, Game Syncs are Switches, States, Game Parameters \(linked by RTPCs\) and Triggers\. A Wwise Trigger starts a music stinger\./);
    assert.match(SOURCES, /In Wwise, Game Syncs are Switches, States, Game Parameters \(linked by RTPCs\) and Triggers\. A Wwise Trigger starts a music stinger\./);
  });
});

describe('page 21: true to the lab, short, and its checks are fair (audit 2, L-06, L-20)', () => {
  const src = readFileSync(join(PAGES_DIR, 'p21Today.tsx'), 'utf8');
  const text = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  it('it never says the lab is procedural, and says every sound is a file made ahead of time', () => {
    assert.match(text, /Nothing in this lab is procedural: every sound is a file made ahead of time\./);
    assert.ok(!/generator is procedural|procedural generator in this lab/i.test(text));
  });
  it('nothing dated, no statistics, no hype, no career promise', () => {
    assert.ok(!/\b(20\d\d|percent|%|most studios|revolution|cutting-edge|powerful|simply|career|salary)\b/i.test(text));
  });
  it('every option of check 1 is a real way to make the wind, and every option of check 2 a real use of AI or none', () => {
    const [c1, c2] = checksOf('p21Today.tsx');
    assert.ok(!c1.options.some((o) => /sound bank|stinger/i.test(o)));
    assert.ok(!c2.options.some((o) => /^(Procedural audio|Adaptive music)$/.test(o)));
  });
});

/* ── part B: pages 20 and 21 on the rack (lead's decision 1; W2-18) ──────── */

describe('pages 20 and 21 have a display the learner operates', () => {
  const code = (f: string) => readFileSync(join(PAGES_DIR, f), 'utf8').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const HUD_IDS = readFileSync(join(process.cwd(), 'src/screens/lab/gameaudio/scene/hud/gaHudTypes.ts'), 'utf8');
  it('page 20: the glass is the tool-window stage, driven by WINDOW and TOOL, alive from SCENE and SPEED', () => {
    const src = code('p20Tools.tsx');
    assert.match(src, /<GaRack/);
    assert.match(src, /glass: \(w, h\) => <GaToolsStage w=\{w\} h=\{h\} tool=\{tool\} win=\{win\} state=\{s\} \/>/);
    assert.match(src, /keys: \[windowKey\(win, setWin\), toolKey, sceneKey, speedKey\(s\)\]/);
    assert.match(src, /label: 'WINDOW'/);
    assert.match(src, /label: 'TOOL'/);
    assert.match(src, /id: 'any', label: 'ANY TOOL'/);
    assert.match(src, /rack: true/);
    // the text points at the display with the keys' own names
    assert.match(src, /Slide WINDOW to light each window in turn\. Choose a TOOL to see that tool’s names\. In SCENE, start a sound: the windows show it\./);
    // the AUDITION window's sentence ("The keys under the picture play each event by hand") is true: SCENE plays events by hand
    for (const chip of ['OPEN DOOR', 'GENERATOR 1', 'label="STEP"', 'MUSIC', 'GUIDE LINE']) assert.ok(src.includes(chip), chip);
  });
  it('page 21: each TOPIC sets up what the lab really has, with a strip that exists; AI shows nothing and says so', () => {
    const src = code('p21Today.tsx');
    assert.match(src, /<GaRack/);
    assert.match(src, /rack: true/);
    const topics = [...src.matchAll(/id: '(\w+)',\s*label: '([A-Z]+)',\s*hud: '(\w+)'/g)].map((m) => ({ id: m[1], label: m[2], hud: m[3] }));
    assert.deepEqual(topics.map((t) => t.label), ['RULES', 'SPACE', 'MUSIC', 'ACCESS', 'TEST', 'AI']);
    for (const t of topics) assert.ok(HUD_IDS.includes(`| '${t.hud}'`), `${t.label}: strip ${t.hud} is a strip id`);
    assert.deepEqual(Object.fromEntries(topics.map((t) => [t.label, t.hud])), { RULES: 'mix', SPACE: 'wall', MUSIC: 'music', ACCESS: 'lines', TEST: 'voices', AI: 'mix' });
    // AI: no demo
    assert.match(src, /id: 'ai',[\s\S]*?setUp: \(\) => \{\},[\s\S]*?says: 'This lab uses no AI, so there is nothing to show/);
    // nothing claims the lab's sounds are procedural or generated
    for (const m of src.matchAll(/says: '([^']+)'/g)) assert.ok(!/\b(procedural(?! version)|generated|generative)\b/i.test(m[1].replace(/not procedural|no AI/g, '')), m[1]);
    // every topic starts from the clean scene
    assert.match(src, /gaDispatch\(\{ type: 'stopAll' \}\);\s*gaDispatch\(\{ type: 'enterPage' \}\);/);
  });
});
