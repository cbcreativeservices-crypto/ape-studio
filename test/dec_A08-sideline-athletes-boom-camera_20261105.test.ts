/**
 * Decisions 8, 34 and 3 (Boom Camera), 2026-11-05.
 *
 * 8: B10 TIMING changed nothing in the display. The timeline strip now sits
 * inside the display: the speech along the track, the mic's move on it, and
 * the lost words in red, from the existing Handoff data.
 *
 * 34: B11 WEARER drew coach and official the same. A small role tag now sits
 * on the figure; the figure's own drawing does not change.
 *
 * 3: the boom mic's drawn size comes from the mic data, so a short shotgun and
 * a compact hypercardioid differ in length.
 *
 * Reads the source: the hooks' render trees need Skia on a real page, and the
 * tool run at 375 wide is the proof of what shows.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/miking/lessons/shared/broadcast/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const sport = read('sportPages.tsx');
const art = read('SportSpeechArt.tsx');
const camera = read('CameraArt.tsx');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  const j = s.indexOf(b, i);
  assert.ok(i >= 0 && j > i, `${a} … ${b}`);
  return s.slice(i, j);
};

describe('decision 8: the handoff timeline is in the display', () => {
  const hook = between(sport, 'export function useHandoffStep', 'A BODY MIC, FRONT AND SIDE (frame T) ──');
  const strip = between(sport, 'function HandoffStrip', 'export function useHandoffStep');

  it('the strip is drawn inside the rack, not down the well', () => {
    const rack = between(hook, 'render: (w, h) =>', "badge: 'From above");
    assert.match(rack, /<HandoffStrip w=\{w\} h=\{STRIP_H\} t=\{T\} \/>/);
    assert.match(rack, /<FieldStage w=\{w\} h=\{h - STRIP_H\}/);
    assert.doesNotMatch(between(hook, 'well: (', '/* ──'), /HandoffStrip/);
  });

  it('it follows the TIMING control', () => {
    assert.match(hook, /const T = TIMINGS\[timing\]\.h;/);
  });

  it('it draws speech, the mic move and the lost words from the Handoff data', () => {
    assert.match(strip, /p\.lineTo\(x\(t\.moveStart\), atReporter\)/);
    assert.match(strip, /p\.lineTo\(x\(arrives\), atGuest\)/);
    assert.match(strip, /late > 0 \? <RoundedRect x=\{x\(t\.answerStart\)\}[^\n]*color="#ff6b5e"/);
    assert.match(strip, /early > 0 \? <RoundedRect x=\{x\(t\.moveStart\)\}[^\n]*color="#ff6b5e"/);
    assert.match(strip, /OF THE ANSWER LOST/);
    assert.match(strip, /OF THE QUESTION LOST/);
    assert.match(strip, /NO WORDS LOST/);
  });

  it('strip text is 9 pt, fitted, read only', () => {
    assert.equal((strip.match(/<Text /g) ?? []).length, (strip.match(/fitValue\(9\)/g) ?? []).length);
    assert.match(sport, /tick: \{[^}]*fontSize: 9\b/);
    assert.doesNotMatch(strip, /onPress|Pressable/);
  });
});

describe('decision 34: the role tag', () => {
  const hook = between(sport, 'export function useBodyStep', 'const styles = StyleSheet.create');

  it('the tag rides over the stage and follows WEARER and VIEW', () => {
    assert.match(hook, /<RoleTag who=\{who\} x=\{xf\.ox \+ \(view === 'front' \? 0 : TAG_SIDE_U\) \* xf\.s\} y=\{xf\.oy \+ TAG_V \* xf\.s\} \/>/);
  });

  it('each role has its own word and colour', () => {
    const tags = between(art, 'const ROLE_TAG', 'export function RoleTag');
    const rows = [...tags.matchAll(/(coach|official|athlete): \{ word: '([A-Z]+)', bg: '(#[0-9a-f]{6})'/g)];
    assert.deepEqual(rows.map((r) => r[2]), ['COACH', 'OFFICIAL', 'ATHLETE']);
    assert.equal(new Set(rows.map((r) => r[3])).size, 3);
  });

  it('the tag text is fitted', () => {
    assert.match(between(art, 'export function RoleTag', 'const tagStyles'), /\{\.\.\.fitValue\(10\)\}/);
    assert.match(between(art, 'const tagStyles', '/** A small amber ring'), /fontSize: 10\b/);
  });
});

describe('decision 3, Boom Camera: the mic length from the mic data', () => {
  it('the drawn size is read from the two mics', () => {
    const look = between(camera, 'export function boomMicLook', 'export function cameraSpec');
    assert.match(look, /FIELD_MIC_TYPES\.locBoomHyper : FIELD_MIC_TYPES\.locBoomSg/);
    assert.match(look, /t\.body\.length\.mm/);
    assert.match(look, /t\.body\.radius\.mm/);
  });
});
