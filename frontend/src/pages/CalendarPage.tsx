import { useState } from 'react';
import {
  CalendarDays,
  Plus,
  LayoutGrid,
  Rows,
  AlignJustify
} from 'lucide-react';
import { useGetEventsQuery, useUpdateEventMutation } from '../store/api/eventApi.js';
import { IServiceEvent } from '../types/api.js';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

import { CalendarMonthView } from '../components/dashboard/calendar/CalendarMonthView';
import { CalendarWeekView } from '../components/dashboard/calendar/CalendarWeekView';
import { CalendarDayView } from '../components/dashboard/calendar/CalendarDayView';
import { QuickEventModal } from '../components/dashboard/calendar/QuickEventModal';

type CalendarView = 'month' | 'week' | 'day';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IServiceEvent | null>(null);

  const { data: eventsData, isLoading } = useGetEventsQuery();
  const events = eventsData?.data?.events || [];
  
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 sm:space-y-8 text-gray-800 pb-8 font-sans"
    >
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="text-right">
          <h1 className="text-2.5xl sm:text-3xl font-medium tracking-tight text-gray-900 font-heading flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-gray-900" />
            <span>יומן אירועים</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">נהל הופעות, פרויקטים ומשימות בקלות</p>
        </div>

        {/* View Toggles & Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full xl:w-auto">
          
          {/* View Toggles */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl shadow-inner">
            <button
              onClick={() => setView('month')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                view === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mx-auto mb-1 hidden sm:block" />
              חודש
            </button>
            <button
              onClick={() => setView('week')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                view === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Rows className="w-4 h-4 mx-auto mb-1 hidden sm:block" />
              שבוע
            </button>
            <button
              onClick={() => setView('day')}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                view === 'day' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlignJustify className="w-4 h-4 mx-auto mb-1 hidden sm:block" />
              יום
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <Button variant="outline" onClick={goToToday} className="flex-1 sm:flex-initial rounded-xl bg-white shadow-sm hover:bg-gray-50">
              היום
            </Button>

            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-1 py-1 shadow-sm flex-1 sm:flex-initial justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} className="h-8 w-8 hover:bg-gray-100 rounded-lg">
                <span className="text-xl leading-none">&rsaquo;</span>
              </Button>
              <span className="px-3 text-xs font-bold text-gray-800 min-w-[120px] text-center font-heading">
                {view === 'month' ? monthLabel : view === 'week' ? weekLabel : currentDate.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)} className="h-8 w-8 hover:bg-gray-100 rounded-lg">
                <span className="text-xl leading-none">&lsaquo;</span>
              </Button>
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Button variant="default" onClick={() => navigate('/events')} className="w-full justify-center rounded-xl shadow-md">
              <Plus className="w-4 h-4 stroke-[2.5] ml-1.5" />
              <span>תזמן אירוע</span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <Card className="p-0 border-0 shadow-none bg-transparent">
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px] bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-400 font-medium animate-pulse flex flex-col items-center">
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
    </motion.div>
  );
}

