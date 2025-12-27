import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateDisplay } from "@/components/DateDisplay";
import { Calendar } from "lucide-react";

export default function AgencyInfoCard({ client, agencyStatusInfo }: { client: any, agencyStatusInfo: any }) {
  return (
    <Card className="border-blue-200 bg-blue-50/20" dir="rtl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 justify-start text-right text-base">
          <Calendar className="h-4 w-4 text-blue-600" />
          معلومات الوكالة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* تصميم عمودي صارم: العنوان في سطر، والقيمة في سطر */}
        
        <div className="border-b border-blue-200/50 pb-2 last:border-0 last:pb-0">
            <div className="text-xs text-muted-foreground mb-1">رقم الوكالة</div>
            <div className="font-bold text-lg">{client.wakalahNumber || "-"}</div>
        </div>

        <div className="border-b border-blue-200/50 pb-2 last:border-0 last:pb-0">
            <div className="text-xs text-muted-foreground mb-1">تاريخ الإصدار</div>
            <div className="font-bold text-lg">
              {client.agencyIssueDate || client.agencyDate ? (
                <DateDisplay date={client.agencyIssueDate || client.agencyDate} />
              ) : "-"}
            </div>
        </div>

        <div className="pb-1">
            <div className="text-xs text-muted-foreground mb-1">المدة المتبقية</div>
            <div className={`font-bold text-lg ${agencyStatusInfo.status === 'valid' ? 'text-green-600' : agencyStatusInfo.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>
              {agencyStatusInfo.daysRemaining !== null ? 
                (agencyStatusInfo.daysRemaining > 0 ? `${agencyStatusInfo.daysRemaining} يوم` : 
                 agencyStatusInfo.daysRemaining === 0 ? "اليوم" : 
                 `منتهية (${Math.abs(agencyStatusInfo.daysRemaining)})`) 
                : (client.agencyDurationDays ? `${client.agencyDurationDays} يوم` : "-")}
            </div>
        </div>

      </CardContent>
    </Card>
  );
}