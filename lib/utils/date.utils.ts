/**
 * Date utility functions for weekly menu management
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Day of week enum
 * Represents the days of the week (0 = Monday, 6 = Sunday)
 */
export enum DayOfWeek {
  MONDAY = 0,
  TUESDAY = 1,
  WEDNESDAY = 2,
  THURSDAY = 3,
  FRIDAY = 4,
  SATURDAY = 5,
  SUNDAY = 6,
}

// Day name mapping (capitalized for display)
export const DAY_LABELS: Record<number, string> = {
  [DayOfWeek.MONDAY]: 'Lundi',
  [DayOfWeek.TUESDAY]: 'Mardi',
  [DayOfWeek.WEDNESDAY]: 'Mercredi',
  [DayOfWeek.THURSDAY]: 'Jeudi',
  [DayOfWeek.FRIDAY]: 'Vendredi',
  [DayOfWeek.SATURDAY]: 'Samedi',
  [DayOfWeek.SUNDAY]: 'Dimanche',
};

export const DAY_LABELS_SHORT: Record<number, string> = {
  [DayOfWeek.MONDAY]: 'Lun',
  [DayOfWeek.TUESDAY]: 'Mar',
  [DayOfWeek.WEDNESDAY]: 'Mer',
  [DayOfWeek.THURSDAY]: 'Jeu',
  [DayOfWeek.FRIDAY]: 'Ven',
  [DayOfWeek.SATURDAY]: 'Sam',
  [DayOfWeek.SUNDAY]: 'Dim',
};

export const DEFAULT_DAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY];

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
 * Returns the Monday of the week following the given date
 * @param date - The date to get the next Monday for
 * @returns The Monday date of the next week
 */
export function getNextMonday(date: Date): Date {
  const next = new Date(getMonday(date));
  next.setDate(next.getDate() + 7);
  return next;
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

/**
 * Formats a day with full date (e.g., "Lundi 19 janvier")
 * @param weekStartDate - The Monday date of the week
 * @param dayOfWeek - The day of week (0 = Monday, 1 = Tuesday, etc.)
 * @returns The formatted day string (e.g., "Lundi 19 janvier")
 */
export function formatDayWithDate(weekStartDate: Date, dayOfWeek: number): string {
  const date = new Date(weekStartDate);
  // Add days to get to the specific day (Monday is day 0, so add dayOfWeek days)
  date.setDate(date.getDate() + dayOfWeek);

  const dayName = DAY_LABELS[dayOfWeek] || `Jour ${dayOfWeek}`;
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });

  return `${dayName} ${dayNumber} ${monthName}`;
}

/**
 * Formats a week title (e.g. "Semaine du 3 février 2026")
 * @param date - The Monday date of the week
 * @returns The formatted week title string
 */
export function formatWeekTitle(date: Date): string {
  return `Semaine du ${format(date, 'd MMMM yyyy', { locale: fr })}`;
}

/**
 * Sanitizes a string for safe use in filenames:
 * - removes accents/diacritics while keeping base letters (é -> e, ç -> c, etc.)
 * - replaces characters outside [a-zA-Z0-9_-] with underscores
 * - collapses repeated underscores and trims leading/trailing underscores
 */
export function sanitizeForFilename(value: string): string {
  if (!value) return '';
  // Normalize to NFD form and strip diacritic marks
  const withoutDiacritics = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Remove forward slashes entirely (e.g. 2026/2027 -> 20262027)
  const noSlashes = withoutDiacritics.replace(/[\/]+/g, '');
  // Replace any remaining unsupported characters with underscores
  const withUnderscores = noSlashes.replace(/[^a-zA-Z0-9]+/g, '_');
  // Collapse multiple underscores and trim
  const cleaned = withUnderscores.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned.toLowerCase();
}

/**
 * Returns a new date that is a given number of days after the provided date.
 * The original date is not mutated.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Given a week start date (Monday), returns the corresponding Friday date.
 * This assumes a Monday–Friday week (start + 4 days).
 */
export function getWeekEndFromStart(weekStartDate: Date): Date {
  return addDays(weekStartDate, 4);
}

/**
 * Formats a date as ddMMyyyy (e.g. 03012026) for filenames.
 */
export function formatDateDDMMYYYY(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

/**
 * Formats a date as DD/MM/YY (e.g. 03/11/25) for compact labels.
 */
export function formatDateDDMMYY(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Formats a date as a long French date without the day name,
 * e.g. "3 novembre 2025".
 */
export function formatFrenchLongDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

