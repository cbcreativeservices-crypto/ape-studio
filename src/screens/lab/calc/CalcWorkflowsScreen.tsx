/**
 * CalcWorkflowsScreen — "Calculator Workflows" home (Phase 2, owner spec
 * 2026-08-06): My Workflows + built-in Templates in one list. Manage-only for
 * now — the step-through runner arrives in the next phase; every control here
 * does something real today (no dead buttons).
 *
 * Templates are read-only: FAVORITE or DUPLICATE & CUSTOMIZE (copies into My
 * Workflows and opens the builder). Saved workflows: EDIT · DUPLICATE · DELETE.
 * Saving is entitlement-gated via WORKFLOW_LIMITS (gate on entitlement — house
 * rule); hitting a limit routes to the Paywall, never a silent failure.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { colors, fonts } from '../../../theme/tokens';
import { confirmDialog } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import type { Workflow } from './workflowModel';
import { WORKFLOW_LIMITS } from './workflowModel';
import { workflowStore } from './workflowStore';
import { WORKFLOW_TEMPLATES, resolveStep, validateWorkflow } from './workflowCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CalcWorkflowsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { entitlement } = useEntitlement();
  const limits = WORKFLOW_LIMITS[entitlement];

  const [mine, setMine] = useState<Workflow[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [dropNote, setDropNote] = useState<string | null>(null);

  const reload = useCallback(() => {
    void workflowStore.listWorkflows().then((list) => {
      // Repair pass (spec): unresolvable steps are dropped and DISCLOSED.
      let droppedTotal = 0;
      const repaired = list.map((w) => {
        const { workflow, dropped } = validateWorkflow(w);
        droppedTotal += dropped;
        if (dropped > 0) void workflowStore.saveWorkflow(workflow);
        return workflow;
      });
      setMine(repaired);
      setDropNote(
        droppedTotal > 0
          ? `${droppedTotal} step${droppedTotal === 1 ? '' : 's'} referenced a calculator that no longer exists and ${droppedTotal === 1 ? 'was' : 'were'} removed.`
          : null,
      );
    });
    void workflowStore.getFavorites().then(setFavorites);
  }, []);
  useEffect(() => {
    const unsub = navigation.addListener('focus', reload);
    reload();
    return unsub;
  }, [navigation, reload]);

  const atLimit = limits.savedWorkflows != null && mine.length >= limits.savedWorkflows;

  /** Gate CREATING a custom workflow (new or duplicate-and-customize) — an
   *  Academy feature (owner 2026-08-06). The copy names the ACTION the user
   *  actually pressed, not a generic "saving" line. */
  const guardSave = (action: 'create' | 'duplicate'): boolean => {
    if (!atLimit) return true;
    // confirmDialog, not Alert.alert: RN-web's Alert is a no-op, so these
    // gates were silent taps on the web preview (B-018/B-062).
    const seePlans = () => (navigation as any).navigate('Paywall');
    if (limits.savedWorkflows === 0) {
      confirmDialog(
        action === 'duplicate' ? 'Customize this template?' : 'Build your own workflow?',
        action === 'duplicate'
          ? 'Duplicating a template creates your own custom calculator workflow — a feature of Academy membership. You can still run any template as-is.'
          : 'Building your own calculator workflows is a feature of Academy membership. You can still run the built-in templates.',
        'See membership',
        seePlans,
        { cancelText: 'Not now' },
      );
    } else {
      confirmDialog(
        'Workflow limit reached',
        `Your account keeps up to ${limits.savedWorkflows} workflows. Academy membership removes the limit.`,
        'See membership',
        seePlans,
        { cancelText: 'Not now' },
      );
    }
    return false;
  };

  const onNew = () => {
    if (!guardSave('create')) return;
    navigation.navigate('CalcWorkflowEdit', {});
  };

  const moveMine = (id: string, dir: -1 | 1) => {
    void workflowStore.moveWorkflow(id, dir).then(setMine);
  };

  const duplicate = async (src: Workflow) => {
    if (!guardSave('duplicate')) return;
    const now = new Date().toISOString();
    const copy: Workflow = {
      ...src,
      id: Crypto.randomUUID(),
      name: `${src.name} copy`,
      isTemplate: false,
      createdAt: now,
      updatedAt: now,
    };
    await workflowStore.saveWorkflow(copy);
    reload();
    navigation.navigate('CalcWorkflowEdit', { id: copy.id });
  };

  const remove = (w: Workflow) => {
    confirmDialog(
      'Delete workflow?',
      `“${w.name}” will be removed. Saved results are kept.`,
      'Delete',
      () => {
        void workflowStore.deleteWorkflow(w.id).then(reload);
      },
      { destructive: true },
    );
  };

  const toggleFav = (id: string) => {
    void workflowStore.toggleFavorite(id).then(setFavorites);
  };

  const Row = ({ w, template, index, count }: { w: Workflow; template: boolean; index?: number; count?: number }) => (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardName}>{w.name}</Text>
        {/* Reorder My Workflows (owner 2026-08-06) — accessible ▲▼, persisted. */}
        {!template && index != null && count != null ? (
          <View style={styles.orderBtns}>
            <Pressable
              style={[styles.orderBtn, index === 0 && styles.orderBtnDisabled]}
              onPress={() => moveMine(w.id, -1)}
              disabled={index === 0}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityState={{ disabled: index === 0 }}
              accessibilityLabel={`Move ${w.name} up`}
            >
              <Text style={styles.orderBtnText}>▲</Text>
            </Pressable>
            <Pressable
              style={[styles.orderBtn, index === count - 1 && styles.orderBtnDisabled]}
              onPress={() => moveMine(w.id, 1)}
              disabled={index === count - 1}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityState={{ disabled: index === count - 1 }}
              accessibilityLabel={`Move ${w.name} down`}
            >
              <Text style={styles.orderBtnText}>▼</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          onPress={() => toggleFav(w.id)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ selected: favorites.includes(w.id) }}
          accessibilityLabel={favorites.includes(w.id) ? 'Remove favorite' : 'Favorite'}
        >
          <Text style={[styles.favStar, favorites.includes(w.id) && styles.favStarOn]}>★</Text>
        </Pressable>
      </View>
      {w.description ? <Text style={styles.caption}>{w.description}</Text> : null}
      <Text style={styles.stepsLine}>
        {w.steps.map((s, i) => `${i + 1}. ${stepLabel(w, i)}`).join('   ')}
      </Text>
      <View style={styles.actionRow}>
        <ActionBtn label="▶ RUN" primary onPress={() => navigation.navigate('CalcWorkflowRun', { id: w.id })} />
        {template ? (
          <ActionBtn label="DUPLICATE & CUSTOMIZE" onPress={() => void duplicate(w)} />
        ) : (
          <>
            <ActionBtn label="EDIT" onPress={() => navigation.navigate('CalcWorkflowEdit', { id: w.id })} />
            <ActionBtn label="DUPLICATE" onPress={() => void duplicate(w)} />
            <ActionBtn label="DELETE" destructive onPress={() => remove(w)} />
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>CALCULATOR WORKFLOWS</Text>
          <Text style={styles.subtitle}>Guided sequences of the lab’s calculators</Text>
        </View>
        <Pressable style={styles.newBtn} onPress={onNew} accessibilityRole="button" accessibilityLabel="New workflow">
          <Text style={styles.newBtnText}>＋ NEW</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {dropNote ? <Text style={styles.warnText}>⚠ {dropNote}</Text> : null}

        <Text style={[styles.sectionTitle, { color: colors.green }]}>
          MY WORKFLOWS{limits.savedWorkflows != null && limits.savedWorkflows > 0 ? ` · ${mine.length}/${limits.savedWorkflows}` : ''}
        </Text>
        {mine.length === 0 ? (
          <Text style={styles.caption}>
            {limits.savedWorkflows === 0
              ? 'Building your own workflows is an Academy membership feature — the templates below are ready to run.'
              : 'Nothing saved yet — start from a template below, or build one with ＋ NEW.'}
          </Text>
        ) : (
          mine.map((w, i) => <Row key={w.id} w={w} template={false} index={i} count={mine.length} />)
        )}

        <Text style={[styles.sectionTitle, { color: colors.blue }]}>WORKFLOW TEMPLATES</Text>
        <Text style={styles.caption}>Built-in sequences using the lab’s calculators. Duplicate one to customize it.</Text>
        {WORKFLOW_TEMPLATES.map((w) => (
          <Row key={w.id} w={w} template />
        ))}
      </ScrollView>
    </View>
  );
}

function stepLabel(w: Workflow, i: number): string {
  const r = resolveStep(w.steps[i]);
  return r ? r.fn.name : 'unavailable';
}

function ActionBtn({ label, onPress, destructive, primary }: { label: string; onPress: () => void; destructive?: boolean; primary?: boolean }) {
  return (
    <Pressable
      style={[styles.actionBtn, destructive && styles.actionBtnDanger, primary && styles.actionBtnPrimary]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.actionText, destructive && styles.actionTextDanger, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  newBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.6)',
    backgroundColor: '#0c2012',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  scroll: { padding: 16, paddingBottom: 34, gap: 10 },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  warnText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff9b8f' },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  favStar: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: '#4a4a52' },
  favStarOn: { color: colors.gold },
  orderBtns: { flexDirection: 'row', gap: 5 },
  orderBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBtnDisabled: { opacity: 0.35 },
  orderBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.textSecondary },
  stepsLine: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17, color: colors.textSub },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  actionBtn: { borderRadius: 7, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#161616', paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnDanger: { borderColor: 'rgba(255,75,58,.5)', backgroundColor: '#1c0f0d' },
  actionBtnPrimary: { borderColor: 'rgba(55,224,95,.6)', backgroundColor: '#0c2012' },
  actionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSecondary },
  actionTextDanger: { color: '#ff8d7a' },
  actionTextPrimary: { color: colors.green },
});
