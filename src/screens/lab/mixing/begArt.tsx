/**
 * Beginning Mixing — the teaching drawings (art fix 2026-10-16, after the
 * lab-art grading: "16 modules teach balance, frequency, pan, depth and
 * movement almost entirely in words + audio A/B. No picture of the stereo
 * field, the spectrum clash, the depth (reverb) or the gain-staging
 * headroom"). Built on the Advanced lab's gear kit (advArt.tsx) so the two
 * labs draw the same desk, the same strips and the same compressor.
 *
 *   MixMapArt      the mix as a stage: every track drawn where the RENDERER
 *                  puts it — side = its pan through the renderer's pan law,
 *                  height = the range it plays in (the session model's own
 *                  low/high Hz), width = its fader level, its outline carved
 *                  by the renderer's own high-pass and EQ biquads, a glow for
 *                  its reverb send. Folds to the centre for the mono check.
 *   PrepArt        a DAW session before / after the prep checklist
 *   FlowArt        the eight stations as gear, in YOUR tap order, then in
 *                  signal order with the cables once solved
 *   HeadroomArt    peak meters: correlated peaks adding (the page's own
 *                  correlatedSumPeakDb) and the A / B renders as measured
 *   CompArt        the snare compressor at the variant's real settings, one
 *                  real snare hit before / after, and the gain it applies
 *                  (the renderer's own detector, keyedGainDb)
 *   SpaceArt       four channels' post-fader sends into ONE plate return
 *   TermsArt       bus · subgroup · aux · control group · VCA · stem, lit
 *                  by the opened term
 *   PrePostArt     the pre and post taps around the fader (sendPathGain)
 *   DoubleRouteArt the channel reaching the mix twice
 *   BounceArt      the bounce dialog with the learner's choices
 *
 * Text floor: drawings are 340 wide (≥ 0.97 px per unit at 390), FS = 10.
 * Labels sit beside objects, never on them; the names live on the gear's own
 * legends (tape, insert slot), where a real desk prints them.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Circle, Defs, G, Line, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { fonts } from '../../../theme/tokens';
import { levelColorForDb } from '../../../features/tools/levelColor';
import { SR } from '../../../features/ear/earDsp';
import { runSoon } from '../../../lib/afterInteractions';
import { ART, ArtFrame, Btn, CompFace, FS, Headphones, Knob, Monitor, Strip, T, Wire, type CompSettings } from './advArt';
import { eqResponseDb, PEAK_RED, type EqBand } from './advPlots';
import { BEAT_S, FLAT, keyedGainDb, kickStemForDrawing, snareStemForDrawing, type MixSettings, type TrackSettings } from './audio/mixAudio';
import { SESSION_TRACKS, TRACK_IDS, correlatedSumPeakDb, track, type DimensionId, type TrackId } from './engine/mixModel';
import { CHANNEL_PATH, type StationId } from './engine/routing';

/* ── shared ──────────────────────────────────────────────────────────────── */

/** One colour per session track, the same on every drawing in the lab. */
export const TRACK_COLOR: Record<TrackId, string> = {
  kick: '#5b8fe0',
  snare: '#c8cfdc',
  perc: '#5fc4c4',
  bass: '#9a7ae0',
  gtr: '#3fae7a',
  keys: '#d07fc0',
  lead: '#e0a94a',
  bgv: '#e07a5f',
};

const db2lin = (db: number) => Math.pow(10, db / 20);
const fmtDb = (db: number) => (db <= -60 ? '−∞' : db > 0 ? `+${db}` : db === 0 ? '0' : `${db}`.replace('-', '−'));

/** The renderer's pan law (cos/sin, −3 dB centre): where a pan puts the
 *  sound between the speakers, −1 (L) … +1 (R), by power. */
function panPosition(pan: number): number {
  const p = Math.max(-100, Math.min(100, pan)) / 100;
  const a = ((p + 1) / 2) * (Math.PI / 2);
  const l = Math.cos(a);
  const r = Math.sin(a);
  return (r * r - l * l) / (l * l + r * r);
}

/** The inserts' combined response at f (the renderer's own biquads). */
function insertResponseDb(s: Partial<TrackSettings>, f: number): number {
  const bands: EqBand[] = [];
  if (s.hpHz && s.hpHz > 0) bands.push({ hpHz: s.hpHz });
  if (s.eq) bands.push({ hz: s.eq.hz, gainDb: s.eq.gainDb, q: s.eq.q ?? 1.4 });
  return bands.length ? eqResponseDb(bands, f) : 0;
}

/* ════ the mix map (pages 1, 5, 6, 7, 8, 13, 15) ══════════════════════════ */

const F_BOT = 30;
const F_TOP = 16000;

export type MapProps = {
  settings: MixSettings;
  /** Folded to mono: every part plays from the centre. */
  mono?: boolean;
  /** The shared reverb is in the render (sends glow). */
  verb?: boolean;
  /** Draw the chorus half of any volume ride (else the verse). */
  chorus?: boolean;
  /** The anchor the learner committed to (ringed). */
  anchor?: TrackId | null;
  /** The tracks the page is about; the rest are drawn faint. */
  only?: readonly TrackId[];
  /** The dimension to name in amber in the key. */
  focus?: DimensionId | null;
  title: string;
  /** Right-hand state word (e.g. STEREO / MONO FOLD). */
  state?: string;
  a11y?: string;
};

type Shape = { id: TrackId; d: string; ghost: string | null; silent: boolean; db: number; send: number | null; pos: number; cx: number };

export function MixMapArt(p: MapProps) {
  const x0 = 46;
  const x1 = 330;
  const yT = 40;
  const yB = 206;
  const pad = 22;
  const yOf = (f: number) => yB - (Math.log(f / F_BOT) / Math.log(F_TOP / F_BOT)) * (yB - yT);
  const xOf = (pos: number) => x0 + pad + ((pos + 1) / 2) * (x1 - x0 - 2 * pad);
  const anySolo = TRACK_IDS.some((id) => !!p.settings[id]?.solo);
  const gid = useMemo(() => `mm${Math.random().toString(36).slice(2, 8)}`, []);

  const shapes: Shape[] = TRACK_IDS.map((id) => {
    const t = track(id);
    const s = { ...FLAT, ...(p.settings[id] ?? {}) };
    const ride = s.auto ? (p.chorus ? s.auto.chorusDb : s.auto.verseDb) : 0;
    const db = Math.min(12, s.faderDb + ride);
    const silent = s.mute || db <= -60 || (anySolo && !s.solo);
    const w = 4 + 18 * Math.pow(10, (silent ? 0 : db) / 40);
    const pos = panPosition(s.pan);
    const outline = (cx: number) => {
      const right: string[] = [];
      const left: string[] = [];
      const N = 72;
      for (let k = 0; k <= N; k++) {
        const f = F_BOT * Math.pow(F_TOP / F_BOT, k / N);
        const oct = f < t.lowHz ? Math.log2(t.lowHz / f) : f > t.highHz ? Math.log2(f / t.highHz) : 0;
        const env = oct >= 0.5 ? 0 : Math.cos((oct / 0.5) * (Math.PI / 2));
        const hw = (w / 2) * env * Math.pow(10, insertResponseDb(s, f) / 40);
        if (hw < 0.25) continue;
        const y = yOf(f).toFixed(1);
        right.push(`${(cx + hw).toFixed(1)} ${y}`);
        left.unshift(`${(cx - hw).toFixed(1)} ${y}`);
      }
      return right.length ? `M ${right.join(' L ')} L ${left.join(' L ')} Z` : '';
    };
    const cx = xOf(p.mono ? 0 : pos);
    return {
      id,
      d: outline(cx),
      ghost: p.mono && Math.abs(pos) > 0.05 && !silent ? outline(xOf(pos)) : null,
      silent,
      db,
      send: p.verb && s.verbSendDb != null && !silent ? s.verbSendDb : null,
      pos,
      cx,
    };
  });
  // Loud parts are drawn first so the quiet ones stay visible on top.
  // The anchor last of all, so its ring is never covered.
  const order = [...shapes].sort((a, b) => (a.id === p.anchor ? 1 : b.id === p.anchor ? -1 : b.db - a.db));
  const key: { dim: DimensionId; text: string }[] = [
    { dim: 'frequency', text: 'HEIGHT = RANGE' },
    { dim: 'balance', text: 'WIDTH = LEVEL' },
    { dim: 'width', text: 'SIDE = PAN' },
    { dim: 'depth', text: 'GLOW = REVERB' },
  ];
  const freqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  return (
    <ArtFrame
      h={282}
      a11y={
        p.a11y ??
        `${p.title}. ${shapes
          .map((s) => `${track(s.id).name} ${s.silent ? 'silent' : `${fmtDb(Math.round(s.db))} dB, ${Math.abs(s.pos) < 0.05 || p.mono ? 'centre' : `${Math.round(Math.abs(s.pos) * 100)} % ${s.pos < 0 ? 'left' : 'right'}`}${s.send != null ? ', in the reverb' : ''}`}`)
          .join('; ')}.`
      }
    >
      <Defs>
        {TRACK_IDS.map((id) => (
          <LinearGradient key={id} id={`${gid}${id}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={TRACK_COLOR[id]} stopOpacity={0.3} />
            <Stop offset="0.5" stopColor={TRACK_COLOR[id]} stopOpacity={0.62} />
            <Stop offset="1" stopColor={TRACK_COLOR[id]} stopOpacity={0.3} />
          </LinearGradient>
        ))}
      </Defs>
      <T x={12} y={16} anchor="start" color={ART.ink} ls={1}>
        {p.title}
      </T>
      {p.state ? (
        <T x={328} y={16} anchor="end" color={p.mono ? ART.amber : ART.inkDim} ls={0.8}>
          {p.state}
        </T>
      ) : null}
      {/* the stage: L · C · R across, the spectrum up */}
      <Rect x={x0} y={yT} width={x1 - x0} height={yB - yT} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      {freqs.map((f) => (
        <G key={f}>
          <Line x1={x0} y1={yOf(f)} x2={x1} y2={yOf(f)} stroke={f === 100 || f === 1000 || f === 10000 ? '#1f2430' : '#151922'} strokeWidth={0.6} />
          <T x={x0 - 4} y={yOf(f) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
            {f >= 1000 ? `${f / 1000}k` : `${f}`}
          </T>
        </G>
      ))}
      <T x={x0 - 4} y={yT - 6} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
        Hz
      </T>
      <Line x1={xOf(0)} y1={yT} x2={xOf(0)} y2={yB} stroke="#2a3040" strokeWidth={0.8} strokeDasharray="2 3" />
      <T x={xOf(-1)} y={yT - 6} color={ART.ink}>
        L
      </T>
      <T x={xOf(0)} y={yT - 6} color={ART.ink}>
        C
      </T>
      <T x={xOf(1)} y={yT - 6} color={ART.ink}>
        R
      </T>
      {/* reverb glow, behind everything */}
      {order.map((s) =>
        s.send != null && s.d ? (
          <Path key={`v${s.id}`} d={s.d} fill="none" stroke={TRACK_COLOR[s.id]} strokeWidth={5 + 9 * Math.pow(10, Math.min(6, s.send) / 40)} strokeLinejoin="round" opacity={0.16} />
        ) : null,
      )}
      {/* where each part sat in stereo (mono fold) */}
      {order.map((s) => (s.ghost ? <Path key={`g${s.id}`} d={s.ghost} fill="none" stroke={TRACK_COLOR[s.id]} strokeWidth={0.8} strokeDasharray="2 2" opacity={0.6} /> : null))}
      {order.map((s) =>
        s.d ? (
          <Path
            key={s.id}
            d={s.d}
            fill={s.silent ? 'none' : `url(#${gid}${s.id})`}
            stroke={TRACK_COLOR[s.id]}
            strokeWidth={p.anchor === s.id ? 2.4 : 1}
            strokeDasharray={s.silent ? '3 2.5' : undefined}
            fillOpacity={p.anchor === s.id ? 0.55 : 1}
            opacity={(s.silent ? 0.55 : 1) * (p.only && !p.only.includes(s.id) ? 0.3 : 1)}
            strokeLinejoin="round"
          />
        ) : null,
      )}
      {/* legend: one swatch per track with its level — names never on the shapes */}
      {SESSION_TRACKS.map((t, i) => {
        const s = shapes[i];
        const col = i % 4;
        const row = Math.floor(i / 4);
        const lx = 14 + col * 80;
        const ly = 228 + row * 17;
        return (
          <G key={t.id}>
            <Rect x={lx} y={ly - 8} width={9} height={9} rx={1.5} fill={s.silent ? 'none' : TRACK_COLOR[t.id]} stroke={TRACK_COLOR[t.id]} strokeWidth={1} strokeDasharray={s.silent ? '2 1.5' : undefined} opacity={s.silent ? 0.7 : 0.9} />
            <T x={lx + 13} y={ly} anchor="start" color={p.anchor === t.id ? ART.amber : ART.ink} ls={0.4}>
              {t.name}
            </T>
            <T x={lx + 74} y={ly} anchor="end" color={s.silent ? ART.inkDim : ART.ink} font={fonts.mono} ls={0}>
              {s.silent ? 'OFF' : fmtDb(Math.round(s.db))}
            </T>
          </G>
        );
      })}
      {/* the encoding key — the four dimensions a still picture can hold */}
      {key.map((k, i) => (
        <T key={k.dim} x={52 + i * 80} y={272} color={p.focus === k.dim ? ART.amber : ART.inkDim} ls={0.4}>
          {k.text}
        </T>
      ))}
    </ArtFrame>
  );
}

/* ════ page 2 · the session before / after prep ═══════════════════════════ */

type PrepRow = { before: string; after: string; color: string; junk?: boolean; clips: readonly { x: number; w: number; g: number }[] };

/** A DAW arrange window (track headers left, regions on the timeline). */
export function PrepArt({ opened }: { opened: ReadonlySet<string> }) {
  const named = opened.has('names');
  const clean = opened.has('cleanup');
  const clip = opened.has('clipgain');
  const phase = opened.has('phase');
  const head = opened.has('headroom');
  const refs = opened.has('refs');
  const version = opened.has('version');
  // Clip-gain values per region (dB) before levelling; after, all near 0.
  const rows: PrepRow[] = [
    { before: 'Audio_07', after: 'KICK', color: TRACK_COLOR.kick, clips: [{ x: 0, w: 1, g: 0 }] },
    { before: 'Audio_02', after: 'SNARE', color: TRACK_COLOR.snare, clips: [{ x: 0, w: 1, g: 0 }] },
    { before: 'bss_DI_new', after: 'BASS', color: TRACK_COLOR.bass, clips: [{ x: 0, w: 1, g: 0 }] },
    { before: 'gtr_take4_FINAL', after: 'GTR', color: TRACK_COLOR.gtr, clips: [{ x: 0, w: 0.48, g: 0 }, { x: 0.52, w: 0.48, g: 0 }] },
    { before: 'Audio_11', after: 'LEAD', color: TRACK_COLOR.lead, clips: [{ x: 0.04, w: 0.42, g: -9 }, { x: 0.52, w: 0.44, g: 0 }] },
    { before: 'Audio_12 (dup)', after: '', color: '#6c707a', junk: true, clips: [{ x: 0.06, w: 0.24, g: 0 }] },
  ];
  const shown = rows.filter((r) => !(clean && r.junk));
  const tlX0 = 140;
  const tlX1 = 286;
  const top = 44;
  const rowH = 26;
  const masterPk = head ? -6 : -0.2;
  const y0 = top + shown.length * rowH;
  return (
    <ArtFrame
      h={y0 + (refs ? 52 : 18) + 4}
      a11y={`A DAW session window. ${named ? 'Tracks are named KICK, SNARE, BASS, GTR, LEAD and coloured' : 'Tracks are still called Audio_07, Audio_02 and so on'}. ${clean ? 'The unused duplicate track with its cough clip is gone.' : 'An unused duplicate track with a cough clip is still there.'} ${clip ? 'The quiet verse clip on the lead is lifted by clip gain to match the chorus.' : 'The lead verse clip sits 9 dB under the chorus clip.'} ${phase ? 'The kick polarity was checked.' : ''} The master meter peaks at ${masterPk} dBFS. ${refs ? 'Two reference tracks sit below, muted.' : ''}`}
    >
      {/* title bar */}
      <Rect x={1} y={1} width={338} height={20} rx={9} fill="#1b1d23" />
      <Rect x={1} y={11} width={338} height={10} fill="#1b1d23" />
      {[0, 1, 2].map((i) => (
        <Circle key={i} cx={12 + i * 11} cy={11} r={3.2} fill={['#ff5f57', '#febc2e', '#28c840'][i]} opacity={0.75} />
      ))}
      <T x={170} y={15} color={ART.ink} ls={0.4}>
        {version ? 'OurSong_Mix_v1 · untouched copy saved' : 'OurSong_Mix'}
      </T>
      {/* bar ruler */}
      {[0, 1, 2, 3, 4].map((b) => (
        <G key={b}>
          <Line x1={tlX0 + (b / 4) * (tlX1 - tlX0)} y1={26} x2={tlX0 + (b / 4) * (tlX1 - tlX0)} y2={y0} stroke="#1f2430" strokeWidth={0.6} />
          {b < 4 ? (
            <T x={tlX0 + (b / 4) * (tlX1 - tlX0) + 3} y={36} anchor="start" color={ART.inkDim} font={fonts.mono} ls={0}>
              {`${b + 1}`}
            </T>
          ) : null}
        </G>
      ))}
      {shown.map((r, i) => {
        const y = top + i * rowH;
        const color = named ? r.color : '#6c707a';
        return (
          <G key={r.before}>
            <Rect x={6} y={y + 1} width={108} height={rowH - 2} rx={2} fill="#16181d" stroke="#262a32" strokeWidth={0.6} />
            <Rect x={6} y={y + 1} width={4} height={rowH - 2} rx={1} fill={color} />
            <T x={15} y={y + rowH / 2 + 3.5} anchor="start" color={named ? ART.ink : ART.inkDim} font={named ? fonts.oswaldMedium : fonts.mono} ls={named ? 0.6 : 0}>
              {named && r.after ? r.after : r.before}
            </T>
            {/* polarity (Ø) button on the kick header, its legend beside it */}
            {i === 0 ? (
              <G>
                <Btn x={102} y={y + 8} s={9} lit={phase ? ART.amber : null} />
                <T x={98} y={y + rowH / 2 + 3.5} anchor="end" color={phase ? ART.amber : ART.inkDim} font={fonts.mono} ls={0}>
                  Ø
                </T>
              </G>
            ) : null}
            {r.clips.map((c, k) => {
              const g = clip ? 0 : c.g;
              const cx0 = tlX0 + c.x * (tlX1 - tlX0);
              const cw = c.w * (tlX1 - tlX0);
              // the clip-gain line: 0 dB in the middle of the region, ±12 dB to its edges
              const gy = y + rowH / 2 - (g / 12) * ((rowH - 8) / 2);
              return (
                <G key={k}>
                  <Rect x={cx0} y={y + 3} width={cw} height={rowH - 6} rx={2} fill={color} opacity={r.junk && !clean ? 0.25 : 0.32} stroke={color} strokeWidth={0.7} />
                  <Line x1={cx0 + 2} y1={gy} x2={cx0 + cw - 2} y2={gy} stroke="#f4f4f6" strokeWidth={0.9} opacity={0.85} />
                  <Circle cx={cx0 + cw / 2} cy={gy} r={1.8} fill="#f4f4f6" />
                  {r.junk ? (
                    <T x={cx0 + 4} y={y + 11} anchor="start" color={ART.ink} font={fonts.mono} ls={0}>
                      cough
                    </T>
                  ) : null}
                </G>
              );
            })}
            {r.clips.some((c) => c.g !== 0) ? (
              <T x={tlX1 + 4} y={y + rowH / 2 + 3.5} anchor="start" color={clip ? ART.green : ART.amber} font={fonts.mono} ls={0}>
                {clip ? 'LEVEL' : '−9 dB'}
              </T>
            ) : null}
          </G>
        );
      })}
      {/* the master peak meter, beside the timeline */}
      <Rect x={322} y={top} width={10} height={y0 - top} rx={2} fill="#0b0c10" stroke="#232833" strokeWidth={0.6} />
      <Rect x={323} y={top + 1 + (1 - (masterPk + 48) / 48) * (y0 - top - 2)} width={8} height={((masterPk + 48) / 48) * (y0 - top - 2)} rx={1} fill={levelColorForDb(masterPk, -48, 0)} />
      <T x={337} y={36} anchor="end" color={ART.inkDim} ls={0.3}>
        MASTER
      </T>
      <T x={327} y={y0 + 13} color={masterPk > -1 ? PEAK_RED : ART.ink} font={fonts.mono} ls={0}>
        {`${masterPk}`.replace('-', '−')}
      </T>
      {refs ? (
        <G>
          {['REF 1', 'REF 2'].map((n, i) => (
            <G key={n}>
              <Rect x={6} y={y0 + 6 + i * 22} width={108} height={20} rx={2} fill="#16181d" stroke="#3a3420" strokeWidth={0.6} />
              <T x={15} y={y0 + 20 + i * 22} anchor="start" color={ART.amber} ls={0.6}>
                {`${n} · MUTED`}
              </T>
              <Rect x={tlX0} y={y0 + 8 + i * 22} width={tlX1 - tlX0} height={16} rx={2} fill="#3a3420" opacity={0.6} />
            </G>
          ))}
        </G>
      ) : null}
    </ArtFrame>
  );
}

/* ════ page 3 · the eight stations as gear ════════════════════════════════ */

/** Min/max per column of the first beat of the real kick stem. */
function useKickColumns(cols: number): { lo: Float32Array; hi: Float32Array } | null {
  const [d, setD] = useState<{ lo: Float32Array; hi: Float32Array } | null>(null);
  useEffect(() => {
    const h = runSoon(() => {
      const n = Math.round(BEAT_S * 4 * SR);
      const k = kickStemForDrawing().subarray(0, n);
      const lo = new Float32Array(cols);
      const hi = new Float32Array(cols);
      const per = n / cols;
      for (let c = 0; c < cols; c++) {
        let a = 0;
        let b = 0;
        for (let i = Math.floor(c * per); i < Math.floor((c + 1) * per); i++) {
          if (k[i] < a) a = k[i];
          if (k[i] > b) b = k[i];
        }
        lo[c] = a;
        hi[c] = b;
      }
      setD({ lo, hi });
    });
    return () => h.cancel();
  }, [cols]);
  return d;
}

function ClipRegion({ x, y, w, h, wave, gainDb, handle }: { x: number; y: number; w: number; h: number; wave: { lo: Float32Array; hi: Float32Array } | null; gainDb: number; handle?: boolean }) {
  const mid = y + h / 2;
  const g = db2lin(gainDb);
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={2} fill="#1d2a3f" stroke={TRACK_COLOR.kick} strokeWidth={0.7} />
      {wave
        ? Array.from(wave.hi).map((hi, c) => {
            const lo = wave.lo[c];
            const pk = Math.max(Math.abs(lo), Math.abs(hi)) * g;
            if (pk < 0.01) return null;
            return <Line key={c} x1={x + 1 + c + 0.5} y1={mid - Math.min(1, hi * g) * (h / 2 - 2)} x2={x + 1 + c + 0.5} y2={mid - Math.max(-1, lo * g) * (h / 2 - 2)} stroke={levelColorForDb(20 * Math.log10(pk), -48, 0)} strokeWidth={1} />;
          })
        : null}
      {handle ? (
        <G>
          <Line x1={x + 2} y1={mid - (gainDb / 12) * (h / 2 - 2)} x2={x + w - 2} y2={mid - (gainDb / 12) * (h / 2 - 2)} stroke="#f4f4f6" strokeWidth={0.9} />
          <Circle cx={x + w / 2} cy={mid - (gainDb / 12) * (h / 2 - 2)} r={2} fill="#f4f4f6" />
        </G>
      ) : null}
    </G>
  );
}

const TILE_W = 72;
const TILE_H = 64;

/** Each station's small drawing, centred in its tile. */
function StationGear({ id, x, y, wave, lit }: { id: StationId; x: number; y: number; wave: { lo: Float32Array; hi: Float32Array } | null; lit: boolean }) {
  const cx = x + TILE_W / 2;
  const o = lit ? 1 : 0.5;
  let body: ReactNode = null;
  switch (id) {
    case 'source':
      body = <ClipRegion x={x + 6} y={y + 18} w={60} h={30} wave={wave} gainDb={0} />;
      break;
    case 'clipgain':
      body = <ClipRegion x={x + 6} y={y + 18} w={60} h={30} wave={wave} gainDb={4} handle />;
      break;
    case 'inserts':
      body = (
        <G>
          {['EQ', 'COMP'].map((n, k) => (
            <G key={n}>
              <Rect x={x + 9} y={y + 14 + k * 18} width={54} height={14} rx={2} fill="#2a2210" stroke={ART.amber} strokeWidth={0.9} />
              <T x={cx} y={y + 25 + k * 18} color={ART.amber} ls={0.3}>
                {n}
              </T>
            </G>
          ))}
        </G>
      );
      break;
    case 'fader': {
      const fx = x + 50;
      return (
        <G opacity={o}>
          <Knob cx={x + 22} cy={y + 30} r={8} frac={0.62} cap="#4a4f5a" detent />
          <Rect x={fx - 1.3} y={y + 10} width={2.6} height={44} rx={1.3} fill={ART.groove} />
          <Rect x={fx - 8} y={y + 22} width={16} height={8} rx={1.3} fill="#8d9099" stroke="#0b0b0d" strokeWidth={0.5} />
          <Line x1={fx - 7} y1={y + 26} x2={fx + 7} y2={y + 26} stroke="#f4f4f6" strokeWidth={0.8} />
        </G>
      );
    }
    case 'sends':
      body = (
        <G>
          <Knob cx={x + 20} cy={y + 32} r={8} frac={0.55} cap="#2f8f63" />
          <Wire pts={[{ x: x + 30, y: y + 32 }, { x: x + 66, y: y + 32 }]} color="#3fae7a" />
          <T x={x + 50} y={y + 26} color="#3fae7a" ls={0.3}>
            COPY
          </T>
        </G>
      );
      break;
    case 'bus':
      body = (
        <G>
          {[-8, 0, 8].map((d) => (
            <Wire key={d} pts={[{ x: cx + d, y: y + 10 }, { x: cx + d, y: y + 22 }]} />
          ))}
          <Rect x={cx - 16} y={y + 22} width={32} height={30} rx={3} fill={ART.panel} stroke="#3e6fb8" strokeWidth={1} />
          <Rect x={cx - 7} y={y + 32} width={14} height={7} rx={1.3} fill="#3e6fb8" />
        </G>
      );
      break;
    case 'mixbus':
      body = (
        <G>
          <Rect x={cx - 16} y={y + 12} width={32} height={40} rx={3} fill={ART.panel} stroke="#c4372a" strokeWidth={1} />
          <Rect x={cx - 1.3} y={y + 16} width={2.6} height={32} rx={1.3} fill={ART.groove} />
          <Rect x={cx - 7} y={y + 24} width={14} height={7} rx={1.3} fill="#c4372a" />
          <T x={cx - 22} y={y + 36} anchor="end" color={ART.inkDim}>
            L
          </T>
          <T x={cx + 22} y={y + 36} anchor="start" color={ART.inkDim}>
            R
          </T>
        </G>
      );
      break;
    case 'output':
      body = (
        <G>
          <Monitor x={x + 11} y={y + 12} w={22} />
          <Monitor x={x + 39} y={y + 12} w={22} />
        </G>
      );
      break;
  }
  return <G opacity={o}>{body}</G>;
}

/**
 * The parts bin, then the path. Unsolved: the eight stations as gear in the
 * SAME shuffled order as the buttons, each lit with the learner's tap number
 * as it is placed (the drawing never gives the order away). Solved: the same
 * gear in signal order, two rows, with the cable running through.
 */
export function FlowArt({ shuffled, placed, solved }: { shuffled: readonly StationId[]; placed: readonly StationId[]; solved: boolean }) {
  const wave = useKickColumns(58);
  const order = solved ? CHANNEL_PATH.map((s) => s.id) : shuffled;
  const pos = (i: number) => ({ x: 6 + (i % 4) * 82, y: 30 + Math.floor(i / 4) * 96 });
  const name = (id: StationId) => CHANNEL_PATH.find((s) => s.id === id)!.name;
  return (
    <ArtFrame
      h={224}
      a11y={
        solved
          ? `The channel path as gear, in signal order: ${CHANNEL_PATH.map((s, i) => `${i + 1} ${s.name}`).join(', ')}, joined by one cable.`
          : `The eight stations as gear, in no particular order. ${placed.length ? `You have placed ${placed.map((p) => name(p)).join(', then ')}.` : 'None placed yet.'}`
      }
    >
      <T x={12} y={16} anchor="start" color={solved ? ART.green : ART.ink} ls={1}>
        {solved ? 'THE PATH — SIGNAL ORDER' : 'THE PARTS — YOUR ORDER SO FAR'}
      </T>
      {solved
        ? order.map((_, i) => {
            if (i === order.length - 1) return null;
            const a = pos(i);
            const b = pos(i + 1);
            const ay = a.y + 32;
            if (i % 4 === 3) {
              // end of row 1 → start of row 2, down the right edge and back along the gap
              return <Wire key={i} pts={[{ x: a.x + TILE_W, y: ay }, { x: 336, y: ay }, { x: 336, y: a.y + TILE_H + 22 }, { x: b.x + TILE_W / 2, y: a.y + TILE_H + 22 }, { x: b.x + TILE_W / 2, y: b.y }]} color={ART.green} />;
            }
            return <Wire key={i} pts={[{ x: a.x + TILE_W - 2, y: ay }, { x: b.x + 2, y: b.y + 32 }]} color={ART.green} />;
          })
        : null}
      {order.map((id, i) => {
        const { x, y } = pos(i);
        const k = solved ? i : placed.indexOf(id);
        const lit = solved || k >= 0;
        return (
          <G key={id}>
            <Rect x={x} y={y} width={TILE_W} height={TILE_H} rx={4} fill="#13151a" stroke={lit ? (solved ? '#2c5a3e' : ART.amber) : '#232833'} strokeWidth={lit ? 1 : 0.7} />
            <StationGear id={id} x={x} y={y} wave={wave} lit={lit} />
            {k >= 0 ? (
              <G>
                <Circle cx={x + 9} cy={y + 9} r={7} fill={solved ? '#173524' : '#2a2210'} stroke={solved ? ART.green : ART.amber} strokeWidth={0.9} />
                <T x={x + 9} y={y + 12.5} color={solved ? ART.green : ART.amber} font={fonts.mono} ls={0}>
                  {`${k + 1}`}
                </T>
              </G>
            ) : null}
            <T x={x + TILE_W / 2} y={y + TILE_H + 13} color={lit ? ART.ink : ART.inkDim} ls={0.4}>
              {name(id)}
            </T>
          </G>
        );
      })}
    </ArtFrame>
  );
}

/* ════ page 4 · headroom ══════════════════════════════════════════════════ */

const M_LO = -36;
const M_HI = 12;

function PeakLadder({ x, y, h, db, rmsDb, name, sub }: { x: number; y: number; h: number; db: number | null; rmsDb?: number | null; name: string; sub: string }) {
  const segs = 24;
  const yOf = (v: number) => y + h - ((Math.max(M_LO, Math.min(M_HI, v)) - M_LO) / (M_HI - M_LO)) * h;
  // A sum that lands ON the ceiling (−6.02 dB ×2 = 0.0) is not an over:
  // the clip LED lights only past it.
  const over = db != null && db > 0.05;
  return (
    <G>
      <Rect x={x} y={y} width={18} height={h} rx={2} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      {Array.from({ length: segs }, (_, i) => {
        const v0 = M_LO + (i / segs) * (M_HI - M_LO);
        const on = db != null && v0 < db - 0.05;
        const segH = h / segs;
        return <Rect key={i} x={x + 2} y={y + h - (i + 1) * segH + 0.6} width={14} height={segH - 1.2} rx={0.8} fill={on ? (v0 >= 0 ? PEAK_RED : levelColorForDb(v0, M_LO, 0)) : '#15171c'} />;
      })}
      {rmsDb != null ? <Line x1={x - 3} y1={yOf(rmsDb)} x2={x + 21} y2={yOf(rmsDb)} stroke="#f4f4f6" strokeWidth={1.2} /> : null}
      {/* clip LED */}
      <Circle cx={x + 9} cy={y - 8} r={4} fill={over ? PEAK_RED : '#2a1514'} stroke="#060607" strokeWidth={0.5} />
      <T x={x + 9} y={y + h + 14} color={over ? PEAK_RED : ART.ink} font={fonts.mono} ls={0}>
        {db == null ? '—' : Math.abs(db) < 0.05 ? '0.0' : `${db > 0 ? '+' : ''}${db.toFixed(1)}`.replace('-', '−')}
      </T>
      <T x={x + 9} y={y + h + 28} color={ART.ink} ls={0.4}>
        {name}
      </T>
      <T x={x + 9} y={y + h + 41} color={ART.inkDim} ls={0.3}>
        {sub}
      </T>
    </G>
  );
}

/** Left: identical −6 dB peaks landing together (correlatedSumPeakDb).
 *  Right: the page's A / B renders as measured (peak bars, RMS tick). */
export function HeadroomArt({ measured }: { measured: Record<string, { peakDb: number; rmsDb: number }> }) {
  const y = 44;
  const h = 150;
  const yOf = (v: number) => y + h - ((v - M_LO) / (M_HI - M_LO)) * h;
  const one = -6;
  const two = correlatedSumPeakDb(-6, 2);
  const four = correlatedSumPeakDb(-6, 4);
  const a = measured.a;
  const b = measured.b;
  return (
    <ArtFrame
      h={246}
      a11y={`Peak meters in dBFS. One track peaking at −6. Two identical −6 dB peaks landing together reach ${two.toFixed(1)}, right at the ceiling. Four reach +${four.toFixed(1)}: clipped, the red LED lit. ${a && b ? `Measured: mix A peaks at ${a.peakDb.toFixed(1)} dBFS, mix B at ${b.peakDb.toFixed(1)}, ${(b.rmsDb - a.rmsDb).toFixed(1)} dB louder.` : 'Mix A and B appear once played.'}`}
    >
      <T x={12} y={16} anchor="start" color={ART.ink} ls={1}>
        PEAK METERS · dBFS
      </T>
      {/* the ceiling across the whole drawing */}
      {[0, -12, -24, -36].map((v) => (
        <G key={v}>
          <Line x1={30} y1={yOf(v)} x2={330} y2={yOf(v)} stroke={v === 0 ? '#5a2a26' : '#1a1e26'} strokeWidth={v === 0 ? 1 : 0.6} strokeDasharray={v === 0 ? undefined : '2 3'} />
          <T x={26} y={yOf(v) + 3.5} anchor="end" color={v === 0 ? PEAK_RED : ART.inkDim} font={fonts.mono} ls={0}>
            {v === 0 ? '0' : `${v}`.replace('-', '−')}
          </T>
        </G>
      ))}
      <T x={26} y={yOf(12) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
        +12
      </T>
      <PeakLadder x={46} y={y} h={h} db={one} name="1 TRACK" sub="−6 PEAK" />
      <PeakLadder x={100} y={y} h={h} db={two} name="2 AT ONCE" sub="AT 0 dBFS" />
      <PeakLadder x={154} y={y} h={h} db={four} name="4 AT ONCE" sub="CLIPPED" />
      <Line x1={202} y1={30} x2={202} y2={226} stroke="#232833" strokeWidth={0.8} />
      <PeakLadder x={228} y={y} h={h} db={a ? a.peakDb : null} rmsDb={a?.rmsDb} name="MIX A" sub={a ? 'MEASURED' : 'PLAY IT'} />
      <PeakLadder x={288} y={y} h={h} db={b ? b.peakDb : null} rmsDb={b?.rmsDb} name="MIX B" sub={b ? (a ? `+${(b.rmsDb - a.rmsDb).toFixed(1)} dB` : 'MEASURED') : 'PLAY IT'} />
      <T x={268} y={30} color={ART.inkDim} ls={0.4}>
        BAR = PEAK · TICK = RMS
      </T>
    </ArtFrame>
  );
}

/* ════ page 9 · the snare compressor ══════════════════════════════════════ */

type HitData = { dry: { lo: Float32Array; hi: Float32Array }; wet: { lo: Float32Array; hi: Float32Array }; gr: Float32Array };

const HIT_S = 0.2;
const HIT_COLS = 280;

function hitData(c: CompSettings): HitData {
  const snare = snareStemForDrawing();
  const g = keyedGainDb(snare, c.ratio, c.thresholdDb, c.attackMs, c.releaseMs);
  // earDsp.compress RMS-matches its output to its input over the whole stem.
  let e0 = 0;
  let e1 = 0;
  for (let i = 0; i < snare.length; i++) {
    const v = snare[i];
    const w = v * db2lin(g[i]);
    e0 += v * v;
    e1 += w * w;
  }
  const k = Math.sqrt(e0 / Math.max(e1, 1e-18));
  const start = Math.round((BEAT_S - 0.01) * SR);
  const n = Math.round(HIT_S * SR);
  const per = n / HIT_COLS;
  const mk = () => ({ lo: new Float32Array(HIT_COLS), hi: new Float32Array(HIT_COLS) });
  const dry = mk();
  const wet = mk();
  const gr = new Float32Array(HIT_COLS);
  for (let col = 0; col < HIT_COLS; col++) {
    let gm = 0;
    for (let i = start + Math.floor(col * per); i < start + Math.floor((col + 1) * per); i++) {
      const v = snare[i];
      const w = v * db2lin(g[i]) * k;
      if (v < dry.lo[col]) dry.lo[col] = v;
      if (v > dry.hi[col]) dry.hi[col] = v;
      if (w < wet.lo[col]) wet.lo[col] = w;
      if (w > wet.hi[col]) wet.hi[col] = w;
      if (g[i] < gm) gm = g[i];
    }
    gr[col] = gm;
  }
  // One scale for both traces (the matched hit can peak above the dry one).
  let pk = 1e-6;
  for (let c = 0; c < HIT_COLS; c++) pk = Math.max(pk, -dry.lo[c], dry.hi[c], -wet.lo[c], wet.hi[c]);
  for (const t of [dry, wet])
    for (let c = 0; c < HIT_COLS; c++) {
      t.lo[c] /= pk;
      t.hi[c] /= pk;
    }
  return { dry, wet, gr };
}

export function CompArt({ settings }: { settings: CompSettings | null }) {
  const [data, setData] = useState<HitData | null>(null);
  const key = settings ? `${settings.attackMs}|${settings.ratio}|${settings.thresholdDb}|${settings.releaseMs}` : 'off';
  useEffect(() => {
    if (!settings) {
      setData(null);
      return;
    }
    const h = runSoon(() => setData(hitData(settings)));
    return () => h.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the values
  }, [key]);
  const [dryOnly, setDryOnly] = useState<HitData['dry'] | null>(null);
  useEffect(() => {
    const h = runSoon(() => setDryOnly(hitData({ thresholdDb: 0, ratio: 1, attackMs: 1, releaseMs: 10 }).dry));
    return () => h.cancel();
  }, []);
  const x0 = 40;
  const lane = { y: 110, h: 84 };
  const grLane = { y: 222, h: 40 };
  const mid = lane.y + lane.h / 2;
  const dry = data?.dry ?? dryOnly;
  const GR_FLOOR = -18;
  const gy = (db: number) => grLane.y + (Math.max(GR_FLOOR, Math.min(0, db)) / GR_FLOOR) * grLane.h;
  let grPath = '';
  for (let c = 0; c < HIT_COLS; c++) grPath += `${c === 0 ? 'M' : 'L'} ${(x0 + c).toFixed(1)} ${gy(settings && data ? data.gr[c] : 0).toFixed(1)} `;
  const deepest = settings && data ? Math.min(...Array.from(data.gr)) : 0;
  const tx = (ms: number) => x0 + ((ms + 10) / (HIT_S * 1000)) * HIT_COLS;
  return (
    <ArtFrame
      h={298}
      a11y={
        settings
          ? `The snare compressor: threshold ${settings.thresholdDb} dB, ${settings.ratio} to 1, attack ${settings.attackMs} milliseconds, release ${settings.releaseMs}. One real snare hit, dry in grey and compressed in amber, level-matched: ${settings.attackMs < 5 ? 'the fast attack clamps the front of the hit, so the crack is flattened' : 'the slow attack lets the first crack through before the gain comes down on the body'}. The gain reduction dips up to ${Math.round(-deepest)} dB.`
          : 'The snare compressor, bypassed. One real snare hit, dry; the gain line is flat at 0 dB.'
      }
    >
      <CompFace x={40} y={22} w={292} settings={settings} title="SNARE COMPRESSOR" />
      <Rect x={x0} y={lane.y} width={HIT_COLS} height={lane.h} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      <Line x1={x0} y1={mid} x2={x0 + HIT_COLS} y2={mid} stroke="#2f74ff" strokeWidth={0.6} opacity={0.5} />
      {settings && data
        ? Array.from(data.wet.hi).map((hi, c) => {
            const lo = data.wet.lo[c];
            if (Math.max(hi, -lo) < 0.003) return null;
            return <Line key={`w${c}`} x1={x0 + c + 0.5} y1={mid - hi * (lane.h / 2)} x2={x0 + c + 0.5} y2={mid - lo * (lane.h / 2)} stroke={ART.amber} strokeWidth={1} opacity={0.85} />;
          })
        : null}
      {dry
        ? Array.from(dry.hi).map((hi, c) => {
            const lo = dry.lo[c];
            if (Math.max(hi, -lo) < 0.003) return null;
            return <Line key={`d${c}`} x1={x0 + c + 0.5} y1={mid - hi * (lane.h / 2)} x2={x0 + c + 0.5} y2={mid - lo * (lane.h / 2)} stroke={settings ? '#b9c0cc' : '#8b929c'} strokeWidth={1} opacity={settings ? 0.6 : 1} />;
          })
        : null}
      <T x={x0 - 4} y={mid + 3.5} anchor="end" color={ART.ink}>
        HIT
      </T>
      <T x={x0 + HIT_COLS} y={lane.y - 5} anchor="end" color={settings ? ART.amber : ART.inkDim} ls={0.4}>
        {settings ? 'GREY = DRY (ON TOP) · AMBER = COMPRESSED, MATCHED' : 'ONE REAL SNARE HIT, DRY'}
      </T>
      {/* gain the compressor applies */}
      <Rect x={x0} y={grLane.y} width={HIT_COLS} height={grLane.h} fill="#0b0c10" stroke="#232833" strokeWidth={0.7} />
      {[0, -6, -12, -18].map((db) => (
        <T key={db} x={x0 - 4} y={gy(db) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
          {db === 0 ? '0' : `${db}`.replace('-', '−')}
        </T>
      ))}
      <Path d={grPath} stroke={settings ? ART.amber : ART.wire} strokeWidth={1.5} fill="none" />
      <T x={x0 + 2} y={grLane.y - 5} anchor="start" color={settings ? ART.amber : ART.ink} ls={0.4}>
        {settings ? `GAIN, dB — DOWN ${Math.round(-deepest)} dB AT MOST` : 'GAIN, dB — FLAT'}
      </T>
      {[0, 50, 100, 150].map((ms) => (
        <G key={ms}>
          <Line x1={tx(ms)} y1={grLane.y + grLane.h} x2={tx(ms)} y2={grLane.y + grLane.h + 4} stroke={ART.inkDim} strokeWidth={0.7} />
          <T x={tx(ms)} y={grLane.y + grLane.h + 15} color={ART.inkDim} font={fonts.mono} ls={0}>
            {ms === 150 ? '150 ms' : `${ms}`}
          </T>
        </G>
      ))}
    </ArtFrame>
  );
}

/* ════ page 10 · one shared room ══════════════════════════════════════════ */

const SEND_LO = -30;
const SEND_HI = 6;
const sendFrac = (db: number | undefined) => (db == null ? 0 : Math.max(0, Math.min(1, (db - SEND_LO) / (SEND_HI - SEND_LO))));

export function SpaceArt({ settings, on }: { settings: MixSettings; on: boolean }) {
  const ids: TrackId[] = ['lead', 'snare', 'gtr', 'keys', 'bgv'];
  const sw = 44;
  const strips = ids.map((id, i) => ({ id, x: 10 + i * 50, y: 26, w: sw, h: 150 }));
  const sendY = 26 + 5 + 6.5; // the first knob below the (absent) inserts
  const busY = 196;
  const plate = { x: 266, y: 26, w: 64, h: 150 };
  const pins = [-20, -10, 0, 10, 20];
  return (
    <ArtFrame
      h={262}
      a11y={`Five channel strips with one green send knob each, wired to a single plate reverb return. ${on ? ids.map((id) => `${track(id).name} send ${settings[id]?.verbSendDb == null ? 'off' : `${fmtDb(settings[id]!.verbSendDb!)} dB`}`).join(', ') : 'Every send is off: bone dry.'}. The return feeds the mix bus beside the channels' own outputs.`}
    >
      {strips.map((s, i) => {
        const v = on ? settings[s.id]?.verbSendDb : undefined;
        const live = v != null;
        const lane = busY + 8 + i * 3;
        return (
          <G key={`w${s.id}`}>
            {/* send cable: from the knob, under the strips, up into the plate's own pin */}
            <Wire
              pts={[
                { x: s.x + s.w, y: sendY + 1 },
                { x: s.x + s.w + 3, y: sendY + 1 },
                { x: s.x + s.w + 3, y: lane },
                { x: plate.x + plate.w / 2 + pins[i], y: lane },
                { x: plate.x + plate.w / 2 + pins[i], y: plate.y + plate.h },
              ]}
              color={live ? '#3fae7a' : ART.wireDim}
              width={live ? 1.5 : 1}
              dashed={!live}
            />
          </G>
        );
      })}
      {strips.map((s) => {
        const v = on ? settings[s.id]?.verbSendDb : undefined;
        return (
          <G key={s.id}>
            <Strip x={s.x} y={s.y} w={s.w} h={s.h} name={track(s.id).name} db={settings[s.id]?.faderDb ?? 0} sends={[{ frac: sendFrac(v), cap: '#2f8f63' }]} />
            <T x={s.x + s.w / 2} y={s.y + s.h + 14} color={v != null ? '#3fae7a' : ART.inkDim} font={fonts.mono} ls={0}>
              {v == null ? 'OFF' : fmtDb(v)}
            </T>
          </G>
        );
      })}
      {/* the plate return */}
      <Rect x={plate.x + 1} y={plate.y + 1.5} width={plate.w} height={plate.h} rx={4} fill="#000" opacity={0.45} />
      <Rect x={plate.x} y={plate.y} width={plate.w} height={plate.h} rx={4} fill="#1d1f25" stroke={on ? '#2f8f63' : '#3a3e46'} strokeWidth={1} />
      <T x={plate.x + plate.w / 2} y={plate.y + 16} color={on ? '#3fae7a' : ART.inkDim} ls={0.8}>
        PLATE
      </T>
      <Knob cx={plate.x + plate.w / 2} cy={plate.y + 42} r={11} frac={Math.log(1.6 / 0.2) / Math.log(10 / 0.2)} cap="#3a3d45" dim={!on} />
      <T x={plate.x + plate.w / 2} y={plate.y + 68} color={ART.inkDim} ls={0.4}>
        DECAY
      </T>
      <T x={plate.x + plate.w / 2} y={plate.y + 81} color={on ? ART.amber : ART.inkDim} font={fonts.mono} ls={0}>
        1.6 s
      </T>
      <T x={plate.x + plate.w / 2} y={plate.y + 104} color={ART.inkDim} ls={0.4}>
        WET 100 %
      </T>
      <T x={plate.x + plate.w / 2} y={plate.y + 130} color={ART.inkDim} ls={0.4}>
        ONE ROOM
      </T>
      <T x={plate.x + plate.w / 2} y={plate.y - 8} color={ART.inkDim} ls={0.4}>
        → MIX BUS
      </T>
      <T x={10} y={busY + 40} anchor="start" color={ART.inkDim} ls={0.4}>
        {on ? 'GREEN = A POST-FADER COPY INTO THE ONE SHARED PLATE' : 'NO SENDS: EVERY PART BONE DRY'}
      </T>
      <T x={10} y={busY + 56} anchor="start" color={ART.inkDim} ls={0.4}>
        EACH CHANNEL STILL PLAYS DRY TO THE MIX AT ITS OWN FADER
      </T>
    </ArtFrame>
  );
}

/* ════ page 11 · the six terms ════════════════════════════════════════════ */

export type TermKind = 'bus' | 'subgroup' | 'auxSendReturn' | 'controlGroup' | 'vca' | 'stem';

export function TermsArt({ focus }: { focus: TermKind | null }) {
  const names = ['KICK', 'SNARE', 'PERC'] as const;
  const chs = names.map((n, i) => ({ n, x: 10 + i * 50, y: 40, w: 44, h: 150 }));
  const sub = { x: 60, y: 236, w: 44, h: 104 };
  const ret = { x: 214, y: 82, w: 44, h: 108 };
  const vca = { x: 286, y: 40, w: 44, h: 150 };
  const mix = { x: 214, y: 236, w: 44, h: 104 };
  const lit = (k: TermKind) => focus === k;
  const anyFocus = focus != null;
  const col = (k: TermKind, c: string) => (!anyFocus || lit(k) ? c : ART.wireDim);
  const audio = col('subgroup', ART.wire);
  const busC = lit('bus') ? ART.amber : audio;
  const pins = [-10, 0, 10];
  // R7-MIX-01: the sends leave at the SEND knob — below the strip's VCA tape
  // row (Strip: the VCA row 15 tall from y + 5, then the send knob's centre
  // 6.5 into its 15 row), as advArt's Strip lays it out.
  const sendY = chs[0].y + 5 + 15 + 6.5;
  const ctlY = 30;
  const label: Record<TermKind, string> = {
    bus: 'BUS — ANY PATH THAT CARRIES AUDIO ON',
    subgroup: 'SUBGROUP — CHANNELS SUM THROUGH IT',
    auxSendReturn: 'AUX — A COPY OUT, A RETURN BACK IN',
    controlGroup: 'CONTROL GROUP — LINKED BUTTONS, NO AUDIO',
    vca: 'VCA — GAIN BY REMOTE, NO AUDIO',
    stem: 'STEM — THE GROUP BOUNCED TO A FILE',
  };
  return (
    <ArtFrame
      h={400}
      a11y={`Three drum channel strips. Their outputs sum through a DRUMS subgroup into the mix bus. Each has a send knob feeding an FX return. A VCA strip reaches them by a dashed control line only. Their select buttons are linked as a control group. The subgroup is bounced to a stem file. ${focus ? `Lit: ${label[focus].toLowerCase()}.` : ''}`}
    >
      <T x={12} y={16} anchor="start" color={anyFocus ? ART.amber : ART.ink} ls={0.8}>
        {focus ? label[focus] : 'OPEN A TERM TO LIGHT ITS PATH'}
      </T>
      {/* VCA control lines (dashed, no audio) */}
      <Wire pts={[{ x: vca.x + vca.w / 2, y: vca.y }, { x: vca.x + vca.w / 2, y: ctlY }, { x: chs[0].x + 22, y: ctlY }]} color={col('vca', ART.control)} dashed arrow={false} width={1.2} />
      {chs.map((c) => (
        <Wire key={`v${c.n}`} pts={[{ x: c.x + 22, y: ctlY }, { x: c.x + 22, y: c.y }]} color={col('vca', ART.control)} dashed width={1.2} />
      ))}
      {/* sends → FX return (copies) */}
      {chs.map((c, i) => (
        <Wire
          key={`s${c.n}`}
          pts={[{ x: c.x + c.w, y: sendY }, { x: c.x + c.w + 3, y: sendY }, { x: c.x + c.w + 3, y: 202 + i * 4 }, { x: ret.x + ret.w / 2 + pins[i], y: 202 + i * 4 }, { x: ret.x + ret.w / 2 + pins[i], y: ret.y + ret.h }]}
          color={col('auxSendReturn', '#3fae7a')}
          width={lit('auxSendReturn') ? 1.7 : 1.2}
        />
      ))}
      {/* channel outs → subgroup */}
      {chs.map((c, i) => {
        const x0 = c.x + c.w / 2;
        const ly = 220;
        const px = sub.x + sub.w / 2 + pins[i];
        const pts = i === 1 ? [{ x: x0, y: c.y + c.h }, { x: px, y: sub.y }] : [{ x: x0, y: c.y + c.h }, { x: x0, y: ly }, { x: px, y: ly }, { x: px, y: sub.y }];
        return <Wire key={`a${c.n}`} pts={pts} color={busC} width={lit('subgroup') || lit('bus') ? 1.8 : 1.3} />;
      })}
      {/* subgroup → mix, return → mix */}
      <Wire pts={[{ x: sub.x + sub.w, y: 290 }, { x: mix.x, y: 290 }]} color={busC} width={lit('subgroup') || lit('bus') ? 1.8 : 1.3} />
      <Wire pts={[{ x: ret.x + ret.w, y: 150 }, { x: 272, y: 150 }, { x: 272, y: 226 }, { x: mix.x + mix.w / 2 + 8, y: 226 }, { x: mix.x + mix.w / 2 + 8, y: mix.y }]} color={col('auxSendReturn', '#3fae7a')} width={1.3} />
      {chs.map((c) => (
        <Strip key={c.n} x={c.x} y={c.y} w={c.w} h={c.h} name={c.n} db={0} vca="1" sends={[{ frac: 0.55, cap: '#2f8f63' }]} hl={lit('controlGroup') ? ART.cyan : null} />
      ))}
      {/* control group: the linked select buttons */}
      {lit('controlGroup')
        ? chs.map((c) => <Btn key={`b${c.n}`} x={c.x + 6} y={c.y + c.h - 30} s={7} lit={ART.cyan} />)
        : null}
      {lit('controlGroup') ? (
        <G>
          <Line x1={chs[0].x + 9.5} y1={chs[0].y + chs[0].h + 6} x2={chs[2].x + 9.5} y2={chs[0].y + chs[0].h + 6} stroke={ART.cyan} strokeWidth={1} strokeDasharray="2 2" />
          <T x={chs[1].x + 22} y={chs[0].y + chs[0].h + 2} color={ART.cyan}>
            LINKED
          </T>
        </G>
      ) : null}
      <Strip {...ret} name="FX RTN" db={-4} cap="ret" pan={null} hl={lit('auxSendReturn') ? '#3fae7a' : null} dim={anyFocus && !lit('auxSendReturn')} />
      <Strip {...vca} name="VCA 1" db={0} cap="vca" pan={null} hl={lit('vca') ? ART.control : null} dim={anyFocus && !lit('vca')} />
      <Strip {...sub} name="DRUMS" db={0} cap="bus" pan={null} hl={lit('subgroup') ? '#6f9bff' : null} dim={anyFocus && !lit('subgroup') && !lit('bus') && !lit('stem')} />
      <Strip {...mix} name="MIX" db={0} cap="master" pan={null} />
      {/* stem: the subgroup bounced to a file */}
      <Wire pts={[{ x: sub.x, y: 300 }, { x: 40, y: 300 }, { x: 40, y: 356 }]} color={col('stem', ART.amber)} dashed width={1.3} />
      <G opacity={!anyFocus || lit('stem') ? 1 : 0.4}>
        <Path d="M 14 358 l 66 0 l 8 8 l 0 24 l -74 0 z" fill="#1a1812" stroke={ART.amber} strokeWidth={1} />
        <T x={18} y={376} anchor="start" color={ART.amber} font={fonts.mono} ls={0}>
          Drums.wav
        </T>
      </G>
      <T x={98} y={386} anchor="start" color={lit('stem') ? ART.amber : ART.inkDim} ls={0.4}>
        A FILE, NOT A PATH
      </T>
      {lit('bus') ? (
        <T x={(sub.x + sub.w + mix.x) / 2} y={284} color={ART.amber} ls={0.4}>
          BUS
        </T>
      ) : null}
    </ArtFrame>
  );
}

/* ════ page 12 · pre / post ═══════════════════════════════════════════════ */

/** The lead channel's path drawn top to bottom, with the two taps either
 *  side of the fader. `cueOn` / `verbOn` come from the page's sendPathGain. */
export function PrePostArt({ faderDb, cueOn, verbOn }: { faderDb: number; cueOn: boolean; verbOn: boolean }) {
  const cx = 70;
  const preY = 92;
  const postY = 214;
  const BLUE = '#5b8fe0';
  const GREEN = '#3fae7a';
  const fTop = 112;
  const fBot = 194;
  const capY = fBot - ((Math.max(-60, faderDb) + 60) / 72) * (fBot - fTop);
  return (
    <ArtFrame
      h={262}
      a11y={`The lead channel, top to bottom: input, inserts, the PRE tap, the fader at ${faderDb <= -60 ? 'minus infinity' : `${faderDb} dB`}, the POST tap, then the mix. The pre tap feeds the singer's headphones: ${cueOn ? 'receiving' : 'silent'}. The post tap feeds the reverb: ${verbOn ? 'receiving' : 'silent'}.`}
    >
      {/* the channel's spine */}
      <Line x1={cx} y1={22} x2={cx} y2={fTop - 8} stroke={ART.wire} strokeWidth={1.5} />
      <Wire pts={[{ x: cx, y: fBot + 8 }, { x: cx, y: 238 }]} color={verbOn ? ART.wire : ART.wireDim} />
      <T x={cx - 10} y={30} anchor="end" color={ART.ink}>
        IN
      </T>
      <Rect x={cx - 26} y={44} width={52} height={14} rx={2} fill="#2a2210" stroke={ART.amber} strokeWidth={0.9} />
      <T x={cx} y={55} color={ART.amber} ls={0.3}>
        EQ
      </T>
      <Rect x={cx - 26} y={62} width={52} height={14} rx={2} fill="#2a2210" stroke={ART.amber} strokeWidth={0.9} />
      <T x={cx} y={73} color={ART.amber} ls={0.3}>
        COMP
      </T>
      {/* the fader, a real long-throw */}
      <Rect x={cx - 30} y={fTop - 8} width={60} height={fBot - fTop + 16} rx={3} fill={ART.panel} stroke={ART.panelEdge} strokeWidth={0.8} />
      <Rect x={cx + 8} y={fTop} width={2.6} height={fBot - fTop} rx={1.3} fill={ART.groove} />
      <Rect x={cx + 2} y={capY - 4} width={15} height={8} rx={1.3} fill="#8d9099" stroke="#0b0b0d" strokeWidth={0.5} />
      <Line x1={cx + 3} y1={capY} x2={cx + 16} y2={capY} stroke="#f4f4f6" strokeWidth={0.8} />
      <T x={cx - 34} y={(fTop + fBot) / 2 + 4} anchor="end" color={ART.ink} ls={0.4}>
        FADER
      </T>
      <T x={cx + 34} y={capY + 3.5} anchor="start" color={faderDb <= -60 ? ART.amber : ART.ink} font={fonts.mono} ls={0}>
        {faderDb <= -60 ? '−∞' : `${faderDb} dB`}
      </T>
      {/* PRE tap → the singer's cue */}
      <Circle cx={cx} cy={preY} r={3.5} fill={BLUE} />
      <T x={cx - 8} y={preY + 4} anchor="end" color={BLUE} ls={0.4}>
        PRE
      </T>
      <Wire pts={[{ x: cx + 4, y: preY }, { x: 252, y: preY }]} color={cueOn ? BLUE : ART.wireDim} width={cueOn ? 1.8 : 1.2} dashed={!cueOn} />
      <Headphones cx={286} cy={preY - 12} s={40} />
      <T x={286} y={preY + 30} color={cueOn ? BLUE : ART.inkDim} ls={0.4}>
        SINGER’S CUE
      </T>
      <T x={286} y={preY + 44} color={cueOn ? BLUE : ART.red} font={fonts.mono} ls={0}>
        {cueOn ? 'RECEIVING' : 'SILENT'}
      </T>
      {/* POST tap → the reverb */}
      <Circle cx={cx} cy={postY} r={3.5} fill={verbOn ? GREEN : ART.wireDim} />
      <T x={cx - 8} y={postY + 4} anchor="end" color={GREEN} ls={0.4}>
        POST
      </T>
      <Wire pts={[{ x: cx + 4, y: postY }, { x: 252, y: postY }]} color={verbOn ? GREEN : ART.wireDim} width={verbOn ? 1.8 : 1.2} dashed={!verbOn} />
      <Rect x={258} y={postY - 18} width={56} height={30} rx={3} fill="#1d1f25" stroke={verbOn ? '#2f8f63' : '#3a3e46'} strokeWidth={1} />
      <T x={286} y={postY + 1} color={verbOn ? GREEN : ART.inkDim} ls={0.8}>
        REVERB
      </T>
      <T x={286} y={postY + 28} color={verbOn ? GREEN : ART.red} font={fonts.mono} ls={0}>
        {verbOn ? 'RECEIVING' : 'SILENT'}
      </T>
      <T x={cx - 10} y={246} anchor="end" color={ART.ink}>
        MIX
      </T>
    </ArtFrame>
  );
}

/** The detective case, drawn once solved: one channel, two live paths. */
export function DoubleRouteArt() {
  const ch = { x: 20, y: 22, w: 46, h: 150 };
  const mix = { x: 266, y: 60, w: 50, h: 112 };
  const sendY = ch.y + 5 + 6.5;
  return (
    <ArtFrame h={196} a11y="The lead channel reaches the mix bus twice: its main output, which the fader controls, and a forgotten utility send at full level straight into the same mix, which the fader does not control.">
      {/* R2-MX-01 (2026-10-21): the old send runs ABOVE the main lane into the
          TOP of the MIX strip (its arrow showing), never crossing the main out;
          its words start right of the LEAD strip. */}
      <Wire pts={[{ x: ch.x + ch.w, y: sendY }, { x: mix.x + mix.w / 2 + 8, y: sendY }, { x: mix.x + mix.w / 2 + 8, y: mix.y }]} color={ART.red} width={1.8} />
      <T x={ch.x + ch.w + 6} y={sendY - 6} anchor="start" color={ART.red} ls={0.4}>
        OLD SEND · FULL LEVEL · 2ND PATH
      </T>
      <Wire pts={[{ x: ch.x + ch.w / 2, y: ch.y + ch.h }, { x: ch.x + ch.w / 2, y: 184 }, { x: 240, y: 184 }, { x: 240, y: 52 }, { x: mix.x + mix.w / 2 - 8, y: 52 }, { x: mix.x + mix.w / 2 - 8, y: mix.y }]} color={ART.wire} width={1.6} />
      <T x={150} y={178} color={ART.ink} ls={0.4}>
        MAIN OUT · FOLLOWS THE FADER
      </T>
      <Strip {...ch} name="LEAD" db={-10} sends={[{ frac: 1, cap: ART.red }]} />
      <Strip {...mix} name="MIX" db={0} cap="master" pan={null} />
    </ArtFrame>
  );
}

/* ════ page 14 · the bounce dialog ════════════════════════════════════════ */

export function BounceArt({ rate, depth, named, inspected }: { rate: '44.1' | '48' | null; depth: '16' | '24' | null; named: boolean; inspected: boolean }) {
  const field = (y: number, k: string, v: string, ok: boolean | null) => (
    <G>
      <T x={22} y={y + 13} anchor="start" color={ART.inkDim} ls={0.6}>
        {k}
      </T>
      <Rect x={120} y={y} width={204} height={18} rx={3} fill="#0b0c10" stroke={ok === false ? ART.amber : '#30343c'} strokeWidth={0.8} />
      <T x={126} y={y + 13} anchor="start" color={ok == null ? ART.inkDim : ok ? ART.ink : ART.amber} font={fonts.mono} ls={0}>
        {v}
      </T>
    </G>
  );
  const tl = { x0: 22, x1: 318, y: 186 };
  const songEnd = tl.x0 + (235 / 250) * (tl.x1 - tl.x0);
  const tailEnd = tl.x0 + (247 / 250) * (tl.x1 - tl.x0);
  return (
    <ArtFrame
      h={276}
      a11y={`The bounce dialog. File name ${named ? 'OurSong_Mix_v3_2026-09-11.wav' : 'final_FINAL_2.wav'}; WAV; sample rate ${rate ? `${rate} kilohertz` : 'not chosen'}; bit depth ${depth ? `${depth}-bit` : 'not chosen'}; dither ${depth === '16' ? 'on' : 'off'}. The range runs from bar 1 past the end of the reverb tail.${inspected ? ' Inspection: start clean, tail complete, no clipped samples, length 3:55.' : ''}`}
    >
      <Rect x={8} y={8} width={324} height={260} rx={8} fill="#16181d" stroke="#30343c" strokeWidth={0.8} />
      <T x={170} y={26} color={ART.ink} ls={1.2}>
        BOUNCE MIX
      </T>
      {field(38, 'FILE NAME', named ? 'OurSong_Mix_v3_2026-09-11.wav' : 'final_FINAL_2.wav', named ? true : false)}
      {field(62, 'FORMAT', 'WAV · STEREO INTERLEAVED', true)}
      {field(86, 'SAMPLE RATE', rate ? `${rate} kHz${rate === '48' ? ' (session)' : ' — resampled'}` : 'choose…', rate == null ? null : rate === '48')}
      {field(110, 'BIT DEPTH', depth ? `${depth}-bit` : 'choose…', depth == null ? null : depth === '24')}
      {field(134, 'DITHER', depth === '16' ? 'ON — on the way down' : 'OFF', true)}
      <T x={22} y={174} anchor="start" color={ART.inkDim} ls={0.6}>
        RANGE
      </T>
      <Rect x={tl.x0} y={tl.y} width={tl.x1 - tl.x0} height={16} rx={2} fill="#0b0c10" stroke="#30343c" strokeWidth={0.7} />
      <Rect x={tl.x0 + 1} y={tl.y + 3} width={songEnd - tl.x0 - 1} height={10} rx={1.5} fill="#3e6fb8" opacity={0.55} />
      <Rect x={songEnd} y={tl.y + 5} width={tailEnd - songEnd} height={6} rx={1.5} fill="#3e6fb8" opacity={0.3} />
      <Rect x={tl.x0} y={tl.y - 3} width={tailEnd - tl.x0 + 2} height={22} rx={2} fill="none" stroke={ART.amber} strokeWidth={1} />
      <T x={tl.x0} y={tl.y + 32} anchor="start" color={ART.inkDim} font={fonts.mono} ls={0}>
        0:00
      </T>
      <Line x1={songEnd} y1={tl.y + 19} x2={songEnd} y2={tl.y + 38} stroke={ART.inkDim} strokeWidth={0.7} />
      <T x={songEnd - 4} y={tl.y + 46} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
        last hit 3:40
      </T>
      <T x={tl.x1} y={tl.y + 32} anchor="end" color={ART.amber} font={fonts.mono} ls={0}>
        3:55 tail
      </T>
      {inspected ? (
        <T x={22} y={256} anchor="start" color={ART.green} ls={0.4}>
          ✓ START  ✓ TAIL  ✓ 0 CLIPPED  ✓ 3:55  ✓ ALL PARTS
        </T>
      ) : (
        <T x={22} y={256} anchor="start" color={ART.inkDim} ls={0.4}>
          THEN OPEN THE FILE AND CHECK IT
        </T>
      )}
    </ArtFrame>
  );
}

/** Re-exported so pages import one module for their art. */
export { FS };
