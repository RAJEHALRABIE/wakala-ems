import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useMemo, useCallback } from "react";

const SmartDateInput = ({
  label,
  value,
  onChange,
  calendarType
}: {
  label: string,
  value: string | undefined,
  onChange: (val: string) => void,
  calendarType: "H" | "G"
}) => {
  // 1. تحليل القيمة الواردة بشكل آمن
  const parseValue = (val: string | undefined) => {
    if (!val) return { year: "", month: "", day: "" };
    const parts = val.split("-");
    return {
      year: parts[0] || "",
      month: parts[1] || "",
      day: parts[2] || ""
    };
  };

  const initialParts = parseValue(value);
  const [currentYear, setCurrentYear] = useState(initialParts.year);
  const [currentMonth, setCurrentMonth] = useState(initialParts.month);
  const [currentDay, setCurrentDay] = useState(initialParts.day);

  // 2. تعريف البيانات الثابتة بطريقة أنظف
  const calendarConfig = {
    H: {
      monthNames: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
      // نطاق سنوات أكثر منطقية (مثال: 1440-1500)
      yearRange: { start: 1440, end: 1500 },
      getDaysInMonth: (month: number, year: number) => {
        // 📌 مهم: استبدل هذا بمنطق حساب الأيام الهجرية الحقيقي
        // الهجري: الأشهر الفردية 30 يومًا، الزوجية 29 يومًا (مع استثناءات)
        const isOddMonth = month % 2 === 1;
        return isOddMonth ? 30 : 29;
      }
    },
    G: {
      monthNames: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
      yearRange: { start: 2000, end: 2030 },
      getDaysInMonth: (month: number, year: number) => {
        // منطق الأيام الميلادي القياسي
        if (month === 2) { // فبراير
          return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
        }
        return [4, 6, 9, 11].includes(month) ? 30 : 31;
      }
    }
  };

  const config = calendarConfig[calendarType];

  // 3. إنشاء قوائم السنوات والأيام ديناميكيًا باستخدام useMemo
  const yearsList = useMemo(() => {
    const { start, end } = config.yearRange;
    return Array.from(
      { length: end - start + 1 },
      (_, i) => (end - i).toString() // سنوات تنازليًا
    );
  }, [config.yearRange]);

  const daysList = useMemo(() => {
    if (!currentMonth || !currentYear) return [];
    const monthNum = parseInt(currentMonth);
    const yearNum = parseInt(currentYear);
    
    if (isNaN(monthNum) || isNaN(yearNum)) return [];
    
    const daysCount = config.getDaysInMonth(monthNum, yearNum);
    return Array.from(
      { length: daysCount },
      (_, i) => (i + 1).toString()
    );
  }, [currentMonth, currentYear, config]);

  // 4. تحديث القيمة الأصلية عند تغيير `value` من الأب
  useEffect(() => {
    const parts = parseValue(value);
    setCurrentYear(parts.year);
    setCurrentMonth(parts.month);
    setCurrentDay(parts.day);
  }, [value]);

  // 5. تصحيح الخلل: التهيئة الأولية المنطقية (بدون إعادة تعيين عشوائي)
  useEffect(() => {
    // التهيئة فقط عند عدم وجود قيمة ووجود جميع الحقول فارغة
    if (!value && !currentYear && !currentMonth && !currentDay) {
      const defaultYear = yearsList[yearsList.length - 1]; // آخر سنة في النطاق (الأقدم)
      updateDate(defaultYear, "1", "1");
    }
    // تمت إزالة calendarType من dependencies لتجنب إعادة التعيين غير المرغوب فيه
  }, [yearsList]); // التهيئة تعتمد فقط على yearsList

  // 6. دالة التحديث المحسنة مع useCallback
  const updateDate = useCallback((y: string, m: string, d: string) => {
    // التأكد من تنسيق مكون من رقمين للأشهر والأيام
    const formattedMonth = m.padStart(2, '0');
    const formattedDay = d.padStart(2, '0');
    
    // تحديث الحالة الداخلية
    setCurrentYear(y);
    setCurrentMonth(m); // تخزين القيمة غير المنسقة لإدارة حالة Select
    setCurrentDay(d);
    
    // إرسال القيمة المنسقة إلى الأب
    onChange(`${y}-${formattedMonth}-${formattedDay}`);
  }, [onChange]);

  // 7. التأكد من أن اليوم المحدد صالح للشهر/السنة الحاليين
  useEffect(() => {
    if (currentDay && daysList.length > 0 && !daysList.includes(currentDay)) {
      // إذا كان اليوم الحالي غير موجود في القائمة الجديدة، تعيين آخر يوم صالح
      updateDate(currentYear, currentMonth, daysList[daysList.length - 1]);
    }
  }, [daysList, currentDay, currentYear, currentMonth, updateDate]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex gap-2" dir="rtl">
        {/* اليوم - قائمة ديناميكية */}
        <Select
          value={currentDay}
          onValueChange={(v: string) => updateDate(currentYear, currentMonth, v)}
          disabled={daysList.length === 0}
        >
          <SelectTrigger className="w-[70px] bg-white border-gray-300">
            <SelectValue placeholder="يوم">
              {currentDay || "يوم"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {daysList.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* الشهر */}
        <Select
          value={currentMonth}
          onValueChange={(v: string) => updateDate(currentYear, v, currentDay)}
        >
          <SelectTrigger className="flex-1 bg-white border-gray-300 min-w-[120px]">
            <SelectValue placeholder="شهر">
              {currentMonth ? config.monthNames[parseInt(currentMonth) - 1] : "شهر"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {config.monthNames.map((name, index) => (
              <SelectItem key={index + 1} value={(index + 1).toString()}>
                <span className="flex items-center justify-between w-full gap-4">
                  <span>{name}</span>
                  <span className="text-muted-foreground text-xs opacity-50">
                    {index + 1}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* السنة */}
        <Select
          value={currentYear}
          onValueChange={(v: string) => updateDate(v, currentMonth, currentDay)}
        >
          <SelectTrigger className="w-[90px] bg-white border-gray-300">
            <SelectValue placeholder="سنة">
              {currentYear || "سنة"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {yearsList.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* عرض تلميح بسيط */}
      <p className="text-xs text-gray-500">
        التقويم: {calendarType === "H" ? "هجري" : "ميلادي"} | التنسيق: سنة-شهر-يوم
      </p>
    </div>
  );
};

export default SmartDateInput;
