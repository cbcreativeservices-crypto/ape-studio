/**
 * StageStepScroll — the scroller inside the Stage area's ADD and OBJECT
 * surfaces (the kit's popup on a phone; the dock tray in FULL SCREEN).
 *
 * WHY IT EXISTS (visual review 2026-11-12, two S1 findings): the palette is
 * several steps in one surface, and the surface kept its old scroll position
 * when the step changed. The question "what does this symbol stand for?"
 * opened scrolled to the middle, with its heading out of view; a package's
 * rows were hidden above the window when the user was asked to confirm them.
 *
 * So the content has its OWN scroller, a little shorter than the surface it
 * is in (the outer scroller then has nothing to scroll), and it returns to
 * the top every time `stepKey` changes.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

export function StageStepScroll({ stepKey, maxHeight, children }: { stepKey: string; maxHeight: number; children: ReactNode }) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    ref.current?.scrollTo({ y: 0, animated: false });
  }, [stepKey]);
  return (
    <ScrollView ref={ref} style={{ maxHeight }} contentContainerStyle={styles.content} nestedScrollEnabled keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      {children}
    </ScrollView>
  );
}

/** The scroller's height inside the kit's popup: the popup is at most 88% of
 *  the window, less its title bar and its padding. */
export const stageSheetScrollHeight = (windowHeight: number): number => Math.max(220, Math.floor(windowHeight * 0.88) - 112);

/** The scroller's height inside the dock tray in FULL SCREEN, where the
 *  tray has about half the screen once the fader strip is folded. */
export const stageTrayScrollHeight = (windowHeight: number): number => Math.max(140, Math.round(windowHeight * 0.4));

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 4 },
});
