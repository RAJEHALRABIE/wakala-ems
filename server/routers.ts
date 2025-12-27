import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./routers/system.router";
import { clientDocumentsRouter } from "./routers/clientDocuments.router";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { storagePut } from "./storage";
import { CLIENT_STATUSES } from "@shared/statuses";
import { extractCoordinates } from "@shared/coordinates";
import { logger } from "./logger";

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

// Safe date parser that avoids timezone issues
function parseLocalDate(dateStr: string | null | undefined): Date | null {
  // التحقق من صحة المدخل
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    logger.warn('[Router] parseLocalDate: invalid input', { dateStr });
    return null;
  }
  
  try {
    logger.info('[Router] parseLocalDate input', { dateStr });
    const parts = dateStr.split('-');
    
    // التحقق من صحة التنسيق
    if (parts.length !== 3) {
      logger.error('[Router] parseLocalDate: invalid format', { dateStr });
      return null;
    }
    
    const [year, month, day] = parts.map(Number);
    
    // التحقق من صحة الأرقام
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      logger.error('[Router] parseLocalDate: NaN values', { dateStr, year, month, day });
      return null;
    }
    
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    // التحقق من صحة التاريخ الناتج
    if (isNaN(date.getTime())) {
      logger.error('[Router] parseLocalDate: invalid date object', { dateStr });
      return null;
    }
    
    logger.info('[Router] parseLocalDate result', { 
      input: dateStr, 
      output: date.toISOString(),
      year, month, day 
    });
    return date;
  } catch (error) {
    logger.error('[Router] parseLocalDate error', { 
      dateStr, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

// Create Zod enum from CLIENT_STATUSES
const statusEnum = z.enum(CLIENT_STATUSES as unknown as [string, ...string[]]);

// Property Document Types
const propertyDocTypeEnum = z.enum(["Deed", "Ihkam", "Revivals", "Other"]);

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
      .mutation(async ({ input }) => {
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
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.birthDate) updateData.birthDate = parseLocalDate(data.birthDate);
        return db.updateAgent(id, updateData);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number(), masterKey: z.string() }))
      .mutation(async ({ input }) => {
        if (input.masterKey !== MASTER_KEY) throw new Error("Invalid master key");
        return db.deleteAgent(input.id);
      }),
  }),

  clients: router({
    list: publicProcedure.query(() => db.getAllClients()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          logger.info('Fetching client by ID', { clientId: input.id });
          const client = await db.getClientById(input.id);
          if (!client) {
            logger.warn('Client not found', { clientId: input.id });
          }
          return client;
        } catch (error) {
          logger.error('Error fetching client by ID', { 
            clientId: input.id, 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined 
          });
          throw error;
        }
      }),
    getWithAgent: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          logger.info('Fetching client with agent', { clientId: input.id });
          const client = await db.getClientWithAgent(input.id);
          if (!client) {
            logger.warn('Client with agent not found', { clientId: input.id });
          }
          return client;
        } catch (error) {
          logger.error('Error fetching client with agent', { 
            clientId: input.id, 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined 
          });
          throw error;
        }
      }),
    activityLogs: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }) => {
        try {
          logger.info('Fetching activity logs for client', { clientId: input.clientId });
          const logs = await db.getClientActivityLogs(input.clientId);
          return logs;
        } catch (error) {
          logger.error('Error fetching activity logs', { 
            clientId: input.clientId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined 
          });
          throw error;
        }
      }),
    getByRefCode: publicProcedure
      .input(z.object({ refCode: z.string() }))
      .query(({ input }) => db.getClientByRefCode(input.refCode)),
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(({ input }) => db.searchClients(input.query)),
    byStatus: publicProcedure
      .input(z.object({ status: z.string() }))
      .query(({ input }) => db.getClientsByStatus(input.status)),
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        idNumber: z.string().optional(),
        agentId: z.number().optional(),
        wakalahNumber: z.string().optional(),
        agencyDate: z.string().nullable().optional(),
        agencyExpiryDate: z.string().nullable().optional(),
        agencyDurationDays: z.number().optional(),
        propertyDocType: propertyDocTypeEnum.optional(),
        deedNumber: z.string().optional(),
        deedDate: z.string().nullable().optional(),
        requestNumber: z.string().optional(),
        requestDate: z.string().nullable().optional(),
        propertyDescription: z.string().optional(),
        city: z.string().optional(),
        mapLink: z.string().optional(),
        district: z.string().optional(),
        surveyMapRef: z.string().optional(),
        status: statusEnum.optional(),
        expropriationType: z.enum(["FULL", "PARTIAL", "IMPROVEMENTS_ONLY"]).optional(),
        decisionNumber: z.string().optional(),
        decisionDate: z.string().nullable().optional(),
        expropriatedArea: z.number().optional(),
        remainingArea: z.number().optional(),
        improvementValue: z.number().optional(),
        areaSqm: z.number().optional(),
        expectedCompensationPerSqm: z.number().optional(),
        expectedCompensationTotal: z.number().optional(),
        successFee: z.number().optional(),
        baseFeePercentage: z.number().optional(),
        damageToRemainingComp: z.number().optional(),
        extraCompRate: z.number().optional(),
        officialCompensationAmount: z.number().optional(),
        missingDocuments: z.string().optional(),
        improvementTypes: z.array(z.string()).optional(),
        improvementOtherDescription: z.string().optional(),
      }).superRefine((data, ctx) => {
        if (data.improvementTypes?.includes("OTHER") && !data.improvementOtherDescription) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["improvementOtherDescription"],
            message: "Improvement description is required when 'OTHER' is selected.",
          });
        }
      }))
      .mutation(async ({ input }) => {
        try {
          logger.info('Creating new client', { clientName: input.name });
          const data: any = { ...input };
        if (input.deedDate) data.deedDate = parseLocalDate(input.deedDate);
        if (input.agencyDate) data.agencyDate = input.agencyDate;
        if (input.agencyExpiryDate) data.agencyExpiryDate = input.agencyExpiryDate;
        if (input.decisionDate) data.decisionDate = parseLocalDate(input.decisionDate);
        if (input.requestDate) data.requestDate = parseLocalDate(input.requestDate);
          
          // Extract coordinates from mapLink or surveyMapRef
          const mapUrl = input.mapLink || input.surveyMapRef;
          if (mapUrl) {
            const coords = extractCoordinates(mapUrl);
            if (coords) {
              data.latitude = coords.latitude;
              data.longitude = coords.longitude;
              logger.info('Extracted coordinates from map URL', { 
                mapUrl, 
                latitude: coords.latitude, 
                longitude: coords.longitude 
              });
            }
          }
          
          // استدعاء createClient من db
          const result = await db.createClient(data);
          logger.info('Client created successfully', { 
            clientId: result.insertedId || 'unknown',
            clientName: input.name 
          });
          return result;
        } catch (error) {
          logger.error('Error creating client', { 
            clientName: input.name,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined 
          });
          throw error;
        }
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        idNumber: z.string().optional(),
        agentId: z.number().nullable().optional(),
        wakalahNumber: z.string().optional(),
        agencyDate: z.string().nullable().optional(),
        agencyExpiryDate: z.string().nullable().optional(),
        agencyDurationDays: z.number().optional(),
        propertyDocType: propertyDocTypeEnum.optional(),
        deedNumber: z.string().optional(),
        deedDate: z.string().nullable().optional(),
        requestNumber: z.string().optional(),
        requestDate: z.string().nullable().optional(),
        propertyDescription: z.string().optional(),
        city: z.string().optional(),
        mapLink: z.string().optional(),
        district: z.string().optional(),
        surveyMapRef: z.string().optional(),
        status: statusEnum.optional(),
        expropriationType: z.enum(["FULL", "PARTIAL", "IMPROVEMENTS_ONLY"]).optional(),
        decisionNumber: z.string().optional(),
        decisionDate: z.string().nullable().optional(),
        expropriatedArea: z.number().optional(),
        remainingArea: z.number().optional(),
        improvementValue: z.number().optional(),
        areaSqm: z.number().optional(),
        expectedCompensationPerSqm: z.number().optional(),
        expectedCompensationTotal: z.number().optional(),
        successFee: z.number().optional(),
        baseFeePercentage: z.number().optional(),
        damageToRemainingComp: z.number().optional(),
        extraCompRate: z.number().optional(),
        officialCompensationAmount: z.number().optional(),
        missingDocuments: z.string().optional(),
        improvementTypes: z.array(z.string()).nullable().optional(),
        improvementOtherDescription: z.string().nullable().optional(),
      }).superRefine((data, ctx) => {
        if (data.improvementTypes?.includes("OTHER") && !data.improvementOtherDescription)
 {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["improvementOtherDescription"],
            message: "Improvement description is required when 'OTHER' is selected.",
          });
        }
      }))
      .mutation(async ({ input }) => {
        logger.info('[Router] RAW update input', { input });
        const { id, ...data } = input;
        const updateData: any = { ...data };
        logger.info('[Router] Client update input', { id, data });
        
        if (data.deedDate !== undefined) {
          updateData.deedDate = data.deedDate ? parseLocalDate(data.deedDate) : null;
          logger.info('[Router] Processed deedDate', { 
            original: data.deedDate, 
            parsed: updateData.deedDate 
          });
        }
        if (data.agencyDate !== undefined) {
          updateData.agencyDate = data.agencyDate;
        }
        if (data.agencyExpiryDate !== undefined) {
          updateData.agencyExpiryDate = data.agencyExpiryDate;
        }
        if (data.requestDate !== undefined) {
          updateData.requestDate = data.requestDate ? parseLocalDate(data.requestDate) : null;
          logger.info('[Router] Processed requestDate', { 
            original: data.requestDate, 
            parsed: updateData.requestDate 
          });
        }
        
        if (data.decisionDate !== undefined) {
          updateData.decisionDate = data.decisionDate ? parseLocalDate(data.decisionDate) : null;
          logger.info('[Router] Processed decisionDate', { 
            original: data.decisionDate, 
            parsed: updateData.decisionDate 
          });
        }
        
        const mapUrl = data.mapLink || data.surveyMapRef;
        if (mapUrl) {
          const coords = extractCoordinates(mapUrl);
          if (coords) {
            updateData.latitude = coords.latitude;
            updateData.longitude = coords.longitude;
          }
        }
        
        logger.info('[Router] Calling db.updateClient', { id, updateData });
        const result = await db.updateClient(id, updateData);
        
        // تسجيل نشاط تحديث العميل
        const { logClientActivity } = await import('./logging');
        await logClientActivity({
          clientId: id,
          actionType: 'STATUS_CHANGE',
          description: 'تم تحديث بيانات العميل',
          meta: { updatedFields: Object.keys(data) },
          performedByUserId: 1, // System Admin
        });
        
        return result;
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number(), masterKey: z.string() }))
      .mutation(async ({ input }) => {
        if (input.masterKey !== MASTER_KEY) throw new Error("Invalid master key");
        return db.deleteClient(input.id);
      }),
  }),

  dashboard: router({
    stats: publicProcedure.query(() => db.getDashboardStats()),
  }),

  settings: router({
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(({ input }) => db.getSetting(input.key)),
    set: publicProcedure
      .input(z.object({ key: z.string(), value: z.string(), masterKey: z.string() }))
      .mutation(async ({ input }) => {
        if (input.masterKey !== MASTER_KEY) throw new Error("Invalid master key");
        return db.setSetting(input.key, input.value);
      }),
    getAll: publicProcedure.query(() => db.getAllSettings()),
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

  documents: router({
    listByClient: publicProcedure
      .input(z.object({ clientId: z.number() }))
      .query(({ input }) => db.getDocumentsByClient(input.clientId)),
    create: publicProcedure
      .input(z.object({
        clientId: z.number(),
        documentType: z.enum(["ownership_deed", "owner_id", "legal_wakalah", "agent_id", "survey_report", "heirs_certificate", "other"]),
        customName: z.string().optional(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      }))
      .mutation(({ input }) => db.addDocument(input)),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected"]).optional(),
        customName: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateDocument(id, data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteDocument(input.id)),
    upload: publicProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
        clientId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `documents/${input.clientId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        return { url, fileKey, fileSize: buffer.length };
      }),
  }),
  clientDocuments: clientDocumentsRouter,
  analytics: router({
    getAgentClicks: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        if (!analyticsClient) return [];
        const [response] = await analyticsClient.runReport({
          property: `properties/${GA4_PROPERTY_ID}`,
          dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
          dimensions: [{ name: 'customEvent:agent_name' }, { name: 'customEvent:contact_method' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'select_agent' } } },
          limit: 100,
        });
        return response.rows?.map(row => ({
          agentName: row.dimensionValues?.[0]?.value || 'Unknown',
          contactMethod: row.dimensionValues?.[1]?.value || 'Unknown',
          clicks: parseInt(row.metricValues?.[0]?.value || '0', 10),
        })) || [];
      }),

    getKPIs: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        if (!analyticsClient) return { sessions: 0, totalUsers: 0, newUsers: 0, returningUsers: 0, pageViews: 0 };
        const [response] = await analyticsClient.runReport({
          property: `properties/${GA4_PROPERTY_ID}`,
          dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'newUsers' }, { name: 'screenPageViews' }],
        });
        const row = response.rows?.[0];
        if (!row) return { sessions: 0, totalUsers: 0, newUsers: 0, returningUsers: 0, pageViews: 0 };
        const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
        const totalUsers = parseInt(row.metricValues?.[1]?.value || '0', 10);
        const newUsers = parseInt(row.metricValues?.[2]?.value || '0', 10);
        const pageViews = parseInt(row.metricValues?.[3]?.value || '0', 10);
        return { sessions, totalUsers, newUsers, returningUsers: totalUsers - newUsers, pageViews };
      }),

    getSessionsOverTime: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        if (!analyticsClient) return [];
        const [response] = await analyticsClient.runReport({
          property: `properties/${GA4_PROPERTY_ID}`,
          dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        });
        return response.rows?.map(row => ({
          date: row.dimensionValues?.[0]?.value || '',
          sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
          users: parseInt(row.metricValues?.[1]?.value || '0', 10),
        })) || [];
      }),
  }),
});

export type AppRouter = typeof appRouter;