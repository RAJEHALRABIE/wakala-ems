import { Client } from "@shared/types";
import { formatCurrency, formatArea, formatNumber } from "@shared/formatting";
import { STATUS_LABELS, STATUS_COLORS } from "@shared/statuses";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PrintReportProps {
  clients: Client[];
  title: string;
  filterType?: "all" | "byOwnership" | "individual";
  clientId?: string;
}

export default function PrintReport({ clients, title, filterType = "all", clientId }: PrintReportProps) {
  const printDate = format(new Date(), "PPPP", { locale: ar });
  
  // إذا كان فردي، فلنعرض العميل المحدد فقط
  const displayClients = filterType === "individual" && clientId 
    ? clients.filter(client => client.id === clientId)
    : clients;

  // حساب الإحصائيات
  const totalClients = displayClients.length;
  const totalCompensation = displayClients.reduce((sum, client) => 
    sum + (client.expectedCompensationTotal || 0), 0);
  const totalArea = displayClients.reduce((sum, client) => 
    sum + (client.areaSqm || 0), 0);
  const avgCompensation = totalClients > 0 ? totalCompensation / totalClients : 0;
  const avgArea = totalClients > 0 ? totalArea / totalClients : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container bg-white p-8">
      {/* زر الطباعة - يظهر فقط على الشاشة */}
      <div className="no-print mb-6 text-center">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          🖨️ طباعة التقرير
        </button>
        <p className="text-sm text-gray-600 mt-2">
          سيتم طباعة هذا التقرير بتنسيق مناسب للطباعة
        </p>
      </div>

      {/* محتوى التقرير */}
      <div className="print-content">
        {/* رأس التقرير */}
        <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">تقرير العملاء - نظام وكالة EMS</h1>
          <h2 className="text-xl text-gray-600 mt-2">{title}</h2>
          <div className="flex justify-center gap-8 mt-4 text-gray-700">
            <div>
              <span className="font-semibold">تاريخ الطباعة:</span> {printDate}
            </div>
            <div>
              <span className="font-semibold">عدد العملاء:</span> {totalClients}
            </div>
            <div>
              <span className="font-semibold">نوع التصفية:</span> {
                filterType === "all" ? "جميع العملاء" :
                filterType === "byOwnership" ? "حسب وثيقة التملك" :
                "فردي"
              }
            </div>
          </div>
        </div>

        {/* الإحصائيات العامة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700">إجمالي العملاء</div>
            <div className="text-2xl font-bold text-blue-900">{formatNumber(totalClients)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-sm text-green-700">إجمالي التعويضات</div>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(totalCompensation)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-sm text-purple-700">إجمالي المساحة</div>
            <div className="text-2xl font-bold text-purple-900">{formatArea(totalArea)}</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="text-sm text-amber-700">متوسط التعويض</div>
            <div className="text-2xl font-bold text-amber-900">{formatCurrency(avgCompensation)}</div>
          </div>
        </div>

        {/* جدول العملاء */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">قائمة العملاء</h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-right">#</th>
                <th className="border border-gray-300 p-3 text-right">اسم العميل</th>
                <th className="border border-gray-300 p-3 text-right">رقم الهوية</th>
                <th className="border border-gray-300 p-3 text-right">المنطقة</th>
                <th className="border border-gray-300 p-3 text-right">الحالة</th>
                <th className="border border-gray-300 p-3 text-right">المساحة (م²)</th>
                <th className="border border-gray-300 p-3 text-right">التعويض المتوقع</th>
                <th className="border border-gray-300 p-3 text-right">تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {displayClients.map((client, index) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3 text-center">{index + 1}</td>
                  <td className="border border-gray-300 p-3 font-medium">{client.name}</td>
                  <td className="border border-gray-300 p-3">{client.idNumber || "غير محدد"}</td>
                  <td className="border border-gray-300 p-3">{client.city || "غير محدد"}</td>
                  <td className="border border-gray-300 p-3">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: STATUS_COLORS[client.status] + '20',
                        color: STATUS_COLORS[client.status]
                      }}
                    >
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">{formatArea(client.areaSqm || 0)}</td>
                  <td className="border border-gray-300 p-3 font-medium">{formatCurrency(client.expectedCompensationTotal || 0)}</td>
                  <td className="border border-gray-300 p-3">
                    {client.createdAt ? format(new Date(client.createdAt), "yyyy/MM/dd", { locale: ar }) : "غير محدد"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ملخص التقرير */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">ملخص التقرير</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">توزيع الحالات</h4>
              <ul className="space-y-2">
                {Object.entries(
                  displayClients.reduce((acc, client) => {
                    acc[client.status] = (acc[client.status] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([status, count]) => (
                  <li key={status} className="flex justify-between">
                    <span>{STATUS_LABELS[status]}</span>
                    <span className="font-medium">{count} عميل ({(count / totalClients * 100).toFixed(1)}%)</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">توزيع المناطق</h4>
              <ul className="space-y-2">
                {Object.entries(
                  displayClients.reduce((acc, client) => {
                    const city = client.city || "غير محدد";
                    acc[city] = (acc[city] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([city, count]) => (
                  <li key={city} className="flex justify-between">
                    <span>{city}</span>
                    <span className="font-medium">{count} عميل</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* تذييل التقرير */}
        <div className="border-t-2 border-gray-300 mt-8 pt-6 text-center text-gray-600 text-sm">
          <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام وكالة EMS</p>
          <p className="mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* أنماط الطباعة */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0;
            margin: 0;
          }
          body {
            font-size: 12pt;
            line-height: 1.5;
          }
          table {
            font-size: 10pt;
            page-break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
          }
          .print-content {
            margin: 0;
            padding: 0;
          }
        }
        
        @page {
          size: A4;
          margin: 2cm;
        }
      `}</style>
    </div>
  );
}