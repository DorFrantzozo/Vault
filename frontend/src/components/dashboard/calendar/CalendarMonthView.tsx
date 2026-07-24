import React, { useMemo } from 'react';
import { IServiceEvent } from '../../../types/api';
import { getModernEventStyle, parseSafeDate } from './utils';
import { EventTooltip } from './EventTooltip';
import { isSameDay, format } from 'date-fns';
import { getEventTypeHebrew } from '../../../utils/calendarExport';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: IServiceEvent[];
  onEventClick: (event: IServiceEvent) => void;
  onSlotClick: (date: Date) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  onEventDrop,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  const eventsByDate = useMemo(() => {
    const map: Record<string, IServiceEvent[]> = {};
    events.forEach((ev) => {
      const d = parseSafeDate(ev.date);
      const key = format(d, 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    // Sort events in each day by time
    Object.values(map).forEach(dayEvents => {
      dayEvents.sort((a, b) => parseSafeDate(a.date).getTime() - parseSafeDate(b.date).getTime());
    });
    return map;
  }, [events]);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    // Default to 12:00 PM if dropped on a month view day
    // A better UX would be to keep the original time and just change the date, 
    // but without storing the original time separately, we have to either parse it from the old event 
    // or just set a default time. Let's find the original event from the `events` array to keep its time.
    const originalEvent = events.find(ev => ev._id === eventId);
    let hours = 12;
    let mins = 0;
    
    if (originalEvent) {
      const origDate = parseSafeDate(originalEvent.date);
      hours = origDate.getHours();
      mins = origDate.getMinutes();
    }

    const newDate = new Date(
      targetDay.getFullYear(),
      targetDay.getMonth(),
      targetDay.getDate(),
      hours,
      mins,
      0
    );
    
    onEventDrop(eventId, newDate);
  };

  const today = new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Days of Week Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
        {dayNames.map((name, idx) => (
          <div key={idx} className="truncate">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {calendarDays.map(({ date: dayDate, isCurrentMonth }, idx) => {
          const dateKey = format(dayDate, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = isSameDay(dayDate, today);

          return (
            <div
              key={idx}
              className={`min-h-[120px] p-1 sm:p-2 flex flex-col transition-colors border-b border-l border-gray-100 last:border-l-0 ${
                !isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dayDate)}
              onClick={() => {
                const slotTime = new Date(dayDate);
                slotTime.setHours(12, 0, 0, 0); // Default to noon for month view clicks
                onSlotClick(slotTime);
              }}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span
                  className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-red-500 text-white shadow-sm'
                      : isCurrentMonth
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  }`}
                >
                  {dayDate.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-semibold hidden sm:block">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Events Container */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div
                    key={ev._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ev._id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(ev);
                    }}
                    className={`truncate text-right ${getModernEventStyle(ev.type, ev.status, typeof ev.client === 'object' ? ev.client?.color : undefined)}`}
                  >
                    <EventTooltip event={ev}>
                      <span className="font-semibold block truncate">
                        {format(parseSafeDate(ev.date), 'HH:mm')} {getEventTypeHebrew(ev.type)}
                      </span>
                    </EventTooltip>
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-gray-500 font-medium text-center py-0.5 bg-gray-50 rounded-md mt-auto cursor-pointer hover:bg-gray-100 transition-colors">
                    +{dayEvents.length - 3} נוספים
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
