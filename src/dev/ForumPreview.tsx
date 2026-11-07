/**
 * `#forumpreview`: every forum mockup screen and state in the browser, on the
 * dev sample. DEV + WEB ONLY, like everything webPreviews.tsx renders. The same
 * list is in the DEV · VISUAL INDEX on a phone.
 */
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FORUM_SAMPLE_STATES, setSampleForum } from '../features/forum/sampleSwitch';
import { fonts } from '../theme/tokens';

export function ForumPreviewScreen() {
  const navigation = useNavigation() as unknown as { navigate: (route: string, params?: object) => void };
  useFocusEffect(
    useCallback(() => {
      setSampleForum(null);
    }, []),
  );
  return (
    <ScrollView style={st.root} contentContainerStyle={st.body}>
      <Text style={st.title}>Audio Community Forum · sample</Text>
      <Text style={st.sub}>Made-up data. Nothing reaches the live database.</Text>
      {FORUM_SAMPLE_STATES.map((state) => (
        <Pressable
          key={state.id}
          onPress={() => {
            setSampleForum(state);
            navigation.navigate('AudioCommunityDirectory', { tab: 'forum' });
          }}
          style={st.row}
          accessibilityRole="button"
          accessibilityLabel={state.label}
        >
          <Text style={st.rowText}>{state.label}</Text>
          <View />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0c0f' },
  body: { padding: 16, gap: 6 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: '#f0f0f0' },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: '#a6a6ad', marginBottom: 10 },
  row: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 9, backgroundColor: '#121318', borderWidth: 1, borderColor: '#24262e' },
  rowText: { fontFamily: fonts.barlowMedium, fontSize: 14.5, color: '#e6e6e6' },
});
