// Builds the applicant email from the approved copy (must-do D23).
import { NEXT_STEPS } from "./copy.ts";

export function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** "a **b** c" → escaped HTML with <b>; the same markers the website bolds. */
export function richHtml(s: string): string {
  return s
    .split("**")
    .map((t, i) => (i % 2 === 1 ? `<b>${esc(t)}</b>` : esc(t)))
    .join("");
}

/** Plain-text twin for mail clients that show no HTML. */
export function richText(s: string): string {
  return s.split("**").join("");
}

// Owner 2026-10-28: in the EMAIL, "used here" (the website) reads "used on our website".
export const forEmail = (s: string) => s.replace("you used here.", "you used on our website.");

export function buildEmail(kind: string, company: string): { html: string; text: string } {
  const src = kind === "instructor" ? NEXT_STEPS.instructor : NEXT_STEPS.employer;
  const c = { title: src.title, steps: src.steps.map(forEmail), footer: src.footer.map(forEmail) };
  const what = kind === "instructor" ? "instructor" : "employer";
  const lead = `Your ${what} account for ${company || "your organization"} is active.`;
  const html = `<div style="font:15px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#111;">
    <p style="font:700 12px/1.4 Arial;letter-spacing:1.5px;color:#a67c00;margin:0 0 6px;">YOU ARE VERIFIED</p>
    <p>${esc(lead)}</p>
    <p style="font-weight:700;margin:18px 0 6px;">${esc(c.title)}</p>
    <ol style="padding-left:20px;margin:0;">${c.steps.map((s) => `<li style="margin:0 0 8px;">${richHtml(s)}</li>`).join("")}</ol>
    ${c.footer.map((s) => `<p style="color:#444;">${richHtml(s)}</p>`).join("")}
  </div>`;
  const text = [
    "YOU ARE VERIFIED",
    "",
    lead,
    "",
    c.title,
    ...c.steps.map((s, i) => `${i + 1}. ${richText(s)}`),
    "",
    ...c.footer.map(richText),
  ].join("\n");
  return { html, text };
}
