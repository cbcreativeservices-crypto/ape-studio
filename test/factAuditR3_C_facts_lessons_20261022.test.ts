/**
 * Fact-audit fix pass, Round 3 (final), group C_facts_lessons (2026-10-22):
 * Computer B's HEDGE / CONTEXT / CAN'T CONFIRM rows on the weekly notification
 * facts (curated JSON), guided lessons / tool help, and the src/data copy.
 * A representative sample of the fixes is pinned so the overstated claim
 * cannot come back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const raw = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
// Whitespace collapsed so strings concatenated across source lines read as one.
const read = (rel: string) => raw(rel).replace(/\s+/g, ' ');

type Entry = { term: string; body: string };
const MIS = JSON.parse(raw('src/features/notifications/curated/misunderstoodTerms.json')) as Entry[];
const ODD = JSON.parse(raw('src/features/notifications/curated/oddTerms.json')) as Entry[];
const body = (list: Entry[], term: string) => {
  const hits = list.filter((e) => e.term === term);
  assert.equal(hits.length, 1, `exactly one entry for ${term}`);
  return hits[0].body;
};

const CONTENT = read('src/features/lab/guidedLessons/content.ts');
const HELP = read('src/features/lab/guidedLessons/toolHelp.tsx');
const LABREQ = read('src/data/labRequirements.ts');
const ABOUT = read('src/data/topicAbout.ts');
const CRED = read('src/data/credentialCopy.ts');
const SEED = raw('docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql');

describe('curated lists keep their shape after the Round 3 edits', () => {
  for (const [name, list] of [['misunderstood', MIS], ['odd', ODD]] as const) {
    it(`${name}: every entry is {term, body}, body ≤ 160 chars`, () => {
      for (const e of list) {
        assert.deepEqual(Object.keys(e).sort(), ['body', 'term']);
        assert.ok(e.body.length > 0 && e.body.length <= 160, `${e.term}: ${e.body.length} chars`);
      }
    });
  }
  it("CAN'T CONFIRM terms with no source are gone from the odd list", () => {
    for (const t of ['x-copy', 'rock crusher', 'F-wrench']) {
      assert.equal(ODD.filter((e) => e.term === t).length, 0, t);
    }
  });
});

describe('weekly notification facts', () => {
  it('F095470: the constant-voltage amp is what drives the 70/100 V line', () => {
    const b = body(MIS, 'Constant-voltage amplifier');
    assert.ok(b.includes('drives the 70V or 100V line'));
    assert.ok(!b.includes('separate systems sharing one name'));
  });
  it('F095518: pi and bridged-T pads also match both ends', () => {
    const b = body(MIS, 'Balanced T-pad');
    assert.ok(b.includes('T, H, pi and bridged-T pads do'));
    assert.ok(!b.includes('only a true T-pad or H-pad'));
  });
  it('F095663: PFL ignores the fader; AFL and solo-in-place follow it', () => {
    const b = body(MIS, 'AFL & PFL (monitor bus modes)');
    assert.ok(b.includes('AFL and solo-in-place follow the fader'));
    assert.ok(!b.includes('full signal level'));
  });
  it('F096067: riding the gain usually means the fader', () => {
    const b = body(MIS, 'Riding the gain');
    assert.ok(b.includes('Usually it does'));
    assert.ok(!b.includes("Actually it's adjusting input trim"));
  });
  it('F096176: myth and fact now both talk about mics in general; risk narrowed to older ribbons', () => {
    const b = body(MIS, 'Microphone preamplifier');
    assert.ok(b.includes('safe for any mic') && b.includes('mainly older ones'));
    assert.ok(!b.includes('Many ribbon mics can be damaged'));
  });
  it('F095832: phantom saturates a transformer only through a fault or imbalance', () => {
    const b = body(MIS, 'Phantom power transformer');
    assert.ok(b.includes('Balanced phantom cancels in the winding'));
    assert.ok(!b.includes('not every transformer is rated for that DC'));
  });
  it('F096937/F097020: the Zwicker tone sits inside the gap, not at one exact frequency', () => {
    for (const t of ['Zwicker tone', 'Auditory Negative Afterimage']) {
      const b = body(ODD, t);
      assert.ok(b.includes('inside the missing gap'), t);
      assert.ok(!b.includes('exactly the missing frequency'), t);
    }
  });
  it('F097368: the unverified stage-lighting origin of "upfader" is gone', () => {
    assert.ok(!body(ODD, 'upfader').includes('stage-lighting'));
  });
  it('F097178: no unverified "doink" claim; the doit rises', () => {
    const b = body(ODD, 'Fall-off'); // renamed from 'Fall-off/doink' (glossary R2, 2026-10-24)
    assert.ok(!b.includes('doink') && b.includes('the doit, swoops up'));
  });
  it('F096353: a few tube mics do run on phantom', () => {
    const b = body(ODD, 'Tube Microphone');
    assert.ok(b.startsWith('Most tube mics'));
  });
});

describe('guided lessons and tool help', () => {
  it('F001461: fast attack + slow release is no longer taught as "glue"', () => {
    assert.ok(!CONTENT.includes('Fast attack + slow release "glues"'));
    assert.ok(CONTENT.includes('most start with a medium-slow attack and a release timed to the groove'));
  });
  it('F001524: true-peak oversampling depends on the base rate', () => {
    assert.ok(CONTENT.includes('oversample to about 192 kHz (4× at 48 kHz, 2× at 96 kHz)'));
    assert.ok(!CONTENT.includes('needs ≥4× oversampling'));
  });
  it('F001616/F001621: carrier pitch holds only for whole-number ratios', () => {
    assert.ok(!CONTENT.includes('Rich, bell-like; pitch stays at the carrier.'));
    assert.ok(CONTENT.includes('as long as the modulator is a whole-number multiple of the carrier, the perceived pitch stays at the carrier'));
  });
  it('F001832: no "180° behind the front pressure" claim', () => {
    assert.ok(!CONTENT.includes('~180° behind the front pressure'));
    assert.ok(CONTENT.includes('runs about 180° behind the force driving it'));
  });
  it('F001904: mid-curve bias is the class A case', () => {
    assert.ok(CONTENT.includes('In a class A stage, biasing means parking this dot mid-curve'));
  });
  it('F001990: single-box cardioid subs exist', () => {
    assert.ok(!CONTENT.includes('One sub alone can never do this.'));
  });
  it('F002217: control-room levels are per-speaker pink-noise calibration levels', () => {
    assert.ok(HELP.includes('per speaker, set with pink noise at about −20 dBFS'));
  });
  it('F002282: a hand-clap is weak in the bass', () => {
    assert.ok(HELP.includes('a sharp hand-clap works for a quick look but is weak in the bass'));
    assert.ok(!HELP.includes('A balloon pop or sharp hand-clap is a great free impulse'));
  });
});

describe('src/data copy', () => {
  it('F001054: dropouts and clicks can be signs of an edit, not "the first signs"', () => {
    assert.ok(!LABREQ.includes('are the first signs of an edit'));
    assert.ok(!SEED.includes('are the first signs of an edit'), 'seed regenerated');
    assert.ok(SEED.includes('can be signs of an edit'));
  });
  it('F001110/F001177: the subtractive layout is behind most synths, not every', () => {
    assert.ok(!LABREQ.includes('behind every synthesiser'));
  });
  it('F001111: FM is not the most-used technique', () => {
    assert.ok(!LABREQ.includes('FM is the technique most often used'));
  });
  it('F094184: court acceptance is the requirement; certification is weighed', () => {
    assert.ok(CRED.includes('requires acceptance as an expert by the court, which usually weighs recognized professional certification'));
  });
  it('F094648: the speed of sound depends on temperature', () => {
    assert.ok(!ABOUT.includes('moving through air at a fixed speed'));
  });
  it('F095137: only sticky-shed polyester tape is baked; acetate never', () => {
    assert.ok(ABOUT.includes('sticky-shed polyester tapes baked under controlled conditions'));
    assert.ok(ABOUT.includes('acetate tapes are never baked'));
  });
  it('F095096: near-neighbours overlap in sounding, not written, range', () => {
    assert.ok(ABOUT.includes('instruments whose sounding ranges overlap'));
  });
});
