/**
 * CAST FIGURES — THE ENSEMBLES (owner 2026-11-26: "fix the figures to our cast"). Every person in the ensemble
 * seatings (E02, E04–E06, E08–E16) is a cast member; this sweep fixed two faults there:
 *   • the kit drummer twice: a seating with a drum kit gave its seat to one cast member in turn while the kit drew
 *     the drummer itself, so the drummer also played the keys (E09 stage), sang (E09 room) or played the sax (E15
 *     quartet). The kit's seat is now the drummer and the other players take the other four in turn;
 *   • the drummer missing from the hall's view: the front elevation cleared the old figure and drew no new one
 *     behind the kit (E09, E15, E16). He is now the drummer seated on his throne (frontPlan FRONT_SEATED).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SEAT_ART = 'src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx';

const SA = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx'));
const SE = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/seating.ts'));

describe('cast figures — the ensembles', () => {
  it('a drum kit seat is the drummer; the other players never repeat him', () => {
    const src = read(SEAT_ART);
    assert.match(src, /for \(const q of s\.seats\) SEAT_WHO\.set\(q, q\.kind === 'drumkit' \? CAST\.drummer : CAST\[ids\[i\+\+ % ids\.length\]\]\);/);
    assert.match(src, /players\(CAST_IN_TURN\.filter\(\(id\) => id !== 'drummer'\)\);/);
    assert.match(src, /players\(kit \? four\.filter\(\(id\) => id !== 'drummer'\) : four\);/);
    // the conductor rule is kept
    assert.match(src, /const four = CAST_IN_TURN\.filter\(\(id\) => id !== cond\.id\);/);
  });
  it('the small seatings with a kit (E09, E15) have four players or fewer besides the drummer: no one repeats', () => {
    for (const id of ['band.stage', 'band.room', 'jazz.quartet', 'jazz.guitar'] as const) {
      const s = SE.seatingOf(id);
      assert.equal(s.seats.filter((q: { kind: string }) => q.kind === 'drumkit').length, 1, id);
      assert.ok(s.seats.length - 1 <= 4, `${id}: the other players fit the other four people`);
      assert.ok(SA.seatingV2Ready(s), `${id} still drawn new`);
    }
  });
  it("the hall's view draws the drummer behind his kit (seated, the cast's drummer, cut at the floor line)", () => {
    const src = read(SEAT_ART);
    assert.match(src, /function KitDrummerFrontV2\(\{ q \}: \{ q: Seat \}\)/);
    assert.match(src, /<PersonFrontV2 pose=\{FRONT_SEATED\} who=\{CAST\.drummer\} \/>/);
    assert.match(src, /it\.q\.kind === 'drumkit' && view === 'front' \? <KitDrummerFrontV2 q=\{it\.q\} \/> : null/);
    // the section view's kit and the plan's still draw him themselves
    assert.match(read('src/screens/lab/miking/lessons/shared/ensemble/BandArt.tsx'), /<KitSide keepOuts=\{false\} \/>/);
  });
  it('the big seatings switch is unchanged', () => {
    assert.equal(SA.ENSEMBLE_V2_BIG_ON, true);
  });
});
