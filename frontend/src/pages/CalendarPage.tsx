import { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Plus,
  X,
  CalendarPlus,
  Clock,
  Building2
} from 'lucide-react';
import { useGetEventsQuery } from '../store/api/eventApi.js';
import { IServiceEvent } from '../types/api.js';
import { downloadAppleIcsFile, getEventTypeHebrew } from '../utils/calendarExport.js';
import { useNavigate } from 'react-router-dom';

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

  const getEventBadgeStyle = (type: IServiceEvent['type'], status: IServiceEvent['status']) => {
    if (status === 'Cancelled') {
      return 'bg-red-500/10 text-red-400 border border-red-500/20 line-through';
    }
    if (status === 'Completed') {
      return 'bg-zinc-800 text-zinc-300 border border-zinc-700/60 opacity-80';
    }

    switch (type) {
      case 'DJ Gig':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold';
      case 'Software Development':
        return 'bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold';
      case 'Maintenance':
        return 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold';
      case 'Consulting':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold';
      default:
        return 'bg-zinc-800 text-zinc-200 border border-zinc-700';
    }
  };

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <div className="space-y-6 text-zinc-100 pb-6">
      {/* Header Row & Month Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800/80">
        <div className="text-right">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            <span>יומן אירועים חודשי</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">תצוגת לוח שנה מלאה למעקב אחר הופעות, פרויקטים ומשימות</p>
        </div>

        {/* Navigation & Action Controls */}
        <div className="flex items-center space-x-2 space-x-reverse self-start sm:self-auto">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            היום
          </button>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="חודש קודם"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white min-w-[100px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="חודש הבא"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/events')}
            className="flex items-center space-x-1.5 space-x-reverse bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-3.5 py-1.5 rounded-lg shadow-md shadow-indigo-500/20 transition-all text-xs border border-indigo-400/20 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>תזמן אירוע</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl shadow-md shadow-black/40 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-zinc-950/90 border-b border-zinc-800/80 text-center py-2.5 text-xs font-bold text-zinc-400">
          {dayNames.map((name, idx) => (
            <div key={idx} className="truncate">
              {name}
            </div>
          ))}
        </div>

        {/* Calendar Days Cells */}
        {isLoading ? (
          <div className="p-20 text-center text-zinc-400 text-xs">טוען יומן אירועים...</div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-x-reverse divide-zinc-800/60 text-right">
            {calendarDays.map(({ date: dayDate, isCurrentMonth }, idx) => {
              const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateKey] || [];
              const today = isToday(dayDate);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayEvents({ date: dayDate, events: dayEvents })}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer group ${
                    isCurrentMonth ? 'bg-zinc-900/40 hover:bg-zinc-800/50' : 'bg-zinc-950/60 opacity-40 hover:opacity-70'
                  } ${today ? 'ring-1 ring-indigo-500/80 bg-indigo-500/5' : ''}`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        today
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : isCurrentMonth
                          ? 'text-zinc-300'
                          : 'text-zinc-500'
                      }`}
                    >
                      {dayDate.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
                        {dayEvents.length} אירועים
                      </span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none flex-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev._id}
                        className={`text-[10px] px-1.5 py-1 rounded truncate border ${getEventBadgeStyle(
                          ev.type,
                          ev.status
                        )}`}
                      >
                        <span className="font-bold">{getEventTypeHebrew(ev.type)}</span>
                        <span className="opacity-80 font-normal"> • {typeof ev.client === 'object' ? ev.client?.name : 'לקוח'}</span>
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-zinc-400 font-semibold text-left pl-1">
                        +{dayEvents.length - 3} נוספים...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Inspector Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setSelectedDayEvents(null)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-400" />
                  <span>אירועים ליום {selectedDayEvents.date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">פירוט מלא של האירועים והמשימות ביום זה</p>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDayEvents.events.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/40 text-center space-y-2">
                <CalendarDays className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">אין אירועים מתוכננים ביום זה</p>
                <button
                  onClick={() => {
                    setSelectedDayEvents(null);
                    navigate('/events');
                  }}
                  className="mt-2 text-xs text-indigo-400 hover:underline font-semibold"
                >
                  + תזמן אירוע ליום זה
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedDayEvents.events.map((ev) => (
                  <div
                    key={ev._id}
                    className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 border ${getEventBadgeStyle(ev.type, ev.status)}`}>
                          {getEventTypeHebrew(ev.type)}
                        </span>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{typeof ev.client === 'object' ? ev.client?.name : 'לקוח כללי'}</span>
                        </h4>
                      </div>

                      <button
                        onClick={() => downloadAppleIcsFile(ev)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5 transition-colors shrink-0"
                        title="ייצא ל-Apple Calendar"
                      >
                        <CalendarPlus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Apple Calendar</span>
                      </button>
                    </div>

                    {ev.description && (
                      <p className="text-xs text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800/80">
                        {ev.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{new Date(ev.date).toLocaleDateString('he-IL')}</span>
                      </div>
                      <span className="font-semibold text-zinc-300">
                        סטטוס: {ev.status === 'Scheduled' ? 'מתוכנן' : ev.status === 'Completed' ? 'הושלם' : 'בוטל'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
