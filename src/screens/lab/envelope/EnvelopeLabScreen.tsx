/**
 * Sound Envelope & Transients Lab (owner brief 2026-09-02) — how a sound
 * evolves over time at its source. Visual only: sliders redraw the envelope
 * instantly; nothing is played. Deliberately NOT about propagation.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import {
  PRESETS, SPEECH_SYLLABLES, TRANSIENTS, DURATION_BANDS, DURATION_EXAMPLES, logTimePos, speechCurve, riseTimeMs, adsrTotalMs,
  shapedWave, crestFactorDb, peakAbs, rms, toDb, type Adsr, type TransientKind,
} from '../../../features/envelope/envelopeModel';
import { PagedLab, type PageCtx, type PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { ControlSlider } from '../amp/kit';
import { EnvelopeChart } from './EnvelopeChart';

/** Preset handed from the gallery to the explorer (module-local, not persisted). */
let handoff: Adsr | null = null;

const DEFAULT: Adsr = { attackMs: 40, decayMs: 200, sustain: 0.6, releaseMs: 300, holdMs: 500 };

const GLOSSARY: [string, string][] = [
  ['Envelope', 'the shape of a sound’s level over time, from silence back to silence'],
  ['Attack', 'the rise from silence to peak level'],
  ['Transient', 'the brief, fast-changing onset — the part the ear uses to place and identify a sound'],
  ['Rise time', 'how long the attack takes to climb from 10% to 90% of peak'],
  ['Decay', 'the fall from peak toward the sustain level'],
  ['Sustain', 'the level held while energy keeps being supplied'],
  ['Release', 'the fall from the sustain level back to silence after the energy stops'],
  ['Duration', 'the total time a sound lasts'],
];

/* ── page 1: explorer ───────────────────────────────────────────────────── */

function PageExplorer({ ctx }: { ctx: PageCtx }) {
  const [adsr, setAdsr] = useState<Adsr>(() => handoff ?? DEFAULT);
  const set = (k: keyof Adsr) => (v: number) => { setAdsr({ ...adsr, [k]: v }); if (!ctx.isDone) ctx.markDone(); };
  const logMs = (v: number) => Math.round(Math.pow(10, v)); // slider 0..3.3 → 1..2000 ms
  const toLog = (ms: number) => Math.log10(Math.max(1, ms));
  return (
    <View style={{ gap: 12 }}>
      <Lead>Every sound has a shape in time. Move the sliders and watch the envelope — and the waveform inside it — redraw instantly.</Lead>
      <EnvelopeChart adsr={adsr} showRise title="ENVELOPE · A / D / S / R (waveform shaped by it)" />
      <ControlSlider label="Attack" value={toLog(adsr.attackMs)} min={0} max={3.3} step={0.02} format={(v) => `${logMs(v)} ms`} onChange={(v) => set('attackMs')(logMs(v))} />
      <ControlSlider label="Decay" value={toLog(adsr.decayMs)} min={0} max={3.5} step={0.02} format={(v) => `${logMs(v)} ms`} onChange={(v) => set('decayMs')(logMs(v))} />
      <ControlSlider label="Sustain level" value={adsr.sustain} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={set('sustain')} />
      <ControlSlider label="Release" value={toLog(adsr.releaseMs)} min={0} max={3.5} step={0.02} format={(v) => `${logMs(v)} ms`} onChange={(v) => set('releaseMs')(logMs(v))} />
      <ControlSlider label="Hold (how long energy keeps coming)" value={adsr.holdMs} min={0} max={2000} step={10} format={(v) => `${v} ms`} onChange={set('holdMs')} />
      <Row>
        <Btn label={adsr.attackShape === 'exponential' ? 'ATTACK: SNAP' : 'ATTACK: LINEAR'} onPress={() => setAdsr({ ...adsr, attackShape: adsr.attackShape === 'exponential' ? 'linear' : 'exponential' })} />
        <Btn label={adsr.decayShape === 'exponential' ? 'DECAY: NATURAL' : 'DECAY: LINEAR'} onPress={() => setAdsr({ ...adsr, decayShape: adsr.decayShape === 'exponential' ? 'linear' : 'exponential' })} />
        <Btn label="RESET" onPress={() => setAdsr(DEFAULT)} />
      </Row>
      <Card>
        <Eyebrow>READOUT</Eyebrow>
        <Text style={styles.read}>rise time (10→90%) {riseTimeMs(adsr).toFixed(1)} ms · total duration {Math.round(adsrTotalMs(adsr))} ms</Text>
        <Body>{adsr.attackMs < 15 ? 'A fast attack like this IS a transient: the onset is over before the ear can follow it.' : adsr.attackMs < 120 ? 'A medium attack — the onset is audible as a shape, not a click.' : 'A slow attack has no real transient; the sound swells in.'} {adsr.sustain === 0 ? 'With zero sustain the sound is percussive: it can only decay.' : 'With sustain above zero the sound holds as long as energy keeps coming.'}</Body>
      </Card>
      <Card>
        <Eyebrow>THE WORDS</Eyebrow>
        {GLOSSARY.map(([t, d]) => <Text key={t} style={styles.gloss}><Text style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium }}>{t}</Text> — {d}</Text>)}
      </Card>
    </View>
  );
}

/* ── page 2: gallery ────────────────────────────────────────────────────── */

function PageGallery({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string>('snare');
  const preset = PRESETS.find((p) => p.id === sel);
  const speech = speechCurve(400);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Simplified envelope shapes for common sounds. These are teaching shapes — real instruments vary with playing technique, register and room.</Lead>
      <Row>
        {PRESETS.map((p) => <Btn key={p.id} label={p.name} tone={sel === p.id ? 'primary' : 'plain'} onPress={() => { setSel(p.id); if (!ctx.isDone) ctx.markDone(); }} />)}
        <Btn label="Speech" tone={sel === 'speech' ? 'primary' : 'plain'} onPress={() => { setSel('speech'); if (!ctx.isDone) ctx.markDone(); }} />
      </Row>
      {preset ? (
        <>
          <EnvelopeChart adsr={preset.adsr} title={`${preset.name.toUpperCase()} · ${preset.kind.toUpperCase()}`} />
          <Card>
            {preset.bullets.map((b) => <Text key={b} style={styles.gloss}>• {b}</Text>)}
            <Text style={styles.read}>attack {preset.adsr.attackMs} ms · decay {preset.adsr.decayMs} ms · sustain {Math.round(preset.adsr.sustain * 100)}% · release {preset.adsr.releaseMs} ms</Text>
            <Btn label="LOAD INTO THE EXPLORER" onPress={() => { handoff = preset.adsr; }} a11y="Load this shape into the explorer on page 1" />
            <Body>Then go back one page — the explorer opens with this shape loaded.</Body>
          </Card>
        </>
      ) : (
        <>
          <SpeechChart />
          <Card>
            <Body>Spoken language is a sequence of changing transients and sustained sounds: consonants are short bursts and stops, vowels are the sustained parts. Each syllable has its own small envelope, with near-silence between many of them — which is why speech needs its onsets intact to stay intelligible.</Body>
            <Text style={styles.read}>{SPEECH_SYLLABLES.map((s) => s.label).join(' · ')} — {speech.marks.length} syllable envelopes</Text>
          </Card>
        </>
      )}
    </View>
  );
}

function SpeechChart() {
  const { t, v, marks } = speechCurve(400);
  const W = 340, H = 130, top = 16, bottom = H - 24;
  const total = t[t.length - 1];
  const x = (ms: number) => 10 + (ms / total) * (W - 20);
  const pts = Array.from(t, (ms, i) => `${x(ms).toFixed(1)},${(bottom - v[i] * (bottom - top)).toFixed(1)}`).join(' ');
  return (
    <View accessible accessibilityLabel={`Speech: ${marks.length} syllables, ${Math.round(total)} milliseconds, each a short envelope with silence between.`}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
        {marks.map((m) => (
          <G key={m.label}>
            <Rect x={x(m.startMs)} y={top - 4} width={Math.max(1, x(m.endMs) - x(m.startMs))} height={bottom - top + 8} fill={colors.gold} opacity={0.06} />
            <SvgText x={(x(m.startMs) + x(m.endMs)) / 2} y={H - 8} fontSize={9} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{m.label}</SvgText>
          </G>
        ))}
        <Line x1={10} y1={bottom} x2={W - 10} y2={bottom} stroke="rgba(255,255,255,0.12)" />
        <Polyline points={pts} fill="none" stroke={colors.cyanBright} strokeWidth={2} />
      </Svg>
    </View>
  );
}

/* ── page 3: transients ─────────────────────────────────────────────────── */

const WHY: [string, string][] = [
  ['Percussion', 'a drum IS its transient — remove the onset and a snare becomes a burst of noise with no hit'],
  ['Speech intelligibility', 'consonants are transients; when they are lost or smeared, words blur together'],
  ['Instrument identification', 'the first tens of milliseconds tell you piano vs guitar more than the sustained tone does'],
  ['Compression', 'a compressor’s attack time decides whether the transient passes through or gets flattened'],
  ['Limiters', 'peak limiters exist because transients are where the peaks are'],
  ['Loudspeaker performance', 'reproducing a transient cleanly needs a driver that starts and stops fast — and an amplifier with the current to do it'],
];

function PageTransients({ ctx }: { ctx: PageCtx }) {
  const [kind, setKind] = useState<TransientKind>('sharp');
  const t = TRANSIENTS[kind];
  return (
    <View style={{ gap: 12 }}>
      <Lead>The transient is the onset — the first few milliseconds. It carries more information than its size suggests.</Lead>
      <Row>
        {(Object.keys(TRANSIENTS) as TransientKind[]).map((k) => <Btn key={k} label={TRANSIENTS[k].name} tone={kind === k ? 'primary' : 'plain'} onPress={() => { setKind(k); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      <EnvelopeChart adsr={t.adsr} showRise title={t.name.toUpperCase()} />
      <Card><Body>{t.note} Rise time here: {riseTimeMs(t.adsr).toFixed(1)} ms.</Body></Card>
      <Eyebrow>WHY TRANSIENTS MATTER</Eyebrow>
      <Card>
        {WHY.map(([k, d]) => <Text key={k} style={styles.gloss}><Text style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium }}>{k}</Text> — {d}</Text>)}
      </Card>
    </View>
  );
}

/* ── page 4: duration ───────────────────────────────────────────────────── */

function PageDuration({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string | null>(null);
  const W = 340, H = 150;
  const x = (ms: number) => 12 + logTimePos(ms) * (W - 24);
  const chosen = DURATION_EXAMPLES.find((e) => e.name === sel);
  return (
    <View style={{ gap: 12 }}>
      <Lead>From an impulse to a continuous tone — sound durations span four orders of magnitude, so the timeline is logarithmic.</Lead>
      <View accessible accessibilityLabel={`Duration timeline: ${DURATION_EXAMPLES.map((e) => `${e.name} about ${e.ms} milliseconds, ${e.category}`).join('; ')}.`}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
          {DURATION_BANDS.map((b, i) => (
            <G key={b.category}>
              <Rect x={x(b.fromMs)} y={30} width={Math.max(1, x(b.toMs) - x(b.fromMs))} height={70} fill={[colors.red, colors.orange, colors.gold, colors.green, colors.blue][i]} opacity={0.08} />
              <SvgText x={(x(b.fromMs) + x(b.toMs)) / 2} y={24} fontSize={8.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b.category.toUpperCase()}</SvgText>
            </G>
          ))}
          <Line x1={12} y1={100} x2={W - 12} y2={100} stroke={colors.textSub} />
          {[1, 10, 100, 1000, 10000].map((ms) => (
            <SvgText key={ms} x={x(ms)} y={H - 34} fontSize={8} fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.barlowMedium}>{ms >= 1000 ? `${ms / 1000} s` : `${ms} ms`}</SvgText>
          ))}
          {DURATION_EXAMPLES.map((e, i) => (
            <G key={e.name} onPress={() => { setSel(e.name); if (!ctx.isDone) ctx.markDone(); }}>
              <Line x1={x(e.ms)} y1={100} x2={x(e.ms)} y2={46 + (i % 3) * 16} stroke={sel === e.name ? colors.cyanBright : colors.textMuted} strokeWidth={sel === e.name ? 2 : 1} />
              <SvgText x={x(e.ms)} y={43 + (i % 3) * 16} fontSize={8} fill={sel === e.name ? colors.cyanBright : colors.textSecondary} textAnchor="middle" fontFamily={fonts.barlowMedium}>{e.name}</SvgText>
            </G>
          ))}
          <SvgText x={W - 8} y={H - 8} fontSize={8} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.barlowMedium}>log time →</SvgText>
        </Svg>
      </View>
      <Row>
        {DURATION_EXAMPLES.map((e) => <Btn key={e.name} label={e.name} tone={sel === e.name ? 'primary' : 'plain'} onPress={() => { setSel(e.name); if (!ctx.isDone) ctx.markDone(); }} />)}
      </Row>
      <Card>
        {chosen ? (
          <>
            <Eyebrow>{chosen.name.toUpperCase()} · {chosen.category.toUpperCase()}</Eyebrow>
            <Body>About {chosen.ms >= 1000 ? `${(chosen.ms / 1000).toFixed(1)} s` : `${chosen.ms} ms`} — {DURATION_BANDS.find((b) => b.category === chosen.category)!.label}. {chosen.category === 'continuous' ? 'It lasts as long as energy is supplied; its envelope is all sustain.' : chosen.category === 'impulse' ? 'Over before the ear can follow it — an impulse is almost pure transient.' : 'Long enough to have a clear onset, body and tail.'}</Body>
          </>
        ) : (
          <Body>Tap an example to place it on the timeline. Typical values — real sounds vary.</Body>
        )}
      </Card>
    </View>
  );
}

/* ── page 5: peak vs average ────────────────────────────────────────────── */

function PagePeakAverage({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState<'snare' | 'trumpet'>('snare');
  const preset = PRESETS.find((p) => p.id === id)!;
  const wave = shapedWave(preset.adsr, 2000, 80);
  const pk = peakAbs(wave), av = rms(wave);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Two meters can disagree about the same sound: the peak follows the transient, the average follows the body.</Lead>
      <Row>
        <Btn label="Percussive (snare)" tone={id === 'snare' ? 'primary' : 'plain'} onPress={() => { setId('snare'); if (!ctx.isDone) ctx.markDone(); }} />
        <Btn label="Sustained (trumpet)" tone={id === 'trumpet' ? 'primary' : 'plain'} onPress={() => { setId('trumpet'); if (!ctx.isDone) ctx.markDone(); }} />
      </Row>
      <EnvelopeChart adsr={preset.adsr} showRegions={false} showPeakAvg title={`${preset.name.toUpperCase()} · PEAK VS AVERAGE`} />
      <Card>
        <Eyebrow>COMPUTED FROM THE DRAWN WAVEFORM</Eyebrow>
        <Text style={styles.read}>peak {toDb(pk).toFixed(1)} dB · average (RMS) {toDb(av).toFixed(1)} dB · crest factor {crestFactorDb(wave).toFixed(1)} dB</Text>
        <Body>{id === 'snare' ? 'The percussive sound spends almost all its time far below its peak: a big crest factor. A peak meter reads it as loud; an average meter barely moves.' : 'The sustained sound sits near its peak most of the time: a small crest factor. Peak and average meters nearly agree.'} Dynamic range is the span between the quietest and loudest levels a sound — or a system — actually uses; a transient-rich signal uses more of it.</Body>
      </Card>
    </View>
  );
}

/* ── page 6: envelope vs propagation ───────────────────────────────────── */

function PageScope({ ctx }: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      <Lead>Two ideas that are easy to blur, kept apart on purpose.</Lead>
      <Card>
        <Eyebrow>SOUND ENVELOPE · THIS LAB</Eyebrow>
        <Body>How a sound changes over time AT ITS SOURCE: attack, transient, decay, sustain, release, duration, peak versus average level.</Body>
      </Card>
      <Card>
        <Eyebrow>WAVE PROPAGATION · THE WAVE PHYSICS LAB</Eyebrow>
        <Body>How sound travels through a medium and meets the environment: speed of sound, distance, reflection, absorption, diffraction, refraction, coverage.</Body>
      </Card>
      <Body>ADSR does not describe propagation. A snare’s envelope is the same whether you stand at one metre or twenty — what changes with distance and the room is propagation, and that is the next lab’s subject.</Body>
      {!ctx.isDone ? <Btn label="GOT IT ›" tone="primary" onPress={ctx.markDone} /> : null}
    </View>
  );
}

/* ── page 7: checks ─────────────────────────────────────────────────────── */

function PageChecks({ ctx }: { ctx: PageCtx }) {
  const [, setN] = useState(0);
  const bump = () => setN((c) => { if (c + 1 >= 3) ctx.markDone(); return c + 1; });
  return (
    <View style={{ gap: 12 }}>
      <Lead>Four quick checks.</Lead>
      <UnderstandingCheck question="Which part of an envelope is the transient?" options={['The sustain', 'The fast-changing onset', 'The release', 'The gap between notes']} correct={1} explain="The transient is the brief, fast-changing onset — the part the ear uses to place and identify the sound." onCorrect={bump} />
      <UnderstandingCheck question="A piano note has a fast attack, a natural decay and…" options={['A long true sustain', 'No true sustain unless the pedal holds it', 'No decay', 'A slow attack']} correct={1} explain="A struck string can only decay; the pedal lets it ring longer, but nothing keeps supplying energy the way a bow does." onCorrect={bump} />
      <UnderstandingCheck question="Why can a peak meter and an average meter disagree about a snare hit?" options={['Meters are inaccurate', 'The transient sets the peak while the short body keeps the average low', 'Snares have no peak', 'Average meters ignore drums']} correct={1} explain="The hit spends almost all its time far below its peak — a large crest factor — so peak reads high while average stays low." onCorrect={bump} />
      <UnderstandingCheck question="Does ADSR describe how sound travels through a room?" options={['Yes — release is the room decay', 'No — ADSR describes the source over time; travel through space is propagation', 'Only for percussion', 'Only outdoors']} correct={1} explain="ADSR, transients and duration describe the sound at its source. Propagation — distance, reflections, absorption — is the Wave Physics lab’s subject." onCorrect={bump} />
    </View>
  );
}

const PAGES: PageDef[] = [
  { title: 'The Envelope Explorer', short: 'Explorer', Component: PageExplorer },
  { title: 'Common Sound Shapes', short: 'Gallery', Component: PageGallery },
  { title: 'Transient Explorer', short: 'Transients', Component: PageTransients },
  { title: 'How Long Does a Sound Last?', short: 'Duration', Component: PageDuration },
  { title: 'Peak vs Average Level', short: 'Peak/Avg', Component: PagePeakAverage },
  { title: 'Envelope vs Propagation', short: 'Scope', Component: PageScope },
  { title: 'Check Yourself', short: 'Check', Component: PageChecks },
];

export function EnvelopeLabScreen() {
  return <PagedLab labId="envelope" title="Sound Envelope & Transients Lab" subtitle="How a sound evolves over time — at its source." pages={PAGES} />;
}

const styles = StyleSheet.create({
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  gloss: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
