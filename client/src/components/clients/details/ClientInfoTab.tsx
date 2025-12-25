import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, User } from "lucide-react";
import { formatCurrency, formatArea } from "@shared/formatting";

// تعريف أيقونة واتساب
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
  </svg>
);

export default function ClientInfoTab({ client, improvementWarning, expectedCompensation, feeAmount }: any) {
  
  // 1. تحديد اسم المرسل
  // التحليل: بما أن نظام الدخول يستخدم كوداً موحداً ولا يحفظ اسم الموظف،
  // نستخدم اسماً اعتبارياً يمثل المنظومة.
  const currentSenderName = "إدارة وكالة EMS"; 

  // 2. دالة التحية الزمنية
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    return (hour >= 5 && hour < 12) ? "صباح الخير" : "مساء الخير";
  };

  // 3. بناء رابط واتساب
  const getWhatsAppLink = (mobile: string, clientName: string) => {
    if (!mobile) return "#";
    
    // تنسيق الرقم للسعودية
    let cleanNumber = mobile.replace(/\s/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '966' + cleanNumber.substring(1);
    }

    const greeting = getTimeBasedGreeting();
    
    // نص الرسالة: السلام عليكم، [الوقت] أ/ [العميل]، معك [اسم النظام]
    const message = `السلام عليكم، ${greeting} أ/ ${clientName}،\nمعك ${currentSenderName}.`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const Item = ({ label, value, isLast = false, valueClassName = "font-bold text-lg" }: any) => (
    <div className={`${!isLast ? "border-b border-gray-100 pb-3 mb-3" : "pb-1"}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={valueClassName}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-4" dir="rtl">
      {improvementWarning && (
        <Alert variant="destructive">
          <AlertDescription>
            تنبيه: تم تحديد "أخرى" في نوع التحسينات ولكن لم يتم تقديم وصف.
          </AlertDescription>
        </Alert>
      )}
      
      {/* البطاقة المالية */}
      <Card className="border-green-200 bg-green-50/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base justify-start text-right">
            <Calculator className="h-4 w-4 text-green-600" />
            البيانات والملخص المالي
          </CardTitle>
        </CardHeader>
        <CardContent className="text-right">
            <Item 
              label="التعويض المتوقع" 
              value={formatCurrency(expectedCompensation)} 
              valueClassName="font-bold text-xl text-blue-700 dir-ltr"
            />
            {feeAmount > 0 && (
              <Item 
                label={`الأتعاب (${client.baseFeePercentage}%)`}
                value={formatCurrency(feeAmount)}
                valueClassName="font-bold text-xl text-green-700 dir-ltr"
              />
            )}
            {client.expropriationType !== 'IMPROVEMENTS_ONLY' && (
              <>
                <Item 
                  label="المساحة المنزوعة" 
                  value={formatArea(parseFloat(client.areaSqm || "0"))} 
                  valueClassName="font-medium text-lg dir-ltr"
                />
                <Item 
                  label="سعر المتر المعتمد" 
                  value={formatCurrency(parseFloat(client.expectedCompensationPerSqm || "0"))} 
                  valueClassName="font-medium text-lg dir-ltr"
                  isLast={true}
                />
              </>
            )}
        </CardContent>
      </Card>

      {/* المعلومات الأساسية */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base justify-start text-right">
            <User className="h-4 w-4 text-gray-500" />
            المعلومات الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="text-right">
            <Item label="الاسم الكامل" value={client.name} />
            <Item label="رقم الهوية" value={<span className="font-mono">{client.idNumber || "-"}</span>} />
            
            <Item 
              label="رقم الجوال (واتساب)" 
              value={
                client.phone ? (
                  <a 
                    href={getWhatsAppLink(client.phone, client.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-800 w-full hover:bg-green-50 p-1 rounded transition-colors"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    <span dir="ltr" className="font-bold font-mono text-lg">{client.phone}</span>
                  </a>
                ) : "-"
              } 
            />
            
            <Item 
              label="الموقع (المدينة - الحي)" 
              value={`${client.city} ${client.district ? `- ${client.district}` : ""}`} 
              isLast={true}
            />
        </CardContent>
      </Card>
    </div>
  );
}