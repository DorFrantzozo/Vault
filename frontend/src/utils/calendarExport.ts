import { IServiceEvent } from '../types/api.js';

export const getEventTypeHebrew = (t: IServiceEvent['type']) => {
  switch (t) {
    case 'DJ Gig':
      return 'תקליטנות (DJ)';
    case 'Software Development':
      return 'פיתוח תוכנה';
    case 'Maintenance':
      return 'תחזוקה';
    case 'Consulting':
      return 'ייעוץ';
    default:
      return t;
  }
};

/**
 * Generates and triggers an immediate download of an .ics file
 * Native format for Apple Calendar (iPhone / iPad / Mac) and Outlook
 */
export const downloadAppleIcsFile = (evt: IServiceEvent) => {
  const clientName = typeof evt.client === 'object' ? evt.client?.name : 'לקוח כללי';
  const eventTitle = `${getEventTypeHebrew(evt.type)} - ${clientName}`;
  const description = evt.description || `אירוע ${getEventTypeHebrew(evt.type)} מול ${clientName}`;

  const startDate = new Date(evt.date);
  // Default duration 3 hours
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatDateForIcs = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FinOps Platform//NONSGML Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${eventTitle}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `DTSTART:${formatDateForIcs(startDate)}`,
    `DTEND:${formatDateForIcs(endDate)}`,
    `STATUS:${evt.status === 'Completed' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `event-${evt._id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates a direct Google Calendar creation web URL
 */
export const getGoogleCalendarUrl = (evt: IServiceEvent) => {
  const clientName = typeof evt.client === 'object' ? evt.client?.name : 'לקוח כללי';
  const eventTitle = `${getEventTypeHebrew(evt.type)} - ${clientName}`;
  const description = evt.description || `אירוע ${getEventTypeHebrew(evt.type)} מול ${clientName}`;

  const startDate = new Date(evt.date);
  const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    details: description,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
