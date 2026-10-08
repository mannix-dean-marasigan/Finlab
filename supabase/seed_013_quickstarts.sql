-- =====================================================================
-- FINLAB PH content v13: two more 30-minute Quick Start certificates
--   Quick Start: Accounting Basics    = lesson "The Accounting Equation & Journal Entries" + Bookkeeping Sprint
--   Quick Start: Personal Finance     = lesson "Budgeting with the 50/30/20 Rule" + Budget Sprint
-- Install through Admin > Overview > Install content (or run here). Safe to re-run.
-- =====================================================================

insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('quickstart-bookkeeping-sprint', 'Bookkeeping Sprint: Tindahan ni Aling Rosa',
 'Ten minutes: record a store''s first week and check that the accounting equation balances.',
 '**Tindahan ni Aling Rosa**, a sari-sari store, had this first week:

1. Rosa invested **₱50,000** cash in the store.
2. She bought inventory for **₱20,000** on credit.
3. She sold goods for **₱15,000** cash. Those goods had cost **₱9,000**.
4. She paid **₱8,000** of what she owed the supplier.
5. She paid **₱2,000** rent in cash.

Work out the balances at the end of the week. Remember: assets = liabilities + equity.',
 'Answer each step. Everything is graded instantly. Amounts in pesos.', 'accounting', 'tasks', null, 'beginner', 10, 50, 70, 'auto',
 '[{"label":"Accounting math","weight":90},{"label":"Judgment","weight":10}]',
 '{"technical_knowledge":0.7,"financial_analysis":0.3}',
 '{"tasks":[
   {"id":"cash","type":"numeric","label":"Cash","prompt":"Cash at the end of the week (₱)?","unit":"₱","points":15},
   {"id":"inventory","type":"numeric","label":"Inventory","prompt":"Inventory left at the end of the week (₱)?","unit":"₱","points":15},
   {"id":"assets","type":"numeric","label":"Total assets","prompt":"Total assets (₱)?","unit":"₱","points":15},
   {"id":"liabilities","type":"numeric","label":"Liabilities","prompt":"Amount still owed to the supplier (₱)?","unit":"₱","points":15},
   {"id":"net_income","type":"numeric","label":"Net income","prompt":"Net income for the week: sales minus cost of goods sold minus rent (₱)?","unit":"₱","points":15},
   {"id":"equity","type":"numeric","label":"Equity","prompt":"Owner''s equity at the end of the week (₱)?","unit":"₱","points":15},
   {"id":"payable","type":"mcq","label":"Paying the supplier","prompt":"Paying ₱8,000 of the amount owed to the supplier…","options":[{"id":"a","label":"lowers assets and liabilities by ₱8,000"},{"id":"b","label":"lowers assets and counts as an ₱8,000 expense"},{"id":"c","label":"has no effect on the balance sheet"}],"points":10}
 ]}'::jsonb, '{quickstart}', true, now()),
('quickstart-budget-sprint', 'Budget Sprint: Maria''s First Paycheck',
 'Ten minutes: split a first salary with the 50/30/20 rule and plan an emergency fund.',
 '**Maria** just started her first job. Her **take-home pay is ₱25,000 a month**.

She wants to follow the **50/30/20 rule**: 50% for needs, 30% for wants and 20% for savings. She also wants an **emergency fund worth 6 months of needs**, built from her monthly savings.',
 'Answer each step. Everything is graded instantly. Amounts in pesos.', 'personal_finance', 'tasks', null, 'beginner', 10, 50, 70, 'auto',
 '[{"label":"Budget math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":0.5,"investment_judgment":0.5}',
 '{"tasks":[
   {"id":"needs","type":"numeric","label":"Needs","prompt":"Monthly budget for needs (₱)?","unit":"₱","points":15},
   {"id":"wants","type":"numeric","label":"Wants","prompt":"Monthly budget for wants (₱)?","unit":"₱","points":15},
   {"id":"savings","type":"numeric","label":"Savings","prompt":"Monthly savings (₱)?","unit":"₱","points":15},
   {"id":"fund","type":"numeric","label":"Emergency fund","prompt":"Emergency fund target: 6 months of needs (₱)?","unit":"₱","points":20},
   {"id":"months","type":"numeric","label":"Months","prompt":"How many months of saving to reach it?","unit":"months","points":15},
   {"id":"rent","type":"mcq","label":"Over budget","prompt":"Her rent is ₱9,000 and food and transport cost ₱6,000 a month. What is true?","options":[{"id":"a","label":"Her needs are over 50%, so she should trim wants or cut costs to keep saving 20%"},{"id":"b","label":"She should stop saving until her rent goes down"},{"id":"c","label":"Rent does not count as a need"}],"points":10},
   {"id":"where","type":"mcq","label":"Where to keep it","prompt":"Where should her emergency fund be kept?","options":[{"id":"a","label":"In a savings account she can access quickly"},{"id":"b","label":"In stocks, for higher returns"},{"id":"c","label":"Lent to friends who pay interest"}],"points":10}
 ]}'::jsonb, '{quickstart}', true, now())
on conflict (slug) do nothing;

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from (values
  ('quickstart-bookkeeping-sprint', '{"cash":{"answer":55000,"tolerance_pct":0.5},"inventory":{"answer":11000,"tolerance_pct":0.5},"assets":{"answer":66000,"tolerance_pct":0.5},"liabilities":{"answer":12000,"tolerance_pct":0.5},"net_income":{"answer":4000,"tolerance_pct":0.5},"equity":{"answer":54000,"tolerance_pct":0.5},"payable":{"answer":"a"}}'),
  ('quickstart-budget-sprint', '{"needs":{"answer":12500,"tolerance_pct":0.5},"wants":{"answer":7500,"tolerance_pct":0.5},"savings":{"answer":5000,"tolerance_pct":0.5},"fund":{"answer":75000,"tolerance_pct":0.5},"months":{"answer":15,"tolerance_pct":0.5},"rent":{"answer":"a"},"where":{"answer":"a"}}')
) as k(slug, answers)
join public.challenges c on c.slug = k.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('quickstart-accounting-basics', 'track', 'Quick Start: Accounting Basics',
 'Your first accounting certificate in about 30 minutes.',
 'New to accounting? In about **30 minutes** you will learn the accounting equation and how transactions are recorded, then use it on a real-style case.

1. **Lesson:** The Accounting Equation & Journal Entries. Watch the video, try the practice and pass the 10-question check.
2. **Bookkeeping Sprint:** a 10-minute case that is graded instantly. Score 70 or more to pass.

Your certificate is issued the moment you pass both, ready to add to LinkedIn.',
 'accounting', 'beginner', 0.5, 'Quick Start Certificate: Accounting Basics', true, 0),
('quickstart-personal-finance', 'track', 'Quick Start: Personal Finance',
 'A money basics certificate in about 30 minutes.',
 'Learn how to split your pay and build a safety net, then plan a real first paycheck.

1. **Lesson:** Budgeting with the 50/30/20 Rule. Watch the video, try the practice and pass the 10-question check.
2. **Budget Sprint:** a 10-minute case that is graded instantly. Score 70 or more to pass.

Your certificate is issued the moment you pass both, ready to add to LinkedIn.',
 'personal_finance', 'beginner', 0.5, 'Quick Start Certificate: Personal Finance', true, 0)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind = 'challenge' then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('quickstart-accounting-basics', 1, 'lesson', 'accounting-equation-journal', null::numeric),
  ('quickstart-accounting-basics', 2, 'challenge', 'quickstart-bookkeeping-sprint', 70),
  ('quickstart-personal-finance', 1, 'lesson', 'budgeting-503020', null::numeric),
  ('quickstart-personal-finance', 2, 'challenge', 'quickstart-budget-sprint', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
