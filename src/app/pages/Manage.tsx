import React, { useState } from 'react';
import { useHabits, Priority } from '../store/HabitContext';
import { Trash2, Plus, CloudUpload, CloudDownload, Upload, Download, RotateCcw } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { pullCloudDataToLocal, pushLocalDataToCloud, resetCloudDataForUser } from '../services/cloudSync';
import { clearOfflineSnapshot } from '../services/offlineStore';

const HabitTemplatesPanel = () => {
  const { habitTemplates, addHabitFromTemplate } = useHabits();

  return (
    <section className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
      <div>
        <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white">Habit Templates</h2>
        <p className="text-[14px] text-[#737686] dark:text-[#8b949e] mt-1">
          Start quickly with curated habits for focus, health, and learning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habitTemplates.map(template => (
          <div
            key={template.id}
            className="rounded-xl border border-[#e5eeff] dark:border-[#30363d] bg-[#f8f9ff] dark:bg-[#21262d] p-4 flex flex-col gap-3"
          >
            <div>
              <h3 className="text-[15px] font-[600] text-[#0b1c30] dark:text-white">{template.name}</h3>
              <p className="text-[12px] text-[#737686] dark:text-[#8b949e] mt-1">{template.description}</p>
            </div>
            <div className="text-[11px] font-[600] tracking-wider uppercase text-[#434655] dark:text-[#8b949e]">
              {template.category} • {template.priority} • {template.frequency}
            </div>
            <button
              type="button"
              onClick={() => addHabitFromTemplate(template.id)}
              className="self-start inline-flex items-center gap-2 bg-[#004ac6] text-white px-3 py-1.5 rounded-lg text-[13px] font-[500] hover:bg-[#003ea8] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Use Template
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

const HabitForm = () => {
  const { addHabit } = useHabits();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [frequency, setFrequency] = useState('Daily');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit({ name, category, priority, frequency });
    setName('');
    setCategory('');
    setPriority('Medium');
    setFrequency('Daily');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
      <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white mb-4">Add New Habit</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Habit Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="e.g. Morning Meditation"
            className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Category</label>
            <input 
              type="text" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              placeholder="e.g. Health"
              className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Priority</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Frequency</label>
            <select 
              value={frequency} 
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          disabled={!name.trim()}
          className="flex items-center gap-2 bg-[#004ac6] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Habit
        </button>
      </div>
    </form>
  );
};

const DailyTaskForm = () => {
  const { addDailyTask } = useHabits();
  const [taskName, setTaskName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    addDailyTask(taskName);
    setTaskName('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
      <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white mb-4">Add Daily Routine Task</h2>
      
      <div>
        <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Task Name</label>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={taskName} 
            onChange={(e) => setTaskName(e.target.value)} 
            placeholder="e.g. Clear inbox"
            className="flex-1 px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
          />
          <button 
            type="submit" 
            disabled={!taskName.trim()}
            className="flex items-center gap-2 bg-[#004ac6] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </form>
  );
};

export const Manage = () => {
  const { habits, dailyTasks, books, deleteHabit, deleteDailyTask, replaceState } = useHabits();
  const { user, isConfigured } = useAuth();
  const showSyncTools = import.meta.env.DEV || import.meta.env.VITE_ENABLE_SYNC_TOOLS === 'true';
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handlePushToCloud = async () => {
    if (!isConfigured || !user) {
      setSyncError('Please sign in first before syncing to cloud.');
      return;
    }
    if (import.meta.env.VITE_ALLOW_LOCAL_MIGRATION !== 'true') {
      setSyncError('Local → Cloud migration disabled by configuration.');
      return;
    }
    setSyncing(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      await pushLocalDataToCloud(user.id, { habits, dailyTasks, books });
      setSyncMessage('Local data successfully pushed to Supabase cloud.');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to push data to cloud.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!isConfigured || !user) {
      setSyncError('Please sign in first before pulling data from cloud.');
      return;
    }

    setSyncing(true);
    setSyncError(null);
    setSyncMessage(null);
    try {
      const cloudData = await pullCloudDataToLocal(user.id);
      replaceState(cloudData);
      setSyncMessage('Cloud data successfully pulled into local app state.');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to pull data from cloud.');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportJson = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { habits, dailyTasks, books },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateKey = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `habtracker-backup-${dateKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncMessage('Backup JSON exported successfully.');
    setSyncError(null);
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSyncError(null);
    setSyncMessage(null);

    if (import.meta.env.VITE_ALLOW_LOCAL_MIGRATION !== 'true') {
      setSyncError('Import disabled by configuration.');
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        data?: { habits?: unknown; dailyTasks?: unknown; books?: unknown };
      };

      const nextHabits = Array.isArray(parsed.data?.habits) ? parsed.data?.habits : [];
      const nextDailyTasks = Array.isArray(parsed.data?.dailyTasks) ? parsed.data?.dailyTasks : [];
      const nextBooks = Array.isArray(parsed.data?.books) ? parsed.data?.books : [];

      replaceState({
        habits: nextHabits as typeof habits,
        dailyTasks: nextDailyTasks as typeof dailyTasks,
        books: nextBooks as typeof books,
      });

      setSyncMessage('Backup JSON imported successfully.');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Invalid backup file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleFreshStart = async () => {
    const confirmed = window.confirm('This will remove your current local data. If logged in, it will also clear your cloud data. Continue?');
    if (!confirmed) return;

    setSyncing(true);
    setSyncError(null);
    setSyncMessage(null);

    try {
      if (isConfigured && user) {
        await resetCloudDataForUser(user.id);
      }

      replaceState({ habits: [], dailyTasks: [], books: [] });
      window.localStorage.removeItem('habtracker-state-v1');
      await clearOfflineSnapshot();
      setSyncMessage('Fresh start completed. Your tracker is now empty.');
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Failed to reset data.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <header>
        <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white">
          Manage Tracker
        </h1>
        <p className="text-[16px] text-[#434655] dark:text-[#8b949e] mt-1">
          Add or remove habits and daily routines.
        </p>
      </header>

      <div className="space-y-8">
        {/* Forms */}
        <div className="space-y-6">
          {showSyncTools && (
            <section className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-4">
              <div>
                <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white">Sync & Backup</h2>
                <p className="text-[14px] text-[#737686] dark:text-[#8b949e] mt-1">
                  Tools for migration/testing. You can hide this panel in production.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePushToCloud}
                  disabled={syncing}
                  className="inline-flex items-center justify-center gap-2 bg-[#004ac6] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors disabled:opacity-60"
                >
                  <CloudUpload className="w-4 h-4" />
                  Push Local to Cloud
                </button>

                <button
                  type="button"
                  onClick={handlePullFromCloud}
                  disabled={syncing}
                  className="inline-flex items-center justify-center gap-2 bg-[#0b1c30] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#1f344f] transition-colors disabled:opacity-60"
                >
                  <CloudDownload className="w-4 h-4" />
                  Pull Cloud to Local
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center justify-center gap-2 bg-[#eff4ff] dark:bg-[#21262d] text-[#0b1c30] dark:text-white px-4 py-2 rounded-lg text-[14px] font-[500] border border-[#c3c6d7] dark:border-[#30363d] hover:bg-[#e5eeff] dark:hover:bg-[#30363d] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export JSON
                </button>

                <label className="inline-flex items-center justify-center gap-2 bg-[#eff4ff] dark:bg-[#21262d] text-[#0b1c30] dark:text-white px-4 py-2 rounded-lg text-[14px] font-[500] border border-[#c3c6d7] dark:border-[#30363d] hover:bg-[#e5eeff] dark:hover:bg-[#30363d] transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Import JSON
                  <input type="file" accept="application/json" className="hidden" onChange={handleImportJson} />
                </label>

                <button
                  type="button"
                  onClick={handleFreshStart}
                  disabled={syncing}
                  className="md:col-span-2 inline-flex items-center justify-center gap-2 bg-[#ffebee] dark:bg-[#3b1111] text-[#b71c1c] dark:text-[#ffcdd2] px-4 py-2 rounded-lg text-[14px] font-[600] border border-[#ef9a9a] dark:border-[#ef5350] hover:bg-[#ffdde1] dark:hover:bg-[#4a1717] transition-colors disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  Fresh Start (Clear Local + Cloud Data)
                </button>
              </div>

              {syncMessage && (
                <div className="rounded-lg bg-[#e8f5e9] dark:bg-[#0f2a18] border border-[#81c784] dark:border-[#2e7d32] px-3 py-2 text-[13px] text-[#1b5e20] dark:text-[#a5d6a7]">
                  {syncMessage}
                </div>
              )}

              {syncError && (
                <div className="rounded-lg bg-[#ffebee] dark:bg-[#3b1111] border border-[#ef9a9a] dark:border-[#ef5350] px-3 py-2 text-[13px] text-[#b71c1c] dark:text-[#ffcdd2]">
                  {syncError}
                </div>
              )}

              {!isConfigured && (
                <p className="text-[12px] text-[#737686] dark:text-[#8b949e]">
                  Supabase is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
                </p>
              )}
            </section>
          )}

          <HabitTemplatesPanel />
          <HabitForm />
          <DailyTaskForm />
        </div>

        {/* Existing Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#c3c6d7]/30 dark:border-[#30363d]">
          
          {/* Habits List */}
          <section>
            <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white mb-4">Current Habits</h2>
            <div className="space-y-3">
              {habits.length === 0 && (
                <p className="text-[#737686] dark:text-[#8b949e] text-[14px]">No habits found.</p>
              )}
              {habits.map(habit => (
                <div key={habit.id} className="bg-white dark:bg-[#161b22] p-4 rounded-xl border border-[#eff4ff] dark:border-[#30363d] flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-[14px] font-[600] text-[#0b1c30] dark:text-white">{habit.name}</h3>
                    <p className="text-[12px] text-[#737686] dark:text-[#8b949e]">{habit.category} • {habit.priority}</p>
                  </div>
                  <button 
                    onClick={() => deleteHabit(habit.id)}
                    className="p-2 text-[#737686] dark:text-[#8b949e] hover:text-[#ba1a1a] dark:hover:text-[#ffb4ab] hover:bg-[#ffdad6] dark:hover:bg-[#93000a] rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Daily Tasks List */}
          <section>
            <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white mb-4">Current Daily Routine</h2>
            <div className="space-y-3">
              {dailyTasks.length === 0 && (
                <p className="text-[#737686] dark:text-[#8b949e] text-[14px]">No daily tasks found.</p>
              )}
              {dailyTasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-[#161b22] p-4 rounded-xl border border-[#eff4ff] dark:border-[#30363d] flex items-center justify-between shadow-sm">
                  <h3 className="text-[14px] font-[500] text-[#0b1c30] dark:text-white">{task.name}</h3>
                  <button 
                    onClick={() => deleteDailyTask(task.id)}
                    className="p-2 text-[#737686] dark:text-[#8b949e] hover:text-[#ba1a1a] dark:hover:text-[#ffb4ab] hover:bg-[#ffdad6] dark:hover:bg-[#93000a] rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
