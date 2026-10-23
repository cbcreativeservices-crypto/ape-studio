// Fact-audit Round 2 (group E_other, 2026-10-22): pins the corrected wording
// from Computer B's fact-check return and checks the wrong claims are gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(import.meta.dirname, '..', p), 'utf8').replace(/\r\n/g, '\n');

const CASES: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'F000166', file: 'src/features/startHere/startHereContent.ts', now: 'like a push passed down a line of people standing close together', gone: 'like a wave passing along a crowd' },
  { id: 'F000368', file: 'src/features/startHere/startHereGlossary.ts', now: 'Sound and signal levels (dB SPL, dBu, dBFS)', gone: 'All sound measures (dB SPL' },
  { id: 'F000382', file: 'src/features/startHere/startHereGlossary.ts', now: 'A meter shows the level of a signal.', gone: 'A meter shows how loud a signal is' },
  { id: 'F000788', file: 'src/features/intro/labTermIntroData.ts', now: 'A split-band de-esser turns down only the high band', gone: 'an approach called dynamic EQ' },
  { id: 'F002894', file: 'src/features/lab/understandingChecks.ts', now: 'One mic can be two of them, like a condenser shotgun or a condenser lav.', gone: 'One microphone can be all three.' },
  { id: 'F003359', file: 'src/features/amp/ampContent.ts', now: 'Cannot amplify audio cleanly: it conducts for less than half of each cycle.', gone: 'Cannot pass audio at all.' },
  { id: 'F008701', file: 'src/features/cymatics/membrane.ts', now: 'raises the system resonance above f_s', gone: 'A sealed box raises f_s and' },
  { id: 'F012237', file: 'src/features/ear/modules/defects.ts', now: 'Steady (hum, buzz, hiss) or impulsive', gone: 'Tonal (hum, buzz, hiss)' },
  { id: 'F082963', file: 'src/features/production/postprod/stage6.data.ts', now: 'printed under it and summed without it', gone: 'It is only a problem when the stems are printed underneath it and then recombined through it again.' },
  { id: 'F083087', file: 'src/features/production/postprod/stage6.data.ts', now: 'only the routing table catches it', gone: 'all three would have shown up as a residual' },
  { id: 'F085801', file: 'src/features/soundsystems/faults.ts', now: 'even when more than one device is set as preferred', gone: 'two devices forced to preferred master' },
  { id: 'F085807', file: 'src/features/soundsystems/faults.ts', now: 'idles the port between packets', gone: 'drops the link between packets' },
  { id: 'F087057', file: 'src/features/tuning/tuningMath.ts', now: 'four of them, less two octaves, make a pure 5:4 major third', gone: 'so that four of them make a pure 5:4' },
  { id: 'F087974', file: 'src/components/tooldemos/SplDemo.tsx', now: 'time constants of 125 ms and 1 s', gone: 'averaging windows of 125 ms' },
  { id: 'F088100', file: 'src/features/tools/learn/concepts.ts', now: 'the tool must process the recording to get the impulse response', gone: 'less ideally a clap' },
  { id: 'F088334', file: 'src/features/tools/learn/spl.ts', now: 'measured against 20 micropascals', gone: 'how much the air is actually moving' },
  { id: 'F088379', file: 'src/features/tools/learn/waveform.ts', now: 'how tall the trace is drawn on screen', gone: 'how many pixels each dB occupies' },
  { id: 'F088620', file: 'src/screens/tools/SignalGenScreen.tsx', now: 'Brown’s mirror, rising 6 dB per octave', gone: 'White’s mirror' },
];

for (const c of CASES) {
  test(`${c.id}: corrected wording present, wrong claim gone`, () => {
    const src = read(c.file);
    assert.ok(src.includes(c.now), `${c.id}: expected new wording in ${c.file}`);
    assert.ok(!src.includes(c.gone), `${c.id}: old wording still in ${c.file}`);
  });
}
