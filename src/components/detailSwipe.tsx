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
 *     its index so the window re-forms around the new current, and a layout
 *     effect silently recenters to the middle again — the classic recentring
 *     carousel, so it feels infinite and never flashes.
 *   • Because prev & next are already MOUNTED in the window, their artwork is
 *     already loaded by the time you reach them — no blank frame, so no crossfade
 *     machinery is needed.
 *   • At a list end the neighbour is null → that side renders empty and a pull
 *     that way just springs back (no wrap).
 *
 * Each page renders the item's own content (the vertical ScrollView lives INSIDE
 * a page). On Android the inner vertical scroll needs `nestedScrollEnabled`
 * (set by the page content itself).
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
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
  // Park on the middle page on mount and after every current-item change (the
  // window re-forms around the new current, so "middle" is always current).
  useLayoutEffect(() => {
    // rAF so the reset lands after the new children have laid out.
    const id = requestAnimationFrame(() => ref.current?.scrollTo({ x: width, y: 0, animated: false }));
    return () => cancelAnimationFrame(id);
  }, [current, width]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x <= width * 0.5) {
      if (prev) onStep(-1);
      else ref.current?.scrollTo({ x: width, y: 0, animated: true });
    } else if (x >= width * 1.5) {
      if (next) onStep(1);
      else ref.current?.scrollTo({ x: width, y: 0, animated: true });
    }
  };

  return (
    <ScrollView
      ref={ref}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={onMomentumEnd}
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
