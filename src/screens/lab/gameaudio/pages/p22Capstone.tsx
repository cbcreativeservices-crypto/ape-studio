/**
 * Page 22 — CAPSTONE AND FREE PLAY (chapter 6, "Into the real tools").
 *
 * No new idea: the student wires ONE scene from the ideas of the whole
 * lab. Seven requirements (data/gaCapstone), each judged from the model's
 * facts and state during this visit, never from a key press:
 *
 *   footsteps on two surfaces with two takes on one · the generator running
 *   with its speed changed as it played · one zone crossing with the beds
 *   running · a door event that played its rattle layer · a guide line that
 *   ducked the mix · one music change applied on a bar · the overheat alarm
 *   running with its visual cue on
 *
 * THE DOCK gives the whole scene in three keys, each a tray:
 *   MOVE    STEP FORWARD and three places; its slider is which way you face
 *   WORLD   door, scene, generator 1, guide line, alarm, visual cue, CLEAN
 *           SCENE;
 *           its slider is the generator's SPEED (the page's teaching control)
 *   MUSIC   start and stop, mood, layers, stinger
 * and a fourth key for the record, which changes nothing in the sound:
 *   SETUP   a PLATFORM and a LISTENING setup (page 3's lists), one test for
 *           each, and SHARE SUMMARY. (The key was SUMMARY; that word was
 *           cut in a six-key dock at 390 wide, visual review 2026-11-12.)
 * The MUSIC and SETUP trays have no use for the slider, so the lane steps
 * aside while they are open (`hideLane`): in full screen the dock then
 * rises less far over the picture.
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
 */
import { useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import { useInFlightLatch } from '../../../../lib/latch';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { LabChip } from '../../LabShell';
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
import { Tray, TrayNote, TrayRow, useCapstoneVisit } from './cheKit';
import { GA_CAPSTONE, GA_SUMMARY_TITLE, gaCapstoneMet, gaCapstoneSummary, gaCapstoneSummaryLines, gaListeningTest, gaPlatformTest } from './data/gaCapstone';
import { GA_LISTENING, GA_PLATFORMS, gaListening, gaPlatform, type GaListeningId, type GaPlatformId } from './data/gaPlatforms';
import { G22 } from './guides/p22';
import { facingKey, speedKey } from './shared';

/** Every sound the whole scene can play: the capstone uses them all. */
const ASSETS: readonly string[] = [
  ...GA_ASSETS.filter((a) => a.id.startsWith('fs_')).map((a) => a.id),
  'door', 'door_rattle', 'gen_hum', 'gen_air', 'fountain', 'amb_room', 'amb_yard', 'alarm', 'vo_greeting', 'vo_greeting_long', 'mu_calm', 'mu_pulse', 'mu_drive', 'mu_stinger', 'ir_room',
];
const TERMS = gaTerms('Audio event (game)', 'Game Syncs', 'Dynamic mixing', 'Adaptive music');

const onOff = (label: string, on: boolean): string => `${label} · ${on ? 'ON' : 'OFF'}`;
const sceneOn = (s: GaState): boolean => gaPlaying(s, 'bed_room') || gaPlaying(s, 'bed_yard');
const alarmOn = (s: GaState): boolean => gaPlaying(s, 'alarm');
const SURFACE_WORD = { wood: 'WOOD', stone: 'STONE', gravel: 'GRAVEL' } as const;
/** Two logs, each showing the lines its step talks about (a step prints
 *  four lines, and moving SPEED prints many: unfiltered, they push the
 *  ZONE line and the DUCK line out of view). Step 2: what the game asked
 *  and what started, with the ZONE line. Step 3: the mix and the music. */
const LOG_KINDS = ['trigger', 'start', 'state', 'refused', 'failed'] as const;
const MIX_KINDS = ['mix', 'music', 'refused', 'failed'] as const;

/* ── MOVE: places to go without walking every step ──────────────────────── */

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
const withTray = (base: DockParam, label: string, chooser: Chooser): DockParam => (base.kind === 'fader' ? { ...base, label, chooser } : base);

const moveKey = (s: GaState): DockParam =>
  withTray(facingKey(s), 'MOVE', {
    title: 'MOVE · SLIDER = FACING',
    sticky: true,
    selectedId: null,
    options: [{ id: 'step', label: 'STEP FORWARD' }, ...(Object.keys(SPOTS) as Spot[]).map((id) => ({ id, label: crosses(s, id) && !s.doorOpen ? `${SPOT_LABEL[id]} · DOOR IS CLOSED` : SPOT_LABEL[id] }))],
    onSelect: (id) => (id === 'step' ? gaDispatch({ type: 'step', who: 'player' }) : goTo(id as Spot)),
  });

/* ── WORLD: the scene's sounds; the slider is the generator's speed ─────── */

const worldKey = (s: GaState): DockParam => {
  const generatorOn = !!s.machines[0]?.on;
  return withTray(speedKey(s), 'WORLD', {
    title: 'WORLD · SLIDER = GENERATOR SPEED',
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
      const now = gaGet();
      if (id === 'door') gaDispatch({ type: 'door' });
      else if (id === 'scene') gaDispatch({ type: 'scene', on: !sceneOn(now) });
      else if (id === 'generator') gaDispatch({ type: 'machine', id: 'generator-1', on: !now.machines[0]?.on });
      else if (id === 'line') gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' });
      else if (id === 'alarm') gaDispatch({ type: 'alarm', on: !alarmOn(now) });
      else if (id === 'cue') gaDispatch({ type: 'option', patch: { visualCue: !now.options.visualCue } });
    },
    onReset: { label: 'CLEAN SCENE', onPress: gaResetScene },
  });
};

/* ── MUSIC ──────────────────────────────────────────────────────────────── */

function MusicTray() {
  const s = useGa();
  const m = s.music;
  const waiting = m.pending ? `Waiting: ${m.pending.what}, for the next ${m.pending.boundary === 'now' ? 'moment' : m.pending.boundary}.` : m.on ? 'Nothing is waiting.' : 'Start the music first. A change needs a running bar to land on.';
  return (
    <Tray>
      <TrayRow head="MUSIC (three layers on one clock)">
        <LabChip label={onOff('MUSIC', m.on)} selected={m.on} onPress={() => gaDispatch({ type: gaGet().music.on ? 'musicStop' : 'musicStart' })} />
        <LabChip label="STINGER" selected={false} onPress={() => gaDispatch({ type: 'stinger' })} />
      </TrayRow>
      <TrayRow head="MOOD (a state for the whole game)">
        <LabChip label={marked('CALM', s.mood === 'calm')} selected={s.mood === 'calm'} onPress={() => gaDispatch({ type: 'mood', mood: 'calm' })} />
        <LabChip label={marked('ALERT', s.mood === 'alert')} selected={s.mood === 'alert'} onPress={() => gaDispatch({ type: 'mood', mood: 'alert' })} />
      </TrayRow>
      <TrayRow head="LAYERS (each change waits for the bar)">
        <LabChip label={onOff('PULSE', m.layers.pulse)} selected={m.layers.pulse} onPress={() => gaDispatch({ type: 'musicLayer', layer: 'pulse', on: !gaGet().music.layers.pulse })} />
        <LabChip label={onOff('DRIVE', m.layers.drive)} selected={m.layers.drive} onPress={() => gaDispatch({ type: 'musicLayer', layer: 'drive', on: !gaGet().music.layers.drive })} />
      </TrayRow>
      <TrayNote>{waiting}</TrayNote>
    </Tray>
  );
}

/* ── SETUP: the two choices, one test for each, and the share key ───────── */

type SummaryProps = {
  platform: GaPlatformId | null;
  listening: GaListeningId | null;
  onPlatform: (id: GaPlatformId) => void;
  onListening: (id: GaListeningId) => void;
  onShare: () => void;
  shareNote: string | null;
};

function SummaryTray({ platform, listening, onPlatform, onListening, onShare, shareNote }: SummaryProps) {
  // in full screen the share sheet opens after the rack has left full screen
  const leaveFull = useRackLeaveFull();
  const pTest = gaPlatformTest(platform);
  const lTest = gaListeningTest(listening);
  return (
    <Tray>
      <TrayRow head="PLATFORM (for your summary; it changes no sound)">
        {GA_PLATFORMS.map((p) => (
          <LabChip key={p.id} label={marked(p.label, platform === p.id)} selected={platform === p.id} onPress={() => onPlatform(p.id)} />
        ))}
      </TrayRow>
      {pTest ? <TrayNote>{`One test: ${pTest}`}</TrayNote> : null}
      <TrayRow head="LISTENING (for your summary; it changes no sound)">
        {GA_LISTENING.map((l) => (
          <LabChip key={l.id} label={marked(l.label, listening === l.id)} selected={listening === l.id} onPress={() => onListening(l.id)} />
        ))}
      </TrayRow>
      {lTest ? <TrayNote>{`One test: ${lTest}`}</TrayNote> : null}
      <TrayRow head="YOUR LEARNING SUMMARY, AS PLAIN TEXT">
        <LabChip label="SHARE SUMMARY" selected={false} onPress={() => (leaveFull ? leaveFull(onShare) : onShare())} />
      </TrayRow>
      {shareNote ? <TrayNote>{shareNote}</TrayNote> : null}
    </Tray>
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
  const setupKey: DockParam = {
    kind: 'group',
    id: 'setup',
    label: 'SETUP',
    // a word of six letters or fewer: a longer value is cut in a six-key dock
    valueLabel: platform && listening ? 'CHOSEN' : 'CHOOSE',
    hideLane: true,
    valueA11y: `platform ${gaPlatform(platform)?.name ?? 'not chosen yet'}; listening setup ${gaListening(listening)?.label.toLowerCase() ?? 'not chosen yet'}`,
    render: () => <SummaryTray platform={platform} listening={listening} onPlatform={setPlatform} onListening={setListening} onShare={share} shareNote={shareNote} />,
  };
  const musicKey: DockParam = { kind: 'group', id: 'music', label: 'MUSIC', valueLabel: musicWord, valueA11y: `music ${musicWord.toLowerCase()}`, hideLane: true, render: () => <MusicTray /> };

  return (
    <GaRack
      spec={{
        keys: [moveKey(s), worldKey(s), musicKey, setupKey],
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
        <P>This page adds no new idea. You connect the ideas you know into one scene. Events start the sounds. Game Syncs change them. The mix turns other sounds down for speech. The music follows the game.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open WORLD, switch SCENE on and press OPEN DOOR. Then open MOVE and press STEP FORWARD until you are inside the workshop.</Do>
        <P>Then read the log. For each step, a GAME line names the surface and a START line names the take. The door starts two layers. The doorway prints one ZONE line.</P>
        <ActivityLog state={s} lines={8} only={LOG_KINDS} />
      </Step>
      <Step n={3}>
        <Do>In WORLD, switch GENERATOR 1, ALARM and VISUAL CUE on and press GUIDE LINE. Close the tray and move the slider: it now shows GENERATOR 1. In MUSIC, switch MUSIC on and choose ALERT.</Do>
        <P>The line turns the other buses down while it speaks: the log prints DUCK on, then DUCK off. The music change waits for the next bar. The alarm now has a sign in the picture, for a player who cannot hear it.</P>
        <Caption state={s} />
        <ActivityLog state={s} lines={5} only={MIX_KINDS} />
        <Note tone="mistake">Judging a scene by the keys you pressed. A key press is only a request. The log shows what the audio side did with it.</Note>
      </Step>
      <Step n={4}>
        <P>Seven goals. Each one is marked done when it really happens in the scene, not when you press a key.</P>
        <GoalChips goals={goals} latched={latched} />
        {allMet ? <Note tone="try">All seven are met. The scene is now a free-play sandbox: every control stays live.</Note> : null}
        <Do>Open SETUP. Choose a PLATFORM and a way of LISTENING. They change nothing in the sound.</Do>
        <SummaryCard platform={platform} listening={listening} done={latched} />
      </Step>
      <Step n={5}>
        <P>This check is optional. The seven goals are what this page counts.</P>
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
});

export const P22: PageDef = { title: 'Capstone and free play', short: 'CAPSTONE', Component: Page, manualDone: true, rack: true, guide: G22 };
