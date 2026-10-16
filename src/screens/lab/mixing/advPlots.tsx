/**
 * Advanced Mixing — the teaching drawings, part 3: the MEASURED pictures
 * (art fix 2026-10-16). Every curve here is computed from the same maths the
 * lab's renderer runs — never sketched:
 *
 *   EqPlot          the RBJ peaking / high-pass biquads the renderer applies
 *                   (earDsp peakEq / highpass, evaluated by eqMath.biquadMagDb)
 *   DuckArt         the REAL kick stem and the bass gain its key produces —
 *                   the renderer's own sidechain detector (keyedGainDb)
 *   CombPlot        two equal paths, one delayed: |1 + e^(−j2πfτ)|
 *   DecayPlot       the shared reverb's real impulse response (earDsp.reverb)
 *   DrivePlot       the bus saturator tanh(x·d)/d, its scope trace and the
 *                   harmonics it adds (a DFT of one cycle)
 *   WidthArt        the renderer's pan law + M/S width, per source, and the
 *                   level each loses when folded to mono
 *   AutomationLanes the verse → chorus rides the variant renders
 *   LoudnessArt     the page's measured integrated loudness and true peak
 *   StemsTimeline   a stem delivery laid out on a DAW timeline
 *
 * Waveforms are drawn min/max per pixel column from real samples, coloured
 * by the house amplitude ramp (feedback_never_stylized_audio).
 */
import { useEffect, useState } from 'react';
import { G, Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import { fonts } from '../../../theme/tokens';
import { levelColorForDb } from '../../../features/tools/levelColor';
import { applyBiquad, highpass, lowpass, peakEq, reverb, REVERB_RT60, SR, type ReverbSpace } from '../../../features/ear/earDsp';
import { biquadMagDb } from '../eq/modules/eqMath';
import { runSoon } from '../../../lib/afterInteractions';
import { combNotchesHz } from './engine/advanced';
import { keyedGainDb, kickStemForDrawing, LOOP_S } from './audio/mixAudio';
import { ART, ArtFrame, CompFace, T, type CompSettings } from './advArt';

/* ── shared: the 20 Hz – 20 kHz log axis ─────────────────────────────────── */

const F_LO = 20;
const F_HI = 20000;
const fx = (f: number, x0: number, x1: number) => x0 + (Math.log(f / F_LO) / Math.log(F_HI / F_LO)) * (x1 - x0);
const fAt = (u: number) => F_LO * Math.pow(F_HI / F_LO, u);
const fmtHz = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : `${Math.round(f)}`);

function FreqGrid({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  return (
    <G>
      {[100, 1000, 10000].map((f) => (
        <G key={f}>
          <Line x1={fx(f, x0, x1)} y1={y0} x2={fx(f, x0, x1)} y2={y1} stroke="#232833" strokeWidth={0.8} />
          <T x={fx(f, x0, x1)} y={y1 + 12} color={ART.inkDim} font={fonts.mono} ls={0}>
            {f === 100 ? '100' : f === 1000 ? '1k' : '10k'}
          </T>
        </G>
      ))}
      {[50, 200, 500, 2000, 5000].map((f) => (
        <Line key={f} x1={fx(f, x0, x1)} y1={y0} x2={fx(f, x0, x1)} y2={y1} stroke="#1a1e26" strokeWidth={0.6} />
      ))}
      <T x={x1} y={y1 + 12} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
        Hz
      </T>
    </G>
  );
}

/* ════ EQ curves (p7, p19) ════════════════════════════════════════════════ */

export type EqBand = { hz: number; gainDb: number; q: number } | { hpHz: number };
export type EqCurve = { label: string; color: string; bands: readonly EqBand[]; dashed?: boolean; bold?: boolean };

/** The renderer's own filters: peakEq(hz, gain, q) and highpass(hz, 0.71). */
export function eqResponseDb(bands: readonly EqBand[], f: number): number {
  let db = 0;
  for (const b of bands) db += 'hpHz' in b ? biquadMagDb(highpass(b.hpHz, 0.71), f, SR) : biquadMagDb(peakEq(b.hz, b.gainDb, b.q), f, SR);
  return db;
}

export function EqPlot({ curves, rangeDb = 12, band, a11y, h = 176 }: { curves: readonly EqCurve[]; rangeDb?: number; band?: { lo: number; hi: number; label: string | null }; a11y: string; h?: number }) {
  const x0 = 36;
  const x1 = 330;
  const top = 18 + Math.ceil(curves.length / 3) * 15;
  const y0 = top;
  const y1 = h - 18;
  const yOf = (db: number) => (y0 + y1) / 2 - (Math.max(-rangeDb, Math.min(rangeDb, db)) / rangeDb) * ((y1 - y0) / 2);
  const paths = curves.map((c) => {
    let d = '';
    for (let k = 0; k <= 180; k++) {
      const f = fAt(k / 180);
      d += `${k === 0 ? 'M' : 'L'} ${fx(f, x0, x1).toFixed(1)} ${yOf(eqResponseDb(c.bands, f)).toFixed(1)} `;
    }
    return d;
  });
  const half = rangeDb / 2;
  return (
    <ArtFrame h={h} a11y={a11y}>
      {band ? (
        <G>
          <Rect x={fx(band.lo, x0, x1)} y={y0} width={fx(band.hi, x0, x1) - fx(band.lo, x0, x1)} height={y1 - y0} fill={ART.amber} opacity={0.08} />
          {band.label ? (
            <T x={(fx(band.lo, x0, x1) + fx(band.hi, x0, x1)) / 2} y={y0 + 12} color={ART.amber} ls={0.8}>
              {band.label}
            </T>
          ) : null}
        </G>
      ) : null}
      <FreqGrid x0={x0} x1={x1} y0={y0} y1={y1} />
      {[rangeDb, half, 0, -half, -rangeDb].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={yOf(db)} x2={x1} y2={yOf(db)} stroke={db === 0 ? '#3a4150' : '#1d222b'} strokeWidth={db === 0 ? 1 : 0.7} />
          <T x={x0 - 4} y={yOf(db) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
            {db > 0 ? `+${db}` : db === 0 ? '0' : `${db}`.replace('-', '−')}
          </T>
        </G>
      ))}
      {curves.map((c, i) => (
        <Path key={c.label} d={paths[i]} stroke={c.color} strokeWidth={c.bold ? 2.4 : 1.7} fill="none" strokeDasharray={c.dashed ? '4 3' : undefined} strokeLinejoin="round" />
      ))}
      {/* legend: line swatch + name, beside the plot, never on a curve */}
      {curves.map((c, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const lx = x0 + col * 100;
        const ly = 14 + row * 15;
        return (
          <G key={`k${c.label}`}>
            <Line x1={lx} y1={ly - 3.5} x2={lx + 14} y2={ly - 3.5} stroke={c.color} strokeWidth={c.bold ? 2.4 : 1.8} strokeDasharray={c.dashed ? '4 3' : undefined} />
            <T x={lx + 18} y={ly} anchor="start" color={c.color} ls={0.5}>
              {c.label}
            </T>
          </G>
        );
      })}
    </ArtFrame>
  );
}

/* ════ p8 · the sidechain, drawn from the real kick ═══════════════════════ */

export const DUCK: CompSettings = { thresholdDb: -26, ratio: 8, attackMs: 2, releaseMs: 110 };
/** Two bars of the loop (bar 2 carries the kick's pickup). */
const DUCK_S = LOOP_S / 2;
const DUCK_COLS = 290;

type DuckData = { kMin: Float32Array; kMax: Float32Array; gain: Float32Array };

function duckData(): DuckData {
  const n = Math.round(DUCK_S * SR);
  const kick = kickStemForDrawing().subarray(0, n);
  const g = keyedGainDb(kick, DUCK.ratio, DUCK.thresholdDb, DUCK.attackMs, DUCK.releaseMs);
  const kMin = new Float32Array(DUCK_COLS);
  const kMax = new Float32Array(DUCK_COLS);
  const gain = new Float32Array(DUCK_COLS);
  const per = n / DUCK_COLS;
  for (let c = 0; c < DUCK_COLS; c++) {
    let lo = 0;
    let hi = 0;
    let gm = 0;
    for (let i = Math.floor(c * per); i < Math.floor((c + 1) * per); i++) {
      const v = kick[i];
      if (v < lo) lo = v;
      if (v > hi) hi = v;
      if (g[i] < gm) gm = g[i];
    }
    kMin[c] = lo;
    kMax[c] = hi;
    gain[c] = gm;
  }
  return { kMin, kMax, gain };
}

export function DuckArt({ ducking }: { ducking: boolean }) {
  const [data, setData] = useState<DuckData | null>(null);
  useEffect(() => {
    // Off the render path: the kick (and, cold, its synthesis) is a few ms.
    const h = runSoon(() => setData(duckData()));
    return () => h.cancel();
  }, []);
  const x0 = 40;
  const lane1 = { y: 112, h: 52 };
  const lane2 = { y: 186, h: 64 };
  const GR_FLOOR = -24;
  const gy = (db: number) => lane2.y + (Math.max(GR_FLOOR, Math.min(0, db)) / GR_FLOOR) * lane2.h;
  let gainPath = '';
  if (data) {
    for (let c = 0; c < DUCK_COLS; c++) gainPath += `${c === 0 ? 'M' : 'L'} ${(x0 + c).toFixed(1)} ${gy(ducking ? data.gain[c] : 0).toFixed(1)} `;
  }
  const beatX = (b: number) => x0 + ((b * 60) / 96 / DUCK_S) * DUCK_COLS;
  const deepest = data && ducking ? Math.min(...Array.from(data.gain)) : 0;
  return (
    <ArtFrame
      h={292}
      a11y={
        ducking
          ? `The bass compressor with its key input lit from the kick: threshold −26 dB, 8 to 1, 2 millisecond attack, 110 millisecond release. Below, two bars of the real kick track, and the gain the compressor applies to the bass: it dips by up to ${Math.round(-deepest)} dB on every kick hit and recovers within about a tenth of a second.`
          : 'No compressor on the bass. Below, two bars of the real kick track, and the bass gain: a flat line at 0 dB — the bass never moves.'
      }
    >
      <CompFace x={40} y={22} w={292} settings={ducking ? DUCK : null} keyIn={ducking ? 'KICK' : null} title={ducking ? 'BASS COMP · KEY ← KICK · NO MAKE-UP' : 'BASS COMPRESSOR'} />
      {/* lane 1: the real kick, min/max per column */}
      <Rect x={x0} y={lane1.y} width={DUCK_COLS} height={lane1.h} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      <Line x1={x0} y1={lane1.y + lane1.h / 2} x2={x0 + DUCK_COLS} y2={lane1.y + lane1.h / 2} stroke="#2f74ff" strokeWidth={0.6} opacity={0.7} />
      {data
        ? Array.from(data.kMax).map((hi, c) => {
            const lo = data.kMin[c];
            const pk = Math.max(Math.abs(lo), Math.abs(hi));
            if (pk < 0.002) return null;
            const mid = lane1.y + lane1.h / 2;
            return <Line key={c} x1={x0 + c + 0.5} y1={mid - hi * (lane1.h / 2)} x2={x0 + c + 0.5} y2={mid - lo * (lane1.h / 2)} stroke={levelColorForDb(20 * Math.log10(pk), -48, 0)} strokeWidth={1} />;
          })
        : null}
      <T x={x0 - 4} y={lane1.y + lane1.h / 2 + 3.5} anchor="end" color={ART.ink}>
        KICK
      </T>
      {/* lane 2: the gain the bass receives */}
      <Rect x={x0} y={lane2.y} width={DUCK_COLS} height={lane2.h} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      {[0, -12, -24].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={gy(db)} x2={x0 + DUCK_COLS} y2={gy(db)} stroke={db === 0 ? '#3a4150' : '#1d222b'} strokeWidth={0.7} />
          <T x={x0 - 4} y={gy(db) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
            {db === 0 ? '0' : `${db}`.replace('-', '−')}
          </T>
        </G>
      ))}
      {gainPath ? <Path d={gainPath} stroke={ducking ? ART.amber : ART.wire} strokeWidth={1.6} fill="none" strokeLinejoin="round" /> : null}
      <T x={x0 + 4} y={lane2.y - 5} anchor="start" color={ducking ? ART.amber : ART.ink} ls={0.6}>
        {ducking ? `BASS GAIN, dB — DIPS ${Math.round(-deepest)} dB ON EACH KICK` : 'BASS GAIN, dB — FLAT, NOTHING MOVES IT'}
      </T>
      {/* bar / beat ruler */}
      {Array.from({ length: 9 }, (_, b) => (
        <Line key={b} x1={beatX(b)} y1={lane2.y + lane2.h} x2={beatX(b)} y2={lane2.y + lane2.h + (b % 4 === 0 ? 6 : 3)} stroke={ART.inkDim} strokeWidth={0.7} />
      ))}
      <T x={beatX(0) + 2} y={lane2.y + lane2.h + 16} anchor="start" color={ART.inkDim}>
        BAR 1
      </T>
      <T x={beatX(4) + 2} y={lane2.y + lane2.h + 16} anchor="start" color={ART.inkDim}>
        BAR 2
      </T>
      {ducking ? (
        <T x={x0 + DUCK_COLS} y={lane2.y + lane2.h + 32} anchor="end" color={ART.amber} ls={0.5}>
          EXAGGERATED SO YOU CAN HEAR IT
        </T>
      ) : null}
    </ArtFrame>
  );
}

/* ════ p9 · the comb ══════════════════════════════════════════════════════ */

export function CombPlot({ ms }: { ms: number | null }) {
  const x0 = 36;
  const x1 = 330;
  const y0 = 22;
  const y1 = 152;
  const TOP = 9;
  const BOT = -30;
  const yOf = (db: number) => y0 + ((TOP - Math.max(BOT, Math.min(TOP, db))) / (TOP - BOT)) * (y1 - y0);
  const tau = (ms ?? 0) / 1000;
  const dbAt = (f: number) => 20 * Math.log10(Math.max(1e-6, 2 * Math.abs(Math.cos(Math.PI * f * tau))));
  // Min/max per pixel column: where the teeth are denser than a pixel the
  // band fills — exactly what a real analyser shows.
  const cols: ReactBand[] = [];
  if (ms != null) {
    const W = Math.round(x1 - x0);
    for (let c = 0; c < W; c++) {
      let lo = Infinity;
      let hi = -Infinity;
      for (let k = 0; k <= 24; k++) {
        const f = fAt((c + k / 24) / W);
        const v = dbAt(f);
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
      // Teeth closer than ~2 px cannot be drawn one by one: such columns are
      // the comb's envelope, drawn faint (review 2026-10-16).
      const f0 = fAt(c / W);
      const pxHz = f0 * (Math.log(F_HI / F_LO) / W);
      cols.push({ c, lo, hi, dense: tau > 0 && 1 / tau < 2 * pxHz });
    }
  }
  const notches = ms != null ? combNotchesHz(ms, 3) : [];
  return (
    <ArtFrame
      h={180}
      a11y={
        ms == null
          ? 'Frequency response of one microphone alone: flat at 0 dB. Pick a delay to see two summed paths comb the response.'
          : `Frequency response of two equal paths, one delayed ${ms} milliseconds: peaks of +6 dB and deep notches, the first at ${fmtHz(notches[0])} hertz, then every ${fmtHz(1000 / ms)} hertz.`
      }
    >
      <FreqGrid x0={x0} x1={x1} y0={y0} y1={y1} />
      {[6, 0, -12, -24].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={yOf(db)} x2={x1} y2={yOf(db)} stroke={db === 0 ? '#3a4150' : '#1d222b'} strokeWidth={db === 0 ? 1 : 0.7} />
          <T x={x0 - 4} y={yOf(db) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
            {db > 0 ? `+${db}` : db === 0 ? '0' : `${db}`.replace('-', '−')}
          </T>
        </G>
      ))}
      {ms == null ? (
        <G>
          <Line x1={x0} y1={yOf(0)} x2={x1} y2={yOf(0)} stroke={ART.wire} strokeWidth={1.8} />
          <T x={(x0 + x1) / 2} y={yOf(0) - 8} color={ART.ink}>
            ONE MIC ALONE — FLAT
          </T>
        </G>
      ) : (
        <G>
          {cols.map(({ c, lo, hi, dense }) => (
            <Line key={c} x1={x0 + c + 0.5} y1={yOf(hi)} x2={x0 + c + 0.5} y2={yOf(lo) + 0.01} stroke={ART.amber} strokeWidth={1.1} opacity={dense ? 0.28 : 1} />
          ))}
          {cols.some((b) => b.dense) ? (
            <T x={x0} y={12} anchor="start" color={ART.amber} ls={0.4}>
              FAINT = TEETH TOO DENSE TO DRAW
            </T>
          ) : null}
          {notches.map((f, i) => (
            <G key={f}>
              <Polygon points={`${fx(f, x0, x1)},${y1 - 2} ${fx(f, x0, x1) - 3.5},${y1 + 4} ${fx(f, x0, x1) + 3.5},${y1 + 4}`} fill={ART.red} />
              {i === 0 ? (
                <T x={x1} y={12} anchor="end" color={ART.red} ls={0.4}>
                  {`▲ 1ST NOTCH ${fmtHz(f)} Hz`}
                </T>
              ) : null}
            </G>
          ))}
        </G>
      )}
    </ArtFrame>
  );
}
type ReactBand = { c: number; lo: number; hi: number; dense: boolean };

/* ════ p10 · the reverb's real decay ══════════════════════════════════════ */

const DECAY_S = 2.6;
/** Rendered past the drawn window so the energy integral is not truncated
 *  (the hall's tail at 3.5 s is ~95 dB down). */
const DECAY_RENDER_S = 3.5;
const DECAY_COLS = 290;

/** The space's ENERGY DECAY CURVE — Schroeder's backward integral, the way
 *  RT60 is measured — of the renderer's own return (reverb(x, space, RT60,
 *  0.5, wet 1)) fed an impulse. Taken below 500 Hz: the reverb damps its
 *  highs on purpose, and RT60 is the low end's decay time (measured: room
 *  0.40 s, hall 2.20 s by T20 — the nominal values, by construction). */
function decayEnvelope(space: ReverbSpace): Float32Array {
  const n = Math.round(DECAY_RENDER_S * SR);
  const imp = new Float32Array(n);
  imp[0] = 1;
  const ir = applyBiquad(reverb(imp, space, undefined, 0.5, 1), lowpass(500, 0.707));
  const edc = new Float64Array(n + 1);
  for (let i = n - 1; i >= 0; i--) edc[i] = edc[i + 1] + ir[i] * ir[i];
  const total = Math.max(edc[0], 1e-30);
  const out = new Float32Array(DECAY_COLS);
  const shown = Math.round(DECAY_S * SR);
  for (let c = 0; c < DECAY_COLS; c++) out[c] = 10 * Math.log10(Math.max(edc[Math.floor((c / DECAY_COLS) * shown)] / total, 1e-9));
  return out;
}

export function DecayPlot({ space }: { space: 'room' | 'hall' }) {
  const [env, setEnv] = useState<{ room: Float32Array; hall: Float32Array } | null>(null);
  useEffect(() => {
    // Two macrotasks, one space each: never one long block on the JS thread.
    let second: { cancel: () => void } | null = null;
    const first = runSoon(() => {
      const room = decayEnvelope('room');
      second = runSoon(() => setEnv({ room, hall: decayEnvelope('hall') }));
    });
    return () => {
      first.cancel();
      second?.cancel();
    };
  }, []);
  const x0 = 40;
  const y0 = 22;
  const y1 = 150;
  const FLOOR = -60;
  const yOf = (db: number) => y0 + (Math.max(FLOOR, Math.min(0, db)) / FLOOR) * (y1 - y0);
  const tx = (s: number) => x0 + (s / DECAY_S) * DECAY_COLS;
  const path = (e: Float32Array) => {
    let d = '';
    for (let c = 0; c < DECAY_COLS; c++) d += `${c === 0 ? 'M' : 'L'} ${(x0 + c).toFixed(1)} ${yOf(e[c]).toFixed(1)} `;
    return d;
  };
  const curves = env
    ? (['room', 'hall'] as const).map((k) => ({ k, d: path(env[k]), on: k === space, color: k === 'room' ? '#5bb0ff' : ART.amber }))
    : [];
  return (
    <ArtFrame
      h={186}
      a11y={`The shared reverb's measured energy decay, level against time: the tight room falls 60 dB in about ${REVERB_RT60.room} seconds, the big hall in about ${REVERB_RT60.hall} seconds. ${space === 'room' ? 'Tight room' : 'Big hall'} highlighted.`}
    >
      {[0, -20, -40, -60].map((db) => (
        <G key={db}>
          <Line x1={x0} y1={yOf(db)} x2={x0 + DECAY_COLS} y2={yOf(db)} stroke={db === -60 ? '#3a2a2a' : '#1d222b'} strokeWidth={0.7} strokeDasharray={db === -60 ? '3 2' : undefined} />
          <T x={x0 - 4} y={yOf(db) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
            {db === 0 ? '0' : `${db}`.replace('-', '−')}
          </T>
        </G>
      ))}
      {[0.5, 1, 1.5, 2, 2.5].map((s) => (
        <T key={s} x={tx(s)} y={y1 + 13} color={ART.inkDim} font={fonts.mono} ls={0}>
          {s === 2.5 ? '2.5 s' : `${s}`}
        </T>
      ))}
      {curves
        .sort((a) => (a.on ? 1 : -1))
        .map((c) => (
          <Path key={c.k} d={c.d} stroke={c.color} strokeWidth={c.on ? 1.9 : 1.1} opacity={c.on ? 1 : 0.35} fill="none" strokeLinejoin="round" />
        ))}
      {(['room', 'hall'] as const).map((k) => (
        <G key={`m${k}`}>
          <Line x1={tx(REVERB_RT60[k])} y1={yOf(-60) - 5} x2={tx(REVERB_RT60[k])} y2={yOf(-60) + 4} stroke={k === 'room' ? '#5bb0ff' : ART.amber} strokeWidth={1.4} opacity={k === space ? 1 : 0.45} />
        </G>
      ))}
      <T x={tx(REVERB_RT60.room) + 4} y={yOf(-60) - 8} anchor="start" color="#5bb0ff" ls={0.4}>
        {`ROOM ${REVERB_RT60.room} s`}
      </T>
      <Line x1={tx(REVERB_RT60.hall)} y1={yOf(-34)} x2={tx(REVERB_RT60.hall)} y2={yOf(-60) - 6} stroke={ART.amber} strokeWidth={0.7} opacity={0.7} />
      <T x={tx(REVERB_RT60.hall)} y={yOf(-36)} color={ART.amber} ls={0.4}>
        {`HALL ${REVERB_RT60.hall} s`}
      </T>
      <T x={x0 + DECAY_COLS} y={14} anchor="end" color={ART.ink} ls={0.8}>
        DECAY dB · TIME TO FALL 60 dB
      </T>
    </ArtFrame>
  );
}

/* ════ p11 · the drive ════════════════════════════════════════════════════ */

const sat = (x: number, d: number) => (d === 1 ? x : Math.tanh(x * d) / d);

/** Harmonic levels (dB re the fundamental) of a sine of amplitude `a`
 *  through the saturator — a DFT of one cycle. */
function harmonicsDb(a: number, d: number, upTo = 7): number[] {
  const N = 512;
  const y = new Float64Array(N);
  for (let i = 0; i < N; i++) y[i] = sat(a * Math.sin((2 * Math.PI * i) / N), d);
  const mag = (k: number) => {
    let re = 0;
    let im = 0;
    for (let i = 0; i < N; i++) {
      re += y[i] * Math.cos((2 * Math.PI * k * i) / N);
      im -= y[i] * Math.sin((2 * Math.PI * k * i) / N);
    }
    return Math.hypot(re, im);
  };
  const f1 = mag(1);
  const out: number[] = [];
  for (let k = 1; k <= upTo; k++) out.push(20 * Math.log10(Math.max(mag(k) / f1, 1e-9)));
  return out;
}

const ORDINAL: Record<number, string> = { 3: '3rd', 5: '5th', 7: '7th' };

export function DrivePlot({ driveDb }: { driveDb: number }) {
  const d = Math.pow(10, driveDb / 20);
  const A = 0.5; // a mix peak near −6 dBFS
  // panel 1: the transfer curve
  const p1 = { x: 30, y: 22, w: 104, h: 104 };
  const tX = (v: number) => p1.x + ((v + 1) / 2) * p1.w;
  const tY = (v: number) => p1.y + p1.h - ((v + 1) / 2) * p1.h;
  // Normalised to its own full-scale output, so the SHAPE reads at the
  // same size as the level-matched scope beside it (review 2026-10-16).
  const curve = (dd: number) => {
    const norm = sat(1, dd);
    let s = '';
    for (let k = 0; k <= 60; k++) {
      const v = -1 + (2 * k) / 60;
      s += `${k === 0 ? 'M' : 'L'} ${tX(v).toFixed(1)} ${tY(sat(v, dd) / norm).toFixed(1)} `;
    }
    return s;
  };
  // panel 2: two cycles, input vs output RMS-matched (as the player matches)
  const p2 = { x: 152, y: 22, w: 180, h: 104 };
  const NS = 180;
  const inRms = A / Math.SQRT2;
  let outRmsAcc = 0;
  for (let i = 0; i < 256; i++) outRmsAcc += sat(A * Math.sin((2 * Math.PI * i) / 256), d) ** 2;
  const match = inRms / Math.sqrt(outRmsAcc / 256);
  const scope = (fn: (ph: number) => number) => {
    let s = '';
    for (let i = 0; i <= NS; i++) {
      const ph = (4 * Math.PI * i) / NS;
      s += `${i === 0 ? 'M' : 'L'} ${(p2.x + (i / NS) * p2.w).toFixed(1)} ${(p2.y + p2.h / 2 - fn(ph) * (p2.h / 2) * 1.25).toFixed(1)} `;
    }
    return s;
  };
  const h = harmonicsDb(A, d);
  const p3 = { x: 30, y: 162, w: 302, h: 46 };
  const bars = [3, 5, 7];
  return (
    <ArtFrame
      h={234}
      a11y={`The bus saturator at ${driveDb ? `${driveDb} dB of drive` : 'no drive'}: the transfer curve ${driveDb ? 'bends over toward its ceiling' : 'is a straight line'}; a sine peaking near −6 dBFS comes out ${driveDb ? 'with rounded, flattened peaks' : 'unchanged'}, level-matched; and the added odd harmonics sit at ${h
        .filter((_, i) => i % 2 === 0 && i > 0)
        .map((v) => `${Math.round(v)} dB`)
        .join(', ')} below the fundamental.`}
    >
      {/* transfer curve */}
      <Rect x={p1.x} y={p1.y} width={p1.w} height={p1.h} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      <Line x1={tX(0)} y1={p1.y} x2={tX(0)} y2={p1.y + p1.h} stroke="#1d222b" strokeWidth={0.7} />
      <Line x1={p1.x} y1={tY(0)} x2={p1.x + p1.w} y2={tY(0)} stroke="#1d222b" strokeWidth={0.7} />
      <Path d={curve(1)} stroke="#3a4150" strokeWidth={1} strokeDasharray="3 2" fill="none" />
      <Path d={curve(d)} stroke={ART.amber} strokeWidth={1.9} fill="none" />
      <T x={p1.x + p1.w / 2} y={p1.y - 6} color={ART.ink} ls={0.8}>
        THE CURVE
      </T>
      <T x={p1.x + p1.w} y={p1.y + p1.h + 12} anchor="end" color={ART.inkDim} ls={0.4}>
        IN →
      </T>
      <T x={p1.x - 3} y={p1.y + 10} anchor="end" color={ART.inkDim} ls={0.4}>
        OUT
      </T>
      <T x={p1.x + 2} y={p1.y + p1.h + 12} anchor="start" color={ART.inkDim} ls={0.3}>
        FLAT = PEAKS SQUASHED
      </T>
      {/* scope */}
      <Rect x={p2.x} y={p2.y} width={p2.w} height={p2.h} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      <Line x1={p2.x} y1={p2.y + p2.h / 2} x2={p2.x + p2.w} y2={p2.y + p2.h / 2} stroke="#2f74ff" strokeWidth={0.6} opacity={0.7} />
      <Path d={scope((ph) => A * Math.sin(ph))} stroke="#5d646d" strokeWidth={1.1} strokeDasharray="3 2" fill="none" />
      <Path d={scope((ph) => sat(A * Math.sin(ph), d) * match)} stroke={ART.amber} strokeWidth={1.7} fill="none" />
      <T x={p2.x + p2.w / 2} y={p2.y - 6} color={ART.ink} ls={0.8}>
        −6 dBFS SINE · LEVEL-MATCHED
      </T>
      {/* added harmonics */}
      <T x={p3.x} y={p3.y - 6} anchor="start" color={ART.ink} ls={0.8}>
        HARMONICS ADDED (dB BELOW THE NOTE)
      </T>
      {bars.map((k, i) => {
        const v = h[k - 1];
        const bx = p3.x + 34 + i * 96;
        const bw = 52;
        const frac = Math.max(0, (v + 80) / 80);
        return (
          <G key={k}>
            <T x={bx - 6} y={p3.y + 18} anchor="end" color={ART.inkDim} ls={0.3}>
              {ORDINAL[k]}
            </T>
            <Rect x={bx} y={p3.y + 9} width={bw} height={11} rx={2} fill="#0b0c10" stroke="#232833" strokeWidth={0.6} />
            {frac > 0 ? <Rect x={bx + 1} y={p3.y + 10} width={(bw - 2) * frac} height={9} rx={1.5} fill={levelColorForDb(v, -80, 0)} /> : null}
            <T x={bx + bw / 2} y={p3.y + 36} color={driveDb ? ART.amber : ART.inkDim} font={fonts.mono} ls={0}>
              {v < -79 ? 'none' : `${Math.round(v)}`.replace('-', '−')}
            </T>
          </G>
        );
      })}
    </ArtFrame>
  );
}

/* ════ p12 · width and the mono fold ══════════════════════════════════════ */

export type WidthView = 'mixed' | 'wide' | 'widemono';

const WIDTH_SOURCES = [
  { name: 'GTR', pan: -55 },
  { name: 'BGV', pan: -35 },
  { name: 'CENTRE', pan: 0 },
  { name: 'PERC', pan: 30 },
  { name: 'KEYS', pan: 55 },
] as const;

/** The renderer's pan law (cos/sin, −3 dB centre) then its M/S width. */
export function widthFor(pan: number, width: number): { l: number; r: number; m: number; monoPriceDb: number; pos: number } {
  const p = pan / 100;
  const a = ((p + 1) / 2) * (Math.PI / 2);
  const gl = Math.cos(a) * Math.SQRT2 * 0.5;
  const gr = Math.sin(a) * Math.SQRT2 * 0.5;
  const m = (gl + gr) / 2;
  const sd = ((gl - gr) / 2) * width;
  const l = m + sd;
  const r = m - sd;
  const pw = l * l + r * r;
  return { l, r, m, monoPriceDb: 10 * Math.log10((2 * m * m) / pw), pos: (r * r - l * l) / pw };
}

export function WidthArt({ view }: { view: WidthView }) {
  const width = view === 'mixed' ? 1 : 1.6;
  const mono = view === 'widemono';
  const sx0 = 92;
  const sx1 = 236;
  const px = (pos: number) => sx0 + ((pos + 1) / 2) * (sx1 - sx0);
  const rows = WIDTH_SOURCES.map((s) => ({ ...s, ...widthFor(s.pan, width) }));
  return (
    <ArtFrame
      h={196}
      a11y={`${mono ? 'Folded to mono: every source collapses to the centre and keeps only its mid signal.' : `Stereo stage at width ${width}.`} ${rows
        .filter((r) => r.pan !== 0)
        .map((r) => `${r.name} ${mono ? 'loses' : 'would lose'} ${Math.abs(r.monoPriceDb).toFixed(1)} dB in mono`)
        .join('; ')}. Centre sources lose nothing.`}
    >
      <T x={px(-1)} y={16} color={ART.ink}>
        L
      </T>
      <T x={px(0)} y={16} color={ART.ink}>
        C
      </T>
      <T x={px(1)} y={16} color={ART.ink}>
        R
      </T>
      <T x={300} y={16} color={mono ? ART.amber : ART.ink} ls={0.6}>
        MONO PRICE
      </T>
      {rows.map((r, i) => {
        const y = 38 + i * 30;
        const pos = mono ? 0 : r.pos;
        return (
          <G key={r.name}>
            <T x={sx0 - 12} y={y + 4} anchor="end" color={ART.ink}>
              {r.name === 'CENTRE' ? 'KICK·BASS·LEAD' : r.name}
            </T>
            <Line x1={sx0} y1={y} x2={sx1} y2={y} stroke="#2a2f3a" strokeWidth={1} />
            <Line x1={px(0)} y1={y - 5} x2={px(0)} y2={y + 5} stroke="#3a4150" strokeWidth={0.8} />
            {mono && r.pan !== 0 ? <Line x1={px(r.pos)} y1={y} x2={px(0)} y2={y} stroke={ART.amber} strokeWidth={1} strokeDasharray="2 2" opacity={0.7} /> : null}
            <Circle cx={px(pos)} cy={y} r={5.5} fill={r.pan === 0 ? '#5d646d' : ART.cyan} opacity={mono && r.pan !== 0 ? 0.55 : 1} />
            <T x={300} y={y + 4} color={r.pan === 0 ? ART.inkDim : mono ? ART.amber : ART.ink} font={fonts.mono} ls={0}>
              {r.pan === 0 ? '0.0 dB' : `${r.monoPriceDb.toFixed(1)} dB`.replace('-', '−')}
            </T>
          </G>
        );
      })}
      <T x={(sx0 + sx1) / 2} y={190} color={ART.inkDim} ls={0.4}>
        {mono ? '● WHERE IT PLAYS NOW (MONO) · ┄ WHERE IT SAT IN STEREO' : width > 1 ? '● WHERE EACH PART SITS · SIDE × 1.6 PUSHES IT OUT' : '● WHERE EACH PART SITS, AS PANNED'}
      </T>
    </ArtFrame>
  );
}

/* ════ p13 · automation lanes ═════════════════════════════════════════════ */

export type Ride = { name: string; verseDb: number; chorusDb: number };

export function AutomationLanes({ rides }: { rides: readonly Ride[] }) {
  const x0 = 64;
  const x1 = 332;
  const laneH = 28;
  const top = 30;
  const mid = (x0 + x1) / 2;
  const fade = ((0.06 / LOOP_S) * (x1 - x0)) / 1;
  // −18…+6 dB per lane, so a 2–3 dB move is visible (review 2026-10-16);
  // anything lower pins to the floor and reads −∞ / its value.
  const HI = 6;
  const LO = -18;
  return (
    <ArtFrame
      h={top + rides.length * (laneH + 6) + 8}
      a11y={`Volume automation lanes (fader level), verse then chorus: ${rides.map((r) => `${r.name} ${fmtRide(r.verseDb)} to ${fmtRide(r.chorusDb)}`).join('; ')}.`}
    >
      <Rect x={x0} y={top - 16} width={mid - x0} height={12} fill="#1a1f2a" />
      <Rect x={mid} y={top - 16} width={x1 - mid} height={12} fill="#2a2210" />
      <T x={(x0 + mid) / 2} y={top - 6.5} color={ART.ink} ls={0.8}>
        VERSE · BARS 1–2
      </T>
      <T x={(mid + x1) / 2} y={top - 6.5} color={ART.amber} ls={0.8}>
        CHORUS · BARS 3–4
      </T>
      {rides.map((r, i) => {
        const y = top + i * (laneH + 6);
        const ly = (db: number) => y + laneH - 3 - ((Math.max(LO, Math.min(HI, db)) - LO) / (HI - LO)) * (laneH - 6);
        const yv = ly(r.verseDb);
        const yc = ly(r.chorusDb);
        const moved = r.verseDb !== r.chorusDb;
        return (
          <G key={r.name}>
            <T x={x0 - 6} y={y + laneH / 2 + 4} anchor="end" color={ART.ink}>
              {r.name}
            </T>
            <Rect x={x0} y={y} width={x1 - x0} height={laneH} rx={2} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
            <Line x1={mid} y1={y} x2={mid} y2={y + laneH} stroke="#3a3420" strokeWidth={0.8} />
            <Path d={`M ${x0} ${yv} L ${mid - fade} ${yv} L ${mid} ${yc} L ${x1} ${yc}`} stroke={moved ? ART.amber : ART.wire} strokeWidth={1.6} fill="none" />
            {moved ? (
              <G>
                <Circle cx={mid - fade} cy={yv} r={2.2} fill={ART.amber} />
                <Circle cx={mid} cy={yc} r={2.2} fill={ART.amber} />
                <T x={mid + 8} y={yc < y + laneH / 2 ? y + laneH - 4 : y + 11} anchor="start" color={ART.amber} font={fonts.mono} ls={0}>
                  {deltaText(r.verseDb, r.chorusDb)}
                </T>
              </G>
            ) : null}
            {/* each value sits in the half of the lane its line does not use */}
            <T x={x0 + 4} y={yv < y + laneH / 2 ? y + laneH - 4 : y + 11} anchor="start" color={ART.inkDim} font={fonts.mono} ls={0}>
              {fmtRide(r.verseDb)}
            </T>
            <T x={x1 - 4} y={yc < y + laneH / 2 ? y + laneH - 4 : y + 11} anchor="end" color={moved ? ART.amber : ART.inkDim} font={fonts.mono} ls={0}>
              {fmtRide(r.chorusDb)}
            </T>
          </G>
        );
      })}
    </ArtFrame>
  );
}

/** The move at the section change, as an engineer says it. */
function deltaText(a: number, b: number): string {
  if (a <= -60) return '▲ ENTERS';
  if (b <= -60) return '▼ OUT';
  const d = b - a;
  return `${d > 0 ? '▲ +' : '▼ −'}${Math.abs(d)} dB`;
}

const fmtRide = (db: number) => (db <= -60 ? '−∞' : db > 0 ? `+${db} dB` : db === 0 ? '0 dB' : `${db} dB`.replace('-', '−'));

/* ════ p15 · the loudness meters ══════════════════════════════════════════ */

/** The house peak-red (feedback_peak_red_and_tap_toggle). */
export const PEAK_RED = '#ff5a48';

export function LoudnessArt({ lufs, tp }: { lufs: number | null; tp: number | null }) {
  const bx = 98;
  const bw = 226;
  const rows = [
    { name: 'INTEGRATED', unit: 'LUFS', v: lufs, lo: -36, hi: 0, mark: null as number | null },
    { name: 'TRUE PEAK', unit: 'dBTP', v: tp, lo: -24, hi: 3, mark: -1 },
  ];
  return (
    <ArtFrame h={124} a11y={lufs == null ? 'Loudness meters, not measured yet.' : `Loudness meters: integrated ${lufs.toFixed(1)} LUFS; true peak ${tp?.toFixed(1)} dBTP against the −1 dBTP line.`}>
      {rows.map((r, i) => {
        const y = 26 + i * 50;
        const xOf = (v: number) => bx + ((Math.max(r.lo, Math.min(r.hi, v)) - r.lo) / (r.hi - r.lo)) * bw;
        const ticks = r.unit === 'LUFS' ? [-36, -24, -12, 0] : [-24, -12, -6, 0, 3];
        return (
          <G key={r.name}>
            <T x={bx - 8} y={y + 9} anchor="end" color={ART.ink}>
              {r.name}
            </T>
            <Rect x={bx} y={y} width={bw} height={12} rx={2} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
            {r.v != null ? <Rect x={bx + 1} y={y + 1} width={Math.max(0, xOf(r.v) - bx - 1)} height={10} rx={1.5} fill={r.mark != null && r.v > r.mark ? PEAK_RED : levelColorForDb(r.v, r.lo, r.hi)} /> : null}
            {r.mark != null ? (
              <G>
                <Line x1={xOf(r.mark)} y1={y - 4} x2={xOf(r.mark)} y2={y + 16} stroke={ART.red} strokeWidth={1.2} />
                <T x={xOf(r.mark) - 3} y={y - 6} anchor="end" color={ART.red} font={fonts.mono} ls={0}>
                  −1
                </T>
              </G>
            ) : null}
            {ticks.map((t) => (
              <T key={t} x={xOf(t)} y={y + 26} color={ART.inkDim} font={fonts.mono} ls={0}>
                {t > 0 ? `+${t}` : t === 0 ? '0' : `${t}`.replace('-', '−')}
              </T>
            ))}
            <T x={10} y={y + 26} anchor="start" color={r.v == null ? ART.inkDim : r.mark != null && r.v > r.mark ? PEAK_RED : ART.amber} font={fonts.mono} ls={0}>
              {r.v == null ? `— ${r.unit}` : `${r.v.toFixed(1)} ${r.unit}`.replace('-', '−')}
            </T>
          </G>
        );
      })}
    </ArtFrame>
  );
}

/* ════ p16 · a stem delivery on the timeline ══════════════════════════════ */

export type StemFocus = 'tracks' | 'alts' | 'sets' | 'align' | 'naming' | null;

const STEMS = [
  { name: 'DRUMS', color: '#5b8fe0' },
  { name: 'BASS', color: '#9a7ae0' },
  { name: 'MUSIC', color: '#3fae7a' },
  { name: 'VOCALS', color: '#e0a94a' },
  { name: 'FX', color: '#5fc4c4' },
] as const;

export function StemsTimeline({ focus }: { focus: StemFocus }) {
  const x0 = 70;
  const x1 = 324;
  const top = 30;
  const laneH = 24;
  const start = x0 + 6;
  const end = x1 - 8;
  const alignOn = focus === 'align';
  const nameOn = focus === 'naming';
  const setOn = focus === 'sets' || focus === 'tracks';
  return (
    <ArtFrame
      h={top + STEMS.length * (laneH + 5) + 26}
      a11y="A stem delivery on a timeline: drums, bass, music, vocals and effects stems, each a file named song, stem, version and date, all starting at the same timestamp and running the same length."
    >
      {Array.from({ length: 9 }, (_, b) => {
        const x = x0 + (b / 8) * (x1 - x0);
        return (
          <G key={b}>
            <Line x1={x} y1={top - 6} x2={x} y2={top + STEMS.length * (laneH + 5)} stroke="#1a1e26" strokeWidth={0.6} />
            {b < 8 && b % 2 === 0 ? (
              <T x={x + 2} y={top - 9} anchor="start" color={ART.inkDim} font={fonts.mono} ls={0}>
                {`${b + 1}`}
              </T>
            ) : null}
          </G>
        );
      })}
      {STEMS.map((s, i) => {
        const y = top + i * (laneH + 5);
        return (
          <G key={s.name}>
            <T x={x0 - 8} y={y + laneH / 2 + 4} anchor="end" color={setOn ? ART.amber : ART.ink}>
              {s.name}
            </T>
            <Rect x={start} y={y} width={end - start} height={laneH} rx={3} fill={s.color} opacity={0.22} stroke={s.color} strokeWidth={0.9} />
            <Rect x={start} y={y} width={end - start} height={5} rx={2} fill={s.color} opacity={0.6} />
            <T x={start + 5} y={y + 17} anchor="start" color={nameOn ? '#ffffff' : ART.ink} font={fonts.barlowSemiBold} ls={0}>
              {`Song_${s.name.charAt(0)}${s.name.slice(1).toLowerCase()}_v3_2026-09-11.wav`}
            </T>
          </G>
        );
      })}
      <Line x1={start} y1={top - 4} x2={start} y2={top + STEMS.length * (laneH + 5)} stroke={alignOn ? ART.amber : '#5d646d'} strokeWidth={alignOn ? 1.6 : 1} strokeDasharray="3 2" />
      <Line x1={end} y1={top - 4} x2={end} y2={top + STEMS.length * (laneH + 5)} stroke={alignOn ? ART.amber : '#5d646d'} strokeWidth={alignOn ? 1.6 : 1} strokeDasharray="3 2" />
      <T x={start} y={top + STEMS.length * (laneH + 5) + 14} anchor="start" color={alignOn ? ART.amber : ART.inkDim} ls={0.6}>
        SAME START
      </T>
      <T x={end} y={top + STEMS.length * (laneH + 5) + 14} anchor="end" color={alignOn ? ART.amber : ART.inkDim} ls={0.6}>
        SAME LENGTH
      </T>
      <T x={x0 - 8} y={top - 9} anchor="end" color={ART.inkDim} ls={0.6}>
        BAR
      </T>
    </ArtFrame>
  );
}

