import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { logger } from "../logger";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

/**
 * tRPC Router لإدارة المستخدمين والمصادقة
 */

const passwordSchema = z.string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)")
  .regex(/[a-z]/, "يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)")
  .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل (0-9)")
  .regex(/[!@#$%^&*]/, "يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*)")

const createUserSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  username: z.string().min(3, "اسم المستخدم يجب أن يكون على الأقل 3 أحرف"),
  password: passwordSchema,
  role: z.enum(['admin', 'agent', 'viewer']).default('agent'),
  phone: z.string().optional(),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
});

const updateUserSchema = z.object({
  id: z.number(),
  name: z.string().min(2).optional(),
  username: z.string().min(3).optional(),
  role: z.enum(['admin', 'agent', 'viewer']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const systemUsersRouter = router({
  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getSystemUserByUsername(input.username);
      if (!user || user.isActive === false) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'بيانات الدخول غير صحيحة' });

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'بيانات الدخول غير صحيحة' });

      const token = (globalThis as any).crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.createSession({ id: token, userId: user.id, expiresAt });
      await db.updateSystemUser(user.id, { lastLoginAt: new Date() });

      // تعيين الكوكيز مع دعم HTTPS في بيئة الإنتاج
      const isProd = process.env.NODE_ENV === 'production';
      const cookieParts = [
        `session_token=${token}`,
        'HttpOnly',
        'Path=/',
        `Max-Age=${7 * 24 * 60 * 60}`,
        isProd ? 'SameSite=None' : 'SameSite=Lax',
      ];
      
      if (isProd) {
        cookieParts.push('Secure');
      }

      ctx.res.setHeader('Set-Cookie', cookieParts.join('; '));

      return { 
        success: true, 
        user: { 
          id: user.id, 
          name: user.name, 
          username: user.username, 
          role: user.role
        } 
      };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookies = ctx.req.headers.cookie;
    if (cookies) {
      const token = cookies.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1];
      if (token) await db.deleteSession(token);
    }
    ctx.res.setHeader('Set-Cookie', `session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => ctx.user),

  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
    const users = await db.getAllSystemUsers();
    return users.map(({ passwordHash, ...u }) => u);
  }),

  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const existing = await db.getSystemUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'اسم المستخدم موجود مسبقاً' });

      const passwordHash = await bcrypt.hash(input.password, 10);
      const result = await db.createSystemUser({
        name: input.name,
        username: input.username,
        passwordHash,
        role: input.role,
        phone: input.phone,
        email: input.email,
      });
      return { success: true, userId: result.insertedId };
    }),

  update: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const { id, ...data } = input;
      await db.updateSystemUser(id, { ...data, updatedAt: new Date() });
      return { success: true };
    }),

  changePassword: publicProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: passwordSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await db.updateSystemUser(input.userId, { passwordHash, updatedAt: new Date() });
      return { success: true };
    }),

  changeMyPassword: publicProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: passwordSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      
      const user = await db.getSystemUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

      const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'كلمة المرور الحالية غير صحيحة',
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await db.updateSystemUser(ctx.user.id, { 
        passwordHash, 
        updatedAt: new Date() 
      });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      await db.deleteSystemUser(input.id);
      return { success: true };
    }),
});