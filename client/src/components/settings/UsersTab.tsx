import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, UserCircle, Shield, KeyRound } from "lucide-react";
import { DateDisplay } from "@/components/DateDisplay";
import { PasswordChangeDialog } from "./PasswordChangeDialog";

export default function UsersTab() {
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "agent" as any, email: "", phone: "" });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [pwdForm, setPwdForm] = useState({ userId: 0, newPassword: "" });
  const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.systemUsers.list.useQuery();

  const createMutation = trpc.systemUsers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المستخدم");
      utils.systemUsers.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.systemUsers.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات المستخدم");
      utils.systemUsers.list.invalidate();
      setDialogOpen(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const changePwdMutation = trpc.systemUsers.changePassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      setPwdDialogOpen(false);
      setPwdForm({ userId: 0, newPassword: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.systemUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم");
      utils.systemUsers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ name: "", username: "", password: "", role: "agent", email: "", phone: "" });
    setEditingUser(null);
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setForm({
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: user.role || "agent",
      email: user.email || "",
      phone: user.phone || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.username) {
      toast.error("الاسم واسم المستخدم مطلوبان");
      return;
    }
    
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        name: form.name,
        username: form.username,
        role: form.role,
        email: form.email,
        phone: form.phone
      });
    } else {
      if (!form.password) {
        toast.error("كلمة المرور مطلوبة للمستخدم الجديد");
        return;
      }
      createMutation.mutate(form);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-right">
            <Shield className="h-5 w-5 text-blue-600" />
            إدارة المستخدمين
          </CardTitle>
          <CardDescription className="text-right">إدارة صلاحيات الوصول للنظام</CardDescription>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة مستخدم
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">اسم المستخدم</TableHead>
                <TableHead className="text-right">الصلاحية</TableHead>
                <TableHead className="text-right">آخر دخول</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-bold">{u.name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                      u.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role === 'admin' ? 'مدير' : u.role === 'agent' ? 'وكيل' : 'مشاهد'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DateDisplay date={u.lastLoginAt} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="تعديل">
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => { setPwdForm({ userId: u.id, newPassword: "" }); setPwdDialogOpen(true); }} title="تغيير كلمة المرور">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" title="حذف">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المستخدم</AlertDialogTitle>
                            <AlertDialogDescription>هل أنت متأكد من حذف {u.name}؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate({ id: u.id })}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              حذف
                            </AlertDialogAction>
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

      {/* Dialog إضافة/تعديل */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingUser ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editingUser} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="يجب أن تكون قوية" />
                <p className="text-[10px] text-muted-foreground">8 أحرف، حرف كبير، حرف صغير، رقم، ورمز خاص.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير نظام</SelectItem>
                  <SelectItem value="agent">وكيل معتمد</SelectItem>
                  <SelectItem value="viewer">مشاهد فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={createMutation.isLoading || updateMutation.isLoading} className="w-full">
              {(createMutation.isLoading || updateMutation.isLoading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {editingUser ? "حفظ التغييرات" : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog تغيير كلمة المرور للمسؤول */}
      <PasswordChangeDialog 
        open={pwdDialogOpen} 
        onOpenChange={setPwdDialogOpen} 
        mode="admin" 
        userId={pwdForm.userId} 
      />
    </Card>
  );
}