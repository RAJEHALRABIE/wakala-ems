/**
 * Status Configuration - تهيئة الحالات الـ11 لرحلة المعاملة
 * مصدر الحقيقة الوحيد لإعدادات الحالات في النظام
 */

import { ClientStatus, STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";

export type StatusKey = ClientStatus;

export interface StatusConfig {
  id: number;
  key: StatusKey;
  name: string;
  icon: string;
  color: string;
  description?: string;
}

// تهيئة الحالات الـ11 - متوافقة مع الحالات الحالية في النظام
export const STATUS_CONFIG: StatusConfig[] = [
  { 
    id: 1, 
    key: "New", 
    name: "جديد", 
    icon: "fas fa-file-medical", 
    color: STATUS_COLORS.New,
    description: "ملف جديد تم إنشاؤه ولم تتم معالجته بعد" 
  },
  { 
    id: 2, 
    key: "WakalahRegistration", 
    name: "تسجيل الوكالة", 
    icon: "fas fa-handshake", 
    color: STATUS_COLORS.WakalahRegistration,
    description: "مرحلة تسجيل وكالة التعويض" 
  },
  { 
    id: 3, 
    key: "FilePreparation", 
    name: "جاري تجهيز الملف", 
    icon: "fas fa-cogs", 
    color: STATUS_COLORS.FilePreparation,
    description: "تحضير المستندات والأوراق المطلوبة" 
  },
  { 
    id: 4, 
    key: "FileSubmitted", 
    name: "تم تقديم الملف", 
    icon: "fas fa-paper-plane", 
    color: STATUS_COLORS.FileSubmitted,
    description: "تم تقديم الملف للجهة المختصة" 
  },
  { 
    id: 5, 
    key: "Processing", 
    name: "قيد المعالجة", 
    icon: "fas fa-sync-alt", 
    color: STATUS_COLORS.Processing,
    description: "الملف قيد المعالجة والمراجعة" 
  },
  { 
    id: 6, 
    key: "Valuation", 
    name: "التقييم", 
    icon: "fas fa-chart-bar", 
    color: STATUS_COLORS.Valuation,
    description: "مرحلة تقييم الملف وتحديد التعويض" 
  },
  { 
    id: 7, 
    key: "UnderReview", 
    name: "قيد المراجعة", 
    icon: "fas fa-search", 
    color: STATUS_COLORS.UnderReview,
    description: "الملف قيد المراجعة النهائية" 
  },
  { 
    id: 8, 
    key: "ObjectionSubmitted", 
    name: "تقديم اعتراض", 
    icon: "fas fa-exclamation-triangle", 
    color: STATUS_COLORS.ObjectionSubmitted,
    description: "تم تقديم اعتراض على القرار" 
  },
  { 
    id: 9, 
    key: "PaymentPending", 
    name: "في انتظار الدفع", 
    icon: "fas fa-clock", 
    color: STATUS_COLORS.PaymentPending,
    description: "في انتظار إصدار الدفع" 
  },
  { 
    id: 10, 
    key: "CheckIssued", 
    name: "تم إصدار الشيك", 
    icon: "fas fa-file-invoice-dollar", 
    color: STATUS_COLORS.CheckIssued,
    description: "تم إصدار شيك التعويض" 
  },
  { 
    id: 11, 
    key: "Completed", 
    name: "مكتمل", 
    icon: "fas fa-flag-checkered", 
    color: STATUS_COLORS.Completed,
    description: "تم الانتهاء من الملف بنجاح" 
  }
];

// Extract status keys array
export const STATUS_KEYS = STATUS_CONFIG.map(s => s.key);

// Helper function to get status config by key
export function getStatusConfig(key: StatusKey): StatusConfig | undefined {
  return STATUS_CONFIG.find(status => status.key === key);
}

// Helper function to get all status names in Arabic
export function getStatusNames(): Record<StatusKey, string> {
  return STATUS_CONFIG.reduce((acc, status) => {
    acc[status.key] = status.name;
    return acc;
  }, {} as Record<StatusKey, string>);
}

// Helper function to get status count display text
export function getStatusCountText(key: StatusKey, count: number): string {
  const status = getStatusConfig(key);
  const fileText = count === 1 ? "ملف" : "ملفات";
  return `${status?.name || key} – ${count} ${fileText}`;
}
