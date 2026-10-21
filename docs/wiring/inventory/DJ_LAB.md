<!-- Phase 0 inventory (read-only agent report, 2026-10-20). Findings are claims to verify, not decisions. -->
# Wiring inventory — DJ Systems Lab

# DJ lab wiring and signal-flow audit (branch dj-lab, read-only)

The wiring truth lives in a few pure data files that a test can import directly. I found 10 places that are wrong or inconsistent. The biggest are: PA L sits on opposite sides of the room on Screen 4 and Screen 20; the plug "fits" table does not match what plugs physically fit; the drawn powered speaker has no MIC/LINE switch even though a capstone fault depends on one; and five test files cited in source comments do not exist. Paths below are relative to `/home/user/ape-studio/src/screens/lab/dj/` unless they start with `test/` or `docs/`.

---

## 1. Screens and scenes that draw or describe cables, jacks, connectors or flow

| Page / scene | File | What it draws or says |
|---|---|---|
| p01 Welcome | `pages/p01Welcome.tsx:168-197` | Booth top view (deck A · mixer · deck B) and listening perspective. No cables. |
| p02 Gear, laptop + controller | `pages/p02Gear.tsx:83-125` | USB-A to USB-B laptop→controller; the controller's two MASTER OUT XLR leads to speaker input plates. |
| p02 Gear, audio interface | `pages/p02Gear.tsx:127-170` | USB into the interface's USB-C; OUT L/R on TRS to speaker plates. |
| p02 Gear, vinyl / modular systems | `pages/p02Gear.tsx:405-470`, `349-399` | RCA pairs turntable→PHONO; player→LINE; a LAN link "data only, no audio". |
| p03 Connect, rear stack | `pages/p03Connect.tsx` + `geometry/dressGeometry.ts:140-340` (`lane3`, `run3`, `groundRun3`, `parked3`) | Source rear above mixer rear, RCA leads in their own lanes, turntable ground wire with spade lugs, IDENTIFY socket blurbs (`p03Connect.tsx:161-175`). |
| p04 Build, system map | `art/SystemMap.tsx` + `geometry/mapGeometry.ts` (`routeOf`, `LANE`, `FLAG`) + `dressGeometry.ts:346-1076` (`lane4`, `run4`, `hang4`, `patchLabels4`) | Every audio cable and mains cord, seen from behind and mirrored; speaker plates; power strip; glow when audio flows (`speakerLit` `dressGeometry.ts:387`). |
| Rear panels (shared) | `art/RearPanels.tsx` (`PlayerRear`, `TurntableRear`, `MixerRear`, extras REC OUT / MIDI OUT / CLOCK / USB 2) | Socket legends. MASTER drawn as male XLR (`:226-227`). |
| Cable renderer | `art/cables.tsx` (`CableRun`, `styleOf`, `CableFlag`) | Per-kind pattern, plug faces, glow only while "live". |
| p16 Laptop | `pages/p16Laptop.tsx` + `art/laptopArt.tsx` | USB laptop→mixer and laptop→controller; software output-device window; USB pairs. |
| p17 Vinyl | `pages/p17Vinyl.tsx` (PHONO view) + `art/vinylArt.tsx` | Cartridge → phono chain, rear panels with leads and ground wire, RIAA plot; ROOM view with electrical-path overlay. |
| p18 DVS | `pages/p18Dvs.tsx` + `art/dvsArt.tsx:73-232` | Turntable leads + ground → PHONO 1 + GND, USB to laptop, a signal map. |
| p19 Mic | `pages/p19Mic.tsx` + `art/MicGear.tsx` | Mixer front mic section (MIC 1/2 combo jacks, phones jacks), mic on its cable, wireless receiver (MIC/LINE switch, BAL OUT); room plan with feedback paths (`art/PlanView.tsx`). |
| p20 PA, HANDOFF | `pages/p20Pa.tsx:68-120` + `art/VenueGear.tsx` (`StageBox` inputs 13 DJ L / 14 DJ R / 15 MIC / 16 SPARE) | MASTER L/R to the stage box; ROOM plan; SYSTEM crossover plot. |
| p21 Rec | `pages/p21Rec.tsx:58` + `art/RecorderGear.tsx:124` | Mixer rear + handheld recorder joined by a split lead ("two RCA plugs into one small stereo plug") into its LINE IN. |
| p22 Hybrid | `pages/p22Hybrid.tsx:96-104` + `art/DrumMachine.tsx` (rear: MIDI IN DIN, MIDI IN (A) TRS, MIDI OUT, OUT L/R TRS) | Drum-machine TRS→RCA into CH2 LINE; deck B's RCA leads pulled out; MIDI clock lead. |
| p23 Changeover | `pages/p23Changeover.tsx:110-135` + `art/EventFlow.tsx` + `art/eventBoardGeometry.ts:232-262` (`board23Cords`) | Signal-flow board (laptops/players → channels → master → outputs) and power cords incl. the ground-loop path. |
| p24 Capstone | `pages/p24Capstone.tsx:90-110` + `eventBoardGeometry.ts:263-296` (`board24Cords`) | Event board with taps; PA cards show "INPUT LINE/MIC". |
| Signal-order prose | `model/djModel.ts:13-38`, `docs/labs/dj/MODEL.md:22-43`, `engine/djEventRender.ts:1-34` | ASCII signal chain. |

## 2. Where the wiring truth lives as data (test-ready)

**`model/djModel.ts`**
- Types and lists:
  - `DeviceId` `:135`; `POWERED` `:136`
  - `JackId` `:139-144`: 8 RCA input jacks `ch{1,2}.{line,phono}.{L,R}`, `mix.phones`, `{paL,paR,boothL,boothR}.in`, `strip.1-8`
  - `PlugId` `:149-152`; `CableKind = 'rca'|'xlr'|'trs'|'phones'|'iec'` `:154`
- `PlugDef` `{id, kind, from, device, short, fits}` `:156-167`.
  - Jack groups: `LINE_PHONO_JACKS`, `SPEAKER_JACKS`, `STRIP_JACKS` `:169-171`.
  - **`PLUGS` `:173-192` is the "which plug fits which jack" table.**
  - `AUDIO_PLUGS` / `POWER_PLUGS` `:194-195`; `JACK_NAMES` `:197-204`.
- **`BUILT_PLUGS` `:207-214`** — the correct patch: A→ch1.line, B→ch2.line, mst.xlrL/R→paL/paR, bth.trsL/R→boothL/R, phones→mix.phones, `tt.*` = null.
- Level classes:
  - `LEVELS` `:124-129`: mic 2 mV, phono 5 mV, −10 dBV 0.316 V, +4 dBu 1.228 V
  - `PHONO_GAIN_DB = 36` `:131`
  - `sourceLevel` `:399` (TT with preamp PHONO = phono, else line)
- Routing functions:
  - `deviceLive` `:372`, `jackSource` `:381`
  - `selectedJacks` `:392` (USB → null)
  - **`channelRoute` `:415-429`** (`jackClass`, `tooHot`, `tooQuiet`)
  - **`speakerFeed` `:435`**, `phonesPlugged` `:444`, `systemBuilt` `:447`, `plugCorrect` `:454` (IEC = any outlet)
  - **`connect` `:464`** (refuses a non-fitting plug; one plug per jack)
- Power and hot-patching: `powerThump` `:482`, `speakerCabled` `:488`, **`hotPatchSpeakers` `:508-536`**.
- The output direction is structural: mixer outputs and player outputs are only ever fixed plug ends, never `JackId`s, so output-to-output is impossible.

**Geometry**
- `geometry/boothGeometry.ts:157-183`: `PLAYER_REAR_JACKS`, `MIXER_REAR_JACKS`, mirrored (ch2 left; `master.R` x170 left of `master.L` x200).
- `geometry/dressGeometry.ts:147-148`: `TT_REAR_JACKS` (gnd x56 left of outL x84).
- `geometry/eventGeometry.ts:13-19`: `MIXER_REAR_EXTRA` (rec.L/R, midiOut, clock, usb2).
- `geometry/mapGeometry.ts`:
  - `MAP.room` and `MAP.plate` `:36-47` (paR x95 left … paL x965 right)
  - `jackPt` `:61`, `fixedEnd` `:69`, `routeOf` `:111`
  - `farKindOf` / `fixedKindOf` `:160-161`
- `geometry/gearGeometry.ts:25`: `PLATE` (speaker plate: input, level, ac, power — no input switch).

**Event / Stage 2 models**
- `model/djEvent.ts`:
  - `MIC_INPUTS` `:43-46` (phantom MIC1 only), `micAlive` `:122`, `micSensDb` `:65`, `LINE_OVER_MIC_DB` `:64`, `MIC_INPUT_CLIP_AT_0DB` `:73`, `phantomPop` `:147`
  - `VenueState` `djL`/`djR`/`cable` `:226-245`; `venueHandoffOk` / `venueSwapped` `:255-256`; `UNBAL_HUM_DBFS` `:260`
  - `RecTap` / `REC_TAPS` `:286-303`
  - `ClockCable` / **`CLOCK_CABLES` `:324-329`**, `clockArrives` `:332`, `counterBpm` `:340`, `dmBpm` `:348`
  - Laptop `usb` / `charger` / `isolator` `:358-368`; `laptopHum` `:377`; `MAINS_HZ` `:382`
  - `EventRig.paLWall`, `paLIsolator`, `paRMic` `:400-410`
- `model/djLaptop.ts`: `UsbPair` `:45`; **`usbPairOf` `:64`** (CH1 = USB 1/2, CH2 = USB 3/4); `laptopFeeds` `:131`; `devicesSeen` `:137`.
- `model/djDvs.ts`: `dvsQuality` `:60-72` (requires `tt.rcaL/R` in `ch1.phono.L/R` and the mixer USB); `toneOnChannel` `:83`.
- `model/djVinyl.ts`: `gnd` `:56`; `HUM_HZ = 60`, `HUM_V`, `CART_V` `:73-76`; `wallForce` (inner wall = L) `:98`; `armMoveThumps` `:168`.
- `model/djChangeover.ts`: `sourceOf` `:38`, `onAir` `:64`, `programOn` `:71`, `wouldStop` `:78`.
- `model/djCapstone.ts`: `FAULTS` (`inject` / `fixed`) `:59-403`.

## 3. Concrete technical claims (with sources)

**Mixer connectors**
- MASTER OUT is balanced XLR, one per side, a mono channel each, a stereo feed being two cables (`djModel.ts:28,180-181`; `p03Connect.tsx:173`; `RearPanels.tsx:225` "MASTER OUT (BAL)"). Drawn as male XLR.
- BOOTH OUT is balanced, line level, 6.35 mm TRS, "each TRS is ONE mono channel… same plug shape as stereo headphones" (`p03Connect.tsx:174`; `djModel.ts:29,182-183`).
- Player RCA (white = L, red = R) goes to LINE; the raw turntable goes to PHONO, which adds "about 36 dB" and undoes RIAA; a line source in PHONO "overloads it… before the TRIM" (`p03Connect.tsx:164,170-171,445`; `djModel.ts:18-19,131`).
- The turntable has a PHONO/LINE preamp switch: "Never both, never neither" (`p03Connect.tsx:169`). Two phono stages sound "loud, boomy, distorted" (`p17Vinyl.tsx:312`).
- GND post: "a SIGNAL ground… not the mains earth" (`p03Connect.tsx:172`; `djVinyl.ts:25-29`). Turntable GND left of its outputs; mixer GND between CH2 and CH1 on the rear (`dressGeometry.ts:142-148`, `boothGeometry.ts:175`).
- Levels (`p03Connect.tsx:35-37`):
  - −10 dBV ≈ 0.3 V; +4 dBu ≈ 1.2 V; 0 dBu = 0.775 V
  - mic about 1–3 mV, needing 40–60 dB of gain
  - balanced input "takes the DIFFERENCE" (`:38`)
- DIGITAL OUT is coax, "never into an analog LINE input"; LAN carries "NO audio" (`p03Connect.tsx:165-166`).
- Powered speaker: "input switch (set LINE, not MIC) and a level knob" (`p04Build.tsx:33`). Input is a combo XLR/TRS (`mapGeometry.ts:15`; `gear.tsx:640,674`).
- Power order: sources → mixer → speakers last, speakers off first; never remove the earth pin (`p04Build.tsx:34-35,316`; `djModel.ts:476-481`).
- Mirror: from behind, CH2 and MASTER R are on the left (`p03Connect.tsx:429`; `p04Build.tsx:307`; `boothGeometry.ts:179`).

**Signal order in the mixer** (`djModel.ts:16-33`; `MODEL.md:24-43`): source → jack class (+36 dB + RIAA, then clip) → selector → TRIM → EQ → FILTER → CH CLIP (meter + pre-fader cue tap) → fader → crossfader → MIX BUS clip → { MASTER knob → XLR ; BOOTH knob → TRS ; phones MASTER side pre-MASTER knob }. Event version: program = music × dip + mic; BOOTH and REC take the mic only by its send; REC OUT is fixed level (`djEventRender.ts:16-23`).

**USB pairs**
- Stage 2: "deck 1 on USB 1/2, deck 2 on USB 3/4" (`p16Laptop.tsx:65,84`; `djLaptop.ts:64`).
- Stage 2b: "the mixer's USB 1 feeds CH 1 and USB 2 feeds CH 2" (`p23Changeover.tsx:54`; `eventGeometry.ts:10-11`; `djEvent.ts:27-28`).
- DVS: control in through PHONO 1 and over USB; music back on USB 1/2 (`p18Dvs.tsx:242,257`; `djDvs.ts:6-15`).

**Microphone**
- MIC 1 combo with +48 V is "the only input with it"; MIC 2 combo has no phantom (`djEvent.ts:14-16,43-46`; `MODEL.md:335-336`; `p19Mic.tsx:71`).
- GAIN +10…+60 dB; sends to BOOTH and REC "default OFF (the common factory setting)"; MASTER always carries the mic (`djEvent.ts:17-23`; `MODEL.md:341`).
- A wireless receiver's LINE output overloads the mic input "before the GAIN knob" (`p19Mic.tsx:733,758`).

**Stage box / PA**
- MASTER L/R into the stage box's DJ L / DJ R (13/14) on XLR; a swap is flagged; an unbalanced lead hums at −50 dBFS and rolls off at 9 kHz (`djEvent.ts:255-260`; `MODEL.md:415-417`; `djEventRender.ts:229` `LP_UNBAL` at 9000 Hz).
- PA L at house left (`p20Pa.tsx:52,63`; `djRoom.ts:8-14`).
- LR4 at 100 Hz with a mono sub; never a Y-cable for mono (`p20Pa.tsx:54,402,431-435`).

**Recording taps**
- REC OUT is RCA, "fixed-level copy of the mix before the MASTER knob"; BOOTH follows its knob; LOOPBACK hears only the computer (`djEvent.ts:25-26,299-303`; `p21Rec.tsx:50` "Mixers differ").

**MIDI clock**
- Mixer rear MIDI OUT (DIN) sends clock from the beat counter of the channel the CLOCK switch picks; 24 ticks a beat; tempo, not bar (`djEvent.ts:26-27`; `p22Hybrid.tsx:50`).
- 5-pin MIDI works; TRS-MIDI type A works; type B "fits but no MIDI arrives"; USB↔USB needs a host (`djEvent.ts:324-329`; `p22Hybrid.tsx:51,391`). The drum machine has MIDI IN DIN plus MIDI IN (A) on TRS (`DrumMachine.tsx` rear).

**Ground loops**
- Laptop charger on another circuit + USB hums at −42 dBFS, 60 Hz with its 3rd and 5th harmonics. Cures: battery, same strip ("often"), USB isolator; earth lift is refused (`djEvent.ts:370-387`; `p23Changeover.tsx:56,402`).
- Capstone: PA L on another circuit hums through its audio cable (`djCapstone.ts:186-216`).
- Capstone: PA R input switch on MIC, so the line feed overloads it (`djCapstone.ts:372-402`).

## 4. Wrong, questionable, or inconsistent

1. **PA L is on opposite sides of the room on two screens.**
   - Screen 4's map is drawn from behind the booth, i.e. from the audience side (deck B on the viewer's left), with PA R on the viewer's left (`mapGeometry.ts:3-6,38`, `MAP.room.paR: 95`, `paL: 965`; `p04Build.tsx:135` "PA R on the left"). That puts PA L on the DJ's left, which is house **right**.
   - Screen 20 / `djRoom.ts:8-14` / `PlanView.tsx:4-6` / `p20Pa.tsx:52,63` put PA L at house **left** (the DJ's right) and say "This lab draws PA L at house left".
   - The capstone's "hum from the left of the room" / "the right of the room" (`djCapstone.ts:189,375`) uses Stage 1 cables, so it is ambiguous.
2. **The `fits` table is not physical fit, but the code and the lesson say it is.**
   - `PlugDef.fits` is documented as "Which jacks it physically fits" (`djModel.ts:165`). Yet the BOOTH TRS plug cannot go in `mix.phones`, and the 6.35 mm headphone plug cannot go in a speaker's combo TRS input (`:182-184`). Both would fit on real gear.
   - Screen 3 teaches "the shape alone never proves two things belong together" and "the same plug shape as stereo headphones, a different job" (`p03Connect.tsx:174,430`). The model makes exactly that mistake impossible to try.
   - `mapGeometry.ts:127-130` has a branch "into another mixer jack (a mistake the tray allows)" that can never run.
3. **The drawn powered speaker has no MIC/LINE input switch.** `SpeakerRear` (`gear.tsx:620-655`: combo INPUT, THRU, LEVEL, ON·LIMIT, AC IN) and `SpeakerPlate` / `PLATE` (`gear.tsx:659-682`; `gearGeometry.ts:25`) have none. Screen 4's term (`p04Build.tsx:33`) and the capstone fault `PA_INPUT_MIC` (`p24Capstone.tsx:301-303`, as a chip only) rely on it.
4. **"USB 1/2" means two different things.**
   - Screen 16/18: USB 1/2 and USB 3/4 are audio channel pairs on one USB port (`djLaptop.ts:64`).
   - Screen 23: "USB 1" and "USB 2" are two physical ports, each feeding one channel (`p23Changeover.tsx:54,193,210-211`; `eventGeometry.ts:10-11`; `RearPanels.tsx:150,230`).
   - A learner can read "USB 2 → CH 2" against "USB 1/2 → CH 1" as a contradiction. The rear panel shows one "USB" in Stage 1/2 and "USB 1" + "USB 2" in 2b.
5. **Unbalanced 20 m run: 9 kHz roll-off is not realistic.** `LP_UNBAL = rbj(9000 …)` (`djEventRender.ts:229`; `MODEL.md:416`; `p20Pa.tsx:451` "loses top end"). A low-impedance line output into 20 m of cable (about 2 nF) rolls off far above audio. A 9 kHz corner needs a source impedance of roughly 9 kΩ, which fits a pickup, not a mixer output. The hum part is defensible; the roll-off is not.
6. **PA_HUM conflicts with the balanced-line lesson.** The mixer→PA L link is the balanced XLR MASTER OUT, yet the capstone says a different circuit makes "a ground loop through its audio cable" with audible hum (`djCapstone.ts:190`). Screens 3, 4 and 20 teach that balanced lines cancel this. On balanced gear this mostly happens through pin-1 problems or a poor CMRR; the debrief never says so.
7. **The MIDI clock reads the deck, not the channel.** `counterBpm` (`djEvent.ts:340-344`) always uses deck A for CH 1 and deck B for CH 2. On Screen 22 the drum machine's audio replaces deck B's cables in CH 2, but CLOCK = CH 2 would still report deck B's tempo. A real beat counter analyses the channel's audio.
8. **Phantom on "line gear on a combo jack"** (`p19Mic.tsx:71`). Phantom is normally present only on a combo's XLR pins, not its 6.35 mm part, so this is slightly misleading.
9. **TRS-MIDI "two wirings (type A and type B)"** (`p22Hybrid.tsx:51`). This is simplified: TS and other non-standard variants exist. Acceptable, but the claim reads as complete.
10. **Stale or minor inconsistencies:**
    - `djStage2.ts:217` comment says "50 Hz", and the test title `test/djStage2Engine.test.ts:388` says "a 50 Hz buzz", while `HUM_HZ = 60`. The test never checks the frequency.
    - `djEvent.ts:265` says the turntable-loop margin is "at about 60 Hz", but `TT_RUMBLE_HZ = 80`.
    - `VenueGear.tsx:6` puts the stage box "at the booth"; `p20Pa.tsx:64` says "at the side of the stage, about 20 m of cable away".
    - On the HANDOFF, the UNBALANCED run is drawn with `kind: 'trs'` plug faces on the mixer's XLR socket and the stage box's XLR female inputs (`p20Pa.tsx:110`), so the plugs drawn don't match the sockets.
    - `MODEL.md:341` says MIC→BOOTH and MIC→REC default OFF is "the common factory setting"; this is unverifiable, though the screen hedges with "many mixers" (`p19Mic.tsx:74`).
    - The mixer front has two headphone jacks (`MicGear.tsx:331-332`, 6.35 and 3.5) but there is only one `mix.phones` JackId.

**Where the "one generic mixer" caveat is and is not shown**
- Shown:
  - `MODEL.md:18-20`, `djModel.ts:13-14`, `djEvent.ts:9-11`, `djLaptop.ts:6`, `djDvs.ts:6`
  - Learner-facing "this mixer" / "real mixers differ" lines: p06 `:201,213`; p07 `:35`; p08 `:30`; p09 `:204,221`; p13 `:38-39,272,295`; p18 `:268`; p19 `:71,74,725`; p21 `:50`; p22 `:351`; p20 `:52` (house-left only)
- Not shown on the connector screens:
  - p01 never says it is one generic mixer.
  - p03 presents MASTER = balanced XLR, BOOTH = balanced TRS, the GND post position, and "+36 dB" with no "this mixer" (`p03Connect.tsx:173-174,180`); real BOOTH outs are often unbalanced, or RCA.
  - p04 states "MASTER OUT feeds the PA… BOOTH OUT… both on balanced cables" as universal (`p04Build.tsx:301`).
  - p16 states USB 1/2 → CH1, USB 3/4 → CH2 as fact (`:84`), with only a "this lab simulates…" note (`:226`).
  - p23 states the USB-port mapping as a Terms definition (`:54`).
  - p20 makes no "this venue" caveat about DJ L/DJ R on stage-box channels 13/14.
  - Several screens, Screen 3 among them, draw turntables with RCA sockets; many DJ turntables have fixed leads instead. Not stated.

## 5. Existing automated checks, and what is not checked

**Checked**
- `test/djRender.test.ts:139-200`, routing:
  - `systemBuilt`, `channelRoute`, `speakerFeed` on the built booth
  - `connect` refuses XLR→`ch1.line.L`, and one plug per jack
  - wrong selector hears nothing; line source in PHONO is `tooHot` and clips the phono stage
  - one RCA plug out silences that side
  - raw cartridge in LINE is more than 25 dB quieter than in PHONO
- `test/djLessons.test.ts:93-109`: `hotPatchSpeakers` cases.
- `test/djCables.test.ts`, geometry only:
  - clearance of every route and dressed run for the wired booth, the unwired booth, the Screen 4 fault, and every single move in `PLUGS[p].fits` (`:100-120,335-350`)
  - lane separation; turntable GND left of its outputs (`:251`); Screen 3 source jacks (`:691`)
- `test/djLab.test.ts:164-171`: rear sockets sit on their panels.
- `test/djEvent.test.ts`:
  - MIC1-only phantom, `micAlive`, `phantomPop` (`:50-70`)
  - venue handoff OK / swap / unbalanced hum; engineer gain leaves the MASTER meters alone (`:205-237`)
  - extra rear sockets clear the Stage 1 sockets (`:248-253`)
- `test/djHybrid.test.ts:24-62`: `CLOCK_CABLES` works flags (DIN and TRS_A yes, TRS_B and USB no); `clockArrives`; audio vs clock separation; deck B leads restored.
- `test/djStage2Engine.test.ts:335-347`: `laptopFeeds` pairs and device.
- `test/djStage2Engine.test.ts:388-398`: missing ground wire produces hum (level only, not frequency).
- `test/djStage2Engine.test.ts:416-460`: DVS quality and lock, and `toneOnChannel`.
- `test/djRecord.test.ts`: REC OUT is pre-MASTER, BOOTH follows its knob, LOOPBACK, mic only with MIC→REC.
- `test/djChangeover.test.ts`: `wouldStop`, `laptopHum` and its cures, earth lift refused, each laptop feeds only its own channel.
- `test/djCapstone.test.ts`: every fault reads unfixed when planted and fixed when repaired; compatibility; debrief.

**Not checked**
- No test pins the `PLUGS[*].fits` table itself (kind↔jack class, e.g. RCA not in speakers, XLR/TRS only in speakers) or `BUILT_PLUGS` as data.
- Nothing compares "fits" against physical reality (headphones↔TRS, booth TRS↔phones jack).
- Nothing checks that the cable kind drawn matches the socket kind (e.g. TRS plug on an XLR socket in `p20Pa.tsx:110`), or that speaker art carries the MIC/LINE switch the fault needs.
- No L/R swap check for Stage 1 cables (`A.rcaL`→`.R`, `mst.xlrL`→`paR.in`); only the venue has `venueSwapped`.
- No consistency test for PA L/R placement between `mapGeometry` (Screen 4) and `djRoom` / PlanView (Screen 20).
- No test of the USB-port vs USB-pair naming, or of `counterBpm` against what the channel actually hears.
- Hum frequency (60 vs 50 Hz) is not asserted anywhere.
- The 9 kHz unbalanced roll-off is not justified or tested.
- `powerThump` has no direct test that I found; it is reached only through pages.
- No test covers the selector-moved-while-hot warning (page-only, `p23Changeover.tsx:186`), and the model has no hot-patch for USB, phones or IEC.
- **Missing test files** cited by source comments:
  - `test/djModel.test.ts` (cited at `djModel.ts:4`)
  - `test/djEventRender.test.ts` (`djEventRender.ts:4`)
  - `test/djStage2Laptop.test.ts` (`djLaptop.ts:4`)
  - `test/djStage2Vinyl.test.ts` (`djVinyl.ts:4`)
  - `test/djStage2Dvs.test.ts` (`djDvs.ts:3`)

  Their coverage appears to have been folded into `djStage2Engine` / `djEvent` / `djRender`, but the pointers are stale.

