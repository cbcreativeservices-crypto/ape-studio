/**
 * The Registrar's attestation shown above a holder's verified credentials
 * (owner 2026-10-31, "Registrar style"). One copy for the code check
 * (/verify/[code]) and the QR registry profile (/registry/[token]).
 *
 * Accurate to how awards work: the required topics + a passing final exam;
 * labs only where the credential requires them. Lab enforcement starts at
 * store approval, so "where applicable" keeps earlier awards true. Never
 * claim accreditation or licensure here.
 */
export default function RegistrarAttestation({ className = "" }: { className?: string }) {
  return (
    <p className={`max-w-prose text-sm leading-relaxed text-text-sub ${className}`}>
      The Registrar of Pro Audio Training Academy confirms that each credential
      listed was conferred on the date shown, upon the holder&rsquo;s completion
      of all required coursework, successful performance on the final
      examination and, where applicable, the required laboratory work.
    </p>
  );
}
