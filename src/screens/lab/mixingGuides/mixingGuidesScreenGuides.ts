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
  seeing: [
    'The MIXING GUIDES menu: one written guide per music style.',
    'At the top, the world map. Its caption names the style under your finger and where it comes from.',
    'Below: the starting-points line, the search field, a count of the guides you have read, and the style cards.',
    'Each card: its number, the style, its mix priority #1, and ✓ READ once read.',
  ],
  control: [
    'Tap a card to open that style’s guide.',
    'Press and hold a card: the map lights that style’s countries and keeps them lit while your finger is down, even if the list scrolls; lifting clears the map. With a pointer, hovering lights each card.',
    'Hide map folds the map away; Show map › brings it back.',
    'Type in “Find a style — salsa, metal, k-pop…” to filter by style name, mix priority or origin; ✕ clears it. “When to bring in a pro ›” opens a short note. The ‹ at the top leaves.',
  ],
  changes: [
    'The map fills in the countries a style comes from, and the caption spells them out in words.',
    'Searching hides the cards that do not match and shows how many do. With no match it says so and suggests a shorter word.',
    'A card shows ✓ READ after you read its guide (NEXT › or MARK AS READ).',
  ],
  teaches: [
    'Each music style’s audience expects something different from a mix.',
    'Every guide starts from what that audience listens for, then balance, EQ, compression, effects, vocals, loudness, live versus studio, common mistakes and references.',
    'Starting points, not rules: a reference track in the style, matched in level, is the check.',
  ],
  tryThis: [
    'Type “brazil”: four styles stay — Latin Pop, Sertanejo, Brazilian Funk (Baile Funk) and MPB / Bossa Nova. Origins are searched too.',
    'Type “hip hop”: four cards stay, Hip-Hop / Rap first, because the search also reads each style’s mix priority and origin. It ignores case, accents and punctuation.',
    'With the map showing, press and hold one card and read the caption, then lift and press another: each lights its own countries.',
  ],
};

export const MIXING_GUIDE_READER_GUIDE: ScreenGuide = {
  seeing: [
    'One style’s guide. On top: WHAT THE AUDIENCE EXPECTS and MIX PRIORITY #1, then the starting-points line.',
    'AT A GLANCE: Origin / region, Typical tempo, Typical ensemble size, Live SPL (FOH, average) with a hearing note, Studio / streaming loudness.',
    'THE GUIDE: numbered sections, from Purpose & audience expectations to Reference recordings. The first starts open.',
  ],
  control: [
    'Tap a section’s header to open or close it. OPEN ALL ▾ opens every section; CLOSE ALL ▴ closes them.',
    'MARK AS READ at the foot records the guide as read.',
    'The strip: ‹ PREV and NEXT › walk the styles in index order (NEXT › also marks this guide read); the readout opens the list of styles (✓ when read); FINISH › opens the what’s-left screen.',
    'Of the two ⓘ keys in the header, the first explains the level figures; the far-right one opens this guide. The ‹ at the top goes back to the menu.',
  ],
  changes: [
    'The tables — EQ starting points, Compression & dynamics processing, Effects & amounts, Live vs studio — read as one card per row: the first column heads the card, the rest are labelled lines.',
    'Sections you open stay open on the next style.',
    '✓ READ shows only once the reading is recorded; a members-only preview records nothing and says so.',
  ],
  teaches: [
    'What a style’s audience listens for, and where its mix priorities start.',
    'Every value is a suggested starting point, not a rule: match a reference in the style and adjust to the song, the artist and the room.',
    'Live levels are typical show levels; the WHO note gives the safe-listening limit.',
  ],
  tryThis: [
    'Open EQ starting points: each row card starts with the source, then Cut, Boost and Notes lines.',
    'Tap OPEN ALL ▾, then NEXT ›: the next style opens with every section open too.',
    'Open Reference recordings and match their level before you compare them with your mix.',
  ],
};

/** The what's-left END screen (LabEndScreen with mode="progress", noun
 *  "guide", doneLabel "DONE · BACK TO THE GUIDES"). Card title: WHERE YOU ARE. */
export const MIXING_GUIDES_END_GUIDE: ScreenGuide = {
  seeing: [
    'Where you are in the Mixing Guides: the title reads WHAT’S LEFT, or LAB COMPLETE once every guide is read.',
    'Each guide not read yet is listed by its number and style; the guides you have read fold into one ✓ DONE line.',
  ],
  control: [
    'Tap a style that is still listed to open its guide.',
    'REVIEW ▾ on the ✓ DONE line unfolds the guides you have read; tap any one to open it again.',
    'PRACTICE AGAIN FROM THE START opens guide 01 and clears nothing.',
    'DONE · BACK TO THE GUIDES returns to the MIXING GUIDES menu; so does the ‹ at the top.',
    'In the strip, ‹ PREV goes back to the guide you came from, and the WHAT’S LEFT ▾ readout opens the list of styles (✓ when read).',
  ],
  changes: [
    'A guide counts as read when you leave it with NEXT › or FINISH › (in the strip or at its foot), or tap MARK AS READ. Opening it, ‹ PREV, ⏮, list jumps, WHAT’S LEFT › and the ‹ at the top do not count.',
    'A read guide moves from the list to the ✓ DONE line. A members-only preview records nothing.',
    'If your record cannot be read, the title reads YOUR PROGRESS, a note says why, and every guide still opens.',
  ],
  teaches: [
    'Which music styles’ guides count as read, and which are still to read.',
    'Nothing is taken away: any guide can be read again, and its values stay suggested starting points, not rules.',
  ],
  tryThis: [
    'Open the first style still listed and tap NEXT › (on the last style, FINISH › brings you straight back). Tap the readout, then WHAT’S LEFT ›: that style has left the list for the ✓ DONE line.',
    'Tap REVIEW ▾ and reopen a style you have read: the sections you had open on your last guide are open on this one too.',
    'Tap DONE · BACK TO THE GUIDES and find ✓ READ on the cards of the styles you have read.',
  ],
};
