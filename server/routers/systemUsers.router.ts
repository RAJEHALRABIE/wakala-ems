import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { logger } from "../logger";
import bcrypt from "bcryptjs";

/**
 * tRPC Router لإدارة المستخدمين النظاميين (system_users)
 */

// Schema للتحقق من صحة المدخلات
const createSystemUserSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون على الأقل 3 أحرف").regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يمكن أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف"),
  role: z.enum(['admin', 'user']).default('user'),
});

const updateSystemUserSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين").optional(),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون على الأقل 3 أحرف").regex(/^[a-zA-Z0-9_]+$/).optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف").optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
});

const deleteSystemUserSchema = z.object({
  id: z.number().positive(),
  masterKey: z.string().optional(), // مفتاح رئيسي للحذف (اختياري)
});

// توليد hash لكلمة المرور
const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

export const systemUsersRouter = router({
  // ============================================
  // الحصول على المستخدمين
  // ============================================
  
  /**
   * الحصول على جميع المستخدمين النظاميين
   */
  list: publicProcedure.query(async () => {
    try {
      logger.info('[SystemUsers] Fetching all system users');
      const users = await db.getAllSystemUsers();
      
      // إزالة كلمات المرور من النتائج
      const safeUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
      }));
      
      return safeUsers;
    } catch (error) {
      logger.error('[SystemUsers] Error fetching system users', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }),

  /**
   * الحصول على مستخدم نظامي بواسطة ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number().positive() }))
    .query(async ({ input }) => {
      try {
        logger.info('[SystemUsers] Fetching system user by ID', { userId: input.id });
        const user = await db.getSystemUserById(input.id);
        
        if (!user) {
          throw new Error("المستخدم غير موجود");
        }

        // إزالة كلمة المرور من النتيجة
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      } catch (error) {
        logger.error('[SystemUsers] Error fetching system user by ID', {
          userId: input.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

  // ============================================
  // إدارة المستخدمين
  // ============================================
  
  /**
   * إنشاء مستخدم نظامي جديد
   */
  create: publicProcedure
    .input(createSystemUserSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info('[SystemUsers] Creating new system user', { username: input.username });

        // التحقق من عدم وجود مستخدم بنفس اسم المستخدم
        const existingUser = await db.getSystemUserByUsername(input.username);
        if (existingUser) {
          throw new Error("اسم المستخدم موجود مسبقاً");
        }

        // توليد hash لكلمة المرور
        const passwordHash = await hashPassword(input.password);

        // إنشاء المستخدم
        const result = await db.createSystemUser({
          name: input.name,
          username: input.username,
          passwordHash,
          role: input.role,
        });

        return {
          success: true,
          message: "تم إنشاء المستخدم بنجاح",
          userId: result.insertedId,
        };
      } catch (error) {
        logger.error('[SystemUsers] Error creating system user', {
          username: input.username,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    }),

  /**
   * تحديث مستخدم نظامي
   */
  update: publicProcedure
    .input(updateSystemUserSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info('[SystemUsers] Updating system user', { userId: input.id });

        // التحقق من وجود المستخدم
        const existingUser = await db.getSystemUserById(input.id);
        if (!existingUser) {
          throw new Error("المستخدم غير موجود");
        }

        // التحقق من عدم وجود مستخدم آخر بنفس اسم المستخدم إذا تم تحديثه
        if (input.username && input.username !== existingUser.username) {
          const userWithSameUsername = await db.getSystemUserByUsername(input.username);
          if (userWithSameUsername) {
            throw new Error("اسم المستخدم موجود مسبقاً");
          }
        }

        // تجهيز البيانات للتحديث
        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.username !== undefined) updateData.username = input.username;
        if (input.role !== undefined) updateData.role = input.role;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        // إذا تم تحديث كلمة المرور، إنشاء hash جديد
        if (input.password) {
          updateData.passwordHash = await hashPassword(input.password);
        }

        // إضافة تاريخ التحديث
        updateData.updatedAt = new Date();

        // تحديث المستخدم
        await db.updateSystemUser(input.id, updateData);

        return {
          success: true,
          message: "تم تحديث المستخدم بنجاح",
        };
      } catch (error) {
        logger.error('[SystemUsers] Error updating system user', {
          userId: input.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

  /**
   * حذف مستخدم نظامي
   */
  delete: publicProcedure
    .input(deleteSystemUserSchema)
    .mutation(async ({ input }) => {
      try {
        logger.info('[SystemUsers] Deleting system user', { userId: input.id });

        // التحقق من وجود المستخدم
        const existingUser = await db.getSystemUserById(input.id);
        if (!existingUser) {
          throw new Error("المستخدم غير موجود");
        }

        // منع حذف المستخدم المسؤول الوحيد
        if (existingUser.role === 'admin') {
          const allAdmins = (await db.getAllSystemUsers()).filter(user => user.role === 'admin' && user.isActive !== false);
          if (allAdmins.length <= 1) {
            throw new Error("لا يمكن حذف المسؤول الوحيد في النظام");
          }
        }

        // حذف المستخدم
        await db.deleteSystemUser(input.id);

        return {
          success: true,
          message: "تم حذف المستخدم بنجاح",
        };
      } catch (error) {
        logger.error('[SystemUsers] Error deleting system user', {
          userId: input.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),

  /**
   * التحقق من صحة كلمة مرور المستخدم
   */
  verifyPassword: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        logger.info('[SystemUsers] Verifying password for user', { username: input.username });

        const user = await db.getSystemUserByUsername(input.username);
        if (!user || user.isActive === false) {
          return { valid: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
        }

        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        
        if (isValid) {
          // تحديث تاريخ آخر دخول
          await db.updateSystemUser(user.id, {
            lastLoginAt: new Date(),
          });
          
          return {
            valid: true,
            message: "تم التحقق بنجاح",
            user: {
              id: user.id,
              name: user.name,
              username: user.username,
              role: user.role,
            },
          };
        }

        return { valid: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
      } catch (error) {
        logger.error('[SystemUsers] Error verifying password', {
          username: input.username,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }),
});
