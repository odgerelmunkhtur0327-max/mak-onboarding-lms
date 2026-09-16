-- "Монголын Алт" МАК ХХК – onboarding LMS
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  department text not null default '',
  start_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  sort_order integer not null unique,
  title text not null,
  description text not null default '',
  video_url text not null default '',
  video_duration_minutes integer not null default 0 check (video_duration_minutes >= 0),
  require_full_watch boolean not null default true,
  passing_score integer not null default 85 check (passing_score between 85 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  sort_order integer not null,
  question_type text not null check (question_type in ('single', 'multiple', 'truefalse')),
  question_text text not null,
  correct_option_indexes jsonb not null default '[]'::jsonb,
  points integer not null default 1 check (points > 0),
  explanation text,
  unique (course_id, sort_order)
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id text not null references public.questions(id) on delete cascade,
  sort_order integer not null,
  option_text text not null,
  unique (question_id, sort_order)
);

create table if not exists public.user_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  video_completed boolean not null default false,
  quiz_answers jsonb,
  score integer,
  total_points integer,
  passed boolean,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index if not exists questions_course_id_idx on public.questions(course_id);
create index if not exists question_options_question_id_idx on public.question_options(question_id);
create index if not exists user_progress_course_id_idx on public.user_progress(course_id);

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.user_progress enable row level security;
-- All browser access is routed through the Edge Function, which uses the
-- service-role key. No direct anonymous table policies are intentionally added.
