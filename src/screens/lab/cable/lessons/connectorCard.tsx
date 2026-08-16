/**
 * ConnectorCard — THE shared renderer for a verified ConnectorRecord
 * (Lessons 3/5/6/7 all present connector cards through this one component so
 * every family reads identically).
 *
 * Renders ONLY what the verified data says — no copy of its own beyond
 * structural labels. Pin diagrams are owner-supplied artwork (ruling
 * 2026-08-15) — until they land, contacts render as labeled rows with ink
 * swatches (+ text labels, never color alone). ART SLOT comments mark the
 * mount points.
 */
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { connectorImageUrl } from '../connectorImages';
import { colors, fonts } from '../../../../theme/tokens';
import { CONNECTOR_INKS, CONNECTOR_INK_LABELS, type ConnectorInk } from '../connectorInks';
import type { ConnectorRecord, PinoutVariant } from '../cableTypes';

const CONFIDENCE_LABEL = {
  standard: 'STANDARD',
  convention: 'CONVENTION',
  'equipment-dependent': 'EQUIPMENT-DEPENDENT',
} as const;

function Section({ title, children, startOpen }: { title: string; children: React.ReactNode; startOpen?: boolean }) {
  const [open, setOpen] = useState(!!startOpen);
  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        hitSlop={{ top: 7, bottom: 7 }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title} section`}
        style={styles.sectionHead}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.caret}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((t) => (
        <Text key={t} style={styles.body}>{`•  ${t}`}</Text>
      ))}
    </>
  );
}

function Pinout({ v }: { v: PinoutVariant }) {
  return (
    <View style={styles.pinoutCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.pinoutApp}>{v.application}</Text>
        <Text style={[styles.confidence, v.confidence !== 'standard' && styles.confidenceVaries]}>
          {CONFIDENCE_LABEL[v.confidence]}
        </Text>
      </View>
      {v.contacts.map((c) => (
        <View key={`${v.id}-${c.label}`} style={styles.contactRow}>
          <View style={[styles.inkDot, { backgroundColor: CONNECTOR_INKS[c.ink as ConnectorInk] ?? colors.textSub }]} />
          <Text style={styles.contactLabel}>{c.label}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>{c.role}</Text>
            {c.note ? <Text style={styles.hint}>{c.note}</Text> : null}
          </View>
        </View>
      ))}
      {v.verifyAgainst ? <Text style={styles.verify}>{`Verify against: ${v.verifyAgainst}`}</Text> : null}
    </View>
  );
}

export function ConnectorCard({ rec }: { rec: ConnectorRecord }) {
  const hazard = rec.safety.level === 'mains' || rec.safety.level === 'speaker';
  // Existing glossary term image (owner ruling 2026-08-16) — renders nothing
  // for connectors not yet mapped; never a placeholder.
  const imageUri = connectorImageUrl(rec.id);
  return (
    <View style={styles.card}>
      {imageUri ? (
        <View
          style={styles.imageFrame}
          accessible
          accessibilityLabel={`Photograph of a ${rec.displayName} connector`}
        >
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        </View>
      ) : null}
      <Text style={styles.name}>{rec.displayName.toUpperCase()}</Text>
      {rec.aliases.length ? <Text style={styles.hint}>{`Also called: ${rec.aliases.join(' · ')}`}</Text> : null}
      {rec.tier !== 'core' ? (
        <Text style={styles.tierBadge}>
          {rec.tier === 'qualified-person' ? 'RECOGNITION ONLY — QUALIFIED PERSONS HANDLE THIS' : 'RECOGNITION LEVEL'}
        </Text>
      ) : null}

      {rec.safety.cautions.length ? (
        <View style={[styles.cautions, hazard && styles.cautionsHot]}>
          {rec.safety.cautions.map((c) => (
            <Text key={c} style={styles.cautionText}>{`⚠ ${c}`}</Text>
          ))}
        </View>
      ) : null}

      <Section title="CONTACTS & USES" startOpen>
        {rec.pinouts.length ? rec.pinouts.map((v) => <Pinout key={v.id} v={v} />) : null}
        <Text style={styles.kv}>
          <Text style={styles.k}>From: </Text>
          {rec.typicalSources.join(' · ')}
        </Text>
        <Text style={styles.kv}>
          <Text style={styles.k}>Into: </Text>
          {rec.typicalDestinations.join(' · ')}
        </Text>
        <Text style={styles.kv}>
          <Text style={styles.k}>Balanced: </Text>
          {rec.balanced === 'either' ? 'balanced or unbalanced — the equipment decides' : rec.balanced}
          <Text style={styles.k}>   Channels: </Text>
          {rec.channels}
        </Text>
      </Section>

      <Section title="CABLE BEHIND IT">
        {rec.constructionNote ? <Text style={styles.body}>{rec.constructionNote}</Text> : null}
      </Section>

      <Section title="CONNECTING IT">
        <Text style={styles.kv}>
          <Text style={styles.k}>Locking: </Text>
          {rec.locking.method === 'none' ? 'none (friction only)' : rec.locking.method.replace('_', '-')}
        </Text>
        {rec.locking.howToConfirm ? <Text style={styles.body}>{rec.locking.howToConfirm}</Text> : null}
        {rec.directionality ? <Text style={styles.body}>{rec.directionality}</Text> : null}
        <Text style={styles.kv}>
          <Text style={styles.k}>Live connection: </Text>
          {rec.hotPlug.rationale}
        </Text>
      </Section>

      <Section title="STRENGTHS & LIMITS">
        <Text style={styles.k}>ADVANTAGES</Text>
        <Bullets items={rec.advantages} />
        <Text style={styles.k}>LIMITATIONS</Text>
        <Bullets items={rec.limitations} />
      </Section>

      <Section title="MISTAKES & LOOK-ALIKES">
        <Bullets items={rec.commonMistakes} />
        {rec.notInterchangeableWith.map((n) => (
          <View key={n.otherName} style={styles.confuseCard}>
            <Text style={styles.k}>{`DO NOT CONFUSE WITH: ${n.otherName}`}</Text>
            <Text style={styles.body}>{n.why}</Text>
            <Text style={styles.body}>{n.consequence}</Text>
          </View>
        ))}
      </Section>

      <Section title="INSPECT & TEST">
        <Bullets items={rec.inspectionPoints} />
        <Text style={styles.k}>BASIC TEST</Text>
        <Text style={styles.body}>{rec.basicTest}</Text>
      </Section>
    </View>
  );
}

/** View-only browser for recognition-tier connectors (identify + purpose —
 *  never assessed for pin detail). Sweep 2026-08-15: the recognition
 *  inventory must actually render somewhere; lessons mount this strip. */
export function RecognitionStrip({ rec, title }: { rec: ConnectorRecord[]; title?: string }) {
  const [sel, setSel] = useState(rec[0]?.id ?? null);
  const selected = rec.find((r) => r.id === sel);
  if (!rec.length) return null;
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.recogTitle}>{title ?? 'ALSO RECOGNIZE'}</Text>
      <View style={styles.recogChips}>
        {rec.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setSel(r.id)}
            hitSlop={{ top: 6, bottom: 6 }}
            accessibilityRole="button"
            accessibilityState={{ selected: r.id === sel }}
            accessibilityLabel={r.displayName}
            style={[styles.recogChip, r.id === sel && styles.recogChipActive]}
          >
            <Text style={[styles.recogChipText, r.id === sel && styles.recogChipTextActive]}>{r.displayName}</Text>
          </Pressable>
        ))}
      </View>
      {selected ? <ConnectorCard rec={selected} /> : null}
    </View>
  );
}

/** Ink legend row — render once per lesson that shows pinouts. */
export function InkLegend({ inks }: { inks: ConnectorInk[] }) {
  return (
    <View style={styles.legend}>
      {inks.map((ink) => (
        <View key={ink} style={styles.legendItem}>
          <View style={[styles.inkDot, { backgroundColor: CONNECTOR_INKS[ink] }]} />
          <Text style={styles.hint}>{CONNECTOR_INK_LABELS[ink]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 12,
    gap: 7,
  },
  imageFrame: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#0c0d11',
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  name: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 0.8, color: colors.textPrimary },
  // Safety-boundary text — MIN_FONT_SIZE 12 applies (sweep 2026-08-15).
  tierBadge: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.orange },
  cautions: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,138,30,.45)', backgroundColor: '#1c1206', padding: 9, gap: 4 },
  cautionsHot: { borderColor: 'rgba(255,138,30,.7)' },
  cautionText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17.5, color: '#ffb36b' },
  section: { borderTopWidth: 1, borderTopColor: '#1d1d22' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textSecondary },
  caret: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amberLabel },
  sectionBody: { gap: 6, paddingBottom: 8 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  hint: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, fontStyle: 'italic' },
  kv: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  k: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amberLabel },
  pinoutCard: { borderRadius: 8, borderWidth: 1, borderColor: '#232329', backgroundColor: '#0c0d11', padding: 9, gap: 5 },
  pinoutApp: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textPrimary, flexShrink: 1 },
  // Pinout trust signal — MIN_FONT_SIZE 12 applies (sweep 2026-08-15).
  confidence: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.green },
  confidenceVaries: { color: colors.orange },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inkDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', marginTop: 3 },
  contactLabel: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary, minWidth: 34 },
  verify: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.orange },
  confuseCard: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0c0d11', padding: 9, gap: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recogTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.textSecondary, marginTop: 6 },
  recogChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  recogChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  recogChipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  recogChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.7, color: colors.textSecondary },
  recogChipTextActive: { color: colors.amber },
});
