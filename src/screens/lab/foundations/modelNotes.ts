/**
 * Plain one-sentence model notes for the all-caps honesty badges in
 * Foundations of Sound, the Sound Playground, Wave Physics, Microphone
 * Principles and Speaker Placement (owner's
 * decision 3, 2026-11-14, S3 RackStage.modelNote: one plain sentence, sentence
 * case, at most ~90 characters, saying what the picture is and is not). The
 * disclosure stays on screen; only its wording changes. Keyed by the badge
 * text each module already passes, so a badge with no note here keeps
 * showing as before.
 */
export const MODEL_NOTES: Readonly<Record<string, string>> = {
  // Foundations of Sound
  'CONCEPTUAL MODEL — SLOWED FOR VISIBILITY': 'A picture of the idea, slowed down so you can see it. Not a measurement.',
  'ANALYTIC — LOG SPIRAL DRAWN EXACTLY · ORBIT SLOWED': 'The spiral is drawn exactly from the math; the moving dot is slowed down.',
  'ANALYTIC — THE EXACT RECIPE YOU HEAR · PHASE-LOCKED, SLOWED': 'Drawn exactly from the recipe you hear, slowed down so you can see it.',
  'ANALYTIC — THE WAVE TAKEN APART · SLOWED': 'The wave is taken apart exactly by the math, slowed down so you can see it.',
  'CONCEPTUAL MODEL — HORIZONTAL SCALE IS REAL (7 m ROOM)': 'Distances are real size (a 7 m room); the motion is slowed down.',
  'DRAWN FROM THE MATH — THE EXACT SUM (SLOWED)': 'The sum is drawn exactly from the math, slowed down so you can see it.',
  'SIMPLIFIED SENSITIVITY CURVE — NOT MEASURED DATA': 'A simplified hearing curve that shows the idea. It is not measured data.',
  // Sound Playground
  'CONCEPTUAL MODEL — SLOWED · WAVEFORM/SPECTRUM ANALYTIC, NOT MEASURED':
    'The air is slowed down; the waveform and spectrum come from the math, not a meter.',
  // Wave Physics (both module files use the same words)
  'ILLUSTRATIVE MODEL — GEOMETRIC/ANALYTIC, NOT A PRESSURE SIMULATION':
    'A teaching model drawn from geometry, not a full simulation of the room.',
  // Microphone Principles (checker K3 F-1, 2026-11-14)
  "MOVING-COIL DYNAMIC CUTAWAY — ILLUSTRATIVE MODEL · coil travel exaggerated ~1,000× · amber = induced current":
    "A model cutaway: the coil’s travel is exaggerated about 1,000×; amber is the induced current.",
  "CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASURED POLAR RESPONSE · color = the pattern’s sensitivity by angle, r(θ) = |A + B·cosθ|, × 1/d distance falloff":
    "A model of the pickup pattern, not a measured polar response; color is sensitivity by angle.",
  "CONCEPTUAL SOUND FIELD — ILLUSTRATIVE MODEL, NOT A MEASUREMENT · direct energy fading into the room glow; wavefronts slowed for visibility":
    "A model sound field, not a measurement: direct sound fading into the room, waves slowed down.",
  "ILLUSTRATIVE — conceptual approach scene + a simplified bass-boost (low-shelf) curve; real mics vary by design":
    "A model: the approach scene plus a simplified bass-boost curve; real mics vary by design.",
  "ILLUSTRATIVE — overall level loss off-axis + highs rolling off faster as the angle grows":
    "A model: the level drops off-axis, and the highs roll off faster as the angle grows.",
  "CONCEPTUAL — blue = the air blast (wind), amber = the voice; the voice always passes":
    "A concept picture: blue is the air blast (wind), amber is the voice; the voice always passes.",
  "CONCEPTUAL — the STAND is being shaken (red readout, bottom). The readout above the capsule shows how much of that shake actually arrives at the mic; with a shock mount you can watch the elastic bands take up the difference.":
    "A concept picture: the stand shakes (red readout); the upper readout shows how much reaches the mic.",
  "CONCEPTUAL PICKUP FIELD — ILLUSTRATIVE MODEL, NOT A MEASUREMENT · each capsule’s pattern |A + B·cosθ| × 1/d distance falloff, added together for this technique’s layout · the lit deck at the top is the stage":
    "A model of the capsules’ patterns added together, not a measurement; the lit deck is the stage.",
  "THREE SYNCHRONIZED PANELS — mic & hand · polar pattern (ghost = intended cardioid) · frequency response. ILLUSTRATIVE MODEL":
    "A model: mic and hand, polar pattern (ghost = intended cardioid), frequency response.",
  // Speaker Placement (checker K3 F-1)
  "CONCEPTUAL LEVEL MAP — ILLUSTRATIVE MODEL, NOT AN SPL PREDICTION":
    "A model level map that shows the idea. It is not an SPL prediction.",
  "CONCEPTUAL LEVEL MAP — ILLUSTRATIVE, NOT SPL":
    "A model level map that shows the idea. It is not an SPL prediction.",
};

/** The plain note for a badge, or undefined (the badge then shows as before). */
export function modelNoteFor(badge: string | undefined): string | undefined {
  return badge ? MODEL_NOTES[badge] : undefined;
}
