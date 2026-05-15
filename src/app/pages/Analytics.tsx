import React, { useMemo, useState } from 'react';
import { useHabits } from '../store/HabitContext';
import { Trophy, Flame, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

export const Analytics = () => {
  const { habits } = useHabits();
  const [viewDate, setViewDate] = useState(new Date());

  const toLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  // Generate a calendar grid for the viewed month
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const today = new Date();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const startDayIndex = firstDay === 0 ? 6 : firstDay - 1; // 0 = Monday
    
    const days: any[] = [];
    
    // Empty slots for days before the 1st
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    
    // Fill the days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = toLocalDateKey(date);
      
      // Calculate how many habits were completed on this day
      const completedCount = habits.filter(h => h.completedDates.includes(dateStr)).length;
      const intensity = habits.length ? completedCount / habits.length : 0;
      
      days.push({
        date: i,
        dateStr,
        intensity,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    
    return days;
  }, [habits, viewDate]);

  // Calculate monthly performance and trend
  const { performance, trendIsUp, trendAmount } = useMemo(() => {
    if (habits.length === 0) return { performance: 0, trendIsUp: true, trendAmount: 0 };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const getMonthPerformance = (y: number, m: number) => {
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const totalPossible = daysInMonth * habits.length;
      let completed = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = toLocalDateKey(new Date(y, m, i));
        completed += habits.filter(h => h.completedDates.includes(dateStr)).length;
      }
      return totalPossible > 0 ? completed / totalPossible : 0;
    };

    const currentMonthPerf = getMonthPerformance(year, month);
    const prevMonthPerf = getMonthPerformance(year, month - 1);
    
    const trendDiff = currentMonthPerf - prevMonthPerf;
    
    return {
      performance: Math.round(currentMonthPerf * 100),
      trendIsUp: trendDiff >= 0,
      trendAmount: Math.abs(Math.round(trendDiff * 100))
    };
  }, [habits, viewDate]);

  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyReview = useMemo(() => {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    const getDateKey = (date: Date) => toLocalDateKey(date);

    const getWeekStats = (startDate: Date) => {
      const entries = weekDays.map((label, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        return {
          label,
          date,
          key: getDateKey(date),
        };
      });

      const completedByHabit = habits.map(habit => {
        const completedCount = entries.filter(entry => habit.completedDates.includes(entry.key)).length;
        return { habit, completedCount };
      });

      const completedByDay = entries.map(entry => {
        const completedCount = habits.filter(habit => habit.completedDates.includes(entry.key)).length;
        return { ...entry, completedCount };
      });

      const totalCompleted = completedByHabit.reduce((sum, item) => sum + item.completedCount, 0);
      const totalPossible = habits.length * entries.length;
      const completionRate = totalPossible > 0 ? totalCompleted / totalPossible : 0;

      const strongestHabit = completedByHabit.length
        ? [...completedByHabit].sort((a, b) => b.completedCount - a.completedCount)[0]
        : null;
      const weakestHabit = completedByHabit.length
        ? [...completedByHabit].sort((a, b) => a.completedCount - b.completedCount)[0]
        : null;
      const bestDay = completedByDay.length
        ? [...completedByDay].sort((a, b) => b.completedCount - a.completedCount)[0]
        : null;

      return {
        completionRate,
        totalCompleted,
        totalPossible,
        strongestHabit,
        weakestHabit,
        bestDay,
      };
    };

    const currentWeek = getWeekStats(currentWeekStart);
    const previousWeek = getWeekStats(previousWeekStart);
    const trendDelta = currentWeek.completionRate - previousWeek.completionRate;

    return {
      currentWeek,
      trendDelta,
      focusHabit: currentWeek.weakestHabit?.habit ?? null,
      recommendation: currentWeek.completionRate >= 0.8
        ? 'You are maintaining a strong rhythm this week. Keep the same structure and avoid overloading the schedule.'
        : currentWeek.completionRate >= 0.5
          ? 'Your consistency is decent, but one or two habits need more attention. Prioritize the lowest-performing habit first.'
          : 'This week needs a reset. Reduce friction, keep only the most important habits active, and rebuild momentum.'
    };
  }, [habits]);

  // Doughnut properties
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (performance / 100) * circumference;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header>
        <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white">
          Analytics & Progress
        </h1>
        <p className="text-[16px] text-[#434655] dark:text-[#8b949e] mt-1">
          Track your consistency and see how far you've come.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Calendar Heatmap (8 Cols) */}
        <section className="lg:col-span-8 bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-[600] text-[#0b1c30] dark:text-white font-bold text-[24px]">Consistency Map</h2>
            <div className="flex items-center gap-4 bg-[#f8f9ff] dark:bg-[#21262d] px-3 py-1.5 rounded-lg border border-[#e5eeff] dark:border-[#30363d]">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-[#30363d] rounded text-[#434655] dark:text-[#8b949e] transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[14px] font-medium text-[#0b1c30] dark:text-white min-w-[120px] text-center">
                {monthName}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-white dark:hover:bg-[#30363d] rounded text-[#434655] dark:text-[#8b949e] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 max-w-md mx-auto w-full">
            {weekDays.map((day, idx) => {
              const isWeekend = idx >= 5; // Sat is 5, Sun is 6
              return (
                <div key={day} className={`text-center text-[11px] font-[500] mb-2 ${isWeekend ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#737686] dark:text-[#8b949e]'}`}>
                  {day}
                </div>
              );
            })}
            
            {calendarData.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="w-10 h-10 mx-auto" />;
              
              let bgColor = 'bg-[#f8f9ff] dark:bg-[#21262d] border border-[#eff4ff] dark:border-[#30363d]';
              if (day.intensity > 0) bgColor = 'bg-[#b4c5ff] dark:bg-[#004ac6]/60 border-[#b4c5ff] dark:border-transparent';
              if (day.intensity >= 0.5) bgColor = 'bg-[#2563eb] dark:bg-[#004ac6]/80 border-[#2563eb] dark:border-transparent';
              if (day.intensity === 1) bgColor = 'bg-[#004ac6] dark:bg-[#004ac6] border-[#004ac6] dark:border-transparent';
              
              const isWeekend = (idx % 7) >= 5;
              const emptyTextColor = isWeekend ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#737686] dark:text-[#8b949e]';
              
              return (
                <div 
                  key={day.date}
                  className={`
                    w-10 h-10 rounded-[4px] mx-auto flex items-center justify-center text-[12px] font-medium transition-transform hover:scale-110 cursor-default
                    ${bgColor}
                    ${day.intensity > 0 ? 'text-white' : emptyTextColor}
                    ${day.isToday ? 'ring-2 ring-[#006c49] ring-offset-2 dark:ring-offset-[#161b22]' : ''}
                  `}
                  title={`${day.dateStr}: ${Math.round(day.intensity * 100)}% completed`}
                >
                  {day.date}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 text-[12px] text-[#737686] dark:text-[#8b949e]">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-sm bg-[#f8f9ff] dark:bg-[#21262d] border border-[#eff4ff] dark:border-[#30363d]" />
              <div className="w-4 h-4 rounded-sm bg-[#b4c5ff] dark:bg-[#004ac6]/60" />
              <div className="w-4 h-4 rounded-sm bg-[#2563eb] dark:bg-[#004ac6]/80" />
              <div className="w-4 h-4 rounded-sm bg-[#004ac6]" />
            </div>
            <span>More</span>
          </div>
        </section>

        {/* Right Col: Performance Doughnut (4 Cols) */}
        <section className="lg:col-span-4 bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] h-full flex flex-col items-center justify-center">
          <h2 className="font-[600] text-[#0b1c30] dark:text-white self-start w-full text-[24px] font-bold text-center mx-[0px] mt-[0px] mb-[70px]">Monthly Performance</h2>
          
          <div className="relative flex items-center justify-center w-40 h-40">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-[#e5eeff] dark:text-[#30363d]" />
              <circle 
                cx="80" cy="80" r={radius} 
                stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                className="text-[#004ac6] dark:text-[#a5c0ff] transition-all duration-1000 ease-out" 
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-[#0b1c30] dark:text-white">
              <span className="text-[32px] font-bold leading-none">{performance}%</span>
              <div className={`flex items-center gap-1 mt-1 text-[12px] font-medium ${trendIsUp ? 'text-[#006c49]' : 'text-[#ffb4ab]'}`}>
                {trendIsUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trendAmount}% vs Last</span>
              </div>
            </div>
          </div>
          
          <p className="text-[14px] text-[#737686] dark:text-[#8b949e] text-center mt-8 px-4">
            Based on total habit completion vs total possible habits for {monthName}.
          </p>
        </section>

      </div>

      <section className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h2 className="font-[600] text-[#0b1c30] dark:text-white text-[24px] font-bold">Weekly Review</h2>
            <p className="text-[14px] text-[#737686] dark:text-[#8b949e] mt-1">
              Auto-generated from your habit activity for the current week.
            </p>
          </div>
          <div className={`text-[14px] font-[600] ${weeklyReview.trendDelta >= 0 ? 'text-[#006c49]' : 'text-[#ba1a1a]'}`}>
            {weeklyReview.trendDelta >= 0 ? '+' : '-'}{Math.abs(Math.round(weeklyReview.trendDelta * 100))}% vs last week
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#f8f9ff] dark:bg-[#21262d] border border-[#e5eeff] dark:border-[#30363d] p-4">
            <div className="text-[12px] font-[600] tracking-wider uppercase text-[#737686] dark:text-[#8b949e]">Completion</div>
            <div className="mt-2 text-[28px] font-[700] text-[#0b1c30] dark:text-white">
              {Math.round(weeklyReview.currentWeek.completionRate * 100)}%
            </div>
            <div className="text-[13px] text-[#737686] dark:text-[#8b949e] mt-1">
              {weeklyReview.currentWeek.totalCompleted} of {weeklyReview.currentWeek.totalPossible} habit-days completed
            </div>
          </div>

          <div className="rounded-xl bg-[#f8f9ff] dark:bg-[#21262d] border border-[#e5eeff] dark:border-[#30363d] p-4">
            <div className="text-[12px] font-[600] tracking-wider uppercase text-[#737686] dark:text-[#8b949e]">Strongest Habit</div>
            <div className="mt-2 text-[18px] font-[700] text-[#0b1c30] dark:text-white">
              {weeklyReview.currentWeek.strongestHabit?.habit.name ?? 'No data yet'}
            </div>
            <div className="text-[13px] text-[#737686] dark:text-[#8b949e] mt-1">
              {weeklyReview.currentWeek.strongestHabit ? `${weeklyReview.currentWeek.strongestHabit.completedCount} completions this week` : 'Track habits to see the result'}
            </div>
          </div>

          <div className="rounded-xl bg-[#f8f9ff] dark:bg-[#21262d] border border-[#e5eeff] dark:border-[#30363d] p-4">
            <div className="text-[12px] font-[600] tracking-wider uppercase text-[#737686] dark:text-[#8b949e]">Needs Attention</div>
            <div className="mt-2 text-[18px] font-[700] text-[#0b1c30] dark:text-white">
              {weeklyReview.focusHabit?.name ?? 'No habit selected'}
            </div>
            <div className="text-[13px] text-[#737686] dark:text-[#8b949e] mt-1">
              {weeklyReview.currentWeek.weakestHabit ? `${weeklyReview.currentWeek.weakestHabit.completedCount} completions this week` : 'Track habits to see the result'}
            </div>
          </div>

          <div className="rounded-xl bg-[#f8f9ff] dark:bg-[#21262d] border border-[#e5eeff] dark:border-[#30363d] p-4">
            <div className="text-[12px] font-[600] tracking-wider uppercase text-[#737686] dark:text-[#8b949e]">Best Day</div>
            <div className="mt-2 text-[18px] font-[700] text-[#0b1c30] dark:text-white">
              {weeklyReview.currentWeek.bestDay?.label ?? 'No data yet'}
            </div>
            <div className="text-[13px] text-[#737686] dark:text-[#8b949e] mt-1">
              {weeklyReview.currentWeek.bestDay ? `${weeklyReview.currentWeek.bestDay.completedCount} completions` : 'Complete habits to generate insights'}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#eff4ff] dark:bg-[#004ac6]/10 border border-[#e5eeff] dark:border-[#30363d] p-4">
          <div className="text-[12px] font-[600] tracking-wider uppercase text-[#737686] dark:text-[#8b949e]">Action Review</div>
          <p className="mt-2 text-[14px] text-[#0b1c30] dark:text-white leading-6">
            {weeklyReview.recommendation}
          </p>
        </div>
      </section>

      {/* Habit Streaks Section */}
      <section>
        <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white mb-4">Habit Streaks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col">
              <h3 className="text-[16px] font-[600] text-[#0b1c30] dark:text-white mb-4">{habit.name}</h3>
              
              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#eff4ff] dark:bg-[#004ac6]/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#004ac6] dark:text-[#a5c0ff]" />
                    <span className="text-[14px] text-[#434655] dark:text-[#8b949e]">Current Streak</span>
                  </div>
                  <span className="text-[16px] font-bold text-[#004ac6] dark:text-[#a5c0ff]">{habit.currentStreak} days</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#f8f9ff] dark:bg-[#21262d] rounded-lg border border-[#e5eeff] dark:border-[#30363d]">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#737686] dark:text-[#8b949e]" />
                    <span className="text-[14px] text-[#737686] dark:text-[#8b949e]">Longest Streak</span>
                  </div>
                  <span className="text-[16px] font-bold text-[#434655] dark:text-[#8b949e]">{habit.longestStreak} days</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};