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
 '{corpfin-capital-budget}', '{https://www.youtube.com/watch?v=Y815bf-jUQg}', $md$
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
$md$),
('budgeting-variance-fpa', 'Budgeting & Variance Analysis (FP&A)', 'Budgets, favourable vs unfavourable variances, price-volume analysis and rolling forecasts.', 'financial_analysis', 'intermediate', 15, 31,
 '{corpfin-variance-review}', '{https://www.youtube.com/watch?v=cnUyZ2dZSEk}', $md$
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
$md$),
('capital-budgeting-npv-irr', 'Capital Budgeting: NPV, IRR & Payback', 'Choosing projects with NPV, IRR, profitability index and payback.', 'valuation', 'intermediate', 15, 32,
 '{corpfin-capital-budget}', '{https://www.youtube.com/watch?v=y3m8FAGt7Qo}', $md$
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
$md$),
('working-capital-ccc', 'Working Capital & the Cash Conversion Cycle', 'DSO, DIO, DPO and how fast a business turns inventory into cash.', 'financial_analysis', 'intermediate', 15, 33,
 '{corpfin-variance-review}', '{https://www.youtube.com/watch?v=JLxy4cs8Kr8}', $md$
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
$md$),
('model-structure', 'Financial Model Structure & the Three-Statement Link', 'Inputs, schedules, statements, checks and the links between them.', 'financial_analysis', 'intermediate', 15, 34,
 '{modeling-three-statement-roll}', '{https://www.youtube.com/watch?v=-pws4pPiDFs}', $md$
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

> A model that doesn't balance is wrong; a model that balances can still be wrong, so test the assumptions too.
$md$),
('revenue-drivers-forecasting', 'Driver-Based Revenue Forecasting', 'Price × volume, subscriptions, market share and realistic growth.', 'financial_analysis', 'intermediate', 15, 35,
 '{modeling-scenario-valuation}', '{https://www.youtube.com/watch?v=yiWAE7aE6zk}', $md$
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
$md$),
('scenarios-sensitivity', 'Scenarios & Sensitivity Analysis', 'Base, bull and bear cases, sensitivity tables and probability-weighted value.', 'financial_analysis', 'advanced', 15, 36,
 '{modeling-scenario-valuation}', '{https://www.youtube.com/watch?v=UsbVUOnBy3Y}', $md$
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
$md$)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('time-value-of-money',
 $j$[{"id":"q1","type":"numeric","label":"Future value","prompt":"₱100,000 is invested at 8% a year for 3 years. Future value (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Present value","prompt":"₱200,000 will be received in 4 years. The discount rate is 10%. Present value (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"mcq","label":"Discount rate","prompt":"A higher discount rate makes a future cash flow worth…","options":[{"id":"a","label":"More today"},{"id":"b","label":"Less today"},{"id":"c","label":"The same today"},{"id":"d","label":"More in the future"}],"points":10},
     {"id":"q4","type":"numeric","label":"Annuity","prompt":"₱10,000 is received at the end of each of the next 3 years. Discount rate 10%. Present value (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"numeric","label":"Perpetuity","prompt":"A perpetuity pays ₱5,000 a year forever. The discount rate is 8%. Present value (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Today vs later","prompt":"At any positive interest rate, ₱100 today is worth…","options":[{"id":"a","label":"Less than ₱100 in a year"},{"id":"b","label":"More than ₱100 in a year"},{"id":"c","label":"Exactly ₱100 in a year"},{"id":"d","label":"It depends on inflation only"}],"points":10},
     {"id":"q7","type":"numeric","label":"Rule of 72","prompt":"At a 9% annual return, roughly how many years does money take to double (rule of 72)?","unit":"years","points":10},
     {"id":"q8","type":"mcq","label":"Compounding","prompt":"At the same nominal rate, more frequent compounding gives…","options":[{"id":"a","label":"A lower effective annual rate"},{"id":"b","label":"A higher effective annual rate"},{"id":"c","label":"The same effective annual rate"},{"id":"d","label":"A negative rate"}],"points":10},
     {"id":"q9","type":"numeric","label":"Effective rate","prompt":"A 12% nominal rate is compounded monthly. Effective annual rate (%, two decimals)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Why it exists","prompt":"The time value of money exists because…","options":[{"id":"a","label":"Money today can be invested to earn a return, and prices change over time"},{"id":"b","label":"Banks set arbitrary rates"},{"id":"c","label":"Future cash is always certain"},{"id":"d","label":"Taxes apply only to future cash"}],"points":10}]$j$,
 $j${"q1":{"answer":125971,"tolerance_pct":0.5},"q2":{"answer":136603,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":24869,"tolerance_pct":0.5},"q5":{"answer":62500,"tolerance_pct":0.5},"q6":{"answer":"b"},"q7":{"answer":8,"tolerance_pct":1},"q8":{"answer":"b"},"q9":{"answer":12.68,"tolerance_pct":0.5},"q10":{"answer":"a"}}$j$),
('budgeting-variance-fpa',
 $j$[{"id":"q1","type":"numeric","label":"Variance","prompt":"Revenue budget ₱5,000k; actual ₱5,400k. Variance (₱k)?","unit":"₱k","points":10},
     {"id":"q2","type":"numeric","label":"Variance %","prompt":"Same figures: variance as a % of budget?","unit":"%","points":10},
     {"id":"q3","type":"mcq","label":"Cost variance","prompt":"A cost line comes in 12% above budget. That variance is…","options":[{"id":"a","label":"Favourable"},{"id":"b","label":"Unfavourable"},{"id":"c","label":"Neutral"},{"id":"d","label":"Not a variance"}],"points":10},
     {"id":"q4","type":"numeric","label":"Volume variance","prompt":"Budget: 10,000 units at ₱50. Actual: 11,000 units at ₱48. Volume variance on revenue (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"numeric","label":"Price variance","prompt":"Using the same facts, by how much did the lower price reduce revenue (₱, as a positive number)?","unit":"₱","points":10},
     {"id":"q6","type":"numeric","label":"Total variance","prompt":"Using the same facts, total revenue variance (actual − budget) (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Flexible budget","prompt":"A flexible budget…","options":[{"id":"a","label":"Is never revised"},{"id":"b","label":"Is restated at the actual activity level"},{"id":"c","label":"Ignores volume"},{"id":"d","label":"Replaces the actuals"}],"points":10},
     {"id":"q8","type":"mcq","label":"Materiality","prompt":"Why set a materiality threshold for variance review?","options":[{"id":"a","label":"So effort goes to the large gaps"},{"id":"b","label":"To hide small errors permanently"},{"id":"c","label":"Because small variances are always wrong"},{"id":"d","label":"To avoid writing commentary"}],"points":10},
     {"id":"q9","type":"mcq","label":"Rolling forecast","prompt":"A rolling forecast is…","options":[{"id":"a","label":"Updated regularly and always looks a fixed period ahead"},{"id":"b","label":"Prepared once a year"},{"id":"c","label":"The same as the budget"},{"id":"d","label":"A historical report"}],"points":10},
     {"id":"q10","type":"numeric","label":"Gross profit variance","prompt":"Budget: revenue ₱5,000k at a 40% gross margin. Actual: revenue ₱5,400k at 38%. Gross profit variance (₱k)?","unit":"₱k","points":10}]$j$,
 $j${"q1":{"answer":400,"tolerance_pct":0.5},"q2":{"answer":8,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":50000,"tolerance_pct":0.5},"q5":{"answer":22000,"tolerance_pct":0.5},"q6":{"answer":28000,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"a"},"q9":{"answer":"a"},"q10":{"answer":52,"tolerance_pct":0.5}}$j$),
('capital-budgeting-npv-irr',
 $j$[{"id":"q1","type":"numeric","label":"NPV","prompt":"A project costs ₱1,000k and returns ₱450k a year for 3 years. Required return 10%. NPV (₱k, two decimals)?","unit":"₱k","points":10},
     {"id":"q2","type":"mcq","label":"Decision rule","prompt":"Accept a conventional project when…","options":[{"id":"a","label":"NPV is greater than zero"},{"id":"b","label":"NPV is negative"},{"id":"c","label":"Payback is more than 10 years"},{"id":"d","label":"IRR is below the cost of capital"}],"points":10},
     {"id":"q3","type":"numeric","label":"Payback","prompt":"A project costs ₱600k and returns ₱200k a year. Payback period (years)?","unit":"years","points":10},
     {"id":"q4","type":"mcq","label":"IRR","prompt":"The IRR is…","options":[{"id":"a","label":"The discount rate at which NPV equals zero"},{"id":"b","label":"The average annual profit"},{"id":"c","label":"The cost of debt"},{"id":"d","label":"The payback period as a percentage"}],"points":10},
     {"id":"q5","type":"mcq","label":"IRR vs cost of capital","prompt":"IRR is 14% and the cost of capital is 11%. For a conventional project you should…","options":[{"id":"a","label":"Accept"},{"id":"b","label":"Reject"},{"id":"c","label":"Ignore NPV"},{"id":"d","label":"Wait for payback"}],"points":10},
     {"id":"q6","type":"numeric","label":"Profitability index","prompt":"PV of inflows ₱1,320k; investment ₱1,100k. Profitability index?","unit":"x","points":10},
     {"id":"q7","type":"mcq","label":"Payback weakness","prompt":"A weakness of the payback period is that it…","options":[{"id":"a","label":"Ignores the time value of money and cash flows after payback"},{"id":"b","label":"Needs a discount rate"},{"id":"c","label":"Is too complex"},{"id":"d","label":"Always rejects good projects"}],"points":10},
     {"id":"q8","type":"numeric","label":"Lump-sum NPV","prompt":"Invest ₱500k now and receive ₱800k in 3 years. Required return 12%. NPV (₱k, two decimals)?","unit":"₱k","points":10},
     {"id":"q9","type":"mcq","label":"Conflicts","prompt":"For mutually exclusive projects where NPV and IRR disagree, prefer…","options":[{"id":"a","label":"IRR"},{"id":"b","label":"NPV"},{"id":"c","label":"Payback"},{"id":"d","label":"Accounting profit"}],"points":10},
     {"id":"q10","type":"numeric","label":"Discounted payback","prompt":"Cost ₱300k; inflows ₱150k a year; discount rate 10%. In which year (1, 2, 3…) is the discounted payback reached?","unit":"year","points":10}]$j$,
 $j${"q1":{"answer":119.08,"tolerance_pct":1},"q2":{"answer":"a"},"q3":{"answer":3,"tolerance_pct":0.5},"q4":{"answer":"a"},"q5":{"answer":"a"},"q6":{"answer":1.2,"tolerance_pct":0.5},"q7":{"answer":"a"},"q8":{"answer":69.42,"tolerance_pct":1},"q9":{"answer":"b"},"q10":{"answer":3,"tolerance_pct":0.5}}$j$),
('working-capital-ccc',
 $j$[{"id":"q1","type":"numeric","label":"DSO","prompt":"Annual sales ₱7,300k; receivables ₱1,000k. DSO (days, 365-day year)?","unit":"days","points":10},
     {"id":"q2","type":"numeric","label":"DIO","prompt":"Annual COGS ₱5,475k; inventory ₱1,500k. DIO (days)?","unit":"days","points":10},
     {"id":"q3","type":"numeric","label":"DPO","prompt":"Annual COGS ₱5,475k; payables ₱750k. DPO (days)?","unit":"days","points":10},
     {"id":"q4","type":"numeric","label":"CCC","prompt":"Using the three results above, the cash conversion cycle (days)?","unit":"days","points":10},
     {"id":"q5","type":"mcq","label":"Supplier terms","prompt":"Negotiating longer supplier payment terms…","options":[{"id":"a","label":"Lengthens the cash conversion cycle"},{"id":"b","label":"Shortens the cash conversion cycle"},{"id":"c","label":"Has no effect"},{"id":"d","label":"Raises DSO"}],"points":10},
     {"id":"q6","type":"mcq","label":"Negative CCC","prompt":"A negative cash conversion cycle means…","options":[{"id":"a","label":"The business is insolvent"},{"id":"b","label":"Customers pay before suppliers must be paid"},{"id":"c","label":"Inventory is negative"},{"id":"d","label":"Sales are falling"}],"points":10},
     {"id":"q7","type":"numeric","label":"Cash released","prompt":"Daily sales are ₱20,000. Cutting DSO by 10 days releases how much cash (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"Net working capital","prompt":"Current assets ₱3.0m; current liabilities ₱1.8m. Net working capital (₱m)?","unit":"₱m","points":10},
     {"id":"q9","type":"mcq","label":"Growth","prompt":"A fast-growing company usually needs…","options":[{"id":"a","label":"Less working capital"},{"id":"b","label":"More working capital, as stock and receivables absorb cash"},{"id":"c","label":"No change in working capital"},{"id":"d","label":"Negative inventory"}],"points":10},
     {"id":"q10","type":"mcq","label":"Lengthening the cycle","prompt":"Which action lengthens the cash conversion cycle?","options":[{"id":"a","label":"Offering customers longer credit terms"},{"id":"b","label":"Collecting overdue invoices faster"},{"id":"c","label":"Holding less stock"},{"id":"d","label":"Paying suppliers later"}],"points":10}]$j$,
 $j${"q1":{"answer":50,"tolerance_pct":0.5},"q2":{"answer":100,"tolerance_pct":0.5},"q3":{"answer":50,"tolerance_pct":0.5},"q4":{"answer":100,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"b"},"q7":{"answer":200000,"tolerance_pct":0.5},"q8":{"answer":1.2,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"a"}}$j$),
('model-structure',
 $j$[{"id":"q1","type":"mcq","label":"Colour code","prompt":"By modelling convention, blue font marks…","options":[{"id":"a","label":"Formulas"},{"id":"b","label":"Hard-coded inputs"},{"id":"c","label":"Links to other sheets"},{"id":"d","label":"Errors"}],"points":10},
     {"id":"q2","type":"mcq","label":"Assumptions","prompt":"Where should a model's assumptions live?","options":[{"id":"a","label":"Typed inside formulas"},{"id":"b","label":"In one clearly labelled inputs area"},{"id":"c","label":"Scattered across the statements"},{"id":"d","label":"In comments only"}],"points":10},
     {"id":"q3","type":"mcq","label":"Net income link","prompt":"Net income flows to which balance sheet item?","options":[{"id":"a","label":"Retained earnings"},{"id":"b","label":"Accounts payable"},{"id":"c","label":"PP&E"},{"id":"d","label":"Inventory"}],"points":10},
     {"id":"q4","type":"numeric","label":"PP&E roll-forward","prompt":"Opening PP&E 1,000; capex 200; depreciation 150. Closing PP&E?","unit":"","points":10},
     {"id":"q5","type":"numeric","label":"Retained earnings","prompt":"Opening retained earnings 500; net income 120; dividends 40. Closing retained earnings?","unit":"","points":10},
     {"id":"q6","type":"mcq","label":"Balance check","prompt":"The balance check in a model tests that…","options":[{"id":"a","label":"Revenue equals costs"},{"id":"b","label":"Assets minus (liabilities + equity) equals zero in every period"},{"id":"c","label":"Cash is positive"},{"id":"d","label":"Growth is below 10%"}],"points":10},
     {"id":"q7","type":"numeric","label":"CFO","prompt":"Net income 100; D&A 30; receivables up 20; payables up 10. Cash flow from operations?","unit":"","points":10},
     {"id":"q8","type":"mcq","label":"Revolver","prompt":"A revolver in a model…","options":[{"id":"a","label":"Repays all debt immediately"},{"id":"b","label":"Borrows automatically when cash would go negative"},{"id":"c","label":"Calculates depreciation"},{"id":"d","label":"Replaces the balance sheet"}],"points":10},
     {"id":"q9","type":"mcq","label":"Hard-codes","prompt":"Why is hard-coding a number inside a formula risky?","options":[{"id":"a","label":"It hides an assumption and is easily missed when inputs change"},{"id":"b","label":"It makes the file larger"},{"id":"c","label":"It is not allowed in Excel"},{"id":"d","label":"It always changes the result"}],"points":10},
     {"id":"q10","type":"numeric","label":"Closing cash","prompt":"Opening cash 250; CFO 120; CFI −200; CFF +50. Closing cash?","unit":"","points":10}]$j$,
 $j${"q1":{"answer":"b"},"q2":{"answer":"b"},"q3":{"answer":"a"},"q4":{"answer":1050,"tolerance_pct":0.5},"q5":{"answer":580,"tolerance_pct":0.5},"q6":{"answer":"b"},"q7":{"answer":120,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":"a"},"q10":{"answer":220,"tolerance_pct":0.5}}$j$),
('revenue-drivers-forecasting',
 $j$[{"id":"q1","type":"numeric","label":"Price × volume","prompt":"1,000 units are sold at ₱250. Revenue (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Combined growth","prompt":"Units grow 10% and price grows 5%. Revenue growth (%, one decimal)?","unit":"%","points":10},
     {"id":"q3","type":"mcq","label":"Why drivers","prompt":"Why forecast revenue from drivers rather than a single growth rate?","options":[{"id":"a","label":"Each assumption is explicit and can be tested"},{"id":"b","label":"It always gives a higher forecast"},{"id":"c","label":"It needs fewer inputs"},{"id":"d","label":"It avoids checking history"}],"points":10},
     {"id":"q4","type":"numeric","label":"Customers","prompt":"Opening 10,000 customers; 2% churn a month; 500 new customers. Closing customers after month 1?","unit":"","points":10},
     {"id":"q5","type":"numeric","label":"Subscription revenue","prompt":"Month-1 revenue with 10,300 customers at ₱300 ARPU (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Retail growth","prompt":"A retailer's revenue growth is best decomposed into…","options":[{"id":"a","label":"Same-store growth plus new-store contribution"},{"id":"b","label":"Debt and equity"},{"id":"c","label":"Gross and net margin"},{"id":"d","label":"Tax and interest"}],"points":10},
     {"id":"q7","type":"numeric","label":"Market share","prompt":"A ₱40bn market grows 6% in year 2. A firm holds 12.5% share in year 2. Its year-2 revenue (₱bn)?","unit":"₱bn","points":10},
     {"id":"q8","type":"mcq","label":"Hockey stick","prompt":"A hockey-stick forecast is…","options":[{"id":"a","label":"A sudden acceleration in growth with no clear driver — a red flag"},{"id":"b","label":"A steady 5% growth line"},{"id":"c","label":"A seasonal pattern"},{"id":"d","label":"A conservative case"}],"points":10},
     {"id":"q9","type":"numeric","label":"CAGR","prompt":"Revenue grows from 1,000 to 1,210 over 2 years. CAGR (%)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Sanity checks","prompt":"A forecast should be sanity-checked against…","options":[{"id":"a","label":"History, capacity and market size"},{"id":"b","label":"The CEO's preference"},{"id":"c","label":"The prior forecast only"},{"id":"d","label":"Nothing — it is an opinion"}],"points":10}]$j$,
 $j${"q1":{"answer":250000,"tolerance_pct":0.5},"q2":{"answer":15.5,"tolerance_pct":1},"q3":{"answer":"a"},"q4":{"answer":10300,"tolerance_pct":0.5},"q5":{"answer":3090000,"tolerance_pct":0.5},"q6":{"answer":"a"},"q7":{"answer":5.3,"tolerance_pct":1},"q8":{"answer":"a"},"q9":{"answer":10,"tolerance_pct":1},"q10":{"answer":"a"}}$j$),
('scenarios-sensitivity',
 $j$[{"id":"q1","type":"mcq","label":"Difference","prompt":"Sensitivity analysis differs from scenario analysis because it…","options":[{"id":"a","label":"Changes one input at a time"},{"id":"b","label":"Changes several linked inputs together"},{"id":"c","label":"Ignores outputs"},{"id":"d","label":"Needs three cases"}],"points":10},
     {"id":"q2","type":"mcq","label":"Base case","prompt":"The base case is…","options":[{"id":"a","label":"The most likely set of assumptions"},{"id":"b","label":"The worst case"},{"id":"c","label":"The best case"},{"id":"d","label":"Last year's actuals"}],"points":10},
     {"id":"q3","type":"numeric","label":"EV at 8x","prompt":"EBITDA ₱200m at an 8x EV/EBITDA multiple. Enterprise value (₱m)?","unit":"₱m","points":10},
     {"id":"q4","type":"numeric","label":"EV at 7x","prompt":"The same EBITDA at a 7x multiple. Enterprise value (₱m)?","unit":"₱m","points":10},
     {"id":"q5","type":"numeric","label":"Value change","prompt":"A 1-point rise in WACC cuts value from ₱100 to ₱88. By what % does value fall?","unit":"%","points":10},
     {"id":"q6","type":"mcq","label":"Tornado chart","prompt":"A tornado chart shows…","options":[{"id":"a","label":"Which input moves the output the most"},{"id":"b","label":"The balance sheet over time"},{"id":"c","label":"Cash by month"},{"id":"d","label":"Probability of default"}],"points":10},
     {"id":"q7","type":"numeric","label":"Expected value","prompt":"Bull 25% at ₱140; base 50% at ₱100; bear 25% at ₱60. Probability-weighted value (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"Expected value 2","prompt":"Bull 20% at ₱150; base 50% at ₱100; bear 30% at ₱50. Probability-weighted value (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Scenario switch","prompt":"A scenario switch in a model…","options":[{"id":"a","label":"Changes all linked drivers together using CHOOSE or INDEX"},{"id":"b","label":"Deletes the other cases"},{"id":"c","label":"Only changes the tax rate"},{"id":"d","label":"Locks the balance sheet"}],"points":10},
     {"id":"q10","type":"mcq","label":"Bear case","prompt":"A good bear case should stress…","options":[{"id":"a","label":"Liquidity and covenants as well as earnings"},{"id":"b","label":"Only revenue"},{"id":"c","label":"Only the share price"},{"id":"d","label":"Nothing — it is hypothetical"}],"points":10}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":"a"},"q3":{"answer":1600,"tolerance_pct":0.5},"q4":{"answer":1400,"tolerance_pct":0.5},"q5":{"answer":12,"tolerance_pct":1},"q6":{"answer":"a"},"q7":{"answer":100,"tolerance_pct":0.5},"q8":{"answer":95,"tolerance_pct":0.5},"q9":{"answer":"a"},"q10":{"answer":"a"}}$j$)
), upd as (
  update public.lessons l set check_questions = qs.questions::jsonb
  from qs where l.slug = qs.slug and jsonb_array_length(l.check_questions) = 0
  returning l.id, qs.answers
)
insert into public.lesson_check_keys (lesson_id, answers)
select id, answers::jsonb from upd
on conflict (lesson_id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Practice activities
-- ---------------------------------------------------------------------
insert into public.lesson_activities (lesson_id, slug, position, kind, title, instructions, content)
select l.id, v.slug, v.pos, v.kind, v.title, v.instructions, v.content::jsonb
from (values
('time-value-of-money', 'which-formula', 1, 'matching', 'Which formula is it?',
 'Match each description to the concept it describes.',
 $j${"categories":[{"id":"pv","label":"Present value"},{"id":"fv","label":"Future value"},{"id":"an","label":"Annuity / perpetuity"}],
     "items":[{"id":"i1","label":"Cash flow ÷ (1 + r)ⁿ"},{"id":"i2","label":"PV × (1 + r)ⁿ"},{"id":"i3","label":"Compounds a lump sum forward"},{"id":"i4","label":"Discounts a future amount back to today"},
              {"id":"i5","label":"A level payment each period for n periods"},{"id":"i6","label":"A level payment forever: C ÷ r"},{"id":"i7","label":"What is this future cash worth today?"},{"id":"i8","label":"What will today's savings grow to?"}]}$j$),
('time-value-of-money', 'scholarship-pv', 2, 'worked_example', 'Worked example: the value of a scholarship',
 'Discount each payment, then add them. Hints are available but cost points.',
 $j${"intro":"A scholarship pays ₱30,000 at the end of each of the next 3 years. The discount rate is 10%.",
     "steps":[{"id":"s1","prompt":"Present value of the year-1 payment (₱)?","unit":"₱"},{"id":"s2","prompt":"Present value of the year-2 payment (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Present value of the year-3 payment (₱)?","unit":"₱"},{"id":"s4","prompt":"Total present value (₱)?","unit":"₱"},
              {"id":"s5","prompt":"How much less than the ₱90,000 of total payments is that present value (₱)?","unit":"₱"}]}$j$),
('budgeting-variance-fpa', 'favourable-or-not', 1, 'matching', 'Favourable or unfavourable?',
 'Classify each variance against budget.',
 $j${"categories":[{"id":"fav","label":"Favourable"},{"id":"unf","label":"Unfavourable"}],
     "items":[{"id":"i1","label":"Revenue above budget"},{"id":"i2","label":"Revenue below budget"},{"id":"i3","label":"Costs above budget"},{"id":"i4","label":"Costs below budget"},{"id":"i5","label":"Operating profit above budget"},{"id":"i6","label":"Operating profit below budget"}]}$j$),
('budgeting-variance-fpa', 'price-volume', 2, 'worked_example', 'Worked example: price and volume variances',
 'Split a revenue variance into its drivers. Enter negative numbers where revenue fell short.',
 $j${"intro":"Budget: 2,000 units at ₱150. Actual: 1,800 units at ₱160.",
     "steps":[{"id":"s1","prompt":"Budget revenue (₱)?","unit":"₱"},{"id":"s2","prompt":"Actual revenue (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Total revenue variance (₱, negative if below budget)?","unit":"₱"},
              {"id":"s4","prompt":"Volume variance = (actual − budget units) × budget price (₱, negative if unfavourable)?","unit":"₱"},
              {"id":"s5","prompt":"Price variance = (actual − budget price) × actual units (₱, negative if unfavourable)?","unit":"₱"}]}$j$),
('capital-budgeting-npv-irr', 'store-expansion-npv', 1, 'worked_example', 'Worked example: NPV of a store expansion',
 'Discount each year, add up, and decide. Enter negative numbers where the NPV is below zero.',
 $j${"intro":"A store expansion costs ₱2,000,000 and returns ₱700,000, ₱800,000 and ₱900,000 in years 1 to 3. The required return is 10%.",
     "steps":[{"id":"s1","prompt":"Present value of year 1 (₱)?","unit":"₱"},{"id":"s2","prompt":"Present value of year 2 (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Present value of year 3 (₱)?","unit":"₱"},{"id":"s4","prompt":"Total present value of the inflows (₱)?","unit":"₱"},
              {"id":"s5","prompt":"NPV (₱, negative if below zero)?","unit":"₱"}]}$j$),
('capital-budgeting-npv-irr', 'capital-review-errors', 2, 'spot_error', 'Spot the errors: a capital budget review',
 'Two conclusions in this review are wrong. Select them, then check.',
 $j${"context":"Project: cost ₱1,000k; required return 10%; inflows of ₱500k a year for 3 years.","columns":["Measure","Result"],"select_count":2,
     "rows":[{"id":"r1","cells":["Payback","2 years"]},{"id":"r2","cells":["PV of inflows","₱1,243k"]},{"id":"r3","cells":["NPV","+₱243k"]},
             {"id":"r4","cells":["IRR","Below 10%"]},{"id":"r5","cells":["Profitability index","0.76"]},{"id":"r6","cells":["Decision","Accept"]}]}$j$),
('working-capital-ccc', 'which-lever', 1, 'matching', 'Which lever does it pull?',
 'Match each action to the part of the cash conversion cycle it improves.',
 $j${"categories":[{"id":"dso","label":"Collect faster (DSO)"},{"id":"dio","label":"Hold less stock (DIO)"},{"id":"dpo","label":"Pay later (DPO)"}],
     "items":[{"id":"i1","label":"Offer early-payment discounts"},{"id":"i2","label":"Tighten credit approval"},{"id":"i3","label":"Use just-in-time ordering"},{"id":"i4","label":"Clear slow-moving stock"},
              {"id":"i5","label":"Negotiate 60-day supplier terms"},{"id":"i6","label":"Chase overdue invoices"},{"id":"i7","label":"Improve demand forecasting to cut safety stock"},{"id":"i8","label":"Pay on the due date rather than early"}]}$j$),
('working-capital-ccc', 'compute-ccc', 2, 'worked_example', 'Worked example: the cash conversion cycle',
 'Compute the three day measures and the cycle. Hints are available but cost points.',
 $j${"intro":"Annual sales ₱14,600k; COGS ₱10,950k; receivables ₱1,600k; inventory ₱2,250k; payables ₱1,350k (365-day year).",
     "steps":[{"id":"s1","prompt":"DSO (days)?","unit":"days"},{"id":"s2","prompt":"DIO (days)?","unit":"days"},{"id":"s3","prompt":"DPO (days)?","unit":"days"},
              {"id":"s4","prompt":"Cash conversion cycle (days)?","unit":"days"},{"id":"s5","prompt":"Cash released if DSO falls by 10 days (₱k)?","unit":"₱k"}]}$j$),
('model-structure', 'where-does-it-live', 1, 'matching', 'Where does it live in the model?',
 'Sort each item into the part of a well-structured model it belongs to.',
 $j${"categories":[{"id":"inp","label":"Inputs"},{"id":"calc","label":"Calculations"},{"id":"out","label":"Outputs"}],
     "items":[{"id":"i1","label":"Revenue growth assumption"},{"id":"i2","label":"Tax rate"},{"id":"i3","label":"Depreciation schedule"},{"id":"i4","label":"Debt schedule"},
              {"id":"i5","label":"Balance check"},{"id":"i6","label":"DCF value per share"},{"id":"i7","label":"Sensitivity table"},{"id":"i8","label":"Working-capital days"},{"id":"i9","label":"Summary chart of margins"}]}$j$),
('model-structure', 'roll-the-balance-sheet', 2, 'worked_example', 'Worked example: roll the balance sheet forward',
 'Move one year forward and check that it balances. Hints are available but cost points.',
 $j${"intro":"Year 0: PP&E 800, cash 150, receivables 100, payables 80, debt 300, equity 670. Year 1: net income 90; dividends 30; capex 120; depreciation 100; receivables 120; payables 95; debt unchanged.",
     "steps":[{"id":"s1","prompt":"Closing PP&E?","unit":""},{"id":"s2","prompt":"Closing equity?","unit":""},{"id":"s3","prompt":"Cash flow from operations?","unit":""},
              {"id":"s4","prompt":"Closing cash?","unit":""},{"id":"s5","prompt":"Total assets (PP&E + cash + receivables)?","unit":""}]}$j$),
('revenue-drivers-forecasting', 'subscription-forecast', 1, 'worked_example', 'Worked example: a subscription forecast',
 'Build two months of customers and revenue. Hints are available but cost points.',
 $j${"intro":"Opening customers 5,000; churn 4% of opening customers each month; 400 new customers each month; ARPU ₱500 a month on closing customers.",
     "steps":[{"id":"s1","prompt":"Customers at the end of month 1?","unit":""},{"id":"s2","prompt":"Customers at the end of month 2?","unit":""},
              {"id":"s3","prompt":"Month-2 revenue (₱)?","unit":"₱"},{"id":"s4","prompt":"Customers lost to churn in month 2?","unit":""},{"id":"s5","prompt":"Net customer additions in month 2?","unit":""}]}$j$),
('revenue-drivers-forecasting', 'unrealistic-assumptions', 2, 'spot_error', 'Spot the unrealistic assumptions',
 'Two assumptions in this forecast have no support. Select them, then check.',
 $j${"context":"A consumer brand: current revenue ₱1.0bn growing 8% a year; the industry grows 5%.","columns":["Assumption","Value"],"select_count":2,
     "rows":[{"id":"r1","cells":["Year 1 revenue growth","8%"]},{"id":"r2","cells":["Year 2 revenue growth","9%"]},{"id":"r3","cells":["Year 3 revenue growth","35%, with no new products or markets"]},
             {"id":"r4","cells":["Gross margin","42%, rising to 43%"]},{"id":"r5","cells":["Year 5 market share","Doubles from 6% to 12% with no new products"]},{"id":"r6","cells":["Capex","3% of revenue"]}]}$j$),
('scenarios-sensitivity', 'sens-or-scenario', 1, 'matching', 'Sensitivity or scenario?',
 'Decide which tool each description belongs to.',
 $j${"categories":[{"id":"sens","label":"Sensitivity analysis"},{"id":"scen","label":"Scenario analysis"}],
     "items":[{"id":"i1","label":"Change only WACC and watch the value"},{"id":"i2","label":"Bull, base and bear cases"},{"id":"i3","label":"Two-way table of WACC against terminal growth"},
              {"id":"i4","label":"A recession story: lower sales, margin squeeze, delayed capex"},{"id":"i5","label":"Tornado chart"},{"id":"i6","label":"Probability-weighted value across cases"}]}$j$),
('scenarios-sensitivity', 'probability-weighted', 2, 'worked_example', 'Worked example: probability-weighted value',
 'Weight the three cases and compare with the market price. Hints are available but cost points.',
 $j${"intro":"A stock's bull, base and bear values are ₱180, ₱120 and ₱60, with probabilities of 25%, 50% and 25%. The share price is ₱100.",
     "steps":[{"id":"s1","prompt":"Bull contribution (probability × value) (₱)?","unit":"₱"},{"id":"s2","prompt":"Base contribution (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Bear contribution (₱)?","unit":"₱"},{"id":"s4","prompt":"Probability-weighted value (₱)?","unit":"₱"},{"id":"s5","prompt":"Upside versus the ₱100 price (%)?","unit":"%"}]}$j$)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('time-value-of-money', 'which-formula', $j${"i1":"pv","i2":"fv","i3":"fv","i4":"pv","i5":"an","i6":"an","i7":"pv","i8":"fv"}$j$),
('time-value-of-money', 'scholarship-pv', $j${
  "s1":{"answer":27272.73,"tolerance_pct":0.5,"hint":"30,000 ÷ 1.10.","explanation":"30,000 ÷ 1.1 = 27,272.73."},
  "s2":{"answer":24793.39,"tolerance_pct":0.5,"hint":"30,000 ÷ 1.10².","explanation":"30,000 ÷ 1.21 = 24,793.39."},
  "s3":{"answer":22539.44,"tolerance_pct":0.5,"hint":"30,000 ÷ 1.10³.","explanation":"30,000 ÷ 1.331 = 22,539.44."},
  "s4":{"answer":74605.56,"tolerance_pct":0.5,"hint":"Add the three present values.","explanation":"27,272.73 + 24,793.39 + 22,539.44 = 74,605.56."},
  "s5":{"answer":15394.44,"tolerance_pct":1,"hint":"90,000 minus the present value.","explanation":"90,000 − 74,605.56 = 15,394.44 — the cost of waiting for the money."}}$j$),
('budgeting-variance-fpa', 'favourable-or-not', $j${"i1":"fav","i2":"unf","i3":"unf","i4":"fav","i5":"fav","i6":"unf"}$j$),
('budgeting-variance-fpa', 'price-volume', $j${
  "s1":{"answer":300000,"tolerance_pct":0.5,"hint":"2,000 × 150.","explanation":"2,000 × 150 = 300,000."},
  "s2":{"answer":288000,"tolerance_pct":0.5,"hint":"1,800 × 160.","explanation":"1,800 × 160 = 288,000."},
  "s3":{"answer":-12000,"tolerance_pct":0.5,"hint":"Actual minus budget.","explanation":"288,000 − 300,000 = −12,000 (unfavourable)."},
  "s4":{"answer":-30000,"tolerance_pct":0.5,"hint":"(1,800 − 2,000) × 150.","explanation":"−200 × 150 = −30,000."},
  "s5":{"answer":18000,"tolerance_pct":0.5,"hint":"(160 − 150) × 1,800.","explanation":"10 × 1,800 = +18,000. Volume −30,000 plus price +18,000 equals the −12,000 total."}}$j$),
('capital-budgeting-npv-irr', 'store-expansion-npv', $j${
  "s1":{"answer":636363.64,"tolerance_pct":0.5,"hint":"700,000 ÷ 1.10.","explanation":"700,000 ÷ 1.1 = 636,363.64."},
  "s2":{"answer":661157.02,"tolerance_pct":0.5,"hint":"800,000 ÷ 1.10².","explanation":"800,000 ÷ 1.21 = 661,157.02."},
  "s3":{"answer":676183.82,"tolerance_pct":0.5,"hint":"900,000 ÷ 1.10³.","explanation":"900,000 ÷ 1.331 = 676,183.82."},
  "s4":{"answer":1973704.48,"tolerance_pct":0.5,"hint":"Add the three present values.","explanation":"636,363.64 + 661,157.02 + 676,183.82 = 1,973,704.48."},
  "s5":{"answer":-26295.52,"tolerance_pct":1,"hint":"PV of inflows minus the 2,000,000 investment.","explanation":"1,973,704.48 − 2,000,000 = −26,295.52. NPV is negative, so reject: the project earns slightly less than 10%."}}$j$),
('capital-budgeting-npv-irr', 'capital-review-errors', $j${"errors":["r4","r5"],"explanations":{"r4":"NPV is positive at 10%, so the IRR must be above 10%.","r5":"Profitability index = PV of inflows ÷ investment = 1,243 ÷ 1,000 = 1.24, not 0.76."}}$j$),
('working-capital-ccc', 'which-lever', $j${"i1":"dso","i2":"dso","i3":"dio","i4":"dio","i5":"dpo","i6":"dso","i7":"dio","i8":"dpo"}$j$),
('working-capital-ccc', 'compute-ccc', $j${
  "s1":{"answer":40,"tolerance_pct":0.5,"hint":"Receivables ÷ sales × 365.","explanation":"1,600 ÷ 14,600 × 365 = 40 days."},
  "s2":{"answer":75,"tolerance_pct":0.5,"hint":"Inventory ÷ COGS × 365.","explanation":"2,250 ÷ 10,950 × 365 = 75 days."},
  "s3":{"answer":45,"tolerance_pct":0.5,"hint":"Payables ÷ COGS × 365.","explanation":"1,350 ÷ 10,950 × 365 = 45 days."},
  "s4":{"answer":70,"tolerance_pct":0.5,"hint":"DIO + DSO − DPO.","explanation":"75 + 40 − 45 = 70 days."},
  "s5":{"answer":400,"tolerance_pct":0.5,"hint":"Daily sales × 10 days.","explanation":"Daily sales = 14,600 ÷ 365 = 40; × 10 days = ₱400k."}}$j$),
('model-structure', 'where-does-it-live', $j${"i1":"inp","i2":"inp","i3":"calc","i4":"calc","i5":"calc","i6":"out","i7":"out","i8":"inp","i9":"out"}$j$),
('model-structure', 'roll-the-balance-sheet', $j${
  "s1":{"answer":820,"tolerance_pct":0.5,"hint":"Opening + capex − depreciation.","explanation":"800 + 120 − 100 = 820."},
  "s2":{"answer":730,"tolerance_pct":0.5,"hint":"Opening equity + net income − dividends.","explanation":"670 + 90 − 30 = 730."},
  "s3":{"answer":185,"tolerance_pct":0.5,"hint":"Net income + D&A − increase in receivables + increase in payables.","explanation":"90 + 100 − 20 + 15 = 185."},
  "s4":{"answer":185,"tolerance_pct":0.5,"hint":"Opening cash + CFO + CFI + CFF. CFI = −120; CFF = −30 dividends.","explanation":"150 + 185 − 120 − 30 = 185."},
  "s5":{"answer":1125,"tolerance_pct":0.5,"hint":"820 + cash + 120.","explanation":"820 + 185 + 120 = 1,125 = payables 95 + debt 300 + equity 730. It balances."}}$j$),
('revenue-drivers-forecasting', 'subscription-forecast', $j${
  "s1":{"answer":5200,"tolerance_pct":0.5,"hint":"Opening × (1 − churn) + new.","explanation":"5,000 × 0.96 + 400 = 5,200."},
  "s2":{"answer":5392,"tolerance_pct":0.5,"hint":"5,200 × 0.96 + 400.","explanation":"5,200 × 0.96 + 400 = 5,392."},
  "s3":{"answer":2696000,"tolerance_pct":0.5,"hint":"Closing customers × ARPU.","explanation":"5,392 × 500 = 2,696,000."},
  "s4":{"answer":208,"tolerance_pct":0.5,"hint":"4% of the 5,200 opening customers.","explanation":"5,200 × 4% = 208."},
  "s5":{"answer":192,"tolerance_pct":0.5,"hint":"Closing minus opening.","explanation":"5,392 − 5,200 = 192 (400 new − 208 churned)."}}$j$),
('revenue-drivers-forecasting', 'unrealistic-assumptions', $j${"errors":["r3","r5"],"explanations":{"r3":"35% growth in a 5% industry with no new products or markets is a hockey stick with no driver behind it.","r5":"Doubling market share with no new products has no support — it needs a driver such as new channels, pricing or products."}}$j$),
('scenarios-sensitivity', 'sens-or-scenario', $j${"i1":"sens","i2":"scen","i3":"sens","i4":"scen","i5":"sens","i6":"scen"}$j$),
('scenarios-sensitivity', 'probability-weighted', $j${
  "s1":{"answer":45,"tolerance_pct":0.5,"hint":"25% × 180.","explanation":"0.25 × 180 = 45."},
  "s2":{"answer":60,"tolerance_pct":0.5,"hint":"50% × 120.","explanation":"0.50 × 120 = 60."},
  "s3":{"answer":15,"tolerance_pct":0.5,"hint":"25% × 60.","explanation":"0.25 × 60 = 15."},
  "s4":{"answer":120,"tolerance_pct":0.5,"hint":"Add the three contributions.","explanation":"45 + 60 + 15 = 120."},
  "s5":{"answer":20,"tolerance_pct":1,"hint":"(120 − 100) ÷ 100.","explanation":"(120 − 100) ÷ 100 = 20% upside."}}$j$)
) as v(lesson, slug, key)
join public.lessons l on l.slug = v.lesson
join public.lesson_activities a on a.lesson_id = l.id and a.slug = v.slug
on conflict (activity_id) do update set key = excluded.key, updated_at = now();

-- ---------------------------------------------------------------------
-- 4. Flashcards
-- ---------------------------------------------------------------------
insert into public.flashcards (lesson_id, position, front, back)
select l.id, v.pos, v.front, v.back
from (values
('time-value-of-money',1,'Future value','PV × (1 + r)ⁿ.'),
('time-value-of-money',2,'Present value','FV ÷ (1 + r)ⁿ.'),
('time-value-of-money',3,'Annuity present value','C × [1 − (1 + r)⁻ⁿ] ÷ r.'),
('time-value-of-money',4,'Perpetuity present value','C ÷ r.'),
('time-value-of-money',5,'Rule of 72','Years to double ≈ 72 ÷ rate (%).'),
('time-value-of-money',6,'Effective annual rate','(1 + nominal ÷ m)ᵐ − 1.'),
('time-value-of-money',7,'Higher discount rate means…','A lower present value.'),
('time-value-of-money',8,'More frequent compounding means…','A higher effective annual rate for the same nominal rate.'),
('time-value-of-money',9,'Why does money have a time value?','It can be invested to earn a return, and prices change over time.'),
('time-value-of-money',10,'First step when comparing cash flows at different dates','Move them all to a common date.'),
('budgeting-variance-fpa',1,'Variance =','Actual − Budget.'),
('budgeting-variance-fpa',2,'Variance % =','Variance ÷ Budget.'),
('budgeting-variance-fpa',3,'A cost above budget is…','Unfavourable.'),
('budgeting-variance-fpa',4,'Volume variance =','(Actual units − Budget units) × Budget price.'),
('budgeting-variance-fpa',5,'Price variance =','(Actual price − Budget price) × Actual units.'),
('budgeting-variance-fpa',6,'Flexible budget','The budget restated at the actual activity level.'),
('budgeting-variance-fpa',7,'Rolling forecast','Updated regularly, always looking a fixed period ahead.'),
('budgeting-variance-fpa',8,'Why use materiality thresholds?','So effort goes to the large variances.'),
('budgeting-variance-fpa',9,'What should variance commentary state?','The cause, whether it is one-off or recurring, and the action.'),
('budgeting-variance-fpa',10,'What does FP&A do?','Budget, track actuals, explain variances and update the forecast.'),
('capital-budgeting-npv-irr',1,'NPV','PV of future cash flows − initial investment. Accept if > 0.'),
('capital-budgeting-npv-irr',2,'IRR','The discount rate at which NPV = 0.'),
('capital-budgeting-npv-irr',3,'IRR decision rule','Accept if IRR > required return.'),
('capital-budgeting-npv-irr',4,'Profitability index','PV of inflows ÷ investment. Accept if > 1.'),
('capital-budgeting-npv-irr',5,'Payback period','Years to recover the initial investment.'),
('capital-budgeting-npv-irr',6,'Payback weaknesses','Ignores the time value of money and cash flows after payback.'),
('capital-budgeting-npv-irr',7,'Discounted payback','Payback using discounted cash flows.'),
('capital-budgeting-npv-irr',8,'When NPV and IRR disagree','Follow NPV.'),
('capital-budgeting-npv-irr',9,'A project earning exactly the cost of capital has…','An NPV of zero.'),
('capital-budgeting-npv-irr',10,'Discount rate for project cash flows','The cost of capital (WACC), adjusted for project risk.'),
('working-capital-ccc',1,'Net working capital','Current assets − Current liabilities.'),
('working-capital-ccc',2,'DSO','Receivables ÷ Sales × 365.'),
('working-capital-ccc',3,'DIO','Inventory ÷ COGS × 365.'),
('working-capital-ccc',4,'DPO','Payables ÷ COGS × 365.'),
('working-capital-ccc',5,'Cash conversion cycle','DIO + DSO − DPO.'),
('working-capital-ccc',6,'Negative CCC means…','Customers pay before suppliers are paid; suppliers fund the business.'),
('working-capital-ccc',7,'How to shorten the CCC','Collect faster, hold less stock, pay suppliers later.'),
('working-capital-ccc',8,'Cash released by cutting DSO','Daily sales × days reduced.'),
('working-capital-ccc',9,'Why growth consumes cash','Stock and receivables must be funded before the cash arrives.'),
('working-capital-ccc',10,'Action that lengthens the CCC','Offering customers longer credit terms.'),
('model-structure',1,'Model structure','Inputs → calculations → outputs.'),
('model-structure',2,'Blue font convention','Hard-coded inputs.'),
('model-structure',3,'Net income flows to…','Retained earnings (less dividends).'),
('model-structure',4,'PP&E roll-forward','Closing = opening + capex − depreciation.'),
('model-structure',5,'Retained earnings roll-forward','Closing = opening + net income − dividends.'),
('model-structure',6,'CFO (indirect)','Net income + D&A − increase in receivables + increase in payables.'),
('model-structure',7,'Closing cash','Opening cash + CFO + CFI + CFF.'),
('model-structure',8,'Balance check','Assets − (liabilities + equity) = 0 every period.'),
('model-structure',9,'Revolver','Borrows automatically when cash would go negative.'),
('model-structure',10,'Why avoid hard-codes in formulas?','They hide assumptions and are missed when inputs change.'),
('revenue-drivers-forecasting',1,'Price × volume growth','(1 + volume growth)(1 + price growth) − 1.'),
('revenue-drivers-forecasting',2,'Subscription customers','Opening × (1 − churn) + new customers.'),
('revenue-drivers-forecasting',3,'Subscription revenue','Customers × ARPU.'),
('revenue-drivers-forecasting',4,'Retail growth drivers','Same-store sales growth plus new stores.'),
('revenue-drivers-forecasting',5,'Market-share build','Market size × share.'),
('revenue-drivers-forecasting',6,'CAGR','(End ÷ Start)^(1/years) − 1.'),
('revenue-drivers-forecasting',7,'Hockey stick','Sudden growth acceleration with no driver — a red flag.'),
('revenue-drivers-forecasting',8,'Three sanity checks','History, capacity and market size.'),
('revenue-drivers-forecasting',9,'Why forecast by drivers?','Each assumption is explicit and testable.'),
('revenue-drivers-forecasting',10,'Best practice','Forecast revenue two ways and check they agree.'),
('scenarios-sensitivity',1,'Sensitivity analysis','Change one input at a time (or two in a data table).'),
('scenarios-sensitivity',2,'Scenario analysis','Change several linked inputs together: bull, base, bear.'),
('scenarios-sensitivity',3,'Base case','The most likely set of assumptions.'),
('scenarios-sensitivity',4,'Tornado chart','Ranks inputs by how much they move the output.'),
('scenarios-sensitivity',5,'Scenario switch','A 1/2/3 selector (CHOOSE/INDEX) that flips all drivers together.'),
('scenarios-sensitivity',6,'Probability-weighted value','Σ (probability × value).'),
('scenarios-sensitivity',7,'Keep scenarios consistent','Growth, margins, working capital and capex must move together.'),
('scenarios-sensitivity',8,'A good bear case stresses','Liquidity and covenants, not only earnings.'),
('scenarios-sensitivity',9,'EV from a multiple','EBITDA × EV/EBITDA multiple.'),
('scenarios-sensitivity',10,'Sensitivities vs scenarios','Sensitivities show which assumption matters; scenarios show what could happen.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;

-- ---------------------------------------------------------------------
-- 5. Challenges and exams
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('corpfin-variance-review', 'Budget Review: Visayas Beverages',
 'Compare budget with actuals, find the variances and explain them.',
 $md$
**Visayas Beverages** (₱ millions), full year:

| | Budget | Actual |
|---|---|---|
| Revenue | 2,000 | 2,150 |
| Cost of goods sold | 1,200 | 1,290 |
| Operating expenses | 500 | 520 |
$md$, 'Answer in ₱ millions. Two decimals where needed.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Variance math","weight":75},{"label":"Commentary","weight":25}]',
 '{"financial_analysis":1.0,"technical_knowledge":0.5,"communication":0.4}',
 $j${"tasks":[
   {"id":"revvar","type":"numeric","label":"Revenue variance","prompt":"Revenue variance (₱m)?","unit":"₱m","points":10},
   {"id":"revpct","type":"numeric","label":"Revenue variance %","prompt":"Revenue variance as a % of budget?","unit":"%","points":10},
   {"id":"gpb","type":"numeric","label":"Budget gross profit","prompt":"Budget gross profit (₱m)?","unit":"₱m","points":10},
   {"id":"gpa","type":"numeric","label":"Actual gross profit","prompt":"Actual gross profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebitb","type":"numeric","label":"Budget EBIT","prompt":"Budget operating profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebita","type":"numeric","label":"Actual EBIT","prompt":"Actual operating profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebitpct","type":"numeric","label":"EBIT variance %","prompt":"Operating profit variance as a % of budget (two decimals)?","unit":"%","points":10},
   {"id":"cost","type":"mcq","label":"Cost variance","prompt":"Actual COGS of 1,290 against a budget of 1,200 is…","options":[{"id":"a","label":"Favourable, because revenue was higher"},{"id":"b","label":"Unfavourable in absolute terms, but small relative to the extra revenue"},{"id":"c","label":"Irrelevant to profit"},{"id":"d","label":"A revenue variance"}],"points":5},
   {"id":"comment","type":"long_text","label":"Variance commentary","prompt":"Write variance commentary for management: what drove the result, what you would investigate and what you would change in the forecast.","min_words":50,"points":25}
 ]}$j$::jsonb, '{corporate_finance}', true, now()),

('corpfin-capital-budget', 'Capital Budget: Mindoro Resort Expansion',
 'Evaluate a resort expansion with NPV, payback and the profitability index.',
 $md$
**Mindoro Resort** is considering an expansion (₱ thousands). The required return is **10%**.

| Item | Value |
|---|---|
| Initial investment (today) | 5,000 |
| Cash inflow, year 1 | 1,500 |
| Cash inflow, year 2 | 1,800 |
| Cash inflow, year 3 | 2,000 |
| Cash inflow, year 4 | 2,200 |
$md$, 'Answer in ₱ thousands. Two decimals.', 'valuation', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Capital budgeting math","weight":75},{"label":"Decision judgment","weight":25}]',
 '{"valuation":0.8,"financial_analysis":0.7,"decision_making":0.7}',
 $j${"tasks":[
   {"id":"pv","type":"numeric","label":"PV of inflows","prompt":"Present value of the four inflows (₱k)?","unit":"₱k","points":18},
   {"id":"npv","type":"numeric","label":"NPV","prompt":"NPV (₱k)?","unit":"₱k","points":18},
   {"id":"pi","type":"numeric","label":"Profitability index","prompt":"Profitability index (two decimals)?","unit":"x","points":12},
   {"id":"pb","type":"numeric","label":"Payback","prompt":"Payback period in years (two decimals, assume cash arrives evenly within a year)?","unit":"years","points":12},
   {"id":"dec","type":"mcq","label":"Decision","prompt":"Based on NPV, you should…","options":[{"id":"a","label":"Accept the expansion"},{"id":"b","label":"Reject the expansion"},{"id":"c","label":"Wait for a lower discount rate"},{"id":"d","label":"Decide on payback alone"}],"points":10},
   {"id":"irr","type":"mcq","label":"IRR","prompt":"Because NPV at 10% is positive, the project's IRR is…","options":[{"id":"a","label":"Below 10%"},{"id":"b","label":"Exactly 10%"},{"id":"c","label":"Above 10%"},{"id":"d","label":"Cannot be determined"}],"points":10},
   {"id":"risk","type":"long_text","label":"Risks","prompt":"Name the key risks to this project's cash flows and how you would test them before approving the investment.","min_words":50,"points":20}
 ]}$j$::jsonb, '{corporate_finance}', true, now()),

('exam-corporate-finance', 'Final Exam: Certified Corporate Finance & FP&A Analyst',
 'Timed exam: time value of money, capital budgeting, variances and working capital.',
 $md$
**Luzon Packaging** (₱):

| Item | Detail |
|---|---|
| Project | Invest ₱3,000k now; inflows of ₱1,200k a year for 4 years; required return 10% |
| Deposit | ₱500,000 invested at 6% a year for 5 years |
| Revenue | Budget ₱8,000k; actual ₱7,600k |
| Working capital | Annual sales ₱18,250k; annual COGS ₱14,600k; receivables ₱2,500k; inventory ₱4,000k; payables ₱2,000k |
| Perpetuity | ₱120k a year forever at 8% |
$md$, 'You have 60 minutes. Two decimals where needed. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Corporate finance math","weight":78},{"label":"Judgment","weight":22}]',
 '{"financial_analysis":1.0,"valuation":0.6,"technical_knowledge":0.6,"decision_making":0.4}',
 $j${"tasks":[
   {"id":"npv","type":"numeric","label":"NPV","prompt":"Project NPV (₱k, two decimals)?","unit":"₱k","points":12},
   {"id":"pb","type":"numeric","label":"Payback","prompt":"Payback period (years)?","unit":"years","points":8},
   {"id":"fv","type":"numeric","label":"Future value","prompt":"Value of the deposit after 5 years (₱)?","unit":"₱","points":8},
   {"id":"revvar","type":"numeric","label":"Revenue variance","prompt":"Revenue variance (₱k, negative if below budget)?","unit":"₱k","points":8},
   {"id":"dso","type":"numeric","label":"DSO","prompt":"DSO (days)?","unit":"days","points":6},
   {"id":"ccc","type":"numeric","label":"CCC","prompt":"Cash conversion cycle (days)?","unit":"days","points":12},
   {"id":"perp","type":"numeric","label":"Perpetuity","prompt":"Present value of the perpetuity (₱k)?","unit":"₱k","points":8},
   {"id":"act","type":"mcq","label":"Shorten the CCC","prompt":"Which action shortens the cash conversion cycle?","options":[{"id":"a","label":"Offering longer customer credit terms"},{"id":"b","label":"Collecting receivables faster"},{"id":"c","label":"Building up extra safety stock"},{"id":"d","label":"Paying suppliers earlier"}],"points":8},
   {"id":"conf","type":"mcq","label":"NPV vs IRR","prompt":"For mutually exclusive projects, when NPV and IRR give different rankings you should…","options":[{"id":"a","label":"Follow IRR"},{"id":"b","label":"Follow NPV"},{"id":"c","label":"Follow payback"},{"id":"d","label":"Pick the cheaper project"}],"points":8},
   {"id":"memo","type":"long_text","label":"Recommendation","prompt":"Write a short recommendation on the project and on the company's working capital, using your results.","min_words":80,"points":22}
 ]}$j$::jsonb, '{certification_exam}', true, now()),

('modeling-three-statement-roll', 'Model Roll-Forward: Cavite Cement Mini-Model',
 'Roll a balance sheet forward one year and make it balance.',
 $md$
**Cavite Cement** (₱ millions). Year-0 balance sheet: cash 200; receivables 150; inventory 100; PP&E 1,000; payables 120; debt 400; equity 930.

Year-1 assumptions: net income 144; dividends 44; capex 150; depreciation 100; receivables 180; inventory 110; payables 140; debt repayment 50.
$md$, 'Answer in ₱ millions. Enter outflows as negative numbers.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Modelling math","weight":80},{"label":"Judgment","weight":20}]',
 '{"financial_analysis":0.8,"technical_knowledge":0.8}',
 $j${"tasks":[
   {"id":"ppe","type":"numeric","label":"Closing PP&E","prompt":"Closing PP&E (₱m)?","unit":"₱m","points":12},
   {"id":"equity","type":"numeric","label":"Closing equity","prompt":"Closing equity (₱m)?","unit":"₱m","points":12},
   {"id":"cfo","type":"numeric","label":"CFO","prompt":"Cash flow from operations (₱m)?","unit":"₱m","points":16},
   {"id":"cff","type":"numeric","label":"CFF","prompt":"Cash flow from financing (₱m, negative = outflow)?","unit":"₱m","points":12},
   {"id":"cash","type":"numeric","label":"Closing cash","prompt":"Closing cash (₱m)?","unit":"₱m","points":16},
   {"id":"assets","type":"numeric","label":"Total assets","prompt":"Total assets (₱m)?","unit":"₱m","points":12},
   {"id":"check","type":"mcq","label":"Balance check","prompt":"Total liabilities plus equity should equal…","options":[{"id":"a","label":"Net income"},{"id":"b","label":"Total assets"},{"id":"c","label":"Closing cash"},{"id":"d","label":"Revenue"}],"points":8},
   {"id":"note","type":"long_text","label":"Model notes","prompt":"Explain how the three statements link in this roll-forward and what checks you would build into the model.","min_words":40,"points":12}
 ]}$j$::jsonb, '{modeling}', true, now()),

('modeling-scenario-valuation', 'Scenario Valuation: Subic Logistics',
 'Value a company across bull, base and bear cases and run a sensitivity.',
 $md$
**Subic Logistics** (₱ millions unless stated). Net debt ₱300m; 50 million shares.

| Case | Enterprise value | Probability |
|---|---|---|
| Bear | 900 | 25% |
| Base | 1,200 | 50% |
| Bull | 1,500 | 25% |

Sensitivity: a 1-point rise in WACC cuts the **base** enterprise value by 10%.
$md$, 'Answer in ₱ millions, or ₱ per share where stated. Two decimals where needed.', 'valuation', 'tasks', null, 'advanced', 25, 100, 60, 'auto',
 '[{"label":"Valuation math","weight":80},{"label":"Judgment","weight":20}]',
 '{"valuation":1.0,"financial_analysis":0.6,"investment_judgment":0.5}',
 $j${"tasks":[
   {"id":"pwev","type":"numeric","label":"Weighted EV","prompt":"Probability-weighted enterprise value (₱m)?","unit":"₱m","points":12},
   {"id":"pweq","type":"numeric","label":"Weighted equity value","prompt":"Probability-weighted equity value (₱m)?","unit":"₱m","points":12},
   {"id":"ps","type":"numeric","label":"Value per share","prompt":"Probability-weighted value per share (₱)?","unit":"₱","points":12},
   {"id":"bear","type":"numeric","label":"Bear per share","prompt":"Bear-case value per share (₱)?","unit":"₱","points":10},
   {"id":"bull","type":"numeric","label":"Bull per share","prompt":"Bull-case value per share (₱)?","unit":"₱","points":10},
   {"id":"sens","type":"numeric","label":"Sensitivity","prompt":"Base-case value per share after the 1-point WACC rise (₱, two decimals)?","unit":"₱","points":14},
   {"id":"type","type":"mcq","label":"Tool","prompt":"Changing only WACC and watching the value is an example of…","options":[{"id":"a","label":"Scenario analysis"},{"id":"b","label":"Sensitivity analysis"},{"id":"c","label":"A balance check"},{"id":"d","label":"Variance analysis"}],"points":10},
   {"id":"view","type":"long_text","label":"Conclusion","prompt":"The shares trade at ₱15. Using your results, give a view and name the assumptions that matter most.","min_words":50,"points":20}
 ]}$j$::jsonb, '{modeling}', true, now()),

('exam-financial-modeling', 'Final Exam: Certified Financial Modeling Analyst',
 'Timed exam: roll-forward, revenue drivers, scenario valuation and model integrity.',
 $md$
**Panay Foods** (₱ thousands unless stated).

Year-0 balance sheet: cash 100; receivables 80; PP&E 600; payables 60; debt 200; equity 520. Year-1: net income 70; dividends 20; capex 90; depreciation 60; receivables 95; payables 70; debt unchanged.

Revenue: year-1 volume 20,000 units at ₱300. In year 2, volume grows **8%** and price grows **3%**.

Valuation: bull ₱140 (30%), base ₱110 (50%), bear ₱60 (20%) per share.
$md$, 'You have 60 minutes. Two decimals where needed. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Modelling math","weight":80},{"label":"Judgment","weight":20}]',
 '{"financial_analysis":1.0,"valuation":0.5,"technical_knowledge":0.8}',
 $j${"tasks":[
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
 ]}$j$::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug in ('exam-corporate-finance', 'exam-financial-modeling');

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('corpfin-variance-review', $j${"revvar":{"answer":150,"tolerance_pct":0.5},"revpct":{"answer":7.5,"tolerance_pct":0.5},"gpb":{"answer":800,"tolerance_pct":0.5},"gpa":{"answer":860,"tolerance_pct":0.5},
   "ebitb":{"answer":300,"tolerance_pct":0.5},"ebita":{"answer":340,"tolerance_pct":0.5},"ebitpct":{"answer":13.33,"tolerance_pct":1},"cost":{"answer":"b"},
   "comment":{"keywords":["revenue|volume|price","cost|cogs|margin","favourable|favorable|unfavourable|unfavorable","forecast|reforecast|action","investigate|driver|cause"],"keywords_required":3}}$j$),
 ('corpfin-capital-budget', $j${"pv":{"answer":5856.5,"tolerance_pct":0.5},"npv":{"answer":856.5,"tolerance_pct":1},"pi":{"answer":1.17,"tolerance_pct":1},"pb":{"answer":2.85,"tolerance_pct":1.5},"dec":{"answer":"a"},"irr":{"answer":"c"},
   "risk":{"keywords":["demand|revenue|occupancy|volume","sensitiv|scenario|downside","cost|capex|overrun","discount rate|wacc|cost of capital","tourism|seasonal|competition|risk"],"keywords_required":3}}$j$),
 ('exam-corporate-finance', $j${"npv":{"answer":803.84,"tolerance_pct":1},"pb":{"answer":2.5,"tolerance_pct":0.5},"fv":{"answer":669113,"tolerance_pct":0.5},"revvar":{"answer":-400,"tolerance_pct":0.5},"dso":{"answer":50,"tolerance_pct":0.5},
   "ccc":{"answer":100,"tolerance_pct":0.5},"perp":{"answer":1500,"tolerance_pct":0.5},"act":{"answer":"b"},"conf":{"answer":"b"},
   "memo":{"keywords":["npv|net present value","payback","accept|approve|recommend","working capital|cash conversion|ccc","receivable|inventory|collect|dso|dio"],"keywords_required":4}}$j$),
 ('modeling-three-statement-roll', $j${"ppe":{"answer":1050,"tolerance_pct":0.5},"equity":{"answer":1030,"tolerance_pct":0.5},"cfo":{"answer":224,"tolerance_pct":0.5},"cff":{"answer":-94,"tolerance_pct":0.5},"cash":{"answer":180,"tolerance_pct":0.5},
   "assets":{"answer":1520,"tolerance_pct":0.5},"check":{"answer":"b"},
   "note":{"keywords":["net income|retained earnings","cash flow|cash","balance|check","depreciation|capex|ppe","working capital|receivable|payable"],"keywords_required":3}}$j$),
 ('modeling-scenario-valuation', $j${"pwev":{"answer":1200,"tolerance_pct":0.5},"pweq":{"answer":900,"tolerance_pct":0.5},"ps":{"answer":18,"tolerance_pct":0.5},"bear":{"answer":12,"tolerance_pct":0.5},"bull":{"answer":24,"tolerance_pct":0.5},
   "sens":{"answer":15.6,"tolerance_pct":1},"type":{"answer":"b"},
   "view":{"keywords":["upside|undervalued|discount|buy","wacc|discount rate","scenario|bear|bull|base","net debt|leverage","probab"],"keywords_required":3}}$j$),
 ('exam-financial-modeling', $j${"ppe":{"answer":630,"tolerance_pct":0.5},"equity":{"answer":570,"tolerance_pct":0.5},"cfo":{"answer":125,"tolerance_pct":0.5},"cash":{"answer":115,"tolerance_pct":0.5},"assets":{"answer":840,"tolerance_pct":0.5},
   "rev2":{"answer":6674400,"tolerance_pct":0.5},"gr":{"answer":11.24,"tolerance_pct":1},"ev":{"answer":109,"tolerance_pct":0.5},"chk":{"answer":"b"},"hs":{"answer":"b"},
   "memo":{"keywords":["link|flow|retained earnings","balance|check","cash flow|cash","assumption|input|driver","sensitiv|scenario|stress"],"keywords_required":4}}$j$)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certifications
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('corporate-finance-fpa', 'certification', 'Corporate Finance & FP&A',
 'Time value of money, capital budgeting, variance analysis and working capital.',
 $md$
The toolkit of a corporate finance and FP&A analyst: discount cash flows, evaluate projects with NPV and IRR, run budget-versus-actual variance analysis, and manage working capital through the cash conversion cycle.

1. Pass each lesson's video, practice and knowledge check.
2. Pass every case challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
$md$, 'financial_analysis', 'intermediate', 3.5, 'Certified Corporate Finance & FP&A Analyst', true, 6),
('financial-modeling', 'certification', 'Financial Modeling',
 'Structure a model, forecast revenue from drivers and test it with scenarios.',
 $md$
How professionals build models that can be trusted: clean structure, linked three statements, driver-based forecasts, integrity checks, and scenario and sensitivity analysis.

1. Pass each lesson's video, practice and knowledge check.
2. Pass every case challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
$md$, 'financial_analysis', 'advanced', 3.5, 'Certified Financial Modeling Analyst', true, 7)
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
