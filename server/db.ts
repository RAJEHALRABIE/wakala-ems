import { eq, desc, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, InsertClient, settings, InsertSetting, agents, InsertAgent, documents, InsertDocument } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Queries ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Agent Queries ============

export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agents).orderBy(desc(agents.createdAt));
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result[0] || null;
}

export async function createAgent(data: InsertAgent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agents).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateAgent(id: number, data: Partial<InsertAgent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agents).set(data).where(eq(agents.id, id));
  return await getAgentById(id);
}

export async function deleteAgent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(agents).where(eq(agents.id, id));
  return { success: true };
}

// ============ Client Queries ============

export async function getAllClients() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] || null;
}

export async function getClientWithAgent(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const client = await getClientById(id);
  if (!client) return null;
  
  let agent = null;
  if (client.agentId) {
    agent = await getAgentById(client.agentId);
  }
  
  return { ...client, agent };
}

export async function getClientByRefCode(refCode: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(eq(clients.refCode, refCode)).limit(1);
  return result[0] || null;
}

export async function searchClients(query: string) {
  const db = await getDb();
  if (!db) return [];
  const searchTerm = `%${query}%`;
  return await db.select().from(clients).where(
    or(
      like(clients.name, searchTerm),
      like(clients.phone, searchTerm),
      like(clients.refCode, searchTerm),
      like(clients.idNumber, searchTerm)
    )
  ).orderBy(desc(clients.createdAt));
}

export async function getClientsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(clients).where(eq(clients.status, status as any)).orderBy(desc(clients.createdAt));
}

async function generateRefCode(): Promise<string> {
  const db = await getDb();
  if (!db) return `RSA${Date.now().toString().slice(-3)}`;
  
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(clients);
  const count = result[0]?.count || 0;
  const nextNum = count + 1;
  return `RSA${String(nextNum).padStart(3, '0')}`;
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const refCode = await generateRefCode();
  const clientData = { ...data, refCode };
  
  const result = await db.insert(clients).values(clientData);
  return { id: Number(result[0].insertId), ...clientData };
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
  return await getClientById(id);
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(eq(documents.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  return { success: true };
}

// ============ Dashboard Stats ============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { total: 0, byStatus: {}, totalArea: 0, totalCompensation: 0 };
  
  const allClients = await getAllClients();
  const total = allClients.length;
  
  const byStatus: Record<string, number> = {};
  let totalArea = 0;
  let totalCompensation = 0;
  
  for (const client of allClients) {
    byStatus[client.status] = (byStatus[client.status] || 0) + 1;
    totalArea += client.areaSqm || 0;
    totalCompensation += client.expectedCompensationTotal || 0;
  }
  
  return { total, byStatus, totalArea, totalCompensation };
}

// ============ Settings Queries ============

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value || null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  return { key, value };
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(settings);
}

// ============ Document Queries ============

export async function getDocumentsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(documents).where(eq(documents.clientId, clientId)).orderBy(desc(documents.uploadedAt));
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateDocument(id: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set(data).where(eq(documents.id, id));
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(eq(documents.id, id));
  return { success: true };
}
