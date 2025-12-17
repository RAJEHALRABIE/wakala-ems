// حل مشكلة DNS في Railway: إجبار IPv6 أولاً
import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv6first");
}

import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, desc, like, sql } from 'drizzle-orm';
import * as schema from '../drizzle/schema';
import { createId } from '@paralleldrive/cuid2';

// Custom connection logic to handle potential IPv6/DNS issues
function forceIPv4Connection() {
  const url = process.env.DATABASE_URL!;
  const parsed = new URL(url);

  return {
    host: parsed.hostname, // Use hostname and let the driver resolve
    port: parseInt(parsed.port || '3306'),
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
    connectTimeout: 60000,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  };
}

const pool = mysql.createPool(forceIPv4Connection());

pool.getConnection()
  .then(conn => {
    console.log('[DB] ✅ Connection pool created successfully.');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] ❌ Failed to create connection pool:', err.message);
  });

export const db = drizzle(pool, { schema, mode: 'default' });

// =================================================================
// AGENTS
// =================================================================
export const getAllAgents = () => db.query.agents.findMany({ orderBy: [desc(schema.agents.createdAt)] });
export const getAgentById = (id: number) => db.query.agents.findFirst({ where: eq(schema.agents.id, id) });
export const createAgent = (data: schema.InsertAgent) => db.insert(schema.agents).values(data);
export const updateAgent = (id: number, data: Partial<schema.InsertAgent>) => db.update(schema.agents).set(data).where(eq(schema.agents.id, id));
export const deleteAgent = (id: number) => db.delete(schema.agents).where(eq(schema.agents.id, id));

// =================================================================
// CLIENTS
// =================================================================
/**
 * Generates a unique reference code for a client.
 * Format: Two letters from the name + 6 random alphanumeric chars.
 * Example: 'SA1B2C3D'
 */
const generateRefCode = (name: string): string => {
  const namePart = name.trim().slice(0, 2).toUpperCase().padEnd(2, 'X');
  const randomPart = createId().slice(0, 6).toUpperCase();
  return `${namePart}${randomPart}`;
};

export const getAllClients = () => db.query.clients.findMany({
  orderBy: [desc(schema.clients.createdAt)],
  with: { agent: true } // Assuming a relation `agent` is defined
});

export const getClientById = (id: number) => db.query.clients.findFirst({ where: eq(schema.clients.id, id) });
export const getClientWithAgent = (id: number) => db.query.clients.findFirst({ where: eq(schema.clients.id, id), with: { agent: true } });
export const getClientByRefCode = (refCode: string) => db.query.clients.findFirst({ where: eq(schema.clients.refCode, refCode) });

export const searchClients = (query: string) => db.query.clients.findMany({
  where: like(schema.clients.name, `%${query}%`),
  orderBy: [desc(schema.clients.createdAt)]
});

export const getClientsByStatus = (status: string) => db.query.clients.findMany({
  where: eq(schema.clients.status, status as schema.ClientStatus),
  orderBy: [desc(schema.clients.createdAt)]
});

export const createClient = (data: Omit<schema.InsertClient, 'refCode'>) => {
  const refCode = generateRefCode(data.name);
  return db.insert(schema.clients).values({ ...data, refCode });
};

export const updateClient = (id: number, data: Partial<schema.InsertClient>) => db.update(schema.clients).set(data).where(eq(schema.clients.id, id));
export const deleteClient = (id: number) => db.delete(schema.clients).where(eq(schema.clients.id, id));

// =================================================================
// DASHBOARD
// =================================================================
export const getDashboardStats = async () => {
  const totalClients = await db.select({ count: sql<number>`count(*)` }).from(schema.clients);
  const totalAgents = await db.select({ count: sql<number>`count(*)` }).from(schema.agents);
  // Add more stats as needed, e.g., by status
  return {
    totalClients: totalClients[0].count,
    totalAgents: totalAgents[0].count,
  };
};

// =================================================================
// SETTINGS
// =================================================================
export const getAllSettings = () => db.query.settings.findMany();
export const getSetting = async (key: string): Promise<string | null> => {
    const setting = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
    return setting?.value ?? null;
};
export const setSetting = (key: string, value: string) => db.insert(schema.settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });

// =================================================================
// DOCUMENTS
// =================================================================
export const getDocumentsByClient = (clientId: number) => db.query.documents.findMany({
  where: eq(schema.documents.clientId, clientId),
  orderBy: [desc(schema.documents.uploadedAt)]
});

export const createDocument = (data: schema.InsertDocument) => db.insert(schema.documents).values(data);
export const updateDocument = (id: number, data: Partial<schema.InsertDocument>) => db.update(schema.documents).set(data).where(eq(schema.documents.id, id));
export const deleteDocument = (id: number) => db.delete(schema.documents).where(eq(schema.documents.id, id));

// =================================================================
// USERS
// =================================================================
export const getUserByOpenId = (openId: string) => db.query.users.findFirst({ where: eq(schema.users.openId, openId) });

export const upsertUser = (data: schema.InsertUser) => db.insert(schema.users)
  .values(data)
  .onDuplicateKeyUpdate({
    set: {
      name: data.name,
      email: data.email,
      loginMethod: data.loginMethod,
      lastSignedIn: data.lastSignedIn
    }
  });
