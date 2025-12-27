import { useMemo } from 'react';
import { gregorianToHijri } from '@shared/dateUtils';

interface DateDisplayProps {
  date: string | Date | null | undefined;
  calendar?: 'gregorian' | 'hijri';
  className?: string;
}

/**
 * DateDisplay component that shows date in DD/MM/YYYY format.
 * Supports both Gregorian and Hijri display.
 */
export function DateDisplay({ date, calendar = 'gregorian', className }: DateDisplayProps) {
  const displayValue = useMemo(() => {
    if (!date) return '-';

    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      
      // Fix for 1970 issue (corrupted data)
      if (isNaN(d.getTime()) || d.getTime() < 946684800000) {
        return '-';
      }

      if (calendar === 'hijri') {
        const h = gregorianToHijri(d);
        return `${String(h.day).padStart(2, '0')}/${String(h.month).padStart(2, '0')}/${h.year}`;
      } else {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch {
      return '-';
    }
  }, [date, calendar]);

  return <span className={className}>{displayValue}</span>;
}

export default DateDisplay;