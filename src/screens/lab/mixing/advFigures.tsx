/**
 * Advanced Mixing — the teaching drawings, part 2: the ROUTING figures, each
 * drawn from the page's own state (art fix 2026-10-16). Gear and wiring
 * rules: see advArt.tsx.
 *
 *   RoutingMapArt   p3  · the session: 8 channels → 3 family buses + the FX
 *                         return → the mix bus → the monitors
 *   GroupsArt       p4  · subgroup vs VCA: where the compressor sits (the
 *                         A/B pick) and where a −6 dB pull acts (the page's
 *                         PULL keys)
 *   AuxArt          p5  · pre-fader cue, post-fader reverb return, solo-safe,
 *                         the sidechain key, and the loop nobody patches —
 *                         the opened card's path lit
 *   ParallelArt     p6  · dry / insert / parallel as an insert loop, with the
 *                         compressor at the page's real settings
 *   BusChainArt     p14 · the mix-bus chain: compressor + drive + the static
 *                         curve the renderer applies
 *   NullTestArt     p17 · stems summed against the polarity-flipped mix,
 *                         residue on a meter (the page's real result)
 */
import { G, Circle, Line, Path, Rect } from 'react-native-svg';
import { fonts } from '../../../theme/tokens';
import { levelColorForDb } from '../../../features/tools/levelColor';
import { ART, ArtFrame, Btn, CompFace, Headphones, Knob, Monitor, Strip, T, Wire, outPin, type CompSettings } from './advArt';

/* ════ p3 · the session's routing map ═════════════════════════════════════ */

const MAP_CH = ['KICK', 'SNARE', 'PERC', 'BASS', 'GTR', 'KEYS', 'LEAD', 'BGV'] as const;

export function RoutingMapArt() {
  const cw = 38;
  const chX = (i: number) => 5.75 + i * 41.5;
  const chY = 8;
  const chH = 120;
  const busY = 176;
  const busH = 100;
  const bw = 46;
  // R6 MIX-02: the rhythm bus sits a little right and wider (66) — RHYTHM BUS
  // fits its tape (62) whole, 4 pt clear of the FX return.
  const busCx = { fx: 32, rhythm: 92, music: 211.5, vocal: 294.5 } as const;
  // Group buses are drawn wide enough for "… BUS" on their tape (review
  // 2026-10-16: a beginner could not tell a bus strip from a channel).
  const bus = (cx: number, w = bw) => ({ x: cx - w / 2, y: busY, w, h: busH });
  const mix = { x: 147, y: 310, w: bw, h: 100 };
  // channel → bus: own pin per wire, outer channels on the deeper lane
  const feeds: { ch: number; cx: number; pin: number; lane: number }[] = [
    { ch: 0, cx: busCx.rhythm, pin: -9, lane: 1 },
    { ch: 1, cx: busCx.rhythm, pin: -3, lane: 0 },
    { ch: 2, cx: busCx.rhythm, pin: 3, lane: 0 },
    { ch: 3, cx: busCx.rhythm, pin: 9, lane: 1 },
    { ch: 4, cx: busCx.music, pin: -3, lane: 0 },
    { ch: 5, cx: busCx.music, pin: 3, lane: 0 },
    { ch: 6, cx: busCx.vocal, pin: -3, lane: 0 },
    { ch: 7, cx: busCx.vocal, pin: 3, lane: 0 },
  ];
  const sums: { cx: number; pin: number; lane: number }[] = [
    { cx: busCx.fx, pin: -9, lane: 1 },
    { cx: busCx.rhythm, pin: -3, lane: 0 },
    { cx: busCx.music, pin: 3, lane: 0 },
    { cx: busCx.vocal, pin: 9, lane: 1 },
  ];
  const mcx = mix.x + mix.w / 2;
  return (
    <ArtFrame
      h={418}
      a11y="Routing map drawn as mixer strips: kick, snare, percussion and bass each wire into the rhythm group; guitar and keys into the music group; lead and backing vocals into the vocal group. The three groups and the shared effects return each wire into the mix bus, whose left and right outputs feed a pair of studio monitors. Every wire lands on its own input."
    >
      {feeds.map((f) => {
        const x0 = chX(f.ch) + cw / 2;
        const ly = chY + chH + 9 + f.lane * 8;
        return <Wire key={`f${f.ch}`} pts={[{ x: x0, y: chY + chH }, { x: x0, y: ly }, { x: f.cx + f.pin, y: ly }, { x: f.cx + f.pin, y: busY }]} />;
      })}
      {sums.map((f) => {
        const ly = busY + busH + 9 + f.lane * 8;
        return <Wire key={`s${f.cx}`} pts={[{ x: f.cx, y: busY + busH }, { x: f.cx, y: ly }, { x: mcx + f.pin, y: ly }, { x: mcx + f.pin, y: mix.y }]} />;
      })}
      {MAP_CH.map((n, i) => (
        <Strip key={n} x={chX(i)} y={chY} w={cw} h={chH} name={n} db={0} inserts={[null]} />
      ))}
      {/* the FX return is fed by the channels' post-fader sends */}
      <Wire pts={[{ x: busCx.fx, y: 160 }, { x: busCx.fx, y: busY }]} color={ART.wire} dashed width={1.2} />
      <T x={busCx.fx + 5} y={168} anchor="start" color={ART.inkDim}>
        SENDS
      </T>
      <Strip {...bus(busCx.fx)} name="FX RTN" db={-6} cap="ret" pan={null} />
      <Strip {...bus(busCx.rhythm, 66)} name="RHYTHM BUS" db={0} cap="bus" pan={null} inserts={[null]} />
      <Strip {...bus(busCx.music, 58)} name="MUSIC BUS" db={0} cap="bus" pan={null} inserts={[null]} />
      <Strip {...bus(busCx.vocal, 58)} name="VOCAL BUS" db={0} cap="bus" pan={null} inserts={[null]} />
      <Strip {...mix} name="MIX BUS" db={0} cap="master" pan={null} inserts={[null]} />
      {/* main L/R out to the monitors: two cables, parallel lanes */}
      <Wire pts={[{ x: mix.x + mix.w, y: 380 }, { x: 247, y: 380 }, { x: 247, y: 369.2 }]} />
      <Wire pts={[{ x: mix.x + mix.w, y: 388 }, { x: 303, y: 388 }, { x: 303, y: 369.2 }]} />
      <Monitor x={231} y={318} w={32} />
      <Monitor x={287} y={318} w={32} />
      <T x={247} y={312}>L</T>
      <T x={303} y={312}>R</T>
    </ArtFrame>
  );
}

/* ════ p4 · subgroup vs VCA ═══════════════════════════════════════════════ */

export type GroupComp = 'dry' | 'bus' | 'each';
export type GroupPull = 'none' | 'vca' | 'sub';

export function GroupsArt({ comp, pull }: { comp: GroupComp; pull: GroupPull }) {
  const names = ['KICK', 'SNARE', 'PERC'] as const;
  const top = 34;
  const chH = 172;
  const chs = names.map((n, i) => ({ n, x: 10 + i * 52, y: top, w: 46, h: chH }));
  const vca = { x: 284, y: top, w: 46, h: chH };
  const drum = { x: 62, y: 236, w: 46, h: 120 };
  const mix = { x: 196, y: 236, w: 46, h: 120 };
  const ctlY = 24;
  const pins = [-6, 0, 6];
  return (
    <ArtFrame
      h={364}
      a11y={`Kick, snare and percussion channel strips wire into a drum subgroup, which feeds the mix bus. A VCA strip is linked to the three channels by a dashed control line only — no audio reaches it. ${
        comp === 'bus' ? 'One compressor sits on the drum subgroup insert.' : comp === 'each' ? 'A compressor sits on each drum channel insert.' : 'No compressor anywhere.'
      } ${pull === 'vca' ? 'The VCA is pulled down 6 dB: each channel plays 6 dB lower, shown as a dashed ghost cap, and its post-fader send drops with it.' : pull === 'sub' ? 'The subgroup fader is pulled down 6 dB, after the subgroup compressor; the channels and their sends are untouched.' : ''}`}
    >
      {/* the VCA's control link: dashed, no arrowhead of audio — it moves gain */}
      <Wire pts={[{ x: vca.x + vca.w / 2, y: vca.y }, { x: vca.x + vca.w / 2, y: ctlY }, { x: chs[0].x + 23, y: ctlY }]} color={ART.control} dashed arrow={false} width={1.2} />
      {chs.map((c) => (
        <Wire key={`c${c.n}`} pts={[{ x: c.x + 23, y: ctlY }, { x: c.x + 23, y: c.y }]} color={ART.control} dashed width={1.2} />
      ))}
      <T x={(chs[2].x + chs[2].w + vca.x) / 2} y={ctlY - 6} color={ART.control} ls={0.8}>
        CONTROL ONLY · NO AUDIO
      </T>
      {/* audio: channels → drum subgroup → mix */}
      {chs.map((c, i) => {
        const x0 = c.x + c.w / 2;
        const px = drum.x + drum.w / 2 + pins[i];
        const ly = c.y + c.h + 10;
        return <Wire key={`a${c.n}`} pts={[{ x: x0, y: c.y + c.h }, { x: x0, y: ly }, { x: px, y: ly }, { x: px, y: drum.y }]} />;
      })}
      <Wire pts={[{ x: drum.x + drum.w, y: 296 }, { x: mix.x, y: 296 }]} />
      {chs.map((c) => (
        <Strip
          key={c.n}
          x={c.x}
          y={c.y}
          w={c.w}
          h={c.h}
          name={c.n}
          db={0}
          ghostDb={pull === 'vca' ? -6 : null}
          inserts={[comp === 'each' ? 'COMP' : null]}
          insertOn={comp === 'each' ? 0 : null}
          vca="1"
          sends={[{ frac: 0.62, cap: '#2f8f63' }]}
        />
      ))}
      <Strip {...vca} name="VCA 1" db={pull === 'vca' ? -6 : 0} cap="vca" pan={null} hl={pull === 'vca' ? ART.control : null} />
      <Strip {...drum} name="DRUMS" db={pull === 'sub' ? -6 : 0} cap="bus" pan={null} inserts={[comp === 'bus' ? 'COMP' : null]} insertOn={comp === 'bus' ? 0 : null} hl={pull === 'sub' ? '#6f9bff' : null} />
      <Strip {...mix} name="MIX" db={0} cap="master" pan={null} />
      <T x={(drum.x + drum.w + mix.x) / 2} y={289} color={ART.inkDim}>
        TO THE MIX
      </T>
      {pull === 'vca' ? (
        <T x={vca.x - 6} y={vca.y + 92} anchor="end" color={ART.control} font={fonts.mono} ls={0}>
          −6 dB
        </T>
      ) : null}
      {pull === 'vca' ? (
        <T x={chs[2].x + chs[2].w + 6} y={chs[2].y + 138} anchor="start" color={ART.control} ls={0.3}>
          ALL −6
        </T>
      ) : null}
      {pull === 'sub' ? (
        <T x={drum.x + drum.w + 6} y={drum.y + 70} anchor="start" color="#6f9bff" font={fonts.mono} ls={0}>
          −6 dB
        </T>
      ) : null}
    </ArtFrame>
  );
}

/** What a −6 dB pull did, in words for the readout under GroupsArt. */
export function groupsPullReadout(pull: GroupPull, comp: GroupComp): string {
  if (pull === 'vca') {
    const c =
      comp === 'bus'
        ? ' The drum bus compressor is driven 6 dB softer, so it squeezes less.'
        : comp === 'each'
          ? ' Each channel’s own compressor sits BEFORE its fader, so it works exactly as before.'
          : '';
    return `VCA −6 dB: each drum CHANNEL plays 6 dB lower (the yellow ghost caps) — so its post-fader reverb send drops 6 dB too.${c}`;
  }
  if (pull === 'sub') {
    const c =
      comp === 'bus'
        ? ' The fader sits AFTER the drum bus compressor, so its drive is untouched.'
        : comp === 'each'
          ? ' The channels’ own compressors are upstream and untouched.'
          : '';
    return `SUBGROUP −6 dB: the summed drums drop 6 dB at the drum bus fader — the channels and their sends are untouched.${c}`;
  }
  return 'Pull one or the other 6 dB and watch where the gain change happens.';
}

/* ════ p5 · advanced aux routing ══════════════════════════════════════════ */

export type AuxFocus = 'returns' | 'cue' | 'sidechain' | 'solosafe' | 'feedback' | null;

const BLUE = '#5b8fe0';
const GREEN = '#3fae7a';
const PURPLE = '#9a7ae0';
/** R6 MIX-01: the feedback loop's lane (x): left of the SOLO SAFE words
 *  (right-aligned at the VERB strip's x − 4, ≈ 50 wide), right of the LEAD strip. */
export const LOOP_X = 128;

export function AuxArt({ opened }: { opened: ReadonlySet<string> }) {
  const lead = { x: 12, y: 30, w: 46, h: 176 };
  const verb = { x: 196, y: 74, w: 46, h: 132 };
  const mix = { x: 272, y: 74, w: 46, h: 132 };
  const kick = { x: 12, y: 252, w: 46, h: 112 };
  const bass = { x: 112, y: 252, w: 46, h: 112 };
  // send knob centres (Strip draws inserts → sends → pan from y+5, 15 apart)
  const aux1Y = lead.y + 5 + 6.5;
  const aux2Y = lead.y + 5 + 15 + 6.5;
  const keyY = kick.y + 5 + 6.5;
  // Every OPENED card's path is lit (review 2026-10-16); none open = all lit.
  const none = opened.size === 0;
  const has = (k: Exclude<AuxFocus, null>) => opened.has(k);
  const lit = (k: Exclude<AuxFocus, null>) => none || has(k);
  const dimC = ART.wireDim;
  const cueOn = lit('cue');
  const verbOn = lit('returns') || has('solosafe');
  const scOn = lit('sidechain');
  return (
    <ArtFrame
      h={372}
      a11y="Aux routing drawn as strips. The lead vocal's AUX 1 send, taken before the fader, feeds the performer's headphone cue. Its AUX 2 send, taken after the fader, feeds the reverb return strip, which outputs to the mix bus and carries a solo-safe button. The lead's own output also feeds the mix. Below, the kick's KEY send feeds the external key input of the compressor inserted on the bass. The reverb return has no send of its own, so no feedback loop exists unless someone patches one."
    >
      {/* AUX 1 · PRE → the performer's cue */}
      <Wire pts={[{ x: lead.x + lead.w, y: aux1Y }, { x: 262, y: aux1Y }]} color={cueOn ? BLUE : dimC} width={cueOn ? 1.8 : 1.3} />
      <T x={130} y={aux1Y - 5} color={cueOn ? BLUE : ART.inkDim} ls={0.8}>
        AUX 1 · PRE-FADER
      </T>
      <Headphones cx={292} cy={aux1Y - 6} s={34} />
      <T x={270} y={aux1Y - 8} anchor="end" color={cueOn ? BLUE : ART.inkDim}>
        CUE
      </T>
      {/* AUX 2 · POST → the reverb return → the mix */}
      <Wire pts={[{ x: lead.x + lead.w, y: aux2Y }, { x: verb.x + verb.w / 2, y: aux2Y }, { x: verb.x + verb.w / 2, y: verb.y }]} color={verbOn ? GREEN : dimC} width={verbOn ? 1.8 : 1.3} />
      <T x={130} y={aux2Y - 5} color={verbOn ? GREEN : ART.inkDim} ls={0.8}>
        AUX 2 · POST-FADER
      </T>
      <Wire pts={[{ x: verb.x + verb.w, y: 150 }, { x: mix.x, y: 150 }]} color={verbOn ? GREEN : dimC} width={verbOn ? 1.8 : 1.3} />
      {/* the lead's own output → the mix */}
      <Wire pts={[{ x: lead.x + lead.w / 2, y: lead.y + lead.h }, { x: lead.x + lead.w / 2, y: 222 }, { x: 258, y: 222 }, { x: 258, y: 186 }, { x: mix.x, y: 186 }]} color={none ? ART.wire : dimC} />
      {has('feedback') ? (
        <G>
          {/* the loop nobody should patch: the return fed back into its own send.
              R6 MIX-01: its lane runs at LOOP_X, left of the SOLO SAFE words. */}
          <Wire pts={[{ x: verb.x + verb.w / 2, y: verb.y + verb.h }, { x: verb.x + verb.w / 2, y: 214 }, { x: LOOP_X, y: 214 }, { x: LOOP_X, y: aux2Y + 8 }, { x: verb.x + 8, y: aux2Y + 8 }]} color={ART.red} dashed width={1.6} />
          <Line x1={LOOP_X - 6} y1={150} x2={LOOP_X + 6} y2={162} stroke={ART.red} strokeWidth={2} />
          <Line x1={LOOP_X + 6} y1={150} x2={LOOP_X - 6} y2={162} stroke={ART.red} strokeWidth={2} />
          <T x={LOOP_X - 24} y={176} color={ART.red} anchor="middle">
            LOOP
          </T>
        </G>
      ) : null}
      <Strip
        {...lead}
        name="LEAD"
        db={0}
        sends={[
          { frac: 0.55, cap: BLUE },
          { frac: 0.6, cap: GREEN },
        ]}
        hl={has('cue') || has('returns') ? '#7a7f8a' : null}
      />
      <Strip {...verb} name="VERB" db={-4} cap="ret" safe={has('solosafe')} hl={has('solosafe') ? ART.cyan : has('feedback') ? ART.red : null} />
      {has('solosafe') ? (
        <T x={verb.x - 4} y={verb.y + 5 + 15 + 8} anchor="end" color={ART.cyan}>
          SOLO SAFE
        </T>
      ) : null}
      <Strip {...mix} name="MIX" db={0} cap="master" pan={null} />
      {/* the sidechain: the kick's KEY send into the bass compressor's key input */}
      <Wire pts={[{ x: kick.x + kick.w, y: keyY }, { x: bass.x, y: keyY }]} color={scOn ? PURPLE : dimC} width={scOn ? 1.8 : 1.3} />
      <T x={(kick.x + kick.w + bass.x) / 2} y={keyY - 5} color={scOn ? PURPLE : ART.inkDim}>
        KEY
      </T>
      <Strip {...kick} name="KICK" db={0} sends={[{ frac: 0.7, cap: PURPLE }]} dim={!scOn} />
      <Strip {...bass} name="BASS" db={0} inserts={['COMP']} insertOn={scOn ? 0 : null} dim={!scOn} />
      <T x={bass.x + bass.w + 10} y={keyY + 4} anchor="start" color={scOn ? PURPLE : ART.inkDim}>
        KEY SEND · PRE-FADER
      </T>
      <T x={bass.x + bass.w + 10} y={keyY + 18} anchor="start" color={scOn ? PURPLE : ART.inkDim}>
        → BASS COMPRESSOR’S DETECTOR,
      </T>
      <T x={bass.x + bass.w + 10} y={keyY + 32} anchor="start" color={scOn ? PURPLE : ART.inkDim}>
        NOT ITS AUDIO
      </T>
      <T x={bass.x + bass.w + 10} y={keyY + 52} anchor="start" color={ART.inkDim}>
        MANY DAWS PICK THE KEY
      </T>
      <T x={bass.x + bass.w + 10} y={keyY + 66} anchor="start" color={ART.inkDim}>
        SOURCE ON THE COMPRESSOR ITSELF
      </T>
    </ArtFrame>
  );
}

/* ════ p6 · insert vs parallel ════════════════════════════════════════════ */

export type ParallelMode = 'dry' | 'insert' | 'parallel';

export const CRUSH: CompSettings = { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90 };

export function ParallelArt({ mode }: { mode: ParallelMode }) {
  const strip = { x: 10, y: 22, w: 46, h: 170 };
  const slotY = strip.y + 5 + 6.5; // insert slot centre
  const retY = slotY + 13;
  const comp = { x: 84, y: 64, w: 248 };
  const sigma = { x: 208, y: 160 };
  const wet = mode !== 'dry';
  const send = mode === 'dry' ? ART.wireDim : ART.wire;
  return (
    <ArtFrame
      h={206}
      a11y={
        mode === 'dry'
          ? 'Drum channel strip with an empty insert slot: no processing, the drum goes straight to its fader.'
          : mode === 'insert'
            ? 'Drum channel insert loop: the insert send feeds the compressor (threshold −30 dB, 8 to 1, 1 millisecond attack, 90 millisecond release), and only the compressed signal returns to the channel — it replaces the original.'
            : 'Drum channel insert loop in parallel: the insert send splits — the dry signal runs straight to a summing point while a copy passes the compressor (threshold −30 dB, 8 to 1) and is blended in 6 dB under it; the sum returns to the channel.'
      }
    >
      {wet ? (
        <G>
          {/* insert send → compressor */}
          <Wire pts={[{ x: strip.x + strip.w, y: slotY }, { x: 72, y: slotY }, { x: 72, y: comp.y + 33 }, { x: comp.x, y: comp.y + 33 }]} color={send} />
          {mode === 'parallel' ? (
            <G>
              {/* the dry lane: split at the send, straight to the sum */}
              <Circle cx={72} cy={comp.y + 33} r={2.4} fill={ART.wire} />
              <Wire pts={[{ x: 72, y: comp.y + 33 }, { x: 72, y: sigma.y }, { x: sigma.x - 7, y: sigma.y }]} color={ART.amber} />
              <T x={80} y={sigma.y - 5} anchor="start" color={ART.amber} ls={1}>
                DRY · FULL LEVEL
              </T>
              <Wire pts={[{ x: sigma.x, y: comp.y + 66 }, { x: sigma.x, y: sigma.y - 7 }]} color={ART.wire} />
              <T x={sigma.x + 8} y={comp.y + 84} anchor="start" color={ART.wire}>
                CRUSHED COPY −6 dB
              </T>
              <Sum x={sigma.x} y={sigma.y} />
              <Wire pts={[{ x: sigma.x, y: sigma.y + 7 }, { x: sigma.x, y: 186 }, { x: 64, y: 186 }, { x: 64, y: retY }, { x: strip.x + strip.w, y: retY }]} color={ART.wire} />
            </G>
          ) : (
            <Wire pts={[{ x: sigma.x, y: comp.y + 66 }, { x: sigma.x, y: 186 }, { x: 64, y: 186 }, { x: 64, y: retY }, { x: strip.x + strip.w, y: retY }]} color={ART.wire} />
          )}
          <T x={110} y={slotY - 5} color={ART.inkDim} ls={0.8}>
            INSERT SEND
          </T>
          <T x={150} y={199} color={ART.inkDim} ls={0.8}>
            {mode === 'parallel' ? 'RETURN · DRY + COPY' : 'RETURN · COMPRESSED ONLY'}
          </T>
        </G>
      ) : (
        <T x={190} y={110} color={ART.inkDim} ls={0.8}>
          EMPTY INSERT — THE DRUM GOES STRAIGHT ON
        </T>
      )}
      {wet ? <CompFace x={comp.x} y={comp.y} w={comp.w} settings={CRUSH} title={mode === 'parallel' ? 'PARALLEL PATH · MAKE-UP: AUTO' : 'IN SERIES · MAKE-UP: AUTO'} /> : null}
      <Strip {...strip} name="DRUM" db={0} inserts={[wet ? 'COMP' : null]} insertOn={wet ? 0 : null} />
    </ArtFrame>
  );
}

/* ════ p14 · the mix-bus chain ════════════════════════════════════════════ */

export type BusChain = { comp: CompSettings | null; driveDb: number };

/** The renderer's own static curve: hard knee, output = input above
 *  threshold divided by the ratio (mixAudio busComp). */
function busOutDb(inDb: number, c: CompSettings | null): number {
  if (!c || inDb <= c.thresholdDb) return inDb;
  return c.thresholdDb + (inDb - c.thresholdDb) / c.ratio;
}

export function BusChainArt({ chain }: { chain: BusChain }) {
  const mix = { x: 10, y: 26, w: 50, h: 170 };
  const on = chain.comp != null;
  const plot = { x: 206, y: 112, w: 120, h: 84 };
  const lo = -40;
  const px = (db: number) => plot.x + ((db - lo) / -lo) * plot.w;
  const py = (db: number) => plot.y + plot.h - ((db - lo) / -lo) * plot.h;
  let d = '';
  for (let k = 0; k <= 40; k++) {
    const i = lo + k;
    const o = Math.max(lo, busOutDb(i, chain.comp));
    d += `${k === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(o).toFixed(1)} `;
  }
  return (
    <ArtFrame
      h={216}
      a11y={
        on
          ? `Mix bus chain: a compressor at threshold ${chain.comp!.thresholdDb} dB, ratio ${chain.comp!.ratio} to 1, attack ${chain.comp!.attackMs} milliseconds, release ${chain.comp!.releaseMs} milliseconds, then ${chain.driveDb} dB of soft drive. The curve shows output against input: above the threshold the line bends to 1 over ${chain.comp!.ratio}.`
          : 'Mix bus chain bypassed: no compressor, no drive; the curve is a straight one-to-one line.'
      }
    >
      <Strip {...mix} name="MIX" db={0} cap="master" pan={null} inserts={['COMP', 'DRIVE']} insertOn={[...(on ? [0] : []), ...(chain.driveDb ? [1] : [])]} />
      <CompFace x={70} y={26} w={262} settings={chain.comp} title="BUS COMP · STEREO-LINKED · NO MAKE-UP" />
      {/* the drive stage: one knob, its real setting */}
      <G>
        <Rect x={70} y={112} width={120} height={84} rx={4} fill={chain.driveDb ? '#1d1f25' : '#15161a'} stroke={chain.driveDb ? '#4a4e57' : '#2a2d33'} strokeWidth={0.8} />
        <Knob cx={130} cy={142} r={13} frac={chain.driveDb / 18} cap={chain.driveDb ? '#c4372a' : '#3c3a33'} dim={!chain.driveDb} />
        <T x={130} y={172} color={chain.driveDb ? ART.ink : ART.inkDim}>
          DRIVE
        </T>
        <T x={130} y={186} color={chain.driveDb ? ART.amber : ART.inkDim} font={fonts.mono} ls={0}>
          {chain.driveDb ? `+${chain.driveDb} dB` : 'OFF'}
        </T>
        <T x={130} y={106} color={ART.ink} ls={1.2}>
          SATURATION
        </T>
      </G>
      {/* static curve: in → out (dB), the renderer's hard knee */}
      <Rect x={plot.x} y={plot.y} width={plot.w} height={plot.h} fill="#0b0c10" stroke="#262a33" strokeWidth={0.8} />
      <Line x1={plot.x} y1={plot.y + plot.h} x2={plot.x + plot.w} y2={plot.y} stroke="#2e3440" strokeWidth={0.8} strokeDasharray="2 2" />
      {on ? <Line x1={px(chain.comp!.thresholdDb)} y1={plot.y} x2={px(chain.comp!.thresholdDb)} y2={plot.y + plot.h} stroke={ART.amber} strokeWidth={0.7} strokeDasharray="2 2" opacity={0.7} /> : null}
      {on ? (
        <T x={px(chain.comp!.thresholdDb) - 3} y={plot.y + 12} anchor="end" color={ART.amber} ls={0.3}>
          THRESH
        </T>
      ) : null}
      <Path d={d} stroke={on ? ART.amber : ART.wire} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <T x={plot.x + plot.w / 2} y={plot.y - 6} color={ART.ink} ls={1.2}>
        COMP IN → OUT
      </T>
      <T x={plot.x} y={plot.y + plot.h + 12} anchor="start" color={ART.inkDim} font={fonts.mono} ls={0}>
        −40
      </T>
      <T x={plot.x + plot.w} y={plot.y + plot.h + 12} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
        0 dB IN
      </T>
    </ArtFrame>
  );
}

/* ════ p17 · the null test ════════════════════════════════════════════════ */

/** Residue meter scale: 0 dB at the top, −120 dB at the floor. */
const NULL_FLOOR = -120;

export function NullTestArt({ result }: { result: { linear: number; withBus: number } | null }) {
  const rhythm = { x: 8, y: 22, w: 48, h: 96 };
  const music = { x: 62, y: 22, w: 56, h: 96 };
  const full = { x: 166, y: 22, w: 52, h: 96 };
  const s1 = { x: 60, y: 146 };
  const s2 = { x: 192, y: 176 };
  const meters = [
    { x: 266, label: 'CLEAN BUS', v: result?.linear ?? null },
    { x: 306, label: 'BUS COMP', v: result?.withBus ?? null },
  ];
  const mTop = 30;
  const mH = 150;
  const my = (db: number) => mTop + (Math.min(0, Math.max(NULL_FLOOR, db)) / NULL_FLOOR) * mH;
  return (
    <ArtFrame
      h={206}
      a11y={`Null test: the rhythm stem and the music stem are summed, then added to the full mix with its polarity flipped. What survives is the residue, on two meters: ${
        result ? `clean bus ${result.linear.toFixed(0)} dB, bus compressor ${result.withBus.toFixed(0)} dB` : 'not measured yet'
      }.`}
    >
      <Wire pts={[outPin(rhythm), { x: rhythm.x + rhythm.w / 2, y: s1.y }, { x: s1.x - 7, y: s1.y }]} />
      <Wire pts={[outPin(music), { x: music.x + music.w / 2, y: s1.y }, { x: s1.x + 7, y: s1.y }]} />
      <Sum x={s1.x} y={s1.y} />
      <Wire pts={[{ x: s1.x, y: s1.y + 7 }, { x: s1.x, y: s2.y }, { x: s2.x - 7, y: s2.y }]} />
      <Wire pts={[outPin(full), { x: full.x + full.w / 2, y: 136 }, { x: s2.x, y: 136 }, { x: s2.x, y: s2.y - 7 }]} color={ART.amber} />
      <T x={full.x + full.w / 2 - 6} y={150} color={ART.amber} anchor="end">
        Ø FLIPPED
      </T>
      <Sum x={s2.x} y={s2.y} />
      <Wire pts={[{ x: s2.x + 7, y: s2.y }, { x: 230, y: s2.y }]} />
      <Strip {...rhythm} name="RHYTHM" db={0} cap="bus" pan={null} />
      <Strip {...music} name="MUSIC+VOX" db={0} cap="bus" pan={null} />
      <Strip {...full} name="FULL MIX" db={0} cap="master" pan={null} inserts={['COMP']} insertOn={0} />
      <Btn x={full.x + full.w / 2 - 3} y={full.y + 24} lit={ART.amber} />
      <T x={full.x + full.w / 2} y={14} color={ART.amber} ls={0.3}>
        COMP: 2ND RUN ONLY
      </T>
      {/* the residue meters */}
      {meters.map((m) => (
        <G key={m.label}>
          <Rect x={m.x} y={mTop} width={16} height={mH} rx={2} fill="#0b0c10" stroke="#262a33" strokeWidth={0.8} />
          {m.v != null ? <Rect x={m.x + 1.5} y={my(m.v)} width={13} height={mTop + mH - my(m.v)} rx={1} fill={levelColorForDb(m.v, NULL_FLOOR, 0)} opacity={0.9} /> : null}
          <T x={m.x + 8} y={mTop + mH + 13} color={m.v == null ? ART.inkDim : m.v < -60 ? ART.green : ART.amber} font={fonts.mono} ls={0}>
            {m.v == null ? '—' : `${m.v.toFixed(0)}`}
          </T>
          <T x={m.x + 8} y={mTop + mH + 25} color={ART.inkDim} ls={0.3}>
            {m.label === 'CLEAN BUS' ? 'CLEAN' : 'COMP'}
          </T>
        </G>
      ))}
      {[0, -60, -120].map((t) => (
        <T key={t} x={meters[0].x - 4} y={my(t) + 3.5} anchor="end" color={ART.inkDim} font={fonts.mono} ls={0}>
          {t === 0 ? '0' : `${t}`}
        </T>
      ))}
      <T x={(meters[0].x + meters[1].x + 16) / 2} y={18} color={ART.ink} ls={1.2}>
        RESIDUE dB
      </T>
    </ArtFrame>
  );
}

function Sum({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={7} fill="#15171c" stroke={ART.wire} strokeWidth={1.2} />
      <Line x1={x - 3.5} y1={y} x2={x + 3.5} y2={y} stroke={ART.ink} strokeWidth={1.4} />
      <Line x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} stroke={ART.ink} strokeWidth={1.4} />
    </G>
  );
}

/* ════ p19 · case 3, the buried vocal ═════════════════════════════════════ */

/** The buried-vocal case as the console shows it: the two competitors'
 *  faders, the lead's reverb send and the reverb RETURN, flawed or repaired
 *  (the case's real settings). Until the learner has answered the check or
 *  played the repair, the flawed view shows the console WITHOUT its numbers
 *  — the page asks for a diagnosis by ear first (review 2026-10-16). */
export function BuriedArt({ fixed, reveal }: { fixed: boolean; reveal: boolean }) {
  const gtr = fixed ? -1 : 5;
  const keys = fixed ? -2 : 4;
  const send = fixed ? -14 : 0;
  const ret = fixed ? -6 : 2;
  const show = reveal || fixed;
  const strips = [
    { x: 14, name: 'GTR', db: gtr, cap: 'ch' as const, send: null as number | null },
    { x: 76, name: 'KEYS', db: keys, cap: 'ch' as const, send: null as number | null },
    { x: 138, name: 'LEAD', db: 0, cap: 'ch' as const, send },
    { x: 258, name: 'VERB', db: ret, cap: 'ret' as const, send: null as number | null },
  ];
  const y = 22;
  const h = 150;
  const fmt = (db: number) => `${db > 0 ? '+' : db < 0 ? '−' : ''}${Math.abs(db)} dB`;
  return (
    <ArtFrame
      h={212}
      a11y={
        show
          ? `${fixed ? 'Repaired' : 'Flawed'} console: guitar fader ${fmt(gtr)}, keys fader ${fmt(keys)}, lead vocal fader 0 dB with its reverb send at ${fmt(send)}, reverb return ${fmt(ret)}${fixed ? ', a tight room' : ', a big hall'}.`
          : 'The flawed console: guitar, keys and lead faders, the lead reverb send and the reverb return. Values hidden until you answer the check or play the repair.'
      }
    >
      {/* the lead's post-fader send → the reverb return */}
      <Wire pts={[{ x: 188, y: y + 11.5 }, { x: 258, y: y + 11.5 }]} color={show && !fixed ? ART.amber : ART.wire} />
      <T x={223} y={y + 6} color={show && !fixed ? ART.amber : ART.inkDim} ls={0.4}>
        {show ? `SEND ${fmt(send)}` : 'SEND'}
      </T>
      {strips.map((s) => (
        <G key={s.name}>
          <Strip
            x={s.x}
            y={y}
            w={50}
            h={h}
            name={s.name}
            db={s.db}
            cap={s.cap}
            pan={s.cap === 'ret' ? null : undefined}
            sends={s.send != null ? [{ frac: (s.send + 40) / 50, cap: '#3fae7a' }] : s.cap === 'ret' ? [] : [{ frac: 0, cap: '#3a3e46' }]}
          />
          <T x={s.x + 25} y={y + h + 16} color={show && s.db > 0 ? ART.amber : ART.ink} font={fonts.mono} ls={0}>
            {show ? fmt(s.db) : '?'}
          </T>
        </G>
      ))}
      <T x={88} y={y + h + 34} color={ART.inkDim} ls={0.5}>
        CHANNEL FADERS
      </T>
      <T x={283} y={y + h + 34} color={ART.inkDim} ls={0.5}>
        {show ? (fixed ? 'RETURN · ROOM' : 'RETURN · HALL') : 'RETURN'}
      </T>
    </ArtFrame>
  );
}
