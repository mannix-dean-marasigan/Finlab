-- =====================================================================
-- FINLAB — Content v2: new lessons, lesson knowledge checks, new
-- challenges, certification exams, certification programs & tracks.
-- Run AFTER seed.sql and migration 0005. Safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. New lessons
-- ---------------------------------------------------------------------
insert into public.lessons (slug, title, summary, category_id, difficulty, estimated_minutes, sort_order, related_challenge_slugs, body) values
('cash-flow-statement', 'Building the Cash Flow Statement', 'From net income to free cash flow using the indirect method.', 'accounting', 'beginner', 12, 2,
 '{accounting-cash-flow-build}', $md$
## The indirect method
Start from **net income**, then adjust for everything that affected profit but not cash:

| Adjustment | Direction |
|---|---|
| Depreciation & amortization (non-cash) | **Add back** |
| Increase in receivables (sold but not yet collected) | **Subtract** |
| Increase in inventory (cash spent on stock) | **Subtract** |
| Increase in payables (bills not yet paid) | **Add** |

The result is **cash flow from operations (CFO)**.

## Free cash flow
FCF = CFO − capital expenditure. This is the cash available to repay debt, pay dividends or reinvest.

## Investing and financing
- **Investing:** capex, acquisitions, asset sales.
- **Financing:** borrowing, repaying debt, issuing shares, dividends.

Net change in cash = CFO + investing + financing.

> If net income keeps rising but CFO doesn't, find out why — often receivables or inventory are absorbing the cash.
$md$),
('cost-of-capital', 'Cost of Capital (WACC)', 'CAPM, after-tax cost of debt and weighting them into WACC.', 'valuation', 'intermediate', 12, 4,
 '{valuation-wacc-build}', $md$
## Cost of equity (CAPM)
k_e = risk-free rate + β × market risk premium. A stock with β 1.2 moves 20% more than the market, so shareholders demand more.

## Cost of debt
Interest is tax-deductible, so use the **after-tax** cost: k_d × (1 − tax rate).

## WACC
WACC = E/(D+E) × k_e + D/(D+E) × k_d × (1 − t). Use **market** values for the weights where possible.

## Using it
WACC is the discount rate for **free cash flow to the firm** in a DCF and the hurdle rate for projects. A project earning above WACC creates value; below WACC it destroys value.

> Small changes in WACC move DCF values a lot. Always show a sensitivity range.
$md$),
('credit-analysis', 'Credit Analysis Basics', 'Leverage, coverage and covenant headroom — how lenders think.', 'financial_analysis', 'intermediate', 12, 3,
 '{financial-analysis-credit-leverage}', $md$
## The lender's question
Equity investors ask *how much can I make?* Lenders ask *will I be repaid?* Credit analysis focuses on **cash flow available to service debt**.

## Key ratios
- **Net debt / EBITDA** — years of operating cash profit needed to repay debt. Under 2.5x is usually comfortable; above 4x is aggressive.
- **Interest coverage** — EBITDA / interest (or EBIT / interest). Higher is safer.

## Covenants
Loan agreements set limits, e.g. *net debt / EBITDA ≤ 3.0x*. Breaching one can let lenders demand repayment.
**Headroom:** how far EBITDA can fall before the covenant breaks = 1 − (net debt / covenant) / EBITDA.

> Always stress-test: what happens to coverage if EBITDA falls 20%?
$md$)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2. Knowledge checks for every lesson (answers in admin-only table)
-- ---------------------------------------------------------------------
with qs(slug, questions, answers) as (values
('three-statements',
 $j$[{"id":"q1","type":"mcq","label":"Linkage","prompt":"Net income flows into which balance sheet account?","options":[{"id":"a","label":"Cash"},{"id":"b","label":"Retained earnings"},{"id":"c","label":"Accounts payable"},{"id":"d","label":"Property, plant & equipment"}],"points":25},
     {"id":"q2","type":"mcq","label":"Depreciation","prompt":"In operating cash flow (indirect method), depreciation is…","options":[{"id":"a","label":"Subtracted, because it is an expense"},{"id":"b","label":"Ignored"},{"id":"c","label":"Added back, because it is non-cash"},{"id":"d","label":"Moved to financing"}],"points":25},
     {"id":"q3","type":"numeric","label":"EBIT","prompt":"Revenue ₱500m, COGS ₱300m, operating expenses ₱120m. What is EBIT (₱m)?","unit":"₱m","points":25},
     {"id":"q4","type":"mcq","label":"Capex","prompt":"Buying equipment for cash appears in…","options":[{"id":"a","label":"Operating activities"},{"id":"b","label":"Investing activities"},{"id":"c","label":"Financing activities"},{"id":"d","label":"The income statement as an expense"}],"points":25}]$j$,
 $j${"q1":{"answer":"b"},"q2":{"answer":"c"},"q3":{"answer":80,"tolerance_pct":0.5},"q4":{"answer":"b"}}$j$),
('cash-flow-statement',
 $j$[{"id":"q1","type":"numeric","label":"CFO","prompt":"Net income ₱100m, D&A ₱20m, receivables increased by ₱15m. What is CFO (₱m)?","unit":"₱m","points":25},
     {"id":"q2","type":"mcq","label":"Inventory","prompt":"An increase in inventory…","options":[{"id":"a","label":"Increases operating cash flow"},{"id":"b","label":"Reduces operating cash flow"},{"id":"c","label":"Has no cash effect"},{"id":"d","label":"Is a financing outflow"}],"points":25},
     {"id":"q3","type":"numeric","label":"FCF","prompt":"CFO ₱105m and capital expenditure ₱40m. Free cash flow (₱m)?","unit":"₱m","points":25},
     {"id":"q4","type":"mcq","label":"Dividends","prompt":"Paying dividends is classified as…","options":[{"id":"a","label":"Operating"},{"id":"b","label":"Investing"},{"id":"c","label":"Financing"},{"id":"d","label":"Not shown"}],"points":25}]$j$,
 $j${"q1":{"answer":105,"tolerance_pct":0.5},"q2":{"answer":"b"},"q3":{"answer":65,"tolerance_pct":0.5},"q4":{"answer":"c"}}$j$),
('ratio-analysis',
 $j$[{"id":"q1","type":"numeric","label":"ROE","prompt":"Net income ₱120m, average equity ₱800m. ROE (%)?","unit":"%","points":25},
     {"id":"q2","type":"numeric","label":"Quick ratio","prompt":"Current assets ₱600m (of which inventory ₱200m), current liabilities ₱400m. Quick ratio (x)?","unit":"x","points":25},
     {"id":"q3","type":"mcq","label":"Diagnosis","prompt":"Revenue grows 12% but gross margin falls 100bp. The most likely explanation is…","options":[{"id":"a","label":"Price discounting or rising input costs"},{"id":"b","label":"Lower interest expense"},{"id":"c","label":"A share buyback"},{"id":"d","label":"Higher depreciation below gross profit"}],"points":25},
     {"id":"q4","type":"mcq","label":"DuPont","prompt":"DuPont analysis splits ROE into…","options":[{"id":"a","label":"Growth × margin × payout"},{"id":"b","label":"Net margin × asset turnover × equity multiplier"},{"id":"c","label":"P/E × EPS × yield"},{"id":"d","label":"Current ratio × quick ratio"}],"points":25}]$j$,
 $j${"q1":{"answer":15,"tolerance_pct":1},"q2":{"answer":1,"tolerance_pct":1},"q3":{"answer":"a"},"q4":{"answer":"b"}}$j$),
('credit-analysis',
 $j$[{"id":"q1","type":"numeric","label":"Leverage","prompt":"Net debt ₱2,000m, EBITDA ₱800m. Net debt / EBITDA (x)?","unit":"x","points":25},
     {"id":"q2","type":"numeric","label":"Coverage","prompt":"EBITDA ₱800m, interest expense ₱200m. Interest coverage (x)?","unit":"x","points":25},
     {"id":"q3","type":"mcq","label":"Covenants","prompt":"A leverage covenant of 3.0x means…","options":[{"id":"a","label":"The company must keep net debt / EBITDA at or below 3.0x"},{"id":"b","label":"Interest rates are capped at 3%"},{"id":"c","label":"The company must hold 3x its debt in cash"},{"id":"d","label":"Dividends must be 3x covered"}],"points":25},
     {"id":"q4","type":"mcq","label":"Lender focus","prompt":"A lender's primary concern is…","options":[{"id":"a","label":"Maximum upside in the share price"},{"id":"b","label":"Cash flow available to service and repay debt"},{"id":"c","label":"Market share growth at any cost"},{"id":"d","label":"Earnings per share accretion"}],"points":25}]$j$,
 $j${"q1":{"answer":2.5,"tolerance_pct":1},"q2":{"answer":4,"tolerance_pct":1},"q3":{"answer":"a"},"q4":{"answer":"b"}}$j$),
('valuation-multiples',
 $j$[{"id":"q1","type":"numeric","label":"P/E target","prompt":"EPS ₱3.50 and a target P/E of 14x. Target price (₱)?","unit":"₱","points":25},
     {"id":"q2","type":"numeric","label":"P/B target","prompt":"Book value per share ₱50 and target P/B of 1.2x. Target price (₱)?","unit":"₱","points":25},
     {"id":"q3","type":"mcq","label":"Method choice","prompt":"P/B is usually preferred over P/E for…","options":[{"id":"a","label":"Software start-ups"},{"id":"b","label":"Banks and asset-heavy businesses"},{"id":"c","label":"Companies with stable, high earnings growth"},{"id":"d","label":"Pre-revenue biotech"}],"points":25},
     {"id":"q4","type":"numeric","label":"Upside","prompt":"Target ₱55, current price ₱50. Upside (%)?","unit":"%","points":25}]$j$,
 $j${"q1":{"answer":49,"tolerance_pct":0.5},"q2":{"answer":60,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":10,"tolerance_pct":1}}$j$),
('cost-of-capital',
 $j$[{"id":"q1","type":"numeric","label":"Cost of equity","prompt":"Risk-free 5%, beta 1.2, market risk premium 6%. Cost of equity (%)?","unit":"%","points":25},
     {"id":"q2","type":"numeric","label":"After-tax kd","prompt":"Pre-tax cost of debt 8%, tax rate 25%. After-tax cost of debt (%)?","unit":"%","points":25},
     {"id":"q3","type":"numeric","label":"WACC","prompt":"70% equity at 12%, 30% debt at an after-tax 6%. WACC (%)?","unit":"%","points":25},
     {"id":"q4","type":"mcq","label":"Beta","prompt":"All else equal, a higher beta…","options":[{"id":"a","label":"Lowers the cost of equity"},{"id":"b","label":"Raises the cost of equity"},{"id":"c","label":"Only affects the cost of debt"},{"id":"d","label":"Has no effect on valuation"}],"points":25}]$j$,
 $j${"q1":{"answer":12.2,"tolerance_pct":1},"q2":{"answer":6,"tolerance_pct":1},"q3":{"answer":10.2,"tolerance_pct":1},"q4":{"answer":"b"}}$j$),
('dcf-fundamentals',
 $j$[{"id":"q1","type":"numeric","label":"Discounting","prompt":"Year-1 FCF of ₱110m at a 10% WACC. Present value (₱m)?","unit":"₱m","points":25},
     {"id":"q2","type":"numeric","label":"Terminal value","prompt":"Final-year FCF ₱100m, growth 3%, WACC 8%. Gordon-growth terminal value (₱m)?","unit":"₱m","points":25},
     {"id":"q3","type":"mcq","label":"EV to equity","prompt":"Equity value = enterprise value minus…","options":[{"id":"a","label":"Net income"},{"id":"b","label":"Net debt"},{"id":"c","label":"Capex"},{"id":"d","label":"Dividends"}],"points":25},
     {"id":"q4","type":"mcq","label":"Terminal growth","prompt":"Terminal growth must be…","options":[{"id":"a","label":"Higher than WACC"},{"id":"b","label":"Equal to the last forecast year's growth"},{"id":"c","label":"Below WACC and long-run nominal GDP growth"},{"id":"d","label":"Exactly 0%"}],"points":25}]$j$,
 $j${"q1":{"answer":100,"tolerance_pct":0.5},"q2":{"answer":2060,"tolerance_pct":0.5},"q3":{"answer":"b"},"q4":{"answer":"c"}}$j$),
('stock-pitch-structure',
 $j$[{"id":"q1","type":"mcq","label":"Variant perception","prompt":"Variant perception is…","options":[{"id":"a","label":"The consensus view"},{"id":"b","label":"What you believe that the market does not, and why"},{"id":"c","label":"The company's guidance"},{"id":"d","label":"A list of risks"}],"points":25},
     {"id":"q2","type":"mcq","label":"Catalyst","prompt":"Which is the strongest catalyst?","options":[{"id":"a","label":"\"Great management\""},{"id":"b","label":"\"Strong brand\""},{"id":"c","label":"\"Q3 results on Nov 12 should show margin recovery\""},{"id":"d","label":"\"The stock is cheap\""}],"points":25},
     {"id":"q3","type":"numeric","label":"Upside","prompt":"Current ₱80, target ₱92. Upside (%)?","unit":"%","points":25},
     {"id":"q4","type":"mcq","label":"Consistency","prompt":"A BUY with 3% upside (10% convention) is…","options":[{"id":"a","label":"Consistent"},{"id":"b","label":"Inconsistent — it implies HOLD"},{"id":"c","label":"Inconsistent — it implies SELL"},{"id":"d","label":"Fine if the thesis is strong"}],"points":25}]$j$,
 $j${"q1":{"answer":"b"},"q2":{"answer":"c"},"q3":{"answer":15,"tolerance_pct":1},"q4":{"answer":"b"}}$j$),
('equity-research-report',
 $j$[{"id":"q1","type":"mcq","label":"Structure","prompt":"Where should the investment call appear?","options":[{"id":"a","label":"First — in the investment thesis"},{"id":"b","label":"Only in the conclusion"},{"id":"c","label":"In the sources"},{"id":"d","label":"It should be implied, not stated"}],"points":25},
     {"id":"q2","type":"mcq","label":"Forecast","prompt":"Forecast assumptions should be justified by…","options":[{"id":"a","label":"Gut feel"},{"id":"b","label":"History, guidance and evidence"},{"id":"c","label":"The target price you want"},{"id":"d","label":"Social media sentiment"}],"points":25},
     {"id":"q3","type":"mcq","label":"Competition","prompt":"Competitive analysis should cover…","options":[{"id":"a","label":"Positioning, moat and market share"},{"id":"b","label":"Only the CEO's background"},{"id":"c","label":"Dividend history"},{"id":"d","label":"The share price chart"}],"points":25},
     {"id":"q4","type":"mcq","label":"Writing","prompt":"Good research writing…","options":[{"id":"a","label":"Builds suspense before the conclusion"},{"id":"b","label":"Leads with conclusions, supported by numbers"},{"id":"c","label":"Avoids numbers"},{"id":"d","label":"Uses long paragraphs with many ideas"}],"points":25}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":"b"},"q3":{"answer":"a"},"q4":{"answer":"b"}}$j$),
('portfolio-construction',
 $j$[{"id":"q1","type":"numeric","label":"Expected return","prompt":"70% at 10% expected return, 30% at 4%. Portfolio expected return (%)?","unit":"%","points":25},
     {"id":"q2","type":"numeric","label":"Sharpe","prompt":"Return 9%, risk-free 5%, volatility 16%. Sharpe ratio?","unit":"","points":25},
     {"id":"q3","type":"numeric","label":"Effective N","prompt":"Two positions at 50% / 50%. Effective number of positions (1/HHI)?","unit":"","points":25},
     {"id":"q4","type":"mcq","label":"Rebalancing","prompt":"The main purpose of rebalancing is to…","options":[{"id":"a","label":"Maximise turnover"},{"id":"b","label":"Restore the intended risk exposure"},{"id":"c","label":"Always buy the best performer"},{"id":"d","label":"Avoid all losses"}],"points":25}]$j$,
 $j${"q1":{"answer":8.2,"tolerance_pct":1},"q2":{"answer":0.25,"tolerance_pct":2},"q3":{"answer":2,"tolerance_pct":1},"q4":{"answer":"b"}}$j$),
('accretion-dilution',
 $j$[{"id":"q1","type":"numeric","label":"Pro forma EPS","prompt":"Acquirer NI ₱300m + target NI ₱50m; shares 100m + 25m new. Pro forma EPS (₱)?","unit":"₱","points":25},
     {"id":"q2","type":"mcq","label":"Rule of thumb","prompt":"An all-stock deal is accretive (pre-synergies) when…","options":[{"id":"a","label":"The target's P/E is lower than the acquirer's"},{"id":"b","label":"The target's P/E is higher"},{"id":"c","label":"The deal is large"},{"id":"d","label":"Interest rates are low"}],"points":25},
     {"id":"q3","type":"mcq","label":"Break-even","prompt":"Break-even synergies are…","options":[{"id":"a","label":"Synergies that make pro forma EPS equal standalone EPS"},{"id":"b","label":"The premium paid"},{"id":"c","label":"Synergies after 10 years"},{"id":"d","label":"Revenue synergies only"}],"points":25},
     {"id":"q4","type":"mcq","label":"Value creation","prompt":"Why can an accretive deal still destroy value?","options":[{"id":"a","label":"It can't"},{"id":"b","label":"Return on invested capital may be below the cost of capital (overpaying)"},{"id":"c","label":"EPS always predicts value"},{"id":"d","label":"Because of taxes only"}],"points":25}]$j$,
 $j${"q1":{"answer":2.8,"tolerance_pct":1},"q2":{"answer":"a"},"q3":{"answer":"a"},"q4":{"answer":"b"}}$j$),
('investment-committee-memo',
 $j$[{"id":"q1","type":"mcq","label":"Structure","prompt":"An IC memo should open with…","options":[{"id":"a","label":"The recommendation"},{"id":"b","label":"Company history"},{"id":"c","label":"Appendices"},{"id":"d","label":"Risks"}],"points":25},
     {"id":"q2","type":"mcq","label":"Decision rule","prompt":"A project should generally be approved when…","options":[{"id":"a","label":"NPV > 0 at the hurdle rate"},{"id":"b","label":"Revenue is large"},{"id":"c","label":"IRR is below WACC"},{"id":"d","label":"Payback exceeds the project life"}],"points":25},
     {"id":"q3","type":"numeric","label":"NPV","prompt":"Cost ₱100m, present value of inflows ₱112m. NPV (₱m)?","unit":"₱m","points":25},
     {"id":"q4","type":"mcq","label":"Break-even","prompt":"The break-even volume is where…","options":[{"id":"a","label":"NPV = 0"},{"id":"b","label":"Revenue = 0"},{"id":"c","label":"IRR = 100%"},{"id":"d","label":"Capex = 0"}],"points":25}]$j$,
 $j${"q1":{"answer":"a"},"q2":{"answer":"a"},"q3":{"answer":12,"tolerance_pct":1},"q4":{"answer":"a"}}$j$)
), upd as (
  update public.lessons l set check_questions = qs.questions::jsonb
  from qs where l.slug = qs.slug
  returning l.id, qs.answers
)
insert into public.lesson_check_keys (lesson_id, answers)
select id, answers::jsonb from upd
on conflict (lesson_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 3. New challenges (10) and certification exams (3)
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('accounting-cash-flow-build', 'Cash Flow Build: Davao Durian Exports',
 'Build CFO, free cash flow and the net change in cash from the indirect method.',
 $md$
**Davao Durian Exports** FY2025 (₱ millions):

| Item | Value |
|---|---|
| Net income | 150 |
| Depreciation & amortization | 40 |
| Increase in accounts receivable | 25 |
| Increase in inventory | 15 |
| Increase in accounts payable | 10 |
| Capital expenditure | 90 |
| Dividends paid | 30 |
| Debt repaid | 20 |
$md$, 'Answer in ₱ millions.', 'accounting', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"Cash flow math","weight":70},{"label":"Interpretation","weight":30}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 $j${"tasks":[
   {"id":"cfo","type":"numeric","label":"CFO","prompt":"Cash flow from operations (₱m)?","unit":"₱m","points":20},
   {"id":"fcf","type":"numeric","label":"Free cash flow","prompt":"Free cash flow (₱m)?","unit":"₱m","points":20},
   {"id":"net","type":"numeric","label":"Net change in cash","prompt":"Net change in cash for the year (₱m)?","unit":"₱m","points":20},
   {"id":"ap","type":"mcq","label":"Payables","prompt":"The ₱10m increase in payables…","options":[{"id":"a","label":"Reduced CFO"},{"id":"b","label":"Increased CFO"},{"id":"c","label":"Was an investing inflow"},{"id":"d","label":"Had no effect"}],"points":10},
   {"id":"why","type":"long_text","label":"Interpretation","prompt":"Is the company's cash generation healthy? Discuss the gap between net income and free cash flow.","min_words":50,"points":30}
 ]}$j$::jsonb, '{fundamentals,cash_flow}', true, now()),

('financial-analysis-credit-leverage', 'Credit Review: Luzon Cement Holdings',
 'Assess leverage, coverage and covenant headroom like a credit analyst.',
 $md$
**Luzon Cement Holdings** (₱ millions, FY2025):

| Item | Value |
|---|---|
| Total debt | 3,600 |
| Cash | 600 |
| EBITDA | 1,200 |
| EBIT | 900 |
| Interest expense | 300 |

The bank loan carries a covenant: **net debt / EBITDA ≤ 3.0x**.
$md$, 'Two decimals.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Credit metrics","weight":65},{"label":"Credit judgment","weight":35}]',
 '{"financial_analysis":1.0,"decision_making":0.6,"technical_knowledge":0.4}',
 $j${"tasks":[
   {"id":"lev","type":"numeric","label":"Net leverage","prompt":"Net debt / EBITDA (x)?","unit":"x","points":15},
   {"id":"cov1","type":"numeric","label":"EBITDA coverage","prompt":"EBITDA / interest (x)?","unit":"x","points":10},
   {"id":"cov2","type":"numeric","label":"EBIT coverage","prompt":"EBIT / interest (x)?","unit":"x","points":10},
   {"id":"head","type":"numeric","label":"Headroom","prompt":"By what % can EBITDA fall before the 3.0x covenant is breached (net debt unchanged)?","unit":"%","points":15},
   {"id":"risk","type":"mcq","label":"Biggest risk","prompt":"Construction demand drops and EBITDA falls 25%. What happens?","options":[{"id":"a","label":"Nothing — leverage is unaffected"},{"id":"b","label":"Net leverage rises to ~3.3x and breaches the covenant"},{"id":"c","label":"Interest expense falls"},{"id":"d","label":"Coverage improves"}],"points":15},
   {"id":"memo","type":"long_text","label":"Credit view","prompt":"Write a short credit view: would you extend another ₱500m loan? What conditions would you require?","min_words":70,"points":35}
 ]}$j$::jsonb, '{credit}', true, now()),

('valuation-bank-justified-pb', 'Bank Valuation: Justified P/B',
 'Value a Philippine bank using ROE, cost of equity and growth.',
 $md$
**Pacific Savings Bank**

| Input | Value |
|---|---|
| Sustainable ROE | 14% |
| Cost of equity | 11% |
| Long-term growth | 5% |
| Book value per share | ₱80 |
| Current price | ₱100 |

Justified P/B = (ROE − g) / (COE − g)
$md$, 'Two decimals. BUY ≥ +10%, SELL ≤ −10%.', 'valuation', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Valuation math","weight":65},{"label":"Judgment","weight":35}]',
 '{"valuation":1.0,"investment_judgment":0.4,"technical_knowledge":0.3}',
 $j${"tasks":[
   {"id":"pb","type":"numeric","label":"Justified P/B","prompt":"Justified P/B (x)?","unit":"x","points":20},
   {"id":"tp","type":"numeric","label":"Target price","prompt":"Target price (₱)?","unit":"₱","points":20},
   {"id":"up","type":"numeric","label":"Upside","prompt":"Upside (%)?","unit":"%","points":10},
   {"id":"rating","type":"mcq","label":"Rating","prompt":"Rating?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}],"points":15},
   {"id":"why","type":"long_text","label":"Sensitivity","prompt":"What happens to the justified P/B if ROE falls to the cost of equity? Why does this matter for banks?","min_words":50,"points":35}
 ]}$j$::jsonb, '{valuation_core}', true, now()),

('valuation-ev-ebitda-comps', 'EV/EBITDA Comparables: Cebu Pacific Logistics',
 'Value a business on enterprise value and bridge to equity per share.',
 $md$
**Cebu Pacific Logistics** (₱ millions):

| Input | Value |
|---|---|
| EBITDA (FY2026E) | 500 |
| Peer EV/EBITDA | 7x, 8x, 9x |
| Net debt | 1,000 |
| Shares outstanding | 100m |
| Current price | ₱25.00 |

Use the **median** peer multiple.
$md$, 'Two decimals.', 'valuation', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Valuation math","weight":65},{"label":"Method judgment","weight":35}]',
 '{"valuation":1.0,"financial_analysis":0.4,"investment_judgment":0.3}',
 $j${"tasks":[
   {"id":"ev","type":"numeric","label":"Enterprise value","prompt":"Implied enterprise value (₱m)?","unit":"₱m","points":15},
   {"id":"eq","type":"numeric","label":"Equity value","prompt":"Implied equity value (₱m)?","unit":"₱m","points":15},
   {"id":"tp","type":"numeric","label":"Value per share","prompt":"Value per share (₱)?","unit":"₱","points":20},
   {"id":"up","type":"numeric","label":"Upside","prompt":"Upside vs current price (%)?","unit":"%","points":15},
   {"id":"why","type":"long_text","label":"Method","prompt":"Why might EV/EBITDA be better than P/E for comparing logistics companies?","min_words":50,"points":35}
 ]}$j$::jsonb, '{valuation_core}', true, now()),

('valuation-wacc-build', 'WACC Build: Manila Water Works',
 'Build a weighted average cost of capital from CAPM and debt costs.',
 $md$
**Manila Water Works**

| Input | Value |
|---|---|
| Risk-free rate | 6% |
| Equity beta | 1.1 |
| Market risk premium | 6% |
| Pre-tax cost of debt | 7% |
| Tax rate | 25% |
| Target debt / (debt + equity) | 30% |
$md$, 'Two decimals.', 'valuation', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"WACC math","weight":70},{"label":"Concepts","weight":30}]',
 '{"valuation":0.8,"technical_knowledge":1.0}',
 $j${"tasks":[
   {"id":"ke","type":"numeric","label":"Cost of equity","prompt":"Cost of equity (%)?","unit":"%","points":20},
   {"id":"kd","type":"numeric","label":"After-tax cost of debt","prompt":"After-tax cost of debt (%)?","unit":"%","points":15},
   {"id":"wacc","type":"numeric","label":"WACC","prompt":"WACC (%)?","unit":"%","points":25},
   {"id":"lev","type":"mcq","label":"Leverage","prompt":"Raising debt to 60% of capital (ignoring distress risk) would mechanically…","options":[{"id":"a","label":"Raise WACC, because debt is riskier"},{"id":"b","label":"Lower WACC, because after-tax debt is cheaper than equity"},{"id":"c","label":"Leave WACC unchanged"},{"id":"d","label":"Make WACC negative"}],"points":10},
   {"id":"why","type":"long_text","label":"Caveat","prompt":"Why can't a company keep lowering its WACC by adding more debt?","min_words":40,"points":30}
 ]}$j$::jsonb, '{wacc}', true, now()),

('equity-research-reit-yield', 'REIT Valuation: Metro Office REIT',
 'Value a REIT on distributions and dividend yield.',
 $md$
**Metro Office REIT**

| Input | Value |
|---|---|
| Distributable income per unit | ₱2.40 |
| Payout ratio | 95% |
| Target dividend yield | 6.0% |
| Current price | ₱34.00 |
$md$, 'Two decimals.', 'equity_research', 'tasks', null, 'intermediate', 20, 100, 60, 'auto',
 '[{"label":"Yield math","weight":65},{"label":"Rate sensitivity","weight":35}]',
 '{"valuation":0.8,"investment_judgment":0.6,"financial_analysis":0.4}',
 $j${"tasks":[
   {"id":"dpu","type":"numeric","label":"Dividend per unit","prompt":"Expected dividend per unit (₱)?","unit":"₱","points":15},
   {"id":"tp","type":"numeric","label":"Target price","prompt":"Target price at a 6.0% yield (₱)?","unit":"₱","points":20},
   {"id":"yield","type":"numeric","label":"Current yield","prompt":"Dividend yield at the current price (%)?","unit":"%","points":15},
   {"id":"up","type":"numeric","label":"Upside","prompt":"Upside to target (%)?","unit":"%","points":15},
   {"id":"rates","type":"long_text","label":"Rates","prompt":"How would a rise in Philippine government bond yields affect this REIT's valuation? What would you monitor?","min_words":50,"points":35}
 ]}$j$::jsonb, '{reit}', true, now()),

('equity-research-earnings-quality', 'Earnings Quality Check: Northstar Retail',
 'Spot a working-capital red flag behind strong revenue growth.',
 $md$
**Northstar Retail** (₱ millions, 365-day year):

| Item | FY2024 | FY2025 |
|---|---|---|
| Revenue | 1,000 | 1,200 |
| Accounts receivable | 120 | 174 |
| Net income | 80 | 98 |
| Cash flow from operations | 85 | 62 |
$md$, 'Two decimals.', 'equity_research', 'tasks', null, 'intermediate', 20, 100, 60, 'auto',
 '[{"label":"Analysis","weight":60},{"label":"Research note","weight":40}]',
 '{"financial_analysis":1.0,"investment_judgment":0.6,"communication":0.4}',
 $j${"tasks":[
   {"id":"dso24","type":"numeric","label":"DSO FY2024","prompt":"Days sales outstanding FY2024?","unit":"days","points":10},
   {"id":"dso25","type":"numeric","label":"DSO FY2025","prompt":"Days sales outstanding FY2025?","unit":"days","points":10},
   {"id":"arg","type":"numeric","label":"Receivables growth","prompt":"Receivables growth (%)?","unit":"%","points":10},
   {"id":"flag","type":"mcq","label":"Red flag","prompt":"What is the biggest warning sign?","options":[{"id":"a","label":"Revenue grew 20%"},{"id":"b","label":"Net income rose while operating cash flow fell, as receivables outgrew sales"},{"id":"c","label":"The company is profitable"},{"id":"d","label":"Receivables exist"}],"points":20},
   {"id":"note","type":"long_text","label":"Note","prompt":"Write a short note to your PM explaining the earnings-quality concern and what you would ask management.","min_words":70,"points":50}
 ]}$j$::jsonb, '{earnings_quality}', true, now()),

('portfolio-risk-diversification', 'Portfolio Risk: Diversification & CAPM',
 'Two-asset volatility, portfolio beta and CAPM expected return.',
 $md$
A portfolio holds two assets:

| | Weight | Volatility | Beta |
|---|---|---|---|
| Asset A (PH equities) | 50% | 20% | 1.2 |
| Asset B (PH bonds) | 50% | 10% | — |

Correlation between A and B: **0.2**.

For the CAPM part, use a **60% / 40%** mix of two stocks with betas **1.2** and **0.8**, a risk-free rate of **6%** and a market risk premium of **5.5%**.
$md$, 'Two decimals.', 'portfolio_management', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Risk math","weight":60},{"label":"Judgment","weight":40}]',
 '{"investment_judgment":0.8,"technical_knowledge":0.8,"decision_making":0.5}',
 $j${"tasks":[
   {"id":"vol","type":"numeric","label":"Portfolio volatility","prompt":"Volatility of the 50/50 A/B portfolio (%)?","unit":"%","points":20},
   {"id":"beta","type":"numeric","label":"Portfolio beta","prompt":"Beta of the 60/40 stock mix?","points":15},
   {"id":"capm","type":"numeric","label":"CAPM return","prompt":"CAPM expected return of that mix (%)?","unit":"%","points":15},
   {"id":"corr","type":"mcq","label":"Correlation","prompt":"If correlation fell from 0.2 to −0.2, portfolio volatility would…","options":[{"id":"a","label":"Rise"},{"id":"b","label":"Fall"},{"id":"c","label":"Stay the same"},{"id":"d","label":"Become zero"}],"points":15},
   {"id":"note","type":"long_text","label":"Client note","prompt":"Explain to a client why the 50/50 portfolio is less volatile than the average of the two assets' volatilities.","min_words":50,"points":35}
 ]}$j$::jsonb, '{portfolio}', true, now()),

('ib-ipo-pricing', 'IPO Pricing: Mabuhay Fintech',
 'Price an IPO from comparables, apply a discount, and size the dilution.',
 $md$
**Mabuhay Fintech** is listing on the PSE.

| Input | Value |
|---|---|
| Net income (FY2026E) | ₱200m |
| Peer P/E | 15x |
| IPO discount to fair value | 15% |
| Pre-IPO shares | 100m |
| Primary capital to raise | ₱450m |
$md$, 'Two decimals.', 'investment_banking', 'tasks', null, 'advanced', 30, 120, 60, 'auto',
 '[{"label":"Deal math","weight":65},{"label":"Judgment","weight":35}]',
 '{"valuation":0.8,"technical_knowledge":0.6,"decision_making":0.5,"communication":0.3}',
 $j${"tasks":[
   {"id":"fv","type":"numeric","label":"Fair equity value","prompt":"Fair pre-money equity value (₱m)?","unit":"₱m","points":15},
   {"id":"disc","type":"numeric","label":"IPO equity value","prompt":"Pre-money value after the IPO discount (₱m)?","unit":"₱m","points":15},
   {"id":"price","type":"numeric","label":"IPO price","prompt":"IPO price per share (₱)?","unit":"₱","points":15},
   {"id":"new","type":"numeric","label":"New shares","prompt":"New shares issued (millions)?","unit":"m","points":10},
   {"id":"dil","type":"numeric","label":"Dilution","prompt":"Dilution to existing holders (% of post-IPO shares)?","unit":"%","points":10},
   {"id":"why","type":"long_text","label":"Discount","prompt":"Why do IPOs usually price at a discount to fair value? Who benefits and who pays?","min_words":60,"points":35}
 ]}$j$::jsonb, '{ipo,deal_math}', true, now()),

('case-market-sizing-coffee', 'Market Sizing: Philippine Specialty Coffee',
 'Size a market top-down and defend your assumptions to an investment committee.',
 $md$
A VC fund asks: **how big is the Philippine specialty coffee market?**

Use these starting assumptions:
- Population **115 million**, of which **50%** urban
- **60%** of urban residents are adults in the target age band
- **20%** of them buy specialty coffee **once a week**
- Average ticket **₱150**
$md$, 'Show the market in ₱ billions to two decimals.', 'case_competition', 'tasks', null, 'intermediate', 25, 100, 60, 'hybrid',
 '[{"label":"Sizing math","weight":50},{"label":"Assumption defense","weight":50}]',
 '{"decision_making":1.0,"communication":0.6,"leadership":0.4,"investment_judgment":0.4}',
 $j${"tasks":[
   {"id":"adults","type":"numeric","label":"Target adults","prompt":"Urban adults in the target band (millions)?","unit":"m","points":10},
   {"id":"buyers","type":"numeric","label":"Weekly buyers","prompt":"Weekly specialty-coffee buyers (millions)?","unit":"m","points":10},
   {"id":"market","type":"numeric","label":"Market size","prompt":"Annual market size (₱ billions)?","unit":"₱bn","points":20},
   {"id":"method","type":"mcq","label":"Cross-check","prompt":"The best way to cross-check a top-down estimate is…","options":[{"id":"a","label":"Bottom-up: number of cafés × cups per day × price × days"},{"id":"b","label":"Ask friends"},{"id":"c","label":"Double the number"},{"id":"d","label":"No cross-check needed"}],"points":10},
   {"id":"defend","type":"long_text","label":"Defense","prompt":"Which assumption is weakest? How would you test it and how sensitive is the answer to it?","min_words":80,"points":50}
 ]}$j$::jsonb, '{market_sizing}', true, now()),

-- Certification exams --------------------------------------------------
('exam-financial-statements', 'Final Exam: Certified Financial Statement Analyst',
 'Timed comprehensive exam: statements, cash flow, ratios and earnings quality.',
 $md$
**Manila Bay Foods** FY2025 (₱ millions):

| Income statement | | Balance sheet / other | |
|---|---|---|---|
| Revenue | 2,000 | Receivables (begin → end) | 180 → 220 |
| COGS | 1,300 | Inventory (begin → end) | 150 → 170 |
| Operating expenses (incl. D&A 60) | 400 | Payables (begin → end) | 120 → 140 |
| Interest expense | 40 | Capex | 90 |
| Tax rate | 25% | Equity (begin → end) | 900 → 1,000 |
| | | Current assets / liabilities | 800 / 500 |
$md$, 'You have 60 minutes. Two decimals. Pass mark 70.', 'accounting', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Statement math","weight":64},{"label":"Judgment","weight":36}]',
 '{"technical_knowledge":1.0,"financial_analysis":1.0,"communication":0.3}',
 $j${"tasks":[
   {"id":"gm","type":"numeric","label":"Gross margin","prompt":"Gross margin (%)?","unit":"%","points":8},
   {"id":"ebitm","type":"numeric","label":"EBIT margin","prompt":"EBIT margin (%)?","unit":"%","points":8},
   {"id":"ni","type":"numeric","label":"Net income","prompt":"Net income (₱m)?","unit":"₱m","points":10},
   {"id":"cfo","type":"numeric","label":"CFO","prompt":"Cash flow from operations (₱m)?","unit":"₱m","points":14},
   {"id":"fcf","type":"numeric","label":"FCF","prompt":"Free cash flow (₱m)?","unit":"₱m","points":10},
   {"id":"roe","type":"numeric","label":"ROE","prompt":"ROE on average equity (%)?","unit":"%","points":10},
   {"id":"cr","type":"numeric","label":"Current ratio","prompt":"Current ratio (x)?","unit":"x","points":6},
   {"id":"dso","type":"numeric","label":"DSO","prompt":"DSO on ending receivables (days, 365-day year)?","unit":"days","points":8},
   {"id":"flag","type":"mcq","label":"Earnings quality","prompt":"Which pattern would most concern you about earnings quality?","options":[{"id":"a","label":"CFO consistently above net income"},{"id":"b","label":"Receivables growing much faster than revenue"},{"id":"c","label":"Stable gross margins"},{"id":"d","label":"Falling capex as a project completes"}],"points":8},
   {"id":"assess","type":"long_text","label":"Assessment","prompt":"Assess Manila Bay Foods' profitability, cash conversion and returns in a short analyst note.","min_words":80,"points":18}
 ]}$j$::jsonb, '{certification_exam}', true, now()),

('exam-equity-valuation', 'Final Exam: Certified Equity Valuation Analyst',
 'Timed comprehensive exam: multiples, justified P/B, WACC, DCF and a blended target.',
 $md$
**Visayas Telecom** — current price **₱50.00**, 100m shares, net debt ₱1,500m.

| Input | Value |
|---|---|
| EPS (FY2026E) | ₱5.00 |
| Peer P/E | 10x, 12x, 14x (use median) |
| Book value per share | ₱40 |
| ROE / cost of equity / growth (for P/B) | 15% / 11% / 4% |
| Risk-free / beta / MRP | 6% / 1.2 / 6% |
| Pre-tax cost of debt / tax | 8% / 25% |
| Capital weights | 60% equity / 40% debt |
| Next-year FCFF, perpetual growth | ₱400m, 4% |
| EBITDA / peer EV/EBITDA | ₱900m / 7.5x |
$md$, 'You have 60 minutes. Two decimals. Use your WACC for the DCF. Pass mark 70.', 'valuation', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 '[{"label":"Valuation math","weight":76},{"label":"Judgment","weight":24}]',
 '{"valuation":1.0,"financial_analysis":0.6,"investment_judgment":0.6,"technical_knowledge":0.4}',
 $j${"tasks":[
   {"id":"pe","type":"numeric","label":"P/E target","prompt":"Target price from P/E (₱)?","unit":"₱","points":8},
   {"id":"pb","type":"numeric","label":"Justified P/B target","prompt":"Target price from justified P/B (₱)?","unit":"₱","points":10},
   {"id":"wacc","type":"numeric","label":"WACC","prompt":"WACC (%)?","unit":"%","points":10},
   {"id":"dcf","type":"numeric","label":"DCF value per share","prompt":"DCF equity value per share (₱)?","unit":"₱","points":14},
   {"id":"ev","type":"numeric","label":"EV/EBITDA target","prompt":"Value per share from EV/EBITDA (₱)?","unit":"₱","points":10},
   {"id":"blend","type":"numeric","label":"Blended target","prompt":"Equal-weighted average of the four values (₱)?","unit":"₱","points":8},
   {"id":"up","type":"numeric","label":"Upside","prompt":"Upside to the blended target (%)?","unit":"%","points":8},
   {"id":"rating","type":"mcq","label":"Rating","prompt":"Rating (BUY ≥ +10%, SELL ≤ −10%)?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}],"points":8},
   {"id":"judge","type":"long_text","label":"Method judgment","prompt":"Which of the four methods do you trust most for this company, and how would you present the uncertainty?","min_words":80,"points":24}
 ]}$j$::jsonb, '{certification_exam}', true, now()),

('exam-research-pitching', 'Final Exam: Certified Equity Research Associate',
 'Timed exam: earnings analysis, rating discipline and writing an investment thesis.',
 $md$
**Luzon Consumer Brands** reported quarterly results:

| Metric | Actual | Consensus |
|---|---|---|
| Revenue (₱bn) | 10.5 | 10.0 |
| EPS (₱) | 1.32 | 1.20 |

Your 12-month target price is **₱84** and the stock trades at **₱70**.
$md$, 'You have 45 minutes. Pass mark 70.', 'equity_research', 'tasks', null, 'advanced', 45, 300, 70, 'auto',
 '[{"label":"Analysis","weight":58},{"label":"Thesis writing","weight":42}]',
 '{"investment_judgment":1.0,"communication":1.0,"financial_analysis":0.5}',
 $j${"tasks":[
   {"id":"eps","type":"numeric","label":"EPS surprise","prompt":"EPS surprise vs consensus (%)?","unit":"%","points":10},
   {"id":"rev","type":"numeric","label":"Revenue surprise","prompt":"Revenue surprise vs consensus (%)?","unit":"%","points":10},
   {"id":"up","type":"numeric","label":"Upside","prompt":"Upside to your target (%)?","unit":"%","points":10},
   {"id":"rating","type":"mcq","label":"Rating","prompt":"Rating under the ±10% convention?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}],"points":8},
   {"id":"vp","type":"mcq","label":"Variant perception","prompt":"Which statement is a variant perception?","options":[{"id":"a","label":"\"The company is a market leader.\""},{"id":"b","label":"\"Consensus models flat margins; we expect +150bp from the new plant, which the market isn't pricing.\""},{"id":"c","label":"\"The stock has done well this year.\""},{"id":"d","label":"\"Management is experienced.\""}],"points":10},
   {"id":"cat","type":"mcq","label":"Catalyst","prompt":"Which is the best catalyst for the thesis?","options":[{"id":"a","label":"\"Strong brand equity\""},{"id":"b","label":"\"Q4 results in February should confirm the margin expansion\""},{"id":"c","label":"\"Cheap valuation\""},{"id":"d","label":"\"Good dividend\""}],"points":10},
   {"id":"thesis","type":"long_text","label":"Investment thesis","prompt":"Write the investment thesis paragraph for your note: rating, target, why the market is wrong, catalyst, key risk and valuation basis.","min_words":120,"points":42}
 ]}$j$::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug in ('exam-financial-statements', 'exam-equity-valuation');
update public.challenges set time_limit_minutes = 45, max_attempts = 3 where slug = 'exam-research-pitching';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('accounting-cash-flow-build', $j${"cfo":{"answer":160,"tolerance_pct":0.5},"fcf":{"answer":70,"tolerance_pct":0.5},"net":{"answer":20,"tolerance_pct":0.5},"ap":{"answer":"b"},
   "why":{"keywords":["free cash flow|fcf","capex|capital expenditure|investment","receivable|inventory|working capital","dividend|debt|financing"],"keywords_required":3}}$j$),
 ('financial-analysis-credit-leverage', $j${"lev":{"answer":2.5,"tolerance_pct":1},"cov1":{"answer":4,"tolerance_pct":1},"cov2":{"answer":3,"tolerance_pct":1},"head":{"answer":16.67,"tolerance_pct":2},"risk":{"answer":"b"},
   "memo":{"keywords":["leverage|net debt","covenant|headroom","coverage|interest","cyclical|demand|construction|downside","condition|collateral|security|amortiz|tighter"],"keywords_required":4}}$j$),
 ('valuation-bank-justified-pb', $j${"pb":{"answer":1.5,"tolerance_pct":1},"tp":{"answer":120,"tolerance_pct":1},"up":{"answer":20,"tolerance_pct":1},"rating":{"answer":"buy"},
   "why":{"keywords":["roe|return on equity","cost of equity|coe","1.0|1x|book value|one times","value creat|destroy|excess return|spread"],"keywords_required":3}}$j$),
 ('valuation-ev-ebitda-comps', $j${"ev":{"answer":4000,"tolerance_pct":0.5},"eq":{"answer":3000,"tolerance_pct":0.5},"tp":{"answer":30,"tolerance_pct":1},"up":{"answer":20,"tolerance_pct":1},
   "why":{"keywords":["capital structure|leverage|debt","depreciation|d&a|amortization","enterprise value|ev","tax|interest|accounting"],"keywords_required":3}}$j$),
 ('valuation-wacc-build', $j${"ke":{"answer":12.6,"tolerance_pct":1},"kd":{"answer":5.25,"tolerance_pct":1},"wacc":{"answer":10.4,"tolerance_pct":1},"lev":{"answer":"b"},
   "why":{"keywords":["distress|bankruptcy|default","cost of equity|beta|risk","cost of debt|interest rate|spread","optimal|trade-off|tradeoff|balance"],"keywords_required":3}}$j$),
 ('equity-research-reit-yield', $j${"dpu":{"answer":2.28,"tolerance_pct":1},"tp":{"answer":38,"tolerance_pct":1},"yield":{"answer":6.71,"tolerance_pct":1.5},"up":{"answer":11.76,"tolerance_pct":2},
   "rates":{"keywords":["bond yield|interest rate|government","spread|premium","price|valuation|cap rate","occupancy|rental|lease|tenant"],"keywords_required":3}}$j$),
 ('equity-research-earnings-quality', $j${"dso24":{"answer":43.8,"tolerance_pct":1},"dso25":{"answer":52.93,"tolerance_pct":1},"arg":{"answer":45,"tolerance_pct":1},"flag":{"answer":"b"},
   "note":{"keywords":["receivable|dso","cash flow|cfo|operating cash","revenue recognition|channel|credit terms|collection","management|ask|question"],"keywords_required":3}}$j$),
 ('portfolio-risk-diversification', $j${"vol":{"answer":12.04,"tolerance_pct":1},"beta":{"answer":1.04,"tolerance_pct":1},"capm":{"answer":11.72,"tolerance_pct":1},"corr":{"answer":"b"},
   "note":{"keywords":["correlation","diversif","volatility|risk","offset|move together|not perfectly"],"keywords_required":3}}$j$),
 ('ib-ipo-pricing', $j${"fv":{"answer":3000,"tolerance_pct":0.5},"disc":{"answer":2550,"tolerance_pct":0.5},"price":{"answer":25.5,"tolerance_pct":1},"new":{"answer":17.65,"tolerance_pct":1},"dil":{"answer":15,"tolerance_pct":1.5},
   "why":{"keywords":["investor|demand|book","uncertain|information|risk","first-day|aftermarket|pop|performance","existing shareholder|founder|issuer|dilution|money on the table"],"keywords_required":3}}$j$),
 ('case-market-sizing-coffee', $j${"adults":{"answer":34.5,"tolerance_pct":1},"buyers":{"answer":6.9,"tolerance_pct":1},"market":{"answer":53.82,"tolerance_pct":1.5},"method":{"answer":"a"},
   "defend":{"keywords":["assumption","20%|frequency|weekly|penetration","survey|data|test|validate","sensitiv|range|scenario","bottom-up|cafe|café|store"],"keywords_required":4}}$j$),
 ('exam-financial-statements', $j${"gm":{"answer":35,"tolerance_pct":1},"ebitm":{"answer":15,"tolerance_pct":1},"ni":{"answer":195,"tolerance_pct":0.5},"cfo":{"answer":215,"tolerance_pct":0.5},"fcf":{"answer":125,"tolerance_pct":0.5},
   "roe":{"answer":20.53,"tolerance_pct":1},"cr":{"answer":1.6,"tolerance_pct":1},"dso":{"answer":40.15,"tolerance_pct":1},"flag":{"answer":"b"},
   "assess":{"keywords":["margin","cash flow|cfo|free cash","receivable|working capital|dso","roe|return on equity","leverage|liquidity|current ratio"],"keywords_required":4}}$j$),
 ('exam-equity-valuation', $j${"pe":{"answer":60,"tolerance_pct":0.5},"pb":{"answer":62.86,"tolerance_pct":1},"wacc":{"answer":10.32,"tolerance_pct":1},"dcf":{"answer":48.29,"tolerance_pct":2},"ev":{"answer":52.5,"tolerance_pct":1},
   "blend":{"answer":55.91,"tolerance_pct":1.5},"up":{"answer":11.82,"tolerance_pct":3},"rating":{"answer":"buy"},
   "judge":{"keywords":["dcf|discounted","multiple|comparable|peer","wacc|discount rate","terminal|growth|perpetu","sensitiv|range|scenario"],"keywords_required":4}}$j$),
 ('exam-research-pitching', $j${"eps":{"answer":10,"tolerance_pct":1},"rev":{"answer":5,"tolerance_pct":1},"up":{"answer":20,"tolerance_pct":1},"rating":{"answer":"buy"},"vp":{"answer":"b"},"cat":{"answer":"b"},
   "thesis":{"keywords":["buy|rating","target|upside|84","catalyst|results|q4","risk","valuation|p/e|multiple|dcf","consensus|market|priced"],"keywords_required":5}}$j$)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 4. Certification programs and learning tracks
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('financial-statement-analyst', 'certification', 'Financial Statement Analyst',
 'Read, build and diagnose the three statements like a professional.',
 $md$
A hands-on certification covering the full statement workflow: income statement, balance sheet and cash flow linkages, working capital, ratio diagnostics, credit metrics and forecasting.

**How it works**
1. Pass each lesson's knowledge check.
2. Pass every hands-on challenge.
3. Unlock and pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).

Your verifiable certificate is issued automatically the moment you pass.
$md$, 'accounting', 'intermediate', 4.0, 'Certified Financial Statement Analyst', true, 1),
('equity-valuation-analyst', 'certification', 'Equity Valuation Analyst',
 'Value companies with multiples, cost of capital and DCF.',
 $md$
From P/E and P/B to justified multiples, EV/EBITDA, WACC and a full DCF — then a timed exam that blends them into one defensible target price.

1. Pass each lesson's knowledge check.
2. Pass every valuation challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
$md$, 'valuation', 'intermediate', 4.0, 'Certified Equity Valuation Analyst', true, 2),
('equity-research-associate', 'certification', 'Equity Research Associate',
 'Analyze results, spot red flags, value income stocks and pitch ideas.',
 $md$
The research analyst's workflow: report structure, earnings notes, earnings-quality checks, REIT valuation and a stock pitch — capped by a timed exam where you write a full investment thesis.

1. Pass each lesson's knowledge check.
2. Pass every research challenge, including a stock pitch.
3. Pass the **timed final exam** (45 minutes, 70% to pass, 3 attempts).
$md$, 'equity_research', 'advanced', 4.5, 'Certified Equity Research Associate', true, 3),
('track-accounting-foundations', 'track', 'Accounting Foundations',
 'The three statements and the cash flow build.', 'A short track: two lessons and two hands-on challenges.',
 'accounting', 'beginner', 1.5, 'Track Certificate — Accounting Foundations', true, 10),
('track-portfolio-management', 'track', 'Portfolio Management Essentials',
 'Allocation, diversification, risk and CAPM.', 'One lesson and two portfolio challenges.',
 'portfolio_management', 'intermediate', 1.5, 'Track Certificate — Portfolio Management Essentials', true, 11),
('track-deal-analysis', 'track', 'Deal Analysis',
 'M&A accretion/dilution and IPO pricing.', 'One lesson and two investment banking challenges.',
 'investment_banking', 'advanced', 1.5, 'Track Certificate — Deal Analysis', true, 12),
('track-investment-committee', 'track', 'Investment Committee',
 'Size markets, run the numbers and defend a decision.', 'One lesson and two committee-style cases.',
 'case_competition', 'advanced', 2.0, 'Track Certificate — Investment Committee', true, 13)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind <> 'lesson' then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('financial-statement-analyst', 1, 'lesson', 'three-statements', null::numeric),
  ('financial-statement-analyst', 2, 'challenge', 'accounting-three-statements', null),
  ('financial-statement-analyst', 3, 'lesson', 'cash-flow-statement', null),
  ('financial-statement-analyst', 4, 'challenge', 'accounting-cash-flow-build', null),
  ('financial-statement-analyst', 5, 'challenge', 'accounting-working-capital', null),
  ('financial-statement-analyst', 6, 'lesson', 'ratio-analysis', null),
  ('financial-statement-analyst', 7, 'challenge', 'financial-analysis-ratio-diagnostics', null),
  ('financial-statement-analyst', 8, 'lesson', 'credit-analysis', null),
  ('financial-statement-analyst', 9, 'challenge', 'financial-analysis-credit-leverage', null),
  ('financial-statement-analyst', 10, 'challenge', 'financial-analysis-forecast-build', null),
  ('financial-statement-analyst', 11, 'exam', 'exam-financial-statements', 70),

  ('equity-valuation-analyst', 1, 'lesson', 'valuation-multiples', null),
  ('equity-valuation-analyst', 2, 'challenge', 'valuation-multiples-pe-pb', null),
  ('equity-valuation-analyst', 3, 'challenge', 'valuation-bank-justified-pb', null),
  ('equity-valuation-analyst', 4, 'challenge', 'valuation-ev-ebitda-comps', null),
  ('equity-valuation-analyst', 5, 'lesson', 'cost-of-capital', null),
  ('equity-valuation-analyst', 6, 'challenge', 'valuation-wacc-build', null),
  ('equity-valuation-analyst', 7, 'lesson', 'dcf-fundamentals', null),
  ('equity-valuation-analyst', 8, 'challenge', 'valuation-dcf-simplified', null),
  ('equity-valuation-analyst', 9, 'exam', 'exam-equity-valuation', 70),

  ('equity-research-associate', 1, 'lesson', 'equity-research-report', null),
  ('equity-research-associate', 2, 'challenge', 'equity-research-earnings-note', null),
  ('equity-research-associate', 3, 'challenge', 'equity-research-earnings-quality', null),
  ('equity-research-associate', 4, 'challenge', 'equity-research-reit-yield', null),
  ('equity-research-associate', 5, 'lesson', 'stock-pitch-structure', null),
  ('equity-research-associate', 6, 'challenge', 'stock-pitch-quick-open', null),
  ('equity-research-associate', 7, 'exam', 'exam-research-pitching', 70),

  ('track-accounting-foundations', 1, 'lesson', 'three-statements', null),
  ('track-accounting-foundations', 2, 'challenge', 'accounting-three-statements', null),
  ('track-accounting-foundations', 3, 'lesson', 'cash-flow-statement', null),
  ('track-accounting-foundations', 4, 'challenge', 'accounting-cash-flow-build', null),

  ('track-portfolio-management', 1, 'lesson', 'portfolio-construction', null),
  ('track-portfolio-management', 2, 'challenge', 'portfolio-construction-basics', null),
  ('track-portfolio-management', 3, 'challenge', 'portfolio-risk-diversification', null),

  ('track-deal-analysis', 1, 'lesson', 'accretion-dilution', null),
  ('track-deal-analysis', 2, 'challenge', 'ib-accretion-dilution', null),
  ('track-deal-analysis', 3, 'challenge', 'ib-ipo-pricing', null),

  ('track-investment-committee', 1, 'lesson', 'investment-committee-memo', null),
  ('track-investment-committee', 2, 'challenge', 'case-market-sizing-coffee', null),
  ('track-investment-committee', 3, 'challenge', 'case-investment-committee-expansion', null)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;

-- Lessons now link to the new challenges where relevant.
update public.lessons set related_challenge_slugs = '{accounting-three-statements,accounting-cash-flow-build,accounting-working-capital}' where slug = 'three-statements';
update public.lessons set related_challenge_slugs = '{valuation-multiples-pe-pb,valuation-bank-justified-pb,valuation-ev-ebitda-comps}' where slug = 'valuation-multiples';
update public.lessons set related_challenge_slugs = '{equity-research-initiation,equity-research-earnings-note,equity-research-earnings-quality,equity-research-reit-yield}' where slug = 'equity-research-report';
update public.lessons set related_challenge_slugs = '{portfolio-construction-basics,portfolio-risk-diversification}' where slug = 'portfolio-construction';
update public.lessons set related_challenge_slugs = '{ib-accretion-dilution,ib-ipo-pricing}' where slug = 'accretion-dilution';
update public.lessons set related_challenge_slugs = '{case-investment-committee-expansion,case-market-sizing-coffee,promotion-assessment-associate}' where slug = 'investment-committee-memo';
