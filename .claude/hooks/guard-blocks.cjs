#!/usr/bin/env node
/**
 * guard-blocks — PreToolUse Bash guard that turns owner rules into hard gates
 * (owner 2026-09-15). Reads the hook JSON on stdin, inspects the Bash command,
 * and returns a PreToolUse permission decision:
 *   • eas build/submit           -> ask  (BUILD RULE: only on an explicit, in-the-moment "start the build now")
 *   • --no-verify / --no-gpg-sign-> deny (never skip git hooks/signing)
 *   • add/delete/commit/upload of IMAGE assets -> ask (owner gates every image op)
 * Everything else is allowed (no output). Node is used because jq is not on PATH.
 */
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let cmd = '';
  try {
    cmd = ((JSON.parse(data) || {}).tool_input || {}).command || '';
  } catch {
    process.exit(0); // unparseable → don't interfere
  }
  const emit = (decision, reason) => {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: decision,
          permissionDecisionReason: reason,
        },
      }),
    );
    process.exit(0);
  };

  // 1) BUILD RULE — never self-initiate a build/submit (billed/external).
  if (/\beas(?:-cli)?\s+(?:build|submit)\b/i.test(cmd)) {
    return emit(
      'ask',
      'BUILD RULE (owner, written in nine places): eas build/submit runs ONLY when the owner has said, in that moment, to start the build now. Approve only if that just happened.',
    );
  }

  // 1b) PUBLISH RULE (owner, 2026-10-02 handoff) — an OTA reaches testers' phones; never unasked.
  if (/\beas(?:-cli)?(?:@\S+)?\s+update\b/i.test(cmd) && !/\bupdate:(?:list|view)\b/i.test(cmd)) {
    return emit(
      'ask',
      'PUBLISH RULE (owner): `eas update` publishes to testers. Run it ONLY when the owner has said "publish" for this change. Check channel, fingerprint and rollback first (reference_fast_dev_loop).',
    );
  }

  // 2) Never skip git hooks / signing.
  if (/--no-verify\b|--no-gpg-sign\b/.test(cmd)) {
    return emit('deny', 'Do not skip git hooks or signing (--no-verify / --no-gpg-sign). Fix the underlying issue instead.');
  }

  // 3) IMAGE OPS — owner gates every add/delete/move/upload of image assets.
  const imgDelete = /\b(?:rm|unlink|mv|git\s+rm|del)\b[^\n]*(?:\.webp|\.png|\.jpe?g|\/(?:credential-squares|Certificate_Squares|Program_Squares)\b|save here before pen)/i;
  const imgUpload = /upload-credential-cards|lab-audio[^\n]*upload|storage\/v1\/object[^\n]*(?:POST|--upload|-T\b)/i;
  const imgGitAdd = /git\s+add\b[^\n]*(?:\.webp|\.png|\.jpe?g|assets\/(?:credential-squares|Certificate_Squares|Program_Squares))/i;
  if (imgDelete.test(cmd) || imgUpload.test(cmd) || imgGitAdd.test(cmd)) {
    return emit(
      'ask',
      'IMAGE RULE (owner): never add/delete/commit/upload image assets on assumption — the owner names the exact folder and gives the go each time. Approve only if that just happened.',
    );
  }

  // 4) COMMIT -a (2026-10-08 lesson): after a tree-wide line-ending pass, `commit -a`
  // staged 1,716 corrupted images (814988e0). Commit exact files instead.
  const commitAll = (() => {
    const m = /\bgit\b[^\n;&|]*?\bcommit\b([^\n;&|]*)/.exec(cmd);
    if (!m) return false;
    // Flags only: stop at the message (-m / --message / -F / a quoted string).
    for (const tok of m[1].trim().split(/\s+/)) {
      if (/^(?:-m|--message|-F|--file)/.test(tok) || /^["']/.test(tok)) break;
      if (tok === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(tok)) return true;
    }
    return false;
  })();
  if (commitAll) {
    return emit(
      'ask',
      'COMMIT -a RULE (2026-10-08): `git commit -a` stages EVERY modified file — after a line-ending pass that included 1,716 corrupted images. Use `git add <exact files>` then commit. Approve only if the working tree is known clean apart from the intended files.',
    );
  }

  // 5) SHARED GIT CONFIG (2026-10-08): core.autocrlf/eol are shared with the owner's
  // main checkout across all worktrees — use `git -c ...` per command instead.
  if (/\bgit\s+config\b(?![^\n]*--get)[^\n]*\bcore\.(?:autocrlf|eol)\b/.test(cmd)) {
    return emit('deny', 'Do not change core.autocrlf / core.eol — that config is shared with the owner\'s main checkout. Use `git -c core.autocrlf=false -c core.eol=lf <cmd>` per command.');
  }

  process.exit(0); // allow
});
