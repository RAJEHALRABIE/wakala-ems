import { FC, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ClientDocumentsTabProps {
  clientId: string;
}

export const ClientDocumentsTab: FC<ClientDocumentsTabProps> = ({ clientId }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: client } = trpc.clients.getById.useQuery({ id: parseInt(clientId) });
  const { data: requiredDocs = [] } = trpc.clientDocuments.getDocumentTypes.useQuery();
  const { data: clientDocs = [], refetch } = trpc.clientDocuments.getByClientId.useQuery({ clientId: parseInt(clientId) });

  const uploadMutation = trpc.clientDocuments.upload.useMutation({
    onSuccess: () => {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      refetch();
      toast.success('تم رفع المستند بنجاح', {
        description: 'تم حفظ المستند في قاعدة البيانات بنجاح',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast.error('خطأ في رفع المستند', {
        description: error.message,
        duration: 5000,
      });
    },
  });

  const handleUpload = (documentTypeId: string) => {
    setSelectedDocType(documentTypeId);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (!base64) {
        toast.error('خطأ في قراءة الملف', {
          description: 'تعذر قراءة ملف المستند المحدد',
          duration: 3000,
        });
        return;
      }
      
      uploadMutation.mutate({
        clientId: parseInt(clientId),
        documentTypeId: selectedDocType,
        file: {
          name: selectedFile.name,
          data: base64,
          type: selectedFile.type,
          size: selectedFile.size,
        },
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const selectedDoc = requiredDocs.find(d => d.id === selectedDocType);

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            مستندات العميل
          </CardTitle>
          <CardDescription>
            نوع الملكية: {client?.propertyDocType || "Deed"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requiredDocs.map((doc) => {
              const uploaded = clientDocs.find(d => d.documentTypeId === doc.id);
              
              return (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {uploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                    <span className={uploaded ? "text-green-700 font-medium" : ""}>
                      {doc.label}
                    </span>
                  </div>
                  
{uploaded ? (
  <div className="flex gap-2">
    <Button variant="ghost" size="sm" onClick={() => window.open(`http://localhost:3000/api/client-documents/${uploaded.id}/preview`, '_blank')}>
      عرض
    </Button>
    <Button variant="ghost" size="sm" onClick={() => window.open(`http://localhost:3000/api/client-documents/${uploaded.id}/download`, '_blank')}>
      تحميل
    </Button>
  </div>
) : (
  <Button variant="outline" size="sm" onClick={() => handleUpload(doc.id)}>                      <Upload className="h-4 w-4 ml-2" />
                      رفع
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفع مستند: {selectedDoc?.label}</DialogTitle>
            <DialogDescription>اختر الملف المطلوب للرفع</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <input type="file" onChange={handleFileSelect} className="w-full" accept=".pdf,.jpg,.jpeg,.png" />
            
            {selectedFile && (
              <p className="text-sm text-gray-600">الملف المختار: {selectedFile.name}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSubmit} disabled={!selectedFile || uploadMutation.isPending}>
                {uploadMutation.isPending ? 'جاري الرفع...' : 'رفع'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDocumentsTab;
