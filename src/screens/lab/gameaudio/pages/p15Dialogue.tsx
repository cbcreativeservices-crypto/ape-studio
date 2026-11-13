/**
 * Page 15 — DIALOGUE AND LANGUAGES (Chapter 4, Music and voice).
 *
 * The learner plays the guide's greeting, interrupts it with the more
 * important warning, tries the greeting while the warning speaks and reads
 * that it was REFUSED, then swaps LANGUAGE and sees the caption text AND the
 * audio file change together, for both lines (each Spanish take is a longer
 * file: text and game logic follow the file that plays, not a guessed
 * length). The model logs the swap as "SETTING language: Spanish", and each
 * START line names the take's file, so the two languages read differently
 * in the log: the same line, a different file.
 *
 * The voice is a wordless stand-in (the owner's recordings are must-do D60);
 * the caption carries the words. The page says what the learner hears, not
 * what is still to be built (audit 2, L-11).
 *
 * "REFUSED while a more important line speaks" is THIS scene's rule; the page
 * says other games make the line wait (accuracy audit B4). The higher
 * priority number wins, and the page says so (L-11).
 *
 * LANGUAGE VERSIONS AND THE WORD "LOCALIZATION". Every real tool calls making
 * language versions localization; this app's glossary keeps that word for
 * hearing where a sound is. The page says both, once, in one note
 * (chcMusicVoice.CHC_LANGUAGE_VERSIONS_NOTE); no other learner text uses the
 * word for languages.
 *
 * THE LINES TRAY covers the well, so it carries the two lines (with their
 * priorities), the caption, and the newest result of the dialogue system in
 * one line, built to fit the tray's 196 points with the strip in place.
 *
 * Goals are the model's facts: `inst:vo_greeting`, `interrupted`,
 * `lineRefused`, and the Spanish take that really started.
 *
 * Common mistake taught against: changing the on-screen language while the
 * audio stays in the old one.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Caption, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import type { GaLanguage } from '../model/gaDefs';
import { gaPlaying, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { TrayChip, tray } from './chcBits';
import { CHC_LANGUAGE_VERSIONS_NOTE, CHC_LINES, lastSpeech, lineTake, lineTakeFact, p15Log, speakingNow } from './data/chcMusicVoice';
import { G15 } from './guides/p15';
import { useSince } from './shared';

const ASSETS = ['vo_greeting', 'vo_greeting_long', 'vo_warning', 'vo_warning_long'] as const;
const TERMS = gaTerms('Dialogue systems', 'NPC bark', 'Playback priority', 'Closed Captioning', 'Subtitles for the deaf and hard of hearing');
const LANGUAGES: { id: GaLanguage; label: string }[] = [
  { id: 'en', label: 'ENGLISH' },
  { id: 'es', label: 'SPANISH' },
];
/** Short words for the dock key and the readout (seven letters at most fit). */
const LINE_WORD: Record<string, string> = { vo_greeting: 'GREET', vo_warning: 'WARN' };
/** A line's key: its name and its priority. Its width never changes (a key
 *  that grew while its line speaks pushed WARNING from under the finger);
 *  who is speaking is said by the caption, the result line under it, the
 *  SPEAKING readout and the strip. */
const lineChip = (name: string, priority: number): string => `${name} · ${priority}`;

/** LANGUAGE is a set-and-forget setting: a choice applies and the tray
 *  closes (the next step opens LINES). The choice in force carries ✓. */
const languageKey = (s: GaState): DockParam => ({
  kind: 'options',
  id: 'language',
  label: 'LANGUAGE',
  valueLabel: LANGUAGES.find((l) => l.id === s.options.language)?.label ?? 'ENGLISH',
  selectedId: s.options.language,
  onSelect: (id) => {
    if (gaGet().options.language !== id) gaDispatch({ type: 'option', patch: { language: id as GaLanguage } });
  },
  options: [
    { id: 'en', label: marked('ENGLISH', s.options.language === 'en'), blurb: 'The next line uses the English take and the English text.' },
    { id: 'es', label: marked('SPANISH', s.options.language === 'es'), blurb: 'The next line uses the Spanish take, a longer file, and the Spanish text.' },
  ],
});

/** Where the caption appears: the words of the line, for as long as it plays. */
function CaptionSlot({ state: s }: { state: GaState }) {
  if (s.caption) return <Caption state={s} />;
  return (
    <View style={styles.quiet}>
      <Text style={styles.quietText}>Quiet: nobody is speaking. The caption appears here while a line plays.</Text>
    </View>
  );
}

/** The LINES tray: the two lines, and (because the tray covers the well) the
 *  caption and what the dialogue system did last, in one line. */
function LinesTray() {
  const s = useGa();
  const last = lastSpeech(s);
  return (
    <View style={tray.tray}>
      <View style={tray.row}>
        {CHC_LINES.map((l) => {
          const on = gaPlaying(s, l.id);
          return <TrayChip key={l.id} label={lineChip(l.name, l.priority)} selected={on} onPress={() => gaDispatch({ type: 'post', event: l.id, owner: 'guide' })} />;
        })}
      </View>
      <View style={styles.trayCaption}>
        <CaptionSlot state={s} />
      </View>
      <Text style={[tray.status, styles.trayLast]} numberOfLines={2}>
        {last ?? 'The number on each key is its priority. The higher number wins.'}
      </Text>
    </View>
  );
}

/** Read-only: both lines, each with its English and its Spanish take, the
 *  file's length, and which language the next line uses (a word and a mark,
 *  not a color alone). */
function TakesCard({ language }: { language: GaLanguage }) {
  const langs = LANGUAGES.map((l) => ({ ...l, inUse: l.id === language, takes: CHC_LINES.map((line) => ({ ...line, take: lineTake(line.id, l.id) })) }));
  const spoken = langs
    .map((l) => `${l.label}${l.inUse ? ', in use' : ''}: ${l.takes.map((k) => `${k.name.toLowerCase()}, file ${k.take.file}, ${k.take.seconds.toFixed(1)} seconds, text: ${k.take.text}`).join(' ')}`)
    .join(' ');
  return (
    <View style={styles.card} accessible accessibilityRole="summary" accessibilityLabel={`Each line has two takes. ${spoken} The Spanish takes are the longer files.`}>
      <Text style={styles.cardHead}>TWO LINES · TWO TAKES OF EACH</Text>
      {langs.map((l) => (
        <View key={l.id} style={[styles.take, l.inUse && styles.takeOn]}>
          <Text style={[styles.takeLang, l.inUse && { color: colors.amber }]}>
            {l.inUse ? '● ' : '○ '}
            {l.label}
            {l.inUse ? ' · IN USE' : ''}
          </Text>
          {l.takes.map((k) => (
            <View key={k.id} style={styles.takeLine}>
              <Text style={styles.takeName}>{k.name}</Text>
              <Text style={styles.takeFile}>
                {k.take.file} · {k.take.seconds.toFixed(1)} s
              </Text>
              <Text style={styles.takeText}>“{k.take.text}”</Text>
            </View>
          ))}
        </View>
      ))}
      <Text style={styles.cardNote}>The Spanish takes are the longer files.</Text>
    </View>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const now = speakingNow(s);
  const goals = [
    { label: 'Play the greeting', hit: since('inst:vo_greeting') > 0 },
    { label: 'Interrupt it with the warning', hit: since('interrupted') > 0 },
    { label: 'Ask for the greeting during the warning', hit: since('lineRefused') > 0 },
    { label: 'Play a line in Spanish', hit: CHC_LINES.some((l) => since(lineTakeFact(l.id, 'es')) > 0) },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const linesKey: DockParam = {
    kind: 'group',
    id: 'lines',
    label: 'LINES',
    valueLabel: now ? (LINE_WORD[now.event] ?? 'A LINE') : 'QUIET',
    valueA11y: now ? `the guide is speaking: ${now.label}` : 'quiet: nobody is speaking',
    render: () => <LinesTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), linesKey, languageKey(s)],
        initialParam: 'master',
        hud: 'lines',
        readouts: [
          { k: 'SPEAKING', kNarrow: 'LINE', v: now ? (LINE_WORD[now.event] ?? 'A LINE') : 'QUIET', vA11y: now ? `speaking: ${now.label}` : 'quiet: nobody is speaking' },
          { k: 'PRIORITY', kNarrow: 'PRI.', v: now ? String(now.priority) : '—', vA11y: now ? `priority ${now.priority}` : 'no line, no priority' },
        ],
        select: 'guide',
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The guide speaks every line on this page. The strip under the picture draws each line as a bar as long as its file; it fills while the line speaks.</Look>
        <P>A dialogue system decides which recorded line plays, and when. Each line has a priority: the higher number wins. A more important line may interrupt a less important one. In this scene a less important line is refused while a more important one speaks. Other games make it wait.</P>
        <P>Live voice chat between players is a different system. Here the event that starts a recorded line also shows its caption.</P>
        <Note>The voice is a wordless stand-in, and the caption carries the words. Each Spanish take is the same voice played slower: longer and lower.</Note>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open LINES. Press GREETING. While it speaks, press WARNING. Then press GREETING again immediately.</Do>
        <CaptionSlot state={s} />
        <P>The log and the strip show the greeting INTERRUPTED, then REFUSED while the warning speaks.</P>
        <ActivityLog state={p15Log(s)} lines={6} empty="No speech line yet. This log shows the lines, and the LANGUAGE setting." />
      </Step>
      <Step n={3}>
        <Do>Set LANGUAGE to SPANISH. Open LINES and press GREETING.</Do>
        <P>The START line names the Spanish file: the same line, a different file. In the strip both bars grow longer. Text and game logic follow the file that plays, not a length guessed from English.</P>
        <TakesCard language={s.options.language} />
        <Note>{CHC_LANGUAGE_VERSIONS_NOTE}</Note>
        <Note tone="mistake">Changing the on-screen language while the audio stays in the old one: the player reads one language and hears another.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The Spanish take of a line is longer than the English take. The game hides the caption after the length of the English take. What happens in Spanish?"
          options={['The caption ends while the line still speaks', 'The Spanish line is cut short at the English length', 'The line plays faster so that it fits the time', 'Nothing: every language has the same length']}
          correct={0}
          explain="Text and logic that depend on one take’s length break when another language is longer. In this scene the caption ends when the line’s own instance ends, whichever file played."
          wrong={[
            undefined,
            'Nothing in that rule touches the audio. It only hides the text, so the voice goes on with no caption.',
            'Hiding a caption does not change playback speed. The file plays at its own length.',
            'Translated lines often differ in length. The Spanish takes on this page are longer than the English ones.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

const styles = StyleSheet.create({
  /** The tray keeps one height whether a caption shows or not, so its keys
   *  never move under the finger. */
  trayCaption: { minHeight: 88, justifyContent: 'center' },
  trayLast: { minHeight: 36 },
  quiet: { borderRadius: 10, borderWidth: 1, borderColor: '#2c2c33', borderStyle: 'dashed', padding: 10 },
  quietText: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#08090b', padding: 10, gap: 7 },
  cardHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.4 },
  take: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', padding: 8, gap: 6 },
  takeLine: { gap: 1 },
  takeName: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1 },
  takeOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,0.06)' },
  takeLang: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1 },
  takeFile: { color: colors.cyanBright, fontFamily: fonts.mono, fontSize: 12 },
  takeText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  cardNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});

export const P15: PageDef = { title: 'Dialogue and languages', short: 'DIALOGUE', Component: Page, manualDone: true, rack: true, guide: G15 };
