/** Speech & Voice Lab — modules 1–5: anatomy, production, voicing, vowels, consonants. */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { ANATOMY, CONSONANTS, PRODUCTION, SPEECH_CHECKS, VOICED_PAIRS, VOWELS, shuffleCheck, type Vowel } from '../../../features/speech/speechModel';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { FormantChart, HeadCrossSection, VocalFolds } from './speechViz';

const F = fonts.barlowMedium;

/* ── shared: an authored check, shuffled once per mount ─────────────────── */

/** Renders one of SPEECH_CHECKS by id with its options in a fresh random
 *  order (the correct index follows its text), so no answer is ever "always
 *  the second chip" across the lab. */
export function SpeechCheckCard({ id, onCorrect }: { id: string; onCorrect?: () => void }) {
  const c = SPEECH_CHECKS.find((o) => o.id === id)!;
  const [shuffled] = useState(() => shuffleCheck(c));
  return <UnderstandingCheck question={c.question} options={shuffled.options} correct={shuffled.correct} explain={c.explain} onCorrect={onCorrect} />;
}

/** A one-line "what to notice" cue under a drawing (shared with pages B). */
// NEW COPY: every Notice line in this file.
export function Notice({ children }: { children: string }) {
  return <Text style={styles.notice}>◦ {children}</Text>;
}

/* ── 1 anatomy ─────────────────────────────────────────────────────────── */

export function PageAnatomy({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string | null>(null);
  const part = ANATOMY.find((a) => a.id === sel);
  const pick = (id: string) => { setSel(id); if (!ctx.isDone) ctx.markDone(); };
  return (
    <View style={{ gap: 12 }}>
      <Lead>Speech is air, a buzz, a set of resonating cavities and a few fast-moving parts. Tap a number to see what each one does.</Lead>
      <HeadCrossSection selected={sel} onSelect={pick} />
      <Card>
        {part ? (
          <>
            <Eyebrow>{ANATOMY.indexOf(part) + 1} · {part.name.toUpperCase()}</Eyebrow>
            <Body>{part.role}</Body>
          </>
        ) : (
          <Body>Numbered along the path the air takes: lungs first, lips last, with the jaw that frames the mouth closing the list. Dark blue-grey is air space; red is muscle; cream is bone. A simplified side view, not to scale.</Body> // NEW COPY (was "numbered from the lips back and down to the lungs" — the reverse of the actual order)
        )}
      </Card>
      <Row>
        {ANATOMY.map((a, i) => <Btn key={a.id} label={`${i + 1} · ${a.short.toUpperCase()}`} tone={sel === a.id ? 'primary' : 'plain'} onPress={() => pick(a.id)} a11y={`${i + 1}, ${a.name}${sel === a.id ? ', selected' : ''}`} />)}
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
  // speech = everything working at once
  speech: ['larynx', 'pharynx', 'nasal', 'velum', 'tongue', 'lips', 'teeth', 'jaw', 'palate'],
};

export function PageProduction({ ctx }: { ctx: PageCtx }) {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  const last = PRODUCTION.length - 1;
  useEffect(() => {
    if (!auto || ctx.reduceMotion) return;
    const id = setInterval(() => setStep((s) => Math.min(last, s + 1)), 1800);
    return () => clearInterval(id);
  }, [auto, ctx.reduceMotion, last]);
  // plays through ONCE and stops on SPEECH — the order is the lesson, so it never wraps back to BREATH
  useEffect(() => {
    if (auto && step >= last) setAuto(false);
  }, [auto, step, last]);
  const st = PRODUCTION[step];
  const go = (i: number) => { setStep(i); setAuto(false); if (!ctx.isDone) ctx.markDone(); };
  // tapping a structure on the drawing jumps to the stage that uses it
  const goPart = (id: string) => {
    const i = PRODUCTION.findIndex((s) => s.id !== 'speech' && STAGE_PARTS[s.id].includes(id));
    if (i >= 0) go(i);
  };
  return (
    <View style={{ gap: 12 }}>
      <Lead>Five stages, always in this order. Air becomes a buzz, the buzz becomes a vowel, movement turns vowels into words.</Lead>
      <Svg width="100%" height={56} viewBox="0 0 340 56">
        {PRODUCTION.map((s, i) => {
          const x = 4 + i * 67;
          const on = i === step;
          const done = i < step;
          return (
            <G key={s.id} onPress={() => go(i)}>
              <Rect x={x} y={6} width={60} height={44} rx={8} fill={on ? colors.cyanBright : '#131316'} stroke={on ? colors.cyanBright : done ? colors.textSub : colors.hairline} />
              <SvgText x={x + 30} y={24} fontSize={8.5} fill={on ? '#000' : colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{i + 1}</SvgText>
              <SvgText x={x + 30} y={38} fontSize={9} fill={on ? '#000' : done ? colors.textSecondary : colors.textSub} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{s.name.toUpperCase()}</SvgText>
              {i < last ? <Path d={`M ${x + 62} 24 L ${x + 66} 28 L ${x + 62} 32`} fill="none" stroke={colors.textMuted} strokeWidth={1.5} /> : null}
            </G>
          );
        })}
      </Svg>
      <HeadCrossSection selected={null} onSelect={goPart} highlight={STAGE_PARTS[st.id]} />
      <Card tone="math">
        <Eyebrow>{step + 1} · {st.name.toUpperCase()}</Eyebrow>
        <Body>{st.what}</Body>
        <Text style={styles.see}>What you would see: {st.see}</Text>
      </Card>
      <Row>
        <Btn label="‹ PREVIOUS" onPress={() => go(Math.max(0, step - 1))} disabled={step === 0} />
        <Btn label="NEXT STAGE ›" tone="primary" onPress={() => go(Math.min(last, step + 1))} disabled={step === last} />
        {!ctx.reduceMotion ? <Btn label={auto ? '■ STOP' : '▶ PLAY THE SEQUENCE'} onPress={() => { if (!auto && step >= last) setStep(0); setAuto((a) => !a); if (!ctx.isDone) ctx.markDone(); }} /> : null}
      </Row>
      {ctx.reduceMotion ? <Text style={styles.see}>Reduced motion: step through with the buttons; the sequence does not auto-play.</Text> : null}
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
        <Body>{voiced ? `The folds are brought together; air pressure blows them open and they snap shut again, over and over — that is the pitch of the voice. "${p.voiced}" as in "${p.example[1]}".` : `The folds are held open; the only sound is the noise made further up — a burst or a hiss at the ${p.place}. "${p.unvoiced}" as in "${p.example[0]}".`}</Body>
        {ctx.reduceMotion && voiced ? <Text style={styles.see}>Reduced motion: the folds are shown mid-cycle instead of animating.</Text> : null}
      </Card>
      <Notice>Look at the right-hand trace: voiced is a regular train of pulses (a pitch); unvoiced is ragged noise with no repeating pattern.</Notice>
      <Eyebrow>THE PAIRS · SAME SHAPE, FOLDS OFF / ON</Eyebrow>
      <Row>
        {VOICED_PAIRS.map((q, i) => <Btn key={q.unvoiced} label={`${q.unvoiced} / ${q.voiced}`} tone={i === pair ? 'primary' : 'plain'} onPress={() => setPair(i)} a11y={`${q.unvoiced} as in ${q.example[0]}, versus ${q.voiced} as in ${q.example[1]}`} />)}
      </Row>
      <Body>Why it matters at the microphone: unvoiced sounds are pure noise with no pitch — S, SH and F are where sibilance lives — while voiced sounds carry the pitch and most of the energy.</Body>
    </View>
  );
}

/* ── 4 vowels ─────────────────────────────────────────────────────────── */

/** The vowel quadrilateral (front-high top-left, back-high top-right, the
 *  front-low corner pulled inward as on the IPA chart) plus a jaw gauge and
 *  a front view of the lips for the selected vowel. Exported for the design
 *  harness; not used elsewhere. */
export function VowelChart({ v }: { v: Vowel }) {
  const W = 340, H = 150;
  const x0 = 40, wq = 160, shift = 56;
  const px = (back: number, height: number) => x0 + back * wq + (1 - height) * (1 - back) * shift;
  const py = (height: number) => 24 + (1 - height) * 98;
  const jawOpen = 1 - v.height;
  // SVG rotate() is clockwise in screen space, so a point LEFT of the hinge
  // rises under a positive angle — the lower jaw swings with a negative one.
  const theta = -jawOpen * 28;
  const hx = 318, hy = 43; // jaw hinge (at the back)
  const rad = (theta * Math.PI) / 180;
  const fx = hx + (-46 * Math.cos(rad) - 3 * Math.sin(rad)), fy = hy + (-46 * Math.sin(rad) + 3 * Math.cos(rad));
  const lipRx = v.rounded ? 9 : 17, lipRy = v.rounded ? 9 : 5;
  return (
    <View accessible accessibilityLabel={`${v.letter}: tongue ${v.height > 0.6 ? 'high' : v.height > 0.3 ? 'mid' : 'low'} and ${v.back > 0.6 ? 'back' : v.back > 0.3 ? 'central' : 'front'}, jaw ${jawOpen > 0.6 ? 'open' : jawOpen > 0.4 ? 'half open' : 'nearly closed'}, lips ${v.rounded ? 'rounded' : 'spread'}.`}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {/* the tongue space */}
        <Polygon points={`${px(0, 1)},${py(1)} ${px(1, 1)},${py(1)} ${px(1, 0)},${py(0)} ${px(0, 0)},${py(0)}`} fill="rgba(127,212,255,0.04)" stroke={colors.hairline} />
        <Line x1={px(0, 0.5)} y1={py(0.5)} x2={px(1, 0.5)} y2={py(0.5)} stroke={colors.hairline} strokeDasharray="3,3" />
        <SvgText x={px(0, 1)} y={py(1) - 8} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>FRONT</SvgText>
        <SvgText x={px(1, 1)} y={py(1) - 8} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>BACK</SvgText>
        <SvgText x={px(0, 1) - 6} y={py(1) + 4} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>HIGH</SvgText>
        <SvgText x={px(0, 0) - 6} y={py(0) + 3} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>LOW</SvgText>
        <SvgText x={px(0, 0)} y={py(0) + 16} fontSize={8.5} fill={colors.textMuted} fontFamily={F}>tongue position · jaw opens as it drops</SvgText>
        {VOWELS.map((o) => {
          const on = o.id === v.id;
          return (
            <G key={o.id}>
              <Circle cx={px(o.back, o.height)} cy={py(o.height)} r={on ? 10 : 7} fill={on ? colors.cyanBright : '#1c1c22'} stroke={on ? colors.cyanBright : colors.textMuted} />
              <SvgText x={px(o.back, o.height)} y={py(o.height) + 3.5} fontSize={on ? 10 : 9} fill={on ? '#000' : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{o.letter}</SvgText>
            </G>
          );
        })}
        {/* jaw gauge (side view): fixed upper jaw, lower jaw swings on a hinge at the back */}
        <SvgText x={296} y={20} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>JAW</SvgText>
        <Rect x={272} y={30} width={48} height={6} rx={3} fill="#c9c0ae" />
        <Circle cx={hx} cy={hy} r={2.5} fill={colors.textMuted} />
        <G transform={`rotate(${theta.toFixed(1)} ${hx} ${hy})`}>
          <Rect x={272} y={40} width={48} height={6} rx={3} fill="#8b8b96" />
        </G>
        <Line x1={274} y1={38} x2={fx.toFixed(1)} y2={fy.toFixed(1)} stroke={colors.cyanBright} strokeWidth={1} strokeDasharray="2,2" opacity={jawOpen > 0.15 ? 0.9 : 0} />
        <SvgText x={296} y={92} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>{jawOpen > 0.6 ? 'open' : jawOpen > 0.4 ? 'half open' : 'nearly closed'}</SvgText>
        {/* lips (front view) */}
        <SvgText x={296} y={106} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>LIPS</SvgText>
        <Ellipse cx={296} cy={122} rx={lipRx} ry={lipRy} fill="#0a0a0c" stroke="#d78a80" strokeWidth={3} />
        <SvgText x={296} y={143} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={F}>{v.rounded ? 'rounded' : 'spread'}</SvgText>
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
        {VOWELS.map((o) => <Btn key={o.id} label={`${o.letter} · ${o.sound.split(' ')[0]}`} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} a11y={`${o.letter}, ${o.sound}`} />)}
      </Row>
      <VowelChart v={v} />
      <FormantChart v={v} title={`${v.letter} · ${v.sound.toUpperCase()} · HARMONICS SHAPED BY THE MOUTH`} />
      <Card>
        <Text style={styles.read}>F1 ≈ {v.f1} Hz · F2 ≈ {v.f2} Hz · F3 ≈ {v.f3} Hz — typical adult male; roughly 15–20% higher for women, higher again for children</Text>
        <Body>{v.height > 0.6 ? 'Tongue high, jaw nearly closed → a low first formant.' : 'Tongue low, jaw open → a high first formant.'} {v.back > 0.6 ? 'Tongue back → a low second formant.' : 'Tongue forward → a high second formant.'} {v.rounded ? 'Rounded lips lengthen the tract and pull every formant down a little.' : 'Spread lips keep the tract short.'}</Body>
      </Card>
      <Notice>Step from I (EE) to A (AH): the tongue drops, F1 climbs and F2 falls — the two gold peaks move toward each other.</Notice>
    </View>
  );
}

/* ── 5 consonants ─────────────────────────────────────────────────────── */

export function PageConsonants({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState('plosive');
  const c = CONSONANTS.find((o) => o.id === id)!;
  const W = 340, H = 62;
  const lo = 20, hi = 12000;
  const x = (f: number) => 10 + ((Math.log(f) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (W - 20);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Consonants are what the mouth does to the air: block it, squeeze it, reroute it, or slide between shapes.</Lead>
      <Row>
        {CONSONANTS.map((o) => <Btn key={o.id} label={o.name.split(' ')[0].toUpperCase()} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} a11y={`${o.name}: ${o.examples}`} />)}
      </Row>
      <Card tone="math">
        <Eyebrow>{c.name.toUpperCase()} · {c.examples}</Eyebrow>
        <Body>{c.how}</Body>
        <Text style={styles.see}>Energy: {c.energy}.</Text>
      </Card>
      <View accessible accessibilityLabel={`${c.name}: energy mainly between ${c.bandLoHz} and ${c.bandHiHz} hertz, approximate.`}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
          {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((t) => <Line key={`g${t}`} x1={x(t)} y1={14} x2={x(t)} y2={38} stroke="rgba(255,255,255,0.06)" />)}
          <Rect x={x(c.bandLoHz)} y={16} width={Math.max(2, x(c.bandHiHz) - x(c.bandLoHz))} height={20} rx={4} fill={colors.orange} opacity={0.45} />
          {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map((t) => (
            <SvgText key={t} x={x(t)} y={H - 8} fontSize={8.5} fill={colors.textMuted} textAnchor="middle" fontFamily={F}>{t >= 1000 ? `${t / 1000}k` : t}</SvgText>
          ))}
          <SvgText x={W - 8} y={11} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={F}>where the energy sits · approximate</SvgText>
        </Svg>
      </View>
      <Notice>Watch the band jump as you change family: plosives and nasals live low, fricatives and affricates high — that is why one is a pop-filter problem and the other a de-esser problem.</Notice>
      <Card><Body>At the microphone: {c.micNote}</Body></Card>
      <SpeechCheckCard id="nasal-family" />
    </View>
  );
}

const styles = StyleSheet.create({
  see: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, marginTop: 4 },
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  notice: { color: colors.cyanBright, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
