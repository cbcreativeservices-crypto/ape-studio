// community-flag-digest — one daily moderation email (owner 2026-10-15 H9, wired 2026-10-23).
// Called only by private.dispatch_community_flag_digest() (pg_cron + pg_net) with the service-role key.
// The body carries the people flagged since the last digest and their counts per category.
// NO message text ever reaches this function or the email.
const RESEND_URL = 'https://api.resend.com/emails';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function jwtRole(auth: string): string | null {
  const tok = auth.replace(/^Bearer\s+/i, '');
  const part = tok.split('.')[1];
  if (!part) return null;
  try {
    const pad = part.length % 4 ? '='.repeat(4 - (part.length % 4)) : '';
    const payload = JSON.parse(atob((part + pad).replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

type Person = { user_id: string; name: string; total: number; counts: Record<string, number> };
const CATS = ['threat', 'hate', 'sexual', 'harassment', 'self_harm', 'profanity'];
const LABEL: Record<string, string> = {
  threat: 'Threat', hate: 'Hate / slur', sexual: 'Sexual', harassment: 'Harassment', self_harm: 'Self-harm', profanity: 'Strong swearing (profile)',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  // Only the database's service-role call may trigger an email (gateway already verified the JWT signature).
  if (jwtRole(req.headers.get('Authorization') ?? '') !== 'service_role') return json({ ok: false, error: 'forbidden' }, 403);

  let body: { to?: string; since?: string; until?: string; people?: Person[] };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  const people = Array.isArray(body.people) ? body.people : [];
  const to = (body.to ?? '').trim();
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ ok: false, error: 'no_recipient' }, 400);
  if (people.length === 0) return json({ ok: true, sent: false, reason: 'nobody flagged' });

  const resendKey = Deno.env.get('RESEND_API_KEY') ?? '';
  if (!resendKey) {
    console.warn('[community-flag-digest] no RESEND_API_KEY — digest NOT sent');
    return json({ ok: false, error: 'no_resend_key' }, 500);
  }
  // Sender (Comp A 2026-10-28, owner GO): brand name only; EMPLOYER_MAIL_FROM is the sender secret that is set.
  const from = Deno.env.get('EMAIL_FROM') ?? Deno.env.get('EMPLOYER_MAIL_FROM') ?? 'Pro Audio Training Academy <notifications@proaudiotrainingacademy.com>';

  const totals: Record<string, number> = {};
  for (const p of people) for (const [k, n] of Object.entries(p.counts ?? {})) totals[k] = (totals[k] ?? 0) + Number(n);
  const fmt = (iso?: string) => {
    try {
      return new Date(iso ?? '').toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return esc(iso);
    }
  };
  const rows = people
    .map((p) => {
      const cells = CATS.map((c) => `<td style="padding:4px 10px;text-align:center;">${p.counts?.[c] ? esc(p.counts[c]) : '·'}</td>`).join('');
      return `<tr><td style="padding:4px 10px;"><b>${esc(p.name)}</b><br><span style="color:#778;font-size:12px;">${esc(p.user_id)}</span></td><td style="padding:4px 10px;text-align:center;"><b>${esc(p.total)}</b></td>${cells}</tr>`;
    })
    .join('');
  const head = CATS.map((c) => `<th style="padding:4px 10px;font-size:12px;color:#556;">${esc(LABEL[c])}</th>`).join('');
  const html = `<div style="font:14px/1.55 -apple-system,Segoe UI,Arial,sans-serif;color:#111;">
    <p style="font:700 12px/1.4 Arial;letter-spacing:1.5px;color:#a67c00;margin:0 0 6px;">MODERATION DIGEST</p>
    <h2 style="margin:0 0 6px;">${people.length} member${people.length === 1 ? '' : 's'} flagged by the community filter</h2>
    <p style="margin:0 0 14px;color:#556;">${fmt(body.since)} to ${fmt(body.until)} (Pacific). Each flag is a message, contact request or profile save that the filter refused. No message text is stored or shown.</p>
    <table style="border-collapse:collapse;border:1px solid #dde;"><tr style="background:#f4f4f8;"><th style="padding:4px 10px;text-align:left;">Member</th><th style="padding:4px 10px;">Total</th>${head}</tr>${rows}</table>
    <p style="margin-top:16px;">Nothing happens automatically. To act, use the existing warn, suspend or ban tools. Details (time, surface, category) are in <code>private.community_rules_flags</code>.</p>
  </div>`;
  const subject = `Moderation digest: ${people.length} member${people.length === 1 ? '' : 's'} flagged (${Object.entries(totals)
    .map(([k, n]) => `${n} ${k}`)
    .join(', ')})`;

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html, headers: { 'X-APE-Category': 'moderation-digest' } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error('[community-flag-digest] resend refused:', res.status, (await res.text()).slice(0, 300));
      return json({ ok: false, error: 'send_failed', status: res.status }, 502);
    }
  } catch (e) {
    console.error('[community-flag-digest] send failed:', (e as Error).message);
    return json({ ok: false, error: 'send_failed' }, 502);
  }
  return json({ ok: true, sent: true, people: people.length });
});
