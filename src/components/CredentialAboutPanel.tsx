/**
 * CredentialAboutPanel — the long-form description under a certificate's or
 * program's full-size artwork (owner 2026-09-20: "use the same as the study
 * dashboard… the same screen with the longer description below").
 *
 * Same shell as the topic overview (`AboutPanel`), different source: this one
 * reads `credentialCopy` by slug, which is Computer B's authored credential
 * copy — description, where it applies, and the career ladder.
 */
import { StyleSheet, Text, View } from 'react-native';
import { AboutPanel, type AboutSection } from './AboutPanel';
import { credentialCopy } from '../data/credentialCopy';
import { REQUIRES_LABEL } from '../data/careerRequirement';
import { colors, fonts } from '../theme/tokens';

/** Does this credential have copy? Callers decide layout before rendering. */
export function hasCredentialAbout(slug: string | null | undefined): boolean {
  return !!slug && credentialCopy(slug) != null;
}

export function CredentialAboutPanel({
  slug,
  accent,
  maxHeight,
}: {
  slug: string | null | undefined;
  accent?: string;
  maxHeight?: number;
}) {
  const copy = slug ? credentialCopy(slug) : null;
  if (!copy) return null;

  const sections: AboutSection[] = [];
  if (copy.description) sections.push({ key: 'description', label: 'What it covers', body: copy.description });
  if (copy.whereApplies.length > 0) {
    sections.push({ key: 'where', label: 'Where it applies', body: copy.whereApplies.join(' · ') });
  }
  if (copy.careers.length > 0) {
    sections.push({
      key: 'careers',
      label: 'Careers it supports',
      body: (
        <View style={s.careers}>
          {copy.careers.map((c) => {
            const req = c.requires ? REQUIRES_LABEL[c.requires] : null;
            return (
              <Text key={c.name} style={s.career}>
                {c.name}
                {req ? <Text style={s.req}>{`  — ${req}`}</Text> : null}
              </Text>
            );
          })}
          {/*
           * ⛔ UNCONDITIONAL, NEVER CONDITIONAL. The owner's rule is that
           * required education is disclosed "always, every time". The same
           * disclosure was previously gated on whether the app had classified
           * a role as gated, and so fired on 6 of 44 career lists — honest 14%
           * of the time. A sentence that is always true costs one line and
           * cannot rot; a detector that decides when honesty is needed can,
           * silently, and did.
           */}
          <Text style={s.note}>
            {copy.careers.some((c) => c.requires)
              ? 'Roles marked above need a degree, licence or certification beyond this Academy. This credential supports your preparation for them; it does not by itself qualify you.'
              : 'This credential supports your preparation for these roles. Employers set their own hiring requirements, which may include education or certification beyond this Academy.'}
          </Text>
        </View>
      ),
    });
  }

  return <AboutPanel eyebrow="About this credential" sections={sections} maxHeight={maxHeight} accent={accent} />;
}

const s = StyleSheet.create({
  careers: { gap: 3 },
  career: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  req: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.amber },
  note: {
    fontFamily: fonts.barlowRegular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSubAlt,
    marginTop: 6,
  },
});
