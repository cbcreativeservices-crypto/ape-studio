/**
 * Lesson 7 — Power Connectors & Electrical Safety (owner spec §5.7).
 * Data-driven from data/lesson07.ts + the verified power records; matches the
 * Lesson 1 exemplar: tap-only, retry-until-correct, and completion credit
 * marked ONLY when all four knowledge-check questions are genuinely solved
 * (markLabUnit → af_cables/l07_power — the persisted SAFETY_UNITS belong to
 * Lesson 12, never here).
 *
 * Tone mandate: visually clear and serious, never frightening. Sections:
 * (a) AC mains vs low-voltage DC + the three conductor roles (mains_wall
 *     record is the single source; identification only — no wiring guidance),
 * (b) card browser over the 10 core power records (shared ConnectorCard),
 * (c) the never list — prohibited practices as flat statements,
 * (d) qualified-person recognition (view-only; tier badge draws the boundary).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { markLabUnit } from '../../../../features/lab/labCompletion';
import { colors, fonts } from '../../../../theme/tokens';
import { CheckQuestion } from '../../foundations/bits';
import type { ConnectorId } from '../cableTypes';
import { CONNECTOR_INKS, type ConnectorInk } from '../connectorInks';
import {
  L07_CHECKS,
  L07_DONE,
  L07_INKS,
  L07_LEAD,
  L07_LESSON,
  NEVER_ITEMS,
  POWER_GROUPS,
  QP_CONNECTORS,
  QP_LEAD,
  type L07Group,
  type L07GroupId,
} from '../data/lesson07';
import { getConnector } from '../data/registry';
import {
  CheckDoneBanner,
  DetailCard,
  Eyebrow,
  LessonBanner,
  OptionChip,
  PrincipleBanner,
  lessonStyles as s,
} from './bits';
import { ConnectorCard, InkLegend } from './connectorCard';

export function Lesson07Body() {
  // ── (a) conductor-role explorer — the mains_wall record is the ONE source ──
  const mains = getConnector('mains_wall');
  const roles = mains?.pinouts[0]?.contacts ?? [];
  const [roleIdx, setRoleIdx] = useState(0);
  const role = roles[roleIdx];

  // ── (b) power connector browser ────────────────────────────────────────────
  const [groupId, setGroupId] = useState<L07GroupId>('wall_iec');
  const group = POWER_GROUPS.find((g) => g.id === groupId) ?? POWER_GROUPS[0];
  const [connId, setConnId] = useState<ConnectorId>('mains_wall');
  const rec = getConnector(connId);

  const selectGroup = useCallback((g: L07Group) => {
    setGroupId(g.id);
    const first = g.connectors[0];
    if (first) setConnId(first.id);
  }, []);

  // ── (d) qualified-person recognition (view-only) ───────────────────────────
  const [qpId, setQpId] = useState<ConnectorId>('nema_twist_lock');
  const qpRec = getConnector(qpId);

  // ── knowledge check → unit credit ──────────────────────────────────────────
  const [solvedFlags, setSolvedFlags] = useState<boolean[]>(() => L07_CHECKS.map(() => false));
  const marked = useRef(false);
  const allSolved = solvedFlags.every(Boolean);

  const solveOne = useCallback((idx: number) => {
    setSolvedFlags((prev) => {
      if (prev[idx]) return prev;
      const next = prev.slice();
      next[idx] = true;
      return next;
    });
  }, []);

  useEffect(() => {
    if (allSolved && !marked.current) {
      marked.current = true;
      // Genuine solve of ALL FOUR safety questions → lesson unit credit
      // (§1.7 honesty: marked here and nowhere else; never on view/mount).
      markLabUnit('af_cables', 'l07_power');
    }
  }, [allSolved]);

  return (
    <>
      <PrincipleBanner />

      {/* ── (a) AC mains vs low-voltage DC ─────────────────────────────────── */}
      <Eyebrow text="TWO KINDS OF POWER" />
      <View style={{ gap: 8 }}>
        {L07_LEAD.map((k) => (
          <DetailCard key={k.title}>
            <Text style={s.cardHead}>{k.title}</Text>
            <Text style={s.body}>{k.body}</Text>
          </DetailCard>
        ))}
      </View>

      <Eyebrow text="THREE CONDUCTORS, THREE ROLES" />
      <Text style={s.body}>
        Every grounded mains cord carries the same three roles. Tap each contact of the wall plug to identify its job —
        identification is the skill here; wiring is not.
      </Text>
      {/* ART SLOT: owner-supplied NEMA 5-15 plug-face illustration (narrow
          blade / wide blade / round pin, labeled) mounts here — the tappable
          contact chips below carry the interaction on their own. */}
      {roles.length ? (
        <>
          <View style={s.chipWrap}>
            {roles.map((c, i) => (
              <OptionChip key={c.label} label={c.label.toUpperCase()} active={i === roleIdx} onPress={() => setRoleIdx(i)} />
            ))}
          </View>
          {role ? (
            <DetailCard>
              <View style={st.inkRow}>
                <View style={[st.inkDot, { backgroundColor: CONNECTOR_INKS[role.ink as ConnectorInk] ?? colors.textSub }]} />
                <Text style={[s.cardTitle, { flex: 1 }]}>{role.role}</Text>
              </View>
              {role.note ? <Text style={s.body}>{role.note}</Text> : null}
              <Text style={s.hint}>Identification only — cord wiring and plug termination are qualified-person work.</Text>
            </DetailCard>
          ) : null}
        </>
      ) : null}

      {/* ── (b) card browser over the 10 core power records ────────────────── */}
      <Eyebrow text="POWER CONNECTOR BROWSER · 10 RECORDS" />
      <Text style={s.body}>
        Ten power connectors in three families. Pick a family, then a connector — and read each card’s cautions before
        anything else.
      </Text>
      <View style={s.chipWrap}>
        {POWER_GROUPS.map((g) => (
          <OptionChip key={g.id} label={g.label} active={g.id === groupId} onPress={() => selectGroup(g)} />
        ))}
      </View>
      <Text style={s.hint}>{group.blurb}</Text>
      <View style={s.chipWrap}>
        {group.connectors.map((e) => (
          <OptionChip key={e.id} label={e.chip} active={e.id === connId} onPress={() => setConnId(e.id)} />
        ))}
      </View>
      <InkLegend inks={L07_INKS} />
      {rec ? <ConnectorCard rec={rec} /> : null}

      {/* ── (c) the never list ─────────────────────────────────────────────── */}
      <Eyebrow text="THE NEVER LIST" />
      <View style={st.neverCard} accessibilityRole="summary" accessibilityLabel="These are never acceptable">
        <Text style={st.neverTitle}>THESE ARE NEVER ACCEPTABLE</Text>
        <Text style={st.neverSub}>{'No exceptions, no workarounds, and no “just this once.”'}</Text>
        {NEVER_ITEMS.map((t) => (
          <View key={t} style={st.neverRow}>
            <Text style={st.neverGlyph}>✕</Text>
            <Text style={st.neverText}>{t}</Text>
          </View>
        ))}
      </View>

      {/* ── (d) qualified-person recognition — viewing only ────────────────── */}
      <Eyebrow text="RECOGNIZE — NEVER HANDLE" />
      <Text style={s.body}>{QP_LEAD}</Text>
      <View style={s.chipWrap}>
        {QP_CONNECTORS.map((e) => (
          <OptionChip key={e.id} label={e.chip} active={e.id === qpId} onPress={() => setQpId(e.id)} />
        ))}
      </View>
      {qpRec ? <ConnectorCard rec={qpRec} /> : null}

      {/* ── knowledge check (unit gate) ─────────────────────────────────────── */}
      <Eyebrow text={`KNOWLEDGE CHECK · ${L07_CHECKS.length} QUESTIONS`} />
      {L07_CHECKS.map((c, i) => (
        <CheckQuestion key={c.question} spec={c} onSolved={() => solveOne(i)} />
      ))}
      {allSolved ? <CheckDoneBanner text={L07_DONE} /> : null}

      <LessonBanner text={L07_LESSON} />
    </>
  );
}

const st = StyleSheet.create({
  inkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.25)',
    marginTop: 3,
  },
  // High-visibility prohibition card — serious, never frightening: flat
  // statements, glyph + words (never color alone), no dramatization.
  neverCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,94,.6)',
    backgroundColor: '#170d0c',
    padding: 12,
    gap: 8,
  },
  neverTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.6, color: '#ff8a6b' },
  neverSub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  neverRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  neverGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, color: '#ff8a6b', marginTop: 1 },
  neverText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textPrimary },
});
