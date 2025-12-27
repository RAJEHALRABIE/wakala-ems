import { useState, useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowRight, Save, Loader2, MapPin, Check, AlertTriangle, Map, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GoogleMap } from "@/components/GoogleMap";
import { CLIENT_STATUSES, STATUS_LABELS, ClientStatus } from "@shared/statuses";
import { extractCoordinates, formatCoordinates } from "@shared/coordinates";
import { STANDARD_DOCUMENTS } from "@shared/documents";
import { calculateFinancials } from "@shared/financials";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SmartDateInput, DateRangeInput } from "@/components/ui/SmartDateInput";

// ... (باقي الثوابت دون تغيير)
const PROPERTY_DOC_TYPES = [
  { value: "Deed", label: "صك" },
  { value: "Ihkam", label: "إحكام" },
  { value: "Revivals", label: "إحياءات" },
  { value: "Other", label: "أخرى" },
];

const EXPROPRIATION_TYPES = [
  { value: "FULL", label: "نزع كلي" },
  { value: "PARTIAL", label: "نزع جزئي" },
  { value: "IMPROVEMENTS_ONLY", label: "نزع إحياءات فقط" },
];

const IMPROVEMENT_TYPES = [
  { value: "BUILDING", label: "مباني" },
  { value: "FENCE", label: "سياج" },
  { value: "TREES", label: "أشجار" },
  { value: "WELL", label: "آبار" },
  { value: "IRRIGATION", label: "ري" },
  { value: "UTILITIES", label: "خدمات" },
  { value: "PAVEMENT", label: "رصف" },
  { value: "OTHER", label: "أخرى" },
];

type PropertyDocType = "Deed" | "Ihkam" | "Revivals" | "Other";
type ExpropriationType = "FULL" | "PARTIAL" | "IMPROVEMENTS_ONLY";

const INITIAL_FORM_STATE = {
  name: "",
  phone: "",
  idNumber: "",
  agentId: null as number | null,
  wakalahNumber: "",
  agencyDate: "",
  agencyExpiryDate: "",
  propertyDocType: "Deed" as PropertyDocType,
  deedNumber: "",
  deedDate: "",
  requestNumber: "",
  requestDate: "",
  propertyDescription: "",
  city: "",
  mapLink: "",
  district: "",
  status: "New" as ClientStatus,
  expropriationType: "FULL" as ExpropriationType,
  decisionNumber: "",
  decisionDate: "",
  expropriatedArea: "",
  remainingArea: "",
  improvementType: "",
  improvementValue: "",
  improvementTypes: [] as string[],
  improvementOtherDescription: "",
  areaSqm: "",
  expectedCompensationPerSqm: "",
  possessionRatio: "1.0",
  baseFeePercentage: "",
  successFee: "",
  missingDocuments: "",
};

export default function ClientForm() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isEdit = params.id && params.id !== "new";
  const clientId = isEdit ? parseInt(params.id!) : null;

  const [form, setForm] = useState({
    ...INITIAL_FORM_STATE,
    damageToRemainingComp: "",
    extraCompRate: "",
    officialCompensationAmount: "",
  });

  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedMapPosition, setSelectedMapPosition] = useState<{ lat: number; lng: number } | null>(null);

  const formatCurrency = (val: any) => {
    const num = parseFloat(val || "0");
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ريال";
  };

  const handleMapPositionSelect = (lat: number, lng: number) => {
    setSelectedMapPosition({ lat, lng });
    const googleMapsUrl = `http://maps.google.com/?q=${lat},${lng}`;
    setForm(prev => ({ ...prev, mapLink: googleMapsUrl }));
  };

  const confirmMapSelection = () => {
    setMapDialogOpen(false);
    toast.success("تم تحديد الموقع بنجاح");
  };

  const { data: client, isLoading: clientLoading } = trpc.clients.getById.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );

  console.log('[ClientForm] client data from server', client);

  const { data: agents } = trpc.agents.list.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (client) {
      const extractDateString = (val: any): string => {
        if (!val) return "";
        if (typeof val === 'string') return val.split('T')[0];
        try {
           return new Date(val).toISOString().split('T')[0];
        } catch { return ""; }
      };

      setForm({
        name: client.name || "",
        phone: client.phone || "",
        idNumber: client.idNumber || "",
        agentId: client.agentId,
        wakalahNumber: client.wakalahNumber || "",
        
        agencyDate: extractDateString(client.agencyDate),
        agencyExpiryDate: extractDateString(client.agencyExpiryDate),
        deedDate: extractDateString(client.deedDate),
        requestDate: extractDateString(client.requestDate),
        decisionDate: extractDateString(client.decisionDate),
        
        propertyDocType: (client.propertyDocType as PropertyDocType) || "Deed",
        deedNumber: client.deedNumber || "",
        requestNumber: client.requestNumber || "",
        propertyDescription: client.propertyDescription || "",
        city: client.city || "",
        mapLink: client.mapLink || "",
        district: client.district || "",
        status: client.status as ClientStatus,
        expropriationType: (client.expropriationType as ExpropriationType) || "FULL",
        decisionNumber: client.decisionNumber || "",
        expropriatedArea: client.expropriatedArea?.toString() || "",
        remainingArea: client.remainingArea?.toString() || "",
        improvementType: client.improvementType || "",
        improvementValue: client.improvementValue?.toString() || "",
        improvementTypes: Array.isArray(client.improvementTypes) ? client.improvementTypes : [],
        improvementOtherDescription: client.improvementOtherDescription || "",
        areaSqm: client.areaSqm?.toString() || "",
        expectedCompensationPerSqm: client.expectedCompensationPerSqm?.toString() || "",
        possessionRatio: client.possessionRatio?.toString() || "1.0",
        baseFeePercentage: client.baseFeePercentage?.toString() || "",
        successFee: client.successFee?.toString() || "",
        damageToRemainingComp: client.damageToRemainingComp?.toString() || "",
        extraCompRate: client.extraCompRate?.toString() || "",
        officialCompensationAmount: client.officialCompensationAmount?.toString() || "",
      });

      if (client.missingDocuments) {
        try {
          const docs = JSON.parse(client.missingDocuments);
          if (Array.isArray(docs)) setSelectedDocuments(docs);
        } catch {}
      }
    }
  }, [client, clientId]);

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: (newClient) => {
      toast.success("تم إضافة العميل بنجاح");
      utils.clients.list.invalidate();
      setLocation(`/clients/${newClient.id}`);
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث البيانات بنجاح");
      utils.clients.list.invalidate();
      utils.clients.getById.invalidate({ id: clientId! });
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      name: form.name.trim(),
      phone: form.phone?.trim() || undefined,
      idNumber: form.idNumber?.trim() || undefined,
      agentId: form.agentId || undefined,
      wakalahNumber: form.wakalahNumber?.trim() || undefined,
      agencyDate: form.agencyDate || undefined,
      agencyExpiryDate: form.agencyExpiryDate || undefined,
      propertyDocType: form.propertyDocType,
      deedNumber: form.deedNumber?.trim() || undefined,
      deedDate: form.deedDate || undefined,
      requestNumber: form.requestNumber?.trim() || undefined,
      requestDate: form.requestDate || undefined,
      propertyDescription: form.propertyDescription?.trim() || undefined,
      city: form.city?.trim() || undefined,
      mapLink: form.mapLink?.trim() || undefined,
      district: form.district?.trim() || undefined,
      status: form.status,
      expropriationType: form.expropriationType,
      decisionNumber: form.decisionNumber?.trim() || undefined,
      decisionDate: form.decisionDate || undefined,
      expropriatedArea: form.expropriatedArea ? parseFloat(form.expropriatedArea) : undefined,
      remainingArea: form.remainingArea ? parseFloat(form.remainingArea) : undefined,
      improvementType: form.improvementType?.trim() || undefined,
      improvementValue: form.improvementValue ? parseFloat(form.improvementValue) : undefined,
      areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : undefined,
      expectedCompensationPerSqm: form.expectedCompensationPerSqm ? parseFloat(form.expectedCompensationPerSqm) : undefined,
      possessionRatio: form.possessionRatio ? parseFloat(form.possessionRatio) : undefined,
      baseFeePercentage: form.baseFeePercentage ? parseFloat(form.baseFeePercentage) : undefined,
      successFee: form.successFee ? parseFloat(form.successFee) : undefined,
      damageToRemainingComp: form.damageToRemainingComp ? parseFloat(form.damageToRemainingComp) : undefined,
      extraCompRate: form.extraCompRate ? parseFloat(form.extraCompRate) : undefined,
      officialCompensationAmount: form.officialCompensationAmount ? parseFloat(form.officialCompensationAmount) : undefined,
      missingDocuments: selectedDocuments.length > 0 ? JSON.stringify(selectedDocuments) : undefined,
      improvementTypes: form.improvementTypes,
      improvementOtherDescription: form.improvementOtherDescription,
    };

    if (isEdit && clientId) {
      updateMutation.mutate({ id: clientId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const financials = useMemo(() => {
    const areaInput = form.expropriationType === 'PARTIAL' ? form.expropriatedArea : form.areaSqm;
    return calculateFinancials({
      areaSqm: parseFloat(areaInput),
      expectedCompensationPerSqm: parseFloat(form.expectedCompensationPerSqm),
      possessionRatio: parseFloat(form.possessionRatio),
      baseFeePercentage: parseFloat(form.baseFeePercentage),
      damageToRemainingComp: parseFloat(form.damageToRemainingComp),
      extraCompRate: parseFloat(form.extraCompRate),
      officialCompensationAmount: parseFloat(form.officialCompensationAmount),
      improvementValue: parseFloat(form.improvementValue),
    });
  }, [form]);

  const improvementWarning = useMemo(() => {
    return form.improvementTypes.includes("OTHER") && !form.improvementOtherDescription;
  }, [form]);

  const warnings = useMemo(() => {
    const w = [];
    const pFloat = (v: string) => parseFloat(v || "0");

    if (form.expropriationType === 'FULL' && pFloat(form.damageToRemainingComp) > 0) {
      w.push("تنبيه: النزع الكلي عادة لا يشمل تعويض عن الجزء المتبقي");
    }
    if (form.expropriationType === 'PARTIAL' && pFloat(form.expropriatedArea) <= 0) {
      w.push("تنبيه: يرجى إدخال المساحة المنزوعة");
    }
    if (form.improvementTypes.includes("OTHER") && !form.improvementOtherDescription.trim()) {
      w.push("تنبيه: الوصف مطلوب عند اختيار 'أخرى'");
    }
    
    return w;
  }, [form]);

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // دوال عرض الحقول المساعدة
  const renderPropertyFields = () => {
    switch (form.propertyDocType) {
      case "Deed":
        return (
          <>
            <div className="space-y-2">
              <Label>رقم الصك</Label>
              <Input value={form.deedNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, deedNumber: e.target.value })} />
            </div>
            <SmartDateInput
              label="تاريخ الصك"
              value={form.deedDate}
              onChange={(date) => setForm({ ...form, deedDate: date })}
              defaultToday={false}
            />
          </>
        );
      case "Ihkam":
        return (
          <>
            <div className="space-y-2">
              <Label>رقم الطلب</Label>
              <Input value={form.requestNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, requestNumber: e.target.value })} />
            </div>
            <SmartDateInput
              label="تاريخ الطلب"
              value={form.requestDate}
              onChange={(date) => setForm({ ...form, requestDate: date })}
              defaultToday={false}
            />
          </>
        );
      case "Revivals":
      case "Other":
        return (
          <div className="space-y-2 md:col-span-2">
            <Label>وصف العقار</Label>
            <Textarea 
              value={form.propertyDescription} 
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, propertyDescription: e.target.value })}
              placeholder={form.propertyDocType === "Revivals" ? "وصف الإحياءات" : "الوصف"}
              rows={3}
            />
          </div>
        );
    }
  };

  const renderExpropriationFields = () => {
    switch (form.expropriationType) {
      case 'PARTIAL':
        return (
          <>
            <div className="space-y-2">
              <Label>رقم قرار النزع</Label>
              <Input value={form.decisionNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, decisionNumber: e.target.value })} />
            </div>
            <SmartDateInput
              label="تاريخ القرار"
              value={form.decisionDate}
              onChange={(date) => setForm({ ...form, decisionDate: date })}
              defaultToday={false}
            />
            <div className="space-y-2">
              <Label>المساحة المنزوعة (م²)</Label>
              <Input type="number" value={form.expropriatedArea} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, expropriatedArea: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المساحة المتبقية (م²)</Label>
              <Input type="number" value={form.remainingArea} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, remainingArea: e.target.value })} />
            </div>
          </>
        );
      case 'IMPROVEMENTS_ONLY':
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{isEdit ? "تعديل بيانات العميل" : "إضافة عميل جديد"}</h1>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>الهاتف</Label><Input value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} type="tel" /></div>
            <div className="space-y-2"><Label>رقم الهوية</Label><Input value={form.idNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, idNumber: e.target.value })} /></div>
            <div className="space-y-2"><Label>الحالة</Label><Select value={form.status} onValueChange={(v: string) => setForm({ ...form, status: v as ClientStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CLIENT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>))}</SelectContent></Select></div>
          </CardContent>
        </Card>

        {/* Missing Documents */}
        <Card>
          <CardHeader>
            <CardTitle>المستندات الناقصة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                حدد المستندات الناقصة من قبل العميل
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {STANDARD_DOCUMENTS.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={selectedDocuments.includes(doc.id)}
                      onCheckedChange={(checked) => {
                        const newDocs = checked
                          ? [...selectedDocuments, doc.id]
                          : selectedDocuments.filter((id) => id !== doc.id);
                        setSelectedDocuments(newDocs);
                      }}
                      className="h-5 w-5 border-2 border-gray-400 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                    />
                    <Label
                      htmlFor={`doc-${doc.id}`}
                      className="font-medium text-gray-700 cursor-pointer flex-1 select-none"
                    >
                      {doc.label}
                    </Label>
                  </div>
                ))}
              </div>
              {selectedDocuments.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">
                    عدد المستندات الناقصة: {selectedDocuments.length}
                  </p>
                  <ul className="mt-2 text-sm text-amber-700 list-disc list-inside">
                    {selectedDocuments.map((docId) => {
                      const doc = STANDARD_DOCUMENTS.find((d) => d.id === docId);
                      return <li key={docId}>{doc?.label || docId}</li>;
                    })}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/20">
            <CardHeader>
              <CardTitle className="text-amber-900">تنبيهات</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    {warning}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Agency Information Card */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex flex-row-reverse gap-2 items-center">
              <MapPin className="h-6 w-6 text-primary" />
              معلومات الوكالة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>الوكيل</Label>
              <Select 
                value={form.agentId?.toString() || "none"} 
                onValueChange={(v) => setForm({ ...form, agentId: v === "none" ? null : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوكيل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون وكيل</SelectItem>
                  {agents?.map((a: any) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الوكالة</Label>
              <Input 
                value={form.wakalahNumber} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, wakalahNumber: e.target.value })} 
              />
            </div>

            {/* حقول تاريخ الوكالة باستخدام DateRangeInput */}
            <div className="md:col-span-2 lg:col-span-3">
              <DateRangeInput
                startLabel="تاريخ بداية الوكالة"
                endLabel="تاريخ نهاية الوكالة"
                startValue={form.agencyDate}
                endValue={form.agencyExpiryDate}
                onStartChange={(date) => setForm({ ...form, agencyDate: date })}
                onEndChange={(date) => setForm({ ...form, agencyExpiryDate: date })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Property Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات العقار</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>نوع المستند</Label>
              <Select 
                value={form.propertyDocType} 
                onValueChange={(v: PropertyDocType) => setForm({ ...form, propertyDocType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderPropertyFields()}
            <div className="space-y-2">
              <Label>المدينة/الحي</Label>
              <Input 
                value={form.city} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, city: e.target.value })} 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>رابط الخريطة</Label>
              <div className="flex gap-2">
                <Input 
                  value={form.mapLink} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, mapLink: e.target.value })} 
                  placeholder="رابط خرائط جوجل" 
                  className="flex-1" 
                />
                <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="shrink-0">
                      <Map className="h-4 w-4 ml-2" />
                      تحديد من الخريطة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        تحديد الموقع
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <GoogleMap 
                        height="450px" 
                        center={{ lat: 24.7136, lng: 46.6753 }} 
                        zoom={6} 
                        selectable={true} 
                        selectedPosition={selectedMapPosition} 
                        onPositionSelect={handleMapPositionSelect} 
                        showSearch={true} 
                        showSatelliteToggle={true} 
                      />
                      {selectedMapPosition && (
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 text-green-700">
                            <Check className="h-5 w-5" />
                            <span>تم تحديد الموقع: {selectedMapPosition.lat.toFixed(6)}, {selectedMapPosition.lng.toFixed(6)}</span>
                          </div>
                          <Button type="button" onClick={confirmMapSelection} size="sm">
                            تأكيد
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expropriation Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل النزع</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>نوع النزع</Label>
              <Select 
                value={form.expropriationType} 
                onValueChange={(v: ExpropriationType) => setForm({ ...form, expropriationType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPROPRIATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderExpropriationFields()}
          </CardContent>
        </Card>

        {/* Improvements Card */}
        <Card>
          <CardHeader>
            <CardTitle>التحسينات والإحياءات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>أنواع التحسينات</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {IMPROVEMENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`improvement-${type.value}`}
                      checked={form.improvementTypes.includes(type.value)}
                      onCheckedChange={(checked) => {
                        const newTypes = checked
                          ? [...form.improvementTypes, type.value]
                          : form.improvementTypes.filter((t) => t !== type.value);
                        setForm({ ...form, improvementTypes: newTypes });
                      }}
                    />
                    <Label htmlFor={`improvement-${type.value}`} className="cursor-pointer">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {form.improvementTypes.includes("OTHER") && (
              <div className="space-y-2">
                <Label>وصف التحسينات الأخرى *</Label>
                <Textarea
                  value={form.improvementOtherDescription}
                  onChange={(e) => setForm({ ...form, improvementOtherDescription: e.target.value })}
                  placeholder="اذكر تفاصيل التحسينات الأخرى..."
                  rows={2}
                />
                {improvementWarning && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      الوصف مطلوب.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>قيمة التحسينات (ريال)</Label>
              <Input 
                type="number" 
                value={form.improvementValue} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, improvementValue: e.target.value })} 
                placeholder="مبلغ تقديري"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Data Card */}
        <Card>
          <CardHeader>
            <CardTitle>البيانات المالية</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {form.expropriationType !== 'IMPROVEMENTS_ONLY' && (
              <>
                <div className="space-y-2">
                  <Label>إجمالي المساحة (م²)</Label>
                  <Input 
                    type="number" 
                    value={form.areaSqm} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, areaSqm: e.target.value })} 
                    placeholder="المساحة الكلية" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>سعر المتر المتوقع (ريال)</Label>
                  <Input 
                    type="number" 
                    value={form.expectedCompensationPerSqm} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, expectedCompensationPerSqm: e.target.value })} 
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>نسبة الاستحقاق (%)</Label>
              <Input 
                type="number" 
                value={form.possessionRatio} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, possessionRatio: e.target.value })} 
                placeholder="1.0 = 100%" 
                step="0.01" 
              />
            </div>
            <div className="space-y-2">
              <Label>نسبة الأتعاب (%)</Label>
              <Input 
                type="number" 
                value={form.baseFeePercentage} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, baseFeePercentage: e.target.value })} 
                placeholder="مثال: 2.5" 
              />
            </div>
            <div className="space-y-2">
              <Label>نسبة تعويض إضافي (%)</Label>
              <Input 
                type="number" 
                value={form.extraCompRate} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, extraCompRate: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>تعويض الضرر (ريال)</Label>
              <Input 
                type="number" 
                value={form.damageToRemainingComp} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, damageToRemainingComp: e.target.value })} 
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>التعويض الرسمي (ريال)</Label>
              <Input 
                type="number" 
                value={form.officialCompensationAmount} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, officialCompensationAmount: e.target.value })} 
                placeholder="اختياري" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card className="border-blue-200 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calculator className="h-5 w-5" />
              الملخص المالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">قيمة الأرض الأساسية</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {formatCurrency(parseFloat(financials?.land_base || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">نسبة التعويض الإضافي</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {form.extraCompRate || "0"}%
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">المبلغ الإضافي</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {formatCurrency(parseFloat(financials?.extra_amount || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">قيمة التحسينات</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {formatCurrency(parseFloat(form.improvementValue || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">مبلغ الأضرار</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {formatCurrency(parseFloat(form.damageToRemainingComp || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-blue-700">المجموع المتوقع</dt>
                <dd className="text-xl font-mono font-bold text-blue-700" dir="ltr">
                  {formatCurrency(parseFloat(financials?.expected_total || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">المجموع الرسمي</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {formatCurrency(parseFloat(financials?.official_total || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-muted-foreground">مجموع التقرير</dt>
                <dd className="text-lg font-mono font-semibold text-gray-900" dir="ltr">
                  {formatCurrency(parseFloat(financials?.report_total || "0"))}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-sm font-medium text-green-700">الأتعاب المحسوبة</dt>
                <dd className="text-lg font-mono font-bold text-green-700" dir="ltr">
                  {formatCurrency(parseFloat(financials?.fee_base || "0"))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isPending}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                {isEdit ? "حفظ التغييرات" : "إضافة العميل"}
              </>
            )}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}