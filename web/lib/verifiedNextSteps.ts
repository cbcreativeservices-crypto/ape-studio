// "You're verified: what to do next" (owner approved 2026-10-28, must-do D23).
// One copy for the website's verified screens and, later, the applicant email.
// Screen names are the app's own (builds 39/23 + the post-approval update):
// checked in src/screens/profile/EmployerSection.tsx, ProfileScreen.tsx,
// directory/AudioCommunityDirectoryScreen.tsx and features/instructor/shareRules.ts.
// **text** marks a screen or button name; the renderer bolds it.

export type VerifierKind = "employer" | "instructor";

export type NextSteps = {
  title: string;
  steps: string[];
  footer: string[];
};

const GET_APP = "Get the Pro Audio Training Academy app for iPhone or Android.";
const SIGN_IN = "Sign in with the same email and password you used here.";
const QUESTIONS = "Questions? info@proaudiotrainingacademy.com.";

export const NEXT_STEPS: Record<VerifierKind, NextSteps> = {
  employer: {
    title: "What to do next",
    steps: [
      GET_APP,
      SIGN_IN,
      "In the app, open the **Profile** tab and scroll to **Employer account**. Choose **Areas you hire in**, **Roles you are looking for** and **What you are offering**.",
      "Still on **Profile**, open **Audio Community Directory** → **Open the Directory**. Under **Explore**, open a member and tap **Send a contact request**. Say what it's about; you can only pick from the things that member is open to.",
      "Replies arrive under **Requests**. The member accepts, declines or blocks. Nothing becomes a conversation until they accept, and we never share a member's email or phone number.",
    ],
    footer: [`${QUESTIONS} Verification can be withdrawn for misuse.`],
  },
  // Owner 2026-10-28 ("Website first"): the instructor's code and the students'
  // progress are on the website's /instructor page, which works on today's builds.
  instructor: {
    title: "What to do next",
    steps: [
      GET_APP,
      SIGN_IN,
      "Your 8-character instructor code is on the website: sign in at **proaudiotrainingacademy.com/instructor**.",
      "Give the code to your students. Each student opens **Profile** → **My instructor** in the app, types your code, and taps **Share my progress**. They need to add their **Name on your certificates** first, and they can stop sharing at any time.",
      "See each sharing student's progress on that same **/instructor** page: topics, study, quiz scores and dates (never their answers), labs, final exams and credentials.",
      "You can also contact members the same way employers do: in the app, open **Profile** → **Audio Community Directory** and send a contact request they accept or decline.",
    ],
    footer: [
      "If a student doesn't see **My instructor**, they should close and reopen the app once so it picks up the latest update.",
      QUESTIONS,
    ],
  },
};

export function nextStepsFor(kind: string | null | undefined): NextSteps {
  return kind === "instructor" ? NEXT_STEPS.instructor : NEXT_STEPS.employer;
}

/** Splits "a **b** c" into text and bold parts. */
export function boldParts(s: string): { text: string; bold: boolean }[] {
  return s
    .split("**")
    .map((text, i) => ({ text, bold: i % 2 === 1 }))
    .filter((p) => p.text.length > 0);
}
