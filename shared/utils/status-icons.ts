/**
 * Status Icons Helper - مساعد أيقونات الحالات
 * مصدر موحد للحصول على أيقونات وألوان الحالات عبر التطبيق
 */

import { STATUS_CONFIG, StatusKey } from "../config/status-config.js";

// خريطة أيقونات Emoji مميزة لكل حالة (بدلاً من Font Awesome)
export const STATUS_EMOJI_ICONS: Record<StatusKey, string> = {
  New: "📥",                // صندوق وارد - للملفات الجديدة
  WakalahRegistration: "📝", // قلم وورقة - لتسجيل الوكالة
  FilePreparation: "⚙️",    // ترس - للتجهيز
  FileSubmitted: "📤",      // صندوق صادر - للتقديم
  Processing: "🔄",         // سهم دائري - للمعالجة
  Valuation: "📊",          // مخطط - للتقييم
  UnderReview: "👁️",        // عين - للمراجعة
  ObjectionSubmitted: "⚠️", // تحذير - للاعتراض
  PaymentPending: "⏳",     // ساعة رملية - للانتظار
  CheckIssued: "💰",        // كيس نقود - لإصدار الشيك
  Completed: "✅",          // علامة صح - للمكتمل
};

// خريطة أيقونات Font Awesome (للتوافق مع النظام الحالي)
export const STATUS_FA_ICONS: Record<StatusKey, string> = {
  New: "fas fa-file-medical",
  WakalahRegistration: "fas fa-handshake",
  FilePreparation: "fas fa-cogs",
  FileSubmitted: "fas fa-paper-plane",
  Processing: "fas fa-sync-alt",
  Valuation: "fas fa-chart-bar",
  UnderReview: "fas fa-search",
  ObjectionSubmitted: "fas fa-exclamation-triangle",
  PaymentPending: "fas fa-clock",
  CheckIssued: "fas fa-file-invoice-dollar",
  Completed: "fas fa-flag-checkered",
};

/**
 * الحصول على أيقونة الحالة (Emoji)
 */
export function getStatusIcon(statusKey: string): string {
  const config = STATUS_CONFIG.find((s: any) => s.key === statusKey);
  if (!config) return "📄"; // أيقونة افتراضية
  
  return STATUS_EMOJI_ICONS[config.key as StatusKey] || config.icon;
}

/**
 * الحصول على أيقونة Font Awesome للحالة
 */
export function getStatusFaIcon(statusKey: string): string {
  const config = STATUS_CONFIG.find(s => s.key === statusKey);
  if (!config) return "fas fa-file";
  
  return STATUS_FA_ICONS[config.key] || config.icon;
}

/**
 * الحصول على لون الحالة
 */
export function getStatusColor(statusKey: string): string {
  const config = STATUS_CONFIG.find(s => s.key === statusKey);
  if (!config) return "#6b7280"; // لون افتراضي
  
  return config.color;
}

/**
 * الحصول على اسم الحالة بالعربية
 */
export function getStatusName(statusKey: string): string {
  const config = STATUS_CONFIG.find(s => s.key === statusKey);
  if (!config) return statusKey;
  
  return config.name;
}

/**
 * الحصول على تسمية مختصرة للحالة (للـbadges)
 */
export function getStatusShortName(statusKey: string): string {
  const config = STATUS_CONFIG.find(s => s.key === statusKey);
  if (!config) return statusKey.slice(0, 2);
  
  // اختصار من الاسم العربي
  if (config.name === "جديد") return "ج";
  if (config.name === "تسجيل الوكالة") return "وكالة";
  if (config.name === "جاري تجهيز الملف") return "تجهيز";
  if (config.name === "تم تقديم الملف") return "تقديم";
  if (config.name === "قيد المعالجة") return "معالجة";
  if (config.name === "التقييم") return "تقييم";
  if (config.name === "قيد المراجعة") return "مراجعة";
  if (config.name === "تقديم اعتراض") return "اعتراض";
  if (config.name === "في انتظار الدفع") return "انتظار";
  if (config.name === "تم إصدار الشيك") return "شيك";
  if (config.name === "مكتمل") return "مكتمل";
  
  return config.name.slice(0, 3);
}

/**
 * الحصول على كافة إعدادات الحالة
 */
export function getStatusConfig(statusKey: string) {
  return STATUS_CONFIG.find(s => s.key === statusKey);
}

/**
 * التحقق مما إذا كانت أيقونة من نوع Font Awesome
 */
export function isFontAwesomeIcon(icon: string): boolean {
  return icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ');
}

/**
 * تحويل أيقونة Font Awesome إلى Emoji للاستخدام في المكونات البسيطة
 */
export function faToEmoji(icon: string): string {
  const faToEmojiMap: Record<string, string> = {
    'fas fa-file-medical': '📥',
    'fas fa-handshake': '📝',
    'fas fa-cogs': '⚙️',
    'fas fa-paper-plane': '📤',
    'fas fa-sync-alt': '🔄',
    'fas fa-chart-bar': '📊',
    'fas fa-search': '👁️',
    'fas fa-exclamation-triangle': '⚠️',
    'fas fa-clock': '⏳',
    'fas fa-file-invoice-dollar': '💰',
    'fas fa-flag-checkered': '✅',
    'fas fa-file': '📄',
  };
  
  return faToEmojiMap[icon] || '📄';
}
