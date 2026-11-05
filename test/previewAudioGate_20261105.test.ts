/**
 * The Profile and Settings web previews (2026-11-05). The real app mounts
 * <AudioOutputGate> at the root; a preview has its own small tree, so it must
 * mount the gate itself. Profile renders AudioOutputRow, whose
 * useAudioOutputGate() throws outside the gate, and the hash stayed blank.
 * Settings does not reach the hook today; it carries the gate so the two
 * harnesses match the app and a future audio row cannot blank it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** The JSX tag names from the outermost element in to `target`, or null. */
function ancestorsOf(file: string, target: string): string[] | null {
  const text = readFileSync(join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found: string[] | null = null;
  const walk = (node: ts.Node, chain: string[]) => {
    let next = chain;
    if (ts.isJsxElement(node)) {
      const name = node.openingElement.tagName.getText(source);
      if (name === target) found ??= chain;
      next = [...chain, name];
    }
    ts.forEachChild(node, (child) => walk(child, next));
  };
  walk(source, []);
  return found;
}

describe('account screen previews mount the audio gate', () => {
  for (const file of ['src/screens/profile/ProfilePreview.tsx', 'src/screens/settings/SettingsPreview.tsx']) {
    it(`${file} mounts the screen inside <AudioOutputGate>`, () => {
      const chain = ancestorsOf(file, 'NavigationContainer');
      assert.ok(chain, 'the preview still has a NavigationContainer');
      assert.ok(chain.includes('AudioOutputGate'), `ancestors: ${chain.join(' > ')}`);
    });

    it(`${file} keeps the gate inside EntitlementProvider, as the app and ToolPreview do`, () => {
      const chain = ancestorsOf(file, 'AudioOutputGate');
      assert.ok(chain?.includes('EntitlementProvider'), `ancestors: ${chain?.join(' > ')}`);
    });
  }
});
