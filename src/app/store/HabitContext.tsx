import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { loadOfflineSnapshot, saveOfflineSnapshot } from '../services/offlineStore';

const ENABLE_OFFLINE = import.meta.env.VITE_ENABLE_OFFLINE === 'true';

export type Priority = 'Low' | 'Medium' | 'High';

export interface Habit {
  id: string;
  name: string;
  category: string;
  priority: Priority;
  frequency: string;
  completedDates: string[]; // YYYY-MM-DD
  longestStreak: number;
  currentStreak: number;
}

export interface HabitTemplate {
  id: string;
  name: string;
  category: string;
  priority: Priority;
  frequency: string;
  description: string;
}

export interface DailyTask {
  id: string;
  name: string;
  completed: boolean;
}

export interface Book {
  id: string;
  title: string;
  currentPage: number;
  totalPages: number;
}

interface HabitContextType {
  habits: Habit[];
  dailyTasks: DailyTask[];
  books: Book[];
  habitTemplates: HabitTemplate[];
  replaceState: (data: { habits: Habit[]; dailyTasks: DailyTask[]; books: Book[] }) => void;
  toggleHabit: (id: string, date: string) => void;
  toggleDailyTask: (id: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'completedDates' | 'longestStreak' | 'currentStreak'>) => void;
  addHabitFromTemplate: (templateId: string) => void;
  deleteHabit: (id: string) => void;
  addDailyTask: (taskName: string) => void;
  deleteDailyTask: (id: string) => void;
  updateBookProgress: (id: string, currentPage: number) => void;
  addBook: (book: Omit<Book, 'id'>) => void;
  deleteBook: (id: string) => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);
const STORAGE_KEY = 'habtracker-state-v1';
const WEEKLY_GRACE_DAYS = 1;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getIsoWeekKey = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);

  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);

  const weekNumber = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return `${d.getUTCFullYear()}-W${weekNumber}`;
};

const calculateCurrentStreakWithGrace = (completedDates: string[], graceDaysPerWeek: number) => {
  if (completedDates.length === 0) return 0;

  const completedSet = new Set(completedDates);
  const today = new Date();
  const todayKey = toDateKey(today);

  // For current streak, today must have a completion; otherwise streak is 0
  if (!completedSet.has(todayKey)) return 0;

  const usedGraceByWeek = new Map<string, number>();
  let cursor = new Date(today);
  let streak = 0;
  let lastCompletionDay = 0; // Track how many days back we found the last actual completion

  for (let i = 0; i < 3650; i++) {
    const key = toDateKey(cursor);
    if (completedSet.has(key)) {
      streak += 1;
      lastCompletionDay = i;
    } else {
      const weekKey = getIsoWeekKey(cursor);
      const usedGrace = usedGraceByWeek.get(weekKey) ?? 0;
      // Only allow grace days if we have at least one actual completion before this gap
      if (usedGrace < graceDaysPerWeek && lastCompletionDay > 0) {
        usedGraceByWeek.set(weekKey, usedGrace + 1);
        streak += 1;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const calculateLongestStreakWithGrace = (completedDates: string[], graceDaysPerWeek: number) => {
  if (completedDates.length === 0) return 0;

  const completedSet = new Set(completedDates);
  const sortedDates = [...completedDates].sort();
  const startDate = new Date(sortedDates[0]);
  const endDate = new Date();

  let longest = 0;
  let current = 0;
  const usedGraceByWeek = new Map<string, number>();
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const key = toDateKey(cursor);
    if (completedSet.has(key)) {
      current += 1;
    } else {
      const weekKey = getIsoWeekKey(cursor);
      const usedGrace = usedGraceByWeek.get(weekKey) ?? 0;
      if (usedGrace < graceDaysPerWeek) {
        usedGraceByWeek.set(weekKey, usedGrace + 1);
        current += 1;
      } else {
        longest = Math.max(longest, current);
        current = 0;
        usedGraceByWeek.clear();
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return Math.max(longest, current);
};

const normalizeHabit = (habit: Habit): Habit => {
  const uniqueDates = Array.from(new Set(habit.completedDates)).sort();
  return {
    ...habit,
    completedDates: uniqueDates,
    currentStreak: calculateCurrentStreakWithGrace(uniqueDates, WEEKLY_GRACE_DAYS),
    longestStreak: calculateLongestStreakWithGrace(uniqueDates, WEEKLY_GRACE_DAYS),
  };
};

const initialHabits: Habit[] = [];

const habitTemplates: HabitTemplate[] = [
  {
    id: 'tpl-morning-routine',
    name: 'Morning Routine 20m',
    category: 'Health',
    priority: 'Medium',
    frequency: 'Daily',
    description: 'Wake up, hydrate, and do a short mobility routine.',
  },
  {
    id: 'tpl-deep-work',
    name: 'Deep Work 90m',
    category: 'Work',
    priority: 'High',
    frequency: 'Daily',
    description: 'One focused block without notifications or meetings.',
  },
  {
    id: 'tpl-reading',
    name: 'Reading 20 Pages',
    category: 'Learning',
    priority: 'Low',
    frequency: 'Daily',
    description: 'Read non-fiction or technical material for steady growth.',
  },
  {
    id: 'tpl-reflection',
    name: 'Evening Reflection',
    category: 'Mindset',
    priority: 'Low',
    frequency: 'Daily',
    description: 'Journal 3 wins and 1 lesson from your day.',
  },
];

const initialDailyTasks: DailyTask[] = [];

const initialBooks: Book[] = [];

export const HabitProvider = ({ children }: { children: ReactNode }) => {
  const [hydrated, setHydrated] = useState(false);

  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window === 'undefined') return initialHabits.map(normalizeHabit);
    if (!ENABLE_OFFLINE) return initialHabits.map(normalizeHabit);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialHabits.map(normalizeHabit);

    try {
      const parsed = JSON.parse(raw) as { habits?: Habit[] };
      return (parsed.habits ?? initialHabits).map(normalizeHabit);
    } catch {
      return initialHabits.map(normalizeHabit);
    }
  });

  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    if (typeof window === 'undefined') return initialDailyTasks;
    if (!ENABLE_OFFLINE) return initialDailyTasks;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDailyTasks;

    try {
      const parsed = JSON.parse(raw) as { dailyTasks?: DailyTask[] };
      return parsed.dailyTasks ?? initialDailyTasks;
    } catch {
      return initialDailyTasks;
    }
  });

  const [books, setBooks] = useState<Book[]>(() => {
    if (typeof window === 'undefined') return initialBooks;
    if (!ENABLE_OFFLINE) return initialBooks;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialBooks;

    try {
      const parsed = JSON.parse(raw) as { books?: Book[] };
      return parsed.books ?? initialBooks;
    } catch {
      return initialBooks;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!ENABLE_OFFLINE) {
      setHydrated(true);
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setHydrated(true);
      return;
    }

    const hydrateFromIndexedDb = async () => {
      try {
        const snapshot = await loadOfflineSnapshot();
        if (snapshot) {
          setHabits(snapshot.habits.map(normalizeHabit));
          setDailyTasks(snapshot.dailyTasks);
          setBooks(snapshot.books);
        }
      } catch (err) {
        console.error('Failed to hydrate from IndexedDB snapshot:', err);
      } finally {
        setHydrated(true);
      }
    };

    hydrateFromIndexedDb();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydrated) return;
    if (!ENABLE_OFFLINE) return;

    const snapshot = { habits, dailyTasks, books };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));

    saveOfflineSnapshot({
      ...snapshot,
      updatedAt: new Date().toISOString(),
    }).catch((err) => {
      console.error('Failed to persist IndexedDB snapshot:', err);
    });
  }, [habits, dailyTasks, books, hydrated]);

  const toggleHabit = (id: string, date: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        const hasCompleted = habit.completedDates.includes(date);
        const newDates = hasCompleted 
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date];
        return normalizeHabit({ ...habit, completedDates: newDates });
      }
      return habit;
    }));
  };

  const toggleDailyTask = (id: string) => {
    setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addHabit = (habit: Omit<Habit, 'id' | 'completedDates' | 'longestStreak' | 'currentStreak'>) => {
    const newHabit = normalizeHabit({
      ...habit,
      id: Math.random().toString(),
      completedDates: [],
      longestStreak: 0,
      currentStreak: 0,
    });
    setHabits(prev => [...prev, newHabit]);
  };

  const addHabitFromTemplate = (templateId: string) => {
    const template = habitTemplates.find(item => item.id === templateId);
    if (!template) return;
    addHabit({
      name: template.name,
      category: template.category,
      priority: template.priority,
      frequency: template.frequency,
    });
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const addDailyTask = (taskName: string) => {
    setDailyTasks(prev => [...prev, { id: Math.random().toString(), name: taskName, completed: false }]);
  };

  const deleteDailyTask = (id: string) => {
    setDailyTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateBookProgress = (id: string, currentPage: number) => {
    setBooks(books.map(b => b.id === id ? { ...b, currentPage } : b));
  };

  const addBook = (book: Omit<Book, 'id'>) => {
    setBooks(prev => [...prev, { ...book, id: Math.random().toString() }]);
  };

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  const replaceState = useCallback((data: { habits: Habit[]; dailyTasks: DailyTask[]; books: Book[] }) => {
    setHabits(data.habits.map(normalizeHabit));
    setDailyTasks(data.dailyTasks);
    setBooks(data.books);
  }, []);

  return (
    <HabitContext.Provider value={{ 
      habits, dailyTasks, books, 
      habitTemplates,
      replaceState,
      toggleHabit, toggleDailyTask, 
      addHabit, deleteHabit, 
      addHabitFromTemplate,
      addDailyTask, deleteDailyTask,
      updateBookProgress, addBook, deleteBook
    }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within HabitProvider');
  return context;
};