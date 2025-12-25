import { useState } from "react";
import { Search, CheckCircle2, Circle, Clock, FileText, Phone, MapPin, DollarSign, Calendar, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchOrder = async () => {
    setLoading(true);
    // محاكاة استدعاء API
    setTimeout(() => {
      setOrderData({
        orderNumber: "RSA003",
        clientName: "عقيل",
        status: "pending",
        createdAt: "1447/06/21",
        propertyType: "شقة سكنية",
        propertyAddress: "حي النرجس، الرياض",
        salePrice: "850,000 ريال",
        commission: "21,250 ريال",
        agentName: "محمد أحمد",
        agentPhone: "0500123456",
        progress: 10,
        timeline: [
          { label: "الحالة الحالية", status: "completed", date: "1447/06/21" },
          { label: "تسجيل الوكالة", status: "pending" },
          { label: "جاري تجهيز الملف", status: "pending" },
          { label: "تم تقديم الملف", status: "pending" },
          { label: "قيد المعالجة", status: "pending" },
          { label: "التقييم", status: "pending" },
          { label: "قيد المراجعة", status: "pending" },
          { label: "تقديم اعتراض", status: "pending" },
          { label: "في انتظار الدفع", status: "pending" },
          { label: "تم إصدار الشيك", status: "pending" },
          { label: "مكتمل", status: "pending" },
        ],
      });
      setLoading(false);
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { label: "مكتمل", variant: "default" as const, color: "bg-green-500" },
      pending: { label: "قيد المعالجة", variant: "secondary" as const, color: "bg-yellow-500" },
      cancelled: { label: "ملغي", variant: "destructive" as const, color: "bg-red-500" },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const shareOrder = () => {
    const url = `${window.location.origin}/track?order=${orderData.orderNumber}`;
    if (navigator.share) {
      navigator.share({
        title: `تتبع طلب ${orderData.orderNumber}`,
        text: `تابع حالة طلبك ${orderData.orderNumber}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط!", {
        description: "يمكنك الآن مشاركة الرابط مع الآخرين",
        duration: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            تتبع طلبك
          </h1>
          <p className="text-gray-600">أدخل الرمز المرجعي لمتابعة حالة طلبك</p>
        </div>

        {/* Search Box */}
        <Card className="shadow-lg border-purple-100">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="مثال: RSA003 أدخل الرمز المرجعي"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchOrder()}
                className="text-lg h-12 text-right"
              />
              <Button
                onClick={searchOrder}
                disabled={loading}
                className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Search className="ml-2 h-5 w-5" />
                بحث
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        {orderData && (
          <>
            {/* Status Card */}
            <Card className="shadow-lg border-purple-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">معلومات الطلب</CardTitle>
                  <Badge className={`${getStatusBadge(orderData.status).color} text-white`}>
                    {getStatusBadge(orderData.status).label}
                  </Badge>
                </div>
                <CardDescription>رقم الطلب: {orderData.orderNumber}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">نسبة الإنجاز</span>
                    <span className="text-purple-600 font-bold">{orderData.progress}%</span>
                  </div>
                  <Progress value={orderData.progress} className="h-3" />
                </div>

                <Separator />

                {/* Client Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">اسم العميل</p>
                      <p className="font-semibold text-lg">{orderData.clientName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">تاريخ التسجيل</p>
                      <p className="font-semibold">{orderData.createdAt}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">العقار</p>
                      <p className="font-semibold">{orderData.propertyType}</p>
                      <p className="text-sm text-gray-500">{orderData.propertyAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">قيمة العمولة</p>
                      <p className="font-semibold text-xl text-amber-700">{orderData.commission}</p>
                      <p className="text-xs text-gray-500">من أصل {orderData.salePrice}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Agent Contact */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                      {orderData.agentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{orderData.agentName}</p>
                      <p className="text-sm text-gray-600">الوكيل المسؤول</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Phone className="h-4 w-4" />
                    {orderData.agentPhone}
                  </Button>
                </div>

                {/* Share Button */}
                <Button
                  onClick={shareOrder}
                  variant="outline"
                  className="w-full gap-2 border-purple-200 hover:bg-purple-50"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة رابط التتبع
                </Button>
              </CardContent>
            </Card>

            {/* Timeline Card */}
            <Card className="shadow-lg border-purple-100">
              <CardHeader>
                <CardTitle className="text-2xl">الخط الزمني للطلب</CardTitle>
                <CardDescription>تتبع مراحل معالجة طلبك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-4 pr-8">
                  {/* Timeline Line */}
                  <div className="absolute right-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-green-500 via-gray-300 to-gray-300" />

                  {orderData.timeline.map((step: any, index: number) => (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline Icon */}
                      <div className="relative z-10">
                        {step.status === "completed" ? (
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <Circle className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Timeline Content */}
                      <div className={`flex-1 pb-6 ${step.status === "completed" ? "opacity-100" : "opacity-60"}`}>
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${step.status === "completed" ? "text-gray-900" : "text-gray-600"}`}>
                            {step.label}
                          </p>
                          {step.date && (
                            <Badge variant="outline" className="text-xs">
                              {step.date}
                            </Badge>
                          )}
                        </div>
                        {step.status === "completed" && index === 0 && (
                          <p className="text-sm text-gray-600 mt-1">تم استلام طلبك بنجاح</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="shadow-lg border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <p className="font-semibold mb-2">هل تحتاج مساعدة؟</p>
                    <p className="text-sm text-gray-600">
                      للاستفسار عن طلبك أو الحصول على مساعدة، تواصل مع الوكيل المسؤول على الرقم المذكور أعلاه
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!orderData && !loading && (
          <Card className="shadow-lg border-purple-100">
            <CardContent className="py-16 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 flex items-center justify-center">
                <Search className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">ابحث عن طلبك</h3>
                <p className="text-gray-600">أدخل الرمز المرجعي في الأعلى لعرض حالة طلبك</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
