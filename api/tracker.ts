import { createClient } from '@supabase/supabase-js';
import { createClerkClient, verifyToken } from '@clerk/backend';

declare const process: {
  env: Record<string, string | undefined>;
};

const getConfig = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!clerkSecretKey) missing.push('CLERK_SECRET_KEY');

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    clerkSecretKey,
    missing,
    isConfigured: missing.length === 0,
  };
};

const createSupabaseAdmin = (supabaseUrl: string, supabaseServiceRoleKey: string) => {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const json = (res: any, statusCode: number, data: unknown) => {
  res.status(statusCode).json(data);
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as { message?: string; code?: string; details?: string; hint?: string };
    return {
      message: err.message || 'Unexpected tracker API error',
      code: err.code,
      details: err.details,
      hint: err.hint,
    };
  }

  return { message: 'Unexpected tracker API error' };
};

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  return authorizationHeader.slice('Bearer '.length).trim() || null;
};

const getClerkUserId = async (req: any, clerkSecretKey: string) => {
  const token = getBearerToken(req.headers?.authorization);
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const payload = await verifyToken(token, { secretKey: clerkSecretKey });
  const userId = payload?.sub;

  if (!userId) {
    throw new Error('Invalid Clerk session token');
  }

  return userId;
};

const getClerkUserProfile = async (clerkUserId: string, clerkSecretKey: string) => {
  const clerk = createClerkClient({ secretKey: clerkSecretKey });
  const user = await clerk.users.getUser(clerkUserId);
  const primaryEmailId = user.primaryEmailAddressId;
  const email =
    user.emailAddresses.find((item) => item.id === primaryEmailId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    '';

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username ||
    '';

  if (!email) {
    throw new Error('Clerk user email is missing');
  }

  return { email, displayName };
};

const ensureUserRow = async (
  supabase: ReturnType<typeof createClient>,
  clerkUserId: string,
  clerkSecretKey: string,
) => {
  const { email, displayName } = await getClerkUserProfile(clerkUserId, clerkSecretKey);
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        clerk_user_id: clerkUserId,
        email,
        display_name: displayName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_user_id' },
    );

  if (error) {
    throw error;
  }
};

const toText = (value: unknown) => (typeof value === 'string' ? value : '');

const toLegacyId = (value: unknown) => {
  const text = toText(value).trim();
  return text.length > 0 ? text : null;
};

const dedupeByLegacyId = <T extends { legacy_local_id: string | null }>(rows: T[]) => {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const row of rows) {
    if (!row.legacy_local_id) {
      unique.push(row);
      continue;
    }

    if (seen.has(row.legacy_local_id)) {
      continue;
    }

    seen.add(row.legacy_local_id);
    unique.push(row);
  }

  return unique;
};

const normalizeDates = (dates: string[]) => Array.from(new Set(dates)).sort();

const mapPullResponse = (habitsRows: any[], completionsRows: any[], taskRows: any[], bookRows: any[]) => {
  const completionDatesByHabitId = new Map<string, string[]>();

  for (const row of completionsRows) {
    const currentDates = completionDatesByHabitId.get(row.habit_id) ?? [];
    currentDates.push(row.date);
    completionDatesByHabitId.set(row.habit_id, currentDates);
  }

  return {
    habits: habitsRows.map((row) => ({
      id: row.legacy_local_id ?? row.id,
      name: row.name,
      category: row.category ?? '',
      priority: row.priority,
      frequency: row.frequency,
      completedDates: normalizeDates(completionDatesByHabitId.get(row.id) ?? []),
      currentStreak: 0,
      longestStreak: 0,
    })),
    dailyTasks: taskRows.map((row, index) => ({
      id: row.legacy_local_id ?? `task-${index}`,
      name: row.name,
      completed: row.completed,
    })),
    books: bookRows.map((row, index) => ({
      id: row.legacy_local_id ?? `book-${index}`,
      title: row.title,
      currentPage: row.current_page,
      totalPages: row.total_pages,
    })),
  };
};

const handlePull = async (
  req: any,
  res: any,
  clerkUserId: string,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
) => {
  const supabase = createSupabaseAdmin(supabaseUrl, supabaseServiceRoleKey);

  const [{ data: habitsRows, error: habitsError }, { data: completionsRows, error: completionsError }, { data: taskRows, error: tasksError }, { data: bookRows, error: booksError }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, legacy_local_id, name, category, priority, frequency')
      .eq('clerk_user_id', clerkUserId)
      .is('deleted_at', null),
    supabase
      .from('habit_completions')
      .select('habit_id, date')
      .eq('clerk_user_id', clerkUserId),
    supabase
      .from('daily_tasks')
      .select('legacy_local_id, name, completed')
      .eq('clerk_user_id', clerkUserId),
    supabase
      .from('books')
      .select('legacy_local_id, title, current_page, total_pages')
      .eq('clerk_user_id', clerkUserId),
  ]);

  if (habitsError || completionsError || tasksError || booksError) {
    throw habitsError ?? completionsError ?? tasksError ?? booksError;
  }

  json(res, 200, { data: mapPullResponse(habitsRows ?? [], completionsRows ?? [], taskRows ?? [], bookRows ?? []) });
};

const handlePush = async (
  req: any,
  res: any,
  clerkUserId: string,
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  clerkSecretKey: string,
) => {
  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const data = payload?.data;

  if (!data || !Array.isArray(data.habits) || !Array.isArray(data.dailyTasks) || !Array.isArray(data.books)) {
    json(res, 400, { error: 'Invalid tracker payload' });
    return;
  }

  const supabase = createSupabaseAdmin(supabaseUrl, supabaseServiceRoleKey);
  await ensureUserRow(supabase, clerkUserId, clerkSecretKey);

  const deletions = await Promise.all([
    supabase.from('habit_completions').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('habits').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('daily_tasks').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('books').delete().eq('clerk_user_id', clerkUserId),
  ]);

  const deletionError = deletions.map((item) => item.error).find(Boolean);
  if (deletionError) {
    throw deletionError;
  }

  const habitsPayload = dedupeByLegacyId(data.habits.map((habit: any) => ({
    clerk_user_id: clerkUserId,
    legacy_local_id: toLegacyId(habit.id),
    name: toText(habit.name),
    category: toText(habit.category),
    priority: habit.priority ?? 'Medium',
    frequency: habit.frequency ?? 'Daily',
  })));

  const { data: insertedHabits, error: habitsError } = habitsPayload.length > 0
    ? await supabase
        .from('habits')
        .upsert(habitsPayload, { onConflict: 'clerk_user_id,legacy_local_id' })
        .select('id, legacy_local_id')
    : { data: [], error: null };

  if (habitsError) {
    throw habitsError;
  }

  const habitIdByLocalId = new Map<string, string>();
  for (const row of insertedHabits ?? []) {
    if (row.legacy_local_id) {
      habitIdByLocalId.set(row.legacy_local_id, row.id);
    }
  }

  const completionsPayload = data.habits.flatMap((habit: any) => {
    const cloudHabitId = habitIdByLocalId.get(toText(habit.id));
    if (!cloudHabitId) return [];

    const completedDates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
    return normalizeDates(completedDates).map((date) => ({
      clerk_user_id: clerkUserId,
      habit_id: cloudHabitId,
      date,
      source: 'clerk-sync',
    }));
  });

  if (completionsPayload.length > 0) {
    const { error: completionsError } = await supabase
      .from('habit_completions')
      .upsert(completionsPayload, {
        onConflict: 'clerk_user_id,habit_id,date',
        ignoreDuplicates: true,
      });
    if (completionsError) {
      throw completionsError;
    }
  }

  const tasksPayload = dedupeByLegacyId(data.dailyTasks.map((task: any) => ({
    clerk_user_id: clerkUserId,
    legacy_local_id: toLegacyId(task.id),
    name: toText(task.name),
    completed: Boolean(task.completed),
  })));

  if (tasksPayload.length > 0) {
    const { error: tasksError } = await supabase
      .from('daily_tasks')
      .upsert(tasksPayload, { onConflict: 'clerk_user_id,legacy_local_id' });
    if (tasksError) {
      throw tasksError;
    }
  }

  const booksPayload = dedupeByLegacyId(data.books.map((book: any) => ({
    clerk_user_id: clerkUserId,
    legacy_local_id: toLegacyId(book.id),
    title: toText(book.title),
    current_page: Number.isFinite(book.currentPage) ? book.currentPage : 0,
    total_pages: Number.isFinite(book.totalPages) ? book.totalPages : 1,
  })));

  if (booksPayload.length > 0) {
    const { error: booksError } = await supabase
      .from('books')
      .upsert(booksPayload, { onConflict: 'clerk_user_id,legacy_local_id' });
    if (booksError) {
      throw booksError;
    }
  }

  json(res, 200, { data: { ok: true } });
};

const handleReset = async (res: any, clerkUserId: string, supabaseUrl: string, supabaseServiceRoleKey: string) => {
  const supabase = createSupabaseAdmin(supabaseUrl, supabaseServiceRoleKey);

  const deletions = await Promise.all([
    supabase.from('habit_completions').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('habits').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('daily_tasks').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('books').delete().eq('clerk_user_id', clerkUserId),
    supabase.from('weekly_reviews').delete().eq('clerk_user_id', clerkUserId),
  ]);

  const deletionError = deletions.map((item) => item.error).find(Boolean);
  if (deletionError) {
    throw deletionError;
  }

  json(res, 200, { data: { ok: true } });
};

export default async function handler(req: any, res: any) {
  const { supabaseUrl, supabaseServiceRoleKey, clerkSecretKey, isConfigured, missing } = getConfig();

  if (!isConfigured || !supabaseUrl || !supabaseServiceRoleKey || !clerkSecretKey) {
    json(res, 500, { error: 'Tracker API is not configured', missing });
    return;
  }

  try {
    const clerkUserId = await getClerkUserId(req, clerkSecretKey);
    const mode = toText(req.query?.mode) || 'pull';

    if (req.method === 'GET' && mode === 'pull') {
      await handlePull(req, res, clerkUserId, supabaseUrl, supabaseServiceRoleKey);
      return;
    }

    if (req.method === 'POST' && mode === 'push') {
      await handlePush(req, res, clerkUserId, supabaseUrl, supabaseServiceRoleKey, clerkSecretKey);
      return;
    }

    if (req.method === 'DELETE' && mode === 'reset') {
      await handleReset(res, clerkUserId, supabaseUrl, supabaseServiceRoleKey);
      return;
    }

    json(res, 405, { error: 'Unsupported tracker operation' });
  } catch (error) {
    const { message, code, details, hint } = formatError(error);
    const isAuthError = /token|authorization|session/i.test(message);
    const status = isAuthError ? 401 : 500;

    if (!isAuthError) {
      console.error('Tracker API error:', error);
    }

    const payload: Record<string, unknown> = { error: message };
    if (!isAuthError) {
      if (code) payload.code = code;
      if (details) payload.details = details;
      if (hint) payload.hint = hint;
    }

    json(res, status, payload);
  }
}