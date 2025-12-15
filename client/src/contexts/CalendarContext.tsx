import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { CalendarType } from '@shared/dateUtils';

interface CalendarContextType {
  calendarType: CalendarType;
  setCalendarType: (type: CalendarType) => void;
  toggleCalendar: () => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const STORAGE_KEY = 'wakala-calendar-type';

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [calendarType, setCalendarTypeState] = useState<CalendarType>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'gregorian' || stored === 'hijri') {
        return stored;
      }
    }
    return 'hijri'; // Default to Hijri for Saudi users
  });

  // Persist to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, calendarType);
  }, [calendarType]);

  const setCalendarType = (type: CalendarType) => {
    setCalendarTypeState(type);
  };

  const toggleCalendar = () => {
    setCalendarTypeState(prev => prev === 'hijri' ? 'gregorian' : 'hijri');
  };

  return (
    <CalendarContext.Provider value={{ calendarType, setCalendarType, toggleCalendar }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

export default CalendarContext;
