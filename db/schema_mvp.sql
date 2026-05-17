-- DB Schema MVP for Habits & Productivity Tracker
-- Date: 2026-05-08 (final Clerk-native schema for fresh Supabase projects)
-- Notes: This schema uses date-only for completions (column `date`), per your preference.

-- Enable uuid generation (Postgres with pgcrypto or pguuid extension)
-- CREATE EXTENSION if not already enabled:
-- create extension if not exists pgcrypto;
-- Ensure pgcrypto is available for `gen_random_uuid()`; safe to run idempotently
create extension if not exists pgcrypto;

-- Ensure we're operating in the public schema (helps when running from Supabase SQL editor)
set search_path = public;

-- Drop any previous attempt of the schema so this file works on a reused empty project.
-- No data needs to be preserved for this setup.
drop table if exists public.weekly_reviews cascade;
drop table if exists public.habit_completions cascade;
drop table if exists public.daily_tasks cascade;
drop table if exists public.books cascade;
drop table if exists public.habits cascade;
drop table if exists public.habit_templates cascade;
drop table if exists public.users cascade;

-- =====================================================
-- USERS TABLE - Clerk ownership
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  clerk_user_id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  display_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- HABITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  legacy_local_id text,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  category text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  frequency text NOT NULL DEFAULT 'Daily' CHECK (frequency IN ('Daily', 'Weekly')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_habits_clerk_user ON habits(clerk_user_id);
DROP INDEX IF EXISTS ux_habits_clerk_user_legacy_local_id;
CREATE UNIQUE INDEX IF NOT EXISTS ux_habits_clerk_user_legacy_local_id ON habits(clerk_user_id, legacy_local_id);

-- =====================================================
-- HABIT COMPLETIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date date NOT NULL,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_habit_clerk_user_date ON habit_completions(clerk_user_id, habit_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_clerk_user_date ON habit_completions(clerk_user_id, date);

-- =====================================================
-- DAILY TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  legacy_local_id text,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP INDEX IF EXISTS ux_daily_tasks_clerk_user_legacy_local_id;
CREATE UNIQUE INDEX IF NOT EXISTS ux_daily_tasks_clerk_user_legacy_local_id ON daily_tasks(clerk_user_id, legacy_local_id);

-- =====================================================
-- BOOKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  legacy_local_id text,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  current_page int NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  total_pages int NOT NULL CHECK (total_pages > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP INDEX IF EXISTS ux_books_clerk_user_legacy_local_id;
CREATE UNIQUE INDEX IF NOT EXISTS ux_books_clerk_user_legacy_local_id ON books(clerk_user_id, legacy_local_id);

-- =====================================================
-- HABIT TEMPLATES TABLE (Global, read-only reference)
-- =====================================================
CREATE TABLE IF NOT EXISTS habit_templates (
  id text PRIMARY KEY,
  name text,
  category text,
  priority text,
  frequency text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insert default templates
INSERT INTO habit_templates (id, name, category, priority, frequency, description)
VALUES
  ('tpl-morning-routine', 'Morning Routine 20m', 'Health', 'Medium', 'Daily', 'Wake up, hydrate, and do a short mobility routine.'),
  ('tpl-deep-work', 'Deep Work 90m', 'Work', 'High', 'Daily', 'One focused block without notifications or meetings.'),
  ('tpl-reading', 'Reading 20 Pages', 'Learning', 'Low', 'Daily', 'Read non-fiction or technical material for steady growth.'),
  ('tpl-reflection', 'Evening Reflection', 'Mindset', 'Low', 'Daily', 'Journal 3 wins and 1 lesson from your day.')
ON CONFLICT DO NOTHING;

-- =====================================================
-- WEEKLY REVIEWS TABLE (Optional: snapshot of reviews)
-- =====================================================
CREATE TABLE IF NOT EXISTS weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  week_key text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_clerk_user_week ON weekly_reviews(clerk_user_id, week_key);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- RLS policies are defined in a separate file: rls_policies.sql
-- This allows for easier maintenance and iteration:
-- 
-- To apply RLS:
-- 1. Run this file (schema_mvp.sql) to create tables
-- 2. Run rls_policies.sql to enable RLS and create policies
--
-- Tables have RLS disabled by default (safe for testing)
-- You MUST run rls_policies.sql before deploying to production

-- Placeholder: RLS will be enabled in rls_policies.sql
-- (Skipping RLS setup here to avoid duplication)

-- =====================================================
-- VERIFY SETUP
-- =====================================================
-- Run these queries to verify everything is working:
-- SELECT * FROM users;
-- SELECT * FROM habits WHERE clerk_user_id = '<your-clerk-user-id>';
-- SELECT * FROM habit_completions WHERE clerk_user_id = '<your-clerk-user-id>';
-- SELECT * FROM habit_templates;

-- Simple query ideas:
-- 1) Completion rate for a week (given start_date/end_date):
-- select
--   hc.habit_id,
--   count(*) as completed_days,
--   (count(*)::float / :days_in_week) * 100 as pct
-- from habit_completions hc
-- where hc.clerk_user_id = :clerk_user_id
--   and hc.date between :start_date and :end_date
-- group by hc.habit_id
-- order by pct desc;

-- 2) Strongest habit this week (most completions)
-- select habit_id, count(*) as c
-- from habit_completions
-- where clerk_user_id = :clerk_user_id and date between :start_date and :end_date
-- group by habit_id order by c desc limit 1;

-- 3) Basic streak calculation idea (client-side recommended):
-- Because streak logic depends on grace-days and toggles, compute streaks on the client
-- using queries that pull a user's completions for a habit ordered by date.

-- Notes aligned with current frontend model:
-- 1) currentStreak and longestStreak are derived values in the app and should not be stored as source of truth.
-- 2) Weekly review is compute-only for MVP.
-- 3) The current Daily Task model is not date-scoped; completed is a single boolean state per task.
