import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gateActive, GATE_COOKIE, GATE_TOKEN } from "@/lib/gate";
import { isConnectPath } from "@/lib/connect";

/* ============================================================
 *  SITE GATE — a key is required to view the site.
 *  Settings (on/off + the key) live in  web/lib/gate.ts
 *
 *  On your own computer (npm run dev) the gate is OFF so you can
 *  keep working. It only applies to the LIVE site.
 * ============================================================ */

function gateHtml(error: boolean): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Pro Audio Training Academy</title>
<style>
  :root {
    --bg:#0c0c0c; --surface:#151515; --border:#2a2a2e;
    --amber:#ffc64d; --amber-deep:#ffb400;
    --fg:#f0f0f0; --sub:#a6a6ad; --muted:#8a8b93; --red:#ff4b3a;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { height:100%; }
  body {
    background: radial-gradient(1000px 500px at 50% -10%, rgba(255,198,77,0.08), transparent 60%), var(--bg);
    color:var(--fg);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
    display:flex; align-items:center; justify-content:center;
    min-height:100%; padding:2rem 1.25rem; text-align:center;
  }
  .wrap { width:100%; max-width:22rem; }
  .logo { width:96px; height:auto; margin:0 auto 1.5rem; display:block; }
  .name {
    font-size:0.8rem; letter-spacing:0.22em; text-transform:uppercase;
    font-weight:600; color:var(--sub); margin-bottom:1.75rem;
  }
  form { display:flex; flex-direction:column; gap:0.75rem; }
  input[type=password] {
    width:100%; padding:0.85rem 1rem; font-size:1rem;
    background:var(--surface); color:var(--fg);
    border:1px solid var(--border); border-radius:10px; outline:none;
    text-align:center; letter-spacing:0.05em;
  }
  input[type=password]:focus { border-color:var(--amber); }
  input[type=password]::placeholder { color:var(--muted); letter-spacing:0.15em; }
  button {
    width:100%; padding:0.85rem 1rem; font-size:0.95rem; font-weight:700;
    background:var(--amber); color:#0c0c0c; border:0; border-radius:10px;
    cursor:pointer; transition:background .15s;
  }
  button:hover { background:var(--amber-deep); }
  .err { color:var(--red); font-size:0.85rem; min-height:1.1em; margin-top:0.25rem; }
</style>
</head>
<body>
  <main class="wrap">
    <img class="logo" src="/logo-hero.png" alt="Pro Audio Training Academy" />
    <div class="name">Pro Audio Training Academy</div>
    <form method="POST" action="/api/unlock" autocomplete="off">
      <input type="password" name="key" placeholder="Enter key" autofocus aria-label="Access key" />
      <button type="submit">Enter</button>
      <div class="err">${error ? "Incorrect key. Try again." : ""}</div>
    </form>
  </main>
</body>
</html>`;
}

/* ============================================================
 *  TEMPORARY PUBLIC HOME PAGE (owner 2026-10-02)
 *  While the gate is on, a visitor WITHOUT the key sees this page at "/"
 *  instead of the bare key screen: launch date + the public legal links,
 *  so App Review and the public can reach the site. Every other path is
 *  still gated. The early-access key box posts to /api/unlock as before.
 *  Remove this (or turn the gate off) at launch.
 * ============================================================ */
function comingSoonHtml(error: boolean): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pro Audio Training Academy — Launching Monday, October 12</title>
<meta name="description" content="Pro Audio Training Academy launches Monday, October 12, 2026. Learn the Craft. Earn the Credential." />
<style>
  :root {
    --bg:#0c0c0c; --surface:#151515; --border:#2a2a2e;
    --amber:#ffc64d; --amber-deep:#ffb400;
    --fg:#f0f0f0; --sub:#a6a6ad; --muted:#8a8b93; --red:#ff4b3a;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  html, body { min-height:100%; }
  body {
    background: radial-gradient(1000px 500px at 50% -10%, rgba(255,198,77,0.10), transparent 60%), var(--bg);
    color:var(--fg);
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
    display:flex; align-items:center; justify-content:center;
    padding:3rem 1.25rem; text-align:center;
  }
  .wrap { width:100%; max-width:34rem; }
  .logo { width:110px; height:auto; margin:0 auto 1.5rem; display:block; }
  .name { font-size:0.8rem; letter-spacing:0.22em; text-transform:uppercase; font-weight:600; color:var(--sub); margin-bottom:2rem; }
  h1 { font-size:clamp(1.7rem, 5vw, 2.4rem); line-height:1.15; font-weight:800; margin-bottom:0.75rem; }
  .date { color:var(--amber); }
  .tag { color:var(--sub); font-size:1.05rem; margin-bottom:2.25rem; }
  nav ul { list-style:none; display:flex; flex-wrap:wrap; justify-content:center; gap:0.6rem; margin-bottom:1.75rem; }
  nav a { display:inline-block; padding:0.6rem 1rem; border:1px solid var(--border); border-radius:10px; background:var(--surface); color:var(--fg); text-decoration:none; font-size:0.95rem; }
  nav a:hover, nav a:focus-visible { border-color:var(--amber); color:var(--amber); outline:none; }
  .contact { color:var(--sub); font-size:0.95rem; margin-bottom:2.75rem; }
  .contact a { color:var(--amber); }
  details { border-top:1px solid var(--border); padding-top:1.25rem; max-width:20rem; margin:0 auto; }
  summary { cursor:pointer; color:var(--muted); font-size:0.85rem; }
  form { display:flex; flex-direction:column; gap:0.6rem; margin-top:0.9rem; }
  input[type=password] { width:100%; padding:0.75rem 1rem; font-size:1rem; background:var(--surface); color:var(--fg); border:1px solid var(--border); border-radius:10px; outline:none; text-align:center; }
  input[type=password]:focus { border-color:var(--amber); }
  button { width:100%; padding:0.75rem 1rem; font-size:0.95rem; font-weight:700; background:var(--amber); color:#0c0c0c; border:0; border-radius:10px; cursor:pointer; }
  button:hover { background:var(--amber-deep); }
  .err { color:var(--red); font-size:0.85rem; min-height:1.1em; }
  footer { margin-top:2.5rem; color:var(--muted); font-size:0.8rem; }
</style>
</head>
<body>
  <main class="wrap">
    <img class="logo" src="/logo-hero.png" alt="Pro Audio Training Academy" />
    <div class="name">Pro Audio Training Academy</div>
    <h1>Launching <span class="date">Monday, October&nbsp;12</span></h1>
    <p class="tag">Learn the Craft. Earn the Credential.</p>
    <nav aria-label="Legal and support">
      <ul>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="/support">Support</a></li>
        <li><a href="/accessibility">Accessibility</a></li>
      </ul>
    </nav>
    <p class="contact">Questions? <a href="mailto:info@proaudiotrainingacademy.com">info@proaudiotrainingacademy.com</a></p>
    <details${error ? " open" : ""}>
      <summary>Early access</summary>
      <form method="POST" action="/api/unlock" autocomplete="off">
        <input type="password" name="key" placeholder="Enter key" aria-label="Access key" />
        <button type="submit">Enter</button>
        <div class="err">${error ? "Incorrect key. Try again." : ""}</div>
      </form>
    </details>
    <footer>&copy; 2026 Pro Audio Training Academy LLC</footer>
  </main>
</body>
</html>`;
}

/* ============================================================
 *  DOMAIN CANONICALIZATION (owner 2026-08-30)
 *  The .co is a secondary/typo domain: it must 308 to the real
 *  site, never serve a duplicate copy of it. Handled HERE (in
 *  code, versioned, testable) rather than as a dashboard setting
 *  — and it runs BEFORE the gate so the redirect works whether
 *  the site is gated or public.
 * ============================================================ */
const CANONICAL_HOST = "www.proaudiotrainingacademy.com";
const REDIRECT_HOSTS = new Set([
  "proaudiotrainingacademy.co",
  "www.proaudiotrainingacademy.co",
  "proaudiotrainingacademy.online",
  "www.proaudiotrainingacademy.online",
]);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (REDIRECT_HOSTS.has(host)) {
    const target = new URL(request.nextUrl.toString());
    target.protocol = "https:";
    target.host = CANONICAL_HOST;
    target.port = "";
    return NextResponse.redirect(target, 308);
  }

  // App-link verification files (owner 2026-10-04): Apple and Google fetch
  // these with no cookie and do not follow redirects, so they must answer 200
  // even while the site is gated. They hold only public identifiers.
  if (request.nextUrl.pathname.startsWith("/.well-known/")) return NextResponse.next();

  // Gate turned off (launch), or inside a temporary unlock window -> public.
  // Evaluated per request so the window can expire on a warm instance.
  if (!gateActive()) return NextResponse.next();

  // Local dev on your computer -> always show the real site.
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Let the key-check handler run.
  if (pathname.startsWith("/api/unlock")) return NextResponse.next();

  // Card-invitation page: reachable while the rest of the site is gated.
  // Does not set the gate cookie — /connect is not a site-wide unlock.
  if (isConnectPath(pathname)) return NextResponse.next();

  // Store-required legal / compliance pages: publicly reachable while the rest
  // of the site stays GATED. App stores (Google Data safety, Apple App Privacy)
  // require the privacy policy and an account-deletion page to be public. This
  // is EXACT-MATCH only, and it sets NO gate cookie, so it is not a site-wide
  // unlock — every other path still shows the key screen.
  {
    const legalPublic = pathname.replace(/\/+$/, "") || "/";
    if (
      legalPublic === "/privacy" ||
      legalPublic === "/terms" ||
      legalPublic === "/support" ||
      legalPublic === "/accessibility"
    ) {
      return NextResponse.next();
    }
  }

  // Already unlocked with a valid cookie -> show the site.
  if (request.cookies.get(GATE_COOKIE)?.value === GATE_TOKEN) {
    return NextResponse.next();
  }

  const error = request.nextUrl.searchParams.get("e") === "1";

  // Home page without the key -> the temporary public launch page (200).
  if (pathname === "/") {
    return new NextResponse(comingSoonHtml(error), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  // Otherwise show ONLY the key screen.
  return new NextResponse(gateHtml(error), {
    status: 401,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const config = {
  // Run on all routes EXCEPT Next internals and static asset files
  // (so the logo and fonts still load on the key screen).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|mp4|woff|woff2|ttf)$).*)",
  ],
};
