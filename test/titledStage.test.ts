/**
 * Full-screen stage titles (owner 2026-09-29: "the adding of title and
 * subtitle text over the full screen display works so apply it elsewhere").
 *
 * A long item name on a bezel cell crops ("SMALL POWERED-LOU…"). The shared
 * TitledStage prints the name (and one subtitle line) in full above the
 * drawing: always in FULL SCREEN, on the glass only where the drawing keeps
 * its size (a height-limited plot shrunk under the 9 pt floor otherwise).
 * Source guards: the shared component keeps those rules, full screen tells it
 * where it is, and the adopting pages use it instead of the cropped cells.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

describe('TitledStage — the shared header', () => {
  const src = read('src/screens/lab/rack/TitledStage.tsx');

  test('long lines wrap, never crop: no numberOfLines / ellipsis on the header', () => {
    assert.doesNotMatch(src, /numberOfLines|ellipsizeMode|adjustsFontSizeToFit/);
  });

  test('13 / 11 pt base sizes (never under 9 pt), grown only by the full-screen text scale', () => {
    assert.match(src, /fontSize: 13 \* ts/);
    assert.match(src, /fontSize: 11 \* ts/);
    assert.match(src, /const ts = full \? Math\.max\(1, scale\) : 1;/);
  });

  test('always in full screen; on the glass only when the drawing keeps its size', () => {
    assert.match(src, /useContext\(StageInFullScreen\)/);
    assert.match(src, /const show = full \|\| glass === 'always' \|\| roomy;/);
  });

  test('the header is measured, not a fixed guess', () => {
    assert.match(src, /onLayout=\{\(e\) => \{/);
    assert.match(src, /setHeadH\(hh\)/);
  });
});

describe('StageFullScreen tells the stage it is full screen', () => {
  test('provides StageInFullScreen around render(w, h)', () => {
    const src = read('src/screens/lab/rack/StageFullScreen.tsx');
    assert.match(src, /<StageInFullScreen\.Provider value>\{render\(w, h\)\}<\/StageInFullScreen\.Provider>/);
  });
});

describe('pages use the shared header instead of cropped bezel names', () => {
  const pages: { file: string; uses: number; gone: RegExp[] }[] = [
    {
      file: 'src/screens/lab/soundsystems/pagesLearnA.tsx',
      uses: 2,
      gone: [/k: 'TYPE', v: t\.name/, /k: 'SCALE'/, /k: 'CONFIG', v: c\.name/, /styles\.stageHead/],
    },
    {
      file: 'src/screens/lab/soundsystems/pagesLearnB.tsx',
      uses: 3,
      gone: [/k: 'FEED', v: f\.name/, /k: 'LAYOUT', v: l\.name/, /k: 'MONITOR', v: m\.name/, /k: 'STANDS AT'/],
    },
    { file: 'src/screens/lab/soundsystems/pagesTroubleshoot.tsx', uses: 1, gone: [/v: c \? c\.title/] },
    { file: 'src/screens/lab/soundsystems/pagesBuild.tsx', uses: 1, gone: [] },
  ];
  for (const p of pages) {
    test(p.file, () => {
      const src = read(p.file);
      assert.match(src, /import \{ TitledStage \} from '\.\.\/rack\/TitledStage';/);
      assert.equal((src.match(/<TitledStage /g) ?? []).length, p.uses);
      for (const g of p.gone) assert.doesNotMatch(src, g);
    });
  }
});
