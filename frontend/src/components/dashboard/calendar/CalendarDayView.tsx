import React, { useMemo, useEffect, useState } from 'react';
import { IServiceEvent } from '../../../types/api';
import { calculateDayLayout, getModernEventStyle } from './utils';
import { EventTooltip } from './EventTooltip';
import { format, isSameDay } from 'date-fns';
import { getEventTypeHebrew } from '../../../utils/calendarExport';

interface CalendarDayViewProps {
  currentDate: Date;
  events: IServiceEvent[];
  onEventClick: (event: IServiceEvent) => void;
  onSlotClick: (date: Date) => void;
  onEventDrop: (eventId: string, newDate: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  currentDate,
  events,
  onEventClick,
  onSlotClick,
  onEventDrop,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-update current time line
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const layoutEvents = useMemo(() => {
    return calculateDayLayout(events, currentDate);
  }, [events, currentDate]);

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (!eventId) return;

    // Create a new Date object for the dropped slot (using current date's year/month/day and the target hour)
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      hour,
      0,
      0
    );
    
    onEventDrop(eventId, newDate);
  };

  const isToday = isSameDay(currentDate, currentTime);
  const currentTimePercentage = ((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 100;

  return (
    <div className="flex flex-col h-[700px] overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-sm relative">
      <div className="flex bg-gray-50/80 sticky top-0 z-20 border-b border-gray-100 backdrop-blur-sm p-4">
        <h2 className="text-xl font-bold text-gray-800 flex flex-col items-center justify-center w-full">
          <span className="text-sm text-gray-500 font-normal">
            {currentDate.toLocaleDateString('he-IL', { weekday: 'long' })}
          </span>
          <span>{format(currentDate, 'dd/MM/yyyy')}</span>
        </h2>
      </div>

      <div className="flex flex-1 relative bg-white min-h-[1440px]">
        {/* Time Labels */}
        <div className="w-16 flex flex-col border-l border-gray-100 bg-gray-50/30">
          {HOURS.map((hour) => (
            <div
              key={`label-${hour}`}
              className="flex-1 h-[60px] text-[10px] text-gray-400 font-medium text-center py-2"
            >
              {`${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Grid Cells & Drop Zones */}
        <div className="flex-1 relative">
          {HOURS.map((hour) => (
            <div
              key={`grid-${hour}`}
              className="h-[60px] border-b border-gray-50 transition-colors hover:bg-gray-50/50 cursor-pointer"
              onClick={() => {
                const slotTime = new Date(currentDate);
                slotTime.setHours(hour, 0, 0, 0);
                onSlotClick(slotTime);
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, hour)}
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

          {/* Render Cascaded Events */}
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
                height: `${Math.max(ev.height, 2.5)}%`, // Minimum height for visibility
                left: `${ev.left}%`,
                width: `${ev.width}%`,
              }}
            >
              <EventTooltip event={ev}>
                <div className="h-full flex flex-col pointer-events-none">
                  <span className="font-bold truncate text-[10px] mb-0.5">
                    {getEventTypeHebrew(ev.type)}
                  </span>
                  <span className="truncate opacity-80 text-[10px]">
                    {typeof ev.client === 'object' ? ev.client?.name : 'לקוח כללי'}
                  </span>
                </div>
              </EventTooltip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
