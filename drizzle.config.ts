import type { Config } from "drizzle-kit";

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  tablesFilter: ["clients"],
  dbCredentials: {
    host: "localhost",
    port: 3306,
    user: "root",
    database: "wakala_ems",
  },
} satisfies Config;
