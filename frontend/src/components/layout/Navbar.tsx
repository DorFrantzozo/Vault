import React, { useState } from 'react';
import { Menu, Search, Bell, Moon, Calendar as CalendarIcon } from 'lucide-react';

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setMobileOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const formattedDate = new Date().toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3 space-x-reverse flex-1 max-w-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
          aria-label="פתח תפריט"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש במערכת..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <button className="relative p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
        </button>

        <button className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <Moon className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 text-xs font-medium">
          <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </header>
  );
};
