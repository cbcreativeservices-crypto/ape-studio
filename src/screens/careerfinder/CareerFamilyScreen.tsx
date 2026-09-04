/**
 * Audio Career Finder — one career family (owner brief 2026-09-03; design,
 * learning and industry reviews 2026-09-04).
 *
 * Order is the conversion path: what the work is → how it lines up with the
 * user's answers → START LEARNING (the Academy bridge, with a START HERE
 * shortlist so there is one obvious first step) → reference facts → common
 * entry points → every title in the family. Families with licensed titles
 * carry a plain statement that Academy study is not a route to any licence,
 * above the learning card, before anyone taps a topic.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { sendFeedback } from '../../lib/feedback';
import { officialTopicName } from '../../data/officialTopicNames';
import { fetchV3Curriculum, flattenV3 } from '../../data/v3Curriculum';
import { toggleTopic, useEnrollment } from '../../features/enrollment/enrollmentStore';
import { computeResult, explainFamily } from '../../features/careerfinder/scoring';
import { CAREER_INDEX_VERSION, CENTRALITY, careersInFamily, centralitySplit, entryPoints, familyFieldOf, familyView, type Career } from '../../features/careerfinder/careerIndex';
import { answeredCount, toggleSavedFamily, useCareerFinder } from '../../features/careerfinder/store';
import { Body, Card, CentralityChip, CtaButton, DimChip, FinderShell, Lead, LinkRow, SaveStar, SectionLabel, TextLink } from './kit';

const PAGE = 12;
const START_HERE = 3;

export function CareerFamilyScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'CareerFamily'>>();
  const fam = familyView(params.id);
  const rec = useCareerFinder();
  const hasResults = rec.completed && answeredCount(rec) > 0;
  const result = useMemo(() => (hasResults ? computeResult(rec.responses, familyFieldOf) : null), [hasResults, rec.responses]);
  const rank = result?.ranked.find((r) => r.family.id === params.id)?.rank ?? null;
  const careers = useMemo(() => careersInFamily(params.id), [params.id]);
  const entries = useMemo(() => entryPoints(params.id), [params.id]);
  const split = useMemo(() => centralitySplit(params.id), [params.id]);
  const licensed = careers.some((c) => c.regulated);
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [allTopics, setAllTopics] = useState(false);
  const saved = rec.saved.includes(params.id);

  // Live topic names (gs → official name, never "Topic gsN") + the enrollment
  // list for the + / ✓ affordance, exactly the Explore tree's gesture.
  const [names, setNames] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    let alive = true;
    void fetchV3Curriculum().then((fields) => { if (alive) setNames(new Map(flattenV3(fields).map((t) => [t.gs, t.name] as const))); });
    return () => { alive = false; };
  }, []);
  const enrolled = useEnrollment();
  const enrolledGs = useMemo(() => new Set(enrolled.map((e) => e.gs)), [enrolled]);

  if (!fam) {
    return (
      <FinderShell kicker="AUDIO CAREER FINDER" title="Career family" onBack={() => navigation.goBack()}>
        <Body>This family is not in the current index. Go back and choose another.</Body>
      </FinderShell>
    );
  }

  const addedHere = fam.topicGs.filter((gs) => enrolledGs.has(gs));
  const topicsToShow = allTopics ? fam.topicGs : fam.topicGs.slice(0, START_HERE);
  const studyNow = () => {
    const gs = addedHere[0] ?? fam.topicGs[0];
    // popTo, not navigate: 'Study' is a tab INSIDE the root 'Main' route, so
    // navigate('Study') from this root-stack screen is unhandled (the button was
    // dead — Bug+Hater night B1-01), and navigate('Main') would PUSH a second tab
    // shell under React Navigation 7. Same idiom as EnrollmentScreen's goStudy.
    (navigation as unknown as { popTo: (name: string, params?: object) => void }).popTo('Main', {
      screen: 'Study',
      params: { screen: 'Dashboard', params: { focusGs: gs } },
    });
  };
  const correction = () => sendFeedback('correction', fam.name, { Screen: 'Career family', 'Family id': fam.id, 'Index version': CAREER_INDEX_VERSION });

  return (
    <FinderShell
      kicker={`CAREER FAMILY · ${fam.count} TITLES`}
      title={fam.name}
      onBack={() => navigation.goBack()}
      backLabel={params.from === 'results' ? 'Back to results' : params.from === 'browse' ? 'Back to all families' : 'Back'}
      headerRight={<SaveStar saved={saved} onPress={() => toggleSavedFamily(fam.id)} name={fam.name} />}
    >
      {rank != null && rank <= 5 ? <Text style={styles.rankLine}>RANKED #{rank} FOR YOU</Text> : rank != null && rank <= 10 ? <Text style={[styles.rankLine, { color: colors.textMuted }]}>IN YOUR TOP TEN</Text> : null}
      <Lead>{fam.description}</Lead>

      {result ? (
        <Card tone="raised">
          <SectionLabel tone="cyan">HOW IT LINES UP WITH YOUR ANSWERS</SectionLabel>
          <Body>{explainFamily(fam, result.dims, { rank: rank ?? undefined })}</Body>
          <View style={styles.chips}>{fam.dimensions.map((c, i) => <DimChip key={c} code={c} dims={result.dims} primary={i === 0} />)}</View>
        </Card>
      ) : (
        <Card>
          <SectionLabel>THE ACTIVITIES IT LEANS ON</SectionLabel>
          <View style={styles.chips}>{fam.dimensions.map((c, i) => <DimChip key={c} code={c} primary={i === 0} />)}</View>
          <Body muted>Main activity first. Take the Career Finder to see how your own interests line up with them.</Body>
        </Card>
      )}

      {licensed ? (
        <Card tone="amber">
          <SectionLabel>LICENSED OR CREDENTIALED PROFESSIONS IN THIS FAMILY</SectionLabel>
          <Body>Some titles here are licensed, credentialed or restricted-entry occupations (marked LICENSED below). Academy topics build the audio and acoustics knowledge those fields draw on; they are not a route to any licence, clinical credential, bar admission or security clearance, and completing them does not qualify anyone to practise. Check the licensing body where you live.</Body>
        </Card>
      ) : null}

      <Card tone="ok">
        <SectionLabel tone="green">{licensed ? 'AUDIO KNOWLEDGE THAT SUPPORTS THIS FAMILY' : 'START LEARNING IN THE ACADEMY'}</SectionLabel>
        <Text style={styles.pathLine}>{fam.field} › {fam.subject}</Text>
        {fam.topicGs.length ? (
          <>
            <Body muted>These Academy topics lead into this family. Tap one to add it to your study list — free to add, and the first free topics are open to everyone.</Body>
            <Text style={styles.startHere}>START HERE</Text>
            {topicsToShow.map((gs) => {
              const on = enrolledGs.has(gs);
              const name = officialTopicName(gs, names.get(gs));
              return (
                <Pressable key={gs} style={styles.topicRow} onPress={() => toggleTopic(gs)} accessibilityRole="button" accessibilityState={{ selected: on }} aria-selected={on} accessibilityLabel={on ? `Remove ${name} from your study list` : `Add ${name} to your study list`}>
                  <Text style={[styles.topicCheck, on && { color: colors.green }]}>{on ? '✓' : '+'}</Text>
                  <Text style={[styles.topicText, on && { color: '#7dffa1' }]}>{name}</Text>
                </Pressable>
              );
            })}
            {fam.topicGs.length > START_HERE ? (
              <TextLink label={allTopics ? 'Show fewer' : `Show ${fam.topicGs.length - START_HERE} more topic${fam.topicGs.length - START_HERE === 1 ? '' : 's'}`} onPress={() => setAllTopics(!allTopics)} muted />
            ) : null}
            {addedHere.length ? (
              <CtaButton label={`STUDY ${addedHere.length} TOPIC${addedHere.length === 1 ? '' : 'S'} NOW ›`} tone="green" onPress={studyNow} hint="Opens your study dashboard at the first topic you added" />
            ) : null}
            <TextLink label="Open the full curriculum" onPress={() => navigation.navigate('Awards', { category: 'curriculum' })} />
          </>
        ) : (
          <>
            <Body muted>The subject above is the place to begin; its topics are listed on the Explore page.</Body>
            <CtaButton label="OPEN THE CURRICULUM" onPress={() => navigation.navigate('Awards', { category: 'curriculum' })} hint="Opens the Explore page with every subject" />
          </>
        )}
      </Card>

      <Card>
        <SectionLabel>REPRESENTATIVE CAREERS</SectionLabel>
        {fam.examples.map((e) => <Text key={e} style={styles.example}>▸ {e}</Text>)}
        <SectionLabel>WHERE THE WORK HAPPENS</SectionLabel>
        <Body>{fam.settings.map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)).join(' · ')}</Body>
        <SectionLabel>HOW CENTRAL AUDIO IS</SectionLabel>
        <View style={styles.chips}>
          {(['core', 'specialized', 'enabled'] as const).filter((k) => split[k] > 0).map((k) => <CentralityChip key={k} value={k} count={split[k]} />)}
        </View>
        {fam.sources.length ? <Text style={styles.sources}>Titles cross-checked against public listings from {fam.sources.join(', ')}. None of them reviewed or endorsed this index — see How this works.</Text> : null}
      </Card>

      {entries.length ? (
        <View style={{ gap: 8 }}>
          <SectionLabel>COMMON ENTRY POINTS</SectionLabel>
          <Body muted>Titles in this family that usually ask the least formal preparation to get started.</Body>
          {entries.map((c) => <CareerRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />)}
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <SectionLabel>BROWSE CAREERS IN THIS FAMILY</SectionLabel>
        <Body muted>{careers.length} titles from the Grand Audio Career Index. Some are the same occupation under different names, seniority levels or employers — that is how the industry actually talks.</Body>
        {careers.slice(0, shown).map((c) => <CareerRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />)}
        {shown < careers.length ? (
          <CtaButton label={`SHOW ${Math.min(PAGE * 2, careers.length - shown)} MORE · ${careers.length - shown} LEFT`} onPress={() => setShown(shown + PAGE * 2)} />
        ) : null}
      </View>

      <View style={styles.after}>
        {/* Primary return follows where the user came from, so it mirrors the
            header back rather than pushing a new screen: from results/list a
            plain goBack; from elsewhere a jump to results (if any) or the
            Finder. */}
        {params.from === 'results' ? (
          <CtaButton label="BACK TO RESULTS" tone="green" onPress={() => navigation.goBack()} />
        ) : params.from === 'browse' ? (
          <CtaButton label="BACK TO ALL FAMILIES" tone="green" onPress={() => navigation.goBack()} />
        ) : hasResults ? (
          <CtaButton label="SEE MY RESULTS" tone="green" onPress={() => navigation.navigate('CareerFinderResults')} />
        ) : (
          <CtaButton label="TAKE THE CAREER FINDER" tone="green" onPress={() => navigation.navigate('CareerFinder')} />
        )}
        <LinkRow>
          {hasResults ? <TextLink label="Retake the Career Finder" onPress={() => navigation.navigate('CareerFinder')} muted /> : null}
          <TextLink label="Suggest a correction" onPress={correction} muted a11y="Suggest a correction. Opens your mail app with this family named." />
        </LinkRow>
      </View>
    </FinderShell>
  );
}

function CareerRow({ c, open, onToggle }: { c: Career; open: boolean; onToggle: () => void }) {
  return (
    <View style={styles.careerCard}>
      <Pressable onPress={onToggle} style={styles.careerRow} accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open} accessibilityLabel={`${c.title}, ${CENTRALITY[c.centrality].label}${c.regulated ? ', licensed or credentialed occupation' : ''}`}>
        <Text style={styles.careerChevron}>{open ? '▾' : '▸'}</Text>
        <Text style={styles.careerTitle} numberOfLines={2}>{c.title}</Text>
        <View style={styles.tags}>
          {c.regulated ? <View style={styles.lic}><Text style={styles.licText}>LICENSED</Text></View> : null}
          <CentralityChip value={c.centrality} />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.careerBody}>
          {c.alternates.length ? <Text style={styles.detail}><Text style={styles.detailLabel}>ALSO CALLED  </Text>{c.alternates.join(' · ')}</Text> : null}
          <Text style={styles.detail}><Text style={styles.detailLabel}>KIND OF ROLE  </Text>{c.titleClass} · {c.orientation}</Text>
          <Text style={styles.detail}><Text style={styles.detailLabel}>HOW PEOPLE WORK  </Text>{c.workModel}</Text>
          <Text style={styles.detail}><Text style={styles.detailLabel}>TYPICAL PREPARATION  </Text>{c.preparation}</Text>
          <Text style={styles.detail}><Text style={styles.detailLabel}>AUDIO IN THIS ROLE  </Text>{CENTRALITY[c.centrality].explain}</Text>
          {c.regulated ? <Text style={[styles.detail, { color: '#ffb060' }]}>⚠ Licensed, credentialed or restricted-entry occupation in many jurisdictions. Academy study does not lead to that licence or credential — verify requirements with the licensing body or employer where you live.</Text> : null}
          {c.professionalEngineer ? <Text style={[styles.detail, { color: '#ffb060' }]}>⚠ In many jurisdictions, offering engineering services to the public or sealing reports requires a Professional Engineer licence.</Text> : null}
          <Text style={[styles.detail, { color: colors.textMuted }]}>{c.status}. Common pathways are described, not mandatory requirements.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rankLine: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  example: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22 },
  pathLine: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  startHere: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.8, marginTop: 2 },
  topicRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4, minHeight: 32 },
  topicCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 14, textAlign: 'center' },
  topicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary },
  sources: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  careerCard: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#232323', borderRadius: 9, overflow: 'hidden' },
  careerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8, paddingHorizontal: 12 },
  careerChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSub, width: 12 },
  careerTitle: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  tags: { alignItems: 'flex-end', gap: 4 },
  lic: { borderWidth: 1, borderColor: 'rgba(255,138,30,.6)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: '#2a1706' },
  licText: { color: '#ffb060', fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1 },
  careerBody: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4, gap: 5, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  detail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  detailLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.3 },
  after: { gap: 8, marginTop: 4 },
});
