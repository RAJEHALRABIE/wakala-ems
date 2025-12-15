import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Calculator, 
  FileText, 
  MessageCircle, 
  Users, 
  BarChart3,
  Globe,
  Smartphone,
  ExternalLink,
  Star
} from "lucide-react";

const apps = [
  {
    id: 1,
    name: "نظام إدارة التعويضات",
    description: "إدارة شاملة لملفات التعويضات العقارية ومتابعة حالاتها",
    icon: Building2,
    color: "bg-blue-500",
    status: "active",
    url: "/dashboard",
    internal: true,
  },
  {
    id: 2,
    name: "حاسبة التعويضات",
    description: "احسب التعويض المتوقع بناءً على المساحة وسعر المتر",
    icon: Calculator,
    color: "bg-green-500",
    status: "active",
    url: "#calculator",
    internal: true,
  },
  {
    id: 3,
    name: "مولد العقود",
    description: "إنشاء عقود الوكالة والتفويض بشكل آلي",
    icon: FileText,
    color: "bg-purple-500",
    status: "coming",
    url: "#",
    internal: true,
  },
  {
    id: 4,
    name: "رسائل واتساب",
    description: "إرسال رسائل واتساب جماعية للعملاء",
    icon: MessageCircle,
    color: "bg-emerald-500",
    status: "active",
    url: "/settings",
    internal: true,
  },
  {
    id: 5,
    name: "إدارة الوكلاء",
    description: "إضافة وتعديل بيانات الوكلاء المعتمدين",
    icon: Users,
    color: "bg-orange-500",
    status: "active",
    url: "/settings",
    internal: true,
  },
  {
    id: 6,
    name: "التقارير والإحصائيات",
    description: "تقارير مفصلة وإحصائيات عن الملفات والتعويضات",
    icon: BarChart3,
    color: "bg-cyan-500",
    status: "active",
    url: "/statistics",
    internal: true,
  },
  {
    id: 7,
    name: "الموقع الإلكتروني",
    description: "موقع RSA الرسمي للخدمات العقارية",
    icon: Globe,
    color: "bg-indigo-500",
    status: "external",
    url: "https://rsa.sa",
    internal: false,
  },
  {
    id: 8,
    name: "تطبيق الجوال",
    description: "تطبيق RSA للهواتف الذكية (قريباً)",
    icon: Smartphone,
    color: "bg-pink-500",
    status: "coming",
    url: "#",
    internal: false,
  },
];

export default function Archive() {
  const handleAppClick = (app: typeof apps[0]) => {
    if (app.status === "coming") {
      return;
    }
    if (app.internal) {
      window.location.href = app.url;
    } else {
      window.open(app.url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الأرشيف</h1>
          <p className="text-muted-foreground mt-1">جميع التطبيقات والخدمات المتاحة</p>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">{apps.filter(a => a.status === "active").length} تطبيق متاح</span>
        </div>
      </div>

      {/* Active Apps */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          التطبيقات المتاحة
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.filter(app => app.status === "active" || app.status === "external").map((app) => (
            <Card 
              key={app.id} 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
              onClick={() => handleAppClick(app)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center`}>
                    <app.icon className="h-6 w-6 text-white" />
                  </div>
                  {app.status === "external" && (
                    <Badge variant="outline" className="text-xs">
                      <ExternalLink className="h-3 w-3 ml-1" />
                      خارجي
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{app.name}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {app.status === "external" ? "زيارة الموقع" : "فتح التطبيق"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          قريباً
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.filter(app => app.status === "coming").map((app) => (
            <Card key={app.id} className="opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center opacity-50`}>
                    <app.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">قريباً</Badge>
                </div>
                <CardTitle className="text-lg mt-3">{app.name}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  قريباً
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">RSA للخدمات العقارية</h3>
              <p className="text-sm text-muted-foreground">
                نقدم خدمات متكاملة في مجال التعويضات العقارية ومتابعة الملفات لدى الجهات الحكومية.
                تواصل معنا للمزيد من المعلومات.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
