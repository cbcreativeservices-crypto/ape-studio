import json

allterms = json.load(open('/tmp/allterms.json'))
LC = {t.lower(): t for t in allterms}
slice_rows = {r['term']: r for r in json.load(open('/tmp/slice.json'))}

results = []

def add(term, orig, tier, findings, related, concise="", plain="", dup="", broken=None):
    results.append({
        "term": term, "orig": int(orig), "tier": tier,
        "comms_findings": findings,
        "revisions": {"Related Terms": related, "Concise Definition": concise, "Plain-English Explanation": plain},
        "duplicate_of": dup,
        "broken_xrefs": broken or []
    })

add("Up-Mixing", 874, "PASS",
    ["Clear, well-organized; Concise and Plain-English complementary (no redundancy). All five cross-refs resolve to canonical glossary entries. No changes needed."],
    "Surround Sound Formats | 5.1 / 7.1 Surround Sound | Stereo | Object-Based Audio | Spatial Audio")

add("USB audio", 875, "PASS",
    ["Good flow; Plain-English adds class-compliant/driver nuance beyond Concise. All refs resolve. No changes needed."],
    "Audio Interface | ASIO (Audio Stream Input/Output) | Latency | USB microphone | A/D converter (ADC)")

add("USB microphone", 876, "REVISE",
    ["Related Terms list is heavily lowercased and uses non-glossary generic words ('microphone','computer audio','recording','podcast') that are not glossary entries -> broken refs. Remapped to canonical names ('audio interface' -> 'Audio Interface'); reciprocal link to 'USB audio' kept. Dropped generic non-terms.",
     "Plain-English is slightly list-like and partly restates the Concise convenience point; trimmed lightly for flow."],
    "USB audio | Audio Interface | Condenser Microphone | Latency | A/D converter (ADC)",
    plain="USB microphones have a built-in audio interface, so you plug straight into a computer and record - no separate interface needed. They're convenient for podcasting, video calls, and home recording. Quality varies but is adequate for many uses; latency and USB bandwidth are the main trade-offs.",
    broken=["microphone", "computer audio", "recording", "podcast"])

add("Vacuum tube", 877, "PASS",
    ["Clear; Concise/Plain complementary. All five refs resolve (Valve, Triode, Pentode, Cathode, Anode / Plate). Reciprocal with Valve confirmed. No changes."],
    "Valve | Triode | Pentode | Cathode | Anode / Plate")

add("Value Proposition", 1139, "REVISE",
    ["SELF-REFERENCE: 'Value Proposition' lists itself as a Related Term - removed.",
     "'Pricing' is not a glossary entry (broken) -> remapped to canonical 'Pricing Strategy'. Reciprocal links to USP, Client Value, Market Positioning all valid."],
    "Unique Selling Proposition (USP) | Client Value | Market Positioning | Pricing Strategy",
    broken=["Pricing", "Value Proposition (self)"])

add("Value-Based Pricing", 1187, "REVISE",
    ["SELF-REFERENCE: 'Value-Based Pricing' lists itself - removed. Remaining four refs (Pricing Strategy, Value Proposition, Client Value, USP) all resolve."],
    "Pricing Strategy | Value Proposition | Client Value | Unique Selling Proposition (USP)",
    broken=["Value-Based Pricing (self)"])

add("Valve", 878, "PASS",
    ["Clean; correctly frames Valve as UK synonym for Vacuum tube. All refs resolve; reciprocal with Vacuum tube present. No changes. (Valve and Vacuum tube are an intentional synonym pair, not a duplicate to merge.)"],
    "Vacuum tube | Triode | Pentode | Cathode | Anode / Plate")

add("Variable acoustics", 879, "REVISE",
    ["Related Terms is mostly generic non-glossary words ('Acoustic design','Room acoustics','Adjustable','Flexibility','Venue design','Reflectors') - none are glossary entries. Remapped to real canonical entries and dropped pure adjectives.",
     "Em-dash without spaces in Plain-English ('purposes-live'); normalized to spaced dash for readability."],
    "Acoustic Treatment | Reverberation time (RT60) | Absorption | Diffraction | Room mode",
    plain="Variable acoustics let a venue change how a room sounds for different purposes - live events want liveness, speech wants absorption. Movable curtains, absorption panels, and adjustable reflectors make this flexibility possible.",
    broken=["Acoustic design", "Room acoustics", "Adjustable", "Flexibility", "Venue design", "Reflectors"])

add("VCA (voltage-controlled amplifier)", 880, "REVISE",
    ["Plain-English is boilerplate-bloated: four sentences that restate the Concise definition and end with filler ('Understanding VCA operation helps engineers appreciate...'). Trimmed to substantive, non-redundant explanation.",
     "Related Terms is generic-word soup ('Voltage control','Synthesizer','Control','Automatic control','Gain','Electronic control') - only 'Gain' resolves. Remapped to real glossary entries."],
    "Compressor | Dynamic Range | Gain | Fader | Buffer Size",
    plain="A VCA is an amplifier whose gain is set by a control voltage instead of a manual knob. That lets gain be automated and controlled remotely, which is why VCAs sit at the heart of compressors and other dynamics processors, mixing-console automation, and analog synthesizers.",
    broken=["Voltage control", "Synthesizer", "Control", "Automatic control", "Electronic control"])

add("Velocity (MIDI)", 881, "REVISE",
    ["Related Terms uses lowercase generic words ('MIDI','expression','dynamics','note-on','intensity control','velocity sensitivity') - none match glossary entries. Remapped 'dynamics' -> 'Dynamic Range'; dropped non-terms (no standalone 'MIDI' entry exists)."],
    "Dynamic Range | Envelope | Transient | Gain | Modulation",
    broken=["MIDI", "expression", "dynamics", "note-on", "intensity control", "velocity sensitivity"])

add("Vendor", 1060, "REVISE",
    ["SELF-REFERENCE: 'Vendor' lists itself - removed. Remaining four refs (Distributor, Manufacturer, Service Provider, Procurement) all resolve."],
    "Distributor | Manufacturer | Service Provider | Procurement",
    broken=["Vendor (self)"])

add("Vertical Re-orchestration", 882, "PASS",
    ["Excellent: clear contrast with Horizontal Re-sequencing. All five refs resolve and are reciprocal-rich. No changes."],
    "Interactive Music | Adaptive Audio | Horizontal Re-sequencing | Audio Middleware | Music Editor")

add("VF14", 883, "PASS",
    ["Tight, well-scoped. All five refs (AC701, Tube condenser microphone, Triode, Vacuum tube, Pentode) resolve. No changes."],
    "AC701 | Tube condenser microphone | Triode | Vacuum tube | Pentode")

add("vocoder", 884, "REVISE",
    ["Related Terms 'Synthesis','Formant','Carrier' are not glossary entries (broken). Kept Filter and Modulation (resolve); remapped to real entries. The carrier/modulator concept is already well explained in the Plain-English text, so dropping those broken refs loses no clarity."],
    "Filter | Modulation | Envelope | Spectrum | Frequency",
    broken=["Synthesis", "Formant", "Carrier"])

add("Voice coil", 885, "REVISE",
    ["Related Terms 'Driver','Magnet','Power handling' are not glossary entries. Kept Diaphragm and Impedance (resolve); remapped others to canonical entries (Output impedance, Crossover, tweeter)."],
    "Diaphragm | Impedance | Output impedance | Crossover | tweeter",
    broken=["Driver", "Magnet", "Power handling"])

add("Voice-Over (VO)", 886, "REVISE",
    ["One broken ref: 'Voice Booth' has no glossary entry (concept absent). Removed and replaced with a valid related entry. Note: trailing-semicolon 'M&E; Track...' is the canonical glossary spelling, so kept as-is. Other four refs resolve."],
    "Non-Diegetic Sound | Dialogue Editor | Dubbing / Dubbing Stage | Ambience | M&E; Track (Music and Effects Track)",
    broken=["Voice Booth"])

add("Volume", 2, "PASS",
    ["Clear distinction between perceived loudness and the control. All five refs resolve. No changes."],
    "Level | Loudness (perceptual) | Gain | Fader | Sound Pressure Level (SPL)")

add("Volume acoustics", 887, "REVISE",
    ["Related Terms mostly non-glossary generics ('Room acoustics','Room volume','Reverberation','Room modes','Acoustic design','Venue'); only 'Frequency response' resolves (as 'Frequency Response'). Remapped to real entries.",
     "Em-dash without spaces normalized.",
     "DUPLICATE CONCERN: overlaps conceptually with 'Variable acoustics' and generic room-acoustics terms, but distinct enough (enclosed-volume modal behavior). Not merged."],
    "Room mode | Reverberation time (RT60) | Frequency Response | Acoustic Treatment | Standing Wave",
    plain="Different room volumes sound different - tiny rooms have short reverb and high-frequency room modes, large rooms have long reverb and low-frequency modes. Understanding how volume drives this behavior helps you predict how a room will sound.",
    broken=["Room acoustics", "Room volume", "Reverberation", "Room modes", "Acoustic design", "Venue"])

add("VU", 888, "REVISE",
    ["Related Terms: 'VU Meter' is the wrong name for canonical 'VU Meter (Volume Unit Meter)'; 'dB' and 'Attenuation' are not glossary entries. Remapped VU Meter to canonical; dropped broken generics.",
     "OVERLAP: 'VU' (the scale) and 'VU Meter (Volume Unit Meter)' (the instrument) are a tight pair; both legitimately exist and should cross-link reciprocally (now fixed)."],
    "VU Meter (Volume Unit Meter) | dBu | Sound Pressure Level (SPL) | Gain | Level",
    broken=["VU Meter", "dB", "Attenuation"])

add("VU Meter (Volume Unit Meter)", 889, "REVISE",
    ["Add reciprocal link to 'VU' (the scale entry) which references this meter - currently missing. Existing five refs all resolve; appended VU for reciprocity (trimmed RMS to keep the set focused)."],
    "VU | Level meters | PPM (peak program meter) | Digital peak meter | Loudness (perceptual)")

add("Walk test", 890, "PASS",
    ["Vivid, clear. All five refs resolve (Coverage map, Seat-to-seat variance, Optimization, System baseline, Speech intelligibility). No changes."],
    "Coverage map | Seat-to-seat variance | Optimization | System baseline | Speech intelligibility")

add("Watt", 891, "REVISE",
    ["'Ohm' is not a glossary entry (broken). Remapped to canonical 'Impedance'. Other four refs resolve."],
    "Impedance | Load impedance | Sensitivity (rated under standard conditions) | Headroom | Decibel (dB)",
    broken=["Ohm"])

add("WAV / WAVE", 892, "PASS",
    ["Clear; all five refs resolve. No changes."],
    "PCM (Pulse-Code Modulation) | FLAC (Free Lossless Audio Codec) | Bit Depth | Sample Rate | CD (Compact Disc)")

add("Waveform", 893, "PASS",
    ["All five refs resolve (sine wave canonical lowercase, Envelope, Transient, Peak level, Clipping). Clear Concise/Plain split. No change."],
    "sine wave | Envelope | Transient | Peak level | Clipping")

add("Wavelength", 894, "PASS",
    ["All five refs valid (Frequency, Cycles, Diffraction, Room mode, Phase); reciprocity confirmed. Clear. No change."],
    "Frequency | Cycles | Diffraction | Room mode | Phase")

add("Weather effects", 895, "REVISE",
    ["Related Terms 'Refraction','Inverse-square law','Sound propagation','Temperature gradient' are not glossary entries as written. Remapped 'Inverse-square law' -> 'Inverse Square Law' (canonical); kept Diffraction. Dropped pure-concept non-entries with no glossary target."],
    "Diffraction | Inverse Square Law | Wavelength | Frequency",
    broken=["Refraction", "Inverse-square law", "Sound propagation", "Temperature gradient"])

add("Weighting filters", 896, "REVISE",
    ["Related Terms: 'A-weighting','C-weighting','Filter' resolve; 'Microphone','Measurement','Human hearing','Standard' are non-glossary generics (broken). Remapped; added Z-weighting and Weighting selector for reciprocity within the weighting cluster.",
     "DUPLICATE CLUSTER: 'Weighting filters','Weighting selector','A-weighting','C-weighting','Z-weighting' form an overlapping family. 'Weighting filters' is the umbrella; linked to its members."],
    "A-weighting | C-weighting | Z-weighting | Filter | Weighting selector",
    broken=["Microphone", "Measurement", "Human hearing", "Standard"])

add("Weighting selector", 897, "REVISE",
    ["Plain-English is boilerplate-bloated (four sentences ending 'Understanding weighting selector function helps technicians...') and restates the Concise definition. Trimmed.",
     "Related Terms generic-word soup: 'SPL meter','Weighting','Selector','Measurement control' are not glossary entries. Remapped to the real weighting-family entries.",
     "DUPLICATE: closely overlaps 'Weighting filters' (one is the control, one is the filters). Kept distinct; linked reciprocally."],
    "Weighting filters | A-weighting | C-weighting | Z-weighting | Sound Pressure Level (SPL)",
    plain="A weighting selector is the control on a sound level meter or analyzer that switches between A-, C-, and Z-weighting curves. Each curve emphasizes different frequencies - A and C track human hearing at different levels, Z is flat - so choosing the right one makes a measurement match its intended purpose.",
    broken=["SPL meter", "Weighting", "Selector", "Measurement control"])

add("White Noise", 898, "PASS",
    ["Clear, accurate (equal energy per Hz, perceived bright). All five refs resolve. No changes."],
    "Pink Noise | Brown | Noise - spectral colors | Excitation signal | Octave band")

add("Wild Track / Wild Sound", 899, "REVISE",
    ["SELF-REFERENCE: 'Wild Track / Wild Sound' lists itself - removed. 'Location Sound / Production Sound' is not a glossary entry as written (broken); replaced with valid related entries. Room Tone, Ambience, Dialogue Editor resolve."],
    "Room Tone | Ambience | Dialogue Editor | Non-Diegetic Sound",
    broken=["Wild Track / Wild Sound (self)", "Location Sound / Production Sound"])

add("Window function", 900, "REVISE",
    ["'FFT' is not a glossary entry as written; canonical FFT-family entry is 'FFT size'. Remapped; kept FFT size, Time window, Frequency resolution, Spectrum (all resolve)."],
    "FFT size | Time window | Frequency resolution | Spectrum | Sample Rate",
    broken=["FFT"])

add("Windscreen", 901, "PASS",
    ["Clear, practical. All five refs resolve (Pop filter, Plosive, Grille, Shotgun microphone, Bleed / Leakage). No changes."],
    "Pop filter | Plosive | Grille | Shotgun microphone | Bleed / Leakage")

add("Wireless bodypack", 902, "REVISE",
    ["Plain-English is boilerplate-bloated (four sentences ending 'Understanding wireless bodypack technology helps engineers...') and restates Concise. Trimmed to one tight paragraph.",
     "Related Terms generic soup ('Bodypack','Transmitter','Lavalier','Performance','Mobility','Convenience') - only 'Wireless microphone' resolves. Remapped to real entries.",
     "DUPLICATE CLUSTER: 'Wireless bodypack','Wireless handheld transmitter','Wireless microphone' overlap heavily; each is a distinct form factor/parent, kept and cross-linked."],
    "Wireless microphone | Wireless handheld transmitter | Shock mount | Live Sound",
    plain="A wireless bodypack is a small transmitter worn on the body - clipped to a belt or clothing - that sends a lavalier or headset mic's signal to a receiver. It's the standard choice for theater, fitness, and presenting where hands-free movement matters. Reliable use depends on frequency coordination and diversity reception.",
    broken=["Bodypack", "Transmitter", "Lavalier", "Performance", "Mobility", "Convenience"])

add("Wireless handheld transmitter", 903, "REVISE",
    ["Related Terms generic soup ('Handheld','Transmitter','Microphone','Performance','Convenience') - only 'Wireless microphone' and 'Live sound' resolve. Remapped to real entries; cross-linked to bodypack sibling."],
    "Wireless microphone | Wireless bodypack | Live Sound | Condenser Microphone",
    broken=["Handheld", "Transmitter", "Microphone", "Performance", "Convenience"])

add("Wireless microphone", 904, "REVISE",
    ["Related Terms entirely generic non-glossary words ('Microphone','Wireless transmission','Radio frequency','Performance','Transmitter','Receiver','Freedom of movement') - none resolve. Remapped to real glossary entries (its two child form-factor entries plus Live Sound, Shock mount).",
     "This is the PARENT of the wireless cluster; now links down to Wireless bodypack and Wireless handheld transmitter (reciprocity fixed)."],
    "Wireless bodypack | Wireless handheld transmitter | Live Sound | Shock mount",
    broken=["Microphone", "Wireless transmission", "Radio frequency", "Performance", "Transmitter", "Receiver", "Freedom of movement"])

add("woofer", 905, "REVISE",
    ["Related Terms generic soup ('Speaker driver','Low frequency','Loudspeaker','Bass','Speaker design','Component') - only 'Crossover' resolves. Remapped to real entries (tweeter, Subwoofer, Frequency, Impedance)."],
    "Crossover | tweeter | Subwoofer | Frequency | Impedance",
    broken=["Speaker driver", "Low frequency", "Loudspeaker", "Bass", "Speaker design", "Component"])

add("Word Clock", 906, "PASS",
    ["Strong analogy (metronome). All five refs resolve (Jitter, Sample Rate, AES3 / AES-EBU, MADI..., Stagebox). No changes."],
    "Jitter | Sample Rate | AES3 / AES-EBU | MADI (Multichannel Audio Digital Interface) | Stagebox")

add("Word-of-Mouth Marketing", 1167, "REVISE",
    ["SELF-REFERENCE: 'Word-of-Mouth Marketing' lists itself - removed. Remaining four refs (Referral Marketing, Referral, Professional Reputation, Online Reviews) all resolve."],
    "Referral Marketing | Referral | Professional Reputation | Online Reviews",
    broken=["Word-of-Mouth Marketing (self)"])

add("Work Ethic", 1001, "REVISE",
    ["SELF-REFERENCE: 'Work Ethic' lists itself - removed. Remaining four refs (Reliability, Accountability, Professional Conduct, Professional Expectations) all resolve."],
    "Reliability | Accountability | Professional Conduct | Professional Expectations",
    broken=["Work Ethic (self)"])

add("Work for Hire", 985, "REVISE",
    ["SELF-REFERENCE: 'Work for Hire' lists itself - removed. 'Employer' is not a glossary entry (broken); dropped. Remaining (Client Ownership, Assignment of Rights, Copyright Transfer) resolve.",
     "Plain-English is dense but accurate and non-redundant with Concise (adds the sound-recording nuance) - kept."],
    "Client Ownership | Assignment of Rights | Copyright Transfer",
    broken=["Work for Hire (self)", "Employer"])

add("Work Sample", 921, "REVISE",
    ["SELF-REFERENCE: 'Work Sample' lists itself - removed. Remaining four refs (Portfolio Artifact, Demo Reel, Mixing Project, Evidence of Competency) all resolve."],
    "Portfolio Artifact | Demo Reel | Mixing Project | Evidence of Competency",
    broken=["Work Sample (self)"])

add("Workplace Culture", 996, "REVISE",
    ["SELF-REFERENCE: 'Workplace Culture' lists itself - removed. 'Workplace Expectations' is not a glossary entry (broken); remapped to canonical 'Professional Expectations'. Others resolve."],
    "Professional Conduct | Professional Expectations | Professional Networking | Reliability",
    broken=["Workplace Culture (self)", "Workplace Expectations"])

add("Workshop", 1036, "REVISE",
    ["SELF-REFERENCE: 'Workshop' lists itself - removed. Remaining four refs (Conference, Continuing Education, Guest Speaker, Networking) all resolve."],
    "Conference | Continuing Education | Guest Speaker | Networking",
    broken=["Workshop (self)"])

add("Wwise", 907, "PASS",
    ["Clear; correctly paired with FMOD. All five refs resolve. No changes."],
    "FMOD | Audio Middleware | Game Audio Implementation | Adaptive Audio | Interactive Music")

add("X-Y Stereo Technique (Coincident Pair)", 908, "PASS",
    ["Excellent organization; clear coincident/mono-safe explanation. All five refs resolve (ORTF technique, Spaced Pair (A/B Stereo), M/S (mid-side) recording, Cardioid, Stereo). No changes."],
    "ORTF technique | Spaced Pair (A/B Stereo) | M/S (mid-side) recording | Cardioid | Stereo")

add("XLR", 909, "REVISE",
    ["Related Terms: 'XLR Connector','Balanced Connection','TRS' resolve; 'Phantom Power','Microphone','AES14' are not glossary entries (broken). Remapped to real entries; kept the strong XLR<->XLR Connector reciprocal pair.",
     "NEAR-DUPLICATE: 'XLR' and 'XLR Connector' cover the same connector. Both exist; content differs slightly (XLR Connector covers multi-pin variants). Flagged for committee; cross-linked."],
    "XLR Connector | Balanced Connection | TRS | Cardioid | Condenser Microphone",
    dup="XLR Connector",
    broken=["Phantom Power", "Microphone", "AES14"])

add("XLR Connector", 910, "REVISE",
    ["Related Terms: 'XLR','Balanced Connection','TRS' resolve; 'Phantom Power','DMX','Microphone','Locking Connector' are not glossary entries (broken). Remapped.",
     "NEAR-DUPLICATE of 'XLR' (orig 909). Recommend committee merge or clearly differentiate; for now distinguished (this entry = multi-pin variants/DMX). Cross-linked."],
    "XLR | Balanced Connection | TRS | Y-cable / Y-cord | Cardioid",
    dup="XLR",
    broken=["Phantom Power", "DMX", "Microphone", "Locking Connector"])

add("Y-cable / Y-cord", 911, "REVISE",
    ["Related Terms: 'TRS','Impedance' resolve; 'Insert Point','Send and Return','Signal Splitting','Mic Splitter','Signal Distribution' are not glossary entries (broken). Remapped to 'Insert' (canonical) plus real entries; dropped non-terms.",
     "Plain-English is long but instructive (safety rules) and non-redundant - kept."],
    "Insert | TRS | Impedance | Output impedance | XLR Connector",
    broken=["Insert Point", "Send and Return", "Signal Splitting", "Mic Splitter", "Signal Distribution"])

add("Yoke mount", 912, "REVISE",
    ["Related Terms: 'Shock mount','Stand adapter','Body' resolve; 'Mic clip','Mounting' are not glossary entries (broken). Dropped non-terms; kept resolving refs and added Grille."],
    "Shock mount | Stand adapter | Body | Grille",
    broken=["Mic clip", "Mounting"])

add("Z-weighting", 913, "REVISE",
    ["Plain-English is boilerplate-bloated (four sentences ending 'Understanding Z-weighting helps technicians...') and restates Concise. Trimmed.",
     "Related Terms generic soup ('Weighting','Flat response','Measurement','Technical','SPL meter','Standard') - only 'Frequency response' resolves (canonical 'Frequency Response'). Remapped into the weighting family (reciprocal with A-/C-weighting, Weighting filters, Weighting selector).",
     "DUPLICATE CLUSTER member with A-weighting/C-weighting/Weighting filters/Weighting selector - now cross-linked."],
    "A-weighting | C-weighting | Weighting filters | Weighting selector | Frequency Response",
    plain="Z-weighting is the flat, unweighted curve on a sound level meter - it applies no frequency correction, so it shows actual acoustic pressure independent of how humans perceive loudness. That makes it useful for technical analysis and peak measurements, as a complement to the more common A-weighting.",
    broken=["Weighting", "Flat response", "Measurement", "Technical", "SPL meter", "Standard"])

add("Zero Latency Monitoring", 914, "REVISE",
    ["Content is clear (good direct-monitoring explanation) with no redundancy. All five refs resolve; capitalization of 'Buffer size' aligned to canonical 'Buffer Size'."],
    "Latency | Audio Interface | ASIO (Audio Stream Input/Output) | DSP (Digital Signal Processor) | Buffer Size")

add("Zobel network", 915, "PASS",
    ["Related Terms all resolve (Crossover, Load impedance, Voice coil, Impedance, Output impedance) - no broken refs. Reciprocity with Voice coil and Crossover confirmed. No change."],
    "Crossover | Load impedance | Voice coil | Impedance | Output impedance")

add("Zone / Multi-Zone Audio", 916, "REVISE",
    ["Related Terms entirely generic non-glossary words ('Zone','Audio distribution','Independent control','Multi-zone','System design','Routing','Flexibility') - none resolve. Remapped to real glossary entries.",
     "Em-dash without spaces normalized in Plain-English."],
    "Coverage map | Optimization | System baseline | Speech intelligibility | Walk test",
    plain="Multi-zone systems let different areas have different audio - one zone gets background music, another gets announcements, another stays quiet. This gives complex venues independent control area by area.",
    broken=["Zone", "Audio distribution", "Independent control", "Multi-zone", "System design", "Routing", "Flexibility"])

with open('/sessions/tender-zealous-bardeen/mnt/outputs/batch24_agent4_comms.json','w') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("terms written:", len(results))
from collections import Counter
print("tiers:", dict(Counter(r['tier'] for r in results)))
selfs = [r['term'] for r in results if any('self' in str(b).lower() for b in r['broken_xrefs'])]
print("self-ref terms:", selfs)
print("dups:", [(r['term'],r['duplicate_of']) for r in results if r['duplicate_of']])
