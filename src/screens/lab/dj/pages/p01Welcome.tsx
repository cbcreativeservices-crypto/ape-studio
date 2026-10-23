/**
 * Screen 1 — Welcome and safe operation. What the lab teaches; safe
 * listening; headphone precautions; the playback level; the STOP and reset
 * controls. The exposure tile computes with the Calculator Lab's own NIOSH
 * function (calc/workspaces/splSafety.nioshDose — calculators are the source
 * of truth); the guideline is described in plain words, never by name.
 */
import { useState } from 'react';
import { Group, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { nioshDose } from '../../calc/workspaces/splSafety';
import { BoothStage } from '../art/BoothStage';
import { PRINTED_MIN_MM } from '../art/djZoom';
import { INK } from '../art/ink';
import { SceneText } from '../art/sceneText';
import { BOOTH_LAYOUT, PLAYER, VIEWS } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { listenKey, playKey, stopKey } from '../dock';
import { setBooth, setPerspective, updateBooth } from '../booth/boothStore';
import { cueAtBar, freshBooth, useScreenSetup } from '../booth/setup';
import { soundCell, useBoothKit } from './shared';
import { dbStr, listenDb, type Booth, type Perspective } from '../model/djModel';
import type { TrackId } from '../engine/djMusic';

const TERMS = [
  { term: 'dBA', def: 'Sound level in the air, weighted roughly the way ears hear it. It is measured with a sound level meter in the room or at the ear, never by a phone’s volume setting.' },
  { term: 'Exposure', def: 'How much sound your ears take in: the level AND the time. A little louder for a little longer adds up fast.' },
  { term: 'Booth monitors', def: 'The speakers in the DJ booth that point at you, so you hear the mix without turning the room up.' },
  { term: 'Listening perspective', def: 'Whose ears the phone plays in this lab: the crowd (the PA), the booth monitors, or your headphones.' },
] as const;

const LEVELS = [85, 88, 91, 94, 97, 100] as const;
const HOURS = [1, 2, 4] as const;
/** The loudest level a 4-hour set can run at and stay within the allowance
 *  (computed, never typed: 88 dBA with this guideline). */
const LOUDEST_4H = Math.max(...LEVELS.filter((L) => Math.round(nioshDose([L], [240])) <= 100));

export const GOALS_WELCOME = ['Start deck A', 'Switch who you listen as', 'Stop everything', 'Reset the booth', 'Find the loudest safe 4-hour level', 'Pass the check', 'Fix the silent start'] as const;

/** A find-the-answer task (learning review p01 #1): it latches only on the
 *  loudest level that keeps a 4-hour set at or under 100 %. */
function ExposureTile({ onFound }: { onFound: () => void }) {
  const [db, setDb] = useState<number>(94);
  const [h, setH] = useState<number>(2);
  const dose = nioshDose([db], [h * 60]);
  const pick = (L: number, H: number) => {
    if (L === LOUDEST_4H && H === 4) onFound();
  };
  return (
    <View style={styles.tile}>
      <Text style={styles.tileHead}>A LOUD NIGHT, IN NUMBERS</Text>
      <Text style={styles.tileBody}>NIOSH recommends 85 dBA for 8 hours, HALVING the time for every 3 dB more. The US legal limit (OSHA) is 90 dBA, with a 5 dB rule.</Text>
      <Text style={styles.tileDo}>Pick a 4 h set, then find the LOUDEST level that stays at 100 % or less.</Text>
      <View style={styles.chips}>
        {LEVELS.map((L) => (
          <LabChip key={L} label={`${L} dBA`} selected={db === L} onPress={() => (setDb(L), pick(L, h))} compact />
        ))}
      </View>
      <View style={styles.chips}>
        {HOURS.map((x) => (
          <LabChip key={x} label={`${x} h set`} selected={h === x} onPress={() => (setH(x), pick(db, x))} compact />
        ))}
      </View>
      <Text style={[styles.dose, { color: dose > 100 ? '#ff5a48' : dose > 50 ? colors.amber : colors.green }]}>{`${Math.round(dose)} % of a day’s allowance (NIOSH)`}</Text>
      <Text style={styles.tileFine}>A model for learning, not a guarantee for any one person’s ears. Booths and clubs are often louder than you think — measure with a calibrated meter, and use earplugs made for music.</Text>
    </View>
  );
}

const STRIP_H = 50;
const WHO: { id: Perspective; top: string; sub: string }[] = [
  { id: 'CROWD', top: 'CROWD', sub: 'THE PA SPEAKERS' },
  { id: 'BOOTH', top: 'BOOTH', sub: 'THE BOOTH MONITORS' },
  { id: 'PHONES', top: 'PHONES', sub: 'YOUR HEADPHONES' },
];

/** The booth drawing's height on a glass `w` wide (its own aspect), and
 *  where it sits so the strip follows right under it (no empty band). */
function boothFit(W: number, H: number) {
  const v = VIEWS.booth;
  const dh = Math.min(H - STRIP_H, ((W - 12) / v.w) * v.h + 12);
  const y0 = Math.max(0, (H - STRIP_H - dh) / 2);
  return { x: 0, y: y0, w: W, h: dh };
}

/** Under the booth: whose ears the phone is playing right now (LISTEN). */
function PerspectiveStrip({ w, top, now }: { w: number; top: number; now: Perspective }) {
  const gap = 6;
  const tw = (w - 12 - gap * 2) / 3;
  const y = top + 2;
  return (
    <Group>
      {WHO.map((p, i) => {
        const x = 6 + i * (tw + gap);
        const on = p.id === now;
        return (
          <Group key={p.id}>
            <RoundedRect x={x} y={y} width={tw} height={STRIP_H - 10} r={7} color={on ? 'rgba(255,198,77,0.14)' : '#0b0c0f'} />
            <RoundedRect x={x + 0.5} y={y + 0.5} width={tw - 1} height={STRIP_H - 11} r={7} style="stroke" strokeWidth={1} color={on ? INK.amber : '#2a2c32'} />
            <SceneText x={x + tw / 2} y={y + 17} size={12} text={p.top} color={on ? INK.amber : INK.printDim} face="label" align="center" />
            <SceneText x={x + tw / 2} y={y + 31} size={9.5} text={p.sub} color={on ? INK.print : INK.printDim} face="label" align="center" />
          </Group>
        );
      })}
    </Group>
  );
}

/** The booth Screen 1 starts from (and RESET returns to): deck A cued at bar
 *  17 with its channel fader UP — a fresh booth's faders are down, so a
 *  reset that skipped this left PLAY A silent (toddler test 2026-10-19). */
const welcomeBooth = (b: Booth, track: TrackId): Booth => {
  const x = cueAtBar(b, 'A', track, 17);
  return { ...x, ch: { ...x.ch, 1: { ...x.ch[1], fader: 0.8, xf: 'THRU' } }, perspective: 'CROWD' };
};

function PageWelcome({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  const { ready } = useScreenSetup((b) => welcomeBooth(b, b.decks.A.track ?? 'nightFerry'));
  const [heardA, setHeardA] = useState(false);
  const [switched, setSwitched] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [reset, setReset] = useState(false);
  const [tile, setTile] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  // judged only once this screen's setup is applied: the first render still
  // sees the booth the last screen left (deck A playing, PHONES), which
  // ticked "Start deck A", "Switch who you listen as" and "Stop everything"
  // on arrival (toddler test 2026-10-19)
  if (ready && booth.decks.A.playing && !heardA) setHeardA(true);
  if (ready && booth.perspective !== 'CROWD' && !switched) setSwitched(true);
  if (ready && heardA && !booth.decks.A.playing && !booth.decks.B.playing && !stopped && audio.status === 'idle') setStopped(true);
  const hits = [heardA, switched, stopped, reset, tile, check, faultFixed];
  const goals = GOALS_WELCOME.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'WELCOME');
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <BoothStage
            w={w}
            h={h}
            booth={booth}
            motion={motion}
            spec={{
              view: 'booth',
              // FULL SCREEN's READ step: zoom until the gear's printed words
              // (3.4 mm) read at 9 pt (owner 2026-10-19, option A)
              readMm: PRINTED_MIN_MM,
              fit: (W, H) => boothFit(W, H),
              labelsOutsideFit: true,
              aspect: VIEWS.booth.w / (VIEWS.booth.h + 70 + STRIP_H * (VIEWS.booth.w / 374)),
              // the listening strip right under the drawing: no label there
              obstacles: [{ x: -2000, y: VIEWS.booth.y + VIEWS.booth.h, w: 5000, h: 400 }],
              screenOverlay: (W, H) => {
                const f = boothFit(W, H);
                return <PerspectiveStrip w={W} top={f.y + f.h} now={booth.perspective} />;
              },
              highlight: { A: ['play'] },
              callouts: [
                { id: 'a', text: 'DECK A', at: { x: BOOTH_LAYOUT.A.x + 160, y: -2 }, dx: 0, dy: -14 },
                { id: 'm', text: 'MIXER', at: { x: BOOTH_LAYOUT.mixer.x + 135, y: 8 }, dx: 0, dy: -24 },
                { id: 'b', text: 'DECK B', at: { x: BOOTH_LAYOUT.B.x + 160, y: -2 }, dx: 0, dy: -14 },
                { id: 'p', text: 'PLAY', at: { x: BOOTH_LAYOUT.A.x + PLAYER.play.cx, y: PLAYER.play.cy + 18 }, dx: 0, dy: 22 },
              ],
              a11y: `The DJ booth from above: deck A on the left, the two-channel mixer in the middle, deck B on the right. Underneath, who you are listening as: ${booth.perspective}.`,
            }}
          />
        ),
        bezel: [soundCell(audio), { k: 'LISTENING AS', v: booth.perspective, tint: colors.amber }, { k: 'PLAYBACK', v: `${Math.round(booth.listen * 100)}% · ${dbStr(listenDb(booth.listen))}`, tint: colors.textPrimary, flex: 1.3 }],
        params: [
          playKey(booth, tr, 'A'),
          listenKey(booth),
          {
            kind: 'action',
            id: 'reset',
            label: 'RESET',
            onPress: () => {
              tr.stopAll();
              setBooth(welcomeBooth(freshBooth(), 'nightFerry'));
              setReset(true);
            },
          },
          stopKey(tr),
        ],
        initialParam: 'playA',
      }}
    >
      <Step n={1}>
        <Look>You are looking at the DJ booth from above: deck A on the left, the two-channel mixer in the middle, deck B on the right. Underneath, who you are listening as.</Look>
        <P>In this lab you build a two-deck DJ system, cue and mix on it, and find faults the way a working DJ does — all on ONE booth that stays set up from screen to screen.</P>
        <P>The music is the lab’s own, made inside the app. Your hearing comes first: loudness and time add up, and a few hours in a loud booth can use more than a whole day’s safe allowance.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Find ■ STOP in the dock — it stops every deck and every sound, at any moment. Then press PLAY A.</Do>
        <P>Open LISTEN to choose whose ears the phone plays: the CROWD (the PA speakers), the BOOTH monitors, or your PHONES (headphones).</P>
      </Step>
      <Step n={3}>
        <P>Each time you switch, the playback starts LOW again. Turn it up slowly with LOUDER until it is comfortable, and keep it well below the top.</P>
        <Note tone="safety">The PLAYBACK number is how loud the lab asks the phone to play. It is not a calibrated or safe level: the same number is much louder in some headphones than others. A phone’s microphone cannot measure what reaches your ears in headphones.</Note>
      </Step>
      <Step n={4}>
        <Do>Start deck A, switch who you listen as, stop everything with ■ STOP, then RESET the booth. Then find the loudest safe level for a 4-hour set.</Do>
        <ExposureTile onFound={() => setTile(true)} />
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
        <Note tone="try">In a real booth: start with the headphone and booth levels DOWN, bring them up slowly, wear one ear off the headphones when you can, take breaks in quiet, and use earplugs made for music in loud rooms.</Note>
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="A friend’s phone shows its volume at 60 %. Is that a safe level for a two-hour session?"
          options={[
            'You cannot tell from the setting: it depends on the headphones and the phone, so keep it low and limit the time',
            'Yes — anything under 70 % is safe',
            'No — anything over 50 % is dangerous',
            'Yes, as long as the music is quiet at the start',
          ]}
          correct={0}
          explain="A volume percentage is not a sound level. The same setting can be gentle in one pair of headphones and very loud in another. Level and time decide exposure; only a calibrated measurement at the ear can say how loud it really is."
          wrong={[undefined, 'There is no safe percentage — the headphones and the phone change everything.', 'There is no fixed danger percentage either; the level at the ear and the time decide it.', 'Music gets louder in a set, and a safe start says nothing about the next two hours.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="PLAY IS LIT, BUT YOU HEAR NOTHING"
          symptom="Deck A is playing and its waveform is moving, yet the phone is silent. The temptation is to turn everything up."
          start={() => {
            void audio.requestSound();
            setPerspective('PHONES');
            updateBooth((b, t) => ({
              ...b,
              decks: { ...b.decks, A: { ...b.decks.A, playing: true, at: t } },
              ch: { ...b.ch, 1: { ...b.ch[1], cue: false } },
              mixer: { ...b.mixer, cueMix: 0, splitCue: false },
            }));
          }}
          fixed={booth.decks.A.playing && (booth.perspective !== 'PHONES' || booth.ch[1].cue || booth.mixer.cueMix > 0.5)}
          hints={['Before turning anything up, check WHO you are listening as. Open LISTEN.', 'You are listening as the headphones, and nothing is being sent to them yet.', 'Switch LISTEN to CROWD to hear what the room hears.']}
          why="Nothing was wrong with the music: you were listening as the headphones, and nothing was being sent to them yet (Screen 7 shows how — a channel’s CUE, or the headphone blend toward the master). Turning a level up would only have made the next sound much too loud. Check WHO you are listening as before you touch a volume."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(5)} latched={latched.slice(5)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: 12, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', padding: 12, gap: 8 },
  tileHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  tileBody: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  tileDo: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 20 },
  tileFine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dose: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 0.4 },
});

export const P01: PageDef = { title: 'Welcome and safe operation', short: 'WELCOME', Component: PageWelcome, manualDone: true, rack: true };
