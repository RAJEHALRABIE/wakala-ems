import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { 
  Plus, Search, Eye, Edit, Phone, MapPin, FileText, 
  User, Banknote, LayoutGrid, 
  List, Filter, TrendingUp, Users, Clock, CheckCircle2,
  Sparkles, Hash, Ruler,
  ExternalLink, Copy,
  AlertCircle, FileCheck, Wallet, CircleDollarSign,
  RefreshCw, Zap, Smartphone, MessageSquare
} from "lucide-react";
import { CLIENT_STATUSES, STATUS_LABELS, getStatusBadgeClasses, ClientStatus } from "@shared/statuses";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { toast } from "sonner";

// أيقونات الحالات
const STATUS_ICONS: Record<string, React.ReactNode> = {
  New: <Sparkles className="h-3.5 w-3.5" />,
  WakalahRegistration: <FileText className="h-3.5 w-3.5" />,
  FilePreparation: <FileText className="h-3.5 w-3.5" />,
  FileSubmitted: <FileCheck className="h-3.5 w-3.5" />,
  Processing: <RefreshCw className="h-3.5 w-3.5" />,
  Valuation: <TrendingUp className="h-3.5 w-3.5" />,
  UnderReview: <Clock className="h-3.5 w-3.5" />,
  ObjectionSubmitted: <AlertCircle className="h-3.5 w-3.5" />,
  Objection: <AlertCircle className="h-3.5 w-3.5" />,
  PaymentPending: <Wallet className="h-3.5 w-3.5" />,
  CheckIssued: <CircleDollarSign className="h-3.5 w-3.5" />,
  Completed: <CheckCircle2 className="h-3.5 w-3.5" />,
};

// ألوان gradient للحالات
const STATUS_GRADIENTS: Record<string, string> = {
  New: "from-blue-400 to-blue-500",
  WakalahRegistration: "from-cyan-400 to-cyan-500",
  FilePreparation: "from-teal-400 to-teal-500",
  FileSubmitted: "from-yellow-400 to-yellow-500",
  Processing: "from-amber-400 to-amber-500",
  Valuation: "from-orange-400 to-orange-500",
  UnderReview: "from-lime-400 to-lime-500",
  ObjectionSubmitted: "from-red-500 to-rose-600",
  Objection: "from-red-500 to-rose-600",
  PaymentPending: "from-emerald-400 to-emerald-500",
  CheckIssued: "from-green-500 to-green-600",
  Completed: "from-green-600 to-green-700",
};

// ألوان الخلفية للحالات
const STATUS_BG_COLORS: Record<string, string> = {
  New: "bg-blue-50 dark:bg-blue-950/30",
  WakalahRegistration: "bg-cyan-50 dark:bg-cyan-950/30",
  FilePreparation: "bg-teal-50 dark:bg-teal-950/30",
  FileSubmitted: "bg-yellow-50 dark:bg-yellow-950/30",
  Processing: "bg-amber-50 dark:bg-amber-950/30",
  Valuation: "bg-orange-50 dark:bg-orange-950/30",
  UnderReview: "bg-lime-50 dark:bg-lime-950/30",
  ObjectionSubmitted: "bg-red-50 dark:bg-red-950/30",
  Objection: "bg-red-50 dark:bg-red-950/30",
  PaymentPending: "bg-emerald-50 dark:bg-emerald-950/30",
  CheckIssued: "bg-green-50 dark:bg-green-950/30",
  Completed: "bg-green-50 dark:bg-green-950/30",
};

// نوع العقار
const DOC_TYPE_LABELS: Record<string, string> = {
  Deed: "صك",
  Ihkam: "إحكام",
  Revivals: "إحياءات",
  Other: "أخرى",
};

const DOC_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  Deed: { icon: "📜", color: "text-amber-600" },
  Ihkam: { icon: "⚖️", color: "text-purple-600" },
  Revivals: { icon: "🌱", color: "text-green-600" },
  Other: { icon: "📄", color: "text-gray-600" },
};

const LIST_ITEM_STATUS_ICONS: Record<string, React.ReactNode> = {
  New: <Sparkles className="h-6 w-6" />,
  WakalahRegistration: <FileText className="h-6 w-6" />,
  FilePreparation: <FileText className="h-6 w-6" />,
  FileSubmitted: <FileCheck className="h-6 w-6" />,
  Processing: <RefreshCw className="h-6 w-6" />,
  Valuation: <TrendingUp className="h-6 w-6" />,
  UnderReview: <Clock className="h-6 w-6" />,
  ObjectionSubmitted: <AlertCircle className="h-6 w-6" />,
  Objection: <AlertCircle className="h-6 w-6" />,
  PaymentPending: <Wallet className="h-6 w-6" />,
  CheckIssued: <CircleDollarSign className="h-6 w-6" />,
  Completed: <CheckCircle2 className="h-6 w-6" />,
};

const STATUS_ICON_COLORS: Record<string, string> = {
  New: "text-blue-500",
  WakalahRegistration: "text-cyan-500",
  FilePreparation: "text-teal-500",
  FileSubmitted: "text-yellow-500",
  Processing: "text-amber-500",
  Valuation: "text-orange-500",
  UnderReview: "text-lime-500",
  ObjectionSubmitted: "text-red-500",
  Objection: "text-red-500",
  PaymentPending: "text-emerald-500",
  CheckIssued: "text-green-500",
  Completed: "text-green-600",
};

export default function ClientList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
  const { sounds } = useSoundEffects();
  
  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  const { data: searchResults } = trpc.clients.search.useQuery(
    { query: search },
    { enabled: search.length > 2 }
  );

  const displayClients = search.length > 2 ? searchResults : clients;
  const filteredClients = statusFilter === "all" 
    ? displayClients 
    : displayClients?.filter(c => c.status === statusFilter);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    if (!clients) return { total: 0, new: 0, processing: 0, completed: 0, totalArea: 0 };
    return {
      total: clients.length,
      new: clients.filter(c => c.status === "New").length,
      processing: clients.filter(c => ["Processing", "FileSubmitted", "Valuation"].includes(c.status)).length,
      completed: clients.filter(c => c.status === "Completed").length,
      totalArea: clients.reduce((sum, c) => sum + (parseFloat(c.areaSqm || "0")), 0),
    };
  }, [clients]);

  const formatNumber = (num: number | null) => num ? num.toLocaleString("ar-SA") : "-";
  const formatCurrency = (num: number | null) => num ? `${num.toLocaleString("ar-SA")} ريال` : "-";

  // نسخ رقم الهاتف
  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    sounds.success();
    toast.success("تم نسخ رقم الهاتف");
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    if (!phone) return "";
    let cleaned = phone.replace(/[^0-9]/g, ''); // Remove all non-digits
    
    if (cleaned.startsWith('00966')) {
      return cleaned.substring(2); // -> 966...
    }
    if (cleaned.startsWith('966')) {
      return cleaned; // is already correct -> 966...
    }
    if (cleaned.startsWith('05') && cleaned.length === 10) {
      return `966${cleaned.substring(1)}`; // -> 9665...
    }
    if (cleaned.startsWith('5') && cleaned.length === 9) {
      return `966${cleaned}`; // -> 9665...
    }
    
    return cleaned; // Fallback
  };

  // مكون بطاقة العميل المحسنة
  const ClientCard = ({ client, index }: { client: any; index: number }) => {
    const isHovered = hoveredCard === client.id;
    
    return (
      <div 
        className={`
          group relative bg-card rounded-2xl border overflow-hidden
          transition-all duration-500 ease-out
          hover:shadow-2xl hover:shadow-primary/10
          ${isHovered ? 'scale-[1.02] border-primary/50' : 'shadow-sm'}
        `}
        style={{ 
          animationDelay: `${index * 0.05}s`,
          transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        }}
        onMouseEnter={() => {
          setHoveredCard(client.id);
          sounds.hover();
        }}
        onMouseLeave={() => setHoveredCard(null)}
        onClick={() => {
          if (hoveredCard === client.id) {
            setHoveredCard(null);
          }
        }}
      >
        {/* شريط الحالة العلوي مع تأثير متحرك */}
        <div className={`h-1.5 bg-gradient-to-r ${STATUS_GRADIENTS[client.status] || "from-gray-400 to-gray-500"} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
        
        {/* خلفية متدرجة خفيفة */}
        <div className={`absolute inset-0 ${STATUS_BG_COLORS[client.status]} opacity-30 transition-opacity group-hover:opacity-50`} />
        
        <div className="relative p-5">
          {/* رأس البطاقة */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* أيقونة العميل مع الحالة أسفلها */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className={`
                  relative w-16 h-16 rounded-2xl bg-gradient-to-br ${STATUS_GRADIENTS[client.status] || "from-gray-400 to-gray-500"} 
                  flex items-center justify-center text-white shadow-lg
                  transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                  group-hover:shadow-xl
                `}>
                  <User className="h-8 w-8" />
                  {/* نقطة الحالة */}
                  <div className={`
                    absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card
                    flex items-center justify-center bg-white dark:bg-gray-800
                  `}>
                    <span className={`text-xs ${STATUS_ICON_COLORS[client.status] || 'text-gray-500'}`}>{STATUS_ICONS[client.status]}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">{STATUS_LABELS[client.status as keyof typeof STATUS_LABELS]}</span>
              </div>
              
              <div className="flex-1 min-w-0 pt-1">
                <Link href={`/clients/${client.id}`}>
                  <h3 className="font-bold text-lg hover:text-primary transition-colors cursor-pointer line-clamp-1 group-hover:text-primary">
                    {client.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">{client.refCode || "---"}</span>
                </div>
              </div>
            </div>
            

          </div>

          {/* معلومات العميل */}
          <div className="space-y-2.5 mb-4">
            {/* الهاتف */}
            {client.phone && (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-card border">
                  <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center shadow-sm text-white">
                      <Smartphone className="h-5 w-5" />
                  </div>
                  
                  <span className="flex-1 text-sm font-semibold text-muted-foreground" dir="ltr">
                      {client.phone}
                  </span>

                  <div className="flex items-center gap-0.5">
                      <a 
                        href={`https://wa.me/${formatPhoneForWhatsApp(client.phone)}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8 hover:bg-green-50' })}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </a>
                      <a 
                        href={`tel:${client.phone}`} 
                        className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8 hover:bg-blue-50' })}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Call"
                      >
                        <Phone className="h-4 w-4 text-blue-600" />
                      </a>
                  </div>
              </div>
            )}

            {/* الموقع */}
            {(client.city || client.district) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{client.city || client.district}</span>
                {client.mapLink && (
                  <a 
                    href={client.mapLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mr-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.click();
                    }}
                  >
                    <ExternalLink className="h-4 w-4 text-blue-500 hover:text-blue-700 transition-colors" />
                  </a>
                )}
              </div>
            )}

            {/* نوع العقار والمساحة */}
            <div className="flex gap-2">
              {client.propertyDocType && (
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <span className="text-xl">{DOC_TYPE_ICONS[client.propertyDocType]?.icon || "📄"}</span>
                  <span className="text-sm font-medium">{DOC_TYPE_LABELS[client.propertyDocType] || client.propertyDocType}</span>
                </div>
              )}
              {client.areaSqm && (
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{formatNumber(client.areaSqm)}</span>
                  <span className="text-xs text-muted-foreground">م²</span>
                </div>
              )}
            </div>

            {/* معلومات إضافية (تظهر عند hover) */}
            <div className={`
              overflow-hidden transition-all duration-500
              ${isHovered ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className="space-y-2 pt-2">
                {client.expectedCompensationPerSqm && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-sm">
                    <Banknote className="h-4 w-4" />
                    <span>التعويض المتوقع: {formatCurrency(client.expectedCompensationPerSqm)}/م²</span>
                  </div>
                )}
                
                {(() => {
                  const financials = calculateFinancials(client);
                  if (client.expropriationType === 'revivals_only' || !financials) return null;

                  return (
                    <>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 text-sm">
                        <Wallet className="h-4 w-4" />
                        <span>إجمالي التعويض المتوقع: {formatCurrency(financials.expectedTotalCompensation)}</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-sm">
                        <CircleDollarSign className="h-4 w-4" />
                        <span>الأتعاب المتوقعة: {formatCurrency(financials.expectedFees)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-2 pt-4 border-t border-border/50">
            <Link href={`/clients/${client.id}`} className="flex-1">
              <Button 
                variant="default" 
                size="sm" 
                className="w-full h-10 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 group/btn"
                onClick={() => sounds.click()}
              >
                <Eye className="h-4 w-4 ml-2 transition-transform group-hover/btn:scale-110" />
                عرض التفاصيل
              </Button>
            </Link>
            <Link href={`/clients/${client.id}/edit`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 rounded-xl p-0 transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                onClick={() => sounds.click()}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/clients/${client.id}/archive`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 rounded-xl p-0 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-900/30"
                onClick={() => sounds.click()}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* تأثير الإضاءة عند hover */}
        <div className={`
          absolute inset-0 pointer-events-none transition-opacity duration-500
          bg-gradient-to-br from-primary/5 via-transparent to-transparent
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `} />
        
        {/* خط متوهج في الأسفل */}
        <div className={`
          absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${STATUS_GRADIENTS[client.status]}
          transition-all duration-500 origin-center
          ${isHovered ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}
        `} />
      </div>
    );
  };

// Helper function to calculate financials
const calculateFinancials = (client: any) => {
  if (!client) return null;

  const totalExpropriatedArea = 
    client.expropriationType === 'total' ? client.areaSqm :
    client.expropriationType === 'partial' ? parseFloat(client.expropriatedArea) :
    0;

  if (totalExpropriatedArea === 0 || !client.expectedCompensationPerSqm) {
    return null;
  }

  // Possession percentage based on property document type
  const possessionPercentageMap: Record<string, number> = {
    Deed: 1.0,     // 100%
    Ihkam: 0.85,    // 85%
    Revivals: 0.70, // 70%
    Other: 0.50,    // 50%
  };
  const possessionPercentage = possessionPercentageMap[client.propertyDocType as string] || 0;

  const expectedTotalCompensation = 
    totalExpropriatedArea * client.expectedCompensationPerSqm * possessionPercentage;

  const feePercentage = client.successFee ? client.successFee / 100 : 0;
  const expectedFees = expectedTotalCompensation * feePercentage;

  return {
    totalExpropriatedArea,
    possessionPercentage,
    expectedTotalCompensation,
    expectedFees,
  };
};

  // مكون صف العميل في العرض القائمة
  const ClientListItem = ({ client, index }: { client: any; index: number }) => {
    const currentStatusIndex = CLIENT_STATUSES.indexOf(client.status);
    
    return (
      <Card 
        className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 group"
        style={{ animationDelay: `${index * 0.03}s` }}
      >
        <CardContent className="p-0">
          {/* New Header with Status Text and Protruding Icon */}
          <div className={`relative p-1 text-center text-white font-semibold text-xs bg-gradient-to-r ${STATUS_GRADIENTS[client.status] || 'from-gray-400 to-gray-500'}`}>
            {STATUS_LABELS[client.status as ClientStatus]}

            {/* Protruding Icon */}
            <div className={`
              absolute right-4 top-1/2 -translate-y-1/2
              w-10 h-10 rounded-xl 
              flex items-center justify-center 
              text-white shadow-lg border-2 border-white/50
              bg-gradient-to-br ${STATUS_GRADIENTS[client.status] || 'from-gray-400 to-gray-500'}
            `}>
              {LIST_ITEM_STATUS_ICONS[client.status] || <User className="h-5 w-5" />}
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="flex w-full h-1.5 bg-gray-200 dark:bg-gray-700">
            {CLIENT_STATUSES.map((status, index) => (
              <TooltipProvider key={status}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex-1 h-full transition-colors"
                      style={{
                        backgroundColor: index <= currentStatusIndex ? '#22c55e' : undefined // green-500
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{STATUS_LABELS[status as ClientStatus]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        
          <div className="px-4 py-2"> 
            <div className="flex items-center gap-x-4 text-sm">
              {/* Name */}
              <Link href={`/clients/${client.id}`} className="flex-1 min-w-0">
                <h3 className="font-semibold text-base hover:text-primary transition-colors cursor-pointer truncate">
                  {client.name}
                </h3>
              </Link>

              {/* Details Section */}
              <div className="flex items-center gap-x-4 flex-shrink-0">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{client.refCode}</span>
                
                {client.phone && (
                  <span className="hidden md:flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {client.phone}
                  </span>
                )}
                
                {(client.city || client.district) && (
                  <span className="hidden lg:flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {client.city || client.district}
                  </span>
                )}

                {client.areaSqm && (
                  <span className="hidden xl:flex font-medium items-center gap-1.5">
                    <Ruler className="h-3 w-3" />
                    {formatNumber(client.areaSqm)} م²
                  </span>
                )}

                {/* Actions */}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/clients/${client.id}`}><Eye className="h-4 w-4" /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/clients/${client.id}/edit`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // مكون Skeleton محسّن
  const CardSkeleton = () => (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse" />
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* العنوان وزر الإضافة */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            العملاء
          </h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع جميع العملاء والطلبات</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              sounds.click();
              refetch();
              toast.success("تم تحديث البيانات");
            }}
            className="h-11 w-11 rounded-xl"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Link href="/clients/new">
            <Button 
              size="lg" 
              className="h-11 rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group"
              onClick={() => sounds.click()}
            >
              <Plus className="ml-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              إضافة عميل جديد
              <Zap className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات المحسنة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* إجمالي العملاء */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20 group hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.total}</p>
                <p className="text-sm text-white/80">إجمالي العملاء</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </Card>

        {/* عملاء جدد */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-500/20 group hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.new}</p>
                <p className="text-sm text-white/80">عملاء جدد</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </Card>

        {/* قيد المعالجة */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20 group hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.processing}</p>
                <p className="text-sm text-white/80">قيد المعالجة</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </Card>

        {/* مكتمل */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/20 group hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.completed}</p>
                <p className="text-sm text-white/80">مكتمل</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </Card>
      </div>

      {/* شريط البحث والفلترة */}
      <Card className="animate-fade-in-up border-0 shadow-lg" style={{ animationDelay: "0.2s" }}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* البحث */}
            <div className="relative flex-1 group">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="ابحث عن عميل بالاسم، الهاتف، أو الرقم المرجعي..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-12 h-12 text-base rounded-xl border-2 border-transparent focus:border-primary/50 transition-all"
                onFocus={() => sounds.pop()}
              />
              {search && (
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setSearch("");
                    sounds.click();
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* فلتر الحالة */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); sounds.toggle(); }}>
              <SelectTrigger className="w-full sm:w-56 h-12 rounded-xl border-2 border-transparent focus:border-primary/50">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    جميع الحالات
                  </span>
                </SelectItem>
                {CLIENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="rounded-lg">
                    <span className="flex items-center gap-2">
                      {STATUS_ICONS[status]}
                      {STATUS_LABELS[status]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* أزرار العرض */}
            <div className="flex gap-1 p-1.5 bg-muted rounded-xl">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setViewMode("cards"); sounds.toggle(); }}
                className="h-9 rounded-lg"
              >
                <LayoutGrid className="h-4 w-4 ml-1" />
                بطاقات
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setViewMode("list"); sounds.toggle(); }}
                className="h-9 rounded-lg"
              >
                <List className="h-4 w-4 ml-1" />
                قائمة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة العملاء */}
      {isLoading ? (
        <div className={viewMode === "cards" 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" 
          : "space-y-3"
        }>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredClients?.length === 0 ? (
        <Card className="animate-fade-in-scale border-0 shadow-lg">
          <CardContent className="py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-2">لا يوجد عملاء</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {search ? "لم يتم العثور على نتائج مطابقة للبحث. جرب كلمات بحث مختلفة." : "ابدأ بإضافة عميلك الأول لإدارة طلباتك بسهولة"}
            </p>
            <Link href="/clients/new">
              <Button size="lg" className="rounded-xl" onClick={() => sounds.click()}>
                <Plus className="ml-2 h-5 w-5" />
                إضافة عميل جديد
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {filteredClients?.map((client, index) => (
            <ClientCard key={client.id} client={client} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredClients?.map((client, index) => (
            <ClientListItem key={client.id} client={client} index={index} />
          ))}
        </div>
      )}

      {/* عداد النتائج */}
      {filteredClients && filteredClients.length > 0 && (
        <div className="text-center text-sm text-muted-foreground animate-fade-in py-4">
          <span className="px-4 py-2 rounded-full bg-muted/50">
            عرض <span className="font-bold text-foreground">{filteredClients.length}</span> من <span className="font-bold text-foreground">{clients?.length || 0}</span> عميل
          </span>
        </div>
      )}
    </div>
  );
}
