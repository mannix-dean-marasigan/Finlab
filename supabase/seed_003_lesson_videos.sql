-- =====================================================================
-- FINLAB — Content v3: embedded YouTube videos for every lesson.
-- Run AFTER migration 0006. Safe to re-run.
-- All videos were checked to exist and allow embedding (YouTube oEmbed).
-- Every certification and track gets at least 3 videos across its lessons.
-- =====================================================================
update public.lessons l set video_urls = v.urls
from (values
  ('three-statements', array[
    'https://www.youtube.com/watch?v=Fi1wkUczuyk',   -- Accounting Stuff: Financial statements basics
    'https://www.youtube.com/watch?v=Mcj5ES2HDqY']), -- Alex Glassey: How the three statements fit together
  ('cash-flow-statement', array[
    'https://www.youtube.com/watch?v=DiVPAjgmnj0',   -- Accounting Stuff: Cash flow statement for beginners
    'https://www.youtube.com/watch?v=8CH-6wdfz0Y']), -- Accounting Stuff: Indirect method
  ('ratio-analysis', array[
    'https://www.youtube.com/watch?v=MTq7HuvoGck']), -- The Finance Storyteller: Financial ratio analysis
  ('credit-analysis', array[
    'https://www.youtube.com/watch?v=CPXNvQZTLNs',   -- Finance Strategists: Interest coverage ratio
    'https://www.youtube.com/watch?v=kc4kGlTSWeU']), -- Edspira: Debt covenants
  ('valuation-multiples', array[
    'https://www.youtube.com/watch?v=dJPw1XmKA7Q',   -- P/E ratio explained
    'https://www.youtube.com/watch?v=VFYhdFhav2c']), -- P/B ratio explained
  ('cost-of-capital', array[
    'https://www.youtube.com/watch?v=-fCYZjNA7Ps',   -- CAPM explained
    'https://www.youtube.com/watch?v=iAYs2VFcB8g']), -- Corporate Finance Institute: WACC
  ('dcf-fundamentals', array[
    'https://www.youtube.com/watch?v=M8cuAJYYnTM',   -- Corporate Finance Institute: DCF model
    'https://www.youtube.com/watch?v=83yR6EFEl5Y']), -- Aswath Damodaran: Terminal value
  ('equity-research-report', array[
    'https://www.youtube.com/watch?v=e6yZ1T54Rqs',   -- What an equity research analyst actually does
    'https://www.youtube.com/watch?v=qFkoHpzt61c',   -- Breaking Into Wall Street: What's in an ER report
    'https://www.youtube.com/watch?v=BSy907nudaE']), -- Ex-Lehman analyst: writing ER reports
  ('stock-pitch-structure', array[
    'https://www.youtube.com/watch?v=7qd0Hzaw5nU',   -- Henry Chien: How to pitch a stock
    'https://www.youtube.com/watch?v=zGhp9hecqHA']), -- Breaking Into Wall Street: Pitching a stock
  ('portfolio-construction', array[
    'https://www.youtube.com/watch?v=Pmlsa5-ruMk',   -- The Plain Bagel: How diversification works
    'https://www.youtube.com/watch?v=h_BJ7sf1lks',   -- Modern portfolio theory & efficient frontier
    'https://www.youtube.com/watch?v=rdhDmQOUMUE']), -- Corporate Finance Institute: Sharpe ratio
  ('accretion-dilution', array[
    'https://www.youtube.com/watch?v=rqjhxrWTlU0',   -- The Finance Storyteller: Accretion and dilution
    'https://www.youtube.com/watch?v=tSLZCGG3RK8',   -- Corporate Finance Institute: M&A model
    'https://www.youtube.com/watch?v=DBL_XAY0Oz8']), -- Breaking Into Wall Street: Accretion/dilution rules of thumb
  ('investment-committee-memo', array[
    'https://www.youtube.com/watch?v=Fw5-wccViOM',   -- The Finance Storyteller: NPV and IRR
    'https://www.youtube.com/watch?v=OSDDrZZaV8E',   -- Edspira: IRR
    'https://www.youtube.com/watch?v=zhXQgqwW6hw'])  -- NextView Ventures: The investment memo
) as v(slug, urls)
where l.slug = v.slug;
