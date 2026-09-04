-- CODIFY TOPIC NAMES · 10_APPLY · idempotent (keyed on md5(current name)); ERRORS if 05_BACKUP absent
update public.achievements a
set name = v.new_name
from (values
('32129be7-4248-5c40-9d69-207b9c89878c','e922b23e15762bacbff10de70704cc92',$n$Pro Audio Safety$n$),
('c2681246-efef-5b54-ba44-0c2cf5f079f7','4e542650c75e0ae79a1db609e70b7fef',$n$Grounding & Electrical$n$),
('acc16ff3-2dfe-4646-8516-14d0636d9c86','538e5631b0b0dab6452717f194d2b504',$n$Audio Fundamentals$n$)
) as v(id, old_md5, new_name),
(select count(*) as c from public.achievements_name_codify_backup_20260903) as guard
where guard.c = 3 and a.id = v.id::uuid and md5(a.name) = v.old_md5;
