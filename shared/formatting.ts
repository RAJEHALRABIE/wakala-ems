/**
 * دوال تنسيق موحدة لعرض الأرقام مع الرمز بعد الرقم
 * لضمان تناسق التنسيق في جميع أنحاء التطبيق
 */

/**
 * تحويل الأرقام العربية/الهندية إلى أرقام إنجليزية
 * @param value النص المدخل الذي قد يحتوي على أرقام غير إنجليزية
 * @returns نص بأرقام إنجليزية فقط
 */
export const normalizeDigits = (value: string): string => {
  if (!value) return value;
  
  // تحويل الأرقام العربية (٠١٢٣٤٥٦٧٨٩) إلى إنجليزية
  const arabicToEnglish = value.replace(/[٠-٩]/g, (d) => 
    String.fromCharCode(d.charCodeAt(0) - 1632)
  );
  
  // تحويل الأرقام الهندية (٠١٢٣٤٥٦٧٨٩) إلى إنجليزية
  const persianToEnglish = arabicToEnglish.replace(/[۰-۹]/g, (d) => 
    String.fromCharCode(d.charCodeAt(0) - 1776)
  );
  
  return persianToEnglish;
};

/**
 * تنسيق الأرقام العامة (أرقام إنجليزية بدون رموز)
 * @param num الرقم للتنسيق
 * @returns رقم منسق باللغة الإنجليزية أو "-" إذا كان null/undefined
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return num.toLocaleString("en-US");
};

/**
 * تنسيق العملة (الرقم ثم "ريال")
 * @param num الرقم للتنسيق
 * @param includeDecimals إظهار الكسور (افتراضي: true)
 * @returns رقم منسق مع "ريال" في النهاية
 */
export const formatCurrency = (num: number | null | undefined, includeDecimals: boolean = true): string => {
  if (num === null || num === undefined) return "-";
  
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  };
  
  return `${num.toLocaleString("en-US", options)} ريال`;
};

/**
 * تنسيق النسب المئوية (الرقم ثم "%")
 * @param num النسبة المئوية (مثال: 10 لـ 10%)
 * @returns نسبة مئوية منسقة مع "%" في النهاية
 */
export const formatPercentage = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US")}%`;
};

/**
 * تنسيق المساحة (الرقم ثم "م²")
 * @param num المساحة بالمتر المربع
 * @returns مساحة منسقة مع "م²" في النهاية
 */
export const formatArea = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US")} م²`;
};

/**
 * تنسيق السعر لكل وحدة (الرقم ثم "ريال/م²")
 * @param num السعر لكل متر مربع
 * @returns سعر منسق مع "ريال/م²" في النهاية
 */
export const formatPricePerUnit = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال/م²`;
};

/**
 * تنسيق النسبة مع كسر عشري (مثال: 85.5%)
 * @param num النسبة مع الكسر العشري
 * @param decimalPlaces عدد المنازل العشرية (افتراضي: 1)
 * @returns نسبة مئوية منسقة مع المنازل العشرية
 */
export const formatPercentageWithDecimal = (num: number | null | undefined, decimalPlaces: number = 1): string => {
  if (num === null || num === undefined) return "-";
  return `${num.toLocaleString("en-US", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })}%`;
};

/**
 * تنسيق التاريخ (للتواريخ فقط، ليس جزءاً من متطلبات التنسيق الرقمي)
 * @param date التاريخ
 * @returns تاريخ منسق
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ar-SA');
};
