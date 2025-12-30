import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { logger } from "../logger";
import { TRPCError } from "@trpc/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";
import { createId } from "@paralleldrive/cuid2";

// تكوين WebAuthn
const rpID = "localhost"; // في الإنتاج: "yourdomain.com"
const origin = `http://${rpID}:5173`; // في الإنتاج: "https://yourdomain.com"

/**
 * router لـ WebAuthn (الدخول بالبصمة)
 */
export const webauthnRouter = router({
  // بدء تسجيل بصمة جديدة
  registrationStart: publicProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getSystemUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      }

      // الحصول على بيانات الاعتماد الحالية للمستخدم
      const existingCredentials = await db.getWebAuthnCredentialsByUserId(input.userId);

      const options = await generateRegistrationOptions({
        rpName: "نظام وكالة EMS",
        rpID,
        userID: user.id.toString(),
        userName: user.username,
        userDisplayName: user.name,
        attestationType: "none",
        excludeCredentials: existingCredentials.map((cred) => ({
          id: cred.id,
          type: "public-key" as const,
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform", // للأجهزة المحلية (بصمة، Face ID)
        },
      });

      // حفظ التحدي في قاعدة البيانات
      const challengeId = createId();
      await db.createWebAuthnChallenge({
        id: challengeId,
        userId: input.userId,
        challenge: options.challenge,
        type: "registration",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 دقائق
      });

      return {
        options,
        challengeId,
      };
    }),

  // إنهاء تسجيل بصمة جديدة
  registrationFinish: publicProcedure
    .input(z.object({
      userId: z.number(),
      challengeId: z.string(),
      credential: z.custom<RegistrationResponseJSON>(),
    }))
    .mutation(async ({ input }) => {
      // التحقق من وجود التحدي
      const challenge = await db.getWebAuthnChallenge(input.challengeId);
      if (!challenge || challenge.type !== "registration") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "التحدي غير صالح أو منتهي الصلاحية" });
      }

      // التحقق من أن التحدي للمستخدم الصحيح
      if (challenge.userId !== input.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "غير مصرح به" });
      }

      // التحقق من صلاحية التحدي
      if (new Date(challenge.expiresAt) < new Date()) {
        await db.deleteWebAuthnChallenge(input.challengeId);
        throw new TRPCError({ code: "BAD_REQUEST", message: "انتهت صلاحية التحدي" });
      }

      let verification;
      try {
        verification = await verifyRegistrationResponse({
          response: input.credential,
          expectedChallenge: challenge.challenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
        });
      } catch (error) {
        logger.error("[WebAuthn] Registration verification failed:", error);
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "فشل التحقق من بيانات الاعتماد" 
        });
      }

      const { verified, registrationInfo } = verification;

      if (!verified || !registrationInfo) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "فشل التحقق من بيانات الاعتماد" 
        });
      }

      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

      // حفظ بيانات الاعتماد في قاعدة البيانات
      await db.createWebAuthnCredential({
        id: Buffer.from(credentialID).toString("base64url"),
        userId: input.userId,
        publicKey: Buffer.from(credentialPublicKey).toString("base64"),
        counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: input.credential.response.transports 
          ? JSON.stringify(input.credential.response.transports)
          : null,
        createdAt: new Date(),
      });

      // حذف التحدي بعد الاستخدام
      await db.deleteWebAuthnChallenge(input.challengeId);

      return { success: true, message: "تم تسجيل البصمة بنجاح" };
    }),

  // بدء تسجيل الدخول بالبصمة
  authenticationStart: publicProcedure
    .input(z.object({
      username: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      let userId: number | undefined;

      if (input.username) {
        // إذا تم تقديم اسم المستخدم، البحث عن بيانات الاعتماد الخاصة به
        const user = await db.getSystemUserByUsername(input.username);
        if (user) {
          userId = user.id;
        }
      }

      let allowCredentials = [];
      if (userId) {
        // الحصول على بيانات الاعتماد للمستخدم المحدد
        const credentials = await db.getWebAuthnCredentialsByUserId(userId);
        allowCredentials = credentials.map((cred) => ({
          id: cred.id,
          type: "public-key" as const,
          transports: cred.transports ? JSON.parse(cred.transports) : undefined,
        }));
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: "preferred",
      });

      // حفظ التحدي في قاعدة البيانات
      const challengeId = createId();
      await db.createWebAuthnChallenge({
        id: challengeId,
        userId: userId || 0, // 0 يعني غير معروف
        challenge: options.challenge,
        type: "authentication",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 دقائق
      });

      return {
        options,
        challengeId,
      };
    }),

  // إنهاء تسجيل الدخول بالبصمة
  authenticationFinish: publicProcedure
    .input(z.object({
      challengeId: z.string(),
      credential: z.custom<AuthenticationResponseJSON>(),
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من وجود التحدي
      const challenge = await db.getWebAuthnChallenge(input.challengeId);
      if (!challenge || challenge.type !== "authentication") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "التحدي غير صالح أو منتهي الصلاحية" });
      }

      // التحقق من صلاحية التحدي
      if (new Date(challenge.expiresAt) < new Date()) {
        await db.deleteWebAuthnChallenge(input.challengeId);
        throw new TRPCError({ code: "BAD_REQUEST", message: "انتهت صلاحية التحدي" });
      }

      // البحث عن بيانات الاعتماد
      const credentialId = input.credential.id;
      const credential = await db.getWebAuthnCredentialById(credentialId);

      if (!credential) {
        throw new TRPCError({ code: "NOT_FOUND", message: "بيانات الاعتماد غير موجودة" });
      }

      // إذا كان التحدي لمستخدم غير معروف، تحديث userId
      if (challenge.userId === 0) {
        await db.deleteWebAuthnChallenge(input.challengeId);
        await db.createWebAuthnChallenge({
          id: input.challengeId,
          userId: credential.userId,
          challenge: challenge.challenge,
          type: "authentication",
          expiresAt: challenge.expiresAt,
        });
      }

      let verification;
      try {
        verification = await verifyAuthenticationResponse({
          response: input.credential,
          expectedChallenge: challenge.challenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          credential: {
            id: credential.id,
            publicKey: Buffer.from(credential.publicKey, "base64"),
            counter: credential.counter,
            transports: credential.transports ? JSON.parse(credential.transports) : [],
          },
        });
      } catch (error) {
        logger.error("[WebAuthn] Authentication verification failed:", error);
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "فشل التحقق من بيانات الاعتماد" 
        });
      }

      const { verified, authenticationInfo } = verification;

      if (!verified) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "فشل التحقق من البصمة" 
        });
      }

      // تحديث عداد بيانات الاعتماد
      await db.updateWebAuthnCredential(credentialId, {
        counter: authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      });

      // حذف التحدي بعد الاستخدام
      await db.deleteWebAuthnChallenge(input.challengeId);

      // إنشاء جلسة للمستخدم
      const user = await db.getSystemUserById(credential.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      }

      const token = (globalThis as any).crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.createSession({ id: token, userId: user.id, expiresAt });
      await db.updateSystemUser(user.id, { lastLoginAt: new Date() });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      };
    }),

  // الحصول على بيانات الاعتماد للمستخدم
  getCredentials: publicProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      const credentials = await db.getWebAuthnCredentialsByUserId(input.userId);
      return credentials.map((cred) => ({
        id: cred.id,
        deviceType: cred.deviceType,
        createdAt: cred.createdAt,
        lastUsedAt: cred.lastUsedAt,
        backedUp: cred.backedUp,
      }));
    }),

  // حذف بيانات الاعتماد
  deleteCredential: publicProcedure
    .input(z.object({
      credentialId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.deleteWebAuthnCredential(input.credentialId);
      return { success: true };
    }),

  // التحقق من دعم WebAuthn في المتصفح
  checkSupport: publicProcedure.query(() => {
    return {
      supported: typeof window !== "undefined" && 
                typeof window.PublicKeyCredential !== "undefined",
      platformAuthenticator: typeof window !== "undefined" && 
                            window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable 
                            ? true : false,
    };
  }),
});