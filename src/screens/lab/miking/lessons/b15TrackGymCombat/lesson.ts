/**
 * B15 TRACK, GYMNASTICS AND COMBAT SPORTS — the lesson as DATA, written to
 * the 2026-10-07 journey (MEET IT and STARTING SETUPS given here). Words from
 * the owner's lesson (docs/labs/miking/source_text/B15-Track-Gymnastics-and-
 * Combat-Sports-Miking-Technique.txt; "L<n>" in comments only); research in
 * docs/labs/miking/track_gym_combat/; corrections in CORRECTIONS_LOG.md
 * "Lab 7b · group 3" — institutional wording stripped (R-07), brands, models,
 * federations and rule numbers kept off the screen (R-08: "check your event’s
 * rules"), the lightning rule and the rain-cover caution kept as the one
 * sports safety card (R-09), the practice room shared with B16 (B15-01).
 * Owner ruling 2026-10-04: suggested starting points, no sources, brands or
 * badges on screen. FULLY SILENT.
 */
import type { DiagnosticItem, Lesson, LessonPages, MikingScenario, OrderTask, SetupTask, Symptom } from '../../engine/model/types.ts';
import { BRAND_REASON, polarityDelay, removeDelay } from '../shared/bowed/bowedItems.ts';
import { B15_MODEL } from './geometry.ts';
import { B15_ZONES } from './model.ts';
import { B15_COPY } from './copy.ts';

const pages: LessonPages = {
  meet: {
    title: 'Meet it — where the sound comes from',
    goal: 'Meet track starts, gymnastics and combat sports from a microphone’s point of view: where the action is, what keeps a mic out of it, and how distance and angle change what reaches a mic from an approved place.',
    credit: { scenarios: ['tg.meet.1', 'tg.meet.2', 'tg.meet.3'], note: 'Answer the three checks on approval, angle and what one sector can cover.' },
    takeaway: 'The action is brief and it moves; the usable places are the approved ones. From there, distance and angle decide how much detail reaches a mic — no mic zooms.',
  },
  setups: {
    title: 'Starting setups',
    goal: 'See real starting setups drawn on the plans — a fixed shotgun on one sector, two mics on the same actions, a ringside mic, a stereo view of the floor, a boundary on a hard surface — then what to settle before any mic goes up.',
    credit: { scenarios: ['tg.set.1', 'tg.set.2', 'tg.set.3'], interactive: 'setupsSeen', note: 'Look at every main setup on the drawing, and answer the three checks.' },
    takeaway: 'Start with one useful detail sector and the ambience, each mic on an approved place, independent of the apparatus and the ring — and add a channel only for a gap you can name.',
  },
  microphone: {
    title: 'The pickup methods',
    goal: 'Choose a pickup method by what it contributes and what limits it — a fixed directional, a compact directional, a boundary on a hard surface, an approved plant, the ambience — not by a label or a brand.',
    credit: { scenarios: ['tg.mic.1', 'tg.mic.2', 'tg.mic.3', 'tg.rec.1'], note: 'Answer the four checks (one reaches back to the venues).' },
    takeaway: 'Fixed detail favours a place, the ambience favours continuity, and air and structure are different paths — choose by the perspective you want.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start from a setup and work the mic yourself in the practice room — its place in the equipment area, its height and its aim — and see the range and the angle change between A, B and C.',
    credit: { scenarios: ['tg.place.1', 'tg.place.2', 'tg.place.3', 'tg.rec.2'], interactive: 'twoZones', note: 'Rest the mic, in its equipment area, in two different recommended starting points, and answer the four checks. The worked example earns nothing on its own.' },
    takeaway: 'From one approved area, each source point is a different range and angle: aim at the source’s height, change one thing at a time, and never move into the walking path.',
  },
  context: {
    title: 'Live checks',
    goal: 'Plan the coverage with honest gaps, tell an airborne mic from a structure that rattles, check the headroom of the whole chain, and keep a supplied cue feed on its own input.',
    credit: { scenarios: ['tg.ctx.1', 'tg.ctx.2', 'tg.ctx.3', 'tg.rec.3'], interactive: 'liveChecks', note: 'Tag every zone fairly on the coverage map, compare every mount, AND set a chain with room for every event, then answer the four checks.' },
    takeaway: 'A coverage map with named handoffs, air kept apart from structure, every stage of the chain checked — and a supplied cue that stays its own controllable input.',
  },
  twoMic: {
    title: 'Two mics, one moving action',
    goal: 'Two mics at different distances hear one walking source at different times: watch the delay and the comb change from A to C, and what polarity does and does not change.',
    credit: { scenarios: ['tg.two.1', 'tg.two.2', 'tg.two.3'], interactive: 'polarityVsDelay', note: 'Flip B’s polarity both ways AND walk the source, then answer the three checks.' },
    takeaway: 'Movement changes the path difference, so one delay cannot align every point. Choose a dominant detail feed, reduce the overlap, and check the sum in mono.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all six symptoms (a retry is explained, never penalised).' },
    takeaway: 'Check the aim, the height, the mount and the chain first — then reach for processing.',
  },
  practice: {
    title: 'Practice',
    goal: 'Put a practice session in order, choose and justify setups for two briefs, and say what would justify another detail channel.',
    credit: { scenarios: ['tg.prac.order', 'tg.prac.gain', 'tg.prac.setup1', 'tg.prac.setup2', 'tg.prac.3', 'tg.mix.1', 'tg.mix.2', 'tg.mix.3'], note: 'Put the session in order, answer the gain check, complete both briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real, approved practice.' },
    takeaway: 'Approved places, one useful sector and an ambience bed, air kept apart from structure, a chain with room and a named fallback pass. More channels or a closer mic in the action space do not.',
  },
};

/* THE CHECKS. Lesson lines in comments only: tg.meet.* L9, L56, L60 · tg.set.*
 * L180, L86–L87, L111 · tg.mic.* L41, L44, L29 · tg.place.* L207–L209 ·
 * tg.ctx.* L120, L59, L122 · tg.two.* L198–L199 · tg.prac.* / tg.mix.* L195,
 * L150, L59. */
const scenarios: MikingScenario[] = [
  {
    id: 'tg.meet.1',
    page: 'meet',
    prompt: 'You hold a media accreditation. May you put a small mic on the ring?',
    options: ['Only with approval for the whole installation', 'If it is small and kept well out of the way', 'Once the ring’s officials have had a look at it'],
    correct: 'Only with approval for the whole installation',
    explain: 'Accreditation alone does not authorize a mic on an apparatus, a ring or a mat. The mount, its wind cover, its cable route and any operator movement are approved as one installation.',
    why: {
      'If it is small and kept well out of the way': 'Size is not approval: a small capsule does not make an attachment acceptable.',
      'Once the ring’s officials have had a look at it': 'Seeing it is not approving it — the event’s plan does that.',
    },
  },
  {
    id: 'tg.meet.2',
    page: 'meet',
    prompt: 'A shotgun at M1 is aimed at B (2 m). The source walks to A. What changes for the mic?',
    options: ['It is farther and 45° off the axis', 'Nothing, while the gain stays fixed', 'It gets louder from the side lobe'],
    correct: 'It is farther and 45° off the axis',
    explain: 'A is about 2.83 m away and 45° to the side: quieter against the room, and the tone changes off the axis, the higher frequencies first.',
    why: {
      'Nothing, while the gain stays fixed': 'The gain is fixed; the distance and the angle are not.',
      'It gets louder from the side lobe': 'Off the axis a directional mic picks up less, not more.',
    },
  },
  {
    id: 'tg.meet.3',
    page: 'meet',
    prompt: 'A fixed mic covers a sprint start well. What happens once the runners leave the blocks?',
    options: ['They soon leave its sector', 'It follows them down the lanes', 'It hears them better as they speed up'],
    correct: 'They soon leave its sector',
    explain: 'A start mic may stop giving useful running detail almost at once. Fixed sectors along the straight and a steady ambience take over — never a mic following into a lane.',
    why: {
      'It follows them down the lanes': 'A fixed mic stays where it was approved; the runners do not.',
      'It hears them better as they speed up': 'Speed does not bring them closer to a mic they are running away from.',
    },
  },
  {
    id: 'tg.set.1',
    page: 'setups',
    prompt: 'You hear thunder at an outdoor track. Where do you go?',
    options: ['A substantial building or hard-topped car', 'Under the grandstand’s open roof, at its edge', 'Into the team shelter beside the track'],
    correct: 'A substantial building or hard-topped car',
    explain: 'Shelter at once in a substantial building or a hard-topped vehicle — open shelters are not safe. Leave the equipment, and wait 30 minutes after the last thunder.',
    why: {
      'Under the grandstand’s open roof, at its edge': 'An open structure is not a safe lightning shelter.',
      'Into the team shelter beside the track': 'A team or rain shelter is not a safe lightning shelter.',
    },
  },
  {
    id: 'tg.set.2',
    page: 'setups',
    prompt: 'You want vault landings. Where does the mic go?',
    options: ['Beyond the landing and recovery space', 'Beside the table, right at the landing height', 'Clamped to the table’s padded collar'],
    correct: 'Beyond the landing and recovery space',
    explain: 'The run-up, board, table, landing mats and the recovery space past them stay clear. A mic beyond all of it, on an independent support, aimed at the landing region.',
    why: {
      'Beside the table, right at the landing height': 'Beside the table is inside the vault’s working space.',
      'Clamped to the table’s padded collar': 'Protective components are not mounting space; nothing is attached to them.',
    },
  },
  {
    id: 'tg.set.3',
    page: 'setups',
    prompt: 'The ringside position is short of room. Where may the mic go?',
    options: ['Only at an assigned ringside place', 'On the apron, if it is taped down firmly', 'In the corner of the apron nobody is using'],
    correct: 'Only at an assigned ringside place',
    explain: 'The apron and the corners belong to the seconds, the officials, cleaning and medical access. A ringside mic stands at an assigned position, on its own support.',
    why: {
      'On the apron, if it is taped down firmly': 'Taping it down does not make the apron an approved place.',
      'In the corner of the apron nobody is using': 'A neutral corner is not spare audio space either.',
    },
  },
  {
    id: 'tg.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · What is the border round a wrestling mat for?',
    options: ['Protection, and action can continue into it', 'A strip where the crew may set up their mics', 'Coaches, who may stand in it at will'],
    correct: 'Protection, and action can continue into it',
    explain: 'The protection border is part of the competition space: the action can carry on into it before a stop. It is never a mic strip — the mic goes outside the whole envelope.',
    why: {
      'A strip where the crew may set up their mics': 'It is a protection area, not a crew strip.',
      'Coaches, who may stand in it at will': 'Coaches have their own places; the border protects the athletes.',
    },
  },
  {
    id: 'tg.mic.1',
    page: 'microphone',
    prompt: 'Can a boundary mic laid on a soft gymnastics mat work as intended?',
    options: ['Poorly: a soft mat is not its surface', 'Well enough, because the mat is large and flat', 'It will, once the gain is turned up more'],
    correct: 'Poorly: a soft mat is not its surface',
    explain: 'A boundary mic is built for a large, flat, hard surface. A soft mat, or a raised or small surface, does not give it that geometry — and a hard example does not validate a mat.',
    why: {
      'Well enough, because the mat is large and flat': 'Large and flat is not enough: it also has to be hard.',
      'It will, once the gain is turned up more': 'Gain does not change the surface the mic is lying on.',
    },
  },
  {
    id: 'tg.mic.2',
    page: 'microphone',
    prompt: 'A mic rigidly clamped to an apparatus frame rumbles and rattles. A fair first move?',
    options: ['Try an independent airborne support', 'Cut the lows hard and keep the clamp', 'Tighten the clamp until it is silent'],
    correct: 'Try an independent airborne support',
    explain: 'A rigid mount carries the frame’s vibration. An independently supported airborne mic — or a wider feed — is the fix; EQ does not change the path.',
    why: {
      'Cut the lows hard and keep the clamp': 'The filter cuts the action’s body too; the vibration path stays.',
      'Tighten the clamp until it is silent': 'A tighter clamp couples the mic to the frame even more.',
    },
  },
  {
    id: 'tg.mic.3',
    page: 'microphone',
    prompt: 'In a reflective arena, a shotgun or a compact directional?',
    options: ['Compare both from the same place', 'The shotgun, as it reaches farther', 'The compact, as shotguns fail indoors'],
    correct: 'Compare both from the same place',
    explain: 'A shotgun’s rejection depends on frequency, not a universal reach; indoors it is not ruled out either. The room and the motion decide — compare them from the same permitted point.',
    why: {
      'The shotgun, as it reaches farther': 'No mic has a universal reach; directivity is not distance.',
      'The compact, as shotguns fail indoors': 'Indoor use is not automatically unsuitable: listen in the actual room.',
    },
  },
  {
    id: 'tg.place.1',
    page: 'placement',
    prompt: 'You lower the capsule from about 1.2 m to about 0.6 m for low contact. A fair concern?',
    options: ['It may lose the standing voice', 'It can no longer hear the floor', 'It now needs a much higher gain'],
    correct: 'It may lose the standing voice',
    explain: 'A low angle may give useful contact texture and miss a standing talker or an official; a higher view may stay steadier. Re-aim at the same source and compare.',
    why: {
      'It can no longer hear the floor': 'Lower and re-aimed, it hears the floor action better, not worse.',
      'It now needs a much higher gain': 'Height changes the angle, not the need for more gain.',
    },
  },
  {
    id: 'tg.place.2',
    page: 'placement',
    prompt: 'At B you turn the mic 30° off its axis, then turn it back. Why turn it back?',
    options: ['To restore the baseline before the next change', 'Because 30° is too far for the mic to work', 'So that the gain can be raised for the next trial'],
    correct: 'To restore the baseline before the next change',
    explain: 'Change one variable, then restore it: the next comparison starts from the same baseline, and a change in the target is not mistaken for a change in the mic.',
    why: {
      'Because 30° is too far for the mic to work': 'The 30° trial is a comparison, not a failure.',
      'So that the gain can be raised for the next trial': 'The gain stays the same within a sequence.',
    },
  },
  {
    id: 'tg.place.3',
    page: 'placement',
    prompt: 'M1 moves from 2 m to 4 m from B, the room unchanged. What do you expect?',
    options: ['About 6 dB less source against the room', 'The same balance, just a little quieter', 'More isolation, as the mic is farther away'],
    correct: 'About 6 dB less source against the room',
    explain: 'Doubling the distance costs about 6 dB of direct sound in the open; the room does not drop with it. Compare after matching loudness — and do not carry the range into a live sport.',
    why: {
      'The same balance, just a little quieter': 'The source drops; the room stays — the balance changes.',
      'More isolation, as the mic is farther away': 'Farther means less isolation from the room, not more.',
    },
  },
  {
    id: 'tg.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · What are the practice room’s 2 m and 2.83 m?',
    options: ['The practice’s own layout, not a clearance', 'The sport’s smallest safe mic distance', 'The distances a live event will approve'],
    correct: 'The practice’s own layout, not a clearance',
    explain: 'They are mock coordinates for a quiet room. A live event’s places come from its own approved survey — not carried over from the practice.',
    why: {
      'The sport’s smallest safe mic distance': 'No sport’s rule is behind the practice layout.',
      'The distances a live event will approve': 'A live event approves its own places from its own plan.',
    },
  },
  {
    id: 'tg.ctx.1',
    page: 'context',
    prompt: 'The canvas and the frame rumble through the ring mic, though the air sounds fine. Next?',
    options: ['Try an independently supported mic', 'Turn the whole ring channel down a long way', 'Add a gate so the rumble stops'],
    correct: 'Try an independently supported mic',
    explain: 'Rumble that persists beside useful airborne action is structure-borne. Try an independent airborne position; deliberate contact sensing is a separate, different path.',
    why: {
      'Turn the whole ring channel down a long way': 'Lowering it loses the action along with the rumble.',
      'Add a gate so the rumble stops': 'A gate opens on the action and lets the rumble through with it.',
    },
  },
  {
    id: 'tg.ctx.2',
    page: 'context',
    prompt: 'An authorized feed of the start cue is offered. How is it used?',
    options: ['As its own input, its delay checked', 'Instead of the action mic at the start', 'As the official record of the start time'],
    correct: 'As its own input, its delay checked',
    explain: 'A supplied cue or music feed stays separate from the action mic: check its level, its delay against the room and its rights. It is never an official timing record.',
    why: {
      'Instead of the action mic at the start': 'The cue feed carries the cue; the action mic carries the departure.',
      'As the official record of the start time': 'A production feed is not an official timing measurement.',
    },
  },
  {
    id: 'tg.ctx.3',
    page: 'context',
    prompt: 'The bell distorts, though the output fader is low. Where do you look?',
    options: ['The first stage that overloads', 'The output fader, lower again', 'A filter after the mix bus'],
    correct: 'The first stage that overloads',
    explain: 'Check the mic, the transmitter, the preamp and the converter: lower the gain at the stage that clipped, or use suitable approved hardware. A low output fader does not undo it.',
    why: {
      'The output fader, lower again': 'A low output fader does not undo an earlier clip.',
      'A filter after the mix bus': 'A filter cannot repair a clipped peak.',
    },
  },
  {
    id: 'tg.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · Where does a ringside mic stand?',
    options: ['At an assigned ringside position', 'On the apron, by a neutral corner', 'Under the bottom rope, out of sight'],
    correct: 'At an assigned ringside position',
    explain: 'On an independent stand at an assigned position, aimed through a permitted path — the apron, the corners, the steps and the ropes stay untouched.',
    why: {
      'On the apron, by a neutral corner': 'The apron and the corners are not audio space.',
      'Under the bottom rope, out of sight': 'Nothing goes through or under the ropes.',
    },
  },
  {
    id: 'tg.two.1',
    page: 'twoMic',
    prompt: 'M1 and M2 sit 2 m either side of B. A source on the walk reaches them how?',
    options: ['At the same time, all along the walk', 'At different times that keep changing', 'With M2 about 6 ms behind it'],
    correct: 'At the same time, all along the walk',
    explain: 'The two places are mirror images across the walking line: every point on it is equally far from both, so their sum has no comb there. Move one mic back and that stops being true.',
    why: {
      'At different times that keep changing': 'Only unequal paths change with the source; here they stay equal.',
      'With M2 about 6 ms behind it': 'Equal paths mean no delay at all on the line.',
    },
  },
  polarityDelay('tg.two.2'),
  {
    id: 'tg.two.3',
    page: 'twoMic',
    prompt: 'Both detail mics are open and the tone turns hollow as the action moves. First move?',
    options: ['Choose a dominant detail feed', 'Flip one mic’s polarity for good', 'Delay one mic for the whole event'],
    correct: 'Choose a dominant detail feed',
    explain: 'Choose a dominant detail feed, reduce the overlap, improve the approved aim — and only then consider a delay for a named, stationary target. Check mono and the real downmix.',
    why: {
      'Flip one mic’s polarity for good': 'Polarity that helps one point can worsen another.',
      'Delay one mic for the whole event': 'The source moves; one delay fits one point.',
    },
  },
  {
    id: 'tg.prac.gain',
    page: 'practice',
    prompt: 'A gentle clap peaks at −30 dBFS; the event will be much louder. Where do you set the gain?',
    options: ['The loudest safe peak near −12 dBFS', 'Bring the quiet clap up to −6 dBFS', 'Leave it as it is, and normalise it later'],
    correct: 'The loudest safe peak near −12 dBFS',
    explain: 'In this quiet practice the loudest safe peak is your strongest repeatable gentle clap: set it near −12 dBFS, then keep more margin for an unpredictable event — a trial starting point, not a broadcast standard.',
    why: {
      'Bring the quiet clap up to −6 dBFS': 'With a quiet clap already at −6 dBFS, the first bell or whistle clips.',
      'Leave it as it is, and normalise it later': 'Normalising later cannot fix a clip, or the noise of a gain set too low.',
    },
  },
  {
    id: 'tg.prac.3',
    page: 'practice',
    prompt: 'What would justify adding a second detail channel?',
    options: ['A tested gap the first one leaves', 'A bigger sound from more channels', 'Spare inputs left on the desk'],
    correct: 'A tested gap the first one leaves',
    explain: 'Start with one useful detail sector and the ambience; add a channel only when it solves a gap you tested and named.',
    why: {
      'A bigger sound from more channels': 'More channels add overlap and peaks to manage, not size.',
      'Spare inputs left on the desk': 'An unused input is not a reason to fill it.',
    },
  },
  {
    id: 'tg.mix.1',
    page: 'practice',
    prompt: 'A boundary example worked on a hard floor. Does it carry over to a soft mat?',
    options: ['It does not: the surface differs', 'It does, because it is the very same mic', 'It does, once the gain is matched'],
    correct: 'It does not: the surface differs',
    explain: 'Log surface and airborne geometry separately: a boundary result on a hard flat surface does not validate a soft mat.',
    why: {
      'It does, because it is the very same mic': 'The mic is the same; the surface it relies on is not.',
      'It does, once the gain is matched': 'Matching gain does not change the surface.',
    },
  },
  removeDelay('tg.mix.2'),
  {
    id: 'tg.mix.3',
    page: 'practice',
    prompt: 'The routine music reaches the action mics and also arrives as a direct feed. A fair concern?',
    options: ['Two delayed copies of the music', 'The direct feed is too clean', 'The action mics stop hearing'],
    correct: 'Two delayed copies of the music',
    explain: 'The room version reaches the action mics later than the direct feed: summing several delayed versions smears the music. Document the feed’s delay and avoid equal-level copies.',
    why: {
      'The direct feed is too clean': 'Clean is the point of the feed; the delay between versions is the issue.',
      'The action mics stop hearing': 'They keep hearing — the music arrives in them late.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 'tg.sym.gone',
    observation: 'The action disappears from the detail feed',
    firstChecks: 'The aim, the source’s height, the distance — and bodies or cameras in the way?',
    options: ['Check the aim, the height and the path', 'Move the stand much closer to the action', 'Raise the gain until it comes back'],
    correct: 'Check the aim, the height and the path',
    explain: 'Use another approved sector or a broader pickup; never advance into the performance space. Gain raises the room with the action.',
    why: {
      'Move the stand much closer to the action': 'Closer means into the performance space — use another approved sector.',
      'Raise the gain until it comes back': 'Gain raises the room and the crowd along with it.',
    },
  },
  {
    id: 'tg.sym.hollow',
    observation: 'A sharp or hollow tone that changes as the action moves',
    firstChecks: 'Off-axis tone, reflections — or two feeds open on one action?',
    options: ['Compare solo, reduce the overlap', 'Boost the highs on both channels', 'Flip a polarity and leave it there'],
    correct: 'Compare solo, reduce the overlap',
    explain: 'Listen to each mic alone, then reduce the overlap and repeat at several points: a changing comb comes from changing paths.',
    why: {
      'Boost the highs on both channels': 'EQ cannot remove a comb that moves with the source.',
      'Flip a polarity and leave it there': 'Polarity moves the notches; it does not remove the delay.',
    },
  },
  {
    id: 'tg.sym.rumble',
    observation: 'Rumble or rattles under the action',
    firstChecks: 'The mount, the frame, the platform — and a cable bypassing the suspension?',
    options: ['Check the mount and the cable path', 'Add a steep low cut and move on', 'Tape the cable tightly to the stand'],
    correct: 'Check the mount and the cable path',
    explain: 'Try an independent support or a compatible isolation, approved; keep the cable from bridging the suspension. EQ does not fix the mechanism.',
    why: {
      'Add a steep low cut and move on': 'The cut takes the action’s body and leaves the cause.',
      'Tape the cable tightly to the stand': 'A tight cable bridges the suspension and carries more vibration.',
    },
  },
  {
    id: 'tg.sym.dist',
    observation: 'The cue or an impact distorts',
    firstChecks: 'The capsule, the adapter or transmitter, the input, the bus — which overloads first?',
    options: ['Find the stage that overloads first', 'Lower the output fader a little', 'Add a limiter after the mixer'],
    correct: 'Find the stage that overloads first',
    explain: 'Reduce the gain at the affected stage, or use suitable approved hardware; a limiter cannot undo an earlier clip.',
    why: {
      'Lower the output fader a little': 'The output fader only scales what already clipped.',
      'Add a limiter after the mixer': 'A limiter after the clip cannot repair it.',
    },
  },
  {
    id: 'tg.sym.crowd',
    observation: 'The crowd or the music dominates the detail',
    firstChecks: 'The mic’s axis, the PA’s place, the open channels, a supplied feed’s delay?',
    options: ['Check the axis and the open channels', 'Turn the ambience pair right off for now', 'Aim the detail mic at the PA'],
    correct: 'Check the axis and the open channels',
    explain: 'Choose a tested sector and an intentional ambience balance: what sits on the axis, and what is open, decide the mix.',
    why: {
      'Turn the ambience pair right off for now': 'Then the continuity is gone too.',
      'Aim the detail mic at the PA': 'That puts the music on the axis — the opposite of the aim.',
    },
  },
  {
    id: 'tg.sym.jump',
    observation: 'The fallback changes the perspective abruptly',
    firstChecks: 'A gain mismatch, gates, different noise beds?',
    options: ['Rehearse a smooth transition', 'Gate the fallback channel harder', 'Switch faster, so nobody notices'],
    correct: 'Rehearse a smooth transition',
    explain: 'Rehearse the change with a stable venue ambience underneath, matched in level, so losing detail does not jump.',
    why: {
      'Gate the fallback channel harder': 'A hard gate makes the venue drop in and out.',
      'Switch faster, so nobody notices': 'A faster cut makes the jump more obvious, not less.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'tg.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of the practice session in the order you would do them.',
    steps: [
      { text: 'Map the source, equipment and walking areas and the fallback', early: 'The map comes first.' },
      { text: 'Log each mic, its pattern, power, gain and filters', early: 'Log the chain once the map is drawn.' },
      { text: 'Three gentle claps at A, B and C with the gain unchanged', early: 'Compare once everything is logged.' },
      { text: 'Turn 30° off the axis at B, then restore the aim', early: 'Aim trials come after the fixed comparison.' },
      { text: 'Swap in the compact mic, then try twice the range', early: 'Pattern and range come after the aim.' },
      { text: 'Overlap M1 and M2: solo, mono, stereo — choose a dominant feed', early: 'The overlap comes after the single-mic trials.' },
      { text: 'Mute the detail, check the fallback, repeat the B trial', early: 'The fallback and the final repeat come last.' },
    ],
    explain: 'A sensible order: the map, the log, the fixed comparison, the aim, the pattern and range, the overlap, the fallback — then the repeat to check consistency.',
  },
];

const setupTasks: SetupTask[] = [
  {
    id: 'tg.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A wrestling event: two event-assigned places outside the mat, three channels, the protection area busy.',
    setups: [
      { id: 'a', label: 'A directional at each assigned place, plus a wider venue feed', ok: true, power: 'phantom', feedback: 'A recommended start: one dominant action feed per sector, and the wider feed for the gaps.' },
      { id: 'b', label: 'One directional on the centre, a stereo ambience pair for the rest', ok: true, power: 'phantom', feedback: 'A recommended start: a single sector supported by a wider feed — not presented as complete coverage.' },
      { id: 'c', label: 'A mic taped in the protection border for the edge action', ok: false, power: 'phantom', feedback: 'The protection area is not a mic strip — the action carries into it.' },
      { id: 'd', label: 'A small mic hidden at a mat joint near the centre', ok: false, power: 'phantom', feedback: 'Nothing hard is hidden in the mat, and it can be struck or snag.' },
      { id: 'e', label: 'The coach’s shouts as the main mat perspective', ok: false, power: 'phantom', feedback: 'Coaches’ voices are not the mat: keep them from becoming the whole perspective.' },
    ],
    reasons: [
      { id: 'r.outside', label: 'Each mic stands outside the mat’s whole envelope', role: 'required', feedback: 'Say where each mic is approved to be.' },
      { id: 'r.wide', label: 'A wider feed carries what bodies block', role: 'required', feedback: 'Say what covers the gaps.' },
      { id: 'r.heights', label: 'Standing and low source heights both tried', role: 'optional', feedback: 'A fair reason — a low angle may miss the referee.' },
      BRAND_REASON('wrestling mat'),
      { id: 'r.gain', label: 'More gain makes up for the distance to the edge', role: 'wrong', feedback: 'Gain raises the room too; it does not repair placement.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: places outside the envelope, one dominant sector at a time, and a wider feed for the gaps.',
  },
  {
    id: 'tg.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A gymnastics floor final: the routine music in the room, an authorized music feed offered, landings wanted.',
    setups: [
      { id: 'a', label: 'A perimeter directional sector, a stereo venue view, the music feed on its own input', ok: true, power: 'phantom', feedback: 'A recommended start: detail, continuity and the music each separately controllable, the feed’s delay logged.' },
      { id: 'b', label: 'A stereo venue view, with the music feed kept separate', ok: true, power: 'phantom', feedback: 'A recommended start where no detail sector is approved: the routine and the room, the music controllable.' },
      { id: 'c', label: 'A mic on the floor’s edge where the gymnast lands', ok: false, power: 'phantom', feedback: 'The border and the landing space stay clear.' },
      { id: 'd', label: 'The music feed and every room mic summed at equal level', ok: false, power: 'phantom', feedback: 'Several delayed copies of the music smear it: avoid equal-level delayed versions.' },
      { id: 'e', label: 'Ask the gymnast to repeat a hard landing for a level check', ok: false, power: 'phantom', feedback: 'Test only normal authorized warm-up — never repeated hard landings for sound.' },
    ],
    reasons: [
      { id: 'r.clear', label: 'Every mic stays beyond the border and the landing space', role: 'required', feedback: 'Say how the mics stay clear.' },
      { id: 'r.music', label: 'The music feed is separate, its delay known', role: 'required', feedback: 'Say how the music is handled.' },
      { id: 'r.mono', label: 'The stereo view is checked in mono', role: 'optional', feedback: 'A fair reason.' },
      BRAND_REASON('gymnastics floor'),
      { id: 'r.close', label: 'Closer to the apparatus is always better', role: 'wrong', feedback: 'Closer can mean the apparatus’s rattles and the gymnast’s space.' },
    ],
    explain: 'Two setups pass. What passes is the reasoning: clear of the border and the landings, the music separately controllable, the venue view checked in mono.',
  },
];

const predictions: Lesson['predictions'] = {
  meet: { prompt: 'Before you look: aimed at B, which source point will the mic at M1 hear least clearly?', options: ['A or C, off to the side', 'B, straight ahead', 'All three the same'], after: 'Now step through TARGET.' },
  microphone: { prompt: 'Which method gives the steadiest sense of the venue?', options: ['The ambience pair', 'The fixed shotgun', 'The low plant'], after: 'Now step through each METHOD.' },
  placement: { prompt: 'Predict: you move M1 from 2 m to 4 m from B. What happens to the source against the room?', options: ['About 6 dB less', 'About the same', 'About 6 dB more'], after: 'Rest the mic in two zones and read what each one suggests.' },
  context: { prompt: 'The converter reads −8 dBFS on the bell. Is the chain safe?', options: ['It may not be', 'It is safe', 'Only with a low fader'], after: 'Now find the first overloaded stage.' },
  twoMic: { prompt: 'If you flip mic B’s polarity, what happens to the delay Δt?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip B POLARITY both ways, then walk the source.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'meet',
    prompt: 'What authorizes a mic on an apparatus, a ring or a mat?',
    options: ['Approval for the whole installation', 'A media accreditation for the venue', 'A small mic placed out of sight'],
    correct: 'Approval for the whole installation',
    explain: 'The mount, the cover, the cable and any movement are approved together; accreditation alone authorizes none of it.',
    why: { 'A media accreditation for the venue': 'Accreditation lets you in; it does not approve a mount.', 'A small mic placed out of sight': 'Size and hiding are not approval.' },
  },
  {
    id: 'q.2',
    covers: 'meet',
    prompt: 'A source moves from 2 m to 4 m from the mic. About how much weaker is its direct sound?',
    options: ['About 6 dB weaker', 'About 12 dB weaker', 'No change at all'],
    correct: 'About 6 dB weaker',
    explain: 'Twice the distance, about 6 dB less direct sound in the open — while the room stays.',
    why: { 'About 12 dB weaker': 'Doubling the distance costs about 6 dB, not 12.', 'No change at all': 'Distance always matters to the direct sound.' },
  },
  {
    id: 'q.3',
    covers: 'meet',
    prompt: 'How does a shotgun’s off-axis rejection behave?',
    options: ['It changes with frequency', 'It is a fixed reach', 'It is the same indoors and out'],
    correct: 'It changes with frequency',
    explain: 'Its rejection depends on frequency and angle; it gives no universal reach, and the room changes the result.',
    why: { 'It is a fixed reach': 'No mic has a fixed reach.', 'It is the same indoors and out': 'Reflections change what reaches it.' },
  },
  {
    id: 'q.4',
    covers: 'setups',
    critical: true,
    prompt: 'Thunder during an outdoor track session. Where is safe?',
    options: ['A substantial building or hard-topped car', 'The open shelter beside the start area', 'Under the grandstand’s open roof, at its edge'],
    correct: 'A substantial building or hard-topped car',
    explain: 'Shelter at once; open shelters are not safe. Wait 30 minutes after the last thunder.',
    why: { 'The open shelter beside the start area': 'An open shelter is not a safe lightning shelter.', 'Under the grandstand’s open roof, at its edge': 'An open structure is not a safe lightning shelter.' },
  },
  {
    id: 'q.5',
    covers: 'setups',
    critical: true,
    prompt: 'A mic in the ring area is struck during a bout. What now?',
    options: ['Mute it; retrieve it only when released', 'Reach in and fix it quickly between rounds', 'Leave it up and raise the others'],
    correct: 'Mute it; retrieve it only when released',
    explain: 'Medical and official access come first. Mute the feed, use the fallback, and retrieve the mic only when the event authority releases the area.',
    why: { 'Reach in and fix it quickly between rounds': 'Between rounds the ring belongs to the corners and the officials.', 'Leave it up and raise the others': 'A struck mic may now point anywhere — mute it.' },
  },
  {
    id: 'q.6',
    covers: 'setups',
    prompt: 'Why keep the supplied cue feed separate from the action mic?',
    options: ['Each can be controlled on its own', 'It halves the risk of feedback', 'The rules ask for two channels'],
    correct: 'Each can be controlled on its own',
    explain: 'Separate inputs let the cue and the action be balanced, delayed or muted independently.',
    why: { 'It halves the risk of feedback': 'Feedback is about routing, not separate inputs.', 'The rules ask for two channels': 'It is a production choice, not a rule.' },
  },
];

export const B15_LESSON: Lesson = {
  id: 'B15',
  labId: 'broadcast',
  title: 'Track, Gymnastics and Combat Sports',
  subtitle: 'Fixed detail from approved places, a stable venue view — starts, landings, rings and mats kept clear, air kept apart from structure',
  noun: { one: 'venue', many: 'venues', subject: 'the venue' },
  model: B15_MODEL,
  micTypeIds: ['shotgunShort', 'scSupercard'],
  zones: B15_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'Starts, footwork, landings, apparatus and combat action — track running, artistic gymnastics, boxing, wrestling and judo — picked up from permitted places while the performance space stays clear.', src: 'LESSON-B15' },
    { title: 'APPROVAL FIRST', text: 'Accreditation alone does not authorize a mic on an apparatus, a ring or a mat. The whole installation — mount, cover, cable, any movement — is approved, and every athlete, official, coach, medical and emergency route stays open.', src: 'LESSON-B15' },
    { title: 'A PERSPECTIVE, NOT A COUNT', text: 'A fixed detail feed follows one named place; an ambience feed carries the venue through the gaps. Neither does both jobs equally well — start with one useful sector and the ambience.', src: 'LESSON-B15' },
    { title: 'THE PRACTICE ROOM', text: 'Here you practise in a quiet room: three source points on one walking line and two equipment areas either side. These are suggested starting points — experimentation is encouraged; your ears and the room decide.', src: 'LESSON-B15' },
  ],
  sound: {
    stages: [
      { title: 'Brief and moving', text: 'A start, a landing, a glove: short, and in a different place each time. A mic on one region hears the next one farther away and off its axis.' },
      { title: 'Air and structure', text: 'Apparatus, rings and platforms carry their own rattles and rumble. A mic touching them hears the structure; an independent mic hears the air.' },
      { title: 'Everything else', text: 'Bells, whistles, start cues, routine music and the PA can be louder than the action you want — and they share the same axis.' },
    ],
    attack: 'A block departure, a landing, a glove — short transients, the clearest cue of where the action is.',
    body: 'The venue and its crowd — the continuous bed under every action.',
    head: { diameterMm: 0, rods: 0, label: 'the practice room', strikeSrc: 'LESSON-B15' },
  },
  setting: {
    items: [
      { id: 'cue', label: 'start cues, bells and whistles', short: 'CUES', note: 'They can peak far above the detail you want. Keep headroom for them, and keep a supplied cue feed separately controllable — never patched from the start or timing system.', prov: { kind: 'illustrative', reason: 'the lesson L58–L59, L107' }, tag: 'PEAKS', scene: 'all' },
      { id: 'music', label: 'routine music and the PA', short: 'MUSIC · PA', note: 'Music spill may be part of the event; a clean authorized music feed stays separate, its delay logged. Avoid summing several equally loud delayed copies.', prov: { kind: 'illustrative', reason: 'the lesson L99, L104' }, tag: 'SPILL', scene: 'all' },
      { id: 'apparatus', label: 'apparatus, rings and platforms', short: 'STRUCTURE', note: 'They transmit mechanical noise to their supports: a mic near a frame may favour rattles over the useful airborne action.', prov: { kind: 'illustrative', reason: 'the lesson L81, L111' }, tag: 'VIBRATION', scene: 'all' },
      { id: 'bodies', label: 'athletes, officials and crews', short: 'PEOPLE', note: 'Bodies block one mic and then another as the action turns; their routes are never a place for a stand or a cable.', prov: { kind: 'illustrative', reason: 'the lesson L132, L158' }, tag: 'IN THE WAY', scene: 'all' },
      { id: 'camera', label: 'the cameras', short: 'CAMERAS', note: 'Sound positions are resolved with the cameras and the apparatus crew before installation.', prov: { kind: 'illustrative', reason: 'the lesson L18, L83' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'weather', label: 'wind, rain, sweat and dust', short: 'WEATHER', note: 'A windscreen is not waterproofing and humidity tolerance is not immersion protection; mute and replace a soaked mic only when released.', prov: { kind: 'illustrative', reason: 'the lesson L169–L179' }, tag: 'WIND', scene: 'all' },
    ],
    stage: 'Commentary, interviews and approved official speech stay separate from the action feed; cues and music on their own inputs; action and crowd mics generally need no reinforcement in the venue. Check the picture’s sync through the real chain.',
    studio: 'A quiet practice allows one change at a time and a repeatable source — but it cannot prove arena isolation, impact tolerance or the peaks a real event can make.',
  },
  diagnostic,
  practice: {
    task: 'Put a practice session in order, choose and justify setups for a wrestling event and a gymnastics floor final, and say what would justify another detail channel. With an approved practice, you can record what you tried below.',
    fields: [
      { id: 'event', label: 'Sport or mock case, approving contact and footprint', kind: 'text' },
      { id: 'target', label: 'Target action and intended perspective', kind: 'text' },
      { id: 'method', label: 'Method', kind: 'choice', choices: ['fixed directional', 'compact directional', 'boundary on a hard surface', 'approved plant', 'ambience', 'other'] },
      { id: 'pos', label: 'Model, pattern, source and capsule heights, range and aim', kind: 'text' },
      { id: 'peak', label: 'Peak, remaining margin and noise', kind: 'text' },
      { id: 'coverage', label: 'Strongest sector, weakest point and fallback', kind: 'text' },
      { id: 'approval', label: 'Approval and safe access still to verify', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'The practice room’s points A, B and C, the equipment marks M1 and M2, the 1 m capsule and clap height and the double-range place are the lesson’s own; the extents of the source and equipment areas, the clearance bands, the way out and the low and standing source heights are drawing defaults.', dims: [] },
    { text: 'The venue outlines (a track start, gymnastics floor and vault, a boxing ring, a wrestling mat, judo) are typical layouts drawn at common dimensions, not read from any rulebook; only the wrestling area and its protection border come from the rules read, and judo carries no number at all.', dims: [] },
    { text: 'The headroom chain’s event sizes and each stage’s limit are an example, not a measurement of any equipment.', dims: [] },
  ],
  live: { wedges: [] },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every venue and event is different: get approval, listen, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: the practice room and its marks are the lesson’s own; the venue outlines, their routes and approved places are typical layouts; ranges and delays are calculated from the drawing; the headroom chain is an example. A sport’s clear zone is typical — check your event’s rules. Safety is exact: never into the performance space, a route or the apparatus; with thunder, shelter at once and wait 30 minutes after the last thunder.',
  copy: B15_COPY,
};
