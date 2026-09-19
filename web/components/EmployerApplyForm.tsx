"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

/**
 * The employer application.
 *
 * ── THE TWO-STEP THE OWNER ASKED FOR ───────────────────────────────────────
 *
 * "employers must set up an account AND download the app." So this form is
 * sign-in gated: there is nothing to apply *as* without an account, and the
 * approved employer does their actual contacting in the app. The page says so
 * before the fields rather than after the submit.
 *
 * ── WHY THE FIELDS ARE THESE FIELDS ────────────────────────────────────────
 *
 * Each one is a verification signal, not a form for its own sake:
 *   company website + work email  →  the strongest cheap check we have, that
 *                                    the address is AT the company's domain
 *   role                          →  a person, not a mailbox
 *   hiring for                    →  what the reviewer reads when the
 *                                    automated checks come back ambiguous
 *
 * Nothing here is decided in the browser. The database computes the
 * string-derived checks itself and the decision is made server-side, so a
 * hand-crafted POST cannot arrive pre-approved.
 */

type Status = "idle" | "working" | "code" | "approved" | "queued" | "error";

export default function EmployerApplyForm() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [hiringFor, setHiringFor] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  /** Set once the code is on its way, so step two knows which application. */
  const [appId, setAppId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string>("");
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);

  useEffect(() => {
    let alive = true;
    void getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => {
        if (alive) setSignedIn(!!data.session);
      })
      .catch(() => {
        if (alive) setSignedIn(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("working");

    try {
      const sb = getSupabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setSignedIn(false);
        setStatus("idle");
        return;
      }

      // 1 · the database records it and computes every check it can derive
      //     itself. Deliberately not passed from here.
      const { data: newId, error: applyErr } = await sb.rpc("employer_apply", {
        p_company_name: company,
        p_company_website: website,
        p_work_email: email,
        p_role_title: role,
        p_hiring_for: hiringFor || null,
      });
      if (applyErr) {
        setError(applyErr.message);
        setStatus("error");
        return;
      }

      // 2 · the server looks the company up and mails a confirmation code.
      //
      // The domain is NOT sent from here any more. This normalisation was not
      // the same algorithm as employer_domain_of (which strips whitespace
      // globally), so a pasted "acme.com " created the application and then
      // failed the route — and a body-supplied host was an SSRF vector. The
      // route now reads the server-computed domain off the application.

      const res = await fetch("/api/employers/apply", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: newId }),
      });
      const out = (await res.json()) as { ok?: boolean; error?: string; sent_to?: string };

      setAppId(String(newId));

      // ── STEP TWO IS THE ONE THAT COUNTS ─────────────────────────────────
      // Nothing is decided here any more. Everything else on this form is
      // something an impostor could type; holding the work mailbox is not,
      // so the application waits on the code.
      if (out?.ok) {
        setSentTo(String(out.sent_to ?? email));
        setStatus("code");
        return;
      }

      // The application IS SAVED either way — employer_apply already
      // succeeded. If the code could not be sent, say exactly that rather
      // than implying the application was lost or that it is being reviewed.
      setError(
        out?.error === "mail_unavailable" || out?.error === "mail_failed"
          ? "Your application was saved, but we could not send the confirmation email just now. Open “View status” shortly and request a new code."
          : "Your application was saved, but we could not finish checking it automatically. A person will review it.",
      );
      setStatus("queued");
    } catch {
      setError("Something went wrong sending your application. Try again.");
      setStatus("error");
    }
  }

  /** Step two: prove possession of the work mailbox. */
  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    if (!appId) return;
    setError(null);
    setStatus("working");
    try {
      const sb = getSupabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setSignedIn(false);
        setStatus("code");
        return;
      }
      const { data, error: fnErr } = await sb.functions.invoke("employer-confirm-email", {
        body: { application_id: appId, code },
      });
      const out = (data ?? {}) as { ok?: boolean; outcome?: string; error?: string };
      if (fnErr || !out.ok) {
        // The database writes these messages for a human ("that code is not
        // right", "that code has expired — request a new one"), so show them
        // rather than flattening every failure into one unhelpful line.
        setError(out.error ?? "That did not work. Check the code and try again.");
        setStatus("code");
        return;
      }
      setStatus(out.outcome === "approved" ? "approved" : "queued");
    } catch {
      setError("Something went wrong confirming the code. Try again.");
      setStatus("code");
    }
  }

  /** A code that never arrived is the most likely way this stalls. */
  async function onResend() {
    if (!appId) return;
    setError(null);
    setResent(false);
    try {
      const sb = getSupabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/employers/apply", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId }),
      });
      const out = (await res.json()) as { ok?: boolean };
      if (out?.ok) setResent(true);
      else setError("We could not send another code just now. Try again in a moment.");
    } catch {
      setError("We could not send another code just now. Try again in a moment.");
    }
  }

  if (signedIn === null) {
    return <p className="mt-6 text-sm text-text-muted">Checking your account…</p>;
  }

  if (!signedIn) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
          You need an account first
        </p>
        <p className="mt-2 text-sm text-text-muted">
          Employer verification is tied to an Academy account, and contacting members happens in
          the app. Create your account in the app, then come back here and sign in to apply.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/login"
            className="rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background hover:bg-amber-deep"
          >
            Sign in
          </a>
          <a
            href="/get"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-amber"
          >
            Get the app
          </a>
        </div>
      </div>
    );
  }

  if (status === "code" || (status === "working" && appId)) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
          Check your work email
        </p>
        <p className="mt-2 text-sm text-text-muted">
          We sent a six-digit code to <b className="text-foreground">{sentTo}</b>. Enter it below to
          confirm you hold that mailbox. It expires in 30 minutes.
        </p>
        <p className="mt-2 text-sm text-text-muted">
          This is the step that verifies you: everything else on the form is something anyone could
          type.
        </p>

        {error ? (
          <p role="alert" className="mt-4 rounded-md border border-amber/50 bg-amber/10 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
        {resent ? (
          <p role="status" className="mt-4 rounded-md border border-border px-4 py-3 text-sm text-text-muted">
            A new code is on its way. The previous one no longer works.
          </p>
        ) : null}

        <form onSubmit={onConfirm} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="code" className="text-sm font-semibold text-foreground">
              Confirmation code
            </label>
            <input
              id="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="mt-1 w-full rounded-md border border-border bg-surface px-4 py-3 text-2xl tracking-[0.4em] text-foreground placeholder:text-text-muted focus:border-amber"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={code.length !== 6 || status === "working"}
              className="rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background hover:bg-amber-deep disabled:opacity-50"
            >
              {status === "working" ? "Confirming…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={onResend}
              className="text-sm font-semibold text-text-muted underline hover:text-foreground"
            >
              Send another code
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-text-muted">
          Wrong address? Your application is saved — open{" "}
          <a href="/employers/account" className="underline">
            your status page
          </a>{" "}
          to see it.
        </p>
      </div>
    );
  }

  if (status === "approved" || status === "queued") {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
          {status === "approved" ? "You are verified" : "Application received"}
        </p>
        <p className="mt-2 text-sm text-text-muted">
          {status === "approved"
            ? "You confirmed your work address, it is at your company's own domain, and the site checks out — so your employer account is active. Open the app to set what you are looking for and to contact members."
            : "We could not confirm every detail automatically, so a person will look at it. You will hear back by email. Nothing more is needed from you."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/get"
            className="rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background hover:bg-amber-deep"
          >
            Get the app
          </a>
          <a
            href="/employers/account"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-amber"
          >
            View status
          </a>
        </div>
      </div>
    );
  }

  const field =
    "w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted focus:border-amber";

  return (
    <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      {error ? (
        <p role="alert" className="rounded-md border border-amber/50 bg-amber/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="company" className="text-sm font-semibold text-foreground">
          Company name
        </label>
        <input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} className={`mt-1 ${field}`} />
      </div>

      <div>
        <label htmlFor="website" className="text-sm font-semibold text-foreground">
          Company website
        </label>
        <input
          id="website"
          required
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="acme.com"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          className={`mt-1 ${field}`}
        />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          Your work email
        </label>
        <input
          id="email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@acme.com"
          autoCapitalize="none"
          spellCheck={false}
          className={`mt-1 ${field}`}
        />
        {/* Said plainly, because it is the difference between instant and a
            wait — and because a free address is not a refusal. */}
        <p className="mt-1 text-xs text-text-muted">
          An address at your company&rsquo;s own domain verifies instantly. A Gmail or Outlook
          address is fine too — it just means a person reviews it first.
        </p>
      </div>

      <div>
        <label htmlFor="role" className="text-sm font-semibold text-foreground">
          Your role
        </label>
        <input id="role" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="Studio Manager" className={`mt-1 ${field}`} />
      </div>

      <div>
        <label htmlFor="hiring" className="text-sm font-semibold text-foreground">
          What are you looking for? <span className="font-normal text-text-muted">(optional)</span>
        </label>
        <textarea id="hiring" rows={3} value={hiringFor} onChange={(e) => setHiringFor(e.target.value)} className={`mt-1 ${field}`} />
      </div>

      <button
        type="submit"
        disabled={status === "working"}
        className="self-start rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep disabled:opacity-60"
      >
        {status === "working" ? "Sending…" : "Apply for an employer account"}
      </button>
    </form>
  );
}
