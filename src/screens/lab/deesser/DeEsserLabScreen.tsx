/**
 * De-Esser & Sibilance Control Lab (owner brief 2026-09-02) — V1 of the
 * Smart Processors family. Eight teaching screens + connections/checks on
 * the PagedLab shell. Visual only; every display is computed by
 * deEsserModel from a modelled phrase, labelled conceptual.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import {
  CONNECTIONS, DEFAULTS, FREQ_HINTS, FREQ_MAX, FREQ_MIN, OVER_STAGES, PATH_MAIN, PATH_SIDECHAIN, PHRASE, bandpassGain, detectorCurve, eqCut,
  meanSibilantGr, overStage, processPhrase, sFrameSpectrum, vowelBrightnessLossDb, type Frame, type Settings,
} from '../../../features/deesser/deEsserModel';
import { navigationRef } from '../../../navigation/navigationRef';
import { PagedLab, type PageCtx, type PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { ControlSlider } from '../amp/kit';
import { BandSpectrum, DetectorTrace, FrameStrip, PathDiagram } from './deEsserViz';

/** One rack: settings persist across pages while the lab is open. */
let rack: Settings = { ...DEFAULTS };
function useRack(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(() => rack);
  const set = (patch: Partial<Settings>) => setS((prev) => { rack = { ...prev, ...patch }; return rack; });
  return [s, set];
}

const touch = (ctx: PageCtx) => { if (!ctx.isDone) ctx.markDone(); };

/* ── 1 what is sibilance ───────────────────────────────────────────────── */

function PageWhat({ ctx }: { ctx: PageCtx }) {
  const [sel, setSel] = useState<number>(11);
  const f = PHRASE[sel];
  const sp = sFrameSpectrum(f, 48);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Sibilance is the hiss of S, Z, SH and CH — air turbulence at the teeth, sitting between roughly 4 and 10 kHz, where the ear is most sensitive and where bright microphones add the most.</Lead>
      <FrameStrip frames={PHRASE} title="A SPOKEN PHRASE · FRAME BY FRAME" a11y={`The phrase ${PHRASE.map((p) => p.label).join(' ')} as frames; the sibilant frames carry the hiss.`} />
      <Row>
        {PHRASE.map((p, i) => (p.label !== '·' ? <Btn key={i} label={p.label} tone={sel === i ? 'primary' : 'plain'} onPress={() => { setSel(i); touch(ctx); }} /> : null))}
      </Row>
      <BandSpectrum hz={sp.hz} mag={sp.mag} band={[2000, 10000]} title={`FRAME "${f.label.toUpperCase()}" · SPECTRUM`} a11y={f.sibilant ? `Spectrum of ${f.label}: energy concentrated around ${f.hissHz} hertz.` : `Spectrum of ${f.label}: energy mostly below 1 kilohertz.`} />
      <Card>
        <Body>{f.sibilant ? `A sibilant frame: almost all of its energy is hiss near ${(f.hissHz / 1000).toFixed(1)} kHz, and very little body.` : 'A voiced frame: energy in the low and mid range — the body of the voice — with only a trace of hiss.'} The de-esser's whole job is to tell these two apart and act on one of them only.</Body>
        <Body>Why it becomes a problem: close placement, bright condensers, presence EQ, and heavy compression (which raises quiet sounds and the hiss with them) all push the S's out of proportion.</Body>
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
  const lossEq = vowelBrightnessLossDb(PHRASE, eq), lossDe = vowelBrightnessLossDb(PHRASE, de);
  return (
    <View style={{ gap: 12 }}>
      <Lead>An EQ cut is always on. A de-esser is on only while there is an S. That one difference is the whole reason it exists.</Lead>
      <Row>
        <Btn label={`STATIC EQ · −${cut} dB AT 6.5 kHz`} tone={which === 'eq' ? 'primary' : 'plain'} onPress={() => { setWhich('eq'); touch(ctx); }} />
        <Btn label="DE-ESSER" tone={which === 'de' ? 'primary' : 'plain'} onPress={() => { setWhich('de'); touch(ctx); }} />
      </Row>
      <FrameStrip frames={PHRASE} output={out} title={which === 'eq' ? 'OUTPUT · STATIC EQ (input as ghost)' : 'OUTPUT · DE-ESSER (input as ghost)'} a11y={which === 'eq' ? 'With a static EQ cut every frame loses the same amount of hiss — vowels included.' : 'With the de-esser only the sibilant frames are reduced; the vowels are untouched.'} />
      <Card tone={which === 'eq' ? 'warn' : 'ok'}>
        <Eyebrow>{which === 'eq' ? 'WHAT THE EQ DID' : 'WHAT THE DE-ESSER DID'}</Eyebrow>
        <Text style={styles.read}>brightness taken from the vowels: {(which === 'eq' ? lossEq : lossDe).toFixed(1)} dB · S's reduced by about {(which === 'eq' ? cut : meanSibilantGr(de)).toFixed(1)} dB</Text>
        <Body>{which === 'eq'
          ? 'The S’s are tamed — and so is every vowel, every breath and the air of the whole recording. Dull the voice enough to fix the S and you have a dull voice.'
          : 'The S’s are tamed and the vowels keep every bit of their brightness, because the gain only moves while the detector hears hiss.'}</Body>
      </Card>
    </View>
  );
}

/* ── 3 detection path ──────────────────────────────────────────────────── */

function PagePath({ ctx }: { ctx: PageCtx }) {
  const [rackS] = useRack();
  const order = ['in', 'bpf', 'det', 'thr', 'gc', 'gain', 'out'];
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto || ctx.reduceMotion) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % order.length), 1600);
    return () => clearInterval(id);
  }, [auto, ctx.reduceMotion, order.length]);
  const active = order[idx];
  const block = [...PATH_MAIN, ...PATH_SIDECHAIN].find((b) => b.id === active)!;
  return (
    <View style={{ gap: 12 }}>
      <Lead>A de-esser is a compressor with a filtered ear. The voice goes straight through a gain element; a filtered copy decides how much that gain element turns down.</Lead>
      <PathDiagram active={active} mode={rackS.mode} onSelect={(id) => { setIdx(order.indexOf(id)); setAuto(false); touch(ctx); }} />
      <Card tone="math">
        <Eyebrow>{idx + 1} · {block.name.toUpperCase()}</Eyebrow>
        <Body>{block.what}</Body>
      </Card>
      <Row>
        <Btn label="NEXT BLOCK ›" tone="primary" onPress={() => { setIdx((i) => (i + 1) % order.length); setAuto(false); touch(ctx); }} />
        {!ctx.reduceMotion ? <Btn label={auto ? 'STOP' : 'WALK THE SIGNAL'} onPress={() => { setAuto((a) => !a); touch(ctx); }} /> : null}
      </Row>
      <Body>The band-pass filter is the smart part: it is NOT in the signal path. It only shapes what the detector hears, so the decision is made on the hiss alone while the whole voice passes through untouched until the gain moves.</Body>
    </View>
  );
}

/* ── 4 threshold ───────────────────────────────────────────────────────── */

function PageThreshold({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const out = processPhrase(PHRASE, s);
  const over = out.filter((p) => p.grDb > 0).length;
  const overVowels = out.filter((p) => p.grDb > 0 && !p.frame.sibilant).length;
  return (
    <View style={{ gap: 12 }}>
      <Lead>The threshold is the level the hiss must reach before anything happens. Above it, the de-esser turns down; below it, it is not even there.</Lead>
      <ControlSlider label="Threshold" value={s.thresholdDb} min={-40} max={0} step={1} format={(v) => `${v.toFixed(0)} dB`} onChange={(v) => { set({ thresholdDb: v }); touch(ctx); }} />
      <DetectorTrace processed={out} thresholdDb={s.thresholdDb} rangeDb={s.rangeDb} a11y={`Detector trace across the phrase with the threshold at ${s.thresholdDb} dB; ${over} frames are above it and are being reduced.`} />
      <Card tone={overVowels > 0 ? 'warn' : over === 0 ? 'plain' : 'ok'}>
        <Text style={styles.read}>{over} of {PHRASE.length} frames above threshold · {overVowels} of them are not sibilants</Text>
        <Body>{over === 0
          ? 'Too high: no S ever reaches the threshold, so the de-esser does nothing.'
          : overVowels > 0
            ? 'Too low: vowels and breaths are now crossing the threshold too, so the voice ducks on sounds that were never the problem. Raise it until only the S’s are above the line.'
            : 'About right: only the sibilant frames cross the line. The gain moves on S’s and nowhere else.'}</Body>
      </Card>
    </View>
  );
}

/* ── 5 frequency selection ────────────────────────────────────────────── */

function PageFrequency({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const sib = PHRASE.map((f, i) => ({ f, i })).filter((x) => x.f.sibilant);
  const [pick, setPick] = useState<number>(sib[3].i);
  const f: Frame = PHRASE[pick];
  const sp = sFrameSpectrum(f, 48);
  const dc = detectorCurve(s, 48);
  const heard = f.hiss * bandpassGain(f.hissHz, s.freqHz, s.q);
  const logMin = Math.log(FREQ_MIN), logMax = Math.log(FREQ_MAX);
  return (
    <View style={{ gap: 12 }}>
      <Lead>Every voice hisses in its own place. Aim the detector at that place — too low and it hears the voice, too high and it misses the S.</Lead>
      <ControlSlider label="Detector frequency" value={Math.log(s.freqHz)} min={logMin} max={logMax} step={0.01} format={(v) => `${(Math.exp(v) / 1000).toFixed(1)} kHz`} onChange={(v) => { set({ freqHz: Math.round(Math.exp(v) / 50) * 50 }); touch(ctx); }} />
      <ControlSlider label="Band width" value={s.q} min={0.7} max={4} step={0.1} format={(v) => (v < 1.2 ? 'wide' : v < 2.5 ? 'medium' : 'narrow')} onChange={(v) => { set({ q: v }); touch(ctx); }} />
      <Row>
        {sib.map((x) => <Btn key={x.i} label={`"${x.f.label}" · ${(x.f.hissHz / 1000).toFixed(1)}k`} tone={pick === x.i ? 'primary' : 'plain'} onPress={() => { setPick(x.i); touch(ctx); }} />)}
      </Row>
      <BandSpectrum hz={sp.hz} mag={sp.mag} curve={dc.mag} band={[2000, 10000]} title={`"${f.label.toUpperCase()}" SPECTRUM · DETECTOR AT ${(s.freqHz / 1000).toFixed(1)} kHz`} a11y={`Spectrum of ${f.label} with hiss near ${f.hissHz} hertz; the detector band is centred at ${s.freqHz} hertz and hears ${Math.round(heard * 100)} percent of it.`} />
      <Card tone={heard > 0.7 ? 'ok' : heard > 0.4 ? 'plain' : 'warn'}>
        <Text style={styles.read}>the detector hears {Math.round(heard * 100)}% of this "{f.label}"</Text>
        <Body>{heard > 0.7 ? 'On target: the band sits on the hiss, so a modest threshold catches it cleanly.' : heard > 0.4 ? 'Partly: it will catch loud S’s and miss quiet ones. Move the frequency toward the hiss or widen the band.' : 'Missing it: the S passes through untouched — the detector is listening somewhere else.'}</Body>
      </Card>
      <Eyebrow>STARTING POINTS</Eyebrow>
      <Row>
        {FREQ_HINTS.map((h) => <Btn key={h.id} label={`${h.name} · ${(h.hz / 1000).toFixed(1)}k`} onPress={() => { set({ freqHz: h.hz }); touch(ctx); }} a11y={`${h.name}: ${h.note}`} />)}
      </Row>
      <Text style={styles.foot}>{FREQ_HINTS.map((h) => `${h.name}: ${h.note}`).join('  ')}</Text>
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
      <Lead>The gain-reduction display is the only honest meter on a de-esser: it shows how much, and when. Read it as "am I working on S’s only, and by a sensible amount?"</Lead>
      <ControlSlider label="Range (maximum reduction)" value={s.rangeDb} min={0} max={24} step={1} format={(v) => `${v.toFixed(0)} dB`} onChange={(v) => { set({ rangeDb: v }); touch(ctx); }} />
      <ControlSlider label="Threshold" value={s.thresholdDb} min={-40} max={0} step={1} format={(v) => `${v.toFixed(0)} dB`} onChange={(v) => { set({ thresholdDb: v }); touch(ctx); }} />
      <DetectorTrace processed={out} thresholdDb={s.thresholdDb} rangeDb={s.rangeDb} a11y={`Gain reduction across the phrase: maximum ${max.toFixed(1)} dB, average on sibilants ${mean.toFixed(1)} dB.`} />
      <Card>
        <Text style={styles.read}>peak reduction {max.toFixed(1)} dB · average on S’s {mean.toFixed(1)} dB · stage: {overStage(mean).name}</Text>
        <Body>Range is the safety rail: however far above threshold an S goes, the gain never drops more than this. A range of 4–6 dB is transparent on most voices; beyond 10 dB you are in lisp territory whatever the threshold says.</Body>
        <Body>These meters are conceptual — relative gain, not calibrated level.</Body>
      </Card>
    </View>
  );
}

/* ── 7 broadband vs split-band ────────────────────────────────────────── */

function PageMode({ ctx }: { ctx: PageCtx }) {
  const [s, set] = useRack();
  const sib = PHRASE.map((f, i) => ({ f, i })).filter((x) => x.f.sibilant);
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
  return (
    <View style={{ gap: 12 }}>
      <Lead>When the detector fires, what gets turned down? Everything (broadband) or only the hiss band (split-band). Same decision, different action.</Lead>
      <Row>
        <Btn label="BROADBAND" tone={s.mode === 'broadband' ? 'primary' : 'plain'} onPress={() => { set({ mode: 'broadband' }); touch(ctx); }} />
        <Btn label="SPLIT-BAND" tone={s.mode === 'split' ? 'primary' : 'plain'} onPress={() => { set({ mode: 'split' }); touch(ctx); }} />
      </Row>
      <FrameStrip frames={PHRASE} output={out} title={`OUTPUT · ${s.mode.toUpperCase()}`} a11y={s.mode === 'broadband' ? 'Broadband: on each sibilant frame both the body and the hiss drop.' : 'Split-band: on each sibilant frame only the hiss drops; the body is unchanged.'} />
      <Row>
        <Btn label="‹" onPress={() => { setStep((i) => (i + PHRASE.length - 1) % PHRASE.length); setAuto(false); }} a11y="Previous frame" />
        <Btn label={`FRAME ${step + 1} · "${f.label}" ${p.grDb > 0 ? `· −${p.grDb.toFixed(1)} dB` : '· no reduction'}`} tone="primary" onPress={() => { setStep((i) => (i + 1) % PHRASE.length); setAuto(false); touch(ctx); }} a11y="Next frame" />
        {!ctx.reduceMotion ? <Btn label={auto ? 'STOP' : 'PLAY'} onPress={() => { setAuto((a) => !a); touch(ctx); }} /> : null}
        <Btn label="JUMP TO AN S" onPress={() => { const next = sib.find((x) => x.i > step) ?? sib[0]; setStep(next.i); setAuto(false); touch(ctx); }} />
      </Row>
      <BandSpectrum hz={inSp.hz} mag={outMag} ghost={inSp.mag} curve={s.mode === 'split' ? detectorCurve(s, 48).mag : undefined} title={`THIS FRAME · BEFORE (GHOST) AND AFTER`} a11y={p.grDb > 0 ? (s.mode === 'broadband' ? `Broadband: the whole spectrum of ${f.label} drops by ${p.grDb.toFixed(1)} dB.` : `Split-band: only the band around ${s.freqHz} hertz of ${f.label} drops by ${p.grDb.toFixed(1)} dB.`) : `No reduction on ${f.label}.`} />
      <Card>
        <Eyebrow>{s.mode === 'broadband' ? 'BROADBAND' : 'SPLIT-BAND'}</Eyebrow>
        <Body>{s.mode === 'broadband'
          ? 'Simple and natural-sounding in small doses: the whole S gets quieter, like the talker backed off for a moment. Push it and the whole voice ducks on every S — you hear it breathe.'
          : 'Surgical: only the hiss band is attenuated, so the body of the S and the voice around it stay put. Push it and the S’s turn into TH’s while everything else stays bright.'}</Body>
      </Card>
    </View>
  );
}

/* ── 8 over-de-essing ─────────────────────────────────────────────────── */

function PageOver({ ctx }: { ctx: PageCtx }) {
  const [amount, setAmount] = useState(0.3);
  const [, set] = useRack();
  const s: Settings = { ...DEFAULTS, thresholdDb: -amount * 40, rangeDb: 24, mode: rack.mode };
  const out = processPhrase(PHRASE, s);
  const mean = meanSibilantGr(out);
  const stage = overStage(mean);
  return (
    <View style={{ gap: 12 }}>
      <Lead>More is not better. Drag the amount up and watch the S’s go from tamed to missing.</Lead>
      <ControlSlider label="How hard" value={amount} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => { setAmount(v); touch(ctx); }} />
      <FrameStrip frames={PHRASE} output={out} title={`OUTPUT · ${stage.name.toUpperCase()}`} a11y={`At this setting the sibilants are reduced by about ${mean.toFixed(0)} dB: ${stage.name}. ${stage.symptoms}`} />
      <Card tone={stage.id === 'transparent' || stage.id === 'controlled' ? 'ok' : stage.id === 'off' ? 'plain' : 'warn'}>
        <Eyebrow>{stage.name.toUpperCase()} · ABOUT {mean.toFixed(0)} dB ON THE S’S</Eyebrow>
        <Body>{stage.symptoms}</Body>
      </Card>
      <Eyebrow>THE PROGRESSION</Eyebrow>
      <Card>
        {OVER_STAGES.map((o) => (
          <Text key={o.id} style={[styles.stage, o.id === stage.id && { color: colors.textPrimary, fontFamily: fonts.barlowMedium }]}>
            {o.id === stage.id ? '▶ ' : '   '}{o.name}{o.maxGrDb === Infinity ? '' : ` · up to ${o.maxGrDb} dB`}
          </Text>
        ))}
      </Card>
      <Body>Rule of thumb: set it so you can only just hear it working on the worst S, then back off a little. If the gain-reduction meter is dancing on every word, the threshold is too low or the frequency is wrong — not the range.</Body>
      <Row><Btn label="RESET THE RACK TO DEFAULTS" onPress={() => { set({ ...DEFAULTS }); setAmount(0.3); }} /></Row>
    </View>
  );
}

/* ── 9 connections + checks ───────────────────────────────────────────── */

function PageConnections({ ctx }: { ctx: PageCtx }) {
  const [, setN] = useState(0);
  const bump = () => setN((c) => { if (c + 1 >= 3) ctx.markDone(); return c + 1; });
  return (
    <View style={{ gap: 12 }}>
      <Lead>The de-esser borrows every one of its parts from labs you already have.</Lead>
      <Card>
        {CONNECTIONS.map((c) => (
          <View key={c.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkName}>{c.name}</Text>
              <Text style={styles.linkWhy}>{c.why}</Text>
            </View>
            <Btn label="OPEN ›" onPress={() => navigationRef.navigate(c.route as never)} a11y={`Open ${c.name}`} />
          </View>
        ))}
      </Card>
      <UnderstandingCheck question="Where does a de-esser's band-pass filter sit?" options={['In the signal path, cutting the highs', 'In the side chain, shaping only what the detector hears', 'After the output', 'Nowhere — it uses a shelf']} correct={1} explain="The filter is in the side chain: it decides, it does not process. The voice passes through the gain element untouched until the gain moves." onCorrect={bump} />
      <UnderstandingCheck question="Why is a static EQ cut a poor de-esser?" options={['It cannot cut enough', 'It works on every sound all the time, dulling the vowels too', 'EQ cannot reach 6 kHz', 'It adds noise']} correct={1} explain="The cut is always on, so the whole recording loses brightness. A de-esser acts only while there is hiss." onCorrect={bump} />
      <UnderstandingCheck question="Split-band versus broadband: which statement is true?" options={['Broadband turns down only the hiss', 'Split-band turns down the whole voice', 'Split-band turns down only the hiss band; broadband turns the whole signal down', 'They are the same']} correct={2} explain="Same decision, different action: broadband ducks everything for the moment, split-band attenuates only the band it was listening to." onCorrect={bump} />
      <UnderstandingCheck question="The gain-reduction meter moves on nearly every word. Most likely fix?" options={['Increase the range', 'Raise the threshold or re-aim the frequency', 'Switch to broadband', 'Add an EQ boost']} correct={1} explain="Reduction on non-sibilant words means the detector is hearing the voice, not the hiss: the threshold is too low or the band is in the wrong place. Range only limits how hard it acts." onCorrect={bump} />
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
  { title: 'Connections & Checks', short: 'Check', Component: PageConnections },
];

export function DeEsserLabScreen() {
  return <PagedLab labId="deesser" title="De-Esser & Sibilance Control" subtitle="A compressor that listens only to the hiss — Smart Processors, V1." pages={PAGES} />;
}

const styles = StyleSheet.create({
  read: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  foot: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
  stage: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 20 },
  linkName: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  linkWhy: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12 },
});
