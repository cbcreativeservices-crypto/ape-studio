/**
 * KINDS OF GAMES (handoff lesson 3 and section 5). The learner's page 4.
 *
 * Genre, perspective and play mode are three SEPARATE choices. The learner
 * browses twelve kinds of game (pages/data/gaGenres): each pick starts the
 * scene again and shows one thing that kind of game cares about.
 *
 * ONE LESSON SINCE 2026-11-14 (owner's decision 5: "Split a page that holds
 * two lessons into two pages"; beginner audit G5, page 4: "Two unrelated
 * lessons share one page"). The second lesson, where the game puts its
 * LISTENER, is the next page (p23Listener.tsx, the learner's page 5), with
 * its tray, its goals and its check. Nothing was cut: every sentence, card,
 * goal and check of the old page is on one of the two.
 *
 * GAMES MOVES THE SCENE (walk audit W1 F11). Picking a kind starts the scene
 * again (`enterPage`: nothing playing, everyone at the start) and runs that
 * kind's ONE demonstration (pages/data/gaGenres `demo`): the strategy kind
 * hands the listener to the overhead camera, the racing kind runs the
 * generator and raises SPEED, the platform kind lands YOU on the gravel...
 * The line at the top of the tray says what the picture now shows. Every
 * claim of every line is proven on the model (test/gameAudioChAGenres).
 *
 * The GAMES tray must fit a phone with the strip in place (196 pt, the
 * measured room): the line (two lines of text) above the twelve chips in
 * four columns (three rows of 44 pt).
 *
 * Common mistake taught against: reading a kind of game as a rule for its
 * sound (the old page's own sentence, "A card shows a typical emphasis, not
 * a rule", now in the mistake box).
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaDispatch, useGa } from '../model/gaStore';
import { ChABullets, ChACard, ChAEmpty, ChARow, ChATrayGrid } from './chAViews';
import { GA_GAME_CHOICES, GA_GENRES, GA_GENRES_TO_OPEN, gaGenre, type GaGenreId } from './data/gaGenres';
import { gaSeenWord } from './data/gaPlatforms';
import { G04 } from './guides/p04';

const ASSETS = ['gen_hum', 'gen_air', 'fountain'] as const;
const TERMS = gaTerms('Split-screen audio');

/** Start the scene again and run one kind's demonstration. */
function runDemo(id: GaGenreId): void {
  const g = gaGenre(id);
  if (!g) return;
  // the scene starts again, but the log's clock keeps the page's time: each
  // pick no longer reads 0.0 s (bug test 2026-11-13, B-S3-05)
  gaDispatch({ type: 'enterPage', keepClock: true });
  for (const a of g.demo.actions) gaDispatch(a);
}

/** The GAMES tray: what the picture now shows FIRST (its line), then the
 *  twelve chips in four columns, so both fit above the fold. The card with
 *  the reasons is in step 2 of the page. */
function GamesTray({ genre, onPick }: { genre: GaGenreId | null; onPick: (id: GaGenreId) => void }) {
  const card = gaGenre(genre);
  return (
    <View style={styles.games}>
      <View style={styles.line} accessibilityLiveRegion="polite">
        <Text style={styles.lineText}>
          <Text style={styles.lineName}>{card ? `${card.label}: ` : 'PICK A KIND: '}</Text>
          {card ? card.demo.line : 'The scene starts again and shows one thing that kind of game cares about.'}
        </Text>
      </View>
      <ChATrayGrid label="Twelve kinds of game" cols={4} chips={GA_GENRES.map((g) => ({ label: g.label, mark: true, on: g.id === genre, onPress: () => onPick(g.id) }))} />
    </View>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const [check, setCheck] = useState(false);
  const [genre, setGenre] = useState<GaGenreId | null>(null);
  const [opened, setOpened] = useState<readonly GaGenreId[]>([]);
  const card = gaGenre(genre);

  const goals = [
    { label: 'Open three kinds of game', hit: opened.length >= GA_GENRES_TO_OPEN },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const camera = s.listenerMode === 'camera';

  const pickGenre = (next: GaGenreId) => {
    setGenre(next);
    setOpened((was) => (was.includes(next) ? was : [...was, next]));
    runDemo(next);
  };
  // a tray the page draws itself (not an options key): the shared options
  // tray puts a long list's description under its chips, below the fold
  const gamesKey: DockParam = {
    kind: 'group',
    id: 'games',
    label: 'GAMES',
    // a count, not a second name for the kind (walk audit W1 F18)
    valueLabel: gaSeenWord(opened.length),
    valueA11y: card ? `${card.name}; ${opened.length} kinds seen on this visit` : 'no kind of game chosen yet',
    render: () => <GamesTray genre={genre} onPick={pickGenre} />,
  };

  return (
    <GaRack
      spec={{
        // LEVEL is the slider (the lab's one key order: the slider first)
        keys: [masterKey(s), gamesKey],
        initialParam: 'master',
        readouts: [
          // STRATEGY's demonstration hands the listener to the camera: this cell shows it
          { k: 'LISTENER', kNarrow: 'EARS', v: camera ? 'CAMERA' : 'YOU', vA11y: camera ? 'the overhead camera is listening' : 'you, the player, are listening', flex: 1.2 },
        ],
        showNames: true,
        // the platformer's surface by the foot, the adventure's beds crossing over
        show: { surface: true, beds: true },
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The scene is drawn from above, the way a strategy game shows its map.</Look>
        <P>Genre, perspective and play mode are three separate choices. A puzzle can be played in first person, and a racing game can be seen from above.</P>
        <ChACard eyebrow="THREE SEPARATE CHOICES" title="GENRE · PERSPECTIVE · PLAY MODE">
          {GA_GAME_CHOICES.map((c) => (
            <ChARow key={c.id} label={`${c.label} · ${c.asks.toUpperCase()}`}>
              {c.examples}
            </ChARow>
          ))}
        </ChACard>
        <P>Each kind of game puts different sounds first, built from the same parts.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do parts={['Open GAMES and pick a kind of game.', 'Watch the picture, then read its card here.', 'Pick two more.']} />
        <P>Each pick starts the scene again and shows one thing that kind of game cares about.</P>
        {card ? (
          <ChACard eyebrow="KIND OF GAME" title={card.name.toUpperCase()} sub={card.why}>
            <ChARow label="SOUNDS IT OFTEN PUTS FIRST">
              <ChABullets items={card.emphasis} />
            </ChARow>
          </ChACard>
        ) : (
          <ChAEmpty>No kind of game is open yet. The GAMES key is in the dock at the bottom.</ChAEmpty>
        )}
      </Step>
      <Step n={3}>
        <Do>After each pick, read the line at the top of the GAMES tray, then the activity log.</Do>
        <P>The line says what the picture now shows. The log lists what the game asked for and what the audio side answered.</P>
        <ActivityLog state={s} lines={4} />
        <Note tone="mistake">Reading a kind of game as a rule for its sound. A card shows a typical emphasis, not a rule. Many games combine several kinds.</Note>
        <P>One thing changes with the perspective: where the game puts its listener. The next page is about that.</P>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow=""
          question="A racing game is seen from above. Two people play it in turns on one screen. Which of these is its play mode?"
          options={['Two players on one screen, in turns', 'A racing game, because the cars race', 'Seen from above, like a strategy map', 'One player online against the computer']}
          correct={0}
          explain="Play mode answers who plays, and how. The genre (racing) and the perspective (from above) are separate choices."
          wrong={[
            undefined,
            'That is the genre: what the player does.',
            'That is the perspective: where the camera is.',
            'Two people share one screen here, and they take turns.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  // 46 (the line) + 6 + 3 rows of 44 with 2 gaps of 6 = 196 pt: the room a
  // tray has on a phone with the strip in place (measured, fix round SC)
  games: { gap: 6 },
  // two lines of text, always: the chips under it never move
  line: { borderRadius: 9, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0d0d10', paddingVertical: 6, paddingHorizontal: 10, minHeight: 46, justifyContent: 'center' },
  lineText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 16 },
  lineName: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8 },
});

export const P04: PageDef = { title: 'Kinds of games', short: 'GAMES', Component: Page, manualDone: true, rack: true, guide: G04 };
