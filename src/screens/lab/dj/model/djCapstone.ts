/**
 * djCapstone — screen 24's EVENT SCENARIO: a seeded fault (or two) planted
 * in a small event system, and the debrief (cause, evidence, repair,
 * prevention). Pure; pinned by test/djCapstone.test.ts.
 *
 * Every fault here is one the simulation DEMONSTRATES accurately — the meters,
 * the drawing and the sound all show it, and the learner repairs it with the
 * same controls, never by ticking a box. Faults are combined only when they
 * sit in different parts of the system and neither hides the other (two
 * silences on the same channel would leave nothing to find).
 *
 * The scenario is REPRODUCIBLE: the same event number plants the same
 * faults (a seeded mulberry32), so an exercise can be shared and replayed.
 *
 * HINTS NEVER PRINT THE ANSWERS (second reviews 2026-10-18, audio #29,
 * learning 24 #5): a fault's hints are a question to ask of the evidence
 * (`probe`) and where on the rig to look (`where`) — never its debrief
 * text. Its debrief offers WRONG options that are plausible for the SAME
 * symptom (`wrong`, each with why it is wrong), so the right one is found by
 * reasoning from the evidence, not by matching words.
 */
import { BUILT_PLUGS, trimDb, trimPos, xfGainFor, type Booth } from './djModel.ts';
import { recGainDb, recGainPos, withEv } from './djEvent.ts';

export type FaultId = 'CH2_SELECTOR' | 'XF_ASSIGN' | 'MASTER_R' | 'TRIM_HOT' | 'PA_HUM' | 'PHONES_BLEND' | 'REC_NO_MIC' | 'REC_CLIP' | 'MEDIA_FAIL' | 'MIC_DOWN' | 'PA_INPUT_MIC';
export type Subsystem = 'input' | 'assign' | 'output' | 'gain' | 'power' | 'cue' | 'rec' | 'playback' | 'mic';

export type DebriefPart = 'cause' | 'evidence' | 'repair' | 'prevention';
export const DEBRIEF_PARTS: readonly DebriefPart[] = ['cause', 'evidence', 'repair', 'prevention'];

/** A wrong debrief option that fits the symptom, and why the evidence rules it out. */
export type Wrong = { t: string; why: string };

export type FaultDef = {
  id: FaultId;
  subsystem: Subsystem;
  /** What a learner would notice — never the cause. */
  symptom: string;
  /** The words for the debrief. */
  cause: string;
  evidence: string;
  repair: string;
  prevention: string;
  /** Hint 2: a question to ask of the evidence (never the answer). */
  probe: string;
  /** Hint 3: where on the rig to look (never the repair itself). */
  where: string;
  /** Plausible wrong options per debrief part (they fit the symptom). */
  wrong: Record<DebriefPart, readonly Wrong[]>;
  /** Plant it. */
  inject: (b: Booth) => Booth;
  /** The booth shows it repaired. */
  fixed: (b: Booth) => boolean;
};

/** The unsafe "fix", offered as a wrong repair and prevention every time. */
export const EARTH_LIFT_OPTION: Wrong = { t: 'Lift the mains earth on the noisy unit so the hum stops.', why: 'Never: the mains earth is the safety, not the hum’s cure.' };

export const FAULTS: Record<FaultId, FaultDef> = {
  CH2_SELECTOR: {
    id: 'CH2_SELECTOR',
    subsystem: 'input',
    symptom: 'Deck B plays, but nothing of it reaches the mixer.',
    cause: 'CH 2’s input selector was on PHONO, where nothing is plugged in.',
    evidence: 'Deck B was playing, but the CH 2 meter stayed dark — the signal died at the channel’s input.',
    repair: 'Set CH 2’s input selector back to LINE.',
    prevention: 'Check every channel’s selector against the input list during the line check.',
    probe: 'Deck B is playing — does the CH 2 meter move? If not, what is CH 2 listening to?',
    where: 'Open MIXER and read CH 2’s row from the left.',
    wrong: {
      cause: [
        { t: 'CH 2’s fader was down.', why: 'On this mixer, as on most, the channel meter reads BEFORE the fader: with the fader down it still moves. Here the meter itself was dark.' },
        { t: 'Deck B’s cables had come out of the mixer.', why: 'That would darken the meter too — but the cables were in, and the channel came back the moment its input was right.' },
      ],
      evidence: [
        { t: 'The MASTER meters moved, but the room stayed silent.', why: 'That puts the loss after the mixer. Here CH 2’s own meter was dark.' },
        { t: 'Deck B’s screen showed FILE ERROR.', why: 'Deck B was playing normally; it was the channel that was not listening.' },
      ],
      repair: [
        { t: 'Turn CH 2’s TRIM right up.', why: 'Gain cannot raise a signal that never reaches the channel.' },
        { t: 'Move deck B’s cables into CH 1.', why: 'That moves the problem and takes deck A off its channel.' },
      ],
      prevention: [
        { t: 'Leave every TRIM fully up so quiet sources still come through.', why: 'That clips the loud ones, and does nothing for a wrong input.' },
        { t: 'Test the PA before the doors open.', why: 'Worth doing, but it would not catch a channel listening to the wrong input.' },
      ],
    },
    inject: (b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], input: 'PHONO' } } }),
    fixed: (b) => b.ch[2].input === 'LINE',
  },
  XF_ASSIGN: {
    id: 'XF_ASSIGN',
    subsystem: 'assign',
    symptom: 'CH 2 meters fine, but bringing its fader up adds nothing to the room.',
    cause: 'CH 2 was assigned to crossfader side A while the crossfader sat over at side B.',
    evidence: 'The CH 2 meter was live and its fader up, but the MASTER meter did not move — the loss was after the channel fader.',
    repair: 'Put CH 2’s crossfader assign on THRU (or centre the crossfader).',
    prevention: 'Park the crossfader assigns and the crossfader where you expect them before the doors open.',
    probe: 'Which meter is the LAST one that moves when you raise FADER 2?',
    where: 'Look at what sits between the channel fader and the mix: the crossfader and each channel’s assign.',
    wrong: {
      cause: [
        { t: 'CH 2’s channel fader was broken.', why: 'Possible, but rare: the assign and the crossfader sat against the channel, and setting them right brought it straight in.' },
        { t: 'The MASTER was turned down.', why: 'Then deck A would have gone quiet too — the room still heard CH 1.' },
        { t: 'CH 2’s selector was on PHONO.', why: 'Then the CH 2 meter would be dark. It was live.' },
      ],
      evidence: [
        { t: 'The CH 2 meter stayed dark while deck B played.', why: 'That points at the input. Here the CH 2 meter was live.' },
        { t: 'Both MASTER meters moved, but PA R stayed silent.', why: 'That points past the MASTER meters — the output stage or the cable. Here CH 2 never reached the MASTER.' },
      ],
      repair: [
        { t: 'Push CH 2’s TRIM up until it comes through.', why: 'TRIM is before the fader and the crossfader: a channel sent to the closed side stays silent at any gain.' },
        { t: 'Unplug and replug deck B’s cables.', why: 'The cables were fine — the channel meter showed the signal arriving.' },
      ],
      prevention: [
        { t: 'Set the crossfader curve to its sharpest setting.', why: 'The curve shapes the blend; it does not decide which side a channel is on.' },
        { t: 'Keep CH 2’s fader up between mixes.', why: 'That puts the cued deck on air; it does nothing for the assign.' },
      ],
    },
    inject: (b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], xf: 'A' } }, mixer: { ...b.mixer, xf: 1 } }),
    fixed: (b) => xfGainFor(b.ch[2].xf, b.mixer.xf, b.mixer.xfCurve) > 0.7,
  },
  MASTER_R: {
    id: 'MASTER_R',
    subsystem: 'output',
    symptom: 'The music sounds thin and one-sided from the floor.',
    cause: 'The MASTER R cable had come out of PA R.',
    evidence: 'PA L was making sound and PA R was silent — and at PA R’s input the MASTER R cable was hanging loose. The MASTER meters read before the output stage, so they could not prove the side left the mixer; the unplugged cable did.',
    repair: 'Turn the MASTER down, plug MASTER R back into PA R, bring the MASTER up again.',
    prevention: 'Dress and secure the output cables so a foot or a bag cannot pull them; check both sides in the line check.',
    probe: 'Both MASTER meters move — so which speaker is actually making sound?',
    where: 'Follow the board after the MIX, side by side, to the speakers.',
    wrong: {
      cause: [
        { t: 'The track was mixed mostly in the left channel.', why: 'Then the MASTER R meter would read low. Both MASTER meters were live.' },
        { t: 'The mixer’s MASTER R output had failed.', why: 'The MASTER R cable was unplugged at PA R — plugging it back in brought the right side back. (A live MASTER R meter alone could not rule the output out: it reads before the output stage.)' },
      ],
      evidence: [
        { t: 'The MASTER R meter stayed dark.', why: 'It was live — but it reads before the output stage. The proof was at PA R: its cable was unplugged.' },
        { t: 'CH 1 and CH 2 each played only one side.', why: 'The channel meters were normal; the loss came after the MASTER.' },
      ],
      repair: [
        { t: 'Pan everything to the left so the room hears it all.', why: 'That hides the fault and leaves half the PA silent.' },
        { t: 'Turn the MASTER up until it sounds full.', why: 'Louder through one speaker is still one-sided — and the cable is still out.' },
      ],
      prevention: [
        { t: 'Run the whole set in mono.', why: 'Mono would hide a missing side; it does not stop a cable being pulled.' },
        { t: 'Keep the MASTER lower all night.', why: 'Level has nothing to do with a cable coming out.' },
      ],
    },
    inject: (b) => ({ ...b, plugs: { ...b.plugs, 'mst.xlrR': null } }),
    fixed: (b) => b.plugs['mst.xlrR'] === BUILT_PLUGS['mst.xlrR'],
  },
  TRIM_HOT: {
    id: 'TRIM_HOT',
    subsystem: 'gain',
    symptom: 'Deck A sounds harsh and crunchy, however low the MASTER is.',
    cause: 'CH 1’s TRIM was turned right up, so the channel itself was clipping.',
    evidence: 'The CH 1 meter sat in the red while the MASTER was low — the distortion started at the channel.',
    repair: 'Bring TRIM 1 down until the CH 1 meter averages with CH 2 and never reaches CLIP.',
    prevention: 'Set each channel’s gain on its meter by its average level while you cue it, before it goes on air.',
    probe: 'Where is the FIRST meter in the chain that reaches the red?',
    where: 'Open MIXER: the first gain stage of the channel that crunches.',
    wrong: {
      cause: [
        { t: 'The MASTER was clipping.', why: 'Lowering the MASTER would have cleaned it. It stayed crunchy because the channel clipped first.' },
        { t: 'The PA speakers were overdriven.', why: 'The CH 1 meter was in the red before the PA — the crunch started at the channel.' },
        { t: 'The track file itself is distorted.', why: 'Possible — but with TRIM 1 down the same track came out clean.' },
      ],
      evidence: [
        { t: 'The MASTER meters were in the red while CH 1 looked normal.', why: 'That would point at the MASTER. Here CH 1 itself was in the red.' },
        { t: 'Only the left side of the room crunched.', why: 'A channel fault is in both sides, and so it was.' },
      ],
      repair: [
        { t: 'Turn the MASTER down until the crunch stops.', why: 'It was already low: the clip happens before the MASTER, so it stays in the sound.' },
        { t: 'Pull CH 1’s fader down a little.', why: 'The fader comes after TRIM: the channel still clips, just more quietly.' },
      ],
      prevention: [
        { t: 'Keep the MASTER low all night as a safety margin.', why: 'A low MASTER cannot undo clipping that happens earlier, at the channel.' },
        { t: 'Cut the harsh top end with the EQ.', why: 'EQ hides the symptom; set the gain right instead.' },
      ],
    },
    inject: (b) => ({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], trim: trimPos(12) } } }),
    fixed: (b) => trimDb(b.ch[1].trim) <= 3,
  },
  PA_HUM: {
    id: 'PA_HUM',
    subsystem: 'power',
    symptom: 'A steady hum comes from the left of the room, even between tracks.',
    cause: 'PA L was on another circuit: the MASTER L shield (pin 1) closed a ground loop, and PA L’s input let it in (a pin-1 problem).',
    evidence: 'The hum was in the crowd but not in the booth monitors or the headphones, and only on the left — so it entered after the mixer.',
    repair: 'Power PA L from the booth’s own strip (or put an isolation transformer in the MASTER L line). Never remove the mains earth.',
    prevention: 'Power the whole rig from one distribution point; carry an isolation transformer for the line that hums.',
    probe: 'Is the hum in the booth and the headphones too — or only in one speaker?',
    where: 'Look at the power row: where is each speaker plugged in?',
    wrong: {
      cause: [
        { t: 'Deck A’s cables were picking up hum.', why: 'Then the hum would be on CH 1, in the booth and in the headphones. It was only in the room’s left.' },
        { t: 'The mixer’s power supply was failing.', why: 'Then everything the mixer feeds would hum — booth, phones and both sides.' },
      ],
      evidence: [
        { t: 'The hum was in the headphones and the booth as well.', why: 'That would point at the mixer or a source. Here only PA L hummed.' },
        { t: 'The CH 1 meter showed the hum between tracks.', why: 'The channel meters were quiet between tracks: the hum entered after the mixer.' },
      ],
      repair: [
        { t: 'Turn PA L down until the hum is quieter.', why: 'Quieter hum, quieter music: the loop is still there.' },
        { t: 'Swap the MASTER L and MASTER R cables.', why: 'The hum stays with the speaker on the other circuit, whichever side feeds it.' },
      ],
      prevention: [
        { t: 'Use shorter MASTER cables.', why: 'Length is not the cause: two earths on different circuits are.' },
        { t: 'Keep the PA’s level knobs low.', why: 'That lowers the hum and the music together.' },
      ],
    },
    inject: (b) => withEv(b, (ev) => ({ ...ev, paLWall: true, paLIsolator: false })),
    fixed: (b) => !b.ev?.paLWall || !!b.ev?.paLIsolator,
  },
  PHONES_BLEND: {
    id: 'PHONES_BLEND',
    subsystem: 'cue',
    symptom: 'Your headphones only ever play what the crowd hears — the cued deck never comes through.',
    cause: 'The headphone CUE ↔ MASTER blend was turned all the way to MASTER.',
    evidence: 'The cued deck’s CUE was on and its channel meter live, but the headphones followed the MASTER — the cue bus was blended out.',
    repair: 'Turn the blend back toward CUE (or use split cue).',
    prevention: 'Check the headphone section — blend, split, level — during the line check.',
    probe: 'CUE is on and the channel meter is live — so what decides how much of the cue reaches your ears?',
    where: 'Open MIXER: the HEADPHONES row.',
    wrong: {
      cause: [
        { t: 'CUE 2 was not pressed.', why: 'CUE was on and the channel meter live; the cue bus itself was blended out.' },
        { t: 'The headphones were in the wrong jack.', why: 'Then you would hear nothing. You heard the MASTER clearly.' },
      ],
      evidence: [
        { t: 'The headphones were silent.', why: 'They played the MASTER — only the cue side was missing.' },
        { t: 'The CH 2 meter was dark while it was cued.', why: 'It was live: the signal reached the channel and its CUE.' },
      ],
      repair: [
        { t: 'Turn the headphone LEVEL up.', why: 'A louder MASTER is still only the MASTER.' },
        { t: 'Press CUE 1 as well.', why: 'More cues into a bus that is blended out still give nothing.' },
      ],
      prevention: [
        { t: 'Keep the booth monitors loud so you can cue from them.', why: 'The booth plays the crowd’s mix; cueing needs the private cue bus.' },
        { t: 'Always cue with the channel fader half up.', why: 'That puts the cued deck in the room — the opposite of private.' },
      ],
    },
    inject: (b) => ({ ...b, mixer: { ...b.mixer, cueMix: 1, splitCue: false } }),
    fixed: (b) => b.mixer.cueMix < 0.5 || b.mixer.splitCue,
  },
  REC_NO_MIC: {
    id: 'REC_NO_MIC',
    subsystem: 'rec',
    symptom: 'The room hears the announcement; the recording will not.',
    cause: 'The mic’s send to the record output was switched off.',
    evidence: 'During the announcement the CROWD carried the voice, but the recorder’s VOICE reading stayed at none.',
    repair: 'Switch MIC → REC on (or record from a feed that carries the mic).',
    prevention: 'Make a short test recording with music AND a voice, and play it back, before the event.',
    probe: 'During the announcement, which feeds carry the voice — and which does not?',
    where: 'Look at the mic channel’s card: where is the mic sent?',
    wrong: {
      cause: [
        { t: 'The mic channel was OFF.', why: 'Then the room would not hear it either. The room did.' },
        { t: 'The recorder’s input gain was too low.', why: 'The music was in the take at a good level; only the voice was missing.' },
      ],
      evidence: [
        { t: 'Nobody in the room could hear the announcement.', why: 'The CROWD carried the voice; only the recording missed it.' },
        { t: 'The recorder’s meters stayed dark.', why: 'They moved with the music; only the voice was absent.' },
      ],
      repair: [
        { t: 'Turn the mic’s GAIN up.', why: 'The room already heard it: at any gain, a mic not sent to REC is not in the recording.' },
        { t: 'Move the recorder to the BOOTH OUT.', why: 'The mic is not in the booth send either here — the send is the repair.' },
      ],
      prevention: [
        { t: 'Turn the mic up for announcements.', why: 'Louder in the room says nothing about the recording.' },
        { t: 'Record from the MASTER output.', why: 'It may carry the mic, but it rides the MASTER knob — test what you record instead.' },
      ],
    },
    inject: (b) => withEv(b, (ev) => ({ ...ev, mic: { ...ev.mic, toRec: false } })),
    fixed: (b) => !!b.ev?.mic.toRec,
  },
  REC_CLIP: {
    id: 'REC_CLIP',
    subsystem: 'rec',
    symptom: 'The room sounds clean, but the recorder’s CLIP light keeps flashing.',
    cause: 'The recorder’s own input gain was turned far up.',
    evidence: 'The MASTER meters were fine while the recorder’s meters hit CLIP — the overload was in the recorder.',
    repair: 'Turn the RECORDER’s input gain down until its peaks stay below about −6 dBFS. Leave the MASTER alone.',
    prevention: 'Set the recorder’s level on the loudest part of a test, with headroom.',
    probe: 'Which meters are in the red: the MASTER’s, or the recorder’s own?',
    where: 'The recorder has a gain of its own (EVENT tray).',
    wrong: {
      cause: [
        { t: 'The MASTER was too hot.', why: 'The MASTER meters were fine — and REC OUT is taken before the MASTER anyway.' },
        { t: 'The mixer’s REC OUT was faulty.', why: 'Turning the recorder’s own gain down cleaned it: the overload was in the recorder.' },
      ],
      evidence: [
        { t: 'The MASTER meters were in the red.', why: 'They were fine; the recorder’s were not.' },
        { t: 'The room sounded distorted.', why: 'The room was clean — the overload was only in the recorder.' },
      ],
      repair: [
        { t: 'Turn the MASTER down.', why: 'REC OUT is a fixed copy before the MASTER: the recording would not change.' },
        { t: 'Pull both channel faders down.', why: 'That changes the room too — and the recorder’s own gain is still too high.' },
      ],
      prevention: [
        { t: 'Record with the recorder’s AUTO LEVEL on.', why: 'Auto level pumps the mix up and down; set the level yourself, with headroom.' },
        { t: 'Set the gain so the loudest part just touches 0 dBFS.', why: '0 dBFS is the clip point: leave headroom.' },
      ],
    },
    inject: (b) => withEv(b, (ev) => ({ ...ev, rec: { ...ev.rec, gain: recGainPos(18) } })),
    fixed: (b) => !!b.ev && recGainDb(b.ev.rec.gain) <= 6,
  },
  MEDIA_FAIL: {
    id: 'MEDIA_FAIL',
    subsystem: 'playback',
    symptom: 'Deck B shows FILE ERROR on the next track.',
    cause: 'The file on the USB stick was damaged.',
    evidence: 'Deck B refused the file — the failure was in the media, before any cable or channel.',
    repair: 'Load the same track from the backup stick (or play another track) and carry on.',
    prevention: 'Carry a tested backup copy of every set, on separate media.',
    probe: 'Where does the failure start: before the mixer, or after it?',
    where: 'Open DECKS: deck B’s next track.',
    wrong: {
      cause: [
        { t: 'Deck B’s cables were loose.', why: 'A cable cannot make a player refuse a file.' },
        { t: 'CH 2’s input selector was wrong.', why: 'The player itself showed the error, before the mixer.' },
      ],
      evidence: [
        { t: 'The CH 2 meter stayed dark while deck B played.', why: 'Deck B never played: it refused the file.' },
        { t: 'The MASTER meters dropped out.', why: 'The mixer was fine; the failure was in the media.' },
      ],
      repair: [
        { t: 'Load the same file again until it works.', why: 'That copy is damaged: loading it again gives the same error.' },
        { t: 'Restart the mixer.', why: 'The mixer was not the problem — and a restart silences the room.' },
      ],
      prevention: [
        { t: 'Keep every track on one big stick.', why: 'One copy is one point of failure: carry a tested backup.' },
        { t: 'Copy the files fresh on the night.', why: 'An untested copy can be just as bad — prepare and test before.' },
      ],
    },
    inject: (b) => withEv({ ...b, decks: { ...b.decks, B: { ...b.decks.B, track: null, playing: false } } }, (ev) => ({ ...ev, mediaFail: true })),
    fixed: (b) => !b.ev?.mediaFail && !!b.decks.B.track,
  },
  MIC_DOWN: {
    id: 'MIC_DOWN',
    subsystem: 'mic',
    symptom: 'You announce into a live mic, but no feed carries it — not the room, not the booth, not the recording.',
    cause: 'The mic channel’s LEVEL was turned all the way down.',
    evidence: 'The MIC meter moved with your voice, but no feed carried it — the voice stopped after the gain, at the mic channel’s LEVEL.',
    repair: 'Bring the mic LEVEL up toward its unity mark (about three-quarters), then talk again.',
    prevention: 'Check the mic in the line check: speak, and read every feed it should reach.',
    probe: 'Your voice moves the MIC meter — so where, after the meter, does it stop?',
    where: 'Look at the mic channel itself (EVENT tray, THE MIC).',
    wrong: {
      cause: [
        { t: 'The mic was unplugged.', why: 'Then the MIC meter would be dark. It moved with your voice.' },
        { t: 'The mic was not sent to REC.', why: 'That loses only the recording. Here the room missed it too.' },
      ],
      evidence: [
        { t: 'The MIC meter stayed dark while you spoke.', why: 'It moved: the voice reached the preamp.' },
        { t: 'The crowd carried the voice, but the recorder did not.', why: 'That is a send fault. Here no feed carried it.' },
      ],
      repair: [
        { t: 'Turn the mic’s GAIN all the way up.', why: 'The voice already reached the meter; more gain only risks clipping and feedback.' },
        { t: 'Switch MIC → BOOTH on.', why: 'A send cannot help a channel whose own level is at zero.' },
      ],
      prevention: [
        { t: 'Leave the mic LEVEL at full all night.', why: 'Full level invites feedback; check the mic in the line check instead.' },
        { t: 'Use a wireless mic instead.', why: 'Any mic needs its channel set right; the mic was fine.' },
      ],
    },
    inject: (b) => withEv(b, (ev) => ({ ...ev, mic: { ...ev.mic, level: 0 } })),
    fixed: (b) => !!b.ev && b.ev.mic.level >= 0.4,
  },
  PA_INPUT_MIC: {
    id: 'PA_INPUT_MIC',
    subsystem: 'output',
    symptom: 'The right of the room sounds harsh and distorted; the left is clean.',
    cause: 'PA R’s own input switch was on MIC, so the line-level feed overloaded its input.',
    evidence: 'Both MASTER meters were clean and PA L sounded fine, but PA R’s own LIMIT (clip) light was red — the overload was inside the speaker.',
    repair: 'Turn the MASTER down, set PA R’s input switch to LINE, then bring the MASTER back up.',
    prevention: 'Check every speaker’s input switch and level knob in the line check.',
    probe: 'The MASTER meters are clean — so which speaker’s own light is red?',
    where: 'A powered speaker has controls of its own on its back (EVENT tray).',
    wrong: {
      cause: [
        { t: 'The MASTER was clipping.', why: 'The MASTER meters were clean, and PA L was clean on the same feed.' },
        { t: 'The MASTER R cable was faulty.', why: 'A bad cable crackles or drops out; here PA R’s own LIMIT (clip) light was red.' },
      ],
      evidence: [
        { t: 'The MASTER R meter was in the red.', why: 'It was clean: the overload was inside the speaker.' },
        { t: 'Both sides of the room distorted.', why: 'Only the right side did.' },
      ],
      repair: [
        { t: 'Turn the MASTER down until PA R sounds clean.', why: 'That quietens the whole room and leaves PA R on the wrong input.' },
        { t: 'Swap the PA L and PA R cables.', why: 'The fault is in the speaker’s setting: it would stay with PA R.' },
      ],
      prevention: [
        { t: 'Keep the MASTER low all night.', why: 'A line feed into a MIC input overloads at any sensible level.' },
        { t: 'Run the PA in mono.', why: 'Mono does not change a speaker’s input switch.' },
      ],
    },
    inject: (b) => withEv(b, (ev) => ({ ...ev, paRMic: true })),
    fixed: (b) => !b.ev?.paRMic,
  },
};

export const FAULT_IDS = Object.keys(FAULTS) as FaultId[];

/** Pairs that would hide each other (beyond sharing a subsystem). */
const MASKS: readonly [FaultId, FaultId][] = [
  ['CH2_SELECTOR', 'XF_ASSIGN'],
  ['CH2_SELECTOR', 'MEDIA_FAIL'],
  ['XF_ASSIGN', 'MEDIA_FAIL'],
  // no voice anywhere hides a voice missing from the recording only
  ['MIC_DOWN', 'REC_NO_MIC'],
];

/** Two faults can share an event: different subsystems, and neither masks the other. */
export function compatible(a: FaultId, b: FaultId): boolean {
  if (a === b) return false;
  if (FAULTS[a].subsystem === FAULTS[b].subsystem) return false;
  return !MASKS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

/** Seeded mulberry32 (uniform [0, 1)). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 0x9e3779b9;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Scenario = { seed: number; faults: FaultId[] };

/** The event for a seed (1 … 9999): one fault, and half the time a second
 *  compatible one. Deterministic. */
export function scenarioFor(seed: number): Scenario {
  const r = seeded(seed * 2654435761);
  const first = FAULT_IDS[Math.floor(r() * FAULT_IDS.length)];
  const faults: FaultId[] = [first];
  if (r() < 0.5) {
    const ok = FAULT_IDS.filter((f) => compatible(first, f));
    faults.push(ok[Math.floor(r() * ok.length)]);
  }
  return { seed, faults };
}

/** Plant a scenario's faults. */
export const plant = (b: Booth, s: Scenario): Booth => s.faults.reduce((x, f) => FAULTS[f].inject(x), b);

/** Every planted fault is repaired. */
export const allFixed = (b: Booth, s: Scenario): boolean => s.faults.every((f) => FAULTS[f].fixed(b));

/** The hint ladder for one fault: trace, ask, look — never the answer. */
export function hintsFor(fault: FaultId): string[] {
  const f = FAULTS[fault];
  return ['Trace it on the board: from the source, card by card, to the room. Where is the last live meter?', f.probe, f.where];
}

/* ── the debrief ──────────────────────────────────────────────────────── */

/** One debrief question: the fault's own answer among WRONG options that
 *  fit the same symptom (seeded, so a replayed event asks the same
 *  question). Each option carries why it is right or wrong. */
export function debriefOptions(fault: FaultId, part: DebriefPart, seed: number): { options: string[]; correct: number; why: string[] } {
  const r = seeded(seed * 7919 + DEBRIEF_PARTS.indexOf(part) * 104729 + FAULT_IDS.indexOf(fault));
  const pool = [...FAULTS[fault].wrong[part]];
  const picks: Wrong[] = [];
  while (picks.length < 2 && pool.length) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  const all: Wrong[] = [{ t: FAULTS[fault][part], why: 'Right — that is what the evidence showed.' }, ...picks];
  // the unsafe "fix" is always offered as a wrong prevention or repair
  if (part === 'repair' || part === 'prevention') all.push(EARTH_LIFT_OPTION);
  // a seeded Fisher–Yates: the right answer moves, the same way every replay
  const order = all.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => all[i].t), correct: order.indexOf(0), why: order.map((i) => all[i].why) };
}

/* ── the capstone's own checks ────────────────────────────────────────── */

/** The transition the capstone asks for: deck B in, deck A out, the room
 *  never silent and nothing clipping. A pure step over chunk readings. */
export type TransitionState = { started: boolean; done: boolean; failed: string | null };
export const TRANSITION_FRESH: TransitionState = { started: false, done: false, failed: null };

export function transitionStep(s: TransitionState, b: Booth, reading: { crowdMinDb: number; clipped: boolean } | null): TransitionState {
  return transitionStepBy(s, b.ch[1].fader > 0.05 && b.decks.A.playing, b.ch[2].fader > 0.05 && b.decks.B.playing, b.ch[2].fader, reading);
}

/**
 * The same step from on-air flags (any sources: decks or laptops).
 *
 * A FAILED change stays failed (second learning review 2026-10-18, 23 #1):
 * a gap or a clip mid-way, followed by a clean chunk with the new source up
 * and the old one down, is NOT a clean transition. It is re-armed only when
 * both sources are back in the START state — the old one up, the new one
 * down — and then a fresh attempt is graded from the beginning.
 */
export function transitionStepBy(s: TransitionState, aUp: boolean, bUp: boolean, bFader: number, reading: { crowdMinDb: number; clipped: boolean } | null): TransitionState {
  if (s.done || !reading) return s;
  if (s.failed) return aUp && !bUp ? TRANSITION_FRESH : s;
  const started = s.started || (aUp && bUp);
  if (!started) return s;
  if (reading.clipped) return { started, done: false, failed: 'The mix clipped during the change — lower a fader or a trim and try again.' };
  if (reading.crowdMinDb < -45) return { started, done: false, failed: 'The room went quiet during the change — keep one source up until the other is in.' };
  const done = bUp && bFader >= 0.6 && !aUp;
  return { started, done, failed: null };
}
