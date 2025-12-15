import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijriDate,
  formatGregorianDate,
  HIJRI_MONTHS,
  GREGORIAN_MONTHS,
  type HijriDate,
  type CalendarType,
} from "@shared/dateUtils";

// Umm al-Qura library supports years 1318-1500 Hijri
const MIN_HIJRI_YEAR = 1318;
const MAX_HIJRI_YEAR = 1500;

// Corresponding Gregorian years (approximate)
const MIN_GREGORIAN_YEAR = 1900;
const MAX_GREGORIAN_YEAR = 2076;

interface DualDatePickerProps {
  value?: string; // ISO date string (Gregorian) for storage
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  defaultCalendar?: CalendarType;
}

// Safe wrapper for gregorianToHijri that handles out-of-range dates
function safeGregorianToHijri(date: Date | string): HijriDate | null {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    
    // Check if year is within supported range
    if (year < MIN_GREGORIAN_YEAR || year > MAX_GREGORIAN_YEAR) {
      return null;
    }
    
    return gregorianToHijri(date);
  } catch {
    return null;
  }
}

// Safe wrapper for hijriToGregorian
function safeHijriToGregorian(year: number, month: number, day: number): Date | null {
  try {
    if (year < MIN_HIJRI_YEAR || year > MAX_HIJRI_YEAR) {
      return null;
    }
    return hijriToGregorian(year, month, day);
  } catch {
    return null;
  }
}

// Get days in Hijri month safely
function safeGetHijriMonthDays(year: number, month: number): number {
  try {
    if (year < MIN_HIJRI_YEAR || year > MAX_HIJRI_YEAR) {
      return 30; // Default to 30 days
    }
    // Try day 30, if valid then 30 days, otherwise 29
    const testDate = safeHijriToGregorian(year, month, 30);
    if (testDate) {
      const hijri = safeGregorianToHijri(testDate);
      return hijri && hijri.day === 30 ? 30 : 29;
    }
    return 29;
  } catch {
    return 29;
  }
}

export function DualDatePicker({
  value,
  onChange,
  label,
  placeholder = "اختر التاريخ",
  className,
  defaultCalendar = "hijri",
}: DualDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [calendarType, setCalendarType] = useState<CalendarType>(defaultCalendar);
  
  // Current view state for calendar navigation
  const [viewYear, setViewYear] = useState<number>(0);
  const [viewMonth, setViewMonth] = useState<number>(1);

  // Initialize view state based on value or current date
  useEffect(() => {
    const initializeView = () => {
      if (value) {
        if (calendarType === "hijri") {
          const hijri = safeGregorianToHijri(value);
          if (hijri) {
            setViewYear(hijri.year);
            setViewMonth(hijri.month);
          } else {
            // Fallback to current Hijri date
            const currentHijri = safeGregorianToHijri(new Date());
            if (currentHijri) {
              setViewYear(currentHijri.year);
              setViewMonth(currentHijri.month);
            } else {
              setViewYear(1446);
              setViewMonth(1);
            }
          }
        } else {
          const date = new Date(value);
          const year = date.getFullYear();
          setViewYear(Math.max(MIN_GREGORIAN_YEAR, Math.min(MAX_GREGORIAN_YEAR, year)));
          setViewMonth(date.getMonth() + 1);
        }
      } else {
        const now = new Date();
        if (calendarType === "hijri") {
          const hijri = safeGregorianToHijri(now);
          if (hijri) {
            setViewYear(hijri.year);
            setViewMonth(hijri.month);
          } else {
            setViewYear(1446);
            setViewMonth(1);
          }
        } else {
          setViewYear(now.getFullYear());
          setViewMonth(now.getMonth() + 1);
        }
      }
    };
    
    initializeView();
  }, [calendarType, value]);

  // Display value
  const displayValue = useMemo(() => {
    if (!value) return "";
    
    try {
      if (calendarType === "hijri") {
        const hijri = safeGregorianToHijri(value);
        if (hijri) {
          return formatHijriDate(hijri, "short");
        }
        // Fallback to Gregorian display
        return formatGregorianDate(value, "short");
      } else {
        return formatGregorianDate(value, "short");
      }
    } catch {
      return formatGregorianDate(value, "short");
    }
  }, [value, calendarType]);

  // Get days for current view
  const daysInMonth = useMemo(() => {
    try {
      if (calendarType === "hijri") {
        if (viewYear < MIN_HIJRI_YEAR || viewYear > MAX_HIJRI_YEAR) {
          return 30;
        }
        return safeGetHijriMonthDays(viewYear, viewMonth);
      } else {
        return new Date(viewYear, viewMonth, 0).getDate();
      }
    } catch {
      return 30;
    }
  }, [viewYear, viewMonth, calendarType]);

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = useMemo(() => {
    try {
      if (calendarType === "hijri") {
        const gregorian = safeHijriToGregorian(viewYear, viewMonth, 1);
        if (gregorian) {
          return gregorian.getDay();
        }
        return 0;
      } else {
        return new Date(viewYear, viewMonth - 1, 1).getDay();
      }
    } catch {
      return 0;
    }
  }, [viewYear, viewMonth, calendarType]);

  // Selected day
  const selectedDay = useMemo(() => {
    if (!value) return null;
    
    try {
      if (calendarType === "hijri") {
        const hijri = safeGregorianToHijri(value);
        if (hijri && hijri.year === viewYear && hijri.month === viewMonth) {
          return hijri.day;
        }
      } else {
        const date = new Date(value);
        if (date.getFullYear() === viewYear && date.getMonth() + 1 === viewMonth) {
          return date.getDate();
        }
      }
    } catch {
      // Ignore errors
    }
    return null;
  }, [value, viewYear, viewMonth, calendarType]);

  // Handle day selection
  const handleDaySelect = (day: number) => {
    try {
      let gregorianDate: Date | null = null;
      
      if (calendarType === "hijri") {
        gregorianDate = safeHijriToGregorian(viewYear, viewMonth, day);
      } else {
        gregorianDate = new Date(viewYear, viewMonth - 1, day);
      }
      
      if (gregorianDate) {
        // Use LOCAL date components to avoid timezone shift
        // toISOString() converts to UTC which can shift the date by 1 day
        const year = gregorianDate.getFullYear();
        const month = (gregorianDate.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = gregorianDate.getDate().toString().padStart(2, '0');
        const isoDate = `${year}-${month}-${dayStr}`;
        onChange(isoDate);
      }
      setIsOpen(false);
    } catch {
      setIsOpen(false);
    }
  };

  // Navigate months with bounds checking
  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (viewMonth === 1) {
        const newYear = viewYear - 1;
        if (calendarType === "hijri") {
          if (newYear >= MIN_HIJRI_YEAR) {
            setViewMonth(12);
            setViewYear(newYear);
          }
        } else {
          if (newYear >= MIN_GREGORIAN_YEAR) {
            setViewMonth(12);
            setViewYear(newYear);
          }
        }
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      if (viewMonth === 12) {
        const newYear = viewYear + 1;
        if (calendarType === "hijri") {
          if (newYear <= MAX_HIJRI_YEAR) {
            setViewMonth(1);
            setViewYear(newYear);
          }
        } else {
          if (newYear <= MAX_GREGORIAN_YEAR) {
            setViewMonth(1);
            setViewYear(newYear);
          }
        }
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  // Year options within valid range
  const yearOptions = useMemo(() => {
    if (calendarType === "hijri") {
      const years = [];
      // Use valid Hijri range: 1318-1500
      for (let y = MIN_HIJRI_YEAR; y <= MAX_HIJRI_YEAR; y++) {
        years.push(y);
      }
      return years;
    } else {
      const years = [];
      for (let y = MIN_GREGORIAN_YEAR; y <= MAX_GREGORIAN_YEAR; y++) {
        years.push(y);
      }
      return years;
    }
  }, [calendarType]);

  // Month names
  const monthNames = calendarType === "hijri" ? HIJRI_MONTHS : GREGORIAN_MONTHS;

  // Day names
  const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

  // Display both dates safely
  const bothDatesDisplay = useMemo(() => {
    if (!value) return null;
    
    try {
      const gregorianDisplay = formatGregorianDate(value, "long");
      const hijri = safeGregorianToHijri(value);
      const hijriDisplay = hijri ? formatHijriDate(hijri, "long") : "خارج النطاق المدعوم";
      
      return { gregorian: gregorianDisplay, hijri: hijriDisplay };
    } catch {
      return null;
    }
  }, [value]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-right font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Calendar className="ml-2 h-4 w-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-auto p-0 max-h-[400px] overflow-y-auto" 
          align="end"
          side="bottom"
          sideOffset={4}
        >
          <div className="p-4 space-y-4">
            {/* Calendar Type Toggle */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm", calendarType === "gregorian" && "font-bold text-primary")}>
                  ميلادي
                </span>
                <Switch
                  checked={calendarType === "hijri"}
                  onCheckedChange={(checked) => setCalendarType(checked ? "hijri" : "gregorian")}
                />
                <span className={cn("text-sm", calendarType === "hijri" && "font-bold text-primary")}>
                  هجري
                </span>
              </div>
            </div>

            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Select
                  value={viewMonth.toString()}
                  onValueChange={(v) => setViewMonth(parseInt(v))}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={viewYear.toString()}
                  onValueChange={(v) => setViewYear(parseInt(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map((day) => (
                <div key={day} className="text-xs font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              
              {/* Day buttons */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDay;
                
                return (
                  <Button
                    key={day}
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 w-9 p-0 font-normal",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleDaySelect(day)}
                  >
                    {day}
                  </Button>
                );
              })}
            </div>

            {/* Display both dates */}
            {bothDatesDisplay && (
              <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                <div>ميلادي: {bothDatesDisplay.gregorian}</div>
                <div>هجري: {bothDatesDisplay.hijri}</div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DualDatePicker;
