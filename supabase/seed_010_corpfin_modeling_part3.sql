-- seed_010_corpfin_modeling: part 3 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 5. Challenges and exams
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('corpfin-variance-review', 'Budget Review: Visayas Beverages',
 'Compare budget with actuals, find the variances and explain them.',
 '
**Visayas Beverages** (₱ millions), full year:

| | Budget | Actual |
|---|---|---|
| Revenue | 2,000 | 2,150 |
| Cost of goods sold | 1,200 | 1,290 |
| Operating expenses | 500 | 520 |
', 'Answer in ₱ millions. Two decimals where needed.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Variance math","weight":75},{"label":"Commentary","weight":25}]',
 '{"financial_analysis":1.0,"technical_knowledge":0.5,"communication":0.4}',
 '{"tasks":[
   {"id":"revvar","type":"numeric","label":"Revenue variance","prompt":"Revenue variance (₱m)?","unit":"₱m","points":10},
   {"id":"revpct","type":"numeric","label":"Revenue variance %","prompt":"Revenue variance as a % of budget?","unit":"%","points":10},
   {"id":"gpb","type":"numeric","label":"Budget gross profit","prompt":"Budget gross profit (₱m)?","unit":"₱m","points":10},
   {"id":"gpa","type":"numeric","label":"Actual gross profit","prompt":"Actual gross profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebitb","type":"numeric","label":"Budget EBIT","prompt":"Budget operating profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebita","type":"numeric","label":"Actual EBIT","prompt":"Actual operating profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebitpct","type":"numeric","label":"EBIT variance %","prompt":"Operating profit variance as a % of budget (two decimals)?","unit":"%","points":10},
   {"id":"cost","type":"mcq","label":"Cost variance","prompt":"Actual COGS of 1,290 against a budget of 1,200 is…","options":[{"id":"a","label":"Favourable, because revenue was higher"},{"id":"b","label":"Unfavourable in absolute terms, but small relative to the extra revenue"},{"id":"c","label":"Irrelevant to profit"},{"id":"d","label":"A revenue variance"}],"points":5},
   {"id":"comment","type":"long_text","label":"Variance commentary","prompt":"Write variance commentary for management: what drove the result, what you would investigate and what you would change in the forecast.","min_words":50,"points":25}
 ]}'::jsonb, '{corporate_finance}', true, now()),

('corpfin-capital-budget', 'Capital Budget: Mindoro Resort Expansion',
 'Evaluate a resort expansion with NPV, payback and the profitability index.',
 '
**Mindoro Resort** is considering an expansion (₱ thousands). The required return is **10%**.

| Item | Value |
|---|---|
| Initial investment (today) | 5,000 |
| Cash inflow, year 1 | 1,500 |
| Cash inflow, year 2 | 1,800 |
| Cash inflow, year 3 | 2,000 |
| Cash inflow, year 4 | 2,200 |
', 'Answer in ₱ thousands. Two decimals.', 'valuation', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Capital budgeting math","weight":75},{"label":"Decision judgment","weight":25}]',
 '{"valuation":0.8,"financial_analysis":0.7,"decision_making":0.7}',
 '{"tasks":[
   {"id":"pv","type":"numeric","label":"PV of inflows","prompt":"Present value of the four inflows (₱k)?","unit":"₱k","points":18},
   {"id":"npv","type":"numeric","label":"NPV","prompt":"NPV (₱k)?","unit":"₱k","points":18},
   {"id":"pi","type":"numeric","label":"Profitability index","prompt":"Profitability index (two decimals)?","unit":"x","points":12},
   {"id":"pb","type":"numeric","label":"Payback","prompt":"Payback period in years (two decimals, assume cash arrives evenly within a year)?","unit":"years","points":12},
   {"id":"dec","type":"mcq","label":"Decision","prompt":"Based on NPV, you should…","options":[{"id":"a","label":"Accept the expansion"},{"id":"b","label":"Reject the expansion"},{"id":"c","label":"Wait for a lower discount rate"},{"id":"d","label":"Decide on payback alone"}],"points":10},
   {"id":"irr","type":"mcq","label":"IRR","prompt":"Because NPV at 10% is positive, the project''s IRR is…","options":[{"id":"a","label":"Below 10%"},{"id":"b","label":"Exactly 10%"},{"id":"c","label":"Above 10%"},{"id":"d","label":"Cannot be determined"}],"points":10},
   {"id":"risk","type":"long_text","label":"Risks","prompt":"Name the key risks to this project''s cash flows and how you would test them before approving the investment.","min_words":50,"points":20}
 ]}'::jsonb, '{corporate_finance}', true, now()),

('exam-corporate-finance', 'Final Exam: Certified Corporate Finance & FP&A Analyst',
 'Timed exam: time value of money, capital budgeting, variances and working capital.',
 '
**Luzon Packaging** (₱):

| Item | Detail |
|---|---|
| Project | Invest ₱3,000k now; inflows of ₱1,200k a year for 4 years; required return 10% |
| Deposit | ₱500,000 invested at 6% a year for 5 years |
| Revenue | Budget ₱8,000k; actual ₱7,600k |
| Working capital | Annual sales ₱18,250k; annual COGS ₱14,600k; receivables ₱2,500k; inventory ₱4,000k; payables ₱2,000k |
| Perpetuity | ₱120k a year forever at 8% |
', 'You have 60 minutes. Two decimals where needed. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Corporate finance math","weight":78},{"label":"Judgment","weight":22}]',
 '{"financial_analysis":1.0,"valuation":0.6,"technical_knowledge":0.6,"decision_making":0.4}',
 '{"tasks":[
   {"id":"npv","type":"numeric","label":"NPV","prompt":"Project NPV (₱k, two decimals)?","unit":"₱k","points":12},
   {"id":"pb","type":"numeric","label":"Payback","prompt":"Payback period (years)?","unit":"years","points":8},
   {"id":"fv","type":"numeric","label":"Future value","prompt":"Value of the deposit after 5 years (₱)?","unit":"₱","points":8},
   {"id":"revvar","type":"numeric","label":"Revenue variance","prompt":"Revenue variance (₱k, negative if below budget)?","unit":"₱k","points":8},
   {"id":"dso","type":"numeric","label":"DSO","prompt":"DSO (days)?","unit":"days","points":6},
   {"id":"ccc","type":"numeric","label":"CCC","prompt":"Cash conversion cycle (days)?","unit":"days","points":12},
   {"id":"perp","type":"numeric","label":"Perpetuity","prompt":"Present value of the perpetuity (₱k)?","unit":"₱k","points":8},
   {"id":"act","type":"mcq","label":"Shorten the CCC","prompt":"Which action shortens the cash conversion cycle?","options":[{"id":"a","label":"Offering longer customer credit terms"},{"id":"b","label":"Collecting receivables faster"},{"id":"c","label":"Building up extra safety stock"},{"id":"d","label":"Paying suppliers earlier"}],"points":8},
   {"id":"conf","type":"mcq","label":"NPV vs IRR","prompt":"For mutually exclusive projects, when NPV and IRR give different rankings you should…","options":[{"id":"a","label":"Follow IRR"},{"id":"b","label":"Follow NPV"},{"id":"c","label":"Follow payback"},{"id":"d","label":"Pick the cheaper project"}],"points":8},
   {"id":"memo","type":"long_text","label":"Recommendation","prompt":"Write a short recommendation on the project and on the company''s working capital, using your results.","min_words":80,"points":22}
 ]}'::jsonb, '{certification_exam}', true, now()),

('modeling-three-statement-roll', 'Model Roll-Forward: Cavite Cement Mini-Model',
 'Roll a balance sheet forward one year and make it balance.',
 '
**Cavite Cement** (₱ millions). Year-0 balance sheet: cash 200; receivables 150; inventory 100; PP&E 1,000; payables 120; debt 400; equity 930.

Year-1 assumptions: net income 144; dividends 44; capex 150; depreciation 100; receivables 180; inventory 110; payables 140; debt repayment 50.
', 'Answer in ₱ millions. Enter outflows as negative numbers.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Modelling math","weight":80},{"label":"Judgment","weight":20}]',
 '{"financial_analysis":0.8,"technical_knowledge":0.8}',
 '{"tasks":[
   {"id":"ppe","type":"numeric","label":"Closing PP&E","prompt":"Closing PP&E (₱m)?","unit":"₱m","points":12},
   {"id":"equity","type":"numeric","label":"Closing equity","prompt":"Closing equity (₱m)?","unit":"₱m","points":12},
   {"id":"cfo","type":"numeric","label":"CFO","prompt":"Cash flow from operations (₱m)?","unit":"₱m","points":16},
   {"id":"cff","type":"numeric","label":"CFF","prompt":"Cash flow from financing (₱m, negative = outflow)?","unit":"₱m","points":12},
   {"id":"cash","type":"numeric","label":"Closing cash","prompt":"Closing cash (₱m)?","unit":"₱m","points":16},
   {"id":"assets","type":"numeric","label":"Total assets","prompt":"Total assets (₱m)?","unit":"₱m","points":12},
   {"id":"check","type":"mcq","label":"Balance check","prompt":"Total liabilities plus equity should equal…","options":[{"id":"a","label":"Net income"},{"id":"b","label":"Total assets"},{"id":"c","label":"Closing cash"},{"id":"d","label":"Revenue"}],"points":8},
   {"id":"note","type":"long_text","label":"Model notes","prompt":"Explain how the three statements link in this roll-forward and what checks you would build into the model.","min_words":40,"points":12}
 ]}'::jsonb, '{modeling}', true, now()),

('modeling-scenario-valuation', 'Scenario Valuation: Subic Logistics',
 'Value a company across bull, base and bear cases and run a sensitivity.',
 '
**Subic Logistics** (₱ millions unless stated). Net debt ₱300m; 50 million shares.

| Case | Enterprise value | Probability |
|---|---|---|
| Bear | 900 | 25% |
| Base | 1,200 | 50% |
| Bull | 1,500 | 25% |

Sensitivity: a 1-point rise in WACC cuts the **base** enterprise value by 10%.
', 'Answer in ₱ millions, or ₱ per share where stated. Two decimals where needed.', 'valuation', 'tasks', null, 'advanced', 25, 100, 60, 'auto',
 '[{"label":"Valuation math","weight":80},{"label":"Judgment","weight":20}]',
 '{"valuation":1.0,"financial_analysis":0.6,"investment_judgment":0.5}',
 '{"tasks":[
   {"id":"pwev","type":"numeric","label":"Weighted EV","prompt":"Probability-weighted enterprise value (₱m)?","unit":"₱m","points":12},
   {"id":"pweq","type":"numeric","label":"Weighted equity value","prompt":"Probability-weighted equity value (₱m)?","unit":"₱m","points":12},
   {"id":"ps","type":"numeric","label":"Value per share","prompt":"Probability-weighted value per share (₱)?","unit":"₱","points":12},
   {"id":"bear","type":"numeric","label":"Bear per share","prompt":"Bear-case value per share (₱)?","unit":"₱","points":10},
   {"id":"bull","type":"numeric","label":"Bull per share","prompt":"Bull-case value per share (₱)?","unit":"₱","points":10},
   {"id":"sens","type":"numeric","label":"Sensitivity","prompt":"Base-case value per share after the 1-point WACC rise (₱, two decimals)?","unit":"₱","points":14},
   {"id":"type","type":"mcq","label":"Tool","prompt":"Changing only WACC and watching the value is an example of…","options":[{"id":"a","label":"Scenario analysis"},{"id":"b","label":"Sensitivity analysis"},{"id":"c","label":"A balance check"},{"id":"d","label":"Variance analysis"}],"points":10},
   {"id":"view","type":"long_text","label":"Conclusion","prompt":"The shares trade at ₱15. Using your results, give a view and name the assumptions that matter most.","min_words":50,"points":20}
 ]}'::jsonb, '{modeling}', true, now()),

('exam-financial-modeling', 'Final Exam: Certified Financial Modeling Analyst',
 'Timed exam: roll-forward, revenue drivers, scenario valuation and model integrity.',
 '
**Panay Foods** (₱ thousands unless stated).

Year-0 balance sheet: cash 100; receivables 80; PP&E 600; payables 60; debt 200; equity 520. Year-1: net income 70; dividends 20; capex 90; depreciation 60; receivables 95; payables 70; debt unchanged.

Revenue: year-1 volume 20,000 units at ₱300. In year 2, volume grows **8%** and price grows **3%**.

Valuation: bull ₱140 (30%), base ₱110 (50%), bear ₱60 (20%) per share.
', 'You have 60 minutes. Two decimals where needed. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Modelling math","weight":80},{"label":"Judgment","weight":20}]',
 '{"financial_analysis":1.0,"valuation":0.5,"technical_knowledge":0.8}',
 '{"tasks":[
   {"id":"ppe","type":"numeric","label":"Closing PP&E","prompt":"Closing PP&E (₱k)?","unit":"₱k","points":7},
   {"id":"equity","type":"numeric","label":"Closing equity","prompt":"Closing equity (₱k)?","unit":"₱k","points":7},
   {"id":"cfo","type":"numeric","label":"CFO","prompt":"Cash flow from operations (₱k)?","unit":"₱k","points":9},
   {"id":"cash","type":"numeric","label":"Closing cash","prompt":"Closing cash (₱k)?","unit":"₱k","points":9},
   {"id":"assets","type":"numeric","label":"Total assets","prompt":"Total assets (₱k)?","unit":"₱k","points":9},
   {"id":"rev2","type":"numeric","label":"Year-2 revenue","prompt":"Year-2 revenue (₱)?","unit":"₱","points":9},
   {"id":"gr","type":"numeric","label":"Revenue growth","prompt":"Revenue growth in year 2 (%, two decimals)?","unit":"%","points":9},
   {"id":"ev","type":"numeric","label":"Expected value","prompt":"Probability-weighted value per share (₱)?","unit":"₱","points":9},
   {"id":"chk","type":"mcq","label":"Balance check","prompt":"A balance check that shows a non-zero difference means…","options":[{"id":"a","label":"The model is correct"},{"id":"b","label":"There is an error in how the statements are linked"},{"id":"c","label":"Revenue is too high"},{"id":"d","label":"Taxes are missing"}],"points":8},
   {"id":"hs","type":"mcq","label":"Forecast quality","prompt":"Revenue growth jumps from 8% to 35% in year 3 with no new driver. This is…","options":[{"id":"a","label":"A conservative assumption"},{"id":"b","label":"A hockey stick that needs a supporting driver"},{"id":"c","label":"A sensitivity"},{"id":"d","label":"Normal seasonality"}],"points":8},
   {"id":"memo","type":"long_text","label":"Model review","prompt":"Write a short review of this model: how the statements link, how you would check integrity and which assumptions you would stress.","min_words":80,"points":16}
 ]}'::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug in ('exam-corporate-finance', 'exam-financial-modeling');

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('corpfin-variance-review', '{"revvar":{"answer":150,"tolerance_pct":0.5},"revpct":{"answer":7.5,"tolerance_pct":0.5},"gpb":{"answer":800,"tolerance_pct":0.5},"gpa":{"answer":860,"tolerance_pct":0.5},
   "ebitb":{"answer":300,"tolerance_pct":0.5},"ebita":{"answer":340,"tolerance_pct":0.5},"ebitpct":{"answer":13.33,"tolerance_pct":1},"cost":{"answer":"b"},
   "comment":{"keywords":["revenue|volume|price","cost|cogs|margin","favourable|favorable|unfavourable|unfavorable","forecast|reforecast|action","investigate|driver|cause"],"keywords_required":3}}'),
 ('corpfin-capital-budget', '{"pv":{"answer":5856.5,"tolerance_pct":0.5},"npv":{"answer":856.5,"tolerance_pct":1},"pi":{"answer":1.17,"tolerance_pct":1},"pb":{"answer":2.85,"tolerance_pct":1.5},"dec":{"answer":"a"},"irr":{"answer":"c"},
   "risk":{"keywords":["demand|revenue|occupancy|volume","sensitiv|scenario|downside","cost|capex|overrun","discount rate|wacc|cost of capital","tourism|seasonal|competition|risk"],"keywords_required":3}}'),
 ('exam-corporate-finance', '{"npv":{"answer":803.84,"tolerance_pct":1},"pb":{"answer":2.5,"tolerance_pct":0.5},"fv":{"answer":669113,"tolerance_pct":0.5},"revvar":{"answer":-400,"tolerance_pct":0.5},"dso":{"answer":50,"tolerance_pct":0.5},
   "ccc":{"answer":100,"tolerance_pct":0.5},"perp":{"answer":1500,"tolerance_pct":0.5},"act":{"answer":"b"},"conf":{"answer":"b"},
   "memo":{"keywords":["npv|net present value","payback","accept|approve|recommend","working capital|cash conversion|ccc","receivable|inventory|collect|dso|dio"],"keywords_required":4}}'),
 ('modeling-three-statement-roll', '{"ppe":{"answer":1050,"tolerance_pct":0.5},"equity":{"answer":1030,"tolerance_pct":0.5},"cfo":{"answer":224,"tolerance_pct":0.5},"cff":{"answer":-94,"tolerance_pct":0.5},"cash":{"answer":180,"tolerance_pct":0.5},
   "assets":{"answer":1520,"tolerance_pct":0.5},"check":{"answer":"b"},
   "note":{"keywords":["net income|retained earnings","cash flow|cash","balance|check","depreciation|capex|ppe","working capital|receivable|payable"],"keywords_required":3}}'),
 ('modeling-scenario-valuation', '{"pwev":{"answer":1200,"tolerance_pct":0.5},"pweq":{"answer":900,"tolerance_pct":0.5},"ps":{"answer":18,"tolerance_pct":0.5},"bear":{"answer":12,"tolerance_pct":0.5},"bull":{"answer":24,"tolerance_pct":0.5},
   "sens":{"answer":15.6,"tolerance_pct":1},"type":{"answer":"b"},
   "view":{"keywords":["upside|undervalued|discount|buy","wacc|discount rate","scenario|bear|bull|base","net debt|leverage","probab"],"keywords_required":3}}'),
 ('exam-financial-modeling', '{"ppe":{"answer":630,"tolerance_pct":0.5},"equity":{"answer":570,"tolerance_pct":0.5},"cfo":{"answer":125,"tolerance_pct":0.5},"cash":{"answer":115,"tolerance_pct":0.5},"assets":{"answer":840,"tolerance_pct":0.5},
   "rev2":{"answer":6674400,"tolerance_pct":0.5},"gr":{"answer":11.24,"tolerance_pct":1},"ev":{"answer":109,"tolerance_pct":0.5},"chk":{"answer":"b"},"hs":{"answer":"b"},
   "memo":{"keywords":["link|flow|retained earnings","balance|check","cash flow|cash","assumption|input|driver","sensitiv|scenario|stress"],"keywords_required":4}}')
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certifications
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('corporate-finance-fpa', 'certification', 'Corporate Finance & FP&A',
 'Time value of money, capital budgeting, variance analysis and working capital.',
 '
The toolkit of a corporate finance and FP&A analyst: discount cash flows, evaluate projects with NPV and IRR, run budget-versus-actual variance analysis, and manage working capital through the cash conversion cycle.

1. Pass each lesson''s video, practice and knowledge check.
2. Pass every case challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
', 'financial_analysis', 'intermediate', 3.5, 'Certified Corporate Finance & FP&A Analyst', true, 6),
('financial-modeling', 'certification', 'Financial Modeling',
 'Structure a model, forecast revenue from drivers and test it with scenarios.',
 '
How professionals build models that can be trusted: clean structure, linked three statements, driver-based forecasts, integrity checks, and scenario and sensitivity analysis.

1. Pass each lesson''s video, practice and knowledge check.
2. Pass every case challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
', 'financial_analysis', 'advanced', 3.5, 'Certified Financial Modeling Analyst', true, 7)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('corporate-finance-fpa', 1, 'lesson', 'time-value-of-money', null::numeric),
  ('corporate-finance-fpa', 2, 'lesson', 'cost-of-capital', null),
  ('corporate-finance-fpa', 3, 'lesson', 'capital-budgeting-npv-irr', null),
  ('corporate-finance-fpa', 4, 'challenge', 'corpfin-capital-budget', null),
  ('corporate-finance-fpa', 5, 'lesson', 'budgeting-variance-fpa', null),
  ('corporate-finance-fpa', 6, 'lesson', 'working-capital-ccc', null),
  ('corporate-finance-fpa', 7, 'challenge', 'corpfin-variance-review', null),
  ('corporate-finance-fpa', 8, 'exam', 'exam-corporate-finance', 70),

  ('financial-modeling', 1, 'lesson', 'three-statements', null),
  ('financial-modeling', 2, 'lesson', 'model-structure', null),
  ('financial-modeling', 3, 'challenge', 'modeling-three-statement-roll', null),
  ('financial-modeling', 4, 'lesson', 'revenue-drivers-forecasting', null),
  ('financial-modeling', 5, 'lesson', 'scenarios-sensitivity', null),
  ('financial-modeling', 6, 'challenge', 'modeling-scenario-valuation', null),
  ('financial-modeling', 7, 'exam', 'exam-financial-modeling', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
