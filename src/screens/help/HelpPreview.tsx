/**
 * DEV + WEB harness for the Help hub (`localhost:8090/#helppreview`).
 *
 * The Help screen is gated behind HELP_HUB_ENABLED until the owner ratifies
 * the FAQ copy, so this is the way to review it in the browser meanwhile.
 * Drive widths with `#helppreview/<360|393|412>` (previewWidth.ts).
 */
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { previewWidthFromHash, previewWidthLabel } from '../../features/dev/previewWidth';
import { colors, fonts } from '../../theme/tokens';
import { HelpScreen } from './HelpScreen';

const Stack = createNativeStackNavigator();

export function HelpPreview() {
  const width = previewWidthFromHash();
  const { width: viewportW } = useWindowDimensions();
  return (
    <View style={styles.root}>
      <Text style={styles.bar}>{previewWidthLabel('HELP', width, viewportW)}</Text>
      <View style={[styles.phone, { width }]}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Help" component={HelpScreen as never} />
          </Stack.Navigator>
        </NavigationContainer>
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
