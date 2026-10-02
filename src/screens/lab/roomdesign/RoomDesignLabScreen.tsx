/**
 * RoomDesignLabScreen — the ROOM DESIGN & MONITORING LAB (owner spec
 * 2026-10-01). Expands the Wave Physics lab's room work into a planning and
 * monitoring tool: build a model of the actual room, place speakers and the
 * listening position, explore how changes may affect what is heard, add or
 * adjust treatment, review — every result labelled CALCULATED, ESTIMATED or
 * MEASURED. Observations and next steps; never a room score.
 *
 * Six modules on the SHARED LAB NAVIGATION strip (kit/LabNavBar): the four
 * live ones are Rack Units with FULL SCREEN (rackLayout.tsx); the intro and
 * the review are document pages. FINISH › opens the shared what's-left end
 * screen; the header ‹ always leaves.
 *
 * PROGRESS, NOT CREDIT: a member lab in Acoustics, so it banks no
 * certificate credit — it remembers which modules were opened (labVisits,
 * device-local, never removed by a practice run). GUEST RULE (owner
 * 2026-08-12): a signed-out guest or a members-only preview designs freely,
 * but nothing is saved — visits stay in memory for the session, the design
 * store is save-blocked, and the lab says so plainly. The host decides only
 * once the entitlement has `resolved`, so a signed-in member is never
 * treated as a guest on first paint, and a guest-loaded copy is never saved.
 *
 * Low-Light: nothing here auto-appears; the TRACE pulse runs only on a tap.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../theme/tokens';
import { readingColumn } from '../../../theme/readingColumn';
import { AccuracyNote } from '../../../components/AccuracyNote';
import type { RootStackParamList } from '../../../navigation/types';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { markLabVisit, useLabVisits } from '../../../features/lab/labVisits';
import { deleteRoomDesign, MAX_SAVED_DESIGNS, saveRoomDesign, setRoomDesignSaveBlocked, useRoomDesigns } from '../../../features/roomdesign/roomDesignStore';
import { LabEndScreen, useLabEndGuest } from '../kit/LabEndScreen';
import { LabHeader, LabNavBar, LabNavProvider, useLabNav } from '../kit/LabNavBar';
import type { RoomLabCtx } from './labCtx';
import { ROOM_LAB_ID, ROOM_MODULES, type RoomModuleId } from './registry';
import { analyze, defaultDesign, evictedBySave, repairDesign, START_LAYOUT, type RoomDesign } from './roomModel';
import { IntroModule } from './modules/modIntro';
import { CreateModule } from './modules/modCreate';
import { MonitoringModule } from './modules/modMonitoring';
import { ExploreModule } from './modules/modExplore';
import { TreatmentModule } from './modules/modTreatment';
import { ReviewModule } from './modules/modReview';

const TITLE = 'ROOM DESIGN & MONITORING LAB';

export function RoomDesignLabScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [idx, setIdx] = useState(0);
  const [ending, setEnding] = useState(false);
  const { resolved, entitlement } = useEntitlement();
  const guest = useLabEndGuest();
  // A guest who IS signed in is a members-only preview, not a signed-out guest.
  const preview = resolved && guest && entitlement !== 'anonymous';
  const visited = useLabVisits(ROOM_LAB_ID);
  // Repaired on the way in (toddler pass 2026-10-01): a damaged or
  // version-skewed record crashed analyze() on COMPARE or LOAD.
  // The hook hands back a fresh array on every render; held while its
  // records are the same objects, so the repair runs when the library
  // changes rather than on every drag frame (toddler pass 2).
  const fresh = useRoomDesigns();
  const rawRef = useRef(fresh);
  if (rawRef.current.length !== fresh.length || fresh.some((d, i) => d !== rawRef.current[i])) rawRef.current = fresh;
  const rawSaved = rawRef.current;
  const saved = useMemo(() => rawSaved.map(repairDesign).filter((x): x is RoomDesign => x != null), [rawSaved]);

  // The ONE design being edited, shared by every module.
  const [design, setDesign] = useState<RoomDesign>(() => defaultDesign());
  // Judged on the store's own list, which is what the store trims.
  const evicts = useMemo(() => evictedBySave(rawSaved, design, MAX_SAVED_DESIGNS), [rawSaved, design]);
  const update = useCallback((fn: (d: RoomDesign) => RoomDesign) => setDesign((d) => ({ ...fn(d), updatedAt: Date.now() })), []);
  const analysis = useMemo(() => analyze(design), [design]);

  // Guest rule: decide only once the entitlement is known.
  useEffect(() => {
    setRoomDesignSaveBlocked(!resolved || guest);
  }, [resolved, guest]);

  // Record the module as opened (progress, never credit). A guest's visits
  // live for this session only.
  const mod = ROOM_MODULES[idx] ?? ROOM_MODULES[0];
  useEffect(() => {
    if (!resolved || ending) return;
    markLabVisit(ROOM_LAB_ID, mod.id, { persist: !guest });
  }, [mod.id, resolved, guest, ending]);

  const ctx: RoomLabCtx = useMemo(
    () => ({
      design,
      update,
      analysis,
      units: design.room.units,
      guest: !resolved ? false : guest,
      preview,
      resolved,
      saved,
      evicts,
      saveCurrent: (name?: string) => {
        // Nothing reaches the store while it is blocked (toddler pass
        // 2026-10-01): a save tapped before the tier was known, or by a
        // guest, went into the store's in-memory list unwritten — once the
        // tier resolved as a member it sat under SAVED DESIGNS with LOAD and
        // DELETE as if it were on the device, and was gone after a relaunch.
        // The design on screen is the session copy either way.
        if (!resolved || guest) return Promise.resolve(false);
        const d = name ? { ...design, name } : design;
        if (name) setDesign(d);
        return saveRoomDesign(d);
      },
      loadSaved: (id: string) => {
        const d = saved.find((x) => x.id === id);
        // A design saved before the baseline slot was renamed carries
        // "Current"; it is the START slot now.
        if (d) setDesign({ ...d, layouts: d.layouts.map((l, i) => (i === 0 && l.name === 'Current' ? { ...l, name: START_LAYOUT } : l)), active: Math.min(d.active, d.layouts.length - 1) });
      },
      deleteSaved: (id: string) => deleteRoomDesign(id),
    }),
    [design, update, analysis, guest, preview, resolved, saved, evicts],
  );

  const go = useCallback((i: number) => {
    setEnding(false);
    setIdx(Math.max(0, Math.min(ROOM_MODULES.length - 1, i)));
  }, []);
  const nav = useLabNav({
    units: ROOM_MODULES.map((m) => ({ id: m.id, title: m.title, done: visited.has(m.id) })),
    index: idx,
    ending,
    go,
    finish: () => setEnding(true),
    unEnd: () => setEnding(false),
    reset: { label: 'START OVER (PRACTICE)', run: () => go(0) },
  });

  const body = (id: RoomModuleId) => {
    switch (id) {
      case 'intro':
        return <IntroModule ctx={ctx} />;
      case 'create':
        return <CreateModule ctx={ctx} />;
      case 'monitoring':
        return <MonitoringModule ctx={ctx} />;
      case 'explore':
        return <ExploreModule ctx={ctx} />;
      case 'treatment':
        return <TreatmentModule ctx={ctx} />;
      case 'review':
        return <ReviewModule ctx={ctx} />;
    }
  };

  return (
    <LabNavProvider value={nav}>
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <LabHeader title={TITLE} subtitle={ending ? "What's left" : `${mod.num} · ${mod.title}`} right={<AccuracyNote compact detail="This lab models a room from the numbers you enter. It shows where problems are LIKELY, never what the room does — measure the real room with a calibrated analyzer and let the measurement have the last word." />} />
        <LabNavBar nav={nav} />
        {ending ? (
          <LabEndScreen
            labTitle="Room Design & Monitoring Lab"
            units={ROOM_MODULES.map((m) => ({ id: m.id, label: m.title }))}
            cleared={visited}
            mode="progress"
            noun="module"
            onJump={(id) => go(ROOM_MODULES.findIndex((m) => m.id === id))}
            onPracticeAgain={() => go(0)}
            onDone={() => navigation.goBack()}
          />
        ) : mod.rack ? (
          // The rack takes the rest of the height; its well scrolls and ends
          // on "NEXT: <module> ›" (LabNavProvider). Keyed on the module so a
          // revisit starts its own view state fresh — the design is shared.
          <View style={styles.rackFill}>{body(mod.id)}</View>
        ) : (
          <ScrollView contentContainerStyle={[styles.scroll, readingColumn]} keyboardShouldPersistTaps="handled">
            {body(mod.id)}
          </ScrollView>
        )}
      </View>
    </LabNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  rackFill: { flex: 1 },
  scroll: { padding: 16, paddingTop: 12, paddingBottom: 28 },
});
