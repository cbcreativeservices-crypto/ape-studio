# AP&E governance decisions — 2026-10-08

Owner rulings from 2026-10-07/08. Continues D50–D57 (APE_GOVERNANCE_DECISIONS_2026_10_03.md).

## D58 · Miking & Mixing are suggested starting points
- Every Miking/Mixing lesson says these are **suggested starting points, not rules**; "use your ears and the room"; occasionally "Experimentation is encouraged."
- Learner-facing goals/objectives are written for the learner, never build notes ("Shown, never played." was removed everywhere).
- Use **"suggest"**, not "recommend", for starting points (X2).
- No brand/model names in learner text except **"Hammond"**; no citations or standard names on lab screens.

## D59 · Owner answers to the 2026-10-08 morning decision page (all recommended options)
- **X1:** long distances are rounded; feet from 3 m. One shared rule (`fmtLen`).
- **X3:** cut-off control words get short forms (SUPER, CARD, FIG-8, IN, FRONT…), with full words in accessibility labels.
- **X4:** "Each one is drawn where the mic goes."
- **X5:** shared quiz items are reworded so the wrong answers don't give the right one away.
- **X6:** label pass.
- **L6A:** the shotgun is measured to its CAPSULE everywhere (F09, B04, B10, B11).
- **L6F:** mono-check line added. **L6T:** titles approved. **L7A:** each lesson shows its own intro. **L7F:** each lesson picks its PA/monitor/loudspeaker word. **L7J:** hydrophone safety line. **L7D:** "pack" power value. **L7G:** add a 30–45° line.
- **HF1:** hands match the shared skin tone.
- **DEF:** every builder default logged under OWNER REVIEW is approved.

## D60 · Human figures
- The owner's head ICONS are used **only for a head on its own, never on a body**. Lone heads seen from above use the "above" icon, rotated to the facing direction.
- Bodies use the shared PlayerFigure / FigureHead style, never a circle head.
- Every figure must be anatomically correct, proportional and **decent**:
  - head, torso, hips and feet face the same way;
  - arms start at the shoulders;
  - nothing is drawn at or in front of the groin.
- Locked by `test/figureAnatomy_20261008.test.ts` and `test/headIcons_20261008.test.ts`.
- A realistic figure redo (hybrid: Comp C illustrations plus an artist agent) is **planned for later**. Quick fix done: the voice cutaway.

## D61 · Website copy
- **Headline:** "The Whole Craft of Audio. Right in Your Pocket."
- **Subline**, on two lines with a hard break:
  - "Everything you'd search for across books, videos, and forums"
  - "In one place you carry everywhere"
- **Launch date shown:** Tuesday, October 13.
- The Coming Soon panel sits low, so the headline stays visible.

## D62 · Mixing-family "Knowing When to Bring In a Pro"
- The owner's text is used word for word.
- It shows once per device on the first open of Beginning Mixing, Advanced Mixing, Mastering or Mixing Guides, with a GOT IT button.
- A small link on each lab's first page reopens it.

## D63 · Mixing Guides world map
- The map is pinned above the 50 styles.
- Only the card the finger is pressing is lit, held for the whole drag; the map clears on lift and on return.
- A tap flashes the countries for **1 s**, then opens the guide.
- Small countries get a locator ring.

## D64 · Working rules for ccode (this week and standing)
- **Effort:** Opus 5.5 **medium** for all agents until **Wed 2026-10-14**.
- **Token efficiency:**
  - targeted tests while working; ONE full suite at the end;
  - batch merges;
  - at most about 6 captures;
  - short updates.
- **Large audits go to Comp B** as a brief plus exported text files in Downloads. Comp B has no app or DB access.
- **No Pixel update unless asked** for that update.

## D65 · The next build is THE STORE BUILD (iOS 35 / Android 17)
- No build until the **onboarding video is ready** and the owner says build.
- It must include the **video player (expo-video)** plus the first-run onboarding, and "anything else". See `Downloads\2026-10-08_NEXT_STORE_BUILD_CHECKLIST.md`.
- Native work lives on a separate branch until the build is ordered, so the Pixel keeps its OTA runtime.
- 13 store-build decisions are pending on `Downloads\2026-10-08_STORE_BUILD_DECISIONS.html`.

## D66 · Tester feedback and house style
- Double quotes by default; single quotes only inside a quote. The owner chose "rules + automatic scan" (Chicago Manual of Style); the audit goes to Comp B.
- Safety-flashcard wording fixes go to Comp A; the database is Comp A's lane.
