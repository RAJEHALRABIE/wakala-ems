import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  LogOut,
  Building2,
  X,
  FileText,
  BarChart3,
  TrendingUp,
  MapPin,
  AppWindow,
  Home,
  FolderOpen,
  UserCircle,
  Trash2,
  KeyRound
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PasswordChangeDialog } from "./settings/PasswordChangeDialog";

// Bottom navigation items (5 main items)
const bottomNavItems = [
  { icon: Home, label: "الرئيسية", path: "/dashboard" },
  { icon: Users, label: "العملاء", path: "/clients" },
  { icon: FileText, label: "التقارير", path: "/reports" },
  { icon: BarChart3, label: "إحصائيات", path: "/statistics" },
  { icon: MapPin, label: "الخارطة", path: "/map" },
];

// Slide menu items (all items including RSA Apps)
const menuItems = [
  { icon: Home, label: "الرئيسية", path: "/dashboard" },
  { icon: Users, label: "العملاء", path: "/clients" },
  { icon: FileText, label: "التقارير", path: "/reports" },
  { icon: BarChart3, label: "الإحصائيات", path: "/statistics" },
  { icon: TrendingUp, label: "تحليلات GA4", path: "/analytics" },
  { icon: MapPin, label: "الخارطة", path: "/map" },
  { icon: Settings, label: "الإعدادات", path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const { data: user } = trpc.systemUsers.me.useQuery();
  const logoutMutation = trpc.systemUsers.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/login";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location === "/dashboard" || location === "/";
    if (path === "/clients") return location.startsWith("/clients");
    return location === path;
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-2">
      {menuItems.map((item) => {
        const active = isActive(item.path);
        // Only admin can see settings
        if (item.path === "/settings" && user?.role !== 'admin') return null;

        return (
          <Link key={item.path} href={item.path}>
            <button
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          </Link>
        );
      })}
      
      <Separator className="my-2" />
      
      {/* Archive Section */}
      <Link href="/archive">
        <button
          onClick={() => setMobileOpen(false)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location === "/archive"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent text-foreground"
          }`}
        >
          <FolderOpen className="h-5 w-5" />
          الأرشيف
        </button>
      </Link>

      {user?.role === 'admin' && (
        <Link href="/clients/trash">
          <button
            onClick={() => setMobileOpen(false)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location === "/clients/trash"
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent text-foreground"
            }`}
          >
            <Trash2 className="h-5 w-5" />
            سلة المحذوفات
          </button>
        </Link>
      )}
      
      <Separator className="my-2" />

      <button
        onClick={() => {
          setMobileOpen(false);
          setPasswordDialogOpen(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent text-foreground transition-colors"
      >
        <KeyRound className="h-5 w-5" />
        تغيير كلمة المرور
      </button>
      
      <button
        onClick={() => {
          setMobileOpen(false);
          setLogoutDialogOpen(true);
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        تسجيل الخروج
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-64 lg:flex-col border-l bg-card">
        <div className="flex h-16 items-center gap-2 px-4 border-b">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-lg">وكالة EMS</h1>
            <p className="text-xs text-muted-foreground">إدارة التعويضات</p>
          </div>
        </div>
        
        {/* User Profile Info */}
        {user && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-full border">
                <UserCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {user.role === 'admin' ? 'مدير النظام' : user.role === 'agent' ? 'وكيل معتمد' : 'مشاهد فقط'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto py-4">
          <NavContent />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-card px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
            <div className="flex h-14 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold">وكالة EMS</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile User Info */}
            {user && (
              <div className="p-4 border-b bg-muted/30 flex items-center gap-3">
                <UserCircle className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
            )}

            <NavContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold">وكالة EMS</span>
        </div>
        <div className="mr-auto">
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pr-64">
        <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t">
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Password Change Dialog */}
      <PasswordChangeDialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
        mode="self" 
      />

      {/* Logout Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تسجيل الخروج؟ سيتم إغلاق الجلسة الحالية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              خروج
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}