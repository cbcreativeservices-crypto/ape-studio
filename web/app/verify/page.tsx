import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Verify a Credential",
  description:
    "Confirm a Pro Audio Training Academy certificate or program credential from its QR code or credential code.",
};

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Credential verification"
      title="Verify a Credential"
      body="Scan an Academy credential's QR code or enter its code to confirm it is genuine and current — with no personal data exposed."
      note="The public verifier is being wired up. Check back shortly."
    />
  );
}
