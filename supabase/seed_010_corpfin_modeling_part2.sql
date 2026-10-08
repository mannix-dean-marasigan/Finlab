-- seed_010_corpfin_modeling: part 2 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 3. Practice activities
-- ---------------------------------------------------------------------
insert into public.lesson_activities (lesson_id, slug, position, kind, title, instructions, content)
select l.id, v.slug, v.pos, v.kind, v.title, v.instructions, v.content::jsonb
from (values
('time-value-of-money', 'which-formula', 1, 'matching', 'Which formula is it?',
 'Match each description to the concept it describes.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6InB2IiwibGFiZWwiOiJQcmVzZW50IHZhbHVlIn0seyJpZCI6ImZ2IiwibGFiZWwiOiJGdXR1cmUgdmFsdWUifSx7ImlkIjoiYW4iLCJsYWJlbCI6IkFubnVpdHkgLyBwZXJwZXR1aXR5In1dLAogICAgICJpdGVtcyI6W3siaWQiOiJpMSIsImxhYmVsIjoiQ2FzaCBmbG93IMO3ICgxICsgcinigb8ifSx7ImlkIjoiaTIiLCJsYWJlbCI6IlBWIMOXICgxICsgcinigb8ifSx7ImlkIjoiaTMiLCJsYWJlbCI6IkNvbXBvdW5kcyBhIGx1bXAgc3VtIGZvcndhcmQifSx7ImlkIjoiaTQiLCJsYWJlbCI6IkRpc2NvdW50cyBhIGZ1dHVyZSBhbW91bnQgYmFjayB0byB0b2RheSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJpNSIsImxhYmVsIjoiQSBsZXZlbCBwYXltZW50IGVhY2ggcGVyaW9kIGZvciBuIHBlcmlvZHMifSx7ImlkIjoiaTYiLCJsYWJlbCI6IkEgbGV2ZWwgcGF5bWVudCBmb3JldmVyOiBDIMO3IHIifSx7ImlkIjoiaTciLCJsYWJlbCI6IldoYXQgaXMgdGhpcyBmdXR1cmUgY2FzaCB3b3J0aCB0b2RheT8ifSx7ImlkIjoiaTgiLCJsYWJlbCI6IldoYXQgd2lsbCB0b2RheSdzIHNhdmluZ3MgZ3JvdyB0bz8ifV19', 'base64'), 'UTF8')::jsonb),
('time-value-of-money', 'scholarship-pv', 2, 'worked_example', 'Worked example: the value of a scholarship',
 'Discount each payment, then add them. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkEgc2Nob2xhcnNoaXAgcGF5cyDigrEzMCwwMDAgYXQgdGhlIGVuZCBvZiBlYWNoIG9mIHRoZSBuZXh0IDMgeWVhcnMuIFRoZSBkaXNjb3VudCByYXRlIGlzIDEwJS4iLAogICAgICJzdGVwcyI6W3siaWQiOiJzMSIsInByb21wdCI6IlByZXNlbnQgdmFsdWUgb2YgdGhlIHllYXItMSBwYXltZW50ICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczIiLCJwcm9tcHQiOiJQcmVzZW50IHZhbHVlIG9mIHRoZSB5ZWFyLTIgcGF5bWVudCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0sCiAgICAgICAgICAgICAgeyJpZCI6InMzIiwicHJvbXB0IjoiUHJlc2VudCB2YWx1ZSBvZiB0aGUgeWVhci0zIHBheW1lbnQgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzNCIsInByb21wdCI6IlRvdGFsIHByZXNlbnQgdmFsdWUgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzNSIsInByb21wdCI6IkhvdyBtdWNoIGxlc3MgdGhhbiB0aGUg4oKxOTAsMDAwIG9mIHRvdGFsIHBheW1lbnRzIGlzIHRoYXQgcHJlc2VudCB2YWx1ZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIn1dfQ==', 'base64'), 'UTF8')::jsonb),
('budgeting-variance-fpa', 'favourable-or-not', 1, 'matching', 'Favourable or unfavourable?',
 'Classify each variance against budget.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImZhdiIsImxhYmVsIjoiRmF2b3VyYWJsZSJ9LHsiaWQiOiJ1bmYiLCJsYWJlbCI6IlVuZmF2b3VyYWJsZSJ9XSwKICAgICAiaXRlbXMiOlt7ImlkIjoiaTEiLCJsYWJlbCI6IlJldmVudWUgYWJvdmUgYnVkZ2V0In0seyJpZCI6ImkyIiwibGFiZWwiOiJSZXZlbnVlIGJlbG93IGJ1ZGdldCJ9LHsiaWQiOiJpMyIsImxhYmVsIjoiQ29zdHMgYWJvdmUgYnVkZ2V0In0seyJpZCI6Imk0IiwibGFiZWwiOiJDb3N0cyBiZWxvdyBidWRnZXQifSx7ImlkIjoiaTUiLCJsYWJlbCI6Ik9wZXJhdGluZyBwcm9maXQgYWJvdmUgYnVkZ2V0In0seyJpZCI6Imk2IiwibGFiZWwiOiJPcGVyYXRpbmcgcHJvZml0IGJlbG93IGJ1ZGdldCJ9XX0=', 'base64'), 'UTF8')::jsonb),
('budgeting-variance-fpa', 'price-volume', 2, 'worked_example', 'Worked example: price and volume variances',
 'Split a revenue variance into its drivers. Enter negative numbers where revenue fell short.',
 convert_from(decode('eyJpbnRybyI6IkJ1ZGdldDogMiwwMDAgdW5pdHMgYXQg4oKxMTUwLiBBY3R1YWw6IDEsODAwIHVuaXRzIGF0IOKCsTE2MC4iLAogICAgICJzdGVwcyI6W3siaWQiOiJzMSIsInByb21wdCI6IkJ1ZGdldCByZXZlbnVlICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczIiLCJwcm9tcHQiOiJBY3R1YWwgcmV2ZW51ZSAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0sCiAgICAgICAgICAgICAgeyJpZCI6InMzIiwicHJvbXB0IjoiVG90YWwgcmV2ZW51ZSB2YXJpYW5jZSAo4oKxLCBuZWdhdGl2ZSBpZiBiZWxvdyBidWRnZXQpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczQiLCJwcm9tcHQiOiJWb2x1bWUgdmFyaWFuY2UgPSAoYWN0dWFsIOKIkiBidWRnZXQgdW5pdHMpIMOXIGJ1ZGdldCBwcmljZSAo4oKxLCBuZWdhdGl2ZSBpZiB1bmZhdm91cmFibGUpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczUiLCJwcm9tcHQiOiJQcmljZSB2YXJpYW5jZSA9IChhY3R1YWwg4oiSIGJ1ZGdldCBwcmljZSkgw5cgYWN0dWFsIHVuaXRzICjigrEsIG5lZ2F0aXZlIGlmIHVuZmF2b3VyYWJsZSk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('capital-budgeting-npv-irr', 'store-expansion-npv', 1, 'worked_example', 'Worked example: NPV of a store expansion',
 'Discount each year, add up, and decide. Enter negative numbers where the NPV is below zero.',
 convert_from(decode('eyJpbnRybyI6IkEgc3RvcmUgZXhwYW5zaW9uIGNvc3RzIOKCsTIsMDAwLDAwMCBhbmQgcmV0dXJucyDigrE3MDAsMDAwLCDigrE4MDAsMDAwIGFuZCDigrE5MDAsMDAwIGluIHllYXJzIDEgdG8gMy4gVGhlIHJlcXVpcmVkIHJldHVybiBpcyAxMCUuIiwKICAgICAic3RlcHMiOlt7ImlkIjoiczEiLCJwcm9tcHQiOiJQcmVzZW50IHZhbHVlIG9mIHllYXIgMSAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InMyIiwicHJvbXB0IjoiUHJlc2VudCB2YWx1ZSBvZiB5ZWFyIDIgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzMyIsInByb21wdCI6IlByZXNlbnQgdmFsdWUgb2YgeWVhciAzICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczQiLCJwcm9tcHQiOiJUb3RhbCBwcmVzZW50IHZhbHVlIG9mIHRoZSBpbmZsb3dzICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczUiLCJwcm9tcHQiOiJOUFYgKOKCsSwgbmVnYXRpdmUgaWYgYmVsb3cgemVybyk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('capital-budgeting-npv-irr', 'capital-review-errors', 2, 'spot_error', 'Spot the errors: a capital budget review',
 'Two conclusions in this review are wrong. Select them, then check.',
 convert_from(decode('eyJjb250ZXh0IjoiUHJvamVjdDogY29zdCDigrExLDAwMGs7IHJlcXVpcmVkIHJldHVybiAxMCU7IGluZmxvd3Mgb2Yg4oKxNTAwayBhIHllYXIgZm9yIDMgeWVhcnMuIiwiY29sdW1ucyI6WyJNZWFzdXJlIiwiUmVzdWx0Il0sInNlbGVjdF9jb3VudCI6MiwKICAgICAicm93cyI6W3siaWQiOiJyMSIsImNlbGxzIjpbIlBheWJhY2siLCIyIHllYXJzIl19LHsiaWQiOiJyMiIsImNlbGxzIjpbIlBWIG9mIGluZmxvd3MiLCLigrExLDI0M2siXX0seyJpZCI6InIzIiwiY2VsbHMiOlsiTlBWIiwiK+KCsTI0M2siXX0sCiAgICAgICAgICAgICB7ImlkIjoicjQiLCJjZWxscyI6WyJJUlIiLCJCZWxvdyAxMCUiXX0seyJpZCI6InI1IiwiY2VsbHMiOlsiUHJvZml0YWJpbGl0eSBpbmRleCIsIjAuNzYiXX0seyJpZCI6InI2IiwiY2VsbHMiOlsiRGVjaXNpb24iLCJBY2NlcHQiXX1dfQ==', 'base64'), 'UTF8')::jsonb),
('working-capital-ccc', 'which-lever', 1, 'matching', 'Which lever does it pull?',
 'Match each action to the part of the cash conversion cycle it improves.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImRzbyIsImxhYmVsIjoiQ29sbGVjdCBmYXN0ZXIgKERTTykifSx7ImlkIjoiZGlvIiwibGFiZWwiOiJIb2xkIGxlc3Mgc3RvY2sgKERJTykifSx7ImlkIjoiZHBvIiwibGFiZWwiOiJQYXkgbGF0ZXIgKERQTykifV0sCiAgICAgIml0ZW1zIjpbeyJpZCI6ImkxIiwibGFiZWwiOiJPZmZlciBlYXJseS1wYXltZW50IGRpc2NvdW50cyJ9LHsiaWQiOiJpMiIsImxhYmVsIjoiVGlnaHRlbiBjcmVkaXQgYXBwcm92YWwifSx7ImlkIjoiaTMiLCJsYWJlbCI6IlVzZSBqdXN0LWluLXRpbWUgb3JkZXJpbmcifSx7ImlkIjoiaTQiLCJsYWJlbCI6IkNsZWFyIHNsb3ctbW92aW5nIHN0b2NrIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk1IiwibGFiZWwiOiJOZWdvdGlhdGUgNjAtZGF5IHN1cHBsaWVyIHRlcm1zIn0seyJpZCI6Imk2IiwibGFiZWwiOiJDaGFzZSBvdmVyZHVlIGludm9pY2VzIn0seyJpZCI6Imk3IiwibGFiZWwiOiJJbXByb3ZlIGRlbWFuZCBmb3JlY2FzdGluZyB0byBjdXQgc2FmZXR5IHN0b2NrIn0seyJpZCI6Imk4IiwibGFiZWwiOiJQYXkgb24gdGhlIGR1ZSBkYXRlIHJhdGhlciB0aGFuIGVhcmx5In1dfQ==', 'base64'), 'UTF8')::jsonb),
('working-capital-ccc', 'compute-ccc', 2, 'worked_example', 'Worked example: the cash conversion cycle',
 'Compute the three day measures and the cycle. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkFubnVhbCBzYWxlcyDigrExNCw2MDBrOyBDT0dTIOKCsTEwLDk1MGs7IHJlY2VpdmFibGVzIOKCsTEsNjAwazsgaW52ZW50b3J5IOKCsTIsMjUwazsgcGF5YWJsZXMg4oKxMSwzNTBrICgzNjUtZGF5IHllYXIpLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiRFNPIChkYXlzKT8iLCJ1bml0IjoiZGF5cyJ9LHsiaWQiOiJzMiIsInByb21wdCI6IkRJTyAoZGF5cyk/IiwidW5pdCI6ImRheXMifSx7ImlkIjoiczMiLCJwcm9tcHQiOiJEUE8gKGRheXMpPyIsInVuaXQiOiJkYXlzIn0sCiAgICAgICAgICAgICAgeyJpZCI6InM0IiwicHJvbXB0IjoiQ2FzaCBjb252ZXJzaW9uIGN5Y2xlIChkYXlzKT8iLCJ1bml0IjoiZGF5cyJ9LHsiaWQiOiJzNSIsInByb21wdCI6IkNhc2ggcmVsZWFzZWQgaWYgRFNPIGZhbGxzIGJ5IDEwIGRheXMgKOKCsWspPyIsInVuaXQiOiLigrFrIn1dfQ==', 'base64'), 'UTF8')::jsonb),
('model-structure', 'where-does-it-live', 1, 'matching', 'Where does it live in the model?',
 'Sort each item into the part of a well-structured model it belongs to.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImlucCIsImxhYmVsIjoiSW5wdXRzIn0seyJpZCI6ImNhbGMiLCJsYWJlbCI6IkNhbGN1bGF0aW9ucyJ9LHsiaWQiOiJvdXQiLCJsYWJlbCI6Ik91dHB1dHMifV0sCiAgICAgIml0ZW1zIjpbeyJpZCI6ImkxIiwibGFiZWwiOiJSZXZlbnVlIGdyb3d0aCBhc3N1bXB0aW9uIn0seyJpZCI6ImkyIiwibGFiZWwiOiJUYXggcmF0ZSJ9LHsiaWQiOiJpMyIsImxhYmVsIjoiRGVwcmVjaWF0aW9uIHNjaGVkdWxlIn0seyJpZCI6Imk0IiwibGFiZWwiOiJEZWJ0IHNjaGVkdWxlIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk1IiwibGFiZWwiOiJCYWxhbmNlIGNoZWNrIn0seyJpZCI6Imk2IiwibGFiZWwiOiJEQ0YgdmFsdWUgcGVyIHNoYXJlIn0seyJpZCI6Imk3IiwibGFiZWwiOiJTZW5zaXRpdml0eSB0YWJsZSJ9LHsiaWQiOiJpOCIsImxhYmVsIjoiV29ya2luZy1jYXBpdGFsIGRheXMifSx7ImlkIjoiaTkiLCJsYWJlbCI6IlN1bW1hcnkgY2hhcnQgb2YgbWFyZ2lucyJ9XX0=', 'base64'), 'UTF8')::jsonb),
('model-structure', 'roll-the-balance-sheet', 2, 'worked_example', 'Worked example: roll the balance sheet forward',
 'Move one year forward and check that it balances. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IlllYXIgMDogUFAmRSA4MDAsIGNhc2ggMTUwLCByZWNlaXZhYmxlcyAxMDAsIHBheWFibGVzIDgwLCBkZWJ0IDMwMCwgZXF1aXR5IDY3MC4gWWVhciAxOiBuZXQgaW5jb21lIDkwOyBkaXZpZGVuZHMgMzA7IGNhcGV4IDEyMDsgZGVwcmVjaWF0aW9uIDEwMDsgcmVjZWl2YWJsZXMgMTIwOyBwYXlhYmxlcyA5NTsgZGVidCB1bmNoYW5nZWQuIiwKICAgICAic3RlcHMiOlt7ImlkIjoiczEiLCJwcm9tcHQiOiJDbG9zaW5nIFBQJkU/IiwidW5pdCI6IiJ9LHsiaWQiOiJzMiIsInByb21wdCI6IkNsb3NpbmcgZXF1aXR5PyIsInVuaXQiOiIifSx7ImlkIjoiczMiLCJwcm9tcHQiOiJDYXNoIGZsb3cgZnJvbSBvcGVyYXRpb25zPyIsInVuaXQiOiIifSwKICAgICAgICAgICAgICB7ImlkIjoiczQiLCJwcm9tcHQiOiJDbG9zaW5nIGNhc2g/IiwidW5pdCI6IiJ9LHsiaWQiOiJzNSIsInByb21wdCI6IlRvdGFsIGFzc2V0cyAoUFAmRSArIGNhc2ggKyByZWNlaXZhYmxlcyk/IiwidW5pdCI6IiJ9XX0=', 'base64'), 'UTF8')::jsonb),
('revenue-drivers-forecasting', 'subscription-forecast', 1, 'worked_example', 'Worked example: a subscription forecast',
 'Build two months of customers and revenue. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6Ik9wZW5pbmcgY3VzdG9tZXJzIDUsMDAwOyBjaHVybiA0JSBvZiBvcGVuaW5nIGN1c3RvbWVycyBlYWNoIG1vbnRoOyA0MDAgbmV3IGN1c3RvbWVycyBlYWNoIG1vbnRoOyBBUlBVIOKCsTUwMCBhIG1vbnRoIG9uIGNsb3NpbmcgY3VzdG9tZXJzLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiQ3VzdG9tZXJzIGF0IHRoZSBlbmQgb2YgbW9udGggMT8iLCJ1bml0IjoiIn0seyJpZCI6InMyIiwicHJvbXB0IjoiQ3VzdG9tZXJzIGF0IHRoZSBlbmQgb2YgbW9udGggMj8iLCJ1bml0IjoiIn0sCiAgICAgICAgICAgICAgeyJpZCI6InMzIiwicHJvbXB0IjoiTW9udGgtMiByZXZlbnVlICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczQiLCJwcm9tcHQiOiJDdXN0b21lcnMgbG9zdCB0byBjaHVybiBpbiBtb250aCAyPyIsInVuaXQiOiIifSx7ImlkIjoiczUiLCJwcm9tcHQiOiJOZXQgY3VzdG9tZXIgYWRkaXRpb25zIGluIG1vbnRoIDI/IiwidW5pdCI6IiJ9XX0=', 'base64'), 'UTF8')::jsonb),
('revenue-drivers-forecasting', 'unrealistic-assumptions', 2, 'spot_error', 'Spot the unrealistic assumptions',
 'Two assumptions in this forecast have no support. Select them, then check.',
 convert_from(decode('eyJjb250ZXh0IjoiQSBjb25zdW1lciBicmFuZDogY3VycmVudCByZXZlbnVlIOKCsTEuMGJuIGdyb3dpbmcgOCUgYSB5ZWFyOyB0aGUgaW5kdXN0cnkgZ3Jvd3MgNSUuIiwiY29sdW1ucyI6WyJBc3N1bXB0aW9uIiwiVmFsdWUiXSwic2VsZWN0X2NvdW50IjoyLAogICAgICJyb3dzIjpbeyJpZCI6InIxIiwiY2VsbHMiOlsiWWVhciAxIHJldmVudWUgZ3Jvd3RoIiwiOCUiXX0seyJpZCI6InIyIiwiY2VsbHMiOlsiWWVhciAyIHJldmVudWUgZ3Jvd3RoIiwiOSUiXX0seyJpZCI6InIzIiwiY2VsbHMiOlsiWWVhciAzIHJldmVudWUgZ3Jvd3RoIiwiMzUlLCB3aXRoIG5vIG5ldyBwcm9kdWN0cyBvciBtYXJrZXRzIl19LAogICAgICAgICAgICAgeyJpZCI6InI0IiwiY2VsbHMiOlsiR3Jvc3MgbWFyZ2luIiwiNDIlLCByaXNpbmcgdG8gNDMlIl19LHsiaWQiOiJyNSIsImNlbGxzIjpbIlllYXIgNSBtYXJrZXQgc2hhcmUiLCJEb3VibGVzIGZyb20gNiUgdG8gMTIlIHdpdGggbm8gbmV3IHByb2R1Y3RzIl19LHsiaWQiOiJyNiIsImNlbGxzIjpbIkNhcGV4IiwiMyUgb2YgcmV2ZW51ZSJdfV19', 'base64'), 'UTF8')::jsonb),
('scenarios-sensitivity', 'sens-or-scenario', 1, 'matching', 'Sensitivity or scenario?',
 'Decide which tool each description belongs to.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6InNlbnMiLCJsYWJlbCI6IlNlbnNpdGl2aXR5IGFuYWx5c2lzIn0seyJpZCI6InNjZW4iLCJsYWJlbCI6IlNjZW5hcmlvIGFuYWx5c2lzIn1dLAogICAgICJpdGVtcyI6W3siaWQiOiJpMSIsImxhYmVsIjoiQ2hhbmdlIG9ubHkgV0FDQyBhbmQgd2F0Y2ggdGhlIHZhbHVlIn0seyJpZCI6ImkyIiwibGFiZWwiOiJCdWxsLCBiYXNlIGFuZCBiZWFyIGNhc2VzIn0seyJpZCI6ImkzIiwibGFiZWwiOiJUd28td2F5IHRhYmxlIG9mIFdBQ0MgYWdhaW5zdCB0ZXJtaW5hbCBncm93dGgifSwKICAgICAgICAgICAgICB7ImlkIjoiaTQiLCJsYWJlbCI6IkEgcmVjZXNzaW9uIHN0b3J5OiBsb3dlciBzYWxlcywgbWFyZ2luIHNxdWVlemUsIGRlbGF5ZWQgY2FwZXgifSx7ImlkIjoiaTUiLCJsYWJlbCI6IlRvcm5hZG8gY2hhcnQifSx7ImlkIjoiaTYiLCJsYWJlbCI6IlByb2JhYmlsaXR5LXdlaWdodGVkIHZhbHVlIGFjcm9zcyBjYXNlcyJ9XX0=', 'base64'), 'UTF8')::jsonb),
('scenarios-sensitivity', 'probability-weighted', 2, 'worked_example', 'Worked example: probability-weighted value',
 'Weight the three cases and compare with the market price. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkEgc3RvY2sncyBidWxsLCBiYXNlIGFuZCBiZWFyIHZhbHVlcyBhcmUg4oKxMTgwLCDigrExMjAgYW5kIOKCsTYwLCB3aXRoIHByb2JhYmlsaXRpZXMgb2YgMjUlLCA1MCUgYW5kIDI1JS4gVGhlIHNoYXJlIHByaWNlIGlzIOKCsTEwMC4iLAogICAgICJzdGVwcyI6W3siaWQiOiJzMSIsInByb21wdCI6IkJ1bGwgY29udHJpYnV0aW9uIChwcm9iYWJpbGl0eSDDlyB2YWx1ZSkgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzMiIsInByb21wdCI6IkJhc2UgY29udHJpYnV0aW9uICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczMiLCJwcm9tcHQiOiJCZWFyIGNvbnRyaWJ1dGlvbiAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InM0IiwicHJvbXB0IjoiUHJvYmFiaWxpdHktd2VpZ2h0ZWQgdmFsdWUgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzNSIsInByb21wdCI6IlVwc2lkZSB2ZXJzdXMgdGhlIOKCsTEwMCBwcmljZSAoJSk/IiwidW5pdCI6IiUifV19', 'base64'), 'UTF8')::jsonb)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('time-value-of-money', 'which-formula', convert_from(decode('eyJpMSI6InB2IiwiaTIiOiJmdiIsImkzIjoiZnYiLCJpNCI6InB2IiwiaTUiOiJhbiIsImk2IjoiYW4iLCJpNyI6InB2IiwiaTgiOiJmdiJ9', 'base64'), 'UTF8')::jsonb),
('time-value-of-money', 'scholarship-pv', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjI3MjcyLjczLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIzMCwwMDAgw7cgMS4xMC4iLCJleHBsYW5hdGlvbiI6IjMwLDAwMCDDtyAxLjEgPSAyNywyNzIuNzMuIn0sCiAgInMyIjp7ImFuc3dlciI6MjQ3OTMuMzksInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjMwLDAwMCDDtyAxLjEwwrIuIiwiZXhwbGFuYXRpb24iOiIzMCwwMDAgw7cgMS4yMSA9IDI0LDc5My4zOS4ifSwKICAiczMiOnsiYW5zd2VyIjoyMjUzOS40NCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMzAsMDAwIMO3IDEuMTDCsy4iLCJleHBsYW5hdGlvbiI6IjMwLDAwMCDDtyAxLjMzMSA9IDIyLDUzOS40NC4ifSwKICAiczQiOnsiYW5zd2VyIjo3NDYwNS41NiwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiQWRkIHRoZSB0aHJlZSBwcmVzZW50IHZhbHVlcy4iLCJleHBsYW5hdGlvbiI6IjI3LDI3Mi43MyArIDI0LDc5My4zOSArIDIyLDUzOS40NCA9IDc0LDYwNS41Ni4ifSwKICAiczUiOnsiYW5zd2VyIjoxNTM5NC40NCwidG9sZXJhbmNlX3BjdCI6MSwiaGludCI6IjkwLDAwMCBtaW51cyB0aGUgcHJlc2VudCB2YWx1ZS4iLCJleHBsYW5hdGlvbiI6IjkwLDAwMCDiiJIgNzQsNjA1LjU2ID0gMTUsMzk0LjQ0IOKAlCB0aGUgY29zdCBvZiB3YWl0aW5nIGZvciB0aGUgbW9uZXkuIn19', 'base64'), 'UTF8')::jsonb),
('budgeting-variance-fpa', 'favourable-or-not', convert_from(decode('eyJpMSI6ImZhdiIsImkyIjoidW5mIiwiaTMiOiJ1bmYiLCJpNCI6ImZhdiIsImk1IjoiZmF2IiwiaTYiOiJ1bmYifQ==', 'base64'), 'UTF8')::jsonb),
('budgeting-variance-fpa', 'price-volume', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjMwMDAwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiMiwwMDAgw5cgMTUwLiIsImV4cGxhbmF0aW9uIjoiMiwwMDAgw5cgMTUwID0gMzAwLDAwMC4ifSwKICAiczIiOnsiYW5zd2VyIjoyODgwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjEsODAwIMOXIDE2MC4iLCJleHBsYW5hdGlvbiI6IjEsODAwIMOXIDE2MCA9IDI4OCwwMDAuIn0sCiAgInMzIjp7ImFuc3dlciI6LTEyMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJBY3R1YWwgbWludXMgYnVkZ2V0LiIsImV4cGxhbmF0aW9uIjoiMjg4LDAwMCDiiJIgMzAwLDAwMCA9IOKIkjEyLDAwMCAodW5mYXZvdXJhYmxlKS4ifSwKICAiczQiOnsiYW5zd2VyIjotMzAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IigxLDgwMCDiiJIgMiwwMDApIMOXIDE1MC4iLCJleHBsYW5hdGlvbiI6IuKIkjIwMCDDlyAxNTAgPSDiiJIzMCwwMDAuIn0sCiAgInM1Ijp7ImFuc3dlciI6MTgwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IigxNjAg4oiSIDE1MCkgw5cgMSw4MDAuIiwiZXhwbGFuYXRpb24iOiIxMCDDlyAxLDgwMCA9ICsxOCwwMDAuIFZvbHVtZSDiiJIzMCwwMDAgcGx1cyBwcmljZSArMTgsMDAwIGVxdWFscyB0aGUg4oiSMTIsMDAwIHRvdGFsLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('capital-budgeting-npv-irr', 'store-expansion-npv', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjYzNjM2My42NCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiNzAwLDAwMCDDtyAxLjEwLiIsImV4cGxhbmF0aW9uIjoiNzAwLDAwMCDDtyAxLjEgPSA2MzYsMzYzLjY0LiJ9LAogICJzMiI6eyJhbnN3ZXIiOjY2MTE1Ny4wMiwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiODAwLDAwMCDDtyAxLjEwwrIuIiwiZXhwbGFuYXRpb24iOiI4MDAsMDAwIMO3IDEuMjEgPSA2NjEsMTU3LjAyLiJ9LAogICJzMyI6eyJhbnN3ZXIiOjY3NjE4My44MiwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiOTAwLDAwMCDDtyAxLjEwwrMuIiwiZXhwbGFuYXRpb24iOiI5MDAsMDAwIMO3IDEuMzMxID0gNjc2LDE4My44Mi4ifSwKICAiczQiOnsiYW5zd2VyIjoxOTczNzA0LjQ4LCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJBZGQgdGhlIHRocmVlIHByZXNlbnQgdmFsdWVzLiIsImV4cGxhbmF0aW9uIjoiNjM2LDM2My42NCArIDY2MSwxNTcuMDIgKyA2NzYsMTgzLjgyID0gMSw5NzMsNzA0LjQ4LiJ9LAogICJzNSI6eyJhbnN3ZXIiOi0yNjI5NS41MiwidG9sZXJhbmNlX3BjdCI6MSwiaGludCI6IlBWIG9mIGluZmxvd3MgbWludXMgdGhlIDIsMDAwLDAwMCBpbnZlc3RtZW50LiIsImV4cGxhbmF0aW9uIjoiMSw5NzMsNzA0LjQ4IOKIkiAyLDAwMCwwMDAgPSDiiJIyNiwyOTUuNTIuIE5QViBpcyBuZWdhdGl2ZSwgc28gcmVqZWN0OiB0aGUgcHJvamVjdCBlYXJucyBzbGlnaHRseSBsZXNzIHRoYW4gMTAlLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('capital-budgeting-npv-irr', 'capital-review-errors', convert_from(decode('eyJlcnJvcnMiOlsicjQiLCJyNSJdLCJleHBsYW5hdGlvbnMiOnsicjQiOiJOUFYgaXMgcG9zaXRpdmUgYXQgMTAlLCBzbyB0aGUgSVJSIG11c3QgYmUgYWJvdmUgMTAlLiIsInI1IjoiUHJvZml0YWJpbGl0eSBpbmRleCA9IFBWIG9mIGluZmxvd3Mgw7cgaW52ZXN0bWVudCA9IDEsMjQzIMO3IDEsMDAwID0gMS4yNCwgbm90IDAuNzYuIn19', 'base64'), 'UTF8')::jsonb),
('working-capital-ccc', 'which-lever', convert_from(decode('eyJpMSI6ImRzbyIsImkyIjoiZHNvIiwiaTMiOiJkaW8iLCJpNCI6ImRpbyIsImk1IjoiZHBvIiwiaTYiOiJkc28iLCJpNyI6ImRpbyIsImk4IjoiZHBvIn0=', 'base64'), 'UTF8')::jsonb),
('working-capital-ccc', 'compute-ccc', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjQwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJSZWNlaXZhYmxlcyDDtyBzYWxlcyDDlyAzNjUuIiwiZXhwbGFuYXRpb24iOiIxLDYwMCDDtyAxNCw2MDAgw5cgMzY1ID0gNDAgZGF5cy4ifSwKICAiczIiOnsiYW5zd2VyIjo3NSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiSW52ZW50b3J5IMO3IENPR1Mgw5cgMzY1LiIsImV4cGxhbmF0aW9uIjoiMiwyNTAgw7cgMTAsOTUwIMOXIDM2NSA9IDc1IGRheXMuIn0sCiAgInMzIjp7ImFuc3dlciI6NDUsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlBheWFibGVzIMO3IENPR1Mgw5cgMzY1LiIsImV4cGxhbmF0aW9uIjoiMSwzNTAgw7cgMTAsOTUwIMOXIDM2NSA9IDQ1IGRheXMuIn0sCiAgInM0Ijp7ImFuc3dlciI6NzAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkRJTyArIERTTyDiiJIgRFBPLiIsImV4cGxhbmF0aW9uIjoiNzUgKyA0MCDiiJIgNDUgPSA3MCBkYXlzLiJ9LAogICJzNSI6eyJhbnN3ZXIiOjQwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiRGFpbHkgc2FsZXMgw5cgMTAgZGF5cy4iLCJleHBsYW5hdGlvbiI6IkRhaWx5IHNhbGVzID0gMTQsNjAwIMO3IDM2NSA9IDQwOyDDlyAxMCBkYXlzID0g4oKxNDAway4ifX0=', 'base64'), 'UTF8')::jsonb),
('model-structure', 'where-does-it-live', convert_from(decode('eyJpMSI6ImlucCIsImkyIjoiaW5wIiwiaTMiOiJjYWxjIiwiaTQiOiJjYWxjIiwiaTUiOiJjYWxjIiwiaTYiOiJvdXQiLCJpNyI6Im91dCIsImk4IjoiaW5wIiwiaTkiOiJvdXQifQ==', 'base64'), 'UTF8')::jsonb),
('model-structure', 'roll-the-balance-sheet', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjgyMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiT3BlbmluZyArIGNhcGV4IOKIkiBkZXByZWNpYXRpb24uIiwiZXhwbGFuYXRpb24iOiI4MDAgKyAxMjAg4oiSIDEwMCA9IDgyMC4ifSwKICAiczIiOnsiYW5zd2VyIjo3MzAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6Ik9wZW5pbmcgZXF1aXR5ICsgbmV0IGluY29tZSDiiJIgZGl2aWRlbmRzLiIsImV4cGxhbmF0aW9uIjoiNjcwICsgOTAg4oiSIDMwID0gNzMwLiJ9LAogICJzMyI6eyJhbnN3ZXIiOjE4NSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiTmV0IGluY29tZSArIEQmQSDiiJIgaW5jcmVhc2UgaW4gcmVjZWl2YWJsZXMgKyBpbmNyZWFzZSBpbiBwYXlhYmxlcy4iLCJleHBsYW5hdGlvbiI6IjkwICsgMTAwIOKIkiAyMCArIDE1ID0gMTg1LiJ9LAogICJzNCI6eyJhbnN3ZXIiOjE4NSwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiT3BlbmluZyBjYXNoICsgQ0ZPICsgQ0ZJICsgQ0ZGLiBDRkkgPSDiiJIxMjA7IENGRiA9IOKIkjMwIGRpdmlkZW5kcy4iLCJleHBsYW5hdGlvbiI6IjE1MCArIDE4NSDiiJIgMTIwIOKIkiAzMCA9IDE4NS4ifSwKICAiczUiOnsiYW5zd2VyIjoxMTI1LCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiI4MjAgKyBjYXNoICsgMTIwLiIsImV4cGxhbmF0aW9uIjoiODIwICsgMTg1ICsgMTIwID0gMSwxMjUgPSBwYXlhYmxlcyA5NSArIGRlYnQgMzAwICsgZXF1aXR5IDczMC4gSXQgYmFsYW5jZXMuIn19', 'base64'), 'UTF8')::jsonb),
('revenue-drivers-forecasting', 'subscription-forecast', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjUyMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6Ik9wZW5pbmcgw5cgKDEg4oiSIGNodXJuKSArIG5ldy4iLCJleHBsYW5hdGlvbiI6IjUsMDAwIMOXIDAuOTYgKyA0MDAgPSA1LDIwMC4ifSwKICAiczIiOnsiYW5zd2VyIjo1MzkyLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiI1LDIwMCDDlyAwLjk2ICsgNDAwLiIsImV4cGxhbmF0aW9uIjoiNSwyMDAgw5cgMC45NiArIDQwMCA9IDUsMzkyLiJ9LAogICJzMyI6eyJhbnN3ZXIiOjI2OTYwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkNsb3NpbmcgY3VzdG9tZXJzIMOXIEFSUFUuIiwiZXhwbGFuYXRpb24iOiI1LDM5MiDDlyA1MDAgPSAyLDY5NiwwMDAuIn0sCiAgInM0Ijp7ImFuc3dlciI6MjA4LCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiI0JSBvZiB0aGUgNSwyMDAgb3BlbmluZyBjdXN0b21lcnMuIiwiZXhwbGFuYXRpb24iOiI1LDIwMCDDlyA0JSA9IDIwOC4ifSwKICAiczUiOnsiYW5zd2VyIjoxOTIsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkNsb3NpbmcgbWludXMgb3BlbmluZy4iLCJleHBsYW5hdGlvbiI6IjUsMzkyIOKIkiA1LDIwMCA9IDE5MiAoNDAwIG5ldyDiiJIgMjA4IGNodXJuZWQpLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('revenue-drivers-forecasting', 'unrealistic-assumptions', convert_from(decode('eyJlcnJvcnMiOlsicjMiLCJyNSJdLCJleHBsYW5hdGlvbnMiOnsicjMiOiIzNSUgZ3Jvd3RoIGluIGEgNSUgaW5kdXN0cnkgd2l0aCBubyBuZXcgcHJvZHVjdHMgb3IgbWFya2V0cyBpcyBhIGhvY2tleSBzdGljayB3aXRoIG5vIGRyaXZlciBiZWhpbmQgaXQuIiwicjUiOiJEb3VibGluZyBtYXJrZXQgc2hhcmUgd2l0aCBubyBuZXcgcHJvZHVjdHMgaGFzIG5vIHN1cHBvcnQg4oCUIGl0IG5lZWRzIGEgZHJpdmVyIHN1Y2ggYXMgbmV3IGNoYW5uZWxzLCBwcmljaW5nIG9yIHByb2R1Y3RzLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('scenarios-sensitivity', 'sens-or-scenario', convert_from(decode('eyJpMSI6InNlbnMiLCJpMiI6InNjZW4iLCJpMyI6InNlbnMiLCJpNCI6InNjZW4iLCJpNSI6InNlbnMiLCJpNiI6InNjZW4ifQ==', 'base64'), 'UTF8')::jsonb),
('scenarios-sensitivity', 'probability-weighted', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjQ1LCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIyNSUgw5cgMTgwLiIsImV4cGxhbmF0aW9uIjoiMC4yNSDDlyAxODAgPSA0NS4ifSwKICAiczIiOnsiYW5zd2VyIjo2MCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiNTAlIMOXIDEyMC4iLCJleHBsYW5hdGlvbiI6IjAuNTAgw5cgMTIwID0gNjAuIn0sCiAgInMzIjp7ImFuc3dlciI6MTUsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjI1JSDDlyA2MC4iLCJleHBsYW5hdGlvbiI6IjAuMjUgw5cgNjAgPSAxNS4ifSwKICAiczQiOnsiYW5zd2VyIjoxMjAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkFkZCB0aGUgdGhyZWUgY29udHJpYnV0aW9ucy4iLCJleHBsYW5hdGlvbiI6IjQ1ICsgNjAgKyAxNSA9IDEyMC4ifSwKICAiczUiOnsiYW5zd2VyIjoyMCwidG9sZXJhbmNlX3BjdCI6MSwiaGludCI6IigxMjAg4oiSIDEwMCkgw7cgMTAwLiIsImV4cGxhbmF0aW9uIjoiKDEyMCDiiJIgMTAwKSDDtyAxMDAgPSAyMCUgdXBzaWRlLiJ9fQ==', 'base64'), 'UTF8')::jsonb)
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
('time-value-of-money',1,'Future value','PV × (1 + r)ⁿ.'),
('time-value-of-money',2,'Present value','FV ÷ (1 + r)ⁿ.'),
('time-value-of-money',3,'Annuity present value','C × [1 − (1 + r)⁻ⁿ] ÷ r.'),
('time-value-of-money',4,'Perpetuity present value','C ÷ r.'),
('time-value-of-money',5,'Rule of 72','Years to double ≈ 72 ÷ rate (%).'),
('time-value-of-money',6,'Effective annual rate','(1 + nominal ÷ m)ᵐ − 1.'),
('time-value-of-money',7,'Higher discount rate means…','A lower present value.'),
('time-value-of-money',8,'More frequent compounding means…','A higher effective annual rate for the same nominal rate.'),
('time-value-of-money',9,'Why does money have a time value?','It can be invested to earn a return, and prices change over time.'),
('time-value-of-money',10,'First step when comparing cash flows at different dates','Move them all to a common date.'),
('budgeting-variance-fpa',1,'Variance =','Actual − Budget.'),
('budgeting-variance-fpa',2,'Variance % =','Variance ÷ Budget.'),
('budgeting-variance-fpa',3,'A cost above budget is…','Unfavourable.'),
('budgeting-variance-fpa',4,'Volume variance =','(Actual units − Budget units) × Budget price.'),
('budgeting-variance-fpa',5,'Price variance =','(Actual price − Budget price) × Actual units.'),
('budgeting-variance-fpa',6,'Flexible budget','The budget restated at the actual activity level.'),
('budgeting-variance-fpa',7,'Rolling forecast','Updated regularly, always looking a fixed period ahead.'),
('budgeting-variance-fpa',8,'Why use materiality thresholds?','So effort goes to the large variances.'),
('budgeting-variance-fpa',9,'What should variance commentary state?','The cause, whether it is one-off or recurring, and the action.'),
('budgeting-variance-fpa',10,'What does FP&A do?','Budget, track actuals, explain variances and update the forecast.'),
('capital-budgeting-npv-irr',1,'NPV','PV of future cash flows − initial investment. Accept if > 0.'),
('capital-budgeting-npv-irr',2,'IRR','The discount rate at which NPV = 0.'),
('capital-budgeting-npv-irr',3,'IRR decision rule','Accept if IRR > required return.'),
('capital-budgeting-npv-irr',4,'Profitability index','PV of inflows ÷ investment. Accept if > 1.'),
('capital-budgeting-npv-irr',5,'Payback period','Years to recover the initial investment.'),
('capital-budgeting-npv-irr',6,'Payback weaknesses','Ignores the time value of money and cash flows after payback.'),
('capital-budgeting-npv-irr',7,'Discounted payback','Payback using discounted cash flows.'),
('capital-budgeting-npv-irr',8,'When NPV and IRR disagree','Follow NPV.'),
('capital-budgeting-npv-irr',9,'A project earning exactly the cost of capital has…','An NPV of zero.'),
('capital-budgeting-npv-irr',10,'Discount rate for project cash flows','The cost of capital (WACC), adjusted for project risk.'),
('working-capital-ccc',1,'Net working capital','Current assets − Current liabilities.'),
('working-capital-ccc',2,'DSO','Receivables ÷ Sales × 365.'),
('working-capital-ccc',3,'DIO','Inventory ÷ COGS × 365.'),
('working-capital-ccc',4,'DPO','Payables ÷ COGS × 365.'),
('working-capital-ccc',5,'Cash conversion cycle','DIO + DSO − DPO.'),
('working-capital-ccc',6,'Negative CCC means…','Customers pay before suppliers are paid; suppliers fund the business.'),
('working-capital-ccc',7,'How to shorten the CCC','Collect faster, hold less stock, pay suppliers later.'),
('working-capital-ccc',8,'Cash released by cutting DSO','Daily sales × days reduced.'),
('working-capital-ccc',9,'Why growth consumes cash','Stock and receivables must be funded before the cash arrives.'),
('working-capital-ccc',10,'Action that lengthens the CCC','Offering customers longer credit terms.'),
('model-structure',1,'Model structure','Inputs → calculations → outputs.'),
('model-structure',2,'Blue font convention','Hard-coded inputs.'),
('model-structure',3,'Net income flows to…','Retained earnings (less dividends).'),
('model-structure',4,'PP&E roll-forward','Closing = opening + capex − depreciation.'),
('model-structure',5,'Retained earnings roll-forward','Closing = opening + net income − dividends.'),
('model-structure',6,'CFO (indirect)','Net income + D&A − increase in receivables + increase in payables.'),
('model-structure',7,'Closing cash','Opening cash + CFO + CFI + CFF.'),
('model-structure',8,'Balance check','Assets − (liabilities + equity) = 0 every period.'),
('model-structure',9,'Revolver','Borrows automatically when cash would go negative.'),
('model-structure',10,'Why avoid hard-codes in formulas?','They hide assumptions and are missed when inputs change.'),
('revenue-drivers-forecasting',1,'Price × volume growth','(1 + volume growth)(1 + price growth) − 1.'),
('revenue-drivers-forecasting',2,'Subscription customers','Opening × (1 − churn) + new customers.'),
('revenue-drivers-forecasting',3,'Subscription revenue','Customers × ARPU.'),
('revenue-drivers-forecasting',4,'Retail growth drivers','Same-store sales growth plus new stores.'),
('revenue-drivers-forecasting',5,'Market-share build','Market size × share.'),
('revenue-drivers-forecasting',6,'CAGR','(End ÷ Start)^(1/years) − 1.'),
('revenue-drivers-forecasting',7,'Hockey stick','Sudden growth acceleration with no driver — a red flag.'),
('revenue-drivers-forecasting',8,'Three sanity checks','History, capacity and market size.'),
('revenue-drivers-forecasting',9,'Why forecast by drivers?','Each assumption is explicit and testable.'),
('revenue-drivers-forecasting',10,'Best practice','Forecast revenue two ways and check they agree.'),
('scenarios-sensitivity',1,'Sensitivity analysis','Change one input at a time (or two in a data table).'),
('scenarios-sensitivity',2,'Scenario analysis','Change several linked inputs together: bull, base, bear.'),
('scenarios-sensitivity',3,'Base case','The most likely set of assumptions.'),
('scenarios-sensitivity',4,'Tornado chart','Ranks inputs by how much they move the output.'),
('scenarios-sensitivity',5,'Scenario switch','A 1/2/3 selector (CHOOSE/INDEX) that flips all drivers together.'),
('scenarios-sensitivity',6,'Probability-weighted value','Σ (probability × value).'),
('scenarios-sensitivity',7,'Keep scenarios consistent','Growth, margins, working capital and capex must move together.'),
('scenarios-sensitivity',8,'A good bear case stresses','Liquidity and covenants, not only earnings.'),
('scenarios-sensitivity',9,'EV from a multiple','EBITDA × EV/EBITDA multiple.'),
('scenarios-sensitivity',10,'Sensitivities vs scenarios','Sensitivities show which assumption matters; scenarios show what could happen.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;
