import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router';
import { LayoutDashboard, BarChart2, BookOpen, Settings as SettingsIcon, Sun, Moon, Menu, X, Loader2, AlertCircle } from 'lucide-react';
import { HabitProvider } from '../store/HabitContext';
import { useAuth } from '../store/AuthContext';
import { useAutoSync } from '../hooks/useAutoSync';
import { Show, UserButton } from '@clerk/react';

// Separate SyncStatus component to prevent unnecessary re-renders of entire Root
const SyncStatus = React.memo(() => {
  const { isSyncing, syncError } = useAutoSync();

  if (!isSyncing && !syncError) return null;

  return (
    <div className="px-6 py-3 mb-4 rounded-lg bg-[#f8f9ff] dark:bg-[#21262d] border border-[#e5eeff] dark:border-[#30363d] flex items-center gap-3">
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-[#004ac6] dark:text-[#a5c0ff]" />
          <span className="text-[12px] text-[#434655] dark:text-[#8b949e]">Syncing...</span>
        </>
      ) : syncError ? (
        <>
          <AlertCircle className="w-4 h-4 text-[#ba1a1a] dark:text-[#ffb4ab]" />
          <span className="text-[12px] text-[#ba1a1a] dark:text-[#ffb4ab]">Sync error</span>
        </>
      ) : null}
    </div>
  );
});

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const { user, isConfigured } = useAuth();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Analytics & Progress', path: '/analytics', icon: BarChart2 },
    { name: 'Reading Tracker', path: '/reading', icon: BookOpen },
    { name: 'Manage Habits', path: '/manage', icon: SettingsIcon },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 w-[260px] bg-white dark:bg-[#161b22] border-r border-[#c3c6d7] dark:border-[#30363d] z-30 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
      <div className="p-6 pb-4 flex items-center justify-between">
        <h1 className="text-[24px] font-[600] tracking-[-0.01em] text-[#0b1c30] dark:text-white">HabTracker</h1>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-2 text-[#434655] dark:text-[#8b949e] hover:bg-[#f8f9ff] dark:hover:bg-[#21262d] rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-6 pb-6">
        <Show when="signed-in" fallback={null}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e5eeff] dark:bg-[#004ac6]/20 flex items-center justify-center text-[#004ac6] dark:text-[#a5c0ff] font-bold text-sm">
              {user?.email?.[0].toUpperCase() ?? 'A'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[14px] font-[600] text-[#0b1c30] dark:text-white truncate">
                {user?.displayName || user?.email || 'User'}
              </span>
              {user?.email && (
                <span className="text-[11px] text-[#737686] dark:text-[#8b949e] truncate">
                  {user.email}
                </span>
              )}
            </div>
          </div>
          {isConfigured && user && <SyncStatus />}
        </Show>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-[500] transition-colors relative
              ${isActive 
                ? 'bg-[#004ac6]/5 dark:bg-[#004ac6]/20 text-[#004ac6] dark:text-[#a5c0ff]' 
                : 'text-[#434655] dark:text-[#8b949e] hover:bg-[#f8f9ff] dark:hover:bg-[#21262d] hover:text-[#0b1c30] dark:hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#004ac6] dark:bg-[#a5c0ff] rounded-r-full" />
                )}
                <item.icon className="w-5 h-5" />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-[#c3c6d7]/50 dark:border-[#30363d] space-y-2">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-2 text-[#434655] dark:text-[#8b949e] hover:bg-[#e5eeff] dark:hover:bg-[#21262d] hover:text-[#0b1c30] dark:hover:text-white rounded-lg transition-colors"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[12px]">{isDark ? 'Light' : 'Dark'}</span>
        </button>
        
        <Show when="signed-in" fallback={null}>
          <div className="flex justify-center">
            <UserButton />
          </div>
        </Show>
      </div>
    </aside>
    </>
  );
};

export const Root = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <HabitProvider>
      <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0d1117] font-['Inter'] flex flex-col lg:flex-row transition-colors duration-300">
        
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#161b22] border-b border-[#c3c6d7] dark:border-[#30363d] sticky top-0 z-10">
          <h1 className="text-[20px] font-[600] tracking-[-0.01em] text-[#0b1c30] dark:text-white">HabTracker</h1>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-[#434655] dark:text-[#8b949e] hover:bg-[#f8f9ff] dark:hover:bg-[#21262d] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 w-full lg:ml-[260px]">
          <div className="max-w-[1280px] mx-auto p-4 md:p-8 overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </HabitProvider>
  );
};