import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, MessageCircle, Download, Lock, Loader2, Shield } from "lucide-react";
import { DualDatePicker } from "@/components/DualDatePicker";
import { DateDisplay } from "@/components/DateDisplay";
import * as XLSX from "xlsx";
import UsersTab from "@/components/settings/UsersTab";

export default function Settings() {
  const [masterKey, setMasterKey] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", idNumber: "", birthDate: "", phone: "" });
  const [editingAgent, setEditingAgent] = useState<number | null>(null);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [deleteAgentId, setDeleteAgentId] = useState<number | null>(null);

  const { data: agents, isLoading: agentsLoading } = trpc.agents.list.useQuery();
  const { data: templates } = trpc.settings.getWhatsAppTemplates.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const utils = trpc.useUtils();

  const verifyKey = trpc.auth.verifyMasterKey.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        setIsUnlocked(true);
        toast.success("تم فتح الإعدادات");
      } else {
        toast.error("المفتاح غير صحيح");
      }
    },
  });

  const createAgent = trpc.agents.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الوكيل");
      utils.agents.list.invalidate();
      setAgentDialogOpen(false);
      resetAgentForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateAgent = trpc.agents.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الوكيل");
      utils.agents.list.invalidate();
      setAgentDialogOpen(false);
      resetAgentForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAgent = trpc.agents.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الوكيل");
      utils.agents.list.invalidate();
      setDeleteAgentId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateTemplate = trpc.settings.setWhatsAppTemplate.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ القالب");
      utils.settings.getWhatsAppTemplates.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetAgentForm = () => {
    setAgentForm({ name: "", idNumber: "", birthDate: "", phone: "" });
    setEditingAgent(null);
  };

  const openEditAgent = (agent: any) => {
    setAgentForm({
      name: agent.name,
      idNumber: agent.idNumber || "",
      birthDate: agent.birthDate ? new Date(agent.birthDate).toISOString().split("T")[0] : "",
      phone: agent.phone || "",
    });
    setEditingAgent(agent.id);
    setAgentDialogOpen(true);
  };

  const handleAgentSubmit = () => {
    if (!agentForm.name.trim()) {
      toast.error("الرجاء إدخال اسم الوكيل");
      return;
    }
    const data = {
      name: agentForm.name,
      idNumber: agentForm.idNumber || undefined,
      birthDate: agentForm.birthDate || undefined,
      phone: agentForm.phone || undefined,
    };
    if (editingAgent) {
      updateAgent.mutate({ id: editingAgent, ...data });
    } else {
      createAgent.mutate(data);
    }
  };

  const exportToExcel = () => {
    if (!clients?.length) {
      toast.error("لا يوجد عملاء للتصدير");
      return;
    }
    const data = clients.map((c) => ({
      "الرمز المرجعي": c.refCode,
      "الاسم": c.name,
      "الهاتف": c.phone,
      "رقم الهوية": c.idNumber,
      "المدينة/الموقع": c.district,
      "الحالة": c.status,
      "المساحة (م²)": c.areaSqm,
      "سعر المتر": c.expectedCompensationPerSqm,
      "إجمالي التعويض": c.expectedCompensationTotal,
      "نسبة النجاح": c.successFee,
      "رقم الوكالة": c.wakalahNumber,
      "نوع المستند": c.propertyDocType,
      "رقم الصك": c.deedNumber,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العملاء");
    XLSX.writeFile(wb, `wakala-clients-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("تم تصدير البيانات");
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>الإعدادات محمية</CardTitle>
            <CardDescription>أدخل المفتاح الرئيسي للوصول</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="المفتاح الرئيسي"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyKey.mutate({ key: masterKey })}
              />
              <Button className="w-full" onClick={() => verifyKey.mutate({ key: masterKey })} disabled={verifyKey.isPending}>
                {verifyKey.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                فتح الإعدادات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الإعدادات</h1>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" className="gap-2">
            <Users className="h-4 w-4" />
            الوكلاء
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Shield className="h-4 w-4" />
            المستخدمين
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            قوالب واتساب
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            التصدير
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>إدارة الوكلاء</CardTitle>
              <Dialog open={agentDialogOpen} onOpenChange={(open) => { setAgentDialogOpen(open); if (!open) resetAgentForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="ml-2 h-4 w-4" />إضافة وكيل</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAgent ? "تعديل الوكيل" : "إضافة وكيل جديد"}</DialogTitle>
                    <DialogDescription>أدخل بيانات الوكيل</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>الاسم *</Label>
                      <Input value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>السجل المدني</Label>
                      <Input value={agentForm.idNumber} onChange={(e) => setAgentForm({ ...agentForm, idNumber: e.target.value })} />
                    </div>
                    <DualDatePicker
                      label="تاريخ الميلاد"
                      value={agentForm.birthDate}
                      onChange={(date) => setAgentForm({ ...agentForm, birthDate: date })}
                      defaultCalendar="hijri"
                    />
                    <div className="space-y-2">
                      <Label>الجوال</Label>
                      <Input value={agentForm.phone} onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAgentDialogOpen(false)}>إلغاء</Button>
                    <Button onClick={handleAgentSubmit} disabled={createAgent.isPending || updateAgent.isPending}>
                      {(createAgent.isPending || updateAgent.isPending) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      {editingAgent ? "حفظ" : "إضافة"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
              ) : agents?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">لا يوجد وكلاء</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>السجل المدني</TableHead>
                      <TableHead>تاريخ الميلاد</TableHead>
                      <TableHead>الجوال</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents?.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.idNumber || "-"}</TableCell>
                        <TableCell>
                          {agent.birthDate ? (
                            <DateDisplay date={agent.birthDate} format="short" />
                          ) : "-"}
                        </TableCell>
                        <TableCell>{agent.phone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditAgent(agent)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteAgentId === agent.id} onOpenChange={(open) => !open && setDeleteAgentId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteAgentId(agent.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف الوكيل</AlertDialogTitle>
                                  <AlertDialogDescription>هل أنت متأكد من حذف هذا الوكيل؟</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteAgent.mutate({ id: agent.id, masterKey })}>حذف</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid gap-4">
            {(["request", "welcome", "update", "missing"] as const).map((type) => {
              const labels = { request: "طلب الوكالة", welcome: "الترحيب", update: "تحديث الحالة", missing: "المستندات الناقصة" };
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-lg">{labels[type]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      defaultValue={templates?.[type] || ""}
                      rows={4}
                      onBlur={(e) => {
                        if (e.target.value !== templates?.[type]) {
                          updateTemplate.mutate({ type, template: e.target.value, masterKey });
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      المتغيرات: {"{اسم_العميل}"}, {"{رمز_الملف}"}, {"{رقم_الوكالة}"}, {"{الحالة}"}, {"{اسم_الوكيل}"}, {"{المستندات_الناقصة}"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>تصدير البيانات</CardTitle>
              <CardDescription>تصدير جميع بيانات العملاء إلى ملف Excel</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={exportToExcel} className="gap-2">
                <Download className="h-4 w-4" />
                تصدير إلى Excel
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                سيتم تصدير {clients?.length || 0} عميل
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}