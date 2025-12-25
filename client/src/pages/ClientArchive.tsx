import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Image as ImageIcon,
  File,
  Trash2,
  Download,
  FolderOpen,
  Search,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  User
} from "lucide-react";
import { toast } from "sonner";
import { getDocumentLabel } from "@shared/document-system";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Helper to get current system user from localStorage
function getCurrentSystemUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('system_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// File icon based on type
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.includes("pdf")) return FileText;
  return File;
}

// Format file size
function formatFileSize(bytes: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Format date in YYYY/MM/DD HH:mm format
function formatDateTime(date: Date | string): string {
  try {
    const d = new Date(date);
    // Check if date is valid (not 1970-01-01)
    if (d.getFullYear() < 2000) {
      return "-";
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  } catch {
    return "-";
  }
}

export default function ClientArchive() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);

  // Fetch clients
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();

  // Fetch client documents using the new system
  const utils = trpc.useUtils();
  const { data: documentTypes, isLoading: loadingDocumentTypes } = trpc.clientDocuments.getDocumentTypes.useQuery();
  const { data: clientDocuments, isLoading: loadingDocs, refetch: refetchClientDocs } = trpc.clientDocuments.getByClientId.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  // Fetch stats for the selected client (to sync with documents tab)
  const { data: stats, refetch: refetchStats } = trpc.clientDocuments.getDocumentStats.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  // Mutation for deleting documents permanently - using deleteDocument (permanent delete)
  const deleteMutation = trpc.clientDocuments.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستند نهائياً");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);

      // Invalidate queries to sync with documents tab
      utils.clientDocuments.getByClientId.invalidate({ clientId: selectedClientId! });
      utils.clientDocuments.getDocumentStats.invalidate({ clientId: selectedClientId! });
      refetchClientDocs();
      refetchStats();
    },
    onError: (error) => {
      toast.error(`فشل حذف المستند: ${error.message}`);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
  });

  // Filter clients by search
  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery) ||
    client.refCode?.includes(searchQuery)
  );

  const selectedClient = clients?.find(c => c.id === selectedClientId);

  // Handle delete
  const handleDelete = (documentId: number) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const systemUser = getCurrentSystemUser();
      const systemUserId = systemUser?.id;

      // Pass systemUserId if available for audit trail
      await deleteMutation.mutateAsync({
        id: documentToDelete,
        systemUserId
      });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Reset when client changes
  useEffect(() => {
    // Reset any states if needed
  }, [selectedClientId]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">أرشيف المستندات</h1>
          <p className="text-muted-foreground mt-1">عرض وإدارة مستندات جميع العملاء - الحذف النهائي فقط</p>
        </div>
        {selectedClient && (
          <Badge variant="outline" className="text-base px-4 py-2">
            <FolderOpen className="h-4 w-4 ml-2" />
            {selectedClient.name}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">اختر العميل</CardTitle>
            <CardDescription>حدد عميلاً لعرض مستنداته</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الهاتف أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingClients ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : filteredClients?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا يوجد عملاء
                </p>
              ) : (
                filteredClients?.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClientId === client.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{client.phone || "-"}</span>
                      {client.refCode && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">
                            {client.refCode}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">المستندات</CardTitle>
                <CardDescription>
                  {selectedClient
                    ? `مستندات ${selectedClient.name} - ${stats?.uploaded || 0} من ${stats?.total || 0} مرفوع (${stats?.completionPercentage || 0}%)`
                    : "اختر عميلاً لعرض مستنداته"}
                </CardDescription>
              </div>
              {selectedClientId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchClientDocs();
                    refetchStats();
                  }}
                >
                  <RefreshCw className="h-4 w-4 ml-2" />
                  تحديث
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedClientId ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>اختر عميلاً من القائمة لعرض مستنداته</p>
                <p className="text-sm mt-2">يمكنك البحث بالاسم، الهاتف، أو الكود المرجعي</p>
              </div>
            ) : loadingDocumentTypes || loadingDocs ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 ml-2" />
                    <div>
                      <h4 className="font-medium text-blue-900">معلومات حول الأرشيف</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        هذه الصفحة مخصصة لعرض المستندات فقط. لرفع مستندات جديدة، يرجى استخدام تبويب "المستندات" داخل ملف العميل.
                        يمكنك هنا معاينة المستندات، تحميلها، أو حذفها نهائياً.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">الملفات المرفوعة</h3>
                    {clientDocuments && clientDocuments.length > 0 && (
                      <Badge variant="outline">
                        {clientDocuments.filter(doc => doc.fileUrl).length} ملف مرفوع
                      </Badge>
                    )}
                  </div>

                  {clientDocuments?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>لا توجد مستندات لهذا العميل</p>
                      <p className="text-sm mt-1">استخدم تبويب "المستندات" داخل ملف العميل لرفع المستندات</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientDocuments?.map((doc) => {
                        const FileIcon = getFileIcon(doc.mimeType);
                        const isUploaded = !!doc.fileUrl;
                        const uploadDate = doc.uploadedAt || doc.createdAt;

                        return (
                          <div
                            key={doc.id}
                            className="border rounded-lg overflow-hidden hover:shadow-md transition-all"
                          >
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-l from-primary/5 to-transparent">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <FileIcon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold text-base truncate block">
                                    {doc.label || getDocumentLabel(doc.documentTypeId)}
                                  </span>
                                </div>
                                <Badge variant={isUploaded ? "default" : "secondary"}>
                                  {isUploaded ? "مرفوع" : "غير مرفوع"}
                                </Badge>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="px-4 py-3 bg-muted/30 text-sm space-y-2">
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {doc.fileSize && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <span className="font-medium">الحجم:</span>
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3 ml-1" />
                                  <span>{formatDateTime(uploadDate)}</span>
                                </div>
                              </div>
                              
                              {doc.description && (
                                <div className="text-muted-foreground pt-1 border-t">
                                  <span className="font-medium ml-1">الوصف:</span>
                                  <span className="text-xs">{doc.description}</span>
                                </div>
                              )}
                              
                              {doc.uploadedByUser && (
                                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                  <User className="h-3 w-3 ml-1" />
                                  <span>رفع بواسطة: {doc.uploadedByUser.name || "مستخدم"}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="p-3 bg-background border-t flex items-center justify-center gap-2">
                              {doc.fileUrl ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(`http://localhost:3000/api/client-documents/${doc.id}/preview`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    معاينة
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(`http://localhost:3000/api/client-documents/${doc.id}/download`, '_blank')}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    تحميل
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleDelete(doc.id)}
                                    disabled={deleteMutation.isPending}
                                  >
                                    {deleteMutation.isPending && documentToDelete === doc.id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-1" />
                                    )}
                                    حذف
                                  </Button>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground py-2">
                                  في انتظار الرفع
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف النهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المستند نهائياً؟
              <br />
              <span className="font-semibold">هذا الإجراء لا يمكن التراجع عنه.</span>
              <br />
              المستند سيتم حذفه من التخزين ومن قاعدة البيانات، وسيختفي من تبويب المستندات للأرشيف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف نهائي"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
