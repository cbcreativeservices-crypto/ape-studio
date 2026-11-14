/**
 * gaPageLeft — the end screen's line for each hands-on page that is not done
 * yet (lab fix round 2026-11-14, phase 2; shared end screen, S2 part 4:
 * "each unfinished row names what is missing").
 *
 * The beginner audit (G5, end screen): 21 rows each repeated one rule,
 * "Counts once its practice goals and its check are done; NEXT moves on
 * without counting it." The rule is now printed once above the list (HOW A
 * PAGE COUNTS), and each row says what THAT page still needs: its own goals,
 * in the words of its goal chips, then its check.
 *
 * ALL of a page's goals are named, not only the ones the learner missed: a
 * page counts when every goal is met in one visit, and the marks start empty
 * on each visit (bits `useVisitGoals`), so for a page that is not done every
 * goal is still to do.
 *
 * Index = page index (0 = page 1) in the 24-page list of pages/index.ts.
 * Pages 22, 23 and 24 keep their own lines in GameAudioLabScreen
 * (PAGE_DETAIL). The split of 2026-11-14 gave the old pages 4 and 10 two
 * lines each, each with that page's own goals. test/labFixes_20261114_F3.test.ts
 * holds each line against its page's goal chips. Pure data.
 */
export const GA_PAGE_LEFT: readonly string[] = [
  'Still to do: set LEVEL to 40% or lower, start the scene, stop it with ■ STOP, and pass the check.',
  'Still to do: open or close the door, start the generator, change SPEED while it runs, and pass the check.',
  'Still to do: open the MOBILE, DESKTOP, CONSOLE and BROWSER cards, choose a LISTENING setup, change the BUDGET, and pass both checks.',
  'Still to do: open three kinds of game, and pass the check.',
  'Still to do: listen from the overhead camera, move FACING while it listens, choose YOUR EARS again, and pass the check.',
  'Still to do: play six kinds of sound, solo two categories, solo the ALARM’s category while it runs, and pass the check.',
  'Still to do: play the door through the whole chain, break the chain, restore the file so the door plays again, and pass the check.',
  'Still to do: run two generators from one event at different speeds, stop one, remove generator 2 while it runs, and pass the check.',
  'Still to do: step as you and as the guide, step on a new surface, move SPEED while the generator runs, change MOOD, and pass the check.',
  'Still to do: take three steps with variation off, play three different takes on one surface, open the door, and pass both checks.',
  'Still to do: cross the doorway twice with the scene running, and pass the check.',
  'Still to do: stay in the courtyard until the raw cut passes its join, silence every loop with ■ STOP, and pass the check.',
  'Still to do: run the generator and the scene, turn until the source is straight behind you, walk until a sound goes VIRTUAL, and pass the check.',
  'Still to do: run GENERATOR 1 behind the closed door (GEN 1 reads MUFFLED), open the door (CLEAR), walk into the workshop, switch ROOM to DRY and back to REVERB, and pass the check.',
  'Still to do: turn with STEREO chosen, turn with HEADPHONE 3D chosen, fold the output to MONO, and pass the check.',
  'Still to do: add a layer and change MOOD while the music plays, change your mind while a change waits, play a stinger on a boundary, and pass the check.',
  'Still to do: play the greeting, interrupt it with the warning, ask for the greeting during the warning, play a line in Spanish, and pass the check.',
  'Still to do: play a line that ducks the mix and one with DUCK off, change one bus (fader, MUTE or SOLO), show the VISUAL CUE while the alarm runs, and pass the check.',
  'Still to do: fill the budget until a voice is STOLEN, keep the alarm through a burst, lower BUDGET until a sound is REFUSED, and pass the check.',
  'Still to do: send an action again and see it ignored, send it again with ID CHECK off, send one alert to each player, and pass the check.',
  'Still to do: find, fix and test again each of the five faults (the door, the guide’s voice, the footsteps, the surface, the loop), and pass the check.',
];

/** The rule the hands-on pages share, printed ONCE above the end screen's
 *  list under HOW A PAGE COUNTS (a full sentence: it stands alone there). */
export const GA_HANDS_ON = 'A page counts once its practice goals and its check are done in one visit; NEXT moves on without counting it.';
