/**
 * `#instructorpreview`: the instructor view (must-do E3) in the browser, on
 * made-up students. DEV + WEB ONLY, like everything webPreviews.tsx renders.
 * The same list is in the DEV · VISUAL INDEX on a phone.
 */
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { INSTRUCTOR_SAMPLE_STATES, setSampleClass } from '../features/instructor/sampleClass';
import { fonts } from '../theme/tokens';

export function InstructorPreviewScreen() {
  const navigation = useNavigation() as unknown as { navigate: (route: string, params?: object) => void };
  useFocusEffect(
    useCallback(() => {
      setSampleClass(null);
    }, []),
  );
  return (
    <ScrollView style={st.root} contentContainerStyle={st.body}>
      <Text style={st.title}>Instructor progress · sample</Text>
      <Text style={st.sub}>Made-up students. Nothing is read from or written to the live database.</Text>
      {INSTRUCTOR_SAMPLE_STATES.map((state) => (
        <Pressable
          key={state.id}
          onPress={() => {
            setSampleClass(state);
            navigation.navigate('InstructorStudents');
          }}
          style={st.row}
          accessibilityRole="button"
          accessibilityLabel={state.label}
        >
          <Text style={st.rowText}>{state.label}</Text>
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
