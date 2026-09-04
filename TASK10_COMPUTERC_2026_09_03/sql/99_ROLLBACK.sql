-- TASK10 · 99_ROLLBACK
update public.quiz_questions q
set question_text=b.question_text, options_json=b.options_json, correct_answer=b.correct_answer, explanation=b.explanation
from public.qq_t10_backup_20260903 b where q.id=b.id;
select count(*) as restored_expect_399 from public.quiz_questions q join public.qq_t10_backup_20260903 b on b.id=q.id where q.explanation=b.explanation;
