/**
 * Beginning Mixing — pages 8–11 (owner brief 2026-09-11; sections: Basic EQ in
 * Context · Basic Compression · Reverb & Delay · Auxes & Subgroups).
 * ALL COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, OpenLabLink, useMixPlayback, useVisitGoals, type MixVariant } from './kit';
import { PATH_TRUTHS, sendPathGain, vcaSilences, type Console as MixConsole } from './engine/routing.ts';
import type { MixSettings } from './audio/mixAudio.ts';

/* ════ 8 · BASIC EQ IN CONTEXT (the masking solver) ═══════════════════════ */

/** The clash: guitar comp stabs sit right on the lead's range, both centred,
 *  guitar hot. Every solution below is a REAL settings change — the learner
 *  hears the fix, not a story about the fix. */
const CLASH: MixSettings = { gtr: { faderDb: 4 } };

const EQ_SOLUTIONS: { id: string; name: string; delta: MixSettings; note: string }[] = [
  { id: 'level', name: 'LEVEL — lower the guitar', delta: { gtr: { faderDb: -3 } }, note: 'The simplest fix. The guitar keeps its full tone — it just stops competing.' },
  { id: 'pan', name: 'PAN — split them apart', delta: { gtr: { faderDb: 4, pan: -60 }, keys: { pan: 45 } }, note: 'Same levels, different addresses. Space solved what volume could not.' },
  { id: 'eq', name: 'EQ — cut the guitar where the lead lives', delta: { gtr: { faderDb: 4, eq: { hz: 2600, gainDb: -6, q: 1.2 } } }, note: 'A cut in the collision zone. The guitar dips only where the lead needs the room.' },
  { id: 'hp', name: 'FILTER — high-pass the guitar', delta: { gtr: { faderDb: 4, hpHz: 350 } }, note: 'Clears the guitar’s low warmth from under everything — subtle here, decisive on dense sessions.' },
  { id: 'mute', name: 'ARRANGEMENT — mute the guitar', delta: { gtr: { mute: true } }, note: 'The nuclear option — total clarity, at the price of the part. Sometimes correct.' },
];

function PageEqContext({ ctx }: { ctx: PageCtx }) {
  const [tried, setTried] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'clash', label: 'THE CLASH', settings: CLASH },
      ...EQ_SOLUTIONS.map((s) => ({ id: s.id, label: s.name.split(' — ')[0], settings: s.delta, matchTo: 'clash' })),
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const goals = [
    { label: 'Hear the clash', hit: pb.heard.includes('clash') },
    { label: 'Hear two different fixes', hit: pb.heard.filter((h) => h !== 'clash').length >= 2 },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  const lastHeardFix = [...pb.heard].reverse().find((h) => h !== 'clash');
  const lastNote = EQ_SOLUTIONS.find((s) => s.id === lastHeardFix);
  return (
    <View style={styles.page}>
      <Lead>This is the FREQUENCY dimension at mix scale: EQ here is not about making tracks sound good alone — it is about making them FIT. And an EQ move is only one of several fixes for a frequency fight.</Lead>
      <Card>
        <Eyebrow>THE PROBLEM — LISTEN FIRST</Eyebrow>
        <Prompt>The guitar stabs and the lead line share the same range, both centred. Play THE CLASH: the lead is still “loudest”, yet it feels buried.</Prompt>
        <AbPlayer pb={pb} variants={[variants[0]]} />
      </Card>
      <Card>
        <Eyebrow>FIVE LEGITIMATE FIXES — AUDITION THEM</Eyebrow>
        <Body>Each one applies a REAL change, level-matched to the clash. There is no single correct answer — there is the smallest change that solves the problem for THIS song.</Body>
        <AbPlayer pb={pb} variants={variants.slice(1)} />
        {lastNote ? <Text style={styles.fixNote}>{lastNote.name}: {lastNote.note}</Text> : <Text style={styles.fixName}>Audition a fix to see its trade-off.</Text>}
      </Card>
      <Card tone="note">
        <Eyebrow>TWO HABITS THAT KEEP EQ HONEST</Eyebrow>
        <Body>Judge EQ IN CONTEXT — endless soloing optimises a track for a world where it plays alone. And after any boost, ask: did that fix the tone, or just make the track LOUDER? (If louder: undo, and match levels before judging.) For the full EQ toolkit — shelves, Q, dynamic EQ — the EQ Lab goes deep; this page is about the mix decision.</Body>
        <OpenLabLink route="EqLabHome" label="OPEN THE EQ LAB" />
      </Card>
      <UnderstandingCheck
        question="Kick and bass blur into one woolly low end. The mix-context first move is:"
        options={['Boost the kick’s low end so it wins the range', 'Pick one owner of the very bottom and carve the other around it', 'Turn both of them up so both stay audible', 'Add a sub-bass enhancer across the mix bus']}
        correct={1}
        explain="Two sounds cannot both own the same octave. Decide the owner (kick OR bass takes the very bottom), then clear the other out of that pocket — a cut, a filter, or level. Separation is a decision before it is a setting."
        wrong={[
          'Boosting the kick adds MORE energy to the crowded octave — the blur gets louder, not clearer.',
          undefined,
          'Both-up is how low end swallows a mix. The range is full; adding level cannot un-share it.',
          'A bus enhancer multiplies the problem across everything. Fix the two tracks that are fighting.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 9 · BASIC COMPRESSION ══════════════════════════════════════════════ */

const COMP_PARAMS = [
  { id: 'threshold', name: 'THRESHOLD', blurb: 'The level where the compressor starts working. Below it: untouched.' },
  { id: 'ratio', name: 'RATIO', blurb: 'How firmly it turns down what crosses the threshold. 4:1 = every 4 dB over comes out as 1 dB.' },
  { id: 'attack', name: 'ATTACK', blurb: 'How fast it grabs. This shapes the FRONT of every note — the punch.' },
  { id: 'release', name: 'RELEASE', blurb: 'How fast it lets go. This shapes the TAIL — the groove’s breathing.' },
  { id: 'makeup', name: 'MAKEUP GAIN', blurb: 'Restores the level the compression removed — so you can compare honestly.' },
] as const;

const SNARE_ONLY: MixSettings = { kick: { mute: true }, perc: { mute: true }, bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true } };

function PageCompression({ ctx }: { ctx: PageCtx }) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'dry', label: 'NO COMP', settings: SNARE_ONLY },
      { id: 'fast', label: 'FAST ATTACK', settings: { ...SNARE_ONLY, snare: { comp: { thresholdDb: -30, ratio: 6, attackMs: 0.4, releaseMs: 90 } } }, matchTo: 'dry' },
      { id: 'slow', label: 'SLOW ATTACK', settings: { ...SNARE_ONLY, snare: { comp: { thresholdDb: -30, ratio: 6, attackMs: 30, releaseMs: 90 } } }, matchTo: 'dry' },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const heardAll = ['dry', 'fast', 'slow'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Open all five parameters', hit: opened.size >= COMP_PARAMS.length },
    { label: 'Hear dry, fast and slow attack', hit: heardAll },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>A compressor is an automatic fader that reacts in milliseconds. What it really controls is not “how compressed” — it is the SHAPE of every note: the grab and the letting-go.</Lead>
      <Card>
        <Eyebrow>THE FIVE PARAMETERS</Eyebrow>
        <ConceptList items={COMP_PARAMS.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb }))} opened={opened} onOpen={(id) => setOpened((s) => new Set(s).add(id))} />
      </Card>
      <Card>
        <Eyebrow>HEAR THE ENVELOPE CHANGE</Eyebrow>
        <Prompt>The snare, alone, three ways — all level-matched, same threshold and ratio. Only ATTACK differs. Listen to the front of each hit.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Loudness is matched, so the difference you hear is pure envelope. Which one you PREFER depends on the song — that part is yours." />
      </Card>
      <Card tone="note">
        <Eyebrow>THE HONEST COMPARISON RULE</Eyebrow>
        <Body>A compressor without makeup gain sounds “worse” (quieter); with generous makeup it sounds “better” (louder). Neither is a judgment of the compression. Bypass-compare at MATCHED loudness — this lab does it for you; in your DAW, you do it with makeup gain.</Body>
      </Card>
      <UnderstandingCheck
        question="You want the snare to keep its crack but sit steadier in the mix. Which parameter is the conversation?"
        options={['Ratio — reach for more of it', 'Attack — slow it down so the crack escapes the clamp', 'Makeup gain — turn the whole thing up after', 'Threshold — set it above the snare entirely']}
        correct={1}
        explain="Attack decides whether the transient escapes before compression lands. Slower attack = the crack passes, the body gets controlled. Ratio decides how firmly; attack decides WHAT gets caught."
        wrong={[
          'Ratio sets how hard everything caught is turned down — it cannot tell the crack apart from the body.',
          undefined,
          'Makeup restores level after the fact — the envelope was already decided upstream.',
          'A threshold the snare never crosses means no compression at all — steadiness unchanged.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 10 · REVERB & DELAY (shared space) ═════════════════════════════════ */

function PageReverbDelay({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  // The shared plate EVERY send feeds — without sharedVerb on the variant the
  // sends render silent (cognition audit P1-1: the page briefly shipped three
  // identical renders; never let that regress).
  const PLATE = { space: 'plate' as const, returnDb: 0 };
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'dry', label: 'BONE DRY', settings: {} },
      {
        id: 'shared',
        label: 'ONE SHARED ROOM',
        settings: { lead: { verbSendDb: -10 }, snare: { verbSendDb: -12 }, gtr: { verbSendDb: -14 }, bgv: { verbSendDb: -12 } },
        sharedVerb: PLATE,
        matchTo: 'dry',
      },
      {
        id: 'drown',
        label: 'DROWNED',
        settings: { lead: { verbSendDb: 2 }, snare: { verbSendDb: 0 }, gtr: { verbSendDb: 0 }, keys: { verbSendDb: 0 }, bgv: { verbSendDb: 2 } },
        sharedVerb: PLATE,
        matchTo: 'dry',
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const heardAll = ['dry', 'shared', 'drown'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Hear dry, shared, and drowned', hit: heardAll },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Reverb and delay answer the DEPTH question: what is close, what is far, what shares a room? The fastest way to a coherent mix: one shared space, fed by sends.</Lead>
      <Card>
        <Eyebrow>THE DEPTH VOCABULARY</Eyebrow>
        <Body>DRY/WET is how much room rides along. PRE-DELAY is the gap before the room answers — longer keeps the source up front. DECAY is how long the room hangs on. Short ambience places; long ambience romanticises. Delays locked to the tempo disappear into the groove; unlocked ones float on top.</Body>
      </Card>
      <Card>
        <Eyebrow>ONE ROOM GLUES THE BAND</Eyebrow>
        <Prompt>Three renders, level-matched: no space at all, a single shared plate fed by four sends, and everything drowned.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="The shared room is ONE reverb with four sends into it — the parts start to feel like they were played in the same place. Drowned is the classic beginner mix: depth everywhere is depth nowhere." />
      </Card>
      <UnderstandingCheck
        question="Why feed one shared reverb from sends instead of inserting a separate reverb on each track?"
        options={['It saves CPU — one reverb instead of eight is the main engineering point', 'Shared space glues the parts, and sends keep each dry level intact', 'Insert reverbs are lower quality than send reverbs by design', 'Because classic professional consoles only ever had one reverb']}
        correct={1}
        explain="A send is an adjustable COPY: the dry track keeps playing at full strength while its copy visits the shared room. Everyone visiting the SAME room is what reads as “a band in a place” rather than eight tracks in eight aquariums."
        wrong={[
          'It does save CPU — but that is a bonus, not the reason. The reason is coherence.',
          undefined,
          'An insert reverb is the same algorithm — the difference is routing: insert processes the WHOLE signal, a send processes a copy.',
          'History rhymes with the practice, but the modern reason stands on its own: shared space, independent dry levels.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 11 · AUXES & SUBGROUPS (the six terms, live) ═══════════════════════ */

const CUE_CONSOLE: MixConsole = {
  channels: [
    { id: 'lead', name: 'LEAD', faderDb: 0, mute: false, out: 'mix', sends: { verb: { levelDb: -8, tap: 'post' }, cue: { levelDb: -4, tap: 'pre' } }, vca: undefined },
  ],
  subgroups: [],
  auxes: [
    { id: 'verb', name: 'REVERB', faderDb: 0, out: 'mix' },
    { id: 'cue', name: 'SINGER’S HEADPHONES', faderDb: 0, out: 'mix' },
  ],
  vcas: [],
};

/** Page 11 (split from one overloaded page — cognition pass P2-4): the six
 *  terms alone, learned by what actually TRAVELS. */
function PageSixTerms({ ctx }: { ctx: PageCtx }) {
  const [openedTerms, setOpenedTerms] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Open all six terms', hit: openedTerms.size >= PATH_TRUTHS.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Six terms carry most of routing — and they are the six most-confused words in mixing. Learn them by what actually TRAVELS: audio, or just control.</Lead>
      <Card>
        <Eyebrow>WHAT EACH ONE ACTUALLY DOES</Eyebrow>
        {PATH_TRUTHS.map((p) => {
          const open = openedTerms.has(p.kind);
          return (
            <View key={p.kind} style={styles.termRow}>
              <Btn label={open ? `✓ ${p.name}` : p.name} tone={open ? 'primary' : 'plain'} selected={open} onPress={() => setOpenedTerms((s) => new Set(s).add(p.kind))} a11y={`Open ${p.name}`} />
              {open ? (
                <Text style={styles.termNote}>
                  {p.purpose} {p.carriesAudio ? 'Audio flows through it.' : p.remoteGainControl ? 'No audio flows through it — control only.' : p.isRenderedFile ? 'It is a delivered file, not a live path.' : 'No audio passes through the group itself.'}
                </Text>
              ) : null}
            </View>
          );
        })}
      </Card>
      <UnderstandingCheck
        question="Drum SUBGROUP vs drum VCA — what is the real difference?"
        options={['They are simply two names for the same drum rig', 'Audio sums THROUGH a subgroup; a VCA only turns the gains together', 'A VCA sounds noticeably warmer than a subgroup does', 'Subgroups are the analogue version; VCAs are the digital one']}
        correct={1}
        explain="Audio flows THROUGH a subgroup — so one compressor there squeezes the whole kit. A VCA is remote control for the channel gains: convenient, but there is no summed path to process."
        wrong={[
          'They are routinely confused, and the difference decides whether shared processing is even possible.',
          undefined,
          'Neither has a sound — one is a signal path, the other is a control relationship.',
          'Both exist in analogue and digital consoles alike — the technology is not the difference.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/** Page 12: pre/post-fader behaviour + the double-routing detective — the
 *  send-as-a-copy idea, given room to breathe after the six terms. */
function PagePrePost({ ctx }: { ctx: PageCtx }) {
  const [faderPulled, setFaderPulled] = useState(false);
  const [detective, setDetective] = useState<null | 'right' | 'wrong'>(null);
  const [checkDone, setCheckDone] = useState(false);

  const ch = { ...CUE_CONSOLE.channels[0], faderDb: faderPulled ? -60 : 0 };
  const verbGain = sendPathGain(ch, 'verb', CUE_CONSOLE);
  const cueGain = sendPathGain(ch, 'cue', CUE_CONSOLE);

  const goals = [
    { label: 'Pull the fader on the cue rig', hit: faderPulled },
    { label: 'Solve the double-routing case', hit: detective === 'right' },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>A send is a COPY of your channel — and WHERE the copy is tapped decides everything. Post-fader copies follow your mix; pre-fader copies ignore it.</Lead>
      <Card>
        <Eyebrow>PRE VS POST, WHERE IT MATTERS</Eyebrow>
        <Prompt>The singer’s headphone mix is fed by a PRE-fader send; the reverb by a POST-fader send. Pull the lead’s fader all the way down and watch what each destination receives.</Prompt>
        <Row>
          <Btn label={faderPulled ? 'FADER: PULLED (−∞)' : 'FADER: 0 dB'} tone={faderPulled ? 'primary' : 'plain'} selected={faderPulled} onPress={() => setFaderPulled((v) => !v)} a11y="Toggle the lead fader between 0 dB and pulled down" />
        </Row>
        <Text style={styles.busLine} accessibilityLiveRegion="polite">
          REVERB (post): {verbGain > 0 ? 'receiving' : 'SILENT'} · HEADPHONES (pre): {cueGain > 0 ? 'receiving' : 'SILENT'}
        </Text>
        <Body>{faderPulled ? 'The reverb died with the fader — post-fader follows your mix moves. The singer still hears themselves — pre-fader ignores the fader. That is why cue mixes are usually pre and effects are usually post (conventions vary by desk — always check yours).' : 'Both destinations receive. Now pull the fader.'}</Body>
      </Card>
      <Card>
        <Eyebrow>THE DOUBLE-ROUTING CASE</Eyebrow>
        <Prompt>Symptom: the lead sounds 5 dB louder than its fader says, and pulling the fader halfway barely changes it. In the routing you find: output → MIX, and an old utility send → also MIX, at full level. What happened?</Prompt>
        <Row>
          <Btn label="THE FADER IS BROKEN" tone={detective === 'wrong' ? 'danger' : 'plain'} onPress={() => setDetective('wrong')} a11y="Answer: the fader is broken" />
          <Btn label="TWO LIVE PATHS TO THE MIX" tone={detective === 'right' ? 'primary' : 'plain'} onPress={() => setDetective('right')} a11y="Answer: two live paths to the mix" />
        </Row>
        {detective === 'right' ? <Body>✓ The channel reaches the mix TWICE — main out plus the forgotten send’s copy. The fader only controls one of them. Kill the extra path; the fader tells the truth again.</Body> : null}
        {detective === 'wrong' ? <Body>The fader works — on the path it owns. The clue is “barely changes”: something ELSE also carries this channel to the mix. Look at the send.</Body> : null}
      </Card>
      <UnderstandingCheck
        question="Mid-take, the engineer nudges the lead’s FADER down 4 dB. What does the singer hear in their pre-fed headphones?"
        options={['Their voice drops by the same 4 dB', 'No change — the pre-fader copy ignores the fader', 'Their voice disappears entirely from the cue', 'Only the reverb in the cue gets quieter']}
        correct={1}
        explain="Pre-fader means the copy is tapped BEFORE the fader — the cue feed never hears mix moves. That is the whole point: the engineer can mix freely without yanking the singer’s reference around."
        wrong={[
          'That is what a POST-fader feed would do — and why cues are not fed post.',
          undefined,
          'Nothing was muted — the fader moved 4 dB, and the pre tap never sees the fader at all.',
          'The cue in this rig is the pre send itself; the reverb is a different, post-fed destination.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

export const MIXING_PAGES_C: PageDef[] = [
  { title: 'Basic EQ in Context', short: 'EQ', Component: PageEqContext, manualDone: true },
  { title: 'Basic Compression', short: 'COMP', Component: PageCompression, manualDone: true },
  { title: 'Reverb & Delay', short: 'SPACE', Component: PageReverbDelay, manualDone: true },
  { title: 'The Six Routing Terms', short: 'TERMS', Component: PageSixTerms, manualDone: true },
  { title: 'Pre/Post & the Double Route', short: 'SENDS', Component: PagePrePost, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
  fixRow: { gap: 4 },
  fixName: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 12.5 },
  fixNote: { color: colors.green, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  termRow: { gap: 4 },
  termNote: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  busLine: { color: colors.amber, fontFamily: fonts.mono, fontSize: 12.5 },
});
