/** Speech & Voice Lab — modules 6–10 + checks: pop filters, sibilance, distance, voices, problem simulator. */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import {
  DISTANCE_PRESETS, PROBLEMS, SPEECH_CHECKS, VOICE_RANGES, distanceEffect, plosiveTrace, problemSpectrum, problemTrace, voiceSpectrum, type ProblemId,
} from '../../../features/speech/speechModel';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { RangeBars, SpectrumBars, TraceChart } from './speechViz';
import { Notice, SpeechCheckCard } from './speechPagesA';

const F = fonts.barlowMedium;

// NEW COPY: every Notice line in this file.

/* ── 6 pop filters ─────────────────────────────────────────────────────── */

/** Mouth → (pop filter) → capsule. Orange streamlines are the air JET; cyan
 *  arcs are the SOUND wavefronts, which pass the mesh untouched either way.
 *  Exported for the design harness; not used elsewhere. */
export function PopFilterDiagram({ withFilter }: { withFilter: boolean }) {
  const W = 340, H = 118;
  const mx = 44, my = 62; // mouth
  const fx = 148; // filter plane
  const cx = 236; // capsule front
  const arc = (r: number) => {
    const a = (40 * Math.PI) / 180;
    const x1 = mx + r * Math.cos(-a), y1 = my + r * Math.sin(-a);
    const x2 = mx + r * Math.cos(a), y2 = my + r * Math.sin(a);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const jetEnd = withFilter ? fx - 6 : cx - 2;
  const head = (x: number, y: number, dy: number) => `M ${x} ${y} l -7 ${-3.5 + dy} l 0 7 z`;
  return (
    <View accessible accessibilityLabel={withFilter ? 'Mouth, then a pop filter mesh, then the microphone capsule: the air jet is broken up at the mesh and arrives as weak turbulence; the sound wavefronts pass through unchanged.' : 'Mouth directly in front of the microphone capsule: the air jet arrives at the capsule as one push, together with the sound.'}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {/* face profile (nose, lips, chin) at the left edge */}
        <Path d="M 1 8 C 14 14 24 24 30 34 C 36 42 30 46 32 50 C 40 52 42 58 36 62 C 42 66 42 72 34 74 C 30 84 20 96 8 110 L 1 110 Z" fill="#17181d" stroke="#3d3f48" strokeWidth={1.2} />
        <Path d="M 33 51 C 40 52 42 57 36 61 Z" fill="#d78a80" />
        <Path d="M 36 63 C 42 66 42 71 34 73 Z" fill="#d78a80" />
        <SvgText x={20} y={104} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>"P"</SvgText>
        {/* sound wavefronts — pass either way */}
        {[28, 52, 76, 100, 124, 148, 172].map((r) => <Path key={r} d={arc(r)} fill="none" stroke={colors.cyanBright} strokeWidth={1.1} opacity={0.5} />)}
        {/* air jet streamlines */}
        {[-1, 0, 1].map((k) => {
          const y1 = my + k * 3, y2 = my + k * (withFilter ? 9 : 14);
          return (
            <G key={k}>
              <Path d={`M ${mx + 2} ${y1} C ${mx + 40} ${y1} ${jetEnd - 40} ${y2} ${jetEnd} ${y2}`} fill="none" stroke={colors.orange} strokeWidth={1.8} opacity={0.9} />
              <Path d={head(jetEnd, y2, 0)} fill={colors.orange} />
            </G>
          );
        })}
        {withFilter ? (
          <>
            {/* the mesh, seen edge-on, and the scattered air behind it */}
            <Rect x={fx - 3} y={12} width={7} height={86} rx={3.5} fill="#26262b" stroke={colors.textSecondary} strokeWidth={1} />
            {Array.from({ length: 15 }, (_, i) => <Line key={i} x1={fx - 1.5} y1={17 + i * 5.5} x2={fx + 1.5} y2={17 + i * 5.5} stroke={colors.textMuted} strokeWidth={0.8} />)}
            {[[158, 40, 170, 32], [160, 56, 172, 60], [158, 72, 168, 82], [166, 48, 178, 44], [168, 66, 180, 72], [176, 56, 188, 58]].map(([x1, y1, x2, y2]) => (
              <Line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.orange} strokeWidth={1.2} opacity={0.45} strokeLinecap="round" />
            ))}
            <SvgText x={fx} y={110} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>pop filter</SvgText>
          </>
        ) : null}
        {/* microphone: body, grille, diaphragm */}
        <Rect x={cx} y={14} width={78} height={82} rx={12} fill="#1c1c22" stroke={colors.textMuted} strokeWidth={1} />
        <Rect x={cx + 6} y={22} width={62} height={66} rx={9} fill="#121216" stroke="#3a3a42" strokeWidth={1} />
        {[30, 38, 46, 54, 62, 70, 78].map((y) => <Line key={y} x1={cx + 10} y1={y} x2={cx + 64} y2={y} stroke="#2a2a32" strokeWidth={1} />)}
        <Line x1={cx + 14} y1={30} x2={cx + 14} y2={80} stroke={withFilter ? colors.cyanBright : colors.orange} strokeWidth={2.5} strokeLinecap="round" />
        <SvgText x={cx + 39} y={110} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>capsule</SvgText>
        {/* legend */}
        <SvgText x={64} y={14} fontSize={8.5} fill={colors.orange} fontFamily={F}>— air jet</SvgText>
        <SvgText x={112} y={14} fontSize={8.5} fill={colors.cyanBright} fontFamily={F}>) sound</SvgText>
      </Svg>
    </View>
  );
}

export function PagePopFilter({ ctx }: { ctx: PageCtx }) {
  const [withFilter, setWithFilter] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Lead>A "P" is two things at once: a small sound, and a gust of air. The microphone hears both — the gust as a huge low thump.</Lead>
      <Row>
        <Btn label="NO FILTER" tone={!withFilter ? 'primary' : 'plain'} onPress={() => { setWithFilter(false); if (!ctx.isDone) ctx.markDone(); }} />
        <Btn label="WITH A POP FILTER" tone={withFilter ? 'primary' : 'plain'} onPress={() => { setWithFilter(true); if (!ctx.isDone) ctx.markDone(); }} />
      </Row>
      <PopFilterDiagram withFilter={withFilter} />
      <TraceChart samples={plosiveTrace(240, withFilter)} title={withFilter ? 'AT THE CAPSULE · FILTERED' : 'AT THE CAPSULE · BARE'} a11y={withFilter ? 'Waveform: a small click then the vowel; no low-frequency hump.' : 'Waveform: a huge slow hump — the air blast — swamping the click and the vowel, reaching nearly full scale.'} />
      <Notice>The tiny click at the very start is identical in both traces. The filter removes the slow hump, not the consonant — and notice how close to full scale the bare hump gets.</Notice>
      <Card>
        <Eyebrow>WHY THE MESH WORKS</Eyebrow>
        <Body>Sound is a tiny pressure ripple that passes through a fine mesh almost untouched. The plosive gust is a stream of moving air; the mesh breaks the stream into turbulence and spreads it out, so the jet never arrives at the capsule as one push. The consonant stays, the thump goes.</Body>
        <Body>Same idea, other tools: a foam windscreen, speaking slightly past the capsule instead of into it, or a mic placed above the mouth line.</Body>
      </Card>
    </View>
  );
}

/* ── 7 sibilance ───────────────────────────────────────────────────────── */

export function PageSibilance({ ctx }: { ctx: PageCtx }) {
  const clean = voiceSpectrum(40);
  const sib = problemSpectrum('sibilance', 40);
  const [show, setShow] = useState<'vowel' | 's'>('s');
  const sp = show === 's' ? sib : clean;
  return (
    <View style={{ gap: 12 }}>
      <Lead>Say a long "sss". No pitch, just hiss — air squeezed through a narrow gap and broken up on the edge of the teeth. That turbulence is sibilance.</Lead>
      <Row>
        <Btn label="VOWEL · AH" tone={show === 'vowel' ? 'primary' : 'plain'} onPress={() => { setShow('vowel'); if (!ctx.isDone) ctx.markDone(); }} />
        <Btn label={'"S"'} tone={show === 's' ? 'primary' : 'plain'} onPress={() => { setShow('s'); if (!ctx.isDone) ctx.markDone(); }} a11y="The S sound" />
      </Row>
      <SpectrumBars hz={sp.hz} mag={sp.mag} ghost={show === 's' ? clean.mag : undefined} band={[4000, 10000]} bandKind="excess" bandLabel="S LIVES HERE" title={show === 's' ? '"S" · ENERGY 4–10 kHz · VOWEL IN GREY' : 'VOWEL · ENERGY BELOW 1 kHz'} a11y={show === 's' ? 'Spectrum of an S: most energy between 4 and 10 kilohertz, far above the vowel.' : 'Spectrum of a vowel: energy mostly below 1 kilohertz; the 4 to 10 kilohertz band is nearly empty.'} />
      <Notice>Flip between the two: the vowel and the S barely overlap. That gap is what a de-esser exploits — and what a presence boost accidentally targets.</Notice>
      <Card>
        <Eyebrow>WHY IT EXISTS</Eyebrow>
        <Body>The tongue almost touches the ridge behind the upper teeth, leaving a channel a millimetre or two wide. Air forced through it goes turbulent and hits the teeth — a noise source whose energy sits roughly between 4 and 10 kHz, where the ear is most sensitive.</Body>
        <Eyebrow>WHY IT GETS WORSE</Eyebrow>
        <Body>Bright condenser microphones and presence boosts lift exactly that band. Close placement puts the mic in the jet. Some voices and some dental shapes simply make more of it.</Body>
        <Eyebrow>WHAT TO DO</Eyebrow>
        <Body>Placement first: a few degrees off-axis, a little more distance. Then EQ gently. Then a de-esser — a compressor that listens only to the hiss band. The De-Esser lab shows how it decides.</Body>
      </Card>
    </View>
  );
}

/* ── 8 distance ────────────────────────────────────────────────────────── */

/** Horizontal signed-dB bars with a labelled axis. Exported for the design
 *  harness; not used elsewhere. */
export function DbBars({ rows }: { rows: { label: string; db: number; color: string }[] }) {
  const W = 340, rowH = 26, H = rows.length * rowH + 26;
  const lo = -40, hi = 66;
  const x = (db: number) => 96 + ((Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * (W - 106);
  // A positive value's label sits just past the bar tip; when that would run
  // off the panel it flips INSIDE the bar (black on the bar colour) instead.
  const LABEL_W = 36;
  const inside = (db: number) => db >= 0 && x(db) + 4 + LABEL_W > W - 6;
  const labelX = (db: number) => (db < 0 ? x(db) - 4 : inside(db) ? x(db) - 4 : x(db) + 4);
  const ticks = [-40, -20, 0, 20, 40, 60];
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={x(t)} y1={4} x2={x(t)} y2={H - 18} stroke={t === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'} />
          <SvgText x={x(t)} y={H - 6} fontSize={8.5} fill={t === 0 ? colors.textSecondary : colors.textMuted} textAnchor="middle" fontFamily={F}>{t > 0 ? `+${t}` : t}{t === 0 ? ' dB' : ''}</SvgText>
        </G>
      ))}
      {rows.map((r, i) => {
        const y = 6 + i * rowH;
        const x0 = Math.min(x(0), x(r.db)), w = Math.abs(x(r.db) - x(0));
        const flipped = inside(r.db);
        return (
          <G key={r.label}>
            <SvgText x={90} y={y + 13} fontSize={9} fill={colors.textSecondary} textAnchor="end" fontFamily={F}>{r.label}</SvgText>
            <Rect x={x0} y={y + 3} width={Math.max(1.5, w)} height={14} rx={3} fill={r.color} opacity={flipped ? 0.9 : 0.75} />
            <SvgText x={labelX(r.db)} y={y + 13} fontSize={8.5} fill={flipped ? '#000' : r.color} textAnchor={r.db >= 0 && !flipped ? 'start' : 'end'} fontFamily={F}>{r.db > 0 ? '+' : ''}{r.db.toFixed(0)} dB</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export function PageDistance({ ctx }: { ctx: PageCtx }) {
  const [inches, setInches] = useState<number>(6);
  const d = distanceEffect(inches);
  const rows = [
    { label: 'Direct voice', db: d.directDb, color: colors.cyanBright },
    { label: 'Room (reflections)', db: d.roomDb, color: colors.textSecondary },
    { label: 'Plosive air', db: d.plosiveDb, color: colors.orange },
    { label: 'Proximity bass', db: d.proximityDb, color: colors.gold },
    { label: 'Voice over noise', db: d.snrDb, color: colors.green },
  ];
  return (
    <View style={{ gap: 12 }}>
      <Lead>Distance is the biggest control you have and it costs nothing. Every value here is relative to the voice at 12 inches.</Lead>
      <Row>
        {DISTANCE_PRESETS.map((p) => <Btn key={p} label={`${p}"`} tone={inches === p ? 'primary' : 'plain'} onPress={() => { setInches(p); if (!ctx.isDone) ctx.markDone(); }} a11y={`${p} inch${p === 1 ? '' : 'es'}`} />)}
      </Row>
      <View accessible accessibilityLabel={`At ${inches} inches: direct voice ${d.directDb.toFixed(0)} dB, room ${d.roomDb} dB, plosive air ${d.plosiveDb.toFixed(0)} dB, proximity bass ${d.proximityDb.toFixed(0)} dB, voice over noise ${d.snrDb.toFixed(0)} dB, all relative and illustrative.`}>
        <DbBars rows={rows} />
      </View>
      <Text style={styles.foot}>Relative, illustrative values — inverse-square for the voice, a much steeper fall for the air jet, a typical cardioid proximity curve, a fixed room and noise floor.</Text>
      <Notice>Switch between 12", 6" and 1" and watch two bars: the room never moves, and the plosive bar moves far faster than the voice.</Notice>
      <Card>
        <Eyebrow>{inches}" · WHAT CHANGES</Eyebrow>
        <Body>{inches === 1
          ? 'Very close: the voice is loud and dry and the room disappears — but every plosive is a gust in the capsule, the bass lift is large, and moving an inch changes everything.'
          : inches === 6
            ? 'The working distance for most speech: strong direct sound, the room well below it, plosives mostly harmless, a modest warmth from proximity. A pop filter still earns its place.'
            : 'A hand-span away: natural and forgiving of movement, but the room is only about 14 dB down and the gain you add to compensate brings the noise up with it.'}</Body>
        <Body>Direct sound falls 6 dB per doubling of distance; the reverberant room does not fall at all. That ratio — direct to room — is what "close" and "far" actually sound like.</Body>
      </Card>
      <SpeechCheckCard id="distance-6in" />
    </View>
  );
}

/* ── 9 voices ──────────────────────────────────────────────────────────── */

export function PageVoices({ ctx }: { ctx: PageCtx }) {
  const cols = [colors.blue, colors.gold, colors.green];
  return (
    <View style={{ gap: 12 }}>
      <Lead>Pitch comes from fold length and mass; formant height comes from vocal-tract length. Both vary from person to person far more than the labels suggest.</Lead>
      <RangeBars
        loHz={60}
        hiHz={520}
        ranges={VOICE_RANGES.map((r, i) => ({ name: r.name, lo: r.f0LoHz, hi: r.f0HiHz, typical: r.f0TypicalHz, color: cols[i] }))}
        a11y={`Typical speaking pitch ranges: ${VOICE_RANGES.map((r) => `${r.name} ${r.f0LoHz} to ${r.f0HiHz} hertz, typical about ${r.f0TypicalHz}`).join('; ')}. Typical, overlapping in real people, not fixed.`}
      />
      <Notice>The bands nearly touch and real voices spill past their edges — the gaps between them are an artefact of averaging, not a rule.</Notice>
      <Card tone="warn">
        <Eyebrow>TYPICAL, NOT FIXED</Eyebrow>
        <Body>These are population averages for speaking pitch. Real voices overlap freely: a low female voice sits inside the male band, a high male voice reaches into the female band, and a child's range depends on age. Treat the bands as starting points for gain and EQ, never as rules about the person.</Body> // NEW COPY ("a tenor speaks above many women" replaced — true of singing range, not speaking pitch)
      </Card>
      {VOICE_RANGES.map((r) => (
        <Card key={r.id}>
          <Eyebrow>{r.name.toUpperCase()} · ~{r.f0TypicalHz} Hz</Eyebrow>
          <Body>{r.note}</Body>
        </Card>
      ))}
      <Body>For the engineer: a lower fundamental puts more energy in the bottom octaves (mind the proximity effect and the high-pass filter); higher formants push the presence region up — sibilance sits a little higher too.</Body>
      {!ctx.isDone ? <Btn label="GOT IT ›" tone="primary" onPress={ctx.markDone} /> : null}
    </View>
  );
}

/* ── 10 problem simulator ─────────────────────────────────────────────── */

export function PageProblems({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState<ProblemId>('sibilance');
  const p = PROBLEMS.find((o) => o.id === id)!;
  const clean = voiceSpectrum(40);
  const sp = problemSpectrum(id, 40);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Eight things that go wrong between a mouth and a microphone. Each has a cause you can see, and a fix that starts before any processing.</Lead>
      <Row>
        {PROBLEMS.map((o) => <Btn key={o.id} label={o.name.toUpperCase()} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      {p.visual === 'spectrum'
        ? <SpectrumBars hz={sp.hz} mag={sp.mag} ghost={clean.mag} band={p.band ? [p.band.lo, p.band.hi] : undefined} bandKind={p.band?.kind} bandLabel={p.band?.label} title={`${p.name.toUpperCase()} · VS A CLEAN VOICE (GREY)`} a11y={`Spectrum with ${p.name} compared to a clean voice. ${p.see}`} />
        : <TraceChart samples={problemTrace(id)} title={`${p.name.toUpperCase()} · WAVEFORM`} a11y={`Waveform showing ${p.name}. ${p.see}`} />}
      <Notice>{p.see}</Notice>
      <Card>
        <Eyebrow>CAUSE</Eyebrow>
        <Body>{p.cause}</Body>
        <Eyebrow>WHAT YOU HEAR</Eyebrow>
        <Body>{p.hear}</Body>
        <Eyebrow>FIX</Eyebrow>
        <Body>{p.fix}</Body>
      </Card>
    </View>
  );
}

/* ── checks ────────────────────────────────────────────────────────────── */

const FINAL_CHECKS = SPEECH_CHECKS.filter((c) => c.where === 'final');
const PASS_MARK = 5;

export function PageSpeechChecks({ ctx }: { ctx: PageCtx }) {
  const [n, setN] = useState(0);
  const bump = () => setN((c) => { if (c + 1 >= PASS_MARK) ctx.markDone(); return c + 1; });
  return (
    <View style={{ gap: 12 }}>
      <Lead>Seven checks, one per idea, in a fresh order each visit. Wrong picks explain themselves — read the note, then try again.</Lead>
      <Text style={styles.foot} accessibilityLiveRegion="polite">{n} of {FINAL_CHECKS.length} correct{ctx.isDone ? ' · page complete' : ` · ${PASS_MARK} completes the page`}</Text>
      {FINAL_CHECKS.map((c) => <SpeechCheckCard key={c.id} id={c.id} onCorrect={bump} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
});
