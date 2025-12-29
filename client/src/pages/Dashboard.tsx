import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, MapPin, DollarSign, TrendingUp, BarChart3, Activity, UserPlus, Map } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CLIENT_STATUSES, STATUS_LABELS } from "@shared/statuses";
import { formatNumber, formatCurrency, formatArea } from "@shared/formatting";

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 ml-auto" />
          
          {/* بطاقات التحميل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="w-16 h-16 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-32 mt-4 ml-auto" />
                  <Skeleton className="h-3 w-40 mt-2 ml-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* مخطط دائري التحميل */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-48 ml-auto" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  <Skeleton className="w-48 h-48 rounded-full" />
                  <div className="flex-1 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 ml-auto" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // إجمالي عدد الملفات (نفس إجمالي العملاء)
  const totalFiles = stats?.total || 0;
  // إجمالي الاتعاب المقدرة
  const totalFees = stats?.totalFees || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-right">لوحة التحكم</h1>
        
        {/* البطاقات الإحصائية - تصميم محسن */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* بطاقة 1: إجمالي العملاء */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardContent className="p-6 text-right relative">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">إجمالي العملاء</p>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(stats?.total || 0)}</div>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">+0% هذا الشهر</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة 2: إجمالي المساحة */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20">
            <CardContent className="p-6 text-right relative">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">إجمالي المساحة</p>
                <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{formatArea(stats?.totalArea || 0)}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">مجموع مساحات جميع الملفات</div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة 3: إجمالي التعويضات المتوقعة */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
            <CardContent className="p-6 text-right relative">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">إجمالي التعويضات المتوقعة</p>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(stats?.totalCompensation || 0)}</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-2">قيمة تقديرية قابلة للتعديل</div>
              </div>
            </CardContent>
          </Card>

          {/* بطاقة 4: إجمالي الاتعاب المقدرة */}
          <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20">
            <CardContent className="p-6 text-right relative">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">إجمالي الاتعاب المقدرة</p>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{formatCurrency(totalFees)}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">نسبة {((totalFees / (stats?.totalCompensation || 1)) * 100).toFixed(1)}% من التعويضات</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* قسم توزيع الحالات مع مخطط دائري */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* مخطط دائري بسيط */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-right flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                توزيع الحالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* المخطط الدائري البسيط */}
                <div className="relative w-48 h-48">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                    {(() => {
                      let currentAngle = 0;
                      const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
                      const statusData = CLIENT_STATUSES.map((status, index) => {
                        const count = stats?.byStatus?.[status] || 0;
                        const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
                        const angle = (percentage / 100) * 360;
                        
                        const startAngle = currentAngle;
                        currentAngle += angle;
                        
                        const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180);
                        const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        return {
                          status,
                          count,
                          percentage,
                          color: colors[index % colors.length],
                          path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
                        };
                      });
                      
                      return (
                        <>
                          {statusData.map((item, index) => (
                            <path
                              key={item.status}
                              d={item.path}
                              fill={item.color}
                              stroke="white"
                              strokeWidth="2"
                              className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                            />
                          ))}
                          <circle cx="50" cy="50" r="15" fill="white" />
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalFiles}</div>
                      <div className="text-sm text-muted-foreground">ملف</div>
                    </div>
                  </div>
                </div>
                
                {/* مفتاح الألوان */}
                <div className="flex-1 space-y-4">
                  {CLIENT_STATUSES.map((status, index) => {
                    const count = stats?.byStatus?.[status] || 0;
                    const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
                    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
                    const statusLabel = STATUS_LABELS[status];
                    
                    return (
                      <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <span className="font-medium">{statusLabel}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{count} ملف</div>
                          <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* آخر النشاطات */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-right flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                العملاء الجدد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.total && stats.total > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">شريفه حسن العامري</div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">جديد</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">القنفذة-سبت الجارة</div>
                      <div className="text-xs text-muted-foreground mt-2">تم الإضافة: 21/12/2025</div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">موسى حسن الربعي</div>
                        <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">جديد</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">بارق-خميس حرب</div>
                      <div className="text-xs text-muted-foreground mt-2">تم الإضافة: 16/02/2025</div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">خالد محمد الحربي</div>
                        <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">جديد</div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">القنفذة-القوز</div>
                      <div className="text-xs text-muted-foreground mt-2">تم الإضافة: 28/12/2025</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد عملاء مسجلين بعد
                  </div>
                )}
                <div className="text-center pt-2">
                  <button className="text-sm text-primary hover:underline">
                    عرض جميع العملاء →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* قسم آخر النشاطات وخريطة مصغرة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* آخر النشاطات */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-right flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                آخر النشاطات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">تم إضافة عميل جديد</div>
                      <div className="text-sm text-muted-foreground">شريفه حسن العامري</div>
                      <div className="text-xs text-muted-foreground mt-1">منذ 5 دقائق</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">تم تحديث إحداثيات الموقع</div>
                      <div className="text-sm text-muted-foreground">موسى حسن الربعي</div>
                      <div className="text-xs text-muted-foreground mt-1">منذ ساعتين</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">تم تحديث تقدير التعويض</div>
                      <div className="text-sm text-muted-foreground">خالد محمد الحربي</div>
                      <div className="text-xs text-muted-foreground mt-1">منذ يوم</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="font-medium">تم تعيين وكيل للعميل</div>
                      <div className="text-sm text-muted-foreground">شريفه حسن العامري</div>
                      <div className="text-xs text-muted-foreground mt-1">منذ يومين</div>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <button className="text-sm text-primary hover:underline">
                    عرض سجل النشاطات الكامل →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* خريطة مصغرة */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-right flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                توزيع جغرافي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  {/* خريطة مبسطة */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      {/* نقاط على الخريطة */}
                      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                      
                      {/* خطوط الوصل */}
                      <div className="absolute top-1/4 left-1/4 w-1/4 h-0.5 bg-blue-300 transform rotate-45 origin-top-left"></div>
                      <div className="absolute top-1/3 right-1/3 w-1/4 h-0.5 bg-emerald-300 transform -rotate-30 origin-top-right"></div>
                      
                      {/* مفتاح المناطق */}
                      <div className="absolute -bottom-8 right-0 text-xs text-muted-foreground">
                        3 مواقع نشطة
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">القنفذة-سبت الجارة</span>
                    </div>
                    <span className="text-sm font-medium">1 عميل</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm">بارق-خميس حرب</span>
                    </div>
                    <span className="text-sm font-medium">1 عميل</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm">القنفذة-القوز</span>
                    </div>
                    <span className="text-sm font-medium">1 عميل</span>
                  </div>
                </div>
                
                <div className="text-center pt-2">
                  <button className="text-sm text-primary hover:underline">
                    عرض الخريطة التفصيلية →
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}