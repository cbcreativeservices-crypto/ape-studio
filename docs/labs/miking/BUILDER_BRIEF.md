# Miking lesson builder brief

Every agent that builds a Miking lesson reads this first.

## The standard

**Kick Drum (M01) is OWNER-APPROVED (2026-10-04) and is the quality standard.** Match it in:
- the journey and page structure;
- illustration and animation quality;
- interaction;
- voice;
- tests.

Read its code first: `src/screens/lab/miking/lessons/m01Kick/*`, `pages/*`, and `engine/*`.

## Binding rules (read these files)

1. `AGENTS.md`: the house helpers and ratchets. Run tests with `node --test --test-timeout=120000 "test/**/*.test.ts"`. Never edit the scripts in `package.json`. No new native dependencies.
2. `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md`, especially §12, the owner's ruling on learner-facing presentation.
3. `docs/labs/miking/LESSON_JOURNEY.md`. The journey runs: meet → how it sounds → where it sits → microphones → placement (worked example first) → advanced → practice. There are NEW and EXPERIENCED paths.
4. The owner's starting-points ruling:
   - What the learner sees is "after our research, here is where we recommend you begin, and ideas to try".
   - No citations, brand names, model names or "guide says" in learner text.
   - No SOURCED / TRIAL / ILLUSTRATIVE badges.
   - No sources page.
   - Safety stays, in plain words.
   - `test/mikingLearnerText.test.ts` enforces this.
5. FULLY SILENT. There is no audio, ever. "How it sounds" means visual physics.
6. Accuracy is still mandatory behind the scenes.
   - Use the lesson's research folder, `docs/labs/miking/<lesson>/SOURCES.md` and `GEOMETRY_PROPOSAL.md`, and `BATCH1_RESEARCH_SUMMARY.md`.
   - Geometry comes from those files.
   - Never invent a dimension. A "drawing default" from the geometry files is allowed.
   - Apply the lesson-text corrections they list, and log each one in `docs/labs/miking/CORRECTIONS_LOG.md`.
7. Illustrations:
   - real objects, never primitive stand-ins;
   - gradients, upper-left light and rim highlights;
   - the palette tokens;
   - display text at least 9 pt after fit (`fitValue`);
   - the Rack Unit;
   - in full screen, everything zooms;
   - drags stay clear of the screen edges (`GestureExclusionZone` / the edge guard are already in the engine).
8. One shared 5-piece kit (`docs/labs/miking/kit/GEOMETRY_PROPOSAL.md`) is used by every drum lesson.
9. Reuse the shared assets, and never duplicate one. When a lesson needs a new shared asset that another builder owns, use a stub that imports from the agreed path and note it.
   - The drum shell / hoop / lug / stand family lives in `src/screens/lab/miking/lessons/shared/drums/`.
   - The cymbal family lives in `lessons/shared/cymbals/`.
   - The hand-drum family lives in `lessons/shared/handdrums/`.

## Per lesson

1. `model.ts`, `geometry.ts`, `art.tsx` and `lesson.ts` in `lessons/<id>/`.
2. Register the lesson in the lab's hub, under the right lab.
3. A model test that checks real relationships: part counts, anchors, zones inside clear space, no collision at the zone centres.
4. Inspect every stage at 390×844, using your own preview server or headless Chrome. Look at each capture, then refine it twice.
5. Run your own audio-expert and learning self-review against `docs/labs/miking/kick/REVIEW_*.md`, the kind of findings Kick had. Fix them.
6. tsc must be clean and the FULL suite must pass.

## Commits

- Commit locally, in logical chunks.
- Each message ends with a blank line, then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Stage only your own files.
- Never push, publish, or run eas.
