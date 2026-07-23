/**
 * SPL Reference Meter — Learn-mode content.
 * Source of record: docs/APE_AUDIO_TOOLS_SPEC_2026_07_23.md §9 (Tool 1 — SPL
 * Reference Meter), with the §5 measurement-integrity rules and §6 quality
 * system applied. Authored 2026-07-23. Data only — assembled by ./index.ts.
 */
import type { ToolLearnContent } from './types';

export const SPL_LEARN: ToolLearnContent = {
  tool: 'spl',
  sections: [
    {
      head: 'WHAT YOU ARE LOOKING AT',
      body:
        'The big number is acoustic sound pressure level in dB SPL — how much the air is actually moving at the microphone, referenced to the quietest pressure a healthy ear can detect. Around it sit a Peak value, an RMS (average-energy) value, the current weighting (A, C, or Z), the response mode (Fast or Slow), and the calibration status. Every one of those settings changes what the number means, so the display always shows them together. A reading without its settings is not a measurement — it is just a number.',
    },
    {
      head: 'DB SPL VS DBFS',
      body:
        'dB SPL describes acoustic level in the air; dBFS describes digital level inside the audio system, where 0 dBFS is the absolute ceiling of the converter. They are different scales with different reference points, and there is no fixed conversion between them — the relationship depends on the microphone, preamp gain, and the whole input chain. That is exactly why calibration exists: it pins a known acoustic level to a known digital level so the meter can translate honestly. Until that link is established, any dB SPL number derived from a digital signal is an estimate.',
    },
    {
      head: 'PEAK VS RMS',
      body:
        'Peak is the single highest instantaneous excursion of the signal; RMS is the average energy over a short window, and it tracks much closer to how loud something feels. A snare hit can post a very high Peak while barely moving the RMS value, and steady pink noise can do the opposite. The gap between them is the crest factor, and it tells you about the character of the signal, not just its level. Read both: Peak protects equipment and headroom, RMS relates to loudness and exposure.',
    },
    {
      head: 'WEIGHTING AND RESPONSE',
      body:
        'A-weighting filters the signal to roughly match how the ear hears at moderate levels, strongly discounting low frequencies; C-weighting is much flatter and keeps most of the bass; Z-weighting applies no filter at all. On bass-heavy program the A and C readings can differ by a large margin — neither is wrong, they answer different questions. Fast and Slow are meter ballistics: Fast (125 ms) follows short events, Slow (1 s) smooths them into a steadier trend. Changing weighting or response never changes the sound — it changes what the meter is summarizing, which is why comparisons are only valid when both settings match.',
    },
    {
      head: 'CALIBRATION AND PHONE-MIC HONESTY',
      body:
        'A phone microphone is not a measurement microphone: its response is usably flat only through the midrange, its usable window is limited at both the quiet and loud ends, and two phones of the same model can disagree by several dB. Uncalibrated readings are therefore always labeled approximate — useful for comparisons, trends, and learning, but not for absolute claims. Calibrating against a known reference tightens the absolute accuracy, yet even then the result is not a certified instrument. Professionals state their calibration status with every reading; this meter makes you do the same.',
    },
    {
      head: 'MIC POSITION AND MEASUREMENT DISCIPLINE',
      body:
        'SPL exists at a point in space: move the microphone and the number changes, sometimes dramatically. Distance from the source, room reflections, boundaries, and low-frequency room modes all shape the level at the mic — a reading a meter away from a wall is not the reading at the mix position. So a disciplined measurement records where the mic was, keeps it there for the duration, and repeats the same position when comparing before and after. If you cannot say where and how a level was measured, you cannot compare it to anything.',
    },
    {
      head: 'HEARING SAFETY CONTEXT',
      body:
        'Hearing damage is a dose: it depends on level multiplied by time, which is why occupational guidance is framed as A-weighted averages over a working day, with allowable time shrinking fast as level rises. A show that feels fine for one song can still exceed a safe dose over four hours. Session logging exists exactly for this — a single glance at the meter cannot describe exposure, but a logged average and peak over time can. The meter informs those judgments; it does not diagnose your hearing, and it is not a substitute for professional monitoring where the law requires it.',
    },
  ],
  misconceptions: [
    {
      claim: 'dB is dB — SPL and dBFS are the same thing.',
      truth:
        'They share the decibel math but not the reference. dB SPL is acoustic pressure referenced to the threshold of hearing; dBFS is digital level referenced to the converter ceiling, so it is always zero or negative. Without a calibrated chain there is no fixed conversion between them — a signal peaking at -6 dBFS could be a whisper or a jet depending on the gain ahead of it.',
    },
    {
      claim: 'Peak and RMS should read about the same if the meter is working.',
      truth:
        'A healthy signal almost always shows Peak above RMS, because real audio has transients that spike far beyond its average energy. That gap is the crest factor: percussive material has a large one, compressed or steady material a small one. Matching Peak and RMS values usually mean a square-wave-like or heavily limited signal, not an accurate meter.',
    },
    {
      claim: 'Weighting is just a display option — the level is the level.',
      truth:
        'Weighting is a filter applied before the level is computed, so it changes the measured number itself. A-weighting can read tens of dB below C-weighting on bass-heavy material because it discards most low-frequency energy. Any SPL figure is incomplete without its weighting stated — 95 dB(A) and 95 dB(C) describe different acoustic events.',
    },
    {
      claim: 'Fast mode is more accurate than Slow mode.',
      truth:
        'Neither is more accurate — they are different averaging times for different questions. Fast (125 ms) resolves short events like snare hits that Slow smooths over; Slow (1 s) gives a stable trend reading that Fast leaves jumping around. Accuracy comes from matching the response to what you are trying to observe, and stating which one you used.',
    },
    {
      claim: 'A phone SPL app is as good as a real sound level meter.',
      truth:
        'A certified meter is a calibrated system — matched microphone, verified electronics, and periodic lab checks against IEC 61672 tolerances. A phone uses whatever MEMS mic it shipped with, behind unknown processing, and units of the same model can differ by several dB. Calibrated against a reference, a phone becomes a useful approximate tool; it never becomes a certified instrument.',
    },
    {
      claim: 'One measurement position tells me how loud the room is.',
      truth:
        'There is no single "room level" — SPL varies across the space with distance, reflections, and room modes, especially at low frequencies where seat-to-seat swings can be large. A reading describes the microphone position at that moment, nothing more. That is why professionals log the position with the measurement and average across positions when they need a room-wide picture.',
    },
    {
      claim: 'If it does not feel painfully loud, it cannot be damaging my hearing.',
      truth:
        'Damage risk is set by dose — level combined with exposure time — and levels far below the pain threshold are hazardous over hours. Occupational limits treat 85 dB(A) over an eight-hour day as the action level, with safe time roughly halving for every few dB above it. Ears also adapt during a long session, so "feels fine" is precisely the judgment a logged measurement exists to replace.',
    },
  ],
  warnings: [
    {
      text: 'Measurement may be approximate unless calibrated.',
      why:
        'Without calibration the meter cannot know how your specific microphone converts pressure to signal, so the absolute dB SPL value is an estimate rather than a verified reading.',
    },
    {
      text: 'Input clipping detected. SPL reading may be inaccurate.',
      why:
        'When the input chain clips, the loudest part of the waveform is flattened before the meter ever sees it, so the computed level under-reports the real acoustic event.',
    },
    {
      text: 'Phone microphone readings may vary by device.',
      why:
        'Different phone models — and even two units of the same model — use microphones and processing that can disagree by several dB, so readings from different devices are not directly comparable.',
    },
    {
      text: 'SPL is measured at the microphone position only.',
      why:
        'Sound level changes throughout a space with distance, reflections, and room modes, so the reading describes one point in the room, not the room as a whole.',
    },
    {
      text: 'Do not treat this as a certified legal sound-level meter unless approved calibrated hardware is used.',
      why:
        'Legal and occupational limits require instruments verified to standards like IEC 61672; an uncertified app reading carries no weight for compliance and must not be used to prove one.',
    },
  ],
  glossaryTerms: [
    'dB SPL',
    'dBFS',
    'peak level',
    'RMS',
    'crest factor',
    'A-weighting',
    'C-weighting',
    'Z-weighting',
    'meter ballistics (Fast/Slow)',
    'calibration',
    'equivalent continuous level (Leq)',
    'noise floor',
  ],
  relatedConcepts: ['spl-logging-vs-instant', 'measurement-integrity'],
};
