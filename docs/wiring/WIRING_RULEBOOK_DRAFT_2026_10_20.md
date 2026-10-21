# Wiring & Signal-Flow Rule Book — APPROVED v1 (2026-10-21)

**Status: APPROVED by the owner, 2026-10-21 ("the rule book is fully approved as is"), including Comp B's 9 additions (marked "Comp B, 2026-10-21").** The file name still says DRAFT so existing links keep working.

**Purpose.** This is the single standard every lab visual is audited against for cables, connectors, routing, signal path and signal flow. A lab is grade **A** on wiring only when it breaks **no** rule here and shows nothing a working professional would question.

**How to read a rule.**
- Each rule has an **ID**, the **rule**, a **status** and a **source**.
- **Status:**
  - **U = universal:** always true. Teach it as fact.
  - **C = convention:** true on most gear. Teach it as "most", and name the exception where a learner could meet it.
  - **H = house:** the app's own drawing rule, already decided by the owner (D-numbers).
- **Source:** the standard or reference behind it. "(verify)" marks a rule ccode is less than certain of; the owner should confirm it before it becomes a test.

---

## 1. Connectors, pins and direction

| ID | Rule | Status | Source |
|---|---|---|---|
| C1 | XLR-3 pins: 1 = shield/ground, 2 = hot (+), 3 = cold (−). | U | IEC 60268-12; AES26 (pin 2 hot) |
| C2 | On equipment, an XLR **output** is a **male** (pin) connector and an **input** is a **female** (socket) connector. On a cable, the female end takes signal *from* an output and the male end feeds an input. Signal flows male → female. | U for audio XLR (a few intercom/legacy items differ: name them if drawn) | AES14; IEC 60268-12 |
| C3 | Balanced ¼" TRS: tip = hot (+), ring = cold (−), sleeve = shield/ground. | U | IEC 60268-12 practice |
| C4 | Unbalanced ¼" TS: tip = signal, sleeve = ground/shield. TS is unbalanced. An instrument cable is TS. | U | — |
| C5 | Insert on one TRS jack (Y-cable): **tip = send, ring = return** on most consoles. A few (some older large-format desks) use the opposite. | C | Console manuals (e.g. Yamaha, Allen & Heath, Mackie) (verify per drawn desk) |
| C6 | Stereo headphone TRS: tip = left, ring = right, sleeve = common. | U | — |
| C7 | Speakon NL4: 1+ / 1− carry a full-range (or low band) channel; 2+ / 2− carry a second channel or high band in bi-amp. NL2 uses 1+ / 1−. | U for 1+ / 1−; **C** for which band 2+ / 2− carries in bi-amp (equipment-dependent; Comp B, 2026-10-21) | Neutrik NL4 datasheet |
| C8 | RCA (phono) connectors are unbalanced consumer connections (typically −10 dBV line, or phono-cartridge level from a turntable). | U | IEC 61938 / consumer practice |
| C9 | AES3 digital audio: 110 Ω balanced, normally on XLR. S/PDIF coax: 75 Ω on RCA; S/PDIF optical on TOSLINK. Word clock: 75 Ω coax on BNC. AES3id: 75 Ω unbalanced on BNC (Comp B, 2026-10-21). An analog mic cable is not a correct AES3 cable over distance. | U | AES3; IEC 60958 |
| C10 | MIDI 5-pin DIN: OUT → IN. THRU repeats IN. MIDI on 3.5 mm TRS: **Type A** (tip = DIN pin 5, ring = DIN pin 4) is the MMA standard. Type B exists and is not interchangeable. | U | MMA RP-054 (2018) (verify pin numbers) |
| C11 | USB carries data (and power), not analog audio. USB between two devices needs one to be a host. | U | USB spec |
| C12 | Dante/AES67 use Ethernet (Cat5e or better), at most 100 m of copper per run between switches. | U | Audinate; IEEE 802.3 |
| C13 | Every plug drawn must fit the jack it is in: same family, size and gender. Nothing is drawn forced into a mismatched jack unless the lesson is about that error. Look-alike families: ¼-inch TRS and TT/bantam patch plugs are different families; neither fits the other's jack. (Teaching text only, not a test: long-frame B-gauge and standard A-gauge ¼-inch plugs have different tips; a standard plug can spread a B-gauge jack's springs (verify).) (Comp B, 2026-10-21) | U | — |
| C14 | XLR/TRS combo jack: ¼-inch in the centre, XLR contacts around it; phantom reaches the XLR pins only. (Comp B, 2026-10-21) | C (phantom part) | Maker datasheets |

## 2. Signal levels and power on the line

| ID | Rule | Status | Source |
|---|---|---|---|
| L1 | Signal levels, low to high: mic (about −60 to −40 dBu) → instrument (Hi-Z, varies) → line (pro +4 dBu ≈ 1.23 V; consumer −10 dBV ≈ 0.316 V) → speaker level (after a power amplifier, many volts). | U | Industry references (dBu ref 0.7746 V, D53) |
| L2 | Speaker-level signal never goes into a line or mic input, and a line output never drives a passive speaker directly. | U | — |
| L3 | A passive speaker needs a power amplifier between the mixer and the speaker. A powered (active) speaker takes line level, because its amplifier is built in. Wedge case: a snake return or a console mix output is line level; it feeds a powered wedge or an amplifier, never a passive wedge directly. (Comp B, 2026-10-21) | U | — |
| L4 | Speaker cables are heavy-gauge, unshielded two-conductor (or Speakon). An instrument cable is never used as a speaker cable. | U | — |
| L5 | Phantom power (+48 V, P48) is supplied on pins 2 and 3 of a balanced mic input, relative to pin 1. It powers condensers and active DIs. | U | IEC 61938 |
| L6 | Phantom is safe for balanced dynamic mics. It must not reach unbalanced gear. Switch it off before patching, especially near ribbon mics and with faulty cables. Turn the channel down before switching it on or off. | C (modern ribbons vary; say "check the mic") | IEC 61938; mic manufacturers |
| L7 | A DI box converts an unbalanced, high-impedance instrument (or line) signal to a balanced, low-impedance, mic-level signal for a mic input. | U | — |

## 3. Signal flow inside a mixer

| ID | Rule | Status | Source |
|---|---|---|---|
| F1 | Typical analog channel order: input → preamp gain/trim (and pad, phantom, polarity) → high-pass filter → **insert** → EQ → (dynamics, where built in) → mute → fader → pan → buses/master. | C (digital consoles let the user reorder; say which desk) | Console manuals |
| F2 | An insert is **serial**: the whole channel signal leaves and comes back. It is used for dynamics and EQ. | U | — |
| F3 | A send/return (aux or FX bus) is **parallel**: a copy is sent, and the processor returns a 100 % wet signal mixed alongside the dry. It is used for reverb and delay. | U (the 100 % wet return is the convention) | — |
| F4 | Aux sends for **monitors** are normally **pre-fader**. Sends for **effects** are normally **post-fader**. | C | Console practice |
| F5 | PFL/cue listens **before** the fader. AFL listens **after** it. A channel meter's tap point must be stated (pre- or post-fader). | U for PFL/AFL; C for meter taps | — |
| F6 | Gain is set at the preamp so the channel has headroom at every later stage. Clipping at any stage cannot be undone by a later control. | U | — |
| F7 | Stereo: left = odd/first, right = even/second. Pan law and summing are taught as stated values, not assumed. | C | — |
| F8 | Polarity (an inversion) is not the same as phase (a time or frequency-dependent shift). Use the words exactly. | U | AES terminology |
| F9 | Two outputs are never tied together into one input (Y-cable, two-feed patch). One output may feed several high-impedance inputs. (Comp B, 2026-10-21) | U | — |

## 4. Signal flow in a system (live and studio)

| ID | Rule | Status | Source |
|---|---|---|---|
| S1 | A typical live system: sources → stage box / snake (mic level) → FOH console → system processor (EQ, delay, crossover, limiter) → amplifiers → passive speakers (or → powered speakers). | C | — |
| S2 | In an active (multi-amp) system the **crossover comes before the amplifiers**. In a passive speaker the crossover sits **inside the speaker, after the amplifier**. | U | — |
| S3 | Monitor wedges and in-ear mixes are fed from aux/mix outputs (FOH or a monitor console), not from the main L/R. | C | — |
| S4 | A passive mic splitter feeds two or more consoles. Only one side supplies phantom; the other outputs are transformer-isolated. | C (state which side) | Splitter manuals |
| S5 | In a digital system there is exactly one clock master. Every other device follows it, at the same sample rate. | U | — |
| S6 | Recording taps: a record feed is taken from a stated point (pre- or post-master, a direct out, or a matrix). Its level and processing follow from that point. | U | — |
| S7 | 70 V / 100 V constant-voltage lines: each speaker has a step-down transformer with taps (watts). The amplifier must cover the sum of the taps plus headroom. | U | NEC / install practice |

## 5. Patchbays

| ID | Rule | Status | Source |
|---|---|---|---|
| P1 | **Normal:** with nothing patched, a top jack is connected to the jack below it. | U | — |
| P2 | **Full-normal:** a plug in **either** jack breaks the normal. | U | — |
| P3 | **Half-normal:** a plug in the **bottom (input)** jack breaks the normal. A plug in the **top (output)** jack takes a parallel copy without breaking it. | U (given the top = output convention) | — |
| P4 | **Non-normal (open):** top and bottom are not connected; signal flows only through patch cords. | U | — |
| P5 | Top row = outputs (sources), bottom row = inputs (destinations). | C (common, not universal: say so) | — |
| P6 | Patch cords run from an output jack to an input jack. | U | — |
| P7 | Which side of a half-normal pair breaks varies by bay (top-breaking bays exist): verify the bay. (Comp B, 2026-10-21) | C | — |

## 6. Cable routing and dressing in drawings

| ID | Rule | Status | Source |
|---|---|---|---|
| R1 | Every cable is traceable along its own lane from the plug at its source to the plug at its destination. No cable ends in mid-air unless it is shown as unplugged (a loose end hangs under gravity). | H (D70; cite corrected, Comp B 2026-10-21) | owner D67–D70 |
| R2 | Audio cables run apart from mains power cables. Where they must cross, they cross at right angles. | C (best practice) | Rane; AES installation practice |
| R3 | No cable hangs by its connector: show a service loop or strain relief at the gear. | C | Best practice |
| R4 | Walkway crossings are covered by a cable ramp or taped flat. | C | Venue safety practice |
| R5 | Cable type matches the signal: mic cable for mic, speaker cable for speakers, 75 Ω for word clock/video, Cat5e+ for Dante, and so on. | U | — |
| R6 | Drawings are at true scale and dimensions (D67). Connectors are drawn with the right gender and the right number of pins. Plugs are shown seated. | H | owner D67–D68 |
| R7 | All controls sit in the bottom dock; the bezel is read-only (D67–D70). | H | owner |
| R8 | Mic/line, loudspeaker, mains and data run as separate groups, in separate bundles and on separate supports where practical. Where groups must meet, they cross at 90° (R2). (Comp B, 2026-10-21) | C | Installation practice |

## 7. Power and grounding

| ID | Rule | Status | Source |
|---|---|---|---|
| G1 | Power on: sources → mixer/processing → amplifiers or powered speakers **last**. Power off in reverse: speakers **first**. | U (best practice) | Owner, 2026-10-20: "Powering on goes from input to output (speakers last), powering down goes from output to input (speakers first)." |
| G2 | Never lift, cut or defeat the mains safety earth. | U | Electrical codes |
| G3 | Legitimate hum fixes: a DI or isolator ground-lift switch (pin 1 at the DI only), an isolation transformer, balanced connections, and powering gear from the same circuit. | U | Rane notes; Whitlock |
| G4 | A turntable's ground wire goes to the mixer's GND post. It is a **signal** ground, not a safety earth. | U | — |

---

## Questions for the owner (easy answers)
1. **Teaching conventions (C rules):** should the lab say "most consoles…" and name the common exception (my suggestion), or teach only the common case?
2. **Patchbay top/bottom (P5):** top = outputs, bottom = inputs as the app default, with a note that some bays differ. **Yes / No**
3. **Insert wiring (C5):** teach tip = send, ring = return as "most consoles". **Yes / No**
4. **Phantom and ribbons (L6):** the safe rule is "phantom off while patching; check the mic". **Yes / No**
5. **Anything to add?** Rules from your own experience that colleagues check first. Free text, or "none".

## Owner answers (2026-10-20)
1. Conventions: say "most …" and name the common exception. **Approved.** (Applies to C5 insert wiring too.)
2. Patchbay P5: top = outputs, bottom = inputs as the app default, with a note that some bays differ. **Approved.**
3. Insert C5: covered by answer 1.
4. Phantom L6: "phantom off while patching; check the mic". **Approved.**
5. Owner's rule: power on input → output (speakers last); power off output → input (speakers first). **Recorded as G1.**
