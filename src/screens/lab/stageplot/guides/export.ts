/**
 * Screen guide — the Export area of the Stage Plot and Channel Designer
 * (must-do D60). Pure data (test/stagePlotPacket.test.ts loads it under
 * node). Voice: to the user, about THIS area. A button or a section is
 * written in CAPITALS, as on the screen; a field label keeps its own case in
 * quotation marks. Every one it names is a real label in ExportArea.tsx,
 * export/ or the lab's form kit.
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_EXPORT: ScreenGuide = {
  intro: {
    learning: 'A packet is your stage plot, input list and monitor plan in one document. Every page comes from the same revision, and an open question is printed, not hidden.',
    start: 'Read REVIEW and answer what you can. Choose the packet and the paper, look at PREVIEW, then press SHARE PDF or PRINT. The line under the button tells you what happened.',
  },
  seeing: [
    'The counts are worked out from your stage, inputs and monitors. You do not type them, so they cannot disagree with your lists.',
    'REVIEW holds every question that is still open, each with its answers, or with GO TO where the answer is typed.',
    'PREVIEW is the packet itself: the plot seen from above, with the audience at the bottom, then every table row and every note.',
  ],
  control: [
    '“Packet” picks the full packet, the stage plot only, or the compact packet. “Paper” picks the page size.',
    'SHARE PDF makes the file and opens your phone’s share menu. PRINT opens the print dialog. In a browser you get DOWNLOAD PDF, and PRINT opens a print view first.',
    'COPY TECHNICAL SUMMARY copies your totals as plain text for a quick message.',
    'The subject and the message are yours to change. COPY THE MESSAGE copies them, so you can paste them into your email.',
    '“Show the packet as” switches PREVIEW between “Formatted” and “Text only”.',
  ],
  changes: [
    'Each button takes a copy of your stage plot at that moment and makes every page from that copy.',
    'After you print or share a packet, your next edit moves the revision number forward. Two different documents never share a number.',
    'A packet is stamped DRAFT while the status is Draft or something must be corrected. You can still print and share a draft.',
  ],
  teaches: [
    'A venue engineer plans from the packet, so an honest “to be confirmed” helps more than a guess.',
    '“Ready to advance” means your document is prepared for discussion. It does not mean the venue has agreed.',
    'Opening a share menu is not sending. Only your mail app knows whether the message went.',
  ],
  tryThis: [
    'Switch “Packet” to the stage plot only and read PREVIEW. Then switch back and find the same performers in the input list.',
    'Press COPY TECHNICAL SUMMARY and paste it into a note. Compare its totals with the counts at the top of this area.',
    'Leave one detail as “to be confirmed” in Inputs, come back here, and find it in the last section of PREVIEW.',
  ],
};
