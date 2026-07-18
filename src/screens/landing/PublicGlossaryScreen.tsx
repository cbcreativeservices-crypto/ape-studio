/**
 * PublicGlossary — anonymous glossary route on the ROOT stack (CM2, Booth
 * 2026-07-11). Reuses the real GlossaryScreen UNCHANGED via a navigation
 * proxy: inside the Study stack its mode-icon goes to 'Dashboard'; here (no
 * Study stack) that same intent becomes goBack() to the Landing. Its
 * parent-tab tabPress listener no-ops (getParent() is the root stack's
 * undefined-parent — already guarded in the screen).
 *
 * NOTE (CM4 scope): full anonymous RENDERING (Common Mistakes lock, anon data
 * grants) lands in CM4 — this route is the navigation shell for it.
 */
import { useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlossaryScreen } from '../glossary/GlossaryScreen';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicGlossary'>;

export function PublicGlossaryScreen({ navigation }: Props) {
  const navProxy = useMemo(
    () =>
      new Proxy(navigation as object, {
        get(target, prop, receiver) {
          if (prop === 'navigate') {
            return (name: string, params?: unknown) =>
              name === 'Dashboard'
                ? (target as Props['navigation']).goBack()
                : (target as unknown as { navigate: (n: string, p?: unknown) => void }).navigate(name, params);
          }
          return Reflect.get(target, prop, receiver);
        },
      }),
    [navigation],
  );

  const route = useMemo(() => ({ key: 'public-glossary', name: 'Glossary' as const, params: {} }), []);

  // Prop shapes intentionally coerced: GlossaryScreen is typed to the Study
  // stack; this adapter provides behaviorally-equivalent props.
  return <GlossaryScreen navigation={navProxy as never} route={route as never} />;
}
