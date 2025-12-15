import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  PieChart,
  Target,
  Wallet
} from "lucide-react";
import { CLIENT_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";

export default function Statistics() {
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const formatNumber = (num: number | null) => num ? num.toLocaleString("ar-SA") : "0";
  const formatCurrency = (num: number | null) => num ? `${formatNumber(num)}` : "0";

  // Calculate statistics
  const avgCompensation = clients?.length 
    ? Math.round((stats?.totalCompensation || 0) / clients.length) 
    : 0;

  const avgArea = clients?.length 
    ? Math.round((stats?.totalArea || 0) / clients.length) 
    : 0;

  // Group by district
  const byDistrict = clients?.reduce((acc, client) => {
    const district = client.district || "غير محدد";
    acc[district] = (acc[district] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Top districts
  const topDistricts = Object.entries(byDistrict)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Calculate total expected commission
  const totalCommission = clients?.reduce((sum, client) => {
    const total = parseFloat(client.expectedCompensationTotal || "0");
    const fee = parseFloat(client.successFee || "0");
    if (total && fee) {
      return sum + Math.round(total * (fee / 100));
    }
    return sum;
  }, 0) || 0;

  // Calculate max values for charts
  const maxStatusCount = Math.max(...Object.values(stats?.byStatus || { default: 1 }), 1);
  const maxDistrictCount = Math.max(...topDistricts.map(d => d[1]), 1);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">الإحصائيات</h1>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">الإحصائيات</h1>

      {/* Key Metrics - 2 Columns Grid */}
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

        {/* إجمالي المساحات */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي المساحات</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{formatNumber(stats?.totalArea || 0)}</div>
            <div className="text-[10px] text-muted-foreground">م² • متوسط {formatNumber(avgArea)} م²</div>
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
                <Target className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-xs text-muted-foreground">الملفات المكتملة</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{formatNumber(stats?.byStatus?.Completed || 0)}</div>
            <div className="text-[10px] text-muted-foreground">ملف</div>
          </CardContent>
        </Card>

        {/* إجمالي العمولات */}
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-xs text-muted-foreground">إجمالي العمولات</span>
            </div>
            <div className="text-xl font-bold text-purple-600">{formatCurrency(totalCommission)}</div>
            <div className="text-[10px] text-muted-foreground">ريال متوقع</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution - Bar Chart Style */}
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

      {/* Top Districts - Horizontal Bar Chart */}
      {topDistricts.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              أكثر المناطق
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-2">
              {topDistricts.map(([district, count], index) => {
                const percentage = maxDistrictCount > 0 ? (count / maxDistrictCount) * 100 : 0;
                const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f97316'];
                return (
                  <div key={district} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: colors[index] }}>
                      {index + 1}
                    </div>
                    <div className="w-16 text-xs truncate">{district}</div>
                    <div className="flex-1 h-5 bg-muted/50 rounded overflow-hidden relative">
                      <div 
                        className="h-full rounded transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colors[index]
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">متوسط التعويض</div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(avgCompensation)}</div>
            <div className="text-[10px] text-blue-500">ريال / عميل</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-green-600 dark:text-green-400 mb-1">متوسط المساحة</div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300">{formatNumber(avgArea)}</div>
            <div className="text-[10px] text-green-500">م² / عميل</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
