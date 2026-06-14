import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyRequestUser, type SupabaseUser } from "./supabaseAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: SupabaseUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Authentication is optional for public procedures, so a missing/invalid
  // token simply yields a null user rather than throwing.
  const user = await verifyRequestUser(opts.req).catch(() => null);

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
