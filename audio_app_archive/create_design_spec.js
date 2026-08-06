const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, ShadingType, BorderStyle, VerticalAlign } = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 } }
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("AudioLearn Mobile App")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Design Specification")] }),
      new Paragraph({ spacing: { before: 120, after: 240 }, children: [new TextRun({ text: "A comprehensive design system for audio engineering and music production course learning platform", italic: true })] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1. Design Overview")] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun("AudioLearn is a mobile-first learning platform designed for students studying audio production, engineering, and music technology. The app features a dark theme with vibrant accent colors, intuitive navigation, and gamified learning elements to promote engagement and skill development.")] }),

      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Key Design Principles:", bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Dark theme for extended study sessions with reduced eye strain")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Color-coded learning modes for quick visual identification")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Bottom tab navigation for one-handed mobile use")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Gamification elements (badges, XP, streaks) for motivation")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2. Color Palette")] }),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders, shading: { fill: "333333", type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Color", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders, shading: { fill: "333333", type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Hex Code", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders, shading: { fill: "333333", type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "RGB", bold: true, color: "FFFFFF" })] })] }),
              new TableCell({ borders, shading: { fill: "333333", type: ShadingType.CLEAR }, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Usage", bold: true, color: "FFFFFF" })] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Primary Dark")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#0F1419")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("15, 20, 25")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Main background")] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Card/Section")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#1A1F2E")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("26, 31, 46")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Cards, sections")] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Accent Cyan")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#06B6D4")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("6, 182, 212")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Primary action, active state")] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Accent Purple")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#8B5CF6")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("139, 92, 246")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Secondary action, badges")] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Accent Gold")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#FCD34D")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("252, 211, 77")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Premium, achievement badges")] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Accent Orange")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#F59E0B")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("245, 158, 11")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Progress, ear training")] })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Success Green")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("#10B981")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("16, 185, 129")] })] }),
              new TableCell({ borders, width: { size: 2340, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun("Completed states")] })] })
            ]
          })
        ]
      }),

      new Paragraph({ spacing: { before: 240, after: 120 }, heading: HeadingLevel.HEADING_2, children: [new TextRun("3. Typography")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Font Family: ", bold: true }), new TextRun("Arial (system default, universally supported)")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: "Text Colors: ", bold: true }), new TextRun("White (#FFFFFF) for primary content, Gray (#888888) for secondary")] }),

      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Heading 1: ", bold: true }), new TextRun("24pt, Bold, 240px spacing before/after")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Heading 2: ", bold: true }), new TextRun("20pt, Bold, 180px spacing before/after")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Body Text: ", bold: true }), new TextRun("14-16pt, Regular, for content descriptions")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Captions: ", bold: true }), new TextRun("10-12pt, Regular, for labels and metadata")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4. Spacing & Layout Guidelines")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Screen Width: 375px (mobile viewport)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Screen Height: 812px (full mobile screen)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Default Padding: 16px (horizontal)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Gap Between Sections: 16-24px")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Corner Radius: 8px (default), 12px (large elements)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Status Bar Height: 62px, Bottom Nav Height: 100px")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5. Screen Specifications")] }),

      new Paragraph({ spacing: { before: 200, after: 100 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("Screen 1: Main Home")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("The primary entry point and dashboard for users. Displays personalized greeting, progress stats, featured course, and quick access to study modes.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Key Elements:", bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Status Bar: Time, signal, WiFi, battery indicators (OS-controlled)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Welcome Section: Emoji greeting (e.g., '👋 Hi, Alex!')")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• XP Badges (3): Streak (🔥 7-Day), Total XP (⭐ 1,250 XP), Level (🏆 Level 12)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Main Course Card: AUDI 201 with 75% progress bar, cyan border, purple Continue button")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Quick Study Modes (6): Flashcards, Quiz, Match, Fill-in, Signal Flow, Ear Training")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• My Courses Grid (2 columns): MUSI190 (45%), AUDI204 (62%)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Bottom Navigation: 5 tabs with Home active")] }),

      new Paragraph({ spacing: { before: 200, after: 100 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("Screen 2: Course Page")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("Detailed course view with lesson structure, progress tracking, and lesson navigation.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Key Elements:", bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Header: Back button, course title, menu icon")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Overall Progress: 75% progress bar")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Tabs: Lessons (active), About")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Lesson List: 5+ items with completion checkmarks")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Expandable Sections: Sub-lessons with 3 items each")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Bottom Navigation: 5 tabs with Study active")] }),

      new Paragraph({ spacing: { before: 200, after: 100 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("Screen 3: Study Modes")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("Grid layout displaying all available study modes for interactive learning.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Key Elements:", bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Header: Back button, Study Modes title")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• 2x3 Grid Layout: 6 colored cards (160x160px each)")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Study Mode Cards: Flashcards, Quiz, Match, Fill-in, Signal Flow, Ear Training")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Bottom Navigation: 5 tabs with Study active")] }),

      new Paragraph({ spacing: { before: 200, after: 100 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("Screen 4: Achievements")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("Badge and achievement showcase with progress tracking.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Key Elements:", bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Header: Back button, Achievements title")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Badges Tab (active), Milestones Tab")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• 3x3 Badge Grid: 6 unlocked + 3 locked badges (100x100px)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Bottom Navigation: 5 tabs with Achievements active")] }),

      new Paragraph({ spacing: { before: 200, after: 100 }, heading: HeadingLevel.HEADING_1, children: [new TextRun("Screen 5: Progress Dashboard")] }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun("Comprehensive statistics and progress visualization for overall learning journey.")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Key Elements:", bold: true })] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Header: Back button, Progress title")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Circular Progress Indicator: 78% filled, cyan border")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Statistics Cards (3): Terms, Study Minutes, Streak")] }),
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun("• Course Progress: AUDI 201 (75%, cyan), MUSI190 (45%, orange)")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun("• Bottom Navigation: 5 tabs with Progress active")] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("AudioLearn_Design_Specification.docx", buffer);
  console.log("Document created successfully!");
});
