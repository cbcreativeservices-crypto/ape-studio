/**
 * DJ Systems Lab, screens 19–24 — the second reviews' behaviour fixes
 * (2026-10-18), pinned on the pure modules:
 *   - the PA's LEFT stands at HOUSE LEFT (audio #2);
 *   - the bass map is the subs' coherent sum: spaced subs make loud and quiet
 *     stripes; one sub makes none (visual #16, audio #12);
 *   - one mains frequency, line 40–55 dB over mic (audio #4, #6);
 *   - INTERNAL drift is readable, and an armed start works on INT (learning 22 #1);
 *   - the what's-left line shows three goals, then "+ n more" (learning W9);
 *   - full screen's window and zoomed transform (visual #22).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PLACEMENTS, ROOM, SUB_PLACES, subsCoherentAt } from '../src/screens/lab/dj/model/djRoom.ts';
import { HUM_HZ, LINE_OVER_MIC_DB, MAINS_HZ, TT_RUMBLE_HZ, freshEvent, micInputOverload, freshMic } from '../src/screens/lab/dj/model/djEvent.ts';
import { dmDrift, nextDeckABar } from '../src/screens/lab/dj/engine/djDrumMachine.ts';
import { builtBooth, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { clearGoalReports, leftLine, reportGoals } from '../src/screens/lab/dj/booth/goalStore.ts';
import { anchorOffsetDj, zoomWindow, zoomedXf } from '../src/screens/lab/dj/art/djZoom.ts';

describe('the venue’s left and right', () => {
  it('PA L stands at house left (−x: the audience’s left, the DJ’s right) in every placement', () => {
    for (const p of Object.keys(PLACEMENTS) as (keyof typeof PLACEMENTS)[]) {
      assert.ok(PLACEMENTS[p].tops.L.at.x < 0, p);
      assert.ok(PLACEMENTS[p].tops.R.at.x > 0, p);
    }
    assert.ok(SUB_PLACES.TOPS.subs.find((s) => s.id === 'subL')!.at.x < 0);
  });
});

describe('the bass map adds the subs as waves', () => {
  it('two spaced subs: in step on the center line, deep nulls off it; one sub under the booth: no stripes', () => {
    const y = ROOM.floorCentre.y;
    const row = Array.from({ length: 121 }, (_, i) => subsCoherentAt({ x: -6 + i * 0.1, y }, 'TOPS'));
    const centre = subsCoherentAt({ x: 0, y }, 'TOPS');
    const min = Math.min(...row);
    assert.ok(centre - min > 9, `a null ${centre - min} dB below the centre`);
    const one = Array.from({ length: 121 }, (_, i) => subsCoherentAt({ x: -6 + i * 0.1, y }, 'BOOTH'));
    const smooth = Math.max(...one.slice(1).map((v, i) => Math.abs(v - one[i])));
    assert.ok(smooth < 1, 'a single sub has no interference');
  });
});

describe('one booth, one mains', () => {
  it('every hum is the 60 Hz mains; the turntable resonance is one value; line is 40–55 dB over mic', () => {
    assert.equal(HUM_HZ, MAINS_HZ);
    assert.equal(MAINS_HZ, 60);
    assert.equal(TT_RUMBLE_HZ, 80);
    assert.ok(LINE_OVER_MIC_DB >= 40 && LINE_OVER_MIC_DB <= 55);
    assert.equal(micInputOverload({ ...freshMic(), device: 'WIRELESS', rxOut: 'LINE', input: 'MIC2' }), true, 'a line feed still overloads a mic input');
  });
});

describe('drift on INTERNAL', () => {
  const booth = (intBpm: number, startedAt: number | null): Booth => {
    const b = builtBooth();
    const ev = freshEvent();
    return { ...b, decks: { ...b.decks, A: { ...b.decks.A, track: 'nightFerry', playing: true, at: 0, posSec: 30, pitch: 0 } }, ev: { ...ev, dm: { ...ev.dm, sync: 'INT', intBpm, startedAt } } };
  };
  it('an armed start lands on deck A’s bar line, and a tempo difference drifts as the minutes pass', () => {
    const b0 = booth(120, null);
    const at = nextDeckABar(b0, 0)!;
    assert.ok(at != null && at >= 0);
    const b = booth(120, at);
    const d0 = dmDrift(b, at + 0.01)!;
    assert.ok(Math.abs(d0.barBeats) < 0.05, `on the one at the start (${d0.barBeats})`);
    // Night Ferry plays at its own tempo; 1 BPM apart is a beat a minute
    const bpmA = 122;
    const later = dmDrift(booth(bpmA - 1, at), at + 30)!;
    assert.ok(Math.abs(later.barBeats) >= 0.25, `drifted ${later.barBeats}`);
  });
  it('EXT or stopped: no drift reading', () => {
    const b = booth(120, 0);
    assert.equal(dmDrift({ ...b, ev: { ...b.ev!, dm: { ...b.ev!.dm, sync: 'EXT' } } }, 5), null);
    assert.equal(dmDrift(booth(120, null), 5), null);
  });
});

describe('what is left, in short', () => {
  it('three goals, then the count of the rest', () => {
    clearGoalReports();
    reportGoals('PA', ['a', 'b', 'c', 'd', 'e'], [false, false, false, false, false]);
    assert.equal(leftLine('PA', []), 'Left: a · b · c · + 2 more');
    clearGoalReports();
  });
});

describe('full screen as a working surface (art/djZoom)', () => {
  it('the window is the visible body (1× box + padding) where the rack’s scroll puts it', () => {
    const w1 = 374;
    const h1 = 600;
    const z = 2;
    const win = zoomWindow(w1 * z, h1 * z, z, null);
    assert.equal(win.w, w1 + 16);
    assert.equal(win.h, h1 + 8);
    assert.equal(win.x, anchorOffsetDj(w1 * z, w1 + 16, 0.5));
    const left = zoomWindow(w1 * z, h1 * z, z, { fx: 0, fy: 0 });
    assert.equal(left.x, 0);
    assert.equal(left.y, 0);
  });
  it('the zoomed gear opens on its focus part and never pans past the frame', () => {
    const region = { x: 0, y: 40, w: 390, h: 560 };
    const frame = { x: 0, y: 0, w: 400, h: 240 };
    const { xf, limits } = zoomedXf({ s: 0.9 }, region, frame, { x: 200, y: 120 }, 3, { x: 0, y: 0 });
    assert.ok(Math.abs(xf.ox + 200 * xf.s - (region.x + region.w / 2)) < 1e-6, 'focus at the centre');
    const far = zoomedXf({ s: 0.9 }, region, frame, { x: 200, y: 120 }, 3, { x: 1e6, y: 0 }).xf;
    assert.ok(far.ox <= region.x + 1e-6, 'the frame’s left edge never comes inside the region');
    assert.ok(limits.maxX >= 0 && limits.minX <= 0);
  });
});
