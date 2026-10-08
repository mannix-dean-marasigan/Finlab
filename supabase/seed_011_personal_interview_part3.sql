-- seed_011_personal_interview: part 3 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 5. Challenges and the exam
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('personal-finance-plan', 'Money Plan: Maria''s First Salary',
 'Budget a first salary, set an emergency fund target and plan for the future.',
 '
Maria takes home **₱32,000** a month.

| Monthly spending | Amount |
|---|---|
| Rent | ₱9,000 |
| Food | ₱6,000 |
| Transport | ₱2,500 |
| Utilities | ₱1,500 |
| Wants (dining, streaming, shopping) | ₱8,000 |
| Savings | ₱5,000 |

Her essential expenses are the first four lines.
', 'Two decimals where needed.', 'personal_finance', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJCdWRnZXQgbWF0aCIsIndlaWdodCI6ODB9LHsibGFiZWwiOiJKdWRnbWVudCIsIndlaWdodCI6MjB9XQ==', 'base64'), 'UTF8')::jsonb,
 '{"financial_analysis":0.6,"decision_making":0.8,"technical_knowledge":0.4}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoibmVlZHMiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiTmVlZHMgJSIsInByb21wdCI6Ik5lZWRzIGFzIGEgJSBvZiB0YWtlLWhvbWUgKHR3byBkZWNpbWFscyk/IiwidW5pdCI6IiUiLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6IndhbnRzIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IldhbnRzICUiLCJwcm9tcHQiOiJXYW50cyBhcyBhICUgb2YgdGFrZS1ob21lPyIsInVuaXQiOiIlIiwicG9pbnRzIjo4fSwKICAgeyJpZCI6InNhdiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJTYXZpbmdzICUiLCJwcm9tcHQiOiJTYXZpbmdzIGFzIGEgJSBvZiB0YWtlLWhvbWUgKHR3byBkZWNpbWFscyk/IiwidW5pdCI6IiUiLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6InRndCIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiIyMCUgdGFyZ2V0IiwicHJvbXB0IjoiVGhlIDIwJSBzYXZpbmdzIHRhcmdldCBpbiBwZXNvcyAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJmdW5kIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkVtZXJnZW5jeSBmdW5kIiwicHJvbXB0IjoiQSA2LW1vbnRoIGVtZXJnZW5jeSBmdW5kIGJhc2VkIG9uIGhlciBlc3NlbnRpYWwgZXhwZW5zZXMgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoibW9udGhzIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6Ik1vbnRocyB0byBnb2FsIiwicHJvbXB0IjoiTW9udGhzIHRvIGJ1aWxkIHRoYXQgZnVuZCBzYXZpbmcg4oKxNSwwMDAgYSBtb250aCAob25lIGRlY2ltYWwpPyIsInVuaXQiOiJtb250aHMiLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6InI3MiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJSdWxlIG9mIDcyIiwicHJvbXB0IjoiSWYgc2hlIGludmVzdHMg4oKxNTAsMDAwIGF0IDglIGEgeWVhciwgdXNpbmcgdGhlIHJ1bGUgb2YgNzIsIHJvdWdobHkgaG93IG11Y2ggd2lsbCBpdCBiZSBhZnRlciA5IHllYXJzICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6ImZpcnN0IiwidHlwZSI6Im1jcSIsImxhYmVsIjoiRmlyc3QgcHJpb3JpdHkiLCJwcm9tcHQiOiJNYXJpYSBhbHNvIGhhcyBhIGNyZWRpdCBjYXJkIGNoYXJnaW5nIDM2JSBhIHllYXIuIEhlciBiZXN0IGZpcnN0IHByaW9yaXR5IGlzIHRv4oCmIiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJJbnZlc3QgaW4gYSA2JSBib25kIGZ1bmQifSx7ImlkIjoiYiIsImxhYmVsIjoiQnVpbGQgYSBzdGFydGVyIGVtZXJnZW5jeSBmdW5kIGFuZCBwYXkgb2ZmIHRoZSBoaWdoLWludGVyZXN0IGNhcmQifSx7ImlkIjoiYyIsImxhYmVsIjoiU3BlbmQgbW9yZSBvbiB3YW50cyJ9LHsiaWQiOiJkIiwibGFiZWwiOiJTdG9wIHNhdmluZyJ9XSwicG9pbnRzIjo2fSwKICAgeyJpZCI6InBsYW4iLCJ0eXBlIjoibG9uZ190ZXh0IiwibGFiZWwiOiJIZXIgcGxhbiIsInByb21wdCI6IldyaXRlIE1hcmlhIGEgc2hvcnQgbW9uZXkgcGxhbjogd2hhdCB0byBjaGFuZ2UgaW4gaGVyIGJ1ZGdldCwgaG93IHRvIGJ1aWxkIGhlciBlbWVyZ2VuY3kgZnVuZCBhbmQgd2hlcmUgdG8gc3RhcnQgaW52ZXN0aW5nLiIsIm1pbl93b3JkcyI6NTAsInBvaW50cyI6MTh9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{personal_finance}', true, now()),

('interview-mock-technical', 'Mock Technical Round: Finance Interview',
 'Answer the technical questions an analyst interviewer will ask.',
 '
You are in a **first-round technical interview**. Answer as you would out loud, then put numbers behind your answers.

Facts for the numeric questions (₱):
- Depreciation rises by **₱40**; tax rate **25%**.
- Equity value **₱2,000m**; debt **₱600m**; cash **₱250m**.
- EBIT **₱300m**; tax **30%**; D&A **₱80m**; capex **₱100m**; increase in NWC **₱20m**.
- Final-year FCF **₱170m**; terminal growth **2%**; WACC **10%**.
', 'Two decimals where needed.', 'career_prep', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJUZWNobmljYWwgYWNjdXJhY3kiLCJ3ZWlnaHQiOjY4fSx7ImxhYmVsIjoiQ29tbXVuaWNhdGlvbiIsIndlaWdodCI6MzJ9XQ==', 'base64'), 'UTF8')::jsonb,
 '{"technical_knowledge":1.0,"communication":0.8,"valuation":0.5}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoibmkiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiTmV0IGluY29tZSIsInByb21wdCI6IkJ5IGhvdyBtdWNoIGRvZXMgbmV0IGluY29tZSBmYWxsICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6ImNhc2giLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiQ2FzaCIsInByb21wdCI6IkJ5IGhvdyBtdWNoIGRvZXMgY2FzaCBmcm9tIG9wZXJhdGlvbnMgcmlzZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJldiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJFbnRlcnByaXNlIHZhbHVlIiwicHJvbXB0IjoiRW50ZXJwcmlzZSB2YWx1ZSAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6InVmY2YiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiVUZDRiIsInByb21wdCI6IlVubGV2ZXJlZCBmcmVlIGNhc2ggZmxvdyAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjE0fSwKICAgeyJpZCI6InR2IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlRlcm1pbmFsIHZhbHVlIiwicHJvbXB0IjoiVGVybWluYWwgdmFsdWUgYnkgR29yZG9uIGdyb3d0aCAo4oKxbSwgb25lIGRlY2ltYWwpPyIsInVuaXQiOiLigrFtIiwicG9pbnRzIjoxNH0sCiAgIHsiaWQiOiJldjEiLCJ0eXBlIjoibWNxIiwibGFiZWwiOiJEaXNjb3VudCByYXRlIiwicHJvbXB0IjoiV2hpY2ggZGlzY291bnQgcmF0ZSBpcyB1c2VkIGZvciB1bmxldmVyZWQgZnJlZSBjYXNoIGZsb3dzPyIsIm9wdGlvbnMiOlt7ImlkIjoiYSIsImxhYmVsIjoiQ29zdCBvZiBlcXVpdHkifSx7ImlkIjoiYiIsImxhYmVsIjoiV0FDQyJ9LHsiaWQiOiJjIiwibGFiZWwiOiJDb3N0IG9mIGRlYnQifSx7ImlkIjoiZCIsImxhYmVsIjoiVGhlIHRheCByYXRlIn1dLCJwb2ludHMiOjh9LAogICB7ImlkIjoid2FsayIsInR5cGUiOiJsb25nX3RleHQiLCJsYWJlbCI6IldhbGsgbWUgdGhyb3VnaCBhIERDRiIsInByb21wdCI6IkluIDTigJM2IHNlbnRlbmNlczogd2FsayBtZSB0aHJvdWdoIGEgRENGLiIsIm1pbl93b3JkcyI6NjAsInBvaW50cyI6MzJ9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{interview}', true, now()),

('exam-finance-interview-prep', 'Final Exam: Certified Finance Interview Prep',
 'Timed exam: statements, DCF and multiples, plus two spoken-style answers.',
 '
**Bataan Steel** (₱ millions unless stated):

| Item | Value |
|---|---|
| Share price | ₱80 |
| Diluted shares | 10 million |
| Debt | 500 |
| Cash | 200 |
| EBITDA | 180 |
| Net income | 60 |
| EBIT | 150 |
| Tax rate | 25% |
| D&A | 30 |
| Capex | 40 |
| Increase in NWC | 10 |

Terminal growth **3%**, WACC **9%**. Separately, depreciation rises by **₱20**.
', 'You have 45 minutes. Two decimals where needed. Pass mark 70.', 'career_prep', 'tasks', null, 'advanced', 45, 300, 70, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJUZWNobmljYWwgYWNjdXJhY3kiLCJ3ZWlnaHQiOjY4fSx7ImxhYmVsIjoiQ29tbXVuaWNhdGlvbiIsIndlaWdodCI6MzJ9XQ==', 'base64'), 'UTF8')::jsonb,
 '{"technical_knowledge":1.0,"communication":1.0,"valuation":0.6}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoiZXEiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiRXF1aXR5IHZhbHVlIiwicHJvbXB0IjoiRXF1aXR5IHZhbHVlICjigrFtKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6Nn0sCiAgIHsiaWQiOiJldiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJFbnRlcnByaXNlIHZhbHVlIiwicHJvbXB0IjoiRW50ZXJwcmlzZSB2YWx1ZSAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6ImV2eCIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJFVi9FQklUREEiLCJwcm9tcHQiOiJFVi9FQklUREEgKHgsIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IngiLCJwb2ludHMiOjh9LAogICB7ImlkIjoicGUiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiUC9FIiwicHJvbXB0IjoiUC9FICh4LCB0d28gZGVjaW1hbHMpPyIsInVuaXQiOiJ4IiwicG9pbnRzIjo4fSwKICAgeyJpZCI6InVmY2YiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiVUZDRiIsInByb21wdCI6IlVubGV2ZXJlZCBmcmVlIGNhc2ggZmxvdyAo4oKxbSwgdHdvIGRlY2ltYWxzKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoidHYiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiVGVybWluYWwgdmFsdWUiLCJwcm9tcHQiOiJUZXJtaW5hbCB2YWx1ZSBmcm9tIHRoYXQgRkNGIHVzaW5nIEdvcmRvbiBncm93dGggKOKCsW0sIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6Im5pIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkRlcHJlY2lhdGlvbjogbmV0IGluY29tZSIsInByb21wdCI6IkJ5IGhvdyBtdWNoIGRvZXMgbmV0IGluY29tZSBmYWxsIHdoZW4gZGVwcmVjaWF0aW9uIHJpc2VzIGJ5IOKCsTIwICjigrFtKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6Nn0sCiAgIHsiaWQiOiJjYXNoIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkRlcHJlY2lhdGlvbjogY2FzaCIsInByb21wdCI6IkJ5IGhvdyBtdWNoIGRvZXMgY2FzaCBmcm9tIG9wZXJhdGlvbnMgcmlzZSAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjZ9LAogICB7ImlkIjoibWMxIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiTXVsdGlwbGVzIiwicHJvbXB0IjoiV2hpY2ggbXVsdGlwbGUgaXMgY2FwaXRhbC1zdHJ1Y3R1cmUgbmV1dHJhbD8iLCJvcHRpb25zIjpbeyJpZCI6ImEiLCJsYWJlbCI6IlAvRSJ9LHsiaWQiOiJiIiwibGFiZWwiOiJFVi9FQklUREEifSx7ImlkIjoiYyIsImxhYmVsIjoiUHJpY2UgcGVyIHNoYXJlIn0seyJpZCI6ImQiLCJsYWJlbCI6IkRpdmlkZW5kIHlpZWxkIn1dLCJwb2ludHMiOjZ9LAogICB7ImlkIjoibWMyIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiRENGIGNvbnNpc3RlbmN5IiwicHJvbXB0IjoiVXNpbmcgbGV2ZXJlZCBmcmVlIGNhc2ggZmxvd3Mgd2l0aCBXQUNDIGlz4oCmIiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJDb3JyZWN0In0seyJpZCI6ImIiLCJsYWJlbCI6IkFuIGluY29uc2lzdGVuY3kifSx7ImlkIjoiYyIsImxhYmVsIjoiUmVxdWlyZWQgZm9yIGJhbmtzIn0seyJpZCI6ImQiLCJsYWJlbCI6Ik9ubHkgd3Jvbmcgd2l0aCBubyBkZWJ0In1dLCJwb2ludHMiOjZ9LAogICB7ImlkIjoic2F5MSIsInR5cGUiOiJsb25nX3RleHQiLCJsYWJlbCI6IlNwb2tlbiBhbnN3ZXI6IHRoZSBzdGF0ZW1lbnRzIiwicHJvbXB0IjoiQW5zd2VyIGFzIHlvdSB3b3VsZCBpbiBhbiBpbnRlcnZpZXc6IGhvdyBhcmUgdGhlIHRocmVlIGZpbmFuY2lhbCBzdGF0ZW1lbnRzIGxpbmtlZD8iLCJtaW5fd29yZHMiOjUwLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6InNheTIiLCJ0eXBlIjoibG9uZ190ZXh0IiwibGFiZWwiOiJTcG9rZW4gYW5zd2VyOiBFViB2cyBlcXVpdHkgdmFsdWUiLCJwcm9tcHQiOiJBbnN3ZXIgYXMgeW91IHdvdWxkIGluIGFuIGludGVydmlldzogd2hhdCBpcyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGVudGVycHJpc2UgdmFsdWUgYW5kIGVxdWl0eSB2YWx1ZSwgYW5kIHdoeSBpcyBjYXNoIHN1YnRyYWN0ZWQ/IiwibWluX3dvcmRzIjo1MCwicG9pbnRzIjoxMH0KIF19', 'base64'), 'UTF8')::jsonb::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 45, max_attempts = 3 where slug = 'exam-finance-interview-prep';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('personal-finance-plan', convert_from(decode('eyJuZWVkcyI6eyJhbnN3ZXIiOjU5LjM4LCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJ3YW50cyI6eyJhbnN3ZXIiOjI1LCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJzYXYiOnsiYW5zd2VyIjoxNS42MywidG9sZXJhbmNlX3BjdCI6MC41fSwidGd0Ijp7ImFuc3dlciI6NjQwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgImZ1bmQiOnsiYW5zd2VyIjoxMTQwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sIm1vbnRocyI6eyJhbnN3ZXIiOjIyLjgsInRvbGVyYW5jZV9wY3QiOjF9LCJyNzIiOnsiYW5zd2VyIjoxMDAwMDAsInRvbGVyYW5jZV9wY3QiOjF9LCJmaXJzdCI6eyJhbnN3ZXIiOiJiIn0sCiAgICJwbGFuIjp7ImtleXdvcmRzIjpbImJ1ZGdldHw1MC8zMC8yMHxuZWVkc3x3YW50cyIsImVtZXJnZW5jeSBmdW5kfHNhdmluZ3MiLCJkZWJ0fGNyZWRpdCBjYXJkfGludGVyZXN0IiwiaW52ZXN0fGZ1bmR8aW5kZXh8ZGl2ZXJzaWYiLCJpbmZsYXRpb258Y29tcG91bmQiXSwia2V5d29yZHNfcmVxdWlyZWQiOjN9fQ==', 'base64'), 'UTF8')::jsonb),
 ('interview-mock-technical', convert_from(decode('eyJuaSI6eyJhbnN3ZXIiOjMwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJjYXNoIjp7ImFuc3dlciI6MTAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImV2Ijp7ImFuc3dlciI6MjM1MCwidG9sZXJhbmNlX3BjdCI6MC41fSwidWZjZiI6eyJhbnN3ZXIiOjE3MCwidG9sZXJhbmNlX3BjdCI6MC41fSwidHYiOnsiYW5zd2VyIjoyMTY3LjUsInRvbGVyYW5jZV9wY3QiOjAuNX0sImV2MSI6eyJhbnN3ZXIiOiJiIn0sCiAgICJ3YWxrIjp7ImtleXdvcmRzIjpbInByb2plY3R8Zm9yZWNhc3QiLCJmcmVlIGNhc2ggZmxvd3xmY2YiLCJkaXNjb3VudHx3YWNjfHByZXNlbnQgdmFsdWUiLCJ0ZXJtaW5hbCIsImVudGVycHJpc2UgdmFsdWV8bmV0IGRlYnR8ZXF1aXR5IHZhbHVlIl0sImtleXdvcmRzX3JlcXVpcmVkIjo0fX0=', 'base64'), 'UTF8')::jsonb),
 ('exam-finance-interview-prep', convert_from(decode('eyJlcSI6eyJhbnN3ZXIiOjgwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwiZXYiOnsiYW5zd2VyIjoxMTAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJldngiOnsiYW5zd2VyIjo2LjExLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJwZSI6eyJhbnN3ZXIiOjEzLjMzLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJ1ZmNmIjp7ImFuc3dlciI6OTIuNSwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgInR2Ijp7ImFuc3dlciI6MTU4Ny45MiwidG9sZXJhbmNlX3BjdCI6MC41fSwibmkiOnsiYW5zd2VyIjoxNSwidG9sZXJhbmNlX3BjdCI6MC41fSwiY2FzaCI6eyJhbnN3ZXIiOjUsInRvbGVyYW5jZV9wY3QiOjAuNX0sIm1jMSI6eyJhbnN3ZXIiOiJiIn0sIm1jMiI6eyJhbnN3ZXIiOiJiIn0sCiAgICJzYXkxIjp7ImtleXdvcmRzIjpbIm5ldCBpbmNvbWUiLCJjYXNoIGZsb3ciLCJyZXRhaW5lZCBlYXJuaW5nc3xiYWxhbmNlIHNoZWV0IiwiaW5jb21lIHN0YXRlbWVudCIsImRlcHJlY2lhdGlvbnx3b3JraW5nIGNhcGl0YWx8bm9uLWNhc2giXSwia2V5d29yZHNfcmVxdWlyZWQiOjR9LAogICAic2F5MiI6eyJrZXl3b3JkcyI6WyJlbnRlcnByaXNlIHZhbHVlfGV2IiwiZXF1aXR5IHZhbHVlfHNoYXJlaG9sZGVycyIsImRlYnQiLCJjYXNoIiwib3BlcmF0aW5nfGNhcGl0YWwgcHJvdmlkZXJ8bmV0IGRlYnQiXSwia2V5d29yZHNfcmVxdWlyZWQiOjR9fQ==', 'base64'), 'UTF8')::jsonb)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The programs
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('personal-finance-essentials', 'track', 'Personal Finance Essentials',
 'Budgeting, saving, compound interest and investing basics.',
 '
The money skills nobody taught you in school: budget a salary with the 50/30/20 rule, build an emergency fund, understand compound interest and inflation, and learn how stocks, bonds and funds work.

Four short lessons and one hands-on money plan. Great for a first certificate.
', 'personal_finance', 'beginner', 1.5, 'Track Certificate — Personal Finance Essentials', true, 14),
('finance-interview-prep', 'certification', 'Finance Interview Prep',
 'The technical questions every finance internship and analyst interview asks.',
 '
Prepare for the technical round: link the three statements and walk through the depreciation question, answer "walk me through a DCF", and explain enterprise value, equity value and multiples with confidence.

1. Pass each lesson''s video, practice and knowledge check.
2. Complete the mock technical round.
3. Pass the **timed final exam** (45 minutes, 70% to pass, 3 attempts), including two spoken-style answers.
', 'career_prep', 'intermediate', 2.0, 'Certified Finance Interview Prep', true, 8)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('personal-finance-essentials', 1, 'lesson', 'budgeting-503020', null::numeric),
  ('personal-finance-essentials', 2, 'lesson', 'emergency-fund-inflation', null),
  ('personal-finance-essentials', 3, 'lesson', 'compound-interest-saving', null),
  ('personal-finance-essentials', 4, 'lesson', 'investing-basics-funds', null),
  ('personal-finance-essentials', 5, 'challenge', 'personal-finance-plan', null),

  ('finance-interview-prep', 1, 'lesson', 'interview-three-statements', null),
  ('finance-interview-prep', 2, 'lesson', 'interview-dcf-walkthrough', null),
  ('finance-interview-prep', 3, 'lesson', 'interview-ev-equity', null),
  ('finance-interview-prep', 4, 'challenge', 'interview-mock-technical', null),
  ('finance-interview-prep', 5, 'exam', 'exam-finance-interview-prep', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
