/**
 * Fact-audit Round 1, group B_facts_data (Comp B return, 2026-10-22).
 *
 * Pins every S1 fix in the weekly notification fact lists, the Career Finder
 * index and the topic overviews: the corrected wording is present and the
 * wrong claim is gone. Also pins the "dry" pair so the four dry items agree
 * (dry = no added reverb/delay; EQ and compression can still apply).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

type Entry = { term: string; body: string };
const MIS = JSON.parse(read('src/features/notifications/curated/misunderstoodTerms.json')) as Entry[];
const ODD = JSON.parse(read('src/features/notifications/curated/oddTerms.json')) as Entry[];
const bodyOf = (list: Entry[], term: string) => {
  const hits = list.filter((e) => e.term === term);
  assert.equal(hits.length, 1, `exactly one "${term}" entry`);
  return hits[0].body;
};
const allBodies = (list: Entry[]) => list.map((e) => e.body).join('\n');

describe('misunderstoodTerms.json — S1 fact fixes', () => {
  const all = allBodies(MIS);

  it('T-power vs phantom: phantom is on both signal pins, not the shield (F095495)', () => {
    assert.doesNotMatch(all, /48 V on the shield/);
    assert.match(all, /phantom puts 48 V on both signal pins/);
  });

  it('PCM: a higher sample rate DOES raise the bit rate (F095679)', () => {
    assert.doesNotMatch(all, /raising one doesn't raise the other/);
    assert.match(all, /In PCM, more samples mean more bits\./);
  });

  it('Perseus: 57 octaves below middle C, not below human hearing (F095719)', () => {
    assert.doesNotMatch(all, /57 octaves below human hearing/);
    assert.match(all, /about 57 octaves below middle C/);
  });

  it('random incidence: the free-field mic needs the correction, not the diffuse-field one (F095835)', () => {
    assert.doesNotMatch(all, /diffuse-field mics need random-incidence correction/);
    assert.match(all, /a free-field mic needs a random-incidence correction there; a diffuse-field mic doesn't\./);
  });

  it('ERB vs Bark: both widen with frequency (F095914)', () => {
    assert.doesNotMatch(all, /instead of staying fixed/);
    assert.match(all, /both widen with frequency, but ERB bands are narrower, most of all in the lows/);
  });

  it('supercardioid: nulls toward the rear near 125°, not at the sides (F096003)', () => {
    assert.doesNotMatch(all, /true nulls sit at the sides/);
    assert.match(all, /its deepest nulls sit near 125°, not at the sides/);
  });

  it('Thiele/Small: the Q values do not add; their inverses do (F096330)', () => {
    assert.doesNotMatch(all, /mechanical and electrical damping simply add together/);
    assert.match(all, /their inverses add, so Qts is lower than either one/);
  });

  it('the four "dry" items agree: dry = no added reverb/delay, not "unprocessed" (F095953, F096238, F096287, F095954)', () => {
    assert.doesNotMatch(all, /Dry means unprocessed/);
    assert.doesNotMatch(all, /dry just means unprocessed/);
    assert.doesNotMatch(all, /it only means no added reverb -/);
    assert.match(bodyOf(MIS, 'Dry Signal'), /Most engineers mean no reverb or delay/);
    assert.match(all, /it means no added reverb, delay or other space - EQ and compression can still apply/);
    assert.match(all, /dry just means no added reverb or delay — it can still be loud and pristine/);
    assert.match(bodyOf(MIS, 'Dry monitor mix'), /no added reverb or delay/);
  });
});

describe('oddTerms.json — S1 fact fixes', () => {
  const all = allBodies(ODD);

  it('mule block carries real load and must be rated (F096365)', () => {
    const b = bodyOf(ODD, 'Mule block');
    assert.doesNotMatch(b, /carries none of the load/);
    assert.match(b, /the rope's pull still loads it, so it must be rated like any block/);
  });

  it('sound needs matter, not gas (F096527); solar waves leak up, not into space (F096523)', () => {
    assert.doesNotMatch(all, /sound needs a gas to travel/);
    assert.match(bodyOf(ODD, 'Atmospheric infrasound on planets'), /sound needs matter to travel/);
    const sun = bodyOf(ODD, 'Acoustic cutoff frequency');
    assert.doesNotMatch(sun, /pitch ceiling|into space/);
    assert.match(sun, /leak upward into the Sun's thin outer layers/);
  });

  it('MiniDisc: Kerr effect is the READ method; no maker name (F096607)', () => {
    const b = bodyOf(ODD, 'MiniDisc recording');
    assert.doesNotMatch(b, /an effect called the Kerr effect|Sony/);
    assert.match(b, /a magnetic field wrote it\. Playback read it by the Kerr effect/);
  });

  it('line-by-line mixing is current practice, not history (F097349)', () => {
    const b = bodyOf(ODD, 'Line-by-Line Mixing');
    assert.doesNotMatch(b, /Before automatic mic mixers/);
    assert.match(b, /In musical theatre the mixer still follows the script by hand, line by line/);
  });

  it('general emergency alarm is seven OR MORE short blasts (F097379)', () => {
    const b = bodyOf(ODD, 'General Emergency Alarm System');
    assert.doesNotMatch(b, /seven short blasts and one long/);
    assert.match(b, /seven or more short blasts, then one long one/);
  });

  it("a transformer's yoke is part of the core, not the windings (F097411)", () => {
    const b = bodyOf(ODD, 'yoke');
    assert.doesNotMatch(b, /windings around a transformer's core/);
    assert.match(b, /the part of a transformer's core that joins its legs/);
  });

  it('dubbing pair agrees with PFX pull and sync latitude (F097391, F097395)', () => {
    assert.doesNotMatch(bodyOf(ODD, 'International Foley'), /every one of them by hand from scratch/);
    assert.match(bodyOf(ODD, 'International Foley'), /editors save what they can/);
    assert.doesNotMatch(bodyOf(ODD, 'Isochrony'), /timing exactly/);
  });
});

describe('the curated lists keep their shape', () => {
  for (const [name, list] of [['misunderstoodTerms', MIS], ['oddTerms', ODD]] as const) {
    it(`${name}: every entry is {term, body}, non-empty, body ≤ 160 chars`, () => {
      for (const e of list) {
        assert.deepEqual(Object.keys(e).sort(), ['body', 'term'], JSON.stringify(e));
        assert.ok(e.term.length > 0 && e.body.length > 0);
        assert.ok(e.body.length <= 160, `${e.term}: ${e.body.length} chars`);
      }
    });
  }
});

describe('careerIndex.json — patent roles (F091987, F091988)', () => {
  type Raw = { id: string; t: string; wm: number; prep: number; reg?: 1 };
  const index = JSON.parse(read('src/data/careerIndex.json')) as { enums: { preparation: string[]; workModel: string[] }; careers: Raw[] };
  const byId = (id: string) => index.careers.find((c) => c.id === id)!;

  it('Audio Patent Agent needs a science/engineering background and the registration exam', () => {
    const c = byId('AC-0895');
    assert.equal(c.t, 'Audio Patent Agent');
    const prep = index.enums.preparation[c.prep];
    assert.doesNotMatch(prep, /portfolio|associate/i);
    assert.match(prep, /Science or engineering degree .*registration exam/);
    assert.equal(c.reg, 1);
  });

  it('Patent Examiner needs a bachelor’s in engineering or science and is government staff', () => {
    const c = byId('AC-0896');
    assert.match(c.t, /^Patent Examiner/);
    const prep = index.enums.preparation[c.prep];
    assert.doesNotMatch(prep, /portfolio|associate/i);
    assert.match(prep, /^Bachelor's degree in engineering or science required/);
    assert.doesNotMatch(index.enums.workModel[c.wm], /freelance|project/i);
    assert.match(index.enums.workModel[c.wm], /government patent office/);
  });
});

describe('topicAbout.ts — underwater propagation (F095188)', () => {
  const src = read('src/data/topicAbout.ts');
  it('no false claim that air never makes shadow zones', () => {
    assert.doesNotMatch(src, /shadow zones air never produces/);
    assert.match(src, /bending propagation into shadow zones and into deep channels that can carry sound across entire ocean basins/);
  });
});
