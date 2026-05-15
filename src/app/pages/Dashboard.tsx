import React from 'react';
import { useHabits } from '../store/HabitContext';
import { Check } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export const Dashboard = () => {
  const { habits, dailyTasks, toggleHabit, toggleDailyTask } = useHabits();
  const { user } = useAuth();
  
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const currentHour = today.getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good evening';
  }
  
  const name = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Bhann');
  const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const completedHabitsToday = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const habitCompletionPercent = habits.length ? Math.round((completedHabitsToday / habits.length) * 100) : 0;

  // Generate week dates for widget
  const getWeekDates = () => {
    const dates = [];
    const current = new Date();
    current.setDate(current.getDate() - current.getDay() + 1); // Start from Monday
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };
  const weekDates = getWeekDates();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-[#ba1a1a] dark:text-[#ffb4ab] bg-[#ffdad6] dark:bg-[#93000a]';
      case 'Medium': return 'text-[#854d0e] dark:text-[#eab308] bg-[#fef08a] dark:bg-[#713f12]';
      case 'Low': return 'text-[#003ea8] dark:text-[#adc6ff] bg-[#dbe1ff] dark:bg-[#002b75]';
      default: return 'text-[#434655] dark:text-[#a5c0ff] bg-[#e5eeff] dark:bg-[#002b75]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white">
            {greeting}, {name}!
          </h1>
          <p className="text-[16px] text-[#434655] dark:text-[#8b949e] mt-1">
            {today.toLocaleDateString('en-US', { weekday: 'long' })}, {monthYear} • Here is your focus for today.
          </p>
        </div>
      </header>

      {/* Main Content Vertical Layout */}
      <div className="flex flex-col gap-6">
        
        {/* Top Row: Progress Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
          
          {/* Today's Focus */}
          <section className="lg:col-span-1 xl:col-span-3 bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between overflow-hidden">
            <div>
              <h2 className="font-[600] text-[#0b1c30] dark:text-white text-[24px] font-bold">Today's Focus</h2>
              <p className="text-[14px] text-[#737686] dark:text-[#8b949e] mt-1">You're on track to complete your daily habits.</p>
            </div>
            
            <div className="mt-5 flex flex-col items-center gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="order-2 2xl:order-1 flex items-end justify-center 2xl:justify-start gap-3 min-w-0">
                <div className="text-[44px] md:text-[60px] font-[700] leading-none tracking-tight text-[#004ac6] dark:text-[#a5c0ff]">
                  {habitCompletionPercent}%
                </div>
                <div className="text-[13px] font-[700] text-[#737686] dark:text-[#8b949e] tracking-wider pb-1">
                  COMPLETED
                </div>
              </div>
              
              <div className="order-1 2xl:order-2 relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 self-center 2xl:self-auto">
                <svg className="transform -rotate-90 w-full h-full">
                  <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-[#f8f9ff] dark:text-[#21262d]" />
                  <circle 
                    cx="50%" cy="50%" r="40%" 
                    stroke="currentColor" strokeWidth="16" fill="transparent" 
                    strokeDasharray="100" 
                    strokeDashoffset={100 - habitCompletionPercent} 
                    className="text-[#004ac6] dark:text-[#a5c0ff] transition-all duration-1000 ease-out" 
                    strokeLinecap="round"
                    pathLength="100"
                  />
                </svg>
              </div>
            </div>
          </section>

          {/* Weekly Progress: Vertical Bar Chart (Right) */}
          <section className="lg:col-span-1 xl:col-span-2 bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <h2 className="font-[600] text-[#0b1c30] dark:text-white mb-6 text-[24px] font-bold">Weekly Progress</h2>
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-48 mt-2">
              {weekDates.map((date, idx) => {
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const dayHabitsCompleted = habits.filter(h => h.completedDates.includes(dateStr)).length;
                const total = habits.length;
                const pct = total === 0 ? 0 : Math.round((dayHabitsCompleted / total) * 100);
                const isToday = dateStr === todayStr;

                return (
                  <div key={idx} className="flex flex-col items-center min-w-0 flex-1 group">
                    <div className="relative w-full max-w-[32px] sm:max-w-[36px] h-36 bg-[#f8f9ff] dark:bg-[#21262d] rounded-[4px] overflow-hidden flex items-end justify-center">
                      <div 
                        className={`w-full transition-all duration-700 ease-out rounded-[4px] ${isToday ? 'bg-[#004ac6] dark:bg-[#a5c0ff]' : 'bg-[#e5eeff] dark:bg-[#30363d]'}`} 
                        style={{ height: `${pct}%` }}
                      />
                      <div className="absolute opacity-0 group-hover:opacity-100 bg-[#0b1c30] dark:bg-[#30363d] text-white text-[11px] rounded py-1 px-2 bottom-full mb-1 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {pct}%
                      </div>
                    </div>
                    <div className={`text-center mt-2 leading-tight ${isToday ? 'font-bold text-[#004ac6] dark:text-[#a5c0ff]' : 'font-medium text-[#737686] dark:text-[#8b949e]'}`}>
                      <div className="text-[10px] sm:text-[11px] uppercase truncate">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="text-[11px] sm:text-[12px]">{date.getDate()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* Bottom Row: Habits & Routine */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Habits For Today */}
          <section className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col">
            <h2 className="font-[600] text-[#0b1c30] dark:text-white mb-4 font-bold text-[24px]">Habits for Today</h2>
            <div className="space-y-3">
              {habits.map(habit => {
                const isCompleted = habit.completedDates.includes(todayStr);
                return (
                  <div 
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, todayStr)}
                    className={`
                      flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${isCompleted 
                        ? 'bg-[#f8f9ff] dark:bg-[#21262d]/50 border-[#006c49]/30 dark:border-[#006c49]/50' 
                        : 'bg-white dark:bg-[#161b22] border-[#c3c6d7] dark:border-[#30363d] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(255,255,255,0.05)] hover:z-20 relative'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-6 h-6 rounded flex items-center justify-center transition-colors
                        ${isCompleted ? 'bg-[#006c49] border-[#006c49]' : 'border-2 border-[#c3c6d7] dark:border-[#30363d] bg-white dark:bg-[#161b22]'}
                      `}>
                        {isCompleted && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <h3 className={`text-[16px] font-[500] ${isCompleted ? 'text-[#434655] dark:text-[#8b949e] line-through' : 'text-[#0b1c30] dark:text-white'}`}>
                          {habit.name}
                        </h3>
                        <span className="text-[12px] text-[#737686] dark:text-[#8b949e]">{habit.frequency}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-[600] tracking-wider uppercase px-2 py-1 rounded-full ${getPriorityColor(habit.priority)}`}>
                      {habit.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Daily Routine */}
          <section className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col">
            <h2 className="font-[600] text-[#0b1c30] dark:text-white mb-4 text-[24px] font-bold">Daily Routine</h2>
            <div className="space-y-3">
              {dailyTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => toggleDailyTask(task.id)}
                  className="flex items-center gap-4 p-3 hover:bg-[#f8f9ff] dark:hover:bg-[#21262d] rounded-lg cursor-pointer transition-colors"
                >
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center transition-colors
                    ${task.completed ? 'bg-[#004ac6] border-[#004ac6]' : 'border-2 border-[#c3c6d7] dark:border-[#30363d] bg-white dark:bg-[#161b22]'}
                  `}>
                    {task.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-[14px] ${task.completed ? 'text-[#434655] dark:text-[#8b949e] line-through' : 'text-[#0b1c30] dark:text-white'}`}>
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};
