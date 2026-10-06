-- =====================================================================
-- FINLAB — Content v4: one video per lesson; 10-question knowledge checks.
-- Run AFTER migration 0007. Safe to re-run.
-- =====================================================================

-- 1. One video per lesson (all verified embeddable via YouTube oEmbed).
update public.lessons l set video_urls = array[v.url]
from (values
  ('three-statements',          'https://www.youtube.com/watch?v=Mcj5ES2HDqY'), -- Alex Glassey: How the three statements fit together
  ('cash-flow-statement',       'https://www.youtube.com/watch?v=8CH-6wdfz0Y'), -- Accounting Stuff: Cash flow statement, indirect method
  ('ratio-analysis',            'https://www.youtube.com/watch?v=MTq7HuvoGck'), -- The Finance Storyteller: Financial ratio analysis
  ('credit-analysis',           'https://www.youtube.com/watch?v=kc4kGlTSWeU'), -- Edspira: Debt covenants
  ('valuation-multiples',       'https://www.youtube.com/watch?v=dJPw1XmKA7Q'), -- P/E ratio explained
  ('cost-of-capital',           'https://www.youtube.com/watch?v=iAYs2VFcB8g'), -- Corporate Finance Institute: WACC
  ('dcf-fundamentals',          'https://www.youtube.com/watch?v=M8cuAJYYnTM'), -- Corporate Finance Institute: DCF model
  ('equity-research-report',    'https://www.youtube.com/watch?v=qFkoHpzt61c'), -- Breaking Into Wall Street: What's in an ER report
  ('stock-pitch-structure',     'https://www.youtube.com/watch?v=7qd0Hzaw5nU'), -- Henry Chien: How to pitch a stock
  ('portfolio-construction',    'https://www.youtube.com/watch?v=Pmlsa5-ruMk'), -- The Plain Bagel: How diversification works
  ('accretion-dilution',        'https://www.youtube.com/watch?v=rqjhxrWTlU0'), -- The Finance Storyteller: Accretion and dilution
  ('investment-committee-memo', 'https://www.youtube.com/watch?v=Fw5-wccViOM')  -- The Finance Storyteller: NPV and IRR
) as v(slug, url)
where l.slug = v.slug;

-- 2. Six more questions per lesson (q5–q10). Appended only once.
with extra(slug, questions, answers) as (values
('three-statements',
 $j$[{"id":"q5","type":"numeric","label":"Gross profit","prompt":"Revenue ₱1,000m and COGS ₱600m. Gross profit (₱m)?","unit":"₱m"},
     {"id":"q6","type":"mcq","label":"Balance sheet","prompt":"The balance sheet identity is…","options":[{"id":"a","label":"Assets = Liabilities + Equity"},{"id":"b","label":"Revenue − Expenses = Equity"},{"id":"c","label":"Cash = Net income"},{"id":"d","label":"Assets = Revenue"}]},
     {"id":"q7","type":"mcq","label":"Income statement","prompt":"The income statement measures…","options":[{"id":"a","label":"A snapshot at one date"},{"id":"b","label":"Profitability over a period"},{"id":"c","label":"Only cash movements"},{"id":"d","label":"Shareholder names"}]},
     {"id":"q8","type":"numeric","label":"Net income","prompt":"EBIT ₱200m, interest ₱40m, tax rate 25%. Net income (₱m)?","unit":"₱m"},
     {"id":"q9","type":"mcq","label":"Cash link","prompt":"Ending cash on the cash flow statement must equal…","options":[{"id":"a","label":"Net income"},{"id":"b","label":"Cash on the balance sheet"},{"id":"c","label":"Revenue"},{"id":"d","label":"Retained earnings"}]},
     {"id":"q10","type":"mcq","label":"Capex","prompt":"Capital expenditure increases which balance sheet item?","options":[{"id":"a","label":"Accounts payable"},{"id":"b","label":"Property, plant & equipment"},{"id":"c","label":"Retained earnings"},{"id":"d","label":"Inventory"}]}]$j$,
 $j${"q5":{"answer":400,"tolerance_pct":0.5},"q6":{"answer":"a"},"q7":{"answer":"b"},"q8":{"answer":120,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"b"}}$j$),
('cash-flow-statement',
 $j$[{"id":"q5","type":"mcq","label":"Payables","prompt":"An increase in accounts payable…","options":[{"id":"a","label":"Increases operating cash flow"},{"id":"b","label":"Reduces operating cash flow"},{"id":"c","label":"Is an investing outflow"},{"id":"d","label":"Has no effect"}]},
     {"id":"q6","type":"numeric","label":"CFO build","prompt":"Net income ₱200m, D&A ₱50m, receivables +₱30m, inventory −₱10m (a decrease), payables +₱20m. CFO (₱m)?","unit":"₱m"},
     {"id":"q7","type":"mcq","label":"Share issue","prompt":"Issuing new shares for cash is…","options":[{"id":"a","label":"An operating inflow"},{"id":"b","label":"An investing inflow"},{"id":"c","label":"A financing inflow"},{"id":"d","label":"Not on the cash flow statement"}]},
     {"id":"q8","type":"numeric","label":"Net change","prompt":"CFO ₱300m, investing −₱120m, financing −₱80m. Net change in cash (₱m)?","unit":"₱m"},
     {"id":"q9","type":"mcq","label":"Indirect method","prompt":"The indirect method starts from…","options":[{"id":"a","label":"Revenue"},{"id":"b","label":"Net income"},{"id":"c","label":"Ending cash"},{"id":"d","label":"EBITDA"}]},
     {"id":"q10","type":"mcq","label":"Red flag","prompt":"Net income keeps rising but CFO falls. The most common reason is…","options":[{"id":"a","label":"Receivables or inventory are absorbing cash"},{"id":"b","label":"Depreciation is too high"},{"id":"c","label":"The company paid a dividend"},{"id":"d","label":"Tax rates fell"}]}]$j$,
 $j${"q5":{"answer":"a"},"q6":{"answer":250,"tolerance_pct":0.5},"q7":{"answer":"c"},"q8":{"answer":100,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"a"}}$j$),
('ratio-analysis',
 $j$[{"id":"q5","type":"numeric","label":"Gross margin","prompt":"Gross profit ₱300m on revenue ₱1,000m. Gross margin (%)?","unit":"%"},
     {"id":"q6","type":"numeric","label":"Net margin","prompt":"Net income ₱50m on revenue ₱1,000m. Net margin (%)?","unit":"%"},
     {"id":"q7","type":"numeric","label":"Current ratio","prompt":"Current assets ₱900m, current liabilities ₱600m. Current ratio (x)?","unit":"x"},
     {"id":"q8","type":"mcq","label":"Averages","prompt":"Why use average equity for ROE?","options":[{"id":"a","label":"Income is earned over a year, balance sheets are point-in-time"},{"id":"b","label":"It always gives a higher ROE"},{"id":"c","label":"Accounting rules require it"},{"id":"d","label":"Equity never changes"}]},
     {"id":"q9","type":"numeric","label":"DuPont ROE","prompt":"Net margin 5%, asset turnover 2.0x, equity multiplier 1.5x. ROE (%)?","unit":"%"},
     {"id":"q10","type":"mcq","label":"Ratio family","prompt":"Net debt / EBITDA belongs to which family?","options":[{"id":"a","label":"Growth"},{"id":"b","label":"Profitability"},{"id":"c","label":"Leverage"},{"id":"d","label":"Valuation"}]}]$j$,
 $j${"q5":{"answer":30,"tolerance_pct":1},"q6":{"answer":5,"tolerance_pct":1},"q7":{"answer":1.5,"tolerance_pct":1},"q8":{"answer":"a"},"q9":{"answer":15,"tolerance_pct":1},"q10":{"answer":"c"}}$j$),
('credit-analysis',
 $j$[{"id":"q5","type":"numeric","label":"Net leverage","prompt":"Debt ₱3,000m, cash ₱500m, EBITDA ₱1,000m. Net debt / EBITDA (x)?","unit":"x"},
     {"id":"q6","type":"mcq","label":"Benchmark","prompt":"Net leverage under about 2.5x is generally considered…","options":[{"id":"a","label":"Comfortable"},{"id":"b","label":"Aggressive"},{"id":"c","label":"A default"},{"id":"d","label":"Irrelevant"}]},
     {"id":"q7","type":"numeric","label":"Minimum EBITDA","prompt":"Covenant: net debt / EBITDA ≤ 3.0x. Net debt is ₱2,400m. Minimum EBITDA to comply (₱m)?","unit":"₱m"},
     {"id":"q8","type":"numeric","label":"Headroom","prompt":"Same covenant and net debt, current EBITDA ₱1,000m. How far (%) can EBITDA fall before a breach?","unit":"%"},
     {"id":"q9","type":"mcq","label":"Breach","prompt":"If a covenant is breached, lenders can typically…","options":[{"id":"a","label":"Demand repayment or renegotiate terms"},{"id":"b","label":"Do nothing"},{"id":"c","label":"Buy the company's shares at a discount"},{"id":"d","label":"Lower the interest rate"}]},
     {"id":"q10","type":"mcq","label":"Stress test","prompt":"The best credit stress test is…","options":[{"id":"a","label":"Assume revenue doubles"},{"id":"b","label":"Cut EBITDA (e.g. −20%) and recompute leverage and coverage"},{"id":"c","label":"Ignore interest expense"},{"id":"d","label":"Use last year's share price"}]}]$j$,
 $j${"q5":{"answer":2.5,"tolerance_pct":1},"q6":{"answer":"a"},"q7":{"answer":800,"tolerance_pct":0.5},"q8":{"answer":20,"tolerance_pct":1},"q9":{"answer":"a"},"q10":{"answer":"b"}}$j$),
('valuation-multiples',
 $j$[{"id":"q5","type":"mcq","label":"Median","prompt":"Why use the median peer multiple instead of the mean?","options":[{"id":"a","label":"It is less affected by outliers"},{"id":"b","label":"It is always higher"},{"id":"c","label":"It ignores small companies"},{"id":"d","label":"Regulators require it"}]},
     {"id":"q6","type":"numeric","label":"Peer median","prompt":"Peer P/E multiples: 10x, 12x, 20x. Median (x)?","unit":"x"},
     {"id":"q7","type":"numeric","label":"Target","prompt":"EPS ₱2.00 at that median P/E. Target price (₱)?","unit":"₱"},
     {"id":"q8","type":"mcq","label":"Justified P/B","prompt":"A bank deserves to trade above book value (P/B > 1) when…","options":[{"id":"a","label":"ROE exceeds its cost of equity"},{"id":"b","label":"It has many branches"},{"id":"c","label":"Its share price is high"},{"id":"d","label":"ROE is below its cost of equity"}]},
     {"id":"q9","type":"mcq","label":"Rating","prompt":"Target ₱45, current price ₱50 (±10% convention). Rating?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}]},
     {"id":"q10","type":"mcq","label":"P/E limits","prompt":"P/E is least reliable when earnings are…","options":[{"id":"a","label":"Stable and positive"},{"id":"b","label":"Negative or highly cyclical"},{"id":"c","label":"Growing steadily"},{"id":"d","label":"Audited"}]}]$j$,
 $j${"q5":{"answer":"a"},"q6":{"answer":12,"tolerance_pct":0.5},"q7":{"answer":24,"tolerance_pct":0.5},"q8":{"answer":"a"},"q9":{"answer":"sell"},"q10":{"answer":"b"}}$j$),
('cost-of-capital',
 $j$[{"id":"q5","type":"numeric","label":"CAPM","prompt":"Risk-free 6%, beta 1.0, market risk premium 5%. Cost of equity (%)?","unit":"%"},
     {"id":"q6","type":"mcq","label":"Tax shield","prompt":"Why use the after-tax cost of debt?","options":[{"id":"a","label":"Interest is tax-deductible"},{"id":"b","label":"Debt is risk-free"},{"id":"c","label":"Lenders pay the tax"},{"id":"d","label":"Equity is taxed twice"}]},
     {"id":"q7","type":"numeric","label":"Weights","prompt":"Equity ₱600m, debt ₱400m (market values). Equity weight (%)?","unit":"%"},
     {"id":"q8","type":"mcq","label":"Use","prompt":"WACC is used as…","options":[{"id":"a","label":"The discount rate for FCFF and the hurdle rate for projects"},{"id":"b","label":"The tax rate"},{"id":"c","label":"The dividend yield"},{"id":"d","label":"The inflation rate"}]},
     {"id":"q9","type":"mcq","label":"Hurdle","prompt":"A project returns 9% when WACC is 10%. It…","options":[{"id":"a","label":"Creates value"},{"id":"b","label":"Destroys value"},{"id":"c","label":"Breaks even exactly"},{"id":"d","label":"Cannot be evaluated"}]},
     {"id":"q10","type":"mcq","label":"Market values","prompt":"Capital structure weights should ideally use…","options":[{"id":"a","label":"Book values from 10 years ago"},{"id":"b","label":"Market values"},{"id":"c","label":"Equal weights"},{"id":"d","label":"Revenue shares"}]}]$j$,
 $j${"q5":{"answer":11,"tolerance_pct":1},"q6":{"answer":"a"},"q7":{"answer":60,"tolerance_pct":0.5},"q8":{"answer":"a"},"q9":{"answer":"b"},"q10":{"answer":"b"}}$j$),
('dcf-fundamentals',
 $j$[{"id":"q5","type":"numeric","label":"FCFF","prompt":"EBIT ₱200m, tax 25%, D&A ₱30m, capex ₱50m, increase in NWC ₱10m. FCFF (₱m)?","unit":"₱m"},
     {"id":"q6","type":"numeric","label":"Two-year discount","prompt":"FCF of ₱121m in year 2 at a 10% WACC. Present value (₱m)?","unit":"₱m"},
     {"id":"q7","type":"numeric","label":"Equity value","prompt":"Enterprise value ₱1,500m, net debt ₱300m. Equity value (₱m)?","unit":"₱m"},
     {"id":"q8","type":"numeric","label":"Per share","prompt":"Equity value ₱1,200m, 100m shares. Value per share (₱)?","unit":"₱"},
     {"id":"q9","type":"mcq","label":"Terminal share","prompt":"Terminal value is often what share of enterprise value?","options":[{"id":"a","label":"Under 5%"},{"id":"b","label":"About 60–80%"},{"id":"c","label":"Exactly 50%"},{"id":"d","label":"Over 150%"}]},
     {"id":"q10","type":"mcq","label":"Presentation","prompt":"Best practice when presenting a DCF value is to…","options":[{"id":"a","label":"Give one precise number"},{"id":"b","label":"Show a range with a WACC / growth sensitivity table"},{"id":"c","label":"Hide the assumptions"},{"id":"d","label":"Round to the nearest billion"}]}]$j$,
 $j${"q5":{"answer":120,"tolerance_pct":0.5},"q6":{"answer":100,"tolerance_pct":0.5},"q7":{"answer":1200,"tolerance_pct":0.5},"q8":{"answer":12,"tolerance_pct":0.5},"q9":{"answer":"b"},"q10":{"answer":"b"}}$j$),
('equity-research-report',
 $j$[{"id":"q5","type":"mcq","label":"Industry","prompt":"Market size, growth and regulation belong in…","options":[{"id":"a","label":"Industry overview"},{"id":"b","label":"Conclusion"},{"id":"c","label":"Sources"},{"id":"d","label":"Valuation"}]},
     {"id":"q6","type":"mcq","label":"Catalysts","prompt":"Catalysts are…","options":[{"id":"a","label":"Dated events that can close the gap between price and value"},{"id":"b","label":"Reasons the company is good"},{"id":"c","label":"The analyst's opinions"},{"id":"d","label":"Historical prices"}]},
     {"id":"q7","type":"mcq","label":"Style","prompt":"Good research writing keeps…","options":[{"id":"a","label":"Several ideas per paragraph"},{"id":"b","label":"One idea per paragraph"},{"id":"c","label":"Numbers out of the text"},{"id":"d","label":"The rating hidden"}]},
     {"id":"q8","type":"mcq","label":"Valuation section","prompt":"The valuation section should include…","options":[{"id":"a","label":"Method, key inputs, target price and sensitivity"},{"id":"b","label":"Only the target price"},{"id":"c","label":"The CEO's biography"},{"id":"d","label":"Share price history only"}]},
     {"id":"q9","type":"mcq","label":"Structure","prompt":"How many sections does the FINLAB report structure have, including Sources?","options":[{"id":"a","label":"5"},{"id":"b","label":"8"},{"id":"c","label":"11"},{"id":"d","label":"15"}]},
     {"id":"q10","type":"mcq","label":"Risks","prompt":"A strong risks section explains…","options":[{"id":"a","label":"What would make you wrong and which signals you'll monitor"},{"id":"b","label":"Why there are no risks"},{"id":"c","label":"General market risk only"},{"id":"d","label":"The company's insurance policy"}]}]$j$,
 $j${"q5":{"answer":"a"},"q6":{"answer":"a"},"q7":{"answer":"b"},"q8":{"answer":"a"},"q9":{"answer":"c"},"q10":{"answer":"a"}}$j$),
('stock-pitch-structure',
 $j$[{"id":"q5","type":"mcq","label":"Opening","prompt":"The first sentence of a pitch should state…","options":[{"id":"a","label":"The rating, target price and upside"},{"id":"b","label":"The company's founding year"},{"id":"c","label":"Your background"},{"id":"d","label":"The risks"}]},
     {"id":"q6","type":"numeric","label":"Downside","prompt":"Current ₱50, target ₱40. Upside (%)? (negative for downside)","unit":"%"},
     {"id":"q7","type":"mcq","label":"Rating","prompt":"Under the ±10% convention, that call is a…","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}]},
     {"id":"q8","type":"mcq","label":"Risks","prompt":"Pitch risks should state…","options":[{"id":"a","label":"What would make you wrong and the signal you'll monitor"},{"id":"b","label":"That there are none"},{"id":"c","label":"Only macro risks"},{"id":"d","label":"Risks to other companies"}]},
     {"id":"q9","type":"mcq","label":"Sources","prompt":"The strongest sources for a pitch are…","options":[{"id":"a","label":"Annual reports, exchange filings and disclosures"},{"id":"b","label":"Anonymous forum posts"},{"id":"c","label":"Social media rumors"},{"id":"d","label":"Your own previous pitch"}]},
     {"id":"q10","type":"mcq","label":"Thesis quality","prompt":"Thesis points should be…","options":[{"id":"a","label":"Specific and quantified"},{"id":"b","label":"General, like \"great brand\""},{"id":"c","label":"As long as possible"},{"id":"d","label":"Copied from consensus"}]}]$j$,
 $j${"q5":{"answer":"a"},"q6":{"answer":-20,"tolerance_pct":1},"q7":{"answer":"sell"},"q8":{"answer":"a"},"q9":{"answer":"a"},"q10":{"answer":"a"}}$j$),
('portfolio-construction',
 $j$[{"id":"q5","type":"numeric","label":"Expected return","prompt":"50% at 12% and 50% at 6% expected return. Portfolio expected return (%)?","unit":"%"},
     {"id":"q6","type":"numeric","label":"Effective N","prompt":"Four positions of 25% each. Effective number of positions (1/HHI)?"},
     {"id":"q7","type":"mcq","label":"HHI","prompt":"An HHI of 1.0 means…","options":[{"id":"a","label":"The portfolio is a single position"},{"id":"b","label":"Perfect diversification"},{"id":"c","label":"All cash"},{"id":"d","label":"100 positions"}]},
     {"id":"q8","type":"numeric","label":"Sharpe","prompt":"Return 12%, risk-free 4%, volatility 16%. Sharpe ratio?"},
     {"id":"q9","type":"mcq","label":"Drift","prompt":"Portfolio drift means…","options":[{"id":"a","label":"Weights and risk move away from the target after market moves"},{"id":"b","label":"Fees fall over time"},{"id":"c","label":"Cash earns interest"},{"id":"d","label":"Prices are delayed"}]},
     {"id":"q10","type":"mcq","label":"FINLAB rule","prompt":"In the FINLAB Portfolio Simulator, every trade needs…","options":[{"id":"a","label":"A written rationale"},{"id":"b","label":"Real money"},{"id":"c","label":"An admin's approval"},{"id":"d","label":"A minimum of 10,000 shares"}]}]$j$,
 $j${"q5":{"answer":9,"tolerance_pct":1},"q6":{"answer":4,"tolerance_pct":1},"q7":{"answer":"a"},"q8":{"answer":0.5,"tolerance_pct":2},"q9":{"answer":"a"},"q10":{"answer":"a"}}$j$),
('accretion-dilution',
 $j$[{"id":"q5","type":"numeric","label":"Standalone EPS","prompt":"Acquirer net income ₱400m, 100m shares. Standalone EPS (₱)?","unit":"₱"},
     {"id":"q6","type":"numeric","label":"Pro forma EPS","prompt":"Add target net income ₱100m, no synergies, 30m new shares issued. Pro forma EPS (₱)?","unit":"₱"},
     {"id":"q7","type":"mcq","label":"Verdict","prompt":"Compared with the standalone EPS, that deal is…","options":[{"id":"a","label":"Accretive"},{"id":"b","label":"Dilutive"},{"id":"c","label":"Neutral"}]},
     {"id":"q8","type":"numeric","label":"Break-even","prompt":"After-tax synergies needed for that deal to break even (₱m)?","unit":"₱m"},
     {"id":"q9","type":"mcq","label":"Cheap debt","prompt":"Financing with very cheap debt can make a deal…","options":[{"id":"a","label":"EPS-accretive even if the buyer overpays"},{"id":"b","label":"Always value-destroying"},{"id":"c","label":"Tax-free"},{"id":"d","label":"Exempt from due diligence"}]},
     {"id":"q10","type":"mcq","label":"Value test","prompt":"What ultimately decides whether a deal creates value?","options":[{"id":"a","label":"EPS accretion in year 1"},{"id":"b","label":"Return on invested capital versus the cost of capital"},{"id":"c","label":"The size of the press release"},{"id":"d","label":"The number of new shares"}]}]$j$,
 $j${"q5":{"answer":4,"tolerance_pct":0.5},"q6":{"answer":3.85,"tolerance_pct":1},"q7":{"answer":"b"},"q8":{"answer":20,"tolerance_pct":1},"q9":{"answer":"a"},"q10":{"answer":"b"}}$j$),
('investment-committee-memo',
 $j$[{"id":"q5","type":"mcq","label":"Downside","prompt":"A typical IC downside question is…","options":[{"id":"a","label":"\"What if volumes come in 20% below plan?\""},{"id":"b","label":"\"What is your favourite colour?\""},{"id":"c","label":"\"Who designed the logo?\""},{"id":"d","label":"\"How long is the memo?\""}]},
     {"id":"q6","type":"numeric","label":"NPV","prompt":"Cost ₱100m today; a single inflow of ₱121m in year 2; hurdle rate 10%. NPV (₱m)?","unit":"₱m"},
     {"id":"q7","type":"mcq","label":"IRR rule","prompt":"For a conventional project, IRR above the hurdle rate means…","options":[{"id":"a","label":"NPV is positive"},{"id":"b","label":"NPV is negative"},{"id":"c","label":"The project has no risk"},{"id":"d","label":"Payback is instant"}]},
     {"id":"q8","type":"mcq","label":"Conditions","prompt":"Which are typical approval conditions?","options":[{"id":"a","label":"Phasing the investment and securing customer contracts"},{"id":"b","label":"Raising the CEO's salary"},{"id":"c","label":"Skipping the downside case"},{"id":"d","label":"Ignoring financing"}]},
     {"id":"q9","type":"mcq","label":"Defense","prompt":"The committee will usually challenge…","options":[{"id":"a","label":"The assumption that matters most to the answer"},{"id":"b","label":"The font of the memo"},{"id":"c","label":"Only the appendix"},{"id":"d","label":"Nothing"}]},
     {"id":"q10","type":"numeric","label":"Negative NPV","prompt":"Cost ₱200m, present value of inflows ₱180m. NPV (₱m)?","unit":"₱m"}]$j$,
 $j${"q5":{"answer":"a"},"q6":{"answer":0,"tolerance_abs":0.5},"q7":{"answer":"a"},"q8":{"answer":"a"},"q9":{"answer":"a"},"q10":{"answer":-20,"tolerance_pct":1}}$j$)
), upd as (
  update public.lessons l
     set check_questions = l.check_questions || e.questions::jsonb
    from extra e
   where l.slug = e.slug and jsonb_array_length(l.check_questions) < 10
  returning l.id, e.answers
)
update public.lesson_check_keys k set answers = k.answers || upd.answers::jsonb, updated_at = now()
from upd where k.lesson_id = upd.id;

-- Equal weighting: every question is worth 10 points.
update public.lessons
   set check_questions = (select jsonb_agg(t.q || '{"points":10}'::jsonb order by t.i)
                          from jsonb_array_elements(check_questions) with ordinality as t(q, i))
 where jsonb_array_length(check_questions) > 0;
