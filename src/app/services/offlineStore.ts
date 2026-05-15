import type { Book, DailyTask, Habit } from '../store/HabitContext';

const DB_NAME = 'habtracker-offline-v1';
const STORE_NAME = 'kv';
const SNAPSHOT_KEY = 'tracker-snapshot';

interface KVRow {
  key: string;
  value: unknown;
}

export interface OfflineSnapshot {
  habits: Habit[];
  dailyTasks: DailyTask[];
  books: Book[];
  updatedAt: string;
}

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const txDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

export const saveOfflineSnapshot = async (snapshot: OfflineSnapshot) => {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const row: KVRow = { key: SNAPSHOT_KEY, value: snapshot };
    store.put(row);
    await txDone(tx);
  } finally {
    db.close();
  }
};

export const loadOfflineSnapshot = async (): Promise<OfflineSnapshot | null> => {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(SNAPSHOT_KEY);
    const result = await new Promise<KVRow | undefined>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as KVRow | undefined);
      request.onerror = () => reject(request.error);
    });

    await txDone(tx);
    return (result?.value as OfflineSnapshot | undefined) ?? null;
  } finally {
    db.close();
  }
};

export const clearOfflineSnapshot = async () => {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(SNAPSHOT_KEY);
    await txDone(tx);
  } finally {
    db.close();
  }
};
