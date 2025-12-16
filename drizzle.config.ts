import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// تحميل المتغيرات البيئية (للاستخدام المحلي)
dotenv.config();

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "mysql",
  dbCredentials: {
    // التغيير الحاسم: استخدام المتغير البيئي بدلاً من الثوابت
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;