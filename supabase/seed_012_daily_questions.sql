-- =====================================================================
-- FINLAB — Content v12: 45 more daily-challenge questions (d46–d90)
-- Run AFTER seed_011. Safe to re-run.
-- =====================================================================
insert into public.daily_questions (slug, category_id, type, prompt, options, unit, explanation)
select v.slug, v.cat, v.type, v.prompt, v.options::jsonb, v.unit, v.explanation
from (values
-- Accounting
('d46','accounting','numeric','Assets ₱1,200k and liabilities ₱450k. Equity (₱k)?',null,'₱k','Assets = liabilities + equity, so equity = 1,200 − 450 = ₱750k.'),
('d47','accounting','numeric','₱18,000 of rent was prepaid for 6 months. Rent expense for 2 months (₱)?',null,'₱','18,000 ÷ 6 × 2 = ₱6,000.'),
('d48','accounting','numeric','Beginning inventory ₱120k, purchases ₱540k, ending inventory ₱150k. COGS (₱k)?',null,'₱k','120 + 540 − 150 = ₱510k.'),
('d49','accounting','mcq','Which account increases with a credit?','[{"id":"a","label":"Cash"},{"id":"b","label":"Rent expense"},{"id":"c","label":"Service revenue"},{"id":"d","label":"Equipment"}]',null,'Revenue, liabilities and equity increase with credits.'),
('d50','accounting','numeric','Equipment costs ₱400k, salvage ₱40k, life 6 years. Straight-line depreciation (₱k per year)?',null,'₱k','(400 − 40) ÷ 6 = ₱60k.'),
('d51','accounting','numeric','Credit sales ₱3,000,000 and bad debts estimated at 1.5%. Bad debt expense (₱)?',null,'₱','3,000,000 × 1.5% = ₱45,000.'),
('d52','accounting','mcq','Wages are earned but unpaid at period end. The adjusting entry is…','[{"id":"a","label":"Dr Wages payable / Cr Wages expense"},{"id":"b","label":"Dr Wages expense / Cr Wages payable"},{"id":"c","label":"Dr Cash / Cr Wages expense"},{"id":"d","label":"No entry"}]',null,'Accrued expense: debit the expense, credit the payable.'),
-- Corporate finance
('d53','valuation','numeric','₱121,000 will be received in 2 years. The discount rate is 10%. Present value (₱)?',null,'₱','121,000 ÷ 1.1² = ₱100,000.'),
('d54','valuation','numeric','₱50,000 grows at 10% a year for 2 years. Future value (₱)?',null,'₱','50,000 × 1.21 = ₱60,500.'),
('d55','financial_analysis','numeric','Receivables ₱600k and annual sales ₱7,300k. DSO (days)?',null,'days','600 ÷ 7,300 × 365 = 30 days.'),
('d56','financial_analysis','numeric','Budget ₱800k, actual ₱880k. Variance as a % of budget?',null,'%','80 ÷ 800 = 10%.'),
('d57','valuation','numeric','A project costs ₱900k and returns ₱300k a year. Payback (years)?',null,'years','900 ÷ 300 = 3 years.'),
('d58','valuation','mcq','A conventional project should be accepted when…','[{"id":"a","label":"NPV is greater than zero"},{"id":"b","label":"NPV is negative"},{"id":"c","label":"Payback is longest"},{"id":"d","label":"IRR is below the discount rate"}]',null,'Positive NPV means the project earns more than its cost of capital.'),
('d59','valuation','numeric','A perpetuity pays ₱4,000 a year. The discount rate is 5%. Present value (₱)?',null,'₱','4,000 ÷ 0.05 = ₱80,000.'),
-- Valuation
('d60','valuation','numeric','Market cap ₱500m, debt ₱200m, cash ₱50m. Enterprise value (₱m)?',null,'₱m','500 + 200 − 50 = ₱650m.'),
('d61','valuation','numeric','EV ₱650m and EBITDA ₱130m. EV/EBITDA (x)?',null,'x','650 ÷ 130 = 5.0x.'),
('d62','valuation','numeric','Share price ₱90 and EPS ₱6. P/E (x)?',null,'x','90 ÷ 6 = 15x.'),
('d63','valuation','numeric','Next-year free cash flow ₱50m, WACC 10%, growth 4% forever. Value (₱m, two decimals)?',null,'₱m','50 ÷ (0.10 − 0.04) = ₱833.33m.'),
('d64','valuation','mcq','A bank''s justified P/B is above 1 when…','[{"id":"a","label":"ROE exceeds the cost of equity"},{"id":"b","label":"ROE is below the cost of equity"},{"id":"c","label":"Assets are growing"},{"id":"d","label":"Dividends are zero"}]',null,'Justified P/B = (ROE − g) ÷ (cost of equity − g): above 1 when ROE beats the cost of equity.'),
-- Banking and credit
('d65','financial_analysis','numeric','NII ₱24bn and average earning assets ₱800bn. NIM (%)?',null,'%','24 ÷ 800 = 3.0%.'),
('d66','financial_analysis','numeric','NPLs ₱15bn and gross loans ₱600bn. NPL ratio (%)?',null,'%','15 ÷ 600 = 2.5%.'),
('d67','financial_analysis','numeric','CET1 capital ₱90bn and RWA ₱750bn. CET1 ratio (%)?',null,'%','90 ÷ 750 = 12%.'),
('d68','financial_analysis','numeric','Debt ₱900m, cash ₱300m, EBITDA ₱200m. Net debt / EBITDA (x)?',null,'x','(900 − 300) ÷ 200 = 3.0x.'),
('d69','financial_analysis','numeric','EBITDA ₱450m and interest expense ₱90m. Interest coverage (x)?',null,'x','450 ÷ 90 = 5.0x.'),
('d70','financial_analysis','mcq','The liquidity coverage ratio must be at least…','[{"id":"a","label":"50%"},{"id":"b","label":"100%"},{"id":"c","label":"150%"},{"id":"d","label":"10%"}]',null,'LCR = HQLA ÷ 30-day net outflows, required to be ≥ 100%.'),
-- Portfolio
('d71','portfolio_management','numeric','40% of a portfolio earns 12% and 60% earns 6%. Portfolio return (%)?',null,'%','0.4 × 12 + 0.6 × 6 = 8.4%.'),
('d72','portfolio_management','numeric','Two positions of 50% each. HHI (decimal)?',null,'','0.5² + 0.5² = 0.50.'),
('d73','portfolio_management','mcq','Two assets with a correlation of +1 give…','[{"id":"a","label":"No diversification benefit"},{"id":"b","label":"Maximum diversification"},{"id":"c","label":"Negative returns"},{"id":"d","label":"Zero volatility"}]',null,'Perfectly correlated assets move together, so combining them doesn''t reduce risk.'),
('d74','portfolio_management','numeric','Return 12%, risk-free 4%, volatility 16%. Sharpe ratio?',null,'','(12 − 4) ÷ 16 = 0.5.'),
-- Investment banking
('d75','investment_banking','numeric','Acquirer net income ₱100m (50m shares); target net income ₱30m; 10m new shares issued. Pro forma EPS (₱, two decimals)?',null,'₱','130 ÷ 60 = ₱2.17 (above the standalone ₱2.00, so accretive).'),
('d76','investment_banking','numeric','A target trades at ₱40 and the offer is ₱52. Premium (%)?',null,'%','(52 − 40) ÷ 40 = 30%.'),
('d77','investment_banking','mcq','Which synergies do acquirers usually trust more?','[{"id":"a","label":"Cost synergies"},{"id":"b","label":"Revenue synergies"},{"id":"c","label":"They are equally certain"},{"id":"d","label":"Neither matters"}]',null,'Cost savings are more controllable; revenue synergies are valued more sceptically.'),
-- Research and pitching
('d78','stock_pitch','numeric','Price ₱50 and target ₱62. Upside (%)?',null,'%','(62 − 50) ÷ 50 = 24%.'),
('d79','stock_pitch','mcq','Which is a catalyst?','[{"id":"a","label":"Strong brand"},{"id":"b","label":"Q4 results on 15 February confirming margin expansion"},{"id":"c","label":"Good management"},{"id":"d","label":"Cheap valuation"}]',null,'A catalyst is a specific, dated event that can close the gap between price and value.'),
('d80','equity_research','numeric','Actual EPS ₱2.20 against consensus ₱2.00. Surprise (%)?',null,'%','(2.20 − 2.00) ÷ 2.00 = 10%.'),
('d81','equity_research','mcq','A variant perception is…','[{"id":"a","label":"A view that differs from consensus, with a reason the market is wrong"},{"id":"b","label":"Agreeing with consensus"},{"id":"c","label":"A forecast without numbers"},{"id":"d","label":"A risk disclosure"}]',null,'It is your differentiated, testable view versus the market.'),
-- Case and committee
('d82','case_competition','numeric','Invest ₱1,000 and receive ₱1,210 in 2 years at a 10% required return. NPV (₱)?',null,'₱','1,210 ÷ 1.21 − 1,000 = 0.'),
('d83','case_competition','numeric','Fixed costs ₱60,000, price ₱50, variable cost ₱20. Break-even units?',null,'units','60,000 ÷ (50 − 20) = 2,000 units.'),
('d84','case_competition','numeric','5 million households, 20% buy, ₱1,200 a year each. Market size (₱m)?',null,'₱m','5m × 20% × 1,200 = ₱1,200m.'),
-- Personal finance
('d85','personal_finance','numeric','Take-home pay ₱45,000. The 20% savings target (₱)?',null,'₱','45,000 × 20% = ₱9,000.'),
('d86','personal_finance','numeric','At 12% a year, about how many years does money take to double (rule of 72)?',null,'years','72 ÷ 12 = 6 years.'),
('d87','personal_finance','numeric','Essential expenses are ₱20,000 a month. A 3-month emergency fund (₱)?',null,'₱','3 × 20,000 = ₱60,000.'),
-- Interview prep
('d88','career_prep','mcq','Which statement starts with net income when using the indirect method?','[{"id":"a","label":"Balance sheet"},{"id":"b","label":"Cash flow statement"},{"id":"c","label":"Income statement"},{"id":"d","label":"Statement of equity only"}]',null,'The operating section of the cash flow statement starts from net income.'),
('d89','career_prep','numeric','Final-year FCF ₱80m, growth 2%, WACC 8%. Gordon growth terminal value (₱m)?',null,'₱m','80 × 1.02 ÷ 0.06 = ₱1,360m.'),
('d90','career_prep','numeric','Equity value ₱1,000m, debt ₱300m, cash ₱100m. Enterprise value (₱m)?',null,'₱m','1,000 + 300 − 100 = ₱1,200m.')
) as v(slug, cat, type, prompt, options, unit, explanation)
on conflict (slug) do update set prompt = excluded.prompt, options = excluded.options, explanation = excluded.explanation, unit = excluded.unit;

insert into public.daily_question_keys (question_id, answer)
select q.id, v.answer::jsonb
from (values
('d46','{"answer":750,"tolerance_pct":0.5}'),('d47','{"answer":6000,"tolerance_pct":0.5}'),('d48','{"answer":510,"tolerance_pct":0.5}'),('d49','{"answer":"c"}'),
('d50','{"answer":60,"tolerance_pct":0.5}'),('d51','{"answer":45000,"tolerance_pct":0.5}'),('d52','{"answer":"b"}'),('d53','{"answer":100000,"tolerance_pct":0.5}'),
('d54','{"answer":60500,"tolerance_pct":0.5}'),('d55','{"answer":30,"tolerance_pct":0.5}'),('d56','{"answer":10,"tolerance_pct":0.5}'),('d57','{"answer":3,"tolerance_pct":0.5}'),
('d58','{"answer":"a"}'),('d59','{"answer":80000,"tolerance_pct":0.5}'),('d60','{"answer":650,"tolerance_pct":0.5}'),('d61','{"answer":5,"tolerance_pct":0.5}'),
('d62','{"answer":15,"tolerance_pct":0.5}'),('d63','{"answer":833.33,"tolerance_pct":0.5}'),('d64','{"answer":"a"}'),('d65','{"answer":3,"tolerance_pct":0.5}'),
('d66','{"answer":2.5,"tolerance_pct":0.5}'),('d67','{"answer":12,"tolerance_pct":0.5}'),('d68','{"answer":3,"tolerance_pct":0.5}'),('d69','{"answer":5,"tolerance_pct":0.5}'),
('d70','{"answer":"b"}'),('d71','{"answer":8.4,"tolerance_pct":0.5}'),('d72','{"answer":0.5,"tolerance_pct":0.5}'),('d73','{"answer":"a"}'),
('d74','{"answer":0.5,"tolerance_pct":0.5}'),('d75','{"answer":2.17,"tolerance_pct":0.5}'),('d76','{"answer":30,"tolerance_pct":0.5}'),('d77','{"answer":"a"}'),
('d78','{"answer":24,"tolerance_pct":0.5}'),('d79','{"answer":"b"}'),('d80','{"answer":10,"tolerance_pct":0.5}'),('d81','{"answer":"a"}'),
('d82','{"answer":0,"tolerance_abs":0.5}'),('d83','{"answer":2000,"tolerance_pct":0.5}'),('d84','{"answer":1200,"tolerance_pct":0.5}'),('d85','{"answer":9000,"tolerance_pct":0.5}'),
('d86','{"answer":6,"tolerance_pct":0.5}'),('d87','{"answer":60000,"tolerance_pct":0.5}'),('d88','{"answer":"b"}'),('d89','{"answer":1360,"tolerance_pct":0.5}'),
('d90','{"answer":1200,"tolerance_pct":0.5}')
) as v(slug, answer)
join public.daily_questions q on q.slug = v.slug
on conflict (question_id) do update set answer = excluded.answer;
