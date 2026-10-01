/**
 * Module 7 — Mastering for release. LEARN (read: the delivery contexts, with
 * facts kept apart from EXAMPLES) → EXPLORE (rack: the delivery checklist —
 * pick a destination, read its sample brief, confirm every line) →
 * PRACTICE → REVIEW.
 */
import { useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { flipFader } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, Checklist, KeyTerms, Point, ScenarioCard, SectionTitle } from '../kit';
import { DESTINATIONS, KEY_TERMS, RELEASE_SCENARIOS } from '../masteringContent';
import { CD_PLAY_MINUTES, CD_RED_BOOK, wavBytes } from '../masteringEngine';
import { DeliverySheetStage, SHEET_ASPECT } from '../stages';
import type { ModuleProps } from './shared';

export function Mod7Release({ onAnswered }: ModuleProps) {
  const [destId, setDestId] = useState(DESTINATIONS[0].id);
  const [confirmed, setConfirmed] = useState<Record<string, Set<number>>>({});
  const dest = DESTINATIONS.find((d) => d.id === destId) ?? DESTINATIONS[0];
  const done = confirmed[dest.id] ?? new Set<number>();
  const toggle = (i: number) =>
    setConfirmed((c) => {
      const next = new Set(c[dest.id] ?? []);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { ...c, [dest.id]: next };
    });
  const epMinutes = (232 + 301 + 214 + 258) / 60;
  const cdBytes = wavBytes(232 + 301 + 214 + 258, CD_RED_BOOK.sampleRateHz, CD_RED_BOOK.bitDepth, CD_RED_BOOK.channels);

  return (
    <ModuleSteps
      steps={[
        {
          key: 'contexts', title: 'Delivery contexts', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <Body>Every destination has its own CURRENT requirements and every client has a request. The engineer confirms both, delivers exactly that, and documents it. Below, FACTS are facts; EXAMPLES are labelled as examples to verify against the destination's current specification — they are not the rule.</Body>
              {DESTINATIONS.map((d) => (
                <Card key={d.id}>
                  <Point title={d.name}>{d.brief}</Point>
                  {d.facts.map((f) => <Body key={f}>• FACT — {f}</Body>)}
                  {d.examples.map((e) => <Body key={e}>• EXAMPLE — {e}</Body>)}
                </Card>
              ))}
              <Card tone="accent">
                <Point title="The one constant">Red Book audio CD: {CD_RED_BOOK.bitDepth}-bit, {(CD_RED_BOOK.sampleRateHz / 1000).toFixed(1)} kHz, {CD_RED_BOOK.channels} channels, about {CD_PLAY_MINUTES} minutes of programme. The four-track EP runs {epMinutes.toFixed(1)} minutes — {(cdBytes / 1e6).toFixed(0)} MB as Red Book WAV.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'checklist', title: 'Delivery checklist', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <DeliverySheetStage width={w} height={h} title={dest.name} brief={dest.brief} items={dest.confirm} confirmed={done} />,
            aspect: SHEET_ASPECT,
            size: 'L',
            badge: 'DELIVERY SHEET · sample brief, fictional client',
            bezel: [
              { k: 'DESTINATION', v: dest.name.toUpperCase().split(' /')[0], flex: 2 },
              { k: 'CONFIRMED', v: `${done.size} / ${dest.confirm.length}`, tint: done.size === dest.confirm.length ? colors.green : colors.amber },
            ],
            params: [
              flipFader({ id: 'dest', label: 'DESTINATION', items: DESTINATIONS, selectedId: destId, onSelect: setDestId, name: (d) => d.name, short: (d) => d.name.split(' ')[0].toUpperCase(), blurb: (d) => d.brief, title: 'DESTINATION', sticky: true }),
              {
                kind: 'group', id: 'confirm', label: 'CONFIRM', valueLabel: `${done.size}/${dest.confirm.length}`, hideLane: true,
                render: () => (
                  <Checklist items={dest.confirm.map((c, i) => ({ id: String(i), label: c }))} chosen={new Set([...done].map(String))} onToggle={(id) => toggle(Number(id))} />
                ),
              },
            ],
            initialParam: 'dest',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride DESTINATION, read the sample brief, then open CONFIRM and tick each line as something you would verify before exporting. The sheet on the display fills in as you go — every destination has its own list.</Body>
              <Card tone="accent">
                <Point title={dest.name}>{dest.brief}</Point>
                {dest.facts.map((f) => <Body key={f}>• FACT — {f}</Body>)}
                {dest.examples.map((e) => <Body key={e}>• EXAMPLE — {e}</Body>)}
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Release decisions', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              {RELEASE_SCENARIOS.map((s) => (
                <ScenarioCard key={s.id} s={s} onAnswered={(ok) => onAnswered(s.id, ok)} />
              ))}
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Streaming, CD, vinyl, broadcast/picture and alternate versions each have their own current requirements.</Body>
                <Body>• Facts (Red Book, BS.1770, the existence of R128 and A/85) stay fixed; example numbers are verified against the spec of the day.</Body>
                <Body>• Metadata and documentation are part of the delivery.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.release} />
            </>
          ),
        },
      ]}
    />
  );
}
