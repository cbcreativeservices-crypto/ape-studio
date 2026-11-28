/**
 * THE BAND'S SINGER STANDS ASIDE (owner ruling 2026-11-26: the drummer was hidden behind the singer from the
 * hall). bandStage.ts BAND_SINGER_DX: the singer 600 mm to the audience's left of the middle in both band
 * seatings; the vocal mic, the wedge and the room's gobo follow the seat. Pure (no drawing).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { seatingOf } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';
import { BAND_KIT, BAND_SINGER, BAND_SINGER_DX } from '../src/screens/lab/miking/lessons/shared/ensemble/bandStage.ts';
import { SINGER_V, VOCAL_MIC } from '../src/screens/lab/miking/lessons/e09CompleteBand/geometry.ts';

describe('the band’s singer stands aside of the drummer', () => {
  it('600 mm to the audience’s left, the same in both band seatings', () => {
    assert.equal(BAND_SINGER_DX, -600);
    for (const id of ['band.stage', 'band.room'] as const) {
      const vx = seatingOf(id).seats.find((q) => q.id === 'vox.1')!;
      assert.deepEqual([vx.p.x, vx.p.z], [-600, -400], id);
    }
    assert.ok(Math.abs(BAND_KIT.p.x - BAND_SINGER.p.x) >= 700, 'the drummer shows beside the singer from the hall');
  });
  it('the vocal mic, the wedge and the gobo moved with the singer', () => {
    assert.ok(Math.abs(SINGER_V.lip.x - BAND_SINGER_DX) < 60, 'the lips over the seat');
    assert.ok(Math.abs(VOCAL_MIC.p.x - BAND_SINGER_DX) < 200, 'the vocal mic in front of the lips');
    const wedge = seatingOf('band.stage').gear!.find((g) => g.id === 'mon.vox')!;
    assert.ok(Math.abs(wedge.p.x - BAND_SINGER_DX) < 1);
    const gobo = seatingOf('band.room').gear!.find((g) => g.id === 'gobo.vox')!;
    assert.equal(gobo.p.x, BAND_SINGER_DX);
  });
});
