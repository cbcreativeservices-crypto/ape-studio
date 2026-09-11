/**
 * Advanced Mixing — pages 11–14 (owner brief 2026-09-11; sections: Harmonic
 * Processing · Stereo Imaging · Advanced Automation · Mix-Bus Processing).
 * ALL COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, useMixPlayback, useVisitGoals, type MixVariant } from './kit';
import type { MixSettings } from './audio/mixAudio.ts';

/* ════ 11 · HARMONIC PROCESSING ═══════════════════════════════════════════ */

function PageHarmonic({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'clean', label: 'CLEAN', settings: {} },
      { id: 'warm', label: 'GENTLE DRIVE', settings: {}, busDriveDb: 6, matchTo: 'clean' },
      { id: 'hot', label: 'HARD DRIVE', settings: {}, busDriveDb: 14, matchTo: 'clean' },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const satItems = [
    { id: 'what', name: 'What saturation adds', blurb: 'Harmonics related to the signal — density and “weight” that EQ cannot fabricate, plus soft peak rounding.' },
    { id: 'flavors', name: 'Tape, console, tube', blurb: 'Different curves, same idea: nonlinearity as colour. DAW-neutral truth: judge with ears, level-matched — not by the label.' },
    { id: 'clip', name: 'Clipping as a tool', blurb: 'A hard or soft ceiling shaving peaks. On drums, sometimes exactly right; on everything, usually regret.' },
    { id: 'evaluate', name: 'Level-matched evaluation', blurb: 'Saturation flatters loudness meters. If it is not clearly better at MATCHED loudness, it is just distortion.' },
  ] as const;
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const heardAll = ['clean', 'warm', 'hot'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Hear clean, gentle, hard drive', hit: heardAll },
    { label: 'Open all four cards', hit: seen.size >= satItems.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Harmonic processing adds content that was never played: overtones born from nonlinearity. Used gently it reads as weight and glue; used blindly it is just distortion with confidence.</Lead>
      <Card>
        <Eyebrow>THE DRIVE, HEARD</Eyebrow>
        <Prompt>The full session through a soft saturator, level-matched: clean · gentle drive · hard drive. Listen for density first, then for what the hard version COSTS (the transients dull, the top fizzes).</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Level-matched on purpose — saturation’s loudness flattery is removed, so what remains is the actual colour trade." />
      </Card>
      <Card>
        <Eyebrow>THE TOOLKIT</Eyebrow>
        <ConceptList items={satItems.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="A saturation plugin makes the mix “bigger and more exciting” the instant it is enabled. The advanced reflex:"
        options={['Ship it — bigger and exciting is the goal', 'Match the levels first; most of that instant excitement is added loudness', 'Add a second instance for twice the size', 'Automate it louder in the chorus']}
        correct={1}
        explain="Nonlinear stages add level and density together — the meter goes up WITH the harmonics. Match loudness, then re-judge: keep it only if the colour itself, not the volume, earns its place."
        wrong={[
          'The goal is a better mix at EQUAL loudness — anything sounds bigger louder.',
          undefined,
          'Twice the nonlinearity is rarely twice the good — and the loudness lie doubles too.',
          'Automating an unjudged effect just moves the question to the chorus.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 12 · STEREO IMAGING ════════════════════════════════════════════════ */

const WIDE_MIX: MixSettings = { gtr: { pan: -55 }, keys: { pan: 55 }, perc: { pan: 30 }, bgv: { pan: -35 } };

function PageImaging({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'mixed', label: 'AS MIXED', settings: WIDE_MIX },
      { id: 'wide', label: 'WIDENED 1.6×', settings: WIDE_MIX, masterWidth: 1.6, matchTo: 'mixed' },
      { id: 'widemono', label: 'WIDENED → MONO', settings: WIDE_MIX, masterWidth: 1.6, mono: true, matchTo: 'mixed' },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const heardAll = ['mixed', 'wide', 'widemono'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Hear mixed, widened, and the mono price', hit: heardAll },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Mid/side thinking splits any stereo signal into CENTRE (mid) and DIFFERENCE (side). Width tools scale the side — powerful, seductive, and paid for in mono, where the side channel simply dies.</Lead>
      <Card>
        <Eyebrow>WIDTH AND ITS INVOICE, HEARD</Eyebrow>
        <Prompt>AS MIXED · the same mix WIDENED 1.6× (side channel scaled up) · and the widened mix folded to MONO. Level-matched throughout.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Widened sounds impressive on speakers — then the fold arrives and everything that lived in the side channel thins or vanishes. Width added by side-scaling is energy mono cannot keep." />
      </Card>
      <Card tone="note">
        <Eyebrow>THE STABLE-CENTRE RULE</Eyebrow>
        <Body>Width is jewellery; the CENTRE is the skeleton. Kick, bass, lead at a rock-solid centre buy you the right to spend the sides freely. Frequency-aware widening (wide highs, mono lows) is the professional compromise — and every width decision gets the mono fold test before it ships.</Body>
      </Card>
      <UnderstandingCheck
        question="A stereo widener makes the pads huge, but the club’s mono system swallows them. What actually happened?"
        options={['The club system was faulty that night', 'The widener put the pads’ energy in the SIDE channel — exactly the channel a mono fold discards', 'Mono systems cannot reproduce pads at all', 'The pads needed more reverb instead']}
        correct={1}
        explain="Mono = mid only. Whatever a widener pushes into the side channel is energy you have bet on stereo playback. The fold collects that bet."
        wrong={[
          'Every mono system that night behaved identically — that is a clue, not a coincidence.',
          undefined,
          'Mono reproduces plenty — ask WHERE the pads’ energy was living.',
          'Reverb adds space, not mono-compatibility — a wet side channel folds away just as completely.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 13 · ADVANCED AUTOMATION ═══════════════════════════════════════════ */

const AUTO_BASE: MixSettings = {
  kick: { faderDb: -2 },
  snare: { faderDb: -4 },
  perc: { faderDb: -10, pan: 40 },
  bass: { faderDb: -5 },
  gtr: { faderDb: -9, pan: -45 },
  keys: { faderDb: -11, pan: 45 },
  lead: { faderDb: -3 },
  bgv: { faderDb: -14, pan: -30 },
};

function PageAdvAutomation({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'static', label: 'STATIC', settings: AUTO_BASE },
      {
        id: 'section',
        label: 'SECTION-DESIGNED',
        settings: {
          ...AUTO_BASE,
          lead: { ...AUTO_BASE.lead, auto: { verseDb: 0, chorusDb: 3 } },
          bgv: { ...AUTO_BASE.bgv, auto: { verseDb: -60, chorusDb: 10 } },
          perc: { ...AUTO_BASE.perc, auto: { verseDb: -6, chorusDb: 0 } },
          gtr: { ...AUTO_BASE.gtr, auto: { verseDb: 0, chorusDb: 2 } },
          keys: { ...AUTO_BASE.keys, auto: { verseDb: 2, chorusDb: -2 } },
        },
        matchTo: 'static',
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const autoItems = [
    { id: 'rides', name: 'Detailed rides', blurb: 'Word-level vocal rides — half a dB here, one dB there — that keep every syllable spoken TO the listener.' },
    { id: 'group', name: 'Subgroup & VCA automation', blurb: 'Ride whole families at once: the drum bus into the chorus, the music VCA under the vocal.' },
    { id: 'plugin', name: 'Plugin automation', blurb: 'Any parameter can move: a filter opening across a build, a delay send alive for one line.' },
    { id: 'snapshots', name: 'Snapshots & sections', blurb: 'Verse-state and chorus-state as recallable scenes; the transitions become the performance.' },
  ] as const;
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const goals = [
    { label: 'Hear static vs section-designed', hit: pb.heard.includes('static') && pb.heard.includes('section') },
    { label: 'Open all four moves', hit: seen.size >= autoItems.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Beginning automation rode one fader. Advanced automation DESIGNS the song’s sections: five elements moving in opposite directions at once, so the chorus is not merely louder — it is a different place.</Lead>
      <Card>
        <Eyebrow>SECTION DESIGN, HEARD</Eyebrow>
        <Prompt>Level-matched: one static balance vs a designed transition — lead and guitar rise into the chorus while the keys STEP BACK, the pad enters, the percussion opens. Count the simultaneous moves.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="The keys getting QUIETER in the chorus is the advanced move: contrast is built by giving as well as taking." />
      </Card>
      <Card>
        <Eyebrow>THE MOVES</Eyebrow>
        <ConceptList items={autoItems.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="You need the whole rhythm section to swell 2 dB into the final chorus — drums, bass, percussion, twelve tracks. The clean tool:"
        options={['Draw twelve identical fader ramps by hand', 'Automate one VCA (or the subgroup fader) that owns those channels', 'Raise the mix bus by 2 dB at that bar', 'Compress the section harder so it feels bigger']}
        correct={1}
        explain="One ride on the controller that owns the family — clean to write, trivial to revise, impossible to leave one of twelve behind. Bus fader works too when the routing already sums them; the mix bus does not (it lifts EVERYTHING, vocal included)."
        wrong={[
          'Twelve hand-drawn copies means twelve chances to drift on revision three.',
          undefined,
          'The mix bus lifts the vocal and everything else along for the ride — too blunt.',
          'Compression changes density, not the deliberate 2 dB gesture you were asked for.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 14 · MIX-BUS PROCESSING ════════════════════════════════════════════ */

function PageMixBus({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'clean', label: 'NO BUS CHAIN', settings: {} },
      {
        id: 'gentle',
        label: 'CONSERVATIVE CHAIN',
        settings: {},
        // −20 dB threshold ≈ 2.3 dB of linked gain reduction (measured) — the
        // page's own "a dB or two of glue"; −14 was inert (0.09 dB — cognition
        // audit round 2).
        busComp: { thresholdDb: -20, ratio: 2, attackMs: 30, releaseMs: 200 },
        busDriveDb: 4,
        matchTo: 'clean',
      },
      {
        id: 'crushed',
        label: 'OVERCOOKED',
        settings: {},
        busComp: { thresholdDb: -26, ratio: 6, attackMs: 2, releaseMs: 60 },
        busDriveDb: 12,
        matchTo: 'clean',
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const heardAll = ['clean', 'gentle', 'crushed'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Hear clean, conservative, overcooked', hit: heardAll },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>The mix bus touches EVERYTHING — which is exactly why its processing is conservative: a dB or two of linked compression, a whisper of colour, headroom preserved. The boundary with mastering is a real border, not a suggestion.</Lead>
      <Card>
        <Eyebrow>THE BUS CHAIN, THREE WAYS</Eyebrow>
        <Prompt>Level-matched: no chain · a conservative chain (2:1, slow attack, gentle drive — the mix “holds hands”) · an overcooked one (fast, deep, driven — the mix breathes like it ran here).</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Conservative bus processing should be MISSED when bypassed, not noticed when active. If you can hear it working, it is working too hard." />
      </Card>
      <Card tone="note">
        <Eyebrow>THE MASTERING BORDER</Eyebrow>
        <Body>Mix-bus processing serves THIS mix while you can still reach every fader underneath it. Mastering serves the finished stereo file against the outside world — loudness targets, translation, sequencing. The moment your bus chain chases a LUFS number, you have started mastering with a mix engineer’s hands. Stop; leave headroom; finish the mix.</Body>
      </Card>
      <UnderstandingCheck
        question="Your mix-bus limiter now does 6 dB of gain reduction “to hit a streaming number”. What is the honest description of this session?"
        options={['A modern, loudness-ready mix workflow', 'A mix being mastered by accident, with the mix’s own tools', 'Standard bus glue, just slightly firm', 'A safe way to preview the master']}
        correct={1}
        explain="Six dB of bus limiting IS mastering-grade processing — decided before the mix is even finished, glued permanently over every later fader move. Mix into gentle glue, deliver headroom, and let the mastering stage (even if it is you tomorrow) work on the finished thing."
        wrong={[
          '“Modern” is doing heavy lifting there — it is early, deep, irreversible processing.',
          undefined,
          'Listen to what six dB of gain reduction does to every transient — does that sound like “slightly firm”?',
          'A preview limiter is fine — BYPASSED for every real decision. This one is baked in.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

export const MIXING_ADV_PAGES_C: PageDef[] = [
  { title: 'Harmonic Processing', short: 'DRIVE', Component: PageHarmonic, manualDone: true },
  { title: 'Stereo Imaging', short: 'WIDTH', Component: PageImaging, manualDone: true },
  { title: 'Advanced Automation', short: 'MOTION', Component: PageAdvAutomation, manualDone: true },
  { title: 'Mix-Bus Processing', short: 'BUS', Component: PageMixBus, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
});
