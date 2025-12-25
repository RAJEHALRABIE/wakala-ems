/**
 * نظام المستندات - أنواع وفئات المستندات والوظائف المساعدة
 * 
 * يحتوي على 11 نوع مستند مرتبطة بـ 3 فئات:
 * 1. title_deed - صك الملكية (6 أنواع)
 * 2. ihkaam - إحكام (2 نوع)
 * 3. ihyaa - إحياءات (1 نوع)
 * 4. common - مشتركة (2 نوع)
 */

import { DocumentType, ClientDocument } from './types';

// ============================================
// تعريف أنواع المستندات الـ 11
// ============================================

export const DOCUMENT_TYPES: DocumentType[] = [
  // فئة: title_deed (صك الملكية) - 6 أنواع
  {
    id: 'property_deed',
    label: 'صك الملكية',
    category: 'title_deed' as const,
    displayOrder: 1,
    createdAt: new Date(),
  },
  {
    id: 'owner_id',
    label: 'هوية المالك',
    category: 'title_deed' as const,
    displayOrder: 2,
    createdAt: new Date(),
  },
  {
    id: 'legal_agency',
    label: 'الوكالة الشرعية',
    category: 'title_deed' as const,
    displayOrder: 3,
    createdAt: new Date(),
  },
  {
    id: 'agent_id',
    label: 'هوية الوكيل',
    category: 'title_deed' as const,
    displayOrder: 4,
    createdAt: new Date(),
  },
  {
    id: 'survey_plan',
    label: 'الرفع المساحي للعقار',
    category: 'title_deed' as const,
    displayOrder: 5,
    createdAt: new Date(),
  },
  {
    id: 'heirs_inventory',
    label: 'حصر الورثة',
    category: 'title_deed' as const,
    displayOrder: 6,
    createdAt: new Date(),
  },

  // فئة: ihkaam (إحكام) - 2 نوع
  {
    id: 'ihkaam_request',
    label: 'طلب منصة إحكام',
    category: 'ihkaam' as const,
    displayOrder: 7,
    createdAt: new Date(),
  },
  {
    id: 'supporting_docs',
    label: 'مستندات داعمة للحكم',
    category: 'ihkaam' as const,
    displayOrder: 8,
    createdAt: new Date(),
  },

  // فئة: ihyaa (إحياءات) - 1 نوع
  {
    id: 'other_proof',
    label: 'مستندات ثبوتية أخرى',
    category: 'ihyaa' as const,
    displayOrder: 9,
    createdAt: new Date(),
  },

  // فئة: common (مشتركة) - 3 أنواع
  {
    id: 'common_owner_id',
    label: 'هوية المالك',
    category: 'common' as const,
    displayOrder: 10,
    createdAt: new Date(),
  },
  {
    id: 'common_legal_agency',
    label: 'الوكالة الشرعية',
    category: 'common' as const,
    displayOrder: 11,
    createdAt: new Date(),
  },
  {
    id: 'other',
    label: 'مستندات أخرى',
    category: 'common' as const,
    displayOrder: 12,
    createdAt: new Date(),
  },
];

// ============================================
// مجموعات المستندات الافتراضية حسب نوع الملكية
// ============================================

export type PropertyDocType = 'Deed' | 'Ihkam' | 'Revivals' | 'Other';

export const DEFAULT_DOCUMENT_GROUPS: Record<PropertyDocType, string[]> = {
  // صك الملكية
  Deed: [
    'property_deed',
    'owner_id',
    'legal_agency',
    'agent_id',
    'survey_plan',
    'heirs_inventory',
  ],
  
  // إحكام
  Ihkam: [
    'ihkaam_request',
    'owner_id',
    'legal_agency',
    'agent_id',
    'survey_plan',
    'heirs_inventory',
    'supporting_docs',
  ],
  
  // إحياءات
  Revivals: [
    'other_proof',
    'owner_id',
    'legal_agency',
    'agent_id',
    'survey_plan',
    'heirs_inventory',
  ],
  
  // أخرى
  Other: [
    'other_proof',
    'owner_id',
    'legal_agency',
    'agent_id',
    'survey_plan',
    'heirs_inventory',
  ],
};

// ============================================
// وظائف مساعدة
// ============================================

/**
 * الحصول على أنواع المستندات حسب الفئة
 */
export function getDocumentTypesByCategory(category: DocumentType['category']): DocumentType[] {
  return DOCUMENT_TYPES.filter(doc => doc.category === category);
}

/**
 * الحصول على أنواع المستندات حسب مجموعة نوع الملكية
 */
export function getDefaultDocumentTypes(propertyDocType: PropertyDocType): DocumentType[] {
  const documentIds = DEFAULT_DOCUMENT_GROUPS[propertyDocType] || [];
  return DOCUMENT_TYPES.filter(doc => documentIds.includes(doc.id));
}

/**
 * إنشاء سجلات مستندات افتراضية للعميل
 */
export function createDefaultClientDocuments(
  clientId: number,
  propertyDocType: PropertyDocType,
  labelTemplate?: string
): Partial<ClientDocument>[] {
  const documentTypes = getDefaultDocumentTypes(propertyDocType);
  
  return documentTypes.map((docType, index) => ({
    clientId,
    documentTypeId: docType.id,
    label: labelTemplate ? `${labelTemplate} - ${docType.label}` : docType.label,
    description: `مستند ${docType.label} المطلوب للعميل`,
  }));
}

/**
 * تحليل حالة المستندات
 */
export function analyzeDocumentStatus(documents: ClientDocument[]) {
  const total = documents.length;
  const uploaded = documents.filter(d => d.fileUrl).length;
  const pending = documents.filter(d => !d.fileUrl).length;
  
  return {
    total,
    uploaded,
    pending,
    completionPercentage: total > 0 ? Math.round((uploaded / total) * 100) : 0,
  };
}

/**
 * الحصول على فئة المستند من نوع المستند
 */
export function getDocumentCategory(documentTypeId: string): DocumentType['category'] | null {
  const docType = DOCUMENT_TYPES.find(doc => doc.id === documentTypeId);
  return docType?.category || null;
}

/**
 * الحصول على اسم المستند العربي
 */
export function getDocumentLabel(documentTypeId: string): string {
  const docType = DOCUMENT_TYPES.find(doc => doc.id === documentTypeId);
  return docType?.label || documentTypeId;
}

// ============================================
// أنواع التصدير
// ============================================

export type DocumentTypeId = typeof DOCUMENT_TYPES[number]['id'];
export type DocumentCategory = typeof DOCUMENT_TYPES[number]['category'];
