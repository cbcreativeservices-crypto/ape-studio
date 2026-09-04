-- CODIFY TOPIC NAMES · 05_BACKUP
create table public.achievements_name_codify_backup_20260903 as
 select id, global_sequence, name from public.achievements where id in ('32129be7-4248-5c40-9d69-207b9c89878c','c2681246-efef-5b54-ba44-0c2cf5f079f7','acc16ff3-2dfe-4646-8516-14d0636d9c86');
alter table public.achievements_name_codify_backup_20260903 add primary key (id);
select count(*) as backed_up_expect_3 from public.achievements_name_codify_backup_20260903;
