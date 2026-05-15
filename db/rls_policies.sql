-- Supabase RLS + auth trigger for HabTracker MVP
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

-- 3) Profile policies
create policy "Users can read own profile"
on public.users
for select
using (id = auth.uid());

create policy "Users can update own profile"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

-- 4) Habits policies
create policy "Users can read own habits"
on public.habits
for select
using (user_id = auth.uid());

create policy "Users can insert own habits"
on public.habits
for insert
with check (user_id = auth.uid());

create policy "Users can update own habits"
on public.habits
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own habits"
on public.habits
for delete
using (user_id = auth.uid());

-- 5) Habit completions policies
create policy "Users can read own completions"
on public.habit_completions
for select
using (user_id = auth.uid());

create policy "Users can insert own completions"
on public.habit_completions
for insert
with check (user_id = auth.uid());

create policy "Users can update own completions"
on public.habit_completions
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own completions"
on public.habit_completions
for delete
using (user_id = auth.uid());

-- 6) Daily tasks policies
create policy "Users can read own tasks"
on public.daily_tasks
for select
using (user_id = auth.uid());

create policy "Users can insert own tasks"
on public.daily_tasks
for insert
with check (user_id = auth.uid());

create policy "Users can update own tasks"
on public.daily_tasks
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own tasks"
on public.daily_tasks
for delete
using (user_id = auth.uid());

-- 7) Books policies
create policy "Users can read own books"
on public.books
for select
using (user_id = auth.uid());

create policy "Users can insert own books"
on public.books
for insert
with check (user_id = auth.uid());

create policy "Users can update own books"
on public.books
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own books"
on public.books
for delete
using (user_id = auth.uid());

-- 8) Weekly reviews policies (optional snapshots)
create policy "Users can read own weekly reviews"
on public.weekly_reviews
for select
using (user_id = auth.uid());

create policy "Users can insert own weekly reviews"
on public.weekly_reviews
for insert
with check (user_id = auth.uid());

create policy "Users can update own weekly reviews"
on public.weekly_reviews
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 9) Global read-only templates
create policy "Anyone can read habit templates"
on public.habit_templates
for select
using (true);

-- 10) Create a public.users row automatically when a Supabase Auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
