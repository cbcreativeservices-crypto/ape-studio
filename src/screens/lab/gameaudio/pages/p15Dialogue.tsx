/**
 * Page 15 — DIALOGUE AND LANGUAGES (Chapter 4, Music and voice).
 *
 * The learner plays the guide's greeting, interrupts it with the more
 * important warning, tries the greeting while the warning speaks and reads
 * that it was REFUSED, then swaps LANGUAGE and sees the caption text AND the
 * audio file change together, for both lines (each Spanish take is a longer
 * file: text and game logic follow the file that plays, not a guessed
 * length). The model logs the swap as "SETTING language: Spanish".
 *
 * SAID ONCE, HERE ONLY: the voice is a wordless stand-in until real lines are
 * recorded; the caption carries the words.
 *
 * Language versions are taught under "Dialogue systems" and the caption
 * terms. The glossary keeps its L-word for hearing where a sound is (see
 * gaTerms), so this page never uses that word for languages.
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
import { ActivityLog, Caption, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import type { GaLanguage } from '../model/gaDefs';
import { gaPlaying, type GaLogKind, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { TrayChip, tray } from './chcBits';
import { CHC_LINES, lineTake, lineTakeFact, speakingNow } from './data/chcMusicVoice';
import { G15 } from './guides/p15';
import { useSince } from './shared';

const ASSETS = ['vo_greeting', 'vo_greeting_long', 'vo_warning', 'vo_warning_long'] as const;
const TERMS = gaTerms('Dialogue systems', 'NPC bark', 'Playback priority', 'Closed Captioning', 'Subtitles for the deaf and hard of hearing');
/** The log lines that belong to speech (the tray shows the three newest). */
const SPEECH_LOG: readonly GaLogKind[] = ['trigger', 'start', 'stop', 'refused', 'note', 'failed'];
/** The well's log adds the MIX lines: the language SETTING, and the duck. */
const PAGE_LOG: readonly GaLogKind[] = [...SPEECH_LOG, 'mix'];
const LANGUAGES: { id: GaLanguage; label: string }[] = [
  { id: 'en', label: 'ENGLISH' },
  { id: 'es', label: 'SPANISH' },
];
/** Short words for the dock key and the readout (seven letters at most fit). */
const LINE_WORD: Record<string, string> = { vo_greeting: 'GREET', vo_warning: 'WARN' };
/** A line's key says in words when that line is speaking. */
const speaking = (label: string, on: boolean): string => (on ? `${label} · SPEAKING` : label);

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
    { id: 'en', label: 'ENGLISH', blurb: 'The next line uses the English take and the English text.' },
    { id: 'es', label: 'SPANISH', blurb: 'The next line uses the Spanish take, a longer file, and the Spanish text.' },
  ],
});

/** Where the caption appears: the words of the line, for as long as it plays. */
function CaptionSlot({ state: s }: { state: GaState }) {
  if (s.caption) return <Caption state={s} />;
  return (
    <View style={styles.quiet}>
      <Text style={styles.quietText}>Nobody is speaking. The caption appears here while a line plays.</Text>
    </View>
  );
}

/** The LINES tray: the two lines, and (because the tray covers the well) the
 *  caption and the newest speech lines of the log, read-only. */
function LinesTray() {
  const s = useGa();
  return (
    <View style={tray.tray}>
      <Text style={tray.head}>THE GUIDE SAYS</Text>
      <View style={tray.row}>
        <TrayChip label={speaking('GREETING', gaPlaying(s, 'vo_greeting'))} selected={gaPlaying(s, 'vo_greeting')} onPress={() => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' })} />
        <TrayChip label={speaking('WARNING', gaPlaying(s, 'vo_warning'))} selected={gaPlaying(s, 'vo_warning')} onPress={() => gaDispatch({ type: 'post', event: 'vo_warning', owner: 'guide' })} />
      </View>
      <CaptionSlot state={s} />
      <ActivityLog state={s} lines={3} only={SPEECH_LOG} />
    </View>
  );
}

/** Read-only: both lines, each with its English and its Spanish take, and
 *  which language the next line uses (a word and a mark, not a color alone). */
function TakesCard({ language }: { language: GaLanguage }) {
  const langs = LANGUAGES.map((l) => ({ ...l, inUse: l.id === language, takes: CHC_LINES.map((line) => ({ ...line, take: lineTake(line.id, l.id) })) }));
  const spoken = langs.map((l) => `${l.label}${l.inUse ? ', in use' : ''}: ${l.takes.map((k) => `${k.name.toLowerCase()}, file ${k.take.file}, text: ${k.take.text}`).join(' ')}`).join(' ');
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
              <Text style={styles.takeFile}>{k.take.file}</Text>
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
    valueA11y: now ? `the guide is speaking: ${now.label}` : 'nobody is speaking',
    render: () => <LinesTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), linesKey, languageKey(s)],
        initialParam: 'master',
        readouts: [
          { k: 'SPEAKING', v: now ? (LINE_WORD[now.event] ?? 'A LINE') : 'NOBODY', vA11y: now ? `speaking: ${now.label}` : 'nobody is speaking' },
          { k: 'PRIORITY', v: now ? String(now.priority) : '—', vA11y: now ? `priority ${now.priority}` : 'no line, no priority' },
        ],
        select: 'guide',
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The second figure, in the workshop, is the guide. The guide speaks every line on this page, and each line appears as a caption below.</Look>
        <P>A dialogue system decides which recorded line plays, and when. Each line has a priority. A more important line may interrupt a less important one, and a less important line is refused while a more important one speaks. Short lines a character says during play are often called barks.</P>
        <P>This is pre-recorded character dialogue. Live voice chat between players is a different system. Subtitles and captions belong with dialogue. In this scene the event that starts the audio also shows the text.</P>
        <Note>The voice here is a wordless stand-in until real lines are recorded. The caption carries the words. Each Spanish take is the same stand-in voice played slower, so it is longer and also lower.</Note>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open LINES. Press GREETING. While it speaks, press WARNING. Then press GREETING again immediately.</Do>
        <CaptionSlot state={s} />
        <P>The log shows the greeting INTERRUPTED by a more important line, and then the greeting REFUSED while the warning speaks. The caption changes with the audio each time.</P>
        <ActivityLog state={s} lines={6} only={PAGE_LOG} />
      </Step>
      <Step n={3}>
        <Do>Set LANGUAGE to SPANISH. Open LINES and press GREETING.</Do>
        <P>The log prints the SETTING. Then the caption and the audio file change together, and the same is true of the warning. Each Spanish take is a longer file. So the text and the game logic follow the file that plays, not a length guessed from the English one.</P>
        <TakesCard language={s.options.language} />
        <Note tone="mistake">Changing the on-screen language while the audio stays in the old one. The player then reads one language and hears another.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The Spanish take of a line is longer than the English take. The game hides the caption after the length of the English take. What happens in Spanish?"
          options={[
            'The caption disappears while the line is still speaking',
            'The Spanish line is cut short at the English length',
            'The line plays faster so that it fits',
            'Nothing: every language has the same length',
          ]}
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
