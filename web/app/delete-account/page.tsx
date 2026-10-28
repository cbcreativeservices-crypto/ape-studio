/* ============================================================
 *  /delete-account — public account-deletion page (Google Play requires one).
 *  Plan of record: Downloads/2026-10-15_EXIT_FLOW_BUILD_PLAN.md, Step 4 and
 *  owner decisions §1. Public in web/proxy.ts (exact match, no gate cookie).
 *
 *  STATUS 2026-10-28 (ccode, read live; ported onto the one branch, rule 25) [MD:D20]:
 *   - HOLD 2 + HOLD 7 server side are LIVE now: delete_my_account(p_keep_credentials boolean)
 *     and public.retained_credentials both exist. WEB_DELETE_ENABLED is still false: the
 *     owner switches it on (after reviewing the INVENTED copy below).
 *   - HOLD 3: the app shows "Settings › Account and privacy" (exit flow ON, 96b90d79);
 *     this page names both paths, which still matches.
 *  ⏸ HOLD 1 — WEBSITE GO. A push to audio-tools-engine publishes the live site. [MD:D20]
 *     This page waits for the owner's go (plan, HOLD 4). Nothing was pushed.
 *  ⏸ HOLD 2 — THE CERTIFICATE CHOICE IS NOT LIVE ANYWHERE YET. The server [MD:D20]
 *     overload delete_my_account(p_keep_credentials) and retained_credentials
 *     (Comp A brief item 7) are not applied, and the app's new delete flow is
 *     behind a switch that is OFF. Today, every deletion (app or email) deletes
 *     everything. Do not publish this page describing a "keep a verification
 *     record" option until item 7 is live, or the owner rules the copy should
 *     go up first.
 *  ⏸ HOLD 3 — APP MENU PATH. "Settings › Account and privacy › Delete account" [MD:D20]
 *     exists only on branch exit-flow (Step 2). The version in review shows
 *     "Settings › Delete account". The page names both; owner to confirm.
 *  ⏸ HOLD 4 — EMAIL REQUESTS AND THE CHOICE. The page asks people who email to [MD:D20]
 *     say which certificate option they want, and says we will ask before
 *     deleting if they do not say (INVENTED; it follows "nothing preselected").
 *     Owner to confirm, and whether to state a reply time (none is promised).
 *  ⏸ HOLD 5 — WHAT IS KEPT / BACKUPS. The page points to Privacy Policy §20 for [MD:D20]
 *     records kept by law and says nothing about backup retention. Waits on the
 *     backup window (Comp A item 8) and the purchase-records ruling (plan HOLD 2).
 *     Privacy §19/§20 still say "Deletion does not automatically invalidate a
 *     previously issued Certificate", which contradicts "Delete everything";
 *     the §19/§20 rewrite (plan §4, HOLD 3) must ship with this page.
 *  ⏸ HOLD 6 — "WHAT GETS DELETED" list is from Privacy §20 plus the owner's [MD:D20]
 *     certificate decision; confirm it against the live delete_my_account table
 *     list once Comp A saves it (brief item 6).
 *  ⏸ HOLD 7 — WEB_DELETE_ENABLED stays false until Comp A logs item 7 as live [MD:D20]
 *     in docs/CROSS_SESSION_HANDOFF.md. Then test both choices with two test
 *     accounts (/verify/{code} works / stops working) before switching it on.
 *  Also for the owner: the Support page and Footer do not link here yet
 *  (plan §4 asks for a Support link); Play Console registration is Comp A's.
 *
 *  Copy marked INVENTED below was written for this page and is not from the
 *  owner, the plan, or an existing site page.
 * ============================================================ */

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, List } from "@/components/content";
import DeleteAccountForm from "@/components/DeleteAccountForm";

/**
 * Signed-in deletion on this website. OFF until the server overload
 * delete_my_account(p_keep_credentials boolean) is live (Comp A brief item 7).
 * While off, the page shows "Coming soon — use the app or email us".
 */
const WEB_DELETE_ENABLED = false;

export const metadata: Metadata = {
  title: "Delete your account",
  // INVENTED copy (meta description).
  description:
    "How to delete your Pro Audio Training Academy account in the app or by email, what is deleted, and the choice you have for your certificates.",
};

const EMAIL = "info@proaudiotrainingacademy.com";
const DELETE_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Delete my account")}`;
// INVENTED copy (email subject for removing a kept record).
const REMOVE_RECORD_SUBJECT = "Remove my verification record";
const REMOVE_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent(REMOVE_RECORD_SUBJECT)}`;

const APPLE_SUBS = "https://apps.apple.com/account/subscriptions";
const GOOGLE_SUBS = "https://play.google.com/store/account/subscriptions";

export default function Page() {
  return (
    <div className="pb-16">
      <PageHero
        eyebrow="Account"
        title="Delete your account"
        // INVENTED copy (lede).
        lede={`You can delete your account in the app${
          WEB_DELETE_ENABLED ? ", on this website," : ""
        } or by email. Deletion happens right away and cannot be undone.`}
      />

      <Section title="Delete in the app">
        {/* INVENTED copy (step wording; menu paths from the plan). */}
        <ol className="ml-5 list-decimal space-y-2 pl-1">
          <li>Open the Pro Audio Training Academy app and sign in.</li>
          <li>
            Go to <strong>Settings › Account and privacy › Delete account</strong>.
            In older versions of the app it is{" "}
            <strong>Settings › Delete account</strong>.
          </li>
          <li>Follow the steps on screen to confirm.</li>
        </ol>
      </Section>

      <Section title="What gets deleted">
        {/* List follows Privacy Policy §20 and the owner's certificate decision (2026-10-15). */}
        <List
          items={[
            "Your sign-in, so you can no longer log in with that email and password.",
            "Your profile and settings.",
            "Your learning progress, study history, favorites and achievements.",
            "Your certificates, unless you choose to keep a verification record (see below).",
          ]}
        />
        {/* INVENTED copy (records kept by law, pointing to the policy). */}
        <p>
          Some records must be kept by law, such as purchase and tax records.
          These are described in section 20 of our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="It cannot be undone">
        {/* INVENTED copy. */}
        <p>
          Your account is deleted as soon as you confirm. We cannot restore your
          progress or your account afterwards. If you come back later, you will
          start with a new account.
        </p>
      </Section>

      <Section title="Deleting does not cancel your subscription">
        {/* Wording follows the plan, Step 3 · D2. */}
        <p>
          Deleting your account does not cancel an Apple or Google subscription.
          If you pay through Apple or Google, cancel there to stop future
          renewal:
        </p>
        <List
          items={[
            <a key="apple" href={APPLE_SUBS} rel="noopener noreferrer">
              Apple subscriptions
            </a>,
            <a key="google" href={GOOGLE_SUBS} rel="noopener noreferrer">
              Google Play subscriptions
            </a>,
          ]}
        />
      </Section>

      <Section title="Your certificates: you choose">
        {/* Wording from the plan, Step 3 · D1 and owner decisions §1. Nothing is preselected. */}
        <p>
          If you have earned a certificate, you choose what happens to it when
          you delete your account. Nothing is chosen for you.
        </p>
        <List
          items={[
            <span key="all">
              <strong>Delete everything.</strong> We will no longer be able to
              confirm that you earned any certificate.
            </span>,
            <span key="keep">
              <strong>Keep a verification record.</strong> Only your name as
              printed on the certificate, the certificate title, the date
              earned and the verification code stay, so employers can still
              confirm it. No email, progress, profile or messages are kept.
              Everything else is deleted. The record is kept until you ask us
              to remove it.
            </span>,
          ]}
        />
      </Section>

      <Section title="Delete on this website">
        {WEB_DELETE_ENABLED ? (
          <DeleteAccountForm />
        ) : (
          <p
            role="note"
            className="rounded-md border border-border bg-surface px-4 py-3"
          >
            Coming soon — use the app or email us.
          </p>
        )}
      </Section>

      <Section title="Without the app">
        <p>
          Email <a href={DELETE_MAIL}>{EMAIL}</a> from the address on your
          account with the subject <strong>Delete my account</strong>.
        </p>
        {/* INVENTED copy (certificate choice by email; see HOLD 4). */}
        <p>
          If you have earned a certificate, tell us whether you want to delete
          everything or keep a verification record. If you do not say, we will
          ask you before we delete anything. We may ask you to confirm the
          request so that nobody else can delete your account.
        </p>
      </Section>

      <Section title="Remove a kept verification record">
        {/* INVENTED copy (removal request steps). */}
        <p>
          If you kept a verification record and want it removed, email{" "}
          <a href={REMOVE_MAIL}>{EMAIL}</a> with the subject{" "}
          <strong>{REMOVE_RECORD_SUBJECT}</strong> and include the verification
          code from your certificate. Once it is removed, nobody can confirm
          that certificate with us.
        </p>
      </Section>

      {/* INVENTED copy (button label "Email a deletion request"). */}
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 pb-4 sm:flex-row sm:px-6">
        <a
          href={DELETE_MAIL}
          className="rounded-md bg-amber px-6 py-3 text-center text-sm font-semibold text-background transition-colors hover:bg-amber-deep"
        >
          Email a deletion request
        </a>
        <Link
          href="/privacy"
          className="rounded-md border border-border px-6 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-amber hover:text-amber"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
