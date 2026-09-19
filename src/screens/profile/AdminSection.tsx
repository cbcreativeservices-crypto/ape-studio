/**
 * The admin entry point on the Profile screen.
 *
 * Renders NOTHING for everyone who is not an admin — the same rule
 * EmployerSection follows, and for the same reason: a learner should never
 * scroll past a panel that will never apply to them.
 *
 * ⚠️ THIS IS NOT A SECURITY BOUNDARY, and must not be mistaken for one.
 * `is_admin()` is asked here only to decide whether to draw a row. Every RPC
 * behind the screen re-checks it in the database and refuses with "not
 * permitted" — verified by calling them as `authenticated`. If this component
 * were bypassed entirely, the screen would render and then show nothing but
 * refusals.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme/tokens';
import { amIAdmin } from '../../features/employer/api';
import type { RootStackParamList } from '../../navigation/types';

export function AdminSection() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;
    void amIAdmin().then((v) => {
      if (alive) setIsAdmin(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.kicker}>ADMIN</Text>
      <Pressable
        onPress={() => navigation.navigate('EmployerAdmin')}
        style={s.row}
        accessibilityRole="button"
        accessibilityLabel="Open the employer review queue"
      >
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Employer review</Text>
          <Text style={s.sub}>Applications awaiting a decision, and verified employers</Text>
        </View>
        <Text style={s.chev}>›</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('ReportsAdmin')}
        style={s.row}
        accessibilityRole="button"
        accessibilityLabel="Open the abuse report queue"
      >
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Abuse reports</Text>
          <Text style={s.sub}>Reports awaiting a decision, and account standing</Text>
        </View>
        <Text style={s.chev}>›</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 18, gap: 6 },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 11,
    backgroundColor: '#101013',
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 56,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, color: colors.textPrimary },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 2 },
  chev: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.amber },
});
