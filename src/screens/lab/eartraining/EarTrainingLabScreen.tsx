/**
 * EarTrainingLabScreen — the Ear Training Lab landing (spec §3): the module
 * list in the lab hub-home accordion style, with level/accuracy chips read
 * from ape:ear:v1. Modules land in waves; only what is built is listed.
 * All strings NEW COPY — owner review.
 */
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { ModuleAccordionRow } from '../ModuleAccordionRow';
import { EAR_MODULES } from '../../../features/ear/modules/registry';
import { AccuracyNote } from '../../../components/AccuracyNote';
import {
  isEarProgressUnreadable, loadEarProgress, recentAccuracy, setEarSaveBlocked, type EarProgressState,
} from '../../../features/ear/earProgress';
import { ProgressUnreadableNote } from '../kit/ProgressUnreadableNote';
import { useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader } from '../kit/LabNavBar';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
// Tablet (owner 2026-09-29): a page of rows/cards - capped at the card column
// and centred instead of stretching rows 990 pt wide. No-op on a phone.
import { cardColumn } from '../../../theme/readingColumn';

export function EarTrainingLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [openId, setOpenId] = useState<string | null>(null);
  const [progress, setProgress] = useState<EarProgressState | null>(null);
  // HOUSE GUEST RULE (bug hunt 2026-09-30 pass 2): a signed-out guest's
  // ladder is neither restored nor written (see earProgress).
  setEarSaveBlocked(useLabEndGuest());

  // ⛔ WAIT FOR `resolved` (bug pass 3, 2026-09-30; the kit/PagedLab fix):
  // before the tier is known the save-block flag reads false, so a signed-out
  // device's first read restored the previous account's ladders.
  const { resolved } = useEntitlement();
  useFocusEffect(
    useCallback(() => {
      if (!resolved) return;
      let alive = true;
      void loadEarProgress().then((s) => {
        if (alive) setProgress(s);
      });
      return () => {
        alive = false;
      };
    }, [resolved]),
  );

  const unreadable = !!progress && isEarProgressUnreadable(progress);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      {/* The shared lab header (kit/LabNavBar, 2026-09-30): ‹ leaves the lab.
          The hub IS the menu — no strip here. */}
      <LabHeader
        title="EAR TRAINING LAB"
        subtitle="Hear a change · then see it measured"
        right={<AccuracyNote compact detail="Every drill here plays through your phone’s UNCALIBRATED output — and through whatever headphones or speakers you are on, which colour it further. Train the SKILL of hearing a change here; judge absolute tonality on monitoring you trust." />}
      />
      <ScrollView contentContainerStyle={[styles.scroll, cardColumn, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.body}>
          Every drill here renders real signals, plays them, and then shows you the same buffers
          on the analyzers — the habit this lab builds is hearing something and knowing what the
          measurement will say before you look. Short focused sets beat an hour of grinding — the
          level adapts on your last twenty answers at the current level, so give it a full twenty
          before expecting it to move.
        </Text>
        <Text style={styles.noteLine}>
          🎧 Headphones recommended throughout — modules note when they truly matter.
        </Text>
        <Text style={styles.sectionTitle}>MODULES</Text>
        {/* UNREADABLE is not "not started" (owner 2026-10-03, "do 2"): a
            ladder handed out because storage could not be read shows no
            levels, no accuracy and no ✓ — said here, before the rows. The
            modules stay open to practise. */}
        {unreadable ? <ProgressUnreadableNote /> : null}
        {EAR_MODULES.map((m) => {
          const p = unreadable ? undefined : progress?.modules[m.id];
          const acc = p ? recentAccuracy(p) : null;
          const stat = p
            ? `L${Math.min(p.level, m.levels)}${acc != null ? ` · ${Math.round(acc * 100)}%` : ''}`
            : null;
          return (
            <ModuleAccordionRow
              key={m.id}
              num={m.num}
              name={stat ? `${m.title}   ·  ${stat}` : m.title}
              blurb={`${m.blurb}\n${m.phones === 'required' ? '🎧 Headphones REQUIRED. ' : m.phones === 'recommended' ? '🎧 Headphones recommended. ' : ''}${m.playbackNote}`}
              expanded={openId === m.id}
              done={(p?.mastered ?? 0) >= m.levels}
              onToggle={() => setOpenId(openId === m.id ? null : m.id)}
              onOpen={() => navigation.navigate('EarModule', { id: m.id })}
            />
          );
        })}
        <Text style={styles.coming}>
          All fourteen modules are live. Emulated processors and rendered program beds are
          labeled as such throughout.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  // header / back / title / subtitle now live in kit/LabNavBar's LabHeader.
  scroll: { paddingHorizontal: 16, gap: 10 },
  body: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  noteLine: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  sectionTitle: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 2, marginTop: 8 },
  coming: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
