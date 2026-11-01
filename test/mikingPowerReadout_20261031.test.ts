/**
 * Miking MICROPHONES — the POWER readout (On the instrument bezel) and the
 * card's plain power line (On the instrument + By property, not brand) come
 * from each mic type's own `power` field, never from the transducer alone.
 *
 * 2026-10-31, confirmed by two verifiers: every condenser read POWER PHANTOM
 * and "needs phantom power from the desk", so F12's battery sound level meter,
 * the F11/F13–F16 measurement capsules on their own approved supply and the
 * F09/B04 camera mics were all told to take desk phantom power.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import './_mikingTsxLoader.ts';

const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { powerOf, plainLines } = await import('../src/screens/lab/miking/pages/PMicrophone.tsx');

type M = { id: string; transducer: string; power: string };
const all = Object.values(MIC_TYPES as Record<string, M>);
const has = (id: string) => (MIC_TYPES as Record<string, M>)[id];

describe('Miking POWER readout follows each type’s own power field', () => {
  it('no type is told it needs phantom power unless phantom is the one way its data names', () => {
    for (const m of all) {
      const r = powerOf(m);
      const line = plainLines(m).power;
      assert.equal(line, r.line, `${m.id}: the card line and the helper agree`);
      if (r.word === 'PHANTOM' || /phantom/i.test(line.replace(m.power, ''))) {
        assert.match(m.power, /^phantom power\b/i, `${m.id}: PHANTOM shown but its power is "${m.power}"`);
        assert.doesNotMatch(m.power, /never assumed|batter|(,|—|\()\s*or\b|\bor (the maker|its own|power|a wireless)/i, `${m.id}: PHANTOM shown though its data names another way`);
      }
    }
  });
  it('the cases the review named', () => {
    assert.equal(powerOf(has('slm')).word, 'BATTERY');
    for (const id of ['measFF', 'measRI', 'measQuarter']) assert.equal(powerOf(has(id)).word, 'OWN SUPPLY', id);
    for (const id of ['locCam', 'locCamCap', 'camMic', 'locLav', 'locPlant', 'lavCard']) assert.equal(powerOf(has(id)).word, 'VARIES', id);
    assert.equal(plainLines(has('slm')).power, `Power: ${has('slm').power}`);
  });
  it('plain phantom condensers and dynamics read as before', () => {
    for (const id of ['sdc', 'ohLdc', 'locBoomSg', 'strMini']) {
      assert.equal(powerOf(has(id)).word, 'PHANTOM', id);
      assert.equal(plainLines(has(id)).power, 'Power: needs phantom power from the desk', id);
    }
    for (const m of all.filter((x) => /^none\b/i.test(x.power))) {
      assert.equal(powerOf(m).word, 'NONE', m.id);
      assert.equal(plainLines(m).power, 'Power: none needed', m.id);
    }
  });
  it('every bezel word fits the POWER cell (≤ 10 characters, as long as the longest PATTERN/TYPE values beside it)', () => {
    for (const m of all) assert.ok(powerOf(m).word.length <= 10, m.id);
  });
});
