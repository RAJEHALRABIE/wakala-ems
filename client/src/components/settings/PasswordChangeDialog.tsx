import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "self" | "admin";
  userId?: number;
}

export function PasswordChangeDialog({ open, onOpenChange, mode, userId }: PasswordChangeDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const changeMyPwdMutation = trpc.systemUsers.changeMyPassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور بنجاح");
      onOpenChange(false);
      resetFields();
    },
    onError: (e) => toast.error(e.message),
  });

  const changeUserPwdMutation = trpc.systemUsers.changePassword.useMutation({
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور للمستخدم بنجاح");
      onOpenChange(false);
      resetFields();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const validation = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSymbol: /[!@#$%^&*]/.test(newPassword),
      match: newPassword !== "" && newPassword === confirmPassword
    };
  }, [newPassword, confirmPassword]);

  const isValid = Object.values(validation).every(v => v);

  const handleSubmit = () => {
    if (mode === "self") {
      if (!currentPassword) {
        toast.error("يرجى إدخال كلمة المرور الحالية");
        return;
      }
      changeMyPwdMutation.mutate({ currentPassword, newPassword });
    } else {
      if (!userId) return;
      changeUserPwdMutation.mutate({ userId, newPassword });
    }
  };

  const Requirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-[#22c55e]' : 'text-gray-400'}`}>
      <div className={`h-4 w-4 rounded-full flex items-center justify-center border ${met ? 'border-[#22c55e] bg-green-50' : 'border-gray-300'}`}>
        {met && <Check className="h-3 w-3" />}
      </div>
      <span>{text}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تغيير كلمة المرور</DialogTitle>
          <DialogDescription className="text-right">
            {mode === "self" ? "يرجى إدخال كلمة المرور الحالية والجديدة لتحديث بياناتك." : "تغيير كلمة المرور لهذا المستخدم."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {mode === "self" && (
            <div className="space-y-2">
              <Label className="block text-right">كلمة المرور الحالية</Label>
              <Input 
                type="password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                placeholder="••••••••"
                className="text-right"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="block text-right">كلمة المرور الجديدة</Label>
            <Input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="••••••••"
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label className="block text-right">تأكيد كلمة المرور الجديدة</Label>
            <Input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••"
              className="text-right"
            />
            {!validation.match && confirmPassword && (
              <p className="text-[10px] text-red-500 text-right">كلمات المرور غير متطابقة</p>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Requirement met={validation.minLength} text="8 أحرف على الأقل" />
            <Requirement met={validation.hasUpper} text="حرف كبير (A-Z)" />
            <Requirement met={validation.hasLower} text="حرف صغير (a-z)" />
            <Requirement met={validation.hasNumber} text="رقم واحد (0-9)" />
            <Requirement met={validation.hasSymbol} text="رمز خاص (!@#$)" />
            <Requirement met={validation.match} text="تطابق الكلمتين" />
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full"
            onClick={handleSubmit}
            disabled={!isValid || changeMyPwdMutation.isLoading || changeUserPwdMutation.isLoading}
          >
            {(changeMyPwdMutation.isLoading || changeUserPwdMutation.isLoading) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تحديث كلمة المرور
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}