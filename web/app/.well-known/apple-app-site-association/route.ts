// iOS Universal Links (owner ruling 2026-10-04: deep links ship in iOS 34).
// Apple fetches this from https://www.proaudiotrainingacademy.com/.well-known/apple-app-site-association
// with NO redirects and expects JSON. web/proxy.ts lets /.well-known/* past the gate.
// The paths mirror the Android intentFilters in app.json (keep the two in step).
// Team ID XAQQN594RH: if Apple's LLC migration ever changes it, edit APP_ID here — no app build needed.
const APP_ID = "XAQQN594RH.com.cbcreativeservices.apestudio";
const PREFIXES = ["get", "topics", "tools", "learn", "labs", "glossary", "awards", "directory", "careers"];

const body = {
  applinks: {
    details: [
      {
        appIDs: [APP_ID],
        components: PREFIXES.flatMap((p) => [{ "/": `/${p}` }, { "/": `/${p}/*` }]),
      },
    ],
  },
};

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" },
  });
}
