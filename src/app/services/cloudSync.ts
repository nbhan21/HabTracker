import { supabase } from '../../lib/supabase';
import type { Book, DailyTask, Habit } from '../store/HabitContext';

export interface TrackerDataBundle {
  habits: Habit[];
  dailyTasks: DailyTask[];
  books: Book[];
}

const dedupeDates = (dates: string[]) => Array.from(new Set(dates)).sort();

export const pushLocalDataToCloud = async (userId: string, data: TrackerDataBundle) => {
  if (!supabase) throw new Error('Supabase not configured');

  const habitsPayload = data.habits.map((habit) => ({
    user_id: userId,
    legacy_local_id: habit.id,
    name: habit.name,
    category: habit.category ?? '',
    priority: habit.priority,
    frequency: habit.frequency,
  }));

  const { data: upsertedHabits, error: habitsError } = await supabase
    .from('habits')
    .upsert(habitsPayload, { onConflict: 'user_id,legacy_local_id' })
    .select('id, legacy_local_id');

  if (habitsError) throw habitsError;

  const habitIdByLocalId = new Map<string, string>();
  for (const row of upsertedHabits ?? []) {
    if (row.legacy_local_id) {
      habitIdByLocalId.set(row.legacy_local_id, row.id);
    }
  }

  const completionsPayload = data.habits.flatMap((habit) => {
    const cloudHabitId = habitIdByLocalId.get(habit.id);
    if (!cloudHabitId) return [];

    return dedupeDates(habit.completedDates).map((date) => ({
      user_id: userId,
      habit_id: cloudHabitId,
      date,
      source: 'local-migration',
    }));
  });

  if (completionsPayload.length > 0) {
    const { error: completionsError } = await supabase
      .from('habit_completions')
      .upsert(completionsPayload, { onConflict: 'user_id,habit_id,date' });

    if (completionsError) throw completionsError;
  }

  const tasksPayload = data.dailyTasks.map((task) => ({
    user_id: userId,
    legacy_local_id: task.id,
    name: task.name,
    completed: task.completed,
  }));

  if (tasksPayload.length > 0) {
    const { error: tasksError } = await supabase
      .from('daily_tasks')
      .upsert(tasksPayload, { onConflict: 'user_id,legacy_local_id' });
    if (tasksError) throw tasksError;
  }

  const booksPayload = data.books.map((book) => ({
    user_id: userId,
    legacy_local_id: book.id,
    title: book.title,
    current_page: book.currentPage,
    total_pages: book.totalPages,
  }));

  if (booksPayload.length > 0) {
    const { error: booksError } = await supabase
      .from('books')
      .upsert(booksPayload, { onConflict: 'user_id,legacy_local_id' });
    if (booksError) throw booksError;
  }
};

export const pullCloudDataToLocal = async (userId: string): Promise<TrackerDataBundle> => {
  if (!supabase) throw new Error('Supabase not configured');

  const [{ data: habitsRows, error: habitsError }, { data: completionsRows, error: completionsError }, { data: taskRows, error: tasksError }, { data: bookRows, error: booksError }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, legacy_local_id, name, category, priority, frequency')
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('habit_completions')
      .select('habit_id, date')
      .eq('user_id', userId),
    supabase
      .from('daily_tasks')
      .select('legacy_local_id, name, completed')
      .eq('user_id', userId),
    supabase
      .from('books')
      .select('legacy_local_id, title, current_page, total_pages')
      .eq('user_id', userId),
  ]);

  if (habitsError) throw habitsError;
  if (completionsError) throw completionsError;
  if (tasksError) throw tasksError;
  if (booksError) throw booksError;

  const completionDatesByHabitId = new Map<string, string[]>();
  for (const row of completionsRows ?? []) {
    const arr = completionDatesByHabitId.get(row.habit_id) ?? [];
    arr.push(row.date);
    completionDatesByHabitId.set(row.habit_id, arr);
  }

  const habits: Habit[] = (habitsRows ?? []).map((row) => ({
    id: row.legacy_local_id ?? row.id,
    name: row.name,
    category: row.category ?? '',
    priority: row.priority,
    frequency: row.frequency,
    completedDates: dedupeDates(completionDatesByHabitId.get(row.id) ?? []),
    currentStreak: 0,
    longestStreak: 0,
  }));

  const dailyTasks: DailyTask[] = (taskRows ?? []).map((row, idx) => ({
    id: row.legacy_local_id ?? `task-${idx}`,
    name: row.name,
    completed: row.completed,
  }));

  const books: Book[] = (bookRows ?? []).map((row, idx) => ({
    id: row.legacy_local_id ?? `book-${idx}`,
    title: row.title,
    currentPage: row.current_page,
    totalPages: row.total_pages,
  }));

  return { habits, dailyTasks, books };
};

export const resetCloudDataForUser = async (userId: string) => {
  if (!supabase) throw new Error('Supabase not configured');

  const deletions = await Promise.all([
    supabase.from('habit_completions').delete().eq('user_id', userId),
    supabase.from('habits').delete().eq('user_id', userId),
    supabase.from('daily_tasks').delete().eq('user_id', userId),
    supabase.from('books').delete().eq('user_id', userId),
    supabase.from('weekly_reviews').delete().eq('user_id', userId),
  ]);

  const firstError = deletions.map((item) => item.error).find(Boolean);
  if (firstError) throw firstError;
};
