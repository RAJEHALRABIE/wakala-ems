import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Trash2, 
  Download,
  FolderOpen,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from "lucide-react";
import { toast } from "sonner";

// Document type labels in Arabic
const DOC_TYPE_LABELS: Record<string, string> = {
  ownership_deed: "صك الملكية",
  owner_id: "هوية المالك",
  legal_wakalah: "الوكالة الشرعية",
  agent_id: "هوية الوكيل",
  survey_report: "تقرير المساحة",
  heirs_certificate: "صك حصر الورثة",
  other: "أخرى",
};

const DOC_STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  pending: { label: "قيد المراجعة", icon: Clock, color: "text-yellow-500" },
  approved: { label: "معتمد", icon: CheckCircle, color: "text-green-500" },
  rejected: { label: "مرفوض", icon: AlertCircle, color: "text-red-500" },
};

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

export default function ClientArchive() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("other");

  // Fetch clients
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();
  
  // Fetch documents for selected client
  const { data: documents, isLoading: loadingDocs, refetch: refetchDocs } = trpc.documents.listByClient.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );

  // Mutations
  const uploadMutation = trpc.documents.upload.useMutation();
  const createDocMutation = trpc.documents.create.useMutation();
  const deleteDocMutation = trpc.documents.delete.useMutation();

  // Filter clients by search
  const filteredClients = clients?.filter(client => 
    client.name.includes(searchQuery) || 
    client.phone?.includes(searchQuery) ||
    client.refCode?.includes(searchQuery)
  );

  const selectedClient = clients?.find(c => c.id === selectedClientId);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedClientId) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", 
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("نوع الملف غير مدعوم", {
        description: "الأنواع المدعومة: PDF, JPG, PNG, DOCX"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف كبير جداً", {
        description: "الحد الأقصى 10 ميجابايت"
      });
      return;
    }

    setUploadingFile(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Upload to S3
      const { url, fileKey, fileSize } = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileData: base64Data,
        mimeType: file.type,
        clientId: selectedClientId,
      });

      // Create document record
      await createDocMutation.mutateAsync({
        clientId: selectedClientId,
        documentType: selectedDocType as any,
        fileName: file.name,
        fileUrl: url,
        fileKey: fileKey,
        fileSize: fileSize,
        mimeType: file.type,
      });

      toast.success("تم رفع الملف بنجاح");
      refetchDocs();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("فشل رفع الملف");
    } finally {
      setUploadingFile(false);
    }
  }, [selectedClientId, selectedDocType, uploadMutation, createDocMutation, refetchDocs]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // Handle delete
  const handleDelete = async (docId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستند؟")) return;
    
    try {
      await deleteDocMutation.mutateAsync({ id: docId });
      toast.success("تم حذف المستند");
      refetchDocs();
    } catch (error) {
      toast.error("فشل حذف المستند");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">أرشيف المستندات</h1>
          <p className="text-muted-foreground mt-1">إدارة مستندات وملفات العملاء</p>
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
            <CardDescription>حدد عميلاً لعرض وإدارة مستنداته</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو الهاتف..."
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
                          <span>{client.refCode}</span>
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
            <CardTitle className="text-lg">المستندات</CardTitle>
            <CardDescription>
              {selectedClient 
                ? `مستندات ${selectedClient.name}` 
                : "اختر عميلاً لعرض مستنداته"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClientId ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>اختر عميلاً من القائمة لعرض مستنداته</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upload Area */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label>نوع المستند</Label>
                      <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? "border-primary bg-primary/5" 
                        : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      اسحب الملفات هنا أو
                    </p>
                    <label>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={uploadingFile}
                      />
                      <Button variant="outline" disabled={uploadingFile} asChild>
                        <span className="cursor-pointer">
                          {uploadingFile ? "جاري الرفع..." : "اختر ملفاً"}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      PDF, JPG, PNG, DOCX - حتى 10MB
                    </p>
                  </div>
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                  <h3 className="font-medium">الملفات المرفوعة</h3>
                  
                  {loadingDocs ? (
                    Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))
                  ) : documents?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>لا توجد مستندات لهذا العميل</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents?.map((doc) => {
                        const FileIcon = getFileIcon(doc.mimeType);
                        const statusConfig = DOC_STATUS_CONFIG[doc.status];
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <div
                            key={doc.id}
                            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {doc.customName || doc.fileName}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {DOC_TYPE_LABELS[doc.documentType]}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span className={`flex items-center gap-1 ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </span>
                                <span>
                                  {new Date(doc.uploadedAt).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                asChild
                              >
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
    </div>
  );
}
