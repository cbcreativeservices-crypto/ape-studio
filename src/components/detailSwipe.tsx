/**
 * DetailPager — reliable horizontal paging for the expanded detail popups
 * (TopicDetailModal on Explore, CredentialDetailModal on the cert/program
 * choosers). Owner 2026-09-15.
 *
 * WHY A NATIVE PAGER (rewrite): the previous PanResponder-driven swipe fought
 * the popup's vertical ScrollView for the gesture and lost unreliably on Android
 * ("seldom acts"). A native horizontal `ScrollView pagingEnabled` lets the OS
 * arbitrate horizontal-page vs vertical-scroll natively — reliable and smooth on
 * both platforms, no gesture race, no library.
 *
 * A THREE-PAGE WINDOW [prev · current · next]:
 *   • The pager sits parked on the MIDDLE page (current). Swiping settles on a
 *     side page; on settle we tell the parent to step (onStep), the parent moves
 *     its index so the window re-forms around the new current, and we silently
 *     recentre to the middle again — the classic recentring carousel, so it
 *     feels infinite and never flashes.
 *   • Because prev & next are already MOUNTED in the window, their artwork is
 *     already loaded by the time you reach them — no blank frame, so no crossfade
 *     machinery is needed.
 *   • At a list end the neighbour is null → that side renders empty and a pull
 *     that way just springs back (no wrap).
 *
 * Each page renders the item's own content (the vertical ScrollView lives INSIDE
 * a page). On Android the inner vertical scroll needs `nestedScrollEnabled`
 * (set by the page content itself).
 *
 * ── THE "SKIP AND JUMP" FIX (owner report 2026-09-17) ────────────────────────
 *
 * Swiping between expanded certificate/program cards skipped and jumped rather
 * than progressing smoothly. TWO separate causes, both fixed here:
 *
 * 1. THE RECENTRE WAS A FRAME LATE. The recentring carousel only works when the
 *    data swap and the scroll reset land in the SAME frame — then the pixels at
 *    the new position are identical to the pixels at the old one and nothing
 *    moves. The reset was inside a `requestAnimationFrame`, so for at least one
 *    frame the window had already re-formed around the new current while the
 *    scroll was still parked on a side page. At x = 2·width that side page is
 *    now the item AFTER the one you swiped to — so you saw the item two ahead
 *    flash by, then snap back. Exactly "skip, then jump".
 *
 *    The reset is now synchronous inside the layout effect, which runs after the
 *    new children are committed and BEFORE paint. The rAF call is kept as a
 *    second, belt-and-braces pass for the case where native layout had not
 *    settled when the synchronous call ran — it scrolls to the same x, so if the
 *    first call worked the second is a no-op and invisible.
 *
 * 2. A SLOW DRAG COULD LEAVE THE PAGER OFF-CENTRE. `onMomentumScrollEnd` is not
 *    guaranteed to fire on Android when a drag ends with little or no velocity.
 *    When it did not fire, no step happened and the pager stayed parked on a
 *    side page — so the NEXT swipe started from the wrong origin and moved two
 *    items, or landed somewhere unexpected. `onScrollEndDrag` is now handled as
 *    well, and a per-gesture guard makes sure a single swipe can only ever step
 *    once however many of the two events arrive.
 */
import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

/** Ordered-list position + neighbour presence for the pager (parent-owned). */
export type PagerNav = {
  /** 0-based index of the current item in the list being browsed. */
  index: number;
  count: number;
};

export function DetailPager<T>({
  width,
  prev,
  current,
  next,
  onStep,
  renderPage,
}: {
  /** Page width = the card width. */
  width: number;
  prev: T | null;
  current: T;
  next: T | null;
  /** Called when a swipe settles on a neighbour: +1 = next, -1 = previous. */
  onStep: (dir: 1 | -1) => void;
  renderPage: (item: T) => ReactNode;
}) {
  const ref = useRef<ScrollView>(null);
  /**
   * True from the moment a gesture has been acted on until the window has
   * re-formed around the new current. Without it, `onScrollEndDrag` and
   * `onMomentumScrollEnd` can both fire for one swipe and step twice — which
   * would genuinely skip an item.
   */
  const stepped = useRef(false);

  const recentre = useCallback(
    (animated: boolean) => ref.current?.scrollTo({ x: width, y: 0, animated }),
    [width],
  );

  // Park on the middle page on mount and after every current-item change (the
  // window re-forms around the new current, so "middle" is always current).
  //
  // SYNCHRONOUS FIRST — this is what makes the step seamless; see the header.
  useLayoutEffect(() => {
    recentre(false);
    stepped.current = false;
    const id = requestAnimationFrame(() => recentre(false));
    return () => cancelAnimationFrame(id);
  }, [current, recentre]);

  /**
   * Decide what a settled scroll position means. Shared by both end-of-gesture
   * events, and safe to call twice for one gesture.
   */
  const settle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (stepped.current) return;
      const x = e.nativeEvent.contentOffset.x;
      if (x <= width * 0.5) {
        if (prev) {
          stepped.current = true;
          onStep(-1);
        } else {
          recentre(true); // at the start of the list — spring back
        }
      } else if (x >= width * 1.5) {
        if (next) {
          stepped.current = true;
          onStep(1);
        } else {
          recentre(true); // at the end of the list — spring back
        }
      }
      // Anything in between is a partial drag the pager has already snapped
      // back to the middle by itself.
    },
    [width, prev, next, onStep, recentre],
  );

  return (
    <ScrollView
      ref={ref}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={settle}
      // A drag that ends with little or no velocity may never produce a momentum
      // event on Android. Handling both, with the guard above, is what keeps the
      // pager from being left off-centre. See cause 2 in the header.
      onScrollEndDrag={settle}
      // Android: honor the initial offset without a visible jump.
      contentOffset={{ x: width, y: 0 }}
      decelerationRate="fast"
      style={{ width }}
      contentContainerStyle={{ width: width * 3 }}
    >
      <View style={{ width }}>{prev ? renderPage(prev) : null}</View>
      <View style={{ width }}>{renderPage(current)}</View>
      <View style={{ width }}>{next ? renderPage(next) : null}</View>
    </ScrollView>
  );
}
