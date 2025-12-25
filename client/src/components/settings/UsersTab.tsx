import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, User, Shield, UserCheck, UserX, Loader2, Key } from "lucide-react";

export default function UsersTab() {
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const utils = trpc.useUtils();
  const { data: users, isLoading: loadingUsers } = trpc.systemUsers.list.useQuery();

  const createUser = trpc.systemUsers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      utils.systemUsers.list.invalidate();
      setUserDialogOpen(false);
      resetUserForm();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء المستخدم: ${error.message}`);
    },
  });

  const updateUser = trpc.systemUsers.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستخدم بنجاح");
      utils.systemUsers.list.invalidate();
      setUserDialogOpen(false);
      resetUserForm();
    },
    onError: (error) => {
      toast.error(`فشل تحديث المستخدم: ${error.message}`);
    },
  });

  const deleteUser = trpc.systemUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم بنجاح");
      utils.systemUsers.list.invalidate();
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast.error(`فشل حذف المستخدم: ${error.message}`);
    },
  });

  const resetUserForm = () => {
    setUserForm({
      name: "",
      username: "",
      password: "",
      role: "user",
    });
    setEditingUserId(null);
    setShowPassword(false);
  };

  const openEditUser = (user: any) => {
    setUserForm({
      name: user.name,
      username: user.username,
      password: "", // كلمة مرور جديدة (اختيارية للتحديث)
      role: user.role,
    });
    setEditingUserId(user.id);
    setUserDialogOpen(true);
  };

  const handleUserSubmit = () => {
    if (!userForm.name.trim()) {
      toast.error("الرجاء إدخال اسم المستخدم");
      return;
    }
    
    if (!userForm.username.trim()) {
      toast.error("الرجاء إدخال اسم الدخول");
      return;
    }

    // التحقق من صحة اسم المستخدم (إنجليزية فقط)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(userForm.username)) {
      toast.error("اسم الدخول يمكن أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط");
      return;
    }

    // عند الإنشاء، كلمة المرور مطلوبة
    if (!editingUserId && !userForm.password) {
      toast.error("الرجاء إدخال كلمة المرور");
      return;
    }

    // عند التحديث، إذا تم إدخال كلمة مرور يجب أن تكون على الأقل 6 أحرف
    if (editingUserId && userForm.password && userForm.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون على الأقل 6 أحرف");
      return;
    }

    if (editingUserId) {
      updateUser.mutate({
        id: editingUserId,
        ...userForm,
        // إذا لم يتم إدخال كلمة مرور جديدة، لا ترسلها
        ...(userForm.password ? { password: userForm.password } : {}),
      });
    } else {
      createUser.mutate(userForm);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
          <Shield className="ml-1 h-3 w-3" />
          مسؤول
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        <User className="ml-1 h-3 w-3" />
        مستخدم
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <UserCheck className="ml-1 h-3 w-3" />
          نشط
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <UserX className="ml-1 h-3 w-3" />
        غير نشط
      </Badge>
    );
  };

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط العنوان والأزرار */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
          <p className="text-muted-foreground">
            إضافة وتعديل وحذف المستخدمين النظاميين الذين يمكنهم الوصول للنظام
          </p>
        </div>
        <Dialog open={userDialogOpen} onOpenChange={(open) => { 
          setUserDialogOpen(open); 
          if (!open) resetUserForm(); 
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              إضافة مستخدم
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUserId ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
              <DialogDescription>
                أدخل بيانات المستخدم. يمكن للمستخدمين الوصول للنظام بعد إنشائهم.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل *</Label>
                <Input
                  id="name"
                  placeholder="أحمد محمد"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">اسم الدخول *</Label>
                <Input
                  id="username"
                  placeholder="ahmed2024"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase() })}
                />
                <p className="text-xs text-muted-foreground">
                  اسم الدخول يمكن أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUserId ? "كلمة المرور الجديدة (اختياري)" : "كلمة المرور *"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={editingUserId ? "اتركها فارغة للحفاظ على كلمة المرور الحالية" : "كلمة المرور"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Key className={`h-4 w-4 ${showPassword ? 'text-primary' : ''}`} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  كلمة المرور يجب أن تكون على الأقل 6 أحرف
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">الصلاحية</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value: "admin" | "user") => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصلاحية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        مستخدم
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        مسؤول
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  المسؤولون يمكنهم إدارة جميع إعدادات النظام والمستخدمين
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleUserSubmit} 
                disabled={createUser.isPending || updateUser.isPending}
              >
                {(createUser.isPending || updateUser.isPending) && (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                )}
                {editingUserId ? "حفظ التغييرات" : "إنشاء المستخدم"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* جدول المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين النظاميين</CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>اسم الدخول</TableHead>
                    <TableHead>الصلاحية</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>تاريخ الإنشاء</TableHead>
                    <TableHead>آخر دخول</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {user.username}
                        </code>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.isActive !== false)}</TableCell>
                      <TableCell>
                        {user.createdAt 
                          ? new Date(user.createdAt).toLocaleDateString("ar-SA", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString("ar-SA", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : "لم يدخل بعد"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditUser(user)}
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog 
                            open={deleteUserId === user.id} 
                            onOpenChange={(open) => !open && setDeleteUserId(null)}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteUserId(user.id)}
                                title="حذف"
                                disabled={user.role === 'admin'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف المستخدم "{user.name}"؟
                                  <br />
                                  <span className="font-medium text-red-600">
                                    هذا الإجراء لا يمكن التراجع عنه.
                                  </span>
                                  {user.role === 'admin' && (
                                    <div className="mt-2 rounded-md bg-amber-50 p-2 text-amber-800">
                                      <Shield className="inline h-4 w-4 ml-1" />
                                      لا يمكن حذف المستخدمين المسؤولين من خلال الواجهة
                                    </div>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                {user.role !== 'admin' && (
                                  <AlertDialogAction
                                    onClick={() => deleteUser.mutate({ id: user.id })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                )}
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا يوجد مستخدمون نظاميون بعد</p>
              <p className="text-sm text-muted-foreground mt-2">
                استخدم زر "إضافة مستخدم" لإنشاء المستخدمين الأولين
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملاحظات مهمة */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            ملاحظات مهمة
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <ul className="space-y-2 list-disc list-inside">
            <li>المستخدمون النظاميون يمكنهم الدخول للنظام باستخدام اسم الدخول وكلمة المرور</li>
            <li>المسؤولون يمكنهم إدارة جميع إعدادات النظام والمستخدمين</li>
            <li>المستخدمون العاديون يمكنهم فقط عرض وتعديل البيانات المسموح لهم بها</li>
            <li>يجب أن يكون هناك على الأقل مسؤول واحد في النظام</li>
            <li>لا يمكن حذف المستخدمين المسؤولين من خلال الواجهة</li>
            <li>كلمات المرور مشفرة ولا يمكن عرضها</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
