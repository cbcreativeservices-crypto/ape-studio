/**
 * Back-compat re-export. The collapsible container moved to
 * `src/components/Section.tsx` when Profile adopted it too — a screen should
 * not import its layout primitives out of another screen's feature folder.
 */
export { Section as SettingsSection } from '../../components/Section';
