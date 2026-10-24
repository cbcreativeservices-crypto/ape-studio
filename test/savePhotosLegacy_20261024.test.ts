/**
 * iOS SAVE to Photos (audit 2026-10-24, high): in expo-media-library 57 the
 * ROOT import's saveToLibraryAsync is a stub that throws ("import this method
 * from expo-media-library/legacy"), so every iPhone/iPad save of a Harmonograph
 * or Cymatics card said "Saving failed" in builds 36 and 38. The app must load
 * the /legacy entry, which calls the native module those builds contain.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the installed library: root save throws, /legacy calls native', () => {
  const warn = read('node_modules/expo-media-library/src/legacyWarnings.ts');
  assert.match(warn, /export async function saveToLibraryAsync\(localUri: string\): Promise<void> \{\n\s+throw errorOnLegacyMethodUse/);
  const legacy = read('node_modules/expo-media-library/src/legacy/MediaLibrary.ts');
  assert.match(legacy, /return await MediaLibrary\.saveToLibraryAsync\(localUri\);/);
});

test('the app loads the /legacy entry for SAVE, never the root import', () => {
  const loaders = read('src/features/tools/capture/optionalModule.ts');
  assert.match(loaders, /'expo-media-library\/legacy': \(\) => require\('expo-media-library\/legacy'\)/);
  assert.doesNotMatch(loaders, /require\('expo-media-library'\)/);
  const exp = read('src/screens/lab/harmoExport.ts');
  assert.match(exp, /optionalModule<MediaLibraryLib>\('expo-media-library\/legacy'\)/);
});
