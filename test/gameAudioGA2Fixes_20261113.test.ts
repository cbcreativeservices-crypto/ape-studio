/**
 * Game Audio lab — bug test GA2 (pages 12 to 22), fixer GF2, 2026-11-13.
 * Each test pins one bug of docs/labs/bugtest_2026_11_13/
 * BUGTEST_GAMEAUDIO_2_PAGES_12_22.md and fails on the code as it was:
 *
 *   B-01  page 21 opened on a SPEED slider that moved only its own number
 *   B-02  page 18: ■ STOP while an action travelled left "ON ITS WAY" forever
 *   B-03  page 12: the WALK key's value was cut ("WORKSH…")
 *   B-05  page 17: ‹ FEWER at the protected floor did nothing, silently
 *   B-07  page 12: the wall strip's words collided at 320 wide
 *   B-08  the voices strip's label called a lowered BUDGET a theft
 *   B-09  page 16: nothing said what 0 dB is on the computed meters (said
 *         once, on the SIGNAL PATH card)
 *   B-10  page 19: the orphan's slot did not say it had no owner
 *   B-11  the music strip's spoken beat floored absolute scene time
 *   B-12  page 20: the profiler printed the lab's running clock
 *   B-13  JSX `style={{ k: x.value }}`: the worklets Babel plugin wraps each
 *         such read in a console.warn on every render (7,700 warnings)
 *   B-17  page 12: small truths (GEN 1's words, the reverb row, grammar)
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { gaInitial, gaReduce, gaVoiceOut, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import { P17_LOG_KINDS, budgetLaneWords, budgetWords, protectedSounding } from '../src/screens/lab/gameaudio/pages/data/gaBudget.ts';
import { NET_DROPPED_WORD, netDroppedWords, netFlightKey, netMemoryAdvance, netMemoryStart, newestFlight } from '../src/screens/lab/gameaudio/pages/data/gaNet.ts';
import { METER_ZERO } from '../src/screens/lab/gameaudio/pages/data/gaMix.ts';
import { G13 } from '../src/screens/lab/gameaudio/pages/guides/p13.ts';
import { G12 } from '../src/screens/lab/gameaudio/pages/guides/p12.ts';
import { G21 } from '../src/screens/lab/gameaudio/pages/guides/p21.ts';
import { B_BEAT_S, bBeatFloor, bTreatment, bWallLayout, bWallSummary } from '../src/screens/lab/gameaudio/scene/hud/bModel.ts';
import { cBusMeters, cNetBoard, cNetKeep, cNetSpoken, cToolsLive, cVoiceBoard, cVoicesSpoken } from '../src/screens/lab/gameaudio/scene/hud/cModel.ts';

const ROOT = process.cwd();
const GA = join(ROOT, 'src/screens/lab/gameaudio');
const read = (p: string) => readFileSync(join(GA, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function run(s: GaState, ...actions: GaAction[]): GaState {
  let out = s;
  for (const a of actions) out = gaReduce(out, a).state;
  return out;
}
const clean = (): GaState => gaReduce(gaInitial(), { type: 'enterPage' }).state;
const tick = (s: GaState, by: number): GaState => gaReduce(s, { type: 'tick', t: s.t + by }).state;

/* ── B-01 ───────────────────────────────────────────────────────────────── */

describe('B-01 · page 21 opens on TOPIC; SPEED only where the generator runs', () => {
  const src = code('pages/p21Today.tsx');
  it('the dock opens with no SPEED key: TOPIC first, SPEED only on RULES, SPACE and TEST', () => {
    assert.match(src, /keys: \[topicKey, \.\.\.\(action \? \[action\] : \[\]\), \.\.\.\(speed \? \[speed\] : \[\]\)\]/);
    assert.ok(!/keys: \[topicKey, speedKey\(s\)/.test(src), 'the old always-there SPEED key');
    assert.match(src, /export const P21_SPEED_TOPICS: readonly P21Topic\[\] = \['rules', 'space', 'test'\];/);
    assert.match(src, /if \(!topic \|\| !P21_SPEED_TOPICS\.includes\(topic\)\) return null;/);
    // with the generator stopped (RULES can stop it) the key is LOCKED and says why
    assert.match(src, /running \|\| key\.kind !== 'fader' \? key : \{ \.\.\.key, locked: p21SpeedOff\(topic\) \}/);
    assert.match(src, /topic === 'rules' \? 'GEN 1 is off: switch it on, and SPEED moves its rings and its level' : 'Generator 1 was stopped: choose this TOPIC again to run it, and SPEED moves it'/);
    // and the topic's sentence does not claim the generator runs while it is stopped
    assert.match(src, /speed\?\.kind === 'fader' && speed\.locked \? `\$\{speed\.locked\}\.` : t\.says/);
  });
  it('each SPEED topic really runs the generator when it is chosen (so SPEED moves its rings)', () => {
    for (const id of ['rules', 'space', 'test']) {
      const block = src.slice(src.indexOf(`id: '${id}'`), src.indexOf('says:', src.indexOf(`id: '${id}'`)));
      assert.match(block, /gaDispatch\(\{ type: 'machine', id: 'generator-1', on: true \}\)/, id);
    }
    for (const id of ['music', 'access', 'ai']) {
      const block = src.slice(src.indexOf(`id: '${id}'`), src.indexOf('says:', src.indexOf(`id: '${id}'`)));
      assert.ok(!/generator-1/.test(block), `${id} starts no generator, and has no SPEED`);
    }
  });
  it('the guide says where SPEED is', () => {
    assert.ok(G21.control.some((x) => /SPEED is there only on RULES, SPACE and TEST, where the generator runs/.test(x)));
    assert.ok(!G21.control.some((x) => /^SPEED changes the generator’s speed\./.test(x)));
  });
});

/* ── B-02 ───────────────────────────────────────────────────────────────── */

describe('B-02 · ■ STOP drops an action on its way: the card and the strip say so', () => {
  const sent = run(clean(), { type: 'net', id: 'A1', what: 'door', to: 'world' });
  const stopped = run(sent, { type: 'stopAll' });
  const key = netFlightKey(newestFlight(sent)!);

  it('the model removes the pending flight with no record (what the page must notice)', () => {
    assert.equal(newestFlight(sent)!.result, 'pending');
    assert.equal((stopped.netFlights ?? []).length, 0);
  });
  it('the page’s memory records it as DROPPED, not landed, and never "on its way" again', () => {
    let m = netMemoryStart();
    m = netMemoryAdvance(m, clean(), sent);
    assert.deepEqual(m.dropped, {});
    m = netMemoryAdvance(m, sent, stopped);
    assert.equal(m.dropped[key], true);
    assert.equal(m.landed[key], undefined);
    // much later nothing lands for it
    const later = tick(stopped, 5);
    const m2 = netMemoryAdvance(m, stopped, later);
    assert.equal(m2, m, 'nothing new');
    assert.equal(later.doorOpen, false, 'the door never moved');
  });
  it('a delivery that LANDS is never taken for a dropped one', () => {
    const landed = tick(sent, 0.3);
    const m = netMemoryAdvance(netMemoryAdvance(netMemoryStart(), clean(), sent), sent, landed);
    assert.deepEqual(m.dropped, {});
    assert.equal(m.landed[key].result, 'played');
  });
  it('the card shows the DROPPED state from that record', () => {
    const src = code('pages/p18Multiplayer.tsx');
    assert.match(src, /const dropped = last\?\.key != null && !!memory\.dropped\[last\.key\];/);
    assert.match(src, /if \(!arrival && dropped\) \{/);
    assert.match(src, /\{dropped \? NET_DROPPED_WORD : pending \? '… ON ITS WAY'/);
    assert.equal(NET_DROPPED_WORD, '✕ DROPPED · ■ STOP');
    assert.match(netDroppedWords({ id: 'A1', what: 'door', to: 'world' }), /^Never arrives: ■ STOP dropped action A1 on its way\. Nothing plays and the door does not move\.$/);
  });
  it('the strip keeps the dropped packet and says DROPPED at each machine it was travelling to', () => {
    const flying = cNetBoard(sent).packets.filter((p) => !p.landed);
    assert.equal(flying.length, 1);
    const kept = cNetKeep([], cNetBoard(stopped), flying);
    assert.equal(kept.length, 1);
    assert.deepEqual([kept[0].id, kept[0].dropped, kept[0].here, kept[0].there], ['A1', true, 'dropped', 'dropped']);
    assert.match(cNetSpoken(stopped, kept), /Action A1, door: your machine, dropped by stop before it arrived, so nothing played; the other machine, dropped by stop/);
    // without the strip's memory of what was flying, nothing is dropped
    assert.equal(cNetKeep([], cNetBoard(stopped)).length, 0);
    // an alert for the other player: only THEIR end was waiting for it
    const them = run(clean(), { type: 'net', id: 'A2', what: 'alert', to: 'them' });
    const k2 = cNetKeep([], cNetBoard(run(them, { type: 'stopAll' })), cNetBoard(them).packets);
    assert.deepEqual([k2[0].here, k2[0].there], ['nothing', 'dropped']);
    const src = code('scene/hud/cNet.tsx');
    assert.match(src, /if \(e === 'dropped'\) return \{ text: `\$\{p\.id\} ✕ DROPPED · ■ STOP`/);
    assert.match(src, /kept\.current = cNetKeep\(kept\.current, board, wasFlying\.current\);/);
  });
});

/* ── B-03, B-17 ─────────────────────────────────────────────────────────── */

describe('B-03 · page 12: the WALK key says the place in six letters or fewer', () => {
  const src = code('pages/p12Walls.tsx');
  it('the key word for each side of the wall', () => {
    const m = /WALK_KEY_WORD: Record<.+?, string> = \{ COURTYARD: '([A-Z]+)', WORKSHOP: '([A-Z]+)' \}/.exec(src);
    assert.ok(m, 'WALK_KEY_WORD');
    for (const w of [m[1], m[2]]) assert.ok(w.length <= 6, `${w} fits the key`);
    assert.match(src, /formatShort: \(\) => WALK_KEY_WORD\[walkPlace\(gaGet\(\)\)\]/);
    // the guide names the words the key shows
    assert.ok(G12.control.some((x) => x.includes(`${m[1]} (the courtyard)`) && x.includes(`${m[2]} (the workshop)`)));
  });
});

describe('B-17 · page 12: small truths', () => {
  it('(a) the guide names every word GEN 1 shows', () => {
    const line = G12.seeing.find((x) => x.startsWith('DOOR shows'))!;
    for (const w of ['MUFFLED', 'CLEAR', 'OFF', 'VIRTUAL']) assert.ok(line.includes(w), w);
  });
  it('(b) outside, with the generator off or virtual, the reverb row does not say it is heard', () => {
    assert.match(code('pages/p12Walls.tsx'), /: gen\.playing && !gen\.virtual \? 'On, heard from outside' : 'On, but nothing in the workshop plays now'/);
  });
  it('(c) the strip says "Generator 1 is playing", never "the generator 1"', () => {
    const s = run(clean(), { type: 'machine', id: 'generator-1', on: true });
    const words = bWallSummary(bTreatment(s, 'generator-1'));
    assert.match(words, /The wall’s treatment: Generator 1 is playing\./);
    assert.ok(!/the generator 1/i.test(words));
    assert.match(bWallSummary(bTreatment(run(clean(), { type: 'scene', on: true }), 'fountain')), /the fountain is/);
  });
});

/* ── B-05 ───────────────────────────────────────────────────────────────── */

describe('B-05 · page 17: why ‹ FEWER stops at the protected floor is on screen', () => {
  const held = run(clean(), { type: 'voiceLimit', limit: 4 }, { type: 'alarm', on: true }, { type: 'post', event: 'vo_warning', owner: 'guide' });
  it('the model keeps the budget at 2 and writes why, as a MIX line the page now shows', () => {
    assert.equal(protectedSounding(held), 2);
    const after = run(held, { type: 'voiceLimit', limit: 2 }, { type: 'voiceLimit', limit: 1 });
    assert.equal(after.voiceLimit, 2);
    const why = after.log.filter((l) => /^BUDGET: 1 asked, but 2 protected voices are sounding\. The budget stays at 2/.test(l.text));
    assert.equal(why.length, 1);
    assert.ok(P17_LOG_KINDS.includes(why[0].kind), `the page's log shows ${why[0].kind} lines`);
    assert.match(code('pages/p17Budgets.tsx'), /<ActivityLog state=\{s\} lines=\{6\} only=\{P17_LOG_KINDS\} \/>/);
  });
  it('the lane line says HELD while the protected voices hold the budget up', () => {
    assert.equal(budgetLaneWords(2, 2, 1, 2), '2 VOICES · HELD: 2 PROTECTED');
    assert.equal(budgetLaneWords(2, 2, 4, 2), budgetWords(2), 'asked for more: nothing held');
    assert.equal(budgetLaneWords(2, 2, 1, 1), budgetWords(2), 'the line ended: no longer held');
    assert.equal(budgetLaneWords(1, 2, 1, 2), budgetWords(1), 'the finger on another stop reads that stop');
    assert.equal(budgetLaneWords(0, 0, 0, 2), 'NO LIMIT');
    assert.match(code('pages/p17Budgets.tsx'), /format: \(v\) => budgetLaneWords\(laneToBudget\(v\), s\.voiceLimit, asked\.current, protectedSounding\(s\)\)/);
  });
});

/* ── B-07 ───────────────────────────────────────────────────────────────── */

describe('B-07 · page 12 strip at 320 wide: the readout and the reverb keep their room', () => {
  // the words' widths as measured at 9.5 units (Oswald / mono); a little generous
  const readNeed = 84;
  const revNeed = 83;
  it('at 390 (W 368) the layout is as before', () => {
    const l = bWallLayout(368, readNeed, revNeed);
    assert.equal(l.bx0, Math.round(368 * 0.7));
    assert.equal(l.apw, Math.round(368 * 0.385));
  });
  it('at 320 (W 298) the readout column holds the short title and the values, and the reverb its two words', () => {
    const old = { rx: 8 + Math.round(298 * 0.385) + 9, bx0: Math.round(298 * 0.7) };
    assert.ok(old.bx0 - 9 - 4 - old.rx < readNeed, 'the old column was too narrow');
    const l = bWallLayout(298, readNeed, revNeed);
    assert.ok(l.colW + 4 >= readNeed - 6, `readout column ${l.colW}`);
    assert.ok(l.bpw >= revNeed, `reverb window ${l.bpw}`);
    assert.ok(l.apw >= 64, 'the response plot keeps a usable width');
    assert.match(code('scene/hud/bWall.tsx'), /const title = fullW <= colW \? fullTitle : shortTitle;/);
  });
});

/* ── B-08, B-10 ─────────────────────────────────────────────────────────── */

describe('B-08 · the voices label claims no theft for a lowered budget', () => {
  it('loops that gave up their voice to a lower BUDGET are "waiting", not "stolen"', () => {
    const s = run(clean(), { type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'voiceLimit', limit: 1 });
    assert.ok(cVoiceBoard(s).waiting.length > 0);
    assert.match(cVoicesSpoken(s, 0), /Waiting for a voice: /);
    assert.ok(!/stolen/i.test(cVoicesSpoken(s, 0)));
  });
});

describe('B-10 · page 19 fault 5: the orphan’s slot says it has no owner', () => {
  it('a removed generator’s loop is marked an orphan, and only it', () => {
    let s = run(clean(), { type: 'fault', patch: { orphanLoop: true } }, { type: 'addMachine' }, { type: 'machine', id: 'generator-1', on: true }, { type: 'machine', id: 'generator-2', on: true });
    let seats = cVoiceBoard(s).seats.filter((x) => x != null);
    assert.ok(seats.length >= 2 && seats.every((x) => !x!.orphan), 'both generators have owners');
    s = run(s, { type: 'removeMachine', id: 'generator-2' });
    seats = cVoiceBoard(s).seats.filter((x) => x != null);
    const orphans = seats.filter((x) => x!.orphan);
    assert.ok(orphans.length >= 1, 'the orphan is marked');
    assert.ok(seats.some((x) => !x!.orphan), 'generator 1 is not');
    assert.match(cVoicesSpoken(s, 0), /an orphan with no owner: its generator was removed/);
    const src = code('scene/hud/cVoices.tsx');
    assert.match(src, /NO OWNER/);
    assert.match(src, /slot\.orphan && !box\.compact \? 'ORPHAN'/);
    assert.match(src, /lineRow: \{ flexDirection: 'row', alignItems: 'center', gap: 3 \}/);
  });
});

/* ── B-09 ───────────────────────────────────────────────────────────────── */

describe('B-09 · page 16 says what 0 dB is on the strip’s meters', () => {
  it('once, on the SIGNAL PATH card the meters are computed from, and in its spoken label', () => {
    assert.match(code('pages/p16Mix.tsx'), /<Text style=\{styles\.pathNote\}>\{METER_ZERO\}<\/Text>/);
    assert.match(METER_ZERO, /0 dB is one sound at its file’s own level, with its bus fader at 0 dB and LEVEL at 100%\. Sounds on one bus add up, so the music at ALERT can read above 0 dB: a sum of gains, not an overload\./);
    assert.match(code('pages/p16Mix.tsx'), /a11y=\{`\$\{signalPathSpoken\(\)\} \$\{METER_ZERO\}`\}/);
  });
  it('true to the model: three music layers at LEVEL 100% sum to about +4.8 dB, one alone to 0 dB', () => {
    const one = run(clean(), { type: 'master', value: 1 }, { type: 'option', patch: { musicBoundary: 'now' } }, { type: 'musicStart' });
    const three = run(one, { type: 'musicLayer', layer: 'pulse', on: true }, { type: 'musicLayer', layer: 'drive', on: true });
    const at = (s: GaState) => cBusMeters(s, s.t + 5).find((m) => m.bus === 'music')!.db;
    assert.ok(Math.abs(at(one)! - 0) < 0.2, `one layer ${at(one)}`);
    const t3 = tick(three, 10);
    assert.ok(Math.abs(at(t3)! - 10 * Math.log10(3)) < 0.3, `three layers ${at(t3)}`);
  });
});

/* ── B-11 ───────────────────────────────────────────────────────────────── */

describe('B-11 · the music strip counts beats from the music’s start', () => {
  it('a beat floors (now − t0), not the scene clock', () => {
    const t0 = 10.37;
    assert.equal(bBeatFloor(t0, t0), t0, 'at START: beat 1, not the last beat of a bar');
    assert.ok(Math.abs(bBeatFloor(t0 + B_BEAT_S * 2.5, t0) - (t0 + 2 * B_BEAT_S)) < 1e-9);
    assert.ok(Math.abs(bBeatFloor(t0 + B_BEAT_S * 3, t0) - (t0 + 3 * B_BEAT_S)) < 1e-9, 'exactly on a beat');
    // the old floor of absolute time put the beat before the music started
    assert.ok(Math.floor(t0 / B_BEAT_S) * B_BEAT_S < t0);
    assert.match(code('scene/hud/bMusic.tsx'), /bMusicSummary\(state, bBeatFloor\(now, state\.music\.t0\)\)/);
  });
});

/* ── B-12 ───────────────────────────────────────────────────────────────── */

describe('B-12 · page 20’s profiler prints seconds since the page opened', () => {
  it('logAt counts from the page’s own start, as the page’s log does', () => {
    let s = clean();
    s = tick(s, 1000);
    s = run(s, { type: 'enterPage' });
    s = tick(s, 2.5);
    s = run(s, { type: 'door' });
    const live = cToolsLive(s);
    assert.ok(live.log && live.log.t > 1000, 'the model’s own clock is the lab’s');
    assert.ok(live.logAt != null && Math.abs(live.logAt - 2.5) < 0.05, `logAt ${live.logAt}`);
    const src = code('scene/hud/cToolsStage.tsx');
    assert.match(src, /const at = \(b\.live\.logAt \?\? 0\)\.toFixed\(1\);/);
    assert.ok(!/log\.t\.toFixed/.test(src));
  });
});

/* ── B-13 ───────────────────────────────────────────────────────────────── */

describe('B-13 · no `x.value` straight in a JSX style object (the worklets plugin warns on each render)', () => {
  // the plugin's own rule (react-native-worklets/plugin, inlineStylesWarning):
  // style={{ k: a.value }}, style={[{ k: a.value }]}, transform: [{ k: a.value }]
  const require = createRequire(import.meta.url);
  const parser = require('@babel/parser') as { parse: (src: string, o: object) => { program: unknown } };
  type N = { type?: string; [k: string]: unknown };
  const isVal = (n: N | null | undefined) => !!n && n.type === 'MemberExpression' && !n.computed && (n.property as N).type === 'Identifier' && (n.property as { name: string }).name === 'value';
  function obj(o: N, hits: number[]) {
    for (const pr of o.properties as N[]) {
      if (pr.type !== 'ObjectProperty') continue;
      const key = pr.key as { type: string; name?: string };
      const v = pr.value as N;
      if (key.type === 'Identifier' && key.name === 'transform' && v.type === 'ArrayExpression') {
        for (const e of v.elements as N[]) if (e && e.type === 'ObjectExpression') obj(e, hits);
      } else if (isVal(v)) hits.push((v.loc as { start: { line: number } }).start.line);
    }
  }
  function visit(n: unknown, hits: number[]): void {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach((x) => visit(x, hits));
    const node = n as N;
    if (node.type === 'JSXAttribute' && (node.name as { name: string }).name === 'style' && (node.value as N)?.type === 'JSXExpressionContainer') {
      const e = (node.value as N).expression as N;
      if (e.type === 'ObjectExpression') obj(e, hits);
      else if (e.type === 'ArrayExpression') for (const el of e.elements as N[]) if (el && el.type === 'ObjectExpression') obj(el, hits);
    }
    for (const k of Object.keys(node)) if (k !== 'loc' && k !== 'start' && k !== 'end') visit(node[k], hits);
  }
  it('in the strips and pages of GF2 (b*, c*, hudB, hudC, pages 12–22 and their kits)', () => {
    const files = [
      ...readdirSync(join(GA, 'scene/hud')).filter((f) => /^(b|c|hudB|hudC)\w*\.tsx$/.test(f)).map((f) => `scene/hud/${f}`),
      ...readdirSync(join(GA, 'pages')).filter((f) => /^(p1[2-9]|p2[0-2])\w*\.tsx$|^(chcBits|chcSpeakerMap|chdKit|cheKit|cheToolMap)\.tsx$/.test(f)).map((f) => `pages/${f}`),
      'GameAudioLabScreen.tsx',
    ];
    assert.ok(files.length > 20);
    for (const f of files) {
      const hits: number[] = [];
      visit(parser.parse(read(f), { sourceType: 'module', plugins: ['typescript', 'jsx'] }).program, hits);
      assert.deepEqual(hits, [], `${f}: a .value read straight into a style at line ${hits.join(', ')}`);
    }
  });
});

/* ── B-04 (text, after GF1 kept the fold) ───────────────────────────────── */

describe('B-04 · page 13 says what MONO really does: equal ears, and up to 3 dB less to one side', () => {
  it('the model: in MONO both ears are equal, and turning moves them together by more than 0 and at most 3 dB', () => {
    const dbs: number[] = [];
    for (let facing = 0; facing < 360; facing += 15) {
      const s = run(clean(), { type: 'scene', on: true }, { type: 'mono', on: true }, { type: 'face', who: 'player', facing });
      const i = s.inst.find((x) => x.event === 'fountain')!;
      const v = s.voices.find((x) => x.inst === i.id)!;
      const o = gaVoiceOut(s, v);
      assert.ok(Math.abs(o.l - o.r) < 1e-9, `facing ${facing}: both ears the same`);
      dbs.push(20 * Math.log10(o.l));
    }
    const span = Math.max(...dbs) - Math.min(...dbs);
    assert.ok(span > 0.5 && span <= 3.01, `turning moves the mono level by ${span.toFixed(2)} dB`);
  });
  it('the tray, step 3 and the guide say so, and never "both bars stay equal" as if the level held', () => {
    const src = read('pages/p13Formats.tsx');
    assert.match(src, /Direction is gone: a sound to one side folds up to 3 dB quieter than one ahead \(the pan law\)\./);
    assert.match(src, /In MONO both bars stay equal; to one side, both fold up to 3 dB quieter \(the pan law\)\./);
    assert.ok(G13.changes.some((x) => /folds up to 3 dB quieter \(the pan law\)/.test(x)));
    assert.ok(!G13.tryThis.some((x) => /no longer tell where the fountain is/.test(x)));
  });
});
