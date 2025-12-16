import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";

/**
 * System Architect Note:
 * This configuration is engineered to solve the Railway Private Networking issue.
 * It forces the driver to handle IPv6 (family: 0) and uses a connection pool for stability.
 */

// 1. Validate the Environment Variable
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("❌ DATABASE_URL is not defined in environment variables");
}

// 2. Safe URL Parsing (Extract credentials manually)
const url = new URL(connectionString);

// 3. Create Connection Pool with IPv6 Support (The Fix)
const poolConnection = mysql.createPool({
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1), // Remove leading slash
  port: parseInt(url.port) || 3306,
  
  // 🟢 CRITICAL FIX: Allow Dual-Stack (IPv4 + IPv6) resolution
  // This solves the 'ETIMEDOUT' or 'Connection Refused' on Railway Private Network
  family: 0, 
  
  // Security: Allow self-signed certs inside Railway's internal network
  ssl: {
    rejectUnauthorized: false,
  },
  
  // Performance: Keep connections alive to prevent cold starts
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 4. Export the Drizzle instance
// mode: "default" ensures standard MySQL behavior
export const db = drizzle(poolConnection, { schema, mode: "default" });