import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

interface WebAuthnButtonProps {
  userId?: number;
  username?: string;
  onSuccess?: (token: string, user: any) => void;
  variant?: "register" | "login";
  className?: string;
}

export default function WebAuthnButton({
  userId,
  username,
  onSuccess,
  variant = "login",
  className = "",
}: WebAuthnButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const checkSupportMutation = trpc.webauthn.checkSupport.useQuery();
  const registrationStartMutation = trpc.webauthn.registrationStart.useMutation();
  const registrationFinishMutation = trpc.webauthn.registrationFinish.useMutation();
  const authenticationStartMutation = trpc.webauthn.authenticationStart.useMutation();
  const authenticationFinishMutation = trpc.webauthn.authenticationFinish.useMutation();

  const isSupported = checkSupportMutation.data?.supported || false;
  const isPlatformAuthenticator = checkSupportMutation.data?.platformAuthenticator || false;

  const handleRegister = async () => {
    if (!userId) {
      toast.error("يجب تسجيل الدخول أولاً لتسجيل بصمة جديدة");
      return;
    }

    setIsLoading(true);
    setStatus("idle");

    try {
      // بدء عملية التسجيل
      const startResult = await registrationStartMutation.mutateAsync({ userId });
      const { options, challengeId } = startResult;

      // طلب من المتصفح إنشاء بيانات اعتماد جديدة
      const attestationResponse = await startRegistration(options);

      // إرسال الاستجابة للتحقق
      const finishResult = await registrationFinishMutation.mutateAsync({
        userId,
        challengeId,
        credential: attestationResponse,
      });

      setStatus("success");
      toast.success("تم تسجيل البصمة بنجاح! يمكنك الآن استخدامها لتسجيل الدخول.");
    } catch (error: any) {
      console.error("[WebAuthn] Registration failed:", error);
      setStatus("error");
      
      if (error.message?.includes("User cancelled")) {
        toast.error("تم إلغاء العملية من قبل المستخدم");
      } else if (error.message?.includes("NotSupportedError")) {
        toast.error("المتصفح أو الجهاز لا يدعم المصادقة الحيوية");
      } else {
        toast.error("فشل تسجيل البصمة: " + (error.message || "حدث خطأ غير معروف"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setStatus("idle");

    try {
      // بدء عملية المصادقة
      const startResult = await authenticationStartMutation.mutateAsync({
        username,
      });
      const { options, challengeId } = startResult;

      // طلب من المتصفح استخدام بيانات الاعتماد
      const assertionResponse = await startAuthentication(options);

      // إرسال الاستجابة للتحقق
      const finishResult = await authenticationFinishMutation.mutateAsync({
        challengeId,
        credential: assertionResponse,
      });

      setStatus("success");
      
      // إرسال النتيجة للدالة الأصلية
      if (onSuccess && finishResult.token && finishResult.user) {
        onSuccess(finishResult.token, finishResult.user);
      }

      toast.success("تم تسجيل الدخول بالبصمة بنجاح!");
    } catch (error: any) {
      console.error("[WebAuthn] Authentication failed:", error);
      setStatus("error");
      
      if (error.message?.includes("NotAllowedError")) {
        toast.error("تم رفض المصادقة. حاول مرة أخرى أو استخدم كلمة المرور");
      } else if (error.message?.includes("NotSupportedError")) {
        toast.error("المتصفح أو الجهاز لا يدعم المصادقة الحيوية");
      } else if (error.message?.includes("Invalid credential")) {
        toast.error("بيانات الاعتماد غير صالحة. حاول تسجيل بصمة جديدة");
      } else {
        toast.error("فشل تسجيل الدخول: " + (error.message || "حدث خطأ غير معروف"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (variant === "register") {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const getButtonText = () => {
    if (isLoading) {
      return variant === "register" ? "جاري تسجيل البصمة..." : "جاري التحقق...";
    }

    if (status === "success") {
      return variant === "register" ? "تم التسجيل ✓" : "تم الدخول ✓";
    }

    if (status === "error") {
      return variant === "register" ? "فشل التسجيل ✗" : "فشل الدخول ✗";
    }

    return variant === "register" 
      ? "تسجيل بصمة جديدة" 
      : "الدخول بالبصمة";
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (status === "success") {
      return <CheckCircle className="h-4 w-4" />;
    }

    if (status === "error") {
      return <XCircle className="h-4 w-4" />;
    }

    return <Fingerprint className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (status === "success") return "default";
    if (status === "error") return "destructive";
    return "outline";
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground text-center p-2">
        المتصفح لا يدعم الدخول بالبصمة. حاول استخدام Chrome, Edge, أو Safari.
      </div>
    );
  }

  if (variant === "register" && !isPlatformAuthenticator) {
    return (
      <div className="text-sm text-muted-foreground text-center p-2">
        الجهاز لا يدعم المصادقة الحيوية (بصمة، Face ID، إلخ).
      </div>
    );
  }

  const isDisabled = isLoading || 
    (variant === "register" && !userId) || 
    (variant === "login" && !username && !isPlatformAuthenticator);

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      variant={getButtonVariant() as any}
      className={`w-full gap-2 ${className}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
}