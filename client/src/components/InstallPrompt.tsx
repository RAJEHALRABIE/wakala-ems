import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

export default function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // التحقق إذا كان التطبيق مثبتاً بالفعل
    const isInStandaloneMode = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isInStandaloneMode());

    // التحقق إذا كان جهاز iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // استمع لحدث beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // إذا كان مثبتاً بالفعل، لا تظهر الـ prompt
    if (isInStandaloneMode()) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!window.deferredPrompt) {
      toast.error("تعذر تثبيت التطبيق. حاول يدوياً.");
      return;
    }

    try {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        toast.success("جاري تثبيت التطبيق...");
        setIsVisible(false);
      } else {
        toast.info("تم إلغاء التثبيت");
      }
      
      window.deferredPrompt = null;
    } catch (error) {
      console.error("[InstallPrompt] Error:", error);
      toast.error("حدث خطأ أثناء التثبيت");
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // حفظ في localStorage لتجنب إظهاره مرة أخرى اليوم
    localStorage.setItem("installPromptDismissed", new Date().toISOString());
  };

  const handleIOSInstructions = () => {
    toast.info(
      <div className="text-right">
        <p className="font-bold mb-2">لتثبيت التطبيق على iOS:</p>
        <ol className="list-decimal pr-4 space-y-1 text-sm">
          <li>اضغط على زر المشاركة <span className="inline-block mx-1">⎋</span></li>
          <li>اختر "أضف إلى الشاشة الرئيسية"</li>
          <li>اضغط على "إضافة"</li>
        </ol>
      </div>,
      { duration: 10000 }
    );
    setIsVisible(false);
  };

  if (!isVisible || isStandalone) {
    return null;
  }

  // إذا كان المستخدم قد رفض مؤخراً (خلال 24 ساعة)، لا تظهر
  const lastDismissed = localStorage.getItem("installPromptDismissed");
  if (lastDismissed) {
    const dismissedDate = new Date(lastDismissed);
    const hoursSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceDismiss < 24) {
      return null;
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">تثبيت التطبيق</h3>
              <p className="text-sm text-slate-600">
                قم بتثبيت التطبيق لتجربة أسرع ووصول أسهل
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {isIOS ? (
            <Button
              onClick={handleIOSInstructions}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              عرض تعليمات التثبيت (iOS)
            </Button>
          ) : (
            <Button
              onClick={handleInstallClick}
              className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              تثبيت التطبيق
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleDismiss}
            className="w-full text-slate-600"
          >
            لاحقاً
          </Button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="flex-1">
              <span className="font-medium">المزايا:</span>
              <ul className="list-disc pr-4 mt-1 space-y-1">
                <li>تشغيل أسرع بدون متصفح</li>
                <li>إشعارات فورية</li>
                <li>عمل دون اتصال جزئي</li>
                <li>وصول سريع من الشاشة الرئيسية</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}