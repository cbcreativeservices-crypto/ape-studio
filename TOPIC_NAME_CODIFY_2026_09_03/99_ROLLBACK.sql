-- CODIFY TOPIC NAMES · 99_ROLLBACK
update public.achievements a set name=b.name from public.achievements_name_codify_backup_20260903 b where a.id=b.id;
select count(*) as restored_expect_3 from public.achievements a join public.achievements_name_codify_backup_20260903 b on b.id=a.id where a.name=b.name;
