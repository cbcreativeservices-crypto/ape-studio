/**
 * Game Audio lab, page 3 "Where games run" — the platform cards, the
 * listening setups and the two budgets (pages/data/gaPlatforms.ts).
 *
 * What is pinned is what the page TEACHES and what the owner's plan forbids:
 * seven cards in the handoff's order, each complete; a listening setup and a
 * budget that are independent of the card; no certification targets, no
 * device or system names, no numbers standing in for latency or limits; and
 * the two budgets are the model's real voice limit.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gaInitial, gaReduce, gaFact } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import {
  GA_BUDGETS,
  GA_BUDGET_SHORT,
  GA_BUDGET_WORD,
  GA_LISTENING,
  GA_PLATFORMS,
  GA_PLATFORM_CORE,
  GA_PLATFORM_TEST_CHECK,
  gaBudgetAt,
  gaBudgetLane,
  gaBudgetOf,
  gaComparedCore,
  gaListening,
  gaPlatform,
  gaPlatformBlurb,
  gaSeenWord,
} from '../src/screens/lab/gameaudio/pages/data/gaPlatforms.ts';

const PAGE3 = readFileSync(new URL('../src/screens/lab/gameaudio/pages/p03Platforms.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const cardText = (p: (typeof GA_PLATFORMS)[number]): string => [p.name, p.example, ...p.compare, p.same, p.change, p.test].join('\n');
const ALL_TEXT = [...GA_PLATFORMS.map(cardText), ...GA_LISTENING.map((l) => l.blurb)].join('\n');

describe('page 3: the seven platform cards', () => {
  it('are the handoff’s seven, in its order', () => {
    assert.deepEqual(GA_PLATFORMS.map((p) => p.id), ['mobile', 'desktop', 'console', 'handheld', 'browser', 'xr', 'cloud']);
    assert.equal(new Set(GA_PLATFORMS.map((p) => p.label)).size, 7);
  });
  it('each card has every part: an example, decisions to compare, what stays, what could change, ONE test', () => {
    for (const p of GA_PLATFORMS) {
      assert.ok(p.name.trim().length >= 8, `${p.id}.name`);
      for (const [k, v] of Object.entries({ example: p.example, same: p.same, change: p.change, test: p.test })) {
        assert.ok(v.trim().length >= 25, `${p.id}.${k} is a real line`);
      }
      for (const k of ['example', 'same', 'change', 'test'] as const) assert.match(p[k], /[.]$/, `${p.id}.${k} ends as a sentence`);
      assert.ok(p.compare.length >= 3 && p.compare.length <= 5, `${p.id}: ${p.compare.length} decisions to compare`);
      assert.equal(new Set(p.compare).size, p.compare.length, `${p.id}: no repeated decision`);
      // one test = something to do, then what to confirm
      assert.equal((p.test.match(/\bConfirm\b/g) ?? []).length, 1, `${p.id}: one test, with one thing to confirm`);
      // ONE name for each card: the CARD readout says the card's own label (HANDHELD, never HYBRID)
      assert.equal(p.short, p.label, `${p.id}: the readout says the card's own name`);
    }
  });
  it('no two cards share a line (each card is its own comparison)', () => {
    const lines = GA_PLATFORMS.flatMap((p) => [p.example, p.same, p.change, p.test, ...p.compare]);
    assert.equal(new Set(lines).size, lines.length);
  });
  it('say nothing the plan forbids: no targets, no system or product names, no numbers, no dogma', () => {
    assert.ok(!/\d/.test(ALL_TEXT), 'no digits: no latency figure, no voice count, no certification target');
    // ("switch" is not in the list: the cards use it as a plain verb)
    assert.ok(!/\b(playstation|xbox|nintendo|steam|iphone|ipad|android|ios|windows|macos|linux|quest|dolby|atmos)\b/i.test(ALL_TEXT), 'no system or product names');
    assert.ok(!/\b(wwise|fmod|unity|unreal)\b/i.test(ALL_TEXT), 'tool names appear only as glossary terms and on page 20');
    assert.ok(!/\b(must|always|never)\b/i.test(ALL_TEXT), 'no dogma words');
    assert.ok(!/\b(milliseconds?|ms|latency)\b/i.test(ALL_TEXT), 'no latency claims');
    assert.ok(!/locali[sz]ation/i.test(ALL_TEXT));
    assert.ok(!/\b(colour|behaviour|centre|metre|programme|organis|recognis|grey)\b/i.test(ALL_TEXT), 'US spelling');
  });
  it('the cards carry the page’s three glossary ideas where they belong', () => {
    const consoleCard = gaPlatform('console')!;
    assert.match(consoleCard.change, /certification/);
    assert.match(consoleCard.change, /controllers? have a small speaker/);
    assert.match(consoleCard.same + gaPlatform('browser')!.change, /game engine/);
    assert.match(gaPlatform('cloud')!.change, /a way to deliver a game, not a kind of device/);
    assert.match(gaPlatform('handheld')!.change, /overlaps mobile, desktop and console/);
    // one name for each thing: headphones are never "PHONES" on a page about phones (L-07)
    assert.equal(gaListening('headphones')!.short, 'HEADPHONES');
    assert.equal(gaPlatform('handheld')!.short, 'HANDHELD');
  });
  it('the first goal asks for mobile, desktop, console and browser, in any order, and nothing less', () => {
    assert.deepEqual([...GA_PLATFORM_CORE], ['mobile', 'desktop', 'console', 'browser']);
    assert.equal(gaComparedCore([]), false);
    assert.equal(gaComparedCore(['mobile', 'desktop', 'console']), false);
    assert.equal(gaComparedCore(['handheld', 'xr', 'cloud', 'mobile', 'desktop', 'console']), false);
    assert.equal(gaComparedCore(['browser', 'console', 'desktop', 'mobile']), true);
    assert.equal(gaComparedCore(['cloud', 'browser', 'xr', 'console', 'desktop', 'mobile']), true);
  });
  it('nothing is chosen until the student chooses', () => {
    assert.equal(gaPlatform(null), undefined);
    assert.equal(gaListening(null), undefined);
  });
});

describe('page 3: listening is a separate choice', () => {
  it('five setups, each with its own plain description', () => {
    assert.deepEqual(GA_LISTENING.map((l) => l.id), ['speaker', 'headphones', 'tv', 'soundbar', 'headset']);
    for (const l of GA_LISTENING) {
      assert.ok(l.blurb.length >= 40 && l.blurb.length <= 160, `${l.id}: ${l.blurb.length} characters`);
      assert.ok(l.short.length <= 10 && /^[A-Z]+$/.test(l.short), `${l.id}: the readout value "${l.short}" is one word`);
      assert.ok(l.label.split(' ').includes(l.short), `${l.id}: "${l.short}" is a word of its own name "${l.label}"`);
    }
    assert.equal(new Set(GA_LISTENING.map((l) => l.short)).size, 5);
    assert.ok(!GA_LISTENING.some((l) => l.short === 'PHONES'));
  });
  it('no setup is tied to a platform: the data has no link from one to the other', () => {
    for (const p of GA_PLATFORMS) assert.ok(!('listening' in p) && !('budget' in p), `${p.id} carries no listening setup and no budget`);
    for (const l of GA_LISTENING) assert.ok(!('platform' in l));
  });
});

describe('page 3: the budget is the scene’s voice limit, and belongs to no platform', () => {
  it('COMPACT is 8 voices, EXPANDED is 16, and EXPANDED is how the scene starts', () => {
    assert.deepEqual({ ...GA_BUDGETS }, { compact: 8, expanded: 16 });
    assert.equal(gaInitial().voiceLimit, GA_BUDGETS.expanded);
    assert.deepEqual({ ...GA_BUDGET_WORD }, { compact: 'COMPACT', expanded: 'EXPANDED' });
  });
  it('the BUDGET key shows the limit itself, in seven letters or fewer (an eight-letter value is cut in the dock)', () => {
    assert.deepEqual({ ...GA_BUDGET_SHORT }, { compact: '8 MAX', expanded: '16 MAX' });
    for (const v of Object.values(GA_BUDGET_SHORT)) assert.ok(v.length <= 7, v);
  });
  it('the page opens with nothing playing and the EXPANDED budget: only the limit changes here', () => {
    const busy = gaReduce(gaReduce(gaInitial(), { type: 'scene', on: true }, 1).state, { type: 'voiceLimit', limit: GA_BUDGETS.compact }, 2).state;
    const open = gaReduce(busy, { type: 'enterPage' }, 3).state;
    assert.equal(open.inst.length, 0);
    assert.equal(open.voiceLimit, GA_BUDGETS.expanded);
    const compact = gaReduce(open, { type: 'voiceLimit', limit: GA_BUDGETS.compact }, 4).state;
    assert.equal(compact.inst.length, 0, 'nothing to stop');
    assert.deepEqual(compact.log.map((l) => l.kind), ['mix'], 'one MIX line, no STOP line');
  });
  it('the slider has two positions, and reads back where the scene is', () => {
    assert.equal(gaBudgetAt(0), 'compact');
    assert.equal(gaBudgetAt(0.49), 'compact');
    assert.equal(gaBudgetAt(0.5), 'expanded');
    assert.equal(gaBudgetAt(1), 'expanded');
    for (const id of ['compact', 'expanded'] as const) {
      assert.equal(gaBudgetAt(gaBudgetLane(GA_BUDGETS[id])), id, `${id} round-trips through the lane`);
      assert.equal(gaBudgetOf(GA_BUDGETS[id]), id);
    }
  });
  it('a limit another page left behind is neither budget, and is not called one', () => {
    assert.equal(gaBudgetOf(0), null);
    assert.equal(gaBudgetOf(4), null);
    assert.equal(gaBudgetOf(12), null);
  });
  it('choosing a budget is a fact in the model (the page’s BUDGET goal), with its line in the log', () => {
    let s = gaInitial();
    s = gaReduce(s, { type: 'voiceLimit', limit: GA_BUDGETS.compact }, 1).state;
    assert.equal(s.voiceLimit, 8);
    assert.equal(gaFact(s, `limit:${GA_BUDGETS.compact}`), 1);
    assert.match(s.log[s.log.length - 1].text, /^BUDGET: at most 8 voices may sound at the same time$/);
    assert.equal(s.log[s.log.length - 1].kind, 'mix');
    s = gaReduce(s, { type: 'voiceLimit', limit: GA_BUDGETS.expanded }, 2).state;
    assert.equal(gaFact(s, `limit:${GA_BUDGETS.expanded}`), 1);
  });
});

describe('page 3: every control changes something the learner can read (walk audit W1)', () => {
  it('PLATFORM: the key counts the cards seen (never a second name), and its tray keeps the chosen card’s name and test in view', () => {
    assert.equal(gaSeenWord(0), 'PICK');
    assert.equal(gaSeenWord(3), '3 SEEN');
    assert.doesNotMatch(gaSeenWord(3), /\bof\b|\//, 'no "N of total"');
    for (const p of GA_PLATFORMS) {
      const b = gaPlatformBlurb(p);
      assert.ok(b.startsWith('One test: ') && b.endsWith(p.test), p.id);
    }
    assert.match(PAGE3, /valueLabel: gaSeenWord\(seen\.length\)/);
    assert.match(PAGE3, /blurb: gaPlatformBlurb\(p\)/);
  });
  it('■ STOP is never silent here: its STOP ALL line (a GAME line) is in the page’s log (F27)', () => {
    const s = gaReduce(gaInitial(), { type: 'stopAll' }, 1).state;
    assert.equal(s.log[s.log.length - 1].kind, 'trigger');
    assert.match(PAGE3, /only=\{\['mix', 'trigger'\]\}/);
  });
});

describe('page 3: the second check needs the cards (learning audit L-21)', () => {
  it('each option is one card’s test in fewer words; the browser’s is asked for', () => {
    assert.equal(GA_PLATFORM_TEST_CHECK.ask, 'browser');
    const ofs = GA_PLATFORM_TEST_CHECK.options.map((o) => o.of);
    assert.equal(new Set(ofs).size, 4);
    assert.ok(ofs.includes('browser'));
    const key: Record<string, RegExp> = { browser: /tab.*first tap/, console: /Suspend.*resume/, handheld: /Dock and undock/, cloud: /stream/ };
    for (const o of GA_PLATFORM_TEST_CHECK.options) {
      assert.match(o.text, key[o.of], o.of);
      assert.match(gaPlatform(o.of)!.test, key[o.of], `${o.of}: the option is that card's own test`);
    }
  });
  it('the correct option is not the longest, on either check (L-16)', () => {
    const right = GA_PLATFORM_TEST_CHECK.options.find((o) => o.of === GA_PLATFORM_TEST_CHECK.ask)!.text;
    assert.ok(right.length < Math.max(...GA_PLATFORM_TEST_CHECK.options.map((o) => o.text.length)));
    const block = PAGE3.slice(PAGE3.indexOf('options={['), PAGE3.indexOf(']}', PAGE3.indexOf('options={[')));
    const opts = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    assert.equal(opts.length, 4);
    assert.ok(opts[0].length < Math.max(...opts.slice(1).map((o) => o.length)), opts.map((o) => o.length).join('/'));
    assert.match(PAGE3, /label: 'Pass both checks', hit: check && check2/);
  });
});
