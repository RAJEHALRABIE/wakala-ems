import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Files, History } from "lucide-react";

// Shared Imports
import { calculateFinancials } from "@shared/financials";

// Sub-Components Imports
import AgencyInfoCard from "@/components/clients/details/AgencyInfoCard";
import ClientInfoTab from "@/components/clients/details/ClientInfoTab";
import WhatsAppTab from "@/components/clients/details/WhatsAppTab";
import ClientHeader from "@/components/clients/details/ClientHeader";
import ClientDocumentsTab from "@/components/clients/ClientDocumentsTab";
import ActivityLogTab from "@/components/clients/ActivityLogTab";

export default function ClientDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const clientId = parseInt(params.id!);
  const [masterKey, setMasterKey] = useState("");

  const isValidClientId = !isNaN(clientId) && clientId > 0;

  const { data: client, isLoading, error } = trpc.clients.getWithAgent.useQuery(
    { id: clientId },
    { enabled: isValidClientId, retry: false }
  );

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العميل بنجاح");
      setLocation("/clients");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // --- منطق الحالة المحدث للتعامل مع الهجري والميلادي ---
  const agencyStatusInfo = useMemo(() => {
    if (!client) {
      return {
        expiryDate: null,
        daysRemaining: null,
        status: 'unknown' as const,
        statusLabel: 'غير محدد',
        statusColor: 'bg-gray-100 text-gray-800'
      };
    }

    // 1. استخراج التاريخ (نتعامل معه كنص لتجنب مشاكل التحويل)
    // نبحث عن التاريخ في عدة حقول محتملة
    let rawExpiryDate = client.agencyExpiryDate || client.agencyIssueDate;
    
    // إذا كان التاريخ بتنسيق ISO كامل، نأخذ فقط التاريخ
    if (typeof rawExpiryDate === 'string' && rawExpiryDate.includes('T')) {
      rawExpiryDate = rawExpiryDate.split('T')[0];
    }

    // 2. التحقق هل هو هجري أم ميلادي
    let isHijri = false;
    let daysRemaining: number | null = null;

    if (rawExpiryDate && typeof rawExpiryDate === 'string') {
        const year = parseInt(rawExpiryDate.split('-')[0]);
        if (year < 1700) isHijri = true; // نعتبر أي سنة قبل 1700 هجرية
    }

    // 3. حساب الأيام المتبقية
    // الأولوية دائماً للقيمة المحسوبة مسبقاً من الباك إند (إن وجدت)
    if (client.agencyDurationDays !== undefined && client.agencyDurationDays !== null) {
        daysRemaining = parseInt(client.agencyDurationDays.toString());
    } else if (!isHijri && rawExpiryDate) {
        // إذا كان ميلادياً فقط، يمكننا حسابه في المتصفح
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const exp = new Date(rawExpiryDate);
            if (!isNaN(exp.getTime())) {
                const timeDiff = exp.getTime() - today.getTime();
                daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
            }
        } catch (e) { /* تجاهل الأخطاء */ }
    }

    // 4. تحديد الحالة واللون والنص
    let status: 'valid' | 'warning' | 'expired' | 'unknown' = 'unknown';
    let statusLabel = 'غير محدد';
    let statusColor = 'bg-gray-100 text-gray-800';

    if (daysRemaining !== null && !isNaN(daysRemaining)) {
      if (daysRemaining > 30) {
        status = 'valid';
        statusLabel = `صالحة (${daysRemaining} يوم)`;
        statusColor = 'bg-green-100 text-green-800 border-green-200';
      } else if (daysRemaining >= 0) {
        status = 'warning';
        statusLabel = `تنتهي قريباً (${daysRemaining} يوم)`;
        statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      } else {
        status = 'expired';
        statusLabel = `منتهية (منذ ${Math.abs(daysRemaining)} يوم)`;
        statusColor = 'bg-red-100 text-red-800 border-red-200';
      }
    } else if (isHijri && rawExpiryDate) {
        // حالة خاصة: تاريخ هجري ولا يوجد حساب للأيام
        // نفترض أنها صالحة أو نظهر التاريخ فقط لتجنب رسالة "منتهية" الخاطئة
        status = 'valid'; // لون أخضر محايد
        statusLabel = `تاريخ هجري: ${rawExpiryDate}`;
        statusColor = 'bg-blue-50 text-blue-800 border-blue-100';
    } else if (rawExpiryDate) {
        statusLabel = rawExpiryDate;
    }

    return {
      expiryDate: rawExpiryDate,
      daysRemaining,
      status,
      statusLabel,
      statusColor
    };
  }, [client]);

  const financials = useMemo(() => {
    if (!client) return null;
    return calculateFinancials({
      areaSqm: client.areaSqm,
      expectedCompensationPerSqm: client.expectedCompensationPerSqm,
      possessionRatio: client.possessionRatio,
      baseFeePercentage: client.baseFeePercentage,
      damageToRemainingComp: client.damageToRemainingComp,
      extraCompRate: client.extraCompRate,
      officialCompensationAmount: client.officialCompensationAmount,
      improvementValue: client.improvementValue,
    });
  }, [client]);

  const { expectedCompensation, feeAmount } = useMemo(() => {
      if (!client) return { expectedCompensation: 0, feeAmount: 0 };
      const area = parseFloat(client.areaSqm || "0");
      const price = parseFloat(client.expectedCompensationPerSqm || "0");
      const comp = area * price;
      const fee = comp * (parseFloat(client.baseFeePercentage || "0") / 100);
      return { expectedCompensation: comp, feeAmount: fee };
  }, [client]);

  if (error) return <div className="text-center py-12">خطأ في تحميل البيانات</div>;
  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!client) return <div className="text-center py-12">العميل غير موجود</div>;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <ClientHeader 
        client={client}
        agencyStatusInfo={agencyStatusInfo}
        masterKey={masterKey}
        setMasterKey={setMasterKey}
        onDelete={() => deleteMutation.mutate({ id: client.id, masterKey })}
        setLocation={setLocation}
      />

      <AgencyInfoCard client={client} agencyStatusInfo={agencyStatusInfo} />

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="justify-end w-full sm:w-auto">
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="documents"><Files className="ml-2 h-4 w-4" />المستندات</TabsTrigger>
          <TabsTrigger value="whatsapp">واتساب</TabsTrigger>
          <TabsTrigger value="activity"><History className="ml-2 h-4 w-4" />سجل النشاطات</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ClientInfoTab 
            client={client}
            improvementWarning={false} 
            expectedCompensation={expectedCompensation}
            feeAmount={feeAmount}
            financials={financials}
          />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppTab client={client} agencyStatusInfo={agencyStatusInfo} />
        </TabsContent>

        <TabsContent value="documents">
          <ClientDocumentsTab clientId={client.id.toString()} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogTab clientId={client.id.toString()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}