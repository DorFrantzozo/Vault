import React, { useState } from 'react';
import { Menu, Search, Bell, Moon, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  setMobileOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ setMobileOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const formattedDate = new Date().toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-3 z-20 mx-3 md:mx-8 my-2 bg-lifted-cream/95 backdrop-blur-md border border-ink-black/10 rounded-2xl px-4 md:px-6 py-2.5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] gap-3 md:gap-6">
      {/* Mobile Expanded Search Bar Overlay */}
      <AnimatePresence>
        {isMobileSearchOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex-1 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-gray pointer-events-none" />
              <Input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש במערכת..."
                className="pr-9 pl-3 text-xs"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSearchOpen(false)}
              className="shrink-0 h-9 w-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Left Controls / Hamburger & Search */}
            <div className="flex items-center space-x-2.5 space-x-reverse flex-1 max-w-md">
              <Button
                variant="dark"
                size="icon"
                onClick={() => setMobileOpen(true)}
                className="md:hidden shrink-0 rounded-xl"
                aria-label="פתח תפריט"
              >
                <Menu className="w-4.5 h-4.5" />
              </Button>

              {/* Mobile Search Toggle Icon */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileSearchOpen(true)}
                className="sm:hidden bg-canvas-cream border-ink-black/10 rounded-xl shrink-0"
              >
                <Search className="w-4 h-4 text-slate-gray" />
              </Button>

              {/* Desktop / Tablet Search Input */}
              <div className="hidden sm:block relative w-full max-w-xs">
                <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-gray pointer-events-none z-10" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חיפוש במערכת..."
                  className="pr-11 pl-4 rounded-xl text-ink-black placeholder:text-slate-gray"
                />
              </div>
            </div>

            {/* Right Action Icons & Date Indicator */}
            <div className="flex items-center space-x-2.5 space-x-reverse shrink-0">
              <motion.div whileTap={{ scale: 0.94 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative bg-canvas-cream border-ink-black/10 hover:bg-ink-black hover:text-canvas-cream rounded-xl h-9 w-9"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#CF4500] rounded-full ring-2 ring-lifted-cream" />
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.94 }}>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-canvas-cream border-ink-black/10 hover:bg-ink-black hover:text-canvas-cream rounded-xl h-9 w-9"
                >
                  <Moon className="w-4 h-4" />
                </Button>
              </motion.div>

              <div className="hidden md:flex items-center space-x-2 space-x-reverse px-3.5 py-1.5 h-9 rounded-xl bg-canvas-cream border border-ink-black/10 text-ink-black text-xs font-semibold whitespace-nowrap shrink-0 shadow-xs">
                <CalendarIcon className="w-3.5 h-3.5 text-[#CF4500] shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
