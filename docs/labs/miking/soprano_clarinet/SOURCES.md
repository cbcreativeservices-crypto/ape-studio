# A08a Soprano clarinet: SOURCES — also the REED-WOODWIND family keys (clarinet, bass clarinet, oboe, bassoon)

Lesson: `source_text/Soprano-Clarinet-Miking-Technique.txt` (L<line>). Lab 3 keys: `trumpet/SOURCES.md` §0.
Checked 2026-10-05 by Claude.

## 0. Family keys

| Key | Source | URL | Status |
|---|---|---|---|
| DPA-CL | DPA, "How to mic a clarinet" | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-clarinet/ | 200, read |
| DPA-OB | DPA, "How to mic an oboe" | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-an-oboe/ | 200, read |
| DPA-BSN | DPA, "How to mic a bassoon" | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-bassoon/ | 200, read |
| DPA-CLIPS | DPA instrument clips (U-CLIP) | see `flute/SOURCES.md` | 200 |
| Y-BSN-MECH4 | Yamaha, "Unique Features of the Bassoon, and How to Play" | https://www.yamaha.com/en/musical_instrument_guide/bassoon/mechanism/mechanism004.html | 200 |
| Y-BSN-MECH | Yamaha, "What Kind of Musical Instrument Is a Bassoon?" | https://www.yamaha.com/en/musical_instrument_guide/bassoon/mechanism/ | 200 |
| Y-YCL622 | Yamaha YCL-622II bass clarinet (index + specs) | https://usa.yamaha.com/products/musical_instruments/winds/clarinets/ycl-622ii/index.html | 200 |
| MET-CL | The Met, Clarinet in B-flat, Buffet, Crampon & Cie., 1924, obj. 504044 (API) | https://collectionapi.metmuseum.org/public/collection/v1/objects/504044 | 200 |
| MET-OB | The Met, Oboe, ca. 1900, obj. 504275 (API) | https://collectionapi.metmuseum.org/public/collection/v1/objects/504275 | 200 |

### 0.1 The shared DPA template (one paragraph, three pages)
DPA-CL / DPA-OB / DPA-BSN all open with the same sentence: "Aim the mic at the fingering holes, a third of the
length up from the bell, at a distance of 15-20 cm." (oboe page: "1/3 of the length up from the bell").
**Survey flag "up vs down from the bell" resolved:** DPA writes "up" on all three pages, **including the
bassoon**, whose bell is at the top (Y-BSN-MECH4: "the bell is high up at the top of the instrument"). DPA's
bassoon clip text says "Point it **downward**, toward the keys". So the geometric meaning is "**one third of
the instrument's length from the bell end, measured along the instrument toward the reed**"; for clarinet and
oboe that point is above the bell, for bassoon it is below it. The Bassoon lesson's "down from the bell" is
the correct reading of DPA's template (mark: lesson **CONFIRMED in meaning, DPA wording differs**).

### 0.2 Section spot (all four pages)
"Place the microphone between the two instruments, at about head height, and pointing straight down at the
floor, which should not be carpeted." Alternative: "in front of your… players, in between two players… at head
height… angled a bit downward."

### 0.3 Close mount (all four)
U-CLIP "fixed around the [instrument] at the top, close to the bell, but not necessarily pointed into the bell!
Point it toward the keys instead" (bassoon: "Point it downward, toward the keys"). DPA-MOUNT tip for "oboe,
clarinet, soprano saxophone and with the 4099U bassoon": "The 4099 holds a supercardioid directionality and
may end up creating an uneven timbre… Create as much distance as possible with the gooseneck and place the mic
head above the bell. Twist it backwards to the instrument and point it towards the upper joint (the keys
closest to the mouthpiece)."

### 0.4 Radiation (measured)
"The reported cutoff frequency of 1500 Hz for the radiation from the tone holes is the same as with the oboe."
"Meyer states the clarinet directivity to be similar to the oboe below 2000 Hz." Clarinet: "Sound radiation
at the 1000 Hz band is the strongest at the front. The most apparent directivity occurs at the 2 kHz octave
band where the sound is radiated in the direction of the bell"; "attenuation of around -13 dB behind the
player in relation to the front at -11 degrees elevation" (PL-2010 §4.3). Bell physics: "If you take the bell
off, it affects the very low notes but has less effect on higher notes in the first register." (UNSW-CL)

## a. Soprano clarinet rows

| Lesson claim | Verdict | Source |
|---|---|---|
| L13/L28 "15–20 cm… a third of the instrument length up from the bell", facing the holes | **CONFIRMED** | DPA-CL §0.1 ("lower-joint" is the lesson's own reading — DERIVED: 1/3 of 629 = 209.7 mm from the bell end lies on the lower joint) |
| L6 bell contributes "particularly for low fingerings" | **CONFIRMED by physics** (not in DPA-CL) | UNSW-CL bell quote; cite UNSW, not [1, 3] |
| DPA prefers omni, then wide cardioid / cardioid | CONFIRMED | DPA-CL "Use an omnidirectional mic… If more separation is needed… 4011A Cardioid… or 4015A Wide Cardioid" |
| L33 section spot head height | CONFIRMED | §0.2 |
| L37 U-CLIP near bell aimed at keys; gooseneck back to upper joint | CONFIRMED | §0.3 |
| L36 "supercardioid has different side nulls" | **DIFFERENT** | 125° off-rear, `trumpet/SOURCES.md` §0.1 |
| MDAT (ADD) | ADD | "Clarinet/Oboe — Place the microphone 2-4 feet in front of the instrument. Aim the microphone at the center of the instrument… Miking directly at the bell won't pick up the rest of the notes." (609.6–1219.2) |
| Length | Met 504044 "L. 62.9 cm (24 3/4 in.) without mouthpiece" (1924 Buffet) | TRIAL; quarter-wave of D3 146.83 Hz = 584.4 (DERIVED cross-check, cylindrical bore) |
| Range | "Clarinet \| D (147 Hz) / E³ (1319 Hz) … 92 dB" (DPA-TABLE) | High |
| Header names no instrument | FIX | — |
