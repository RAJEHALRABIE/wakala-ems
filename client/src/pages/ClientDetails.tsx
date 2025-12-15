import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Edit, Phone, MapPin, FileText, MessageCircle, Trash2, Copy, Send, Eye, Calculator } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS, getStatusBadgeClasses } from "@shared/statuses";
import { DateDisplay } from "@/components/DateDisplay";
import { STANDARD_DOCUMENTS } from "@shared/documents";
import { calculateFinancials } from "@shared/financials";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClientDetails() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const clientId = parseInt(params.id!);
  const [masterKey, setMasterKey] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [messagePreview, setMessagePreview] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const { data: client, isLoading } = trpc.clients.getWithAgent.useQuery({ id: clientId });
  const { data: templates } = trpc.settings.getWhatsAppTemplates.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العميل بنجاح");
      utils.clients.list.invalidate();
      setLocation("/clients");
    },
    onError: (error) => toast.error(error.message),
  });

  // دالة تنسيق الأرقام الموحدة (أرقام إنجليزية + نص عربي)
  const formatNumber = (num: number | null) => num ? num.toLocaleString("en-US") : "-";
  const formatCurrency = (num: number | null) => num ? `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س` : "-";

  const generateWhatsAppMessage = (type: "request" | "welcome" | "update" | "missing") => {
    if (!client || !templates) return "";
    let template = templates[type];
    template = template.replace("{اسم_العميل}", client.name);
    template = template.replace("{رمز_الملف}", client.refCode || "");
    template = template.replace("{رقم_الوكالة}", client.wakalahNumber || "");
    template = template.replace("{الحالة}", STATUS_LABELS[client.status]);
    
    if (client.missingDocuments) {
      try {
        const docIds = JSON.parse(client.missingDocuments);
        if (Array.isArray(docIds) && docIds.length > 0) {
          const numberedDocs = docIds.map((docId, index) => {
            const doc = STANDARD_DOCUMENTS.find(d => d.id === docId);
            return `${index + 1}. ${doc?.label || docId}`;
          }).join('\n\n');
          template = template.replace("{المستندات_الناقصة}", numberedDocs);
        } else {
          template = template.replace("{المستندات_الناقصة}", "لا توجد مستندات ناقصة");
        }
      } catch {
        template = template.replace("{المستندات_الناقصة}", client.missingDocuments || "");
      }
    } else {
      template = template.replace("{المستندات_الناقصة}", "");
    }
    
    const wakalahDate = client.agencyDate 
      ? new Date(client.agencyDate).toLocaleDateString("en-CA") 
      : "غير محدد";
    const formattedWakalahDate = wakalahDate !== "غير محدد" 
      ? wakalahDate.replace(/-/g, "/") 
      : wakalahDate;
    template = template.replace("{تاريخ_الوكالة}", formattedWakalahDate);
    
    const trackingLink = client.refCode 
      ? `${window.location.origin}/clients/${client.id}`
      : "غير متوفر";
    template = template.replace("{رابط_التتبع}", trackingLink);
    
    if (client.agent) {
      template = template.replace("{اسم_الوكيل}", client.agent.name);
      template = template.replace("{سجل_الوكيل}", client.agent.idNumber || "");
      const birthDate = client.agent.birthDate 
        ? new Date(client.agent.birthDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : "غير محدد";
      template = template.replace("{تاريخ_ميلاد_الوكيل}", birthDate);
    }
    return template;
  };

  const previewMessage = (type: "request" | "welcome" | "update" | "missing") => {
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
    setSelectedTemplate(null);
    setMessagePreview("");
    setCustomMessage("");
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success("تم نسخ الرسالة");
  };

  const copyRefCode = () => {
    if (client?.refCode) {
      navigator.clipboard.writeText(client.refCode);
      toast.success("تم نسخ الرمز المرجعي");
    }
  };

  const { expectedCompensation, feeAmount } = useMemo(() => {
    if (!client) return { expectedCompensation: 0, feeAmount: 0 };

    const area = client.expropriationType === 'PARTIAL' ? parseFloat(client.expropriatedArea || "0") : parseFloat(client.areaSqm || "0");
    const pricePerSqm = parseFloat(client.expectedCompensationPerSqm || "0");
    const ratio = parseFloat(client.possessionRatio || "1");
    const improvements = parseFloat(client.improvementValue || "0");
    
    let compensation = 0;
    if (client.expropriationType === 'IMPROVEMENTS_ONLY') {
      compensation = improvements;
    } else if (area > 0 && pricePerSqm > 0 && ratio > 0) {
      compensation = (area * pricePerSqm * ratio) + improvements;
    }

    const feePercent = parseFloat(client.baseFeePercentage || "0") / 100;
    const fee = compensation > 0 && feePercent > 0 ? compensation * feePercent : 0;

    return { expectedCompensation: compensation, feeAmount: fee };
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

  const improvementWarning = useMemo(() => {
    if (!client) return false;
    const improvementTypes = Array.isArray(client.improvementTypes) ? client.improvementTypes : [];
    return improvementTypes.includes("OTHER") && !client.improvementOtherDescription;
  }, [client]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">العميل غير موجود</p>
        <Link href="/clients">
          <Button className="mt-4">العودة للقائمة</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusBadgeClasses(client.status)}>
                {STATUS_LABELS[client.status]}
              </Badge>
              {client.refCode && (
                <button onClick={copyRefCode} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <span className="font-mono">{client.refCode}</span>
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${client.id}/edit`}>
            <Button variant="outline">
              <Edit className="ml-2 h-4 w-4" />
              تعديل
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذا العميل؟ هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <label className="text-sm">أدخل المفتاح الرئيسي للتأكيد:</label>
                <Input type="password" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate({ id: client.id, masterKey })}>
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="financial">المالية</TabsTrigger>
          <TabsTrigger value="whatsapp">واتساب</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {improvementWarning && (
            <Alert variant="destructive">
              <AlertDescription>
                تنبيه: تم تحديد "أخرى" في نوع التحسينات ولكن لم يتم تقديم وصف. يرجى تحديث الملف.
              </AlertDescription>
            </Alert>
          )}
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted-foreground">الاسم</dt>
                  <dd className="font-medium">{client.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">الهاتف</dt>
                  <dd>
                    {client.phone ? (
                      <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                        <Phone className="h-4 w-4" />
                        {client.phone}
                      </a>
                    ) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">رقم الهوية</dt>
                  <dd className="font-mono">{client.idNumber || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">المدينة/الحي</dt>
                  <dd>{client.district || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">رابط الخريطة</dt>
                  <dd>
                    {client.surveyMapRef ? (
                      <a href={client.surveyMapRef} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <MapPin className="h-4 w-4" />
                        عرض الموقع
                      </a>
                    ) : "-"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Agent & Ownership */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الوكالة</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">الوكيل</dt>
                    <dd className="font-medium">{client.agent?.name || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">رقم الوكالة</dt>
                    <dd>{client.wakalahNumber || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">تاريخ الوكالة</dt>
                    <dd>
                      {client.agencyDate ? (
                        <DateDisplay date={client.agencyDate} format="short" />
                      ) : "-"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات العقار</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">نوع المستند</dt>
                    <dd>{client.propertyDocType === "Deed" ? "صك" : client.propertyDocType === "Ihkam" ? "إحكام" : client.propertyDocType === "Revivals" ? "إحياءات" : "أخرى"}</dd>
                  </div>
                  {client.propertyDocType === "Deed" && (
                    <>
                      <div>
                        <dt className="text-sm text-muted-foreground">رقم الصك</dt>
                        <dd>{client.deedNumber || "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">تاريخ الصك</dt>
                        <dd>
                          {client.deedDate ? (
                            <DateDisplay date={client.deedDate} format="short" />
                          ) : "-"}
                        </dd>
                      </div>
                    </>
                  )}
                  {client.propertyDocType === "Ihkam" && (
                    <>
                      <div>
                        <dt className="text-sm text-muted-foreground">رقم الطلب</dt>
                        <dd>{client.requestNumber || "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">تاريخ الطلب</dt>
                        <dd>
                          {client.requestDate ? (
                            <DateDisplay date={client.requestDate} format="short" />
                          ) : "-"}
                        </dd>
                      </div>
                    </>
                  )}
                  {(client.propertyDocType === "Revivals" || client.propertyDocType === "Other") && (
                    <div>
                      <dt className="text-sm text-muted-foreground">وصف العقار</dt>
                      <dd>{client.propertyDescription || "-"}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm text-muted-foreground">المدينة</dt>
                    <dd>{client.city || client.district || "-"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
        <Card>
            <CardHeader><CardTitle>المعلومات المالية الأساسية</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                
                {client.expropriationType !== 'IMPROVEMENTS_ONLY' && (
                  <>
                    <div>
                      <dt className="text-sm text-muted-foreground">إجمالي المساحة</dt>
                      <dd className="text-lg font-bold" dir="ltr">{formatNumber(parseFloat(client.areaSqm || "0"))} م²</dd>
                    </div>

                    {client.expropriationType === 'PARTIAL' && (
                      <div>
                        <dt className="text-sm text-muted-foreground">المساحة المنزوعة</dt>
                        <dd className="text-lg font-bold text-destructive" dir="ltr">{formatNumber(parseFloat(client.expropriatedArea || "0"))} م²</dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-sm text-muted-foreground">سعر المتر المتوقع</dt>
                      <dd className="text-lg font-bold" dir="ltr">{formatCurrency(parseFloat(client.expectedCompensationPerSqm || "0"))}</dd>
                    </div>
                  </>
                )}
                
                <div>
                  <dt className="text-sm text-muted-foreground">نسبة الاستحقاق</dt>
                  <dd className="text-lg font-bold" dir="ltr">{(parseFloat(client.possessionRatio || "1") * 100).toFixed(0)}%</dd>
                </div>

                {client.expropriationType === 'IMPROVEMENTS_ONLY' && (
                  <div>
                    <dt className="text-sm text-muted-foreground">قيمة الإحياءات</dt>
                    <dd className="text-lg font-bold text-blue-600" dir="ltr">{formatCurrency(parseFloat(client.improvementValue || "0"))}</dd>
                  </div>
                )}

                <div className="md:col-span-full pt-6 border-t">
                  <dt className="text-sm text-muted-foreground">إجمالي التعويض المتوقع</dt>
                  <dd className="text-3xl font-bold text-primary" dir="ltr">{formatCurrency(expectedCompensation)}</dd>
                  <p className="text-xs text-muted-foreground">
                    المعادلة: (المساحة * السعر * النسبة) + قيمة الإحياءات
                  </p>
                </div>

                {feeAmount > 0 && (
                  <div className="md:col-span-full pt-4 border-t">
                    <dt className="text-sm text-muted-foreground">قيمة الأتعاب المتوقعة ({client.baseFeePercentage}%)</dt>
                    <dd className="text-2xl font-bold text-green-600" dir="ltr">
                      {formatCurrency(feeAmount)}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
          {financials && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calculator className="h-5 w-5" />
                  الملخص المالي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">قيمة الأرض الأساسية</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{formatCurrency(parseFloat(financials.land_base))}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">نسبة التعويض الإضافي</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{client.extraCompRate || "0"}%</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">المبلغ الإضافي</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{formatCurrency(parseFloat(financials.extra_amount))}</dd>
                  </div>
                   <div>
                    <dt className="text-sm font-medium text-muted-foreground">قيمة التحسينات</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{formatCurrency(parseFloat(client.improvementValue || "0"))}</dd>
                  </div>
                   <div>
                    <dt className="text-sm font-medium text-muted-foreground">مبلغ الأضرار</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{formatCurrency(parseFloat(client.damageToRemainingComp || "0"))}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-blue-700">المجموع المتوقع</dt>
                    <dd className="text-xl font-mono font-bold text-blue-700" dir="ltr">{formatCurrency(parseFloat(financials.expected_total))}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">المجموع الرسمي</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{formatCurrency(parseFloat(financials.official_total))}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">مجموع التقرير</dt>
                    <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">{formatCurrency(parseFloat(financials.report_total))}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-green-700">الأتعاب المحسوبة</dt>
                    <dd className="text-lg font-mono font-bold text-green-700" dir="ltr">{formatCurrency(parseFloat(financials.fee_base))}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="whatsapp">
          <div className="space-y-4">
            {/* قوالب الرسائل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  قوالب رسائل واتساب
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button 
                    variant={selectedTemplate === "request" ? "default" : "outline"} 
                    className="h-auto py-4 flex-col gap-2" 
                    onClick={() => previewMessage("request")}
                  >
                    <FileText className="h-5 w-5" />
                    <span>طلب الوكالة</span>
                  </Button>
                  <Button 
                    variant={selectedTemplate === "welcome" ? "default" : "outline"} 
                    className="h-auto py-4 flex-col gap-2" 
                    onClick={() => previewMessage("welcome")}
                  >
                    <FileText className="h-5 w-5" />
                    <span>طلب مستندات</span>
                  </Button>
                  <Button 
                    variant={selectedTemplate === "update" ? "default" : "outline"} 
                    className="h-auto py-4 flex-col gap-2" 
                    onClick={() => previewMessage("update")}
                  >
                    <FileText className="h-5 w-5" />
                    <span>تحديث الحالة</span>
                  </Button>
                  <Button 
                    variant={selectedTemplate === "missing" ? "default" : "outline"} 
                    className="h-auto py-4 flex-col gap-2" 
                    onClick={() => previewMessage("missing")}
                  >
                    <FileText className="h-5 w-5" />
                    <span>المستندات الناقصة</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* معاينة وتعديل الرسالة */}
            {messagePreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    معاينة وتعديل الرسالة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* معاينة الرسالة الأصلية */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">القالب الأصلي:</h4>
                    <p className="text-sm whitespace-pre-wrap">{messagePreview}</p>
                  </div>

                  {/* تعديل الرسالة */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تعديل الرسالة (اختياري):</label>
                    <Textarea 
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={8}
                      className="font-[system-ui] text-sm"
                      placeholder="عدل الرسالة حسب الحاجة..."
                    />
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => sendWhatsAppDirect(customMessage)}
                    >
                      <Send className="ml-2 h-4 w-4" />
                      إرسال عبر واتساب
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => copyMessage(customMessage)}
                    >
                      <Copy className="ml-2 h-4 w-4" />
                      نسخ
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        setSelectedTemplate(null);
                        setMessagePreview("");
                        setCustomMessage("");
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>

                  {/* معلومات المستلم */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>سيتم الإرسال إلى: {client.phone || "لا يوجد رقم"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* رسالة مخصصة جديدة */}
            <Card>
              <CardHeader>
                <CardTitle>إرسال رسالة مخصصة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="اكتب رسالة مخصصة هنا..."
                  rows={6}
                  className="font-[system-ui]"
                  value={customMessage && !selectedTemplate ? customMessage : ""}
                  onChange={(e) => {
                    setCustomMessage(e.target.value);
                    setSelectedTemplate(null);
                    setMessagePreview("");
                  }}
                />
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => sendWhatsAppDirect(customMessage)}
                    disabled={!customMessage.trim()}
                  >
                    <Send className="ml-2 h-4 w-4" />
                    إرسال
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => copyMessage(customMessage)}
                    disabled={!customMessage.trim()}
                  >
                    <Copy className="ml-2 h-4 w-4" />
                    نسخ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* المستندات الناقصة */}
            {client.missingDocuments && (
              <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="text-amber-900 dark:text-amber-100">
                    تنبيه: مستندات ناقصة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100">
                    {client.missingDocuments}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}