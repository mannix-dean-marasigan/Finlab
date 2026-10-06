-- =====================================================================
-- FINLAB — Seed data (reference data + Phase 1 content)
-- Safe to run once on a fresh database after the migrations.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Career ladder
-- ---------------------------------------------------------------------
insert into public.career_levels (id, rank, slug, name, description) values
 (1, 1, 'junior_analyst', 'Junior Analyst', 'Learning the tools of the trade: statements, ratios and first valuations.'),
 (2, 2, 'analyst', 'Analyst', 'Produces reliable analysis and defensible valuations on their own.'),
 (3, 3, 'associate', 'Associate', 'Builds full models, writes research and pitches to an investment committee.'),
 (4, 4, 'vice_president', 'Vice President', 'Owns coverage, leads competition teams and mentors analysts.'),
 (5, 5, 'director', 'Director', 'Consistently top-ranked judgment across research, pitching and portfolios.'),
 (6, 6, 'managing_director', 'Managing Director', 'A proven, competition-winning track record across the full finance workflow.');

-- ---------------------------------------------------------------------
-- Specializations
-- ---------------------------------------------------------------------
insert into public.specializations (id, name, description, icon, sort_order) values
 ('equity_research', 'Equity Research', 'Analyze listed companies, build forecasts and publish ratings.', 'file-search', 1),
 ('asset_management', 'Asset Management', 'Construct and manage portfolios against a mandate.', 'pie-chart', 2),
 ('investment_banking', 'Investment Banking', 'Advise on M&A, capital raising and transaction valuation.', 'landmark', 3),
 ('corporate_finance', 'Corporate Finance', 'Allocate capital, plan and evaluate projects inside a company.', 'building-2', 4),
 ('venture_capital', 'Venture Capital', 'Source, evaluate and back early-stage companies.', 'rocket', 5);

-- ---------------------------------------------------------------------
-- Skills and FINLAB Score weights (sum = 100)
-- ---------------------------------------------------------------------
insert into public.skills (id, name, description, weight, sort_order) values
 ('technical_knowledge', 'Technical Knowledge', 'Accounting, finance theory and the mechanics of the tools.', 20, 1),
 ('financial_analysis', 'Financial Analysis', 'Reading statements, computing ratios and diagnosing performance.', 20, 2),
 ('valuation', 'Valuation', 'Multiples, DCF and arriving at a defensible target price.', 15, 3),
 ('investment_judgment', 'Investment Judgment', 'Forming a differentiated, well-supported investment view.', 20, 4),
 ('communication', 'Communication', 'Clear, structured, concise written and verbal arguments.', 10, 5),
 ('decision_making', 'Decision-Making', 'Weighing risks, scenarios and trade-offs to reach a decision.', 10, 6),
 ('leadership', 'Leadership', 'Owning outcomes in competitions and committee settings.', 5, 7);

-- ---------------------------------------------------------------------
-- Challenge categories
-- ---------------------------------------------------------------------
insert into public.challenge_categories (id, name, description, icon, sort_order) values
 ('accounting', 'Accounting', 'The three statements, accruals and working capital.', 'book-open', 1),
 ('financial_analysis', 'Financial Analysis', 'Ratios, trends, forecasting and diagnostics.', 'line-chart', 2),
 ('valuation', 'Valuation', 'Multiples, DCF and target prices.', 'calculator', 3),
 ('equity_research', 'Equity Research', 'Research notes, earnings and initiation reports.', 'file-search', 4),
 ('stock_pitch', 'Stock Pitch', 'Quick and professional stock pitches.', 'presentation', 5),
 ('portfolio_management', 'Portfolio Management', 'Allocation, risk and rebalancing.', 'pie-chart', 6),
 ('investment_banking', 'Investment Banking', 'M&A math, accretion/dilution and deal judgment.', 'landmark', 7),
 ('case_competition', 'Case Competition', 'Investment committee cases and promotion assessments.', 'trophy', 8);

-- ---------------------------------------------------------------------
-- Scoring configuration (editable by admins; run admin_recalculate_all after changes)
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value, description) values
 ('skill_confidence_threshold', '2', 'Evidence weight needed before a skill score counts at full value.'),
 ('portfolio_starting_capital', '10000000', 'Virtual starting capital (PHP) for new simulated portfolios.'),
 ('submission_grace_minutes', '5', 'Grace period after a deadline before submissions are rejected.');

insert into public.scoring_rubrics (id, name, description, criteria, config) values
('stock_pitch_v1', 'Stock Pitch Rubric v1',
 'Deterministic beta rubric. Measures completeness, internal consistency, quantitative support and structure — not whether the call is right.',
 '[
   {"key":"thesis","label":"Thesis","weight":20,"skill_id":"investment_judgment","description":"Clear, specific, quantified thesis (and variant perception for professional pitches)."},
   {"key":"financial_analysis","label":"Financial Analysis","weight":20,"skill_id":"financial_analysis","description":"Use of numbers, financial analysis and forecast depth."},
   {"key":"valuation","label":"Valuation","weight":20,"skill_id":"valuation","description":"Target price present, consistent with the rating, plausible, with a stated method."},
   {"key":"risk","label":"Risk","weight":15,"skill_id":"decision_making","description":"At least three distinct risks, with mitigants or monitoring signals."},
   {"key":"catalysts","label":"Catalysts","weight":10,"skill_id":"investment_judgment","description":"At least three catalysts with timing."},
   {"key":"communication","label":"Communication","weight":10,"skill_id":"communication","description":"Appropriate length and readable sentence structure."},
   {"key":"sources","label":"Sources","weight":5,"skill_id":"technical_knowledge","description":"At least three cited sources, ideally with links."}
 ]'::jsonb,
 '{"rating_threshold_pct":10,"plausible_upside_pct":60,"evidence_weight_quick":0.5,"evidence_weight_professional":1.0}'::jsonb),
('research_report_v1', 'Equity Research Report Rubric v1',
 'Deterministic beta rubric for structured research reports.',
 '[
   {"key":"thesis","label":"Investment Thesis","weight":20,"skill_id":"investment_judgment","description":"Thesis and conclusion are developed and quantified."},
   {"key":"business_understanding","label":"Business & Industry","weight":15,"skill_id":"technical_knowledge","description":"Company, industry and competitive analysis depth."},
   {"key":"financial_analysis","label":"Financial Analysis & Forecast","weight":20,"skill_id":"financial_analysis","description":"Quantified historical analysis and forecast."},
   {"key":"valuation","label":"Valuation","weight":15,"skill_id":"valuation","description":"Method stated, explained and consistent with the rating."},
   {"key":"catalysts_risks","label":"Catalysts & Risks","weight":15,"skill_id":"decision_making","description":"At least three catalysts and three risks."},
   {"key":"communication","label":"Communication","weight":10,"skill_id":"communication","description":"Complete, well-proportioned report."},
   {"key":"sources","label":"Sources","weight":5,"skill_id":"technical_knowledge","description":"Five or more cited sources."}
 ]'::jsonb,
 '{"evidence_weight":0.75}'::jsonb);

-- ---------------------------------------------------------------------
-- Achievements (criteria evaluated server-side only)
-- ---------------------------------------------------------------------
insert into public.achievements (id, name, description, icon, tier, criteria, sort_order) values
 ('first_challenge', 'First Challenge', 'Completed and scored your first challenge.', 'flag', 'bronze',
   '{"type":"metric","metric":"challenges_completed","gte":1}', 1),
 ('first_stock_pitch', 'First Stock Pitch', 'Submitted your first stock pitch.', 'presentation', 'bronze',
   '{"type":"metric","metric":"stock_pitches_submitted","gte":1}', 2),
 ('first_research_report', 'First Research Report', 'Submitted your first equity research report.', 'file-text', 'bronze',
   '{"type":"metric","metric":"research_reports_submitted","gte":1}', 3),
 ('first_competition', 'First Competition', 'Registered for your first competition.', 'swords', 'bronze',
   '{"type":"metric","metric":"competitions_joined","gte":1}', 4),
 ('top_10_percent', 'Top 10%', 'Ranked in the top 10% of all ranked analysts (min. 10 ranked).', 'trending-up', 'silver',
   '{"type":"percentile","max_pct":10,"min_population":10}', 5),
 ('top_5_percent', 'Top 5%', 'Ranked in the top 5% of all ranked analysts (min. 20 ranked).', 'medal', 'gold',
   '{"type":"percentile","max_pct":5,"min_population":20}', 6),
 ('top_1_percent', 'Top 1%', 'Ranked in the top 1% of all ranked analysts (min. 100 ranked).', 'crown', 'platinum',
   '{"type":"percentile","max_pct":1,"min_population":100}', 7),
 ('valuation_specialist', 'Valuation Specialist', 'Passed 2+ valuation challenges with a Valuation skill of 75+.', 'calculator', 'gold',
   '{"type":"all","conditions":[{"type":"metric","metric":"category_passed","arg":"valuation","gte":2},{"type":"metric","metric":"skill_score","arg":"valuation","gte":75}]}', 8),
 ('equity_research_specialist', 'Equity Research Specialist', 'Submitted 3+ research reports with an Investment Judgment skill of 75+.', 'file-search', 'gold',
   '{"type":"all","conditions":[{"type":"metric","metric":"research_reports_submitted","gte":3},{"type":"metric","metric":"skill_score","arg":"investment_judgment","gte":75}]}', 9),
 ('portfolio_strategist', 'Portfolio Strategist', '10+ reasoned trades, 2+ market-event decisions and a passed portfolio challenge.', 'pie-chart', 'gold',
   '{"type":"all","conditions":[{"type":"metric","metric":"portfolio_trades","gte":10},{"type":"metric","metric":"market_event_decisions","gte":2},{"type":"metric","metric":"category_passed","arg":"portfolio_management","gte":1}]}', 10),
 ('hundred_challenges', '100 Challenges', 'Completed 100 different challenges.', 'target', 'platinum',
   '{"type":"metric","metric":"challenges_completed","gte":100}', 11),
 ('researcher', 'Researcher', 'Submitted 5 equity research reports.', 'library', 'silver',
   '{"type":"metric","metric":"research_reports_submitted","gte":5}', 12),
 ('competition_champion', 'Competition Champion', 'Won a FINLAB competition.', 'trophy', 'platinum',
   '{"type":"metric","metric":"competitions_won","gte":1}', 13);

-- ---------------------------------------------------------------------
-- Promotion requirements (target level = level being promoted INTO)
-- ---------------------------------------------------------------------
insert into public.promotion_requirements (target_level_id, requirement_type, params, label, sort_order) values
 (2, 'min_finlab_score', '{"value":70}', 'FINLAB Score of at least 70', 1),
 (2, 'challenges_passed', '{"value":5}', 'Pass 5 challenges', 2),
 (2, 'category_passed', '{"category":"valuation","value":1}', 'Pass a valuation challenge', 3),
 (2, 'metric_gte', '{"metric":"stock_pitches_submitted","value":1}', 'Submit a stock pitch', 4),

 (3, 'min_finlab_score', '{"value":85}', 'FINLAB Score of at least 85', 1),
 (3, 'tag_passed', '{"tag":"financial_modeling","value":1}', 'Pass a financial modeling challenge', 2),
 (3, 'metric_gte', '{"metric":"research_reports_submitted","value":1}', 'Submit an equity research project', 3),
 (3, 'metric_gte', '{"metric":"stock_pitches_submitted","value":2}', 'Submit 2 stock pitches', 4),
 (3, 'tag_passed', '{"tag":"investment_committee","value":1}', 'Pass an investment committee challenge', 5),
 (3, 'tag_passed', '{"tag":"promotion_assessment_associate","value":1}', 'Pass the Associate promotion assessment', 6),

 (4, 'min_finlab_score', '{"value":88}', 'FINLAB Score of at least 88', 1),
 (4, 'challenges_passed', '{"value":12}', 'Pass 12 challenges', 2),
 (4, 'metric_gte', '{"metric":"competitions_joined","value":1}', 'Compete in a FINLAB competition', 3),
 (4, 'skill_min', '{"skill":"leadership","value":60}', 'Leadership skill of at least 60', 4),
 (4, 'metric_gte', '{"metric":"research_reports_submitted","value":3}', 'Submit 3 research reports', 5),

 (5, 'min_finlab_score', '{"value":91}', 'FINLAB Score of at least 91', 1),
 (5, 'metric_gte', '{"metric":"competitions_top3","value":1}', 'Finish top 3 in a competition', 2),
 (5, 'skill_min', '{"skill":"leadership","value":75}', 'Leadership skill of at least 75', 3),
 (5, 'metric_gte', '{"metric":"stock_pitches_submitted","value":6}', 'Submit 6 stock pitches', 4),

 (6, 'min_finlab_score', '{"value":94}', 'FINLAB Score of at least 94', 1),
 (6, 'metric_gte', '{"metric":"competitions_won","value":1}', 'Win a FINLAB competition', 2),
 (6, 'challenges_passed', '{"value":25}', 'Pass 25 challenges', 3),
 (6, 'metric_gte', '{"metric":"research_reports_submitted","value":6}', 'Submit 6 research reports', 4);

-- ---------------------------------------------------------------------
-- SAMPLE market data — illustrative values, NOT live or current prices.
-- ---------------------------------------------------------------------
insert into public.market_fx_rates (pair, rate, as_of, data_source) values ('USDPHP', 57.50, '2026-09-30', 'sample');

insert into public.market_securities
 (id, symbol, exchange, name, sector, currency, price, prev_close, eps, bvps, shares_outstanding, revenue, description, data_as_of)
values
 ('PSE:BDO','BDO','PSE','BDO Unibank, Inc.','Banks','PHP',142.50,141.00,13.10,106.00,5330000000,225000000000,'Largest Philippine bank by assets; retail, corporate and wealth franchises.','2026-09-30'),
 ('PSE:BPI','BPI','PSE','Bank of the Philippine Islands','Banks','PHP',128.00,129.20,12.10,87.00,5270000000,160000000000,'Ayala-group universal bank with strong consumer and SME lending.','2026-09-30'),
 ('PSE:SM','SM','PSE','SM Investments Corporation','Holding Firms','PHP',880.00,872.50,64.50,520.00,1200000000,640000000000,'Conglomerate with retail, property (SMPH) and banking (BDO) interests.','2026-09-30'),
 ('PSE:ALI','ALI','PSE','Ayala Land, Inc.','Property','PHP',26.50,26.90,1.95,18.50,14600000000,175000000000,'Diversified property developer: residential, malls, offices and hotels.','2026-09-30'),
 ('PSE:JFC','JFC','PSE','Jollibee Foods Corporation','Services','PHP',238.00,235.00,9.40,82.00,1120000000,290000000000,'Quick-service restaurant group with Philippine and international brands.','2026-09-30'),
 ('PSE:TEL','TEL','PSE','PLDT Inc.','Telecommunications','PHP',1295.00,1302.00,125.00,520.00,216000000,215000000000,'Integrated telecom: fixed line, wireless (Smart) and digital services.','2026-09-30'),
 ('PSE:ICT','ICT','PSE','International Container Terminal Services, Inc.','Services','PHP',410.00,404.00,21.50,60.00,2000000000,155000000000,'Global port operator with terminals across Asia, the Americas and Africa.','2026-09-30'),
 ('PSE:MER','MER','PSE','Manila Electric Company','Industrial','PHP',520.00,517.00,43.00,205.00,1127000000,470000000000,'Largest electricity distributor in the Philippines; expanding into generation.','2026-09-30'),
 ('PSE:URC','URC','PSE','Universal Robina Corporation','Industrial','PHP',82.00,83.10,5.60,54.00,2180000000,165000000000,'Branded consumer foods, agro-industrial and commodity businesses.','2026-09-30'),
 ('PSE:AC','AC','PSE','Ayala Corporation','Holding Firms','PHP',560.00,565.00,64.00,680.00,620000000,330000000000,'Holding company with stakes in property, banking, telecom and energy.','2026-09-30'),
 ('NASDAQ:AAPL','AAPL','NASDAQ','Apple Inc.','Technology','USD',228.00,226.10,6.75,4.40,15000000000,405000000000,'Consumer hardware, software and services ecosystem.','2026-09-30'),
 ('NASDAQ:MSFT','MSFT','NASDAQ','Microsoft Corporation','Technology','USD',445.00,448.20,13.40,46.00,7430000000,290000000000,'Cloud (Azure), productivity software and gaming.','2026-09-30'),
 ('NASDAQ:NVDA','NVDA','NASDAQ','NVIDIA Corporation','Semiconductors','USD',138.00,135.50,3.10,3.20,24400000000,165000000000,'Accelerated computing: GPUs, networking and AI platforms.','2026-09-30'),
 ('NYSE:JPM','JPM','NYSE','JPMorgan Chase & Co.','Banks','USD',245.00,243.60,19.80,120.00,2800000000,175000000000,'Largest US bank: consumer, commercial, investment banking and asset management.','2026-09-30'),
 ('NYSE:KO','KO','NYSE','The Coca-Cola Company','Consumer Staples','USD',69.00,69.40,2.85,6.30,4300000000,47000000000,'Global non-alcoholic beverage brand owner.','2026-09-30'),
 ('NASDAQ:AMZN','AMZN','NASDAQ','Amazon.com, Inc.','Consumer Discretionary','USD',205.00,202.00,5.50,28.00,10600000000,670000000000,'E-commerce, cloud computing (AWS) and advertising.','2026-09-30');

update public.market_securities
   set pe = case when eps > 0 then round(price / eps, 2) end,
       pb = case when bvps > 0 then round(price / bvps, 2) end,
       market_cap = round(price * shares_outstanding, 2);

-- Illustrative 180-day price paths that end exactly at the sample price.
insert into public.market_price_history (security_id, trade_date, close)
select s.id,
       date '2026-09-30' - (180 - g.i),
       round((s.price * (1
         + 0.09 * (sin(g.i / 17.0 + length(s.id)) - sin(180 / 17.0 + length(s.id)))
         + 0.03 * (sin(g.i / 4.3 + ascii(s.symbol)) - sin(180 / 4.3 + ascii(s.symbol)))
         + 0.0006 * (g.i - 180) * (case when ascii(s.symbol) % 2 = 0 then 1 else -0.5 end))::numeric)::numeric, 4)
from public.market_securities s
cross join generate_series(0, 180) as g(i)
where extract(isodow from date '2026-09-30' - (180 - g.i)) < 6;

-- ---------------------------------------------------------------------
-- LEARN — lessons
-- ---------------------------------------------------------------------
insert into public.lessons (slug, title, summary, category_id, difficulty, estimated_minutes, sort_order, related_challenge_slugs, body) values
('three-statements', 'The Three Financial Statements', 'How the income statement, balance sheet and cash flow statement fit together.', 'accounting', 'beginner', 12, 1,
 '{accounting-three-statements,accounting-working-capital}', $md$
## Why it matters
Every valuation, pitch and credit decision starts with the three statements. If you can't trace a peso through them, you can't model a business.

## The income statement
Measures **profitability over a period**.

| Line | Meaning |
|---|---|
| Revenue | Sales recognised in the period |
| − COGS | Direct cost of what was sold |
| = Gross profit | What's left to pay for overheads |
| − Operating expenses | SG&A, R&D, depreciation |
| = EBIT | Operating profit |
| − Interest, − Taxes | Financing cost and tax |
| = Net income | Profit to shareholders |

## The balance sheet
A **snapshot** at a point in time: *Assets = Liabilities + Equity*. Net income flows into equity through retained earnings.

## The cash flow statement
Reconciles net income to cash:
- **Operating cash flow** = net income + non-cash charges (depreciation) − increase in working capital
- **Investing** = capex, acquisitions
- **Financing** = debt, equity, dividends

## The linkages to memorise
1. Net income → retained earnings (balance sheet) and top of the cash flow statement
2. Depreciation reduces EBIT but is added back in operating cash flow
3. Capex increases PP&E and appears in investing cash flow
4. Ending cash on the cash flow statement = cash on the balance sheet

> **Analyst habit:** when a number changes, ask "where does the other side of this entry go?"
$md$),
('ratio-analysis', 'Ratio Analysis Toolkit', 'Margins, returns, liquidity and leverage — and how to read them together.', 'financial_analysis', 'beginner', 15, 2,
 '{financial-analysis-ratio-diagnostics}', $md$
## The four families
**Growth** — revenue growth, EPS growth.
**Profitability** — gross margin, EBIT margin, net margin.
**Returns** — ROE = net income / average equity; ROA = net income / average assets.
**Liquidity & leverage** — current ratio, quick ratio = (current assets − inventory) / current liabilities, net debt / EBITDA.

## Use averages for returns
Income is earned over a year, but balance sheet items are point-in-time. Use the **average** of opening and closing balances for ROE and ROA.

## Read ratios as a story
A retailer growing revenue 12% while gross margin falls 100bp may be **buying growth with discounts**. Ask:
- Is the change driven by price, mix or cost?
- Is it temporary (promotion) or structural (competition)?
- Does operating leverage offset it further down the P&L?

## DuPont
ROE = net margin × asset turnover × equity multiplier. It tells you *why* ROE moved — profitability, efficiency or leverage.
$md$),
('valuation-multiples', 'Valuation with Multiples (P/E and P/B)', 'Relative valuation, choosing peers, and turning a multiple into a target price.', 'valuation', 'beginner', 12, 3,
 '{valuation-multiples-pe-pb}', $md$
## The formulas
- **P/E target price** = EPS × target P/E
- **P/B target price** = BVPS × target P/B

## Choosing the multiple
Use a peer set of comparable businesses (same industry, growth, risk). The **median** is usually more robust than the mean because it ignores outliers.

## P/E vs P/B
- P/E works when earnings are **positive and stable**.
- P/B is preferred for **banks and asset-heavy businesses**, or when earnings are cyclical or negative. Justified P/B ≈ (ROE − g) / (COE − g): a bank earning above its cost of equity deserves to trade above book.

## From value to rating
Upside = (target − current) / current. A common convention: BUY if upside ≥ 10%, SELL if ≤ −10%, otherwise HOLD.

> FINLAB's valuation tools use exactly these formulas. They are educational tools, not professional models.
$md$),
('dcf-fundamentals', 'DCF Fundamentals', 'Free cash flow, discounting, terminal value and the sensitivities that matter.', 'valuation', 'intermediate', 18, 4,
 '{valuation-dcf-simplified}', $md$
## Free cash flow to the firm
FCFF = EBIT × (1 − tax rate) + D&A − capex − increase in working capital

## Discounting
PV = FCF_t / (1 + WACC)^t. WACC blends the cost of equity and the after-tax cost of debt by their weights.

## Terminal value (Gordon growth)
TV_N = FCF_N × (1 + g) / (WACC − g), discounted back N years. g must be below long-run nominal GDP growth, and WACC must exceed g.

## Enterprise to equity
Equity value = enterprise value − net debt. Divide by diluted shares for value per share.

## Know your sensitivities
Terminal value is often **60–80% of enterprise value**, so small changes in WACC or g move the answer a lot. Always show a range, not a point estimate.
$md$),
('stock-pitch-structure', 'How to Structure a Stock Pitch', 'Thesis, catalysts, valuation, risks — in the order a PM wants to hear it.', 'stock_pitch', 'beginner', 10, 5,
 '{stock-pitch-quick-bdo,stock-pitch-quick-open,stock-pitch-professional}', $md$
## The 30-second version
"**BUY XYZ, 25% upside to ₱120.** The market underestimates A because B. We expect C to prove it within 6 months."

## The building blocks
1. **Recommendation & target** — rating, current price, target price, upside.
2. **Thesis** — 2–3 specific, quantified points. Avoid "great company, strong brand".
3. **Variant perception** — what you believe that the market doesn't.
4. **Catalysts** — dated events that will close the gap (earnings, rate decision, product launch).
5. **Valuation** — method and key assumptions behind the target.
6. **Risks** — what would make you wrong, and the signal you'll monitor.
7. **Sources** — annual reports, disclosures, exchange filings.

## Consistency check
A BUY with 3% upside, or a SELL with a target above the current price, will be challenged immediately. FINLAB's rubric checks this too.
$md$),
('equity-research-report', 'Anatomy of an Equity Research Report', 'The sections of an initiation report and what a reader expects in each.', 'equity_research', 'intermediate', 15, 6,
 '{equity-research-initiation,equity-research-earnings-note}', $md$
## Sections
1. **Investment thesis** — the call and why, in one page.
2. **Company overview** — segments, revenue mix, management, strategy.
3. **Industry overview** — size, growth, structure, regulation.
4. **Competitive analysis** — positioning, moat, market share.
5. **Financial analysis** — historical trends in growth, margins, returns and the balance sheet.
6. **Forecast** — explicit assumptions and the resulting P&L.
7. **Valuation** — method(s), target price, sensitivity.
8. **Catalysts** and 9. **Risks**.
10. **Conclusion** — restate the call.
11. **Sources**.

## Writing standards
- Lead with conclusions; support with numbers.
- One idea per paragraph.
- Every forecast assumption must be justified by history or evidence.
$md$),
('portfolio-construction', 'Portfolio Construction Basics', 'Expected return, risk, Sharpe ratio, concentration and rebalancing.', 'portfolio_management', 'intermediate', 14, 7,
 '{portfolio-construction-basics}', $md$
## Expected return
Weighted average of asset expected returns: E[Rp] = Σ wᵢ × E[Rᵢ].

## Risk-adjusted return
**Sharpe ratio** = (Rp − Rf) / σp. It measures excess return per unit of volatility.

## Concentration
The Herfindahl-Hirschman Index HHI = Σ wᵢ². The **effective number of positions** = 1 / HHI. Four positions weighted 40/30/20/10 behave like ~3.3 equal positions.

## Rebalancing
Drift moves a portfolio away from its target risk. Rebalancing sells what has outperformed and buys what has lagged, restoring the intended exposure. Do it on a schedule or when weights breach a band.

## In FINLAB
The Portfolio Simulator starts you with ₱10,000,000 of **virtual** capital. Every trade requires a written rationale, because a decision without reasoning teaches nothing.
$md$),
('accretion-dilution', 'M&A: Accretion / Dilution', 'Pro forma EPS and what drives whether a deal is accretive.', 'investment_banking', 'advanced', 15, 8,
 '{ib-accretion-dilution}', $md$
## Pro forma EPS
Pro forma EPS = (acquirer NI + target NI + after-tax synergies − after-tax financing costs) / (acquirer shares + new shares issued)

## Rule of thumb for all-stock deals
A deal is accretive if the **target's P/E is lower than the acquirer's P/E** (before synergies): you are "buying earnings cheaply" with your own more expensive stock.

## Break-even synergies
The synergies required for pro forma EPS to equal standalone EPS. A useful negotiating number.

## Accretion is not value creation
EPS accretion can come from paying with cheap debt while overpaying for assets. What matters is whether **return on invested capital** exceeds the cost of capital.
$md$),
('investment-committee-memo', 'Writing an Investment Committee Memo', 'Recommendation first, then the numbers, then the downside.', 'case_competition', 'advanced', 12, 9,
 '{case-investment-committee-expansion,promotion-assessment-associate}', $md$
## Structure
1. **Recommendation** — approve / reject / approve with conditions.
2. **Economics** — NPV, IRR versus hurdle rate (WACC), payback.
3. **Key assumptions** — volumes, pricing, margins, capex.
4. **Downside case** — what happens if volumes come in 20% below plan?
5. **Risks and mitigants** — phasing, options to expand/abandon, contracts.
6. **Conditions** — what must be true to proceed.

## Defending it
The committee will attack the assumption that matters most. Know your **break-even**: the volume or price at which NPV = 0.
$md$);

-- ---------------------------------------------------------------------
-- CHALLENGES (published) + server-side answer keys
-- ---------------------------------------------------------------------
-- Helper CTE pattern: insert challenge, then its answer key by slug.

insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
-- 1 ─────────────────────────────────────────────────────────────────
('accounting-three-statements', 'Three Statements: Luzon Roastery',
 'Build the income statement and trace a capex purchase through the statements.',
 $md$
**Luzon Roastery Inc.** is a specialty coffee roaster supplying cafés in Metro Manila. FY2025 figures (₱ millions):

| Item | FY2025 |
|---|---|
| Revenue | 120.0 |
| Cost of goods sold | 72.0 |
| Operating expenses (incl. depreciation) | 30.0 |
| Interest expense | 2.0 |
| Tax rate | 25% |
$md$,
 'Answer each task. Numeric answers in ₱ millions or %, as indicated. Written answers should be in your own words.',
 'accounting', 'tasks', null, 'beginner', 15, 100, 60, 'auto',
 '[{"label":"Numeric accuracy","weight":70,"description":"Within 1% of the correct answer; partial credit if close."},{"label":"Concept explanation","weight":30,"description":"Length and coverage of key concepts."}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.5}',
 $j${"tasks":[
   {"id":"gp","type":"numeric","label":"Gross profit","prompt":"What is gross profit (₱m)?","unit":"₱m","points":10},
   {"id":"gm","type":"numeric","label":"Gross margin","prompt":"What is the gross margin (%)?","unit":"%","points":10},
   {"id":"ebit_m","type":"numeric","label":"EBIT margin","prompt":"What is the EBIT margin (%)?","unit":"%","points":15},
   {"id":"ni","type":"numeric","label":"Net income","prompt":"What is net income (₱m)?","unit":"₱m","points":20},
   {"id":"capex","type":"mcq","label":"Capex linkage","prompt":"Luzon Roastery buys a ₱5m roaster for cash on the last day of the year. Which statements change on that day?","options":[{"id":"a","label":"Income statement only"},{"id":"b","label":"Balance sheet and cash flow statement"},{"id":"c","label":"All three statements"},{"id":"d","label":"Cash flow statement only"}],"points":15},
   {"id":"ocf","type":"long_text","label":"Net income vs cash","prompt":"Explain why Luzon Roastery's operating cash flow could differ from its net income.","min_words":50,"points":30}
 ]}$j$::jsonb,
 '{fundamentals}', true, now()),
-- 2 ─────────────────────────────────────────────────────────────────
('accounting-working-capital', 'Working Capital: Cash Conversion Cycle',
 'Compute DSO, DIO, DPO and the cash conversion cycle, then propose improvements.',
 $md$
**Bicol Hardware Supply** (₱ millions, FY2025, use a 365-day year):

| Item | Value |
|---|---|
| Revenue | 365 |
| Cost of goods sold | 219 |
| Accounts receivable (average) | 40 |
| Inventory (average) | 30 |
| Accounts payable (average) | 18 |
$md$,
 'Compute each metric in days. Then explain how management could shorten the cycle.',
 'accounting', 'tasks', null, 'beginner', 15, 100, 60, 'auto',
 '[{"label":"Numeric accuracy","weight":70},{"label":"Recommendations","weight":30}]',
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 $j${"tasks":[
   {"id":"dso","type":"numeric","label":"DSO","prompt":"Days sales outstanding (days)?","unit":"days","points":15},
   {"id":"dio","type":"numeric","label":"DIO","prompt":"Days inventory outstanding (days)?","unit":"days","points":15},
   {"id":"dpo","type":"numeric","label":"DPO","prompt":"Days payables outstanding (days)?","unit":"days","points":15},
   {"id":"ccc","type":"numeric","label":"Cash conversion cycle","prompt":"Cash conversion cycle (days)?","unit":"days","points":20},
   {"id":"improve","type":"long_text","label":"Improvement plan","prompt":"Recommend three ways to shorten the cycle and the trade-off of each.","min_words":60,"points":35}
 ]}$j$::jsonb,
 '{fundamentals,working_capital}', true, now()),
-- 3 ─────────────────────────────────────────────────────────────────
('financial-analysis-ratio-diagnostics', 'Ratio Diagnostics: Visayas Mart',
 'Diagnose a growing retailer whose margins are slipping.',
 $md$
**Visayas Mart Corp.** operates 140 supermarkets (₱ millions):

| Item | FY2024 | FY2025 |
|---|---|---|
| Revenue | 50,000 | 56,000 |
| Cost of goods sold | 37,500 | 42,560 |
| Net income | 1,500 | 1,568 |
| Total equity (year-end) | 12,000 | 13,000 |
| Current assets | — | 9,000 |
| of which inventory | — | 4,000 |
| Current liabilities | — | 7,500 |
$md$,
 'Percentages to two decimals where needed. Use average equity for ROE.',
 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Ratio accuracy","weight":65},{"label":"Diagnosis quality","weight":35}]',
 '{"financial_analysis":1.0,"technical_knowledge":0.5,"communication":0.3}',
 $j${"tasks":[
   {"id":"growth","type":"numeric","label":"Revenue growth","prompt":"FY2025 revenue growth (%)?","unit":"%","points":10},
   {"id":"gm25","type":"numeric","label":"Gross margin FY2025","prompt":"FY2025 gross margin (%)?","unit":"%","points":10},
   {"id":"nm25","type":"numeric","label":"Net margin FY2025","prompt":"FY2025 net margin (%)?","unit":"%","points":10},
   {"id":"roe","type":"numeric","label":"ROE (avg equity)","prompt":"FY2025 ROE on average equity (%)?","unit":"%","points":15},
   {"id":"cr","type":"numeric","label":"Current ratio","prompt":"FY2025 current ratio (x)?","unit":"x","points":10},
   {"id":"qr","type":"numeric","label":"Quick ratio","prompt":"FY2025 quick ratio (x)?","unit":"x","points":10},
   {"id":"diag","type":"long_text","label":"Diagnosis","prompt":"In 80+ words, diagnose the change in profitability and what you would ask management.","min_words":80,"points":35}
 ]}$j$::jsonb,
 '{fundamentals}', true, now()),
-- 4 ─────────────────────────────────────────────────────────────────
('financial-analysis-forecast-build', 'Forecast Build: Pampanga Foods',
 'Project next year''s P&L from explicit assumptions.',
 $md$
**Pampanga Foods** FY2025 revenue was **₱800m**. Management guidance and your assumptions for FY2026:

- Revenue growth: **10%**
- Gross margin: **35%**
- Operating expenses: **18% of revenue**
- No interest expense; tax rate **25%**

You can rebuild this in the **Financial Model** tool before answering.
$md$,
 'Answer in ₱ millions (one decimal) or %.',
 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 '[{"label":"Model accuracy","weight":70},{"label":"Sensitivity judgment","weight":30}]',
 '{"financial_analysis":1.0,"technical_knowledge":0.4,"decision_making":0.3}',
 $j${"tasks":[
   {"id":"rev","type":"numeric","label":"FY2026 revenue","prompt":"FY2026 revenue (₱m)?","unit":"₱m","points":10},
   {"id":"gp","type":"numeric","label":"FY2026 gross profit","prompt":"FY2026 gross profit (₱m)?","unit":"₱m","points":10},
   {"id":"ebit","type":"numeric","label":"FY2026 EBIT","prompt":"FY2026 EBIT (₱m)?","unit":"₱m","points":15},
   {"id":"ni","type":"numeric","label":"FY2026 net income","prompt":"FY2026 net income (₱m)?","unit":"₱m","points":15},
   {"id":"em","type":"numeric","label":"EBIT margin","prompt":"FY2026 EBIT margin (%)?","unit":"%","points":10},
   {"id":"sens","type":"long_text","label":"Key sensitivity","prompt":"Which assumption is the forecast most sensitive to, and how would you stress-test it?","min_words":50,"points":40}
 ]}$j$::jsonb,
 '{financial_modeling}', true, now()),
-- 5 ─────────────────────────────────────────────────────────────────
('valuation-multiples-pe-pb', 'Multiples Valuation: Mindanao Power',
 'Value a utility on P/E and P/B, blend the results and make a call.',
 $md$
**Mindanao Power Co.** trades at **₱42.00**.

| Metric | Value |
|---|---|
| EPS (FY2026E) | ₱4.20 |
| Book value per share | ₱30.00 |
| Peer P/E | 11x, 12x, 13x |
| Peer P/B (median) | 1.6x |

Use the **median** peer P/E. Rating convention: BUY ≥ +10% upside, SELL ≤ −10%, otherwise HOLD.
$md$,
 'Try the Valuation tool for the P/E and P/B calculations, then answer.',
 'valuation', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 '[{"label":"Valuation accuracy","weight":70},{"label":"Method judgment","weight":30}]',
 '{"valuation":1.0,"technical_knowledge":0.4,"investment_judgment":0.3}',
 $j${"tasks":[
   {"id":"pe_tp","type":"numeric","label":"P/E target price","prompt":"Target price using P/E (₱)?","unit":"₱","points":15},
   {"id":"pb_tp","type":"numeric","label":"P/B target price","prompt":"Target price using P/B (₱)?","unit":"₱","points":15},
   {"id":"blend","type":"numeric","label":"Blended target","prompt":"50/50 blended target price (₱)?","unit":"₱","points":15},
   {"id":"upside","type":"numeric","label":"Upside","prompt":"Upside to the blended target (%)?","unit":"%","points":10},
   {"id":"rating","type":"mcq","label":"Rating","prompt":"What rating does the convention imply?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}],"points":15},
   {"id":"why_pb","type":"long_text","label":"P/B vs P/E","prompt":"When is P/B a more appropriate anchor than P/E?","min_words":40,"points":30}
 ]}$j$::jsonb,
 '{valuation_core}', true, now()),
-- 6 ─────────────────────────────────────────────────────────────────
('valuation-dcf-simplified', 'Simplified DCF: Cebu Water Utility',
 'Discount three years of FCFF, add a terminal value and get to value per share.',
 $md$
**Cebu Water Utility** (₱ millions):

| Year | 1 | 2 | 3 |
|---|---|---|---|
| FCFF | 100 | 110 | 121 |

- WACC **10%**, terminal growth **3%** (Gordon growth on Year 3 FCFF)
- Net debt **₱300m**, shares outstanding **50m**

*Simplified educational DCF — not a professional banking model.*
$md$,
 'Round to two decimals. Discount year-end cash flows.',
 'valuation', 'tasks', null, 'intermediate', 35, 100, 60, 'auto',
 '[{"label":"DCF accuracy","weight":75},{"label":"Sensitivity reasoning","weight":25}]',
 '{"valuation":1.0,"financial_analysis":0.5,"technical_knowledge":0.3}',
 $j${"tasks":[
   {"id":"pv_fcf","type":"numeric","label":"PV of FCFF","prompt":"Present value of Years 1–3 FCFF (₱m)?","unit":"₱m","points":15},
   {"id":"tv","type":"numeric","label":"Terminal value","prompt":"Terminal value at end of Year 3 (₱m)?","unit":"₱m","points":15},
   {"id":"pv_tv","type":"numeric","label":"PV of terminal value","prompt":"Present value of the terminal value (₱m)?","unit":"₱m","points":15},
   {"id":"ev","type":"numeric","label":"Enterprise value","prompt":"Enterprise value (₱m)?","unit":"₱m","points":10},
   {"id":"vps","type":"numeric","label":"Value per share","prompt":"Equity value per share (₱)?","unit":"₱","points":20},
   {"id":"sens","type":"long_text","label":"Sensitivity","prompt":"Explain why the answer is sensitive to WACC and terminal growth, and how you would present that uncertainty.","min_words":50,"points":25}
 ]}$j$::jsonb,
 '{financial_modeling,dcf}', true, now()),
-- 7 ─────────────────────────────────────────────────────────────────
('equity-research-earnings-note', 'Earnings Flash Note: Luzon Telecom',
 'Turn a results release into a three-point research note.',
 $md$
**Luzon Telecom Q3 results vs consensus:**

| Metric | Actual | Consensus |
|---|---|---|
| Revenue (₱bn) | 52.4 | 51.0 |
| EBITDA margin | 51.0% | 50.0% |
| EPS (₱) | 2.31 | 2.10 |

Management raised full-year capex guidance from ₱80bn to ₱88bn citing fiber expansion.
$md$,
 'Compute the surprises, then write the note as you would send it to clients before the open.',
 'equity_research', 'tasks', null, 'intermediate', 20, 100, 60, 'hybrid',
 '[{"label":"Surprise math","weight":40},{"label":"Research note","weight":60}]',
 '{"communication":1.0,"investment_judgment":0.6,"financial_analysis":0.5}',
 $j${"tasks":[
   {"id":"eps_beat","type":"numeric","label":"EPS surprise","prompt":"EPS surprise vs consensus (%)?","unit":"%","points":15},
   {"id":"rev_beat","type":"numeric","label":"Revenue surprise","prompt":"Revenue surprise vs consensus (%)?","unit":"%","points":15},
   {"id":"capex","type":"numeric","label":"Capex guidance change","prompt":"Increase in capex guidance (%)?","unit":"%","points":10},
   {"id":"note","type":"long_text","label":"Flash note","prompt":"Write a three-bullet flash note: headline view, the key positive, the key concern (consider the capex raise and free cash flow).","min_words":90,"points":60}
 ]}$j$::jsonb,
 '{research_note}', true, now()),
-- 8 ─────────────────────────────────────────────────────────────────
('stock-pitch-quick-bdo', 'Quick Pitch: BDO Unibank',
 'Pitch BDO in 30 minutes: rating, target, thesis, catalysts, risks and sources.',
 $md$
You have **30 minutes** to pitch **BDO Unibank (PSE: BDO)** to a portfolio manager.

The sample price is pre-filled from FINLAB Markets (illustrative data). Use the Markets page and the Valuation tool for P/E and P/B.
$md$,
 'Complete every required field. Put one catalyst and one risk per line. Add at least three sources.',
 'stock_pitch', 'stock_pitch', 'quick', 'intermediate', 30, 120, 60, 'hybrid',
 '[{"label":"Thesis","weight":20},{"label":"Financial Analysis","weight":20},{"label":"Valuation","weight":20},{"label":"Risk","weight":15},{"label":"Catalysts","weight":10},{"label":"Communication","weight":10},{"label":"Sources","weight":5}]',
 '{"investment_judgment":1.0,"valuation":0.6,"communication":0.6,"financial_analysis":0.4}',
 '{"company":"BDO Unibank, Inc.","ticker":"BDO","exchange":"PSE","currency":"PHP","current_price":"142.50"}'::jsonb,
 '{quick_pitch}', true, now()),
-- 9 ─────────────────────────────────────────────────────────────────
('stock-pitch-quick-open', 'Quick Pitch: Your Best Idea',
 'Pick any company and pitch it in 30 minutes.',
 $md$
Choose **any listed company** (PSE or US). A PM gives you 30 minutes to make the case. Be specific and quantified.
$md$,
 'Complete every required field. One catalyst and one risk per line. Cite at least three sources.',
 'stock_pitch', 'stock_pitch', 'quick', 'beginner', 30, 100, 60, 'hybrid',
 '[{"label":"Thesis","weight":20},{"label":"Financial Analysis","weight":20},{"label":"Valuation","weight":20},{"label":"Risk","weight":15},{"label":"Catalysts","weight":10},{"label":"Communication","weight":10},{"label":"Sources","weight":5}]',
 '{"investment_judgment":1.0,"valuation":0.6,"communication":0.6,"financial_analysis":0.4}',
 '{}'::jsonb,
 '{quick_pitch}', true, now()),
-- 10 ────────────────────────────────────────────────────────────────
('stock-pitch-professional', 'Professional Pitch: Philippine Consumer',
 'A multi-day professional pitch with full analysis, forecast and valuation.',
 $md$
Prepare a **professional stock pitch** on a Philippine consumer company (e.g. JFC, URC, or another consumer name).

You have **5 days** from starting. Drafts save automatically; submit before the deadline. In a later phase this will be followed by a 10-minute presentation and a 10–15 minute Q&A.
$md$,
 'Complete all professional sections: company analysis, financial analysis, forecast, valuation, thesis, variant perception, catalysts, risks and sources.',
 'stock_pitch', 'stock_pitch', 'professional', 'advanced', 600, 250, 65, 'hybrid',
 '[{"label":"Thesis","weight":20},{"label":"Financial Analysis","weight":20},{"label":"Valuation","weight":20},{"label":"Risk","weight":15},{"label":"Catalysts","weight":10},{"label":"Communication","weight":10},{"label":"Sources","weight":5}]',
 '{"investment_judgment":1.0,"valuation":0.8,"financial_analysis":0.8,"communication":0.6,"decision_making":0.4}',
 '{}'::jsonb,
 '{professional_pitch}', true, now()),
-- 11 ────────────────────────────────────────────────────────────────
('equity-research-initiation', 'Initiation of Coverage Report',
 'Write a full structured initiation report on a company of your choice.',
 $md$
Initiate coverage on a listed company using the **Research Studio** structure. You have **7 days** from starting. A strong report is quantified, internally consistent, and well sourced (5+ sources).
$md$,
 'Complete all ten sections, set a rating and target price, and cite at least five sources.',
 'equity_research', 'research_report', null, 'advanced', 900, 300, 65, 'hybrid',
 '[{"label":"Investment Thesis","weight":20},{"label":"Business & Industry","weight":15},{"label":"Financial Analysis & Forecast","weight":20},{"label":"Valuation","weight":15},{"label":"Catalysts & Risks","weight":15},{"label":"Communication","weight":10},{"label":"Sources","weight":5}]',
 '{"investment_judgment":1.0,"financial_analysis":0.8,"valuation":0.6,"communication":0.8}',
 '{}'::jsonb,
 '{equity_research_project}', true, now()),
-- 12 ────────────────────────────────────────────────────────────────
('portfolio-construction-basics', 'Portfolio Construction: Balanced Mandate',
 'Expected return, Sharpe ratio, concentration and a rebalancing decision.',
 $md$
A client's portfolio:

- **60% equities**, expected return 10%; **40% bonds**, expected return 5%
- Portfolio volatility **10%**; risk-free rate **5.5%**

Separately, the equity sleeve holds four stocks weighted **40% / 30% / 20% / 10%**.
$md$,
 'Answer to two decimals.',
 'portfolio_management', 'tasks', null, 'intermediate', 20, 100, 60, 'auto',
 '[{"label":"Calculations","weight":60},{"label":"Rebalancing judgment","weight":40}]',
 '{"investment_judgment":1.0,"decision_making":0.6,"technical_knowledge":0.3}',
 $j${"tasks":[
   {"id":"er","type":"numeric","label":"Expected return","prompt":"Portfolio expected return (%)?","unit":"%","points":15},
   {"id":"sharpe","type":"numeric","label":"Sharpe ratio","prompt":"Sharpe ratio?","unit":"","points":15},
   {"id":"hhi","type":"numeric","label":"HHI","prompt":"Herfindahl index of the equity sleeve (decimal, e.g. 0.25)?","unit":"","points":10},
   {"id":"eff_n","type":"numeric","label":"Effective positions","prompt":"Effective number of positions (1/HHI)?","unit":"","points":10},
   {"id":"rebal","type":"mcq","label":"Drift","prompt":"After a rally, equities are 72% of the portfolio. The mandate band is 55–65%. What should the manager do?","options":[{"id":"a","label":"Do nothing — let winners run"},{"id":"b","label":"Sell equities / buy bonds back toward 60/40"},{"id":"c","label":"Buy more equities"},{"id":"d","label":"Move everything to cash"}],"points":15},
   {"id":"memo","type":"long_text","label":"Client note","prompt":"Explain to the client why you are rebalancing and what risk it controls.","min_words":60,"points":35}
 ]}$j$::jsonb,
 '{portfolio}', true, now()),
-- 13 ────────────────────────────────────────────────────────────────
('ib-accretion-dilution', 'M&A: Accretion / Dilution',
 'Is an all-stock acquisition accretive? What synergies would make it break even?',
 $md$
**Archipelago Retail** (acquirer): net income **₱500m**, **100m** shares.
**Island Pharmacy** (target): net income **₱60m**.

Archipelago pays entirely in stock by issuing **20m new shares**. Expected after-tax synergies: **₱10m**.
$md$,
 'Ignore transaction fees. Two decimals.',
 'investment_banking', 'tasks', null, 'advanced', 25, 120, 60, 'auto',
 '[{"label":"Deal math","weight":65},{"label":"Strategic judgment","weight":35}]',
 '{"valuation":0.6,"financial_analysis":0.6,"technical_knowledge":0.6,"decision_making":0.5}',
 $j${"tasks":[
   {"id":"sa_eps","type":"numeric","label":"Standalone EPS","prompt":"Acquirer standalone EPS (₱)?","unit":"₱","points":10},
   {"id":"pf_eps","type":"numeric","label":"Pro forma EPS","prompt":"Pro forma EPS including synergies (₱)?","unit":"₱","points":20},
   {"id":"ad","type":"numeric","label":"Accretion/(dilution)","prompt":"Accretion / (dilution) % (negative if dilutive)?","unit":"%","points":15},
   {"id":"verdict","type":"mcq","label":"Verdict","prompt":"The deal is…","options":[{"id":"accretive","label":"Accretive"},{"id":"neutral","label":"EPS neutral"},{"id":"dilutive","label":"Dilutive"}],"points":10},
   {"id":"be_syn","type":"numeric","label":"Break-even synergies","prompt":"After-tax synergies needed to break even (₱m)?","unit":"₱m","points":15},
   {"id":"why","type":"long_text","label":"Strategic case","prompt":"Why might the board still approve a dilutive deal? When should it not?","min_words":60,"points":30}
 ]}$j$::jsonb,
 '{deal_math}', true, now()),
-- 14 ────────────────────────────────────────────────────────────────
('case-investment-committee-expansion', 'Investment Committee: Cebu Logistics Expansion',
 'Evaluate a ₱500m warehouse expansion and defend your recommendation to the IC.',
 $md$
**Cebu Logistics** proposes a ₱500m warehouse network expansion.

- Expected free cash flow: **₱90m per year for 10 years**, no terminal value
- Hurdle rate (WACC): **11%**
- The CFO asks: *"What happens if volumes — and therefore cash flows — come in 20% below plan?"*
$md$,
 'Compute the economics, then write the IC memo and defend it.',
 'case_competition', 'tasks', null, 'advanced', 45, 200, 60, 'hybrid',
 '[{"label":"Economics","weight":40},{"label":"IC memo","weight":35},{"label":"Defense","weight":25}]',
 '{"decision_making":1.0,"leadership":0.8,"communication":0.8,"investment_judgment":0.6}',
 $j${"tasks":[
   {"id":"npv","type":"numeric","label":"NPV","prompt":"Project NPV at 11% (₱m)?","unit":"₱m","points":15},
   {"id":"irr","type":"numeric","label":"IRR","prompt":"Project IRR (%)?","unit":"%","points":10},
   {"id":"npv_down","type":"numeric","label":"Downside NPV","prompt":"NPV if annual FCF is 20% lower (₱m)?","unit":"₱m","points":15},
   {"id":"decision","type":"mcq","label":"Decision","prompt":"Your recommendation:","options":[{"id":"approve","label":"Approve"},{"id":"approve_conditions","label":"Approve with conditions (phasing, contracts)"},{"id":"reject","label":"Reject"}],"points":10},
   {"id":"memo","type":"long_text","label":"IC memo","prompt":"Write the IC memo: recommendation, economics, key assumptions, risks and conditions.","min_words":120,"points":30},
   {"id":"defense","type":"long_text","label":"Q&A defense","prompt":"Answer the CFO's downside question as you would in the room.","min_words":60,"points":20}
 ]}$j$::jsonb,
 '{investment_committee}', true, now()),
-- 15 ────────────────────────────────────────────────────────────────
('promotion-assessment-associate', 'Associate Promotion Assessment',
 'The gate to Associate: WACC, EV-based valuation and an investment view under time pressure.',
 $md$
**Northern Cement Corp.**

| Input | Value |
|---|---|
| Market value of equity | ₱600m |
| Market value of debt | ₱400m |
| Cost of equity | 12% |
| Pre-tax cost of debt | 7% |
| Tax rate | 25% |
| EBITDA (FY2026E) | ₱250m |
| Peer EV/EBITDA | 8.0x |
| Net debt | ₱400m |
| Shares outstanding | 80m |
| Current share price | ₱17.50 |
$md$,
 'Timed: 60 minutes. Two decimals.',
 'case_competition', 'tasks', null, 'expert', 60, 300, 70, 'hybrid',
 '[{"label":"Technical accuracy","weight":50},{"label":"Investment view","weight":50}]',
 '{"valuation":0.8,"financial_analysis":0.8,"investment_judgment":0.8,"leadership":0.5,"communication":0.5}',
 $j${"tasks":[
   {"id":"wacc","type":"numeric","label":"WACC","prompt":"WACC (%)?","unit":"%","points":15},
   {"id":"ev","type":"numeric","label":"Enterprise value","prompt":"Implied enterprise value (₱m)?","unit":"₱m","points":10},
   {"id":"tp","type":"numeric","label":"Target price","prompt":"Implied equity value per share (₱)?","unit":"₱","points":15},
   {"id":"rating","type":"mcq","label":"Rating","prompt":"Rating (BUY ≥ +10%, SELL ≤ −10%)?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}],"points":10},
   {"id":"view","type":"long_text","label":"Investment view","prompt":"Present your investment view, the biggest risk to it, and what would change your mind.","min_words":120,"points":50}
 ]}$j$::jsonb,
 '{promotion_assessment_associate}', true, now());

-- Professional / timed settings
update public.challenges set pitch_format = 'quick', time_limit_minutes = 30 where slug in ('stock-pitch-quick-bdo', 'stock-pitch-quick-open');
update public.challenges set pitch_format = 'professional', duration_days = 5 where slug = 'stock-pitch-professional';
update public.challenges set duration_days = 7 where slug = 'equity-research-initiation';
update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug = 'promotion-assessment-associate';

-- Answer keys (admin-only table)
insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('accounting-three-statements', $j${
   "gp":{"answer":48,"tolerance_pct":1},"gm":{"answer":40,"tolerance_pct":1},
   "ebit_m":{"answer":15,"tolerance_pct":1},"ni":{"answer":12,"tolerance_pct":1},
   "capex":{"answer":"b"},
   "ocf":{"keywords":["depreciation|non-cash|amortization","working capital|receivable|inventor|payable","accrual|timing|recogni"],"keywords_required":3}}$j$),
 ('accounting-working-capital', $j${
   "dso":{"answer":40,"tolerance_pct":1},"dio":{"answer":50,"tolerance_pct":1},
   "dpo":{"answer":30,"tolerance_pct":1},"ccc":{"answer":60,"tolerance_pct":1},
   "improve":{"keywords":["collect|receivable|credit terms|dso","inventory|stock|sku|dio","supplier|payable|payment terms|dpo","trade-off|tradeoff|risk|relationship|stockout|sales"],"keywords_required":4}}$j$),
 ('financial-analysis-ratio-diagnostics', $j${
   "growth":{"answer":12,"tolerance_pct":1},"gm25":{"answer":24,"tolerance_pct":1},
   "nm25":{"answer":2.8,"tolerance_pct":1.5},"roe":{"answer":12.54,"tolerance_pct":1},
   "cr":{"answer":1.2,"tolerance_pct":1},"qr":{"answer":0.67,"tolerance_pct":1.5},
   "diag":{"keywords":["gross margin|margin","price|promotion|discount|mix","cost|cogs|supplier|input","operating leverage|opex|efficien|expense","inventory|liquidity|quick ratio"],"keywords_required":4}}$j$),
 ('financial-analysis-forecast-build', $j${
   "rev":{"answer":880,"tolerance_pct":0.5},"gp":{"answer":308,"tolerance_pct":0.5},
   "ebit":{"answer":149.6,"tolerance_pct":0.5},"ni":{"answer":112.2,"tolerance_pct":0.5},
   "em":{"answer":17,"tolerance_pct":1},
   "sens":{"keywords":["gross margin|margin","growth|volume|revenue","operating leverage|fixed cost|opex","scenario|sensitiv|stress|downside|range"],"keywords_required":3}}$j$),
 ('valuation-multiples-pe-pb', $j${
   "pe_tp":{"answer":50.4,"tolerance_pct":1},"pb_tp":{"answer":48,"tolerance_pct":1},
   "blend":{"answer":49.2,"tolerance_pct":1},"upside":{"answer":17.14,"tolerance_pct":2},
   "rating":{"answer":"buy"},
   "why_pb":{"keywords":["bank|financial|asset-heavy|asset heavy|book value","cyclical|volatil|negative|loss","roe|return on equity|cost of equity"],"keywords_required":2}}$j$),
 ('valuation-dcf-simplified', $j${
   "pv_fcf":{"answer":272.73,"tolerance_pct":1},"tv":{"answer":1780.43,"tolerance_pct":1},
   "pv_tv":{"answer":1337.66,"tolerance_pct":1},"ev":{"answer":1610.39,"tolerance_pct":1},
   "vps":{"answer":26.21,"tolerance_pct":1},
   "sens":{"keywords":["terminal value|terminal","wacc|discount rate","growth","sensitiv|range|scenario|table"],"keywords_required":3}}$j$),
 ('equity-research-earnings-note', $j${
   "eps_beat":{"answer":10,"tolerance_pct":1.5},"rev_beat":{"answer":2.75,"tolerance_pct":2},
   "capex":{"answer":10,"tolerance_pct":1},
   "note":{"keywords":["beat|above consensus|ahead","margin|ebitda","capex|capital expenditure","free cash flow|fcf|dividend","rating|buy|hold|sell|target"],"keywords_required":4}}$j$),
 ('portfolio-construction-basics', $j${
   "er":{"answer":8,"tolerance_pct":1},"sharpe":{"answer":0.25,"tolerance_pct":2},
   "hhi":{"answer":0.30,"tolerance_pct":1},"eff_n":{"answer":3.33,"tolerance_pct":1.5},
   "rebal":{"answer":"b"},
   "memo":{"keywords":["risk|volatil|drawdown","target|mandate|band|allocation","rebalanc","discipline|sell high|buy low|drift"],"keywords_required":3}}$j$),
 ('ib-accretion-dilution', $j${
   "sa_eps":{"answer":5,"tolerance_pct":1},"pf_eps":{"answer":4.75,"tolerance_pct":1},
   "ad":{"answer":-5,"tolerance_pct":2},"verdict":{"answer":"dilutive"},
   "be_syn":{"answer":40,"tolerance_pct":1},
   "why":{"keywords":["strategic|long-term|long term","growth","synerg","roic|return on invested capital|value creation|cost of capital","overpay|premium|control"],"keywords_required":3}}$j$),
 ('case-investment-committee-expansion', $j${
   "npv":{"answer":30.03,"tolerance_pct":2},"irr":{"answer":12.42,"tolerance_pct":2},
   "npv_down":{"answer":-75.98,"tolerance_pct":2},"decision":{"answer":"approve_conditions"},
   "memo":{"keywords":["npv","irr","wacc|hurdle","risk","downside|sensitiv|scenario","recommend","condition|phase|contract"],"keywords_required":5},
   "defense":{"keywords":["downside|20%|lower volume","negative|npv|value destr","break-even|breakeven","phase|option|contract|mitigat"],"keywords_required":3}}$j$),
 ('promotion-assessment-associate', $j${
   "wacc":{"answer":9.3,"tolerance_pct":1},"ev":{"answer":2000,"tolerance_pct":0.5},
   "tp":{"answer":20,"tolerance_pct":1},"rating":{"answer":"buy"},
   "view":{"keywords":["ev/ebitda|multiple","upside|target","risk","cyclical|construction|demand|volume","catalyst","change my mind|would change|wrong if|invalidat"],"keywords_required":4}}$j$)
) as k(slug, answers) on k.slug = c.slug;

-- ---------------------------------------------------------------------
-- COMPETITION (season 1 of the beta)
-- ---------------------------------------------------------------------
insert into public.competitions (slug, name, description, rules, starts_at, ends_at, registration_deadline,
                                 participant_limit, scoring_method, is_published)
values ('finlab-beta-cup-s1', 'FINLAB Beta Cup — Season 1',
 'A two-week sprint across financial analysis, valuation and a quick stock pitch. Scores count only for attempts started from the competition page.',
 $md$
- Register before the deadline, then start each challenge **from this page**.
- Your best score on each competition challenge counts (sum across challenges).
- Ties are broken by earliest final submission.
- Results are finalized by an administrator after the end date and award Leadership evidence.
$md$,
 now() - interval '1 day', now() + interval '14 days', now() + interval '10 days', 100, 'sum', true);

insert into public.competition_challenges (competition_id, challenge_id, weight, position)
select (select id from public.competitions where slug = 'finlab-beta-cup-s1'), c.id, 1, x.pos
from (values ('financial-analysis-ratio-diagnostics', 1), ('valuation-multiples-pe-pb', 2), ('stock-pitch-quick-open', 3)) as x(slug, pos)
join public.challenges c on c.slug = x.slug;

-- ---------------------------------------------------------------------
-- MARKET EVENTS (manually configured)
-- ---------------------------------------------------------------------
with e as (
  insert into public.market_events (title, description, category, region, affected_securities, price_impacts, status, opens_at, closes_at)
  values ('BSP announces an unexpected 50bp rate hike',
   $md$
The Bangko Sentral ng Pilipinas surprised the market with a **50 basis point** hike to its policy rate, citing renewed inflation pressure from food prices and a weaker peso. Consensus had expected no change.

**How do you respond?** Consider banks (net interest margins), property developers (mortgage demand, valuation multiples), and consumer names.
$md$,
   'macro', 'PH', '{PSE:BDO,PSE:BPI,PSE:ALI,PSE:SM,PSE:MER}',
   '{"PSE:BDO":2.0,"PSE:BPI":2.0,"PSE:ALI":-6.0,"PSE:SM":-3.0,"PSE:MER":-1.0}', 'open', now(), now() + interval '7 days')
  returning id)
insert into public.market_event_keys (event_id, best_actions, acceptable_actions, keywords)
select id, '{rebalance,sell}', '{hold}',
       '{"net interest margin|nim|lending spread","property|real estate|developer|mortgage","valuation|discount rate|multiple|cost of capital","inflation|peso|currency"}'
from e;

with e as (
  insert into public.market_events (title, description, category, region, affected_securities, price_impacts, status, opens_at, closes_at)
  values ('Jollibee reports Q3 same-store sales growth of 9%, above guidance',
   $md$
Jollibee Foods reported **9% same-store sales growth** for Q3 against guidance of 5–7%, driven by the Philippines and North America. Management kept full-year margin guidance unchanged, citing commodity costs.

**How do you respond?**
$md$,
   'company', 'PH', '{PSE:JFC}', '{"PSE:JFC":5.0}', 'open', now(), now() + interval '7 days')
  returning id)
insert into public.market_event_keys (event_id, best_actions, acceptable_actions, keywords)
select id, '{buy,hold}', '{rebalance}',
       '{"same-store|sss|same store","margin|commodity|cost","valuation|p/e|multiple|priced in","international|north america|expansion"}'
from e;
