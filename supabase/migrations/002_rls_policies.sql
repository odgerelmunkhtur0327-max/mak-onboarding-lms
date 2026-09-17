-- Disable RLS for all app tables (internal tool – auth at application layer)
alter table public.courses         disable row level security;
alter table public.questions       disable row level security;
alter table public.question_options disable row level security;
alter table public.users           disable row level security;
alter table public.user_progress   disable row level security;

-- Grant full access to the anon role used by the frontend Supabase client
grant usage  on schema public to anon;
grant all    on public.courses          to anon;
grant all    on public.questions        to anon;
grant all    on public.question_options to anon;
grant all    on public.users            to anon;
grant all    on public.user_progress    to anon;
grant all    on all sequences in schema public to anon;
