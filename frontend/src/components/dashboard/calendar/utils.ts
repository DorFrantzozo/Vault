import { IServiceEvent } from '../../../types/api';
import { parseISO, startOfDay, differenceInMinutes, isSameDay } from 'date-fns';

export interface LayoutEvent extends IServiceEvent {
  top: number; // Percentage from top of day (0-100)
  height: number; // Percentage height (0-100)
  left: number; // Percentage from left (0-100)
  width: number; // Percentage width (0-100)
}

// We assume a default duration of 60 minutes for rendering events that have no end time
const DEFAULT_EVENT_DURATION_MINS = 60;

/**
 * Safely parses an ISO date string to a local Date object.
 */
export const parseSafeDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  return parseISO(dateStr);
};

/**
 * Calculates layout positions (top, height, left, width) for events occurring on the same day.
 * Ensures overlapping events are cascaded/placed side-by-side.
 */
export const calculateDayLayout = (events: IServiceEvent[], targetDate: Date): LayoutEvent[] => {
  // Filter events for the target day and map to start/end times
  const dayEvents = events.filter((ev) => isSameDay(parseSafeDate(ev.date), targetDate));
  
  if (dayEvents.length === 0) return [];

  // Map to objects with start/end minutes from start of day
  const mappedEvents = dayEvents.map(ev => {
    const start = parseSafeDate(ev.date);
    const dayStart = startOfDay(start);
    const startMins = differenceInMinutes(start, dayStart);
    // Assuming 1 hour default duration if no end time exists
    const endMins = startMins + DEFAULT_EVENT_DURATION_MINS;
    
    return {
      ...ev,
      startMins,
      endMins,
    };
  }).sort((a, b) => a.startMins - b.startMins || (b.endMins - a.endMins));

  // Overlap algorithm
  const columns: typeof mappedEvents[] = [];
  let lastEventEnding = 0;

  const positionedEvents = mappedEvents.map(ev => {
    // If this event starts after ALL previous events end, we can reset the columns
    if (columns.length > 0 && ev.startMins >= lastEventEnding) {
      columns.length = 0;
    }

    let placed = false;
    let colIndex = 0;

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const lastEventInCol = col[col.length - 1];
      if (lastEventInCol.endMins <= ev.startMins) {
        col.push(ev);
        placed = true;
        colIndex = i;
        break;
      }
    }

    if (!placed) {
      columns.push([ev]);
      colIndex = columns.length - 1;
    }

    lastEventEnding = Math.max(lastEventEnding, ev.endMins);

    return {
      event: ev,
      colIndex,
    };
  });

  const numColumns = columns.length || 1;

  return positionedEvents.map(({ event, colIndex }) => {
    // Calculate percentages for 24-hour grid (1440 mins)
    const top = (event.startMins / 1440) * 100;
    const height = ((event.endMins - event.startMins) / 1440) * 100;
    
    // Width is distributed among overlapping columns
    const width = 100 / numColumns;
    const left = colIndex * width;

    return {
      ...event,
      top,
      height,
      left,
      width,
    } as LayoutEvent;
  });
};

export const getModernEventStyle = (type: IServiceEvent['type'], status: IServiceEvent['status'], clientColor?: string) => {
  // Base style with soft rounded corners and transition
  let style = "rounded-xl text-xs p-2 transition-all duration-200 border shadow-sm hover:shadow-md cursor-pointer overflow-hidden ";
  
  if (status === 'Cancelled') {
    return style + "bg-red-50 text-red-600 border-red-200 opacity-60 line-through";
  }
  
  if (status === 'Completed') {
    return style + "bg-[#F3F2F1] text-gray-500 border-gray-200 opacity-90";
  }

  // Active styles based on client color if available, otherwise fallback to event type
  const targetColor = clientColor || (
    type === 'DJ Gig' ? 'indigo' :
    type === 'Software Development' ? 'sky' :
    type === 'Consulting' ? 'amber' :
    type === 'Maintenance' ? 'emerald' : 'slate'
  );

  switch (targetColor) {
    case 'indigo':
      return style + "bg-violet-50 text-violet-800 border-violet-200 hover:bg-violet-100 hover:border-violet-300";
    case 'sky':
      return style + "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 hover:border-sky-300";
    case 'amber':
      return style + "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300";
    case 'emerald':
      return style + "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300";
    case 'rose':
      return style + "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300";
    case 'slate':
    default:
      return style + "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100";
  }
};
