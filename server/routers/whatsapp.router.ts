import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { logger } from "../logger";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * متغيرات القوالب المتاحة
 */
type TemplateVariables = {
  "اسم_العميل"?: string;
  "رمز_الملف"?: string;
  "رقم_الوكالة"?: string;
  "الحالة"?: string;
  "اسم_الوكيل"?: string;
  "المستندات_الناقصة"?: string;
  "جوال_الوكيل"?: string;
  "رقم_الهوية"?: string;
  "المساحة"?: string;
  "المدينة"?: string;
  "تاريخ_الوكالة"?: string;
};

/**
 * دالة لتعويض المتغيرات في النص
 */
function replaceTemplateVariables(template: string, variables: TemplateVariables): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  }
  
  return result;
}

/**
 * دالة لاستخراج متغيرات العميل
 */
async function getClientVariables(clientId: number): Promise<TemplateVariables> {
  try {
    const client = await db.getClientWithAgent(clientId);
    if (!client) {
      throw new Error(`العميل غير موجود: ${clientId}`);
    }

    const variables: TemplateVariables = {
      "اسم_العميل": client.name || "",
      "رمز_الملف": client.refCode || "",
      "رقم_الوكالة": client.wakalahNumber || "",
      "الحالة": client.status || "",
      "رقم_الهوية": client.idNumber || "",
      "المساحة": client.areaSqm?.toString() || "",
      "المدينة": client.city || client.district || "",
      "تاريخ_الوكالة": client.agencyDate ? new Date(client.agencyDate).toLocaleDateString('ar-SA') : "",
    };

    // إضافة بيانات الوكيل إذا كان موجوداً
    if (client.agent) {
      variables["اسم_الوكيل"] = client.agent.name || "";
      variables["جوال_الوكيل"] = client.agent.phone || "";
    }

    // إضافة المستندات الناقصة
    if (client.missingDocuments) {
      variables["المستندات_الناقصة"] = client.missingDocuments;
    }

    return variables;
  } catch (error) {
    logger.error(`فشل في استخراج متغيرات العميل ${clientId}:`, error);
    return {};
  }
}

/**
 * مخطط التحقق لإرسال الرسالة
 */
const sendMessageSchema = z.object({
  clientId: z.number(),
  templateType: z.enum(["request", "welcome", "update", "missing", "agent", "custom"]),
  customTemplate: z.string().optional(),
  customVariables: z.record(z.string()).optional(),
  toPhoneNumber: z.string().optional(),
});

/**
 * أنواع القوالب
 */
const templateLabels: Record<string, string> = {
  request: "طلب الوكالة",
  welcome: "الترحيب",
  update: "تحديث الحالة",
  missing: "المستندات الناقصة",
  agent: "تعيين الوكيل",
};

export const whatsappRouter = router({
  /**
   * الحصول على جميع القوالب
   */
  getTemplates: publicProcedure.query(async () => {
    const templates = await db.getSetting("whatsapp_template_request");
    const welcome = await db.getSetting("whatsapp_template_welcome");
    const update = await db.getSetting("whatsapp_template_update");
    const missing = await db.getSetting("whatsapp_template_missing");
    const agent = await db.getSetting("whatsapp_template_agent");
    
    return {
      request: templates,
      welcome: welcome,
      update: update,
      missing: missing,
      agent: agent,
    };
  }),

  /**
   * تحديث قالب معين
   */
  updateTemplate: publicProcedure
    .input(z.object({
      type: z.enum(["request", "welcome", "update", "missing", "agent"]),
      template: z.string(),
      masterKey: z.string(),
    }))
    .mutation(async ({ input }) => {
      const MASTER_KEY = process.env.MASTER_KEY || "RAJ0579";
      if (input.masterKey !== MASTER_KEY) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'المفتاح الرئيسي غير صحيح' });
      }

      await db.setSetting(`whatsapp_template_${input.type}`, input.template);
      logger.info(`تم تحديث قالب واتساب: ${input.type}`);
      
      return { success: true, message: "تم تحديث القالب بنجاح" };
    }),

  /**
   * إرسال رسالة واتساب
   */
  sendMessage: publicProcedure
    .input(sendMessageSchema)
    .mutation(async ({ input, ctx }) => {
      // التحقق من صلاحية المستخدم
      if (!ctx.user || ctx.user.role === 'viewer') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'غير مصرح لك بإرسال رسائل' });
      }

      try {
        // الحصول على القالب
        let template = input.customTemplate;
        if (!template && input.templateType !== "custom") {
          const templateKey = `whatsapp_template_${input.templateType}`;
          const savedTemplate = await db.getSetting(templateKey);
          if (!savedTemplate) {
            throw new Error(`قالب ${input.templateType} غير موجود`);
          }
          template = savedTemplate;
        }

        if (!template) {
          throw new Error('القالب فارغ');
        }

        // الحصول على متغيرات العميل
        const clientVariables = await getClientVariables(input.clientId);
        
        // دمج المتغيرات المخصصة مع متغيرات العميل
        const allVariables: TemplateVariables = {
          ...clientVariables,
          ...input.customVariables,
        };

        // تعويض المتغيرات في النص
        const message = replaceTemplateVariables(template, allVariables);

        // الحصول على رقم الهاتف الهدف
        let targetPhone = input.toPhoneNumber;
        if (!targetPhone) {
          const client = await db.getClientById(input.clientId);
          if (!client?.phone) {
            throw new Error('لا يوجد رقم هاتف للعميل');
          }
          targetPhone = client.phone;
        }

        // هنا يجب إضافة التكامل مع واجهة برمجة تطبيقات واتساب
        // للمرحلة الحالية، سنقوم فقط بتسجيل الرسالة
        logger.info(`📱 [WhatsApp] تم تجهيز رسالة لإرسالها`, {
          clientId: input.clientId,
          templateType: input.templateType,
          targetPhone: targetPhone,
          messageLength: message.length,
          sentBy: ctx.user.id,
          sentByName: ctx.user.name,
        });

        // تسجيل النشاط
        await db.insertClientActivityLog({
          clientId: input.clientId,
          actionType: 'whatsapp_message_sent',
          description: `تم إرسال رسالة واتساب (${templateLabels[input.templateType] || 'مخصص'})`,
          meta: {
            templateType: input.templateType,
            messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            targetPhone: targetPhone,
            sentBy: ctx.user.id,
          },
          performedByUserId: ctx.user.id,
        });

        return {
          success: true,
          message: "تم تجهيز الرسالة بنجاح",
          data: {
            clientId: input.clientId,
            templateType: input.templateType,
            targetPhone: targetPhone,
            message: message,
            messageLength: message.length,
          },
        };

      } catch (error: any) {
        logger.error(`❌ فشل إرسال رسالة واتساب:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `فشل إرسال الرسالة: ${error.message}`,
        });
      }
    }),

  /**
   * الحصول على تاريخ الرسائل المرسلة للعميل
   */
  getMessageHistory: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const logs = await db.getClientActivityLogs(input.clientId);
      
      return logs
        .filter(log => log.actionType === 'whatsapp_message_sent')
        .map(log => ({
          id: log.id,
          timestamp: log.createdAt,
          templateType: log.meta?.templateType,
          messagePreview: log.meta?.messagePreview,
          targetPhone: log.meta?.targetPhone,
          sentBy: log.performedByUserId,
          sentByName: log.performedByUser?.name,
        }));
    }),

  /**
   * اختبار القالب مع متغيرات عينة
   */
  testTemplate: publicProcedure
    .input(z.object({
      template: z.string(),
      variables: z.record(z.string()).optional(),
    }))
    .query(({ input }) => {
      const variables: TemplateVariables = input.variables || {};
      const result = replaceTemplateVariables(input.template, variables);
      
      return {
        original: input.template,
        variables: variables,
        result: result,
        length: result.length,
      };
    }),
});

export type WhatsappRouter = typeof whatsappRouter;