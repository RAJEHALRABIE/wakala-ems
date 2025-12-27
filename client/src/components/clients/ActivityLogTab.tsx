import { FC } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Upload, 
  Trash2, 
  MessageCircle, 
  Edit, 
  AlertCircle,
  Calendar,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ActivityLogTabProps {
  clientId: string;
}

type ActivityLog = {
  id: number;
  clientId: number;
  actionType: string;
  description: string | null;
  meta: Record<string, any> | null;
  performedByUserId: number | null;
  createdAt: Date;
  performedByUser: {
    name: string | null;
  } | null;
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "DOC_UPLOAD":
      return <Upload className="h-4 w-4" />;
    case "DOC_DELETE":
      return <Trash2 className="h-4 w-4" />;
    case "WHATSAPP_SENT":
      return <MessageCircle className="h-4 w-4" />;
    case "NOTE_ADD":
      return <Edit className="h-4 w-4" />;
    case "STATUS_CHANGE":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case "DOC_UPLOAD":
      return "رفع مستند";
    case "DOC_DELETE":
      return "حذف مستند";
    case "WHATSAPP_SENT":
      return "إرسال رسالة واتساب";
    case "NOTE_ADD":
      return "إضافة ملاحظة";
    case "STATUS_CHANGE":
      return "تغيير الحالة";
    default:
      return "نشاط";
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case "DOC_UPLOAD":
      return "bg-green-100 text-green-800 border-green-200";
    case "DOC_DELETE":
      return "bg-red-100 text-red-800 border-red-200";
    case "WHATSAPP_SENT":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "NOTE_ADD":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "STATUS_CHANGE":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const ActivityLogTab: FC<ActivityLogTabProps> = ({ clientId }) => {
  const { data: logs, isLoading } = trpc.clients.activityLogs.useQuery(
    { clientId: parseInt(clientId) },
    { enabled: !!clientId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل النشاطات</CardTitle>
          <CardDescription>جاري تحميل سجل النشاطات...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>سجل النشاطات</CardTitle>
          <CardDescription>لا توجد نشاطات مسجلة لهذا العميل بعد.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>سيظهر سجل النشاطات هنا عند حدوث أي تغييرات على ملف العميل.</p>
        </CardContent>
      </Card>
    );
  }

  const activityLogs = logs as unknown as ActivityLog[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجل النشاطات</CardTitle>
        <CardDescription>التسلسل الزمني للنشاطات والعمليات التي تمت على ملف العميل</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6 relative">
            {/* خط الزمن العمودي */}
            <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-border" />

            {activityLogs.map((log: ActivityLog) => (
              <div key={log.id} className="relative flex items-start gap-4">
                {/* نقطة على الخط الزمني */}
                <div className="relative z-10 flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${getActionColor(log.actionType)}`}>
                    {getActionIcon(log.actionType)}
                  </div>
                </div>

                {/* محتوى النشاط */}
                <div className="flex-1 space-y-1 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getActionColor(log.actionType)}>
                        {getActionLabel(log.actionType)}
                      </Badge>
                      {log.performedByUser && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{log.performedByUser.name || "مستخدم غير معروف"}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(log.createdAt), "dd/MM/yyyy, h:mm a", { locale: ar })}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm">{log.description || "لا يوجد وصف تفصيلي"}</p>

                  {/* معلومات إضافية من meta */}
                  {log.meta && typeof log.meta === 'object' && (
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      {Object.entries(log.meta).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-medium">{key}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* ملخص الإحصائيات */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{activityLogs.length}</div>
              <div className="text-sm text-muted-foreground">إجمالي النشاطات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activityLogs.filter((l: ActivityLog) => l.actionType === "DOC_UPLOAD").length}
              </div>
              <div className="text-sm text-muted-foreground">مستندات مرفوعة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activityLogs.filter((l: ActivityLog) => l.actionType === "WHATSAPP_SENT").length}
              </div>
              <div className="text-sm text-muted-foreground">رسائل واتساب</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {activityLogs.filter((l: ActivityLog) => l.actionType === "STATUS_CHANGE").length}
              </div>
              <div className="text-sm text-muted-foreground">تغييرات حالة</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityLogTab;