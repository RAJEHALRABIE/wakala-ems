import * as db from "./db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

async function seed() {
  try {
    const adminUsername = "admin";
    const existing = await db.getSystemUserByUsername(adminUsername);
    
    if (!existing) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.createSystemUser({
        name: "مدير النظام",
        username: adminUsername,
        passwordHash,
        role: "admin",
        isActive: true,
      });
      console.log("✅ Created default admin user (admin / admin123)");
    } else {
      console.log("ℹ️ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
}

seed();