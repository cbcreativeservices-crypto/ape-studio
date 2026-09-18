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

type Status = "idle" | "working" | "approved" | "queued" | "error";

export default function EmployerApplyForm() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [hiringFor, setHiringFor] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

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
      const { data: appId, error: applyErr } = await sb.rpc("employer_apply", {
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

      // 2 · the server looks the company up and asks the database to decide.
      const domain = website
        .toLowerCase()
        .replace(/^[a-z]+:\/\//, "")
        .split("/")[0]
        .split("?")[0]
        .replace(/^www\./, "")
        .split(":")[0];

      const res = await fetch("/api/employers/apply", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId, domain }),
      });
      const out = (await res.json()) as { ok?: boolean; outcome?: string };

      // The application IS SAVED either way. If the finalize step failed we
      // must not imply it was lost — it simply waits in the review queue.
      setStatus(out?.outcome === "approved" ? "approved" : "queued");
    } catch {
      setError("Something went wrong sending your application. Try again.");
      setStatus("error");
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

  if (status === "approved" || status === "queued") {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface p-5">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
          {status === "approved" ? "You are verified" : "Application received"}
        </p>
        <p className="mt-2 text-sm text-text-muted">
          {status === "approved"
            ? "Your work email is at your company's own domain and the site checks out, so your employer account is active. Open the app to set what you are looking for and to contact members."
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
