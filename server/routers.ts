import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { storagePut } from "./storage";
import { CLIENT_STATUSES } from "@shared/statuses";
import { extractCoordinates } from "@shared/coordinates";

const LOGIN_ACCESS_CODE = process.env.LOGIN_ACCESS_CODE || "BAREQ2030";
const MASTER_KEY = process.env.MASTER_KEY || "RAJ0579";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "516067078";
const GA4_CREDENTIALS = process.env.GA4_CREDENTIALS;

let analyticsClient: BetaAnalyticsDataClient | null = null;

try {
  if (GA4_CREDENTIALS) {
    const credentials = JSON.parse(GA4_CREDENTIALS);
    analyticsClient = new BetaAnalyticsDataClient({ credentials });
    console.log('✅ GA4 Client initialized');
  }
} catch (error) {
  console.error('❌ GA4 init failed:', error);
}

// Safe date parser that avoids timezone issues
// When parsing "YYYY-MM-DD", new Date() interprets it as UTC midnight
// which can shift to the previous day in some timezones
// This function parses as local noon to avoid the issue
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
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
      .query(({ input }) => db.getClientById(input.id)),
    getWithAgent: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getClientWithAgent(input.id)),
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
        agencyDate: z.string().optional(),
        propertyDocType: propertyDocTypeEnum.optional(),
        deedNumber: z.string().optional(),
        deedDate: z.string().optional(),
        requestNumber: z.string().optional(),
        requestDate: z.string().optional(),
        propertyDescription: z.string().optional(),
        city: z.string().optional(),
        mapLink: z.string().optional(),
        district: z.string().optional(),
        surveyMapRef: z.string().optional(),
        status: statusEnum.optional(),
        areaSqm: z.number().optional(),
        expectedCompensationPerSqm: z.number().optional(),
        expectedCompensationTotal: z.number().optional(),
        successFee: z.number().optional(),
        baseFeePercentage: z.number().optional(),
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
        const data: any = { ...input };
        if (input.deedDate) data.deedDate = parseLocalDate(input.deedDate);
        if (input.agencyDate) data.agencyDate = parseLocalDate(input.agencyDate);
        if (input.requestDate) data.requestDate = parseLocalDate(input.requestDate);
        
        // Extract coordinates from mapLink or surveyMapRef
        const mapUrl = input.mapLink || input.surveyMapRef;
        if (mapUrl) {
          const coords = extractCoordinates(mapUrl);
          if (coords) {
            data.latitude = coords.latitude.toString();
            data.longitude = coords.longitude.toString();
          }
        }
        
        return db.createClient(data);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        idNumber: z.string().optional(),
        agentId: z.number().nullable().optional(),
        wakalahNumber: z.string().optional(),
        agencyDate: z.string().optional(),
        propertyDocType: propertyDocTypeEnum.optional(),
        deedNumber: z.string().optional(),
        deedDate: z.string().optional(),
        requestNumber: z.string().optional(),
        requestDate: z.string().optional(),
        propertyDescription: z.string().optional(),
        city: z.string().optional(),
        mapLink: z.string().optional(),
        district: z.string().optional(),
        surveyMapRef: z.string().optional(),
        status: statusEnum.optional(),
        areaSqm: z.number().optional(),
        expectedCompensationPerSqm: z.number().optional(),
        expectedCompensationTotal: z.number().optional(),
        successFee: z.number().optional(),
        baseFeePercentage: z.number().optional(),
        missingDocuments: z.string().optional(),
        improvementTypes: z.array(z.string()).nullable().optional(),
        improvementOtherDescription: z.string().nullable().optional(),
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
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.deedDate) updateData.deedDate = parseLocalDate(data.deedDate);
        if (data.agencyDate) updateData.agencyDate = parseLocalDate(data.agencyDate);
        if (data.requestDate) updateData.requestDate = parseLocalDate(data.requestDate);
        
        // Extract coordinates from mapLink or surveyMapRef
        const mapUrl = data.mapLink || data.surveyMapRef;
        if (mapUrl) {
          const coords = extractCoordinates(mapUrl);
          if (coords) {
            updateData.latitude = coords.latitude.toString();
            updateData.longitude = coords.longitude.toString();
          }
        }
        
        return db.updateClient(id, updateData);
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
      return {
        request: request || "مرحباً {اسم_العميل}،\n\nتم تسجيل ملفك برقم: {رمز_الملف}\n\n━━━━━━━━━━━━━━━━\n*قم بتجهيز الوكالة:*\n\n*بيانات الوكيل:*\nالاسم: {اسم_الوكيل}\nرقم الهوية: {سجل_الوكيل}\nتاريخ الميلاد: {تاريخ_ميلاد_الوكيل}\n\n━━━━━━━━━━━━━━━━\n*النطاق:*\n\n• الاستلام: التسليم\n\n• مراجعة جميع الجهات ذات العلاقة وإتمام جميع الإجراءات اللازمة والتوقيع فيما يتطلب ذلك\n\n• يحق للوكيل توكيل الغير\n\n━━━━━━━━━━━━━━━━\n*البنود:*\n\n*الوزارات الحكومية*\n• مراجعة وزارة الطاقة\n• مراجعة وزارة المالية\n\n*الشركات والمؤسسات الأهلية*\n• مراجعة وزارة الطاقة بخصوص نزع الملكية\n\n━━━━━━━━━━━━━━━━\nيمكنكم تتبع طلبكم وتحديثاته على الرابط التالي:\nhttps://wakala-ems.com/track",
        welcome: welcome || "مرحباً {اسم_العميل}،\n\nتم تسجيل الوكالة بنجاح.\n\n*رقم الوكالة:* {رقم_الوكالة}\n*تاريخ الوكالة:* {تاريخ_الوكالة}\n\n━━━━━━━━━━━━━━━━\n*نرجو التكرم بإرسال المستندات التالية:*\n\n١. صورة واضحة من صك الملكية.\n\n٢. صورة من الهوية الوطنية للمالك.\n\n٣. صورة واضحة من الوكالة الشرعية سارية المفعول.\n\n٤. صورة من الهوية الوطنية للوكيل.\n\n٥. الرفع المساحي للعقار (يشمل الاحداثيات).\n\n٦. صورة واضحة من حصر الورثة.\n\n━━━━━━━━━━━━━━━━\nيمكنكم تتبع طلبكم وتحديثاته على الرابط التالي:\nhttps://wakala-ems.com/track",
        update: update || "مرحباً {اسم_العميل}،\n\nتم تحديث حالة ملفك إلى: *{الحالة}*\n\n━━━━━━━━━━━━━━━━\nيمكنكم تتبع طلبكم وتحديثاته على الرابط التالي:\nhttps://wakala-ems.com/track",
        missing: missing || "مرحباً {اسم_العميل}،\n\nنحتاج منك المستندات التالية:\n{المستندات_الناقصة}\n\n━━━━━━━━━━━━━━━━\nيمكنكم تتبع طلبكم وتحديثاته على الرابط التالي:\nhttps://wakala-ems.com/track",
        agent: agent || "مرحباً {اسم_الوكيل}،\nرقم الهوية: {رقم_الهوية}\nتاريخ الميلاد: {تاريخ_الميلاد}\nالهاتف: {هاتف_الوكيل}",
      };
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
      .mutation(({ input }) => db.createDocument(input)),
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
  analytics: router({
    getAgentClicks: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        if (!analyticsClient) {
          return [];
        }

        try {
          const [response] = await analyticsClient.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
            dimensions: [
              { name: 'customEvent:agent_name' },
              { name: 'customEvent:contact_method' },
            ],
            metrics: [{ name: 'eventCount' }],
            dimensionFilter: {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT' as const,
                  value: 'select_agent'
                }
              }
            },
            limit: 100,
          });

          return response.rows?.map(row => ({
            agentName: row.dimensionValues?.[0]?.value || 'Unknown',
            contactMethod: row.dimensionValues?.[1]?.value || 'Unknown',
            clicks: parseInt(row.metricValues?.[0]?.value || '0', 10),
          })) || [];
        } catch (error) {
          console.error('GA4 API Error:', error);
          return [];
        }
      }),

    getKPIs: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        if (!analyticsClient) {
          return { sessions: 0, totalUsers: 0, newUsers: 0, returningUsers: 0, pageViews: 0 };
        }

        try {
          const [response] = await analyticsClient.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
              { name: 'newUsers' },
              { name: 'screenPageViews' },
            ],
          });

          const row = response.rows?.[0];
          if (!row) {
            return { sessions: 0, totalUsers: 0, newUsers: 0, returningUsers: 0, pageViews: 0 };
          }

          const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
          const totalUsers = parseInt(row.metricValues?.[1]?.value || '0', 10);
          const newUsers = parseInt(row.metricValues?.[2]?.value || '0', 10);
          const pageViews = parseInt(row.metricValues?.[3]?.value || '0', 10);

          return {
            sessions,
            totalUsers,
            newUsers,
            returningUsers: totalUsers - newUsers,
            pageViews,
          };
        } catch (error) {
          console.error('GA4 API Error:', error);
          return { sessions: 0, totalUsers: 0, newUsers: 0, returningUsers: 0, pageViews: 0 };
        }
      }),

    getSessionsOverTime: publicProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        if (!analyticsClient) {
          return [];
        }

        try {
          const [response] = await analyticsClient.runReport({
            property: `properties/${GA4_PROPERTY_ID}`,
            dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
            dimensions: [{ name: 'date' }],
            metrics: [
              { name: 'sessions' },
              { name: 'totalUsers' },
            ],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
          });

          return response.rows?.map(row => ({
            date: row.dimensionValues?.[0]?.value || '',
            sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
            users: parseInt(row.metricValues?.[1]?.value || '0', 10),
          })) || [];
        } catch (error) {
          console.error('GA4 API Error:', error);
          return [];
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
