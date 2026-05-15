# Updated Docs Summary

**Date:** 2026-05-12

This file replaces the previous migration / review documents. It records the current backend shape and the changes performed to disable offline/migration features.

---

## What I changed (actions performed)

- Added environment feature flags in `.env.example`:
  - `VITE_ENABLE_OFFLINE` (default `false`)
  - `VITE_ENABLE_SYNC_TOOLS` (default `false`)
  - `VITE_ALLOW_LOCAL_MIGRATION` (default `false`)

- Updated `src/app/store/HabitContext.tsx`:
  - Offline persistence (localStorage + IndexedDB snapshot) is now gated by `VITE_ENABLE_OFFLINE`.
  - When offline is disabled the app will use in-memory initial data only and will not read/write to localStorage or IndexedDB.

- Updated `src/app/pages/Manage.tsx`:
  - Guarded `Push Local to Cloud`, `Import JSON`, and cloud-reset (`Fresh Start`) actions with `VITE_ALLOW_LOCAL_MIGRATION` so migrations do not run unless explicitly enabled.
  - `Sync & Backup` UI remains hidden unless `VITE_ENABLE_SYNC_TOOLS` is enabled (or in dev).

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

## How to re-enable offline or migrations (if needed)

1. Set environment variables in your `.env` (or CI):

```
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_SYNC_TOOLS=true
VITE_ALLOW_LOCAL_MIGRATION=true
```

2. Rebuild the app (Vite) and redeploy.

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