// ============================================
// نقطة الدخول الرئيسية لخادم wakala-ems
// Main Entry Point for wakala-ems Server
// ============================================

import { startServer } from './_core/index';

// بدء تشغيل الخادم
// Start the server
console.log("🚀 [Entry Point] Initializing wakala-ems server...");
console.log("📍 [Entry Point] Importing startServer from ./_core/index");

startServer()
  .then(() => {
    console.log("✅ [Entry Point] Server initialization completed successfully");
  })
  .catch((error) => {
    console.error("❌ [Entry Point] Failed to start server:");
    console.error(error);
    process.exit(1);
  });
