/**
 * Glossary Links toggle sweep (owner 2026-09-29): blue fills in letter by
 * letter left→right when turned on; grey takes it back right→left when off.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const label = readFileSync('src/screens/glossary/LinksToggleLabel.tsx', 'utf8');
const screen = readFileSync('src/screens/glossary/GlossaryScreen.tsx', 'utf8');

test('the toggle renders the sweeping label, not a static coloured one', () => {
  assert.match(screen, /<LinksToggleLabel on=\{linksOn\} onColor=\{LINK_BLUE\} \/>/);
});

test('each letter is its own span coloured by the lit count', () => {
  assert.match(label, /LABEL\.split\(''\)\.map/);
  assert.match(label, /pos < lit \? onColor : colors\.textMuted/);
});

test('on steps up (left→right), off steps down (right→left), and no sweep on first render', () => {
  assert.match(label, /litRef\.current \+ \(on \? 1 : -1\)/);
  assert.match(label, /useState\(on \? STEPS : 0\)/);
});
