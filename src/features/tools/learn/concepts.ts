/**
 * Smaart-style professional measurement concept modules (data only).
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §15 (Modules 1–8),
 * §14 (coherence treatment — tutorial-only), and, for the Measurement Integrity
 * capstone, §5 (integrity rules), §6 (quality states + warning philosophy),
 * §8 (compare-compatibility discipline). Authored 2026-07-23.
 *
 * These are educational modules, not live measurement features: coherence,
 * magnitude response, and delay finding stay tutorial-only in current scope.
 */
import type { ConceptModule } from './types';

export const CONCEPT_MODULES: ConceptModule[] = [
  {
    key: 'rta-vs-magnitude',
    num: 1,
    title: 'RTA vs Magnitude Response',
    intro:
      'The single most common beginner mistake in system measurement is treating an RTA trace as if it were the system’s frequency response. Professionals draw a hard line between the two: an RTA is a single-channel display of whatever energy reached the microphone, while magnitude response is a dual-channel comparison that isolates what the system itself changed. This module exists so that line is drawn early, before any habits form.',
    sections: [
      {
        head: 'ONE MICROPHONE, ONE STORY',
        body: 'An RTA uses a single input channel, so everything it shows is a blend of the source material, the loudspeaker, the room, and the exact microphone position. It cannot separate those ingredients from each other. If the music has no energy at 12 kHz, the RTA shows a dip there — and that dip says nothing about the system.',
      },
      {
        head: 'WHAT MAGNITUDE RESPONSE ADDS',
        body: 'A transfer-function measurement feeds the analyzer two signals: the reference going into the system and the measurement coming out of it. By comparing them, the analyzer computes what the system changed — its magnitude response — largely independent of the program material. That is why professional analyzers like Smaart can tune a system while music is playing.',
      },
      {
        head: 'WHY THE DIFFERENCE MATTERS',
        body: 'EQing a room from an RTA conflates the spectrum of the source with the response of the system, so you end up correcting the music instead of the PA. A flat RTA with pink noise is a useful sanity check, but it still bakes in one microphone position and every reflection arriving at it. RTA alone does not equal system tuning, and no amount of averaging changes that.',
      },
      {
        head: 'WHERE THE RTA STILL SHINES',
        body: 'None of this makes the RTA useless — it is the right tool for seeing where energy lives. Ringing identification, noise hunting, tonal-balance study, and checking that pink noise reads flat are all legitimate single-channel jobs. Use it as a seeing tool, not a judging tool.',
      },
    ],
    keyPoints: [
      'An RTA is single-channel: it shows energy at the mic, not what the system changed.',
      'Magnitude response requires a reference signal to compare against.',
      'Transfer function shows system change; RTA shows whatever arrived.',
      'A flat RTA does not mean a tuned system.',
      'RTA alone is never a system-tuning method.',
    ],
    relatedTools: ['rta', 'signalgen'],
  },
  {
    key: 'coherence',
    num: 2,
    title: 'What Coherence Means',
    intro:
      'Every professional dual-channel analyzer draws a second trace above the frequency response: coherence. It answers a question no magnitude curve can — how much should you trust this data? Coherence is taught here as a concept only, because this toolset has no live dual-channel measurement, but understanding it now means Smaart will not be a mystery later.',
    sections: [
      {
        head: 'A TRUST METER, NOT A SOUND METER',
        body: 'Coherence measures how reliably the output signal relates to the reference input at each frequency, on a scale from zero to one. It is not volume, and it is not frequency response. High coherence means the analyzer is confident the measurement at that frequency reflects the system; low coherence means the data there is contaminated.',
      },
      {
        head: 'WHAT DRAGS COHERENCE DOWN',
        body: 'Low coherence can mean background noise, strong reflections, an incorrectly set measurement delay, sound that is unrelated to the reference, or simply poor signal-to-noise ratio. Notice that only some of those are problems with the system — several are problems with the measurement itself. That ambiguity is exactly why the trust indicator exists.',
      },
      {
        head: 'HOW PROFESSIONALS USE IT',
        body: 'The discipline is simple: do not make decisions from transfer-function data where coherence is low. An engineer scanning a response trace reads the coherence trace first, and mentally erases every region where it collapses. EQing a dip that only exists because of low-coherence garbage is one of the classic ways to make a system worse.',
      },
      {
        head: 'WHY IT IS TUTORIAL-ONLY HERE',
        body: 'Coherence only exists in dual-channel measurement, and this module’s live toolset is single-channel — magnitude response and delay finding are out of current scope. So there is no live coherence graph, meter, or overlay here, and none should be imagined into the displays. The concept is taught now so that professional analyzers make sense on day one.',
      },
    ],
    keyPoints: [
      'Coherence is a trust indicator, not a level and not a response curve.',
      'Low coherence can mean noise, reflections, wrong delay, or unrelated sound.',
      'Never make EQ decisions from data where coherence is low.',
      'Coherence requires dual-channel measurement — one microphone cannot compute it.',
      'Noisy or unstable conditions lower measurement reliability before they change the sound.',
    ],
    relatedTools: ['rta', 'signalgen'],
  },
  {
    key: 'why-delay-matters',
    num: 3,
    title: 'Why Delay Matters',
    intro:
      'Sound is slow. Electricity through an analyzer is effectively instant, but the acoustic copy of the signal has to physically travel from the loudspeaker to the microphone. Professional dual-channel analysis lives or dies on compensating for that travel time, which is why every serious analyzer has a delay finder. This module explains the idea, even though delay finding stays tutorial-only in this toolset.',
    sections: [
      {
        head: 'SOUND IS SLOW',
        body: 'Sound travels at roughly 343 metres per second — close to a foot per millisecond, or about 2.9 milliseconds per metre. A microphone ten metres from the PA hears everything about 29 milliseconds late. In measurement terms, distance is time.',
      },
      {
        head: 'TWO SIGNALS, ONE CLOCK',
        body: 'A transfer-function analyzer compares the reference signal against the measured signal, sample by sample. If the measurement arrives late because of acoustic travel time, the analyzer is comparing two different moments of the program. The reference must be delayed to match the measurement’s arrival before the comparison means anything.',
      },
      {
        head: 'WHAT WRONG DELAY DOES',
        body: 'With the wrong delay, the magnitude and phase data become artifacts of the timing error rather than descriptions of the system — comb-like ripple appears, phase wraps meaninglessly, and interpretation is corrupted. The analyzer usually confesses through the coherence trace, which collapses when alignment is wrong. Moving the microphone changes the arrival time, so every mic position change means re-checking delay.',
      },
      {
        head: 'TUTORIAL-ONLY IN THIS APP',
        body: 'The Delay Finder was removed from live scope along with magnitude response, so there is no delay measurement to run here. What remains is the discipline: whenever you eventually stand behind a dual-channel analyzer, time alignment comes before trust. Learn the reflex now, apply it later.',
      },
    ],
    keyPoints: [
      'Sound travels roughly a foot per millisecond — distance is time.',
      'Mic distance changes arrival time, and arrival time changes the measurement.',
      'Reference and measurement must be time-aligned before comparison means anything.',
      'Wrong delay corrupts magnitude and phase interpretation — and shows up as low coherence.',
    ],
    relatedTools: ['rta', 'rt60'],
  },
  {
    key: 'impulse-response-basics',
    num: 4,
    title: 'Impulse Response Basics',
    intro:
      'An impulse response is the room’s reply to a single sharp excitation — its time-domain fingerprint. Almost everything room acoustics cares about is written in that one waveform: where the direct sound lands, when the reflections pile in, how the reverberant tail dies, and where the noise floor swallows it all. In this toolset the impulse view lives inside the RT60 / Reverb Decay tool, because decay analysis is built directly on top of it.',
    sections: [
      {
        head: 'THE ROOM ANSWERS A QUESTION',
        body: 'Excite a room with something short and broadband — ideally a proper test signal, less ideally a clap — and record what comes back. That recording is the impulse response: amplitude versus time, showing every path the sound took from source to microphone. Two rooms, or even two positions in one room, produce visibly different answers.',
      },
      {
        head: 'READING THE TIMELINE',
        body: 'Read an impulse response left to right, in arrival order. First comes the direct sound — usually the tallest, earliest spike, having taken the straight path. Next come early reflections as discrete spikes from nearby surfaces, then the late decay, a dense reverberant tail where individual reflections blur together. Underneath everything sits the noise floor, the level the room never drops below.',
      },
      {
        head: 'WHAT EACH REGION TELLS YOU',
        body: 'The gap between direct sound and first reflections encodes the geometry around the mic and source — milliseconds convert straight to metres. The slope of the late decay is the room’s reverberant character, and it is where RT60 estimates come from. Where the tail sinks into the noise floor marks the limit of the measurement: whatever happens below that line is invisible, and visible late energy may already include noise.',
      },
      {
        head: 'FROM IMPULSE TO DECAY CURVE',
        body: 'Decay analysis does not read the raw impulse response directly — it integrates the tail’s remaining energy over time to produce a smooth decay curve (the Schroeder curve). Line fits on that curve produce T20, T30, and EDT figures. That bridge from time-domain fingerprint to decay numbers is the subject of the next module.',
      },
    ],
    keyPoints: [
      'An impulse response is the room’s reply to a single sharp excitation.',
      'Read it in arrival order: direct sound, early reflections, late decay, noise floor.',
      'Milliseconds between spikes convert directly to distances in the room.',
      'The slope of the late decay is where RT60 estimates come from.',
      'Everything below the noise floor is invisible — the floor sets the measurement limit.',
    ],
    relatedTools: ['rt60', 'waveform', 'signalgen'],
  },
  {
    key: 'rt60-t20-t30-edt',
    num: 5,
    title: 'RT60, T20, T30, and EDT',
    intro:
      'RT60 is the time it takes sound in a room to decay by 60 decibels — a simple definition hiding a difficult measurement. Real rooms rarely offer enough clean decay range to observe 60 dB directly, so professionals estimate it from shorter, better-behaved ranges and label which method they used. This module teaches those labels, because an unlabeled decay number is an uninterpretable one.',
    sections: [
      {
        head: 'WHY 60 dB IS HARD TO GET',
        body: 'To watch a full 60 dB decay you need the excitation to sit at least that far above the background noise, and ordinary rooms with ordinary sources rarely allow it. Traffic, HVAC, and the measurement chain’s own noise floor eat the bottom of the range first. So RT60 is usually an extrapolation, not a direct observation — and honest tools say so.',
      },
      {
        head: 'T20 AND T30 ARE EXTRAPOLATIONS',
        body: 'T20 fits a straight line to the decay curve between −5 and −25 dB, then multiplies that slope out to a full 60 dB; T30 does the same over −5 to −35 dB. They are estimated ranges projected forward, which is why results must always carry the method label. T20 and T30 from the same room can disagree, and the disagreement itself is information about how non-ideal the decay is.',
      },
      {
        head: 'EDT — THE FIRST IMPRESSION',
        body: 'Early Decay Time fits only the first 10 dB of decay and scales it to 60. It tracks what listeners actually perceive as reverberance, because the ear weighs the beginning of the decay most heavily. In small or unevenly treated rooms EDT can differ sharply from T30 — a room can measure long but feel dry, or the reverse.',
      },
      {
        head: 'DECAY IS FREQUENCY-DEPENDENT',
        body: 'A single RT60 number is a summary, not the room. Decay time varies by frequency band — low frequencies commonly ring far longer than highs, because absorption is frequency-dependent. Professional practice reports decay per octave band from 125 Hz to 4 kHz, and treats any one-number answer as marketing.',
      },
      {
        head: 'WHEN NOISE INVALIDATES THE RESULT',
        body: 'Background noise shortens the usable decay range, and below a certain range the line fit is fiction — that is the insufficient-decay-range warning. A single hand clap may not excite every band reliably, and one microphone position is only one sample of the room. Repeat measurements from multiple positions, and trust the per-band confidence indicators over wishful thinking.',
      },
    ],
    keyPoints: [
      'RT60 is usually estimated, not measured directly.',
      'T20 and T30 are line fits extrapolated to a full 60 dB — always check the method label.',
      'EDT describes the early decay the ear notices first.',
      'Decay varies by frequency — one number is not the room.',
      'Background noise can quietly invalidate a decay measurement.',
    ],
    relatedTools: ['rt60', 'signalgen'],
  },
  {
    key: 'spectrogram-interpretation',
    num: 6,
    title: 'Spectrogram Interpretation',
    intro:
      'A spectrogram is the only common display that shows when each frequency happened — time on one axis, frequency on the other, level as color. That third dimension makes it powerful and easy to misread in equal measure. This module covers the reading rules professionals apply before drawing any conclusion from the picture.',
    sections: [
      {
        head: 'THE THREE AXES',
        body: 'Time runs horizontal, frequency runs vertical, and color or intensity encodes level in dB. The first two are exact; the third is not — reading level from color is only precise to a few dB, and the color scale is relative to the chosen display range. Change the range or the floor and the same audio paints a different picture.',
      },
      {
        head: 'THE RESOLUTION TRADE-OFF',
        body: 'Every spectrogram is built from FFT frames, and the window length forces a choice. Long windows resolve frequency finely but smear events in time; short windows pin down timing but blur frequencies together. No setting shows both perfectly — this is a mathematical limit, not a software flaw, so interpret the display knowing which trade-off is active.',
      },
      {
        head: 'A SPECTROGRAM IS NOT AN RTA',
        body: 'The RTA answers "what does the spectrum look like right now," continuously overwriting itself. The spectrogram answers "when did each frequency occur," preserving history. Use the RTA for tonal balance in the moment and the spectrogram for events in time — hums that come and go, feedback blooming, sibilance on certain words, a noise that happens only when the fridge kicks in.',
      },
      {
        head: 'VISIBLE IS NOT IMPORTANT',
        body: 'The noise floor shows up visually as a wash of low-level color, and an aggressive display range can make it look dramatic. Meanwhile a musically decisive element can occupy a thin, unremarkable band. Visible is not audible, and audible is not important — the picture ranks nothing for you.',
      },
    ],
    keyPoints: [
      'Time runs horizontal, frequency runs vertical, color is relative level.',
      'Color and intensity depend on the chosen scale — never read them as absolute.',
      'FFT and window settings decide whether you see time detail or frequency detail.',
      'A spectrogram is not an RTA: it shows when, not just what.',
      'The noise floor is visible too — not everything on screen is signal.',
    ],
    relatedTools: ['spectrogram', 'rta'],
  },
  {
    key: 'spl-logging-vs-instant',
    num: 7,
    title: 'SPL Logging vs Instant SPL',
    intro:
      'Glancing at an SPL meter tells you about one moment; a show, a rehearsal, or a noise complaint is a story that unfolds over hours. Professionals who manage level — front-of-house engineers, venue managers, monitoring services — work from logs, not glances. This module separates the instant reading from the event history, and both from anything legally binding.',
    sections: [
      {
        head: 'A NUMBER IS NOT A HISTORY',
        body: 'Instant SPL is a snapshot that is stale the moment you look away, and memory is a terrible logger. An SPL log records level over the whole event, revealing the loud choruses, the quiet ballads, and the creep of level over the night. Questions like "how loud was the show" are log questions, not meter-glance questions.',
      },
      {
        head: 'PEAK IS NOT AVERAGE',
        body: 'Peak level and averaged level answer different questions, and they can sit tens of dB apart on the same material. Peaks matter for clipping and momentary exposure; averages matter for overall exposure and venue limits. A log that captures only one of them tells half the story.',
      },
      {
        head: 'WEIGHTING AND RESPONSE CHANGE THE NUMBER',
        body: 'The same sound produces different readings under A, C, or Z weighting, and under Fast versus Slow response — A-weighting discounts low frequencies substantially, and response time decides how much peaks register. None of these settings is "wrong," but a reading without its settings is meaningless. Two SPL figures can only be compared when weighting and response match.',
      },
      {
        head: 'LOGGING IS NOT LEGAL COMPLIANCE',
        body: 'A phone-based log is a learning and awareness tool, not evidence. Legal or occupational compliance requires calibrated instrumentation meeting measurement standards such as IEC 61672 Class 1 or 2, operated under proper procedure. Uncalibrated readings are approximate and labeled so — treat the label as part of the number.',
      },
    ],
    keyPoints: [
      'Instant SPL is one moment, not the history of the event.',
      'Peak and average answer different questions — know which you are reading.',
      'Weighting (A/C/Z) and response (Fast/Slow) change the number on screen.',
      'A reading without its settings recorded cannot be compared to anything.',
      'Phone-based logging is never legal compliance without calibrated hardware.',
    ],
    relatedTools: ['spl'],
  },
  {
    key: 'measurement-integrity',
    num: 8,
    title: 'Measurement Integrity',
    intro:
      'This is the capstone concept, and the one this entire module is built on: a measurement is only worth what its conditions allow, and an honest tool says so out loud. Professional tools require disciplined interpretation, not blind graph reading. Every rule here — no fake meters, approximate unless calibrated, context always disclosed, quality always stated, comparisons only when compatible — applies across every tool in this app.',
    sections: [
      {
        head: 'NO FAKE METERS',
        body: 'A display that looks live but is not is a lie with a needle on it. Simulated values are allowed only in a clearly labeled tutorial or demo mode, marked "Training Demo — Not a Live Measurement." This is why the tools in this app show no readings at all until the real measurement engine is running — no decoration that resembles a meter.',
      },
      {
        head: 'APPROXIMATE UNLESS CALIBRATED',
        body: 'Without calibrated hardware and proper measurement standards, no reading here implies certified, legal, or professional-reference accuracy. Phone microphones have limited flat range, limited dynamic window, and unit-to-unit variation of several dB. So uncalibrated readings carry the label "approximate unless calibrated" — and the label is part of the measurement.',
      },
      {
        head: 'CONTEXT IS PART OF THE MEASUREMENT',
        body: 'A number without its conditions cannot be interpreted later, by you or anyone else. Every saved measurement stores its tool type, date and time, input device, calibration status, and the relevant settings — sample rate, weighting, response, smoothing, FFT and window, mic position — plus any warnings raised. Calibration and mic position are not footnotes; they decide what the number means.',
      },
      {
        head: 'VALID, CAUTION, INVALID',
        body: 'Every measurement carries one of three quality states: valid means conditions appear acceptable, caution means it can be viewed but interpretation is limited, invalid means it should not be trusted. Clipping invalidates data outright; a high noise floor, unstable readings, or insufficient signal push a measurement toward caution. Warnings appear on the measurement screen in plain language — "Input clipping detected. Reading may be inaccurate." — never buried in a developer log.',
      },
      {
        head: 'COMPARE ONLY COMPATIBLE THINGS',
        body: 'A comparison is only valid when both measurements were taken under compatible conditions. Different weighting, smoothing, FFT size, mic position, input device, or sample rate — or a calibrated trace against an uncalibrated one — makes the difference you see partly an artifact of the setup, so compare mode warns before letting you draw conclusions. A comparison involving a caution or invalid measurement inherits that doubt. The professional habit: check the compatibility report before you believe the overlay.',
      },
    ],
    keyPoints: [
      'If a meter looks live, it must be live — demos are labeled as demos.',
      'Every reading is approximate unless calibrated, and must say so.',
      'Calibration, mic position, and settings are part of the measurement, not footnotes.',
      'Clipping invalidates data; a high noise floor limits what you can claim.',
      'Every measurement carries a quality state: valid, caution, or invalid.',
      'Comparisons only mean something when settings and conditions match.',
    ],
    relatedTools: [
      'spl',
      'rta',
      'waveform',
      'spectrogram',
      'rt60',
      'signalgen',
      'hzcounter',
    ],
  },
];
