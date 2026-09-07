// admin-codes — the owner-only access-code dashboard, served and enforced
// entirely from this ONE edge function (2026-09-07). Standalone: it is not part
// of the website and touches no web/ files. It both SERVES the console HTML
// (GET at a secret path) and PERFORMS the privileged actions (POST), so the
// browser never holds any power — every action is re-checked server-side.
//
// FIVE layers guard every privileged action (owner brief 2026-09-07):
//   1. Sign-in            — a valid Supabase session (email + password).
//   2. Two-factor         — the session must be AAL2 (authenticator app / TOTP).
//   3. Admin allowlist     — the account's email must be in ADMIN_EMAILS.
//   4. Extra passphrase   — a second secret (ADMIN_PASSPHRASE) sent per action.
//   5. Location allowlist — optional; ADMIN_IP_ALLOW, empty = allow all (loosened).
// The GET page is additionally gated by a secret path segment (ADMIN_URL_SLUG)
// and marked noindex, so the URL is unlisted. The code generator itself
// (admin_mint_access_code) is service-role-only and unreachable by any client.
//
// FAIL-SAFE: any unset secret denies. Deployed before setup, the page 404s and
// every action is refused — nothing can be minted.
//
// deploy: supabase functions deploy admin-codes --no-verify-jwt   (verify_jwt
//   MUST be off — the gateway can't see our custom auth; we enforce it here).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') ?? '')
  .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
const PASSPHRASE = Deno.env.get('ADMIN_PASSPHRASE') ?? '';
const SLUG = Deno.env.get('ADMIN_URL_SLUG') ?? '';
const IP_ALLOW = (Deno.env.get('ADMIN_IP_ALLOW') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
const notFound = () => new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex, nofollow' } });

/** Constant-time string compare (avoids leaking the passphrase via timing). */
function ctEq(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let d = 0;
  for (let i = 0; i < ea.length; i++) d |= ea[i] ^ eb[i];
  return d === 0;
}

/** The AAL claim from a Supabase access token ('aal1' | 'aal2'). */
function tokenAal(jwt: string): string | null {
  try {
    let p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (p.length % 4) p += '=';
    return (JSON.parse(atob(p)) as { aal?: string }).aal ?? null;
  } catch {
    return null;
  }
}

function clientIp(req: Request): string {
  return (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
}
/** Loosened: no ADMIN_IP_ALLOW → allow everywhere. Otherwise exact IPs or a
 *  trailing-`*` prefix (e.g. "203.0.113.*"). */
function ipAllowed(ip: string): boolean {
  if (IP_ALLOW.length === 0) return true;
  return IP_ALLOW.some((e) => (e.endsWith('*') ? ip.startsWith(e.slice(0, -1)) : e === ip));
}

type Actor = { email: string };
/** Run the full five-layer check. Returns the actor on success, or a Response to return. */
async function authorize(req: Request, passphrase: string): Promise<Actor | Response> {
  const bearer = req.headers.get('Authorization') ?? '';
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : '';
  if (!token) return json({ error: 'not_authenticated' }, 401);
  const anon = createClient(SUPABASE_URL, ANON);
  const { data, error } = await anon.auth.getUser(token); // validates signature + expiry server-side
  if (error || !data.user) return json({ error: 'not_authenticated' }, 401);
  if (tokenAal(token) !== 'aal2') return json({ error: 'need_2fa' }, 403);
  const email = (data.user.email ?? '').toLowerCase();
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(email)) return json({ error: 'not_admin' }, 403);
  if (PASSPHRASE.length === 0 || !ctEq(passphrase, PASSPHRASE)) return json({ error: 'bad_passphrase' }, 403);
  if (!ipAllowed(clientIp(req))) return json({ error: 'blocked_location' }, 403);
  return { email };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean); // e.g. [functions,v1,admin-codes,<slug>] OR [admin-codes,<slug>]

  // ── serve the console page (GET, secret path only) ──
  // Match the slug ANYWHERE in the path: Supabase may or may not include the
  // /functions/v1/ prefix or the function name, so we don't assume a fixed index.
  if (req.method === 'GET') {
    if (!SLUG || !parts.includes(SLUG)) return notFound();
    const html = PAGE.replace(/%%URL%%/g, SUPABASE_URL).replace(/%%ANON%%/g, ANON);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' },
    });
  }

  if (req.method !== 'POST') return notFound();

  let body: { action?: string; passphrase?: string; plan?: string; count?: number; maxUses?: number; note?: string; codeExpiresDays?: number | null; code?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const actor = await authorize(req, String(body.passphrase ?? ''));
  if (actor instanceof Response) return actor;

  const admin = createClient(SUPABASE_URL, SERVICE);

  if (body.action === 'mint') {
    const plan = String(body.plan ?? '');
    if (!['month', 'year', 'lifetime'].includes(plan)) return json({ error: 'bad_plan' }, 400);
    const count = Math.max(1, Math.min(500, Number(body.count ?? 1)));
    const maxUses = Math.max(1, Number(body.maxUses ?? 1));
    const { data, error } = await admin.rpc('admin_mint_access_code', {
      p_plan: plan,
      p_count: count,
      p_max_uses: maxUses,
      p_note: body.note ? String(body.note).slice(0, 200) : null,
      p_code_expires_days: body.codeExpiresDays ?? null,
    });
    if (error) return json({ error: 'mint_failed', detail: error.message }, 500);
    return json({ ok: true, codes: data });
  }

  if (body.action === 'list') {
    const { data, error } = await admin
      .from('access_codes')
      .select('code, note, grant_days, max_uses, used_count, active, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return json({ error: 'list_failed', detail: error.message }, 500);
    return json({ ok: true, rows: data });
  }

  if (body.action === 'deactivate' || body.action === 'reactivate') {
    const code = String(body.code ?? '').trim();
    if (!code) return json({ error: 'bad_code' }, 400);
    const { error } = await admin.from('access_codes').update({ active: body.action === 'reactivate' }).eq('code', code);
    if (error) return json({ error: 'update_failed', detail: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: 'unknown_action' }, 400);
});

// ─────────────────────────────────────────────────────────────────────────────
// The console page. No secrets live here — only the public project URL and the
// publishable anon key (injected at serve time). All authority is server-side.
// ─────────────────────────────────────────────────────────────────────────────
const PAGE = String.raw`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Access Codes</title>
<style>
  :root{
    --bg:#0e0f12; --panel:#16181d; --panel2:#1b1e24; --line:#262a31; --line2:#333844;
    --ink:#e7ebf0; --mut:#8a909a; --dim:#5f6673;
    --amber:#e0a83a; --amberdim:#3a2f12; --green:#37e05f; --red:#f0603a;
    --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box} html,body{margin:0}
  body{background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.5;
       -webkit-font-smoothing:antialiased}
  .wrap{max-width:780px;margin:0 auto;padding:28px 18px 80px}
  .brandrow{display:flex;align-items:center;gap:10px;margin-bottom:22px}
  .dot{width:9px;height:9px;border-radius:50%;background:var(--amber);box-shadow:0 0 12px var(--amber)}
  .brand{font-family:var(--mono);font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:var(--mut)}
  h1{font-size:23px;letter-spacing:-.01em;margin:0 0 2px}
  .sub{color:var(--mut);font-size:13.5px;margin:0 0 22px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:20px;margin-bottom:16px}
  .card h2{font-family:var(--mono);font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--mut);margin:0 0 14px;font-weight:600}
  label{display:block;font-size:12px;color:var(--mut);margin:0 0 5px;letter-spacing:.02em}
  input,select{width:100%;background:var(--panel2);border:1px solid var(--line2);border-radius:8px;
       color:var(--ink);font:inherit;padding:11px 12px;outline:none}
  input:focus,select:focus{border-color:var(--amber)}
  .row{display:flex;gap:12px;flex-wrap:wrap}
  .row>div{flex:1;min-width:120px}
  .field{margin-bottom:13px}
  button{font:inherit;font-weight:600;border:none;border-radius:8px;padding:11px 16px;cursor:pointer;
       background:var(--amber);color:#141105;letter-spacing:.02em}
  button.ghost{background:transparent;border:1px solid var(--line2);color:var(--ink)}
  button.mini{padding:6px 10px;font-size:12px;border-radius:6px}
  button:disabled{opacity:.45;cursor:default}
  button:focus-visible,a:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
  .msg{font-size:13px;padding:10px 12px;border-radius:8px;margin-top:12px;display:none}
  .msg.err{display:block;background:rgba(240,96,58,.1);border:1px solid rgba(240,96,58,.4);color:#ffb4a2}
  .msg.ok{display:block;background:rgba(55,224,95,.08);border:1px solid rgba(55,224,95,.35);color:#a8f0c0}
  .hidden{display:none!important}
  .codeout{font-family:var(--mono);font-size:17px;letter-spacing:.06em;background:var(--panel2);
       border:1px dashed var(--line2);border-radius:8px;padding:12px;margin-top:8px;display:flex;
       align-items:center;justify-content:space-between;gap:10px}
  .codeout .c{color:var(--amber)}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}
  th,td{text-align:left;padding:9px 8px;border-bottom:1px solid var(--line)}
  th{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);font-weight:600}
  td .code{font-family:var(--mono);color:var(--ink)}
  .pill{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:2px 7px;border-radius:20px;border:1px solid var(--line2);color:var(--mut)}
  .pill.on{color:var(--green);border-color:rgba(55,224,95,.4)}
  .pill.off{color:var(--dim)}
  .qr{background:#fff;border-radius:10px;padding:14px;width:190px;margin:8px auto 4px;display:block}
  .hint{font-size:12px;color:var(--dim);margin-top:8px}
  .foot{color:var(--dim);font-size:11.5px;font-family:var(--mono);letter-spacing:.06em;margin-top:26px;text-align:center}
</style></head>
<body><div class="wrap">
  <div class="brandrow"><span class="dot"></span><span class="brand">Pro Audio · Admin</span></div>
  <h1>Access Codes</h1>
  <p class="sub">Generate and manage membership codes. Every action is verified on the server.</p>

  <!-- Sign in -->
  <div class="card" id="signinCard">
    <h2>Sign in</h2>
    <div class="field"><label for="email">Email</label><input id="email" type="email" autocomplete="username"></div>
    <div class="field"><label for="password">Password</label><input id="password" type="password" autocomplete="current-password"></div>
    <button id="signinBtn">Sign in</button>
    <div class="msg" id="signinMsg"></div>
  </div>

  <!-- Two-factor -->
  <div class="card hidden" id="mfaCard">
    <h2>Two-factor</h2>
    <div id="enrollBox" class="hidden">
      <p class="sub" style="margin-bottom:8px">Scan this with your authenticator app (first time only), then enter the 6-digit code.</p>
      <div id="qr"></div>
      <p class="hint" id="secretText"></p>
    </div>
    <div class="field"><label for="totp">6-digit code</label><input id="totp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456"></div>
    <button id="verifyBtn">Verify</button>
    <div class="msg" id="mfaMsg"></div>
  </div>

  <!-- Console -->
  <div class="hidden" id="console">
    <div class="card">
      <h2>Passphrase</h2>
      <div class="field"><label for="pass">Required for every action this session</label><input id="pass" type="password" autocomplete="off"></div>
      <p class="hint">Kept only in this tab, never stored. Re-enter if you reload.</p>
    </div>

    <div class="card">
      <h2>Generate</h2>
      <div class="row">
        <div class="field"><label for="plan">Plan</label>
          <select id="plan"><option value="lifetime">Lifetime</option><option value="year">1 year</option><option value="month">1 month</option></select></div>
        <div class="field"><label for="count">How many codes</label><input id="count" type="number" min="1" max="500" value="1"></div>
        <div class="field"><label for="seats">Seats per code</label><input id="seats" type="number" min="1" value="1"></div>
      </div>
      <div class="field"><label for="label">Label (for your reference)</label><input id="label" type="text" placeholder="e.g. Acme Corp — 25 seats"></div>
      <button id="mintBtn">Generate</button>
      <div class="msg" id="mintMsg"></div>
      <div id="mintResults"></div>
    </div>

    <div class="card">
      <h2>All codes</h2>
      <button class="ghost mini" id="refreshBtn">Refresh</button>
      <div id="listWrap"><p class="hint">Tap Refresh to load.</p></div>
    </div>
  </div>

  <p class="foot">Locked · server-verified · unlisted</p>
</div>

<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
const URL_ = "%%URL%%", ANON = "%%ANON%%";
const FN = URL_ + "/functions/v1/admin-codes";
const sb = window.supabase.createClient(URL_, ANON, { auth: { persistSession: true, autoRefreshToken: true } });
const $ = (id) => document.getElementById(id);
const show = (el, on) => el.classList.toggle("hidden", !on);
function msg(el, text, kind){ el.textContent = text; el.className = "msg " + (kind || "err"); if(!text) el.style.display="none"; }
let enrollFactorId = null;

async function currentAAL(){
  const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  return data || { currentLevel: null, nextLevel: null };
}
async function factors(){
  const { data } = await sb.auth.mfa.listFactors();
  return (data && data.totp) || [];
}

async function gateAfterAuth(){
  const aal = await currentAAL();
  if (aal.currentLevel === "aal2"){ show($("signinCard"), false); show($("mfaCard"), false); show($("console"), true); return; }
  // need 2FA: enroll if no verified factor, else challenge
  show($("signinCard"), false); show($("mfaCard"), true);
  const fs = await factors();
  const verified = fs.find((f) => f.status === "verified");
  if (verified){ enrollFactorId = verified.id; show($("enrollBox"), false); }
  else {
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "admin-" + Date.now() });
    if (error){ msg($("mfaMsg"), error.message); return; }
    enrollFactorId = data.id;
    $("qr").innerHTML = '<img class="qr" alt="Authenticator QR" src="' + data.totp.qr_code + '">';
    $("secretText").textContent = "Or enter this key manually: " + data.totp.secret;
    show($("enrollBox"), true);
  }
}

$("signinBtn").onclick = async () => {
  msg($("signinMsg"), "");
  $("signinBtn").disabled = true;
  try{
    const { error } = await sb.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value });
    if (error){ msg($("signinMsg"), error.message); return; }
    await gateAfterAuth();
  } finally { $("signinBtn").disabled = false; }
};

$("verifyBtn").onclick = async () => {
  msg($("mfaMsg"), "");
  const code = $("totp").value.trim();
  if (!/^[0-9]{6}$/.test(code)){ msg($("mfaMsg"), "Enter the 6-digit code."); return; }
  $("verifyBtn").disabled = true;
  try{
    const ch = await sb.auth.mfa.challenge({ factorId: enrollFactorId });
    if (ch.error){ msg($("mfaMsg"), ch.error.message); return; }
    const vr = await sb.auth.mfa.verify({ factorId: enrollFactorId, challengeId: ch.data.id, code });
    if (vr.error){ msg($("mfaMsg"), vr.error.message); return; }
    await gateAfterAuth();
  } finally { $("verifyBtn").disabled = false; }
};

async function call(action, extra){
  const { data: s } = await sb.auth.getSession();
  const token = s.session && s.session.access_token;
  if (!token) throw new Error("Session expired — sign in again.");
  const res = await fetch(FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify(Object.assign({ action, passphrase: $("pass").value }, extra || {})),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error){
    const map = { need_2fa:"Two-factor not completed.", not_admin:"This account is not an admin.",
      bad_passphrase:"Wrong passphrase.", blocked_location:"Blocked: this network isn't allowed.",
      not_authenticated:"Sign in again." };
    throw new Error(map[body.error] || body.detail || body.error || ("HTTP " + res.status));
  }
  return body;
}

$("mintBtn").onclick = async () => {
  msg($("mintMsg"), ""); $("mintResults").innerHTML = "";
  if (!$("pass").value){ msg($("mintMsg"), "Enter your passphrase first."); return; }
  $("mintBtn").disabled = true;
  try{
    const body = await call("mint", {
      plan: $("plan").value,
      count: Math.max(1, parseInt($("count").value || "1", 10)),
      maxUses: Math.max(1, parseInt($("seats").value || "1", 10)),
      note: $("label").value.trim(),
    });
    const codes = (body.codes || []).map((r) => r.code);
    msg($("mintMsg"), codes.length + " code" + (codes.length===1?"":"s") + " created.", "ok");
    $("mintResults").innerHTML = codes.map((c) =>
      '<div class="codeout"><span class="c">' + c + '</span><button class="ghost mini" onclick="navigator.clipboard&&navigator.clipboard.writeText(\'' + c + '\')">Copy</button></div>'
    ).join("");
  } catch(e){ msg($("mintMsg"), e.message); }
  finally { $("mintBtn").disabled = false; }
};

$("refreshBtn").onclick = async () => {
  if (!$("pass").value){ $("listWrap").innerHTML = '<p class="hint">Enter your passphrase first.</p>'; return; }
  $("refreshBtn").disabled = true;
  try{
    const body = await call("list");
    const rows = body.rows || [];
    if (!rows.length){ $("listWrap").innerHTML = '<p class="hint">No codes yet.</p>'; return; }
    const plan = (d) => d===null?"lifetime":(d===365?"year":(d===30?"month":d+"d"));
    $("listWrap").innerHTML = '<table><thead><tr><th>Code</th><th>Plan</th><th>Used</th><th>Note</th><th>Status</th><th></th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td class="code">' + r.code + '</td><td>' + plan(r.grant_days) + '</td><td>' +
        r.used_count + " / " + r.max_uses + '</td><td>' + (r.note ? String(r.note).replace(/</g,"&lt;") : "—") + '</td><td>' +
        (r.active ? '<span class="pill on">active</span>' : '<span class="pill off">off</span>') + '</td><td>' +
        '<button class="ghost mini" data-code="' + r.code + '" data-act="' + (r.active?"deactivate":"reactivate") + '">' + (r.active?"Disable":"Enable") + '</button></td></tr>').join("") +
      '</tbody></table>';
    $("listWrap").querySelectorAll("button[data-code]").forEach((b) => b.onclick = async () => {
      b.disabled = true;
      try { await call(b.dataset.act, { code: b.dataset.code }); await $("refreshBtn").onclick(); }
      catch(e){ alert(e.message); b.disabled = false; }
    });
  } catch(e){ $("listWrap").innerHTML = '<p class="msg err" style="display:block">' + e.message + '</p>'; }
  finally { $("refreshBtn").disabled = false; }
};

// If a session is already active (returning tab), skip straight to the gate.
(async () => { const { data } = await sb.auth.getSession(); if (data.session) await gateAfterAuth(); })();
</script>
</body></html>`;
