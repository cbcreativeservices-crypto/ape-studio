/* ============================================================
 *  /delete-account — public account-deletion page (Google Play requires one).
 *  Plan of record: Downloads/2026-10-15_EXIT_FLOW_BUILD_PLAN.md, Step 4 and
 *  owner decisions §1. Public in web/proxy.ts (exact match, no gate cookie).
 *
 *  STATUS 2026-10-28 (owner rulings via Comp A, Downloads/COMP_A_TO_CCODE_D2_D10_D20B_B8_2026-10-28.md) [MD:D20]:
 *   - The server side is LIVE (checked by Comp A tonight): delete_my_account(p_keep_credentials
 *     boolean) and public.retained_credentials both exist.
 *   - Owner: KEEP the certificate choice (Delete everything / Keep a verification record) and
 *     the email-path wording as written (no reply time is promised). The copy below is approved.
 *   - Privacy Policy §10 and §20 now describe the choice and the D18/D22 name rule; they ship
 *     with this page.
 *   - The app shows "Settings › Account and privacy" (exit flow ON, 96b90d79); the page names both
 *     paths, which still matches.
 *  ⏸ HOLD 1 — WEBSITE GO. A push to audio-tools-engine publishes the live site; owner's go. [MD:D20]
 *  ⏸ HOLD 7 — WEB_DELETE_ENABLED stays false until the two-account test passes: one test [MD:D20]
 *     account per choice (/verify/{code} keeps working vs stops). Owner: switch on BEFORE launch.
 *     Then Comp A sets Play's Data-safety deletion URL to /delete-account (B7).
 *  Also: the Support page and Footer do not link here yet (plan §4 asks for a Support link).
 * ============================================================ */

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, List } from "@/components/content";
import DeleteAccountForm from "@/components/DeleteAccountForm";

/**
 * Signed-in deletion on this website. The server overload is live; OFF until the
 * two-account test passes (HOLD 7 above). While off, the page shows
 * "Coming soon — use the app or email us".
 */
const WEB_DELETE_ENABLED = false;

export const metadata: Metadata = {
  title: "Delete your account",
  // Copy approved by the owner 2026-10-28 (meta description).
  description:
    "How to delete your Pro Audio Training Academy account in the app or by email, what is deleted, and the choice you have for your certificates.",
};

const EMAIL = "info@proaudiotrainingacademy.com";
const DELETE_MAIL = `mailto:${EMAIL}?subject=${encodeURIComponent("Delete my account")}`;
// Copy approved by the owner 2026-10-28 (email subject for removing a kept record).
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
        // Copy approved by the owner 2026-10-28 (lede).
        lede={`You can delete your account in the app${
          WEB_DELETE_ENABLED ? ", on this website," : ""
        } or by email. Deletion happens right away and cannot be undone.`}
      />

      <Section title="Delete in the app">
        {/* Copy approved by the owner 2026-10-28 (step wording; menu paths from the plan). */}
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
        {/* Copy approved by the owner 2026-10-28 (records kept by law, pointing to the policy). */}
        <p>
          Some records must be kept by law, such as purchase and tax records.
          These are described in section 20 of our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </Section>

      <Section title="It cannot be undone">
        {/* Copy approved by the owner 2026-10-28. */}
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
        {/* Copy approved by the owner 2026-10-28 (certificate choice by email). */}
        <p>
          If you have earned a certificate, tell us whether you want to delete
          everything or keep a verification record. If you do not say, we will
          ask you before we delete anything. We may ask you to confirm the
          request so that nobody else can delete your account.
        </p>
      </Section>

      <Section title="Remove a kept verification record">
        {/* Copy approved by the owner 2026-10-28 (removal request steps). */}
        <p>
          If you kept a verification record and want it removed, email{" "}
          <a href={REMOVE_MAIL}>{EMAIL}</a> with the subject{" "}
          <strong>{REMOVE_RECORD_SUBJECT}</strong> and include the verification
          code from your certificate. Once it is removed, nobody can confirm
          that certificate with us.
        </p>
      </Section>

      {/* Copy approved by the owner 2026-10-28 (button label "Email a deletion request"). */}
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
