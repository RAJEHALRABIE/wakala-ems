import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, FileText, Send, Copy, Phone } from "lucide-react";
import { toast } from "sonner";
import { STANDARD_DOCUMENTS } from "@shared/documents";
import { STATUS_LABELS } from "@shared/statuses";

export default function WhatsAppTab({ client, agencyStatusInfo }: { client: any, agencyStatusInfo: any }) {
  const { data: templates, isLoading: templatesLoading } = trpc.settings.getWhatsAppTemplates.useQuery();
  const [customMessage, setCustomMessage] = useState("");
  
  // حالة التحميل
  if (!client) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري تحميل بيانات العميل...
      </div>
    );
  }

  // توليد الرسالة تلقائياً بناءً على نوع القالب
  const generateMessage = (type: "request" | "welcome" | "update" | "missing") => {
    if (!client || !templates) return "";
    
    let template = templates[type];
    
    // تعبئة القالب تلقائياً ببيانات العميل
    const replacements: Record<string, string> = {
      "{اسم_العميل}": client.name || "العميل",
      "{رمز_الملف}": client.refCode || "",
      "{رقم_الوكالة}": client.wakalahNumber || "",
      "{الحالة}": STATUS_LABELS[client.status] || "",
      "{المدينة}": client.city || "",
      "{رابط_التتبع}": client.refCode ? `${window.location.origin}/clients/${client.id}` : "غير متوفر",
    };

    // معالجة المستندات الناقصة
    if (client.missingDocuments) {
      try {
        const missingDocs = JSON.parse(client.missingDocuments);
        const docNames = missingDocs.map((docId: string) => {
          const doc = STANDARD_DOCUMENTS.find(d => d.id === docId);
          return doc?.label || docId;
        }).join(', ');
        replacements["{المستندات_الناقصة}"] = docNames;
      } catch {
        replacements["{المستندات_الناقصة}"] = "";
      }
    } else {
      replacements["{المستندات_الناقصة}"] = "";
    }

    // تطبيق جميع الاستبدالات
    Object.entries(replacements).forEach(([key, value]) => {
      template = template.replace(key, value);
    });

    return template;
  };

  // اختيار قالب وتعبئته تلقائياً
  const selectTemplate = (type: "request" | "welcome" | "update" | "missing") => {
    const message = generateMessage(type);
    setCustomMessage(message);
    toast.success("تم تعبئة القالب تلقائياً");
  };

  // إرسال الرسالة عبر واتساب
  const sendWhatsApp = () => {
    if (!client?.phone) {
      toast.error("لا يوجد رقم هاتف للعميل");
      return;
    }
    
    if (!customMessage.trim()) {
      toast.error("الرسالة فارغة");
      return;
    }

    const encodedMessage = encodeURIComponent(customMessage);
    const phone = client.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    toast.success("تم فتح واتساب مع الرسالة المعدة");
  };

  // نسخ الرسالة
  const copyMessage = () => {
    if (!customMessage.trim()) {
      toast.error("لا يوجد رسالة للنسخ");
      return;
    }
    
    navigator.clipboard.writeText(customMessage);
    toast.success("تم نسخ الرسالة");
  };

  return (
    <div className="space-y-4">
      {/* معلومات العميل */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            معلومات العميل للرسائل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">الاسم</div>
              <div className="font-medium">{client?.name || "غير محدد"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">الهاتف</div>
              <div className="font-medium">{client?.phone || "غير محدد"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">رقم الوكالة</div>
              <div className="font-medium">{client?.wakalahNumber || "غير محدد"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">الحالة</div>
              <div className="font-medium">{client ? STATUS_LABELS[client.status] : "غير محدد"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قوالب سريعة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            قوالب سريعة (تعبئة تلقائية)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => selectTemplate("request")}
              className="h-auto py-3"
            >
              <FileText className="h-4 w-4 ml-1" />
              طلب الوكالة
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => selectTemplate("welcome")}
              className="h-auto py-3"
            >
              <FileText className="h-4 w-4 ml-1" />
              طلب مستندات
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => selectTemplate("update")}
              className="h-auto py-3"
            >
              <FileText className="h-4 w-4 ml-1" />
              تحديث الحالة
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => selectTemplate("missing")}
              className="h-auto py-3"
            >
              <FileText className="h-4 w-4 ml-1" />
              مستندات ناقصة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* محرر الرسالة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            محرر الرسالة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={8}
            placeholder="سيتم تعبئة القالب تلقائياً عند اختيار قالب من الأعلى..."
            className="font-sans text-base"
          />
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={sendWhatsApp} className="bg-green-600 hover:bg-green-700 flex-1">
              <Send className="ml-2 h-4 w-4" />
              إرسال عبر واتساب
            </Button>
            
            <Button variant="outline" onClick={copyMessage}>
              <Copy className="ml-2 h-4 w-4" />
              نسخ الرسالة
            </Button>
            
            <Button variant="outline" onClick={() => setCustomMessage("")}>
              مسح
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظات */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="pt-6">
          <div className="text-sm text-blue-700 space-y-2">
            <p className="font-medium">ملاحظات:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>اختر قالباً من الأعلى ليتم تعبئته تلقائياً ببيانات العميل</li>
              <li>يمكنك تعديل الرسالة يدوياً بعد تعبئتها تلقائياً</li>
              <li>اضغط "إرسال عبر واتساب" لفتح المحادثة مع العميل</li>
              <li>استخدم "نسخ الرسالة" إذا أردت إرسالها بطريقة أخرى</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}