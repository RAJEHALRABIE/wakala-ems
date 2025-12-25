import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// tRPC Logger Middleware
const loggerMiddleware = t.middleware(async (opts) => {
  const start = Date.now();
  const { path, type, input } = opts;

  // Log request
  console.log('[tRPC Request]', { 
    path, 
    type, 
    input: input ? JSON.stringify(input) : 'none',
    timestamp: new Date().toISOString()
  });

  const result = await opts.next();

  const duration = Date.now() - start;

  // Log response
  console.log('[tRPC Response]', { 
    path, 
    type, 
    duration: `${duration}ms`,
    ok: result.ok,
    error: !result.ok ? result.error : undefined,
    timestamp: new Date().toISOString()
  });

  return result;
});

// Apply logger middleware to all procedures
const loggedProcedure = t.procedure.use(loggerMiddleware);

export const router = t.router;
export const publicProcedure = loggedProcedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
