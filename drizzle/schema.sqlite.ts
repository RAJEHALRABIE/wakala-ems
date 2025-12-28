import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * System Users table
 */
export const systemUsers = sqliteTable('system_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  phone: text('phone'),
  email: text('email'),
});

export type SystemUser = typeof systemUsers.$inferSelect;
export type InsertSystemUser = typeof systemUsers.$inferInsert;

/**
 * Agents table
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
 * Clients table
 */
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  
  name: text('name').notNull(),
  phone: text('phone'),
  idNumber: text('id_number'),
  agentId: integer('agent_id'),
  wakalahNumber: text('wakalah_number'),
  agencyDate: integer('agency_date', { mode: 'timestamp' }),
  agencyExpiryDate: integer('agency_expiry_date', { mode: 'timestamp' }),
  propertyDocType: text('property_doc_type').notNull().default('Deed'),
  deedNumber: text('deed_number'),
  deedDate: integer('deed_date', { mode: 'timestamp' }),
  deedAreaSqm: real('deed_area_sqm'),
  requestNumber: text('request_number'),
  requestDate: integer('request_date', { mode: 'timestamp' }),
  propertyDescription: text('property_description'),
  expropriationType: text('expropriation_type').notNull().default('FULL'),
  decisionNumber: text('decision_number'),
  decisionDate: integer('decision_date', { mode: 'timestamp' }),
  expropriatedArea: real('expropriated_area'),
  remainingArea: real('remaining_area'),
  improvementType: text('improvement_type'),
  improvementValue: real('improvement_value'),
  city: text('city'),
  mapLink: text('map_link'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  district: text('district'),
  surveyMapRef: text('survey_map_ref'),
  status: text('status').notNull().default('New'),
  areaSqm: real('area_sqm'),
  expectedCompensationPerSqm: real('expected_compensation_per_sqm'),
  possessionRatio: real('possession_ratio').default(1.00),
  expectedCompensationTotal: real('expected_compensation_total'),
  successFee: real('success_fee'),
  baseFeePercentage: real('base_fee_percentage').default(0.00),
  damageToRemainingComp: real('damage_to_remaining_comp'),
  extraCompRate: real('extra_comp_rate'),
  officialCompensationAmount: real('official_compensation_amount'),
  valuationDocumentId: text('valuation_document_id'),
  refCode: text('ref_code'),
  missingDocuments: text('missing_documents'),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  deletedBy: integer('deleted_by'),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Settings table
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
 * Sessions table
 */
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;