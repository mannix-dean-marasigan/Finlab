-- seed_011_personal_interview: part 3 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 5. Challenges and the exam
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('personal-finance-plan', 'Money Plan: Maria''s First Salary',
 'Budget a first salary, set an emergency fund target and plan for the future.',
 '
Maria takes home **₱32,000** a month.

| Monthly spending | Amount |
|---|---|
| Rent | ₱9,000 |
| Food | ₱6,000 |
| Transport | ₱2,500 |
| Utilities | ₱1,500 |
| Wants (dining, streaming, shopping) | ₱8,000 |
| Savings | ₱5,000 |

Her essential expenses are the first four lines.
', 'Two decimals where needed.', 'personal_finance', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"Budget math","weight":80},{"label":"Judgment","weight":20}]',
 '{"financial_analysis":0.6,"decision_making":0.8,"technical_knowledge":0.4}',
 '{"tasks":[
   {"id":"needs","type":"numeric","label":"Needs %","prompt":"Needs as a % of take-home (two decimals)?","unit":"%","points":12},
   {"id":"wants","type":"numeric","label":"Wants %","prompt":"Wants as a % of take-home?","unit":"%","points":8},
   {"id":"sav","type":"numeric","label":"Savings %","prompt":"Savings as a % of take-home (two decimals)?","unit":"%","points":12},
   {"id":"tgt","type":"numeric","label":"20% target","prompt":"The 20% savings target in pesos (₱)?","unit":"₱","points":10},
   {"id":"fund","type":"numeric","label":"Emergency fund","prompt":"A 6-month emergency fund based on her essential expenses (₱)?","unit":"₱","points":12},
   {"id":"months","type":"numeric","label":"Months to goal","prompt":"Months to build that fund saving ₱5,000 a month (one decimal)?","unit":"months","points":12},
   {"id":"r72","type":"numeric","label":"Rule of 72","prompt":"If she invests ₱50,000 at 8% a year, using the rule of 72, roughly how much will it be after 9 years (₱)?","unit":"₱","points":10},
   {"id":"first","type":"mcq","label":"First priority","prompt":"Maria also has a credit card charging 36% a year. Her best first priority is to…","options":[{"id":"a","label":"Invest in a 6% bond fund"},{"id":"b","label":"Build a starter emergency fund and pay off the high-interest card"},{"id":"c","label":"Spend more on wants"},{"id":"d","label":"Stop saving"}],"points":6},
   {"id":"plan","type":"long_text","label":"Her plan","prompt":"Write Maria a short money plan: what to change in her budget, how to build her emergency fund and where to start investing.","min_words":50,"points":18}
 ]}'::jsonb, '{personal_finance}', true, now()),

('interview-mock-technical', 'Mock Technical Round: Finance Interview',
 'Answer the technical questions an analyst interviewer will ask.',
 '
You are in a **first-round technical interview**. Answer as you would out loud, then put numbers behind your answers.

Facts for the numeric questions (₱):
- Depreciation rises by **₱40**; tax rate **25%**.
- Equity value **₱2,000m**; debt **₱600m**; cash **₱250m**.
- EBIT **₱300m**; tax **30%**; D&A **₱80m**; capex **₱100m**; increase in NWC **₱20m**.
- Final-year FCF **₱170m**; terminal growth **2%**; WACC **10%**.
', 'Two decimals where needed.', 'career_prep', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Technical accuracy","weight":68},{"label":"Communication","weight":32}]',
 '{"technical_knowledge":1.0,"communication":0.8,"valuation":0.5}',
 '{"tasks":[
   {"id":"ni","type":"numeric","label":"Net income","prompt":"By how much does net income fall (₱)?","unit":"₱","points":10},
   {"id":"cash","type":"numeric","label":"Cash","prompt":"By how much does cash from operations rise (₱)?","unit":"₱","points":10},
   {"id":"ev","type":"numeric","label":"Enterprise value","prompt":"Enterprise value (₱m)?","unit":"₱m","points":12},
   {"id":"ufcf","type":"numeric","label":"UFCF","prompt":"Unlevered free cash flow (₱m)?","unit":"₱m","points":14},
   {"id":"tv","type":"numeric","label":"Terminal value","prompt":"Terminal value by Gordon growth (₱m, one decimal)?","unit":"₱m","points":14},
   {"id":"ev1","type":"mcq","label":"Discount rate","prompt":"Which discount rate is used for unlevered free cash flows?","options":[{"id":"a","label":"Cost of equity"},{"id":"b","label":"WACC"},{"id":"c","label":"Cost of debt"},{"id":"d","label":"The tax rate"}],"points":8},
   {"id":"walk","type":"long_text","label":"Walk me through a DCF","prompt":"In 4–6 sentences: walk me through a DCF.","min_words":60,"points":32}
 ]}'::jsonb, '{interview}', true, now()),

('exam-finance-interview-prep', 'Final Exam: Certified Finance Interview Prep',
 'Timed exam: statements, DCF and multiples, plus two spoken-style answers.',
 '
**Bataan Steel** (₱ millions unless stated):

| Item | Value |
|---|---|
| Share price | ₱80 |
| Diluted shares | 10 million |
| Debt | 500 |
| Cash | 200 |
| EBITDA | 180 |
| Net income | 60 |
| EBIT | 150 |
| Tax rate | 25% |
| D&A | 30 |
| Capex | 40 |
| Increase in NWC | 10 |

Terminal growth **3%**, WACC **9%**. Separately, depreciation rises by **₱20**.
', 'You have 45 minutes. Two decimals where needed. Pass mark 70.', 'career_prep', 'tasks', null, 'advanced', 45, 300, 70, 'auto',
 '[{"label":"Technical accuracy","weight":68},{"label":"Communication","weight":32}]',
 '{"technical_knowledge":1.0,"communication":1.0,"valuation":0.6}',
 '{"tasks":[
   {"id":"eq","type":"numeric","label":"Equity value","prompt":"Equity value (₱m)?","unit":"₱m","points":6},
   {"id":"ev","type":"numeric","label":"Enterprise value","prompt":"Enterprise value (₱m)?","unit":"₱m","points":10},
   {"id":"evx","type":"numeric","label":"EV/EBITDA","prompt":"EV/EBITDA (x, two decimals)?","unit":"x","points":8},
   {"id":"pe","type":"numeric","label":"P/E","prompt":"P/E (x, two decimals)?","unit":"x","points":8},
   {"id":"ufcf","type":"numeric","label":"UFCF","prompt":"Unlevered free cash flow (₱m, two decimals)?","unit":"₱m","points":12},
   {"id":"tv","type":"numeric","label":"Terminal value","prompt":"Terminal value from that FCF using Gordon growth (₱m, two decimals)?","unit":"₱m","points":12},
   {"id":"ni","type":"numeric","label":"Depreciation: net income","prompt":"By how much does net income fall when depreciation rises by ₱20 (₱m)?","unit":"₱m","points":6},
   {"id":"cash","type":"numeric","label":"Depreciation: cash","prompt":"By how much does cash from operations rise (₱m)?","unit":"₱m","points":6},
   {"id":"mc1","type":"mcq","label":"Multiples","prompt":"Which multiple is capital-structure neutral?","options":[{"id":"a","label":"P/E"},{"id":"b","label":"EV/EBITDA"},{"id":"c","label":"Price per share"},{"id":"d","label":"Dividend yield"}],"points":6},
   {"id":"mc2","type":"mcq","label":"DCF consistency","prompt":"Using levered free cash flows with WACC is…","options":[{"id":"a","label":"Correct"},{"id":"b","label":"An inconsistency"},{"id":"c","label":"Required for banks"},{"id":"d","label":"Only wrong with no debt"}],"points":6},
   {"id":"say1","type":"long_text","label":"Spoken answer: the statements","prompt":"Answer as you would in an interview: how are the three financial statements linked?","min_words":50,"points":10},
   {"id":"say2","type":"long_text","label":"Spoken answer: EV vs equity value","prompt":"Answer as you would in an interview: what is the difference between enterprise value and equity value, and why is cash subtracted?","min_words":50,"points":10}
 ]}'::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 45, max_attempts = 3 where slug = 'exam-finance-interview-prep';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('personal-finance-plan', '{"needs":{"answer":59.38,"tolerance_pct":0.5},"wants":{"answer":25,"tolerance_pct":0.5},"sav":{"answer":15.63,"tolerance_pct":0.5},"tgt":{"answer":6400,"tolerance_pct":0.5},
   "fund":{"answer":114000,"tolerance_pct":0.5},"months":{"answer":22.8,"tolerance_pct":1},"r72":{"answer":100000,"tolerance_pct":1},"first":{"answer":"b"},
   "plan":{"keywords":["budget|50/30/20|needs|wants","emergency fund|savings","debt|credit card|interest","invest|fund|index|diversif","inflation|compound"],"keywords_required":3}}'),
 ('interview-mock-technical', '{"ni":{"answer":30,"tolerance_pct":0.5},"cash":{"answer":10,"tolerance_pct":0.5},"ev":{"answer":2350,"tolerance_pct":0.5},"ufcf":{"answer":170,"tolerance_pct":0.5},"tv":{"answer":2167.5,"tolerance_pct":0.5},"ev1":{"answer":"b"},
   "walk":{"keywords":["project|forecast","free cash flow|fcf","discount|wacc|present value","terminal","enterprise value|net debt|equity value"],"keywords_required":4}}'),
 ('exam-finance-interview-prep', '{"eq":{"answer":800,"tolerance_pct":0.5},"ev":{"answer":1100,"tolerance_pct":0.5},"evx":{"answer":6.11,"tolerance_pct":0.5},"pe":{"answer":13.33,"tolerance_pct":0.5},"ufcf":{"answer":92.5,"tolerance_pct":0.5},
   "tv":{"answer":1587.92,"tolerance_pct":0.5},"ni":{"answer":15,"tolerance_pct":0.5},"cash":{"answer":5,"tolerance_pct":0.5},"mc1":{"answer":"b"},"mc2":{"answer":"b"},
   "say1":{"keywords":["net income","cash flow","retained earnings|balance sheet","income statement","depreciation|working capital|non-cash"],"keywords_required":4},
   "say2":{"keywords":["enterprise value|ev","equity value|shareholders","debt","cash","operating|capital provider|net debt"],"keywords_required":4}}')
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The programs
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('personal-finance-essentials', 'track', 'Personal Finance Essentials',
 'Budgeting, saving, compound interest and investing basics.',
 '
The money skills nobody taught you in school: budget a salary with the 50/30/20 rule, build an emergency fund, understand compound interest and inflation, and learn how stocks, bonds and funds work.

Four short lessons and one hands-on money plan. Great for a first certificate.
', 'personal_finance', 'beginner', 1.5, 'Track Certificate — Personal Finance Essentials', true, 14),
('finance-interview-prep', 'certification', 'Finance Interview Prep',
 'The technical questions every finance internship and analyst interview asks.',
 '
Prepare for the technical round: link the three statements and walk through the depreciation question, answer "walk me through a DCF", and explain enterprise value, equity value and multiples with confidence.

1. Pass each lesson''s video, practice and knowledge check.
2. Complete the mock technical round.
3. Pass the **timed final exam** (45 minutes, 70% to pass, 3 attempts), including two spoken-style answers.
', 'career_prep', 'intermediate', 2.0, 'Certified Finance Interview Prep', true, 8)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('personal-finance-essentials', 1, 'lesson', 'budgeting-503020', null::numeric),
  ('personal-finance-essentials', 2, 'lesson', 'emergency-fund-inflation', null),
  ('personal-finance-essentials', 3, 'lesson', 'compound-interest-saving', null),
  ('personal-finance-essentials', 4, 'lesson', 'investing-basics-funds', null),
  ('personal-finance-essentials', 5, 'challenge', 'personal-finance-plan', null),

  ('finance-interview-prep', 1, 'lesson', 'interview-three-statements', null),
  ('finance-interview-prep', 2, 'lesson', 'interview-dcf-walkthrough', null),
  ('finance-interview-prep', 3, 'lesson', 'interview-ev-equity', null),
  ('finance-interview-prep', 4, 'challenge', 'interview-mock-technical', null),
  ('finance-interview-prep', 5, 'exam', 'exam-finance-interview-prep', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
