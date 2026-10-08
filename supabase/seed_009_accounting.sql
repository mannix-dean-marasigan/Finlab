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
 '{accounting-journal-trial-balance}', '{https://www.youtube.com/watch?v=kK7mU2Udf7M}', $md$
## Everything starts with one equation
> **Assets = Liabilities + Equity**

Assets are what the business owns, liabilities are what it owes, and equity is the owners' claim. **Every transaction keeps this equation in balance.**

## Double entry
Each transaction is recorded in at least two accounts, with **total debits = total credits**.

| Account type | Increases with | Normal balance |
|---|---|---|
| Assets (cash, receivables, equipment) | Debit | Debit |
| Expenses (rent, salaries) | Debit | Debit |
| Liabilities (payables, loans) | Credit | Credit |
| Equity (owner's capital) | Credit | Credit |
| Revenue (fees, sales) | Credit | Credit |

## Examples
- **Owner invests ₱100,000 cash:** Dr Cash 100,000 / Cr Owner's capital 100,000.
- **Buy supplies ₱5,000 on credit:** Dr Supplies 5,000 / Cr Accounts payable 5,000.
- **Pay rent ₱20,000 in cash:** Dr Rent expense 20,000 / Cr Cash 20,000.

## The trial balance
After posting, list every account's balance. Total debits must equal total credits. A trial balance that balances does not prove there are no errors, but one that doesn't balance proves there is one.

> Equity grows with revenue and owner investment, and shrinks with expenses and withdrawals.
$md$),
('adjusting-entries', 'Accruals, Deferrals & Adjusting Entries', 'Putting revenue and expenses in the right period with adjusting entries.', 'accounting', 'beginner', 15, 21,
 '{accounting-adjusting-entries-case}', '{https://www.youtube.com/watch?v=7AhGA5wJois}', $md$
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
$md$),
('inventory-cogs-methods', 'Inventory & Cost of Goods Sold', 'COGS, FIFO, weighted average, and what each method does to profit.', 'accounting', 'intermediate', 15, 22,
 '{accounting-inventory-depreciation-case}', '{https://www.youtube.com/watch?v=pGrm501rYWg}', $md$
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
$md$),
('depreciation-ppe', 'Depreciation & Fixed Assets', 'Straight-line, double-declining and units of production.', 'accounting', 'intermediate', 15, 23,
 '{accounting-inventory-depreciation-case}', '{https://www.youtube.com/watch?v=yYQRiYixoSY}', $md$
## What depreciation is
Depreciation **allocates an asset's cost over its useful life**. It is not a measure of market value and it is **non-cash**.

## Methods
- **Straight-line:** (Cost − Salvage) ÷ Life. Equal expense each year.
- **Double-declining balance:** rate = 2 ÷ life, applied to **opening book value** (salvage ignored until the end). Expense is highest early.
- **Units of production:** (Cost − Salvage) ÷ Total units × Units used.

**Book value** = Cost − Accumulated depreciation. Never depreciate below salvage value. **Land is not depreciated.**

## On the statements
- Income statement: depreciation expense reduces profit.
- Balance sheet: accumulated depreciation reduces the asset's carrying amount.
- Cash flow: **added back** in operating cash flow because it is non-cash.

## Disposal
Gain or loss = Sale proceeds − Book value.

> Accelerated methods lower profit early and raise it later. Total depreciation over the asset's life is the same.
$md$),
('receivables-bad-debts', 'Receivables & Bad Debts', 'The allowance method, aging analysis and what rising DSO tells you.', 'accounting', 'intermediate', 15, 24,
 '{accounting-adjusting-entries-case}', '{https://www.youtube.com/watch?v=5f9XNo7whtY}', $md$
## Some customers won't pay
The **allowance method** estimates uncollectible receivables up front, matching the cost with the sales that created it.

- **Adjusting entry:** Dr Bad debt expense / Cr Allowance for doubtful accounts.
- **Write-off of a specific account:** Dr Allowance / Cr Accounts receivable. *Net receivables and profit don't change.*
- **Net realisable value** = Gross receivables − Allowance. The allowance is a **contra-asset**.

## Two ways to estimate
1. **Percentage of credit sales** → this *is* the expense for the year.
2. **Aging of receivables** → each age bucket gets a loss rate; the total is the **required allowance**. Expense = required allowance − existing credit balance.

## Analyst check
**DSO = Receivables ÷ Credit sales × days in period.** Rising DSO can mean slower collections or aggressive revenue recognition.

> PFRS 9 requires **expected** credit losses, not only incurred ones.
$md$),
('revenue-recognition', 'Revenue Recognition (PFRS 15)', 'The five-step model: contracts, obligations, price allocation and timing.', 'accounting', 'advanced', 15, 25,
 '{accounting-adjusting-entries-case}', '{https://www.youtube.com/watch?v=E-cBZ_BR7_0}', $md$
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
$md$)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks (10 questions each)
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('accounting-equation-journal',
 $j$[{"id":"q1","type":"mcq","label":"The equation","prompt":"The accounting equation is…","options":[{"id":"a","label":"Assets = Liabilities + Equity"},{"id":"b","label":"Assets = Liabilities − Equity"},{"id":"c","label":"Equity = Assets + Liabilities"},{"id":"d","label":"Revenue = Assets − Expenses"}],"points":10},
     {"id":"q2","type":"numeric","label":"Equity","prompt":"Assets ₱900k, liabilities ₱350k. Equity (₱k)?","unit":"₱k","points":10},
     {"id":"q3","type":"mcq","label":"Owner investment","prompt":"The owner invests ₱100,000 cash. The entry is…","options":[{"id":"a","label":"Dr Owner's capital / Cr Cash"},{"id":"b","label":"Dr Cash / Cr Owner's capital"},{"id":"c","label":"Dr Cash / Cr Revenue"},{"id":"d","label":"Dr Equipment / Cr Cash"}],"points":10},
     {"id":"q4","type":"mcq","label":"Credits","prompt":"Which account increases with a credit?","options":[{"id":"a","label":"Cash"},{"id":"b","label":"Rent expense"},{"id":"c","label":"Service revenue"},{"id":"d","label":"Equipment"}],"points":10},
     {"id":"q5","type":"mcq","label":"Supplies on credit","prompt":"Buying supplies on credit…","options":[{"id":"a","label":"Increases assets and liabilities"},{"id":"b","label":"Increases assets and equity"},{"id":"c","label":"Decreases assets and liabilities"},{"id":"d","label":"Has no effect on the equation"}],"points":10},
     {"id":"q6","type":"numeric","label":"Trial balance","prompt":"Debits: cash ₱300k, equipment ₱500k, rent ₱100k. Credits: payables ₱200k, capital ₱450k, and revenue. Revenue (₱k) so the trial balance balances?","unit":"₱k","points":10},
     {"id":"q7","type":"mcq","label":"Paying rent","prompt":"Paying this month's rent of ₱20,000 in cash…","options":[{"id":"a","label":"Dr Cash / Cr Rent expense"},{"id":"b","label":"Dr Rent expense / Cr Cash"},{"id":"c","label":"Dr Rent expense / Cr Accounts payable"},{"id":"d","label":"Dr Prepaid rent / Cr Revenue"}],"points":10},
     {"id":"q8","type":"numeric","label":"Equity changes","prompt":"Equity starts at ₱300. The business earns ₱80 revenue in cash and pays ₱30 of expenses in cash. Ending equity (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Normal balance","prompt":"The normal balance of Accounts Payable is…","options":[{"id":"a","label":"Debit"},{"id":"b","label":"Credit"},{"id":"c","label":"Either"},{"id":"d","label":"Zero"}],"points":10},
     {"id":"q10","type":"mcq","label":"Double entry","prompt":"Double-entry bookkeeping means…","options":[{"id":"a","label":"Every transaction is recorded twice in the same account"},{"id":"b","label":"Every transaction has equal total debits and credits"},{"id":"c","label":"Every account has a debit and a credit balance"},{"id":"d","label":"Two people must approve each entry"}],"points":10}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":550,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":"c"},"q5":{"answer":"a"},"q6":{"answer":250,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":350,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"b"}}$j$),
('adjusting-entries',
 $j$[{"id":"q1","type":"mcq","label":"Purpose","prompt":"Adjusting entries exist to…","options":[{"id":"a","label":"Record revenue and expenses in the period they are earned or incurred"},{"id":"b","label":"Correct bank errors"},{"id":"c","label":"Close the books"},{"id":"d","label":"Record owner withdrawals"}],"points":10},
     {"id":"q2","type":"numeric","label":"Prepaid insurance","prompt":"₱24,000 of insurance was paid on 1 Jan for 12 months. Insurance expense for January–March (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"mcq","label":"Accrued wages","prompt":"Wages are earned but unpaid at period end. The adjustment is…","options":[{"id":"a","label":"Dr Wages payable / Cr Wages expense"},{"id":"b","label":"Dr Wages expense / Cr Wages payable"},{"id":"c","label":"Dr Cash / Cr Wages expense"},{"id":"d","label":"No entry until paid"}],"points":10},
     {"id":"q4","type":"numeric","label":"Unearned revenue","prompt":"A customer pays ₱60,000 on 1 Oct for 12 months of service. Revenue earned by 31 Dec (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Classification","prompt":"Unearned revenue is reported as…","options":[{"id":"a","label":"An asset"},{"id":"b","label":"A liability"},{"id":"c","label":"Equity"},{"id":"d","label":"An expense"}],"points":10},
     {"id":"q6","type":"mcq","label":"Accrued revenue","prompt":"Services were performed but not yet billed. The adjustment is…","options":[{"id":"a","label":"Dr Accounts receivable / Cr Revenue"},{"id":"b","label":"Dr Revenue / Cr Accounts receivable"},{"id":"c","label":"Dr Cash / Cr Unearned revenue"},{"id":"d","label":"Dr Expense / Cr Payable"}],"points":10},
     {"id":"q7","type":"numeric","label":"Supplies","prompt":"Opening supplies ₱8,000, purchases ₱5,000, closing count ₱6,500. Supplies expense (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"mcq","label":"Omitted accrual","prompt":"Failing to record an accrued expense…","options":[{"id":"a","label":"Overstates expenses and liabilities"},{"id":"b","label":"Understates expenses and liabilities"},{"id":"c","label":"Overstates assets"},{"id":"d","label":"Has no effect on the statements"}],"points":10},
     {"id":"q9","type":"numeric","label":"Accrued interest","prompt":"A ₱500,000 loan at 12% a year was taken on 1 Nov. Interest accrued by 31 Dec (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"Deferral","prompt":"Which is a deferral?","options":[{"id":"a","label":"Accrued wages"},{"id":"b","label":"Prepaid rent"},{"id":"c","label":"Interest earned but not received"},{"id":"d","label":"Unbilled consulting work"}],"points":10}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":6000,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":15000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"a"},"q7":{"answer":6500,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":10000,"tolerance_pct":0.5},"q10":{"answer":"b"}}$j$),
('inventory-cogs-methods',
 $j$[{"id":"q1","type":"numeric","label":"COGS","prompt":"Beginning inventory ₱200k, purchases ₱900k, ending inventory ₱250k. COGS (₱k)?","unit":"₱k","points":10},
     {"id":"q2","type":"mcq","label":"FIFO","prompt":"FIFO assumes…","options":[{"id":"a","label":"The newest units are sold first"},{"id":"b","label":"The oldest units are sold first"},{"id":"c","label":"Units are sold at the average cost of purchases only"},{"id":"d","label":"Inventory never changes in cost"}],"points":10},
     {"id":"q3","type":"numeric","label":"Average cost","prompt":"100 units at ₱10 and 200 units at ₱13 are available. Weighted-average cost per unit (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"Average COGS","prompt":"Using that average cost, 120 units are sold. COGS (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Rising prices","prompt":"When prices are rising, compared with weighted average, FIFO gives…","options":[{"id":"a","label":"Higher COGS and lower profit"},{"id":"b","label":"Lower COGS and higher profit"},{"id":"c","label":"The same profit"},{"id":"d","label":"Lower ending inventory"}],"points":10},
     {"id":"q6","type":"mcq","label":"Standards","prompt":"Which method is not permitted under IFRS/PFRS?","options":[{"id":"a","label":"FIFO"},{"id":"b","label":"Weighted average"},{"id":"c","label":"LIFO"},{"id":"d","label":"Specific identification"}],"points":10},
     {"id":"q7","type":"numeric","label":"FIFO COGS","prompt":"100 units at ₱10 then 100 units at ₱12 are bought. Selling 150 units under FIFO gives COGS of (₱)?","unit":"₱","points":10},
     {"id":"q8","type":"numeric","label":"FIFO ending inventory","prompt":"Same facts: FIFO ending inventory of the remaining 50 units (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Valuation","prompt":"Inventory is reported at…","options":[{"id":"a","label":"Selling price"},{"id":"b","label":"The lower of cost and net realisable value"},{"id":"c","label":"The higher of cost and market"},{"id":"d","label":"Replacement cost only"}],"points":10},
     {"id":"q10","type":"mcq","label":"Overstated inventory","prompt":"If ending inventory is overstated…","options":[{"id":"a","label":"COGS is overstated and profit understated"},{"id":"b","label":"COGS is understated and profit overstated"},{"id":"c","label":"Only the balance sheet is affected"},{"id":"d","label":"Nothing changes"}],"points":10}]$j$,
 $j${"q1":{"answer":850,"tolerance_pct":0.5},"q2":{"answer":"b"},"q3":{"answer":12,"tolerance_pct":0.5},"q4":{"answer":1440,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"c"},"q7":{"answer":1600,"tolerance_pct":0.5},"q8":{"answer":600,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"b"}}$j$),
('depreciation-ppe',
 $j$[{"id":"q1","type":"numeric","label":"Straight-line","prompt":"A machine costs ₱500,000, salvage ₱50,000, life 5 years. Straight-line depreciation per year (₱)?","unit":"₱","points":10},
     {"id":"q2","type":"numeric","label":"Book value","prompt":"Same machine: book value after 2 years of straight-line (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"DDB year 1","prompt":"Same machine under double-declining balance (rate 40%). Year-1 depreciation (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"DDB year 2","prompt":"Year-2 depreciation under double-declining balance (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Meaning","prompt":"Depreciation is…","options":[{"id":"a","label":"A way to track the asset's market value"},{"id":"b","label":"The allocation of cost over the asset's useful life"},{"id":"c","label":"A cash payment to a reserve fund"},{"id":"d","label":"A tax payment"}],"points":10},
     {"id":"q6","type":"mcq","label":"Cash flow","prompt":"On the cash flow statement, depreciation is…","options":[{"id":"a","label":"Subtracted as a cash outflow"},{"id":"b","label":"Added back to net income as a non-cash expense"},{"id":"c","label":"Shown under financing"},{"id":"d","label":"Ignored"}],"points":10},
     {"id":"q7","type":"mcq","label":"Not depreciated","prompt":"Which asset is not depreciated?","options":[{"id":"a","label":"Delivery van"},{"id":"b","label":"Office computers"},{"id":"c","label":"Land"},{"id":"d","label":"Factory machinery"}],"points":10},
     {"id":"q8","type":"numeric","label":"Disposal","prompt":"An asset with book value ₱100,000 is sold for ₱130,000. Gain on disposal (₱)?","unit":"₱","points":10},
     {"id":"q9","type":"mcq","label":"Accelerated","prompt":"An accelerated method gives…","options":[{"id":"a","label":"Lower expense early and higher later"},{"id":"b","label":"Higher expense early and lower later"},{"id":"c","label":"The same expense every year"},{"id":"d","label":"A higher total expense over the life"}],"points":10},
     {"id":"q10","type":"numeric","label":"Units of production","prompt":"Cost ₱300,000, salvage ₱30,000, total capacity 90,000 units; 12,000 units were used this year. Depreciation (₱)?","unit":"₱","points":10}]$j$,
 $j${"q1":{"answer":90000,"tolerance_pct":0.5},"q2":{"answer":320000,"tolerance_pct":0.5},"q3":{"answer":200000,"tolerance_pct":0.5},"q4":{"answer":120000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"b"},"q7":{"answer":"c"},"q8":{"answer":30000,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":36000,"tolerance_pct":0.5}}$j$),
('receivables-bad-debts',
 $j$[{"id":"q1","type":"mcq","label":"Allowance method","prompt":"The allowance method records bad debts…","options":[{"id":"a","label":"Only when an invoice is written off"},{"id":"b","label":"By estimate, in the period of the related sales"},{"id":"c","label":"When cash is collected"},{"id":"d","label":"Never — it is a tax concept"}],"points":10},
     {"id":"q2","type":"numeric","label":"Percentage of sales","prompt":"Credit sales ₱4,000,000 and bad debts estimated at 2%. Bad debt expense (₱)?","unit":"₱","points":10},
     {"id":"q3","type":"numeric","label":"Aging expense","prompt":"Required allowance (aging) ₱150,000; existing allowance has a ₱40,000 credit balance. Bad debt expense (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"Net receivables","prompt":"Gross receivables ₱2,000,000, allowance ₱120,000. Net realisable value (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Write-off","prompt":"Writing off a specific uncollectible account (allowance method)…","options":[{"id":"a","label":"Reduces profit again"},{"id":"b","label":"Is Dr Allowance / Cr Receivable, with no effect on net receivables or profit"},{"id":"c","label":"Increases the allowance"},{"id":"d","label":"Is Dr Bad debt expense / Cr Receivable"}],"points":10},
     {"id":"q6","type":"mcq","label":"Account type","prompt":"The allowance for doubtful accounts is…","options":[{"id":"a","label":"A liability"},{"id":"b","label":"An expense"},{"id":"c","label":"A contra-asset"},{"id":"d","label":"Equity"}],"points":10},
     {"id":"q7","type":"numeric","label":"DSO","prompt":"Annual credit sales ₱3,650,000 and receivables ₱500,000. DSO (days, 365-day year)?","unit":"days","points":10},
     {"id":"q8","type":"mcq","label":"Rising DSO","prompt":"Rising DSO may signal…","options":[{"id":"a","label":"Faster collections"},{"id":"b","label":"Slower collections or aggressive revenue recognition"},{"id":"c","label":"Lower sales"},{"id":"d","label":"Higher cash balances"}],"points":10},
     {"id":"q9","type":"numeric","label":"Aging","prompt":"0–30 days ₱1,000,000 at 1%; 31–60 days ₱400,000 at 5%; over 60 days ₱200,000 at 20%. Required allowance (₱)?","unit":"₱","points":10},
     {"id":"q10","type":"mcq","label":"PFRS 9","prompt":"Under PFRS 9, credit losses on receivables are based on…","options":[{"id":"a","label":"Losses already incurred only"},{"id":"b","label":"Expected credit losses"},{"id":"c","label":"The tax authority's rates"},{"id":"d","label":"Cash collected"}],"points":10}]$j$,
 $j${"q1":{"answer":"b"},"q2":{"answer":80000,"tolerance_pct":0.5},"q3":{"answer":110000,"tolerance_pct":0.5},"q4":{"answer":1880000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":"c"},"q7":{"answer":50,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":70000,"tolerance_pct":0.5},"q10":{"answer":"b"}}$j$),
('revenue-recognition',
 $j$[{"id":"q1","type":"mcq","label":"Five steps","prompt":"Which is the correct order of the five-step model?","options":[{"id":"a","label":"Contract → performance obligations → price → allocate → recognise"},{"id":"b","label":"Price → contract → recognise → allocate → obligations"},{"id":"c","label":"Recognise → contract → price → obligations → allocate"},{"id":"d","label":"Obligations → recognise → contract → allocate → price"}],"points":10},
     {"id":"q2","type":"mcq","label":"Timing","prompt":"Revenue is recognised when…","options":[{"id":"a","label":"Cash is received"},{"id":"b","label":"The contract is signed"},{"id":"c","label":"A performance obligation is satisfied"},{"id":"d","label":"The invoice is paid"}],"points":10},
     {"id":"q3","type":"numeric","label":"Allocation: phone","prompt":"A bundle sells for ₱36,000. Standalone prices: phone ₱30,000, service plan ₱10,000. Revenue allocated to the phone (₱)?","unit":"₱","points":10},
     {"id":"q4","type":"numeric","label":"Allocation: service","prompt":"Revenue allocated to the service plan (₱)?","unit":"₱","points":10},
     {"id":"q5","type":"mcq","label":"Over time","prompt":"A software licence is delivered today with 12 months of support. The support revenue is recognised…","options":[{"id":"a","label":"Entirely today"},{"id":"b","label":"Over the 12 months"},{"id":"c","label":"At the end of the 12 months"},{"id":"d","label":"Only when renewed"}],"points":10},
     {"id":"q6","type":"numeric","label":"Straight-line revenue","prompt":"A ₱1,200,000 contract covers 24 months of service, recognised evenly. Revenue in the first 9 months (₱)?","unit":"₱","points":10},
     {"id":"q7","type":"mcq","label":"Prepayment","prompt":"Cash received before delivery is reported as…","options":[{"id":"a","label":"Revenue"},{"id":"b","label":"A contract liability (unearned revenue)"},{"id":"c","label":"A receivable"},{"id":"d","label":"Equity"}],"points":10},
     {"id":"q8","type":"mcq","label":"Variable consideration","prompt":"Volume rebates (variable consideration) are…","options":[{"id":"a","label":"Ignored until paid"},{"id":"b","label":"Estimated and included only to the extent a significant reversal is unlikely"},{"id":"c","label":"Always included at the maximum"},{"id":"d","label":"Recorded as an expense when paid"}],"points":10},
     {"id":"q9","type":"numeric","label":"Percentage of completion","prompt":"A construction contract of ₱10m is 40% complete (cost-to-cost). Revenue to date (₱m)?","unit":"₱m","points":10},
     {"id":"q10","type":"mcq","label":"Red flag","prompt":"Which pattern most suggests aggressive revenue recognition?","options":[{"id":"a","label":"Revenue and cash collections growing together"},{"id":"b","label":"Revenue growing far faster than cash, with receivables ballooning"},{"id":"c","label":"Stable deferred revenue"},{"id":"d","label":"Falling receivable days"}],"points":10}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":"c"},"q3":{"answer":27000,"tolerance_pct":0.5},"q4":{"answer":9000,"tolerance_pct":0.5},"q5":{"answer":"b"},"q6":{"answer":450000,"tolerance_pct":0.5},"q7":{"answer":"b"},"q8":{"answer":"b"},"q9":{"answer":4,"tolerance_pct":0.5},"q10":{"answer":"b"}}$j$)
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
('accounting-equation-journal', 'debit-or-credit', 1, 'matching', 'Debit or credit?',
 'Each account increases with either a debit or a credit. Sort them.',
 $j${"categories":[{"id":"dr","label":"Increases with a debit"},{"id":"cr","label":"Increases with a credit"}],
     "items":[{"id":"i1","label":"Cash"},{"id":"i2","label":"Accounts payable"},{"id":"i3","label":"Rent expense"},{"id":"i4","label":"Service revenue"},{"id":"i5","label":"Equipment"},
              {"id":"i6","label":"Owner's capital"},{"id":"i7","label":"Supplies"},{"id":"i8","label":"Bank loan"},{"id":"i9","label":"Utilities expense"}]}$j$),
('accounting-equation-journal', 'print-shop-month', 2, 'worked_example', 'Worked example: a month at Maria''s Print Shop',
 'Follow the transactions and keep the equation balanced. Hints are available but cost points.',
 $j${"intro":"Maria's Print Shop (₱): the owner invests 200,000 cash; buys equipment for 120,000 cash; earns 50,000 of service revenue in cash; pays 15,000 rent in cash.",
     "steps":[{"id":"s1","prompt":"Cash after the owner's investment (₱)?","unit":"₱"},{"id":"s2","prompt":"Cash after buying the equipment (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Cash after the revenue and the rent (₱)?","unit":"₱"},{"id":"s4","prompt":"Total assets (cash + equipment) (₱)?","unit":"₱"},
              {"id":"s5","prompt":"Owner's equity (capital + revenue − rent) (₱)?","unit":"₱"}]}$j$),
('adjusting-entries', 'type-of-adjustment', 1, 'matching', 'Which adjustment is it?',
 'Place each situation under the type of adjusting entry it needs.',
 $j${"categories":[{"id":"pe","label":"Prepaid expense"},{"id":"ur","label":"Unearned revenue"},{"id":"ae","label":"Accrued expense"},{"id":"ar","label":"Accrued revenue"}],
     "items":[{"id":"i1","label":"Rent paid for the next 6 months"},{"id":"i2","label":"Customer deposit for future work"},{"id":"i3","label":"Wages owed to staff at month end"},
              {"id":"i4","label":"Interest earned but not yet received"},{"id":"i5","label":"Annual insurance paid upfront"},{"id":"i6","label":"Subscription paid in advance by a customer"},
              {"id":"i7","label":"Electricity used but not yet billed"},{"id":"i8","label":"Consulting done but not yet invoiced"}]}$j$),
('adjusting-entries', 'adjusting-entry-errors', 2, 'spot_error', 'Spot the errors: adjusting entries',
 'Two of these adjusting entries are wrong. Select them, then check.',
 $j${"context":"Year end is 31 December. Amounts in ₱.","columns":["Situation","Adjusting entry"],"select_count":2,
     "rows":[{"id":"r1","cells":["₱12,000 rent paid on 1 Mar for 6 months; adjust at 31 Mar","Dr Rent expense 2,000 / Cr Prepaid rent 2,000"]},
             {"id":"r2","cells":["₱30,000 of wages earned but unpaid at year end","Dr Wages payable 30,000 / Cr Wages expense 30,000"]},
             {"id":"r3","cells":["Customer prepaid ₱36,000 for 12 months on 1 Jul","Dr Unearned revenue 18,000 / Cr Service revenue 18,000"]},
             {"id":"r4","cells":["₱4,000 of interest earned but not yet received","Dr Interest receivable 4,000 / Cr Interest revenue 4,000"]},
             {"id":"r5","cells":["Supplies used during the period: ₱6,500","Dr Supplies 6,500 / Cr Supplies expense 6,500"]},
             {"id":"r6","cells":["₱24,000 insurance paid on 1 Oct for 12 months","Dr Insurance expense 6,000 / Cr Prepaid insurance 6,000"]}]}$j$),
('inventory-cogs-methods', 'fifo-vs-average', 1, 'worked_example', 'Worked example: FIFO vs weighted average',
 'Cost the same sales two ways. Hints are available but cost points.',
 $j${"intro":"A shop has 100 units at ₱20 (opening stock) and buys 100 more units at ₱24. It sells 150 units.",
     "steps":[{"id":"s1","prompt":"Units available for sale?","unit":"units"},{"id":"s2","prompt":"Total cost of goods available (₱)?","unit":"₱"},
              {"id":"s3","prompt":"FIFO cost of goods sold (₱)?","unit":"₱"},{"id":"s4","prompt":"Weighted-average cost per unit (₱)?","unit":"₱"},
              {"id":"s5","prompt":"Weighted-average cost of goods sold (₱)?","unit":"₱"}]}$j$),
('inventory-cogs-methods', 'method-effects', 2, 'matching', 'Which method does that describe?',
 'Assume prices are rising. Match each statement to the method it describes.',
 $j${"categories":[{"id":"fifo","label":"FIFO"},{"id":"wa","label":"Weighted average"}],
     "items":[{"id":"i1","label":"Reports the lowest COGS"},{"id":"i2","label":"Reports the highest ending inventory"},{"id":"i3","label":"Smooths out price changes"},
              {"id":"i4","label":"Uses one average cost per unit"},{"id":"i5","label":"Assumes the oldest units are sold first"},{"id":"i6","label":"Cost available ÷ units available"}]}$j$),
('depreciation-ppe', 'sl-vs-ddb', 1, 'worked_example', 'Worked example: straight-line vs double-declining',
 'Depreciate the same truck two ways. Hints are available but cost points.',
 $j${"intro":"A truck costs ₱800,000 with salvage value ₱80,000 and a 4-year life.",
     "steps":[{"id":"s1","prompt":"Straight-line depreciation per year (₱)?","unit":"₱"},{"id":"s2","prompt":"Straight-line book value at the end of year 2 (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Double-declining year-1 expense (rate 50%) (₱)?","unit":"₱"},{"id":"s4","prompt":"Double-declining year-2 expense (₱)?","unit":"₱"},
              {"id":"s5","prompt":"Double-declining book value at the end of year 2 (₱)?","unit":"₱"}]}$j$),
('depreciation-ppe', 'fixed-asset-errors', 2, 'spot_error', 'Spot the errors: fixed asset schedule',
 'Two lines in this schedule are wrong. Select them, then check.',
 $j${"context":"Equipment cost ₱600,000; salvage value ₱60,000; 6-year life; straight-line.","columns":["Line","Amount (₱)"],"select_count":2,
     "rows":[{"id":"r1","cells":["Annual depreciation","100,000"]},{"id":"r2","cells":["Accumulated depreciation after 3 years","270,000"]},
             {"id":"r3","cells":["Book value after 3 years","330,000"]},{"id":"r4","cells":["Depreciation expense in year 7","90,000"]},
             {"id":"r5","cells":["Book value at the end of the useful life","60,000"]}]}$j$),
('receivables-bad-debts', 'aging-analysis', 1, 'worked_example', 'Worked example: aging of receivables',
 'Build the required allowance and the year''s expense. Hints are available but cost points.',
 $j${"intro":"Aging (₱): current 2,000,000 at 1%; 31–60 days 600,000 at 4%; 61–90 days 300,000 at 10%; over 90 days 100,000 at 40%. The allowance currently has a credit balance of 35,000.",
     "steps":[{"id":"s1","prompt":"Allowance needed for current receivables (₱)?","unit":"₱"},{"id":"s2","prompt":"Allowance needed for 31–60 days (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Allowance needed for 61–90 days (₱)?","unit":"₱"},{"id":"s4","prompt":"Allowance needed for over 90 days (₱)?","unit":"₱"},
              {"id":"s5","prompt":"Total required allowance (₱)?","unit":"₱"},{"id":"s6","prompt":"Bad debt expense for the year (₱)?","unit":"₱"}]}$j$),
('receivables-bad-debts', 'which-entry', 2, 'matching', 'Adjustment, write-off or recovery?',
 'Match each description to the type of entry.',
 $j${"categories":[{"id":"adj","label":"Period-end adjustment"},{"id":"wo","label":"Write-off"},{"id":"rec","label":"Recovery"}],
     "items":[{"id":"i1","label":"Dr Bad debt expense, Cr Allowance"},{"id":"i2","label":"Dr Allowance, Cr Accounts receivable"},{"id":"i3","label":"Reinstate the receivable, then record the cash received"},
              {"id":"i4","label":"Increases expenses in the income statement"},{"id":"i5","label":"Leaves net receivables unchanged"},{"id":"i6","label":"A customer pays an account already written off"},
              {"id":"i7","label":"Recorded once a period from an estimate"},{"id":"i8","label":"Triggered when a specific customer is declared uncollectible"}]}$j$),
('revenue-recognition', 'timing-of-revenue', 1, 'matching', 'Point in time or over time?',
 'Decide when revenue is recognised for each situation.',
 $j${"categories":[{"id":"pit","label":"At a point in time"},{"id":"ot","label":"Over time"}],
     "items":[{"id":"i1","label":"Selling a phone in a store"},{"id":"i2","label":"12-month software support contract"},{"id":"i3","label":"Building a facility on the customer's land"},
              {"id":"i4","label":"Goods whose control passes on delivery"},{"id":"i5","label":"A monthly gym membership"},{"id":"i6","label":"A perpetual software licence delivered today"}]}$j$),
('revenue-recognition', 'allocate-price', 2, 'worked_example', 'Worked example: allocate the transaction price',
 'Split a bundle price and time the revenue. Hints are available but cost points.',
 $j${"intro":"A bundle of a laptop (standalone price ₱60,000) and a 2-year service plan (standalone price ₱20,000) is sold for ₱72,000. The laptop is delivered now; the service is delivered evenly over 2 years.",
     "steps":[{"id":"s1","prompt":"Total of the standalone prices (₱)?","unit":"₱"},{"id":"s2","prompt":"Price allocated to the laptop (₱)?","unit":"₱"},
              {"id":"s3","prompt":"Price allocated to the service plan (₱)?","unit":"₱"},{"id":"s4","prompt":"Service revenue per year (₱)?","unit":"₱"},
              {"id":"s5","prompt":"Total revenue recognised in year 1 (₱)?","unit":"₱"}]}$j$)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('accounting-equation-journal', 'debit-or-credit', $j${"i1":"dr","i2":"cr","i3":"dr","i4":"cr","i5":"dr","i6":"cr","i7":"dr","i8":"cr","i9":"dr"}$j$),
('accounting-equation-journal', 'print-shop-month', $j${
  "s1":{"answer":200000,"tolerance_pct":0.5,"hint":"Only the owner's cash investment so far.","explanation":"Cash = 200,000."},
  "s2":{"answer":80000,"tolerance_pct":0.5,"hint":"Buying equipment swaps cash for equipment.","explanation":"200,000 − 120,000 = 80,000."},
  "s3":{"answer":115000,"tolerance_pct":0.5,"hint":"Add the revenue, subtract the rent.","explanation":"80,000 + 50,000 − 15,000 = 115,000."},
  "s4":{"answer":235000,"tolerance_pct":0.5,"hint":"Cash plus equipment (at cost).","explanation":"115,000 + 120,000 = 235,000."},
  "s5":{"answer":235000,"tolerance_pct":0.5,"hint":"There are no liabilities, so equity equals assets.","explanation":"200,000 + 50,000 − 15,000 = 235,000 — equal to total assets, so the equation balances."}}$j$),
('adjusting-entries', 'type-of-adjustment', $j${"i1":"pe","i2":"ur","i3":"ae","i4":"ar","i5":"pe","i6":"ur","i7":"ae","i8":"ar"}$j$),
('adjusting-entries', 'adjusting-entry-errors', $j${"errors":["r2","r5"],"explanations":{"r2":"Accrued wages are Dr Wages expense / Cr Wages payable. The entry shown is reversed.","r5":"Using supplies is Dr Supplies expense / Cr Supplies. The entry shown is reversed."}}$j$),
('inventory-cogs-methods', 'fifo-vs-average', $j${
  "s1":{"answer":200,"tolerance_pct":0.5,"hint":"Opening units plus purchased units.","explanation":"100 + 100 = 200."},
  "s2":{"answer":4400,"tolerance_pct":0.5,"hint":"100 × 20 plus 100 × 24.","explanation":"2,000 + 2,400 = 4,400."},
  "s3":{"answer":3200,"tolerance_pct":0.5,"hint":"The 100 older units at 20, then 50 units at 24.","explanation":"100 × 20 + 50 × 24 = 3,200."},
  "s4":{"answer":22,"tolerance_pct":0.5,"hint":"Total cost ÷ total units.","explanation":"4,400 ÷ 200 = 22."},
  "s5":{"answer":3300,"tolerance_pct":0.5,"hint":"Units sold × average cost.","explanation":"150 × 22 = 3,300. FIFO COGS is lower, so FIFO profit is higher when prices rise."}}$j$),
('inventory-cogs-methods', 'method-effects', $j${"i1":"fifo","i2":"fifo","i3":"wa","i4":"wa","i5":"fifo","i6":"wa"}$j$),
('depreciation-ppe', 'sl-vs-ddb', $j${
  "s1":{"answer":180000,"tolerance_pct":0.5,"hint":"(Cost − salvage) ÷ life.","explanation":"(800,000 − 80,000) ÷ 4 = 180,000."},
  "s2":{"answer":440000,"tolerance_pct":0.5,"hint":"Cost minus two years of depreciation.","explanation":"800,000 − 2 × 180,000 = 440,000."},
  "s3":{"answer":400000,"tolerance_pct":0.5,"hint":"Rate × opening book value (salvage is ignored).","explanation":"50% × 800,000 = 400,000."},
  "s4":{"answer":200000,"tolerance_pct":0.5,"hint":"Rate × the new opening book value of 400,000.","explanation":"50% × 400,000 = 200,000."},
  "s5":{"answer":200000,"tolerance_pct":0.5,"hint":"Cost minus the two years of expense.","explanation":"800,000 − 400,000 − 200,000 = 200,000."}}$j$),
('depreciation-ppe', 'fixed-asset-errors', $j${"errors":["r1","r4"],"explanations":{"r1":"Annual depreciation = (600,000 − 60,000) ÷ 6 = 90,000. The salvage value must be deducted first.","r4":"The asset is fully depreciated to its salvage value after year 6, so depreciation expense in year 7 is zero."}}$j$),
('receivables-bad-debts', 'aging-analysis', $j${
  "s1":{"answer":20000,"tolerance_pct":0.5,"hint":"2,000,000 × 1%.","explanation":"2,000,000 × 1% = 20,000."},
  "s2":{"answer":24000,"tolerance_pct":0.5,"hint":"600,000 × 4%.","explanation":"600,000 × 4% = 24,000."},
  "s3":{"answer":30000,"tolerance_pct":0.5,"hint":"300,000 × 10%.","explanation":"300,000 × 10% = 30,000."},
  "s4":{"answer":40000,"tolerance_pct":0.5,"hint":"100,000 × 40%.","explanation":"100,000 × 40% = 40,000."},
  "s5":{"answer":114000,"tolerance_pct":0.5,"hint":"Add the four buckets.","explanation":"20,000 + 24,000 + 30,000 + 40,000 = 114,000."},
  "s6":{"answer":79000,"tolerance_pct":0.5,"hint":"Required allowance minus the existing credit balance.","explanation":"114,000 − 35,000 = 79,000."}}$j$),
('receivables-bad-debts', 'which-entry', $j${"i1":"adj","i2":"wo","i3":"rec","i4":"adj","i5":"wo","i6":"rec","i7":"adj","i8":"wo"}$j$),
('revenue-recognition', 'timing-of-revenue', $j${"i1":"pit","i2":"ot","i3":"ot","i4":"pit","i5":"ot","i6":"pit"}$j$),
('revenue-recognition', 'allocate-price', $j${
  "s1":{"answer":80000,"tolerance_pct":0.5,"hint":"60,000 + 20,000.","explanation":"60,000 + 20,000 = 80,000."},
  "s2":{"answer":54000,"tolerance_pct":0.5,"hint":"72,000 × 60/80.","explanation":"72,000 × 60 ÷ 80 = 54,000."},
  "s3":{"answer":18000,"tolerance_pct":0.5,"hint":"72,000 × 20/80.","explanation":"72,000 × 20 ÷ 80 = 18,000."},
  "s4":{"answer":9000,"tolerance_pct":0.5,"hint":"Spread the service allocation over 2 years.","explanation":"18,000 ÷ 2 = 9,000."},
  "s5":{"answer":63000,"tolerance_pct":0.5,"hint":"The laptop is recognised now; add one year of service.","explanation":"54,000 + 9,000 = 63,000."}}$j$)
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
('accounting-equation-journal',1,'The accounting equation','Assets = Liabilities + Equity.'),
('accounting-equation-journal',2,'Accounts that increase with a debit','Assets and expenses.'),
('accounting-equation-journal',3,'Accounts that increase with a credit','Liabilities, equity and revenue.'),
('accounting-equation-journal',4,'Double-entry rule','Every transaction has equal total debits and credits.'),
('accounting-equation-journal',5,'Owner invests cash: entry','Dr Cash / Cr Owner''s capital.'),
('accounting-equation-journal',6,'Buy supplies on credit: entry','Dr Supplies / Cr Accounts payable.'),
('accounting-equation-journal',7,'Pay rent in cash: entry','Dr Rent expense / Cr Cash.'),
('accounting-equation-journal',8,'What does a trial balance prove?','That total debits equal total credits — not that there are no errors.'),
('accounting-equation-journal',9,'What increases equity?','Revenue and owner investment.'),
('accounting-equation-journal',10,'What decreases equity?','Expenses and owner withdrawals.'),
('adjusting-entries',1,'Why make adjusting entries?','To record revenue when earned and expenses when incurred.'),
('adjusting-entries',2,'Prepaid expense','Cash paid first; an asset that becomes an expense as it is used.'),
('adjusting-entries',3,'Unearned revenue','Cash received first; a liability that becomes revenue as work is done.'),
('adjusting-entries',4,'Accrued expense: entry','Dr Expense / Cr Payable (e.g. wages payable).'),
('adjusting-entries',5,'Accrued revenue: entry','Dr Receivable / Cr Revenue.'),
('adjusting-entries',6,'Prepaid used =','Cost × months elapsed ÷ months covered.'),
('adjusting-entries',7,'Accrued interest =','Principal × annual rate × months ÷ 12.'),
('adjusting-entries',8,'Supplies expense =','Opening supplies + purchases − closing count.'),
('adjusting-entries',9,'Deferral vs accrual','Deferral: cash first, work later. Accrual: work first, cash later.'),
('adjusting-entries',10,'Effect of a missed accrued expense','Expenses and liabilities are understated; profit is overstated.'),
('inventory-cogs-methods',1,'COGS formula','Beginning inventory + purchases − ending inventory.'),
('inventory-cogs-methods',2,'FIFO','Oldest costs go to COGS first; ending inventory holds the newest costs.'),
('inventory-cogs-methods',3,'Weighted-average cost per unit','Cost of goods available ÷ units available.'),
('inventory-cogs-methods',4,'LIFO and IFRS/PFRS','Not permitted.'),
('inventory-cogs-methods',5,'Rising prices: FIFO vs average','FIFO gives lower COGS and higher profit.'),
('inventory-cogs-methods',6,'Falling prices: FIFO vs average','FIFO gives higher COGS and lower profit.'),
('inventory-cogs-methods',7,'Inventory valuation rule','Lower of cost and net realisable value.'),
('inventory-cogs-methods',8,'Overstated ending inventory effect','COGS understated, profit overstated.'),
('inventory-cogs-methods',9,'Goods available for sale','Beginning inventory + purchases (split into COGS and ending inventory).'),
('inventory-cogs-methods',10,'Net realisable value','Expected selling price minus costs to complete and sell.'),
('depreciation-ppe',1,'Depreciation is…','Allocation of cost over useful life — not market valuation.'),
('depreciation-ppe',2,'Straight-line','(Cost − Salvage) ÷ Life.'),
('depreciation-ppe',3,'Double-declining rate','2 ÷ useful life, applied to opening book value.'),
('depreciation-ppe',4,'Units of production','(Cost − Salvage) ÷ Total units × Units used.'),
('depreciation-ppe',5,'Book value','Cost − Accumulated depreciation.'),
('depreciation-ppe',6,'Which asset is not depreciated?','Land.'),
('depreciation-ppe',7,'Depreciation on the cash flow statement','Added back — it is a non-cash expense.'),
('depreciation-ppe',8,'Gain or loss on disposal','Sale proceeds − Book value.'),
('depreciation-ppe',9,'Accelerated methods','Higher expense early, lower later; same total over the life.'),
('depreciation-ppe',10,'Floor for depreciation','Never depreciate below salvage value.'),
('receivables-bad-debts',1,'Allowance method','Estimate uncollectible receivables up front to match the cost with the sales.'),
('receivables-bad-debts',2,'Adjusting entry for bad debts','Dr Bad debt expense / Cr Allowance for doubtful accounts.'),
('receivables-bad-debts',3,'Write-off entry','Dr Allowance / Cr Accounts receivable (no profit effect).'),
('receivables-bad-debts',4,'Net realisable value of receivables','Gross receivables − Allowance.'),
('receivables-bad-debts',5,'The allowance is a…','Contra-asset.'),
('receivables-bad-debts',6,'Percentage-of-sales method','Gives the expense directly: credit sales × estimated %.'),
('receivables-bad-debts',7,'Aging method','Required allowance from age buckets; expense = required − existing credit balance.'),
('receivables-bad-debts',8,'DSO =','Receivables ÷ credit sales × days in the period.'),
('receivables-bad-debts',9,'Rising DSO may signal','Slower collections or aggressive revenue recognition.'),
('receivables-bad-debts',10,'PFRS 9 impairment basis','Expected credit losses.'),
('revenue-recognition',1,'Step 1 of the model','Identify the contract with the customer.'),
('revenue-recognition',2,'Step 2','Identify the performance obligations.'),
('revenue-recognition',3,'Step 3','Determine the transaction price.'),
('revenue-recognition',4,'Step 4','Allocate the price by relative standalone selling prices.'),
('revenue-recognition',5,'Step 5','Recognise revenue when (or as) each obligation is satisfied.'),
('revenue-recognition',6,'Over-time examples','Support contracts, memberships, construction for the customer.'),
('revenue-recognition',7,'Point-in-time example','Selling a phone in a store.'),
('revenue-recognition',8,'Cash received before delivery','A contract liability (unearned revenue).'),
('revenue-recognition',9,'Variable consideration rule','Include only to the extent a significant reversal is unlikely.'),
('revenue-recognition',10,'Aggressive-recognition red flag','Revenue far ahead of cash collection; receivables ballooning.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;

-- ---------------------------------------------------------------------
-- 5. Challenges and the final exam
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('accounting-journal-trial-balance', 'Journal Entries: Cebu Print Studio',
 'Record a month of transactions and prove the accounting equation.',
 $md$
**Cebu Print Studio** (₱) had these transactions in its first month:

1. The owner invested **500,000** cash.
2. Bought equipment for **300,000** cash.
3. Bought paper supplies for **20,000** on credit.
4. Earned fees of **180,000**: **120,000** in cash and **60,000** on account.
5. Paid rent of **40,000** in cash.
6. Paid salaries of **60,000** in cash.
$md$, 'Answer in ₱.', 'accounting', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"Bookkeeping math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.4}',
 $j${"tasks":[
   {"id":"cash","type":"numeric","label":"Ending cash","prompt":"Ending cash (₱)?","unit":"₱","points":15},
   {"id":"ar","type":"numeric","label":"Receivables","prompt":"Accounts receivable at month end (₱)?","unit":"₱","points":10},
   {"id":"assets","type":"numeric","label":"Total assets","prompt":"Total assets: cash, receivables, equipment and supplies (₱)?","unit":"₱","points":15},
   {"id":"liab","type":"numeric","label":"Liabilities","prompt":"Total liabilities (₱)?","unit":"₱","points":10},
   {"id":"ni","type":"numeric","label":"Net income","prompt":"Net income for the month (₱)?","unit":"₱","points":15},
   {"id":"equity","type":"numeric","label":"Equity","prompt":"Owner's equity at month end (capital + net income) (₱)?","unit":"₱","points":15},
   {"id":"nb","type":"mcq","label":"Normal balance","prompt":"What is the normal balance of the fees revenue account?","options":[{"id":"a","label":"Debit"},{"id":"b","label":"Credit"},{"id":"c","label":"Either"},{"id":"d","label":"None"}],"points":5},
   {"id":"view","type":"long_text","label":"Assessment","prompt":"Check that the accounting equation balances and comment briefly on the studio's profitability and liquidity.","min_words":40,"points":15}
 ]}$j$::jsonb, '{accounting}', true, now()),

('accounting-adjusting-entries-case', 'Year-End Adjustments: Manila Courier',
 'Compute the adjusting entries and the adjusted profit.',
 $md$
**Manila Courier** has a 31 December year end. Unadjusted profit is **₱300,000**.

| Item | Detail |
|---|---|
| Insurance | ₱36,000 paid on 1 Sep covering 12 months (recorded as prepaid) |
| Advance from a customer | ₱90,000 received on 1 Oct for 6 months of service (recorded as unearned) |
| Wages | ₱28,000 earned by staff but unpaid at year end |
| Supplies | Opening ₱12,000; purchases ₱18,000 (recorded as an asset); closing count ₱9,000 |
| Loan | ₱400,000 at 9% a year, taken on 1 Nov; no interest recorded yet |
$md$, 'Answer in ₱.', 'accounting', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Adjustment math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 $j${"tasks":[
   {"id":"ins","type":"numeric","label":"Insurance expense","prompt":"Insurance expense for the year (₱)?","unit":"₱","points":12},
   {"id":"unearned","type":"numeric","label":"Revenue earned","prompt":"Service revenue earned from the advance by 31 Dec (₱)?","unit":"₱","points":12},
   {"id":"wages","type":"mcq","label":"Wages entry","prompt":"The adjusting entry for the unpaid wages is…","options":[{"id":"a","label":"Dr Wages payable / Cr Wages expense"},{"id":"b","label":"Dr Wages expense / Cr Wages payable"},{"id":"c","label":"Dr Cash / Cr Wages expense"},{"id":"d","label":"No entry is needed"}],"points":10},
   {"id":"sup","type":"numeric","label":"Supplies expense","prompt":"Supplies expense for the year (₱)?","unit":"₱","points":14},
   {"id":"int","type":"numeric","label":"Accrued interest","prompt":"Interest accrued by 31 Dec (₱)?","unit":"₱","points":12},
   {"id":"profit","type":"numeric","label":"Adjusted profit","prompt":"Adjusted profit after all five adjustments (₱)?","unit":"₱","points":20},
   {"id":"why","type":"long_text","label":"Why adjust?","prompt":"Explain why these adjustments matter and what would be misstated if they were skipped.","min_words":40,"points":20}
 ]}$j$::jsonb, '{accounting}', true, now()),

('accounting-inventory-depreciation-case', 'Inventory & Depreciation: Davao Hardware',
 'Cost inventory with FIFO and weighted average, then depreciate a van two ways.',
 $md$
**Davao Hardware** sold **300 units** at **₱400** each during the year.

| Inventory | Units | Cost per unit |
|---|---|---|
| Beginning inventory | 150 | ₱200 |
| Purchases | 250 | ₱220 |

It also bought a **delivery van** for **₱900,000** (salvage ₱100,000, 5-year life).
$md$, 'Answer in ₱. Two decimals where needed.', 'accounting', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Costing math","weight":80},{"label":"Judgment","weight":20}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 $j${"tasks":[
   {"id":"fifo","type":"numeric","label":"FIFO COGS","prompt":"Cost of goods sold under FIFO (₱)?","unit":"₱","points":12},
   {"id":"avgc","type":"numeric","label":"Average cost","prompt":"Weighted-average cost per unit (₱)?","unit":"₱","points":10},
   {"id":"avgcogs","type":"numeric","label":"Average COGS","prompt":"Cost of goods sold under weighted average (₱)?","unit":"₱","points":12},
   {"id":"endinv","type":"numeric","label":"FIFO ending inventory","prompt":"Ending inventory under FIFO (₱)?","unit":"₱","points":12},
   {"id":"gp","type":"numeric","label":"Gross profit","prompt":"Gross profit under FIFO (₱)?","unit":"₱","points":12},
   {"id":"sl","type":"numeric","label":"Straight-line","prompt":"Straight-line depreciation per year for the van (₱)?","unit":"₱","points":10},
   {"id":"ddb","type":"numeric","label":"Double-declining","prompt":"Year-1 depreciation under double-declining balance (₱)?","unit":"₱","points":10},
   {"id":"rising","type":"mcq","label":"Method effect","prompt":"With rising purchase prices, which method reports the higher profit?","options":[{"id":"a","label":"FIFO"},{"id":"b","label":"Weighted average"},{"id":"c","label":"They are always equal"},{"id":"d","label":"It depends only on sales"}],"points":7},
   {"id":"view","type":"long_text","label":"Method choice","prompt":"Which inventory and depreciation methods would you choose and why? Consider profit, tax and comparability.","min_words":40,"points":15}
 ]}$j$::jsonb, '{accounting}', true, now()),

('exam-accounting-fundamentals', 'Final Exam: Certified Accounting Fundamentals',
 'Timed exam: bad debts, depreciation, inventory, adjustments and revenue.',
 $md$
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
$md$, 'You have 60 minutes. Pass mark 70.', 'accounting', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Accounting math","weight":76},{"label":"Judgment","weight":24}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.8,"communication":0.3}',
 $j${"tasks":[
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
 ]}$j$::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug = 'exam-accounting-fundamentals';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('accounting-journal-trial-balance', $j${"cash":{"answer":220000,"tolerance_pct":0.5},"ar":{"answer":60000,"tolerance_pct":0.5},"assets":{"answer":600000,"tolerance_pct":0.5},"liab":{"answer":20000,"tolerance_pct":0.5},
   "ni":{"answer":80000,"tolerance_pct":0.5},"equity":{"answer":580000,"tolerance_pct":0.5},"nb":{"answer":"b"},
   "view":{"keywords":["balance|equal|600,000|assets","profit|net income|80,000|margin","liquid|cash|receivable","equity|liabilit"],"keywords_required":3}}$j$),
 ('accounting-adjusting-entries-case', $j${"ins":{"answer":12000,"tolerance_pct":0.5},"unearned":{"answer":45000,"tolerance_pct":0.5},"wages":{"answer":"b"},"sup":{"answer":21000,"tolerance_pct":0.5},
   "int":{"answer":6000,"tolerance_pct":0.5},"profit":{"answer":278000,"tolerance_pct":0.5},
   "why":{"keywords":["period|matching|accrual","profit|income|earnings","liabilit|payable","asset|prepaid|balance sheet","overstat|understat|misstat"],"keywords_required":3}}$j$),
 ('accounting-inventory-depreciation-case', $j${"fifo":{"answer":63000,"tolerance_pct":0.5},"avgc":{"answer":212.5,"tolerance_pct":0.5},"avgcogs":{"answer":63750,"tolerance_pct":0.5},"endinv":{"answer":22000,"tolerance_pct":0.5},
   "gp":{"answer":57000,"tolerance_pct":0.5},"sl":{"answer":160000,"tolerance_pct":0.5},"ddb":{"answer":360000,"tolerance_pct":0.5},"rising":{"answer":"a"},
   "view":{"keywords":["fifo|weighted average|inventory","profit|income|cogs","tax","straight-line|double|declining|accelerated","comparab|consisten|peer"],"keywords_required":3}}$j$),
 ('exam-accounting-fundamentals', $j${"bde":{"answer":100000,"tolerance_pct":0.5},"netar":{"answer":700000,"tolerance_pct":0.5},"dep":{"answer":200000,"tolerance_pct":0.5},"cogs":{"answer":2000000,"tolerance_pct":0.5},
   "rent":{"answer":24000,"tolerance_pct":0.5},"unearned":{"answer":60000,"tolerance_pct":0.5},"equity":{"answer":2100000,"tolerance_pct":0.5},"sal":{"answer":"b"},"fifo":{"answer":"a"},"rev":{"answer":"b"},
   "assess":{"keywords":["adjust|accrual","allowance|bad debt|receivable","depreciation","profit|income|earnings","balance sheet|asset|liabilit"],"keywords_required":4}}$j$)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certification
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('accounting-fundamentals', 'certification', 'Accounting Fundamentals',
 'From the accounting equation to adjusting entries, inventory, depreciation and revenue.',
 $md$
The accounting every finance career is built on. Learn to record transactions, adjust for accruals and deferrals, cost inventory, depreciate assets, estimate bad debts and recognise revenue under PFRS 15 — then prove it on real-style cases.

**How it works**
1. Pass each lesson's video, practice and knowledge check.
2. Pass every hands-on challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).

Your verifiable certificate is issued automatically the moment you pass.
$md$, 'accounting', 'beginner', 4.0, 'Certified Accounting Fundamentals', true, 5)
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
