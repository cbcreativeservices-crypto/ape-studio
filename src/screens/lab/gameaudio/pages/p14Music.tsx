/**
 * Page 14 — ADAPTIVE MUSIC (Chapter 4, Music and voice).
 *
 * Three layers of one four-bar phrase at 96 BPM (CALM, PULSE, DRIVE) start
 * together on one clock; a layer that is off plays at zero level, which is
 * why the layers stay in time. The learner starts the music, adds and removes
 * a layer, changes the MOOD state (alert asks for PULSE and DRIVE), and
 * watches the request wait as PENDING for its boundary. Changing their mind
 * before the boundary WITHDRAWS the first request (the model's log line and
 * its `musicWithdrawn` fact): the newest request wins and the withdrawn one
 * never plays. A stinger waits for the same boundary: a half-beat swell, then
 * a hit that lands ON the line. One stinger waits at a time.
 *
 * WHAT IS SHOWN. The model's `music.layers` is the set ASKED for and
 * `music.applied` the set that SOUNDS (chcMusicVoice.musicRows reads both),
 * so nothing is drawn as heard a bar early. PENDING counts DOWN from the
 * model's due time (`music.pending.due`, `music.stinger.due`) and names a
 * waiting stinger too (chcMusicVoice.pendingShort / pendingLine).
 *
 * THE MUSIC TRAY stays open over the well and the log, so it carries what a
 * step tells the learner to watch: START / STOP and the two MOOD keys on the
 * first row (walk audit W2-03), the stinger and the layers on the second
 * (each chip says its state with ✓), and the PENDING line. It is built to fit
 * the tray's 196 points with the strip in place.
 *
 * WITH SOUND OFF the request still waits: the model counts the boundary in
 * scene time from the music's start, and the APPLIED line ends "(not heard:
 * sound is off)". Only the NOW boundary applies immediately. So every goal,
 * the change of mind and the stinger included, is reachable unheard.
 *
 * COUNTING (lead's decision 5). PLAYING counts a stinger while it sounds;
 * VOICES leaves all music out. The page says this scene simplifies, and that
 * a real engine counts each music layer as a voice.
 *
 * Common mistake taught against: starting several music files from separate
 * timers and expecting them to stay in time.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaFact, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { TrayChip, tray, useNowWhile, useRoseWhile } from './chcBits';
import { CHC_BOUNDARY_S, CHC_MUSIC_BARS, musicRows, musicWaiting, p14Log, pendingLine, pendingShort, type ChcBoundary, type ChcLayerState } from './data/chcMusicVoice';
import { G14 } from './guides/p14';
import { useSince } from './shared';

const ASSETS = ['mu_calm', 'mu_pulse', 'mu_drive', 'mu_stinger'] as const;
const TERMS = gaTerms('Adaptive music', 'Vertical layering', 'Horizontal resequencing', 'Bar-aligned transition', 'Music transition rule', 'Musical stinger', 'Music state');
const LAYERS = ['calm', 'pulse', 'drive'] as const;

const BOUNDARIES: { id: ChcBoundary; label: string; short: string; blurb: string }[] = [
  { id: 'now', label: 'NOW', short: 'NOW', blurb: 'No waiting: the change fades in immediately. It is the fastest choice, but it can land between beats.' },
  { id: 'beat', label: 'NEXT BEAT', short: 'BEAT', blurb: `The change waits for the next beat. At 96 BPM that is at most about ${CHC_BOUNDARY_S.beat.toFixed(1)} s.` },
  { id: 'bar', label: 'NEXT BAR', short: 'BAR', blurb: `The change waits for the next bar line. A bar of four beats at 96 BPM lasts ${CHC_BOUNDARY_S.bar} s.` },
  { id: 'phrase', label: 'NEXT PHRASE', short: 'PHRASE', blurb: `The change waits for the phrase to end. The phrase is four bars: ${CHC_BOUNDARY_S.phrase} s.` },
];

/** CHANGE AT stays open to compare, so the choice in force carries ✓ in its
 *  label (a highlight alone is not a state: walk audit W2-24). */
const boundaryKey = (s: GaState): DockParam => ({
  kind: 'options',
  id: 'boundary',
  label: 'CHANGE AT',
  valueLabel: BOUNDARIES.find((b) => b.id === s.options.musicBoundary)?.short ?? 'BAR',
  valueA11y: `changes land at: ${BOUNDARIES.find((b) => b.id === s.options.musicBoundary)?.label.toLowerCase() ?? 'next bar'}`,
  sticky: true,
  selectedId: s.options.musicBoundary,
  onSelect: (id) => {
    if (gaGet().options.musicBoundary !== id) gaDispatch({ type: 'option', patch: { musicBoundary: id as ChcBoundary } });
  },
  options: BOUNDARIES.map(({ id, label, blurb }) => ({ id, label: marked(label, s.options.musicBoundary === id), blurb })),
});

/** The MUSIC tray. Row 1: START or STOP, and the two MOOD keys (step 2 names
 *  MOOD ALERT, so it is never under the fold). Row 2: STINGER and the three
 *  layers, while the music runs. Then PENDING, counting down. */
function MusicTray() {
  const s = useGa();
  const t = useNowWhile(musicWaiting(s));
  const on = s.music.on;
  return (
    <View style={tray.tray}>
      <View style={tray.row}>
        <TrayChip label={on ? '■ STOP MUSIC' : '▶ START'} selected={on} onPress={() => gaDispatch({ type: on ? 'musicStop' : 'musicStart' })} />
        <TrayChip label={marked('MOOD CALM', s.mood === 'calm')} selected={s.mood === 'calm'} onPress={() => gaDispatch({ type: 'mood', mood: 'calm' })} />
        <TrayChip label={marked('MOOD ALERT', s.mood === 'alert')} selected={s.mood === 'alert'} onPress={() => gaDispatch({ type: 'mood', mood: 'alert' })} />
      </View>
      {on ? (
        <View style={tray.row}>
          <TrayChip label="STINGER" selected={!!s.music.stinger} onPress={() => gaDispatch({ type: 'stinger' })} />
          {LAYERS.map((l) => (
            <TrayChip key={l} label={marked(l.toUpperCase(), s.music.layers[l])} selected={s.music.layers[l]} onPress={() => gaDispatch({ type: 'musicLayer', layer: l, on: !gaGet().music.layers[l] })} />
          ))}
        </View>
      ) : (
        <Text style={tray.note}>Press START first. STINGER and the three layer keys appear while the music runs.</Text>
      )}
      <Text style={tray.status} accessibilityLiveRegion="polite">
        PENDING · {pendingLine(s, t)}
      </Text>
    </View>
  );
}

/** Read-only: the three layers on one four-bar clock, and what each is doing.
 *  A state is always a WORD and a pattern (filled / hollow / dashed), never a
 *  color alone. */
function LayerCard({ state: s, t }: { state: GaState; t: number }) {
  const rows = musicRows(s);
  const bars = Array.from({ length: CHC_MUSIC_BARS }, (_, i) => i);
  const cell = (st: ChcLayerState) => (st === 'heard' || st === 'going' ? styles.barOn : st === 'coming' ? styles.barWait : styles.barOff);
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Three music layers on one clock, 96 beats per minute, four bars. ${rows.map((r) => `${r.name}: ${r.word.toLowerCase()}`).join('. ')}. Pending: ${pendingLine(s, t)}`}
    >
      <Text style={styles.cardHead}>ONE CLOCK · 96 BPM · FOUR BARS</Text>
      {rows.map((r) => (
        <View key={r.layer} style={styles.lane}>
          <Text style={styles.laneName}>{r.name}</Text>
          <View style={styles.strip}>
            {bars.map((b) => (
              <View key={b} style={[styles.bar, cell(r.state)]} />
            ))}
          </View>
          <Text style={[styles.laneWord, (r.state === 'heard' || r.state === 'going') && { color: colors.programPurple }, (r.state === 'coming' || r.state === 'going') && { color: colors.amber }]}>{r.word}</Text>
        </View>
      ))}
      <View style={styles.lane}>
        <Text style={styles.laneName}> </Text>
        <View style={styles.strip}>
          {bars.map((b) => (
            <Text key={b} style={styles.barNum}>{`BAR ${b + 1}`}</Text>
          ))}
        </View>
        <Text style={styles.laneWord}> </Text>
      </View>
      <Text style={styles.cardNote}>PENDING · {pendingLine(s, t)}</Text>
    </View>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const t = useNowWhile(musicWaiting(s));
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);

  const layerAdds = gaFact(s, 'layer:calm:on') + gaFact(s, 'layer:pulse:on') + gaFact(s, 'layer:drive:on');
  const moods = gaFact(s, 'mood:alert') + gaFact(s, 'mood:calm');
  const addedLayer = useRoseWhile(layerAdds, s.music.on);
  const moodInMusic = useRoseWhile(moods, s.music.on);
  const goals = [
    { label: 'Add a layer while the music plays', hit: addedLayer },
    { label: 'Change MOOD while the music plays', hit: moodInMusic },
    { label: 'Change your mind while a change waits', hit: since('musicWithdrawn') > 0 },
    { label: 'Play a stinger on a boundary', hit: since('stingerPlayed') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const musicKey: DockParam = {
    kind: 'group',
    id: 'music',
    label: 'MUSIC',
    valueLabel: s.music.on ? 'ON' : 'OFF',
    valueA11y: `the music is ${s.music.on ? 'running' : 'stopped'}; mood ${s.mood}`,
    render: () => <MusicTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), musicKey, boundaryKey(s)],
        initialParam: 'master',
        hud: 'music',
        readouts: [
          { k: 'MUSIC', v: s.music.on ? 'RUNNING' : 'STOPPED', vA11y: `the music is ${s.music.on ? 'running' : 'stopped'}` },
          { k: 'PENDING', kNarrow: 'WAIT', v: pendingShort(s, t), vA11y: `pending: ${pendingLine(s, t)}` },
        ],
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The strip under the picture is the music’s clock, with a mark where a waiting change lands.</Look>
        <P>This piece is one four-bar phrase at 96 BPM (beats per minute) in three layers: CALM, PULSE and DRIVE. They start together on one clock. A layer that is off still plays, at zero level, so the layers stay in time.</P>
        <LayerCard state={s} t={t} />
        <P>Switching layers is vertical layering. Choosing which section plays next is horizontal resequencing. Both use music a composer wrote.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open MUSIC and press START. Switch PULSE on and watch PENDING in the tray until it reads “Nothing is waiting.” Switch PULSE off and wait again. Then press MOOD ALERT.</Do>
        <P>Each change waits as PENDING for the next bar: the log says QUEUED, then APPLIED. MOOD is a game state. ALERT asks for PULSE and DRIVE.</P>
        <P>PLAYING counts a stinger while it sounds. VOICES leaves the music out: this scene simplifies. A real engine counts each music layer as a voice.</P>
        <ActivityLog state={p14Log(s)} lines={6} empty="No music line yet. This log shows the music, MOOD and CHANGE AT." />
      </Step>
      <Step n={3}>
        <Do>Set CHANGE AT to NEXT PHRASE. Press MOOD CALM, then MOOD ALERT again before the phrase ends. Then press STINGER.</Do>
        <P>The log says the first request is WITHDRAWN. The newest request wins, so a transition rule must cover a change of mind.</P>
        <P>A stinger is a short phrase played once over the music. Here a half-beat swell leads to a hit on the boundary.</P>
        <Note tone="mistake">Starting music files from separate timers and expecting them to stay in time. Timers are not exact, so the files start slightly apart.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The music waits for the next bar. The game asks for ALERT, then asks for CALM before the bar arrives. What plays at the bar in this scene?"
          options={['CALM only: the ALERT request was withdrawn', 'ALERT for one bar, then CALM at the bar after it', 'Both requests, one after the other', 'Nothing: withdrawing a request stops the music']}
          correct={0}
          explain="The newest request wins. The waiting ALERT change is withdrawn, so PULSE and DRIVE stay at zero level and the music goes on in time."
          wrong={[
            undefined,
            'A withdrawn request is removed, not postponed. If it still played for a bar, the music would follow a decision the game had already dropped.',
            'Only one change can wait here. The second request replaces the first.',
            'Withdrawing a change does not stop the music. All three layers keep running on the same clock.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', padding: 10, gap: 7 },
  cardHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  lane: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  laneName: { width: 44, color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.8 },
  strip: { flex: 1, flexDirection: 'row', gap: 3 },
  bar: { flex: 1, height: 16, borderRadius: 4, borderWidth: 1 },
  barOn: { backgroundColor: 'rgba(196,162,255,0.55)', borderColor: colors.programPurple },
  barOff: { backgroundColor: 'transparent', borderColor: '#34343c' },
  barWait: { backgroundColor: 'rgba(255,198,77,0.12)', borderColor: colors.amber, borderStyle: 'dashed' },
  barNum: { flex: 1, textAlign: 'center', color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.6 },
  laneWord: { width: 92, color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.6, lineHeight: 13 },
  cardNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});

export const P14: PageDef = { title: 'Adaptive music', short: 'MUSIC', Component: Page, manualDone: true, rack: true, guide: G14 };
