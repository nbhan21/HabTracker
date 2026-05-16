-- Clerk backend + Supabase RLS for HabTracker
-- Run this AFTER db/schema_mvp.sql

-- 1) Enable RLS on user-owned tables
alter table public.users enable row level security;
alter table public.habits enable row level security;
alter table public.habit_completions enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.books enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.habit_templates enable row level security;

-- 2) Drop existing policies if you re-run this file during iteration
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can read own habits" on public.habits;
drop policy if exists "Users can insert own habits" on public.habits;
drop policy if exists "Users can update own habits" on public.habits;
drop policy if exists "Users can delete own habits" on public.habits;
drop policy if exists "Users can read own completions" on public.habit_completions;
drop policy if exists "Users can insert own completions" on public.habit_completions;
drop policy if exists "Users can update own completions" on public.habit_completions;
drop policy if exists "Users can delete own completions" on public.habit_completions;
drop policy if exists "Users can read own tasks" on public.daily_tasks;
drop policy if exists "Users can insert own tasks" on public.daily_tasks;
drop policy if exists "Users can update own tasks" on public.daily_tasks;
drop policy if exists "Users can delete own tasks" on public.daily_tasks;
drop policy if exists "Users can read own books" on public.books;
drop policy if exists "Users can insert own books" on public.books;
drop policy if exists "Users can update own books" on public.books;
drop policy if exists "Users can delete own books" on public.books;
drop policy if exists "Users can read own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can insert own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can update own weekly reviews" on public.weekly_reviews;
drop policy if exists "Anyone can read habit templates" on public.habit_templates;

-- 3) Global read-only templates
create policy "Anyone can read habit templates"
on public.habit_templates
for select
using (true);


