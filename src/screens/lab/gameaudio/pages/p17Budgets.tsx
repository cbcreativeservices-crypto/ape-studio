/**
 * Page 17 — BUDGETS AND VOICE LIMITS (plan page 17; handoff lesson 15).
 *
 * Voices, memory and processing time are related but different resources.
 * The learner sets a voice budget, posts a burst of twelve crate impacts,
 * and reads on the LAST BURST card whose voices were taken, in order, and
 * what became of each; starts the protected alarm and bursts again; then
 * lowers the budget to 1 so that every new impact is REFUSED.
 *
 * THE BUDGET SWITCHES NOTHING OFF (lead's decision 4, accuracy audit A2).
 * A stolen one-shot stops. A stolen LOOP becomes virtual (tracked, silent)
 * and comes back when a voice is free, so GENERATOR 1 and SCENE stay ON
 * through a burst. A new loop that finds no voice starts virtual.
 *
 * WHAT IS COUNTED IS SAID (decision 5, A5): this scene counts a loop at zero
 * level as a voice and leaves the music out; a real engine counts the music
 * and usually makes a silent loop virtual.
 *
 * The voice rule is stated exactly as model/gaModel applies it, and said to
 * be this lab's teaching rule. STOLEN counts voices taken by a NEW sound; a
 * voice given up because BUDGET was lowered is not a theft and is not in
 * that count. The model keeps the budget at or above the protected voices
 * sounding (the guide says so and gives the experiment). The MEMORY card
 * prints only exact arithmetic (samples × 4 bytes × channels, with each
 * sound's own samples per second). There is no processing figure on this
 * page: the lab does not measure one.
 *
 * Common mistake taught against: reading every number as a measurement.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { runSoon } from '../../../../lib/afterInteractions';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { footstepId, gaAsset, gaSound } from '../sounds/gaSoundBank';
import { FOOTSTEP_TAKES, GA_SURFACES } from '../sounds/gaSynth';
import { InfoCard, Tray, TrayChip, TrayGrid, onOff, speaking } from './chdKit';
import { BURST_COUNT, MEMORY_IDS, budgetHeld, budgetShort, budgetStep, budgetToLane, budgetWords, burstSpoken, burstTheftWords, fmtInt, laneToBudget, lastBurst, memoryRow, memoryRowSpoken, type MemoryRow } from './data/gaBudget';
import { G17 } from './guides/p17';
import { useSince } from './shared';

const ASSETS: readonly string[] = [
  'impact',
  'alarm',
  'vo_warning',
  'amb_room',
  'amb_yard',
  'fountain',
  'gen_hum',
  'gen_air',
  ...GA_SURFACES.flatMap((surface) => Array.from({ length: FOOTSTEP_TAKES }, (_, take) => footstepId(surface, take))),
];
const TERMS = gaTerms('Playback limit', 'Playback priority', 'Virtual voice', 'Voice Stealing', 'Audio memory budget', 'Audio CPU budget');

const sceneOn = (s: GaState): boolean => gaPlaying(s, 'bed_room') || gaPlaying(s, 'bed_yard') || gaPlaying(s, 'fountain');
const alarmOn = (s: GaState): boolean => gaPlaying(s, 'alarm');

/** SOUNDS tray: what fills the voices before a burst, least important
 *  first. Two rows (chdKit); VOICES, STOLEN and REFUSED above the tray and
 *  the strip say what each press did. Nothing is added to the tray while a
 *  line speaks, so no chip moves under a finger. */
function SoundsTray() {
  const s = useGa();
  const gen = !!s.machines[0]?.on;
  return (
    <Tray>
      <TrayGrid head="LESS IMPORTANT THAN AN IMPACT" cols={3}>
        <TrayChip label={onOff('SCENE', sceneOn(s))} selected={sceneOn(s)} onPress={() => gaDispatch({ type: 'scene', on: !sceneOn(gaGet()) })} />
        <TrayChip label={onOff('GENERATOR 1', gen)} selected={gen} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gaGet().machines[0]?.on })} />
        <TrayChip label="STEP" onPress={() => gaDispatch({ type: 'step', who: 'player' })} />
      </TrayGrid>
      <TrayGrid head="PROTECTED: THEIR VOICE IS NOT TAKEN" cols={3}>
        <TrayChip label={onOff('ALARM', alarmOn(s))} selected={alarmOn(s)} onPress={() => gaDispatch({ type: 'alarm', on: !alarmOn(gaGet()) })} />
        <TrayChip label={speaking('WARNING LINE', gaPlaying(s, 'vo_warning'))} selected={gaPlaying(s, 'vo_warning')} onPress={() => gaDispatch({ type: 'post', event: 'vo_warning', owner: 'guide' })} />
      </TrayGrid>
    </Tray>
  );
}

/** The three sounds' decoded sizes, worked out after the page has drawn (a
 *  sound that was never played has to be made first). */
function useMemoryRows(): MemoryRow[] | null {
  const [rows, setRows] = useState<MemoryRow[] | null>(null);
  useEffect(() => {
    const h = runSoon(
      () => {
        const out: MemoryRow[] = [];
        for (const id of MEMORY_IDS) {
          const a = gaAsset(id);
          const sound = gaSound(id);
          if (a && sound) out.push(memoryRow(id, a.label, a.file, sound));
        }
        setRows(out);
      },
      { idleTimeoutMs: 800 },
    );
    return () => h.cancel();
  }, []);
  return rows;
}

function MemoryCard() {
  const rows = useMemoryRows();
  return (
    <InfoCard
      head="MEMORY · THREE SOUNDS, DECODED"
      a11y={`Memory: the decoded size of three sounds. ${rows ? rows.map(memoryRowSpoken).join(' ') : 'The sizes are being worked out.'} This lab keeps each sample as a 32-bit number, 4 bytes.`}
    >
      {rows ? (
        rows.map((r) => (
          <View key={r.id} style={styles.memRow}>
            <Text style={styles.memName}>
              {r.label} · {r.seconds} s at {fmtInt(r.sr)} samples per second
            </Text>
            <Text style={styles.memSum}>{r.sum}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.memNote}>Working out the three sizes…</Text>
      )}
      <Text style={styles.memNote}>This lab keeps each sample as a 32-bit number, which is 4 bytes. One second of one channel at 48,000 samples per second is 48,000 × 4 = 192,000 bytes.</Text>
      <Text style={styles.memNote}>A real game often keeps a sound compressed in memory and decodes it while it plays: less memory, more processing time. The file on disk is a different, smaller number, and an engine adds its own overhead.</Text>
    </InfoCard>
  );
}

/** SINCE THE LAST BURST: whose voice was taken, in the order it happened,
 *  and what became of each; how many new sounds were refused; how many loops
 *  are waiting for a voice right now. Read-only: it is the model's own log
 *  lines, put in order (data/gaBudget `lastBurst`). The log scrolls; this
 *  card keeps the lines that teach the rule readable (walk audit W2-09). */
function LastBurstCard({ s }: { s: GaState }) {
  const r = lastBurst(s.log);
  // loops tracked without a voice because of the budget: taken by a burst
  // (stolen) or refused one when they started (waiting)
  const waiting = s.voices.filter((v) => v.state === 'virtual' && (v.stolen || v.waiting)).length;
  const now = waiting ? `${waiting} loop ${waiting === 1 ? 'voice is' : 'voices are'} virtual now, waiting for a free voice.` : 'No loop is waiting: every loop that is on has its voice.';
  return (
    <InfoCard head="SINCE THE LAST BURST · VOICES TAKEN, IN ORDER" a11y={`Since the last burst. ${burstSpoken(r)} ${now}`}>
      {!r ? <Text style={styles.memNote}>No burst yet. Press BURST.</Text> : null}
      {r && r.thefts.length === 0 ? <Text style={styles.memNote}>No voice was taken.</Text> : null}
      {r
        ? r.thefts.map((x, i) => (
            <Text key={`${i}-${x.name}`} style={styles.memName}>
              {i + 1}. {burstTheftWords(x)}
            </Text>
          ))
        : null}
      {r ? (
        <Text style={styles.memSum}>
          TAKEN {r.stolen} · REFUSED {r.refused}
        </Text>
      ) : null}
      <Text style={styles.memNote}>{now}</Text>
    </InfoCard>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  /** The budget the lane asked for last. While protected voices hold the
   *  budget up, a finger resting on a lower stop asks once, not on every
   *  move; a press on FEWER asks every time. */
  const asked = useRef<number | null>(null);
  const ask = (limit: number, pressed = false): void => {
    const g = gaGet();
    const again = asked.current === limit;
    asked.current = limit;
    if (limit === g.voiceLimit) return;
    if (budgetHeld(g, limit) && again && !pressed) return;
    gaDispatch({ type: 'voiceLimit', limit });
  };
  const stolen = Math.max(0, since('stolen'));
  const refused = Math.max(0, since('refused'));
  const running = [sceneOn(s), !!s.machines[0]?.on, alarmOn(s)].filter(Boolean).length;

  const goals = [
    { label: 'Fill the budget until a voice is STOLEN', hit: stolen > 0 },
    { label: 'Keep the alarm through a burst that fills the budget', hit: since('alarmSurvivedBurst') > 0 },
    { label: 'Lower BUDGET until a new sound is REFUSED', hit: refused > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const budgetKey: DockParam = {
    kind: 'fader',
    id: 'budget',
    label: 'BUDGET',
    value: budgetToLane(s.voiceLimit),
    onChange: (v) => ask(laneToBudget(v)),
    format: (v) => budgetWords(laneToBudget(v)),
    formatShort: (v) => budgetShort(laneToBudget(v)),
    nudges: [
      { label: '‹ FEWER', onPress: () => ask(budgetStep(gaGet().voiceLimit, -1), true), a11y: 'One step fewer voices' },
      { label: 'MORE ›', onPress: () => ask(budgetStep(gaGet().voiceLimit, 1), true), a11y: 'One step more voices' },
    ],
  };
  const burstKey: DockParam = { kind: 'action', id: 'burst', label: 'BURST', onPress: () => gaDispatch({ type: 'burst', count: BURST_COUNT }), tint: colors.amber };
  const soundsKey: DockParam = {
    kind: 'group',
    id: 'sounds',
    label: 'SOUNDS',
    valueLabel: running ? `${running} ON` : 'QUIET',
    valueA11y: running ? `${running} lasting sounds switched on` : 'no lasting sound switched on',
    render: () => <SoundsTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [budgetKey, burstKey, soundsKey],
        initialParam: 'budget',
        hud: 'voices',
        readouts: [
          { k: 'STOLEN', v: String(stolen), vA11y: `${stolen} voices stolen since you opened this page` },
          { k: 'REFUSED', v: String(refused), vA11y: `${refused} sounds refused since you opened this page` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>VOICES counts the voices in use against the budget. STOLEN and REFUSED count what the budget cost on this visit.</Look>
        <P>A voice is one sound file playing at this moment. A limit on voices is called a playback limit.</P>
        <P>Voices are one budget. Memory and processing time are others.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Set BUDGET to 8. In SOUNDS, switch on SCENE and GENERATOR 1. Press BURST.</Do>
        <P>Twelve crate impacts arrive within 0.3 s. The card lists whose voice was taken: voice stealing.</P>
        <P>This lab’s teaching rule: at the limit, a new sound takes the voice of the least important sound playing. Of several equal ones, the oldest is taken. A protected sound keeps its voice, and so does a more important one. If no voice can be taken, the new sound is REFUSED.</P>
        <P>A stolen one-shot stops. A stolen loop becomes virtual: tracked and silent until a voice is free. GENERATOR 1 and SCENE stay on: their sounds return when the impacts end.</P>
        <LastBurstCard s={s} />
        <Note>This scene counts a silent loop as a voice and leaves the music out. A real engine counts the music and usually makes a silent loop virtual.</Note>
        <ActivityLog state={s} lines={6} only={['stop', 'refused', 'state']} />
      </Step>
      <Step n={3}>
        <Do>With BUDGET at 8, switch ALARM on in SOUNDS and press BURST. Then lower BUDGET to 1 and press BURST again.</Do>
        <P>At a budget of 1 the protected alarm holds the only voice, so every impact is REFUSED.</P>
        <MemoryCard />
        <Note tone="mistake">Reading every number as a measurement. The voice counts and decoded sizes here are exact. This lab measures no processing time.</Note>
      </Step>
      <Step n={4}>
        <P>Each goal is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The budget is 2. The protected alarm and a warning line hold both voices. A crate impact, which is less important, is posted. What happens by this lab’s rule?"
          options={[
            'The impact is refused, and both sounds continue',
            'The alarm is stopped, because it is the oldest voice',
            'The impact plays anyway, and three voices sound',
            'The warning line is stopped, because a line is short',
          ]}
          correct={0}
          explain="No voice can be taken: one is protected and the other is more important than the impact. So the new sound is refused and the count stays at the limit."
          wrong={[
            undefined,
            'Age decides only between sounds of equal importance, and a protected voice is not taken at all.',
            'Then the limit would not be a limit. A new sound is not added past the budget.',
            'Length is not part of the rule. The line is more important than the impact, so it keeps its voice.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  memRow: { gap: 1 },
  memName: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  memSum: { color: colors.amber, fontFamily: fonts.mono, fontSize: 12, lineHeight: 17 },
  memNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});

export const P17: PageDef = { title: 'Budgets and voice limits', short: 'BUDGETS', Component: Page, manualDone: true, rack: true, guide: G17 };
