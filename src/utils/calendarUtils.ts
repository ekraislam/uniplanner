import type { Assessment, Course } from '../types';

/**
 * Formats a YYYY-MM-DD date string into iCalendar date format (YYYYMMDD).
 */
function toIcsDate(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Calculates next day string formatted as YYYYMMDD for inclusive all-day iCal events.
 */
function getNextDayIcsDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return toIcsDate(dateStr);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const nextDay = new Date(Date.UTC(year, month, day + 1));
  const ny = nextDay.getUTCFullYear();
  const nm = String(nextDay.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(nextDay.getUTCDate()).padStart(2, '0');
  return `${ny}${nm}${nd}`;
}

/**
 * Escapes special characters for iCalendar text fields (RFC 5545).
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an iCalendar (.ics) VEVENT block for an assessment.
 */
function createVEventBlock(
  assessment: Assessment,
  course?: Course,
  nowIso = new Date().toISOString()
): string {
  if (!assessment.dueDate || !assessment.dueDate.trim()) return '';

  const startDate = toIcsDate(assessment.dueDate);
  const endDate = getNextDayIcsDate(assessment.dueDate);
  const stamp = nowIso.replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `uniplanner-${assessment.id}@uniplanner.app`;

  const summary = escapeIcsText(`[${assessment.courseCode}] ${assessment.title}`);
  const description = escapeIcsText(
    `Course: ${assessment.courseCode} ${course?.name ? `(${course.name})` : ''}\n` +
      `Type: ${assessment.type}\n` +
      `Priority: ${(assessment.priority || 'medium').toUpperCase()}\n` +
      `Max Marks: ${assessment.maxMarks}\n` +
      (assessment.description ? `Notes: ${assessment.description}\n` : '') +
      `\nTracked via UniPlanner Student Workspace`
  );

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `CATEGORIES:ACADEMIC,${escapeIcsText(assessment.type.toUpperCase())}`,
    'STATUS:CONFIRMED',
    // 24-hour advance alarm reminder
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Upcoming: [${assessment.courseCode}] ${assessment.title} is due tomorrow!`)}`,
    'END:VALARM',
    // Morning of due date alarm (2 hours before typical 10:00 AM class)
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Today Deadline: [${assessment.courseCode}] ${assessment.title}`)}`,
    'END:VALARM',
    'END:VEVENT',
  ].join('\r\n');
}

/**
 * Generates a full .ics file for a single assessment.
 */
export function generateAssessmentIcs(assessment: Assessment, course?: Course): string {
  const event = createVEventBlock(assessment, course);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniPlanner//Academic Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    event,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Generates a full .ics file containing all upcoming assessments for calendar sync.
 */
export function generateSemesterScheduleIcs(
  assessments: Assessment[],
  courses: Course[],
  termName = 'Semester'
): string {
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const events = assessments
    .filter((a) => a.dueDate && a.dueDate.trim() !== '')
    .map((a) => createVEventBlock(a, courseMap.get(a.courseId)))
    .filter(Boolean)
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniPlanner//Academic Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:UniPlanner ${escapeIcsText(termName)} Schedule`,
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a native file download in the browser for an .ics calendar file.
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a 1-click Google Calendar web creation URL for an assessment.
 */
export function getGoogleCalendarUrl(assessment: Assessment, course?: Course): string {
  if (!assessment.dueDate || !assessment.dueDate.trim()) return '';

  const startDate = toIcsDate(assessment.dueDate);
  const endDate = getNextDayIcsDate(assessment.dueDate);
  const title = `[${assessment.courseCode}] ${assessment.title}`;
  const details =
    `Course: ${assessment.courseCode} ${course?.name ? `(${course.name})` : ''}\n` +
    `Type: ${assessment.type}\n` +
    `Priority: ${(assessment.priority || 'medium').toUpperCase()}\n` +
    `Max Marks: ${assessment.maxMarks}\n` +
    (assessment.description ? `Notes: ${assessment.description}\n` : '') +
    `\nTracked in UniPlanner`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate}/${endDate}`,
    details,
    location: course?.name || 'University Campus',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
