/**
 * "Discuss this lab" on a lab's end screen. One thread per lab: if it exists the
 * tap opens it, and if not the Ask screen offers to start it (the server makes
 * the thread on the first post).
 *
 * Off while the community is off (COMMUNITY_VISIBLE), so nothing changes for any
 * learner until the store build opens it. Everything about the forum is required
 * on the tap: this file sits in the labs and adds nothing to them or to the start
 * graph.
 */
import { useState, type ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COMMUNITY_VISIBLE } from '../../../config/communityVisible';
import { notify } from '../../../lib/confirm';
import { useLatchedPress } from '../../../lib/latch';
import { fonts } from '../../../theme/tokens';
import { sampleForumOn } from '../../../features/forum/sampleSwitch';

type Lab = { key: string; title: string };

/** One press of the gate (PostGate.PostGateOnce); a type only, so the lab
 *  carries none of the forum until the tap. */
type GateRequest = {
  where: { slug: string | null; action: 'start' | 'reply' };
  known: undefined;
  go: () => void;
  intent: { route: string; params?: Record<string, unknown> };
};

type Props = { labTitle: string; /** Names the lab directly (dev sample). */ lab?: Lab };

export function DiscussLabLink(props: Props) {
  if (!COMMUNITY_VISIBLE && !sampleForumOn()) return null;
  return <DiscussKey {...props} />;
}

function DiscussKey({ labTitle, lab }: Props) {
  const navigation = useNavigation() as unknown as {
    navigate: (route: string, params?: object) => void;
    isFocused?: () => boolean;
  };
  const route = useRoute();
  const [busy, setBusy] = useState(false);
  /** Who may post, once a tap needs it (starting the lab's discussion). The
   *  gate is required then, never with the lab, and stays mounted after. */
  const [gate, setGate] = useState<GateRequest | null>(null);

  const open = useLatchedPress(async () => {
    const { labOfRoute } = require('../../../features/forum/labLinks') as typeof import('../../../features/forum/labLinks');
    const { labKeyOf } = require('../../../features/forum/rules') as typeof import('../../../features/forum/rules');
    const { fetchLabThread } = require('../../../features/forum/api') as typeof import('../../../features/forum/api');
    const which =
      lab ?? labOfRoute(route.name, route.params as Record<string, unknown> | undefined) ?? { key: labKeyOf(labTitle), title: labTitle };
    setBusy(true);
    const r = await fetchLabThread(which.key);
    setBusy(false);
    // Left the lab while the read was out: never pull the person into the
    // forum from wherever they went (bug pass 2026-11-08, CODE-1-32).
    if (navigation.isFocused && !navigation.isFocused()) return;
    if (!r.ok) {
      notify('Discuss this lab', r.error);
      return;
    }
    if (r.value) {
      navigation.navigate('ForumThread', { topicId: r.value });
      return;
    }
    // Starting the discussion is a post: a member who may not post yet sees
    // the rules, or why, with the one button to the fix (2026-11-10).
    const intent = { route: 'ForumAsk', params: { labThread: which } };
    setGate({
      where: { slug: null, action: 'start' },
      known: undefined,
      go: () => {
        if (navigation.isFocused && !navigation.isFocused()) return;
        navigation.navigate(intent.route, intent.params);
      },
      intent,
    });
  });
  const Gate = gate
    ? ((require('./PostGate') as typeof import('./PostGate')).PostGateOnce as ComponentType<{ request: GateRequest }>)
    : null;

  return (
    <>
      <Pressable
        onPress={open}
        disabled={busy}
        style={({ pressed }) => [st.link, pressed && st.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Discuss this lab"
        accessibilityState={{ busy }}
      >
        {busy ? <ActivityIndicator color="#ffc64d" /> : <Text style={st.text}>DISCUSS THIS LAB ›</Text>}
      </Pressable>
      {Gate && gate ? <Gate request={gate} /> : null}
    </>
  );
}

const st = StyleSheet.create({
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  pressed: { opacity: 0.7 },
  text: { fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1.25, color: '#ffc64d' },
});
