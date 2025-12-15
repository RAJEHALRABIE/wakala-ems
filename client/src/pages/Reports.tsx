import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, Users, CheckCircle } from "lucide-react";
import { CLIENT_STATUSES, STATUS_LABELS, STATUS_COLORS, getStatusBadgeClasses } from "@shared/statuses";

export default function Reports() {
  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const formatNumber = (num: number | null) => num ? num.toLocaleString("ar-SA") : "-";
  const formatCurrency = (num: number | null) => num ? `${formatNumber(num)} ريال` : "-";

  // Group clients by status
  const clientsByStatus = clients?.reduce((acc, client) => {
    acc[client.status] = acc[client.status] || [];
    acc[client.status].push(client);
    return acc;
  }, {} as Record<string, typeof clients>);

  // Recent clients (last 10)
  const recentClients = clients?.slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">التقارير</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الملفات</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats?.total || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">قيد المعالجة</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber((stats?.byStatus?.Processing || 0) + (stats?.byStatus?.Valuation || 0) + (stats?.byStatus?.UnderReview || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">المكتملة</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats?.byStatus?.Completed || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي التعويضات</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalCompensation || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع الملفات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CLIENT_STATUSES.map((status) => {
              const count = stats?.byStatus?.[status] || 0;
              const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{STATUS_LABELS[status]}</span>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: STATUS_COLORS[status]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <CardTitle>آخر الملفات المضافة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرمز</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التعويض المتوقع</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentClients?.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono">{client.refCode}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.district || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClasses(client.status)}>
                      {STATUS_LABELS[client.status as keyof typeof STATUS_LABELS] || client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(client.expectedCompensationTotal ? parseFloat(client.expectedCompensationTotal) : null)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
