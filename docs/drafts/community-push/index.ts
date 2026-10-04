// ⛔ DRAFT — NOT DEPLOYED. For Comp A (owner decision 2026-10-04).
// Copy to supabase/functions/community-push/index.ts, then deploy.
// Needs migration supabase/migrations/2026100401_community_notifications.sql.
// Walkthrough: docs/APE_COMMUNITY_NOTIFICATIONS_SERVER_DRAFT_2026_10_04.md
//
// AP&E — alerts between members (messages, contact requests).
// Triggered by pg_cron every minute via net.http_post with
// `Authorization: Bearer <service role>` (the on-weekly-concept pattern).
//
// Every rule about WHO may be alerted lives in SQL (community_push_due):
// opt-in, per-type choice, blocks both ways, restricted accounts, thread still
// open, rate limits. This function only words and delivers what that returns.
//
// PRIVACY: the alert says the sender's display name and "sent you a message"
// (or "asked to contact you"). Message text is included ONLY when the
// recipient switched "Show message text" on — community_push_due returns
// `preview` null otherwise, and this function never reads a message body.
// The words mirror src/features/notifications/communityRules.ts PUSH_TEXT
// (test/userNotifications_20261004.test.ts holds them together).
import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHANNEL_ID = "community"; // communityRules.COMMUNITY_CHANNEL_ID

const PUSH_TEXT = {
  messageBody: "sent you a message",
  requestBody: "asked to contact you",
  messagesBody: (n: number) => `sent you ${n} messages`,
};

type Due = {
  recipient: string;
  request_id: string;
  kind: "message" | "request";
  sender_name: string;
  n: number;
  preview: string | null;
  show_preview: boolean;
  tokens: string[];
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Title + body for one alert. Never message text unless opted in. */
export function alertText(d: Due): { title: string; body: string } {
  const who = (d.sender_name || "A member").slice(0, 60);
  if (d.kind === "request") return { title: who, body: PUSH_TEXT.requestBody };
  if (d.show_preview && d.preview && d.n === 1) return { title: who, body: d.preview };
  return { title: who, body: d.n > 1 ? PUSH_TEXT.messagesBody(d.n) : PUSH_TEXT.messageBody };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!service || !url) return json({ error: "misconfigured" }, 500);
  if ((req.headers.get("Authorization") ?? "") !== `Bearer ${service}`) {
    return json({ error: "unauthorized" }, 401);
  }
  const db = createClient(url, service, { auth: { persistSession: false } });

  const { data, error } = await db.rpc("community_push_due");
  if (error) return json({ error: "due_failed", detail: error.message }, 500);
  const due = (data ?? []) as Due[];

  let sent = 0;
  let forgotten = 0;
  for (const d of due) {
    const tokens = (d.tokens ?? []).filter(Boolean);
    if (!tokens.length) continue;
    const { title, body } = alertText(d);
    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      sound: "default",
      channelId: CHANNEL_ID,
      // iOS groups a conversation's alerts; a newer one replaces the older
      // on Android (collapse) — batching on the phone as well as here.
      threadId: d.request_id,
      collapseId: d.request_id,
      priority: "high",
      // What the app needs to open the conversation. No content, no names.
      data: { type: "community", kind: d.kind, requestId: d.request_id },
    }));

    let tickets: { status: string; details?: { error?: string } }[] = [];
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      const out = await res.json().catch(() => ({}));
      tickets = Array.isArray(out?.data) ? out.data : [];
    } catch {
      continue; // Expo unreachable: the badge still counts it; nothing retried
    }

    // A phone that uninstalled the app (or turned alerts off in the OS) is
    // forgotten, so we stop sending to it.
    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i]?.details?.error === "DeviceNotRegistered") {
        await db.rpc("push_device_forget_token", { p_token: tokens[i] });
        forgotten++;
      }
    }
    const ok = tickets.filter((t) => t?.status === "ok").length;
    await db.rpc("community_push_record", {
      p_recipient: d.recipient,
      p_request_id: d.request_id,
      p_kind: d.kind,
      p_devices: ok,
    });
    if (ok) sent++;
  }
  return json({ due: due.length, sent, forgotten });
});
