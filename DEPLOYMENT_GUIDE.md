# HabTracker - Supabase Production Deployment Guide

## Overview
Current state: **Frontend ready (Vite), Clerk auth integrated, and Supabase is the database/write backend.**

This guide shows the exact steps to deploy HabTracker with Clerk + Supabase.

---

## Phase 1: Setup Supabase Project (One-time)

### Step 1: Create Supabase Project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Project name**: `habtracker-prod` (or any name)
   - **Database password**: Create strong password (save securely)
   - **Region**: Choose closest to your users
4. Wait ~2 minutes for project initialization
5. Copy credentials (you'll need these in Step 2)

### Step 2: Get Required Credentials
You need values from two places:

In Clerk dashboard:
- Copy **Publishable Key** → `VITE_CLERK_PUBLISHABLE_KEY`
- Copy **Secret Key** → `CLERK_SECRET_KEY`

In Supabase dashboard → **Settings** → **API**:
- Copy **Project URL** → `SUPABASE_URL`
- Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 2: Deploy Database Schema

### Step 3: Execute Schema in Supabase SQL Editor
1. In Supabase dashboard → **SQL Editor** (left sidebar)
2. Click **"New query"** button
3. Open file: `db/schema_mvp.sql`
4. Copy entire content and paste into SQL editor
5. Click **"Run"** (or Ctrl+Enter)
6. Wait for success confirmation (should see tables created: users, habits, habit_completions, etc.)

### Step 4: Execute RLS Policies
1. In SQL Editor → **New query** again
2. Open file: `db/rls_policies.sql`
3. Copy entire content and paste into SQL editor
4. Click **"Run"**
5. Wait for success (should see RLS enabled and policies created)

**Verification:**
In Supabase dashboard → **Table Editor**:
- [ ] See tables: users, habits, habit_completions, daily_tasks, books, weekly_reviews, habit_templates
- [ ] habit_templates has 4 rows (Morning Routine, Deep Work, Reading, Evening Reflection)
- [ ] Click each table → **RLS** column shows "🔒 Enabled" (green lock)

---

## Phase 3: Setup Environment Variables

### Step 5: Create Production Environment File
In project root, create `.env.production`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_...
```

**Important:**
- The frontend only needs `VITE_CLERK_PUBLISHABLE_KEY`.
- The backend write API needs `CLERK_SECRET_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.

---

## Phase 4: Build & Deploy Frontend

### Step 6: Build Production Bundle
```bash
npm run build
```
Output: `dist/` folder with minified HTML/CSS/JS

### Step 7: Deploy to Hosting
Choose one option:

**Option A: Vercel (Recommended)**
1. Push code to GitHub
2. Go to [https://vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your HabTracker GitHub repo
5. Configure Environment Variables:
   - Add `VITE_CLERK_PUBLISHABLE_KEY`
   - Add `CLERK_SECRET_KEY`
   - Add `SUPABASE_URL`
   - Add `SUPABASE_SERVICE_ROLE_KEY`
6. Click "Deploy"
7. Get URL: `https://habtracker-xxxxx.vercel.app`

**Option B: Netlify**
1. Push code to GitHub
2. Go to [https://netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select repo
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add Environment Variables (same as Vercel)
7. Deploy

**Option C: Self-host on own server**
1. Build: `npm run build`
2. Copy `dist/` folder to server
3. Serve with nginx/Apache:
   ```nginx
   location / {
     root /var/www/habtracker/dist;
     try_files $uri /index.html;
   }
   ```

---

## Phase 5: Verify Production Setup

### Step 8: Test Production Environment

1. **Open your deployed URL** in browser
2. **Test signup** with new email:
   - Click "Sign Up"
   - Enter email + password
3. **Test habit creation**:
   - Create new habit
   - Check today's date
   - Verify in Supabase → Table Editor → habits table (habit appears with your clerk_user_id)
4. **Test data isolation**:
   - Login as different user
   - Verify you don't see first user's habits
5. **Test analytics**:
   - Heatmap should show correct dates
   - Streaks should calculate properly

### Step 9: Monitor & Backup

1. **Supabase Dashboard → Logs** - Check for errors
2. **Database backups** - Supabase auto-backs up daily (free tier)
3. **For production**, enable:
   - Supabase dashboard → **Settings** → **Backups** → Enable Point-in-Time Recovery (paid)

---

## Rollback Plan

If something breaks in production:

1. **Quick fix (code issue)**:
   - Fix code locally
   - Re-run `npm run build`
   - Re-deploy frontend (Vercel/Netlify auto-redeploy)

2. **Database corruption**:
   - Supabase dashboard → **Backups** → Restore from previous backup
   - Re-execute `db/rls_policies.sql` if needed

3. **Security breach**:
   - Rotate `CLERK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
   - Update keys in all deployed environments
   - Force users to re-login (invalidate old tokens)

---

## Deployment Checklist

```
Pre-Deployment:
☐ Code committed to git
☐ npm run build succeeds (no errors)
☐ .env.production created with correct keys

Database:
☐ Supabase project created
☐ schema_mvp.sql executed successfully
☐ rls_policies.sql executed successfully
☐ Verify 7 tables exist + habit_templates populated
☐ Verify RLS enabled on template table and backend can write with service role

Frontend:
☐ Frontend deployed to Vercel/Netlify/own host
☐ VITE_CLERK_PUBLISHABLE_KEY set in hosting environment

Testing:
☐ Access deployed URL in browser
☐ Signup with test email
☐ Create habit
☐ Verify in Supabase dashboard (habit appears)
☐ Test as second user (verify isolation)
☐ Test heatmap dates are correct
☐ Test streak calculations

Go Live:
☐ Share URL with beta users
☐ Monitor Supabase logs for errors
```

---

## FAQ

**Q: Can I use the same Supabase project for development and production?**  
A: Not recommended. Create separate projects:
- `habtracker-dev` (development)
- `habtracker-prod` (production)
Each has its own database, auth users, and credentials.

**Q: How do I backup user data before deploying?**  
A: Supabase automatically backs up. For manual backup:
1. Supabase dashboard → **Backups** → **Download**
2. Or export via SQL: `pg_dump` command (advanced)

**Q: Can I revert to development after production deploy?**  
A: Yes. Keep `.env.local` for dev and `.env.production` for prod. Run `npm run build` with right env set. Frontend + backend are fully decoupled.

---

## Next Steps

1. Create Supabase project (if not already done)
2. Get credentials and save securely
3. Execute SQL files (2 queries, ~30 seconds total)
4. Update environment variables
5. Build & deploy frontend
6. Test production environment
7. Monitor for issues

Total time: ~15-30 minutes to full production deployment! 🚀

---

## Automation scripts (optional)

Saya menambahkan dua skrip verifikasi dan satu template env di `scripts/` dan root:

- `scripts/verify_db.sh` : Bash script yang menjalankan `db/schema_mvp.sql` lalu `db/rls_policies.sql` dan menjalankan query verifikasi.
- `scripts/verify_db.ps1` : PowerShell versi yang sama untuk Windows.
- `.env.production.example` : Template file environment untuk deployment.

Cara pakai (contoh):

Linux / macOS (bash):
```bash
DATABASE_URL="postgresql://<user>:<pass>@<host>:5432/<db>" ./scripts/verify_db.sh
```

Windows PowerShell:
```powershell
# $env:DATABASE_URL = "postgresql://<user>:<pass>@<host>:5432/<db>"
# .\scripts\verify_db.ps1 -DatabaseUrl $env:DATABASE_URL
```

Catatan:
- Jangan commit kredensial nyata ke repo. Copy `.env.production.example` menjadi `.env.production` pada CI / hosting dan isi nilai rahasia di dashboard (Vercel/Netlify).
- Skrip memanggil `psql` CLI; pastikan `psql` tersedia di PATH pada mesin yang menjalankan skrip.

Jika kamu mau, saya bisa menambahkan langkah GitHub Actions yang otomatis build + deploy ke Vercel atau Netlify setelah push ke `main`.
