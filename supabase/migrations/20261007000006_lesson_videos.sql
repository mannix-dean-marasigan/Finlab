-- =====================================================================
-- FINLAB — 0006 Multiple embedded videos per lesson
-- Replaces the single video_url with an ordered list of YouTube links.
-- Watching is not tracked; the knowledge check remains the gate.
-- =====================================================================

create or replace function public.all_youtube_urls(p_urls text[])
returns boolean
language sql immutable
as $$
  select coalesce(bool_and(u ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'), true) from unnest(p_urls) u;
$$;

alter table public.lessons add column if not exists video_urls text[] not null default '{}';
alter table public.lessons drop constraint if exists lessons_video_urls_check;
alter table public.lessons add constraint lessons_video_urls_check
  check (cardinality(video_urls) <= 6 and public.all_youtube_urls(video_urls));

update public.lessons set video_urls = array[video_url]
 where video_url is not null and cardinality(video_urls) = 0;
alter table public.lessons drop column if exists video_url;

-- Pure validation helper used by the check constraint; safe for any role.
grant execute on function public.all_youtube_urls(text[]) to authenticated, anon;
