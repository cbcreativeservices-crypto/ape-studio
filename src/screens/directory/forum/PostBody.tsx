/**
 * The words of a post: glossary terms link to their definition, as they do in
 * the labs (first mention only), and @mentions of people in the thread read in
 * amber. A term's tap opens the shared popup, which counts as a glossary open
 * for a member on the free meter (the same rule as a calculator's term chip).
 *
 * A lab card opens the lab; the name comes from the key, because card text is
 * not moderated.
 */
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notify } from '../../../lib/confirm';
import { fonts } from '../../../theme/tokens';
import { linkifyGlossary, useGlossaryOpener } from '../../../features/glossary/glossaryLink';
import { labChipText, splitMentions } from '../../../features/forum/rules';
import { F } from './forumBits';

export const PostBody = memo(function PostBody({
  text,
  names,
  style,
}: {
  text: string;
  /** People in this thread, whose @mentions are drawn. */
  names: string[];
  style: StyleProp<TextStyle>;
}) {
  const open = useGlossaryOpener();
  const segs = useMemo(() => linkifyGlossary(text), [text]);
  return (
    <Text style={style}>
      {segs.map((s, i) =>
        s.term && open ? (
          <Text key={i} style={st.term} suppressHighlighting onPress={() => open(s.term as string)}>
            {s.text}
          </Text>
        ) : (
          splitMentions(s.text, names).map((p, j) => (
            <Text key={`${i}:${j}`} style={p.mention ? st.mention : undefined}>
              {p.text}
            </Text>
          ))
        ),
      )}
    </Text>
  );
});

export function LabCard({ labKey }: { labKey: string }) {
  const navigation = useNavigation() as unknown as { navigate: (route: string, params?: object) => void };
  const title = labChipText(labKey);
  const open = () => {
    const { labTarget } = require('../../../features/forum/labLinks') as typeof import('../../../features/forum/labLinks');
    const lab = labTarget(labKey);
    if (lab) navigation.navigate(lab.route, lab.params);
    else notify('Lab not found', 'This lab is no longer in the catalog.');
  };
  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [st.card, pressed && st.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
    >
      <View style={st.cardText}>
        <Text style={st.cardEyebrow}>LAB</Text>
        <Text style={st.cardTitle}>◉ {title}</Text>
      </View>
      <Text style={st.cardOpen}>OPEN LAB ›</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  pressed: { opacity: 0.7 },
  // The app's glossary-link blue, so a term reads the same everywhere.
  term: { color: '#9fbede', textDecorationLine: 'underline', textDecorationColor: 'rgba(159,190,222,0.4)' },
  mention: { fontFamily: fonts.barlowSemiBold, color: F.amber },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.35)',
    backgroundColor: 'rgba(255,198,77,.05)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  cardText: { flex: 1, minWidth: 0 },
  cardEyebrow: { fontFamily: fonts.mono, fontSize: 9.5, letterSpacing: 0.76, color: F.muted },
  cardTitle: { fontFamily: fonts.barlowMedium, fontSize: 13, color: F.amber, marginTop: 1 },
  cardOpen: { fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 1.1, color: F.amber },
});
