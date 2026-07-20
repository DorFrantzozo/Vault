import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Plus,
  CalendarPlus,
  Clock,
  Building2
} from 'lucide-react';
import { useGetEventsQuery } from '../store/api/eventApi.js';
import { IServiceEvent } from '../types/api.js';
import { downloadAppleIcsFile, getEventTypeHebrew } from '../utils/calendarExport.js';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Card, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: IServiceEvent[] } | null>(null);

  const { data: eventsData, isLoading } = useGetEventsQuery();
  const events = eventsData?.data?.events || [];

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  // Compute Calendar Grid Days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Group events by date string YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, IServiceEvent[]> = {};
    events.forEach((ev) => {
      const d = new Date(ev.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getEventBadgeStyle = (_type: IServiceEvent['type'], status: IServiceEvent['status']) => {
    if (status === 'Cancelled') {
      return 'bg-[#CF4500]/10 text-[#CF4500] border border-[#CF4500]/20 line-through';
    }
    if (status === 'Completed') {
      return 'bg-canvas-cream text-[slate-gray] border border-[ink-black]/10';
    }
    return 'bg-[ink-black] text-white';
  };

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 text-[ink-black] pb-8 font-sans"
    >
      {/* Header Row & Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[ink-black]/10">
        <div className="text-right">
          <h1 className="text-2.5xl sm:text-3xl font-medium tracking-tight text-[ink-black] font-heading flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[ink-black]" />
            <span>יומן אירועים חודשי</span>
          </h1>
          <p className="text-xs text-[slate-gray] mt-1 font-sans">תצוגת לוח שנה מלאה למעקב אחר הופעות, פרויקטים ומשימות</p>
        </div>

        {/* Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={goToToday} className="flex-1 sm:flex-initial">
              היום
            </Button>

            <div className="flex items-center justify-between bg-lifted-cream border border-[ink-black]/20 rounded-xl px-2 py-1 shadow-xs flex-1 sm:flex-initial">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevMonth}
                title="חודש קודם"
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="px-2 text-xs font-bold text-[ink-black] min-w-[100px] text-center font-heading">
                {monthLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextMonth}
                title="חודש הבא"
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Button variant="default" onClick={() => navigate('/events')} className="w-full justify-center">
              <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
              <span>תזמן אירוע</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <Card className="p-3 sm:p-5 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-canvas-cream border-b border-[ink-black]/10 text-center py-2.5 text-[11px] sm:text-xs font-bold text-[slate-gray] uppercase tracking-wider rounded-t-xl mb-2 font-heading">
          {dayNames.map((name, idx) => (
            <div key={idx} className="truncate">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Days Cells */}
        {isLoading ? (
          <div className="p-20 text-center text-[slate-gray] text-xs font-medium">טוען יומן אירועים...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-right">
            {calendarDays.map(({ date: dayDate, isCurrentMonth }, idx) => {
              const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateKey] || [];
              const today = isToday(dayDate);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayEvents({ date: dayDate, events: dayEvents })}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 sm:p-3 flex flex-col justify-between transition-all cursor-pointer rounded-xl border ${
                    isCurrentMonth
                      ? 'bg-lifted-cream hover:bg-canvas-cream/80 border-[ink-black]/10 shadow-xs'
                      : 'bg-canvas-cream/40 opacity-50 border-[ink-black]/5'
                  } ${today ? 'ring-2 ring-[ink-black] bg-lifted-cream shadow-xs' : ''}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
                        today
                          ? 'bg-[ink-black] text-white shadow-xs'
                          : isCurrentMonth
                          ? 'text-[ink-black]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0.5 font-semibold">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 overflow-y-auto max-h-[75px] sm:max-h-[85px] scrollbar-none flex-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev._id}
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 sm:py-1 rounded-lg truncate font-semibold shadow-xs ${getEventBadgeStyle(ev.type, ev.status)}`}
                      >
                        <span>{getEventTypeHebrew(ev.type)}</span>
                      </div>
                    ))}

                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-[slate-gray] font-bold text-left pl-1">
                        +{dayEvents.length - 2} נוספים...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Day Inspector Dialog */}
      <Dialog open={!!selectedDayEvents} onOpenChange={() => setSelectedDayEvents(null)}>
        {selectedDayEvents && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[ink-black]" />
                <span>אירועים ליום {selectedDayEvents.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </DialogTitle>
              <CardDescription>פירוט מלא של האירועים והמשימות ביום זה</CardDescription>
            </DialogHeader>

            {selectedDayEvents.events.length === 0 ? (
              <div className="p-8 border border-dashed border-[ink-black]/15 rounded-xl bg-canvas-cream/50 text-center space-y-2">
                <CalendarDays className="w-8 h-8 text-[slate-gray] mx-auto" />
                <p className="text-xs text-[slate-gray] font-medium">אין אירועים מתוכננים ביום זה</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedDayEvents(null);
                    navigate('/events');
                  }}
                  className="text-xs text-[#CF4500]"
                >
                  + תזמן אירוע ליום זה
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedDayEvents.events.map((ev) => (
                  <div
                    key={ev._id}
                    className="p-4 rounded-xl bg-canvas-cream/60 border border-[ink-black]/10 shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="default" className="mb-1 text-[10px]">
                          {getEventTypeHebrew(ev.type)}
                        </Badge>
                        <h4 className="text-sm font-bold text-[ink-black] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[slate-gray]" />
                          <span>{typeof ev.client === 'object' ? ev.client?.name : 'לקוח כללי'}</span>
                        </h4>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAppleIcsFile(ev)}
                        title="ייצא ל-Apple Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-[#CF4500] ml-1" />
                        <span>Apple Calendar</span>
                      </Button>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-[ink-black] bg-lifted-cream p-3 rounded-lg border border-[ink-black]/10">
                        {ev.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[slate-gray] pt-1 border-t border-[ink-black]/10">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[slate-gray]" />
                        <span>{new Date(ev.date).toLocaleDateString('he-IL')}</span>
                      </div>
                      <span className="font-semibold text-[ink-black]">
                        סטטוס: {ev.status === 'Scheduled' ? 'מתוכנן' : ev.status === 'Completed' ? 'הושלם' : 'בוטל'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[ink-black]/10 flex justify-end">
              <Button variant="dark" onClick={() => setSelectedDayEvents(null)}>
                סגור
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}

