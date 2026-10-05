/**
 * C08 ELECTRIC BASS, FRETTED AND FRETLESS (Lab 4, Strings) — the lesson as
 * DATA. Words from the owner's lesson
 * (docs/labs/miking/source_text/Electric-Bass-Amplifier-Miking-Technique.txt,
 * "L<n>" in COMMENTS only), with the fixes in CORRECTIONS_LOG.md (BA-01 …)
 * applied. Research: docs/labs/miking/electric_bass_amp/.
 *
 * Owner ruling 2026-10-04: suggested starting points; no source, brand or
 * model names; no badges; FULLY SILENT. A DI is taught as a supporting
 * option and as its own electrical source, never called a microphone, and
 * drawn on its own lane of the signal path.
 */
import type { DiagnosticItem, Lesson, MikingScenario, OrderTask, PageContent, PageId, SetupReason, SetupTask, Symptom } from '../../engine/model/types.ts';
import { C08_MODEL, C08_ZONES } from './geometry.ts';
import { C08_MICS } from './model.ts';

const FLOOR = C08_MODEL.yFloor.mm;

const pages: Record<PageId, PageContent> = {
  instrument: {
    title: 'Meet the bass and its rig',
    goal: 'Get to know the electric bass’s chain — strings, pickups, the DI, the head and the cabinet — before any microphone.',
    credit: { scenarios: [], note: 'Credited when you move on from the last step — explore as much as you like; there is nothing to answer here.' },
    takeaway: 'The strings start the sound and the pickups turn it into a signal. The head drives the cabinet’s woofers and horn; that air is what a mic hears. A DI is a separate, electrical copy.',
  },
  sound: {
    title: 'How it makes its sound',
    goal: 'See how a bass string becomes a signal and the signal becomes moving air — the lowest notes, the pickups, the cone and the horn. Shown, never played.',
    credit: { scenarios: ['ba.snd.1', 'ba.snd.2', 'ba.snd.3'], interactive: 'soundPath', note: 'Step through three harmonics and try both pickups, step the cone through to the end, and answer the three checks.' },
    takeaway: 'A bass’s lowest note is about 41 Hz on four strings and about 31 Hz on a five-string’s low B. Each pickup senses its own spot. The woofers carry the body; a horn, if there is one, adds the top end.',
  },
  setting: {
    title: 'Where it sits',
    goal: 'Know the path from the strings to the desk — the DI, the head, the speaker cable and the mic — what sits round the rig, and what to do before any mic.',
    credit: { scenarios: ['ba.set.1', 'ba.set.2', 'ba.set.3'], note: 'Answer the three checks.' },
    takeaway: 'A DI box before the head and the head’s own DI output are electrical sources, each on its own channel. A speaker output goes only to a speaker, by a speaker cable. Protect your hearing: the lows carry a lot of energy.',
  },
  microphone: {
    title: 'Choose the microphone',
    goal: 'Choose a mic for a bass cabinet by its properties — low-frequency response, level handling, pattern, power and mount — not by its brand.',
    credit: { scenarios: ['ba.mic.1', 'ba.mic.2', 'ba.mic.3', 'ba.mic.4', 'ba.rec.1'], note: 'Answer the five checks (one reaches back to how it sounds).' },
    takeaway: 'Check the mic’s low-frequency response and how much level it handles; a low-frequency dynamic close in and a condenser farther back are both common. Compare by ear, at matched level.',
  },
  placement: {
    title: 'Placement Studio',
    goal: 'Start where we recommend you begin on a bass cabinet — on one woofer, close at the dust cap’s edge — then try a little more distance for room to breathe, one change at a time.',
    credit: { scenarios: ['ba.place.1', 'ba.place.2', 'ba.place.3', 'ba.rec.2'], interactive: 'twoZones', note: 'Rest the mic in two different recommended starting points, clear of every part, and answer the four checks.' },
    takeaway: 'Pick ONE woofer, measure from the grille, and change one thing at a time. Close (2.5–15 cm) for focus and isolation; 10–45 cm to let the lows develop where the room and the stage allow.',
  },
  context: {
    title: 'Studio or live',
    goal: 'Aim a bass-cabinet mic so its rejection faces a monitor — and know why live sound often leans on the DI.',
    credit: { scenarios: ['ba.ctx.1', 'ba.ctx.2', 'ba.ctx.3', 'ba.ctx.studio', 'ba.rec.3'], interactive: 'wedgeInNull', note: 'LIVE: aim the mic (or change its pattern) until the bassist’s wedge sits in the rejection. STUDIO: answer the decision card. Then the four checks.' },
    takeaway: 'Live, a DI often carries the dependable low end and the mic adds the cabinet’s character. A close, directional mic rejects more of the stage — but real nulls are shallowest in the lows.',
  },
  twoMic: {
    title: 'Mic and DI',
    goal: 'Blend the cabinet mic with a DI: see that the DI arrives first, what polarity does and does not change, and how to judge the blend.',
    credit: { scenarios: ['ba.two.1', 'ba.two.2', 'ba.two.3'], interactive: 'polarityVsDelay', note: 'Flip the DI’s polarity both ways AND move the mic so the delay changes, then answer the three checks.' },
    takeaway: 'The mic hears the speaker after the sound crosses the air; the DI does not. Hear each alone, then the blend in mono; move or rebalance, then try polarity both ways. No single setting fixes every frequency.',
  },
  troubleshoot: {
    title: 'Troubleshoot',
    goal: 'Match each symptom to the first things to check.',
    credit: { scenarios: [], interactive: 'symptoms', note: 'Choose the first checks for all eight symptoms (a retry is explained, never penalised).' },
    takeaway: 'Move the mic before reaching for EQ, check the DI on its own, and stop for anything electrical you are not sure of.',
  },
  practice: {
    title: 'Practice',
    goal: 'Set up a mic and a DI in the right order, choose and justify a setup for two different briefs, and say what would justify the second channel.',
    credit: { scenarios: ['ba.prac.order', 'ba.prac.gain', 'ba.prac.setup1', 'ba.prac.setup2', 'ba.prac.3', 'ba.mix.1', 'ba.mix.2', 'ba.mix.3'], note: 'Put the setup in order, answer the gain check, complete both setup briefs, and answer the four reasoning cards. The observation sheet is optional — it needs a real rig.' },
    takeaway: 'Label every source, keep the speaker connection as it is, set gain on the hardest notes, judge mic and DI alone and together in mono. More than one setup passes; a brand never does.',
  },
};

/* THE CHECKS. Lesson lines in comments only: ba.snd.* L6, L38 + stringModel ·
 * ba.set.* L6, L36, L43-L45 · ba.mic.* L9, L37 · ba.place.* L9, L29 ·
 * ba.ctx.* L41 · ba.two.* L37 · ba.prac/mix L36-L44, L73-L77. */
const scenarios: MikingScenario[] = [
  {
    id: 'ba.snd.1',
    page: 'sound',
    prompt: 'A five-string bass adds a low B string. About how low is its open note?',
    options: ['About 82 Hz — the same as a guitar’s low string', 'About 41 Hz — the same as a four-string’s low E', 'About 31 Hz — lower than a four-string’s 41 Hz'],
    correct: 'About 31 Hz — lower than a four-string’s 41 Hz',
    explain: 'In equal temperament the low E (E1) is about 41.2 Hz and a five-string’s low B (B0) about 30.9 Hz. Mics, DIs, filters and the PA all have to reach that far down — check the lowest notes the player really plays.',
    why: {
      'About 82 Hz — the same as a guitar’s low string': 'That is the guitar’s low E, an octave above the bass’s low E.',
      'About 41 Hz — the same as a four-string’s low E': 'The B sits five semitones BELOW the low E: about 31 Hz.',
    },
  },
  {
    id: 'ba.snd.2',
    page: 'sound',
    prompt: 'Why might a bass cabinet have a small horn as well as its woofers?',
    options: ['For the lowest notes, which the woofers cannot reach', 'To spread the bass evenly round the whole room', 'For the top end — string noise, pick and slap detail'],
    correct: 'For the top end — string noise, pick and slap detail',
    explain: 'A horn handles the highest frequencies the woofers do not. A mic on one woofer may not hear it — aim at the horn only as a deliberate choice, and listen for hiss.',
    why: {
      'For the lowest notes, which the woofers cannot reach': 'The woofers carry the lows; a small horn carries the HIGHS.',
      'To spread the bass evenly round the whole room': 'Low frequencies already spread widely; the horn is for the top end.',
    },
  },
  {
    id: 'ba.snd.3',
    page: 'sound',
    prompt: 'Close in, a mic aimed at the middle of a woofer tends to hear…',
    options: ['only the lowest notes, since the middle moves most', 'nothing of the cone, only the dust cap’s air', 'more upper-mid bite than toward the edge'],
    correct: 'more upper-mid bite than toward the edge',
    explain: 'Higher up, the middle of the cone does more of the work, so a close mic aimed there tends to hear more attack — slap, pick, fretless articulation. Toward the edge tends to be warmer. Tendencies to check.',
    why: {
      'only the lowest notes, since the middle moves most': 'At low pitches the whole cone moves as one; the middle adds the UPPER content.',
      'nothing of the cone, only the dust cap’s air': 'The dust cap is part of the moving cone: the mic hears the cone’s front.',
    },
  },
  {
    id: 'ba.set.1',
    page: 'setting',
    prompt: 'The head has a DI output with a PRE / POST switch. What decides what PRE and POST include?',
    options: ['Nothing: PRE is plain dry and POST is the speaker’s full sound', 'The desk, which sets it when the cable is connected', 'That head’s own manual — it differs from model to model'],
    correct: 'That head’s own manual — it differs from model to model',
    explain: 'Which pad, EQ, drive and effects a PRE or POST output includes is model-specific. Read the manual, then label the channel for what it really carries — and remember neither is the speaker’s air.',
    why: {
      'Nothing: PRE is plain dry and POST is the speaker’s full sound': 'Neither carries the speaker’s air, and what each includes depends on the model.',
      'The desk, which sets it when the cable is connected': 'The switch is on the head; the desk only receives what it sends.',
    },
  },
  {
    id: 'ba.set.2',
    page: 'setting',
    prompt: 'The desk is short of inputs. Can the head’s speaker output go into a desk input or an ordinary DI?',
    options: ['Yes, through the DI box’s pad switch', 'Yes, as long as the head is turned right down first', 'No — a speaker output goes only to a speaker'],
    correct: 'No — a speaker output goes only to a speaker',
    explain: 'A speaker output carries high power. It goes to the cabinet by a speaker cable — never to a mic, line or ordinary DI input. Some heads must never run without their speaker load: read the manual; when unsure, stop and ask a technician.',
    why: {
      'Yes, through the DI box’s pad switch': 'An instrument DI’s pad is for loud instruments, not speaker-level power.',
      'Yes, as long as the head is turned right down first': 'A lower level does not make the connection safe, and some heads need their load whenever they are on.',
    },
  },
  {
    id: 'ba.set.3',
    page: 'setting',
    prompt: 'You need to connect the DI box to the bass. When do you plug in?',
    options: ['Whenever the bassist is not playing a note', 'With the amp off or every level at zero', 'Only once the desk has phantom power switched on'],
    correct: 'With the amp off or every level at zero',
    explain: 'Making or breaking connections with levels up can send a loud pop through the system. Power off, or all levels at zero, then connect — and switch phantom with the outputs muted.',
    why: {
      'Whenever the bassist is not playing a note': 'A connection can pop even in silence; it is the LEVELS that must be down.',
      'Only once the desk has phantom power switched on': 'Phantom is switched with the outputs muted, after connecting — not as the cue to plug in.',
    },
  },
  {
    id: 'ba.rec.1',
    page: 'microphone',
    prompt: 'FROM EARLIER · Which notes must a bass mic, its preamp and any filter be able to carry?',
    options: ['Only the notes above about 100 Hz that you can clearly hear', 'Down to about 41 Hz — about 31 Hz on a five-string', 'Only the horn’s range, above the woofers'],
    correct: 'Down to about 41 Hz — about 31 Hz on a five-string',
    explain: 'The open low E is about 41 Hz, a low B about 31 Hz. A mic or filter that turns those down thins the bass — check the lowest notes the player really plays.',
    why: {
      'Only the notes above about 100 Hz that you can clearly hear': 'The fundamental of the lowest notes sits well below 100 Hz.',
      'Only the horn’s range, above the woofers': 'The horn carries the top end; the woofers carry the notes themselves.',
    },
  },
  {
    id: 'ba.mic.1',
    page: 'microphone',
    prompt: 'What should you check first about a mic for a close bass cabinet?',
    options: ['That it is made by the same company as the bassist’s head', 'Its low-frequency response and how much level it handles', 'That it has the brightest sound of all the mics'],
    correct: 'Its low-frequency response and how much level it handles',
    explain: 'A bass cabinet is loud and low: the mic must reach the lowest notes and handle the level without distorting. Then compare by ear, at matched level.',
    why: {
      'That it is made by the same company as the bassist’s head': 'Brand matching decides nothing: check its properties.',
      'That it has the brightest sound of all the mics': 'Brightness is not the first need on a bass cabinet: the lows and the level are.',
    },
  },
  {
    id: 'ba.mic.2',
    page: 'microphone',
    prompt: 'No phantom power on the bass channel. Which of this page’s mic types can you still use?',
    options: ['The small condenser, kept a little farther back', 'The two dynamics: neither needs power', 'The small condenser, while the head is switched on'],
    correct: 'The two dynamics: neither needs power',
    explain: 'Dynamics need no power. A condenser needs phantom power from the desk wherever it is placed.',
    why: {
      'The small condenser, kept a little farther back': 'Distance does not change what a condenser needs: it still needs phantom.',
      'The small condenser, while the head is switched on': 'The head powers the speakers, not the mic.',
    },
  },
  {
    id: 'ba.mic.3',
    page: 'microphone',
    prompt: 'A DI box needs 48 V phantom power to work. Is it still a direct source, labelled as its own channel?',
    options: ['No, a box that needs phantom power counts as a mic', 'Yes — it carries the bass’s electrical signal, not air', 'No, it is a mic built into the box for the bass'],
    correct: 'Yes — it carries the bass’s electrical signal, not air',
    explain: 'Some DI boxes use phantom power to run their electronics. They still carry the instrument’s electrical signal — not the air from a speaker. Label it “bass DI”, not “bass mic”.',
    why: {
      'No, a box that needs phantom power counts as a mic': 'Phantom power runs electronics of many kinds; it says nothing about hearing air.',
      'No, it is a mic built into the box for the bass': 'There is no capsule in a DI: it takes the electrical signal from the instrument.',
    },
  },
  {
    id: 'ba.mic.4',
    page: 'microphone',
    prompt: 'A close dynamic on the woofer and a condenser farther back: what does each tend to bring?',
    options: ['Close: the room; farther: the woofer’s focused sound', 'Close: focus and isolation; farther: cabinet and room', 'They bring the same sound, only at two quite different levels'],
    correct: 'Close: focus and isolation; farther: cabinet and room',
    explain: 'Close in, the mic hears mostly the woofer; farther back, more of the cabinet and the room — useful only when the room helps, and checked in mono because it arrives later.',
    why: {
      'Close: the room; farther: the woofer’s focused sound': 'It is the other way round: the close mic hears the woofer, the far one more room.',
      'They bring the same sound, only at two quite different levels': 'Distance changes the balance of woofer, cabinet and room — not only the level.',
    },
  },
  {
    id: 'ba.place.1',
    page: 'placement',
    prompt: 'A bass cabinet has four 10 in woofers. Where do you begin?',
    options: ['In the middle of the grille, between all four', 'Wherever the cabinet’s logo plate sits', 'On ONE woofer — not the gap between two'],
    correct: 'On ONE woofer — not the gap between two',
    explain: 'Between woofers a mic hears several arrivals at once, with unpredictable cancellations. Choose one woofer — at a safe level, by ear — and start there.',
    why: {
      'In the middle of the grille, between all four': 'The middle may fall between drivers, where their arrivals can cancel.',
      'Wherever the cabinet’s logo plate sits': 'A logo marks nothing acoustic. Find the woofer itself.',
    },
  },
  {
    id: 'ba.place.2',
    page: 'placement',
    prompt: 'Close in, the bass sounds tight but small. Which first try gives the low notes more room to breathe?',
    options: ['Push the mic right up against the grille cloth', 'Swap to another mic and move it at the same time', 'Back the mic off to 10–45 cm, keeping its aim'],
    correct: 'Back the mic off to 10–45 cm, keeping its aim',
    explain: 'A little more distance lets the woofer and cabinet combine and the lows develop — at the cost of more room and stage. One change at a time, at matched level.',
    why: {
      'Push the mic right up against the grille cloth': 'Touching the cloth adds noise, and closer gives less room, not more.',
      'Swap to another mic and move it at the same time': 'Two changes at once — you cannot tell which one helped.',
    },
  },
  {
    id: 'ba.place.3',
    page: 'placement',
    prompt: 'Slap and pop sound too clanky through the close mic. What do you try first?',
    options: ['Aim the mic straight at the horn instead of the woofer', 'Boost the treble so the pop cuts through', 'Slide outward on the cone, keeping the distance'],
    correct: 'Slide outward on the cone, keeping the distance',
    explain: 'Toward the centre — or the horn — tends to exaggerate clank and hiss. Slide toward the edge first; if a DI is in use it may already carry the transient detail.',
    why: {
      'Aim the mic straight at the horn instead of the woofer': 'The horn tends to ADD clank and hiss. Move outward on the woofer first.',
      'Boost the treble so the pop cuts through': 'That makes the clank louder. Move the mic first.',
    },
  },
  {
    id: 'ba.rec.2',
    page: 'placement',
    prompt: 'FROM EARLIER · Which of these hears the air from the cabinet?',
    options: ['A DI box between the bass and the head', 'A mic in front of one woofer', 'The head’s POST DI output'],
    correct: 'A mic in front of one woofer',
    explain: 'Only a mic hears the speaker’s air. Both DI paths are electrical, taken before the speaker — separate sources, labelled as such.',
    why: {
      'A DI box between the bass and the head': 'That taps the bass’s electrical signal, before the head and the speaker.',
      'The head’s POST DI output': 'POST includes some of the head’s circuits — still electrical, never the speaker’s air.',
    },
  },
  {
    id: 'ba.ctx.1',
    page: 'context',
    prompt: 'On a loud stage, why does the bass often go to the PA through a DI?',
    options: ['A DI makes the bass louder than a cabinet mic could', 'The cabinet cannot be miked once the band plays', 'It is dependable: no spill and no room in it'],
    correct: 'It is dependable: no spill and no room in it',
    explain: 'A DI carries the bass without the drums, the wedges or the room. A cabinet mic is often added for its character — blended under the DI and checked in mono.',
    why: {
      'A DI makes the bass louder than a cabinet mic could': 'Level comes from gain; the DI’s advantage is that it hears no spill.',
      'The cabinet cannot be miked once the band plays': 'It can, and often is — the mic adds the cabinet’s character.',
    },
  },
  {
    id: 'ba.ctx.2',
    page: 'context',
    prompt: 'The bassist’s wedge sits downstage, behind your cardioid cabinet mic. Where does the cardioid reject most?',
    options: ['At its sides, about ninety degrees off its axis', 'Directly behind it, where that wedge sits', 'In front of it, toward the woofer it faces'],
    correct: 'Directly behind it, where that wedge sits',
    explain: 'A cardioid rejects most at 180°. Real nulls are shallower than the simplified pattern — shallowest in the lows, which is where a bass wedge is loudest.',
    why: {
      'At its sides, about ninety degrees off its axis': 'At 90° a cardioid still picks up about half (−6 dB). Its deepest rejection is behind.',
      'In front of it, toward the woofer it faces': 'That is where it picks up MOST.',
    },
  },
  {
    id: 'ba.ctx.3',
    page: 'context',
    prompt: 'Too much stage bass is feeding back through the PA. What comes first?',
    options: ['Turn the bass mic up until it drowns the spill out completely', 'Lower the offending level, then rework the geometry', 'Point the cabinet straight at the vocal mics'],
    correct: 'Lower the offending level, then rework the geometry',
    explain: 'Make it safe first: lower the level. Then revisit where the cabinet, the monitors and the mics point, and how much of the low end the stage really needs.',
    why: {
      'Turn the bass mic up until it drowns the spill out completely': 'More gain feeds the loop: feedback becomes MORE likely.',
      'Point the cabinet straight at the vocal mics': 'That sends more bass into other open mics.',
    },
  },
  {
    id: 'ba.ctx.studio',
    page: 'context',
    prompt: 'Studio, a good room: what could justify a second mic farther back from the bass cabinet?',
    options: ['A farther mic reaches lower notes than a close one does', 'The room adds something the close mic and DI lack', 'It replaces the need for a DI on the session'],
    correct: 'The room adds something the close mic and DI lack',
    explain: 'Try it only once the close mic and the DI are stable, and only if the room helps. It arrives later: check the low end in mono.',
    why: {
      'A farther mic reaches lower notes than a close one does': 'Farther back, a directional mic usually hears LESS low end.',
      'It replaces the need for a DI on the session': 'It is another perspective, not a replacement; record the paths separately.',
    },
  },
  {
    id: 'ba.rec.3',
    page: 'context',
    prompt: 'FROM EARLIER · The DI box’s low-cut switch turns the sound down about 6 dB at 80 Hz. Why not switch it on by habit?',
    options: ['It adds about 6 dB of hum to the signal right at 80 Hz', 'It only works when phantom power is off', 'The bass’s lowest notes sit well below 80 Hz'],
    correct: 'The bass’s lowest notes sit well below 80 Hz',
    explain: 'A low E is about 41 Hz, a low B about 31 Hz. A filter at 80 Hz already turns those down. Use it only for a diagnosed rumble, checking the lowest notes and the PA.',
    why: {
      'It adds about 6 dB of hum to the signal right at 80 Hz': 'A low-cut REMOVES level; it adds nothing.',
      'It only works when phantom power is off': 'The switch is unrelated to phantom; the issue is the bass’s lowest notes.',
    },
  },
  {
    id: 'ba.two.1',
    page: 'twoMic',
    prompt: 'You blend the cabinet mic with the DI and the low notes hollow out. What do you try first?',
    options: ['Turn the DI up until the lows come fully back again', 'Each alone, then mono; move or rebalance, then polarity', 'Boost the lows on the mic channel, then leave the blend as it is'],
    correct: 'Each alone, then mono; move or rebalance, then polarity',
    explain: 'The DI arrives first; the mic hears the speaker after the sound crosses the air, shaped by the head and the cabinet on the way. Judge each alone and the blend in mono; move or rebalance, then try polarity both ways.',
    why: {
      'Turn the DI up until the lows come fully back again': 'More of one path does not undo a cancellation between them.',
      'Boost the lows on the mic channel, then leave the blend as it is': 'EQ cannot fill a notch made by two paths cancelling.',
    },
  },
  {
    id: 'ba.two.2',
    page: 'twoMic',
    prompt: 'You flip the DI’s polarity. What happens to the time the mic arrives after the DI?',
    options: ['It drops to zero, so the two arrivals now line up exactly', 'Nothing — polarity flips the sign, not the timing', 'It doubles, because the DI is now inverted'],
    correct: 'Nothing — polarity flips the sign, not the timing',
    explain: 'Only moving the mic changes when its sound arrives. Polarity moves the notches; in a fixed studio setup, delaying the DI can line the two up — but no single delay fixes every frequency.',
    why: {
      'It drops to zero, so the two arrivals now line up exactly': 'The mic is still the same distance from the woofer: the delay stays.',
      'It doubles, because the DI is now inverted': 'Polarity has no time in it.',
    },
  },
  {
    id: 'ba.two.3',
    page: 'twoMic',
    prompt: 'The bassist uses a fuzz pedal BEFORE the DI box. What does the DI carry?',
    options: ['The dry bass, with the fuzz automatically taken back out of it', 'The fuzz, but not the head, the cabinet or the room', 'The full sound of the cabinet, fuzz and all'],
    correct: 'The fuzz, but not the head, the cabinet or the room',
    explain: 'A DI carries whatever comes before it. With pedals in front it is no longer dry; it still has no head, speaker or room in it. Label it for what it carries.',
    why: {
      'The dry bass, with the fuzz automatically taken back out of it': 'A DI cannot remove an effect that comes before it.',
      'The full sound of the cabinet, fuzz and all': 'It never passes through the head, the cabinet or the room.',
    },
  },
  {
    id: 'ba.prac.gain',
    page: 'practice',
    prompt: 'The bassist’s slap pops light the overload on the mic channel; the fingerstyle verses do not. What do you do?',
    options: ['Pull the channel fader down until the slap pops sound clean again', 'Lower the input gain, or use a pad its manual allows, and re-check', 'Ask the bassist to play the pops more softly for the show'],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set the gain with headroom for the hardest notes the player really plays — and check the DI channel too: an active bass can overload it before the speaker distorts.',
    why: {
      'Pull the channel fader down until the slap pops sound clean again': 'The overload is at the input, before the fader.',
      'Ask the bassist to play the pops more softly for the show': 'Set the gain for the playing the part needs.',
    },
  },
  {
    id: 'ba.prac.3',
    page: 'practice',
    prompt: 'You have a good DI. What would justify adding the cabinet mic as well?',
    options: ['Two channels simply give the mixer a lot more to work with later on', 'The bass needs more level in the mix than the DI can give', 'It adds character the DI lacks, and the blend holds up in mono'],
    correct: 'It adds character the DI lacks, and the blend holds up in mono',
    explain: 'The mic should earn its place: the cabinet’s character, checked against the DI alone and in the blend, in mono. On a loud stage it may add more spill than character.',
    why: {
      'Two channels simply give the mixer a lot more to work with later on': 'More channels also add spill and interactions; the second must improve the result.',
      'The bass needs more level in the mix than the DI can give': 'Level comes from gain and the fader, not another source.',
    },
  },
  {
    id: 'ba.mix.1',
    page: 'practice',
    prompt: 'A starting point says “10–45 cm (4–18 in)”. Before you place the mic, what else do you need to know?',
    options: ['The cabinet’s brand, so the number matches its drivers', 'Nothing more: the number on its own places the mic', 'Which woofer, and that it is measured from the grille'],
    correct: 'Which woofer, and that it is measured from the grille',
    explain: 'A distance belongs to its reference — the grille — and to the woofer you chose. Clearance is a separate check.',
    why: {
      'The cabinet’s brand, so the number matches its drivers': 'The reference is the grille in front of the chosen woofer; a brand changes nothing.',
      'Nothing more: the number on its own places the mic': 'Without the woofer and the reference the number places nothing.',
    },
  },
  {
    id: 'ba.mix.2',
    page: 'practice',
    prompt: 'You are not sure whether a jack on the head is a speaker output or a line output. What now?',
    options: ['Try it into a spare desk input at a low level and just listen', 'Use an instrument cable, which works for either', 'Stop patching, and check the manual or ask a technician'],
    correct: 'Stop patching, and check the manual or ask a technician',
    explain: 'An uncertain connector is a stop condition. Speaker outputs carry high power and need a speaker; read the model’s manual, or ask a qualified technician.',
    why: {
      'Try it into a spare desk input at a low level and just listen': 'If it is a speaker output, the connection itself is the danger, at any level.',
      'Use an instrument cable, which works for either': 'An instrument cable is not a speaker cable; the question is what the jack is.',
    },
  },
  {
    id: 'ba.mix.3',
    page: 'practice',
    prompt: 'Which change removes the arrival-time difference between the cabinet mic and the DI itself?',
    options: ['Delaying the DI to line up with the mic', 'Flipping the polarity switch on the DI channel', 'Turning the mic up until it matches the DI'],
    correct: 'Delaying the DI to line up with the mic',
    explain: 'Only the paths — or a deliberate delay — set the timing. Moving the mic closer only shrinks the gap: the speaker and the amp add their own lag. Polarity moves the notches; level changes their depth.',
    why: {
      'Flipping the polarity switch on the DI channel': 'Polarity flips the sign; the delay stays.',
      'Turning the mic up until it matches the DI': 'Level changes the depth of the notches, not the delay.',
    },
  },
];

const symptoms: Symptom[] = [
  {
    id: 's.hum',
    observation: 'Hum or buzz on the DI channel',
    firstChecks: 'Is it a cable, a shared power circuit, or the DI’s audio ground? Swap one cable at a time; then try the DI’s ground-lift switch, as its manual describes.',
    options: ['Swap one cable at a time, then try the DI’s ground lift', 'Pull the earth pin off the amp’s mains plug to break the loop', 'Turn the DI channel up so the bass playing covers the hum'],
    correct: 'Swap one cable at a time, then try the DI’s ground lift',
    explain: 'A DI’s ground-lift switch breaks only the audio ground at its XLR output; the amp’s mains earth stays connected. If one cable at a time and the lift do not cure it, stop and get a qualified technician.',
    why: {
      'Pull the earth pin off the amp’s mains plug to break the loop': 'Never. The mains earth is the safety path that stops a fault becoming a shock. Only a qualified technician deals with mains wiring.',
      'Turn the DI channel up so the bass playing covers the hum': 'More gain raises the hum with the instrument.',
    },
  },
  {
    id: 's.dull',
    observation: 'The bass mic sounds dull in the mix',
    firstChecks: 'Is the capsule toward the cone’s edge, or off the woofer? Move toward the dust cap’s edge; judge it with the band.',
    options: ['Toward the cap’s edge on the woofer; judge it with the band', 'Add treble on the channel before touching the mic at all', 'Move the mic over to the middle of the grille, between the woofers'],
    correct: 'Toward the cap’s edge on the woofer; judge it with the band',
    explain: 'Return toward the dust cap’s edge of the chosen woofer and listen with the band — a bass that sounds fine alone can vanish in the mix.',
    why: {
      'Add treble on the channel before touching the mic at all': 'Placement first: EQ cannot restore what the mic is not hearing.',
      'Move the mic over to the middle of the grille, between the woofers': 'Between woofers the arrivals can cancel. Stay on one.',
    },
  },
  {
    id: 's.clank',
    observation: 'Clank or fizz',
    firstChecks: 'Is the capsule near the centre, or near the horn? Shift outward or change the angle; compare with the player’s tone.',
    options: ['Shift outward or change the angle, away from the horn', 'Boost the top end on the channel so the notes cut through better', 'Aim the mic right into the horn for clarity'],
    correct: 'Shift outward or change the angle, away from the horn',
    explain: 'The centre and the horn tend to exaggerate clank and hiss. Slide outward or angle the mic, then compare with what the player hears from the rig.',
    why: {
      'Boost the top end on the channel so the notes cut through better': 'That makes the clank louder.',
      'Aim the mic right into the horn for clarity': 'The horn tends to add hiss and clank; it is optional.',
    },
  },
  {
    id: 's.hollow',
    observation: 'The mic and DI blend sounds hollow',
    firstChecks: 'Do the paths differ in time, polarity or filtering? Solo each, mono-sum; move or rebalance, then try polarity or timing.',
    options: ['Solo each, mono-sum; move or rebalance, then polarity', 'Turn both channels up together until the low end fills right out', 'Low-cut the DI so the two no longer overlap at all'],
    correct: 'Solo each, mono-sum; move or rebalance, then polarity',
    explain: 'Judge the paths alone and together, in mono, at matched levels — then move the mic or rebalance, and try polarity (or, in a fixed studio setup, a delay on the DI).',
    why: {
      'Turn both channels up together until the low end fills right out': 'More level does not fix a cancellation.',
      'Low-cut the DI so the two no longer overlap at all': 'That removes the DI’s low end — often the very reason to use it.',
    },
  },
  {
    id: 's.uneven',
    observation: 'Some low notes are much louder or quieter than others',
    firstChecks: 'Is it the cabinet, the room, the mic position or a monitor? Compare notes, move the cabinet or mic, and check the DI on its own.',
    options: ['Compare notes, move mic or cabinet, check the DI alone', 'Boost the quiet notes with a narrow EQ and move on', 'Turn the whole bass up so the quiet notes come through'],
    correct: 'Compare notes, move mic or cabinet, check the DI alone',
    explain: 'If the DI is even and the mic is not, the room or the position is the cause: move the mic, or the cabinet, and compare again.',
    why: {
      'Boost the quiet notes with a narrow EQ and move on': 'A room or position problem moves when the player moves; find the cause first.',
      'Turn the whole bass up so the quiet notes come through': 'The loud notes get louder too — the unevenness stays.',
    },
  },
  {
    id: 's.didist',
    observation: 'The DI channel distorts',
    firstChecks: 'Is an active bass or a pedal overloading the DI or the input? Check the DI’s pad, the bass’s output and the meter, by the DI’s manual.',
    options: ['Check the DI’s pad, the bass’s output and the input meter', 'Blame the speaker and move the cabinet mic instead', 'Turn the bass amp down on stage until the distortion has gone away'],
    correct: 'Check the DI’s pad, the bass’s output and the input meter',
    explain: 'An active, high-output bass can overload a DI or the desk input. Use the DI’s pad as its manual describes, and set the gain with headroom.',
    why: {
      'Blame the speaker and move the cabinet mic instead': 'The DI hears no speaker: its distortion is electrical.',
      'Turn the bass amp down on stage until the distortion has gone away': 'The amp is after the DI box; its level does not reach the DI’s input.',
    },
  },
  {
    id: 's.spill',
    observation: 'Stage spill dominates the bass mic',
    firstChecks: 'Is the mic far from the woofer, or near the drums? Go close, use the pattern’s rejection, and lean on the DI as needed.',
    options: ['Go close, use the rejection, and lean on the DI as needed', 'Move the mic farther back so it hears more of the whole cabinet', 'Turn the bass amp up until it covers the drums'],
    correct: 'Go close, use the rejection, and lean on the DI as needed',
    explain: 'Close and directional favours the woofer over the stage; the DI carries the dependable low end where the mic cannot.',
    why: {
      'Move the mic farther back so it hears more of the whole cabinet': 'Farther back it hears MORE stage, not less.',
      'Turn the bass amp up until it covers the drums': 'That raises everyone’s exposure and spills into every other mic.',
    },
  },
  {
    id: 's.load',
    observation: 'You are unsure whether a jack is speaker level, or what load the head needs',
    firstChecks: 'Stop patching; consult the exact model’s manual or a qualified technician.',
    options: ['Stop patching, then the manual or a technician', 'Plug it into the desk at low gain and listen', 'Run the head without its cabinet connected, to find out'],
    correct: 'Stop patching, then the manual or a technician',
    explain: 'An uncertain speaker connection or load is a stop condition. Some heads need their speaker connected whenever they are on.',
    why: {
      'Plug it into the desk at low gain and listen': 'If it is a speaker output the connection itself is the danger.',
      'Run the head without its cabinet connected, to find out': 'Some heads can be damaged running without their load.',
    },
  },
];

const orderTasks: OrderTask[] = [
  {
    id: 'ba.prac.order',
    page: 'practice',
    prompt: 'Tap the steps of a mic-and-DI bass setup in the order you would do them.',
    steps: [
      { text: 'Ask the bassist to set up as they will really play, and note the head’s DI options', early: 'Start with the player and the rig.' },
      { text: 'With levels at zero, connect the DI box: bass in, THRU to the head, its output to the desk', early: 'Connect only once you know the rig — and with every level down.' },
      { text: 'With the head off or muted, choose one woofer and place the mic on a stand, clear of the grille', early: 'Place the mic once the DI is safely in the chain.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom where it is needed', early: 'Power comes after everything is connected — outputs muted first.' },
      { text: 'Set each input’s gain on the hardest notes, with headroom', early: 'Gain is set once the sources are connected and powered.' },
      { text: 'Hear the mic and the DI alone, then together in mono; move, rebalance, then try polarity', early: 'Blend only once each channel is set.' },
      { text: 'Label each channel for what it carries, and write down the setup', early: 'Document last.' },
    ],
    explain: 'A sensible order. Make and break connections with levels at zero; switch phantom with the outputs muted; follow each device’s own manual; keep the head’s speaker connection exactly as it is.',
  },
];

const POWER_REASON: SetupReason = { id: 'r.power', label: 'Every mic and DI gets the power it needs (phantom, or none)', role: 'required', feedback: 'Say how each source is powered.' };
const DOC_REASON: SetupReason = { id: 'r.doc', label: 'The mic is at a recommended starting point on one woofer, measured from the grille', role: 'required', feedback: 'Say where it begins and what it is measured from.' };
const LABEL_REASON: SetupReason = { id: 'r.label', label: 'The DI and the mic are labelled as separate sources and checked in mono', role: 'required', feedback: 'Name each source for what it carries, and judge the blend in mono.' };
const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most bassists use', role: 'wrong', feedback: 'A brand is not part of passing.' };
const BASS_REASON: SetupReason = { id: 'r.lows', label: 'It will give the most low end of any setup', role: 'wrong', feedback: 'No setup gives the most low end on every rig; it is not a passing reason.' };

const setupTasks: SetupTask[] = [
  {
    id: 'ba.prac.setup1',
    page: 'practice',
    brief: 'BRIEF 1 · A loud club, a bass head on a 4 × 10 cabinet, the drums close by. Two inputs; phantom power is available.',
    setups: [
      { id: 'a', label: 'A DI box before the head, plus a low-frequency dynamic close on one woofer', ok: true, power: 'phantom', feedback: 'The DI carries the dependable lows; the close mic adds the cabinet. The DI box gets its phantom.' },
      { id: 'b', label: 'The head’s own DI output, plus a dynamic close on one woofer', ok: true, power: 'none', feedback: 'Also fair — once the manual says what PRE or POST includes; label it so.' },
      { id: 'c', label: 'Two mics, one 60–100 cm back for the room', ok: false, power: 'phantom', feedback: 'On a loud stage a far mic hears the drums and the PA; no DI to lean on.' },
      { id: 'd', label: 'The head’s speaker output into a desk input', ok: false, power: 'none', feedback: 'Never: a speaker output goes only to a speaker.' },
      { id: 'e', label: 'One mic in the middle of the grille, between the four woofers', ok: false, power: 'none', feedback: 'Between woofers the arrivals can cancel; and there is no DI for the low end.' },
    ],
    reasons: [DOC_REASON, LABEL_REASON, POWER_REASON, { id: 'r.spill', label: 'The DI carries no stage spill; the close mic rejects some', role: 'optional', feedback: 'A fair live reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'More than one setup passes. What passes is the reasoning: separate, labelled sources, a sensible mic position on one woofer, power to match, a mono check.',
  },
  {
    id: 'ba.prac.setup2',
    page: 'practice',
    brief: 'BRIEF 2 · A studio with a good room; a fretless player wants the cabinet’s character. Three inputs; NO phantom power; the only DI box needs phantom.',
    setups: [
      { id: 'a', label: 'The head’s own DI output, a dynamic close on one woofer, a second dynamic 60–100 cm back', ok: true, power: 'none', feedback: 'Three labelled sources, no phantom needed; the far mic only if the room helps, checked in mono.' },
      { id: 'b', label: 'The head’s own DI output and a dynamic 10–45 cm from one woofer', ok: true, power: 'none', feedback: 'Room to breathe for the cabinet, and a direct path for consistency.' },
      { id: 'c', label: 'The DI box before the head, and a dynamic close in', ok: false, power: 'phantom', feedback: 'This DI box needs phantom power, and there is none.' },
      { id: 'd', label: 'A small condenser 60–100 cm back as the only source', ok: false, power: 'phantom', feedback: 'No phantom for the condenser — and a far mic alone gives little control.' },
      { id: 'e', label: 'A dynamic pressed against the grille on the horn', ok: false, power: 'none', feedback: 'Off the cloth; and the horn alone misses the body the player wants.' },
    ],
    reasons: [DOC_REASON, LABEL_REASON, POWER_REASON, { id: 'r.room', label: 'The room is good enough to be worth a farther mic', role: 'optional', feedback: 'A fair studio reason.' }, BRAND_REASON, BASS_REASON],
    explain: 'Two setups pass. What passes is the reasoning: sources that work without phantom, one woofer, labelled paths, a mono check.',
  },
];

const predictions: Lesson['predictions'] = {
  sound: { prompt: 'Before you begin: which pickup will sense the bass’s lowest note — the fundamental — more strongly?', options: ['The neck pickup', 'The bridge pickup', 'They sense it equally'], after: 'Now step HARMONIC and switch PICKUP, and watch the first bar.' },
  microphone: { prompt: 'Before you move anything: where will a cardioid pick up LEAST?', options: ['Straight behind it (180°)', 'At its sides (90°)', 'Toward the rear, off to one side'], after: 'Now sweep SOURCE ANGLE round the back and watch PICKUP.' },
  placement: { prompt: 'Predict: you move the mic from 5 cm to 30 cm, on the same woofer. What changes most?', options: ['More cabinet and room', 'More upper-mid bite', 'Nothing much'], after: 'Rest the mic in two zones and read what each one suggests you listen for.' },
  context: { prompt: 'Where will this cardioid reject the bassist’s wedge best?', options: ['Straight behind the mic', 'At the sides of the mic', 'In front of the mic'], after: 'Now turn the mic with AIM (or change PATTERN) and watch IN REJECTION.' },
  twoMic: { prompt: 'If you flip the DI’s polarity, what happens to the mic’s delay behind the DI?', options: ['It gets longer', 'It stays the same', 'It goes to zero'], after: 'Flip DI POLARITY both ways, then move the mic. Watch which readout each action changes.' },
};

const diagnostic: DiagnosticItem[] = [
  {
    id: 'q.1',
    covers: 'instrument',
    prompt: 'Which of these is NOT the air from the bass cabinet?',
    options: ['The DI box’s output', 'A mic on one woofer', 'A mic farther back in the room'],
    correct: 'The DI box’s output',
    explain: 'A DI is an electrical tap; both mics hear the cabinet’s air.',
    why: {
      'A mic on one woofer': 'That mic hears the woofer’s air directly.',
      'A mic farther back in the room': 'That mic hears the cabinet’s air and the room.',
    },
  },
  {
    id: 'q.2',
    covers: 'instrument',
    prompt: 'What is the bass cabinet’s small horn for?',
    options: ['The top end: string noise, pick and slap detail', 'The lowest notes, the ones below the woofers’ own range', 'Pushing the bass toward the drummer'],
    correct: 'The top end: string noise, pick and slap detail',
    explain: 'The woofers carry the notes; the horn adds the highest frequencies.',
    why: {
      'The lowest notes, the ones below the woofers’ own range': 'The woofers carry the lows; the horn the highs.',
      'Pushing the bass toward the drummer': 'It is about frequency range, not direction on stage.',
    },
  },
  {
    id: 'q.3',
    covers: 'sound',
    prompt: 'About how low is a four-string bass’s open low E?',
    options: ['About 41 Hz', 'About 82 Hz', 'About 20 Hz'],
    correct: 'About 41 Hz',
    explain: 'E1 is about 41.2 Hz (a five-string’s low B about 30.9 Hz) — check that the mic, the DI and any filter reach it.',
    why: {
      'About 82 Hz': 'That is the guitar’s low E, an octave higher.',
      'About 20 Hz': 'Lower than any standard bass string; the low E is about 41 Hz.',
    },
  },
  {
    id: 'q.4',
    covers: 'sound',
    prompt: 'Close in, a mic toward the edge of a woofer tends to sound…',
    options: ['warmer and smoother than at the centre', 'brighter and more biting than at the centre', 'exactly like the centre at the same distance'],
    correct: 'warmer and smoother than at the centre',
    explain: 'Toward the centre tends to add bite; toward the edge tends to be warmer. Tendencies to check on the real cabinet.',
    why: {
      'brighter and more biting than at the centre': 'It is the CENTRE that tends to add bite.',
      'exactly like the centre at the same distance': 'The spot on the cone changes the balance, even at the same distance.',
    },
  },
  {
    id: 'q.5',
    covers: 'setting',
    critical: true,
    prompt: 'Can the head’s speaker output go into a desk input or an ordinary DI?',
    options: ['No — a speaker output goes only to a speaker', 'Yes, through the DI’s pad', 'Yes, if the head is turned all the way down first'],
    correct: 'No — a speaker output goes only to a speaker',
    explain: 'Speaker outputs carry high power: to a speaker, by a speaker cable, only.',
    why: {
      'Yes, through the DI’s pad': 'A DI’s pad is not made for speaker-level power.',
      'Yes, if the head is turned all the way down first': 'A lower level does not make the connection safe.',
    },
  },
  {
    id: 'q.6',
    covers: 'setting',
    critical: true,
    prompt: 'Your mic is rated for a very high SPL. What does that tell you about standing by a loud bass rig all soundcheck?',
    options: ['Nothing — it is the mic’s distortion limit, not a hearing limit', 'It is safe while the rig stays below the level of the mic’s rating', 'It is safe as long as the mic is closer than you'],
    correct: 'Nothing — it is the mic’s distortion limit, not a hearing limit',
    explain: 'For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the rig stays below the level of the mic’s rating': 'A mic rating is not a hearing limit.',
      'It is safe as long as the mic is closer than you': 'Where the mic sits says nothing about your ears.',
    },
  },
];

export const C08_LESSON: Lesson = {
  id: 'C08',
  labId: 'strings',
  title: 'Electric Bass',
  subtitle: 'Fretted and fretless: one woofer, room to breathe, mic and DI',
  noun: { one: 'bass rig', many: 'bass rigs' },
  model: C08_MODEL,
  micTypeIds: [...C08_MICS],
  zones: C08_ZONES,
  pages,
  scenarios,
  symptoms,
  orderTasks,
  setupTasks,
  predictions,
  orient: [
    { title: 'WHAT IT IS', text: 'A four- or five-string electric bass — fretted, or fretless with a smooth fingerboard — and the rig it plays through: a head (the amplifier) on a cabinet of woofers, often with a small horn. The mic hears the cabinet; a DI takes the electrical signal.', src: 'LESSON L4-L7' },
    { title: 'WHERE YOU MEET IT', text: 'Nearly every band, on stage and in the studio. Live, the bass often reaches the PA through a DI, with a cabinet mic added for its character.', src: 'S-RHYTHM' },
    { title: 'WHAT IT DOES IN THE MUSIC', text: 'The low end and the groove, locked with the kick drum: fingerstyle, pick, slap and pop, fretless slides. The player’s tone is the bass, the pedals, the head AND the cabinet.', src: 'LESSON L7' },
    { title: 'ITS RANGE AND SIZE', text: 'The open low E is about 41 Hz, a five-string’s low B about 31 Hz. A common 4 × 10 cabinet is about 76 cm wide, 61 cm tall and 48 cm deep.', src: 'PHYS-ET / AMP-410' },
  ],
  sound: {
    stages: [
      { title: 'The signal reaches the voice coil', text: 'The head’s signal — the strings’ motion, shaped and made much stronger — flows through each woofer’s voice coil, in its magnet’s gap.' },
      { title: 'The cone moves as one', text: 'At bass pitches the whole cone moves together, like a piston — drawn here many times larger than it really moves. Low notes need the cone to move a lot of air.' },
      { title: 'Push in front, pull behind', text: 'Moving forward, the cone pushes the air in front and pulls the air behind — at the same moment, opposite ways.' },
      { title: 'Sound leaves', text: 'Sound leaves the front through the grille; in a closed cabinet the back of the cone sounds into the box. A port or an open back, where a cabinet has one, lets some of it out.', ported: 'Sound leaves the front through the grille — and, with an open back, the back too, opposite in polarity. Identify the cabinet before treating the front grille as the whole sound.' },
    ],
    attack: 'The pluck, pick or slap reaches the cone first, with the most upper content. A close mic aimed toward the centre of a woofer — or at the horn — tends to hear more of it; so may a DI.',
    body: 'The note itself, deep and sustained, with the cabinet and the room. Toward the edge of the cone, or a little farther back, a mic tends to hear more of it. Tendencies to check, note by note.',
    head: { diameterMm: 254, rods: 0, label: '10 in woofer, face-on', strikeSrc: 'AMP-410' },
  },
  setting: {
    items: [
      { id: 'player', label: 'the bassist and the bass', short: 'BASS', note: 'Fretted or fretless, four or five strings, active or passive pickups, fingers, pick or slap. Ask what they will really play — the quiet and the strongest passages.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'ASK FIRST', scene: 'all' },
      { id: 'pedals', label: 'the pedals at the bassist’s feet', short: 'PEDALS', note: 'Effects the player switches while playing. A DI AFTER them carries the effects; before them, it does not. The pedalboard is the player’s space.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'KEEP CLEAR', scene: 'all' },
      { id: 'dibox', label: 'a DI box before the head', short: 'DI BOX', note: 'The bass goes in; THRU carries it on to the head; a balanced output goes to the desk. Some need 48 V phantom power; check its own manual. An electrical source — never call it a mic.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'amp', label: 'the bass head (the amplifier)', short: 'HEAD', note: 'Shapes and amplifies the signal; its settings are the player’s sound. It reaches the cabinet by a speaker cable — keep that connection as it is.', prov: { kind: 'illustrative', reason: 'a generic signal path and stage position' }, tag: 'THE SOURCE', scene: 'all' },
      { id: 'cab', label: 'the bass cabinet', short: 'CABINET', note: 'Four 10 in woofers and a small horn. The woofers carry the notes; the horn adds the top end. Choose one woofer to mic.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'WHAT A MIC HEARS', scene: 'all' },
      { id: 'mic', label: 'the microphone', short: 'MIC', note: 'An airborne pickup of one woofer, the cabinet and the room. It reaches the desk after the sound crosses the air — later than a DI.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'AIR PATH', scene: 'all' },
      { id: 'desk', label: 'the desk (mixing console)', short: 'DESK', note: 'Each source on its own, labelled channel: “bass DI”, “bass amp DI”, “bass mic”. Gain is set for each.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'GAIN HERE', scene: 'all' },
      { id: 'ampdi', label: 'the head’s own DI output', short: 'HEAD DI', note: 'A balanced output on the head, often with a PRE / POST switch and a pad. Which circuits PRE and POST include is in that head’s manual. Still electrical — not the cabinet’s air.', prov: { kind: 'illustrative', reason: 'a generic signal path' }, tag: 'NOT THE AIR', scene: 'all' },
      { id: 'wedge', label: 'the bassist’s wedge', short: 'WEDGE', note: 'A floor monitor downstage, facing back toward the player — behind a cabinet mic aimed at a woofer.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'MONITOR', scene: 'stage' },
      { id: 'drums', label: 'the drum kit', short: 'DRUMS', note: 'The kick shares the bass’s range. A close, directional mic and the DI keep the two apart in the mix.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'stage' },
      { id: 'otherAmp', label: 'the guitar amp', short: 'GUITAR AMP', note: 'Another loud speaker on the backline. Aim the bass mic’s rejection toward the loudest neighbour where you can.', prov: { kind: 'illustrative', reason: 'a typical stage layout' }, tag: 'SPILL', scene: 'all' },
      { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: 'Low frequencies spread widely: the stage rig is heard in the room. The PA adds what the audience needs.', prov: { kind: 'illustrative', reason: 'direction only' }, tag: 'FRONT SIDE', scene: 'stage' },
      { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a good studio room a farther mic can add size to the bass — once the close mic and the DI are stable.', prov: { kind: 'illustrative', reason: 'a generic room' }, tag: 'ROOM SOUND', scene: 'studio' },
    ],
    stage: 'LIVE: a loud backline, the kick drum close by, wedges and a PA. The DI is often the dependable low-end feed; a stable close mic adds the cabinet with less spill. Agree with the player what they need from the stage rig.',
    studio: 'STUDIO: a close mic and a DI give a reliable comparison; a farther mic can add the room once those are stable. Record the paths separately.',
  },
  diagnostic,
  practice: {
    task: 'Choose a mic-and-DI setup for a given rig and show, describe an alternative, and say what would justify the second channel. With a real rig and the player’s agreement, you can log what you tried below.',
    fields: [
      { id: 'source', label: 'Bass (fretted or fretless, strings), head, cabinet, the player’s settings', kind: 'text' },
      { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['low-frequency dynamic', 'instrument dynamic', 'small condenser', 'other'] },
      { id: 'site', label: 'Which woofer, spot on the cone, distance from the grille', kind: 'text' },
      { id: 'di', label: 'DI: which one, where in the chain, PRE or POST, pad', kind: 'text' },
      { id: 'mono', label: 'Mic and DI alone, together, in mono; polarity', kind: 'text' },
      { id: 'notes', label: 'Speaker connection untouched; hum checked (the DI’s ground lift as its manual says — the mains earth never touched); final choice and its limitation', kind: 'text' },
    ],
  },
  unknowns: [
    { text: 'Whether the cabinet stands on the floor or is raised or tilted: drawn on the floor — no HEIGHT readout.', dims: ['yFloor'] },
    { text: 'The driver and horn layout, the 10 in woofer’s sizes (the 12 in reference × 10/12), the horn’s size and the head on top (330 × 75 × 250): drawing defaults.', dims: [] },
    { text: 'Whether the cabinet has a rear port or open back: drawn closed (drawing default).', dims: [] },
    { text: 'The bass’s dimensions, scale length (34 in) and pickup positions (95 / 210 mm from the bridge): drawing defaults.', dims: [] },
    { text: 'The farther mic’s distance (60–100 cm): a drawing default — the research gives “further away” with no number.', dims: [] },
  ],
  live: {
    wedges: [
      { id: 'bassWedge', label: 'the bassist’s wedge, downstage, facing back toward the player', short: 'WEDGE', p: { x: 1900, y: FLOOR, z: 0 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: 'It sits downstage of the player, behind a mic that faces the cabinet.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
      { id: 'sideFill', label: 'a side-fill monitor at the side of the stage', short: 'SIDE FILL', p: { x: 700, y: FLOOR, z: -1500 }, lift: 150, faces: { x: 0, y: 0, z: 1 }, note: 'Off to the side, about ninety degrees off the mic’s axis: no cardioid null reaches it. Distance, level and the DI do the work there.', prov: { kind: 'illustrative', reason: 'a typical stage layout' } },
    ],
  },
  accuracyDetail:
    'ABOUT THESE STARTING POINTS. After our research, here is where we recommend you begin — ideas and concepts to consider, not rules. Every bass, rig, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: one 4 × 10 cabinet with a horn (its outer size is real; the layout, the woofer sizes and the head are drawing choices), an ideal string, textbook mic patterns, motion drawn larger. Distances are rounded to about 5 mm and measured from the grille to the mic’s front. Make connections with levels at zero, never open an amp, and send a speaker output only to a speaker.',
};
