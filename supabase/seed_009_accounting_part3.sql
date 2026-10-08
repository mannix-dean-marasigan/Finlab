-- seed_009_accounting: part 3 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 5. Challenges and the final exam
-- ---------------------------------------------------------------------
insert into public.challenges
 (slug, title, summary, description, instructions, category_id, kind, pitch_format, difficulty, estimated_minutes, points,
  passing_score, scoring_method, scoring_criteria, skill_impact, content, tags, is_published, published_at)
values
('accounting-journal-trial-balance', 'Journal Entries: Cebu Print Studio',
 'Record a month of transactions and prove the accounting equation.',
 '
**Cebu Print Studio** (₱) had these transactions in its first month:

1. The owner invested **500,000** cash.
2. Bought equipment for **300,000** cash.
3. Bought paper supplies for **20,000** on credit.
4. Earned fees of **180,000**: **120,000** in cash and **60,000** on account.
5. Paid rent of **40,000** in cash.
6. Paid salaries of **60,000** in cash.
', 'Answer in ₱.', 'accounting', 'tasks', null, 'beginner', 20, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJCb29ra2VlcGluZyBtYXRoIiwid2VpZ2h0Ijo4MH0seyJsYWJlbCI6Ikp1ZGdtZW50Iiwid2VpZ2h0IjoyMH1d', 'base64'), 'UTF8')::jsonb,
 '{"technical_knowledge":1.0,"financial_analysis":0.4}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoiY2FzaCIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJFbmRpbmcgY2FzaCIsInByb21wdCI6IkVuZGluZyBjYXNoICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjE1fSwKICAgeyJpZCI6ImFyIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlJlY2VpdmFibGVzIiwicHJvbXB0IjoiQWNjb3VudHMgcmVjZWl2YWJsZSBhdCBtb250aCBlbmQgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoiYXNzZXRzIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlRvdGFsIGFzc2V0cyIsInByb21wdCI6IlRvdGFsIGFzc2V0czogY2FzaCwgcmVjZWl2YWJsZXMsIGVxdWlwbWVudCBhbmQgc3VwcGxpZXMgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTV9LAogICB7ImlkIjoibGlhYiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJMaWFiaWxpdGllcyIsInByb21wdCI6IlRvdGFsIGxpYWJpbGl0aWVzICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6Im5pIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6Ik5ldCBpbmNvbWUiLCJwcm9tcHQiOiJOZXQgaW5jb21lIGZvciB0aGUgbW9udGggKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTV9LAogICB7ImlkIjoiZXF1aXR5IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkVxdWl0eSIsInByb21wdCI6Ik93bmVyJ3MgZXF1aXR5IGF0IG1vbnRoIGVuZCAoY2FwaXRhbCArIG5ldCBpbmNvbWUpICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjE1fSwKICAgeyJpZCI6Im5iIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiTm9ybWFsIGJhbGFuY2UiLCJwcm9tcHQiOiJXaGF0IGlzIHRoZSBub3JtYWwgYmFsYW5jZSBvZiB0aGUgZmVlcyByZXZlbnVlIGFjY291bnQ/Iiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJEZWJpdCJ9LHsiaWQiOiJiIiwibGFiZWwiOiJDcmVkaXQifSx7ImlkIjoiYyIsImxhYmVsIjoiRWl0aGVyIn0seyJpZCI6ImQiLCJsYWJlbCI6Ik5vbmUifV0sInBvaW50cyI6NX0sCiAgIHsiaWQiOiJ2aWV3IiwidHlwZSI6ImxvbmdfdGV4dCIsImxhYmVsIjoiQXNzZXNzbWVudCIsInByb21wdCI6IkNoZWNrIHRoYXQgdGhlIGFjY291bnRpbmcgZXF1YXRpb24gYmFsYW5jZXMgYW5kIGNvbW1lbnQgYnJpZWZseSBvbiB0aGUgc3R1ZGlvJ3MgcHJvZml0YWJpbGl0eSBhbmQgbGlxdWlkaXR5LiIsIm1pbl93b3JkcyI6NDAsInBvaW50cyI6MTV9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{accounting}', true, now()),

('accounting-adjusting-entries-case', 'Year-End Adjustments: Manila Courier',
 'Compute the adjusting entries and the adjusted profit.',
 '
**Manila Courier** has a 31 December year end. Unadjusted profit is **₱300,000**.

| Item | Detail |
|---|---|
| Insurance | ₱36,000 paid on 1 Sep covering 12 months (recorded as prepaid) |
| Advance from a customer | ₱90,000 received on 1 Oct for 6 months of service (recorded as unearned) |
| Wages | ₱28,000 earned by staff but unpaid at year end |
| Supplies | Opening ₱12,000; purchases ₱18,000 (recorded as an asset); closing count ₱9,000 |
| Loan | ₱400,000 at 9% a year, taken on 1 Nov; no interest recorded yet |
', 'Answer in ₱.', 'accounting', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJBZGp1c3RtZW50IG1hdGgiLCJ3ZWlnaHQiOjgwfSx7ImxhYmVsIjoiSnVkZ21lbnQiLCJ3ZWlnaHQiOjIwfV0=', 'base64'), 'UTF8')::jsonb,
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoiaW5zIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6Ikluc3VyYW5jZSBleHBlbnNlIiwicHJvbXB0IjoiSW5zdXJhbmNlIGV4cGVuc2UgZm9yIHRoZSB5ZWFyICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6InVuZWFybmVkIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlJldmVudWUgZWFybmVkIiwicHJvbXB0IjoiU2VydmljZSByZXZlbnVlIGVhcm5lZCBmcm9tIHRoZSBhZHZhbmNlIGJ5IDMxIERlYyAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJ3YWdlcyIsInR5cGUiOiJtY3EiLCJsYWJlbCI6IldhZ2VzIGVudHJ5IiwicHJvbXB0IjoiVGhlIGFkanVzdGluZyBlbnRyeSBmb3IgdGhlIHVucGFpZCB3YWdlcyBpc+KApiIsIm9wdGlvbnMiOlt7ImlkIjoiYSIsImxhYmVsIjoiRHIgV2FnZXMgcGF5YWJsZSAvIENyIFdhZ2VzIGV4cGVuc2UifSx7ImlkIjoiYiIsImxhYmVsIjoiRHIgV2FnZXMgZXhwZW5zZSAvIENyIFdhZ2VzIHBheWFibGUifSx7ImlkIjoiYyIsImxhYmVsIjoiRHIgQ2FzaCAvIENyIFdhZ2VzIGV4cGVuc2UifSx7ImlkIjoiZCIsImxhYmVsIjoiTm8gZW50cnkgaXMgbmVlZGVkIn1dLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6InN1cCIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJTdXBwbGllcyBleHBlbnNlIiwicHJvbXB0IjoiU3VwcGxpZXMgZXhwZW5zZSBmb3IgdGhlIHllYXIgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTR9LAogICB7ImlkIjoiaW50IiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkFjY3J1ZWQgaW50ZXJlc3QiLCJwcm9tcHQiOiJJbnRlcmVzdCBhY2NydWVkIGJ5IDMxIERlYyAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJwcm9maXQiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiQWRqdXN0ZWQgcHJvZml0IiwicHJvbXB0IjoiQWRqdXN0ZWQgcHJvZml0IGFmdGVyIGFsbCBmaXZlIGFkanVzdG1lbnRzICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjIwfSwKICAgeyJpZCI6IndoeSIsInR5cGUiOiJsb25nX3RleHQiLCJsYWJlbCI6IldoeSBhZGp1c3Q/IiwicHJvbXB0IjoiRXhwbGFpbiB3aHkgdGhlc2UgYWRqdXN0bWVudHMgbWF0dGVyIGFuZCB3aGF0IHdvdWxkIGJlIG1pc3N0YXRlZCBpZiB0aGV5IHdlcmUgc2tpcHBlZC4iLCJtaW5fd29yZHMiOjQwLCJwb2ludHMiOjIwfQogXX0=', 'base64'), 'UTF8')::jsonb::jsonb, '{accounting}', true, now()),

('accounting-inventory-depreciation-case', 'Inventory & Depreciation: Davao Hardware',
 'Cost inventory with FIFO and weighted average, then depreciate a van two ways.',
 '
**Davao Hardware** sold **300 units** at **₱400** each during the year.

| Inventory | Units | Cost per unit |
|---|---|---|
| Beginning inventory | 150 | ₱200 |
| Purchases | 250 | ₱220 |

It also bought a **delivery van** for **₱900,000** (salvage ₱100,000, 5-year life).
', 'Answer in ₱. Two decimals where needed.', 'accounting', 'tasks', null, 'intermediate', 25, 100, 60, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJDb3N0aW5nIG1hdGgiLCJ3ZWlnaHQiOjgwfSx7ImxhYmVsIjoiSnVkZ21lbnQiLCJ3ZWlnaHQiOjIwfV0=', 'base64'), 'UTF8')::jsonb,
 '{"technical_knowledge":1.0,"financial_analysis":0.6}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoiZmlmbyIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJGSUZPIENPR1MiLCJwcm9tcHQiOiJDb3N0IG9mIGdvb2RzIHNvbGQgdW5kZXIgRklGTyAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMn0sCiAgIHsiaWQiOiJhdmdjIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkF2ZXJhZ2UgY29zdCIsInByb21wdCI6IldlaWdodGVkLWF2ZXJhZ2UgY29zdCBwZXIgdW5pdCAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjoxMH0sCiAgIHsiaWQiOiJhdmdjb2dzIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkF2ZXJhZ2UgQ09HUyIsInByb21wdCI6IkNvc3Qgb2YgZ29vZHMgc29sZCB1bmRlciB3ZWlnaHRlZCBhdmVyYWdlICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjEyfSwKICAgeyJpZCI6ImVuZGludiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJGSUZPIGVuZGluZyBpbnZlbnRvcnkiLCJwcm9tcHQiOiJFbmRpbmcgaW52ZW50b3J5IHVuZGVyIEZJRk8gKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoiZ3AiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiR3Jvc3MgcHJvZml0IiwicHJvbXB0IjoiR3Jvc3MgcHJvZml0IHVuZGVyIEZJRk8gKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTJ9LAogICB7ImlkIjoic2wiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiU3RyYWlnaHQtbGluZSIsInByb21wdCI6IlN0cmFpZ2h0LWxpbmUgZGVwcmVjaWF0aW9uIHBlciB5ZWFyIGZvciB0aGUgdmFuICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjEwfSwKICAgeyJpZCI6ImRkYiIsInR5cGUiOiJudW1lcmljIiwibGFiZWwiOiJEb3VibGUtZGVjbGluaW5nIiwicHJvbXB0IjoiWWVhci0xIGRlcHJlY2lhdGlvbiB1bmRlciBkb3VibGUtZGVjbGluaW5nIGJhbGFuY2UgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6MTB9LAogICB7ImlkIjoicmlzaW5nIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiTWV0aG9kIGVmZmVjdCIsInByb21wdCI6IldpdGggcmlzaW5nIHB1cmNoYXNlIHByaWNlcywgd2hpY2ggbWV0aG9kIHJlcG9ydHMgdGhlIGhpZ2hlciBwcm9maXQ/Iiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJGSUZPIn0seyJpZCI6ImIiLCJsYWJlbCI6IldlaWdodGVkIGF2ZXJhZ2UifSx7ImlkIjoiYyIsImxhYmVsIjoiVGhleSBhcmUgYWx3YXlzIGVxdWFsIn0seyJpZCI6ImQiLCJsYWJlbCI6Ikl0IGRlcGVuZHMgb25seSBvbiBzYWxlcyJ9XSwicG9pbnRzIjo3fSwKICAgeyJpZCI6InZpZXciLCJ0eXBlIjoibG9uZ190ZXh0IiwibGFiZWwiOiJNZXRob2QgY2hvaWNlIiwicHJvbXB0IjoiV2hpY2ggaW52ZW50b3J5IGFuZCBkZXByZWNpYXRpb24gbWV0aG9kcyB3b3VsZCB5b3UgY2hvb3NlIGFuZCB3aHk/IENvbnNpZGVyIHByb2ZpdCwgdGF4IGFuZCBjb21wYXJhYmlsaXR5LiIsIm1pbl93b3JkcyI6NDAsInBvaW50cyI6MTV9CiBdfQ==', 'base64'), 'UTF8')::jsonb::jsonb, '{accounting}', true, now()),

('exam-accounting-fundamentals', 'Final Exam: Certified Accounting Fundamentals',
 'Timed exam: bad debts, depreciation, inventory, adjustments and revenue.',
 '
**Pasig Retail Corp** (₱), year ended 31 December:

| Item | Detail |
|---|---|
| Credit sales | 5,000,000; gross receivables 800,000; no opening allowance; bad debts estimated at **2% of credit sales** |
| Equipment | Cost 1,200,000; salvage 200,000; life 5 years; straight-line |
| Inventory | Beginning 400,000; purchases 2,100,000; ending 500,000 |
| Prepaid rent | 96,000 paid on 1 Oct for 12 months |
| Customer advance | 180,000 received on 1 Nov for 6 months of service |
| Accrued salaries | 45,000 unpaid at year end |
| Balance sheet | Total assets 3,500,000; total liabilities 1,400,000 |
', 'You have 60 minutes. Pass mark 70.', 'accounting', 'tasks', null, 'advanced', 60, 300, 70, 'auto',
 convert_from(decode('W3sibGFiZWwiOiJBY2NvdW50aW5nIG1hdGgiLCJ3ZWlnaHQiOjc2fSx7ImxhYmVsIjoiSnVkZ21lbnQiLCJ3ZWlnaHQiOjI0fV0=', 'base64'), 'UTF8')::jsonb,
 '{"technical_knowledge":1.0,"financial_analysis":0.8,"communication":0.3}',
 convert_from(decode('eyJ0YXNrcyI6WwogICB7ImlkIjoiYmRlIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkJhZCBkZWJ0IGV4cGVuc2UiLCJwcm9tcHQiOiJCYWQgZGVidCBleHBlbnNlIGZvciB0aGUgeWVhciAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjo4fSwKICAgeyJpZCI6Im5ldGFyIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6Ik5ldCByZWNlaXZhYmxlcyIsInByb21wdCI6Ik5ldCByZWFsaXNhYmxlIHZhbHVlIG9mIHJlY2VpdmFibGVzICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjh9LAogICB7ImlkIjoiZGVwIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IkRlcHJlY2lhdGlvbiIsInByb21wdCI6IkFubnVhbCBzdHJhaWdodC1saW5lIGRlcHJlY2lhdGlvbiAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjo4fSwKICAgeyJpZCI6ImNvZ3MiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiQ09HUyIsInByb21wdCI6IkNvc3Qgb2YgZ29vZHMgc29sZCAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjo4fSwKICAgeyJpZCI6InJlbnQiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiUmVudCBleHBlbnNlIiwicHJvbXB0IjoiUmVudCBleHBlbnNlIGZvciB0aGUgeWVhciAo4oKxKT8iLCJ1bml0Ijoi4oKxIiwicG9pbnRzIjo4fSwKICAgeyJpZCI6InVuZWFybmVkIiwidHlwZSI6Im51bWVyaWMiLCJsYWJlbCI6IlJldmVudWUgZWFybmVkIiwicHJvbXB0IjoiUmV2ZW51ZSBlYXJuZWQgZnJvbSB0aGUgYWR2YW5jZSBieSAzMSBEZWMgKOKCsSk/IiwidW5pdCI6IuKCsSIsInBvaW50cyI6OH0sCiAgIHsiaWQiOiJlcXVpdHkiLCJ0eXBlIjoibnVtZXJpYyIsImxhYmVsIjoiRXF1aXR5IiwicHJvbXB0IjoiVG90YWwgZXF1aXR5ICjigrEpPyIsInVuaXQiOiLigrEiLCJwb2ludHMiOjh9LAogICB7ImlkIjoic2FsIiwidHlwZSI6Im1jcSIsImxhYmVsIjoiU2FsYXJpZXMgZW50cnkiLCJwcm9tcHQiOiJUaGUgYWRqdXN0aW5nIGVudHJ5IGZvciB0aGUgdW5wYWlkIHNhbGFyaWVzIGlz4oCmIiwib3B0aW9ucyI6W3siaWQiOiJhIiwibGFiZWwiOiJEciBTYWxhcmllcyBwYXlhYmxlIC8gQ3IgU2FsYXJpZXMgZXhwZW5zZSJ9LHsiaWQiOiJiIiwibGFiZWwiOiJEciBTYWxhcmllcyBleHBlbnNlIC8gQ3IgU2FsYXJpZXMgcGF5YWJsZSJ9LHsiaWQiOiJjIiwibGFiZWwiOiJEciBDYXNoIC8gQ3IgU2FsYXJpZXMgcGF5YWJsZSJ9LHsiaWQiOiJkIiwibGFiZWwiOiJObyBlbnRyeSJ9XSwicG9pbnRzIjo4fSwKICAgeyJpZCI6ImZpZm8iLCJ0eXBlIjoibWNxIiwibGFiZWwiOiJJbnZlbnRvcnkgbWV0aG9kcyIsInByb21wdCI6IldoZW4gcHVyY2hhc2UgcHJpY2VzIHJpc2UsIHdoaWNoIHN0YXRlbWVudCBpcyB0cnVlPyIsIm9wdGlvbnMiOlt7ImlkIjoiYSIsImxhYmVsIjoiRklGTyBnaXZlcyBsb3dlciBDT0dTIGFuZCBoaWdoZXIgcHJvZml0IHRoYW4gd2VpZ2h0ZWQgYXZlcmFnZSJ9LHsiaWQiOiJiIiwibGFiZWwiOiJGSUZPIGdpdmVzIGhpZ2hlciBDT0dTIHRoYW4gd2VpZ2h0ZWQgYXZlcmFnZSJ9LHsiaWQiOiJjIiwibGFiZWwiOiJMSUZPIGlzIHBlcm1pdHRlZCB1bmRlciBQRlJTIn0seyJpZCI6ImQiLCJsYWJlbCI6IkludmVudG9yeSBtZXRob2RzIG5ldmVyIGFmZmVjdCBwcm9maXQifV0sInBvaW50cyI6Nn0sCiAgIHsiaWQiOiJyZXYiLCJ0eXBlIjoibWNxIiwibGFiZWwiOiJSZXZlbnVlIG1vZGVsIiwicHJvbXB0IjoiVW5kZXIgUEZSUyAxNSwgd2hpY2ggc3RlcCBjb21lcyBpbW1lZGlhdGVseSBiZWZvcmUgcmVjb2duaXNpbmcgcmV2ZW51ZT8iLCJvcHRpb25zIjpbeyJpZCI6ImEiLCJsYWJlbCI6IklkZW50aWZ5IHRoZSBjb250cmFjdCJ9LHsiaWQiOiJiIiwibGFiZWwiOiJBbGxvY2F0ZSB0aGUgdHJhbnNhY3Rpb24gcHJpY2UifSx7ImlkIjoiYyIsImxhYmVsIjoiSWRlbnRpZnkgcGVyZm9ybWFuY2Ugb2JsaWdhdGlvbnMifSx7ImlkIjoiZCIsImxhYmVsIjoiQ29sbGVjdCB0aGUgY2FzaCJ9XSwicG9pbnRzIjo2fSwKICAgeyJpZCI6ImFzc2VzcyIsInR5cGUiOiJsb25nX3RleHQiLCJsYWJlbCI6IkFzc2Vzc21lbnQiLCJwcm9tcHQiOiJXcml0ZSBhIHNob3J0IG5vdGUgdG8gdGhlIENGTyBleHBsYWluaW5nIGhvdyB0aGUgeWVhci1lbmQgYWRqdXN0bWVudHMsIHJlY2VpdmFibGUgYWxsb3dhbmNlIGFuZCBkZXByZWNpYXRpb24gYWZmZWN0IHJlcG9ydGVkIHByb2ZpdCBhbmQgdGhlIGJhbGFuY2Ugc2hlZXQuIiwibWluX3dvcmRzIjo4MCwicG9pbnRzIjoyNH0KIF19', 'base64'), 'UTF8')::jsonb::jsonb, '{certification_exam}', true, now())
on conflict (slug) do nothing;

update public.challenges set time_limit_minutes = 60, max_attempts = 3 where slug = 'exam-accounting-fundamentals';

insert into public.challenge_answer_keys (challenge_id, answers)
select c.id, k.answers::jsonb
from public.challenges c
join (values
 ('accounting-journal-trial-balance', convert_from(decode('eyJjYXNoIjp7ImFuc3dlciI6MjIwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJhciI6eyJhbnN3ZXIiOjYwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJhc3NldHMiOnsiYW5zd2VyIjo2MDAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImxpYWIiOnsiYW5zd2VyIjoyMDAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgIm5pIjp7ImFuc3dlciI6ODAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImVxdWl0eSI6eyJhbnN3ZXIiOjU4MDAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwibmIiOnsiYW5zd2VyIjoiYiJ9LAogICAidmlldyI6eyJrZXl3b3JkcyI6WyJiYWxhbmNlfGVxdWFsfDYwMCwwMDB8YXNzZXRzIiwicHJvZml0fG5ldCBpbmNvbWV8ODAsMDAwfG1hcmdpbiIsImxpcXVpZHxjYXNofHJlY2VpdmFibGUiLCJlcXVpdHl8bGlhYmlsaXQiXSwia2V5d29yZHNfcmVxdWlyZWQiOjN9fQ==', 'base64'), 'UTF8')::jsonb),
 ('accounting-adjusting-entries-case', convert_from(decode('eyJpbnMiOnsiYW5zd2VyIjoxMjAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwidW5lYXJuZWQiOnsiYW5zd2VyIjo0NTAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwid2FnZXMiOnsiYW5zd2VyIjoiYiJ9LCJzdXAiOnsiYW5zd2VyIjoyMTAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgImludCI6eyJhbnN3ZXIiOjYwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sInByb2ZpdCI6eyJhbnN3ZXIiOjI3ODAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgIndoeSI6eyJrZXl3b3JkcyI6WyJwZXJpb2R8bWF0Y2hpbmd8YWNjcnVhbCIsInByb2ZpdHxpbmNvbWV8ZWFybmluZ3MiLCJsaWFiaWxpdHxwYXlhYmxlIiwiYXNzZXR8cHJlcGFpZHxiYWxhbmNlIHNoZWV0Iiwib3ZlcnN0YXR8dW5kZXJzdGF0fG1pc3N0YXQiXSwia2V5d29yZHNfcmVxdWlyZWQiOjN9fQ==', 'base64'), 'UTF8')::jsonb),
 ('accounting-inventory-depreciation-case', convert_from(decode('eyJmaWZvIjp7ImFuc3dlciI6NjMwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImF2Z2MiOnsiYW5zd2VyIjoyMTIuNSwidG9sZXJhbmNlX3BjdCI6MC41fSwiYXZnY29ncyI6eyJhbnN3ZXIiOjYzNzUwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJlbmRpbnYiOnsiYW5zd2VyIjoyMjAwMCwidG9sZXJhbmNlX3BjdCI6MC41fSwKICAgImdwIjp7ImFuc3dlciI6NTcwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sInNsIjp7ImFuc3dlciI6MTYwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJkZGIiOnsiYW5zd2VyIjozNjAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sInJpc2luZyI6eyJhbnN3ZXIiOiJhIn0sCiAgICJ2aWV3Ijp7ImtleXdvcmRzIjpbImZpZm98d2VpZ2h0ZWQgYXZlcmFnZXxpbnZlbnRvcnkiLCJwcm9maXR8aW5jb21lfGNvZ3MiLCJ0YXgiLCJzdHJhaWdodC1saW5lfGRvdWJsZXxkZWNsaW5pbmd8YWNjZWxlcmF0ZWQiLCJjb21wYXJhYnxjb25zaXN0ZW58cGVlciJdLCJrZXl3b3Jkc19yZXF1aXJlZCI6M319', 'base64'), 'UTF8')::jsonb),
 ('exam-accounting-fundamentals', convert_from(decode('eyJiZGUiOnsiYW5zd2VyIjoxMDAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sIm5ldGFyIjp7ImFuc3dlciI6NzAwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJkZXAiOnsiYW5zd2VyIjoyMDAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNX0sImNvZ3MiOnsiYW5zd2VyIjoyMDAwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LAogICAicmVudCI6eyJhbnN3ZXIiOjI0MDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJ1bmVhcm5lZCI6eyJhbnN3ZXIiOjYwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJlcXVpdHkiOnsiYW5zd2VyIjoyMTAwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjV9LCJzYWwiOnsiYW5zd2VyIjoiYiJ9LCJmaWZvIjp7ImFuc3dlciI6ImEifSwicmV2Ijp7ImFuc3dlciI6ImIifSwKICAgImFzc2VzcyI6eyJrZXl3b3JkcyI6WyJhZGp1c3R8YWNjcnVhbCIsImFsbG93YW5jZXxiYWQgZGVidHxyZWNlaXZhYmxlIiwiZGVwcmVjaWF0aW9uIiwicHJvZml0fGluY29tZXxlYXJuaW5ncyIsImJhbGFuY2Ugc2hlZXR8YXNzZXR8bGlhYmlsaXQiXSwia2V5d29yZHNfcmVxdWlyZWQiOjR9fQ==', 'base64'), 'UTF8')::jsonb)
) as k(slug, answers) on k.slug = c.slug
on conflict (challenge_id) do update set answers = excluded.answers, updated_at = now();

-- ---------------------------------------------------------------------
-- 6. The certification
-- ---------------------------------------------------------------------
insert into public.certification_programs (slug, kind, title, subtitle, description, category_id, level, estimated_hours, certificate_title, is_published, sort_order) values
('accounting-fundamentals', 'certification', 'Accounting Fundamentals',
 'From the accounting equation to adjusting entries, inventory, depreciation and revenue.',
 '
The accounting every finance career is built on. Learn to record transactions, adjust for accruals and deferrals, cost inventory, depreciate assets, estimate bad debts and recognise revenue under PFRS 15 — then prove it on real-style cases.

**How it works**
1. Pass each lesson''s video, practice and knowledge check.
2. Pass every hands-on challenge.
3. Pass the **timed final exam** (60 minutes, 70% to pass, 3 attempts).

Your verifiable certificate is issued automatically the moment you pass.
', 'accounting', 'beginner', 4.0, 'Certified Accounting Fundamentals', true, 5)
on conflict (slug) do nothing;

insert into public.program_modules (program_id, position, kind, lesson_id, challenge_id, min_score)
select p.id, m.pos, m.kind,
       case when m.kind = 'lesson' then (select id from public.lessons where slug = m.ref) end,
       case when m.kind in ('challenge','exam') then (select id from public.challenges where slug = m.ref) end,
       m.min_score
from (values
  ('accounting-fundamentals', 1, 'lesson', 'accounting-equation-journal', null::numeric),
  ('accounting-fundamentals', 2, 'challenge', 'accounting-journal-trial-balance', null),
  ('accounting-fundamentals', 3, 'lesson', 'adjusting-entries', null),
  ('accounting-fundamentals', 4, 'challenge', 'accounting-adjusting-entries-case', null),
  ('accounting-fundamentals', 5, 'lesson', 'inventory-cogs-methods', null),
  ('accounting-fundamentals', 6, 'lesson', 'depreciation-ppe', null),
  ('accounting-fundamentals', 7, 'challenge', 'accounting-inventory-depreciation-case', null),
  ('accounting-fundamentals', 8, 'lesson', 'receivables-bad-debts', null),
  ('accounting-fundamentals', 9, 'lesson', 'revenue-recognition', null),
  ('accounting-fundamentals', 10, 'exam', 'exam-accounting-fundamentals', 70)
) as m(program_slug, pos, kind, ref, min_score)
join public.certification_programs p on p.slug = m.program_slug
on conflict (program_id, position) do nothing;
