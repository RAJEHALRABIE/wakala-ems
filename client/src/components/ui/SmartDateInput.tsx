import { useState, useEffect, useId, useMemo } from "react";
import { Calendar, CalendarDays, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { gregorianToHijri, hijriToGregorian } from "@shared/dateUtils";

/**
 * تنسيق التاريخ (DD/MM/YYYY)
 */
function formatDateNumeric(date: Date | string, calendar: 'gregorian' | 'hijri'): string {
  if (!date) return "";
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    // تجاهل التواريخ قبل عام 2000 (مشكلة 1970)
    if (isNaN(d.getTime()) || d.getTime() < 946684800000) return "";
    
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
    return "";
  }
}

interface SmartDateInputProps {
  label: string;
  value?: string; // ISO format: YYYY-MM-DD
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  defaultToday?: boolean;
}

export function SmartDateInput({
  label,
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  error,
  className,
  defaultToday = true,
}: SmartDateInputProps) {
  const id = useId();
  const [mode, setMode] = useState<"gregorian" | "hijri">("gregorian");
  
  // Internal states for dropdowns
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  // Options
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => (i + 1).toString()), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), []);
  const gYears = useMemo(() => Array.from({ length: 16 }, (_, i) => (2020 + i).toString()), []);
  const hYears = useMemo(() => Array.from({ length: 101 }, (_, i) => (1400 + i).toString()), []);

  useEffect(() => {
    if (defaultToday && !value) {
      onChange(new Date().toISOString().split("T")[0]);
    }
  }, []);

  // Sync internal dropdown states with incoming value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime()) && d.getTime() >= 946684800000) {
        if (mode === "gregorian") {
          setDay(d.getDate().toString());
          setMonth((d.getMonth() + 1).toString());
          setYear(d.getFullYear().toString());
        } else {
          const h = gregorianToHijri(d);
          setDay(h.day.toString());
          setMonth(h.month.toString());
          setYear(h.year.toString());
        }
        return;
      }
    }
    // If invalid or empty
    setDay("");
    setMonth("");
    setYear("");
  }, [value, mode]);

  const handleDropdownChange = (d: string, m: string, y: string) => {
    setDay(d);
    setMonth(m);
    setYear(y);
    
    if (d && m && y) {
      try {
        let iso = "";
        if (mode === "gregorian") {
          const gDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
          iso = gDate.toISOString().split("T")[0];
        } else {
          const gDate = hijriToGregorian(parseInt(y), parseInt(m), parseInt(d));
          iso = gDate.toISOString().split("T")[0];
        }
        onChange(iso);
      } catch (e) {
        console.error("Error converting date", e);
      }
    } else {
      // If any part is missing, we consider the date empty/incomplete
      // but we don't necessarily clear the parent value until it's valid
    }
  };

  const isInvalid = !value || new Date(value).getTime() < 946684800000;
  const displayValue = isInvalid ? "" : value;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
        
        <button
          type="button"
          onClick={() => setMode(mode === "gregorian" ? "hijri" : "gregorian")}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          {mode === "gregorian" ? "التحويل للهجري" : "التحويل للميلادي"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2" dir="rtl">
        <Select value={day} onValueChange={(v) => handleDropdownChange(v, month, year)}>
          <SelectTrigger className="py-6">
            <SelectValue placeholder="اليوم" />
          </SelectTrigger>
          <SelectContent>
            {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={(v) => handleDropdownChange(day, v, year)}>
          <SelectTrigger className="py-6">
            <SelectValue placeholder="الشهر" />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={(v) => handleDropdownChange(day, month, v)}>
          <SelectTrigger className="py-6">
            <SelectValue placeholder="السنة" />
          </SelectTrigger>
          <SelectContent>
            {(mode === "gregorian" ? gYears : hYears).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!isInvalid && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CalendarDays className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-600 block leading-tight">هجري</span>
              <span className="text-sm font-semibold text-emerald-800 block truncate">
                {formatDateNumeric(displayValue, 'hijri') || "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-blue-600 block leading-tight">ميلادي</span>
              <span className="text-sm font-semibold text-blue-800 block truncate">
                {formatDateNumeric(displayValue, 'gregorian') || "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface DateRangeInputProps {
  startLabel?: string;
  endLabel?: string;
  startValue?: string;
  endValue?: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DateRangeInput({
  startLabel = "تاريخ البداية",
  endLabel = "تاريخ النهاية",
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  required = false,
  disabled = false,
  className,
}: DateRangeInputProps) {
  const remaining = useMemo(() => {
    if (!endValue || new Date(endValue).getTime() < 946684800000) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const end = new Date(endValue); end.setHours(0,0,0,0);
    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let status: "safe" | "warning" | "danger" | "expired" = "safe";
    if (diffDays < 0) status = "expired";
    else if (diffDays <= 30) status = "danger";
    else if (diffDays <= 90) status = "warning";
    return { days: diffDays, status };
  }, [endValue]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe": return "bg-green-50 text-green-700 border-green-200";
      case "warning": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "danger": return "bg-red-50 text-red-700 border-red-200";
      case "expired": return "bg-gray-50 text-gray-700 border-gray-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartDateInput
          label={startLabel}
          value={startValue}
          onChange={onStartChange}
          max={endValue}
          required={required}
          disabled={disabled}
        />
        <SmartDateInput
          label={endLabel}
          value={endValue}
          onChange={onEndChange}
          min={startValue}
          required={required}
          disabled={disabled}
          defaultToday={false}
        />
      </div>
      {remaining && (
        <div className={cn("flex items-center justify-center p-2 rounded-lg border text-sm font-medium", getStatusColor(remaining.status))}>
          {remaining.status === "expired" ? `منتهية منذ ${Math.abs(remaining.days)} يوم` : `متبقي ${remaining.days} يوم`}
        </div>
      )}
    </div>
  );
}

export default SmartDateInput;