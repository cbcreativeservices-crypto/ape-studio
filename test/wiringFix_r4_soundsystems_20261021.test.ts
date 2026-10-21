/**
 * Round-4 fixes, Sound Systems Lab (owner go 2026-10-21) — ratchet for
 * R4-SS-01: the festival capstone's "who hears" readouts follow the in-ear
 * pack. On the stereo In-ears L/R pair (Aux 9 + 10, R3-SS-01) each side gets
 * its own readout, so a stereo build has both sides to check; on one output
 * (the mono in-ears, Aux 8) the Aux 8 readout stays. Fails if the festival
 * desk goes back to an Aux 8 readout only, or shows both kinds at once.
 * (R4-SS-02, the stereo pack's tag spot, is pinned in
 * wiringFix_r3_soundsystems_20261021, R3-SS-04.)
 */
import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sys = await import('../src/features/soundsystems/system.ts');
const con = await import('../src/features/soundsystems/console.ts');
const { referenceBuild, stereoFestivalBuild } = await import('./_ssReferenceBuilds.ts');
const { ROUTE_UI, hearsShown } = await import('../src/screens/lab/soundsystems/pagesBuild.tsx');
const { auxHears } = await import('../src/screens/lab/soundsystems/art/ConsolePanel.tsx');

type System = import('../src/features/soundsystems/types.ts').SoundSystem;
type ConsoleOut = import('../src/features/soundsystems/types.ts').ConsoleOut;

const src = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const kindId = (s: System, k: string) => s.placed.find((p) => p.kind === k)!.id;
/** The festival reference build with its in-ear transmitter fed two outputs.
 *  Round 5 (owner 2026-10-21): BOTH cables now run from the stagebox — the
 *  second used to come from the loudspeaker processor, because only one
 *  cable was allowed between a pair; the processor carries the house mix,
 *  so that route is now flagged (wiringFix_r5_soundsystems_20261021). */
function stereoFestival(a: ConsoleOut, b: ConsoleOut): System {
  return stereoFestivalBuild(a, b).s;
}
const festival = ROUTE_UI.festival!;
const titles = (s: System) => hearsShown(festival.hears, s, sys.consoleWalk(s)).map((h) => h.title);
const AUX8 = 'AUX 8 · THE IN-EARS HEAR';
const AUX9 = 'AUX 9 · IN-EARS L HEARS';
const AUX10 = 'AUX 10 · IN-EARS R HEARS';

describe('R4-SS-01: the festival "who hears" readouts follow the in-ear pack', () => {
  it('the festival desk carries Aux 8 (mono) and Aux 9 + Aux 10 (stereo) readouts, each tagged by the pack it serves', () => {
    const by = new Map(festival.hears.map((h) => [h.title, h]));
    assert.deepEqual({ ...by.get(AUX8) }, { title: AUX8, kind: 'aux', id: 'aux8', iem: 'mono' });
    assert.deepEqual({ ...by.get(AUX9) }, { title: AUX9, kind: 'aux', id: 'aux9', iem: 'stereo' });
    assert.deepEqual({ ...by.get(AUX10) }, { title: AUX10, kind: 'aux', id: 'aux10', iem: 'stereo' });
    // the desk has a column for every readout it can show
    for (const id of ['aux8', 'aux9', 'aux10']) assert.ok(festival.columns.includes(`send:${id}`), id);
  });
  it('mono in-ears (the reference build, Aux 8): the Aux 8 readout, not the pair', () => {
    const t = titles(referenceBuild('festival').s);
    assert.ok(t.includes(AUX8));
    assert.ok(!t.includes(AUX9) && !t.includes(AUX10));
    assert.deepEqual(t, ['AUX 1 · WEDGE 1 HEARS', 'AUX 6 · THE SUBS HEAR', AUX8, 'MATRIX 4 · RECORDING HEARS']);
  });
  it('stereo in-ears (Aux 9 + 10): one readout per side, and no Aux 8', () => {
    const t = titles(stereoFestival('aux9', 'aux10'));
    assert.deepEqual(t, ['AUX 1 · WEDGE 1 HEARS', 'AUX 6 · THE SUBS HEAR', AUX9, AUX10, 'MATRIX 4 · RECORDING HEARS']);
    // either order of the two cables is the same pair
    assert.deepEqual(titles(stereoFestival('aux10', 'aux9')), t);
  });
  it('a pack on anything but the In-ears L/R pair keeps the Aux 8 readout', () => {
    for (const [a, b] of [['aux7', 'aux8'], ['aux1', 'aux2']] as const) {
      const t = titles(stereoFestival(a, b));
      assert.ok(t.includes(AUX8), `${a}+${b}`);
      assert.ok(!t.includes(AUX9) && !t.includes(AUX10), `${a}+${b}`);
    }
    const { s } = referenceBuild('festival');
    const tx = kindId(s, 'iemTx');
    const into = s.links.find((l) => l.to === tx)!;
    assert.ok(titles(sys.setLinkOut(s, into.from, into.to, 'aux9')).includes(AUX8), 'one side of the pair alone is not stereo');
  });
  it('the readouts are computed from the console: each side hears what is sent to it', () => {
    const cs = con.setSend(con.setSend(referenceBuild('festival').cs, 'vox', 'aux9', { db: 0, tap: 'pre' }), 'vox', 'aux10', { db: -6, tap: 'pre' });
    const l = con.hears(auxHears(cs, 'aux9')).find((c) => c.channelId === 'vox');
    const r = con.hears(auxHears(cs, 'aux10')).find((c) => c.channelId === 'vox');
    assert.ok(l && r, 'the vocal reaches both sides');
    assert.ok(l!.gain > r!.gain, 'Aux 10 carries the vocal 6 dB down');
  });
  it('the page draws the filtered list, and the bus readout value shrinks to fit (never under 9 pt)', () => {
    const b = src('screens/lab/soundsystems/pagesBuild.tsx');
    assert.match(b, /\{hearsShown\(ui\.hears, b\.system, b\.walk\)\.map\(\(h\) => \(/);
    assert.doesNotMatch(b, /\{ui\.hears\.map\(/);
    const p = src('screens/lab/soundsystems/art/ConsolePanel.tsx');
    assert.match(p, /<Text style=\{styles\.busDb\} \{\.\.\.fitValue\(11\)\}>/);
    assert.match(p, /busTitle: \{[^}]*fontSize: 10,/);
  });
});
