/**
 * AP&E STUDIO — app root.
 * Loads the locked type families, wraps the app in a dark navigation theme +
 * safe-area provider, and renders the RootNavigator. Dark theme, portrait-only.
 */
import { useFonts } from 'expo-font';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { EntitlementProvider } from './src/features/commercial/EntitlementProvider';
import { LowLightDim } from './src/features/settings/LowLightLayer';
import { colors, fontAssets } from './src/theme/tokens';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.screenBg,
    card: colors.screenBg,
    primary: colors.amber,
    text: colors.textPrimary,
    border: colors.hairline,
    notification: colors.amber,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);

  // Hold on a dark surface until fonts resolve (avoids a white flash + FOUT).
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.splashBg }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {/* Commercial entitlement context (CM1) — inert while commercialMode is
          OFF; no consumers yet, so app behavior is unchanged. */}
      <EntitlementProvider>
        {/* Navigator + the global low-light dim wash (the toggle lives on the
            Profile screen). pointer-transparent, so it never blocks touches. */}
        <View style={{ flex: 1 }}>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
          <LowLightDim />
        </View>
      </EntitlementProvider>
    </SafeAreaProvider>
  );
}
