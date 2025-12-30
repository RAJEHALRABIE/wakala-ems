import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// تحميل المتغيرات البيئية (للاستخدام المحلي)
dotenv.config();

export default {
  schema: "./drizzle/schema.sqlite.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./wakala-ems.db",
  },
} satisfies Config;