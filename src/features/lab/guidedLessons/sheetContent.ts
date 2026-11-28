/**
 * What the Guided Lesson sheet draws (pure; SN-2 checker follow-up,
 * beginner waves 2026-11-15; owner: "build waves 1 thru 3", D62).
 *
 * Open: exactly what the host passes. Closing (visible false, the card still
 * sliding away): what it was last OPENED with, so a host that closes by
 * clearing its key (FxLabScreen's `setHelp(null)`) never turns the closing
 * card into the whole lesson for the length of the slide.
 */
export function sheetContent<T extends { controlKey?: string }>(visible: boolean, now: T, lastOpen: T): T {
  return visible ? now : lastOpen;
}
