/**
 * CAST FIGURES — the winds area (owner 2026-11-26: "fix the figures to our cast"): the a-lessons (A01–A12) and
 * the shared brass / low brass / sax / woodwind folders already draw every player in the approved look; what
 * was wrong was the setting plans showing one person twice — the drummer at the kit AND the trombone beside the
 * trumpet (A01), AND the tenor beside the soprano, alto and baritone (A05a, A05b, A05d). A plan's neighbor is
 * now never a person already on the plan (planPeople): its own role's person when free, else the first free
 * cast member in the cast's fixed order. (A02's own trombonist and A05c's own tenor are the drummer by the
 * core's role table while the kit's drummer is on their plans too: that needs the core, see the report.)
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LS = 'src/screens/lab/miking/lessons';

const { ROLES } = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const { planPeople, PLAN_CAST_ORDER } = R(await import('../src/screens/lab/miking/lessons/shared/brass/planPeople.ts'));
const { A01_PLAN } = R(await import('../src/screens/lab/miking/lessons/a01Trumpet/plan.ts'));
const { A02_PLAN } = R(await import('../src/screens/lab/miking/lessons/a02Trombone/plan.ts'));
const { A05A_PLAN } = R(await import('../src/screens/lab/miking/lessons/a05aSopranoSax/plan.ts'));
const { A05B_PLAN } = R(await import('../src/screens/lab/miking/lessons/a05bAltoSax/plan.ts'));
const { A05C_PLAN } = R(await import('../src/screens/lab/miking/lessons/a05cTenorSax/plan.ts'));
const { A05D_PLAN } = R(await import('../src/screens/lab/miking/lessons/a05dBaritoneSax/plan.ts'));
const { SOPRANO, ALTO, TENOR, BARITONE } = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxSpec.ts'));

type Obj = { id: string; kind: string; pose?: { spec: { id: string } }; posture?: { row: { id: string } } };
const brassRole = (spec: string) => ROLES[spec === 'trumpet' || spec === 'flugelhorn' ? 'brass.trumpet' : 'brass.trombone'];
const saxRole = (row: string) => ROLES[`sax.${row}` as 'sax.alto'];

/** The plan's people as the setting page picks them: the fixed ones, then each neighbor. */
function brassPeople(L: { P: { spec: { id: string } }; objects: readonly Obj[] }) {
  const fixed = [brassRole(L.P.spec.id)];
  if (L.objects.some((o) => o.kind === 'kit')) fixed.push(ROLES['kit.drummer']);
  if (L.objects.some((o) => o.kind === 'singer')) fixed.push(ROLES['voice.singer']);
  const near = L.objects.filter((o) => o.kind === 'brass' && o.pose).map((o) => ({ id: o.id, want: o.pose!.spec.id === L.P.spec.id ? ROLES['brass.second'] : brassRole(o.pose!.spec.id) }));
  return { fixed, near: planPeople(fixed, near) as Record<string, string> };
}
function saxPeople(self: string, L: { objects: readonly Obj[] }) {
  const fixed = [saxRole(self)];
  if (L.objects.some((o) => o.kind === 'kit')) fixed.push(ROLES['kit.drummer']);
  const near = L.objects.filter((o) => o.kind === 'sax' && o.posture).map((o) => ({ id: o.id, want: o.posture!.row.id === self ? ROLES['sax.second'] : saxRole(o.posture!.row.id) }));
  return { fixed, near: planPeople(fixed, near) as Record<string, string> };
}
const neighborsApart = (p: { fixed: string[]; near: Record<string, string> }) => {
  const n = Object.values(p.near);
  assert.equal(new Set(n).size, n.length, `two neighbors are one person: ${n.join(', ')}`);
  for (const who of n) assert.ok(!p.fixed.includes(who), `a neighbor (${who}) is a person the plan already shows (${p.fixed.join(', ')})`);
};

describe('cast figures — winds: planPeople', () => {
  it('keeps a free role, and gives a taken one the first free cast member in the fixed order', () => {
    assert.deepEqual([...PLAN_CAST_ORDER], ['drummer', 'ana', 'ruth', 'kofi', 'mei']);
    assert.deepEqual(planPeople(['ruth'], [{ id: 'a', want: 'kofi' }]), { a: 'kofi' });
    assert.deepEqual(planPeople(['ruth', 'drummer', 'ana'], [{ id: 'a', want: 'kofi' }, { id: 'b', want: 'drummer' }]), { a: 'kofi', b: 'mei' });
  });
});

describe('cast figures — winds: no plan shows a neighbor who is already on it', () => {
  it('A01 trumpet: the trombone beside is no longer the kit\'s drummer', () => {
    const p = brassPeople(A01_PLAN);
    neighborsApart(p);
    assert.notEqual(p.near.tb, ROLES['kit.drummer']);
    assert.equal(p.near.tp2, ROLES['brass.second'], 'the second trumpet keeps its role');
  });
  it('A02 trombone: the second trombone and the trumpet are apart from the player and the drummer', () => {
    neighborsApart(brassPeople(A02_PLAN));
  });
  it('A05a–d saxophones: the neighbors are apart from the player and the kit\'s drummer', () => {
    for (const [self, L] of [[SOPRANO.id, A05A_PLAN], [ALTO.id, A05B_PLAN], [TENOR.id, A05C_PLAN], [BARITONE.id, A05D_PLAN]] as const) {
      const p = saxPeople(self, L);
      neighborsApart(p);
      for (const o of L.objects as readonly Obj[]) if (o.kind === 'sax') assert.notEqual(p.near[o.id], ROLES['kit.drummer'], `${self}: ${o.id}`);
    }
  });
});

describe('cast figures — winds: the setting pages read planPeople', () => {
  it('BrassSettingPage', () => {
    const src = read(`${LS}/shared/brass/BrassSettingPage.tsx`);
    assert.match(src, /return planPeople\(fixed, near\);/);
    assert.match(src, /<BrassTop P=\{o\.pose\} dim=\{0\.7\} who=\{people\[o\.id\] \? CAST\[people\[o\.id\]\] : undefined\} \/>/);
    assert.doesNotMatch(src, /second=\{/);
  });
  it('SaxSettingPage', () => {
    const src = read(`${LS}/shared/sax/SaxSettingPage.tsx`);
    assert.match(src, /return planPeople\(fixed, near\);/);
    assert.match(src, /<SaxScene P=\{o\.posture\} view="top" who=\{people\[o\.id\] \? CAST\[people\[o\.id\]\] : undefined\} \/>/);
  });
});
