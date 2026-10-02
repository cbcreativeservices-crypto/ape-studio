/**
 * ExperimentWell — the guided experiment that opened this studio, PINNED at the
 * top of the well (owner 2026-09-17: "you go away, come back, then eventually
 * find the instructions, but then you go away again"). Two faults were behind
 * that sentence and both are fixed here:
 *
 *   1. The card used to be a child of the rack well, and in rack mode every
 *      child sits INSIDE the LAB NOTES collapsible, under the generic intro —
 *      so arriving from module 8 the steps were out of sight. It now renders
 *      through LabShell's `rack.wellTop`, above the caption and outside every
 *      disclosure (the same house rule the first-move caption follows).
 *   2. Running the series meant back → scroll module 8 → SET UP → back again,
 *      once per experiment. The card now carries the series itself: N / 17,
 *      PREV and NEXT replace the studio route in place (jumping studios when
 *      the next experiment lives in another one), so the whole run happens
 *      without leaving the instrument. Back still returns to module 8.
 *
 * Teaching order is unchanged: PREDICT first, steps as tick-off rows, LOOK FOR
 * only on reveal.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, fonts } from '../../../theme/tokens';
import { EXPERIMENTS, experimentRoute, type Experiment } from '../../../features/cymatics/presets';
import type { RootStackParamList } from '../../../navigation/types';
import { goToCymatics } from './goToCymatics';
import { holdSessionWork, registerSessionCarry } from '../../../features/lab/sessionCarry';
import { createLocalStore } from '../../../features/storage/localStore';

/* ── tick-off persistence ───────────────────────────────────────────────────
   One key for the whole series, `{ [experimentId]: number[] }`, on the shared
   safe store (pattern catalog 2026-10-02, wave 2). A read that THREW is not
   an empty series: nothing is written over it until a read succeeds — it
   used to show no ticks, and the next tap saved `[i]` over that experiment's
   stored ticks once a later read worked. A tick is applied to the HYDRATED
   series (queued until the read lands); a read in flight across the account
   wipe lands nowhere. A damaged blob is set aside and the series starts
   empty. Swept by clearLocalAccountData's `ape:*` rule, so it does not follow
   an account switch. */
const TICKS_KEY = 'ape:cymatics:experimentTicks:v1';
type HeldTicks = Record<string, number[]>;
const NO_TICKS: readonly number[] = [];

const ticksStore = createLocalStore<HeldTicks>({
  key: TICKS_KEY,
  empty: () => ({}),
  parse: (parsed) => {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not a tick series');
    const all: HeldTicks = {};
    for (const [id, t] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(t)) all[id] = t.filter((n): n is number => typeof n === 'number');
    }
    return all;
  },
});

/** Pure: experiment `id`'s ticks with step `i` ticked (`on`) or unticked. */
function withTick(cur: readonly number[], i: number, on: boolean): number[] {
  return on ? (cur.includes(i) ? [...cur] : [...cur, i]) : cur.filter((k) => k !== i);
}

/* ── the sign-in hand-off (owner ruling 2026-10-01) ─────────────────────────
   The ticks are written for everyone, but signing in wipes this device's
   `ape:*` keys — so the ticks a GUEST makes in this app session are held by
   the shared ledger (features/lab/sessionCarry, `guestOnly`: an account's own
   ticks need no carrying) and written back after the sign-in's wipe. A tick
   taken off again in the session is let go of too. */
const CARRY_KEY = 'cymatics:ticks';

/** Pure: the held ticks after one tick (`on`) or untick of step `i`. */
export function withHeldTick(prev: HeldTicks | undefined, id: string, i: number, on: boolean): HeldTicks {
  return { ...prev, [id]: withTick(prev?.[id] ?? [], i, on) };
}

/** Pure: the stored series plus the held ticks — each experiment a union. */
export function mergeHeldTicks(all: HeldTicks, held: HeldTicks): HeldTicks {
  const out = { ...all };
  for (const [id, ticks] of Object.entries(held)) {
    const cur = Array.isArray(out[id]) ? out[id] : [];
    out[id] = [...new Set([...cur, ...ticks])];
  }
  return out;
}

// Merged into the HYDRATED series — never over ticks that could not be read;
// true only when the device took the write.
registerSessionCarry<HeldTicks>(CARRY_KEY, (held) => ticksStore.mutate((all) => mergeHeldTicks(all, held)));

export function ExperimentWell({ experiment }: { experiment: Experiment }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  /**
   * Tick-offs, PERSISTED per experiment (2026-09-18, design review #3).
   *
   * These lived in local state and were cleared on every PREV/NEXT, so running
   * the seventeen across two sittings lost everything — and even inside one
   * sitting, stepping forward and back wiped the ticks. Seventeen experiments
   * with no memory is not a course, it is a pile: the learner cannot answer
   * "where was I?", which is the question that decides whether they come back.
   */
  const all = ticksStore.use();
  const done = all[experiment.id] ?? NO_TICKS;
  const [revealed, setRevealed] = useState(false);
  /** Has the learner committed to a prediction? See the PREDICT card below. */
  const [committed, setCommitted] = useState(false);
  const [open, setOpen] = useState(true);
  /** The stored ticks have LANDED (full-app run 2, 2026-10-01): a tick decides
   *  on or off from what the learner SEES, so it waits for the read — or for
   *  the read to have FAILED, when the tick is applied to the stored series
   *  once a read succeeds (never written over it; a lab never locks). */
  const ticksReady = ticksStore.useHydrated() || ticksStore.isUnreadable();
  const toggle = (i: number) => {
    if (!ticksReady) return;
    const on = !done.includes(i);
    void ticksStore.mutate((a) => ({ ...a, [experiment.id]: withTick(a[experiment.id] ?? [], i, on) }));
    holdSessionWork<HeldTicks>(CARRY_KEY, (prev) => withHeldTick(prev, experiment.id, i, on), { guestOnly: true });
  };

  const index = EXPERIMENTS.findIndex((e) => e.id === experiment.id);
  const prev = index > 0 ? EXPERIMENTS[index - 1] : undefined;
  const next = index >= 0 && index < EXPERIMENTS.length - 1 ? EXPERIMENTS[index + 1] : undefined;
  // Replace, never push: the studio stays a single screen in the stack, so ‹
  // back always lands on the experiments list however far the learner ran.
  const go = (e: Experiment) => {
    const r = experimentRoute(e);
    // Ticks are NOT cleared here any more: they are per-experiment and
    // persisted, and the effect above loads the next one's.
    setRevealed(false);
    setCommitted(false);
    setOpen(true);
    navigation.dispatch(StackActions.replace(r.route, r.params));
  };
  const where = (e: Experiment) => (e.studio === 'liquid' ? 'dish' : e.studio === 'membrane' ? 'drum' : 'plate');

  /**
   * REVEAL has to be EARNED (2026-09-18, design review #2).
   *
   * It used to be available as the very first action in the well: a learner
   * could open an experiment and read the answer before touching anything, at
   * no cost. The asymmetry between a prediction-error you FELT and an
   * explanation you READ is the entire retention mechanism, and the lab offered
   * both and let people take the cheap one.
   *
   * Two cheap conditions, not a puzzle: commit a prediction where the
   * experiment asks for one, and tick at least one step. Both are one tap. The
   * point is not difficulty, it is ORDER.
   */
  const predicted = !experiment.predict || committed;
  const started = done.length > 0;
  const earned = predicted && started;
  const lockedWhy = !predicted
    ? 'MAKE YOUR PREDICTION FIRST'
    : 'TICK A STEP FIRST';

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.eyebrow}>EXPERIMENT {experiment.num} / {EXPERIMENTS.length}</Text>
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={open ? 'Fold the experiment steps' : 'Unfold the experiment steps'}>
          <Text style={styles.fold}>{open ? '▾ FOLD' : '▸ STEPS'}</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{experiment.title}</Text>
      {open ? (
        <>
          <Text style={styles.goal}>{experiment.goal}</Text>
          {experiment.predict ? (
            <View style={styles.predict}>
              <Text style={styles.predictHead}>PREDICT FIRST</Text>
              <Text style={styles.predictBody}>{experiment.predict}</Text>
              {/* ── COMMIT, DO NOT JUST READ (2026-09-18, design review #2) ──
                  A prediction only works if it is committed BEFORE the answer
                  is reachable. This used to be a paragraph to read, with REVEAL
                  one tap away and free — so the cheap path (read the answer)
                  and the expensive one (be wrong, then find out) sat side by
                  side and nothing pushed anyone toward the second.

                  Tapping this is the commitment. It is not graded and it is not
                  stored: what it buys is the half-second of actually deciding,
                  which is the whole mechanism. */}
              {committed ? (
                <Text style={styles.committedNote}>Prediction locked in — now run the steps.</Text>
              ) : (
                <Pressable
                  onPress={() => setCommitted(true)}
                  style={styles.commit}
                  accessibilityRole="button"
                  accessibilityLabel="I have made my prediction"
                >
                  <Text style={styles.commitText}>I’VE MADE MY PREDICTION</Text>
                </Pressable>
              )}
            </View>
          ) : null}
          {experiment.steps.map((s, i) => {
            const on = done.includes(i);
            return (
              <Pressable key={i} hitSlop={8} onPress={() => toggle(i)} style={styles.step} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Step ${i + 1}: ${s}`}>
                <Text style={[styles.box, on && styles.boxOn]}>{on ? '✓' : `${i + 1}`}</Text>
                <Text style={[styles.stepText, on && styles.stepDone]}>{s}</Text>
              </Pressable>
            );
          })}
          {/* ── THE SERIES HAS AN ENDING NOW (2026-09-18, design review #3/#20) ─
              At experiment 17, NEXT was simply disabled and greyed. Eight
              modules, three studios and seventeen experiments, and nothing
              anywhere said "here is the answer to the question the home asked
              you" — and the lab's ONLY retrieval instrument, Evidence vs Myth,
              sat at position 7 of 8 where most learners never reach it.
              Retrieval placed AFTER the experience is worth several times
              retrieval placed before it, so the series now delivers them to it. */}
          {!next ? (
            <View style={styles.finale}>
              <Text style={styles.finaleHead}>THAT IS THE SERIES — ALL {EXPERIMENTS.length}</Text>
              <Text style={styles.finaleBody}>
                Here is what you found. Sound does not have one universal shape. The figure depends on the
                object — its geometry, size, material, thickness, how it is held, where it is driven and how
                much it is damped. The same tone makes a strong pattern on one plate, nothing on another, and
                a different pattern on a third. That was the question the very first module asked you.
              </Text>
              <Pressable
                style={styles.finaleBtn}
                onPress={() => goToCymatics(navigation, 'CymaticsModule', { id: 'myth' })}
                accessibilityRole="button"
                accessibilityLabel="Check yourself with Evidence versus Myth"
              >
                <Text style={styles.finaleBtnText}>NOW CHECK YOURSELF · EVIDENCE VS MYTH ›</Text>
              </Pressable>
            </View>
          ) : null}
          {revealed ? (
            <Text style={styles.lookFor}>
              <Text style={styles.lookForHead}>LOOK FOR · </Text>
              {experiment.lookFor}
            </Text>
          ) : (
            <Pressable
              onPress={() => setRevealed(true)}
              disabled={!earned}
              style={[styles.reveal, !earned && styles.revealLocked]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !earned }}
              accessibilityLabel={earned ? 'Reveal what to look for' : lockedWhy}
            >
              <Text style={[styles.revealText, !earned && styles.revealTextLocked]}>
                {earned ? 'REVEAL LOOK FOR ›' : lockedWhy}
              </Text>
            </Pressable>
          )}
        </>
      ) : null}
      {/* The series, in the instrument: run all seventeen without going back.
          Named EXPERIMENT, not PREV / NEXT: those two words mean LAB navigation
          only (kit/LabNavBar, owner 2026-09-30). */}
      <View style={styles.navRow}>
        <Pressable
          style={[styles.navBtn, !prev && styles.navBtnOff]}
          disabled={!prev}
          onPress={() => prev && go(prev)}
          accessibilityRole="button"
          accessibilityLabel={prev ? `Previous experiment: ${prev.title}, on the ${where(prev)}` : 'No previous experiment'}
        >
          <Text style={[styles.navText, !prev && styles.navTextOff]}>‹ EXPERIMENT</Text>
        </Pressable>
        <Pressable style={styles.navBtn} onPress={() => goToCymatics(navigation, 'CymaticsModule', { id: 'experiments' })} accessibilityRole="button" accessibilityLabel="Back to the list of all experiments">
          <Text style={styles.navText}>ALL 17</Text>
        </Pressable>
        <Pressable
          style={[styles.navBtn, styles.navNext, !next && styles.navBtnOff]}
          disabled={!next}
          onPress={() => next && go(next)}
          accessibilityRole="button"
          accessibilityLabel={next ? `Next experiment: ${next.title}, on the ${where(next)}` : 'No next experiment'}
        >
          <Text style={[styles.navText, styles.navNextText, !next && styles.navTextOff]}>
            {next ? (next.studio === experiment.studio ? 'EXPERIMENT ›' : `EXPERIMENT · ${where(next).toUpperCase()} ›`) : 'EXPERIMENT ›'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#15120a', padding: 12, gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amber },
  fold: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 16, color: colors.textPrimary, marginTop: -4 },
  goal: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  predict: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(127,212,255,.5)', backgroundColor: '#0a1520', padding: 10, gap: 3 },
  commit: { alignSelf: 'flex-start', marginTop: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(127,212,255,.6)', paddingHorizontal: 12, paddingVertical: 9, minHeight: 44, justifyContent: 'center' },
  commitText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: '#7fd4ff' },
  committedNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: '#7fd4ff', marginTop: 4 },
  finale: { marginTop: 10, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(55,224,95,.55)', backgroundColor: 'rgba(55,224,95,.08)', padding: 12, gap: 8 },
  finaleHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, color: '#37e05f' },
  finaleBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textPrimary },
  finaleBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(55,224,95,.7)', paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  finaleBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: '#37e05f' },
  revealLocked: { borderColor: '#2a2a32', opacity: 0.75 },
  revealTextLocked: { color: colors.textSub },
  predictHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: '#7fd4ff' },
  predictBody: { fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minHeight: 32 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: '#3a3a44', textAlign: 'center', lineHeight: 22, fontFamily: fonts.oswaldSemiBold, fontSize: 12, color: colors.amber },
  boxOn: { backgroundColor: 'rgba(55,224,95,.18)', borderColor: '#37e05f', color: '#37e05f' },
  stepText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  stepDone: { color: colors.textSub },
  reveal: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 12, paddingVertical: 7 },
  revealText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.amber },
  lookFor: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  lookForHead: { fontFamily: fonts.oswaldSemiBold, color: colors.amber },
  navRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  navBtn: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingVertical: 9, alignItems: 'center' },
  navBtnOff: { opacity: 0.35 },
  navNext: { flex: 1.4, borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.10)' },
  navText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textSecondary },
  navNextText: { color: colors.amber },
  navTextOff: { color: colors.textSub },
});
