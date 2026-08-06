/**
 * ReportCard — the visual, capture-ready rendering of a SharedCalculatorReport
 * (owner spec 2026-08-06). Used for the in-app results view AND as the view the
 * SHARE AS IMAGE path captures, so the shared PNG and the on-screen report are
 * one and the same hierarchy:
 *
 *   company · report type · title · date · PRIMARY RESULT · inputs · results ·
 *   notes · warnings · restrained footer · report id
 *
 * Branding is deliberately secondary to the calculation. A stable dark surface
 * with strong contrast is used (not theme-dependent) so the captured image is
 * consistently readable regardless of the viewer's light/dark setting. Every
 * interactive control lives OUTSIDE this card (the capture excludes buttons).
 */
import { forwardRef } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { SharedCalculatorReport, SharedReportValue } from './calcReport';
import { reportAccessibilityLabel } from './calcReport';

function Row({ v }: { v: SharedReportValue }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${v.label}: ${v.formattedValue}`}>
      <Text style={styles.rowLabel}>{v.label}</Text>
      <View style={styles.rowDots} />
      <Text style={styles.rowValue}>{v.formattedValue}</Text>
    </View>
  );
}

export const ReportCard = forwardRef<View, { report: SharedCalculatorReport }>(function ReportCard(
  { report: r },
  ref,
) {
  return (
    <View
      ref={ref}
      collapsable={false}
      style={styles.card}
      accessible
      accessibilityLabel={reportAccessibilityLabel(r)}
    >
      {/* Header */}
      <Text style={styles.company} accessibilityRole="header">
        {r.companyName.toUpperCase()}
      </Text>
      <Text style={styles.reportLabel}>{r.reportLabel}</Text>
      <Text style={styles.title}>{r.title}</Text>
      {r.subtitle ? <Text style={styles.subtitle}>{r.subtitle}</Text> : null}
      <Text style={styles.date}>{r.createdAtDisplay}</Text>

      {r.primaryResult ? (
        <>
          <View style={styles.rule} />
          <Text style={styles.section} accessibilityRole="header">PRIMARY RESULT</Text>
          <Text style={styles.primary} accessibilityLabel={`Primary result ${r.primaryResult.formattedValue}`}>
            {r.primaryResult.formattedValue}
          </Text>
        </>
      ) : null}

      {r.inputs.length ? (
        <>
          <View style={styles.rule} />
          <Text style={styles.section} accessibilityRole="header">INPUTS</Text>
          {r.inputs.map((i) => (
            <View key={i.id}>
              <Row v={i} />
              {i.detail ? <Text style={styles.detail}>{i.detail}</Text> : null}
            </View>
          ))}
        </>
      ) : null}

      {r.results.length ? (
        <>
          <View style={styles.rule} />
          <Text style={styles.section} accessibilityRole="header">RESULTS</Text>
          {r.results.map((v) => (
            <Row key={v.id} v={v} />
          ))}
        </>
      ) : null}

      {r.notes.length ? (
        <>
          <View style={styles.rule} />
          <Text style={styles.section} accessibilityRole="header">NOTES</Text>
          {r.notes.map((n, k) => (
            <Text key={k} style={styles.bullet}>{'•'} {n}</Text>
          ))}
        </>
      ) : null}

      {r.warnings.length ? (
        <>
          <View style={styles.rule} />
          <Text style={[styles.section, styles.warnHead]} accessibilityRole="header">WARNINGS</Text>
          {r.warnings.map((w, k) => (
            <Text key={k} style={[styles.bullet, styles.warnBullet]}>{'•'} {w}</Text>
          ))}
        </>
      ) : null}

      {/* Footer — restrained; branding stays secondary to the calculation. */}
      <View style={styles.rule} />
      <Text style={styles.footGen}>{r.footer.generatedWith}</Text>
      <Text style={styles.footBrand}>{r.footer.companyName}</Text>
      <Text style={styles.footLine}>{r.footer.productLine}</Text>
      <Text
        style={styles.footWebsite}
        accessibilityRole="link"
        accessibilityLabel={`Website ${r.footer.website}`}
        onPress={() => Linking.openURL(`https://${r.footer.website}`).catch(() => {})}
      >
        {r.footer.website}
      </Text>
      <Text style={styles.reportId}>Report ID: {r.reportId}</Text>
    </View>
  );
});

// Stable dark surface for a consistent captured image (not theme-dependent).
const INK = '#0d0e12';
const styles = StyleSheet.create({
  card: { backgroundColor: INK, borderRadius: 14, padding: 18, gap: 2 },
  company: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.amber, textAlign: 'center' },
  reportLabel: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#9aa0ad', textAlign: 'center', marginTop: 1 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 20, color: '#f4f5f7', textAlign: 'center', marginTop: 6 },
  subtitle: { fontFamily: fonts.barlowMedium, fontSize: 13, color: '#c7ccd6', textAlign: 'center', marginTop: 1 },
  date: { fontFamily: fonts.mono, fontSize: 12, color: '#8a909c', textAlign: 'center', marginTop: 2 },

  rule: { height: 1, backgroundColor: '#23252d', marginVertical: 12 },
  section: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  warnHead: { color: '#ff8d5e' },

  primary: { fontFamily: fonts.oswaldBold, fontSize: 30, color: '#5bff85', marginTop: 4 },

  row: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 7 },
  rowLabel: { fontFamily: fonts.barlowMedium, fontSize: 14, color: '#c7ccd6', flexShrink: 1 },
  rowDots: { flexGrow: 1, minWidth: 12, marginHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#2c2f38', borderStyle: 'dotted', transform: [{ translateY: -3 }] },
  rowValue: { fontFamily: fonts.mono, fontSize: 14, color: '#f4f5f7', textAlign: 'right' },
  detail: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#7f8593', marginTop: 1, marginLeft: 2 },

  bullet: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: '#c7ccd6', marginTop: 5 },
  warnBullet: { color: '#f2c9a0' },

  footGen: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#8a909c', textAlign: 'center' },
  footBrand: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.8, color: colors.amber, textAlign: 'center', marginTop: 2 },
  footLine: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 2 },
  footWebsite: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: '#7fa8ff', textAlign: 'center', marginTop: 2 },
  reportId: { fontFamily: fonts.mono, fontSize: 11, color: '#6b7180', textAlign: 'center', marginTop: 8 },
});
