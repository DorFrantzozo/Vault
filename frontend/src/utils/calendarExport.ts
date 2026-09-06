import {parseISO} from "date-fns";
import {IServiceEvent} from "../types/api.js";

export const getEventTypeHebrew = (t: IServiceEvent["type"]) => {
  switch (t) {
    case "DJ Gig":
      return "תקליטנות (DJ)";
    case "Software Development":
      return "פיתוח תוכנה";
    case "Maintenance":
      return "תחזוקה";
    case "Consulting":
      return "ייעוץ";
    default:
      return t;
  }
};

/** Default length of an exported event when no end time is recorded. */
const DEFAULT_DURATION_HOURS = 3;

/**
 * Title, description and the exact start/end instants of an event.
 * The stored date carries the hour the user picked, so both calendars
 * receive the real start time instead of a midnight placeholder.
 */
const getEventDetails = (evt: IServiceEvent) => {
  const clientName =
    typeof evt.client === "object" ? evt.client?.name : "לקוח כללי";
  const start = parseISO(evt.date);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);

  return {
    title: `${getEventTypeHebrew(evt.type)} - ${clientName}`,
    description:
      evt.description ||
      `אירוע ${getEventTypeHebrew(evt.type)} מול ${clientName}`,
    start,
    end,
  };
};

/** UTC basic format (YYYYMMDDTHHMMSSZ) — calendars convert it back to local time. */
const formatUtcStamp = (date: Date) =>
  date.toISOString().replace(/[-:]|\.\d+/g, "");

/** RFC 5545 escaping: a comma or semicolon in free text would end the property. */
const escapeIcsText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/**
 * Generates and triggers an immediate download of an .ics file
 * Native format for Apple Calendar (iPhone / iPad / Mac) and Outlook
 */
export const downloadAppleIcsFile = (evt: IServiceEvent) => {
  const {title, description, start, end} = getEventDetails(evt);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vault Platform//NONSGML Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evt._id}@vault-platform`,
    `DTSTAMP:${formatUtcStamp(new Date())}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `DTSTART:${formatUtcStamp(start)}`,
    `DTEND:${formatUtcStamp(end)}`,
    `STATUS:${evt.status === "Completed" ? "CONFIRMED" : "TENTATIVE"}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], {type: "text/calendar;charset=utf-8"});
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `event-${evt._id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

/**
 * Generates a direct Google Calendar creation web URL
 */
export const getGoogleCalendarUrl = (evt: IServiceEvent) => {
  const {title, description, start, end} = getEventDetails(evt);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: description,
    dates: `${formatUtcStamp(start)}/${formatUtcStamp(end)}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
