/**
 * MultiMeterPreview — DEV + WEB ONLY layout harness for the Pro Audio MultiMeter.
 *
 * The real screen renders only while the native engine runs, which never happens
 * on web — and the full app on web throws in AmplitudeOrientation's Skia (why
 * App.tsx short-circuits #gaugepreview past the whole tree). This harness mounts
 * the REAL MultiMeterScreen (which is pure SVG, Skia-free) in its OWN minimal
 * navigator — outside RootNavigator, so no Skia — with the ape-dsp SIM overlay
 * (apeDspSim.ts) feeding animated fake frames. Press START once and every panel
 * animates, so the layout can be seen + iterated in the browser. Reached at
 * `localhost:8090/#multimeterpreview`. Never in any real navigation path.
 */
import type { ComponentType } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EntitlementProvider } from '../../features/commercial/EntitlementProvider';
import { MultiMeterScreen } from './MultiMeterScreen';

const Stack = createNativeStackNavigator();

export function MultiMeterPreview() {
  return (
    <EntitlementProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="MultiMeter" component={MultiMeterScreen as ComponentType} />
        </Stack.Navigator>
      </NavigationContainer>
    </EntitlementProvider>
  );
}
