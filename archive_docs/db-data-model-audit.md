# Data Model Audit (Current App -> Supabase MVP)

Date: 2026-05-06

## 1) Source of Truth in Current App

- Runtime source of truth is `src/app/store/HabitContext.tsx`.
- Persistent storage is browser `localStorage` with key `habtracker-state-v1`.
- Stored JSON shape today:

```json
{
  "habits": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "priority": "Low|Medium|High",
      "frequency": "Daily|Weekly",
      "completedDates": ["YYYY-MM-DD"],
      "longestStreak": 0,
      "currentStreak": 0
    }
  ],
  "dailyTasks": [
    {
      "id": "string",
      "name": "string",
      "completed": false
    }
  ],
  "books": [
    {
      "id": "string",
      "title": "string",
      "currentPage": 0,
      "totalPages": 1
    }
  ]
}
```

## 2) Derived vs Stored Data

- `currentStreak` and `longestStreak` are derived by `normalizeHabit()`.
- They are recomputed from `completedDates` with grace rule (`WEEKLY_GRACE_DAYS = 1`).
- For backend truth, keep `habit_completions` as canonical data and recompute streaks in app/service.

## 3) Functional Data Behavior

- Toggle habit completion adds/removes one `YYYY-MM-DD` date in `completedDates`.
- Duplicate dates are cleaned by `normalizeHabit` (`Set` + sort).
- Daily task completion is global boolean (not date-scoped yet).
- Weekly review in Analytics is compute-only from `habits.completedDates`.

## 4) Mapping to Postgres Tables

- `habits[]` -> `habits`
- `habits[].completedDates[]` -> `habit_completions` (one row per habit/date)
- `dailyTasks[]` -> `daily_tasks`
- `books[]` -> `books`
- `habitTemplates[]` -> `habit_templates` (seed/global table)

## 5) Alignment Decisions Already Applied in `schema_mvp.sql`

- Date-only completion model (`habit_completions.date` as `date`).
- Priority constraint: `Low|Medium|High`.
- Frequency constraint: `Daily|Weekly`.
- Added `legacy_local_id` in `habits`, `daily_tasks`, `books` to ease migration from localStorage ids.
- Enforced basic data integrity checks (`name`/`title` non-empty, page bounds).

## 6) Gaps / Risks to Decide Before Full Sync

- Daily tasks are not date-based. If you want true daily history, add `daily_task_completions (task_id, date)`.
- No reminders/time-of-day model yet.
- Current app uses random string ids (`Math.random().toString()`), so migration must map IDs safely.

## 7) Minimum Migration Strategy

1. User login success.
2. Read localStorage JSON.
3. Upsert `habits` using `legacy_local_id`.
4. Upsert `habit_completions` from each `completedDates` item (`on conflict (user_id, habit_id, date)`).
5. Upsert `daily_tasks` and `books` via `legacy_local_id`.
6. Mark migration complete in local flag and keep local cache for offline read.