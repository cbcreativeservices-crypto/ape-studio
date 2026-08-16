/**
 * connectors.digital — core digital / network / control connector records for
 * the Cable & Connector Fundamentals Lab (owner spec 2026-08-15 §5.6/§7).
 *
 * SAFETY-CRITICAL CONTENT (owner mandate 2026-08-15): every claim in this file
 * is subject to the B2 fact-verification protocol
 * (docs/APE_CABLE_LAB_PLAN_2026_08_15.md §9). sourceNotes carry the governing
 * standard per claim group; claims that vary by equipment are marked
 * `equipment-dependent` and taught as "verify from the documentation."
 * Consequences are technically proportionate — never dramatized (§5.4).
 *
 * CENTRAL PRINCIPLE for this family: a matching plug proves almost nothing in
 * the digital world. The connector does not define the protocol (Dante vs
 * plain Ethernet, ADAT vs S/PDIF, Thunderbolt vs USB), the cable capability
 * (charge-only USB, USB 2.0-only Type-C, low-category Ethernet), or the power
 * level (PoE, USB Power Delivery). Fitting is not proof of correctness.
 *
 * VOICE: concise, professional, misconception-correcting. No real brands or
 * model likenesses; standard connector names (USB, etherCON, BNC, TOSLINK,
 * HDMI, MIDI…) used nominatively. The xlr3 record in connectors.analog.ts is
 * the calibration exemplar for depth and voice.
 */
import type { ConnectorRecord } from '../cableTypes';

export const CONNECTORS_DIGITAL: ConnectorRecord[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // USB Type-A
  {
    id: 'usb_a',
    displayName: 'USB Type-A',
    aliases: ['USB-A', 'Standard-A', 'rectangular USB (informal)'],
    category: 'digital_data',
    tier: 'core',
    carried: ['hybrid_power_data', 'digital_audio', 'control_data'],
    typicalSources: [
      'Computer and laptop host ports',
      'USB hubs (downstream ports)',
      'Chargers and power banks (power only — no data behind the port)',
    ],
    typicalDestinations: [
      'Audio interface cables (the A end faces the host)',
      'MIDI controller and keyboard cables',
      'Microphones with built-in USB interfaces',
      'Flash storage and license dongles',
    ],
    constructionNote:
      'A USB 2.0 cable carries one twisted data pair plus power conductors under an overall shield; USB 3.x cables add extra shielded high-speed pairs. Charge-only cables omit the data pair entirely and look identical from outside — the connector does not reveal what is inside the jacket.',
    pinouts: [
      {
        id: 'usb_a_data_power',
        application: 'USB data + bus power',
        carried: ['hybrid_power_data'],
        contacts: [
          { label: '1', role: 'VBUS — +5 V bus power', ink: 'dcPos' },
          { label: '2', role: 'D− (USB 2.0 data pair)', ink: 'dataB' },
          { label: '3', role: 'D+ (USB 2.0 data pair)', ink: 'dataA' },
          { label: '4', role: 'GND — power and signal return', ink: 'dcNeg' },
          {
            label: '5–9',
            role: 'SuperSpeed pairs — present only on USB 3.x Type-A connectors and cables',
            ink: 'dataA',
            note: 'A USB 2.0-only Type-A plug or cable simply does not have these contacts; the link then runs at USB 2.0 speed.',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: { method: 'friction' },
    directionality:
      'Type-A is traditionally the HOST end of a link (computer or hub); the peripheral end wears a different shape (B, Micro-B, or C). The plug is keyed and inserts one way up. The connector shape does not set the speed: the USB generation a link actually runs at is negotiated by the ports, the cable, and the devices together.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'USB is designed for connection and removal while powered — devices enumerate when plugged in. Close or stop audio software gracefully before unplugging an audio interface to avoid dropouts and driver errors, and eject storage devices before removal.',
    },
    advantages: [
      'Universally available host port on computers and hubs',
      'Power and data on one cable — many audio devices need no separate supply',
      'Hot-pluggable by design',
      'Backward compatibility across USB generations at the connector level',
    ],
    limitations: [
      'The connector shape does not identify the USB generation, speed, or cable capability — a charge-only cable fits exactly like a data cable',
      'Friction fit only — no latch, so cable strain can interrupt a session',
      'Bus power is limited; some interfaces need more than a port provides and require external power',
      'Cable length is limited compared with network or analog audio runs',
    ],
    commonMistakes: [
      'Grabbing a charge-only cable for an audio interface and concluding the interface is broken when no data flows',
      'Assuming any Type-A port and cable will deliver USB 3.x speed — every link in the chain must support it',
      'Blaming the connector for audio dropouts that actually come from an unpowered hub or an over-long, low-quality cable',
      'Yanking the plug mid-session instead of closing the audio software first',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Charge-only USB cable',
        why: 'Same plug, different cable: charge-only cables carry the power conductors but omit the data pair.',
        consequence:
          'The device powers or charges but never connects for data — no signal, and nothing is damaged. Test or label cables so data cables stay identifiable.',
      },
      {
        otherName: 'USB 2.0-only Type-A cable on a USB 3.x link',
        why: 'The extra SuperSpeed contacts and pairs simply are not present in a USB 2.0 cable.',
        consequence:
          'The link works but negotiates down to USB 2.0 speed — a bandwidth limitation, not a failure. High-channel-count interfaces may not run at full capability.',
      },
    ],
    inspectionPoints: [
      'Bent or spread shell edges that no longer grip the receptacle',
      'Loose, wobbling receptacle on the device — a strained port causes intermittent connections',
      'Corroded or flattened contact fingers inside the plug',
      'Jacket pulling out of the overmold at the connector',
    ],
    basicTest:
      'A USB cable tester (or continuity across matching contacts) shows the power conductors AND the data pair intact end to end. A charge-only cable passes on VBUS/GND and reads open on D+/D− — that is the definitive way to catch one before it wastes troubleshooting time.',
    safety: {
      level: 'signal',
      cautions: [
        'USB bus power is low-voltage DC — not a shock hazard. A damaged cable or connector still causes intermittent power and data faults; replace it rather than working around it.',
      ],
    },
    glossary: [],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l08_selection'],
    sourceNotes: [
      'USB 2.0 Standard-A contact assignment (1 VBUS, 2 D−, 3 D+, 4 GND): USB 2.0 Specification (USB-IF) — VERIFIED 2026-08-15: USB 2.0 Specification (usb.org document library)',
      'USB 3.x Standard-A adds five additional contacts for the SuperSpeed pairs: USB 3.2 Specification (USB-IF) — VERIFIED 2026-08-15: USB-IF specifications (usb.org document library)',
      'Hot-plug with device enumeration is part of the USB design: USB 2.0/3.2 Specifications (USB-IF) — VERIFIED 2026-08-15: USB 2.0/3.2 Specifications via janaxelson.com USB enumeration reference',
      'Charge-only cables (power conductors without a data pair) exist and are visually identical — market fact taught as inspection/testing habit, not a standards claim',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // USB Type-B
  {
    id: 'usb_b',
    displayName: 'USB Type-B',
    aliases: ['USB-B', 'Standard-B', 'printer-style USB (informal)'],
    category: 'digital_data',
    tier: 'core',
    carried: ['hybrid_power_data', 'digital_audio', 'control_data'],
    typicalSources: [
      'The host computer, via the A or C end of the same cable',
    ],
    typicalDestinations: [
      'Desktop audio interfaces',
      'MIDI keyboards and control surfaces',
      'Printers and desktop peripherals',
    ],
    constructionNote:
      'Same cable families as Type-A: a USB 2.0 B cable carries one data pair plus power under a shield. The squarish B connector marks the PERIPHERAL end of the link — the cable construction is set by the USB generation, not by the connector shape.',
    pinouts: [
      {
        id: 'usb_b_data_power',
        application: 'USB 2.0 data + bus power',
        carried: ['hybrid_power_data'],
        contacts: [
          { label: '1', role: 'VBUS — +5 V bus power', ink: 'dcPos' },
          { label: '2', role: 'D− (USB 2.0 data pair)', ink: 'dataB' },
          { label: '3', role: 'D+ (USB 2.0 data pair)', ink: 'dataA' },
          { label: '4', role: 'GND — power and signal return', ink: 'dcNeg' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: { method: 'friction' },
    directionality:
      'Type-B is the PERIPHERAL end: the fixed socket lives on the device (audio interface, keyboard, printer) and the host end of the cable is A or C. The keyed, squarish shape prevents plugging a host port into another host port.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'USB is designed for hot connection — the device enumerates when plugged in. Stop audio software before unplugging a working interface; the connection itself is safe to make or break live.',
    },
    advantages: [
      'Larger, sturdier socket than Micro-B — a practical fit for desktop equipment',
      'Keyed shape makes host/peripheral roles physically unambiguous',
      'Power and data on one cable',
      'Hot-pluggable by design',
    ],
    limitations: [
      'Friction fit only — no latch',
      'The USB 3.x Type-B connector is taller than the 2.0 version: a 3.x B plug does not fit a 2.0 B socket (a 2.0 B plug does fit a 3.x socket, at 2.0 speed)',
      'Increasingly replaced by USB-C on newer equipment, so spares matter for older interfaces',
    ],
    commonMistakes: [
      'Assuming any B cable fits any B socket — the USB 3.x B plug is physically larger and only fits 3.x sockets',
      'Treating the B connector as "the audio interface connector" — it is a general peripheral connector; the interface defines what runs over it',
      'Leaving the cable dangling by the plug; the socket takes the strain over time',
    ],
    notInterchangeableWith: [
      {
        otherName: 'USB 3.x Type-B plug into a USB 2.0 Type-B socket',
        why: 'The 3.x B connector adds a taller contact section for the SuperSpeed pairs; the 2.0 socket has no room for it.',
        consequence:
          'It does not insert — no connection is possible. The reverse direction (2.0 plug into 3.x socket) works at USB 2.0 speed.',
      },
      {
        otherId: 'usb_micro_b',
        otherName: 'USB Micro-B',
        why: 'Both are peripheral-end USB connectors, but they are different shapes for different device sizes.',
        consequence: 'They do not mate — wrong cable for the job, no connection, nothing damaged.',
      },
    ],
    inspectionPoints: [
      'Cracked or spread plug shell',
      'Device socket loose on its circuit board — wiggle-test with the equipment unpowered',
      'Bent contact fingers inside the plug',
      'Strain relief separating from the overmold',
    ],
    basicTest:
      'Continuity across matching contacts end to end (VBUS, D+, D−, GND all intact, no bridging). As with every USB cable, confirming the DATA pair is present separates a real data cable from a charge-only lookalike.',
    safety: {
      level: 'signal',
      cautions: [
        'Low-voltage DC only — not a shock hazard. Replace damaged cables instead of taping them; intermittent USB faults are a session-stopper.',
      ],
    },
    glossary: [],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l08_selection'],
    sourceNotes: [
      'USB 2.0 Standard-B contact assignment (1 VBUS, 2 D−, 3 D+, 4 GND): USB 2.0 Specification (USB-IF) — VERIFIED 2026-08-15: pinoutguide.com USB 3.0 connector pinout',
      'USB 3.x Standard-B connector is dimensionally larger; 3.x plug does not mate with a 2.0 receptacle while a 2.0 plug mates with a 3.x receptacle: USB 3.2 Specification (USB-IF) — VERIFIED 2026-08-15: pinoutguide.com USB 3.0 connector pinout',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // USB Micro-B
  {
    id: 'usb_micro_b',
    displayName: 'USB Micro-B',
    aliases: ['Micro-USB', 'Micro-B'],
    category: 'digital_data',
    tier: 'core',
    carried: ['hybrid_power_data', 'digital_audio', 'control_data'],
    typicalSources: [
      'The host computer or charger, via the A or C end of the same cable',
    ],
    typicalDestinations: [
      'Compact audio interfaces and portable recorders',
      'Small MIDI controllers',
      'Older phones, tablets, and battery-powered accessories',
    ],
    constructionNote:
      'Same USB 2.0 cable construction as the larger connectors — one data pair plus power conductors — terminated in a very small, thin plug. The small size is the point and also the weakness: the connector and socket carry the same signals with far less mechanical margin.',
    pinouts: [
      {
        id: 'usb_micro_b_data_power',
        application: 'USB 2.0 data + bus power (5 contacts)',
        carried: ['hybrid_power_data'],
        contacts: [
          { label: '1', role: 'VBUS — +5 V bus power', ink: 'dcPos' },
          { label: '2', role: 'D− (USB 2.0 data pair)', ink: 'dataB' },
          { label: '3', role: 'D+ (USB 2.0 data pair)', ink: 'dataA' },
          {
            label: '4',
            role: 'ID — host/peripheral role detection (USB On-The-Go)',
            ink: 'clock',
            note: 'A configuration contact, not a signal: its wiring inside the plug tells an OTG-capable device whether to act as host or peripheral. Unconnected in ordinary cables.',
          },
          { label: '5', role: 'GND — power and signal return', ink: 'dcNeg' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: { method: 'friction' },
    directionality:
      'Micro-B is a PERIPHERAL-end connector with a keyed trapezoid shape — it inserts one way. With USB On-The-Go, some devices can switch between host and peripheral roles; the ID contact in the plug signals which role is requested.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'USB is designed for hot connection. The practical caution with Micro-B is mechanical, not electrical: the small socket tolerates little sideways force, so support the cable and unplug straight out.',
    },
    advantages: [
      'Very small — enabled compact and portable equipment',
      'Full USB 2.0 data and power in minimal space',
      'Hot-pluggable by design',
    ],
    limitations: [
      'Mechanically the most fragile common USB connector — the socket is a frequent failure point on heavily used portable gear',
      'USB 2.0 speeds in the common form (a wider two-part Micro-B "SuperSpeed" variant exists but is rare in audio equipment)',
      'Friction fit with tiny retention springs — strain or a worn plug leads to intermittent contact',
      'Largely superseded by USB-C on current equipment',
    ],
    commonMistakes: [
      'Forcing the trapezoid plug in upside down — it is keyed; if it resists, flip it',
      'Letting the cable hang off a table edge by the plug — the socket takes the damage',
      'Confusing Micro-B with the older Mini-B connector; they are different shapes and do not mate',
      'Assuming a worn, loose connection is a software problem — inspect the connector first',
    ],
    notInterchangeableWith: [
      {
        otherName: 'USB Mini-B (older small connector)',
        why: 'Mini-B is an earlier, thicker small-format USB connector; Micro-B replaced it.',
        consequence: 'They do not mate — wrong cable, no connection, nothing damaged.',
      },
      {
        otherName: 'Micro-B SuperSpeed (wide two-section plug)',
        why: 'The USB 3.x Micro-B plug adds a second contact block beside the 2.0 section.',
        consequence:
          'The wide 3.x plug does not fit a standard Micro-B socket. A standard Micro-B plug fits the 2.0 section of a SuperSpeed socket and runs at USB 2.0 speed.',
      },
    ],
    inspectionPoints: [
      'Loose or rocking fit in the device socket — worn retention springs',
      'Bent shell lips on the plug',
      'Debris packed into the device socket (a common cause of "broken" ports)',
      'Charging works but data does not — suspect a charge-only cable or worn data contacts',
    ],
    basicTest:
      'Continuity across VBUS, D+, D−, and GND end to end. Because Micro-B cables shipped with countless charge-only accessories, testing the data pair before a session is especially worthwhile in this format.',
    safety: {
      level: 'signal',
      cautions: [
        'Low-voltage DC only — not a shock hazard. A worn Micro-B connection that powers a device intermittently can interrupt recordings; replace suspect cables and have the socket serviced if it wobbles.',
      ],
    },
    glossary: [],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l09_handling'],
    sourceNotes: [
      'Micro-B contact assignment (1 VBUS, 2 D−, 3 D+, 4 ID, 5 GND): Micro-USB Cables and Connectors Specification (USB-IF) — VERIFIED 2026-08-15: Micro-USB / USB 3.2 specs via accesscomms.com.au USB pinout reference',
      'ID contact function for On-The-Go host/peripheral role selection: USB OTG Supplement (USB-IF) — VERIFIED 2026-08-15: Micro-USB / USB 3.2 specs via accesscomms.com.au USB pinout reference',
      'USB 3.x Micro-B is a wider two-section connector; standard Micro-B plug mates with its 2.0 section: USB 3.2 Specification (USB-IF) — VERIFIED 2026-08-15: Micro-USB / USB 3.2 specs via accesscomms.com.au USB pinout reference',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // USB Type-C
  {
    id: 'usb_c',
    displayName: 'USB Type-C',
    aliases: ['USB-C', 'Type-C'],
    category: 'digital_data',
    tier: 'core',
    carried: ['hybrid_power_data', 'digital_audio', 'control_data', 'dc_power'],
    typicalSources: [
      'Computer, laptop, tablet, and phone ports',
      'USB PD chargers and power banks',
      'Docks and hubs',
    ],
    typicalDestinations: [
      'Audio interfaces (current generation)',
      'MIDI controllers',
      'Portable recorders and cameras',
      'Displays and docks (alternate modes, equipment-dependent)',
    ],
    constructionNote:
      'This is the connector where "the plug does not define the cable" matters most. Behind the identical oval plug, a cable may contain only the USB 2.0 pair and power conductors, or a full set of shielded high-speed pairs; it may or may not carry an electronic marker chip that certifies higher current. Two USB-C cables that look identical can differ in data speed, power rating, and alternate-mode support. The cable is a component with its own specification — check it, don’t assume it.',
    pinouts: [
      {
        id: 'usb_c_contact_groups',
        application: 'Contact groups (24-contact interface, summarized)',
        carried: ['hybrid_power_data'],
        contacts: [
          { label: 'GND', role: 'Ground return (multiple contacts)', ink: 'dcNeg' },
          {
            label: 'VBUS',
            role: 'Bus power (multiple contacts) — 5 V by default, higher only after a Power Delivery negotiation',
            ink: 'dcPos',
          },
          {
            label: 'TX/RX pairs',
            role: 'High-speed differential pairs — USB 3.x/USB4 data, or reassigned to alternate modes such as DisplayPort',
            ink: 'dataA',
          },
          { label: 'D+/D−', role: 'USB 2.0 data pair', ink: 'dataB' },
          {
            label: 'CC1/CC2',
            role: 'Configuration channel — detects orientation and the attached cable, negotiates host/device roles and Power Delivery',
            ink: 'clock',
            note: 'A configuration contact, not a clock: this is where plug orientation, power contracts, and cable identity are worked out.',
          },
          {
            label: 'SBU1/SBU2',
            role: 'Sideband contacts — used by alternate modes (e.g. audio or DisplayPort auxiliary), idle otherwise',
            ink: 'clock',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: { method: 'friction' },
    directionality:
      'The plug is reversible — either way up works, and the configuration channel sorts out orientation electronically. Host/device and power source/sink roles are also negotiated electronically rather than fixed by connector gender. Note that Thunderbolt and other protocols use this same connector shape: the port’s markings and the equipment documentation, not the oval outline, tell you what a port actually speaks.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'Designed for hot connection: power beyond the 5 V default flows only after the two ends and the cable negotiate a Power Delivery contract. As with any audio interface, stop software gracefully before unplugging mid-session.',
    },
    advantages: [
      'Reversible plug — no wrong way up',
      'One connector for data, substantial negotiated power, and display output on supporting equipment',
      'High data rates on full-featured cables',
      'Replaces several older connector types on current equipment',
    ],
    limitations: [
      'Identical plugs hide very different cables: USB 2.0-only, full-featured, higher-current e-marked, and alternate-mode support all look the same from outside',
      'A port’s capabilities are equipment-dependent — not every USB-C port supplies high power or supports display alternate modes, and a Thunderbolt-only accessory may not work on a plain USB port',
      'Friction fit — no latch',
      'Labeling on cables and ports is inconsistent in practice, so testing and labeling your own stock pays off',
    ],
    commonMistakes: [
      'Assuming any USB-C cable can do what any other did — charge-only and USB 2.0-only C-to-C cables are common',
      'Expecting full charging speed through an unrated cable — with standards-compliant hardware the link negotiates DOWN to what the cable certifies, so the usual result is slow charging, not danger. Non-compliant cables that misreport themselves do exist and have damaged equipment — buy certified cables and retire anything suspect.',
      'Plugging a Thunderbolt or DisplayPort-alt-mode device into a USB-C port that does not support that mode and concluding the device is faulty',
      'Buying by plug shape instead of by the cable’s stated data and power rating',
    ],
    notInterchangeableWith: [
      {
        otherName: 'USB 2.0-only or charge-only USB-C cable on a high-speed link',
        why: 'Same plug, reduced cable: the high-speed pairs (or the data pair entirely) are absent.',
        consequence:
          'The link falls back to whatever the cable supports — low speed or power-only. No signal or reduced capability, not damage — the negotiation protects the equipment when the cable reports itself honestly, which is one more reason to buy certified cables.',
      },
      {
        otherId: 'usb_c_power',
        otherName: 'USB-C used purely for Power Delivery charging',
        why: 'The same connector serves as a pure power inlet on much equipment; a power-only port or cable proves nothing about data.',
        consequence:
          'Data simply does not flow through a power-only path. Check the port markings and documentation rather than the connector shape.',
      },
      {
        otherName: 'Thunderbolt-required link over a basic USB-C cable',
        why: 'Thunderbolt uses the USB-C shape but requires cables and ports rated for it.',
        consequence:
          'The device is not recognized or runs in a reduced mode — protocol incompatibility, not damage.',
      },
    ],
    inspectionPoints: [
      'Lint or debris packed into the port (the most common cause of loose USB-C connections)',
      'Loose, rocking fit — worn plug or damaged port retention',
      'Kinked or crushed cable sections — high-speed pairs are sensitive to damage even when power still passes',
      'Heat at the connector during charging — stop and replace the cable/charger pairing before continuing',
    ],
    basicTest:
      'Meaningful USB-C verification needs a purpose-made cable tester: continuity alone cannot confirm the high-speed pairs, the e-marker, or the power rating. A basic continuity check can still catch a fully dead cable; a session-critical rig should keep known-good, labeled cables instead of trusting lookalikes.',
    safety: {
      level: 'signal',
      cautions: [
        'USB-C Power Delivery can negotiate substantial DC power (up to 240 W under the current specification, with cables rated for it). The negotiation happens automatically and higher power flows only through rated, e-marked cables — but a visibly damaged high-power cable should be retired, not reused.',
      ],
    },
    glossary: [],
    relatedLessons: ['l04_same_plug', 'l06_digital', 'l07_power', 'l08_selection'],
    sourceNotes: [
      'USB-C 24-contact interface and contact groups (VBUS, GND, TX/RX pairs, D+/D−, CC, SBU): USB Type-C Cable and Connector Specification (USB-IF) — VERIFIED 2026-08-15: Renesas USB-C 240W PD 3.1 EPR application note',
      'Cables rated above 3 A must contain an electronic marker (e-marker) chip: USB Type-C / USB PD Specifications (USB-IF) — VERIFIED 2026-08-15: Renesas USB-C 240W PD 3.1 EPR application note',
      'USB Power Delivery maximum 240 W (48 V / 5 A, Extended Power Range with EPR-rated cables): USB PD 3.1 Specification (USB-IF) — VERIFIED 2026-08-15: Renesas USB-C 240W PD 3.1 EPR application note',
      'VBUS above the 5 V default only after an explicit PD contract: USB PD Specification (USB-IF) — VERIFIED 2026-08-15: Renesas USB-C 240W PD 3.1 EPR application note',
      'Alternate modes (e.g. DisplayPort) reassign the high-speed pairs and SBU contacts; Thunderbolt uses the USB-C connector: USB-IF alt-mode documents / Intel Thunderbolt documentation — VERIFIED 2026-08-15: Renesas USB-C 240W PD 3.1 EPR application note',
      'Negotiate-down protection assumes standards-compliant cables; non-compliant USB-C cables that misreport themselves have damaged equipment (documented Benson Leung / Google Pixel case): PCWorld report on non-compliant USB-C cables — VERIFIED 2026-08-15',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Ethernet 8P8C
  {
    id: 'ethernet_8p8c',
    displayName: '8P8C modular (Ethernet)',
    aliases: ['RJ45 (universal informal name)', 'Ethernet connector', 'network plug', 'modular plug'],
    category: 'network',
    tier: 'core',
    carried: ['network_audio', 'control_data', 'hybrid_power_data'],
    typicalSources: [
      'Network switches and routers',
      'Console and stage-box network ports',
      'Computers running audio-over-IP software',
      'PoE-capable switch ports (power + data)',
    ],
    typicalDestinations: [
      'Digital stage boxes and snake heads',
      'Networked amplifiers and processors',
      'Wireless access points and control surfaces',
      'Wall plates and patch panels',
    ],
    construction: 'ethernet_4pair',
    constructionNote:
      'Four twisted pairs, each pair twisted at its own rate to reject interference — this pair integrity is what makes high speeds work, and it is why terminations keep the untwisting as short as possible. Cable CATEGORY (Cat 5e, 6, 6A…) sets the speed and distance the cable supports; the plug looks the same on all of them.',
    pinouts: [
      {
        id: 't568b',
        application: 'T568B termination (either scheme is valid — use ONE consistently)',
        carried: ['network_audio', 'control_data'],
        contacts: [
          {
            label: '1',
            role: 'Pair 2 — white/orange (T568B)',
            ink: 'dataA',
            note: 'T568A is EQUALLY valid: it swaps the orange and green pairs. What matters is that both ends of a cable follow the intended scheme.',
          },
          { label: '2', role: 'Pair 2 — orange (T568B)', ink: 'dataA' },
          {
            label: '3',
            role: 'Pair 3 — white/green (T568B)',
            ink: 'dataB',
            note: '10/100 Mb links transmit on pairs 2 and 3; gigabit and faster use all four pairs.',
          },
          { label: '4', role: 'Pair 1 — blue (T568B)', ink: 'dataA' },
          { label: '5', role: 'Pair 1 — white/blue (T568B)', ink: 'dataA' },
          { label: '6', role: 'Pair 3 — green (T568B)', ink: 'dataB' },
          { label: '7', role: 'Pair 4 — white/brown (T568B)', ink: 'dataB' },
          { label: '8', role: 'Pair 4 — brown (T568B)', ink: 'dataB' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'balanced',
    channels: 'varies',
    locking: {
      method: 'latch',
      howToConfirm:
        'Push in until the tab clicks, then tug gently — a latched plug stays put. A plug with a snapped-off tab will seat but WILL work loose; retire it.',
    },
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'Ethernet is designed for live connection — the link negotiates when plugged in. Expect audio-over-IP streams and control sessions on that line to drop and re-establish; on a show network, patch changes belong in setup time, not mid-show. One physical caveat on PoE runs: unplugging under power draws a tiny arc that erodes the contacts over repeated cycles. Where practical, disable the PoE port or power down the device before unplugging a high-power run, and expect frequently re-patched powered jacks to wear faster.',
    },
    advantages: [
      'One inexpensive, universal termination for data, audio-over-IP, control, and (with PoE) power',
      'Long runs compared with USB — structured cabling reaches across a building',
      'Latching plug resists accidental pull-out',
      'Four balanced pairs give strong interference rejection',
    ],
    limitations: [
      'The connector proves NOTHING about the protocol: networked-audio systems (such as Dante or AVB), digital snake protocols (such as AES50), and plain office networking all use the same plug — matching ports do not mean compatible equipment',
      'Cable category and condition set the real speed and distance; the plug looks identical on every grade',
      'The plastic latch tab is the weak point — it snaps off and the cable then creeps loose',
      'Field termination is skill-sensitive: split pairs and excess untwist pass a casual look but fail at speed',
      'Some digital-audio transports have stricter cable and length requirements than office networking — equipment-dependent; check the system manual',
    ],
    commonMistakes: [
      'Assuming two devices are compatible because both have this port — the protocol, not the connector, decides',
      'Terminating one end T568A and the other T568B by accident: that builds a crossover cable, which modern auto-sensing equipment may tolerate but which is a mislabeled, inconsistent termination that will confuse later troubleshooting',
      'Splitting pairs (right pin count, wrong pairing) — passes simple continuity, fails at gigabit speeds',
      'Using a low-category or damaged patch cable on a high-channel-count audio network and blaming the equipment',
      'Ignoring a snapped latch tab',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Telephone modular plugs (RJ11/RJ12, 6-position)',
        why: 'The narrower telephone plug can physically enter an 8P8C jack.',
        consequence:
          'No working connection, and the narrow plug can bend the jack’s outer contacts, leaving intermittent faults for the next proper cable. Keep telephone cords away from network jacks. Note also that a telephone cord may be live: analog phone lines carry roughly 48 V DC and up to ~90 V AC while ringing — enough to feel and enough to matter to equipment. An old wall jack is not automatically “just signal” because it fits the shape; identify unknown building jacks before patching into them.',
      },
      {
        otherName: 'A different protocol on the same connector (e.g. a digital-snake port vs an office LAN port)',
        why: 'Many systems use this connection; the shell cannot tell you which one a port speaks.',
        consequence:
          'Protocol incompatibility — the link may show activity yet pass no usable audio, or fail entirely. Identify ports from labels and documentation, not shape.',
      },
    ],
    inspectionPoints: [
      'Snapped or weakened latch tab',
      'Cracked plug body or contacts pushed to unequal depths',
      'Excess untwisted conductor visible inside the plug — a termination-quality warning',
      'Kinks, crush marks, or tight staples along the run — pair geometry damage is invisible from outside',
    ],
    basicTest:
      'A network cable tester with a wiremap function is the right tool: it confirms 1→1 through 8→8 AND correct pairing. Simple continuity cannot catch a split pair — the classic fault that passes a basic test and still fails at speed. Verify both the map and the pairing.',
    safety: {
      level: 'signal',
      cautions: [
        'Power over Ethernet can place tens of watts of DC power on the same cable as the data (up to roughly 90 W under IEEE 802.3bt). Standards-based PoE energizes only after detecting a compatible device, so it is not a shock hazard in normal handling — but damaged cables and connectors on PoE runs still deserve prompt replacement. That detection step belongs only to standards-based (IEEE 802.3af/at/bt) equipment. “Passive” PoE injectors — still widely sold — put their full voltage on the pairs permanently with no detection and can damage non-PoE devices (or a cable tester) connected to an energized run. Identify what feeds a run before patching it.',
      ],
    },
    glossary: ['Balanced signaling'],
    relatedLessons: ['l02_anatomy', 'l04_same_plug', 'l06_digital', 'l08_selection'],
    sourceNotes: [
      'T568A and T568B pin/pair assignments; both schemes valid, consistency required: ANSI/TIA-568 — VERIFIED 2026-08-15: ANSI/TIA-568 (TIA/EIA-568-B text)',
      '10BASE-T/100BASE-TX use pairs on pins 1-2 and 3-6; 1000BASE-T uses all four pairs: IEEE 802.3 — VERIFIED 2026-08-15: ANSI/TIA-568 (TIA/EIA-568-B text)',
      'PoE detection-before-power (standards-based IEEE PoE) and power levels up to ~90 W (Type 4): IEEE 802.3af/at/bt — VERIFIED 2026-08-15: HPE Aruba AOS-CX PoE overview',
      'Cable categories and their supported speeds/distances: ANSI/TIA-568 series — VERIFY',
      'RJ11-style 6-position plugs can bend/recess 8P8C jack outer contacts (pins 1/8): installer and manufacturer guidance (e.g. Lynx Networks) and US Patent 7,125,288, which addresses exactly this failure mode — VERIFIED 2026-08-15',
      'Passive PoE injectors energize the pairs permanently with no detection and can damage non-PoE devices: FS.com PoE injector guide — VERIFIED 2026-08-15',
      'Analog telephone lines carry roughly 48 V DC on-hook and up to ~90 V AC while ringing: Sandman ring-voltage tech bulletin — VERIFIED 2026-08-15',
      'Unplugging under PoE load draws an arc that erodes contact plating over cycles; connectors are tested to survive load cycles: UL on IEC 60512-99-001/-002 — VERIFIED 2026-08-15',
      '“RJ45” strictly names a telephone registered-jack wiring scheme; the connector is 8P8C — nomenclature note, taught informally',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // etherCON-style ruggedized Ethernet
  {
    id: 'ethercon_style',
    displayName: 'etherCON-style locking Ethernet',
    aliases: ['etherCON (used nominatively)', 'ruggedized RJ45 shell', 'locking Ethernet connector'],
    category: 'network',
    tier: 'core',
    carried: ['network_audio', 'control_data', 'hybrid_power_data'],
    typicalSources: [
      'Digital consoles and stage boxes with locking network ports',
      'Touring network switches and breakout panels',
    ],
    typicalDestinations: [
      'Stage boxes and digital snake heads',
      'Networked speaker processors and amplifier racks',
      'Front-of-house-to-stage network trunk lines',
    ],
    construction: 'ethernet_4pair',
    constructionNote:
      'Electrically this IS an Ethernet connection: the same four twisted pairs, the same termination standards, usually on ruggedized, flexible-jacket network cable built for stage handling. The shell system adds mechanical protection — it adds nothing electrical.',
    pinouts: [
      {
        id: 'ethercon_t568b',
        application: 'Ethernet connection inside the shell (T568B shown; T568A equally valid)',
        carried: ['network_audio', 'control_data'],
        contacts: [
          {
            label: '1',
            role: 'Pair 2 — white/orange (T568B)',
            ink: 'dataA',
            note: 'Identical to any 8P8C termination — the locking shell changes nothing about the contacts or the standards that govern them.',
          },
          { label: '2', role: 'Pair 2 — orange (T568B)', ink: 'dataA' },
          { label: '3', role: 'Pair 3 — white/green (T568B)', ink: 'dataB' },
          { label: '4', role: 'Pair 1 — blue (T568B)', ink: 'dataA' },
          { label: '5', role: 'Pair 1 — white/blue (T568B)', ink: 'dataA' },
          { label: '6', role: 'Pair 3 — green (T568B)', ink: 'dataB' },
          { label: '7', role: 'Pair 4 — white/brown (T568B)', ink: 'dataB' },
          { label: '8', role: 'Pair 4 — brown (T568B)', ink: 'dataB' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'balanced',
    channels: 'varies',
    locking: {
      method: 'latch',
      howToConfirm:
        'Push in until the shell latch clicks, then pull back gently — a locked connector will not release without pressing the latch. This positive lock is the entire reason the shell exists.',
    },
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'Same electrical behavior as any Ethernet connection — safe to connect live, with the same caveat: audio-over-IP and control streams on the line drop and re-establish. On a running show, that is a setup-time operation.',
    },
    advantages: [
      'Positive lock — a stage-worthy answer to the fragile plastic latch tab',
      'Shell shields the plug body and contacts from impact, dirt, and cable strain',
      'Chassis connectors mount securely in panels and racks',
      'Uses standard Ethernet cabling and termination underneath',
    ],
    limitations: [
      'It is NOT a different network standard — a locking shell does not change speed, protocol, or compatibility',
      'Bulkier and costlier than bare 8P8C; overkill for fixed installation racks',
      'Fit between ruggedized cable plugs and ordinary recessed jacks is mechanical and product-specific — check clearance rather than assuming (equipment-dependent)',
      'The same protocol caution as all networking: a locking shell on both ends still does not prove the two devices speak the same system',
    ],
    commonMistakes: [
      'Believing the rugged shell marks a special "digital snake connector" — it is Ethernet with mechanical armor; the system behind the port defines the protocol',
      'Forcing a large shell plug into a tight, recessed consumer jack instead of checking clearance',
      'Skipping the pull-back check after the click',
      'Using fragile office patch cable on stage because "it is the same connection" — electrically true, mechanically wrong',
    ],
    notInterchangeableWith: [
      {
        otherId: 'ethernet_8p8c',
        otherName: 'Ordinary 8P8C/Ethernet plug',
        why: 'The shell system is a mechanical superset of the same connection — chassis shells generally accept ordinary plugs, but an ordinary plug gains no lock.',
        consequence:
          'An unlocked patch works electrically but can vibrate or pull loose during a show — a reliability difference, not a signal difference. Verify the mating combination on the actual hardware (equipment-dependent).',
      },
    ],
    inspectionPoints: [
      'Latch mechanism operates and springs back',
      'Shell free of cracks and bent metal; boot intact where the cable enters',
      'The 8P8C contacts inside — same checks as any network plug',
      'Chassis connectors tight in their panels',
    ],
    basicTest:
      'Identical to any Ethernet cable: a wiremap tester confirming 1→1 through 8→8 with correct pairing. The shell adds nothing to test electrically — but do also confirm the latch physically locks.',
    safety: {
      level: 'signal',
      cautions: [
        'Same as any Ethernet run: PoE may put tens of watts of DC on the line — energized only after device detection on standards-based (IEEE 802.3) equipment, but permanently energized by passive injectors, which perform no detection. The locking shell does not change the electrical picture at all.',
      ],
    },
    glossary: ['Balanced signaling', 'Snake'],
    relatedLessons: ['l06_digital', 'l08_selection', 'l09_handling'],
    sourceNotes: [
      'Termination standards identical to 8P8C (T568A/T568B): ANSI/TIA-568 — VERIFIED 2026-08-15: Neutrik etherCON documentation (shell is mechanical only)',
      'Locking shell system around a standard modular connector; chassis/plug mating combinations: manufacturer documentation (e.g. Neutrik etherCON series, used nominatively) — VERIFIED 2026-08-15: Neutrik etherCON documentation + etherCON FAQ',
      'PoE behavior unchanged by the shell: IEEE 802.3 — VERIFY',
      'Passive PoE injectors energize the pairs permanently with no detection (unlike standards-based IEEE 802.3 PoE): FS.com PoE injector guide — VERIFIED 2026-08-15',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // BNC
  {
    id: 'bnc',
    displayName: 'BNC',
    aliases: ['bayonet coax connector', 'word clock connector (informal, by association)'],
    category: 'digital_data',
    tier: 'core',
    carried: ['clock_sync', 'digital_audio'],
    typicalSources: [
      'Master clock generator outputs',
      'Interface and console word clock outputs',
      'Video and sync equipment outputs',
    ],
    typicalDestinations: [
      'Word clock inputs on interfaces, consoles, and converters',
      'Video and sync inputs',
      'Coaxial digital audio inputs on equipment that provides them',
    ],
    construction: 'coax',
    constructionNote:
      'Coaxial cable: one center conductor inside a dielectric, wrapped by a shield that is also the return path. The geometry of that sandwich sets the cable’s characteristic impedance — a property you cannot see from outside and a continuity tester cannot measure. 50-ohm and 75-ohm cables and connectors look nearly identical; the printing on the jacket and the datasheet are what tell them apart.',
    pinouts: [
      {
        id: 'coaxial_signal',
        application: 'Coaxial signal (all uses — the two contacts never change, the system does)',
        carried: ['clock_sync', 'digital_audio'],
        contacts: [
          { label: 'Center', role: 'Center conductor — carries the signal', ink: 'signalPos' },
          { label: 'Shield', role: 'Shield — return path and screening', ink: 'shield' },
        ],
        confidence: 'standard',
      },
      {
        id: 'word_clock',
        application: 'Word clock (sample-rate synchronization)',
        carried: ['clock_sync'],
        contacts: [
          { label: 'Center', role: 'Clock signal — one pulse per sample period', ink: 'clock' },
          { label: 'Shield', role: 'Shield / return', ink: 'shield' },
        ],
        confidence: 'convention',
        verifyAgainst:
          'The equipment manuals: word clock I/O is commonly a 75-ohm system, and whether a chain needs a termination at the last device (or the device self-terminates via a switch) varies by product.',
      },
    ],
    balanced: 'unbalanced',
    channels: 'varies',
    locking: {
      method: 'bayonet',
      howToConfirm:
        'Push, then twist the collar a quarter turn until the bayonet pins seat in their slots with a positive stop. A gentle pull-back confirms it — a seated BNC does not come off without twisting.',
    },
    directionality:
      'Clock flows from one master output to device clock inputs; how a multi-device chain is distributed and terminated is equipment-dependent — the system manuals govern.',
    hotPlug: {
      policy: 'mute_first',
      rationale:
        'Electrically safe to connect live — but mute monitoring first: every device slaved to the clock will unlock and re-lock, producing clicks, dropouts, or brief mutes. Re-patch clock lines between takes, never mid-take.',
    },
    advantages: [
      'Bayonet lock — fast, positive, vibration-resistant',
      'Consistent coaxial geometry preserves signal integrity for clocks and high-frequency signals',
      'Compact and rugged; the standard connector for word clock and much video/sync equipment',
    ],
    limitations: [
      '50-ohm and 75-ohm connector and cable families exist, look nearly identical, and mate physically — the connector cannot tell you which one you are holding',
      'The same two contacts serve many unrelated systems (word clock, digital audio, video, sync, RF) — the connector alone does not identify the signal',
      'Chain distribution and termination rules for word clock vary by equipment; a chain that works by luck at one length can glitch at another',
      'Unbalanced — the shield is the return, so cable quality and routing matter',
    ],
    commonMistakes: [
      'Grabbing any coax with the right connector for a clock line — impedance family and cable quality matter on long runs',
      'Assuming a BNC port is word clock because word clock is the famous audio use — read the panel label; it may be video, sync, or something else entirely, and some RF/antenna lines carry always-on DC power on the center pin to feed remote amplifiers — one more reason to identify a BNC line from labels and documentation before patching it into a signal input',
      'Ignoring the manual’s termination instructions when daisy-chaining clock, then chasing intermittent lock problems',
      'Re-patching clock mid-take and being surprised by the mute',
    ],
    notInterchangeableWith: [
      {
        otherName: '50-ohm vs 75-ohm cable/connector families',
        why: 'Both families mate mechanically; the impedance difference is invisible from outside.',
        consequence:
          'An impedance mismatch causes reflections — on long runs or marginal equipment that means clocking instability or signal-integrity problems, not equipment damage. Match the impedance the system specifies. (True of modern connectors built to the standardized interface. Some pre-1978, pre-standard 75-ohm BNCs used a thinner center pin and can mate unreliably with — or damage — the other family; treat very old coax hardware as an exception and inspect the pin before forcing anything.)',
      },
      {
        otherId: 'rca',
        otherName: 'RCA coaxial digital connections (via adapters)',
        why: 'Adapters between BNC and RCA exist, and both can carry unbalanced digital audio.',
        consequence:
          'Adapted connections can work but add discontinuities to a controlled-impedance path — acceptable in a pinch, a reliability compromise on critical or long runs.',
      },
    ],
    inspectionPoints: [
      'Bayonet collar spins freely and locks with a positive stop',
      'Center pin straight, at correct depth, not receded into the dielectric',
      'Shield crimp solid — no rotation between the cable and the connector body',
      'Jacket printing legible enough to identify the cable’s impedance and type',
    ],
    basicTest:
      'Continuity center-to-center and shield-to-shield with no short between them. Understand what this does NOT show: characteristic impedance is invisible to a continuity tester — a 50-ohm and a 75-ohm cable both pass identically. The jacket printing identifies the cable; the tester only proves it is intact.',
    safety: {
      level: 'signal',
      cautions: [
        'Word clock and digital audio on BNC are signal-level — not a shock hazard. The real risk of casual patching is operational: interrupting a clock line mutes or glitches every device slaved to it.',
      ],
    },
    glossary: ['BNC Connector (Bayonet Neill-Concelman)', 'Coaxial Cable'],
    relatedLessons: ['l02_anatomy', 'l04_same_plug', 'l06_digital'],
    sourceNotes: [
      'BNC connector family, 50-ohm and 75-ohm variants, physical intermateability (modern IEC-interface parts; pre-1978 pre-standard 75-ohm parts excepted): IEC 61169-8 — VERIFIED 2026-08-15: Rosenberger BNC 50/75-ohm (IEC 61169-8)',
      'Word clock distribution commonly implemented as a 75-ohm system; termination practice varies by equipment: AES11 (DARS reference synchronization; word clock practice per equipment documentation) — convention VERIFIED 2026-08-15: Sound On Sound digital interfacing; AES11 citation wording — EXPERT REVIEW PENDING',
      'Impedance mismatch produces reflections/signal-integrity degradation, proportionate to run length and signal bandwidth; no authoritative equipment-damage case found: transmission-line fundamentals — VERIFIED 2026-08-15: Rosenberger BNC 50/75-ohm (IEC 61169-8)',
      'Coaxial digital audio interconnection at 75 ohms (AES3id/S-PDIF coax practice): AES-3id / IEC 60958 — VERIFY',
      'Pre-standard (pre-1978) 75-ohm BNC center-pin diameter variance can mis-mate with or damage the other family: forum/blog-grade broadcast engineering reports + IEC 169-8 standardization history — EXPERT REVIEW PENDING',
      'Some RF/antenna distribution coax carries always-on DC (bias-tee feeds for remote amplifiers) on the center conductor: data-alliance.net BNC applications + general bias-tee practice — EXPERT REVIEW PENDING',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TOSLINK optical
  {
    id: 'toslink',
    displayName: 'TOSLINK optical',
    aliases: ['optical connector', 'EIAJ optical', 'ADAT port (informal, by protocol association)', 'F05 connector'],
    category: 'optical',
    tier: 'core',
    carried: ['digital_audio'],
    typicalSources: [
      'Interface and console optical outputs',
      'Consumer players and TVs (optical digital out)',
      'Multichannel mic-preamp optical outputs',
    ],
    typicalDestinations: [
      'Interface optical inputs',
      'Digital-to-analog converters',
      'Soundbars and home receivers',
    ],
    construction: 'optical_fiber',
    constructionNote:
      'An optical fiber: a light-carrying core inside cladding and a protective jacket. There is NO electrical conductor — the signal is pulses of light. That is why this cable is immune to hum, interference, and ground loops, and also why kinks, tight bends, and scratched end-faces (faults that would not bother a copper cable) can degrade or kill the signal.',
    pinouts: [
      {
        id: 'optical_path',
        application: 'Optical digital audio (one fiber, one direction)',
        carried: ['digital_audio'],
        contacts: [
          {
            label: 'Fiber',
            role: 'Optical path — digital audio carried as light pulses; no electrical connection of any kind',
            ink: 'optical',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: { method: 'friction' },
    directionality:
      'Light travels one way through one fiber: from a transmit port to a receive port. Bidirectional audio needs two cables. The keyed plug inserts one way around.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'It is light, not electricity — connecting live produces no electrical transient at all. The receiving device simply mutes until it sees a valid signal and unmutes when it locks.',
    },
    advantages: [
      'Complete electrical isolation — no ground path through the cable, so ground loops and hum cannot travel this link',
      'Immune to electromagnetic interference',
      'Carries multichannel digital audio (protocol-dependent) through a thin, light cable',
    ],
    limitations: [
      'The port does not identify the protocol: optical S/PDIF (stereo) and ADAT (multichannel) use the same connector and fiber but are different, incompatible formats — both devices must be set to the same one',
      'Fragile compared with copper: tight bends, kinks, and crushing damage the fiber invisibly',
      'End-faces must stay clean and unscratched; dust caps exist for a reason',
      'Practical run lengths are shorter than balanced copper or network runs (cable- and equipment-dependent)',
      'No power can be carried — this is signal only, by physics',
    ],
    commonMistakes: [
      'Connecting an ADAT output to a device expecting optical S/PDIF (or vice versa) and getting silence — or, on some equipment, noise — same plug, different protocol; set both ends to match',
      'Coiling optical cable tightly or bending it around sharp corners — respect the bend radius',
      'Leaving ports and cable ends uncapped in dusty environments, then troubleshooting a dirty end-face as an equipment fault',
      'Expecting the fiber to carry a ground reference or power — there is no conductor in it',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Optical S/PDIF vs ADAT over the same port',
        why: 'Two different digital audio protocols share the identical connector and fiber.',
        consequence:
          'Protocol incompatibility — the receiver does not decode the stream: most equipment mutes on an unrecognized format, but some instead outputs noise — keep monitor levels down until both ends are set to the same format. Configuration, not cabling, is the fix.',
      },
      {
        otherId: 'trs_35',
        otherName: '3.5 mm mini-optical vs 3.5 mm analog jack',
        why: 'A mini-TOSLINK optical plug shares the 3.5 mm form, and some equipment combines optical and analog in one socket.',
        consequence:
          'An optical plug in an analog-only jack (or the reverse) simply passes nothing — no signal, no damage. Check whether the socket actually supports optical before adapting.',
      },
    ],
    inspectionPoints: [
      'End-faces clean, unscratched, and not chipped — inspect against light',
      'No kinks, flattened sections, or tight-radius bends along the cable',
      'Plug tip seats fully; a worn or shrunken tip sits loose and drops out',
      'Dust caps present on unused ports and stored cables',
    ],
    basicTest:
      'An electrical continuity tester reads OPEN on an optical cable by design — that is correct, not a fault. The basic field check is visual — done the fiber-safe way: with the far end connected to a powered source, point the free end at your palm or a white surface and look for the dim red glow, viewing from an angle rather than bringing the fiber end toward your eye. No glow through a known-lit path means a broken fiber. TOSLINK is low-power LED light, but this same check performed on other fiber systems would aim invisible laser light at your eye — the technique, like the no-staring habit, must not distinguish. Inspect the end-faces for dirt and scratches at the same time.',
    safety: {
      level: 'signal',
      cautions: [
        'The red light in a consumer/pro-audio optical port is low-power LED light, generally considered harmless — but make not staring into ANY optical port a habit: other fiber systems in the wider world use invisible, more powerful laser light, and the habit should not distinguish.',
      ],
    },
    glossary: [],
    relatedLessons: ['l02_anatomy', 'l04_same_plug', 'l06_digital', 'l09_handling'],
    sourceNotes: [
      'TOSLINK/F05 optical connector system: JEITA (formerly EIAJ) RC-5720 — VERIFIED 2026-08-15: Toshiba TOSLINK Fiber-Optic Devices Product Guide',
      'Optical S/PDIF consumer digital audio: IEC 60958-3 — VERIFIED 2026-08-15: Toshiba TOSLINK Fiber-Optic Devices Product Guide',
      'ADAT optical interface: multichannel protocol distinct from S/PDIF over the same fiber/connector — protocol documentation — VERIFY',
      'Typical TOSLINK sources are low-power red LEDs (not lasers) and are regarded as eye-safe in normal use: Toshiba TOSLINK Fiber-Optic Devices Product Guide — VERIFIED 2026-08-15; formal IEC 60825 classification per component datasheets — EXPERT REVIEW PENDING',
      'Wrong-format optical stream: most equipment mutes but some outputs noise (format-detection behavior varies by equipment): Sound On Sound ADAT feature + RME documentation/forums — VERIFIED 2026-08-15',
      'Fiber-safe visual check (view indicator light off-axis or projected on a surface; never look into a fiber end): Fiber Optic Association safety guidance — VERIFIED 2026-08-15',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // HDMI
  {
    id: 'hdmi',
    displayName: 'HDMI (Type A)',
    aliases: ['HDMI'],
    category: 'video_av',
    tier: 'core',
    carried: ['digital_audio', 'control_data'],
    typicalSources: [
      'Computers and media players',
      'Cameras and capture devices',
      'Playback machines in installations',
    ],
    typicalDestinations: [
      'Displays, projectors, and TVs',
      'AV receivers and soundbars',
      'Capture and streaming hardware',
    ],
    constructionNote:
      'Multiple individually shielded high-speed pairs plus control conductors and power, all inside one jacket — one of the most complex cables handled in ordinary AV work. At long lengths, passive copper reaches its limit and ACTIVE cables (with electronics inside, sometimes fiber) take over; those actives behave differently from passive cables in ways that matter (see directionality).',
    pinouts: [
      {
        id: 'hdmi_contact_groups',
        application: 'Contact groups (19-contact Type A interface, summarized)',
        carried: ['digital_audio', 'control_data'],
        contacts: [
          {
            label: 'TMDS data ×3',
            role: 'Three shielded high-speed pairs — video with embedded audio',
            ink: 'dataA',
          },
          { label: 'TMDS clock', role: 'Clock pair pacing the three data pairs', ink: 'clock' },
          {
            label: 'DDC',
            role: 'Display Data Channel — the source reads the display’s identity and capabilities here',
            ink: 'dataB',
          },
          { label: 'CEC', role: 'Device-control messages between equipment', ink: 'dataB' },
          {
            label: 'Utility/HEAC',
            role: 'Utility contact — together with the Hot Plug Detect contact it forms the HEAC pair, carrying the audio return channel (ARC/eARC) and Ethernet channel on equipment that supports them',
            ink: 'dataB',
          },
          { label: '+5 V', role: 'Low-current supply from the source for the display’s identification circuit', ink: 'dcPos' },
          { label: 'Hot Plug Detect', role: 'Lets the source detect that a display is connected', ink: 'dataB' },
          { label: 'Grounds/shields', role: 'Return and screening contacts for the pairs above', ink: 'shield' },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'varies',
    locking: { method: 'friction' },
    directionality:
      'Normal links run source → display. Two direction rules matter in practice: (1) ARC/eARC reverses AUDIO back down the cable, but only between ports specifically labeled ARC or eARC on both devices; (2) many ACTIVE long-reach cables are directional — their ends are marked source/display, and a reversed active cable passes nothing at all.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'Hot connection is part of the design — a dedicated Hot Plug Detect contact exists so devices notice each other. Expect a brief renegotiation (identification and content-protection handshake) after any live replug; picture and sound return in moments. Equipment-dependent edge case: if the two devices sit on different power or ground systems — a display fed through a poorly bonded antenna/cable-TV line is the classic culprit — a chassis potential difference can damage HDMI ports during a live replug. In fixed installs, verify grounding/bonding; when patching unfamiliar systems, connecting with equipment powered down costs nothing.',
    },
    advantages: [
      'Video and multichannel audio in one cable — the default AV interconnect on modern equipment',
      'Automatic capability negotiation between devices',
      'ARC/eARC can eliminate a separate audio return cable in supported setups',
    ],
    limitations: [
      'Friction fit and a relatively heavy cable — strain on the port is the format’s chronic weakness; unsupported cables and hanging adapters work the socket loose over time',
      'Version/feature support (resolutions, eARC, higher bandwidth) depends on BOTH devices and the cable; the plug looks identical across all of them',
      'ARC/eARC only functions on the specifically labeled ports',
      'Long passive runs fail subtly (sparkles, dropouts) before they fail cleanly; active cables solve length but add directionality and power considerations',
    ],
    commonMistakes: [
      'Plugging into any handy display input and expecting ARC — audio return only works on the port labeled ARC/eARC, on both ends',
      'Reversing a directional active cable and diagnosing dead equipment — check the end markings first',
      'Letting a heavy cable or stack of adapters hang off a wall-mounted display’s port',
      'Buying "an HDMI cable" for a demanding link without checking its certified bandwidth class — the connector shape promises nothing about throughput',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Directional active HDMI cable, reversed',
        why: 'Active cables contain electronics powered and oriented for one direction; the ends are marked.',
        consequence: 'No connection at all — no image, no sound, no damage. Orient the marked ends correctly.',
      },
      {
        otherName: 'Mini-HDMI (Type C) / Micro-HDMI (Type D)',
        why: 'Smaller HDMI connector formats used on cameras and portable devices.',
        consequence: 'Different shells that need the right cable or adapter — a fit problem, not a signal problem.',
      },
      {
        otherName: 'Lower-bandwidth cable on a high-bandwidth link',
        why: 'Cable certification classes differ; the plug is identical on all of them.',
        consequence:
          'The link drops to a lower resolution/rate or shows intermittent sparkles and dropouts — reduced capability and reliability, not damage.',
      },
    ],
    inspectionPoints: [
      'Port on the equipment: loose, rocking sockets from years of cable strain',
      'Plug shell straight, not spread; contacts clean',
      'Cable supported along its run rather than hanging by the connector',
      'Active cables: end markings legible; power (where used) connected per the cable’s documentation',
    ],
    basicTest:
      'With nineteen conductors, hand continuity testing is impractical — a dedicated HDMI cable tester checks all conductors at once and is the right tool. Know its limit: a DIRECTIONAL active cable can fail a passive continuity test yet work perfectly, because there are electronics, not straight wires, between its ends. Test actives by substitution on known-good equipment instead.',
    safety: {
      level: 'signal',
      cautions: [
        'Signal-level connection — not a shock hazard. The practical hazard is mechanical: heavy cables levering on friction-fit ports damage equipment sockets, which are far costlier to repair than the cable. Support the cable; use strain relief on installs.',
      ],
    },
    glossary: [],
    relatedLessons: ['l06_digital', 'l08_selection', 'l09_handling'],
    sourceNotes: [
      'HDMI Type A connector: 19 contacts; TMDS data/clock pairs, DDC, CEC, utility/HEAC (HEAC pair = Utility pin 14 + Hot Plug Detect pin 19), +5 V, Hot Plug Detect: HDMI Specification (HDMI LA) — VERIFIED 2026-08-15: pinoutguide.com HDMI pinout',
      'ARC/eARC carried on designated ports using the utility/HEAC contacts; both devices must support and label the feature: HDMI 1.4/2.1 Specifications — VERIFIED 2026-08-15: pinoutguide.com HDMI pinout',
      'Active/directional long-reach cables with marked source/display ends: HDMI cable certification program documentation — VERIFIED 2026-08-15: pinoutguide.com HDMI pinout',
      'Hot Plug Detect contact and live-connection handshake behavior: HDMI Specification — VERIFIED 2026-08-15: pinoutguide.com HDMI pinout',
      'Live-replug HDMI port damage via chassis ground-potential difference (equipment/venue-dependent edge case): field-report grade (AVS Forum / All About Circuits) — EXPERT REVIEW PENDING',
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // MIDI 5-pin DIN
  {
    id: 'midi_din5',
    displayName: 'MIDI 5-pin DIN',
    aliases: ['MIDI connector', '5-pin DIN (180°)', 'DIN-5'],
    category: 'control',
    tier: 'core',
    carried: ['control_data'],
    typicalSources: [
      'Keyboard and controller MIDI OUT ports',
      'Sequencer and interface MIDI OUT ports',
      'MIDI THRU ports (passing along what arrived at IN)',
    ],
    typicalDestinations: [
      'Synthesizer and sound-module MIDI IN ports',
      'Drum machines and hardware sequencers',
      'MIDI interface IN ports',
    ],
    construction: 'balanced_shielded',
    constructionNote:
      'A conventional MIDI cable is a shielded two-conductor cable — physically similar to a microphone cable — but what it carries is NOT audio and not a balanced audio signal: it is a one-way digital current loop. No sound ever travels down a MIDI cable; it carries instructions (which note, how hard, which knob moved) that the receiving instrument turns into sound itself.',
    pinouts: [
      {
        id: 'midi_current_loop',
        application: 'MIDI 1.0 current loop (DIN 5-pin, 180°)',
        carried: ['control_data'],
        contacts: [
          {
            label: '4',
            role: 'Current-loop source (+5 V through the transmitter’s resistor)',
            ink: 'dcPos',
          },
          {
            label: '5',
            role: 'Current-loop data line (the switched signal)',
            ink: 'dataA',
          },
          {
            label: '2',
            role: 'Cable shield — grounded at the transmitter side',
            ink: 'shield',
            note: 'Pin 2 is the physical center pin. Receivers are opto-isolated and leave it unconnected internally, which is how MIDI avoids creating ground loops between instruments.',
          },
          {
            label: '1',
            role: 'Unused by MIDI 1.0',
            ink: 'insulator',
            note: 'Some equipment repurposes pins 1 and 3 (e.g. for nonstandard power schemes) — equipment-dependent; check the documentation before assuming they are free.',
          },
          {
            label: '3',
            role: 'Unused by MIDI 1.0',
            ink: 'insulator',
          },
        ],
        confidence: 'standard',
      },
    ],
    balanced: 'n/a',
    channels: 'n/a',
    locking: { method: 'friction' },
    directionality:
      'Strictly one-way: data flows from an OUT (or THRU) port into an IN port — OUT→IN, always. THRU retransmits a copy of what arrived at IN, allowing simple daisy-chains. Connecting OUT to OUT or IN to IN does nothing (and harms nothing). Two-way communication between devices takes two cables.',
    hotPlug: {
      policy: 'normally_fine',
      rationale:
        'The opto-isolated, low-current design makes live connection electrically uneventful. The worst realistic outcome is musical, not electrical: interrupting a cable mid-note can strand a note playing (the "note off" instruction never arrives) until the receiver is reset or an all-notes-off is sent.',
    },
    advantages: [
      'Opto-isolated input breaks ground paths between instruments — inherent hum-loop immunity',
      'Simple, rugged, and stable: decades of instruments interoperate over this connection',
      'THRU ports allow daisy-chaining several instruments from one output',
    ],
    limitations: [
      'Carries control data only — never audio; an instrument at the far end makes the sound',
      'One direction per cable; bidirectional setups need two',
      'A 5-pin DIN connector does not automatically mean MIDI: the same DIN shell served older audio interconnects, sync systems, and other jobs on vintage equipment — check what the port actually is',
      'Long daisy-chains add latency and, historically, timing slop; star wiring from an interface avoids it',
    ],
    commonMistakes: [
      'Expecting sound through a MIDI cable — connecting MIDI OUT toward an amplifier or audio input does nothing; MIDI carries instructions, not audio',
      'Connecting OUT to OUT (or IN to IN) and concluding the gear is broken — the data direction is OUT→IN',
      'Assuming any DIN-5 socket on vintage equipment is MIDI — some are audio or sync connections in the same shell',
      'Using a random DIN-5 cable of unknown wiring for MIDI: cables made for other DIN uses may connect different pins than a MIDI cable does',
    ],
    notInterchangeableWith: [
      {
        otherName: 'Non-MIDI 5-pin DIN connections (vintage audio, sync, and accessory ports)',
        why: 'The DIN shell predates MIDI and served many unrelated jobs; the shape alone identifies nothing.',
        consequence:
          'A MIDI device patched into a non-MIDI DIN port simply does not function — and on vintage equipment with powered accessory pins, mispatching is a reason to check documentation first rather than experiment. No function is the typical outcome; verify the port’s identity from the manual.',
      },
      {
        otherId: 'xlr3',
        otherName: 'Audio cabling in general',
        why: 'MIDI cables and audio cables can look similar and even share construction, but the systems are unrelated.',
        consequence:
          'No audio can ever emerge from a MIDI port — a signal-flow misunderstanding, not a cabling fault. The instrument receiving MIDI is what produces audio, through its own audio outputs.',
      },
    ],
    inspectionPoints: [
      'Bent or pushed-in pins (DIN pins are slim and bend easily)',
      'Cracked plug shell or loose strain relief',
      'Intermittent behavior when the cable is wiggled at the plug — broken conductor at the termination',
      'On unlabeled vintage gear: identify the port from the manual before trusting the DIN shell',
    ],
    basicTest:
      'A standard MIDI cable is wired straight through on the pins it uses: continuity 4→4, 5→5, and 2→2. Cables sold for other DIN-5 purposes may connect different pins — a quick continuity map identifies whether an unknown DIN cable will work for MIDI before it wastes troubleshooting time.',
    safety: {
      level: 'signal',
      cautions: [
        'Low-voltage, low-current control signaling — not a shock hazard. On vintage equipment, unidentified DIN ports may carry voltage on pins MIDI leaves unused — powered accessory lines or +5 V sync signals (e.g. DIN Sync on pins 1 and 3); identifying a port before patching is good practice, not paranoia.',
      ],
    },
    glossary: ['5-Pin DIN (MIDI)', 'MIDI DIN (5-Pin)'],
    relatedLessons: ['l01_what_travels', 'l04_same_plug', 'l06_digital'],
    sourceNotes: [
      'MIDI 1.0 electrical: 5 mA current loop; pin 4 source (+5 V via resistor), pin 5 data, pin 2 shield; pins 1 and 3 unused; opto-isolated receiver; shield grounded at transmitter only: MIDI 1.0 Detailed Specification (MIDI Association) — VERIFIED 2026-08-15: MIDI 1.0 Electrical Specification Update CA-033 (midi.org)',
      'DIN 41524 defines the 5-pin 180° connector itself, independent of MIDI — VERIFIED 2026-08-15: MIDI 1.0 Electrical Specification Update CA-033 (midi.org)',
      'Standard MIDI cables wired straight through on pins 4, 5, and 2: MIDI 1.0 Detailed Specification — VERIFIED 2026-08-15: MIDI 1.0 Electrical Specification Update CA-033 (midi.org)',
      'Pin 2 physically central in the 180° DIN-5 arrangement (pin order across the face 1-4-2-5-3): DIN 41524 — VERIFIED 2026-08-15: MIDI 1.0 Electrical Specification Update CA-033 (midi.org)',
      'Vintage non-MIDI DIN-5 ports may carry voltage on pins MIDI leaves unused (Roland DIN Sync: +5 V start/stop on pin 1, +5 V clock on pin 3): Sweetwater Sync 24 reference — VERIFIED 2026-08-15',
    ],
  },
];
