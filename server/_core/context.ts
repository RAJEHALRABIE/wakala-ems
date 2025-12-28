import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { SystemUser } from "../../drizzle/schema-with-relations";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: Omit<SystemUser, 'passwordHash'> | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: Omit<SystemUser, 'passwordHash'> | null = null;

  try {
    const cookies = opts.req.headers.cookie;
    if (cookies) {
      const token = cookies.split(';').find(c => c.trim().startsWith('session_token='))?.split('=')[1];
      if (token) {
        const session = await db.getSession(token);
        if (session && session.expiresAt > new Date() && session.user) {
          const { passwordHash, ...safeUser } = session.user;
          user = safeUser;
        }
      }
    }
  } catch (error) {
    console.error('[Context] Auth error:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}