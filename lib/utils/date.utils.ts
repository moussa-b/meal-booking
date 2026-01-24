/**
 * Date utility functions for weekly menu management
 */

/**
 * Returns the Monday of the week for a given date
 * @param date - The date to get the Monday for
 * @returns The Monday date of that week
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Checks if a date is a Monday
 * @param date - The date to check
 * @returns True if the date is a Monday, false otherwise
 */
export function isMonday(date: Date): boolean {
  const d = new Date(date);
  return d.getDay() === 1; // 1 = Monday
}

/**
 * Calculates the week number in the year (ISO week number)
 * @param date - The date to get the week number for
 * @returns The week number (1-53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week1 = getMonday(jan4);
  const weekNum = Math.ceil((((d.getTime() - week1.getTime()) / 86400000) + 1) / 7);
  return weekNum;
}

/**
 * Extracts the year from a date
 * @param date - The date to extract the year from
 * @returns The year (e.g., 2024)
 */
export function getYear(date: Date): number {
  return new Date(date).getFullYear();
}

/**
 * Formats a date as YYYY-MM-DD string using local timezone
 * This preserves the date part without timezone conversion issues
 * @param date - The date to format
 * @returns The date string in YYYY-MM-DD format (e.g., "2026-02-02")
 */
export function formatDateLocal(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date as a localized date string in French format
 * @param date - The date to format
 * @returns The formatted date string (e.g., "24 janvier 2026")
 */
export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
