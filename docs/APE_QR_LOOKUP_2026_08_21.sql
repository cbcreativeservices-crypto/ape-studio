-- ============================================================================
-- APE QR Credential Lookup — owner-run migration (2026-08-21)
-- ============================================================================
-- Feature (owner, HIGH PRIORITY): every user gets a permanent QR code that
-- resolves to their public transcript/credentials. Option B (opaque token):
-- the QR encodes https://proaudiotrainingacademy.com/registry/<qr_token>.
--
-- This adds ONE anon-safe verifier keyed on users.qr_token (uuid) — a mirror of
-- the existing public_verify_credentials(p_code) which keys on verify_code. Same
-- PII-minimal output shape, same SECURITY DEFINER posture. Narrow frozen-backend
-- amendment (mic-catalog / access-code precedent). Verified against the live
-- public_verify_credentials definition 2026-08-21.
--
-- Client: web/lib/verify.ts (verifyByToken) + /registry/[token] page; app QR in
-- Profile + Directory encodes the /registry URL.
-- ============================================================================

create or replace function public.public_verify_by_token(p_token uuid)
 returns table(
   holder_label text,
   credential_type text,
   credential_name text,
   level_or_tier text,
   track text,
   earned_at timestamptz
 )
 language sql
 stable
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select
    coalesce(nullif(u.nickname,''),
             nullif(trim(concat_ws(' ', u.first_name, nullif(u.last_name_initial,''))),''),
             'Academy member') as holder_label,
    ca.credential_type,
    coalesce(cert.name, prog.name, 'Credential') as credential_name,
    coalesce(cert.level, prog.tier) as level_or_tier,
    coalesce(cert.track, prog.track) as track,
    ca.earned_at
  from public.users u
  join public.credential_awards ca on ca.user_id = u.id and ca.revoked_at is null
  left join public.certificates cert on ca.credential_type='certificate' and cert.id = ca.credential_id
  left join public.programs   prog on ca.credential_type='program'     and prog.id = ca.credential_id
  where u.qr_token = p_token
  order by ca.earned_at nulls last;
$function$;

grant execute on function public.public_verify_by_token(uuid) to anon, authenticated;

-- Sanity check (optional): pick any user's token and confirm it resolves.
--   select qr_token from public.users limit 1;
--   select * from public.public_verify_by_token('<paste-token>');
-- ============================================================================
