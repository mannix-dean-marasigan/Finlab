-- =====================================================================
-- FINLAB — 0004 Integrity: keep calculated data consistent when admins
-- delete challenges or competitions (evidence rows have no FK because
-- skill_evidence.source_id is polymorphic).
-- =====================================================================

create or replace function public.on_evidence_source_deleted()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_type text := case tg_table_name when 'challenges' then 'challenge' else 'competition' end;
  r record;
begin
  for r in select distinct user_id from skill_evidence where source_type = v_type and source_id = old.id loop
    delete from skill_evidence where user_id = r.user_id and source_type = v_type and source_id = old.id;
    perform public.recalculate_user_scores(r.user_id);
  end loop;
  return old;
end;
$$;

create trigger trg_challenges_deleted after delete on public.challenges
  for each row execute function public.on_evidence_source_deleted();
create trigger trg_competitions_deleted after delete on public.competitions
  for each row execute function public.on_evidence_source_deleted();

-- Supabase grants EXECUTE on new functions by default; internal helpers must not be callable.
revoke execute on function public.on_evidence_source_deleted() from public, anon, authenticated;
