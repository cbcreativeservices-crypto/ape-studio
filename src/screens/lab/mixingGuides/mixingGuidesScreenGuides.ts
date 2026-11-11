/**
 * Mixing Guides — "explain this screen" content (owner 2026-10-31, the Screen
 * Guide rollout; pattern: wave/waveScreenGuides.ts).
 *
 * Three screens the learner reaches: the hub (MixingGuidesHubScreen — the
 * owner-approved world map, the search field and the style cards), the
 * reader (MixingGuideScreen — one style through the shared template) and the
 * reader's what's-left END screen (the shared kit/LabEndScreen, swapped in
 * when `ending`). The reader is ONE template for every style, so it has ONE
 * guide that names the template's parts, never one style's content. The end
 * screen's guide (MIXING_GUIDES_END_GUIDE, card titled WHERE YOU ARE) was
 * written against the props this screen passes: mode="progress" (rows read
 * ✓ DONE for everyone), noun "guide", no optional units, no check, no
 * completeTitle; DONE runs safeGoBack (the hub is the only way in); a guide
 * counts as read on NEXT › / FINISH › (beforeAdvance) or MARK AS READ, never
 * on a CONTENTS jump or ‹ PREV; a members-only preview records nothing.
 *
 * ⛔ The guide files under data/ are HAND-EDITED (D77–D78): this file only
 * reads the template's on-screen names; it never touches or regenerates a
 * guide. The world map is owner art (D79): described, never changed.
 *
 * Every line was written against the screens' own code (the two screens,
 * GuideWorldMap, guideSearch, data/types): names are the on-screen names, and
 * the search results quoted in TRY THIS are what filterGuides returns.
 * test/screenGuide_mixingGuides_20261031.test.ts pins them.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language; claims KNOWLEDGE, never skills; mixing values
 * are suggested starting points, never rules; "suggest", never "recommend";
 * no gear maker names; no "N of total"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

export const MIXING_GUIDES_HUB_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Each music style’s audience listens for something different in a mix, so each style gets its own written guide of suggested starting points, never fixed rules.',
    start: 'Press and hold a style card and watch the map light its countries. Then type a word such as “brazil” in the search field and tap a card to open its guide.',
  },
  seeing: [
    'The MIXING GUIDES menu holds one written guide per music style.',
    'At the top, the world map. Its caption names the style under your finger and where it comes from.',
    'Below the map: the starting-points line, the search field, a count of the guides you’ve read, and the style cards.',
    'Each card shows its number, the style and its mix priority #1, what its mix must get right. ✓ READ marks a guide you’ve read.',
  ],
  control: [
    'Tap a card to open that style’s guide.',
    'Press and hold a card: the map lights that style’s countries and keeps them lit while your finger is down, even if the list scrolls. Lift your finger to clear the map. With a mouse or trackpad, hovering lights each card.',
    'Hide map folds the map away; Show map › brings it back.',
    'Type in “Find a style — salsa, metal, k-pop…” to filter by style name, mix priority or origin; ✕ clears it.',
    '“When to bring in a pro ›” opens a short note. The ‹ at the top leaves.',
  ],
  changes: [
    'The map fills in the countries a style comes from, and the caption spells them out in words.',
    'Searching hides the cards that do not match and shows how many do. With no match it says so and suggests a shorter word.',
    'A card shows ✓ READ after you read its guide (NEXT › or MARK AS READ).',
  ],
  teaches: [
    'Each music style’s audience expects something different from a mix.',
    'Every mix decision follows from what that audience listens for: balance first, then EQ, compression, effects, vocals and loudness.',
    'The values are suggested starting points, not rules. A reference track in the style, matched in level, is how you check your mix.',
  ],
  tryThis: [
    'Type “brazil”: four styles stay — Latin Pop, Sertanejo, Brazilian Funk (Baile Funk) and MPB / Bossa Nova. Origins are searched too.',
    'Type “hip hop”: four cards stay, Hip-Hop / Rap first, because the search also reads each style’s mix priority and origin. It ignores case, accents and punctuation.',
    'With the map showing, press and hold one card and read the caption, then lift and press another: each lights its own countries.',
  ],
};

export const MIXING_GUIDE_READER_GUIDE: ScreenGuide = {
  intro: {
    learning: 'What one style’s audience listens for, its MIX PRIORITY #1, and suggested starting points for EQ, compression, effects and loudness, checked against a level-matched reference.',
    start: 'Read WHAT THE AUDIENCE EXPECTS and MIX PRIORITY #1 first. Then open EQ starting points, or tap OPEN ALL ▾ to read the whole guide.',
  },
  seeing: [
    'This is one style’s guide. Start at the top: WHAT THE AUDIENCE EXPECTS and MIX PRIORITY #1, then the starting-points line.',
    'AT A GLANCE: Origin / region, Typical tempo, Typical ensemble size, Live SPL (FOH, average) with a hearing note, Studio / streaming loudness.',
    'THE GUIDE: numbered sections, from Purpose & audience expectations to Reference recordings. The first starts open.',
  ],
  control: [
    'Tap a section’s header to open or close it. OPEN ALL ▾ opens every section; CLOSE ALL ▴ closes them.',
    'MARK AS READ at the foot records the guide as read.',
    'Use ‹ PREV and NEXT › to walk the styles in number order; NEXT › also marks this guide read. Tap the readout for the list of styles (✓ when read); FINISH › opens the what’s-left screen.',
    'Of the two ⓘ keys in the header, the first explains the level figures; the far-right one opens this guide. The ‹ at the top goes back to the menu.',
  ],
  changes: [
    'In the tables — EQ starting points, Compression & dynamics processing, Effects & amounts, Live vs studio — each row shows as a card: its heading on top, then labeled lines.',
    'Sections you open stay open on the next style.',
    '✓ READ shows only once the reading is recorded; a preview records nothing and says so.',
  ],
  teaches: [
    'What a style’s audience listens for, and where its mix priorities start.',
    'Every value is a suggested starting point, not a rule: match a reference in the style and adjust to the song, the artist and the room.',
    'Live SPL (FOH, average) is a typical show’s sound pressure level at the front-of-house mix position; the WHO (World Health Organization) note gives the safe-listening limit.',
  ],
  tryThis: [
    'Open EQ starting points: each row card starts with the source, then Cut, Boost and Notes lines.',
    'Tap OPEN ALL ▾, then NEXT ›: the next style opens with every section open too.',
    'Open Reference recordings and match their level before you compare them with your mix: the louder track nearly always sounds “better”.',
  ],
};

/** The what's-left END screen (LabEndScreen with mode="progress", noun
 *  "guide", doneLabel "DONE · BACK TO THE GUIDES"). Card title: WHERE YOU ARE. */
export const MIXING_GUIDES_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the styles you’ve read and those still to read: every audience listens for something different, and every value stays a suggested starting point.',
    start: 'Tap a style still listed to read it next, or tap REVIEW ▾ on the ✓ DONE line to reopen one you’ve read. DONE · BACK TO THE GUIDES returns to the menu.',
  },
  seeing: [
    'Where you are in the Mixing Guides: the title reads WHAT’S LEFT, or LAB COMPLETE once every guide is read.',
    'Each guide not read yet is listed by its number and style; the guides you have read fold into one ✓ DONE line.',
  ],
  control: [
    'Tap a style that is still listed to open its guide.',
    'REVIEW ▾ on the ✓ DONE line unfolds the guides you have read; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START opens guide 01 and clears nothing.',
    'DONE · BACK TO THE GUIDES returns to the MIXING GUIDES menu; so does the ‹ at the top.',
    'Under the header, ‹ PREV goes back to the guide you came from, and the WHAT’S LEFT ▾ readout opens the list of styles (✓ when read).',
  ],
  changes: [
    'A guide counts as read when you leave it with NEXT › or FINISH ›, or tap MARK AS READ. Just opening it, or jumping away with ‹ PREV or the list, doesn’t count.',
    'A read guide moves to the ✓ DONE line. A preview records nothing and says so.',
    'If your reading record can’t be loaded, the title reads YOUR PROGRESS and a note says why. Every guide still opens.',
  ],
  teaches: [
    'Reading styles side by side shows how differently audiences listen: what one style puts up front, another keeps in the background.',
    'Every value stays a suggested starting point, not a rule. Reread a style’s guide before mixing in that style, and check against a reference matched in level.',
  ],
  tryThis: [
    'Open the first style still listed and tap NEXT › (on the last style, FINISH › brings you straight back). Then tap the readout and WHAT’S LEFT ›: that style has moved to the ✓ DONE line.',
    'Tap REVIEW ▾ and reopen a style you have read: the sections you had open on your last guide are open on this one too.',
    'Tap DONE · BACK TO THE GUIDES and find ✓ READ on the cards of the styles you have read.',
  ],
};
