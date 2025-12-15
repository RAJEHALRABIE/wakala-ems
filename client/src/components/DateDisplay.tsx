import { useMemo } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { gregorianToHijri, formatHijriDate, formatGregorianDate } from '@shared/dateUtils';

interface DateDisplayProps {
  date: string | Date | null | undefined;
  format?: 'short' | 'long';
  className?: string;
}

// Min/Max supported years for Umm al-Qura
const MIN_GREGORIAN_YEAR = 1900;
const MAX_GREGORIAN_YEAR = 2076;

/**
 * DateDisplay component that shows date in the globally selected calendar format
 * Uses the CalendarContext to determine whether to show Hijri or Gregorian
 */
export function DateDisplay({ date, format = 'short', className }: DateDisplayProps) {
  const { calendarType } = useCalendar();

  const displayValue = useMemo(() => {
    if (!date) return '-';

    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      const year = d.getFullYear();

      // Check if within supported range
      if (year < MIN_GREGORIAN_YEAR || year > MAX_GREGORIAN_YEAR) {
        return formatGregorianDate(d, format);
      }

      if (calendarType === 'hijri') {
        const hijri = gregorianToHijri(d);
        return formatHijriDate(hijri, format);
      } else {
        return formatGregorianDate(d, format);
      }
    } catch {
      // Fallback to showing the raw date
      if (typeof date === 'string') {
        return date;
      }
      return '-';
    }
  }, [date, calendarType, format]);

  return <span className={className}>{displayValue}</span>;
}

export default DateDisplay;
