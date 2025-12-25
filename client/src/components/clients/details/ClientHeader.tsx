import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ArrowRight, Edit, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, getStatusBadgeClasses } from "@shared/statuses";

interface ClientHeaderProps {
  client: any;
  agencyStatusInfo: any;
  masterKey: string;
  setMasterKey: (val: string) => void;
  onDelete: () => void;
  setLocation: (path: string) => void;
}

export default function ClientHeader({ client, agencyStatusInfo, masterKey, setMasterKey, onDelete, setLocation }: ClientHeaderProps) {
  const copyRefCode = () => {
    if (client?.refCode) {
      navigator.clipboard.writeText(client.refCode);
      toast.success("تم نسخ الرمز المرجعي");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div className="text-right">
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1 justify-end flex-wrap">
            <Badge className={getStatusBadgeClasses(client.status)}>
              {STATUS_LABELS[client.status]}
            </Badge>
            {agencyStatusInfo.status !== 'unknown' && (
              <Badge className={agencyStatusInfo.statusColor}>
                {agencyStatusInfo.statusLabel}
              </Badge>
            )}
            {client.refCode && (
              <button onClick={copyRefCode} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <span className="font-mono">{client.refCode}</span>
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/clients/${client.id}/edit`}>
          <Button variant="outline">
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="ml-2 h-4 w-4" />
              حذف
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="text-right">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذا العميل؟ هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <label className="text-sm">أدخل المفتاح الرئيسي للتأكيد:</label>
              <Input type="password" value={masterKey} onChange={(e) => setMasterKey(e.target.value)} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}