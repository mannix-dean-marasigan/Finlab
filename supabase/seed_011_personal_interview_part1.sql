-- seed_011_personal_interview: part 1 of 3. Run the parts in order.
-- =====================================================================
-- FINLAB — Content v11: Personal Finance Essentials (track) and
--   Finance Interview Prep (certification)
--   7 lessons (video + 10-question check + 2 practice activities + 10 flashcards),
--   3 challenges, 1 timed final exam, 2 programs, 2 new categories.
-- Run AFTER seed_010. Safe to re-run.
-- =====================================================================

insert into public.challenge_categories (id, name, description, icon, sort_order) values
 ('personal_finance', 'Personal Finance', 'Budgeting, saving, compounding and investing basics.', 'trending-up', 9),
 ('career_prep', 'Interview Prep', 'Technical questions for finance internships and analyst roles.', 'target', 10)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 1. Lessons
-- ---------------------------------------------------------------------
insert into public.lessons (slug, title, summary, category_id, difficulty, estimated_minutes, sort_order, related_challenge_slugs, video_urls, body) values
('budgeting-503020', 'Budgeting with the 50/30/20 Rule', 'Take-home pay, needs, wants and paying yourself first.', 'personal_finance', 'beginner', 12, 40,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=XLD0f5Nzr3c}', '
## Start with take-home pay
Your budget runs on **take-home pay** — what lands in your account after tax and mandatory contributions (SSS, PhilHealth, Pag-IBIG).

## The 50/30/20 rule
- **50% needs:** rent, groceries, utilities, transport to work, minimum debt payments.
- **30% wants:** dining out, streaming, hobbies, travel, shopping.
- **20% savings and debt repayment:** emergency fund, investments, extra debt payments.

On ₱30,000 take-home: needs ₱15,000, wants ₱9,000, savings ₱6,000.

## Make it work
- **Pay yourself first:** move savings out the day you are paid, before spending.
- **Track** spending for a month to see where money really goes.
- If needs are above 50%, trim wants or raise income — adjust the split (for example 60/20/20) rather than abandon the habit.

> A budget is not a punishment: it is a decision about what your money should do before it disappears.
'),
('compound-interest-saving', 'Compound Interest & Saving Early', 'Simple vs compound interest, the rule of 72 and why starting early matters.', 'personal_finance', 'beginner', 12, 41,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=JWhkxNLOGFk}', '
## Simple vs compound
- **Simple interest** is paid only on the original amount: ₱50,000 at 6% for 3 years earns 50,000 × 6% × 3 = **₱9,000**.
- **Compound interest** is paid on the amount **plus past interest**: 50,000 × 1.06³ = **₱59,551**.

Compounding makes growth accelerate: each year''s interest is bigger than the last.

## The rule of 72
Years to double ≈ **72 ÷ rate (%)**. At 8%, money doubles in about 9 years; at 6%, about 12 years.

## Why starting early wins
Time gives compounding more rounds to work with. Saving the same amount ten years earlier can leave you with far more, because the early pesos have decades to grow.

## Beat inflation
**Real return ≈ nominal return − inflation.** A savings account paying 1% while prices rise 4% **loses** purchasing power.

> The two levers you control are how much you save and how long you let it compound.
'),
('investing-basics-funds', 'Investing Basics: Stocks, Bonds & Funds', 'Ownership vs lending, mutual funds and ETFs, risk, diversification and fees.', 'personal_finance', 'beginner', 15, 42,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=qIw-yFC-HNU}', '
## The building blocks
- **Stocks:** a share of ownership. You may earn from price growth and dividends — and you can lose money.
- **Bonds:** a loan to a government or company. It pays **interest (coupon)** and returns the **face value** at maturity.
- **Mutual funds** and **ETFs:** pooled baskets of many securities, giving instant diversification. ETFs trade on an exchange during the day; mutual funds are priced once a day.

## Risk and return
Higher potential return comes with **higher risk**. Stocks fluctuate more than bonds, but have historically earned more over long periods.

## Practical rules
- **Diversify:** spread money so no single investment can sink you.
- **Match risk to time horizon:** money needed within 2 years belongs in low-risk assets; long-term money can take more stock risk.
- **Watch fees:** a 1.5% expense ratio on ₱200,000 costs ₱3,000 a year — and it compounds against you.
- **Peso-cost averaging:** invest a fixed amount regularly instead of timing the market.

> Educational content, not investment advice. Understand what you buy and never invest money you cannot afford to lose.
'),
('emergency-fund-inflation', 'Emergency Funds & Inflation', 'How much to hold, where to keep it, and what inflation does to cash.', 'personal_finance', 'beginner', 12, 43,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=xAJgl6ml4YQ}', '
## What it is
An **emergency fund** is cash set aside for job loss, medical bills or urgent repairs — so a surprise doesn''t become debt.

## How much?
Typically **3–6 months of essential expenses** (not income). Freelancers and single-income households need more; salaried workers with stable jobs can aim lower.

## Where to keep it
Somewhere **safe and accessible**: a savings account or money-market fund. Not in volatile investments you might have to sell at a loss.

## Inflation
Inflation raises prices over time, so cash loses purchasing power. At 4% inflation, ₱100,000 buys about ₱96,154 worth of today''s goods a year from now. **Real return ≈ interest rate − inflation.**

## Order of priorities
1. Build a starter emergency fund.
2. Pay off **high-interest debt** (credit cards charging 3% a month beat any investment).
3. Then invest for the long term.

> Revisit the target each year: as prices rise, a fixed peso amount covers less.
'),
('interview-three-statements', 'Interview: The Three Statements', 'How the statements link and how to walk through a depreciation question.', 'career_prep', 'intermediate', 15, 44,
 '{interview-mock-technical}', '{https://www.youtube.com/watch?v=89D59hk_NIo}', '
## The question you will be asked
*"Walk me through the three financial statements and how they link."*

**A strong answer:** the income statement shows profit over a period; **net income** flows to the **cash flow statement** (start of operating cash flow) and to **retained earnings** on the balance sheet. The cash flow statement adjusts for non-cash items and working capital and ends in the **change in cash**, which updates the balance sheet''s cash.

## The classic: "Depreciation goes up by ₱20. Walk me through it." (tax rate 25%)
1. **Income statement:** EBIT falls by 20; tax falls by 5; **net income falls by 15**.
2. **Cash flow statement:** start at −15, **add back** 20 of non-cash depreciation → **cash from operations rises by 5** (the tax shield).
3. **Balance sheet:** cash **+5**, PP&E **−20** → assets **−15**; retained earnings **−15**. It balances.

## Other patterns
- Increase in receivables → lowers operating cash flow.
- Buying equipment with cash → assets unchanged in total (cash down, PP&E up).
- Borrowing to buy inventory → assets and liabilities both rise.

> Interviewers care that you can explain the **why**, not only recite the steps.
'),
('interview-dcf-walkthrough', 'Interview: Walk Me Through a DCF', 'A 60-second DCF answer, unlevered free cash flow, terminal value and the equity bridge.', 'career_prep', 'intermediate', 15, 45,
 '{interview-mock-technical}', '{https://www.youtube.com/watch?v=3T_P0ym1DFs}', '
## The 60-second answer
*"A DCF values a company at the present value of its future cash flows. I project **unlevered free cash flow** for 5–10 years, calculate a **terminal value**, discount everything at the **WACC** to get **enterprise value**, then subtract **net debt** to reach **equity value** and divide by diluted shares."*

## The pieces
- **UFCF** = EBIT × (1 − tax) + D&A − capex − increase in NWC.
- **Terminal value (Gordon growth)** = FCF × (1 + g) ÷ (WACC − g). Or use an exit multiple.
- **Discounting:** PV = Cash flow ÷ (1 + WACC)ⁿ. Discount the terminal value too.
- **Equity bridge:** Equity value = EV − net debt (and preferred, minorities).

## Follow-ups to expect
- Terminal value is often **60–80% of EV** — so the answer is sensitive to assumptions.
- Cross-check the two terminal methods; show a **WACC × growth** sensitivity.
- Use **unlevered** cash flows with **WACC**; mixing levered cash flows with WACC is a classic error.
- A higher WACC lowers value.

> Practise saying it out loud with a simple numerical example.
'),
('interview-ev-equity', 'Interview: Enterprise Value vs Equity Value', 'The bridge, why cash is subtracted and which multiple pairs with which value.', 'career_prep', 'intermediate', 15, 46,
 '{interview-mock-technical}', '{https://www.youtube.com/watch?v=nhcx4efjRl8}', '
## Two different values
- **Equity value** = share price × diluted shares. It belongs to shareholders.
- **Enterprise value (EV)** = equity value + debt + preferred stock + minority interest − cash. It is the value of the operating business to **all** capital providers.

## Why subtract cash?
Cash is not part of the operating business, and if you bought the company the cash would offset part of the price you pay.

## Pairing multiples
- **EV** pairs with metrics available to all capital providers: **EV/EBITDA**, EV/Revenue.
- **Equity value** pairs with metrics available to shareholders: **P/E** (equity value ÷ net income).
- **EV/EBITDA** compares companies with different debt levels better, because it is capital-structure neutral.

## Going from a multiple to a price
Implied EV = EBITDA × multiple → subtract net debt (and preferred, minorities) → implied equity value → ÷ diluted shares = implied share price.

> Memorising the formula isn''t enough: be ready to explain why each item is added or subtracted.
')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('budgeting-503020',
 '[{"id":"q1","type":"numeric","label":"Needs","prompt":"Take-home pay is ₱30,000. The 50% needs budget (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Wants","prompt":"On the same pay, the 30% wants budget (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"Savings","prompt":"On the same pay, the 20% savings target (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"mcq","label":"A need","prompt":"Which is a need?","options":[{"id":"a","label":"Streaming subscription"},{"id":"b","label":"Rent"},{"id":"c","label":"Concert tickets"},{"id":"d","label":"Dining out"}],"points":10},
     {"id":"q5","type":"mcq","label":"A want","prompt":"Which is a want?","options":[{"id":"a","label":"Electricity"},{"id":"b","label":"Groceries"},{"id":"c","label":"Dining out"},{"id":"d","label":"Minimum loan payment"}],"points":10},
     {"id":"q6","type":"numeric","label":"Needs share","prompt":"Take-home ₱40,000. Rent ₱12,000, food ₱6,000, transport ₱3,000, utilities ₱2,000. Needs as a % of take-home?","unit":"%","points":10},
     {"id":"q7","type":"mcq","label":"Pay yourself first","prompt":"''Pay yourself first'' means…","options":[{"id":"a","label":"Spend on wants before bills"},{"id":"b","label":"Move savings out when you are paid, before spending"},{"id":"c","label":"Pay your debts last"},{"id":"d","label":"Save whatever is left at month end"}],"points":10},
     {"id":"q8","type":"mcq","label":"Needs above 50%","prompt":"If needs take more than 50% of your pay, a sensible response is to…","options":[{"id":"a","label":"Stop budgeting"},{"id":"b","label":"Trim wants or raise income, and adjust the split"},{"id":"c","label":"Borrow to cover wants"},{"id":"d","label":"Cancel all savings forever"}],"points":10},
     {"id":"q9","type":"numeric","label":"Saving a year","prompt":"You save ₱5,000 a month for 12 months (ignore interest). Total saved (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"Take-home pay","prompt":"Take-home pay is…","options":[{"id":"a","label":"Your pay before tax"},{"id":"b","label":"Your pay after tax and mandatory contributions"},{"id":"c","label":"Your bonus only"},{"id":"d","label":"Your savings"}],"points":10}]',
 '{"q1":{"answer":15000,"tolerance_pct":0.5},"q2":{"answer":9000,"tolerance_pct":0.5},"q3":{"answer":6000,"tolerance_pct":0.5},"q4":{"answer":"b"},"q5":{"answer":"c"},"q6":{"answer":57.5,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"b"},"q9":{"answer":60000,"tolerance_pct":0.5},"q10":{"answer":"b"}}'),
('compound-interest-saving',
 '[{"id":"q1","type":"numeric","label":"Simple interest","prompt":"₱50,000 earns 6% simple interest for 3 years. Total interest (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Compound value","prompt":"₱50,000 at 6% compounded annually for 3 years grows to (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"Rule of 72","prompt":"At 6% a year, about how many years does money take to double?","unit":"years","points":10},
     {"id":"q4","type":"mcq","label":"Compounding","prompt":"Compound interest means interest is earned on…","options":[{"id":"a","label":"The original amount only"},{"id":"b","label":"The original amount plus previously earned interest"},{"id":"c","label":"Inflation"},{"id":"d","label":"Taxes"}],"points":10},
     {"id":"q5","type":"numeric","label":"Doubling","prompt":"Using the rule of 72, ₱10,000 at 8% for 9 years grows to roughly (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Starting early","prompt":"Starting to save earlier helps because…","options":[{"id":"a","label":"Money has more time to compound"},{"id":"b","label":"Interest rates are higher when you are young"},{"id":"c","label":"Banks pay bonuses"},{"id":"d","label":"Taxes disappear"}],"points":10},
     {"id":"q7","type":"numeric","label":"Contributions","prompt":"You deposit ₱2,000 every month for a year. Total contributed (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"Real return","prompt":"Nominal return 7%, inflation 3%. Approximate real return (%)?","unit":"%","points":10},
     {"id":"q9","type":"mcq","label":"Inflation","prompt":"A savings account pays 1% while inflation is 4%. Your purchasing power…","options":[{"id":"a","label":"Grows"},{"id":"b","label":"Falls"},{"id":"c","label":"Stays the same"},{"id":"d","label":"Doubles"}],"points":10},
     {"id":"q10","type":"numeric","label":"Two years","prompt":"₱20,000 at 10% compounded annually for 2 years grows to (₱)?","unit":"₱","points":10}]',
 '{"q1":{"answer":9000,"tolerance_pct":0.5},"q2":{"answer":59551,"tolerance_pct":0.5},"q3":{"answer":12,"tolerance_pct":1},"q4":{"answer":"b"},"q5":{"answer":20000,"tolerance_pct":1},"q6":{"answer":"a"},"q7":{"answer":24000,"tolerance_pct":0.5},"q8":{"answer":4,"tolerance_pct":5},"q9":{"answer":"b"},"q10":{"answer":24200,"tolerance_pct":0.5}}'),
('investing-basics-funds',
 '[{"id":"q1","type":"mcq","label":"Stocks and bonds","prompt":"Stocks and bonds differ because…","options":[{"id":"a","label":"Stockholders own part of the company; bondholders lend to it"},{"id":"b","label":"Bonds are always riskier"},{"id":"c","label":"Stocks always pay interest"},{"id":"d","label":"They are the same"}],"points":10},
     {"id":"q2","type":"mcq","label":"Funds","prompt":"A mutual fund or ETF…","options":[{"id":"a","label":"Holds a basket of many securities"},{"id":"b","label":"Is a single stock"},{"id":"c","label":"Is a savings account"},{"id":"d","label":"Guarantees returns"}],"points":10},
     {"id":"q3","type":"mcq","label":"ETF vs mutual fund","prompt":"A key difference is that ETFs…","options":[{"id":"a","label":"Trade on an exchange throughout the day"},{"id":"b","label":"Can only be bought once a year"},{"id":"c","label":"Hold only bonds"},{"id":"d","label":"Have no fees"}],"points":10},
     {"id":"q4","type":"numeric","label":"Coupon","prompt":"A bond has a face value of ₱100,000 and a 6% annual coupon. Annual interest (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Risk and return","prompt":"Higher potential returns generally come with…","options":[{"id":"a","label":"Higher risk"},{"id":"b","label":"Lower risk"},{"id":"c","label":"No risk"},{"id":"d","label":"Guaranteed gains"}],"points":10},
     {"id":"q6","type":"numeric","label":"Fees","prompt":"A fund charges a 1.5% expense ratio on ₱200,000. Annual fee (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Diversification","prompt":"Diversification means…","options":[{"id":"a","label":"Putting everything in one stock"},{"id":"b","label":"Spreading money so no single investment can sink you"},{"id":"c","label":"Trading daily"},{"id":"d","label":"Avoiding all risk"}],"points":10},
     {"id":"q8","type":"mcq","label":"Time horizon","prompt":"Money you need within 2 years should usually be in…","options":[{"id":"a","label":"Volatile stocks"},{"id":"b","label":"Low-risk, accessible assets"},{"id":"c","label":"A single speculative asset"},{"id":"d","label":"Whatever is trending"}],"points":10},
     {"id":"q9","type":"numeric","label":"Dividend yield","prompt":"A stock pays ₱3 a year in dividends and trades at ₱60. Dividend yield (%)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Cost averaging","prompt":"Peso-cost averaging means…","options":[{"id":"a","label":"Investing a fixed amount at regular intervals"},{"id":"b","label":"Investing everything at the market low"},{"id":"c","label":"Selling when prices fall"},{"id":"d","label":"Avoiding investing"}],"points":10}]',
 '{"q1":{"answer":"a"},"q2":{"answer":"a"},"q3":{"answer":"a"},"q4":{"answer":6000,"tolerance_pct":0.5},"q5":{"answer":"a"},"q6":{"answer":3000,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"b"},"q9":{"answer":5,"tolerance_pct":0.5},"q10":{"answer":"a"}}'),
('emergency-fund-inflation',
 '[{"id":"q1","type":"numeric","label":"Six months","prompt":"Essential expenses are ₱25,000 a month. A 6-month emergency fund (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Three months","prompt":"A 3-month emergency fund on the same expenses (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"mcq","label":"Where to keep it","prompt":"An emergency fund is best kept in…","options":[{"id":"a","label":"A volatile stock"},{"id":"b","label":"A safe, accessible account such as savings or a money-market fund"},{"id":"c","label":"Cryptocurrency"},{"id":"d","label":"A long lock-in investment"}],"points":10},
     {"id":"q4","type":"mcq","label":"Inflation","prompt":"Inflation…","options":[{"id":"a","label":"Raises the purchasing power of cash"},{"id":"b","label":"Erodes the purchasing power of cash"},{"id":"c","label":"Has no effect on savings"},{"id":"d","label":"Only affects stocks"}],"points":10},
     {"id":"q5","type":"numeric","label":"Purchasing power","prompt":"₱100,000 in cash and 4% inflation: its purchasing power a year from now, in today''s pesos, is about (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Priorities","prompt":"Before investing aggressively you should first…","options":[{"id":"a","label":"Build a starter emergency fund"},{"id":"b","label":"Buy the newest phone"},{"id":"c","label":"Borrow to invest"},{"id":"d","label":"Stop saving"}],"points":10},
     {"id":"q7","type":"numeric","label":"Time to goal","prompt":"You save ₱3,000 a month toward a ₱90,000 target (ignore interest). Months needed?","unit":"months","points":10},
     {"id":"q8","type":"mcq","label":"Bigger fund","prompt":"Who typically needs a bigger emergency fund?","options":[{"id":"a","label":"A freelancer with irregular income"},{"id":"b","label":"Someone with a very stable salary and no dependants"},{"id":"c","label":"No one"},{"id":"d","label":"Only retirees"}],"points":10},
     {"id":"q9","type":"numeric","label":"Real return","prompt":"A savings account pays 2% while inflation is 4%. Real return (%, negative if you lose)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"High-interest debt","prompt":"A credit card charging 3% a month should generally be…","options":[{"id":"a","label":"Paid off before investing for modest returns"},{"id":"b","label":"Ignored"},{"id":"c","label":"Increased"},{"id":"d","label":"Refinanced into a longer card"}],"points":10}]',
 '{"q1":{"answer":150000,"tolerance_pct":0.5},"q2":{"answer":75000,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":"b"},"q5":{"answer":96154,"tolerance_pct":0.5},"q6":{"answer":"a"},"q7":{"answer":30,"tolerance_pct":0.5},"q8":{"answer":"a"},"q9":{"answer":-2,"tolerance_pct":0.5},"q10":{"answer":"a"}}'),
('interview-three-statements',
 '[{"id":"q1","type":"numeric","label":"Net income","prompt":"Depreciation rises by ₱10 and the tax rate is 25%. Net income falls by (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Cash","prompt":"Same facts: cash from operations changes by (₱, positive if it rises)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"PP&E","prompt":"Same facts: PP&E falls by (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"mcq","label":"Starting point","prompt":"Net income is the starting line of which statement (indirect method)?","options":[{"id":"a","label":"The balance sheet"},{"id":"b","label":"The cash flow statement"},{"id":"c","label":"The statement of equity only"},{"id":"d","label":"None of them"}],"points":10},
     {"id":"q5","type":"mcq","label":"Receivables","prompt":"An increase in accounts receivable…","options":[{"id":"a","label":"Raises operating cash flow"},{"id":"b","label":"Lowers operating cash flow"},{"id":"c","label":"Has no cash effect"},{"id":"d","label":"Is a financing item"}],"points":10},
     {"id":"q6","type":"numeric","label":"Buying equipment","prompt":"A company buys ₱100 of equipment with cash. The change in total assets (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Borrowing","prompt":"A company borrows ₱100 and uses it to buy inventory. Which is correct?","options":[{"id":"a","label":"Assets and liabilities both rise by ₱100"},{"id":"b","label":"Only assets rise"},{"id":"c","label":"Equity rises by ₱100"},{"id":"d","label":"Nothing changes"}],"points":10},
     {"id":"q8","type":"mcq","label":"Linking","prompt":"Which statement connects profit to the change in cash on the balance sheet?","options":[{"id":"a","label":"The cash flow statement"},{"id":"b","label":"The income statement alone"},{"id":"c","label":"The notes to the accounts"},{"id":"d","label":"The tax return"}],"points":10},
     {"id":"q9","type":"numeric","label":"Write-down","prompt":"A ₱20 inventory write-down with a 25% tax rate reduces net income by (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"Retained earnings","prompt":"Retained earnings change by…","options":[{"id":"a","label":"Net income minus dividends"},{"id":"b","label":"Revenue minus costs of goods sold"},{"id":"c","label":"Cash flow from operations"},{"id":"d","label":"Total assets"}],"points":10}]',
 '{"q1":{"answer":7.5,"tolerance_pct":0.5},"q2":{"answer":2.5,"tolerance_pct":0.5},"q3":{"answer":10,"tolerance_pct":0.5},"q4":{"answer":"b"},"q5":{"answer":"b"},"q6":{"answer":0,"tolerance_abs":0.01},"q7":{"answer":"a"},"q8":{"answer":"a"},"q9":{"answer":15,"tolerance_pct":0.5},"q10":{"answer":"a"}}'),
('interview-dcf-walkthrough',
 '[{"id":"q1","type":"numeric","label":"UFCF","prompt":"EBIT ₱200; tax 25%; D&A ₱50; capex ₱70; increase in NWC ₱10. Unlevered free cash flow (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Terminal value","prompt":"Final-year FCF ₱120; growth 3%; WACC 9%. Terminal value by Gordon growth (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"PV of TV","prompt":"That terminal value is at the end of year 5. Its present value at 9% (₱, one decimal)?","unit":"₱","points":10},
     {"id":"q4","type":"mcq","label":"Discount rate","prompt":"Unlevered free cash flows are discounted at the…","options":[{"id":"a","label":"Cost of equity"},{"id":"b","label":"WACC"},{"id":"c","label":"Risk-free rate"},{"id":"d","label":"Inflation rate"}],"points":10},
     {"id":"q5","type":"mcq","label":"Equity bridge","prompt":"To go from enterprise value to equity value you…","options":[{"id":"a","label":"Add net debt"},{"id":"b","label":"Subtract net debt"},{"id":"c","label":"Multiply by the tax rate"},{"id":"d","label":"Add the terminal value again"}],"points":10},
     {"id":"q6","type":"numeric","label":"Price per share","prompt":"EV ₱1,500; net debt ₱400; 50 shares. Implied value per share (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Terminal value share","prompt":"Terminal value is often a large share of EV because…","options":[{"id":"a","label":"Most value arises beyond the explicit forecast period"},{"id":"b","label":"It is always wrong"},{"id":"c","label":"It ignores growth"},{"id":"d","label":"Forecasts are too long"}],"points":10},
     {"id":"q8","type":"mcq","label":"Consistency","prompt":"Discounting levered free cash flows at WACC is…","options":[{"id":"a","label":"The standard method"},{"id":"b","label":"An inconsistency that makes the valuation wrong"},{"id":"c","label":"Required by IFRS"},{"id":"d","label":"Only wrong for banks"}],"points":10},
     {"id":"q9","type":"mcq","label":"WACC change","prompt":"If WACC rises, DCF value…","options":[{"id":"a","label":"Rises"},{"id":"b","label":"Falls"},{"id":"c","label":"Stays the same"},{"id":"d","label":"Becomes negative"}],"points":10},
     {"id":"q10","type":"numeric","label":"Present value","prompt":"Free cash flow in year 3 is ₱130 and WACC is 10%. Its present value (₱, two decimals)?","unit":"₱","points":10}]',
 '{"q1":{"answer":120,"tolerance_pct":0.5},"q2":{"answer":2060,"tolerance_pct":0.5},"q3":{"answer":1338.9,"tolerance_pct":0.5},"q4":{"answer":"b"},"q5":{"answer":"b"},"q6":{"answer":22,"tolerance_pct":0.5},"q7":{"answer":"a"},"q8":{"answer":"b"},"q9":{"answer":"b"},"q10":{"answer":97.67,"tolerance_pct":0.5}}'),
('interview-ev-equity',
 '[{"id":"q1","type":"numeric","label":"Equity value","prompt":"Share price ₱50; diluted shares 20 million. Equity value (₱m)?","unit":"₱m","points":10},
     {"id":"q2","type":"numeric","label":"Enterprise value","prompt":"Equity value ₱1,000m; debt ₱400m; cash ₱150m (no preferred or minorities). Enterprise value (₱m)?","unit":"₱m","points":10},
     {"id":"q3","type":"mcq","label":"Why subtract cash","prompt":"Cash is subtracted to get enterprise value because…","options":[{"id":"a","label":"It is not part of the operating business and offsets the price a buyer pays"},{"id":"b","label":"Cash is a liability"},{"id":"c","label":"Cash is taxed"},{"id":"d","label":"It is always zero"}],"points":10},
     {"id":"q4","type":"mcq","label":"Pairing","prompt":"Which pairing is correct?","options":[{"id":"a","label":"EV with EBITDA; equity value with net income"},{"id":"b","label":"EV with net income; equity value with EBITDA"},{"id":"c","label":"Equity value with revenue only"},{"id":"d","label":"EV with dividends"}],"points":10},
     {"id":"q5","type":"numeric","label":"EV/EBITDA","prompt":"EV ₱1,250m; EBITDA ₱250m. EV/EBITDA (x)?","unit":"x","points":10},
     {"id":"q6","type":"numeric","label":"P/E","prompt":"Equity value ₱1,000m; net income ₱80m. P/E (x)?","unit":"x","points":10},
     {"id":"q7","type":"mcq","label":"Capital structure","prompt":"For companies with different debt levels, a better comparison is…","options":[{"id":"a","label":"EV/EBITDA, which is capital-structure neutral"},{"id":"b","label":"P/E only"},{"id":"c","label":"Share price"},{"id":"d","label":"Dividend per share"}],"points":10},
     {"id":"q8","type":"numeric","label":"Implied EV","prompt":"EBITDA ₱300m at a 6x multiple. Implied EV (₱m)?","unit":"₱m","points":10},
     {"id":"q9","type":"numeric","label":"Implied equity","prompt":"With net debt of ₱500m, the implied equity value from that EV (₱m)?","unit":"₱m","points":10},
     {"id":"q10","type":"mcq","label":"The bridge","prompt":"Which items are added to equity value to reach enterprise value?","options":[{"id":"a","label":"Debt, preferred stock and minority interest"},{"id":"b","label":"Cash and investments"},{"id":"c","label":"Revenue and profit"},{"id":"d","label":"Only dividends"}],"points":10}]',
 '{"q1":{"answer":1000,"tolerance_pct":0.5},"q2":{"answer":1250,"tolerance_pct":0.5},"q3":{"answer":"a"},"q4":{"answer":"a"},"q5":{"answer":5,"tolerance_pct":0.5},"q6":{"answer":12.5,"tolerance_pct":0.5},"q7":{"answer":"a"},"q8":{"answer":1800,"tolerance_pct":0.5},"q9":{"answer":1300,"tolerance_pct":0.5},"q10":{"answer":"a"}}')
), upd as (
  update public.lessons l set check_questions = qs.questions::jsonb
  from qs where l.slug = qs.slug and jsonb_array_length(l.check_questions) = 0
  returning l.id, qs.answers
)
insert into public.lesson_check_keys (lesson_id, answers)
select id, answers::jsonb from upd
on conflict (lesson_id) do nothing;
