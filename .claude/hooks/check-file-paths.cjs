#!/usr/bin/env node
/*
 * Stop hook — enforces full-file-paths-rule.
 *
 * Reads the just-finished assistant message from the session transcript and
 * BLOCKS the turn if it contains a markdown link to a repo file/folder whose
 * VISIBLE TEXT is not a full absolute Windows path (C:\...). The href stays
 * repo-relative (so it's clickable); only the visible text is checked.
 *
 * Fails OPEN: any parse/read error or missing transcript → allow the stop
 * (exit 0, no output). Never blocks on its own malfunction.
 *
 * Code inside ``` fences ``` and `inline code` is stripped before scanning, so
 * example snippets and pasted SQL/commands don't trigger false positives.
 */
const fs = require('fs');

function allow() { process.exit(0); } // allow the stop; no output

let raw = '';
try { raw = fs.readFileSync(0, 'utf8'); } catch { allow(); }

let input = {};
try { input = JSON.parse(raw); } catch { allow(); }

const tp = input && input.transcript_path;
if (!tp || !fs.existsSync(tp)) allow();

// --- pull the last assistant TEXT message from the transcript ---
let text = '';
try {
  const lines = fs.readFileSync(tp, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    const role = (o.message && o.message.role) || o.role || o.type;
    if (o.type !== 'assistant' && role !== 'assistant') continue;
    const content = (o.message && o.message.content) || o.content;
    if (!Array.isArray(content)) continue;
    const t = content
      .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text)
      .join('\n');
    if (t.trim()) text = t; // keep the LAST assistant text block seen
  }
} catch { allow(); }

if (!text.trim()) allow();

// --- strip code so example/pasted snippets don't false-positive ---
const scan = text
  .replace(/```[\s\S]*?```/g, '')   // fenced code blocks
  .replace(/`[^`\n]*`/g, '');       // inline code spans

// --- scan markdown links [visible](href) ---
const linkRe = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const violations = [];
let m;
while ((m = linkRe.exec(scan))) {
  const vis = m[1].trim();
  const href = m[2].trim();
  if (!href) continue;
  // external URLs / anchors / mail / tel are not file paths — ignore.
  if (/^(https?:|mailto:|tel:|ftp:|#)/i.test(href)) continue;
  // a repo file/folder link: visible text MUST be a full absolute Windows path.
  const isAbsolute = /^[A-Za-z]:\\/.test(vis);
  if (!isAbsolute) violations.push({ vis, href });
}

if (violations.length) {
  const list = violations
    .map(
      (v) =>
        `  - [${v.vis}](${v.href})  → make the visible text the full absolute path, e.g. ` +
        `C:\\Users\\profe\\dev\\ape-studio\\${v.href.replace(/\//g, '\\')} (keep the href as-is)`,
    )
    .join('\n');
  const reason =
    `FILE-PATH RULE VIOLATION (full-file-paths-rule): ${violations.length} link(s) point to a ` +
    `repo file/folder but the VISIBLE TEXT is not a full absolute C:\\ path. The owner clicks the ` +
    `link to open it and needs the absolute path shown. Rewrite each link so the visible text is the ` +
    `complete absolute Windows path (the href stays repo-relative so it remains clickable), then resend:\n` +
    list;
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}

allow();
