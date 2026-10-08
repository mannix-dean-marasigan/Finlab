-- seed_010_corpfin_modeling: part 3 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 5. Challenges and exams
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('corpfin-variance-review', 'Budget Review: Visayas Beverages',
 'Compare budget with actuals, find the variances and explain them.',
 '
**Visayas Beverages** (₱ millions), full year:

| | Budget | Actual |
|---|---|---|
| Revenue | 2,000 | 2,150 |
| Cost of goods sold | 1,200 | 1,290 |
| Operating expenses | 500 | 520 |
', 'Answer in ₱ millions. Two decimals where needed.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJWYXJpYW5jZSBtYXRoIiwid2VpZ2h0Ijo3NX0seyJsYWJlbCI6IkNvbW1lbnRhcnkiLCJ3ZWlnaHQiOjI1fV0=', 'base64'), 'UTF8')::jsonb,
 '{"financial_analysis":1.0,"technical_knowledge":0.5,"communication":0.4}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoicmV2dmFyIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlJldmVudWUgdmFyaWFuY2UiLCJwcm9tcHQiOiJSZXZlbnVlIHZhcmlhbmNlICjigrFtKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoicmV2cGN0IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlJldmVudWUgdmFyaWFuY2UgJSIsInByb21wdCI6IlJldmVudWUgdmFyaWFuY2UgYXMgYSAlIG9mIGJ1ZGdldD8iLCJ1bml0IjoiJSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoiZ3BiIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkJ1ZGdldCBncm9zcyBwcm9maXQiLCJwcm9tcHQiOiJCdWRnZXQgZ3Jvc3MgcHJvZml0ICjigrFtKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoiZ3BhIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkFjdHVhbCBncm9zcyBwcm9maXQiLCJwcm9tcHQiOiJBY3R1YWwgZ3Jvc3MgcHJvZml0ICjigrFtKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoiZWJpdGIiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiQnVkZ2V0IEVCSVQiLCJwcm9tcHQiOiJCdWRnZXQgb3BlcmF0aW5nIHByb2ZpdCAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6ImViaXRhIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkFjdHVhbCBFQklUIiwicHJvbXB0IjoiQWN0dWFsIG9wZXJhdGluZyBwcm9maXQgKOKCsW0pPyIsInVuaXQiOiLigrFtIiwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJlYml0cGN0IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkVCSVQgdmFyaWFuY2UgJSIsInByb21wdCI6Ik9wZXJhdGluZyBwcm9maXQgdmFyaWFuY2UgYXMgYSAlIG9mIGJ1ZGdldCAodHdvIGRlY2ltYWxzKT8iLCJ1bml0IjoiJSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoiY29zdCIsInR5cGUiOiJtY3EiLCJsYWJlbCI6IkNvc3QgdmFyaWFuY2UiLCJwcm9tcHQiOiJBY3R1YWwgQ09HUyBvZiAxLDI5MCBhZ2FpbnN0IGEgYnVkZ2V0IG9mIDEsMjAwIGlz4oCmIiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJGYXZvdXJhYmxlLCBiZWNhdXNlIHJldmVudWUgd2FzIGhpZ2hlciJ9LHsiaWQiOiJiIiwibGFiZWwiOiJVbmZhdm91cmFibGUgaW4gYWJzb2x1dGUgdGVybXMsIGJ1dCBzbWFsbCByZWxhdGl2ZSB0byB0aGUgZXh0cmEgcmV2ZW51ZSJ9LHsiaWQiOiJjIiwibGFiZWwiOiJJcnJlbGV2YW50IHRvIHByb2ZpdCJ9LHsiaWQiOiJkIiwibGFiZWwiOiJBIHJldmVudWUgdmFyaWFuY2UifV0sInBvaW50cyI6NX0sCiAgIHsiaWQiOiJjb21tZW50IiwidHlwZSI6ImxvbmdfdGV4dCIsImxhYmVsIjoiVmFyaWFuY2UgY29tbWVudGFyeSIsInByb21wdCI6IldyaXRlIHZhcmlhbmNlIGNvbW1lbnRhcnkgZm9yIG1hbmFnZW1lbnQ6IHdoYXQgZHJvdmUgdGhlIHJlc3VsdCwgd2hhdCB5b3Ugd291bGQgaW52ZXN0aWdhdGUgYW5kIHdoYXQgeW91IHdvdWxkIGNoYW5nZSBpbiB0aGUgZm9yZWNhc3QuIiwibWluX3dvcmRzIjo1MCwicG9pbnRzIjoyNX0KIF19', 'base64'), 'UTF8')::jsonb::jsonb, '{corporate_finance}', true, now()),

('corpfin-capital-budget', 'Capital Budget: Mindoro Resort Expansion',
 'Evaluate a resort expansion with NPV, payback and the profitability index.',
 '
**Mindoro Resort** is considering an expansion (₱ thousands). The required return is **10%**.

| Item | Value |
|---|---|
| Initial investment (today) | 5,000 |
| Cash inflow, year 1 | 1,500 |
| Cash inflow, year 2 | 1,800 |
| Cash inflow, year 3 | 2,000 |
| Cash inflow, year 4 | 2,200 |
', 'Answer in ₱ thousands. Two decimals.', 'valuation', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJDYXBpdGFsIGJ1ZGdldGluZyBtYXRoIiwid2VpZ2h0Ijo3NX0seyJsYWJlbCI6IkRlY2lzaW9uIGp1ZGdtZW50Iiwid2VpZ2h0IjoyNX1d', 'base64'), 'UTF8')::jsonb,
 '{"valuation":0.8,"financial_analysis":0.7,"decision_making":0.7}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoicHYiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiUFYgb2YgaW5mbG93cyIsInByb21wdCI6IlByZXNlbnQgdmFsdWUgb2YgdGhlIGZvdXIgaW5mbG93cyAo4oKxayk/IiwidW5pdCI6IuKCsWsiLCJwb2ludHMiOjE4fSwKICAgeyJpZCI6Im5wdiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJOUFYiLCJwcm9tcHQiOiJOUFYgKOKCsWspPyIsInVuaXQiOiLigrFrIiwicG9pbnRzIjoxOH0sCiAgIHsiaWQiOiJwaSIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJQcm9maXRhYmlsaXR5IGluZGV4IiwicHJvbXB0IjoiUHJvZml0YWJpbGl0eSBpbmRleCAodHdvIGRlY2ltYWxzKT8iLCJ1bml0IjoieCIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoicGIiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiUGF5YmFjayIsInByb21wdCI6IlBheWJhY2sgcGVyaW9kIGluIHllYXJzICh0d28gZGVjaW1hbHMsIGFzc3VtZSBjYXNoIGFycml2ZXMgZXZlbmx5IHdpdGhpbiBhIHllYXIpPyIsInVuaXQiOiJ5ZWFycyIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoiZGVjIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiRGVjaXNpb24iLCJwcm9tcHQiOiJCYXNlZCBvbiBOUFYsIHlvdSBzaG91bGTigKYiLCJvcHRpb25zIjpbeyJpZCI6ImEiLCJsYWJlbCI6IkFjY2VwdCB0aGUgZXhwYW5zaW9uIn0seyJpZCI6ImIiLCJsYWJlbCI6IlJlamVjdCB0aGUgZXhwYW5zaW9uIn0seyJpZCI6ImMiLCJsYWJlbCI6IldhaXQgZm9yIGEgbG93ZXIgZGlzY291bnQgcmF0ZSJ9LHsiaWQiOiJkIiwibGFiZWwiOiJEZWNpZGUgb24gcGF5YmFjayBhbG9uZSJ9XSwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJpcnIiLCJ0eXBlIjoibWNxIiwibGFiZWwiOiJJUlIiLCJwcm9tcHQiOiJCZWNhdXNlIE5QViBhdCAxMCUgaXMgcG9zaXRpdmUsIHRoZSBwcm9qZWN0J3MgSVJSIGlz4oCmIiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJCZWxvdyAxMCUifSx7ImlkIjoiYiIsImxhYmVsIjoiRXhhY3RseSAxMCUifSx7ImlkIjoiYyIsImxhYmVsIjoiQWJvdmUgMTAlIn0seyJpZCI6ImQiLCJsYWJlbCI6IkNhbm5vdCBiZSBkZXRlcm1pbmVkIn1dLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6InJpc2siLCJ0eXBlIjoibG9uZ190ZXh0IiwibGFiZWwiOiJSaXNrcyIsInByb21wdCI6Ik5hbWUgdGhlIGtleSByaXNrcyB0byB0aGlzIHByb2plY3QncyBjYXNoIGZsb3dzIGFuZCBob3cgeW91IHdvdWxkIHRlc3QgdGhlbSBiZWZvcmUgYXBwcm92aW5nIHRoZSBpbnZlc3RtZW50LiIsIm1pbl93b3JkcyI6NTAsInBvaW50cyI6MjB9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{corporate_finance}', true, now()),

('exam-corporate-finance', 'Final Exam: Certified Corporate Finance & FP&A Analyst',
 'Timed exam: time value of money, capital budgeting, variances and working capital.',
 '
**Luzon Packaging** (₱):

| Item | Detail |
|---|---|
| Project | Invest ₱3,000k now; inflows of ₱1,200k a year for 4 years; required return 10% |
| Deposit | ₱500,000 invested at 6% a year for 5 years |
| Revenue | Budget ₱8,000k; actual ₱7,600k |
| Working capital | Annual sales ₱18,250k; annual COGS ₱14,600k; receivables ₱2,500k; inventory ₱4,000k; payables ₱2,000k |
| Perpetuity | ₱120k a year forever at 8% |
', 'You have 60 minutes. Two decimals where needed. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJDb3Jwb3JhdGUgZmluYW5jZSBtYXRoIiwid2VpZ2h0Ijo3OH0seyJsYWJlbCI6Ikp1ZGdtZW50Iiwid2VpZ2h0IjoyMn1d', 'base64'), 'UTF8')::jsonb,
 '{"financial_analysis":1.0,"valuation":0.6,"technical_knowledge":0.6,"decision_making":0.4}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoibnB2IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6Ik5QViIsInByb21wdCI6IlByb2plY3QgTlBWICjigrFrLCB0d28gZGVjaW1hbHMpPyIsInVuaXQiOiLigrFrIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJwYiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJQYXliYWNrIiwicHJvbXB0IjoiUGF5YmFjayBwZXJpb2QgKHllYXJzKT8iLCJ1bml0IjoieWVhcnMiLCJwb2ludHMiOjh9LAogICB7ImlkIjoiZnYiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiRnV0dXJlIHZhbHVlIiwicHJvbXB0IjoiVmFsdWUgb2YgdGhlIGRlcG9zaXQgYWZ0ZXIgNSB5ZWFycyAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjo4fSwKICAgeyJpZCI6InJldnZhciIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJSZXZlbnVlIHZhcmlhbmNlIiwicHJvbXB0IjoiUmV2ZW51ZSB2YXJpYW5jZSAo4oKxaywgbmVnYXRpdmUgaWYgYmVsb3cgYnVkZ2V0KT8iLCJ1bml0Ijoi4oKxayIsInBvaW50cyI6OH0sCiAgIHsiaWQiOiJkc28iLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiRFNPIiwicHJvbXB0IjoiRFNPIChkYXlzKT8iLCJ1bml0IjoiZGF5cyIsInBvaW50cyI6Nn0sCiAgIHsiaWQiOiJjY2MiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiQ0NDIiwicHJvbXB0IjoiQ2FzaCBjb252ZXJzaW9uIGN5Y2xlIChkYXlzKT8iLCJ1bml0IjoiZGF5cyIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoicGVycCIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJQZXJwZXR1aXR5IiwicHJvbXB0IjoiUHJlc2VudCB2YWx1ZSBvZiB0aGUgcGVycGV0dWl0eSAo4oKxayk/IiwidW5pdCI6IuKCsWsiLCJwb2ludHMiOjh9LAogICB7ImlkIjoiYWN0IiwidHlwZSI6Im1jcSIsImxhYmVsIjoiU2hvcnRlbiB0aGUgQ0NDIiwicHJvbXB0IjoiV2hpY2ggYWN0aW9uIHNob3J0ZW5zIHRoZSBjYXNoIGNvbnZlcnNpb24gY3ljbGU/Iiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJPZmZlcmluZyBsb25nZXIgY3VzdG9tZXIgY3JlZGl0IHRlcm1zIn0seyJpZCI6ImIiLCJsYWJlbCI6IkNvbGxlY3RpbmcgcmVjZWl2YWJsZXMgZmFzdGVyIn0seyJpZCI6ImMiLCJsYWJlbCI6IkJ1aWxkaW5nIHVwIGV4dHJhIHNhZmV0eSBzdG9jayJ9LHsiaWQiOiJkIiwibGFiZWwiOiJQYXlpbmcgc3VwcGxpZXJzIGVhcmxpZXIifV0sInBvaW50cyI6OH0sCiAgIHsiaWQiOiJjb25mIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiTlBWIHZzIElSUiIsInByb21wdCI6IkZvciBtdXR1YWxseSBleGNsdXNpdmUgcHJvamVjdHMsIHdoZW4gTlBWIGFuZCBJUlIgZ2l2ZSBkaWZmZXJlbnQgcmFua2luZ3MgeW91IHNob3VsZOKApiIsIm9wdGlvbnMiOlt7ImlkIjoiYSIsImxhYmVsIjoiRm9sbG93IElSUiJ9LHsiaWQiOiJiIiwibGFiZWwiOiJGb2xsb3cgTlBWIn0seyJpZCI6ImMiLCJsYWJlbCI6IkZvbGxvdyBwYXliYWNrIn0seyJpZCI6ImQiLCJsYWJlbCI6IlBpY2sgdGhlIGNoZWFwZXIgcHJvamVjdCJ9XSwicG9pbnRzIjo4fSwKICAgeyJpZCI6Im1lbW8iLCJ0eXBlIjoibG9uZ190ZXh0IiwibGFiZWwiOiJSZWNvbW1lbmRhdGlvbiIsInByb21wdCI6IldyaXRlIGEgc2hvcnQgcmVjb21tZW5kYXRpb24gb24gdGhlIHByb2plY3QgYW5kIG9uIHRoZSBjb21wYW55J3Mgd29ya2luZyBjYXBpdGFsLCB1c2luZyB5b3VyIHJlc3VsdHMuIiwibWluX3dvcmRzIjo4MCwicG9pbnRzIjoyMn0KIF19', 'base64'), 'UTF8')::jsonb::jsonb, '{certification_exam}', true, now()),

('modeling-three-statement-roll', 'Model Roll-Forward: Cavite Cement Mini-Model',
 'Roll a balance sheet forward one year and make it balance.',
 '
**Cavite Cement** (₱ millions). Year-0 balance sheet: cash 200; receivables 150; inventory 100; PP&E 1,000; payables 120; debt 400; equity 930.

Year-1 assumptions: net income 144; dividends 44; capex 150; depreciation 100; receivables 180; inventory 110; payables 140; debt repayment 50.
', 'Answer in ₱ millions. Enter outflows as negative numbers.', 'financial_analysis', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJNb2RlbGxpbmcgbWF0aCIsIndlaWdodCI6ODB9LHsibGFiZWwiOiJKdWRnbWVudCIsIndlaWdodCI6MjB9XQ==', 'base64'), 'UTF8')::jsonb,
 '{"financial_analysis":0.8,"technical_knowledge":0.8}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoicHBlIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkNsb3NpbmcgUFAmRSIsInByb21wdCI6IkNsb3NpbmcgUFAmRSAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6ImVxdWl0eSIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJDbG9zaW5nIGVxdWl0eSIsInByb21wdCI6IkNsb3NpbmcgZXF1aXR5ICjigrFtKT8iLCJ1bml0Ijoi4oKxbSIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoiY2ZvIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkNGTyIsInByb21wdCI6IkNhc2ggZmxvdyBmcm9tIG9wZXJhdGlvbnMgKOKCsW0pPyIsInVuaXQiOiLigrFtIiwicG9pbnRzIjoxNn0sCiAgIHsiaWQiOiJjZmYiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiQ0ZGIiwicHJvbXB0IjoiQ2FzaCBmbG93IGZyb20gZmluYW5jaW5nICjigrFtLCBuZWdhdGl2ZSA9IG91dGZsb3cpPyIsInVuaXQiOiLigrFtIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJjYXNoIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkNsb3NpbmcgY2FzaCIsInByb21wdCI6IkNsb3NpbmcgY2FzaCAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjE2fSwKICAgeyJpZCI6ImFzc2V0cyIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJUb3RhbCBhc3NldHMiLCJwcm9tcHQiOiJUb3RhbCBhc3NldHMgKOKCsW0pPyIsInVuaXQiOiLigrFtIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJjaGVjayIsInR5cGUiOiJtY3EiLCJsYWJlbCI6IkJhbGFuY2UgY2hlY2siLCJwcm9tcHQiOiJUb3RhbCBsaWFiaWxpdGllcyBwbHVzIGVxdWl0eSBzaG91bGQgZXF1YWzigKYiLCJvcHRpb25zIjpbeyJpZCI6ImEiLCJsYWJlbCI6Ik5ldCBpbmNvbWUifSx7ImlkIjoiYiIsImxhYmVsIjoiVG90YWwgYXNzZXRzIn0seyJpZCI6ImMiLCJsYWJlbCI6IkNsb3NpbmcgY2FzaCJ9LHsiaWQiOiJkIiwibGFiZWwiOiJSZXZlbnVlIn1dLCJwb2ludHMiOjh9LAogICB7ImlkIjoibm90ZSIsInR5cGUiOiJsb25nX3RleHQiLCJsYWJlbCI6Ik1vZGVsIG5vdGVzIiwicHJvbXB0IjoiRXhwbGFpbiBob3cgdGhlIHRocmVlIHN0YXRlbWVudHMgbGluayBpbiB0aGlzIHJvbGwtZm9yd2FyZCBhbmQgd2hhdCBjaGVja3MgeW91IHdvdWxkIGJ1aWxkIGludG8gdGhlIG1vZGVsLiIsIm1pbl93b3JkcyI6NDAsInBvaW50cyI6MTJ9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{modeling}', true, now()),

('modeling-scenario-valuation', 'Scenario Valuation: Subic Logistics',
 'Value a company across bull, base and bear cases and run a sensitivity.',
 '
**Subic Logistics** (₱ millions unless stated). Net debt ₱300m; 50 million shares.

| Case | Enterprise value | Probability |
|---|---|---|
| Bear | 900 | 25% |
| Base | 1,200 | 50% |
| Bull | 1,500 | 25% |

Sensitivity: a 1-point rise in WACC cuts the **base** enterprise value by 10%.
', 'Answer in ₱ millions, or ₱ per share where stated. Two decimals where needed.', 'valuation', 'tasks', null, 'advanced', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJWYWx1YXRpb24gbWF0aCIsIndlaWdodCI6ODB9LHsibGFiZWwiOiJKdWRnbWVudCIsIndlaWdodCI6MjB9XQ==', 'base64'), 'UTF8')::jsonb,
 '{"valuation":1.0,"financial_analysis":0.6,"investment_judgment":0.5}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoicHdldiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJXZWlnaHRlZCBFViIsInByb21wdCI6IlByb2JhYmlsaXR5LXdlaWdodGVkIGVudGVycHJpc2UgdmFsdWUgKOKCsW0pPyIsInVuaXQiOiLigrFtIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJwd2VxIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IldlaWdodGVkIGVxdWl0eSB2YWx1ZSIsInByb21wdCI6IlByb2JhYmlsaXR5LXdlaWdodGVkIGVxdWl0eSB2YWx1ZSAo4oKxbSk/IiwidW5pdCI6IuKCsW0iLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6InBzIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlZhbHVlIHBlciBzaGFyZSIsInByb21wdCI6IlByb2JhYmlsaXR5LXdlaWdodGVkIHZhbHVlIHBlciBzaGFyZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJiZWFyIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkJlYXIgcGVyIHNoYXJlIiwicHJvbXB0IjoiQmVhci1jYXNlIHZhbHVlIHBlciBzaGFyZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJidWxsIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkJ1bGwgcGVyIHNoYXJlIiwicHJvbXB0IjoiQnVsbC1jYXNlIHZhbHVlIHBlciBzaGFyZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJzZW5zIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlNlbnNpdGl2aXR5IiwicHJvbXB0IjoiQmFzZS1jYXNlIHZhbHVlIHBlciBzaGFyZSBhZnRlciB0aGUgMS1wb2ludCBXQUNDIHJpc2UgKOKCsSwgdHdvIGRlY2ltYWxzKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxNH0sCiAgIHsiaWQiOiJ0eXBlIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiVG9vbCIsInByb21wdCI6IkNoYW5naW5nIG9ubHkgV0FDQyBhbmQgd2F0Y2hpbmcgdGhlIHZhbHVlIGlzIGFuIGV4YW1wbGUgb2bigKYiLCJvcHRpb25zIjpbeyJpZCI6ImEiLCJsYWJlbCI6IlNjZW5hcmlvIGFuYWx5c2lzIn0seyJpZCI6ImIiLCJsYWJlbCI6IlNlbnNpdGl2aXR5IGFuYWx5c2lzIn0seyJpZCI6ImMiLCJsYWJlbCI6IkEgYmFsYW5jZSBjaGVjayJ9LHsiaWQiOiJkIiwibGFiZWwiOiJWYXJpYW5jZSBhbmFseXNpcyJ9XSwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJ2aWV3IiwidHlwZSI6ImxvbmdfdGV4dCIsImxhYmVsIjoiQ29uY2x1c2lvbiIsInByb21wdCI6IlRoZSBzaGFyZXMgdHJhZGUgYXQg4oKxMTUuIFVzaW5nIHlvdXIgcmVzdWx0cywgZ2l2ZSBhIHZpZXcgYW5kIG5hbWUgdGhlIGFzc3VtcHRpb25zIHRoYXQgbWF0dGVyIG1vc3QuIiwibWluX3dvcmRzIjo1MCwicG9pbnRzIjoyMH0KIF19', 'base64'), 'UTF8')::jsonb::jsonb, '{modeling}', true, now()),

('exam-financial-modeling', 'Final Exam: Certified Financial Modeling Analyst',
 'Timed exam: roll-forward, revenue drivers, scenario valuation and model integrity.',
 '
**Panay Foods** (₱ thousands unless stated).

Year-0 balance sheet: cash 100; receivables 80; PP&E 600; payables 60; debt 200; equity 520. Year-1: net income 70; dividends 20; capex 90; depreciation 60; receivables 95; payables 70; debt unchanged.

Revenue: year-1 volume 20,000 units at ₱300. In year 2, volume grows **8%** and price grows **3%**.

Valuation: bull ₱140 (30%), base ₱110 (50%), bear ₱60 (20%) per share.
', 'You have 60 minutes. Two decimals where needed. Pass mark 70.', 'financial_analysis', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJNb2RlbGxpbmcgbWF0aCIsIndlaWdodCI6ODB9LHsibGFiZWwiOiJKdWRnbWVudCIsIndlaWdodCI6MjB9XQ==', 'base64'), 'UTF8')::jsonb,
 '{"financial_analysis":1.0,"valuation":0.5,"technical_knowledge":0.8}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoicHBlIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkNsb3NpbmcgUFAmRSIsInByb21wdCI6IkNsb3NpbmcgUFAmRSAo4oKxayk/IiwidW5pdCI6IuKCsWsiLCJwb2ludHMiOjd9LAogICB7ImlkIjoiZXF1aXR5IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkNsb3NpbmcgZXF1aXR5IiwicHJvbXB0IjoiQ2xvc2luZyBlcXVpdHkgKOKCsWspPyIsInVuaXQiOiLigrFrIiwicG9pbnRzIjo3fSwKICAgeyJpZCI6ImNmbyIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJDRk8iLCJwcm9tcHQiOiJDYXNoIGZsb3cgZnJvbSBvcGVyYXRpb25zICjigrFrKT8iLCJ1bml0Ijoi4oKxayIsInBvaW50cyI6OX0sCiAgIHsiaWQiOiJjYXNoIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkNsb3NpbmcgY2FzaCIsInByb21wdCI6IkNsb3NpbmcgY2FzaCAo4oKxayk/IiwidW5pdCI6IuKCsWsiLCJwb2ludHMiOjl9LAogICB7ImlkIjoiYXNzZXRzIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlRvdGFsIGFzc2V0cyIsInByb21wdCI6IlRvdGFsIGFzc2V0cyAo4oKxayk/IiwidW5pdCI6IuKCsWsiLCJwb2ludHMiOjl9LAogICB7ImlkIjoicmV2MiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJZZWFyLTIgcmV2ZW51ZSIsInByb21wdCI6IlllYXItMiByZXZlbnVlICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjl9LAogICB7ImlkIjoiZ3IiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiUmV2ZW51ZSBncm93dGgiLCJwcm9tcHQiOiJSZXZlbnVlIGdyb3d0aCBpbiB5ZWFyIDIgKCUsIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IiUiLCJwb2ludHMiOjl9LAogICB7ImlkIjoiZXYiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiRXhwZWN0ZWQgdmFsdWUiLCJwcm9tcHQiOiJQcm9iYWJpbGl0eS13ZWlnaHRlZCB2YWx1ZSBwZXIgc2hhcmUgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6OX0sCiAgIHsiaWQiOiJjaGsiLCJ0eXBlIjoibWNxIiwibGFiZWwiOiJCYWxhbmNlIGNoZWNrIiwicHJvbXB0IjoiQSBiYWxhbmNlIGNoZWNrIHRoYXQgc2hvd3MgYSBub24temVybyBkaWZmZXJlbmNlIG1lYW5z4oCmIiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJUaGUgbW9kZWwgaXMgY29ycmVjdCJ9LHsiaWQiOiJiIiwibGFiZWwiOiJUaGVyZSBpcyBhbiBlcnJvciBpbiBob3cgdGhlIHN0YXRlbWVudHMgYXJlIGxpbmtlZCJ9LHsiaWQiOiJjIiwibGFiZWwiOiJSZXZlbnVlIGlzIHRvbyBoaWdoIn0seyJpZCI6ImQiLCJsYWJlbCI6IlRheGVzIGFyZSBtaXNzaW5nIn1dLCJwb2ludHMiOjh9LAogICB7ImlkIjoiaHMiLCJ0eXBlIjoibWNxIiwibGFiZWwiOiJGb3JlY2FzdCBxdWFsaXR5IiwicHJvbXB0IjoiUmV2ZW51ZSBncm93dGgganVtcHMgZnJvbSA4JSB0byAzNSUgaW4geWVhciAzIHdpdGggbm8gbmV3IGRyaXZlci4gVGhpcyBpc+KApiIsIm9wdGlvbnMiOlt7ImlkIjoiYSIsImxhYmVsIjoiQSBjb25zZXJ2YXRpdmUgYXNzdW1wdGlvbiJ9LHsiaWQiOiJiIiwibGFiZWwiOiJBIGhvY2tleSBzdGljayB0aGF0IG5lZWRzIGEgc3VwcG9ydGluZyBkcml2ZXIifSx7ImlkIjoiYyIsImxhYmVsIjoiQSBzZW5zaXRpdml0eSJ9LHsiaWQiOiJkIiwibGFiZWwiOiJOb3JtYWwgc2Vhc29uYWxpdHkifV0sInBvaW50cyI6OH0sCiAgIHsiaWQiOiJtZW1vIiwidHlwZSI6ImxvbmdfdGV4dCIsImxhYmVsIjoiTW9kZWwgcmV2aWV3IiwicHJvbXB0IjoiV3JpdGUgYSBzaG9ydCByZXZpZXcgb2YgdGhpcyBtb2RlbDogaG93IHRoZSBzdGF0ZW1lbnRzIGxpbmssIGhvdyB5b3Ugd291bGQgY2hlY2sgaW50ZWdyaXR5IGFuZCB3aGljaCBhc3N1bXB0aW9ucyB5b3Ugd291bGQgc3RyZXNzLiIsIm1pbl93b3JkcyI6ODAsInBvaW50cyI6MTZ9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug in ('exam-corporate-finance', 'exam-financial-modeling');

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('corpfin-variance-review', convert_from(decode('eyJyZXZ2YXIiOnsiYW5zd2VyIjoxNTAsInRvbGVyYW5jZV9wY3QiOjAuNX0sInJldnBjdCI6eyJhbnN3ZXIiOjcuNSwidG9sZXJhbmNlX3BjdCI6MC41fSwiZ3BiIjp7ImFuc3dlciI6ODAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJncGEiOnsiYW5zd2VyIjo4NjAsInRvbGVyYW5jZV9wY3QiOjAuNX0sCiAgICJlYml0YiI6eyJhbnN3ZXIiOjMwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwiZWJpdGEiOnsiYW5zd2VyIjozNDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImViaXRwY3QiOnsiYW5zd2VyIjoxMy4zMywidG9sZXJhbmNlX3BjdCI6MX0sImNvc3QiOnsiYW5zd2VyIjoiYiJ9LAogICAiY29tbWVudCI6eyJrZXl3b3JkcyI6WyJyZXZlbnVlfHZvbHVtZXxwcmljZSIsImNvc3R8Y29nc3xtYXJnaW4iLCJmYXZvdXJhYmxlfGZhdm9yYWJsZXx1bmZhdm91cmFibGV8dW5mYXZvcmFibGUiLCJmb3JlY2FzdHxyZWZvcmVjYXN0fGFjdGlvbiIsImludmVzdGlnYXRlfGRyaXZlcnxjYXVzZSJdLCJrZXl3b3Jkc19yZXF1aXJlZCI6M319', 'base64'), 'UTF8')::jsonb),
 ('corpfin-capital-budget', convert_from(decode('eyJwdiI6eyJhbnN3ZXIiOjU4NTYuNSwidG9sZXJhbmNlX3BjdCI6MC41fSwibnB2Ijp7ImFuc3dlciI6ODU2LjUsInRvbGVyYW5jZV9wY3QiOjF9LCJwaSI6eyJhbnN3ZXIiOjEuMTcsInRvbGVyYW5jZV9wY3QiOjF9LCJwYiI6eyJhbnN3ZXIiOjIuODUsInRvbGVyYW5jZV9wY3QiOjEuNX0sImRlYyI6eyJhbnN3ZXIiOiJhIn0sImlyciI6eyJhbnN3ZXIiOiJjIn0sCiAgICJyaXNrIjp7ImtleXdvcmRzIjpbImRlbWFuZHxyZXZlbnVlfG9jY3VwYW5jeXx2b2x1bWUiLCJzZW5zaXRpdnxzY2VuYXJpb3xkb3duc2lkZSIsImNvc3R8Y2FwZXh8b3ZlcnJ1biIsImRpc2NvdW50IHJhdGV8d2FjY3xjb3N0IG9mIGNhcGl0YWwiLCJ0b3VyaXNtfHNlYXNvbmFsfGNvbXBldGl0aW9ufHJpc2siXSwia2V5d29yZHNfcmVxdWlyZWQiOjN9fQ==', 'base64'), 'UTF8')::jsonb),
 ('exam-corporate-finance', convert_from(decode('eyJucHYiOnsiYW5zd2VyIjo4MDMuODQsInRvbGVyYW5jZV9wY3QiOjF9LCJwYiI6eyJhbnN3ZXIiOjIuNSwidG9sZXJhbmNlX3BjdCI6MC41fSwiZnYiOnsiYW5zd2VyIjo2NjkxMTMsInRvbGVyYW5jZV9wY3QiOjAuNX0sInJldnZhciI6eyJhbnN3ZXIiOi00MDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImRzbyI6eyJhbnN3ZXIiOjUwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LAogICAiY2NjIjp7ImFuc3dlciI6MTAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJwZXJwIjp7ImFuc3dlciI6MTUwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwiYWN0Ijp7ImFuc3dlciI6ImIifSwiY29uZiI6eyJhbnN3ZXIiOiJiIn0sCiAgICJtZW1vIjp7ImtleXdvcmRzIjpbIm5wdnxuZXQgcHJlc2VudCB2YWx1ZSIsInBheWJhY2siLCJhY2NlcHR8YXBwcm92ZXxyZWNvbW1lbmQiLCJ3b3JraW5nIGNhcGl0YWx8Y2FzaCBjb252ZXJzaW9ufGNjYyIsInJlY2VpdmFibGV8aW52ZW50b3J5fGNvbGxlY3R8ZHNvfGRpbyJdLCJrZXl3b3Jkc19yZXF1aXJlZCI6NH19', 'base64'), 'UTF8')::jsonb),
 ('modeling-three-statement-roll', convert_from(decode('eyJwcGUiOnsiYW5zd2VyIjoxMDUwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJlcXVpdHkiOnsiYW5zd2VyIjoxMDMwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJjZm8iOnsiYW5zd2VyIjoyMjQsInRvbGVyYW5jZV9wY3QiOjAuNX0sImNmZiI6eyJhbnN3ZXIiOi05NCwidG9sZXJhbmNlX3BjdCI6MC41fSwiY2FzaCI6eyJhbnN3ZXIiOjE4MCwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgImFzc2V0cyI6eyJhbnN3ZXIiOjE1MjAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImNoZWNrIjp7ImFuc3dlciI6ImIifSwKICAgIm5vdGUiOnsia2V5d29yZHMiOlsibmV0IGluY29tZXxyZXRhaW5lZCBlYXJuaW5ncyIsImNhc2ggZmxvd3xjYXNoIiwiYmFsYW5jZXxjaGVjayIsImRlcHJlY2lhdGlvbnxjYXBleHxwcGUiLCJ3b3JraW5nIGNhcGl0YWx8cmVjZWl2YWJsZXxwYXlhYmxlIl0sImtleXdvcmRzX3JlcXVpcmVkIjozfX0=', 'base64'), 'UTF8')::jsonb),
 ('modeling-scenario-valuation', convert_from(decode('eyJwd2V2Ijp7ImFuc3dlciI6MTIwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwicHdlcSI6eyJhbnN3ZXIiOjkwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwicHMiOnsiYW5zd2VyIjoxOCwidG9sZXJhbmNlX3BjdCI6MC41fSwiYmVhciI6eyJhbnN3ZXIiOjEyLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJidWxsIjp7ImFuc3dlciI6MjQsInRvbGVyYW5jZV9wY3QiOjAuNX0sCiAgICJzZW5zIjp7ImFuc3dlciI6MTUuNiwidG9sZXJhbmNlX3BjdCI6MX0sInR5cGUiOnsiYW5zd2VyIjoiYiJ9LAogICAidmlldyI6eyJrZXl3b3JkcyI6WyJ1cHNpZGV8dW5kZXJ2YWx1ZWR8ZGlzY291bnR8YnV5Iiwid2FjY3xkaXNjb3VudCByYXRlIiwic2NlbmFyaW98YmVhcnxidWxsfGJhc2UiLCJuZXQgZGVidHxsZXZlcmFnZSIsInByb2JhYiJdLCJrZXl3b3Jkc19yZXF1aXJlZCI6M319', 'base64'), 'UTF8')::jsonb),
 ('exam-financial-modeling', convert_from(decode('eyJwcGUiOnsiYW5zd2VyIjo2MzAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImVxdWl0eSI6eyJhbnN3ZXIiOjU3MCwidG9sZXJhbmNlX3BjdCI6MC41fSwiY2ZvIjp7ImFuc3dlciI6MTI1LCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJjYXNoIjp7ImFuc3dlciI6MTE1LCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJhc3NldHMiOnsiYW5zd2VyIjo4NDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sCiAgICJyZXYyIjp7ImFuc3dlciI6NjY3NDQwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwiZ3IiOnsiYW5zd2VyIjoxMS4yNCwidG9sZXJhbmNlX3BjdCI6MX0sImV2Ijp7ImFuc3dlciI6MTA5LCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJjaGsiOnsiYW5zd2VyIjoiYiJ9LCJocyI6eyJhbnN3ZXIiOiJiIn0sCiAgICJtZW1vIjp7ImtleXdvcmRzIjpbImxpbmt8Zmxvd3xyZXRhaW5lZCBlYXJuaW5ncyIsImJhbGFuY2V8Y2hlY2siLCJjYXNoIGZsb3d8Y2FzaCIsImFzc3VtcHRpb258aW5wdXR8ZHJpdmVyIiwic2Vuc2l0aXZ8c2NlbmFyaW98c3RyZXNzIl0sImtleXdvcmRzX3JlcXVpcmVkIjo0fX0=', 'base64'), 'UTF8')::jsonb)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certifications
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('corporate-finance-fpa', 'certification', 'Corporate Finance & FP&A',
 'Time value of money, capital budgeting, variance analysis and working capital.',
 '
The toolkit of a corporate finance and FP&A analyst: discount cash flows, evaluate projects with NPV and IRR, run budget-versus-actual variance analysis, and manage working capital through the cash conversion cycle.

1. Pass each lesson''s video, practice and knowledge check.
2. Pass every case challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
', 'financial_analysis', 'intermediate', 3.5, 'Certified Corporate Finance & FP&A Analyst', true, 6),
('financial-modeling', 'certification', 'Financial Modeling',
 'Structure a model, forecast revenue from drivers and test it with scenarios.',
 '
How professionals build models that can be trusted: clean structure, linked three statements, driver-based forecasts, integrity checks, and scenario and sensitivity analysis.

1. Pass each lesson''s video, practice and knowledge check.
2. Pass every case challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).
', 'financial_analysis', 'advanced', 3.5, 'Certified Financial Modeling Analyst', true, 7)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('corporate-finance-fpa', 1, 'lesson', 'time-value-of-money', null::numeric),
  ('corporate-finance-fpa', 2, 'lesson', 'cost-of-capital', null),
  ('corporate-finance-fpa', 3, 'lesson', 'capital-budgeting-npv-irr', null),
  ('corporate-finance-fpa', 4, 'challenge', 'corpfin-capital-budget', null),
  ('corporate-finance-fpa', 5, 'lesson', 'budgeting-variance-fpa', null),
  ('corporate-finance-fpa', 6, 'lesson', 'working-capital-ccc', null),
  ('corporate-finance-fpa', 7, 'challenge', 'corpfin-variance-review', null),
  ('corporate-finance-fpa', 8, 'exam', 'exam-corporate-finance', 70),

  ('financial-modeling', 1, 'lesson', 'three-statements', null),
  ('financial-modeling', 2, 'lesson', 'model-structure', null),
  ('financial-modeling', 3, 'challenge', 'modeling-three-statement-roll', null),
  ('financial-modeling', 4, 'lesson', 'revenue-drivers-forecasting', null),
  ('financial-modeling', 5, 'lesson', 'scenarios-sensitivity', null),
  ('financial-modeling', 6, 'challenge', 'modeling-scenario-valuation', null),
  ('financial-modeling', 7, 'exam', 'exam-financial-modeling', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
