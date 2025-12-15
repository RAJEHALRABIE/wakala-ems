import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Building2, Lock } from "lucide-react";

// Local development access code (same as server default)
const LOCAL_ACCESS_CODE = "BAREQ2030";

export default function Login() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  
  const verifyCode = trpc.auth.verifyAccessCode.useMutation({
    onSuccess: (data) => {
      if (data.valid) {
        localStorage.setItem("wakala_access", "granted");
        toast.success("تم تسجيل الدخول بنجاح");
        setLocation("/dashboard");
      } else {
        toast.error("كود الدخول غير صحيح");
      }
      setIsLoading(false);
    },
    onError: () => {
      // Fallback to local verification if server is unavailable
      if (code.trim() === LOCAL_ACCESS_CODE) {
        localStorage.setItem("wakala_access", "granted");
        toast.success("تم تسجيل الدخول بنجاح (محلي)");
        setLocation("/dashboard");
      } else {
        toast.error("كود الدخول غير صحيح");
      }
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("الرجاء إدخال كود الدخول");
      return;
    }
    
    setIsLoading(true);
    
    // Try local verification first for faster response
    if (code.trim() === LOCAL_ACCESS_CODE) {
      localStorage.setItem("wakala_access", "granted");
      toast.success("تم تسجيل الدخول بنجاح");
      setLocation("/dashboard");
      return;
    }
    
    // Otherwise, verify with server
    verifyCode.mutate({ code: code.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">نظام وكالة EMS</CardTitle>
          <CardDescription className="text-base">
            نظام إدارة التعويضات العقارية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                كود الدخول
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="أدخل كود الدخول"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pr-10 text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isLoading || verifyCode.isPending}
            >
              {(isLoading || verifyCode.isPending) ? "جاري التحقق..." : "دخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
