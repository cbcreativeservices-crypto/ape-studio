/**
 * De-Esser & Sibilance Control Lab (owner brief 2026-09-02) — V1 of the
 * Smart Processors family. Eight teaching screens + connections on the
 * PagedLab shell. Visual only; every display is computed by deEsserModel
 * from a modelled phrase, labelled conceptual.
 *
 * Review pass 2026-09-02: one rack shared across pages and reset whenever
 * the lab is opened; each page states what to notice; every check sits on
 * the page that taught the idea, after its worked example, with the options
 * shuffled once per mount; gain reduction drawn orange (red = clipping only).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import {
  CONNECTIONS, DEFAULTS, FREQ_HINTS, FREQ_MAX, FREQ_MIN, OVER_STAGES, OVER_THRESHOLD_SPAN_DB, PATH_MAIN, PATH_SIDECHAIN, PHRASE,
  bandpassGain, detectorCurve, eqCut, meanSibilantGr, overSettings, overStage, processPhrase, sFrameSpectrum, vowelBrightnessLossDb,
  type Frame, type FreqHint, type Settings,
} from '../../../features/deesser/deEsserModel';
import { navigationRef } from '../../../navigation/navigationRef';
import { PagedLab, type PageCtx, type PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { ControlSlider } from '../amp/kit';
import { BandSpectrum, DetectorTrace, FrameStrip, HissDbStrip, PathDiagram } from './deEsserViz';

/** One rack: settings persist across pages while the lab is open. The
 *  module-level object is the source of truth; a page mirrors it into local
 *  state on mount (the shell mounts one page at a time) and every write goes
 *  through it, so a page never merges a patch into a stale copy. */
let rack: Settings = { ...DEFAULTS };
function useRack(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(() => rack);
  const set = (patch: Partial<Settings>) => { rack = { ...rack, ...patch }; setS(rack); };
  return [s, set];
}

const touch = (ctx: PageCtx) => { if (!ctx.isDone) ctx.markDone(); };

/** Indexes of the sibilant frames. */
const SIB = PHRASE.map((f, i) => (f.sibilant ? i : -1)).filter((i) => i >= 0);
const nextSib = (from: number) => SIB.find((i) => i > from) ?? SIB[0];
const kHz = (hz: number) => `${(hz / 1000).toFixed(1)} kHz`;

/** UnderstandingCheck with its options shuffled once per mount, so neither
 *  position nor authoring order can cue the answer. */
function Check({ question, options, correct, explain, onCorrect }: { question: string; options: string[]; correct: number; explain: string; onCorrect?: () => void }) {
  const s = useMemo(() => {
    const idx = options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return { options: idx.map((i) => options[i]), correct: idx.indexOf(correct) };
    // Options are literals at every call site: shuffle once per mount, never per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <UnderstandingCheck question={question} options={s.options} correct={s.correct} explain={explain} onCorrect={onCorrect} />;
}

/** Keeps a one-glyph button at a 44-pt minimum width. */
function Wide({ children }: { children: ReactNode }) {
  return <View style={{ minWidth: 48 }}>{children}</View>;
}

/* ── 1 what is sibilance ───────────────────────────────────────────────── */

function PageWhat({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<number>(11);
  const f = PHRASE[sel];
  const sp = sFrameSpectrum(f, 48);
  const pick = (i: number) => { setSel((i + PHRASE.length) % PHRASE.length); touch(ctx); };
  const gap = f.label === '·';
  return (
    <View style={{ gap: 12 }}>
      {/* NEW COPY: S vs SH placement made explicit so the 2–10 kHz band is explained, not asserted. */}
      <Lead>Sibilance is the hiss of S, Z, SH and CH — air turbulence at the teeth. An S sits mostly between 4 and 10 kHz; SH and CH sit lower, nearer 2–5 kHz. That whole 2–10 kHz region is where the ear is sensitive and where bright microphones add the most.</Lead>
      <Prompt>Tap a frame in the strip. Notice where its energy sits — vowels low, sibilants high.</Prompt>
      <FrameStrip frames={PHRASE} selected={sel} onSelect={pick} title="A SPOKEN PHRASE · FRAME BY FRAME" a11y={`The phrase ${PHRASE.map((p) => p.label).join(' ')} as frames; the sibilant frames carry the hiss. Frame ${sel + 1}, ${f.label}, is selected.`} />
      <Row>
        <Wide><Btn label="‹" onPress={() => pick(sel - 1)} a11y="Previous frame" /></Wide>
        <Wide><Btn label="›" onPress={() => pick(sel + 1)} a11y="Next frame" /></Wide>
        <Btn label="JUMP TO AN S" onPress={() => pick(nextSib(sel))} a11y="Jump to the next sibilant frame" />
        <Text style={styles.read}>frame {sel + 1} · “{f.label}”</Text>
      </Row>
      <BandSpectrum hz={sp.hz} mag={sp.mag} band={[2000, 10000]} title={`FRAME “${f.label.toUpperCase()}” · SPECTRUM`} a11y={f.sibilant ? `Spectrum of ${f.label}: energy concentrated around ${f.hissHz} hertz.` : gap ? 'Spectrum of a gap between words: almost nothing.' : `Spectrum of ${f.label}: energy mostly below 1 kilohertz.`} />
      <Card>
        <Body>{f.sibilant
          ? `A sibilant frame: almost all of its energy is hiss near ${kHz(f.hissHz)}, and very little body.`
          : gap
            ? 'A gap between words: almost nothing in either band — the de-esser has nothing to decide here.'
            : 'A voiced frame: energy in the low and mid range — the body of the voice — with only a trace of hiss.'} The de-esser's whole job is to tell these apart and act on one kind only.</Body>
        {/* NEW COPY: compression clause corrected — it lifts the S's relative to the vowels; it does not "raise quiet sounds". */}
        <Body>Why it becomes a problem: close placement, bright condensers, presence EQ, and heavy compression (which brings the S’s up relative to the vowels) all push the S’s out of proportion.</Body>
      </Card>
    </View>
  );
}

/* ── 2 EQ vs de-esser ─────────────────────────────────────────────────── */

function PageEqVs({ ctx }: { ctx: PageCtx }) {
  const [which, setWhich] = useState<'eq' | 'de'>('eq');
  const cut = 8;
  const eq = eqCut(PHRASE, cut);
  const de = processPhrase(PHRASE, { ...DEFAULTS, thresholdDb: -12, rangeDb: cut });
  const out = which === 'eq' ? eq : de;
  const loss = vowelBrightnessLossDb(PHRASE, out);
  const sGr = which === 'eq' ? cut : meanSibilantGr(de);
  return (
    <View style={{ gap: 12 }}>
      <Lead>An EQ cut is always on. A de-esser is on only while there is an S. That one difference is the whole reason it exists.</Lead>
      <Prompt>Switch between the two and watch the non-S frames in the dB strip: does their hiss band drop as well?</Prompt>
      <Row>
        <Btn label={`STATIC EQ CUT · −${cut} dB`} tone={which === 'eq' ? 'primary' : 'plain'} onPress={() => { setWhich('eq'); touch(ctx); }} />
        <Btn label="DE-ESSER" tone={which === 'de' ? 'primary' : 'plain'} onPress={() => { setWhich('de'); touch(ctx); }} />
      </Row>
      <FrameStrip frames={PHRASE} output={out} title={which === 'eq' ? 'OUTPUT · STATIC EQ (input as ghost)' : 'OUTPUT · DE-ESSER (input as ghost)'} a11y={which === 'eq' ? 'With a static EQ cut every frame loses the same amount of hiss — vowels included.' : 'With the de-esser only the sibilant frames are reduced; the vowels are untouched.'} />
      <HissDbStrip frames={PHRASE} output={out} a11y={which === 'eq' ? `On a decibel scale every frame's hiss band drops by ${cut} dB, vowels and gaps included.` : `On a decibel scale only the sibilant frames drop, by up to ${cut} dB; every other frame is unchanged.`} />
      <Card tone={which === 'eq' ? 'warn' : 'ok'}>
        <Eyebrow>{which === 'eq' ? 'WHAT THE EQ DID' : 'WHAT THE DE-ESSER DID'}</Eyebrow>
        {/* NEW COPY: "vowels" → "everything that is not an S" (the measure includes TH and P). */}
        <Text style={styles.read}>brightness taken from everything that is not an S: {loss.toFixed(1)} dB · S’s reduced by about {sGr.toFixed(1)} dB</Text>
        <Body>{which === 'eq'
          ? 'The S’s are tamed — and so is every vowel, every breath and the air of the whole recording. Dull the voice enough to fix the S and you have a dull voice.'
          : 'The S’s are tamed and the vowels keep every bit of their brightness, because the gain only moves while the detector hears hiss.'}</Body>
      </Card>
      {/* NEW COPY: check rewritten with length-balanced options. */}
      <Check
        question="Why is a static EQ cut a poor de-esser?"
        options={['It cannot cut deeply enough to tame a loud S', 'It is on all the time, so the vowels lose brightness too', 'EQ bands cannot be placed as high as 6 kHz', 'It adds noise to the recording every time it cuts']}
        correct={1}
        explain="The cut never switches off, so every vowel, breath and bit of air loses the same 8 dB. A de-esser acts only while the detector hears hiss."
        onCorrect={() => touch(ctx)}
      />
    </View>
  );
}

/* ── 3 detection path ──────────────────────────────────────────────────── */

const ORDER = ['in', 'bpf', 'det', 'thr', 'gc', 'gain', 'out'];

function PagePath({ ctx }: { ctx: PageCtx }) {
  const [rackS] = useRack();
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto || ctx.reduceMotion) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ORDER.length), 1600);
    return () => clearInterval(id);
  }, [auto, ctx.reduceMotion]);
  const active = ORDER[idx];
  const block = [...PATH_MAIN, ...PATH_SIDECHAIN].find((b) => b.id === active)!;
  return (
    <View style={{ gap: 12 }}>
      <Lead>A de-esser is a compressor with a filtered ear. The voice goes straight through a gain element; a filtered copy decides how much that gain element turns down.</Lead>
      <Prompt>Tap each block, or walk the signal. Notice that the voice itself never passes through the filter.</Prompt>
      <PathDiagram active={active} mode={rackS.mode} onSelect={(id) => { setIdx(Math.max(0, ORDER.indexOf(id))); setAuto(false); touch(ctx); }} />
      <Card tone="math">
        <Eyebrow>{idx + 1} OF {ORDER.length} · {block.name.toUpperCase()}</Eyebrow>
        <Body>{block.what}</Body>
      </Card>
      <Row>
        <Btn label="NEXT BLOCK ›" tone="primary" onPress={() => { setIdx((i) => (i + 1) % ORDER.length); setAuto(false); touch(ctx); }} />
        {!ctx.reduceMotion ? <Btn label={auto ? 'STOP' : 'WALK THE SIGNAL'} onPress={() => { setAuto((a) => !a); touch(ctx); }} a11y={auto ? 'Stop walking the signal' : 'Walk the signal through every block automatically'} /> : null}
      </Row>
      <Body>The band-pass filter is the smart part: it is NOT in the signal path. It only shapes what the detector hears, so the decision is made on the hiss alone while the whole voice passes through untouched until the gain moves.</Body>
      {/* NEW COPY: check rewritten with length-balanced options. */}
      <Check
        question="Where does a de-esser's band-pass filter sit?"
        options={['In the signal path, cutting the highs from the whole voice', 'In the side chain, shaping only what the detector listens to', 'After the gain element, cleaning up whatever is left over', 'Nowhere — a de-esser uses a high shelf, not a band-pass']}
        correct={1}
        explain="The filter is in the side chain: it decides, it does not process. The voice passes through the gain element untouched until the gain moves."
        onCorrect={() => touch(ctx)}
      />
    </View>
  );
}

/* ── 4 threshold ───────────────────────────────────────────────────────── */

function PageThreshold({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const out = processPhrase(PHRASE, s);
  const overSib = out.filter((p) => p.grDb > 0 && p.frame.sibilant).length;
  const overOther = out.filter((p) => p.grDb > 0 && !p.frame.sibilant).length;
  const over = overSib + overOther;
  return (
    <View style={{ gap: 12 }}>
      <Lead>The threshold is the level the hiss must reach before anything happens. Above it, the de-esser turns down; below it, it is not even there.</Lead>
      <Prompt>Drag the threshold up until nothing crosses, then down until the gaps cross. Find the band where only orange labels sit above the line.</Prompt>
      <ControlSlider level label="Threshold" value={s.thresholdDb} min={-40} max={0} step={1} format={(v) => `${v.toFixed(0)} dB`} onChange={(v) => { set({ thresholdDb: v }); touch(ctx); }} />
      <DetectorTrace processed={out} thresholdDb={s.thresholdDb} rangeDb={s.rangeDb} a11y={`Detector trace across the phrase with the threshold at ${s.thresholdDb} dB; ${overSib} of ${SIB.length} sibilants and ${overOther} other sounds are above it and being reduced.`} />
      <Card tone={overOther > 0 ? 'warn' : over === 0 ? 'plain' : 'ok'}>
        <Text style={styles.read}>{overSib} of {SIB.length} sibilants above threshold · {overOther} other sounds crossing</Text>
        {/* NEW COPY: the first non-sibilant sounds to cross are TH and P, not vowels; a partial-catch state added. */}
        <Body>{over === 0
          ? 'Too high: no S reaches the threshold, so the de-esser does nothing at all.'
          : overOther > 0
            ? 'Too low: sounds that were never the problem — TH, P, vowels, even the gaps between words — are crossing too, so the voice ducks where there is no hiss to remove. Raise it until only the S’s are above the line.'
            : overSib < SIB.length
              ? `Catching the loudest S’s only: ${overSib} of ${SIB.length}. Fine if only the worst ones bother you — lower it a little to catch the softer SH and Z as well.`
              : 'About right: every sibilant crosses the line and nothing else does. The gain moves on S’s and nowhere else.'}</Body>
      </Card>
      {/* NEW COPY: misconception check — "more reduction is better". */}
      <Check
        question="You lower the threshold until reduction appears under the vowels as well as the S’s. What is the de-esser doing now?"
        options={['Working harder, which is what a bright voice needs', 'Ducking the voice on sounds that were never the problem', 'Nothing extra — vowels sit below 2 kHz and cannot trigger it', 'Adding hiss to the vowels to balance the S’s']}
        correct={1}
        explain="Reduction under a vowel means the detector heard enough energy in the band to cross the line. Now the voice dips where there was no hiss to remove — raise the threshold until only the S’s cross."
        onCorrect={() => touch(ctx)}
      />
    </View>
  );
}

/* ── 5 frequency selection ────────────────────────────────────────────── */

function PageFrequency({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const [pick, setPick] = useState<number>(SIB[3]);
  const [hint, setHint] = useState<FreqHint | null>(null);
  const f: Frame = PHRASE[pick];
  const sp = sFrameSpectrum(f, 48);
  const dc = detectorCurve(s, 48);
  // The fraction of THIS sibilant's hiss the band-pass lets through (not
  // scaled by how loud the hiss is — a centred band on a soft SH is still 100 %).
  const heard = bandpassGain(f.hissHz, s.freqHz, s.q);
  const pct = Math.round(heard * 100);
  const logMin = Math.log(FREQ_MIN), logMax = Math.log(FREQ_MAX);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Every voice hisses in its own place. Aim the detector at that place — too low and it hears the voice, too high and it misses the S.</Lead>
      <Prompt>Pick a sibilant, then move the detector until the gold band sits on its hiss. Try the SH — it lives lower than the S’s.</Prompt>
      <ControlSlider label="Detector frequency" value={Math.log(s.freqHz)} min={logMin} max={logMax} step={0.01} format={(v) => kHz(Math.exp(v))} onChange={(v) => { set({ freqHz: Math.round(Math.exp(v) / 50) * 50 }); setHint(null); touch(ctx); }} />
      <ControlSlider label="Band width" value={s.q} min={0.7} max={4} step={0.1} format={(v) => (v < 1.2 ? 'wide' : v < 2.5 ? 'medium' : 'narrow')} onChange={(v) => { set({ q: v }); touch(ctx); }} />
      <Row>
        {SIB.map((i) => <Btn key={i} label={`“${PHRASE[i].label}” · ${(PHRASE[i].hissHz / 1000).toFixed(1)}k`} tone={pick === i ? 'primary' : 'plain'} onPress={() => { setPick(i); touch(ctx); }} a11y={`Sibilant ${PHRASE[i].label}, hiss near ${PHRASE[i].hissHz} hertz`} />)}
      </Row>
      <BandSpectrum hz={sp.hz} mag={sp.mag} curve={dc.mag} band={[2000, 10000]} title={`“${f.label.toUpperCase()}” SPECTRUM · DETECTOR AT ${kHz(s.freqHz)}`} caption="Gold dashed line: the detector's band-pass — the part of this sound it can hear." a11y={`Spectrum of ${f.label} with hiss near ${f.hissHz} hertz; the detector band is centred at ${s.freqHz} hertz and passes ${pct} percent of that hiss.`} />
      <Card tone={heard > 0.7 ? 'ok' : heard > 0.4 ? 'plain' : 'warn'}>
        <Text style={styles.read}>the detector hears {pct}% of this “{f.label}”’s hiss</Text>
        <Body>{heard > 0.7 ? 'On target: the band sits on the hiss, so a modest threshold catches it cleanly.' : heard > 0.4 ? 'Partly: it will catch loud S’s and miss quiet ones. Move the frequency toward the hiss or widen the band.' : 'Missing it: the S passes through untouched — the detector is listening somewhere else.'}</Body>
      </Card>
      <Eyebrow>STARTING POINTS</Eyebrow>
      <Row>
        {FREQ_HINTS.map((h) => <Btn key={h.id} label={`${h.name} · ${(h.hz / 1000).toFixed(1)}k`} tone={hint?.id === h.id ? 'primary' : 'plain'} onPress={() => { set({ freqHz: h.hz }); setHint(h); touch(ctx); }} a11y={`${h.name}: ${h.note}`} />)}
      </Row>
      {/* NEW COPY: hint notes disclosed one at a time instead of all five in a footnote. */}
      {hint ? (
        <Card tone="math">
          <Eyebrow>{hint.name.toUpperCase()} · {kHz(hint.hz)}</Eyebrow>
          <Body>{hint.note} A starting point is where you begin, not where you finish — now move the detector until it sits on this voice's hiss.</Body>
        </Card>
      ) : (
        <Text style={styles.foot}>Starting points, not answers — every voice is different. The spectrum above tells you where this one hisses.</Text>
      )}
      {/* NEW COPY: check rewritten with length-balanced options; the broadband distractor replaced (not taught yet). */}
      <Check
        question="The gain-reduction meter moves on nearly every word, not just the S’s. Most likely fix?"
        options={['Increase the range so it can work harder on each word', 'Raise the threshold or re-aim the detector frequency', 'Turn the output gain down so the meter moves less', 'Add an EQ boost above the band so the S’s stand out more']}
        correct={1}
        explain="Reduction on non-sibilant words means the detector is hearing the voice, not the hiss: the threshold is too low or the band is in the wrong place. Range only limits how hard it acts once triggered."
        onCorrect={() => touch(ctx)}
      />
    </View>
  );
}

/* ── 6 gain reduction display ─────────────────────────────────────────── */

function PageGr({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const out = processPhrase(PHRASE, s);
  const max = Math.max(...out.map((p) => p.grDb));
  const mean = meanSibilantGr(out);
  return (
    <View style={{ gap: 12 }}>
      {/* NEW COPY: "the only honest meter" → "the one essential display". */}
      <Lead>The gain-reduction meter is the de-esser's one essential display: how much, and when. Read it as a question — am I working on S’s only, and by a sensible amount?</Lead>
      <Prompt>Watch two things: WHERE the bars appear (only under orange labels) and HOW TALL they get (never past the range).</Prompt>
      <ControlSlider label="Range (maximum reduction)" value={s.rangeDb} min={0} max={24} step={1} format={(v) => `${v.toFixed(0)} dB`} onChange={(v) => { set({ rangeDb: v }); touch(ctx); }} />
      <ControlSlider level label="Threshold" value={s.thresholdDb} min={-40} max={0} step={1} format={(v) => `${v.toFixed(0)} dB`} onChange={(v) => { set({ thresholdDb: v }); touch(ctx); }} />
      <DetectorTrace processed={out} thresholdDb={s.thresholdDb} rangeDb={s.rangeDb} a11y={`Gain reduction across the phrase: maximum ${max.toFixed(1)} dB, average on sibilants ${mean.toFixed(1)} dB, range ${s.rangeDb} dB.`} />
      <Card>
        <Text style={styles.read}>peak reduction {max.toFixed(1)} dB · average on S’s {mean.toFixed(1)} dB · stage: {overStage(mean).name}</Text>
        {/* NEW COPY: range is a cap, not a dose — the old line said 10 dB of range was "lisp territory whatever the threshold says". */}
        <Body>Range is the safety rail: however far above threshold an S goes, the gain never drops more than this. Most voices stay natural with the range at 4–6 dB. Open it wide and the threshold alone decides how hard it works — which is how a de-esser ends up lisping.</Body>
        <Body>These meters are conceptual — relative gain, not calibrated level.</Body>
      </Card>
    </View>
  );
}

/* ── 7 broadband vs split-band ────────────────────────────────────────── */

function PageMode({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto || ctx.reduceMotion) return;
    const id = setInterval(() => setStep((i) => (i + 1) % PHRASE.length), 700);
    return () => clearInterval(id);
  }, [auto, ctx.reduceMotion]);
  const f = PHRASE[step];
  const out = processPhrase(PHRASE, s);
  const p = out[step];
  const inSp = sFrameSpectrum(f, 48);
  const g = Math.pow(10, -p.grDb / 20);
  const outMag = new Float64Array(inSp.mag.length);
  for (let i = 0; i < outMag.length; i++) {
    const w = s.mode === 'broadband' ? 1 : bandpassGain(inSp.hz[i], s.freqHz, s.q);
    outMag[i] = inSp.mag[i] * (1 - w * (1 - g));
  }
  const go = (i: number) => { setStep((i + PHRASE.length) % PHRASE.length); setAuto(false); touch(ctx); };
  const gr = p.grDb.toFixed(1);
  return (
    <View style={{ gap: 12 }}>
      <Lead>When the detector fires, what gets turned down? Everything (broadband) or only the hiss band (split-band). Same decision, different action.</Lead>
      <Prompt>Step to an S and compare the cyan body bar in each mode — that is the whole difference.</Prompt>
      <Row>
        <Btn label="BROADBAND" tone={s.mode === 'broadband' ? 'primary' : 'plain'} onPress={() => { set({ mode: 'broadband' }); touch(ctx); }} />
        <Btn label="SPLIT-BAND" tone={s.mode === 'split' ? 'primary' : 'plain'} onPress={() => { set({ mode: 'split' }); touch(ctx); }} />
      </Row>
      <FrameStrip frames={PHRASE} output={out} selected={step} onSelect={go} title={`OUTPUT · ${s.mode.toUpperCase()} (input as ghost)`} a11y={s.mode === 'broadband' ? 'Broadband: on each sibilant frame both the body and the hiss drop.' : 'Split-band: on each sibilant frame only the hiss drops; the body is unchanged.'} />
      <Row>
        <Wide><Btn label="‹" onPress={() => go(step - 1)} a11y="Previous frame" /></Wide>
        <Wide><Btn label="›" onPress={() => go(step + 1)} a11y="Next frame" /></Wide>
        {/* NEW COPY: "PLAY" → "AUTO-STEP" (nothing plays in this lab). */}
        {!ctx.reduceMotion ? <Btn label={auto ? 'STOP' : 'AUTO-STEP'} onPress={() => { setAuto((a) => !a); touch(ctx); }} a11y={auto ? 'Stop stepping through the frames' : 'Step through the frames automatically'} /> : null}
        <Btn label="JUMP TO AN S" onPress={() => go(nextSib(step))} a11y="Jump to the next sibilant frame" />
        <Text style={styles.read}>frame {step + 1} · “{f.label}” · {p.grDb > 0 ? `−${gr} dB reduction` : 'no reduction'}</Text>
      </Row>
      <BandSpectrum hz={inSp.hz} mag={outMag} ghost={inSp.mag} curve={s.mode === 'split' ? detectorCurve(s, 48).mag : undefined} band={[2000, 10000]} title="THIS FRAME · BEFORE (GHOST) AND AFTER" caption={s.mode === 'split' ? 'Grey: before · colour: after · gold dashed: the band being turned down.' : 'Grey: before · colour: after — the whole spectrum moves together.'} a11y={p.grDb > 0 ? (s.mode === 'broadband' ? `Broadband: the whole spectrum of ${f.label} drops by ${gr} dB.` : `Split-band: only the band around ${s.freqHz} hertz of ${f.label} drops by ${gr} dB.`) : `No reduction on ${f.label}.`} />
      <Card>
        <Eyebrow>{s.mode === 'broadband' ? 'BROADBAND' : 'SPLIT-BAND'} · THIS FRAME</Eyebrow>
        {/* NEW COPY: side-by-side worked example for the current frame, so both modes are compared without toggling from memory. */}
        <Text style={styles.read}>{p.grDb > 0
          ? `broadband → body −${gr} dB, hiss −${gr} dB · split-band → body 0 dB, hiss −${gr} dB`
          : 'no reduction on this frame — both modes pass it untouched'}</Text>
        <Body>{s.mode === 'broadband'
          ? 'Simple and natural-sounding in small doses: the whole S gets quieter, like the talker backed off for a moment. Push it and the whole voice ducks on every S — you hear it breathe.'
          : 'Surgical: only the hiss band is attenuated, so the body of the S and the voice around it stay put. Push it and the S’s turn into TH’s while everything else stays bright.'}</Body>
      </Card>
      {/* NEW COPY: check rewritten with four parallel, same-shape options. */}
      <Check
        question="Split-band versus broadband — which statement is true?"
        options={['Broadband turns down only the hiss band; split-band takes the whole voice down', 'Split-band turns down only the hiss band; broadband takes the whole voice down', 'Both turn down only the hiss band; they differ in how fast they react', 'Both take the whole voice down; they differ in where the detector listens']}
        correct={1}
        explain="Same decision, different action: broadband ducks the whole voice for the moment, split-band attenuates only the band it was listening to."
        onCorrect={() => touch(ctx)}
      />
    </View>
  );
}

/* ── 8 over-de-essing ─────────────────────────────────────────────────── */

function PageOver({ ctx }: { ctx: PageCtx }) {
  const [amount, setAmount] = useState(0);
  const [rackS, set] = useRack();
  const s = overSettings(amount, rackS.mode);
  const out = processPhrase(PHRASE, s);
  const mean = meanSibilantGr(out);
  const stage = overStage(mean);
  return (
    <View style={{ gap: 12 }}>
      {/* NEW COPY: lead names what the stages are. */}
      <Lead>More is not better. Push the amount up and watch the S’s go from tamed to missing — the stages are the symptoms you would hear.</Lead>
      <Prompt>Find the last stage before the S’s start disappearing — then back off a little.</Prompt>
      <ControlSlider label="How hard" value={amount} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}% · threshold ${-Math.round(v * OVER_THRESHOLD_SPAN_DB)} dB`} onChange={(v) => { setAmount(v); touch(ctx); }} />
      <FrameStrip frames={PHRASE} output={out} title={`OUTPUT · ${stage.name.toUpperCase()} (input as ghost)`} a11y={`At this setting the sibilants are reduced by about ${mean.toFixed(0)} dB: ${stage.name}. ${stage.symptoms}`} />
      <Card tone={stage.id === 'transparent' || stage.id === 'controlled' ? 'ok' : stage.id === 'off' ? 'plain' : 'warn'}>
        <Eyebrow>{stage.name.toUpperCase()} · ABOUT {mean.toFixed(0)} dB ON THE S’S</Eyebrow>
        <Body>{stage.symptoms}</Body>
      </Card>
      <Eyebrow>THE PROGRESSION</Eyebrow>
      <Card>
        {OVER_STAGES.map((o) => (
          <Text key={o.id} style={[styles.stage, o.id === stage.id && { color: colors.textPrimary, fontFamily: fonts.barlowMedium }]} accessibilityLabel={`${o.name}${o.maxGrDb === Infinity ? '' : `, up to ${o.maxGrDb} dB`}${o.id === stage.id ? ', current' : ''}`}>
            {o.id === stage.id ? '▶ ' : '   '}{o.name}{o.maxGrDb === Infinity ? '' : ` · up to ${o.maxGrDb} dB`}
          </Text>
        ))}
      </Card>
      <Body>Rule of thumb: set it so you can only just hear it working on the worst S, then back off a little. If the gain-reduction meter is dancing on every word, the threshold is too low or the frequency is wrong — not the range.</Body>
      {/* NEW COPY: misconception check — a lisp is over-reduction, not a missed S. */}
      <Check
        question="After de-essing, the singer sounds as if they have a lisp. What happened?"
        options={['The range is too small, so the S’s were never caught', 'Too much reduction — the S’s are being removed, not tamed', 'The detector band is too wide and heard the vowels', 'The microphone was too far away for the detector']}
        correct={1}
        explain="A lisp is the sound of S’s with their hiss taken away. Back off: raise the threshold or lower the range until the S’s are softened, not deleted."
        onCorrect={() => touch(ctx)}
      />
      <Row><Btn label="RESET RACK TO DEFAULTS" onPress={() => { set({ ...DEFAULTS }); setAmount(0); }} a11y="Reset every de-esser setting to its default" /></Row>
    </View>
  );
}

/* ── 9 connections + capstone check ───────────────────────────────────── */

function PageConnections({ ctx }: { ctx: PageCtx }) {
  return (
    <View style={{ gap: 12 }}>
      {/* NEW COPY */}
      <Lead>The de-esser borrows every one of its parts from labs you already have. Each link says what to do there.</Lead>
      <Card>
        {CONNECTIONS.map((c) => (
          <View key={c.name} style={styles.linkRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkName}>{c.name}</Text>
              <Text style={styles.linkWhy}>{c.why}</Text>
            </View>
            <Btn label="OPEN ›" onPress={() => navigationRef.navigate(c.route as never)} a11y={`Open ${c.name}`} />
          </View>
        ))}
      </Card>
      {/* NEW COPY: capstone retrieval — the one-sentence definition the whole lab builds. */}
      <Check
        question="Which description of a de-esser is right?"
        options={['An EQ that cuts around 6 kHz whenever the voice gets loud', 'A compressor whose detector listens through a band-pass filter', 'A gate that opens only while an S sound is present', 'A limiter set to the level of the loudest S in the take']}
        correct={1}
        explain="It is a compressor's detector, threshold and gain computer with one addition: the detector listens to a filtered copy of the voice, so only hiss can trigger it."
        onCorrect={() => ctx.markDone()}
      />
    </View>
  );
}

const PAGES: PageDef[] = [
  { title: 'What Sibilance Is', short: 'Sibilance', Component: PageWhat },
  { title: 'Why EQ Is Not Enough', short: 'EQ vs de-esser', Component: PageEqVs },
  { title: 'The Detection Path', short: 'Path', Component: PagePath },
  { title: 'Threshold', short: 'Threshold', Component: PageThreshold },
  { title: 'Choosing the Frequency', short: 'Frequency', Component: PageFrequency },
  { title: 'Reading Gain Reduction', short: 'GR', Component: PageGr },
  { title: 'Broadband vs Split-Band', short: 'Mode', Component: PageMode },
  { title: 'Over-De-Essing', short: 'Too much', Component: PageOver },
  { title: 'Connections & Check', short: 'Check', Component: PageConnections },
];

export function DeEsserLabScreen() {
  // A fresh rack every time the lab is opened: settings persist across pages,
  // not across visits (the initializer runs before any page mounts).
  useState(() => { rack = { ...DEFAULTS }; return true; });
  return <PagedLab labId="deesser" title="De-Esser & Sibilance Control" subtitle="A compressor that listens only to the hiss — Smart Processors, V1." pages={PAGES} />;
}

const styles = StyleSheet.create({
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13, flexShrink: 1 },
  foot: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  stage: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  linkName: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5 },
  linkWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
