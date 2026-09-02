/**
 * Sound Envelope & Transients Lab (owner brief 2026-09-02) — how a sound
 * evolves over time at its source. Visual only: sliders redraw the envelope
 * instantly and a playhead can SWEEP the shape (slowed, badged); nothing is
 * ever played. Deliberately NOT about propagation (page 6 draws the line).
 *
 * Learning objectives from the brief, and where each lands:
 *   rise time        → p1 live readout + worked example, p3 markers, check 3
 *   transients       → p3 (sharp / soft / none + why they matter), check 1
 *   duration         → p4 numbered log timeline, impulse → continuous
 *   peak vs average  → p5 lines on the waveform + numbers, check 4
 *   dynamic range    → p5 worked example (four spans), check 5
 *   envelope ≠ propagation → p6, check 6
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import {
  PRESETS, SPEECH_SYLLABLES, TRANSIENTS, DURATION_BANDS, DURATION_EXAMPLES, logTimePos, speechCurve, riseTimeMs, adsrTotalMs,
  shapedWave, crestFactorDb, peakAbs, rms, toDb, type Adsr, type TransientKind,
} from '../../../features/envelope/envelopeModel';
import { PagedLab, type PageCtx, type PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { ControlSlider } from '../amp/kit';
import { CHART_HONESTY, EnvelopeChart } from './EnvelopeChart';

/** Preset handed from the gallery to the explorer (module-local, consumed once on arrival). */
let handoff: { name: string; adsr: Adsr } | null = null;

const DEFAULT: Adsr = { attackMs: 40, decayMs: 200, sustain: 0.6, releaseMs: 300, holdMs: 500 };

/** Words introduced where they are first needed (progressive disclosure):
 *  the four stages on page 1, transient + rise time on page 3, duration on page 4. */
const WORDS_ADSR: [string, string][] = [
  ['Envelope', 'the shape of a sound’s level over time, from silence back to silence'],
  ['Attack', 'the rise from silence to peak level'],
  ['Decay', 'the fall from peak toward the sustain level'],
  ['Sustain', 'the level held while energy keeps being supplied'],
  ['Release', 'the fall from the sustain level back to silence after the energy stops'],
];
const WORDS_TRANSIENT: [string, string][] = [
  ['Transient', 'the brief, fast-changing onset — the part the ear uses to place and identify a sound'],
  ['Rise time', 'how long the attack takes to climb from 10 % to 90 % of peak — always shorter than the attack itself'], // NEW COPY (definition extended)
];

/* ── shared helpers ─────────────────────────────────────────────────────── */

const fmtMs = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} s` : `${Math.round(v)} ms`);
/** Never prints "-0.0 dB". */
const fmtDb = (v: number) => { const r = Math.round(v * 10) / 10; return `${r === 0 ? '0.0' : r.toFixed(1)} dB`; };

/**
 * Mark the page done ONCE per mount. `ctx.isDone` seen from inside the shared
 * ControlSlider's PanResponder is the mount-time value (the responder keeps
 * the first onChange it was handed), so a ref — not the ctx — guards it.
 */
function useTouch(ctx: PageCtx) {
  const touched = useRef(false);
  return () => {
    if (touched.current) return;
    touched.current = true;
    if (!ctx.isDone) ctx.markDone();
  };
}

function Words({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <Card>
      <Eyebrow>{title}</Eyebrow>
      {items.map(([t, d]) => <Text key={t} style={styles.gloss}><Text style={styles.term}>{t}</Text> — {d}</Text>)}
    </Card>
  );
}

/* ── page 1: explorer ───────────────────────────────────────────────────── */

function PageExplorer({ ctx }: { ctx: PageCtx }) {
  const [loaded] = useState(() => { const h = handoff; handoff = null; return h; });
  const [adsr, setAdsr] = useState<Adsr>(() => loaded?.adsr ?? DEFAULT);
  const touch = useTouch(ctx);
  // FUNCTIONAL updates only: the shared ControlSlider's PanResponder keeps the
  // FIRST onChange it was given, so `{ ...adsr, [k]: v }` here would silently
  // reset every OTHER slider to its mount value on each drag.
  const set = (k: keyof Adsr) => (v: number) => { setAdsr((prev) => ({ ...prev, [k]: v })); touch(); };
  // Log sliders with an honest zero: position 0 IS 0 ms (a snare has no
  // release at all), then 1 ms … 2000 ms. Without it a gallery preset with
  // release 0 showed "1 ms" on the slider and "0 ms" in the readout.
  const logMs = (v: number) => (v <= 0 ? 0 : Math.round(Math.pow(10, v)));
  const toLog = (m: number) => (m <= 0 ? 0 : Math.log10(Math.max(1, m)));
  const rise = riseTimeMs(adsr);
  const snap = adsr.attackShape === 'exponential';
  const natural = adsr.decayShape === 'exponential';
  return (
    <View style={{ gap: 12 }}>
      <Lead>Every sound has a shape in time. Move the sliders and watch the envelope — and the waveform inside it — redraw instantly.</Lead>
      <Prompt>Try it: drag ATTACK all the way left, then all the way right. Watch the two gold dots — the rise-time markers — and the readout under the chart.</Prompt>{/* NEW COPY */}
      {loaded ? <Text style={styles.loaded}>LOADED FROM THE GALLERY · {loaded.name.toUpperCase()}</Text> : null}{/* NEW COPY */}
      <EnvelopeChart adsr={adsr} showRise sweep reduceMotion={ctx.reduceMotion} title="ENVELOPE · A / D / S / R (waveform shaped by it)" />
      <ControlSlider label="Attack" value={toLog(adsr.attackMs)} min={0} max={3.3} step={0.02} format={(v) => `${logMs(v)} ms`} onChange={(v) => set('attackMs')(logMs(v))} />
      <ControlSlider label="Decay" value={toLog(adsr.decayMs)} min={0} max={3.5} step={0.02} format={(v) => `${logMs(v)} ms`} onChange={(v) => set('decayMs')(logMs(v))} />
      <ControlSlider label="Sustain level" value={adsr.sustain} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)} %`} onChange={set('sustain')} />
      <ControlSlider label="Release" value={toLog(adsr.releaseMs)} min={0} max={3.5} step={0.02} format={(v) => `${logMs(v)} ms`} onChange={(v) => set('releaseMs')(logMs(v))} />
      <ControlSlider label="Hold (energy still supplied)" value={adsr.holdMs} min={0} max={2000} step={10} format={(v) => `${v} ms`} onChange={set('holdMs')} />
      <Row>
        <Btn label={snap ? 'ATTACK: SNAP' : 'ATTACK: LINEAR'} a11y={`Attack curve: ${snap ? 'snap' : 'linear'}. Tap to switch.`} onPress={() => { setAdsr((p) => ({ ...p, attackShape: p.attackShape === 'exponential' ? 'linear' : 'exponential' })); touch(); }} />
        <Btn label={natural ? 'DECAY: NATURAL' : 'DECAY: LINEAR'} a11y={`Decay curve: ${natural ? 'natural' : 'linear'}. Tap to switch.`} onPress={() => { setAdsr((p) => ({ ...p, decayShape: p.decayShape === 'exponential' ? 'linear' : 'exponential' })); touch(); }} />
        <Btn label="RESET" a11y="Reset the sliders to the starting shape" onPress={() => setAdsr(DEFAULT)} />
      </Row>
      <Card>
        <Eyebrow>READOUT · FROM THE DRAWN SHAPE</Eyebrow>
        <Text style={styles.read}>attack {fmtMs(adsr.attackMs)} → rise time (10→90 %) {rise.toFixed(1)} ms · total duration {fmtMs(adsrTotalMs(adsr))}</Text>
        {/* NEW COPY — live worked example for rise time */}
        <Body>{adsr.attackMs <= 0
          ? 'An attack of 0 ms is an ideal instant step — no real source manages it, and there is nothing left to measure a rise time on. Nudge ATTACK up and watch the gold markers appear.'
          : `Rise time (${rise.toFixed(1)} ms) is shorter than the attack (${fmtMs(adsr.attackMs)}) because it skips the first and last 10 % of the climb${snap ? ' — and a snap attack does most of its climbing early, so its rise time is shorter still' : ''}.`}</Body>
        <Body>{adsr.attackMs < 15 ? 'A fast attack like this IS a transient: the onset is over before the ear can follow it.' : adsr.attackMs < 120 ? 'A medium attack — the onset is audible as a shape, not a click.' : 'A slow attack has no real transient; the sound swells in.'} {adsr.sustain === 0 ? 'With zero sustain the sound is percussive: it can only decay.' : 'With sustain above zero the sound holds as long as energy keeps coming.'}</Body>
      </Card>
      <Words title="THE WORDS · THE FOUR STAGES" items={WORDS_ADSR} />
    </View>
  );
}

/* ── page 2: gallery ────────────────────────────────────────────────────── */

function PageGallery({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<string>('snare');
  const touch = useTouch(ctx);
  const preset = PRESETS.find((p) => p.id === sel);
  const pick = (id: string) => { setSel(id); touch(); };
  return (
    <View style={{ gap: 12 }}>
      <Lead>Simplified envelope shapes for common sounds. These are teaching shapes — real instruments vary with playing technique, register and room.</Lead>
      <Prompt>Compare a percussive shape with a sustained one: where does each spend most of its time — falling, or held?</Prompt>{/* NEW COPY */}
      <Row>
        {PRESETS.map((p) => <Btn key={p.id} label={p.name} tone={sel === p.id ? 'primary' : 'plain'} onPress={() => pick(p.id)} a11y={`${p.name}, ${p.kind}`} />)}
        <Btn label="Speech" tone={sel === 'speech' ? 'primary' : 'plain'} onPress={() => pick('speech')} a11y="Speech, a sequence of syllables" />
      </Row>
      {preset ? (
        <>
          <EnvelopeChart adsr={preset.adsr} sweep reduceMotion={ctx.reduceMotion} title={`${preset.name.toUpperCase()} · ${preset.kind.toUpperCase()} · TEACHING SHAPE`} />
          <Card>
            <Body>{preset.notice}</Body>
            {preset.bullets.map((b) => <Text key={b} style={styles.gloss}>• {b}</Text>)}
            <Text style={styles.read}>attack {preset.adsr.attackMs} ms · decay {preset.adsr.decayMs} ms · sustain {Math.round(preset.adsr.sustain * 100)} % · release {preset.adsr.releaseMs} ms</Text>
            <Btn
              label="LOAD INTO THE EXPLORER ›"
              tone="primary"
              a11y={`Load ${preset.name} into the explorer on page 1`}
              onPress={() => { handoff = { name: preset.name, adsr: preset.adsr }; if (ctx.goTo) ctx.goTo(0); }}
            />
            {!ctx.goTo ? <Body>Then go back one page — the explorer opens with this shape loaded.</Body> : null}
          </Card>
        </>
      ) : (
        <>
          <SpeechChart />
          <Card>
            <Body>Spoken language is a sequence of changing transients and sustained sounds: consonants are short bursts and stops, vowels are the sustained parts. Each syllable has its own small envelope, with near-silence between many of them — which is why speech needs its onsets intact to stay intelligible.</Body>
            <Body>Notice the gaps: a listener separates words by those near-silences and the sharp onsets that follow them. Smear the onsets — a slow compressor, a boomy room — and the words run together.</Body>{/* NEW COPY */}
            <Text style={styles.read}>{SPEECH_SYLLABLES.map((s) => s.label).join(' · ')} — {SPEECH_SYLLABLES.length} syllable envelopes</Text>
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
    <View style={{ gap: 4 }}>
      <Text style={styles.chartTitle}>SPEECH · “PRO-FES-SION-AL AU-DI-O” · {marks.length} SYLLABLE ENVELOPES</Text>
      <View accessible accessibilityRole="image" accessibilityLabel={`Speech: ${marks.length} syllables over ${Math.round(total)} milliseconds, each a short envelope with near-silence between. Illustrative model.`}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
          {marks.map((m, i) => (
            <G key={m.label}>
              <Rect x={x(m.startMs)} y={top - 4} width={Math.max(1, x(m.endMs) - x(m.startMs))} height={bottom - top + 8} fill="#ffffff" opacity={i % 2 ? 0.05 : 0.03} />
              <SvgText x={(x(m.startMs) + x(m.endMs)) / 2} y={H - 8} fontSize={9.5} fill={colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{m.label}</SvgText>
            </G>
          ))}
          <Line x1={10} y1={bottom} x2={W - 10} y2={bottom} stroke="rgba(255,255,255,0.12)" />
          <Polyline points={pts} fill="none" stroke={colors.cyanBright} strokeWidth={2} />
          <SvgText x={W - 8} y={12} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.barlowMedium}>{Math.round(total)} ms →</SvgText>
        </Svg>
      </View>
      <Text style={styles.caption}>{CHART_HONESTY} · syllable timing is typical, not a recording</Text>
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
  const touch = useTouch(ctx);
  const t = TRANSIENTS[kind];
  return (
    <View style={{ gap: 12 }}>
      <Lead>The transient is the onset — the first few milliseconds. It carries more information than its size suggests.</Lead>
      <Prompt>Step through the three onsets and watch the rise-time readout jump from about a millisecond to hundreds. Same peak level each time — only the onset changes.</Prompt>{/* NEW COPY */}
      <Row>
        {(Object.keys(TRANSIENTS) as TransientKind[]).map((k) => <Btn key={k} label={TRANSIENTS[k].name} tone={kind === k ? 'primary' : 'plain'} onPress={() => { setKind(k); touch(); }} />)}
      </Row>
      <EnvelopeChart adsr={t.adsr} showRise sweep reduceMotion={ctx.reduceMotion} title={`${t.name.toUpperCase()} · TEACHING SHAPE`} />
      <Card>
        <Body>{t.note}</Body>
        <Text style={styles.read}>rise time (10→90 %) {riseTimeMs(t.adsr).toFixed(1)} ms · attack {fmtMs(t.adsr.attackMs)}</Text>
      </Card>
      <Words title="THE WORDS · ONSETS" items={WORDS_TRANSIENT} />
      <Eyebrow>WHY TRANSIENTS MATTER</Eyebrow>
      <Card>
        {WHY.map(([k, d]) => <Text key={k} style={styles.gloss}><Text style={styles.term}>{k}</Text> — {d}</Text>)}
      </Card>
    </View>
  );
}

/* ── page 4: duration ───────────────────────────────────────────────────── */

function PageDuration({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<number | null>(null);
  const touch = useTouch(ctx);
  const W = 340, H = 150, AXIS = 104, PAD = 12;
  const x = (msv: number) => PAD + logTimePos(msv) * (W - 2 * PAD);
  const chosen = sel != null ? DURATION_EXAMPLES[sel] : null;
  const pick = (i: number) => { setSel(i); touch(); };
  // The selected marker's name is the only label drawn in the chart: seven
  // names on a log axis collided in three staggered rows, so the markers are
  // numbered and the numbered buttons below carry the names.
  const lx = chosen ? x(chosen.ms) : 0;
  const anchor: 'start' | 'middle' | 'end' = lx < 70 ? 'start' : lx > W - 70 ? 'end' : 'middle';
  const labelX = anchor === 'start' ? Math.max(PAD, lx - 8) : anchor === 'end' ? Math.min(W - PAD, lx + 8) : lx;
  return (
    <View style={{ gap: 12 }}>
      <Lead>From an impulse to a continuous tone — sound durations span four orders of magnitude, so the timeline is logarithmic.</Lead>
      <Prompt>Tap a numbered marker, or its button. Notice how far apart 12 ms and 12 s sit: each equal step along the axis is ten times longer.</Prompt>{/* NEW COPY */}
      <View style={{ gap: 4 }}>
        <Text style={styles.chartTitle}>DURATION · IMPULSE → CONTINUOUS · LOG TIME</Text>
        <View accessible accessibilityRole="image" accessibilityLabel={`Duration timeline on a logarithmic axis from 1 millisecond to 20 seconds: ${DURATION_EXAMPLES.map((e, i) => `${i + 1}, ${e.name}, about ${fmtMs(e.ms)}, ${e.category}`).join('; ')}.${chosen ? ` Selected: ${chosen.name}.` : ''} Typical values, illustrative.`}>
          <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <Rect x={0} y={0} width={W} height={H} rx={8} fill="#0a0a0c" stroke={colors.hairline} />
            {DURATION_BANDS.map((b, i) => (
              <G key={b.category}>
                <Rect x={x(b.fromMs)} y={32} width={Math.max(1, x(b.toMs) - x(b.fromMs))} height={AXIS - 32} fill="#ffffff" opacity={i % 2 ? 0.05 : 0.025} />
                <SvgText x={(x(b.fromMs) + x(b.toMs)) / 2} y={26} fontSize={8.5} fill={chosen?.category === b.category ? colors.cyanBright : colors.textSub} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{b.category.toUpperCase()}</SvgText>
              </G>
            ))}
            <Line x1={PAD} y1={AXIS} x2={W - PAD} y2={AXIS} stroke={colors.textSub} />
            {[1, 10, 100, 1000, 10000].map((tick) => (
              <G key={tick}>
                <Line x1={x(tick)} y1={AXIS} x2={x(tick)} y2={AXIS + 4} stroke={colors.textSub} />
                <SvgText x={x(tick)} y={AXIS + 15} fontSize={8.5} fill={colors.textMuted} textAnchor={tick === 1 ? 'start' : 'middle'} fontFamily={fonts.barlowMedium}>{tick >= 1000 ? `${tick / 1000} s` : `${tick} ms`}</SvgText>
              </G>
            ))}
            {chosen ? (
              <G>
                <Line x1={lx} y1={AXIS - 9} x2={lx} y2={54} stroke={colors.cyanBright} strokeWidth={1} />
                <SvgText x={labelX} y={50} fontSize={9.5} fill={colors.cyanBright} textAnchor={anchor} fontFamily={fonts.oswaldMedium}>{chosen.name.toUpperCase()} · {fmtMs(chosen.ms)}</SvgText>
              </G>
            ) : null}
            {DURATION_EXAMPLES.map((e, i) => {
              const on = sel === i;
              const cx = x(e.ms);
              return (
                <G key={e.name} onPress={() => pick(i)}>
                  {/* invisible hit area — the numbered buttons below are the 44 pt targets */}
                  <Rect x={cx - 13} y={AXIS - 24} width={26} height={44} fill="#000000" fillOpacity={0.01} />
                  <Circle cx={cx} cy={AXIS} r={on ? 8 : 6.5} fill={on ? colors.cyanBright : '#0a0a0c'} stroke={on ? colors.cyanBright : colors.textSub} strokeWidth={1.2} />
                  <SvgText x={cx} y={AXIS + 3.2} fontSize={8.5} fill={on ? colors.black : colors.textSecondary} textAnchor="middle" fontFamily={fonts.oswaldMedium}>{i + 1}</SvgText>
                </G>
              );
            })}
            <SvgText x={W - 8} y={H - 8} fontSize={8.5} fill={colors.textMuted} textAnchor="end" fontFamily={fonts.barlowMedium}>log time →</SvgText>
          </Svg>
        </View>
        <Text style={styles.caption}>TYPICAL VALUES — ILLUSTRATIVE, NOT MEASURED · real sounds vary</Text>{/* NEW COPY */}
      </View>
      <Row>
        {DURATION_EXAMPLES.map((e, i) => <Btn key={e.name} label={`${i + 1} · ${e.name}`} tone={sel === i ? 'primary' : 'plain'} onPress={() => pick(i)} a11y={`${i + 1}, ${e.name}, about ${fmtMs(e.ms)}, ${e.category}`} />)}
      </Row>
      <Card>
        {chosen ? (
          <>
            <Eyebrow>{chosen.name.toUpperCase()} · {chosen.category.toUpperCase()}</Eyebrow>
            <Body>About {fmtMs(chosen.ms)} — {DURATION_BANDS.find((b) => b.category === chosen.category)!.label}. {chosen.category === 'continuous' ? 'It lasts as long as energy is supplied; its envelope is all sustain.' : chosen.category === 'impulse' ? 'Over before the ear can follow it — an impulse is almost pure transient.' : 'Long enough to have a clear onset, body and tail.'}</Body>
          </>
        ) : (
          <Body>Tap an example to place it on the timeline. Typical values — real sounds vary.</Body>
        )}
        {/* NEW COPY */}
        <Body>Why duration matters: the shorter a sound, the less time any processor has to react — an impulse is over before a slow compressor notices it, which is why limiters look ahead. The longer a sound, the more its body, not its onset, sets what a meter reads as its level.</Body>
      </Card>
    </View>
  );
}

/* ── page 5: peak vs average ────────────────────────────────────────────── */

function PagePeakAverage({ ctx }: { ctx: PageCtx }) {
  const [id, setId] = useState<'snare' | 'trumpet'>('snare');
  const touch = useTouch(ctx);
  const preset = PRESETS.find((p) => p.id === id)!;
  const wave = shapedWave(preset.adsr, 2000, 80);
  const pk = peakAbs(wave), av = rms(wave);
  const crest = crestFactorDb(wave);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Two meters can disagree about the same sound: a peak meter follows the transient, an average meter follows the body.</Lead>
      <Prompt>Switch between the two shapes and watch the gap between the PEAK line and the AVERAGE line. That gap is the crest factor.</Prompt>{/* NEW COPY */}
      <Row>
        <Btn label="Percussive (snare)" tone={id === 'snare' ? 'primary' : 'plain'} onPress={() => { setId('snare'); touch(); }} />
        <Btn label="Sustained (trumpet)" tone={id === 'trumpet' ? 'primary' : 'plain'} onPress={() => { setId('trumpet'); touch(); }} />
      </Row>
      <EnvelopeChart adsr={preset.adsr} showRegions={false} showPeakAvg title={`${preset.name.toUpperCase()} · PEAK VS AVERAGE`} caption="levels relative to the drawn peak" />
      <Card>
        <Eyebrow>COMPUTED FROM THE DRAWN WAVEFORM · RELATIVE TO ITS PEAK</Eyebrow>
        <Text style={styles.read}>
          <Text style={{ color: colors.textPrimary }}>peak {fmtDb(toDb(pk))}</Text> · <Text style={{ color: colors.purple }}>average (RMS) {fmtDb(toDb(av))}</Text> · crest factor {crest.toFixed(1)} dB
        </Text>
        <Body>{id === 'snare' ? 'The percussive sound spends almost all its time far below its peak: a big crest factor. A peak meter reads it as loud; an average meter barely moves.' : 'The sustained sound sits near its peak most of the time: a small crest factor. Peak and average meters nearly agree.'}</Body>
      </Card>
      <Card>
        <Eyebrow>WORKED EXAMPLE · FOUR DIFFERENT SPANS</Eyebrow>
        {/* NEW COPY — dynamic range was a single clause before; the brief lists it as an objective */}
        <Body><Text style={styles.term}>Peak</Text> — the highest instant. Here {fmtDb(toDb(pk))}.</Body>
        <Body><Text style={styles.term}>Average (RMS)</Text> — what the body of the sound works out to. Here {fmtDb(toDb(av))}.</Body>
        <Body><Text style={styles.term}>Crest factor</Text> = peak − average = {crest.toFixed(1)} dB. It belongs to ONE sound.</Body>
        <Body><Text style={styles.term}>Dynamic range</Text> = loudest − quietest. It belongs to a whole performance (a whisper at −50 dB against a shout at 0 dB is 50 dB of dynamic range) or to a system (its clipping point down to its noise floor). Crest factor and dynamic range are different spans — a transient-rich signal needs more of a system’s range because its peaks sit so far above its average.</Body>
      </Card>
      <Card>
        <Eyebrow>WHY IT MATTERS</Eyebrow>
        {/* NEW COPY */}
        <Body>Peak limiters watch peaks, because that is where clipping happens. Loudness targets and VU-style meters watch averages, because that is closer to what the ear calls loud. Set a gain structure by the average alone and the transients clip; set it by the peaks alone and the programme sounds quiet.</Body>
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
      <Body>The classic mix-up: a long reverb tail is NOT a long release. Release is the source stopping; the tail is the room still returning energy after it has.</Body>{/* NEW COPY */}
      {!ctx.isDone ? <Btn label="GOT IT ›" tone="primary" onPress={ctx.markDone} /> : null}
    </View>
  );
}

/* ── page 7: checks ─────────────────────────────────────────────────────── */

/** Correct answers deliberately land on different positions (2,0,1,3,1,2) and
 *  distractors are written to similar lengths — no position or length cue.
 *  Each check targets a named misconception; the explanation names it. */
const CHECKS: { q: string; options: string[]; correct: number; explain: string }[] = [
  {
    q: 'Which part of an envelope is the transient?',
    options: ['The steady sustain', 'The fading release', 'The fast-changing onset', 'The silence between notes'], // NEW COPY (rebalanced)
    correct: 2,
    explain: 'The transient is the brief, fast-changing onset — the part the ear uses to place and identify the sound.',
  },
  {
    q: 'A piano note has a fast attack, a natural decay and…',
    options: ['No true sustain — it can only decay', 'A long, true sustain', 'No decay at all', 'A slow, swelling attack'], // NEW COPY (rebalanced)
    correct: 0,
    explain: 'A struck string can only lose energy. The pedal lets that decay run longer, but nothing keeps supplying energy the way a bow does.', // NEW COPY
  },
  {
    // NEW COPY — rise time objective
    q: 'A drawn attack takes 40 ms from silence to peak. Its rise time (10→90 %) is…',
    options: ['Zero — rise time only applies to percussion', 'Less than 40 ms — it skips the slow start and the final approach', 'Exactly 40 ms — rise time and attack time are the same thing', 'More than 40 ms — it includes the decay as well'],
    correct: 1,
    explain: 'Rise time is measured between the 10 % and 90 % crossings, so it is always shorter than the attack: about 32 ms for a linear 40 ms attack, shorter still for a snap. Attack time and rise time are related but not the same.',
  },
  {
    q: 'Why can a peak meter and an average meter disagree about a snare hit?',
    options: ['One of the two meters must be miscalibrated', 'Both read the same level, just on different scales', 'Average meters are built to ignore percussion', 'The hit sets the peak; the short body keeps the average low'], // NEW COPY (rebalanced)
    correct: 3,
    explain: 'The hit spends almost all its time far below its peak — a large crest factor — so the peak reads high while the average stays low. Both meters are right; they measure different things.', // NEW COPY
  },
  {
    // NEW COPY — dynamic range objective
    q: 'Crest factor and dynamic range are…',
    options: ['Two names for the same span, used by different manufacturers', 'Two different spans — one sound’s peak-to-average versus loudest-to-quietest overall', 'Two ways of reading the same peak meter, in dBFS and in VU', 'Two settings on a compressor — the ratio and the threshold'],
    correct: 1,
    explain: 'Crest factor is peak minus average of ONE sound. Dynamic range is loudest minus quietest — across a performance, or from a system’s clipping point down to its noise floor.',
  },
  {
    q: 'Does ADSR describe how sound travels through a room?',
    options: ['Only for percussive sounds, where the room matters most', 'Yes — the release stage is the room’s decay, which is why long halls sound sustained', 'No — ADSR describes the source over time; travel through space is propagation', 'Only outdoors, where there are no reflections to shape it'], // NEW COPY (rebalanced)
    correct: 2,
    explain: 'ADSR, transients and duration describe the sound at its source. The room’s decay is reverberation — propagation, the Wave Physics lab’s subject. A snare’s release is the same in any room.', // NEW COPY
  },
];

function PageChecks({ ctx }: { ctx: PageCtx }) {
  const got = useRef(new Set<number>());
  const [n, setN] = useState(0);
  const complete = ctx.isDone || n >= CHECKS.length;
  const onCorrect = (i: number) => () => {
    got.current.add(i);
    setN(got.current.size);
    if (got.current.size >= CHECKS.length && !ctx.isDone) ctx.markDone();
  };
  return (
    <View style={{ gap: 12 }}>
      <Lead>Six checks — one per idea in this lab. A wrong pick explains itself and lets you try again.</Lead>{/* NEW COPY */}
      <Card tone={complete ? 'ok' : 'plain'}>
        <Eyebrow>{n} OF {CHECKS.length} CORRECT</Eyebrow>
        <Body>{complete ? (ctx.isDone && n < CHECKS.length ? 'This page is already complete — answer again for practice.' : 'All six — the lab is complete. FINISH below records it.') : 'FINISH unlocks when all six are answered correctly.'}</Body>{/* NEW COPY */}
      </Card>
      {CHECKS.map((c, i) => <UnderstandingCheck key={i} question={c.q} options={c.options} correct={c.correct} explain={c.explain} onCorrect={onCorrect(i)} />)}
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
  { title: 'Check Yourself', short: 'Check', Component: PageChecks, manualDone: true },
];

export function EnvelopeLabScreen() {
  return <PagedLab labId="envelope" title="Sound Envelope & Transients Lab" subtitle="How a sound evolves over time — at its source." pages={PAGES} />;
}

const styles = StyleSheet.create({
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  gloss: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  term: { color: colors.textPrimary, fontFamily: fonts.barlowMedium },
  loaded: { color: colors.green, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.5 },
  chartTitle: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.5 },
  caption: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1, lineHeight: 13 },
});
