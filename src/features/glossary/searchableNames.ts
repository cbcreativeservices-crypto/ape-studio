/**
 * How many terms the glossary holds, counted the way a learner finds them
 * (owner 2026-11-27: "the glossary is to count the 'also known as' related terms
 * that got merged. they should be searchable just like the main merged term and
 * should be counted in the total terms count ... I do not want to go down below
 * not counting all terms searchable").
 *
 * Every card's headword PLUS every name in its "Also called" list is a term a
 * person can search for and land on. The total is the number of DIFFERENT such
 * names: a name that appears twice (an alias equal to another card's headword,
 * or listed on two cards) counts once, so the number never overstates.
 *
 * ⛔ Display only. `get_glossary_term_count` stays CARDS-ONLY: the device copy is
 * checked against it (GlossaryScreen revalidateCorpus), and a count that includes
 * names would re-download the whole corpus on every open (Comp A, 2026-11-26).
 *
 * ⚠️ IMPORTS NOTHING (pure; the test runner imports it directly).
 */
export function countSearchableNames(
  entries: readonly { term: string; also_called?: readonly string[] | null }[],
): number {
  const names = new Set<string>();
  for (const e of entries) {
    const head = e.term.trim().toLowerCase();
    if (head) names.add(head);
    for (const a of e.also_called ?? []) {
      const n = a.trim().toLowerCase();
      if (n) names.add(n);
    }
  }
  return names.size;
}
