import { useState } from 'react';
import { CalendarDays, LayoutGrid, Rows, AlignJustify } from 'lucide-react';
import { useUpdateEventMutation } from '../../store/api/eventApi.js';
import { IServiceEvent } from '../../types/api.js';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '../ui/card';
import { Button } from '../ui/button';

import { CalendarMonthView } from '../dashboard/calendar/CalendarMonthView';
import { CalendarWeekView } from '../dashboard/calendar/CalendarWeekView';
import { CalendarDayView } from '../dashboard/calendar/CalendarDayView';
import { QuickEventModal } from '../dashboard/calendar/QuickEventModal';

type CalendarView = 'month' | 'week' | 'day';

interface EventsCalendarPanelProps {
  events: IServiceEvent[];
  isLoading?: boolean;
}

export function EventsCalendarPanel({ events, isLoading = false }: EventsCalendarPanelProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IServiceEvent | null>(null);

  const [updateEvent] = useUpdateEventMutation();

  // Navigation
  const navigateDate = (direction: 1 | -1) => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (view === 'month') next.setMonth(next.getMonth() + direction);
      if (view === 'week') next.setDate(next.getDate() + (direction * 7));
      if (view === 'day') next.setDate(next.getDate() + direction);
      return next;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthLabel = currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
  const weekLabel = `שבוע של ${currentDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}`;

  const handleSlotClick = (date: Date) => {
    setSelectedEvent(null);
    setSelectedSlotDate(date);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: IServiceEvent) => {
    setSelectedSlotDate(null);
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleEventDrop = async (eventId: string, newDate: Date) => {
    try {
      await updateEvent({
        id: eventId,
        date: newDate.toISOString(),
      }).unwrap();
    } catch (err) {
      console.error('Failed to update event via drag and drop', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Toggles & Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4">
        <div className="flex items-center p-1 bg-canvas-cream rounded-full shadow-inner">
          <button
            onClick={() => setView('month')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              view === 'month' ? 'bg-white shadow-sm text-ink-black' : 'text-slate-gray hover:text-ink-black'
            }`}
          >
            <LayoutGrid className="w-4 h-4 mx-auto mb-1 hidden sm:block" />
            חודש
          </button>
          <button
            onClick={() => setView('week')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              view === 'week' ? 'bg-white shadow-sm text-ink-black' : 'text-slate-gray hover:text-ink-black'
            }`}
          >
            <Rows className="w-4 h-4 mx-auto mb-1 hidden sm:block" />
            שבוע
          </button>
          <button
            onClick={() => setView('day')}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
              view === 'day' ? 'bg-white shadow-sm text-ink-black' : 'text-slate-gray hover:text-ink-black'
            }`}
          >
            <AlignJustify className="w-4 h-4 mx-auto mb-1 hidden sm:block" />
            יום
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <Button variant="outline" onClick={goToToday} className="flex-1 sm:flex-initial">
            היום
          </Button>

          <div className="flex items-center bg-white border border-dust-taupe rounded-full px-1 py-1 shadow-sm flex-1 sm:flex-initial justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} className="h-8 w-8">
              <span className="text-xl leading-none">&rsaquo;</span>
            </Button>
            <span className="px-3 text-xs font-bold text-ink-black min-w-[120px] text-center font-heading">
              {view === 'month' ? monthLabel : view === 'week' ? weekLabel : currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="h-8 w-8">
              <span className="text-xl leading-none">&lsaquo;</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <Card className="p-0 border-0 shadow-none bg-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px] bg-white rounded-2xl border border-dust-taupe shadow-sm">
            <div className="text-slate-gray font-medium animate-pulse flex flex-col items-center">
              <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
              טוען יומן...
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={view + currentDate.toISOString()}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'month' && (
                <CalendarMonthView
                  currentDate={currentDate}
                  events={events}
                  onEventClick={handleEventClick}
                  onSlotClick={handleSlotClick}
                  onEventDrop={handleEventDrop}
                />
              )}
              {view === 'week' && (
                <CalendarWeekView
                  currentDate={currentDate}
                  events={events}
                  onEventClick={handleEventClick}
                  onSlotClick={handleSlotClick}
                  onEventDrop={handleEventDrop}
                />
              )}
              {view === 'day' && (
                <CalendarDayView
                  currentDate={currentDate}
                  events={events}
                  onEventClick={handleEventClick}
                  onSlotClick={handleSlotClick}
                  onEventDrop={handleEventDrop}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </Card>

      <QuickEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedSlotDate}
        existingEvent={selectedEvent}
      />
    </div>
  );
}
