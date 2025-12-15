import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={true}
      richColors
      closeButton
      duration={4000}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          closeButton: "group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-foreground",
          success: "group-[.toaster]:border-green-200 group-[.toaster]:bg-green-50 dark:group-[.toaster]:border-green-800 dark:group-[.toaster]:bg-green-950/50",
          error: "group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50 dark:group-[.toaster]:border-red-800 dark:group-[.toaster]:bg-red-950/50",
          warning: "group-[.toaster]:border-amber-200 group-[.toaster]:bg-amber-50 dark:group-[.toaster]:border-amber-800 dark:group-[.toaster]:bg-amber-950/50",
          info: "group-[.toaster]:border-blue-200 group-[.toaster]:bg-blue-50 dark:group-[.toaster]:border-blue-800 dark:group-[.toaster]:bg-blue-950/50",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
