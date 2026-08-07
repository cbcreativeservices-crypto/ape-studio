/**
 * GlossaryShareCard — the visual, capture-ready rendering of a glossary share
 * (owner spec 2026-08-06). This is the view the SHARE AS IMAGE path captures, so
 * the shared PNG mirrors the plain-text hierarchy exactly: term(s) · source ·
 * definition · optional sections · related terms · restrained footer.
 *
 * Branding stays secondary to the glossary content. A stable dark surface (not
 * theme-dependent) keeps the captured image readable regardless of the viewer's
 * light/dark setting. Every interactive control lives OUTSIDE this card (capture
 * excludes buttons). Mirrors ReportCard.tsx.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { BRAND } from '../commercial/brand';
import {
  dedupeRelated,
  termHeading,
  GLOSSARY_TAGLINE,
  WEBSITE,
  type GlossaryShareTerm,
  type ShareSections,
} from './glossaryShare';

function OptionalSections({ t, s }: { t: GlossaryShareTerm; s: ShareSections }) {
  return (
    <>
      {s.plainEnglish && t.plainEnglish?.trim() ? (
        <>
          <Text style={styles.section}>PLAIN ENGLISH</Text>
          <Text style={styles.body}>{t.plainEnglish.trim()}</Text>
        </>
      ) : null}
      {s.purpose && t.purpose?.trim() ? (
        <>
          <Text style={styles.section}>PURPOSE & APPLICATION</Text>
          <Text style={styles.body}>{t.purpose.trim()}</Text>
        </>
      ) : null}
      {s.commonMistakes && t.commonMistakes.length ? (
        <>
          <Text style={styles.section}>COMMON MISTAKES</Text>
          {t.commonMistakes.map((m, i) => (
            <Text key={i} style={styles.bullet}>
              {'•'} {m}
            </Text>
          ))}
        </>
      ) : null}
    </>
  );
}

export const GlossaryShareCard = forwardRef<
  View,
  { terms: GlossaryShareTerm[]; sections: ShareSections }
>(function GlossaryShareCard({ terms, sections: s }, ref) {
  // Guard: the sheet mounts this capture target before `staged` is populated
  // (the payload→staged effect runs after the first render), so terms can be
  // empty for a frame. Never index terms[0] on an empty list — keep a ref'd
  // empty node so the capture ref stays valid. (owner 2026-08-06 crash fix)
  if (terms.length === 0) return <View ref={ref} collapsable={false} />;
  const multi = terms.length > 1;
  const related = s.relatedTerms
    ? dedupeRelated(
        terms.flatMap((t) => t.relatedTerms),
        terms.map((t) => t.term),
      )
    : [];

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {/* Header */}
      {multi ? (
        <>
          <Text style={styles.company} accessibilityRole="header">
            {BRAND.name.toUpperCase()}
          </Text>
          <Text style={styles.sourceLine}>Professional Audio Glossary</Text>
        </>
      ) : (
        <>
          <Text style={styles.term} accessibilityRole="header">
            {termHeading(terms[0].term)}
          </Text>
          <Text style={styles.sourceLine}>{BRAND.name} Glossary</Text>
        </>
      )}

      {/* Term blocks */}
      {terms.map((t, i) => (
        <View key={i}>
          <View style={styles.rule} />
          {multi ? <Text style={styles.termMulti}>{termHeading(t.term)}</Text> : null}
          {s.definition && t.definition?.trim() ? (
            <Text style={styles.body}>{t.definition.trim()}</Text>
          ) : null}
          <OptionalSections t={t} s={s} />
        </View>
      ))}

      {/* Related terms (aggregated, deduped) */}
      {related.length ? (
        <>
          <View style={styles.rule} />
          <Text style={styles.section} accessibilityRole="header">
            RELATED TERMS
          </Text>
          {related.map((r, i) => (
            <Text key={i} style={styles.bullet}>
              {'•'} {r}
            </Text>
          ))}
        </>
      ) : null}

      {/* Footer — restrained; content stays the focus. No company-name line
          (owner 2026-08-06): the source line already names the glossary. */}
      <View style={styles.rule} />
      <Text style={styles.footLine}>{GLOSSARY_TAGLINE}</Text>
      <Text style={styles.footWebsite}>{WEBSITE}</Text>
    </View>
  );
});

// Stable dark surface for a consistent captured image (not theme-dependent).
const INK = '#0d0e12';
const styles = StyleSheet.create({
  card: { backgroundColor: INK, borderRadius: 14, padding: 18, gap: 2 },

  company: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.6, color: colors.amber, textAlign: 'center' },
  term: { fontFamily: fonts.oswaldMedium, fontSize: 22, color: '#f4f5f7', textAlign: 'center' },
  termMulti: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.6, color: '#f4f5f7', marginBottom: 4 },
  sourceLine: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#9aa0ad', textAlign: 'center', marginTop: 2 },

  rule: { height: 1, backgroundColor: '#23252d', marginVertical: 12 },
  section: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber, marginTop: 8 },

  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: '#d4d8e0' },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: '#c7ccd6', marginTop: 3 },

  footBrand: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.8, color: colors.amber, textAlign: 'center' },
  footLine: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 2 },
  footWebsite: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: '#7fa8ff', textAlign: 'center', marginTop: 2 },
});
