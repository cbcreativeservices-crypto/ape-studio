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

export function ToolPreview({
  name,
  component,
  initialParams,
  screens,
}: {
  name: string;
  component: ComponentType;
  /** Route params for screens that read useRoute().params (e.g. a calc
   *  workspace needs { id }). */
  initialParams?: Record<string, unknown>;
  /** Extra routes for a multi-screen flow (the Career Finder navigates
   *  between six screens); the first route is still `name`. */
  screens?: { name: string; component: ComponentType }[];
}) {
  return (
    <EntitlementProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name={name} component={component} initialParams={initialParams} />
          {screens?.map((s) => <Stack.Screen key={s.name} name={s.name} component={s.component} />)}
        </Stack.Navigator>
      </NavigationContainer>
    </EntitlementProvider>
  );
}
