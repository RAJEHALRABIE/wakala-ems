import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, MapPin, DollarSign, FileText, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIENT_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";
import { formatNumber, formatCurrency, formatArea } from "@shared/formatting";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">لوحة التحكم</h1>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  // إجمالي عدد الملفات (نفس إجمالي العملاء)
  const totalFiles = stats?.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-right">لوحة التحكم</h1>
        
        {/* البطاقات الأربع - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* بطاقة 1: إجمالي العملاء */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 md:p-4 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <span className="text-sm text-muted-foreground flex-1">إجمالي العملاء</span>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600 whitespace-nowrap">
                {formatNumber(stats?.total || 0)}
              </div>
            </CardContent>
          </Card>

          {/* بطاقة 2: إجمالي المساحة */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 md:p-4 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <span className="text-sm text-muted-foreground flex-1">إجمالي المساحة</span>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-600 whitespace-nowrap">
                {formatArea(stats?.totalArea || 0)}
              </div>
            </CardContent>
          </Card>

          {/* بطاقة 3: إجمالي التعويضات المتوقعة */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 md:p-4 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <span className="text-sm text-muted-foreground flex-1">إجمالي التعويضات المتوقَّعة</span>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold text-green-600 whitespace-nowrap">
                {formatCurrency(stats?.totalCompensation || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-right">
                القيمة تقديرية قبل الصرف الفعلي وقد تتغير بعد استكمال الإجراءات
              </div>
            </CardContent>
          </Card>

          {/* بطاقة 4: عدد الملفات بالنظام */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 md:p-4 text-right">
              <div className="flex items-center justify-end gap-3 mb-3">
                <span className="text-sm text-muted-foreground flex-1">عدد الملفات بالنظام</span>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-amber-600 whitespace-nowrap">
                {formatNumber(totalFiles)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قسم توزيع الحالات */}
        <Card className="text-right">
          <CardHeader className="pb-3 pr-4">
            <CardTitle className="text-lg text-right pr-2">
              توزيع الحالات
            </CardTitle>
          </CardHeader>
          <CardContent className="pr-4">
            <div className="space-y-4">
              {CLIENT_STATUSES.map((status: string) => {
                const count = stats?.byStatus?.[status] || 0;
                const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
                
                // إعداد نص الحالة باللغة العربية
                const statusLabel = STATUS_LABELS[status];
                const fileText = count === 1 ? "ملف" : "ملفات";
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">
                        {statusLabel} – {count} {fileText}
                      </div>
                    </div>
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 right-0 h-full bg-blue-400 transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
