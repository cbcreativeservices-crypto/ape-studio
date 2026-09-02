/** Speech & Voice Lab — modules 6–10 + checks: pop filters, sibilance, distance, voices, problem simulator. */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import {
  DISTANCE_PRESETS, PROBLEMS, VOICE_RANGES, distanceEffect, plosiveTrace, problemSpectrum, problemTrace, voiceSpectrum, type ProblemId,
} from '../../../features/speech/speechModel';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { RangeBars, SpectrumBars, TraceChart } from './speechViz';

const F = fonts.barlowMedium;

/* ── 6 pop filters ─────────────────────────────────────────────────────── */

function PopFilterDiagram({ withFilter }: { withFilter: boolean }) {
  const W = 340, H = 110;
  return (
    <View accessible accessibilityLabel={withFilter ? 'Mouth, then a pop filter mesh, then the microphone capsule: the air blast is broken up before it reaches the capsule; the sound passes.' : 'Mouth directly in front of the microphone capsule: the air blast hits the capsule.'}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {/* mouth */}
        <Path d="M 30 40 C 50 30 60 55 30 70" stroke="#d78a80" strokeWidth={5} fill="none" strokeLinecap="round" />
        <SvgText x={34} y={92} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>"P"</SvgText>
        {/* air blast */}
        {[0, 1, 2].map((i) => (
          <Polyline key={i} points={`${62 + i * 22},${44 + i * 5} ${76 + i * 22},55 ${62 + i * 22},${66 - i * 5}`} fill="none" stroke={colors.orange} strokeWidth={2} opacity={withFilter && i === 2 ? 0.25 : 0.9} />
        ))}
        {/* sound (wavefront arcs) */}
        {[0, 1, 2, 3].map((i) => <Path key={i} d={`M ${90 + i * 40} 30 C ${100 + i * 40} 45 ${100 + i * 40} 65 ${90 + i * 40} 80`} stroke={colors.cyanBright} strokeWidth={1.2} fill="none" opacity={0.6} />)}
        {/* filter */}
        {withFilter ? (
          <>
            <Line x1={150} y1={18} x2={150} y2={92} stroke={colors.textSecondary} strokeWidth={3} strokeDasharray="3,3" />
            <SvgText x={150} y={104} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>pop filter</SvgText>
          </>
        ) : null}
        {/* air after the filter */}
        {withFilter ? [0, 1, 2, 3].map((i) => <Line key={i} x1={158} y1={30 + i * 16} x2={168} y2={26 + i * 16 + (i % 2 ? 10 : -6)} stroke={colors.orange} strokeWidth={1.2} opacity={0.5} />) : (
          <Polyline points="200,40 226,55 200,70" fill="none" stroke={colors.orange} strokeWidth={2.5} />
        )}
        {/* capsule */}
        <Rect x={236} y={34} width={54} height={42} rx={8} fill="#1c1c22" stroke={colors.textMuted} />
        <Line x1={244} y1={40} x2={244} y2={70} stroke={withFilter ? colors.cyanBright : colors.orange} strokeWidth={2.5} />
        <SvgText x={263} y={92} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>capsule</SvgText>
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
      <TraceChart samples={plosiveTrace(240, withFilter)} title={withFilter ? 'AT THE CAPSULE · FILTERED' : 'AT THE CAPSULE · BARE'} a11y={withFilter ? 'Waveform: a small click then the vowel; no low-frequency hump.' : 'Waveform: a huge slow hump — the air blast — swamping the click and the vowel.'} color={withFilter ? colors.cyanBright : colors.orange} />
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
        <Btn label={'"S"'} tone={show === 's' ? 'primary' : 'plain'} onPress={() => { setShow('s'); if (!ctx.isDone) ctx.markDone(); }} />
      </Row>
      <SpectrumBars hz={sp.hz} mag={sp.mag} ghost={show === 's' ? clean.mag : undefined} band={[4000, 10000]} title={show === 's' ? '"S" · ENERGY 4–10 kHz' : 'VOWEL · ENERGY BELOW 1 kHz'} a11y={show === 's' ? 'Spectrum of an S: most energy between 4 and 10 kilohertz, far above the vowel.' : 'Spectrum of a vowel: energy mostly below 1 kilohertz.'} />
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

function DbBars({ rows }: { rows: { label: string; db: number; color: string; note: string }[] }) {
  const W = 340, rowH = 26, H = rows.length * rowH + 10;
  const lo = -40, hi = 66;
  const x = (db: number) => 96 + ((Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * (W - 106);
  const labelX = (db: number) => (db >= 0 ? Math.min(x(db) + 4, W - 34) : x(db) - 4);
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
      <Line x1={x(0)} y1={4} x2={x(0)} y2={H - 4} stroke="rgba(255,255,255,0.18)" />
      {rows.map((r, i) => {
        const y = 6 + i * rowH;
        const x0 = Math.min(x(0), x(r.db)), w = Math.abs(x(r.db) - x(0));
        return (
          <G key={r.label}>
            <SvgText x={90} y={y + 13} fontSize={9} fill={colors.textSecondary} textAnchor="end" fontFamily={F}>{r.label}</SvgText>
            <Rect x={x0} y={y + 3} width={Math.max(1.5, w)} height={14} rx={3} fill={r.color} opacity={0.75} />
            <SvgText x={labelX(r.db)} y={y + 13} fontSize={8.5} fill={r.db >= 0 && labelX(r.db) < x(r.db) + 4 ? '#000' : r.color} textAnchor={r.db >= 0 ? 'start' : 'end'} fontFamily={F}>{r.db > 0 ? '+' : ''}{r.db.toFixed(0)} dB</SvgText>
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
    { label: 'Direct voice', db: d.directDb, color: colors.cyanBright, note: '' },
    { label: 'Room (reflections)', db: d.roomDb, color: colors.textSecondary, note: '' },
    { label: 'Plosive air', db: d.plosiveDb, color: colors.orange, note: '' },
    { label: 'Proximity bass', db: d.proximityDb, color: colors.gold, note: '' },
    { label: 'Voice over noise', db: d.snrDb, color: colors.green, note: '' },
  ];
  return (
    <View style={{ gap: 12 }}>
      <Lead>Distance is the biggest control you have and it costs nothing. Every value here is relative to the voice at 12 inches.</Lead>
      <Row>
        {DISTANCE_PRESETS.map((p) => <Btn key={p} label={`${p}"`} tone={inches === p ? 'primary' : 'plain'} onPress={() => { setInches(p); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      <View accessible accessibilityLabel={`At ${inches} inches: direct voice ${d.directDb.toFixed(0)} dB, room ${d.roomDb} dB, plosive air ${d.plosiveDb.toFixed(0)} dB, proximity bass ${d.proximityDb.toFixed(0)} dB, voice over noise ${d.snrDb.toFixed(0)} dB, all relative and illustrative.`}>
        <DbBars rows={rows} />
      </View>
      <Text style={styles.foot}>Relative, illustrative values — inverse-square for the voice, a much steeper fall for the air jet, a typical cardioid proximity curve, a fixed room and noise floor.</Text>
      <Card>
        <Eyebrow>{inches}" · WHAT CHANGES</Eyebrow>
        <Body>{inches === 1
          ? 'Very close: the voice is loud and dry and the room disappears — but every plosive is a gust in the capsule, the bass lift is large, and moving an inch changes everything.'
          : inches === 6
            ? 'The working distance for most speech: strong direct sound, the room well below it, plosives mostly harmless, a modest warmth from proximity. A pop filter still earns its place.'
            : 'A hand-span away: natural and forgiving of movement, but the room is only about 14 dB down and the gain you add to compensate brings the noise up with it.'}</Body>
        <Body>Direct sound falls 6 dB per doubling of distance; the reverberant room does not fall at all. That ratio — direct to room — is what "close" and "far" actually sound like.</Body>
      </Card>
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
        a11y={`Typical speaking pitch ranges: ${VOICE_RANGES.map((r) => `${r.name} ${r.f0LoHz} to ${r.f0HiHz} hertz`).join('; ')}. Typical, overlapping in real people, not fixed.`}
      />
      <Card tone="warn">
        <Eyebrow>TYPICAL, NOT FIXED</Eyebrow>
        <Body>These are population averages for speaking pitch. Real voices overlap freely: a low female voice sits inside the male band, a tenor speaks above many women, and a child's range depends on age. Treat the bands as starting points for gain and EQ, never as rules about the person.</Body>
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
  const bandFor: Partial<Record<ProblemId, [number, number]>> = { sibilance: [4000, 10000], nasality: [800, 1500], muffled: [2000, 12000], offaxis: [3000, 12000] };
  return (
    <View style={{ gap: 12 }}>
      <Lead>Eight things that go wrong between a mouth and a microphone. Each has a cause you can see, and a fix that starts before any processing.</Lead>
      <Row>
        {PROBLEMS.map((o) => <Btn key={o.id} label={o.name} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      {p.visual === 'spectrum'
        ? <SpectrumBars hz={sp.hz} mag={sp.mag} ghost={clean.mag} band={bandFor[id]} title={`${p.name.toUpperCase()} · VS A CLEAN VOICE (GREY)`} a11y={`Spectrum with ${p.name} compared to a clean voice. ${p.hear}`} />
        : <TraceChart samples={problemTrace(id)} title={`${p.name.toUpperCase()} · WAVEFORM`} a11y={`Waveform showing ${p.name}. ${p.hear}`} color={colors.orange} />}
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

export function PageSpeechChecks({ ctx }: { ctx: PageCtx }) {
  const [, setN] = useState(0);
  const bump = () => setN((c) => { if (c + 1 >= 3) ctx.markDone(); return c + 1; });
  return (
    <View style={{ gap: 12 }}>
      <Lead>Four quick checks.</Lead>
      <UnderstandingCheck question="What is the difference between S and Z?" options={['Tongue position', 'Whether the vocal folds are vibrating', 'Lip rounding', 'Breath pressure only']} correct={1} explain="Same mouth shape — Z adds the buzz of the vocal folds; S is air turbulence alone." onCorrect={bump} />
      <UnderstandingCheck question="What sets which vowel you hear?" options={['The pitch of the voice', 'The loudness', 'The formants — resonances set by the tongue and mouth shape', 'The length of the sound']} correct={2} explain="The folds set the pitch; the mouth shape sets the formant peaks, and those peaks are the vowel." onCorrect={bump} />
      <UnderstandingCheck question="Why does a pop filter stop plosives but not the voice?" options={['It blocks low frequencies', 'It breaks up the moving air stream while the sound pressure passes through the mesh', 'It absorbs treble', 'It moves the mic further away']} correct={1} explain="Sound is a pressure ripple that passes the mesh; the gust is moving air that the mesh disperses." onCorrect={bump} />
      <UnderstandingCheck question="Moving from 12 inches to 6 inches, what happens to the direct voice and the room?" options={['Both rise 6 dB', 'The voice rises about 6 dB; the room stays about the same', 'The room rises, the voice stays', 'Nothing until you touch the gain']} correct={1} explain="Direct sound follows the inverse-square law; the reverberant room is roughly constant with distance, so the ratio improves." onCorrect={bump} />
    </View>
  );
}

const styles = StyleSheet.create({
  foot: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
});
