-- =====================================================================
-- FINLAB — Content v8: a 30-minute Quick Start certificate
--   Lesson "Valuation with Multiples" (~15 min incl. video, practice, quiz)
--   + a 10-minute auto-graded challenge → certificate.
-- Safe to re-run.
-- =====================================================================

insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('quickstart-valuation-sprint', 'Valuation Sprint: Bayan Foods',
 'Ten minutes: value a stock with peer multiples and make the call.',
 $md$
**Bayan Foods** trades at **₱42.00**.

| Input | Value |
|---|---|
| EPS (next 12 months) | ₱3.50 |
| Book value per share | ₱25.00 |
| Peer P/E multiples | 12x, 14x, 16x |
| Peer P/B multiple (median) | 1.8x |

Use the **median** peer P/E. Rating rule: BUY if upside ≥ +10%, SELL if ≤ −10%, otherwise HOLD.
$md$, 'Answer each step — everything is graded instantly. Two decimals where needed.', 'valuation', 'tasks', null, 'beginner', 10, 50, 70, 'auto',
 '[{"label":"Valuation math","weight":80},{"label":"Judgment","weight":20}]',
 '{"valuation":0.6,"technical_knowledge":0.4}',
 $j${"tasks":[
   {"id":"median","type":"numeric","label":"Peer median","prompt":"Median peer P/E (x)?","unit":"x","points":15},
   {"id":"pe_tp","type":"numeric","label":"P/E target","prompt":"Target price from P/E: EPS × median P/E (₱)?","unit":"₱","points":20},
   {"id":"pb_tp","type":"numeric","label":"P/B target","prompt":"Target price from P/B: book value per share × 1.8 (₱)?","unit":"₱","points":15},
   {"id":"blend","type":"numeric","label":"Blended target","prompt":"Average of the two targets (₱)?","unit":"₱","points":15},
   {"id":"up","type":"numeric","label":"Upside","prompt":"Upside from ₱42.00 to the blended target (%)?","unit":"%","points":15},
   {"id":"rating","type":"mcq","label":"Rating","prompt":"Your rating?","options":[{"id":"buy","label":"BUY"},{"id":"hold","label":"HOLD"},{"id":"sell","label":"SELL"}],"points":10},
   {"id":"method","type":"mcq","label":"Method","prompt":"For which company would P/B usually be the better primary method?","options":[{"id":"a","label":"A software start-up with no profits"},{"id":"b","label":"A bank"},{"id":"c","label":"A fast-growing fast-food chain"},{"id":"d","label":"A mobile game studio"}],"points":10}
 ]}$j$::jsonb, '{quickstart}', true, now())
on conflict (slug) do nothing;

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, $j${"median":{"answer":14,"tolerance_pct":1},"pe_tp":{"answer":49,"tolerance_pct":0.5},"pb_tp":{"answer":45,"tolerance_pct":0.5},
  "blend":{"answer":47,"tolerance_pct":0.5},"up":{"answer":11.9,"tolerance_pct":1.5},"rating":{"answer":"buy"},"method":{"answer":"b"}}$j$::jsonb
from public.challenges c where c.slug = 'quickstart-valuation-sprint'
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('quickstart-value-a-stock', 'track', 'Quick Start: Value a Stock',
 'Your first finance certificate in about 30 minutes.',
 $md$
New to FINLAB? Start here. In about **30 minutes** you'll learn how analysts value a company with P/E and P/B multiples — then prove it on a real-style case.

1. **Lesson:** Valuation with Multiples — watch the video, try the practice, pass the 10-question check (80%).
2. **Valuation Sprint:** a 10-minute, instantly graded case. Score 70+ to pass.

Your certificate is issued automatically the moment you pass both — ready to add to LinkedIn.
$md$, 'valuation', 'beginner', 0.5, 'Quick Start Certificate — Stock Valuation Basics', true, 0)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind = 'challenge' then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('quickstart-value-a-stock', 1, 'lesson', 'valuation-multiples', null::numeric),
  ('quickstart-value-a-stock', 2, 'challenge', 'quickstart-valuation-sprint', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;

update public.lessons
   set related_challenge_slugs = array_append(related_challenge_slugs, 'quickstart-valuation-sprint')
 where slug = 'valuation-multiples' and not ('quickstart-valuation-sprint' = any(related_challenge_slugs));
