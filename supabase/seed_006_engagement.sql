-- =====================================================================
-- FINLAB — Content v6: flashcards, capstones, daily challenges, achievements
-- Run AFTER migration 0010. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Flashcards (10 per lesson)
-- ---------------------------------------------------------------------
insert into public.flashcards (lesson_id, position, front, back)
select l.id, v.pos, v.front, v.back
from (values
('three-statements',1,'What does the income statement measure?','Profitability over a period: revenue minus expenses equals net income.'),
('three-statements',2,'State the balance sheet identity.','Assets = Liabilities + Equity.'),
('three-statements',3,'Where does net income go on the balance sheet?','Into retained earnings (equity), after dividends.'),
('three-statements',4,'Why is depreciation added back in operating cash flow?','It reduces net income but is a non-cash expense.'),
('three-statements',5,'Which statements does a cash purchase of equipment affect immediately?','Balance sheet (PP&E up, cash down) and the cash flow statement (investing outflow).'),
('three-statements',6,'Gross profit =','Revenue − cost of goods sold.'),
('three-statements',7,'EBIT =','Gross profit − operating expenses (operating profit).'),
('three-statements',8,'Ending cash on the cash flow statement must equal…','Cash on the balance sheet.'),
('three-statements',9,'Where does interest expense appear?','Income statement (below EBIT); the debt itself sits on the balance sheet.'),
('three-statements',10,'Analyst habit when a number changes?','Ask "where does the other side of this entry go?"'),
('cash-flow-statement',1,'The indirect method starts from…','Net income.'),
('cash-flow-statement',2,'Effect of an increase in receivables on CFO?','Reduces CFO — sales were booked but cash not collected.'),
('cash-flow-statement',3,'Effect of an increase in payables on CFO?','Increases CFO — expenses booked but not yet paid.'),
('cash-flow-statement',4,'Free cash flow (simple) =','Cash flow from operations − capital expenditure.'),
('cash-flow-statement',5,'Section for dividends paid?','Financing activities.'),
('cash-flow-statement',6,'Section for buying a subsidiary?','Investing activities.'),
('cash-flow-statement',7,'Section for issuing bonds?','Financing activities (inflow).'),
('cash-flow-statement',8,'Effect of an increase in inventory on CFO?','Reduces CFO — cash spent on stock not yet sold.'),
('cash-flow-statement',9,'Net change in cash =','CFO + investing cash flow + financing cash flow.'),
('cash-flow-statement',10,'Red flag: net income rising, CFO falling. Likely cause?','Receivables or inventory absorbing cash (check earnings quality).'),
('ratio-analysis',1,'Gross margin =','Gross profit ÷ revenue.'),
('ratio-analysis',2,'ROE =','Net income ÷ average shareholders'' equity.'),
('ratio-analysis',3,'Why use average equity for ROE?','Income is earned over the year; balance sheets are point-in-time.'),
('ratio-analysis',4,'Quick ratio =','(Current assets − inventory) ÷ current liabilities.'),
('ratio-analysis',5,'Current ratio =','Current assets ÷ current liabilities.'),
('ratio-analysis',6,'DuPont: ROE =','Net margin × asset turnover × equity multiplier.'),
('ratio-analysis',7,'Asset turnover =','Revenue ÷ average total assets.'),
('ratio-analysis',8,'Equity multiplier =','Total assets ÷ equity (a leverage measure).'),
('ratio-analysis',9,'Revenue +12% but gross margin −100bp suggests…','Discounting, mix shift or rising input costs.'),
('ratio-analysis',10,'The four ratio families?','Growth, profitability, returns, liquidity & leverage.'),
('credit-analysis',1,'A lender''s core question?','Will I be repaid? — focus on cash flow to service debt.'),
('credit-analysis',2,'Net debt =','Total debt − cash.'),
('credit-analysis',3,'Net leverage =','Net debt ÷ EBITDA.'),
('credit-analysis',4,'Interest coverage =','EBITDA (or EBIT) ÷ interest expense.'),
('credit-analysis',5,'Comfortable vs aggressive net leverage (rule of thumb)?','Below ~2.5x comfortable; above ~4x aggressive.'),
('credit-analysis',6,'What is a covenant?','A loan condition, e.g. net debt/EBITDA ≤ 3.0x; breaching it lets lenders act.'),
('credit-analysis',7,'Covenant headroom (EBITDA) =','1 − (net debt ÷ covenant multiple) ÷ EBITDA.'),
('credit-analysis',8,'Standard credit stress test?','Cut EBITDA (e.g. −20%) and recompute leverage and coverage.'),
('credit-analysis',9,'What can lenders do after a breach?','Demand repayment, reprice, or renegotiate with tighter terms.'),
('credit-analysis',10,'Name two structural protections in a loan.','E.g. collateral, amortization, staged funding, reporting covenants.'),
('valuation-multiples',1,'P/E target price =','EPS × target P/E.'),
('valuation-multiples',2,'P/B target price =','Book value per share × target P/B.'),
('valuation-multiples',3,'Why use the median peer multiple?','Less affected by outliers than the mean.'),
('valuation-multiples',4,'When is P/B preferred?','Banks, insurers and asset-heavy businesses.'),
('valuation-multiples',5,'Justified P/B =','(ROE − g) ÷ (cost of equity − g).'),
('valuation-multiples',6,'P/B above 1 is justified when…','ROE exceeds the cost of equity.'),
('valuation-multiples',7,'Upside =','(Target − current price) ÷ current price.'),
('valuation-multiples',8,'Common rating convention?','BUY ≥ +10% upside, SELL ≤ −10%, otherwise HOLD.'),
('valuation-multiples',9,'When is P/E unreliable?','Negative or highly cyclical earnings.'),
('valuation-multiples',10,'Why EV/EBITDA across different leverage?','It is capital-structure neutral and before D&A.'),
('cost-of-capital',1,'CAPM cost of equity =','Risk-free rate + beta × market risk premium.'),
('cost-of-capital',2,'After-tax cost of debt =','Pre-tax cost of debt × (1 − tax rate).'),
('cost-of-capital',3,'Why after-tax for debt?','Interest is tax-deductible.'),
('cost-of-capital',4,'WACC =','E/(D+E) × kₑ + D/(D+E) × k_d × (1 − t).'),
('cost-of-capital',5,'What weights should WACC use?','Market values where possible.'),
('cost-of-capital',6,'Effect of higher beta?','Higher cost of equity, higher WACC.'),
('cost-of-capital',7,'WACC is the discount rate for…','Free cash flow to the firm (FCFF).'),
('cost-of-capital',8,'Project IRR 9%, WACC 10% →','Destroys value.'),
('cost-of-capital',9,'Why not keep adding debt to lower WACC?','Financial distress risk raises the costs of debt and equity.'),
('cost-of-capital',10,'WACC as a hurdle rate means…','Projects must earn more than WACC to create value.'),
('dcf-fundamentals',1,'FCFF =','EBIT × (1 − t) + D&A − capex − increase in NWC.'),
('dcf-fundamentals',2,'Present value of a cash flow =','CFₜ ÷ (1 + WACC)ᵗ.'),
('dcf-fundamentals',3,'Gordon growth terminal value =','FCFₙ × (1 + g) ÷ (WACC − g).'),
('dcf-fundamentals',4,'Terminal growth must be…','Below WACC and long-run nominal GDP growth.'),
('dcf-fundamentals',5,'Equity value =','Enterprise value − net debt.'),
('dcf-fundamentals',6,'Typical terminal value share of EV?','Often 60–80%.'),
('dcf-fundamentals',7,'Discount a Year-2 terminal value by…','(1 + WACC)².'),
('dcf-fundamentals',8,'How to present DCF uncertainty?','A range plus a WACC × growth sensitivity table.'),
('dcf-fundamentals',9,'Value per share =','Equity value ÷ diluted shares.'),
('dcf-fundamentals',10,'Inputs that move a DCF most?','WACC, terminal growth and margins.'),
('equity-research-report',1,'Where does the call go?','First — in the investment thesis.'),
('equity-research-report',2,'Industry overview covers…','Market size, growth, structure and regulation.'),
('equity-research-report',3,'Competitive analysis covers…','Positioning, moat and market share.'),
('equity-research-report',4,'Forecast assumptions must be…','Justified by history, guidance and evidence.'),
('equity-research-report',5,'Valuation section includes…','Method, key inputs, target price and sensitivity.'),
('equity-research-report',6,'Catalysts are…','Dated events that can close the gap between price and value.'),
('equity-research-report',7,'A strong risks section explains…','What would make you wrong and which signals to monitor.'),
('equity-research-report',8,'Writing rule: paragraphs?','One idea per paragraph.'),
('equity-research-report',9,'Writing rule: order?','Lead with conclusions, support with numbers.'),
('equity-research-report',10,'Sections in the FINLAB report structure?','11, including Sources.'),
('stock-pitch-structure',1,'The 30-second pitch formula?','Rating + target + upside, why the market is wrong, the catalyst.'),
('stock-pitch-structure',2,'Variant perception =','What you believe that consensus does not, and why.'),
('stock-pitch-structure',3,'A strong catalyst is…','Specific and dated (e.g. Q4 results on 15 Feb).'),
('stock-pitch-structure',4,'A weak thesis point looks like…','"Great management" or "strong brand" — not quantified or testable.'),
('stock-pitch-structure',5,'BUY with 3% upside?','Inconsistent — under ±10% it implies HOLD.'),
('stock-pitch-structure',6,'Pitch risks should include…','What breaks the thesis and the signal you will monitor.'),
('stock-pitch-structure',7,'Best pitch sources?','Annual reports, exchange filings, regulator data.'),
('stock-pitch-structure',8,'What does a PM want first?','The call: rating, target and why.'),
('stock-pitch-structure',9,'"What makes you wrong?" — a bad answer?','"Nothing." Overconfidence destroys credibility.'),
('stock-pitch-structure',10,'Order of a full pitch?','Recommendation, thesis, variant view, catalysts, valuation, risks, sources.'),
('portfolio-construction',1,'Portfolio expected return =','Σ weightᵢ × expected returnᵢ.'),
('portfolio-construction',2,'Sharpe ratio =','(Portfolio return − risk-free rate) ÷ volatility.'),
('portfolio-construction',3,'HHI =','Σ weightᵢ² (concentration).'),
('portfolio-construction',4,'Effective number of positions =','1 ÷ HHI.'),
('portfolio-construction',5,'Why diversify?','Imperfectly correlated assets reduce volatility for the same expected return.'),
('portfolio-construction',6,'Lower correlation does what to portfolio volatility?','Lowers it.'),
('portfolio-construction',7,'Portfolio drift =','Market moves push weights (and risk) away from target.'),
('portfolio-construction',8,'Purpose of rebalancing?','Restore the intended risk exposure.'),
('portfolio-construction',9,'Two ways to schedule rebalancing?','Calendar-based or when weights breach a band.'),
('portfolio-construction',10,'FINLAB simulator rule for every trade?','A written rationale.'),
('accretion-dilution',1,'Pro forma EPS =','(Acquirer NI + target NI + after-tax synergies − financing costs) ÷ (old + new shares).'),
('accretion-dilution',2,'Accretive means…','Pro forma EPS is higher than standalone EPS.'),
('accretion-dilution',3,'All-stock rule of thumb?','Accretive if the target''s P/E is below the acquirer''s.'),
('accretion-dilution',4,'Break-even synergies =','Synergies needed for pro forma EPS to equal standalone EPS.'),
('accretion-dilution',5,'Why can accretion mislead?','Cheap financing can show accretion even when overpaying.'),
('accretion-dilution',6,'The real value test for M&A?','Return on invested capital versus the cost of capital.'),
('accretion-dilution',7,'Effect of issuing more new shares?','More dilution, all else equal.'),
('accretion-dilution',8,'Why might a dilutive deal still be approved?','Strategic fit, growth or long-term value creation.'),
('accretion-dilution',9,'After-tax synergies flow to…','Pro forma net income.'),
('accretion-dilution',10,'Accretion / dilution % =','Pro forma EPS ÷ standalone EPS − 1.'),
('investment-committee-memo',1,'First thing in an IC memo?','The recommendation.'),
('investment-committee-memo',2,'NPV =','PV of future cash flows − upfront investment.'),
('investment-committee-memo',3,'Decision rule with NPV?','Approve if NPV > 0 at the hurdle rate.'),
('investment-committee-memo',4,'IRR =','The discount rate that makes NPV zero.'),
('investment-committee-memo',5,'IRR above the hurdle rate implies…','Positive NPV (conventional project).'),
('investment-committee-memo',6,'Break-even volume =','Volume at which NPV = 0.'),
('investment-committee-memo',7,'The classic IC downside question?','"What if volumes are 20% below plan?"'),
('investment-committee-memo',8,'Typical approval conditions?','Phasing, customer contracts, stop-loss triggers.'),
('investment-committee-memo',9,'What does the committee attack?','The assumption that matters most.'),
('investment-committee-memo',10,'Why propose phasing?','It creates an option to stop before committing all capital.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;

-- ---------------------------------------------------------------------
-- 2. Capstones (added after the final exam of each certification)
-- ---------------------------------------------------------------------
update public.certification_programs p set estimated_hours = estimated_hours + 2
 where p.slug in ('financial-statement-analyst','equity-valuation-analyst','equity-research-associate')
   and not exists (select 1 from public.program_modules m where m.program_id = p.id and m.kind = 'capstone');

insert into public.program_modules (program_id, position, kind, min_score, config)
select p.id, (select coalesce(max(position), 0) + 1 from public.program_modules m where m.program_id = p.id), 'capstone', 70, v.config::jsonb
from (values
('financial-statement-analyst', $j${"title":"Capstone: present a financial health review","minutes":120,
  "brief":"Pick any PSE- or US-listed company. Record a 5–8 minute presentation (camera or screen-recording with voice) reviewing its last three years: how the statements link, cash conversion, margins and returns, liquidity and leverage, and one earnings-quality concern. Close with a one-sentence verdict on financial health.",
  "deliverables":["A link to your recorded presentation (YouTube unlisted, Google Drive, Loom, Vimeo, Canva or OneDrive)","Optional: a link to your slides","A 150+ word executive summary"],
  "rubric":[{"key":"structure","label":"Structure & clarity","max":25},{"key":"analysis","label":"Accuracy of financial analysis","max":30},{"key":"insight","label":"Insight & earnings-quality judgment","max":25},{"key":"delivery","label":"Delivery","max":20}]}$j$),
('equity-valuation-analyst', $j${"title":"Capstone: defend a valuation","minutes":150,
  "brief":"Value one listed company using at least two methods (multiples and a DCF). Record a 6–10 minute presentation: key assumptions, WACC build, valuation range with a sensitivity table, blended target price and rating. End with the one assumption you would defend hardest in front of an investment committee.",
  "deliverables":["A link to your recorded presentation","Optional: a link to your slides or model","A 150+ word executive summary"],
  "rubric":[{"key":"methods","label":"Method selection & mechanics","max":30},{"key":"assumptions","label":"Assumptions & sensitivity","max":30},{"key":"conclusion","label":"Target price & rating logic","max":20},{"key":"delivery","label":"Delivery & Q&A readiness","max":20}]}$j$),
('equity-research-associate', $j${"title":"Capstone: pitch to the investment committee","minutes":150,
  "brief":"Record a 10-minute stock pitch as if presenting to a portfolio manager, followed by 3–5 minutes answering the three toughest questions you expect (ask yourself the questions out loud). Cover: rating and target, thesis and variant perception, catalysts with dates, valuation, risks and what would make you wrong.",
  "deliverables":["A link to your recorded pitch + Q&A","Optional: a link to your slides","A 150+ word executive summary"],
  "rubric":[{"key":"thesis","label":"Thesis & variant perception","max":30},{"key":"evidence","label":"Evidence, valuation & catalysts","max":25},{"key":"risks","label":"Risks & Q&A defense","max":25},{"key":"delivery","label":"Delivery & persuasion","max":20}]}$j$)
) as v(slug, config)
join public.certification_programs p on p.slug = v.slug
where not exists (select 1 from public.program_modules m where m.program_id = p.id and m.kind = 'capstone');


-- ---------------------------------------------------------------------
-- 3. Achievements
-- ---------------------------------------------------------------------
insert into public.achievements (id, name, description, icon, tier, criteria, sort_order) values
 ('streak_7', '7-Day Streak', 'Active on FINLAB seven days in a row.', 'flag', 'bronze', '{"type":"metric","metric":"streak_longest","gte":7}', 20),
 ('streak_30', '30-Day Streak', 'Active on FINLAB thirty days in a row.', 'crown', 'gold', '{"type":"metric","metric":"streak_longest","gte":30}', 21),
 ('flashcards_100', 'Card Shark', 'Reviewed 100 flashcards.', 'library', 'bronze', '{"type":"metric","metric":"flashcards_reviewed","gte":100}', 22),
 ('flashcards_mastered_50', 'Long-Term Memory', 'Mastered 50 flashcards (21+ day interval).', 'target', 'silver', '{"type":"metric","metric":"flashcards_mastered","gte":50}', 23),
 ('peer_reviewer', 'Peer Reviewer', 'Wrote 5 peer reviews of stock pitches.', 'presentation', 'bronze', '{"type":"metric","metric":"peer_reviews_given","gte":5}', 24),
 ('trusted_reviewer', 'Trusted Reviewer', '3 of your peer reviews were rated 4+ for helpfulness.', 'medal', 'silver', '{"type":"metric","metric":"helpful_reviews","gte":3}', 25),
 ('daily_10', 'Daily Grinder', 'Answered 10 daily challenges correctly.', 'trending-up', 'bronze', '{"type":"metric","metric":"daily_correct","gte":10}', 26),
 ('capstone_passed', 'Capstone Presenter', 'Passed a certification capstone presentation.', 'trophy', 'gold', '{"type":"metric","metric":"capstones_passed","gte":1}', 27),
 ('first_certificate', 'Certified', 'Earned your first FINLAB certificate.', 'award', 'silver', '{"type":"metric","metric":"certificates_earned","gte":1}', 28)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. Daily challenge bank (rotates daily; answers revealed after answering)
-- ---------------------------------------------------------------------
insert into public.daily_questions (slug, category_id, type, prompt, options, unit, explanation)
select v.slug, v.cat, v.type, v.prompt, v.options::jsonb, v.unit, v.explanation
from (values
('d01','accounting','numeric','Revenue ₱800m, COGS ₱500m. Gross margin (%)?',null,'%','Gross profit 300 ÷ revenue 800 = 37.5%.'),
('d02','accounting','mcq','A company pays ₱2m of next year''s rent in advance. On the balance sheet this is…','[{"id":"a","label":"A liability"},{"id":"b","label":"A prepaid asset"},{"id":"c","label":"An expense this year"},{"id":"d","label":"Equity"}]',null,'Prepaid expenses are assets until the period they relate to.'),
('d03','accounting','numeric','Net income ₱90m, D&A ₱30m, working capital increased ₱20m. CFO (₱m)?',null,'₱m','90 + 30 − 20 = 100.'),
('d04','accounting','mcq','Which is NOT a cash flow from operations item?','[{"id":"a","label":"Increase in payables"},{"id":"b","label":"Depreciation add-back"},{"id":"c","label":"Repayment of a bank loan"},{"id":"d","label":"Increase in inventory"}]',null,'Repaying debt is a financing activity.'),
('d05','financial_analysis','numeric','Net income ₱60m, average equity ₱400m. ROE (%)?',null,'%','60 ÷ 400 = 15%.'),
('d06','financial_analysis','numeric','Current assets ₱500m incl. ₱200m inventory; current liabilities ₱250m. Quick ratio (x)?',null,'x','(500 − 200) ÷ 250 = 1.2x.'),
('d07','financial_analysis','mcq','Net margin 4%, asset turnover 2.5x, equity multiplier 2x. ROE?','[{"id":"a","label":"8%"},{"id":"b","label":"10%"},{"id":"c","label":"20%"},{"id":"d","label":"40%"}]',null,'DuPont: 4% × 2.5 × 2 = 20%.'),
('d08','financial_analysis','numeric','Revenue grew from ₱1,250m to ₱1,400m. Growth (%)?',null,'%','1,400 ÷ 1,250 − 1 = 12%.'),
('d09','valuation','numeric','EPS ₱3.20 and target P/E 15x. Target price (₱)?',null,'₱','3.20 × 15 = ₱48.'),
('d10','valuation','numeric','BVPS ₱60, ROE 15%, cost of equity 12%, growth 6%. Justified P/B (x)?',null,'x','(15 − 6) ÷ (12 − 6) = 1.5x.'),
('d11','valuation','mcq','Target ₱110, price ₱100 (±10% convention). Rating?','[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}]',null,'+10% upside meets the BUY threshold.'),
('d12','valuation','numeric','FCF ₱50m next year growing 4% forever, WACC 9%. Value (₱m)?',null,'₱m','50 ÷ (9% − 4%) = ₱1,000m.'),
('d13','valuation','numeric','EV ₱2,000m, net debt ₱500m, 50m shares. Value per share (₱)?',null,'₱','(2,000 − 500) ÷ 50 = ₱30.'),
('d14','valuation','numeric','Risk-free 6%, beta 0.8, MRP 5%. Cost of equity (%)?',null,'%','6% + 0.8 × 5% = 10%.'),
('d15','valuation','numeric','60% equity at 12%, 40% debt at 6% after tax. WACC (%)?',null,'%','0.6 × 12% + 0.4 × 6% = 9.6%.'),
('d16','valuation','mcq','Which method is most capital-structure neutral?','[{"id":"a","label":"P/E"},{"id":"b","label":"EV/EBITDA"},{"id":"c","label":"Dividend yield"},{"id":"d","label":"P/B"}]',null,'EV/EBITDA uses enterprise value and pre-interest earnings.'),
('d17','equity_research','numeric','EPS actual ₱1.10 vs consensus ₱1.00. Surprise (%)?',null,'%','1.10 ÷ 1.00 − 1 = 10%.'),
('d18','equity_research','mcq','Revenue +10% but receivables +40%. This most likely signals…','[{"id":"a","label":"Strong collections"},{"id":"b","label":"A possible earnings-quality issue"},{"id":"c","label":"Lower leverage"},{"id":"d","label":"Higher dividends"}]',null,'Receivables outgrowing sales can mean aggressive revenue recognition or weak collections.'),
('d19','equity_research','numeric','Revenue ₱730m, receivables ₱100m (365 days). DSO (days)?',null,'days','100 ÷ 730 × 365 = 50 days.'),
('d20','equity_research','numeric','REIT dividend per unit ₱2.10, target yield 7%. Target price (₱)?',null,'₱','2.10 ÷ 7% = ₱30.'),
('d21','stock_pitch','mcq','Which is a variant perception?','[{"id":"a","label":"The company is a market leader"},{"id":"b","label":"Consensus expects flat margins; we see +200bp from automation"},{"id":"c","label":"The CEO is respected"},{"id":"d","label":"The stock fell last month"}]',null,'A variant view is specific, testable and differs from consensus.'),
('d22','stock_pitch','numeric','Price ₱80, target ₱68. Upside (%)? (negative for downside)',null,'%','68 ÷ 80 − 1 = −15%.'),
('d23','stock_pitch','mcq','Best catalyst?','[{"id":"a","label":"Strong brand"},{"id":"b","label":"BSP decision on 14 Nov likely to hold rates, supporting NIM"},{"id":"c","label":"Cheap valuation"},{"id":"d","label":"Good management"}]',null,'Catalysts are dated events.'),
('d24','portfolio_management','numeric','70% in a 9% asset, 30% in a 4% asset. Expected return (%)?',null,'%','0.7 × 9% + 0.3 × 4% = 7.5%.'),
('d25','portfolio_management','numeric','Return 10%, risk-free 5%, volatility 20%. Sharpe ratio?',null,'','(10 − 5) ÷ 20 = 0.25.'),
('d26','portfolio_management','numeric','Weights 50%, 30%, 20%. HHI (decimal)?',null,'','0.25 + 0.09 + 0.04 = 0.38.'),
('d27','portfolio_management','mcq','Mandate 60/40, equities now 70%. The disciplined action is…','[{"id":"a","label":"Buy more equities"},{"id":"b","label":"Rebalance toward 60/40"},{"id":"c","label":"Sell all equities"},{"id":"d","label":"Do nothing"}]',null,'Rebalancing restores the agreed risk level.'),
('d28','portfolio_management','mcq','Adding an asset with low correlation to the portfolio usually…','[{"id":"a","label":"Raises volatility"},{"id":"b","label":"Lowers volatility"},{"id":"c","label":"Has no effect"},{"id":"d","label":"Guarantees higher return"}]',null,'Imperfect correlation is the source of diversification benefit.'),
('d29','investment_banking','numeric','Acquirer NI ₱600m, 200m shares; target NI ₱90m; 40m new shares. Pro forma EPS (₱)?',null,'₱','690 ÷ 240 = ₱2.875.'),
('d30','investment_banking','mcq','Using the previous numbers (standalone EPS ₱3.00), the deal is…','[{"id":"a","label":"Accretive"},{"id":"b","label":"Dilutive"},{"id":"c","label":"Neutral"}]',null,'2.875 < 3.00, so it is dilutive.'),
('d31','investment_banking','numeric','IPO fair value ₱5,000m, 10% IPO discount. Pre-money value (₱m)?',null,'₱m','5,000 × 0.9 = ₱4,500m.'),
('d32','investment_banking','mcq','All-stock deal accretion rule of thumb: accretive when the target P/E is…','[{"id":"a","label":"Higher than the acquirer''s"},{"id":"b","label":"Lower than the acquirer''s"},{"id":"c","label":"Exactly 10x"},{"id":"d","label":"Negative"}]',null,'Buying cheaper earnings with more expensive stock is accretive.'),
('d33','case_competition','numeric','Cost ₱100m, single inflow ₱110m in 1 year, hurdle 10%. NPV (₱m)?',null,'₱m','110 ÷ 1.10 − 100 = 0.'),
('d34','case_competition','mcq','IRR 14%, hurdle 11%. A conventional project should be…','[{"id":"a","label":"Rejected"},{"id":"b","label":"Approved (positive NPV)"},{"id":"c","label":"Ignored"}]',null,'IRR above the hurdle means positive NPV.'),
('d35','case_competition','numeric','Annual cash flow ₱25m, cost ₱100m. Simple payback (years)?',null,'years','100 ÷ 25 = 4 years.'),
('d36','financial_analysis','numeric','Net debt ₱1,800m, EBITDA ₱600m. Net leverage (x)?',null,'x','1,800 ÷ 600 = 3.0x.'),
('d37','financial_analysis','numeric','EBITDA ₱900m, interest ₱150m. Interest coverage (x)?',null,'x','900 ÷ 150 = 6.0x.'),
('d38','financial_analysis','numeric','Covenant 3.5x, net debt ₱2,100m. Minimum EBITDA (₱m)?',null,'₱m','2,100 ÷ 3.5 = ₱600m.'),
('d39','accounting','mcq','Interest expense on a bank loan appears on…','[{"id":"a","label":"Income statement only"},{"id":"b","label":"Balance sheet only"},{"id":"c","label":"Income statement; the loan balance on the balance sheet"},{"id":"d","label":"Nowhere"}]',null,'Interest is an expense; the principal is a liability.'),
('d40','valuation','mcq','Terminal growth set equal to WACC makes the Gordon formula…','[{"id":"a","label":"More accurate"},{"id":"b","label":"Blow up (division by zero)"},{"id":"c","label":"Equal to book value"}]',null,'TV = FCF × (1+g) ÷ (WACC − g); g = WACC divides by zero.')
) as v(slug, cat, type, prompt, options, unit, explanation)
on conflict (slug) do update set prompt = excluded.prompt, options = excluded.options, explanation = excluded.explanation, unit = excluded.unit;

insert into public.daily_question_keys (question_id, answer)
select q.id, v.answer::jsonb
from (values
('d01','{"answer":37.5,"tolerance_pct":1}'),('d02','{"answer":"b"}'),('d03','{"answer":100,"tolerance_pct":0.5}'),('d04','{"answer":"c"}'),
('d05','{"answer":15,"tolerance_pct":1}'),('d06','{"answer":1.2,"tolerance_pct":1}'),('d07','{"answer":"c"}'),('d08','{"answer":12,"tolerance_pct":1}'),
('d09','{"answer":48,"tolerance_pct":0.5}'),('d10','{"answer":1.5,"tolerance_pct":1}'),('d11','{"answer":"buy"}'),('d12','{"answer":1000,"tolerance_pct":0.5}'),
('d13','{"answer":30,"tolerance_pct":0.5}'),('d14','{"answer":10,"tolerance_pct":1}'),('d15','{"answer":9.6,"tolerance_pct":1}'),('d16','{"answer":"b"}'),
('d17','{"answer":10,"tolerance_pct":1}'),('d18','{"answer":"b"}'),('d19','{"answer":50,"tolerance_pct":1}'),('d20','{"answer":30,"tolerance_pct":0.5}'),
('d21','{"answer":"b"}'),('d22','{"answer":-15,"tolerance_pct":1}'),('d23','{"answer":"b"}'),('d24','{"answer":7.5,"tolerance_pct":1}'),
('d25','{"answer":0.25,"tolerance_pct":2}'),('d26','{"answer":0.38,"tolerance_pct":1}'),('d27','{"answer":"b"}'),('d28','{"answer":"b"}'),
('d29','{"answer":2.875,"tolerance_pct":0.5}'),('d30','{"answer":"b"}'),('d31','{"answer":4500,"tolerance_pct":0.5}'),('d32','{"answer":"b"}'),
('d33','{"answer":0,"tolerance_abs":0.5}'),('d34','{"answer":"b"}'),('d35','{"answer":4,"tolerance_pct":1}'),('d36','{"answer":3,"tolerance_pct":1}'),
('d37','{"answer":6,"tolerance_pct":1}'),('d38','{"answer":600,"tolerance_pct":0.5}'),('d39','{"answer":"c"}'),('d40','{"answer":"b"}')
) as v(slug, answer)
join public.daily_questions q on q.slug = v.slug
on conflict (question_id) do update set answer = excluded.answer;
