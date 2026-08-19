import type { Metadata } from "next";
import VerifyForm from "@/components/VerifyForm";

export const metadata: Metadata = {
  title: "Verify a Credential",
  description:
    "Confirm a Pro Audio Training Academy certificate or program credential from its verification code or QR code.",
};

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber">
        Credential verification
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-wide text-foreground sm:text-4xl">
        Verify a Credential
      </h1>
      <p className="mt-4 text-text-sub">
        Enter the verification code from a Pro Audio Training Academy credential
        to confirm it&rsquo;s genuine and current. You can also scan the holder&rsquo;s
        QR code with your camera to open their verification directly.
      </p>

      <VerifyForm />

      <p className="mt-6 text-sm text-text-muted">
        Verification shows only the holder&rsquo;s name and the credentials they
        hold — no other personal information is disclosed.
      </p>
    </div>
  );
}
