// supabase/functions/on-weekly-concept/index.ts
// AP&E — Weekly Concept Push Notification
// Triggered by pg_cron every 15 minutes via net.http_post
// Spec: APE_NOTIFICATIONS_WEEKLY_CONCEPT_SPEC_2026_08_27.md
//
// Cron (when Booth activates it) POSTs with Authorization: Bearer <service role>.
// Do not run the cron until concept sequence is reviewed.
import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

type DueSub = { user_id: string; category: string };

type Concept = {
  id: number;
  category: string;
  subdomain: string;
  concept: string;
  what_it_is: string;
  misconception: string;
  correction: string;
  why_it_matters: string;
  confidence: string;
};

function asOne<T>(raw: T | T[] | null): T | null {
  if (raw == null) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!service || !url) return json({ error: "misconfigured" }, 500);

  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${service}`) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(url, service);
  const now = new Date();

  // 1. Subscriptions due in ±7 minutes (user TZ), not yet fired today.
  const { data: subRows, error: subErr } = await supabase.rpc(
    "get_due_concept_subscriptions",
    { check_time: now.toISOString() },
  );

  if (subErr) {
    console.error("get_due_concept_subscriptions error:", subErr);
    return json({ error: subErr.message }, 500);
  }

  const subscriptions = (subRows ?? []) as DueSub[];
  if (!subscriptions.length) {
    return json({ sent: 0, message: "no subscriptions due" });
  }

  const pushResults: Array<{
    user_id: string;
    category: string;
    concept_id: number;
    status: string;
  }> = [];

  for (const sub of subscriptions) {
    // 2. Push preferences
    const { data: prefs, error: prefsErr } = await supabase
      .from("notification_preferences")
      .select("expo_push_token, push_enabled, notify_weekly_concept")
      .eq("user_id", sub.user_id)
      .maybeSingle();

    if (prefsErr || !prefs) {
      console.warn(`No prefs found for user ${sub.user_id}`);
      continue;
    }

    if (!prefs.push_enabled || !prefs.notify_weekly_concept || !prefs.expo_push_token) {
      continue;
    }

    // 3. Next undelivered concept (lowest id; cycle resets when exhausted)
    const { data: conceptRaw, error: conceptErr } = await supabase.rpc(
      "get_next_concept",
      {
        p_user_id: sub.user_id,
        p_category: sub.category,
      },
    );

    const nextConcept = asOne<Concept>(conceptRaw);
    if (conceptErr || !nextConcept?.id) {
      console.warn(
        `No concept found for user ${sub.user_id}, category ${sub.category}`,
        conceptErr,
      );
      continue;
    }

    // 4. Pending delivery BEFORE send (idempotency)
    const { data: delivery, error: deliveryErr } = await supabase
      .from("notification_concept_deliveries")
      .insert({
        user_id: sub.user_id,
        concept_id: nextConcept.id,
        category: sub.category,
        scheduled_at: now.toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (deliveryErr || !delivery) {
      console.error(`Failed to insert delivery record for user ${sub.user_id}:`, deliveryErr);
      continue;
    }

    // 5. Expo push — teaser is the misconception; full card is in data for the app.
    const pushPayload = {
      to: prefs.expo_push_token as string,
      title: nextConcept.concept,
      body: String(nextConcept.misconception ?? "").slice(0, 180),
      data: {
        type: "weekly_concept",
        concept_id: nextConcept.id,
        category: nextConcept.category,
        subdomain: nextConcept.subdomain,
        concept: nextConcept.concept,
        what_it_is: nextConcept.what_it_is,
        misconception: nextConcept.misconception,
        correction: nextConcept.correction,
        why_it_matters: nextConcept.why_it_matters,
        confidence: nextConcept.confidence,
      },
      sound: "default",
      priority: "normal",
    };

    let expoStatus = "failed";
    let ticket: string | null = null;

    try {
      const expoResp = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(pushPayload),
      });
      const expoJson = await expoResp.json();
      const ticketData = Array.isArray(expoJson?.data) ? expoJson.data[0] : expoJson?.data;
      ticket = ticketData?.id ?? null;
      expoStatus = ticketData?.status === "ok" ? "delivered" : "failed";
    } catch (fetchErr) {
      console.error(`Expo push failed for user ${sub.user_id}:`, fetchErr);
    }

    // 6. Record result
    const { error: updateErr } = await supabase
      .from("notification_concept_deliveries")
      .update({
        status: expoStatus,
        delivered_at: new Date().toISOString(),
        expo_ticket: ticket,
      })
      .eq("id", delivery.id);

    if (updateErr) {
      console.error(`Failed to update delivery record ${delivery.id}:`, updateErr);
    }

    pushResults.push({
      user_id: sub.user_id,
      category: sub.category,
      concept_id: nextConcept.id,
      status: expoStatus,
    });
  }

  return json({ sent: pushResults.length, results: pushResults });
});
