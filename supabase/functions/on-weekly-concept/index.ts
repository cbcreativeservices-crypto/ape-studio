// supabase/functions/on-weekly-concept/index.ts
// AP&E — Weekly Concept notification (push + email transports)
// Triggered by pg_cron every 15 minutes via net.http_post
// Spec: APE_NOTIFICATIONS_WEEKLY_CONCEPT_SPEC_2026_08_27.md
// Email setup: APE_EMAIL_WEEKLY_CONCEPT_2026_08_29.md
//
// Cron (when Booth activates it) POSTs with Authorization: Bearer <service role>.
// Do not run the cron until concept sequence is reviewed.
//
// Transports are independent, both gated by notify_weekly_concept:
//   push  — push_enabled + expo_push_token          (teaser; full card in data)
//   email — email_enabled + RESEND_API_KEY secret    (full card in the inbox)
// A user with neither transport is skipped. One delivery row per send records
// both outcomes (status = best of the two; email_status = the email's own).
import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const RESEND_URL = "https://api.resend.com/emails";

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

function esc(s: string): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** Single-column dark card matching the app (graphite + amber). Inline styles
 *  only — email clients strip <style> blocks. */
function conceptEmailHtml(c: Concept): string {
  const section = (title: string, body: string, accent = "#26262e") => `
    <div style="margin:0 0 14px;padding:12px 14px;background:#0f0f13;border:1px solid #26262e;border-left:3px solid ${accent};border-radius:6px;">
      <div style="font:700 11px/1.4 Arial,sans-serif;letter-spacing:1.5px;color:#ffc64d;margin-bottom:6px;">${title}</div>
      <div style="font:400 15px/1.55 Georgia,serif;color:#e8e8ec;">${esc(body)}</div>
    </div>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#08080a;">
  <div style="display:none;max-height:0;overflow:hidden;">${esc(c.misconception).slice(0, 140)}</div>
  <div style="max-width:560px;margin:0 auto;padding:28px 16px;background:#08080a;">
    <div style="font:700 11px/1.4 Arial,sans-serif;letter-spacing:2px;color:#ffc64d;margin-bottom:4px;">AP&amp;E · WEEKLY CONCEPT</div>
    <div style="font:400 12px/1.4 Arial,sans-serif;color:#8d93a3;margin-bottom:14px;">${esc(c.category)}${c.subdomain ? " · " + esc(c.subdomain) : ""}</div>
    <h1 style="font:700 24px/1.25 Georgia,serif;color:#ffffff;margin:0 0 18px;">${esc(c.concept)}</h1>
    ${section("WHAT IT IS", c.what_it_is)}
    ${section("THE MISCONCEPTION", c.misconception, "#c25b52")}
    ${section("THE CORRECTION", c.correction, "#ffc64d")}
    ${section("WHY IT MATTERS", c.why_it_matters)}
    <div style="font:400 12px/1.6 Arial,sans-serif;color:#8d93a3;margin-top:22px;border-top:1px solid #26262e;padding-top:14px;">
      You get one concept a week because Weekly concept + Email are switched on in your
      AP&amp;E app. Turn either off any time: <span style="color:#c9cbd4;">Settings → NOTIFICATIONS</span>.
      Questions? Just reply to this email.
    </div>
  </div>
</body></html>`;
}

function conceptEmailText(c: Concept): string {
  return [
    `AP&E · WEEKLY CONCEPT — ${c.category}${c.subdomain ? " · " + c.subdomain : ""}`,
    "",
    c.concept.toUpperCase(),
    "",
    `WHAT IT IS: ${c.what_it_is}`,
    "",
    `THE MISCONCEPTION: ${c.misconception}`,
    "",
    `THE CORRECTION: ${c.correction}`,
    "",
    `WHY IT MATTERS: ${c.why_it_matters}`,
    "",
    "You get one concept a week because Weekly concept + Email are on in your",
    "AP&E app (Settings → NOTIFICATIONS). Reply to this email with questions.",
  ].join("\n");
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

  // Email transport config — absent key = email path off, push unaffected.
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const emailFrom = Deno.env.get("EMAIL_FROM") ??
    "AP&E Pro Audio Training <notifications@channingbooth.com>";
  const emailReplyTo = Deno.env.get("EMAIL_REPLY_TO") ?? "info@channingbooth.com";

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
    push: string | null;
    email: string | null;
  }> = [];

  for (const sub of subscriptions) {
    // 2. Transport preferences
    const { data: prefs, error: prefsErr } = await supabase
      .from("notification_preferences")
      .select("expo_push_token, push_enabled, email_enabled, notify_weekly_concept")
      .eq("user_id", sub.user_id)
      .maybeSingle();

    if (prefsErr || !prefs) {
      console.warn(`No prefs found for user ${sub.user_id}`);
      continue;
    }
    if (!prefs.notify_weekly_concept) continue;

    const wantPush = !!(prefs.push_enabled && prefs.expo_push_token);
    const wantEmail = !!(prefs.email_enabled && resendKey);
    if (!wantPush && !wantEmail) continue;

    // Email address comes from auth (service role) — only when needed.
    let emailTo: string | null = null;
    if (wantEmail) {
      const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(
        sub.user_id,
      );
      emailTo = userData?.user?.email ?? null;
      if (userErr || !emailTo) {
        console.warn(`No auth email for user ${sub.user_id}`, userErr);
      }
    }
    if (!wantPush && !emailTo) continue;

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

    // 5a. Expo push — teaser is the misconception; full card is in data for the app.
    let expoStatus: string | null = null;
    let ticket: string | null = null;
    if (wantPush) {
      expoStatus = "failed";
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
    }

    // 5b. Email — the full concept card via Resend.
    let emailStatus: string | null = null;
    if (wantEmail && emailTo) {
      emailStatus = "failed";
      try {
        const resendResp = await fetch(RESEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [emailTo],
            reply_to: emailReplyTo,
            subject: `This week's concept: ${nextConcept.concept}`,
            html: conceptEmailHtml(nextConcept),
            text: conceptEmailText(nextConcept),
          }),
        });
        if (resendResp.ok) {
          emailStatus = "delivered";
        } else {
          console.error(
            `Resend ${resendResp.status} for user ${sub.user_id}:`,
            await resendResp.text(),
          );
        }
      } catch (mailErr) {
        console.error(`Email send failed for user ${sub.user_id}:`, mailErr);
      }
    }

    // 6. Record result — status is the best of the attempted transports.
    const overall =
      expoStatus === "delivered" || emailStatus === "delivered" ? "delivered" : "failed";
    const baseUpdate = {
      status: overall,
      delivered_at: new Date().toISOString(),
      expo_ticket: ticket,
    };
    // email_status is a 2026-08-29 column — retry without it so a not-yet-
    // migrated database still records the push outcome.
    let { error: updateErr } = await supabase
      .from("notification_concept_deliveries")
      .update({ ...baseUpdate, email_status: emailStatus })
      .eq("id", delivery.id);
    if (updateErr) {
      ({ error: updateErr } = await supabase
        .from("notification_concept_deliveries")
        .update(baseUpdate)
        .eq("id", delivery.id));
    }
    if (updateErr) {
      console.error(`Failed to update delivery record ${delivery.id}:`, updateErr);
    }

    pushResults.push({
      user_id: sub.user_id,
      category: sub.category,
      concept_id: nextConcept.id,
      status: overall,
      push: expoStatus,
      email: emailStatus,
    });
  }

  return json({ sent: pushResults.length, results: pushResults });
});
