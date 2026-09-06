# Stage tuners — what guitarists and bassists actually like and hate (research, 2026-09-06)

Independent research pass before designing the full-screen tuner for the Audio Tools. Sources are gigging-musician forums (TalkBass, SevenString, Steel Guitar Forum, Seymour Duncan, Fractal), 2026 buyer's guides (Guitar World, Guitar Player, Andertons), manufacturer material (Peterson, TC, Boss, Korg, Turbo Tuner) and a handful of app guides. Where a number is quoted it comes from a source, not from me. This is written to be compared against the owner's own ChatGPT report.

## 1. The one-paragraph answer

On stage a tuner is judged by four things, in this order: **can I read it from standing height under any light**, **does it lock fast and stay still**, **does it get my low strings right**, and **can I tune without the audience hearing**. Accuracy beyond about a cent is a studio and intonation concern, not a stage one. Everything players hate is a failure of one of those four: dim or washed-out displays, a needle that hunts, a tuner that ignores a low B or reads it an octave off, and an app that listens to the room instead of the instrument.

## 2. What players like

### Readability from where they stand
- A **big note name** and a clear **sharp / flat direction** matter more than anything else. Players glance, they do not study. Boss's 21-segment LED meter with a High-Brightness mode is praised specifically because it "cuts through the glare" at outdoor festivals; Peterson's HD screens and TC's PolyTune 3 get the same praise for stage lights, and Peterson lets you change the background colour to suit the light.
- **Strobe displays can be read from farther away than a needle**: you only have to see whether the pattern has stopped moving, with no small calibration marks to read.
- Displays that **flip orientation** (headstock-mounted or upside-down pedal) are valued; it is a small thing that removes a stage annoyance.
- **Colour as a second channel, never the only channel.** Green for in-tune is universal; some tuners run a violet → blue → cyan → green → yellow → orange → red spectrum so the magnitude of error reads as colour. Red/green-only indication is a real problem for colour-blind players, and one buyer's guide calls a tuner that inverts red/green a "dangerous design choice that increases error risk under stress".

### Speed and stillness
- The ideal is a reading that **locks within a couple of hundred milliseconds and then does not move**. The praised pedals (Pitchblack, PolyTune, TU-3, StroboStomp) are described as "tracks super fast" and "instant-read"; apps are criticised for the opposite. One musician's side-by-side found "most apps were 150–250 ms behind" a Peterson hardware tuner.
- Players want the needle or strobe to settle rather than flicker. A cents number that changes too rapidly to be read is called out as useless; professional tuners "maintain stable, readable cent readings".

### Low strings that just work
- Bassists and 7/8-string players judge a tuner almost entirely on the **low B / low F#**. A B1 fundamental is about 61 Hz, so it simply takes longer to measure, and cheap tuners either lag badly or never lock. Praised: Sonic Research Turbo Tuner ("A+ tracking for the open B"), TC Unitune, Peterson StroboClip HDC, Korg Pitchblack ("tracks super fast and super accurate, even on my 8 string", down to Drop E1), Boss TU-3 (tracked F#1 and even F#0 on bass).
- Players have learned workarounds and expect a good tuner not to need them: play the **12th-fret harmonic**, pluck **away from the bridge**, roll tone off, and use a clean pickup setting so the fundamental dominates.

### Silence and workflow
- **Muting while tuning is professional etiquette**: "there's no musical downside to always muting to tune". Pedal tuners mute the output; players who need pitch reference ask for it in the wedge rather than "blipping the audience".
- **Presets and reference pitch** are expected, not luxuries: drop and open tunings, capo transposition, A4 selectable from at least 432 to 444 (orchestras at 441–443 are a real use case), and on Peterson the **sweetened tunings** that compensate for a guitar's natural intonation errors.
- A **polyphonic strum check** (PolyTune) is liked as a fast between-songs sanity check — "perfect for on-stage adjustments when you're in a hurry" — but not as the tuning itself.

### Accuracy, honestly stated
- Typical tuner spec is ±3 cents; good pedals ±1 cent; strobe ±0.1 cent, and one strobe mode claims 0.02 cents. For a gig, "you would have to be off by quite a bit for it to be noticeable to an everyday audience member", though two cents is audible to a player with excellent pitch. Players like a tuner that **says what it is**: a chromatic needle at ±1 cent and a strobe at ±0.1 are both respected; a needle that pretends to strobe precision is not.

## 3. What players hate

| Complaint | Where it comes from | What it costs on stage |
|---|---|---|
| **Dim, glossy or low-contrast display** | LCDs without backlight, small clip-ons, phone screens at auto-brightness | Unreadable in sunlight or under wash lighting; the player bends down and squints between songs |
| **Hunting needle / flicker** | Old moving-needle designs "overshoot the note and then settle back down"; cheap DSP that re-detects every frame | The player chases the needle, over-corrects, and takes three times as long |
| **Slow or missing low-B detection** | Clip-ons (Snark "significant latency on the B", PolyTune clip "doesn't always track" it); older TU-2 "didn't track well for Ab on bass" | Bassist cannot trust the tuner on the one string that matters most |
| **Octave-wrong reading** | Low fundamentals are weak; the tuner "locks onto an overtone" — plucking near the bridge is the most common cause; fresh strings and sympathetic ringing make it worse | Player tunes to the wrong octave's error, or gives up |
| **Listening to the room** | Phone apps on the mic: "unreliable in noisy environments", can read the PA or the drummer | Useless at soundcheck, worse mid-set |
| **Latency** | App processing and display pipelines, 150–250 ms behind hardware | Feels mushy; the player overshoots |
| **Audible tuning** | Anything without a mute path | Unprofessional; audience hears every string |
| **Screen locks / dims** | Phone auto-lock while the tuner is open | The tuner disappears exactly when needed |
| **Red/green-only in-tune cue** | Most cheap LED designs | Invisible to colour-blind players, ambiguous under coloured stage light |
| **Hidden or fiddly reference and preset settings** | Menu-diving to change A4 or drop tuning | Nobody changes them on stage, so they must be one tap away or preset before the set |
| **Polyphonic-only readings** | "About 3 cents" in poly mode | Players with good ears "could hear a tuning problem long before polyphonic mode could tell them" |

## 4. Best practices distilled (what the field agrees on)

1. **Design for a glance from standing height**: note name first, direction second, magnitude third, numbers last. High contrast, no gloss, works in dark and in sunlight, orientation-flippable.
2. **Lock fast, then hold still.** Detect in under ~200 ms where the signal allows, then damp the display so it moves only when the pitch really moves. A stable cents number beats a live one.
3. **Treat low strings as the acceptance test**, not an edge case. B0/B1 and F#1 must lock; below that, tell the player to use the 12th-fret harmonic rather than pretending.
4. **Never read the wrong octave silently**: show the octave, and prefer the fundamental over a louder overtone.
5. **Mute is part of the tuner.** Silent tuning must be one action, and the app must never emit sound while tuning.
6. **In-tune must be legible three ways**: colour, shape (arrows or strobe stillness) and a number, so it survives colour-blindness and coloured light.
7. **Reference pitch and tunings are set before the set, one tap deep**: A4 from 415 through 444 at minimum, drop/open presets, capo offset, and instrument presets (guitar, bass 4/5/6, 7/8-string).
8. **Be honest about precision**: state ±1 cent for the needle; offer a strobe view for the players who want ±0.1 and intonation work, and label it as such.
9. **Keep the screen awake and full-brightness while the tuner is open**, and let the player set it and forget it on a mic stand or the floor.
10. **Give a polyphonic strum check if you can, as a check, not as the tuner.**

## 5. Why an app tuner on stage is a different problem (and what that means for us)

Hardware wins on stage for three reasons and none of them is accuracy: it is wired to the instrument so the room does not matter, it mutes the output, and it reads instantly. A phone with a microphone cannot do the first two. So the honest positioning for our full-screen tuner is:

- **Practice, rehearsal, soundcheck, and the quiet moment before walking on** — where it can genuinely beat a clip-on on readability and information.
- **On stage only as a visual companion**: a big, bright, stable display the player can see from the floor, with the honesty notice that the mic is listening to the room.
- Where we can win outright: display quality, a real strobe view, low-string handling that says what it is doing, colour-blind-safe indication, presets and reference pitch that are one tap away, and no screen-lock surprises.

## 6. What the app already has (so the comparison starts from facts)

The Frequency Counter & Tuner's tuner mode (`src/screens/tools/FrequencyCounterScreen.tsx`) already provides: note name, octave and cents against a selectable A4 (432, 435, 438, 440, 441, 442, 443, 444); a ±50 cent arc needle at 0.9° per cent with a green ±5 cent zone; a second linear cents scale with a ±5 cent in-tune band; an in-tune colour state at under 1 cent; and the shared YIN pitch engine with the frequency counter. What it does not have, against the field above: a full-screen stage layout readable from the floor, a strobe view, display damping and hold behaviour, explicit low-string handling and octave display prominence, drop/open/capo presets and instrument presets, a mute-aware "silent" mode, keep-awake, colour-blind-safe multi-channel indication, and an honesty line about the microphone.

## 7. Sources

Forums and threads: [SevenString — pedal tuner for low tunings](https://sevenstring.org/threads/pedal-tuner-for-low-tunings.315252/) · [TalkBass — tuner that works on low B](https://www.talkbass.com/threads/tuner-that-works-on-low-b-string.1406178/) · [TalkBass — pedal tuners, how low can they go](https://www.talkbass.com/threads/pedal-tuners-how-low-can-they-go.936138/) · [TalkBass — clip-on and the low B](https://www.talkbass.com/threads/clip-on-tuner-and-the-low-b.1684682/) · [TalkBass — best tuner for bright sunlight](https://www.talkbass.com/threads/best-tuner-for-bright-sunlight.445718/) · [Steel Guitar Forum — best display for bright daylight gigs](https://bb.steelguitarforum.com/viewtopic.php?t=393160) · [Steel Guitar Forum — strobe or needle](https://bb.steelguitarforum.com/viewtopic.php?t=191943) · [Seymour Duncan forum — strobe vs needle vs stream](https://forum.seymourduncan.com/forum/amplifier-central/195857-tuners-strobe-vs-needle-vs-stream) · [Fractal forum — tuner slow](https://forum.fractalaudio.com/threads/tuner-slow.41717/) · [HomeRecording — 5-string bass tuner](https://homerecording.com/bbs/threads/5-string-bass-tuner-is-it-just-me.411837/) · [PRS forum — intonation and tuning devices](https://forums.prsguitars.com/threads/intonation-and-tuning-devices.60048/)

Guides and reviews: [Guitar World — best guitar tuners 2026](https://www.guitarworld.com/features/the-best-guitar-tuners) · [Guitar Player — best guitar tuners 2026](https://www.guitarplayer.com/gear/best-guitar-tuners) · [Guitar Player — best clip-on tuners](https://www.guitarplayer.com/gear/best-clip-on-tuners) · [Andertons — tuner guide](https://www.andertons.co.uk/guitar-tuner-guide) · [Powers of 10 — tuner pedals tested](https://powersof10.com/best-tuner-pedals/) · [Premier Guitar — PolyTune review](https://www.premierguitar.com/gear/tc-electronic-polytune-poly-chromatic-tuner-review) · [Kevin Kretsch — PolyTune practical review](https://drkevguitar.com/2012/07/18/polytune-a-practical-review/) · [Carvin Audio — how accurate is enough](https://carvinaudio.com/blogs/guitar-bass-education/guitar-tuner-accuracy-how-accurate-is-enough) · [Tape Op / Jack Endino — tuning nightmares](https://www.endino.com/archive/tuningnightmares.html)

Apps and technique: [guitartuner.io — apps vs hardware](https://guitartuner.io/resources/tuning-apps-vs-hardware) · [DeathCloud — do I need a tuner pedal](https://deathcloud.com/blogs/info/do-i-need-a-tuner-pedal) · [Metro Gnome — why the tuner shows the wrong note](https://metrognome.co.za/blog/guitar-tuner-showing-wrong-note.html) · [Tunemode — how to tune a bass](https://tunemode.io/blog/how-to-tune-a-bass) · [Tunable — concert pitch reference](https://tunableapp.com/concert-pitch/) · [Turbo Tuner ST-122 manual](https://www.turbo-tuner.com/media/ST122_Manual.pdf) · [Ray Winstead — red/green colour-blind indicator lights](https://raywinstead.com/RedGreenColorBlindIndicatorLightSolution.shtml)
