/**
 * Format a Date as YYYY-MM-DD using its LOCAL calendar date.
 *
 * `Date#toISOString()` converts to UTC first, which silently shifts the
 * date by a day whenever local time is near midnight and the timezone
 * offset crosses a day boundary — e.g. a pilgrim in Uganda (UTC+3) picking
 * "today" between 00:00 and 03:00 local time would have it saved as
 * yesterday. Every booking date and date filter in this app needs the day
 * the user actually picked, not UTC's version of it.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
