/**
 * Owner 2026-10-31:
 *  1. "top-left everywhere" — the way out (HOME, or ‹ deeper in) is top-left.
 *  2. Labs, Tools and the Enrollment dashboard show THEIR OWN title at the
 *     top, not a repeat of the app title and logo. The CompactBrandBar
 *     (logo · PRO AUDIO TRAINING ACADEMY · HOME) is deleted; each screen's
 *     title row starts with the HomeOrBackKey.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), 'src', p), 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\/.*$/gm, '');

const SCREENS: Array<[string, string]> = [
  ['screens/lab/AudioLearningScreen.tsx', 'LEARNING LABS'],
  ['screens/lab/EarLabScreen.tsx', '{headerTitle}'],
  ['screens/tools/ToolsHubScreen.tsx', 'AUDIO TOOLS'],
  ['screens/awards/AwardsScreen.tsx', '{pageHeadline(currentKey)}'],
];

describe('screen titles at the top, way out top-left (owner 2026-10-31)', () => {
  it('the CompactBrandBar is gone', () => {
    assert.equal(existsSync(join(process.cwd(), 'src/components/CompactBrandBar.tsx')), false);
  });
  for (const [p, title] of SCREENS) {
    it(`${p}: no app-title bar; HomeOrBackKey comes before the screen title`, () => {
      const s = code(read(p));
      assert.doesNotMatch(s, /<CompactBrandBar\b/);
      assert.doesNotMatch(s, /PRO AUDIO <Text/);
      const key = s.indexOf('<HomeOrBackKey');
      assert.ok(key > 0, 'HomeOrBackKey present');
      // The title follows the key in the same row (a few lines on).
      const t = s.indexOf(title, key);
      assert.ok(t > key && t - key < 900, `the way out leads the row that holds ${title}`);
    });
  }
  it('lab menus: no repeated section heading on a one-section page; Accuracy right of the title', () => {
    const s = read('screens/lab/EarLabScreen.tsx');
    assert.match(s, /shownSections\.length > 1 \? \(\s*<View style=\{styles\.sectionHead\}>/);
    const header = s.slice(s.indexOf('<HomeOrBackKey'), s.indexOf('<ScrollView'));
    assert.ok(header.indexOf('{headerSub}</Text>\n        </View>') > 0, 'title column closes before the chip');
    assert.ok(header.indexOf('<AccuracyNote') > header.indexOf('{headerSub}'), 'Accuracy sits after (right of) the title column');
  });
  it('the Glossary HOME key still leads its header row', () => {
    const s = read('screens/glossary/GlossaryScreen.tsx');
    const header = s.slice(s.indexOf('<View style={styles.header}>'));
    assert.ok(header.indexOf('icon="Home"') < header.indexOf('GLOSSARY</Text>'));
  });
});
