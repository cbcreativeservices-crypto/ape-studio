/**
 * SHARED, hunt 13 (2026-10-04).
 *
 * 1. RackUnit full screen (lead leftover, with LABS A): a bezel cell's
 *    `onPress` and a dock 'action' key ran as-is while FULL SCREEN (a native
 *    Modal) was up. Harmonics' THD cell opens a Modal — refused over full
 *    screen on iOS (a dead tap whose host flag then sticks), drawn behind it
 *    on Android — and the Tube lab's REF key navigates underneath it. The
 *    rack now has an opt-in `leavesFull` on BezelItem and the 'action'
 *    DockParam, and wraps those presses in leaveFullThen (the same route out
 *    `help` and a tray chip's photo already take). Opt-in: tap-to-reset cells
 *    and replay keys stay in full screen.
 *
 * R2: against HEAD's rackTypes.ts / RackUnit.tsx the test fails.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');

test('rack: bezel cells and dock actions can opt in to leaving full screen first', () => {
  const types = read('screens/lab/rack/rackTypes.ts');
  const bezel = types.match(/export type BezelItem = \{[\s\S]*?\n\};/)?.[0] ?? '';
  assert.match(bezel, /\bleavesFull\?: boolean;/, 'BezelItem has no `leavesFull` opt-in');
  const action = types.match(/kind: 'action';[\s\S]*?\n {4}\};/)?.[0] ?? '';
  assert.match(action, /\bleavesFull\?: boolean;/, "the 'action' DockParam has no `leavesFull` opt-in");

  const rack = read('screens/lab/rack/RackUnit.tsx');
  // The dock action key: wrapped only when it opts in.
  assert.match(
    rack,
    /onPress=\{p\.leavesFull \? \(\) => leaveFullThen\(p\.onPress\) : p\.onPress\}/,
    'a leavesFull action key still runs inside full screen',
  );
  // Bezel cells: one routed list, used by BOTH strips (inline and full screen).
  assert.match(
    rack,
    /const bezelItems = stage\.bezel\?\.map\(\(it\) =>\s*it\.leavesFull && it\.onPress \? \{ \.\.\.it, onPress: \(\) => leaveFullThen\(it\.onPress as \(\) => void\) \} : it,?\s*\);/,
    'a leavesFull bezel cell still runs inside full screen',
  );
  const strips = rack.match(/<BezelReadouts items=\{[^}]*\}/g) ?? [];
  assert.equal(strips.length, 2, 'expected the inline and the full-screen bezel strip');
  for (const s of strips) assert.match(s, /items=\{bezelItems/, `a bezel strip bypasses the routed cells: ${s}`);
});

test('rack: the full-screen GROUP tray hands its lab content a way out of full screen', () => {
  // Binaural OBJ/SRC, Fx, Modular, Plate…: a group tray's chips long-press
  // straight into the lab's openLesson (a sibling Modal), never the rack's
  // `help`, so over full screen the sheet was refused (iOS) / drawn behind
  // (Android). The full-screen tray now provides leaveFullThen.
  const rack = read('screens/lab/rack/RackUnit.tsx');
  assert.match(rack, /export function useRackLeaveFull\(\)[^{]*\{\s*return useContext\(RackLeaveFullContext\);/, 'no useRackLeaveFull hook');
  const full = rack.match(/const trayNodeFull = \([\s\S]*?\);\r?\n/)?.[0] ?? '';
  assert.match(full, /<RackLeaveFullContext\.Provider value=\{leaveFullThen\}>\s*<DockTray /, 'the full-screen tray is not given leaveFullThen');
  // …and only there: the inline tray has no full screen to leave.
  const inline = rack.match(/const trayNode = [^\n]*/)?.[0] ?? '';
  assert.doesNotMatch(inline, /RackLeaveFullContext/);
});

test('LabChip routes a long-press through the rack leave-full hook (completes fix 2)', () => {
  const src = read('screens/lab/LabShell.tsx');
  assert.match(src, /const leaveFull = useRackLeaveFull\(\);/);
  assert.match(src, /onLongPress=\{onLongPress && leaveFull \? \(\) => leaveFull\(onLongPress\) : onLongPress\}/);
});
