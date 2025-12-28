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
    // التحقق من الأعمدة المفقودة في جدول system_users
    try {
        await libsqlClient.execute("ALTER TABLE system_users ADD COLUMN phone TEXT");
        logger.info("[DB] Added phone column to system_users");
    } catch(e) {}
    try {
        await libsqlClient.execute("ALTER TABLE system_users ADD COLUMN email TEXT");
        logger.info("[DB] Added email column to system_users");
    } catch(e) {}

    // التحقق من الأعمدة المفقودة في جدول clients
    try {
        await libsqlClient.execute("ALTER TABLE clients ADD COLUMN deleted_at DATETIME");
        logger.info("[DB] Added deleted_at column to clients");
    } catch(e) {}
    try {
        await libsqlClient.execute("ALTER TABLE clients ADD COLUMN deleted_by INTEGER");
        logger.info("[DB] Added deleted_by column to clients");
    } catch(e) {}

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

        // CLIENTS – متطابق مع schema.ts قدر الإمكان
        `CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,

          -- Basic Info
          name TEXT NOT NULL,
          phone TEXT,
          id_number TEXT,

          -- Agent Reference
          agent_id INTEGER,

          -- Wakalah Info (Agency)
          wakalah_number TEXT,
          agency_date DATE,
          agency_issue_date DATE,
          agency_duration_days INTEGER,
          agency_end_date DATE,
          agency_expiry_date DATETIME,

          -- Property Document Type
          property_doc_type TEXT DEFAULT 'Deed',

          -- Deed
          deed_number TEXT,
          deed_date DATE,
          deed_area_sqm REAL,

          -- Ihkam
          request_number TEXT,
          request_date DATE,

          -- Revivals / Other
          property_description TEXT,

          -- Expropriation Details
          expropriation_type TEXT DEFAULT 'FULL',
          decision_number TEXT,
          decision_date DATE,
          expropriated_area REAL,
          remaining_area REAL,
          improvement_type TEXT,
          improvement_value REAL,
          improvement_types TEXT,
          improvement_other_description TEXT,

          -- Location
          city TEXT,
          map_link TEXT,
          latitude REAL,
          longitude REAL,
          district TEXT,
          survey_map_ref TEXT,

          -- Status
          status TEXT DEFAULT 'New' NOT NULL,

          -- Financials
          area_sqm REAL,
          expected_compensation_per_sqm REAL,
          possession_ratio REAL DEFAULT 1.00,
          expected_compensation_total REAL,
          success_fee REAL,
          base_fee_percentage REAL DEFAULT 0.00,

          -- Phase 2 Financial Fields
          damage_to_remaining_comp REAL,
          extra_comp_rate REAL,
          official_compensation_amount REAL,
          valuation_document_id TEXT,

          -- Reference Code
          ref_code TEXT,

          -- Missing Documents
          missing_documents TEXT,

          -- Soft Delete
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

// App Start Diagnostics: سجلات تشخيصية عند بدء الاتصال بقاعدة البيانات
console.info('[DB DIAGNOSTIC] Starting database connection diagnostics...');
console.info('[DB DIAGNOSTIC] SQLite file path: file:./wakala-ems.db');
console.info('[DB DIAGNOSTIC] Working directory:', process.cwd());

// تهيئة قاعدة البيانات عند البدء
initializeDatabase();

// التحقق من الاتصال الفعلي بقاعدة البيانات
async function testDatabaseConnection() {
  try {
    const testResult = await libsqlClient.execute('SELECT 1 as test');
    console.info('[DB DIAGNOSTIC] Database connection test successful:', testResult);
    console.info('[DB DIAGNOSTIC] SQLite connection established successfully');
  } catch (error) {
    console.error('[DB DIAGNOSTIC] Database connection test failed:', error);
  }
}

testDatabaseConnection();

// إنشاء كائن drizzle للاستعلامات
export const db = drizzle(libsqlClient, { schema });
console.info('[DB DIAGNOSTIC] Drizzle ORM initialized with schema');

// Helper: Safe date parser that avoids timezone issues
function parseLocalDate(dateStr: any): Date | null {
  // If it's already a Date object, return it
  if (dateStr instanceof Date) return dateStr;

  // التحقق من صحة المدخل
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return null;
  }
  
  try {
    // Handle ISO string or YYYY-MM-DD (take first part)
    const cleanDateStr = dateStr.split('T')[0];
    const parts = cleanDateStr.split('-');
    
    // التحقق من صحة التنسيق
    if (parts.length !== 3) {
      return null;
    }
    
    const [year, month, day] = parts.map(Number);
    
    // التحقق من صحة الأرقام
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }
    
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    // التحقق من صحة التاريخ الناتج
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
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
// توليد كود مرجعي
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
    logger.info('[DB] Fetching client by ID (raw SQL)', { clientId: id });

    const result = await libsqlClient.execute({
      sql: `
        SELECT
          id,
          created_at as createdAt,
          updated_at as updatedAt,
          deleted_at as deletedAt,
          name,
          phone,
          id_number as idNumber,
          agent_id as agentId,
          wakalah_number as wakalahNumber,
          agency_date as agencyDate,
          agency_expiry_date as agencyExpiryDate,
          property_doc_type as propertyDocType,
          deed_number as deedNumber,
          deed_date as deedDate,
          deed_area_sqm as deedAreaSqm,
          request_number as requestNumber,
          request_date as requestDate,
          property_description as propertyDescription,
          expropriation_type as expropriationType,
          decision_number as decisionNumber,
          decision_date as decisionDate,
          expropriated_area as expropriatedArea,
          remaining_area as remainingArea,
          improvement_type as improvementType,
          improvement_value as improvementValue,
          improvement_types as improvementTypes,
          improvement_other_description as improvementOtherDescription,
          city,
          map_link as mapLink,
          latitude,
          longitude,
          district,
          survey_map_ref as surveyMapRef,
          status,
          area_sqm as areaSqm,
          expected_compensation_per_sqm as expectedCompensationPerSqm,
          possession_ratio as possessionRatio,
          expected_compensation_total as expectedCompensationTotal,
          success_fee as successFee,
          base_fee_percentage as baseFeePercentage,
          damage_to_remaining_comp as damageToRemainingComp,
          extra_comp_rate as extraCompRate,
          official_compensation_amount as officialCompensationAmount,
          valuation_document_id as valuationDocumentId,
          ref_code as refCode,
          missing_documents as missingDocuments,
          agency_issue_date as agencyIssueDate,
          agency_duration_days as agencyDurationDays,
          agency_end_date as agencyEndDate,
          deleted_at as deletedAt,
          deleted_by as deletedBy
        FROM clients
        WHERE id = ?
      `,
      args: [id]
    });

    const row = result.rows[0];

    if (!row) {
      logger.warn('[DB] Client not found', { clientId: id });
      return null;
    }

    // JSON fields processing if needed
    // if (typeof row.improvementTypes === 'string') {
    //     try { row.improvementTypes = JSON.parse(row.improvementTypes); } catch {}
    // }

    return row;
  } catch (error) {
    logger.error('[DB] Error fetching client by ID (raw SQL)', { clientId: id, error });
    throw error;
  }
};

export const getClientWithAgent = async (id: number) => {
  try {
    logger.info('[DB] Fetching client with agent', { clientId: id });
    const client = await db.query.clients.findFirst({
      where: eq(schema.clients.id, id),
      with: { agent: true },
    });
    if (!client) {
      logger.warn('[DB] Client with agent not found', { clientId: id });
    }
    return client;
  } catch (error) {
    logger.error('[DB] Error fetching client with agent', { 
      clientId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    throw error;
  }
};

export const getClientByRefCode = (refCode: string) =>
  db.query.clients.findFirst({ where: eq(schema.clients.refCode, refCode) });

export const searchClients = (query: string) =>
  db.query.clients.findMany({
    where: like(schema.clients.name, `%${query}%`),
    orderBy: [desc(schema.clients.createdAt)],
  });

export const getClientsByStatus = (status: string) =>
  db.query.clients.findMany({
    where: eq(schema.clients.status, status as ClientStatus),
    orderBy: [desc(schema.clients.createdAt)],
  });

export const createClient = async (
  data: Omit<InsertClient, "refCode">,
) => {
  try {
    const refCode = generateRefCode(data.name);
    logger.info('[DB] Creating client', { clientName: data.name, refCode });
    
    const clientData: any = { ...data, refCode };

    // Ensure dates are parsed correctly
    if (clientData.agencyDate) {
      clientData.agencyDate = parseLocalDate(clientData.agencyDate);
    }

    if (clientData.agencyExpiryDate) {
      clientData.agencyExpiryDate = parseLocalDate(clientData.agencyExpiryDate);
    }
    
    const result = await db.insert(schema.clients).values(clientData);
    
    // libSQL returns result with lastInsertRowid
    const insertedId = Number(result.lastInsertRowid) || 0;
    logger.info('[DB] Client created successfully', { 
      insertedId, 
      clientName: data.name 
    });
    
    return { 
      ...result, 
      insertedId,
      refCode 
    };
  } catch (error) {
    logger.error('[DB] Error creating client', { 
      clientName: data.name,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    throw error;
  }
};

export const updateClient = async (
  id: number,
  data: Partial<InsertClient>,
) => {
  // نسخ البيانات للتحويل
  const updateData: any = { ...data };
  
  // Ensure dates are parsed correctly
  if (updateData.agencyDate) {
    updateData.agencyDate = parseLocalDate(updateData.agencyDate);
  }

  if (updateData.agencyExpiryDate) {
    const original = updateData.agencyExpiryDate;
    updateData.agencyExpiryDate = parseLocalDate(updateData.agencyExpiryDate);
    logger.info('[DB] agencyExpiryDate conversion', { original, parsed: updateData.agencyExpiryDate });
  }
  
  logger.info('[DB] Executing update with data', {
    clientId: id,
    agencyIssueDate: updateData.agencyIssueDate,
    agencyDate: updateData.agencyDate,
    agencyExpiryDate: updateData.agencyExpiryDate
  });
  
  try {
    const result = await db
      .update(schema.clients)
      .set(updateData)
      .where(eq(schema.clients.id, id));
    
    logger.info('[DB] Update successful', { 
      clientId: id,
      result: result 
    });
    
    // إرجاع نتيجة متوافقة مع tRPC
    return {
      columns: [],
      columnTypes: [],
      rows: [],
      rowsAffected: result.rowsAffected || 1,
      lastInsertRowid: "0"
    };
  } catch (error) {
    logger.error('[DB] Update failed', { 
      clientId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
    throw error;
  }
}

export const softDeleteClient = (id: number, userId: number) =>
  db.update(schema.clients)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(eq(schema.clients.id, id));

export const restoreClient = (id: number) =>
  db.update(schema.clients)
    .set({ deletedAt: null, deletedBy: null })
    .where(eq(schema.clients.id, id));

export const permanentDeleteClient = (id: number) =>
  db.delete(schema.clients).where(eq(schema.clients.id, id));

export const deleteClient = (id: number) =>
  db.delete(schema.clients).where(eq(schema.clients.id, id));

// ... (Rest of the file remains the same)

// =================================================================
// DASHBOARD
// =================================================================
export const getDashboardStats = async () => {
  // إجمالي العملاء (جميع العملاء المسجلين في النظام بدون فلاتر)
  const totalClients = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.clients);
  
  // إجمالي المساحة المنزوعة: مجموع مساحة العقار المنزوع لجميع الملفات
  // باستخدام expropriated_area للحالات الجزئية و area_sqm للحالات الكاملة
  const totalAreaResult = await db
    .select({ totalArea: sql<number>`sum(
      CASE 
        WHEN expropriation_type = 'PARTIAL' THEN expropriated_area
        WHEN expropriation_type = 'FULL' THEN area_sqm
        ELSE 0 
      END
    )` })
    .from(schema.clients);
  
  // إجمالي التعويضات المتوقعة: مجموع التعويضات المتوقعة لجميع الملفات
  // باستخدام نفس معادلة صفحة تفاصيل العميل
  const totalCompensationResult = await db
    .select({ totalCompensation: sql<number>`sum(
      CASE
        WHEN expropriation_type = 'IMPROVEMENTS_ONLY' THEN improvement_value
        WHEN expropriation_type = 'PARTIAL' THEN 
          (expropriated_area * expected_compensation_per_sqm * possession_ratio) + COALESCE(improvement_value, 0)
        WHEN expropriation_type = 'FULL' THEN 
          (area_sqm * expected_compensation_per_sqm * possession_ratio) + COALESCE(improvement_value, 0)
        ELSE 0
      END
    )` })
    .from(schema.clients);
  
  // عدد الملفات بالنظام (نفس إجمالي العملاء)
  const totalFiles = totalClients[0].count;
  
  // توزيع الحالات: عدد الملفات في كل حالة
  const statusDistribution = await db
    .select({
      status: schema.clients.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.clients)
    .groupBy(schema.clients.status);

  // تحويل النتيجة إلى object
  const byStatus: Record<string, number> = {};
  statusDistribution.forEach(({ status, count }) => {
    if (status) {
      byStatus[status] = count;
    }
  });

  return {
    total: totalClients[0].count,
    totalArea: totalAreaResult[0].totalArea || 0,
    totalCompensation: totalCompensationResult[0].totalCompensation || 0,
    totalFiles,
    byStatus,
  };
};

// =================================================================
// SETTINGS
// =================================================================
export const getAllSettings = () => db.query.settings.findMany();

export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await db.query.settings.findFirst({
    where: eq(schema.settings.key, key),
  });
  return setting?.value ?? null;
};

export const setSetting = (key: string, value: string) => {
  return db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date() as any },
    });
};

// =================================================================
// DOCUMENTS (Legacy)
// =================================================================
export const getDocumentsByClient = (clientId: number) =>
  db.query.documents.findMany({
    where: eq(schema.documents.clientId, clientId),
    orderBy: [desc(schema.documents.uploadedAt)],
  });

export const addDocument = (data: InsertDocument) =>
  db.insert(schema.documents).values(data);

export const updateDocument = (
  id: number,
  data: Partial<InsertDocument>,
) =>
  db
    .update(schema.documents)
    .set(data)
    .where(eq(schema.documents.id, id));

export const deleteDocument = (id: number) =>
  db.delete(schema.documents).where(eq(schema.documents.id, id));

// =================================================================
// CLIENT DOCUMENTS (New System)
// =================================================================
export const getClientDocuments = (clientId: number) =>
  db.query.clientDocuments.findMany({
    where: eq(schema.clientDocuments.clientId, clientId),
    orderBy: [desc(schema.clientDocuments.createdAt)],
    with: {
      documentType: true,
    },
  });

export const getClientDocument = (id: number) =>
  db.query.clientDocuments.findFirst({
    where: eq(schema.clientDocuments.id, id),
    with: {
      documentType: true,
    },
  });

export const getClientDocumentByType = (clientId: number, documentTypeId: string) =>
  db.query.clientDocuments.findFirst({
    where: (cd, { and, eq }) => and(
      eq(cd.clientId, clientId),
      eq(cd.documentTypeId, documentTypeId)
    ),
  });

export const createClientDocument = (data: InsertClientDocument) =>
  db.insert(schema.clientDocuments).values(data);

export const updateClientDocument = (
  id: number,
  data: Partial<InsertClientDocument>,
) =>
  db
    .update(schema.clientDocuments)
    .set(data)
    .where(eq(schema.clientDocuments.id, id));

export const deleteClientDocument = (id: number) =>
  db.delete(schema.clientDocuments).where(eq(schema.clientDocuments.id, id));

// =================================================================
// CLIENT ACTIVITY LOG
// =================================================================
export const insertClientActivityLog = (data: InsertClientActivityLog) =>
  db.insert(schema.clientActivityLog).values(data);

export const getClientActivityLogs = (clientId: number, limit = 50) =>
  db.query.clientActivityLog.findMany({
    where: eq(schema.clientActivityLog.clientId, clientId),
    orderBy: [desc(schema.clientActivityLog.createdAt)],
    limit,
    with: {
      client: true,
      performedByUser: true,
    },
  });

// =================================================================
// CLIENT NOTES
// =================================================================
export const insertClientNote = (data: InsertClientNote) =>
  db.insert(schema.clientNotes).values(data);

export const getClientNotes = (clientId: number) =>
  db.query.clientNotes.findMany({
    where: eq(schema.clientNotes.clientId, clientId),
    orderBy: [desc(schema.clientNotes.createdAt)],
    with: {
      client: true,
      createdByUser: true,
    },
  });

export const getClientNoteById = (id: number) =>
  db.query.clientNotes.findFirst({
    where: eq(schema.clientNotes.id, id),
    with: {
      client: true,
      createdByUser: true,
    },
  });

export const updateClientNote = (id: number, data: Partial<InsertClientNote>) =>
  db.update(schema.clientNotes).set(data).where(eq(schema.clientNotes.id, id));

export const deleteClientNote = (id: number) =>
  db.delete(schema.clientNotes).where(eq(schema.clientNotes.id, id));

// =================================================================
// USERS
// =================================================================
export const getUserByOpenId = (openId: string) =>
  db.query.users.findFirst({ where: eq(schema.users.openId, openId) });

// =================================================================
// SYSTEM USERS (Internal auth)
// =================================================================
export const getSystemUserByUsername = (username: string) =>
  db.query.systemUsers.findFirst({
    where: eq(schema.systemUsers.username, username),
  });

export const getSystemUserById = (id: number) =>
  db.query.systemUsers.findFirst({
    where: eq(schema.systemUsers.id, id),
  });

export const getAllSystemUsers = () =>
  db.query.systemUsers.findMany({
    orderBy: [desc(schema.systemUsers.createdAt)],
  });

export const createSystemUser = (data: any) =>
  db.insert(schema.systemUsers).values(data);

export const updateSystemUser = (id: number, data: any) =>
  db.update(schema.systemUsers).set(data).where(eq(schema.systemUsers.id, id));

export const deleteSystemUser = (id: number) =>
  db.delete(schema.systemUsers).where(eq(schema.systemUsers.id, id));

// =================================================================
// SESSIONS
// =================================================================
export const createSession = (data: any) =>
  db.insert(schema.sessions).values(data);

export const getSession = (id: string) =>
  db.query.sessions.findFirst({
    where: eq(schema.sessions.id, id),
    with: { user: true },
  });

export const deleteSession = (id: string) =>
  db.delete(schema.sessions).where(eq(schema.sessions.id, id));

export const upsertUser = (data: InsertUser) => {
  return db
    .insert(schema.users)
    .values(data)
    .onConflictDoUpdate({
      target: schema.users.openId,
      set: {
        name: data.name,
        email: data.email,
        loginMethod: data.loginMethod,
        lastSignedIn: data.lastSignedIn,
        updatedAt: new Date() as any,
      },
    });
};

// =================================================================
// SEEDING
// =================================================================
export async function seedDefaultAdmin() {
  try {
    const users = await getAllSystemUsers();
    if (users.length === 0) {
      logger.info("[DB] No system users found. Seeding default admin...");
      
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const isDefault = !process.env.ADMIN_PASSWORD;
      
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await createSystemUser({
        name: "مدير النظام",
        username: "admin",
        passwordHash,
        role: "admin",
        isActive: true,
        needsPasswordChange: isDefault, // Force change if using default
      });
      
      if (isDefault) {
        logger.warn("⚠️ [DB] Default admin user created with INSECURE password 'admin123'");
        logger.warn("💡 [DB] Set ADMIN_PASSWORD environment variable to secure your installation.");
      } else {
        logger.info("✅ [DB] Default admin user created with password from environment.");
      }
    }
  } catch (error) {
    logger.error("[DB] Seeding failed:", { error });
  }
}