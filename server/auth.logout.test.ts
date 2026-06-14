import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: { id: "00000000-0000-0000-0000-000000000000", email: "sample@example.com" },
    req: { headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("reports success (Supabase sign-out happens client-side)", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
