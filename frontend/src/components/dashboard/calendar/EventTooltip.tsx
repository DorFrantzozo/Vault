import React, { useState, useRef, useEffect } from 'react';
import { IServiceEvent } from '../../../types/api';
import { Clock, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { parseSafeDate } from './utils';
import { AnimatePresence, motion } from 'framer-motion';
import { getEventTypeHebrew } from '../../../utils/calendarExport';

interface EventTooltipProps {
  event: IServiceEvent;
  children: React.ReactNode;
}

export const EventTooltip: React.FC<EventTooltipProps> = ({ event, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 400); // 400ms delay for tooltip
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const eventDate = parseSafeDate(event.date);

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white border border-gray-100 shadow-xl rounded-xl text-left pointer-events-none flex flex-col gap-2"
            style={{ direction: 'rtl' }}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 rounded-md text-gray-700">
                {getEventTypeHebrew(event.type)}
              </span>
              {event.status === 'Completed' && (
                <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                  הושלם
                </span>
              )}
            </div>

            <div className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {typeof event.client === 'object' ? event.client?.name : 'לקוח כללי'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(eventDate, 'HH:mm')}</span>
              </div>
            </div>

            {event.description && (
              <p className="text-xs text-gray-600 border-t border-gray-50 pt-2 mt-1 line-clamp-2">
                {event.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
