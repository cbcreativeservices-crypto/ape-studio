/**
 * Move between the Cymatics lab's screens without stacking copies of them.
 *
 * ⛔ WHY THIS EXISTS. The lab's five screens — home, the three studios, the
 * gallery, and the module reader — cross-link to each other in a CYCLE, and
 * every link used a bare `navigate`. Under React Navigation 7 that appends a
 * new instance whenever the target is in the stack but not focused, so an
 * ordinary browse (home → gallery → plate studio → gallery → …) grows the
 * stack without bound. The visible cost is the back button: a learner who
 * followed four cross-links has to press it four times to leave a lab they
 * entered once, and each copy is a live screen holding its own animation and
 * audio state.
 *
 * It is the same rule already applied to HOME elsewhere in the app: return to
 * the instance that is there rather than minting another.
 *
 * `popTo` goes back to an existing route and is the correct verb when the
 * target is already below us. When it is not in the stack there is nothing to
 * pop to, so we push normally.
 */

/** Only what this helper touches. */
type NavLike = {
  navigate: (name: string, params?: object) => void;
  popTo?: (name: string, params?: object) => void;
  getState?: () => { routes?: { name?: string }[] } | undefined;
};

/**
 * `nav` is taken as a plain object and narrowed here, in one place, on purpose.
 * The screens' navigation props are typed against the whole RootStackParamList,
 * so their `navigate`/`popTo` overloads are far narrower than the two strings
 * this helper passes — a precise parameter type would have to reproduce that
 * union and would fail at every call site. Route names are checked by the
 * callers' own typing at the point they are written.
 */
export function goToCymatics(nav: object, name: string, params?: object): void {
  const n = nav as NavLike;
  try {
    const routes = n.getState?.()?.routes ?? [];
    // Only pop to a route that is genuinely BELOW us — the last entry is the
    // screen we are on, and popping to yourself is not a navigation.
    const below = routes.slice(0, -1).some((r) => r?.name === name);
    if (below && typeof n.popTo === 'function') {
      n.popTo(name, params);
      return;
    }
  } catch {
    /* fall through to a plain navigate — never block the tap */
  }
  n.navigate(name, params);
}
