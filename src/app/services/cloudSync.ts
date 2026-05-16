import type { Book, DailyTask, Habit } from '../store/HabitContext';

export interface TrackerDataBundle {
  habits: Habit[];
  dailyTasks: DailyTask[];
  books: Book[];
}

const callTrackerApi = async <T>(
  getToken: () => Promise<string | null>,
  mode: 'push' | 'pull' | 'reset',
  body?: Record<string, unknown>,
): Promise<T> => {
  const token = await getToken();

  if (!token) {
    throw new Error('Clerk session is not ready');
  }

  const response = await fetch(`/api/tracker?mode=${mode}`, {
    method: mode === 'pull' ? 'GET' : mode === 'reset' ? 'DELETE' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as { error?: string; data?: T } | null;

  if (!response.ok) {
    throw new Error(payload?.error || `Tracker request failed (${response.status})`);
  }

  return (payload?.data as T) ?? (undefined as T);
};

export const pushLocalDataToCloud = async (getToken: () => Promise<string | null>, data: TrackerDataBundle) => {
  await callTrackerApi<void>(getToken, 'push', { data });
};

export const pullCloudDataToLocal = async (getToken: () => Promise<string | null>): Promise<TrackerDataBundle> => {
  const payload = await callTrackerApi<TrackerDataBundle>(getToken, 'pull');
  return {
    habits: payload?.habits ?? [],
    dailyTasks: payload?.dailyTasks ?? [],
    books: payload?.books ?? [],
  };
};

export const resetCloudDataForUser = async (getToken: () => Promise<string | null>) => {
  await callTrackerApi<void>(getToken, 'reset');
};
