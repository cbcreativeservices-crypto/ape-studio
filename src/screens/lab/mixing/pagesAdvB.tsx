/**
 * Advanced Mixing — pages 6–10 (owner brief 2026-09-11; sections: Parallel &
 * Multibus Mixing · Advanced EQ & Masking · Advanced Dynamics · Phase,
 * Polarity & Alignment · Advanced Depth & Spatial Design). ALL COPY IS NEW —
 * owner ratification pending (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, useMixPlayback, useVisitGoals, type MixVariant } from './kit';
import { combNotchesHz, combPeaksHz } from './engine/advanced.ts';
import type { MixSettings } from './audio/mixAudio.ts';

const DRUMS_ONLY: MixSettings = { bass: { mute: true }, gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true } };

/* ════ 6 · PARALLEL & MULTIBUS MIXING ═════════════════════════════════════ */

function PageParallel({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'dry', label: 'KIT DRY', settings: DRUMS_ONLY },
      {
        id: 'insert',
        label: 'INSERT COMP',
        settings: { ...DRUMS_ONLY, kick: { comp: { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90 } }, snare: { comp: { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90 } }, perc: { comp: { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90 } } },
        matchTo: 'dry',
      },
      {
        id: 'parallel',
        label: 'PARALLEL (NY)',
        settings: { ...DRUMS_ONLY, kick: { comp: { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90, parallelBlendDb: -6 } }, snare: { comp: { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90, parallelBlendDb: -6 } }, perc: { comp: { thresholdDb: -30, ratio: 8, attackMs: 1, releaseMs: 90, parallelBlendDb: -6 } } },
        matchTo: 'dry',
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const heardAll = ['dry', 'insert', 'parallel'].every((id) => pb.heard.includes(id));
  const goals = [
    { label: 'Hear dry, insert, parallel', hit: heardAll },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Parallel processing is the have-it-both-ways move: the untouched signal stays in charge, and a HEAVILY processed copy rides underneath, blended to taste. New York drum compression is the classic case.</Lead>
      <Card>
        <Eyebrow>INSERT VS PARALLEL, HEARD</Eyebrow>
        <Prompt>The kit three ways, level-matched: dry · the crush as an INSERT (it replaces the signal) · the same crush in PARALLEL, blended −6 dB under the dry kit. (Here per drum; the classic New-York move runs one crushed copy of the whole KIT bus.)</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Insert: the crush is the sound. Parallel: the dry transients lead, the crush thickens underneath — density without surrendering the punch." />
      </Card>
      <Card tone="note">
        <Eyebrow>MULTIBUS THINKING</Eyebrow>
        <Body>Scale the idea up: drums bus, music bus, vocal bus, parallels — each a deliberate path with its own processing, all meeting at the mix bus. The architecture is not complexity for its own sake; it is one decision applied to many tracks at once, WHERE the decision belongs.</Body>
      </Card>
      <UnderstandingCheck
        question="Your parallel drum crush sounds huge — until the mix bus clips. What did the parallel path change that an insert would not have?"
        options={['Nothing — parallel and insert load the bus identically', 'It ADDED a second copy’s energy on top of the dry path — summed level rose', 'Parallel compression always removes level', 'The clip means the compressor is broken']}
        correct={1}
        explain="Parallel means dry PLUS wet — real summed energy the insert version never adds. Every parallel path is a level commitment: blend it in, then re-check the bus headroom."
        wrong={[
          'Watch the bus meter as you switch the two — they do not load it the same.',
          undefined,
          'Check the bus meter — which direction did it move when you blended the path in?',
          'The compressor did its job; the SUM of two paths is what crossed the ceiling.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 7 · ADVANCED EQ & MASKING ══════════════════════════════════════════ */

function PageAdvEq({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'clash', label: 'CROWDED', settings: { keys: { faderDb: 2 }, gtr: { faderDb: 2 } } },
      {
        id: 'compl',
        label: 'COMPLEMENTARY',
        settings: {
          keys: { faderDb: 2, eq: { hz: 2600, gainDb: -5, q: 1.1 } },
          gtr: { faderDb: 2, eq: { hz: 2600, gainDb: -4, q: 1.1 } },
          lead: { eq: { hz: 2600, gainDb: 2, q: 1.3 } },
        },
        matchTo: 'clash',
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const conceptItems = [
    { id: 'compl', name: 'Complementary EQ', blurb: 'Cut the crowd where the star lives, lift the star gently in the same range — opposite moves, one pocket.' },
    { id: 'dyneq', name: 'Dynamic EQ', blurb: 'A band that only cuts WHEN the masker plays — surgical, and only as often as needed. (Deep dive: the EQ Lab.)' },
    { id: 'ms', name: 'Mid/side EQ', blurb: 'Different EQ for the centre and the sides — brighten the sides’ air without sharpening the centred vocal.' },
    { id: 'lowmgmt', name: 'Low-frequency management', blurb: 'Below ~120 Hz almost everything fights. Decide the owners (kick, bass), high-pass the tourists, and check in mono.' },
  ] as const;
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const goals = [
    { label: 'Hear crowded vs complementary', hit: pb.heard.includes('clash') && pb.heard.includes('compl') },
    { label: 'Open all four tools', hit: seen.size >= conceptItems.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Beginning EQ cleared one collision. Advanced EQ manages a WHOLE SPECTRUM of tenants — complementary moves, bands that duck on demand, different tone for centre and sides, and a firm hand on the low end.</Lead>
      <Card>
        <Eyebrow>COMPLEMENTARY EQ, HEARD</Eyebrow>
        <Prompt>Keys and guitar crowd the lead’s presence range. COMPLEMENTARY cuts both crowders at 2.6 kHz and lifts the lead 2 dB in the same pocket — three small moves, one opened window.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Level-matched. Notice the lead comes forward without a fader move — the space around it changed." />
      </Card>
      <Card>
        <Eyebrow>THE ADVANCED TOOLKIT</Eyebrow>
        <ConceptList items={conceptItems.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="The acoustic guitar masks the vocal — but only in the chorus, when it strums hard. The precise tool:"
        options={['A static cut on the guitar, all song long', 'A dynamic EQ band on the guitar that dips when its energy crosses a threshold', 'Mute the guitar in every chorus', 'Raise the vocal’s fader for the chorus']}
        correct={1}
        explain="The collision is CONDITIONAL, so the cut should be too. Dynamic EQ dips the guitar’s band only while it earns the dip — verses keep the full guitar."
        wrong={[
          'A static cut pays the chorus’s price all song — the verses lose guitar body for nothing.',
          undefined,
          'Muting solves masking the way demolition solves a leaky roof. Keep the part; manage the range.',
          'A fader ride can help, but it moves the WHOLE vocal against one band’s collision — bigger move than the problem.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 8 · ADVANCED DYNAMICS ══════════════════════════════════════════════ */

function PageAdvDynamics({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'plain', label: 'NO DUCK', settings: { gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true }, snare: { mute: true }, perc: { mute: true } } },
      {
        id: 'duck',
        label: 'KICK DUCKS BASS',
        settings: { gtr: { mute: true }, keys: { mute: true }, lead: { mute: true }, bgv: { mute: true }, snare: { mute: true }, perc: { mute: true }, bass: { comp: { thresholdDb: -26, ratio: 8, attackMs: 2, releaseMs: 110, sidechainFrom: 'kick' } } },
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const toolItems = [
    { id: 'serial', name: 'Serial compression', blurb: 'Two gentle stages instead of one working hard — each catches what the other missed, neither audibly grabbing.' },
    { id: 'multiband', name: 'Multiband compression', blurb: 'Compression per frequency band — tame a boomy low end without touching the mids. Powerful, and easy to overuse.' },
    { id: 'expansion', name: 'Expansion & gating', blurb: 'The mirror tool: make quiet quieter. Tighten bleed, deepen the space between hits.' },
    { id: 'transient', name: 'Transient shaping', blurb: 'Attack and sustain as direct handles, no threshold — sharpen a snare or soften a pluck regardless of level.' },
    { id: 'deess', name: 'Advanced de-essing', blurb: 'Frequency-conscious dynamics for the S band. The De-Esser lab is the deep dive.' },
  ] as const;
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const goals = [
    { label: 'Hear the kick duck the bass', hit: pb.heard.includes('plain') && pb.heard.includes('duck') },
    { label: 'Open all five tools', hit: seen.size >= toolItems.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Advanced dynamics is compression with INTENT beyond level: chains of gentle stages, bands compressed alone, dynamics keyed from OTHER signals — movement designed, not just controlled.</Lead>
      <Card>
        <Eyebrow>SIDECHAIN, HEARD</Eyebrow>
        <Prompt>Kick and bass only. In KICK DUCKS BASS, the bass compressor’s detector listens to the KICK — every kick hit presses the bass down for a moment, then releases. The low end takes turns instead of colliding.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Deliberately NOT level-matched: the ducking dip IS the event you are listening for. Notice the kick suddenly has room without you touching the bass fader — the bass only dips while the kick speaks, then comes right back." />
      </Card>
      <Card>
        <Eyebrow>THE ADVANCED TOOLKIT</Eyebrow>
        <ConceptList items={toolItems.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="Why do engineers often prefer two compressors doing 3 dB each over one doing 6 dB?"
        options={['Two plugins always sound better than one plugin', 'Each stage works gently inside its comfortable range, so neither is audibly grabbing', 'It uses the computer more efficiently', 'The second one fixes the first one’s mistakes automatically']}
        correct={1}
        explain="Serial staging keeps every gain-reduction element in its polite zone. Same total control, none of the pumping a single hard-working stage betrays."
        wrong={[
          'Count is not quality — ask what each stage is being asked to do.',
          undefined,
          'It costs MORE CPU, not less. The win is sonic, not computational.',
          'Nothing automatic happens between the two stages.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 9 · PHASE, POLARITY & ALIGNMENT ════════════════════════════════════ */

const COMB_CHOICES = [0.5, 1, 2, 4] as const;

const fmtHzSpoken = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(1).replace(/\.0$/, '')} kilohertz` : `${Math.round(f)} hertz`);

function PagePhase({ ctx }: { ctx: PageCtx }) {
  const [ms, setMs] = useState<number | null>(null);
  const [checkDone, setCheckDone] = useState(false);
  const [explored, setExplored] = useState<Set<number>>(new Set());
  const goals = [
    { label: 'Explore two comb delays', hit: explored.size >= 2 },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  const notches = ms != null ? combNotchesHz(ms, 3) : null;
  const peaks = ms != null ? combPeaksHz(ms, 3) : null;
  return (
    <View style={styles.page}>
      <Lead>Two microphones on one source arrive at different times. Summed, some frequencies cancel and some reinforce — a COMB rakes through the tone. This page gives you the arithmetic that predicts exactly where.</Lead>
      <Card>
        <Eyebrow>THE COMB CALCULATOR</Eyebrow>
        <Prompt>Pick the delay between two paths and read where the notches land. First notch = 1 / (2 × delay).</Prompt>
        <Row>
          {COMB_CHOICES.map((c) => (
            <Btn
              key={c}
              label={`${c} ms`}
              tone={ms === c ? 'primary' : 'plain'}
              selected={ms === c}
              onPress={() => {
                setMs(c);
                setExplored((s) => new Set(s).add(c));
                // iOS VoiceOver never hears the result line (LiveRegion is
                // Android-only) — announce it (design pass P1-4).
                const n = combNotchesHz(c, 3);
                AccessibilityInfo.announceForAccessibility?.(
                  `Delay ${c} milliseconds. Notches at ${n.map(fmtHzSpoken).join(', ')}. First peak at ${fmtHzSpoken(combPeaksHz(c, 1)[0])}.`,
                );
              }}
              a11y={`Delay ${c} milliseconds`}
            />
          ))}
        </Row>
        {notches && peaks ? (
          <Text style={styles.combLine} accessibilityLiveRegion="polite">
            NOTCHES: {notches.map((f) => (f >= 1000 ? `${(f / 1000).toFixed(1)}k` : Math.round(f))).join(' · ')} Hz — PEAKS: {peaks.map((f) => (f >= 1000 ? `${(f / 1000).toFixed(1)}k` : Math.round(f))).join(' · ')} Hz
          </Text>
        ) : null}
        {ms != null ? <Body>{ms <= 1 ? 'Short delays notch HIGH — the “hollow phone” tone of a close pair slightly off.' : 'Longer delays pull the first notch down into the body of the sound — the tone thins where it hurts.'} Move a mic ~34 cm and you move the delay ~1 ms.</Body> : null}
      </Card>
      <Card tone="note">
        <Eyebrow>POLARITY IS NOT DELAY</Eyebrow>
        <Body>The Ø button MIRRORS the waveform — it can perfectly fix a mis-wired cable, and it costs nothing to try on any multi-mic pair. A TIME offset needs alignment (nudge or delay), not a mirror: no polarity flip un-delays a signal. Check pairs by summing to mono and choosing whichever combination is FULLER, then confirm on the correlation meter (+1 friendly, near −1 danger).</Body>
      </Card>
      <UnderstandingCheck
        question="Snare top and bottom mics: summed, the drum goes thin and papery. Flipping Ø on the bottom mic makes it full again. Why did that work?"
        options={['The bottom mic was broken and the flip repaired it', 'Top and bottom captured the head moving opposite ways — near-mirror signals cancelled', 'The flip added a small delay that aligned the two mics', 'Thin snares always need polarity flips as a default move']}
        correct={1}
        explain="A snare’s bottom head moves away while the top moves toward — near-mirror waveforms. Summed, they cancel; one flip turns the cancellation into reinforcement. Classic polarity, zero time involved."
        wrong={[
          'Nothing was broken — both mics told the truth from opposite sides of one moving head.',
          undefined,
          'Ø adds NO time — it mirrors. Delay problems need alignment, and this was not one.',
          'It worked because of the geometry, not a rule of thumb — always CHECK, never assume.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 10 · ADVANCED DEPTH & SPATIAL DESIGN ═══════════════════════════════ */

function PageAdvDepth({ ctx }: { ctx: PageCtx }) {
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      {
        id: 'room',
        label: 'TIGHT ROOM',
        settings: { snare: { verbSendDb: -10 }, gtr: { verbSendDb: -14 }, lead: { verbSendDb: -12 } },
        sharedVerb: { space: 'room', returnDb: 0 },
      },
      {
        id: 'hall',
        label: 'BIG HALL',
        settings: { snare: { verbSendDb: -10 }, gtr: { verbSendDb: -14 }, lead: { verbSendDb: -12 } },
        sharedVerb: { space: 'hall', returnDb: 0 },
        matchTo: 'room',
      },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const depthItems = [
    { id: 'multi', name: 'Multiple spaces', blurb: 'A tight room for the band, a longer space for the vocal, a plate for the snare — layers of distance, each on its own return.' },
    { id: 'predelay', name: 'Pre-delay as position', blurb: 'Longer pre-delay = the voice steps FORWARD of its room. The gap before the reverb answers is a distance dial.' },
    { id: 'filtered', name: 'Filtered ambience', blurb: 'High-pass the return so the room never muddies the low end; low-pass it to push the space further back.' },
    { id: 'tempo', name: 'Tempo delays & throws', blurb: 'Delays locked to the beat vanish into the groove. An automated THROW on one word makes a moment.' },
  ] as const;
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const goals = [
    { label: 'Hear room vs hall', hit: pb.heard.includes('room') && pb.heard.includes('hall') },
    { label: 'Open all four tools', hit: seen.size >= depthItems.length },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>Beginning built ONE shared room. Advanced depth is set design: several spaces at different distances, shaped returns, delays that live inside the tempo — a front-to-back stage, built on purpose.</Lead>
      <Card>
        <Eyebrow>THE SIZE OF THE ROOM, HEARD</Eyebrow>
        <Prompt>Same sends, two different shared spaces, level-matched: a TIGHT ROOM keeps everything close; a BIG HALL pushes the same parts back and apart.</Prompt>
        <AbPlayer pb={pb} variants={variants} note="Depth is a decision, not a preset: the question is never 'which reverb is best' — it is 'how far away should THIS part live?'" />
      </Card>
      <Card>
        <Eyebrow>THE SET-DESIGN TOOLKIT</Eyebrow>
        <ConceptList items={depthItems.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <UnderstandingCheck
        question="The vocal needs a lush, long reverb — but the mix gets muddy the moment you add it. The set-design fix:"
        options={['Use a shorter reverb and accept losing the lushness', 'Keep it — high-pass the return and open the pre-delay', 'Turn the whole reverb down until the mud finally goes', 'Move the reverb onto the mix bus where it is efficient']}
        correct={1}
        explain="The mud lives in the tail’s LOW end and in the tail crowding the voice itself. Filter the return (no low rumble in the room) and open the pre-delay (the voice speaks, THEN the hall answers) — lush stays, mud goes."
        wrong={[
          'Shorter is one answer — but the surgical one keeps the lushness you wanted.',
          undefined,
          'Turning it down trades mud for dryness on a linear dial. Shaping the return breaks that trade.',
          'A bus reverb bathes EVERYTHING — the opposite of placing one voice in one space.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

export const MIXING_ADV_PAGES_B: PageDef[] = [
  { title: 'Parallel & Multibus Mixing', short: 'PARALLEL', Component: PageParallel, manualDone: true },
  { title: 'Advanced EQ & Masking', short: 'ADV EQ', Component: PageAdvEq, manualDone: true },
  { title: 'Advanced Dynamics', short: 'ADV DYN', Component: PageAdvDynamics, manualDone: true },
  { title: 'Phase, Polarity & Alignment', short: 'PHASE', Component: PagePhase, manualDone: true },
  { title: 'Advanced Depth & Space', short: 'DEPTH', Component: PageAdvDepth, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
  combLine: { color: colors.amber, fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 18 },
});
