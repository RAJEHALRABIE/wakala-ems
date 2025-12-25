import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { logger } from "../logger";
import { registerClientDocumentRoutes } from "../routers/clientDocuments.router";

export async function startServer(): Promise<void> {
  // ============================================
  // 🔍 DIAGNOSTIC PHASE 1: Environment Check
  // مرحلة التشخيص 1: فحص متغيرات البيئة
  // ============================================
  logger.info("🔍 Step 1: Starting server initialization...");
  logger.info("🔍 DIAGNOSTIC: process.env.PORT = " + process.env.PORT);
  logger.info("🔍 DIAGNOSTIC: NODE_ENV = " + process.env.NODE_ENV);
  logger.info("🔍 DIAGNOSTIC: Working Directory = " + process.cwd());
  
  // ============================================
  // 🔧 PHASE 2: Express & HTTP Server Setup
  // المرحلة 2: إعداد Express وخادم HTTP
  // ============================================
  const app = express();
  app.set('trust proxy', 1);
  const server = createServer(app);
  logger.info("🔍 Step 2: Express app & HTTP server created");
  
  // ============================================
  // 🔧 PHASE 3: Middleware Configuration
  // المرحلة 3: إعداد الـ Middleware
  // ============================================
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Uploads directory setup
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));
  logger.info("🔍 [Server] Serving uploads from: " + uploadsDir);
  
  // ============================================
  // 🔧 PHASE 4: Routes Configuration
  // المرحلة 4: إعداد المسارات
  // ============================================
  registerOAuthRoutes(app);
  
  app.get("/health", (_req, res) => {
    res.status(200).send("OK");
  });
  
  // tRPC API endpoint
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Client Document Routes (Download/Preview)
  registerClientDocumentRoutes(app);
  
  logger.info("🔍 Step 2.5: OAuth, tRPC & Client Document routes registered");
  
  // ============================================
  // 🔧 PHASE 5: Static Files / Vite Integration
  // المرحلة 5: إعداد الملفات الثابتة / دمج Vite
  // ============================================
  if (process.env.NODE_ENV === "development") {
    logger.info("🔧 Using Vite dev server...");
    // Dynamic import to avoid loading vite in production
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    logger.info("🔧 Serving static production files...");
    serveStatic(app);
  }
  logger.info("🔍 Step 3: Static/Vite configured");
  
  // ============================================
  // 🔧 PHASE 6: Port Configuration
  // المرحلة 6: إعداد المنفذ
  // ============================================
  const envPort = process.env.PORT;
  const port = envPort ? parseInt(envPort, 10) : 3000;
  
  if (!envPort) {
    logger.warn("⚠️  WARNING: Railway PORT variable is missing. Defaulting to 3000.");
    logger.warn("💡 TIP: Set PORT in .env file or environment variables");
  } else {
    logger.info("✅ Using PORT from environment: " + port);
  }
  
  // Validate port number
  if (isNaN(port) || port < 1 || port > 65535) {
    logger.error("❌ ERROR: Invalid port number: " + port);
    process.exit(1);
  }
  
  // ============================================
  // 🔧 PHASE 7: Server Timeouts
  // المرحلة 7: إعداد المهلات الزمنية
  // ============================================
  server.setTimeout(300000);      // 5 minutes
  server.headersTimeout = 305000; // 5 minutes + 5 seconds
  logger.info("⏱️  Server timeouts configured: 300s / 305s");
  
  // ============================================
  // 🚀 PHASE 8: Start Listening
  // المرحلة 8: بدء الاستماع
  // ============================================
  logger.info("🔍 Step 4: About to listen on port " + port);
  
  server.listen(port, '0.0.0.0', () => {
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(`✅ Server successfully running on http://0.0.0.0:${port}/`);
    logger.info(`🌐 Local access: http://localhost:${port}/`);
    logger.info(`📱 Network access: http://0.0.0.0:${port}/`);
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("🔍 Step 5: Server is now listening and ready");
    logger.info("🎯 Available endpoints:");
    logger.info("   • Health Check: /health");
    logger.info("   • tRPC API: /api/trpc");
    logger.info("   • Uploads: /uploads");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  });
  
  // ============================================
  // 🔧 Error Handling
  // معالجة الأخطاء
  // ============================================
  server.on('error', (error: NodeJS.ErrnoException) => {
    logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.error("❌ SERVER ERROR OCCURRED", { error });
    
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${port} is already in use`);
      logger.error("💡 Solutions:");
      logger.error("   1. Change PORT in .env file");
      logger.error("   2. Kill the process using this port:");
      logger.error(`      Windows: netstat -ano | findstr :${port}`);
      logger.error(`      Linux/Mac: lsof -i :${port}`);
    } else if (error.code === 'EACCES') {
      logger.error(`❌ Permission denied for port ${port}`);
      logger.error("💡 Try using a port number > 1024");
    } else {
      logger.error("❌ Unexpected error: " + error.message, { error });
    }
    
    logger.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(1);
  });
  
  // Handle process termination
  process.on('SIGTERM', () => {
    logger.info("🛑 SIGTERM signal received: closing HTTP server");
    server.close(() => {
      logger.info("✅ HTTP server closed");
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    logger.info("🛑 SIGINT signal received: closing HTTP server");
    server.close(() => {
      logger.info("✅ HTTP server closed");
      process.exit(0);
    });
  });
  
  logger.info("🔍 Step 6: Error handlers and signal handlers registered");
}
