/**
 * TopicAboutPanel — Computer B's long-form "About This Topic" overview for a
 * v3 topic, rendered inside the full-size topic-image popup (owner
 * 2026-09-20). Data only: the scrolling shell, the tap-swallowing and the
 * type are all AboutPanel, shared with the credential viewer so the two
 * popups stay the same feature.
 *
 * ⚠️ SECTION ORDER IS DATA, NOT KEY ORDER. Walk TOPIC_ABOUT_SECTION_ORDER and
 * TOPIC_ABOUT_MODULE_ORDER; key order in an object literal is not a contract
 * and the data file says so itself.
 *
 * ⚠️ The section HEADINGS are placeholders derived mechanically from the keys
 * (`TOPIC_ABOUT_SECTION_LABEL`, which exists so rewording them is one edit).
 * The overview TEXT is final and must not be touched here.
 */
import { AboutPanel, type AboutSection } from './AboutPanel';
import { topicCopy } from '../data/topicCopy';

/**
 * ⛔ THE ~600 KB OVERVIEW FILE LOADS ON FIRST OPEN, NOT AT APP START (perf
 * hunt 2026-10-03). data/topicAbout.ts says so in its own header ("IMPORT IT
 * LAZILY"), but this panel imported it at the top, and the Dashboard — the
 * first tab — imports this panel, so every cold start evaluated all 166
 * overviews before the first screen could draw. It is required on the first
 * render of the panel, which happens only inside the open topic popup.
 */
type TopicAboutModule = typeof import('../data/topicAbout');
let aboutModule: TopicAboutModule | null = null;
function loadAbout(): TopicAboutModule {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  if (!aboutModule) aboutModule = require('../data/topicAbout') as TopicAboutModule;
  return aboutModule;
}

/** Does this topic have an overview? Callers use it to decide layout BEFORE
 *  rendering — the popup shrinks its art to make room only when there is
 *  something to make room for. Answered from topicCopy WITHOUT loading the
 *  overviews: the two files cover exactly the same topics, both ways
 *  (test/topicAbout.test.ts, test/perfShared_20261003.test.ts). */
export function hasTopicAbout(gs: number | null | undefined): boolean {
  return topicCopy(gs) != null;
}

export function TopicAboutPanel({ gs, maxHeight }: { gs: number | null | undefined; maxHeight?: number }) {
  const { TOPIC_ABOUT_MODULE_ORDER, TOPIC_ABOUT_SECTION_LABEL, TOPIC_ABOUT_SECTION_ORDER, topicAbout } = loadAbout();
  const about = topicAbout(gs);
  if (!about) return null;

  const sections: AboutSection[] = [];
  for (const key of TOPIC_ABOUT_SECTION_ORDER) {
    const body = about[key];
    if (body) sections.push({ key, label: TOPIC_ABOUT_SECTION_LABEL[key], body });
  }
  for (const key of TOPIC_ABOUT_MODULE_ORDER) {
    const body = about.optional_modules?.[key];
    if (body) sections.push({ key, label: TOPIC_ABOUT_SECTION_LABEL[key], body });
  }

  return <AboutPanel eyebrow="About this topic" sections={sections} maxHeight={maxHeight} />;
}
