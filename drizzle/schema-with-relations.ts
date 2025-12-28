import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

/**
 * System Users table - إدارة المستخدمين الداخليين (للتحقق بكلمة مرور)
 */
export const systemUsers = sqliteTable('system_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'), // 'admin', 'agent', 'viewer'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  phone: text('phone'),
  email: text('email'),
  needsPasswordChange: integer('needs_password_change', { mode: 'boolean' }).default(false),
});

export type SystemUser = typeof systemUsers.$inferSelect;
export type InsertSystemUser = typeof systemUsers.$inferInsert;

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
  agencyDate: integer('agency_date', { mode: 'timestamp' }),
  agencyExpiryDate: integer('agency_expiry_date', { mode: 'timestamp' }),
  
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
  
  // Soft Delete
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedBy: integer('deleted_by'),
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
 * Document Types table - أنواع المستندات المرجعية
 */
export const documentTypes = sqliteTable('document_types', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  category: text('category', { enum: ['common', 'title_deed', 'ihkaam', 'ihyaa'] }),
  displayOrder: integer('display_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type DocumentType = typeof documentTypes.$inferSelect;
export type InsertDocumentType = typeof documentTypes.$inferInsert;

/**
 * Client Documents table - مستندات العملاء
 */
export const clientDocuments = sqliteTable('client_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  documentTypeId: text('document_type_id').notNull(),
  
  label: text('label').notNull(),
  description: text('description'),
  
  fileUrl: text('file_url'),
  fileKey: text('file_key'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }),
  uploadedBy: integer('uploaded_by'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;

/**
 * Legacy Documents table - المستندات القديمة (للتوافق)
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

/**
 * Client Activity Log table - سجل أنشطة العميل
 */
export const clientActivityLog = sqliteTable('client_activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  actionType: text('action_type').notNull(),
  description: text('description'),
  meta: text('meta', { mode: 'json' }).$type<Record<string, any>>(),
  performedByUserId: integer('performed_by_user_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ClientActivityLog = typeof clientActivityLog.$inferSelect;
export type InsertClientActivityLog = typeof clientActivityLog.$inferInsert;

/**
 * Client Notes table - ملاحظات العميل
 */
export const clientNotes = sqliteTable('client_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  note: text('note').notNull(),
  createdBy: integer('created_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// Sessions Table
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), // Token (randomUUID)
  userId: integer('user_id').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// Relations
export const agentsRelations = relations(agents, ({ many }) => ({
  clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  agent: one(agents, {
    fields: [clients.agentId],
    references: [agents.id],
  }),
  documents: many(documents),
  clientDocuments: many(clientDocuments),
  deletedByUser: one(systemUsers, {
    fields: [clients.deletedBy],
    references: [systemUsers.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
}));

export const clientDocumentsRelations = relations(clientDocuments, ({ one }) => ({
  client: one(clients, {
    fields: [clientDocuments.clientId],
    references: [clients.id],
  }),
  documentType: one(documentTypes, {
    fields: [clientDocuments.documentTypeId],
    references: [documentTypes.id],
  }),
  uploadedByUser: one(systemUsers, {
    fields: [clientDocuments.uploadedBy],
    references: [systemUsers.id],
  }),
}));

export const documentTypesRelations = relations(documentTypes, ({ many }) => ({
  clientDocuments: many(clientDocuments),
}));

// Client Activity Log relations
export const clientActivityLogRelations = relations(clientActivityLog, ({ one }) => ({
  client: one(clients, {
    fields: [clientActivityLog.clientId],
    references: [clients.id],
  }),
  performedByUser: one(systemUsers, {
    fields: [clientActivityLog.performedByUserId],
    references: [systemUsers.id],
  }),
}));

// Client Notes relations
export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, {
    fields: [clientNotes.clientId],
    references: [clients.id],
  }),
  createdByUser: one(systemUsers, {
    fields: [clientNotes.createdBy],
    references: [systemUsers.id],
  }),
}));

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(systemUsers, {
    fields: [sessions.userId],
    references: [systemUsers.id],
  }),
}));

// Export schema with relations for Drizzle
export const schema = {
  systemUsers,
  agents,
  clients,
  settings,
  documents,
  documentTypes,
  clientDocuments,
  clientActivityLog,
  clientNotes,
  sessions,
  // Relations
  agentsRelations,
  clientsRelations,
  documentsRelations,
  clientDocumentsRelations,
  documentTypesRelations,
  clientActivityLogRelations,
  clientNotesRelations,
  sessionsRelations,
};