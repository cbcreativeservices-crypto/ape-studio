/**
 * Production labs — which "explain this screen" guide each production screen
 * shows (owner 2026-10-31, Screen Guide rollout). Both labs draw the same four
 * screens, so each screen asks here by lab (and stage or exercise id); the
 * content lives in preprodScreenGuides.ts and postprodScreenGuides.ts.
 *
 * An unknown lab, stage or exercise (a hand-typed deep link) has no guide:
 * the screen then shows no ⓘ key rather than a guide for a different screen.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { LabKind } from '../../../features/production/types';
import {
  PREPROD_ACTIVITY_GUIDES,
  PREPROD_HOME_GUIDE,
  PREPROD_PACKET_GUIDE,
  PREPROD_STAGE_GUIDES,
  PREPROD_START_GUIDE,
} from './preprodScreenGuides';
import {
  POSTPROD_ACTIVITY_GUIDES,
  POSTPROD_HOME_GUIDE,
  POSTPROD_PACKET_GUIDE,
  POSTPROD_STAGE_GUIDES,
  POSTPROD_START_GUIDE,
} from './postprodScreenGuides';

type LabGuides = {
  start: ScreenGuide;
  home: ScreenGuide;
  stages: Record<string, ScreenGuide>;
  activities: Record<string, ScreenGuide>;
  packet: ScreenGuide;
};

export const PRODUCTION_SCREEN_GUIDES: Record<LabKind, LabGuides> = {
  preprod: {
    start: PREPROD_START_GUIDE,
    home: PREPROD_HOME_GUIDE,
    stages: PREPROD_STAGE_GUIDES,
    activities: PREPROD_ACTIVITY_GUIDES,
    packet: PREPROD_PACKET_GUIDE,
  },
  postprod: {
    start: POSTPROD_START_GUIDE,
    home: POSTPROD_HOME_GUIDE,
    stages: POSTPROD_STAGE_GUIDES,
    activities: POSTPROD_ACTIVITY_GUIDES,
    packet: POSTPROD_PACKET_GUIDE,
  },
};

/** `Object.hasOwn`, so an id such as "constructor" never finds a guide. */
const own = <T,>(rec: Record<string, T> | undefined, id: string): T | undefined =>
  rec && Object.prototype.hasOwnProperty.call(rec, id) ? rec[id] : undefined;

/** The lab home: START A PROJECT when no project is open, else the open project. */
export function productionHomeGuide(lab: LabKind, projectOpen: boolean): ScreenGuide | undefined {
  const g = own(PRODUCTION_SCREEN_GUIDES, lab);
  return g ? (projectOpen ? g.home : g.start) : undefined;
}

export function productionStageGuide(lab: LabKind, stageId: string): ScreenGuide | undefined {
  return own(own(PRODUCTION_SCREEN_GUIDES, lab)?.stages, stageId);
}

export function productionActivityGuide(lab: LabKind, activityId: string): ScreenGuide | undefined {
  return own(own(PRODUCTION_SCREEN_GUIDES, lab)?.activities, activityId);
}

export function productionPacketGuide(lab: LabKind): ScreenGuide | undefined {
  return own(PRODUCTION_SCREEN_GUIDES, lab)?.packet;
}
