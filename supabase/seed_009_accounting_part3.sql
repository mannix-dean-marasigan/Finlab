-- seed_009_accounting: part 3 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 5. Challenges and the final exam
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('accounting-journal-trial-balance', 'Journal Entries: Cebu Print Studio',
 'Record a month of transactions and prove the accounting equation.',
 '
**Cebu Print Studio** (₱) had these transactions in its first month:

1. The owner invested **500,000** cash.
2. Bought equipment for **300,000** cash.
3. Bought paper supplies for **20,000** on credit.
4. Earned fees of **180,000**: **120,000** in cash and **60,000** on account.
5. Paid rent of **40,000** in cash.
6. Paid salaries of **60,000** in cash.
', 'Answer in ₱.', 'accounting', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"Bookkeeping math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.4}',
 '{"tasks":[
   {"id":"cash","type":"numeric","label":"Ending cash","prompt":"Ending cash (₱)?","unit":"₱","points":15},
   {"id":"ar","type":"numeric","label":"Receivables","prompt":"Accounts receivable at month end (₱)?","unit":"₱","points":10},
   {"id":"assets","type":"numeric","label":"Total assets","prompt":"Total assets: cash, receivables, equipment and supplies (₱)?","unit":"₱","points":15},
   {"id":"liab","type":"numeric","label":"Liabilities","prompt":"Total liabilities (₱)?","unit":"₱","points":10},
   {"id":"ni","type":"numeric","label":"Net income","prompt":"Net income for the month (₱)?","unit":"₱","points":15},
   {"id":"equity","type":"numeric","label":"Equity","prompt":"Owner''s equity at month end (capital + net income) (₱)?","unit":"₱","points":15},
   {"id":"nb","type":"mcq","label":"Normal balance","prompt":"What is the normal balance of the fees revenue account?","options":[{"id":"a","label":"Debit"},{"id":"b","label":"Credit"},{"id":"c","label":"Either"},{"id":"d","label":"None"}],"points":5},
   {"id":"view","type":"long_text","label":"Assessment","prompt":"Check that the accounting equation balances and comment briefly on the studio''s profitability and liquidity.","min_words":40,"points":15}
 ]}'::jsonb, '{accounting}', true, now()),

('accounting-adjusting-entries-case', 'Year-End Adjustments: Manila Courier',
 'Compute the adjusting entries and the adjusted profit.',
 '
**Manila Courier** has a 31 December year end. Unadjusted profit is **₱300,000**.

| Item | Detail |
|---|---|
| Insurance | ₱36,000 paid on 1 Sep covering 12 months (recorded as prepaid) |
| Advance from a customer | ₱90,000 received on 1 Oct for 6 months of service (recorded as unearned) |
| Wages | ₱28,000 earned by staff but unpaid at year end |
| Supplies | Opening ₱12,000; purchases ₱18,000 (recorded as an asset); closing count ₱9,000 |
| Loan | ₱400,000 at 9% a year, taken on 1 Nov; no interest recorded yet |
', 'Answer in ₱.', 'accounting', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Adjustment math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 '{"tasks":[
   {"id":"ins","type":"numeric","label":"Insurance expense","prompt":"Insurance expense for the year (₱)?","unit":"₱","points":12},
   {"id":"unearned","type":"numeric","label":"Revenue earned","prompt":"Service revenue earned from the advance by 31 Dec (₱)?","unit":"₱","points":12},
   {"id":"wages","type":"mcq","label":"Wages entry","prompt":"The adjusting entry for the unpaid wages is…","options":[{"id":"a","label":"Dr Wages payable / Cr Wages expense"},{"id":"b","label":"Dr Wages expense / Cr Wages payable"},{"id":"c","label":"Dr Cash / Cr Wages expense"},{"id":"d","label":"No entry is needed"}],"points":10},
   {"id":"sup","type":"numeric","label":"Supplies expense","prompt":"Supplies expense for the year (₱)?","unit":"₱","points":14},
   {"id":"int","type":"numeric","label":"Accrued interest","prompt":"Interest accrued by 31 Dec (₱)?","unit":"₱","points":12},
   {"id":"profit","type":"numeric","label":"Adjusted profit","prompt":"Adjusted profit after all five adjustments (₱)?","unit":"₱","points":20},
   {"id":"why","type":"long_text","label":"Why adjust?","prompt":"Explain why these adjustments matter and what would be misstated if they were skipped.","min_words":40,"points":20}
 ]}'::jsonb, '{accounting}', true, now()),

('accounting-inventory-depreciation-case', 'Inventory & Depreciation: Davao Hardware',
 'Cost inventory with FIFO and weighted average, then depreciate a van two ways.',
 '
**Davao Hardware** sold **300 units** at **₱400** each during the year.

| Inventory | Units | Cost per unit |
|---|---|---|
| Beginning inventory | 150 | ₱200 |
| Purchases | 250 | ₱220 |

It also bought a **delivery van** for **₱900,000** (salvage ₱100,000, 5-year life).
', 'Answer in ₱. Two decimals where needed.', 'accounting', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Costing math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 '{"tasks":[
   {"id":"fifo","type":"numeric","label":"FIFO COGS","prompt":"Cost of goods sold under FIFO (₱)?","unit":"₱","points":12},
   {"id":"avgc","type":"numeric","label":"Average cost","prompt":"Weighted-average cost per unit (₱)?","unit":"₱","points":10},
   {"id":"avgcogs","type":"numeric","label":"Average COGS","prompt":"Cost of goods sold under weighted average (₱)?","unit":"₱","points":12},
   {"id":"endinv","type":"numeric","label":"FIFO ending inventory","prompt":"Ending inventory under FIFO (₱)?","unit":"₱","points":12},
   {"id":"gp","type":"numeric","label":"Gross profit","prompt":"Gross profit under FIFO (₱)?","unit":"₱","points":12},
   {"id":"sl","type":"numeric","label":"Straight-line","prompt":"Straight-line depreciation per year for the van (₱)?","unit":"₱","points":10},
   {"id":"ddb","type":"numeric","label":"Double-declining","prompt":"Year-1 depreciation under double-declining balance (₱)?","unit":"₱","points":10},
   {"id":"rising","type":"mcq","label":"Method effect","prompt":"With rising purchase prices, which method reports the higher profit?","options":[{"id":"a","label":"FIFO"},{"id":"b","label":"Weighted average"},{"id":"c","label":"They are always equal"},{"id":"d","label":"It depends only on sales"}],"points":7},
   {"id":"view","type":"long_text","label":"Method choice","prompt":"Which inventory and depreciation methods would you choose and why? Consider profit, tax and comparability.","min_words":40,"points":15}
 ]}'::jsonb, '{accounting}', true, now()),

('exam-accounting-fundamentals', 'Final Exam: Certified Accounting Fundamentals',
 'Timed exam: bad debts, depreciation, inventory, adjustments and revenue.',
 '
**Pasig Retail Corp** (₱), year ended 31 December:

| Item | Detail |
|---|---|
| Credit sales | 5,000,000; gross receivables 800,000; no opening allowance; bad debts estimated at **2% of credit sales** |
| Equipment | Cost 1,200,000; salvage 200,000; life 5 years; straight-line |
| Inventory | Beginning 400,000; purchases 2,100,000; ending 500,000 |
| Prepaid rent | 96,000 paid on 1 Oct for 12 months |
| Customer advance | 180,000 received on 1 Nov for 6 months of service |
| Accrued salaries | 45,000 unpaid at year end |
| Balance sheet | Total assets 3,500,000; total liabilities 1,400,000 |
', 'You have 60 minutes. Pass mark 70.', 'accounting', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Accounting math","weight":76},{"label":"Judgment","weight":24}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.8,"communication":0.3}',
 '{"tasks":[
   {"id":"bde","type":"numeric","label":"Bad debt expense","prompt":"Bad debt expense for the year (₱)?","unit":"₱","points":8},
   {"id":"netar","type":"numeric","label":"Net receivables","prompt":"Net realisable value of receivables (₱)?","unit":"₱","points":8},
   {"id":"dep","type":"numeric","label":"Depreciation","prompt":"Annual straight-line depreciation (₱)?","unit":"₱","points":8},
   {"id":"cogs","type":"numeric","label":"COGS","prompt":"Cost of goods sold (₱)?","unit":"₱","points":8},
   {"id":"rent","type":"numeric","label":"Rent expense","prompt":"Rent expense for the year (₱)?","unit":"₱","points":8},
   {"id":"unearned","type":"numeric","label":"Revenue earned","prompt":"Revenue earned from the advance by 31 Dec (₱)?","unit":"₱","points":8},
   {"id":"equity","type":"numeric","label":"Equity","prompt":"Total equity (₱)?","unit":"₱","points":8},
   {"id":"sal","type":"mcq","label":"Salaries entry","prompt":"The adjusting entry for the unpaid salaries is…","options":[{"id":"a","label":"Dr Salaries payable / Cr Salaries expense"},{"id":"b","label":"Dr Salaries expense / Cr Salaries payable"},{"id":"c","label":"Dr Cash / Cr Salaries payable"},{"id":"d","label":"No entry"}],"points":8},
   {"id":"fifo","type":"mcq","label":"Inventory methods","prompt":"When purchase prices rise, which statement is true?","options":[{"id":"a","label":"FIFO gives lower COGS and higher profit than weighted average"},{"id":"b","label":"FIFO gives higher COGS than weighted average"},{"id":"c","label":"LIFO is permitted under PFRS"},{"id":"d","label":"Inventory methods never affect profit"}],"points":6},
   {"id":"rev","type":"mcq","label":"Revenue model","prompt":"Under PFRS 15, which step comes immediately before recognising revenue?","options":[{"id":"a","label":"Identify the contract"},{"id":"b","label":"Allocate the transaction price"},{"id":"c","label":"Identify performance obligations"},{"id":"d","label":"Collect the cash"}],"points":6},
   {"id":"assess","type":"long_text","label":"Assessment","prompt":"Write a short note to the CFO explaining how the year-end adjustments, receivable allowance and depreciation affect reported profit and the balance sheet.","min_words":80,"points":24}
 ]}'::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug = 'exam-accounting-fundamentals';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('accounting-journal-trial-balance', '{"cash":{"answer":220000,"tolerance_pct":0.5},"ar":{"answer":60000,"tolerance_pct":0.5},"assets":{"answer":600000,"tolerance_pct":0.5},"liab":{"answer":20000,"tolerance_pct":0.5},
   "ni":{"answer":80000,"tolerance_pct":0.5},"equity":{"answer":580000,"tolerance_pct":0.5},"nb":{"answer":"b"},
   "view":{"keywords":["balance|equal|600,000|assets","profit|net income|80,000|margin","liquid|cash|receivable","equity|liabilit"],"keywords_required":3}}'),
 ('accounting-adjusting-entries-case', '{"ins":{"answer":12000,"tolerance_pct":0.5},"unearned":{"answer":45000,"tolerance_pct":0.5},"wages":{"answer":"b"},"sup":{"answer":21000,"tolerance_pct":0.5},
   "int":{"answer":6000,"tolerance_pct":0.5},"profit":{"answer":278000,"tolerance_pct":0.5},
   "why":{"keywords":["period|matching|accrual","profit|income|earnings","liabilit|payable","asset|prepaid|balance sheet","overstat|understat|misstat"],"keywords_required":3}}'),
 ('accounting-inventory-depreciation-case', '{"fifo":{"answer":63000,"tolerance_pct":0.5},"avgc":{"answer":212.5,"tolerance_pct":0.5},"avgcogs":{"answer":63750,"tolerance_pct":0.5},"endinv":{"answer":22000,"tolerance_pct":0.5},
   "gp":{"answer":57000,"tolerance_pct":0.5},"sl":{"answer":160000,"tolerance_pct":0.5},"ddb":{"answer":360000,"tolerance_pct":0.5},"rising":{"answer":"a"},
   "view":{"keywords":["fifo|weighted average|inventory","profit|income|cogs","tax","straight-line|double|declining|accelerated","comparab|consisten|peer"],"keywords_required":3}}'),
 ('exam-accounting-fundamentals', '{"bde":{"answer":100000,"tolerance_pct":0.5},"netar":{"answer":700000,"tolerance_pct":0.5},"dep":{"answer":200000,"tolerance_pct":0.5},"cogs":{"answer":2000000,"tolerance_pct":0.5},
   "rent":{"answer":24000,"tolerance_pct":0.5},"unearned":{"answer":60000,"tolerance_pct":0.5},"equity":{"answer":2100000,"tolerance_pct":0.5},"sal":{"answer":"b"},"fifo":{"answer":"a"},"rev":{"answer":"b"},
   "assess":{"keywords":["adjust|accrual","allowance|bad debt|receivable","depreciation","profit|income|earnings","balance sheet|asset|liabilit"],"keywords_required":4}}')
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certification
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('accounting-fundamentals', 'certification', 'Accounting Fundamentals',
 'From the accounting equation to adjusting entries, inventory, depreciation and revenue.',
 '
The accounting every finance career is built on. Learn to record transactions, adjust for accruals and deferrals, cost inventory, depreciate assets, estimate bad debts and recognise revenue under PFRS 15 — then prove it on real-style cases.

**How it works**
1. Pass each lesson''s video, practice and knowledge check.
2. Pass every hands-on challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).

Your verifiable certificate is issued automatically the moment you pass.
', 'accounting', 'beginner', 4.0, 'Certified Accounting Fundamentals', true, 5)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('accounting-fundamentals', 1, 'lesson', 'accounting-equation-journal', null::numeric),
  ('accounting-fundamentals', 2, 'challenge', 'accounting-journal-trial-balance', null),
  ('accounting-fundamentals', 3, 'lesson', 'adjusting-entries', null),
  ('accounting-fundamentals', 4, 'challenge', 'accounting-adjusting-entries-case', null),
  ('accounting-fundamentals', 5, 'lesson', 'inventory-cogs-methods', null),
  ('accounting-fundamentals', 6, 'lesson', 'depreciation-ppe', null),
  ('accounting-fundamentals', 7, 'challenge', 'accounting-inventory-depreciation-case', null),
  ('accounting-fundamentals', 8, 'lesson', 'receivables-bad-debts', null),
  ('accounting-fundamentals', 9, 'lesson', 'revenue-recognition', null),
  ('accounting-fundamentals', 10, 'exam', 'exam-accounting-fundamentals', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
