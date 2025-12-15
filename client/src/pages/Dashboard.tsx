import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, MapPin, DollarSign, CheckCircle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIENT_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";

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

  const formatNumber = (num: number) => num.toLocaleString("ar-SA");
  const formatCurrency = (num: number) => `${formatNumber(num)}`;

  // Calculate max for chart
  const maxStatusCount = Math.max(...Object.values(stats?.byStatus || { default: 1 }), 1);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">لوحة التحكم</h1>
      
      {/* Main Stats - 2 Columns Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* إجمالي العملاء */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي العملاء</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats?.total || 0)}</div>
            <div className="text-[10px] text-muted-foreground">عميل</div>
          </CardContent>
        </Card>

        {/* إجمالي المساحة */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي المساحة</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{formatNumber(stats?.totalArea || 0)}</div>
            <div className="text-[10px] text-muted-foreground">م²</div>
          </CardContent>
        </Card>

        {/* إجمالي التعويضات */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي التعويضات</span>
            </div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(stats?.totalCompensation || 0)}</div>
            <div className="text-[10px] text-muted-foreground">ريال</div>
          </CardContent>
        </Card>

        {/* الملفات المكتملة */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">الملفات المكتملة</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{formatNumber(stats?.byStatus?.Completed || 0)}</div>
            <div className="text-[10px] text-muted-foreground">ملف</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown - Bar Chart Style */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            توزيع الحالات
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2">
            {CLIENT_STATUSES.map((status) => {
              const count = stats?.byStatus?.[status] || 0;
              const percentage = maxStatusCount > 0 ? (count / maxStatusCount) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-24 text-xs text-muted-foreground truncate">{STATUS_LABELS[status]}</div>
                  <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden relative">
                    <div 
                      className="h-full rounded transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: STATUS_COLORS[status]
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {count > 0 && count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
