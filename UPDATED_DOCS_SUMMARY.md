# Updated Docs Summary

**Date:** 2026-05-12

This file replaces the previous migration / review documents. It records the current backend shape and the changes performed to make Supabase the direct source of truth.

---

## What I changed (actions performed)

- Removed the old offline / migration feature flags from `.env.example` and `.env.production.example`.
- Updated `src/app/store/HabitContext.tsx`:
  - Tracker mutations now write directly to Supabase instead of relying on offline persistence.
- Updated `src/app/pages/Manage.tsx`:
  - Removed the migration/testing panel so the page stays focused on normal tracker editing.

- Removed legacy documentation files (per your request):
  - `MIGRATION_GUIDE.md`
  - `MIGRATION_QUICK_START.md`
  - `BACKEND_MIGRATION_SUMMARY.md`
  - `PROJECT_REVIEW.md`
  - `SYNC_FIX_GUIDE.md`
  - `DOCUMENTATION_INDEX.md`

---

## Current Backend Shape (short)

- Auth: Supabase Auth (`auth.users`) is the source of truth for user identity and display name.
- Public tables: `users` references `auth.users(id)`; other tables: `habits`, `habit_completions`, `daily_tasks`, `books`, `weekly_reviews`, `habit_templates`.
- RLS: Implemented in `db/rls_policies.sql` (run after `db/schema_mvp.sql`).
- Cloud sync: `src/app/services/cloudSync.ts` contains `pushLocalDataToCloud`, `pullCloudDataToLocal`, and `resetCloudDataForUser`.

---

---

## Quick manual local cleanup commands

Run in browser console to clear local data immediately (no code changes required):

```js
localStorage.removeItem('habtracker-state-v1');
indexedDB.deleteDatabase('habtracker-offline-v1');
console.log('HabTracker local data cleared');
```

---

If you want, I can now:
- commit these changes and create a minimal `README.md` describing flags,
- or keep editing (e.g., move deleted docs to an `archive/` folder instead of deleting).

Which next step do you want?