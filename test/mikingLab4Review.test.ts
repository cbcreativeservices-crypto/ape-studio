/**
 * Lab 4 (Strings) — the review fixes of 2026-10-05 (docs/labs/miking/
 * REVIEW_LAB4.md, Resolution) and the ANSWER-BALANCE rule over every Lab 4
 * check, quick check and practice item:
 *
 *   • length: the correct option is never more than 1.25 × the mean length
 *     of the others, and is the strict longest in at most a quarter of a
 *     lesson's items;
 *   • yes/no: where an item offers a "Yes…" option, "Yes" is the key in at
 *     least 30 % of them (a learner who never picks "Yes" must not pass);
 *   • slots: the key's place is spread — in the source and on the screen
 *     (the engine's own shuffle, engine/kit.tsx) — no slot holds more than
 *     45 % or fewer than 20 % of a lesson's keys;
 *   • M1: no "still there" (it read as "still present"); M3: the piano's
 *     under-board and behind-upright mics carry the polarity note, and the
 *     twoMic page asks it; M4: each amp lesson has a hum symptom that keeps
 *     the DI's ground lift apart from the mains earth; M5: the sitar's
 *     shimmer is not placed "not at the bridge" and overtones count.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { shuffled, hashId } = R(await import('../src/screens/lab/miking/engine/kit.tsx'));

type Item = { id: string; prompt?: string; observation?: string; options: readonly string[]; correct: string; explain: string; why: Record<string, string> };
const LAB4: string[] = LESSONS.filter((m: { labId: string }) => m.labId === 'strings').map((m: { id: string }) => m.id);
const itemsOf = (id: string): Item[] => {
  const L = lessonById(id);
  return [...L.scenarios, ...L.symptoms, ...L.diagnostic];
};
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('Lab 4 answer balance', () => {
  for (const id of LAB4) {
    it(`${id}: length, yes/no and slots`, () => {
      const items = itemsOf(id);
      let longest = 0;
      let yesItems = 0;
      let yesKey = 0;
      const src = [0, 0, 0, 0, 0];
      const shown = [0, 0, 0, 0, 0];
      for (const s of items) {
        const others = s.options.filter((o) => o !== s.correct);
        const mean = others.reduce((a, o) => a + o.length, 0) / others.length;
        assert.ok(s.correct.length <= 1.25 * mean, `${id} ${s.id}: correct ${s.correct.length} vs mean ${mean.toFixed(1)}`);
        if (others.every((o) => o.length < s.correct.length)) longest++;
        if (s.options.some((o) => /^Yes\b/.test(o))) {
          yesItems++;
          if (/^Yes\b/.test(s.correct)) yesKey++;
        }
        const k = s.options.indexOf(s.correct);
        assert.ok(k >= 0, `${id} ${s.id}: the key is one of the options`);
        src[k]++;
        shown[shuffled(s.options.length, hashId(s.id)).indexOf(k)]++;
      }
      assert.ok(longest <= items.length / 4, `${id}: the key is the longest in ${longest} of ${items.length}`);
      if (yesItems) assert.ok(yesKey >= 0.3 * yesItems, `${id}: "Yes" is the key in ${yesKey} of ${yesItems}`);
      for (const [name, c] of [['source', src], ['screen', shown]] as const)
        for (let i = 0; i < 3; i++) assert.ok(c[i] >= 0.2 * items.length && c[i] <= 0.45 * items.length, `${id}: ${name} slot ${i} holds ${c[i]} of ${items.length}`);
    });
  }
});

describe('Lab 4 review fixes', () => {
  it('M1: no shape is "still there" in Lab 4 (it read as "still present")', () => {
    const dirs = readdirSync('src/screens/lab/miking/lessons').filter((d) => /^c\d/.test(d)).map((d) => `src/screens/lab/miking/lessons/${d}`);
    dirs.push('src/screens/lab/miking/lessons/shared/guitars', 'src/screens/lab/miking/lessons/shared/lutes', 'src/screens/lab/miking/lessons/shared/bowed', 'src/screens/lab/miking/lessons/shared/strings');
    for (const d of dirs)
      for (const f of readdirSync(d).filter((x) => /\.tsx?$/.test(x))) assert.ok(!/\b(shapes?|ones)\b[^.'`]{0,24}still there/.test(read(join(d, f))), join(d, f));
    for (const id of ['C01', 'C03', 'C05B', 'C05C', 'C07', 'C13', 'C15']) {
      const s = itemsOf(id).find((x) => /stay silent/.test(x.correct));
      assert.ok(s, `${id}: the middle-pluck check names the silent shapes`);
    }
  });
  it('M3: the piano under-board and behind-upright mics carry the polarity note; the twoMic page asks it', () => {
    const L = lessonById('C11');
    for (const zid of ['gp.under', 'up.rear']) {
      const z = L.zones.find((x: { id: string }) => x.id === zid);
      assert.match(z.tendency, /other side of the soundboard/, zid);
      assert.match(z.tendency, /polarity both ways, in mono, at matched levels/, zid);
    }
    assert.ok(L.zones.find((x: { id: string }) => x.id === 'gp.under').checks.includes('Blended with a mic above: compare both polarity states in mono'));
    const two5 = L.scenarios.find((s: Item) => s.id === 'pn.two.5');
    assert.ok(two5 && two5.correct === 'Each alone, then mono, then this mic’s polarity both ways');
    assert.ok(L.pages?.twoMic?.credit?.scenarios?.includes?.('pn.two.5') ?? JSON.stringify(L).includes("pn.two.5"));
    const two1 = L.scenarios.find((s: Item) => s.id === 'pn.two.1');
    assert.doesNotMatch(Object.values(two1.why).join(' '), /Neither mic is inverted here/);
  });
  it('M4: C02, C04 and C08 each have a hum symptom; the ground lift is the audio ground, the mains earth is never touched', () => {
    for (const id of ['C02', 'C04', 'C08']) {
      const s = lessonById(id).symptoms.find((x: Item) => x.id === 's.hum');
      assert.ok(s, id);
      assert.match(s.correct, /ground lift/);
      assert.match(s.explain, /only the audio ground/);
      assert.match(s.explain, /mains earth stays connected/);
      const earth = s.options.find((o: string) => /earth pin/.test(o));
      assert.ok(earth && /^Never\./.test(s.why[earth]), `${id}: the earth-pin option is answered "Never."`);
    }
    assert.match(read('src/screens/lab/miking/lessons/shared/electric/ampPages.tsx'), /ground-lift switch, which lifts only the audio ground at its XLR, is a different, normal control/);
  });
  it('M5: the sitar shimmer matches the drawn taraf bridge; overtones count', () => {
    const t = read('src/screens/lab/miking/lessons/c14Sitar/lesson.ts') + read('src/screens/lab/miking/lessons/c14Sitar/model.ts');
    assert.doesNotMatch(t, /not right at the bridge/);
    assert.match(t, /own small bridge there/);
    assert.match(t, /or the overtones/);
    assert.doesNotMatch(t, /answer only the notes that match/);
  });
});
