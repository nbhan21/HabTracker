import React, { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { pushLocalDataToCloud } from '../services/cloudSync';

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
  const { isConfigured, user, getToken } = useAuth();
  const [habits, setHabits] = useState<Habit[]>(initialHabits.map(normalizeHabit));
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(initialDailyTasks);
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const syncStateRef = useRef<{
    inFlight: boolean;
    pending: { habits: Habit[]; dailyTasks: DailyTask[]; books: Book[] } | null;
  }>({ inFlight: false, pending: null });

  const processSyncQueue = useCallback(async () => {
    if (syncStateRef.current.inFlight) return;

    syncStateRef.current.inFlight = true;
    try {
      while (syncStateRef.current.pending) {
        const snapshot = syncStateRef.current.pending;
        syncStateRef.current.pending = null;
        await pushLocalDataToCloud(getToken, snapshot);
      }
    } catch (error) {
      console.error('cloud sync error:', error);
    } finally {
      syncStateRef.current.inFlight = false;
    }
  }, [getToken]);

  const syncCloudState = useCallback(
    (nextHabits: Habit[], nextDailyTasks: DailyTask[], nextBooks: Book[]) => {
      if (!isConfigured || !user) return;

      syncStateRef.current.pending = {
        habits: nextHabits,
        dailyTasks: nextDailyTasks,
        books: nextBooks,
      };

      void processSyncQueue();
    },
    [isConfigured, user, processSyncQueue],
  );

  const toggleHabit = (id: string, date: string) => {
    setHabits((prev) => {
      const nextHabit = prev.find((habit) => habit.id === id);
      const next = prev.map((habit) => {
        if (habit.id !== id) return habit;

        const hasCompleted = habit.completedDates.includes(date);
        const nextDates = hasCompleted
          ? habit.completedDates.filter((item) => item !== date)
          : [...habit.completedDates, date];
        return normalizeHabit({ ...habit, completedDates: nextDates });
      });

      if (nextHabit) {
        syncCloudState(next, dailyTasks, books);
      }

      return next;
    });
  };

  const toggleDailyTask = (id: string) => {
    setDailyTasks((prev) => {
      const next = prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));
      syncCloudState(habits, next, books);

      return next;
    });
  };

  const addHabit = (habit: Omit<Habit, 'id' | 'completedDates' | 'longestStreak' | 'currentStreak'>) => {
    const newHabit = normalizeHabit({
      ...habit,
      id: Math.random().toString(),
      completedDates: [],
      longestStreak: 0,
      currentStreak: 0,
    });
    setHabits((prev) => {
      const next = [...prev, newHabit];
      syncCloudState(next, dailyTasks, books);
      return next;
    });
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
    setHabits((prev) => {
      const next = prev.filter((habit) => habit.id !== id);
      syncCloudState(next, dailyTasks, books);
      return next;
    });
  };

  const addDailyTask = (taskName: string) => {
    const newTask = { id: Math.random().toString(), name: taskName, completed: false };
    setDailyTasks((prev) => {
      const next = [...prev, newTask];
      syncCloudState(habits, next, books);
      return next;
    });
  };

  const deleteDailyTask = (id: string) => {
    setDailyTasks((prev) => {
      const next = prev.filter((task) => task.id !== id);
      syncCloudState(habits, next, books);
      return next;
    });
  };

  const updateBookProgress = (id: string, currentPage: number) => {
    setBooks((prev) => {
      const next = prev.map((book) => (book.id === id ? { ...book, currentPage } : book));
      syncCloudState(habits, dailyTasks, next);

      return next;
    });
  };

  const addBook = (book: Omit<Book, 'id'>) => {
    const newBook = { ...book, id: Math.random().toString() };
    setBooks((prev) => {
      const next = [...prev, newBook];
      syncCloudState(habits, dailyTasks, next);
      return next;
    });
  };

  const deleteBook = (id: string) => {
    setBooks((prev) => {
      const next = prev.filter((book) => book.id !== id);
      syncCloudState(habits, dailyTasks, next);
      return next;
    });
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