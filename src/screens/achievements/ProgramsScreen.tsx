/**
 * ProgramsScreen — earned program certificates (the Programs category of the
 * Trophy Case). Thin wrapper over the shared CredentialWall.
 */
import { CredentialWall } from './CredentialWall';

export function ProgramsScreen() {
  return <CredentialWall kind="program" title="PROGRAMS" />;
}
