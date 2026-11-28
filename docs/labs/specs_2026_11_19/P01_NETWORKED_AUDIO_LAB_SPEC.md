# P01 Networked Audio Lab: build specification

Written 2026-11-19 from Comp B's proposal P01 (COMP_B_TO_CCODE_2026-11-18_NEW_LAB_PROPOSALS.html) and the owner's decisions of 2026-11-19 (OWNER_DECISIONS_2026_11_19.md: all HOLD defaults accepted).
This is a SPEC ONLY. Nothing is built, listed or published until the owner gives a separate, explicit GO (D56: built on Opus 5.5 at HIGH effort).

---

## 1. Summary for the owner

**What it is.** A members-only Training lab, under a new Labs menu subject called **Audio Networking** (H19 default). It shows how audio moves over a network: devices, channels and subscriptions, the clock that keeps every device in step, latency, the switch settings audio depends on, backup (redundant) networks, and how equipment from different makers can talk to each other (AES67). It ends with a fault bench of 12 real-world faults.

**What the learner does.** On one network map that stays pinned at the top of the screen, the learner:
- plugs a show together: a 32-input stage box, the front-of-house console, the monitor console, a recorder and an amplifier, all on two switches;
- routes channels and sees what each route costs in flows and in network capacity;
- predicts which device will become the clock leader, watches the network choose, then changes the choice and sees why;
- picks a latency for a network of a given size and watches packets arrive inside (or outside) that safety window, then listens to the result;
- fixes an office-style switch so it suits audio, and hears what each wrong setting does (clicks, dropouts, silence);
- pulls a cable on a redundant system and hears the show carry on;
- works 12 faults by reading the displays first. Every option has an explanation, and any reasonable fix is accepted.

**Size.** 20 pages in 7 modules, then the shared "what's left" screen. Size L (Comp B's rating holds). The drawings are simple (illustrated boxes, switches and cables). The real work is the network model behind them. About the size of the Game Audio Lab, a little smaller.

**Credit.** Key `tr_networked_audio`: complete when every page is done. Each module also reports its own key (`net_layers` … `net_faults`) so the four live-show programs can require modules 1–5 only (H18 default). It is required by 9 credentials (section 6). These are the first lab requirements for the two networking certificates and the networking program.

**Sound.** A short in-app groove (the Mixing lab's synthesised session, made inside the app) is played through the simulated network, so the learner hears dropouts, clock clicks and the silence of a failed subscription. All rendering is JavaScript. The level is capped at the app's −12 dBFS file-playback ceiling, and the Sound Safety warning comes first. **No native build is needed: the whole lab can go out by OTA update, when the owner says so.**

**What it needs from the owner.**
1. The GO to build (D56).
2. A Labs-menu tile picture for the new lab (images only with your permission). This is needed before LISTING, not before building.
3. One decision: H25 says to put the latency rule into the calculator library first. But a new calculator makes 167, and "166 calculators" is in the ads, the app and the website. I suggest keeping the latency rule inside the lab (it is a table of suggested starting points plus a "the higher setting wins" rule, not a physics equation) and adding no calculator. The two equations the lab does use (network bandwidth and clock drift) are ALREADY calculators, and the lab will call them. See section 8.

---

## 2. Learning outcomes (knowledge, not skills)

After this lab the learner knows:

1. That a networked-audio system is two layers, the computer network and the audio running on it, and which kind of fault belongs to which layer (no link, wrong address = network; no subscription, wrong sample rate = audio).
2. That devices find each other only when they are on the same network and the same subnet, and what "automatic" and "fixed" addresses mean.
3. What transmit and receive channels are, what a subscription is, and that a routing grid is the same idea as a patchbay.
4. How unicast and multicast flows differ, and why a device can run out of flows before it runs out of channels.
5. Why every device must follow one clock, how the network chooses its clock leader (Preferred Leader, then a device synced to an external clock, then a gigabit link over a 100 Mb one, then the lowest hardware address), and why two leaders at once mean trouble.
6. That latency is a safety window for packets that arrive late, that it grows with the number of switches in the path, that the higher of the transmitter's and the receiver's settings is the one used, and that more latency adds delay but does not make the sound worse.
7. The switch settings audio depends on: quality of service with clock packets first, energy-saving Ethernet switched off, and multicast filtering (IGMP snooping) with a querier, and why office defaults can break a show.
8. How a primary and a secondary network give redundancy, and why the two must never be joined.
9. What AES67 is for (letting different makers' equipment exchange audio) and what it needs: PTP version 2 clocking, multicast streams and announcements.
10. How to read the displays first when something fails, and that most faults have more than one reasonable fix.

The lab's intro and blurb claim knowledge only ("you'll see how…", "you'll know why…"), never skills ("you'll master", "you'll be able to configure").

---

## 3. Screen-by-screen plan

### 3.0 Shared layout (every hands-on page)

- **Rack Unit** (src/screens/lab/rack/RackUnit.tsx): the display is pinned at the top, the well scrolls between, the controls are docked at the bottom. The bezel strip is read-only (BezelReadouts). A cropped readout drops its label, never its number (D36). Full screen is a working surface with zoom steps (D35).
- **The display** is always the **network map**: devices drawn as illustrated equipment (a stage box, two consoles, a recorder, a networked amplifier, two switches), Ethernet cables each on their own traceable lane (Wiring Rulebook v1). A clock badge marks the leader. Flow lines light up along the cables. A side panel changes by module: routing grid, clock panel, arrival histogram, switch queues, or the two-network view.
- **Never colour alone.** Unicast flow = solid line, multicast = dashed. Primary network = amber with a "P" tag, secondary = blue with an "S" tag and a different dash. Packets: clock = diamond, audio = square, other traffic = circle.
- **Controls** are popups and tap keys, never pull-down menus. A choice of 3–4 options is a tap key (D75). Latency (5 values) is a popup. A control that does nothing in the current state is shown `locked: '<reason>'`, never silent.
- **Text ≥ 9 pt at 390 px** after fit scaling (`fitValue`). On a phone, device names on the map are short ("STAGE", "FOH", "MON", "REC", "AMP", "SW-1"); the full name is in the accessibility label and in the tap popup.
- **Accessibility.** Every teaching `<Canvas>` carries `accessible`, an `accessibilityLabel` and a live text summary, for example: "Clock leader: stage box. Four followers locked. FOH receiving 32 of 32 channels."
- **No imitation of any maker's software** (H04). No screen, tab name, icon, tick mark, colour scheme or layout is copied from Dante Controller or any other product. The routing grid uses the Patchbay lab's own visual language (amber crosspoint dots on the house panel). "Dante" and "AES67" are named as engineers use them (H04). "Dante Controller" is never named as a screen.
- **Terms.** "Leader" and "follower" for clocks (the current Dante wording). Older manuals, and the Sound Systems Lab's fault text, say "master". The lab says once, on page 7: "older gear and manuals call the leader the master."
- **Each module starts from a fixed preset network.** No page depends on what the learner built on an earlier page, so there is no whole-network save and no "save before load" risk. Page progress is PagedLab's own store. Fault-bench progress is a `createLocalStore` store (section 7).
- **Per-screen help** is a ScreenGuide (header ⓘ) written in the student's voice. The guide line given for each page below is its first step.
- **Voice:** suggested starting points, never rules. "Must" and "never" appear only for real hazards to the show or the network (never join primary and secondary; switch off energy-saving Ethernet on audio ports). Even those are worded as "do not", with the reason.

### Module 1: The network under the audio (`net_layers`)

**Page 1. Two layers** (manualDone)
- Display: the finished show network. A tap key flips between the NETWORK view (cables, ports, link lights, addresses) and the AUDIO view (devices, channels, flow lines over the same map).
- Dock: NETWORK / AUDIO tap key; "Show me a fault" button (cycles three symptoms).
- Learner action: for each of three symptoms (a dark link light; a device missing from the audio view; a channel with no audio), pick the layer it belongs to.
- Teaching intent: two layers, and which faults live where.
- Help (student voice): "I want to know whether a problem is the network or the audio on top of it."
- Done: the three symptoms answered (every reasonable answer accepted, each option explained).
- The lab says once, here: "Limits like flow counts and lowest latency differ from device to device. Real numbers come from each device's own datasheet. This lab shows a typical modern device."

**Page 2. Cables, ports and switches** (manualDone)
- Display: two switches and five unplugged devices. Each port shows its link speed (1 Gb or 100 Mb) as a word and a light.
- Dock: tap a device, then a free switch port; a cable popup (primary port / secondary port).
- Learner action: plug every device in. One port is a 100 Mb port, and its readout says so.
- Teaching intent: devices meet at switches; link speed is a property of the port and cable pair; a hop is each switch the audio passes through (the lab defines "hop" this way and says so).
- Help: "Where do I plug each box in, and what does the light tell me?"
- Done: all five devices linked.

**Page 3. Addresses and subnets** (manualDone)
- Display: the map with an address label under each device.
- Dock: tap a device → "automatic or fixed address" popup; for fixed, a short address picker (no free typing, so no invalid entries).
- Learner action: one device has a fixed address on a different subnet and has vanished from the AUDIO view. Find it and bring it back (set it to automatic, or give it an address in the right subnet).
- Teaching intent: same network and same subnet to discover each other; automatic addressing; the network layer can be fine while the audio layer cannot see a device.
- Help: "Why can't the console see the stage box when the cable is fine?"
- Done: the device is back in the audio view, plus a one-question check (module 1 check, section 6).

### Module 2: Devices, channels and subscriptions (`net_routing`)

**Page 4. Transmit and receive channels** (manualDone)
- Display: map plus the routing grid (transmit channels across, receive channels down) drawn as a patch panel in the Patchbay lab's style.
- Dock: tap a crosspoint to subscribe or unsubscribe; device filter tap key (STAGE / FOH / MON / REC).
- Learner action: subscribe the stage box's channels 1–8 to the FOH console's inputs 1–8; watch the flow line appear.
- Teaching intent: a subscription is the receiver asking for a transmitter's channel; the grid is a patchbay.
- Help: "How do I get the stage box's inputs into the console?"
- Done: 8 subscriptions made.

**Page 5. Flows: unicast and multicast** (manualDone)
- Display: map plus a flow counter on each device ("TX FLOWS 3 of N") and the bandwidth of each link.
- Dock: subscribe; "make a multicast flow" popup (choose channels); unicast/multicast view key.
- Learner action: send the same 32 channels to FOH, MON and REC by unicast until the stage box runs out of transmit flows; then send them as multicast and watch the count drop.
- Teaching intent: flows, not channels, are the limit; a unicast flow goes to one receiver; a multicast flow goes once onto the network and every subscriber takes it; multicast is not "always better" (it reaches more of the network and needs a switch that filters it, module 5).
- Help: "Why does the stage box say it's full when it still has channels free?"
- Done: the flow-limit message seen, then cleared with multicast; two-question check.
- Accuracy hold: channels per flow and the device's flow limit are UNKNOWN until sourced (section 5, rows 8–9). The page is written so the lesson works with whatever the verified numbers turn out to be.

**Page 6. Build the show** (manualDone)
- Display: the full show network; a cost panel listing each route's flows and its bandwidth on each link.
- Dock: routing grid; "costs" toggle.
- Learner action: route the whole show (32 stage inputs to FOH, MON and REC; FOH and MON outputs back to the stage box; FOH main mix to the amplifier).
- Teaching intent: every route has a cost in flows and capacity. Bandwidth figures come from the existing Network-Audio Bandwidth calculator (`netaudio` workspace, `bandwidth` and `packetize`), called, never copied.
- Help: "What does this whole show cost the network?"
- Done: every required route in place, with no flow over its limit.

### Module 3: Clocks (`net_clock`)

**Page 7. Why one clock** (manualDone)
- Display: map plus the clock panel: who is leader, who follows, and an offset histogram for each follower (how far each follower's clock is from the leader's).
- Dock: play/stop listening; "free-run the amplifier" switch (the amplifier stops following).
- Learner action: listen to the clean groove, then make one device stop following and hear periodic clicks as samples slip.
- Teaching intent: every device must count samples at the same rate; followers lock to the leader using PTP clock packets on the network; "older gear and manuals call the leader the master". The slip rate comes from the existing Clock Drift calculator (called, never copied).
- Help: "What is the clock panel telling me about who's in time?"
- Done: heard both states; one-question check.

**Page 8. Choosing the leader** (manualDone)
- Display: map plus the clock panel; each device card shows its election facts (Preferred Leader on/off, external sync on/off, link speed, hardware address shown as a short number).
- Dock: Preferred Leader on/off (per device); Sync to External on/off (only on the device with a word-clock input; locked with a reason elsewhere); "unplug the leader" button.
- Learner action: three predict-then-see rounds: predict the leader, press RUN ELECTION, see the result and the rule that decided it. Then force a chosen device to lead; then unplug the leader and watch a new one take over.
- Teaching intent: the order the network uses, roughly: Preferred Leader, then a device synced to an external clock, then gigabit over 100 Mb, then the lowest hardware address as the tie-break. If several devices are set as Preferred Leader, the lowest address among them wins.
- Help: "I want to guess which box will keep time, and check if I was right."
- Done: three predictions made (right or wrong both count; the explanation is the lesson), one forced leader, one takeover seen.

**Page 9. Sample rates and clock trouble** (manualDone)
- Display: map plus clock panel; a subscription status line on each receive channel.
- Dock: sample-rate tap key per device (44.1 / 48 / 96 kHz); listen.
- Learner action: one device is set to a different sample rate and its subscriptions fail. Find it and fix it.
- Teaching intent: devices on one clock must share a sample rate; a failed subscription is SILENCE, not noise, and the display says why; a red clock indicator does not mean a bad cable.
- Help: "Why does this one channel say it can't subscribe?"
- Done: fixed; module 3 check (two questions).

### Module 4: Latency and the hop budget (`net_latency`)

**Page 10. Latency is a safety window** (manualDone)
- Display: map plus the arrival histogram: when each packet arrives, drawn against the latency window. The bars are green inside the window, amber near its edge, and red past it (late = lost).
- Dock: latency popup (0.25 / 0.5 / 1 / 2 / 5 ms) on the receiver; play/pause the packet stream; step one packet (for reduced motion).
- Learner action: shrink the window until packets go red, then widen it again.
- Teaching intent: latency is a fixed wait that gives late packets time to arrive; a packet that misses the window is lost; more latency only adds delay, it does not make the sound worse.
- Help: "What is this histogram showing, and what happens at the red edge?"
- Done: saw a red packet and fixed it.

**Page 11. Hops, settings and who wins** (manualDone)
- Display: map plus histogram; a path readout ("STAGE → FOH: 3 hops, slowest link 1 Gb").
- Dock: add or remove a switch in the path; set a port to 100 Mb; transmitter latency popup and receiver latency popup.
- Learner action: three short tasks: (a) choose a starting latency for 3, 5 and 10 hops and check the histogram; (b) set the transmitter higher than the receiver and see the effective latency; (c) move a device to a 100 Mb port with 0.5 ms set and read the subscription error.
- Teaching intent: suggested starting points by hop count (up to 3 hops 0.25 ms; up to 5, 0.5 ms; up to 10, 1 ms; up to 20, 2 ms; beyond that, or when there are problems, 5 ms); the higher of the two settings is used; a 100 Mb link needs at least 1 ms; the default on most devices is 1 ms.
- Help: "How much latency should I start with for a network this size?"
- Done: the three tasks done.

**Page 12. Listen to the window** (manualDone)
- Display: histogram plus a level strip of the rendered audio with the dropout points marked.
- Dock: latency popup; LISTEN (renders, then plays); A/B (too tight vs suggested).
- Learner action: listen at a latency too tight for 10 hops, then at the suggested starting point.
- Teaching intent: what late packets sound like (short dropouts that click), and that the display showed it first (amber, then red), never a silent failure.
- Help: "What does a latency that's too low actually sound like?"
- Done: both renders heard; module 4 check (two questions).

### Module 5: Switch settings that matter (`net_switch`)

**Page 13. Quality of service** (manualDone)
- Display: inside one switch: its output queues with packets moving through, shaped by type (clock ◆, audio ■, other ●). Plus the arrival histogram for the audio.
- Dock: OFFICE TRAFFIC on/off (a burst of large file transfers); QoS on/off; strict priority on/off; queue view (labels show the values).
- Learner action: turn on office traffic with QoS off and watch audio and clock packets wait behind large frames; then turn QoS and strict priority on.
- Teaching intent: switches that carry audio with other traffic need DiffServ (DSCP) quality of service with strict priority and four queues; clock packets go first. The page shows the values engineers type into a switch: time-critical clock CS7 (56) highest; audio and other clock traffic EF (46) next; CS1 (8) reserved, low; everything else best effort (0).
- Help: "Why do the clock packets get stuck behind everything else?"
- Done: both states seen.

**Page 14. Energy-saving Ethernet** (manualDone)
- Display: switch port panel plus the clock offset histogram.
- Dock: EEE on/off per port; LISTEN.
- Learner action: switch on energy-saving Ethernet (the office default on many switches), watch the clock offset spread and hear clicks; switch it off.
- Teaching intent: energy-saving Ethernet puts links to sleep between packets; the wake-up delay upsets clock timing; switch it off on every port that carries audio. An unmanaged switch with EEE cannot have it switched off.
- Help: "Where are these clicks coming from when nothing is unplugged?"
- Done: both states heard.

**Page 15. Multicast filtering and VLANs** (manualDone)
- Display: map with multicast traffic shown reaching ports; clock panel.
- Dock: IGMP snooping on/off; querier on/off; swap a managed switch for an unmanaged one; VLAN popup per port.
- Learner action: three states: (a) unmanaged switch, multicast floods every port including a lighting desk on a 100 Mb port; (b) snooping on, no querier, and after a while the clock packets stop reaching some devices and a second leader appears; (c) snooping with one querier, all is well. Then put the lighting desk in its own VLAN.
- Teaching intent: switches without filtering send multicast everywhere; snooping needs a querier; several leaders at once often point to a multicast-filtering problem; VLANs keep other systems' traffic apart.
- Help: "Why are there suddenly two clock leaders?"
- Done: three states seen; module 5 check (two questions).

### Module 6: Redundancy and talking to other systems (`net_redundancy`)

**Page 16. Primary and secondary** (manualDone)
- Display: the two-network view: the primary network (amber, P) and the secondary (blue, S) drawn as two separate sets of switches and cables.
- Dock: device mode tap key (REDUNDANT / SWITCHED); "pull a cable" (choose any cable); LISTEN.
- Learner action: put every device in REDUNDANT mode, connect the secondary network, then pull a primary cable mid-song and hear the audio carry on.
- Teaching intent: redundancy means two physically separate networks; set each device to redundant mode before the secondary network is connected; each network has its own clock leader, usually the same device; in switched mode the second port is just another switch port for chaining.
- Help: "If I pull this cable, does the show keep going?"
- Done: the cable pull heard.

**Page 17. Never join the two** (manualDone)
- Display: the two-network view with a "join" cable available.
- Dock: connect a cable between a primary and a secondary switch; undo.
- Learner action: join them, read what the displays show, and take the join out.
- Teaching intent: joining primary and secondary turns two networks into one and redundancy is gone; the displays show what went wrong. (The exact symptoms are UNKNOWN until sourced, section 5 row 18. The page shows only sourced symptoms.)
- Help: "What happens if someone patches the two networks together?"
- Done: join seen and removed.

**Page 18. AES67: talking to other makers' gear** (manualDone)
- Display: map with a third-party device that speaks AES67 but not Dante.
- Dock: AES67 mode on/off (on the Dante device); announcements view; a PTP version readout per device.
- Learner action: the other device's stream cannot be seen. Turn on AES67 mode, see the stream announced, subscribe to it.
- Teaching intent: AES67 is a shared standard so different makers' equipment can exchange audio; it uses PTP version 2 clocking, multicast streams and announcements so devices can find the streams; Dante devices also run PTP version 2 when AES67 mode is on.
- Help: "Why can't I see the stream from the other company's box?"
- Done: stream subscribed; module 6 check (two questions).

### Module 7: Fault bench (`net_faults`)

**Page 19. Fault bench: faults 1–6** and **Page 20. Fault bench: faults 7–12** (manualDone each)
- Display: the full show network with the fault's symptom live on it (map, clock panel, histogram, queues, all available by tap key).
- Dock: the same controls as the earlier modules, all unlocked; LISTEN; "I think it's…" (name the cause, optional); RESET THIS FAULT.
- Learner action: pick a fault card, read the displays first, then make a change. Any change that clears the fault without breaking something else is accepted. A change that does not clear it is explained ("That made the latency higher, but the problem is the clock: look at the clock panel").
- Teaching intent: read the displays before acting; most faults have more than one reasonable fix.
- Help: "Where do I look first when something's wrong?"
- Done: all six faults on the page cleared. Cleared faults persist in the fault store (they never un-clear).

The 12 faults (the page each one draws from in brackets):
1. A device with a fixed address on the wrong subnet [3].
2. A transmitter out of flows [5]. Fixes: multicast for shared channels, or remove unused subscriptions.
3. Two clock leaders after multicast filtering without a querier [15]. Fixes: add a querier, or turn snooping off.
4. Energy-saving Ethernet causing clicks [14].
5. Latency too low for the hop count [11].
6. Secondary network joined to primary [17].
7. A sample-rate mismatch blocking a subscription [9].
8. A device on a 100 Mb port with latency below 1 ms [11]. Fixes: raise to 1 ms, or move it to a gigabit port.
9. An AES67 stream not visible because announcements are off [18].
10. A source subscribed twice by mistake (the kick on two console inputs) [4].
11. An unmanaged switch flooding multicast to a slow device [15]. Fixes: managed switch with snooping and a querier, or a separate VLAN.
12. An external word clock connected to the console but the console not set to sync to it, so it is not the leader [8]. Fix: Sync to External on the console (Preferred Leader too, if another device has it set).

**What's left screen** (shared LabEndScreen through PagedLab): lists unfinished pages by module, shows each module's credit, and links on to the Sound Systems Lab (a networked stage box) and the Digital Audio Systems lab's clocking module. The lab never blocks navigation: NEXT always moves on, and an unfinished page is simply listed.

---

## 4. Simulation and audio

### 4.1 The model (pure TypeScript, no React Native, so tests reach it directly)

Charter §2: three layers per figure (model / geometry / scene). Every fact in the model carries a `src` key into docs/labs/netaudio/SOURCES.md. A fact without a source is `unknown` and is never drawn as if known.

- **Topology.** Devices (ports: primary and secondary; link speed; address mode and address; sample rate; latency; Preferred Leader; Sync to External; redundant or switched mode; AES67 mode; flow limits from the device profile), switches (managed or unmanaged; per-port speed, VLAN and EEE; QoS on/off, strict priority, queue count; IGMP snooping; querier), cables (port to port). The network a device is on is worked out from the cable graph, never stored.
- **Discovery.** Two devices see each other when they are on the same layer-2 segment (same physical network and VLAN) and the same subnet.
- **Hops.** The number of switches on the path between two devices. The SOURCES file logs that one source counts "hops between edge switches" and the lab defines a hop as each switch passed through.
- **Subscriptions and flows.** A subscription is a receive channel naming a transmit channel. Unicast flows are counted per transmitter–receiver pair, grouped by the verified channels-per-flow number; a multicast flow is counted once at the transmitter however many receive it. A subscription that would exceed a flow limit fails with a reason. Link bandwidth is the sum of the flows on it, computed by the existing calculator functions (`netaudio`: `bandwidth`, `packetize`; `netPackets` exported from digitalAdv.ts in place, not copied).
- **Clock election.** A pure function over the devices that can hear each other's clock packets, applying the verified order (section 5 row 5). It runs separately for each set of devices that can hear each other. So a multicast-filtering fault (snooping with no querier), which stops clock packets reaching part of the network, really does produce two leaders, and a redundant system really has one leader per network. Time is compressed: the real membership timeout is minutes. This is in the simplifications register, and the page says "after a while".
- **Packet arrival.** For each path, an arrival-time distribution is built from: the transmit time of a frame at each link speed (frame bits ÷ link rate, physics); a per-switch forwarding delay; queueing behind other traffic when QoS is off (the large-frame wait at each hop); and energy-saving wake-up delay when EEE is on. The distribution is CALIBRATED so that on a clean network each suggested-starting-point row (3 hops at 0.25 ms … 20 hops at 2 ms) lands inside the window with margin. This is a teaching model, not a measurement of any product. It is in the simplifications register, and the page says once "a simplified picture of packet timing".
- **Latency rule.** Effective latency = the higher of the transmitter's and receiver's settings; a path with a 100 Mb link refuses anything below 1 ms with the device's subscription error. The multicast minimum is UNKNOWN (section 5 row 12) and is not modelled until sourced.
- **Outcome per receive channel:** OK | SILENT (with reason: no subscription, sample-rate mismatch, flow limit, not discoverable) | DROPOUTS (rate = the share of packets past the window) | CLICKS (rate from clock slips: free-running, EEE or two leaders). The outcome drives the displays, the accessibility summary and the audio render, all from one value.
- **Redundancy.** In redundant mode a device sends and receives on both networks; audio survives the loss of one. Joining the two networks is detected from the cable graph and flagged.
- **AES67.** A non-Dante device's stream appears in discovery only when the Dante device's AES67 mode is on and the stream is announced; AES67 flows are multicast; clocking needs PTP version 2.
- **Faults.** 12 scenario presets. Each has: the starting state, a `isCleared(state)` predicate, a `brokeSomethingElse(state)` check, and explanations for common wrong moves.

### 4.2 Motion

- One phase clock per scene (`usePhaseClock` pattern). Packets moving along cables and through queues are a LESSON loop the learner starts (listed in test/patternP10b_20261002.test.ts with its reason). Under reduced motion, STEP controls carry every lesson state.
- Moving packets are labelled as a slowed-down picture ("packets drawn much slower than real"). They never claim real speed.
- Animations stop when the screen loses focus or the app goes to the background, and resume without a jump.
- No per-frame React state: shared values and `useDerivedValue` only.

### 4.3 Sound

- **Source:** the Mixing lab's synthesised 8-track groove (src/screens/lab/mixing/audio/mixAudio.ts: deterministic, made inside the app, about 10 s), summed to stereo. No licensed or recorded asset is needed.
- **Render:** offline, in JavaScript, from earDsp primitives (the house pattern: decide → render → listen). A new pure module `netAudio.ts` applies the model's outcome:
  - SILENT: the channel renders as true silence, and the display states the reason (a failed subscription is never "just quiet").
  - DROPOUTS: blocks the length of one packet time are set to zero with hard edges (not earDsp's faded `dropout`), at the model's rate, so they click as real late packets do.
  - CLICKS (clock): periodic one-sample slips at an interval from the Clock Drift calculator, deliberately exaggerated so they are audible in 10 s (simplifications register; the page says "clicks made more frequent so you can hear them").
- **Playback:** `EarClipPlayer` (src/features/ear/earPlayer.ts) through expo-audio, every start through `startFenced` (as the Mixing lab's kit.tsx does). The level is set like the Ear Training bed (about −20 dBFS RMS, peaks at or under −1 dBFS), and the file-playback ceiling (PLAYBACK_CEILING_DB = −12 dBFS, outputCeiling.ts) applies with no unlock. Zeroing samples never adds energy, so no fault render can be louder than the clean groove. The Sound Safety warning (soundSafetyAck) is shown before the first play. The route is added to ExposureCheckin's lab list.
- Live changes while playing are not needed: each LISTEN renders the current state, then plays.

### 4.4 Native build?

**No.** Everything used is already in the installed builds (39/23): Skia 2.6.2, Reanimated 4.5.5, gesture-handler ~2.32.0, expo-audio, expo-file-system. No `modules/` (DSP engine) change. The lab can ship by OTA, on the owner's word only, and not during a store review (D74).

---

## 5. Accuracy

Status key:
- **VERIFIED**: I read the source on 2026-11-19.
- **CITED**: Comp B's source; I could not re-read it today (blocked, moved or too large). It must be read and logged in SOURCES.md before the number is drawn.
- **STANDARD**: from a published standard; the clause has not been checked (AES standards are not in the H24 purchase list).
- **UNKNOWN**: no source yet. Never drawn as known.

Learner text names no source (charter §12). Maker names other than "Dante" and "AES67" (H04) stay out of learner text: no Yamaha, Focusrite, Symetrix, Cisco or Audinate.

| # | Claim | Status | Source |
|---|---|---|---|
| 1 | Typical default latency is 1 ms, enough for a very large network (gigabit core, up to 10 hops between edge switches). | VERIFIED | Dante Controller User Guide, Latency: dev.audinate.com/GA/dante-controller/userguide/webhelp/content/latency.htm |
| 2 | If transmitter and receiver latency differ, the higher is the effective flow latency. | VERIFIED | same page |
| 3 | Minimum latency for a device on a 100 Mb port is 1 ms; lower gives a subscription error ("Tx Scheduler Failure"). | VERIFIED | same page |
| 4 | Suggested latency by hop count: up to 3 → 0.25 ms; up to 5 → 0.5; up to 10 → 1; up to 20 → 2; 21+ or problems → 5 ms. | VERIFIED | a maker's DME7 manual, "About Dante": manual.yamaha.com/pa/processor/dme7/en/04_about_dante_en.html. Shown as suggested starting points. |
| 5 | Leader election: Preferred Leader always wins (several set → lowest MAC among them); Sync to External wins unless a Preferred Leader exists; gigabit preferred over 100 Mb; lowest MAC is the final tie-break. The source gives no single numbered list, so the lab says "roughly in this order". | VERIFIED | Dante Controller User Guide, Clock Synchronization: …/content/clock_synchronization.htm |
| 6 | Terms "leader" and "follower"; redundant networks each have their own leader, usually the same device. | VERIFIED | same page |
| 7 | Dante devices use PTPv1 by default and also PTPv2 when RTP/AES67 is enabled; Preferred Leader is not supported in AES67 Manual mode or ST 2110-30 mode. | VERIFIED | same page |
| 8 | Unicast flows usually carry up to 4 channels; multicast flows up to 8. | CITED | Audinate Level 2 certification slides (PDF did not load: HTTP 522) |
| 9 | Flow limits depend on the chip (e.g. 16 on small devices, 32+ on large). | UNKNOWN | No source read. Before build: take each example device's limits from a published chipset or product datasheet and log it. Until then the flow lesson uses no number. |
| 10 | DSCP: time-critical PTP CS7 (56); audio and PTP EF (46); CS1 (8) reserved low; other traffic best effort (0). | VERIFIED | two switch-setup guides (Symetrix tech tip "Recommendations for large Dante networks"; Focusrite "Configuring a switch for Dante"); Audinate DSCP FAQ CITED (HTTP 403) |
| 11 | Switch needs DiffServ (DSCP) QoS with strict priority and four queues; trust DSCP, not CoS; EEE off on audio ports. | VERIFIED | same two guides; EEE also in the DME7 manual (row 4) |
| 12 | Multicast flows need at least 1 ms latency. | UNKNOWN | Not on the latency page (row 1). Not modelled or stated until sourced. |
| 13 | Dante software devices apply no DSCP marks. | CITED | Audinate DSCP FAQ (HTTP 403). Not used in the lab unless verified (no page depends on it). |
| 14 | Several leaders at once often point to a multicast-filtering (IGMP) problem. | CITED | Audinate FAQ "Multiple leader clocks" (HTTP 403). Partly supported: Symetrix says to disable IGMP snooping if Dante problems occur. |
| 15 | IGMP snooping needs a querier; without one, group membership times out and multicast stops reaching some ports. | STANDARD | IGMP snooping considerations, RFC 4541; IGMPv2 RFC 2236 timers. Check and log before build. |
| 16 | A switch without snooping floods multicast to every port. | STANDARD | RFC 4541. Check and log. |
| 17 | Redundancy: physically separate primary and secondary networks; set Redundant mode before connecting the secondary. | CITED | Audinate "Tips for live sound" (PDF could not be read here). Must be read before page 16 is built. |
| 18 | What the displays show when primary and secondary are joined. | UNKNOWN | Needs a written source. Page 17 shows only sourced symptoms. |
| 19 | AES67: PTPv2, multicast streams, discovery by SAP announcements when AES67 mode is on. | CITED (PTPv2 part VERIFIED, row 7) | Audinate AES67/ST 2110 technical dive (page too large to fetch); AES67 standard STANDARD |
| 20 | Devices fall back to an automatic link-local address (169.254.x.x) when there is no address server. | UNKNOWN for Dante behaviour; STANDARD for the address range (RFC 3927) | Find the Dante FAQ on IP addressing before page 3 is built. |
| 21 | Daisy-chaining: up to 10 devices at 1 ms. | VERIFIED | DME7 manual (row 4). Not used in the lab. |
| 22 | Frame transmit time = frame bits ÷ link rate (about 12 µs for a full-size frame at 1 Gb/s, about 120 µs at 100 Mb/s). | Physics (arithmetic) | Computed, not quoted. |
| 23 | Raw network-audio bandwidth and packet counts. | Existing calculator | `netaudio` workspace (digitalAdv.ts), already fact-audited (R2). Called, not copied. |
| 24 | Clock slip interval from a ppm difference. | Existing calculator | `clockdrift` workspace (digitalAdv.ts). Called, not copied. |
| 25 | Clock packets are sent a few times a second (one source: 4 per second for PTP). | VERIFIED (one source) | Symetrix tech tip. The lab says "a few times a second", no number. |
| 26 | EEE wake-up delay value. | UNKNOWN | IEEE 802.3az (paid). The lab shows the effect without a number. |

**Simplifications register** (kept in SOURCES.md, told to the learner once where it matters): packet arrival timing is a calibrated teaching model; clock-slip clicks are made more frequent; the IGMP timeout is compressed; packets are drawn slowed down; "a typical modern device" stands for all devices, and the lab says once that real limits are in each datasheet.

**Must not teach** (pinned by the expert review): that any switch will do; that more latency means worse sound; that multicast is always better; that a red clock means a bad cable.

---

## 6. Credit

**Keys** (IMMUTABLE once live; server rows are Comp A's, after the update reports the lab is on phones, D60 (f)):
- `tr_networked_audio`: the whole lab. Complete when every page (1–20) is done: PagedLab's own "lab done" rule, reported through `labDoneKey` (the Game Audio Lab pattern). Completion = `'all-modules'`.
- Module keys, a new `net_<module>` key shape (the same idea as the Mixing pages' `mxb_`, following the owner's 2026-10-13 ruling that credentials require only the lessons they need): `net_layers` (pages 1–3), `net_routing` (4–6), `net_clock` (7–9), `net_latency` (10–12), `net_switch` (13–15), `net_redundancy` (16–18), `net_faults` (19–20). Each is reported when every page of that module is done (a pure `netModuleDoneKeys(completed)` in trainingCompletion.ts, called from PagedLab's `onPageDone`).
- A page counts only when its work is done (owner decision 2026-11-14: "done = work done"): every page above is `manualDone`. Credit is never removed; START OVER is practice.
- No backfill is needed (the lab was never on a phone before its keys), as for tr_game_audio.

**Understanding-check ideas** (built into the module's last page; 2 questions each; every option explained; any reasonable answer accepted; no maker names):
- M1: "The cable light is on but the console can't see the stage box. Which layer is the problem in, most likely?" → the network's addressing (wrong subnet).
- M2: "The stage box has free channels but refuses a new subscription. What has it run out of?" → flows. / "Three consoles want the same 32 channels. Which uses fewer of the stage box's flows?" → multicast.
- M3: "No device is set as Preferred Leader. The console has an external word clock and Sync to External on. Who leads?" → the console. / "A follower's offset histogram suddenly spreads out and you hear clicks. Is a bad cable the only cause?" → no: EEE, a second leader, or a free-running device can do it.
- M4: "The transmitter is at 0.5 ms and the receiver at 1 ms. Which latency does the flow use?" → 1 ms. / "Does raising latency from 1 ms to 2 ms make the audio quality worse?" → no, it only adds delay.
- M5: "Which packets should a switch let through first?" → the time-critical clock packets. / "Snooping is on, there is no querier, and after a while a second leader appears. One reasonable fix?" → add a querier (turning snooping off is also accepted).
- M6: "Why must primary and secondary never be joined?" → they become one network and the backup is gone. / "What does an AES67 stream need from the Dante device?" → AES67 mode on (PTPv2, multicast, announcements).

**Which credentials should require it.** Comp B's `required_by`, checked against src/data/labRequirements.ts and the slug fixture in test/labCertRequirements_20261013.test.ts: all 9 slugs exist. The first three are not in the map today (they require the fundamentals only); the six programs are, and gain rows.

| Credential | Slug | Requires | Suggested `why` |
|---|---|---|---|
| Audio Networking (Dante & AV) | cert-audio-networking-dante-and-av-v3 | `tr_networked_audio` | "This certificate is networked audio: routing, clocking, latency, switches and redundancy are the job." |
| AV-over-IP Systems | cert-av-over-ip-systems-v3 | `tr_networked_audio` | "Audio over IP runs on the same switches, clocks and multicast rules as the video beside it." |
| Audio Networking and Infrastructure | prog-audio-networking-and-infrastructure-v3 | `tr_networked_audio` | "Designing and keeping a networked-audio system running is the core of this program." |
| Commercial Audio and AV Systems | prog-commercial-audio-and-av-systems-v3 | `tr_networked_audio` | "Installed systems now carry their audio over the building's network." |
| Audio Systems Engineering | prog-audio-systems-engineering-v3 | `tr_networked_audio` | "A modern system design is specified around its audio network, its clock and its redundancy." |
| Live Sound Engineering | prog-live-sound-engineering-v3 | `net_layers`, `net_routing`, `net_clock`, `net_latency`, `net_switch` | "Most stage boxes and consoles now connect over a network, and a show goes silent when one setting is wrong." |
| Concert and Festival Production | prog-concert-and-festival-production-v3 | modules 1–5 as above | "Festival stages share networked stage boxes and consoles between acts." |
| Theater, Venue and Entertainment Audio | prog-theater-venue-and-entertainment-audio-v3 | modules 1–5 | "Venue systems move audio between rooms over the network, show after show." |
| Worship Audio Production | prog-worship-audio-production-v3 | modules 1–5 | "Many worship rooms run their consoles, stage boxes and streams over one audio network." |

Relevant but not required: prog-immersive-and-spatial-audio-v3, prog-broadcast-podcast-and-streaming-audio-v3 (the lab appears as "next" there if the UI offers optional practice).

Note for the expert review, not a blocker: for live sound, redundancy (module 6) is everyday practice. The owner accepted the 1–5 subset (H18); the reviewer may suggest adding `net_redundancy` later. In-progress learners are exempt from new requirements (H20, the Wave 0 server mechanism).

---

## 7. Files, tests and size

### Create
- src/screens/lab/netaudio/NetworkedAudioLabScreen.tsx: PagedLab host (labId `networked-audio`, `labDoneKey`, `onPageDone` for module keys, `unitNoun` 'module', guides, `optionalPage` none).
- src/screens/lab/netaudio/model/: netModel.ts (types, device profiles, presets), netTopology.ts (segments, VLANs, subnets, discovery, hops), netFlows.ts (subscriptions, flows, bandwidth via the calculator), netClock.ts (election, multiple leaders, offsets), netLatency.ts (arrival distribution, window, outcome), netSwitch.ts (queues, QoS, EEE, IGMP), netRedundancy.ts, netAes67.ts, netOutcome.ts (one outcome per receive channel), netFaults.ts (12 faults, clear and side-effect checks, explanations), netFaultStore.ts (`createLocalStore`: loading / UNREADABLE / empty; never overwrites an unreadable read).
- src/screens/lab/netaudio/geometry/netGeometry.ts: map coordinate system, anchors per port, one lane per cable, zoom steps.
- src/screens/lab/netaudio/scene/: NetMapScene.tsx, RoutingGridScene.tsx, ClockPanelScene.tsx, ArrivalHistogramScene.tsx, SwitchQueueScene.tsx, TwoNetworkScene.tsx, motion.ts.
- src/screens/lab/netaudio/audio/: netAudio.ts (pure render), useNetListen.ts (EarClipPlayer + startFenced + Sound Safety).
- src/screens/lab/netaudio/pages/: p01…p20 page files, index.ts, guides/ (ScreenGuides in the student's voice), data/checks.ts (module checks).
- docs/labs/netaudio/SOURCES.md (one row per fact cluster, simplifications register), docs/labs/netaudio/CORRECTIONS_LOG.md.

### Change
- src/screens/lab/labCatalog.ts: new training category `networking`, "Audio Networking" (H19), with the one lab row (members only, tileBlurb).
- src/screens/lab/labTileArt.ts: the tile picture (owner-supplied or owner-approved).
- src/navigation/types.ts, src/navigation/RootNavigator.tsx: route `NetworkedAudioLab`, behind the members-only gate (`useMemberGate`).
- src/features/lab/trainingLabKeys.ts: `tr_networked_audio` in TRAINING_LABS; `NET_MODULE_IDS`, `netModuleKey()`, the `net_` set in `isTrainingKey`.
- src/features/lab/trainingCompletion.ts: rule table and `netModuleDoneKeys`.
- src/data/labKeyCatalog.ts: names for the tr_ and net_ keys (e.g. "Networked Audio: Clocks").
- src/data/labRequirements.ts: the 9 rows above; regenerate the seed with `node scripts/gen-lab-cert-seed.mjs` (teach it the net_ shape if it needs to); the seed carries the do-not-run-until-on-phones warning.
- src/features/lab/labEndContent.ts: "next" links in and out (Digital Audio Systems, Patchbay, Cable & Connector Fundamentals in; Sound Systems Lab out).
- src/features/intro/labTermIntroData.ts: `status: 'hold'` entry (candidates: "Networked audio", "Clock leader", "Latency").
- src/features/audio/ExposureCheckin.tsx: add the route.
- src/features/account/clearLocalAccountData.ts: the fault store is wiped with the account (not in GUEST_KEEP).
- src/screens/lab/calc/workspaces/digitalAdv.ts: export `netPackets` (and the clock-drift helper) where they are, so the lab calls them. No copied equation. A new calculator only if the owner chooses it (section 8).
- src/dev/webPreviews.tsx: `#labpreview/NetworkedAudioLab`.
- Comp A: a SQL brief ZIP for the `labs` rows (tr_ + 7 net_) and the requirement rows, after the update reports the lab is on phones.

### Tests
- test/netAudioModel.test.ts: invariants, not re-runs. Election cases for each rule and each tie; one leader per hearing set; two leaders exactly when clock packets are cut off; effective latency = max(tx, rx); 100 Mb path refuses < 1 ms; every hop-table row lands green on the clean preset with margin and the row below it goes amber/red; flow counting unicast vs multicast; discovery needs same segment and subnet; every cable joins two ports that exist; one leader per network in redundant mode; joining networks detected.
- test/netAudioFaults.test.ts: each of the 12 presets shows its symptom; every listed fix clears it with nothing else broken; a listed wrong move is explained and does not clear it.
- test/netAudioAudio.test.ts: renders are deterministic; peaks ≤ −1 dBFS; no fault render is louder than the clean render; SILENT renders are zero; dropout count matches the model's late-packet share.
- test/netAudioRegistration.test.ts: catalog row (members only, tile art), route gate, keys, `isTrainingKey`, requirement rows exactly as section 6, term-intro hold.
- test/netAudioLearnerText.test.ts: no "Dante Controller" or other product screen names; the understanding-check brand denylist plus Audinate, Focusrite, Symetrix and Cisco over every learner string; "master" appears only in the one sentence on page 7; no skills claims in the intro ("master", "you'll be able to"); dogma words only in the listed safety sentences.
- Update the shared ratchets: test/patternP10b_20261002.test.ts (the lesson loops), test/labFixes_20261114_S2 (every page declares manualDone), the Canvas accessibility count (must not grow the gap).
- Before handover: `npx tsc --noEmit`, the full suite once at the end, web-preview captures at 390×844, landscape and iPad 1024×1366, opened and checked. Then the audio-expert pass, the cognitive/learning pass and the skeptical visual pass (charter §9). A Pixel check only after the owner chooses to publish.

### Honest size estimate
L. About 20 pages, 6 scenes, about 10 model files and 5 test files. Comparable labs: Game Audio ≈ 26,000 lines, Stage Plot ≈ 30,000 lines. This lab should be around 15,000–20,000 lines, because the art is simpler and there is no web-view audio engine. Expect one long HIGH-effort build run, then two rounds of review and fixes. The riskiest part is the calibrated arrival model and the 12 fault predicates, not the drawing.

---

## 8. Open items that truly block

1. **The owner's GO to build** (D56). Nothing starts without it.
2. **H25 vs "166 calculators".** H25 (accepted) puts new equations, including "the latency formula", into the calculator library first. A new calculator makes the count 167, and "166 calculators" is fixed in the ads, the app and the website (owner, 2026-11-01). My suggestion: add no calculator. The latency rule is a table of suggested starting points plus "the higher setting wins", not an equation, so it lives in the lab's tested model. The lab's real equations (bandwidth, packets, clock drift) are already calculators and are called from there. This blocks only the calculator step, not the rest of the build.
3. **Tile picture** for the Labs menu (images only with the owner's permission). It blocks LISTING the lab, not building it.

Not blockers (handled inside the build): the CITED and UNKNOWN rows in section 5 are read and logged before the page that uses them is drawn, and nothing unknown is ever shown as known. Comp A's server rows follow the on-phones update; until then the device keeps the credit unsent and retries it.
