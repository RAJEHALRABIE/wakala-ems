import "dotenv/config";
import express from "express";
import { createServer } from "http";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

export async function startServer(): Promise<void> {
  // Diagnostics
  console.log("🔍 DIAGNOSTIC: process.env.PORT =", process.env.PORT);
  console.log("🔍 NODE_ENV =", process.env.NODE_ENV);
  
  const app = express();

  // -----------------------------------------------------------------------
  // [CRITICAL FIX] Railway Proxy Trust
  // يخبر Express بأنه يعمل خلف Load Balancer آمن (Railway Proxy)
  // هذا ضروري لكي تعمل الـ Cookies الآمنة (Secure: true) بشكل صحيح
  // -----------------------------------------------------------------------
  app.set('trust proxy', 1);

  const server = createServer(app);
  
  // Middleware Configuration
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Static Uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));
  console.log('[Server] Serving uploads from:', uploadsDir);
  
  // Auth Routes
  registerOAuthRoutes(app);
  
  // Health check for Railway
  app.get("/health", (_req, res) => {
    res.status(200).send("OK");
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // Vite / Static Serving Logic
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Server Port Configuration
  const envPort = process.env.PORT;
  const port = envPort ? parseInt(envPort, 10) : 3000;

  if (!envPort) {
    console.warn("⚠️ WARNING: Railway PORT variable is missing. Defaulting to 3000.");
  }

  // Timeouts for large uploads/slow connections
  server.setTimeout(300000); 
  server.headersTimeout = 305000;

  // Start Listener
  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}/`);
  });
}