import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  openId: text('openId').notNull().unique(),
  name: text('name'),
  email: text('email'),
  loginMethod: text('loginMethod'),
  role: text('role').notNull().default('user'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSignedIn: integer('lastSignedIn', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agents table - الوكلا المتعمدين
 */
export const agents = sqliteTable('agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  name: text('name').notNull(),
  idNumber: text('id_number'),
  birthDate: integer('birth_date', { mode: 'timestamp' }),
  phone: text('phone'),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Client Status Enum - حالات الملف
 */
export const CLIENT_STATUSES = [
  'New',                    // جديد
  'WakalahRegistration',    // تسجيل الوكالة
  'FilePreparation',        // جاري تجهيز الملف
  'FileSubmitted',          // تم تقديم الملف
  'Processing',             // قيد المعالجة
  'Valuation',              // التقييم
  'UnderReview',            // قيد المراجعة
  'ObjectionSubmitted',     // تقديم اعتراض
  'PaymentPending',         // في انتظار الدفع
  'CheckIssued',            // تم إصدار الشيك
  'Completed'               // مكتمل
] as const;

export type ClientStatus = typeof CLIENT_STATUSES[number];

/**
 * Property Document Types - أنواع مستندات العقار
 */
export const PROPERTY_DOC_TYPES = [
  'Deed',      // صك
  'Ihkam',     // إحكام
  'Revivals',  // إحياءات
  'Other'      // أخرى
] as const;

export type PropertyDocType = typeof PROPERTY_DOC_TYPES[number];

/**
 * Expropriation Types - أنواع النزع
 */
export const EXPROPRIATION_TYPES = [
  'FULL',
  'PARTIAL',
  'IMPROVEMENTS_ONLY',
] as const;

export type ExpropriationType = typeof EXPROPRIATION_TYPES[number];

/**
 * Clients table - العملاء
 * Updated: Removed completion_percentage, agency_type
 * Added: agency_date, property_document_type, request_number, request_date, property_description, city, map_link
 */
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  
  // Basic Info
  name: text('name').notNull(),
  phone: text('phone'),
  idNumber: text('id_number'),
  
  // Agent Reference
  agentId: integer('agent_id'),
  
  // Wakalah Info (Agency)
  wakalahNumber: text('wakalah_number'),
  agencyDate: integer('agency_date', { mode: 'timestamp' }), // تاريخ الوكالة
  agencyIssueDate: integer('agency_issue_date', { mode: 'timestamp' }), // تاريخ إصدار الوكالة
  agencyDurationDays: integer('agency_duration_days'), // مدة الوكالة بالأيام
  agencyEndDate: integer('agency_end_date', { mode: 'timestamp' }), // تاريخ انتهاء الوكالة
  agencyExpiryDate: integer('agency_expiry_date', { mode: 'timestamp' }), // تاريخ انتهاء الوكالة (محسوب)
  
  // Property Document Type (Polymorphic)
  propertyDocType: text('property_doc_type').notNull().default('Deed'),
  
  // Option A: Deed (صك)
  deedNumber: text('deed_number'),
  deedDate: integer('deed_date', { mode: 'timestamp' }),
  deedAreaSqm: real('deed_area_sqm'),

  // Option B: Ihkam (إحكام)
  requestNumber: text('request_number'),
  requestDate: integer('request_date', { mode: 'timestamp' }),
  
  // Option C & D: Revivals/Other (إحياءات/أخرى)
  propertyDescription: text('property_description'),
  
  // Expropriation Details
  expropriationType: text('expropriation_type').notNull().default('FULL'),
  decisionNumber: text('decision_number'),
  decisionDate: integer('decision_date', { mode: 'timestamp' }),
  expropriatedArea: real('expropriated_area'),
  remainingArea: real('remaining_area'),
  improvementType: text('improvement_type'),
  improvementValue: real('improvement_value'),
  improvementTypes: text('improvement_types', { mode: 'json' }).$type<string[]>(),
  improvementOtherDescription: text('improvement_other_description'),

  // Common Location Fields
  city: text('city'),
  mapLink: text('map_link'),
  
  // Coordinates (extracted from mapLink)
  latitude: real('latitude'),
  longitude: real('longitude'),
  
  // Legacy field kept for backward compatibility
  district: text('district'),
  surveyMapRef: text('survey_map_ref'),
  
  // Status
  status: text('status').notNull().default('New'),
  
  // Financials
  areaSqm: real('area_sqm'),
  expectedCompensationPerSqm: real('expected_compensation_per_sqm'),
  possessionRatio: real('possession_ratio').default(1.00),
  expectedCompensationTotal: real('expected_compensation_total'),
  successFee: real('success_fee'),
  baseFeePercentage: real('base_fee_percentage').default(0.00),
  
  // New Financial & Expropriation Fields (Phase 2)
  damageToRemainingComp: real('damage_to_remaining_comp'),
  extraCompRate: real('extra_comp_rate'),
  officialCompensationAmount: real('official_compensation_amount'),
  valuationDocumentId: text('valuation_document_id'),

  // Reference Code
  refCode: text('ref_code'),
  
  // Missing Documents
  missingDocuments: text('missing_documents'),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Settings table - الإعدادات
 */
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Documents table - المستندات
 */
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  
  documentType: text('document_type').notNull(),
  
  customName: text('custom_name'),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileKey: text('file_key').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  
  status: text('doc_status').notNull().default('pending'),
  
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;