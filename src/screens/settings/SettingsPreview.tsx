/**
 * DEV + WEB harness for the Settings screen (`localhost:8090/#settingspreview`).
 *
 * Settings lives behind login, so its layout could never be reviewed in the
 * browser. It renders here inside the providers it needs, with a stub
 * navigator; the Supabase reads simply fail soft (prefs come back null exactly
 * as they do offline), so the full structure, spacing and typography are
 * visible even though the live values are not.
 *
 * Widths matter here — this screen is dense, and the narrow phone is where
 * rows crowd. Drive it with `#settingspreview/<360|393|412>`.
 */
import { View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from './SettingsScreen';
import { EntitlementProvider } from '../../features/commercial/EntitlementProvider';
import { __setDevPrefsOverride } from '../../features/settings/store';
import { colors, fonts } from '../../theme/tokens';

// Pretend we are signed in with weekly concepts ON, so the per-category
// schedule rows render and can be reviewed. `#settingspreview/<w>/off` shows
// the signed-out/all-off state instead.
const hash = typeof window !== 'undefined' ? window.location.hash : '';
const signedOut = hash.endsWith('/off');
// `/nopush` shows the master-switch-OFF state (dependent groups dimmed).
const pushOff = hash.endsWith('/nopush');
__setDevPrefsOverride(
  signedOut
    ? null
    : {
        push_enabled: !pushOff,
        email_enabled: true,
        notify_weekly_concept: true,
        notify_trophy: false,
        notify_badge: false,
        notify_quiz_unlock: false,
        notify_method_complete: false,
      },
);

const WIDTHS = [360, 393, 412];

function widthFromHash(): number {
  const parts = (typeof window !== 'undefined' ? window.location.hash : '').split('/');
  const w = Number(parts[1]);
  return WIDTHS.includes(w) ? w : 393;
}

const Stack = createNativeStackNavigator();

export function SettingsPreview() {
  const width = widthFromHash();
  return (
    <View style={styles.root}>
      <Text style={styles.bar}>{`SETTINGS @ ${width}px  ·  #settingspreview/<360|393|412>`}</Text>
      <View style={[styles.phone, { width }]}>
        <EntitlementProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Settings" component={SettingsScreen as never} />
            </Stack.Navigator>
          </NavigationContainer>
        </EntitlementProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0c', alignItems: 'center' },
  bar: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.amber,
    paddingVertical: 8,
  },
  phone: { flex: 1, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
});
