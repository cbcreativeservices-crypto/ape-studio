/**
 * ProductionPacketScreen — the project's packet, in the app (2026-10-04,
 * design review #5).
 *
 * The packet is the payoff of both production labs, and until now it existed
 * only as a PDF: a learner on a build without printing never saw it at all, and
 * "everything is readable on these screens" was only true field by field across
 * six to eight stages. This screen draws the WHOLE document.
 *
 * ONE DEFINITION OF THE DOCUMENT. `buildPacketModel` (features/production/
 * packet.ts) builds the packet as data; the PDF's HTML is a rendering of that
 * model and so is this screen. What the learner reads here is what they print.
 * (A WebView of the HTML would not run in the browser preview, and a second
 * description of the document would drift.)
 *
 * WHAT'S LEFT comes first, under the verdict: every stage that still has a
 * required decision, a blocker or a finding, each a way straight into that
 * stage. Labs never end on a dead end; this is the production labs' end screen.
 *
 * Share/PDF stays behind the optionalModule honesty gate (`isPdfAvailable`):
 * on a build without printing the control is not offered, and the screen says
 * plainly that this page is the whole packet.
 *
 * Document layout (prose, no live display), text ≥ 11 pt. Nothing here
 * auto-appears (Low-Light).
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { BACK_HIT_SLOP } from '../../../components/backHitSlop';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { safeGoBack } from '../../../lib/safeGoBack';
import { resolveLab } from '../../../features/production/schema';
import { projectLeft, readProject, stageLeftLine } from '../../../features/production/readiness';
import {
  buildPacketModel,
  emptyText,
  exportPacketPdf,
  isPdfAvailable,
  type PacketBody,
  type PacketNotice,
} from '../../../features/production/packet';
import { projectStore } from '../../../features/production/projectStore';
import type { ProductionProject } from '../../../features/production/types';
import { PATHWAY_LABEL } from '../../../features/production/types';
import { authoredStage, labDef } from '../../../features/production/labs';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'ProductionPacket'>;

export function ProductionPacketScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { lab, projectId } = useRoute<R>().params;
  const def = labDef(lab);

  const [project, setProject] = useState<ProductionProject | null>(null);
  /** Three faces (K2): still loading, not on this phone, and could not be read. */
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing' | 'unreadable'>('loading');
  const loadSeq = useRef(0);

  // Re-read on focus: the stage screens write through the store, so coming
  // back must show the packet as it now is. Newest read wins.
  const load = useCallback(async () => {
    const my = ++loadSeq.current;
    const all = await projectStore().tryLoad(lab);
    if (my !== loadSeq.current) return;
    if (!all) {
      // Keep a copy already on screen, and say it may be out of date.
      setLoadState('unreadable');
      return;
    }
    const p = all.find((x) => x.id === projectId) ?? null;
    setProject(p);
    setLoadState(p ? 'ready' : 'missing');
  }, [lab, projectId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const built = useMemo(() => {
    if (!project || !def) return null;
    try {
      const authored = def.outline
        .map((o) => authoredStage(lab, o.stageId))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
      const stages = resolveLab(authored, project.pathway, project.values);
      const report = readProject(stages, project);
      return { stages, report, model: buildPacketModel({ project, stages, report }), left: projectLeft(report) };
    } catch {
      return null; // unreadable, never an empty packet
    }
  }, [project, def, lab]);

  // One export at a time (the house latch): a double tap printed twice and iOS
  // refused the second share sheet.
  const share = useLatchedPress(async () => {
    if (!project || !built) return;
    const res = await exportPacketPdf({ project, stages: built.stages, report: built.report });
    if (res.ok) return;
    notify(
      'Packet not shared',
      res.reason === 'needs_build'
        ? 'Printing to PDF isn’t available on this device. This screen is the whole packet.'
        : res.reason === 'no_share_target'
          ? 'This device has nowhere to send the file.'
          : 'The packet could not be produced. Nothing in your project was changed.',
    );
  });

  const labWord = (def?.title ?? 'Production').replace(/^Audio /, '').toUpperCase();
  const stale = loadState === 'unreadable' && project !== null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => safeGoBack(navigation)} hitSlop={BACK_HIT_SLOP} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{`${labWord} · YOUR PACKET`}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {def?.packetName ?? 'Packet'}
          </Text>
        </View>
        <AccuracyNote variant="practice" compact />
      </View>

      {!project || !built ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {project
              ? 'This packet could not be worked out from the saved answers just now. Your answers are unchanged — go back and open it again.'
              : loadState === 'unreadable'
                ? 'This project could not be read on this device just now. Go back and open it again.'
                : loadState === 'missing'
                  ? 'This project is not on this device. Production projects are saved on the phone that created them.'
                  : 'Opening the packet…'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={readingColumn}>
            {stale ? (
              <Text style={styles.staleNote}>
                Your saved answers could not be re-read just now, so this is the last copy read and may be out of date.
                Leave this screen and open it again.
              </Text>
            ) : null}

            <Text style={styles.docTitle} accessibilityRole="header">
              {built.model.title}
            </Text>
            <Text style={styles.docSub}>{`${built.model.projectName} · ${PATHWAY_LABEL[project.pathway]}`}</Text>

            <View style={[styles.verdict, { borderColor: verdictTint(built.model.verdict) }]}>
              <Text style={[styles.verdictText, { color: verdictTint(built.model.verdict) }]}>
                {stale ? 'Could not be re-read just now' : built.model.verdictLine}
              </Text>
            </View>

            {/* ── WHAT'S LEFT ─────────────────────────────────────────────── */}
            <Text style={styles.h2} accessibilityRole="header">
              WHAT’S LEFT
            </Text>
            {built.left.length === 0 ? (
              <Text style={styles.para}>
                Nothing is left that this plan requires: every stage has its required decisions made, nothing blocks
                it, and nothing is flagged for you to look at. Any notes printed below are for information.
              </Text>
            ) : (
              built.left.map((s) => (
                <Pressable
                  key={s.stageId}
                  style={styles.leftRow}
                  onPress={() => navigation.navigate('ProductionStage', { lab, projectId: project.id, stageId: s.stageId })}
                  accessibilityRole="button"
                  accessibilityLabel={`Stage ${s.num}, ${s.title}: ${stageLeftLine(s)}. Open the stage.`}
                >
                  <Text style={styles.leftNum}>{s.num}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leftTitle}>{s.title}</Text>
                    <Text style={[styles.leftLine, s.blockers > 0 && { color: colors.red }]}>{stageLeftLine(s)}</Text>
                  </View>
                  <Text style={styles.go}>›</Text>
                </Pressable>
              ))
            )}

            {/* ── SHARE, behind the honesty gate ──────────────────────────── */}
            {isPdfAvailable() ? (
              <Pressable
                style={styles.shareBtn}
                onPress={share}
                accessibilityRole="button"
                accessibilityLabel={`Share the ${def?.packetName ?? 'packet'} as a PDF`}
              >
                <Text style={styles.shareText}>SHARE AS PDF</Text>
              </Pressable>
            ) : (
              <Text style={styles.para}>Printing to PDF isn’t available on this device. This screen is the whole packet.</Text>
            )}

            {/* ── THE DOCUMENT ────────────────────────────────────────────── */}
            <View style={styles.control}>
              {built.model.control.map(([k, v]) => (
                <View key={k} style={styles.controlRow}>
                  <Text style={styles.controlKey}>{k}</Text>
                  <Text style={styles.controlVal}>{v}</Text>
                </View>
              ))}
            </View>

            {built.model.blockers.length ? (
              <>
                <Text style={styles.h2} accessibilityRole="header">
                  MUST BE RESOLVED BEFORE PROCEEDING
                </Text>
                {built.model.blockers.map((b, i) => (
                  <Issue key={`b${i}`} title={b.title} detail={b.detail} blocker />
                ))}
              </>
            ) : null}

            {built.model.accepted.length ? (
              <>
                <Text style={styles.h2} accessibilityRole="header">
                  ACCEPTED CONDITIONS
                </Text>
                {built.model.accepted.map((a, i) => (
                  <View key={`a${i}`} style={styles.cond}>
                    <Text style={styles.issueTitle}>{a.title}</Text>
                    <Text style={styles.issueDetail}>{`Accepted by ${a.acceptedBy} — ${a.reason}`}</Text>
                  </View>
                ))}
              </>
            ) : null}

            {built.model.stages.map((st) => (
              <View key={st.stageId} style={styles.stage}>
                <Text style={styles.h2Stage} accessibilityRole="header">{`${st.num}. ${st.title}`}</Text>
                {st.status ? <Text style={styles.stageStatus}>{st.status}</Text> : null}
                {st.notices.map((n, i) => (
                  <Notice key={`sn${i}`} notice={n} />
                ))}
                {st.sections.map((sec, si) => (
                  <View key={`s${si}`} style={styles.section}>
                    <Text style={styles.h3} accessibilityRole="header">
                      {sec.title}
                    </Text>
                    {sec.notices.map((n, i) => (
                      <Notice key={`n${i}`} notice={n} />
                    ))}
                    {sec.fields.map((f, fi) => (
                      <View key={`f${fi}`} style={styles.field}>
                        <Text style={styles.fieldLabel}>{f.label}</Text>
                        <Body body={f.body} />
                      </View>
                    ))}
                  </View>
                ))}
                {st.issues.map((x, i) => (
                  <Issue key={`i${i}`} title={x.title} detail={x.detail} />
                ))}
              </View>
            ))}

            <Text style={styles.foot}>{built.model.foot}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function verdictTint(v: 'ready' | 'ready_with_conditions' | 'not_ready'): string {
  return v === 'ready' ? colors.green : v === 'ready_with_conditions' ? colors.amber : colors.red;
}

/** One answer, as the packet reads it. A table becomes one card per row. */
function Body({ body }: { body: PacketBody }) {
  switch (body.kind) {
    case 'na':
      return <Text style={styles.na}>{`Not applicable — ${body.reason}`}</Text>;
    case 'empty':
      return <Text style={styles.emptyVal}>{emptyText(body.required)}</Text>;
    case 'table':
      return (
        <View style={{ gap: 6, marginTop: 3 }}>
          {body.rows.map((row, ri) => {
            const cells = row
              .map((c, ci) => [body.columns[ci] ?? '', c.trim()] as const)
              .filter(([, c]) => c !== '');
            return (
              <View key={ri} style={styles.tableRow} accessibilityLabel={`Row ${ri + 1} of ${body.rows.length}`}>
                <Text style={styles.tableRowHead}>{`ROW ${ri + 1}`}</Text>
                {cells.length ? (
                  cells.map(([col, val], ci) => (
                    <Text key={ci} style={styles.tableCell}>
                      <Text style={styles.tableCol}>{`${col}: `}</Text>
                      {val}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.emptyVal}>Blank row</Text>
                )}
              </View>
            );
          })}
        </View>
      );
    default:
      return <Text style={styles.val}>{body.text}</Text>;
  }
}

function Notice({ notice }: { notice: PacketNotice }) {
  const tint = notice.kind === 'qualified' ? colors.red : notice.kind === 'safety' ? colors.orange : colors.textSub;
  const head = notice.kind === 'qualified' ? 'QUALIFIED PERSONNEL' : notice.kind === 'safety' ? 'SAFETY' : 'LEGAL';
  return (
    <View style={[styles.notice, { borderLeftColor: tint }]}>
      <Text style={[styles.noticeHead, { color: tint }]}>{head}</Text>
      <Text style={styles.noticeText}>{notice.text}</Text>
    </View>
  );
}

function Issue({ title, detail, blocker }: { title: string; detail: string; blocker?: boolean }) {
  return (
    <View style={[styles.issue, blocker && { borderLeftColor: colors.red }]}>
      <Text style={[styles.issueTitle, blocker && { color: colors.red }]}>{title}</Text>
      <Text style={styles.issueDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
  },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.amber, marginTop: -4 },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textMuted },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, color: colors.textPrimary },

  body: { padding: 16 },
  staleNote: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.orange, marginBottom: 10 },
  docTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textPrimary },
  docSub: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSub, marginTop: 2, marginBottom: 12 },
  verdict: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6 },
  verdictText: { fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 19 },

  h2: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1, color: colors.amberLabel, marginTop: 18, marginBottom: 8 },
  para: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub, marginBottom: 6 },

  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 9,
    backgroundColor: '#121215',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 7,
    minHeight: 48,
  },
  leftNum: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textMuted, width: 15 },
  leftTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textPrimary },
  leftLine: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  go: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber },

  shareBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.1)',
    borderRadius: 9,
    paddingVertical: 13,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  shareText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.1, color: colors.amber },

  control: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, marginTop: 14, overflow: 'hidden' },
  controlRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.hairlineDim },
  controlKey: {
    width: 110,
    fontFamily: fonts.barlowSemiBold,
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: 6,
    paddingHorizontal: 9,
    backgroundColor: '#141418',
  },
  controlVal: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSecondary, paddingVertical: 6, paddingHorizontal: 9 },

  stage: { marginTop: 22 },
  h2Stage: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, color: colors.textPrimary, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  stageStatus: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 4, marginBottom: 4 },
  section: { marginTop: 10 },
  h3: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, marginBottom: 6 },
  field: { marginBottom: 9 },
  fieldLabel: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: colors.textSecondary },
  val: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub },
  na: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textMuted, fontStyle: 'italic' },
  emptyVal: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textMutedDeep, fontStyle: 'italic' },
  tableRow: { borderLeftWidth: 2, borderLeftColor: colors.hairlineAlt, paddingLeft: 9, paddingVertical: 2 },
  tableRowHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.textMuted },
  tableCell: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },
  tableCol: { fontFamily: fonts.barlowSemiBold, color: colors.textSecondary },

  notice: { borderLeftWidth: 3, backgroundColor: '#111114', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, marginVertical: 6 },
  noticeHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.9, marginBottom: 2 },
  noticeText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },

  issue: { borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#111114', borderRadius: 6, padding: 10, marginTop: 7 },
  cond: { borderLeftWidth: 3, borderLeftColor: colors.textMuted, backgroundColor: '#111114', borderRadius: 6, padding: 10, marginTop: 7 },
  issueTitle: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 2 },
  issueDetail: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub },

  foot: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textMuted, marginTop: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairline },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, textAlign: 'center' },
});
