/**
 * ShareFooter — the ONE rendered footer for every share CARD.
 *
 * Owner 2026-09-17: the calculator report's footer is the one to copy, because
 * its website line is a real tappable link. Three surfaces had each
 * re-implemented this block — the calculator, the glossary share card and the
 * harmonograph viewer — with byte-identical styles, and only the calculator's
 * was tappable. The footer CONTENT was shared (brand.shareFooterLines); the
 * framing was not, so it drifted.
 *
 * Sharing the framing is the fix. A new share surface renders `<ShareFooter />`
 * and cannot get it wrong.
 *
 * The website line stays a link on purpose (owner confirmed 2026-09-17, keep
 * it): it is the app's attribution riding along on every share. It opens the
 * company homepage, not a purchase page, which is what keeps it clear of the
 * App Store rule about steering to outside purchase.
 */
import { Linking, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { fonts } from '../theme/tokens';
import { shareFooterLines } from '../features/commercial/brand';

export function ShareFooter({
  /** Pre-built lines. Omit to use the shared brand footer, which is the norm. */
  lines,
  /** Draw the hairline above the footer. On by default. */
  rule = true,
  /** A card that stretches its children (the harmonograph viewer) needs this. */
  stretch = false,
  style,
}: {
  lines?: string[];
  rule?: boolean;
  stretch?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  // Called once, not once per line: the previous copies invoked
  // shareFooterLines() twice per iteration to find the last index.
  const list = lines ?? shareFooterLines();
  const last = list.length - 1;

  return (
    <View style={style}>
      {rule ? <View style={[styles.rule, stretch && styles.ruleStretch]} /> : null}
      {list.map((line, i) =>
        i === last ? (
          <Text
            key={i}
            style={styles.footWebsite}
            accessibilityRole="link"
            accessibilityLabel={`Website ${line}`}
            onPress={() => Linking.openURL(line).catch(() => {})}
          >
            {line}
          </Text>
        ) : (
          <Text key={i} style={styles.footLine}>
            {line}
          </Text>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { height: 1, backgroundColor: '#23252d', marginVertical: 12 },
  ruleStretch: { alignSelf: 'stretch' },
  footLine: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 2 },
  footWebsite: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: '#7fa8ff', textAlign: 'center', marginTop: 2 },
});
