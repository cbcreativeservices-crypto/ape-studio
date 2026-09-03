/**
 * CalcProjectsScreen — Saved Projects (Phase 4, owner spec 2026-08-06).
 *
 * A project is a LIGHTWEIGHT reusable collection of named values ("Church
 * Sanctuary", "Studio A"…): each value carries a label, a QuantityKind and a
 * base-unit number, so workflows can offer it to any compatible input.
 * Updating a project is always a deliberate action on THIS screen — runs never
 * write back into a project.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { colors, fonts } from '../../../theme/tokens';
import { confirmDialog, notify } from '../../../lib/confirm';
import type { RootStackParamList } from '../../../navigation/types';
import { useEntitlement } from '../../../features/commercial/EntitlementProvider';
import { QUANTITIES, fmt, type QuantityKind } from './calcUnits';
import type { Project } from './workflowModel';
import { WORKFLOW_LIMITS } from './workflowModel';
import { workflowStore } from './workflowStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Curated kinds for project values (spec examples: room dims, temperature,
 *  distances, cable length, impedance, sensitivity, power, target SPL…). */
const PROJECT_KINDS: { kind: QuantityKind; label: string }[] = [
  { kind: 'length', label: 'Length / distance' },
  { kind: 'temperature', label: 'Temperature' },
  { kind: 'spl', label: 'SPL' },
  { kind: 'power', label: 'Power' },
  { kind: 'impedance', label: 'Impedance' },
  { kind: 'sensitivity', label: 'Sensitivity' },
  { kind: 'frequency', label: 'Frequency' },
  { kind: 'time', label: 'Time' },
  { kind: 'voltage', label: 'Voltage' },
  { kind: 'percent', label: 'Percent' },
  { kind: 'number', label: 'Count' },
];

/** Editor row state — raw text in the selected display unit. */
type DraftValue = { label: string; kindIdx: number; unitIdx: number; raw: string };

function toDraft(p: Project): DraftValue[] {
  return p.values.map((v) => {
    const kindIdx = Math.max(0, PROJECT_KINDS.findIndex((k) => k.kind === v.quantity));
    const units = QUANTITIES[PROJECT_KINDS[kindIdx].kind];
    return { label: v.label, kindIdx, unitIdx: 0, raw: fmt(units[0].fromBase(v.baseValue), 6) };
  });
}

export function CalcProjectsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { entitlement } = useEntitlement();
  const limits = WORKFLOW_LIMITS[entitlement];

  const [projects, setProjects] = useState<Project[]>([]);
  // Inline editor: null = list view; {id: null} = creating new.
  const [editing, setEditing] = useState<{ id: string | null; createdAt: string | null } | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [values, setValues] = useState<DraftValue[]>([]);

  const reload = useCallback(() => {
    void workflowStore.listProjects().then(setProjects);
  }, []);
  useEffect(reload, [reload]);

  const guardCreate = (): boolean => {
    if (limits.savedProjects == null || projects.length < limits.savedProjects) return true;
    // confirmDialog / notify, not Alert.alert: RN-web's Alert is a no-op, so
    // these prompts were silent taps on the web preview (B-018/B-062).
    if (limits.savedProjects === 0) {
      confirmDialog('Sign in to save projects', 'Saved projects need an account.', 'Sign in', () => (navigation as any).navigate('Auth'), {
        cancelText: 'Not now',
      });
    } else {
      confirmDialog(
        'Project limit reached',
        `Your account keeps up to ${limits.savedProjects} projects. Academy membership removes the limit.`,
        'See membership',
        () => (navigation as any).navigate('Paywall'),
        { cancelText: 'Not now' },
      );
    }
    return false;
  };

  const openNew = () => {
    if (!guardCreate()) return;
    setEditing({ id: null, createdAt: null });
    setName('');
    setNotes('');
    setValues([]);
  };

  const openEdit = (p: Project) => {
    setEditing({ id: p.id, createdAt: p.createdAt });
    setName(p.name);
    setNotes(p.notes ?? '');
    setValues(toDraft(p));
  };

  const removeProject = (p: Project) => {
    confirmDialog(
      'Delete project?',
      `“${p.name}” and its saved values will be removed.`,
      'Delete',
      () => void workflowStore.deleteProject(p.id).then(reload),
      { destructive: true },
    );
  };

  const saveProject = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      notify('Name the project', 'Give the project a name before saving.');
      return;
    }
    const out: Project['values'] = [];
    for (const v of values) {
      const label = v.label.trim();
      const kind = PROJECT_KINDS[v.kindIdx].kind;
      const units = QUANTITIES[kind];
      const base = units[v.unitIdx % units.length].toBase(parseFloat(v.raw));
      if (!label || !Number.isFinite(base)) continue; // skip incomplete rows honestly
      if (out.some((x) => x.label === label)) continue; // labels stay unique
      out.push({ label, quantity: kind, baseValue: base });
    }
    const now = new Date().toISOString();
    const p: Project = {
      id: editing?.id ?? Crypto.randomUUID(),
      name: trimmed,
      notes: notes.trim() || undefined,
      values: out,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = await workflowStore.saveProject(p);
    if (!ok) {
      notify('Save failed', 'The project could not be saved. Try again.');
      return;
    }
    setEditing(null);
    reload();
  };

  const setVal = (i: number, patch: Partial<DraftValue>) =>
    setValues((vs) => vs.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (editing ? setEditing(null) : navigation.goBack())}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{editing ? (editing.id ? 'EDIT PROJECT' : 'NEW PROJECT') : 'SAVED PROJECTS'}</Text>
          <Text style={styles.subtitle}>Reusable values for calculator workflows</Text>
        </View>
        {editing ? (
          <Pressable style={styles.saveBtn} onPress={() => void saveProject()} accessibilityRole="button" accessibilityLabel="Save project">
            <Text style={styles.saveBtnText}>SAVE</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.saveBtn} onPress={openNew} accessibilityRole="button" accessibilityLabel="New project">
            <Text style={styles.saveBtnText}>＋ NEW</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!editing ? (
          projects.length === 0 ? (
            <Text style={styles.caption}>
              A project stores a venue or rig’s values — room dimensions, temperature, listener
              distance, impedance, target SPL — so any workflow can pull them in with one tap.
            </Text>
          ) : (
            projects.map((p) => (
              <View key={p.id} style={styles.card}>
                <Text style={styles.cardName}>{p.name}</Text>
                {p.notes ? <Text style={styles.caption}>{p.notes}</Text> : null}
                <Text style={styles.valueLine}>
                  {p.values.length === 0
                    ? 'no values yet'
                    : p.values.map((v) => `${v.label}`).join(' · ')}
                </Text>
                <View style={styles.actionRow}>
                  <ActionBtn label="EDIT" onPress={() => openEdit(p)} />
                  <ActionBtn label="DELETE" destructive onPress={() => removeProject(p)} />
                </View>
              </View>
            ))
          )
        ) : (
          <>
            <Text style={styles.fieldLabel}>PROJECT NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Church Sanctuary"
              placeholderTextColor="#4c4d55"
              accessibilityLabel="Project name"
            />
            <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything worth remembering about this venue or rig"
              placeholderTextColor="#4c4d55"
              accessibilityLabel="Project notes"
            />

            <Text style={styles.fieldLabel}>VALUES · {values.length}</Text>
            {values.map((v, i) => {
              const kind = PROJECT_KINDS[v.kindIdx];
              const units = QUANTITIES[kind.kind];
              const unit = units[v.unitIdx % units.length];
              return (
                <View key={i} style={styles.valueCard}>
                  <View style={styles.valueRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={v.label}
                      onChangeText={(t) => setVal(i, { label: t })}
                      placeholder="Label (e.g. Listener distance)"
                      placeholderTextColor="#4c4d55"
                      accessibilityLabel={`Value ${i + 1} label`}
                    />
                    <Pressable
                      style={styles.kindChip}
                      onPress={() => setVal(i, { kindIdx: (v.kindIdx + 1) % PROJECT_KINDS.length, unitIdx: 0, raw: '' })}
                      accessibilityRole="button"
                      accessibilityLabel={`Value type ${kind.label}, tap to change`}
                    >
                      <Text style={styles.kindChipText}>{kind.label} ⇄</Text>
                    </Pressable>
                  </View>
                  <View style={styles.valueRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={v.raw}
                      onChangeText={(t) => setVal(i, { raw: t })}
                      placeholder="0"
                      placeholderTextColor="#4c4d55"
                      keyboardType="numbers-and-punctuation"
                      autoCorrect={false}
                      accessibilityLabel={`Value ${i + 1} number`}
                    />
                    {unit.label !== '' ? (
                      <Pressable
                        style={styles.kindChip}
                        onPress={() => setVal(i, { unitIdx: (v.unitIdx + 1) % units.length })}
                        disabled={units.length < 2}
                        accessibilityRole="button"
                        accessibilityLabel={`Unit ${unit.label}${units.length > 1 ? ', tap to change' : ''}`}
                      >
                        <Text style={styles.kindChipText}>{unit.label}{units.length > 1 ? ' ⇄' : ''}</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => setValues((vs) => vs.filter((_, k) => k !== i))}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove value ${i + 1}`}
                    >
                      <Text style={styles.removeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            <Pressable
              style={styles.addBtn}
              onPress={() => setValues((vs) => [...vs, { label: '', kindIdx: 0, unitIdx: 0, raw: '' }])}
              accessibilityRole="button"
              accessibilityLabel="Add value"
            >
              <Text style={styles.addBtnText}>＋ ADD VALUE</Text>
            </Pressable>
            <Text style={styles.caption}>
              Rows without a label or a valid number are skipped on save. Workflows only offer a
              project value to inputs of the SAME kind — a power never fills a voltage.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActionBtn({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable style={[styles.actionBtn, destructive && styles.actionBtnDanger]} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.actionText, destructive && styles.actionTextDanger]}>{label}</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  saveBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2, color: colors.green },
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  fieldLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
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
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 6 },
  cardName: { fontFamily: fonts.oswaldMedium, fontSize: 15.5, letterSpacing: 0.5, color: colors.textPrimary },
  valueLine: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17, color: colors.textSub },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionBtn: { borderRadius: 7, borderWidth: 1, borderColor: '#3a3a3a', backgroundColor: '#161616', paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnDanger: { borderColor: 'rgba(255,75,58,.5)', backgroundColor: '#1c0f0d' },
  actionText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textSecondary },
  actionTextDanger: { color: '#ff8d7a' },
  valueCard: { borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 10, gap: 8 },
  valueRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  kindChip: { borderRadius: 8, borderWidth: 1.5, borderColor: '#45495a', paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#2a2c36' },
  kindChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.amber },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,75,58,.5)',
    backgroundColor: '#1c0f0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: '#ff8d7a' },
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
});
