/**
 * Round-2 audit fix pass, Round A (Comp B second audit, 2026-10-23) — group D_labs.
 * Pins every text fix made in src/screens/lab (outside miking, mixingGuides and
 * calc): the corrected wording is present and the wrong wording is gone, plus
 * the dev-only build notes (shown only under __DEV__), the support-spacing
 * maximum (R056414), the tube bias restructure (R034578) and the owner's
 * 2026-10-23 hearing ruling (NIOSH + OSHA named together). Source is read with
 * CRLF normalised.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');

const CASES: { file: string; now: string; gone: string }[] = [
  { file: "src/screens/lab/FmLabScreen.tsx", now: ": 'A half-integer ratio: some sidebands land on the carrier’s harmonics and some fall halfway between them, on a thin, gappy series an octave down. Still harmonic, but it can sound hollow and clangy. Compare with", gone: ": 'A half-integer ratio: the sidebands fall between the carrier’s harmonics, on a thin, gappy series an octave down. Still harmonic, but it sounds clangorous and gong-like. Compare with" },
  { file: "src/screens/lab/FxLabScreen.tsx", now: "? 'Effect AUDIO needs the v6 engine build — this dev client predates the effects path. The visuals and lessons above are fully live; install the next dev build to hear it.'", gone: ": 'Effect AUDIO needs the v6 engine build — this dev client predates the effects path. The visuals and lessons above are fully live; install the next dev build to hear it.'}" },
  { file: "src/screens/lab/HarmonographLabScreen.tsx", now: "ses; the slow precession is the picture of beating.`", gone: "ses; the slow precession IS beating.`" },
  { file: "src/screens/lab/ModularLabScreen.tsx", now: "blurb: 'One harmonic only: the fundamental, with no overtones. The filter ca", gone: "blurb: 'No harmonics at all. The filter ca" },
  { file: "src/screens/lab/OscillatorLabScreen.tsx", now: "harmonic. Compare it to saw and see which bars go missing.',", gone: "harmonic. Compare it to square and hear what goes missing.'," },
  { file: "src/screens/lab/OscillatorLabScreen.tsx", now: "? `This engine build predates the additive generator — audio is the fundamental SINE only; square/saw/triangle/pulse stay visual until the v3 dev build is installed.`", gone: ": `This engine build predates the additive generator — audio is the fundamental SINE only; square/saw/triangle/pulse stay visual until the v3 dev build is installed.`}" },
  { file: "src/screens/lab/foundations/FoundationsCourseScreen.tsx", now: ": 'To make a LOUDER sound at the SAME pitch, the speaker c", gone: ": 'To make a LOUDER sound, the speaker c" },
  { file: "src/screens/lab/foundations/FoundationsCourseScreen.tsx", now: "that changes the PITCH, so it is no longer the same note. (Getting clos", gone: "that changes the PITCH, not the loudness. (Getting clos" },
  { file: "src/screens/lab/foundations/FoundationsCourseScreen.tsx", now: "This app labels its readings honestly — dBFS · uncalibrated where that is the truth — because", gone: "This app labels every reading honestly — dBFS · uncalibrated — because" },
  { file: "src/screens/lab/amp/modules/mod7RealWorld.tsx", now: "note=\"+3 dB is small but clearly audible", gone: "note=\"+3 dB is clearly audible" },
  { file: "src/screens/lab/BassLabScreen.tsx", now: "s bezel reads \\u2248G\\u266F3 \\u221214\\u00", gone: "s bezel reads \\u2248G\\u26AF3 \\u221214\\u00" },
  { file: "src/screens/lab/BassLabScreen.tsx", now: "z with the tempered G\\u266F3 at 207.65 Hz", gone: "z with the tempered G\\u26AF3 at 207.65 Hz" },
  { file: "src/screens/lab/AutotuneLabScreen.tsx", now: "blurb: 'Slow correction: each ~400 ms closes most of the gap — a gentle dri", gone: "blurb: 'Correction over ~400 ms — a gentle dri" },
  { file: "src/screens/lab/wave/modules/modWaveB.tsx", now: "<Badge text=\"STEMS = ARRIVALS: THE DIRECT SOUND, THEN THE FIRST AND SECOND REFLECTIONS · AMBER FUSES", gone: "<Badge text=\"STEMS = arrivalsAt (DIRECT + 1st/2nd-ORDER IMAGE-SOURCE REFLECTIONS) · AMBER FUSES" },
  { file: "src/screens/lab/wave/materialPhotos.ts", now: "bing lower in frequency. For this kind of absorber, bass control means more thickness and air gap, not a thinner sheet.',", gone: "bing lower in frequency. Real bass control means thickness and air gaps, not thin panels.'," },
  { file: "src/screens/lab/wave/modules/modWaveA.tsx", now: "'Ignoring it with two open mics: on one source, match their distances; on two sources, use the 3:1 rule.',", gone: "'Ignoring it when using two mics on one source (the 3:1 rule).'," },
  { file: "src/screens/lab/wave/modules/modWaveA.tsx", now: "their distances), two mics on two sources (keep each mic at least 3× farther from the other", gone: "the second mic at least 3× the source distance away — the 3:1 rule), a speaker against a" },
  { file: "src/screens/lab/cable/data/connectors.analog.ts", now: "om power on the line can upset or damage equipment not built to receive it", gone: "om power on the line can misbehave with equipment not designed to receive it" },
  { file: "src/screens/lab/cable/data/connectors.analog.ts", now: "Many amplifiers and cabinets use TS jacks for the speaker link — most guitar and bass amps still do — so both cables turn up in the field.'", gone: "Older amplifiers and loudspeakers used TS jacks for speaker connections, so both cables exist in the field.'" },
  { file: "src/screens/lab/cable/data/connectors.analog.ts", now: "Many amplifier speaker outputs use 1/4-inch TS jacks too — most guitar and bass amps and cabinets do — so verify what a", gone: "Legacy amplifier speaker outputs also use 1/4-inch TS jacks — verify what a" },
  { file: "src/screens/lab/cable/data/connectors.recognition.ts", now: "put can damage a DMX port, and DMX data sent into a mic input can put a loud, harsh buzz through the speakers. Keep phantom off, keep the channel down, and confirm wh", gone: "put can damage a DMX port. Keep phantom off and confirm wh" },
  { file: "src/screens/lab/cable/data/lesson04.ts", now: "Many amplifiers and cabinets use TS jacks for the speaker link — most guitar and bass amps still do — so both cables turn up in the field.'", gone: "Older amplifiers and loudspeakers used TS jacks for speaker connections, so both cables exist in the field.'" },
  { file: "src/screens/lab/cable/data/lesson06.ts", now: "builds a crossover cable. Modern auto-sensing equipment may tolerate it, but unless it is marked as a crossover, it is an inconsistent t", gone: "builds a crossover cable, which modern auto-sensing equipment may tolerate but which is a mislabeled, inconsistent t" },
  { file: "src/screens/lab/cable/data/lesson06.ts", now: "low-power LED light, but other fiber systems can carry laser light you cannot see. So keep the same safe habit on every fiber.',", gone: "low-power LED light, but the same check performed on other fiber systems would aim invisible laser light at your eye; the technique, like the no-staring habit, must not distinguish.'," },
  { file: "src/screens/lab/cable/data/lesson07.ts", now: "'Hum is solved with isolation transformers, balanced lines and proper grounding practice — such as powering the whole system from one source — never by d", gone: "'Hum is solved on the signal side — isolation transformers and proper grounding practice — never by d" },
  { file: "src/screens/lab/cableinstall/data/rules.ts", now: "he cable\\'s rated tension. If it binds, stop and find the snag instead of yanking it through.',", gone: "he cable\\'s rated tension; never yank through resistance.'," },
  { file: "src/screens/lab/cableinstall/data/rules.ts", now: "studentText: 'Pull on the cable itself, or on a pulling grip made for the job — not on its connector.',", gone: "studentText: 'Never pull a cable by its connector. Pull on the cable itself, or on a pulling grip made for the job.'," },
  { file: "src/screens/lab/cableinstall/data/rules.ts", now: "iately rated supports — not other trades\\'", gone: "iately rated supports — never other trades\\'" },
  { file: "src/screens/lab/cableinstall/data/rules.ts", now: "studentText: 'Keep bundles clear of intakes, exhausts and fan paths — each unit\\'s maker sets its cooling needs.',", gone: "studentText: 'Never dress bundles across intakes, exhausts or fan paths — equipment cooling is a manufacturer requirement.'," },
  { file: "src/screens/lab/cableinstall/data/rules.ts", now: "sembly before drilling — find out first, penetrate after.',", gone: "sembly before drilling — never penetrate first and ask later.'," },
  { file: "src/screens/lab/cableinstall/data/rules.ts", now: "studentText: 'Keep cable out of door pinch points — go over, und", gone: "studentText: 'Never let a door pinch a cable — go over, und" },
  { file: "src/screens/lab/cableinstall/data/scenarios.ts", now: "s: ≥ 15× cable diameter; pull by the strength members, never by the glass.',", gone: "s: ≥ 15× cable diameter; never load the fiber in tension.'," },
  { file: "src/screens/lab/cableinstall/data/scenarios.ts", now: ", at this load: supports no more than 4 span units apart, max sag ½ uni", gone: ", at this load: supports every 4 span units, max sag ½ uni" },
  { file: "src/screens/lab/cableinstall/scenes/CeilingScene.tsx", now: "our key (teaching colours, this scene only): grey / blue / orange = other tenants’ bundle · cyan + green = the previous contractor’s runs · violet = your bundle · red = sprinkler. Rings = details to inspect. These colours differ from the cable-type key.'", gone: "our key (teaching colours): grey / blue / orange = other tenants’ bundle · cyan + green = the previous contractor’s runs · violet = your bundle · red = sprinkler. Rings = details to inspect.'" },
  { file: "src/screens/lab/cableinstall/scenes/FireScene.tsx", now: "ts before selecting cable. Do not guess: a cable not listed for an air-handling space breaks code there, and rating every run for the worst case costs more than it needs to.\"", gone: "ts before selecting cable; assuming in either direction produces a wrong installation.\"" },
  { file: "src/screens/lab/cableinstall/scenes/FireScene.tsx", now: "let = this run’s cable · green CMR = a cable already in the riser, riser-rated (riser-rated is not plenum-rated) · numbers = th", gone: "let = this run’s cable · CMR = riser-rated cable listing · numbers = th" },
  { file: "src/screens/lab/cableinstall/scenes/FloorScene.tsx", now: "end capped — reachable, kept out from underfoot, and not plugged into a", gone: "end capped — reachable, never underfoot, and never plugged into a" },
  { file: "src/screens/lab/cableinstall/scenes/FloorScene.tsx", now: "ofile cover and glow tape. Keep any hump off the top of the stair.' }", gone: "ofile cover and glow tape — never a hump at the head of a stair.' }" },
  { file: "src/screens/lab/cableinstall/scenes/KnowScene.tsx", now: "the project designed — not another trade’", gone: "the project designed — never another trade’" },
  { file: "src/screens/lab/cableinstall/scenes/RackScene.tsx", now: "verdict: 'A dressed loom has almost no spare length — terminations", gone: "verdict: 'Cable has almost no give — terminations" },
  { file: "src/screens/lab/cableinstall/scenes/RackScene.tsx", now: "ads dead at the console. Mute input 7, then identify that on", gone: "ads dead at the console. Identify that on" },
  { file: "src/screens/lab/cableinstall/scenes/SupportsScene.tsx", now: "'Approved hardware.' : 'Not rated cable hardware — do not hang cable on", gone: "'Approved hardware.' : 'Never hang cable on" },
  { file: "src/screens/lab/cableinstall/scenes/SupportsScene.tsx", now: "'THE REAL THING — NOT A CABLE SUPPOR", gone: "'THE REAL THING — NEVER A CABLE SUPPOR" },
  { file: "src/screens/lab/cableinstall/scenes/SupportsScene.tsx", now: "er cable hardware. ' : 'not rated cable hardware, so do not hang cable on", gone: "er cable hardware. ' : 'never hang cable on" },
  { file: "src/screens/lab/cableinstall/scenes/SupportsScene.tsx", now: ": 'That meets the 4-unit maximum. It uses more hardware than the design needs — more cost and labor, but not a fault.';", gone: ": 'That is more hardware than the documented design calls for — install to the system’s criteria, not more, not less.';" },
  { file: "src/screens/lab/connectorselect/data/scenarios.ts", now: "explain: 'The USB-B end does not fit this interface’s USB-C port. USB’s shapes", gone: "explain: 'Neither end matches this laptop or this interface. USB’s shapes" },
  { file: "src/screens/lab/connectorselect/pagesA.tsx", now: "a speaker-level signal — tens of volts and real current from an amplifier, not line level. Heavy unshielded conductors, connections made with the amplifier OFF — and never into a mic or line input.</Body>", gone: "a speaker-level signal — high voltage and real current from an amplifier, not line level. Heavy unshielded conductors, connections made with the amplifier OFF — and never, ever into an input.</Body>" },
  { file: "src/screens/lab/digital/modules/modAnalog.tsx", now: "vanishes — how much depends on the slope. Honest cost: real signal near the cutoff is cut too.", gone: "sampled data above. Filter on: the input is attenuated before measurement — the alias is" },
  { file: "src/screens/lab/digital/modules/modDac.tsx", now: "the +1.76 dB comes from comparing the sine’s power with the power of the rounding noise.", gone: "the +1.76 dB comes from the sine’s crest factor, not from rounding." },
  { file: "src/screens/lab/dj/pages/p01Welcome.tsx", now: "style={styles.tileBody}>NIOSH recommends 85 dBA for 8 hours, HALVING the time for every 3 dB more. The US legal limit (OSHA) is 90 dBA, with a 5 dB rule.</Text>", gone: "style={styles.tileBody}>A widely used workplace guideline allows 85 dBA for 8 hours, and HALVES the time for every 3 dB more.</Text>" },
  { file: "src/screens/lab/dj/pages/p01Welcome.tsx", now: ")} % of a day’s allowance (NIOSH)`}", gone: ")} % of a day’s allowance`}" },
  { file: "src/screens/lab/dj/pages/p01Welcome.tsx", now: "R until it is comfortable, and keep it well below the top.</P>", gone: "R until it is comfortable — never to the top.</P>" },
  { file: "src/screens/lab/dj/pages/p03Connect.tsx", now: "(it needs a LINE input). Use exactly one phono stage, the turntable’s or the mixer’s: not both, and not neither.',", gone: "(it needs a LINE input). Never both, never neither.'," },
  { file: "src/screens/lab/dj/pages/p07Cue.tsx", now: "and the booth monitors, not against the so", gone: "and the booth monitors, never against the so" },
  { file: "src/screens/lab/dj/pages/p11Grid.tsx", now: "a wrong grid — hear the kicks clash',", gone: "a wrong grid — hear the flam'," },
  { file: "src/screens/lab/dj/pages/p11Grid.tsx", now: "the tempos match, yet each of B’s kicks lands between A’s kicks — sync lined", gone: "the tempos match, yet every kick flams — sync lined" },
  { file: "src/screens/lab/dj/pages/p11Grid.tsx", now: "* which trusts the grid, puts B's kicks between A's. The learner m", gone: "* which trusts the grid, makes the real beats flam. The learner m" },
  { file: "src/screens/lab/dj/pages/p20Pa.tsx", now: "taped clear of feet, and kept within the stand’s rated height and load.", gone: "taped clear of feet, and never higher than the stand’s rating." },
  { file: "src/screens/lab/dj/pages/p20Pa.tsx", now: "is over the NIOSH guideline from Screen 1 (85 dBA for 8 hours, half the time for every 3 dB more; the OSHA legal limit is 90 dBA with a 5 dB rule).", gone: "is over the guideline from Screen 1 (85 dBA for 8 hours, half the time for every 3 dB more)." },
  { file: "src/screens/lab/dj/pages/p20Pa.tsx", now: "anything only on one side gets quieter, and anything out of phase between the sides can vanish.\"", gone: "anything only on one side, or out of phase between the sides, can vanish.\"" },
  { file: "src/screens/lab/dj/pages/p21Rec.tsx", now: "ecording in headphones, not back into the", gone: "ecording in headphones, never back into the" },
  { file: "src/screens/lab/dj/pages/p21Rec.tsx", now: "not MIC), and AUTO LEVEL OFF — or it pumps the mix up and down. A peak limiter can stay on as a backstop, but set the level so it does not work. If you stream from an app, monitor it in headphones, not back into the", gone: "not MIC), and AUTO LEVEL or its limiter OFF — or it pumps the mix up and down. If you stream from an app, monitor it in headphones, never back into the" },
  { file: "src/screens/lab/dj/pages/p22Hybrid.tsx", now: "? 'Armed on INTERNAL: the lab sends its START on deck A’s next bar line — then it runs on its own tempo. (Many real machines on internal sync ignore an incoming start; then you press START by ear.) Watch ITS BAR", gone: "? 'Armed on INTERNAL: it starts exactly on deck A’s next bar line — then runs on its own tempo. Watch ITS BAR" },
  { file: "src/screens/lab/drumtuning/drumContent.ts", now: "Use a drum key and your fingers, not a wrench or pl", gone: "Drum key and fingers only — never a wrench or pl" },
  { file: "src/screens/lab/drumtuning/modules/ch1Sound.tsx", now: "OVERTONES are the higher notes that ring above it; the lab scores them as the share of the hit far above the pitch (above three times it).", gone: "OVERTONES are the notes above it (the share of the hit above three times the pitch)." },
  { file: "src/screens/lab/drumtuning/modules/ch2Prepare.tsx", now: "so the head rises evenly instead of wrinkling on one side.\"", gone: "so the head rises evenly and never wrinkles on one side.\"" },
  { file: "src/screens/lab/drumtuning/modules/ch2Prepare.tsx", now: "ead has a working range; turn rods with a drum key and your fingers only, not pliers or a drill.</Body>", gone: "ead has a working range; drum key and fingers only.</Body>" },
  { file: "src/screens/lab/fxLabConfigs.tsx", now: "'The notches sharpen and the pea", gone: "'The notches deepen and the pea" },
  { file: "src/screens/lab/fxLabConfigs.tsx", now: "rculates the delayed copy and sharpens the comb: deeper contrast and taller resonant peaks", gone: "rculates the delayed copy, sharpening the comb: deeper notches, resonant peaks" },
  { file: "src/screens/lab/fxLabConfigs.tsx", now: "with a very high ratio — peaks held at a ceiling',", gone: "with a very high ratio — a ceiling nothing passes'," },
  { file: "src/screens/lab/mastering/masteringEngine.ts", now: "note: 'Hot: NIOSH recommends 85 dBA for 8 hours, halving the time for every 3 dB above; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. Everything", gone: "note: 'Hot: at 85 dBA the NIOSH recommended daily limit is 8 hours; every 3 dB above halves it. Everything" },
  { file: "src/screens/lab/mastering/masteringEngine.ts", now: "working level, under the NIOSH daily recommended limit:", gone: "working level, under the daily exposure limit:" },
  { file: "src/screens/lab/mastering/masteringEngine.ts", now: "te: 'Unsafe for working: about three hours or less a day at this level (NIOSH),", gone: "te: 'Unsafe for working: two hours or less a day at this level," },
  { file: "src/screens/lab/mastering/modules/mod3Room.tsx", now: "DAY on the bezel is the NIOSH recommended daily limit: 8 h at 85 dBA, halved every 3 dB above. The US legal limit (OSHA) is looser: 90 dBA, halved every 5 dB.</Point>", gone: "DAY on the bezel is the DAILY LIMIT: the NIOSH figure of 8 h at 85 dBA, halved every 3 dB above.</Point>" },
  { file: "src/screens/lab/mastering/modules/mod4Tools.tsx", now: "<Body>• Most engineers check mono every time they change width.</Body>", gone: "<Body>• Width is never touched without a mono check.</Body>" },
  { file: "src/screens/lab/mastering/modules/mod6Loudness.tsx", now: "e amount — a gain change moves these three together and leaves the gap between them alone — and the face", gone: "e amount — a gain change is the one thing that moves every number together — and the face" },
  { file: "src/screens/lab/mastering/modules/mod6Loudness.tsx", now: "range). Limiting spends mostly the first; compression is what shrinks the second.</Point>", gone: "range). Limiting spends it.</Point>" },
  { file: "src/screens/lab/meter/modules/modMeterB.tsx", now: "ds — the formants — with thin pitch lines (the harmonics) running through them. The fingerpri", gone: "ds — the formants — with pitch striations underneath. The fingerpri" },
  { file: "src/screens/lab/meter/modules/modMeterB.tsx", now: "with fine PITCH LINES (the harmonics) running through them. Syllables rea", gone: "with fine PITCH STRIATIONS underneath. Syllables rea" },
  { file: "src/screens/lab/meter/modules/modMeterC.tsx", now: "'First pull the gain down until the ring stops. Then fix the GEOMETRY — mic behind the speakers, a tighter pickup pattern, and the mic closer to the source so it needs less gain. Then a narrow notch at the ringing frequency (ringing out) drops the loop gain below 1 there, for a little more margin. A notch adds margin; it does not cure a bad layout.',", gone: "'Two-part fix: a narrow notch drops the loop gain below 1 at the ringing frequency (ringing out). Then fix the GEOMETRY — mic behind the speakers, a tighter pickup pattern, and the mic closer to the source so it needs less gain — so the loop cannot find the next frequency.'," },
  { file: "src/screens/lab/meter/modules/modMeterC.tsx", now: "You must break the LOOP: stop the ring with the fader, fix the layout that feeds it, then notch what is left.',", gone: "You must break the LOOP: attack the frequency, then the acoustics feeding it.'," },
  { file: "src/screens/lab/micselect/micSelectData.ts", now: "pproaching its limits — many lavalier capsules distort earlier, so check the max SPL spec.' },", gone: "pproaching its limits — miniature capsules distort earlier.' }," },
  { file: "src/screens/lab/micselect/micSelectData.ts", now: "'Most tube (valve) condensers are the clear exception: they do not run on phantom but on their own power supp", gone: "'A tube (valve) condenser is the clear exception: it does not run on phantom but on its own power supp" },
  { file: "src/screens/lab/micselect/micSelectData.ts", now: "'and takes proper wind protection. A wireless lavalier with a windscreen is also a fair choice, and many crews run both. ' +", gone: "'and takes proper wind protection. The LDC is too sensitive to wind and handling; the measurement omni hears the ' +" },
  { file: "src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx", now: "that the room. In a real room the crossing point depends on the room and the mic, and is often", gone: "critical distance): closer than that you are recording the talker, farther than that you" },
  { file: "src/screens/lab/micspeaker/MicPrinciplesLabScreen.tsx", now: "'The voice only gets quieter, with the same tone',", gone: "'The voice gets quieter'," },
  { file: "src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx", now: "rated angle (90°, 60°…) are where it is al", gone: "6 dB down the ramp, and a box’s rated angle" },
  { file: "src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx", now: "ls, or a delay speaker — turning the level up alone rarely fixes it.',", gone: "ls, or a delay speaker — never just level.'," },
  { file: "src/screens/lab/mixing/pagesA.tsx", now: "back('✓ That is the path most DAWs and consoles share. Some let you reorder it. Say it until", gone: "back('✓ That is the path every DAW and every console shares. Say it until" },
  { file: "src/screens/lab/mixing/pagesA.tsx", now: "<Lead>One path, most mixers, most DAWs. Audio flows through a channel in a set order — some digital desks and DAWs let you change it, so check the one you use — and every la", gone: "<Lead>One path, every mixer, every DAW. Audio flows through a channel in a fixed order — and every la" },
  { file: "src/screens/lab/mixing/pagesAdvA.tsx", now: "'Separate compressors each react to their own drum, so they do not share one envelope unless you link them.',", gone: "'Three private compressors can never share one envelope.'," },
  { file: "src/screens/lab/patchbay/pagesD.tsx", now: "inputs-on-top. The rule that holds: on a well-wired half-normal pair, the INPUT jack", gone: "inputs-on-top. What travels: on a half-normal pair the INPUT jack" },
  { file: "src/screens/lab/roomdesign/modules/modMonitoring.tsx", now: "ute cables along the wall; if one must cross a walkway, use a cable ramp or tape it flat.</Caption>", gone: "ute cables along the wall, never across a walkway.</Caption>" },
  { file: "src/screens/lab/roomdesign/modules/modTreatment.tsx", now: "p panels clear of sockets and lights, and never ha", gone: "p panels clear of sockets, lights and heaters, and never ha" },
  { file: "src/screens/lab/roomdesign/roomModel.ts", now: "porous absorption — good only in the upper mids and highs, useless for b", gone: "porous absorption — good above 500 Hz, useless for b" },
  { file: "src/screens/lab/roomdesign/roomModel.ts", now: "he usual thing to test — hung from the structure with rated hardware, not from drywall alone.", gone: "he usual thing to test — mounted into structure with rated hardware, never into drywall alone." },
  { file: "src/screens/lab/roomdesign/roomModel.ts", now: "into drywall alone, and placed so it cannot fall on a seat", gone: "into drywall alone, and never where it could fall on a seat" },
  { file: "src/screens/lab/roomdesign/roomModel.ts", now: "Not into drywall or a drop-ceiling grid alone — and never unde", gone: "Never into drywall or a drop-ceiling grid alone, and never unde" },
  { file: "src/screens/lab/soundsystems/pagesLearnC.tsx", now: "Keep microphones out of the mains’ coverage where you can. Most seats should hear one main clearly; where two mains overlap, as in the middle of a left-right pair, expect some comb filtering, and align them for the seats that matter most.</KeyFact>", gone: "A microphone should never stand in the mains’ coverage; a listener should always stand in exactly one loudspeaker’s, or in two that have been aligned.</KeyFact>" },
  { file: "src/screens/lab/soundsystems/pagesRoute.tsx", now: "on the announce channel changes only the part inside MAIN, not the extra on AUX 7. The channel MUTE (above the PRE tap on this console) still closes both.</Body>", gone: "on the announce channel does not change what the lobby hears, and the channel MUTE (above the PRE tap on this console) still closes it.</Body>" },
  { file: "src/screens/lab/tube/TubeReferenceScreen.tsx", now: "check them against your amplifier’s own manual. Tube amps hold deadly voltages, even when", gone: "confirm against your amplifier’s documentation before working on live equipment." },
  { file: "src/screens/lab/tube/VacuumTubeLabScreen.tsx", now: "'Bias sets WHERE on the transfer curve the tube idles. Too negative and the stream is shut off for much of the swing — the input wiggles a closed valve, so part of the wave (or all of it) is lost.", gone: "'Bias sets WHERE on the transfer curve the tube idles. Too negative and the stream is already cut off — the input wiggles a closed valve (the output flatlines, or only half the wave sneaks through)." },
  { file: "src/screens/lab/tube/VacuumTubeLabScreen.tsx", now: "much lower and the grid starts to draw current (and at the other extreme the stream pinches", gone: "to give (and at the other extreme the stream pinches off), so each" },
  { file: "src/screens/lab/tuning/chapters/ch13Apply.tsx", now: "'The wolf fifth, about 36 cents wide',", gone: "'The wolf fifth, about 41 cents'," },
  { file: "src/screens/lab/tuning/chapters/ch13Apply.tsx", now: "ANTONE parks its leftover: about 36 ¢ wider than a pure fifth. Twelve PURE fifths miss by a comma, not by 36 ¢.',", gone: "ANTONE parks its leftover. Twelve PURE fifths miss by a comma, not by 41 ¢.'," },
  { file: "src/screens/lab/cymatics/MembraneStudioScreen.tsx", now: "t: piston, edge flexing, circumferential (bell) modes, breakup", gone: "t: piston, edge flexing, radial modes, breakup" },
  { file: "src/screens/lab/cymatics/modules/modSystems.tsx", now: "'piston, then bell-like circumferential modes — the", gone: "'piston, then bell-like radial modes — the" },
];

test('audit R2 · D_labs: corrected wording present, wrong wording gone', () => {
  for (const c of CASES) {
    const s = read(c.file);
    assert.ok(s.includes(c.now), `${c.file}: missing corrected text: ${c.now}`);
    assert.ok(!s.includes(c.gone), `${c.file}: old text still present: ${c.gone}`);
  }
});

test('audit R2 · D_labs: developer build notes show only in dev builds, learners get plain words', () => {
  const DEV: [string, string, string][] = [
    ['src/screens/lab/BinauralLabScreen.tsx', 'Binaural audio needs the v7 engine build', 'cannot play the binaural mix yet'],
    ['src/screens/lab/FmLabScreen.tsx', 'FM audio needs the v7 engine build', 'cannot play the FM voice yet'],
    ['src/screens/lab/FxLabScreen.tsx', 'Effect AUDIO needs the v6 engine build', 'cannot play the effect audio yet'],
    ['src/screens/lab/SignalChainLabScreen.tsx', 'Chain AUDIO needs the v6 engine build', 'cannot play the chain audio yet'],
    ['src/screens/lab/OscillatorLabScreen.tsx', 'This engine build predates the additive generator', 'plays the fundamental SINE only'],
    ['src/screens/lab/OscillatorLabScreen.tsx', 'Frequency and amplitude modulation are not in the current ape-dsp engine', 'have no controls in this lab'],
    ['src/screens/lab/foundations/FoundationsCourseScreen.tsx', 'This engine build predates the stereo dual-oscillator', 'update the app to HEAR the drifting-phase demo'],
    ['src/screens/lab/foundations/FoundationsCourseScreen.tsx', 'This engine build predates the additive generator', 'update the app to HEAR each harmonic enter the tone'],
  ];
  for (const [file, dev, learner] of DEV) {
    const s = read(file);
    const at = s.indexOf(dev);
    assert.ok(at > 0, `${file}: dev note moved`);
    const before = s.slice(Math.max(0, at - 140), at);
    assert.match(before, /__DEV__\s*(\n\s*)?\?\s*[`']?$/, `${file}: "${dev}" must sit in the __DEV__ branch`);
    assert.ok(s.includes(learner), `${file}: learner wording missing: ${learner}`);
  }
  assert.doesNotMatch(read('src/screens/lab/FxLabScreen.tsx'), /plays on the phone dev build/);
  assert.doesNotMatch(read('src/screens/lab/wave/modules/modWaveB.tsx'), /STEMS = arrivalsAt/);
});

test('audit R2 · R056414: a support layout at or under the 4-unit maximum passes', () => {
  const s = read('src/screens/lab/cableinstall/scenes/SupportsScene.tsx');
  assert.match(s, /if \(exact \|\| maxGap <= SPEC_EVERY\)/);
  assert.match(s, /That meets the 4-unit maximum/);
  assert.doesNotMatch(s, /not more, not less/);
  assert.match(read('src/screens/lab/cableinstall/data/scenarios.ts'), /supports no more than 4 span units apart/);
});

test('audit R2 · R034578: the cutoff-bias check has one defensible answer', () => {
  const s = read('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
  const block = s.slice(s.indexOf('const BIAS_CHECK'), s.indexOf('function BiasSection'));
  assert.doesNotMatch(block, /distorts/, 'the "distorts" distractor was also defensible');
  assert.match(block, /'Part or all of the wave is shut off'/);
  assert.match(block, /correctIdx: 1/);
});

test('audit R2 · owner hearing ruling 2026-10-23: NIOSH and OSHA named together; no workplace-limit wording', () => {
  const welcome = read('src/screens/lab/dj/pages/p01Welcome.tsx');
  assert.match(welcome, /NIOSH recommends 85 dBA for 8 hours/);
  assert.match(welcome, /legal limit \(OSHA\) is 90 dBA, with a 5 dB rule/);
  assert.doesNotMatch(welcome, /workplace guideline/);
  assert.match(read('src/screens/lab/dj/pages/p20Pa.tsx'), /NIOSH guideline from Screen 1[^)]*OSHA legal limit is 90 dBA/);
  const eng = read('src/screens/lab/mastering/masteringEngine.ts');
  assert.match(eng, /NIOSH recommends 85 dBA for 8 hours[^']*OSHA\) is 90 dBA with a 5 dB rule/);
  assert.match(read('src/screens/lab/mastering/modules/mod3Room.tsx'), /NIOSH recommended daily limit[^<]*OSHA\) is looser: 90 dBA/);
});

test('audit R2 · ccode consistency: +3 dB is "small but clearly audible"; 3:1 is for mics on different sources', () => {
  assert.match(read('src/screens/lab/amp/modules/mod7RealWorld.tsx'), /\+3 dB is small but clearly audible/);
  const w = read('src/screens/lab/wave/modules/modWaveA.tsx');
  assert.doesNotMatch(w, /two mics on one source \(the 3:1 rule\)/);
  assert.match(w, /two mics on two sources \(keep each mic at least 3× farther/);
});

test('audit R2 · R013255: the wireless lavalier is accepted on the base outdoor brief', () => {
  const s = read('src/screens/lab/micselect/micSelectData.ts');
  const base = s.slice(s.indexOf('export const CHALLENGE_BASE'), s.indexOf('export const CHALLENGE_FACTORS'));
  assert.match(base, /accept: \['E'\]/);
  assert.match(base, /wireless lavalier with a windscreen is also a fair choice/);
});
