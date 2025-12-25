import { useState, useEffect } from "react";
import { useStatusCounts } from "@/hooks/useStatusCounts";
import { STATUS_CONFIG, StatusKey } from "@shared/config/status-config";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";
import { getStatusIcon, getStatusColor } from "@shared/utils/status-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface ClientStatusDashboardProps {
  /**
   * دالة تنفيذية تُستدعى عند النقر على حالة لتصفية قائمة العملاء
   * @param status - مفتاح الحالة المحددة، أو null لإلغاء الفلترة
   */
  onStatusFilter?: (status: StatusKey | null) => void;
  
  /**
   * حالة محددة مسبقاً (مفيدة لتحديد البطاقة النشطة)
   */
  selectedStatus?: StatusKey | null;
  
  /**
   * عرض تفاصيل إضافية لكل بطاقة (الوصف)
   */
  showDescription?: boolean;
}

export function ClientStatusDashboard({
  onStatusFilter,
  selectedStatus: externalSelectedStatus,
  showDescription = false,
}: ClientStatusDashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | null>(
    externalSelectedStatus || null
  );
  const { counts, loading, error, refetch } = useStatusCounts();
  const { sounds } = useSoundEffects();

  // مزامنة مع القيمة الخارجية إذا تغيرت
  useEffect(() => {
    if (externalSelectedStatus !== undefined) {
      setSelectedStatus(externalSelectedStatus);
    }
  }, [externalSelectedStatus]);

  const handleStatusClick = (statusKey: StatusKey) => {
    const newStatus = selectedStatus === statusKey ? null : statusKey;
    setSelectedStatus(newStatus);
    
    // تشغيل صوت النقر
    sounds.click();
    
    // 🔗 ربط الفلترة بقائمة العملاء
    if (onStatusFilter) {
      onStatusFilter(newStatus);
    }
    
    // تحديث URL للتراجع والمشاركة (اختياري)
    try {
      const url = new URL(window.location.href);
      if (newStatus) {
        url.searchParams.set('status', newStatus);
      } else {
        url.searchParams.delete('status');
      }
      window.history.pushState({}, '', url);
    } catch (e) {
      console.warn('لا يمكن تحديث URL:', e);
    }
    
    // إشعار المستخدم
    if (newStatus) {
      const statusName = STATUS_LABELS[newStatus] || newStatus;
      toast.info(`تم تصفية القائمة بحالة "${statusName}"`);
    } else {
      toast.info('تم إلغاء الفلترة وعرض جميع الملفات');
    }
  };

  const handleRefresh = () => {
    refetch();
    sounds.success();
    toast.success('تم تحديث إحصائيات الحالات');
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-6 text-center">
          <div className="text-red-600 dark:text-red-400 font-medium">
            خطأ في تحميل البيانات
          </div>
          <div className="text-sm text-red-500 dark:text-red-300 mt-2">
            {error.message || 'حدث خطأ غير متوقع'}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  // إجمالي عدد الملفات
  const totalFiles = Object.values(counts as Record<string, number>).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3 pr-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-right pr-2">
            توزيع الحالات ({totalFiles} ملف)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8"
              disabled={loading}
              title="تحديث البيانات"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {selectedStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusClick(selectedStatus)}
                className="h-8"
              >
                <Filter className="h-3.5 w-3.5 ml-1" />
                إلغاء الفلترة
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-right pr-2">
          انقر على أي حالة لتصفية قائمة العملاء تلقائياً
        </p>
      </CardHeader>
      
      <CardContent className="pr-4">
        {loading ? (
          // Skeleton loading
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          // شبكة بطاقات الحالات
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2">
            {STATUS_CONFIG.map((status) => {
              const count = counts[status.key] || 0;
              const isActive = selectedStatus === status.key;
              const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
              
              return (
                <div
                  key={status.id}
                  className={`
                    relative group cursor-pointer
                    transition-all duration-200
                    ${isActive 
                      ? 'ring-2 ring-offset-2 scale-[1.02]' 
                      : 'hover:scale-[1.02] hover:shadow-md'
                    }
                  `}
                  style={{
                    borderColor: isActive ? status.color : 'transparent',
                  }}
                  onClick={() => handleStatusClick(status.key)}
                  title={showDescription ? status.description : `${status.name} – ${count} ملف`}
                  aria-label={`${status.name}: ${count} ملف`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStatusClick(status.key);
                    }
                  }}
                >
                  <Card className={`
                    overflow-hidden border-2 h-full
                    ${isActive ? 'border-primary/50' : 'border-border/50'}
                    transition-colors duration-200
                    hover:border-primary/30
                  `}>
                    <CardContent className="p-4 text-center">
                      {/* النسبة المئوية (رسم دائري بسيط) */}
                      <div className="relative w-12 h-12 mx-auto mb-3">
                        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                        <div 
                          className="absolute inset-0 rounded-full border-4 border-transparent"
                          style={{
                            borderTopColor: status.color,
                            borderRightColor: status.color,
                            borderBottomColor: status.color,
                            borderLeftColor: count > 0 ? status.color : 'transparent',
                            transform: `rotate(${percentage * 3.6}deg)`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/90 shadow-sm"
                            style={{ 
                              backgroundColor: `${status.color}15`,
                              boxShadow: `0 2px 6px ${status.color}30`
                            }}
                          >
                            <span className="text-xl">{getStatusIcon(status.key)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* العدد واسم الحالة في صف واحد */}
                      <div className="space-y-1">
                        <div 
                          className="text-2xl font-bold transition-colors leading-none"
                          style={{ color: status.color }}
                        >
                          {count}
                        </div>
                        
                        <div className="text-xs font-medium text-foreground line-clamp-2 h-8 flex items-center justify-center">
                          {status.name}
                        </div>
                      </div>
                      
                      {/* النسبة المئوية */}
                      {totalFiles > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-1 font-medium">
                          {percentage.toFixed(0)}%
                        </div>
                      )}
                      
                      {/* الوصف (اختياري) */}
                      {showDescription && status.description && (
                        <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {status.description}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* تأثير Hover */}
                  <div className={`
                    absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    pointer-events-none
                  `} />
                </div>
              );
            })}
          </div>
        )}
        
        {/* ملخص المعلومات */}
        {!loading && (
          <div className="mt-6 pt-4 border-t border-border/50 text-sm text-muted-foreground text-center">
            <p>
              {selectedStatus ? (
                <>
                  قائمة العملاء مفلترة بحالة{' '}
                  <span className="font-bold" style={{ color: STATUS_COLORS[selectedStatus as keyof typeof STATUS_COLORS] }}>
                    {STATUS_LABELS[selectedStatus as keyof typeof STATUS_LABELS]}
                  </span>
                  {' '}({counts[selectedStatus] || 0} ملف)
                </>
              ) : (
                `عرض جميع الملفات (${totalFiles} ملف)`
              )}
            </p>
            <p className="text-xs mt-1">
              تم التحديث: {new Date().toLocaleTimeString('ar-SA')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * مكون شريط أفقي للجوال
 */
export function MobileHorizontalStatusDashboard({
  onStatusFilter,
  selectedStatus: externalSelectedStatus,
}: ClientStatusDashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusKey | null>(
    externalSelectedStatus || null
  );
  const { counts, loading } = useStatusCounts();
  const { sounds } = useSoundEffects();

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
      <div className="flex gap-2 overflow-x-auto pb-2 px-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex-shrink-0 w-16 h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide touch-scroll">
        {STATUS_CONFIG.map((status) => {
          const count = counts[status.key] || 0;
          const isActive = selectedStatus === status.key;
          
          return (
            <button
              key={status.id}
              onClick={() => handleStatusClick(status.key)}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center
                w-14 h-14 rounded-lg border transition-all duration-150
                ${isActive 
                  ? 'border-primary bg-primary/5 scale-105' 
                  : 'border-border/30 hover:border-primary/20 hover:bg-accent'
                }
                active:scale-95
              `}
              title={`${status.name} - ${count} ملف`}
            >
              <div className="text-sm">{getStatusIcon(status.key)}</div>
              <div 
                className="text-base font-bold mt-0.5"
                style={{ color: status.color }}
              >
                {count}
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1 max-w-[50px]">
                {status.name.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * نسخة مبسطة من Dashboard لاستخدامها في المساحات الضيقة
 */
export function CompactStatusDashboard({ onStatusFilter }: ClientStatusDashboardProps) {
  const { counts, loading } = useStatusCounts();

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-20 rounded-lg flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {STATUS_CONFIG.slice(0, 8).map((status) => {
        const count = counts[status.key] || 0;
        
        return (
          <button
            key={status.id}
            className="flex flex-col items-center justify-center p-3 rounded-lg border 
                     hover:bg-accent hover:border-primary/30 transition-all duration-200
                     flex-shrink-0 min-w-20"
            onClick={() => onStatusFilter?.(status.key)}
            title={`${status.name} – ${count} ملف`}
          >
            <div className="text-xl mb-1">{status.icon.startsWith('fas') ? '📄' : status.icon}</div>
            <div 
              className="text-lg font-bold"
              style={{ color: status.color }}
            >
              {count}
            </div>
            <div className="text-xs text-muted-foreground text-center line-clamp-1">
              {status.name}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * مكون لاستخدامه في لوحة التحكم الرئيسية (Dashboard) بدلاً من البطاقات الأربع القديمة
 */
export function DashboardStatusOverview() {
  const { counts } = useStatusCounts();
  const totalFiles = Object.values(counts as Record<string, number>).reduce((sum: number, count: number) => sum + count, 0);
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      {STATUS_CONFIG.map((status) => (
        <Card key={status.id} className="border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-4 text-center">
            <div 
              className="text-2xl font-bold mb-1"
              style={{ color: status.color }}
            >
              {(counts as Record<string, number>)[status.key] || 0}
            </div>
            <div className="text-sm font-medium">{status.name}</div>
          </CardContent>
        </Card>
      ))}
      <Card className="border-border/50 col-span-2 sm:col-span-3 md:col-span-6">
        <CardContent className="p-4 text-center">
          <div className="text-lg font-bold">إجمالي الملفات</div>
          <div className="text-3xl font-bold text-primary mt-2">{totalFiles}</div>
        </CardContent>
      </Card>
    </div>
  );
}
