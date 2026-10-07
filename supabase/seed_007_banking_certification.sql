-- =====================================================================
-- FINLAB — Content v7: Banking & Credit Analyst certification
--   3 lessons (video + 10-question check + 2 practice activities + 10 flashcards),
--   2 challenges, a timed final exam, the program with a capstone,
--   and 5 banking daily-challenge questions.
-- Run AFTER migration 0010 and seed_006. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Lessons
-- ---------------------------------------------------------------------
insert into public.lessons (slug, title, summary, category_id, difficulty, estimated_minutes, sort_order, related_challenge_slugs, video_urls, body) values
('bank-earnings-nim', 'Bank Earnings & Net Interest Margin', 'How banks make money: NII, NIM, fees, efficiency and returns.', 'financial_analysis', 'intermediate', 15, 13,
 '{banking-earnings-review}', '{https://www.youtube.com/watch?v=-9mJDXPp1HY}', $md$
## A bank is a spread business
A bank borrows cheaply (deposits, bonds) and lends at higher rates. Its core profit line is **net interest income (NII)**:

> **NII = interest income − interest expense**

## Net interest margin
**NIM = NII ÷ average earning assets** (loans, securities, interbank placements). Philippine universal banks typically run NIMs of roughly 3–5%.

What moves NIM:
- **Loan yields** — mix (consumer and SME loans yield more than top-tier corporate loans) and repricing speed.
- **Cost of funds** — a high **CASA ratio** (current and savings accounts as a share of deposits) means cheap, sticky funding.
- **Rate sensitivity** — an *asset-sensitive* bank (loans reprice faster than deposits) sees NIM expand when rates rise and compress when they fall.

## Beyond interest
**Non-interest income**: fees (cards, remittances, wealth management, bancassurance) and trading gains. Fees are valued because they need little capital.

## Efficiency and returns
- **Cost-to-income ratio** = operating expenses ÷ operating income (NII + non-interest income). Lower is better.
- **Pre-provision operating profit (PPOP)** = operating income − operating expenses.
- **Net income** = (PPOP − provisions) × (1 − tax rate).
- **ROA** = net income ÷ average assets (≈1% is solid for a bank).
- **ROE** = ROA × leverage (average assets ÷ average equity). Banks run ~8–12x leverage, so ROA of 1.2% becomes ROE of ~12%.

> Analyst habit: decompose ROE into NIM, fees, costs, credit costs and leverage — then ask which one is moving.
$md$),
('asset-quality-npl', 'Asset Quality: NPLs & Provisions', 'Non-performing loans, coverage, credit costs and early warning signs.', 'financial_analysis', 'intermediate', 15, 14,
 '{banking-asset-quality-capital}', '{https://www.youtube.com/watch?v=-HDNIvd2c6M}', $md$
## Why asset quality decides bank results
A bank earning a 3% NIM can lose years of profit on a few bad loans. Credit risk is the biggest swing factor in bank earnings.

## Key definitions
- **Non-performing loan (NPL)** — typically a loan with payments **90+ days past due** (or unlikely to be repaid in full).
- **NPL ratio** = NPLs ÷ gross loans.
- **Allowance for credit losses** — the reserve built through provisions on the balance sheet.
- **NPL coverage** = allowance ÷ NPLs. Above 100% means reserves exceed the stock of bad loans.
- **Credit cost** = provision expense ÷ average loans, usually quoted in basis points (100bp = 1%).

## How it flows through the statements
Provision expense reduces profit: **net income = (PPOP − provisions) × (1 − t)**. When a fully provisioned loan is **written off**, both NPLs and the allowance fall — there is no new hit to profit.

## Early warning signs
- Rising **30–89 days past-due** loans (they become NPLs next).
- Fast growth in **restructured** loans — stress that may not show up in NPLs yet.
- Rapid loan growth in unfamiliar segments.
- Falling coverage while NPLs rise.

> Under IFRS 9 (adopted in the Philippines as PFRS 9) banks provision for *expected* losses, so a good risk officer provisions *before* NPLs spike.
$md$),
('bank-capital-liquidity', 'Bank Capital & Liquidity', 'Risk-weighted assets, CET1, the leverage ratio, LCR and loan-to-deposit.', 'financial_analysis', 'advanced', 15, 15,
 '{banking-asset-quality-capital}', '{https://www.youtube.com/watch?v=T5u9wNXcj20}', $md$
## Capital absorbs losses; liquidity pays depositors
A bank can be **solvent but illiquid** (good assets, but cannot meet withdrawals today) or **liquid but insolvent** (cash today, but losses exceed equity). Regulators police both.

## Capital
- **Risk-weighted assets (RWA)** — each asset is multiplied by a risk weight (e.g. government bonds 0%, residential mortgages ~50%, corporate loans ~100%), plus charges for operational and market risk.
- **CET1 ratio** = common equity Tier 1 (common shares + retained earnings − deductions) ÷ RWA.
- **Tier 1** adds additional Tier 1 instruments; **total capital adequacy ratio (CAR)** adds Tier 2.
- Basel III requires CET1 of at least 4.5% plus a 2.5% conservation buffer; the BSP sets a minimum total CAR of 10%, and banks hold management buffers above that.
- **Leverage ratio** = Tier 1 capital ÷ total exposure (not risk-weighted) — a backstop against risk weights that are too low.

Dividends, losses and fast RWA growth all reduce capital ratios; retained earnings and capital raises increase them.

## Liquidity
- **Liquidity coverage ratio (LCR)** = high-quality liquid assets (HQLA) ÷ net cash outflows over a 30-day stress. Must be ≥ 100%.
- **Net stable funding ratio (NSFR)** — stable funding vs. long-term assets over one year.
- **Loan-to-deposit ratio (LDR)** = loans ÷ deposits. Very high LDRs mean reliance on less stable wholesale funding.

> Credit investors buying bank bonds focus on capital and liquidity; equity investors focus on ROE — a good bank analyst covers both.
$md$)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks (10 questions each; answers in the admin-only table)
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('bank-earnings-nim',
 $j$[{"id":"q1","type":"numeric","label":"NII","prompt":"Interest income ₱50bn, interest expense ₱20bn. Net interest income (₱bn)?","unit":"₱bn","points":10},
     {"id":"q2","type":"numeric","label":"NIM","prompt":"NII ₱30bn, average earning assets ₱1,000bn. NIM (%)?","unit":"%","points":10},
     {"id":"q3","type":"mcq","label":"CASA","prompt":"The CASA ratio measures…","options":[{"id":"a","label":"Current and savings accounts as a share of total deposits"},{"id":"b","label":"Capital as a share of assets"},{"id":"c","label":"Cash as a share of loans"},{"id":"d","label":"Credit card balances as a share of loans"}],"points":10},
     {"id":"q4","type":"mcq","label":"Funding","prompt":"Why does a high CASA ratio usually support NIM?","options":[{"id":"a","label":"It raises loan yields"},{"id":"b","label":"It lowers the cost of funds"},{"id":"c","label":"It reduces capital requirements"},{"id":"d","label":"It increases fee income"}],"points":10},
     {"id":"q5","type":"numeric","label":"Cost-to-income","prompt":"Operating expenses ₱18bn; operating income (NII + fees) ₱40bn. Cost-to-income ratio (%)?","unit":"%","points":10},
     {"id":"q6","type":"numeric","label":"ROA","prompt":"Net income ₱12bn, average assets ₱1,200bn. ROA (%)?","unit":"%","points":10},
     {"id":"q7","type":"numeric","label":"ROE","prompt":"ROA 1.2% and average assets ÷ average equity of 10x. ROE (%)?","unit":"%","points":10},
     {"id":"q8","type":"mcq","label":"Rate sensitivity","prompt":"For an asset-sensitive bank, rising policy rates usually…","options":[{"id":"a","label":"Expand NIM"},{"id":"b","label":"Compress NIM"},{"id":"c","label":"Leave NIM unchanged"},{"id":"d","label":"Eliminate fee income"}],"points":10},
     {"id":"q9","type":"mcq","label":"Fees","prompt":"Which is non-interest income?","options":[{"id":"a","label":"Interest on corporate loans"},{"id":"b","label":"Credit card and remittance fees"},{"id":"c","label":"Interest paid on deposits"},{"id":"d","label":"Loan principal repaid"}],"points":10},
     {"id":"q10","type":"numeric","label":"Spread","prompt":"Average loan yield 8%, cost of funds 3%. Spread (percentage points)?","unit":"pp","points":10}]$j$,
 $j${"q1":{"answer":30,"tolerance_pct":0.5},"q2":{"answer":3,"tolerance_pct":1},"q3":{"answer":"a"},"q4":{"answer":"b"},"q5":{"answer":45,"tolerance_pct":1},
     "q6":{"answer":1,"tolerance_pct":1},"q7":{"answer":12,"tolerance_pct":1},"q8":{"answer":"a"},"q9":{"answer":"b"},"q10":{"answer":5,"tolerance_pct":1}}$j$),
('asset-quality-npl',
 $j$[{"id":"q1","type":"numeric","label":"NPL ratio","prompt":"NPLs ₱30bn, gross loans ₱1,000bn. NPL ratio (%)?","unit":"%","points":10},
     {"id":"q2","type":"numeric","label":"Coverage","prompt":"Allowance for credit losses ₱36bn, NPLs ₱30bn. NPL coverage (%)?","unit":"%","points":10},
     {"id":"q3","type":"mcq","label":"Definition","prompt":"A loan is typically classified as non-performing when payments are past due by…","options":[{"id":"a","label":"7 days"},{"id":"b","label":"30 days"},{"id":"c","label":"90 days"},{"id":"d","label":"1 year"}],"points":10},
     {"id":"q4","type":"numeric","label":"Credit cost","prompt":"Provision expense ₱8bn, average loans ₱800bn. Credit cost (basis points)?","unit":"bp","points":10},
     {"id":"q5","type":"numeric","label":"Earnings","prompt":"Pre-provision operating profit ₱25bn, provisions ₱8bn, tax rate 25%. Net income (₱bn)?","unit":"₱bn","points":10},
     {"id":"q6","type":"mcq","label":"Coverage","prompt":"NPL coverage below 100% means…","options":[{"id":"a","label":"Allowances are smaller than the stock of NPLs"},{"id":"b","label":"The bank is insolvent"},{"id":"c","label":"NPLs are falling"},{"id":"d","label":"The bank has no provisions"}],"points":10},
     {"id":"q7","type":"mcq","label":"Restructuring","prompt":"Rapid growth in restructured loans may signal…","options":[{"id":"a","label":"Stronger borrowers"},{"id":"b","label":"Stress not yet showing up in NPLs"},{"id":"c","label":"Higher NIM"},{"id":"d","label":"Lower capital needs"}],"points":10},
     {"id":"q8","type":"numeric","label":"Top-up","prompt":"Loans ₱500bn. The NPL ratio rises from 2% to 4% and the bank keeps 100% coverage. Additional allowance needed (₱bn)?","unit":"₱bn","points":10},
     {"id":"q9","type":"mcq","label":"Write-offs","prompt":"Writing off a fully provisioned loan…","options":[{"id":"a","label":"Reduces net income a second time"},{"id":"b","label":"Reduces both NPLs and the allowance, with no new profit hit"},{"id":"c","label":"Increases capital"},{"id":"d","label":"Increases net interest income"}],"points":10},
     {"id":"q10","type":"mcq","label":"Early warning","prompt":"The best early-warning indicator of future NPLs is…","options":[{"id":"a","label":"Rising 30–89 days past-due loans"},{"id":"b","label":"Higher fee income"},{"id":"c","label":"More branches"},{"id":"d","label":"A lower cost-to-income ratio"}],"points":10}]$j$,
 $j${"q1":{"answer":3,"tolerance_pct":1},"q2":{"answer":120,"tolerance_pct":0.5},"q3":{"answer":"c"},"q4":{"answer":100,"tolerance_pct":1},"q5":{"answer":12.75,"tolerance_pct":0.5},
     "q6":{"answer":"a"},"q7":{"answer":"b"},"q8":{"answer":10,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"a"}}$j$),
('bank-capital-liquidity',
 $j$[{"id":"q1","type":"numeric","label":"CET1","prompt":"CET1 capital ₱120bn, risk-weighted assets ₱1,000bn. CET1 ratio (%)?","unit":"%","points":10},
     {"id":"q2","type":"numeric","label":"RWA","prompt":"Corporate loans ₱600bn (100% weight), mortgages ₱200bn (50%), government bonds ₱300bn (0%). Credit RWA (₱bn)?","unit":"₱bn","points":10},
     {"id":"q3","type":"numeric","label":"LCR","prompt":"HQLA ₱150bn, net cash outflows over 30 days ₱120bn. LCR (%)?","unit":"%","points":10},
     {"id":"q4","type":"mcq","label":"LCR purpose","prompt":"The liquidity coverage ratio tests whether a bank can…","options":[{"id":"a","label":"Survive a 30-day liquidity stress"},{"id":"b","label":"Absorb credit losses for a year"},{"id":"c","label":"Pay dividends"},{"id":"d","label":"Grow loans by 30%"}],"points":10},
     {"id":"q5","type":"numeric","label":"LDR","prompt":"Loans ₱800bn, deposits ₱1,000bn. Loan-to-deposit ratio (%)?","unit":"%","points":10},
     {"id":"q6","type":"mcq","label":"CET1 content","prompt":"Which is the core of CET1 capital?","options":[{"id":"a","label":"Common shares and retained earnings"},{"id":"b","label":"Customer deposits"},{"id":"c","label":"Subordinated bonds"},{"id":"d","label":"Loan loss provisions on the income statement"}],"points":10},
     {"id":"q7","type":"numeric","label":"Shortfall","prompt":"RWA ₱1,000bn, target CET1 ratio 10%, current CET1 ₱90bn. Capital shortfall (₱bn)?","unit":"₱bn","points":10},
     {"id":"q8","type":"mcq","label":"Risk weights","prompt":"Why are assets risk-weighted?","options":[{"id":"a","label":"To value them at market prices"},{"id":"b","label":"So riskier assets require more capital"},{"id":"c","label":"To calculate NIM"},{"id":"d","label":"To set deposit rates"}],"points":10},
     {"id":"q9","type":"numeric","label":"Leverage ratio","prompt":"Tier 1 capital ₱100bn, total leverage exposure ₱2,000bn. Leverage ratio (%)?","unit":"%","points":10},
     {"id":"q10","type":"mcq","label":"Dividends","prompt":"All else equal, paying a large special dividend…","options":[{"id":"a","label":"Raises the CET1 ratio"},{"id":"b","label":"Has no effect on capital"},{"id":"c","label":"Lowers the CET1 ratio"},{"id":"d","label":"Lowers risk-weighted assets"}],"points":10}]$j$,
 $j${"q1":{"answer":12,"tolerance_pct":1},"q2":{"answer":700,"tolerance_pct":0.5},"q3":{"answer":125,"tolerance_pct":0.5},"q4":{"answer":"a"},"q5":{"answer":80,"tolerance_pct":0.5},
     "q6":{"answer":"a"},"q7":{"answer":10,"tolerance_pct":0.5},"q8":{"answer":"b"},"q9":{"answer":5,"tolerance_pct":1},"q10":{"answer":"c"}}$j$)
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
('bank-earnings-nim', 'bank-income-lines', 1, 'matching', 'Read a bank income statement',
 'Place each item on the line of a bank''s income statement where it belongs.',
 $j${"categories":[{"id":"ii","label":"Interest income"},{"id":"ie","label":"Interest expense"},{"id":"fee","label":"Non-interest income"},{"id":"opex","label":"Operating expense"}],
     "items":[{"id":"i1","label":"Interest on corporate loans"},{"id":"i2","label":"Interest paid on time deposits"},{"id":"i3","label":"Credit card annual fees"},
              {"id":"i4","label":"Remittance fees"},{"id":"i5","label":"Staff salaries"},{"id":"i6","label":"Coupons received on government bonds"},
              {"id":"i7","label":"Interest on bonds the bank issued"},{"id":"i8","label":"Branch rent and IT costs"},{"id":"i9","label":"Trading gains on securities"}]}$j$),
('bank-earnings-nim', 'nim-to-roe', 2, 'worked_example', 'Worked example: from NIM to ROE',
 'Solve each step in order. Hints are available but cost points.',
 $j${"intro":"Luzon Commercial Bank (₱bn): interest income 48, interest expense 18, fee income 12, operating expenses 24, provisions 4, tax rate 25%, average earning assets 1,000, average equity 110.",
     "steps":[{"id":"s1","prompt":"Net interest income (₱bn)?","unit":"₱bn"},{"id":"s2","prompt":"NIM (%)?","unit":"%"},
              {"id":"s3","prompt":"Cost-to-income ratio (%)?","unit":"%"},{"id":"s4","prompt":"Net income (₱bn)?","unit":"₱bn"},
              {"id":"s5","prompt":"ROE on average equity (%)?","unit":"%"}]}$j$),
('asset-quality-npl', 'asset-quality-errors', 1, 'spot_error', 'Spot the errors: asset quality table',
 'An analyst summarised the bank''s asset quality. Two figures are wrong — find them.',
 $j${"context":"₱bn: gross loans 800 · NPLs 24 · allowance 30 · provision expense 8 · average loans 780 · write-offs 2","columns":["Metric","Value"],"select_count":2,
     "rows":[{"id":"r1","cells":["NPL ratio","3.0%"]},{"id":"r2","cells":["NPL coverage","80%"]},{"id":"r3","cells":["Credit cost","103bp"]},
             {"id":"r4","cells":["Allowance / gross loans","3.75%"]},{"id":"r5","cells":["Write-offs / NPLs","25%"]},{"id":"r6","cells":["Provision expense / NPLs","33.3%"]}]}$j$),
('asset-quality-npl', 'rising-npls', 2, 'branching', 'Case: the warning signs',
 'You are the chief risk officer. Make the calls — each choice has consequences.',
 $j${"start":"n1","nodes":{
   "n1":{"text":"Your SME book's 30–89 day past-due loans doubled this quarter. NPLs are still flat at 2.5%. What do you do?",
         "choices":[{"id":"a","label":"Nothing — NPLs haven't moved","next":"n2a"},{"id":"b","label":"Tighten SME underwriting and raise provisions for the at-risk bucket","next":"n2b"},{"id":"c","label":"Sell the whole SME book at a deep discount","next":"end_fire"}]},
   "n2a":{"text":"Next quarter NPLs jump to 4.5% and coverage falls to 70%. Analysts question your provisioning.",
         "choices":[{"id":"a","label":"Restructure the bad loans so they look current","next":"end_bad"},{"id":"b","label":"Book a large provision and disclose the issue clearly","next":"end_mid"}]},
   "n2b":{"text":"The extra provisions cut quarterly earnings 12%. The CEO wants them released to hit guidance.",
         "choices":[{"id":"a","label":"Release them — the market wants the earnings","next":"end_mid2"},{"id":"b","label":"Hold them and explain the forward-looking risk to the board","next":"end_good"}]},
   "end_bad":{"end":true,"text":"The regulator found the evergreened loans. The bank was fined and forced to restate — credibility destroyed."},
   "end_mid":{"end":true,"text":"Painful but honest. The stock fell, then recovered as investors trusted the cleaned-up book."},
   "end_mid2":{"end":true,"text":"Earnings were met, but two quarters later the losses arrived anyway — and the provision release looked reckless."},
   "end_good":{"end":true,"text":"Excellent. When SME defaults rose, you were already reserved. Earnings stayed stable and the bank gained market share."},
   "end_fire":{"end":true,"text":"You crystallised large losses on loans that were mostly still good. A targeted response would have been far cheaper."}}}$j$),
('bank-capital-liquidity', 'rwa-cet1', 1, 'worked_example', 'Worked example: RWA and CET1',
 'Build risk-weighted assets, then test the dividend the bank can afford.',
 $j${"intro":"Rizal Savings Bank (₱bn): corporate loans 300 (100% weight), residential mortgages 200 (50%), government bonds 150 (0%), interbank placements 50 (20%). Operational and market risk add RWA of 60. CET1 capital 52.",
     "steps":[{"id":"s1","prompt":"Credit RWA (₱bn)?","unit":"₱bn"},{"id":"s2","prompt":"Total RWA (₱bn)?","unit":"₱bn"},
              {"id":"s3","prompt":"CET1 ratio (%)?","unit":"%"},{"id":"s4","prompt":"Minimum CET1 capital for a 10% ratio (₱bn)?","unit":"₱bn"},
              {"id":"s5","prompt":"Largest dividend (₱bn) that keeps CET1 at 10% or more?","unit":"₱bn"}]}$j$),
('bank-capital-liquidity', 'capital-or-liquidity', 2, 'matching', 'Capital or liquidity?',
 'Sort each measure: does it protect solvency (capital) or the ability to pay out cash (liquidity)?',
 $j${"categories":[{"id":"cap","label":"Capital (solvency)"},{"id":"liq","label":"Liquidity (funding)"}],
     "items":[{"id":"i1","label":"CET1 ratio"},{"id":"i2","label":"Liquidity coverage ratio"},{"id":"i3","label":"Risk-weighted assets"},
              {"id":"i4","label":"High-quality liquid assets"},{"id":"i5","label":"Retained earnings"},{"id":"i6","label":"Net stable funding ratio"},
              {"id":"i7","label":"Leverage ratio"},{"id":"i8","label":"Loan-to-deposit ratio"},{"id":"i9","label":"Capital conservation buffer"}]}$j$)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('bank-earnings-nim', 'bank-income-lines', $j${"i1":"ii","i2":"ie","i3":"fee","i4":"fee","i5":"opex","i6":"ii","i7":"ie","i8":"opex","i9":"fee"}$j$),
('bank-earnings-nim', 'nim-to-roe', $j${
  "s1":{"answer":30,"tolerance_pct":0.5,"hint":"Interest income − interest expense.","explanation":"48 − 18 = 30."},
  "s2":{"answer":3,"tolerance_pct":1,"hint":"NII ÷ average earning assets.","explanation":"30 ÷ 1,000 = 3.0%."},
  "s3":{"answer":57.14,"tolerance_pct":1,"hint":"Operating expenses ÷ (NII + fees).","explanation":"24 ÷ (30 + 12) = 57.1%."},
  "s4":{"answer":10.5,"tolerance_pct":0.5,"hint":"(NII + fees − opex − provisions) × (1 − tax).","explanation":"(42 − 24 − 4) × 0.75 = 10.5."},
  "s5":{"answer":9.55,"tolerance_pct":1,"hint":"Net income ÷ average equity.","explanation":"10.5 ÷ 110 = 9.5%."}}$j$),
('asset-quality-npl', 'asset-quality-errors', $j${"errors":["r2","r5"],"explanations":{"r2":"Coverage = allowance ÷ NPLs = 30 ÷ 24 = 125%, not 80% (80% is the inverse).","r5":"Write-offs ÷ NPLs = 2 ÷ 24 = 8.3%, not 25%."}}$j$),
('asset-quality-npl', 'rising-npls', $j${"max":100,
  "points":{"n1.a":0,"n1.b":40,"n1.c":10,"n2a.a":0,"n2a.b":25,"n2b.a":10,"n2b.b":60},
  "feedback":{"n1.a":"Past-due buckets lead NPLs — ignoring them is the classic mistake.","n1.b":"Right: act on the leading indicator before it becomes an NPL.","n1.c":"An overreaction that locks in losses.",
              "n2a.a":"Evergreening hides losses and invites regulatory action.","n2a.b":"Transparent and painful — the right repair once you were late.",
              "n2b.a":"Releasing forward-looking provisions to hit guidance undermines the reserve's purpose.","n2b.b":"Prudent provisioning with clear governance."}}$j$),
('bank-capital-liquidity', 'rwa-cet1', $j${
  "s1":{"answer":410,"tolerance_pct":0.5,"hint":"Multiply each exposure by its risk weight and add them up.","explanation":"300 × 100% + 200 × 50% + 150 × 0% + 50 × 20% = 300 + 100 + 0 + 10 = 410."},
  "s2":{"answer":470,"tolerance_pct":0.5,"hint":"Add operational and market risk RWA.","explanation":"410 + 60 = 470."},
  "s3":{"answer":11.06,"tolerance_pct":1,"hint":"CET1 ÷ total RWA.","explanation":"52 ÷ 470 = 11.1%."},
  "s4":{"answer":47,"tolerance_pct":0.5,"hint":"10% × total RWA.","explanation":"0.10 × 470 = 47."},
  "s5":{"answer":5,"tolerance_pct":1,"hint":"Current CET1 minus the minimum.","explanation":"52 − 47 = 5."}}$j$),
('bank-capital-liquidity', 'capital-or-liquidity', $j${"i1":"cap","i2":"liq","i3":"cap","i4":"liq","i5":"cap","i6":"liq","i7":"cap","i8":"liq","i9":"cap"}$j$)
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
('bank-earnings-nim',1,'Net interest income =','Interest income − interest expense.'),
('bank-earnings-nim',2,'NIM =','Net interest income ÷ average earning assets.'),
('bank-earnings-nim',3,'CASA ratio =','Current + savings account deposits ÷ total deposits (cheap, sticky funding).'),
('bank-earnings-nim',4,'Asset-sensitive bank: rates rise →','NIM tends to expand (loans reprice faster than deposits).'),
('bank-earnings-nim',5,'Cost-to-income ratio =','Operating expenses ÷ (NII + non-interest income). Lower is better.'),
('bank-earnings-nim',6,'Pre-provision operating profit (PPOP) =','Operating income − operating expenses.'),
('bank-earnings-nim',7,'Bank net income =','(PPOP − provisions) × (1 − tax rate).'),
('bank-earnings-nim',8,'Bank ROE ≈','ROA × leverage (average assets ÷ average equity).'),
('bank-earnings-nim',9,'Examples of non-interest income','Card, remittance and wealth fees; bancassurance; trading gains.'),
('bank-earnings-nim',10,'Why are fees prized by bank investors?','They need little capital and are less rate-sensitive.'),
('asset-quality-npl',1,'Non-performing loan (NPL)','Typically 90+ days past due, or unlikely to be repaid in full.'),
('asset-quality-npl',2,'NPL ratio =','NPLs ÷ gross loans.'),
('asset-quality-npl',3,'NPL coverage =','Allowance for credit losses ÷ NPLs.'),
('asset-quality-npl',4,'Credit cost =','Provision expense ÷ average loans (in basis points).'),
('asset-quality-npl',5,'100 basis points =','1 percentage point.'),
('asset-quality-npl',6,'Writing off a fully provisioned loan does what?','Reduces NPLs and the allowance — no new profit hit.'),
('asset-quality-npl',7,'Best early-warning sign of NPLs','Rising 30–89 days past-due loans.'),
('asset-quality-npl',8,'Why watch restructured loans?','They can hide stress that is not yet classified as NPL.'),
('asset-quality-npl',9,'IFRS 9 / PFRS 9 provisioning is based on…','Expected credit losses (forward-looking), not only incurred losses.'),
('asset-quality-npl',10,'Coverage falling while NPLs rise signals…','Under-provisioning risk — future earnings hits.'),
('bank-capital-liquidity',1,'CET1 ratio =','Common equity Tier 1 capital ÷ risk-weighted assets.'),
('bank-capital-liquidity',2,'Core of CET1 capital','Common shares and retained earnings, less deductions.'),
('bank-capital-liquidity',3,'Risk-weighted assets (RWA)','Exposures × risk weights, plus operational and market risk charges.'),
('bank-capital-liquidity',4,'Typical risk weights','Gov''t bonds ~0% · mortgages ~50% · corporate loans ~100%.'),
('bank-capital-liquidity',5,'Basel III CET1 minimum','4.5% + 2.5% capital conservation buffer.'),
('bank-capital-liquidity',6,'BSP minimum total CAR','10%.'),
('bank-capital-liquidity',7,'Leverage ratio =','Tier 1 capital ÷ total exposure (not risk-weighted).'),
('bank-capital-liquidity',8,'LCR =','High-quality liquid assets ÷ net cash outflows over 30 days (≥ 100%).'),
('bank-capital-liquidity',9,'Loan-to-deposit ratio =','Loans ÷ deposits.'),
('bank-capital-liquidity',10,'Solvent but illiquid means…','Good assets, but not enough cash to meet withdrawals now.')
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
('banking-earnings-review', 'Bank Earnings Review: Bayanihan Bank',
 'Build NII, NIM, efficiency and ROE, then judge the impact of a rate cut.',
 $md$
**Bayanihan Bank** FY2025 (₱ billions):

| Item | Value |
|---|---|
| Interest income | 62 |
| Interest expense | 22 |
| Fee and other income | 14 |
| Operating expenses | 27 |
| Provisions for credit losses | 6 |
| Tax rate | 25% |
| Average earning assets | 1,250 |
| Average equity | 150 |

About 70% of Bayanihan's loans reprice within three months; most deposits already pay close to zero.
$md$, 'Two decimals.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Bank metrics","weight":70},{"label":"Judgment","weight":30}]',
 '{"financial_analysis":1.0,"technical_knowledge":0.6,"investment_judgment":0.4}',
 $j${"tasks":[
   {"id":"nii","type":"numeric","label":"NII","prompt":"Net interest income (₱bn)?","unit":"₱bn","points":10},
   {"id":"nim","type":"numeric","label":"NIM","prompt":"Net interest margin (%)?","unit":"%","points":15},
   {"id":"cti","type":"numeric","label":"Cost-to-income","prompt":"Cost-to-income ratio (%)?","unit":"%","points":10},
   {"id":"ni","type":"numeric","label":"Net income","prompt":"Net income (₱bn)?","unit":"₱bn","points":15},
   {"id":"roe","type":"numeric","label":"ROE","prompt":"ROE on average equity (%)?","unit":"%","points":10},
   {"id":"rate","type":"mcq","label":"Rate cut","prompt":"The BSP cuts its policy rate by 100bp. The most likely effect on Bayanihan's NIM is…","options":[{"id":"a","label":"Expansion — deposit costs fall faster"},{"id":"b","label":"Compression — loans reprice down but deposit costs can't fall much further"},{"id":"c","label":"No effect"},{"id":"d","label":"It depends only on fee income"}],"points":10},
   {"id":"view","type":"long_text","label":"Earnings note","prompt":"Write a short earnings note: what drives Bayanihan's returns, and what would you watch next year?","min_words":60,"points":30}
 ]}$j$::jsonb, '{banking}', true, now()),

('banking-asset-quality-capital', 'Asset Quality & Capital: Southern Rural Bank',
 'Diagnose NPLs, coverage, capital and liquidity — and recommend a fix.',
 $md$
**Southern Rural Bank** (₱ billions):

| Item | Value |
|---|---|
| Gross loans | 400 |
| Non-performing loans | 18 |
| Allowance for credit losses | 14 |
| CET1 capital | 42 |
| Risk-weighted assets | 350 |
| High-quality liquid assets | 60 |
| Net cash outflows (30-day stress) | 50 |
| Deposits | 480 |

Assume any extra provisions reduce CET1 one-for-one (ignore tax) and leave RWA unchanged.
$md$, 'Two decimals.', 'financial_analysis', 'tasks', null, 'advanced', 30, 100, 60, 'auto',
 '[{"label":"Risk metrics","weight":70},{"label":"Recommendation","weight":30}]',
 '{"financial_analysis":1.0,"decision_making":0.7,"technical_knowledge":0.5}',
 $j${"tasks":[
   {"id":"npl","type":"numeric","label":"NPL ratio","prompt":"NPL ratio (%)?","unit":"%","points":10},
   {"id":"cov","type":"numeric","label":"Coverage","prompt":"NPL coverage (%)?","unit":"%","points":10},
   {"id":"top","type":"numeric","label":"Top-up","prompt":"Extra provisions needed to reach 100% coverage (₱bn)?","unit":"₱bn","points":10},
   {"id":"cet1","type":"numeric","label":"CET1 after top-up","prompt":"CET1 ratio after the top-up (%)?","unit":"%","points":15},
   {"id":"lcr","type":"numeric","label":"LCR","prompt":"Liquidity coverage ratio (%)?","unit":"%","points":10},
   {"id":"ldr","type":"numeric","label":"LDR","prompt":"Loan-to-deposit ratio (%)?","unit":"%","points":5},
   {"id":"action","type":"mcq","label":"Best action","prompt":"Which plan best strengthens the bank?","options":[{"id":"a","label":"Raise the dividend to support the share price"},{"id":"b","label":"Top up provisions, retain earnings and slow risky loan growth"},{"id":"c","label":"Sell liquid assets to fund faster loan growth"},{"id":"d","label":"Restructure NPLs so they are reclassified as performing"}],"points":10},
   {"id":"memo","type":"long_text","label":"Risk memo","prompt":"Write a short memo to the board on asset quality, capital and liquidity, with your recommendation.","min_words":60,"points":30}
 ]}$j$::jsonb, '{banking}', true, now()),

('exam-banking-credit', 'Final Exam: Certified Banking & Credit Analyst',
 'Timed exam: bank earnings, asset quality, capital, liquidity and a corporate credit decision.',
 $md$
**Pacific Isles Bank** FY2025 (₱ billions):

| Earnings | | Balance sheet | |
|---|---|---|---|
| Interest income | 90 | Gross loans | 1,200 |
| Interest expense | 35 | NPLs | 30 |
| Fee income | 20 | Allowance | 33 |
| Operating expenses | 40 | CET1 capital | 180 |
| Provisions | 9 | Risk-weighted assets | 1,400 |
| Tax rate | 25% | HQLA | 260 |
| Average earning assets | 1,800 | Net 30-day outflows | 200 |
| Average equity | 200 | | |

**Corporate borrower — Mindanao Power** (₱ millions): net debt 6,000 · EBITDA 2,000 · interest 400. Loan covenant: net debt / EBITDA ≤ 3.5x.
$md$, 'You have 60 minutes. Two decimals. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Bank & credit math","weight":78},{"label":"Judgment","weight":22}]',
 '{"financial_analysis":1.0,"technical_knowledge":0.8,"decision_making":0.6,"investment_judgment":0.4}',
 $j${"tasks":[
   {"id":"nim","type":"numeric","label":"NIM","prompt":"Net interest margin (%)?","unit":"%","points":8},
   {"id":"cti","type":"numeric","label":"Cost-to-income","prompt":"Cost-to-income ratio (%)?","unit":"%","points":8},
   {"id":"ni","type":"numeric","label":"Net income","prompt":"Net income (₱bn)?","unit":"₱bn","points":10},
   {"id":"roe","type":"numeric","label":"ROE","prompt":"ROE on average equity (%)?","unit":"%","points":8},
   {"id":"npl","type":"numeric","label":"NPL ratio","prompt":"NPL ratio (%)?","unit":"%","points":8},
   {"id":"cov","type":"numeric","label":"Coverage","prompt":"NPL coverage (%)?","unit":"%","points":6},
   {"id":"cet1","type":"numeric","label":"CET1","prompt":"CET1 ratio (%)?","unit":"%","points":8},
   {"id":"lcr","type":"numeric","label":"LCR","prompt":"Liquidity coverage ratio (%)?","unit":"%","points":6},
   {"id":"lev","type":"numeric","label":"Borrower leverage","prompt":"Mindanao Power net debt / EBITDA (x)?","unit":"x","points":8},
   {"id":"head","type":"numeric","label":"Covenant headroom","prompt":"By what % can Mindanao Power's EBITDA fall before breaching 3.5x (net debt unchanged)?","unit":"%","points":8},
   {"id":"loan","type":"mcq","label":"Credit decision","prompt":"Mindanao Power asks for another ₱1,000m. Net leverage would reach 3.5x — exactly at the covenant. Best response?","options":[{"id":"a","label":"Approve unconditionally — the bank has strong capital"},{"id":"b","label":"Stress EBITDA first, then lend only with staged drawdowns, amortization and tighter reporting"},{"id":"c","label":"Exit all lending to the power sector"},{"id":"d","label":"Cut the interest rate to win the deal"}],"points":6},
   {"id":"memo","type":"long_text","label":"Credit committee note","prompt":"Write a credit committee note on Pacific Isles Bank: profitability, asset quality, capital and liquidity. Would you buy its senior bonds?","min_words":90,"points":16}
 ]}$j$::jsonb, '{certification_exam,banking}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug = 'exam-banking-credit';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('banking-earnings-review', $j${"nii":{"answer":40,"tolerance_pct":0.5},"nim":{"answer":3.2,"tolerance_pct":1},"cti":{"answer":50,"tolerance_pct":1},"ni":{"answer":15.75,"tolerance_pct":0.5},"roe":{"answer":10.5,"tolerance_pct":1},"rate":{"answer":"b"},
   "view":{"keywords":["nim|margin|net interest","cost|efficiency|cost-to-income","provision|credit cost|asset quality","roe|return","rate|repric|bsp"],"keywords_required":3}}$j$),
 ('banking-asset-quality-capital', $j${"npl":{"answer":4.5,"tolerance_pct":1},"cov":{"answer":77.78,"tolerance_pct":1},"top":{"answer":4,"tolerance_pct":0.5},"cet1":{"answer":10.86,"tolerance_pct":1},"lcr":{"answer":120,"tolerance_pct":0.5},"ldr":{"answer":83.33,"tolerance_pct":1},"action":{"answer":"b"},
   "memo":{"keywords":["npl|asset quality|non-performing","coverage|provision|allowance","capital|cet1","liquidity|lcr|deposit","dividend|retain|growth"],"keywords_required":3}}$j$),
 ('exam-banking-credit', $j${"nim":{"answer":3.06,"tolerance_pct":1},"cti":{"answer":53.33,"tolerance_pct":1},"ni":{"answer":19.5,"tolerance_pct":0.5},"roe":{"answer":9.75,"tolerance_pct":1},"npl":{"answer":2.5,"tolerance_pct":1},"cov":{"answer":110,"tolerance_pct":0.5},
   "cet1":{"answer":12.86,"tolerance_pct":1},"lcr":{"answer":130,"tolerance_pct":0.5},"lev":{"answer":3,"tolerance_pct":1},"head":{"answer":14.29,"tolerance_pct":2},"loan":{"answer":"b"},
   "memo":{"keywords":["nim|margin","roe|return","npl|asset quality","coverage|provision","cet1|capital","lcr|liquidity"],"keywords_required":4}}$j$)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certification (with capstone)
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('banking-credit-analyst', 'certification', 'Banking & Credit Analyst',
 'Analyse banks and borrowers: margins, asset quality, capital, liquidity and covenants.',
 $md$
The credit and bank-analysis toolkit used by bank credit officers, rating analysts and bank equity analysts: corporate credit metrics and covenants, bank earnings and NIM, NPLs and provisioning, capital and liquidity, and bank valuation with justified P/B.

**How it works**
1. Pass each lesson's video, practice and knowledge check.
2. Pass every hands-on challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
4. Present a **recorded capstone** on a real listed bank, scored by a reviewer.

Your verifiable certificate is issued automatically the moment you pass.
$md$, 'financial_analysis', 'advanced', 7.0, 'Certified Banking & Credit Analyst', true, 4)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score, config)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score, coalesce(m.config::jsonb, '{}'::jsonb)
from (values
  ('banking-credit-analyst', 1, 'lesson', 'credit-analysis', null::numeric, null::text),
  ('banking-credit-analyst', 2, 'challenge', 'financial-analysis-credit-leverage', null, null),
  ('banking-credit-analyst', 3, 'lesson', 'bank-earnings-nim', null, null),
  ('banking-credit-analyst', 4, 'challenge', 'banking-earnings-review', null, null),
  ('banking-credit-analyst', 5, 'lesson', 'asset-quality-npl', null, null),
  ('banking-credit-analyst', 6, 'lesson', 'bank-capital-liquidity', null, null),
  ('banking-credit-analyst', 7, 'challenge', 'banking-asset-quality-capital', null, null),
  ('banking-credit-analyst', 8, 'challenge', 'valuation-bank-justified-pb', null, null),
  ('banking-credit-analyst', 9, 'exam', 'exam-banking-credit', 70, null),
  ('banking-credit-analyst', 10, 'capstone', null, 70, $j${"title":"Capstone: full review of a listed bank","minutes":150,
    "brief":"Pick a listed bank (for example BDO, BPI, Metrobank, Security Bank, or a US or regional bank). Record a 6–10 minute presentation covering: earnings and NIM drivers, asset quality and provisioning trends, capital and liquidity versus requirements, and a justified P/B valuation. Finish with two verdicts — one for a bond investor and one for an equity investor.",
    "deliverables":["A link to your recorded presentation (YouTube unlisted, Google Drive, Loom, Vimeo, Canva or OneDrive)","Optional: a link to your slides or model","A 150+ word executive summary"],
    "rubric":[{"key":"earnings","label":"Earnings & NIM analysis","max":25},{"key":"asset_quality","label":"Asset quality & provisioning","max":25},{"key":"capital","label":"Capital, liquidity & valuation","max":30},{"key":"delivery","label":"Delivery & verdicts","max":20}]}$j$)
) as m(program_slug, pos, kind, ref, min_score, config)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;

update public.lessons set related_challenge_slugs = '{financial-analysis-credit-leverage,banking-asset-quality-capital}' where slug = 'credit-analysis';

-- ---------------------------------------------------------------------
-- 7. Banking daily challenges
-- ---------------------------------------------------------------------
insert into public.daily_questions (slug, category_id, type, prompt, options, unit, explanation)
select v.slug, v.cat, v.type, v.prompt, v.options::jsonb, v.unit, v.explanation
from (values
('d41','financial_analysis','numeric','NII ₱45bn, average earning assets ₱1,500bn. NIM (%)?',null,'%','45 ÷ 1,500 = 3.0%.'),
('d42','financial_analysis','numeric','NPLs ₱12bn, allowance ₱15bn. NPL coverage (%)?',null,'%','15 ÷ 12 = 125%.'),
('d43','financial_analysis','numeric','CET1 ₱88bn, RWA ₱800bn. CET1 ratio (%)?',null,'%','88 ÷ 800 = 11%.'),
('d44','financial_analysis','mcq','A bank with plenty of capital but too little cash to meet withdrawals is…','[{"id":"a","label":"Insolvent"},{"id":"b","label":"Illiquid"},{"id":"c","label":"Over-provisioned"},{"id":"d","label":"Asset-sensitive"}]',null,'Capital measures solvency; cash and HQLA measure liquidity.'),
('d45','financial_analysis','numeric','Provision expense ₱6bn, average loans ₱400bn. Credit cost (bp)?',null,'bp','6 ÷ 400 = 1.5% = 150bp.')
) as v(slug, cat, type, prompt, options, unit, explanation)
on conflict (slug) do update set prompt = excluded.prompt, options = excluded.options, explanation = excluded.explanation, unit = excluded.unit;

insert into public.daily_question_keys (question_id, answer)
select q.id, v.answer::jsonb
from (values
('d41','{"answer":3,"tolerance_pct":1}'),('d42','{"answer":125,"tolerance_pct":0.5}'),('d43','{"answer":11,"tolerance_pct":1}'),
('d44','{"answer":"b"}'),('d45','{"answer":150,"tolerance_pct":1}')
) as v(slug, answer)
join public.daily_questions q on q.slug = v.slug
on conflict (question_id) do update set answer = excluded.answer;
