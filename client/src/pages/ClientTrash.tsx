import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCcw, Trash2, Loader2, Undo2, User, Smartphone } from "lucide-react";
import { DateDisplay } from "@/components/DateDisplay";

export default function ClientTrash() {
  const utils = trpc.useUtils();
  const { data: deletedClients, isLoading } = trpc.clients.listDeleted.useQuery();

  const restoreMutation = trpc.clients.restore.useMutation({
    onSuccess: () => {
      toast.success("تم استعادة العميل بنجاح");
      utils.clients.listDeleted.invalidate();
      utils.clients.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const permanentDeleteMutation = trpc.clients.permanentDelete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العميل نهائياً");
      utils.clients.listDeleted.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">سلة المحذوفات</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">العملاء المحذوفون</CardTitle>
          <CardDescription className="text-right">يمكنك استعادة العملاء أو حذفهم نهائياً من هنا.</CardDescription>
        </CardHeader>
        <CardContent>
          {!deletedClients || !Array.isArray(deletedClients) || deletedClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">السلة فارغة</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">الهاتف</TableHead>
                  <TableHead className="text-right">حُذف بواسطة</TableHead>
                  <TableHead className="text-right">تاريخ الحذف</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedClients.map((client: any) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-bold">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        <span dir="ltr" className="text-sm">{client.phone || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                        <User className="h-3 w-3" />
                        {client.deletedByUser?.name || "نظام"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DateDisplay date={client.deletedAt} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-start">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => restoreMutation.mutate({ id: client.id })}
                          disabled={restoreMutation.isLoading}
                        >
                          <Undo2 className="h-4 w-4" />
                          استعادة
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.")) {
                              permanentDeleteMutation.mutate({ id: client.id });
                            }
                          }}
                          disabled={permanentDeleteMutation.isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف نهائي
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}