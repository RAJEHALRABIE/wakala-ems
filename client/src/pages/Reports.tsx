import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MapPin, 
  Download,
  PieChart,
  Filter,
  Printer,
  FileSpreadsheet
} from "lucide-react";
import { CLIENT_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";
import { formatNumber, formatCurrency, formatArea } from "@shared/formatting";
import { useState } from "react";
import PrintReport from "@/components/PrintReport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Reports() {
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const [reportType, setReportType] = useState<"financial" | "clients" | "areas" | "status">("financial");

  const isLoading = clientsLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48 ml-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // دالة لتصدير Excel
  const handleExportExcel = () => {
    if (!clients || clients.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }

    // إنشاء بيانات CSV
    const headers = [
      "اسم العميل",
      "رقم الهوية", 
      "المنطقة",
      "الحالة",
      "المساحة (م²)",
      "التعويض المتوقع",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "تاريخ الإضافة"
    ];

    const csvData = clients.map(client => [
      client.name,
      client.idNumber || "",
      client.city || "",
      STATUS_LABELS[client.status],
      client.areaSqm || 0,
      client.expectedCompensationTotal || 0,
      client.phone || "",
      client.email || "",
      client.createdAt ? new Date(client.createdAt).toLocaleDateString('ar-SA') : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // إنشاء ملف وتنزيله
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `عملاء_وكالة_EMS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`تم تصدير ${clients.length} عميل بنجاح إلى ملف Excel`);
  };

  // دالة لتصدير PDF
  const handleExportPDF = () => {
    alert("سيتم تصدير التقرير كملف PDF. هذه ميزة تجريبية.");
  };

  // دالة لإنشاء تقرير مخصص
  const handleCustomReport = () => {
    alert("سيتم فتح نافذة لإنشاء تقرير مخصص. هذه ميزة تجريبية.");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* العنوان */}
        <div className="text-right">
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-muted-foreground mt-1">
            نظرة شاملة على بيانات النظام
          </p>
        </div>

        {/* أزرار التصفية - على صف واحد */}
        <div className="flex gap-2">
          <Button
            variant={reportType === "financial" ? "default" : "outline"}
            onClick={() => setReportType("financial")}
            className="flex-1"
          >
            <DollarSign className="h-4 w-4 ml-1" />
            تقارير مالية
          </Button>
          <Button
            variant={reportType === "clients" ? "default" : "outline"}
            onClick={() => setReportType("clients")}
            className="flex-1"
          >
            <Users className="h-4 w-4 ml-1" />
            تقارير العملاء
          </Button>
          <Button
            variant={reportType === "areas" ? "default" : "outline"}
            onClick={() => setReportType("areas")}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 ml-1" />
            تقارير المساحات
          </Button>
          <Button
            variant={reportType === "status" ? "default" : "outline"}
            onClick={() => setReportType("status")}
            className="flex-1"
          >
            <PieChart className="h-4 w-4 ml-1" />
            توزيع الحالات
          </Button>
        </div>

        {/* محتوى التقرير حسب النوع */}
        <div>
          {reportType === "financial" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  التقرير المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">إجمالي التعويضات</div>
                    <div className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(stats?.totalCompensation || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">القيمة المتوقعة للتعويضات</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">إجمالي الأتعاب</div>
                    <div className="text-2xl font-bold text-blue-600 mt-2">
                      {formatCurrency(stats?.totalFees || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">نسبة {((stats?.totalFees || 0) / (stats?.totalCompensation || 1) * 100).toFixed(1)}% من التعويضات</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "clients" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  تقرير العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم العميل</TableHead>
                        <TableHead className="text-right">المنطقة</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients?.slice(0, 3).map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell>{client.city || "غير محدد"}</TableCell>
                          <TableCell>
                            <Badge 
                              className="text-xs"
                              style={{ backgroundColor: STATUS_COLORS[client.status] }}
                            >
                              {STATUS_LABELS[client.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">
                    عرض جميع العملاء ({clients?.length || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "areas" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  تقرير المساحات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">إجمالي المساحات</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-2">
                      {formatArea(stats?.totalArea || 0)}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">متوسط المساحة</div>
                    <div className="text-2xl font-bold text-blue-600 mt-2">
                      {formatArea(stats?.totalArea ? stats.totalArea / (stats.total || 1) : 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === "status" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  توزيع الحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {CLIENT_STATUSES.map((status) => {
                    const count = stats?.byStatus?.[status] || 0;
                    const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div key={status} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: STATUS_COLORS[status] }}
                            />
                            <span className="font-medium">{STATUS_LABELS[status]}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{count} ملف</div>
                            <div className="text-sm text-muted-foreground">({percentage}%)</div>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                          <div 
                            className="h-full transition-all duration-500"
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
          )}
        </div>

        {/* أزرار التصدير */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-semibold">تصدير التقارير</h3>
                <p className="text-sm text-muted-foreground">
                  قم بتحميل التقارير بصيغ مختلفة للاستخدام الخارجي
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Printer className="h-4 w-4 ml-1" />
                      طباعة تقرير
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>طباعة تقرير العملاء</DialogTitle>
                    </DialogHeader>
                    {clients && (
                      <PrintReport 
                        clients={clients} 
                        title="تقرير شامل لجميع العملاء"
                        filterType="all"
                      />
                    )}
                  </DialogContent>
                </Dialog>

                <Button variant="outline" onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 ml-1" />
                  تصدير Excel
                </Button>
                
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 ml-1" />
                  تصدير PDF
                </Button>
                
                <Button onClick={handleCustomReport}>
                  <Filter className="h-4 w-4 ml-1" />
                  تقرير مخصص
                </Button>
              </div>
            </div>
            
            {/* ملاحظات حول التصدير */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-sm mb-2">ملاحظات حول التصدير:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <span className="font-medium">طباعة تقرير:</span> عرض تقرير منظم للطباعة مع إحصائيات وجداول</li>
                <li>• <span className="font-medium">تصدير Excel:</span> تنزيل جميع بيانات العملاء كملف CSV (يتوافق مع Excel)</li>
                <li>• <span className="font-medium">تصدير PDF:</span> قيد التطوير - سيتم إضافته قريباً</li>
                <li>• <span className="font-medium">تقرير مخصص:</span> إنشاء تقارير حسب معايير محددة (قيد التطوير)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}