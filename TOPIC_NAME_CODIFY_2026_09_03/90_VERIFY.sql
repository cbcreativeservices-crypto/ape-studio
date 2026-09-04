-- CODIFY TOPIC NAMES · 90_VERIFY · read-only
-- Expect: applied=3 ; not_applied=0
with want(id,new) as (values ('32129be7-4248-5c40-9d69-207b9c89878c'::uuid,$n$Pro Audio Safety$n$),('c2681246-efef-5b54-ba44-0c2cf5f079f7'::uuid,$n$Grounding & Electrical$n$),('acc16ff3-2dfe-4646-8516-14d0636d9c86'::uuid,$n$Audio Fundamentals$n$))
select count(*) filter (where a.name=want.new) as applied,
       count(*) filter (where a.name<>want.new) as not_applied
from want join public.achievements a on a.id=want.id;
