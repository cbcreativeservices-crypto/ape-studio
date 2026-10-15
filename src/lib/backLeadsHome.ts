/**
 * backLeadsHome — does THIS screen's back step land on the Home screen?
 *
 * Owner rule (2026-10-14): "Always prefer the Home icon when the next back
 * level goes there. Only use the back arrow when the user is into the third,
 * fourth and deeper levels." A screen opened straight from Home (its carousel
 * cards, OPEN CALCULATORS, …) shows the HOME key top-left; the same screen
 * reached from somewhere deeper keeps the ‹ arrow.
 *
 * Decided from where the person ACTUALLY came from — the route under this one
 * in its own navigator — never statically, because several screens (the
 * Calculator Laboratory, Award Progress, …) open both from Home and from
 * deeper places.
 *
 * The route under it may be a navigator (the root stack's `Main` tab shell);
 * its FOCUSED leaf is what the back step shows. `Main` with no state yet is
 * its initial tab, which is Home (MainTabs initialRouteName).
 *
 * No React and no react-native imports, so the node tests drive it directly.
 * Only the LABEL comes from this — the press itself is still safeGoBack (or
 * the screen's own guarded leave), so a stale answer can never send anyone
 * somewhere the back step would not.
 */
export type NavRouteLike = {
  key?: string;
  name: string;
  state?: NavStateLike | Record<string, unknown>;
};
export type NavStateLike = {
  index?: number;
  routes?: NavRouteLike[];
};

const HOME = 'Home';
const TAB_SHELL = 'Main';

function focusedLeaf(route: NavRouteLike): NavRouteLike {
  let r = route;
  // Bounded walk — navigators nest two or three deep here.
  for (let depth = 0; depth < 8; depth++) {
    const s = r.state as NavStateLike | undefined;
    const routes = s?.routes;
    if (!routes || routes.length === 0) break;
    const i = typeof s?.index === 'number' ? s.index : 0;
    const next = routes[Math.min(Math.max(i, 0), routes.length - 1)];
    if (!next) break;
    r = next;
  }
  return r;
}

export function backLeadsHome(state: NavStateLike | null | undefined, routeKey: string | null | undefined): boolean {
  const routes = state?.routes;
  if (!routes || !routeKey) return false;
  const i = routes.findIndex((r) => r.key === routeKey);
  if (i <= 0) return false;
  const under = routes[i - 1];
  if (!under) return false;
  const leaf = focusedLeaf(under);
  if (leaf.name === HOME) return true;
  // The tab shell before its state is known opens on its initial tab: Home.
  return leaf === under && under.name === TAB_SHELL;
}
