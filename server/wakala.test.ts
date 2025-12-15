import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Auth Procedures", () => {
  it("verifies correct access code", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.verifyAccessCode({ code: "BAREQ2030" });
    expect(result.valid).toBe(true);
  });

  it("rejects incorrect access code", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.verifyAccessCode({ code: "WRONG" });
    expect(result.valid).toBe(false);
  });

  it("verifies correct master key", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.verifyMasterKey({ key: "RAJ0579" });
    expect(result.valid).toBe(true);
  });

  it("rejects incorrect master key", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.verifyMasterKey({ key: "WRONG" });
    expect(result.valid).toBe(false);
  });
});

describe("Dashboard Procedures", () => {
  it("returns dashboard stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("byStatus");
    expect(stats).toHaveProperty("totalArea");
    expect(stats).toHaveProperty("totalCompensation");
  });
});

describe("Agents Procedures", () => {
  it("lists agents", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const agents = await caller.agents.list();
    expect(Array.isArray(agents)).toBe(true);
  });
});

describe("Clients Procedures", () => {
  it("lists clients", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const clients = await caller.clients.list();
    expect(Array.isArray(clients)).toBe(true);
  });

  it("searches clients", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const results = await caller.clients.search({ query: "test" });
    expect(Array.isArray(results)).toBe(true);
  });
});

describe("Settings Procedures", () => {
  it("gets WhatsApp templates", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);
    
    const templates = await caller.settings.getWhatsAppTemplates();
    expect(templates).toHaveProperty("request");
    expect(templates).toHaveProperty("welcome");
    expect(templates).toHaveProperty("update");
    expect(templates).toHaveProperty("missing");
  });
});
