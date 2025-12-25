import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { storagePut, storageDelete } from "../storage";
import { DOCUMENT_TYPES } from "../../shared/document-system";
import { logger } from "../logger";
import { logDocumentUpload, logDocumentDelete } from "../logging";
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { sdk } from '../_core/sdk';
import { parse as parseCookie } from 'cookie';
// استخدام قيمة مباشرة بدلاً من الاستيراد المعطّل
const COOKIE_NAME = "app_session_id";

/**
 * tRPC Router لإدارة مستندات العملاء
 * يدعم 11 نوع مستند مرتبطة بـ 3 فئات
 */

// Schema للتحقق من صحة المدخلات
const createDocumentSchema = z.object({
  clientId: z.number().positive(),
  documentTypeId: z.string().refine(
    (id) => DOCUMENT_TYPES.some(doc => doc.id === id),
    { message: "نوع المستند غير صالح" }
  ),
  file: z.object({
    name: z.string().min(1, "اسم الملف مطلوب"),
    data: z.string().min(1, "بيانات الملف مطلوبة"), // base64
    type: z.string().min(1, "نوع الملف مطلوب"),
    size: z.number().max(10 * 1024 * 1024, "الحد الأقصى لحجم الملف 10MB"), // 10MB
  }),
  description: z.string().optional(),
  systemUserId: z.number().optional(),
});

const updateDocumentSchema = z.object({
  id: z.number().positive(),
  description: z.string().optional(),
});

const deleteFileSchema = z.object({
  id: z.number().positive(),
  systemUserId: z.number().optional(),
});

export const clientDocumentsRouter = router({
  // ============================================
  // الحصول على أنواع المستندات
  // ============================================
  
  /**
   * الحصول على جميع أنواع المستندات (11 نوعاً)
   */
  getDocumentTypes: publicProcedure.query(() => {
    return DOCUMENT_TYPES;
  }),

  /**
   * الحصول على أنواع المستندات حسب الفئة
   */
  getDocumentTypesByCategory: publicProcedure
    .input(z.object({
      category: z.enum(["common", "title_deed", "ihkaam", "ihyaa"]),
    }))
    .query(({ input }) => {
      return DOCUMENT_TYPES.filter(doc => doc.category === input.category);
    }),

  // ============================================
  // الحصول على مستندات العميل
  // ============================================
  
  /**
   * الحصول على جميع مستندات عميل معين
   */
  getByClientId: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      try {
        logger.info('Fetching client documents', { clientId: input.clientId });
        const documents = await db.getClientDocuments(input.clientId);
        
        // تنسيق البيانات للإرجاع
        return documents.map(doc => ({
          ...doc,
          documentType: DOCUMENT_TYPES.find(dt => dt.id === doc.documentTypeId) || {
            id: doc.documentTypeId,
            label: doc.documentTypeId,
            category: null,
            displayOrder: 0,
            createdAt: new Date(),
          },
        }));
      } catch (error) {
        logger.error('Error fetching client documents', {
          clientId: input.clientId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

  /**
   * الحصول على إحصائيات مستندات العميل
   */
  getDocumentStats: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const documents = await db.getClientDocuments(input.clientId);
      const total = documents.length;
      const uploaded = documents.filter(d => d.fileUrl).length;
      const pending = total - uploaded;
      
      return {
        total,
        uploaded,
        pending,
        completionPercentage: total > 0 ? Math.round((uploaded / total) * 100) : 0,
      };
    }),

  // ============================================
  // رفع وتعديل المستندات
  // ============================================
  
  /**
   * رفع مستند جديد
   */
  upload: publicProcedure
    .input(createDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Uploading document', {
          clientId: input.clientId,
          documentTypeId: input.documentTypeId,
          fileName: input.file.name,
          fileSize: input.file.size,
        });

        // التحقق من حجم الملف
        if (input.file.size > 10 * 1024 * 1024) {
          throw new Error("حجم الملف يتجاوز الحد المسموح به (10MB)");
        }

        // منع تكرار نوع المستند (ما عدا "other")
        if (input.documentTypeId !== 'other') {
          const existingDocument = await db.getClientDocumentByType(input.clientId, input.documentTypeId);
          if (existingDocument?.fileUrl) {
            throw new Error(`نوع المستند "${input.documentTypeId}" مرفوع مسبقاً للعميل. يمكن استخدام "مستندات أخرى" لرفع مستندات إضافية.`);
          }
        }

        // رفع الملف إلى التخزين
        const { url, key } = await storagePut(
          `documents/${input.clientId}/${Date.now()}-${input.file.name}`,
          Buffer.from(input.file.data, 'base64'),
          input.file.type
        );

        logger.info('File uploaded successfully', {
          fileKey: key,
          fileUrl: url,
          fileSize: input.file.size,
        });

        // حفظ معلومات المستند في قاعدة البيانات
        const documentType = DOCUMENT_TYPES.find(dt => dt.id === input.documentTypeId);
        const label = documentType?.label || input.file.name;

        // تحديد المستخدم الذي رفع الملف (نظامي أو OAuth)
        let uploadedBy = null;
        if (input.systemUserId) {
          uploadedBy = input.systemUserId; // مستخدم نظامي
        } else if (ctx.user?.id) {
          uploadedBy = ctx.user.id; // مستخدم OAuth
        }

        const documentData = {
          clientId: input.clientId,
          documentTypeId: input.documentTypeId,
          label,
          description: input.description || '',
          fileUrl: url,
          fileKey: key,
          fileSize: input.file.size,
          mimeType: input.file.type,
          uploadedAt: new Date(),
          uploadedBy,
        };

        const result = await db.createClientDocument(documentData);
        
        // libSQL returns lastInsertRowid, not insertedId
        const documentId = result.lastInsertRowid || 'unknown';
        logger.info('Document saved to database', {
          documentId,
          clientId: input.clientId,
          uploadedBy,
        });

        // تسجيل نشاط رفع المستند - استخدام النظام الإداري (id: 1) بشكل مؤقت
        try {
          logger.info('Attempting to log document upload activity', {
            clientId: input.clientId,
            documentId: Number(documentId),
            uploadedBy,
            ctxUserId: ctx.user?.id,
            ctxUser: ctx.user,
            systemAdminUserId: 1
          });
          
          // استخدام النظام الإداري (id: 1) لجميع عمليات التسجيل مؤقتاً
          await logDocumentUpload({
            clientId: input.clientId,
            documentId: Number(documentId),
            fileName: input.file.name,
            documentTypeId: input.documentTypeId,
            fileSize: input.file.size,
            performedByUserId: 1, // النظام الإداري
          });
          logger.info('Document upload activity logged successfully', { 
            documentId, 
            clientId: input.clientId,
            performedByUserId: 1
          });
        } catch (logError) {
          logger.error('Failed to log document upload activity', {
            error: logError instanceof Error ? logError.message : String(logError),
            stack: logError instanceof Error ? logError.stack : undefined,
            documentId,
            clientId: input.clientId,
            systemAdminUserId: 1
          });
          // لا نرمي خطأ لأن التسجيل لا يجب أن يعيق العملية الرئيسية
        }

        return {
          success: true,
          documentId,
          fileUrl: url,
          message: "تم رفع المستند بنجاح",
        };
      } catch (error) {
        logger.error('Error uploading document', {
          clientId: input.clientId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    }),

  /**
   * تحديث وصف المستند
   */
  updateDescription: publicProcedure
    .input(updateDocumentSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info('Updating document description', { documentId: input.id });
        
        const result = await db.updateClientDocument(input.id, {
          description: input.description,
        });

        return {
          success: true,
          message: "تم تحديث وصف المستند بنجاح",
        };
      } catch (error) {
        logger.error('Error updating document description', {
          documentId: input.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

  /**
   * حذف ملف المستند (مع الاحتفاظ بالسجل)
   */
  removeFile: publicProcedure
    .input(deleteFileSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info('Removing document file', { documentId: input.id });
        
        // الحصول على معلومات المستند
        const document = await db.getClientDocument(input.id);
        if (!document) {
          throw new Error("المستند غير موجود");
        }

        // حذف الملف من التخزين إذا كان موجوداً
        if (document.fileKey) {
          await storageDelete(document.fileKey);
          logger.info('File deleted from storage', { fileKey: document.fileKey });
        }

        // تحديث سجل المستند لإزالة معلومات الملف
        const result = await db.updateClientDocument(input.id, {
          fileUrl: null,
          fileKey: null,
          fileSize: null,
          mimeType: null,
          uploadedAt: null,
        });

        return {
          success: true,
          message: "تم حذف ملف المستند بنجاح",
        };
      } catch (error) {
        logger.error('Error removing document file', {
          documentId: input.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

    /**
     * حذف المستند نهائياً (مع حذف الملف والسجل)
     */
    deleteDocument: publicProcedure
      .input(deleteFileSchema)
      .mutation(async ({ input }) => {
        try {
          logger.info('Deleting document permanently', { documentId: input.id });
          
          // الحصول على معلومات المستند
          const document = await db.getClientDocument(input.id);
          if (!document) {
            throw new Error("المستند غير موجود");
          }

          // تسجيل نشاط حذف المستند قبل الحذف الفعلي
          await logDocumentDelete({
            clientId: document.clientId,
            documentId: document.id,
            fileName: document.label || document.fileKey || 'غير معروف',
            documentTypeId: document.documentTypeId,
            performedByUserId: 1, // System Admin
          });

          // حذف الملف من التخزين إذا كان موجوداً
          if (document.fileKey) {
            await storageDelete(document.fileKey);
            logger.info('File deleted from storage', { fileKey: document.fileKey });
          }

          // حذف سجل المستند من قاعدة البيانات
          await db.deleteClientDocument(input.id);

          return {
            success: true,
            message: "تم حذف المستند نهائياً",
          };
        } catch (error) {
          logger.error('Error deleting document', {
            documentId: input.id,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }),

  /**
   * إنشاء مستندات افتراضية للعميل حسب نوع الملكية
   */
  createDefaultDocuments: publicProcedure
    .input(z.object({
      clientId: z.number().positive(),
      propertyDocType: z.enum(['Deed', 'Ihkam', 'Revivals', 'Other']),
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('Creating default documents', {
          clientId: input.clientId,
          propertyDocType: input.propertyDocType,
        });

        // الحصول على أنواع المستندات الافتراضية
        const defaultDocumentTypes = DOCUMENT_TYPES.filter(doc => {
          const documentGroups = {
            Deed: ['property_deed', 'owner_id', 'legal_agency', 'agent_id', 'survey_plan', 'heirs_inventory'],
            Ihkam: ['ihkaam_request', 'owner_id', 'legal_agency', 'agent_id', 'survey_plan', 'heirs_inventory', 'supporting_docs'],
            Revivals: ['other_proof', 'owner_id', 'legal_agency', 'agent_id', 'survey_plan', 'heirs_inventory'],
            Other: ['other_proof', 'owner_id', 'legal_agency', 'agent_id', 'survey_plan', 'heirs_inventory'],
          };
          
          const group = documentGroups[input.propertyDocType] || [];
          return group.includes(doc.id);
        });

        // إنشاء سجلات المستندات
        const promises = defaultDocumentTypes.map(async (docType) => {
          const existingDoc = await db.getClientDocumentByType(input.clientId, docType.id);
          
          if (!existingDoc) {
            return db.createClientDocument({
              clientId: input.clientId,
              documentTypeId: docType.id,
              label: docType.label,
              description: `مستند ${docType.label} المطلوب للعميل`,
            });
          }
          
          return existingDoc;
        });

        const results = await Promise.all(promises);
        // حساب عدد المستندات التي تم إنشاؤها حديثاً (تلك التي تحتوي على lastInsertRowid)
        const createdCount = results.filter(r => 'lastInsertRowid' in r && r.lastInsertRowid).length;

        logger.info('Default documents created successfully', {
          clientId: input.clientId,
          createdCount,
          total: defaultDocumentTypes.length,
        });

        return {
          success: true,
          createdCount,
          total: defaultDocumentTypes.length,
          message: `تم إنشاء ${createdCount} مستند افتراضي للعميل`,
        };
      } catch (error) {
        logger.error('Error creating default documents', {
          clientId: input.clientId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

  /**
   * الحصول على رابط المعاينة المباشرة للمستند
   */
  getPreviewUrl: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .query(async ({ input }) => {
      const document = await db.getClientDocument(input.id);
      
      if (!document?.fileUrl) {
        return { url: null, canPreview: false };
      }

      // التحقق مما إذا كان الملف قابلاً للمعاينة (PDF, صور)
      const previewableTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      const canPreview = document.mimeType 
        ? previewableTypes.includes(document.mimeType.toLowerCase())
        : document.fileUrl.toLowerCase().endsWith('.pdf') || 
          /\.(jpg|jpeg|png|gif|webp)$/i.test(document.fileUrl);

      return {
        url: document.fileUrl,
        canPreview,
        mimeType: document.mimeType,
        fileName: document.label,
      };
    }),
});

// ============================================
// نقاط النهاية Express للتحميل والمعاينة
// ============================================

/**
 * تسجيل نقاط النهاية Express لتحميل ومعاينة مستندات العملاء
 */
export function registerClientDocumentRoutes(app: express.Express) {
  /**
   * تحميل ملف مستند العميل
   * GET /api/client-documents/:id/download
   */
  app.get('/api/client-documents/:id/download', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      console.log('Document ID:', documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'معرف المستند غير صالح' });
      }

      const document = await db.getClientDocument(documentId);
      if (!document) {
        console.log('Document not found in DB');
        return res.status(404).json({ error: 'المستند غير موجود' });
      }

      // التحقق من صلاحيات المستخدم باستخدام JWT من الكوكيز
      const cookies = parseCookie(req.headers.cookie || '');
      const sessionCookie = cookies[COOKIE_NAME];
      const session = await sdk.verifySession(sessionCookie);
      
// if (!session) {
//   return res.status(401).json({ error: 'غير مصرح لك بالوصول إلى هذا المستند' });
// }
      // التحقق من وجود ملف مرفوع
      if (!document.fileKey && !document.fileUrl) {
        return res.status(404).json({ error: 'لا يوجد ملف مرفوع لهذا المستند' });
      }

      // تحديد مسار الملف (fileUrl يحتوي على المسار الكامل من /uploads)
const fileUrl = document.fileUrl;
if (!fileUrl) {
  return res.status(500).json({ error: 'خطأ في بيانات الملف' });
}

console.log('fileUrl from DB:', fileUrl);

// إزالة /uploads من البداية إن وجد
let relativePath = fileUrl.replace(/^\/uploads\//, '');
console.log('Relative path after cleanup:', relativePath);

// بناء المسار الكامل للملف
const filePath = path.join(process.cwd(), 'uploads', relativePath);      
console.log('Full file path:', filePath);
      
      // التحقق من وجود الملف على القرص باستخدام fs.access
      try {
        await fs.access(filePath);
        console.log('File exists? YES');
      } catch (err) {
        console.log('File exists? NO');
        console.warn('الملف غير موجود على القرص', { filePath, documentId, relativePath });
        return res.status(404).json({ error: 'الملف غير موجود على الخادم' });
      }

      // تحديد اسم الملف للتحميل (مع دعم الأحرف العربية والخاصة)
      // الحصول على الامتداد من المسار الأصلي
      const fileExtension = path.extname(relativePath);
      const originalFileName = document.label 
        ? `${document.label}${fileExtension}` 
        : path.basename(relativePath);
      const encodedFileName = encodeURIComponent(originalFileName).replace(/['()]/g, escape);
      const safeFileName = `attachment; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;

      // إرسال الملف للتحميل
      res.setHeader('Content-Disposition', safeFileName);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('خطأ أثناء تحميل الملف', { documentId, error: err.message });
          if (!res.headersSent) {
            res.status(500).json({ error: 'حدث خطأ أثناء تحميل الملف' });
          }
        }
      });

      console.log('تم تحميل الملف بنجاح', { documentId, downloadedBy: session?.openId });
    } catch (error) {
      console.error('خطأ في نقطة تحميل المستند', { 
        documentId: req.params.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
      res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
    }
  });

  /**
   * معاينة ملف مستند العميل في المتصفح
   * GET /api/client-documents/:id/preview
   */
  app.get('/api/client-documents/:id/preview', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      console.log('Document ID:', documentId);
      if (isNaN(documentId)) {
        return res.status(400).json({ error: 'معرف المستند غير صالح' });
      }

      const document = await db.getClientDocument(documentId);
      if (!document) {
        console.log('Document not found in DB');
        return res.status(404).json({ error: 'المستند غير موجود' });
      }

      // التحقق من صلاحيات المستخدم باستخدام JWT من الكوكيز
      const cookies = parseCookie(req.headers.cookie || '');
      const sessionCookie = cookies[COOKIE_NAME];
      const session = await sdk.verifySession(sessionCookie);
      
// if (!session) {
//   return res.status(401).json({ error: 'غير مصرح لك بالوصول إلى هذا المستند' });
// }
      // التحقق من وجود ملف مرفوع
      if (!document.fileKey && !document.fileUrl) {
        return res.status(404).json({ error: 'لا يوجد ملف مرفوع لهذا المستند' });
      }

      // تحديد مسار الملف (fileUrl يحتوي على المسار الكامل من /uploads)
const fileUrl = document.fileUrl || document.fileKey;
if (!fileUrl) {
  return res.status(500).json({ error: 'خطأ في بيانات الملف' });
}

console.log('fileUrl from DB:', fileUrl);

// إزالة /uploads من البداية إن وجد
let relativePath = fileUrl.replace(/^\/uploads\//, '');
console.log('Relative path after cleanup:', relativePath);

// بناء المسار الكامل للملف
const filePath = path.join(process.cwd(), 'uploads', relativePath);
      console.log('Full file path:', filePath);
      
      // التحقق من وجود الملف على القرص باستخدام fs.access
      try {
        await fs.access(filePath);
        console.log('File exists? YES');
      } catch (err) {
        console.log('File exists? NO');
        console.warn('الملف غير موجود على القرص للمعاينة', { filePath, documentId, relativePath });
        return res.status(404).json({ error: 'الملف غير موجود على الخادم' });
      }

      // تحديد نوع المحتوى بناءً على mimeType المخزن
      const mimeType = document.mimeType || 'application/octet-stream';
      console.log('MIME type:', mimeType);

      // التحقق مما إذا كان الملف قابلاً للمعاينة (PDF, صور)
      const previewableTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ];
      
      const canPreview = previewableTypes.includes(mimeType.toLowerCase());
      if (!canPreview) {
        console.warn('نوع الملف غير قابل للمعاينة', { mimeType, documentId });
        return res.status(415).json({ error: 'نوع الملف غير مدعوم للمعاينة. يرجى تحميل الملف بدلاً من ذلك.' });
      }

      // إضافة headers للمعاينة الآمنة
      // الحصول على الامتداد من المسار الأصلي
      const fileExtension = path.extname(relativePath);
      const originalFileName = document.label 
        ? `${document.label}${fileExtension}` 
        : path.basename(relativePath);
      const encodedFileName = encodeURIComponent(originalFileName).replace(/['()]/g, escape);
      const safeFileName = `inline; filename="${encodedFileName}"; filename*=UTF-8''${encodedFileName}`;
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', safeFileName);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=3600');

      // إرسال الملف للمعاينة
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('خطأ أثناء معاينة الملف', { documentId, error: err.message });
          if (!res.headersSent) {
            res.status(500).json({ error: 'حدث خطأ أثناء معاينة الملف' });
          }
        }
      });

      console.log('تمت معاينة الملف بنجاح', { documentId, previewedBy: session?.openId });
    } catch (error) {
      console.error('خطأ في نقطة معاينة المستند', { 
        documentId: req.params.id, 
        error: error instanceof Error ? error.message : String(error) 
      });
      res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
    }
  });
}
