/**
 * CertificatesScreen — earned specialization certificates (the Certificates
 * category of the Trophy Case). Thin wrapper over the shared CredentialWall.
 */
import { CredentialWall } from './CredentialWall';

export function CertificatesScreen() {
  return <CredentialWall kind="certificate" title="CERTIFICATES" />;
}
