// استخدام libSQL (SQLite متوافق) مع drizzle-orm
import { drizzle } from "drizzle-orm/libsql";
import { createClient as createLibSQLClient } from "@libsql/client";
import { eq, desc, like, sql, inArray } from "drizzle-orm";
import { schema } from "../drizzle/schema-with-relations";
import type { InsertAgent, InsertClient, InsertDocument, InsertUser, ClientStatus } from "../drizzle/schema.sqlite";
import type { InsertClientDocument, InsertClientActivityLog, InsertClientNote } from "../drizzle/schema-with-relations";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "./logger";
import bcrypt from "bcryptjs";

// إنشاء اتصال بقاعدة بيانات SQLite محلي
const libsqlClient = createLibSQLClient({
  url: "file:./wakala-ems.db",
});

// تهيئة قاعدة البيانات وإنشاء الجداول إذا لزم الأمر
async function initializeDatabase() {
  try {
    await libsqlClient.batch(
      [
        // USERS
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          openId TEXT NOT NULL UNIQUE,
          name TEXT,
          email TEXT,
          loginMethod TEXT,
          role TEXT DEFAULT 'user' NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          lastSignedIn DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,

        // SYSTEM USERS
        `CREATE TABLE IF NOT EXISTS system_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT DEFAULT 'user' NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          last_login_at DATETIME,
          is_active INTEGER DEFAULT 1,
          phone TEXT,
          email TEXT
        )`,

        // AGENTS
        `CREATE TABLE IF NOT EXISTS agents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          name TEXT NOT NULL,
          id_number TEXT,
          birth_date DATE,
          phone TEXT
        )`,

        // CLIENTS
        `CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          id_number TEXT,
          agent_id INTEGER,
          wakalah_number TEXT,
          agency_date DATE,
          agency_issue_date DATE,
          agency_duration_days INTEGER,
          agency_end_date DATE,
          agency_expiry_date DATETIME,
          property_doc_type TEXT DEFAULT 'Deed',
          deed_number TEXT,
          deed_date DATE,
          deed_area_sqm REAL,
          request_number TEXT,
          request_date DATE,
          property_description TEXT,
          expropriation_type TEXT DEFAULT 'FULL',
          decision_number TEXT,
          decision_date DATE,
          expropriated_area REAL,
          remaining_area REAL,
          improvement_type TEXT,
          improvement_value REAL,
          improvement_types TEXT,
          improvement_other_description TEXT,
          city TEXT,
          map_link TEXT,
          latitude REAL,
          longitude REAL,
          district TEXT,
          survey_map_ref TEXT,
          status TEXT DEFAULT 'New' NOT NULL,
          area_sqm REAL,
          expected_compensation_per_sqm REAL,
          possession_ratio REAL DEFAULT 1.00,
          expected_compensation_total REAL,
          success_fee REAL,
          base_fee_percentage REAL DEFAULT 0.00,
          damage_to_remaining_comp REAL,
          extra_comp_rate REAL,
          official_compensation_amount REAL,
          valuation_document_id TEXT,
          ref_code TEXT,
          missing_documents TEXT,
          deleted_at DATETIME,
          deleted_by INTEGER
        )`,

        // SETTINGS
        `CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,

        // DOCUMENTS
        `CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          document_type TEXT NOT NULL,
          custom_name TEXT,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_key TEXT NOT NULL,
          file_size INTEGER,
          mime_type TEXT,
          doc_status TEXT DEFAULT 'pending' NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,

        // CLIENT ACTIVITY LOG
        `CREATE TABLE IF NOT EXISTS client_activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          action_type TEXT NOT NULL,
          description TEXT,
          meta TEXT,
          performed_by_user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,

        // CLIENT NOTES
        `CREATE TABLE IF NOT EXISTS client_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          note TEXT NOT NULL,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,

        // SESSIONS
        `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )`,
      ],
      "write",
    );

    logger.info("[DB] ✅ SQLite database initialized successfully.");
  } catch (error) {
    logger.error("[DB] Error initializing database:", { error });
  }
}

/**
 * دالة مزامنة المخطط تلقائياً لضمان وجود كافة الأعمدة في البيئات المختلفة (مثل Railway)
 */
export async function ensureSchemaSync() {
  logger.info("[DB] Starting schema synchronization check...");
  
  const addColumn = async (table: string, column: string, type: string) => {
    try {
      await libsqlClient.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      logger.info(`✅ [DB] Added column '${column}' to table '${table}'`);
    } catch (error: any) {
      if (error.message?.includes("duplicate column name") || error.message?.includes("already exists")) {
        // العمود موجود بالفعل، نتجاهل الخطأ
      } else {
        logger.error(`❌ [DB] Failed to add column '${column}' to '${table}':`, error.message);
      }
    }
  };

  // 1. مزامنة جدول system_users
  await addColumn("system_users", "email", "TEXT");
  await addColumn("system_users", "phone", "TEXT");
  await addColumn("system_users", "is_active", "INTEGER DEFAULT 1");
  
  // 2. مزامنة جدول clients
  await addColumn("clients", "deleted_at", "DATETIME");
  await addColumn("clients", "deleted_by", "INTEGER");
  await addColumn("clients", "agent_id", "INTEGER");
  await addColumn("clients", "agency_expiry_date", "DATETIME");

  logger.info("[DB] Schema synchronization completed.");
}

// App Start Diagnostics
console.info('[DB DIAGNOSTIC] Starting database connection diagnostics...');
initializeDatabase();

// إنشاء كائن drizzle للاستعلامات
export const db = drizzle(libsqlClient, { schema });

// Helper: Safe date parser
function parseLocalDate(dateStr: any): Date | null {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) { return null; }
}

// =================================================================
// AGENTS
// =================================================================
export const getAllAgents = () =>
  db.query.agents.findMany({ orderBy: [desc(schema.agents.createdAt)] });

export const getAgentById = (id: number) =>
  db.query.agents.findFirst({ where: eq(schema.agents.id, id) });

export const createAgent = (data: InsertAgent) =>
  db.insert(schema.agents).values(data);

export const updateAgent = (id: number, data: Partial<InsertAgent>) =>
  db.update(schema.agents).set(data).where(eq(schema.agents.id, id));

export const deleteAgent = (id: number) =>
  db.delete(schema.agents).where(eq(schema.agents.id, id));

// =================================================================
// CLIENTS
// =================================================================
const generateRefCode = (name: string): string => {
  const namePart = name.trim().slice(0, 2).toUpperCase().padEnd(2, "X");
  const randomPart = createId().slice(0, 6).toUpperCase();
  return `${namePart}${randomPart}`;
};

export const getAllClients = (includeDeleted = false) => {
  if (includeDeleted) {
    return db.query.clients.findMany({
      orderBy: [desc(schema.clients.createdAt)],
    });
  }
  return db.query.clients.findMany({
    where: sql`${schema.clients.deletedAt} IS NULL`,
    orderBy: [desc(schema.clients.createdAt)],
  });
};

export const getDeletedClients = () => {
  return db.query.clients.findMany({
    where: sql`${schema.clients.deletedAt} IS NOT NULL`,
    orderBy: [desc(schema.clients.deletedAt)],
    with: {
        agent: true,
    }
  });
};

export const getClientById = async (id: number) => {
  try {
    const result = await libsqlClient.execute({
      sql: `SELECT *, id, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt FROM clients WHERE id = ?`,
      args: [id]
    });
    return result.rows[0] || null;
  } catch (error) { throw error; }
};

export const getClientWithAgent = async (id: number) => {
  return db.query.clients.findFirst({
    where: eq(schema.clients.id, id),
    with: { agent: true },
  });
};

export const getClientByRefCode = (refCode: string) =>
  db.query.clients.findFirst({ where: eq(schema.clients.refCode, refCode) });

export const searchClients = (query: string) =>
  db.query.clients.findMany({
    where: like(schema.clients.name, `%${query}%`),
    orderBy: [desc(schema.clients.createdAt)],
  });

export const createClient = async (data: Omit<InsertClient, "refCode">) => {
    const refCode = generateRefCode(data.name);
    const clientData: any = { ...data, refCode };
    if (clientData.agencyDate) clientData.agencyDate = parseLocalDate(clientData.agencyDate);
    if (clientData.agencyExpiryDate) clientData.agencyExpiryDate = parseLocalDate(clientData.agencyExpiryDate);
    const result = await db.insert(schema.clients).values(clientData);
    return { ...result, insertedId: Number(result.lastInsertRowid) || 0, refCode };
};

export const updateClient = async (id: number, data: Partial<InsertClient>) => {
  const updateData: any = { ...data };
  if (updateData.agencyDate) updateData.agencyDate = parseLocalDate(updateData.agencyDate);
  if (updateData.agencyExpiryDate) updateData.agencyExpiryDate = parseLocalDate(updateData.agencyExpiryDate);
  const result = await db.update(schema.clients).set(updateData).where(eq(schema.clients.id, id));
  return { rowsAffected: result.rowsAffected || 1 };
}

export const softDeleteClient = (id: number, userId: number) =>
  db.update(schema.clients).set({ deletedAt: new Date(), deletedBy: userId }).where(eq(schema.clients.id, id));

export const restoreClient = (id: number) =>
  db.update(schema.clients).set({ deletedAt: null, deletedBy: null }).where(eq(schema.clients.id, id));

export const permanentDeleteClient = (id: number) =>
  db.delete(schema.clients).where(eq(schema.clients.id, id));

// =================================================================
// DASHBOARD & OTHERS
// =================================================================
export const getDashboardStats = async () => {
  const totalClients = await db.select({ count: sql<number>`count(*)` }).from(schema.clients).where(sql`deleted_at IS NULL`);
  const statusDistribution = await db.select({ status: schema.clients.status, count: sql<number>`count(*)` }).from(schema.clients).where(sql`deleted_at IS NULL`).groupBy(schema.clients.status);
  const byStatus: Record<string, number> = {};
  statusDistribution.forEach(({ status, count }) => { if (status) byStatus[status] = count; });
  return { total: totalClients[0].count, byStatus };
};

export const getAllSettings = () => db.query.settings.findMany();
export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
  return setting?.value ?? null;
};
export const setSetting = (key: string, value: string) => db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() as any } });

export const getClientDocuments = (clientId: number) => db.query.clientDocuments.findMany({ where: eq(schema.clientDocuments.clientId, clientId), orderBy: [desc(schema.clientDocuments.createdAt)], with: { documentType: true } });
export const createClientDocument = (data: InsertClientDocument) => db.insert(schema.clientDocuments).values(data);
export const deleteClientDocument = (id: number) => db.delete(schema.clientDocuments).where(eq(schema.clientDocuments.id, id));

// =================================================================
// LOGGING & ACTIVITY
// =================================================================
export const insertClientActivityLog = (data: InsertClientActivityLog) => 
  db.insert(schema.clientActivityLog).values(data);

export const getClientActivityLogs = (clientId: number, limit = 50) => 
  db.query.clientActivityLog.findMany({ 
    where: eq(schema.clientActivityLog.clientId, clientId), 
    orderBy: [desc(schema.clientActivityLog.createdAt)], 
    limit,
    with: { client: true, performedByUser: true } 
  });

export const getClientNotes = (clientId: number) => db.query.clientNotes.findMany({ where: eq(schema.clientNotes.clientId, clientId), orderBy: [desc(schema.clientNotes.createdAt)], with: { client: true, createdByUser: true } });

export const getSystemUserByUsername = (username: string) => db.query.systemUsers.findFirst({ where: eq(schema.systemUsers.username, username) });
export const getSystemUserById = (id: number) => db.query.systemUsers.findFirst({ where: eq(schema.systemUsers.id, id) });
export const getAllSystemUsers = () => db.query.systemUsers.findMany({ orderBy: [desc(schema.systemUsers.createdAt)] });
export const createSystemUser = (data: any) => db.insert(schema.systemUsers).values(data);
export const updateSystemUser = (id: number, data: any) => db.update(schema.systemUsers).set(data).where(eq(schema.systemUsers.id, id));
export const deleteSystemUser = (id: number) => db.delete(schema.systemUsers).where(eq(schema.systemUsers.id, id));

export const createSession = (data: any) => db.insert(schema.sessions).values(data);
export const getSession = (id: string) => db.query.sessions.findFirst({ where: eq(schema.sessions.id, id), with: { user: true } });
export const deleteSession = (id: string) => db.delete(schema.sessions).where(eq(schema.sessions.id, id));

export const upsertUser = (data: any) => db.insert(schema.systemUsers).values(data).onConflictDoUpdate({ target: schema.systemUsers.username, set: data });

export async function seedDefaultAdmin() {
  try {
    const users = await getAllSystemUsers();
    if (users.length === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await createSystemUser({
        name: "مدير النظام",
        username: "admin",
        passwordHash,
        role: "admin",
        isActive: true,
      });
      logger.info(`✅ [DB] Default admin created. Env password used: ${!!process.env.ADMIN_PASSWORD}`);
    }
  } catch (error) { logger.error("[DB] Seeding failed:", error); }
}