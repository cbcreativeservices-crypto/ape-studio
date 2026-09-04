-- CODIFY TOPIC NAMES · 00_PRECHECK · read-only
-- Expect: target_rows=3 ; matching_current=3 (all 3 still hold their old name) ; backup_exists=0
with exp(id,old_md5) as (values ('32129be7-4248-5c40-9d69-207b9c89878c'::uuid,'e922b23e15762bacbff10de70704cc92'),('c2681246-efef-5b54-ba44-0c2cf5f079f7'::uuid,'4e542650c75e0ae79a1db609e70b7fef'),('acc16ff3-2dfe-4646-8516-14d0636d9c86'::uuid,'538e5631b0b0dab6452717f194d2b504'))
select
 (select count(*) from public.achievements where id in ('32129be7-4248-5c40-9d69-207b9c89878c','c2681246-efef-5b54-ba44-0c2cf5f079f7','acc16ff3-2dfe-4646-8516-14d0636d9c86')) as target_rows,
 (select count(*) from public.achievements a join exp on a.id=exp.id where md5(a.name)=exp.old_md5) as matching_current,
 (select count(*) from information_schema.tables where table_schema='public' and table_name='achievements_name_codify_backup_20260903') as backup_exists;
