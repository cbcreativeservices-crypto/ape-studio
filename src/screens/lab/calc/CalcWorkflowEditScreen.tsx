/**
 * CalcWorkflowEditScreen — the workflow BUILDER (Phase 2, owner spec
 * 2026-08-06). Name + optional description, add calculators from a searchable
 * picker, reorder with accessible ▲ / ▼ controls (no drag dependency), remove
 * steps, short per-step instructions, save. Deliberately a simple vertical
 * list — never a node editor.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { colors, fonts } from '../../../theme/tokens';
import { confirmDialog, notify } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import type { Workflow, WorkflowStep } from './workflowModel';
import { WORKFLOW_LIMITS } from './workflowModel';
import { workflowStore } from './workflowStore';
import { listCalculators, resolveStep, type CatalogEntry } from './workflowCatalog';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CalcWorkflowEditScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'CalcWorkflowEdit'>>();
  const editingId = route.params?.id;
  const { entitlement } = useEntitlement();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState(false);

  // Load the workflow being edited (new = blank).
  useEffect(() => {
    if (!editingId) return;
    void workflowStore.listWorkflows().then((list) => {
      const w = list.find((x) => x.id === editingId);
      if (!w) return;
      setName(w.name);
      setDescription(w.description ?? '');
      setSteps(w.steps);
      setCreatedAt(w.createdAt);
    });
  }, [editingId]);

  const catalog = useMemo(listCalculators, []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) =>
        c.fnName.toLowerCase().includes(q) ||
        c.workspaceName.toLowerCase().includes(q) ||
        c.sectionTitle.toLowerCase().includes(q),
    );
  }, [catalog, search]);

  const mutate = (fn: (s: WorkflowStep[]) => WorkflowStep[]) => {
    setSteps(fn);
    setDirty(true);
  };
  const addStep = (c: CatalogEntry) => {
    mutate((s) => [...s, { workspaceId: c.workspaceId, fnKey: c.fnKey }]);
    setPickerOpen(false);
    setSearch('');
  };
  const move = (i: number, dir: -1 | 1) => {
    mutate((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const removeStep = (i: number) => mutate((s) => s.filter((_, k) => k !== i));
  const setNote = (i: number, note: string) =>
    mutate((s) => s.map((st, k) => (k === i ? { ...st, note: note || undefined } : st)));

  const onSave = useCallback(async () => {
    // Defense in depth (owner 2026-08-06): creating a custom workflow is
    // Academy-only — even if this screen is reached some other way, the save
    // itself refuses. Editing an already-saved workflow is unaffected.
    // notify / confirmDialog, not Alert.alert: RN-web's Alert is a no-op, so
    // these notices were silent on the web preview (B-018/B-062).
    if (!editingId && WORKFLOW_LIMITS[entitlement].savedWorkflows === 0) {
      notify(
        'Build your own workflow?',
        'Building your own calculator workflows is a feature of Academy membership. You can still run the built-in templates.',
      );
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      notify('Name the workflow', 'Give the workflow a name before saving.');
      return;
    }
    if (steps.length === 0) {
      notify('Add a calculator', 'A workflow needs at least one calculator step.');
      return;
    }
    const now = new Date().toISOString();
    const w: Workflow = {
      id: editingId ?? Crypto.randomUUID(),
      name: trimmed,
      description: description.trim() || undefined,
      steps,
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
    const ok = await workflowStore.saveWorkflow(w);
    if (!ok) {
      notify('Save failed', 'The workflow could not be saved. Try again.');
      return;
    }
    navigation.goBack();
  }, [name, description, steps, editingId, createdAt, navigation, entitlement]);

  const onBack = () => {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    confirmDialog('Discard changes?', 'This workflow has unsaved changes.', 'Discard', () => navigation.goBack(), {
      cancelText: 'Keep editing',
      destructive: true,
    });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{editingId ? 'EDIT WORKFLOW' : 'NEW WORKFLOW'}</Text>
          <Text style={styles.subtitle}>Build a guided calculator sequence</Text>
        </View>
        <Pressable style={styles.saveBtn} onPress={() => void onSave()} accessibilityRole="button" accessibilityLabel="Save workflow">
          <Text style={styles.saveBtnText}>SAVE</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.fieldLabel}>WORKFLOW NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(t) => {
            setName(t);
            setDirty(true);
          }}
          placeholder="e.g. Delay Speaker Setup"
          placeholderTextColor="#4c4d55"
          accessibilityLabel="Workflow name"
        />
        <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            setDirty(true);
          }}
          placeholder="What this sequence is for"
          placeholderTextColor="#4c4d55"
          accessibilityLabel="Workflow description"
        />

        <Text style={styles.fieldLabel}>STEPS · {steps.length}</Text>
        {steps.length === 0 ? (
          <Text style={styles.caption}>No calculators yet — add the first one below.</Text>
        ) : (
          steps.map((s, i) => {
            const r = resolveStep(s);
            return (
              <View key={`${s.workspaceId}-${s.fnKey}-${i}`} style={styles.stepCard}>
                <View style={styles.stepHead}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepName}>{r ? r.fn.name : 'Unavailable calculator'}</Text>
                    <Text style={styles.stepWs}>{r ? r.ws.name : `${s.workspaceId} · ${s.fnKey}`}</Text>
                  </View>
                  <View style={styles.stepBtns}>
                    <StepBtn label="▲" a11y={`Move step ${i + 1} up`} disabled={i === 0} onPress={() => move(i, -1)} />
                    <StepBtn label="▼" a11y={`Move step ${i + 1} down`} disabled={i === steps.length - 1} onPress={() => move(i, 1)} />
                    <StepBtn label="✕" a11y={`Remove step ${i + 1}`} onPress={() => removeStep(i)} danger />
                  </View>
                </View>
                <TextInput
                  style={styles.noteInput}
                  value={s.note ?? ''}
                  onChangeText={(t) => setNote(i, t)}
                  placeholder="Short instruction for this step (optional)"
                  placeholderTextColor="#4c4d55"
                  accessibilityLabel={`Instruction for step ${i + 1}`}
                />
              </View>
            );
          })
        )}

        <Pressable
          style={styles.addBtn}
          onPress={() => setPickerOpen((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: pickerOpen }}
          accessibilityLabel="Add calculator"
        >
          <Text style={styles.addBtnText}>{pickerOpen ? '▾ ADD CALCULATOR' : '＋ ADD CALCULATOR'}</Text>
        </Pressable>

        {pickerOpen ? (
          <View style={styles.picker}>
            <TextInput
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholder="Search calculators"
              placeholderTextColor="#4c4d55"
              autoCorrect={false}
              accessibilityLabel="Search calculators"
            />
            {filtered.map((c) => (
              <Pressable
                key={`${c.workspaceId}-${c.fnKey}`}
                style={styles.pickRow}
                onPress={() => addStep(c)}
                accessibilityRole="button"
                accessibilityLabel={`Add ${c.fnName} from ${c.workspaceName}`}
              >
                <Text style={styles.pickName}>{c.fnName}</Text>
                <Text style={styles.pickWs}>{c.workspaceName} · {c.sectionTitle}</Text>
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text style={styles.caption}>No calculators match “{search.trim()}”.</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function StepBtn({ label, a11y, onPress, disabled, danger }: { label: string; a11y: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <Pressable
      style={[styles.stepBtn, danger && styles.stepBtnDanger, disabled && styles.stepBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={a11y}
    >
      <Text style={[styles.stepBtnText, danger && styles.stepBtnTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  saveBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.6)',
    backgroundColor: '#0c2012',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  fieldLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  input: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#45495a',
    backgroundColor: '#22242e',
    color: colors.textPrimary,
    fontFamily: fonts.barlowMedium,
    fontSize: 15,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  stepCard: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 10, gap: 8 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: { fontFamily: fonts.mono, fontSize: 15, color: colors.amber, width: 20, textAlign: 'center' },
  stepName: { fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 0.3, color: colors.textPrimary },
  stepWs: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  stepBtns: { flexDirection: 'row', gap: 6 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#161616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDanger: { borderColor: 'rgba(255,75,58,.5)', backgroundColor: '#1c0f0d' },
  stepBtnDisabled: { opacity: 0.35 },
  stepBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSecondary },
  stepBtnTextDanger: { color: '#ff8d7a' },
  noteInput: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#2c2c33',
    backgroundColor: '#17171c',
    color: colors.textSecondary,
    fontFamily: fonts.barlowRegular,
    fontSize: 13,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  addBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    backgroundColor: '#0d1710',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: colors.green },
  picker: { gap: 6 },
  pickRow: { borderRadius: 8, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#101014', padding: 10, gap: 2 },
  pickName: { fontFamily: fonts.oswaldMedium, fontSize: 13.5, color: colors.textPrimary },
  pickWs: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },
});
