import { useState, useEffect, useId } from "react";
import { umalqura } from "@umalqura/core";
import { Calendar, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

// أسماء الأشهر الهجرية
const HIJRI_MONTHS = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

// أسماء الأشهر الميلادية
const GREGORIAN_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

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

/**
 * مكون إدخال التاريخ الذكي
 * - يدخل المستخدم التاريخ الميلادي
 * - يعرض التاريخ الهجري تلقائياً
 * - يخزّن بصيغة ISO (YYYY-MM-DD)
 */
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
  const [hijriDisplay, setHijriDisplay] = useState<string>("");
  const [gregorianDisplay, setGregorianDisplay] = useState<string>("");

  // تحويل التاريخ الميلادي إلى هجري
  const convertToHijri = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      
      const hijri = umalqura(date);
      const monthName = HIJRI_MONTHS[hijri.hm - 1];
      return `${hijri.hd} ${monthName} ${hijri.hy} هـ`;
    } catch {
      return "";
    }
  };

  // تنسيق التاريخ الميلادي للعرض
  const formatGregorian = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      
      const day = date.getDate();
      const monthName = GREGORIAN_MONTHS[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${monthName} ${year} م`;
    } catch {
      return "";
    }
  };

  // الحصول على تاريخ اليوم بصيغة ISO
  const getTodayISO = (): string => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // تعيين القيمة الافتراضية عند التحميل
  useEffect(() => {
    if (defaultToday && !value) {
      const today = getTodayISO();
      onChange(today);
    }
  }, []);

  // تحديث العرض عند تغيير القيمة
  useEffect(() => {
    if (value) {
      setHijriDisplay(convertToHijri(value));
      setGregorianDisplay(formatGregorian(value));
    } else {
      setHijriDisplay("");
      setGregorianDisplay("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 mr-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        <input
          id={id}
          type="date"
          value={value || ""}
          onChange={handleChange}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 pr-10",
            "border rounded-lg",
            "text-base text-gray-900",
            "bg-white",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            error ? "border-red-500" : "border-gray-300",
            "transition-colors duration-200"
          )}
          dir="ltr"
        />
        <Calendar 
          className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" 
        />
      </div>

      {/* Date Display Cards */}
      {value && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Hijri Display */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CalendarDays className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-emerald-600 block">هجري</span>
              <span className="text-sm font-semibold text-emerald-800 block truncate">
                {hijriDisplay || "—"}
              </span>
            </div>
          </div>

          {/* Gregorian Display */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-blue-600 block">ميلادي</span>
              <span className="text-sm font-semibold text-blue-800 block truncate">
                {gregorianDisplay || "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * مكون نطاق التاريخ (من - إلى)
 */
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
  // حساب المدة المتبقية
  const calculateRemaining = (): { days: number; status: "safe" | "warning" | "danger" | "expired" } | null => {
    if (!endValue) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endValue);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: "safe" | "warning" | "danger" | "expired";
    if (diffDays < 0) {
      status = "expired";
    } else if (diffDays <= 30) {
      status = "danger";
    } else if (diffDays <= 90) {
      status = "warning";
    } else {
      status = "safe";
    }
    
    return { days: diffDays, status };
  };

  const remaining = calculateRemaining();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe": return "bg-green-100 text-green-800 border-green-300";
      case "warning": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "danger": return "bg-red-100 text-red-800 border-red-300";
      case "expired": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (remaining: { days: number; status: string }) => {
    if (remaining.status === "expired") {
      return `منتهية منذ ${Math.abs(remaining.days)} يوم`;
    }
    return `متبقي ${remaining.days} يوم`;
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
          defaultToday={true}
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

      {/* Remaining Days Indicator */}
      {remaining && (
        <div className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-lg border",
          getStatusColor(remaining.status)
        )}>
          <span className="text-sm font-medium">
            {getStatusText(remaining)}
          </span>
        </div>
      )}
    </div>
  );
}

export default SmartDateInput;
