# P12 — Electronics Bench & Repair Lab: build specification

Written 2026-11-19 on branch `ota-after-approval-39-23`. **This is a spec only. Building waits for the owner's explicit GO** (D56: Opus 5.5, HIGH effort).
Inputs: Comp B's proposal P12 and the HOLD list (section 7) in `docs/labs/new_lab_proposals_2026_11_18/COMP_B_TO_CCODE_2026-11-18_NEW_LAB_PROPOSALS.html`, the owner's decisions in `OWNER_DECISIONS_2026_11_19.md` (every HOLD default accepted), `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md`, `AGENTS.md`, and the existing lab code named in section 7.

---

## 1. Summary for the owner

**What the learner does.** The learner sits at an electronics bench. The screen shows a drawn circuit board with its schematic over it, and a bench instrument beside it: a multimeter, an oscilloscope or an audio analyser. Every reading comes from a working circuit model. Over seven modules the learner:
1. reads parts and their markings, then builds a divider and a filter and measures them;
2. learns what the meter, the scope, the generator and the analyser each show;
3. pushes diodes, transistors and op-amps until they clip;
4. explores the standard audio circuit blocks, including a mic preamp's noise compared with the thermal limit;
5. finds six faults in three devices (a mixer channel, an active DI box and a pedal). The learner hears each symptom first, then traces the signal with probes. The score rewards method, not speed, and an unsafe probing request is refused with an explanation;
6. classifies 30 solder joints;
7. follows a design into production: PCB assembly, ESD, harnesses, end-of-line test and a quality-control sampling exercise.

**Size.** Large. There are **39 lab screens** across 7 modules, plus the lab home (hub) and the shared "what's left" end screen. It is about the size of the Sound Systems Lab and roughly twice the Amplifier Principles Lab.

**Where it sits.** It goes under Training Lab → Audio Electronics, next to Vacuum Tube Fundamentals and the Amplifier Principles Lab. It is members-only (H22).

**Credit.** There is one whole-lab key, `tr_electronics_bench`, which completes when all seven modules are done. There are also seven module keys (`eb_parts` … `eb_production`), so the nine shorter certificates can require only the modules that match their topics (H18). In total, 13 credentials require it. Credit is never removed, and the lab can always be redone.

**Native build: NO.** Everything runs on what is already in the store binaries: Skia, Reanimated, gesture handler, the existing DSP distortion settings, and the Ear Training sound renderer. It can ship by OTA on the owner's word.

**What it needs from the owner:**
- **The GO to build.**
- **A licensed electrician's review (H09).** The electrician reviews the safety wording flagged in section 5.3 before release. I do not know the cost. The review does not block building; it blocks release.
- **An OK on the cost of IPC-A-610 (H24).** Comp B says revision J is current. I do not know the price. Until the standard is bought, no class-by-class acceptance number appears anywhere in the lab. The lab teaches the joint types in words and pictures, which needs no standard.
- **A choice of art for the solder-joint gallery:**
  - **(A) Drawn joints (default).** Accurate Skia illustrations generated from a joint-shape model. No cost, no image files.
  - **(B) 30 original macro photographs**, shot or commissioned by the owner. Image folders are touched only with the owner's explicit go.
- **Optional: a Labs-menu tile image** from the owner. Without one, the lab keeps the plain glass tile.

**What it does NOT need from the owner:**
- Members-only (H22), the module subsets (H18) and "calculators first" (H25) are already decided.
- The new equations go into the calculator library as extra outputs of existing calculators and as shared tested helpers. The calculator count stays **166** (owner rule, never reopened).

---

## 2. Learning outcomes (knowledge, never skills)

The intro and the module intros claim knowledge only ("this lab shows…", "you will see why…"). They never say "you will repair / build / master".

After the lab, the learner knows:

1. **Parts.** What the common parts on an audio board look like and what each does in an audio circuit: resistor, film / ceramic / electrolytic capacitor, diode, LED, transistor, op-amp, potentiometer, trimmer, relay, jacks, XLR. They also know:
   - how values are marked: the resistor colour code, capacitor codes, voltage ratings, the polarity stripe;
   - what tolerance means;
   - why parts come in standard value series.
2. **Instruments.** What each bench instrument shows and what it cannot show:
   - the multimeter's voltage, current, resistance, continuity and diode functions, and why resistance and continuity are power-off measurements;
   - the oscilloscope's time per division, volts per division and trigger;
   - what a signal generator supplies;
   - what THD+N on an audio analyser means.
3. **Active devices.** What diodes, transistors (BJT and FET) and op-amps do in audio circuits, and how bias, gain, headroom and clipping relate. In particular, why an op-amp's output cannot swing past its supply rails.
4. **Circuit blocks.** The standard audio circuit blocks:
   - gain stage;
   - tone control;
   - balanced input and output, and why mismatched resistors lower common-mode rejection;
   - regulated supply, and where ripple comes from;
   - mic preamp: gain, input impedance and equivalent input noise.
   The learner also knows why a quoted EIN means nothing without its source resistance, bandwidth and weighting.
5. **Fault-finding.** How systematic fault-finding works: symptom first, then signal tracing, half-splitting and substitution. Which component faults produce which symptoms (crackle, distortion, hum, silence, drop-outs). Why "it looks fine" proves nothing, and why a scratchy control is not always the control's fault.
6. **Safety.** The hazards to recognise at the bench: mains, stored charge in capacitors after unplugging, valve high voltage, and the meter's own limits. Why those are jobs for a qualified person. (Recognition only, never live-work instructions; H09.)
7. **Solder joints.** What acceptable and defective joints look like (good, cold, insufficient, excess, bridged, disturbed, lifted pad) and what causes each. That the inspection standard sorts products into three classes and four conditions. The difference between leaded and lead-free solder.
8. **Production.** How a design becomes a product: PCB assembly, through-hole versus surface mount, ESD control, wiring harnesses and electromechanical parts, end-of-line test, and why sampling can only estimate a defect rate.

---

## 3. Screen-by-screen plan

**Shell.** The lab is a **hub plus modules**, in the Amplifier Principles Lab pattern:
- The **home** shows the module map (accordion rows), resume, progress without "n of N" totals, a confirmed START OVER (practice) and the "what's left" link.
- Each **module** walks its screens with the shared lab strip (`LabNavBar`: ⏮ ‹ PREV · MODULE / n ▾ · NEXT ›). It ends with that module's short check. FINISH on the last module opens the shared **LabEndScreen**.
- **Nothing blocks navigation.** NEXT always moves on. A hands-on screen whose goal is not met is listed on the what's-left screen with what is missing, never held.

**Two screen types:**
- **R = Rack Unit.** Live display pinned at the top, a scrolling well between, controls docked at the bottom. The bezel is read-only (BezelReadouts: a cropped readout drops its label, never its number). FULL SCREEN is a working surface and everything zooms (D35).
- **D = document page.** Prose and figures. Each figure opens full screen. Reading it through counts as its work (`reading: true`).

Every **R** screen's goal is a `manualDone` goal and is listed by name on the what's-left screen when unmet.

**Help (ⓘ Screen Guide).** Each screen has its own guide, written in the student's voice: the question a student would ask on that screen, then the answer. "What this teaches" covers audio-electronics knowledge only. Guides live in `benchScreenGuides.ts`. Below, *Help intent* gives the student's question each guide answers.

**Art standard.** Real parts and generic real instruments, drawn accurately from datasheet outline drawings and real front panels, never invented. No brand's instrument screen is imitated (H04). Brand names may appear in text where engineers use them, but never in check questions (existing ratchet). Upper-left light, house tokens. A junction dot appears only where the model connects conductors.

### Lab home (hub)
- **Display:** the module map. Each row shows the module name, a one-line knowledge claim and its state (not started / in progress / done / credited).
- **First line:** "A working bench: every reading on these screens comes from a circuit that behaves like the real one."
- **Also on the home:**
  - a one-time safety card (wording for the electrician, section 5.3);
  - the guest reminder (`GuestStartReminder`, though members-only makes it rare);
  - the "about this lab" note behind ⓘ (a model, not a measurement; no sources shown to the learner).

### Module 1 — Parts on the Bench (`eb_parts`, 5 screens)

**1.1 The parts tray (R)**
- **Display:** a drawn bench tray holding about 14 real parts:
  - axial metal-film resistor, trimmer, potentiometer;
  - ceramic disc, film box and radial electrolytic capacitors;
  - diode, LED, TO-92 transistor, DIP-8 op-amp;
  - relay, 6.35 mm jack, XLR.
- **Dock:** PART ◀ ▶ and a "where it lives" toggle that shows the part on a real audio board.
- **Learner:** opens every part. Goal: all opened.
- **Teaches:** recognition and each part's job in an audio circuit.
- **Help intent:** "How do I tell a film capacitor from an electrolytic one at a glance?"

**1.2 Reading a resistor (R)**
- **Display:** an enlarged resistor with its colour bands. Readouts: value, tolerance, and the nearest standard value.
- **Dock:** BAND 1–4 (or 5) as tap keys; 4-BAND / 5-BAND.
- **Learner:** decodes three resistors shown, then dials one to a target value. Goal: three decoded, one dialled.
- **Teaches:** the colour code, tolerance, and why values come in series such as E12 and E24.
- **Help intent:** "Which end do I start reading from?"

**1.3 Reading capacitors (R)**
- **Display:** close-ups of a ceramic marked with a three-digit code, a film cap and an electrolytic showing its stripe and voltage. Readout: the value in pF / nF / µF.
- **Dock:** CAP ◀ ▶ and a "show the code worked out" toggle.
- **Learner:** matches three markings to values. Goal: three right (wrong answers are explained, then retried).
- **Teaches:** capacitor codes, polarity and the voltage rating, and why a reversed electrolytic is a hazard.
- **Help intent:** "What does 104 mean?"

**1.4 Build a divider and measure it (R)**
- **Display:** a two-resistor divider on the board with the schematic overlay. The DMM is on the output.
- **Dock:** R1, R2 (stepped through standard values), LOAD ON/OFF, VIN.
- **Learner:**
  - hits a target output within 2 %;
  - switches on the load and watches the reading fall;
  - goal: target hit, and the load effect seen.
- **Teaches:** the divider. A load in parallel with R2 pulls the output down (calculator *Voltage divider* and *Parallel resistance*).
- **Help intent:** "Why did the reading drop when I added the load?"

**1.5 An RC filter (R)**
- **Display:** an RC low-pass on the board, with a sweep plot of level against frequency and the scope trace at the chosen frequency.
- **Dock:** R, C (standard values), FREQUENCY.
- **Learner:** sets the cutoff near a target, then finds the −3 dB point on the sweep. Goal: both done.
- **Teaches:** fc = 1/(2πRC), and what "−3 dB at the cutoff" means.
- **Help intent:** "Why is the cutoff not where the sound disappears?"
- **Module 1 check:** 3–4 questions (section 6).

### Module 2 — Meters and Scope (`eb_instruments`, 6 screens)

**2.1 The multimeter (R)**
- **Display:** a generic bench DMM with a function dial, and a powered board with test points.
- **Dock:** FUNCTION (V⎓, V~, A, Ω, continuity, diode) and PROBE POINT.
- **Learner:** answers four measurement tasks by choosing the function and the points.
- **Refusals:** an unsafe choice is refused with an explanation. Examples: current mode across a supply rail ("in current mode the meter is nearly a short"); resistance on a powered circuit.
- **Teaches:** which function answers which question, and that the meter has limits and a category rating. *Category wording is for the electrician.*
- **Help intent:** "Why won't it let me measure current across the rail?"

**2.2 Power-off measurements (R)**
- **Display:** the same board, unpowered. The resistance reading in-circuit differs from the part's marked value.
- **Dock:** PROBE POINT and LIFT ONE LEG (the model removes the part's parallel paths).
- **Learner:** explains the difference. Goal: both readings taken.
- **Teaches:** in-circuit resistance reads parallel paths, and continuity and diode tests need power off.
- **Help intent:** "My 10 k resistor reads 6.8 k. Is it broken?"

**2.3 The oscilloscope: time and volts (R)**
- **Display:** a generic scope graticule of 10 × 8 divisions with a 1 kHz sine from the generator.
- **Dock:** TIME/DIV, VOLTS/DIV, POSITION.
- **Bezel (read-only):** the settings and the measured period and Vpp.
- **Learner:** frames exactly one cycle. Reads the period, peak and peak-to-peak, and converts to RMS. Goal: all three readings entered within tolerance.
- **Teaches:** reading a scope, and that peak, peak-to-peak and RMS differ (calculator *Power · Voltage · Current · Impedance*, RMS triangle).
- **Help intent:** "Which number on the screen is the RMS?"

**2.4 Trigger (R)**
- **Display:** an untriggered trace rolling across the screen (a lesson loop the learner started, so exempt from reduced motion, with step controls).
- **Dock:** TRIGGER LEVEL, SLOPE ↑/↓, SOURCE.
- **Learner:** makes the trace stand still, then triggers on a falling edge. Goal: both done.
- **Teaches:** what a trigger does.
- **Help intent:** "Why does the wave keep sliding?"

**2.5 Generator and probes (D, with an expandable figure)**
- **Content:**
  - the signal generator;
  - the ×1 and ×10 probe (the model shows ×1 loading a high-impedance point);
  - the probe's ground clip is connected to earth through the scope, so clipping it to the wrong point creates a short. *Electrician wording.*
- **Teaches:** that probes have their own limits and hazards.
- **Help intent:** "Why does the ground clip matter so much?"

**2.6 The audio analyser: THD+N (R)**
- **Display:** a spectrum of one gain stage's output showing harmonics and the noise floor, with a THD+N readout in % and dB and a THD+N-against-level curve.
- **Dock:** INPUT LEVEL.
- **Learner:**
  - sweeps the level from very low to clipping;
  - finds the level where THD+N is lowest;
  - goal: the low-level end, the best point and the clipping end all visited.
- **Teaches:**
  - at low levels noise dominates the reading;
  - near clipping, harmonics dominate;
  - THD+N is therefore U-shaped against level.
- **Help intent:** "Why is the distortion number worse when the signal is quieter?"
- **Module 2 check.**

### Module 3 — Active Devices (`eb_active`, 5 screens)

**3.1 The diode (R)**
- **Display:** a diode I-V curve with the operating point, and the scope showing input and output of a half-wave rectifier.
- **Dock:** INPUT AMPLITUDE, DIODE / LED.
- **Learner:** finds the input level where conduction begins, and compares diode and LED. Goal: both.
- **Teaches:** forward voltage, rectification, and the exponential curve.
- **Help intent:** "Why does nothing come out until the input is big enough?"

**3.2 The transistor gain stage (R)**
- **Display:** a common-emitter BJT stage on the board with the schematic overlay. Scope traces of input and output; DMM on the collector.
- **Dock:** BIAS (base divider trim), EMITTER RESISTOR, INPUT LEVEL.
- **Learner:**
  - centres the bias for the most symmetric swing;
  - pushes the input until one side clips first;
  - moves the bias and sees the other side clip first;
  - goal: all three states seen.
- **Teaches:** bias sets the resting point, gain is roughly RC / (re + RE), and clipping is asymmetric when the bias is off-centre.
- **Help intent:** "Why is only the top of the wave flattening?"

**3.3 The FET buffer (R)**
- **Display:** a JFET source follower driving a load, comparing a high-impedance source (guitar pickup) with and without the buffer.
- **Dock:** BUFFER IN/OUT, CABLE LENGTH (load capacitance).
- **Learner:** hears and sees the treble loss with no buffer, then switches the buffer in. Goal: both states.
- **Teaches:** input and output impedance. Why DI boxes and pedals buffer.
- **Help intent:** "Why does a long cable dull my guitar but not my mic?"

**3.4 The op-amp gain stage (R)**
- **Display:** a non-inverting op-amp stage with feedback divider. Scope of input and output with the supply rails drawn as dashed limits. Readout: gain in × and dB, and headroom in dB before clipping.
- **Dock:** RF, RG, INPUT LEVEL, RAILS (±9 / ±12 / ±15 V).
- **Learner:**
  - sets a target gain;
  - pushes the input to clipping;
  - lowers the rails and sees the headroom shrink;
  - goal: all three done.
- **Teaches:**
  - gain = 1 + RF/RG;
  - the output cannot pass its rails, by the datasheet's output-swing figure;
  - lower rails give less headroom.
- **Help intent:** "Why does it clip below the supply voltage?"

**3.5 Hear it clip (R)**
- **Display:** the 3.4 stage running a music-like program bed. Scope and level meter.
- **Dock:** INPUT LEVEL, HARD / SOFT clipping (op-amp rail clipping against a diode-softened stage), PLAY / STOP.
- **Learner:** listens to clean, onset of clipping, and heavy clipping in both kinds. Goal: both kinds heard past the onset.
- **Sound:** section 4.4.
- **Teaches:** what clipping sounds like, and why the two kinds differ.
- **Help intent:** "Which one is the op-amp hitting the rails?"
- **Module 3 check.**

### Module 4 — Circuit Blocks (`eb_blocks`, 5 screens)

**4.1 Gain structure through a channel (R)**
- **Display:** a drawn strip of stages (preamp → EQ → fader → summing). Each stage shows its level and remaining headroom as bars, read from the model.
- **Dock:** MIC GAIN, EQ BOOST, FADER.
- **Learner:**
  - sets the gain so no stage clips and the noise floor stays low;
  - then breaks it both ways (too little gain gives noise, too much gives clipping);
  - goal: good, noisy and clipped states all seen.
- **Teaches:** gain staging inside the hardware.
- **Help intent:** "If the fader is low, can the preamp still clip?"

**4.2 Tone control (R)**
- **Display:** a two-band active tone control. The frequency response is computed from the actual circuit (component values from the cited design reference).
- **Dock:** BASS, TREBLE.
- **Learner:** matches two target curves. Goal: both matched within 1 dB.
- **Teaches:** how a feedback tone control boosts and cuts around a flat middle.
- **Help intent:** "Why does the curve shelve rather than peak?"

**4.3 Balanced input and output (R)**
- **Display:** a balanced line into a differential input stage. The scope shows hot, cold and the difference output; interference is injected equally on both legs. Readout: common-mode rejection in dB.
- **Dock:** INTERFERENCE ON/OFF, RESISTOR TOLERANCE (0.1 % / 1 % / 5 %), CABLE: BALANCED / UNBALANCED.
- **Learner:**
  - sees the interference cancel;
  - worsens the tolerance and sees the rejection fall;
  - unbalances the cable;
  - goal: all three done.
- **Teaches:** why balanced lines reject noise, and why matched resistors matter. Sources: Rane, Jensen, Self.
- **Help intent:** "If both legs pick up the same hum, where does it go?"

**4.4 The regulated supply (R)**
- **Display:**
  - the transformer, drawn and marked as the **mains section: qualified person only, not covered here**;
  - the rectifier, reservoir capacitor and regulator;
  - scope traces of the ripple before and after the regulator.
- **Dock:** LOAD CURRENT, RESERVOIR SIZE.
- **Learner:**
  - raises the load until the troughs fall below the regulator's dropout and ripple passes through as hum;
  - fixes it with a larger reservoir;
  - goal: dropout reached and fixed.
- **Teaches:** where ripple comes from (ripple Vpp ≈ I / (2fC) for full-wave), and what a regulator needs.
- **Help intent:** "Where does the hum come from if the rails are DC?"
- *Hazard wording for the electrician.*

**4.5 The mic preamp and its noise (R)**
- **Display:** a mic preamp input with the source resistance, the input impedance and the gain. A noise readout gives EIN in dBu, and a bar compares the thermal floor of the source with the preamp's own noise.
- **Dock:** SOURCE (150 Ω / 200 Ω / OPEN INPUT), GAIN, BANDWIDTH (20 kHz / 22 kHz), WEIGHTING (unweighted / A).
- **Learner:**
  - works out the thermal floor for a 150 Ω source over 20 kHz using the calculator helper;
  - checks the preamp's EIN against it;
  - opens the input and sees the noise rise;
  - goal: all three done.
- **Teaches:**
  - EIN, and why a figure is meaningless without its source R, bandwidth and weighting;
  - why an open input is noisier than one with a microphone connected;
  - input impedance loading the mic.
- **Help intent:** "Can a preamp be quieter than −131 dBu?" (Not with a 150 Ω source over 20 kHz at room temperature: that is the source's own floor.)
- **Module 4 check.**

### Module 5 — Fault-Finding (`eb_faults`, 8 screens)

**5.1 The method (D)**
- **Content:** symptom first (listen and look), then signal tracing (follow it forward or backward), half-splitting (test the middle and halve the search), and substitution (swap a known-good part or stage).
- **Worked example:** the method on a 6-stage chain, done in 3 probes.
- **Teaches:** the method.
- **Help intent:** "Why start in the middle instead of at the input?"

**5.2 Safety gate (R)**
- **Display:** the inside of the mixer's case, with these zones marked:
  - **mains entry and supply primary**: refused zone, "qualified person only, not this lab";
  - **reservoir capacitors**: "can hold charge after unplugging";
  - the low-voltage signal boards;
  - plus a photo-free drawn valve chassis for the high-voltage example.
- **Dock:** six scenario cards, each asking "Is this a probe the lab will allow?", answered with ALLOW / REFUSE.
- **Learner:** answers all six. Each answer is explained. Goal: all six answered correctly (wrong answers are explained and retried).
- **Teaches:** hazard recognition (H09: recognition, not wiring).
- **Help intent:** "If it is unplugged, why is it still dangerous?"
- *All wording for the electrician.*

**Fault screens 5.3–5.8 (all R), shared shape:**
- **Display:** the device's drawn board with numbered test points on the schematic overlay. The instrument (DMM or scope, the learner's choice) shows the reading at the probed point.
- **Dock:** LISTEN (the symptom), INSTRUMENT (DMM / SCOPE), PROBE ◀ ▶ (test point), INJECT (generator into the input), NAME THE FAULT.
- **Learner:**
  - hears the symptom;
  - probes points, where each probe counts;
  - names the fault from a list of the device's plausible faults.
- **Grade:**
  - diagnosis right or wrong;
  - probes used against the model's optimal half-split count;
  - whether the symptom was heard first.
- **Credit:** the right diagnosis with no refused probe made after the safety gate. The method score is shown as feedback, never as a wall. A wrong diagnosis explains why it does not fit the readings, and the learner may continue.
- **Unsafe requests are refused with a reason:** resistance on a live board, current across a rail, anything on the mains side.

| # | Device | Fault (hidden) | Symptom heard first | What the readings show |
|---|---|---|---|---|
| 5.3 | Mixer channel | Leaky coupling capacitor puts DC on the EQ pot track | Crackle when the pot turns, slight distortion | DC on a point that should read 0 V; the stage after it is biased off-centre |
| 5.4 | Mixer channel | Open negative supply rail (cracked joint on the rail feed) | Harsh, one-sided distortion | −rail reads 0 V at the op-amps; half of each waveform flattened on the scope |
| 5.5 | Mixer channel | Dried-out reservoir capacitor in the low-voltage supply | Hum | Large ripple at twice the mains frequency on the unregulated rail; the regulator drops out in the troughs |
| 5.6 | Active DI box | Cracked solder joint at the output connector | Intermittent crackle and drop-outs | Reading is good, then gone, then good when the board is "tapped" (TAP button); everything upstream is good |
| 5.7 | Pedal | Dead op-amp | Silence when engaged; the bypass works | Signal present at the op-amp input, nothing at its output, rail voltage present |
| 5.8 | Pedal | Worn potentiometer track | Crackle when the knob turns | No DC on the pot (contrast with 5.3); the wiper reading jumps |

- **Why six faults, not Comp B's five.** Comp B's listening list includes **hum**, and none of its five faults produces hum. 5.5 adds the classic dried reservoir capacitor so every symptom in the list has a fault. 5.3 and 5.8 are a deliberate pair: the same crackle has two different causes, which teaches that a scratchy control is not always the control.
- **Replay.** After the six, PRACTISE AGAIN deals the same faults onto the devices in a new order (practice only; credit is untouched).
- **Help intents:**
  - 5.3: "The pot crackles. Should I just replace it?"
  - 5.4: "Why is only the bottom half of the wave missing?"
  - 5.5: "The hum is not at 50/60 Hz. Why?"
  - 5.6: "It works when I measure it. What now?"
  - 5.7: "How do I know the chip is dead and not its supply?"
  - 5.8: "How is this different from the mixer's crackle?"
- **Module 5 check.**

### Module 6 — Soldering and Joint Inspection (`eb_solder`, 5 screens)

**6.1 What a good joint is (D, with figures)**
- **Content:** the joint shown from above and in cross-section, covering wetting, fillet shape, and the lead and pad.
- **Causes:** what makes each defect (too little heat, movement while cooling, too much or too little solder, contamination, too much heat lifting the pad).
- **The three classes and four conditions,** named only: Target, Acceptable, Process Indicator, Defect. **No class numbers** until IPC-A-610 is bought (H24).
- **Must not teach** that more solder is a better joint.
- **Help intent:** "What is the fillet supposed to look like?"

**6.2–6.4 Joint gallery (R), 10 joints per screen**
- 6.2: through-hole. 6.3: surface mount. 6.4: wires to terminals, connectors and pots.
- **Display:** one joint at a time, magnified with a zoom control. It shows top view, cross-section and angled view as the art allows.
- **Dock:** the seven classes as tap keys (GOOD, COLD, INSUFFICIENT, EXCESS, BRIDGED, DISTURBED, LIFTED PAD) and ROTATE / ZOOM.
- **Learner:** classifies each joint. Every answer, right or wrong, shows the explanation. A wrong joint comes back at the end of that screen's set. Goal: all 10 classified correctly once.
- **Totals:** 30 joints; each class appears at least twice; the classes are spread across the three screens.
- **Art:** option A (drawn, from the joint model in section 4.6) or option B (original photographs, the owner's call).
- **Help intent:** "How do I tell cold from disturbed?"

**6.5 Heat, alloys and desoldering (D)**
- **Content:**
  - leaded against lead-free solder and their melting points, which differ (values sourced before shown, section 5);
  - what flux does, and that flux fume is a respiratory hazard;
  - washing hands after leaded solder, burns, and ventilation;
  - desoldering with braid and a pump;
  - how overheating lifts a pad.
- **Help intent:** "Why does lead-free need a hotter iron?"
- *Hazard wording for the electrician.*
- **Module 6 check.**

### Module 7 — From Prototype to Production (`eb_production`, 5 screens)

**7.1 The assembly line (R)**
- **Display:** a drawn line: paste print → pick-and-place → reflow → through-hole / selective solder → optical inspection → in-circuit test → functional test. A board moves stage to stage. Motion is a staged reveal, never a morph.
- **Dock:** STEP ◀ ▶, PAUSE, and a DEFECT toggle that shows where each joint defect from module 6 is usually caught.
- **Learner:** walks every stage. Goal: all stages visited, and the defect view seen once.
- **Teaches:** the flow.
- **Help intent:** "Which machine catches a bridge?"

**7.2 Through-hole and surface mount (D)**
- **Content:** the same circuit as a through-hole board and as a surface-mount board, side by side. Why audio gear mixes both: connectors, pots and big capacitors stay through-hole.
- **Help intent:** "Why are the jacks still through-hole?"

**7.3 ESD (D)**
- **Content:** static that you cannot feel can still damage parts; wrist strap, mat, bags and handling.
- **No threshold numbers** unless sourced (section 5).
- **Help intent:** "If I didn't feel a spark, can the part still be damaged?"

**7.4 Harnesses and electromechanical parts (R)**
- **Display:** a drawn wiring harness from a board to the front-panel jacks, pots and a switch, with strain relief and connector latches.
- **Dock:** PART ◀ ▶.
- **Learner:** finds the three weak points shown (no strain relief, a stretched wire, an unlatched connector). Goal: three found.
- **Teaches:** why electromechanical parts are the most common failure points in service. This is framed as a suggested idea, with the source in section 5.
- **Help intent:** "Why does the wire need a loop before the jack?"

**7.5 End-of-line test and sampling (R)**
- **Display:** a lot of boards with a hidden defect rate. Readout: the chance a sample of n finds no defect.
- **Dock:** DEFECT RATE, SAMPLE SIZE n, DRAW SAMPLE.
- **Learner:**
  - draws samples at two sizes;
  - sees that a small sample often finds nothing even when 2 % are bad;
  - goal: both sizes drawn and the probability read.
- **Teaches:** why sampling estimates and never proves. Uses P(no defect found) = (1 − p)^n, a new calculator helper.
- **Not covered:** AQL tables (paid standards, UNKNOWN).
- **Help intent:** "We tested 10 and all passed. Is the batch good?"
- **Module 7 check.**

### End
FINISH opens **LabEndScreen**. It lists every unfinished screen by name with a jump link, and each module check as its own row. Banked modules read CREDITED. It offers PRACTISE AGAIN (clears nothing banked) and DONE, and the end-screen guide (`endGuide`).

---

## 4. Simulation and audio

### 4.1 Approach
- **No general-purpose circuit simulator.** Each circuit is a **pure-TypeScript model** with explicit, cited equations, kept in the charter's three layers:
  - `model.ts`: parts, terminals, connections, quantities, legal states; every fact carries a `src` key;
  - `geometry.ts`: anchors, test points, paths built once;
  - `scene.tsx` / `motion.ts`.
- The model files have **no React Native imports**, so the tests reach them directly.
- **The calculators are the source of truth.** Every equation shared with a calculator calls the calculator's exported function (pattern: `nioshDose`, `pistonNearField`); none is copied. Levels in dBu use `DBU_REF_V` from `calcUnits.ts`.
- **Per frame:** no React state. Shared values and `useDerivedValue` only. Traces are computed per parameter change into a buffer, then drawn by Skia.

### 4.2 What each instrument shows

**DMM**
- DC readings: the model's DC operating point at the probed node.
- AC readings: the true RMS of the node's waveform.
- Resistance and continuity: computed on the **unpowered** network, including parallel paths. "Lift one leg" removes the part.
- **Simplification:** the reading updates on every parameter change, at a stated fixed display rate. A real meter's update rate varies by model (UNKNOWN; registered).

**Scope**
- 10 × 8 division graticule. The trace is the node's time-domain output on a **real time base**, never a stylised squiggle (charter §4).
- One phase clock drives the trace (`usePhaseClock`). Trigger level and slope pick the phase, and an untriggered trace rolls.
- ×1 probe loading is modelled only on 2.5, as a resistor and capacitor in parallel at the probed node; the values are UNKNOWN until taken from a probe datasheet.

**Analyser**
- An FFT of a rendered buffer of the stage output gives the harmonics.
- The noise floor comes from the model's noise sources.
- THD+N = RMS of everything except the fundamental, over the model's stated band. The band is a model choice and is said so; the exact measurement conventions sit in AES17 (paid, UNKNOWN).

**Signal tracing**
- Each device is a chain of stages with numbered test points.
- A fault changes component parameters, never the readings directly. The readings at every point then follow from the model, so a fault shows only at and after its true location (test-pinned).
- The optimal probe count for the method score is the half-split (binary-search) count over the device's stage graph from where the symptom leaves doubt (the Sound Systems `startAt` idea).

### 4.3 Circuit models (equations; sources in section 5)

| Block | Model |
|---|---|
| Divider, loaded divider | Vout = Vin · (R2 ∥ RL) / (R1 + R2 ∥ RL), via the calculator's *Voltage divider* and *Parallel resistance* |
| RC low-pass | fc = 1/(2πRC) (calculator *RC cutoff*); \|H(f)\| = 1/√(1 + (f/fc)²), a **new output** of *RC cutoff* (H25) |
| Diode | Shockley: I = Is(e^(V/(n·VT)) − 1), solved by Newton iteration per sample; Is and n from the chosen part's datasheet / SPICE model (UNKNOWN until read) |
| BJT common-emitter | Large signal: Ic = Is·e^(Vbe/VT), solved per sample, which gives real asymmetric clipping; small-signal readout gain ≈ RC/(re + RE), re = VT/IE (**new helper**, H25) |
| JFET follower | Square law: Id = Idss(1 − Vgs/Vp)²; Idss and Vp from the part's datasheet (UNKNOWN until read) |
| Op-amp | Ideal gain 1 + RF/RG (a **new output** of *Voltage divider*: the feedback divider's reciprocal), output clamped to the rails minus the datasheet output-swing figure (UNKNOWN until read); soft variant through a diode pair |
| Tone control | Exact transfer function of the cited two-band feedback design, solved by complex nodal analysis at each plotted frequency |
| Differential input | The four-resistor network solved directly with the chosen tolerances: worst case and a seeded random draw; CMRR from the solved common-mode and differential gains |
| Regulated supply | Full-wave rectifier into the reservoir: ripple Vpp ≈ I/(2·f_mains·C) (**new helper**) checked against a time-step simulation; regulator passes ripple when Vin − Vout < dropout (datasheet, UNKNOWN until read) |
| Mic preamp noise | Source thermal noise vn = √(4kTRB) (**new output** of *Mic Output & Preamp Gain*); total EIN = √(4kTRB + en²B + (in·Rs)²B) with en and in from the cited preamp IC datasheet (UNKNOWN until read); A-weighting from the existing calculator weighting if present, otherwise UNKNOWN; T = 300 K stated on screen |
| Faults | Leaky cap = a finite resistance across the capacitor; open rail = rail node removed; dried reservoir = C reduced plus ESR raised; cracked joint = a contact that opens and closes at a modelled random rate (and on TAP); dead op-amp = output stuck at the reference; worn pot = wiper resistance noise while the knob moves |
| Sampling | P(no defect in n) = (1 − p)^n (**new helper**) |

### 4.4 Sound
- **Where sound plays:**
  - 3.3 FET buffer (treble loss);
  - 3.5 clipping;
  - 4.5 noise (optional, quiet);
  - the LISTEN button on 5.3–5.8.
- **How it is made, OTA-safe:**
  - **Clipping (3.5):** the model's own transfer curve is applied to a rendered program bed, using the Ear Training renderer (`earDsp`: `clip`, `harmonicComplex`, `drumPattern`, `present`). As an alternative, the existing native engine's distortion settings (`FX.dist`, hard / soft, already in the binary) may be used. If so, the lab writes **every** engine parameter it relies on when it arms (D41: parameters persist across labs).
  - **Fault symptoms:** `earDsp` `crackle`, `hum` (2× mains plus harmonics), `dropout`, and the model's one-sided clipping, mixed under a program bed with the Ear Training defect rule (`addUnder`).
  - **Mains frequency:** 50 or 60 Hz, picked by region: US plus UK/EU, per H05.
- **Starting sound:** only through `startFenced` / `LabAudioPlayer`. Nothing plays until tapped, and sound stops when the screen loses focus or the app goes to the background.
- **Safe level (H08: cap and warn, like the DJ lab):**
  - every clip is presented at **−20 dBFS RMS with peaks ≤ −1 dBFS** (Ear Training's `present()` / `PEAK_CEILING`);
  - a one-line level note shows before the first sound in the lab;
  - no claim is ever made about SPL at the ear (the phone output is uncalibrated).
  - Note: small phone speakers barely reproduce a 50/60 Hz fundamental, so hum is heard mostly through its harmonics. This is true of real small speakers too, and the help says so.
- **Motion:** every lesson loop (scope roll, assembly line, intermittent joint) is learner-started. Each is listed in `test/patternP10b_20261002.test.ts` with its reason and has pause / step / restart. There is no decorative loop; any that is added later uses `useDecorativeMotion()`.

### 4.5 Native build
**NOT needed.**
- Skia 2.6.2, Reanimated 4.5, Worklets and react-native-gesture-handler are already in builds 39/23 (charter §1).
- Audio uses the JS renderer plus existing playback, or existing engine parameters only.
- No file inside `modules/` changes. A change there would move the fingerprint and go to the native build queue (E5), so the build must not make one.
- New image assets (an optional tile; optional photos) are bundle assets and ship by OTA.
- Before any OTA, re-check both fingerprints (house rule).

### 4.6 Joint model (for option A art)
- Each of the 30 joints is generated from a small geometry record:
  - lead and pad dimensions (from a real through-hole or SMD land pattern: datasheet / land-pattern source);
  - fillet profile (wetting angle, height, concavity);
  - surface (smooth / grainy / crazed);
  - solder volume;
  - bridge or lift flags.
- The drawing derives from the record, so every joint is traceable.
- The descriptions of what each class looks like come from free, cited training material. Class-specific limits stay UNKNOWN until the standard is bought.

### 4.7 Accessibility
- Every teaching `<Canvas>` has `accessible`, an `accessibilityLabel` and a live text summary. Example: "Scope: sine, 2.0 V peak, clipping on the negative half".
- No distinction relies on colour alone: traces carry CH labels and dash patterns, test points carry numbers.
- All controls are native, with roles and values.
- Display text is ≥ 9 pt at 390 wide after `fitValue` (test-pinned).

---

## 5. Accuracy

**The status column means:**
- **Physics:** exact or standard textbook science, reproduced by test.
- **Comp B:** cited by Comp B and not re-checked by me; check at build and log in `SOURCES.md`.
- **To source:** a known fact that still needs a logged source before it is shown.
- **UNKNOWN:** a paid standard, or not yet read. Never shown and never invented.

Nothing is shown to the learner until its row is logged in `docs/labs/electronicsbench/SOURCES.md` with the date checked (charter §3). Learner text carries no citations (charter §12).

### 5.1 Numbers and equations

| Claim / number | Source | Status |
|---|---|---|
| Boltzmann constant k = 1.380649 × 10⁻²³ J/K; elementary charge q = 1.602176634 × 10⁻¹⁹ C (exact) | SI Brochure, 9th ed. (BIPM, 2019) | Physics |
| Thermal noise vn = √(4kTRB) | Johnson / Nyquist (1928); Horowitz & Hill, *The Art of Electronics* 3rd ed., ch. 8 | Physics |
| 150 Ω, 20 kHz: −130.8 dBu at 300 K (−131.0 at 290 K); 200 Ω: −129.6 dBu at 300 K (−129.7 at 290 K) | Computed here; Comp B's "about −131" and "−129.6" agree at 300 K. The lab states T = 300 K | Physics (test reproduces it) |
| VT = kT/q ≈ 25.85 mV at 300 K | From the constants above | Physics |
| EIN must be quoted with source R, bandwidth and weighting; an open input is noisier than one with a microphone connected | Sound Devices, "Understanding microphone preamplifier noise" (URL in Comp B's proposal) | Comp B |
| Preamp IC voltage and current noise (en, in) | THAT Corp THAT1583 datasheet (Comp B's link) | UNKNOWN until read |
| Op-amp output swing at ±15 V and other rails | Datasheet of the generic dual op-amp chosen (e.g. TI NE5532) | UNKNOWN until read |
| Diode Is and n; JFET Idss and Vp | Datasheet / SPICE model of the chosen parts | UNKNOWN until read |
| Divider, parallel, Xc, RC cutoff, τ | Existing calculators (*Basic Electronics*) | Source of truth |
| \|H(f)\| first-order; ripple Vpp ≈ I/(2fC); re = VT/IE; non-inverting gain 1 + RF/RG; P(no defect) = (1 − p)^n; capacitor discharge V = V0·e^(−t/RC) | Horowitz & Hill; D. Self, *Small Signal Audio Design*; standard probability | Physics; each added to the calculator library first (H25) |
| Tone-control component values and response | D. Self, *Small Signal Audio Design* (Focal) | UNKNOWN until read |
| Balanced-input CMRR against resistor tolerance | D. Self (as above); Rane, *Sound System Interconnection*; Jensen application notes | Comp B; the solved network is physics |
| Regulator dropout | Datasheet of the chosen 78xx / 79xx-type regulator | UNKNOWN until read |
| Scope graticule 10 × 8 divisions | A free scope maker's primer (e.g. Tektronix *XYZs of Oscilloscopes*) | To source |
| Resistor colour code; capacitor 3-digit code; E12 / E24 series values | The standards (IEC 60062, IEC 60063) are paid. The same tables appear in free resistor and capacitor maker documents | To source from a maker's document; the IEC text is not needed |
| Electrolytic polarity stripe marks the negative lead | Capacitor maker datasheets | To source |
| THD+N definition and measurement band | AES17 (paid) | Concept is physics; conventions UNKNOWN; the model band is stated as a model choice |
| IPC-A-610: three classes (General; Dedicated Service; High Performance / Harsh Environment) and four conditions (Target, Acceptable, Process Indicator, Defect); J-STD-001 covers the soldering process | IPC-A-610 table of contents (Comp B's link, revision G); Wevolver overview | Comp B (names only) |
| IPC-A-610 revision J current in 2026 | Comp B | Comp B; confirm at purchase |
| Any class-specific acceptance limit (fill, fillet height, wetting angle limits, bridging rules) | IPC-A-610 (paid, H24) | **UNKNOWN: never shown until bought** |
| Harness and terminal criteria | IPC/WHMA-A-620 (paid) | UNKNOWN; the lab shows only generic weak points |
| Sn63Pb37 is eutectic at about 183 °C; SAC305 melts at about 217–220 °C | Solder alloy maker datasheets | To source (shown only once logged) |
| Soldering-iron tip temperature starting points | Iron or alloy maker guidance | UNKNOWN until sourced. If sourced, shown as a suggested starting point, never a rule |
| ESD: damage below the level a person can feel; any voltage threshold | ESD Association free fundamentals pages (ANSI/ESD S20.20 is paid) | To source; numbers UNKNOWN unless a free source gives them |
| AQL sampling tables | ISO 2859-1 / ANSI/ASQ Z1.4 (paid) | UNKNOWN; not used. The exercise is probability only |
| Electromechanical parts are common service failure points | Needs a cited service source | To source, or the claim is dropped |
| Part outlines (TO-92, DIP-8, axial and radial bodies, 6.35 mm jack, XLR) | Maker datasheet outline drawings; the XLR pinout follows the house wiring rulebook | To source per part (charter §4) |
| Faults and their symptoms (leaky coupling cap gives DC on a pot and crackle; dried reservoir gives hum at twice mains; open rail gives one-sided clipping; cracked joint gives intermittent faults; worn track gives crackle) | Horowitz & Hill; D. Self; service literature | Comp B, plus physics through the model; the audio-expert review checks each |
| Lead restriction in electronics (RoHS) | Directive 2011/65/EU (EUR-Lex, free) | To source |
| Rosin flux fume is a respiratory hazard (occupational asthma) | UK HSE guidance (free) | To source |

### 5.2 Simplifications register (starting list; the learner is told once, in plain words, where it matters)
- The devices are **generic composite designs**, not any maker's product.
- Parts are ideal except where the lesson is about their non-ideal behaviour.
- The temperature is fixed at 300 K.
- The DMM reads true RMS and updates at a fixed rate.
- The intermittent joint's open/close rate is a model choice.
- The analyser band is a model choice.
- The probe is ideal except on 2.5.
- Mains-side parts are drawn but never modelled for probing.

### 5.3 Safety wording for the licensed electrician (H09): review before release

Every item below is drafted as **recognition**: what the hazard is and that it is a qualified person's job. It is never a procedure for live work. The electrician approves or rewrites the exact sentences. The build keeps all safety strings in one file (`benchSafetyText.ts`) so the review is a single document, exported to Downloads for the electrician.

1. **Home safety card.** Mains can kill. Unplugged gear can still hold a dangerous charge. Valve equipment carries high voltage. This lab teaches recognition, not live work.
2. **2.1 Meter category ratings** and why current mode across a supply is refused. The CAT names are in IEC 61010-1, which is paid; anything beyond "check your meter's rating suits the job" is UNKNOWN.
3. **2.5** The scope ground clip is tied to earth.
4. **4.4** The mains section is "qualified person only". Reservoir capacitors store charge.
5. **5.2 Safety gate:** all six scenarios and their explanations, including:
   - stored charge after unplugging;
   - what an isolation transformer does and does not do;
   - valve high voltage that remains after switch-off;
   - why the lab refuses mains-side probing.
   Whether the lab names the existence of discharge procedures at all is the electrician's call.
6. **Fault screens:** each refusal message.
7. **6.5** Burns, lead hygiene, flux fume, ventilation.
8. **7.3** ESD wording. ESD is not a shock hazard to the person, but it is checked for accuracy.

The wording in this list also passes the existing house review for hearing and safety tone. Suggested-starting-point voice applies everywhere else. Dogma words (must / always / never) are used only for these genuine safety lines.

---

## 6. Credit

### 6.1 Keys (permanent once live: a rename removes learners' credit)

| Key | What completes it |
|---|---|
| `eb_parts` | Module 1: every screen's work done (reading screens read through; each R screen's goal met) and the module check passed |
| `eb_instruments` | Module 2, same rule |
| `eb_active` | Module 3, same rule |
| `eb_blocks` | Module 4, same rule |
| `eb_faults` | Module 5: 5.1 read; the safety gate answered correctly; all six faults diagnosed correctly, with no refused probe made after the gate; check passed |
| `eb_solder` | Module 6: 6.1 and 6.5 read; all 30 joints classified correctly once; check passed |
| `eb_production` | Module 7, the standard rule |
| **`tr_electronics_bench`** | All seven module keys banked. `TRAINING_LABS` row: `{ route: 'ElectronicsBenchLab', key: 'tr_electronics_bench', completion: 'all-modules' }` |

**Rules:**
- Credit is reported through `reportTrainingComplete` / the `labCompletion` queue: guests are held for the sign-in hand-off, a preview earns nothing, and an unsent key is retried.
- Credit is **never removed**. START OVER (practice) clears the screens, never the banked keys.
- Checks accept every reasonable answer, and every option has a `why`.
- **No backfill:** the lab has never been on a phone.

**Module keys are a new key family (`eb_<module>`), like `ear_<module>`.** This needs:
- `BENCH_MODULE_IDS` and `benchModuleKey()` in `trainingLabKeys.ts`;
- `isTrainingKey` to accept them;
- `describeLabKey` and `allLabKeys` in `labKeyCatalog.ts` to name and list them, with area `'training'` (or a new `'bench'` area);
- eight server `labs` rows from Comp A (one whole-lab key plus seven module keys).

### 6.2 Understanding-check ideas
3–4 questions per module, in the lab's content file (the Amp pattern). Each tests reasoning the screen showed, gives an explanation for every option, and uses no brand or model names.

- **M1:**
  - a 10 k resistor in parallel with a 10 k load: what is the divider output now, and why;
  - what "104" means;
  - which lead of an electrolytic is negative and why it matters;
  - why the −3 dB point is called the cutoff.
- **M2:**
  - which function measures whether a cable is open;
  - why a resistor reads low in-circuit;
  - a 2.83 V peak sine on the scope: what will the DMM's V~ read;
  - why THD+N rises at very low level.
- **M3:**
  - a BJT stage clips only on the top: what does that say about the bias;
  - an op-amp on ±15 V asked for a 20 V peak: what comes out;
  - why a guitar needs a buffer before a long cable.
- **M4:**
  - why a balanced input loses rejection with 5 % resistors;
  - the hum in the supply is at 100 Hz (or 120 Hz): why twice the mains frequency;
  - a preamp quoted as "−135 dBu EIN": what is missing from that claim;
  - why an open input is noisier.
- **M5:**
  - half-splitting a 6-stage chain: where is the first probe;
  - crackle when a pot turns plus DC on the track: which part is the suspect;
  - the device is unplugged: is the reservoir capacitor safe to touch? (correct: no, it can hold charge; electrician-reviewed wording).
- **M6:**
  - dull, grainy, poorly wetted: which class;
  - why more solder is not a better joint;
  - what causes a lifted pad.
- **M7:**
  - which stage catches a bridge most directly;
  - a sample of 10 finds no defects in a lot with 5 % bad: is that likely, and what does it prove;
  - why connectors stay through-hole.

### 6.3 Which credentials require it
Comp B's `required_by`, with the module numbers mapped to keys. All 16 slugs (13 required plus 3 relevant) were checked against `src/data/labRequirements.ts` and the slug fixture in `test/labCertRequirements_20261013.test.ts`, and all exist. Two (**Audio Hardware Manufacturing** and **PCB & Assembly Technician**) have no entry in the map today, so they require the fundamentals only; P12 gives them their first lab. Nothing existing is removed (for example, `tr_amp` stays where it is). Each row needs a learner-facing `why`, written at build time and shown to the learner.

| Credential slug | Comp B rule | Keys to require |
|---|---|---|
| cert-analog-electronics-for-audio-v3 | modules 1–4 | eb_parts, eb_instruments, eb_active, eb_blocks |
| cert-electronics-repair-technician-v3 | every module | tr_electronics_bench |
| cert-audio-troubleshooting-specialist-v3 | 1–3, 5 | eb_parts, eb_instruments, eb_active, eb_faults |
| cert-audio-hardware-manufacturing-v3 *(new map entry)* | 1, 2, 6, 7 | eb_parts, eb_instruments, eb_solder, eb_production |
| cert-pcb-and-assembly-technician-v3 *(new map entry)* | 1, 2, 6, 7 | eb_parts, eb_instruments, eb_solder, eb_production |
| cert-preamp-and-converter-design-v3 | 1–4 | eb_parts, eb_instruments, eb_active, eb_blocks |
| cert-amplifier-technology-v3 | 2–4 | eb_instruments, eb_active, eb_blocks |
| cert-tube-amp-building-v3 | 1, 2, 5, 6 | eb_parts, eb_instruments, eb_faults, eb_solder |
| cert-effects-and-pedal-design-v3 | 1–4 | eb_parts, eb_instruments, eb_active, eb_blocks |
| cert-microphone-building-v3 | 1, 2, 6 | eb_parts, eb_instruments, eb_solder |
| prog-audio-electronics-service-and-repair-v3 | every module | tr_electronics_bench |
| prog-transducer-and-audio-hardware-engineering-v3 | every module | tr_electronics_bench |
| prog-analog-and-vintage-audio-engineering-v3 | every module | tr_electronics_bench |

**Relevant, not required (no row):**
- cert-tube-audio-equipment-specialist-v3;
- prog-audio-systems-engineering-v3;
- prog-ultrasonics-and-industrial-acoustics-v3.

**Notes:**
- **H20:** learners who started a credential before the change date are exempt. This is a server-side rule in Comp A's brief.
- **Server rows** (8 `labs` rows plus the requirement rows) go to Comp A as a SQL brief ZIP, **after** the update that reports the lab is on phones (the `tr_game_audio` precedent). Until then the server answers `lab_not_found` and the device keeps the credit unsent and retries it.
- **Reviewer note, not a blocker:** Tube Amp Building requires `eb_faults`, but module 5's devices are solid-state. Valves appear only in the safety gate. The audio-expert review may suggest a valve case. That would change the module's work, so it must be decided before the keys go live.

---

## 7. Files, tests and size

### 7.1 Create

**`src/screens/lab/bench/`**
- `ElectronicsBenchHomeScreen.tsx` (hub)
- `BenchModuleScreen.tsx` (module shell: steps, checks, MARK, what's-left)
- `BenchRack.tsx`
- `benchScreenGuides.ts`
- `modules/m1Parts.tsx` … `m7Production.tsx`
- `art/`: parts, DMM, scope, analyser, three device boards, PCB / overlay, line, harness, joints
- `scene/`: `geometry.ts`, `scene.tsx` and `motion.ts` per major figure

**`src/features/bench/`** (node-loadable, no React Native)
- `benchModel.ts` (circuit models)
- `benchDevices.ts` (the three devices, test points and stage graph)
- `benchFaults.ts` (faults, grading, the optimal half-split count, refusals)
- `benchJoints.ts` (the 30 joint records and their explanations)
- `benchContent.ts` (modules, screens, checks with `why`)
- `benchProgress.ts` (`createLocalStore`; UNREADABLE is never overwritten)
- `benchEnd.ts`
- `benchSounds.ts` (`earDsp` renders)
- `benchSafetyText.ts` (every safety string, for the electrician)

**`docs/labs/electronicsbench/`**
- `SOURCES.md` (with simplifications register)
- `CORRECTIONS_LOG.md`
- `MODEL.md` (equations and invariants)
- `ANIMATION_SPECS.md` (charter §5)
- `reviews/` (audio-expert, cognitive, visual, electrician)

### 7.2 Change
- `src/screens/lab/labCatalog.ts`: a leaf under Audio Electronics:
  - name "Electronics Bench & Repair Lab";
  - blurb "Read the parts, the meter and the scope, follow a signal through real audio circuits, find why a channel fails, and tell a good solder joint from a bad one.";
  - `tileBlurb` "Parts, meters, scope, faults and solder joints.";
  - route `ElectronicsBenchLab`.
  (H19's category rename is separate.)
- `src/navigation/types.ts` and `RootNavigator.tsx`: `ElectronicsBenchLab` and `ElectronicsBenchModule { id }`, as `lazyScreen` plus `MemberGated` (start-graph cap ≤ 260 modules).
- `src/dev/webPreviews.tsx`: `#labpreview` entries.
- `src/screens/lab/labTileArt.ts`: only if the owner supplies a tile.
- `src/features/lab/trainingLabKeys.ts` and `src/data/labKeyCatalog.ts`: section 6.1.
- `src/data/labRequirements.ts`: the 13 rows in 6.3. Then run `node scripts/gen-lab-cert-seed.mjs` to regenerate `docs/APE_LAB_CERT_REQUIREMENTS_SEED_2026_10_13.sql`.
- **Calculator library (H25, first, before any lab screen uses them).** The count stays **166**: no new calculator functions, only new outputs and exported helpers.
  - `levels.ts` *Basic Electronics*:
    - *RC cutoff* gains "response at f";
    - *Voltage divider* gains "as a feedback divider: non-inverting gain";
    - *RC time constant* gains "voltage after time t";
    - exported helpers `rcResponse`, `nonInvGain`, `capDischarge`.
  - `splSafety.ts` *Mic Output & Preamp Gain*: gains a "thermal noise floor of the source" output; exported helpers `thermalNoiseV` and `einTotal`.
  - Exported helpers with no calculator output yet: `reservoirRipple`, `bjtRe` and `zeroDefectProb`, placed in `powerElec.ts` / `levels.ts`.
  - **Rejected alternative:** making new calculator tiles would change the 166 count, which the owner's standing rule forbids.

### 7.3 Tests
New:
- `test/benchModel_*.test.ts`:
  - invariants: every connection joins existing terminals, no junction at a crossing, test-point counts match the devices;
  - divider and loaded divider through the calculators;
  - |H(fc)| = −3.01 dB;
  - op-amp never exceeds rail minus swing;
  - BJT clips on the predicted side when the bias moves;
  - thermal noise reproduces −130.8 / −129.6 dBu at 300 K;
  - ripple helper agrees with the time-step simulation within a stated tolerance.
- `test/benchFaults_*.test.ts`:
  - each fault changes readings only at and after its location;
  - the optimal count equals the binary-search count;
  - the grader;
  - every unsafe request is refused, with a reason string from `benchSafetyText`;
  - 5.3 and 5.8 are distinguishable by a reading.
- `test/benchJoints_*.test.ts`: 30 joints; every class appears at least twice; every option has an explanation; no class-specific number in the learner text while IPC is UNKNOWN.
- `test/benchCredit_*.test.ts`:
  - module keys and `tr_` completion rules;
  - START OVER keeps credit;
  - preview earns nothing.
- `test/benchText_*.test.ts`:
  - no citations or brand names in checks;
  - knowledge-only intro claims;
  - display text ≥ 9 pt at 390 after `fitValue`.

Update:
- `test/trainingLabKeys_20261013.test.ts`
- `test/labCertRequirements_20261013.test.ts` (with the regenerated seed)
- `test/patternP10b_20261002.test.ts` (the lesson loops)
- `test/labFixes_20261114_S2` (`reading` / `manualDone` declared on every screen)
- the calculator tests for the new outputs. `test/screenGuide_calc_20261031` must still read 166.

Existing ratchets (`startFenced`, `createLocalStore`, `safeGoBack`, `useMemberGate`) must pass unchanged.

Gate: `npx tsc --noEmit` clean, then the full suite through `node scripts/suite-gate.mjs` (fail 0 and the whole suite ran).

**Verification (charter §9):**
- rendered inspection at 390×844, landscape and iPad 1024×1366, with frame series for each major animation;
- side-by-side comparison with the references for every equipment drawing;
- then the audio-expert, cognitive and visual reviews, then the electrician;
- frame rate on the Pixel only after an update the owner chooses to publish; iOS frame rate is reported as NOT MEASURED.

### 7.4 Honest size
- **Large.** About 39 screens, 9 circuit models, 3 fault devices with 6 faults, a 30-joint gallery, 4 instruments and about 20 accurate part drawings.
- **Comparison:** Sound Systems Lab ≈ 17,600 lines; Amplifier Principles ≈ 7,800 lines; Game Audio ≈ 26,400 lines. I expect **roughly 16,000–22,000 lines** including tests.
- The art (instruments, three boards, joints) and the review rounds are the biggest cost, not the code. Expect **several** Opus HIGH build sessions, plus fix rounds after the reviews.
- If the owner chooses option B photos, add the time for the shoot and for matching each photo to its class.

---

## 8. Open items that truly block

1. **Owner GO to build** (D56). Nothing starts without it.
2. **Licensed electrician review of section 5.3 (H09).** This blocks **release**, not building. The owner arranges and approves the electrician; the cost is unknown to me.

**Not blockers** (each has a default that lets the build proceed):
- **IPC-A-610 purchase (H24):** the gallery and 6.1 ship without class-specific numbers until it is bought.
- **Joint-gallery art:** option A, drawn, unless the owner picks photos.
- **Tile image:** the plain glass tile until the owner supplies art.
- **Datasheet values** marked UNKNOWN in section 5: the builder reads and logs them before the screen that uses them is shown.
- **Comp A server rows:** sent after the lab is on phones; credit waits safely on the device.
- **Valve fault case:** reviewer note in 6.3.
- **P03 (Power, Grounding & Hum Lab):** not built yet. The lab links to it only once it exists; no placeholder.
