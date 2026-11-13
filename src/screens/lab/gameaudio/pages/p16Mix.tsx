/**
 * Page 16 — THE GAME MIX (plan page 16; handoff lesson 14).
 *
 * Every sound feeds a category bus; a bus has its own fader, mute and solo;
 * the mix changes while the game runs. The learner fills the scene, plays
 * the guide's line and watches the DUCK readout go to DUCKING and back,
 * compares with the duck switched off, moves one bus, and gives the
 * overheat alarm a visual equivalent.
 *
 * Said plainly here: this duck is EVENT-DRIVEN (it starts when a line starts
 * and ends when the last line ends); it does not listen to the audio level,
 * which would be sidechain detection. The SIGNAL PATH card draws the audio
 * path and the control path differently: a duck is a control change and
 * carries no audio.
 *
 * ONE NAME FOR EACH BUS: the model's (data/gaMix, `GA_BUS_NAME`), on the
 * chooser, the MIX tray and in the log. THE TRAYS FIT (chdKit): two rows of
 * chips each, and what a press did is read on the DUCK and bus readouts
 * above them, which a tray does not cover.
 *
 * Common mistake taught against: solving every audibility problem by
 * raising the master.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Caption, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import type { GaBus } from '../engine/gaEngineProtocol';
import { gaTerms } from '../gaTerms';
import { gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { InfoCard, Tray, TrayChip, TrayGrid, onOff, speaking } from './chdKit';
import { BUS_LANE_HOME, MIX_BUSES, SIGNAL_PATH, busNowSpoken, busNowWord, dbToLane, duckWords, fmtDb, laneToDb, lineSpeaking, mixBus, signalPathSpoken } from './data/gaMix';
import { G16 } from './guides/p16';
import { useSince } from './shared';

const ASSETS = ['amb_room', 'amb_yard', 'fountain', 'gen_hum', 'gen_air', 'mu_calm', 'mu_pulse', 'mu_drive', 'vo_greeting', 'vo_greeting_long', 'vo_chat', 'alarm'] as const;
const TERMS = gaTerms('Audio Bus (Game Audio)', 'Ducking', 'Snapshot (Game Mix State)', 'Dynamic mixing', 'Headroom');
const DUCK_WORDS = duckWords();

const sceneOn = (s: GaState): boolean => gaPlaying(s, 'bed_room') || gaPlaying(s, 'bed_yard') || gaPlaying(s, 'fountain');
const alarmOn = (s: GaState): boolean => gaPlaying(s, 'alarm');

/** SOUNDS tray: everything that makes the scene busy, then the two spoken
 *  lines and the alarm with its visual cue. Two rows (chdKit: a tray is
 *  designed for 200 points). Nothing appears in the tray while a line
 *  speaks: a caption there grew the tray upward and moved every chip under
 *  the learner's finger (seen at 390 x 844). The chip says SPEAKING, DUCK
 *  says DUCKING, and the caption is in the well. */
function SoundsTray() {
  const s = useGa();
  const gen = !!s.machines[0]?.on;
  return (
    <Tray>
      <TrayGrid head="BUILD A BUSY SCENE" cols={3}>
        <TrayChip label={onOff('SCENE', sceneOn(s))} selected={sceneOn(s)} onPress={() => gaDispatch({ type: 'scene', on: !sceneOn(gaGet()) })} />
        <TrayChip label={onOff('GENERATOR 1', gen)} selected={gen} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gaGet().machines[0]?.on })} />
        <TrayChip label={onOff('MUSIC', s.music.on)} selected={s.music.on} onPress={() => gaDispatch({ type: gaGet().music.on ? 'musicStop' : 'musicStart' })} />
      </TrayGrid>
      <TrayGrid head="SPEECH · AN IMPORTANT SOUND" cols={4}>
        <TrayChip label={speaking('GUIDE LINE', gaPlaying(s, 'vo_greeting'))} selected={gaPlaying(s, 'vo_greeting')} onPress={() => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' })} />
        <TrayChip label={speaking('CHAT LINE', gaPlaying(s, 'chat'))} selected={gaPlaying(s, 'chat')} onPress={() => gaDispatch({ type: 'post', event: 'chat' })} />
        <TrayChip label={onOff('ALARM', alarmOn(s))} selected={alarmOn(s)} onPress={() => gaDispatch({ type: 'alarm', on: !alarmOn(gaGet()) })} />
        <TrayChip label={onOff('VISUAL CUE', s.options.visualCue)} selected={s.options.visualCue} onPress={() => gaDispatch({ type: 'option', patch: { visualCue: !gaGet().options.visualCue } })} />
      </TrayGrid>
    </Tray>
  );
}

/** MIX tray: the duck's switch, and MUTE and SOLO for every bus (two rows
 *  of three buses, each with its own two chips). The one heading is the
 *  page's explanation of MUTE and SOLO. No log strip: the DUCK readout and
 *  the bus readout above the tray answer every press. */
function MixTray() {
  const s = useGa();
  return (
    <Tray>
      <TrayGrid cols={2}>
        <TrayChip label={marked('DUCK ON', s.options.duck)} selected={s.options.duck} onPress={() => gaDispatch({ type: 'option', patch: { duck: true } })} />
        <TrayChip label={marked('DUCK OFF', !s.options.duck)} selected={!s.options.duck} onPress={() => gaDispatch({ type: 'option', patch: { duck: false } })} />
      </TrayGrid>
      <TrayGrid head="MUTE SILENCES A BUS · SOLO SILENCES THE OTHERS" cols={3}>
        {MIX_BUSES.map((b) => {
          const st = s.bus[b.id];
          const name = b.label.toLowerCase();
          return (
            <View key={b.id} style={styles.busCell}>
              <Text style={styles.busName}>{b.label}</Text>
              <View style={styles.busPair}>
                <View style={styles.busHalf}>
                  <TrayChip label={marked('MUTE', st.mute)} a11y={`Mute the ${name} bus: ${st.mute ? 'on' : 'off'}`} selected={st.mute} onPress={() => gaDispatch({ type: 'bus', bus: b.id, mute: !gaGet().bus[b.id].mute })} />
                </View>
                <View style={styles.busHalf}>
                  <TrayChip label={marked('SOLO', st.solo)} a11y={`Solo the ${name} bus: ${st.solo ? 'on' : 'off'}`} selected={st.solo} onPress={() => gaDispatch({ type: 'bus', bus: b.id, solo: !gaGet().bus[b.id].solo })} />
                </View>
              </View>
            </View>
          );
        })}
      </TrayGrid>
    </Tray>
  );
}

/** SIGNAL PATH: the audio path and the control path, drawn differently
 *  (solid boxes joined by a solid line; dashed boxes joined by a dashed
 *  line) and named in words. Read-only. */
function SignalPath() {
  return (
    <InfoCard head="SIGNAL PATH" a11y={signalPathSpoken()}>
      <View style={styles.pathRow}>
        <Text style={styles.pathName}>AUDIO</Text>
        <View style={styles.pathFlow}>
          {SIGNAL_PATH.audio.map((step, i) => (
            <View key={step} style={styles.pathStep}>
              {i > 0 ? <View style={styles.wireSolid} /> : null}
              {i > 0 ? <Text style={styles.arrowSolid}>▶</Text> : null}
              <View style={styles.boxSolid}>
                <Text style={styles.boxText}>{step}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.pathRow}>
        <Text style={styles.pathName}>CONTROL</Text>
        <View style={styles.pathFlow}>
          <View style={styles.boxDashed}>
            <Text style={styles.boxText}>{SIGNAL_PATH.controlFrom}</Text>
          </View>
          <View style={styles.wireDashed}>
            <View style={styles.dash} />
            <View style={styles.dash} />
          </View>
          <Text style={styles.arrowDashed}>▷</Text>
          <View style={[styles.boxDashed, styles.boxWide]}>
            <Text style={styles.boxText}>{SIGNAL_PATH.control.join(' · ')}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.pathNote}>The solid row is sound. The dashed row is the game telling that path what to do: it carries no audio. A duck travels on the dashed row.</Text>
    </InfoCard>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since, kinds } = useSince(s);
  const [sel, setSel] = useState<GaBus>('music');
  const [check, setCheck] = useState(false);
  const bus = mixBus(sel);
  const running = [sceneOn(s), !!s.machines[0]?.on, s.music.on, alarmOn(s)].filter(Boolean).length;

  const goals = [
    { label: 'Play a line that ducks the mix', hit: since('duck') > 0 },
    { label: 'Play a line with DUCK off', hit: !s.options.duck && lineSpeaking(s) && since('option:duck:false') > 0 },
    { label: 'Change one bus: fader, MUTE or SOLO', hit: kinds('bus:') > 0 },
    { label: 'Show the VISUAL CUE while the alarm runs', hit: s.options.visualCue && alarmOn(s) && since('option:visualCue:true') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const busKey: DockParam = {
    kind: 'fader',
    id: 'bus',
    label: 'BUS',
    value: dbToLane(s.bus[sel].db),
    home: BUS_LANE_HOME,
    level: true,
    onChange: (v) => {
      const db = laneToDb(v);
      if (db !== Math.round(gaGet().bus[sel].db)) gaDispatch({ type: 'bus', bus: sel, db });
    },
    // the lane prints the level alone: a longer text ("MUSIC BUS 0 dB") lay
    // on the knob at 0 dB, where the knob rests (walk audit W2-25). Which bus
    // it is stands in the readout above and in the chooser.
    format: (v) => fmtDb(laneToDb(v)),
    formatShort: (v) => fmtDb(laneToDb(v)),
    chooser: {
      title: 'BUS FADER: CHOOSE A BUS',
      options: MIX_BUSES.map((b) => ({ id: b.id, label: b.label, blurb: b.carries })),
      selectedId: sel,
      onSelect: (id) => setSel(id as GaBus),
    },
  };
  // SOUNDS, as on page 17: the tray holds a chip named SCENE, so the key
  // itself is not called SCENE (learning audit, one name for each thing)
  const soundsKey: DockParam = {
    kind: 'group',
    id: 'sounds',
    label: 'SOUNDS',
    valueLabel: running ? `${running} ON` : 'QUIET',
    valueA11y: running ? `${running} sound ${running === 1 ? 'source' : 'sources'} switched on` : 'nothing switched on',
    render: () => <SoundsTray />,
  };
  const mixKey: DockParam = {
    kind: 'group',
    id: 'mix',
    label: 'MIX',
    // seven letters: 'DUCK OFF' was cut to "DUCK O…" on the key at 390 pt
    valueLabel: s.options.duck ? 'DUCK ON' : 'NO DUCK',
    valueA11y: s.options.duck ? 'the duck under speech is switched on' : 'the duck under speech is switched off',
    render: () => <MixTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [busKey, soundsKey, mixKey],
        initialParam: 'bus',
        hud: 'mix',
        // the strip marks the bus the BUS key has chosen (scene/hud cMix)
        hudArg: sel,
        readouts: [
          { k: 'DUCK', v: !s.options.duck ? 'OFF' : lineSpeaking(s) ? 'DUCKING' : 'READY', vA11y: !s.options.duck ? 'the duck is switched off' : lineSpeaking(s) ? 'a line is speaking and the mix is ducked' : 'the duck is ready and no line is speaking' },
          { k: bus.readout, v: busNowWord(s, sel), vA11y: busNowSpoken(s, sel) },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>On this page you fill the scene with sound. DUCK, under the picture, shows whether the mix is turning other sounds down for speech.</Look>
        <P>Every sound is sent to a bus: a group channel. This scene has six: ambience, effects, dialogue, music, interface and chat. Each sound has its own level, each bus has a fader, and the master comes last.</P>
        <P>Headroom is the space between the usual level and the loudest level that still plays cleanly.</P>
        <SignalPath />
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open SOUNDS and switch on SCENE, GENERATOR 1 and MUSIC. Press GUIDE LINE and watch DUCK: DUCKING, then READY. Then press CHAT LINE.</Do>
        <P>While the guide speaks, the mix turns down {DUCK_WORDS}. The log prints DUCK on and DUCK off. The chat line is not on the dialogue bus, so it ducks nothing.</P>
        <P>This duck is event-driven: it starts and ends with the line, not with the audio level.</P>
        <Caption state={s} />
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>In MIX, choose DUCK OFF. In SOUNDS, press GUIDE LINE again.</Do>
        <P>DUCK reads OFF, and nothing turns down.</P>
        <Do>Tap BUS, choose a bus and move its fader. In MIX, try MUTE and SOLO.</Do>
        <P>A bus fader changes only its own group. A quiet bus still plays. A silenced source keeps one still, dashed ring.</P>
        <Do>In SOUNDS, switch ALARM on, then VISUAL CUE.</Do>
        <P>A warning sign appears by the generator: it does not depend on hearing.</P>
        <Note tone="mistake">Solving every audibility problem by raising the master. That raises everything equally, so the balance stays and the headroom shrinks. Often, turning other things down is better.</Note>
      </Step>
      <Step n={4}>
        <P>Each goal is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The guide’s line is hard to hear over the music and the machines. Which change makes the line clear and keeps the headroom?"
          options={[
            'Turn the other buses down during the line',
            'Raise the master level until the line is clear',
            'Raise the dialogue bus as far as it goes',
            'Solo the dialogue bus for the rest of the game',
          ]}
          correct={0}
          explain="Turning the other buses down while a line plays changes the balance in favor of speech and uses no extra headroom. That is what the duck does."
          wrong={[
            undefined,
            'The master raises everything together. The line is still covered by the same sounds, and there is less headroom than before.',
            'This uses up the space above the usual level, so a loud moment may distort.',
            'Solo is for checking one bus. It would silence the music, the world and the alarm, which the player also needs.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  busCell: { gap: 2 },
  busName: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10.5, lineHeight: 12, letterSpacing: 1, textAlign: 'center' },
  busPair: { flexDirection: 'row', gap: 4 },
  busHalf: { flex: 1 },
  pathRow: { gap: 4 },
  pathName: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  pathFlow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  pathStep: { flexDirection: 'row', alignItems: 'center' },
  boxSolid: { borderRadius: 6, borderWidth: 1.5, borderColor: colors.green, backgroundColor: '#0f2416', paddingHorizontal: 7, paddingVertical: 5 },
  boxDashed: { borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.amber, paddingHorizontal: 7, paddingVertical: 5 },
  boxWide: { flexShrink: 1 },
  boxText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16 },
  wireSolid: { width: 8, height: 2, backgroundColor: colors.green },
  arrowSolid: { color: colors.green, fontSize: 10, marginRight: 2 },
  wireDashed: { flexDirection: 'row', gap: 2, marginLeft: 3 },
  dash: { width: 4, height: 2, backgroundColor: colors.amber },
  arrowDashed: { color: colors.amber, fontSize: 10, marginRight: 2 },
  pathNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});

export const P16: PageDef = { title: 'The game mix', short: 'MIX', Component: Page, manualDone: true, rack: true, guide: G16 };
