import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request } from "express";

// Server reads the same Supabase project the client uses. The client requires
// the `VITE_` prefix, so those keys are what live in `.env` — we accept either.
const url =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const anonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * When Supabase keys are missing the server runs WITHOUT auth (graceful
 * fallback for local dev / preview) — mirroring the client's behaviour in
 * `client/src/lib/supabase.ts`. In production both keys are set, so requests
 * are enforced.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!_client) {
    _client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

export type SupabaseUser = {
  id: string;
  email: string | null;
};

/** Extract the bearer token from an `Authorization: Bearer <jwt>` header. */
export function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}

/**
 * Verify the request's Supabase access token and return the user, or null if
 * the token is missing/invalid (or Supabase isn't configured). Validates the
 * JWT against the Supabase Auth server, so it works regardless of the project's
 * JWT signing algorithm.
 */
export async function verifyRequestUser(
  req: Request
): Promise<SupabaseUser | null> {
  const client = getClient();
  if (!client) return null;

  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch (err) {
    console.warn("[Auth] Supabase token verification failed:", String(err));
    return null;
  }
}
