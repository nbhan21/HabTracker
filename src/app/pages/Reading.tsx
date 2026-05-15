import React, { useState } from 'react';
import { useHabits } from '../store/HabitContext';
import { Plus, Trash2 } from 'lucide-react';

const CircularProgress = ({ value, max }: { value: number; max: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const percent = max > 0 ? (value / max) * 100 : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-[#e5eeff] dark:text-[#30363d]"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-[#004ac6] dark:text-[#a5c0ff] transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-[#0b1c30] dark:text-white">
        <span className="text-[16px] font-bold">{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

export const Reading = () => {
  const { books, updateBookProgress, addBook, deleteBook } = useHabits();
  
  const [newTitle, setNewTitle] = useState('');
  const [newTotalPages, setNewTotalPages] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleProgressChange = (id: string, currentStr: string, max: number) => {
    let val = parseInt(currentStr, 10);
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > max) val = max;
    updateBookProgress(id, val);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseInt(newTotalPages, 10);
    if (!newTitle.trim() || isNaN(total) || total <= 0) return;
    
    addBook({
      title: newTitle.trim(),
      currentPage: 0,
      totalPages: total
    });
    
    setNewTitle('');
    setNewTotalPages('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white">
            Reading Tracker
          </h1>
          <p className="text-[16px] text-[#434655] dark:text-[#8b949e] mt-1">
            Monitor your progress for the "Read Non-fiction" habit.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-[#004ac6] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Cancel' : 'Add Book'}
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAddBook} className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#e5eeff] dark:border-[#30363d] animate-in slide-in-from-top-4">
          <h2 className="text-[16px] font-[600] text-[#0b1c30] dark:text-white mb-4">Add a New Book</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Book Title</label>
              <input 
                type="text" 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                placeholder="e.g. Meditations by Marcus Aurelius"
                className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">Total Pages</label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newTotalPages} 
                  onChange={(e) => setNewTotalPages(e.target.value)} 
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff]"
                />
                <button 
                  type="submit"
                  disabled={!newTitle.trim() || !newTotalPages}
                  className="bg-[#004ac6] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map(book => (
          <div key={book.id} className="relative bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col items-center text-center gap-6 group">
            
            {/* Delete Button (visible on hover) */}
            <button 
              onClick={() => deleteBook(book.id)}
              className="absolute top-4 right-4 p-2 text-[#c3c6d7] dark:text-[#8b949e] hover:text-[#ba1a1a] dark:hover:text-[#ffb4ab] hover:bg-[#ffdad6] dark:hover:bg-[#93000a] rounded-md transition-colors opacity-0 group-hover:opacity-100"
              title="Delete Book"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <h3 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white w-[85%] truncate" title={book.title}>
              {book.title}
            </h3>
            
            <CircularProgress value={book.currentPage} max={book.totalPages} />
            
            <div className="w-full space-y-3 pt-4 border-t border-[#eff4ff] dark:border-[#30363d]">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-[#737686] dark:text-[#8b949e]">Progress</span>
                <span className="font-medium text-[#0b1c30] dark:text-white">
                  {book.currentPage} / {book.totalPages} p.
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={book.currentPage || ''} 
                  onChange={(e) => handleProgressChange(book.id, e.target.value, book.totalPages)}
                  className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff] transition-all"
                  placeholder="Current"
                />
                <span className="text-[#737686] dark:text-[#8b949e] text-[14px]">/</span>
                <input 
                  type="number"
                  value={book.totalPages}
                  disabled
                  className="w-full px-3 py-2 bg-[#eff4ff] dark:bg-[#0d1117] border border-[#eff4ff] dark:border-[#0d1117] rounded-lg text-[14px] text-[#737686] dark:text-[#8b949e] cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        ))}
        {books.length === 0 && (
          <div className="col-span-full py-12 text-center text-[#737686] dark:text-[#8b949e] border-2 border-dashed border-[#c3c6d7] dark:border-[#30363d] rounded-xl">
            <p>No books in your library. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};