import Link from "next/link";

/**
 * The end of the verification page used to be the end of the road.
 *
 * Someone scans a graduate's QR, sees "yes, this credential is real" — and then
 * has nowhere to go. The app deliberately never publishes a member's email or
 * phone, so a hiring manager who wants to talk to the person they just verified
 * simply cannot, and the graduate never learns they were interested.
 *
 * Owner 2026-09-18: "in the website tell them to contact (not just confirm)."
 *
 * Deliberately says what it costs BEFORE the button: an account and the app.
 * Hiding the two-step until after a click is how a promising CTA becomes a
 * bounce, and the honest version also filters for people who actually mean it.
 */
export default function ContactThisMember() {
  return (
    <section className="mt-10 rounded-xl border border-amber/40 bg-amber/5 p-6">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-amber">
        Want to talk to them?
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
        Verified employers can contact members directly
      </h2>
      <p className="mt-3 text-sm text-text-muted">
        We don&rsquo;t publish anyone&rsquo;s email or phone number. Instead, verified employers can
        send a request through the app — the member decides whether to reply, and nothing becomes a
        conversation until they accept.
      </p>
      <p className="mt-3 text-sm text-text-muted">
        It takes two things: an Academy account, and the app. If your work email is at your
        company&rsquo;s own domain, verification is immediate.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/employers/apply"
          className="rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Apply for an employer account
        </Link>
        <Link
          href="/employers"
          className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-amber"
        >
          How verification works
        </Link>
      </div>
    </section>
  );
}
