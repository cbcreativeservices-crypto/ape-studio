/** Speech & Voice Lab — modules 1–5: anatomy, production, voicing, vowels, consonants.
 *
 * Legibility pass (owner 2026-09-25): every drawing sits in an ExpandableFigure
 * (labels ≥ 9 pt, "⤢ FULL SCREEN" under it) and each page builds its picker
 * ONCE and hands the same element to the page AND to the figure's `controls`,
 * so the learner can change the picture while it is enlarged. */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import { ANATOMY, CONSONANTS, PRODUCTION, SPEECH_CHECKS, VOICED_PAIRS, VOWELS, shuffleCheck } from '../../../features/speech/speechModel';
import type { PageCtx } from '../kit/PagedLab';
import { ExpandableFigure } from '../kit/ExpandableFigure';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { HeadCrossSection, VocalFolds } from './speechViz';
import { FormantChart, VowelChart } from './vowelViz';
import { ConsonantSpectrogram } from './consonantViz';
import type { ConsonantFamilyId } from '../../../features/speech/speechSignals';

const SYLLABLE_TEXT: Record<string, string> = { plosive: 'pa', fricative: 'sa', affricate: 'cha', nasal: 'ma', liquid: 'la', glide: 'wa' };

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
  const picker = (
    <Row>
      {ANATOMY.map((a, i) => <Btn key={a.id} label={`${i + 1} · ${a.short.toUpperCase()}`} tone={sel === a.id ? 'primary' : 'plain'} onPress={() => pick(a.id)} a11y={`${i + 1}, ${a.name}${sel === a.id ? ', selected' : ''}`} />)}
    </Row>
  );
  // In full screen the card is off-screen, so a two-line readout rides with the picker.
  const dock = (
    <View style={{ gap: 8 }}>
      <Text style={styles.readout} numberOfLines={2}>{part ? `${ANATOMY.indexOf(part) + 1} · ${part.name.toUpperCase()} — ${part.role}` : 'Tap a number on the drawing, or a button below.'}</Text>
      {picker}
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Speech is air, a buzz, a set of resonating cavities and a few fast-moving parts. Tap a number to see what each one does.</Lead>
      <HeadCrossSection selected={sel} onSelect={pick} controls={dock} />
      <Card>
        {part ? (
          <>
            <Eyebrow>{ANATOMY.indexOf(part) + 1} · {part.name.toUpperCase()}</Eyebrow>
            <Body>{part.role}</Body>
          </>
        ) : (
          <Body>Numbered in the order the air meets them, lungs (1) to lips (10); the jaw (11) frames the mouth. Dark blue-grey is air space; red is muscle; cream is bone; pale blue is cartilage; pink is the lining. Head and neck in side view, the chest below from the front — not to scale.</Body> // NEW COPY (was "numbered from the lips back and down to the lungs" — the reverse of the actual order)
        )}
      </Card>
      {picker}
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
  // The stage strip is a picker (height-capped at 1 : 1, so its labels are authored at 9.5).
  // Drawn at (w, h): inline through ExpandableFigure (full-screen pass
  // 2026-09-30 — it was the one unwrapped drawing in this lab) and, compact,
  // inside the head drawing's own dock.
  const stripAt = (w: number | string, h: number) => (
    <Svg accessibilityElementsHidden importantForAccessibility="no-hide-descendants" width={w} height={h} viewBox="0 0 340 56">
      {PRODUCTION.map((s, i) => {
        const x = 4 + i * 67;
        const on = i === step;
        const done = i < step;
        return (
          <G key={s.id} onPress={() => go(i)}>
            <Rect x={x} y={6} width={60} height={44} rx={8} fill={on ? colors.cyanBright : '#131316'} stroke={on ? colors.cyanBright : done ? colors.textSub : colors.hairline} />
            <SvgText x={x + 30} y={24} fontSize={9.5} fill={on ? '#000' : colors.textMuted} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{i + 1}</SvgText>
            <SvgText x={x + 30} y={39} fontSize={9.5} fill={on ? '#000' : done ? colors.textSecondary : colors.textSub} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{s.name.toUpperCase()}</SvgText>
            {i < last ? <Path d={`M ${x + 62} 24 L ${x + 66} 28 L ${x + 62} 32`} fill="none" stroke={colors.textMuted} strokeWidth={1.5} /> : null}
          </G>
        );
      })}
    </Svg>
  );
  const strip = stripAt('100%', 56);
  const readout = <Text style={styles.readout} numberOfLines={2}>{step + 1} · {st.name.toUpperCase()} — {st.what}</Text>;
  const nav = (
    <Row>
      <Btn label="‹ PREVIOUS" onPress={() => go(Math.max(0, step - 1))} disabled={step === 0} />
      <Btn label="NEXT STAGE ›" tone="primary" onPress={() => go(Math.min(last, step + 1))} disabled={step === last} />
      {!ctx.reduceMotion ? <Btn label={auto ? '■ STOP' : '▶ PLAY THE SEQUENCE'} onPress={() => { if (!auto && step >= last) setStep(0); setAuto((a) => !a); if (!ctx.isDone) ctx.markDone(); }} /> : null}
    </Row>
  );
  const dock = (
    <View style={{ gap: 8 }}>
      {strip}
      {readout}
      {nav}
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Five stages, always in this order. Air becomes a buzz, the buzz becomes a vowel, movement turns vowels into words.</Lead>
      {/* ONE full screen on this page (owner 2026-10-14): the strip is a plain
          picker row here; full screen belongs to the head drawing, whose dock
          already carries the strip, the readout and the stage keys. */}
      <View accessible accessibilityLabel={`The five stages of speech production in order: ${PRODUCTION.map((s, i) => `${i + 1} ${s.name}`).join(', ')}. Stage ${step + 1}, ${st.name}, is selected.`}>{stripAt('100%', 56)}</View>
      <HeadCrossSection selected={null} onSelect={goPart} highlight={STAGE_PARTS[st.id]} controls={dock} fsTitle="SEQUENCE" stage={st.id} reduceMotion={ctx.reduceMotion} />
      <Card tone="math">
        <Eyebrow>{step + 1} · {st.name.toUpperCase()}</Eyebrow>
        <Body>{st.what}</Body>
        <Text style={styles.see}>What you would see: {st.see}</Text>
      </Card>
      {nav}
      {ctx.reduceMotion ? <Text style={styles.see}>Reduced motion: step through with the buttons; the sequence does not auto-play.</Text> : null}
    </View>
  );
}

/* ── 3 voiced vs unvoiced ─────────────────────────────────────────────── */

export function PageVoicing({ ctx }: { ctx: PageCtx }) {
  const [voiced, setVoiced] = useState(true);
  // S/Z first: the pair the lead's "sss … zzz" finger-on-the-throat test uses
  const [pair, setPair] = useState(() => Math.max(0, VOICED_PAIRS.findIndex((q) => q.unvoiced === 'S')));
  const p = VOICED_PAIRS[pair];
  const toggle = (
    <Row>
      <Btn label={`UNVOICED · ${p.unvoiced}`} tone={!voiced ? 'primary' : 'plain'} onPress={() => { setVoiced(false); if (!ctx.isDone) ctx.markDone(); }} />
      <Btn label={`VOICED · ${p.voiced}`} tone={voiced ? 'primary' : 'plain'} onPress={() => { setVoiced(true); if (!ctx.isDone) ctx.markDone(); }} />
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Put a finger on your throat and say "sss", then "zzz". Same mouth, one difference: whether the vocal folds are buzzing.</Lead>
      {toggle}
      <VocalFolds voiced={voiced} reduceMotion={ctx.reduceMotion} controls={toggle} />
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
      <Body>Why it matters at the microphone: unvoiced sounds are pure noise with no pitch — S and SH are where sibilance lives — while voiced sounds carry the pitch and most of the energy.</Body>
    </View>
  );
}

/* ── 4 vowels ─────────────────────────────────────────────────────────── */

export function PageVowels({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState('a');
  const v = VOWELS.find((o) => o.id === id)!;
  const formantRead = <Text style={styles.read}>F1 ≈ {v.f1} Hz · F2 ≈ {v.f2} Hz · F3 ≈ {v.f3} Hz — typical adult male; roughly 15–20% higher for women, higher again for children</Text>;
  const picker = (
    <Row>
      {VOWELS.map((o) => <Btn key={o.id} label={`${o.letter} · ${o.sound.split(' ')[0]}`} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} a11y={`${o.letter}, ${o.sound}`} />)}
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>A vowel is mostly a tongue position. Where the tongue sits sets the mouth’s resonant peaks — the formants — which boost the harmonics near them, and that is what you hear as A, E, I, O or U.</Lead>
      {picker}
      <VowelChart v={v} controls={picker} />
      {/* In full screen the formant readout leads the dock (parity pass 2026-09-26). */}
      <FormantChart v={v} title={`${v.letter} · ${v.sound.toUpperCase()} · HARMONICS SHAPED BY THE MOUTH`} controls={<View style={{ gap: 8 }}>{formantRead}{picker}</View>} />
      <Card>
        {formantRead}
        <Body>{v.height > 0.6 ? 'Tongue high, jaw nearly closed → a low first formant.' : 'Tongue low, jaw open → a high first formant.'} {v.back > 0.6 ? 'Tongue back → a low second formant.' : 'Tongue forward → a high second formant.'} {v.rounded ? 'Rounded lips lengthen the tract and pull every formant down a little.' : v.id === 'i' ? 'Spread lips shorten the tract a little, nudging the formants up.' : 'Unrounded lips leave the tract at its natural length.'}</Body>
      </Card>
      <Notice>Step from I (EE) to A (AH): the tongue drops, F1 climbs and F2 falls — the two gold peaks move toward each other.</Notice>
    </View>
  );
}

/* ── 5 consonants ─────────────────────────────────────────────────────── */

export function PageConsonants({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState('plosive');
  const c = CONSONANTS.find((o) => o.id === id)!;
  const picker = (
    <Row>
      {CONSONANTS.map((o) => <Btn key={o.id} label={o.name.split(' ')[0].toUpperCase()} tone={o.id === id ? 'primary' : 'plain'} onPress={() => { setId(o.id); if (!ctx.isDone) ctx.markDone(); }} a11y={`${o.name}: ${o.examples}`} />)}
    </Row>
  );
  return (
    <View style={{ gap: 12 }}>
      <Lead>Consonants are what the mouth does to the air: block it, squeeze it, reroute it, or slide between shapes.</Lead>
      {picker}
      <Card tone="math">
        <Eyebrow>{c.name.toUpperCase()} · {c.examples}</Eyebrow>
        <Body>{c.how}</Body>
        <Text style={styles.see}>Energy: {c.energy}.</Text>
      </Card>
      <ConsonantSpectrogram
        family={c.id as ConsonantFamilyId}
        a11y={`Spectrogram of the syllable ${SYLLABLE_TEXT[c.id] ?? ''}, 400 milliseconds, 0 to 8 kilohertz. ${c.name}: ${c.energy}.`}
        controls={<View style={{ gap: 8 }}><Text style={styles.readout} numberOfLines={2}>{c.name.toUpperCase()} · {c.examples} — energy: {c.energy}</Text>{picker}</View>}
      />
      <Notice>Watch where the colour sits as you change family: an S-type hiss fills the top of the picture, a nasal hums only at the bottom, a plosive is silence then a sharp vertical burst. The hiss is a de-esser problem; the plosive's air is a pop-filter problem.</Notice>
      <Card><Body>At the microphone: {c.micNote}</Body></Card>
      <SpeechCheckCard id="nasal-family" />
    </View>
  );
}

const styles = StyleSheet.create({
  see: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, marginTop: 4 },
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  notice: { color: colors.cyanBright, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  readout: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, paddingHorizontal: 2 },
});
