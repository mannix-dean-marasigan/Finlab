-- seed_010_corpfin_modeling: part 1 of 3. Run the parts in order.
-- =====================================================================
-- FINLAB — Content v10: Corporate Finance & FP&A and Financial Modeling
--   7 lessons (video + 10-question check + 2 practice activities + 10 flashcards),
--   5 case challenges, 2 timed final exams, 2 certifications.
-- Run AFTER seed_009. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lessons
-- ---------------------------------------------------------------------
insert into public.lessons (slug, title, summary, category_id, difficulty, estimated_minutes, sort_order, related_challenge_slugs, video_urls, body) values
('time-value-of-money', 'Time Value of Money', 'Present value, future value, annuities, perpetuities and effective rates.', 'valuation', 'beginner', 15, 30,
 '{corpfin-capital-budget}', '{https://www.youtube.com/watch?v=Y815bf-jUQg}', '
## A peso today is worth more than a peso tomorrow
Money you hold now can be invested, and prices rise over time. So cash flows at different dates must be moved to a **common date** before they are compared.

## The core formulas
- **Future value:** FV = PV × (1 + r)ⁿ
- **Present value:** PV = FV ÷ (1 + r)ⁿ
- **Annuity (level payment C for n periods):** PV = C × [1 − (1 + r)⁻ⁿ] ÷ r
- **Perpetuity (level payment forever):** PV = C ÷ r

## Rate conventions
- **Rule of 72:** years to double ≈ 72 ÷ rate (%).
- **Effective annual rate:** EAR = (1 + nominal ÷ m)ᵐ − 1, where m is compounding periods per year. More frequent compounding means a higher EAR.

## Example
₱100,000 at 8% for 3 years: FV = 100,000 × 1.08³ = **₱125,971**. A ₱200,000 payment in 4 years at 10% is worth 200,000 ÷ 1.1⁴ = **₱136,603** today.

> Every valuation in finance — bonds, stocks, projects — is time value of money applied to a stream of cash flows.
'),
('budgeting-variance-fpa', 'Budgeting & Variance Analysis (FP&A)', 'Budgets, favourable vs unfavourable variances, price-volume analysis and rolling forecasts.', 'financial_analysis', 'intermediate', 15, 31,
 '{corpfin-variance-review}', '{https://www.youtube.com/watch?v=cnUyZ2dZSEk}', '
## What FP&A does
Financial planning & analysis sets the **budget**, tracks **actuals** against it, explains the gaps and updates the **forecast**.

## Variances
- **Variance = Actual − Budget**; **variance % = Variance ÷ Budget**.
- **Favourable:** more revenue or profit than planned, or lower costs. **Unfavourable:** the opposite. (A cost *above* budget is unfavourable.)

## Price-volume decomposition
- **Volume variance** = (Actual units − Budget units) × **Budget price**
- **Price variance** = (Actual price − Budget price) × **Actual units**
- The two add up to the total revenue variance.

## Good practice
- Compare like with like: same periods, same chart of accounts.
- Use **materiality thresholds** so effort goes to the big gaps.
- A **flexible budget** restates the budget at the actual activity level.
- A **rolling forecast** is refreshed regularly (for example, always looking 12 months ahead).
- Commentary should state the **cause**, whether it is one-off or recurring, and the action.

> A variance is a question, not an answer: always explain *why*.
'),
('capital-budgeting-npv-irr', 'Capital Budgeting: NPV, IRR & Payback', 'Choosing projects with NPV, IRR, profitability index and payback.', 'valuation', 'intermediate', 15, 32,
 '{corpfin-capital-budget}', '{https://www.youtube.com/watch?v=y3m8FAGt7Qo}', '
## The question
Should we spend cash today for cash flows later? Discount the future cash flows at the **cost of capital** and compare.

## The tools
- **NPV** = Σ CFₜ ÷ (1 + r)ᵗ − Initial investment. **Accept if NPV > 0.**
- **IRR** = the discount rate that makes NPV = 0. Accept if IRR > required return.
- **Profitability index** = PV of inflows ÷ Investment. Accept if PI > 1.
- **Payback** = years to recover the investment. Simple, but ignores the time value of money and cash flows after payback. **Discounted payback** fixes the first flaw.

## Which should I trust?
**NPV** measures the value created in pesos and is the most reliable. IRR can mislead for mutually exclusive projects or unconventional cash flows; when NPV and IRR disagree, **follow NPV**.

## Example
Invest ₱1,000k to receive ₱450k a year for 3 years at 10%: PV of inflows = 450 × 2.4869 = ₱1,119k, so NPV = **+₱119k**.

> A project that earns exactly the cost of capital has an NPV of zero — it creates no value.
'),
('working-capital-ccc', 'Working Capital & the Cash Conversion Cycle', 'DSO, DIO, DPO and how fast a business turns inventory into cash.', 'financial_analysis', 'intermediate', 15, 33,
 '{corpfin-variance-review}', '{https://www.youtube.com/watch?v=JLxy4cs8Kr8}', '
## Cash is tied up in operations
**Net working capital** = Current assets − Current liabilities. The faster a business turns stock and receivables into cash, the less funding it needs.

## The three days measures
- **DSO** = Receivables ÷ Sales × 365 (how long customers take to pay)
- **DIO** = Inventory ÷ COGS × 365 (how long stock sits)
- **DPO** = Payables ÷ COGS × 365 (how long we take to pay suppliers)

> **Cash conversion cycle = DIO + DSO − DPO**

## Levers
- Collect faster: tighter credit, early-payment discounts.
- Hold less stock: better forecasting, just-in-time ordering.
- Pay later: longer supplier terms (without damaging relationships).

A **negative CCC** means customers pay before suppliers must be paid — the business is financed by its suppliers. Fast-growing companies often need more working capital, because growth ties up cash in stock and receivables.

> Cutting DSO by 10 days frees 10 days of sales in cash.
'),
('model-structure', 'Financial Model Structure & the Three-Statement Link', 'Inputs, schedules, statements, checks and the links between them.', 'financial_analysis', 'intermediate', 15, 34,
 '{modeling-three-statement-roll}', '{https://www.youtube.com/watch?v=-pws4pPiDFs}', '
## Structure: inputs → calculations → outputs
- **Inputs:** every assumption in one clearly labelled place (growth, margins, working-capital days, capex, tax). Blue font for hard-coded inputs.
- **Calculations:** supporting schedules (revenue build, PP&E, working capital, debt) and the three statements.
- **Outputs:** valuation, summary charts, scenarios.
- **Never hard-code a number inside a formula.** One formula per row, consistent across columns.

## How the statements link
- **Net income** → flows into **retained earnings** (less dividends).
- **Depreciation & capex** → roll the **PP&E schedule**: closing = opening + capex − depreciation.
- **Working-capital changes** → adjust cash flow from operations.
- **Cash flow statement** ends with closing cash → **balance sheet cash**.

## Roll-forwards
Closing retained earnings = opening + net income − dividends. CFO = net income + D&A − increase in receivables + increase in payables.

## Integrity
- **Balance check:** Assets − (Liabilities + Equity) = 0 in every period.
- A **revolver** borrows automatically if cash would go negative.
- Beware circular references (interest on average balances) — use a switch.

> A model that doesn''t balance is wrong; a model that balances can still be wrong, so test the assumptions too.
'),
('revenue-drivers-forecasting', 'Driver-Based Revenue Forecasting', 'Price × volume, subscriptions, market share and realistic growth.', 'financial_analysis', 'intermediate', 15, 35,
 '{modeling-scenario-valuation}', '{https://www.youtube.com/watch?v=yiWAE7aE6zk}', '
## Forecast drivers, not totals
A growth rate alone hides what must be true. Build revenue from its **drivers** so each assumption can be tested.

## Common builds
- **Price × volume:** units × price per unit. Growth ≈ (1 + volume growth)(1 + price growth) − 1.
- **Subscriptions:** closing customers = opening × (1 − churn) + new customers; revenue = customers × ARPU.
- **Retail:** same-store sales growth + contribution from new stores.
- **Market share:** market size × share.

## CAGR
CAGR = (End ÷ Start)^(1/years) − 1.

## Sanity checks
Compare with **history**, **capacity** and **market size**. A **hockey stick** (sudden acceleration with no new driver) is a red flag, as is share doubling with no new product.

> Use at least two ways to forecast revenue and check they agree.
'),
('scenarios-sensitivity', 'Scenarios & Sensitivity Analysis', 'Base, bull and bear cases, sensitivity tables and probability-weighted value.', 'financial_analysis', 'advanced', 15, 36,
 '{modeling-scenario-valuation}', '{https://www.youtube.com/watch?v=UsbVUOnBy3Y}', '
## Two different tools
- **Sensitivity analysis** changes **one input at a time** (or two, in a data table) to see how much the output moves. A **tornado chart** ranks inputs by impact.
- **Scenario analysis** changes **several linked inputs together** to tell a coherent story: **bull**, **base**, **bear**.

## Building scenarios
Put all scenario drivers on the inputs sheet with a **scenario switch** (1/2/3 using CHOOSE or INDEX) so the whole model flips together. Keep each case internally consistent: growth, margins, working capital and capex should move in the same direction.

## Probability-weighted value
Expected value = Σ (probability × value). Example: 25% × ₱180 + 50% × ₱120 + 25% × ₱60 = **₱120**.

## Stress the right things
A good bear case tests **liquidity and covenants**, not only earnings.

> Sensitivities show which assumption matters; scenarios show what could happen.
')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('time-value-of-money',
 '[{"id":"q1","type":"numeric","label":"Future value","prompt":"₱100,000 is invested at 8% a year for 3 years. Future value (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Present value","prompt":"₱200,000 will be received in 4 years. The discount rate is 10%. Present value (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"mcq","label":"Discount rate","prompt":"A higher discount rate makes a future cash flow worth…","options":[{"id":"a","label":"More today"},{"id":"b","label":"Less today"},{"id":"c","label":"The same today"},{"id":"d","label":"More in the future"}],"points":10},
     {"id":"q4","type":"numeric","label":"Annuity","prompt":"₱10,000 is received at the end of each of the next 3 years. Discount rate 10%. Present value (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"numeric","label":"Perpetuity","prompt":"A perpetuity pays ₱5,000 a year forever. The discount rate is 8%. Present value (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Today vs later","prompt":"At any positive interest rate, ₱100 today is worth…","options":[{"id":"a","label":"Less than ₱100 in a year"},{"id":"b","label":"More than ₱100 in a year"},{"id":"c","label":"Exactly ₱100 in a year"},{"id":"d","label":"It depends on inflation only"}],"points":10},
     {"id":"q7","type":"numeric","label":"Rule of 72","prompt":"At a 9% annual return, roughly how many years does money take to double (rule of 72)?","unit":"years","points":10},
     {"id":"q8","type":"mcq","label":"Compounding","prompt":"At the same nominal rate, more frequent compounding gives…","options":[{"id":"a","label":"A lower effective annual rate"},{"id":"b","label":"A higher effective annual rate"},{"id":"c","label":"The same effective annual rate"},{"id":"d","label":"A negative rate"}],"points":10},
     {"id":"q9","type":"numeric","label":"Effective rate","prompt":"A 12% nominal rate is compounded monthly. Effective annual rate (%, two decimals)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Why it exists","prompt":"The time value of money exists because…","options":[{"id":"a","label":"Money today can be invested to earn a return, and prices change over time"},{"id":"b","label":"Banks set arbitrary rates"},{"id":"c","label":"Future cash is always certain"},{"id":"d","label":"Taxes apply only to future cash"}],"points":10}]',
 '{"q1":{"answer":125971,"tolerance_pct":0.5},"q2":{"answer":136603,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":24869,"tolerance_pct":0.5},"q5":{"answer":62500,"tolerance_pct":0.5},"q6":{"answer":"b"},"q7":{"answer":8,"tolerance_pct":1},"q8":{"answer":"b"},"q9":{"answer":12.68,"tolerance_pct":0.5},"q10":{"answer":"a"}}'),
('budgeting-variance-fpa',
 '[{"id":"q1","type":"numeric","label":"Variance","prompt":"Revenue budget ₱5,000k; actual ₱5,400k. Variance (₱k)?","unit":"₱k","points":10},
     {"id":"q2","type":"numeric","label":"Variance %","prompt":"Same figures: variance as a % of budget?","unit":"%","points":10},
     {"id":"q3","type":"mcq","label":"Cost variance","prompt":"A cost line comes in 12% above budget. That variance is…","options":[{"id":"a","label":"Favourable"},{"id":"b","label":"Unfavourable"},{"id":"c","label":"Neutral"},{"id":"d","label":"Not a variance"}],"points":10},
     {"id":"q4","type":"numeric","label":"Volume variance","prompt":"Budget: 10,000 units at ₱50. Actual: 11,000 units at ₱48. Volume variance on revenue (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"numeric","label":"Price variance","prompt":"Using the same facts, by how much did the lower price reduce revenue (₱, as a positive number)?","unit":"₱","points":10},
     {"id":"q6","type":"numeric","label":"Total variance","prompt":"Using the same facts, total revenue variance (actual − budget) (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Flexible budget","prompt":"A flexible budget…","options":[{"id":"a","label":"Is never revised"},{"id":"b","label":"Is restated at the actual activity level"},{"id":"c","label":"Ignores volume"},{"id":"d","label":"Replaces the actuals"}],"points":10},
     {"id":"q8","type":"mcq","label":"Materiality","prompt":"Why set a materiality threshold for variance review?","options":[{"id":"a","label":"So effort goes to the large gaps"},{"id":"b","label":"To hide small errors permanently"},{"id":"c","label":"Because small variances are always wrong"},{"id":"d","label":"To avoid writing commentary"}],"points":10},
     {"id":"q9","type":"mcq","label":"Rolling forecast","prompt":"A rolling forecast is…","options":[{"id":"a","label":"Updated regularly and always looks a fixed period ahead"},{"id":"b","label":"Prepared once a year"},{"id":"c","label":"The same as the budget"},{"id":"d","label":"A historical report"}],"points":10},
     {"id":"q10","type":"numeric","label":"Gross profit variance","prompt":"Budget: revenue ₱5,000k at a 40% gross margin. Actual: revenue ₱5,400k at 38%. Gross profit variance (₱k)?","unit":"₱k","points":10}]',
 '{"q1":{"answer":400,"tolerance_pct":0.5},"q2":{"answer":8,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":50000,"tolerance_pct":0.5},"q5":{"answer":22000,"tolerance_pct":0.5},"q6":{"answer":28000,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"a"},"q9":{"answer":"a"},"q10":{"answer":52,"tolerance_pct":0.5}}'),
('capital-budgeting-npv-irr',
 '[{"id":"q1","type":"numeric","label":"NPV","prompt":"A project costs ₱1,000k and returns ₱450k a year for 3 years. Required return 10%. NPV (₱k, two decimals)?","unit":"₱k","points":10},
     {"id":"q2","type":"mcq","label":"Decision rule","prompt":"Accept a conventional project when…","options":[{"id":"a","label":"NPV is greater than zero"},{"id":"b","label":"NPV is negative"},{"id":"c","label":"Payback is more than 10 years"},{"id":"d","label":"IRR is below the cost of capital"}],"points":10},
     {"id":"q3","type":"numeric","label":"Payback","prompt":"A project costs ₱600k and returns ₱200k a year. Payback period (years)?","unit":"years","points":10},
     {"id":"q4","type":"mcq","label":"IRR","prompt":"The IRR is…","options":[{"id":"a","label":"The discount rate at which NPV equals zero"},{"id":"b","label":"The average annual profit"},{"id":"c","label":"The cost of debt"},{"id":"d","label":"The payback period as a percentage"}],"points":10},
     {"id":"q5","type":"mcq","label":"IRR vs cost of capital","prompt":"IRR is 14% and the cost of capital is 11%. For a conventional project you should…","options":[{"id":"a","label":"Accept"},{"id":"b","label":"Reject"},{"id":"c","label":"Ignore NPV"},{"id":"d","label":"Wait for payback"}],"points":10},
     {"id":"q6","type":"numeric","label":"Profitability index","prompt":"PV of inflows ₱1,320k; investment ₱1,100k. Profitability index?","unit":"x","points":10},
     {"id":"q7","type":"mcq","label":"Payback weakness","prompt":"A weakness of the payback period is that it…","options":[{"id":"a","label":"Ignores the time value of money and cash flows after payback"},{"id":"b","label":"Needs a discount rate"},{"id":"c","label":"Is too complex"},{"id":"d","label":"Always rejects good projects"}],"points":10},
     {"id":"q8","type":"numeric","label":"Lump-sum NPV","prompt":"Invest ₱500k now and receive ₱800k in 3 years. Required return 12%. NPV (₱k, two decimals)?","unit":"₱k","points":10},
     {"id":"q9","type":"mcq","label":"Conflicts","prompt":"For mutually exclusive projects where NPV and IRR disagree, prefer…","options":[{"id":"a","label":"IRR"},{"id":"b","label":"NPV"},{"id":"c","label":"Payback"},{"id":"d","label":"Accounting profit"}],"points":10},
     {"id":"q10","type":"numeric","label":"Discounted payback","prompt":"Cost ₱300k; inflows ₱150k a year; discount rate 10%. In which year (1, 2, 3…) is the discounted payback reached?","unit":"year","points":10}]',
 '{"q1":{"answer":119.08,"tolerance_pct":1},"q2":{"answer":"a"},"q3":{"answer":3,"tolerance_pct":0.5},"q4":{"answer":"a"},"q5":{"answer":"a"},"q6":{"answer":1.2,"tolerance_pct":0.5},"q7":{"answer":"a"},"q8":{"answer":69.42,"tolerance_pct":1},"q9":{"answer":"b"},"q10":{"answer":3,"tolerance_pct":0.5}}'),
('working-capital-ccc',
 '[{"id":"q1","type":"numeric","label":"DSO","prompt":"Annual sales ₱7,300k; receivables ₱1,000k. DSO (days, 365-day year)?","unit":"days","points":10},
     {"id":"q2","type":"numeric","label":"DIO","prompt":"Annual COGS ₱5,475k; inventory ₱1,500k. DIO (days)?","unit":"days","points":10},
     {"id":"q3","type":"numeric","label":"DPO","prompt":"Annual COGS ₱5,475k; payables ₱750k. DPO (days)?","unit":"days","points":10},
     {"id":"q4","type":"numeric","label":"CCC","prompt":"Using the three results above, the cash conversion cycle (days)?","unit":"days","points":10},
     {"id":"q5","type":"mcq","label":"Supplier terms","prompt":"Negotiating longer supplier payment terms…","options":[{"id":"a","label":"Lengthens the cash conversion cycle"},{"id":"b","label":"Shortens the cash conversion cycle"},{"id":"c","label":"Has no effect"},{"id":"d","label":"Raises DSO"}],"points":10},
     {"id":"q6","type":"mcq","label":"Negative CCC","prompt":"A negative cash conversion cycle means…","options":[{"id":"a","label":"The business is insolvent"},{"id":"b","label":"Customers pay before suppliers must be paid"},{"id":"c","label":"Inventory is negative"},{"id":"d","label":"Sales are falling"}],"points":10},
     {"id":"q7","type":"numeric","label":"Cash released","prompt":"Daily sales are ₱20,000. Cutting DSO by 10 days releases how much cash (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"Net working capital","prompt":"Current assets ₱3.0m; current liabilities ₱1.8m. Net working capital (₱m)?","unit":"₱m","points":10},
     {"id":"q9","type":"mcq","label":"Growth","prompt":"A fast-growing company usually needs…","options":[{"id":"a","label":"Less working capital"},{"id":"b","label":"More working capital, as stock and receivables absorb cash"},{"id":"c","label":"No change in working capital"},{"id":"d","label":"Negative inventory"}],"points":10},
     {"id":"q10","type":"mcq","label":"Lengthening the cycle","prompt":"Which action lengthens the cash conversion cycle?","options":[{"id":"a","label":"Offering customers longer credit terms"},{"id":"b","label":"Collecting overdue invoices faster"},{"id":"c","label":"Holding less stock"},{"id":"d","label":"Paying suppliers later"}],"points":10}]',
 '{"q1":{"answer":50,"tolerance_pct":0.5},"q2":{"answer":100,"tolerance_pct":0.5},"q3":{"answer":50,"tolerance_pct":0.5},"q4":{"answer":100,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"b"},"q7":{"answer":200000,"tolerance_pct":0.5},"q8":{"answer":1.2,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"a"}}'),
('model-structure',
 '[{"id":"q1","type":"mcq","label":"Colour code","prompt":"By modelling convention, blue font marks…","options":[{"id":"a","label":"Formulas"},{"id":"b","label":"Hard-coded inputs"},{"id":"c","label":"Links to other sheets"},{"id":"d","label":"Errors"}],"points":10},
     {"id":"q2","type":"mcq","label":"Assumptions","prompt":"Where should a model''s assumptions live?","options":[{"id":"a","label":"Typed inside formulas"},{"id":"b","label":"In one clearly labelled inputs area"},{"id":"c","label":"Scattered across the statements"},{"id":"d","label":"In comments only"}],"points":10},
     {"id":"q3","type":"mcq","label":"Net income link","prompt":"Net income flows to which balance sheet item?","options":[{"id":"a","label":"Retained earnings"},{"id":"b","label":"Accounts payable"},{"id":"c","label":"PP&E"},{"id":"d","label":"Inventory"}],"points":10},
     {"id":"q4","type":"numeric","label":"PP&E roll-forward","prompt":"Opening PP&E 1,000; capex 200; depreciation 150. Closing PP&E?","unit":"","points":10},
     {"id":"q5","type":"numeric","label":"Retained earnings","prompt":"Opening retained earnings 500; net income 120; dividends 40. Closing retained earnings?","unit":"","points":10},
     {"id":"q6","type":"mcq","label":"Balance check","prompt":"The balance check in a model tests that…","options":[{"id":"a","label":"Revenue equals costs"},{"id":"b","label":"Assets minus (liabilities + equity) equals zero in every period"},{"id":"c","label":"Cash is positive"},{"id":"d","label":"Growth is below 10%"}],"points":10},
     {"id":"q7","type":"numeric","label":"CFO","prompt":"Net income 100; D&A 30; receivables up 20; payables up 10. Cash flow from operations?","unit":"","points":10},
     {"id":"q8","type":"mcq","label":"Revolver","prompt":"A revolver in a model…","options":[{"id":"a","label":"Repays all debt immediately"},{"id":"b","label":"Borrows automatically when cash would go negative"},{"id":"c","label":"Calculates depreciation"},{"id":"d","label":"Replaces the balance sheet"}],"points":10},
     {"id":"q9","type":"mcq","label":"Hard-codes","prompt":"Why is hard-coding a number inside a formula risky?","options":[{"id":"a","label":"It hides an assumption and is easily missed when inputs change"},{"id":"b","label":"It makes the file larger"},{"id":"c","label":"It is not allowed in Excel"},{"id":"d","label":"It always changes the result"}],"points":10},
     {"id":"q10","type":"numeric","label":"Closing cash","prompt":"Opening cash 250; CFO 120; CFI −200; CFF +50. Closing cash?","unit":"","points":10}]',
 '{"q1":{"answer":"b"},"q2":{"answer":"b"},"q3":{"answer":"a"},"q4":{"answer":1050,"tolerance_pct":0.5},"q5":{"answer":580,"tolerance_pct":0.5},"q6":{"answer":"b"},"q7":{"answer":120,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":"a"},"q10":{"answer":220,"tolerance_pct":0.5}}'),
('revenue-drivers-forecasting',
 '[{"id":"q1","type":"numeric","label":"Price × volume","prompt":"1,000 units are sold at ₱250. Revenue (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Combined growth","prompt":"Units grow 10% and price grows 5%. Revenue growth (%, one decimal)?","unit":"%","points":10},
     {"id":"q3","type":"mcq","label":"Why drivers","prompt":"Why forecast revenue from drivers rather than a single growth rate?","options":[{"id":"a","label":"Each assumption is explicit and can be tested"},{"id":"b","label":"It always gives a higher forecast"},{"id":"c","label":"It needs fewer inputs"},{"id":"d","label":"It avoids checking history"}],"points":10},
     {"id":"q4","type":"numeric","label":"Customers","prompt":"Opening 10,000 customers; 2% churn a month; 500 new customers. Closing customers after month 1?","unit":"","points":10},
     {"id":"q5","type":"numeric","label":"Subscription revenue","prompt":"Month-1 revenue with 10,300 customers at ₱300 ARPU (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Retail growth","prompt":"A retailer''s revenue growth is best decomposed into…","options":[{"id":"a","label":"Same-store growth plus new-store contribution"},{"id":"b","label":"Debt and equity"},{"id":"c","label":"Gross and net margin"},{"id":"d","label":"Tax and interest"}],"points":10},
     {"id":"q7","type":"numeric","label":"Market share","prompt":"A ₱40bn market grows 6% in year 2. A firm holds 12.5% share in year 2. Its year-2 revenue (₱bn)?","unit":"₱bn","points":10},
     {"id":"q8","type":"mcq","label":"Hockey stick","prompt":"A hockey-stick forecast is…","options":[{"id":"a","label":"A sudden acceleration in growth with no clear driver — a red flag"},{"id":"b","label":"A steady 5% growth line"},{"id":"c","label":"A seasonal pattern"},{"id":"d","label":"A conservative case"}],"points":10},
     {"id":"q9","type":"numeric","label":"CAGR","prompt":"Revenue grows from 1,000 to 1,210 over 2 years. CAGR (%)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Sanity checks","prompt":"A forecast should be sanity-checked against…","options":[{"id":"a","label":"History, capacity and market size"},{"id":"b","label":"The CEO''s preference"},{"id":"c","label":"The prior forecast only"},{"id":"d","label":"Nothing — it is an opinion"}],"points":10}]',
 '{"q1":{"answer":250000,"tolerance_pct":0.5},"q2":{"answer":15.5,"tolerance_pct":1},"q3":{"answer":"a"},"q4":{"answer":10300,"tolerance_pct":0.5},"q5":{"answer":3090000,"tolerance_pct":0.5},"q6":{"answer":"a"},"q7":{"answer":5.3,"tolerance_pct":1},"q8":{"answer":"a"},"q9":{"answer":10,"tolerance_pct":1},"q10":{"answer":"a"}}'),
('scenarios-sensitivity',
 '[{"id":"q1","type":"mcq","label":"Difference","prompt":"Sensitivity analysis differs from scenario analysis because it…","options":[{"id":"a","label":"Changes one input at a time"},{"id":"b","label":"Changes several linked inputs together"},{"id":"c","label":"Ignores outputs"},{"id":"d","label":"Needs three cases"}],"points":10},
     {"id":"q2","type":"mcq","label":"Base case","prompt":"The base case is…","options":[{"id":"a","label":"The most likely set of assumptions"},{"id":"b","label":"The worst case"},{"id":"c","label":"The best case"},{"id":"d","label":"Last year''s actuals"}],"points":10},
     {"id":"q3","type":"numeric","label":"EV at 8x","prompt":"EBITDA ₱200m at an 8x EV/EBITDA multiple. Enterprise value (₱m)?","unit":"₱m","points":10},
     {"id":"q4","type":"numeric","label":"EV at 7x","prompt":"The same EBITDA at a 7x multiple. Enterprise value (₱m)?","unit":"₱m","points":10},
     {"id":"q5","type":"numeric","label":"Value change","prompt":"A 1-point rise in WACC cuts value from ₱100 to ₱88. By what % does value fall?","unit":"%","points":10},
     {"id":"q6","type":"mcq","label":"Tornado chart","prompt":"A tornado chart shows…","options":[{"id":"a","label":"Which input moves the output the most"},{"id":"b","label":"The balance sheet over time"},{"id":"c","label":"Cash by month"},{"id":"d","label":"Probability of default"}],"points":10},
     {"id":"q7","type":"numeric","label":"Expected value","prompt":"Bull 25% at ₱140; base 50% at ₱100; bear 25% at ₱60. Probability-weighted value (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"Expected value 2","prompt":"Bull 20% at ₱150; base 50% at ₱100; bear 30% at ₱50. Probability-weighted value (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Scenario switch","prompt":"A scenario switch in a model…","options":[{"id":"a","label":"Changes all linked drivers together using CHOOSE or INDEX"},{"id":"b","label":"Deletes the other cases"},{"id":"c","label":"Only changes the tax rate"},{"id":"d","label":"Locks the balance sheet"}],"points":10},
     {"id":"q10","type":"mcq","label":"Bear case","prompt":"A good bear case should stress…","options":[{"id":"a","label":"Liquidity and covenants as well as earnings"},{"id":"b","label":"Only revenue"},{"id":"c","label":"Only the share price"},{"id":"d","label":"Nothing — it is hypothetical"}],"points":10}]',
 '{"q1":{"answer":"a"},"q2":{"answer":"a"},"q3":{"answer":1600,"tolerance_pct":0.5},"q4":{"answer":1400,"tolerance_pct":0.5},"q5":{"answer":12,"tolerance_pct":1},"q6":{"answer":"a"},"q7":{"answer":100,"tolerance_pct":0.5},"q8":{"answer":95,"tolerance_pct":0.5},"q9":{"answer":"a"},"q10":{"answer":"a"}}')
), upd as (
  update public.lessons l set check_questions = qs.questions::jsonb
  from qs where l.slug = qs.slug and jsonb_array_length(l.check_questions) = 0
  returning l.id, qs.answers
)
insert into public.lesson_check_keys (lesson_id, answers)
select id, answers::jsonb from upd
on conflict (lesson_id) do nothing;
