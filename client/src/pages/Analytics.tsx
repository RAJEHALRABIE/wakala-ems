import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  MousePointerClick, 
  TrendingUp,
  Phone,
  MessageSquare,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const DATE_RANGES = [
  { label: "آخر 7 أيام", days: 7 },
  { label: "آخر 30 يوم", days: 30 },
  { label: "آخر 90 يوم", days: 90 },
] as const;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [selectedRange, setSelectedRange] = useState(7);

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - selectedRange * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } =
    trpc.analytics.getKPIs.useQuery({ startDate, endDate }, { staleTime: 5 * 60 * 1000 });
  
  const { data: agentClicks, isLoading: clicksLoading, refetch: refetchClicks } =
    trpc.analytics.getAgentClicks.useQuery({ startDate, endDate }, { staleTime: 5 * 60 * 1000 });
  
  const { data: sessionsOverTime, isLoading: sessionsLoading, refetch: refetchSessions } =
    trpc.analytics.getSessionsOverTime.useQuery({ startDate, endDate }, { staleTime: 5 * 60 * 1000 });

  const isLoading = kpisLoading || clicksLoading || sessionsLoading;

  const agentClicksSummary = agentClicks?.reduce((acc, curr) => {
    const existing = acc.find(item => item.agentName === curr.agentName);
    if (existing) {
      existing.totalClicks += curr.clicks;
      if (curr.contactMethod === 'whatsapp') existing.whatsappClicks += curr.clicks;
      if (curr.contactMethod === 'call') existing.callClicks += curr.clicks;
    } else {
      acc.push({
        agentName: curr.agentName,
        totalClicks: curr.clicks,
        whatsappClicks: curr.contactMethod === 'whatsapp' ? curr.clicks : 0,
        callClicks: curr.contactMethod === 'call' ? curr.clicks : 0,
      });
    }
    return acc;
  }, [] as Array<{ agentName: string; totalClicks: number; whatsappClicks: number; callClicks: number; }>);

  const totalAgentClicks = agentClicksSummary?.reduce((sum, agent) => sum + agent.totalClicks, 0) || 0;
  const whatsappTotal = agentClicksSummary?.reduce((sum, agent) => sum + agent.whatsappClicks, 0) || 0;
  const callTotal = agentClicksSummary?.reduce((sum, agent) => sum + agent.callClicks, 0) || 0;

  const contactMethodData = [
    { name: 'واتساب', value: whatsappTotal },
    { name: 'مكالمة', value: callTotal },
  ];

  const sessionsChartData = sessionsOverTime?.map(item => ({
    date: new Date(item.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
    sessions: item.sessions,
    users: item.users,
  }));

  const handleRefresh = () => {
    refetchKPIs();
    refetchClicks();
    refetchSessions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 تحليلات GA4</h1>
          <p className="text-muted-foreground mt-1">
            تحليلات الموقع وأداء الوكلاء
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            الفترة الزمنية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map(range => (
              <Button
                key={range.days}
                variant={selectedRange === range.days ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            📅 من {new Date(startDate).toLocaleDateString('ar-SA')} إلى {new Date(endDate).toLocaleDateString('ar-SA')}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الجلسات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.sessions.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">جلسات المستخدمين</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis?.totalUsers.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">
                  جدد: {kpis?.newUsers} | عائدون: {kpis?.returningUsers}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نقرات الوكلاء</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalAgentClicks.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">على أزرار الوكلاء</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">واتساب</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{whatsappTotal.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">نقرات واتساب</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مكالمات</CardTitle>
            <Phone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">{callTotal.toLocaleString('en-US')}</div>
                <p className="text-xs text-muted-foreground">نقرات مكالمة</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            الجلسات مع مرور الوقت
          </CardTitle>
          <CardDescription>عدد الجلسات والمستخدمين يومياً</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sessionsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sessions" stroke="#3b82f6" name="الجلسات" strokeWidth={2} />
                <Line type="monotone" dataKey="users" stroke="#10b981" name="المستخدمون" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              أداء الوكلاء
            </CardTitle>
            <CardDescription>عدد النقرات لكل وكيل</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agentClicksSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agentName" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalClicks" fill="#3b82f6" name="إجمالي النقرات" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              طرق التواصل
            </CardTitle>
            <CardDescription>توزيع واتساب vs مكالمات</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contactMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contactMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            تفصيل الوكلاء
          </CardTitle>
          <CardDescription>تفاصيل النقرات حسب طريقة التواصل</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-right py-2 px-4">اسم الوكيل</th>
                    <th className="text-right py-2 px-4">إجمالي النقرات</th>
                    <th className="text-right py-2 px-4">واتساب</th>
                    <th className="text-right py-2 px-4">مكالمات</th>
                  </tr>
                </thead>
                <tbody>
                  {agentClicksSummary?.map((agent, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{agent.agentName}</td>
                      <td className="py-2 px-4">{agent.totalClicks.toLocaleString('en-US')}</td>
                      <td className="py-2 px-4 text-green-600">{agent.whatsappClicks.toLocaleString('en-US')}</td>
                      <td className="py-2 px-4 text-blue-600">{agent.callClicks.toLocaleString('en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            🔒 <strong>ملاحظة الخصوصية:</strong> جميع البيانات مجمّعة ولا تحتوي على معلومات شخصية للمستخدمين.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
