import { useState, useEffect } from "react";
import { useStatusCounts } from "@/hooks/useStatusCounts";
import { STATUS_CONFIG, type StatusKey } from "@shared/config/status-config";
import { STATUS_LABELS } from "@shared/statuses";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface MobileStatusBarProps {
  onStatusFilter?: (status: StatusKey | null) => void;
  selectedStatus?: StatusKey | null;
}

const STATUS_EMOJIS: Record<string, string> = {
  New: "🆕",
  WakalahRegistration: "✍️",
  FilePreparation: "📋",
  FileSubmitted: "📤",
  Processing: "⚙️",
  Valuation: "💰",
  UnderReview: "👁️",
  ObjectionSubmitted: "⚠️",
  Objection: "⚠️",
  PaymentPending: "⏳",
  CheckIssued: "🏦",
  Completed: "✅",
};

export function MobileStatusBar({ 
  onStatusFilter, 
  selectedStatus: externalSelectedStatus 
}: MobileStatusBarProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | null>(
    externalSelectedStatus || null
  );
  const { counts, loading } = useStatusCounts();
  const { sounds } = useSoundEffects();
  const totalFiles = Object.values(counts as Record<string, number>).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    if (externalSelectedStatus !== undefined) {
      setSelectedStatus(externalSelectedStatus);
    }
  }, [externalSelectedStatus]);

  const handleStatusClick = (statusKey: StatusKey) => {
    const newStatus = selectedStatus === statusKey ? null : statusKey;
    setSelectedStatus(newStatus);
    sounds.click();
    onStatusFilter?.(newStatus);
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto py-3 px-2 bg-white dark:bg-gray-800 rounded-lg mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-shrink-0 w-24">
            <Skeleton className="w-14 h-14 rounded-full mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* العنوان */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
          توزيع الحالات ({totalFiles} ملف)
        </h3>
        {selectedStatus && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusClick(selectedStatus)}
            className="h-8 text-xs"
          >
            <Filter className="h-3 w-3 ml-1" />
            إلغاء الفلترة
          </Button>
        )}
      </div>

      {/* الشريط الأفقي */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide touch-scroll">
          {STATUS_CONFIG.map((status) => {
            const count = (counts as Record<string, number>)[status.key] || 0;
            const isActive = selectedStatus === status.key;
            const percentage = totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0;

            return (
              <button
                key={status.id}
                onClick={() => handleStatusClick(status.key)}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center
                  w-24 p-3 rounded-xl border-2 transition-all duration-200
                  ${isActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105 shadow-md' 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-blue-300'
                  }
                  active:scale-95
                `}
                title={`${status.name} - ${count} ملف (${percentage}%)`}
              >
                {/* الإيموجي الكبير */}
                <div className="text-3xl mb-2">
                  {STATUS_EMOJIS[status.key] || "📊"}
                </div>
                
                {/* العدد */}
                <div 
                  className="text-xl font-bold mb-1 text-gray-900 dark:text-white"
                  style={{ color: isActive ? status.color : undefined }}
                >
                  {count}
                </div>
                
                {/* اسم الحالة */}
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">
                  {status.name}
                </div>
                
                {/* النسبة المئوية */}
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {percentage}%
                </div>
              </button>
            );
          })}
        </div>

        {/* مؤشر التمرير */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none" />
      </div>

      {/* حالة التصفية النشطة */}
      {selectedStatus && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              مفلتر بحالة:
            </span>
            <span 
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: `${STATUS_CONFIG.find(s => s.key === selectedStatus)?.color}20`,
                color: STATUS_CONFIG.find(s => s.key === selectedStatus)?.color
              }}
            >
              {STATUS_LABELS[selectedStatus as keyof typeof STATUS_LABELS]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
