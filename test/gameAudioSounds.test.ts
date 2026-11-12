/**
 * Game Audio lab — the original sounds (src/screens/lab/gameaudio/sounds/).
 * They are synthesised, so "what each sound is" can be pinned: its length,
 * its level, that a loop really loops, that four footstep takes really
 * differ, that the three music layers share one clock, and that the
 * unprepared wind really has the fault the lesson plays.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOTSTEP_TAKES,
  GA_SURFACES,
  MUSIC_BAR_S,
  MUSIC_BEAT_S,
  MUSIC_LAYERS,
  MUSIC_LOOP_S,
  ROOM_RT60_S,
  SR,
  SR_BED,
  footstep,
  musicLayer,
  roomImpulse,
  type GaSound,
} from '../src/screens/lab/gameaudio/sounds/gaSynth.ts';
import { GA_ASSETS, footstepId, gaAsset, gaSound, gaSoundBytes, gaSoundSeconds, releaseGaSounds } from '../src/screens/lab/gameaudio/sounds/gaSoundBank.ts';

const peakOf = (x: Float32Array) => x.reduce((p, v) => Math.max(p, Math.abs(v)), 0);
const rmsOf = (x: Float32Array, a = 0, b = x.length) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
};
const db = (x: number) => 20 * Math.log10(Math.max(x, 1e-12));
/** Spectral centroid (Hz) by zero-phase band energies — coarse but honest. */
function centroid(s: GaSound): number {
  const x = s.ch[0];
  let num = 0;
  let den = 0;
  const N = 2048;
  for (let k = 1; k < 200; k++) {
    const hz = (k * s.sr) / N;
    let re = 0;
    let im = 0;
    const w = (2 * Math.PI * k) / N;
    for (let i = 0; i < Math.min(N, x.length); i++) {
      re += x[i] * Math.cos(w * i);
      im -= x[i] * Math.sin(w * i);
    }
    const e = re * re + im * im;
    num += hz * e;
    den += e;
  }
  return num / den;
}

describe('the asset records', () => {
  it('every asset has a unique id, a file name, a plain label, and builds real audio', () => {
    assert.equal(new Set(GA_ASSETS.map((a) => a.id)).size, GA_ASSETS.length);
    assert.equal(new Set(GA_ASSETS.map((a) => a.file)).size, GA_ASSETS.length);
    for (const a of GA_ASSETS) {
      assert.match(a.file, /^[a-zA-Z0-9_]+\.wav$/);
      assert.ok(a.label.length > 3);
      assert.equal(a.made, 'app');
      const s = gaSound(a.id)!;
      assert.ok(s.sr === SR || s.sr === SR_BED, a.id);
      assert.ok(s.ch.length === 1 || s.ch.length === 2, a.id);
      for (const c of s.ch) {
        assert.equal(c.length, s.ch[0].length, `${a.id} channels are the same length`);
        assert.ok(c.every((v) => Number.isFinite(v)), `${a.id} has no NaN`);
        const p = peakOf(c);
        assert.ok(p > 0.05 && p <= 0.95, `${a.id} peak ${p.toFixed(3)} is audible and leaves headroom`);
      }
      assert.ok(Math.abs(c0mean(s)) < 0.02, `${a.id} has no DC offset`);
      assert.equal(gaSoundBytes(a.id), s.ch.length * s.ch[0].length * 4);
    }
  });
  it('an unknown id is null, never a stand-in', () => {
    assert.equal(gaSound('nope'), null);
    assert.equal(gaAsset('nope'), undefined);
    assert.equal(gaSoundSeconds('nope'), 0);
  });
  it('the cache can be released and rebuilds the same samples (deterministic)', () => {
    const a = Float32Array.from(gaSound('door')!.ch[0]);
    releaseGaSounds();
    const b = gaSound('door')!.ch[0];
    assert.deepEqual(Array.from(b.subarray(0, 4000)), Array.from(a.subarray(0, 4000)));
  });
});
const c0mean = (s: GaSound) => s.ch[0].reduce((m, v) => m + v, 0) / s.ch[0].length;

describe('footsteps: three surfaces, four takes each', () => {
  it('twelve one-shots, each short, each starting and ending in silence', () => {
    for (const s of GA_SURFACES) {
      for (let t = 0; t < FOOTSTEP_TAKES; t++) {
        const f = gaSound(footstepId(s, t))!;
        const x = f.ch[0];
        assert.ok(x.length / f.sr <= 0.4);
        assert.ok(Math.abs(x[0]) < 1e-3 && Math.abs(x[x.length - 1]) < 1e-3);
      }
    }
  });
  it('the four takes of a surface are different sounds, not one sound at four levels', () => {
    for (const s of GA_SURFACES) {
      for (let a = 0; a < FOOTSTEP_TAKES; a++) {
        for (let b = a + 1; b < FOOTSTEP_TAKES; b++) {
          const x = footstep(s, a).ch[0];
          const y = footstep(s, b).ch[0];
          // normalised correlation well below 1: the waveform itself differs
          let xy = 0;
          let xx = 0;
          let yy = 0;
          for (let i = 0; i < x.length; i++) {
            xy += x[i] * y[i];
            xx += x[i] * x[i];
            yy += y[i] * y[i];
          }
          assert.ok(Math.abs(xy / Math.sqrt(xx * yy)) < 0.9, `${s} take ${a + 1} vs ${b + 1}`);
        }
      }
    }
  });
  it('the surface is audible in the spectrum: wood is the darkest, gravel and stone far brighter', () => {
    const c = (s: (typeof GA_SURFACES)[number]) => [0, 1, 2, 3].map((t) => centroid(footstep(s, t))).reduce((m, v) => m + v, 0) / 4;
    const wood = c('wood');
    const stone = c('stone');
    const gravel = c('gravel');
    assert.ok(wood < 700, `wood ${wood.toFixed(0)} Hz`);
    assert.ok(stone > wood * 2, `stone ${stone.toFixed(0)} Hz`);
    assert.ok(gravel > wood * 2, `gravel ${gravel.toFixed(0)} Hz`);
  });
});

describe('loops', () => {
  const LOOPS = GA_ASSETS.filter((a) => a.role === 'loop' || a.role === 'music layer');
  it('every loop is exactly its stated length', () => {
    for (const a of LOOPS) {
      const s = gaSound(a.id)!;
      assert.equal(s.ch[0].length, Math.round(a.loopS! * s.sr), a.id);
    }
  });
  it('a prepared loop joins smoothly: the level across the join matches the level inside it', () => {
    for (const a of LOOPS) {
      if (a.id === 'amb_yard_raw' || a.id === 'alarm') continue;
      const s = gaSound(a.id)!;
      const x = s.ch[0];
      const w = Math.round(0.05 * s.sr);
      // the sample-to-sample step across the boundary is no bigger than the
      // steps the sound makes anywhere else
      let inside = 0;
      for (let i = 1; i < x.length; i++) inside = Math.max(inside, Math.abs(x[i] - x[i - 1]));
      assert.ok(Math.abs(x[0] - x[x.length - 1]) <= inside * 1.001, `${a.id} has no step at the join`);
      // a steady texture also keeps its LEVEL across the join; a music layer
      // need not (a bar may end quiet and the next begin on a bass note)
      if (a.role !== 'loop') continue;
      const tail = rmsOf(x, x.length - w);
      const head = rmsOf(x, 0, w);
      assert.ok(Math.abs(db(tail) - db(head)) < 9, `${a.id} level matches across the join (${db(tail).toFixed(1)} / ${db(head).toFixed(1)} dB)`);
    }
  });
  it('the UNPREPARED wind has the fault the lesson plays: a level jump of more than 10 dB at the join', () => {
    const s = gaSound('amb_yard_raw')!;
    const x = s.ch[0];
    const w = Math.round(0.4 * s.sr);
    const tail = db(rmsOf(x, x.length - w));
    const head = db(rmsOf(x, 0, w));
    assert.ok(tail - head > 10, `tail ${tail.toFixed(1)} dB, head ${head.toFixed(1)} dB`);
    const good = gaSound('amb_yard')!.ch[0];
    assert.ok(Math.abs(db(rmsOf(good, good.length - w)) - db(rmsOf(good, 0, w))) < 6);
  });
  it('the generator hum is periodic in its loop: 50 Hz and its harmonics, whole cycles', () => {
    const s = gaSound('gen_hum')!;
    assert.equal((50 * s.ch[0].length) / s.sr, 100);
  });
});

describe('music: three layers of one phrase', () => {
  it('96 BPM, 4/4, four bars: 0.625 s, 2.5 s, 10 s — and every layer is exactly one phrase', () => {
    assert.equal(MUSIC_BEAT_S, 0.625);
    assert.equal(MUSIC_BAR_S, 2.5);
    assert.equal(MUSIC_LOOP_S, 10);
    for (const l of MUSIC_LAYERS) assert.equal(musicLayer(l).ch[0].length, 10 * SR);
  });
  it('the layers are written to be stacked: together they stay under full scale', () => {
    const N = 10 * SR;
    const sum = new Float32Array(N);
    for (const l of MUSIC_LAYERS) {
      const x = gaSound(`mu_${l}`)!.ch[0];
      for (let i = 0; i < N; i++) sum[i] += x[i];
    }
    assert.ok(peakOf(sum) < 1, `summed peak ${peakOf(sum).toFixed(3)}`);
  });
  it('the drive layer puts its kick on beat 1 of every bar (the layers share the bar lines)', () => {
    const x = gaSound('mu_drive')!.ch[0];
    for (let bar = 0; bar < 4; bar++) {
      const at = Math.round(bar * MUSIC_BAR_S * SR);
      const on = rmsOf(x, at, at + Math.round(0.05 * SR));
      const before = rmsOf(x, at + Math.round(0.4 * SR), at + Math.round(0.45 * SR));
      assert.ok(on > before * 2, `bar ${bar + 1}`);
    }
  });
});

describe('the room impulse', () => {
  it('decays by about 60 dB in its stated time and starts after a short pre-delay', () => {
    const s = roomImpulse();
    const x = s.ch[0];
    assert.ok(peakOf(x.subarray(0, Math.round(0.003 * s.sr))) === 0, 'pre-delay');
    const early = db(rmsOf(x, Math.round(0.05 * s.sr), Math.round(0.15 * s.sr)));
    const late = db(rmsOf(x, Math.round((0.05 + ROOM_RT60_S / 2) * s.sr), Math.round((0.15 + ROOM_RT60_S / 2) * s.sr)));
    assert.ok(Math.abs(early - late - 30) < 6, `${(early - late).toFixed(1)} dB over half the RT60`);
  });
});
