/**
 * M11 Complete Kit Setups — the plans and the routing (kit/GEOMETRY_PROPOSAL.md
 * §4–5):
 *
 *   • validateLesson(M11) is clean;
 *   • the plans run from one mic to an extensive twelve, each channel a real
 *     mic type, every channel's pose clear of the kit in every variant;
 *   • the counters: channels, stands, phantom-powered (condensers);
 *   • the routing task: the starting routing meets it (room pair on record /
 *     broadcast only, kick and snare in the PA); "everything everywhere"
 *     does not; studio needs nothing removed.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { M11_LESSON } from '../src/screens/lab/miking/lessons/m11Kit/lesson.ts';
import { CHANNELS, CHANNEL_IDS, FEEDS, PLANS, ROUTE_IDS, counts, defaultRouting, openIn, routingDone } from '../src/screens/lab/miking/lessons/m11Kit/plan.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { micBodyOf, validateLesson } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene } from '../src/screens/lab/miking/engine/geometry/collision.ts';

const lesson = M11_LESSON;
const phantom = (typeId: string) => MIC_TYPES[typeId].transducer === 'condenser';

describe('M11 — the lesson validates', () => {
  it('validateLesson is clean', () => {
    assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
  });
});

describe('M11 — the plans', () => {
  it('one, two, three, four, expanded (8), extensive (12) channels', () => {
    assert.deepEqual(PLANS.map((p) => p.channels.length), [1, 2, 3, 4, 8, 12]);
    for (const p of PLANS) assert.equal(new Set(p.channels).size, p.channels.length, p.id);
  });
  it('each larger plan keeps the kick and the snare once they arrive', () => {
    for (const p of PLANS.slice(2)) assert.ok(p.channels.includes('kick') && p.channels.includes('snare'), p.id);
  });
  it('every channel is a known mic type', () => {
    for (const id of CHANNEL_IDS) assert.ok(MIC_TYPES[CHANNELS[id].typeId], id);
  });
  it('every channel’s pose is clear of the kit, in every variant', () => {
    for (const v of lesson.model.variants.map((x) => x.id)) {
      const scene = compileScene(lesson.model, v);
      for (const id of CHANNEL_IDS) {
        const t = MIC_TYPES[CHANNELS[id].typeId];
        assert.equal(checkAssembly(scene, CHANNELS[id].pose, micBodyOf(t)), null, `${id} in ${v}`);
      }
    }
  });
  it('the counters: one stand per channel; condensers need phantom', () => {
    const ext = counts(PLANS[5].channels, phantom);
    assert.equal(ext.channels, 12);
    assert.equal(ext.stands, 12);
    assert.ok(ext.phantom >= 4 && ext.phantom < 12);
    assert.equal(counts(['kick'], phantom).phantom, 0);
  });
});

describe('M11 — the routing task', () => {
  it('the starting routing meets it, live', () => {
    const r = defaultRouting(ROUTE_IDS, true);
    assert.equal(routingDone(r), true);
    assert.equal(openIn(r, 'rec'), ROUTE_IDS.length);
    assert.equal(openIn(r, 'pa'), ROUTE_IDS.length - 2);
  });
  it('everything everywhere does not — the room pair is in the PA', () => {
    const all = Object.fromEntries(ROUTE_IDS.map((id) => [id, [...FEEDS]]));
    assert.equal(routingDone(all), false);
  });
  it('a room pair only in the monitors still fails; kick missing from the PA fails', () => {
    const r = { ...defaultRouting(ROUTE_IDS, true), roomL: ['mon', 'rec'] as const };
    assert.equal(routingDone(r), false);
    const k = { ...defaultRouting(ROUTE_IDS, true), kick: ['rec'] as const };
    assert.equal(routingDone(k), false);
  });
  it('studio: every channel to the record and broadcast feeds, nothing to the PA', () => {
    const r = defaultRouting(ROUTE_IDS, false);
    assert.equal(openIn(r, 'pa'), 0);
    assert.equal(openIn(r, 'rec'), ROUTE_IDS.length);
  });
});
