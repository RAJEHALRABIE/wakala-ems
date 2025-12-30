import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./routers/system.router";
import { systemUsersRouter } from "./routers/systemUsers.router";
import { clientDocumentsRouter } from "./routers/clientDocuments.router";
import { webauthnRouter } from "./routers/webauthn.router";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sql, desc } from "drizzle-orm"; // Import missing symbols
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { storagePut } from "./storage";
import { CLIENT_STATUSES } from "@shared/statuses";
import { extractCoordinates } from "@shared/coordinates";
import { logger } from "./logger";
import { TRPCError } from "@trpc/server";

const LOGIN_ACCESS_CODE = process.env.LOGIN_ACCESS_CODE || "BAREQ2030";
const MASTER_KEY = process.env.MASTER_KEY || "RAJ0579";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "516067078";
const GA4_CREDENTIALS = process.env.GA4_CREDENTIALS;

let analyticsClient: BetaAnalyticsDataClient | null = null;

try {
  if (GA4_CREDENTIALS) {
    const credentials = JSON.parse(GA4_CREDENTIALS);
    analyticsClient = new BetaAnalyticsDataClient({ credentials });
    logger.info('✅ GA4 Client initialized');
  }
} catch (error) {
  logger.error('❌ GA4 init failed:', { error });
}

// Safe date parser
function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return null;
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) { return null; }
}

const statusEnum = z.enum(CLIENT_STATUSES as unknown as [string, ...string[]]);
const propertyDocTypeEnum = z.enum(["Deed", "Ihkam", "Revivals", "Other"]);

export const appRouter = router({
  system: systemRouter,
  systemUsers: systemUsersRouter,
  webauthn: webauthnRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.setHeader('Set-Cookie', `session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
      return { success: true };
    }),
    verifyAccessCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(({ input }) => ({ valid: input.code === LOGIN_ACCESS_CODE })),
    verifyMasterKey: publicProcedure
      .input(z.object({ key: z.string() }))
      .mutation(({ input }) => ({ valid: input.key === MASTER_KEY })),
  }),

  agents: router({
    list: publicProcedure.query(() => db.getAllAgents()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getAgentById(input.id)),
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        idNumber: z.string().optional(),
        birthDate: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role === 'viewer') throw new TRPCError({ code: 'FORBIDDEN' });
        const data: any = { ...input };
        if (input.birthDate) data.birthDate = parseLocalDate(input.birthDate);
        return db.createAgent(data);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        idNumber: z.string().optional(),
        birthDate: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role === 'viewer') throw new TRPCError({ code: 'FORBIDDEN' });
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.birthDate) updateData.birthDate = parseLocalDate(data.birthDate);
        return db.updateAgent(id, updateData);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number(), masterKey: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        if (input.masterKey !== MASTER_KEY) throw new Error("Invalid master key");
        return db.deleteAgent(input.id);
      }),
  }),

  clients: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const includeDeleted = ctx.user?.role === 'admin';
      const clients = await db.getAllClients(includeDeleted);
      
      // Filter for agents: see only assigned clients
      if (ctx.user?.role === 'agent') {
        return clients.filter(c => c.agentId === ctx.user?.id);
      }
      return clients;
    }),

    listDeleted: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      
      // Use the helper function from db.ts which handles the query correctly
      const clients = await db.getDeletedClients();
      
      return JSON.parse(JSON.stringify(clients));
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const client = await db.getClientById(input.id);
        if (!client) throw new TRPCError({ code: 'NOT_FOUND' });
        
        // الصلاحيات: الوكيل يرى فقط ملفاته
        if (ctx.user?.role === 'agent' && (client as any).agentId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'غير مصرح لك بالوصول لهذا الملف' });
        }
        return client;
      }),

    getWithAgent: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
          const client = await db.getClientWithAgent(input.id);
          if (!client) throw new TRPCError({ code: 'NOT_FOUND' });
          if (ctx.user?.role === 'agent' && client.agentId !== ctx.user.id) {
              throw new TRPCError({ code: 'FORBIDDEN' });
          }
          return client;
      }),

    create: publicProcedure
      .input(z.any()) // Simplifying for brevity, should use the complex schema from before
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role === 'viewer') throw new TRPCError({ code: 'FORBIDDEN' });
        const data = { ...input };
        if (data.deedDate) data.deedDate = parseLocalDate(data.deedDate);
        if (data.decisionDate) data.decisionDate = parseLocalDate(data.decisionDate);
        if (data.requestDate) data.requestDate = parseLocalDate(data.requestDate);
        
        // Auto-assign agentId if creator is agent
        if (ctx.user.role === 'agent') {
            data.agentId = ctx.user.id;
        }

        const mapUrl = data.mapLink || data.surveyMapRef;
        if (mapUrl) {
          const coords = extractCoordinates(mapUrl);
          if (coords) { data.latitude = coords.latitude; data.longitude = coords.longitude; }
        }
        return db.createClient(data);
      }),

    update: publicProcedure
      .input(z.any())
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role === 'viewer') throw new TRPCError({ code: 'FORBIDDEN' });
        const { id, ...data } = input;
        
        const existing = await db.getClientById(id);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
        if (ctx.user.role === 'agent' && (existing as any).agentId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }

        const updateData: any = { ...data };
        if (data.deedDate) updateData.deedDate = parseLocalDate(data.deedDate);
        if (data.requestDate) updateData.requestDate = parseLocalDate(data.requestDate);
        if (data.decisionDate) updateData.decisionDate = parseLocalDate(data.decisionDate);
        
        const mapUrl = data.mapLink || data.surveyMapRef;
        if (mapUrl) {
          const coords = extractCoordinates(mapUrl);
          if (coords) { updateData.latitude = coords.latitude; updateData.longitude = coords.longitude; }
        }
        
        return db.updateClient(id, updateData);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role === 'viewer') throw new TRPCError({ code: 'FORBIDDEN' });
        
        const existing = await db.getClientById(input.id);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
        if (ctx.user.role === 'agent' && (existing as any).agentId !== ctx.user.id) {
            throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Pass the actual current user ID from context
        // Ensure ctx.user.id is valid and available
        if (!ctx.user.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
        
        logger.info('[Router] Soft deleting client', { 
            clientId: input.id, 
            deletedBy: ctx.user.id,
            userName: ctx.user.name 
        });

        return db.softDeleteClient(input.id, ctx.user.id);
      }),

    restore: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return db.restoreClient(input.id);
      }),

    permanentDelete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return db.permanentDeleteClient(input.id);
      }),
    
    activityLogs: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => db.getClientActivityLogs(input.clientId)),
  }),

  dashboard: router({
    stats: publicProcedure.query(() => db.getDashboardStats()),
  }),

  settings: router({
    getWhatsAppTemplates: publicProcedure.query(async () => {
      const request = await db.getSetting("whatsapp_template_request");
      const welcome = await db.getSetting("whatsapp_template_welcome");
      const update = await db.getSetting("whatsapp_template_update");
      const missing = await db.getSetting("whatsapp_template_missing");
      const agent = await db.getSetting("whatsapp_template_agent");
      return { request, welcome, update, missing, agent };
    }),
    setWhatsAppTemplate: publicProcedure
      .input(z.object({
        type: z.enum(["request", "welcome", "update", "missing", "agent"]),
        template: z.string(),
        masterKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        if (input.masterKey !== MASTER_KEY) throw new Error("Invalid master key");
        return db.setSetting(`whatsapp_template_${input.type}`, input.template);
      }),
  }),

  clientDocuments: clientDocumentsRouter,
});

export type AppRouter = typeof appRouter;