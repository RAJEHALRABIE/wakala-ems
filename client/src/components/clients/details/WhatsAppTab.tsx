import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, FileText, Send, Copy, Eye, Phone } from "lucide-react";
import { toast } from "sonner";
import { STANDARD_DOCUMENTS } from "@shared/documents";
import { STATUS_LABELS } from "@shared/statuses";

export default function WhatsAppTab({ client, agencyStatusInfo }: { client: any, agencyStatusInfo: any }) {
  const { data: templates } = trpc.settings.getWhatsAppTemplates.useQuery();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [messagePreview, setMessagePreview] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const generateWhatsAppMessage = (type: "request" | "welcome" | "update" | "missing") => {
    if (!client || !templates) return "";
    let template = templates[type];
    // Simple replacement logic
    template = template.replace("{اسم_العميل}", client.name);
    template = template.replace("{رمز_الملف}", client.refCode || "");
    template = template.replace("{رقم_الوكالة}", client.wakalahNumber || "");
    template = template.replace("{الحالة}", STATUS_LABELS[client.status]);
    
    if (client.missingDocuments) {
        template = template.replace("{المستندات_الناقصة}", client.missingDocuments);
    } else {
        template = template.replace("{المستندات_الناقصة}", "");
    }
    
    const trackingLink = client.refCode ? `${window.location.origin}/clients/${client.id}` : "غير متوفر";
    template = template.replace("{رابط_التتبع}", trackingLink);
    
    return template;
  };

  const previewMessage = (type: any) => {
    const message = generateWhatsAppMessage(type);
    setSelectedTemplate(type);
    setMessagePreview(message);
    setCustomMessage(message);
  };

  const sendWhatsAppDirect = (message: string) => {
    if (!client?.phone) {
      toast.error("لا يوجد رقم هاتف للعميل");
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    const phone = client.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    toast.success("تم فتح واتساب");
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success("تم نسخ الرسالة");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            قوالب رسائل واتساب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" onClick={() => previewMessage("request")} className="h-auto py-4 flex-col gap-2">
              <FileText className="h-5 w-5" /> <span>طلب الوكالة</span>
            </Button>
            <Button variant="outline" onClick={() => previewMessage("welcome")} className="h-auto py-4 flex-col gap-2">
              <FileText className="h-5 w-5" /> <span>طلب مستندات</span>
            </Button>
            <Button variant="outline" onClick={() => previewMessage("update")} className="h-auto py-4 flex-col gap-2">
              <FileText className="h-5 w-5" /> <span>تحديث الحالة</span>
            </Button>
            <Button variant="outline" onClick={() => previewMessage("missing")} className="h-auto py-4 flex-col gap-2">
              <FileText className="h-5 w-5" /> <span>المستندات الناقصة</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Preview Area */}
      {(messagePreview || customMessage) && (
        <Card>
            <CardHeader><CardTitle>معاينة الرسالة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    value={customMessage} 
                    onChange={(e) => setCustomMessage(e.target.value)} 
                    rows={8} 
                />
                <div className="flex gap-2">
                    <Button onClick={() => sendWhatsAppDirect(customMessage)} className="flex-1">
                        <Send className="ml-2 h-4 w-4" /> إرسال
                    </Button>
                    <Button variant="outline" onClick={() => copyMessage(customMessage)}>
                        <Copy className="ml-2 h-4 w-4" /> نسخ
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}