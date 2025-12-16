import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import dns from "node:dns";

/**
 * System Architect Fix v2:
 * Since 'family: 0' was ignored by the driver, we intervene at the Node.js DNS layer.
 * forcing 'ipv6first' ensures the app resolves 'mysql.railway.internal' correctly.
 */

// 1. Force Node.js to prefer IPv6 resolution (Required for Railway Private Net)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv6first");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL is not defined");
}

// 2. Standard Connection Pool (Removed the ignored 'family' option)
const poolConnection = mysql.createPool({
  uri: connectionString, // Use the URI directly, let the driver parse it
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 5,
  enableKeepAlive: true,
});

export const db = drizzle(poolConnection, { schema, mode: "default" });