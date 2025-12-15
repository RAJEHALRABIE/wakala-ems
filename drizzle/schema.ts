import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agents table - Ø§Ù„ÙˆÙƒÙ„Ø§Ø¡ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ÙŠÙ†
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  idNumber: varchar("id_number", { length: 20 }),
  birthDate: date("birth_date"),
  phone: varchar("phone", { length: 20 }),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Client Status Enum - Ø­Ø§Ù„Ø§Øª Ø§Ù„Ù…Ù„Ù
 */
export const CLIENT_STATUSES = [
  "New",                    // Ø¬Ø¯ÙŠØ¯
  "WakalahRegistration",    // ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ÙˆÙƒØ§Ù„Ø©
  "FilePreparation",        // Ø¬Ø§Ø±ÙŠ ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ù…Ù„Ù
  "FileSubmitted",          // ØªÙ… ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù…Ù„Ù
  "Processing",             // Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©
  "Valuation",              // Ø§Ù„ØªÙ‚ÙŠÙŠÙ…
  "UnderReview",            // Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©
  "ObjectionSubmitted",     // ØªÙ‚Ø¯ÙŠÙ… Ø§Ø¹ØªØ±Ø§Ø¶
  "PaymentPending",         // ÙÙŠ Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¯ÙØ¹
  "CheckIssued",            // ØªÙ… Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø´ÙŠÙƒ
  "Completed"               // Ù…ÙƒØªÙ…Ù„
] as const;

export type ClientStatus = typeof CLIENT_STATUSES[number];

/**
 * Property Document Types - Ø£Ù†ÙˆØ§Ø¹ Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ø¹Ù‚Ø§Ø±
 */
export const PROPERTY_DOC_TYPES = [
  "Deed",      // ØµÙƒ
  "Ihkam",     // Ø¥Ø­ÙƒØ§Ù…
  "Revivals",  // Ø¥Ø­ÙŠØ§Ø¡Ø§Øª
  "Other"      // Ø£Ø®Ø±Ù‰
] as const;

export type PropertyDocType = typeof PROPERTY_DOC_TYPES[number];

/**
 * Expropriation Types - Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„Ù†Ø²Ø¹
 */
export const EXPROPRIATION_TYPES = [
  "FULL",
  "PARTIAL",
  "IMPROVEMENTS_ONLY",
] as const;

export type ExpropriationType = typeof EXPROPRIATION_TYPES[number];

/**
 * Clients table - Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡
 * Updated: Removed completion_percentage, agency_type
 * Added: agency_date, property_document_type, request_number, request_date, property_description, city, map_link
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  
  // Basic Info
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  idNumber: varchar("id_number", { length: 20 }),
  
  // Agent Reference
  agentId: int("agent_id"),
  
  // Wakalah Info (Agency)
  wakalahNumber: varchar("wakalah_number", { length: 50 }),
  agencyDate: date("agency_date"), // ØªØ§Ø±ÙŠØ® Ø§Ù„ÙˆÙƒØ§Ù„Ø© - NEW
  
  // Property Document Type (Polymorphic)
  propertyDocType: mysqlEnum("property_doc_type", ["Deed", "Ihkam", "Revivals", "Other"]).default("Deed"),
  
  // Option A: Deed (ØµÙƒ)
  deedNumber: varchar("deed_number", { length: 50 }),
  deedDate: date("deed_date"),
  deedAreaSqm: decimal("deed_area_sqm", { precision: 12, scale: 2 }),

  // Option B: Ihkam (Ø¥Ø­ÙƒØ§Ù…)
  requestNumber: varchar("request_number", { length: 50 }),
  requestDate: date("request_date"),
  
  // Option C & D: Revivals/Other (Ø¥Ø­ÙŠØ§Ø¡Ø§Øª/Ø£Ø®Ø±Ù‰)
  propertyDescription: text("property_description"),
  
  // Expropriation Details
  expropriationType: mysqlEnum("expropriation_type", ["FULL", "PARTIAL", "IMPROVEMENTS_ONLY"]).default("FULL"),
  decisionNumber: varchar("decision_number", { length: 50 }),
  decisionDate: date("decision_date"),
  expropriatedArea: decimal("expropriated_area", { precision: 12, scale: 2 }),
  remainingArea: decimal("remaining_area", { precision: 12, scale: 2 }),
  improvementType: varchar("improvement_type", { length: 255 }),
  improvementValue: decimal("improvement_value", { precision: 12, scale: 2 }),
  improvementTypes: json("improvement_types").$type<string[]>(),
  improvementOtherDescription: varchar("improvement_other_description", { length: 500 }),

  // Common Location Fields
  city: varchar("city", { length: 100 }),
  mapLink: text("map_link"),
  
  // Coordinates (extracted from mapLink)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Legacy field kept for backward compatibility
  district: varchar("district", { length: 100 }),
  surveyMapRef: varchar("survey_map_ref", { length: 500 }),
  
  // Status
  status: mysqlEnum("status", [
    "New",
    "WakalahRegistration",
    "FilePreparation",
    "FileSubmitted",
    "Processing",
    "Valuation",
    "UnderReview",
    "ObjectionSubmitted",
    "PaymentPending",
    "CheckIssued",
    "Completed"
  ]).default("New").notNull(),
  
  // Financials
  areaSqm: decimal("area_sqm", { precision: 12, scale: 2 }),
  expectedCompensationPerSqm: decimal("expected_compensation_per_sqm", { precision: 12, scale: 2 }),
  possessionRatio: decimal("possession_ratio", { precision: 5, scale: 2 }).default("1.00"),
  expectedCompensationTotal: decimal("expected_compensation_total", { precision: 15, scale: 2 }),
  successFee: decimal("success_fee", { precision: 15, scale: 2 }),
  baseFeePercentage: decimal("base_fee_percentage", { precision: 5, scale: 2 }).default("0.00"),
  
  // New Financial & Expropriation Fields (Phase 2)
  damageToRemainingComp: decimal("damage_to_remaining_comp", { precision: 15, scale: 2 }),
  extraCompRate: decimal("extra_comp_rate", { precision: 5, scale: 2 }),
  officialCompensationAmount: decimal("official_compensation_amount", { precision: 15, scale: 2 }),
  valuationDocumentId: varchar("valuation_document_id", { length: 255 }),

  // Reference Code
  refCode: varchar("ref_code", { length: 20 }),
  
  // Missing Documents
  missingDocuments: text("missing_documents"),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Settings table - Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Documents table - Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id").notNull(),
  
  documentType: mysqlEnum("document_type", [
    "ownership_deed",
    "owner_id",
    "legal_wakalah",
    "agent_id",
    "survey_report",
    "heirs_certificate",
    "other"
  ]).notNull(),
  
  customName: varchar("custom_name", { length: 255 }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 255 }).notNull(),
  fileSize: int("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  
  status: mysqlEnum("doc_status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

