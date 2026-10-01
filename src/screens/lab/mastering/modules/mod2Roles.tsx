/**
 * Module 2 — Mixing engineer and mastering engineer. LEARN (read: the
 * comparison table) → EXPLORE (rack: who has control of that?) → PRACTICE
 * → REVIEW.
 */
import { useState } from 'react';
import { flipFader } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, CompareTable, KeyTerms, Point, ScenarioDeck, SectionTitle } from '../kit';
import { CONTROL_ITEMS, CONTROL_OWNER_LABEL, KEY_TERMS, ROLE_SCENARIOS } from '../masteringContent';
import { CONTROL_ASPECT, ControlMapStage, controlItemById } from '../stages';
import { MODEL_BADGE, type ModuleProps } from './shared';

const ROWS: readonly [string, string][] = [
  ['Works with individual tracks, buses and effects.', 'Usually works with the approved stereo or multichannel mix.'],
  ['Shapes relationships among instruments.', 'Evaluates and adjusts the mix as a complete programme.'],
  ['Can change a vocal, a snare or a bass independently.', 'Usually cannot change those independently without stems or a new mix.'],
  ['Builds the final mix for review and approval.', 'Prepares the approved mix for release and distribution.'],
  ['Focuses on balance and intent.', 'Focuses on translation, consistency, technical quality and delivery.'],
];

export function Mod2Roles({ onAnswered }: ModuleProps) {
  const [itemId, setItemId] = useState(CONTROL_ITEMS[0].id);
  const item = controlItemById(itemId);
  return (
    <ModuleSteps
      steps={[
        {
          key: 'table', title: 'Two jobs, side by side', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <CompareTable left="MIXING ENGINEER" right="MASTERING ENGINEER" rows={ROWS} />
              <Card>
                <Point title="The roles can overlap">In smaller projects one person may do both. What still changes is the listening perspective — the finished programme, fresh — and the available control: a stereo file, not a session.</Point>
                <Point title={'Mastering is not simply "making it louder"'}>Level is one decision among many, judged at matched loudness like every other.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'control', title: 'Who has control of that?', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <ControlMapStage width={w} height={h} item={item} />,
            aspect: CONTROL_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'REQUEST', v: item.label, flex: 2.2 },
              // One word: "MASTERING ENGINEER" (18 characters) would crop to
              // an ellipsis at 375 wide; the drawing's verdict strip says it
              // in full.
              { k: 'ADDRESSED BY', v: CONTROL_OWNER_LABEL[item.owner].toUpperCase().split(' ')[0], flex: 1.6 },
            ],
            params: [
              flipFader({ id: 'item', label: 'REQUEST', items: CONTROL_ITEMS, selectedId: itemId, onSelect: setItemId, name: (c) => c.label, short: (c) => c.short, blurb: (c) => c.why, title: 'A CLIENT REQUEST', sticky: true }),
            ],
            initialParam: 'item',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride REQUEST (or tap it for the list). The signal flow on the display runs from the individual tracks, through the mix bus, to the stereo master and the delivery. The lit stage is where the request can normally be addressed — and the colour says whose job it is.</Body>
              <Card tone="accent">
                <Point title={item.label}>{item.why}</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Which role?', kind: 'PRACTICE', layout: 'read',
          body: <ScenarioDeck scenarios={ROLE_SCENARIOS} onAnswered={onAnswered} />,
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• The mixer works inside the session; the mastering engineer works on the finished programme.</Body>
                <Body>• Independent control of an element belongs to the mix — or to stems, by agreement.</Body>
                <Body>• Translation, consistency, technical quality and delivery are the mastering focus.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.roles} />
            </>
          ),
        },
      ]}
    />
  );
}
