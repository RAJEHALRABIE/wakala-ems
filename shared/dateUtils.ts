/**
 * Date Utilities using Umm al-Qura Calendar System
 * 
 * This module provides accurate Hijri-Gregorian date conversion
 * using the official Saudi Umm al-Qura calendar system.
 * 
 * Storage Protocol: All dates are stored in Gregorian ISO 8601 format (UTC)
 * Display: Hijri dates are calculated on-the-fly for display purposes only
 */

import uq from '@umalqura/core';

export type CalendarType = 'gregorian' | 'hijri';

export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Convert Gregorian date to Hijri date using Umm al-Qura calendar
 * @param gregorianDate - Date object or ISO string in Gregorian format
 * @returns HijriDate object with year, month, day
 */
export function gregorianToHijri(gregorianDate: Date | string): HijriDate {
  let date: Date;
  if (typeof gregorianDate === 'string') {
    // Parse date string as local date to avoid timezone issues
    const parts = gregorianDate.split(/[-T]/);
    date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else {
    date = gregorianDate;
  }
  
  // Use @umalqura/core for accurate conversion
  const hijriDate = uq(date);
  
  return {
    year: hijriDate.hy,
    month: hijriDate.hm,
    day: hijriDate.hd,
  };
}

/**
 * Convert Hijri date to Gregorian date using Umm al-Qura calendar
 * @param hijriYear - Hijri year (e.g., 1396)
 * @param hijriMonth - Hijri month (1-12)
 * @param hijriDay - Hijri day (1-30)
 * @returns Date object in Gregorian format
 */
export function hijriToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
  // Use @umalqura/core for accurate conversion
  const hijriDate = uq(hijriYear, hijriMonth, hijriDay);
  return hijriDate.date;
}

/**
 * Format Hijri date as string
 * @param hijriDate - HijriDate object
 * @param format - 'short' (1396/02/18) or 'long' (18 صفر 1396)
 * @returns Formatted Hijri date string
 */
export function formatHijriDate(hijriDate: HijriDate, format: 'short' | 'long' = 'short'): string {
  const { year, month, day } = hijriDate;
  
  if (format === 'short') {
    return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
  }
  
  const hijriMonths = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
    'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];
  
  return `${day} ${hijriMonths[month - 1]} ${year}`;
}

/**
 * Format Gregorian date as string
 * @param date - Date object or ISO string
 * @param format - 'short' (1976/02/18) or 'long' (18 فبراير 1976)
 * @returns Formatted Gregorian date string
 */
export function formatGregorianDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'short') {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
  
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });
}

/**
 * Convert date string to ISO 8601 format for database storage
 * @param date - Date object or date string
 * @returns ISO 8601 formatted string (YYYY-MM-DD)
 */
export function toISODateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Parse Hijri date string and convert to Gregorian Date
 * @param hijriString - Hijri date string in format "YYYY/MM/DD" or "YYYY-MM-DD"
 * @returns Date object in Gregorian format
 */
export function parseHijriString(hijriString: string): Date {
  const parts = hijriString.split(/[\/\-]/);
  if (parts.length !== 3) {
    throw new Error('Invalid Hijri date format. Expected YYYY/MM/DD or YYYY-MM-DD');
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  return hijriToGregorian(year, month, day);
}

/**
 * Get current date in both calendars
 * @returns Object with both Gregorian and Hijri representations
 */
export function getCurrentDate(): { gregorian: Date; hijri: HijriDate } {
  const now = new Date();
  return {
    gregorian: now,
    hijri: gregorianToHijri(now),
  };
}

/**
 * Validate Hijri date
 * @param year - Hijri year
 * @param month - Hijri month (1-12)
 * @param day - Hijri day (1-30)
 * @returns boolean indicating if the date is valid
 */
export function isValidHijriDate(year: number, month: number, day: number): boolean {
  try {
    const hijriDate = uq(year, month, day);
    return hijriDate.hy === year && hijriDate.hm === month && hijriDate.hd === day;
  } catch {
    return false;
  }
}

/**
 * Get the number of days in a Hijri month
 * @param year - Hijri year
 * @param month - Hijri month (1-12)
 * @returns Number of days in the month (29 or 30)
 */
export function getHijriMonthDays(year: number, month: number): number {
  try {
    // Try day 30, if valid then 30 days, otherwise 29
    const testDate = uq(year, month, 30);
    return testDate.hd === 30 ? 30 : 29;
  } catch {
    return 29;
  }
}

/**
 * Test case validation: 1976-02-18 (Gregorian) = 1396-02-18 (Hijri)
 * This function can be used to verify the accuracy of the conversion
 */
export function validateConversion(): { passed: boolean; details: string } {
  const testGregorian = new Date(1976, 1, 18); // Feb 18, 1976
  const hijri = gregorianToHijri(testGregorian);
  
  const expectedHijri = { year: 1396, month: 2, day: 18 };
  const passed = hijri.year === expectedHijri.year && 
                 hijri.month === expectedHijri.month && 
                 hijri.day === expectedHijri.day;
  
  const details = passed 
    ? `✓ Conversion correct: 1976-02-18 → ${hijri.year}/${hijri.month}/${hijri.day}`
    : `✗ Conversion error: Expected 1396/02/18, got ${hijri.year}/${hijri.month}/${hijri.day}`;
  
  return { passed, details };
}

// Hijri month names for display
export const HIJRI_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

// Gregorian month names in Arabic for display
export const GREGORIAN_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل',
  'مايو', 'يونيو', 'يوليو', 'أغسطس',
  'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
