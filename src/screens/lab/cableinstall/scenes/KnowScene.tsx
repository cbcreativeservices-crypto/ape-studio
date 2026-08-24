/**
 * STAGE 2 — Know What You Are Installing (spec §9).
 *
 * (a) CABLE WORKBENCH — browsable reference cards for all 14 cable types:
 *     name, training tint, signal/application, permanent/temporary, and the
 *     primary installation concerns to check before routing. Browsing is
 *     encouraged and tracked (✓) but NEVER gated — no memorization test.
 * (b) SCENARIO DRILL — three real installations; the learner identifies the
 *     cable class, temporary vs permanent, the likely pathway and the key
 *     risk; the documentation need is then revealed (records ritual, §29).
 *
 * Completion (honesty rule, §38): all three scenarios fully answered →
 * onComplete({ routing, protection }) scored from the learner's own answers
 * (identification calls → routing, risk calls → protection).
 *
 * Accessibility: every choice is a labeled button (no color-only state, no
 * drag); verdicts announce via VerdictBanner; targets ≥44dp.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { CiSection, RuleFeedback, announceComplete } from '../bits';
import { OptionChip, VerdictBanner } from '../../cable/lessons/bits';
import { CI_CABLE_TYPES, cableTypeById, type CiCableClass, type CiCableType } from '../data/cableTypes';
import { CI_ID_SCENARIOS, type CiIdScenario } from '../data/scenarios';
import { clamp100, type CiDimScores } from '../engine/score';
import type { CiModuleProps } from '../registry';

/* ── drill authoring (display-side only — answers come from scenario data) ─ */

/** Four plausible cable-class options per scenario (correct one included;
 *  position varies so first-chip guessing never pays). */
const CLASS_CHOICES: Record<string, CiCableClass[]> = {
  'mic-perm': ['line', 'mic', 'multipair', 'unbalanced'],
  'foh-temp': ['multipair', 'tacfiber', 'snake', 'mic'],
  'dante-perm': ['network', 'coax', 'poe', 'control'],
};

/** Display order for the authored pathway/risk options (data keeps the
 *  correct answer first — reorder on screen so it isn't always chip #1). */
const OPT_ORDER: Record<string, { pathway: number[]; risk: number[] }> = {
  'mic-perm': { pathway: [1, 0, 2], risk: [2, 0, 1] },
  'foh-temp': { pathway: [0, 2, 1], risk: [1, 2, 0] },
  'dante-perm': { pathway: [2, 1, 0], risk: [1, 0, 2] },
};

/** Per-scenario verdict explanations (2–4 sentence rhythm, §23). */
const DRILL_COPY: Record<string, { use: string; pathway: string; risk: string }> = {
  'mic-perm': {
    use: 'Installed for the building’s life — pathway choice, space rating and records all follow from that.',
    pathway: 'A permanent low-level line lives in the building’s cabling pathways, rated for every space it crosses.',
    risk: 'Mic level is the most vulnerable signal in the building — interference exposure and shield integrity drive the whole installation method.',
  },
  'foh-temp': {
    use: 'One night: deployed, protected from the show’s traffic, then struck. Temporary changes the solutions, not the standard of care.',
    pathway: 'Perimeter first, and a protected crossing only where one is truly unavoidable — walking routes stay walking routes.',
    risk: 'Feet, carts and doors are tonight’s hazard — mechanical protection outranks every other concern for this run.',
  },
  'dante-perm': {
    use: 'Permanent network infrastructure — installed, documented and serviceable like any telecom run.',
    pathway: 'Data rides the telecom pathway system the project designed — never another trade’s pipes or ducts.',
    risk: 'The pairs’ geometry IS the performance — crush and over-tension quietly degrade the link long before anything looks broken.',
  },
};

type DrillAnswers = { cls?: CiCableClass; use?: 'permanent' | 'temporary'; pathway?: string; risk?: string };

const allAnswered = (a: Record<string, DrillAnswers>) =>
  CI_ID_SCENARIOS.every((s) => {
    const g = a[s.id];
    return g?.cls != null && g.use != null && g.pathway != null && g.risk != null;
  });

/** Identification calls (what / how long / where) → routing; risk calls → protection. */
function drillScore(a: Record<string, DrillAnswers>) {
  let idc = 0;
  let riskc = 0;
  for (const s of CI_ID_SCENARIOS) {
    const g = a[s.id] ?? {};
    if (g.cls === s.cable) idc++;
    if (g.use === s.use) idc++;
    if (g.pathway === s.pathway) idc++;
    if (g.risk === s.keyRisk) riskc++;
  }
  const dims: CiDimScores = { routing: clamp100((idc / 9) * 100), protection: clamp100((riskc / 3) * 100) };
  return { idc, riskc, dims };
}

const perScenarioScore = (s: CiIdScenario, g: DrillAnswers) =>
  (g.cls === s.cable ? 1 : 0) + (g.use === s.use ? 1 : 0) + (g.pathway === s.pathway ? 1 : 0) + (g.risk === s.keyRisk ? 1 : 0);

const useLabel = (u: CiCableType['use']) => (u === 'permanent' ? 'PERMANENT' : u === 'temporary' ? 'TEMPORARY' : 'PERM · TEMP');

/* ── workbench card ─────────────────────────────────────────────────────── */
function TypeCard({ t, open, viewed, onPress }: { t: CiCableType; open: boolean; viewed: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.typeCard, viewed && styles.typeCardSeen]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${t.name}, ${useLabel(t.use).toLowerCase()}${viewed ? ', reviewed' : ''}`}
    >
      <View style={styles.typeHead}>
        <View style={[styles.swatch, { backgroundColor: t.tint }]} />
        <Text style={[styles.typeName, viewed && { color: colors.textPrimary }]} numberOfLines={1}>
          {viewed ? '✓ ' : ''}
          {t.name}
        </Text>
        <Text style={styles.useChip}>{useLabel(t.use)}</Text>
      </View>
      {open ? (
        <View style={styles.typeBody}>
          <Text style={styles.typeSignal}>{t.signal}</Text>
          {t.useNote ? <Text style={styles.typeNote}>{t.useNote}</Text> : null}
          <Text style={styles.concernHead}>CHECK BEFORE ROUTING</Text>
          {t.concerns.map((c) => (
            <Text key={c} style={styles.concern}>
              ·  {c}
            </Text>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

/* ── the scene ──────────────────────────────────────────────────────────── */
export function KnowScene({ completed, onComplete, openSources }: CiModuleProps) {
  const [openId, setOpenId] = useState<CiCableClass | null>(null);
  const [viewed, setViewed] = useState<Set<CiCableClass>>(() => new Set(completed ? CI_CABLE_TYPES.map((t) => t.id) : []));
  const [ans, setAns] = useState<Record<string, DrillAnswers>>({});
  const [fired, setFired] = useState(completed);

  const pick = <K extends keyof DrillAnswers>(sid: string, field: K, value: DrillAnswers[K]) => {
    const cur = ans[sid] ?? {};
    if (cur[field] != null) return; // each call locks once made
    const next = { ...ans, [sid]: { ...cur, [field]: value } };
    setAns(next);
    if (!fired && allAnswered(next)) {
      setFired(true);
      const { dims } = drillScore(next);
      announceComplete('Stage 2 complete. Installation method follows cable type and use case.');
      onComplete(dims);
    }
  };

  const done = allAnswered(ans);
  const summary = done ? drillScore(ans) : null;

  return (
    <View style={{ gap: 14 }}>
      <CiSection title={`THE CABLE WORKBENCH — ${CI_CABLE_TYPES.length} TYPES, TAP TO BROWSE`}>
        <Text style={styles.tintNote}>Training visualization colors — actual field cable colors vary.</Text>
        <View style={{ gap: 7 }}>
          {CI_CABLE_TYPES.map((t) => (
            <TypeCard
              key={t.id}
              t={t}
              open={openId === t.id}
              viewed={viewed.has(t.id)}
              onPress={() => {
                setOpenId(openId === t.id ? null : t.id);
                setViewed((s) => new Set(s).add(t.id));
              }}
            />
          ))}
        </View>
        <Text style={styles.browseLine} accessibilityLiveRegion="polite">
          {viewed.size} of {CI_CABLE_TYPES.length} reviewed — browse freely; the drill below is what completes the stage.
        </Text>
      </CiSection>

      <CiSection title="SCENARIO DRILL — WHAT ARE YOU INSTALLING?">
        <Text style={styles.lead}>
          {'Three runs land on your bench. For each: what is it, how long does it stay, where does it go, and what can hurt it? Every answer locks when you make it.'}
        </Text>
        {CI_ID_SCENARIOS.map((s, i) => {
          const g = ans[s.id] ?? {};
          const copy = DRILL_COPY[s.id];
          const correctType = cableTypeById(s.cable);
          const order = OPT_ORDER[s.id];
          return (
            <View key={s.id} style={styles.scnCard}>
              <Text style={styles.scnTag}>INSTALLATION {i + 1} OF {CI_ID_SCENARIOS.length}</Text>
              <Text style={styles.scnPrompt}>{s.prompt}</Text>

              <Text style={styles.q}>1 · WHAT CABLE IS THIS?</Text>
              <View style={styles.chipWrap}>
                {CLASS_CHOICES[s.id].map((cid) => {
                  const t = cableTypeById(cid);
                  return (
                    <OptionChip
                      key={cid}
                      label={t.name}
                      active={g.cls === cid}
                      disabled={g.cls != null && g.cls !== cid}
                      onPress={() => pick(s.id, 'cls', cid)}
                    />
                  );
                })}
              </View>
              {g.cls != null ? (
                <VerdictBanner verdict={g.cls === s.cable ? 'correct' : 'wrong'} text={`${correctType.name}: ${correctType.signal}.`} />
              ) : null}

              {g.cls != null ? (
                <>
                  <Text style={styles.q}>2 · TEMPORARY OR PERMANENT?</Text>
                  <View style={styles.chipWrap}>
                    {(['permanent', 'temporary'] as const).map((u) => (
                      <OptionChip
                        key={u}
                        label={u.toUpperCase()}
                        active={g.use === u}
                        disabled={g.use != null && g.use !== u}
                        onPress={() => pick(s.id, 'use', u)}
                      />
                    ))}
                  </View>
                  {g.use != null ? (
                    <VerdictBanner
                      verdict={g.use === s.use ? 'correct' : 'wrong'}
                      text={`${g.use === s.use ? '' : `This run is ${s.use.toUpperCase()}. `}${copy.use}`}
                    />
                  ) : null}
                </>
              ) : null}

              {g.use != null ? (
                <>
                  <Text style={styles.q}>3 · THE LIKELY PATHWAY?</Text>
                  <View style={styles.chipCol}>
                    {order.pathway.map((oi) => {
                      const label = s.pathwayOptions[oi];
                      return (
                        <OptionChip
                          key={label}
                          label={label}
                          active={g.pathway === label}
                          disabled={g.pathway != null && g.pathway !== label}
                          onPress={() => pick(s.id, 'pathway', label)}
                        />
                      );
                    })}
                  </View>
                  {g.pathway != null ? (
                    <VerdictBanner
                      verdict={g.pathway === s.pathway ? 'correct' : 'wrong'}
                      text={`${g.pathway === s.pathway ? '' : `The call: “${s.pathway}.” `}${copy.pathway}`}
                    />
                  ) : null}
                </>
              ) : null}

              {g.pathway != null ? (
                <>
                  <Text style={styles.q}>4 · THE KEY RISK?</Text>
                  <View style={styles.chipCol}>
                    {order.risk.map((oi) => {
                      const label = s.keyRiskOptions[oi];
                      return (
                        <OptionChip
                          key={label}
                          label={label}
                          active={g.risk === label}
                          disabled={g.risk != null && g.risk !== label}
                          onPress={() => pick(s.id, 'risk', label)}
                        />
                      );
                    })}
                  </View>
                  {g.risk != null ? (
                    <VerdictBanner
                      verdict={g.risk === s.keyRisk ? 'correct' : 'wrong'}
                      text={`${g.risk === s.keyRisk ? '' : `The key risk: “${s.keyRisk}.” `}${copy.risk}`}
                    />
                  ) : null}
                </>
              ) : null}

              {g.risk != null ? (
                <View style={styles.docBlock}>
                  <Text style={styles.docHead}>THEN THE PAPERWORK — {perScenarioScore(s, g)}/4 ON THIS ONE</Text>
                  <RuleFeedback ruleId="label-both-ends" verdict="info" short={s.doc} openSources={openSources} />
                </View>
              ) : null}
            </View>
          );
        })}

        {done && summary ? (
          <View style={styles.lessonCard}>
            <Text style={styles.lessonHead}>INSTALLATION METHOD FOLLOWS CABLE TYPE AND USE CASE</Text>
            <Text style={styles.lessonBody}>
              {'Identify what the cable is, what it carries, and how long it stays — the pathway, the protection and the paperwork all follow from those three answers. Same room, different cable or different duration: different installation.'}
            </Text>
            <Text style={styles.lessonScore}>
              {summary.idc + summary.riskc} of 12 calls correct — replay any time.
            </Text>
          </View>
        ) : null}
      </CiSection>
    </View>
  );
}

const styles = StyleSheet.create({
  tintNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub, fontStyle: 'italic' },
  lead: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  browseLine: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  /* workbench */
  typeCard: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', paddingVertical: 12, paddingHorizontal: 12, gap: 8 },
  typeCardSeen: { borderColor: 'rgba(55,224,95,.3)' },
  typeHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  swatch: { width: 13, height: 13, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' },
  typeName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textSecondary },
  useChip: { fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1, color: colors.textSub, borderWidth: 1, borderColor: '#2c2c33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeBody: { gap: 5, borderTopWidth: 1, borderTopColor: '#222228', paddingTop: 8 },
  typeSignal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textPrimary },
  typeNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.amberLabel },
  concernHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub, marginTop: 2 },
  concern: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  /* drill */
  scnCard: { gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  scnTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.5, color: colors.amberLabel },
  scnPrompt: { fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 20, color: colors.textPrimary },
  q: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.textSecondary, marginTop: 2 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chipCol: { gap: 7 },
  docBlock: { gap: 6, marginTop: 2 },
  docHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.textSub },
  /* lesson */
  lessonCard: { gap: 6, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', padding: 12 },
  lessonHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  lessonBody: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  lessonScore: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.amberLabel },
});
