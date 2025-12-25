import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal, json } from "drizzle-orm/mysql-core";

// ... (جميع المحتويات الأخرى بدون تغيير)

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
  agencyDate: date("agency_date"),
  agencyIssueDate: date("agency_issue_date"),
  agencyDurationDays: int("agency_duration_days"),
  agencyEndDate: date("agency_end_date"),
  agencyExpiryDate: timestamp("agency_expiry_date"),
  
  // ... (بقية الحقول بدون تغيير)
});

// ... (بقية الملف بدون تعديل)
