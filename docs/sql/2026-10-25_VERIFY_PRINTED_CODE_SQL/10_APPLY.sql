-- 10_APPLY — "Verify by code" also accepts the 8-character code PRINTED on certificates.
-- Owner GO 2026-10-25 ("Fix it on the server ... I approve running it").
--
-- Why: certificates print "CREDENTIAL <first 8 of users.qr_token>" (app certificateHtml.ts),
-- but this lookup only matched users.verify_code, a code the app never shows. Every printed
-- code answered "No match found". The QR and app link (full token) were never affected.
--
-- What changes (and nothing else):
--   * a code matches a member's verify_code (as before) OR the 8-hex code printed on their
--     certificates, when it belongs to exactly one member and is nobody's verify_code;
--   * spaces/dashes in a typed code are ignored (the website already strips them);
--   * deleted-account certificates (retained_credentials) still match by verify_code only;
--   * same columns, same SECURITY DEFINER, same search_path, same grants (CREATE OR REPLACE keeps them).
-- Run 00_PRECHECK and 05_BACKUP first. Safe to run twice. Expected: "Success. No rows returned".

create or replace function public.public_verify_credentials(p_code text)
returns table(holder_label text, credential_type text, credential_name text, level_or_tier text, track text, earned_at timestamp with time zone)
language sql
stable security definer
set search_path to 'public', 'pg_temp'
as $function$
  -- printed certificate code: first 8 of users.qr_token (owner 2026-10-25)
  WITH c AS (
    SELECT translate(upper(regexp_replace(coalesce(p_code, ''), '[^0-9A-Za-z]', '', 'g')), 'OIL', '011') AS code
  ),
  matched AS (
    SELECT u.id FROM public.users u, c WHERE c.code <> '' AND u.verify_code = c.code
    UNION
    SELECT u.id FROM public.users u, c
     WHERE c.code ~ '^[0-9A-F]{8}$'
       AND upper(left(u.qr_token::text, 8)) = c.code
       AND NOT EXISTS (SELECT 1 FROM public.users x WHERE x.verify_code = c.code)
       AND (SELECT count(*) FROM public.users y WHERE upper(left(y.qr_token::text, 8)) = c.code) = 1
  )
  SELECT
    COALESCE(NULLIF(u.registry_name,''),
             NULLIF(u.nickname,''),
             NULLIF(trim(concat_ws(' ', u.first_name, NULLIF(u.last_name_initial,''))),''),
             'Academy member') AS holder_label,
    ca.credential_type,
    COALESCE(cert.name, prog.name, 'Credential') AS credential_name,
    COALESCE(cert.level, prog.tier) AS level_or_tier,
    COALESCE(cert.track, prog.track) AS track,
    ca.earned_at
  FROM matched m
  JOIN public.users u ON u.id = m.id
  JOIN public.credential_awards ca ON ca.user_id = u.id AND ca.revoked_at IS NULL
  LEFT JOIN public.certificates cert ON ca.credential_type='certificate' AND cert.id=ca.credential_id
  LEFT JOIN public.programs   prog ON ca.credential_type='program'     AND prog.id=ca.credential_id
  UNION ALL
  SELECT r.holder_name, r.credential_kind, r.credential_title, r.level_or_tier, r.track, r.earned_at
  FROM public.retained_credentials r, c
  WHERE c.code <> '' AND r.verify_code = c.code
    AND NOT EXISTS (SELECT 1 FROM matched)
  ORDER BY 6 NULLS LAST;
$function$;

-- Speeds up the printed-code lookup as the member count grows.
create index if not exists users_qr_token_printed_code_idx
  on public.users (upper(left(qr_token::text, 8)));
