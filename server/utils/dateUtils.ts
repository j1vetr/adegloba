/**
 * Date utilities for package expiry calculations
 * All packages are valid until the end of the purchase month in Europe/Istanbul timezone
 */
import { format, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const ISTANBUL_TIMEZONE = 'Europe/Istanbul';

/**
 * Calculate the end of month date at 23:59:59 in Europe/Istanbul timezone
 * @param date - The purchase/payment date
 * @returns Date object representing the last moment of the purchase month in Istanbul timezone
 */
export function getEndOfMonthIstanbul(date: Date): Date {
  // Convert to Istanbul timezone
  const istanbulDate = toZonedTime(date, ISTANBUL_TIMEZONE);
  
  // Get the end of the month in Istanbul timezone
  const endOfMonthIstanbul = endOfMonth(istanbulDate);
  endOfMonthIstanbul.setHours(23, 59, 59, 999);
  
  // Convert back to UTC for database storage
  return fromZonedTime(endOfMonthIstanbul, ISTANBUL_TIMEZONE);
}

/**
 * Check if a package/order is expired based on current Istanbul time
 * @param expiresAt - The expiry date (should be end of month)
 * @returns true if expired, false if still active
 */
export function isExpiredIstanbul(expiresAt: Date): boolean {
  const now = new Date();
  const nowIstanbul = toZonedTime(now, ISTANBUL_TIMEZONE);
  const expiryIstanbul = toZonedTime(expiresAt, ISTANBUL_TIMEZONE);
  
  return nowIstanbul > expiryIstanbul;
}

/**
 * Calculate days remaining until expiry in Istanbul timezone
 * @param expiresAt - The expiry date
 * @returns Number of days remaining (0 if expired)
 */
export function getDaysRemainingIstanbul(expiresAt: Date): number {
  const now = new Date();
  const nowIstanbul = toZonedTime(now, ISTANBUL_TIMEZONE);
  const expiryIstanbul = toZonedTime(expiresAt, ISTANBUL_TIMEZONE);
  
  const diffTime = expiryIstanbul.getTime() - nowIstanbul.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Format expiry date for display in Turkish locale with Istanbul timezone
 * @param expiresAt - The expiry date
 * @returns Formatted date string
 */
export function formatExpiryDateTurkish(expiresAt: Date): string {
  const istanbulDate = toZonedTime(expiresAt, ISTANBUL_TIMEZONE);
  return format(istanbulDate, 'dd MMMM yyyy', { locale: tr });
}

/**
 * Calculate progress percentage from purchase date to expiry date
 * @param paidAt - When the package was purchased
 * @param expiresAt - When the package expires
 * @returns Progress percentage (0-100)
 */
export function calculateExpiryProgress(paidAt: Date, expiresAt: Date): number {
  const now = new Date();
  const nowIstanbul = toZonedTime(now, ISTANBUL_TIMEZONE);
  const paidIstanbul = toZonedTime(paidAt, ISTANBUL_TIMEZONE);
  const expiryIstanbul = toZonedTime(expiresAt, ISTANBUL_TIMEZONE);
  
  const totalDuration = expiryIstanbul.getTime() - paidIstanbul.getTime();
  const elapsed = nowIstanbul.getTime() - paidIstanbul.getTime();
  
  if (totalDuration <= 0) return 0;
  if (elapsed >= totalDuration) return 0; // Expired
  
  const remaining = totalDuration - elapsed;
  return Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
}

/**
 * Formats a date for Turkish locale display in Istanbul timezone
 */
export function formatDateTurkish(date: Date): string {
  const istanbulDate = toZonedTime(date, ISTANBUL_TIMEZONE);
  return format(istanbulDate, 'dd MMMM yyyy, HH:mm', { locale: tr });
}

// Legacy functions for backward compatibility
export function getEndOfCurrentMonth(): Date {
  return getEndOfMonthIstanbul(new Date());
}

export function getDaysUntilEndOfMonth(): number {
  return getDaysRemainingIstanbul(getEndOfCurrentMonth());
}

export function calculatePackageExpiration(): Date {
  return getEndOfCurrentMonth();
}