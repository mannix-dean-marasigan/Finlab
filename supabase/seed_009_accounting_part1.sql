-- seed_009_accounting: part 1 of 3. Run the parts in order.
-- =====================================================================
-- FINLAB — Content v9: Accounting Fundamentals certification
--   6 lessons (video + 10-question check + 2 practice activities + 10 flashcards),
--   3 case challenges, a timed final exam, the program.
-- Run AFTER seed_008. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lessons
-- ---------------------------------------------------------------------
insert into public.lessons (slug, title, summary, category_id, difficulty, estimated_minutes, sort_order, related_challenge_slugs, video_urls, body) values
('accounting-equation-journal', 'The Accounting Equation & Journal Entries', 'Assets = liabilities + equity, debits and credits, and recording transactions.', 'accounting', 'beginner', 15, 20,
 '{accounting-journal-trial-balance}', '{https://www.youtube.com/watch?v=kK7mU2Udf7M}', '
## Everything starts with one equation
> **Assets = Liabilities + Equity**

Assets are what the business owns, liabilities are what it owes, and equity is the owners'' claim. **Every transaction keeps this equation in balance.**

## Double entry
Each transaction is recorded in at least two accounts, with **total debits = total credits**.

| Account type | Increases with | Normal balance |
|---|---|---|
| Assets (cash, receivables, equipment) | Debit | Debit |
| Expenses (rent, salaries) | Debit | Debit |
| Liabilities (payables, loans) | Credit | Credit |
| Equity (owner''s capital) | Credit | Credit |
| Revenue (fees, sales) | Credit | Credit |

## Examples
- **Owner invests ₱100,000 cash:** Dr Cash 100,000 / Cr Owner''s capital 100,000.
- **Buy supplies ₱5,000 on credit:** Dr Supplies 5,000 / Cr Accounts payable 5,000.
- **Pay rent ₱20,000 in cash:** Dr Rent expense 20,000 / Cr Cash 20,000.

## The trial balance
After posting, list every account''s balance. Total debits must equal total credits. A trial balance that balances does not prove there are no errors, but one that doesn''t balance proves there is one.

> Equity grows with revenue and owner investment, and shrinks with expenses and withdrawals.
'),
('adjusting-entries', 'Accruals, Deferrals & Adjusting Entries', 'Putting revenue and expenses in the right period with adjusting entries.', 'accounting', 'beginner', 15, 21,
 '{accounting-adjusting-entries-case}', '{https://www.youtube.com/watch?v=7AhGA5wJois}', '
## Why adjust?
Accrual accounting records revenue **when earned** and expenses **when incurred**, not when cash moves. Adjusting entries at period end fix the timing.

## Deferrals: cash first, work later
- **Prepaid expense** (asset → expense): rent paid for 6 months starts as *Prepaid rent*; each month move one-sixth to *Rent expense*.
- **Unearned revenue** (liability → revenue): a customer pays in advance; each month move the earned part to *Revenue*.

## Accruals: work first, cash later
- **Accrued expense**: wages earned by staff but unpaid. *Dr Wages expense / Cr Wages payable.*
- **Accrued revenue**: work done but not yet billed. *Dr Accounts receivable / Cr Revenue.*

## Quick formulas
- Prepaid used = cost × months elapsed ÷ months covered.
- Accrued interest = principal × annual rate × months ÷ 12.
- Supplies expense = opening supplies + purchases − closing count.

> Skipping an adjustment misstates profit **and** the balance sheet: an unrecorded accrued expense understates both expenses and liabilities.
'),
('inventory-cogs-methods', 'Inventory & Cost of Goods Sold', 'COGS, FIFO, weighted average, and what each method does to profit.', 'accounting', 'intermediate', 15, 22,
 '{accounting-inventory-depreciation-case}', '{https://www.youtube.com/watch?v=pGrm501rYWg}', '
## The COGS formula
> **COGS = Beginning inventory + Purchases − Ending inventory**

Goods available for sale are split between **COGS** (income statement) and **ending inventory** (balance sheet). The two always add up to the same total — the method decides how.

## FIFO (first in, first out)
The oldest costs are expensed first; ending inventory carries the **most recent** costs.

## Weighted average
Average unit cost = **cost of goods available ÷ units available**. Apply it to units sold and units left.

## LIFO
Latest costs expensed first. **Not permitted under IFRS/PFRS.**

## What happens when prices rise?
- **FIFO:** lower COGS, higher profit, higher ending inventory.
- **Weighted average:** in between.
- When prices fall, the effects reverse.

## Valuation rule
Inventory is reported at the **lower of cost and net realisable value (NRV)**.

> An overstated ending inventory understates COGS and overstates profit — a classic manipulation to watch for.
'),
('depreciation-ppe', 'Depreciation & Fixed Assets', 'Straight-line, double-declining and units of production.', 'accounting', 'intermediate', 15, 23,
 '{accounting-inventory-depreciation-case}', '{https://www.youtube.com/watch?v=yYQRiYixoSY}', '
## What depreciation is
Depreciation **allocates an asset''s cost over its useful life**. It is not a measure of market value and it is **non-cash**.

## Methods
- **Straight-line:** (Cost − Salvage) ÷ Life. Equal expense each year.
- **Double-declining balance:** rate = 2 ÷ life, applied to **opening book value** (salvage ignored until the end). Expense is highest early.
- **Units of production:** (Cost − Salvage) ÷ Total units × Units used.

**Book value** = Cost − Accumulated depreciation. Never depreciate below salvage value. **Land is not depreciated.**

## On the statements
- Income statement: depreciation expense reduces profit.
- Balance sheet: accumulated depreciation reduces the asset''s carrying amount.
- Cash flow: **added back** in operating cash flow because it is non-cash.

## Disposal
Gain or loss = Sale proceeds − Book value.

> Accelerated methods lower profit early and raise it later. Total depreciation over the asset''s life is the same.
'),
('receivables-bad-debts', 'Receivables & Bad Debts', 'The allowance method, aging analysis and what rising DSO tells you.', 'accounting', 'intermediate', 15, 24,
 '{accounting-adjusting-entries-case}', '{https://www.youtube.com/watch?v=5f9XNo7whtY}', '
## Some customers won''t pay
The **allowance method** estimates uncollectible receivables up front, matching the cost with the sales that created it.

- **Adjusting entry:** Dr Bad debt expense / Cr Allowance for doubtful accounts.
- **Write-off of a specific account:** Dr Allowance / Cr Accounts receivable. *Net receivables and profit don''t change.*
- **Net realisable value** = Gross receivables − Allowance. The allowance is a **contra-asset**.

## Two ways to estimate
1. **Percentage of credit sales** → this *is* the expense for the year.
2. **Aging of receivables** → each age bucket gets a loss rate; the total is the **required allowance**. Expense = required allowance − existing credit balance.

## Analyst check
**DSO = Receivables ÷ Credit sales × days in period.** Rising DSO can mean slower collections or aggressive revenue recognition.

> PFRS 9 requires **expected** credit losses, not only incurred ones.
'),
('revenue-recognition', 'Revenue Recognition (PFRS 15)', 'The five-step model: contracts, obligations, price allocation and timing.', 'accounting', 'advanced', 15, 25,
 '{accounting-adjusting-entries-case}', '{https://www.youtube.com/watch?v=E-cBZ_BR7_0}', '
## The five steps
1. **Identify the contract** with the customer.
2. **Identify the performance obligations** (distinct goods or services).
3. **Determine the transaction price.**
4. **Allocate** the price to each obligation by relative standalone selling price (SSP).
5. **Recognise revenue** when (or as) each obligation is satisfied.

## Point in time vs over time
- **Point in time:** control passes at delivery (selling a phone).
- **Over time:** the customer receives benefit as you perform (support contracts, memberships, construction for the customer).

## Allocation example
Bundle price ₱36,000; SSPs: phone ₱30,000 and service ₱10,000. Phone = 36,000 × 30/40 = **₱27,000**; service = **₱9,000**, recognised over the service period.

## Related balance sheet items
Cash received before delivery creates a **contract liability** (unearned revenue). Variable consideration (rebates, bonuses) is included only to the extent a significant reversal is unlikely.

> Red flag for analysts: revenue growth far ahead of cash collection and rising receivables.
')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks (10 questions each)
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('accounting-equation-journal',
 '[{"id":"q1","type":"mcq","label":"The equation","prompt":"The accounting equation is…","options":[{"id":"a","label":"Assets = Liabilities + Equity"},{"id":"b","label":"Assets = Liabilities − Equity"},{"id":"c","label":"Equity = Assets + Liabilities"},{"id":"d","label":"Revenue = Assets − Expenses"}],"points":10},
     {"id":"q2","type":"numeric","label":"Equity","prompt":"Assets ₱900k, liabilities ₱350k. Equity (₱k)?","unit":"₱k","points":10},
     {"id":"q3","type":"mcq","label":"Owner investment","prompt":"The owner invests ₱100,000 cash. The entry is…","options":[{"id":"a","label":"Dr Owner''s capital / Cr Cash"},{"id":"b","label":"Dr Cash / Cr Owner''s capital"},{"id":"c","label":"Dr Cash / Cr Revenue"},{"id":"d","label":"Dr Equipment / Cr Cash"}],"points":10},
     {"id":"q4","type":"mcq","label":"Credits","prompt":"Which account increases with a credit?","options":[{"id":"a","label":"Cash"},{"id":"b","label":"Rent expense"},{"id":"c","label":"Service revenue"},{"id":"d","label":"Equipment"}],"points":10},
     {"id":"q5","type":"mcq","label":"Supplies on credit","prompt":"Buying supplies on credit…","options":[{"id":"a","label":"Increases assets and liabilities"},{"id":"b","label":"Increases assets and equity"},{"id":"c","label":"Decreases assets and liabilities"},{"id":"d","label":"Has no effect on the equation"}],"points":10},
     {"id":"q6","type":"numeric","label":"Trial balance","prompt":"Debits: cash ₱300k, equipment ₱500k, rent ₱100k. Credits: payables ₱200k, capital ₱450k, and revenue. Revenue (₱k) so the trial balance balances?","unit":"₱k","points":10},
     {"id":"q7","type":"mcq","label":"Paying rent","prompt":"Paying this month''s rent of ₱20,000 in cash…","options":[{"id":"a","label":"Dr Cash / Cr Rent expense"},{"id":"b","label":"Dr Rent expense / Cr Cash"},{"id":"c","label":"Dr Rent expense / Cr Accounts payable"},{"id":"d","label":"Dr Prepaid rent / Cr Revenue"}],"points":10},
     {"id":"q8","type":"numeric","label":"Equity changes","prompt":"Equity starts at ₱300. The business earns ₱80 revenue in cash and pays ₱30 of expenses in cash. Ending equity (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Normal balance","prompt":"The normal balance of Accounts Payable is…","options":[{"id":"a","label":"Debit"},{"id":"b","label":"Credit"},{"id":"c","label":"Either"},{"id":"d","label":"Zero"}],"points":10},
     {"id":"q10","type":"mcq","label":"Double entry","prompt":"Double-entry bookkeeping means…","options":[{"id":"a","label":"Every transaction is recorded twice in the same account"},{"id":"b","label":"Every transaction has equal total debits and credits"},{"id":"c","label":"Every account has a debit and a credit balance"},{"id":"d","label":"Two people must approve each entry"}],"points":10}]',
 '{"q1":{"answer":"a"},"q2":{"answer":550,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":"c"},"q5":{"answer":"a"},"q6":{"answer":250,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":350,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"b"}}'),
('adjusting-entries',
 '[{"id":"q1","type":"mcq","label":"Purpose","prompt":"Adjusting entries exist to…","options":[{"id":"a","label":"Record revenue and expenses in the period they are earned or incurred"},{"id":"b","label":"Correct bank errors"},{"id":"c","label":"Close the books"},{"id":"d","label":"Record owner withdrawals"}],"points":10},
     {"id":"q2","type":"numeric","label":"Prepaid insurance","prompt":"₱24,000 of insurance was paid on 1 Jan for 12 months. Insurance expense for January–March (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"mcq","label":"Accrued wages","prompt":"Wages are earned but unpaid at period end. The adjustment is…","options":[{"id":"a","label":"Dr Wages payable / Cr Wages expense"},{"id":"b","label":"Dr Wages expense / Cr Wages payable"},{"id":"c","label":"Dr Cash / Cr Wages expense"},{"id":"d","label":"No entry until paid"}],"points":10},
     {"id":"q4","type":"numeric","label":"Unearned revenue","prompt":"A customer pays ₱60,000 on 1 Oct for 12 months of service. Revenue earned by 31 Dec (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Classification","prompt":"Unearned revenue is reported as…","options":[{"id":"a","label":"An asset"},{"id":"b","label":"A liability"},{"id":"c","label":"Equity"},{"id":"d","label":"An expense"}],"points":10},
     {"id":"q6","type":"mcq","label":"Accrued revenue","prompt":"Services were performed but not yet billed. The adjustment is…","options":[{"id":"a","label":"Dr Accounts receivable / Cr Revenue"},{"id":"b","label":"Dr Revenue / Cr Accounts receivable"},{"id":"c","label":"Dr Cash / Cr Unearned revenue"},{"id":"d","label":"Dr Expense / Cr Payable"}],"points":10},
     {"id":"q7","type":"numeric","label":"Supplies","prompt":"Opening supplies ₱8,000, purchases ₱5,000, closing count ₱6,500. Supplies expense (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"mcq","label":"Omitted accrual","prompt":"Failing to record an accrued expense…","options":[{"id":"a","label":"Overstates expenses and liabilities"},{"id":"b","label":"Understates expenses and liabilities"},{"id":"c","label":"Overstates assets"},{"id":"d","label":"Has no effect on the statements"}],"points":10},
     {"id":"q9","type":"numeric","label":"Accrued interest","prompt":"A ₱500,000 loan at 12% a year was taken on 1 Nov. Interest accrued by 31 Dec (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"Deferral","prompt":"Which is a deferral?","options":[{"id":"a","label":"Accrued wages"},{"id":"b","label":"Prepaid rent"},{"id":"c","label":"Interest earned but not received"},{"id":"d","label":"Unbilled consulting work"}],"points":10}]',
 '{"q1":{"answer":"a"},"q2":{"answer":6000,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":15000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"a"},"q7":{"answer":6500,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":10000,"tolerance_pct":0.5},"q10":{"answer":"b"}}'),
('inventory-cogs-methods',
 '[{"id":"q1","type":"numeric","label":"COGS","prompt":"Beginning inventory ₱200k, purchases ₱900k, ending inventory ₱250k. COGS (₱k)?","unit":"₱k","points":10},
     {"id":"q2","type":"mcq","label":"FIFO","prompt":"FIFO assumes…","options":[{"id":"a","label":"The newest units are sold first"},{"id":"b","label":"The oldest units are sold first"},{"id":"c","label":"Units are sold at the average cost of purchases only"},{"id":"d","label":"Inventory never changes in cost"}],"points":10},
     {"id":"q3","type":"numeric","label":"Average cost","prompt":"100 units at ₱10 and 200 units at ₱13 are available. Weighted-average cost per unit (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"Average COGS","prompt":"Using that average cost, 120 units are sold. COGS (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Rising prices","prompt":"When prices are rising, compared with weighted average, FIFO gives…","options":[{"id":"a","label":"Higher COGS and lower profit"},{"id":"b","label":"Lower COGS and higher profit"},{"id":"c","label":"The same profit"},{"id":"d","label":"Lower ending inventory"}],"points":10},
     {"id":"q6","type":"mcq","label":"Standards","prompt":"Which method is not permitted under IFRS/PFRS?","options":[{"id":"a","label":"FIFO"},{"id":"b","label":"Weighted average"},{"id":"c","label":"LIFO"},{"id":"d","label":"Specific identification"}],"points":10},
     {"id":"q7","type":"numeric","label":"FIFO COGS","prompt":"100 units at ₱10 then 100 units at ₱12 are bought. Selling 150 units under FIFO gives COGS of (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"FIFO ending inventory","prompt":"Same facts: FIFO ending inventory of the remaining 50 units (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Valuation","prompt":"Inventory is reported at…","options":[{"id":"a","label":"Selling price"},{"id":"b","label":"The lower of cost and net realisable value"},{"id":"c","label":"The higher of cost and market"},{"id":"d","label":"Replacement cost only"}],"points":10},
     {"id":"q10","type":"mcq","label":"Overstated inventory","prompt":"If ending inventory is overstated…","options":[{"id":"a","label":"COGS is overstated and profit understated"},{"id":"b","label":"COGS is understated and profit overstated"},{"id":"c","label":"Only the balance sheet is affected"},{"id":"d","label":"Nothing changes"}],"points":10}]',
 '{"q1":{"answer":850,"tolerance_pct":0.5},"q2":{"answer":"b"},"q3":{"answer":12,"tolerance_pct":0.5},"q4":{"answer":1440,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"c"},"q7":{"answer":1600,"tolerance_pct":0.5},"q8":{"answer":600,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"b"}}'),
('depreciation-ppe',
 '[{"id":"q1","type":"numeric","label":"Straight-line","prompt":"A machine costs ₱500,000, salvage ₱50,000, life 5 years. Straight-line depreciation per year (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Book value","prompt":"Same machine: book value after 2 years of straight-line (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"DDB year 1","prompt":"Same machine under double-declining balance (rate 40%). Year-1 depreciation (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"DDB year 2","prompt":"Year-2 depreciation under double-declining balance (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Meaning","prompt":"Depreciation is…","options":[{"id":"a","label":"A way to track the asset''s market value"},{"id":"b","label":"The allocation of cost over the asset''s useful life"},{"id":"c","label":"A cash payment to a reserve fund"},{"id":"d","label":"A tax payment"}],"points":10},
     {"id":"q6","type":"mcq","label":"Cash flow","prompt":"On the cash flow statement, depreciation is…","options":[{"id":"a","label":"Subtracted as a cash outflow"},{"id":"b","label":"Added back to net income as a non-cash expense"},{"id":"c","label":"Shown under financing"},{"id":"d","label":"Ignored"}],"points":10},
     {"id":"q7","type":"mcq","label":"Not depreciated","prompt":"Which asset is not depreciated?","options":[{"id":"a","label":"Delivery van"},{"id":"b","label":"Office computers"},{"id":"c","label":"Land"},{"id":"d","label":"Factory machinery"}],"points":10},
     {"id":"q8","type":"numeric","label":"Disposal","prompt":"An asset with book value ₱100,000 is sold for ₱130,000. Gain on disposal (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Accelerated","prompt":"An accelerated method gives…","options":[{"id":"a","label":"Lower expense early and higher later"},{"id":"b","label":"Higher expense early and lower later"},{"id":"c","label":"The same expense every year"},{"id":"d","label":"A higher total expense over the life"}],"points":10},
     {"id":"q10","type":"numeric","label":"Units of production","prompt":"Cost ₱300,000, salvage ₱30,000, total capacity 90,000 units; 12,000 units were used this year. Depreciation (₱)?","unit":"₱","points":10}]',
 '{"q1":{"answer":90000,"tolerance_pct":0.5},"q2":{"answer":320000,"tolerance_pct":0.5},"q3":{"answer":200000,"tolerance_pct":0.5},"q4":{"answer":120000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"b"},"q7":{"answer":"c"},"q8":{"answer":30000,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":36000,"tolerance_pct":0.5}}'),
('receivables-bad-debts',
 '[{"id":"q1","type":"mcq","label":"Allowance method","prompt":"The allowance method records bad debts…","options":[{"id":"a","label":"Only when an invoice is written off"},{"id":"b","label":"By estimate, in the period of the related sales"},{"id":"c","label":"When cash is collected"},{"id":"d","label":"Never — it is a tax concept"}],"points":10},
     {"id":"q2","type":"numeric","label":"Percentage of sales","prompt":"Credit sales ₱4,000,000 and bad debts estimated at 2%. Bad debt expense (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"Aging expense","prompt":"Required allowance (aging) ₱150,000; existing allowance has a ₱40,000 credit balance. Bad debt expense (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"Net receivables","prompt":"Gross receivables ₱2,000,000, allowance ₱120,000. Net realisable value (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Write-off","prompt":"Writing off a specific uncollectible account (allowance method)…","options":[{"id":"a","label":"Reduces profit again"},{"id":"b","label":"Is Dr Allowance / Cr Receivable, with no effect on net receivables or profit"},{"id":"c","label":"Increases the allowance"},{"id":"d","label":"Is Dr Bad debt expense / Cr Receivable"}],"points":10},
     {"id":"q6","type":"mcq","label":"Account type","prompt":"The allowance for doubtful accounts is…","options":[{"id":"a","label":"A liability"},{"id":"b","label":"An expense"},{"id":"c","label":"A contra-asset"},{"id":"d","label":"Equity"}],"points":10},
     {"id":"q7","type":"numeric","label":"DSO","prompt":"Annual credit sales ₱3,650,000 and receivables ₱500,000. DSO (days, 365-day year)?","unit":"days","points":10},
     {"id":"q8","type":"mcq","label":"Rising DSO","prompt":"Rising DSO may signal…","options":[{"id":"a","label":"Faster collections"},{"id":"b","label":"Slower collections or aggressive revenue recognition"},{"id":"c","label":"Lower sales"},{"id":"d","label":"Higher cash balances"}],"points":10},
     {"id":"q9","type":"numeric","label":"Aging","prompt":"0–30 days ₱1,000,000 at 1%; 31–60 days ₱400,000 at 5%; over 60 days ₱200,000 at 20%. Required allowance (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"PFRS 9","prompt":"Under PFRS 9, credit losses on receivables are based on…","options":[{"id":"a","label":"Losses already incurred only"},{"id":"b","label":"Expected credit losses"},{"id":"c","label":"The tax authority''s rates"},{"id":"d","label":"Cash collected"}],"points":10}]',
 '{"q1":{"answer":"b"},"q2":{"answer":80000,"tolerance_pct":0.5},"q3":{"answer":110000,"tolerance_pct":0.5},"q4":{"answer":1880000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"c"},"q7":{"answer":50,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":70000,"tolerance_pct":0.5},"q10":{"answer":"b"}}'),
('revenue-recognition',
 '[{"id":"q1","type":"mcq","label":"Five steps","prompt":"Which is the correct order of the five-step model?","options":[{"id":"a","label":"Contract → performance obligations → price → allocate → recognise"},{"id":"b","label":"Price → contract → recognise → allocate → obligations"},{"id":"c","label":"Recognise → contract → price → obligations → allocate"},{"id":"d","label":"Obligations → recognise → contract → allocate → price"}],"points":10},
     {"id":"q2","type":"mcq","label":"Timing","prompt":"Revenue is recognised when…","options":[{"id":"a","label":"Cash is received"},{"id":"b","label":"The contract is signed"},{"id":"c","label":"A performance obligation is satisfied"},{"id":"d","label":"The invoice is paid"}],"points":10},
     {"id":"q3","type":"numeric","label":"Allocation: phone","prompt":"A bundle sells for ₱36,000. Standalone prices: phone ₱30,000, service plan ₱10,000. Revenue allocated to the phone (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"Allocation: service","prompt":"Revenue allocated to the service plan (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Over time","prompt":"A software licence is delivered today with 12 months of support. The support revenue is recognised…","options":[{"id":"a","label":"Entirely today"},{"id":"b","label":"Over the 12 months"},{"id":"c","label":"At the end of the 12 months"},{"id":"d","label":"Only when renewed"}],"points":10},
     {"id":"q6","type":"numeric","label":"Straight-line revenue","prompt":"A ₱1,200,000 contract covers 24 months of service, recognised evenly. Revenue in the first 9 months (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Prepayment","prompt":"Cash received before delivery is reported as…","options":[{"id":"a","label":"Revenue"},{"id":"b","label":"A contract liability (unearned revenue)"},{"id":"c","label":"A receivable"},{"id":"d","label":"Equity"}],"points":10},
     {"id":"q8","type":"mcq","label":"Variable consideration","prompt":"Volume rebates (variable consideration) are…","options":[{"id":"a","label":"Ignored until paid"},{"id":"b","label":"Estimated and included only to the extent a significant reversal is unlikely"},{"id":"c","label":"Always included at the maximum"},{"id":"d","label":"Recorded as an expense when paid"}],"points":10},
     {"id":"q9","type":"numeric","label":"Percentage of completion","prompt":"A construction contract of ₱10m is 40% complete (cost-to-cost). Revenue to date (₱m)?","unit":"₱m","points":10},
     {"id":"q10","type":"mcq","label":"Red flag","prompt":"Which pattern most suggests aggressive revenue recognition?","options":[{"id":"a","label":"Revenue and cash collections growing together"},{"id":"b","label":"Revenue growing far faster than cash, with receivables ballooning"},{"id":"c","label":"Stable deferred revenue"},{"id":"d","label":"Falling receivable days"}],"points":10}]',
 '{"q1":{"answer":"a"},"q2":{"answer":"c"},"q3":{"answer":27000,"tolerance_pct":0.5},"q4":{"answer":9000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":450000,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"b"},"q9":{"answer":4,"tolerance_pct":0.5},"q10":{"answer":"b"}}')
), upd as (
  update public.lessons l set check_questions = qs.questions::jsonb
  from qs where l.slug = qs.slug and jsonb_array_length(l.check_questions) = 0
  returning l.id, qs.answers
)
insert into public.lesson_check_keys (lesson_id, answers)
select id, answers::jsonb from upd
on conflict (lesson_id) do nothing;
