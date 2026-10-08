-- seed_009_accounting: part 2 of 3. Run the parts in order.
-- ---------------------------------------------------------------------
-- 3. Practice activities
-- ---------------------------------------------------------------------
insert into public.lesson_activities (lesson_id, slug, position, kind, title, instructions, content)
select l.id, v.slug, v.pos, v.kind, v.title, v.instructions, v.content::jsonb
from (values
('accounting-equation-journal', 'debit-or-credit', 1, 'matching', 'Debit or credit?',
 'Each account increases with either a debit or a credit. Sort them.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImRyIiwibGFiZWwiOiJJbmNyZWFzZXMgd2l0aCBhIGRlYml0In0seyJpZCI6ImNyIiwibGFiZWwiOiJJbmNyZWFzZXMgd2l0aCBhIGNyZWRpdCJ9XSwKICAgICAiaXRlbXMiOlt7ImlkIjoiaTEiLCJsYWJlbCI6IkNhc2gifSx7ImlkIjoiaTIiLCJsYWJlbCI6IkFjY291bnRzIHBheWFibGUifSx7ImlkIjoiaTMiLCJsYWJlbCI6IlJlbnQgZXhwZW5zZSJ9LHsiaWQiOiJpNCIsImxhYmVsIjoiU2VydmljZSByZXZlbnVlIn0seyJpZCI6Imk1IiwibGFiZWwiOiJFcXVpcG1lbnQifSwKICAgICAgICAgICAgICB7ImlkIjoiaTYiLCJsYWJlbCI6Ik93bmVyJ3MgY2FwaXRhbCJ9LHsiaWQiOiJpNyIsImxhYmVsIjoiU3VwcGxpZXMifSx7ImlkIjoiaTgiLCJsYWJlbCI6IkJhbmsgbG9hbiJ9LHsiaWQiOiJpOSIsImxhYmVsIjoiVXRpbGl0aWVzIGV4cGVuc2UifV19', 'base64'), 'UTF8')::jsonb),
('accounting-equation-journal', 'print-shop-month', 2, 'worked_example', 'Worked example: a month at Maria''s Print Shop',
 'Follow the transactions and keep the equation balanced. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6Ik1hcmlhJ3MgUHJpbnQgU2hvcCAo4oKxKTogdGhlIG93bmVyIGludmVzdHMgMjAwLDAwMCBjYXNoOyBidXlzIGVxdWlwbWVudCBmb3IgMTIwLDAwMCBjYXNoOyBlYXJucyA1MCwwMDAgb2Ygc2VydmljZSByZXZlbnVlIGluIGNhc2g7IHBheXMgMTUsMDAwIHJlbnQgaW4gY2FzaC4iLAogICAgICJzdGVwcyI6W3siaWQiOiJzMSIsInByb21wdCI6IkNhc2ggYWZ0ZXIgdGhlIG93bmVyJ3MgaW52ZXN0bWVudCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InMyIiwicHJvbXB0IjoiQ2FzaCBhZnRlciBidXlpbmcgdGhlIGVxdWlwbWVudCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0sCiAgICAgICAgICAgICAgeyJpZCI6InMzIiwicHJvbXB0IjoiQ2FzaCBhZnRlciB0aGUgcmV2ZW51ZSBhbmQgdGhlIHJlbnQgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzNCIsInByb21wdCI6IlRvdGFsIGFzc2V0cyAoY2FzaCArIGVxdWlwbWVudCkgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzNSIsInByb21wdCI6Ik93bmVyJ3MgZXF1aXR5IChjYXBpdGFsICsgcmV2ZW51ZSDiiJIgcmVudCkgKOKCsSk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('adjusting-entries', 'type-of-adjustment', 1, 'matching', 'Which adjustment is it?',
 'Place each situation under the type of adjusting entry it needs.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6InBlIiwibGFiZWwiOiJQcmVwYWlkIGV4cGVuc2UifSx7ImlkIjoidXIiLCJsYWJlbCI6IlVuZWFybmVkIHJldmVudWUifSx7ImlkIjoiYWUiLCJsYWJlbCI6IkFjY3J1ZWQgZXhwZW5zZSJ9LHsiaWQiOiJhciIsImxhYmVsIjoiQWNjcnVlZCByZXZlbnVlIn1dLAogICAgICJpdGVtcyI6W3siaWQiOiJpMSIsImxhYmVsIjoiUmVudCBwYWlkIGZvciB0aGUgbmV4dCA2IG1vbnRocyJ9LHsiaWQiOiJpMiIsImxhYmVsIjoiQ3VzdG9tZXIgZGVwb3NpdCBmb3IgZnV0dXJlIHdvcmsifSx7ImlkIjoiaTMiLCJsYWJlbCI6IldhZ2VzIG93ZWQgdG8gc3RhZmYgYXQgbW9udGggZW5kIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk0IiwibGFiZWwiOiJJbnRlcmVzdCBlYXJuZWQgYnV0IG5vdCB5ZXQgcmVjZWl2ZWQifSx7ImlkIjoiaTUiLCJsYWJlbCI6IkFubnVhbCBpbnN1cmFuY2UgcGFpZCB1cGZyb250In0seyJpZCI6Imk2IiwibGFiZWwiOiJTdWJzY3JpcHRpb24gcGFpZCBpbiBhZHZhbmNlIGJ5IGEgY3VzdG9tZXIifSwKICAgICAgICAgICAgICB7ImlkIjoiaTciLCJsYWJlbCI6IkVsZWN0cmljaXR5IHVzZWQgYnV0IG5vdCB5ZXQgYmlsbGVkIn0seyJpZCI6Imk4IiwibGFiZWwiOiJDb25zdWx0aW5nIGRvbmUgYnV0IG5vdCB5ZXQgaW52b2ljZWQifV19', 'base64'), 'UTF8')::jsonb),
('adjusting-entries', 'adjusting-entry-errors', 2, 'spot_error', 'Spot the errors: adjusting entries',
 'Two of these adjusting entries are wrong. Select them, then check.',
 convert_from(decode('eyJjb250ZXh0IjoiWWVhciBlbmQgaXMgMzEgRGVjZW1iZXIuIEFtb3VudHMgaW4g4oKxLiIsImNvbHVtbnMiOlsiU2l0dWF0aW9uIiwiQWRqdXN0aW5nIGVudHJ5Il0sInNlbGVjdF9jb3VudCI6MiwKICAgICAicm93cyI6W3siaWQiOiJyMSIsImNlbGxzIjpbIuKCsTEyLDAwMCByZW50IHBhaWQgb24gMSBNYXIgZm9yIDYgbW9udGhzOyBhZGp1c3QgYXQgMzEgTWFyIiwiRHIgUmVudCBleHBlbnNlIDIsMDAwIC8gQ3IgUHJlcGFpZCByZW50IDIsMDAwIl19LAogICAgICAgICAgICAgeyJpZCI6InIyIiwiY2VsbHMiOlsi4oKxMzAsMDAwIG9mIHdhZ2VzIGVhcm5lZCBidXQgdW5wYWlkIGF0IHllYXIgZW5kIiwiRHIgV2FnZXMgcGF5YWJsZSAzMCwwMDAgLyBDciBXYWdlcyBleHBlbnNlIDMwLDAwMCJdfSwKICAgICAgICAgICAgIHsiaWQiOiJyMyIsImNlbGxzIjpbIkN1c3RvbWVyIHByZXBhaWQg4oKxMzYsMDAwIGZvciAxMiBtb250aHMgb24gMSBKdWwiLCJEciBVbmVhcm5lZCByZXZlbnVlIDE4LDAwMCAvIENyIFNlcnZpY2UgcmV2ZW51ZSAxOCwwMDAiXX0sCiAgICAgICAgICAgICB7ImlkIjoicjQiLCJjZWxscyI6WyLigrE0LDAwMCBvZiBpbnRlcmVzdCBlYXJuZWQgYnV0IG5vdCB5ZXQgcmVjZWl2ZWQiLCJEciBJbnRlcmVzdCByZWNlaXZhYmxlIDQsMDAwIC8gQ3IgSW50ZXJlc3QgcmV2ZW51ZSA0LDAwMCJdfSwKICAgICAgICAgICAgIHsiaWQiOiJyNSIsImNlbGxzIjpbIlN1cHBsaWVzIHVzZWQgZHVyaW5nIHRoZSBwZXJpb2Q6IOKCsTYsNTAwIiwiRHIgU3VwcGxpZXMgNiw1MDAgLyBDciBTdXBwbGllcyBleHBlbnNlIDYsNTAwIl19LAogICAgICAgICAgICAgeyJpZCI6InI2IiwiY2VsbHMiOlsi4oKxMjQsMDAwIGluc3VyYW5jZSBwYWlkIG9uIDEgT2N0IGZvciAxMiBtb250aHMiLCJEciBJbnN1cmFuY2UgZXhwZW5zZSA2LDAwMCAvIENyIFByZXBhaWQgaW5zdXJhbmNlIDYsMDAwIl19XX0=', 'base64'), 'UTF8')::jsonb),
('inventory-cogs-methods', 'fifo-vs-average', 1, 'worked_example', 'Worked example: FIFO vs weighted average',
 'Cost the same sales two ways. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkEgc2hvcCBoYXMgMTAwIHVuaXRzIGF0IOKCsTIwIChvcGVuaW5nIHN0b2NrKSBhbmQgYnV5cyAxMDAgbW9yZSB1bml0cyBhdCDigrEyNC4gSXQgc2VsbHMgMTUwIHVuaXRzLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiVW5pdHMgYXZhaWxhYmxlIGZvciBzYWxlPyIsInVuaXQiOiJ1bml0cyJ9LHsiaWQiOiJzMiIsInByb21wdCI6IlRvdGFsIGNvc3Qgb2YgZ29vZHMgYXZhaWxhYmxlICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczMiLCJwcm9tcHQiOiJGSUZPIGNvc3Qgb2YgZ29vZHMgc29sZCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InM0IiwicHJvbXB0IjoiV2VpZ2h0ZWQtYXZlcmFnZSBjb3N0IHBlciB1bml0ICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczUiLCJwcm9tcHQiOiJXZWlnaHRlZC1hdmVyYWdlIGNvc3Qgb2YgZ29vZHMgc29sZCAo4oKxKT8iLCJ1bml0Ijoi4oKxIn1dfQ==', 'base64'), 'UTF8')::jsonb),
('inventory-cogs-methods', 'method-effects', 2, 'matching', 'Which method does that describe?',
 'Assume prices are rising. Match each statement to the method it describes.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImZpZm8iLCJsYWJlbCI6IkZJRk8ifSx7ImlkIjoid2EiLCJsYWJlbCI6IldlaWdodGVkIGF2ZXJhZ2UifV0sCiAgICAgIml0ZW1zIjpbeyJpZCI6ImkxIiwibGFiZWwiOiJSZXBvcnRzIHRoZSBsb3dlc3QgQ09HUyJ9LHsiaWQiOiJpMiIsImxhYmVsIjoiUmVwb3J0cyB0aGUgaGlnaGVzdCBlbmRpbmcgaW52ZW50b3J5In0seyJpZCI6ImkzIiwibGFiZWwiOiJTbW9vdGhzIG91dCBwcmljZSBjaGFuZ2VzIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk0IiwibGFiZWwiOiJVc2VzIG9uZSBhdmVyYWdlIGNvc3QgcGVyIHVuaXQifSx7ImlkIjoiaTUiLCJsYWJlbCI6IkFzc3VtZXMgdGhlIG9sZGVzdCB1bml0cyBhcmUgc29sZCBmaXJzdCJ9LHsiaWQiOiJpNiIsImxhYmVsIjoiQ29zdCBhdmFpbGFibGUgw7cgdW5pdHMgYXZhaWxhYmxlIn1dfQ==', 'base64'), 'UTF8')::jsonb),
('depreciation-ppe', 'sl-vs-ddb', 1, 'worked_example', 'Worked example: straight-line vs double-declining',
 'Depreciate the same truck two ways. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkEgdHJ1Y2sgY29zdHMg4oKxODAwLDAwMCB3aXRoIHNhbHZhZ2UgdmFsdWUg4oKxODAsMDAwIGFuZCBhIDQteWVhciBsaWZlLiIsCiAgICAgInN0ZXBzIjpbeyJpZCI6InMxIiwicHJvbXB0IjoiU3RyYWlnaHQtbGluZSBkZXByZWNpYXRpb24gcGVyIHllYXIgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzMiIsInByb21wdCI6IlN0cmFpZ2h0LWxpbmUgYm9vayB2YWx1ZSBhdCB0aGUgZW5kIG9mIHllYXIgMiAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0sCiAgICAgICAgICAgICAgeyJpZCI6InMzIiwicHJvbXB0IjoiRG91YmxlLWRlY2xpbmluZyB5ZWFyLTEgZXhwZW5zZSAocmF0ZSA1MCUpICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczQiLCJwcm9tcHQiOiJEb3VibGUtZGVjbGluaW5nIHllYXItMiBleHBlbnNlICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczUiLCJwcm9tcHQiOiJEb3VibGUtZGVjbGluaW5nIGJvb2sgdmFsdWUgYXQgdGhlIGVuZCBvZiB5ZWFyIDIgKOKCsSk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('depreciation-ppe', 'fixed-asset-errors', 2, 'spot_error', 'Spot the errors: fixed asset schedule',
 'Two lines in this schedule are wrong. Select them, then check.',
 convert_from(decode('eyJjb250ZXh0IjoiRXF1aXBtZW50IGNvc3Qg4oKxNjAwLDAwMDsgc2FsdmFnZSB2YWx1ZSDigrE2MCwwMDA7IDYteWVhciBsaWZlOyBzdHJhaWdodC1saW5lLiIsImNvbHVtbnMiOlsiTGluZSIsIkFtb3VudCAo4oKxKSJdLCJzZWxlY3RfY291bnQiOjIsCiAgICAgInJvd3MiOlt7ImlkIjoicjEiLCJjZWxscyI6WyJBbm51YWwgZGVwcmVjaWF0aW9uIiwiMTAwLDAwMCJdfSx7ImlkIjoicjIiLCJjZWxscyI6WyJBY2N1bXVsYXRlZCBkZXByZWNpYXRpb24gYWZ0ZXIgMyB5ZWFycyIsIjI3MCwwMDAiXX0sCiAgICAgICAgICAgICB7ImlkIjoicjMiLCJjZWxscyI6WyJCb29rIHZhbHVlIGFmdGVyIDMgeWVhcnMiLCIzMzAsMDAwIl19LHsiaWQiOiJyNCIsImNlbGxzIjpbIkRlcHJlY2lhdGlvbiBleHBlbnNlIGluIHllYXIgNyIsIjkwLDAwMCJdfSwKICAgICAgICAgICAgIHsiaWQiOiJyNSIsImNlbGxzIjpbIkJvb2sgdmFsdWUgYXQgdGhlIGVuZCBvZiB0aGUgdXNlZnVsIGxpZmUiLCI2MCwwMDAiXX1dfQ==', 'base64'), 'UTF8')::jsonb),
('receivables-bad-debts', 'aging-analysis', 1, 'worked_example', 'Worked example: aging of receivables',
 'Build the required allowance and the year''s expense. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkFnaW5nICjigrEpOiBjdXJyZW50IDIsMDAwLDAwMCBhdCAxJTsgMzHigJM2MCBkYXlzIDYwMCwwMDAgYXQgNCU7IDYx4oCTOTAgZGF5cyAzMDAsMDAwIGF0IDEwJTsgb3ZlciA5MCBkYXlzIDEwMCwwMDAgYXQgNDAlLiBUaGUgYWxsb3dhbmNlIGN1cnJlbnRseSBoYXMgYSBjcmVkaXQgYmFsYW5jZSBvZiAzNSwwMDAuIiwKICAgICAic3RlcHMiOlt7ImlkIjoiczEiLCJwcm9tcHQiOiJBbGxvd2FuY2UgbmVlZGVkIGZvciBjdXJyZW50IHJlY2VpdmFibGVzICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczIiLCJwcm9tcHQiOiJBbGxvd2FuY2UgbmVlZGVkIGZvciAzMeKAkzYwIGRheXMgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzMyIsInByb21wdCI6IkFsbG93YW5jZSBuZWVkZWQgZm9yIDYx4oCTOTAgZGF5cyAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InM0IiwicHJvbXB0IjoiQWxsb3dhbmNlIG5lZWRlZCBmb3Igb3ZlciA5MCBkYXlzICjigrEpPyIsInVuaXQiOiLigrEifSwKICAgICAgICAgICAgICB7ImlkIjoiczUiLCJwcm9tcHQiOiJUb3RhbCByZXF1aXJlZCBhbGxvd2FuY2UgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LHsiaWQiOiJzNiIsInByb21wdCI6IkJhZCBkZWJ0IGV4cGVuc2UgZm9yIHRoZSB5ZWFyICjigrEpPyIsInVuaXQiOiLigrEifV19', 'base64'), 'UTF8')::jsonb),
('receivables-bad-debts', 'which-entry', 2, 'matching', 'Adjustment, write-off or recovery?',
 'Match each description to the type of entry.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6ImFkaiIsImxhYmVsIjoiUGVyaW9kLWVuZCBhZGp1c3RtZW50In0seyJpZCI6IndvIiwibGFiZWwiOiJXcml0ZS1vZmYifSx7ImlkIjoicmVjIiwibGFiZWwiOiJSZWNvdmVyeSJ9XSwKICAgICAiaXRlbXMiOlt7ImlkIjoiaTEiLCJsYWJlbCI6IkRyIEJhZCBkZWJ0IGV4cGVuc2UsIENyIEFsbG93YW5jZSJ9LHsiaWQiOiJpMiIsImxhYmVsIjoiRHIgQWxsb3dhbmNlLCBDciBBY2NvdW50cyByZWNlaXZhYmxlIn0seyJpZCI6ImkzIiwibGFiZWwiOiJSZWluc3RhdGUgdGhlIHJlY2VpdmFibGUsIHRoZW4gcmVjb3JkIHRoZSBjYXNoIHJlY2VpdmVkIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk0IiwibGFiZWwiOiJJbmNyZWFzZXMgZXhwZW5zZXMgaW4gdGhlIGluY29tZSBzdGF0ZW1lbnQifSx7ImlkIjoiaTUiLCJsYWJlbCI6IkxlYXZlcyBuZXQgcmVjZWl2YWJsZXMgdW5jaGFuZ2VkIn0seyJpZCI6Imk2IiwibGFiZWwiOiJBIGN1c3RvbWVyIHBheXMgYW4gYWNjb3VudCBhbHJlYWR5IHdyaXR0ZW4gb2ZmIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk3IiwibGFiZWwiOiJSZWNvcmRlZCBvbmNlIGEgcGVyaW9kIGZyb20gYW4gZXN0aW1hdGUifSx7ImlkIjoiaTgiLCJsYWJlbCI6IlRyaWdnZXJlZCB3aGVuIGEgc3BlY2lmaWMgY3VzdG9tZXIgaXMgZGVjbGFyZWQgdW5jb2xsZWN0aWJsZSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('revenue-recognition', 'timing-of-revenue', 1, 'matching', 'Point in time or over time?',
 'Decide when revenue is recognised for each situation.',
 convert_from(decode('eyJjYXRlZ29yaWVzIjpbeyJpZCI6InBpdCIsImxhYmVsIjoiQXQgYSBwb2ludCBpbiB0aW1lIn0seyJpZCI6Im90IiwibGFiZWwiOiJPdmVyIHRpbWUifV0sCiAgICAgIml0ZW1zIjpbeyJpZCI6ImkxIiwibGFiZWwiOiJTZWxsaW5nIGEgcGhvbmUgaW4gYSBzdG9yZSJ9LHsiaWQiOiJpMiIsImxhYmVsIjoiMTItbW9udGggc29mdHdhcmUgc3VwcG9ydCBjb250cmFjdCJ9LHsiaWQiOiJpMyIsImxhYmVsIjoiQnVpbGRpbmcgYSBmYWNpbGl0eSBvbiB0aGUgY3VzdG9tZXIncyBsYW5kIn0sCiAgICAgICAgICAgICAgeyJpZCI6Imk0IiwibGFiZWwiOiJHb29kcyB3aG9zZSBjb250cm9sIHBhc3NlcyBvbiBkZWxpdmVyeSJ9LHsiaWQiOiJpNSIsImxhYmVsIjoiQSBtb250aGx5IGd5bSBtZW1iZXJzaGlwIn0seyJpZCI6Imk2IiwibGFiZWwiOiJBIHBlcnBldHVhbCBzb2Z0d2FyZSBsaWNlbmNlIGRlbGl2ZXJlZCB0b2RheSJ9XX0=', 'base64'), 'UTF8')::jsonb),
('revenue-recognition', 'allocate-price', 2, 'worked_example', 'Worked example: allocate the transaction price',
 'Split a bundle price and time the revenue. Hints are available but cost points.',
 convert_from(decode('eyJpbnRybyI6IkEgYnVuZGxlIG9mIGEgbGFwdG9wIChzdGFuZGFsb25lIHByaWNlIOKCsTYwLDAwMCkgYW5kIGEgMi15ZWFyIHNlcnZpY2UgcGxhbiAoc3RhbmRhbG9uZSBwcmljZSDigrEyMCwwMDApIGlzIHNvbGQgZm9yIOKCsTcyLDAwMC4gVGhlIGxhcHRvcCBpcyBkZWxpdmVyZWQgbm93OyB0aGUgc2VydmljZSBpcyBkZWxpdmVyZWQgZXZlbmx5IG92ZXIgMiB5ZWFycy4iLAogICAgICJzdGVwcyI6W3siaWQiOiJzMSIsInByb21wdCI6IlRvdGFsIG9mIHRoZSBzdGFuZGFsb25lIHByaWNlcyAo4oKxKT8iLCJ1bml0Ijoi4oKxIn0seyJpZCI6InMyIiwicHJvbXB0IjoiUHJpY2UgYWxsb2NhdGVkIHRvIHRoZSBsYXB0b3AgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzMyIsInByb21wdCI6IlByaWNlIGFsbG9jYXRlZCB0byB0aGUgc2VydmljZSBwbGFuICjigrEpPyIsInVuaXQiOiLigrEifSx7ImlkIjoiczQiLCJwcm9tcHQiOiJTZXJ2aWNlIHJldmVudWUgcGVyIHllYXIgKOKCsSk/IiwidW5pdCI6IuKCsSJ9LAogICAgICAgICAgICAgIHsiaWQiOiJzNSIsInByb21wdCI6IlRvdGFsIHJldmVudWUgcmVjb2duaXNlZCBpbiB5ZWFyIDEgKOKCsSk/IiwidW5pdCI6IuKCsSJ9XX0=', 'base64'), 'UTF8')::jsonb)
) as v(lesson, slug, pos, kind, title, instructions, content)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, slug) do update
  set position = excluded.position, kind = excluded.kind, title = excluded.title,
      instructions = excluded.instructions, content = excluded.content;

insert into public.lesson_activity_keys (activity_id, key)
select a.id, v.key::jsonb
from (values
('accounting-equation-journal', 'debit-or-credit', convert_from(decode('eyJpMSI6ImRyIiwiaTIiOiJjciIsImkzIjoiZHIiLCJpNCI6ImNyIiwiaTUiOiJkciIsImk2IjoiY3IiLCJpNyI6ImRyIiwiaTgiOiJjciIsImk5IjoiZHIifQ==', 'base64'), 'UTF8')::jsonb),
('accounting-equation-journal', 'print-shop-month', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjIwMDAwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiT25seSB0aGUgb3duZXIncyBjYXNoIGludmVzdG1lbnQgc28gZmFyLiIsImV4cGxhbmF0aW9uIjoiQ2FzaCA9IDIwMCwwMDAuIn0sCiAgInMyIjp7ImFuc3dlciI6ODAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkJ1eWluZyBlcXVpcG1lbnQgc3dhcHMgY2FzaCBmb3IgZXF1aXBtZW50LiIsImV4cGxhbmF0aW9uIjoiMjAwLDAwMCDiiJIgMTIwLDAwMCA9IDgwLDAwMC4ifSwKICAiczMiOnsiYW5zd2VyIjoxMTUwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkFkZCB0aGUgcmV2ZW51ZSwgc3VidHJhY3QgdGhlIHJlbnQuIiwiZXhwbGFuYXRpb24iOiI4MCwwMDAgKyA1MCwwMDAg4oiSIDE1LDAwMCA9IDExNSwwMDAuIn0sCiAgInM0Ijp7ImFuc3dlciI6MjM1MDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJDYXNoIHBsdXMgZXF1aXBtZW50IChhdCBjb3N0KS4iLCJleHBsYW5hdGlvbiI6IjExNSwwMDAgKyAxMjAsMDAwID0gMjM1LDAwMC4ifSwKICAiczUiOnsiYW5zd2VyIjoyMzUwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlRoZXJlIGFyZSBubyBsaWFiaWxpdGllcywgc28gZXF1aXR5IGVxdWFscyBhc3NldHMuIiwiZXhwbGFuYXRpb24iOiIyMDAsMDAwICsgNTAsMDAwIOKIkiAxNSwwMDAgPSAyMzUsMDAwIOKAlCBlcXVhbCB0byB0b3RhbCBhc3NldHMsIHNvIHRoZSBlcXVhdGlvbiBiYWxhbmNlcy4ifX0=', 'base64'), 'UTF8')::jsonb),
('adjusting-entries', 'type-of-adjustment', convert_from(decode('eyJpMSI6InBlIiwiaTIiOiJ1ciIsImkzIjoiYWUiLCJpNCI6ImFyIiwiaTUiOiJwZSIsImk2IjoidXIiLCJpNyI6ImFlIiwiaTgiOiJhciJ9', 'base64'), 'UTF8')::jsonb),
('adjusting-entries', 'adjusting-entry-errors', convert_from(decode('eyJlcnJvcnMiOlsicjIiLCJyNSJdLCJleHBsYW5hdGlvbnMiOnsicjIiOiJBY2NydWVkIHdhZ2VzIGFyZSBEciBXYWdlcyBleHBlbnNlIC8gQ3IgV2FnZXMgcGF5YWJsZS4gVGhlIGVudHJ5IHNob3duIGlzIHJldmVyc2VkLiIsInI1IjoiVXNpbmcgc3VwcGxpZXMgaXMgRHIgU3VwcGxpZXMgZXhwZW5zZSAvIENyIFN1cHBsaWVzLiBUaGUgZW50cnkgc2hvd24gaXMgcmV2ZXJzZWQuIn19', 'base64'), 'UTF8')::jsonb),
('inventory-cogs-methods', 'fifo-vs-average', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjIwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiT3BlbmluZyB1bml0cyBwbHVzIHB1cmNoYXNlZCB1bml0cy4iLCJleHBsYW5hdGlvbiI6IjEwMCArIDEwMCA9IDIwMC4ifSwKICAiczIiOnsiYW5zd2VyIjo0NDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIxMDAgw5cgMjAgcGx1cyAxMDAgw5cgMjQuIiwiZXhwbGFuYXRpb24iOiIyLDAwMCArIDIsNDAwID0gNCw0MDAuIn0sCiAgInMzIjp7ImFuc3dlciI6MzIwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiVGhlIDEwMCBvbGRlciB1bml0cyBhdCAyMCwgdGhlbiA1MCB1bml0cyBhdCAyNC4iLCJleHBsYW5hdGlvbiI6IjEwMCDDlyAyMCArIDUwIMOXIDI0ID0gMywyMDAuIn0sCiAgInM0Ijp7ImFuc3dlciI6MjIsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlRvdGFsIGNvc3Qgw7cgdG90YWwgdW5pdHMuIiwiZXhwbGFuYXRpb24iOiI0LDQwMCDDtyAyMDAgPSAyMi4ifSwKICAiczUiOnsiYW5zd2VyIjozMzAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJVbml0cyBzb2xkIMOXIGF2ZXJhZ2UgY29zdC4iLCJleHBsYW5hdGlvbiI6IjE1MCDDlyAyMiA9IDMsMzAwLiBGSUZPIENPR1MgaXMgbG93ZXIsIHNvIEZJRk8gcHJvZml0IGlzIGhpZ2hlciB3aGVuIHByaWNlcyByaXNlLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('inventory-cogs-methods', 'method-effects', convert_from(decode('eyJpMSI6ImZpZm8iLCJpMiI6ImZpZm8iLCJpMyI6IndhIiwiaTQiOiJ3YSIsImk1IjoiZmlmbyIsImk2Ijoid2EifQ==', 'base64'), 'UTF8')::jsonb),
('depreciation-ppe', 'sl-vs-ddb', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjE4MDAwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiKENvc3Qg4oiSIHNhbHZhZ2UpIMO3IGxpZmUuIiwiZXhwbGFuYXRpb24iOiIoODAwLDAwMCDiiJIgODAsMDAwKSDDtyA0ID0gMTgwLDAwMC4ifSwKICAiczIiOnsiYW5zd2VyIjo0NDAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkNvc3QgbWludXMgdHdvIHllYXJzIG9mIGRlcHJlY2lhdGlvbi4iLCJleHBsYW5hdGlvbiI6IjgwMCwwMDAg4oiSIDIgw5cgMTgwLDAwMCA9IDQ0MCwwMDAuIn0sCiAgInMzIjp7ImFuc3dlciI6NDAwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJSYXRlIMOXIG9wZW5pbmcgYm9vayB2YWx1ZSAoc2FsdmFnZSBpcyBpZ25vcmVkKS4iLCJleHBsYW5hdGlvbiI6IjUwJSDDlyA4MDAsMDAwID0gNDAwLDAwMC4ifSwKICAiczQiOnsiYW5zd2VyIjoyMDAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlJhdGUgw5cgdGhlIG5ldyBvcGVuaW5nIGJvb2sgdmFsdWUgb2YgNDAwLDAwMC4iLCJleHBsYW5hdGlvbiI6IjUwJSDDlyA0MDAsMDAwID0gMjAwLDAwMC4ifSwKICAiczUiOnsiYW5zd2VyIjoyMDAwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IkNvc3QgbWludXMgdGhlIHR3byB5ZWFycyBvZiBleHBlbnNlLiIsImV4cGxhbmF0aW9uIjoiODAwLDAwMCDiiJIgNDAwLDAwMCDiiJIgMjAwLDAwMCA9IDIwMCwwMDAuIn19', 'base64'), 'UTF8')::jsonb),
('depreciation-ppe', 'fixed-asset-errors', convert_from(decode('eyJlcnJvcnMiOlsicjEiLCJyNCJdLCJleHBsYW5hdGlvbnMiOnsicjEiOiJBbm51YWwgZGVwcmVjaWF0aW9uID0gKDYwMCwwMDAg4oiSIDYwLDAwMCkgw7cgNiA9IDkwLDAwMC4gVGhlIHNhbHZhZ2UgdmFsdWUgbXVzdCBiZSBkZWR1Y3RlZCBmaXJzdC4iLCJyNCI6IlRoZSBhc3NldCBpcyBmdWxseSBkZXByZWNpYXRlZCB0byBpdHMgc2FsdmFnZSB2YWx1ZSBhZnRlciB5ZWFyIDYsIHNvIGRlcHJlY2lhdGlvbiBleHBlbnNlIGluIHllYXIgNyBpcyB6ZXJvLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('receivables-bad-debts', 'aging-analysis', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjIwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIyLDAwMCwwMDAgw5cgMSUuIiwiZXhwbGFuYXRpb24iOiIyLDAwMCwwMDAgw5cgMSUgPSAyMCwwMDAuIn0sCiAgInMyIjp7ImFuc3dlciI6MjQwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjYwMCwwMDAgw5cgNCUuIiwiZXhwbGFuYXRpb24iOiI2MDAsMDAwIMOXIDQlID0gMjQsMDAwLiJ9LAogICJzMyI6eyJhbnN3ZXIiOjMwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIzMDAsMDAwIMOXIDEwJS4iLCJleHBsYW5hdGlvbiI6IjMwMCwwMDAgw5cgMTAlID0gMzAsMDAwLiJ9LAogICJzNCI6eyJhbnN3ZXIiOjQwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiIxMDAsMDAwIMOXIDQwJS4iLCJleHBsYW5hdGlvbiI6IjEwMCwwMDAgw5cgNDAlID0gNDAsMDAwLiJ9LAogICJzNSI6eyJhbnN3ZXIiOjExNDAwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiQWRkIHRoZSBmb3VyIGJ1Y2tldHMuIiwiZXhwbGFuYXRpb24iOiIyMCwwMDAgKyAyNCwwMDAgKyAzMCwwMDAgKyA0MCwwMDAgPSAxMTQsMDAwLiJ9LAogICJzNiI6eyJhbnN3ZXIiOjc5MDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiJSZXF1aXJlZCBhbGxvd2FuY2UgbWludXMgdGhlIGV4aXN0aW5nIGNyZWRpdCBiYWxhbmNlLiIsImV4cGxhbmF0aW9uIjoiMTE0LDAwMCDiiJIgMzUsMDAwID0gNzksMDAwLiJ9fQ==', 'base64'), 'UTF8')::jsonb),
('receivables-bad-debts', 'which-entry', convert_from(decode('eyJpMSI6ImFkaiIsImkyIjoid28iLCJpMyI6InJlYyIsImk0IjoiYWRqIiwiaTUiOiJ3byIsImk2IjoicmVjIiwiaTciOiJhZGoiLCJpOCI6IndvIn0=', 'base64'), 'UTF8')::jsonb),
('revenue-recognition', 'timing-of-revenue', convert_from(decode('eyJpMSI6InBpdCIsImkyIjoib3QiLCJpMyI6Im90IiwiaTQiOiJwaXQiLCJpNSI6Im90IiwiaTYiOiJwaXQifQ==', 'base64'), 'UTF8')::jsonb),
('revenue-recognition', 'allocate-price', convert_from(decode('ewogICJzMSI6eyJhbnN3ZXIiOjgwMDAwLCJ0b2xlcmFuY2VfcGN0IjowLjUsImhpbnQiOiI2MCwwMDAgKyAyMCwwMDAuIiwiZXhwbGFuYXRpb24iOiI2MCwwMDAgKyAyMCwwMDAgPSA4MCwwMDAuIn0sCiAgInMyIjp7ImFuc3dlciI6NTQwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IjcyLDAwMCDDlyA2MC84MC4iLCJleHBsYW5hdGlvbiI6IjcyLDAwMCDDlyA2MCDDtyA4MCA9IDU0LDAwMC4ifSwKICAiczMiOnsiYW5zd2VyIjoxODAwMCwidG9sZXJhbmNlX3BjdCI6MC41LCJoaW50IjoiNzIsMDAwIMOXIDIwLzgwLiIsImV4cGxhbmF0aW9uIjoiNzIsMDAwIMOXIDIwIMO3IDgwID0gMTgsMDAwLiJ9LAogICJzNCI6eyJhbnN3ZXIiOjkwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlNwcmVhZCB0aGUgc2VydmljZSBhbGxvY2F0aW9uIG92ZXIgMiB5ZWFycy4iLCJleHBsYW5hdGlvbiI6IjE4LDAwMCDDtyAyID0gOSwwMDAuIn0sCiAgInM1Ijp7ImFuc3dlciI6NjMwMDAsInRvbGVyYW5jZV9wY3QiOjAuNSwiaGludCI6IlRoZSBsYXB0b3AgaXMgcmVjb2duaXNlZCBub3c7IGFkZCBvbmUgeWVhciBvZiBzZXJ2aWNlLiIsImV4cGxhbmF0aW9uIjoiNTQsMDAwICsgOSwwMDAgPSA2MywwMDAuIn19', 'base64'), 'UTF8')::jsonb)
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
('accounting-equation-journal',1,'The accounting equation','Assets = Liabilities + Equity.'),
('accounting-equation-journal',2,'Accounts that increase with a debit','Assets and expenses.'),
('accounting-equation-journal',3,'Accounts that increase with a credit','Liabilities, equity and revenue.'),
('accounting-equation-journal',4,'Double-entry rule','Every transaction has equal total debits and credits.'),
('accounting-equation-journal',5,'Owner invests cash: entry','Dr Cash / Cr Owner''s capital.'),
('accounting-equation-journal',6,'Buy supplies on credit: entry','Dr Supplies / Cr Accounts payable.'),
('accounting-equation-journal',7,'Pay rent in cash: entry','Dr Rent expense / Cr Cash.'),
('accounting-equation-journal',8,'What does a trial balance prove?','That total debits equal total credits — not that there are no errors.'),
('accounting-equation-journal',9,'What increases equity?','Revenue and owner investment.'),
('accounting-equation-journal',10,'What decreases equity?','Expenses and owner withdrawals.'),
('adjusting-entries',1,'Why make adjusting entries?','To record revenue when earned and expenses when incurred.'),
('adjusting-entries',2,'Prepaid expense','Cash paid first; an asset that becomes an expense as it is used.'),
('adjusting-entries',3,'Unearned revenue','Cash received first; a liability that becomes revenue as work is done.'),
('adjusting-entries',4,'Accrued expense: entry','Dr Expense / Cr Payable (e.g. wages payable).'),
('adjusting-entries',5,'Accrued revenue: entry','Dr Receivable / Cr Revenue.'),
('adjusting-entries',6,'Prepaid used =','Cost × months elapsed ÷ months covered.'),
('adjusting-entries',7,'Accrued interest =','Principal × annual rate × months ÷ 12.'),
('adjusting-entries',8,'Supplies expense =','Opening supplies + purchases − closing count.'),
('adjusting-entries',9,'Deferral vs accrual','Deferral: cash first, work later. Accrual: work first, cash later.'),
('adjusting-entries',10,'Effect of a missed accrued expense','Expenses and liabilities are understated; profit is overstated.'),
('inventory-cogs-methods',1,'COGS formula','Beginning inventory + purchases − ending inventory.'),
('inventory-cogs-methods',2,'FIFO','Oldest costs go to COGS first; ending inventory holds the newest costs.'),
('inventory-cogs-methods',3,'Weighted-average cost per unit','Cost of goods available ÷ units available.'),
('inventory-cogs-methods',4,'LIFO and IFRS/PFRS','Not permitted.'),
('inventory-cogs-methods',5,'Rising prices: FIFO vs average','FIFO gives lower COGS and higher profit.'),
('inventory-cogs-methods',6,'Falling prices: FIFO vs average','FIFO gives higher COGS and lower profit.'),
('inventory-cogs-methods',7,'Inventory valuation rule','Lower of cost and net realisable value.'),
('inventory-cogs-methods',8,'Overstated ending inventory effect','COGS understated, profit overstated.'),
('inventory-cogs-methods',9,'Goods available for sale','Beginning inventory + purchases (split into COGS and ending inventory).'),
('inventory-cogs-methods',10,'Net realisable value','Expected selling price minus costs to complete and sell.'),
('depreciation-ppe',1,'Depreciation is…','Allocation of cost over useful life — not market valuation.'),
('depreciation-ppe',2,'Straight-line','(Cost − Salvage) ÷ Life.'),
('depreciation-ppe',3,'Double-declining rate','2 ÷ useful life, applied to opening book value.'),
('depreciation-ppe',4,'Units of production','(Cost − Salvage) ÷ Total units × Units used.'),
('depreciation-ppe',5,'Book value','Cost − Accumulated depreciation.'),
('depreciation-ppe',6,'Which asset is not depreciated?','Land.'),
('depreciation-ppe',7,'Depreciation on the cash flow statement','Added back — it is a non-cash expense.'),
('depreciation-ppe',8,'Gain or loss on disposal','Sale proceeds − Book value.'),
('depreciation-ppe',9,'Accelerated methods','Higher expense early, lower later; same total over the life.'),
('depreciation-ppe',10,'Floor for depreciation','Never depreciate below salvage value.'),
('receivables-bad-debts',1,'Allowance method','Estimate uncollectible receivables up front to match the cost with the sales.'),
('receivables-bad-debts',2,'Adjusting entry for bad debts','Dr Bad debt expense / Cr Allowance for doubtful accounts.'),
('receivables-bad-debts',3,'Write-off entry','Dr Allowance / Cr Accounts receivable (no profit effect).'),
('receivables-bad-debts',4,'Net realisable value of receivables','Gross receivables − Allowance.'),
('receivables-bad-debts',5,'The allowance is a…','Contra-asset.'),
('receivables-bad-debts',6,'Percentage-of-sales method','Gives the expense directly: credit sales × estimated %.'),
('receivables-bad-debts',7,'Aging method','Required allowance from age buckets; expense = required − existing credit balance.'),
('receivables-bad-debts',8,'DSO =','Receivables ÷ credit sales × days in the period.'),
('receivables-bad-debts',9,'Rising DSO may signal','Slower collections or aggressive revenue recognition.'),
('receivables-bad-debts',10,'PFRS 9 impairment basis','Expected credit losses.'),
('revenue-recognition',1,'Step 1 of the model','Identify the contract with the customer.'),
('revenue-recognition',2,'Step 2','Identify the performance obligations.'),
('revenue-recognition',3,'Step 3','Determine the transaction price.'),
('revenue-recognition',4,'Step 4','Allocate the price by relative standalone selling prices.'),
('revenue-recognition',5,'Step 5','Recognise revenue when (or as) each obligation is satisfied.'),
('revenue-recognition',6,'Over-time examples','Support contracts, memberships, construction for the customer.'),
('revenue-recognition',7,'Point-in-time example','Selling a phone in a store.'),
('revenue-recognition',8,'Cash received before delivery','A contract liability (unearned revenue).'),
('revenue-recognition',9,'Variable consideration rule','Include only to the extent a significant reversal is unlikely.'),
('revenue-recognition',10,'Aggressive-recognition red flag','Revenue far ahead of cash collection; receivables ballooning.')
) as v(lesson, pos, front, back)
join public.lessons l on l.slug = v.lesson
on conflict (lesson_id, position) do update set front = excluded.front, back = excluded.back;
