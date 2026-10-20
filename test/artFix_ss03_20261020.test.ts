// Art fix ss03 (finding SS-03, drawing part, owner-approved 2026-10-20): the
// Sound Systems ChannelStrip draws MUTE ABOVE the pre-fader tap, matching the
// engine (this console's mute silences the pre-fader sends).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const d = readFileSync('src/screens/lab/soundsystems/art/diagrams.tsx', 'utf8');
const strip = d.slice(d.indexOf('export function ChannelStrip'), d.indexOf('/* ── 2 ·'));
const num = (re: RegExp) => Number((strip.match(re) ?? [])[1]);

describe('ss03: the strip draws MUTE before the PRE tap', () => {
  it('the fader block no longer claims the mute; MUTE has its own block', () => {
    assert.ok(!strip.includes("'FADER · PAN · MUTE'"));
    assert.ok(strip.includes("{ id: 'fader', y: 150, label: 'FADER · PAN' }"));
    assert.ok(strip.includes('label="MUTE"'));
  });
  it('order: insert → MUTE → PRE tap → fader → POST tap → assign', () => {
    const muteY = num(/const muteY = (\d+);/);
    const muteH = num(/const muteH = (\d+);/);
    const preY = num(/const preY = (\d+);/);
    const postY = num(/const postY = (\d+);/);
    const insertY = num(/id: 'insert', y: (\d+)/);
    const faderY = num(/id: 'fader', y: (\d+)/);
    const assignY = num(/id: 'assign', y: (\d+)/);
    assert.ok(insertY + 20 < muteY && muteY + muteH < preY - 4 && preY + 4 < faderY && faderY + 20 < postY - 4 && postY + 4 < assignY);
  });
  it('tapping MUTE selects the fader station (STATIONS has no mute entry)', () => {
    assert.match(strip, /label="MUTE" on=\{sel\('fader'\)\} onPress=\{\(\) => onTap\('fader'\)\}/);
    const r = readFileSync('src/screens/lab/soundsystems/pagesRoute.tsx', 'utf8');
    assert.ok(!r.includes("id: 'mute'"));
  });
  it('the a11y text reads mute before the pre-fader tap and keeps the console-dependent caption', () => {
    const a = strip.match(/a11y="(A channel strip[^"]+)"/)?.[1] ?? '';
    assert.ok(a.indexOf('the mute') < a.indexOf('pre-fader tap point'));
    assert.ok(a.includes('on this console the mute also silences the pre-fader sends; that depends on the console'));
  });
});
