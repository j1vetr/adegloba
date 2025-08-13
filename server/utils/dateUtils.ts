// Utility functions for date calculations with Turkish timezone
import { format, endOfMonth, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Gets the end of the current month in Istanbul timezone
 * Packages expire at the end of the month they are purchased
 * Example: If purchased on Jan 15th, expires at end of January
 */
export function getEndOfCurrentMonth(): Date {
  const now = new Date();
  
  // Get the end of the current month at 23:59:59
  const endOfCurrentMonth = endOfMonth(now);
  endOfCurrentMonth.setHours(23, 59, 59, 999);
  
  return endOfCurrentMonth;
}

/**
 * Calculates the remaining days until the end of the current month
 * Used for displaying validity information to users
 */
export function getDaysUntilEndOfMonth(): number {
  const now = new Date();
  const endOfMonth = getEndOfCurrentMonth();
  
  const diffTime = endOfMonth.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Formats a date for Turkish locale display
 */
export function formatDateTurkish(date: Date): string {
  return format(date, 'dd MMMM yyyy, HH:mm', { locale: tr });
}

/**
 * Calculates expiration date for a package
 * All packages expire at the end of the month they are purchased
 */
export function calculatePackageExpiration(): Date {
  return getEndOfCurrentMonth();
}