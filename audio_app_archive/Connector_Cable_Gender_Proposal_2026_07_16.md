# Connector / Cable / Gender — targeted glossary build-out (PROPOSAL)
**Pro Audio Training Academy · 2026-07-16 · for Prof. Booth's approval — nothing written until you say go**

Decisions applied: gender terms use the **abbreviation** as the term (XLRM / XLRF) + a separate **"Gender"** concept term to explain it; scope is **targeted** (gender where it teaches, cable terms only where a distinct cable + image exists, plus fixing current mismatches). All new terms land in topic **gs3 — Connectors & I/O Connections**.

---

## 1. NEW terms to create (6)

| Term | Cat | Diff | Image | Draft definition (edit freely) |
|---|---|---|---|---|
| **Gender (Connector)** | Connectors | beginner | *(optional male/female pair image — none yet)* | In audio/electrical connectors, **gender** describes whether a connector presents protruding **pins (male)** or receiving **sockets (female)** that mate with the opposite gender. Cables are normally terminated male on one end and female on the other so they chain together; a device's inputs and outputs expose whichever gender you must mate to. Getting gender right is what makes a cable or adapter actually connect. |
| **XLRM** | Connectors | beginner | `XLRMconnector.PNG` *(missing — re-upload)* | The **male 3‑pin XLR** connector — the end with three protruding pins. Found on a microphone's output and on one end of a mic/line cable; it mates with a female XLR (XLRF) input. Pin 1 = ground/shield, 2 = hot (+), 3 = cold (−). |
| **XLRF** | Connectors | beginner | *(needs image — e.g. `XLRFconnector.PNG`)* | The **female 3‑pin XLR** connector — three receptacles that accept a male XLR. Found on mixer/preamp mic inputs and on the opposite end of a mic cable. |
| **XLR Cable** | Analog Cable | beginner | *(needs image — e.g. `XLRcable.PNG`)* | A balanced audio cable terminated with a **male XLR on one end and a female XLR on the other**, the standard for microphones and balanced line‑level runs. Carries ground + a hot/cold signal pair for common‑mode noise rejection over long distances. |
| **Speakon Cable** | Cables | beginner | `Speakon_cable.PNG` *(already uploaded ✓)* | A loudspeaker cable terminated with locking **Speakon (NL2/NL4)** connectors, used to carry high‑current amplifier output to passive loudspeakers safely — no exposed conductors, higher current capacity than ¼" or banana. |
| **MIDI Cable** | Analog Cable | intermediate | `MIDIcable.PNG` *(move off the connector term)* | A **5‑pin DIN** cable that carries MIDI performance data (note, velocity, control) one direction between devices. Standard length ≤15 m; not audio — it carries control messages, not sound. |

*(All get a full 6‑field entry — plain-English, purpose, practical, common-mistakes, scenarios — authored to the committee standard when you approve, so they don't read as incomplete.)*

## 2. FIXES to existing terms (image re-assignments)

| Term | Change | Why |
|---|---|---|
| **Cable Tie** | assign `ZipTies.PNG` | The zip-ties image is currently mis-assigned to *Zip Cord*. It's actually cable ties → belongs on **Cable Tie** (existing term). |
| **Zip Cord** | **remove** `ZipTies.PNG` (leave imageless until a real zip-cord photo exists) | Zip cord = a 2‑conductor lamp/speaker cable, not ties. |
| **Insert Cable** | assign `Insert_cable.PNG` | The cable image is on **Insert** (a mixing/routing concept). Move it to the existing **Insert Cable** term. |
| **Insert** | **remove** `Insert_cable.PNG` | It's a routing concept, not a cable. |
| **XLR Connector** | drop the broken `XLRMconnector.PNG` reference; keep as the generic XLR family term | Its image was a *male*-specific file (and it's missing). Gender now lives in XLRM/XLRF; the generic term wants a neutral XLR image. |

## 3. DECISION needed — MIDI duplicate

There are two near-identical terms: **`5-Pin DIN (MIDI)`** and **`MIDI DIN (5-Pin)`** (I temporarily put `MIDIport.PNG` on the latter). Recommend:
- Keep **`5-Pin DIN (MIDI)`** as the connector/port → image `MIDIport.PNG`.
- Create **`MIDI Cable`** → image `MIDIcable.PNG`.
- **Delete** the duplicate `MIDI DIN (5-Pin)`.

👉 OK to delete `MIDI DIN (5-Pin)`? (It's the only destructive step here.)

## 4. Images you'd still need to supply (upload to `glossary-images` bucket)
- `XLRMconnector.PNG` — male XLR (referenced but missing)
- `XLRFconnector.PNG` — female XLR (new)
- `XLRcable.PNG` — terminated XLR cable (new)
- *(optional)* a generic XLR image for **XLR Connector**, and a real **Zip Cord** photo
Terms will be created regardless; images attach the moment those files land in the bucket.

## 5. On your "go" I will
1. Create the 6 new terms (glossary row + full 6-field entry + gs3 topic assignment + difficulty).
2. Assign the images that already exist (`Speakon_cable.PNG`, `MIDIcable.PNG`, `ZipTies.PNG`, `Insert_cable.PNG`).
3. Apply the fixes + the MIDI consolidation (pending your delete OK).
4. Verify counts + report which terms still await an uploaded image.

*Not in this pass (separate, non-connector): Transformer / Cassette / Knob / Console Button / Freq Adjust images still need term decisions — tell me when you want those.*
