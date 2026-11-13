/**
 * Page 22 — CAPSTONE AND FREE PLAY (group E, pages 20 to 22: see
 * pages/index.ts).
 *
 * No new idea: the student connects ONE scene from the ideas of the whole
 * lab. Seven requirements (data/gaCapstone), each judged from the model's
 * facts and state during this visit, never from a key press:
 *
 *   footsteps on two surfaces with two takes on one · the generator running
 *   with its speed changed as it played · one zone crossing with the beds
 *   running · a door event that played its rattle layer · a guide line that
 *   ducked the mix · one music change applied on a bar · the overheat alarm
 *   running with its visual cue on
 *
 * A BRIEF, NOT A SCRIPT (audit 2, L-04; lead's decision 14). Step 2 says
 * what to build and that the seven goals are the evidence; it names no key.
 * The learner plans. SHOW A HINT under the goals gives the keys for the
 * first goal not met yet, one goal at a time, only when asked.
 *
 * THE DOCK gives the whole scene in three keys, each a tray:
 *   MOVE    STEP FORWARD and three places; its slider is which way you face
 *   SOUNDS  door, scene, generator 1, guide line, alarm, visual cue, CLEAN
 *           SCENE; its slider is the generator's SPEED (the page's teaching
 *           control). It was WORLD, a name no other page uses (L-32); page
 *           17's tray of the scene's sounds is SOUNDS too.
 *   MUSIC   start and stop, mood, layers, stinger
 * and a fourth key for the record, which changes nothing in the sound:
 *   REPORT  SHARE SUMMARY first (W2-03: it was under the fold), then a
 *           PLATFORM and a LISTENING setup (page 3's lists). The one test
 *           for each choice is printed in the summary card, not the tray.
 *           (The key was SUMMARY, cut in a six-key dock at 390 wide; then
 *           SETUP, which is page 9's variation tray: L-32.)
 * The MUSIC and REPORT trays have no use for the slider, so the lane steps
 * aside while they are open (`hideLane`): in full screen the dock then
 * rises less far over the picture. Their chips are chdKit's 44 pt TrayChip
 * (they were 35 pt LabChips, W2-26).
 *
 * THE STRIP under the scene follows the tray in use (lead's decision 1): a
 * chip in MUSIC shows the MUSIC strip (bars, beats, the waiting change); a
 * chip in SOUNDS shows the MIX strip (the six bus meters and the duck). It
 * opens on MIX. MOOD is printed on the picture (`show.mood`). The two slider
 * keys say what their number is: FACE 90°, SPEED 40% (W2-26).
 *
 * THE SLIDER UNDER AN OPEN TRAY (audit 2, W2-01, S1). MOVE and SOUNDS are
 * sticky choosers: the tray stays open, and the shared shell
 * (rack/RackUnit) hands the slider to the key only when the tray CLOSES. So
 * on the first tap the slider still belongs to the other key. The shell is
 * not this page's to change tonight; the two tray titles and step 2 say the
 * truth instead ("CLOSE THIS: THE SLIDER TURNS YOU" / "… IS SPEED"). The
 * need is recorded for the owner: bind the lane when a sticky chooser OPENS.
 *
 * Once the seven are met the same scene stays open as a sandbox: nothing is
 * locked before, and nothing is taken away after.
 *
 * THE LEARNING SUMMARY is plain text (data/gaCapstone): the choices, one
 * test for each, what was wired and why. SHARE SUMMARY hands that text to
 * the system share sheet (React Native's own Share; no package). Completing
 * this page is a lab progress record, not a qualification.
 *
 * Nothing sounds by itself. Like every page, this one opens on a CLEAN
 * SCENE (the model's `enterPage`, sent by GaRack): YOU on the stone path
 * facing the door, the door closed, nothing playing, an empty log. Every
 * step of the page is written from that scene, and every requirement can
 * be met from it with the keys above (traced in the test's reference
 * run). CLEAN SCENE in the WORLD tray gives the same scene again during
 * free play.
 *
 * Common mistake taught against: judging a scene by the keys that were
 * pressed, when the log shows what the audio side really did.
 *
 * LENGTH (audit 2, L-06): 272 words of prose against a plan of 150 to 260;
 * the key-by-key lines went into the hints.
 */
import { useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useInFlightLatch } from '../../../../lib/latch';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { useRackLeaveFull } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Caption, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, surfaceOf, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, gaResetScene, useGa } from '../model/gaStore';
import { DOOR_POS, WALL_X, zoneAt, type GaPoint } from '../model/gaWorld';
import { GA_ASSETS } from '../sounds/gaSoundBank';
import { Tray, TrayChip, TrayGrid, TrayNote, onOff } from './chdKit';
import { useCapstoneVisit } from './cheKit';
import { pendingLine } from './data/chcMusicVoice';
import { GA_CAPSTONE, GA_SUMMARY_TITLE, gaCapstoneMet, gaCapstoneNextHint, gaCapstoneSummary, gaCapstoneSummaryLines } from './data/gaCapstone';
import { GA_LISTENING, GA_PLATFORMS, gaListening, gaPlatform, type GaListeningId, type GaPlatformId } from './data/gaPlatforms';
import { G22 } from './guides/p22';
import { facingKey, speedKey } from './shared';

/** Every sound the whole scene can play: the capstone uses them all. */
const ASSETS: readonly string[] = [
  ...GA_ASSETS.filter((a) => a.id.startsWith('fs_')).map((a) => a.id),
  'door', 'door_rattle', 'gen_hum', 'gen_air', 'fountain', 'amb_room', 'amb_yard', 'alarm', 'vo_greeting', 'vo_greeting_long', 'mu_calm', 'mu_pulse', 'mu_drive', 'mu_stinger', 'ir_room',
];
// "Game Syncs" was here, as if it were the general word (audit 2, A1): it is
// Wwise's, and page 8 and page 20 teach it as Wwise's
const TERMS = gaTerms('Audio event (game)', 'Audio parameter', 'Dynamic mixing', 'Adaptive music');

/** The two sticky trays' titles: what the slider does, said truthfully
 *  (W2-01: the slider binds when the tray CLOSES). Kept short so the title
 *  itself is never cut (the shell adds "stays open …" after it). */
export const P22_MOVE_TITLE = 'MOVE · CLOSE THIS: THE SLIDER TURNS YOU';
export const P22_SOUNDS_TITLE = 'SOUNDS · CLOSE THIS: THE SLIDER IS SPEED';
const sceneOn = (s: GaState): boolean => gaPlaying(s, 'bed_room') || gaPlaying(s, 'bed_yard');
const alarmOn = (s: GaState): boolean => gaPlaying(s, 'alarm');
const SURFACE_WORD = { wood: 'WOOD', stone: 'STONE', gravel: 'GRAVEL' } as const;
/** Two logs, each showing the lines its step talks about (a step prints
 *  four lines, and moving SPEED prints many: unfiltered, they push the
 *  ZONE line and the DUCK line out of view). Step 2: what the game asked
 *  and what started, with the ZONE line. Step 3: the mix and the music. */
const LOG_KINDS = ['trigger', 'start', 'state', 'refused', 'failed', 'note'] as const;
const MIX_KINDS = ['mix', 'music', 'refused', 'failed'] as const;

/* ── MOVE: places to go without walking every step ──────────────────────── */
// (a STEP that cannot move, against the closed door or the edge, prints a
// NOTE line saying why: LOG_KINDS lets it through)

type Spot = 'path' | 'gravel' | 'room';
const SPOTS: Record<Spot, GaPoint> = { path: { x: 5.2, y: DOOR_POS.y }, gravel: { x: 6.0, y: 2.6 }, room: { x: 11.0, y: DOOR_POS.y } };
const SPOT_LABEL: Record<Spot, string> = { path: 'GO: STONE PATH', gravel: 'GO: GRAVEL', room: 'GO: WORKSHOP' };
/** Just outside and just inside the doorway: a walker passes the wall only
 *  through it, and only when the door is open (model/gaWorld `walkTo`). */
const DOOR_OUT: GaPoint = { x: WALL_X - 0.9, y: DOOR_POS.y };
const DOOR_IN: GaPoint = { x: WALL_X + 0.9, y: DOOR_POS.y };

const crosses = (s: GaState, spot: Spot): boolean => zoneAt(s.chars.player) !== zoneAt(SPOTS[spot]);

/** Walk to a place: to the doorway first when it is on the other side. With
 *  the door closed you stop at the door, as the model's walls require. */
function goTo(spot: Spot): void {
  const here = gaGet().chars.player;
  if (crosses(gaGet(), spot)) {
    const fromYard = zoneAt(here) === 'yard';
    gaDispatch({ type: 'move', who: 'player', ...(fromYard ? DOOR_OUT : DOOR_IN) });
    if (!gaGet().doorOpen) return;
    gaDispatch({ type: 'move', who: 'player', ...(fromYard ? DOOR_IN : DOOR_OUT) });
  }
  gaDispatch({ type: 'move', who: 'player', ...SPOTS[spot] });
}

type FaderKey = Extract<DockParam, { kind: 'fader' }>;
type Chooser = NonNullable<FaderKey['chooser']>;
/** A shared slider key that also opens a tray: one key, a tray and a lane. */
/** The key's value says what its number is ("FACE 90°", "SPEED 40%"):
 *  W2-26, the key read "MOVE 90°" and "WORLD 40%". */
const withTray = (base: DockParam, label: string, chooser: Chooser, word: string): DockParam =>
  base.kind === 'fader' ? { ...base, label, chooser, formatShort: (v: number) => `${word} ${(base.formatShort ?? base.format)(v)}` } : base;

const moveKey = (s: GaState): DockParam =>
  withTray(facingKey(s), 'MOVE', {
    title: P22_MOVE_TITLE,
    sticky: true,
    selectedId: null,
    options: [{ id: 'step', label: 'STEP FORWARD' }, ...(Object.keys(SPOTS) as Spot[]).map((id) => ({ id, label: crosses(s, id) && !s.doorOpen ? `${SPOT_LABEL[id]} · DOOR IS CLOSED` : SPOT_LABEL[id] }))],
    onSelect: (id) => (id === 'step' ? gaDispatch({ type: 'step', who: 'player' }) : goTo(id as Spot)),
  }, 'FACE');

/* ── SOUNDS: the scene's sounds; the slider is the generator's speed ────── */

const soundsKey = (s: GaState, onUse: () => void): DockParam => {
  const generatorOn = !!s.machines[0]?.on;
  return withTray(speedKey(s), 'SOUNDS', {
    title: P22_SOUNDS_TITLE,
    sticky: true,
    selectedId: null,
    options: [
      { id: 'door', label: s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR' },
      { id: 'scene', label: onOff('SCENE', sceneOn(s)) },
      { id: 'generator', label: onOff('GENERATOR 1', generatorOn) },
      { id: 'line', label: 'GUIDE LINE' },
      { id: 'alarm', label: onOff('ALARM', alarmOn(s)) },
      { id: 'cue', label: onOff('VISUAL CUE', s.options.visualCue) },
    ],
    onSelect: (id) => {
      onUse();
      const now = gaGet();
      if (id === 'door') gaDispatch({ type: 'door' });
      else if (id === 'scene') gaDispatch({ type: 'scene', on: !sceneOn(now) });
      else if (id === 'generator') gaDispatch({ type: 'machine', id: 'generator-1', on: !now.machines[0]?.on });
      else if (id === 'line') gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' });
      else if (id === 'alarm') gaDispatch({ type: 'alarm', on: !alarmOn(now) });
      else if (id === 'cue') gaDispatch({ type: 'option', patch: { visualCue: !now.options.visualCue } });
    },
    onReset: { label: 'CLEAN SCENE', onPress: gaResetScene },
  }, 'SPEED');
};

/* ── MUSIC ──────────────────────────────────────────────────────────────── */

/** Two rows of 44 pt chips and one line (W2-03: the tray must fit about
 *  196 pt with the strip in place). The waiting change is said in page 14's
 *  own words (data/chcMusicVoice `pendingLine`), as PENDING. */
function MusicTray({ onUse }: { onUse: () => void }) {
  const s = useGa();
  const act = (f: () => void) => () => {
    onUse();
    f();
  };
  const m = s.music;
  const waiting = m.on || m.pending || m.stinger ? `PENDING · ${pendingLine(s)}` : 'Start the music first. A change needs a running bar to land on.';
  return (
    <Tray>
      <TrayGrid head="MUSIC · THREE LAYERS ON ONE CLOCK" cols={4}>
        <TrayChip label={onOff('MUSIC', m.on)} selected={m.on} onPress={act(() => gaDispatch({ type: gaGet().music.on ? 'musicStop' : 'musicStart' }))} />
        <TrayChip label={onOff('PULSE', m.layers.pulse)} selected={m.layers.pulse} onPress={act(() => gaDispatch({ type: 'musicLayer', layer: 'pulse', on: !gaGet().music.layers.pulse }))} />
        <TrayChip label={onOff('DRIVE', m.layers.drive)} selected={m.layers.drive} onPress={act(() => gaDispatch({ type: 'musicLayer', layer: 'drive', on: !gaGet().music.layers.drive }))} />
        <TrayChip label={m.stinger ? 'STINGER · WAITING' : 'STINGER'} selected={!!m.stinger} onPress={act(() => gaDispatch({ type: 'stinger' }))} />
      </TrayGrid>
      <TrayGrid head="MOOD · A GAME STATE" cols={4}>
        <TrayChip label={marked('CALM', s.mood === 'calm')} selected={s.mood === 'calm'} onPress={act(() => gaDispatch({ type: 'mood', mood: 'calm' }))} />
        <TrayChip label={marked('ALERT', s.mood === 'alert')} selected={s.mood === 'alert'} onPress={act(() => gaDispatch({ type: 'mood', mood: 'alert' }))} />
      </TrayGrid>
      <TrayNote>{waiting}</TrayNote>
    </Tray>
  );
}

/* ── REPORT: the share key, then the two choices ────────────────────────── */

type SummaryProps = {
  platform: GaPlatformId | null;
  listening: GaListeningId | null;
  onPlatform: (id: GaPlatformId) => void;
  onListening: (id: GaListeningId) => void;
  onShare: () => void;
  shareNote: string | null;
};

/** SHARE SUMMARY on the first row, so it is never under the fold (W2-03,
 *  W2-17); then the two lists in 44 pt chips. The one test for each choice
 *  is printed in the summary card in the well, not here. */
function SummaryTray({ platform, listening, onPlatform, onListening, onShare, shareNote }: SummaryProps) {
  // in full screen the share sheet opens after the rack has left full screen
  const leaveFull = useRackLeaveFull();
  // MEASURED at 390 x 844 (2026-11-13): for about a second after it opens,
  // this tray's viewport is 218 pt (then 241, once the slider steps aside).
  // So: one heading for both lists, a 6 pt gap, the five listening chips in
  // one row: 215 pt, every chip above the fold from the first frame.
  return (
    <View style={styles.reportTray}>
      <TrayGrid cols={1}>
        <TrayChip label="SHARE SUMMARY · AS PLAIN TEXT" onPress={() => (leaveFull ? leaveFull(onShare) : onShare())} />
      </TrayGrid>
      <TrayGrid head="PLATFORM, THEN LISTENING · CHANGE NO SOUND" cols={4}>
        {GA_PLATFORMS.map((p) => (
          <TrayChip key={p.id} label={marked(p.label, platform === p.id)} selected={platform === p.id} onPress={() => onPlatform(p.id)} />
        ))}
      </TrayGrid>
      {/* the house chip's 12 pt text broke HEADPHONES and SOUNDBAR in a
          fifth of the width, so this row uses NarrowChip */}
      <TrayGrid cols={5}>
        {GA_LISTENING.map((l) => (
          <NarrowChip key={l.id} label={marked(l.label, listening === l.id)} selected={listening === l.id} onPress={() => onListening(l.id)} />
        ))}
      </TrayGrid>
      {/* after the chips, so a note never pushes a chip under the fold */}
      {shareNote ? <TrayNote>{shareNote}</TrayNote> : null}
    </View>
  );
}

/** A 44 pt tray chip for a fifth of the tray's width: the same look as
 *  chdKit's TrayChip, with 10.5 pt text and no letter spacing, so a word
 *  of ten capitals (HEADPHONES) fits one line. Its state is in the label. */
function NarrowChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.narrow, selected && styles.narrowOn]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} aria-pressed={selected}>
      <Text style={[styles.narrowText, selected && styles.narrowTextOn]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

/** SHOW A HINT: the keys for the first goal not met yet, only when asked.
 *  One hint at a time; it follows the goals as they are met. */
function HintLine({ done }: { done: readonly boolean[] }) {
  const [asked, setAsked] = useState(false);
  const next = gaCapstoneNextHint(done);
  if (!next) return null;
  return (
    <View style={styles.hint}>
      {asked ? (
        <Text style={styles.hintText} accessibilityLiveRegion="polite">
          <Text style={styles.hintHead}>{`HINT · ${next.chip.toUpperCase()}  `}</Text>
          {next.hint}
        </Text>
      ) : null}
      <Pressable style={styles.hintBtn} onPress={() => setAsked((a) => !a)} accessibilityRole="button" accessibilityLabel={asked ? 'Hide the hint' : 'Show a hint for the first goal not met yet'}>
        <Text style={styles.hintBtnText}>{asked ? 'HIDE THE HINT' : 'SHOW A HINT'}</Text>
      </Pressable>
    </View>
  );
}

/** The summary in the well: read-only text, the same words SHARE sends. */
function SummaryCard({ platform, listening, done }: { platform: GaPlatformId | null; listening: GaListeningId | null; done: readonly boolean[] }) {
  const lines = gaCapstoneSummaryLines(platform, listening, done);
  return (
    <View style={styles.card} accessible accessibilityRole="summary" accessibilityLabel={gaCapstoneSummary(platform, listening, done)}>
      <Text style={styles.cardTitle}>{GA_SUMMARY_TITLE.toUpperCase()}</Text>
      {lines.map((ln, i) => (
        <Text key={i} selectable style={ln.kind === 'head' ? styles.cardHead : ln.kind === 'detail' ? styles.cardDetail : ln.kind === 'foot' ? styles.cardFoot : styles.cardItem}>
          {ln.kind === 'head' ? ln.text.toUpperCase() : ln.text}
        </Text>
      ))}
    </View>
  );
}

/* ── the page ───────────────────────────────────────────────────────────── */

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const since = useCapstoneVisit(s);
  const [platform, setPlatform] = useState<GaPlatformId | null>(null);
  const [listening, setListening] = useState<GaListeningId | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [strip, setStrip] = useState<'mix' | 'music'>('mix');
  const shareLatch = useInFlightLatch();

  const metNow = gaCapstoneMet(s, since);
  const goals = GA_CAPSTONE.map((r, i) => ({ label: r.chip, hit: metNow[i] }));
  const latched = useVisitGoals(ctx, goals);
  const allMet = latched.every(Boolean);

  const share = () => {
    const message = gaCapstoneSummary(platform, listening, latched);
    void shareLatch.run(async () => {
      try {
        await Share.share({ message });
        setShareNote(null);
      } catch (e) {
        // closing the share sheet is not a failure
        if ((e as { name?: string } | null)?.name === 'AbortError') return;
        setShareNote(Platform.OS === 'web' ? 'This browser cannot share text. The summary card on the page has the same words: select and copy them there.' : 'Sharing did not open on this device. The summary card on the page has the same words.');
      }
    });
  };

  const surface = SURFACE_WORD[surfaceOf(s, 'player')];
  const musicWord = !s.music.on ? 'OFF' : s.mood === 'alert' ? 'ALERT' : 'CALM';
  const reportKey: DockParam = {
    kind: 'group',
    id: 'report',
    label: 'REPORT',
    // a word of six letters or fewer: a longer value is cut in a six-key dock
    valueLabel: platform && listening ? 'CHOSEN' : 'CHOOSE',
    hideLane: true,
    valueA11y: `platform ${gaPlatform(platform)?.name ?? 'not chosen yet'}; listening setup ${gaListening(listening)?.label.toLowerCase() ?? 'not chosen yet'}`,
    render: () => <SummaryTray platform={platform} listening={listening} onPlatform={setPlatform} onListening={setListening} onShare={share} shareNote={shareNote} />,
  };
  const musicKey: DockParam = { kind: 'group', id: 'music', label: 'MUSIC', valueLabel: musicWord, valueA11y: `music ${musicWord.toLowerCase()}`, hideLane: true, render: () => <MusicTray onUse={() => setStrip('music')} /> };

  return (
    <GaRack
      spec={{
        keys: [moveKey(s), soundsKey(s, () => setStrip('mix')), musicKey, reportKey],
        // the strip follows the tray in use: MUSIC shows the bars, SOUNDS the bus meters
        hud: strip,
        show: { mood: true },
        initialParam: 'speed-generator-1',
        readouts: [
          { k: 'SURFACE', v: surface, vA11y: `you stand on ${surface.toLowerCase()}` },
          { k: 'MUSIC', v: musicWord, vA11y: `music ${musicWord.toLowerCase()}` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The courtyard and the workshop again, with every sound of this lab ready. Nothing runs until you start it.</Look>
        <P>This page adds no new idea. You connect the ideas you know into one scene. Events start the sounds. Switches, parameters and states change them.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Build one scene that shows all seven goals in step 4. Plan it first: which sound each goal needs, and what starts it. Any order works. Everything you need is in MOVE, SOUNDS and MUSIC.</Do>
        <P>MOVE and SOUNDS stay open while you choose. The slider changes to their control only when you close the tray.</P>
        <P>After each action, read the log.</P>
        <ActivityLog state={s} lines={8} only={LOG_KINDS} />
      </Step>
      <Step n={3}>
        <P>For each step, a GAME line names the surface and a START line names the take. The door starts two layers. Crossing the doorway prints one STATE line that begins ZONE.</P>
        <P>A guide line ducks the other buses: a MIX line begins DUCK on, then DUCK off. A music change waits for the next bar. The alarm has a sign in the picture, for a player who cannot hear it.</P>
        <Caption state={s} />
        <ActivityLog state={s} lines={5} only={MIX_KINDS} />
        <Note tone="mistake">Judging a scene by the keys you pressed. A key press is only a request. The log shows what the audio side did with it.</Note>
      </Step>
      <Step n={4}>
        <P>Each goal is marked done when it really happens in the scene, not when you press a key.</P>
        <GoalChips goals={goals} latched={latched} />
        <HintLine done={latched} />
        {allMet ? <Note tone="try">All seven are met. The scene is now a free-play sandbox: every control stays live.</Note> : null}
        <Do>Open REPORT. Choose a PLATFORM and a way of LISTENING. They change nothing in the sound.</Do>
        <SummaryCard platform={platform} listening={listening} done={latched} />
      </Step>
      <Step n={5}>
        <P>This check is optional: the seven goals complete this page.</P>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You pressed GUIDE LINE, but the music did not turn down. Where do you look first?"
          options={[
            'In the activity log: did the line start, and on which bus?',
            'At the master level, to turn everything up',
            'At the key, to press it again until it works',
            'At the music bus, to pull it down by hand and leave it there',
          ]}
          correct={0}
          explain="The log shows what the audio side did with the request. A line that started on the wrong bus, or was refused, explains a mix that did not duck."
          wrong={[
            undefined,
            'A higher master level makes everything louder together. Speech gets no more room than before.',
            'A key press is only a request. Pressing again does not show why the first request did not duck the mix.',
            'The music would then stay down after the line ended. Ducking turns it down only while the line speaks.',
          ]}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 11, gap: 3 },
  cardTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.4, marginBottom: 2 },
  cardHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.3, marginTop: 7 },
  cardItem: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  cardDetail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, paddingLeft: 10 },
  cardFoot: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, marginTop: 8 },
  narrow: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 4, paddingHorizontal: 0 },
  narrowOn: { borderColor: 'rgba(255,198,77,0.65)', backgroundColor: '#1a1409' },
  narrowText: { color: colors.textSecondary, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, lineHeight: 13, letterSpacing: 0, textAlign: 'center' },
  narrowTextOn: { color: colors.amber },
  reportTray: { gap: 6 },
  hint: { gap: 6 },
  hintText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  hintHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  hintBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: colors.amber, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  hintBtnText: { color: colors.amber, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.2 },
});

export const P22: PageDef = { title: 'Capstone and free play', short: 'CAPSTONE', Component: Page, manualDone: true, rack: true, guide: G22 };
