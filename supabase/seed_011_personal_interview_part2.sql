-- seed_011_personal_interview: part 2 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 3. Practice activities
-- ---------------------------------------------------------------------
insert into public.lesson_activities (lesson_id, slug, position, kind, title, instructions, content)
select l.id, v.slug, v.pos, v.kind, v.title, v.instructions, v.content::jsonb
from (values
('budgeting-503020', 'need-or-want', 1, 'matching', 'Need or want?',
 'Sort each expense into the right bucket.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6Im5lZWQiLCJsYWJlbCI6Ik5lZWQifSx7ImlkIjoid2FudCIsImxhYmVsIjoiV2FudCJ9XSwKICAgICAiaXRlbXMiOlt7ImlkIjoiaTEiLCJsYWJlbCI6IlJlbnQifSx7ImlkIjoiaTIiLCJsYWJlbCI6Ikdyb2NlcmllcyJ9LHsiaWQiOiJpMyIsImxhYmVsIjoiU3RyZWFtaW5nIHN1YnNjcmlwdGlvbiJ9LHsiaWQiOiJpNCIsImxhYmVsIjoiRGluaW5nIG91dCJ9LAogICAgICAgICAgICAgIHsiaWQiOiJpNSIsImxhYmVsIjoiUHVibGljIHRyYW5zcG9ydCB0byB3b3JrIn0seyJpZCI6Imk2IiwibGFiZWwiOiJDb25jZXJ0IHRpY2tldHMifSx7ImlkIjoiaTciLCJsYWJlbCI6Ik1pbmltdW0gbG9hbiBwYXltZW50In0seyJpZCI6Imk4IiwibGFiZWwiOiJFbGVjdHJpY2l0eSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('budgeting-503020', 'build-a-budget', 2, 'worked_example', 'Worked example: build a budget',
 'Split a salary and see what an overspend does. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IlRha2UtaG9tZSBwYXkgaXMg4oKxMzYsMDAwIGEgbW9udGguIEFjdHVhbCByZW50LCBmb29kLCB0cmFuc3BvcnQgYW5kIHV0aWxpdGllcyBhZGQgdXAgdG8g4oKxMjEsMDAwLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiVGhlIDUwJSBuZWVkcyB0YXJnZXQgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzMiIsInByb21wdCI6IlRoZSAzMCUgd2FudHMgdGFyZ2V0ICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczMiLCJwcm9tcHQiOiJUaGUgMjAlIHNhdmluZ3MgdGFyZ2V0ICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczQiLCJwcm9tcHQiOiJCeSBob3cgbXVjaCBkbyBhY3R1YWwgbmVlZHMgZXhjZWVkIHRoZSBuZWVkcyB0YXJnZXQgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzNSIsInByb21wdCI6IklmIHRoYXQgb3ZlcnNwZW5kIGNvbWVzIG91dCBvZiBzYXZpbmdzLCBzYXZpbmdzIGFzIGEgJSBvZiB0YWtlLWhvbWUgKHR3byBkZWNpbWFscyk/IiwidW5pdCI6IiUifV19', 'base64'), 'UTF8')::jsonb),
('compound-interest-saving', 'simple-vs-compound', 1, 'matching', 'Simple or compound?',
 'Which kind of interest does each statement describe?',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6InNpbXBsZSIsImxhYmVsIjoiU2ltcGxlIGludGVyZXN0In0seyJpZCI6ImNvbXAiLCJsYWJlbCI6IkNvbXBvdW5kIGludGVyZXN0In1dLAogICAgICJpdGVtcyI6W3siaWQiOiJpMSIsImxhYmVsIjoiSW50ZXJlc3Qgb25seSBvbiB0aGUgb3JpZ2luYWwgcHJpbmNpcGFsIn0seyJpZCI6ImkyIiwibGFiZWwiOiJJbnRlcmVzdCBvbiBwcmluY2lwYWwgcGx1cyBwYXN0IGludGVyZXN0In0seyJpZCI6ImkzIiwibGFiZWwiOiJHcm93cyBpbiBhIHN0cmFpZ2h0IGxpbmUifSwKICAgICAgICAgICAgICB7ImlkIjoiaTQiLCJsYWJlbCI6Ikdyb3dzIGZhc3RlciBlYWNoIHllYXIifSx7ImlkIjoiaTUiLCJsYWJlbCI6IlR5cGljYWwgb2YgbG9uZy10ZXJtIGludmVzdG1lbnQgZ3Jvd3RoIn0seyJpZCI6Imk2IiwibGFiZWwiOiJVc2VkIGJ5IHNvbWUgc2hvcnQtdGVybSBsb2FucyJ9XX0=', 'base64'), 'UTF8')::jsonb),
('compound-interest-saving', 'compounding-steps', 2, 'worked_example', 'Worked example: compounding year by year',
 'Compare simple and compound growth. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IllvdSBpbnZlc3Qg4oKxMTAwLDAwMCBhdCA1JSBhIHllYXIgZm9yIDMgeWVhcnMuIiwKICAgICAic3RlcHMiOlt7ImlkIjoiczEiLCJwcm9tcHQiOiJUb3RhbCBzaW1wbGUgaW50ZXJlc3Qgb3ZlciAzIHllYXJzICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczIiLCJwcm9tcHQiOiJWYWx1ZSBhZnRlciAzIHllYXJzIHdpdGggc2ltcGxlIGludGVyZXN0ICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczMiLCJwcm9tcHQiOiJDb21wb3VuZCB2YWx1ZSBhZnRlciB5ZWFyIDEgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzNCIsInByb21wdCI6IkNvbXBvdW5kIHZhbHVlIGFmdGVyIHllYXIgMiAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InM1IiwicHJvbXB0IjoiQ29tcG91bmQgdmFsdWUgYWZ0ZXIgeWVhciAzICjigrEsIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('investing-basics-funds', 'which-investment', 1, 'matching', 'Stock, bond or fund?',
 'Match each description to the investment it fits best.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6InN0b2NrIiwibGFiZWwiOiJTdG9jayJ9LHsiaWQiOiJib25kIiwibGFiZWwiOiJCb25kIn0seyJpZCI6ImZ1bmQiLCJsYWJlbCI6IkZ1bmQgKG11dHVhbCBmdW5kIC8gRVRGKSJ9XSwKICAgICAiaXRlbXMiOlt7ImlkIjoiaTEiLCJsYWJlbCI6IkFuIG93bmVyc2hpcCBzaGFyZSBpbiBhIGNvbXBhbnkifSx7ImlkIjoiaTIiLCJsYWJlbCI6IkEgbG9hbiB0byBhIGdvdmVybm1lbnQgb3IgY29tcGFueSJ9LHsiaWQiOiJpMyIsImxhYmVsIjoiUG9vbHMgbW9uZXkgZnJvbSBtYW55IGludmVzdG9ycyJ9LHsiaWQiOiJpNCIsImxhYmVsIjoiUGF5cyBhIGNvdXBvbiBhbmQgcmV0dXJucyBmYWNlIHZhbHVlIGF0IG1hdHVyaXR5In0sCiAgICAgICAgICAgICAgeyJpZCI6Imk1IiwibGFiZWwiOiJNYXkgcGF5IGRpdmlkZW5kcyJ9LHsiaWQiOiJpNiIsImxhYmVsIjoiR2l2ZXMgaW5zdGFudCBkaXZlcnNpZmljYXRpb24ifSx7ImlkIjoiaTciLCJsYWJlbCI6IlByaWNlIGNhbiBzd2luZyB3aWRlbHkgd2l0aCBjb21wYW55IHJlc3VsdHMifSx7ImlkIjoiaTgiLCJsYWJlbCI6IlJ1biBieSBhIHByb2Zlc3Npb25hbCBtYW5hZ2VyIG9yIHRyYWNrcyBhbiBpbmRleCJ9XX0=', 'base64'), 'UTF8')::jsonb),
('investing-basics-funds', 'peso-cost-averaging', 2, 'worked_example', 'Worked example: peso-cost averaging',
 'Invest ₱5,000 each month while the price moves. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IllvdSBpbnZlc3Qg4oKxNSwwMDAgYSBtb250aCBmb3IgNCBtb250aHMgaW4gYSBmdW5kLiBUaGUgdW5pdCBwcmljZSBpbiBlYWNoIG1vbnRoIGlzIOKCsTUwLCDigrE0MCwg4oKxMjUgYW5kIOKCsTUwLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiVW5pdHMgYm91Z2h0IGluIG1vbnRoIDE/IiwidW5pdCI6InVuaXRzIn0seyJpZCI6InMyIiwicHJvbXB0IjoiVW5pdHMgYm91Z2h0IGluIG1vbnRoIDI/IiwidW5pdCI6InVuaXRzIn0seyJpZCI6InMzIiwicHJvbXB0IjoiVW5pdHMgYm91Z2h0IGluIG1vbnRoIDM/IiwidW5pdCI6InVuaXRzIn0sCiAgICAgICAgICAgICAgeyJpZCI6InM0IiwicHJvbXB0IjoiVG90YWwgdW5pdHMgYWZ0ZXIgbW9udGggND8iLCJ1bml0IjoidW5pdHMifSx7ImlkIjoiczUiLCJwcm9tcHQiOiJBdmVyYWdlIGNvc3QgcGVyIHVuaXQgKOKCsSwgdHdvIGRlY2ltYWxzKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InM2IiwicHJvbXB0IjoiVmFsdWUgb2YgdGhlIGhvbGRpbmcgYXQgdGhlIG1vbnRoLTQgcHJpY2Ugb2Yg4oKxNTAgKOKCsSk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('emergency-fund-inflation', 'plan-flaws', 1, 'spot_error', 'Spot the flaws in this money plan',
 'Two parts of Ana''s plan are poor choices. Select them, then check.',
 convert_from(decode('eyJjb250ZXh0IjoiQW5hIHRha2VzIGhvbWUg4oKxMzAsMDAwIGEgbW9udGg7IGVzc2VudGlhbCBleHBlbnNlcyBhcmUg4oKxMTgsMDAwLiIsImNvbHVtbnMiOlsiUGFydCBvZiB0aGUgcGxhbiIsIkNob2ljZSJdLCJzZWxlY3RfY291bnQiOjIsCiAgICAgInJvd3MiOlt7ImlkIjoicjEiLCJjZWxscyI6WyJFbWVyZ2VuY3kgZnVuZCB0YXJnZXQiLCIzIHRvIDYgbW9udGhzIG9mIGVzc2VudGlhbHM6IOKCsTU0LDAwMCB0byDigrExMDgsMDAwIl19LAogICAgICAgICAgICAgeyJpZCI6InIyIiwiY2VsbHMiOlsiV2hlcmUgdGhlIGVtZXJnZW5jeSBmdW5kIGlzIGtlcHQiLCJJbiBhIHZvbGF0aWxlIHN0b2NrIGZ1bmQiXX0sCiAgICAgICAgICAgICB7ImlkIjoicjMiLCJjZWxscyI6WyJEZWJ0IiwiUGF5cyBvbmx5IHRoZSBtaW5pbXVtIG9uIGEgY2FyZCBjaGFyZ2luZyAzNiUgYSB5ZWFyIHdoaWxlIGludmVzdGluZyBpbiBhIDYlIGJvbmQgZnVuZCJdfSwKICAgICAgICAgICAgIHsiaWQiOiJyNCIsImNlbGxzIjpbIk1vbnRobHkgc2F2aW5nIiwi4oKxNiwwMDAgKDIwJSBvZiB0YWtlLWhvbWUpIl19LAogICAgICAgICAgICAgeyJpZCI6InI1IiwiY2VsbHMiOlsiUmV2aWV3IiwiUmV2aXNpdHMgdGhlIHBsYW4gb25jZSBhIHllYXIiXX1dfQ==', 'base64'), 'UTF8')::jsonb),
('emergency-fund-inflation', 'fund-target', 2, 'worked_example', 'Worked example: set an emergency fund target',
 'Work out the target and how long it takes. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkVzc2VudGlhbCBleHBlbnNlcyBhcmUg4oKxMjQsMDAwIGEgbW9udGguIFlvdSBjYW4gc2F2ZSDigrE0LDAwMCBhIG1vbnRoLiBJbmZsYXRpb24gaXMgNCUgYSB5ZWFyLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiQSAzLW1vbnRoIGVtZXJnZW5jeSBmdW5kIHRhcmdldCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InMyIiwicHJvbXB0IjoiQSA2LW1vbnRoIGVtZXJnZW5jeSBmdW5kIHRhcmdldCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0sCiAgICAgICAgICAgICAgeyJpZCI6InMzIiwicHJvbXB0IjoiTW9udGhzIHRvIHJlYWNoIHRoZSAzLW1vbnRoIHRhcmdldD8iLCJ1bml0IjoibW9udGhzIn0seyJpZCI6InM0IiwicHJvbXB0IjoiTW9udGhzIHRvIHJlYWNoIHRoZSA2LW1vbnRoIHRhcmdldD8iLCJ1bml0IjoibW9udGhzIn0sCiAgICAgICAgICAgICAgeyJpZCI6InM1IiwicHJvbXB0IjoiVGhlIDMtbW9udGggdGFyZ2V0J3MgdmFsdWUgaW4gdG9kYXkncyBwZXNvcyBhZnRlciBvbmUgeWVhciBvZiA0JSBpbmZsYXRpb24gKOKCsSwgdHdvIGRlY2ltYWxzKT8iLCJ1bml0Ijoi4oKxIn1dfQ==', 'base64'), 'UTF8')::jsonb),
('interview-three-statements', 'where-first', 1, 'matching', 'Where does it first appear?',
 'Sort each line item into the statement where it first appears.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImlzIiwibGFiZWwiOiJJbmNvbWUgc3RhdGVtZW50In0seyJpZCI6ImJzIiwibGFiZWwiOiJCYWxhbmNlIHNoZWV0In0seyJpZCI6ImNmcyIsImxhYmVsIjoiQ2FzaCBmbG93IHN0YXRlbWVudCJ9XSwKICAgICAiaXRlbXMiOlt7ImlkIjoiaTEiLCJsYWJlbCI6IkRlcHJlY2lhdGlvbiBleHBlbnNlIn0seyJpZCI6ImkyIiwibGFiZWwiOiJBY2NvdW50cyByZWNlaXZhYmxlIn0seyJpZCI6ImkzIiwibGFiZWwiOiJQdXJjaGFzZSBvZiBlcXVpcG1lbnQifSx7ImlkIjoiaTQiLCJsYWJlbCI6IlJldGFpbmVkIGVhcm5pbmdzIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk1IiwibGFiZWwiOiJEaXZpZGVuZHMgcGFpZCJ9LHsiaWQiOiJpNiIsImxhYmVsIjoiSW50ZXJlc3QgZXhwZW5zZSJ9LHsiaWQiOiJpNyIsImxhYmVsIjoiSW52ZW50b3J5In0seyJpZCI6Imk4IiwibGFiZWwiOiJQcm9jZWVkcyBmcm9tIGEgYm9uZCBpc3N1ZSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('interview-three-statements', 'twenty-of-depreciation', 2, 'worked_example', 'Worked example: ₱20 of extra depreciation',
 'Walk through the interview classic. Tax rate is 25%. Use negative numbers for decreases.',
 convert_from(decode('eyJpbnRybyI6IkRlcHJlY2lhdGlvbiByaXNlcyBieSDigrEyMC4gUmV2ZW51ZSwgY2FzaCBleHBlbnNlcywgY2FwZXggYW5kIGZpbmFuY2luZyBhcmUgdW5jaGFuZ2VkLiBUaGUgdGF4IHJhdGUgaXMgMjUlLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiQ2hhbmdlIGluIEVCSVQgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzMiIsInByb21wdCI6IkNoYW5nZSBpbiB0YXhlcyBwYWlkICjigrEsIG5lZ2F0aXZlIGlmIHRheGVzIGZhbGwpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczMiLCJwcm9tcHQiOiJDaGFuZ2UgaW4gbmV0IGluY29tZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InM0IiwicHJvbXB0IjoiQ2hhbmdlIGluIGNhc2ggZnJvbSBvcGVyYXRpb25zICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczUiLCJwcm9tcHQiOiJDaGFuZ2UgaW4gdG90YWwgYXNzZXRzIG9uIHRoZSBiYWxhbmNlIHNoZWV0IChjYXNoIHVwLCBQUCZFIGRvd24pICjigrEpPyIsInVuaXQiOiLigrEifV19', 'base64'), 'UTF8')::jsonb),
('interview-dcf-walkthrough', 'dcf-order', 1, 'matching', 'Put the DCF pieces in the right step',
 'Match each piece to the step of the DCF it belongs to.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImNmIiwibGFiZWwiOiJQcm9qZWN0IGNhc2ggZmxvd3MifSx7ImlkIjoicmF0ZSIsImxhYmVsIjoiRGlzY291bnQgcmF0ZSJ9LHsiaWQiOiJ0diIsImxhYmVsIjoiVGVybWluYWwgdmFsdWUifSx7ImlkIjoiYnJpZGdlIiwibGFiZWwiOiJCcmlkZ2UgdG8gZXF1aXR5In1dLAogICAgICJpdGVtcyI6W3siaWQiOiJpMSIsImxhYmVsIjoiUmV2ZW51ZSBhbmQgbWFyZ2luIGFzc3VtcHRpb25zIn0seyJpZCI6ImkyIiwibGFiZWwiOiJFQklUIMOXICgxIOKIkiB0KSArIEQmQSDiiJIgY2FwZXgg4oiSIGNoYW5nZSBpbiBOV0MifSx7ImlkIjoiaTMiLCJsYWJlbCI6IkNBUE0gYW5kIGFmdGVyLXRheCBjb3N0IG9mIGRlYnQifSx7ImlkIjoiaTQiLCJsYWJlbCI6IldlaWdodHMgb2YgZGVidCBhbmQgZXF1aXR5In0sCiAgICAgICAgICAgICAgeyJpZCI6Imk1IiwibGFiZWwiOiJHb3Jkb24gZ3Jvd3RoIGZvcm11bGEifSx7ImlkIjoiaTYiLCJsYWJlbCI6IkV4aXQgbXVsdGlwbGUifSx7ImlkIjoiaTciLCJsYWJlbCI6IlN1YnRyYWN0IG5ldCBkZWJ0In0seyJpZCI6Imk4IiwibGFiZWwiOiJEaXZpZGUgYnkgZGlsdXRlZCBzaGFyZXMifV19', 'base64'), 'UTF8')::jsonb),
('interview-dcf-walkthrough', 'mini-dcf', 2, 'worked_example', 'Worked example: a two-year DCF',
 'Discount two years of cash flow and a terminal value, then bridge to a share price.',
 convert_from(decode('eyJpbnRybyI6IkZyZWUgY2FzaCBmbG93OiDigrExMDAgaW4geWVhciAxIGFuZCDigrExMTAgaW4geWVhciAyLiBUaGUgdGVybWluYWwgdmFsdWUgYXQgdGhlIGVuZCBvZiB5ZWFyIDIgaXMg4oKxMSwzMjAuIFdBQ0MgaXMgMTAlLiBOZXQgZGVidCBpcyDigrEzMDAgYW5kIHRoZXJlIGFyZSAxMDAgc2hhcmVzLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiUFYgb2YgeWVhci0xIGNhc2ggZmxvdyAo4oKxLCB0d28gZGVjaW1hbHMpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczIiLCJwcm9tcHQiOiJQViBvZiB5ZWFyLTIgY2FzaCBmbG93ICjigrEsIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzMyIsInByb21wdCI6IlBWIG9mIHRoZSB0ZXJtaW5hbCB2YWx1ZSAo4oKxLCB0d28gZGVjaW1hbHMpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczQiLCJwcm9tcHQiOiJFbnRlcnByaXNlIHZhbHVlICjigrEsIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzNSIsInByb21wdCI6IkVxdWl0eSB2YWx1ZSAo4oKxLCB0d28gZGVjaW1hbHMpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczYiLCJwcm9tcHQiOiJWYWx1ZSBwZXIgc2hhcmUgKOKCsSwgdHdvIGRlY2ltYWxzKT8iLCJ1bml0Ijoi4oKxIn1dfQ==', 'base64'), 'UTF8')::jsonb),
('interview-ev-equity', 'added-or-subtracted', 1, 'matching', 'Added or subtracted?',
 'Moving from equity value to enterprise value, is each item added or subtracted?',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImFkZCIsImxhYmVsIjoiQWRkZWQifSx7ImlkIjoic3ViIiwibGFiZWwiOiJTdWJ0cmFjdGVkIn1dLAogICAgICJpdGVtcyI6W3siaWQiOiJpMSIsImxhYmVsIjoiQmFuayBkZWJ0In0seyJpZCI6ImkyIiwibGFiZWwiOiJQcmVmZXJyZWQgc3RvY2sifSx7ImlkIjoiaTMiLCJsYWJlbCI6Ik1pbm9yaXR5IGludGVyZXN0In0seyJpZCI6Imk0IiwibGFiZWwiOiJDYXNoIGFuZCBlcXVpdmFsZW50cyJ9LHsiaWQiOiJpNSIsImxhYmVsIjoiU2hvcnQtdGVybSBpbnZlc3RtZW50cyJ9LHsiaWQiOiJpNiIsImxhYmVsIjoiQm9uZHMgcGF5YWJsZSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('interview-ev-equity', 'equity-to-ev', 2, 'worked_example', 'Worked example: equity value to EV and multiples',
 'Build the bridge and compute the multiples. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IlNoYXJlIHByaWNlIOKCsTQwOyBkaWx1dGVkIHNoYXJlcyAyNSBtaWxsaW9uLiBEZWJ0IOKCsTM1MG07IHByZWZlcnJlZCBzdG9jayDigrE1MG07IG1pbm9yaXR5IGludGVyZXN0IOKCsTIwbTsgY2FzaCDigrExMjBtLiBFQklUREEg4oKxMjYwbTsgbmV0IGluY29tZSDigrE4MG0uIiwKICAgICAic3RlcHMiOlt7ImlkIjoiczEiLCJwcm9tcHQiOiJFcXVpdHkgdmFsdWUgKOKCsW0pPyIsInVuaXQiOiLigrFtIn0seyJpZCI6InMyIiwicHJvbXB0IjoiRW50ZXJwcmlzZSB2YWx1ZSAo4oKxbSk/IiwidW5pdCI6IuKCsW0ifSx7ImlkIjoiczMiLCJwcm9tcHQiOiJFVi9FQklUREEgKHgpPyIsInVuaXQiOiJ4In0sCiAgICAgICAgICAgICAgeyJpZCI6InM0IiwicHJvbXB0IjoiUC9FICh4KT8iLCJ1bml0IjoieCJ9LHsiaWQiOiJzNSIsInByb21wdCI6IkltcGxpZWQgRVYgYXQgNnggRUJJVERBICjigrFtKT8iLCJ1bml0Ijoi4oKxbSJ9LHsiaWQiOiJzNiIsInByb21wdCI6IkltcGxpZWQgc2hhcmUgcHJpY2UgYXQgNnggRUJJVERBICjigrEsIHR3byBkZWNpbWFscyk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('budgeting-503020', 'need-or-want', convert_from(decode('eyJpMSI6Im5lZWQiLCJpMiI6Im5lZWQiLCJpMyI6IndhbnQiLCJpNCI6IndhbnQiLCJpNSI6Im5lZWQiLCJpNiI6IndhbnQiLCJpNyI6Im5lZWQiLCJpOCI6Im5lZWQifQ==', 'base64'), 'UTF8')::jsonb),
('budgeting-503020', 'build-a-budget', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjE4MDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiI1MCUgb2YgdGFrZS1ob21lLiIsImV4cGxhbmF0aW9uIjoiMzYsMDAwIMOXIDUwJSA9IDE4LDAwMC4ifSwKICAiczIiOnsiYW5zd2VyIjoxMDgwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMzAlIG9mIHRha2UtaG9tZS4iLCJleHBsYW5hdGlvbiI6IjM2LDAwMCDDlyAzMCUgPSAxMCw4MDAuIn0sCiAgInMzIjp7ImFuc3dlciI6NzIwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMjAlIG9mIHRha2UtaG9tZS4iLCJleHBsYW5hdGlvbiI6IjM2LDAwMCDDlyAyMCUgPSA3LDIwMC4ifSwKICAiczQiOnsiYW5zd2VyIjozMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJBY3R1YWwgbmVlZHMgbWludXMgdGhlIHRhcmdldC4iLCJleHBsYW5hdGlvbiI6IjIxLDAwMCDiiJIgMTgsMDAwID0gMywwMDAuIn0sCiAgInM1Ijp7ImFuc3dlciI6MTEuNjcsInRvbGVyYW5jZV9wY3QiOjEsImhpbnQiOiJTYXZpbmdzIGZhbGwgdG8gNywyMDAg4oiSIDMsMDAwLCB0aGVuIGRpdmlkZSBieSAzNiwwMDAuIiwiZXhwbGFuYXRpb24iOiI0LDIwMCDDtyAzNiwwMDAgPSAxMS42NyUuIE92ZXJzcGVuZGluZyBvbiBuZWVkcyBlYXRzIGludG8gc2F2aW5ncy4ifX0=', 'base64'), 'UTF8')::jsonb),
('compound-interest-saving', 'simple-vs-compound', convert_from(decode('eyJpMSI6InNpbXBsZSIsImkyIjoiY29tcCIsImkzIjoic2ltcGxlIiwiaTQiOiJjb21wIiwiaTUiOiJjb21wIiwiaTYiOiJzaW1wbGUifQ==', 'base64'), 'UTF8')::jsonb),
('compound-interest-saving', 'compounding-steps', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjE1MDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJQcmluY2lwYWwgw5cgcmF0ZSDDlyB5ZWFycy4iLCJleHBsYW5hdGlvbiI6IjEwMCwwMDAgw5cgNSUgw5cgMyA9IDE1LDAwMC4ifSwKICAiczIiOnsiYW5zd2VyIjoxMTUwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlByaW5jaXBhbCBwbHVzIGludGVyZXN0LiIsImV4cGxhbmF0aW9uIjoiMTAwLDAwMCArIDE1LDAwMCA9IDExNSwwMDAuIn0sCiAgInMzIjp7ImFuc3dlciI6MTA1MDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIxMDAsMDAwIMOXIDEuMDUuIiwiZXhwbGFuYXRpb24iOiIxMDAsMDAwIMOXIDEuMDUgPSAxMDUsMDAwLiJ9LAogICJzNCI6eyJhbnN3ZXIiOjExMDI1MCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMTA1LDAwMCDDlyAxLjA1LiIsImV4cGxhbmF0aW9uIjoiMTA1LDAwMCDDlyAxLjA1ID0gMTEwLDI1MC4ifSwKICAiczUiOnsiYW5zd2VyIjoxMTU3NjIuNSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMTEwLDI1MCDDlyAxLjA1LiIsImV4cGxhbmF0aW9uIjoiMTEwLDI1MCDDlyAxLjA1ID0gMTE1LDc2Mi41MCDigJQgbW9yZSB0aGFuIHNpbXBsZSBpbnRlcmVzdCwgYmVjYXVzZSBpbnRlcmVzdCBlYXJucyBpbnRlcmVzdC4ifX0=', 'base64'), 'UTF8')::jsonb),
('investing-basics-funds', 'which-investment', convert_from(decode('eyJpMSI6InN0b2NrIiwiaTIiOiJib25kIiwiaTMiOiJmdW5kIiwiaTQiOiJib25kIiwiaTUiOiJzdG9jayIsImk2IjoiZnVuZCIsImk3Ijoic3RvY2siLCJpOCI6ImZ1bmQifQ==', 'base64'), 'UTF8')::jsonb),
('investing-basics-funds', 'peso-cost-averaging', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjEwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiNSwwMDAgw7cgNTAuIiwiZXhwbGFuYXRpb24iOiI1LDAwMCDDtyA1MCA9IDEwMCB1bml0cy4ifSwKICAiczIiOnsiYW5zd2VyIjoxMjUsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjUsMDAwIMO3IDQwLiIsImV4cGxhbmF0aW9uIjoiNSwwMDAgw7cgNDAgPSAxMjUgdW5pdHMuIn0sCiAgInMzIjp7ImFuc3dlciI6MjAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiI1LDAwMCDDtyAyNS4iLCJleHBsYW5hdGlvbiI6IjUsMDAwIMO3IDI1ID0gMjAwIHVuaXRzIOKAlCBtb3JlIHVuaXRzIHdoZW4gdGhlIHByaWNlIGlzIGxvdy4ifSwKICAiczQiOnsiYW5zd2VyIjo1MjUsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkFkZCBhbGwgZm91ciBtb250aHM6IHRoZSBsYXN0IGJ1eXMgMTAwIHVuaXRzIGF0IOKCsTUwLiIsImV4cGxhbmF0aW9uIjoiMTAwICsgMTI1ICsgMjAwICsgMTAwID0gNTI1IHVuaXRzLiJ9LAogICJzNSI6eyJhbnN3ZXIiOjM4LjEsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlRvdGFsIGludmVzdGVkIMO3IHRvdGFsIHVuaXRzLiIsImV4cGxhbmF0aW9uIjoiMjAsMDAwIMO3IDUyNSA9IDM4LjEwIOKAlCBsb3dlciB0aGFuIHRoZSBhdmVyYWdlIG9mIHRoZSBmb3VyIHByaWNlcy4ifSwKICAiczYiOnsiYW5zd2VyIjoyNjI1MCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiVW5pdHMgw5cg4oKxNTAuIiwiZXhwbGFuYXRpb24iOiI1MjUgw5cgNTAgPSAyNiwyNTAuIn19', 'base64'), 'UTF8')::jsonb),
('emergency-fund-inflation', 'plan-flaws', convert_from(decode('eyJlcnJvcnMiOlsicjIiLCJyMyJdLCJleHBsYW5hdGlvbnMiOnsicjIiOiJBbiBlbWVyZ2VuY3kgZnVuZCBtdXN0IGJlIHNhZmUgYW5kIGFjY2Vzc2libGUuIEEgdm9sYXRpbGUgc3RvY2sgZnVuZCBjYW4gYmUgZG93biBleGFjdGx5IHdoZW4geW91IG5lZWQgdGhlIG1vbmV5LiIsInIzIjoiUGF5aW5nIDM2JSBvbiBhIGNhcmQgd2hpbGUgZWFybmluZyBhYm91dCA2JSBsb3NlcyBtb25leS4gUGF5IG9mZiBoaWdoLWludGVyZXN0IGRlYnQgYmVmb3JlIGludmVzdGluZyBmb3IgbW9kZXN0IHJldHVybnMuIn19', 'base64'), 'UTF8')::jsonb),
('emergency-fund-inflation', 'fund-target', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjcyMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIzIMOXIDI0LDAwMC4iLCJleHBsYW5hdGlvbiI6IjMgw5cgMjQsMDAwID0gNzIsMDAwLiJ9LAogICJzMiI6eyJhbnN3ZXIiOjE0NDAwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiNiDDlyAyNCwwMDAuIiwiZXhwbGFuYXRpb24iOiI2IMOXIDI0LDAwMCA9IDE0NCwwMDAuIn0sCiAgInMzIjp7ImFuc3dlciI6MTgsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjcyLDAwMCDDtyA0LDAwMC4iLCJleHBsYW5hdGlvbiI6IjcyLDAwMCDDtyA0LDAwMCA9IDE4IG1vbnRocy4ifSwKICAiczQiOnsiYW5zd2VyIjozNiwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMTQ0LDAwMCDDtyA0LDAwMC4iLCJleHBsYW5hdGlvbiI6IjE0NCwwMDAgw7cgNCwwMDAgPSAzNiBtb250aHMuIn0sCiAgInM1Ijp7ImFuc3dlciI6NjkyMzAuNzcsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjcyLDAwMCDDtyAxLjA0LiIsImV4cGxhbmF0aW9uIjoiNzIsMDAwIMO3IDEuMDQgPSA2OSwyMzAuNzc6IGluZmxhdGlvbiBzaHJpbmtzIHdoYXQgY2FzaCBjYW4gYnV5LiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('interview-three-statements', 'where-first', convert_from(decode('eyJpMSI6ImlzIiwiaTIiOiJicyIsImkzIjoiY2ZzIiwiaTQiOiJicyIsImk1IjoiY2ZzIiwiaTYiOiJpcyIsImk3IjoiYnMiLCJpOCI6ImNmcyJ9', 'base64'), 'UTF8')::jsonb),
('interview-three-statements', 'twenty-of-depreciation', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOi0yMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiRGVwcmVjaWF0aW9uIGlzIGFuIG9wZXJhdGluZyBleHBlbnNlLiIsImV4cGxhbmF0aW9uIjoiRUJJVCBmYWxscyBieSAyMC4ifSwKICAiczIiOnsiYW5zd2VyIjotNSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMjUlIG9mIHRoZSAyMCByZWR1Y3Rpb24gaW4gcHJlLXRheCBwcm9maXQuIiwiZXhwbGFuYXRpb24iOiJUYXhlcyBmYWxsIGJ5IDI1JSDDlyAyMCA9IDUuIn0sCiAgInMzIjp7ImFuc3dlciI6LTE1LCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJFQklUIGNoYW5nZSBtaW51cyB0aGUgdGF4IHNhdmluZy4iLCJleHBsYW5hdGlvbiI6IuKIkjIwICsgNSA9IOKIkjE1LiJ9LAogICJzNCI6eyJhbnN3ZXIiOjUsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlN0YXJ0IHdpdGggdGhlIG5ldCBpbmNvbWUgY2hhbmdlIGFuZCBhZGQgYmFjayB0aGUgbm9uLWNhc2ggMjAuIiwiZXhwbGFuYXRpb24iOiLiiJIxNSArIDIwID0gKzUgKHRoZSB0YXggc2hpZWxkKS4ifSwKICAiczUiOnsiYW5zd2VyIjotMTUsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkNhc2ggKzUgYW5kIFBQJkUg4oiSMjAuIiwiZXhwbGFuYXRpb24iOiIrNSDiiJIgMjAgPSDiiJIxNSwgbWF0Y2hpbmcgdGhlIOKIkjE1IGZhbGwgaW4gcmV0YWluZWQgZWFybmluZ3MuIEl0IGJhbGFuY2VzLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('interview-dcf-walkthrough', 'dcf-order', convert_from(decode('eyJpMSI6ImNmIiwiaTIiOiJjZiIsImkzIjoicmF0ZSIsImk0IjoicmF0ZSIsImk1IjoidHYiLCJpNiI6InR2IiwiaTciOiJicmlkZ2UiLCJpOCI6ImJyaWRnZSJ9', 'base64'), 'UTF8')::jsonb),
('interview-dcf-walkthrough', 'mini-dcf', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjkwLjkxLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIxMDAgw7cgMS4xMC4iLCJleHBsYW5hdGlvbiI6IjEwMCDDtyAxLjEgPSA5MC45MS4ifSwKICAiczIiOnsiYW5zd2VyIjo5MC45MSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMTEwIMO3IDEuMTDCsi4iLCJleHBsYW5hdGlvbiI6IjExMCDDtyAxLjIxID0gOTAuOTEuIn0sCiAgInMzIjp7ImFuc3dlciI6MTA5MC45MSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiRGlzY291bnQgdGhlIHRlcm1pbmFsIHZhbHVlIGJ5IHR3byB5ZWFycy4iLCJleHBsYW5hdGlvbiI6IjEsMzIwIMO3IDEuMjEgPSAxLDA5MC45MS4ifSwKICAiczQiOnsiYW5zd2VyIjoxMjcyLjczLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJBZGQgdGhlIHRocmVlIHByZXNlbnQgdmFsdWVzLiIsImV4cGxhbmF0aW9uIjoiOTAuOTEgKyA5MC45MSArIDEsMDkwLjkxID0gMSwyNzIuNzMuIn0sCiAgInM1Ijp7ImFuc3dlciI6OTcyLjczLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJTdWJ0cmFjdCBuZXQgZGVidC4iLCJleHBsYW5hdGlvbiI6IjEsMjcyLjczIOKIkiAzMDAgPSA5NzIuNzMuIn0sCiAgInM2Ijp7ImFuc3dlciI6OS43MywidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiRGl2aWRlIGJ5IDEwMCBzaGFyZXMuIiwiZXhwbGFuYXRpb24iOiI5NzIuNzMgw7cgMTAwID0gOS43My4gTm90ZSB0aGUgdGVybWluYWwgdmFsdWUgaXMgODYlIG9mIEVWLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('interview-ev-equity', 'added-or-subtracted', convert_from(decode('eyJpMSI6ImFkZCIsImkyIjoiYWRkIiwiaTMiOiJhZGQiLCJpNCI6InN1YiIsImk1Ijoic3ViIiwiaTYiOiJhZGQifQ==', 'base64'), 'UTF8')::jsonb),
('interview-ev-equity', 'equity-to-ev', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjEwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlByaWNlIMOXIGRpbHV0ZWQgc2hhcmVzLiIsImV4cGxhbmF0aW9uIjoiNDAgw5cgMjUgPSAxLDAwMC4ifSwKICAiczIiOnsiYW5zd2VyIjoxMzAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJBZGQgZGVidCwgcHJlZmVycmVkIGFuZCBtaW5vcml0eSBpbnRlcmVzdDsgc3VidHJhY3QgY2FzaC4iLCJleHBsYW5hdGlvbiI6IjEsMDAwICsgMzUwICsgNTAgKyAyMCDiiJIgMTIwID0gMSwzMDAuIn0sCiAgInMzIjp7ImFuc3dlciI6NSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiRVYgw7cgRUJJVERBLiIsImV4cGxhbmF0aW9uIjoiMSwzMDAgw7cgMjYwID0gNS4weC4ifSwKICAiczQiOnsiYW5zd2VyIjoxMi41LCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJFcXVpdHkgdmFsdWUgw7cgbmV0IGluY29tZS4iLCJleHBsYW5hdGlvbiI6IjEsMDAwIMO3IDgwID0gMTIuNXguIn0sCiAgInM1Ijp7ImFuc3dlciI6MTU2MCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiRUJJVERBIMOXIDYuIiwiZXhwbGFuYXRpb24iOiIyNjAgw5cgNiA9IDEsNTYwLiJ9LAogICJzNiI6eyJhbnN3ZXIiOjUwLjQsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlN1YnRyYWN0IHRoZSBuZXQgY2xhaW1zICgzNTAgKyA1MCArIDIwIOKIkiAxMjAgPSAzMDApLCB0aGVuIGRpdmlkZSBieSBzaGFyZXMuIiwiZXhwbGFuYXRpb24iOiIoMSw1NjAg4oiSIDMwMCkgw7cgMjUgPSA1MC40MC4ifX0=', 'base64'), 'UTF8')::jsonb)
) as v(lesson, slug, key)
join public.lessons l on l.slug = v.lesson
join public.lesson_activities a on a.lesson_id = l.id and a.slug = v.slug
on conflict (activity_id) do update set key = excluded.key, updated_at = now();

-- ---------------------------------------------------------------------
-- 4. Flashcards
-- ---------------------------------------------------------------------
insert into public.flashcards (lesson_id, position, front, back)
select l.id, v.pos, v.front, v.back
from (values
('budgeting-503020',1,'The 50/30/20 rule','50% needs, 30% wants, 20% savings and debt repayment.'),
('budgeting-503020',2,'Take-home pay','Pay after tax and mandatory contributions.'),
('budgeting-503020',3,'Examples of needs','Rent, groceries, utilities, transport to work, minimum debt payments.'),
('budgeting-503020',4,'Examples of wants','Dining out, streaming, hobbies, travel, shopping.'),
('budgeting-503020',5,'Pay yourself first','Move savings out when you are paid, before spending.'),
('budgeting-503020',6,'Needs above 50% of pay','Trim wants or raise income, and adjust the split rather than quit budgeting.'),
('budgeting-503020',7,'Why track spending?','To see where money really goes before setting limits.'),
('budgeting-503020',8,'What goes in the 20%?','Emergency fund, investments and extra debt payments.'),
('budgeting-503020',9,'Needs % of take-home =','Total needs ÷ take-home pay.'),
('budgeting-503020',10,'A budget is…','A decision about what your money should do before it disappears.'),
('compound-interest-saving',1,'Simple interest','Interest only on the original principal.'),
('compound-interest-saving',2,'Compound interest','Interest on principal plus previously earned interest.'),
('compound-interest-saving',3,'Compound value','Principal × (1 + rate)^years.'),
('compound-interest-saving',4,'Rule of 72','Years to double ≈ 72 ÷ rate (%).'),
('compound-interest-saving',5,'Why start early?','More time for compounding to work.'),
('compound-interest-saving',6,'Real return','≈ nominal return − inflation.'),
('compound-interest-saving',7,'Savings rate below inflation','Purchasing power falls.'),
('compound-interest-saving',8,'Two levers of saving','How much you save and how long it compounds.'),
('compound-interest-saving',9,'Simple vs compound growth shape','Simple is a straight line; compound accelerates.'),
('compound-interest-saving',10,'Total simple interest','Principal × rate × years.'),
('investing-basics-funds',1,'Stock','A share of ownership in a company.'),
('investing-basics-funds',2,'Bond','A loan that pays a coupon and returns face value at maturity.'),
('investing-basics-funds',3,'Mutual fund / ETF','A pooled basket of securities giving instant diversification.'),
('investing-basics-funds',4,'ETF vs mutual fund','ETFs trade on an exchange all day; mutual funds are priced once a day.'),
('investing-basics-funds',5,'Risk and return','Higher potential return comes with higher risk.'),
('investing-basics-funds',6,'Diversification','Spread money so no single investment can sink you.'),
('investing-basics-funds',7,'Expense ratio','The yearly fee a fund charges, as a % of assets.'),
('investing-basics-funds',8,'Time horizon rule','Money needed within about 2 years belongs in low-risk assets.'),
('investing-basics-funds',9,'Dividend yield','Annual dividend ÷ share price.'),
('investing-basics-funds',10,'Peso-cost averaging','Invest a fixed amount at regular intervals.'),
('emergency-fund-inflation',1,'Emergency fund','Cash set aside for job loss, medical bills or urgent repairs.'),
('emergency-fund-inflation',2,'How much to hold','Typically 3–6 months of essential expenses.'),
('emergency-fund-inflation',3,'Where to keep it','A safe, accessible account such as savings or a money-market fund.'),
('emergency-fund-inflation',4,'Inflation','Rising prices that erode the purchasing power of cash.'),
('emergency-fund-inflation',5,'Real return','≈ interest rate − inflation.'),
('emergency-fund-inflation',6,'Order of priorities','Starter emergency fund, then high-interest debt, then long-term investing.'),
('emergency-fund-inflation',7,'Who needs a bigger fund?','Freelancers and single-income households.'),
('emergency-fund-inflation',8,'Purchasing power after inflation','Amount ÷ (1 + inflation).'),
('emergency-fund-inflation',9,'Why not invest the emergency fund in stocks?','They can fall exactly when you need the money.'),
('emergency-fund-inflation',10,'Why revisit the target yearly?','As prices rise, a fixed peso amount covers less.'),
('interview-three-statements',1,'How are the three statements linked?','Net income feeds the cash flow statement and retained earnings; the cash flow statement ends in the change in cash on the balance sheet.'),
('interview-three-statements',2,'Depreciation +₱20, tax 25%: net income','Falls by ₱15.'),
('interview-three-statements',3,'Depreciation +₱20, tax 25%: operating cash flow','Rises by ₱5 (the tax shield).'),
('interview-three-statements',4,'Depreciation +₱20: balance sheet','Cash +5, PP&E −20, assets −15; retained earnings −15.'),
('interview-three-statements',5,'Increase in receivables','Lowers operating cash flow.'),
('interview-three-statements',6,'Buy equipment with cash','Total assets unchanged (cash down, PP&E up).'),
('interview-three-statements',7,'Borrow to buy inventory','Assets and liabilities both rise.'),
('interview-three-statements',8,'Retained earnings change','Net income minus dividends.'),
('interview-three-statements',9,'After-tax effect of an expense','Expense × (1 − tax rate).'),
('interview-three-statements',10,'What do interviewers want?','The why, not only the steps.'),
('interview-dcf-walkthrough',1,'60-second DCF answer','Project UFCF, add terminal value, discount at WACC to get EV, subtract net debt for equity value, divide by diluted shares.'),
('interview-dcf-walkthrough',2,'UFCF','EBIT × (1 − t) + D&A − capex − increase in NWC.'),
('interview-dcf-walkthrough',3,'Gordon growth terminal value','FCF × (1 + g) ÷ (WACC − g).'),
('interview-dcf-walkthrough',4,'Other terminal value method','Exit multiple (e.g. EBITDA × EV/EBITDA).'),
('interview-dcf-walkthrough',5,'Discount rate for UFCF','WACC.'),
('interview-dcf-walkthrough',6,'Equity bridge','Equity value = EV − net debt (and preferred, minorities).'),
('interview-dcf-walkthrough',7,'Why is TV so important?','Often 60–80% of EV; most value is beyond the forecast.'),
('interview-dcf-walkthrough',8,'Classic DCF mistake','Using levered cash flows with WACC.'),
('interview-dcf-walkthrough',9,'WACC up means…','DCF value down.'),
('interview-dcf-walkthrough',10,'Standard sensitivity table','WACC against terminal growth (or exit multiple).'),
('interview-ev-equity',1,'Equity value','Share price × diluted shares.'),
('interview-ev-equity',2,'Enterprise value','Equity value + debt + preferred + minority interest − cash.'),
('interview-ev-equity',3,'Why subtract cash?','It is not part of the operating business and offsets the price a buyer pays.'),
('interview-ev-equity',4,'Multiples paired with EV','EV/EBITDA, EV/Revenue.'),
('interview-ev-equity',5,'Multiples paired with equity value','P/E (equity value ÷ net income).'),
('interview-ev-equity',6,'Best multiple across different debt levels','EV/EBITDA (capital-structure neutral).'),
('interview-ev-equity',7,'From EV/EBITDA to a share price','EBITDA × multiple → subtract net debt → ÷ diluted shares.'),
('interview-ev-equity',8,'Items added in the equity-to-EV bridge','Debt, preferred stock, minority interest.'),
('interview-ev-equity',9,'Items subtracted in the bridge','Cash and equivalents (and non-operating investments).'),
('interview-ev-equity',10,'Why use diluted shares?','Options and convertibles can increase the share count.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;
