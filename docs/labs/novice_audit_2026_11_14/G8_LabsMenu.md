# G8 · The way IN: Learning Labs fork, Labs menu (both sections), category screens

Walked 2026-11-14 at 390 x 844, member, sound off. Real path walked: Home → OPEN LABS → LEARNING LABS fork → EXPLORE FUNDAMENTALS / EXPLORE ADVANCED LABS. The harness link `#labpreview/EarLab` shows BOTH sections on one page (6,960 px tall); the real app shows one section per page (Fundamentals ≈ 1 section, Advanced 5,406 px ≈ 7 phone screens).

---

## Page 1 · LEARNING LABS fork ("Choose your path") · Home → OPEN LABS (no harness link)

| Field | Finding |
|---|---|
| First look | Two big cards: "Audio Fundamentals" and "Advanced Training Labs". Reads as "pick beginner or advanced". Good instinct. |
| Overwhelm | 1. Two choices, short text. |
| Knows what it is learning? | Partly. "The bedrock of professional audio: how sound behaves, how we hear it, and how signal moves through a system" is clear. "Advanced … across every audio discipline" says nothing about who it is for. |
| Knows what to do first? | Partly. A beginner taps Fundamentals (right), but nothing SAYS "new to audio? start here". The 🎓 "Required for every Academy certificate" line is the strongest cue and it is about certificates, not about readiness. |
| Words they would not know | "signal" (in "how signal moves through a system"), "discipline". |
| Follows / continues? | Yes. |
| What works | Only two choices; the certificate line gives a reason to start with Fundamentals; the member copy has no selling. |
| Suggestions | 1. Add one plain line on the Fundamentals card: "New to audio? Start here." (S) 2. On the Advanced card, say who it is for: "When you know the basics — pick any subject you work in." (S) 3. Consider a third small link, "Not sure? Take the first lab for me", that opens Understanding Level & Amplitude directly (M). |
| Hobbyist | Will go straight to Advanced, which is fine; the fork costs them one tap. |

---

## Page 2 · AUDIO FUNDAMENTALS menu · EXPLORE FUNDAMENTALS (harness: top half of `#labpreview/EarLab`)

| Field | Finding |
|---|---|
| First look | The amber title, then the first tile pair "Understanding Level & Amplitude" / "Foundations of Sound" under the heading "Sound · 4 Labs". The eye takes the page for "a catalogue of lab tiles in groups". |
| Overwhelm | 2. Sixteen tiles in three groups (Sound 4, Acoustics 3, Signal 9). Calm for the first screen; the Signal group (Nyquist, quantization, normalling) is where a beginner starts to feel lost. |
| Knows what it is learning? | Partly. The group names (Sound, Acoustics, Signal) are good plain words, but the one-line group descriptions that exist in the catalog ("What sound is and how we hear and capture it…", "How sound behaves in real spaces…") are NOT shown on this page (they only appear on the old LabCategory screen). The intro says "The essentials — level and amplitude, the foundations of sound, and wave physics". |
| Knows what to do first? | Partly. The first tile (top-left) is in fact the right first lab (Understanding Level & Amplitude: "learn it once, recognize it everywhere"), but nothing says so. Reading order on a 2-across grid is not obvious: a beginner may take "Foundations of Sound" (bigger idea, friendlier name) first. |
| Words they would not know | On the first screen: "amplitude", "phase", "harmonics", "wavelength", "plosives", "off-axis", "proximity", "pickup patterns", "dispersion", "modes", "reflections". Further down: Nyquist, aliasing, bit depth, quantization, dither, A/D, D/A, spectrogram, waterfall, correlation, LUFS, RMS, VU, normalling, thru, full-normal, half-normal, headroom, noise floor, unity gain. Most tile blurbs are lists of terms, so a beginner meets 30+ unknown words before opening anything. |
| Follows / continues? | Yes, they can open a lab. They would not know which order the 16 labs are meant to be taken in, and the tiles do not show which ones are done (there is no ✓ on this menu; the old category screen had one). |
| What works | Glass tiles with art look inviting; Sound → Acoustics → Signal is a sensible order; "learn it once, recognize it everywhere" is an excellent beginner promise; "Choose a lab to hear it, see it, measure it, and take it apart" sets the hands-on tone. |
| Suggestions | 1. Mark the first lab clearly: a small "START HERE" tag on Understanding Level & Amplitude (and, if wanted, "then" on Foundations of Sound) (S). 2. Show each group's one-line description under its heading (the text already exists in labCatalog `description`) so "Signal" is explained before its nine tiles (S). 3. Rewrite tile blurbs so the first line is what you will be able to understand, not a term list, e.g. Digital Audio Systems: "How sound becomes numbers in a computer — and what can go wrong" before "Sampling, Nyquist…" (M, copy across ~16 tiles). 4. Show a quiet ✓ on a tile whose lab is done (the old category row had it; the tile menu lost it). No counts, just the mark (S/M). 5. Blurbs are cut at three lines (13 of 16 Fundamentals tiles end in "…" at 390 wide, e.g. Room Design shows 48 of 160 px; Signal Chain Builder shows only "This rack's fixed order: Generator → EQ → Comp → …"). Either shorten the blurbs to fit or let the tile say the first sentence only. Signal Chain Builder's visible words are the worst first impression on the page (S). |
| Hobbyist | Will skim. Trips on nothing, but may wonder whether to skip Fundamentals; a line "already know the basics? the certificate still needs these" would set expectations. |

---

## Page 3 · ADVANCED TRAINING LABS menu · EXPLORE ADVANCED LABS (harness: lower half of `#labpreview/EarLab`)

| Field | Finding |
|---|---|
| First look | "ADVANCED TRAINING LABS / Members-only hands-on labs", then "Audio Electronics · 2 Labs" with Vacuum Tube and Amplifier tiles. The first subject a newcomer sees is tubes and amplifier classes, the hardest physics in the catalogue, because the subjects are A→Z. |
| Overwhelm | 3. 18 subjects, 49 tiles (7 of them Miking families holding 128 lessons), about seven phone screens of scrolling. No search, no "where do I start". |
| Knows what it is learning? | Partly. Subject names are mostly plain (Dynamics, Mixing, Live Sound Reinforcement), but some are not (Modulation, Phase, Membranophones/Idiophones/Aerophones/Chordophones). |
| Knows what to do first? | No. Nothing points a beginner to a first lab. A→Z order puts Audio Electronics, Distortion, Dynamics first; Mixing and Instruments & Recording, the subjects most beginners came for, are 3-4 screens down. |
| Words they would not know | Tile titles/blurbs: Electron View, amplifier classes, load, clipping, saturation, aliasing, threshold, ratio, attack/release, envelope, downward expansion, range, hold, chatter, brickwall ceiling, gain reduction (GR), De-Esser, sibilance, bell, shelves, pass filters, Q, Membranophones, Idiophones, Aerophones, Chordophones, Foley, wavelength, fret fractions, intervals, specs, polar patterns, beatmatching, stems, translation, LUFS-type terms, cents grid, comma, Just, meantone, temperament, Faraday threshold, Lissajous, Mid/Side, mono-fold, binaural, VCO/VCF/VCA/LFO, sidebands, FM, RT60, pre-delay, damping, formants. |
| Follows / continues? | Yes, any tile opens. A beginner would probably stop scrolling around Dynamics/Ear Training and pick whatever name sounds friendliest. |
| What works | Subject headings with lab counts help scanning; the tile art makes each subject feel real; the Miking family subtitles ("Miking drums — kit, hand, concert — and speaker cabinets") translate the Greek names; the "17 Miking Lab Lessons" line tells you a tile holds a whole course. |
| Suggestions | 1. Without changing the A→Z order, add a small top card "New here? Good first labs: Beginning Mixing · Microphone Selection · Compression" (or whichever the owner picks) that jumps to those tiles (M). 2. Show each subject's one-line description under its heading (text exists in labCatalog) (S). 3. Instruments & Recording: rename the visible line under each family name to begin with the everyday word, e.g. "Membranophones — drums" in the title or "DRUMS & DRUM-LIKE" as a small over-title; a beginner looking for "how to mic my guitar" will not know guitar = Chordophone (S). 4. In Instruments & Recording, Microphone Selection Lab is last, after 128 miking lessons and Bass Guitar Physics. Put it first in the group, or say on each Miking family tile "Tip: Microphone Selection first" (S). 5. "Speaker cabinets" under Membranophones will confuse anyone (a speaker is not a drum); say in the subtitle "(and the guitar/bass amp speakers, kept with the drums)" or move the cabinet note to Chordophones' subtitle where electric guitar lives (S). 6. Same three-line blurb cut as Fundamentals: 21 of 49 Advanced tiles end in "…" at 390 wide (e.g. Sports & Broadcast "…body mi…", Bass Guitar Physics "fret fractions ↔ … intervals", Microphone Selection "make a defensible choice — …", Sound Systems, DJ Systems, Drum Tuning, Cymatics, Post-Production); tighten the copy (S, copy). 7. Consider a sticky subject index (chips: Mixing · Miking · Dynamics · Live Sound …) at the top to jump down a 7-screen page (M, SHARED with Fundamentals menu). |
| Hobbyist | Knows Compression/EQ/Mixing and will find them; the Greek family names slow them down too ("Aerophones?"); will like that every family states "N Miking Lab Lessons". |

---

## Page 4 · LabCategoryScreen (subject screen, `labs/:id`) — NOT REACHED ON SCREEN

Reason: the screen is not in the preview harness and the only way in is the `labs/:id` deep link; opening `http://localhost:8142/labs/instruments` in the web build landed on Home, not the category screen. No menu button in the app navigates to it (the glass-tile menu replaced it). Reviewed from source (`src/screens/lab/LabCategoryScreen.tsx`):
- It shows the subject's plain one-line description at the top and collapsed rows with a ▸ caret, an OPEN button only after expanding, and a ✓ for a finished Fundamentals lab.
- For a beginner, two good things live ONLY here and are lost on the menu they actually use: the subject description and the ✓ done mark (Suggestions 2 and 4 above bring them to the menu).
- The two-step "expand, then OPEN" is extra work a beginner does not need; if this screen ever returns, show the blurb and OPEN together.

---

## LAB VERDICT · The way in

**Beginner's journey:** The fork screen is calm and the beginner correctly picks Audio Fundamentals. The Fundamentals menu is attractive, and its first tile is the right first lab, but nothing says "start here" and the tile blurbs are lists of jargon cut off after three lines. The Advanced menu is a seven-screen A→Z catalogue that opens on vacuum tubes; a newcomer has no way to know where a first project would be, and in Instruments & Recording the Greek family names hide where "my guitar" or "my voice" lives, with Microphone Selection placed last.

**3 biggest orientation problems**
1. No "start here" anywhere: not on the fork, not on either menu.
2. Tile blurbs are term lists and 34 of 65 are cut at three lines on a phone, so the visible words are often the hardest ones.
3. Subject descriptions exist in the data but are not shown; A→Z order puts the hardest subject first in Advanced; the miking family names need an everyday word.

**3 best things**
1. Two-way fork with a reason (certificate) to start with Fundamentals.
2. Sound → Acoustics → Signal order, and "Understanding Level & Amplitude" sits first with the line "learn it once, recognize it everywhere".
3. Tile art + subject headings + "N Miking Lab Lessons" make the catalogue feel real and scannable.

**First 30 seconds (rewrite suggestion)**
On the Fundamentals menu, under the title: "New to audio? Start with the first tile — Understanding Level & Amplitude — then Foundations of Sound. Each lab takes you step by step." A START HERE tag on that tile. Under each subject heading its one-line plain description. On the Advanced menu: a top card "Pick the subject you work in. Good first labs: …", and in Instruments & Recording, "Microphone Selection Lab — start here before the miking lessons" as the group's first tile.
