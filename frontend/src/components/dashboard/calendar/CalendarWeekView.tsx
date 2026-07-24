import React, { useMemo, useEffect, useState } from 'react';
import { IServiceEvent } from '../../../types/api';
import { calculateDayLayout, getModernEventStyle } from './utils';
import { EventTooltip } from './EventTooltip';
import { startOfWeek, addDays, isSameDay } from 'date-fns';
import { getEventTypeHebrew } from '../../../utils/calendarExport';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: IServiceEvent[];
  onEventClick: (event: IServiceEvent) => void;
  onSlotClick: (date: Date) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_IN_WEEK = 7;

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  onEventDrop,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const weekDays = useMemo(() => {
    // Assuming week starts on Sunday (0) which is standard in IL
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    const newDate = new Date(
      targetDay.getFullYear(),
      targetDay.getMonth(),
      targetDay.getDate(),
      hour,
      0,
      0
    );
    
    onEventDrop(eventId, newDate);
  };

  const currentTimePercentage = ((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 100;

  return (
    <div className="flex flex-col h-[700px] overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-sm relative">
      {/* Week Header */}
      <div className="flex bg-gray-50/80 sticky top-0 z-20 border-b border-gray-100 backdrop-blur-sm">
        <div className="w-12 sm:w-16 border-l border-gray-100" /> {/* Time column spacer */}
        {weekDays.map((day, i) => (
          <div key={i} className="flex-1 text-center py-3 px-1 border-l border-gray-100 last:border-l-0">
            <div className="text-xs text-gray-500 font-medium mb-1">
              {day.toLocaleDateString('he-IL', { weekday: 'short' })}
            </div>
            <div
              className={`text-sm sm:text-base font-bold w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                isSameDay(day, currentTime) ? 'bg-red-50 text-red-600' : 'text-gray-800'
              }`}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="flex flex-1 relative bg-white min-h-[1440px]">
        {/* Time Labels */}
        <div className="w-12 sm:w-16 flex flex-col border-l border-gray-100 bg-gray-50/30">
          {HOURS.map((hour) => (
            <div
              key={`label-${hour}`}
              className="flex-1 h-[60px] text-[9px] sm:text-[10px] text-gray-400 font-medium text-center py-2"
            >
              {`${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        {weekDays.map((day, dayIndex) => {
          const layoutEvents = calculateDayLayout(events, day);
          const isToday = isSameDay(day, currentTime);

          return (
            <div key={dayIndex} className="flex-1 relative border-l border-gray-100 last:border-l-0">
              {/* Grid Cells & Drop Zones */}
              {HOURS.map((hour) => (
                <div
                  key={`grid-${dayIndex}-${hour}`}
                  className="h-[60px] border-b border-gray-50 transition-colors hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => {
                    const slotTime = new Date(day);
                    slotTime.setHours(hour, 0, 0, 0);
                    onSlotClick(slotTime);
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day, hour)}
                />
              ))}

              {/* Current Time Indicator */}
              {isToday && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-400 z-30 pointer-events-none"
                  style={{ top: `${currentTimePercentage}%` }}
                >
                  <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-400 rounded-full" />
                </div>
              )}

              {/* Render Events */}
              {layoutEvents.map((ev) => (
                <div
                  key={ev._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, ev._id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(ev);
                  }}
                  className={`absolute z-10 p-1 ${getModernEventStyle(ev.type, ev.status, typeof ev.client === 'object' ? ev.client?.color : undefined)}`}
                  style={{
                    top: `${ev.top}%`,
                    height: `${Math.max(ev.height, 2.5)}%`,
                    left: `${ev.left}%`,
                    width: `${ev.width}%`,
                  }}
                >
                  <EventTooltip event={ev}>
                    <div className="h-full flex flex-col pointer-events-none">
                      <span className="font-bold truncate text-[9px] sm:text-[10px] mb-0.5">
                        {getEventTypeHebrew(ev.type)}
                      </span>
                      <span className="truncate opacity-80 text-[9px] sm:text-[10px] hidden sm:block">
                        {typeof ev.client === 'object' ? ev.client?.name : ''}
                      </span>
                    </div>
                  </EventTooltip>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
