/**
 * MembershipGateHost never presents over (or just after) another Modal
 * (bug hunt 2026-09-30). The members-only lock popup presented its own root
 * Modal; iOS refuses that while a sheet or a lab's FULL SCREEN is presenting,
 * so the popup silently never appeared (Android drew it behind). It now uses
 * DimModal's keyed hosting exactly as AppDialogHost does, under key
 * 'membership'.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

describe('MembershipGateHost hosts inside an open Modal', () => {
  const gate = code('src/features/commercial/MembershipGate.tsx');
  const host = gate.slice(gate.indexOf('export function MembershipGateHost'), gate.indexOf('const styles'));

  test('imports the keyed-hosting API from DimModal', () => {
    assert.match(
      gate,
      /import \{ Modal, rootModalHoldMs, setHostedOverlay, useModalHostOpen \} from '\.\.\/\.\.\/components\/DimModal';/,
    );
  });

  test('asks about OTHER Modals only, and waits out a closing one', () => {
    assert.match(host, /useModalHostOpen\(true\)/);
    assert.match(host, /const hostedMode = live && otherModalOpen;/);
    assert.match(host, /rootModalHoldMs\(\)/);
    assert.match(host, /setTimeout\(\(\) => setTick/);
  });

  test("publishes under its own 'membership' key with an onBack that dismisses", () => {
    assert.match(
      host,
      /setHostedOverlay\(hostedMode && card \? \{ node: card, onBack: closeMembershipGate \} : null, 'membership'\)/,
    );
    assert.doesNotMatch(host, /'dialog'|'gate'\)/);
  });

  test('clears the hosted card on blur / unmount', () => {
    assert.match(host, /return \(\) => setHostedOverlay\(null, 'membership'\);\s*\}, \[focused\]\);/);
  });

  test('otherwise presents its own DimModal as before, marked overlayPublisher', () => {
    // Bug pass 3: the same condition, recorded as `ownModal` for the tie-break.
    assert.match(host, /ownModal\.current = live && !hostedMode && holdMs <= 0;\s*if \(!ownModal\.current\) return null;/);
    assert.match(host, /<Modal[\s\S]*?overlayPublisher[\s\S]*?onRequestClose=\{closeMembershipGate\}/);
    assert.match(host, /\{card\}\s*<\/Modal>/);
  });
});
