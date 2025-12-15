import { useCalendar } from '@/contexts/CalendarContext';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * CalendarToggle component for switching between Hijri and Gregorian calendars
 * Should be placed in the app header for global access
 */
export function CalendarToggle({ className, showLabel = true }: CalendarToggleProps) {
  const { calendarType, toggleCalendar } = useCalendar();

  const isHijri = calendarType === 'hijri';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleCalendar}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
        "hover:bg-accent/50",
        className
      )}
      title={isHijri ? "التبديل إلى التقويم الميلادي" : "التبديل إلى التقويم الهجري"}
    >
      <Calendar className="h-4 w-4" />
      {showLabel && (
        <span className="text-sm font-medium">
          {isHijri ? "هجري" : "ميلادي"}
        </span>
      )}
    </Button>
  );
}

export default CalendarToggle;
