-- =====================================================================
-- FINLAB — 0009 Function privileges hardening
-- Supabase grants EXECUTE on new functions to `anon` by default. Signed-out
-- visitors only need the public Finance Passport and certificate
-- verification, so revoke everything else from anon (and PUBLIC).
-- Signed-in users keep the explicit grants made in earlier migrations.
-- =====================================================================
revoke execute on all functions in schema public from public, anon;

grant execute on function
  public.is_admin(),
  public.get_passport(text),
  public.verify_certificate(text),
  public.get_user_certificates(text),
  public.all_youtube_urls(text[])
to anon;

-- Future functions: do not auto-grant to anon.
alter default privileges in schema public revoke execute on functions from public, anon;
