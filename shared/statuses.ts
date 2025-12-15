/**
 * Client Status Configuration
 * حالات الملف - القائمة الموحدة لكامل النظام
 */

// Status keys (English - for database and code)
export const CLIENT_STATUSES = [
  "New",                    // جديد
  "WakalahRegistration",    // تسجيل الوكالة
  "FilePreparation",        // جاري تجهيز الملف
  "FileSubmitted",          // تم تقديم الملف
  "Processing",             // قيد المعالجة
  "Valuation",              // التقييم
  "UnderReview",            // قيد المراجعة
  "ObjectionSubmitted",     // تقديم اعتراض
  "PaymentPending",         // في انتظار الدفع
  "CheckIssued",            // تم إصدار الشيك
  "Completed"               // مكتمل
] as const;

export type ClientStatus = typeof CLIENT_STATUSES[number];

// Arabic labels for display
export const STATUS_LABELS: Record<ClientStatus, string> = {
  New: "جديد",
  WakalahRegistration: "تسجيل الوكالة",
  FilePreparation: "جاري تجهيز الملف",
  FileSubmitted: "تم تقديم الملف",
  Processing: "قيد المعالجة",
  Valuation: "التقييم",
  UnderReview: "قيد المراجعة",
  ObjectionSubmitted: "تقديم اعتراض",
  PaymentPending: "في انتظار الدفع",
  CheckIssued: "تم إصدار الشيك",
  Completed: "مكتمل",
};

// Colors for status badges and charts
export const STATUS_COLORS: Record<ClientStatus, string> = {
  New: "#3b82f6",              // أزرق
  WakalahRegistration: "#6366f1", // بنفسجي
  FilePreparation: "#8b5cf6",  // بنفسجي فاتح
  FileSubmitted: "#a855f7",    // أرجواني
  Processing: "#eab308",       // أصفر
  Valuation: "#f97316",        // برتقالي
  UnderReview: "#14b8a6",      // تركوازي
  ObjectionSubmitted: "#ef4444", // أحمر
  PaymentPending: "#06b6d4",   // سماوي
  CheckIssued: "#10b981",      // أخضر فاتح
  Completed: "#22c55e",        // أخضر
};

// Background colors for badges (lighter versions)
export const STATUS_BG_COLORS: Record<ClientStatus, string> = {
  New: "bg-blue-100 text-blue-800",
  WakalahRegistration: "bg-indigo-100 text-indigo-800",
  FilePreparation: "bg-violet-100 text-violet-800",
  FileSubmitted: "bg-purple-100 text-purple-800",
  Processing: "bg-yellow-100 text-yellow-800",
  Valuation: "bg-orange-100 text-orange-800",
  UnderReview: "bg-teal-100 text-teal-800",
  ObjectionSubmitted: "bg-red-100 text-red-800",
  PaymentPending: "bg-cyan-100 text-cyan-800",
  CheckIssued: "bg-emerald-100 text-emerald-800",
  Completed: "bg-green-100 text-green-800",
};

// Migration map from old statuses to new statuses
export const STATUS_MIGRATION_MAP: Record<string, ClientStatus> = {
  // Old statuses -> New statuses
  "New": "New",
  "FileSubmitted": "FileSubmitted",
  "Processing": "Processing",
  "Valuation": "Valuation",
  "Objection": "ObjectionSubmitted",
  "PaymentPending": "PaymentPending",
  "CheckIssued": "CheckIssued",
  "Completed": "Completed",
};

// Helper function to get status label
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as ClientStatus] || status;
}

// Helper function to get status color
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as ClientStatus] || "#6b7280";
}

// Helper function to get status badge classes
export function getStatusBadgeClasses(status: string): string {
  return STATUS_BG_COLORS[status as ClientStatus] || "bg-gray-100 text-gray-800";
}
