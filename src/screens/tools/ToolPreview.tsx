/**
 * ToolPreview — DEV + WEB ONLY generic layout harness for a live tool screen.
 *
 * Renders the REAL tool screen (SVG-based, Skia-free) in its OWN minimal
 * navigator — outside RootNavigator, so it skips AmplitudeOrientation's web-Skia
 * throw — with the ape-dsp SIM overlay (apeDspSim.ts) feeding animated fake
 * frames. Lets any tool be seen + iterated in the browser (the whole-tool
 * analogue of #gaugepreview). Wired to hash routes in App.tsx. Never in a real
 * navigation path; inert on device and in release builds.
 */
import type { ComponentType } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EntitlementProvider } from '../../features/commercial/EntitlementProvider';

const Stack = createNativeStackNavigator();

export function ToolPreview({ name, component }: { name: string; component: ComponentType }) {
  return (
    <EntitlementProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name={name} component={component} />
        </Stack.Navigator>
      </NavigationContainer>
    </EntitlementProvider>
  );
}
