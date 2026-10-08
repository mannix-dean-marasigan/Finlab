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
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=XLD0f5Nzr3c}', $md$
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
$md$),
('compound-interest-saving', 'Compound Interest & Saving Early', 'Simple vs compound interest, the rule of 72 and why starting early matters.', 'personal_finance', 'beginner', 12, 41,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=JWhkxNLOGFk}', $md$
## Simple vs compound
- **Simple interest** is paid only on the original amount: ₱50,000 at 6% for 3 years earns 50,000 × 6% × 3 = **₱9,000**.
- **Compound interest** is paid on the amount **plus past interest**: 50,000 × 1.06³ = **₱59,551**.

Compounding makes growth accelerate: each year's interest is bigger than the last.

## The rule of 72
Years to double ≈ **72 ÷ rate (%)**. At 8%, money doubles in about 9 years; at 6%, about 12 years.

## Why starting early wins
Time gives compounding more rounds to work with. Saving the same amount ten years earlier can leave you with far more, because the early pesos have decades to grow.

## Beat inflation
**Real return ≈ nominal return − inflation.** A savings account paying 1% while prices rise 4% **loses** purchasing power.

> The two levers you control are how much you save and how long you let it compound.
$md$),
('investing-basics-funds', 'Investing Basics: Stocks, Bonds & Funds', 'Ownership vs lending, mutual funds and ETFs, risk, diversification and fees.', 'personal_finance', 'beginner', 15, 42,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=qIw-yFC-HNU}', $md$
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
$md$),
('emergency-fund-inflation', 'Emergency Funds & Inflation', 'How much to hold, where to keep it, and what inflation does to cash.', 'personal_finance', 'beginner', 12, 43,
 '{personal-finance-plan}', '{https://www.youtube.com/watch?v=xAJgl6ml4YQ}', $md$
## What it is
An **emergency fund** is cash set aside for job loss, medical bills or urgent repairs — so a surprise doesn't become debt.

## How much?
Typically **3–6 months of essential expenses** (not income). Freelancers and single-income households need more; salaried workers with stable jobs can aim lower.

## Where to keep it
Somewhere **safe and accessible**: a savings account or money-market fund. Not in volatile investments you might have to sell at a loss.

## Inflation
Inflation raises prices over time, so cash loses purchasing power. At 4% inflation, ₱100,000 buys about ₱96,154 worth of today's goods a year from now. **Real return ≈ interest rate − inflation.**

## Order of priorities
1. Build a starter emergency fund.
2. Pay off **high-interest debt** (credit cards charging 3% a month beat any investment).
3. Then invest for the long term.

> Revisit the target each year: as prices rise, a fixed peso amount covers less.
$md$),
('interview-three-statements', 'Interview: The Three Statements', 'How the statements link and how to walk through a depreciation question.', 'career_prep', 'intermediate', 15, 44,
 '{interview-mock-technical}', '{https://www.youtube.com/watch?v=89D59hk_NIo}', $md$
## The question you will be asked
*"Walk me through the three financial statements and how they link."*

**A strong answer:** the income statement shows profit over a period; **net income** flows to the **cash flow statement** (start of operating cash flow) and to **retained earnings** on the balance sheet. The cash flow statement adjusts for non-cash items and working capital and ends in the **change in cash**, which updates the balance sheet's cash.

## The classic: "Depreciation goes up by ₱20. Walk me through it." (tax rate 25%)
1. **Income statement:** EBIT falls by 20; tax falls by 5; **net income falls by 15**.
2. **Cash flow statement:** start at −15, **add back** 20 of non-cash depreciation → **cash from operations rises by 5** (the tax shield).
3. **Balance sheet:** cash **+5**, PP&E **−20** → assets **−15**; retained earnings **−15**. It balances.

## Other patterns
- Increase in receivables → lowers operating cash flow.
- Buying equipment with cash → assets unchanged in total (cash down, PP&E up).
- Borrowing to buy inventory → assets and liabilities both rise.

> Interviewers care that you can explain the **why**, not only recite the steps.
$md$),
('interview-dcf-walkthrough', 'Interview: Walk Me Through a DCF', 'A 60-second DCF answer, unlevered free cash flow, terminal value and the equity bridge.', 'career_prep', 'intermediate', 15, 45,
 '{interview-mock-technical}', '{https://www.youtube.com/watch?v=3T_P0ym1DFs}', $md$
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
$md$),
('interview-ev-equity', 'Interview: Enterprise Value vs Equity Value', 'The bridge, why cash is subtracted and which multiple pairs with which value.', 'career_prep', 'intermediate', 15, 46,
 '{interview-mock-technical}', '{https://www.youtube.com/watch?v=nhcx4efjRl8}', $md$
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

> Memorising the formula isn't enough: be ready to explain why each item is added or subtracted.
$md$)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('budgeting-503020',
 $j$[{"id":"q1","type":"numeric","label":"Needs","prompt":"Take-home pay is ₱30,000. The 50% needs budget (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Wants","prompt":"On the same pay, the 30% wants budget (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"Savings","prompt":"On the same pay, the 20% savings target (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"mcq","label":"A need","prompt":"Which is a need?","options":[{"id":"a","label":"Streaming subscription"},{"id":"b","label":"Rent"},{"id":"c","label":"Concert tickets"},{"id":"d","label":"Dining out"}],"points":10},
     {"id":"q5","type":"mcq","label":"A want","prompt":"Which is a want?","options":[{"id":"a","label":"Electricity"},{"id":"b","label":"Groceries"},{"id":"c","label":"Dining out"},{"id":"d","label":"Minimum loan payment"}],"points":10},
     {"id":"q6","type":"numeric","label":"Needs share","prompt":"Take-home ₱40,000. Rent ₱12,000, food ₱6,000, transport ₱3,000, utilities ₱2,000. Needs as a % of take-home?","unit":"%","points":10},
     {"id":"q7","type":"mcq","label":"Pay yourself first","prompt":"'Pay yourself first' means…","options":[{"id":"a","label":"Spend on wants before bills"},{"id":"b","label":"Move savings out when you are paid, before spending"},{"id":"c","label":"Pay your debts last"},{"id":"d","label":"Save whatever is left at month end"}],"points":10},
     {"id":"q8","type":"mcq","label":"Needs above 50%","prompt":"If needs take more than 50% of your pay, a sensible response is to…","options":[{"id":"a","label":"Stop budgeting"},{"id":"b","label":"Trim wants or raise income, and adjust the split"},{"id":"c","label":"Borrow to cover wants"},{"id":"d","label":"Cancel all savings forever"}],"points":10},
     {"id":"q9","type":"numeric","label":"Saving a year","prompt":"You save ₱5,000 a month for 12 months (ignore interest). Total saved (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"Take-home pay","prompt":"Take-home pay is…","options":[{"id":"a","label":"Your pay before tax"},{"id":"b","label":"Your pay after tax and mandatory contributions"},{"id":"c","label":"Your bonus only"},{"id":"d","label":"Your savings"}],"points":10}]$j$,
 $j${"q1":{"answer":15000,"tolerance_pct":0.5},"q2":{"answer":9000,"tolerance_pct":0.5},"q3":{"answer":6000,"tolerance_pct":0.5},"q4":{"answer":"b"},"q5":{"answer":"c"},"q6":{"answer":57.5,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"b"},"q9":{"answer":60000,"tolerance_pct":0.5},"q10":{"answer":"b"}}$j$),
('compound-interest-saving',
 $j$[{"id":"q1","type":"numeric","label":"Simple interest","prompt":"₱50,000 earns 6% simple interest for 3 years. Total interest (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Compound value","prompt":"₱50,000 at 6% compounded annually for 3 years grows to (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"Rule of 72","prompt":"At 6% a year, about how many years does money take to double?","unit":"years","points":10},
     {"id":"q4","type":"mcq","label":"Compounding","prompt":"Compound interest means interest is earned on…","options":[{"id":"a","label":"The original amount only"},{"id":"b","label":"The original amount plus previously earned interest"},{"id":"c","label":"Inflation"},{"id":"d","label":"Taxes"}],"points":10},
     {"id":"q5","type":"numeric","label":"Doubling","prompt":"Using the rule of 72, ₱10,000 at 8% for 9 years grows to roughly (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Starting early","prompt":"Starting to save earlier helps because…","options":[{"id":"a","label":"Money has more time to compound"},{"id":"b","label":"Interest rates are higher when you are young"},{"id":"c","label":"Banks pay bonuses"},{"id":"d","label":"Taxes disappear"}],"points":10},
     {"id":"q7","type":"numeric","label":"Contributions","prompt":"You deposit ₱2,000 every month for a year. Total contributed (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"Real return","prompt":"Nominal return 7%, inflation 3%. Approximate real return (%)?","unit":"%","points":10},
     {"id":"q9","type":"mcq","label":"Inflation","prompt":"A savings account pays 1% while inflation is 4%. Your purchasing power…","options":[{"id":"a","label":"Grows"},{"id":"b","label":"Falls"},{"id":"c","label":"Stays the same"},{"id":"d","label":"Doubles"}],"points":10},
     {"id":"q10","type":"numeric","label":"Two years","prompt":"₱20,000 at 10% compounded annually for 2 years grows to (₱)?","unit":"₱","points":10}]$j$,
 $j${"q1":{"answer":9000,"tolerance_pct":0.5},"q2":{"answer":59551,"tolerance_pct":0.5},"q3":{"answer":12,"tolerance_pct":1},"q4":{"answer":"b"},"q5":{"answer":20000,"tolerance_pct":1},"q6":{"answer":"a"},"q7":{"answer":24000,"tolerance_pct":0.5},"q8":{"answer":4,"tolerance_pct":5},"q9":{"answer":"b"},"q10":{"answer":24200,"tolerance_pct":0.5}}$j$),
('investing-basics-funds',
 $j$[{"id":"q1","type":"mcq","label":"Stocks and bonds","prompt":"Stocks and bonds differ because…","options":[{"id":"a","label":"Stockholders own part of the company; bondholders lend to it"},{"id":"b","label":"Bonds are always riskier"},{"id":"c","label":"Stocks always pay interest"},{"id":"d","label":"They are the same"}],"points":10},
     {"id":"q2","type":"mcq","label":"Funds","prompt":"A mutual fund or ETF…","options":[{"id":"a","label":"Holds a basket of many securities"},{"id":"b","label":"Is a single stock"},{"id":"c","label":"Is a savings account"},{"id":"d","label":"Guarantees returns"}],"points":10},
     {"id":"q3","type":"mcq","label":"ETF vs mutual fund","prompt":"A key difference is that ETFs…","options":[{"id":"a","label":"Trade on an exchange throughout the day"},{"id":"b","label":"Can only be bought once a year"},{"id":"c","label":"Hold only bonds"},{"id":"d","label":"Have no fees"}],"points":10},
     {"id":"q4","type":"numeric","label":"Coupon","prompt":"A bond has a face value of ₱100,000 and a 6% annual coupon. Annual interest (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Risk and return","prompt":"Higher potential returns generally come with…","options":[{"id":"a","label":"Higher risk"},{"id":"b","label":"Lower risk"},{"id":"c","label":"No risk"},{"id":"d","label":"Guaranteed gains"}],"points":10},
     {"id":"q6","type":"numeric","label":"Fees","prompt":"A fund charges a 1.5% expense ratio on ₱200,000. Annual fee (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Diversification","prompt":"Diversification means…","options":[{"id":"a","label":"Putting everything in one stock"},{"id":"b","label":"Spreading money so no single investment can sink you"},{"id":"c","label":"Trading daily"},{"id":"d","label":"Avoiding all risk"}],"points":10},
     {"id":"q8","type":"mcq","label":"Time horizon","prompt":"Money you need within 2 years should usually be in…","options":[{"id":"a","label":"Volatile stocks"},{"id":"b","label":"Low-risk, accessible assets"},{"id":"c","label":"A single speculative asset"},{"id":"d","label":"Whatever is trending"}],"points":10},
     {"id":"q9","type":"numeric","label":"Dividend yield","prompt":"A stock pays ₱3 a year in dividends and trades at ₱60. Dividend yield (%)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Cost averaging","prompt":"Peso-cost averaging means…","options":[{"id":"a","label":"Investing a fixed amount at regular intervals"},{"id":"b","label":"Investing everything at the market low"},{"id":"c","label":"Selling when prices fall"},{"id":"d","label":"Avoiding investing"}],"points":10}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":"a"},"q3":{"answer":"a"},"q4":{"answer":6000,"tolerance_pct":0.5},"q5":{"answer":"a"},"q6":{"answer":3000,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"b"},"q9":{"answer":5,"tolerance_pct":0.5},"q10":{"answer":"a"}}$j$),
('emergency-fund-inflation',
 $j$[{"id":"q1","type":"numeric","label":"Six months","prompt":"Essential expenses are ₱25,000 a month. A 6-month emergency fund (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Three months","prompt":"A 3-month emergency fund on the same expenses (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"mcq","label":"Where to keep it","prompt":"An emergency fund is best kept in…","options":[{"id":"a","label":"A volatile stock"},{"id":"b","label":"A safe, accessible account such as savings or a money-market fund"},{"id":"c","label":"Cryptocurrency"},{"id":"d","label":"A long lock-in investment"}],"points":10},
     {"id":"q4","type":"mcq","label":"Inflation","prompt":"Inflation…","options":[{"id":"a","label":"Raises the purchasing power of cash"},{"id":"b","label":"Erodes the purchasing power of cash"},{"id":"c","label":"Has no effect on savings"},{"id":"d","label":"Only affects stocks"}],"points":10},
     {"id":"q5","type":"numeric","label":"Purchasing power","prompt":"₱100,000 in cash and 4% inflation: its purchasing power a year from now, in today's pesos, is about (₱)?","unit":"₱","points":10},
     {"id":"q6","type":"mcq","label":"Priorities","prompt":"Before investing aggressively you should first…","options":[{"id":"a","label":"Build a starter emergency fund"},{"id":"b","label":"Buy the newest phone"},{"id":"c","label":"Borrow to invest"},{"id":"d","label":"Stop saving"}],"points":10},
     {"id":"q7","type":"numeric","label":"Time to goal","prompt":"You save ₱3,000 a month toward a ₱90,000 target (ignore interest). Months needed?","unit":"months","points":10},
     {"id":"q8","type":"mcq","label":"Bigger fund","prompt":"Who typically needs a bigger emergency fund?","options":[{"id":"a","label":"A freelancer with irregular income"},{"id":"b","label":"Someone with a very stable salary and no dependants"},{"id":"c","label":"No one"},{"id":"d","label":"Only retirees"}],"points":10},
     {"id":"q9","type":"numeric","label":"Real return","prompt":"A savings account pays 2% while inflation is 4%. Real return (%, negative if you lose)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"High-interest debt","prompt":"A credit card charging 3% a month should generally be…","options":[{"id":"a","label":"Paid off before investing for modest returns"},{"id":"b","label":"Ignored"},{"id":"c","label":"Increased"},{"id":"d","label":"Refinanced into a longer card"}],"points":10}]$j$,
 $j${"q1":{"answer":150000,"tolerance_pct":0.5},"q2":{"answer":75000,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":"b"},"q5":{"answer":96154,"tolerance_pct":0.5},"q6":{"answer":"a"},"q7":{"answer":30,"tolerance_pct":0.5},"q8":{"answer":"a"},"q9":{"answer":-2,"tolerance_pct":0.5},"q10":{"answer":"a"}}$j$),
('interview-three-statements',
 $j$[{"id":"q1","type":"numeric","label":"Net income","prompt":"Depreciation rises by ₱10 and the tax rate is 25%. Net income falls by (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Cash","prompt":"Same facts: cash from operations changes by (₱, positive if it rises)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"PP&E","prompt":"Same facts: PP&E falls by (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"mcq","label":"Starting point","prompt":"Net income is the starting line of which statement (indirect method)?","options":[{"id":"a","label":"The balance sheet"},{"id":"b","label":"The cash flow statement"},{"id":"c","label":"The statement of equity only"},{"id":"d","label":"None of them"}],"points":10},
     {"id":"q5","type":"mcq","label":"Receivables","prompt":"An increase in accounts receivable…","options":[{"id":"a","label":"Raises operating cash flow"},{"id":"b","label":"Lowers operating cash flow"},{"id":"c","label":"Has no cash effect"},{"id":"d","label":"Is a financing item"}],"points":10},
     {"id":"q6","type":"numeric","label":"Buying equipment","prompt":"A company buys ₱100 of equipment with cash. The change in total assets (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Borrowing","prompt":"A company borrows ₱100 and uses it to buy inventory. Which is correct?","options":[{"id":"a","label":"Assets and liabilities both rise by ₱100"},{"id":"b","label":"Only assets rise"},{"id":"c","label":"Equity rises by ₱100"},{"id":"d","label":"Nothing changes"}],"points":10},
     {"id":"q8","type":"mcq","label":"Linking","prompt":"Which statement connects profit to the change in cash on the balance sheet?","options":[{"id":"a","label":"The cash flow statement"},{"id":"b","label":"The income statement alone"},{"id":"c","label":"The notes to the accounts"},{"id":"d","label":"The tax return"}],"points":10},
     {"id":"q9","type":"numeric","label":"Write-down","prompt":"A ₱20 inventory write-down with a 25% tax rate reduces net income by (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"Retained earnings","prompt":"Retained earnings change by…","options":[{"id":"a","label":"Net income minus dividends"},{"id":"b","label":"Revenue minus costs of goods sold"},{"id":"c","label":"Cash flow from operations"},{"id":"d","label":"Total assets"}],"points":10}]$j$,
 $j${"q1":{"answer":7.5,"tolerance_pct":0.5},"q2":{"answer":2.5,"tolerance_pct":0.5},"q3":{"answer":10,"tolerance_pct":0.5},"q4":{"answer":"b"},"q5":{"answer":"b"},"q6":{"answer":0,"tolerance_abs":0.01},"q7":{"answer":"a"},"q8":{"answer":"a"},"q9":{"answer":15,"tolerance_pct":0.5},"q10":{"answer":"a"}}$j$),
('interview-dcf-walkthrough',
 $j$[{"id":"q1","type":"numeric","label":"UFCF","prompt":"EBIT ₱200; tax 25%; D&A ₱50; capex ₱70; increase in NWC ₱10. Unlevered free cash flow (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Terminal value","prompt":"Final-year FCF ₱120; growth 3%; WACC 9%. Terminal value by Gordon growth (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"PV of TV","prompt":"That terminal value is at the end of year 5. Its present value at 9% (₱, one decimal)?","unit":"₱","points":10},
     {"id":"q4","type":"mcq","label":"Discount rate","prompt":"Unlevered free cash flows are discounted at the…","options":[{"id":"a","label":"Cost of equity"},{"id":"b","label":"WACC"},{"id":"c","label":"Risk-free rate"},{"id":"d","label":"Inflation rate"}],"points":10},
     {"id":"q5","type":"mcq","label":"Equity bridge","prompt":"To go from enterprise value to equity value you…","options":[{"id":"a","label":"Add net debt"},{"id":"b","label":"Subtract net debt"},{"id":"c","label":"Multiply by the tax rate"},{"id":"d","label":"Add the terminal value again"}],"points":10},
     {"id":"q6","type":"numeric","label":"Price per share","prompt":"EV ₱1,500; net debt ₱400; 50 shares. Implied value per share (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Terminal value share","prompt":"Terminal value is often a large share of EV because…","options":[{"id":"a","label":"Most value arises beyond the explicit forecast period"},{"id":"b","label":"It is always wrong"},{"id":"c","label":"It ignores growth"},{"id":"d","label":"Forecasts are too long"}],"points":10},
     {"id":"q8","type":"mcq","label":"Consistency","prompt":"Discounting levered free cash flows at WACC is…","options":[{"id":"a","label":"The standard method"},{"id":"b","label":"An inconsistency that makes the valuation wrong"},{"id":"c","label":"Required by IFRS"},{"id":"d","label":"Only wrong for banks"}],"points":10},
     {"id":"q9","type":"mcq","label":"WACC change","prompt":"If WACC rises, DCF value…","options":[{"id":"a","label":"Rises"},{"id":"b","label":"Falls"},{"id":"c","label":"Stays the same"},{"id":"d","label":"Becomes negative"}],"points":10},
     {"id":"q10","type":"numeric","label":"Present value","prompt":"Free cash flow in year 3 is ₱130 and WACC is 10%. Its present value (₱, two decimals)?","unit":"₱","points":10}]$j$,
 $j${"q1":{"answer":120,"tolerance_pct":0.5},"q2":{"answer":2060,"tolerance_pct":0.5},"q3":{"answer":1338.9,"tolerance_pct":0.5},"q4":{"answer":"b"},"q5":{"answer":"b"},"q6":{"answer":22,"tolerance_pct":0.5},"q7":{"answer":"a"},"q8":{"answer":"b"},"q9":{"answer":"b"},"q10":{"answer":97.67,"tolerance_pct":0.5}}$j$),
('interview-ev-equity',
 $j$[{"id":"q1","type":"numeric","label":"Equity value","prompt":"Share price ₱50; diluted shares 20 million. Equity value (₱m)?","unit":"₱m","points":10},
     {"id":"q2","type":"numeric","label":"Enterprise value","prompt":"Equity value ₱1,000m; debt ₱400m; cash ₱150m (no preferred or minorities). Enterprise value (₱m)?","unit":"₱m","points":10},
     {"id":"q3","type":"mcq","label":"Why subtract cash","prompt":"Cash is subtracted to get enterprise value because…","options":[{"id":"a","label":"It is not part of the operating business and offsets the price a buyer pays"},{"id":"b","label":"Cash is a liability"},{"id":"c","label":"Cash is taxed"},{"id":"d","label":"It is always zero"}],"points":10},
     {"id":"q4","type":"mcq","label":"Pairing","prompt":"Which pairing is correct?","options":[{"id":"a","label":"EV with EBITDA; equity value with net income"},{"id":"b","label":"EV with net income; equity value with EBITDA"},{"id":"c","label":"Equity value with revenue only"},{"id":"d","label":"EV with dividends"}],"points":10},
     {"id":"q5","type":"numeric","label":"EV/EBITDA","prompt":"EV ₱1,250m; EBITDA ₱250m. EV/EBITDA (x)?","unit":"x","points":10},
     {"id":"q6","type":"numeric","label":"P/E","prompt":"Equity value ₱1,000m; net income ₱80m. P/E (x)?","unit":"x","points":10},
     {"id":"q7","type":"mcq","label":"Capital structure","prompt":"For companies with different debt levels, a better comparison is…","options":[{"id":"a","label":"EV/EBITDA, which is capital-structure neutral"},{"id":"b","label":"P/E only"},{"id":"c","label":"Share price"},{"id":"d","label":"Dividend per share"}],"points":10},
     {"id":"q8","type":"numeric","label":"Implied EV","prompt":"EBITDA ₱300m at a 6x multiple. Implied EV (₱m)?","unit":"₱m","points":10},
     {"id":"q9","type":"numeric","label":"Implied equity","prompt":"With net debt of ₱500m, the implied equity value from that EV (₱m)?","unit":"₱m","points":10},
     {"id":"q10","type":"mcq","label":"The bridge","prompt":"Which items are added to equity value to reach enterprise value?","options":[{"id":"a","label":"Debt, preferred stock and minority interest"},{"id":"b","label":"Cash and investments"},{"id":"c","label":"Revenue and profit"},{"id":"d","label":"Only dividends"}],"points":10}]$j$,
 $j${"q1":{"answer":1000,"tolerance_pct":0.5},"q2":{"answer":1250,"tolerance_pct":0.5},"q3":{"answer":"a"},"q4":{"answer":"a"},"q5":{"answer":5,"tolerance_pct":0.5},"q6":{"answer":12.5,"tolerance_pct":0.5},"q7":{"answer":"a"},"q8":{"answer":1800,"tolerance_pct":0.5},"q9":{"answer":1300,"tolerance_pct":0.5},"q10":{"answer":"a"}}$j$)
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
('budgeting-503020', 'need-or-want', 1, 'matching', 'Need or want?',
 'Sort each expense into the right bucket.',
 $j${"categories":[{"id":"need","label":"Need"},{"id":"want","label":"Want"}],
     "items":[{"id":"i1","label":"Rent"},{"id":"i2","label":"Groceries"},{"id":"i3","label":"Streaming subscription"},{"id":"i4","label":"Dining out"},
              {"id":"i5","label":"Public transport to work"},{"id":"i6","label":"Concert tickets"},{"id":"i7","label":"Minimum loan payment"},{"id":"i8","label":"Electricity"}]}$j$),
('budgeting-503020', 'build-a-budget', 2, 'worked_example', 'Worked example: build a budget',
 'Split a salary and see what an overspend does. Hints are available but cost points.',
 $j${"intro":"Take-home pay is ₱36,000 a month. Actual rent, food, transport and utilities add up to ₱21,000.",
     "steps":[{"id":"s1","prompt":"The 50% needs target (₱)?","unit":"₱"},{"id":"s2","prompt":"The 30% wants target (₱)?","unit":"₱"},{"id":"s3","prompt":"The 20% savings target (₱)?","unit":"₱"},
              {"id":"s4","prompt":"By how much do actual needs exceed the needs target (₱)?","unit":"₱"},
              {"id":"s5","prompt":"If that overspend comes out of savings, savings as a % of take-home (two decimals)?","unit":"%"}]}$j$),
('compound-interest-saving', 'simple-vs-compound', 1, 'matching', 'Simple or compound?',
 'Which kind of interest does each statement describe?',
 $j${"categories":[{"id":"simple","label":"Simple interest"},{"id":"comp","label":"Compound interest"}],
     "items":[{"id":"i1","label":"Interest only on the original principal"},{"id":"i2","label":"Interest on principal plus past interest"},{"id":"i3","label":"Grows in a straight line"},
              {"id":"i4","label":"Grows faster each year"},{"id":"i5","label":"Typical of long-term investment growth"},{"id":"i6","label":"Used by some short-term loans"}]}$j$),
('compound-interest-saving', 'compounding-steps', 2, 'worked_example', 'Worked example: compounding year by year',
 'Compare simple and compound growth. Hints are available but cost points.',
 $j${"intro":"You invest ₱100,000 at 5% a year for 3 years.",
     "steps":[{"id":"s1","prompt":"Total simple interest over 3 years (₱)?","unit":"₱"},{"id":"s2","prompt":"Value after 3 years with simple interest (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Compound value after year 1 (₱)?","unit":"₱"},{"id":"s4","prompt":"Compound value after year 2 (₱)?","unit":"₱"},{"id":"s5","prompt":"Compound value after year 3 (₱, two decimals)?","unit":"₱"}]}$j$),
('investing-basics-funds', 'which-investment', 1, 'matching', 'Stock, bond or fund?',
 'Match each description to the investment it fits best.',
 $j${"categories":[{"id":"stock","label":"Stock"},{"id":"bond","label":"Bond"},{"id":"fund","label":"Fund (mutual fund / ETF)"}],
     "items":[{"id":"i1","label":"An ownership share in a company"},{"id":"i2","label":"A loan to a government or company"},{"id":"i3","label":"Pools money from many investors"},{"id":"i4","label":"Pays a coupon and returns face value at maturity"},
              {"id":"i5","label":"May pay dividends"},{"id":"i6","label":"Gives instant diversification"},{"id":"i7","label":"Price can swing widely with company results"},{"id":"i8","label":"Run by a professional manager or tracks an index"}]}$j$),
('investing-basics-funds', 'peso-cost-averaging', 2, 'worked_example', 'Worked example: peso-cost averaging',
 'Invest ₱5,000 each month while the price moves. Hints are available but cost points.',
 $j${"intro":"You invest ₱5,000 a month for 4 months in a fund. The unit price in each month is ₱50, ₱40, ₱25 and ₱50.",
     "steps":[{"id":"s1","prompt":"Units bought in month 1?","unit":"units"},{"id":"s2","prompt":"Units bought in month 2?","unit":"units"},{"id":"s3","prompt":"Units bought in month 3?","unit":"units"},
              {"id":"s4","prompt":"Total units after month 4?","unit":"units"},{"id":"s5","prompt":"Average cost per unit (₱, two decimals)?","unit":"₱"},{"id":"s6","prompt":"Value of the holding at the month-4 price of ₱50 (₱)?","unit":"₱"}]}$j$),
('emergency-fund-inflation', 'plan-flaws', 1, 'spot_error', 'Spot the flaws in this money plan',
 'Two parts of Ana''s plan are poor choices. Select them, then check.',
 $j${"context":"Ana takes home ₱30,000 a month; essential expenses are ₱18,000.","columns":["Part of the plan","Choice"],"select_count":2,
     "rows":[{"id":"r1","cells":["Emergency fund target","3 to 6 months of essentials: ₱54,000 to ₱108,000"]},
             {"id":"r2","cells":["Where the emergency fund is kept","In a volatile stock fund"]},
             {"id":"r3","cells":["Debt","Pays only the minimum on a card charging 36% a year while investing in a 6% bond fund"]},
             {"id":"r4","cells":["Monthly saving","₱6,000 (20% of take-home)"]},
             {"id":"r5","cells":["Review","Revisits the plan once a year"]}]}$j$),
('emergency-fund-inflation', 'fund-target', 2, 'worked_example', 'Worked example: set an emergency fund target',
 'Work out the target and how long it takes. Hints are available but cost points.',
 $j${"intro":"Essential expenses are ₱24,000 a month. You can save ₱4,000 a month. Inflation is 4% a year.",
     "steps":[{"id":"s1","prompt":"A 3-month emergency fund target (₱)?","unit":"₱"},{"id":"s2","prompt":"A 6-month emergency fund target (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Months to reach the 3-month target?","unit":"months"},{"id":"s4","prompt":"Months to reach the 6-month target?","unit":"months"},
              {"id":"s5","prompt":"The 3-month target's value in today's pesos after one year of 4% inflation (₱, two decimals)?","unit":"₱"}]}$j$),
('interview-three-statements', 'where-first', 1, 'matching', 'Where does it first appear?',
 'Sort each line item into the statement where it first appears.',
 $j${"categories":[{"id":"is","label":"Income statement"},{"id":"bs","label":"Balance sheet"},{"id":"cfs","label":"Cash flow statement"}],
     "items":[{"id":"i1","label":"Depreciation expense"},{"id":"i2","label":"Accounts receivable"},{"id":"i3","label":"Purchase of equipment"},{"id":"i4","label":"Retained earnings"},
              {"id":"i5","label":"Dividends paid"},{"id":"i6","label":"Interest expense"},{"id":"i7","label":"Inventory"},{"id":"i8","label":"Proceeds from a bond issue"}]}$j$),
('interview-three-statements', 'twenty-of-depreciation', 2, 'worked_example', 'Worked example: ₱20 of extra depreciation',
 'Walk through the interview classic. Tax rate is 25%. Use negative numbers for decreases.',
 $j${"intro":"Depreciation rises by ₱20. Revenue, cash expenses, capex and financing are unchanged. The tax rate is 25%.",
     "steps":[{"id":"s1","prompt":"Change in EBIT (₱)?","unit":"₱"},{"id":"s2","prompt":"Change in taxes paid (₱, negative if taxes fall)?","unit":"₱"},
              {"id":"s3","prompt":"Change in net income (₱)?","unit":"₱"},{"id":"s4","prompt":"Change in cash from operations (₱)?","unit":"₱"},
              {"id":"s5","prompt":"Change in total assets on the balance sheet (cash up, PP&E down) (₱)?","unit":"₱"}]}$j$),
('interview-dcf-walkthrough', 'dcf-order', 1, 'matching', 'Put the DCF pieces in the right step',
 'Match each piece to the step of the DCF it belongs to.',
 $j${"categories":[{"id":"cf","label":"Project cash flows"},{"id":"rate","label":"Discount rate"},{"id":"tv","label":"Terminal value"},{"id":"bridge","label":"Bridge to equity"}],
     "items":[{"id":"i1","label":"Revenue and margin assumptions"},{"id":"i2","label":"EBIT × (1 − t) + D&A − capex − change in NWC"},{"id":"i3","label":"CAPM and after-tax cost of debt"},{"id":"i4","label":"Weights of debt and equity"},
              {"id":"i5","label":"Gordon growth formula"},{"id":"i6","label":"Exit multiple"},{"id":"i7","label":"Subtract net debt"},{"id":"i8","label":"Divide by diluted shares"}]}$j$),
('interview-dcf-walkthrough', 'mini-dcf', 2, 'worked_example', 'Worked example: a two-year DCF',
 'Discount two years of cash flow and a terminal value, then bridge to a share price.',
 $j${"intro":"Free cash flow: ₱100 in year 1 and ₱110 in year 2. The terminal value at the end of year 2 is ₱1,320. WACC is 10%. Net debt is ₱300 and there are 100 shares.",
     "steps":[{"id":"s1","prompt":"PV of year-1 cash flow (₱, two decimals)?","unit":"₱"},{"id":"s2","prompt":"PV of year-2 cash flow (₱, two decimals)?","unit":"₱"},
              {"id":"s3","prompt":"PV of the terminal value (₱, two decimals)?","unit":"₱"},{"id":"s4","prompt":"Enterprise value (₱, two decimals)?","unit":"₱"},
              {"id":"s5","prompt":"Equity value (₱, two decimals)?","unit":"₱"},{"id":"s6","prompt":"Value per share (₱, two decimals)?","unit":"₱"}]}$j$),
('interview-ev-equity', 'added-or-subtracted', 1, 'matching', 'Added or subtracted?',
 'Moving from equity value to enterprise value, is each item added or subtracted?',
 $j${"categories":[{"id":"add","label":"Added"},{"id":"sub","label":"Subtracted"}],
     "items":[{"id":"i1","label":"Bank debt"},{"id":"i2","label":"Preferred stock"},{"id":"i3","label":"Minority interest"},{"id":"i4","label":"Cash and equivalents"},{"id":"i5","label":"Short-term investments"},{"id":"i6","label":"Bonds payable"}]}$j$),
('interview-ev-equity', 'equity-to-ev', 2, 'worked_example', 'Worked example: equity value to EV and multiples',
 'Build the bridge and compute the multiples. Hints are available but cost points.',
 $j${"intro":"Share price ₱40; diluted shares 25 million. Debt ₱350m; preferred stock ₱50m; minority interest ₱20m; cash ₱120m. EBITDA ₱260m; net income ₱80m.",
     "steps":[{"id":"s1","prompt":"Equity value (₱m)?","unit":"₱m"},{"id":"s2","prompt":"Enterprise value (₱m)?","unit":"₱m"},{"id":"s3","prompt":"EV/EBITDA (x)?","unit":"x"},
              {"id":"s4","prompt":"P/E (x)?","unit":"x"},{"id":"s5","prompt":"Implied EV at 6x EBITDA (₱m)?","unit":"₱m"},{"id":"s6","prompt":"Implied share price at 6x EBITDA (₱, two decimals)?","unit":"₱"}]}$j$)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('budgeting-503020', 'need-or-want', $j${"i1":"need","i2":"need","i3":"want","i4":"want","i5":"need","i6":"want","i7":"need","i8":"need"}$j$),
('budgeting-503020', 'build-a-budget', $j${
  "s1":{"answer":18000,"tolerance_pct":0.5,"hint":"50% of take-home.","explanation":"36,000 × 50% = 18,000."},
  "s2":{"answer":10800,"tolerance_pct":0.5,"hint":"30% of take-home.","explanation":"36,000 × 30% = 10,800."},
  "s3":{"answer":7200,"tolerance_pct":0.5,"hint":"20% of take-home.","explanation":"36,000 × 20% = 7,200."},
  "s4":{"answer":3000,"tolerance_pct":0.5,"hint":"Actual needs minus the target.","explanation":"21,000 − 18,000 = 3,000."},
  "s5":{"answer":11.67,"tolerance_pct":1,"hint":"Savings fall to 7,200 − 3,000, then divide by 36,000.","explanation":"4,200 ÷ 36,000 = 11.67%. Overspending on needs eats into savings."}}$j$),
('compound-interest-saving', 'simple-vs-compound', $j${"i1":"simple","i2":"comp","i3":"simple","i4":"comp","i5":"comp","i6":"simple"}$j$),
('compound-interest-saving', 'compounding-steps', $j${
  "s1":{"answer":15000,"tolerance_pct":0.5,"hint":"Principal × rate × years.","explanation":"100,000 × 5% × 3 = 15,000."},
  "s2":{"answer":115000,"tolerance_pct":0.5,"hint":"Principal plus interest.","explanation":"100,000 + 15,000 = 115,000."},
  "s3":{"answer":105000,"tolerance_pct":0.5,"hint":"100,000 × 1.05.","explanation":"100,000 × 1.05 = 105,000."},
  "s4":{"answer":110250,"tolerance_pct":0.5,"hint":"105,000 × 1.05.","explanation":"105,000 × 1.05 = 110,250."},
  "s5":{"answer":115762.5,"tolerance_pct":0.5,"hint":"110,250 × 1.05.","explanation":"110,250 × 1.05 = 115,762.50 — more than simple interest, because interest earns interest."}}$j$),
('investing-basics-funds', 'which-investment', $j${"i1":"stock","i2":"bond","i3":"fund","i4":"bond","i5":"stock","i6":"fund","i7":"stock","i8":"fund"}$j$),
('investing-basics-funds', 'peso-cost-averaging', $j${
  "s1":{"answer":100,"tolerance_pct":0.5,"hint":"5,000 ÷ 50.","explanation":"5,000 ÷ 50 = 100 units."},
  "s2":{"answer":125,"tolerance_pct":0.5,"hint":"5,000 ÷ 40.","explanation":"5,000 ÷ 40 = 125 units."},
  "s3":{"answer":200,"tolerance_pct":0.5,"hint":"5,000 ÷ 25.","explanation":"5,000 ÷ 25 = 200 units — more units when the price is low."},
  "s4":{"answer":525,"tolerance_pct":0.5,"hint":"Add all four months: the last buys 100 units at ₱50.","explanation":"100 + 125 + 200 + 100 = 525 units."},
  "s5":{"answer":38.1,"tolerance_pct":0.5,"hint":"Total invested ÷ total units.","explanation":"20,000 ÷ 525 = 38.10 — lower than the average of the four prices."},
  "s6":{"answer":26250,"tolerance_pct":0.5,"hint":"Units × ₱50.","explanation":"525 × 50 = 26,250."}}$j$),
('emergency-fund-inflation', 'plan-flaws', $j${"errors":["r2","r3"],"explanations":{"r2":"An emergency fund must be safe and accessible. A volatile stock fund can be down exactly when you need the money.","r3":"Paying 36% on a card while earning about 6% loses money. Pay off high-interest debt before investing for modest returns."}}$j$),
('emergency-fund-inflation', 'fund-target', $j${
  "s1":{"answer":72000,"tolerance_pct":0.5,"hint":"3 × 24,000.","explanation":"3 × 24,000 = 72,000."},
  "s2":{"answer":144000,"tolerance_pct":0.5,"hint":"6 × 24,000.","explanation":"6 × 24,000 = 144,000."},
  "s3":{"answer":18,"tolerance_pct":0.5,"hint":"72,000 ÷ 4,000.","explanation":"72,000 ÷ 4,000 = 18 months."},
  "s4":{"answer":36,"tolerance_pct":0.5,"hint":"144,000 ÷ 4,000.","explanation":"144,000 ÷ 4,000 = 36 months."},
  "s5":{"answer":69230.77,"tolerance_pct":0.5,"hint":"72,000 ÷ 1.04.","explanation":"72,000 ÷ 1.04 = 69,230.77: inflation shrinks what cash can buy."}}$j$),
('interview-three-statements', 'where-first', $j${"i1":"is","i2":"bs","i3":"cfs","i4":"bs","i5":"cfs","i6":"is","i7":"bs","i8":"cfs"}$j$),
('interview-three-statements', 'twenty-of-depreciation', $j${
  "s1":{"answer":-20,"tolerance_pct":0.5,"hint":"Depreciation is an operating expense.","explanation":"EBIT falls by 20."},
  "s2":{"answer":-5,"tolerance_pct":0.5,"hint":"25% of the 20 reduction in pre-tax profit.","explanation":"Taxes fall by 25% × 20 = 5."},
  "s3":{"answer":-15,"tolerance_pct":0.5,"hint":"EBIT change minus the tax saving.","explanation":"−20 + 5 = −15."},
  "s4":{"answer":5,"tolerance_pct":0.5,"hint":"Start with the net income change and add back the non-cash 20.","explanation":"−15 + 20 = +5 (the tax shield)."},
  "s5":{"answer":-15,"tolerance_pct":0.5,"hint":"Cash +5 and PP&E −20.","explanation":"+5 − 20 = −15, matching the −15 fall in retained earnings. It balances."}}$j$),
('interview-dcf-walkthrough', 'dcf-order', $j${"i1":"cf","i2":"cf","i3":"rate","i4":"rate","i5":"tv","i6":"tv","i7":"bridge","i8":"bridge"}$j$),
('interview-dcf-walkthrough', 'mini-dcf', $j${
  "s1":{"answer":90.91,"tolerance_pct":0.5,"hint":"100 ÷ 1.10.","explanation":"100 ÷ 1.1 = 90.91."},
  "s2":{"answer":90.91,"tolerance_pct":0.5,"hint":"110 ÷ 1.10².","explanation":"110 ÷ 1.21 = 90.91."},
  "s3":{"answer":1090.91,"tolerance_pct":0.5,"hint":"Discount the terminal value by two years.","explanation":"1,320 ÷ 1.21 = 1,090.91."},
  "s4":{"answer":1272.73,"tolerance_pct":0.5,"hint":"Add the three present values.","explanation":"90.91 + 90.91 + 1,090.91 = 1,272.73."},
  "s5":{"answer":972.73,"tolerance_pct":0.5,"hint":"Subtract net debt.","explanation":"1,272.73 − 300 = 972.73."},
  "s6":{"answer":9.73,"tolerance_pct":0.5,"hint":"Divide by 100 shares.","explanation":"972.73 ÷ 100 = 9.73. Note the terminal value is 86% of EV."}}$j$),
('interview-ev-equity', 'added-or-subtracted', $j${"i1":"add","i2":"add","i3":"add","i4":"sub","i5":"sub","i6":"add"}$j$),
('interview-ev-equity', 'equity-to-ev', $j${
  "s1":{"answer":1000,"tolerance_pct":0.5,"hint":"Price × diluted shares.","explanation":"40 × 25 = 1,000."},
  "s2":{"answer":1300,"tolerance_pct":0.5,"hint":"Add debt, preferred and minority interest; subtract cash.","explanation":"1,000 + 350 + 50 + 20 − 120 = 1,300."},
  "s3":{"answer":5,"tolerance_pct":0.5,"hint":"EV ÷ EBITDA.","explanation":"1,300 ÷ 260 = 5.0x."},
  "s4":{"answer":12.5,"tolerance_pct":0.5,"hint":"Equity value ÷ net income.","explanation":"1,000 ÷ 80 = 12.5x."},
  "s5":{"answer":1560,"tolerance_pct":0.5,"hint":"EBITDA × 6.","explanation":"260 × 6 = 1,560."},
  "s6":{"answer":50.4,"tolerance_pct":0.5,"hint":"Subtract the net claims (350 + 50 + 20 − 120 = 300), then divide by shares.","explanation":"(1,560 − 300) ÷ 25 = 50.40."}}$j$)
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
('budgeting-503020',1,'The 50/30/20 rule','50% needs, 30% wants, 20% savings and debt repayment.'),
('budgeting-503020',2,'Take-home pay','Pay after tax and mandatory contributions.'),
('budgeting-503020',3,'Examples of needs','Rent, groceries, utilities, transport to work, minimum debt payments.'),
('budgeting-503020',4,'Examples of wants','Dining out, streaming, hobbies, travel, shopping.'),
('budgeting-503020',5,'Pay yourself first','Move savings out when you are paid, before spending.'),
('budgeting-503020',6,'Needs above 50% of pay','Trim wants or raise income, and adjust the split rather than quit budgeting.'),
('budgeting-503020',7,'Why track spending?','To see where money really goes before setting limits.'),
('budgeting-503020',8,'What goes in the 20%?','Emergency fund, investments and extra debt payments.'),
('budgeting-503020',9,'Needs % of take-home =','Total needs ÷ take-home pay.'),
('budgeting-503020',10,'A budget is…','A decision about what your money should do before it disappears.'),
('compound-interest-saving',1,'Simple interest','Interest only on the original principal.'),
('compound-interest-saving',2,'Compound interest','Interest on principal plus previously earned interest.'),
('compound-interest-saving',3,'Compound value','Principal × (1 + rate)^years.'),
('compound-interest-saving',4,'Rule of 72','Years to double ≈ 72 ÷ rate (%).'),
('compound-interest-saving',5,'Why start early?','More time for compounding to work.'),
('compound-interest-saving',6,'Real return','≈ nominal return − inflation.'),
('compound-interest-saving',7,'Savings rate below inflation','Purchasing power falls.'),
('compound-interest-saving',8,'Two levers of saving','How much you save and how long it compounds.'),
('compound-interest-saving',9,'Simple vs compound growth shape','Simple is a straight line; compound accelerates.'),
('compound-interest-saving',10,'Total simple interest','Principal × rate × years.'),
('investing-basics-funds',1,'Stock','A share of ownership in a company.'),
('investing-basics-funds',2,'Bond','A loan that pays a coupon and returns face value at maturity.'),
('investing-basics-funds',3,'Mutual fund / ETF','A pooled basket of securities giving instant diversification.'),
('investing-basics-funds',4,'ETF vs mutual fund','ETFs trade on an exchange all day; mutual funds are priced once a day.'),
('investing-basics-funds',5,'Risk and return','Higher potential return comes with higher risk.'),
('investing-basics-funds',6,'Diversification','Spread money so no single investment can sink you.'),
('investing-basics-funds',7,'Expense ratio','The yearly fee a fund charges, as a % of assets.'),
('investing-basics-funds',8,'Time horizon rule','Money needed within about 2 years belongs in low-risk assets.'),
('investing-basics-funds',9,'Dividend yield','Annual dividend ÷ share price.'),
('investing-basics-funds',10,'Peso-cost averaging','Invest a fixed amount at regular intervals.'),
('emergency-fund-inflation',1,'Emergency fund','Cash set aside for job loss, medical bills or urgent repairs.'),
('emergency-fund-inflation',2,'How much to hold','Typically 3–6 months of essential expenses.'),
('emergency-fund-inflation',3,'Where to keep it','A safe, accessible account such as savings or a money-market fund.'),
('emergency-fund-inflation',4,'Inflation','Rising prices that erode the purchasing power of cash.'),
('emergency-fund-inflation',5,'Real return','≈ interest rate − inflation.'),
('emergency-fund-inflation',6,'Order of priorities','Starter emergency fund, then high-interest debt, then long-term investing.'),
('emergency-fund-inflation',7,'Who needs a bigger fund?','Freelancers and single-income households.'),
('emergency-fund-inflation',8,'Purchasing power after inflation','Amount ÷ (1 + inflation).'),
('emergency-fund-inflation',9,'Why not invest the emergency fund in stocks?','They can fall exactly when you need the money.'),
('emergency-fund-inflation',10,'Why revisit the target yearly?','As prices rise, a fixed peso amount covers less.'),
('interview-three-statements',1,'How are the three statements linked?','Net income feeds the cash flow statement and retained earnings; the cash flow statement ends in the change in cash on the balance sheet.'),
('interview-three-statements',2,'Depreciation +₱20, tax 25%: net income','Falls by ₱15.'),
('interview-three-statements',3,'Depreciation +₱20, tax 25%: operating cash flow','Rises by ₱5 (the tax shield).'),
('interview-three-statements',4,'Depreciation +₱20: balance sheet','Cash +5, PP&E −20, assets −15; retained earnings −15.'),
('interview-three-statements',5,'Increase in receivables','Lowers operating cash flow.'),
('interview-three-statements',6,'Buy equipment with cash','Total assets unchanged (cash down, PP&E up).'),
('interview-three-statements',7,'Borrow to buy inventory','Assets and liabilities both rise.'),
('interview-three-statements',8,'Retained earnings change','Net income minus dividends.'),
('interview-three-statements',9,'After-tax effect of an expense','Expense × (1 − tax rate).'),
('interview-three-statements',10,'What do interviewers want?','The why, not only the steps.'),
('interview-dcf-walkthrough',1,'60-second DCF answer','Project UFCF, add terminal value, discount at WACC to get EV, subtract net debt for equity value, divide by diluted shares.'),
('interview-dcf-walkthrough',2,'UFCF','EBIT × (1 − t) + D&A − capex − increase in NWC.'),
('interview-dcf-walkthrough',3,'Gordon growth terminal value','FCF × (1 + g) ÷ (WACC − g).'),
('interview-dcf-walkthrough',4,'Other terminal value method','Exit multiple (e.g. EBITDA × EV/EBITDA).'),
('interview-dcf-walkthrough',5,'Discount rate for UFCF','WACC.'),
('interview-dcf-walkthrough',6,'Equity bridge','Equity value = EV − net debt (and preferred, minorities).'),
('interview-dcf-walkthrough',7,'Why is TV so important?','Often 60–80% of EV; most value is beyond the forecast.'),
('interview-dcf-walkthrough',8,'Classic DCF mistake','Using levered cash flows with WACC.'),
('interview-dcf-walkthrough',9,'WACC up means…','DCF value down.'),
('interview-dcf-walkthrough',10,'Standard sensitivity table','WACC against terminal growth (or exit multiple).'),
('interview-ev-equity',1,'Equity value','Share price × diluted shares.'),
('interview-ev-equity',2,'Enterprise value','Equity value + debt + preferred + minority interest − cash.'),
('interview-ev-equity',3,'Why subtract cash?','It is not part of the operating business and offsets the price a buyer pays.'),
('interview-ev-equity',4,'Multiples paired with EV','EV/EBITDA, EV/Revenue.'),
('interview-ev-equity',5,'Multiples paired with equity value','P/E (equity value ÷ net income).'),
('interview-ev-equity',6,'Best multiple across different debt levels','EV/EBITDA (capital-structure neutral).'),
('interview-ev-equity',7,'From EV/EBITDA to a share price','EBITDA × multiple → subtract net debt → ÷ diluted shares.'),
('interview-ev-equity',8,'Items added in the equity-to-EV bridge','Debt, preferred stock, minority interest.'),
('interview-ev-equity',9,'Items subtracted in the bridge','Cash and equivalents (and non-operating investments).'),
('interview-ev-equity',10,'Why use diluted shares?','Options and convertibles can increase the share count.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;

-- ---------------------------------------------------------------------
-- 5. Challenges and the exam
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('personal-finance-plan', 'Money Plan: Maria''s First Salary',
 'Budget a first salary, set an emergency fund target and plan for the future.',
 $md$
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
$md$, 'Two decimals where needed.', 'personal_finance', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"Budget math","weight":80},{"label":"Judgment","weight":20}]',
 '{"financial_analysis":0.6,"decision_making":0.8,"technical_knowledge":0.4}',
 $j${"tasks":[
   {"id":"needs","type":"numeric","label":"Needs %","prompt":"Needs as a % of take-home (two decimals)?","unit":"%","points":12},
   {"id":"wants","type":"numeric","label":"Wants %","prompt":"Wants as a % of take-home?","unit":"%","points":8},
   {"id":"sav","type":"numeric","label":"Savings %","prompt":"Savings as a % of take-home (two decimals)?","unit":"%","points":12},
   {"id":"tgt","type":"numeric","label":"20% target","prompt":"The 20% savings target in pesos (₱)?","unit":"₱","points":10},
   {"id":"fund","type":"numeric","label":"Emergency fund","prompt":"A 6-month emergency fund based on her essential expenses (₱)?","unit":"₱","points":12},
   {"id":"months","type":"numeric","label":"Months to goal","prompt":"Months to build that fund saving ₱5,000 a month (one decimal)?","unit":"months","points":12},
   {"id":"r72","type":"numeric","label":"Rule of 72","prompt":"If she invests ₱50,000 at 8% a year, using the rule of 72, roughly how much will it be after 9 years (₱)?","unit":"₱","points":10},
   {"id":"first","type":"mcq","label":"First priority","prompt":"Maria also has a credit card charging 36% a year. Her best first priority is to…","options":[{"id":"a","label":"Invest in a 6% bond fund"},{"id":"b","label":"Build a starter emergency fund and pay off the high-interest card"},{"id":"c","label":"Spend more on wants"},{"id":"d","label":"Stop saving"}],"points":6},
   {"id":"plan","type":"long_text","label":"Her plan","prompt":"Write Maria a short money plan: what to change in her budget, how to build her emergency fund and where to start investing.","min_words":50,"points":18}
 ]}$j$::jsonb, '{personal_finance}', true, now()),

('interview-mock-technical', 'Mock Technical Round: Finance Interview',
 'Answer the technical questions an analyst interviewer will ask.',
 $md$
You are in a **first-round technical interview**. Answer as you would out loud, then put numbers behind your answers.

Facts for the numeric questions (₱):
- Depreciation rises by **₱40**; tax rate **25%**.
- Equity value **₱2,000m**; debt **₱600m**; cash **₱250m**.
- EBIT **₱300m**; tax **30%**; D&A **₱80m**; capex **₱100m**; increase in NWC **₱20m**.
- Final-year FCF **₱170m**; terminal growth **2%**; WACC **10%**.
$md$, 'Two decimals where needed.', 'career_prep', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Technical accuracy","weight":68},{"label":"Communication","weight":32}]',
 '{"technical_knowledge":1.0,"communication":0.8,"valuation":0.5}',
 $j${"tasks":[
   {"id":"ni","type":"numeric","label":"Net income","prompt":"By how much does net income fall (₱)?","unit":"₱","points":10},
   {"id":"cash","type":"numeric","label":"Cash","prompt":"By how much does cash from operations rise (₱)?","unit":"₱","points":10},
   {"id":"ev","type":"numeric","label":"Enterprise value","prompt":"Enterprise value (₱m)?","unit":"₱m","points":12},
   {"id":"ufcf","type":"numeric","label":"UFCF","prompt":"Unlevered free cash flow (₱m)?","unit":"₱m","points":14},
   {"id":"tv","type":"numeric","label":"Terminal value","prompt":"Terminal value by Gordon growth (₱m, one decimal)?","unit":"₱m","points":14},
   {"id":"ev1","type":"mcq","label":"Discount rate","prompt":"Which discount rate is used for unlevered free cash flows?","options":[{"id":"a","label":"Cost of equity"},{"id":"b","label":"WACC"},{"id":"c","label":"Cost of debt"},{"id":"d","label":"The tax rate"}],"points":8},
   {"id":"walk","type":"long_text","label":"Walk me through a DCF","prompt":"In 4–6 sentences: walk me through a DCF.","min_words":60,"points":32}
 ]}$j$::jsonb, '{interview}', true, now()),

('exam-finance-interview-prep', 'Final Exam: Certified Finance Interview Prep',
 'Timed exam: statements, DCF and multiples, plus two spoken-style answers.',
 $md$
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
$md$, 'You have 45 minutes. Two decimals where needed. Pass mark 70.', 'career_prep', 'tasks', null, 'advanced', 45, 300, 70, 'auto',
 '[{"label":"Technical accuracy","weight":68},{"label":"Communication","weight":32}]',
 '{"technical_knowledge":1.0,"communication":1.0,"valuation":0.6}',
 $j${"tasks":[
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
 ]}$j$::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 45, max_attempts = 3 where slug = 'exam-finance-interview-prep';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('personal-finance-plan', $j${"needs":{"answer":59.38,"tolerance_pct":0.5},"wants":{"answer":25,"tolerance_pct":0.5},"sav":{"answer":15.63,"tolerance_pct":0.5},"tgt":{"answer":6400,"tolerance_pct":0.5},
   "fund":{"answer":114000,"tolerance_pct":0.5},"months":{"answer":22.8,"tolerance_pct":1},"r72":{"answer":100000,"tolerance_pct":1},"first":{"answer":"b"},
   "plan":{"keywords":["budget|50/30/20|needs|wants","emergency fund|savings","debt|credit card|interest","invest|fund|index|diversif","inflation|compound"],"keywords_required":3}}$j$),
 ('interview-mock-technical', $j${"ni":{"answer":30,"tolerance_pct":0.5},"cash":{"answer":10,"tolerance_pct":0.5},"ev":{"answer":2350,"tolerance_pct":0.5},"ufcf":{"answer":170,"tolerance_pct":0.5},"tv":{"answer":2167.5,"tolerance_pct":0.5},"ev1":{"answer":"b"},
   "walk":{"keywords":["project|forecast","free cash flow|fcf","discount|wacc|present value","terminal","enterprise value|net debt|equity value"],"keywords_required":4}}$j$),
 ('exam-finance-interview-prep', $j${"eq":{"answer":800,"tolerance_pct":0.5},"ev":{"answer":1100,"tolerance_pct":0.5},"evx":{"answer":6.11,"tolerance_pct":0.5},"pe":{"answer":13.33,"tolerance_pct":0.5},"ufcf":{"answer":92.5,"tolerance_pct":0.5},
   "tv":{"answer":1587.92,"tolerance_pct":0.5},"ni":{"answer":15,"tolerance_pct":0.5},"cash":{"answer":5,"tolerance_pct":0.5},"mc1":{"answer":"b"},"mc2":{"answer":"b"},
   "say1":{"keywords":["net income","cash flow","retained earnings|balance sheet","income statement","depreciation|working capital|non-cash"],"keywords_required":4},
   "say2":{"keywords":["enterprise value|ev","equity value|shareholders","debt","cash","operating|capital provider|net debt"],"keywords_required":4}}$j$)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The programs
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('personal-finance-essentials', 'track', 'Personal Finance Essentials',
 'Budgeting, saving, compound interest and investing basics.',
 $md$
The money skills nobody taught you in school: budget a salary with the 50/30/20 rule, build an emergency fund, understand compound interest and inflation, and learn how stocks, bonds and funds work.

Four short lessons and one hands-on money plan. Great for a first certificate.
$md$, 'personal_finance', 'beginner', 1.5, 'Track Certificate — Personal Finance Essentials', true, 14),
('finance-interview-prep', 'certification', 'Finance Interview Prep',
 'The technical questions every finance internship and analyst interview asks.',
 $md$
Prepare for the technical round: link the three statements and walk through the depreciation question, answer "walk me through a DCF", and explain enterprise value, equity value and multiples with confidence.

1. Pass each lesson's video, practice and knowledge check.
2. Complete the mock technical round.
3. Pass the **timed final exam** (45 minutes, 70% to pass, 3 attempts), including two spoken-style answers.
$md$, 'career_prep', 'intermediate', 2.0, 'Certified Finance Interview Prep', true, 8)
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
