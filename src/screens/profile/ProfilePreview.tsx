/**
 * DEV + WEB harness for the Profile screen
 * (`localhost:8090/#profilepreview/<360|393|412>`).
 *
 * Profile is behind login, so its layout could not be reviewed in a browser —
 * the same gap that let a stepper overflow and a chip overflow ship unseen.
 * The Supabase reads fail soft here (exactly as they do offline), so the live
 * values are absent but the full structure, spacing and typography are not.
 */
import { View, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { previewWidthFromHash, previewWidthLabel } from '../../features/dev/previewWidth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from './ProfileScreen';
import { EntitlementProvider } from '../../features/commercial/EntitlementProvider';
import { colors, fonts } from '../../theme/tokens';

const Stack = createNativeStackNavigator();

export function ProfilePreview() {
  const width = previewWidthFromHash();
  // The BROWSER viewport - which is what the previewed screen's own window
  // APIs report, NOT the box below. See previewWidth.ts: routinely different.
  const { width: viewportW } = useWindowDimensions();
  return (
    <View style={styles.root}>
      <Text style={styles.bar}>{previewWidthLabel('PROFILE', width, viewportW)}</Text>
      <View style={[styles.phone, { width }]}>
        <EntitlementProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Profile" component={ProfileScreen as never} />
            </Stack.Navigator>
          </NavigationContainer>
        </EntitlementProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0c', alignItems: 'center' },
  bar: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.amber, paddingVertical: 8 },
  phone: { flex: 1, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
});
