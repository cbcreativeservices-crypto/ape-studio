/** Speech & Voice Lab — modules 1–5: anatomy, production, voicing, vowels, consonants. */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Polygon, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { ANATOMY, CONSONANTS, PRODUCTION, VOICED_PAIRS, VOWELS, type Vowel } from '../../../features/speech/speechModel';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { FormantChart, HeadCrossSection, VocalFolds } from './speechViz';

const F = fonts.barlowMedium;

/* ── 1 anatomy ─────────────────────────────────────────────────────────── */

export function PageAnatomy({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string | null>(null);
  const part = ANATOMY.find((a) => a.id === sel);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Speech is air, a buzz, a set of resonating cavities and a few fast-moving parts. Tap a number to see what each one does.</Lead>
      <HeadCrossSection selected={sel} onSelect={(id) => { setSel(id); if (!ctx.isDone) ctx.markDone(); }} />
      <Card>
        {part ? (
          <>
            <Eyebrow>{ANATOMY.indexOf(part) + 1} · {part.name.toUpperCase()}</Eyebrow>
            <Body>{part.role}</Body>
          </>
        ) : (
          <Body>Numbered from the lips back and down to the lungs. The drawing is a simplified side view, not to scale.</Body>
        )}
      </Card>
      <Row>
        {ANATOMY.map((a, i) => <Btn key={a.id} label={`${i + 1} ${a.name.split(' ')[0]}`} tone={sel === a.id ? 'primary' : 'plain'} onPress={() => { setSel(a.id); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
    </View>
  );
}

/* ── 2 production sequence ────────────────────────────────────────────── */

const STAGE_PARTS: Record<string, string[]> = {
  breath: ['lungs', 'trachea'],
  phonation: ['larynx'],
  resonance: ['pharynx', 'nasal', 'velum'],
  articulation: ['tongue', 'lips', 'teeth', 'jaw', 'palate'],
  speech: [],
};

export function PageProduction({ ctx }: { ctx: PageCtx }) {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto || ctx.reduceMotion) return;
    const id = setInterval(() => setStep((s) => (s + 1) % PRODUCTION.length), 1800);
    return () => clearInterval(id);
  }, [auto, ctx.reduceMotion]);
  const st = PRODUCTION[step];
  return (
    <View style={{ gap: 12 }}>
      <Lead>Five stages, always in this order. Air becomes a buzz, the buzz becomes a vowel, movement turns vowels into words.</Lead>
      <Svg width="100%" height={54} viewBox="0 0 340 54">
        {PRODUCTION.map((s, i) => {
          const x = 6 + i * 67;
          const on = i === step;
          return (
            <G key={s.id} onPress={() => { setStep(i); setAuto(false); if (!ctx.isDone) ctx.markDone(); }}>
              <Rect x={x} y={10} width={60} height={34} rx={8} fill={on ? colors.cyanBright : '#131316'} stroke={on ? colors.cyanBright : colors.hairline} />
              <SvgText x={x + 30} y={31} fontSize={9} fill={on ? '#000' : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{s.name.toUpperCase()}</SvgText>
              {i < PRODUCTION.length - 1 ? <Polyline points={`${x + 61},27 ${x + 66},27`} stroke={colors.textMuted} strokeWidth={1.5} /> : null}
            </G>
          );
        })}
      </Svg>
      <HeadCrossSection selected={null} onSelect={() => undefined} highlight={STAGE_PARTS[st.id]} />
      <Card tone="math">
        <Eyebrow>{step + 1} · {st.name.toUpperCase()}</Eyebrow>
        <Body>{st.what}</Body>
        <Text style={styles.see}>What you would see: {st.see}</Text>
      </Card>
      <Row>
        <Btn label="‹ PREVIOUS" onPress={() => { setStep((s) => (s + PRODUCTION.length - 1) % PRODUCTION.length); setAuto(false); }} />
        <Btn label="NEXT STAGE ›" tone="primary" onPress={() => { setStep((s) => (s + 1) % PRODUCTION.length); setAuto(false); if (!ctx.isDone) ctx.markDone(); }} />
        {!ctx.reduceMotion ? <Btn label={auto ? 'STOP' : 'PLAY THE SEQUENCE'} onPress={() => { setAuto((a) => !a); if (!ctx.isDone) ctx.markDone(); }} /> : null}
      </Row>
    </View>
  );
}

/* ── 3 voiced vs unvoiced ─────────────────────────────────────────────── */

export function PageVoicing({ ctx }: { ctx: PageCtx }) {
  const [voiced, setVoiced] = useState(true);
  const [pair, setPair] = useState(0);
  const p = VOICED_PAIRS[pair];
  return (
    <View style={{ gap: 12 }}>
      <Lead>Put a finger on your throat and say "sss", then "zzz". Same mouth, one difference: whether the vocal folds are buzzing.</Lead>
      <Row>
        <Btn label={`UNVOICED · ${p.unvoiced}`} tone={!voiced ? 'primary' : 'plain'} onPress={() => { setVoiced(false); if (!ctx.isDone) ctx.markDone(); }} />
        <Btn label={`VOICED · ${p.voiced}`} tone={voiced ? 'primary' : 'plain'} onPress={() => { setVoiced(true); if (!ctx.isDone) ctx.markDone(); }} />
      </Row>
      <VocalFolds voiced={voiced} reduceMotion={ctx.reduceMotion} />
      <Card>
        <Eyebrow>{voiced ? 'FOLDS TOGETHER, VIBRATING' : 'FOLDS APART, AIR ONLY'}</Eyebrow>
        <Body>{voiced ? `The folds are brought together; air pressure blows them open and they snap shut again, over and over — that is the pitch of the voice. "${p.voiced}" as in "${p.example[1]}".` : `The folds are held open; the sound is only the air turbulence made further up, at the ${p.place}. "${p.unvoiced}" as in "${p.example[0]}".`}</Body>
        {ctx.reduceMotion && voiced ? <Text style={styles.see}>Reduced motion: the folds are shown mid-cycle instead of animating.</Text> : null}
      </Card>
      <Eyebrow>THE PAIRS · SAME SHAPE, FOLDS OFF / ON</Eyebrow>
      <Row>
        {VOICED_PAIRS.map((q, i) => <Btn key={q.unvoiced} label={`${q.unvoiced} / ${q.voiced}`} tone={i === pair ? 'primary' : 'plain'} onPress={() => setPair(i)} />)}
      </Row>
      <Body>Why it matters at the microphone: unvoiced sounds are pure noise with no pitch — S, SH and F are where sibilance lives — while voiced sounds carry the pitch and most of the energy.</Body>
    </View>
  );
}

/* ── 4 vowels ─────────────────────────────────────────────────────────── */

function VowelChart({ v }: { v: Vowel }) {
  const W = 340, H = 150;
  // vowel space: a trapezoid, front-left, high-top
  const px = (back: number, height: number) => 40 + back * 150 + (1 - height) * 30;
  const py = (height: number) => 22 + (1 - height) * 100;
  const jawOpen = 1 - v.height;
  return (
    <View accessible accessibilityLabel={`${v.letter}: tongue ${v.height > 0.6 ? 'high' : v.height > 0.3 ? 'mid' : 'low'} and ${v.back > 0.6 ? 'back' : v.back > 0.3 ? 'central' : 'front'}, jaw ${jawOpen > 0.6 ? 'open' : 'nearly closed'}, lips ${v.rounded ? 'rounded' : 'spread'}.`}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        <Polygon points={`${px(0, 1)},${py(1)} ${px(1, 1)},${py(1)} ${px(1, 0)},${py(0)} ${px(0, 0)},${py(0)}`} fill="none" stroke={colors.hairline} />
        <SvgText x={px(0, 1) - 4} y={py(1) - 8} fontSize={8} fill={colors.textMuted} fontFamily={F}>FRONT · HIGH</SvgText>
        <SvgText x={px(1, 1) + 4} y={py(1) - 8} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={F}>BACK · HIGH</SvgText>
        <SvgText x={px(0, 0) + 2} y={py(0) + 14} fontSize={8} fill={colors.textMuted} fontFamily={F}>LOW (jaw open)</SvgText>
        {VOWELS.map((o) => (
          <G key={o.id}>
            <Circle cx={px(o.back, o.height)} cy={py(o.height)} r={o.id === v.id ? 9 : 6} fill={o.id === v.id ? colors.cyanBright : '#1c1c22'} stroke={o.id === v.id ? colors.cyanBright : colors.textMuted} />
            <SvgText x={px(o.back, o.height)} y={py(o.height) + 3.5} fontSize={9} fill={o.id === v.id ? '#000' : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{o.letter}</SvgText>
          </G>
        ))}
        {/* mouth mini-diagram: jaw opening + lips */}
        <SvgText x={290} y={20} fontSize={8} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>JAW · LIPS</SvgText>
        <Rect x={272} y={30} width={36} height={6} rx={2} fill="#b9b0a0" />
        <Rect x={272} y={36 + 8 + jawOpen * 50} width={36} height={6} rx={2} fill="#8b8b96" />
        <Line x1={276} y1={36} x2={276} y2={36 + 8 + jawOpen * 50} stroke={colors.textMuted} strokeDasharray="2,2" />
        <Ellipse cx={290} cy={125} rx={v.rounded ? 8 : 16} ry={v.rounded ? 8 : 4} fill="none" stroke="#d78a80" strokeWidth={2.5} />
      </Svg>
    </View>
  );
}

export function PageVowels({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState('a');
  const v = VOWELS.find((o) => o.id === id)!;
  return (
    <View style={{ gap: 12 }}>
      <Lead>A vowel is a tongue position. Where the tongue sits sets which harmonics the mouth boosts — the formants — and that is what you hear as A, E, I, O or U.</Lead>
      <Row>
        {VOWELS.map((o) => <Btn key={o.id} label={`${o.letter} · ${o.sound.split(' ')[0]}`} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      <VowelChart v={v} />
      <Text style={styles.chartTitle}>{v.letter} · {v.sound.toUpperCase()} · HARMONICS SHAPED BY THE MOUTH</Text>
      <FormantChart v={v} />
      <Card>
        <Text style={styles.read}>F1 ≈ {v.f1} Hz · F2 ≈ {v.f2} Hz · F3 ≈ {v.f3} Hz (typical adult male; higher for women and children)</Text>
        <Body>{v.height > 0.6 ? 'Tongue high, jaw nearly closed → a low first formant.' : 'Tongue low, jaw open → a high first formant.'} {v.back > 0.6 ? 'Tongue back → a low second formant.' : 'Tongue forward → a high second formant.'} {v.rounded ? 'Rounded lips lengthen the tract and pull every formant down a little.' : 'Spread lips keep the tract short.'}</Body>
      </Card>
    </View>
  );
}

/* ── 5 consonants ─────────────────────────────────────────────────────── */

export function PageConsonants({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState('plosive');
  const c = CONSONANTS.find((o) => o.id === id)!;
  const W = 340, H = 60;
  const lo = 20, hi = 12000;
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (W - 20);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Consonants are what the mouth does to the air: block it, squeeze it, reroute it, or slide between shapes.</Lead>
      <Row>
        {CONSONANTS.map((o) => <Btn key={o.id} label={o.name.split(' ')[0]} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      <Card tone="math">
        <Eyebrow>{c.name.toUpperCase()} · {c.examples}</Eyebrow>
        <Body>{c.how}</Body>
        <Text style={styles.see}>Energy: {c.energy}.</Text>
      </Card>
      <View accessible accessibilityLabel={`${c.name}: energy mainly between ${c.bandLoHz} and ${c.bandHiHz} hertz.`}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
          <Rect x={x(c.bandLoHz)} y={14} width={Math.max(2, x(c.bandHiHz) - x(c.bandLoHz))} height={20} rx={4} fill={colors.orange} opacity={0.45} />
          {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((t) => (
            <SvgText key={t} x={x(t)} y={H - 8} fontSize={8} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>
          ))}
          <SvgText x={W - 8} y={11} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={F}>where the energy sits · approximate</SvgText>
        </Svg>
      </View>
      <Card><Body>At the microphone: {c.micNote}</Body></Card>
    </View>
  );
}

const styles = StyleSheet.create({
  see: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, marginTop: 4 },
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  chartTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5, marginBottom: -8 },
});
