// Android App Links verification (owner ruling 2026-10-04).
// Fingerprint = Play Console → App integrity → App signing → APP SIGNING key certificate SHA-256
// (Play re-signs every store install with this key; the upload key would NOT verify).
// web/proxy.ts lets /.well-known/* past the gate.
const body = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.cbcreativeservices.apestudio",
      sha256_cert_fingerprints: [
        "29:17:B1:EA:2E:E9:A6:EA:BC:5C:2A:EA:76:2E:43:FA:9A:45:81:DB:AD:58:28:24:3D:B7:C2:05:F7:1C:DF:B1",
      ],
    },
  },
];

export const dynamic = "force-static";

export function GET() {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" },
  });
}
