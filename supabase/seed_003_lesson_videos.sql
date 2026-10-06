-- =====================================================================
-- FINLAB — Content v3: one embedded YouTube video per lesson.
-- (Superseded by seed_004, which sets the same videos; kept so fresh
-- installs can run every seed file in order.) Safe to re-run.
-- All videos were checked to exist and allow embedding (YouTube oEmbed).
-- =====================================================================
update public.lessons l set video_urls = array[v.url]
from (values
  ('three-statements',          'https://www.youtube.com/watch?v=Mcj5ES2HDqY'),
  ('cash-flow-statement',       'https://www.youtube.com/watch?v=8CH-6wdfz0Y'),
  ('ratio-analysis',            'https://www.youtube.com/watch?v=MTq7HuvoGck'),
  ('credit-analysis',           'https://www.youtube.com/watch?v=kc4kGlTSWeU'),
  ('valuation-multiples',       'https://www.youtube.com/watch?v=dJPw1XmKA7Q'),
  ('cost-of-capital',           'https://www.youtube.com/watch?v=iAYs2VFcB8g'),
  ('dcf-fundamentals',          'https://www.youtube.com/watch?v=M8cuAJYYnTM'),
  ('equity-research-report',    'https://www.youtube.com/watch?v=qFkoHpzt61c'),
  ('stock-pitch-structure',     'https://www.youtube.com/watch?v=7qd0Hzaw5nU'),
  ('portfolio-construction',    'https://www.youtube.com/watch?v=Pmlsa5-ruMk'),
  ('accretion-dilution',        'https://www.youtube.com/watch?v=rqjhxrWTlU0'),
  ('investment-committee-memo', 'https://www.youtube.com/watch?v=Fw5-wccViOM')
) as v(slug, url)
where l.slug = v.slug;
