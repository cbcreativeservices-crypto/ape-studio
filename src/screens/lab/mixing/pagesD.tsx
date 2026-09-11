/**
 * Beginning Mixing — pages 12–15 (owner brief 2026-09-11; sections: Basic
 * Automation · Check & Finish · Basic Export · the guided FINAL EXERCISE).
 * ALL COPY IS NEW — owner ratification pending
 * (docs/APE_MIXING_LAB_COPY_2026_09_11.md).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { AbPlayer, ConceptList, GoalChips, MiniConsole, MixMantra, countTouched, useMixPlayback, useVisitGoals, type MixVariant } from './kit';
import { TRACK_IDS } from './engine/mixModel.ts';
import type { MixSettings } from './audio/mixAudio.ts';

/* ════ 12 · BASIC AUTOMATION ══════════════════════════════════════════════ */

/** A serviceable static base so the automation contrast is heard in a MIX,
 *  not on a wall (bars 1–2 read as the verse, 3–4 as the chorus). */
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

function PageAutomation({ ctx }: { ctx: PageCtx }) {
  const [liftDb, setLiftDb] = useState(3);
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'static', label: 'STATIC', settings: AUTO_BASE },
      {
        id: 'auto',
        label: 'AUTOMATED',
        settings: {
          ...AUTO_BASE,
          lead: { ...AUTO_BASE.lead, auto: { verseDb: 0, chorusDb: liftDb } },
          bgv: { ...AUTO_BASE.bgv, auto: { verseDb: -60, chorusDb: 8 } },
          perc: { ...AUTO_BASE.perc, auto: { verseDb: -4, chorusDb: 0 } },
        },
        matchTo: 'static',
      },
    ],
    [liftDb],
  );
  const pb = useMixPlayback(variants);
  const goals = [
    { label: 'Hear static vs automated', hit: pb.heard.includes('static') && pb.heard.includes('auto') },
    { label: 'Change the chorus lift', hit: liftDb !== 3 },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>A static mix answers four of the five questions. MOVEMENT — how the mix changes from section to section — is answered with automation: rides, mutes, and sends that follow the song.</Lead>
      <Card>
        <Eyebrow>THE MOVES</Eyebrow>
        <Body>Volume rides (the vocal up for the hook, a word rescued here and there). Mutes that hold a part back so its entrance lands. Pan moves, send lifts, a delay throw on the last word of the verse. None of this is correction — it is storytelling with faders.</Body>
      </Card>
      <Card>
        <Eyebrow>VERSE → CHORUS, TWO WAYS</Eyebrow>
        <Prompt>Bars 1–2 are the “verse”, bars 3–4 the “chorus”. STATIC plays one balance throughout. AUTOMATED rides the lead up by your lift, brings the backing pad IN for the chorus, and lets the percussion open up.</Prompt>
        <Row>
          <Btn label="LIFT +1" tone={liftDb === 1 ? 'primary' : 'plain'} selected={liftDb === 1} onPress={() => setLiftDb(1)} a11y="Chorus lift plus one dB" />
          <Btn label="LIFT +3" tone={liftDb === 3 ? 'primary' : 'plain'} selected={liftDb === 3} onPress={() => setLiftDb(3)} a11y="Chorus lift plus three dB" />
          <Btn label="LIFT +6" tone={liftDb === 6 ? 'primary' : 'plain'} selected={liftDb === 6} onPress={() => setLiftDb(6)} a11y="Chorus lift plus six dB" />
        </Row>
        <AbPlayer pb={pb} variants={variants} note="Level-matched overall — what you hear is CONTRAST, not loudness. Notice how +1 is barely a lift and +6 is an event; taste lives between." />
      </Card>
      <UnderstandingCheck
        question="The chorus needs to feel bigger, but the whole mix is already as loud as it can be. The automation answer:"
        options={['Push the mix bus up for the chorus anyway', 'Make the VERSE smaller so the chorus grows by contrast', 'Add another compressor across the whole chorus', 'Widen everything for the entire song’s length']}
        correct={1}
        explain="Bigness is relative. If the ceiling stops the chorus from rising, lower the floor: thin the verse — mute a pad, dip the percussion, dry the space — and the same chorus now towers."
        wrong={[
          'The ceiling is the ceiling — pushing into it buys clipping, not size.',
          undefined,
          'Compression makes it denser, not bigger — and the ceiling problem remains.',
          'Width all song long is the new normal by bar two — contrast is what reads as big.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 13 · CHECK & FINISH ════════════════════════════════════════════════ */

const FINISH_HABITS = [
  { id: 'bypass', name: 'Bypass-compare, matched', why: 'Everything off vs everything on, at matched loudness. Is the processing actually helping?' },
  { id: 'refs', name: 'References, matched', why: 'Your two reference mixes, matched for perceived loudness. Humbling, and worth it.' },
  { id: 'quiet', name: 'Listen QUIETLY', why: 'At whisper level only balance survives. If the anchor still leads, the balance is real.' },
  { id: 'mono', name: 'Check mono', why: 'One speaker in a shop, a phone on a table — mono happens. Nothing important may vanish.' },
  { id: 'systems', name: 'Headphones AND speakers', why: 'Every playback system lies differently. Truth lives where their stories overlap.' },
  { id: 'breaks', name: 'Take breaks', why: 'Ears adapt within minutes and drift within hours. Fresh ears out-hear tired skill.' },
] as const;

function PageCheckFinish({ ctx }: { ctx: PageCtx }) {
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [checkDone, setCheckDone] = useState(false);
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'mix', label: 'THE MIX', settings: AUTO_BASE },
      { id: 'mono', label: 'IN MONO', settings: AUTO_BASE, mono: true, matchTo: 'mix' },
    ],
    [],
  );
  const pb = useMixPlayback(variants);
  const goals = [
    { label: 'Open all six habits', hit: seen.size >= FINISH_HABITS.length },
    { label: 'Run the mono check', hit: pb.heard.includes('mono') },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>“Finished” is a verdict you earn with checks, not a feeling at 1 a.m. Six habits separate a mix that worked in one room from a mix that works.</Lead>
      <Card>
        <Eyebrow>THE FINISHING HABITS</Eyebrow>
        <ConceptList items={FINISH_HABITS.map((h) => ({ id: h.id, name: h.name, blurb: h.why }))} opened={seen} onOpen={(id) => setSeen((s) => new Set(s).add(id))} />
      </Card>
      <Card>
        <Eyebrow>RUN ONE NOW</Eyebrow>
        <AbPlayer pb={pb} variants={variants} note="The demo balance, stereo and folded — matched. On your own mixes this fold is where panned parts quietly disappear." />
      </Card>
      <UnderstandingCheck
        question="After three hours of mixing, everything sounds dull, so you reach for a big treble boost. The finishing habit says:"
        options={['Boost — trust exactly what you hear right now', 'Break first — tired ears are the most likely broken part', 'Boost, but on the mix bus so it is done efficiently', 'Switch over to headphones and boost it there instead']}
        correct={1}
        explain="Listening fatigue dulls high-frequency perception specifically — the mix probably did not get darker; your ears did. Come back fresh, THEN judge. Half of finishing discipline is knowing when not to decide."
        wrong={[
          'Right now is exactly when your judgment is least trustworthy — ask why everything went dull at once.',
          undefined,
          'Efficient at applying a fix the morning will regret. The location was never the problem.',
          'Different speakers, same tired ears. The fatigue travels with you.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 14 · BASIC EXPORT ══════════════════════════════════════════════════ */

function PageExport({ ctx }: { ctx: PageCtx }) {
  const [rate, setRate] = useState<null | '44.1' | '48'>(null);
  const [depth, setDepth] = useState<null | '16' | '24'>(null);
  const [named, setNamed] = useState(false);
  const [inspected, setInspected] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const goals = [
    { label: 'Choose rate & depth', hit: rate != null && depth != null },
    { label: 'Build the file name', hit: named },
    { label: 'Inspect the bounce', hit: inspected },
    { label: 'Pass the check', hit: checkDone },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <Lead>The export is the product. A handful of unglamorous decisions — format, name, inspection — decide whether tonight’s work survives contact with the world.</Lead>
      <Card>
        <Eyebrow>FORMAT — MATCH THE SESSION, DELIVER WHAT’S ASKED</Eyebrow>
        <Body>Default: export at the SESSION’s sample rate (no resample without a reason) and 24-bit. 44.1 kHz / 16-bit is the CD legacy target; streaming masters are commonly delivered 24-bit. When a client specifies, the spec wins.</Body>
        <Text style={styles.microLabel}>SAMPLE RATE</Text>
        <Row>
          <Btn label="44.1 kHz" tone={rate === '44.1' ? 'primary' : 'plain'} selected={rate === '44.1'} onPress={() => setRate('44.1')} a11y="Choose 44.1 kilohertz" />
          <Btn label="48 kHz (session rate)" tone={rate === '48' ? 'primary' : 'plain'} selected={rate === '48'} onPress={() => setRate('48')} a11y="Choose 48 kilohertz, the session rate" />
        </Row>
        <Text style={styles.microLabel}>BIT DEPTH</Text>
        <Row>
          <Btn label="16-BIT" tone={depth === '16' ? 'primary' : 'plain'} selected={depth === '16'} onPress={() => setDepth('16')} a11y="Choose 16 bit" />
          <Btn label="24-BIT" tone={depth === '24' ? 'primary' : 'plain'} selected={depth === '24'} onPress={() => setDepth('24')} a11y="Choose 24 bit" />
        </Row>
        {rate && depth ? <Body>{rate === '48' && depth === '24' ? '✓ Session rate, 24-bit — the no-surprises default for a mix handoff.' : 'Legitimate for a delivery spec — just make it a DECISION, not an accident. Session-rate 24-bit is the default handoff.'}</Body> : null}
        {depth === '16' ? <Body>Dropping to 16-bit? Dither on the way down — one checkbox, cheap insurance against truncation grit.</Body> : null}
      </Card>
      <Card>
        <Eyebrow>NAME IT LIKE YOU MEAN TO FIND IT</Eyebrow>
        <Prompt>“final_FINAL_2.wav” is a horror story. A name carries song, version, and date:</Prompt>
        <Btn label={named ? '✓ OurSong_Mix_v3_2026-09-11.wav' : 'BUILD: OurSong_Mix_v3_2026-09-11.wav'} tone={named ? 'primary' : 'plain'} selected={named} onPress={() => setNamed(true)} a11y="Build the file name Our Song mix version three" />
        {named ? <Body>Song, what it is, which version, when. Six months from now, this name still answers every question.</Body> : null}
      </Card>
      <Card>
        <Eyebrow>INSPECT THE BOUNCE — ALWAYS</Eyebrow>
        <Prompt>Every export gets opened and checked before it ships. The list:</Prompt>
        <Body>Play the START (clipped count-in? missing pickup?), the END (cut reverb tail? truncation?), scan the waveform for clipping, confirm the duration, and listen for anything missing — a muted return, a bypassed insert, a dead side.</Body>
        <Btn label={inspected ? '✓ BOUNCE INSPECTED' : 'RUN THE INSPECTION'} tone={inspected ? 'primary' : 'plain'} selected={inspected} onPress={() => setInspected(true)} a11y="Run the bounce inspection" />
        {inspected ? <Body>✓ Start clean · end tail complete · no clipped samples · length correct · all parts present. THIS pass, every time, is what “professional” mostly means.</Body> : null}
      </Card>
      <UnderstandingCheck
        question="Your bounce plays fine for 3:40 of its 3:55 — then silence. Most likely story?"
        options={['The exported file is corrupt; export again and hope', 'The export range ended early and truncated the tail', 'Fifteen seconds of end silence is normal in WAV files', 'The mastering stage will restore the missing ending']}
        correct={1}
        explain="A truncated tail almost always means the export selection ended early — the reverb’s last two bars were outside the range. It is the single most common export bug, and the END-check exists precisely for it."
        wrong={[
          'Corruption usually refuses to play at all — a file that plays fine and then stops points at a setting, not damage.',
          undefined,
          'Trailing SILENCE can be normal — a tail that CUTS is not. Listen to how it ends.',
          'Mastering polishes what exists. It cannot invent the missing fifteen seconds.',
        ]}
        onCorrect={() => setCheckDone(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ 15 · THE FINAL EXERCISE ════════════════════════════════════════════ */

/** The final's steps: VERIFIED where the page can observe the work (console
 *  state, listening), ON-YOUR-HONOR only where it genuinely cannot see (your
 *  own DAW session) — cognition pass P2-3. */
type FinalStep = { id: string; name: string; blurb: string; verified: boolean };
const FINAL_STEPS: FinalStep[] = [
  { id: 'organize', name: '1 · Organize', blurb: 'Session prepped: named, ordered, cleaned, headroom left, untouched version saved. (On your honor — the app cannot see your session.)', verified: false },
  { id: 'static', name: '2 · Static mix', blurb: 'Shape at least five tracks on the console below — anchor, balance, pan.', verified: true },
  { id: 'masking', name: '3 · Fix one masking fight', blurb: 'Clear a collision with a high-pass or an EQ cut on the console (level counts too — tap done if you solved it with faders).', verified: true },
  { id: 'comp', name: '4 · One compressor', blurb: 'The lead’s compressor is wired into YOUR MIX — hear it land.', verified: true },
  { id: 'verb', name: '5 · One shared reverb', blurb: 'The shared room rides YOUR MIX’s sends — hear the glue.', verified: true },
  { id: 'auto', name: '6 · Automate the lead', blurb: 'The verse→chorus ride is in YOUR MIX — hear the movement.', verified: true },
  { id: 'mono', name: '7 · Mono check', blurb: 'Fold it down. Nothing important disappears.', verified: true },
  { id: 'export', name: '8 · Export & inspect', blurb: 'Session rate, 24-bit, a real name, the start/end/clipping pass. (On your honor.)', verified: false },
];

function PageFinal({ ctx }: { ctx: PageCtx }) {
  const [mix, setMix] = useState<MixSettings>({});
  const [tapped, setTapped] = useState<Set<string>>(new Set());
  const touched = countTouched(mix, TRACK_IDS);
  const maskingMove = TRACK_IDS.some((id) => mix[id]?.hpHz || mix[id]?.eq);
  // The full final settings — used by BOTH the stereo and mono variants, so
  // "YOURS, MONO" folds the SAME mix it claims to (cognition pass P2-3).
  const finalSettings = useMemo<MixSettings>(
    () => ({
      ...mix,
      lead: { ...(mix.lead ?? {}), comp: { thresholdDb: -26, ratio: 3, attackMs: 12, releaseMs: 120 }, verbSendDb: -10, auto: { verseDb: 0, chorusDb: 3 } },
      snare: { ...(mix.snare ?? {}), verbSendDb: -12 },
    }),
    [mix],
  );
  const PLATE = { space: 'plate' as const, returnDb: 0 };
  const variants = useMemo<readonly MixVariant[]>(
    () => [
      { id: 'wall', label: 'WHERE YOU STARTED', settings: {} },
      { id: 'final', label: 'YOUR MIX', settings: finalSettings, sharedVerb: PLATE, matchTo: 'wall' },
      { id: 'mono', label: 'YOURS, MONO', settings: finalSettings, sharedVerb: PLATE, mono: true, matchTo: 'wall' },
    ],
    [finalSettings],
  );
  const pb = useMixPlayback(variants);
  const heardFinal = pb.heard.includes('final');
  const stepDone = (s: FinalStep): boolean => {
    switch (s.id) {
      case 'static':
        return touched >= 5;
      case 'masking':
        return maskingMove || tapped.has('masking');
      case 'comp':
      case 'verb':
      case 'auto':
        return heardFinal;
      case 'mono':
        return pb.heard.includes('mono');
      default:
        return tapped.has(s.id);
    }
  };
  const finished = FINAL_STEPS.every(stepDone);
  const goals = [{ label: 'Complete all eight steps', hit: finished }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={styles.page}>
      <MixMantra />
      <Lead>Everything this lab taught, once, in order, on the session you know. Work the steps top to bottom — the checkable ones check THEMSELVES as you actually do the work.</Lead>
      <Card>
        <Eyebrow>THE PROCESS</Eyebrow>
        {FINAL_STEPS.map((s) => {
          const isDone = stepDone(s);
          const tappable = !s.verified || s.id === 'masking';
          return (
            <View key={s.id} style={styles.finalRow}>
              <Btn
                label={isDone ? `✓ ${s.name}` : s.name}
                tone={isDone ? 'primary' : 'plain'}
                selected={isDone}
                disabled={!tappable && !isDone}
                onPress={() => (tappable ? setTapped((t) => new Set(t).add(s.id)) : undefined)}
                a11y={`${s.name}: ${s.blurb}${isDone ? '. Done.' : ''}`}
              />
              <Text style={styles.finalBlurb}>{s.blurb}</Text>
            </View>
          );
        })}
      </Card>
      <Card>
        <Eyebrow>YOUR CONSOLE</Eyebrow>
        <MiniConsole tracks={TRACK_IDS} value={mix} onChange={setMix} show={{ fader: true, pan: true, mute: true, pol: true }} />
        <Text style={styles.consoleNote}>LEAD and BGV are synth stand-ins for the vocal parts — real stems swap in identically. Steps 4–6 are wired into YOUR MIX: the render is your balance plus those three moves.</Text>
        <Btn label="RESET MIX" disabled={touched === 0} onPress={() => setMix({})} a11y="Reset every channel to flat" />
      </Card>
      <Card>
        <Eyebrow>LISTEN — THEN CALL IT</Eyebrow>
        <AbPlayer pb={pb} variants={variants} note="Where you started, what you made, and the fold — all matched. If YOUR MIX beats the wall and survives mono, you have mixed. Welcome to the part of audio that never stops being interesting." />
      </Card>
      {finished ? (
        <Card tone="ok">
          <Eyebrow>WHERE TO GO DEEPER</Eyebrow>
          <Body>The Training section carries the deep dives this lab deliberately linked instead of duplicating: the EQ Lab, the Compressor & Dynamics labs, the De-Esser, Ear Training, and the analyzers. The Advanced Mixing lab — complex routing, parallel paths, translation, stems and delivery — picks up exactly where this page ends.</Body>
        </Card>
      ) : null}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ════ export ═════════════════════════════════════════════════════════════ */

export const MIXING_PAGES_D: PageDef[] = [
  { title: 'Basic Automation', short: 'AUTO', Component: PageAutomation, manualDone: true },
  { title: 'Check & Finish', short: 'FINISH', Component: PageCheckFinish, manualDone: true },
  { title: 'Basic Export', short: 'EXPORT', Component: PageExport, manualDone: true },
  { title: 'The Final Mix', short: 'FINAL', Component: PageFinal, manualDone: true },
];

const styles = StyleSheet.create({
  page: { gap: 12 },
  consoleNote: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 15 },
  microLabel: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.4, marginTop: 2 },
  finalRow: { gap: 4 },
  finalBlurb: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});
