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
 *      from the page files), and the picture draws them in number order.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GA_TOOLS, GA_TOOL_MAP, GA_TOOL_NONE, GA_TOOL_WINDOWS, gaToolRowSpoken, gaToolWindowMet } from '../src/screens/lab/gameaudio/pages/data/gaToolMap.ts';

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
    assert.match(SOURCES, /In Wwise, the word Trigger means one thing only/);
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
