// استخدام libSQL (SQLite متوافق) مع drizzle-orm
import { drizzle } from "drizzle-orm/libsql";
import { createClient as createLibSQLClient } from "@libsql/client";
import { eq, desc, like, sql, inArray } from "drizzle-orm";
import { schema } from "../drizzle/schema-with-relations";
import type { InsertAgent, InsertClient, InsertDocument, InsertUser, ClientStatus } from "../drizzle/schema.sqlite";
import type { InsertClientDocument, InsertClientActivityLog, InsertClientNote } from "../drizzle/schema-with-relations";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "./logger";

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
          missing_documents TEXT
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

export const getAllClients = () =>
  db.query.clients.findMany({
    orderBy: [desc(schema.clients.createdAt)],
  });

export const getClientById = async (id: number) => {
  try {
    logger.info('[DB] Fetching client by ID', { clientId: id });
    const client = await db.query.clients.findFirst({ where: eq(schema.clients.id, id) });
    if (!client) {
      logger.warn('[DB] Client not found', { clientId: id });
    }
    return client;
  } catch (error) {
    logger.error('[DB] Error fetching client by ID', { 
      clientId: id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined 
    });
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
    
    // قبول agencyExpiryDate مباشرة من الفرونت إند
    const clientData: any = { ...data, refCode };
    
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
  
  // دالة مساعدة لتحويل أي قيمة تاريخ إلى timestamp (بالميللي ثانية) أو null
  const convertToTimestamp = (dateValue: any): number | null => {
    // إذا كانت القيمة فارغة أو غير محددة، إرجاع null
    if (dateValue === null || dateValue === undefined || dateValue === '') {
      return null;
    }
    
    try {
      let date: Date;
      
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // التحقق من أن السلسلة ليست فارغة بعد trim
        const trimmed = dateValue.trim();
        if (trimmed === '') {
          return null;
        }
        date = new Date(trimmed);
      } else if (typeof dateValue === 'number') {
        // القيمة timestamp - تحويل من ميللي ثانية
        date = new Date(dateValue);
      } else {
        // محاولة التحويل العام
        date = new Date(dateValue);
      }
      
      // التحقق من صحة كائن التاريخ
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return null;
      }
      
      return date.getTime();
    } catch (error) {
      logger.error('[DB] Error converting to timestamp', { 
        dateValue, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return null;
    }
  };
  
  // تحويل التواريخ إلى timestamps
  if (updateData.agencyExpiryDate !== undefined) {
    updateData.agencyExpiryDate = convertToTimestamp(updateData.agencyExpiryDate);
    logger.info('[DB] Converted agencyExpiryDate', { 
      clientId: id,
      timestamp: updateData.agencyExpiryDate 
    });
  }
  
  if (updateData.agencyDate !== undefined) {
    updateData.agencyDate = convertToTimestamp(updateData.agencyDate);
  }
  
  if (updateData.deedDate !== undefined) {
    updateData.deedDate = convertToTimestamp(updateData.deedDate);
  }
  
  if (updateData.requestDate !== undefined) {
    updateData.requestDate = convertToTimestamp(updateData.requestDate);
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

export const deleteClient = (id: number) =>
  db.delete(schema.clients).where(eq(schema.clients.id, id));

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
