/**
 * sourceHelp — the shared "test signal" lesson (owner request 2026-07-26). The
 * SOURCE chips in the effect labs (SINE 440 Hz, PINK NOISE, CLICK, …) are the
 * same set across every lab, so their "what is this signal" help lives here
 * once and rides the SAME two-tier popup as every control. Each source TYPE is
 * one control keyed by its generator mode (see sourceKeyForGen in FxLabScreen).
 *
 * Honesty: describes what the signal IS and why you'd probe an effect with it —
 * never a measurement claim.
 */
import type { LessonContent } from './types';

export const SOURCE_LESSON: LessonContent = {
  name: 'Test Signal',
  tagline: "What you feed the effect.",
  whatItIs:
    "SOURCE is the test signal you feed into the effect. You know exactly what goes in, so anything different coming out is the effect at work. That’s why the labs use simple, repeatable signals instead of music: a sine (one pure frequency), noise (every frequency at once) and clicks (short, sharp sounds). Each lab offers the sources that show its effect best. Pick one on the SOURCE key and tap ▶ at the top right. Every source plays at −20 dBFS.",
  controls: [
    { key: "sine", name: "SINE", definition: "One pure frequency with no harmonics. Any new tones, or any change in level or color you hear, come from the effect, not the source.", practical: "Each lab sets its own frequency, shown on the key. Use a sine to hear what an effect adds: through distortion, every new tone above it is a harmonic the effect created." },
    { key: "pink", name: "PINK NOISE", range: "−3 dB per octave (level per hertz)", definition: "Every frequency at once, with equal energy in each octave. It sounds evenly balanced from low to high, so you hear an effect’s whole frequency response in one listen.", practical: "Engineers test speakers and rooms with pink noise because each octave gets the same energy, much as we hear pitch. Here, a boost, cut or notch shows up as a change in the color of the hiss." },
    { key: "white", name: "WHITE NOISE", range: "0 dB per octave (flat per hertz)", definition: "Every frequency at once, with equal energy per hertz. Each octave up holds twice as many hertz, so white noise sounds brighter and hissier than pink.", practical: "Use it to hear what an effect does to the highs. A flanger’s or phaser’s moving notches stand out clearly against bright hiss." },
    { key: "brown", name: "Brown noise", range: "−6 dB per octave", definition: "A dark noise that falls 6 dB per octave: lots of low end, like a deep rumble, with little hiss.", practical: "Use it to hear what an effect does to the lows, since most of its energy sits there." },
    { key: "blue", name: "Blue noise", range: "+3 dB per octave", definition: "A bright noise that rises 3 dB per octave, the opposite tilt to pink. Most of what you hear is upper-mid and high hiss." },
    { key: "violet", name: "Violet noise", range: "+6 dB per octave", definition: "The brightest noise, rising 6 dB per octave: almost all high-frequency hiss, with very little low end." },
    { key: "click", name: "CLICK", definition: "A short, sharp sound that repeats at a steady rate. Each click starts the effect fresh, so you can see and hear every echo or decay on its own.", practical: "Use it for delay and reverb. The gap between repeats is the delay time, and the way the sound fades after each click is the decay." },
    { key: "burst", name: "BURST", definition: "A short tone that switches on and off. You hear how an effect reacts when a sound starts and when it stops.", practical: "The start shows how fast a processor grabs a sound; the stop shows how it lets go. With reverb, the stop leaves the tail on its own, so you hear it fade." },
    { key: "sweep", name: "Sweep", definition: "A tone that glides from low to high frequencies, so one pass visits each frequency in turn and you hear the effect change with pitch.", practical: "Use it on EQ and filters: the tone gets louder or quieter as it crosses a boost or a cut. Through a comb filter it rises and falls many times." },
    { key: "additive", name: "Harmonic tone", definition: "A tone built from a fundamental plus many harmonics, richer than a sine. You hear the effect act on many frequencies at once, as it would on a real instrument.", practical: "Compare it with SINE through the same effect. If the two change differently, the effect treats some frequencies differently from others, which one sine can’t show." },
  ],
  commonMistakes: [
    "“Music is the best way to judge an effect.” Music keeps changing, so you can’t tell the effect from the song. A known sine, noise or click shows what the effect does.",
    "“A steady tone shows echoes.” A sine blurs every repeat into one continuous sound. Use CLICK for delay and reverb, so each repeat stands apart.",
    "“Noise is just hiss, with nothing to listen for.” Noise holds every frequency at once, so any boost, cut or notch from EQ or a comb filter changes its color right away.",
    "“White noise is the neutral one, so pink must be missing highs.” Pink has equal energy per octave, so it sounds balanced. White has equal energy per hertz, so it sounds bright.",
    "“The source level tells you how loud it is in the room.” Every source plays at −20 dBFS, a digital level, not a measured sound level. Loudness depends on your phone and its volume.",
  ],
  proTips: [
    "Match the source to the concept: SINE for pitch and harmonics, noise for frequency response, CLICK for time, BURST for how a sound starts and stops.",
    "Keep ▶ playing and switch SOURCE. The effect settings stay where they are, so every difference you hear comes from the signal you chose.",
    "Pink noise is the quickest way to hear a filter-type effect: a boost, a cut, a notch or a moving sweep changes the color of the hiss in one listen.",
    "Long-press a choice in the SOURCE tray to open its entry in this lesson, then listen for exactly what it describes.",
    "Keep the volume moderate, especially with noise on headphones. Bright noise like white or violet tires your ears quickly, and tired ears judge effects badly.",
  ],
  formula: "Sine = one frequency. Noise tilt per octave: violet +6 dB, blue +3 dB, white 0 dB, pink −3 dB, brown −6 dB. Click and burst = short events in time; sweep = frequency changing over time. Each noise color is named for how its level per hertz changes every time the frequency doubles.",
  outcomes: [
    "Why a known test signal shows an effect more clearly than music.",
    "How a sine, noise, a click and a burst each reveal a different side of an effect: harmonics, frequency response, time and reaction.",
    "What the color of a noise means: how its level tilts from low to high.",
  ],
  steps: [
    { do: "Tap the SOURCE key in the dock and pick a source.", notice: "The key shows the source you picked, and THE AUDIO PATH in LAB NOTES reads source → effect → output, at −20 dBFS · uncalibrated.", why: "You always know what goes in, so you can hear what the effect changes." },
    { do: "Tap ▶ at the top right, or tap the display.", notice: "The source plays through the effect. Tap again to stop.", why: "The effect now works on a signal you already know." },
    { do: "While it plays, pick a different choice on the SOURCE key.", notice: "The sound changes at once, while every effect setting stays where you left it.", why: "Same effect, different signal: each source shows a different side of the effect." },
    { do: "If your lab offers CLICK, choose it and listen to the space after each click.", notice: "Each click stands alone, so any repeat or tail you hear after it comes from the effect.", why: "Short sounds split a time effect into parts you can hear one by one." },
    { do: "Long-press a choice in the SOURCE tray.", notice: "This lesson opens at that source’s entry.", why: "Each source is chosen for what it reveals, and its entry tells you what to listen for." },
  ],
};
