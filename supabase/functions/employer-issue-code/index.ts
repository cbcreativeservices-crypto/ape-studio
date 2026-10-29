// supabase/functions/employer-issue-code: SWITCHED OFF 2026-10-28 (owner GO).
// The live employer-apply-finalize (deployed 2026-09-19) already mints and mails
// the work-email code. Running this as well sent a second code that replaced the
// first. The website route treats any non-OK reply as "not sent here" and keeps
// employer-apply-finalize's own sent_to, so exactly one code goes out.
// Delete this function once ccode reconciles the repo with the live finalize.
Deno.serve(() =>
  new Response(JSON.stringify({ ok: false, error: "disabled" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  })
);
